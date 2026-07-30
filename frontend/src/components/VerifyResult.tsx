import { ShieldCheck, ShieldX, Check, X } from 'lucide-react';

interface VerifyResultProps {
  result: Record<string, unknown>;
}

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="verify-result__row">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {ok
          ? <Check size={15} strokeWidth={2.5} color="var(--success)" />
          : <X size={15} strokeWidth={2.5} color="var(--error)" />}
        {label}
      </span>
      <strong className={ok ? 'verify-result__score--pass' : 'verify-result__score--fail'}>{detail}</strong>
    </div>
  );
}

export default function VerifyResult({ result }: VerifyResultProps) {
  const overall = Boolean(result.overall);
  const hashMatch = Boolean(result.hash_match);
  const bellViolated = Boolean(result.bell_violated);
  const documentBound = result.document_bound;
  const signatureValid = Boolean(result.signature_valid);
  const issuerTrusted = result.issuer_trusted;
  const scheme = typeof result.signature_scheme === 'string' ? result.signature_scheme : 'signed';
  const chshValue = typeof result.chsh_value === 'number' ? result.chsh_value : null;

  return (
    <section className={`verify-result ${overall ? 'verify-result--pass' : 'verify-result--fail'}`}>
      <div className="verify-result__head">
        <div className={`verify-stamp${overall ? '' : ' verify-stamp--fail'}`} aria-hidden="true">
          <span className="verify-stamp__mark">
            {overall ? <ShieldCheck size={34} strokeWidth={1.6} /> : <ShieldX size={34} strokeWidth={1.6} />}
          </span>
          <span className="verify-stamp__label">{overall ? 'VERIFIED' : 'REJECTED'}</span>
          <span className="verify-stamp__sub">QSIGN · Bell-CHSH</span>
        </div>
        <div className="verify-result__banner">
          <h3>{overall ? 'Certificate Verified' : 'Certificate Rejected'}</h3>
          <p>
            {overall
              ? 'All checks passed — document fingerprint, quantum origin, document-bound circuit, signature, and issuer.'
              : 'One or more checks did not pass. See the breakdown below.'}
          </p>
        </div>
      </div>

      <div className="verify-result__rows">
        <Row label="Document fingerprint" ok={hashMatch} detail={hashMatch ? 'Matched' : 'Mismatch'} />
        <Row
          label="Quantum origin (Bell–CHSH)"
          ok={bellViolated}
          detail={chshValue !== null ? `${chshValue.toFixed(4)} ${bellViolated ? '> 2.0' : '< 2.0'}` : (bellViolated ? 'Passed' : 'Failed')}
        />
        {documentBound !== undefined && documentBound !== null ? (
          <Row label="Document-bound circuit" ok={documentBound !== false} detail={documentBound !== false ? 'Bound' : 'Replayed'} />
        ) : null}
        <Row label="Post-quantum signature" ok={signatureValid} detail={signatureValid ? `Valid · ${scheme}` : 'Invalid'} />
        {issuerTrusted !== undefined && issuerTrusted !== null ? (
          <Row label="Trusted issuer" ok={Boolean(issuerTrusted)} detail={issuerTrusted ? 'QSIGN authority' : 'Unrecognized'} />
        ) : null}
      </div>

      {!overall ? (
        <p className="verify-result__note">
          {!bellViolated
            ? `The quantum-origin check failed: the observed Bell–CHSH score fell at or below the classical boundary of 2.0. Classical randomness cannot exceed this bound, making the forgery physically detectable.`
            : `An integrity check failed: the document, certificate, or issuing authority does not match what was originally notarized.`}
        </p>
      ) : null}
    </section>
  );
}
