# JOSS Reviewer Checklist

This checklist maps repository materials to common JOSS review questions.

## Installation

- Python backend metadata: `pyproject.toml`
- Backend dependency entry point: `backend/requirements.txt`
- Frontend locked dependencies: `frontend/package-lock.json`
- Docker path: `docker-compose.yml`
- Environment template: `.env.example`

## Tests

- Deterministic backend test runner: `tools/run_backend_tests.py`
- Backend CI: `.github/workflows/ci.yml`
- Frontend build CI: `.github/workflows/ci.yml`

## Documentation

- Main user guide: `README.md`
- Offline reviewer demo: `docs/demo.md`
- API route summary: `README.md`
- Contribution guide: `CONTRIBUTING.md`
- Support policy: `SUPPORT.md`
- Security policy: `SECURITY.md`

## Scholarly Metadata

- JOSS paper: `paper.md`
- Bibliography: `paper.bib`
- Citation metadata: `CITATION.cff`
- License: `LICENSE`

## Known Remaining Publication Work

- Keep public development active until the repository has more than six months
  of public, iterative history.
- Add real-world adoption evidence to the research impact statement as it
  becomes available.
- Archive a reviewed release and add the DOI to `CITATION.cff` before final
  acceptance.
