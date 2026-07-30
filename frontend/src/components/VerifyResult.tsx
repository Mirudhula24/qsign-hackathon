interface VerifyResultProps {
  result: Record<string, unknown>;
}

export default function VerifyResult({ result }: VerifyResultProps) {
  const overall = Boolean(result.overall);
  const hashMatch = Boolean(result.hash_match);
  const bellViolated = Boolean(result.bell_violated);
  const signatureValid = Boolean(result.signature_valid);
  const chshValue = typeof result.chsh_value === 'number' ? result.chsh_value : null;

  return (
    <section className={`verify-result ${overall ? 'verify-result--pass' : 'verify-result--fail'}`}>
      <div className="verify-result__banner">
        <h3>{overall ? 'Certificate verified' : 'Certificate rejected'}</h3>
        <p>{overall ? 'All checks completed successfully.' : 'One or more checks did not pass.'}</p>
      </div>
      <div className="verify-result__rows">
        <div className="verify-result__row">
          <span>Hash match</span>
          <strong>{hashMatch ? 'Passed' : 'Failed'}</strong>
        </div>
        <div className="verify-result__row">
          <span>Bell violated</span>
          <strong>{bellViolated ? 'Passed' : 'Failed'}</strong>
        </div>
        {chshValue !== null ? (
          <div className="verify-result__row">
            <span>Observed CHSH score</span>
            <strong className={chshValue > 2 ? 'verify-result__score--pass' : 'verify-result__score--fail'}>{chshValue.toFixed(4)}</strong>
          </div>
        ) : null}
        <div className="verify-result__row">
          <span>Signature valid</span>
          <strong>{signatureValid ? 'Passed' : 'Failed'}</strong>
        </div>
      </div>
      {!overall ? (
        <p className="verify-result__note">
          {bellViolated
            ? 'The certificate failed an integrity check: its document hash or cryptographic signature does not match.'
            : 'The quantum origin check failed because the observed Bell-CHSH score fell below the classical boundary of 2.0.'}
        </p>
      ) : null}
    </section>
  );
}
