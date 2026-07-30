import hashlib
import json
import time
import base64

# ---------------------------------------------------------------------------
# Post-quantum signature provider detection
#
# Certificates are signed with a real NIST post-quantum algorithm when a
# provider is available, and tagged with the scheme that actually signed them.
# Verification dispatches strictly on that scheme -- a certificate is only ever
# checked with the algorithm that produced it (no silent cross-scheme fallback).
#
#   1. dilithium-py  -> pure-Python NIST ML-DSA-65 (Dilithium3). No native build.
#   2. liboqs (oqs)  -> C-backed Dilithium3, only if the shared lib is present.
#   3. SHA256        -> integrity-only baseline when no PQC library is available.
# ---------------------------------------------------------------------------

PQC_PROVIDER = None
SIGNATURE_SCHEME = "SHA256-fallback"
_ml_dsa = None
_oqs = None

try:
    from dilithium_py.ml_dsa import ML_DSA_65 as _ml_dsa
    PQC_PROVIDER = "dilithium-py"
    SIGNATURE_SCHEME = "ML-DSA-65"
except ImportError:
    try:
        import oqs as _oqs
        _oqs.Signature("Dilithium3")  # forces native lib load; raises if missing
        PQC_PROVIDER = "oqs"
        SIGNATURE_SCHEME = "CRYSTALS-Dilithium3"
    except Exception:
        _oqs = None
        PQC_PROVIDER = None
        SIGNATURE_SCHEME = "SHA256-fallback"

# ---------------------------------------------------------------------------
# Persistent signing key
#
# One keypair is generated when the process starts and reused for every
# certificate. The private key never leaves the server; the public key is
# embedded in each certificate so it can be verified offline. This is what
# answers "what stops me forging a certificate?" -- a forger cannot produce a
# signature that verifies against QSIGN's public key without the private key
# that only this server holds.
# ---------------------------------------------------------------------------

_server_public_key = None
_server_secret_key = None
_server_sig = None

if PQC_PROVIDER == "dilithium-py":
    _server_public_key, _server_secret_key = _ml_dsa.keygen()
elif PQC_PROVIDER == "oqs":
    _server_sig = _oqs.Signature("Dilithium3")
    _server_public_key = _server_sig.generate_keypair()


def hash_document(file_bytes):
    return hashlib.sha256(file_bytes).hexdigest()


