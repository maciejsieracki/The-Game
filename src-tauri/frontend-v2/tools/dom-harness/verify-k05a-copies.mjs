#!/usr/bin/env node
/**
 * verify-k05a-copies.mjs — bramka wierności KOPII tekstowych K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, runda 2).
 *
 * Wzorzec: `verify-k01b-copies.mjs`. Każdy blok w `src/ui/cityPanel/k05a-fundament.ts` jest poprzedzony markerem
 * `// pin edb8fb56 gra/src/<plik>:A-B`; treść bloku (do następnego markera lub końca pliku) musi być identyczna z liniami
 * A..B pinu, łącznie z komentarzami dokumentacyjnymi. Jedyne dozwolone różnice:
 *   - `export ` na początku linii (po obu stronach; zob. nagłówek portu),
 *   - podstawienia z listy SUBST (K05A-Z2: `city: City,` → `city: CityHexRef,` w okolicaPreviewRadius).
 *
 * Bramka (EXIT 0 ⇔ wszystkie poniższe):
 *   TEXT    każdy blok = pin A..B po normalizacji (puste linie końcowe pomijane);
 *   ORPHAN  żaden blok ani komentarz poza blokiem nie kończy się komentarzem bez deklaracji (osierocony komentarz);
 *   COVER   zbiór deklaracji najwyższego poziomu w porcie = `wybrane.json` (jednostki) ∪ lokalne kopie K05A-Z1/Z2;
 *   LOCAL   lokalne kopie (`TerenBazowy`, `OkolicaTryb`) i typ DTO `CityHexRef` są jedynymi deklaracjami spoza pinu.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k05a-copies.mjs --pin-dir <PIN_DIR> [--wybrane <wybrane.json>] [--json <plik>]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
const PORT = resolve(argOf('--port') ?? join(FRONT, 'src/ui/cityPanel/k05a-fundament.ts'));
const WYBRANE = resolve(
  argOf('--wybrane') ?? join(FRONT, '../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1/r3-logi/wybrane.json'),
);
if (!PIN_DIR || !existsSync(join(PIN_DIR, 'gra/src'))) {
  console.error('Użycie: node tools/dom-harness/verify-k05a-copies.mjs --pin-dir <PIN_DIR> [--wybrane <plik>] [--json <plik>]');
  process.exit(2);
}

/** Podstawienia udokumentowane (K05A-Z2). Każde: zakres pinu, linia pinu, linia portu. */
const SUBST = [
  { pin: 'gra/src/ui/cityPanel.ts', a: 9512, b: 9539, from: '  city: City,', to: '  city: CityHexRef,', why: 'K05A-Z2 DTO pozycji miasta' },
];
/** Deklaracje portu spoza pinu (K05A-Z1 kopie typów/enum, K05A-Z2 DTO). */
const LOCAL_NAMES = new Set([
  'TerenBazowy', 'OkolicaTryb', 'CityHexRef',
  // K05A-Z5 (r3): lokalne kopie typów z pinu (tylko pola używane przez K05A).
  'City', 'UnitDef', 'ProductionItem', 'GameData',
  // K05A-Z4 (r3): wejścia reguł z DTO — interfejsy, rejestr wejść i delegatory reguł (nie są kopiami pinu).
  'K05aCfg', 'K05aRules', 'setK05aCfg', 'setK05aRules', 'cfg', 'rules', 'regul',
  'civManpowerMaxMult', 'unitManpowerCostForType', 'ownerSurowcePoolFor', 'stockResourceLabel',
  'unitStockCost', 'unitResourceUpkeep', 'isUnitRecruitStockChipMissing', 'techPrereqChain',
]);

const isCommentLine = (t) => /^\/\*\*|^\/\*|^\*|^\/\//.test(t.trim()) || /\*\/\s*$/.test(t.trim());
const isDecl = (t) => /^(export\s+)?(const|let|function|type|interface|enum|class|import)\b/.test(t);
const stripExport = (t) => t.replace(/^export /, '');
const trimTrailingBlank = (arr) => {
  const a = [...arr];
  while (a.length && a[a.length - 1].trim() === '') a.pop();
  return a;
};

const port = readFileSync(PORT, 'utf8').split('\n');
const pinCache = {};
const pinLines = (rel) => (pinCache[rel] ??= readFileSync(join(PIN_DIR, rel), 'utf8').split(/\r?\n/));

// 1. Podział na bloki (marker -> treść do następnego markera).
const MARK = /^\/\/ pin edb8fb56 (gra\/src\/[^:\s]+):(\d+)-(\d+)\s*$/;
const blocks = [];
const outside = []; // [lineNo, text] poza blokami
let cur = null;
port.forEach((text, idx) => {
  const m = MARK.exec(text);
  if (m) {
    cur = { rel: m[1], a: Number(m[2]), b: Number(m[3]), markerLine: idx + 1, body: [] };
    blocks.push(cur);
    return;
  }
  if (cur) cur.body.push({ no: idx + 1, text });
  else outside.push({ no: idx + 1, text });
});

const findings = { text: [], orphan: [], cover: [], local: [] };
const comparisons = [];

