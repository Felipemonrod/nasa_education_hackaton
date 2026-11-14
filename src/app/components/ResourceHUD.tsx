import { Activity, Salad, Shield, Wind, Zap, Microscope, HeartPulse } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Stat, Stats, TrackStat } from '../../engine/types.js';
import type { HudTheme } from '../store/useAccount.js';

/**
 * HUD em VALORES NUMERICOS 0-100, como o design pede. A barra e apoio
 * visual; o numero e a informacao.
 *
 * `dose` e desenhada ao contrario de proposito: nos outros recursos 100 e
 * bom, nela 100 mata. Sem essa distincao visual, o mesmo numero teria dois
 * significados opostos na mesma tela.
 */

interface Row {
  readonly stat: Stat;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly bar: string;
  readonly inverted?: boolean;
}

const BASIC_ROWS: readonly Row[] = [
  { stat: 'oxygen', label: 'Oxigênio', icon: Wind, color: 'text-oxygen', bar: 'bg-oxygen' },
  { stat: 'power', label: 'Energia', icon: Zap, color: 'text-power', bar: 'bg-power' },
  { stat: 'food', label: 'Comida', icon: Salad, color: 'text-food', bar: 'bg-food' },
  { stat: 'dose', label: 'Dose', icon: Activity, color: 'text-radiation', bar: 'bg-radiation', inverted: true },
];

const THEME_ACCENT: Record<HudTheme, string> = {
  mission: 'from-sky-400/15',
  amber: 'from-power/15',
  mint: 'from-life/15',
  rose: 'from-radiation/15',
};

function danger(stat: Stat, value: number, inverted: boolean | undefined): boolean {
  if (stat === 'shielding') return value <= 25;
  return inverted === true ? value >= 75 : value <= 25;
}

function StatRow({ row, value }: { row: Row; value: number }): JSX.Element {
  const Icon = row.icon;
  const isDanger = danger(row.stat, value, row.inverted);
  const fill = row.inverted === true ? value : value;
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className={`${row.color} shrink-0`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {row.label}
          </span>
          <span
            className={`tabular-nums text-sm font-extrabold ${isDanger ? 'text-radiation' : row.color}`}
            aria-label={`${row.label}: ${value} de 100`}
          >
            {value}
          </span>
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${row.bar} transition-[width] duration-500`}
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>
      {isDanger ? (
        <span className="shrink-0 rounded-md bg-radiation/20 px-1 text-[10px] font-extrabold text-radiation">
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
  const trackRow: Row = objective === 'science'
    ? { stat: 'science', label: 'Ciência', icon: Microscope, color: 'text-science', bar: 'bg-science' }
    : { stat: 'lifeSupport', label: 'Suporte de vida', icon: HeartPulse, color: 'text-life', bar: 'bg-life' };

  return (
    <div className={`rounded-3xl glass bg-gradient-to-b ${THEME_ACCENT[theme]} to-transparent p-3`}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {BASIC_ROWS.map((row) => (
          <StatRow key={row.stat} row={row} value={stats[row.stat]} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 border-t border-white/10 pt-2.5">
        <StatRow
          row={{ stat: 'shielding', label: 'Blindagem', icon: Shield, color: 'text-slate-200', bar: 'bg-slate-300' }}
          value={stats.shielding}
        />
        <StatRow row={trackRow} value={stats[trackRow.stat]} />
      </div>
      <p className="mt-2 text-[10px] leading-tight text-slate-500">
        Dose sobe com o tempo: <span className="text-radiation font-bold">100 encerra a missão</span>.
        Blindagem reduz quanto entra por dia.
      </p>
    </div>
  );
}
