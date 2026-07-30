# Where Quantum Helps — and Where It Doesn't

*An honest analysis. QSIGN is not a quantum-speedup project, and we do not claim it is.*

## 1. What kind of advantage is this?

Quantum advantage comes in three broad flavours:

| Flavour | Example | Is it QSIGN? |
|---|---|---|
| **Computational speedup** | Shor's factoring, Grover's search, some optimization | ❌ No |
| **Sampling / simulation** | Simulating quantum chemistry | ❌ No |
| **Certification / security** | Device-independent randomness, QKD, Bell tests | ✅ **Yes** |

QSIGN's advantage is **certification**: a Bell–CHSH violation is a physical fact that **no classical process can reproduce**, and that fact is used as a *proof of origin*. We are explicit about this because claiming a runtime speedup here would be false, and reviewers rightly probe for it.

## 2. The bottleneck quantum addresses

Every classical trust system ultimately rests on a **secret that can be copied or a device that must be trusted**:

- A private key in a file (RSA/ECDSA) — steal it, forge anything.
- A hardware RNG or seed — you must *trust* the chip vendor that its output is unpredictable.

The bottleneck is **trust**. Classical randomness is unpredictable only *computationally* or *by assumption*. QSIGN replaces that assumption with a **device-independent physical guarantee**: if the measured CHSH value exceeds 2.0, the outcomes were provably not pre-determined — a result of Bell's theorem, independent of how the hardware was built. This is the same principle underpinning device-independent QKD and certified random-number generation.

## 3. Where classical is sufficient (and we say so)

| Task | Best tool | Why |
|---|---|---|
| Hashing / integrity fingerprint | **Classical (SHA-256)** | Fast, collision-resistant; quantum offers no real gain (Grover only halves security) |
| Bulk random-bit generation | **Classical CSPRNG** | ~22 Gbit/s vs quantum's ~0.3 Mbit/s in our benchmark — classical wins by ~68,000× |
| Signing speed & size (today) | **Classical ECDSA/Ed25519** | Sub-millisecond, ~64-byte signatures |

QSIGN uses classical tools for exactly these jobs. Quantum is applied **only** where it is the sole option: certifying origin.

## 4. Where quantum begins to outperform

The crossover is not about speed — it is about **guarantee strength as the adversary grows**:

- **Against a classical forger:** classical PKI is already strong. Quantum adds a *physical* origin proof classical cannot provide at all (not "faster", but "possible vs impossible").
- **Against a quantum adversary (the decisive case):** a future fault-tolerant quantum computer running **Shor's algorithm breaks RSA, ECDSA, and Ed25519 outright** — see `CLASSICAL_COMPARISON.md`. QSIGN's ML-DSA-65 signatures and physics-based origin proof are unaffected. This is where classical trust collapses and QSIGN's approach becomes not just better but *necessary*.

The relevant scaling advantage is therefore **security longevity**, not throughput: "harvest-now, decrypt-later" attacks mean documents signed classically today are vulnerable the moment large quantum computers arrive; QSIGN certificates are not.

## 5. Current hardware limitations (stated plainly)

- **Noise:** on real hardware (`ibm_marrakesh`, 156-qubit Heron r2) we measured **CHSH = 2.70**, below the ideal 2.828 Tsirelson bound because of gate/readout noise. It still clears the classical bound of 2.0 — which is all the proof requires — but noise reduces the margin.
- **Queue latency & cost:** a real-hardware job takes minutes (queue + execution), so QSIGN issues most certificates from the simulator and offers real-hardware certification as a premium, verifiable tier.
- **No loophole-free guarantee:** our Bell test is a *proof-of-quantum-execution* for notarization, not a loophole-free fundamental-physics experiment. We do not overstate it.

## 6. Why a hybrid architecture is the right call

QSIGN is deliberately **hybrid**: quantum for the one thing only it can do (certified origin), classical for everything it does better (hashing, post-quantum signing, verification, storage). Verification needs **no quantum hardware at all** — it is pure classical math — so the system scales to millions of checks while the quantum layer is used sparingly and where it is irreplaceable. This mirrors how QKD systems are deployed in practice: a thin quantum layer providing a guarantee, wrapped in a classical system that does the heavy lifting.

**Bottom line:** the quantum advantage here is real but specific — *device-independent certification and post-quantum longevity*, not runtime. Framing it any other way would be dishonest, and the hybrid design is what makes it practical.
