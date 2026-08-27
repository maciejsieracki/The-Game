'use strict';
/**
 * ai4-popyt-obywatele-test.cjs — BRAMKA tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 4.
 *
 * Pinuje trzy zasady rundy 4 + R4-Q2. Kazda asercja ma byc CZERWONA pod jedna celowana
 * mutacja zrodla — mutacje uruchamia `tools/ai4-mutacje.cjs` (kopiuje `src`, podmienia
 * jeden fragment, odpala te bramke przez AI4_SRC_DIR i raportuje, ktore asercje spadly).
 *
 *   Z1 — budowanie napedzane popytem (AI CYWILIZACJI + AI GRACZA/„zrownowazone");
 *   Z2 — budowa tylko przy obywatelach, z wyjatkiem zloz;
 *   Z3 — nadwyzka: raport pickera + przekierowanie na budynki po stronie silnika;
 *   Q2 — przelacznik „wolno wycinac las" automatu GRACZA (panstwo + miasto, domyslnie OFF).
 *
 * Run z gra/:  node tools/ai4-popyt-obywatele-test.cjs
 * Env: AI4_SRC_DIR (drzewo zrodlowe — do mutacji)
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const SRC = process.env.AI4_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TAG = process.env.AI4_TEST_TAG || 'gate';
const ENTRY = path.resolve(__dirname, `.ai4t-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.ai4t-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export * as AUTO from ${JSON.stringify(SRC + '/game/auto-improvements')};
export * as CITIES from ${JSON.stringify(SRC + '/game/cities')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { splitPraca } from ${JSON.stringify(SRC + '/game/production')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const M = require(BUNDLE);
const AUTO = M.AUTO;
const CITIES = M.CITIES;

let passed = 0, failed = 0;
const redlist = [];
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; redlist.push(msg); console.error('  [FAIL] ' + msg); }
}

// --- fikstury (ten sam ksztalt co bramka rundy 3) ---------------------------
function makeMap(w, h, { nakladka = 'brak', riverAt = [], zloza = {} } = {}) {
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
  for (const [hk, z] of Object.entries(zloza)) {
    if (!hexes[hk]) continue;
    if (z.nakladka) hexes[hk].nakladka = z.nakladka;
    if (z.zloze) hexes[hk].zloze = z.zloze;
    if (z.teren) hexes[hk].terenBazowy = z.teren;
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths };
}
/** WEZLY W KSZTALCIE SILNIKA — jeden na miasto (patrz komentarz w bramce rundy 3). */
function territory(cx, cy, ownerId, cityId, pop = 6) {
  return [{ q: cx, r: cy, ownerId, cityId, pop, level: 1 }];
}
const TECHS = new Set(['Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna',
  'Garncarstwo', 'Murarstwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Jeździectwo', 'Koło',
  'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Drogi brukowane', 'Matematyka']);
const DATA = { units: [], buildings: [], aiParams: {}, terrainYields: { terrain_types: [] } };
const ZYWNOSCIOWE = new Set(['farma', 'bydlo', 'owce', 'lama', 'tarasy', 'oboz_lowiecki', 'lodzie_rybackie', 'irygacja']);

/** Przebieg AI CYWILIZACJI przez PRAWDZIWE wejscie `decideAITurn`. */
function przebiegCiv(map, cities, tn, tury, deficit, rep) {
  const placed = new Map();
  const slad = [];
  for (let t = 0; t < tury; t++) {
    const opts = {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes: tn, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3, resourceDeficitKeys: deficit,
    };
    if (rep) opts.improvementSurplusReport = rep;
    const cmds = M.decideAITurn(3, [], cities, map, DATA, opts)
      .filter(c => c.type === 'buildImprovement');
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      slad.push({ t, hk, key: c.key });
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
    }
  }
  return slad;
}

