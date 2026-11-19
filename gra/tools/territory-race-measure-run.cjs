'use strict';
/**
 * territory-race-measure-run.cjs -- R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1 (krok 2): pomiar PRZED
 * wyscigu o teren (forty i posterunki AI). Cienki wrapper nad `ai-economy-measure-run.cjs` (ten sam runner,
 * ta sama bramka NNS gracza z dosypkami, te same wznowienia --stop-at / --every).
 *
 * POMIAR, nie zmiana gry. Metryki terytorium pochodza z haka `window.__aiEconomyMeasure.metrics()` (krok 1,
 * tylko odczyt, gra/src/main.ts, za ?civTest=1): per wlasciciel `miasta`, `forty`, `posterunki`,
 * `hexyTerytorium`, `hexyZMiast`, `hexyZFortowPosterunkow`, `hexySporne`; na turze `terytorium.heksySporneOgolem`.
 *
 * Wynik (w --out, prefiks seed<S>):
 *   seed<S>.jsonl            -- surowy wynik runnera (jedna linia na ture).
 *   seed<S>-terytorium.csv   -- jedna linia na (tura, wlasciciel) z kolumnami terytorium (dla kazdej tury).
 *   seed<S>-kontrolne.json   -- tury kontrolne (30,60,90,120,150; najblizsza zapisana <= kontrolnej) per AI:
 *                               miasta, forty, posterunki, heksy ogolem/z miast/z fortow/sporne; plus
 *                               moment pierwszego forta/posterunku per AI i liczba AI, ktore go zbudowaly.
 *
 * Uzycie (z gra/, bundle budowany POZA repo):
 *   node tools/territory-race-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-katalog> --seed 4242 --turns 150 --every 10
 *   Domyslnie dokladane: --player-ai 1 --reject-offers 1 (patrz RUNNER_ARGV). Wszystkie opcje przekazywane 1:1 do ai-economy-measure-run.cjs (--stop-at, --bypass, --gold, --food, --hash ...).
 *   Limit Bash < 590 s: przebieg dzielimy na wywolania --stop-at (wznowienie z ostatniego slotu --every).
 *   Ten plik sam nie uruchamia niczego w tle.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
}
const SEED = arg('seed', '4242');
const OUT = path.resolve(arg('out', path.join(__dirname, '..', 'territory-race-out')));
const RUNNER = path.join(__dirname, 'ai-economy-measure-run.cjs');
// r3: domyslnie --player-ai 1 (pasywny gracz ginie do t~75) i --reject-offers 1 (wiszaca oferta AI->gracz blokuje Zakoncz ture);
// jawne --player-ai 0 / --reject-offers 0 w argv nadpisuje. Dla analizy liczy sie tylko wlasciciele != 0.
const RUNNER_ARGV = argv.slice();
if (!RUNNER_ARGV.includes('--player-ai')) RUNNER_ARGV.push('--player-ai', '1');
if (!RUNNER_ARGV.includes('--reject-offers')) RUNNER_ARGV.push('--reject-offers', '1');
const CONTROL_TURNS = [30, 60, 90, 120, 150];
const COLS = ['tura', 'wlasciciel', 'miasta', 'forty', 'posterunki', 'hexyTerytorium', 'hexyZMiast',
  'hexyZFortowPosterunkow', 'hexySporne', 'jednostkiWojskowe', 'heksySporneOgolem'];

fs.mkdirSync(OUT, { recursive: true });
const env = Object.assign({}, process.env, { CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome' });
// TERR_POSTPROCESS_ONLY=1: tylko przeliczenie CSV/kontrolnych z istniejącego seed<S>.jsonl (bez przebiegu gry).
const res = process.env.TERR_POSTPROCESS_ONLY === '1' ? { status: 0, signal: null } : spawnSync(process.execPath, [RUNNER, ...RUNNER_ARGV], { stdio: 'inherit', env, maxBuffer: 64 * 1024 * 1024 });
if (res.status !== 0) {
  console.error(`territory-race-measure-run: runner exit ${res.status} (${res.signal || ''}); wynik czesciowy zostaje w --out`);
}

const jsonlPath = path.join(OUT, `seed${SEED}.jsonl`);
if (!fs.existsSync(jsonlPath)) { console.error('brak ' + jsonlPath); process.exit(res.status || 1); }
const rows = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

const csv = [COLS.join(',')];
for (const r of rows) {
  const owners = (r.owners || r.metrics?.owners || []);
  const heksySporneOgolem = r.terytorium?.heksySporneOgolem ?? '';
  for (const o of owners) {
    csv.push([r.turn, o.owner, o.miasta, o.forty ?? '', o.posterunki ?? '', o.hexyTerytorium ?? '',
      o.hexyZMiast ?? '', o.hexyZFortowPosterunkow ?? '', o.hexySporne ?? '', o.jednostkiWojskowe ?? '', heksySporneOgolem].join(','));
  }
}
fs.writeFileSync(path.join(OUT, `seed${SEED}-terytorium.csv`), csv.join('\n') + '\n');

// Tury kontrolne: najblizsza zapisana tura <= kontrolnej (wiersze z runnera; brak wiersza = NIE ZMIERZONO).
function rowAtOrBefore(t) {
  let best = null;
  for (const r of rows) if (r.turn <= t && (!best || r.turn > best.turn)) best = r;
  return best;
}
const ownersOf = r => (r.owners || r.metrics?.owners || []);
const control = {};
for (const t of CONTROL_TURNS) {
  const r = rowAtOrBefore(t);
  const lastTurn = rows.length ? rows[rows.length - 1].turn : 0;
  if (!r || lastTurn < t) { control[t] = 'NIE ZMIERZONO (ostatnia zapisana tura ' + lastTurn + ')'; continue; }
  control[t] = {
    turaZmierzona: r.turn,
    heksySporneOgolem: r.terytorium?.heksySporneOgolem ?? null,
    wlasciciele: ownersOf(r).filter(o => o.owner !== 0).map(o => ({
      owner: o.owner, miasta: o.miasta, forty: o.forty, posterunki: o.posterunki,
      hexyTerytorium: o.hexyTerytorium, hexyZMiast: o.hexyZMiast,
      hexyZFortowPosterunkow: o.hexyZFortowPosterunkow, hexySporne: o.hexySporne,
    })),
  };
}

// Moment pierwszego forta/posterunku per AI (po wszystkich zapisanych turach) i liczba AI, ktore go zbudowaly.
const firstFortOrOutpost = {};
for (const r of rows) {
  for (const o of ownersOf(r)) {
    if (o.owner === 0) continue;
    if ((o.forty || 0) + (o.posterunki || 0) > 0 && firstFortOrOutpost[o.owner] === undefined) firstFortOrOutpost[o.owner] = r.turn;
  }
}
const aiOwners = new Set();
for (const r of rows) for (const o of ownersOf(r)) if (o.owner !== 0) aiOwners.add(o.owner);

const summary = {
  seed: Number(SEED),
  turyZapisane: rows.length ? [rows[0].turn, rows[rows.length - 1].turn] : null,
  aiWZapisie: aiOwners.size,
  aiZFortemLubPosterunkiem: Object.keys(firstFortOrOutpost).length,
  pierwszyFortLubPosterunekPerAI: firstFortOrOutpost,
  kontrolne: control,
  runnerExit: res.status,
  NIEZMIERZONE: ['zajete pierwszy raz (historia per heks)', 'koszt utrzymania fortow/posterunkow (NIE ZWERYFIKOWANO w kodzie)'],
};
fs.writeFileSync(path.join(OUT, `seed${SEED}-kontrolne.json`), JSON.stringify(summary, null, 2) + '\n');
console.log(`territory-race-measure-run: seed=${SEED} wiersze=${rows.length} AI=${aiOwners.size} AI_z_fortem_lub_posterunkiem=${Object.keys(firstFortOrOutpost).length}`);
process.exit(res.status || 0);
