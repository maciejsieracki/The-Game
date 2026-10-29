#!/usr/bin/env node
/**
 * mutate-k08d-handel.mjs — mutacje punktowe kopii K08D (partie `handel`, `slider`) i delegatów `k08d-deps.ts`
 * (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1).
 *
 * Każda mutacja: podmiana JEDNEGO literału w pliku, uruchomienie bramki `verify-k08d-copies.mjs` i harnessu
 * `run-k08d-handel-pin.mjs`; mutacja ZABITA, gdy któraś z nich zwraca EXIT != 0. Plik jest przywracany bajt w bajt
 * (porównanie z kopią w pamięci). Uwaga: mutacje `k08d-deps.ts` są wykrywane tylko przez kotwice pinu
 * (`deps.accusative.*`), bo pin-exec i port dzielą ten moduł.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08d-handel.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje ZABITE.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const V2 = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k08d-handel.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const CP = join(V2, 'src/ui/cityPanel');
const FILES = {
  handel: join(CP, 'k08d-handel.ts'),
  slider: join(CP, 'k08d-slider.ts'),
  deps: join(CP, 'k08d-deps.ts'),
};

/** [plik, literał oryginalny, literał zmutowany, opis] — literał oryginalny musi wystąpić dokładnie raz. */
const MUTATIONS = [
  ['handel', "if (ids.includes('mennica')) return true;", "if (ids.includes('mennica_x')) return true;", 'ownerHasMennica: inny id budynku'],
  ['handel', "if (route.status !== 'polaczony') continue;", "if (route.status !== 'x') continue;", 'activeTradeRouteCountForCity: status trasy'],
  ['handel', "if (!route.budynekOdblokowany) continue;", 'if (false) continue;', 'activeTradeRouteCountForCity: pomija warunek budynku'],
  ['handel', 'Bez Targowiska — tylko plony z terenu.', 'Bez Targowiska — inny tekst.', 'buildHandelDetailCard: tekst algorytmu'],
  ['slider', "label: 'Pieniądz'", "label: 'Pieniadz'", 'renderHandelSlidersPanel: etykieta chipu'],
  ['deps', "=> 'podatek';", "=> 'podatki';", 'daninaLabelAccusative: stała (kotwica pinu)'],
];

/**
 * DTO / cfg (K08D-Z2, K08D-Z3) — mutacje POLA, tryb 'harness': bramka tekstu (verify) pominięta celowo, bo każda zmiana
 * linii kopii łapie ją już na poziomie TEXT. Zabicie = wyłącznie harness wykonawczy (pin vs port, scenariusze z
 * argumentowo-czułymi atrapami). Każda mutacja zmienia JEDNO odczytywane pole/klucz.
 */
const FIELD_MUTATIONS = [
  ['handel', 'cfg.getCivKey?.(city.ownerId)', 'cfg.getCivKey?.(city.id)', 'cfg.getCivKey: zły klucz (ownerId -> id miasta)'],
  ['handel', "cfgK08dRequired(cfg, 'getOwnerHasZlotoAccess')(city.ownerId)", "cfgK08dRequired(cfg, 'getOwnerHasZlotoAccess')(city.id)", 'cfg.getOwnerHasZlotoAccess: zły klucz'],
  ['handel', 'cfg.data?.civs, cfg.difficulty', 'undefined, cfg.difficulty', 'cfg.data.civs: pole pominięte'],
  ['handel', "buildEconParams(data, cfg.difficulty ?? 'normal')", "buildEconParams(data, 'easy')", 'cfg.difficulty: pole zastąpione stałą'],
  ['handel', 'if (route.fromCityId === city.id || route.toCityId === city.id) n++;', 'if (route.fromCityId === city.id) n++;', 'TradeRouteK05bDto.toCityId: pominięte w liczniku'],
  ['handel', 'computeTradeRouteBuildingBonusByCity(cfg.getTradeRoutes?.() ?? []).get(city.id)', 'computeTradeRouteBuildingBonusByCity(cfg.getTradeRoutes?.() ?? []).get(city.ownerId)', 'premia: zły klucz mapy'],
  ['handel', 'computeTradeRouteBuildingBonusByCity(cfg.getTradeRoutes?.() ?? [])', 'computeTradeRouteBuildingBonusByCity([])', 'cfg.getTradeRoutes: pole pominięte w premii'],
  ['handel', 'const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];', 'const built = cfg.getBuiltBuildingIds?.(city.ownerId) ?? [];', 'cfg.getBuiltBuildingIds: zły klucz'],
  ['handel', 'const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];', 'const techs = cfg.getUnlockedTechs?.(city.id) ?? [];', 'cfg.getUnlockedTechs: zły klucz'],
];