// ===========================================================================
console.log('Z1. BUDOWANIE NAPEDZANE POPYTEM — AI CYWILIZACJI (decideAITurn)');
{
  const mk = () => {
    const map = makeMap(16, 16, {
      nakladka: 'las',
      zloza: { '9,7': { nakladka: 'brak', zloze: 'glina' }, '5,7': { nakladka: 'brak', zloze: 'sol' } },
    });
    const cities = [{ id: 'c0', ownerId: 3, q: 7, r: 7, name: 'A', population: 6 }];
    return { map, cities, tn: territory(7, 7, 3, 'c0') };
  };
  const a = mk();
  const bezDef = przebiegCiv(a.map, a.cities, a.tn, 20, []);
  const b = mk();
  const zDef = przebiegCiv(b.map, b.cities, b.tn, 20, ['drewno']);

  const nieZywBez = bezDef.filter(e => !ZYWNOSCIOWE.has(e.key) && e.key !== 'wyrab');
  ok(nieZywBez.length === 0,
    `Z1a: BEZ niedoboru ZERO rozkazow poza zywnoscia (poza wyrebem = krok 0 farmy): `
    + `${nieZywBez.length} (${[...new Set(nieZywBez.map(e => e.key))].join(',') || '-'})`);
  ok(bezDef.length > 0, `Z1b: BEZ niedoboru automat i tak buduje (zywnosc): ${bezDef.length} rozkazow`);

  const surowceZ = zDef.filter(e => !ZYWNOSCIOWE.has(e.key) && e.key !== 'wyrab');
  ok(surowceZ.length > 0,
    `Z1c: PRZY niedoborze rozkazy niezywnosciowe SA: ${surowceZ.length} `
    + `(${[...new Set(surowceZ.map(e => e.key))].slice(0, 5).join(',')})`);

  // niedobor TYLKO zywnosci NIE otwiera listy (zywnosc jest wykluczona z testu niedoboru)
  const c = mk();
  const zZywnoscia = przebiegCiv(c.map, c.cities, c.tn, 20, ['zywnosc']);
  const nieZywZyw = zZywnoscia.filter(e => !ZYWNOSCIOWE.has(e.key) && e.key !== 'wyrab');
  ok(nieZywZyw.length === 0,
    `Z1d: niedobor SAMEJ zywnosci NIE otwiera budowy surowcow/infrastruktury (${nieZywZyw.length})`);
  ok(AUTO.hasNonFoodResourceDeficit(['zywnosc']) === false
    && AUTO.hasNonFoodResourceDeficit(['drewno']) === true
    && AUTO.hasNonFoodResourceDeficit([]) === false,
    'Z1e: `hasNonFoodResourceDeficit` — zywnosc nie liczy sie jako niedobor, drewno tak');

  // ta sama tura: niedobor wlaczany w turze 5 daje rozkazy niezywnosciowe JUZ w turze 5
  const d = mk();
  const slad = [];
  {
    const placed = new Map();
    for (let t = 0; t < 12; t++) {
      const cmds = M.decideAITurn(3, [], d.cities, d.map, DATA, {
        civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
        territoryNodes: d.tn, placedImprovements: placed, improvementTechs: TECHS,
        pracaAvailable: 100000, civEra: 3,
        resourceDeficitKeys: t === 5 ? ['glina'] : [],
      }).filter(c => c.type === 'buildImprovement');
      for (const c of cmds) {
        const hk = `${c.q},${c.r}`;
        slad.push({ t, hk, key: c.key });
        if (c.key === 'wyrab') { d.map.hexes[hk].nakladka = 'brak'; continue; }
        placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
      }
    }
  }
  const wT5 = slad.filter(e => e.t === 5 && !ZYWNOSCIOWE.has(e.key) && e.key !== 'wyrab');
  const pozaT5 = slad.filter(e => e.t !== 5 && !ZYWNOSCIOWE.has(e.key) && e.key !== 'wyrab');
  ok(wT5.length > 0, `Z1f: rozkaz niezywnosciowy pojawia sie W TEJ SAMEJ turze co niedobor (t5: ${wT5.map(e => e.key).join(',') || 'brak'})`);
  ok(pozaT5.length === 0, `Z1g: ... i znika, gdy niedobor ustaje (poza t5: ${pozaT5.length})`);
}

