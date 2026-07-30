"""
Run the Bell-CHSH experiment on real IBM Quantum hardware and cache the result
so the QSIGN app can display verifiable hardware provenance.

A full CHSH test needs FOUR correlators (four measurement-angle pairs), so this
submits all four circuits as a single batched job -- one queue wait, not four.

Usage
-----
  python real_hardware.py --dry-run           # validate on AerSimulator (no IBM account, instant)
  python real_hardware.py --run                # submit to least-busy real IBM backend (10-40 min)
  python real_hardware.py --retrieve <job_id>  # fetch a previously-run job's counts

Writes ../demo/cached_ibm_result.json, which the backend loads at /hardware.
The QSIGN certificate itself never depends on this file -- it is provenance
evidence for the demo, populated only by a genuine run.
"""

import os
import sys
import json
import argparse
import numpy as np

# Same CHSH measurement angles as the simulator path (backend/circuit.py).
A, A2 = 0.0, np.pi / 4
B, B2 = np.pi / 8, 3 * np.pi / 8
ANGLE_PAIRS = [("E_ab", A, B), ("E_ab2", A, B2), ("E_a2b", A2, B), ("E_a2b2", A2, B2)]

CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", "demo", "cached_ibm_result.json")


def build_circuit(theta_a, theta_b):
    from qiskit import QuantumCircuit
    qc = QuantumCircuit(2, 2)
    qc.h(0)
    qc.cx(0, 1)
    qc.ry(-2 * theta_a, 0)
    qc.ry(-2 * theta_b, 1)
    qc.measure(0, 0)
    qc.measure(1, 1)
    return qc


def correlator_from_counts(counts):
    """<Z⊗Z> from a counts dict keyed by 2-bit strings 'q1q0'."""
    total = sum(counts.values())
    corr = 0
    for outcome, n in counts.items():
        a = int(outcome[-1])   # qubit 0 = rightmost bit
        b = int(outcome[-2])   # qubit 1
        corr += (1 - 2 * a) * (1 - 2 * b) * n
    return corr / total


def chsh_from_correlators(c):
    S = c["E_ab"] - c["E_ab2"] + c["E_a2b"] + c["E_a2b2"]
    return abs(S)


def save_cache(payload):
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"Saved -> {os.path.abspath(CACHE_PATH)}")


def assemble_result(source, backend_name, job_id, shots, counts_by_key):
    correlators = {k: round(correlator_from_counts(v), 4) for k, v in counts_by_key.items()}
    chsh = round(chsh_from_correlators(correlators), 4)
    import time
    return {
        "status": "complete",
        "source": source,                       # "ibm_hardware" or "simulator_dryrun"
        "backend": backend_name,
        "job_id": job_id,
        "shots": shots,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "chsh_value": chsh,
        "classical_bound": 2.0,
        "quantum_maximum": round(float(2 * np.sqrt(2)), 4),
        "bell_violated": chsh > 2.0,
        "correlators": correlators,
        "counts": {k: dict(v) for k, v in counts_by_key.items()},
        "note": ("Real IBM Quantum hardware run." if source == "ibm_hardware"
                 else "Local AerSimulator dry-run for validation (NOT real hardware)."),
    }


def run_dry(shots=4096):
    """Validate the exact CHSH pipeline on AerSimulator -- proves the math and
    the counts parsing before spending real quantum time."""
    from qiskit import transpile
    from qiskit_aer import AerSimulator
    sim = AerSimulator()
    counts_by_key = {}
    for key, ta, tb in ANGLE_PAIRS:
        qc = transpile(build_circuit(ta, tb), sim)
        counts_by_key[key] = sim.run(qc, shots=shots).result().get_counts()
    result = assemble_result("simulator_dryrun", "AerSimulator", "dry-run-local", shots, counts_by_key)
    save_cache(result)
    print(json.dumps({k: result[k] for k in ("source", "chsh_value", "bell_violated", "correlators")}, indent=2))
    return result


def run_hardware(shots=4096):
    """Submit the four CHSH circuits as one batched job to a real IBM backend."""
    from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

    service = QiskitRuntimeService()
    backend = service.least_busy(operational=True, simulator=False)
    print(f"Using real backend: {backend.name}")

    pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
    isa = [pm.run(build_circuit(ta, tb)) for _, ta, tb in ANGLE_PAIRS]

    sampler = Sampler(backend)
    job = sampler.run(isa, shots=shots)          # one job, four pubs
    print(f"Job ID: {job.job_id()}  |  waiting (10-40 min)...")
    res = job.result()

    counts_by_key = {}
    for i, (key, _, _) in enumerate(ANGLE_PAIRS):
        # Access the single classical register's counts regardless of its name.
        databin = res[i].data
        bitarray = list(databin.values())[0]
        counts_by_key[key] = bitarray.get_counts()

    result = assemble_result("ibm_hardware", backend.name, job.job_id(), shots, counts_by_key)
    save_cache(result)
    print(f"Real-hardware CHSH = {result['chsh_value']}  (bell_violated={result['bell_violated']})")
    return result


def retrieve(job_id):
    """Fetch a previously-submitted job's counts and cache them."""
    from qiskit_ibm_runtime import QiskitRuntimeService
    service = QiskitRuntimeService()
    job = service.job(job_id)
    backend_name = job.backend().name if callable(getattr(job, "backend", None)) else "unknown"
    res = job.result()

    counts_by_key = {}
    n = min(len(ANGLE_PAIRS), len(res))
    for i in range(n):
        key = ANGLE_PAIRS[i][0]
        counts_by_key[key] = list(res[i].data.values())[0].get_counts()

    if len(counts_by_key) < 4:
        print(f"WARNING: job returned {len(counts_by_key)} circuit(s); a full CHSH needs 4. "
              f"Cached partial result.")
        import time
        payload = {
            "status": "partial", "source": "ibm_hardware", "backend": backend_name,
            "job_id": job_id, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "counts": {k: dict(v) for k, v in counts_by_key.items()},
            "correlators": {k: round(correlator_from_counts(v), 4) for k, v in counts_by_key.items()},
            "note": "Partial run retrieved by job id -- fewer than 4 correlators.",
        }
        save_cache(payload)
        return payload

    result = assemble_result("ibm_hardware", backend_name, job_id, None, counts_by_key)
    save_cache(result)
    print(f"Real-hardware CHSH = {result['chsh_value']}")
    return result


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Run Bell-CHSH on IBM Quantum hardware.")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--dry-run", action="store_true", help="AerSimulator validation, no IBM account")
    g.add_argument("--run", action="store_true", help="submit to real IBM hardware")
    g.add_argument("--retrieve", metavar="JOB_ID", help="fetch a prior job's counts")
    ap.add_argument("--shots", type=int, default=4096)
    args = ap.parse_args()

    if args.retrieve:
        retrieve(args.retrieve)
    elif args.run:
        run_hardware(args.shots)
    else:
        if not args.dry_run:
            print("No mode given; defaulting to --dry-run.\n")
        run_dry(args.shots)
