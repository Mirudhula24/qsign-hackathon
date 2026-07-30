from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
import numpy as np

def measure_chsh_correlator(theta_a, theta_b, shots=8192):
    simulator = AerSimulator()
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.ry(-2 * theta_a, 0)
    qc.ry(-2 * theta_b, 1)
    qc.measure(0, 0)
    qc.measure(1, 1)
    compiled = transpile(qc, simulator)
    job = simulator.run(compiled, shots=shots)
    counts = job.result().get_counts()
    corr = 0
    for outcome, count in counts.items():
        a = int(outcome[1])
        b = int(outcome[0])
        val_a = 1 - 2 * a
        val_b = 1 - 2 * b
        corr += val_a * val_b * count
    return corr / shots

def run_bell_circuit():
    shots = 8192
    a  = 0
    a2 = np.pi / 4
    b  = np.pi / 8
    b2 = 3 * np.pi / 8
    E_ab   = measure_chsh_correlator(a,  b,  shots)
    E_ab2  = measure_chsh_correlator(a,  b2, shots)
    E_a2b  = measure_chsh_correlator(a2, b,  shots)
    E_a2b2 = measure_chsh_correlator(a2, b2, shots)
    S = E_ab - E_ab2 + E_a2b + E_a2b2
    return {
        "chsh_value": round(abs(S), 4),
        "classical_bound": 2.0,
        "quantum_maximum": round(2*np.sqrt(2), 4),
        "bell_violated": abs(S) > 2.0,
        "backend": "AerSimulator",
        "shots": shots,
    }

# --- Correlation sweep -------------------------------------------------------
# Sweeps the measurement-angle difference and records the ACTUAL correlation
# measured on the quantum simulator at each angle, alongside the ideal quantum
# prediction cos(2*delta) and the best a local (classical) hidden-variable model
# can do (a straight line). The measured points hugging the cosine while pulling
# away from the straight line is the visual proof of Bell violation.

_correlation_cache = None

def correlation_curve(points=13, shots=4096):
    global _correlation_cache
    if _correlation_cache is not None:
        return _correlation_cache

    curve = []
    # delta sweeps 0 -> pi/2 (0 deg -> 90 deg): the window where quantum and
    # classical predictions diverge most, and where the CHSH angles live.
    for i in range(points):
        delta = (np.pi / 2) * i / (points - 1)
        measured = measure_chsh_correlator(0.0, delta, shots)   # theta_a = 0
        quantum_theory = float(np.cos(2 * delta))
        # Local hidden-variable prediction: linear from +1 at 0 deg to -1 at 90 deg.
        classical = 1.0 - (4.0 / np.pi) * delta
        curve.append({
            "delta_deg": round(float(np.degrees(delta)), 2),
            "measured": round(float(measured), 4),
            "quantum_theory": round(quantum_theory, 4),
            "classical": round(float(classical), 4),
        })

    bell = run_bell_circuit()
    _correlation_cache = {
        "curve": curve,
        "shots": shots,
        "backend": "AerSimulator",
        "chsh_value": float(bell["chsh_value"]),
        "classical_bound": 2.0,
        "quantum_maximum": round(float(2 * np.sqrt(2)), 4),
        # The four CHSH measurement-angle differences, for annotation on the plot.
        "chsh_angles_deg": [22.5, 67.5],
    }
    return _correlation_cache

if __name__ == "__main__":
    print(run_bell_circuit())
    print(correlation_curve())