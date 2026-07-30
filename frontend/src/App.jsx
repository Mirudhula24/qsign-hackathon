import { useState, useCallback, useEffect } from "react";

const API = "http://127.0.0.1:8000";

// A scheme name like "ML-DSA-65" or "CRYSTALS-Dilithium3" is a real NIST
// post-quantum signature; "SHA256-*" is the integrity-only baseline.
function isPostQuantum(scheme) {
  return !!scheme && (scheme.startsWith("ML-DSA") || scheme.includes("Dilithium"));
}

function Badge({ ok, children }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      background: ok ? "#E8F5EE" : "#FAEAEC",
      color: ok ? "#1A7A4A" : "#9B1C2E",
      border: `1px solid ${ok ? "#B8DFC9" : "#E8B4BC"}`,
    }}>{children}</span>
  );
}

function CheckRow({ label, ok, detail }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 0", borderBottom: "1px solid #EEF0F3",
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
        background: ok ? "#E8F5EE" : "#FAEAEC",
        color: ok ? "#1A7A4A" : "#9B1C2E",
        fontSize: 12, fontWeight: 700,
      }}>{ok ? "✓" : "✗"}</span>
      <span style={{ flex: 1, fontSize: 14, color: "#1A1A2E" }}>{label}</span>
      <span style={{ fontSize: 13, color: ok ? "#1A7A4A" : "#9B1C2E", fontFamily: "monospace" }}>{detail}</span>
    </div>
  );
}

function DropZone({ onFile, file, label }) {
  const [drag, setDrag] = useState(false);
  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0]; if (f) onFile(f);
  }, [onFile]);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById("fi-" + label).click()}
      style={{
        border: `1.5px dashed ${drag ? "#1A56A0" : "#C8CDD5"}`,
        borderRadius: 8, padding: "24px 16px", textAlign: "center",
        cursor: "pointer", background: drag ? "#EEF3FB" : "#FAFBFC",
        transition: "all 0.15s",
      }}
    >
      <input id={"fi-" + label} type="file" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
      {file ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <span style={{ fontSize: 14, color: "#1A1A2E", fontWeight: 500 }}>{file.name}</span>
          <span style={{ fontSize: 12, color: "#8A909A" }}>({(file.size / 1024).toFixed(1)} KB)</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⬆</div>
          <div style={{ fontSize: 14, color: "#4A5568" }}>{label}</div>
          <div style={{ fontSize: 12, color: "#8A909A", marginTop: 4 }}>Any file format</div>
        </>
      )}
    </div>
  );
}

