'use strict';
/**
 * farm-assign-citizen-hint-manual-test.cjs -- R-WEB-UI-FARM-ASSIGN-CITIZEN-HINT-MANUAL-MODE-Q1
 * Run z gra/:  node tools/farm-assign-citizen-hint-manual-test.cjs
 *
 * Sprawdza prawdziwe funkcje podpowiedzi (esbuild bundle src/game/farm-assign-hint.ts, bez atrap logiki):
 *  - tryb ręczny + nowe pole (farma) w zasięgu + wolny obywatel  -> podpowiedź (wpis raz na turę)
 *  - tryb autonomiczny (auto)                                    -> brak podpowiedzi
 *  - pole obce (inny właściciel)                                  -> brak podpowiedzi
 *  - brak wolnych obywateli, nowe pole gorsze niż obsadzone       -> brak; lepsze -> podpowiedź
 *  - po przydziale obywatela (pole obsadzone)                     -> podpowiedź znika
 *  - znacznik „Tryb ręczny” (stała tekstu + wpis listy miast w źródłach)
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

  // Mapa: Łąka goła wszędzie; farma = ulepszenia ['farma'] (plon żywności 3), reszta plon 1.
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
  // Plon: farma = 3 żywności, pozostałe = 1 (deterministyczny, zgodny z tileScore).
  const yieldOfFor = map => (q, r) => {
    const h = map.hexes[K(q, r)];
    const farm = h && (h.ulepszenia || []).includes('farma');
    return { zywnosc: farm ? 3 : 1, praca: 0, handel: 0 };
  };
  const baseCity = (over = {}) => ({
    id: 'c1', name: 'Pompeje', q: CQ, r: CR, population: 2, ownerId: 0,
    okolicaTryb: 'reczny', okolicaFocus: 'zrownowazone', okolicaReczne: {}, ...over,
  });

  // 1. Tryb ręczny + nowa farma + wolny obywatel -> podpowiedź.
  const farmA = K(CQ + 2, CR);
  const mapA = mkMap([farmA]);
  const cityA = baseCity({ population: 2, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  const hA = lib.farmAssignHintFor(cityA, mapA, yieldOfFor(mapA));
  ok(!!hA && hA.hexKey === farmA && hA.improvementKey === 'farma', 'tryb ręczny + nowa farma + wolny obywatel -> podpowiedź na farmie');
  ok(!!hA && hA.reason === 'wolny_obywatel' && hA.freeCitizens === 1, 'podpowiedź: powód wolny_obywatel, wolnych 1');
  ok(!!hA && hA.improvementLabel === 'Farma', 'etykieta ulepszenia po polsku');

  // 2. Tryb autonomiczny -> brak podpowiedzi (nawet przy tej samej farmie).
  const hAuto = lib.farmAssignHintFor(baseCity({ okolicaTryb: 'auto', okolicaReczne: {} }), mapA, yieldOfFor(mapA));
  ok(hAuto === null, 'tryb autonomiczny (auto) -> brak podpowiedzi');

  // 3. Farma należy do obcego właściciela -> nie podpowiadamy.
  const mapB = mkMap([farmA], { [farmA]: 1 });
  const hB = lib.farmAssignHintFor(cityA, mapB, yieldOfFor(mapB));
  ok(hB === null, 'pole obcego właściciela -> brak podpowiedzi');

  // 4. Brak wolnych obywateli, nowe pole GORSZE niż obsadzone -> brak.
  const farmC = K(CQ + 2, CR);
  const mapC = mkMap([farmC]);
  const cityC = baseCity({ population: 1, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  // obsadzone pole (zwykła łąka, plon 1) vs farma (plon 3): farma LEPSZA -> podpowiedź (lepsze_pole).
  const hC = lib.farmAssignHintFor(cityC, mapC, yieldOfFor(mapC));
  ok(!!hC && hC.reason === 'lepsze_pole', 'brak wolnych, farma lepsza od obsadzonego pola -> podpowiedź lepsze_pole');

  // 5. Brak wolnych obywateli, obsadzona FARMA (plon 3), nowa farma tej samej wartości -> brak.
  const mapD = mkMap([K(CQ + 1, CR), K(CQ + 2, CR)]);
  const cityD = baseCity({ population: 1, okolicaReczne: { [K(CQ + 1, CR)]: 1 } });
  const hD = lib.farmAssignHintFor(cityD, mapD, yieldOfFor(mapD));
  ok(hD === null, 'brak wolnych, nowe pole nie lepsze od obsadzonego -> brak podpowiedzi');

  // 6. Po przydziale obywatela na farmie podpowiedź znika (wolnych 0, brak lepszego pola).
  const cityE = baseCity({ population: 2, okolicaReczne: { [K(CQ + 1, CR)]: 1, [farmA]: 1 } });
  const hE = lib.farmAssignHintFor(cityE, mapA, yieldOfFor(mapA));
  ok(hE === null, 'po przydziale na farmie (obsadzona, brak wolnych) -> podpowiedź znika');

  // 7. Zero populacji -> brak.
  ok(lib.farmAssignHintFor(baseCity({ population: 0, okolicaReczne: {} }), mapA, yieldOfFor(mapA)) === null,
    'populacja 0 -> brak podpowiedzi');

  // 8. Wpis panelu: jeden na miasto na turę (id z turą), tytuł i rodzaj.
  const ev = lib.buildFarmAssignHintSidePanelEvent(hA, 'Pompeje', 7);
  ok(ev.title === 'Przydziel obywatela?' && ev.kind === 'city', 'wpis panelu: tytuł „Przydziel obywatela?”, rodzaj city');
  ok(ev.id === lib.farmAssignHintEventId('c1', 7) && ev.id !== lib.farmAssignHintEventId('c1', 8),
    'id wpisu zależy od miasta i tury (jeden wpis na turę)');
  ok(/Tryb ręczny/.test(ev.subtitle) && /nie są przydzielani automatycznie/.test(ev.subtitle),
    'podtytuł informuje o trybie ręcznym i braku automatycznego przydziału');

  // 9. Znacznik „Tryb ręczny” i wpis listy miast w źródłach.
  ok(lib.MANUAL_MODE_BADGE_TEXT === 'Tryb ręczny', 'stała znacznika trybu ręcznego');
  const listSrc = fs.readFileSync(path.join(SRC, 'ui', 'cityListHud.ts'), 'utf8');
  ok(/manualTryb\?: boolean/.test(listSrc) && /'Tryb ręczny'/.test(listSrc), 'lista miast: pole manualTryb i znacznik „Tryb ręczny”');
  const panelSrc = fs.readFileSync(path.join(SRC, 'ui', 'cityPanel.ts'), 'utf8');
  ok(/okolica-manual-badge/.test(panelSrc), 'karta miasta: znacznik okolica-manual-badge');
  const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok(/manualTryb: c\.okolicaTryb === 'reczny'/.test(mainSrc) && /farmAssignHintFor\(hc, map/.test(mainSrc),
    'main.ts: lista miast podaje manualTryb, koniec tury wywołuje podpowiedź dla gracza');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
