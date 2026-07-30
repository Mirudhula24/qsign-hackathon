import InterferencePattern from './InterferencePattern';
import ChshReadout from './ChshReadout';
import CertificateDetailsTable from './CertificateDetailsTable';
import CorrelationChart from './CorrelationChart';
import IBMBadge from './IBMBadge';

interface CertificateDocumentProps {
  certificate: Record<string, unknown>;
  onDownload?: () => void;
}

export default function CertificateDocument({ certificate, onDownload }: CertificateDocumentProps) {
  const quantum = (certificate.quantum_proof as Record<string, unknown> | undefined) ?? {};
  const chshValue = typeof quantum.chsh_value === 'number' ? quantum.chsh_value : 0;
  const correlationCurve = (quantum.correlation_curve as Array<{ angle: number; value: number }> | undefined) ?? [];

  return (
    <section className="certificate-document" aria-label="Issued quantum notarization certificate">
      <div className="certificate-document__frame">
        <div className="certificate-document__header">
          <div>
            <h2>Quantum Notarization Certificate</h2>
            <p className="certificate-document__eyebrow">QSIGN-CERT-2026 · Bell-CHSH Protocol</p>
          </div>
          <div className="certificate-document__stamp">✓ QUANTUM VERIFIED</div>
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
            <IBMBadge backend={quantum.backend} />
            <button type="button" className="button button--secondary" onClick={onDownload}>Download certificate</button>
          </div>
        </div>
      </div>
    </section>
  );
}
