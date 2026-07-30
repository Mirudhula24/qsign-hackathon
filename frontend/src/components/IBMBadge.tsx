import { Cpu } from 'lucide-react';

interface IBMBadgeProps {
  backend?: unknown;
}

export default function IBMBadge({ backend }: IBMBadgeProps) {
  const backendName = typeof backend === 'string' && backend ? backend : 'Unknown backend';
  const isHardware = /ibm|hardware/i.test(backendName) && !/simulator/i.test(backendName);

  return (
    <div className="ibm-badge">
      <Cpu size={20} strokeWidth={1.7} color="var(--navy)" />
      <span className="ibm-badge__text">
        <span>{isHardware ? 'IBM Quantum hardware' : 'Quantum backend'}</span>
        <strong>{backendName}</strong>
      </span>
    </div>
  );
}
