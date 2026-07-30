import { useState } from 'react';
import { notarize } from '../api/client';
import CertificateDocument from '../components/CertificateDocument';
import Dropzone from '../components/Dropzone';
import type { Certificate } from '../types';

const useCases = [
  { title: 'Government Registries', text: 'Create a durable record for land, legal, or public filings.' },
  { title: 'Court Evidence', text: 'Attach a physical-physics verification trail to chain-of-custody materials.' },
  { title: 'Medical Records', text: 'Bind clinical documentation to an auditable origin state.' }
];

export default function Notarize() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a document before issuing a certificate.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await notarize(file);
      setCertificate(result);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'An unexpected error occurred.');
      setCertificate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'qsign-certificate.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page page--narrow">
      <header className="page__header">
        <h1 className="page__title">Notarize a Document</h1>
        <p className="page__subtitle">Your document will receive a quantum-certified signature validated against the Bell-CHSH inequality.</p>
      </header>

      <div className="use-case-grid">
        {useCases.map((item) => (
          <article key={item.title} className="use-case-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <div className="card-shell stack">
        <Dropzone
          label="Document upload"
          hint="Any file format accepted"
          file={file}
          onFileSelect={setFile}
        />

        {error ? <p className="inline-message">{error}</p> : null}

        <button className="button button--primary" type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Generating certificate…' : 'Issue Certificate'}
        </button>

        {isLoading ? <p className="helper-text">Generating certificate…</p> : null}

        {certificate ? <CertificateDocument certificate={certificate as Record<string, unknown>} onDownload={handleDownload} /> : null}
      </div>
    </section>
  );
}