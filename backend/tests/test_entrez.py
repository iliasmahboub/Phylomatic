"""Unit tests for the Entrez fetch module."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch, MagicMock

import httpx
import pytest

from app.pipeline.entrez import fetch_sequences, BATCH_SIZE

SAMPLE_FASTA_RESPONSE = """>NR_114042.1 Escherichia coli strain U 5/41 16S ribosomal RNA
ATGAAAGCTAGCTTGCAGATTCAGTCGTACTGGATCGATCGATCGATCG
>NR_025946.1 Salmonella enterica strain LT2 16S ribosomal RNA
ATGAAAGCTAGCTTGCAGATTCAGTCGTACTGGATCGATCGATCAAAAA
"""

SINGLE_FASTA = """>NR_114042.1 Escherichia coli strain U 5/41 16S ribosomal RNA
ATGAAAGCTAGCTTGCAGATTCAGTCGTACTGGATCGATCGATCGATCG
"""


def _mock_response(text: str, status_code: int = 200) -> httpx.Response:
    """Create a mock httpx.Response."""
    request = httpx.Request("GET", "https://example.com")
    return httpx.Response(status_code=status_code, text=text, request=request)


class TestFetchSequences:
    @pytest.fixture(autouse=True)
    def _set_email(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("NCBI_EMAIL", "test@example.com")

    @pytest.mark.asyncio
    async def test_parses_multi_fasta_response(self) -> None:
        """Verify that a multi-FASTA response is parsed into the correct dict."""
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=_mock_response(SAMPLE_FASTA_RESPONSE))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.pipeline.entrez.httpx.AsyncClient", return_value=mock_client):
            result = await fetch_sequences(["NR_114042", "NR_025946"])

        assert len(result) == 2
        assert "NR_114042" in result
        assert "NR_025946" in result
        assert "Escherichia" in result["NR_114042"]

    @pytest.mark.asyncio
    async def test_batches_requests(self) -> None:
        """Verify that accessions are split into batches of BATCH_SIZE."""
        accessions = [f"ACC_{i:04d}" for i in range(BATCH_SIZE + 2)]

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=_mock_response(SINGLE_FASTA))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.pipeline.entrez.httpx.AsyncClient", return_value=mock_client):
            await fetch_sequences(accessions)

        # Should have made 2 requests (5 + 2)
        assert mock_client.get.call_count == 2

    @pytest.mark.asyncio
    async def test_missing_email_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Verify that missing NCBI_EMAIL raises ValueError."""
        monkeypatch.delenv("NCBI_EMAIL", raising=False)
        with pytest.raises(ValueError, match="NCBI_EMAIL"):
            await fetch_sequences(["NR_114042"])

    @pytest.mark.asyncio
    async def test_retries_on_http_error(self) -> None:
        """Verify retry logic on transient HTTP errors."""
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(
            side_effect=[
                httpx.HTTPStatusError(
                    "500", request=MagicMock(), response=_mock_response("", 500)
                ),
                httpx.HTTPStatusError(
                    "500", request=MagicMock(), response=_mock_response("", 500)
                ),
                _mock_response(SINGLE_FASTA),
            ]
        )
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.pipeline.entrez.httpx.AsyncClient", return_value=mock_client):
            with patch("app.pipeline.entrez.asyncio.sleep", new_callable=AsyncMock):
                result = await fetch_sequences(["NR_114042"])

        assert "NR_114042" in result
        assert mock_client.get.call_count == 3

    @pytest.mark.asyncio
    async def test_raises_after_max_retries(self) -> None:
        """Verify RuntimeError after exhausting retries."""
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "500", request=MagicMock(), response=_mock_response("", 500)
            )
        )
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.pipeline.entrez.httpx.AsyncClient", return_value=mock_client):
            with patch("app.pipeline.entrez.asyncio.sleep", new_callable=AsyncMock):
                with pytest.raises(RuntimeError, match="Entrez fetch failed"):
                    await fetch_sequences(["NR_114042"])
