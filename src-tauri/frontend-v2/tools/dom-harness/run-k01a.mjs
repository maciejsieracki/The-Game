#!/usr/bin/env node
/**
 * run-k01a.mjs — harness P5-8 K01A (R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1, runda 3): `src/ui/cityPanel/k01a-fundament.ts`
 * (82 jednostki Fundamentu K01 bez DOM) vs pin `edb8fb56` `gra/src/ui/cityPanel.ts`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-k01a.mjs --pin-dir <PIN_DIR> [--v2 <plik>] [--pomiar <pomiar-r2.json>] [--json <plik>]
 *
 * Bramki (EXIT 0 ⇔ A, B, C, D, E, F, S, T, I, V zielone):
 *   A  tekst: każdy blok `// pin edb8fb56 …:A-B` jest równy liniom A..B pinu po usunięciu `export ` z początku linii
 *      i przycięciu pustych brzegów; bloki rosną i nie nachodzą na siebie.
 *   B  eksport: każda deklaracja najwyższego poziomu w blokach ma `export` (liczba dopisanych `export` — raport).
 *   C  granice: brak importów z game/ data/ map/ render/ types/ units/ oraz brak tokenów DOM w całym pliku; brak importów pakietów.
 *   S  wybór: zbiór bloków = wynik deterministycznego `k01a-select-lib.mjs` (pomiar-r2.json, sha256 sprawdzony).
 *   T  lokalne kopie typów (ZAŁOŻENIE K01A-Z5) są bajtowo równe liniom pinu z `LOCAL_TYPE_COPIES`.
 *   I  importy: każdy import nazwy z v2 istnieje w nagłówku pinu z tym samym modułem (`../X` v2 ↔ `./X` pin).
 *      Nagłówek pinu jest czytany z pinu (nie z v2) — brak kołowości.
 *   V  wartości adaptowanych modułów `ui/` (`uiParams`, `icons/brandAssets`): eksporty używane przez K01A
 *      wołane/porównywane z pinem przy zainstalowanym katalogu pinu.
 *   E  bundle: v2 (esbuild, emulacja Vite z `build.mjs`) i odniesienie pinowe pakowane i importowane.
 *   F  wartości: każdy eksport v2 i pinu wołany z zestawem argumentów (funkcje) lub porównany jako wartość (stałe).
 *      UWAGA: zestaw argumentów NIE jest miarą pokrycia gałęzi (NIE_ZMIERZONO); pole `notMeasuredAllThrow` raportuje
 *      funkcje, które dla żadnego zestawu nie zwróciły wartości.
 *   D  zależności względne `ui/` v2 vs pin (SAME/DIFF) — DIFF dozwolony tylko dla modułów z listy `ADAPTED`
 *      (każda adaptacja ma ID i jest pokryta bramką V).
 *
 * Pinowe odniesienie (`__k01a_pin_ref.ts`) powstaje w `<PIN_DIR>/gra/src/ui/` (katalog kopii pinu, nie repo):
 * nagłówek = dosłowne instrukcje `import` z pinu, ciała = bloki pinu z `export` na deklaracjach.
 * EXIT 2 ⇔ błąd samego harnessu (brak argumentów/plików pinu/pomiaru).
 */
import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundle } from './build.mjs';
import { selectK01a, loadPomiar, LOCAL_TYPE_COPIES, PIN_ID, K01_BLOCK, parseImports, DOM_TOKENS } from './k01a-select-lib.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const V2_FILE = resolve(argOf('--v2') ?? fileURLToPath(new URL('../../src/ui/cityPanel/k01a-fundament.ts', import.meta.url)));
const JSON_OUT = argOf('--json');
const POMIAR = resolve(
  argOf('--pomiar') ??
    fileURLToPath(new URL('../../../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/pomiar-r2.json', import.meta.url)),
);
const V2_SRC = resolve(dirname(V2_FILE), '../..');
const PIN_SRC = PIN_DIR ? resolve(PIN_DIR, 'gra/src') : '';
const PIN_CP = PIN_DIR ? join(PIN_SRC, 'ui/cityPanel.ts') : '';
const PIN_REF = join(PIN_SRC, 'ui/__k01a_pin_ref.ts');
const EXPECT_BLOCKS = 82;
/** Adaptacje P5.2 modułów `ui/` (D/V): DIFF dozwolony tylko tu. Każda ma ID i opis. */
const ADAPTED = {
  '../uiParams': 'P5.2-ADAPT-1: JSON `gra/data/ui-params.json` -> `staticCatalog().uiParams` (ZAŁOŻENIE P5.2-Z1)',
  '../icons/brandAssets': 'P5.2-ADAPT-2: `categoryOf` -> `unitCategoryFromCatalog` (ścieżka kategorii niewołana przez K01A)',
};

