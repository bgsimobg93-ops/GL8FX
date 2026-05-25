"""
GL8FX — TradingAgents FastAPI backend
Run: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import os
import sys
import uuid
from datetime import datetime
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ── point Python at the cloned tradingagents-core ──────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tradingagents-core"))

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

app = FastAPI(title="GL8FX TradingAgents API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── in-memory job store ─────────────────────────────────────────────────────
_jobs: dict[str, dict] = {}


class AnalyzeRequest(BaseModel):
    ticker: str
    date: str                          # "YYYY-MM-DD"
    analysts: list[str] = ["market", "social", "news", "fundamentals"]
    llm_provider: str = "openai"
    deep_think_llm: str = "gpt-4o"
    quick_think_llm: str = "gpt-4o-mini"
    asset_type: str = "stock"


class JobStatus(BaseModel):
    job_id: str
    status: str       # pending | running | done | error
    ticker: str
    date: str
    decision: dict | None = None
    error: str | None = None
    started_at: str | None = None
    finished_at: str | None = None


def _build_config(req: AnalyzeRequest) -> dict:
    cfg = DEFAULT_CONFIG.copy()
    cfg["llm_provider"]    = req.llm_provider
    cfg["deep_think_llm"]  = req.deep_think_llm
    cfg["quick_think_llm"] = req.quick_think_llm
    return cfg


def _run_analysis(job_id: str, req: AnalyzeRequest) -> None:
    """Blocking call — runs in a thread via asyncio.to_thread."""
    _jobs[job_id]["status"] = "running"
    _jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
    try:
        cfg = _build_config(req)
        ta = TradingAgentsGraph(
            selected_analysts=req.analysts,
            debug=False,
            config=cfg,
        )
        _, decision = ta.propagate(req.ticker, req.date, req.asset_type)

        # normalise decision to a plain dict
        if hasattr(decision, "model_dump"):
            decision = decision.model_dump()
        elif not isinstance(decision, dict):
            decision = {"raw": str(decision)}

        _jobs[job_id]["status"]      = "done"
        _jobs[job_id]["decision"]    = decision
        _jobs[job_id]["finished_at"] = datetime.utcnow().isoformat()
    except Exception as exc:
        _jobs[job_id]["status"]      = "error"
        _jobs[job_id]["error"]       = str(exc)
        _jobs[job_id]["finished_at"] = datetime.utcnow().isoformat()


# ── endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "GL8FX TradingAgents API"}


@app.post("/analyze", response_model=JobStatus)
async def analyze(req: AnalyzeRequest):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id":      job_id,
        "status":      "pending",
        "ticker":      req.ticker.upper(),
        "date":        req.date,
        "decision":    None,
        "error":       None,
        "started_at":  None,
        "finished_at": None,
    }
    # run in background thread — doesn't block the event loop
    asyncio.get_event_loop().run_in_executor(
        None, _run_analysis, job_id, req
    )
    return _jobs[job_id]


@app.get("/status/{job_id}", response_model=JobStatus)
def get_status(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return _jobs[job_id]


@app.get("/jobs")
def list_jobs():
    return list(_jobs.values())


async def _stream_job(job_id: str) -> AsyncIterator[str]:
    """SSE generator — polls every second until done/error."""
    while True:
        job = _jobs.get(job_id)
        if not job:
            yield f"data: {json.dumps({'error': 'job not found'})}\n\n"
            return
        yield f"data: {json.dumps(job)}\n\n"
        if job["status"] in ("done", "error"):
            return
        await asyncio.sleep(1)


@app.get("/stream/{job_id}")
async def stream_job(job_id: str):
    """Server-Sent Events endpoint — subscribe to live job updates."""
    return StreamingResponse(
        _stream_job(job_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
