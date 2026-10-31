'use strict';

/**
 * R-WEB-AUTOIMPROVE-STAGES-Q1 — kontrakt etapowego automatu ulepszen (produkcyjny
 * pickAutoImprovements + decideAITurn, symulacja tura po turze na realnym kwalifikatorze).
 *
 * KONTEKSTY (wiazace, wlasciciel 2026-10-31) — kazda asercja ma przedrostek:
 *   [K1] gracz, profil „Zywnosc"  — tylko zywnosc, BEZ odwolan do niedoborow;
 *   [K2] gracz, profil „zrownowazone" — zywnosc, niedobor surowca idzie NA PRZOD, po zaspokojeniu powrot;
 *   [K3] AI cywilizacji (zawsze zrownowazone) — TA SAMA logika co K2.
 * Scenariusze kryteriow koncowych: (a)..(f) + ABC-5 (g), starvation/Q2=B (h), cykl niedoboru (i),
 * parytet K2<->K3 (j), profile „surowce"/„infrastruktura" bez zmian wzgl. bazy (k).
 *
 * Run z gra/:  node tools/autoimprove-stages-q1-test.cjs
 * Mutacje:     STAGES_Q1_SRC_DIR=<kopia gra/src z mutacja> node tools/autoimprove-stages-q1-test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.STAGES_Q1_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stages-q1-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements, prioritiesForUlepszeniaFocus } from ${JSON.stringify(SRC + '/game/auto-improvements')};\nexport { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, prioritiesForUlepszeniaFocus, decideAITurn } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = [
  'Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Górnictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Drogi brukowane', 'Matematyka', 'Obróbka kamienia', 'Kamieniarstwo',
];

// --- fikstury --------------------------------------------------------------
const W = 24, H = 24, CQ = 12, CR = 12;
function makeMap({ river = [], forest = [], hills = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of river) hexes[`${q},${r}`].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[`${q},${r}`].nakladka = 'las';
  for (const [q, r] of hills) hexes[`${q},${r}`].terenBazowy = 'wzgorza';
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const K = (q, r) => `${q},${r}`;
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'A', population: 12 };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 12, level: 1 }];

/**
 * Symulacja tura po turze. profil: 'K1' | 'K2' | 'K3'.
 * Wyrab konczy sie w tej samej turze (silnik AI commituje od razu; dla gracza tick wycinki jest osobny).
 */
const FOCUS_OF = { K1: 'zywnosc', K2: 'zrownowazone', K3: 'zrownowazone', S: 'surowce', I: 'infrastruktura' };
function sim({
  map, worked, profil = 'K2', turns = 30, techsByTurn = () => FULL, deficitFn = () => [], pool0 = 5000, income = 60,
  pct = 100, civ = 'grecy', era = 3, placed0 = new Map(), maxItems, reserve = 30, wolnoWycinac = true,
}) {
  const placed = new Map(placed0);
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  let pool = pool0;
  const log = [];
  for (let t = 0; t < turns; t++) {
    const techs = new Set(techsByTurn(t));
    const deficit = deficitFn(t, placed, map);
    let picks;
    if (profil === 'K3') {
      const cmds = decideAITurn(0, [], [{ ...CITY, okolicaTryb: 'reczny', okolicaReczne: Object.fromEntries([...workedSet].map(k => [k, 1])) }], map,
        { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
          civType: civ, poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: TN,
          placedImprovements: placed, improvementTechs: techs, pracaAvailable: pool, civEra: era,
          resourceDeficitKeys: deficit, improvementBudgetCap: pool,
        }).filter(c => c.type === 'buildImprovement');
      picks = cmds.map(c => ({ q: c.q, r: c.r, key: c.key, kosztPraca: (c.key === 'wyrab' ? 2.5 : c.key === 'irygacja' ? 60 : 20) }));
    } else {
      picks = pickAutoImprovements({
        cities: [{ ...CITY, ulepszeniaFocus: FOCUS_OF[profil] }], ownerId: 0, map, territoryNodes: TN,
        placedImprovements: placed, pracaAvailable: pool, unlockedTechs: techs,
        pracaSurplusThreshold: reserve, skipWyrab: !wolnoWycinac,
        demandDriven: true, resourceDeficitKeys: deficit,
        getFocus: () => FOCUS_OF[profil],
        getOnlyWorked: () => true, getWorkedHexKeys: () => workedSet,
        pracaBudgetPercent: pct, civArchetype: civ, playerEra: era,
        foodImprovementStages: () => FOCUS_OF[profil] === 'zywnosc' || FOCUS_OF[profil] === 'zrownowazone', ...(maxItems ? { maxItemsPerCity: maxItems } : {}),
      });
    }
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, hk });
      pool -= p.kosztPraca;
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    pool += income;
  }
  return { log, placed };
}
const seqOf = log => log.map(e => `${e.t}:${e.key}@${e.hk}`).join(' ');
const idx = (log, key, hk) => log.findIndex(e => e.key === key && e.hk === hk);
const count = (log, key) => log.filter(e => e.key === key).length;

const RIVER = [[12, 9], [12, 10], [13, 10]];
const RING = [[11, 11], [13, 11], [11, 12], [13, 12], [12, 13], [11, 13]];
const WORKED_ALL = [...RIVER, ...RING];

// ===========================================================================
for (const profil of ['K1', 'K2', 'K3']) {
  console.log(`(a) [${profil}] farma -> trzoda -> irygacja na heksie przy rzece z obywatelem po nadaniu technologii`);
  for (const [nazwa, deficitFn] of [['bez niedoboru', () => []], ['z niedoborem surowca (glina, drewno)', () => ['glina', 'drewno']]]) {
    const map = makeMap({ river: RIVER });
    const { log } = sim({
      map, worked: WORKED_ALL, profil, turns: 40, deficitFn,
      techsByTurn: t => (t < 3 ? ['Rolnictwo'] : FULL),
    });
    for (const [q, r] of RIVER) {
      const hk = K(q, r);
      const a = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
      ok(a >= 0 && b > a && c > b, `[${profil}] ${nazwa}: ${hk} farma(${a}) < bydlo(${b}) < irygacja(${c})`);
    }
    if (profil === 'K1') {
      ok(count(log, 'tartak') === 0 && count(log, 'glinianka') === 0,
        `[K1] ${nazwa}: zero tartaku/gliniany (profil „Zywnosc" nie odwoluje sie do niedoborow)`);
    }
  }
}

