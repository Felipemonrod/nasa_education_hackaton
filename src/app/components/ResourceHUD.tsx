import { Activity, Salad, Shield, Wind, Zap, Microscope, HeartPulse } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Stat, Stats, TrackStat } from '../../engine/types.js';
import type { HudTheme } from '../store/useAccount.js';
import { useT } from '../i18n/useI18n.js';

/**
 * HUD em VALORES NUMERICOS 0-100, como o design pede. A barra e apoio
 * visual; o numero e a informacao.
 *
 * `dose` e desenhada ao contrario: nos outros recursos a barra cheia e boa,
 * nela a barra cheia mata. Por isso a dose enche da DIREITA para a esquerda
 * e muda de cor conforme sobe -- sem isso o mesmo desenho teria dois
 * significados opostos na mesma tela.
 *
 * Tamanhos em rem, nunca px: a escala de texto da acessibilidade so afeta
 * rem, e um HUD que nao cresce junto deixa de fora exatamente quem pediu
 * texto maior.
 */

interface Row {
  readonly stat: Stat;
  readonly labelKey: string;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly bar: string;
  readonly inverted?: boolean;
  /** Trilho de objetivo: comeca em 0 e SUBIR e bom, logo 0 nao e perigo. */
  readonly goal?: boolean;
}

const BASIC_ROWS: readonly Row[] = [
  { stat: 'oxygen', labelKey: 'stat.oxygen', icon: Wind, color: 'text-oxygen', bar: 'bg-oxygen' },
  { stat: 'power', labelKey: 'stat.power', icon: Zap, color: 'text-power', bar: 'bg-power' },
  { stat: 'food', labelKey: 'stat.food', icon: Salad, color: 'text-food', bar: 'bg-food' },
  { stat: 'dose', labelKey: 'stat.dose', icon: Activity, color: 'text-radiation', bar: 'bg-radiation', inverted: true },
];

const THEME_ACCENT: Record<HudTheme, string> = {
  mission: 'from-sky-400/15',
  amber: 'from-power/15',
  mint: 'from-life/15',
  rose: 'from-radiation/15',
};

function danger(row: Row, value: number): boolean {
  // Um trilho de objetivo em 0 e o ponto de partida, nao uma emergencia.
  if (row.goal === true) return false;
  if (row.stat === 'shielding') return value <= 25;
  return row.inverted === true ? value >= 75 : value <= 25;
}

function StatRow({ row, value }: { row: Row; value: number }): JSX.Element {
  const t = useT();
  const Icon = row.icon;
  const isDanger = danger(row, value);
  const label = t(row.labelKey);
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className={`${row.color} shrink-0`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-[0.68rem] font-bold uppercase tracking-wide text-slate-300">
            {label}
          </span>
          {/* role="img" + aria-label: aria-label em <span> generico e ignorado
              pela maioria dos leitores de tela. */}
          <span
            role="img"
            aria-label={t('hud.valueAria', { label, value })}
            className={`tabular-nums text-[0.9rem] font-extrabold ${isDanger ? 'text-radiation' : row.color}`}
          >
            {value}
          </span>
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${row.bar} transition-[width] duration-500
                        ${row.inverted === true ? 'ml-auto' : ''}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
      {isDanger ? (
        <span
          role="img"
          aria-label={t('hud.dangerAria', { stat: label })}
          className="shrink-0 rounded-md bg-radiation/20 px-1 text-[0.65rem] font-extrabold text-radiation"
        >
          !
        </span>
      ) : null}
    </div>
  );
}

export function ResourceHUD({
  stats, objective, theme,
}: {
  stats: Stats;
  objective: TrackStat;
  theme: HudTheme;
}): JSX.Element {
  const t = useT();
  const trackRow: Row = objective === 'science'
    ? { stat: 'science', labelKey: 'stat.science', icon: Microscope, color: 'text-science', bar: 'bg-science', goal: true }
    : { stat: 'lifeSupport', labelKey: 'stat.lifeSupport', icon: HeartPulse, color: 'text-life', bar: 'bg-life', goal: true };

  return (
    <div className={`rounded-3xl glass bg-gradient-to-b ${THEME_ACCENT[theme]} to-transparent p-3`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {BASIC_ROWS.map((row) => (
          <StatRow key={row.stat} row={row} value={stats[row.stat]} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 border-t border-white/10 pt-2.5">
        <StatRow
          row={{ stat: 'shielding', labelKey: 'stat.shielding', icon: Shield, color: 'text-slate-200', bar: 'bg-slate-300' }}
          value={stats.shielding}
        />
        <StatRow row={trackRow} value={stats[trackRow.stat]} />
      </div>
      <p className="mt-2 text-[0.7rem] leading-tight text-slate-300">
        {t('hud.doseNote', { limit: t('hud.doseLimit') })}
      </p>
    </div>
  );
}
