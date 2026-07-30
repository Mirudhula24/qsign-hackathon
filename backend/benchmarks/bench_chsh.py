"""
Benchmark: the Bell-CHSH quantum-origin pipeline.

Measures how the certified-randomness proof behaves as we scale the number of
measurement shots (the "dataset size" for a sampling problem): runtime, accuracy
(the CHSH estimate and its statistical spread), success rate (fraction of runs
that clear the classical bound of 2.0), and peak memory. Also quantifies the
optimized batched implementation against the naive one-job-per-correlator
version.
"""

import os
import sys
import statistics
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import numpy as np
from circuit import run_bell_circuit, run_bell_circuit_naive
from benchmarks.common import time_ms, peak_memory_kb, write_csv, markdown_table, line_chart, bar_chart

# Dataset sizes = shots per correlator.
DATASETS = {
    "small": 1024,
    "medium": 8192,
    "large": 32768,
    "stress": 131072,
}
TSIRELSON = round(float(2 * np.sqrt(2)), 4)


def run():
    rows = []
    for label, shots in DATASETS.items():
        # Accuracy / success across independent repeats.
        reps = 25 if shots <= 8192 else (12 if shots <= 32768 else 6)
        chsh_vals = [run_bell_circuit(shots=shots)["chsh_value"] for _ in range(reps)]
        success = sum(1 for v in chsh_vals if v > 2.0) / len(chsh_vals)

        t = time_ms(lambda shots=shots: run_bell_circuit(shots=shots),
                    repeats=(10 if shots <= 32768 else 4), warmup=2)
        mem = peak_memory_kb(lambda shots=shots: run_bell_circuit(shots=shots))

        rows.append({
            "dataset": label,
            "shots_per_correlator": shots,
            "total_shots": shots * 4,
            "runtime_ms": t["median_ms"],
            "runtime_stdev_ms": t["stdev_ms"],
            "peak_mem_kb": mem,
            "chsh_mean": round(statistics.fmean(chsh_vals), 4),
            "chsh_stdev": round(statistics.pstdev(chsh_vals), 4),
            "tsirelson_bound": TSIRELSON,
            "success_rate": round(success, 3),
            "repeats": reps,
        })

    write_csv("chsh_scaling.csv", rows, list(rows[0].keys()))

    xs = [r["shots_per_correlator"] for r in rows]
    line_chart("chsh_accuracy_vs_shots.png", xs,
               [("CHSH estimate", [r["chsh_mean"] for r in rows])],
               "shots per correlator", "CHSH value",
               "CHSH accuracy vs shots (more shots -> tighter estimate)",
               hlines=[(2.0, "classical bound"), (TSIRELSON, "Tsirelson bound")])
    line_chart("chsh_stdev_vs_shots.png", xs,
               [("stdev of CHSH", [r["chsh_stdev"] for r in rows])],
               "shots per correlator", "standard deviation",
               "Statistical spread shrinks ~1/sqrt(shots)")
    line_chart("chsh_runtime_vs_shots.png", xs,
               [("runtime (ms)", [r["runtime_ms"] for r in rows])],
               "shots per correlator", "milliseconds",
               "Pipeline runtime vs shots (optimized, batched)")

    # Optimized vs naive at the production shot count.
    opt = time_ms(lambda: run_bell_circuit(shots=8192), repeats=8, warmup=2)
    naive = time_ms(lambda: run_bell_circuit_naive(shots=8192), repeats=8, warmup=2)
    speedup = round(naive["median_ms"] / opt["median_ms"], 2)
    opt_rows = [
        {"impl": "naive (1 sim + 1 job per correlator)", "runtime_ms": naive["median_ms"]},
        {"impl": "optimized (shared sim + batched job)", "runtime_ms": opt["median_ms"]},
    ]
    write_csv("chsh_optimization.csv", opt_rows, ["impl", "runtime_ms"])
    bar_chart("chsh_optimization.png",
              [r["impl"] for r in opt_rows],
              [("runtime (ms)", [r["runtime_ms"] for r in opt_rows])],
              "milliseconds (median)", f"CHSH pipeline: naive vs optimized ({speedup}x faster)")

    return rows, {"naive_ms": naive["median_ms"], "optimized_ms": opt["median_ms"], "speedup": speedup}


def summary_markdown(rows, opt):
    tbl = markdown_table(rows, [
        ("dataset", "Dataset"), ("total_shots", "Total shots"),
        ("runtime_ms", "Runtime (ms)"), ("peak_mem_kb", "Peak mem (KB)"),
        ("chsh_mean", "CHSH mean"), ("chsh_stdev", "CHSH stdev"),
        ("success_rate", "Success rate"),
    ])
    return (
        "### Bell-CHSH pipeline scaling (simulator)\n\n" + tbl +
        f"\n\n**Optimization:** naive {opt['naive_ms']} ms -> optimized "
        f"{opt['optimized_ms']} ms = **{opt['speedup']}x faster** (shared simulator "
        "instance + single batched job instead of one job per correlator).\n\n"
        "*Accuracy improves and the CHSH spread shrinks ~1/sqrt(shots); success rate "
        "(fraction of runs above the classical bound of 2.0) is 1.0 from small datasets "
        "upward on the simulator.*\n"
    )


if __name__ == "__main__":
    rows, opt = run()
    print(summary_markdown(rows, opt))