// 2. TEXT: porównanie bloków z pinem.
for (const b of blocks) {
  const bodyLines = trimTrailingBlank(b.body.map((x) => x.text));
  const pin = pinLines(b.rel);
  if (b.b > pin.length) {
    findings.text.push(`${b.rel}:${b.a}-${b.b} poza zakresem pinu (${pin.length} linii)`);
    continue;
  }
  let expected = pin.slice(b.a - 1, b.b);
  for (const s of SUBST) {
    if (s.pin !== b.rel || s.a !== b.a || s.b !== b.b) continue;
    const hits = expected.filter((l) => l === s.from).length;
    if (hits !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} podstawienie '${s.from}' wystąpiło ${hits} razy (wymagane 1)`);
    expected = expected.map((l) => (l === s.from ? s.to : l));
  }
  const exp = trimTrailingBlank(expected).map(stripExport);
  const got = bodyLines.map(stripExport);
  const same = exp.length === got.length && exp.every((l, i) => l === got[i]);
  comparisons.push({ block: `${b.rel}:${b.a}-${b.b}`, lines: exp.length, status: same ? 'OK' : 'ROZNICA' });
  if (!same) {
    const i = exp.findIndex((l, k) => l !== got[k]);
    findings.text.push(
      `${b.rel}:${b.a}-${b.b} różnica od linii ${i + 1} bloku: pin='${exp[i] ?? '<brak>'}' port='${got[i] ?? '<brak>'}' (długości ${exp.length}/${got.length})`,
    );
  }
  // 3. ORPHAN (wewnątrz bloku): ostatnia niepusta linia nie może być komentarzem.
  const last = bodyLines[bodyLines.length - 1] ?? '';
  if (isCommentLine(last) && !/^\s*(export|const|function|type)/.test(last)) {
    findings.orphan.push(`${b.rel}:${b.a}-${b.b} blok kończy się osieroconym komentarzem: '${last.trim().slice(0, 60)}'`);
  }
  // Pin: ostatnia linia zakresu nie może być komentarzem (inaczej kopiujemy komentarz bez deklaracji).
  const pinLast = trimTrailingBlank(pin.slice(b.a - 1, b.b)).pop() ?? '';
  if (isCommentLine(pinLast)) {
    findings.orphan.push(`${b.rel}:${b.a}-${b.b} zakres pinu kończy się komentarzem bez deklaracji`);
  }
}

// 4. ORPHAN (poza blokami): każdy komentarz musi być bezpośrednio przed deklaracją; wyjątek: nagłówek pliku.
{
  let i = 0;
  const firstImport = outside.findIndex((x) => /^import\b/.test(x.text));
  while (i < outside.length) {
    if (isCommentLine(outside[i].text)) {
      let j = i;
      while (j < outside.length && (isCommentLine(outside[j].text) || outside[j].text.trim() === '')) j++;
      // j: pierwsza linia po regionie komentarza (pusta pomijana)
      let k = j;
      while (k < outside.length && outside[k].text.trim() === '') k++;
      const next = outside[k]?.text ?? '';
      const isHeader = firstImport >= 0 && i < firstImport && i === 0;
      if (!isHeader && !isDecl(next)) {
        findings.orphan.push(`linia ${outside[i].no}: komentarz poza blokiem nie poprzedza deklaracji (następna: '${next.trim().slice(0, 50)}')`);
      }
      i = j;
    } else i++;
  }
}

// 5. COVER: deklaracje najwyższego poziomu w porcie = wybrane ∪ LOCAL_NAMES.
const declared = new Set();
for (const t of port) {
  const m = /^(?:export\s+)?(?:const|let|function|type|enum|interface)\s+([A-Za-z_$][\w$]*)/.exec(t);
  if (m) declared.add(m[1]);
}
const wybrane = JSON.parse(readFileSync(WYBRANE, 'utf8')).map((u) => u.name);
const expectedNames = new Set([...wybrane, ...LOCAL_NAMES]);
for (const n of wybrane) if (!declared.has(n)) findings.cover.push(`brak jednostki z wybrane.json w porcie: ${n}`);
for (const n of declared) if (!expectedNames.has(n)) findings.cover.push(`deklaracja spoza wybrane.json i LOCAL_NAMES: ${n}`);
for (const n of LOCAL_NAMES) if (!declared.has(n)) findings.local.push(`brak lokalnej deklaracji ${n}`);

// 6. LOCAL: każda jednostka z wybrane.json ma swój marker w zakresie pinu zawierającym deklarację.
for (const n of wybrane) {
  const re = new RegExp(`^(export )?(const|function) ${n}\\b`);
  const hit = blocks.find((b) => b.body.some((x) => re.test(x.text)));
  if (!hit) findings.cover.push(`jednostka ${n} nie ma bloku z markerem`);
}

const ok = Object.values(findings).every((a) => a.length === 0);
const summary = {
  pin: 'edb8fb56',
  port: PORT.split('/').slice(-3).join('/'),
  blocks: blocks.length,
  wybraneUnits: wybrane.length,
  comparisons,
  findings,
  status: ok ? 'OK' : 'FAIL',
};
if (JSON_OUT) writeFileSync(resolve(JSON_OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(`verify-k05a-copies: blocks=${blocks.length} wybrane=${wybrane.length} ${ok ? 'OK' : 'FAIL'}`);
for (const c of comparisons) console.log(`  ${c.status} ${c.block} (${c.lines} linii)`);
for (const [k, arr] of Object.entries(findings)) for (const f of arr) console.log(`  ${k.toUpperCase()}: ${f}`);
process.exit(ok ? 0 : 1);
