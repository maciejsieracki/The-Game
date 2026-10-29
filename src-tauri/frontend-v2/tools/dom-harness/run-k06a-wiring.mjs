#!/usr/bin/env node
/**
 * run-k06a-wiring.mjs — test podłączenia K06A w kontrolerze (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, zadanie dodatkowe).
 *
 * Bundluje `src/controller/k06aWiring.ts` (esbuild, jak run-k06a-units.mjs) i sprawdza:
 *   W1  przed `installK06aWiring` delegat K06A rzuca błąd (brak zależności) — nie ma cichego fallbacku;
 *   W2  `formatTileYieldShort` przechodzi przez `cityPanelChipIconWrap` z usług UI (mapper deps);
 *   W3  `drawerTabButtons` czyta `cityTabs` / `activeDrawerTab` / `cityTabIconHtml` z usług UI (mapper deps);
 *   W4  `headerOrderBadge` czyta `getOrderState` z atrapy/providera (mapper cfg), a brak stanu daje tekst „szczegóły poniżej”;
 *   W5  `ownerCities` czyta `getCities` z providera i filtruje po właścicielu (mapper cfg);
 *   W6  `k06aStateAccessors` zapisuje i odczytuje stan (K06A-Z7);
 *   W7  atrapa MOCK zwraca stałe wartości i pusty `getCities` (brak obliczeń w kontrolerze).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/run-k06a-wiring.mjs
 * EXIT 0 ⇔ wszystkie testy zielone; 1 ⇔ przynajmniej jeden błąd; 2 ⇔ błąd uruchomienia.
 */
import * as esbuild from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const ENTRY = join(FRONT, 'src/controller/k06aWiring.ts');
const K06A = join(FRONT, 'src/ui/cityPanel/k06a-fundament.ts');
const tmp = mkdtempSync(join(tmpdir(), 'p58k06a-wiring-'));
const results = [];
const check = (id, ok, detail = '') => results.push({ id, ok: Boolean(ok), detail });

