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

def compute_correlation_curve(shots=8192):
    """Compute correlation curve by varying angle_b while holding angle_a fixed."""
    angle_a = 0
    angle_b_values = np.linspace(0, np.pi, 16)  # 16 points from 0 to π
    correlations = []
    for angle_b in angle_b_values:
        corr = measure_chsh_correlator(angle_a, angle_b, shots)
        correlations.append({"angle": round(float(angle_b * 180 / np.pi), 1), "value": round(corr, 4)})
    return correlations

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
        "angles": {"a": a, "a2": a2, "b": b, "b2": b2},
        "correlation_curve": compute_correlation_curve(shots),
    }

if __name__ == "__main__":
    print(run_bell_circuit())