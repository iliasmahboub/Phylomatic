import { useState, useRef, useCallback } from "react";
import type { PipelineStage, StageEvent, PipelineResult } from "../types";
import { startPipeline, getResults } from "../api/pipeline";

interface PipelineState {
  stage: PipelineStage | null;
  progress: number;
  message: string;
  results: PipelineResult | null;
  error: string | null;
  status: "idle" | "running" | "complete" | "error";
}

export function usePipeline() {
  const [state, setState] = useState<PipelineState>({
    stage: null,
    progress: 0,
    message: "",
    results: null,
    error: null,
    status: "idle",
  });

  const wsRef = useRef<WebSocket | null>(null);

  const run = useCallback(async (fwd: File, rev: File, email: string, blastDb: string = "16S_ribosomal_RNA") => {
    setState((s) => ({ ...s, status: "running", error: null }));

    try {
      const { job_id } = await startPipeline(fwd, rev, email, blastDb);

      const wsBase = import.meta.env.DEV
        ? "ws://localhost:8000"
        : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
      const ws = new WebSocket(`${wsBase}/ws/${job_id}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data: StageEvent = JSON.parse(event.data);
        setState((s) => ({
          ...s,
          stage: data.stage,
          progress: data.progress,
          message: data.message,
        }));

        if (data.stage === "complete") {
          getResults(job_id).then((results) => {
            setState((s) => ({ ...s, status: "complete", results }));
          });
          ws.close();
        } else if (data.stage === "error") {
          setState((s) => ({ ...s, status: "error", error: data.message }));
          ws.close();
        }
      };

      ws.onerror = () => {
        setState((s) => ({ ...s, status: "error", error: "WebSocket connection failed" }));
      };
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    wsRef.current?.close();
    setState({
      stage: null,
      progress: 0,
      message: "",
      results: null,
      error: null,
      status: "idle",
    });
  }, []);

  return { ...state, run, reset };
}
