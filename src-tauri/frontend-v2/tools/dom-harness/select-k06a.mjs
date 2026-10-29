#!/usr/bin/env node
/**
 * select-k06a.mjs — deterministyczny wybór jednostek K06A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1; r2 = tryb --r3, zob. dossier §7).
 * Logika: `k01a-select-lib.mjs` z parametrem `block` = 5 (K05 wg pomiaru r2, 45 jednostek), lokalne kopie i DTO-podstawienia K05A-Z1/Z2.
 *
 * Tryb `--r3` (obrona zarzutu 4): wybór rundy 3 = wybór r2 (8) ∪ odroczone klasy T i P (18) = 26 jednostek bez DOM.
 * Zapis do `r3-logi/` (domyślnie); `kind` (const/function) wyprowadzany z linii deklaracji w pinie; LOC wg tego skryptu.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/select-k06a.mjs --pin-dir <PIN_DIR> [--pomiar <pomiar-r2.json>] [--out-dir <katalog>] [--r3 | --k06b]
 * Tryb `--k06b` (K06B r2): wybór = jednostki DOM bloku K06 (`reason = DOM`), zapis do `R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1/r2-logi/`.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectK01a, loadPomiar } from './k01a-select-lib.mjs';

const K06_BLOCK = 6;
/** K05A-Z1: lokalne kopie typów/enum z pinu (zweryfikowane bajtowo przez verify-k05a-copies.mjs). */
/** K05A-Z2: parametr `City` w danej jednostce zastąpiony DTO `CityHexRef` (weryfikuje verify-k05a-copies.mjs). */
const K06A_LOCAL_COPIES = [];
const K06A_DTO_SUBST = {};
const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/select-k05a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const POMIAR = resolve(
  argOf('--pomiar') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1/r1-logi/pomiar-r2.json', import.meta.url)),
);
const R3 = args.includes('--r3');
/** Tryb `--k06b` (zarzut 4 Evaluatora, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1 r2): wybór = jednostki DOM bloku K06 (`reason = DOM`), czyli dopełnienie K06A. */
const K06B = args.includes('--k06b');
const OUT = resolve(
  argOf('--out-dir') ??
    fileURLToPath(
      new URL(
        K06B
          ? '../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1/r2-logi'
          : '../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1/r1-logi',
        import.meta.url,
      ),
    ),
);

const r = selectK01a({ pinDir: resolve(PIN_DIR), pomiar: loadPomiar(POMIAR), block: K06_BLOCK, localTypes: K06A_LOCAL_COPIES, dtoSubst: K06A_DTO_SUBST });
let selected = r.selected;
let deferred = r.deferred;
if (R3) {
  const isTP = (d) => /^(T|P):/.test(d.reason);
  const pinSrc = readFileSync(resolve(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
  const extra = r.deferred.filter(isTP).map((d) => ({
    name: d.name,
    a: d.a,
    b: d.b,
    loc: d.loc,
    kind: /^(export )?let /.test(pinSrc[d.a - 1]) ? 'let' : /^(export )?const /.test(pinSrc[d.a - 1]) ? 'const' : 'function',
  }));
  selected = [...r.selected, ...extra];
  deferred = r.deferred.filter((d) => !isTP(d));
}
if (K06B) {
  const pinSrc = readFileSync(resolve(PIN_DIR, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
  const isDom = (d) => d.reason === 'DOM';
  selected = r.deferred.filter(isDom).map((d) => ({
    name: d.name,
    a: d.a,
    b: d.b,
    loc: d.loc,
    kind: /^(export )?let /.test(pinSrc[d.a - 1]) ? 'let' : /^(export )?const /.test(pinSrc[d.a - 1]) ? 'const' : 'function',
  }));
  deferred = r.deferred.filter((d) => !isDom(d));
}
const sumLoc = (xs) => xs.reduce((acc, x) => acc + x.loc, 0);
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'wybrane.json'), JSON.stringify(selected, null, 1) + '\n');
writeFileSync(resolve(OUT, 'odroczone.json'), JSON.stringify(deferred, null, 1) + '\n');
const reasons = {};
for (const d of deferred) {
  const k = d.reason.split(':')[0];
  reasons[k] = (reasons[k] ?? 0) + 1;
}
const summary = {
  mode: K06B ? 'k06b' : R3 ? 'r3' : 'r2',
  pin: r.pin,
  block: K06_BLOCK,
  pinUnits: r.pinUnits,
  k06Units: r.k01Units,
  k06Loc: r.k01Loc,
  domUnits: r.domUnits,
  domLoc: r.domLoc,
  selectedUnits: selected.length,
  selectedLoc: sumLoc(selected),
  deferredUnits: deferred.length,
  deferredLoc: sumLoc(deferred),
  deferredByClass: reasons,
  missingInPin: r.missingInPin,
};
writeFileSync(resolve(OUT, 'podsumowanie.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
console.log(`zapisano: ${OUT}`);