// K1: sekwencja z niedoborem IDENTYCZNA jak bez niedoboru (brak jakiegokolwiek odwolania do niedoborow)
console.log('(d) [K1] profil „Zywnosc" — zero odwolan do niedoborow (identyczna sekwencja)');
{
  const mk = () => makeMap({ river: RIVER, forest: [[12, 9], [14, 12], [11, 11]], hills: [[13, 12]] });
  const bez = sim({ map: mk(), worked: WORKED_ALL, profil: 'K1', turns: 40 });
  const z = sim({ map: mk(), worked: WORKED_ALL, profil: 'K1', turns: 40, deficitFn: () => ['drewno', 'kamien', 'glina', 'ruda'] });
  ok(seqOf(bez.log) === seqOf(z.log), '[K1] sekwencja z niedoborem {drewno,kamien,glina,ruda} == sekwencja bez niedoboru');
  ok(count(z.log, 'kamieniolom') === 0, '[K1] kamieniolom nie powstaje mimo niedoboru kamienia');
}

for (const profil of ['K1', 'K2', 'K3']) {
  console.log(`(b) [${profil}] heks rzeka+las z obywatelem: wyrab -> farma -> trzoda -> irygacja`);
  const map = makeMap({ river: RIVER, forest: RIVER });
  const { log } = sim({ map, worked: WORKED_ALL, profil, turns: 40 });
  for (const [q, r] of RIVER) {
    const hk = K(q, r);
    const w = idx(log, 'wyrab', hk), a = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
    ok(w >= 0 && a > w && b > a && c > b, `[${profil}] ${hk}: wyrab(${w}) < farma(${a}) < bydlo(${b}) < irygacja(${c})`);
  }
  console.log(`  [info] [${profil}] tartak=${count(log, 'tartak')} oboz=${count(log, 'oboz_lowiecki')}`);
  const przedWyrabem = log.filter(e => (e.key === 'tartak' || e.key === 'oboz_lowiecki') && RIVER.some(([q, r]) => K(q, r) === e.hk) && idx(log, 'wyrab', e.hk) < 0);
  ok(przedWyrabem.length === 0, `[${profil}] zero tartaku/obozu na heksie rzeka+las zamiast wyrebu`);
}

for (const profil of ['K1', 'K2', 'K3']) {
  console.log(`(c) [${profil}] po zagospodarowaniu rzek: wycinka + farmy poza rzeka, tartak/obozu nie ruszane`);
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13]];
  const map = makeMap({ river: RIVER, forest: [...FOR, [14, 13]] });
  const placed0 = new Map();
  for (const [q, r] of RIVER) placed0.set(K(q, r), ['farma', 'bydlo', 'irygacja']);
  placed0.set(K(14, 13), ['tartak']); // heks z tartakiem — nie wycinamy
  const { log } = sim({ map, worked: [...WORKED_ALL, [14, 12], [14, 13]], profil, turns: 40, placed0 });
  for (const [q, r] of FOR) {
    const hk = K(q, r);
    const w = idx(log, 'wyrab', hk), a = idx(log, 'farma', hk);
    ok(w >= 0 && a > w, `[${profil}] ${hk}: wyrab(${w}) potem farma(${a}) poza rzeka`);
  }
  for (const [q, r] of FOR) {
    const hk = K(q, r);
    const a = idx(log, 'farma', hk), c = idx(log, 'irygacja', hk);
    if (c >= 0) ok(a >= 0 && a < c, `[${profil}] ${hk}: irygacja(${c}) dopiero PO farmie(${a}) (kolejnosc etapow E5 -> E4 w nastepnej turze)`);
  }
  ok(FOR.some(([q, r]) => idx(log, 'irygacja', K(q, r)) >= 0), `[${profil}] (kontrola) co najmniej jeden wyciety heks poza rzeka dostal irygacje (przy rzece)`);
  ok(idx(log, 'wyrab', K(14, 13)) < 0, `[${profil}] heks z tartakiem 14,13 NIE jest wycinany`);
  ok(map.hexes['14,13'].nakladka === 'las', `[${profil}] las pod tartakiem nietkniety`);
  ok(!log.some(e => e.key === 'tartak' && e.hk !== '14,13' && FOR.some(([q, r]) => K(q, r) === e.hk && idx(log, 'wyrab', e.hk) < 0),
  ), `[${profil}] tartak nie stawiany na wycinanym lesie zamiast wyrebu`);
}

console.log('(c2) [K2] wycinka poza rzeka BEZ progu lasu i BEZ minimum lesnego (1 las, brak tartaku)');
{
  const map = makeMap({ river: RIVER, forest: [[14, 12]] });
  const placed0 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo', 'irygacja']]));
  const { log } = sim({ map, worked: [...WORKED_ALL, [14, 12]], profil: 'K2', turns: 10, placed0 });
  ok(idx(log, 'wyrab', '14,12') >= 0, '[K2] pojedynczy las poza rzeka (ponizej progu 3, bez tartaku) zostaje wyciety');
}

console.log('(c3) [K2] wolno wycinac las = OFF: poza rzeka nie tniemy, na rzece tniemy (etap E2)');
{
  const map = makeMap({ river: RIVER, forest: [...RIVER, [14, 12]] });
  const { log } = sim({ map, worked: [...WORKED_ALL, [14, 12]], profil: 'K2', turns: 30, wolnoWycinac: false });
  ok(RIVER.every(([q, r]) => idx(log, 'wyrab', K(q, r)) >= 0), '[K2] OFF: wyrab na rzece nadal dziala');
  ok(idx(log, 'wyrab', '14,12') < 0, '[K2] OFF: brak wyrebu poza rzeka');
}

