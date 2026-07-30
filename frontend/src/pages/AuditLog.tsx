import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import { getAuditLog } from '../api/client';
import AuditTable from '../components/AuditTable';
import type { AuditRow } from '../types';

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Verified' | 'Rejected'>('all');

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

  const filtered = useMemo(() => rows.filter((r) => {
    const matchesQuery = r.document.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [rows, query, statusFilter]);

  const exportCsv = () => {
    const header = 'Time,Document,CHSH,User,Status\n';
    const body = filtered.map((r) => `${r.time},"${r.document}",${r.chshScore},QSIGN Authority,${r.status}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'qsign-audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page page--wide">
      <header className="page__header">
        <h1 className="page__title">Audit Log</h1>
        <p className="page__subtitle">A live, tamper-evident record of every notarization in this session.</p>
      </header>

      <div className="audit-toolbar">
        <div className="audit-search">
          <Search size={16} color="var(--text-secondary)" />
          <input placeholder="Search by document…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button className="button button--ghost" type="button" onClick={exportCsv}><Download size={15} /> Export</button>
        <button className="button button--secondary" type="button" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <p className="inline-message">{error}</p> : null}
      {loading ? <p className="helper-text">Loading notarization records…</p> : <AuditTable rows={filtered} />}

      <p className="page__note">CHSH scores above 2.0 indicate quantum-certified randomness. Classical systems are physically bounded at or below 2.0.</p>
    </section>
  );
}
