<div align="center">

# QSIGN

### Quantum-Certified Document Notarization

**Proof of authenticity that rests on the laws of physics — not on a password, a database, or a promise.**

![Quantum](https://img.shields.io/badge/IBM_Quantum-Heron_r2-0F62FE)
![Signatures](https://img.shields.io/badge/Signatures-ML--DSA--65_(NIST_PQC)-5B21B6)
![AI](https://img.shields.io/badge/AI-IBM_Granite-0F62FE)
![Status](https://img.shields.io/badge/status-live_demo-1A7A4A)

</div>

---

## The problem

Every digital notarization system today ultimately trusts something that can be copied, leaked, or coerced: a private key in a file, an administrator's credentials, a row in a database. If an attacker obtains the secret, they can forge a "valid" record and no one can tell the difference. Trust is *computational* — it holds only until someone has enough compute, or enough access.

QSIGN removes that single point of failure by anchoring authenticity to something no attacker can copy or fake: **the measured behaviour of entangled quantum particles.**

## What QSIGN does

QSIGN issues a **quantum certificate** for any document. The certificate proves three things at once:

1. **This exact document** — a cryptographic fingerprint binds the certificate to the file, byte for byte.
2. **Certified by real quantum physics** — the certificate carries the result of a Bell–CHSH experiment whose correlation is *physically impossible* for any classical system to reproduce.
3. **Sealed against the quantum future** — the whole certificate is signed with a NIST post-quantum algorithm, so it stays secure even against the quantum computers that will break today's RSA and ECC.

Anyone can later verify a document against its certificate. If a single character of the document changes, or the certificate is tampered with, verification fails — instantly and unambiguously.

## Why this is different

> A forged certificate would have to reproduce a Bell inequality violation using classical randomness. That is not *hard* — it is **physically impossible**. Forgery moves from "computationally expensive" to "forbidden by the laws of physics."

Traditional security asks *"is this attacker powerful enough to break the math?"* QSIGN asks a question with a permanent answer: *"can the universe be classical here?"* It cannot.

---

## How it works

QSIGN verifies every document against **five independent layers**. A certificate is accepted only if all five pass.

| Layer | What it proves | How it is checked |
|-------|----------------|-------------------|
| **Document fingerprint** | The file is unaltered, to the byte | The document's hash must match the one sealed in the certificate |
| **Quantum origin** | The certificate was born from real quantum measurement | The Bell–CHSH score must exceed the classical limit of 2.0 |
| **Document-bound circuit** | The quantum proof belongs to *this* document and no other | The measurement angles must be the exact values derived from this document's hash |
| **Post-quantum signature** | The certificate itself is authentic and untampered | A NIST ML-DSA-65 signature must validate |
| **Trusted issuer** | It was issued by *the* QSIGN authority, not a self-signed forgery | The certificate's public key must match the authority's pinned key |

### The physics, in one paragraph

Two entangled qubits are measured along carefully chosen angles. Quantum mechanics predicts their measurement correlations will reach a value of up to **2.828** (the Tsirelson bound). Any classical explanation — any hidden variable, any pre-agreed strategy, any random-number generator — is mathematically capped at **2.0**. This is Bell's theorem, and it is one of the most thoroughly confirmed results in all of physics. When QSIGN measures a correlation above 2.0, it has witnessed something no classical process could have produced. That excess *is* the certificate's proof of origin.

### Bound to the document

The four measurement angles are not fixed — they are **derived from the document's own fingerprint**. This means the quantum proof for one document cannot be lifted and replayed onto another: a different document produces a different circuit, and the mismatch is detected even if an attacker rewrites the fingerprint field. The physics is entangled with the content.

### Verified on real quantum hardware

QSIGN's Bell test has been executed on **IBM's `ibm_marrakesh` processor — a 156-qubit Heron r2 quantum computer**. On real, noisy hardware it measured a CHSH score of **2.70**, comfortably above the classical bound of 2.0. Every hardware run carries a **public IBM Quantum job ID**, so anyone can independently confirm the experiment actually ran on a quantum computer. Nothing about the proof is taken on trust.

### Explained in plain language

Verification results are not left as raw numbers. **IBM Granite**, running locally, produces a concise, human-readable forensic verdict for every check — turning "CHSH = 2.70, signature valid, angles bound" into a sentence a lawyer, registrar, or judge can act on.

---

## The product

QSIGN is a working web application with four workspaces:

- **Notarize** — drop in any document and receive its quantum certificate, downloadable as JSON **or as a professional PDF with a scannable QR verification code**.
- **Verify** — upload a document and its certificate to run all five checks, with a color-coded pass/fail breakdown and an AI forensic verdict. A "Try to Forge It" mode lets anyone tamper with a certificate and watch every layer reject it.
- **Quantum Proof** — an interactive view of the physics: the real IBM hardware provenance panel and a correlation curve showing measured quantum results diverging from the classical limit.
- **Audit Log** — a tamper-evident, hash-chained ledger of every notarization, where altering any past record breaks the entire chain.

---

## Technology

| Domain | Stack |
|--------|-------|
| **Quantum computing** | IBM Qiskit · Qiskit Aer (simulation) · IBM Quantum Runtime · `ibm_marrakesh` (Heron r2) |
| **Post-quantum cryptography** | NIST ML-DSA-65 (CRYSTALS-Dilithium) |
| **Artificial intelligence** | IBM Granite (local inference) |
| **Application** | FastAPI service · React single-page interface |

Two IBM technologies power the core of the product: **IBM Quantum** provides the physical root of trust, and **IBM Granite** makes every verdict legible.

---

## Real-world applications

- **Land & property registries** — deeds and titles that cannot be silently altered after registration.
- **Academic & professional credentials** — diplomas and licenses with tamper-proof, physics-backed provenance.
- **Legal & compliance records** — contracts and filings with an immutable, independently verifiable origin.
- **High-value supply chains** — certificates of authenticity that survive into the post-quantum era.

---

## Security model

- **No forgeable secret at the root.** The ultimate proof of origin is a physical measurement, not a stored key.
- **Post-quantum by construction.** Certificates are signed with ML-DSA-65, safe against both classical and quantum adversaries.
- **Independently auditable.** Hardware runs expose a public IBM Quantum job ID; the audit ledger is self-verifying.
- **Tamper-evident end to end.** Any change to a document, certificate, or ledger entry is detected by at least one of the five verification layers.

---

## Benchmarks & honest comparison

QSIGN is benchmarked against strong, production-grade classical baselines. Full report: [`BENCHMARKS.md`](BENCHMARKS.md) — reproduce with `python backend/benchmarks/run_all.py`.

**Signatures (100 KB, measured):** classical RSA/ECDSA/Ed25519 are 10–600× faster and 5–50× smaller than ML-DSA-65 — *but every one of them is broken by Shor's algorithm on a quantum computer.* ML-DSA-65 trades speed and size for the quantum-safety QSIGN needs for records that must last decades.

**Pipeline optimization:** the CHSH pipeline was made **2.7× faster** (581 ms → 216 ms) via a shared simulator and single batched job. Accuracy converges as ~1/√shots (CHSH stdev 0.036 → 0.004).

**Where quantum helps — stated honestly:** QSIGN is *not* a runtime-speedup project. Its quantum advantage is **device-independent certification** and **post-quantum longevity**, not throughput (classical RNG is ~68,000× faster but not certifiable). See [`docs/QUANTUM_ADVANTAGE.md`](docs/QUANTUM_ADVANTAGE.md).

---

## Documentation

| Doc | Contents |
|-----|----------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, five-layer trust model |
| [Technical](docs/TECHNICAL.md) | Running it, optimizations, circuit & crypto internals |
| [API](docs/API.md) | Every endpoint, request/response shapes |
| [Quantum Advantage](docs/QUANTUM_ADVANTAGE.md) | Where quantum helps vs where classical suffices |
| [Quantum Optimization](docs/QUANTUM_OPTIMIZATION.md) | Transpilation, error mitigation, shot & pipeline optimization |
| [Classical Comparison](docs/CLASSICAL_COMPARISON.md) | Baselines, complexity, measured results |
| [Scalability](docs/SCALABILITY.md) | Issuance vs verification scaling, bottlenecks |
| [Benchmarks](BENCHMARKS.md) | Auto-generated report with tables & charts |

---

## Roadmap

- Expanded quantum-hardware backends and automatic least-busy device selection
- Certified quantum-randomness beacon to amortize the QPU across many certificates
- Organization-level issuer identities backed by an HSM/KMS, with key rotation
- Public verification portal and Merkle-checkpointed audit ledger

---

## Acknowledgements

Built on **IBM Quantum**, **IBM Qiskit**, and **IBM Granite**. Bell–CHSH methodology follows the standard Clauser–Horne–Shimony–Holt formulation of Bell's theorem.

<div align="center">

**QSIGN** — *authenticity you can measure.*

</div>
