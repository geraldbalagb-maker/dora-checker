from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.models.dora_report import DoraReport
from app.services.dora_analyzer import analyze_contract

router = APIRouter()

_MAX_PDF_BYTES = 20 * 1024 * 1024  # 20 MB


@router.post("/analyze-contract", response_model=DoraReport)
async def analyze(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Solo file PDF sono accettati.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) > _MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="File troppo grande. Limite: 20 MB.")
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Il file PDF è vuoto.")

    try:
        report = await analyze_contract(pdf_bytes=pdf_bytes, demo=False)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return report


@router.get("/analyze-contract/demo", response_model=DoraReport)
async def analyze_demo():
    try:
        report = await analyze_contract(pdf_bytes=None, demo=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return report
