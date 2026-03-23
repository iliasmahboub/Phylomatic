"""Demo script: show top 3 BLAST hits from sample XML."""

from app.pipeline.blast import _parse_blast_xml
from pathlib import Path

SAMPLE_XML = (Path(__file__).parent / "sample_data" / "blast_sample.xml").read_text()

hits = _parse_blast_xml(SAMPLE_XML, 240)
print("Top 3 BLAST hits:")
for i, h in enumerate(hits[:3], 1):
    print(
        f"{i}. {h.accession} | {h.description} | "
        f"Identity: {h.identity_pct}% | Coverage: {h.coverage_pct}% | "
        f"E-value: {h.e_value}"
    )