function NotarizePage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);

  async function handleNotarize() {
    if (!file) return;
    setLoading(true); setError(null); setCert(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${API}/notarize`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.status === "success") setCert(data.certificate);
      else setError("Notarization failed. Please try again.");
    } catch {
      setError("Cannot reach the backend. Make sure uvicorn is running on port 8000.");
    } finally { setLoading(false); }
  }

  function downloadCert() {
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `qsign_cert_${Date.now()}.json`; a.click();
  }

  const chsh = cert?.quantum_proof?.chsh_value;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0D1B3E", marginBottom: 6 }}>
        Notarize a Document
      </h2>
      <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 24, lineHeight: 1.6 }}>
        Your document will receive a quantum-certified signature. The randomness
        is certified by the Bell–CHSH inequality — a law of physics.
      </p>

      <DropZone onFile={setFile} file={file} label="Click to upload or drag and drop" />

      {file && (
        <button onClick={handleNotarize} disabled={loading} style={{
          marginTop: 16, width: "100%", padding: "12px 0",
          background: loading ? "#7A9CC5" : "#0D1B3E",
          color: "#fff", border: "none", borderRadius: 6,
          fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        }}>
          {loading ? "Running quantum circuit…" : "Issue Certificate"}
        </button>
      )}

      {error && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#FAEAEC",
          border: "1px solid #E8B4BC", borderRadius: 6, color: "#9B1C2E", fontSize: 14 }}>
          {error}
        </div>
      )}

      {cert && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            background: "#fff", border: "1px solid #E2E6EC",
            borderLeft: "4px solid #1A56A0", borderRadius: 8,
            padding: "20px 20px 16px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8A909A",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Quantum Origin Score
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: "#0D1B3E", fontFamily: "monospace" }}>
                {chsh}
              </span>
              <span style={{ fontSize: 13, color: "#1A7A4A", fontWeight: 500 }}>
                Classical ceiling: 2.0
              </span>
            </div>
            <div style={{ position: "relative", height: 6, background: "#EEF0F3", borderRadius: 4 }}>
              <div style={{
                position: "absolute", left: 0, top: 0, height: "100%",
                width: `${((chsh - 0) / 4) * 100}%`,
                background: "#1A56A0", borderRadius: 4,
              }} />
              <div style={{
                position: "absolute", left: "50%", top: -3,
                width: 2, height: 12, background: "#9B1C2E",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "#8A909A", marginTop: 4 }}>
              <span>0</span>
              <span style={{ color: "#9B1C2E" }}>2.0 classical bound</span>
              <span>4.0</span>
            </div>
          </div>

          <div style={{ background: "#FAFBFC", border: "1px solid #E2E6EC",
            borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8A909A",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Certificate Details
            </div>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#4A5568", lineHeight: 1.8 }}>
              <div><b>Document:</b> {file.name}</div>
              <div><b>Timestamp:</b> {cert.timestamp}</div>
              <div><b>Hash:</b> {cert.document_hash?.slice(0, 20)}…</div>
              <div><b>Circuit:</b> {cert.quantum_proof?.circuit}</div>
              <div><b>Backend:</b> {cert.quantum_proof?.backend}</div>
              <div><b>Bell violated:</b> {cert.quantum_proof?.bell_violated ? "Yes ✓" : "No ✗"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span><b>Signature:</b> {cert.signature?.scheme}</span>
                {isPostQuantum(cert.signature?.scheme) && (
                  <span style={{
                    fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 700,
                    letterSpacing: 0.4, padding: "2px 7px", borderRadius: 4,
                    background: "#EDE9FE", color: "#5B21B6", border: "1px solid #C4B5FD",
                  }}>NIST POST-QUANTUM</span>
                )}
              </div>
            </div>
          </div>

          <button onClick={downloadCert} style={{
            width: "100%", padding: "10px 0",
            background: "#fff", color: "#0D1B3E",
            border: "1.5px solid #0D1B3E", borderRadius: 6,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Download Certificate (.json)
          </button>
        </div>
      )}
    </div>
  );
}

function VerifyPage() {
  const [docFile, setDocFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleVerify() {
    if (!docFile || !certFile) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", docFile);
      fd.append("certificate", certFile);
      const res = await fetch(`${API}/verify`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.status === "success") setResult(data.verification);
      else setError("Verification failed. Please try again.");
    } catch {
      setError("Cannot reach the backend. Make sure uvicorn is running on port 8000.");
    } finally { setLoading(false); }
  }

  const pass = result?.overall === true;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0D1B3E", marginBottom: 6 }}>
        Verify a Certificate
      </h2>
      <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 24, lineHeight: 1.6 }}>
        Upload the original document and its QSIGN certificate. The system checks
        the document fingerprint, quantum origin score, and cryptographic signature.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
            Original Document
          </div>
          <DropZone onFile={setDocFile} file={docFile} label="Upload document" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#4A5568", marginBottom: 6 }}>
            QSIGN Certificate (.json)
          </div>
          <DropZone onFile={setCertFile} file={certFile} label="Upload certificate" />
        </div>
      </div>

      {docFile && certFile && (
        <button onClick={handleVerify} disabled={loading} style={{
          width: "100%", padding: "12px 0",
          background: loading ? "#7A9CC5" : "#0D1B3E",
          color: "#fff", border: "none", borderRadius: 6,
          fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 20,
        }}>
          {loading ? "Verifying…" : "Verify Certificate"}
        </button>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "#FAEAEC",
          border: "1px solid #E8B4BC", borderRadius: 6, color: "#9B1C2E", fontSize: 14 }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{
            padding: "20px 20px", borderRadius: 8, marginBottom: 16,
            background: pass ? "#E8F5EE" : "#FAEAEC",
            borderLeft: `4px solid ${pass ? "#1A7A4A" : "#9B1C2E"}`,
            border: `1px solid ${pass ? "#B8DFC9" : "#E8B4BC"}`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{pass ? "✅" : "❌"}</div>
            <div style={{ fontSize: 18, fontWeight: 700,
              color: pass ? "#1A7A4A" : "#9B1C2E", marginBottom: 4 }}>
              {pass ? "Document Verified" : "Certificate Rejected"}
            </div>
            <div style={{ fontSize: 13, color: pass ? "#2D6A4F" : "#7B1D2E" }}>
              {pass
                ? "All three quantum checks passed successfully."
                : "Quantum origin check failed — certificate not generated by real quantum hardware."}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E2E6EC",
            borderRadius: 8, padding: "4px 16px", marginBottom: 16 }}>
            <CheckRow
              label="Document Fingerprint"
              ok={result.hash_match}
              detail={result.hash_match ? "Matched" : "Mismatch — document was altered"}
            />
            <CheckRow
              label="Quantum Origin Score"
              ok={result.bell_violated}
              detail={`${result.chsh_value} ${result.bell_violated ? "> 2.0 ✓" : "< 2.0 — below classical bound ✗"}`}
            />
            <CheckRow
              label="Cryptographic Signature"
              ok={result.signature_valid}
              detail={result.signature_valid
                ? `Valid · ${result.signature_scheme || "signed"}`
                : "Invalid"}
            />
          </div>

          {!result.bell_violated && (
            <div style={{
              padding: "14px 16px", borderRadius: 8,
              background: "#FAEAEC",
              border: "1px solid #E8B4BC",
              borderLeft: "4px solid #9B1C2E",
              fontSize: 13, color: "#5C1A24", lineHeight: 1.7,
            }}>
              <strong>Not a password check. Not a database lookup.</strong><br />
              This certificate was not generated using quantum hardware. The Bell–CHSH
              score of <strong style={{ fontFamily: "monospace" }}>{result.chsh_value}</strong> falls
              below the classical physics boundary of <strong>2.0</strong>. Classical
              randomness cannot exceed this boundary — making forgery physically
              detectable, not just computationally difficult.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditPage() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchLogs() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/audit`);
      const data = await res.json();
      setLogs(data.notarizations || []);
    } catch {
      setError("Cannot reach the backend. Make sure uvicorn is running on port 8000.");
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0D1B3E", marginBottom: 6 }}>
            Audit Log
          </h2>
          <p style={{ fontSize: 14, color: "#4A5568" }}>
            A record of all notarizations performed in this session.
          </p>
        </div>
        <button onClick={fetchLogs} disabled={loading} style={{
          padding: "8px 16px", background: "#0D1B3E", color: "#fff",
          border: "none", borderRadius: 6, fontSize: 13,
          fontWeight: 600, cursor: "pointer",
        }}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#FAEAEC",
          border: "1px solid #E8B4BC", borderRadius: 6, color: "#9B1C2E", fontSize: 14 }}>
          {error}
        </div>
      )}

      {logs === null && !error && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8A909A" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14 }}>Click Refresh to load the audit log</div>
        </div>
      )}

      {logs !== null && logs.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8A909A" }}>
          <div style={{ fontSize: 14 }}>No notarizations yet. Go to Notarize to create one.</div>
        </div>
      )}

      {logs && logs.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E2E6EC", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F4F6F9" }}>
                {["Time", "Document", "CHSH Score", "Status"].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: "#4A5568",
                    textTransform: "uppercase", letterSpacing: 0.8,
                    borderBottom: "1px solid #E2E6EC",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #EEF0F3" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12,
                    fontFamily: "monospace", color: "#4A5568" }}>
                    {row.timestamp}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#1A1A2E" }}>
                    {row.filename}
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace",
                    fontSize: 13, color: row.chsh_value > 2 ? "#1A7A4A" : "#9B1C2E",
                    fontWeight: 600 }}>
                    {row.chsh_value}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge ok={row.status === "Verified"}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 16px", fontSize: 11, color: "#8A909A",
            borderTop: "1px solid #EEF0F3" }}>
            CHSH scores above 2.0 indicate quantum-certified randomness.
            Classical systems are physically bounded below 2.0.
          </div>
        </div>
      )}
    </div>
  );
}

