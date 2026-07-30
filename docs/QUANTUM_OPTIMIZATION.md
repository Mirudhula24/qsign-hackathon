# Quantum Optimization

QSIGN optimizes its quantum workload at four levels — pipeline, circuit,
measurement, and statistics. Every number here is produced by the reproducible
benchmark suite (`python backend/benchmarks/run_all.py`).

---

## 1. Circuit / transpilation optimization

Before running on real hardware, the abstract CHSH circuit is lowered to the
device's native gate set (IBM Heron: `rz, sx, x, cz`) and connectivity. Higher
`optimization_level` does more gate cancellation and rotation merging, producing
a **shallower** circuit that accumulates **less noise**.

| Opt level | Depth | Total gates | 1-qubit | 2-qubit |
|---|---|---|---|---|
| 0 | 13 | 20 | 19 | 1 |
| 1 | **8** | **10** | 9 | 1 |
| 2 | 8 | 10 | 9 | 1 |
| 3 | 8 | 10 | 9 | 1 |

- **Depth cut 13 → 8 (−38%)**, total gates **20 → 10 (−50%)** just by transpiling well.
- The circuit is **2-qubit-minimal**: a single entangling gate (`cz`) — the theoretical minimum for a Bell state. There is no deeper entangling structure to remove.
- QSIGN's hardware runner (`real_hardware.py`) uses `generate_preset_pass_manager(optimization_level=1)`, which already reaches the minimal depth for this circuit.

*Chart: `benchmarks/results/transpile_optimization.png`.*

## 2. Measurement error mitigation (the headline result)

Real qubits are misread — a true `|0⟩` is sometimes reported as `|1⟩`. This
deflates measured correlations and pulls CHSH below its true value (our real
`ibm_marrakesh` run measured **2.70** vs the ideal **2.828**). We implement
**matrix-inversion readout mitigation**: calibration circuits measure the 2-qubit
assignment matrix, which is inverted to correct the counts.

| Readout error | Ideal | Noisy | Mitigated | Gap recovered | Bell restored? |
|---|---|---|---|---|---|
| 3% | 2.81 | 2.49 | 2.81 | ~99% | — |
| 6% | 2.84 | 2.14 | 2.76 | ~89% | — |
| **10%** | 2.81 | **1.78 (fails!)** | **2.79** | ~98% | **✅ yes** |

- At **10% readout error the raw CHSH falls to 1.78 — below the classical bound, so the Bell violation is lost entirely.** Mitigation restores it to **2.79**, re-establishing the quantum proof.
- Recovery is **~90–99%**, not exactly 100%, because readout mitigation corrects *readout* error only — **gate/decoherence error remains**. We state this explicitly rather than claiming perfect recovery.
- This is precisely the technique that would lift the real-hardware `ibm_marrakesh` result closer to ideal. Implementation: `backend/error_mitigation.py`.

*Chart: `benchmarks/results/error_mitigation.png`.*

## 3. Shot (statistical) optimization

CHSH is a Monte-Carlo estimate; its error shrinks as ~1/√shots. We benchmarked
the trade-off to pick the operating point:

| Shots/correlator | CHSH stdev | Runtime |
|---|---|---|
| 1,024 | 0.036 | 144 ms |
| 8,192 | 0.016 | 200 ms |
| 32,768 | 0.009 | 379 ms |
| 131,072 | 0.004 | 1096 ms |

**8,192 shots is the chosen sweet spot** — a tight estimate (stdev ~0.016) in
~200 ms. Beyond that, we pay linearly in runtime for precision the >2.0 decision
does not need.

## 4. Pipeline / execution optimization

Software-level optimization of how the quantum jobs are dispatched:

- **Batched execution:** all four CHSH correlators (and the 13 correlation-curve
  points) run in a **single** `.run([...])` call instead of one job each.
- **Shared simulator instance** + **single transpile pass** + **result caching**.
- **Measured effect: 2.7× faster** (581 ms → 216 ms). See `chsh_optimization.png`.

---

## Summary

| Level | Technique | Effect |
|---|---|---|
| Circuit | High-level transpilation | depth −38%, gates −50% |
| Measurement | Readout error mitigation | recovers 90–99% of noise gap; restores lost Bell violation |
| Statistics | Shot optimization | tight CHSH in ~200 ms at 8,192 shots |
| Pipeline | Batching + caching | 2.7× faster end-to-end |

All four are honest, measured, and reproducible — no claim of a runtime *quantum
speedup*, only genuine optimization of a quantum workload.
