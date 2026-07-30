interface QuantumScoreCardProps {
  score: number;
}

export default function QuantumScoreCard({ score }: QuantumScoreCardProps) {
  const fillPercent = Math.max(0, Math.min(100, (score / 4) * 100));
  const tickPercent = 50;

  return (
    <section className="quantum-card">
      <div className="quantum-card__content">
        <p className="section-label">QUANTUM ORIGIN SCORE</p>
        <div className="quantum-card__score">{score.toFixed(4)}</div>
        <p className="quantum-card__description">Classical systems cannot exceed 2.0 — verified by Bell-CHSH inequality.</p>
        <div className="quantum-card__bar" aria-hidden="true">
          <div className="quantum-card__bar-track" />
          <div className="quantum-card__bar-fill" style={{ width: `${fillPercent}%` }} />
          <div className="quantum-card__bar-tick" style={{ left: `${tickPercent}%` }} />
        </div>
        <div className="quantum-card__scale">
          <span>0</span>
          <span className="quantum-card__scale-bound">Classical bound: 2.0</span>
          <span>4.0</span>
        </div>
      </div>
    </section>
  );
}