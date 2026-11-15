import { Activity, Salad, Shield, Wind, Zap, Microscope, HeartPulse } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Stat, Stats, TrackStat } from '../../engine/types.js';
import type { HudTheme } from '../store/useAccount.js';
import { useT } from '../i18n/useI18n.js';

interface Row {
  readonly stat: Stat;
  readonly labelKey: string;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly bar: string;
  readonly badgeBg: string;
  readonly inverted?: boolean;
  /** Trilho de objetivo: comeca em 0 e SUBIR e bom, logo 0 nao e perigo. */
  readonly goal?: boolean;
}

const BASIC_ROWS: readonly Row[] = [
  { stat: 'oxygen', labelKey: 'stat.oxygen', icon: Wind, color: 'text-oxygen', bar: 'bg-oxygen', badgeBg: 'bg-oxygen/15' },
  { stat: 'power', labelKey: 'stat.power', icon: Zap, color: 'text-power', bar: 'bg-power', badgeBg: 'bg-power/15' },
  { stat: 'food', labelKey: 'stat.food', icon: Salad, color: 'text-food', bar: 'bg-food', badgeBg: 'bg-food/15' },
  { stat: 'dose', labelKey: 'stat.dose', icon: Activity, color: 'text-radiation', bar: 'bg-radiation', badgeBg: 'bg-radiation/15', inverted: true },
];

const THEME_ACCENT: Record<HudTheme, string> = {
  mission: 'from-sky-400/15 border-sky-400/20',
  amber: 'from-power/15 border-power/20',
  mint: 'from-life/15 border-life/20',
  rose: 'from-radiation/15 border-radiation/20',
};

function danger(row: Row, value: number): boolean {
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
    <div className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-colors
      ${isDanger ? 'border-radiation/40 bg-radiation/10' : 'border-white/8 bg-white/[.03]'}`}>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${row.badgeBg}`}>
        <Icon size={16} className={row.color} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="truncate text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-300">
            {label}
          </span>
          <div className="flex items-center gap-1">
            {isDanger ? (
              <span
                role="img"
                aria-label={t('hud.dangerAria', { stat: label })}
                className="shrink-0 rounded-md bg-radiation/25 px-1.5 py-0.5 text-[0.62rem] font-extrabold text-radiation animate-pulse"
              >
                !
              </span>
            ) : null}
            <span
              role="img"
              aria-label={t('hud.valueAria', { label, value })}
              className={`tabular-nums font-display text-[0.95rem] font-extrabold leading-none ${isDanger ? 'text-radiation' : row.color}`}
            >
              {value}
            </span>
          </div>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${row.bar} transition-[width] duration-500
                        ${row.inverted === true ? 'ml-auto' : ''}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
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
  const trackRow: Row = objective === 'science'
    ? { stat: 'science', labelKey: 'stat.science', icon: Microscope, color: 'text-science', bar: 'bg-science', badgeBg: 'bg-science/15', goal: true }
    : { stat: 'lifeSupport', labelKey: 'stat.lifeSupport', icon: HeartPulse, color: 'text-life', bar: 'bg-life', badgeBg: 'bg-life/15', goal: true };

  return (
    <div className={`rounded-3xl glass bg-gradient-to-b ${THEME_ACCENT[theme]} to-transparent p-3 sm:p-3.5`}>
      <div data-tutorial="hud-basic" className="grid grid-cols-2 gap-2">
        {BASIC_ROWS.map((row) => (
          <StatRow key={row.stat} row={row} value={stats[row.stat]} />
        ))}
      </div>
      <div data-tutorial="hud-tracks" className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
        <StatRow
          row={{ stat: 'shielding', labelKey: 'stat.shielding', icon: Shield, color: 'text-slate-200', bar: 'bg-slate-300', badgeBg: 'bg-white/10' }}
          value={stats.shielding}
        />
        <StatRow row={trackRow} value={stats[trackRow.stat]} />
      </div>
    </div>
  );
}
