'use strict';
/**
 * memory-growth-heapsnap-summary.cjs -- R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1: strumieniowe podsumowanie migawki sterty V8
 * (.heapsnapshot, setki MB -- bez JSON.parse calego pliku) z drzewem dominatorow (Cooper-Harvey-Kennedy).
 *
 *   node --max-old-space-size=6000 tools/memory-growth-heapsnap-summary.cjs <plik.heapsnapshot> <wynik.json>
 *
 * Wynik JSON: totals (self wg typu wezla), byClass (top-200 wg self: count/self/retained-bez-zagniezdzen),
 * topDominators (top-80 obiektow wg retained: klasa, krawedz od dominatora, lancuch 8 dominatorow w gore).
 * Migawki NIE trafiaja do repo -- tylko ten JSON (podsumowanie).
 */
const fs = require('fs');

const file = process.argv[2]; const outFile = process.argv[3];
if (!file || !outFile) { console.error('usage: <snap> <out.json>'); process.exit(2); }
const fd = fs.openSync(file, 'r');
const size = fs.fstatSync(fd).size;
const CH = 64 * 1024 * 1024;
const buf = Buffer.allocUnsafe(CH);

// --- 1) naglowek
let head = Buffer.alloc(0); let pos = 0;
while (true) {
  const n = fs.readSync(fd, buf, 0, CH, pos);
  head = Buffer.concat([head, buf.subarray(0, Math.min(n, 4 * 1024 * 1024))]);
  const i = head.indexOf('"nodes":[');
  if (i >= 0) { pos = i + '"nodes":['.length; head = head.subarray(0, i); break; }
  pos += n; if (pos >= size) throw new Error('brak nodes');
}
let hs = head.toString('utf8').trim(); if (hs.endsWith(',')) hs = hs.slice(0, -1);
const meta = JSON.parse(hs + '}').snapshot;
const NF = meta.meta.node_fields; const EF = meta.meta.edge_fields;
const nodeTypes = meta.meta.node_types[0]; const edgeTypes = meta.meta.edge_types[0];
const N = meta.node_count; const E = meta.edge_count; const nfl = NF.length; const efl = EF.length;
const iType = NF.indexOf('type'); const iName = NF.indexOf('name'); const iSelf = NF.indexOf('self_size'); const iEc = NF.indexOf('edge_count');
const iDet = NF.indexOf('detachedness');
const eType = EF.indexOf('type'); const eName = EF.indexOf('name_or_index'); const eTo = EF.indexOf('to_node');
console.log('nodes', N, 'edges', E, 'fields', NF.join(','));

// --- 2) liczby nodes + edges (strumien)
const nodes = new Float64Array(N * nfl); const edges = new Uint32Array(E * efl);
let target = nodes; let ti = 0; let cur = 0; let inNum = false; let phase = 0; // 0 nodes, 1 seek edges, 2 edges, 3 done
let stringsPos = -1; let seekBuf = '';
outer: while (pos < size) {
  const n = fs.readSync(fd, buf, 0, CH, pos);
  for (let k = 0; k < n; k++) {
    const c = buf[k];
    if (phase === 0 || phase === 2) {
      if (c >= 48 && c <= 57) { cur = cur * 10 + (c - 48); inNum = true; }
      else {
        if (inNum) { target[ti++] = cur; cur = 0; inNum = false; }
        if (c === 93) { // ]
          if (phase === 0) { if (ti !== N * nfl) throw new Error('nodes ' + ti); phase = 1; seekBuf = ''; }
          else { if (ti !== E * efl) throw new Error('edges ' + ti); phase = 3; seekBuf = ''; }
        }
      }
    } else if (phase === 1) {
      seekBuf += String.fromCharCode(c); if (seekBuf.length > 20) seekBuf = seekBuf.slice(-20);
      if (seekBuf.endsWith('"edges":[')) { phase = 2; target = edges; ti = 0; }
    } else if (phase === 3) {
      seekBuf += String.fromCharCode(c); if (seekBuf.length > 20) seekBuf = seekBuf.slice(-20);
      if (seekBuf.endsWith('"strings":[')) { stringsPos = pos + k + 1; break outer; }
    }
  }
  pos += n;
}
if (stringsPos < 0) {
  // strings moga byc dalej (po trace_*), szukaj liniowo
  const tail = Buffer.allocUnsafe(CH); let p = pos; let s = '';
  while (p < size && stringsPos < 0) { const n = fs.readSync(fd, tail, 0, CH, p); const t = s + tail.subarray(0, n).toString('latin1'); const i = t.indexOf('"strings":['); if (i >= 0) stringsPos = p - s.length + i + 11; s = t.slice(-20); p += n; }
}
const tailLen = size - stringsPos; const tb = Buffer.allocUnsafe(tailLen); fs.readSync(fd, tb, 0, tailLen, stringsPos); fs.closeSync(fd);
let ts = tb.toString('utf8'); const last = ts.lastIndexOf(']'); ts = ts.slice(0, last);
const strings = JSON.parse('[' + ts + ']'); ts = null;
console.log('strings', strings.length);