// (e) Nowy Swiat
console.log('(e) cywilizacja Nowego Swiata (playerEra)');
{
  const m1 = makeMap({ river: RIVER });
  const era1 = sim({ map: m1, worked: WORKED_ALL, profil: 'K2', turns: 30, civ: 'inkowie', era: 1 });
  const m3 = makeMap({ river: RIVER });
  const era3 = sim({ map: m3, worked: WORKED_ALL, profil: 'K2', turns: 40, civ: 'inkowie', era: 3 });
  ok(count(era1.log, 'bydlo') === 0 && count(era1.log, 'owce') === 0, '[K2] Inkowie, epoka 1: trzoda (bydlo/owce) zablokowana regula civ/epoka');
  ok(count(era1.log, 'irygacja') > 0, '[K2] Inkowie, epoka 1: irygacja NIE jest zakladnikiem braku trzody (ABC-5=A)');
  ok(count(era3.log, 'bydlo') > 0, '[K2] Inkowie, epoka 3: trzoda powstaje');
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const i = mainSrc.indexOf('const picks = pickAutoImprovements({');
  const blok = i >= 0 ? mainSrc.slice(i, i + 6000) : '';
  ok(/playerEra:\s*empireEpochForOwner\(hOid\)/.test(blok), '[K1/K2] main.ts: picker gracza dostaje `playerEra: empireEpochForOwner(hOid)`');
  const ai = fs.readFileSync(path.resolve(SRC, 'game/ai.ts'), 'utf8');
  ok(/playerEra:\s*opts\.civEra \?\? 1/.test(ai), '[K3] ai.ts: picker AI dostaje `playerEra: opts.civEra`');
  const mAi = makeMap({ river: RIVER });
  const aiEra3 = sim({ map: mAi, worked: WORKED_ALL, profil: 'K3', turns: 40, civ: 'inkowie', era: 3 });
  ok(count(aiEra3.log, 'bydlo') > 0, '[K3] AI Inkowie, epoka 3 (civEra): trzoda powstaje');
}

console.log('(f) [K3] AI cywilizacji: farma -> trzoda -> irygacja przy rzece po nadaniu technologii');
{
  const map = makeMap({ river: RIVER });
  const { log } = sim({ map, worked: WORKED_ALL, profil: 'K3', turns: 40, techsByTurn: t => (t < 3 ? ['Rolnictwo'] : FULL) });
  for (const [q, r] of RIVER) {
    const hk = K(q, r);
    const a = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
    ok(a >= 0 && b > a && c > b, `[K3] ${hk}: farma < bydlo < irygacja (${a}/${b}/${c})`);
  }
}

console.log('(g) ABC-5=A: brak „Oswojenia zwierzat" nie wiesza irygacji');
for (const profil of ['K1', 'K2', 'K3']) {
  const map = makeMap({ river: RIVER });
  const techs = FULL.filter(t => t !== 'Oswojenie zwierząt');
  const { log } = sim({ map, worked: WORKED_ALL, profil, turns: 30, techsByTurn: () => techs });
  ok(count(log, 'bydlo') === 0 && count(log, 'irygacja') >= RIVER.length, `[${profil}] bez Oswojenia: trzoda 0, irygacja ${count(log, 'irygacja')} >= ${RIVER.length}`);
}

console.log('(h) Q2=B / ABC-6=A: trzoda i irygacja poza limitem %; rezerwacja budzetu na irygacje (koniec starvation)');
for (const profil of ['K1', 'K2']) {
  // limit 20% przy puli 200 = 40 < koszt irygacji 60; E3/E4 poza limitem — irygacja i tak powstaje
  const m1 = makeMap({ river: RIVER });
  const placed0 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
  const r1 = sim({ map: m1, worked: WORKED_ALL, profil, turns: 6, pool0: 200, income: 0, pct: 20, placed0 });
  ok(count(r1.log, 'irygacja') >= 1, `[${profil}] limit 20% (40 < 60): irygacja powstaje poza limitem (${count(r1.log, 'irygacja')} szt.)`);
  // starvation: male przychody, wiele tanich farm poza rzeka czeka; irygacja (60) ma pierwszenstwo
  const FOR2 = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13]];
  const m2 = makeMap({ river: RIVER });
  const placed2 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
  const r2 = sim({ map: m2, worked: [...WORKED_ALL, ...FOR2], profil, turns: 30, pool0: 80, income: 12, pct: 100, placed0: placed2 });
  const firstIrr = r2.log.findIndex(e => e.key === 'irygacja');
  const farmBefore = r2.log.slice(0, firstIrr < 0 ? r2.log.length : firstIrr).filter(e => e.key === 'farma').length;
  ok(firstIrr >= 0 && count(r2.log, 'irygacja') >= RIVER.length, `[${profil}] male przychody (12/ture): wszystkie ${RIVER.length} irygacje powstaja w 30 turach (${count(r2.log, 'irygacja')})`);
  ok(farmBefore === 0, `[${profil}] tanie farmy poza rzeka NIE wyprzedzaja irygacji rzecznej (${farmBefore} przed pierwsza irygacja)`);
}

console.log('(h2) rezerwacja budzetu wewnatrz etapu E4: tanie tarasy nie zjadaja budzetu irygacji (60)');
for (const profil of ['K1', 'K2']) {
  const map = makeMap({ river: RIVER, hills: [[11, 13], [14, 12]] });
  const placed0 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
  const { log } = sim({ map, worked: [...WORKED_ALL, [14, 12]], profil, turns: 70, pool0: 82, income: 8, placed0, civ: 'chinczycy' });
  ok(count(log, 'tarasy') > 0, `[${profil}] (kontrola) tarasy w ogole powstaja dla Chinczykow (${count(log, 'tarasy')})`);
  console.log('  [seq] ' + seqOf(log).split(' ').slice(0, 12).join(' '));
  const firstIrr = log.findIndex(e => e.key === 'irygacja');
  const tarasBefore = log.slice(0, firstIrr < 0 ? log.length : firstIrr).filter(e => e.key === 'tarasy').length;
  ok(firstIrr >= 0 && count(log, 'irygacja') >= RIVER.length, `[${profil}] irygacje rzeczne powstaja mimo tanich tarasow (${count(log, 'irygacja')}/${RIVER.length})`);
  ok(tarasBefore === 0, `[${profil}] tarasy nie wyprzedzaja irygacji rzecznej (${tarasBefore} przed pierwsza irygacja)`);
}

