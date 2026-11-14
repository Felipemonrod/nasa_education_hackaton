/**
 * Base lunar DESENHADA (SVG). Mixed media: o mundo e desenhado, a janela
 * "olhar espaco" traz foto real da NASA. Iluminacao unificada -- luz dura
 * vindo da esquerda e sombra preta e seca, como na Lua de verdade, onde
 * nao ha atmosfera para espalhar luz.
 */
export function MoonScene({ phase }: { phase: 'day' | 'night' }): JSX.Element {
  const night = phase === 'night';
  return (
    <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label="Base lunar">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={night ? '#070910' : '#0d1420'} />
          <stop offset="100%" stopColor={night ? '#0b0e14' : '#131a28'} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={night ? '#2a2f3b' : '#4a5160'} />
          <stop offset="55%" stopColor={night ? '#20242e' : '#3a4150'} />
          <stop offset="100%" stopColor="#15181f" />
        </linearGradient>
        <linearGradient id="dome" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={night ? '#8b93a6' : '#d6dbe6'} />
          <stop offset="60%" stopColor={night ? '#5b6274' : '#9aa3b5'} />
          <stop offset="100%" stopColor="#3b4150" />
        </linearGradient>
      </defs>

      <rect width="400" height="150" fill="url(#sky)" />
      {[[30, 18], [88, 32], [150, 14], [214, 26], [272, 12], [330, 30], [370, 20], [118, 48], [250, 46]]
        .map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.4 : 1} fill="#fff" opacity={night ? 0.85 : 0.5} />
        ))}

      {/* Terra no ceu: sempre no mesmo ponto, porque a Lua mostra sempre a mesma face */}
      <g opacity={night ? 0.95 : 0.75}>
        <circle cx="330" cy="42" r="13" fill="#1d4ed8" />
        <path d="M322 38c4 1 6 4 10 3s6-3 9 0-3 6-7 7-9-2-12-5z" fill="#16a34a" opacity=".85" />
        <circle cx="330" cy="42" r="13" fill="none" stroke="#93c5fd" strokeWidth="0.8" opacity=".6" />
        <path d="M317 42a13 13 0 0 0 26 0" fill="#000" opacity=".35" />
      </g>

      {/* Solo */}
      <path d="M0 104 Q60 96 120 102 T250 100 T400 106 L400 150 L0 150Z" fill="url(#ground)" />
      <ellipse cx="78" cy="118" rx="26" ry="5" fill="#000" opacity=".25" />
      <ellipse cx="300" cy="126" rx="34" ry="6" fill="#000" opacity=".22" />

      {/* Habitat: cupula central + modulos + cobertura de regolito */}
      <g>
        <ellipse cx="190" cy="112" rx="52" ry="7" fill="#000" opacity=".4" />
        <path d="M152 112a38 30 0 0 1 76 0z" fill="url(#dome)" />
        <path d="M158 112a32 25 0 0 1 64 0z" fill="#000" opacity=".12" />
        {/* sacos de regolito sobre a cupula */}
        <path d="M156 106a34 22 0 0 1 68 0" fill="none" stroke="#6b7280" strokeWidth="5" strokeLinecap="round" opacity=".9" />
        <path d="M162 99a28 16 0 0 1 56 0" fill="none" stroke="#565e6c" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        {/* escotilhas: fechadas a noite */}
        <rect x="176" y="98" width="10" height="12" rx="2" fill={night ? '#1a1f2b' : '#fbbf24'} opacity={night ? 1 : .9} />
        <rect x="194" y="98" width="10" height="12" rx="2" fill={night ? '#1a1f2b' : '#fbbf24'} opacity={night ? 1 : .9} />
        {/* eclusa */}
        <rect x="228" y="98" width="18" height="14" rx="3" fill="#4b5563" />
        <rect x="233" y="102" width="8" height="10" rx="2" fill={night ? '#111827' : '#7dd3fc'} />
      </g>

      {/* Paineis solares */}
      <g transform="translate(62 92)">
        <rect x="-2" y="14" width="4" height="12" fill="#4b5563" />
        <g transform="rotate(-18)">
          <rect x="-24" y="0" width="48" height="16" rx="2" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="0.7" />
          <path d="M-24 8h48M-8 0v16M8 0v16" stroke="#60a5fa" strokeWidth="0.5" opacity=".7" />
        </g>
      </g>
      <g transform="translate(310 100)">
        <rect x="-2" y="12" width="4" height="12" fill="#4b5563" />
        <g transform="rotate(-14)">
          <rect x="-20" y="0" width="40" height="13" rx="2" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="0.7" />
          <path d="M-20 6.5h40M-6 0v13M8 0v13" stroke="#60a5fa" strokeWidth="0.5" opacity=".7" />
        </g>
      </g>

      {/* Antena */}
      <g transform="translate(268 86)">
        <rect x="-1.5" y="10" width="3" height="18" fill="#4b5563" />
        <ellipse cx="0" cy="6" rx="9" ry="7" fill="#9aa3b5" transform="rotate(-25)" />
        <ellipse cx="0" cy="6" rx="6" ry="4.5" fill="#6b7280" transform="rotate(-25)" />
      </g>

      {/* Rover */}
      <g transform="translate(112 108)">
        <rect x="0" y="-7" width="22" height="7" rx="2" fill="#9aa3b5" />
        <rect x="4" y="-11" width="9" height="5" rx="1.5" fill="#7dd3fc" opacity=".8" />
        <circle cx="4" cy="1" r="3" fill="#374151" />
        <circle cx="18" cy="1" r="3" fill="#374151" />
      </g>
    </svg>
  );
}
