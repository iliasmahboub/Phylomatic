---
title: "Phylomatic: automated phylogenetic inference from Sanger sequencing chromatograms"
tags:
  - Python
  - bioinformatics
  - phylogenetics
  - Sanger sequencing
  - BLAST
  - multiple sequence alignment
authors:
  - name: Ilias Mahboub
    orcid: 0009-0003-4518-6953
    affiliation: 1
affiliations:
  - name: Department of Molecular Biosciences, Duke University / Duke Kunshan University, USA
    index: 1
date: 7 April 2026
bibliography: paper.bib
---

# Summary

Phylomatic is an open-source pipeline that automates the complete workflow of
species identification from Sanger sequencing data.  Given a pair of forward
and reverse `.ab1` chromatogram files, Phylomatic performs quality trimming,
consensus assembly, NCBI BLASTn homology search, reference sequence retrieval,
Clustal Omega multiple-sequence alignment, Neighbor-Joining tree construction,
and interactive visualization — producing a publication-ready annotated
phylogenetic tree with no manual intervention.

The tool is implemented as a full-stack web application with a Python/FastAPI
backend and a React/TypeScript frontend, connected by WebSocket for real-time
progress reporting.  Each pipeline stage is also independently usable from the
command line, making individual modules reusable in scripted workflows.

# Statement of Need

Sanger sequencing remains the standard method for bacterial and fungal species
identification in microbiology teaching and clinical laboratories, typically
through amplification and sequencing of marker genes such as the 16S ribosomal
RNA gene or the internal transcribed spacer (ITS) region
[@clarridge_impact_2004; @schoch_nuclear_2012].  The conventional workflow
requires researchers to manually execute a series of steps using multiple
disconnected tools: inspecting chromatograms in FinchTV or Chromas, trimming
low-quality bases, submitting sequences to NCBI BLAST [@altschul_basic_1990],
retrieving reference sequences through Entrez [@sayers_database_2022],
performing alignment with Clustal Omega [@sievers_fast_2011], constructing
phylogenetic trees in MEGA [@tamura_mega11_2021] or similar software, and
finally annotating the tree for publication.

Each transition between tools introduces friction: format conversions, manual
copy-paste of sequences and accession numbers, and repeated polling of web
services.  For a single sample this is tedious; for classroom settings where
every student must complete the workflow independently, it generates a
predictable stream of troubleshooting requests.

Phylomatic eliminates these manual handoffs by chaining all six stages into a
single automated pipeline.  Its web interface requires only two inputs — a
pair of `.ab1` files and an email address for NCBI API access — and delivers
results in minutes.  Unlike Galaxy-based pipelines [@afgan_galaxy_2018] that
require server deployment and workflow configuration, or command-line tools
like QIIME 2 [@bolyen_reproducible_2019] designed for amplicon survey data,
Phylomatic is purpose-built for the single-isolate Sanger identification use
case that most undergraduate microbiology labs actually perform.

# Implementation

Phylomatic's backend consists of six Python modules, each implementing one
pipeline stage:

- **Assembly** (`assembly.py`): reads `.ab1` chromatograms via BioPython
  [@cock_biopython_2009], quality-trims both ends at a PHRED score threshold
  of 20, reverse-complements the reverse read, and generates a consensus
  sequence by selecting the higher-quality base at each aligned position.

- **BLAST** (`blast.py`): submits the consensus to the NCBI BLAST URL API with
  configurable database selection (16S rRNA, ITS, full nucleotide, RefSeq RNA),
  polls for results with exponential back-off, and parses the XML response into
  structured hit objects.

- **Entrez** (`entrez.py`): retrieves FASTA reference sequences for top BLAST
  hits via NCBI E-utilities, fetching in batches to respect rate limits.

- **Alignment** (`alignment.py`): submits the consensus plus reference
  sequences to the EBI Clustal Omega REST API for multiple-sequence alignment.

- **Tree** (`tree.py`): computes a pairwise identity distance matrix and
  constructs a Neighbor-Joining tree using BioPython's
  `DistanceTreeConstructor`, outputting Newick format.

- **Visualization** (`visualize.py`): renders the tree as an annotated SVG
  with the query sequence highlighted in a distinct color, using Matplotlib's
  SVG backend.

All external service communication uses asynchronous HTTP via `httpx`, and the
FastAPI layer exposes a WebSocket endpoint that streams stage-update events to
the React frontend in real time.  The frontend provides drag-and-drop file
upload, a live progress tracker, an interactive zoomable tree viewer, a
sortable BLAST results table, and export to Newick, SVG, or PNG formats.

An optional seventh module (`structure.py`) translates the consensus DNA to
protein and predicts a 3D structure via the ESMFold API [@lin_evolutionary_2023],
viewable in a 3D viewer.

# Availability

Phylomatic is available under the MIT license at
[https://github.com/iliasmahboub/Phylomatic](https://github.com/iliasmahboub/Phylomatic).
Documentation, installation instructions, and test data are included in the
repository.

# References
