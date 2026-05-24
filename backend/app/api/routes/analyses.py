"""Routes for user analysis history (requires authentication)."""
from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import require_user
from app.services.supabase_client import get_supabase

router = APIRouter()


@router.get("/analyses")
async def list_analyses(user=Depends(require_user)):
    """Return the 50 most recent analyses for the authenticated user."""
    result = (
        get_supabase()
        .table("analyses")
        .select("id, filename, score, created_at")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str, user=Depends(require_user)):
    """Return full report for a single analysis owned by the user."""
    result = (
        get_supabase()
        .table("analyses")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", str(user.id))
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Analisi non trovata.")
    return result.data


@router.delete("/analyses/{analysis_id}", status_code=204)
async def delete_analysis(analysis_id: str, user=Depends(require_user)):
    """Delete a single analysis owned by the user."""
    get_supabase().table("analyses").delete().eq("id", analysis_id).eq(
        "user_id", str(user.id)
    ).execute()
