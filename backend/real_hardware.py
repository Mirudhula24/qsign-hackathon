from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2 as Sampler
from qiskit import QuantumCircuit
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
import json
import numpy as np

service = QiskitRuntimeService()
backend = service.least_busy(operational=True, simulator=False)
print(f"Using: {backend.name}")

# Bell state circuit
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.ry(-2 * (np.pi/8), 1)
qc.measure(0, 0)
qc.measure(1, 1)

pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
isa_circuit = pm.run(qc)

sampler = Sampler(backend)
job = sampler.run([isa_circuit], shots=1024)
print(f"Job ID: {job.job_id()}")
print("Waiting... this may take 10-40 minutes")
result = job.result()
print("Done!")

saved = {
    "job_id": job.job_id(),
    "backend": backend.name,
    "shots": 1024,
    "note": "Real IBM Quantum hardware - pre-run proof for hackathon demo"
}

with open("demo/cached_ibm_result.json", "w") as f:
    json.dump(saved, f, indent=2)

print("Saved to demo/cached_ibm_result.json")
print(saved)