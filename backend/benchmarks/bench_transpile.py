"""
Benchmark: circuit transpilation optimization for the CHSH circuit.

Transpilation lowers an abstract circuit onto a real device's native gate set
and connectivity. Higher optimization levels do more work (gate cancellation,
rotation merging, routing) to reduce depth and gate count — which directly
reduces the noise a circuit accumulates on hardware. We compile the CHSH circuit
to a Heron-like native basis (rz, sx, x, cz) at optimization_level 0..3 and
report circuit depth, total gates, and two-qubit (cz) count.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import numpy as np
from qiskit import QuantumCircuit, transpile
from benchmarks.common import write_csv, markdown_table, bar_chart

BASIS = ["id", "rz", "sx", "x", "cz"]      # IBM Heron-family native gates
COUPLING = [[0, 1], [1, 0]]


def _chsh_circuit():
    a, b = 0.0, np.pi / 8
    qc = QuantumCircuit(2, 2)
    qc.h(0); qc.cx(0, 1)
    qc.ry(-2 * a, 0); qc.ry(-2 * b, 1)
    qc.measure(0, 0); qc.measure(1, 1)
    return qc


def run():
    qc = _chsh_circuit()
    rows = []
    for level in (0, 1, 2, 3):
        t = transpile(qc, basis_gates=BASIS, coupling_map=COUPLING,
                      optimization_level=level, seed_transpiler=7)
        ops = t.count_ops()
        two_q = sum(v for k, v in ops.items() if k in ("cz", "cx", "ecr"))
        one_q = sum(v for k, v in ops.items() if k in ("rz", "sx", "x", "id"))
        rows.append({
            "optimization_level": level,
            "depth": t.depth(),
            "total_gates": sum(ops.values()) - ops.get("measure", 0),
            "one_qubit_gates": one_q,
            "two_qubit_gates": two_q,
        })
    write_csv("transpile_optimization.csv", rows, list(rows[0].keys()))

    labels = [f"level {r['optimization_level']}" for r in rows]
    bar_chart("transpile_optimization.png", labels,
              [("depth", [r["depth"] for r in rows]),
               ("total 1q gates", [r["one_qubit_gates"] for r in rows]),
               ("2q gates", [r["two_qubit_gates"] for r in rows])],
              "count", "CHSH circuit after transpilation (Heron basis)")
    return rows


def summary_markdown(rows):
    tbl = markdown_table(rows, [
        ("optimization_level", "Opt level"), ("depth", "Depth"),
        ("total_gates", "Total gates"), ("one_qubit_gates", "1-qubit gates"),
        ("two_qubit_gates", "2-qubit gates"),
    ])
    best = min(rows, key=lambda r: (r["depth"], r["total_gates"]))
    worst = rows[0]
    dd = worst["depth"] - best["depth"]
    return (
        "### Transpilation optimization (CHSH circuit, Heron-native basis)\n\n" + tbl +
        f"\n\n*Optimization level {best['optimization_level']} produces the shallowest "
        f"circuit (depth {best['depth']} vs {worst['depth']} at level 0, a reduction of "
        f"{dd}). Fewer gates and lower depth = less accumulated hardware noise, which "
        "is why QSIGN transpiles at a high optimization level before running on real "
        "hardware. The circuit is already 2-qubit-minimal (a single entangling gate).*\n"
    )


if __name__ == "__main__":
    print(summary_markdown(run()))
