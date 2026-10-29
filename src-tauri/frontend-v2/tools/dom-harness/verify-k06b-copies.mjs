#!/usr/bin/env node
/**
 * verify-k06b-copies.mjs — bramka wierności KOPII tekstowych K06B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 2).
 *
 * Wzorzec: `verify-k06a-copies.mjs` (rozszerzony o 4 pliki `src/ui/cityPanel/k06b-*.ts` i reguły DELEGATOR).
 * Każdy blok w `k06b-*.ts` jest poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` (WYŁĄCZNIE ten format);
 * treść bloku (do następnego markera, `// pin-end` lub końca pliku) musi odpowiadać liniom A..B pinu.
 *
 * Dozwolone różnice (każda jawnie wymieniona w LINE_SUBS z powodem; nic ukrytego):
 *   - `export ` na początku linii (po obu stronach);
 *   - LINE_SUBS: pojedyncza linia pinu zastąpiona linią portu (K06B-Z1 adnotacje `: any`, K06B-Z3/Z4 delegaty stałych,
 *     K06B-Z6 akcesory stanu, K06B-Z7 placeholdery 3D); `from` musi wystąpić w zakresie pinu dokładnie raz, `to` w bloku portu dokładnie raz;
 *   - PLACEHOLDER (K06B-Z7): blok `renderWorkedPreview` (MAPA) = sygnatura + jedna linia `void …` + `}`; sprawdzana osobno.
 *
 * Bramka (EXIT 0 ⇔ wszystkie poniższe):
 *   TEXT     każdy blok = pin A..B po normalizacji i LINE_SUBS (puste linie końcowe pomijane);
 *   ORPHAN   żaden komentarz poza blokiem nie osierocony; blok i zakres pinu nie kończą się komentarzem;
 *   COVER    deklaracje najwyższego poziomu we wszystkich `k06b-*.ts` = `wybrane.json` ∪ LOCAL_NAMES ∪ DELEGATOR; każda jednostka ma blok z markerem;
 *   LOCAL    każda nazwa z LOCAL_NAMES jest zadeklarowana; LINE_SUBS trafiają w pin i w port;
 *   DELEGATOR deklaracja `const X = … dep('X') / valueProxy('X') / constStr('X')` — nazwa w delegacie = nazwa deklaracji.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k06b-copies.mjs --pin-dir <PIN_DIR> [--wybrane <wybrane.json>] [--json <plik>]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const REPO = resolve(FRONT, '../..');
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
const PORT_DIR = resolve(argOf('--port-dir') ?? join(FRONT, 'src/ui/cityPanel'));
const WYBRANE = resolve(
  argOf('--wybrane') ?? join(REPO, 'dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1/r2-logi/wybrane.json'),
);
if (!PIN_DIR || !existsSync(join(PIN_DIR, 'gra/src'))) {
  console.error('Użycie: node tools/dom-harness/verify-k06b-copies.mjs --pin-dir <PIN_DIR> [--wybrane <plik>] [--json <plik>]');
  process.exit(2);
}

/**
 * LINE_SUBS (K06B-Z1, Z3, Z4, Z6, Z7): pojedyncze linie pinu (`from`, w zakresie a..b) zastąpione linią portu (`to`).
 * Każda pozycja ma powód; bez powodu nie ma wyjątku.
 */
