import { Fragment } from 'react';
import { Check } from 'lucide-react';

interface StatusStepsProps {
  steps: string[];
  current: number; // index of the active step; earlier steps render as done
}

export default function StatusSteps({ steps, current }: StatusStepsProps) {
  return (
    <div className="steps" role="list" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={label}>
            <div className={`step${active ? ' step--active' : ''}${done ? ' step--done' : ''}`} role="listitem">
              <span className="step__dot">{done ? <Check size={16} strokeWidth={2.5} /> : i + 1}</span>
              <span className="step__label">{label}</span>
            </div>
            {i < steps.length - 1 ? <span className={`step__line${done ? ' step__line--done' : ''}`} aria-hidden="true" /> : null}
          </Fragment>
        );
      })}
    </div>
  );
}
