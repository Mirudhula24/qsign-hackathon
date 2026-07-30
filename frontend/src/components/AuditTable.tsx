import { CheckCircle2, XCircle } from 'lucide-react';

interface AuditRow {
  time: string;
  document: string;
  chshScore: number;
  status: string;
}

interface AuditTableProps {
  rows: AuditRow[];
}

export default function AuditTable({ rows }: AuditTableProps) {
  return (
    <div className="audit-table-card">
      <table className="audit-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Document</th>
            <th>CHSH</th>
            <th>User</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="audit-table__empty">No records match — notarize a document to populate the ledger.</td></tr>
          ) : null}
          {rows.map((row) => {
            const pass = row.chshScore > 2;
            return (
              <tr key={`${row.time}-${row.document}`}>
                <td className="mono">{row.time}</td>
                <td>{row.document}</td>
                <td className={pass ? 'audit-score--pass' : 'audit-score--fail'}>{row.chshScore.toFixed(4)}</td>
                <td>QSIGN Authority</td>
                <td>
                  <span className={`status-pill ${row.status === 'Rejected' ? 'status-pill--fail' : 'status-pill--pass'}`}>
                    {row.status === 'Rejected' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                    {row.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
