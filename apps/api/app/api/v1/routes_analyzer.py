from fastapi import APIRouter, File, UploadFile, HTTPException

from app.services.analyzer import analyze_bando_pdf


router = APIRouter(tags=["bando-analyzer"])


@router.post("/analyze_bando")
async def analyze_bando(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Solo PDF sono supportati per l'analisi bando.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File vuoto.")

    try:
        result = analyze_bando_pdf(data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Errore durante l'analisi del bando: {exc}") from exc

    return result

