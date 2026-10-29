#!/usr/bin/env node
/**
 * mutate-k09b.mjs — mutacje instalatora panelu miasta i adaptera id (P5-8 K09B, zadanie (4) dispatchu:
 * „pominięcie wiringu każdego z kawałków musi być wykryte”).
 *
 * Każdy mutant: kopia `src/` w katalogu tymczasowym, jedna podmiana tekstu (dokładnie jedno wystąpienie),
 * uruchomienie `run-k09b-wiring.mjs --src <kopia>`. Mutant ZABITY <=> harness kończy się kodem ≠ 0.
 * Mutant PRZEŻYŁ <=> harness przeszedł (EXIT 0) — to błąd testu (luka), raportowany jako FAIL.
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k09b.mjs
 * EXIT 0 <=> wszystkie mutanty zabite; 1 <=> >=1 przeżył.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const V2 = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const WIRING = 'controller/cityPanelWiring.ts';
const ADAPTER = 'controller/cityIdAdapter.ts';

/** [id, plik względem src, znaleziony tekst, zamiennik, opis]. */
const MUTANTS = [
  ['M1', WIRING, '  registerCityPanelUx(cityPanelUxImpl);', '', 'pominięta rejestracja mostu cityPanelUxBridge'],
  ['M2', WIRING, '  installK09aWiring(host.k09a);', '', 'pominięty installK09aWiring (DOM ramki/HUD, haki)'],
  ['M3', WIRING, '  const k07b = installK07bWiring({ ...host.k07b, cfg: cfgRec }, host.k07bServices);', '  const k07b = { missing: [] as string[] };', 'pominięty installK07bWiring (K07A/K07B deps)'],
  ['M4', WIRING, '  setK07aExt(buildK07aExt(host, cfgRec));', '', 'pominięty setK07aExt (adaptery K07A-Z4)'],
  ['M5', WIRING, '  installK08dWiring(host.k08d);', '', 'pominięty installK08dWiring'],
  ['M6', WIRING, '  installK08eWiring(host.k08e);', '', 'pominięty installK08eWiring'],
  ['M7', WIRING, '  installK06aWiring(k06aQueriesWithEngineIds(host.k06a.queries), host.k06a.ui);', '', 'pominięty installK06aWiring'],
  ['M8', WIRING, '    clearPinnedDetail: () => clearHoverPinnedDetail(),', '', 'pominięty delegat K06B clearPinnedDetail'],
  ['M9', WIRING, '    getShowEraBuildingPreview: () => showEraBuildingPreview,', '', 'pominięty ręczny delegat getShowEraBuildingPreview'],
  ['M10', WIRING, '    ...K06B_PORT_DELEGATES,', '', 'pominięte delegaty K06B z kopii portu'],
  ['M11', WIRING, '  installK09aWiring(host.k09a);', '  installK09aWiring(host.k09a);\n  installK08cWiring(host.k08c, host.k08cServices);', 'kolejność: K08C po K09A (rerender K08C nadpisuje K09A)'],
  ['M12', WIRING, '      mapForPaintDuringShow = getK06aState().activeMap;', '      mapForPaintDuringShow = null;', 'brak zapamiętania mapy przed ramką (K09B-Z1)'],
  ['M13', WIRING, '    const map = mapForPaintDuringShow ?? getK06aState().activeMap;', '    const map = getK06aState().activeMap;', 'malowanie czyta mapę już po wyczyszczeniu przez hide'],
  ['M14', WIRING, "    if (map === null) {\n      throw new Error('CityPanelWiring: brak mapy", "    if (map === null) {\n      return;\n      throw new Error('CityPanelWiring: brak mapy", 'brak mapy = cichy powrót zamiast wyjątku (zakaz P5.13/brak delegatu)'],
  ['M15', WIRING, '  clearCityPanelUxMode: () => clearK08a(),', '  clearCityPanelUxMode: () => undefined,', 'most: sprzątanie trybu panelu pominięte'],
  ['M16', WIRING, '  navigateCityPanel: (dir) => navigateK06a(dir),', '  navigateCityPanel: (dir) => navigateK06a(dir === 1 ? -1 : 1),', 'most: nawigacja odwrócona'],
  ['M17', ADAPTER, '  if (typeof id === \'number\') return cityIdToEngine(id);\n  cityIdFromEngine(id);', '  if (typeof id === \'number\') return cityIdToEngine(id);', 'adapter: ciąg engine nie jest walidowany'],
  ['M18', ADAPTER, '  if (typeof id !== \'number\' || !Number.isSafeInteger(id) || id < 0) {', '  if (typeof id !== \'number\' || !Number.isSafeInteger(id)) {', 'adapter: ujemne id przechodzi do silnika'],
  ['M19', ADAPTER, '  if (fn === undefined) return undefined;\n  return (cityId, ...rest) => fn(toEngineCityId(cityId), ...rest);', '  if (fn === undefined) return undefined;\n  return (cityId, ...rest) => fn(String(cityId), ...rest);', 'adapter: hook bez walidacji (String zamiast toEngineCityId)'],
  ['M20', ADAPTER, '  if (!Number.isSafeInteger(n)) {', '  if (false) {', 'adapter: id silnika poza zakresem przechodzi'],
  // Runda 2 (zarzut 1): mutacje POLA DTO w mapowaniu `cityRefToPanelCity` (granica DTO → pin City).
  ['M21', WIRING, '  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', '  return { id: dto.id, ownerId: 0, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', 'DTO: właściciel (owner→ownerId) zerowany'],
  ['M22', WIRING, '  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', '  return { id: dto.id, ownerId: dto.owner, population: 0, name: dto.name, q: dto.q, r: dto.r };', 'DTO: populacja zerowana'],
  ['M23', WIRING, '  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', "  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: '', q: dto.q, r: dto.r };", 'DTO: nazwa miasta pusta'],
  ['M24', WIRING, '  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', '  return { id: 0, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', 'DTO: id miasta zerowane'],
  ['M25', WIRING, '  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.q, r: dto.r };', '  return { id: dto.id, ownerId: dto.owner, population: dto.population, name: dto.name, q: dto.r, r: dto.q };', 'DTO: współrzędne q/r zamienione'],
  // Runda 2 (zarzut 4): ścieżka przypiętego garnizonu i delegaty K06B.
  ['M26', 'ui/cityPanel/k06b-garnizon.ts', '  setK06aPinnedGarrisonCityId(cityId);', '  setK06aPinnedGarrisonCityId(null);', 'pin garnizonu nie zapisuje id (P0)'],
  ['M27', 'ui/cityPanel/k09a-paint.ts', 'st.pinnedGarrisonCityId !== city.id) {', 'st.pinnedGarrisonCityId !== -1) {', 'malowanie zawsze czyści pin (P1)'],
  ['M28', WIRING, '    getShowEraBuildingPreview: () => showEraBuildingPreview,', '    getShowEraBuildingPreview: () => false,', 'delegat getShowEraBuildingPreview zamrożony (E2)'],
];

