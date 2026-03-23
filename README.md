# Phylomatic

> Full-stack phylogenetic inference pipeline. Quality-trimmed consensus assembly from .ab1 chromatograms, automated NCBI BLASTn + Entrez fetch, Clustal Omega alignment, NJ/ML tree construction, and interactive tree visualization.

## Pipeline

```
.ab1 files → Consensus FASTA → BLASTn → Reference FASTAs → MSA → NJ Tree → SVG
```

## Quick Start

```bash
git clone https://github.com/iliasmahboub/Phylomatic.git
cd Phylomatic
export NCBI_EMAIL=your@email.com
pip install -r backend/requirements.txt
```

## Running Pipeline Modules

```bash
cd backend

# Assembly: .ab1 → consensus FASTA
python -m app.pipeline.assembly fwd.ab1 rev.ab1

# BLAST: consensus → top hits
python -m app.pipeline.blast consensus.fasta

# Entrez: fetch reference sequences
python -m app.pipeline.entrez ACC1 ACC2 ACC3

# Alignment: multi-FASTA → aligned FASTA
python -m app.pipeline.alignment refs.fasta

# Tree: aligned FASTA → Newick
python -m app.pipeline.tree aligned.fasta

# Visualization: Newick → SVG
python -m app.pipeline.visualize tree.nwk
```

## Testing

```bash
cd backend
pytest tests/ -v
```

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, BioPython, asyncio |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| External APIs | NCBI BLAST URL API, NCBI Entrez, EBI Clustal Omega REST |
| Testing | pytest, pytest-asyncio |

## How It Works

1. **Assembly** - Reads raw Sanger sequencing chromatograms (.ab1 files), trims low-quality ends (PHRED < 20), reverse-complements the reverse read, and builds a consensus sequence by picking the higher-quality base at each position.
2. **BLAST Search** - Submits the consensus to NCBI BLASTn against the nucleotide database to identify the closest matching species.
3. **Reference Fetch** - Downloads full FASTA sequences for the top BLAST hits from NCBI Entrez.
4. **Multiple Sequence Alignment** - Aligns the consensus with reference sequences using EBI's Clustal Omega service.
5. **Tree Construction** - Builds a Neighbor-Joining phylogenetic tree from the alignment using BioPython.
6. **Visualization** - Renders the tree as an annotated SVG with the query sequence highlighted.

## Environment Variables

| Variable | Description |
|---|---|
| `NCBI_EMAIL` | Your email for NCBI API access (required) |
| `FRONTEND_URL` | Frontend URL for CORS (default: `http://localhost:5173`) |
