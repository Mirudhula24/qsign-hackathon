import { useCallback, useEffect, useState } from 'react';
import { getAuditLog } from '../api/client';
import AuditTable from '../components/AuditTable';
import type { AuditRow } from '../types';

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await getAuditLog());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="page page--wide">
      <header className="page__header">
        <h1 className="page__title">Audit Log</h1>
        <p className="page__subtitle">A live record of notarizations performed during this backend session.</p>
      </header>

      <div className="audit-toolbar">
        <span className="helper-text">Records come directly from the QSIGN API.</span>
        <button className="button button--secondary" type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="card-shell">
        {error ? <p className="inline-message">{error}</p> : null}
        {loading ? <p className="helper-text">Loading notarization records…</p> : null}
        {!loading && !error ? <AuditTable rows={rows} /> : null}
      </div>

      <p className="page__note">CHSH scores above 2.0 indicate quantum-certified randomness. Classical systems are physically bounded at or below 2.0.</p>
    </section>
  );
}
