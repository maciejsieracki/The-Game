'use strict';
/**
 * ai-vs-player-economy-audit.cjs -- R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1
 * Pomiar (tylko odczyt, bez zmian kodu gry): identyczne panstwo jako gracz (ownerId 0) i jako AI (ownerId 1).
 *
 *   node tools/ai-vs-player-economy-audit.cjs --out <katalog> [--esbuild <sciezka do modulu esbuild>] [--turns 25]
 *
 * Zapisuje <out>/results.csv. Bundle tymczasowy ladowany z --out (nie z repo).
 * Pomiary: A) przychody/tura (silnik advanceCityEconomy, 3 warianty suwakow),
 *          B) koszt zakupu jednostki (unitProductionItem) dla 0 vs 1, easy/normal/hard,
 *          C) utrzymanie 20 jednostek (upkeepByOwner),
 *          D) manpower (max / koszt / regen),
 *          E) mnozniki trudnosci (bonusy AI z ai-params.json) i helpery pochodne.
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(arg('out', path.join(GRA, '..', 'dyspozycje/autobot/runs/R-WEB-AI-VS-PLAYER-ECONOMY-AUDIT-Q1')));
const TURNS = Number(arg('turns', '25'));
const esbuild = (() => {
  const cands = [arg('esbuild', ''), path.join(GRA, 'node_modules', 'esbuild')].filter(Boolean);
  for (const c of cands) { try { return require(c); } catch (e) { /* next */ } }
  console.error('esbuild not found; pass --esbuild <path>'); process.exit(2);
})();