const LINE_SUBS = [
  // K06B-Z6: stan panelu przez akcesor K06A (`activeMap`, `pinnedGarrisonCityId`).
  { a: 9392, b: 9427, from: '  const isPinned = pinnedGarrisonCityId === city.id;', to: '  const isPinned = getK06aState().pinnedGarrisonCityId === city.id;', why: 'K06B-Z6 pinnedGarrisonCityId -> getK06aState()' },
  { a: 10170, b: 10174, from: '  pinnedGarrisonCityId = cityId;', to: '  setK06aPinnedGarrisonCityId(cityId);', why: 'K06B-Z6 zapis przez akcesor' },
  { a: 10175, b: 10183, from: '  pinnedGarrisonCityId = null;', to: '  setK06aPinnedGarrisonCityId(null);', why: 'K06B-Z6 zapis przez akcesor' },
  { a: 5028, b: 5111, from: '  const empire = resolveEmpireSnap(city, activeMap, data);', to: '  const empire = resolveEmpireSnap(city, getK06aState().activeMap, data);', why: 'K06B-Z6 activeMap przez akcesor' },
  { a: 8734, b: 8860, from: '  const fullEraPreview = showEraBuildingPreview;', to: '  const fullEraPreview = getShowEraBuildingPreview();', why: 'K06B-Z4 showEraBuildingPreview przez delegat' },
  { a: 8734, b: 8860, from: '  previewChk.checked = showEraBuildingPreview;', to: '  previewChk.checked = getShowEraBuildingPreview();', why: 'K06B-Z4 showEraBuildingPreview przez delegat' },
  // K06B-Z3/Z4: stałe tekstowe przez `constStr` (wartości z setK06bDeps).
  { a: 5028, b: 5111, from: '  const poolTip = `${PULA_TIP} Zapas całej cywilizacji: ${pool} Pracy.`;', to: "  const poolTip = `${constStr('PODZIAL_PRACY_PULA_TIP')} Zapas całej cywilizacji: ${pool} Pracy.`;", why: 'K06B-Z4 PULA_TIP -> constStr' },
  { a: 5028, b: 5111, from: "    `<span class=\"psi-lbl\">${psiRowLabel('chip-crate', PULA_LBL_PELNA, poolTip)}</span>` +", to: "    `<span class=\"psi-lbl\">${psiRowLabel('chip-crate', constStr('PODZIAL_PRACY_PULA_LBL_PELNA'), poolTip)}</span>` +", why: 'K06B-Z4 PULA_LBL_PELNA -> constStr' },
  // K06B-Z7: placeholdery 3D (slot i miniatura bez mountUnitMiniPreview).
  { a: 7861, b: 7884, from: "        mountUnitMiniPreview(slot, u, defaultOwnerColor(), 'Render 3D niedostępny w tym środowisku'),", to: '        ((): undefined => { /* 3D odłożone: K06B-Z7 */ return undefined; })(),', why: 'K06B-Z7 slot 3D (P5-8 §6)' },
  { a: 7976, b: 7996, from: '    mountUnitMiniPreview(thumb, udef, color);', to: '    void color; /* miniatura 3D odłożona: K06B-Z7 */', why: 'K06B-Z7 miniatura 3D (P5-8 §6, tabela: attachUnitRowThumb ODŁOŻONE — 3D)' },
  // K06B-Z1: adnotacje `: any` przy parametrach callbacków bez typu (pin typował z kontekstu).
  { a: 9428, b: 9494, from: "  close.addEventListener('click', (ev) => {", to: "  close.addEventListener('click', (ev: any) => {", why: 'K06B-Z1 adnotacja any' },
  { a: 9428, b: 9494, from: '    const hiddenCount = units.filter(u => u.inGarnizon === true).length;', to: '    const hiddenCount = units.filter((u: any) => u.inGarnizon === true).length;', why: 'K06B-Z1 adnotacja any' },
  { a: 9617, b: 9728, from: '    const sortedImprovements = [...improvementCounts.entries()].sort((a, b) => b[1] - a[1]);', to: '    const sortedImprovements = [...improvementCounts.entries()].sort((a: any, b: any) => b[1] - a[1]);', why: 'K06B-Z1 adnotacja any' },
  { a: 10175, b: 10183, from: "  document.querySelectorAll<HTMLElement>('.civ-v-garrison-label').forEach(label => {", to: "  document.querySelectorAll<HTMLElement>('.civ-v-garrison-label').forEach((label: any) => {", why: 'K06B-Z1 adnotacja any' },
  { a: 8137, b: 8182, from: '    onRecruit: (quantity) => recruitUnit(city, item, quantity),', to: '    onRecruit: (quantity: any) => recruitUnit(city, item, quantity),', why: 'K06B-Z1 adnotacja any' },
  { a: 7997, b: 8049, from: '  actions.querySelectorAll(\'button\').forEach((btn) => {', to: '  actions.querySelectorAll(\'button\').forEach((btn: any) => {', why: 'K06B-Z1 adnotacja any' },
  { a: 8734, b: 8860, from: '      const def = data.buildings.find(b => b.id === id);', to: '      const def = data.buildings.find((b: any) => b.id === id);', why: 'K06B-Z1 adnotacja any' },
  { a: 9033, b: 9183, from: '  const def = data.buildings.find(b => b.id === id);', to: '  const def = data.buildings.find((b: any) => b.id === id);', why: 'K06B-Z1 adnotacja any' },
  { a: 9033, b: 9183, from: '    upgradeChainTitle = upgradeChainSteps(def.id, data.buildings).map(c => c.nazwa).join(\' → \');', to: '    upgradeChainTitle = upgradeChainSteps(def.id, data.buildings).map((c: any) => c.nazwa).join(\' → \');', why: 'K06B-Z1 adnotacja any' },
  { a: 9033, b: 9183, from: "    row.addEventListener('click', (e) => {", to: "    row.addEventListener('click', (e: any) => {", why: 'K06B-Z1 adnotacja any' },
];

