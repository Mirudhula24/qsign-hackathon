"""Shared benchmarking utilities: timing, memory, and CSV / Markdown / chart
writers. Deterministic and reproducible (fixed warmups and repeat counts)."""

import os
import csv
import time
import statistics
import tracemalloc

import matplotlib
matplotlib.use("Agg")            # headless, reproducible rendering
import matplotlib.pyplot as plt

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "benchmarks", "results")


def ensure_results_dir():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    return RESULTS_DIR


def time_ms(fn, repeats=20, warmup=3):
    """Median wall-clock time per call in milliseconds, plus stdev.
    Median is reported because it is robust to OS scheduling jitter."""
    for _ in range(warmup):
        fn()
    samples = []
    for _ in range(repeats):
        t0 = time.perf_counter()
        fn()
        samples.append((time.perf_counter() - t0) * 1000.0)
    return {
        "median_ms": round(statistics.median(samples), 4),
        "mean_ms": round(statistics.fmean(samples), 4),
        "stdev_ms": round(statistics.pstdev(samples), 4) if len(samples) > 1 else 0.0,
        "min_ms": round(min(samples), 4),
    }


def peak_memory_kb(fn):
    """Peak Python heap allocation of a single call, in KB, via tracemalloc."""
    tracemalloc.start()
    fn()
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return round(peak / 1024.0, 2)


def write_csv(name, rows, fieldnames):
    ensure_results_dir()
    path = os.path.join(RESULTS_DIR, name)
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fieldnames})
    return path


def markdown_table(rows, columns):
    """columns: list of (key, header). Returns a GitHub-flavored table string."""
    head = "| " + " | ".join(h for _, h in columns) + " |"
    sep = "| " + " | ".join("---" for _ in columns) + " |"
    body = []
    for r in rows:
        body.append("| " + " | ".join(str(r.get(k, "")) for k, _ in columns) + " |")
    return "\n".join([head, sep] + body)


def bar_chart(name, labels, series, ylabel, title, logy=False):
    """series: list of (label, values). Grouped bar chart saved as PNG."""
    ensure_results_dir()
    import numpy as np
    x = np.arange(len(labels))
    n = len(series)
    width = 0.8 / max(n, 1)
    fig, ax = plt.subplots(figsize=(9, 5))
    for i, (slabel, values) in enumerate(series):
        ax.bar(x + i * width - 0.4 + width / 2, values, width, label=slabel)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=20, ha="right")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    if logy:
        ax.set_yscale("log")
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    path = os.path.join(RESULTS_DIR, name)
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path


def line_chart(name, x, series, xlabel, ylabel, title, hlines=None):
    ensure_results_dir()
    fig, ax = plt.subplots(figsize=(9, 5))
    for slabel, ys in series:
        ax.plot(x, ys, marker="o", label=slabel)
    if hlines:
        for y, lab in hlines:
            ax.axhline(y, linestyle="--", alpha=0.6, label=lab)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend()
    ax.grid(alpha=0.3)
    fig.tight_layout()
    path = os.path.join(RESULTS_DIR, name)
    fig.savefig(path, dpi=130)
    plt.close(fig)
    return path