fs.mkdirSync(OUT, { recursive: true });
const ENTRY = path.join(OUT, '.audit-entry.ts');
const BUNDLE = path.join(OUT, '.audit-bundle.cjs');
const rel = (p) => path.relative(OUT, path.join(GRA, p)).split(path.sep).join('/');
fs.writeFileSync(ENTRY, `
export { advanceCityEconomy, sumEconomyForOwner } from '${rel('src/game/turn-economy')}';
export { generateMap } from '${rel('src/map/generator')}';
export { foundCityAt, canFoundCity, DEFAULT_PODZIAL_HANDLU, DEFAULT_PODZIAL_PRACY, AI_FIXED_PROCENT_BUDYNKI, AI_FIXED_PROCENT_NAUKA } from '${rel('src/game/cities')}';
export { unitProductionItem, civProductionCostBonusyForCivKey } from '${rel('src/game/production')}';
export { civMatrixBonusyForCivKey } from '${rel('src/game/civ-bonuses')}';
export { getCostMultiplierForOwner, applyDifficultyCostMultiplier } from '${rel('src/game/difficulty-cost')}';
export { cityManpowerMax, unitManpowerCostForType, manpowerRegenGain, civManpowerMatrixMults, empireManpowerCurrent, canAffordUnitManpowerEmpire, deductManpowerFromEmpire } from '${rel('src/game/manpower')}';
export { difficultyProductionMultiplier, difficultyScienceBonusPerTurn, difficultyCombatMultiplier, qualifiesForMajorAiDifficultyBonus, playerStartUnitCount } from '${rel('src/game/ai-difficulty-bonus')}';
export { loadDifficultyParams } from '${rel('src/game/ai')}';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, nodePaths: arg('nodepaths', '') ? [arg('nodepaths')] : [], outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);
const J = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));
const data = {
  civs: J('civs.json'), econParams: J('econ-params.json'), societyParams: J('society-params.json'),
  buildings: J('buildings.json'), units: J('units.json'), tech: J('tech.json'), aiParams: J('ai-params.json'),
};
const rows = [['sekcja', 'metryka', 'kontekst', 'gracz_0', 'ai_1', 'roznica_proc', 'uwagi']];
const pct = (p, a) => (p === 0 ? (a === 0 ? 0 : null) : Math.round(((a - p) / Math.abs(p)) * 10000) / 100);
function add(sekcja, metryka, kontekst, p, a, uwagi = '') {
  const d = typeof p === 'number' && typeof a === 'number' ? pct(p, a) : '';
  rows.push([sekcja, metryka, kontekst, p, a, d === null ? 'n/d' : d, uwagi]);
}

// ---------- mapa + jedno miasto w tym samym miejscu ----------
const map = M.generateMap(40, 40, 7777, 'kontynenty');
function pickHex() {
  const list = [];
  for (const h of Object.values(map.hexes)) {
    const c = { q: h.coords.q, r: h.coords.r };
    if (M.canFoundCity(c.q, c.r, [], map).ok) list.push(c);
  }
  return list[Math.floor(list.length / 2)];
}
const hex = pickHex();
const BUILT = ['targowisko', 'spichlerz', 'stolarnia', 'swiatynia', 'biblioteka', 'mennica', 'magazyn', 'koszary', 'studnia', 'palac'];
const CIV = 'grecy';

function makeCity(ownerId) {
  const cs = [];
  const c = M.foundCityAt(hex.q, hex.r, ownerId, cs, map, 'Test' + ownerId);
  if (!c) throw new Error('foundCityAt failed');
  c.population = 8;
  return c;
}

/** Symulacja TURNS tur dla jednego ownera; sliders: null = domyslne silnika dla tej strony. */
function simulate(ownerId, difficulty, handlu, pracy, units) {
  const city = makeCity(ownerId);
  const cities = [city];
  const civMap = new Map([[ownerId, CIV]]);
  const handluMap = new Map(handlu ? [[ownerId, handlu]] : []);
  const pracyMap = new Map(pracy ? [[ownerId, pracy]] : []);
  const built = new Map([[city.id, BUILT.filter((b) => data.buildings.some((x) => x.id === b))]]);
  const per = [];
  let treasury = 0;
  for (let t = 1; t <= TURNS; t++) {
    const econ = M.advanceCityEconomy(
      cities, map, data, difficulty, units, new Map(), built, 2, new Set(), civMap, new Map(),
      () => 2, () => new Set(), 'wysoki', new Map(), new Map(), new Map(), new Map(), () => true,
      undefined, undefined, handluMap, undefined, pracyMap,
    );
    const s = M.sumEconomyForOwner(econ, ownerId);
    const up = econ.upkeepByOwner.get(ownerId);
    per.push({
      t, pieniadz: s.pieniadz, nauka: s.nauka, praca: s.praca, doPuli: s.doPuli,
      utrzymanieJ: up ? up.utrzymanieJednostki : 0, utrzymanieB: up ? up.utrzymanieBudynki : 0,
      utrzymanieR: up ? up.utrzymanieRazem : 0, pop: city.population,
    });
    treasury += s.pieniadz - (up ? up.utrzymanieRazem : 0);
  }
  return { per, treasury, city };
}
const sum = (arr, k) => arr.reduce((a, r) => a + r[k], 0);

// ---------- A) przychody ----------
const units20 = (ownerId) => Array.from({ length: 20 }, () => ({ ownerId, typeId: 'Wojownik', camping: false }));
const playerHandlu = { ...M.DEFAULT_PODZIAL_HANDLU };
const playerPracy = { ...M.DEFAULT_PODZIAL_PRACY };
// Domyslne strony AI wg main.ts:5835-5895 / ai.ts decideAIEconomySliders (po 1. turze): Nauka 60, Praca 50.
// Seed tury 1 (main.ts:5847): { ...DEFAULT_PODZIAL_HANDLU, procentNauka: 60 } => suma 140 (nieznormalizowane!).
const aiSeedHandlu = { ...M.DEFAULT_PODZIAL_HANDLU, procentNauka: M.AI_FIXED_PROCENT_NAUKA };
const aiSettledHandlu = { procentNauka: M.AI_FIXED_PROCENT_NAUKA, procentPieniadz: 20, procentLuksus: 20 };
const aiPracy = { procentBudynki: M.AI_FIXED_PROCENT_BUDYNKI };

for (const diff of ['easy', 'normal', 'hard']) {
  const P = simulate(0, diff, playerHandlu, playerPracy, units20(0));
  // 1) ten sam suwak (parytet czysty): jedyna roznica = ownerId
  const A1 = simulate(1, diff, playerHandlu, playerPracy, units20(1));
  const k = diff + ' | suwaki identyczne (20/60/20, Praca 70), pop8, 20 Wojownikow, ' + TURNS + ' tur';
  for (const m of ['pieniadz', 'nauka', 'praca', 'doPuli', 'utrzymanieJ', 'utrzymanieB']) {
    add('A_przychody', m + '/tura (srednia)', k, +(sum(P.per, m) / TURNS).toFixed(3), +(sum(A1.per, m) / TURNS).toFixed(3));
  }
  add('A_przychody', 'skarbiec netto po ' + TURNS + ' turach', k, +P.treasury.toFixed(2), +A1.treasury.toFixed(2));
  if (diff === 'normal') {
    // 2) domyslne silnika: gracz 20/60/20 Praca70 vs AI po 1. turze 60/20/20 Praca50
    const A2 = simulate(1, diff, aiSettledHandlu, aiPracy, units20(1));
    const k2 = diff + ' | domyslne silnika: gracz 20/60/20+Praca70 vs AI 60/20/20+Praca50';
    for (const m of ['pieniadz', 'nauka', 'praca', 'doPuli']) {
      add('A_przychody', m + '/tura (srednia)', k2, +(sum(P.per, m) / TURNS).toFixed(3), +(sum(A2.per, m) / TURNS).toFixed(3));
    }
    // 3) seed tury 1 AI (nieznormalizowane 60/60/20)
    const A3 = simulate(1, diff, aiSeedHandlu, aiPracy, units20(1));
    add('A_przychody', 'pieniadz tura 1 (seed AI 60/60/20=140%)', 'normal', +P.per[0].pieniadz.toFixed(3), +A3.per[0].pieniadz.toFixed(3));
    add('A_przychody', 'pieniadz tura 2 (seed AI 60/60/20=140%)', 'normal', +P.per[1].pieniadz.toFixed(3), +A3.per[1].pieniadz.toFixed(3));
    add('A_przychody', 'nauka tura 1 (seed AI 60/60/20=140%)', 'normal', +P.per[0].nauka.toFixed(3), +A3.per[0].nauka.toFixed(3));
    // 4) NAŁOŻONY bonus trudności major AI na Normalnym (poprawka po zarzucie Evaluatora R1):
    //    main.ts:37724 mnoży doBudynkow i doPuli przez difficultyProductionMultForOwner = 1 + bonusProdukcja (0.10),
    //    main.ts:36986 dodaje difficultyScienceBonusForOwner = bonusNauka (+1/turę). Oba poza advanceCityEconomy.
    //    Wartości: data/ai-params.json trudnosc_poziom2_bonus_produkcja=0.1, trudnosc_poziom2_bonus_nauka=1.
    //    Uwaga: mnożenie liniowe to przybliżenie (pracaImperialPoolGain może być nieliniowy).
    const PROD_MULT_AI_NORMAL = 1 + 0.1;
    const NAUKA_BONUS_AI_NORMAL = 1;
    const kBon = 'normal | nalozony bonus trudnosci AI (derywacja z A1, przyblizenie liniowe)';
    const pPula = sum(P.per, 'doPuli') / TURNS;
    const aPula = (sum(A1.per, 'doPuli') / TURNS) * PROD_MULT_AI_NORMAL;
    add('A_przychody', 'doPuli Pracy/tura (z bonusem Pracy AI x1.10)', kBon, +pPula.toFixed(3), +aPula.toFixed(3),
      'AI: A1.doPuli * 1.10 (main.ts:37724); roznica = efekt bonusu Pracy');
    const pNauka = sum(P.per, 'nauka') / TURNS;
    const aNauka = sum(A1.per, 'nauka') / TURNS + NAUKA_BONUS_AI_NORMAL;
    add('A_przychody', 'nauka/tura (z bonusem Nauki AI +1)', kBon, +pNauka.toFixed(3), +aNauka.toFixed(3),
      'AI: A1.nauka + 1 (main.ts:36986)');
    add('A_przychody', 'pieniadz/tura (bonus trudnosci AI NIE dotyczy Pieniadza)', kBon, +(sum(P.per, 'pieniadz') / TURNS).toFixed(3),
      +(sum(A1.per, 'pieniadz') / TURNS).toFixed(3), 'brak pola bonusPieniadz (ai.ts:580-590); roznica 0%');
  }
}

// ---------- B) koszt zakupu jednostki ----------
const civBon = (ownerId) => [...M.civMatrixBonusyForCivKey(CIV), ...M.civProductionCostBonusyForCivKey(CIV)];
const unitIds = ['Wojownik', 'Lucznik', 'Wlocznik'].filter((id) => data.units.some((u) => u.Jednostka === id));
for (const diff of ['easy', 'normal', 'hard']) {
  for (const pace of ['niski', 'normalny', 'wysoki']) {
    for (const id of unitIds) {
      const p = M.unitProductionItem(id, data, civBon(0), pace, 0, diff);
      const a = M.unitProductionItem(id, data, civBon(1), pace, 1, diff);
      if (p && a) add('B_koszt_zakupu', 'koszt zlota ' + id, diff + ' | tempo kosztu jednostek=' + pace, p.koszt, a.koszt,
        diff === 'normal' ? '' : 'asymetria WZGLEDEM trudnosci (zamierzona, difficulty-cost.ts)');
    }
  }
}
for (const diff of ['easy', 'normal', 'hard']) {
  add('B_koszt_zakupu', 'getCostMultiplierForOwner', diff, M.getCostMultiplierForOwner(0, diff), M.getCostMultiplierForOwner(1, diff));
}

// ---------- C) utrzymanie 20 jednostek ----------
for (const diff of ['easy', 'normal', 'hard']) {
  const P = simulate(0, diff, playerHandlu, playerPracy, units20(0));
  const A = simulate(1, diff, playerHandlu, playerPracy, units20(1));
  add('C_utrzymanie', 'utrzymanie 20 Wojownikow /tura', diff, P.per[0].utrzymanieJ, A.per[0].utrzymanieJ);
  add('C_utrzymanie', 'utrzymanie budynkow /tura', diff, P.per[0].utrzymanieB, A.per[0].utrzymanieB);
}

// ---------- D) manpower ----------
for (const ep of [1, 2, 3]) {
  const mp0 = M.civManpowerMatrixMults(CIV), mp1 = M.civManpowerMatrixMults(CIV);
  add('D_manpower', 'max MP miasta pop8', 'epoka ' + ep, M.cityManpowerMax(8, ep, mp0.maxMult), M.cityManpowerMax(8, ep, mp1.maxMult));
  add('D_manpower', 'koszt MP jednostki', 'epoka ' + ep, M.unitManpowerCostForType('Wojownik', ep, mp0.maxMult, mp0.costMult), M.unitManpowerCostForType('Wojownik', ep, mp1.maxMult, mp1.costMult));
  add('D_manpower', 'regen MP /tura', 'epoka ' + ep, M.manpowerRegenGain(8, ep, undefined, mp0.regenMult, mp0.maxMult), M.manpowerRegenGain(8, ep, undefined, mp1.regenMult, mp1.maxMult));
}

// ---------- E) bonusy trudnosci AI (ai-params.json) i ich wpiecie ----------
for (const lvl of [1, 2, 3]) {
  const dp = M.loadDifficultyParams(data, lvl);
  const name = ['', 'easy', 'normal', 'hard'][lvl];
  const qual = M.qualifiesForMajorAiDifficultyBonus(1, false);
  add('E_bonusy_AI', 'mnoznik Pracy (doBudynkow i doPuli)', name + ' | major AI vs gracz', 1, qual ? M.difficultyProductionMultiplier(dp.bonusProdukcja) : 1, 'main.ts difficultyProductionMultForOwner');
  add('E_bonusy_AI', 'Nauka +/tura', name, 0, qual ? M.difficultyScienceBonusPerTurn(dp.bonusNauka) : 0, 'main.ts difficultyScienceBonusForOwner');
  add('E_bonusy_AI', 'mnoznik walki', name, 1, qual ? M.difficultyCombatMultiplier(dp.bonusWalka) : 1);
  add('E_bonusy_AI', 'jednostki startowe', name, M.playerStartUnitCount(['', 'easy', 'normal', 'hard'][lvl]), dp.startoweJednostki);
}
add('E_bonusy_AI', 'Pieniadz (Danina/Zamoznosc) - bonus trudnosci', 'wszystkie', 0, 0, 'brak pola bonusPieniadz w DifficultyParams (ai.ts:580-590)');

// ---------- F) nasycenie rekrutacji: kto/co ogranicza rozmiar armii (pkt 8d) ----------
// Pelna petla: ekonomia silnika + zakup najtanszej jednostki (ta sama regula: skarbiec >= koszt I MP >= koszt MP)
// + deficyt zlota (kara po 3 turach, -8% HP/ture) wg econ-params. NOWA petla zakupowa AI/gracza = jedna funkcja.
function hexDist(q1, r1, q2, r2) { return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2; }
function spreadHexes(count, minDist) {
  const out = [];
  for (const h of Object.values(map.hexes)) {
    const c = { q: h.coords.q, r: h.coords.r };
    if (!M.canFoundCity(c.q, c.r, [], map).ok) continue;
    if (out.every((p) => hexDist(c.q, c.r, p.q, p.r) >= minDist)) { out.push(c); if (out.length >= count) break; }
  }
  return out;
}
const SAT_HEXES = spreadHexes(8, 6);
const SAT_TURNS = Number(arg('satturns', '120'));
const ERA = 2;
function saturate(ownerId, difficulty, handlu, pracy, label) {
  const cities = [];
  for (const c of SAT_HEXES) {
    const city = M.foundCityAt(c.q, c.r, ownerId, cities, map, 'S' + cities.length + '_' + ownerId);
    if (!city) continue;
    city.population = 8;
    cities.push(city);
  }
  const civMap = new Map([[ownerId, CIV]]);
  const handluMap = new Map([[ownerId, handlu]]);
  const pracyMap = new Map([[ownerId, pracy]]);
  const built = new Map(cities.map((c) => [c.id, BUILT.filter((b) => data.buildings.some((x) => x.id === b))]));
  const mpm = M.civManpowerMatrixMults(CIV);
  const item = M.unitProductionItem('Wojownik', data, civBon(ownerId), 'niski', ownerId, difficulty);
  const mpCost = M.unitManpowerCostForType('Wojownik', ERA, mpm.maxMult, mpm.costMult);
  let units = []; let treasury = 100; let deficitStreak = 0; let purchases = 0; let died = 0;
  const trace = [];
  for (let t = 1; t <= SAT_TURNS; t++) {
    const econ = M.advanceCityEconomy(
      cities, map, data, difficulty, units.map((u) => ({ ownerId, typeId: u.typeId, camping: false })), new Map(), built, ERA,
      new Set(), civMap, new Map(), () => ERA, () => new Set(), 'wysoki', new Map(), new Map(), new Map(), new Map(), () => true,
      undefined, undefined, handluMap, undefined, pracyMap,
    );
    const s = M.sumEconomyForOwner(econ, ownerId);
    const up = econ.upkeepByOwner.get(ownerId);
    treasury += s.pieniadz - (up ? up.utrzymanieRazem : 0);
    // deficyt zlota (gold-deficit.ts): Skarbiec<0 -> licznik; po karencji -8% max HP /ture
    if (treasury < 0) deficitStreak++; else deficitStreak = 0;
    if (deficitStreak >= 3) {
      for (const u of units) u.hp -= 8;
      const before = units.length; units = units.filter((u) => u.hp > 0); died += before - units.length;
    }
    // zakupy: jedna regula dla obu stron
    let goldBlock = false, mpBlock = false;
    for (let guard = 0; guard < 5000; guard++) {
      if (treasury < item.koszt) { goldBlock = true; break; }
      if (!M.canAffordUnitManpowerEmpire(cities, ownerId, cities[0], ERA, 0, mpm.maxMult, 'Wojownik', mpm.costMult)) { mpBlock = true; break; }
      if (!M.deductManpowerFromEmpire(cities, ownerId, ERA, mpCost, mpm.maxMult)) { mpBlock = true; break; }
      treasury -= item.koszt; units.push({ typeId: 'Wojownik', hp: 100 }); purchases++;
    }
    if (t % 10 === 0 || t === SAT_TURNS) {
      trace.push({ t, army: units.length, treasury: Math.round(treasury), mp: M.empireManpowerCurrent(cities, ownerId, ERA, mpm.maxMult), income: Math.round(s.pieniadz), upkeep: up ? up.utrzymanieRazem : 0, binding: goldBlock ? 'ZLOTO' : mpBlock ? 'MANPOWER' : '-', pop: cities.reduce((a, c) => a + c.population, 0) });
    }
  }
  return { label, trace, units: units.length, purchases, died, mpCost, cost: item.koszt };
}
const SAT = [];
for (const [lab, h, pr] of [
  ['gracz(0) suwaki 20/60/20 Praca70', playerHandlu, playerPracy],
  ['AI(1) te same suwaki (parytet)', playerHandlu, playerPracy],
  ['AI(1) domyslne silnika 60/20/20 Praca50', aiSettledHandlu, aiPracy],
]) {
  const oid = lab.startsWith('gracz') ? 0 : 1;
  const r = saturate(oid, 'normal', h, pr, lab);
  SAT.push(r);
  for (const tr of r.trace) {
    rows.push(['F_nasycenie_MODEL', 'tura ' + tr.t, lab, tr.army, '', '', 'MODEL wlasnej petli zakupowej narzedzia (NIE decideAITurn/shouldAIPurchaseUnit, NIE dowod parytetu AI); skarbiec=' + tr.treasury + ' MPpula=' + tr.mp + ' dochod=' + tr.income + ' utrzymanie=' + tr.upkeep + ' ogranicza=' + tr.binding + ' pop=' + tr.pop]);
  }
  rows.push(['F_nasycenie_MODEL', 'zakupy lacznie / zginelo z deficytu', lab, r.purchases, r.died, '', 'MODEL, nie kod AI, nie dowod; koszt Wojownika=' + r.cost + ' zl, ' + r.mpCost + ' MP; armia koncowa=' + r.units]);
}
add('F_nasycenie_MODEL', 'armia po ' + SAT_TURNS + ' turach (8 miast pop8)', 'gracz vs AI parytet suwakow', SAT[0].units, SAT[1].units, 'MODEL wlasnej petli narzedzia (zakup najtanszej jednostki gdy stac); NIE kod AI, NIE dowod parytetu; wniosku o AI z tego wiersza NIE wyciagac');
add('F_nasycenie_MODEL', 'armia po ' + SAT_TURNS + ' turach (8 miast pop8)', 'gracz vs AI domyslne silnika', SAT[0].units, SAT[2].units, 'MODEL: 0 dla AI wynika z zalozen modelu (80 budynkow, 8 miast pop8, brak tras handlowych); ROZJEZD z gra zmierzony w r3 (AI 15-33 jednostek bojowych w T40): model NIEROZSTRZYGAJACY, patrz REPORT.md sekcja 6');

// ---------- zapis ----------
const csv = rows.map((r) => r.map((c) => {
  const s = String(c);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(OUT, 'results.csv'), csv, 'utf8');
for (const f of [ENTRY, BUNDLE]) { try { fs.unlinkSync(f); } catch (e) { /* ok */ } }
console.log('OK wierszy=' + (rows.length - 1) + ' -> ' + path.join(OUT, 'results.csv'));