console.log('Z1h. TRZY POZOSTALE PROFILE AUTOMATU GRACZA — bez zmiany zachowania');
{
  const wynik = (focus, demandDriven) => {
    // zloza w promieniu, zeby profil „surowce" mial co budowac (bez nich wynik jest pusty
    // po obu stronach i porownanie bylo tautologia)
    const map = makeMap(16, 16, {
      riverAt: [[7, 5], [7, 6]],
      zloza: {
        '9,7': { zloze: 'glina' }, '5,7': { zloze: 'sol' },
        '7,9': { zloze: 'miedz', teren: 'wzgorza' }, '9,5': { nakladka: 'zloze_konia' },
      },
    });
    const city = { id: 'c0', ownerId: 0, q: 7, r: 7, population: 6, ulepszeniaFocus: focus };
    const picks = AUTO.pickAutoImprovements({
      cities: [city], ownerId: 0, map,
      territoryNodes: territory(7, 7, 0, 'c0'),
      placedImprovements: new Map(), pracaAvailable: 100000, unlockedTechs: TECHS,
      pracaBudgetPercent: 100, maxItemsPerCity: 40, skipWyrab: true, playerEra: 3,
      getFocus: c => c.ulepszeniaFocus, getOnlyWorked: () => false,
      demandDriven, resourceDeficitKeys: [],
    });
    return picks.map(p => `${p.key}@${p.q},${p.r}`).join('|');
  };
  for (const f of ['zywnosc', 'surowce', 'infrastruktura']) {
    const bez = wynik(f, false);
    const z = wynik(f, true);
    ok(bez === z && bez.length > 0,
      `Z1h/${f}: identyczny wynik pickera z demandDriven i bez (${bez.split('|').length} pickow)`);
  }
  const zrBez = wynik('zrownowazone', false);
  const zrZ = wynik('zrownowazone', true);
  ok(zrBez !== zrZ, 'Z1i: profil „zrownowazone" JEST objety Zasada 1 (wynik sie rozni)');
}

console.log('Z2. BUDOWA TYLKO PRZY OBYWATELACH — z wyjatkiem zloz');
{
  // Zloze soli daleko od centrum, poza polami obrabianymi; okolica RECZNA = 3 heksy blisko.
  const map = makeMap(16, 16, { zloza: { '12,7': { zloze: 'sol' } } });
  const RECZNE = { '7,5': 1, '7,6': 1, '6,7': 1 };
  const city = {
    id: 'c0', ownerId: 0, q: 7, r: 7, population: 6,
    ulepszeniaFocus: 'zrownowazone', okolicaTryb: 'reczny', okolicaReczne: RECZNE,
  };
  const tn = territory(7, 7, 0, 'c0');
  const worked = new Set(M.workedHexCoordsForCity(city, map, tn).map(({ q, r }) => `${q},${r}`));
  ok(worked.size === 3 && !worked.has('12,7'),
    `Z2a: fikstura — obrabiane sa 3 heksy i NIE nalezy do nich zloze 12,7 (${[...worked].join(' ')})`);

  const picks = AUTO.pickAutoImprovements({
    cities: [city], ownerId: 0, map, territoryNodes: tn,
    placedImprovements: new Map(), pracaAvailable: 1000000, unlockedTechs: TECHS,
    pracaBudgetPercent: 100, maxItemsPerCity: 60, skipWyrab: true, playerEra: 3,
    getFocus: c => c.ulepszeniaFocus,
    getOnlyWorked: () => true,
    getWorkedHexKeys: () => worked,
  });
  const pozaObywatelami = picks.filter(p => !worked.has(`${p.q},${p.r}`));
  const nieZlozowePoza = pozaObywatelami.filter(p => p.key !== 'warzelnia_soli');
  ok(picks.length > 0, `Z2b: picker cos zbudowal (${picks.length})`);
  ok(nieZlozowePoza.length === 0,
    `Z2c: ZERO ulepszen NIE-zlozowych poza polami z obywatelami (${nieZlozowePoza.length}: `
    + `${nieZlozowePoza.map(p => p.key + '@' + p.q + ',' + p.r).slice(0, 4).join(' ')})`);
  ok(pozaObywatelami.some(p => p.key === 'warzelnia_soli' && `${p.q},${p.r}` === '12,7'),
    'Z2d: WYJATEK ZLOZOWY dziala — warzelnia soli powstaje na zlozu 12,7 mimo braku obywateli');

  ok(CITIES.DEFAULT_ULEPSZENIA_ONLY_WORKED === true,
    'Z2e: DEFAULT_ULEPSZENIA_ONLY_WORKED === true (nowa wartosc domyslna rundy 4)');
  ok(CITIES.freshUlepszeniaEmpirePolicy().onlyWorked === true,
    'Z2f: swieza polityka imperium ma onlyWorked === true');
  const pol = CITIES.freshUlepszeniaEmpirePolicy();
  ok(CITIES.resolveEffectiveUlepszenia({ id: 'x', ownerId: 0, q: 0, r: 0, name: 'x', population: 1, ulepszeniaOverride: true }, pol).onlyWorked === true,
    'Z2g: override miasta BEZ pola `ulepszeniaOnlyWorked` czyta sie jako true');
  ok(CITIES.resolveEffectiveUlepszenia({ id: 'x', ownerId: 0, q: 0, r: 0, name: 'x', population: 1, ulepszeniaOverride: true, ulepszeniaOnlyWorked: false }, pol).onlyWorked === false,
    'Z2h: JAWNE `false` w zapisie miasta jest respektowane (nie nadpisujemy wyboru gracza)');
}

