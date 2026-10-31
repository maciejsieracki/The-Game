// (a) symbol 8H2 w main.ts vs hunki delty; (b) kopie frontend-v2 vs gra@4bbef081d (manifest sha256);
// (c) cityPanel.ts: dryf na poziomie funkcji po nazwie, pary edb->main i dc8->main.
import fs from 'node:fs';
import crypto from 'node:crypto';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const rows = JSON.parse(fs.readFileSync(`${S}/hunks3.json`, 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// (a)
const mainLines = fs.readFileSync(`${S}/pin-main/gra/src/main.ts`, 'utf8').split('\n');
const sym = 'placedImprovementsWithZlotoTradeGrant';
const a0 = mainLines.findIndex(l => new RegExp(`\\b${sym}\\b`).test(l) && /function|const/.test(l));
const refs = mainLines.map((l, i) => (l.includes(sym) ? i + 1 : null)).filter(Boolean);
const hunkHits = rows.filter(r => r.file === 'gra/src/main.ts' && refs.some(n => n >= r.newStart && n <= r.newStart + Math.max(r.newN, 1) - 1));
console.log(`(a) ${sym}: deklaracja@main=${a0 + 1}, wystapienia=${refs.join(',')}, hunki delty na tych liniach=${hunkHits.length}`);
// (b)
const man = JSON.parse(fs.readFileSync(`${S}/parity/src-tauri/frontend-v2/tools/pin-manifest.json`, 'utf8'));
const entries = Array.isArray(man) ? man : (man.entries || man.copies || man.files || Object.entries(man).map(([k, v]) => ({ path: k, ...(typeof v === 'string' ? { src: v } : v) })));
console.log('(b) manifest: typ=', Array.isArray(man) ? 'array' : typeof man, 'klucze=', Object.keys(man).slice(0, 6).join(','), 'wpisow=', entries.length);
console.log('    przykladowy wpis:', JSON.stringify(entries[0]).slice(0, 300));
// (c)
function funcs(lines) {
  const out = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = /^(export\s+)?function\s+(\w+)\s*\(/.exec(lines[i]);
    if (!m) continue;
    let b = i;
    while (b < lines.length && lines[b] !== '}') b++;
    out.set(m[2], { a: i + 1, b: b + 1, body: lines.slice(i, b + 1).map(l => l.replace(/\s+$/, '')).join('\n') });
  }
  return out;
}
const rd = d => fs.readFileSync(`${S}/${d}/gra/src/ui/cityPanel.ts`, 'utf8').split(/\r?\n/);
const M = funcs(rd('pin-main'));
for (const pin of ['pin-edb', 'pin-dc8']) {
  const P = funcs(rd(pin));
  let same = 0; const drift = [];
  for (const [n, p] of P) { const h = M.get(n); if (h && h.body === p.body) same++; else drift.push(`${n}(${p.a}-${p.b}->${h ? h.a + '-' + h.b : 'USUNIETA'})`); }
  console.log(`(c) ${pin} -> main: funkcje=${P.size} identyczne=${same} rozne=${drift.length}`);
  console.log('    ' + drift.join(' | '));
}
