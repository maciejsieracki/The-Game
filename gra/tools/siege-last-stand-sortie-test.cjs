'use strict';
/**
 * siege-last-stand-sortie-test.cjs -- R-WEB-SIEGE-LAST-STAND-SORTIE-Q1.
 * Reguła: oblegana armia (AI/barbarzyńcy) w OSTATNIEJ turze przed kapitulacją wychodzi i atakuje
 * oblegających, gdy jej siła >= 80% siły oblegających (10:8); inaczej zostaje w oblężeniu.
 *  A. JEDNOSTKOWA (realny src/game/siege-last-stand.ts + siegeAi.estimateUnitCombatStrength, esbuild).
 *  B. SCENARIUSZE PRZED/PO (10:5, 10:8, 10:9, 10:12 x ostatnia/nie-ostatnia): PRZED = brak modułu/wypadu (0),
 *     PO = tabela decyzji.
 *  C. MUTACJE kopii modułu -- każda musi wywrócić A.
 *  D. STRUKTURALNA main.ts (wpięcie AI + barbarzyńcy, brak ścieżki gracza), zapis/odczyt (JSON).
 * Run z gra/:  node tools/siege-last-stand-sortie-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slss-'));

function bundle(tag, modPath) {
  const entry = path.join(tmp, tag + '-entry.ts'), out = path.join(tmp, tag + '-bundle.cjs');
  fs.writeFileSync(entry,
    `export * from ${JSON.stringify(modPath)};\n` +
    `export { estimateUnitCombatStrength } from ${JSON.stringify(GRA + '/src/game/siegeAi')};\n`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  return require(out);
}
const REAL = path.join(GRA, 'src', 'game', 'siege-last-stand.ts');
function loadMutated(tag, from, to) {
  const src = fs.readFileSync(REAL, 'utf8');
  if (!src.includes(from)) throw new Error('mutacja nie pasuje: ' + tag);
  const dir = path.join(tmp, tag); fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'siege-last-stand.ts'); fs.writeFileSync(f, src.replace(from, to));
  return bundle(tag, f);
}

// --- fabryka scenariusza -------------------------------------------------
const hexDistance = (q1, r1, q2, r2) => {
  const dq = q1 - q2, dr = r1 - r2;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
};
const CITY = { id: 'c1', q: 0, r: 0, ownerId: 5, oblegane: true, oblegajacyOwnerId: 7, siegeCapitulationPending: true };
function su(strength) { // siła jednostki == strength (Atak=strength, reszta 0, HP=30)
  return { typNazwa: 'T', rola: 'Wrecz', Atak: strength / 1.5, Obrona: 0, Uderzenie: 0, Pancerz: 0, Przebicie: 0, weaponDamage: strength / 1.5, Health: 30 };
}
function mkDeps(M, extra) {
  return Object.assign({
    strengthOf: u => M.estimateUnitCombatStrength(u.siege),
    isMilitary: u => !u.civ,
    isEnemy: (a, b) => a !== b,
    hexDistance,
  }, extra || {});
}
/** besieged/besieger = siły sumaryczne; po 1 jednostce, żeby stosunek był dokładny. */
function scenario(M, besiegedStr, besiegerStr, cityOver, unitOver) {
  const city = Object.assign({}, CITY, cityOver || {});
  const units = [
    Object.assign({ id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(besiegedStr) }, unitOver || {}),
    { id: 'b1', ownerId: 7, q: 1, r: 0, ruchLeft: 2, siege: su(besiegerStr) },
  ];
  return M.planLastStandSortie(city, 7, units, mkDeps(M));
}

