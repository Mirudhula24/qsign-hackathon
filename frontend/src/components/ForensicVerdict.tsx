import { Sparkles } from 'lucide-react';

interface ForensicVerdictProps {
  verdict?: string;
  model?: string | null;
  loading?: boolean;
}

export default function ForensicVerdict({ verdict, model, loading }: ForensicVerdictProps) {
  return (
    <div className="verdict-panel">
      <div className="verdict-panel__head">
        <span className="verdict-panel__label"><Sparkles size={13} strokeWidth={2} /> AI Forensic Verdict</span>
        {model && !loading ? <span className="verdict-panel__badge">{model}</span> : null}
      </div>
      <p className="verdict-panel__text">
        {loading ? 'Generating forensic analysis…' : (verdict || 'Forensic analysis unavailable.')}
      </p>
    </div>
  );
}
