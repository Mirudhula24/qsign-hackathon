import type { Certificate, VerifyResult } from '../types';

const API_BASE = 'http://127.0.0.1:8000';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, init);

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    throw new Error('Could not reach the QSIGN server — make sure the backend is running on port 8000.');
  }
}

export async function notarize(file: File): Promise<Certificate> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('file', file);

  return requestJson<Certificate>('/notarize', {
    method: 'POST',
    body: formData
  });
}

export async function verify(document: File, certificate: File): Promise<VerifyResult> {
  const formData = new FormData();
  formData.append('document', document);
  formData.append('file', document);
  formData.append('certificate', certificate);
  formData.append('certificate_file', certificate);

  return requestJson<VerifyResult>('/verify', {
    method: 'POST',
    body: formData
  });
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}