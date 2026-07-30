# Scalability Analysis

## 1. Two very different scaling profiles

QSIGN has two paths with opposite scaling characteristics — by design.

| Path | Needs quantum HW? | Cost | Scales to |
|---|---|---|---|
| **Issuance (notarize)** | Optional (sim by default) | 1 batched job / document | thousands/day per node |
| **Verification** | **No** | pure classical math | **millions/day, trivially** |

The asymmetry is the point: the expensive quantum step happens **once per
document**, while verification — the operation performed most often — is
**100% classical** and effectively free.

## 2. Issuance scaling (measured)

CHSH pipeline runtime vs shots (simulator, optimized/batched):

| Dataset | Total shots | Runtime | CHSH stdev | Success rate |
|---|---|---|---|---|
| small | 4,096 | 144 ms | 0.036 | 1.00 |
| medium | 32,768 | 200 ms | 0.016 | 1.00 |
| large | 131,072 | 379 ms | 0.009 | 1.00 |
| stress | 524,288 | 1096 ms | 0.004 | 1.00 |

- **Runtime is ~linear in shots** with a fixed overhead — expected for sampling.
- **Accuracy improves as ~1/√shots** (stdev 0.036 → 0.004), the standard statistical convergence of a Monte-Carlo estimator.
- **8,192 shots/correlator is the sweet spot**: a tight estimate (stdev ~0.016) in ~200 ms. More shots buy precision we don't need for a >2.0 decision.

## 3. Throughput levers

- **Batching:** all four CHSH correlators run in a single job (already implemented) — a **2.7× speedup** over the naive one-job-per-correlator approach.
- **Caching:** repeated/proof visualizations are cached (correlation curve served from memory after first compute).
- **Horizontal scale:** issuance is embarrassingly parallel — N simulator workers = N× throughput. Real-hardware jobs can be queued and batched.
- **Amortized quantum:** for very high volume, one certified-randomness batch can seed many certificates (a randomness-beacon model), decoupling document rate from QPU rate.

## 4. Real-hardware scaling reality

- A real IBM job (`ibm_marrakesh`) takes **minutes** end-to-end (queue + execution), not milliseconds. This does **not** bottleneck the product because:
  1. The default path is the simulator (sub-second).
  2. Real-hardware certification is a **premium, verifiable tier** (public job ID) for the highest-value records.
  3. Verification never touches hardware.
- As quantum hardware improves (lower noise, shorter queues, dedicated access), the real-hardware tier scales with it — QSIGN inherits every hardware advance for free.

## 5. Storage & ledger scaling

- A certificate is a few KB of JSON; a PDF ~22 KB. Linear in document count, negligible.
- The audit ledger is an append-only hash chain: **O(1)** to append, **O(n)** to fully re-verify (or O(1) incrementally). For very large ledgers, periodic Merkle checkpoints would give O(log n) inclusion proofs — noted as future work.

## 6. Bottlenecks and mitigations (honest)

| Bottleneck | Impact | Mitigation |
|---|---|---|
| Real-QPU latency/cost | High per-cert | Simulator default; premium HW tier; randomness beacon |
| ML-DSA sign time (~55 ms) | Moderate | Amortized; parallelizable; dwarfed by any HW job |
| Single-process issuer key | Availability | Move to KMS/HSM for production (see limitations) |
| Ledger full re-verification | O(n) | Merkle checkpoints (future) |