function runSuite(M, label) {
  const r = { fails: 0 };
  const t = (c, m, d) => { if (!c) r.fails++; if (label === 'REAL') ok(c, m, d); };

  // A1 granica 10:8
  t(M.shouldLastStandSortie(80, 100, true) === true, 'A1 dokładnie 80% (8:10) atakuje');
  t(M.shouldLastStandSortie(79.9, 100, true) === false, 'A1 79.9% nie atakuje');
  t(M.shouldLastStandSortie(79, 100, true) === false, 'A1 79% nie atakuje');
  t(M.shouldLastStandSortie(100, 100, true) === true, 'A1 równa siła atakuje');
  t(M.shouldLastStandSortie(250, 100, true) === true, 'A1 silniejsza atakuje');
  t(M.shouldLastStandSortie(0.8 * 37.3, 37.3, true) === true, 'A1 granica 80% bez błędu zmiennoprzecinkowego (37.3)');
  t(M.shouldLastStandSortie(4.4399999999999995, 5.55, true) === true, 'A1 szum zmiennoprzecinkowy: 80% z 5.55 (4.4399999999999995*10 < 5.55*8) nadal atakuje');
  // A2 nie ostatnia tura
  t(M.shouldLastStandSortie(500, 100, false) === false, 'A2 nie-ostatnia tura nie atakuje (nawet silniejsza)');
  // A3 zerowe siły
  t(M.shouldLastStandSortie(0, 100, true) === false, 'A3 brak obrońców => brak wypadu');
  t(M.shouldLastStandSortie(100, 0, true) === false, 'A3 brak oblegających => brak wypadu');
  // A4 predykat ostatniej tury
  t(M.isLastTurnBeforeCapitulation({ oblegane: true, siegeCapitulationPending: true }) === true, 'A4 oblegane + pending = ostatnia tura');
  t(M.isLastTurnBeforeCapitulation({ oblegane: true }) === false, 'A4 oblegane bez pending != ostatnia tura');
  t(M.isLastTurnBeforeCapitulation({ siegeCapitulationPending: true }) === false, 'A4 pending bez oblegane != ostatnia tura (stara flaga)');
  t(M.isLastTurnBeforeCapitulation({}) === false, 'A4 brak oblężenia = nie');

  // B planer: wypad komendą attack
  const p80 = scenario(M, 80, 100);
  t(p80.sortie === true && p80.commands.length === 1 && p80.commands[0].type === 'attack'
    && p80.commands[0].unitId === 'd1' && p80.commands[0].targetUnitId === 'b1', 'B1 10:8 ostatnia tura => 1 komenda attack d1->b1');
  t(scenario(M, 79, 100).sortie === false && scenario(M, 79, 100).commands.length === 0, 'B2 79% => brak komendy, zostaje w oblężeniu');
  t(scenario(M, 100, 100, { siegeCapitulationPending: false }).commands.length === 0, 'B3 nie-ostatnia tura => brak komendy');
  t(scenario(M, 100, 100, { oblegane: false }).commands.length === 0, 'B4 brak oblężenia => brak wypadu');
  t(scenario(M, 300, 100).sortie === true, 'B5 silniejsza => wypad');
  t(scenario(M, 100, 100, {}, { ruchLeft: 0 }).commands.length === 0, 'B6 jednostka bez ruchu nie wychodzi');
  t(scenario(M, 100, 100, {}, { sentry: true }).commands.length === 0, 'B7 uśpiona (sentry) nie wychodzi');
  t(scenario(M, 100, 100, {}, { ufortyfikowanyWPolu: true }).commands.length === 0, 'B8 ufortyfikowana w polu nie wychodzi');
  t(scenario(M, 100, 100, {}, { embarked: true }).commands.length === 0, 'B9 zaokrętowana nie wychodzi');
  // B10 cywil nie liczy się do siły i nie jest kotwicą
  {
    const city = Object.assign({}, CITY);
    const units = [
      { id: 'civ', ownerId: 5, q: 0, r: 0, ruchLeft: 2, civ: true, siege: su(1000) },
      { id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(79) },
      { id: 'b1', ownerId: 7, q: 1, r: 0, ruchLeft: 2, siege: su(100) },
    ];
    const p = M.planLastStandSortie(city, 7, units, mkDeps(M));
    t(p.sortie === false, 'B10 cywil (siła 1000) nie zawyża siły obleganych');
  }
  // B11 kotwica = pierwsza RUCHOMA wg id (deterministycznie)
  {
    const units = [
      { id: 'd2', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(50) },
      { id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 0, siege: su(50) },
      { id: 'b1', ownerId: 7, q: 1, r: 0, ruchLeft: 2, siege: su(100) },
    ];
    const p = M.planLastStandSortie(Object.assign({}, CITY), 7, units, mkDeps(M));
    t(p.sortie === true && p.commands[0].unitId === 'd2', 'B11 kotwica = pierwsza ruchoma (d2), nieruchoma d1 liczy się do siły ale nie wychodzi');
    const p2 = M.planLastStandSortie(Object.assign({}, CITY), 7, units.slice().reverse(), mkDeps(M));
    t(JSON.stringify(p) === JSON.stringify(p2), 'B11 determinizm: kolejność wejścia nie zmienia planu');
  }
  // B12 wróg musi być wrogiem
  {
    const p = M.planLastStandSortie(Object.assign({}, CITY), 7,
      [{ id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(100) }, { id: 'b1', ownerId: 7, q: 1, r: 0, ruchLeft: 2, siege: su(100) }],
      mkDeps(M, { isEnemy: () => false }));
    t(p.commands.length === 0, 'B12 oblegający bez stanu wojny => brak ataku');
  }
  // B13 cel = oblegający z największym pokryciem
  {
    const units = [
      { id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(300) },
      { id: 'b1', ownerId: 7, q: 1, r: -1, ruchLeft: 2, siege: su(30) },   // sam
      { id: 'b2', ownerId: 7, q: -1, r: 1, ruchLeft: 2, siege: su(30) },
      { id: 'b3', ownerId: 7, q: -1, r: 0, ruchLeft: 2, siege: su(30) },   // b2,b3 sąsiadują
    ];
    const p = M.planLastStandSortie(Object.assign({}, CITY), 7, units, mkDeps(M));
    t(p.commands[0] && (p.commands[0].targetUnitId === 'b2'), 'B13 cel = skupisko oblegających (b2: pokrywa b2+b3)', JSON.stringify(p.commands));
  }
  // B14 oblegający dalej niż 1 heks nie liczą się
  {
    const p = M.planLastStandSortie(Object.assign({}, CITY), 7,
      [{ id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(100) }, { id: 'b1', ownerId: 7, q: 3, r: 0, ruchLeft: 2, siege: su(10) }], mkDeps(M));
    t(p.commands.length === 0, 'B14 brak oblegających przy murach => brak ataku');
  }
  // B15 zapis/odczyt: predykat zależy tylko od utrwalonych pól miasta
  {
    const saved = JSON.parse(JSON.stringify(CITY));
    t(M.isLastTurnBeforeCapitulation(saved) === true, 'B15 po JSON round-trip miasta ostatnia tura zachowana');
    const p = M.planLastStandSortie(saved, 7, [
      { id: 'd1', ownerId: 5, q: 0, r: 0, ruchLeft: 2, siege: su(80) }, { id: 'b1', ownerId: 7, q: 1, r: 0, ruchLeft: 2, siege: su(100) }], mkDeps(M));
    t(p.sortie === true, 'B15 plan po odczycie = ten sam');
  }
  return r.fails;
}

