import { useState } from 'react';
import { Landmark, Scale, Stethoscope, Stamp } from 'lucide-react';
import { notarize } from '../api/client';
import CertificateDocument from '../components/CertificateDocument';
import Dropzone from '../components/Dropzone';
import StatusSteps from '../components/StatusSteps';
import type { Certificate } from '../types';

const useCases = [
  { icon: Landmark, title: 'Government Registries', text: 'Land deeds, birth certificates, and official state records with irrefutable quantum provenance.' },
  { icon: Scale, title: 'Court Evidence', text: 'Forensic exhibits and affidavits whose integrity is physically guaranteed by Bell inequality.' },
  { icon: Stethoscope, title: 'Medical Records', text: 'Clinical files notarized against a physically-certified origin state, not a software simulation.' }
];

const STEPS = ['Upload', 'Quantum Circuit', 'Bell Test', 'Certificate', 'Complete'];

export default function Notarize() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const current = certificate ? 4 : isLoading ? 2 : file ? 1 : 0;

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a document before issuing a certificate.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      setCertificate(await notarize(file));
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
    <section className="page">
      <header className="page__header">
        <h1 className="page__title">Issue a Quantum Certificate</h1>
        <p className="page__subtitle">Document integrity sealed by a Bell inequality test on real quantum hardware.</p>
      </header>

      <StatusSteps steps={STEPS} current={current} />

      <div className="use-case-grid">
        {useCases.map(({ icon: Icon, title, text }) => (
          <article key={title} className="use-case-card">
            <span className="use-case-card__icon"><Icon size={22} strokeWidth={1.7} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>

      <div className="card-shell stack">
        <Dropzone label="Drop your document here" hint="PDF, DOCX, TXT — drag & drop or click" file={file} onFileSelect={setFile} />

        {error ? <p className="inline-message">{error}</p> : null}

        <button className="button button--primary button--block" type="button" onClick={handleSubmit} disabled={isLoading || !file}>
          <Stamp size={16} /> {isLoading ? 'Running quantum circuit…' : 'Issue Certificate'}
        </button>

        {certificate ? <CertificateDocument certificate={certificate as Record<string, unknown>} onDownload={handleDownload} /> : null}
      </div>
    </section>
  );
}
