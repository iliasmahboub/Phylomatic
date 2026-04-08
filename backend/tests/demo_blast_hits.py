"""Demo script: show top 3 BLAST hits from sample XML."""

from app.pipeline.blast import _parse_blast_xml
from pathlib import Path


def main() -> None:
    """Parse and print the top 3 hits from the sample BLAST XML."""
    sample_xml = (
        Path(__file__).parent / "sample_data" / "blast_sample.xml"
    ).read_text()
    hits = _parse_blast_xml(sample_xml, 240)
    print("Top 3 BLAST hits:")
    for i, h in enumerate(hits[:3], 1):
        print(
            f"{i}. {h.accession} | {h.description} | "
            f"Identity: {h.identity_pct}% | Coverage: {h.coverage_pct}% | "
            f"E-value: {h.e_value}"
        )


if __name__ == "__main__":
    main()
