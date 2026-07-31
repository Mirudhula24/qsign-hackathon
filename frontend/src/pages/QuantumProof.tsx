import { useEffect, useState } from 'react';
import { getHardware, getCorrelation } from '../api/client';
import HardwareProvenance from '../components/HardwareProvenance';
import QuantumCorrelationChart from '../components/QuantumCorrelationChart';
import type { HardwareResult, CorrelationData } from '../types';

export default function QuantumProof() {
  const [hw, setHw] = useState<HardwareResult | null>(null);
  const [corr, setCorr] = useState<CorrelationData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [hardware, correlation] = await Promise.all([getHardware(), getCorrelation()]);
        if (!alive) return;
        setHw(hardware);
        setCorr(correlation);
      } catch (caughtError) {
        if (alive) setError(caughtError instanceof Error ? caughtError.message : 'Could not load quantum proof data.');
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section className="page page--wide">
      <header className="page__header">
        <h1 className="page__title">Quantum Proof</h1>
        <p className="page__subtitle">
          Every notarization runs a real Bell–CHSH experiment. The CHSH score below was measured on
          real IBM Quantum hardware; the correlation sweep is run on the simulator, since measuring
          many angles on a live QPU would be slow and costly. Together they show the same physics.
        </p>
      </header>

      {error ? <p className="inline-message">{error}</p> : null}

      <div className="stack">
        <HardwareProvenance hw={hw} />

        <div className="card-shell">
          <p className="correlation-chart__label">Correlation curve — measured vs classical</p>
          {corr ? <QuantumCorrelationChart curve={corr.curve} /> : <p className="helper-text">Loading correlation data…</p>}
          <p className="page__note" style={{ marginTop: 'var(--sp-2)' }}>
            The measured quantum correlation (navy) tracks the cosine prediction and pulls away from the
            classical limit (red). Combining four of these angle measurements gives CHSH ={' '}
            <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>{corr ? corr.chsh_value : '…'}</b>,
            above the classical ceiling of 2.0 — an excess no classical system can reproduce.
          </p>
        </div>
      </div>
    </section>
  );
}
