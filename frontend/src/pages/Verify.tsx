import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { verify, getVerdict } from '../api/client';
import Dropzone from '../components/Dropzone';
import VerifyResult from '../components/VerifyResult';
import ForensicVerdict from '../components/ForensicVerdict';
import type { VerifyResult as VerifyResultType, ForensicVerdict as ForensicVerdictType } from '../types';

const tabItems = [
  { key: 'standard', label: 'Standard Verification' },
  { key: 'forged', label: 'Test with Forged Certificate' }
] as const;

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabItems)[number]['key']>('standard');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerifyResultType | null>(null);
  const [verdict, setVerdict] = useState<(ForensicVerdictType & { loading?: boolean }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createForgedCertificate = async (source: File) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(await source.text()) as Record<string, unknown>;
    } catch {
      throw new Error('The certificate must contain valid JSON before it can be used for the forged-certificate test.');
    }

    const certificate = (parsed.certificate as Record<string, unknown> | undefined) ?? parsed;
    const quantumProof = (certificate.quantum_proof as Record<string, unknown> | undefined) ?? {};
    const forged = {
      ...certificate,
      quantum_proof: {
        ...quantumProof,
        chsh_value: 1.5,
        bell_violated: false
      }
    };

    return new File([JSON.stringify(forged, null, 2)], `forged-${source.name}`, { type: 'application/json' });
  };

  const handleSubmit = async () => {
    if (!documentFile || !certificateFile) {
      setError('Please upload both the original document and the certificate JSON.');
      return;
    }

    setError('');
    setLoading(true);
    setVerdict(null);

    try {
      const certificateForVerification = activeTab === 'forged'
        ? await createForgedCertificate(certificateFile)
        : certificateFile;
      const response = await verify(documentFile, certificateForVerification);
      setResult(response.verification);
      // Fetch the AI forensic verdict in the background — never blocks the checks.
      setVerdict({ verdict: '', model: null, loading: true });
      getVerdict(response.verification, response.certificate)
        .then((v) => setVerdict(v))
        .catch(() => setVerdict(null));
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
        <p className="page__subtitle">This page checks the document fingerprint, the Bell-CHSH origin score, and the cryptographic signature.</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Verification mode">
        {tabItems.map((item) => (
          <button key={item.key} className={`tab-chip${activeTab === item.key ? ' tab-chip--active' : ''}`} type="button" onClick={() => { setActiveTab(item.key); setResult(null); setError(''); }}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="card-shell stack">
        <div className="upload-grid">
          <Dropzone label="Original document" hint="Upload the exact source file" file={documentFile} onFileSelect={setDocumentFile} />
          <Dropzone label="QSIGN certificate (.json)" hint="Upload the certificate produced by QSIGN" file={certificateFile} onFileSelect={setCertificateFile} accept="application/json,.json" />
        </div>

        {error ? <p className="inline-message">{error}</p> : null}

        <button className="button button--primary button--block" type="button" onClick={handleSubmit} disabled={loading}>
          <ShieldCheck size={16} /> {loading ? 'Verifying…' : 'Verify Certificate'}
        </button>

        {loading ? <p className="helper-text">Verifying…</p> : null}

        {result ? <VerifyResult result={result as Record<string, unknown>} /> : null}
        {result && verdict ? <ForensicVerdict verdict={verdict.verdict} model={verdict.model} loading={verdict.loading} /> : null}
      </div>

      {activeTab === 'forged' ? <p className="page__note">This test alters the uploaded certificate’s CHSH value to 1.5000 before sending it to the unchanged backend. The backend then returns the failed Bell check and invalid signature.</p> : null}
    </section>
  );
}
