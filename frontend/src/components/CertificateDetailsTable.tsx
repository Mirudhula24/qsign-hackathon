interface CertificateDetailsTableProps {
  certificate: Record<string, unknown>;
}

function toDisplay(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '—';
}

export default function CertificateDetailsTable({ certificate }: CertificateDetailsTableProps) {
  const quantum = (certificate.quantum_proof as Record<string, unknown> | undefined) ?? {};
  const rows = [
    ['Document', certificate.filename ?? '—'],
    ['Timestamp', certificate.timestamp ?? '—'],
    ['Hash', certificate.document_hash ?? '—'],
    ['Circuit', quantum.circuit ?? '—'],
    ['Backend', quantum.backend ?? '—'],
    ['Bell violated', quantum.bell_violated ? 'true' : 'false']
  ];

  return (
    <table className="certificate-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label as string}>
            <th>{label as string}</th>
            <td>{toDisplay(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
