# Architecture

## System overview

```
                          ┌──────────────────────────────┐
   React SPA (Vite)       │            FastAPI            │
  Notarize · Verify   ──▶ │  /notarize  /verify  /verdict │
  Quantum Proof · Audit   │  /correlation /hardware       │
                          │  /issuer  /audit  /cert/pdf   │
                          └───────────────┬──────────────┘
                                          │
        ┌───────────────┬────────────────┼───────────────┬──────────────┐
        ▼               ▼                ▼               ▼              ▼
   circuit.py       crypto.py        hardware.py     granite.py    pdf_certificate.py
  Bell-CHSH        ML-DSA-65 +       real IBM        IBM Granite   PDF + QR
  (Qiskit Aer /    persistent        provenance      (Ollama,      (reportlab,
   IBM Runtime)    issuer identity   (cached job)    local)        qrcode)
```

## The five-layer trust model

A certificate is accepted only if **all five** independent checks pass. Each
defends against a different attack:

| # | Layer | Proves | Defeats |
|---|---|---|---|
| 1 | **Document fingerprint** (SHA-256) | file is unaltered | tampering |
| 2 | **Quantum origin** (Bell–CHSH > 2.0) | born from real quantum measurement | classical fabrication |
| 3 | **Document-bound circuit** | proof belongs to *this* document | replay across documents |
| 4 | **Post-quantum signature** (ML-DSA-65) | certificate untampered & quantum-safe | forgery, quantum attack |
| 5 | **Trusted issuer** | signed by *the* QSIGN authority | attacker self-signing |

## Data flow — Notarize (issuance)

1. Client uploads a file → `POST /notarize`.
2. `crypto.hash_document` → SHA-256 fingerprint.
3. `circuit.run_bell_circuit(document_hash)` → derives document-bound angles, runs the four CHSH correlators in **one batched Aer job**, returns the CHSH value + angles.
4. `crypto.create_certificate` → assembles the certificate and signs the canonical payload with the **persistent ML-DSA-65 issuer key**.
5. Entry appended to the **hash-chained audit ledger**.
6. Certificate returned; downloadable as JSON or **PDF+QR** (`/certificate/pdf`).

## Data flow — Verify (detection)

1. Client uploads the document + its certificate → `POST /verify`.
2. `crypto.verify_certificate` runs the five checks and returns per-check results.
3. Frontend calls `POST /verdict` → **IBM Granite** produces a plain-English forensic verdict (rule-based fallback if offline).
4. All checks fully classical — **no quantum hardware needed to verify**.

## Component responsibilities

| Module | Responsibility |
|---|---|
| `backend/circuit.py` | Bell-CHSH circuits, document-bound angles, correlation curve (optimized/batched) |
| `backend/crypto.py` | ML-DSA-65 signing, persistent issuer identity, five-check verification |
| `backend/hardware.py` | Load cached real-IBM-hardware provenance |
| `backend/real_hardware.py` | Run/retrieve a real IBM Quantum CHSH job |
| `backend/granite.py` | IBM Granite forensic verdict (local Ollama) |
| `backend/pdf_certificate.py` | PDF certificate + QR verification token |
| `backend/benchmarks/` | Reproducible benchmark suite |
| `frontend/src/App.jsx` | Notarize / Verify / Quantum Proof / Audit UI |

## Tech stack

- **Quantum:** Qiskit, Qiskit Aer, Qiskit IBM Runtime, `ibm_marrakesh` (Heron r2)
- **Post-quantum crypto:** ML-DSA-65 (`dilithium-py`)
- **Classical baselines:** RSA/ECDSA/Ed25519 (`cryptography`)
- **AI:** IBM Granite via Ollama
- **App:** FastAPI + React (Vite)
- **Docs/PDF:** reportlab, qrcode, matplotlib
