# qsign-quantathon

A quantum-assisted digital signature platform combining Leggett-Garg Inequality (LGI) quantum circuits with classical cryptographic signing.

## ?? Repository Structure

```text
qsign-quantathon/
ÃÄÄ backend/
³   ÃÄÄ main.py          # FastAPI application server
³   ÃÄÄ circuit.py       # LGI quantum circuit construction & execution
³   ÃÄÄ crypto.py        # Classical cryptographic signing routines
³   ÀÄÄ requirements.txt # Python dependencies
ÃÄÄ frontend/
³   ÀÄÄ (React project goes here)
ÃÄÄ demo/
³   ÀÄÄ cached_ibm_result.json # Pre-computed hardware execution payload
ÀÄÄ README.md
```

---

## ??? How This Repository Was Created

1. **GitHub Setup**: Created a private repository named `qsign-quantathon` initialized with a default `README.md`.
2. **Local Initialization**: Cloned the repository locally via Command Prompt using `git clone`.
3. **Directory Provisioning**: Built directory structure using standard Windows CMD commands (`mkdir`, `type NUL >`):
   - `backend/` for FastAPI services and Quantum logic routines.
   - `frontend/` reserved for the React UI workspace.
   - `demo/` for cached IBM Quantum execution benchmarks.
4. **Commit & Push**: Tracked changes and pushed structural updates back to the `main` branch.