console.log('(i) [K2] cykl: niedobor -> ulepszenie surowca NA PRZOD -> zaspokojenie -> powrot do zywnosci -> ponowny niedobor');
{
  const mkMap = () => makeMap({ river: RIVER, hills: [[11, 11]] });
  const stock = { kamien: 0 };
  const sloty = [];
  // kamieniolom na heksie 11,11 daje kamien dopiero PO zbudowaniu (stan magazynu = funkcja turn)
  const map = mkMap();
  const deficitFn = (t, placed) => {
    const has = (placed.get('11,11') ?? []).includes('kamieniolom');
    const kamien = (has ? 100 : 0) - (t >= 12 ? 100 : 0); // t>=12: zuzycie zjadlo zapas -> ponowny niedobor
    sloty.push({ t, kamien });
    return kamien < 10 ? ['kamien'] : [];
  };
  void stock;
  // R4: po ponownym niedoborze (t>=12) w okolicy nie ma juz NIC do zbudowania poza zywnoscia — dlatego „Oswojenie
  // zwierzat” przychodzi dopiero w t=12 (trzoda wraca do kolejki): dowod, ze niedobor bez miejsca na ulepszenie
  // (jedyny heks Wzgorz zajety) NIE zakleszcza zywnosci. Reszty listy niedobor NIE otwiera (decyzja R4).
  const { log } = sim({ map, worked: WORKED_ALL, profil: 'K2', turns: 20, deficitFn,
    techsByTurn: t => (t < 12 ? FULL.filter(x => x !== 'Oswojenie zwierząt') : FULL) });
  const kam = log.filter(e => e.key === 'kamieniolom');
  ok(kam.length >= 1 && kam[0].t === 0, `[K2] niedobor w turze 0 -> kamieniolom w TEJ SAMEJ turze (t=${kam[0] ? kam[0].t : 'brak'})`);
  const tura0 = log.filter(e => e.t === 0).map(e => e.key);
  ok(tura0[0] === 'kamieniolom', `[K2] kamieniolom PRZED zywnoscia w turze 0 (${tura0.join(',')})`);
  const po = log.filter(e => e.t >= 1 && e.t < 12);
  ok(po.length > 0 && po.every(e => e.key !== 'kamieniolom'), `[K2] po zaspokojeniu (t=1..11) automat wraca do zywnosci: ${[...new Set(po.map(e => e.key))].join(',')}`);
  ok(po.some(e => e.key === 'farma'), '[K2] w trakcie zaspokojenia zywnosc (farma) jest budowana');
  const znowu = log.filter(e => e.t >= 12);
  void znowu;
  ok(kam.length === 1, `[K2] zaspokojony niedobor nie zostawia „trybu surowcowego" (kamieniolom ${kam.length} szt. - jedyny heks Wzgorz)`);
  const wrocil = log.filter(e => e.t >= 12).some(e => e.key !== 'kamieniolom');
  ok(wrocil, '[K2] po ponownym niedoborze brak zakleszczenia: zywnosc nadal budowana (brak histerezy)');
}

console.log('(j) parytet K2 <-> K3: ten sam stan => ta sama kolejnosc i zestaw budow (R3 ABC-D=B: BEZ limitu maxItemsPerCity AI)');
{
  const FOR = [[14, 12], [11, 13]];
  const scenariusze = [
    ['bez niedoboru', () => [], 0],
    ['niedobor kamienia (t<3)', t => (t < 3 ? ['kamien'] : []), 0],
  ];
  for (const [nazwa, deficitFn] of scenariusze) {
    const mk = () => makeMap({ river: RIVER, forest: [...RIVER, ...FOR], hills: [[11, 11], [13, 11]] });
    const worked = [...WORKED_ALL, ...FOR];
    const k2 = sim({ map: mk(), worked, profil: 'K2', turns: 14, deficitFn }); // R3 ABC-D=B: bez maxItems (wczesniej 1)
    const k3 = sim({ map: mk(), worked, profil: 'K3', turns: 14, deficitFn });
    ok(seqOf(k2.log) === seqOf(k3.log), `[K2=K3] ${nazwa}: identyczna sekwencja (K2: ${seqOf(k2.log).slice(0, 90)}…)`);
    if (seqOf(k2.log) !== seqOf(k3.log)) { console.error('K2: ' + seqOf(k2.log)); console.error('K3: ' + seqOf(k3.log)); }
  }
}

console.log('(k) profile gracza „surowce" (S) i „infrastruktura" (I) BEZ ZMIAN wzgledem bazy 4d1916f2c (zarzut FC R1 nr 1)');
{
  // Baza 4d1916f2c (zmierzone przez FC na tej samej mapie: miasto pop 12, 6 lasow, 10 tur, bez niedoboru): tartak = 6.
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  const mk = () => makeMap({ forest: FOR });
  const s = sim({ map: mk(), worked: FOR, profil: 'S', turns: 10 });
  ok(count(s.log, 'tartak') === 6, `[S] profil „surowce": tartak ${count(s.log, 'tartak')} == 6 (baza; bez limitu ceil(pop/10)=2)`);
  ok(count(s.log, 'oboz_lowiecki') === 0, `[S] profil „surowce": obozy ${count(s.log, 'oboz_lowiecki')} (poza lista profilu)`);
  const i = sim({ map: mk(), worked: FOR, profil: 'I', turns: 10 });
  ok(count(i.log, 'tartak') === 0 && count(i.log, 'farma') === 0, `[I] profil „infrastruktura": tylko infrastruktura (tartak ${count(i.log, 'tartak')}, farma ${count(i.log, 'farma')})`);
}

console.log('(k2) [K2/K3] tartak/obóz w minimum lesnym ceil(pop/10) (nie na kazdym lesie) — TYLKO przebiegi K1/K2/K3; ABC-B czeka');
for (const profil of ['K2', 'K3']) {
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  const map = makeMap({ forest: FOR });
  const { log } = sim({ map, worked: FOR, profil, turns: 30, deficitFn: () => ['drewno'] });
  const lesneMin = Math.ceil(CITY.population / 10);
  ok(count(log, 'tartak') >= 1 && count(log, 'tartak') <= lesneMin, `[${profil}] tartaki ${count(log, 'tartak')} w granicach 1..${lesneMin} (nie ${FOR.length})`);
  ok(count(log, 'oboz_lowiecki') <= lesneMin, `[${profil}] obozy ${count(log, 'oboz_lowiecki')} <= ${lesneMin}`);
}

