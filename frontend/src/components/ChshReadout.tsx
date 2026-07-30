interface ChshReadoutProps {
  value: number;
  className?: string;
}

export default function ChshReadout({ value, className }: ChshReadoutProps) {
  const score = Number.isFinite(value) ? value : 2.0;
  const violation = score > 2.0;

  return (
    <div className={className}>
      <div className="chsh-readout__meta">
        <span className="chsh-readout__label">CHSH readout</span>
        <span className={`chsh-readout__status ${violation ? 'is-valid' : 'is-invalid'}`}>
          {violation ? 'Bell violation confirmed' : 'Classical bound retained'}
        </span>
      </div>
      <div className="chsh-readout__value">{score.toFixed(4)}</div>
      <div className="chsh-readout__bar" aria-hidden="true">
        <div className="chsh-readout__track" />
        <div className="chsh-readout__fill" style={{ width: `${Math.max(5, Math.min(100, (score / 4) * 100))}%` }} />
        <div className="chsh-readout__tick" style={{ left: '50%' }} />
      </div>
      <div className="chsh-readout__scale">
        <span>0.0</span>
        <span>2.0</span>
        <span>4.0</span>
      </div>
    </div>
  );
}
