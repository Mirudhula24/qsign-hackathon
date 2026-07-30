"""
Bell-CHSH quantum circuits for QSIGN.

Optimizations over the original implementation (see docs/TECHNICAL.md):
  1. A single AerSimulator instance is created once and reused, instead of one
     per correlator measurement (constructing the simulator dominated runtime).
  2. The four CHSH correlators — and the thirteen correlation-curve points — are
     executed as ONE batched job (a list of circuits in a single .run() call)
     instead of N sequential jobs, removing per-job scheduling overhead.
  3. Circuits are transpiled in a single pass.
  4. Results (correlation curve) are cached.
A naive reference implementation is kept below for the benchmark suite to
measure the speedup against.
"""

import hashlib
import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# One reusable simulator for the whole process (optimization #1).
_SIM = AerSimulator()

# Optimal CHSH configuration -> Tsirelson maximum 2*sqrt(2).
_BASE_A, _BASE_A2 = 0.0, np.pi / 4
_BASE_B, _BASE_B2 = np.pi / 8, 3 * np.pi / 8


# --- Document-bound measurement angles --------------------------------------
# All four angles are rotated by one document-derived offset phi. CHSH depends
# only on angle DIFFERENCES, so a common offset keeps the value maximal while
# binding the absolute basis to the document hash (anti-replay).

def derive_phi(document_hash):
    """Map a document hash to a basis-rotation offset in [0, pi/2)."""
    if not document_hash:
        return 0.0
    hb = bytes.fromhex(document_hash)
    frac = int.from_bytes(hb[:2], "big") / 65535.0
    return frac * (np.pi / 2)


def bell_angles(document_hash=None):
    """Return the four CHSH angles (a, a2, b, b2), document-bound when a hash
    is given. Preserves the optimal differences, so CHSH stays maximal."""
    phi = derive_phi(document_hash)
    return phi + _BASE_A, phi + _BASE_A2, phi + _BASE_B, phi + _BASE_B2


def _chsh_circuit(theta_a, theta_b):
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.ry(-2 * theta_a, 0)
    qc.ry(-2 * theta_b, 1)
    qc.measure(0, 0)
    qc.measure(1, 1)
    return qc


def _correlator_from_counts(counts, shots):
    """<Z x Z> from a 2-bit counts dict. Only up to four outcomes, so this is a
    tight loop rather than a numpy vectorization (vectorizing four values would
    add overhead, not remove it)."""
    corr = 0
    for outcome, n in counts.items():
        a = int(outcome[-1])   # qubit 0 (rightmost bit)
        b = int(outcome[-2])   # qubit 1
        corr += (1 - 2 * a) * (1 - 2 * b) * n
    return corr / shots


def _run_batched(angle_pairs, shots):
    """Execute all (theta_a, theta_b) circuits as a single batched job.
    Returns a list of counts dicts, one per pair (optimization #2 and #3)."""
    circuits = [_chsh_circuit(ta, tb) for ta, tb in angle_pairs]
    compiled = transpile(circuits, _SIM)
    result = _SIM.run(compiled, shots=shots).result()
    counts = result.get_counts()
    if isinstance(counts, dict):        # single circuit -> normalize to list
        counts = [counts]
    return counts


def measure_chsh_correlator(theta_a, theta_b, shots=8192):
    """Single correlator (kept for API compatibility / spot checks)."""
    counts = _run_batched([(theta_a, theta_b)], shots)[0]
    return _correlator_from_counts(counts, shots)


def run_bell_circuit(document_hash=None, shots=8192):
    a, a2, b, b2 = bell_angles(document_hash)
    pairs = [(a, b), (a, b2), (a2, b), (a2, b2)]
    counts = _run_batched(pairs, shots)               # one batched job
    E_ab, E_ab2, E_a2b, E_a2b2 = (_correlator_from_counts(c, shots) for c in counts)
    S = E_ab - E_ab2 + E_a2b + E_a2b2
    return {
        "chsh_value": round(abs(S), 4),
        "classical_bound": 2.0,
        "quantum_maximum": round(float(2 * np.sqrt(2)), 4),
        "bell_violated": abs(S) > 2.0,
        "backend": "AerSimulator",
        "shots": shots,
        "document_bound": document_hash is not None,
        "angles": {
            "theta_a":  round(float(a), 6),
            "theta_a2": round(float(a2), 6),
            "theta_b":  round(float(b), 6),
            "theta_b2": round(float(b2), 6),
        },
    }


# --- Correlation sweep -------------------------------------------------------
_correlation_cache = None

def correlation_curve(points=13, shots=4096):
    global _correlation_cache
    if _correlation_cache is not None:            # optimization #4: cache
        return _correlation_cache

    deltas = [(np.pi / 2) * i / (points - 1) for i in range(points)]
    counts = _run_batched([(0.0, d) for d in deltas], shots)   # one batched job
    curve = []
    for d, c in zip(deltas, counts):
        measured = _correlator_from_counts(c, shots)
        curve.append({
            "delta_deg": round(float(np.degrees(d)), 2),
            "measured": round(float(measured), 4),
            "quantum_theory": round(float(np.cos(2 * d)), 4),
            "classical": round(float(1.0 - (4.0 / np.pi) * d), 4),
        })

    bell = run_bell_circuit()
    _correlation_cache = {
        "curve": curve,
        "shots": shots,
        "backend": "AerSimulator",
        "chsh_value": float(bell["chsh_value"]),
        "classical_bound": 2.0,
        "quantum_maximum": round(float(2 * np.sqrt(2)), 4),
        "chsh_angles_deg": [22.5, 67.5],
    }
    return _correlation_cache


# --- Naive reference (benchmark baseline only) -------------------------------
# The original one-simulator-per-call, one-job-per-correlator implementation.
# Used by backend/benchmarks/bench_chsh.py to quantify the optimization.

def run_bell_circuit_naive(document_hash=None, shots=8192):
    a, a2, b, b2 = bell_angles(document_hash)

    def corr(ta, tb):
        sim = AerSimulator()                       # fresh simulator each call
        qc = _chsh_circuit(ta, tb)
        counts = sim.run(transpile(qc, sim), shots=shots).result().get_counts()
        return _correlator_from_counts(counts, shots)

    S = corr(a, b) - corr(a, b2) + corr(a2, b) + corr(a2, b2)
    return abs(S)


if __name__ == "__main__":
    print(run_bell_circuit())
    print(correlation_curve())
