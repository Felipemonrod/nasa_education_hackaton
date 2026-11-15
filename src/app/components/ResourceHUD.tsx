import { useEffect, useRef, useState } from 'react';
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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  if (document.documentElement.dataset.motion === 'reduced') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function useRollingNumber(target: number, durationMs = 1050): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    if (currentRef.current === target) return;
    if (prefersReducedMotion()) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }

    const from = currentRef.current;
    const delta = target - from;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 2);
      const next = progress >= 1 ? target : Math.round(from + delta * eased);
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(rafId); };
  }, [target, durationMs]);

  return display;
}

function StatRow({ row, value, trembling = false }: { row: Row; value: number; trembling?: boolean }): JSX.Element {
  const t = useT();
  const Icon = row.icon;
  const isDanger = danger(row, value);
  const label = t(row.labelKey);
  const displayValue = useRollingNumber(value);
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 transition-colors [@media(max-height:540px)]:px-2 [@media(max-height:540px)]:py-1 lg:gap-2.5 lg:px-3 lg:py-2
      ${trembling ? 'animate-resource-tremble' : ''}
      ${isDanger ? 'border-radiation/40 bg-radiation/10' : 'border-white/8 bg-white/[.03]'}`}>
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl [@media(max-height:540px)]:h-6 [@media(max-height:540px)]:w-6 lg:h-8 lg:w-8 ${row.badgeBg}`}>
        <Icon size={16} className={row.color} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="truncate text-[0.64rem] font-extrabold uppercase tracking-wider text-slate-300 [@media(max-height:540px)]:text-[0.6rem] lg:text-[0.68rem]">
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
              className={`tabular-nums font-display text-[0.88rem] font-extrabold leading-none [@media(max-height:540px)]:text-[0.82rem] lg:text-[0.95rem] ${isDanger ? 'text-radiation' : row.color}`}
            >
              {displayValue}
            </span>
          </div>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10 lg:mt-1.5">
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
  stats, objective, theme, affectedStats,
}: {
  stats: Stats;
  objective: TrackStat;
  theme: HudTheme;
  affectedStats?: ReadonlySet<Stat>;
}): JSX.Element {
  const trackRow: Row = objective === 'science'
    ? { stat: 'science', labelKey: 'stat.science', icon: Microscope, color: 'text-science', bar: 'bg-science', badgeBg: 'bg-science/15', goal: true }
    : { stat: 'lifeSupport', labelKey: 'stat.lifeSupport', icon: HeartPulse, color: 'text-life', bar: 'bg-life', badgeBg: 'bg-life/15', goal: true };

  return (
    <div className={`flex h-full flex-col rounded-3xl glass bg-gradient-to-b ${THEME_ACCENT[theme]} to-transparent p-2.5 [@media(max-height:540px)]:p-2 sm:p-3 lg:p-3.5`}>
      <div data-tutorial="hud-basic" className="grid flex-[2] grid-cols-2 gap-1.5 [@media(max-height:540px)]:gap-1.5 lg:gap-2">
        {BASIC_ROWS.map((row) => (
          <StatRow key={row.stat} row={row} value={stats[row.stat]} trembling={affectedStats?.has(row.stat) ?? false} />
        ))}
      </div>
      <div data-tutorial="hud-tracks" className="mt-1.5 grid flex-1 grid-cols-2 gap-1.5 border-t border-white/10 pt-1.5 [@media(max-height:540px)]:mt-1.5 [@media(max-height:540px)]:pt-1.5 lg:mt-2 lg:gap-2 lg:pt-2">
        <StatRow
          row={{ stat: 'shielding', labelKey: 'stat.shielding', icon: Shield, color: 'text-slate-200', bar: 'bg-slate-300', badgeBg: 'bg-white/10' }}
          value={stats.shielding}
          trembling={affectedStats?.has('shielding') ?? false}
        />
        <StatRow row={trackRow} value={stats[trackRow.stat]} trembling={affectedStats?.has(trackRow.stat) ?? false} />
      </div>
    </div>
  );
}
