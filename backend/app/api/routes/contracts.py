"""Contract analysis routes with rate limiting and authenticated storage."""
import anthropic
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.config import settings
from app.middleware.auth import get_optional_user
from app.models.dora_report import DoraReport
from app.services.dora_analyzer import analyze_contract
from app.services.supabase_client import get_supabase

router = APIRouter()

_MAX_PDF_BYTES = 20 * 1024 * 1024  # 20 MB
_ANON_MONTHLY_LIMIT = 3            # anonymous (IP-based)
_FREE_MONTHLY_LIMIT = 10           # authenticated free account


# ── Rate limiting ──────────────────────────────────────────────────────────────

def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host or "unknown")


def _check_and_increment(user, ip: str) -> None:
    """Raise HTTP 429 if limit exceeded, otherwise increment counter."""
    sb = get_supabase()
    month = _current_month()

    if user is None:
        # Anonymous: IP-based
        row = (
            sb.table("anonymous_usage")
            .select("count")
            .eq("ip", ip)
            .eq("month", month)
            .maybe_single()
            .execute()
        )
        count = row.data["count"] if row.data else 0
        if count >= _ANON_MONTHLY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"Limite gratuito raggiunto ({_ANON_MONTHLY_LIMIT}/mese). "
                    "Registrati per 10 analisi/mese gratuite, o passa a Pro per analisi illimitate."
                ),
            )
        sb.table("anonymous_usage").upsert(
            {"ip": ip, "month": month, "count": count + 1}
        ).execute()
        return

    # Authenticated: check plan
    sub = (
        sb.table("subscriptions")
        .select("plan")
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )
    plan = sub.data["plan"] if sub.data else "free"
    if plan == "pro":
        return  # Unlimited

    # Free account: count this month's analyses
    result = (
        sb.table("analyses")
        .select("id", count="exact")
        .eq("user_id", str(user.id))
        .gte("created_at", f"{month}-01T00:00:00Z")
        .execute()
    )
    if (result.count or 0) >= _FREE_MONTHLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Limite del piano gratuito raggiunto ({_FREE_MONTHLY_LIMIT}/mese). "
                "Passa a Pro per analisi illimitate."
            ),
        )


def _save_analysis(user, filename: str | None, report: DoraReport) -> None:
    """Persist analysis for authenticated users. Failure is non-blocking."""
    if user is None:
        return
    try:
        get_supabase().table("analyses").insert(
            {
                "user_id": str(user.id),
                "filename": filename,
                "punteggio_conformita": report.punteggio_conformita,
                "report": report.model_dump(),
            }
        ).execute()
    except Exception:
        pass  # Storage failure must not break the analysis response


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/analyze-contract", response_model=DoraReport)
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    user=Depends(get_optional_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Solo file PDF sono accettati.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > _MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="File troppo grande. Limite: 20 MB.")
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Il file PDF è vuoto.")

    _check_and_increment(user, _client_ip(request))

    try:
        report = await analyze_contract(pdf_bytes=pdf_bytes, demo=False)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc

    _save_analysis(user, file.filename, report)
    return report


@router.get("/analyze-contract/demo", response_model=DoraReport)
async def analyze_demo():
    """Demo — no rate limit, no auth required."""
    try:
        report = await analyze_contract(pdf_bytes=None, demo=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{type(exc).__name__}: {exc}") from exc
    return report


@router.get("/health/anthropic")
async def health_anthropic():
    """Diagnostic: verify Anthropic API connectivity."""
    try:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        result = await client.messages.count_tokens(
            model="claude-sonnet-4-6",
            messages=[{"role": "user", "content": "ping"}],
        )
        return {"status": "ok", "anthropic_reachable": True, "input_tokens": result.input_tokens}
    except anthropic.AuthenticationError as exc:
        return {"status": "error", "error": "AuthenticationError", "detail": str(exc)}
    except anthropic.APIConnectionError as exc:
        return {"status": "error", "error": "APIConnectionError", "detail": str(exc)}
    except Exception as exc:
        return {"status": "error", "error": type(exc).__name__, "detail": str(exc)}
