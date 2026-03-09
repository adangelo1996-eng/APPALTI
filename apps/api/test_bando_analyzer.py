import os
from pathlib import Path

import requests

API_URL = os.getenv("API_URL", "http://localhost:8000")


def run_test_on_pdf(pdf_path: Path):
  if not pdf_path.exists():
      print(f"[SKIP] {pdf_path} non trovato.")
      return

  print(f"\n=== Test analyze_bando su {pdf_path} ===")
  with pdf_path.open("rb") as f:
      files = {"file": (pdf_path.name, f, "application/pdf")}
      resp = requests.post(f"{API_URL}/api/v1/analyze_bando", files=files, timeout=120)
  resp.raise_for_status()
  data = resp.json()
  print("Totale criteri:", len(data.get("criteri", [])))
  print("Totale punti:", data.get("totale_punti"))
  print("Istruzioni_scrittura snippet:", (data.get("istruzioni_scrittura") or "")[:400], "...")


if __name__ == "__main__":
  base = Path("test_data")
  pdfs = [base / "bando1.pdf", base / "bando2.pdf", base / "bando3.pdf"]
  for p in pdfs:
      run_test_on_pdf(p)

