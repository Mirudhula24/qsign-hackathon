# API Reference

Base URL (local): `http://127.0.0.1:8000`. All responses are JSON unless noted.
CORS is open for local development.

---

### `GET /health`
Liveness check. → `{ "status": "QSIGN API running" }`

---

### `POST /notarize`
Issue a quantum certificate for a document.
- **Body:** multipart form, `file` = the document.
- **Returns:** `{ status, filename, certificate }`.

`certificate` shape:
```
{
  "document_hash": "<sha256 hex>",
  "timestamp": "<UTC ISO8601>",
  "quantum_proof": {
    "circuit": "Bell_CHSH", "chsh_value": 2.83, "classical_bound": 2.0,
    "quantum_maximum": 2.8284, "bell_violated": true,
    "backend": "AerSimulator", "shots": 8192,
    "document_bound": true,
    "angles": { "theta_a": .., "theta_a2": .., "theta_b": .., "theta_b2": .. }
  },
  "signature": {
    "scheme": "ML-DSA-65", "issuer": "<16-hex fingerprint>",
    "public_key": "<base64>", "signature_bytes": "<base64>"
  }
}
```

---

### `POST /verify`
Verify a document against its certificate.
- **Body:** multipart form, `file` = document, `certificate` = the JSON cert file.
- **Returns:** `{ status, verification, certificate }`.

`verification` shape:
```
{
  "hash_match": bool, "bell_violated": bool, "chsh_value": float,
  "document_bound": bool, "signature_valid": bool,
  "signature_scheme": "ML-DSA-65",
  "issuer_trusted": bool|null, "issuer_fingerprint": "<hex>",
  "overall": bool
}
```

---

### `POST /verdict`
Plain-English forensic verdict from IBM Granite (local), rule-based fallback if offline.
- **Body (JSON):** `{ "verification": {...}, "certificate": {...} }`.
- **Returns:** `{ status, verdict: "<text>", model: "IBM Granite 3.3" | "rule-based" }`.

---

### `POST /certificate/pdf`
Render a certificate (and optional verification) as a PDF with a scannable QR token.
- **Body (JSON):** `{ "certificate": {...}, "verification": {...}?, "verify_url": "..."? }`.
- **Returns:** `application/pdf` (attachment).

---

### `GET /correlation`
Quantum-vs-classical correlation curve for the proof visualization.
- **Returns:** `{ status, data: { curve: [...], chsh_value, quantum_maximum, chsh_angles_deg } }`.

---

### `GET /hardware`
Real IBM Quantum hardware provenance (cached). Honest `"pending"` state if no genuine run exists.
- **Returns:** `{ status, data: { source, backend, job_id, chsh_value, bell_violated, correlators, ... } }`.

---

### `GET /issuer`
Public identity of this QSIGN authority (for pinning).
- **Returns:** `{ status, scheme, fingerprint, public_key }`.

---

### `GET /audit`
Tamper-evident notarization ledger with chain integrity.
- **Returns:** `{ notarizations: [ { index, filename, timestamp, document_hash, chsh_value, prev_hash, entry_hash, status } ], chain_valid, broken_at, count }`.
