import type { VerifyResult } from '../types';

interface ResultCardProps {
  result: VerifyResult;
}

function getSignatureState(result: VerifyResult) {
  if (typeof result.signature_valid === 'boolean') {
    return result.signature_valid;
  }

  if (typeof result.signature_match === 'boolean') {
    return result.signature_match;
  }

  return false;
}

function getTimestamp(result: VerifyResult) {
  return result.timestamp ?? result.created_at ?? 'Timestamp unavailable';
}

export default function ResultCard({ result }: ResultCardProps) {
  const signatureOk = getSignatureState(result);
  // backend uses `bell_violated: true` when the certificate *did* violate (i.e., quantum)
  const quantumOk = !!result.bell_violated;
  const overallPassed = result.overall;
  const subtitle = overallPassed
    ? 'All three checks passed successfully.'
    : !result.hash_match
      ? 'Document fingerprint check failed.'
      : !quantumOk
        ? 'Quantum origin check failed.'
        : !signatureOk
          ? 'Cryptographic signature check failed.'
          : 'Verification failed.';

  return (
    <section className={`result-card${overallPassed ? ' result-card--pass' : ' result-card--fail'}`}>
      <div className="result-card__header">
        <div>
          <h2 className={`result-card__title${overallPassed ? ' result-card__title--pass' : ' result-card__title--fail'}`}>
            {overallPassed ? 'Document Verified' : 'Certificate Rejected'}
          </h2>
          <p className="result-card__subtitle">{subtitle}</p>
        </div>
      </div>

      <table className="result-card__table">
        <tbody>
          <tr>
            <td>Document fingerprint</td>
            <td className={result.hash_match ? 'status-pass' : 'status-fail'}>{result.hash_match ? 'Passed' : 'Failed'}</td>
          </tr>
          <tr>
            <td>Quantum origin score</td>
            <td className={quantumOk ? 'status-pass' : 'status-fail'}>{quantumOk ? 'Passed' : 'Failed'}</td>
          </tr>
          <tr>
            <td>Cryptographic signature</td>
            <td className={signatureOk ? 'status-pass' : 'status-fail'}>{signatureOk ? 'Passed' : 'Failed'}</td>
          </tr>
        </tbody>
      </table>

      {!overallPassed && !quantumOk ? (
        <div className="result-card__insight">
          This certificate was not produced on quantum hardware because its CHSH score falls below the classical
          bound of 2.0, making forgery physically detectable rather than just computationally hard.
        </div>
      ) : null}

      <p className="result-card__footer">Certificate timestamp: {getTimestamp(result)}</p>
    </section>
  );
}