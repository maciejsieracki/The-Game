'use strict';
/**
 * ai-ai-coalition-test.cjs -- R-WEB-AI-AI-COALITION-ANTI-LEADER-Q1 (etap B4).
 * Czysta logika lidera (gra/src/game/ai-ai-coalition.ts) i premia celu w planerze sojuszy
 * (gra/src/game/ai-ai-alliance-tick.ts, planAiAiAllianceTickFull z polem `koalicja`).
 *
 *  (K1) flaga koalicjaAntyLiderAktywna = false domyślnie; hak testowy działa i wraca do danych;
 *  (K2) wykrycie lidera: próg przewagi (dokładnie 1,5× = lider; poniżej = brak);
 *  (K3) histereza minTur: lider dopiero po 5 kolejnych turach; zerwanie serii zeruje licznik;
 *  (K4) gracz (owner 0) może być liderem; AI-lider też;
 *  (K5) brak lidera: remis na szczycie, pozostali bez Mocy (średnia 0), < 2 wpisów;
 *  (K6) premia koalicji: lider/sojusznik lidera/nie-wróg lidera nie dostaje premii; oba wrogami lidera -> tak;
 *  (K7) planer: premia wybiera cel nad wyższą willingness (a bez kontekstu wybiera wyższą willingness);
 *  (K8) limit 2 sojusze na cywilizację zachowany przy koalicji (tury 8..40);
 *  (K9) parytet: koalicja null = wynik identyczny z brakiem pola (flaga false);
 *  (K10) brak mutacji wejścia planera i stanu lidera (funkcje czyste);
 *  (K11) main.ts: tick ma bramkę flagi koalicji i przekazuje `koalicja`; hak `setCoalitionEnabled` obecny.
 *  Mutanty (esbuild onLoad, bez zapisu na dysk): każdy musi czerwienić co najmniej jeden test.
 *
 *   node tools/ai-ai-coalition-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const COAL_FILE = path.resolve(GAME_DIR, 'ai-ai-coalition.ts');
const TICK_FILE = path.resolve(GAME_DIR, 'ai-ai-alliance-tick.ts');
const MAIN_FILE = path.resolve(GRA_ROOT, 'src', 'main.ts');
const ORIG_COAL = fs.readFileSync(COAL_FILE, 'utf8');
const ORIG_TICK = fs.readFileSync(TICK_FILE, 'utf8');

function applyMut(src, reps) {
  let out = src;
  for (const [from, to] of reps || []) {
    if (!out.includes(from)) throw new Error('mutant anchor missing: ' + from.slice(0, 70));
    out = out.replace(from, to);
  }
  return out;
}

/** Bundluje oba moduły; mut = { coal: [[from,to]...], tick: [[from,to]...] } podmienia źródło w pamięci. */
async function load(mut) {
  const entry = `export * from ${JSON.stringify(TICK_FILE)}; export * from ${JSON.stringify(COAL_FILE)};`;
  const res = await esbuild.build({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
    plugins: [{
      name: 'mutant-source',
      setup(b) {
        b.onLoad({ filter: /ai-ai-coalition\.ts$/ }, () => ({
          contents: applyMut(ORIG_COAL, mut && mut.coal), loader: 'ts', resolveDir: GAME_DIR,
        }));
        b.onLoad({ filter: /ai-ai-alliance-tick\.ts$/ }, () => ({
          contents: applyMut(ORIG_TICK, mut && mut.tick), loader: 'ts', resolveDir: GAME_DIR,
        }));
      },
    }],
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const P = { progPrzewagi: 1.5, minTur: 5 };
const mapa = (obj) => new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));

/** Wejście planera: pairInfo z tabeli willingness (klucz "a_b" posortowany), reszta stała. */
function planInput(o) {
  const key = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const will = o.will || {};
  return {
    turn: o.turn,
    owners: o.owners,
    alliancesCount: new Map(o.owners.map(x => [x, (o.counts && o.counts[x]) || 0])),
    pairPrefilter: () => true,
    pairInfo: (p, t) => ({
      warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true,
      relacja: 150, zaufanie: 100, willingness: will[key(p, t)] ?? 0.6,
    }),
    sideOf: (oid) => ({
      power: 100, treasuryGold: 0,
      allies: [],
      enemies: (o.enemies && o.enemies[oid]) || [],
    }),
    treasury: new Map(o.owners.map(x => [x, 0])),
    maxSojuszy: 2,
    ponowneProbyTur: 8,
    evaluate: () => ({ accept: true, reason: 'ok', paymentGold: 0, payer: null, parity: { S: 0, W: 0, D: 0, r: 1 } }),
    koalicja: o.koalicja,
  };
}

/** Zwraca listę błędów (pusta = zielone). */
function runChecks(M) {
  const errs = [];
  const check = (cond, msg) => { if (!cond) errs.push(msg); };

  // K1
  check(M.isAiAiCoalitionEnabled() === false, 'K1 flaga domyślnie nie jest false');
  M.setAiAiCoalitionEnabledForTest(true);
  check(M.isAiAiCoalitionEnabled() === true, 'K1 hak nie włącza');
  M.setAiAiCoalitionEnabledForTest(null);
  check(M.isAiAiCoalitionEnabled() === false, 'K1 hak nie wraca do danych');

  // K2 próg
  let st = M.initLiderKoalicjiStan();
  st = M.aktualizujLidera(st, mapa({ 0: 149, 1: 100 }), P);
  check(st.kandydat === null && st.seria === 0, 'K2 149 < 1,5×100 nie może dać kandydata');
  st = M.aktualizujLidera(st, mapa({ 0: 150, 1: 100 }), P);
  check(st.kandydat === 0 && st.seria === 1, 'K2 dokładnie 1,5× musi dać kandydata (>=)');

  // K3 histereza
  st = M.initLiderKoalicjiStan();
  const przewaga = mapa({ 0: 300, 1: 100, 2: 100, 3: 100 });
  const ciche = mapa({ 0: 100, 1: 100, 2: 100, 3: 100 });
  for (let t = 1; t <= 4; t++) st = M.aktualizujLidera(st, przewaga, P);
  check(st.lider === null && st.seria === 4, 'K3 po 4 turach lider nie może być potwierdzony');
  st = M.aktualizujLidera(st, przewaga, P);
  check(st.lider === 0 && st.seria === 5, 'K3 po 5 turach lider musi być potwierdzony');
  st = M.aktualizujLidera(st, ciche, P);
  check(st.lider === null && st.seria === 0, 'K3 zerwanie przewagi musi zerować serię');
  for (let t = 1; t <= 4; t++) st = M.aktualizujLidera(st, przewaga, P);
  check(st.lider === null, 'K3 po zerwaniu serii 4 tury nie mogą dać lidera');
  // zmiana kandydata (inny szczyt) zaczyna serię od nowa
  const innyLider = mapa({ 0: 100, 1: 300, 2: 100, 3: 100 });
  st = M.aktualizujLidera(st, innyLider, P);
  check(st.kandydat === 1 && st.seria === 1, 'K3 zmiana kandydata musi zacząć serię od 1');

  // K4 gracz i AI jako lider
  st = M.initLiderKoalicjiStan();
  for (let t = 0; t < 5; t++) st = M.aktualizujLidera(st, mapa({ 0: 500, 1: 100, 2: 120 }), P);
  check(st.lider === 0, 'K4 gracz (owner 0) musi móc być liderem');
  st = M.initLiderKoalicjiStan();
  for (let t = 0; t < 5; t++) st = M.aktualizujLidera(st, mapa({ 0: 50, 1: 300, 2: 100 }), P);
  check(st.lider === 1, 'K4 AI-lider musi być wykryty');

  // K5 brak lidera
  st = M.aktualizujLidera(M.initLiderKoalicjiStan(), mapa({ 0: 200, 1: 200, 2: 50 }), P);
  check(st.kandydat === null, 'K5 remis na szczycie nie może dać lidera');
  st = M.aktualizujLidera(M.initLiderKoalicjiStan(), mapa({ 0: 100, 1: 0, 2: 0 }), P);
  check(st.kandydat === null, 'K5 średnia pozostałych 0 nie może dać lidera');
  st = M.aktualizujLidera(M.initLiderKoalicjiStan(), mapa({ 0: 100 }), P);
  check(st.kandydat === null, 'K5 jeden wpis nie może dać lidera');

  // K6 premia
  const ctx = { lider: 1, sojusznicyLidera: new Set([5]), wrogowieLidera: new Set([2, 3, 5]) };
  check(M.maPremieKoalicji(2, 3, ctx) === true, 'K6 dwaj wrogowie lidera muszą mieć premię');
  check(M.maPremieKoalicji(2, 4, ctx) === false, 'K6 nie-wróg lidera nie może mieć premii');
  check(M.maPremieKoalicji(1, 2, ctx) === false, 'K6 lider nie może mieć premii');
  check(M.maPremieKoalicji(5, 2, ctx) === false, 'K6 sojusznik lidera nie może mieć premii');
  check(M.maPremieKoalicji(2, 3, null) === false, 'K6 brak kontekstu = brak premii');

  // K7 planer: premia nad willingness
  const will = { '2_3': 0.9, '2_4': 0.6 };
  const owners = [1, 2, 3, 4];
  const counts = { 1: 2 }; // lider 1 ma już limit, nie proponuje i nie jest celem
  const enemies = { 2: [1], 4: [1] };
  const kontekst = { lider: 1, sojusznicyLidera: new Set(), wrogowieLidera: new Set([2, 4]) };
  const bez = M.planAiAiAllianceTickFull(planInput({ turn: 8, owners, counts, will, enemies }));
  const z = M.planAiAiAllianceTickFull(planInput({ turn: 8, owners, counts, will, enemies, koalicja: kontekst }));
  const celP2 = (plan) => { const a = plan.accepted.find(x => x.proposer === 2); return a ? a.target : null; };
  check(celP2(bez) === 3, 'K7 bez koalicji proponent 2 musi wybrać wyższą willingness (3)');
  check(celP2(z) === 4, 'K7 z premią koalicji proponent 2 musi wybrać wspólnego wroga (4), mimo niższej willingness');
  // K7b premia z preferowanyCel (zerowe zaufanie) wyprzedza willingness; bez koalicji i bez haka wybiera wyższą willingness
  const zPref = M.planAiAiAllianceTickFull({ ...planInput({ turn: 8, owners, counts, will, enemies }), preferowanyCel: (p, t) => p === 2 && t === 4 });
  check(celP2(zPref) === 4, 'K7b preferowanyCel musi dać premię i wyprzedzić wyższą willingness (cel 4)');

  // K8 limit 2 zachowany przy koalicji
  const counts8 = new Map([[1, 0], [2, 0], [3, 0], [4, 0]]);
  for (let turn = 8; turn <= 40; turn += 8) {
    const plan = M.planAiAiAllianceTickFull({
      ...planInput({ turn, owners, will, enemies, koalicja: kontekst }),
      alliancesCount: new Map(counts8),
    });
    for (const a of plan.accepted) {
      counts8.set(a.proposer, (counts8.get(a.proposer) || 0) + 1);
      counts8.set(a.target, (counts8.get(a.target) || 0) + 1);
    }
  }
  check(Array.from(counts8.values()).every(n => n <= 2), 'K8 limit 2 sojusze na cywilizację przekroczony przy koalicji');

  // K9 parytet: koalicja null = brak pola
  const bezPola = planInput({ turn: 8, owners, counts, will, enemies });
  delete bezPola.koalicja;
  const nul = planInput({ turn: 8, owners, counts, will, enemies, koalicja: null });
  check(
    JSON.stringify(M.planAiAiAllianceTickFull(bezPola).accepted) === JSON.stringify(M.planAiAiAllianceTickFull(nul).accepted),
    'K9 koalicja null musi dać wynik identyczny z brakiem pola',
  );

  // K10 czystość
  const wej = planInput({ turn: 8, owners, counts, will, enemies, koalicja: kontekst });
  const migawka = JSON.stringify({ owners: wej.owners, counts: Array.from(wej.alliancesCount.entries()), k: [...kontekst.wrogowieLidera] });
  M.planAiAiAllianceTickFull(wej);
  check(migawka === JSON.stringify({ owners: wej.owners, counts: Array.from(wej.alliancesCount.entries()), k: [...kontekst.wrogowieLidera] }), 'K10 planer zmienił wejście');
  const stBefore = JSON.stringify(M.initLiderKoalicjiStan());
  M.aktualizujLidera(M.initLiderKoalicjiStan(), mapa({ 0: 300, 1: 100 }), P);
  check(stBefore === JSON.stringify(M.initLiderKoalicjiStan()), 'K10 aktualizujLidera zmienił stan startowy');

  return errs;
}

// K11 wiązanie main.ts (tekstowe, bez DOM)
function checkMainWiring() {
  const errs = [];
  const main = fs.readFileSync(MAIN_FILE, 'utf8');
  const start = main.indexOf('function tickAiAiAllianceRequests(): void {');
  const end = main.indexOf('function aiSojuszObowiazekParam', start);
  const body = start >= 0 && end > start ? main.slice(start, end) : '';
  if (!body) errs.push('K11 nie znaleziono tickAiAiAllianceRequests');
  if (!/if \(!isAiAiAllianceTickEnabled\(\)\) return;/.test(body)) errs.push('K11 brak bramki torSojuszy na początku ticku');
  if (!/if \(isAiAiCoalitionEnabled\(\)\)/.test(body)) errs.push('K11 brak bramki flagi koalicji');
  if (!/koalicja:\s*koalicjaKontekst/.test(body)) errs.push('K11 planer nie dostaje koalicja');
  if (!main.includes('setCoalitionEnabled:')) errs.push('K11 brak haka setCoalitionEnabled');
  return errs;
}

// --- uruchomienie ---
async function main() {
const baseErrs = runChecks(await load(null));
const wiringErrs = checkMainWiring();
const MUTANTY = [
  // M1: premia wyłączona w planerze
  // (R-WEB-TEST-DEBT-Q7: kotwica obejmuje początek linii do `||`, bo po FALI 852 linia kończy się `|| (input.preferowanyCel ...)`)
  { name: 'M1 premia wyłączona', tick: [['const premia = maPremieKoalicji(p, t, input.koalicja) ||', 'const premia = false ||']] },
  // M9: haczyk preferowanyCel usunięty z premii planera
  { name: 'M9 preferowanyCel nie daje premii', tick: [['|| (input.preferowanyCel?.(p, t) ?? false);', ';']] },
  // M2: premia nie wyprzedza willingness
  { name: 'M2 premia bez pierwszeństwa', tick: [['|| (kandydat.premia && !best.premia)', '|| false']] },
  // M3: brak histerezy (lider od pierwszej tury)
  { name: 'M3 brak minTur', coal: [['const lider = seria >= params.minTur ? kandydat : null;', 'const lider = kandydat;']] },
  // M4: próg ostry zamiast >=
  { name: 'M4 próg ostry', coal: [['!(maxMoc >= params.progPrzewagi * srednia)', '!(maxMoc > params.progPrzewagi * srednia)']] },
  // M5: remis nie blokuje lidera
  { name: 'M5 remis dopuszczony', coal: [['if (szczyt.length !== 1) return initLiderKoalicjiStan();', 'if (false) return initLiderKoalicjiStan();']] },
  // M6: premia z LUB zamiast I
  { name: 'M6 premia LUB', coal: [['return ctx.wrogowieLidera.has(p) && ctx.wrogowieLidera.has(t);', 'return ctx.wrogowieLidera.has(p) || ctx.wrogowieLidera.has(t);']] },
  // M7: sojusznik lidera dostaje premię
  { name: 'M7 sojusznik bez wykluczenia', coal: [['if (ctx.sojusznicyLidera.has(p) || ctx.sojusznicyLidera.has(t)) return false;', '']] },
  // M8: zmiana kandydata nie zaczyna serii od nowa (licznik leci dalej)
  { name: 'M8 seria bez resetu kandydata', coal: [['const seria = stan.kandydat === kandydat ? stan.seria + 1 : 1;', 'const seria = stan.seria + 1;']] },
];
// Mutant z kotwicą, której brak, zgłasza błąd (mutant niezastosowany) i jest liczony jako NIE wykryty.
const wykryte = [];
const mutantBledy = [];
for (const m of MUTANTY) {
  let errs;
  try {
    errs = runChecks(await load({ coal: m.coal, tick: m.tick }));
  } catch (e) {
    mutantBledy.push(`${m.name}: ${e.message}`);
    continue;
  }
  if (errs.length > 0) wykryte.push(m.name);
  else mutantBledy.push(`${m.name}: NIE wykryty`);
}

const wszystkie = [...baseErrs, ...wiringErrs];
console.log(`ai-ai-coalition-test: testy bazowe błędy=${wszystkie.length}`);
for (const e of wszystkie) console.log('  FAIL ' + e);
console.log(`mutanty wykryte=${wykryte.length}/${MUTANTY.length}`);
console.log(`WYKRYTE MUTANTY: ${wykryte.join(', ') || 'brak'}`);
for (const e of mutantBledy) console.log('  MUTANT ' + e);
const ok = wszystkie.length === 0 && mutantBledy.length === 0;
console.log(ok ? 'WYNIK: ZIELONE' : 'WYNIK: CZERWONE');
process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