console.log('=== A/B. REAL ===');
const REALM = bundle('real', REAL);
runSuite(REALM, 'REAL');

console.log('=== B-tabela. Scenariusze PRZED/PO (wypad: PRZED = 0 zawsze, brak mechanizmu) ===');
{
  const rows = [['10:5', 50, 100], ['10:8', 80, 100], ['10:9', 90, 100], ['10:12', 120, 100]];
  // stosunek zapisany jako oblegający:oblężony = 10:X  => siła oblężonych = X/10 * oblegających
  const exp = { '10:5': false, '10:8': true, '10:9': true, '10:12': true };
  const exp2 = {};
  for (const [lab, bd, br] of [['10:5', 50, 100], ['10:8', 80, 100], ['10:9', 90, 100], ['10:12', 120, 100]]) {
    for (const last of [true, false]) {
      const p = scenario(REALM, bd, br, { siegeCapitulationPending: last });
      const want = last && exp[lab];
      ok(p.sortie === want, `tabela ${lab} ${last ? 'ostatnia' : 'nie-ostatnia'} tura: PRZED=brak wypadu, PO=${p.sortie ? 'WYPAD' : 'zostaje'}`);
    }
  }
}

console.log('=== C. MUTACJE ===');
const MUT = [
  ['m1-prog-80-na-70', 'LAST_STAND_BESIEGED_PARTS = 8', 'LAST_STAND_BESIEGED_PARTS = 7'],
  ['m2-prog-80-na-90', 'LAST_STAND_BESIEGED_PARTS = 8', 'LAST_STAND_BESIEGED_PARTS = 9'],
  ['m3-ignoruj-ostatnia-ture', 'if (!isLastTurn) return false;', ''],
  ['m4-ostro-wieksze', 'besiegerStrength * LAST_STAND_BESIEGED_PARTS', 'besiegerStrength * LAST_STAND_BESIEGED_PARTS + 1e-3'],
  ['m5-bez-pending', 'city.oblegane === true && city.siegeCapitulationPending === true', 'city.oblegane === true'],
  ['m6-ruch', 'if (u.ruchLeft <= 0) return false;', ''],
  ['m7-sentry', 'if (u.sentry === true) return false;', ''],
  ['m11-bez-EPS', 'besiegedStrength * LAST_STAND_BESIEGER_PARTS + EPS', 'besiegedStrength * LAST_STAND_BESIEGER_PARTS'],
  ['m8-wojna', 'if (besiegerOwnerId === city.ownerId || !deps.isEnemy(city.ownerId, besiegerOwnerId)) {', 'if (false) {'],
  ['m9-cywil', 'deps.isMilitary(u))\n    .sort(byId);\n  // Oblegający', 'true)\n    .sort(byId);\n  // Oblegający'],
];
for (const [tag, from, to] of MUT) {
  let killed = false;
  try { const M = loadMutated(tag, from, to); killed = runSuite(M, 'MUT') > 0; } catch (e) { killed = true; }
  ok(killed, 'mutacja ' + tag + ' wywraca testy');
}

