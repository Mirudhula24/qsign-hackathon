"""
Benchmark: randomness *throughput* — classical generators vs quantum sampling.

The point of this benchmark is deliberately to show where classical wins. A
classical CSPRNG produces random bits orders of magnitude faster than any
quantum device. Quantum's advantage is NOT throughput; it is *certifiability* —
a Bell-violating source produces randomness that is provably unpredictable by
the laws of physics (device-independent), which no classical generator can
claim. This benchmark keeps that trade-off explicit and honest.
"""

import os
import sys
import time
import random
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from circuit import _run_batched                     # simulator sampling path
from benchmarks.common import write_csv, markdown_table


def _bits_per_sec(fn_generate_bits, target_bits=2_000_000):
    produced = 0
    t0 = time.perf_counter()
    while produced < target_bits:
        produced += fn_generate_bits()
    dt = time.perf_counter() - t0
    return produced / dt


def run():
    # Classical CSPRNG (os.urandom, system entropy).
    def csprng():
        return len(os.urandom(4096)) * 8
    # Classical PRNG (Mersenne Twister — fast, NOT cryptographic).
    def prng():
        random.getrandbits(4096 * 8)
        return 4096 * 8

    csprng_bps = _bits_per_sec(csprng)
    prng_bps = _bits_per_sec(prng)

    # Quantum sampling throughput on the simulator: 1 entangled pair per shot,
    # 2 measured bits per shot. Certified fraction is a small portion of these.
    shots = 20000
    t0 = time.perf_counter()
    _run_batched([(0.0, 0.3927)], shots)              # one circuit, many shots
    dt = time.perf_counter() - t0
    quantum_raw_bps = (shots * 2) / dt

    rows = [
        {"source": "Classical CSPRNG (os.urandom)", "type": "classical",
         "bits_per_sec": f"{csprng_bps:,.0f}", "certifiable": "no (trust device/seed)"},
        {"source": "Classical PRNG (Mersenne Twister)", "type": "classical",
         "bits_per_sec": f"{prng_bps:,.0f}", "certifiable": "no (deterministic)"},
        {"source": "Quantum Bell sampling (AerSimulator)", "type": "quantum",
         "bits_per_sec": f"{quantum_raw_bps:,.0f}", "certifiable": "yes (device-independent)"},
    ]
    write_csv("randomness_throughput.csv", rows,
              ["source", "type", "bits_per_sec", "certifiable"])
    return rows


def summary_markdown(rows):
    tbl = markdown_table(rows, [
        ("source", "Source"), ("type", "Type"),
        ("bits_per_sec", "Throughput (bits/s)"), ("certifiable", "Device-independent?"),
    ])
    return (
        "### Randomness throughput vs certifiability\n\n" + tbl +
        "\n\n*Classical generators win decisively on raw throughput. Quantum's value "
        "is orthogonal: a Bell-violating source is the only one whose unpredictability "
        "is guaranteed by physics rather than by trusting a chip or a seed. QSIGN uses "
        "quantum for the certified proof-of-origin, not for bulk random-bit generation.*\n"
    )


if __name__ == "__main__":
    print(summary_markdown(run()))
