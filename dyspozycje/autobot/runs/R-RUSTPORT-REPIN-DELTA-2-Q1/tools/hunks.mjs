// Parse `git diff -U0` output; classify each hunk heuristically.
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const diff = fs.readFileSync(process.argv[2] || `${S}/s2.diff`, 'utf8');
const files = [];
let cur = null, hunk = null;
for (const line of diff.split('\n')) {
  if (line.startsWith('diff --git ')) { cur = { path: line.split(' b/')[1], hunks: [] }; files.push(cur); hunk = null; continue; }
  const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (m) { hunk = { oldStart: +m[1], oldN: m[2] === undefined ? 1 : +m[2], newStart: +m[3], newN: m[4] === undefined ? 1 : +m[4], minus: [], plus: [] }; cur.hunks.push(hunk); continue; }
  if (!hunk) continue;
  if (line.startsWith('-') && !line.startsWith('---')) hunk.minus.push(line.slice(1));
  else if (line.startsWith('+') && !line.startsWith('+++')) hunk.plus.push(line.slice(1));
}
const isBlank = s => s.trim() === '';
const isCom = s => /^\s*(\/\/|\/\*|\*|\*\/)/.test(s);
const isImp = s => /^\s*(import\s|export\s+(\*|\{[^}]*\}\s*from)|export\s+\{)/.test(s);
const isTyp = s => /^\s*(export\s+)?(type|interface)\s/.test(s) || (/^\s*\w+\??\s*:\s*[\w<>\[\]|"' .]+;?\s*$/.test(s) && !/[=(]/.test(s));
const strip = s => s.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`/g, '""').replace(/\/\/.*$/, '').replace(/\s+/g, '');
function classify(h) {
  const all = [...h.minus, ...h.plus];
  const nb = all.filter(s => !isBlank(s));
  if (nb.length === 0) return 'pusty';
  if (nb.every(isCom)) return 'komentarz';
  if (nb.every(isImp)) return 'import';
  if (nb.every(isTyp)) return 'typ';
  if (h.minus.length && h.minus.length === h.plus.length && h.minus.every((s, i) => strip(s) === strip(h.plus[i]))) return 'nazwa/tekst';
  const ms = h.minus.map(strip).filter(x => x).sort().join('\n'), ps = h.plus.map(strip).filter(x => x).sort().join('\n');
  if (ms === ps) return 'nazwa/tekst';
  return 'behawioralna';
}
const out = [];
for (const f of files) {
  const counts = {};
  const beh = [];
  for (const h of f.hunks) {
    const c = classify(h);
    counts[c] = (counts[c] || 0) + 1;
    if (c === 'behawioralna') beh.push(`${h.newStart}${h.newN > 1 ? '-' + (h.newStart + h.newN - 1) : ''}(-${h.oldN}/+${h.newN})`);
  }
  out.push({ path: f.path, total: f.hunks.length, counts, beh });
}
if (process.argv[3] === 'json') console.log(JSON.stringify(out));
else for (const o of out) console.log(`${o.path} | hunks=${o.total} | ${Object.entries(o.counts).map(([k, v]) => k + ':' + v).join(' ')} | BEH@new: ${o.beh.join(', ')}`);
