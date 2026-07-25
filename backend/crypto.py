import hashlib
import json
import time

def hash_document(file_bytes):
    return hashlib.sha256(file_bytes).hexdigest()

def create_certificate(document_hash, bell_data):
    payload = {
        "document_hash": document_hash,
        "chsh_value": bell_data["chsh_value"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    payload_str = json.dumps(payload, sort_keys=True)
    signature = hashlib.sha256(payload_str.encode()).hexdigest()
    return {
        "document_hash": document_hash,
        "timestamp": payload["timestamp"],
        "quantum_proof": {
            "circuit": "Bell_CHSH",
            "chsh_value": bell_data["chsh_value"],
            "classical_bound": 2.0,
            "quantum_maximum": bell_data["quantum_maximum"],
            "bell_violated": bell_data["bell_violated"],
            "backend": bell_data["backend"],
            "shots": bell_data["shots"],
        },
        "signature": {
            "scheme": "SHA256-placeholder",
            "payload_hash": signature,
        }
    }

def verify_certificate(file_bytes, certificate):
    results = {}

    # Check 1: document hash
    computed_hash = hash_document(file_bytes)
    results["hash_match"] = computed_hash == certificate["document_hash"]

    # Check 2: Bell violation
    chsh_value = certificate["quantum_proof"]["chsh_value"]
    results["bell_violated"] = chsh_value > 2.0
    results["chsh_value"] = chsh_value

    # Check 3: signature
    payload = {
        "document_hash": certificate["document_hash"],
        "chsh_value": chsh_value,
        "timestamp": certificate["timestamp"],
    }
    payload_str = json.dumps(payload, sort_keys=True)
    expected_sig = hashlib.sha256(payload_str.encode()).hexdigest()
    results["signature_valid"] = (
        expected_sig == certificate["signature"]["payload_hash"]
    )

    results["overall"] = all([
        results["hash_match"],
        results["bell_violated"],
        results["signature_valid"],
    ])

    return results

if __name__ == "__main__":
    # Quick test
    doc = b"test property deed document"
    from circuit import run_bell_circuit
    doc_hash = hash_document(doc)
    bell_data = run_bell_circuit()
    cert = create_certificate(doc_hash, bell_data)
    result = verify_certificate(doc, cert)
    print("Certificate:", json.dumps(cert, indent=2))
    print("Verification:", result)