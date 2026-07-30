from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
import sys
import os

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

@app.get("/health")
def health():
    return {"status": "QSIGN API running"}

@app.post("/notarize")
async def notarize(file: UploadFile = File(...)):
    file_bytes = await file.read()
    doc_hash = hash_document(file_bytes)
    bell_data = run_bell_circuit()
    certificate = create_certificate(doc_hash, bell_data)

    # Save to audit log
    notarizations.append({
        "filename": file.filename,
        "timestamp": certificate["timestamp"],
        "chsh_value": bell_data["chsh_value"],
        "status": "Verified"
    })

    return {
        "status": "success",
        "filename": file.filename,
        "certificate": certificate,
    }

@app.get("/audit")
def audit():
    return {"notarizations": notarizations}

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