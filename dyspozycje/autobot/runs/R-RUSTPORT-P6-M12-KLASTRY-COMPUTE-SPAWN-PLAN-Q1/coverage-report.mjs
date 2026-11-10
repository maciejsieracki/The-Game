// Raport pokrycia V8 (NODE_V8_COVERAGE) dla clusters.ts / cluster-spawn.ts: wypisuje linie ORYGINALU
// o liczniku 0 w obrebie funkcji computeClusters (clusters.ts:3373-4250) i buildClusterSpawnPlan
// (cluster-spawn.ts:216-438). Uzycie:
//   node --experimental-transform-types --no-warnings coverage-report.mjs <WEB_ROOT> <COVERAGE_DIR>
// Pozycje V8 odnosza sie do tekstu PO transformacji typow (z inline source map), wiec tekst jest
// odtwarzany tym samym `stripTypeScriptTypes(.., { mode: 'transform', sourceMap: true })`, a linie
// oryginalu wyznaczane z jego mapy zrodel (dekoder VLQ ponizej).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { pathToFileURL } from 'node:url';

const [, , webRoot, covDir] = process.argv;
const targets = [
  { rel: 'gra/src/map/clusters.ts', from: 3373, to: 4250 },
  { rel: 'gra/src/map/cluster-spawn.ts', from: 216, to: 438 },
];

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeVlqLine(seg) {
  const out = [];
  let i = 0;
  while (i < seg.length) {
    const vals = [];
    while (i < seg.length && seg[i] !== ',') {
      let shift = 0;
      let value = 0;
      let cont = true;
      while (cont) {
        const d = B64.indexOf(seg[i++]);
        cont = (d & 32) !== 0;
        value += (d & 31) << shift;
        shift += 5;
      }
      vals.push(value & 1 ? -(value >> 1) : value >> 1);
    }
    i++; // przecinek
    out.push(vals);
  }
  return out;
}

const reports = readdirSync(covDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(covDir, f), 'utf8')));

for (const t of targets) {
  const abs = join(webRoot, t.rel);
  const url = pathToFileURL(abs).href;
  const orig = readFileSync(abs, 'utf8');
  const withMap = stripTypeScriptTypes(orig, { mode: 'transform', sourceMap: true });
  const m = /\/\/# sourceMappingURL=data:application\/json;base64,(\S+)\s*$/.exec(withMap);
  if (!m) throw new Error('brak inline source map');
  const map = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
  const text = withMap.slice(0, m.index);
  const genLines = text.split('\n');
  // Mapowanie: dla kazdej linii wygenerowanej lista segmentow [genCol, origLine(0-based)]
  const segsPerLine = map.mappings.split(';').map((l) => decodeVlqLine(l));
  let srcLine = 0;
  const genToOrig = []; // genToOrig[line][col] -> origLine (1-based) albo 0
  for (let gl = 0; gl < genLines.length; gl++) {
    const segs = segsPerLine[gl] ?? [];
    let genCol = 0;
    const arr = new Int32Array(genLines[gl].length);
    const marks = [];
    for (const s of segs) {
      genCol += s[0];
      if (s.length >= 4) {
        srcLine += s[2];
        marks.push([genCol, srcLine + 1]);
      }
    }
    // pierwsza linia zrodlowa: kolumny przed pierwszym segmentem = 0
    for (let k = 0; k < marks.length; k++) {
      const [c0, ol] = marks[k];
      const c1 = k + 1 < marks.length ? marks[k + 1][0] : genLines[gl].length;
      for (let c = c0; c < c1 && c < arr.length; c++) arr[c] = ol;
    }
    genToOrig.push(arr);
  }
  const lineStart = [0];
  for (let k = 0; k < text.length; k++) if (text[k] === '\n') lineStart.push(k + 1);
  // pokrycie per znak
  const counts = new Int32Array(text.length).fill(-1);
  const covered = new Uint8Array(text.length);
  const known = new Uint8Array(text.length);
  for (const rep of reports) {
    for (const res of rep.result) {
      if (res.url !== url) continue;
      counts.fill(-1);
      for (const fn of res.functions) {
        const sorted = [...fn.ranges].sort((a, b) => b.endOffset - b.startOffset - (a.endOffset - a.startOffset));
        for (const r of sorted) for (let k = r.startOffset; k < r.endOffset && k < counts.length; k++) counts[k] = r.count;
      }
      for (let k = 0; k < counts.length; k++) {
        if (counts[k] >= 0) known[k] = 1;
        if (counts[k] > 0) covered[k] = 1;
      }
    }
  }
  const lineKnown = new Map();
  const lineCovered = new Map();
  for (let gl = 0; gl < genLines.length; gl++) {
    for (let c = 0; c < genLines[gl].length; c++) {
      if (/\s/.test(genLines[gl][c])) continue;
      const ol = genToOrig[gl][c];
      if (!ol) continue;
      const k = lineStart[gl] + c;
      if (known[k]) lineKnown.set(ol, true);
      if (covered[k]) lineCovered.set(ol, true);
    }
  }
  const origLines = orig.split('\n');
  const out = [];
  let codeLines = 0;
  for (let ln = t.from; ln <= t.to; ln++) {
    const txt = origLines[ln - 1] ?? '';
    if (!lineKnown.has(ln)) continue;
    codeLines++;
    if (!lineCovered.has(ln)) out.push(`${ln}: ${txt.trim().slice(0, 140)}`);
  }
  console.log(`${t.rel}: linii kodu ze znanym licznikiem w ${t.from}-${t.to}: ${codeLines}, NIEPOKRYTYCH: ${out.length}`);
  for (const l of out) console.log('   ' + l);
}
