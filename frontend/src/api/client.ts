import type { Certificate, VerifyResult } from '../types';

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

export async function verify(document: File, certificate: File): Promise<VerifyResult> {
  const formData = new FormData();
  // Backend expects `file` and `certificate`
  formData.append('file', document);
  formData.append('certificate', certificate);

  const res = await requestJson('/verify', {
    method: 'POST',
    body: formData
  });

  // backend response: { status, verification }
  if (res && res.verification) return res.verification as VerifyResult;
  throw new Error('Unexpected response from QSIGN /verify endpoint');
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}