// --- 3) indeks krawedzi
const firstEdge = new Uint32Array(N + 1);
for (let i = 0, e = 0; i < N; i++) { firstEdge[i] = e; e += nodes[i * nfl + iEc]; firstEdge[i + 1] = e; }
const weakT = edgeTypes.indexOf('weak'); const shortcutT = edgeTypes.indexOf('shortcut');
const isSkip = (et) => et === weakT || et === shortcutT;
const nodeName = (i) => strings[nodes[i * nfl + iName]];
const nodeType = (i) => nodeTypes[nodes[i * nfl + iType]];
const self = (i) => nodes[i * nfl + iSelf];

// --- 4) postorder DFS od korzenia 0
const post = new Int32Array(N).fill(-1); const order = new Uint32Array(N); let pc = 0;
{
  const stackN = new Uint32Array(N); const stackE = new Uint32Array(N); const visited = new Uint8Array(N); let sp = 0;
  stackN[0] = 0; stackE[0] = firstEdge[0]; visited[0] = 1; sp = 1;
  while (sp > 0) {
    const v = stackN[sp - 1]; let e = stackE[sp - 1]; const end = firstEdge[v + 1]; let pushed = false;
    while (e < end) {
      const et = edges[e * efl + eType]; const to = edges[e * efl + eTo] / nfl; e++;
      if (isSkip(et) || visited[to]) continue;
      stackE[sp - 1] = e; visited[to] = 1; stackN[sp] = to; stackE[sp] = firstEdge[to]; sp++; pushed = true; break;
    }
    if (!pushed) { post[v] = pc; order[pc++] = v; sp--; }
  }
}
console.log('reachable', pc, 'of', N);
// --- 5) predecessory (CSR) w numeracji postorder
const predCount = new Uint32Array(pc + 1);
for (let v = 0; v < N; v++) { if (post[v] < 0) continue; for (let e = firstEdge[v]; e < firstEdge[v + 1]; e++) { const et = edges[e * efl + eType]; if (isSkip(et)) continue; const to = edges[e * efl + eTo] / nfl; if (post[to] >= 0) predCount[post[to] + 1]++; } }
for (let i = 1; i <= pc; i++) predCount[i] += predCount[i - 1];
const preds = new Uint32Array(predCount[pc]); const fillp = predCount.slice(0, pc);
for (let v = 0; v < N; v++) { if (post[v] < 0) continue; for (let e = firstEdge[v]; e < firstEdge[v + 1]; e++) { const et = edges[e * efl + eType]; if (isSkip(et)) continue; const to = edges[e * efl + eTo] / nfl; if (post[to] >= 0) preds[fillp[post[to]]++] = post[v]; } }
// --- 6) dominatory (iteracyjnie)
const root = pc - 1; const dom = new Int32Array(pc).fill(-1); dom[root] = root;
let changed = true; let iter = 0;
while (changed) {
  changed = false; iter++;
  for (let b = root - 1; b >= 0; b--) {
    let nd = -1;
    for (let p = predCount[b]; p < predCount[b + 1]; p++) {
      const q = preds[p]; if (dom[q] < 0) continue;
      if (nd < 0) { nd = q; continue; }
      let f1 = q; let f2 = nd; while (f1 !== f2) { while (f1 < f2) f1 = dom[f1]; while (f2 < f1) f2 = dom[f2]; } nd = f1;
    }
    if (nd >= 0 && dom[b] !== nd) { dom[b] = nd; changed = true; }
  }
}
console.log('dominator iterations', iter);
const retained = new Float64Array(pc);
for (let b = 0; b < pc; b++) retained[b] += self(order[b]);
for (let b = 0; b < root; b++) if (dom[b] >= 0) retained[dom[b]] += retained[b];

