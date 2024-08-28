export const BackVariants = {
  fill: ({ p = 25, c = '#222' }) => (
    <g>
      <rect width={p * 2} height={p * 2} fill={c} />
    </g>
  ),
  points: ({ p = 25, s = 3, c = '#666' }) => (
    <g>
      <rect width={p * 2} height={p * 2} fill="none" />

      <circle cx={p} cy={p} r={s} fill={c} />
    </g>
  ),
  grid: ({ p = 25, s = 1, c = '#666' }) => (
    <g>
      <rect width={p * 2} height={p * 2} fill="none" />

      <line x1={0} y1={p} x2={p * 2} y2={p} strokeWidth={s} stroke={c} />
      <line x1={p} y1={0} x2={p} y2={p * 2} strokeWidth={s} stroke={c} />
    </g>
  ),
  gridpoints: ({ p = 25, s = 1, s2 = s, c = '#666', c2 = c }) => (
    <g>
      <rect width={p * 2} height={p * 2} fill="none" />

      <line x1={0} y1={p} x2={p * 2} y2={p} strokeWidth={s} stroke={c} />
      <line x1={p} y1={0} x2={p} y2={p * 2} strokeWidth={s} stroke={c} />
      <circle cx={p} cy={p} r={s2} fill={c2} />
    </g>
  ),
  lines: ({ p = 25, s = 1, c = '#666' }) => (
    <g>
      <rect width={p * 2} height={p * 2} fill="none" />

      <line x1={0} y1={0} x2={p * 2} y2={p * 2} strokeWidth={s} stroke={c} />
      <line x1={0} y1={p} x2={p} y2={p * 2} strokeWidth={s} stroke={c} />
      <line x1={p} y1={0} x2={p * 2} y2={p} strokeWidth={s} stroke={c} />

      <line x1={0} y1={p * 2} x2={p * 2} y2={0} strokeWidth={s} stroke={c} />
      <line x1={0} y1={p} x2={p} y2={0} strokeWidth={s} stroke={c} />
      <line x1={p} y1={p * 2} x2={p * 2} y2={p} strokeWidth={s} stroke={c} />
    </g>
  ),
  pluses: ({ p = 25, s = 1, c = '#666', s2 = .25 }) => (
    <g>
      <rect width={p * 2} height={p * 2} fill="none" />
      <line x1={p * (1 - s2)} y1={p} x2={p * (1 + s2)} y2={p} strokeWidth={s} stroke={c} />
      <line y1={p * (1 - s2)} x1={p} y2={p * (1 + s2)} x2={p} strokeWidth={s} stroke={c} />
    </g>
  ),
};