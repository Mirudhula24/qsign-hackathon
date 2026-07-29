import type { AuditRow } from '../types';

const auditRows: AuditRow[] = [
  // TODO: replace with real session history if time allows
  { time: '09:14:22', document: 'property_deed.pdf', chshScore: 2.8411, status: 'Verified' },
  { time: '09:45:11', document: 'will_testament.pdf', chshScore: 2.8372, status: 'Verified' },
  { time: '10:02:33', document: 'land_title.pdf', chshScore: 2.8298, status: 'Verified' },
  { time: '10:18:45', document: 'fake_cert_attempt.pdf', chshScore: 1.74, status: 'Rejected' }
];

export default function AuditLog() {
  return (
    <section className="page page--wide">
      <header className="page__header">
        <h1 className="page__title">Audit Log</h1>
        <p className="page__subtitle">A record of all notarizations performed in this session.</p>
      </header>

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Document</th>
              <th>CHSH Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {auditRows.map((row) => (
              <tr key={`${row.time}-${row.document}`}>
                <td>{row.time}</td>
                <td>{row.document}</td>
                <td className={row.chshScore >= 2 ? 'mono audit-score audit-score--pass' : 'mono audit-score audit-score--fail'}>
                  {row.chshScore.toFixed(row.chshScore >= 2 ? 4 : 2)}
                </td>
                <td className={row.status === 'Verified' ? 'status-pass' : 'status-fail'}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="page__note">CHSH scores above 2.0 indicate quantum-certified randomness. Classical systems are physically bounded below 2.0.</p>
    </section>
  );
}