console.log('(k3) [K2/K3] KOREKTA F: heks CENTRUM z lasem jest ZWYKLYM heksem — brak filtra centrum (zarzut Evaluatora R4 nr 4: asercja zamiast pomiaru)');
{
  // Produkcyjnie centrum nie ma lasu (R-WEB-CITY-CLEARS-FOREST-Q1), wiec fikstura ai2-heks-po-heksie ustawia
  // `nakladka='brak'`; ten przypadek pilnuje, ze PICKER nie ma specjalnego filtra centrum: gdyby las byl,
  // centrum kwalifikuje sie na tych samych zasadach co kazdy inny heks z lasem (przywrocenie filtra -> pada).
  const wyniki = {};
  for (const profil of ['K2', 'K3']) {
    const mapC = makeMap({ forest: [[CQ, CR]] });
    const { log: logC } = sim({ map: mapC, worked: [[CQ, CR]], profil, turns: 6, deficitFn: () => ['drewno'] });
    const naCentrum = logC.filter(e => e.hk === K(CQ, CR)).map(e => e.key);
    // ten sam las na zwyklym heksie obrabianym (nie-centrum) — referencja
    const mapR = makeMap({ forest: [[CQ + 2, CR]] });
    const { log: logR } = sim({ map: mapR, worked: [[CQ + 2, CR]], profil, turns: 6, deficitFn: () => ['drewno'] });
    const naZwyklym = logR.filter(e => e.hk === K(CQ + 2, CR)).map(e => e.key);
    wyniki[profil] = naCentrum.join(',');
    ok(naCentrum.includes('tartak'), `[${profil}] centrum z lasem + niedobor drewna: tartak sie kwalifikuje (${naCentrum.join(',') || 'brak'})`);
    ok(naCentrum.join(',') === naZwyklym.join(','), `[${profil}] centrum == zwykly heks z lasem (${naCentrum.join(',')} vs ${naZwyklym.join(',')})`);
  }
  ok(wyniki.K2 === wyniki.K3, `parytet K2<->K3 na centrum z lasem (${wyniki.K2} vs ${wyniki.K3})`);
}

console.log('(l) [K2/K3] niedobor surowca bez ulepszenia terenu (zloto) NIE zmienia kolejnosci');
for (const profil of ['K2', 'K3']) {
  const mk = () => makeMap({ river: RIVER });
  const a = sim({ map: mk(), worked: WORKED_ALL, profil, turns: 20 });
  const b = sim({ map: mk(), worked: WORKED_ALL, profil, turns: 20, deficitFn: () => ['zloto', 'stal'] });
  ok(seqOf(a.log) === seqOf(b.log), `[${profil}] niedobor {zloto,stal} (brak ulepszenia) == brak niedoboru`);
}

console.log('(m) [K1] R3 ABC-A=C: profil „Zywnosc" BEZ tartaku i obozu (zero tartakow/obozow nawet przy lesie, obozie na tartaku i niedoborze)');
{
  const lista = prioritiesForUlepszeniaFocus('zywnosc');
  ok(!lista.includes('tartak') && !lista.includes('oboz_lowiecki'),
    `[K1] lista profilu „Zywnosc" nie zawiera tartaku ani obozu (${lista.join(',')})`);
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13]];
  for (const [nazwa, deficitFn] of [['bez niedoboru', () => []], ['z niedoborem drewna', () => ['drewno']]]) {
    const map = makeMap({ river: RIVER, forest: FOR });
    // heks 14,12 ma JUZ tartak (zbudowany wczesniej) — w K1 obozu na nim i tak nie wolno stawiac
    const placed0 = new Map([['14,12', ['tartak']]]);
    const { log } = sim({ map, worked: [...WORKED_ALL, ...FOR], profil: 'K1', turns: 40, deficitFn, placed0 });
    ok(count(log, 'tartak') === 0 && count(log, 'oboz_lowiecki') === 0,
      `[K1] ${nazwa}: tartak ${count(log, 'tartak')}, oboz ${count(log, 'oboz_lowiecki')} (== 0)`);
    ok(count(log, 'farma') > 0, `[K1] ${nazwa}: zywnosc nadal budowana (farm ${count(log, 'farma')})`);
  }
}

console.log('(n) [K2/K3] R3 ABC-B=B: tartak WYLACZNIE przy niedoborze drewna; obóz tylko na heksie z ISTNIEJACYM tartakiem');
for (const profil of ['K2', 'K3']) {
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  const mk = () => makeMap({ forest: FOR });
  const bez = sim({ map: mk(), worked: FOR, profil, turns: 30 });
  ok(count(bez.log, 'tartak') === 0 && count(bez.log, 'oboz_lowiecki') === 0,
    `[${profil}] bez niedoboru drewna: tartak ${count(bez.log, 'tartak')}, oboz ${count(bez.log, 'oboz_lowiecki')} (== 0, zniesienie „1 na 10” jako reguly budowy)`);
  ok(count(bez.log, 'wyrab') > 0, `[${profil}] bez niedoboru wycinka nadal rusza (${count(bez.log, 'wyrab')} szt.)`);
  const inny = sim({ map: mk(), worked: FOR, profil, turns: 30, deficitFn: () => ['kamien'] });
  ok(count(inny.log, 'tartak') === 0, `[${profil}] niedobor INNEGO surowca (kamien) nie otwiera tartaku (${count(inny.log, 'tartak')})`);
  const z = sim({ map: mk(), worked: FOR, profil, turns: 30, deficitFn: () => ['drewno'] });
  ok(count(z.log, 'tartak') >= 1, `[${profil}] z niedoborem drewna tartak powstaje (${count(z.log, 'tartak')})`);
  // obóz: tylko na heksie z JUZ istniejacym tartakiem, bez budowy nowego tartaku
  const map2 = mk();
  const placed0 = new Map([['14,12', ['tartak']]]);
  const o = sim({ map: map2, worked: FOR, profil, turns: 30, placed0 });
  const obozy = o.log.filter(e => e.key === 'oboz_lowiecki');
  ok(count(o.log, 'tartak') === 0, `[${profil}] istniejacy tartak + brak niedoboru: zadnego NOWEGO tartaku (${count(o.log, 'tartak')})`);
  ok(obozy.length === 1 && obozy[0].hk === '14,12',
    `[${profil}] oboz powstaje TYLKO na heksie z istniejacym tartakiem 14,12 (${obozy.map(e => e.hk).join(',') || 'brak'})`);
}

