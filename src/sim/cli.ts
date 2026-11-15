import { CARDS } from '../content/cards.js';
import { DEFAULT_BALANCE } from '../engine/balance.js';
import { drainReport } from '../engine/run.js';
import { validateCards } from '../content/schema.js';
import { POLICIES } from './policies.js';
import { evaluate } from './montecarlo.js';
import type { PolicyReport } from './montecarlo.js';
import type { MissionObjective } from '../engine/types.js';

const RUNS = Number(process.argv[2] ?? 2000);

const violations = validateCards(CARDS);
if (violations.length > 0) {
  console.error(`\n${violations.length} violacao(oes) de invariante no conteudo:`);
  for (const v of violations.slice(0, 20)) console.error(`  [${v.rule}] ${v.cardId}: ${v.detail}`);
  process.exit(1);
}

const pct = (n: number): string => `${(n * 100).toFixed(1).padStart(5)}%`;
const num = (n: number, d = 1): string => n.toFixed(d).padStart(5);

console.log('\n=== ORCAMENTO DE DRENO PASSIVO (10 dias, 4 slots/dia) ===');
const drain = drainReport(DEFAULT_BALANCE);
for (const [stat, perDay] of Object.entries(drain)) {
  console.log(`  ${stat.padEnd(8)} ${perDay}/dia  -> ${perDay * 10} em 10 dias`);
}
for (const [key, [min, max]] of Object.entries(DEFAULT_BALANCE.startRanges)) {
  console.log(`  inicio ${key.padEnd(10)} ${min}-${max}`);
}
// Income disponivel no baralho, CALCULADO (antes era um numero escrito a mao
// no DESIGN.md). Definicao: para cada card jogavel (sem fallback), o MAIOR
// ganho que alguma opcao dele da no recurso; soma de todos os cards, cada um
// contado uma vez. E um teto: ignora custo, limiar e se o card sera sorteado.
console.log('\n=== INCOME DISPONIVEL NO BARALHO (teto: melhor opcao de cada card, 1x) ===');
for (const stat of ['oxygen', 'power', 'food'] as const) {
  const income = CARDS
    .filter((card) => card.isFallback !== true)
    .reduce((sum, card) => sum + Math.max(0, ...card.options.map((o) =>
      o.effects.filter((e) => e.stat === stat).reduce((acc, e) => acc + e.delta, 0))), 0);
  console.log(`  ${stat.padEnd(8)} ${income}`);
}

const efficacy = DEFAULT_BALANCE.shieldingEfficacy;
console.log(`  dose/dia com blindagem 80: ${Math.round(DEFAULT_BALANCE.doseBaseDaily * (1 - efficacy * 0.8))}`);
console.log(`  dose/dia com blindagem 50: ${Math.round(DEFAULT_BALANCE.doseBaseDaily * (1 - efficacy * 0.5))}`);

const objectives: MissionObjective[] = ['science', 'habitat'];
for (const objective of objectives) {
  console.log(`\n=== MONTE CARLO - objetivo: ${objective} (${RUNS} partidas por politica) ===`);
  console.log('  (cada partida com local de pouso e loadout inicial sorteados pela seed, como no app)');
  console.log('  politica    vitoria   p/tempo  p/objetivo | O2   ENE  COM  DOSE | dia-morte  fallback  trilho  dose-fim  min-basico');
  const reports: PolicyReport[] = [];
  for (const policy of POLICIES) {
    const r = evaluate(policy, objective, RUNS);
    const causes = r.lossCauses;
    console.log(
      `  ${r.policy.padEnd(10)} ${pct(r.winRate)}  ${pct(r.winBySurvival)}  ${pct(r.winByObjective)}` +
      ` | ${String(causes.oxygen).padStart(4)} ${String(causes.power).padStart(4)}` +
      ` ${String(causes.food).padStart(4)} ${String(causes.dose).padStart(4)}` +
      ` | ${num(r.avgLossDay)}      ${num(r.avgFallbackUses)}     ${num(r.avgFinalTrack)}` +
      `     ${num(r.avgFinalDose)}      ${num(r.avgLowestBasic)}`,
    );
    reports.push(r);
  }
  // Recorte por local de pouso: cada local tem um baralho um pouco diferente
  // (Card.sites). Vitoria e fallback por local mostram se algum ficou magro.
  const sites = Object.keys(reports[0]?.bySite ?? {});
  console.log(`  por local    ${sites.map((s) => `${s.padEnd(16)}`).join('')}`);
  console.log(`  (vitoria / fallback por partida)`);
  for (const r of reports) {
    const cells = sites.map((s) => {
      const site = r.bySite[s];
      return site === undefined ? ''.padEnd(16) : `${pct(site.winRate)} / ${num(site.avgFallbackUses)}`.padEnd(16);
    });
    console.log(`  ${r.policy.padEnd(10)}   ${cells.join('')}`);
  }
}

console.log('\nLeitura: `random` alto = decisoes nao importam. `adaptive` em 0% ou 100% = sem jogo.');
console.log('`fallback` alto = o pool de cards seca antes do fim da missao.\n');
