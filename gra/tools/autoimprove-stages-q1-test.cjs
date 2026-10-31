'use strict';

/**
 * R-WEB-AUTOIMPROVE-STAGES2-Q1 (2026-10-31, decyzje wlasciciela, WIAZACE — nadpisuja czesc oczekiwan R5):
 *   B$ budzet SZTYWNO: procent budzetu Pracy gracza (K1/K2) to TWARDY SUFIT, bez wyjatkow (Q2=B z R3 i D-R5-3 ODWOLANE);
 *       AI cywilizacji i panstwa-miasta = 100% puli, bez limitu %;
 *   D-R5-1: farma ma pierwszenstwo na lesie pod farme; tartak (niedobor) tylko na lesie, gdzie farma niemozliwa;
 *   D-R5-2: tartak/oboz NIGDY na heksie rzeka+las — we wszystkich profilach automatu;
 *   W$ przycisk „Wolno wycinac las”: gracz OFF => automat NIE wycina nigdzie (takze przy rzece); AI/panstwa-miasta bez przycisku.
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
fs.writeFileSync(entry, `export { pickAutoImprovements, prioritiesForUlepszeniaFocus } from ${JSON.stringify(SRC + '/game/auto-improvements')};\nexport { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};\nexport { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, prioritiesForUlepszeniaFocus, decideAITurn, getImprovementMeta } = require(bundle);

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
  const turnSpend = [];
  for (let t = 0; t < turns; t++) {
    const poolEntry = pool;
    let spent = 0;
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
      spent += p.kosztPraca;
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    turnSpend.push({ t, poolEntry, spent });
    pool += income;
  }
  return { log, placed, turnSpend, pool };
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

console.log('(c3) [K1/K2] wolno wycinac las = OFF (decyzja wlasciciela 2026-10-31): ZERO wycinek — takze przy rzece (krok 0 / E2)');
for (const profil of ['K1', 'K2']) {
  const map = makeMap({ river: RIVER, forest: [...RIVER, [14, 12], [11, 13]] });
  const { log } = sim({ map, worked: [...WORKED_ALL, [14, 12], [11, 13]], profil, turns: 30, wolnoWycinac: false });
  ok(count(log, 'wyrab') === 0, `[${profil}] OFF: 0 wycinek (rzeka + poza rzeka), jest ${count(log, 'wyrab')}`);
  ok(RIVER.every(([q, r]) => idx(log, 'wyrab', K(q, r)) < 0), `[${profil}] OFF: brak wyrebu na rzece (dawny pin c3: 2 wycinki — poprawiony decyzja wlasciciela)`);
  ok(RIVER.every(([q, r]) => map.hexes[K(q, r)].nakladka === 'las'), `[${profil}] OFF: las przy rzece nietkniety`);
  const on = makeMap({ river: RIVER, forest: [...RIVER, [14, 12], [11, 13]] });
  const r2 = sim({ map: on, worked: [...WORKED_ALL, [14, 12], [11, 13]], profil, turns: 30, wolnoWycinac: true });
  ok(count(r2.log, 'wyrab') >= 3 && count(r2.log, 'farma') >= 3, `[${profil}] ON: wycinka pod farmy dziala (wyrab ${count(r2.log, 'wyrab')}, farma ${count(r2.log, 'farma')})`);
}
console.log('(c3b) override miasta (getSkipWyrab) i AI: przycisk dotyczy tylko gracza');
{
  const mkSim = (flagFn, skipWyrab) => {
    const map = makeMap({ river: RIVER, forest: [...RIVER, [14, 12]] });
    const placed = new Map();
    const picks = [];
    for (let t = 0; t < 6; t++) {
      const ps = pickAutoImprovements({
        cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map, territoryNodes: TN, placedImprovements: placed,
        pracaAvailable: 5000, unlockedTechs: new Set(FULL), pracaSurplusThreshold: 30, skipWyrab,
        ...(flagFn ? { getSkipWyrab: flagFn } : {}),
        demandDriven: true, resourceDeficitKeys: [], getFocus: () => 'zrownowazone', getOnlyWorked: () => true,
        getWorkedHexKeys: () => new Set([...WORKED_ALL, [14, 12]].map(([q, r]) => K(q, r))), pracaBudgetPercent: 100,
        civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
      });
      for (const p of ps) { picks.push(p); if (p.key === 'wyrab') map.hexes[K(p.q, p.r)].nakladka = 'brak'; else placed.set(K(p.q, p.r), [...(placed.get(K(p.q, p.r)) ?? []), p.key]); }
    }
    return picks.filter(p => p.key === 'wyrab').length;
  };
  ok(mkSim(() => true, false) === 0, '[K2] override miasta OFF (getSkipWyrab=true) przy skipWyrab=false: 0 wycinek (przycisk miasta wygrywa)');
  ok(mkSim(() => false, true) >= 3, '[K2] override miasta ON (getSkipWyrab=false) przy skipWyrab=true: wycinka dziala');
  ok(mkSim(undefined, true) === 0, '[K2] skipWyrab=true bez override: 0 wycinek (takze przy rzece)');
  const aiSrc = fs.readFileSync(path.resolve(SRC, 'game/ai.ts'), 'utf8');
  ok(!/wolnoWycinacLas/.test(aiSrc) && !/getSkipWyrab/.test(aiSrc), '[K3] ai.ts nie czyta flagi gracza (`wolnoWycinacLas`/`getSkipWyrab`) — AI przycisku nie ma');
  const k3 = sim({ map: makeMap({ river: RIVER, forest: [...RIVER, [14, 12]] }), worked: [...WORKED_ALL, [14, 12]], profil: 'K3', turns: 30, wolnoWycinac: false });
  ok(count(k3.log, 'wyrab') >= 3, `[K3] AI wycina niezaleznie od flagi gracza (wolnoWycinac=false w symulacji nie dotyczy AI): wyrab ${count(k3.log, 'wyrab')}`);
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

console.log('(h) BUDZET SZTYWNO (wlasciciel 2026-10-31): koszt > budzet => 0 budowy, pula sie KUMULUJE, po kilku turach budowa startuje');
for (const profil of ['K1', 'K2']) {
  // 20% puli 200 = 40 < koszt irygacji 60 — BEZ wyjatku od limitu: irygacja NIE powstaje; pula rosnie; procent liczony od skumulowanej puli.
  const m0 = makeMap({ river: RIVER });
  const placed0 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
  const r0 = sim({ map: m0, worked: WORKED_ALL, profil, turns: 6, pool0: 200, income: 0, pct: 20, placed0 });
  ok(count(r0.log, 'irygacja') === 0 && r0.log.length === 0, `[${profil}] limit 20% (40 < 60), bez przychodu: 0 budow, pula nietknieta (${r0.log.length} szt., pula ${r0.pool})`);
  const m1 = makeMap({ river: RIVER });
  const r1 = sim({ map: m1, worked: WORKED_ALL, profil, turns: 12, pool0: 200, income: 60, pct: 20, placed0 });
  const firstIrr = r1.log.findIndex(e => e.key === 'irygacja');
  const tIrr = firstIrr < 0 ? -1 : r1.log[firstIrr].t;
  const poolAtFirst = tIrr < 0 ? 0 : r1.turnSpend[tIrr].poolEntry;
  ok(tIrr >= 2 && poolAtFirst * 20 >= 60 * 100, `[${profil}] pula kumuluje sie 200->...: irygacja startuje w t=${tIrr} przy puli ${poolAtFirst} (20% >= 60), nie wczesniej`);
  ok(r1.turnSpend.slice(0, Math.max(0, tIrr)).every(x => x.spent === 0), `[${profil}] w turach przed startem irygacji wydatek == 0 (pula sie odklada, zadnych tanszych „zapchajdziur”)`);
  ok(r1.turnSpend.every(x => x.spent * 100 <= 20 * x.poolEntry), `[${profil}] kazda tura: wydatek <= 20% skumulowanej puli (tolerancja 0)`);
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

console.log('(k2) [K2/K3] R5 + D-R5-1: BRAK LIMITU tartakow przy niedoborze drewna (lasy na Wzgorzach — farma tam niemozliwa)');
{
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  for (const profil of ['K2', 'K3']) {
    // niedobor TRWA: tartak na KAZDYM dostepnym lesie (6), nie ceil(pop/10)=2.
    const { log } = sim({ map: makeMap({ forest: FOR, hills: FOR }), worked: FOR, profil, turns: 30, deficitFn: () => ['drewno'] });
    ok(count(log, 'tartak') === FOR.length, `[${profil}] R5 niedobor drewna trwa: tartaki ${count(log, 'tartak')} == ${FOR.length} (wszystkie lasy; bez ceil(pop/10)=${Math.ceil(CITY.population / 10)})`);
    ok(FOR.every(([q, r]) => idx(log, 'tartak', K(q, r)) >= 0), `[${profil}] R5 tartak na kazdym z ${FOR.length} lasow bez rzeki`);
    // niedobor ZASPOKOJONY (tylko t<2): po zaspokojeniu zadnych nowych tartakow, wraca zywnosc/wyrab.
    const k = sim({ map: makeMap({ forest: FOR, hills: FOR }), worked: FOR, profil, turns: 30, deficitFn: t => (t < 2 ? ['drewno'] : []) });
    ok(k.log.filter(e => e.key === 'tartak').every(e => e.t < 2) && count(k.log, 'tartak') === FOR.length,
      `[${profil}] R5 niedobor zaspokojony (t>=2): tartaki ${count(k.log, 'tartak')} powstaly tylko w oknie niedoboru`);
    // BEZ niedoboru: zero tartakow (ABC-B=B bez zmian).
    const b = sim({ map: makeMap({ forest: FOR, hills: FOR }), worked: FOR, profil, turns: 30 });
    ok(count(b.log, 'tartak') === 0, `[${profil}] R5 bez niedoboru: tartaki ${count(b.log, 'tartak')} == 0`);
  }
}

console.log('(r5-river) [K2/K3] R5: tartak/obóz NIE na heksie rzeka+las (zarezerwowany pod wycinke i farme); tartak tylko na lesie BEZ rzeki');
{
  const FOR = [[14, 12], [11, 11], [13, 11]];
  for (const profil of ['K2', 'K3']) {
    const map = makeMap({ river: RIVER, forest: [...RIVER, ...FOR], hills: FOR });
    const { log } = sim({ map, worked: [...WORKED_ALL, ...FOR], profil, turns: 40, deficitFn: () => ['drewno'] });
    const naRzece = log.filter(e => (e.key === 'tartak' || e.key === 'oboz_lowiecki') && RIVER.some(([q, r]) => K(q, r) === e.hk));
    ok(naRzece.length === 0, `[${profil}] R5 niedobor drewna: 0 tartakow/obozow na rzece+las (${naRzece.map(e => e.key + '@' + e.hk).join(',') || '-'})`);
    ok(FOR.every(([q, r]) => idx(log, 'tartak', K(q, r)) >= 0), `[${profil}] R5 tartak POWSTAJE na lesie bez rzeki (${FOR.length}/${FOR.length})`);
    ok(RIVER.every(([q, r]) => idx(log, 'wyrab', K(q, r)) >= 0 && idx(log, 'farma', K(q, r)) > idx(log, 'wyrab', K(q, r))),
      `[${profil}] R5 heks rzeka+las dostaje wyrab -> farma (nie tartak)`);
    // wylacznie lasy z rzeka, niedobor trwa: tartak NIE powstaje (niedobor zostaje), farma/wycinka idzie dalej.
    const only = sim({ map: makeMap({ river: RIVER, forest: RIVER }), worked: WORKED_ALL, profil, turns: 40, deficitFn: () => ['drewno'] });
    ok(count(only.log, 'tartak') === 0 && count(only.log, 'oboz_lowiecki') === 0, `[${profil}] R5 tylko lasy z rzeka + niedobor drewna: tartak 0 (niedobor zostaje), obozy 0`);
    ok(count(only.log, 'wyrab') === RIVER.length && count(only.log, 'farma') >= RIVER.length, `[${profil}] R5 ... a wyrab (${count(only.log, 'wyrab')}) i farmy (${count(only.log, 'farma')}) ida normalnie`);
  }
}

console.log('(r5-wyrab) [K1/K2/K3] R5: wycinka TYLKO pod farmy (Laka/Rownina), nigdy las na Wzgorzach; heks z tartakiem nie jest wycinany');
{
  const FLATF = [[14, 12], [11, 13]];
  const HILLF = [[11, 11], [13, 11]];
  for (const profil of ['K1', 'K2', 'K3']) {
    const map = makeMap({ forest: [...FLATF, ...HILLF], hills: HILLF });
    const { log } = sim({ map, worked: [...WORKED_ALL, ...FLATF, ...HILLF], profil, turns: 40 });
    ok(FLATF.every(([q, r]) => idx(log, 'wyrab', K(q, r)) >= 0 && idx(log, 'farma', K(q, r)) > idx(log, 'wyrab', K(q, r))),
      `[${profil}] R5 las na rowninie pod farme: wyrab -> farma`);
    ok(HILLF.every(([q, r]) => idx(log, 'wyrab', K(q, r)) < 0), `[${profil}] R5 las na Wzgorzach NIE jest wycinany (farma tam niemozliwa — wyrab nie na zapas)`);
    ok(HILLF.every(([q, r]) => map.hexes[K(q, r)].nakladka === 'las'), `[${profil}] R5 las na Wzgorzach nietkniety`);
  }
  // rzeka + las na Wzgorzach: ani wyrab, ani tartak (K2/K3), a nie blokuje wyrebu poza rzeka.
  for (const profil of ['K2', 'K3']) {
    const map = makeMap({ river: RIVER, forest: [[12, 9], [14, 12]], hills: [[12, 9], [14, 12]] });
    const placed0 = new Map([[K(12, 10), ['farma', 'bydlo', 'irygacja']], [K(13, 10), ['farma', 'bydlo', 'irygacja']]]);
    const { log } = sim({ map, worked: [...WORKED_ALL, [14, 12]], profil, turns: 30, placed0, deficitFn: () => ['drewno'] });
    ok(idx(log, 'wyrab', '12,9') < 0 && idx(log, 'tartak', '12,9') < 0, `[${profil}] R5 rzeka+las na Wzgorzach: zero wyrebu i zero tartaku`);
    ok(idx(log, 'tartak', '14,12') >= 0, `[${profil}] R5 niedobor drewna: tartak na lesie bez rzeki 14,12 (Wzgorza — farma niemozliwa)`);
  }
}

console.log('(r5-drogi) [K2/K3] R5: drogi dopiero gdy NIE MA kandydata dla zywnosci ani dla brakujacego surowca (bez limitu)');
{
  const FOR = [[14, 12], [11, 11], [13, 11], [11, 13], [12, 13], [13, 12]];
  for (const profil of ['K2', 'K3']) {
    const { log } = sim({ map: makeMap({ forest: FOR, hills: FOR }), worked: FOR, profil, turns: 30, deficitFn: () => ['drewno'] });
    const roads = log.filter(e => e.key === 'droga' || e.key === 'droga_brukowana');
    const rest = log.filter(e => !(e.key === 'droga' || e.key === 'droga_brukowana'));
    const lastRest = Math.max(...rest.map(e => e.t));
    ok(roads.length > 0, `[${profil}] R5 po zbudowaniu tartakow na wszystkich lasach drogi startuja (${roads.length})`);
    ok(roads.every(e => e.t > lastRest), `[${profil}] R5 zadna droga przed ostatnim tartakiem/zywnoscia (droga najwczesniej t=${Math.min(...roads.map(e => e.t))} > ostatnie nie-drogi t=${lastRest})`);
    ok(count(log, 'tartak') === FOR.length, `[${profil}] R5 tartakow ${count(log, 'tartak')} == ${FOR.length} PRZED drogami (brak limitu => drogi nie startuja po „limicie tartakow”)`);
  }
}

console.log('(r5-parytet) [K2=K3] R5: ta sama kolejnosc i zestaw budow przy niedoborze drewna, rzece+lesie i lesie bez rzeki');
{
  const FOR = [[14, 12], [11, 13], [13, 11]];
  const mk = () => makeMap({ river: RIVER, forest: [...RIVER, ...FOR] });
  const worked = [...WORKED_ALL, ...FOR];
  const k2 = sim({ map: mk(), worked, profil: 'K2', turns: 30, deficitFn: () => ['drewno'] });
  const k3 = sim({ map: mk(), worked, profil: 'K3', turns: 30, deficitFn: () => ['drewno'] });
  ok(seqOf(k2.log) === seqOf(k3.log), `[K2=K3] R5 niedobor drewna + rzeka+las: identyczna sekwencja (${k2.log.length} rozkazow)`);
  if (seqOf(k2.log) !== seqOf(k3.log)) { console.error('K2: ' + seqOf(k2.log)); console.error('K3: ' + seqOf(k3.log)); }
}

console.log('(k3) [K2/K3] KOREKTA F: heks CENTRUM z lasem jest ZWYKLYM heksem — brak filtra centrum (zarzut Evaluatora R4 nr 4: asercja zamiast pomiaru)');
{
  // Produkcyjnie centrum nie ma lasu (R-WEB-CITY-CLEARS-FOREST-Q1), wiec fikstura ai2-heks-po-heksie ustawia
  // `nakladka='brak'`; ten przypadek pilnuje, ze PICKER nie ma specjalnego filtra centrum: gdyby las byl,
  // centrum kwalifikuje sie na tych samych zasadach co kazdy inny heks z lasem (przywrocenie filtra -> pada).
  const wyniki = {};
  for (const profil of ['K2', 'K3']) {
    const mapC = makeMap({ forest: [[CQ, CR]], hills: [[CQ, CR]] });
    const { log: logC } = sim({ map: mapC, worked: [[CQ, CR]], profil, turns: 6, deficitFn: () => ['drewno'] });
    const naCentrum = logC.filter(e => e.hk === K(CQ, CR)).map(e => e.key);
    // ten sam las na zwyklym heksie obrabianym (nie-centrum) — referencja
    const mapR = makeMap({ forest: [[CQ + 2, CR]], hills: [[CQ + 2, CR]] });
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
  // D-R5-1: tartak tylko na lesie, gdzie farma niemozliwa (Wzgorza); las na rowninie zostaje wycince+farmie.
  const z = sim({ map: makeMap({ forest: FOR, hills: FOR }), worked: FOR, profil, turns: 30, deficitFn: () => ['drewno'] });
  ok(count(z.log, 'tartak') >= 1, `[${profil}] z niedoborem drewna tartak powstaje na lesie z Wzgorzami (${count(z.log, 'tartak')})`);
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
  const map = makeMap({ forest: FOR, hills: FOR });
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

// ===========================================================================
// R-WEB-AUTOIMPROVE-STAGES2-Q1 — nowe kontrakty (decyzje wlasciciela 2026-10-31)
// ===========================================================================
console.log('(s1) BUDZET SZTYWNO — test globalny: procent 10/33/50/100 x pule x niedobor x K1/K2; suma kosztow WSZYSTKICH pickow w turze <= procent x pula (tolerancja 0)');
{
  const FORP = [[14, 12], [11, 13]];
  const FORH = [[11, 11], [13, 11]];
  let lacznie = 0, naruszen = 0, scen = 0;
  const widziane = new Set();
  for (const profil of ['K1', 'K2']) {
    for (const [nazwaD, deficitFn] of [['bez niedoboru', () => []], ['niedobor drewna+gliny', () => ['drewno', 'glina']]]) {
      for (const pct of [10, 33, 50, 100]) {
        for (const pool0 of [100, 600, 5000]) {
          const map = makeMap({ river: RIVER, forest: [...FORP, ...FORH], hills: [...FORH, [13, 12]] });
          const r = sim({ map, worked: [...WORKED_ALL, ...FORP, ...FORH], profil, turns: 15, pool0, income: 40, pct, civ: 'chinczycy', deficitFn });
          scen++;
          for (const x of r.turnSpend) {
            lacznie += x.spent;
            if (x.spent * 100 > pct * x.poolEntry) {
              naruszen++;
              console.error(`    naruszenie: ${profil} ${nazwaD} pct=${pct} pula0=${pool0} t=${x.t}: wydano ${x.spent} > ${pct}% x ${x.poolEntry}`);
            }
          }
          for (const e of r.log) widziane.add(e.key);
        }
      }
    }
  }
  ok(naruszen === 0, `[K1/K2] ${scen} scenariuszy x 15 tur: 0 naruszen sufitu procentowego (wydano lacznie ${lacznie})`);
  ok(lacznie > 0 && widziane.has('bydlo') && widziane.has('irygacja') && widziane.has('farma') && widziane.has('wyrab'),
    `[K1/K2] test nie jest prozny: wydatek > 0 i powstaly farma/wyrab/bydlo(E3)/irygacja(E4) (${[...widziane].sort().join(',')})`);
  // wprost kluczowy przypadek: irygacja 60 przy 10% puli 400 = 40 — NIE powstaje, nawet z E4 (dawny wyjatek Q2=B)
  for (const profil of ['K1', 'K2']) {
    const placed0 = new Map(RIVER.map(([q, r]) => [K(q, r), ['farma', 'bydlo']]));
    const r = sim({ map: makeMap({ river: RIVER }), worked: WORKED_ALL, profil, turns: 1, pool0: 400, income: 0, pct: 10, placed0 });
    ok(r.log.length === 0, `[${profil}] 10% x 400 = 40 < irygacja 60: 0 budow w turze (dawny wyjatek E4 usuniety), jest ${r.log.length}`);
    const placedF = new Map(RIVER.map(([q, r2]) => [K(q, r2), ['farma']]));
    const r3 = sim({ map: makeMap({ river: RIVER }), worked: WORKED_ALL, profil, turns: 1, pool0: 400, income: 0, pct: 5, placed0: placedF });
    ok(r3.turnSpend[0].spent * 100 <= 5 * 400, `[${profil}] 5% x 400 = 20: wydatek ${r3.turnSpend[0].spent} <= 20 (trzoda E3 w limicie %)`);
  }
  // kilka miast, override jednego miasta WYZSZY niz polityka imperium nie przebija sufitu (Q3=B zostaje)
  {
    const cities = [0, 1].map(i => ({ id: `c${i}`, ownerId: 0, q: 6 + i * 12, r: 12, name: `M${i}`, population: 8, ulepszeniaFocus: 'zrownowazone' }));
    const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: 0, cityId: c.id, pop: 8, level: 1 }));
    const map = makeMap({ river: [[6, 9], [18, 9]] });
    const placed = new Map();
    const worked = new Set(['6,9', '18,9', '5,12', '7,12', '17,12', '19,12']);
    let bad = 0;
    for (let t = 0; t < 12; t++) {
      const pool = 700 + t * 30;
      const picks = pickAutoImprovements({
        cities, ownerId: 0, map, territoryNodes: tn, placedImprovements: placed, pracaAvailable: pool, unlockedTechs: new Set(FULL),
        pracaSurplusThreshold: 30, demandDriven: true, resourceDeficitKeys: [], getFocus: () => 'zrownowazone', getOnlyWorked: () => true,
        getWorkedHexKeys: () => worked, pracaBudgetPercent: 20, getPracaBudgetPercent: c => (c.id === 'c0' ? 80 : 20),
        civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
      });
      const spent = picks.reduce((n, p) => n + p.kosztPraca, 0);
      if (spent * 100 > 20 * pool) bad++;
      for (const p of picks) placed.set(K(p.q, p.r), [...(placed.get(K(p.q, p.r)) ?? []), p.key]);
    }
    ok(bad === 0, '[K2] 2 miasta, override jednego 80% przy polityce 20%: suma <= 20% puli w kazdej z 12 tur');
  }
}

console.log('(s2) AI cywilizacji i PANSTWA-MIASTA: budzet = 100% puli (brak limitu %, brak capu 50%/33%) — pula X => AI wydaje do X');
{
  const farmCost = getImprovementMeta('farma').kosztPraca;
  const aiCmds = (defensiveCopy, pool, worked) => decideAITurn(0, [], [{ ...CITY, okolicaTryb: 'reczny', okolicaReczne: Object.fromEntries(worked.map(([q, r]) => [K(q, r), 1])) }], makeMap({ river: RIVER }),
    { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy, cityBuildings: {}, territoryNodes: TN,
      placedImprovements: new Map(), improvementTechs: new Set(FULL), pracaAvailable: pool, civEra: 3, resourceDeficitKeys: [],
      // BEZ improvementBudgetCap: sciezka awaryjna ai.ts (dawny fallback 50% = MAX_PROCENT_PULI_IMPERIUM) — teraz 100%
    }).filter(c => c.type === 'buildImprovement');
  for (const [nazwa, defensiveCopy] of [['AI cywilizacji', false], ['panstwo-miasto / kopia obronna', true]]) {
    const pool = 3 * farmCost + (defensiveCopy ? 12 : 0); // > 30 (rezerwa wejscia kopii obronnej), 3 farmy = maks. etapu
    const cmds = aiCmds(defensiveCopy, pool, WORKED_ALL);
    const spent = cmds.reduce((n, c) => n + getImprovementMeta(c.key).kosztPraca, 0);
    ok(spent === 3 * farmCost && spent * 100 > 50 * pool, `[${nazwa}] pula ${pool}: wydano ${spent} (3 farmy = ${3 * farmCost}) > 50% puli — brak capu %`);
    const none = aiCmds(defensiveCopy, farmCost - 1, WORKED_ALL);
    ok(none.length === 0, `[${nazwa}] pula ${farmCost - 1} < koszt farmy ${farmCost}: 0 budow`);
  }
  const mkPick = (pct, cap) => pickAutoImprovements({
    cities: [{ ...CITY, ulepszeniaFocus: 'zrownowazone' }], ownerId: 0, map: makeMap({ river: RIVER }), territoryNodes: TN, placedImprovements: new Map(),
    pracaAvailable: 2000, unlockedTechs: new Set(FULL), pracaSurplusThreshold: 0, demandDriven: true, resourceDeficitKeys: [],
    getFocus: () => 'zrownowazone', getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(WORKED_ALL.map(([q, r]) => K(q, r))),
    pracaBudgetPercent: pct, ...(cap !== undefined ? { improvementBudgetCap: cap } : {}), civArchetype: 'grecy', playerEra: 3, foodImprovementStages: () => true,
  }).reduce((n, p) => n + p.kosztPraca, 0);
  ok(mkPick(100, 2000) >= mkPick(33), 'picker: 100% puli >= 33% puli (sanity)');
  ok(mkPick(33) * 100 <= 33 * 2000, 'picker gracza 33%: wydatek <= 33% puli');
}

console.log('(s3) D-R5-1 [K2/K3]: FARMA ma pierwszenstwo na lesie pod farme; tartak (niedobor) tylko na lesie, gdzie farma niemozliwa i NIE na rzece');
{
  const FP = [[14, 12], [11, 13], [13, 13]];   // las na rowninie — nadaje sie pod farme po wycince
  const FH = [[11, 11], [13, 11]];             // las na Wzgorzach — farma niemozliwa
  for (const profil of ['K2', 'K3']) {
    const map = makeMap({ forest: [...FP, ...FH], hills: FH });
    const { log } = sim({ map, worked: [...WORKED_ALL, ...FP, ...FH], profil, turns: 40, deficitFn: () => ['drewno'] });
    ok(FP.every(([q, r]) => idx(log, 'tartak', K(q, r)) < 0), `[${profil}] D-R5-1: ZERO tartakow na lesie pod farme (rownina)`);
    ok(FP.every(([q, r]) => idx(log, 'wyrab', K(q, r)) >= 0 && idx(log, 'farma', K(q, r)) > idx(log, 'wyrab', K(q, r))), `[${profil}] D-R5-1: las pod farme -> wyrab -> farma`);
    ok(FH.every(([q, r]) => idx(log, 'tartak', K(q, r)) >= 0), `[${profil}] D-R5-1: tartak na lesie bez mozliwosci farmy (Wzgorza) ${FH.length}/${FH.length}`);
  }
  // ZALOZENIE: gracz z wycinka WYLACZONA nie dojdzie do farmy na lesie => tartak go nie wyprzedza (inaczej niedobor nierozwiazywalny)
  {
    const map = makeMap({ forest: [...FP, ...FH], hills: FH });
    const { log } = sim({ map, worked: [...WORKED_ALL, ...FP, ...FH], profil: 'K2', turns: 40, deficitFn: () => ['drewno'], wolnoWycinac: false });
    ok(count(log, 'wyrab') === 0 && count(log, 'tartak') === FP.length + FH.length, `[K2] przycisk OFF: wyrab 0, tartak ${count(log, 'tartak')} == ${FP.length + FH.length} (zalozenie: farma niemozliwa bez wycinki)`);
  }
  // ZALOZENIE: las na rowninie POZA obrabianymi heksami (onlyWorked) nie jest „przejety” przez farme
  {
    const FPU = [[14, 12], [13, 13], [15, 12]]; // poza pierscieniem obrabianych heksow
    const map = makeMap({ forest: FPU });
    const { log } = sim({ map, worked: WORKED_ALL, profil: 'K3', turns: 20, deficitFn: () => ['drewno'] });
    ok(count(log, 'tartak') === FPU.length, `[K3] las na rowninie poza heksami obywateli (farma tam nie dojdzie): tartak ${count(log, 'tartak')} == ${FPU.length}`);
  }
  // rzeka + las na Wzgorzach: zero tartaku (D-R5-2) mimo ze farma niemozliwa (D-R5-1)
  for (const profil of ['K2', 'K3']) {
    const map = makeMap({ river: RIVER, forest: RIVER, hills: RIVER });
    const { log } = sim({ map, worked: WORKED_ALL, profil, turns: 20, deficitFn: () => ['drewno'] });
    ok(count(log, 'tartak') === 0 && count(log, 'oboz_lowiecki') === 0, `[${profil}] rzeka+las na Wzgorzach + niedobor: zero tartaku/obozu (D-R5-2)`);
  }
}

console.log('(s4) D-R5-2: tartak i oboz NIGDY na heksie rzeka+las we WSZYSTKICH profilach automatu (takze „surowce”); lasy poza rzeka bez zmian');
{
  const FOR = [[14, 12], [11, 11], [13, 13]];
  const mk = () => makeMap({ river: RIVER, forest: [...RIVER, ...FOR] });
  const worked = [...WORKED_ALL, ...FOR];
  const s = sim({ map: mk(), worked, profil: 'S', turns: 20 });
  const naRzece = s.log.filter(e => (e.key === 'tartak' || e.key === 'oboz_lowiecki') && RIVER.some(([q, r]) => K(q, r) === e.hk));
  ok(naRzece.length === 0, `[S „surowce”] 0 tartakow/obozow na rzece+las (${naRzece.map(e => e.key + '@' + e.hk).join(',') || '-'})`);
  ok(FOR.every(([q, r]) => idx(s.log, 'tartak', K(q, r)) >= 0), `[S „surowce”] tartaki poza rzeka bez zmian (${count(s.log, 'tartak')} szt.)`);
  for (const profil of ['K1', 'K2', 'K3', 'I']) {
    const r = sim({ map: mk(), worked, profil, turns: 25, deficitFn: () => ['drewno'] });
    const bad = r.log.filter(e => (e.key === 'tartak' || e.key === 'oboz_lowiecki') && RIVER.some(([q, r2]) => K(q, r2) === e.hk));
    ok(bad.length === 0, `[${profil}] 0 tartakow/obozow na rzece+las`);
  }
  const picker = fs.readFileSync(path.resolve(SRC, 'game/auto-improvements.ts'), 'utf8');
  ok(!/demandActive\s*&&\s*\(key === 'tartak' \|\| key === 'oboz_lowiecki'\)\s*&&\s*riverHexKeys/.test(picker), 'auto-improvements.ts: zakaz tartak/oboz na rzece nie jest warunkowany `demandActive`');
}

console.log(`\nautoimprove-stages-q1-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