/** Blok PLACEHOLDER (K06B-Z7, P5-8 §6): sprawdzany osobno — sygnatura pinu + jedna linia `void …` + `}`. */
const PLACEHOLDERS = [{ a: 9821, b: 10017, name: 'renderWorkedPreview', why: 'K06B-Z7 MAPA (P5-8 §6)' }];

/**
 * Nazwy deklaracji najwyższego poziomu spoza wybrane.json (K06B-Z3/Z5/Z6, struktura modułów):
 * stałe literalne pinu, aliasy typów pinu (`any`), delegaty pliku deps, akcesory stanu K06B i wejścia z K06A.
 */
const LOCAL_NAMES = new Set([
  // k06b-deps.ts
  'K06bDeps', 'deps', 'setK06bDeps', 'dep', 'valueProxy', 'constStr', 'K06B_FN_NAMES', 'K06B_VALUE_NAMES',
  // K06B-Z3: stałe literalne z pinu
  'BUILD_QUEUE_VISIBLE', 'LIST_ROW_HEIGHT_COMPACT', 'QUEUE_ROW_EM', 'PULA_LBL', 'RECRUIT_QUEUE_VISIBLE',
  // K06B-Z5: aliasy typów pinu (any) — lista = `grep '^type ' k06b-*.ts`
  'AvailabilityContext', 'BuildingCatalogEntry', 'BuildingDef', 'City', 'CityProduction', 'CityView',
  'EPOCH_NUMBER_TO_NAME', 'GameData', 'ProductionItem', 'EntityCardData', 'GameMap', 'GarrisonUnit', 'Hex',
  'IMPROVEMENT_KEY_TO_NAME', 'Nakladka', 'OkolicaFocus', 'OkolicaTryb', 'UnitDef',
  // K06B-Z6: akcesory stanu K06B
  'setK06bRootEl', 'getK06bRootEl',
]);

/** Delegat/wartość z pliku deps: `const X = (…) => dep('X')(…)`, `const X: any = valueProxy('X')`, `const X = constStr('X')`. */
const DELEGATOR = /^const\s+([A-Za-z_$][\w$]*)(?::\s*any)?\s*=\s*(?:\([^)]*\)(?::\s*any)?\s*=>\s*)?(?:dep|valueProxy|constStr)\('([A-Za-z_$][\w$]*)'\)/;

const isCommentLine = (t) => /^\/\*\*|^\/\*|^\*|^\/\//.test(t.trim()) || /\*\/\s*$/.test(t.trim());
const isDecl = (t) => /^(export\s+)?(const|let|function|type|interface|enum|class|import)\b/.test(t);
const stripExport = (t) => t.replace(/^export /, '');
const trimTrailingBlank = (arr) => {
  const a = [...arr];
  while (a.length && a[a.length - 1].trim() === '') a.pop();
  return a;
};

const MARK = /^\/\/ pin edb8fb56 (gra\/src\/[^:\s]+):(\d+)-(\d+)$/;
const findings = { text: [], orphan: [], cover: [], local: [], delegator: [] };
const comparisons = [];
const pinCache = {};
const pinLines = (rel) => (pinCache[rel] ??= readFileSync(join(PIN_DIR, rel), 'utf8').split(/\r?\n/));
const declared = new Set();
let blocksTotal = 0;

