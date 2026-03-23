"""Tests for the BLAST module."""

import pytest
from unittest.mock import patch

from app.pipeline.blast import _parse_blast_xml, blast_search

SAMPLE_BLAST_XML = """<?xml version="1.0"?>
<BlastOutput>
  <BlastOutput_iterations>
    <Iteration>
      <Iteration_hits>
        <Hit>
          <Hit_num>1</Hit_num>
          <Hit_id>gi|123</Hit_id>
          <Hit_def>Escherichia coli strain K-12 16S ribosomal RNA</Hit_def>
          <Hit_accession>NR_024570</Hit_accession>
          <Hit_len>1542</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_identity>238</Hsp_identity>
              <Hsp_align-len>240</Hsp_align-len>
              <Hsp_evalue>1e-120</Hsp_evalue>
              <Hsp_query-from>1</Hsp_query-from>
              <Hsp_query-to>240</Hsp_query-to>
            </Hsp>
          </Hit_hsps>
        </Hit>
        <Hit>
          <Hit_num>2</Hit_num>
          <Hit_id>gi|456</Hit_id>
          <Hit_def>Salmonella enterica 16S ribosomal RNA</Hit_def>
          <Hit_accession>NR_074799</Hit_accession>
          <Hit_len>1530</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_identity>230</Hsp_identity>
              <Hsp_align-len>240</Hsp_align-len>
              <Hsp_evalue>5e-110</Hsp_evalue>
              <Hsp_query-from>1</Hsp_query-from>
              <Hsp_query-to>240</Hsp_query-to>
            </Hsp>
          </Hit_hsps>
        </Hit>
        <Hit>
          <Hit_num>3</Hit_num>
          <Hit_id>gi|789</Hit_id>
          <Hit_def>Klebsiella pneumoniae 16S ribosomal RNA</Hit_def>
          <Hit_accession>NR_036794</Hit_accession>
          <Hit_len>1538</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_identity>225</Hsp_identity>
              <Hsp_align-len>240</Hsp_align-len>
              <Hsp_evalue>2e-105</Hsp_evalue>
              <Hsp_query-from>1</Hsp_query-from>
              <Hsp_query-to>238</Hsp_query-to>
            </Hsp>
          </Hit_hsps>
        </Hit>
      </Iteration_hits>
    </Iteration>
  </BlastOutput_iterations>
</BlastOutput>"""


class TestParseBlastXml:
    def test_parses_correct_number_of_hits(self) -> None:
        hits = _parse_blast_xml(SAMPLE_BLAST_XML, query_length=240)
        assert len(hits) == 3

    def test_first_hit_fields(self) -> None:
        hits = _parse_blast_xml(SAMPLE_BLAST_XML, query_length=240)
        first = hits[0]
        assert first.accession == "NR_024570"
        assert "Escherichia coli" in first.description
        assert first.identity_pct == pytest.approx(99.17, abs=0.1)
        assert first.coverage_pct == 100.0
        assert first.e_value == 1e-120

    def test_identity_percentage_calculation(self) -> None:
        hits = _parse_blast_xml(SAMPLE_BLAST_XML, query_length=240)
        # Hit 2: 230/240 = 95.83%
        assert hits[1].identity_pct == pytest.approx(95.83, abs=0.1)

    def test_empty_xml(self) -> None:
        xml = """<?xml version="1.0"?>
        <BlastOutput>
          <BlastOutput_iterations>
            <Iteration>
              <Iteration_hits></Iteration_hits>
            </Iteration>
          </BlastOutput_iterations>
        </BlastOutput>"""
        hits = _parse_blast_xml(xml, query_length=240)
        assert hits == []


class TestBlastSearch:
    @pytest.mark.asyncio
    async def test_missing_email_raises(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(ValueError, match="NCBI_EMAIL"):
                await blast_search(">test\nATCG")
