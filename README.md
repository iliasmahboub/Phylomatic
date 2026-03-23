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

## Why this exists

If you've done 16S identification from Sanger reads, you know the workflow: open your `.ab1` files in FinchTV, manually trim the low-quality ends, copy the sequence into BLAST, wait, copy the accession numbers, fetch references from Entrez one by one, paste everything into Clustal Omega, wait again, download the alignment, load it into MEGA, build a tree, export it, annotate it in Illustrator.

For one sample, it's tedious. For twenty, it's a full afternoon. For a course where every student needs to do it, it's a guaranteed stream of "my BLAST timed out" and "MEGA won't open the file" emails.

I built Phylomatic because I got tired of doing the same six manual steps every time I needed to identify a bacterial isolate. The entire pipeline, from raw chromatograms to a publication-ready phylogenetic tree, runs in a single click.

---

## What it does

```
.ab1 reads ──> Consensus ──> BLASTn ──> References ──> MSA ──> NJ Tree ──> SVG
  (2 files)      FASTA        NCBI       Entrez       Clustal   BioPython   Annotated
```

1. **Assembly** - Reads forward and reverse `.ab1` chromatograms, quality-trims both ends at PHRED < 20, reverse-complements the reverse read, and builds a consensus sequence by taking the higher-quality base at each position.

2. **BLAST** - Submits the consensus to NCBI BLASTn. Supports multiple databases: 16S ribosomal RNA (filtered via Entrez query for proper species-level hits), the full nucleotide collection, RefSeq RNA, or ITS for fungal work. Returns the top 15 hits with identity, coverage, and E-values.

3. **Reference Fetch** - Pulls FASTA sequences for the top hits via NCBI Entrez E-utilities. Filters out uncultured/environmental sequences automatically so the tree contains real species names, not "Uncultured bacterium clone."

4. **Alignment** - Submits the consensus plus references to the EBI Clustal Omega REST API for multiple sequence alignment.

5. **Tree Construction** - Builds a Neighbor-Joining tree from the alignment distance matrix using BioPython. Labels use genus + species names extracted from BLAST hit descriptions.

6. **Visualization** - Renders the tree as an annotated SVG with the query sequence highlighted. Zoomable and pannable in the browser, exportable as SVG, PNG (2x), or Newick.

---

## Quick Start

```bash
git clone https://github.com/iliasmahboub/Phylomatic.git
cd Phylomatic

pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

npm run dev
```

Open **http://localhost:5173**, drop your `.ab1` files, and click **Run pipeline**. The app asks for your email at runtime (NCBI requires one for API access, no signup needed). The whole process takes 2-5 minutes depending on NCBI/EBI response times.

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

Each pipeline stage is an independent module in `backend/app/pipeline/`, importable and runnable without the web layer. The frontend connects over WebSocket for real-time progress updates.

---

## Running modules standalone

Each step works independently from the command line:

```bash
cd backend

python -m app.pipeline.assembly fwd.ab1 rev.ab1
python -m app.pipeline.blast consensus.fasta
python -m app.pipeline.entrez ACC1 ACC2 ACC3
python -m app.pipeline.alignment refs.fasta
python -m app.pipeline.tree aligned.fasta
python -m app.pipeline.visualize tree.nwk
```

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, BioPython, httpx, asyncio |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| External APIs | NCBI BLAST URL API, NCBI Entrez E-utilities, EBI Clustal Omega REST |
| Testing | pytest, pytest-asyncio, pytest-httpx |

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/run` | Upload `.ab1` files, start pipeline |
| `GET` | `/api/status/{job_id}` | Current stage and progress |
| `GET` | `/api/results/{job_id}` | Full results (hits, SVG, Newick) |
| `WS` | `/ws/{job_id}` | Real-time stage updates |
| `DELETE` | `/api/job/{job_id}` | Clean up job data |

---

## Testing

```bash
cd backend
pytest tests/ -v
```

Unit tests cover assembly, BLAST XML parsing, and tree construction. All external API calls are mocked.

---

## Docker

```bash
docker compose up
```

---

## Citation

If you use Phylomatic in your research, please cite:

```
Mahboub, I. (2026). Phylomatic: Automated phylogenetic inference from Sanger
sequencing data. https://github.com/iliasmahboub/Phylomatic
```

---

## License

MIT

---

<div align="center">

**Ilias Mahboub**

Molecular Biosciences, Duke University / Duke Kunshan University

Research Trainee @ Dzirasa Lab (Duke SM) · Yuan Lab (SJTU-SM) · Remy Lab

im132@duke.edu

</div>