const files = readdirSync(PORT_DIR).filter((f) => /^k06b-.*\.ts$/.test(f)).sort();

/** K06B-Z8 (PIN_TAIL): ogon bloku = końcowe linie-komentarze zakresu pinu; NIE są kopiowane w swoim bloku. */
const tailStart = (rel, a, b) => {
  const pr = pinLines(rel).slice(a - 1, b);
  let k = pr.length;
  while (k > 0 && (pr[k - 1].trim() === '' || isCommentLine(pr[k - 1]))) k--;
  return k;
};
/** K06B-Z8 (HEAD): ogon poprzedniego bloku w pinie, jeśli kończy się dokładnie przed tym blokiem (ogon = dokumentacja tego bloku). */
const ALL_MARKS = [];
for (const file of files) {
  for (const t of readFileSync(join(PORT_DIR, file), 'utf8').split('\n')) {
    const m = MARK.exec(t);
    if (m) ALL_MARKS.push({ rel: m[1], a: Number(m[2]), b: Number(m[3]) });
  }
}
const headLinesFor = (blk) => {
  const prev = ALL_MARKS.find((m) => m.rel === blk.rel && m.b + 1 === blk.a);
  if (!prev) return [];
  const k = tailStart(prev.rel, prev.a, prev.b);
  const lines = pinLines(prev.rel).slice(k + prev.a - 1, prev.b);
  return trimTrailingBlank(lines);
};

