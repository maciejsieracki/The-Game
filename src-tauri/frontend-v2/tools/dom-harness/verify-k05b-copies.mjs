#!/usr/bin/env node
/**
 * verify-k05b-copies.mjs — bramka kopii jednostek K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1).
 *
 * Dla każdego bloku `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` w `src/ui/cityPanel/k05b-*.ts` sprawdza:
 *   TEXT   — linie bloku są bajtowo równe liniom A..B pinu (z komentarzami), z jedynym dopuszczonym wyjątkiem:
 *            `export ` przed deklaracją najwyższego poziomu (`function`/`const`) — dokładnie jedna taka linia;
 *   COVER  — każda jednostka z listy partii (`BATCHES`, z zakresami pinu) ma dokładnie jeden blok, bez duplikatów;
 *   CONST  — stałe K05B-Z2 w `k05b-host.ts` mają tę samą wartość co linie pinu `game/cities.ts` (578, 581);
 *   NEG    — testy negatywne: zmiana znaku w treści, usunięty komentarz w bloku i brak markera wykrywane jako FAIL.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k05b-copies.mjs --pin-dir <PIN_DIR> [--batch <n>]   (domyślnie: wszystkie partie)
 *   <PIN_DIR> = katalog poza repo z `git archive edb8fb56 gra/src gra/data`.
 * EXIT 0 <=> OK; 1 <=> >=1 FAIL; 2 <=> błąd użycia.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/verify-k05b-copies.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const ONLY_BATCH = argOf('--batch');
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const PIN_CP = join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts');
const PIN_CITIES = join(resolve(PIN_DIR), 'gra/src/game/cities.ts');

/** Partie K05B: 19 jednostek DOM (pomiar r2 + selektor `--k05b`), zakresy linii pinu. Partia = runda porcie. */
export const BATCHES = {
  1: [
    ['renderEkonomiaStrip', 4702, 4717],
    ['appendPodzialHandlu', 4718, 4798],
    ['appendCitySkarbiecBalance', 4799, 4832],
    ['renderPodzialHandlu', 4833, 4838],
    ['buildTopBarZlotoDetailCard', 5895, 5974],
    ['renderSplitPane', 9501, 9516],
    ['appendGarrisonUnitChip', 9603, 9635],
    ['improvementRangeRow', 9848, 9860],
  ],
  2: [
    ['appendBuildingRequirementsBlock', 7065, 7075],
    ['buildBuildingInfocard', 7083, 7205],
    ['appendTechDetailBlock', 7468, 7534],
    ['ensureEntityCardBuildingStyles', 7538, 7599],
    ['buildBuildingDetailCardViaEntityCard', 7601, 7629],
    ['buildBuildingDetailCard', 7631, 7642],
    ['_legacyBuildBuildingDetailCard', 7644, 7770],
    ['buildBuildingBuildTabDetailCard', 7772, 7879],
  ],
  3: [
    ['_legacyBuildUnitDetailCard', 7970, 8049],
    ['buildRecruitTabDetailCard', 9087, 9117],
    ['buildUpgradeBonusDetailCard', 9218, 9269],
  ],
};

/** Bloki wsparcia (poza 19 jednostkami DOM): wymagania budynku (ZADANIE 2) i sprawdzenie stacji stock; TEXT dla każdego. */
export const SUPPORT = [
  ['buildingLocationRequirementMet', 6892, 6899],
  ['buildingRequirementChips', 6901, 7000],
  ['missingTechSteps', 8744, 8747],
  ['buildingStockCostChipsHtml', 6680, 6704],
];

// R-RUSTPORT-REPIN-UI-2-G-Q1 r2: marker pin edb8fb56 albo web 86d510c66 (repin-ui2g-rev.mjs); --pin-dir = katalog tej rewizji.
const MARK = /^\/\/ pin (?:edb8fb56|86d510c66) gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)$/;