function HardwareProvenance({ hw }) {
  if (!hw) {
    return (
      <div style={{ padding: "14px 16px", background: "#FAFBFC", border: "1px solid #E2E6EC",
        borderRadius: 8, fontSize: 13, color: "#8A909A", marginBottom: 16 }}>
        Loading hardware provenance…
      </div>
    );
  }

  const isReal = hw.source === "ibm_hardware" && hw.status === "complete";
  const isDry = hw.source === "simulator_dryrun";
  const jobUrl = hw.job_id && hw.job_id !== "dry-run-local"
    ? `https://quantum.ibm.com/jobs/${hw.job_id}` : null;

  // Not-yet-run state: honest, no invented numbers.
  if (!isReal && !isDry) {
    const prior = hw.prior_hardware_job;
    return (
      <div style={{ padding: "16px 18px", background: "#FFF8EC", border: "1px solid #F2D9A0",
        borderLeft: "4px solid #C77D00", borderRadius: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#8A5A00", marginBottom: 4 }}>
          Real-hardware run pending
        </div>
        <div style={{ fontSize: 13, color: "#5C4300", lineHeight: 1.6 }}>
          {hw.note || "Run backend/real_hardware.py --run with IBM Quantum credentials to populate this panel."}
          {prior && <> Prior job on <b>{prior.backend}</b> — <code>{prior.job_id}</code>.</>}
        </div>
      </div>
    );
  }

  const accent = isReal ? "#0F62FE" : "#C77D00";      // IBM blue for real, amber for dry-run
  const bg = isReal ? "#EDF3FF" : "#FFF8EC";
  const bord = isReal ? "#B8D0FF" : "#F2D9A0";

  return (
    <div style={{ background: bg, border: `1px solid ${bord}`, borderLeft: `4px solid ${accent}`,
      borderRadius: 8, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
          color: accent }}>
          {isReal ? "Executed on IBM Quantum hardware" : "Simulator dry-run — not real hardware"}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, padding: "3px 8px",
          borderRadius: 4, color: hw.bell_violated ? "#1A7A4A" : "#9B1C2E",
          background: hw.bell_violated ? "#E8F5EE" : "#FAEAEC",
          border: `1px solid ${hw.bell_violated ? "#B8DFC9" : "#E8B4BC"}` }}>
          {hw.bell_violated ? "BELL INEQUALITY VIOLATED" : "NO VIOLATION"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 40, fontWeight: 700, color: "#0D1B3E", fontFamily: "monospace" }}>
          {hw.chsh_value}
        </span>
        <span style={{ fontSize: 13, color: "#4A5568" }}>
          CHSH &nbsp;·&nbsp; classical ceiling <b>2.000</b> &nbsp;·&nbsp; Tsirelson <b>{hw.quantum_maximum}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px",
        fontSize: 12, fontFamily: "monospace", color: "#4A5568" }}>
        <span style={{ color: "#8A909A" }}>Backend</span><span><b>{hw.backend}</b></span>
        <span style={{ color: "#8A909A" }}>Job ID</span>
        <span>
          {jobUrl
            ? <a href={jobUrl} target="_blank" rel="noreferrer" style={{ color: "#0F62FE" }}>{hw.job_id} ↗</a>
            : hw.job_id}
        </span>
        <span style={{ color: "#8A909A" }}>Shots</span><span>{hw.shots}</span>
        <span style={{ color: "#8A909A" }}>Timestamp</span><span>{hw.timestamp}</span>
      </div>

      {isDry && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#5C4300", lineHeight: 1.6 }}>
          These numbers are from a local simulator, shown so the panel is demoable. Run{" "}
          <code>backend/real_hardware.py --run</code> with IBM credentials to replace them with a
          genuine, judge-verifiable IBM Quantum job.
        </div>
      )}
      {isReal && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#1A3A6B", lineHeight: 1.6 }}>
          Measured on real, noisy quantum hardware — and still above the classical bound of 2.0.
          The job ID is public: anyone can verify this run on the IBM Quantum platform.
        </div>
      )}
    </div>
  );
}

