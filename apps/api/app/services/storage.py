from __future__ import annotations

import uuid

import requests

from app.core.config import get_settings
from app.core.logging import get_logger


logger = get_logger()
settings = get_settings()


class StorageError(Exception):
    pass


def upload_file_to_storage(
    *,
    organization_id: str,
    document_id: str,
    filename: str,
    data: bytes,
    content_type: str | None,
) -> str:
    """
    Carica il file originale in Supabase Storage e restituisce il path logico.

    Il bucket deve esistere già in Supabase. Usiamo il service role key per poter scrivere lato backend.
    """

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise StorageError("Supabase Storage non configurato correttamente")

    bucket = settings.supabase_storage_bucket
    safe_filename = filename.replace("\\", "/").split("/")[-1]
    # Evitiamo collisioni usando un UUID aggiuntivo
    random_id = uuid.uuid4()
    object_path = f"{organization_id}/{document_id}/{random_id}_{safe_filename}"

    url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{object_path}"

    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }

    try:
        resp = requests.post(url, headers=headers, data=data, timeout=30)
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Errore di rete caricando file in Storage: {exc}")
        raise StorageError("Errore di rete caricando file in Storage") from exc

    if not resp.ok:
        logger.error(
            "Supabase Storage upload failed",
            status=resp.status_code,
            text=resp.text,
        )
        raise StorageError(f"Supabase Storage upload failed ({resp.status_code})")

    return object_path

