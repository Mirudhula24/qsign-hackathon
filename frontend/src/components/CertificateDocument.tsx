import { QRCodeSVG } from 'qrcode.react';
import { Download, FileText } from 'lucide-react';
import InterferencePattern from './InterferencePattern';
import ChshReadout from './ChshReadout';
import CertificateDetailsTable from './CertificateDetailsTable';
import CorrelationChart from './CorrelationChart';
import IBMBadge from './IBMBadge';

const API_BASE = 'http://127.0.0.1:8000';

interface CertificateDocumentProps {
  certificate: Record<string, unknown>;
  onDownload?: () => void;
}

export default function CertificateDocument({ certificate, onDownload }: CertificateDocumentProps) {
  const quantum = (certificate.quantum_proof as Record<string, unknown> | undefined) ?? {};
  const signature = (certificate.signature as Record<string, unknown> | undefined) ?? {};
  const chshValue = typeof quantum.chsh_value === 'number' ? quantum.chsh_value : 0;
  const bellViolated = Boolean(quantum.bell_violated);
  const correlationCurve = (quantum.correlation_curve as Array<{ angle: number; value: number }> | undefined) ?? [];
  const docHash = typeof certificate.document_hash === 'string' ? certificate.document_hash : '';
  const ref = `QSIGN-${(docHash || '000000').slice(0, 6).toUpperCase()}-2026`;

  const qrToken = JSON.stringify({
    hash: docHash,
    chsh: chshValue,
    scheme: signature.scheme ?? null,
    issuer: signature.issuer ?? null,
    ts: certificate.timestamp ?? null,
    verify: window.location.origin + '/verify'
  });

  const downloadPdf = async () => {
    try {
      const res = await fetch(`${API_BASE}/certificate/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate, verify_url: window.location.origin + '/verify' })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'qsign-certificate.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* backend offline — JSON download still available */ }
  };

  return (
    <section className="certificate-document" aria-label="Issued quantum notarization certificate">
      <div className="certificate-document__frame">
        <div className="certificate-document__header">
          <div>
            <h2>Quantum Notarization Certificate</h2>
            <p className="certificate-document__eyebrow">{ref} · Bell-CHSH Protocol</p>
          </div>
          <div className="certificate-document__stamp">{bellViolated ? '✓ QUANTUM VERIFIED' : 'UNVERIFIED'}</div>
        </div>

        <div className="certificate-document__readout">
          <ChshReadout value={chshValue} />
          <div className="certificate-document__interference">
            <InterferencePattern variant="reactive" chshValue={chshValue} />
          </div>
        </div>

        {correlationCurve.length > 0 ? <CorrelationChart data={correlationCurve} /> : null}

        <div className="certificate-document__footer">
          <CertificateDetailsTable certificate={certificate} />
          <div className="certificate-document__actions">
            <span className="cert-seal" aria-hidden="true">
              <span className="cert-seal__mark">Q</span>
              <span className="cert-seal__sub">QUANTUM · SEALED</span>
            </span>
            <div className="cert-qr"><QRCodeSVG value={qrToken} size={104} level="M" fgColor="#0B2D52" /></div>
            <span className="cert-qr__caption">Scan to verify</span>
            <IBMBadge backend={quantum.backend} />
            <button type="button" className="button button--primary button--block" onClick={downloadPdf}>
              <Download size={15} /> PDF + QR
            </button>
            <button type="button" className="button button--secondary button--block" onClick={onDownload}>
              <FileText size={15} /> JSON
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
