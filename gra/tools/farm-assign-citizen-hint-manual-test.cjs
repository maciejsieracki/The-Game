'use strict';
/**
 * farm-assign-citizen-hint-manual-test.cjs -- R-WEB-UI-FARM-ASSIGN-CITIZEN-HINT-MANUAL-MODE-Q1 (runda 2)
 * Run z gra/:  node tools/farm-assign-citizen-hint-manual-test.cjs
 *
 * Sprawdza prawdziwe funkcje (esbuild bundle src/game/farm-assign-hint.ts, bez atrap logiki):
 *  - funkcja warunku (farmAssignHintFor): wolny obywatel / lepsze pole / brak / auto / obcy właściciel
 *  - treść wpisu: nazwa terenu zamiast surowego klucza heksu
 *  - wyzwalacz applyFarmAssignHints (koniec tury): nowe pole -> wpis raz na turę, stare pole -> brak,
 *    AI -> brak, auto -> brak, brak duplikatów w tej samej turze
 *  - prune (składanie listy wydarzeń): po przydziale wpis znika, bez zmian -> brak zmian
 *  - źródła: wywołania applyFarmAssignHints w main.ts (koniec tury + składanie listy), znaczniki UI
 * Pętla main.ts NIE jest uruchamiana (boot przeglądarkowy) -> integracja w grze: NIE_ZMIERZONO.
 * Chromium/DOM nie jest uruchamiany -> wizualna weryfikacja: NIE_ZMIERZONO.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = process.env.FAH_SRC_DIR || path.join(GRA, 'src');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fah-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export {
  farmAssignHintFor, buildFarmAssignHintSidePanelEvent, farmAssignHintEventId,
  parseFarmAssignHintEventId, applyFarmAssignHints, resetFarmAssignHintMemory,
  MANUAL_MODE_BADGE_TEXT, FARM_ASSIGN_HINT_KEYS,
} from ${JSON.stringify(SRC + '/game/farm-assign-hint')};
`);

async function main() {
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
    loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error',
    nodePaths: [path.join(GRA, 'node_modules')],
  });
  const lib = require(bundle);
  fs.rmSync(tmp, { recursive: true, force: true });

  let passed = 0, failed = 0;
  const ok = (c, m) => { if (c) { passed++; console.log('PASS:', m); } else { failed++; console.error('FAIL:', m); } };

  const K = (q, r) => `${q},${r}`;
  const CQ = 110, CR = 34;
  const HUMAN = 1, AI = 2;

  // Mapa: Łąka wszędzie ('laka'); wskazane heksy mają ulepszenie 'farma' (plon żywności 3), reszta 1.
  function mkMap(farmKeys = [], ownerOf = {}) {
    const hexes = {};
    for (let q = 100; q <= 125; q++) for (let r = 25; r <= 45; r++) {
      const key = K(q, r);
      const isFarm = farmKeys.includes(key);
      hexes[key] = {
        coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: isFarm ? 'farma' : 'brak',
        ulepszenia: isFarm ? ['farma'] : [],
        wlasciciel: ownerOf[key] ?? null, wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
      };
    }
    return { szerokoscQ: 140, wysokoscR: 60, hexes, seed: 1, riverPaths: [] };
  }
  const yieldOfFor = map => (q, r) => {
    const h = map.hexes[K(q, r)];
    const farm = h && (h.ulepszenia || []).includes('farma');
    return { zywnosc: farm ? 3 : 1, produkcja: 0, handel: 0, nauka: 0, zloto: 0, wiara: 0, zloto_zb: 0 };
  };
  const baseCity = (over = {}) => ({
    id: 'c1', name: 'Pompeje', q: CQ, r: CR, population: 2, ownerId: HUMAN,
    okolicaTryb: 'reczny', okolicaFocus: undefined, okolicaReczne: {}, ...over,
  });

  // ---- 1. Warunek (czysta funkcja) ----
  const farmA = K(CQ + 2, CR);
  const mapA = mkMap([farmA]);
  const cityA = baseCity({ population: 2, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  const hA = lib.farmAssignHintFor(cityA, mapA, yieldOfFor(mapA));
  ok(!!hA && hA.hexKey === farmA && hA.improvementKey === 'farma', 'tryb ręczny + nowa farma + wolny obywatel -> podpowiedź na farmie');
  ok(!!hA && hA.reason === 'wolny_obywatel' && hA.freeCitizens === 1, 'podpowiedź: powód wolny_obywatel, wolnych 1');
  ok(!!hA && hA.improvementLabel === 'Farma', 'etykieta ulepszenia po polsku');
  ok(!!hA && hA.terrainLabel === 'Łąka', 'etykieta terenu heksu (Łąka) wyliczona z terenBazowy');

  const hAuto = lib.farmAssignHintFor(baseCity({ okolicaTryb: 'auto', okolicaReczne: {} }), mapA, yieldOfFor(mapA));
  ok(hAuto === null, 'tryb autonomiczny (auto) -> brak podpowiedzi');

  const mapB = mkMap([farmA], { [farmA]: AI });
  ok(lib.farmAssignHintFor(cityA, mapB, yieldOfFor(mapB)) === null, 'pole obcego właściciela -> brak podpowiedzi');

  const cityC = baseCity({ population: 1, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  const mapC = mkMap([K(CQ + 2, CR)]);
  const hC = lib.farmAssignHintFor(cityC, mapC, yieldOfFor(mapC));
  ok(!!hC && hC.reason === 'lepsze_pole', 'brak wolnych, farma lepsza od obsadzonego pola -> podpowiedź lepsze_pole');

  const mapD = mkMap([K(CQ + 1, CR), K(CQ + 2, CR)]);
  const cityD = baseCity({ population: 1, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  ok(lib.farmAssignHintFor(cityD, mapD, yieldOfFor(mapD)) === null,
    'brak wolnych, nowe pole nie lepsze od obsadzonego -> brak podpowiedzi');

  const cityE = baseCity({ population: 2, okolicaReczne: { [K(CQ + 1, CR)]: 1, [farmA]: 1 } });
  ok(lib.farmAssignHintFor(cityE, mapA, yieldOfFor(mapA)) === null,
    'po przydziale na farmie (obsadzona, brak wolnych) -> podpowiedź znika');
  ok(lib.farmAssignHintFor(baseCity({ population: 0, okolicaReczne: {} }), mapA, yieldOfFor(mapA)) === null,
    'miasto bez ludności -> brak podpowiedzi');
  ok(lib.farmAssignHintFor(cityA, mapA, yieldOfFor(mapA), undefined, new Set()) === null,
    'onlyKeys pusty (brak nowych pól) -> brak podpowiedzi');

  // ---- 2. Treść wpisu: bez surowego klucza heksu ----
  const ev = lib.buildFarmAssignHintSidePanelEvent(hA, 'Pompeje', 7);
  ok(ev.title === 'Przydziel obywatela?' && ev.kind === 'city', 'wpis panelu: tytuł „Przydziel obywatela?”, rodzaj city');
  ok(ev.id === lib.farmAssignHintEventId('c1', 7) && ev.id !== lib.farmAssignHintEventId('c1', 8),
    'id wpisu zawiera miasto i turę (jedna na turę)');
  ok(/Tryb ręczny/.test(ev.subtitle) && /nie są przydzielani automatycznie/.test(ev.subtitle),
    'podtytuł: informacja o trybie ręcznym');
  ok(/na terenie: Łąka/.test(ev.subtitle) && !/\d{2,3},\d{2,3}/.test(ev.subtitle),
    'podtytuł: nazwa terenu, bez surowych współrzędnych „q,r”');
  ok(lib.parseFarmAssignHintEventId(ev.id).cityId === 'c1' && lib.parseFarmAssignHintEventId(ev.id).turn === 7,
    'parsowanie id wpisu (miasto z myślnikami i tura)');
  const evDash = lib.farmAssignHintEventId('city-7-x', 3);
  ok(lib.parseFarmAssignHintEventId(evDash).cityId === 'city-7-x', 'parsowanie id: miasto zawierające myślniki');

  // ---- 3. Wyzwalacz: nowe pole od poprzedniej tury ----
  const ctxFor = (cities, map, turn, humanOwnerId = HUMAN) => ({
    cities, map, yieldOf: yieldOfFor(map), humanOwnerId, turn,
  });
  lib.resetFarmAssignHintMemory();
  const log = [];
  const cityT = baseCity({ population: 2, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  const cities = [cityT];

  // Tura 5: linia bazowa (farma już stoi, ale nie była znana) -> brak wpisu.
  const m5 = mkMap([farmA]);
  lib.applyFarmAssignHints(log, ctxFor(cities, m5, 5), { createNew: true });
  ok(log.length === 0, 'linia bazowa: istniejąca stara farma nie wywołuje podpowiedzi');

  // Tura 6: nowa farma obok (zbudowana w tej turze) -> dokładnie jeden wpis dla t6.
  const farmN = K(CQ + 3, CR);
  const m6 = mkMap([farmA, farmN]);
  lib.applyFarmAssignHints(log, ctxFor(cities, m6, 6), { createNew: true });
  const hits6 = log.filter(e => e.id === lib.farmAssignHintEventId('c1', 6));
  ok(hits6.length === 1 && log.length === 1, 'nowe pole w turze 6 -> jeden wpis „Przydziel obywatela?”');
  ok(log[0] && log[0].turnCreated === 6, 'wpis ma turnCreated = 6 (wygasa z turą)');

  // Ta sama tura, ponowne wywołanie końca tury -> bez duplikatu.
  lib.applyFarmAssignHints(log, ctxFor(cities, m6, 6), { createNew: true });
  ok(log.length === 1, 'drugie wywołanie w tej samej turze -> bez duplikatu');

  // Tura 7: żadnego nowego pola -> stara, nieobsadzona farma nie nagabuje ponownie.
  // (Wpis z tury 6 nadal ważny, więc zostaje; nie pojawia się drugi.)
  lib.applyFarmAssignHints(log, ctxFor(cities, m6, 7), { createNew: true });
  ok(log.length === 1 && log[0].id === lib.farmAssignHintEventId('c1', 6),
    'tura 7 bez nowego pola -> brak nowego wpisu (stare pole nie nagabuje)');

  // Miasto w trybie AUTO: nowe pole -> brak wpisu.
  lib.resetFarmAssignHintMemory();
  const logAuto = [];
  const citiesAuto = [baseCity({ okolicaTryb: 'auto', okolicaReczne: {} })];
  lib.applyFarmAssignHints(logAuto, ctxFor(citiesAuto, mkMap([]), 5), { createNew: true });
  lib.applyFarmAssignHints(logAuto, ctxFor(citiesAuto, mkMap([farmA]), 6), { createNew: true });
  ok(logAuto.length === 0, 'tryb autonomiczny: nowe pole -> brak podpowiedzi (auto bez zmian)');

  // Miasto AI (inny właściciel): nowe pole -> brak wpisu (tylko gracz).
  lib.resetFarmAssignHintMemory();
  const logAi = [];
  const citiesAi = [baseCity({ ownerId: AI, okolicaReczne: { [K(CQ + 1, CR)]: 1 } })];
  lib.applyFarmAssignHints(logAi, ctxFor(citiesAi, mkMap([]), 5), { createNew: true });
  lib.applyFarmAssignHints(logAi, ctxFor(citiesAi, mkMap([farmA]), 6), { createNew: true });
  ok(logAi.length === 0, 'miasto AI w trybie ręcznym -> brak podpowiedzi (tylko gracz)');

  // Przełączenie auto->reczne po powstaniu pola: bazowy zbiór aktualizuje się też w auto.
  lib.resetFarmAssignHintMemory();
  const logSw = [];
  const citySw = baseCity({ okolicaTryb: 'auto', okolicaReczne: {} });
  lib.applyFarmAssignHints(logSw, ctxFor([citySw], mkMap([]), 5), { createNew: true });
  lib.applyFarmAssignHints(logSw, ctxFor([citySw], mkMap([farmA]), 6), { createNew: true });
  citySw.okolicaTryb = 'reczny';
  citySw.okolicaReczne = { [K(CQ + 1, CR)]: 1 };
  lib.applyFarmAssignHints(logSw, ctxFor([citySw], mkMap([farmA]), 7), { createNew: true });
  ok(logSw.length === 0, 'przełączenie na tryb ręczny nie nagabuje za pole powstałe w trybie auto');

  // ---- 4. Prune: po przydziale wpis znika, także w trakcie tury (createNew:false) ----
  lib.resetFarmAssignHintMemory();
  const logP = [];
  const cityP = baseCity({ population: 2, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  const ctxP = ctxFor([cityP], mkMap([]), 5);
  lib.applyFarmAssignHints(logP, ctxP, { createNew: true });
  ctxP.map = mkMap([farmA]); ctxP.yieldOf = yieldOfFor(ctxP.map);
  lib.applyFarmAssignHints(logP, ctxP, { createNew: true });
  ok(logP.length === 1, 'przed przydziałem: wpis istnieje (nowe pole, wolny obywatel)');
  const changedNoop = lib.applyFarmAssignHints(logP, ctxP, { createNew: false });
  ok(changedNoop === false && logP.length === 1, 'prune bez zmiany warunku: wpis zostaje, brak zmian');
  cityP.okolicaReczne = { [K(CQ + 1, CR)]: 1, [farmA]: 1 }; // gracz przydzielił obywatela na farmie
  const changedPrune = lib.applyFarmAssignHints(logP, ctxP, { createNew: false });
  ok(changedPrune === true && logP.length === 0, 'po przydziale obywatela na farmie: wpis znika (prune w trakcie tury)');

  // Prune: miasto przestaje być ręczne -> wpis znika.
  const logM = [{ id: lib.farmAssignHintEventId('c1', 5), icon: 'x', title: 'Przydziel obywatela?', kind: 'city' }];
  const cityM = baseCity({ okolicaTryb: 'auto', okolicaReczne: {} });
  lib.applyFarmAssignHints(logM, ctxFor([cityM], mkMap([farmA]), 5), { createNew: false });
  ok(logM.length === 0, 'miasto w trybie auto: stary wpis podpowiedzi zostaje usunięty');

  // Prune nie rusza cudzych wpisów.
  const other = { id: 'eot-hint-x', icon: 'x', title: 'inne', kind: 'city' };
  const logO = [other];
  lib.applyFarmAssignHints(logO, ctxFor([cityA], mkMap([]), 5), { createNew: false });
  ok(logO.length === 1 && logO[0] === other, 'prune nie usuwa wpisów innych źródeł');

  // ---- 5. Źródła: wywołania w main.ts i znaczniki UI ----
  const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok((mainSrc.match(/applyFarmAssignHints\(warEventLog,/g) || []).length === 2,
    'main.ts: applyFarmAssignHints(warEventLog, …) wywołane dwa razy (koniec tury + składanie listy)');
  ok(/\{ createNew: true \}\)\) trimWarEventLog\(\);/.test(mainSrc),
    'main.ts: po dodaniu podpowiedzi koniec tury przycina warEventLog (trimWarEventLog)');
  ok(/manualTryb: c\.okolicaTryb === 'reczny'/.test(mainSrc), 'main.ts: lista miast dostaje manualTryb');
  ok(lib.MANUAL_MODE_BADGE_TEXT === 'Tryb ręczny', 'stała znacznika trybu ręcznego');
  const listSrc = fs.readFileSync(path.join(SRC, 'ui', 'cityListHud.ts'), 'utf8');
  ok(/manualTryb\?: boolean/.test(listSrc) && /'Tryb ręczny'/.test(listSrc), 'lista miast: pole manualTryb i znacznik „Tryb ręczny”');
  const panelSrc = fs.readFileSync(path.join(SRC, 'ui', 'cityPanel.ts'), 'utf8');
  ok(/okolica-manual-badge/.test(panelSrc), 'karta miasta: znacznik okolica-manual-badge');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
