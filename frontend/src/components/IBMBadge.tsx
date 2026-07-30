interface IBMBadgeProps {
  backend?: unknown;
}

export default function IBMBadge({ backend }: IBMBadgeProps) {
  const backendName = typeof backend === 'string' && backend ? backend : 'Unknown backend';
  const isHardware = /ibm|hardware/i.test(backendName) && !/simulator/i.test(backendName);

  return (
    <div className="ibm-badge">
      <span>{isHardware ? 'Quantum hardware' : 'Quantum backend'}</span>
      <strong>{backendName}</strong>
    </div>
  );
}
