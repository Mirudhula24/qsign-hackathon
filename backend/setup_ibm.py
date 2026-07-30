"""
One-time IBM Quantum credential setup.

Your API token and instance CRN are SECRETS. This script never stores them in
the repo -- it hands them to Qiskit's save_account(), which writes them to
~/.qiskit/qiskit-ibm.json in your home directory (outside this project, never
committed). After running this once, real_hardware.py --run just works.

Usage
-----
  python backend/setup_ibm.py                 # prompts you for token + instance
  QISKIT_IBM_TOKEN=... QISKIT_IBM_INSTANCE=... python backend/setup_ibm.py   # non-interactive

Get both values from https://quantum.ibm.com/  ->  your dashboard.
"""

import os
import sys
from getpass import getpass


def main():
    token = os.environ.get("QISKIT_IBM_TOKEN") or getpass("IBM Quantum API token (input hidden): ").strip()
    if not token:
        print("No token provided. Aborting."); sys.exit(1)

    instance = os.environ.get("QISKIT_IBM_INSTANCE")
    if instance is None:
        instance = input("Instance CRN (from dashboard; press Enter to skip): ").strip()
    instance = instance or None

    try:
        from qiskit_ibm_runtime import QiskitRuntimeService
    except ImportError:
        print("qiskit-ibm-runtime is not installed. Run: pip install -r requirements.txt")
        sys.exit(1)

    save_kwargs = dict(
        channel="ibm_quantum_platform",
        token=token,
        set_as_default=True,
        overwrite=True,
    )
    if instance:
        save_kwargs["instance"] = instance

    print("\nSaving account to ~/.qiskit/qiskit-ibm.json (outside the repo)...")
    QiskitRuntimeService.save_account(**save_kwargs)

    # Connectivity check: prove the credentials work and list a few backends.
    print("Verifying credentials...")
    service = QiskitRuntimeService()
    backends = service.backends(operational=True, simulator=False)
    print(f"Connected. {len(backends)} real backend(s) available:")
    for b in backends[:8]:
        try:
            print(f"  - {b.name:20s}  qubits={b.num_qubits}")
        except Exception:
            print(f"  - {b.name}")

    try:
        lb = service.least_busy(operational=True, simulator=False)
        print(f"\nLeast busy right now: {lb.name}")
    except Exception:
        pass

    print("\nDone. You can now run:  python backend/real_hardware.py --run")


if __name__ == "__main__":
    main()
