"""Loads the cached Bell-CHSH hardware-provenance result for the /hardware
endpoint. This is demo evidence only -- QSIGN certificates never depend on it."""

import os
import json

CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", "demo", "cached_ibm_result.json")


def load_hardware_result():
    """Return the cached run, or a truthful 'pending' record if none exists.

    Never fabricates measurements: if no genuine run has populated the cache,
    the caller learns the run is pending rather than seeing invented numbers.
    """
    try:
        with open(CACHE_PATH) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "status": "pending",
            "source": None,
            "note": "No run cached yet. Run backend/real_hardware.py --run with IBM credentials.",
        }

    # A genuine complete run carries a computed CHSH value.
    if data.get("status") == "complete" and "chsh_value" in data:
        return data

    # Older/partial caches (e.g. only a job id was saved) are surfaced honestly.
    data.setdefault("status", "pending")
    data.setdefault(
        "note",
        "A job was submitted but its counts have not been retrieved. "
        "Run backend/real_hardware.py --retrieve <job_id>, or --run for a fresh CHSH job.",
    )
    return data
