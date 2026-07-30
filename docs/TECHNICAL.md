# Technical Documentation

## Running the project

**Backend**
```
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

**Frontend**
```
cd frontend && npm install && npm run dev
```

**Optional — real IBM Quantum hardware** (one-time credential setup, then run):
```
python backend/setup_ibm.py          # saves token to ~/.qiskit (never committed)
python backend/real_hardware.py --run # runs a real CHSH job on ibm_marrakesh
```

**Optional — IBM Granite forensic verdict** (local, no credentials):
```
# with Ollama installed and running:
ollama pull granite3.3:2b
```
If Granite/Ollama is unavailable, verdicts fall back to a labeled rule-based summary.

**Benchmarks (reproducible)**
```
python backend/benchmarks/run_all.py
# -> BENCHMARKS.md + benchmarks/results/*.csv + *.png
```

## Pipeline optimizations (and why)

The Bell-CHSH pipeline was optimized; each change is measurable (see
`benchmarks/results/chsh_optimization.csv`, **2.7× faster**):

1. **Single reusable `AerSimulator`** — constructing a fresh simulator per
   correlator dominated runtime; one shared instance removes that cost.
2. **Batched execution** — the four CHSH correlators (and the 13 correlation-curve
   points) run as *one* `.run([...])` call instead of N sequential jobs, removing
   per-job scheduling overhead. This is the largest single win.
3. **Single transpile pass** over the circuit list.
4. **Caching** — the correlation curve is computed once and served from memory.
5. **Vectorization — evaluated, not applied:** the per-shot aggregation collapses
   to a ≤4-entry counts dict, so a numpy vectorization would add overhead rather
   than remove it. We note this explicitly rather than adding a cosmetic change.

## Quantum circuit details

- Bell state prepared with `H(0); CX(0,1)`, then measurement-basis rotations
  `RY(-2θ)` on each qubit; `⟨Z⊗Z⟩` estimated from counts.
- CHSH statistic `S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′)`; optimal angles
  `(0, π/4) × (π/8, 3π/8)` → Tsirelson maximum `2√2 ≈ 2.828`.
- **Document binding:** a global offset `φ` derived from the document hash is
  added to all four angles. Because CHSH depends only on angle *differences*, a
  common offset leaves the value maximal while making the absolute basis unique
  to the document (anti-replay). See `circuit.bell_angles`.

## Cryptography details

- **Signatures:** NIST ML-DSA-65 (FIPS 204) via `dilithium-py`. The canonical
  signed payload is `{document_hash, chsh_value, timestamp}` serialized with
  sorted keys and compact separators (byte-identical at sign and verify time).
- **Issuer identity:** the ML-DSA keypair is generated once and persisted to
  `backend/issuer_key.json` (git-ignored; secret never committed). Public key +
  fingerprint are served at `/issuer`. Verification requires a certificate's
  public key to match the authority's — rejecting attacker self-signed certs.
- **Provider chain:** `dilithium-py` → `liboqs` (if present) → SHA-256 integrity
  fallback, with strict per-scheme verification (no silent cross-scheme fallback).

## Audit ledger

Each notarization entry commits to the previous entry's hash plus its own fields
(`prev_hash`, `entry_hash`). `/audit` recomputes the chain and reports
`chain_valid`; altering any past record breaks every subsequent hash.

## IBM Granite forensic verdict

`granite.py` calls a local Ollama server (`granite3.3:2b`) with the verification
result + certificate provenance and returns a 2–3 sentence verdict ending in
`VERDICT: AUTHENTIC|FORGED`. On any failure it returns a deterministic rule-based
summary labeled `model: "rule-based"` — never fabricating an AI attribution.

## Benchmark suite layout

```
backend/benchmarks/
  sig_schemes.py    # unified RSA/ECDSA/Ed25519/ML-DSA interface + metadata
  common.py         # timing (median+stdev), tracemalloc memory, CSV/MD/chart writers
  bench_signatures.py  # classical vs post-quantum signatures
  bench_chsh.py        # CHSH runtime/accuracy/success/memory + naive-vs-optimized
  bench_randomness.py  # classical RNG vs quantum sampling throughput
  run_all.py           # orchestrator -> BENCHMARKS.md + results/
```
