"""FastAPI app, CORS, route registration."""

from __future__ import annotations

import asyncio
import os
import time
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.jobs import jobs, create_job, run_pipeline, PipelineStage
from app.models import PipelineResult

app = FastAPI(title="Phylomatic", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/run")
async def run_pipeline(
    fwd: UploadFile = File(...),
    rev: UploadFile = File(...),
    ncbi_email: str = Form(...),
) -> dict[str, str]:
    tmp = tempfile.mkdtemp()
    fwd_path = str(Path(tmp) / fwd.filename)
    rev_path = str(Path(tmp) / rev.filename)

    with open(fwd_path, "wb") as f:
        f.write(await fwd.read())
    with open(rev_path, "wb") as f:
        f.write(await rev.read())

    job = create_job(fwd_path, rev_path, ncbi_email)
    asyncio.create_task(run_pipeline(job))
    return {"job_id": job.job_id}


@app.get("/api/status/{job_id}")
async def get_status(job_id: str) -> dict:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "stage": job.stage,
        "progress": job.progress,
        "message": job.message,
        "elapsed_seconds": round(time.time() - job.start_time, 1),
    }


@app.get("/api/results/{job_id}")
async def get_results(job_id: str) -> PipelineResult:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.stage != PipelineStage.COMPLETE:
        raise HTTPException(400, "Pipeline not complete")
    return PipelineResult(**job.result)


@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()
    job = jobs.get(job_id)
    if not job:
        await websocket.close(code=4004)
        return

    try:
        while job.stage not in (PipelineStage.COMPLETE, PipelineStage.ERROR):
            await websocket.send_json({
                "stage": job.stage,
                "status": "running",
                "message": job.message,
                "progress": job.progress,
                "elapsed_seconds": round(time.time() - job.start_time, 1),
            })
            await asyncio.sleep(1)

        await websocket.send_json({
            "stage": job.stage,
            "status": "complete" if job.stage == PipelineStage.COMPLETE else "error",
            "message": job.message,
            "progress": 100 if job.stage == PipelineStage.COMPLETE else job.progress,
            "elapsed_seconds": round(time.time() - job.start_time, 1),
        })
        await websocket.close()
    except WebSocketDisconnect:
        pass


@app.delete("/api/job/{job_id}")
async def delete_job(job_id: str) -> dict[str, str]:
    if job_id in jobs:
        del jobs[job_id]
    return {"status": "deleted"}
