# Contributing

Phylomatic welcomes bug reports, documentation fixes, tests, and focused feature
work that improves the Sanger-to-tree workflow.

## Development setup

Use a virtual environment so test runs do not inherit unrelated pytest plugins
from a global Python installation.

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r backend/requirements.txt
cd frontend
npm ci
cd ..
```

On macOS or Linux, activate the virtual environment with:

```bash
source .venv/bin/activate
```

## Checks

Run the backend checks before opening a pull request:

```bash
ruff check backend tools
black --check backend tools
python tools/run_backend_tests.py
```

Run the frontend build check with:

```bash
npm --prefix frontend run build
```

## Pull requests

Keep pull requests focused on one behavior change or documentation improvement.
Include tests for new backend behavior and update the README or docs when a
user-facing workflow changes.

## External services

The production pipeline calls NCBI BLAST, NCBI Entrez, EBI Clustal Omega, and
optionally ESMFold. Unit tests should mock those services. Integration tests
that call public APIs must be documented clearly and should not run in default
CI.
