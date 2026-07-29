import { useMemo, useState } from 'react';
import { notarize } from '../api/client';
import FileDropzone from '../components/FileDropzone';
import QuantumScoreCard from '../components/QuantumScoreCard';
import StatusSteps from '../components/StatusSteps';
import type { Certificate } from '../types';

function getFingerprint(certificate: Certificate) {
  return certificate.document_hash ?? certificate.fingerprint ?? certificate.sha256 ?? 'Fingerprint unavailable';
}

function getScore(certificate: Certificate) {
  return typeof certificate.chsh_score === 'number' ? certificate.chsh_score : 0;
}

export default function Notarize() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [completedSteps, setCompletedSteps] = useState([false, false, false]);

  const score = useMemo(() => getScore(certificate ?? {}), [certificate]);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a document before issuing a certificate.');
      return;
    }

    setError('');
    setIsLoading(true);
    setCompletedSteps([true, false, false]);

    try {
      const result = await notarize(file);
      setCertificate(result);
      setCompletedSteps([true, true, true]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'An unexpected error occurred.');
      setCertificate(null);
      setCompletedSteps([false, false, false]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificate) {
      return;
    }

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
        <p className="page__subtitle">Your document will receive a quantum-certified signature, verified against the Bell-CHSH inequality.</p>
      </header>

      <div className="stack">
        <FileDropzone
          label="Document Upload"
          subtext="Any file format accepted"
          file={file}
          onFileSelect={setFile}
        />

        {error ? <p className="inline-message">{error}</p> : null}

        <button className="button button--primary" type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Generating certificate…' : 'Issue Certificate'}
        </button>

        {isLoading ? <p className="inline-message">Generating certificate…</p> : null}

        {certificate ? (
          <>
            <div className="certificate-summary">
              <p className="section-label">DOCUMENT FINGERPRINT</p>
              <div className="mono certificate-summary__fingerprint">{getFingerprint(certificate)}</div>
            </div>

            <QuantumScoreCard score={score} />

            <StatusSteps completed={completedSteps} />

            <button className="button button--secondary" type="button" onClick={handleDownload}>
              Download Certificate
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}