console.log('Z2i. AI CYWILIZACJI faktycznie ma wpiety filtr obywateli (decideAITurn)');
{
  const map = makeMap(16, 16);
  const cities = [{
    id: 'c0', ownerId: 3, q: 7, r: 7, name: 'A', population: 6,
    okolicaTryb: 'reczny', okolicaReczne: { '7,5': 1, '7,6': 1, '6,7': 1 },
  }];
  const tn = territory(7, 7, 3, 'c0');
  const worked = new Set(M.workedHexCoordsForCity(cities[0], map, tn).map(({ q, r }) => `${q},${r}`));
  const slad = przebiegCiv(map, cities, tn, 25, []);
  const poza = slad.filter(e => !worked.has(e.hk));
  ok(slad.length > 0, `Z2i: AI cywilizacji cos zbudowala (${slad.length} rozkazow)`);
  ok(poza.length === 0,
    `Z2j: AI CYWILIZACJI nie postawila nic poza polami z obywatelami (${poza.length}: `
    + `${poza.slice(0, 4).map(e => e.key + '@' + e.hk).join(' ')})`);
}

console.log('Z3. NADWYZKA — raport pickera i przekierowanie na budynki');
{
  // Mapa bez zloz i bez lasu, mala okolica reczna: automat domyka 3 heksy i nie ma co robic.
  const map = makeMap(16, 16);
  const cities = [{
    id: 'c0', ownerId: 3, q: 7, r: 7, name: 'A', population: 6,
    okolicaTryb: 'reczny', okolicaReczne: { '7,5': 1, '7,6': 1, '6,7': 1 },
  }];
  const tn = territory(7, 7, 3, 'c0');
  const placed = new Map();
  let ostatni = null, pierwszy = null;
  for (let t = 0; t < 30; t++) {
    const rep = AUTO.freshSurplusReport();
    const cmds = M.decideAITurn(3, [], cities, map, DATA, {
      civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
      territoryNodes: tn, placedImprovements: placed, improvementTechs: TECHS,
      pracaAvailable: 100000, civEra: 3, resourceDeficitKeys: [],
      improvementSurplusReport: rep,
    }).filter(c => c.type === 'buildImprovement');
    if (t === 0) pierwszy = { ...rep, n: cmds.length };
    for (const c of cmds) {
      const hk = `${c.q},${c.r}`;
      if (c.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placed.set(hk, [...(placed.get(hk) ?? []), c.key]);
    }
    ostatni = { ...rep, n: cmds.length };
  }
  ok(pierwszy && pierwszy.demandActive === true && pierwszy.surplus === false && pierwszy.anyCandidate === true,
    `Z3a: w turze 0 sa kandydaci — nadwyzki NIE ma (${JSON.stringify(pierwszy)})`);
  ok(ostatni && ostatni.surplus === true && ostatni.anyCandidate === false && ostatni.deficitActive === false,
    `Z3b: po domknieciu pol z obywatelami raport melduje NADWYZKE (${JSON.stringify(ostatni)})`);

  // niedobor kasuje nadwyzke nawet przy zerze kandydatow zywnosciowych
  const rep2 = AUTO.freshSurplusReport();
  M.decideAITurn(3, [], cities, map, DATA, {
    civType: 'grecy', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {},
    territoryNodes: tn, placedImprovements: placed, improvementTechs: TECHS,
    pracaAvailable: 100000, civEra: 3, resourceDeficitKeys: ['drewno'],
    improvementSurplusReport: rep2,
  });
  ok(rep2.deficitActive === true && rep2.surplus === false,
    `Z3c: przy niedoborze nadwyzki nie ma, nawet gdy zywnosc jest domknieta (${JSON.stringify(rep2)})`);

  // przekierowanie NIE jest no-opem: 100% budynkow daje wiecej Pracy do kolejki niz 70%
  // `splitPraca` bierze UDZIAL w [0,1], nie procent — patrz production.ts.
  const b100 = M.splitPraca(100, CITIES.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT / 100).doBudynkow;
  const b70 = M.splitPraca(100, CITIES.DEFAULT_PODZIAL_PRACY.procentBudynki / 100).doBudynkow;
  ok(b100 > b70,
    `Z3d: przesuniecie podzialu Pracy na maksimum realnie zwieksza Prace kolejki budynkow `
    + `(${b70} -> ${b100} przy 100 Pracy miasta)`);
}

console.log('Z3e. STRAZNIK TEKSTOWY main.ts — Zasada 3 po stronie silnika');
{
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const i = mainSrc.indexOf('const surplusRep = aiSurplusReportByOwner.get(ownerId)');
  const blok = i >= 0 ? mainSrc.slice(i, i + 1800) : '';
  ok(i >= 0, 'Z3e: main.ts zawiera blok przekierowania nadwyzki AI CYWILIZACJI');
  ok(/if\s*\(surplusRep\?\.surplus\)/.test(blok),
    'Z3f: przekierowanie jest BRAMKOWANE raportem nadwyzki (`surplusRep?.surplus`)');
  ok(/ownerDefaultPodzialPracy\.set\(ownerId,\s*\{\s*procentBudynki:\s*pct\s*\}\)/.test(blok)
    && /MAX_PODZIAL_PRACY_BUDYNKI_PERCENT/.test(blok),
    'Z3g: przy nadwyzce podzial Pracy AI idzie na budynki (do MAX_PODZIAL_PRACY_BUDYNKI_PERCENT)');
  ok(/aiSurplusRedirectedOwners\.delete\(ownerId\)/.test(blok),
    'Z3h: po ustaniu nadwyzki podzial WRACA (nie zostaje na maksimum na zawsze)');

  // AI GRACZA: sygnal, ZERO ruchu suwakiem
  const j = mainSrc.indexOf('playerSurplusReport.surplus');
  const blokGracz = j >= 0 ? mainSrc.slice(Math.max(0, j - 900), j + 900) : '';
  ok(j >= 0, 'Z3i: main.ts sygnalizuje nadwyzke automatu GRACZA');
  ok(/showHintMessage\(/.test(blokGracz)
    && !/pracaAutoPercent\s*=/.test(blokGracz)
    && !/pol\.pracaAutoPercent/.test(blokGracz),
    'Z3j: sygnal dla gracza to WYLACZNIE komunikat — zaden zapis do `pracaAutoPercent`');
  const handlery = mainSrc.match(/pol\.pracaAutoPercent\s*=/g) || [];
  ok(handlery.length === 1,
    `Z3k: jedyne miejsce zapisujace polityke `
    + `\`pracaAutoPercent\` panstwa to handler suwaka gracza (${handlery.length})`);
}

console.log('Q2. R4-Q2 — przelacznik „wolno wycinac las" automatu GRACZA');
{
  ok(CITIES.DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS === false,
    'Q2a: wartosc domyslna przelacznika = WYLACZONY (§14 — bez zmiany zachowania)');
  ok(CITIES.freshUlepszeniaEmpirePolicy().wolnoWycinacLas === false,
    'Q2b: swieza polityka panstwa ma wolnoWycinacLas === false');
  const pol = CITIES.freshUlepszeniaEmpirePolicy();
  const bazoweMiasto = { id: 'x', ownerId: 0, q: 0, r: 0, name: 'x', population: 1 };
  ok(CITIES.resolveEffectiveUlepszenia({ ...bazoweMiasto }, pol).wolnoWycinacLas === false,
    'Q2c: miasto bez override dziedziczy wartosc panstwa');
  ok(CITIES.resolveEffectiveUlepszenia({ ...bazoweMiasto }, { ...pol, wolnoWycinacLas: true }).wolnoWycinacLas === true,
    'Q2d: ZAKRES PANSTWO — wlaczenie w polityce panstwa dociera do miasta bez override');
  ok(CITIES.resolveEffectiveUlepszenia(
    { ...bazoweMiasto, ulepszeniaOverride: true, ulepszeniaWolnoWycinacLas: true }, pol).wolnoWycinacLas === true,
    'Q2e: ZAKRES MIASTO — override miasta przebija wylaczona polityke panstwa');
  ok(CITIES.resolveEffectiveUlepszenia(
    { ...bazoweMiasto, ulepszeniaOverride: true }, { ...pol, wolnoWycinacLas: true }).wolnoWycinacLas === false,
    'Q2f: ... i w druga strone — override miasta bez pola wraca do wartosci domyslnej OFF');

  // zapis/odczyt: stare miasto bez pola dostaje OFF, jawne true przezywa migracje
  const stare = { id: 's', ownerId: 0, q: 1, r: 1, name: 's', population: 3, ulepszeniaOverride: true };
  CITIES.ensureCitySaveDefaults(stare);
  ok(stare.ulepszeniaWolnoWycinacLas === false,
    'Q2g: SAVE/LOAD — stary zapis bez pola dostaje przelacznik WYLACZONY');
  const nowe = { id: 'n', ownerId: 0, q: 1, r: 1, name: 'n', population: 3, ulepszeniaOverride: true, ulepszeniaWolnoWycinacLas: true };
  CITIES.ensureCitySaveDefaults(nowe);
  ok(nowe.ulepszeniaWolnoWycinacLas === true,
    'Q2h: SAVE/LOAD — jawne `true` przezywa `ensureCitySaveDefaults`');
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  ok(/wolnoWycinacLas:\s*\(pol\.wolnoWycinacLas as boolean\)\s*\?\?\s*DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS/.test(mainSrc),
    'Q2i: SAVE/LOAD — main.ts odtwarza `wolnoWycinacLas` polityki panstwa z zapisu');
  ok(/ulepszeniaEmpireByOwner:\s*Array\.from\(ulepszeniaEmpireByOwner\.entries\(\)\)/.test(mainSrc),
    'Q2j: SAVE/LOAD — polityka panstwa (z nowym polem) trafia do zapisu w calosci');

  // PER MIASTO w JEDNYM wywolaniu: miasto z przelacznikiem wycina, drugie nie
  const map = makeMap(26, 16, { nakladka: 'las', riverAt: [[5, 5], [5, 6], [5, 7], [18, 5], [18, 6], [18, 7]] });
  const mk = (id, cx, wolno) => ({
    id, ownerId: 0, q: cx, r: 6, population: 6, ulepszeniaFocus: 'zrownowazone',
    okolicaTryb: 'reczny',
    okolicaReczne: { [`${cx},5`]: 1, [`${cx},7`]: 1, [`${cx - 1},6`]: 1 },
    __wolno: wolno,
  });
  const cA = mk('cA', 5, true);
  const cB = mk('cB', 18, false);
  const tn = [...territory(5, 6, 0, 'cA'), ...territory(18, 6, 0, 'cB')];
  const workedOf = c => new Set(M.workedHexCoordsForCity(c, map, tn).map(({ q, r }) => `${q},${r}`));
  // MINIMUM LESNE miasta (runda 3) jest liczone RAZ na wejsciu w miasto, wiec oboz lowiecki
  // i wyrab nie zmieszcza sie w jednym wywolaniu — przebieg wieloturowy, jak w grze.
  const placedQ2 = new Map();
  const picks = [];
  for (let t = 0; t < 14; t++) {
    const tura = AUTO.pickAutoImprovements({
      cities: [cA, cB], ownerId: 0, map, territoryNodes: tn,
      placedImprovements: new Map(placedQ2), pracaAvailable: 1000000, unlockedTechs: TECHS,
      pracaBudgetPercent: 100, maxItemsPerCity: 1, playerEra: 3,
      skipWyrab: true,
      getSkipWyrab: c => !c.__wolno,
      getFocus: c => c.ulepszeniaFocus,
      getOnlyWorked: () => true,
      getWorkedHexKeys: workedOf,
      demandDriven: true, resourceDeficitKeys: [],
    });
    for (const p of tura) {
      picks.push(p);
      const hk = `${p.q},${p.r}`;
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      placedQ2.set(hk, [...(placedQ2.get(hk) ?? []), p.key]);
    }
  }
  const wyrabA = picks.filter(p => p.key === 'wyrab' && p.cityId === 'cA').length;
  const wyrabB = picks.filter(p => p.key === 'wyrab' && p.cityId === 'cB').length;
  ok(wyrabA > 0, `Q2k: miasto z WLACZONYM przelacznikiem wycina las (${wyrabA} wyrebow)`);
  ok(wyrabB === 0, `Q2l: miasto z WYLACZONYM przelacznikiem w TYM SAMYM wywolaniu nie wycina (${wyrabB})`);
  const farmyPoWyrebie = picks.filter(p => p.key === 'farma' && p.cityId === 'cA').length;
  ok(picks.some(p => p.key === 'wyrab' && p.cityId === 'cA'),
    `Q2m: wyrab automatu GRACZA idzie ta sama sciezka pickera co AI CYWILIZACJI `
    + `(skipWyrab=false; farm w miescie cA: ${farmyPoWyrebie})`);

  // straznik konfiguracji main.ts
  const i2 = mainSrc.indexOf('const picks = pickAutoImprovements({');
  const blok = i2 >= 0 ? mainSrc.slice(i2, i2 + 3000) : '';
  ok(/getSkipWyrab:\s*c\s*=>\s*!effectiveUlepszeniaForCity\(c as City\)\.wolnoWycinacLas/.test(blok),
    'Q2n: main.ts (AI GRACZA) podaje `getSkipWyrab` z przelacznika, nie stala');
  ok(/demandDriven:\s*true/.test(blok) && /resourceDeficitKeys:\s*resourceDeficitKeysForOwner\(0\)/.test(blok),
    'Q2o: main.ts (AI GRACZA) podaje Zasade 1 i realne niedobory panstwa');
  ok(/typ\s*===\s*'wycinka'/.test(mainSrc.slice(i2, i2 + 6000)),
    'Q2p: main.ts (AI GRACZA) obsluguje `wyrab` sciezka wycinki, nie jako warstwe ulepszenia');
}

console.log(`\nai4-popyt-obywatele-test: ${passed} passed, ${failed} failed`);
if (failed > 0) console.log('CZERWONE: ' + redlist.join(' | '));
process.exitCode = failed > 0 ? 1 : 0;
