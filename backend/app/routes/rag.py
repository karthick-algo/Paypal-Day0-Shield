"""RAG (Retrieval-Augmented Generation) API routes for PayPal Seller Protection."""

import re
from typing import Optional
import httpx
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.security.auth import get_current_user
from app.security.guardrails import guardrails
from app.rag.engine import rag_engine
from app.rag.corpus import POLICIES

router = APIRouter(prefix="/rag", tags=["rag"])


class DisputeAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    entity_id: int
    entity_type: str = "order"
    hazard_type: str = "flood"
    region: str = "Chennai"


class IngestDocumentRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = Field(None, max_length=200)
    raw_text: Optional[str] = Field(None, max_length=50000)
    url: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field("Merchant Evidence & Policy", max_length=100)


@router.get("/query")
async def query_rag(
    q: str = Query(..., min_length=2, description="Search query across PayPal policy documents"),
    top_k: int = Query(3, ge=1, le=5),
    user: dict = Depends(get_current_user),
):
    """Semantic retrieval across PayPal Seller Protection & Disaster Policies."""
    # Guardrail check on incoming search query
    check = guardrails.inspect_input(q)
    if not check.is_safe:
        raise HTTPException(status_code=400, detail=check.violations)

    results = rag_engine.retrieve(check.sanitized_text, top_k=top_k)
    return {
        "query": check.sanitized_text,
        "total_results": len(results),
        "results": results,
        "guardrail_status": check.risk_level,
    }


@router.post("/analyze-dispute")
async def analyze_dispute_with_rag(
    request: DisputeAnalysisRequest,
    user: dict = Depends(get_current_user),
):
    """Generate an evidence defense brief grounded in retrieved PayPal policy."""
    analysis = rag_engine.generate_defense_brief(
        entity_id=request.entity_id,
        entity_type=request.entity_type,
        hazard_type=request.hazard_type,
        region=request.region,
    )
    return analysis


@router.get("/corpus")
async def list_corpus(user: dict = Depends(get_current_user)):
    """List all indexed policy articles in the PayPal Seller Protection knowledge base."""
    return {
        "total_documents": len(rag_engine.corpus),
        "documents": rag_engine.corpus,
    }


@router.post("/ingest")
async def ingest_document(
    payload: IngestDocumentRequest,
    user: dict = Depends(get_current_user),
):
    """Ingest custom text or crawl a live URL into the PayPal Seller Protection vector index."""
    if not payload.raw_text and not payload.url:
        raise HTTPException(status_code=400, detail="Must provide either raw_text or a url to ingest.")

    title = payload.title or "Merchant Ingested Policy Document"
    content = ""
    source = "Merchant Portal Manual Input"

    if payload.url:
        source = payload.url
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    payload.url,
                    headers={"User-Agent": "Day0-Shield-PayPal-Policy-Crawler/1.0"}
                )
                if resp.status_code >= 400:
                    raise HTTPException(status_code=400, detail=f"Failed to fetch URL: HTTP {resp.status_code}")
                
                # Simple HTML to text extraction
                html = resp.text
                # Extract title if not provided
                title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
                if title_match and not payload.title:
                    title = title_match.group(1).strip()
                
                # Strip scripts and styles
                clean = re.sub(r"<(script|style).*?>.*?</\1>", "", html, flags=re.IGNORECASE | re.DOTALL)
                clean = re.sub(r"<[^>]+>", " ", clean)
                content = re.sub(r"\s+", " ", clean).strip()[:15000]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error scraping URL: {str(e)}")

    if payload.raw_text:
        content = f"{content}\n{payload.raw_text}".strip() if content else payload.raw_text.strip()

    # Apply Guardrail inspection & sanitization
    guard_result = guardrails.inspect_input(content)
    if not guard_result.is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Security Guardrail Violation: {'; '.join(guard_result.violations)}"
        )

    # Ingest document into live index
    doc = rag_engine.add_document(
        title=title,
        content=guard_result.sanitized_text,
        category=payload.category or "Custom Policy",
        source=source,
    )

    return {
        "status": "ingested",
        "document": doc,
        "guardrails_check": {
            "risk_level": guard_result.risk_level,
            "violations_handled": guard_result.violations,
        },
        "total_corpus_documents": len(rag_engine.corpus),
    }


@router.get("/guardrails-metrics")
async def get_guardrails_metrics(user: dict = Depends(get_current_user)):
    """Return telemetry on Guardrail AI security activity."""
    return guardrails.get_security_metrics()