/** Parsuje pliki k05b-*.ts na bloki: { a, b, lines, file, markerLine }. */
export function parseBlocks(text, file) {
  const L = text.split('\n');
  const blocks = [];
  for (let i = 0; i < L.length; i++) {
    const m = L[i].match(MARK);
    if (!m) continue;
    let j = i + 1;
    while (j < L.length && !MARK.test(L[j])) j++;
    let body = L.slice(i + 1, j);
    while (body.length && body[body.length - 1].trim() === '') body = body.slice(0, -1);
    blocks.push({ a: Number(m[1]), b: Number(m[2]), lines: body, file, markerLine: i + 1 });
  }
  return blocks;
}

/** Porównanie bloku z zakresem pinu; zwraca listę błędów (pusta = OK). */
export function compareBlock(block, pinLines) {
  const errs = [];
  const want = pinLines.slice(block.a - 1, block.b);
  while (want.length && want[want.length - 1].trim() === '') want.pop();
  if (want.length !== block.lines.length) {
    errs.push(`długość: pin ${want.length} linii, port ${block.lines.length}`);
  }
  let exportCount = 0;
  const n = Math.min(want.length, block.lines.length);
  for (let i = 0; i < n; i++) {
    const p = want[i];
    const q = block.lines[i];
    if (p === q) continue;
    if (/^(function|const) /.test(p) && q === 'export ' + p) {
      exportCount++;
      continue;
    }
    errs.push(`linia ${i + 1}: pin ${JSON.stringify(p)} != port ${JSON.stringify(q)}`);
    if (errs.length > 5) break;
  }
  if (exportCount > 1) errs.push(`więcej niż jedno dopuszczone 'export ' (${exportCount})`);
  return errs;
}

function declName(line) {
  const m = line.match(/^(?:function|const) ([A-Za-z_$][\w$]*)/) ?? line.match(/^export (?:function|const) ([A-Za-z_$][\w$]*)/);
  return m ? m[1] : null;
}

