'use strict';
/**
 * ai2-heks-po-heksie-test.cjs — BRAMKA tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 2).
 *
 * Pinuje trzy rzeczy, ktore runda 2 wnosi do `pickAutoImprovements`
 * (`src/game/auto-improvements.ts`) — wspolnego silnika OBU sciezek:
 * AI GRACZA (auto-ulepszenia EOT, main.ts) i AI CYWILIZACJI (`planCityImprovements`
 * w ai.ts, wolane z `decideAITurn`):
 *
 *   A. petla idzie po HEKSACH, nie po TYPACH — automat domyka heks przed przejsciem
 *      do nastepnego (dawniej: `farma` na wszystkich heksach, potem `bydlo` na wszystkich);
 *   B. heks z rzeka NA heksie jest brany PRZED heksem bez rzeki;
 *   C. na jednym heksie nie powstaje dwa razy to samo ulepszenie (przed straznikiem
 *      `droga` kwalifikowala sie w kolko: 37 drog na jednym heksie w 40 turach).
 *
 * Plus trzy straznikie zakresu, ktore NIE moga byc tautologiami:
 *   D. AI CYWILIZACJI ma nadal `maxItemsPerCity: 1` (ECHO wlasciciela: „Zostaw limit,
 *      zmien kolejnosc") — sprawdzane DWOMA niezaleznymi sposobami: tekstem `ai.ts`
 *      ORAZ zachowaniem `decideAITurn` (max 1 rozkaz buildImprovement na miasto na ture);
 *   E. AI CYWILIZACJI faktycznie buduje `tartak` (przed runda 2: 0 na 183 kwalifikujacych
 *      sie heksach) — pomiar zachowania przez `decideAITurn`, nie regex;
 *   F. straznik tekstowy `main.ts`: konfiguracja wywolania pickera na sciezce AI GRACZA
 *      (skipWyrab / budzet / focus / onlyWorked) — pomiar rundy 2 odtwarza ta konfiguracje
 *      w harnessie, wiec jej cicha zmiana uniewazniłaby liczby raportu.
 *
 * Run z gra/:  node tools/ai2-heks-po-heksie-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.AI2_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.ai2-heks-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai2-heks-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { pickAutoImprovements, AI_IMPROVEMENT_PRIORITY, ZERO_YIELD_IMPROVEMENTS, JEDEN_NA_ILU_OBYWATELI } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'warning',
});
const M = require(BUNDLE);

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); } }

// --- fikstury --------------------------------------------------------------
function makeMap(w, h, { nakladka = 'brak', riverAt = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka, ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  const riverPaths = riverAt.length ? [riverAt.map(([q, r]) => ({ q, r }))] : [];
  for (const [q, r] of riverAt) if (hexes[`${q},${r}`]) hexes[`${q},${r}`].rzeka = { obecna: true, krawedzie: [] };
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths };
}
function territory(cx, cy, rad, ownerId, cityId, map) {
  const out = [];
  for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
    if (Math.abs(dq + dr) > rad) continue;
    if (!map.hexes[`${cx + dq},${cy + dr}`]) continue;
    out.push({ q: cx + dq, r: cy + dr, ownerId, cityId, pop: 6, level: 1 });
  }
  return out;
}
const TECHS = new Set(['Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka']);

// ===========================================================================
console.log('A. petla po HEKSACH, nie po TYPACH');
{
  const map = makeMap(12, 12);
  const city = { id: 'c0', ownerId: 0, q: 5, r: 5, population: 6 };
  const picks = M.pickAutoImprovements({
    cities: [city], ownerId: 0, map,
    territoryNodes: territory(5, 5, 3, 0, 'c0', map),
    placedImprovements: new Map(),
    pracaAvailable: 100000, unlockedTechs: TECHS,
    pracaBudgetPercent: 100, maxItemsPerCity: 6, skipWyrab: true, playerEra: 3,
    priorityOverride: M.AI_IMPROVEMENT_PRIORITY.filter(k => k !== 'wyrab'),
  });
  ok(picks.length >= 4, `picker zwrocil >= 4 ulepszenia (jest ${picks.length})`);
  const hexOf = p => `${p.q},${p.r}`;
  // sekwencja heksow nie moze sie POWTARZAC po przerwie: [A,A,B,B] tak, [A,B,A,B] nie
  const seq = picks.map(hexOf);
  const seen = new Set(); let przeplatanie = false; let prev = null;
  for (const h of seq) { if (h !== prev) { if (seen.has(h)) przeplatanie = true; seen.add(h); prev = h; } }
  ok(!przeplatanie, `zaden heks nie wraca po przerwie (sekwencja: ${seq.join(' ')})`);
  ok(seq[0] === seq[1], `pierwsze DWA ulepszenia trafiaja na TEN SAM heks (${seq[0]} vs ${seq[1]})`);
  ok(picks[0].key !== picks[1].key, `... i sa to ROZNE typy (${picks[0].key} / ${picks[1].key}) — czyli domykanie heksa, nie ten sam typ na dwoch heksach`);
}

console.log('B. heks z rzeka ma priorytet przed heksem bez rzeki');
{
  // rzeka daleko od miasta — bez priorytetu rzek tie-break „odleglosc" wybralby heks blizszy
  const map = makeMap(12, 12, { riverAt: [[8, 5]] });
  const city = { id: 'c0', ownerId: 0, q: 5, r: 5, population: 6 };
  const picks = M.pickAutoImprovements({
    cities: [city], ownerId: 0, map,
    territoryNodes: territory(5, 5, 3, 0, 'c0', map),
    placedImprovements: new Map(),
    pracaAvailable: 100000, unlockedTechs: TECHS,
    pracaBudgetPercent: 100, maxItemsPerCity: 1, skipWyrab: true, playerEra: 3,
    priorityOverride: M.AI_IMPROVEMENT_PRIORITY.filter(k => k !== 'wyrab'),
  });
  ok(picks.length === 1, `maxItemsPerCity=1 -> dokladnie 1 pick (jest ${picks.length})`);
  ok(picks[0] && picks[0].q === 8 && picks[0].r === 5,
    `pierwszy pick trafia na heks Z RZEKA (8,5), nie na blizszy heks bez rzeki (jest ${picks[0] ? picks[0].q + ',' + picks[0].r : 'brak'})`);
}

console.log('C. brak duplikatu tego samego ulepszenia na tym samym heksie');
{
  const map = makeMap(12, 12);
  const city = { id: 'c0', ownerId: 0, q: 5, r: 5, population: 6 };
  const placed = new Map();
  let dubel = null;
  for (let t = 0; t < 20 && !dubel; t++) {
    const picks = M.pickAutoImprovements({
      cities: [city], ownerId: 0, map,
      territoryNodes: territory(5, 5, 3, 0, 'c0', map),
      placedImprovements: placed,
      pracaAvailable: 100000, unlockedTechs: TECHS,
      pracaBudgetPercent: 100, maxItemsPerCity: 1, skipWyrab: true, playerEra: 3,
      priorityOverride: M.AI_IMPROVEMENT_PRIORITY.filter(k => k !== 'wyrab'),
    });
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      const cur = placed.get(hk) ?? [];
      if (cur.includes(p.key)) dubel = `${p.key}@${hk}`;
      placed.set(hk, [...cur, p.key]);
    }
  }
  ok(dubel === null, `20 tur x maxItemsPerCity=1: zero duplikatow warstwy${dubel ? ' (znaleziony: ' + dubel + ')' : ''}`);
}

console.log('D. AI CYWILIZACJI — limit maxItemsPerCity: 1 NIETKNIETY (ECHO: „Zostaw limit, zmien kolejnosc")');
{
  const aiSrc = fs.readFileSync(path.resolve(SRC, 'game', 'ai.ts'), 'utf8');
  const i = aiSrc.indexOf('function planCityImprovements');
  const blok = i >= 0 ? aiSrc.slice(i, i + 4000) : '';
  ok(/maxItemsPerCity:\s*1\b/.test(blok),
    'ai.ts / planCityImprovements nadal przekazuje `maxItemsPerCity: 1` do pickera');
  ok(/pracaBudgetPercent:\s*100\b/.test(blok),
    'ai.ts / planCityImprovements nadal przekazuje `pracaBudgetPercent: 100`');
  // dowod behawioralny — nie regex
  const map = makeMap(20, 20);
  const cities = [
    { id: 'c0', ownerId: 3, q: 5, r: 5, name: 'A', population: 6 },
    { id: 'c1', ownerId: 3, q: 14, r: 14, name: 'B', population: 6 },
  ];
  const tn = [...territory(5, 5, 3, 3, 'c0', map), ...territory(14, 14, 3, 3, 'c1', map)];
  const cmds = M.decideAITurn(3, [], cities, map, { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
    civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
    territoryNodes: tn, placedImprovements: new Map(), improvementTechs: TECHS,
    pracaAvailable: 100000, civEra: 3,
  }).filter(c => c.type === 'buildImprovement');
  ok(cmds.length === cities.length,
    `decideAITurn: dokladnie 1 ulepszenie na miasto na ture (${cmds.length} rozkazow przy ${cities.length} miastach)`);
}

console.log('E. AI CYWILIZACJI buduje TARTAK (przed runda 2: 0 na wszystkich ziarnach)');
{
  const map = makeMap(14, 14, { nakladka: 'las' });
  const cities = [{ id: 'c0', ownerId: 3, q: 6, r: 6, name: 'A', population: 6 }];
  const tn = territory(6, 6, 3, 3, 'c0', map);
  const placed = new Map();
  let tartaki = 0;
  for (let t = 0; t < 12; t++) {
    const cmds = M.decideAITurn(3, [], cities, map, { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes: tn, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3,
    }).filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      if (c.key === 'tartak') tartaki++;
      if (c.key === 'wyrab') { map.hexes[`${c.q},${c.r}`].nakladka = 'brak'; continue; }
      const hk = `${c.q},${c.r}`;
      placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
    }
  }
  ok(tartaki > 0, `AI cywilizacji postawilo tartak w 12 turach na mapie lesnej (${tartaki} szt.)`);
}

console.log('F. straznik tekstowy main.ts — konfiguracja wywolania pickera na sciezce AI GRACZA');
{
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const i = mainSrc.indexOf('const picks = pickAutoImprovements({');
  const blok = i >= 0 ? mainSrc.slice(i, i + 2500) : '';
  ok(i >= 0, 'main.ts zawiera wywolanie `pickAutoImprovements` auto-ulepszen gracza');
  ok(/skipWyrab:\s*true/.test(blok), 'main.ts (AI GRACZA): `skipWyrab: true` — gracz nie karczuje automatem');
  ok(/pracaBudgetPercent:\s*playerUlepszeniaPolicy\.pracaAutoPercent/.test(blok),
    'main.ts (AI GRACZA): budzet z polityki gracza (`pracaAutoPercent`), nie 100%');
  ok(/getFocus:/.test(blok) && /getOnlyWorked:/.test(blok),
    'main.ts (AI GRACZA): profil (`getFocus`) i filtr obrabianych heksow (`getOnlyWorked`) nadal przekazywane');
  ok(!/maxItemsPerCity/.test(blok),
    'main.ts (AI GRACZA): brak `maxItemsPerCity` — throttle 1/ture jest WYLACZNIE mechanizmem AI cywilizacji');
}

// ===========================================================================
// RUNDA 3 — wariant W-B (decyzja wlasciciela „domykaj tylko to, co daje plon")
//           oraz wyrab na heksach rzeka+las (GOAL tematu).
// ===========================================================================

console.log('G. W-B: zbior ulepszen ZEROPLONOWYCH policzony Z DANYCH, nie z listy w kodzie');
{
  // Nietautologicznosc: test NIE czyta stalej i nie porownuje jej z ta sama stala —
  // liczy delte tileYield dla KAZDEGO klucza z AI_IMPROVEMENT_PRIORITY na czterech
  // roznych heksach (laka/rownina, z rzeka i bez, pod lasem i bez) i buduje zbior kluczy
  // o delcie 0/0/0/0 WSZEDZIE. Ten zbior musi byc DOKLADNIE rowny ZERO_YIELD_IMPROVEMENTS.
  const bazy = [
    { terenBazowy: 'laka', nakladka: 'brak', maRzeke: false },
    { terenBazowy: 'laka', nakladka: 'brak', maRzeke: true },
    { terenBazowy: 'rownina', nakladka: 'las', maRzeke: false },
    { terenBazowy: 'wzgorza', nakladka: 'brak', maRzeke: true },
  ];
  const zeroweZDanych = new Set();
  for (const key of M.AI_IMPROVEMENT_PRIORITY) {
    if (key === 'wyrab') continue; // wyrab to akcja (usuwa las), nie warstwa plonowa heksa
    let wszedzieZero = true;
    for (const b of bazy) {
      const bez = M.tileYield({ ...b, zloze: null, ulepszeniaKeys: [] });
      const z = M.tileYield({ ...b, zloze: null, ulepszeniaKeys: [key] });
      const d = ['zywnosc', 'praca', 'handel', 'drewno']
        .reduce((n, k) => n + Math.abs((z[k] || 0) - (bez[k] || 0)), 0);
      if (d !== 0) { wszedzieZero = false; break; }
    }
    if (wszedzieZero) zeroweZDanych.add(key);
  }
  const wStalej = [...M.ZERO_YIELD_IMPROVEMENTS].sort().join(',');
  const wDanych = [...zeroweZDanych].sort().join(',');
  ok(wDanych.length > 0, `dane plonow daja niepusty zbior kluczy zeroplonowych (${wDanych || 'PUSTY'})`);
  ok(wStalej === wDanych,
    `ZERO_YIELD_IMPROVEMENTS = zbior policzony z tileYield (stala: [${wStalej}] vs dane: [${wDanych}])`);
}

console.log('H. W-B: posterunek/fort NIE domykaja heksa i maja pulap ceil(pop/10) na miasto');
{
  const map = makeMap(14, 14);
  const city = { id: 'c0', ownerId: 0, q: 6, r: 6, population: 6 };
  // obrona rusza dopiero po `population` ulepszeniach PLONOWYCH miasta (patrz
  // `plonoweWPromieniu` w pickerze) — odtwarzamy ten stan wprost, zamiast przebiegac
  // 6 tur: to samo wejscie, ktore dostalby picker w turze 7.
  const placedH = new Map([
    ['5,6', ['farma']], ['6,5', ['farma']], ['7,6', ['farma']],
    ['6,7', ['farma']], ['5,7', ['farma']], ['7,5', ['farma']],
  ]);
  const picks = M.pickAutoImprovements({
    cities: [city], ownerId: 0, map,
    territoryNodes: territory(6, 6, 3, 0, 'c0', map),
    placedImprovements: placedH,
    pracaAvailable: 100000, unlockedTechs: TECHS,
    pracaBudgetPercent: 100, maxItemsPerCity: 14, skipWyrab: true, playerEra: 3,
    priorityOverride: M.AI_IMPROVEMENT_PRIORITY.filter(k => k !== 'wyrab'),
  });
  const cap = Math.max(1, Math.ceil(city.population / M.JEDEN_NA_ILU_OBYWATELI));
  const zerowe = picks.filter(p => M.ZERO_YIELD_IMPROVEMENTS.has(p.key));
  const plonowe = picks.filter(p => !M.ZERO_YIELD_IMPROVEMENTS.has(p.key));
  ok(zerowe.length > 0 && zerowe.length <= 2 * cap,
    `ulepszen zeroplonowych 1..${2 * cap} na miasto (jest ${zerowe.length}: ${zerowe.map(p => p.key).join(',')})`);
  for (const k of M.ZERO_YIELD_IMPROVEMENTS) {
    ok(picks.filter(p => p.key === k).length <= cap,
      `pulap ceil(pop/${M.JEDEN_NA_ILU_OBYWATELI})=${cap} dotrzymany dla ${k} (jest ${picks.filter(p => p.key === k).length})`);
  }
  // heks, ktory automat DOMYKA plonowo, nie dostaje ulepszenia zeroplonowego
  const hexOf = p => `${p.q},${p.r}`;
  const heksDomykany = plonowe.length ? hexOf(plonowe[0]) : null;
  ok(heksDomykany !== null && !zerowe.some(p => hexOf(p) === heksDomykany),
    `heks domykany plonowo (${heksDomykany}) nie dostal posterunku ani fortu`);
  // obrona stoi na GRANICY zasiegu miasta, nie w srodku
  const dist = p => (Math.abs(p.q - city.q) + Math.abs(p.r - city.r) + Math.abs((p.q - city.q) + (p.r - city.r))) / 2;
  const najdalszyPlonowy = plonowe.length ? Math.max(...plonowe.map(dist)) : 0;
  ok(zerowe.length > 0 && zerowe.every(p => dist(p) >= najdalszyPlonowy),
    `obrona stoi na GRANICY zasiegu miasta — dalej (${zerowe.map(dist).join(',') || 'brak'}) niz najdalsza praca na plon (${najdalszyPlonowy})`);
}

console.log('I. WYRAB: AI CYWILIZACJI faktycznie wycina las na heksie z rzeka (GOAL tematu)');
{
  const map = makeMap(16, 16, { nakladka: 'las', riverAt: [[7, 5], [7, 6], [7, 7], [7, 8]] });
  const cities = [{ id: 'c0', ownerId: 3, q: 7, r: 7, name: 'A', population: 6 }];
  const tn = territory(7, 7, 3, 3, 'c0', map);
  const placed = new Map();
  const rzeki = new Set(['7,5', '7,6', '7,7', '7,8']);
  const slad = [];
  for (let t = 0; t < 30; t++) {
    const cmds = M.decideAITurn(3, [], cities, map, { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } }, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes: tn, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3,
    }).filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      slad.push({ t, hk, key: c.key });
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
    }
  }
  const wyreby = slad.filter(e => e.key === 'wyrab');
  ok(wyreby.length > 0, `decideAITurn wydal rozkaz \`wyrab\` w 30 turach (${wyreby.length} szt.)`);
  ok(wyreby.length > 0 && rzeki.has(wyreby[0].hk),
    `PIERWSZY wyrab trafia na heks Z RZEKA (${wyreby.length ? wyreby[0].hk : 'brak'})`);
  // J — farma PO wyrebie na tym samym heksie
  const wyrabTura = new Map();
  for (const e of wyreby) if (!wyrabTura.has(e.hk)) wyrabTura.set(e.hk, e.t);
  const farmyPo = slad.filter(e => e.key === 'farma' && wyrabTura.has(e.hk) && e.t > wyrabTura.get(e.hk));
  ok(farmyPo.length > 0,
    `farma powstaje PO wyrebie na tym samym heksie (${farmyPo.length} szt., np. ${farmyPo.length ? farmyPo[0].hk + ' @t' + farmyPo[0].t : '-'})`);
  // minimum lesne miasta: tartak i oboz nadal powstaja mimo wycinki
  const tartaki = slad.filter(e => e.key === 'tartak').length;
  const obozy = slad.filter(e => e.key === 'oboz_lowiecki').length;
  ok(tartaki > 0 && obozy > 0,
    `minimum lesne miasta dotrzymane mimo wycinki: tartak ${tartaki}, oboz ${obozy}`);
  // heks z tartakiem/obozem nigdy nie idzie pod topor
  const zTartakiem = new Set(slad.filter(e => e.key === 'tartak' || e.key === 'oboz_lowiecki').map(e => e.hk));
  ok(!wyreby.some(e => zTartakiem.has(e.hk)),
    'zaden heks z tartakiem albo obozem nie zostal wyciety');
  // K — obrona nadal powstaje przez decideAITurn, w granicach pulapu
  const post = slad.filter(e => e.key === 'posterunek').length;
  const fort = slad.filter(e => e.key === 'fort').length;
  const cap = Math.max(1, Math.ceil(6 / M.JEDEN_NA_ILU_OBYWATELI));
  ok(post > 0 && fort > 0, `posterunek i fort NADAL powstaja poza sekwencja domykania (posterunek ${post}, fort ${fort})`);
  ok(post <= cap && fort <= cap, `... i nie przekraczaja pulapu ${cap} na miasto`);
}

console.log('L. sciezka AI GRACZA: silnik wycinki jest WSPOLNY — blokuje ja wylacznie `skipWyrab` z main.ts');
{
  const map = makeMap(14, 14, { nakladka: 'las', riverAt: [[6, 5], [6, 6], [6, 7]] });
  const city = { id: 'c0', ownerId: 0, q: 6, r: 6, population: 6, ulepszeniaFocus: 'zrownowazone' };
  const wspolne = {
    cities: [city], ownerId: 0, map,
    territoryNodes: territory(6, 6, 3, 0, 'c0', map),
    pracaAvailable: 100000, unlockedTechs: TECHS,
    pracaBudgetPercent: 100, maxItemsPerCity: 40, playerEra: 3,
  };
  const placed = new Map([['6,6', ['tartak']], ['6,5', ['oboz_lowiecki']]]);
  const zSkip = M.pickAutoImprovements({ ...wspolne, placedImprovements: new Map(placed), skipWyrab: true });
  const bezSkip = M.pickAutoImprovements({ ...wspolne, placedImprovements: new Map(placed), skipWyrab: false });
  ok(zSkip.every(p => p.key !== 'wyrab'),
    `skipWyrab: true (konfiguracja main.ts) -> zero wyrebow (${zSkip.filter(p => p.key === 'wyrab').length})`);
  ok(bezSkip.some(p => p.key === 'wyrab'),
    `ten sam picker przy skipWyrab: false -> wyrab jest (${bezSkip.filter(p => p.key === 'wyrab').length} szt.)`);
}

console.log(`\nai2-heks-po-heksie-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
