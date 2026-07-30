# Classical Baselines & Comparison

QSIGN is benchmarked against the **strongest, most widely deployed classical
algorithms that solve the same sub-problems** — not strawmen. All classical
implementations are from `cryptography` (OpenSSL-backed, C-optimized,
constant-time), i.e. production-grade.

Reproduce everything with:

```
python backend/benchmarks/run_all.py
```

## 1. The two sub-problems and their best classical solvers

QSIGN's job — *tamper-evident, forgery-proof, future-proof notarization* —
decomposes into two cryptographic sub-problems, each with a best-in-class
classical baseline:

| Sub-problem | Best classical baseline(s) | QSIGN's choice |
|---|---|---|
| **Digital signature** (integrity + authenticity) | RSA-2048/3072, ECDSA P-256, Ed25519 | **ML-DSA-65** (post-quantum) |
| **Proof of unpredictable origin** | Classical CSPRNG / hardware RNG | **Bell–CHSH** certified randomness |

### Why these baselines were selected
- **RSA-2048 / RSA-3072** — the most deployed signature scheme in existence (TLS, code-signing, PKI).
- **ECDSA P-256** — the modern default for TLS 1.3, mobile, and most blockchains.
- **Ed25519** — the fastest, most modern classical curve signature; a genuinely strong opponent.
- **Classical CSPRNG (`os.urandom`)** — the standard source of cryptographic randomness.

## 2. Signature comparison (measured, 100 KB payload)

| Scheme | Type | Broken by Shor? | Classical security | Sign | Verify | PubKey | Signature |
|---|---|---|---|---|---|---|---|
| RSA-2048 | classical | **YES** | 112-bit | 0.59 ms | 0.08 ms | 294 B | 256 B |
| RSA-3072 | classical | **YES** | 128-bit | 1.71 ms | 0.10 ms | 422 B | 384 B |
| ECDSA-P256 | classical | **YES** | 128-bit | 0.08 ms | 0.12 ms | 91 B | 72 B |
| Ed25519 | classical | **YES** | 128-bit | 0.26 ms | 0.21 ms | 32 B | 64 B |
| **ML-DSA-65** | **post-quantum** | **no** | 192-bit | 54.6 ms | 10.5 ms | 1952 B | 3309 B |

*Numbers are medians on the reference machine; see `BENCHMARKS.md` for the full
matrix across small/medium/large/stress payloads.*

**Honest reading:** classical signatures are **10–600× faster and 5–50× smaller.**
For raw performance today, they win. But every classical row is **broken by
Shor's algorithm** on a fault-tolerant quantum computer. ML-DSA-65 is the price
of quantum-safety — and QSIGN pays it deliberately, because a notarized deed or
diploma must remain valid for *decades*, well into the quantum era.

## 3. Complexity comparison

| | Time (sign) | Time (verify) | Space (sig) | Doc-size dependence |
|---|---|---|---|---|
| RSA | O(k³) modexp | O(k²) | O(k) | O(n) hash, then O(1) |
| ECDSA / Ed25519 | O(k) scalar-mult | O(k) | O(k) | O(n) hash, then O(1) |
| ML-DSA-65 | O(1)* fixed lattice ops | O(1)* | O(1)* fixed 3309 B | O(n) hash, then O(1) |
| Bell–CHSH proof | O(shots) sampling | — | O(1) (≤4 counts) | independent of doc |

\* Fixed-size polynomial/NTT operations — constant in the security parameter for a given level. `k` = key bits, `n` = document bytes.

## 4. End-to-end notarization: classical PKI vs QSIGN

| Property | Classical PKI notary (DocuSign-style) | QSIGN |
|---|---|---|
| Integrity (tamper detection) | ✅ hash + signature | ✅ hash + signature |
| Authenticity (who signed) | ✅ trusted CA key | ✅ persistent issuer identity |
| **Proof of physical origin** | ❌ none | ✅ Bell–CHSH violation |
| **Anti-replay across documents** | ❌ generic | ✅ document-bound circuit angles |
| **Post-quantum safe** | ❌ RSA/ECDSA broken by Shor | ✅ ML-DSA-65 |
| Tamper-evident ledger | partial | ✅ hash-chained audit log |
| Issuance latency | ms | ms (sim) / minutes (real QPU) |
| Verification | ms, no special hardware | ms, **no quantum hardware needed** |

## 5. Practical usability

- **Verification is fully classical and instant** on any machine — QSIGN does not require a quantum computer to *check* a certificate, only (optionally) to *issue* one. This is the key usability property that makes it deployable today.
- Classical signatures remain more practical for high-frequency, low-value, short-lived signing. QSIGN targets **high-value, long-lived records** where post-quantum longevity and physical origin justify the extra cost — the honest niche where it wins.