console.log('=== D. STRUKTURALNA main.ts ===');
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
ok(/import \{ planLastStandSortie[^}]*\} from '\.\/game\/siege-last-stand'/.test(main), 'D1 main.ts importuje planLastStandSortie');
ok(/commands = \[\.\.\.lastStandSortieCmdsForOwner\(ownerId\), \.\.\.commands\]/.test(main), 'D2 AI: komendy wypadu doklejone po decideAITurn');
ok(/barbCmds\.unshift\(\.\.\.lastStandSortieCmdsForOwner\(BARBARIAN_OWNER_ID\)\)/.test(main), 'D3 barbarzyńcy: komendy wypadu doklejone po decideBarbarianMoves');
ok(/function lastStandSortieCmdsForOwner[\s\S]{0,200}if \(isHuman\(ownerId\)\) return out;/.test(main), 'D4 gracz (człowiek) wykluczony z automatu wypadu');
ok(/estimateUnitCombatStrength\(runtimeUnitToSiegeUnit\(u\)\)/.test(main), 'D5 siła = wspólna funkcja siegeAi (estimateUnitCombatStrength)');
ok(!/siege-last-stand/.test(fs.readFileSync(path.join(GRA, 'src', 'game', 'ai.ts'), 'utf8')), 'D6 ai.ts nietknięty (Stadnina/auto-improvements poza zakresem)');

// D7-D9 (R1 zarzut 1): kolejność faz i warunki egzekucji komendy attack -- test strukturalny kolejności,
// bo żywy przebieg tury wymaga przeglądarki.
{
  const iAi = main.indexOf('commands = decideAITurn(ownerId, units, cities, map, data, opts);');
  const iSortie = main.indexOf('commands = [...lastStandSortieCmdsForOwner(ownerId), ...commands];');
  const iExec = main.indexOf("if (cmd.type === 'attack') {", iSortie);
  ok(iAi > 0 && iSortie > iAi && iExec > iSortie, 'D7 AI: kolejność decideAITurn -> doklejenie wypadu -> egzekucja komend attack');
  const execBlock = main.slice(iExec, iExec + 1500);
  ok(/attacker\.ownerId !== ownerId/.test(execBlock) && /areEnemyOwners\(ownerId, defender\.ownerId\)/.test(execBlock)
    && !/siegeCapitulationPending|oblegane/.test(execBlock),
  'D8 egzekucja attack AI: sprawdza właściciela i wojnę, nie odrzuca atakującego z oblężonego miasta');
  const iBarbDecide = main.indexOf('barbCmds.unshift(...lastStandSortieCmdsForOwner(BARBARIAN_OWNER_ID));');
  const iBarbExec = main.indexOf("bcmd.type === 'attack'", iBarbDecide);
  ok(iBarbDecide > 0 && iBarbExec > iBarbDecide, 'D9 barbarzyńcy: doklejenie wypadu przed egzekucją komend attack');
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