if (!PIN_DIR || !existsSync(PIN_CP)) {
  console.error('Użycie: node tools/dom-harness/run-k01a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56> [--v2 <plik>] [--pomiar <json>]');
  process.exit(2);
}
if (!existsSync(POMIAR)) {
  console.error(`brak pomiaru: ${POMIAR}`);
  process.exit(2);
}

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const trimBlank = (arr) => {
  const a = [...arr];
  while (a.length && a[0].trim() === '') a.shift();
  while (a.length && a[a.length - 1].trim() === '') a.pop();
  return a;
};
const noExport = (l) => l.replace(/^export /, '');
const DECL = /^(export\s+)?(declare\s+)?(const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/;
const RUNTIME_DECL = /^(export\s+)?(const|let|var|function|class|enum)\s+([A-Za-z_$][\w$]*)/;
function findFile(dir, base) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const r = findFile(p, base);
      if (r) return r;
    } else if (name === base) return p;
  }
  return null;
}

const gates = { A: null, B: null, C: null, S: null, T: null, I: null, V: null, E: null, F: null };
const report = { pin: PIN_ID, v2: relative(V2_SRC, V2_FILE), gates, details: {} };
const log = (...a) => console.log(...a);

// ─── A, B: bloki i eksporty ─────────────────────────────────────────────────
const MARK = new RegExp(`^// pin ${PIN_ID} gra/src/ui/cityPanel\\.ts:(\\d+)-(\\d+)\\s*$`);
const v2Lines = readFileSync(V2_FILE, 'utf8').split(/\r?\n/);
const pinLines = readFileSync(PIN_CP, 'utf8').split(/\r?\n/);
const header = [];
const blocks = [];
const badMarkers = [];
let cur = null;
v2Lines.forEach((line, idx) => {
  const m = MARK.exec(line);
  if (m) {
    cur = { a: +m[1], b: +m[2], line: idx + 1, body: [] };
    blocks.push(cur);
    return;
  }
  if (/^\/\/ pin /.test(line)) badMarkers.push(idx + 1);
  if (cur) cur.body.push(line);
  else header.push(line);
});

const textMismatch = [];
let exportsAdded = 0;
const exportMissing = [];
let overlap = 0;
let prevB = 0;
let declCount = 0;
let pinBlockLines = 0;
const runtimeNames = new Set();
blocks.forEach((blk, i) => {
  if (blk.a <= prevB) overlap++;
  prevB = blk.b;
  const v2 = trimBlank(blk.body);
  const pin = trimBlank(pinLines.slice(blk.a - 1, blk.b));
  pinBlockLines += blk.b - blk.a + 1;
  const n = Math.max(v2.length, pin.length);
  let first = -1;
  for (let k = 0; k < n; k++) {
    if (v2[k] === undefined || pin[k] === undefined || noExport(v2[k]) !== noExport(pin[k])) {
      first = k;
      break;
    }
  }
  if (first >= 0 || v2.length !== pin.length) {
    textMismatch.push({ block: i + 1, pinRange: `${blk.a}-${blk.b}`, v2Line: blk.line, at: first, v2: v2[first] ?? null, pin: pin[first] ?? null });
  }
  for (const l of v2) {
    const d = DECL.exec(l);
    if (!d) continue;
    declCount++;
    const pinDecl = pin.find((p) => DECL.exec(p) && DECL.exec(p)[4] === d[4]);
    if (!d[1]) exportMissing.push(d[4]);
    if (d[1] && pinDecl && !/^export /.test(pinDecl)) exportsAdded++;
    if (d[1] && RUNTIME_DECL.exec(l)) runtimeNames.add(d[4]);
  }
});
gates.A = textMismatch.length === 0 && overlap === 0 && badMarkers.length === 0 && blocks.length === EXPECT_BLOCKS;
report.details.A = { blocks: blocks.length, expect: EXPECT_BLOCKS, mismatches: textMismatch.slice(0, 10), mismatchCount: textMismatch.length, overlap, badMarkers, pinLinesCovered: pinBlockLines };
gates.B = exportMissing.length === 0;
report.details.B = { declarations: declCount, exportMissing, exportsAddedVsPin: exportsAdded, runtimeExports: runtimeNames.size };

