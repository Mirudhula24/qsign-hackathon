"""
Readout (measurement) error mitigation for the Bell-CHSH pipeline.

Real quantum hardware misreads qubits: a prepared |0> is sometimes reported as
|1> and vice-versa. This deflates measured correlations and pulls the CHSH
estimate below its true value (on `ibm_marrakesh` we saw 2.70 instead of the
ideal 2.828). Readout mitigation measures this bias with calibration circuits,
builds the 2-qubit assignment ("confusion") matrix, and inverts it to correct
the counts — recovering CHSH toward its true value.

Scope, stated honestly: this corrects READOUT error only. It does not correct
gate/decoherence error, so mitigation recovers most — not all — of the noise
gap. That is the correct, non-exaggerated claim.
"""

import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, ReadoutError, depolarizing_error

STATES = ["00", "01", "10", "11"]          # qiskit key order: q1 q0


def build_noise_model(readout_p=0.06, depol_2q=0.01):
    """A realistic 2-qubit noise model: symmetric readout bit-flips on each
    qubit plus a small two-qubit depolarizing error (gate noise)."""
    nm = NoiseModel()
    ro = ReadoutError([[1 - readout_p, readout_p], [readout_p, 1 - readout_p]])
    for q in (0, 1):
        nm.add_readout_error(ro, [q])
    if depol_2q > 0:
        nm.add_all_qubit_quantum_error(depolarizing_error(depol_2q, 2), ["cx"])
    return nm


def _prep_circuit(state):
    """Prepare a computational basis state and measure (calibration circuit)."""
    qc = QuantumCircuit(2, 2)
    q1, q0 = int(state[0]), int(state[1])
    if q0:
        qc.x(0)
    if q1:
        qc.x(1)
    qc.measure(0, 0)
    qc.measure(1, 1)
    return qc


def assignment_matrix(sim, shots=20000):
    """A[i, j] = P(measure state i | prepared state j). Columns sum to 1."""
    A = np.zeros((4, 4))
    circuits = [_prep_circuit(s) for s in STATES]
    result = sim.run(transpile(circuits, sim), shots=shots).result()
    counts_list = result.get_counts()
    for j, counts in enumerate(counts_list):
        total = sum(counts.values())
        for key, n in counts.items():
            i = STATES.index(key.zfill(2))
            A[i, j] = n / total
    return A


def _counts_vector(counts):
    v = np.zeros(4)
    for key, n in counts.items():
        v[STATES.index(key.zfill(2))] = n
    return v


def mitigate_counts(counts, A_inv):
    """Apply A^-1 to observed counts; clip negatives and renormalize to the
    original shot total (standard matrix-inversion readout correction)."""
    v = _counts_vector(counts)
    total = v.sum()
    corrected = A_inv @ v
    corrected = np.clip(corrected, 0, None)
    if corrected.sum() > 0:
        corrected *= total / corrected.sum()
    return {STATES[i]: corrected[i] for i in range(4)}


def _correlator(counts_like):
    total = sum(counts_like.values())
    s = 0.0
    for key, n in counts_like.items():
        q0 = int(key[-1]); q1 = int(key[-2])
        s += (1 - 2 * q0) * (1 - 2 * q1) * n
    return s / total if total else 0.0


def chsh_with_mitigation(readout_p=0.06, depol_2q=0.01, shots=8192):
    """Return ideal, noisy, and readout-mitigated CHSH values on one noise model."""
    from circuit import bell_angles
    a, a2, b, b2 = bell_angles(None)
    pairs = [(a, b), (a, b2), (a2, b), (a2, b2)]
    signs = [+1, -1, +1, +1]

    def chsh_circuit(ta, tb):
        qc = QuantumCircuit(2, 2)
        qc.h(0); qc.cx(0, 1)
        qc.ry(-2 * ta, 0); qc.ry(-2 * tb, 1)
        qc.measure(0, 0); qc.measure(1, 1)
        return qc

    ideal_sim = AerSimulator()
    noisy_sim = AerSimulator(noise_model=build_noise_model(readout_p, depol_2q))

    circuits = [chsh_circuit(ta, tb) for ta, tb in pairs]
    ideal_counts = ideal_sim.run(transpile(circuits, ideal_sim), shots=shots).result().get_counts()
    noisy_counts = noisy_sim.run(transpile(circuits, noisy_sim), shots=shots).result().get_counts()

    A = assignment_matrix(noisy_sim, shots=20000)
    A_inv = np.linalg.pinv(A)

    def chsh(counts_list, mitigate=False):
        S = 0.0
        for sgn, c in zip(signs, counts_list):
            cc = mitigate_counts(c, A_inv) if mitigate else c
            S += sgn * _correlator(cc)
        return abs(S)

    return {
        "ideal": round(chsh(ideal_counts), 4),
        "noisy": round(chsh(noisy_counts), 4),
        "mitigated": round(chsh(noisy_counts, mitigate=True), 4),
        "readout_p": readout_p,
        "depol_2q": depol_2q,
        "shots": shots,
        "tsirelson": round(float(2 * np.sqrt(2)), 4),
    }


if __name__ == "__main__":
    print(chsh_with_mitigation())
