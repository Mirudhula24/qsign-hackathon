import type { AuditRow, Certificate, VerifyResult, ForensicVerdict, HardwareResult, CorrelationData } from '../types';

const API_BASE = 'http://127.0.0.1:8000';

async function requestJson(path: string, init?: RequestInit): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}${path}`, init);

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    throw new Error('Could not reach the QSIGN server — make sure the backend is running on port 8000.');
  }
}

export async function notarize(file: File): Promise<Certificate> {
  const formData = new FormData();
  // Backend expects the upload field to be named `file`
  formData.append('file', file);

  const res = await requestJson('/notarize', {
    method: 'POST',
    body: formData
  });

  // backend response: { status, filename, certificate }
  if (res && res.certificate) return res.certificate as Certificate;
  throw new Error('Unexpected response from QSIGN /notarize endpoint');
}

export async function verify(document: File, certificate: File): Promise<{ verification: VerifyResult; certificate: Certificate | null }> {
  const formData = new FormData();
  // Backend expects `file` and `certificate`
  formData.append('file', document);
  formData.append('certificate', certificate);

  const res = await requestJson('/verify', {
    method: 'POST',
    body: formData
  });

  // backend response: { status, verification, certificate }
  if (res && res.verification) {
    return { verification: res.verification as VerifyResult, certificate: (res.certificate ?? null) as Certificate | null };
  }
  throw new Error('Unexpected response from QSIGN /verify endpoint');
}

// Plain-English forensic verdict via local IBM Granite (rule-based fallback on the backend).
export async function getVerdict(verification: VerifyResult, certificate: Certificate | null): Promise<ForensicVerdict> {
  const res = await requestJson('/verdict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verification, certificate })
  });
  return { verdict: res.verdict ?? '', model: res.model ?? null };
}

// Real IBM Quantum hardware provenance (cached).
export async function getHardware(): Promise<HardwareResult> {
  const res = await requestJson('/hardware');
  return (res?.data ?? {}) as HardwareResult;
}

// Quantum-vs-classical correlation curve.
export async function getCorrelation(): Promise<CorrelationData | null> {
  const res = await requestJson('/correlation');
  return (res?.data ?? null) as CorrelationData | null;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAuditLog(): Promise<AuditRow[]> {
  const res = await requestJson('/audit');
  if (!res || !Array.isArray(res.notarizations)) {
    throw new Error('Unexpected response from QSIGN /audit endpoint');
  }

  return res.notarizations.map((entry: Record<string, unknown>) => ({
    time: typeof entry.timestamp === 'string' ? entry.timestamp : '—',
    document: typeof entry.filename === 'string' ? entry.filename : 'Unnamed document',
    chshScore: typeof entry.chsh_value === 'number' ? entry.chsh_value : Number(entry.chsh_value ?? 0),
    status: entry.status === 'Rejected' ? 'Rejected' : 'Verified'
  }));
}