try {
  // Jeden bundle (jedna instancja modułu K06A): wiring i funkcje K06A muszą widzieć ten sam stan.
  // Katalog statyczny (ZAŁOŻENIE P5.2-Z1) musi być zainstalowany PRZED ewaluacją modułów K06A: setup jest pierwszym importem.
  const setupSrc = join(tmp, 'setup.ts');
  writeFileSync(
    setupSrc,
    `import { installStaticCatalog } from ${JSON.stringify(join(FRONT, 'src/controller/staticCatalog.ts'))};\n` +
      `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(FRONT, 'src/controller/mockCatalog.ts'))};\n` +
      `installStaticCatalog(MOCK_STATIC_CATALOG);\n`,
  );
  const probeSrc = join(tmp, 'probe.ts');
  writeFileSync(
    probeSrc,
    `import ${JSON.stringify(setupSrc)};\nexport * from ${JSON.stringify(K06A)};\nexport * from ${JSON.stringify(ENTRY)};\n`,
  );
  const probeBundle = join(tmp, 'probe.mjs');
  await esbuild.build({ entryPoints: [probeSrc], outfile: probeBundle, bundle: true, format: 'esm', platform: 'node', target: 'es2022', logLevel: 'error' });
  const P = await import(pathToFileURL(probeBundle).href);
  const W = P;

  // W1 — przed podłączeniem: brak zależności, błąd (nie cichy fallback).
  let threw = false;
  try {
    P.formatTileYieldShort({ zywnosc: 1, praca: 0, handel: 0 });
  } catch (e) {
    threw = /brak zależności/.test(String(e?.message ?? e));
  }
  check('W1-brak-deps-rzuca', threw);

  const uiStub = {
    cityPanelChipIconWrap: (name, px) => `WRAP(${name},${px})`,
    tileYield: () => ({ zywnosc: 0, praca: 0, handel: 0 }),
    formatCityMapLabel: (c) => `LBL(${c.name})`,
    axialToWorld: (q, r) => ({ x: q, z: r }),
    cityTabs: () => [{ id: 'prod', short: 'Prod' }, { id: 'wz', short: 'Wz' }],
    activeDrawerTab: () => 'wz',
    cityTabIconHtml: (id) => `ICON(${id})`,
    switchCity: () => {},
  };
  const cities = [
    { id: 'c1', ownerId: 0, q: 0, r: 0, name: 'A', population: 1 },
    { id: 'c2', ownerId: 0, q: 1, r: 0, name: 'B', population: 1 },
    { id: 'c3', ownerId: 1, q: 2, r: 0, name: 'C', population: 1 },
  ];
  let queries = { getOrderState: () => ({ szPct: 10, porPct: 70, revoltWarning: true }), getCities: () => cities };
  W.installK06aWiring(queries, uiStub);

  // W2 — deps: formatTileYieldShort -> cityPanelChipIconWrap.
  const tyOut = P.formatTileYieldShort({ zywnosc: 2, praca: 0, handel: 0 });
  check('W2-deps-chip-wrap', tyOut === '+2 WRAP(chip-grain,12)', tyOut);

  // W3 — deps: drawerTabButtons -> cityTabs / activeDrawerTab / cityTabIconHtml.
  const tabs = P.drawerTabButtons();
  const okTabs = tabs.includes('data-tab="prod"') && tabs.includes('data-tab="wz"') && tabs.includes('ICON(wz)') && /class="civ-cs-tab on" data-tab="wz"/.test(tabs);
  check('W3-deps-zakladki', okTabs, tabs.slice(0, 120));

  // W4 — cfg: headerOrderBadge -> getOrderState (porPct 70 => green, revoltWarning => ostrzeżenie).
  const badge = P.headerOrderBadge({ id: 'c1', ownerId: 0, q: 0, r: 0, name: 'A', population: 1 });
  check('W4-cfg-order-state', badge.includes('class="green"') && badge.includes('70%') && badge.includes('⚠'), badge);
  queries = { getOrderState: () => undefined, getCities: () => cities };
  W.installK06aWiring(queries, uiStub);
  const badge2 = P.headerOrderBadge({ id: 'c1', ownerId: 0, q: 0, r: 0, name: 'A', population: 1 });
  check('W4b-brak-stanu-tekst', badge2.includes('szczegóły poniżej'), badge2);

  // W5 — cfg: ownerCities -> getCities, filtr po właścicielu.
  W.installK06aWiring({ getOrderState: () => undefined, getCities: () => cities }, uiStub);
  const own = P.ownerCities(cities[0]).map((c) => c.id);
  check('W5-cfg-miasta-wlasciciela', own.join(',') === 'c1,c2', own.join(','));

  // W6 — akcesory stanu K06A.
  const city = cities[2];
  W.k06aStateAccessors.setActive(city, null, () => {});
  W.k06aStateAccessors.setPinnedGarrisonCityId('c3');
  const st = W.k06aStateAccessors.getState();
  check('W6-akcesory-stanu', st.activeCity?.id === 'c3' && st.pinnedGarrisonCityId === 'c3', JSON.stringify({ a: st.activeCity?.id, p: st.pinnedGarrisonCityId }));
  W.k06aStateAccessors.setPinnedGarrisonCityId(null);
  W.k06aStateAccessors.setActive(null, null, () => {});

  // W7 — atrapa MOCK: stałe wartości, bez obliczeń.
  const mockOrder = W.MOCK_K06A_QUERIES.getOrderState('x');
  const mockCities = W.MOCK_K06A_QUERIES.getCities();
  check('W7-atrapa-stale', mockOrder?.szPct === 0 && mockOrder?.porPct === 0 && Array.isArray(mockCities) && mockCities.length === 0);
  const created = W.createMockK06aQueries();
  check('W7b-fabryka-atrapy', created.getCities()?.length === 0 && created.getOrderState('x')?.porPct === 0);
} catch (e) {
  console.error('run-k06a-wiring: błąd uruchomienia:', e?.stack ?? e);
  rmSync(tmp, { recursive: true, force: true });
  process.exit(2);
}
rmSync(tmp, { recursive: true, force: true });
const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.id}${r.ok ? '' : ` :: ${r.detail}`}`);
console.log(JSON.stringify({ checks: results.length, ok: results.length - bad.length, fail: bad.length }));
process.exit(bad.length ? 1 : 0);
