#!/usr/bin/env node
/**
 * mutate-k06b-units.mjs — mutacje portu jednostek K06B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 1).
 *
 * Dla każdej mutacji: kopia `src/` w katalogu tymczasowym, jedna zamiana tekstu w module `k06b-*.ts`,
 * uruchomienie `run-k06b-units.mjs --v2-dir <kopia>`. Mutacja ZABITA = harness wykrył różnicę (EXIT 1).
 * Mutacja PRZEŻYŁA = harness nie wykrył zmiany (EXIT 0) -> raport, wynik niepełny.
 * Mutacja niezastosowana (tekst nie występuje) -> EXIT 2 harnessu mutacji.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k06b-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje zabite; 1 <=> przeżyła >=1; 2 <=> błąd.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k06b-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const RUNNER = resolve(V2_ROOT, 'tools/dom-harness/run-k06b-units.mjs');

/** Mutacje: plik, tekst do zamiany (dokładnie raz), tekst zastępczy. */
const MUTANTS = [
  { id: 'M1-pinned-garnizon', file: 'k06b-garnizon.ts', from: 'getK06aState().pinnedGarrisonCityId === city.id', to: 'false' },
  { id: 'M2-active-map', file: 'k06b-jednostki.ts', from: 'resolveEmpireSnap(city, getK06aState().activeMap', to: 'resolveEmpireSnap(city, null' },
  { id: 'M3-era-preview', file: 'k06b-kolejki.ts', from: 'const fullEraPreview = getShowEraBuildingPreview();', to: 'const fullEraPreview = false;' },
  { id: 'M4-const-pula-tip', file: 'k06b-jednostki.ts', from: "constStr('PODZIAL_PRACY_PULA_TIP')} Zapas", to: "''} Zapas" },
  { id: 'M5-pin-label-pinned', file: 'k06b-garnizon.ts', from: 'setK06aPinnedGarrisonCityId(cityId);\n  setGarrisonLabelPinned(label, true);', to: 'setK06aPinnedGarrisonCityId(cityId);\n  setGarrisonLabelPinned(label, false);' },
  { id: 'M6-clear-pinned-id', file: 'k06b-garnizon.ts', from: 'setK06aPinnedGarrisonCityId(null);\n  clearPinnedDetail();', to: "setK06aPinnedGarrisonCityId('c9');\n  clearPinnedDetail();" },
  { id: 'M7-owned-card-class', file: 'k06b-jednostki.ts', from: "const card = el('div', 'detail-card');", to: "const card = el('div', 'detail-cardX');" },
  { id: 'M8-queue-city-id', file: 'k06b-kolejki.ts', from: 'getProd(city.id)', to: 'getProd(city.q)' },
];

const tmp = mkdtempSync(join(tmpdir(), 'p58k06b-mut-'));
const results = [];
let exitCode = 0;
try {
  for (const m of MUTANTS) {
    const dir = join(tmp, m.id);
    cpSync(join(V2_ROOT, 'src'), join(dir, 'src'), { recursive: true });
    const path = join(dir, 'src/ui/cityPanel', m.file);
    const src = readFileSync(path, 'utf8');
    const count = src.split(m.from).length - 1;
    if (count < 1) {
      console.error(`MUTACJA ${m.id}: tekst nie występuje w ${m.file}`);
      exitCode = 2;
      continue;
    }
    // wszystkie wystąpienia (split/join), nie tylko pierwsze
    writeFileSync(path, src.split(m.from).join(m.to));
    const r = spawnSync(process.execPath, [RUNNER, '--pin-dir', resolve(PIN_DIR), '--v2-dir', join(dir, 'src/ui/cityPanel')], { encoding: 'utf8', timeout: 300000 });
    const killed = r.status === 1;
    results.push({ id: m.id, file: m.file, status: r.status, killed });
    if (r.status === 2) exitCode = exitCode === 0 ? 2 : exitCode;
    if (r.status === 0 && exitCode === 0) exitCode = 1;
    if (r.status === 1 && exitCode === 0) {
      // zabita: nic nie zmieniamy w kodzie wyjścia
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
const killed = results.filter((x) => x.killed).length;
const survived = results.filter((x) => !x.killed).map((x) => x.id);
console.log(JSON.stringify({ mutants: MUTANTS.length, run: results.length, killed, survived, details: results }, null, 1));
process.exit(exitCode);
