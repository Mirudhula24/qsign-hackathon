from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import sys
import os
import hashlib

sys.path.append(os.path.dirname(__file__))
from circuit import run_bell_circuit, correlation_curve
from crypto import hash_document, create_certificate, verify_certificate
from hardware import load_hardware_result

app = FastAPI(title="QSIGN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

notarizations = []
GENESIS_HASH = "0" * 64

def _entry_hash(prev_hash, entry):
    """Tamper-evident chaining: each entry's hash commits to the previous
    entry's hash plus this entry's own fields. Altering any past record breaks
    every hash after it, so the whole ledger is verifiable in one pass."""
    payload = json.dumps({
        "prev_hash": prev_hash,
        "index": entry["index"],
        "filename": entry["filename"],
        "timestamp": entry["timestamp"],
        "document_hash": entry["document_hash"],
        "chsh_value": entry["chsh_value"],
    }, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()

@app.get("/health")
def health():
    return {"status": "QSIGN API running"}

@app.post("/notarize")
async def notarize(file: UploadFile = File(...)):
    file_bytes = await file.read()
    doc_hash = hash_document(file_bytes)
    bell_data = run_bell_circuit(document_hash=doc_hash)   # document-bound angles
    certificate = create_certificate(doc_hash, bell_data)

    # Append to the tamper-evident audit ledger.
    prev_hash = notarizations[-1]["entry_hash"] if notarizations else GENESIS_HASH
    entry = {
        "index": len(notarizations),
        "filename": file.filename,
        "timestamp": certificate["timestamp"],
        "document_hash": doc_hash,
        "chsh_value": bell_data["chsh_value"],
        "status": "Verified",
        "prev_hash": prev_hash,
    }
    entry["entry_hash"] = _entry_hash(prev_hash, entry)
    notarizations.append(entry)

    return {
        "status": "success",
        "filename": file.filename,
        "certificate": certificate,
    }

@app.get("/audit")
def audit():
    # Recompute the chain and report whether the ledger is intact.
    prev = GENESIS_HASH
    chain_valid = True
    broken_at = None
    for e in notarizations:
        expected = _entry_hash(prev, e)
        if e.get("prev_hash") != prev or e.get("entry_hash") != expected:
            chain_valid = False
            broken_at = e["index"]
            break
        prev = e["entry_hash"]
    return {
        "notarizations": notarizations,
        "chain_valid": chain_valid,
        "broken_at": broken_at,
        "count": len(notarizations),
    }

@app.get("/correlation")
def correlation():
    # Quantum-vs-classical correlation curve for the proof visualization.
    return {"status": "success", "data": correlation_curve()}

@app.get("/hardware")
def hardware():
    # Real IBM Quantum hardware provenance (cached), for the proof panel.
    return {"status": "success", "data": load_hardware_result()}

@app.post("/verify")
async def verify(
    file: UploadFile = File(...),
    certificate: UploadFile = File(...)
):
    file_bytes = await file.read()
    cert_bytes = await certificate.read()
    cert_data = json.loads(cert_bytes.decode())
    
    # Handle both raw certificate and wrapped response
    if "certificate" in cert_data:
        cert_data = cert_data["certificate"]
    
    result = verify_certificate(file_bytes, cert_data)
    return {
        "status": "success",
        "verification": result,
    }