<div align="center">

# Phylomatic

**Automated phylogenetic inference from Sanger sequencing data.**

Drop in raw `.ab1` chromatograms. Get back a publication-ready phylogenetic tree.

[![CI](https://github.com/iliasmahboub/Phylomatic/actions/workflows/ci.yml/badge.svg)](https://github.com/iliasmahboub/Phylomatic/actions)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/react-18-61dafb.svg)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## How It Works

```
.ab1 reads ─→ Consensus ─→ BLASTn ─→ References ─→ MSA ─→ NJ Tree ─→ SVG
   (2 files)     FASTA      NCBI       Entrez      Clustal   BioPython   Annotated
```

1. **Assembly** — Reads forward + reverse `.ab1` chromatograms, trims low-quality ends (PHRED < 20), reverse-complements the reverse read, and builds a consensus sequence.

2. **BLAST** — Submits the consensus to NCBI BLASTn against the nucleotide database. Returns the top species matches with identity and coverage scores.

3. **Reference Fetch** — Downloads full FASTA sequences for the top hits via NCBI Entrez.

4. **Alignment** — Aligns the consensus with references using the EBI Clustal Omega REST API.

5. **Tree Construction** — Builds a Neighbor-Joining phylogenetic tree from the alignment using BioPython's distance matrix calculator.

6. **Visualization** — Renders the tree as an annotated SVG with the query sequence highlighted in teal.

---

## Quick Start

```bash
git clone https://github.com/iliasmahboub/Phylomatic.git
cd Phylomatic

# Install dependencies
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# Set your NCBI email (no API key needed)
echo "NCBI_EMAIL=your@email.com" > .env
echo "FRONTEND_URL=http://localhost:5173" >> .env

# Run everything
npm run dev
```

Open **http://localhost:5173**, drop your `.ab1` files, and click Run.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript + Vite + Tailwind)     │
│  :5173                                                  │
│  ┌──────────┐ ┌──────────────┐ ┌───────────────┐       │
│  │ DropZone │ │ PipelineTrack│ │ PhyloTree     │       │
│  │          │ │              │ │ (zoom/pan SVG)│       │
│  └──────────┘ └──────────────┘ └───────────────┘       │
│  ┌──────────────┐ ┌───────────┐ ┌──────────────┐       │
│  │ BlastResults  │ │ SeqViewer │ │ ExportPanel  │       │
│  └──────────────┘ └───────────┘ └──────────────┘       │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────┴────────────────────────────────┐
│  Backend (FastAPI + BioPython + asyncio)                 │
│  :8000                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ assembly │→│  blast   │→│  entrez  │→│alignment │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐                              │
│  │   tree   │→│visualize │                              │
│  └──────────┘ └──────────┘                              │
└─────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   NCBI BLASTn    NCBI Entrez    EBI Clustal Omega
   (URL API)      (E-utilities)  (REST API)
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/run` | Upload `.ab1` files, start pipeline |
| `GET` | `/api/status/{job_id}` | Current stage + progress |
| `GET` | `/api/results/{job_id}` | Full results (hits, SVG, Newick) |
| `WS` | `/ws/{job_id}` | Real-time stage updates |
| `DELETE` | `/api/job/{job_id}` | Clean up job |

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, BioPython, httpx, asyncio |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| External APIs | NCBI BLAST URL API, NCBI Entrez E-utilities, EBI Clustal Omega REST |
| Testing | pytest, pytest-asyncio, pytest-httpx |
| DevOps | Docker, Docker Compose, GitHub Actions CI |

---

## Running Pipeline Modules Standalone

Each module is independently executable:

```bash
cd backend

python -m app.pipeline.assembly fwd.ab1 rev.ab1        # → consensus FASTA
python -m app.pipeline.blast consensus.fasta            # → top 10 hits
python -m app.pipeline.entrez ACC1 ACC2 ACC3            # → reference FASTAs
python -m app.pipeline.alignment refs.fasta             # → aligned FASTA
python -m app.pipeline.tree aligned.fasta               # → Newick string
python -m app.pipeline.visualize tree.nwk               # → tree.svg
```

---

## Testing

```bash
cd backend
pytest tests/ -v
```

19 unit tests covering assembly, BLAST parsing, and tree construction. External API calls are mocked in unit tests.

---

## Docker

```bash
docker compose up
```

Starts both backend (:8000) and frontend (:5173).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NCBI_EMAIL` | Yes | Your email for NCBI API access (no signup) |
| `FRONTEND_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |

---

## License

MIT
