import { useState } from 'react';
import { verify } from '../api/client';
import FileDropzone from '../components/FileDropzone';
import ResultCard from '../components/ResultCard';
import type { VerifyResult } from '../types';

const tabItems = [
  { key: 'standard', label: 'Standard Verification' },
  { key: 'forged', label: 'Test with Forged Certificate' }
] as const;

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabItems)[number]['key']>('standard');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!documentFile || !certificateFile) {
      setError('Please upload both the original document and the certificate JSON.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await verify(documentFile, certificateFile);
      setResult(response);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'An unexpected error occurred.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Verify a Certificate</h1>
        <p className="page__subtitle">Verification checks the document fingerprint, the quantum origin score, and the cryptographic signature.</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Verification mode">
        {tabItems.map((item) => (
          <button
            key={item.key}
            className={`tab-chip${activeTab === item.key ? ' tab-chip--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === item.key}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={`tab-panel${loading ? ' tab-panel--loading' : ''}`}>
        <div className="upload-grid">
          <FileDropzone
            label="Original Document"
            subtext="Upload the exact source file"
            file={documentFile}
            onFileSelect={setDocumentFile}
          />
          <FileDropzone
            label="QSIGN Certificate (.json)"
            subtext="Upload the certificate produced by QSIGN"
            file={certificateFile}
            onFileSelect={setCertificateFile}
            accept="application/json,.json"
          />
        </div>

        {error ? <p className="inline-message">{error}</p> : null}

        <button className="button button--primary" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Verifying…' : 'Verify Certificate'}
        </button>

        {loading ? <p className="inline-message">Verifying…</p> : null}

        {result ? <ResultCard result={result} /> : null}
      </div>

      {activeTab === 'forged' ? (
        <p className="page__note">Use this mode to test the rejection path with a forged certificate file.</p>
      ) : null}
    </section>
  );
}