console.log('(n2) [K2/K3] R3 ABC-B=B: sciezka BEZ wycinki (K2: „wolno wycinac las”=OFF; K3: las poza obrabianymi) — tartak nadal tylko przy niedoborze drewna');
{
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  const mk = () => makeMap({ forest: FOR });
  for (const [profil, worked, wolnoWycinac] of [['K2', FOR, false], ['K3', [[12, 11]], true]]) {
    for (const [nazwa, deficitFn] of [['bez niedoboru', () => []], ['niedobor kamienia', () => ['kamien']]]) {
      const r = sim({ map: mk(), worked, profil, turns: 12, deficitFn, wolnoWycinac });
      ok(count(r.log, 'tartak') === 0 && count(r.log, 'oboz_lowiecki') === 0,
        `[${profil}] ${nazwa}: tartak ${count(r.log, 'tartak')}, oboz ${count(r.log, 'oboz_lowiecki')} (== 0)`);
    }
    const z = sim({ map: mk(), worked, profil, turns: 12, deficitFn: () => ['drewno'], wolnoWycinac });
    ok(count(z.log, 'tartak') >= 1, `[${profil}] niedobor drewna: tartak powstaje (${count(z.log, 'tartak')})`);
  }
}

console.log('(o) [K3] R3 ABC-D=B: AI bez limitu 1/miasto/ture (jak gracz) — wiecej niz 1 rozkaz na miasto w jednej turze');
{
  const FOR = [];
  const map = makeMap({ river: RIVER });
  const k3 = sim({ map, worked: WORKED_ALL, profil: 'K3', turns: 12 });
  const perTurn = new Map();
  for (const e of k3.log) perTurn.set(e.t, (perTurn.get(e.t) ?? 0) + 1);
  const maxPerTurn = Math.max(0, ...perTurn.values());
  void FOR;
  ok(maxPerTurn > 1, `[K3] max rozkazow na miasto w jednej turze = ${maxPerTurn} (> 1; limit etapu = 3)`);
  ok(maxPerTurn <= 3 + 2, `[K3] ... nadal w granicach limitu etapu (${maxPerTurn})`);
}

console.log('(p) KOREKTA F (R4): heks CENTRUM miasta to ZWYKLY heks — farma, trzoda, irygacja takze w centrum (K1, K2, K3)');
for (const profil of ['K1', 'K2', 'K3']) {
  // `worked` BEZ centrum — tak jak produkcyjne `workedHexCoordsForCity` (okolica.ts:276 wyklucza centrum);
  // centrum jest zawsze pracowane (okolica.ts:626), wiec picker dopisuje je do zbioru „pracowanych”.
  const map = makeMap({ river: [[CQ, CR], [CQ, CR - 1]] });
  const { log } = sim({ map, worked: [[CQ, CR - 1], [CQ + 1, CR]], profil, turns: 12 });
  const c = K(CQ, CR);
  const a = idx(log, 'farma', c), b = idx(log, 'bydlo', c), irr = idx(log, 'irygacja', c);
  ok(a >= 0 && b > a && irr > b, `[${profil}] centrum miasta (zwykly heks, bez lasu): farma(${a}) < bydlo(${b}) < irygacja(${irr})`);
  // tartak nie kwalifikuje sie bez lasu — bez osobnego zakazu dla centrum
  const map2 = makeMap({ forest: [[CQ + 1, CR]] });
  const z = sim({ map: map2, worked: [[CQ + 1, CR]], profil, turns: 8, deficitFn: () => ['drewno'] });
  ok(!z.log.some(e => e.hk === c && (e.key === 'tartak' || e.key === 'oboz_lowiecki')),
    `[${profil}] centrum BEZ lasu: tartak/oboz sie nie kwalifikuje (jest kandydatem tylko na zwyklych zasadach)`);
}

console.log('(i2) [K3] cykl niedobor -> surowiec NA PRZOD -> zaspokojenie -> powrot do zywnosci (ta sama logika co K2)');
{
  const run = profil => {
    const map = makeMap({ river: RIVER, hills: [[11, 11]] });
    const deficitFn = (t, placed) => {
      const has = (placed.get('11,11') ?? []).includes('kamieniolom');
      const kamien = (has ? 100 : 0) - (t >= 12 ? 100 : 0);
      return kamien < 10 ? ['kamien'] : [];
    };
    return sim({ map, worked: WORKED_ALL, profil, turns: 20, deficitFn, techsByTurn: () => FULL });
  };
  const k2 = run('K2'), k3 = run('K3');
  ok(k3.log[0] && k3.log[0].key === 'kamieniolom' && k3.log[0].t === 0, `[K3] niedobor w t0 -> kamieniolom PRZED zywnoscia (${k3.log.slice(0, 2).map(e => e.key).join(',')})`);
  const po = k3.log.filter(e => e.t >= 1 && e.t < 12);
  ok(po.length > 0 && po.every(e => e.key !== 'kamieniolom') && po.some(e => e.key === 'farma'), '[K3] po zaspokojeniu powrot do zywnosci (farma), zero kamieniolomu');
  // t>=12 (ponowny niedobor, zywnosc wyczerpana): K3 buduje infrastrukture „wszedzie” (ECHO 2026-09-08 zostaje, odp. D),
  // K2 tylko przy obywatelach — porownujemy cykl niedobor->surowiec->zywnosc, czyli t<12 (calosc zywnosci i kamieniolom).
  ok(seqOf(k2.log.filter(e => e.t < 12)) === seqOf(k3.log.filter(e => e.t < 12)), '[K2=K3] cykl niedoboru (t<12): identyczna sekwencja');
}

