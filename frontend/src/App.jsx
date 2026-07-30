import { useState, useCallback } from "react";

const API = "http://127.0.0.1:8000";

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
              detail={result.signature_valid ? "Valid" : "Invalid"}
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
          {[["notarize", "Notarize"], ["verify", "Verify"], ["audit", "Audit Log"]].map(([id, label]) => (
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
        {page === "audit" && <AuditPage />}
      </div>
    </div>
  );
}