function runHarness(srcDir, tmpDir) {
  const r = spawnSync(process.execPath, [join(V2, 'tools/dom-harness/run-k09b-wiring.mjs'), '--src', srcDir, '--tmp-dir', tmpDir], {
    cwd: V2,
    encoding: 'utf8',
    timeout: 500000,
  });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const base = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), 'k09b-mut-'));
const results = [];
try {
  // Kontrola bazowa: bez mutacji harness musi przejść.
  const baseCopy = join(base, 'base');
  cpSync(join(V2, 'src'), join(baseCopy, 'src'), { recursive: true });
  const b = runHarness(join(baseCopy, 'src'), baseCopy);
  if (b.code !== 0) {
    console.error('BAZA: harness nie przechodzi bez mutacji (kod ' + b.code + ')\n' + b.out.slice(-2000));
    process.exit(1);
  }
  console.log('BAZA: harness przechodzi bez mutacji');

  for (const [id, file, from, to, opis] of MUTANTS) {
    const dir = join(base, id);
    cpSync(join(V2, 'src'), join(dir, 'src'), { recursive: true });
    const target = join(dir, 'src', file);
    const text = readFileSync(target, 'utf8');
    const count = text.split(from).length - 1;
    if (count !== 1) {
      results.push({ id, opis, status: 'BLAD-MUTANTA', detail: `wystąpień „${from.slice(0, 40)}…”: ${count}` });
      continue;
    }
    writeFileSync(target, text.replace(from, to));
    const r = runHarness(join(dir, 'src'), dir);
    const failLine = r.out.split('\n').filter((l) => l.startsWith('FAIL') || l.startsWith('BLAD-HARNESU')).slice(0, 2).join(' | ');
    results.push({ id, opis, status: r.code === 0 ? 'PRZEZYL' : `ZABITY(kod ${r.code})`, detail: failLine });
  }
} finally {
  rmSync(base, { recursive: true, force: true });
}

for (const r of results) console.log(`${r.status.startsWith('ZABITY') ? 'OK  ' : 'FAIL'} ${r.id} | ${r.opis} | ${r.status}${r.detail ? ` | ${r.detail}` : ''}`);
const survivors = results.filter((r) => !r.status.startsWith('ZABITY'));
console.log(`\nmutanty: ${results.length - survivors.length}/${results.length} zabitych`);
process.exit(survivors.length === 0 ? 0 : 1);
