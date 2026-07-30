interface StatusStepsProps {
  completed: boolean[];
}

const steps = [
  'Document fingerprint computed',
  'Bell-CHSH circuit run',
  'Certificate assembled'
];

export default function StatusSteps({ completed }: StatusStepsProps) {
  return (
    <ol className="status-steps">
      {steps.map((step, index) => (
        <li key={step} className="status-steps__item">
          <span className="status-steps__number">{index + 1}</span>
          <span className="status-steps__label">{step}</span>
          <span className="status-steps__check">{completed[index] ? '✓' : ''}</span>
        </li>
      ))}
    </ol>
  );
}