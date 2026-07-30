"""
Benchmark: classical signatures (RSA / ECDSA / Ed25519) vs post-quantum ML-DSA-65.

This is the honest quantum-relevant comparison for QSIGN. It is NOT a claim that
ML-DSA is faster than classical signatures (it is not, on today's hardware). It
quantifies the real trade: classical schemes are fast and compact but are broken
by Shor's algorithm on a quantum computer; ML-DSA-65 is larger and slower but
remains secure in the quantum era — which is why QSIGN ships it.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from benchmarks.sig_schemes import build_schemes
from benchmarks.common import time_ms, write_csv, markdown_table, bar_chart

# Small / medium / large / stress payloads (bytes) — documents to be signed.
PAYLOADS = {
    "small_1KB": 1024,
    "medium_100KB": 100 * 1024,
    "large_1MB": 1024 * 1024,
    "stress_10MB": 10 * 1024 * 1024,
}


def run(repeats=15):
    schemes = build_schemes()
    rows = []
    # Pre-generate one keypair per scheme (keygen benchmarked separately).
    keys = {name: s["keygen"]() for name, s in schemes.items()}

    for name, s in schemes.items():
        sk, pk = keys[name]
        pub_len = len(s["pub_bytes"](pk))

        kg = time_ms(lambda s=s: s["keygen"](), repeats=max(3, repeats // 3))

        for pname, size in PAYLOADS.items():
            msg = os.urandom(size)
            sig = s["sign"](sk, msg)
            sig_len = len(sig)
            st = time_ms(lambda s=s, sk=sk, msg=msg: s["sign"](sk, msg), repeats=repeats)
            vt = time_ms(lambda s=s, pk=pk, msg=msg, sig=sig: s["verify"](pk, msg, sig), repeats=repeats)
            assert s["verify"](pk, msg, sig), f"{name} self-verify failed"

            rows.append({
                "scheme": name,
                "category": s["category"],
                "quantum_vulnerable": "YES" if s["quantum_vulnerable"] else "no",
                "classical_bits": s["classical_bits"],
                "quantum_bits": s["quantum_bits"],
                "payload": pname,
                "keygen_ms": kg["median_ms"],
                "sign_ms": st["median_ms"],
                "verify_ms": vt["median_ms"],
                "pubkey_bytes": pub_len,
                "signature_bytes": sig_len,
            })

    write_csv("signatures.csv", rows, list(rows[0].keys()))

    # Chart: sign+verify on the medium payload, per scheme.
    med = [r for r in rows if r["payload"] == "medium_100KB"]
    labels = [r["scheme"] for r in med]
    bar_chart("sig_sign_verify_ms.png", labels,
              [("sign (ms)", [r["sign_ms"] for r in med]),
               ("verify (ms)", [r["verify_ms"] for r in med])],
              "milliseconds (median)", "Signature sign/verify time (100KB payload)", logy=True)
    bar_chart("sig_sizes.png", labels,
              [("public key (bytes)", [r["pubkey_bytes"] for r in med]),
               ("signature (bytes)", [r["signature_bytes"] for r in med])],
              "bytes", "Public-key and signature sizes", logy=True)
    return rows


def summary_markdown(rows):
    med = [r for r in rows if r["payload"] == "medium_100KB"]
    tbl = markdown_table(med, [
        ("scheme", "Scheme"), ("category", "Type"),
        ("quantum_vulnerable", "Broken by Shor?"),
        ("classical_bits", "Classical sec (bits)"),
        ("sign_ms", "Sign (ms)"), ("verify_ms", "Verify (ms)"),
        ("pubkey_bytes", "PubKey (B)"), ("signature_bytes", "Sig (B)"),
    ])
    return (
        "### Signatures — classical baselines vs post-quantum (100 KB payload)\n\n"
        + tbl +
        "\n\n*RSA/ECDSA/Ed25519 are faster and smaller, but every one is broken by "
        "Shor's algorithm on a fault-tolerant quantum computer. ML-DSA-65 trades size "
        "and speed for quantum resistance — the property QSIGN needs.*\n"
    )


if __name__ == "__main__":
    r = run()
    print(summary_markdown(r))