for (const file of files) {
  const port = readFileSync(join(PORT_DIR, file), 'utf8').split('\n');
  // 1. Podział na bloki (marker -> treść do następnego markera / `// pin-end`). Marker liczy się jako deklaracja.
  const blocks = [];
  const outside = [];
  let cur = null;
  port.forEach((text, idx) => {
    if (/^\/\/ pin-end$/.test(text)) {
      cur = null;
      outside.push({ no: idx + 1, text: 'const __END__ = 0;' });
      return;
    }
    const m = MARK.exec(text);
    if (m) {
      cur = { rel: m[1], a: Number(m[2]), b: Number(m[3]), markerLine: idx + 1, body: [], file };
      blocks.push(cur);
      outside.push({ no: idx + 1, text: 'const __MARKER__ = 0;' });
      return;
    }
    if (/^\/\/ pin/.test(text)) {
      blocks.push({ rel: '<BAD_MARKER>', a: 0, b: 0, markerLine: idx + 1, body: [], bad: text, file });
      cur = null;
      return;
    }
    if (cur) cur.body.push({ no: idx + 1, text });
    else outside.push({ no: idx + 1, text, file });
  });
  blocksTotal += blocks.length;

  // 2. TEXT / PLACEHOLDER / ORPHAN (wewnątrz bloku).
  for (const b of blocks) {
    if (b.bad !== undefined) {
      findings.text.push(`${file}:${b.markerLine}: marker niezgodny z formatem '// pin edb8fb56 gra/src/<plik>:A-B': '${b.bad.trim()}'`);
      continue;
    }
    const bodyAll = trimTrailingBlank(b.body.map((x) => x.text));
    const pin = pinLines(b.rel);
    if (b.b > pin.length) {
      findings.text.push(`${file}:${b.a}-${b.b} poza zakresem pinu (${pin.length} linii)`);
      continue;
    }
    // K06B-Z8 HEAD: pierwsze linie bloku = ogon poprzedniego bloku w pinie (dokumentacja tego bloku), dokładnie.
    const headLines = headLinesFor(b);
    if (headLines.length && !headLines.every((x, i) => bodyAll[i] === x)) {
      findings.text.push(`${file}:${b.a}-${b.b} HEAD (dokumentacja z pinu, ${headLines.length} linii) nie zgadza się z początkiem bloku`);
    }
    const bodyLines = bodyAll.slice(headLines.length);
    const pinRange = pin.slice(b.a - 1, b.b);
    const ph = PLACEHOLDERS.find((p) => p.a === b.a && p.b === b.b);
    if (ph) {
      const sig = bodyLines[0] ?? '';
      const okSig = sig.startsWith(`export function ${ph.name}(`);
      const okBody = bodyLines.length === 3 && /^\s+void .*K06B-Z7/.test(bodyLines[1] ?? '') && bodyLines[2] === '}';
      comparisons.push({ block: `${b.rel}:${b.a}-${b.b}`, file, lines: pinRange.length, subs: 0, status: okSig && okBody ? 'PLACEHOLDER' : 'ROZNICA' });
      if (!(okSig && okBody)) findings.text.push(`${file}:${b.a}-${b.b} placeholder ${ph.name} niezgodny z K06B-Z7 (sygnatura + void + })`);
      continue;
    }
    // PIN_TAIL (K06B-Z8): końcowe linie zakresu pinu będące komentarzem (dokumentacja następnej, niewybranej deklaracji)
    // nie są kopiowane do portu — skopiowane zostawiłyby komentarz osierocony w bloku. Liczba pominiętych linii jest raportowana.
    let k = pinRange.length;
    while (k > 0 && (pinRange[k - 1].trim() === '' || isCommentLine(pinRange[k - 1]))) k--;
    const pinCore = pinRange.slice(0, k);
    const tailOmitted = pinRange.length - k;
    const subsHere = LINE_SUBS.filter((s) => s.a === b.a && s.b === b.b);
    for (const s of subsHere) {
      const inPin = pinCore.filter((l) => l === s.from).length;
      if (inPin !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} LINE_SUB '${s.from.trim().slice(0, 50)}' występuje w pinie ${inPin} razy (wymagane 1)`);
      const inPort = bodyLines.filter((l) => l === s.to).length;
      if (inPort !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} LINE_SUB '${s.to.trim().slice(0, 50)}' występuje w porcie ${inPort} razy (wymagane 1)`);
    }
    const expected = pinCore.map((l) => {
      const hit = subsHere.find((s) => s.from === l);
      return hit ? hit.to : l;
    });
    const exp = trimTrailingBlank(expected).map(stripExport);
    const got = bodyLines.map(stripExport);
    const same = exp.length === got.length && exp.every((l, i) => l === got[i]);
    comparisons.push({ block: `${b.rel}:${b.a}-${b.b}`, file, lines: exp.length, subs: subsHere.length, tailOmitted, status: same ? 'OK' : 'ROZNICA' });
    if (!same) {
      const i = exp.findIndex((l, k) => l !== got[k]);
      findings.text.push(
        `${file} ${b.rel}:${b.a}-${b.b} różnica od linii ${i + 1} bloku: pin='${exp[i] ?? '<brak>'}' port='${got[i] ?? '<brak>'}' (długości ${exp.length}/${got.length})`,
      );
    }
    const last = bodyLines[bodyLines.length - 1] ?? '';
    if (isCommentLine(last) && !/^\s*(export|const|function|type)/.test(last)) {
      findings.orphan.push(`${file} ${b.rel}:${b.a}-${b.b} blok kończy się osieroconym komentarzem: '${last.trim().slice(0, 60)}'`);
    }
  }

  // 3. ORPHAN (poza blokami): każdy komentarz musi poprzedzać deklarację (marker liczy się jako deklaracja).
  {
    let i = 0;
    while (i < outside.length) {
      if (!/^\s/.test(outside[i].text) && isCommentLine(outside[i].text)) {
        let j = i;
        while (j < outside.length && (isCommentLine(outside[j].text) || outside[j].text.trim() === '')) j++;
        let k = j;
        while (k < outside.length && outside[k].text.trim() === '') k++;
        const next = outside[k]?.text ?? '';
        if (!isDecl(next)) findings.orphan.push(`${file} linia ${outside[i].no}: komentarz poza blokiem nie poprzedza deklaracji (następna: '${next.trim().slice(0, 50)}')`);
        i = j;
      } else i++;
    }
  }

  // 4. Deklaracje najwyższego poziomu (COVER / LOCAL / DELEGATOR).
  for (const o of outside) {
    if (o.text.startsWith('const __')) continue;
    const dm = /^(?:export\s+)?(?:const|let|function|type|enum|interface)\s+([A-Za-z_$][\w$]*)/.exec(o.text);
    if (dm) {
      declared.add(dm[1]);
      if (/^const\s/.test(o.text) && !LOCAL_NAMES.has(dm[1])) {
        const d = DELEGATOR.exec(o.text);
        if (!d) {
          // nie-delegat: musi być na liście wybrane.json (sprawdzane niżej) albo LOCAL_NAMES
        } else if (d[1] !== d[2]) {
          findings.delegator.push(`${file}: deklaracja '${d[1]}' deleguje do '${d[2]}' (nazwa musi być równa)`);
        }
      }
    }
  }
  for (const b of blocks) {
    for (const x of b.body) {
      const dm = /^(?:export\s+)?(?:const|let|function|type|enum|interface)\s+([A-Za-z_$][\w$]*)/.exec(x.text);
      if (dm) declared.add(dm[1]);
    }
  }
}