// --- 7) agregacje
const classOf = (v) => { const t = nodeType(v); const nm = nodeName(v); if (t === 'object' || t === 'native') return nm.length > 80 ? nm.slice(0, 80) : nm; if (t === 'closure') return 'closure'; if (t === 'string' || t === 'concatenated string' || t === 'sliced string') return '(string)'; if (t === 'code') return '(code)'; if (t === 'array') return '(array) ' + nm; if (t === 'hidden') return '(hidden) ' + nm.slice(0, 60); return '(' + t + ')' + (t === 'synthetic' ? ' ' + nm : ''); };
const totals = {}; const byClass = new Map();
const clsArr = new Array(pc);
for (let b = 0; b < pc; b++) {
  const v = order[b]; const t = nodeType(v); totals[t] = (totals[t] || 0) + self(v);
  const c = classOf(v); clsArr[b] = c; let r = byClass.get(c); if (!r) byClass.set(c, (r = { count: 0, self: 0, retained: 0 })); r.count++; r.self += self(v);
}
// retained bez zagniezdzen: obiekt, ktorego zaden dominator w gore nie ma tej samej klasy
for (let b = 0; b < root; b++) {
  const c = clsArr[b]; let d = dom[b]; let nested = false; let hops = 0;
  while (d >= 0 && d !== root && hops < 64) { if (clsArr[d] === c) { nested = true; break; } d = dom[d]; hops++; }
  if (!nested) byClass.get(c).retained += retained[b];
}
const edgeNameFromTo = (fromPost, toPost) => {
  const v = order[fromPost]; const to = order[toPost];
  for (let e = firstEdge[v]; e < firstEdge[v + 1]; e++) {
    if (edges[e * efl + eTo] / nfl === to) { const et = edgeTypes[edges[e * efl + eType]]; const nm = edges[e * efl + eName]; return et === 'element' || et === 'hidden' ? '[' + nm + ']' : String(strings[nm]).slice(0, 60); }
  }
  return '?';
};
const desc = (b) => classOf(order[b]) + (nodeType(order[b]) === 'closure' ? ':' + nodeName(order[b]).slice(0, 40) : '');
const idx = []; for (let b = 0; b < root; b++) if (retained[b] > 512 * 1024) idx.push(b);
idx.sort((a, b) => retained[b] - retained[a]);
const topDominators = [];
for (const b of idx) {
  if (topDominators.length >= 120) break;
  const chain = []; let x = b; for (let h = 0; h < 10 && dom[x] !== root && dom[x] >= 0; h++) { chain.push(edgeNameFromTo(dom[x], x) + ' <- ' + desc(dom[x])); x = dom[x]; }
  topDominators.push({ cls: desc(b), retainedMB: +(retained[b] / 1e6).toFixed(2), selfB: self(order[b]), edge: edgeNameFromTo(dom[b], b), chain });
}
const totalSelf = Object.values(totals).reduce((a, b) => a + b, 0);
const out = {
  file, nodes: N, edges: E, reachable: pc, totalSelfMB: +(totalSelf / 1e6).toFixed(1),
  totalsMB: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, +(v / 1e6).toFixed(2)])),
  byClass: [...byClass.entries()].sort((a, b) => b[1].self - a[1].self).slice(0, 300).map(([k, v]) => ({ cls: k, count: v.count, selfMB: +(v.self / 1e6).toFixed(3), retainedMB: +(v.retained / 1e6).toFixed(3) })),
  byClassRetained: [...byClass.entries()].sort((a, b) => b[1].retained - a[1].retained).slice(0, 120).map(([k, v]) => ({ cls: k, count: v.count, selfMB: +(v.self / 1e6).toFixed(3), retainedMB: +(v.retained / 1e6).toFixed(3) })),
  topDominators,
};
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('ok', outFile, 'totalSelfMB', out.totalSelfMB);