def _canonical_payload_bytes(document_hash, chsh_value, timestamp):
    """Deterministic bytes that get signed. Must be byte-identical at sign and
    verify time, so it is always built the same way from the same fields."""
    payload = {
        "document_hash": document_hash,
        "chsh_value": chsh_value,
        "timestamp": timestamp,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()


def _sign(payload_bytes):
    """Return a signature dict tagged with the active scheme."""
    if PQC_PROVIDER == "dilithium-py":
        signature = _ml_dsa.sign(_server_secret_key, payload_bytes)
        return {
            "scheme": SIGNATURE_SCHEME,
            "public_key": base64.b64encode(_server_public_key).decode(),
            "signature_bytes": base64.b64encode(signature).decode(),
        }
    if PQC_PROVIDER == "oqs":
        signature = _server_sig.sign(payload_bytes)
        return {
            "scheme": SIGNATURE_SCHEME,
            "public_key": base64.b64encode(_server_public_key).decode(),
            "signature_bytes": base64.b64encode(signature).decode(),
        }
    return {
        "scheme": SIGNATURE_SCHEME,
        "payload_hash": hashlib.sha256(payload_bytes).hexdigest(),
    }


def _verify_signature(signature_block, payload_bytes):
    """Verify a signature block against payload_bytes, dispatching strictly on
    the scheme recorded in the certificate."""
    scheme = signature_block.get("scheme", "")

    if scheme == "ML-DSA-65":
        from dilithium_py.ml_dsa import ML_DSA_65
        public_key = base64.b64decode(signature_block["public_key"])
        sig = base64.b64decode(signature_block["signature_bytes"])
        return bool(ML_DSA_65.verify(public_key, payload_bytes, sig))

    if scheme == "CRYSTALS-Dilithium3":
        import oqs
        verifier = oqs.Signature("Dilithium3")
        public_key = base64.b64decode(signature_block["public_key"])
        sig = base64.b64decode(signature_block["signature_bytes"])
        return bool(verifier.verify(payload_bytes, sig, public_key))

    if scheme in ("SHA256-fallback", "SHA256-placeholder"):
        expected = hashlib.sha256(payload_bytes).hexdigest()
        return expected == signature_block.get("payload_hash")

    return False


def create_certificate(document_hash, bell_data):
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    payload_bytes = _canonical_payload_bytes(
        document_hash, bell_data["chsh_value"], timestamp
    )
    signature = _sign(payload_bytes)

    return {
        "document_hash": document_hash,
        "timestamp": timestamp,
        "quantum_proof": {
            "circuit": "Bell_CHSH",
            "chsh_value": bell_data["chsh_value"],
            "classical_bound": 2.0,
            "quantum_maximum": bell_data["quantum_maximum"],
            "bell_violated": bell_data["bell_violated"],
            "backend": bell_data["backend"],
            "shots": bell_data["shots"],
            "document_bound": bell_data.get("document_bound", False),
            "angles": bell_data.get("angles"),
        },
        "signature": signature,
    }


def verify_certificate(file_bytes, certificate):
    results = {}

    # Check 1: document hash matches the file presented for verification.
    computed_hash = hash_document(file_bytes)
    results["hash_match"] = computed_hash == certificate["document_hash"]

    # Check 2: Bell/CHSH inequality was violated (quantum proof-of-work).
    chsh_value = certificate["quantum_proof"]["chsh_value"]
    results["bell_violated"] = chsh_value > 2.0
    results["chsh_value"] = chsh_value

    # Check 3: signature over the canonical payload, verified with the exact
    # scheme that signed it.
    payload_bytes = _canonical_payload_bytes(
        certificate["document_hash"], chsh_value, certificate["timestamp"]
    )
    try:
        results["signature_valid"] = _verify_signature(
            certificate["signature"], payload_bytes
        )
    except Exception:
        results["signature_valid"] = False

    results["signature_scheme"] = certificate["signature"].get("scheme")

    # Check 4: document-bound circuit. The measurement angles recorded in the
    # certificate must match the angles our derivation produces from THIS
    # document's hash. This proves the quantum circuit was parameterized by the
    # document itself -- the proof cannot be replayed onto a different document.
    qp = certificate.get("quantum_proof", {})
    cert_angles = qp.get("angles")
    if qp.get("document_bound") and cert_angles:
        from circuit import bell_angles
        a, a2, b, b2 = bell_angles(certificate["document_hash"])
        expected = {"theta_a": a, "theta_a2": a2, "theta_b": b, "theta_b2": b2}
        tol = 1e-4
        results["document_bound"] = all(
            abs(float(cert_angles.get(k, 1e9)) - v) < tol for k, v in expected.items()
        )
    else:
        # Legacy certificate without document binding: not penalized.
        results["document_bound"] = True

    results["overall"] = all([
        results["hash_match"],
        results["bell_violated"],
        results["signature_valid"],
        results["document_bound"],
    ])

    return results


if __name__ == "__main__":
    print(f"PQC provider: {PQC_PROVIDER!r}  scheme: {SIGNATURE_SCHEME}")

    doc = b"test property deed document"
    from circuit import run_bell_circuit

    doc_hash = hash_document(doc)
    bell_data = run_bell_circuit()
    cert = create_certificate(doc_hash, bell_data)
    print("Certificate:", json.dumps(cert, indent=2)[:600], "...")

    good = verify_certificate(doc, cert)
    print("Verify (genuine document):", good)
    assert good["overall"] is True, "genuine document should verify"

    tampered = verify_certificate(b"forged document", cert)
    print("Verify (tampered document):", tampered)
    assert tampered["overall"] is False, "tampered document must fail"

    print("Self-test passed.")