const runCheck = (cmd, argv) => {
  try {
    execFileSync(cmd, argv, { cwd: V2, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return typeof e.status === 'number' ? e.status : 2;
  }
};

const verifyBatch = (batch) => runCheck('node', ['tools/dom-harness/verify-k08d-copies.mjs', '--pin-dir', PIN_DIR, '--batch', batch]);
const harness = () => runCheck('node', ['tools/dom-harness/run-k08d-handel-pin.mjs', '--pin-dir', PIN_DIR]);

// Baseline: wszystko zielone przed mutacjami.
const base = { handel: verifyBatch('handel'), slider: verifyBatch('slider'), harness: harness() };
if (base.handel !== 0 || base.slider !== 0 || base.harness !== 0) {
  console.error(`BASELINE FAIL: ${JSON.stringify(base)}`);
  process.exit(1);
}
console.log(`baseline: verify handel=0 slider=0, pin-exec=0`);

let killed = 0;
for (const [key, from, to, desc] of MUTATIONS) {
  const file = FILES[key];
  const orig = readFileSync(file, 'utf8');
  const count = orig.split(from).length - 1;
  if (count !== 1) {
    console.log(`SKIP ${desc}: literał wystąpił ${count} razy (oczekiwano 1)`);
    continue;
  }
  let rc;
  try {
    writeFileSync(file, orig.split(from).join(to));
    const v = key === 'deps' ? 0 : verifyBatch(key === 'handel' ? 'handel' : 'slider');
    const h = harness();
    rc = { verify: v, harness: h };
  } finally {
    writeFileSync(file, orig);
  }
  if (readFileSync(file, 'utf8') !== orig) {
    console.error(`PRZYWRACANIE NIEUDANE: ${file}`);
    process.exit(2);
  }
  const isKilled = rc.verify !== 0 || rc.harness !== 0;
  if (isKilled) killed++;
  console.log(`${isKilled ? 'ZABITA' : 'PRZEZYTA'} ${desc} | verify=${rc.verify} harness=${rc.harness}`);
}
let fieldKilled = 0;
for (const [key, from, to, desc] of FIELD_MUTATIONS) {
  const file = FILES[key];
  const orig = readFileSync(file, 'utf8');
  const count = orig.split(from).length - 1;
  if (count !== 1) {
    console.log(`BLAD-MUTANTA ${desc}: literał wystąpił ${count} razy`);
    process.exit(2);
  }
  let h;
  try {
    writeFileSync(file, orig.split(from).join(to));
    h = harness();
  } finally {
    writeFileSync(file, orig);
  }
  if (readFileSync(file, 'utf8') !== orig) {
    console.error(`PRZYWRACANIE NIEUDANE: ${file}`);
    process.exit(2);
  }
  const isKilled = h !== 0;
  if (isKilled) fieldKilled++;
  console.log(`${isKilled ? 'ZABITA' : 'PRZEZYTA'} [pole, harness-only] ${desc} | harness=${h}`);
}
console.log(`\nmutacje k08d: ZABITE ${killed}/${MUTATIONS.length}`);
console.log(`mutacje pól DTO/cfg k08d: ZABITE ${fieldKilled}/${FIELD_MUTATIONS.length}`);
process.exit(killed === MUTATIONS.length && fieldKilled === FIELD_MUTATIONS.length ? 0 : 1);
