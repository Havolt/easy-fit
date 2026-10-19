export type PandaState = 'eating' | 'sleeping' | 'sitting' | 'standing' | 'walking' | 'sprinting';

export function pandaStateForScore(score: number): PandaState {
  if (score < 20) return 'sleeping';
  if (score < 40) return 'sitting';
  if (score < 60) return 'standing';
  if (score < 80) return 'walking';
  return 'sprinting';
}

const stateLabels: Record<PandaState, string> = {
  eating: 'No score yet',
  sleeping: 'Taking it easy',
  sitting: 'Getting started',
  standing: 'Making progress',
  walking: 'Doing well',
  sprinting: 'Fantastic day',
};

export function PandaMascot({ score = 0, hasData = true }: { score?: number; hasData?: boolean }) {
  const state = hasData ? pandaStateForScore(score) : 'eating';
  const accessibleLabel = hasData
    ? `Panda says: ${stateLabels[state]}. Diet power score ${score} out of 100.`
    : 'Panda says: No score yet. Add your calories and exercise to get started.';
  return (
    <div className={`panda-stage panda-${state}`} role="img" aria-label={accessibleLabel}>
      <span className="panda-z" aria-hidden="true">
        Z<span>z</span>
      </span>
      <svg className="animated-panda" viewBox="0 0 180 180" aria-hidden="true">
        <g className="panda-shadow">
          <ellipse cx="90" cy="157" rx="47" ry="8" />
        </g>
        <g className="panda-figure">
          <path className="panda-leg panda-leg-back" d="M62 125v24q0 9-10 9h-8" />
          <path className="panda-leg panda-leg-front" d="M118 125v24q0 9 10 9h8" />
          <ellipse className="panda-body" cx="90" cy="105" rx="53" ry="55" />
          <path
            className="panda-belly-patch"
            d="M58 105q8-31 32-27 24-4 32 27-4 40-32 42-28-2-32-42z"
          />
          <circle className="panda-ear" cx="47" cy="47" r="23" />
          <circle className="panda-ear" cx="133" cy="47" r="23" />
          <ellipse className="panda-head" cx="90" cy="76" rx="52" ry="47" />
          <path
            className="panda-patch"
            d="M55 70q5-24 25-13 11 8-3 30-14 12-22-17M125 70q-5-24-25-13-11 8 3 30 14 12 22-17"
          />
          <circle className="panda-eye" cx="70" cy="72" r="5" />
          <circle className="panda-eye" cx="110" cy="72" r="5" />
          <ellipse className="panda-muzzle" cx="90" cy="91" rx="20" ry="15" />
          <path className="panda-smile" d="M82 94q8 9 16 0" />
          <path className="panda-band" d="M39 55q51-31 102 0" />
          <path className="panda-band-tail" d="M137 48l20-8-9 19" />
          <path className="panda-arm panda-arm-back" d="M48 96q-24 16-15 36" />
          <path className="panda-arm panda-arm-front" d="M132 96q24 16 15 36" />
        </g>
        <g className="panda-bamboo panda-foreground" aria-hidden="true">
          <path d="M135 150L112 103" />
          <path d="M120 119q-16-9-21-1 12 10 21 1M126 132q14-10 20-3-10 12-20 3" />
        </g>
      </svg>
      <span className="panda-state-label">{stateLabels[state]}</span>
    </div>
  );
}