// ===========================================================================
// R4 (wlasciciel 2026-10-31): „Niedobor ma tylko otwierac ulepszenia brakujacego surowca, nic wiecej.”
//        „Drogi dopiero gdy zaspokojone wszystkie potrzeby zywnosci ORAZ surowcow.”
// ===========================================================================
const ROADS = new Set(['droga', 'droga_brukowana']);
const FOOD_KEYS = new Set(['farma', 'bydlo', 'owce', 'lama', 'tarasy', 'irygacja', 'lodzie_rybackie', 'oboz_lowiecki', 'wyrab']);
const TECH_BEZ_ZYWNOSCI = FULL.filter(t => !['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Żegluga', 'Łowiectwo'].includes(t));
const keysOf = log => [...new Set(log.map(e => e.key))].sort();

console.log('(q) [K2/K3] niedobor drewna, brak miejsc na zywnosc: lista = WYLACZNIE tartak (dopiero potem drogi)');
for (const profil of ['K2', 'K3']) {
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  const map = makeMap({ forest: FOR });
  const { log } = sim({ map, worked: FOR, profil, turns: 12, deficitFn: () => ['drewno'], techsByTurn: () => TECH_BEZ_ZYWNOSCI });
  // `wyrab` = etap E5 (wycinka pod farmy) — to ZYWNOSC, nie „otwarcie listy niedoborem”.
  const obce = log.filter(e => e.key !== 'tartak' && e.key !== 'wyrab' && !ROADS.has(e.key));
  ok(obce.length === 0, `[${profil}] niedobor drewna: rozkazy ⊆ {tartak, wyrab(E5), drogi}; obce klucze: [${keysOf(obce).join(',') || '-'}]`);
  ok(count(log, 'tartak') >= 1, `[${profil}] tartak powstaje (${count(log, 'tartak')})`);
  const lastTartak = Math.max(...log.filter(e => e.key === 'tartak').map(e => e.t));
  const roads = log.filter(e => ROADS.has(e.key));
  ok(roads.every(e => e.t > lastTartak), `[${profil}] drogi (jesli sa) dopiero PO ostatnim tartaku (t=${lastTartak}); pierwsza droga t=${roads[0] ? roads[0].t : '-'}`);
}

console.log('(q2) [K2/K3] niedobor kamien+glina+ruda (z miejscem na kamieniolom): zadnych obcych ulepszen (tartak, warzelnia, stadnina, fort...)');
for (const profil of ['K2', 'K3']) {
  const map = makeMap({ hills: [[11, 11], [13, 11], [12, 13]] });
  const { log } = sim({ map, worked: [[11, 11], [13, 11], [12, 13], [11, 12]], profil, turns: 12,
    deficitFn: () => ['kamien', 'glina', 'ruda'], techsByTurn: () => TECH_BEZ_ZYWNOSCI });
  const dozwolone = new Set(['kamieniolom', 'glinianka', 'kopalnia_miedzi', ...ROADS]);
  const obce = log.filter(e => !dozwolone.has(e.key));
  ok(obce.length === 0, `[${profil}] obce klucze przy niedoborze {kamien,glina,ruda}: [${keysOf(obce).join(',') || '-'}] (== brak)`);
  ok(count(log, 'kamieniolom') >= 1, `[${profil}] kamieniolom powstaje (${count(log, 'kamieniolom')})`);
  ok(count(log, 'tartak') === 0 && count(log, 'warzelnia_soli') === 0 && count(log, 'stadnina') === 0,
    `[${profil}] zero tartaku/warzelni/stadniny (nie sa brakujacym surowcem)`);
}

console.log('(q3) [K2/K3] niedobor zloto/stal/zywnosc (brak ulepszenia terenu) NIC nie otwiera');
for (const profil of ['K2', 'K3']) {
  const mk = () => makeMap({ hills: [[11, 11]] });
  const a = sim({ map: mk(), worked: WORKED_ALL, profil, turns: 20, techsByTurn: () => TECH_BEZ_ZYWNOSCI });
  const b = sim({ map: mk(), worked: WORKED_ALL, profil, turns: 20, deficitFn: () => ['zloto', 'stal', 'zywnosc'], techsByTurn: () => TECH_BEZ_ZYWNOSCI });
  ok(seqOf(a.log) === seqOf(b.log), `[${profil}] niedobor {zloto,stal,zywnosc} == brak niedoboru — nic nie otwiera`);
  ok(count(b.log, 'kopalnia_zlota') === 0, `[${profil}] zloto: zero kopalnia_zlota`);
}

console.log('(r) [K2/K3] fort i posterunek NIGDY z pickera (FAZA 0 zamknieta), nawet przy niedoborach wszystkich surowcow');
for (const profil of ['K2', 'K3']) {
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13]];
  const map = makeMap({ river: RIVER, forest: FOR, hills: [[13, 12]] });
  const { log } = sim({ map, worked: [...WORKED_ALL, ...FOR], profil, turns: 40,
    deficitFn: () => ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'kon', 'zloto'] });
  ok(count(log, 'fort') === 0 && count(log, 'posterunek') === 0, `[${profil}] fort ${count(log, 'fort')}, posterunek ${count(log, 'posterunek')} (== 0)`);
}

