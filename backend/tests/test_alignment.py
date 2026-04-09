"""Unit tests for the alignment module."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.pipeline.alignment import align_sequences

ALIGNED_FASTA = """>Query
ATGAAAGCTAGCTTGCAG--ATTCAGTCG
>Ecoli_K12
ATGAAAGCTAGCTTGCAGTTATTCAGTCG
>Salmonella_LT2
ATGAAAGCTAGCTTGCAG--ATTCAGTCG
"""


def _mock_response(text: str, status_code: int = 200) -> httpx.Response:
    request = httpx.Request("GET", "https://example.com")
    return httpx.Response(status_code=status_code, text=text, request=request)


def _mock_post_response(text: str, status_code: int = 200) -> httpx.Response:
    request = httpx.Request("POST", "https://example.com")
    return httpx.Response(status_code=status_code, text=text, request=request)


class TestAlignSequences:
    @pytest.fixture(autouse=True)
    def _set_email(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("NCBI_EMAIL", "test@example.com")

    @pytest.mark.asyncio
    async def test_successful_alignment(self) -> None:
        """Verify full submit-poll-fetch cycle returns aligned FASTA."""
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(
            return_value=_mock_post_response("clustalo-R20240101-123456")
        )
        mock_client.get = AsyncMock(
            side_effect=[
                _mock_response("RUNNING"),
                _mock_response("FINISHED"),
                _mock_response(ALIGNED_FASTA),
            ]
        )
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        sequences = {
            "Query": "ATGAAAGCTAGCTTGCAGATTCAGTCG",
            "Ecoli_K12": "ATGAAAGCTAGCTTGCAGTTATTCAGTCG",
            "Salmonella_LT2": "ATGAAAGCTAGCTTGCAGATTCAGTCG",
        }

        with patch(
            "app.pipeline.alignment.httpx.AsyncClient", return_value=mock_client
        ):
            with patch("app.pipeline.alignment.asyncio.sleep", new_callable=AsyncMock):
                result = await align_sequences(sequences)

        assert ">Query" in result
        assert ">Ecoli_K12" in result

    @pytest.mark.asyncio
    async def test_query_placed_first_in_fasta(self) -> None:
        """Verify the Query sequence is placed first in the multi-FASTA input."""
        captured_data: dict = {}

        async def capture_post(*args, **kwargs):
            captured_data.update(kwargs.get("data", {}))
            return _mock_post_response("job-123")

        mock_client = AsyncMock()
        mock_client.post = AsyncMock(side_effect=capture_post)
        mock_client.get = AsyncMock(
            side_effect=[
                _mock_response("FINISHED"),
                _mock_response(ALIGNED_FASTA),
            ]
        )
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        sequences = {
            "Ecoli_K12": "ATGAAAGCTAGCTTGCAG",
            "Query": "ATGAAAGCTAGCTTGCAG",
        }

        with patch(
            "app.pipeline.alignment.httpx.AsyncClient", return_value=mock_client
        ):
            with patch("app.pipeline.alignment.asyncio.sleep", new_callable=AsyncMock):
                await align_sequences(sequences)

        fasta_input = captured_data.get("sequence", "")
        assert fasta_input.startswith(">Query")

    @pytest.mark.asyncio
    async def test_too_few_sequences_raises(self) -> None:
        """Verify that fewer than 2 sequences raises ValueError."""
        with pytest.raises(ValueError, match="at least 2"):
            await align_sequences({"Query": "ATGCATGC"})

    @pytest.mark.asyncio
    async def test_missing_email_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Verify that missing NCBI_EMAIL raises ValueError."""
        monkeypatch.delenv("NCBI_EMAIL", raising=False)
        with pytest.raises(ValueError, match="NCBI_EMAIL"):
            await align_sequences({"A": "ATGC", "B": "ATGC"})

    @pytest.mark.asyncio
    async def test_job_failure_raises(self) -> None:
        """Verify RuntimeError when Clustal Omega reports ERROR status."""
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_post_response("job-fail"))
        mock_client.get = AsyncMock(return_value=_mock_response("ERROR"))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch(
            "app.pipeline.alignment.httpx.AsyncClient", return_value=mock_client
        ):
            with patch("app.pipeline.alignment.asyncio.sleep", new_callable=AsyncMock):
                with pytest.raises(RuntimeError, match="failed with status"):
                    await align_sequences({"Query": "ATGC", "B": "ATGC"})
