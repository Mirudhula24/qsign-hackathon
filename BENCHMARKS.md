# QSIGN Benchmark Report

Reproducible via `python backend/benchmarks/run_all.py`. Raw data in `benchmarks/results/*.csv`; charts as `*.png` alongside.

## Environment
- Generated: 2026-07-30 20:54:08
- Machine: Windows 11 · 16 logical cores, 31.4 GB RAM
- Python: 3.13.14
- Quantum backend: Qiskit AerSimulator (statevector), plus a real IBM `ibm_marrakesh` datapoint recorded separately

## 1. Signatures — classical baselines vs post-quantum (100 KB payload)

| Scheme | Type | Broken by Shor? | Classical sec (bits) | Sign (ms) | Verify (ms) | PubKey (B) | Sig (B) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RSA-2048 | classical | YES | 112 | 0.5918 | 0.0796 | 294 | 256 |
| RSA-3072 | classical | YES | 128 | 1.7133 | 0.1034 | 422 | 384 |
| ECDSA-P256 | classical | YES | 128 | 0.0796 | 0.115 | 91 | 72 |
| Ed25519 | classical | YES | 128 | 0.2611 | 0.2123 | 32 | 64 |
| ML-DSA-65 | post-quantum | no | 192 | 54.5556 | 10.4704 | 1952 | 3309 |

*RSA/ECDSA/Ed25519 are faster and smaller, but every one is broken by Shor's algorithm on a fault-tolerant quantum computer. ML-DSA-65 trades size and speed for quantum resistance — the property QSIGN needs.*

![sign/verify](benchmarks/results/sig_sign_verify_ms.png)

![sizes](benchmarks/results/sig_sizes.png)

## 2. Bell-CHSH pipeline scaling (simulator)

| Dataset | Total shots | Runtime (ms) | Peak mem (KB) | CHSH mean | CHSH stdev | Success rate |
| --- | --- | --- | --- | --- | --- | --- |
| small | 4096 | 144.4185 | 191.91 | 2.8261 | 0.0362 | 1.0 |
| medium | 32768 | 199.5409 | 191.87 | 2.8261 | 0.0156 | 1.0 |
| large | 131072 | 379.014 | 192.48 | 2.8264 | 0.0087 | 1.0 |
| stress | 524288 | 1095.7378 | 193.04 | 2.8299 | 0.0042 | 1.0 |

**Optimization:** naive 581.06 ms -> optimized 216.376 ms = **2.69x faster** (shared simulator instance + single batched job instead of one job per correlator).

*Accuracy improves and the CHSH spread shrinks ~1/sqrt(shots); success rate (fraction of runs above the classical bound of 2.0) is 1.0 from small datasets upward on the simulator.*

![accuracy](benchmarks/results/chsh_accuracy_vs_shots.png)

![optimization](benchmarks/results/chsh_optimization.png)

## 3. Randomness throughput vs certifiability

| Source | Type | Throughput (bits/s) | Device-independent? |
| --- | --- | --- | --- |
| Classical CSPRNG (os.urandom) | classical | 22,399,296,318 | no (trust device/seed) |
| Classical PRNG (Mersenne Twister) | classical | 4,938,298,446 | no (deterministic) |
| Quantum Bell sampling (AerSimulator) | quantum | 326,108 | yes (device-independent) |

*Classical generators win decisively on raw throughput. Quantum's value is orthogonal: a Bell-violating source is the only one whose unpredictability is guaranteed by physics rather than by trusting a chip or a seed. QSIGN uses quantum for the certified proof-of-origin, not for bulk random-bit generation.*


## Reproducibility
- Median of fixed repeats after warmups (see `benchmarks/common.py`).
- Absolute times are host-dependent; relative comparisons and complexity trends are stable across machines.