console.log('(s) DROGI = najnizszy priorytet K2/K3 (korekta wlasciciela): nigdy przed zywnoscia i surowcami');
for (const profil of ['K2', 'K3']) {
  const FOR = [[14, 12], [11, 13]];
  const map = makeMap({ river: RIVER, forest: FOR });
  const { log } = sim({ map, worked: [...WORKED_ALL, ...FOR], profil, turns: 40 });
  const lastFood = Math.max(...log.filter(e => FOOD_KEYS.has(e.key)).map(e => e.t));
  const roads = log.filter(e => ROADS.has(e.key));
  ok(roads.length > 0, `[${profil}] (b) wszystko zaspokojone: drogi powstaja (${roads.length} szt.)`);
  ok(roads.every(e => e.t > lastFood), `[${profil}] (a) 0 drog przed wyczerpaniem zywnosci: pierwsza droga t=${roads[0] ? roads[0].t : '-'} > ostatnia zywnosc t=${lastFood}`);
  const m2 = makeMap({ river: RIVER });
  const c1 = sim({ map: m2, worked: WORKED_ALL, profil, turns: 30, deficitFn: () => ['zloto', 'kamien'] });
  ok(count(c1.log, 'droga') > 0, `[${profil}] (c) niedobor bez ulepszenia/miejsca ({zloto,kamien} na rownie) NIE blokuje drog w nieskonczonosc (${count(c1.log, 'droga')} droga)`);
}
{
  // (a2) K2: zywnosc CZEKA NA PRACE (irygacja 60 przy rezerwie 30) => zadnych drog w tym czasie
  const map = makeMap({ river: RIVER });
  const placed0 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
  const { log } = sim({ map, worked: WORKED_ALL, profil: 'K2', turns: 8, pool0: 50, income: 8, placed0 });
  const firstIrr = log.findIndex(e => e.key === 'irygacja');
  const roadsBefore = log.slice(0, firstIrr < 0 ? log.length : firstIrr).filter(e => ROADS.has(e.key)).length;
  ok(firstIrr >= 0 && roadsBefore === 0, `[K2] irygacja czeka na Prace (pula 50, +8/ture): 0 drog przed pierwsza irygacja (${roadsBefore}); irygacja w pozycji ${firstIrr}`);
  // (a3) K2: niedobor z MOZLIWYM ulepszeniem (kamieniolom 22 > 50-30), brak zywnosci => drogi (15) czekaja
  const m2 = makeMap({ hills: [[11, 11]] });
  const bez = sim({ map: m2, worked: [[11, 11], [11, 12], [13, 12]], profil: 'K2', turns: 5, pool0: 50, income: 0,
    deficitFn: () => ['kamien'], techsByTurn: () => TECH_BEZ_ZYWNOSCI });
  ok(bez.log.length === 0, `[K2] kamieniolom czeka na Prace (22 > 20 wolnych): 0 rozkazow, w tym 0 drog (${bez.log.length})`);
  const m3 = makeMap({});
  const brak = sim({ map: m3, worked: [[11, 12], [13, 12]], profil: 'K2', turns: 5, pool0: 50, income: 0,
    deficitFn: () => ['kamien'], techsByTurn: () => TECH_BEZ_ZYWNOSCI });
  ok(count(brak.log, 'droga') > 0, `[K2] niedobor kamienia, ale brak heksu pod kamieniolom: drogi ruszaja (${count(brak.log, 'droga')})`);
}

{
  // (a4) K2/K3 ze sciezka „surowce wszedzie” (AI: getResourcePassOnlyWorked=false): brakujacy surowiec ma miejsce
  // POZA obrabianymi heksami, ale czeka na Prace (kamieniolom 22 > 50-30) => drogi (15) czekaja. Uwaga: sama
  // sciezka zapasowa (onlyWorked) tego heksu nie widzi — kroku „niedobor czeka na Prace” pilnuje WYLACZNIE probe niedoboru.
  const mk = pula => {
    const map = makeMap({ hills: [[14, 12]] });
    return pickAutoImprovements({
      cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map, territoryNodes: TN,
      placedImprovements: new Map(), pracaAvailable: pula, unlockedTechs: new Set(TECH_BEZ_ZYWNOSCI),
      pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: true, resourceDeficitKeys: ['kamien'],
      getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => new Set([K(11, 12), K(13, 12)]),
      getResourcePassOnlyWorked: () => false, pracaBudgetPercent: 100, civArchetype: 'grecy', playerEra: 3,
      foodImprovementStages: () => true,
    });
  };
  const czeka = mk(50);
  ok(czeka.length === 0, `[K2/K3] kamieniolom poza obrabianymi czeka na Prace (pula 50, rezerwa 30): 0 rozkazow, w tym 0 drog (${czeka.map(p => p.key).join(',') || '-'})`);
  const staje = mk(80);
  ok(staje.length >= 1 && staje[0].key === 'kamieniolom' && !staje.some(p => ROADS.has(p.key)),
    `[K2/K3] pula 80: kamieniolom (brakujacy surowiec) idzie PIERWSZY, bez drog w tej samej turze (${staje.map(p => p.key).join(',')})`);
}

console.log('(t) [K1] profil „Zywnosc” nie dostaje drog (lista profilu bez zmian)');
{
  const lista = prioritiesForUlepszeniaFocus('zywnosc');
  ok(!lista.includes('droga') && !lista.includes('droga_brukowana'), `[K1] lista profilu bez drog (${lista.join(',')})`);
  const map = makeMap({ river: RIVER });
  const { log } = sim({ map, worked: WORKED_ALL, profil: 'K1', turns: 40, deficitFn: () => ['drewno', 'kamien'] });
  ok(count(log, 'droga') === 0 && count(log, 'droga_brukowana') === 0 && count(log, 'fort') === 0, '[K1] zero drog/fortow (takze przy niedoborach)');
}

console.log('(u) parytet K2 <-> K3 z drogami i niedoborem: ta sama kolejnosc i zestaw budow');
{
  const FOR = [[14, 12], [11, 13]];
  for (const [nazwa, deficitFn, techs] of [
    ['wszystko zaspokojone (zywnosc -> drogi)', () => [], () => FULL],
    ['niedobor drewna, brak zywnosci (tartak -> drogi)', () => ['drewno'], () => TECH_BEZ_ZYWNOSCI],
    ['niedobor {zloto,kamien} bez ulepszenia/miejsca', () => ['zloto', 'kamien'], () => FULL],
  ]) {
    const mk = () => makeMap({ river: RIVER, forest: FOR });
    const worked = [...WORKED_ALL, ...FOR];
    const k2 = sim({ map: mk(), worked, profil: 'K2', turns: 30, deficitFn, techsByTurn: techs });
    const k3 = sim({ map: mk(), worked, profil: 'K3', turns: 30, deficitFn, techsByTurn: techs });
    ok(seqOf(k2.log) === seqOf(k3.log), `[K2=K3] ${nazwa}: identyczna sekwencja (${k2.log.length} rozkazow)`);
    if (seqOf(k2.log) !== seqOf(k3.log)) { console.error('K2: ' + seqOf(k2.log)); console.error('K3: ' + seqOf(k3.log)); }
  }
}

console.log(`\nautoimprove-stages-q1-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
