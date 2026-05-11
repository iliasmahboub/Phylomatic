# Offline Demo

This demo gives reviewers a deterministic, offline path through the downstream
parts of the Phylomatic workflow. It uses small FASTA fixtures rather than raw
chromatograms or public web-service calls.

## Inputs

- `docs/examples/demo_consensus.fasta`: query consensus sequence
- `docs/examples/demo_references.fasta`: three reference sequences
- `docs/examples/demo_aligned.fasta`: expected multiple sequence alignment
- `docs/examples/demo_expected_tree.nwk`: expected Neighbor-Joining output

## Run the tree builder

From the repository root:

```bash
$env:PYTHONPATH = "backend"  # PowerShell
python -m app.pipeline.tree docs/examples/demo_aligned.fasta
```

On macOS or Linux, use `export PYTHONPATH=backend` instead. The output should
match `docs/examples/demo_expected_tree.nwk` and contain `Query`, `AB001`,
`AB002`, and `AB003`.

## Run the test-backed path

The same fixtures are represented in `backend/tests/sample_data/` and exercised
by the backend unit tests:

```bash
python tools/run_backend_tests.py backend/tests/test_tree.py -q
```

The full pipeline still requires external APIs for BLAST, Entrez, and Clustal
Omega. Those network stages are mocked in the default test suite so reviewers
can verify behavior without public-service availability changing the outcome.