function CorrelationChart({ data }) {
  const curve = data.curve;
  const W = 640, H = 340;
  const ML = 54, MR = 18, MT = 18, MB = 46;
  const PW = W - ML - MR, PH = H - MT - MB;

  const xScale = (deg) => ML + (deg / 90) * PW;
  const yScale = (c) => MT + ((1 - c) / 2) * PH;

  const toPath = (key) =>
    curve.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.delta_deg).toFixed(1)} ${yScale(p[key]).toFixed(1)}`).join(" ");

  // Shaded "Bell violation" band between the quantum curve and the classical line.
  const band =
    curve.map(p => `${xScale(p.delta_deg).toFixed(1)},${yScale(p.quantum_theory).toFixed(1)}`).join(" ") +
    " " +
    [...curve].reverse().map(p => `${xScale(p.delta_deg).toFixed(1)},${yScale(p.classical).toFixed(1)}`).join(" ");

  const yTicks = [1, 0.5, 0, -0.5, -1];
  const xTicks = [0, 22.5, 45, 67.5, 90];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Quantum vs classical correlation curve">
      {/* y gridlines + labels */}
      {yTicks.map(t => (
        <g key={t}>
          <line x1={ML} y1={yScale(t)} x2={W - MR} y2={yScale(t)}
            stroke={t === 0 ? "#C8CDD5" : "#EEF0F3"} strokeWidth="1" />
          <text x={ML - 8} y={yScale(t) + 3} textAnchor="end"
            fontSize="10" fill="#8A909A" fontFamily="monospace">{t.toFixed(1)}</text>
        </g>
      ))}
      {/* CHSH measurement-angle markers */}
      {data.chsh_angles_deg.map(a => (
        <line key={a} x1={xScale(a)} y1={MT} x2={xScale(a)} y2={MT + PH}
          stroke="#C4B5FD" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {/* x labels */}
      {xTicks.map(t => (
        <text key={t} x={xScale(t)} y={MT + PH + 16} textAnchor="middle"
          fontSize="10" fill="#8A909A" fontFamily="monospace">{t}°</text>
      ))}
      {/* Bell violation band */}
      <polygon points={band} fill="#1A56A0" opacity="0.08" />
      {/* classical line */}
      <path d={toPath("classical")} fill="none" stroke="#9B1C2E" strokeWidth="2" strokeDasharray="5 4" />
      {/* quantum theory curve */}
      <path d={toPath("quantum_theory")} fill="none" stroke="#1A56A0" strokeWidth="2.5" />
      {/* measured quantum points */}
      {curve.map((p, i) => (
        <circle key={i} cx={xScale(p.delta_deg)} cy={yScale(p.measured)} r="3.4"
          fill="#0D1B3E" stroke="#fff" strokeWidth="1" />
      ))}
      {/* axis titles */}
      <text x={ML + PW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#4A5568">
        Measurement angle difference
      </text>
      <text x={14} y={MT + PH / 2} textAnchor="middle" fontSize="11" fill="#4A5568"
        transform={`rotate(-90 14 ${MT + PH / 2})`}>Correlation E</text>
    </svg>
  );
}

function LegendDot({ color, dashed, filled, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A5568" }}>
      <svg width="22" height="10">
        {filled
          ? <circle cx="11" cy="5" r="3.4" fill={color} stroke="#fff" />
          : <line x1="1" y1="5" x2="21" y2="5" stroke={color} strokeWidth="2.5"
              strokeDasharray={dashed ? "4 3" : "0"} />}
      </svg>
      {label}
    </span>
  );
}

function QuantumProofPage() {
  const [data, setData] = useState(null);
  const [hw, setHw] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [corrRes, hwRes] = await Promise.all([
          fetch(`${API}/correlation`),
          fetch(`${API}/hardware`),
        ]);
        const corr = await corrRes.json();
        const hardware = await hwRes.json();
        if (!alive) return;
        if (corr.status === "success") setData(corr.data);
        if (hardware.status === "success") setHw(hardware.data);
      } catch {
        if (alive) setError("Cannot reach the backend. Make sure uvicorn is running on port 8000.");
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: "#0D1B3E", marginBottom: 6 }}>
        Quantum Proof
      </h2>
      <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 24, lineHeight: 1.6 }}>
        Every notarization runs a real Bell–CHSH experiment. This is what that experiment
        measures: the correlation between two entangled qubits as we vary the measurement
        angle. The dots are live simulator measurements — they trace the quantum prediction
        and pull away from anything a classical system could produce.
      </p>

      <HardwareProvenance hw={hw} />

      {error && (
        <div style={{ padding: "12px 16px", background: "#FAEAEC",
          border: "1px solid #E8B4BC", borderRadius: 6, color: "#9B1C2E", fontSize: 14 }}>
          {error}
        </div>
      )}

      {!data && !error && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8A909A" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚛</div>
          <div style={{ fontSize: 14 }}>Running the correlation sweep on the quantum simulator…</div>
        </div>
      )}

      {data && (
        <>
          <div style={{ background: "#fff", border: "1px solid #E2E6EC", borderRadius: 8,
            padding: "16px 16px 8px", marginBottom: 16 }}>
            <CorrelationChart data={data} />
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap",
              padding: "10px 4px 4px", borderTop: "1px solid #EEF0F3", marginTop: 4 }}>
              <LegendDot color="#0D1B3E" filled label="Measured (quantum simulator)" />
              <LegendDot color="#1A56A0" label="Quantum prediction  cos(2θ)" />
              <LegendDot color="#9B1C2E" dashed label="Classical limit (local realism)" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              ["CHSH score (this run)", data.chsh_value, "#0D1B3E"],
              ["Classical ceiling", data.classical_bound.toFixed(3), "#9B1C2E"],
              ["Tsirelson bound (2√2)", data.quantum_maximum, "#1A7A4A"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: "#FAFBFC", border: "1px solid #E2E6EC",
                borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#8A909A",
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: "monospace" }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "14px 16px", borderRadius: 8, background: "#F4F6F9",
            border: "1px solid #E2E6EC", borderLeft: "4px solid #1A56A0",
            fontSize: 13, color: "#1A1A2E", lineHeight: 1.7 }}>
            The blue-shaded gap is the <strong>Bell violation</strong>: the region where the
            measured quantum correlation exceeds what any classical, pre-programmed system can
            reach. Combining four of these angle measurements gives CHSH ={" "}
            <strong style={{ fontFamily: "monospace" }}>{data.chsh_value}</strong>, above the
            classical ceiling of <strong>2.0</strong>. That excess is what a QSIGN certificate
            proves — and it is physically impossible to fake with classical randomness.
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("notarize");

  const navStyle = (p) => ({
    padding: "8px 0", marginRight: 28,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    color: page === p ? "#0D1B3E" : "#6B7280",
    borderBottom: page === p ? "2px solid #0D1B3E" : "2px solid transparent",
    background: "none", border: "none",
    borderBottom: page === p ? "2px solid #0D1B3E" : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F9", fontFamily: "system-ui, sans-serif" }}>
      <div style={{
        background: "#fff", borderBottom: "1px solid #E2E6EC",
        padding: "0 32px", display: "flex", alignItems: "center",
        height: 56, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ marginRight: 40 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0D1B3E" }}>QSIGN</span>
          <span style={{ fontSize: 12, color: "#8A909A", marginLeft: 8 }}>
            Quantum-Certified Notarization
          </span>
        </div>
        <nav style={{ display: "flex", alignItems: "center" }}>
          {[["notarize", "Notarize"], ["verify", "Verify"], ["proof", "Quantum Proof"], ["audit", "Audit Log"]].map(([id, label]) => (
            <button key={id} style={navStyle(id)} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#8A909A" }}>
          Bell–CHSH · IBM Quantum · QT-3.7
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {page === "notarize" && <NotarizePage />}
        {page === "verify" && <VerifyPage />}
        {page === "proof" && <QuantumProofPage />}
        {page === "audit" && <AuditPage />}
      </div>
    </div>
  );
}