interface InterferencePatternProps {
  variant?: 'decorative' | 'reactive';
  chshValue?: number;
  className?: string;
}

export default function InterferencePattern({ variant = 'decorative', chshValue = 2.0, className }: InterferencePatternProps) {
  const isReactive = variant === 'reactive';
  const score = Number.isFinite(chshValue) ? chshValue : 2.0;
  const normalized = Math.max(0, Math.min(1, (score - 2.0) / 2.0));
  const sourceA = isReactive
    ? { x: 28 + normalized * 20, y: 50 }
    : { x: -8, y: 46 };
  const sourceB = isReactive
    ? { x: 72, y: 50 }
    : { x: 108, y: 54 };
  const distance = isReactive ? 0.55 + (1 - normalized) * 0.3 : 0.8;
  const rings = Array.from({ length: 12 }, (_, index) => {
    const radius = 9 + index * 6;
    const strokeWidth = 0.6 + (index % 3) * 0.2;
    const opacity = isReactive
      ? 0.04 + (1 - normalized) * 0.06 + index * 0.008
      : 0.03 + index * 0.008;
    return { radius, strokeWidth, opacity };
  });

  return (
    <svg className={className} viewBox="0 0 100 100" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="interference-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--danger)" />
        </linearGradient>
      </defs>
      {rings.map((ring, index) => (
        <circle
          key={index}
          cx={sourceA.x}
          cy={sourceA.y}
          r={ring.radius}
          fill="none"
          stroke="url(#interference-gradient)"
          strokeWidth={ring.strokeWidth}
          opacity={ring.opacity}
          style={{ transformOrigin: `${sourceA.x}% ${sourceA.y}%`, transform: `scale(${distance})` }}
        />
      ))}
      {rings.map((ring, index) => (
        <circle
          key={`b-${index}`}
          cx={sourceB.x}
          cy={sourceB.y}
          r={ring.radius * 0.85}
          fill="none"
          stroke="url(#interference-gradient)"
          strokeWidth={ring.strokeWidth * 0.9}
          opacity={ring.opacity * 0.8}
          style={{ transformOrigin: `${sourceB.x}% ${sourceB.y}%`, transform: `scale(${distance * 0.95})` }}
        />
      ))}
    </svg>
  );
}