// 5. COVER: deklaracje = wybrane ∪ LOCAL_NAMES ∪ DELEGATOR (nazwy z plików deps/K06B-Z2/Z4).
const wybrane = JSON.parse(readFileSync(WYBRANE, 'utf8')).map((u) => u.name);
const delegatorNames = new Set();
for (const file of files) {
  for (const t of readFileSync(join(PORT_DIR, file), 'utf8').split('\n')) {
    const d = DELEGATOR.exec(t);
    if (d) delegatorNames.add(d[1]);
  }
}
const expectedNames = new Set([...wybrane, ...LOCAL_NAMES, ...delegatorNames]);
for (const n of wybrane) if (!declared.has(n)) findings.cover.push(`brak jednostki z wybrane.json w porcie: ${n}`);
for (const n of declared) if (!expectedNames.has(n)) findings.cover.push(`deklaracja spoza wybrane.json, LOCAL_NAMES i delegatów: ${n}`);
for (const n of LOCAL_NAMES) if (!declared.has(n)) findings.local.push(`brak lokalnej deklaracji ${n}`);

// 6. COVER: każda jednostka z wybrane.json ma blok z markerem zawierający jej deklarację.
const allBlocks = files.flatMap((file) => {
  const port = readFileSync(join(PORT_DIR, file), 'utf8').split('\n');
  const out = [];
  let cur = null;
  for (const t of port) {
    if (/^\/\/ pin-end$/.test(t)) { cur = null; continue; }
    if (MARK.test(t)) { cur = { body: [] }; out.push(cur); continue; }
    if (cur) cur.body.push(t);
  }
  return out;
});
for (const n of wybrane) {
  const re = new RegExp(`^(export )?(const|let|function) ${n}\\b`);
  if (!allBlocks.some((b) => b.body.some((t) => re.test(t)))) findings.cover.push(`jednostka ${n} nie ma bloku z markerem`);
}
// 7. LINE_SUBS: każda pozycja musi należeć do istniejącego bloku.
for (const s of LINE_SUBS) {
  if (!files.some((f) => {
    const port = readFileSync(join(PORT_DIR, f), 'utf8');
    return port.includes(`// pin edb8fb56 ${'gra/src/ui/cityPanel.ts'}:${s.a}-${s.b}`);
  })) findings.text.push(`LINE_SUB bez bloku ${s.a}-${s.b}: ${s.why}`);
}

const ok = Object.values(findings).every((a) => a.length === 0);
const summary = {
  pin: 'edb8fb56',
  portDir: 'src/ui/cityPanel (k06b-*.ts)',
  files,
  blocks: blocksTotal,
  wybraneUnits: wybrane.length,
  lineSubs: LINE_SUBS.length,
  placeholders: PLACEHOLDERS.length,
  comparisons,
  findings,
  status: ok ? 'OK' : 'FAIL',
};
if (JSON_OUT) writeFileSync(resolve(JSON_OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(`verify-k06b-copies: files=${files.length} blocks=${blocksTotal} wybrane=${wybrane.length} lineSubs=${LINE_SUBS.length} ${ok ? 'OK' : 'FAIL'}`);
for (const c of comparisons) console.log(`  ${c.status} ${c.file} ${c.block} (${c.lines} linii, podstawienia ${c.subs})`);
for (const [k, arr] of Object.entries(findings)) for (const f of arr) console.log(`  ${k.toUpperCase()}: ${f}`);
process.exit(ok ? 0 : 1);