// ─── C: granice ──────────────────────────────────────────────────────────────
const DOM_RX = DOM_TOKENS; // wspólny zbiór z k01a-select-lib (wybór i gate C używają tych samych tokenów)
const FORBIDDEN_IMPORT = /from\s+['"](?:\.\.\/)+(?:game|data|map|render|types|units)\/|from\s+['"](?:\.\.\/)*(?:controller|viewmodel)\//;
const domHits = [];
const logicImports = [];
v2Lines.forEach((l, idx) => {
  if (/^\s*\/\//.test(l)) return;
  for (const rx of DOM_RX) if (rx.test(l)) domHits.push({ line: idx + 1, rx: String(rx), text: l.trim().slice(0, 120) });
});
const fullText = v2Lines.join('\n');
if (FORBIDDEN_IMPORT.test(fullText)) logicImports.push(fullText.match(FORBIDDEN_IMPORT)[0]);
const importSpecs = [...fullText.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const bareImports = importSpecs.filter((s) => !s.startsWith('.'));
gates.C = domHits.length === 0 && logicImports.length === 0 && bareImports.length === 0;
report.details.C = { domHits: domHits.slice(0, 10), domHitCount: domHits.length, logicImports, bareImports };

// ─── S: wybór jednostek (deterministyczny skrypt) ───────────────────────────
const pomiar = loadPomiar(POMIAR);
const sel = selectK01a({ pinDir: PIN_DIR, pomiar });
const selRanges = sel.selected.map((u) => `${u.a}-${u.b}`);
const blkRanges = blocks.map((b) => `${b.a}-${b.b}`);
const sameSel = selRanges.length === blkRanges.length && selRanges.every((r, i) => r === blkRanges[i]);
gates.S = sameSel && sel.selected.length === EXPECT_BLOCKS;
report.details.S = {
  pomiar: relative(process.cwd(), POMIAR),
  selected: sel.selected.length,
  selectedLoc: sel.selectedLoc,
  deferred: sel.deferred.length,
  deferredLoc: sel.deferredLoc,
  k01Units: sel.k01Units,
  k01Loc: sel.k01Loc,
  domUnits: sel.domUnits,
  domLoc: sel.domLoc,
  onlyInSelection: selRanges.filter((r) => !blkRanges.includes(r)),
  onlyInFile: blkRanges.filter((r) => !selRanges.includes(r)),
};

// ─── T: lokalne kopie typów (ZAŁOŻENIE K01A-Z5) ─────────────────────────────
const typeMismatch = [];
for (const tc of LOCAL_TYPE_COPIES) {
  const want = readFileSync(join(PIN_DIR, tc.pin), 'utf8').split(/\r?\n/).slice(tc.a - 1, tc.b);
  const at = v2Lines.findIndex((l) => l.includes(`pin ${PIN_ID} ${tc.pin}:${tc.a}-${tc.b}`));
  if (at < 0) {
    typeMismatch.push({ type: tc.name, why: 'brak markera kopii' });
    continue;
  }
  const got = [];
  for (let k = at + 1; k < v2Lines.length && v2Lines[k].trim() !== ''; k++) got.push(v2Lines[k]);
  if (got.length !== want.length || got.some((l, k) => l !== want[k])) typeMismatch.push({ type: tc.name, why: 'tekst kopii != pin' });
}
gates.T = typeMismatch.length === 0;
report.details.T = { copies: LOCAL_TYPE_COPIES.map((t) => `${t.name}@${t.pin}:${t.a}-${t.b}`), typeMismatch };

// ─── I: importy v2 vs nagłówek pinu ─────────────────────────────────────────
const pinHeaderLines = pinLines.slice(0, sel.headerLines);
const pinHeaderText = pinHeaderLines.join('\n');
const v2HeaderText = header.join('\n');
const pinImp = parseImports(pinHeaderText);
const v2Imp = parseImports(v2HeaderText);
const importMismatch = [];
for (const [name, { spec }] of v2Imp) {
  const pinSpec = spec.replace(/^\.\.\//, './');
  const p = pinImp.get(name);
  if (!p || p.spec !== pinSpec) importMismatch.push({ name, v2: spec, pin: p?.spec ?? null });
}
gates.I = importMismatch.length === 0;
report.details.I = { v2Imports: v2Imp.size, pinImports: pinImp.size, importMismatch };

// ─── D: zależności względne vs pin (ADAPTED = dozwolone DIFF z ID) ──────────
const relImports = [...new Set(importSpecs.filter((s) => s.startsWith('.')))];
const sha2 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
report.details.D = relImports.map((spec) => {
  const base = resolve(dirname(V2_FILE), spec);
  const v2p = [base + '.ts', join(base, 'index.ts'), base].find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
  // Plik v2 leży w ui/cityPanel/, pin cityPanel.ts w ui/: `../X` (v2) ↔ `./X` (pin).
  const pinBase = resolve(PIN_SRC, 'ui', spec.replace(/^\.\.\//, './'));
  const pinp = [pinBase + '.ts', join(pinBase, 'index.ts'), pinBase].find((p) => existsSync(p) && statSync(p).isFile()) ?? null;
  const status = !v2p ? 'BRAK_V2' : !pinp ? 'BRAK_PIN' : sha2(v2p) === sha2(pinp) ? 'SAME' : 'DIFF';
  return { spec, v2: v2p ? relative(V2_SRC, v2p) : null, status, adapted: ADAPTED[spec] ?? null };
});
const dOk = report.details.D.every((d) => d.status === 'SAME' || (d.status === 'DIFF' && d.adapted));

// ─── E, F, V: bundle, wartości ───────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'k01a-harness-'));
const outV2 = join(tmp, 'v2');
const outPin = join(tmp, 'pin');
let exitCode = 0;
try {
  // Odniesienie pinowe: dosłowne instrukcje import z nagłówka pinu + bloki pinu z `export` na deklaracjach.
  const pinImportLines = [];
  for (const m of pinHeaderText.matchAll(/^import[\s\S]*?from\s*'[^']+';?$/gm)) pinImportLines.push(m[0]);
  const pinBody = [];
  for (const blk of blocks) {
    for (const l of trimBlank(pinLines.slice(blk.a - 1, blk.b))) {
      pinBody.push(DECL.test(l) && !/^export /.test(l) ? 'export ' + l : l);
    }
    pinBody.push('');
  }
  // Typy lokalne (OkolicaFocus/BudowaFocus) są w pinie importowane z game/cities: nie trzeba ich kopiować.
  writeFileSync(PIN_REF, [...pinImportLines, ...pinBody].join('\n'));
  let eOk = true;
  let eErr = null;
  try {
    await bundle([V2_FILE, join(V2_SRC, 'controller/staticCatalog.ts'), join(V2_SRC, 'ui/uiParams.ts'), join(V2_SRC, 'ui/icons/brandAssets.ts')], outV2);
    // Drugi wpis (formatPl z tego samego katalogu) ustala wspólną bazę wyjścia: <outPin>/__k01a_pin_ref.js.
    await bundle([PIN_REF, join(PIN_SRC, 'ui/formatPl.ts'), join(PIN_SRC, 'ui/uiParams.ts'), join(PIN_SRC, 'ui/icons/brandAssets.ts')], outPin);
  } catch (e) {
    eOk = false;
    eErr = String(e?.message ?? e).split('\n').slice(0, 6).join(' | ');
  }
  gates.E = eOk;
  report.details.E = { bundled: eOk, error: eErr };

  if (eOk) {
    const SC = await import(pathToFileURL(findFile(outV2, 'staticCatalog.js')).href);
    const uiParamsPin = JSON.parse(readFileSync(join(PIN_DIR, 'gra/data/ui-params.json'), 'utf8'));
    SC.installStaticCatalog({ uiParams: uiParamsPin });
    const V = await import(pathToFileURL(findFile(outV2, 'k01a-fundament.js')).href);
    const P = await import(pathToFileURL(findFile(outPin, '__k01a_pin_ref.js')).href);

    const ser = (v) => {
      if (typeof v === 'function') return 'fn:' + v.name;
      if (v === undefined) return '__undef__';
      if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
      if (v instanceof Set) return { set: [...v].map(ser) };
      if (v instanceof Map) return { map: [...v].map(([k, x]) => [ser(k), ser(x)]) };
      if (Array.isArray(v)) return v.map(ser);
      if (v && typeof v === 'object') {
        const o = {};
        for (const k of Object.keys(v).sort()) o[k] = ser(v[k]);
        return o;
      }
      return v;
    };
    const callOut = (fn, a) => {
      try {
        return 'ok:' + JSON.stringify(ser(fn(...structuredClone(a))));
      } catch (e) {
        return 'err:' + e?.name + ':' + String(e?.message ?? e).slice(0, 120);
      }
    };
    const OBJ = { label: 'Zboze', met: true, iconHtml: '<i>x</i>', value: '3', icon: 'food', id: 'food', nazwa: 'Zboze', wzrost: 12, ilosc: 3, kind: 'building', hint: 'h', cls: 'c', text: 'Tekst', max: 5 };
    const ARG_SETS = [
      [], [0], [1], [-1.5], [1234567.891], [NaN], [null], [true], ['x'], [''], ['food'], ['drewno'], ['drewno', 24], ['okolica'], ['budowa'],
      [5, 2], [5, 2, true], [null, '~'], [12, true], ['tur', 14], [-3, 'x'], ['Zboze', 'pl', 'cls', 'hint', 'food', true],
      [[OBJ]], [OBJ], [[]], [{}], [OBJ, 'food', 3], ['Ludność', 'pl', true],
    ];

    // F: eksporty K01A (v2) vs eksporty pinowego odniesienia.
    const names = [...new Set([...Object.keys(V), ...Object.keys(P)])].sort();
    const diffs = [];
    const perName = {};
    let cases = 0;
    let diffCount = 0;
    const notMeasured = [];
    const compareFn = (label, fv, fp, store) => {
      let okAny = false;
      for (const a of ARG_SETS) {
        cases++;
        const x = callOut(fv, a);
        const y = callOut(fp, a);
        if (x.startsWith('ok:')) okAny = true;
        if (x !== y) {
          diffCount++;
          if (store.length < 20) store.push({ name: label, args: JSON.stringify(a), v2: x.slice(0, 160), pin: y.slice(0, 160) });
        }
      }
      if (!okAny) notMeasured.push(label);
    };
    for (const name of names) {
      if (!(name in V) || !(name in P)) {
        diffCount++;
        diffs.push({ name, why: name in V ? 'brak w pinie' : 'brak w v2' });
        continue;
      }
      const fv = V[name];
      const fp = P[name];
      if (typeof fv !== typeof fp) {
        diffCount++;
        diffs.push({ name, why: `typ ${typeof fv} vs ${typeof fp}` });
        continue;
      }
      if (typeof fv === 'function') {
        compareFn(name, fv, fp, diffs);
        perName[name] = 'fn';
      } else {
        cases++;
        const x = JSON.stringify(ser(fv));
        const y = JSON.stringify(ser(fp));
        if (x !== y) {
          diffCount++;
          if (diffs.length < 20) diffs.push({ name, v2: x.slice(0, 160), pin: y.slice(0, 160) });
        }
        perName[name] = 'const';
      }
    }
    gates.F = diffCount === 0 && names.length > 0;
    report.details.F = {
      exportNames: names.length,
      functions: Object.values(perName).filter((t) => t === 'fn').length,
      constants: Object.values(perName).filter((t) => t === 'const').length,
      argSets: ARG_SETS.length,
      cases,
      diffCount,
      diffs,
      notMeasuredAllThrow: notMeasured,
      coverage: 'NIE_ZMIERZONO (zestaw argumentów nie jest miarą pokrycia gałęzi)',
    };

    // V: adaptowane moduły ui/ — wartości eksportów używanych przez K01A, v2 vs pin, przy tym samym katalogu.
    const usedFrom = (spec) => [...v2Imp].filter(([, x]) => x.spec === spec).map(([n]) => n);
    const VU = findFile(outV2, 'uiParams.js');
    const VB = findFile(outV2, 'brandAssets.js');
    const PU = findFile(outPin, 'uiParams.js');
    const PB = findFile(outPin, 'brandAssets.js');
    const vDiffs = [];
    let vCases = 0;
    try {
      const vU = await import(pathToFileURL(VU).href);
      const pU = await import(pathToFileURL(PU).href);
      vCases++;
      const x = JSON.stringify(ser(vU.UI_PARAMS));
      const y = JSON.stringify(ser(pU.UI_PARAMS));
      if (x !== y) vDiffs.push({ module: '../uiParams', name: 'UI_PARAMS', why: 'wartość różna' });
      const vB = await import(pathToFileURL(VB).href);
      const pB = await import(pathToFileURL(PB).href);
      for (const name of usedFrom('../icons/brandAssets').filter((n) => typeof vB[n] === 'function')) {
        if (typeof pB[name] !== 'function') {
          vDiffs.push({ module: '../icons/brandAssets', name, why: 'brak funkcji w pinie' });
          continue;
        }
        compareFn('brandAssets.' + name, vB[name], pB[name], vDiffs);
      }
      gates.V = vDiffs.length === 0;
      report.details.V = { cases: vCases, usedFromBrandAssets: usedFrom('../icons/brandAssets'), usedFromUiParams: usedFrom('../uiParams'), vDiffs };
    } catch (e) {
      gates.V = false;
      report.details.V = { error: String(e?.message ?? e).split('\n').slice(0, 4).join(' | ') };
    }
  } else {
    gates.F = false;
    gates.V = false;
    report.details.F = { skipped: 'E niezielone' };
    report.details.V = { skipped: 'E niezielone' };
  }
} catch (e) {
  gates.F = false;
  gates.V = false;
  report.details.F = { error: String(e?.message ?? e).split('\n').slice(0, 6).join(' | ') };
} finally {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(PIN_REF, { force: true });
}

// ─── wynik ───────────────────────────────────────────────────────────────────
gates.D = dOk;
const GATES_REQ = ['A', 'B', 'C', 'D', 'S', 'T', 'I', 'V', 'E', 'F'];
const failed = GATES_REQ.filter((g) => !gates[g]);
exitCode = failed.length === 0 ? 0 : 1;
log(`run-k01a: pin=${PIN_ID} v2=${report.v2}`);
log(`A tekst blokow: ${gates.A ? 'OK' : 'FAIL'} (bloki ${blocks.length}/${EXPECT_BLOCKS}, rozbieznosci ${textMismatch.length}, nachodzace ${overlap}, zle markery ${badMarkers.length}, linie pinu ${pinBlockLines})`);
log(`B eksporty: ${gates.B ? 'OK' : 'FAIL'} (deklaracje ${declCount}, brak export ${exportMissing.length}, dopisane export ${exportsAdded})`);
log(`C granice: ${gates.C ? 'OK' : 'FAIL'} (trafienia DOM ${domHits.length}, importy logiki ${logicImports.length}, importy pakietow ${bareImports.length})`);
log(`S wybor (k01a-select-lib, pomiar sha OK): ${gates.S ? 'OK' : 'FAIL'} (wybrane ${sel.selected.length}/${sel.selectedLoc} LOC, odroczone ${sel.deferred.length}/${sel.deferredLoc} LOC, K01 ${sel.k01Units}/${sel.k01Loc} LOC, DOM ${sel.domUnits}/${sel.domLoc} LOC; tylko w wyborze ${report.details.S.onlyInSelection.length}, tylko w pliku ${report.details.S.onlyInFile.length})`);
log(`T typy lokalne (ZAŁOŻENIE K01A-Z5): ${gates.T ? 'OK' : 'FAIL'} (${report.details.T.copies.join(', ')})`);
log(`I importy v2 vs pin: ${gates.I ? 'OK' : 'FAIL'} (v2 ${v2Imp.size}, pin ${pinImp.size}, niezgodne ${importMismatch.length})`);
log(`D zaleznosci ui/ vs pin: ${dOk ? 'OK' : 'FAIL'} ${report.details.D.map((d) => `${d.spec}=${d.status}${d.adapted ? '[' + d.adapted.split(':')[0] + ']' : ''}`).join(', ')}`);
log(`V wartosci adaptowanych modulow ui/: ${gates.V ? 'OK' : 'FAIL'} ${JSON.stringify({ ...report.details.V, vDiffs: report.details.V?.vDiffs?.slice(0, 3) })}`);
log(`E bundle: ${gates.E ? 'OK' : 'FAIL'}${report.details.E.error ? ' ' + report.details.E.error : ''}`);
log(`F wartosci: ${gates.F ? 'OK' : 'FAIL'} ${JSON.stringify({ ...report.details.F, diffs: undefined, notMeasuredAllThrow: report.details.F.notMeasuredAllThrow?.length })}`);
if (report.details.F?.diffs?.length) log('F roznice (pierwsze):', JSON.stringify(report.details.F.diffs.slice(0, 5), null, 1));
if (textMismatch.length) log('A pierwsze rozbieznosci:', JSON.stringify(textMismatch.slice(0, 3), null, 1));
if (importMismatch.length) log('I niezgodnosci:', JSON.stringify(importMismatch.slice(0, 5)));
log(`WYNIK: ${exitCode === 0 ? 'ZIELONE (A,B,C,D,S,T,I,V,E,F)' : 'CZERWONE: ' + failed.join(',')}`);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...report, gates, exitCode }, null, 2));
process.exitCode = exitCode;