let fails = 0;
const report = (ok, msg) => {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${msg}`);
  if (!ok) fails++;
};

const pinLines = readFileSync(PIN_CP, 'utf8').split('\n');
const files = readdirSync(CITY).filter((f) => /^k05b-.*\.ts$/.test(f)).sort();
const allBlocks = files.flatMap((f) => parseBlocks(readFileSync(join(CITY, f), 'utf8'), f));

const batches = ONLY_BATCH ? { [ONLY_BATCH]: BATCHES[ONLY_BATCH] } : BATCHES;
for (const [bn, units] of Object.entries(batches)) {
  if (!units) {
    report(false, `brak partii ${ONLY_BATCH}`);
    continue;
  }
  for (const [name, a, b] of units) {
    const hits = allBlocks.filter((x) => x.a === a && x.b === b);
    if (hits.length !== 1) {
      report(false, `COVER partia ${bn} ${name} ${a}-${b}: bloków ${hits.length} (oczekiwano 1)`);
      continue;
    }
    const blk = hits[0];
    const dn = blk.lines.map(declName).find((x) => x) ?? null;
    if (dn !== name) {
      report(false, `COVER partia ${bn} ${name}: deklaracja w bloku to ${dn}`);
      continue;
    }
    const errs = compareBlock(blk, pinLines);
    report(errs.length === 0, `TEXT partia ${bn} ${name} ${a}-${b} (${blk.file}): ${errs.length ? errs.join('; ') : 'bajtowo = pin'}`);
  }
}

// SUPPORT + ORPHAN: bloki wsparcia (ZADANIE 2) muszą być kopiami; każdy blok markera to jednostka partii lub wsparcie.
if (!ONLY_BATCH) {
  for (const [name, a, b] of SUPPORT) {
    const hits = allBlocks.filter((x) => x.a === a && x.b === b);
    if (hits.length !== 1) {
      report(false, `COVER wsparcie ${name} ${a}-${b}: bloków ${hits.length} (oczekiwano 1)`);
      continue;
    }
    const dn = hits[0].lines.map(declName).find((x) => x) ?? null;
    if (dn !== name) {
      report(false, `COVER wsparcie ${name}: deklaracja w bloku to ${dn}`);
      continue;
    }
    const errs = compareBlock(hits[0], pinLines);
    report(errs.length === 0, `TEXT wsparcie ${name} ${a}-${b} (${hits[0].file}): ${errs.length ? errs.join('; ') : 'bajtowo = pin'}`);
  }
  const known = new Set([...Object.values(BATCHES).flat(), ...SUPPORT].map(([, a, b]) => `${a}-${b}`));
  const orphans = allBlocks.filter((x) => !known.has(`${x.a}-${x.b}`));
  report(orphans.length === 0, `ORPHAN: bloki markera bez wpisu partii/wsparcia: ${orphans.length}`);
  report(allBlocks.length === 19 + SUPPORT.length, `LICZBA bloków markera: ${allBlocks.length} (oczekiwano ${19 + SUPPORT.length})`);
  // Zakotwiczenie Z6: pin game/danina-nazwa.ts:17 = deklaracja daninaLabelGenitive, zwraca 'podatku' (port: k05b-host.ts).
  const daninaPin = readFileSync(join(resolve(PIN_DIR), 'gra/src/game/danina-nazwa.ts'), 'utf8').split('\n');
  const daninaOk = /^export function daninaLabelGenitive\(/.test(daninaPin[16] ?? '') && daninaPin[17]?.trim() === "return 'podatku';";
  const hostSrc = readFileSync(join(CITY, 'k05b-host.ts'), 'utf8');
  report(daninaOk && /export function daninaLabelGenitive\(_label\?: string\): 'podatku' \{\n  return 'podatku';\n\}/.test(hostSrc),'DANINA-Z6 daninaLabelGenitive: pin danina-nazwa.ts:17-19 = port k05b-host.ts (zwraca \'podatku\')');
}

// CONST: K05B-Z2 — wartości stałych w k05b-host.ts = wartości pinu game/cities.ts.
const hostText = readFileSync(join(CITY, 'k05b-host.ts'), 'utf8');
const citiesLines = readFileSync(PIN_CITIES, 'utf8').split('\n');
for (const [name, line] of [['HANDEL_PCT_STEP', 578], ['MAX_PROCENT_NAUKA', 581]]) {
  const pinM = citiesLines[line - 1].match(new RegExp(`^export const ${name} = (\\d+);`));
  const portM = hostText.match(new RegExp(`^export const ${name} = (\\d+);`, 'm'));
  report(!!pinM && !!portM && pinM[1] === portM[1], `CONST ${name}: pin game/cities.ts:${line}=${pinM?.[1]} port=${portM?.[1]}`);
}

// NEG: testy negatywne bramki TEXT (na pierwszej jednostce partii 1).
{
  // appendPodzialHandlu (4718-4798): zawiera `>` w treści i komentarze `//` między liniami.
  const blk = allBlocks.find((x) => x.a === 4718 && x.b === 4798);
  if (!blk) {
    report(false, 'NEG: brak bloku appendPodzialHandlu');
  } else {
    const hasGt = blk.lines.some((l) => l.includes('>'));
    const hasCmt = blk.lines.some((l) => /^\s*\/\//.test(l));
    const mutSign = { ...blk, lines: blk.lines.map((l) => l.replace(/>/, '<')) };
    const mutComment = { ...blk, lines: blk.lines.filter((l) => !/^\s*\/\//.test(l)) };
    const declIdx = blk.lines.findIndex((l) => l.startsWith('export function '));
    const mutDup = { ...blk, lines: blk.lines.map((l, i) => (i === declIdx ? 'export ' + l : l)) };
    report(hasGt && compareBlock(mutSign, pinLines).length > 0, 'NEG zmiana znaku w treści -> FAIL');
    report(hasCmt && compareBlock(mutComment, pinLines).length > 0, 'NEG usunięty komentarz -> FAIL');
    report(compareBlock(blk, pinLines).length === 0 && compareBlock(mutDup, pinLines).length > 0, 'NEG podwójny `export` na deklaracji -> FAIL, pojedynczy -> OK');
  }
}

console.log(fails === 0 ? 'VERIFY K05B: OK' : `VERIFY K05B: FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
