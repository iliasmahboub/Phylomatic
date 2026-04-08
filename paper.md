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

Phylomatic is an open-source pipeline that automates species identification
from Sanger sequencing data. Users provide a pair of forward and reverse `.ab1`
chromatogram files and receive a publication-ready phylogenetic tree without any
manual steps in between. The pipeline handles quality trimming, consensus
assembly, NCBI BLASTn homology search, reference sequence retrieval, Clustal
Omega multiple-sequence alignment, Neighbor-Joining tree construction
[@saitou_neighbor_1987], and interactive visualization.

The software is built as a web application with a Python/FastAPI backend and a
React/TypeScript frontend connected by WebSocket for real-time progress updates.
Each pipeline stage also works as a standalone command-line module, so
individual steps can be reused in scripted workflows.

# Statement of Need

Sanger sequencing remains the workhorse for bacterial and fungal species
identification in microbiology teaching labs and clinical settings. The typical
approach involves amplifying a marker gene such as the 16S ribosomal RNA gene
or the internal transcribed spacer (ITS) region, then sequencing it
[@clarridge_impact_2004; @schoch_nuclear_2012]. What follows is a manual,
multi-tool workflow: inspect chromatograms in FinchTV or Chromas, trim
low-quality bases by hand, paste the sequence into NCBI BLAST
[@altschul_basic_1990], copy accession numbers from the results, fetch
references one by one through Entrez [@sayers_database_2022], align everything
in Clustal Omega [@sievers_fast_2011], build a tree in MEGA
[@tamura_mega11_2021], and annotate it for publication.

Each transition between tools means format conversions, manual copy-paste, and
repeated polling of web services. For a single sample this is slow but
manageable. For classroom settings where every student runs the same workflow
independently, it produces a steady stream of troubleshooting requests around
timeouts, file formats, and software incompatibilities.

Phylomatic removes these manual handoffs by chaining all six stages into one
automated pipeline. The web interface asks for two inputs (a pair of `.ab1`
files and an email address for NCBI API access) and delivers results in
minutes.

# State of the Field

Several tools address parts of this workflow but none cover the full path from
raw chromatograms to an annotated tree in a single step. Galaxy
[@afgan_galaxy_2018] can chain bioinformatics tools into pipelines, but
requires server deployment, workflow configuration, and familiarity with its
interface. QIIME 2 [@bolyen_reproducible_2019] targets high-throughput amplicon
survey data from Illumina runs, not the single-isolate Sanger identification
that most undergraduate labs perform. MEGA [@tamura_mega11_2021] handles
alignment and tree construction well but does not read `.ab1` files directly or
run BLAST searches. Tools like FinchTV and Chromas are limited to chromatogram
viewing and basic trimming.

Phylomatic fills this gap. It accepts raw `.ab1` input, handles all external
API interactions (NCBI BLAST, NCBI Entrez, EBI Clustal Omega), and produces a
zoomable, exportable tree in the browser. Because each module is independently
importable and testable, researchers who need only part of the pipeline (for
instance, just the BLAST-to-tree portion) can use those modules on their own.

# Software Design

The backend consists of six Python modules in `backend/app/pipeline/`, each
responsible for one stage of the workflow.

The **assembly** module reads `.ab1` chromatograms through BioPython
[@cock_biopython_2009], trims low-quality bases from both ends at a PHRED score
threshold of 20, reverse-complements the reverse read, and builds a consensus
by choosing the higher-quality base at each position.

The **BLAST** module submits the consensus to the NCBI BLAST URL API. It
supports several databases (16S rRNA, ITS, full nucleotide collection, RefSeq
RNA), handles polling with exponential back-off and a hard timeout, and parses
the XML response into structured hit objects.

The **Entrez** module fetches FASTA reference sequences for the top BLAST hits
through NCBI E-utilities, batching requests and retrying with back-off to
respect NCBI rate limits.

The **alignment** module sends the consensus plus all reference sequences to
the EBI Clustal Omega REST API [@sievers_fast_2011] for multiple-sequence
alignment.

The **tree** module computes a pairwise identity distance matrix and builds a
Neighbor-Joining tree [@saitou_neighbor_1987] using BioPython's
`DistanceTreeConstructor`, writing the result in Newick format.

The **visualization** module renders the tree as an annotated SVG using
Matplotlib [@hunter_matplotlib_2007], with the query node highlighted for
identification.

All external HTTP communication is asynchronous via `httpx`. The FastAPI layer
exposes a WebSocket endpoint that streams stage updates to the React frontend
in real time. The frontend provides drag-and-drop upload, a live progress
tracker, an interactive tree viewer with zoom and pan, a sortable BLAST hit
table, and export to Newick, SVG, or PNG.

An optional seventh module translates the consensus DNA to protein and predicts
a 3D structure through the ESMFold API [@lin_evolutionary_2023].

# Research Impact

Phylomatic was designed for two audiences: undergraduate microbiology courses
where students identify bacterial isolates as part of laboratory exercises, and
small research labs that perform routine Sanger-based species identification
but lack the bioinformatics infrastructure for a fully automated workflow. By
collapsing a multi-tool, multi-hour process into a single browser interaction,
Phylomatic makes phylogenetic analysis accessible to users who may not have
command-line experience.

# AI Usage Disclosure

GitHub Copilot and Claude were used for code autocompletion and initial
drafting during development. All generated code was reviewed, tested, and
validated by the author. The scientific content, architecture decisions, and
research framing are entirely the author's work.

# Acknowledgements

The author thanks the NCBI, EBI, and the BioPython community for maintaining
the public APIs and libraries that Phylomatic depends on.

# References
