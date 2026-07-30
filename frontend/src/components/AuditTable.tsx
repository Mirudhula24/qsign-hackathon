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
            <th>CHSH Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="audit-table__empty">No notarizations have been issued in this backend session.</td></tr>
          ) : null}
          {rows.map((row) => (
            <tr key={`${row.time}-${row.document}`}>
              <td>{row.time}</td>
              <td>{row.document}</td>
              <td className={row.chshScore > 2 ? 'audit-score audit-score--pass' : 'audit-score audit-score--fail'}>
                {row.chshScore.toFixed(4)}
              </td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
