#!/usr/bin/env node
/**
 * run-k04-units-b2.mjs — harness porownania: jednostki K04 batch 2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04-Q1, runda 3)
 * — v2 (`src/ui/cityPanel/k04-buildings.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`).
 *
 * Jednostki pinu wyciagane PO NAZWIE. Zaleznosci silnika (buildingLevelForEpoch, buildingUpkeep, cfg.getEpoch,
 * cfg.getUnlockedTechs, cfg.getCities, cfg.getBuiltBuildingIds) sa stubowane po stronie pinu wartosciami z tego samego
 * fixture, z ktorego v2 dostaje pola DTO (ownedLevels, upkeepById, lista miast). Realna zgodnosc wartosci DTO z silnikiem
 * Rust (K04-Z3) NIE jest tutaj mierzona — patrz P5-8-K04.md.
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k04-units-b2.mjs --pin-dir <PIN_DIR> [--v2 <plik v2 zamiast k04-buildings.ts>]
 * EXIT 0 <=> 0 roznic; 1 <=> >=1 roznica; 2 <=> blad harnessu.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Uzycie: node tools/dom-harness/run-k04-units-b2.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k04-buildings.ts'));
const PIN_FILE = join(PIN_DIR, 'gra/src/ui/cityPanel.ts');

const pinLines = readFileSync(PIN_FILE, 'utf8').split('\n');

/** Funkcja top-level z pliku pinu: od `function NAME` do pierwszej linii `}` w kolumnie 0. */
function extractFn(name) {
  const re = new RegExp(`^(export )?function ${name}[\\s(<]`);
  const i = pinLines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak funkcji ${name}`);
  let j = i;
  while (pinLines[j] !== '}') j++;
  return pinLines.slice(i, j + 1).join('\n').replace(/^(export )?function /m, 'export function ');
}

const PIN_FNS = ['buildingUiDisplayLevel', 'buildingOwnedLevel', 'sumOwnedBuildingsUpkeep', 'ownerHasSpichlerz'];

const probe = [
  '// Stan scenariusza (ustawiany przez __setS).',
  'let __S: any = {};',
  'export function __setS(s: any): void { __S = s; }',
  'const cfg: any = new Proxy({}, { get: (_t, k) => (__S.cfg || {})[k as string] });',
  // Stuby silnika (wartosci z fixture; po stronie v2 odpowiednik to pola DTO).
  'function buildingLevelForEpoch(_epoka: any, _epoch: number, _maks: number, _gate: any, _techs: any): number { return __S.levelOf?.[_epoka.__id] ?? 1; }',
  'function buildingUpkeep(rec: any, _level: number): number { return __S.upkeepOf?.[rec.id] ?? 0; }',
  ...PIN_FNS.map(extractFn),
  'export function pinBuildingUiDisplayLevel(def: any, city?: any): number { return buildingUiDisplayLevel(def, city); }',
  'export function pinBuildingOwnedLevel(def: any, city: any): number { return buildingOwnedLevel(def, city); }',
  'export function pinSumOwnedBuildingsUpkeep(built: any, data: any, city: any): number { return sumOwnedBuildingsUpkeep(built, data, city); }',
  'export function pinOwnerHasSpichlerz(ownerId: number): boolean { return ownerHasSpichlerz(ownerId); }',
].join('\n');

// Epoka budynku jest przekazywana jako obiekt z id, by stub `buildingLevelForEpoch` mogl odczytac poziom z fixture.
// Pin wywoluje `buildingLevelForEpoch(def.epokaWejscia, ...)`, wiec w fixture `epokaWejscia` = { __id: def.id }.

const tmp = mkdtempSync(join(tmpdir(), 'k04b2-'));
try {
  const probeFile = join(tmp, 'pin-probe.ts');
  writeFileSync(probeFile, probe);
  const pinBundle = await esbuild.build({ entryPoints: [probeFile], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
  const pinOut = join(tmp, 'pin.mjs');
  writeFileSync(pinOut, pinBundle.outputFiles[0].text);

  const v2Bundle = await esbuild.build({ entryPoints: [V2_FILE], bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent' });
  const v2Out = join(tmp, 'v2.mjs');
  writeFileSync(v2Out, v2Bundle.outputFiles[0].text);

  const pin = await import(pathToFileURL(pinOut).href);
  const v2 = await import(pathToFileURL(v2Out).href);

  const DEFS = [
    { id: 'spichlerz', epokaWejscia: { __id: 'spichlerz' }, maksPoziom: 3, poziomTechGate: null },
    { id: 'koszary', epokaWejscia: { __id: 'koszary' }, maksPoziom: 2, poziomTechGate: null },
    { id: 'swiatynia', epokaWejscia: { __id: 'swiatynia' }, maksPoziom: 1, poziomTechGate: null },
    // Brak wpisu w mapie poziomow DTO: pin (stub silnika) zwraca 1, v2 musi dac ten sam fallback.
    { id: 'nowa', epokaWejscia: { __id: 'nowa' }, maksPoziom: 1, poziomTechGate: null },
  ];
  const LEVELS = { spichlerz: 2, koszary: 1, swiatynia: 1 };
  const UPKEEP = { spichlerz: 4, koszary: 2, swiatynia: 0 };
  const CITIES_FIXTURE = [
    { id: 'c1', ownerId: 1, built: ['koszary', 'spichlerz'] },
    { id: 'c2', ownerId: 2, built: ['spichlerz'] },
    { id: 'c3', ownerId: 1, built: ['swiatynia'] },
  ];

  const scenarios = [];
  // Scenariusze: poziom bez miasta, poziom z miastem, utrzymanie z pominieciem nieznanych id, spichlerz w/bez.
  for (const def of DEFS) {
    scenarios.push({ name: `uiLevel-noCity-${def.id}`, run: (p) => p.pinBuildingUiDisplayLevel(def, undefined), fx: { levelOf: LEVELS } });
    scenarios.push({ name: `uiLevel-city-${def.id}`, run: (p) => p.pinBuildingUiDisplayLevel(def, { id: 'c1', ownerId: 1 }), fx: { levelOf: LEVELS, cfg: { getEpoch: () => 3, getUnlockedTechs: () => [] } } });
    scenarios.push({ name: `ownedLevel-${def.id}`, run: (p) => p.pinBuildingOwnedLevel(def, { id: 'c1', ownerId: 1 }), fx: { levelOf: LEVELS, cfg: { getEpoch: () => 3, getUnlockedTechs: () => [] } } });
  }
  scenarios.push({ name: 'upkeep-mix', run: (p) => p.pinSumOwnedBuildingsUpkeep(['koszary', 'spichlerz', 'nieznany'], { buildings: DEFS }, { id: 'c1', ownerId: 1 }), fx: { levelOf: LEVELS, upkeepOf: UPKEEP, cfg: { getEpoch: () => 3, getUnlockedTechs: () => [] } } });
  scenarios.push({ name: 'upkeep-empty', run: (p) => p.pinSumOwnedBuildingsUpkeep([], { buildings: DEFS }, { id: 'c1', ownerId: 1 }), fx: { levelOf: LEVELS, upkeepOf: UPKEEP, cfg: { getEpoch: () => 3, getUnlockedTechs: () => [] } } });
  for (const owner of [1, 2, 3]) {
    scenarios.push({ name: `spichlerz-owner${owner}`, run: (p) => p.pinOwnerHasSpichlerz(owner), fx: { cfg: { getCities: () => CITIES_FIXTURE, getBuiltBuildingIds: (cid) => CITIES_FIXTURE.find((c) => c.id === cid).built } } });
  }

  // Wartosci v2 wyprowadzone z tego samego fixture (DTO).
  const v2Levels = (def) => LEVELS;
  const v2Cities = CITIES_FIXTURE.map((c) => ({ ownerId: c.ownerId, builtIds: c.built }));

  let ok = 0;
  let roznica = 0;
  for (const sc of scenarios) {
    pin.__setS(sc.fx);
    const pinVal = sc.run(pin);
    let v2Val;
    if (sc.name.startsWith('uiLevel-noCity-')) {
      v2Val = v2.buildingUiDisplayLevelFromDto(sc.name.slice('uiLevel-noCity-'.length), undefined);
    } else if (sc.name.startsWith('uiLevel-city-')) {
      v2Val = v2.buildingUiDisplayLevelFromDto(sc.name.slice('uiLevel-city-'.length), LEVELS);
    } else if (sc.name.startsWith('ownedLevel-')) {
      v2Val = v2.buildingOwnedLevelFromDto(sc.name.slice('ownedLevel-'.length), LEVELS);
    } else if (sc.name === 'upkeep-mix') {
      v2Val = v2.sumOwnedBuildingsUpkeepFromDto(['koszary', 'spichlerz', 'nieznany'], UPKEEP);
    } else if (sc.name === 'upkeep-empty') {
      v2Val = v2.sumOwnedBuildingsUpkeepFromDto([], UPKEEP);
    } else if (sc.name.startsWith('spichlerz-owner')) {
      v2Val = v2.ownerHasSpichlerzFromCities(Number(sc.name.slice('spichlerz-owner'.length)), v2Cities);
    } else {
      throw new Error(`nieznany scenariusz ${sc.name}`);
    }
    void v2Levels;
    const same = JSON.stringify(pinVal) === JSON.stringify(v2Val);
    if (same) ok++;
    else roznica++;
    console.log(`${same ? 'OK     ' : 'ROZNICA'} ${sc.name} pin=${JSON.stringify(pinVal)} v2=${JSON.stringify(v2Val)}`);
  }
  console.log(`PRZYPADKI=${scenarios.length} OK=${ok} ROZNICA=${roznica}`);
  process.exit(roznica === 0 ? 0 : 1);
} catch (e) {
  console.error('BLAD HARNESSU:', e && e.stack ? e.stack : e);
  process.exit(2);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
