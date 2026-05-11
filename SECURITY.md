# Security Policy

Phylomatic processes user-supplied sequence files and calls public scientific
web services. Treat uploaded chromatograms as untrusted input.

## Reporting

Report security issues privately by emailing im132@duke.edu. Include the
affected version, reproduction steps, and any relevant logs.

## Scope

Security reports may include:

- Unsafe handling of uploaded `.ab1` files
- Path traversal or file overwrite risks
- Exposure of API credentials or submitter email addresses
- Cross-site scripting in rendered sequence, hit, or tree labels
- Denial-of-service issues from malformed input files

Public API availability issues at NCBI, EBI, or ESMFold should be reported to
those services rather than this project.
