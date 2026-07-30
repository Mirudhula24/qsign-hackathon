"""
QSIGN benchmark orchestrator — one reproducible command.

    python backend/benchmarks/run_all.py

Runs the signature, CHSH-pipeline, and randomness benchmarks; writes CSVs and
PNG charts to benchmarks/results/; and regenerates BENCHMARKS.md at the repo
root. Deterministic warmups/repeats make results reproducible run to run
(absolute timings depend on the host machine, which is recorded in the header).
"""

import os
import sys
import time
import platform

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from benchmarks import bench_signatures, bench_chsh, bench_randomness
from benchmarks.common import RESULTS_DIR, ensure_results_dir

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPORT_PATH = os.path.join(REPO_ROOT, "BENCHMARKS.md")


def _host_header():
    try:
        import psutil
        cores = psutil.cpu_count(logical=True)
        mem = round(psutil.virtual_memory().total / (1024 ** 3), 1)
        host = f"{cores} logical cores, {mem} GB RAM"
    except Exception:
        host = "unknown"
    return (
        f"- Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"- Machine: {platform.system()} {platform.release()} · {host}\n"
        f"- Python: {platform.python_version()}\n"
        f"- Quantum backend: Qiskit AerSimulator (statevector), plus a real "
        f"IBM `ibm_marrakesh` datapoint recorded separately\n"
    )


def main():
    ensure_results_dir()
    print("Running signature benchmark...")
    sig_rows = bench_signatures.run()
    print("Running CHSH pipeline benchmark...")
    chsh_rows, opt = bench_chsh.run()
    print("Running randomness benchmark...")
    rnd_rows = bench_randomness.run()

    report = [
        "# QSIGN Benchmark Report",
        "",
        "Reproducible via `python backend/benchmarks/run_all.py`. Raw data in "
        "`benchmarks/results/*.csv`; charts as `*.png` alongside.",
        "",
        "## Environment",
        _host_header(),
        "## 1. " + bench_signatures.summary_markdown(sig_rows).lstrip("# "),
        "![sign/verify](benchmarks/results/sig_sign_verify_ms.png)",
        "",
        "![sizes](benchmarks/results/sig_sizes.png)",
        "",
        "## 2. " + bench_chsh.summary_markdown(chsh_rows, opt).lstrip("# "),
        "![accuracy](benchmarks/results/chsh_accuracy_vs_shots.png)",
        "",
        "![optimization](benchmarks/results/chsh_optimization.png)",
        "",
        "## 3. " + bench_randomness.summary_markdown(rnd_rows).lstrip("# "),
        "",
        "## Reproducibility",
        "- Median of fixed repeats after warmups (see `benchmarks/common.py`).",
        "- Absolute times are host-dependent; relative comparisons and complexity "
        "trends are stable across machines.",
        "",
    ]
    with open(REPORT_PATH, "w") as f:
        f.write("\n".join(report))
    print(f"\nWrote {REPORT_PATH}")
    print(f"Artifacts in {os.path.abspath(RESULTS_DIR)}")


if __name__ == "__main__":
    main()
