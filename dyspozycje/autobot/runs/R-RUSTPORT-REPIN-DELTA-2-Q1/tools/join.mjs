// Join plan table (101 files) with hunk classification from hunks.mjs (json mode).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const plan = fs.readFileSync(`${S}/plan.md`, 'utf8').split('\n');
const rows = [];
for (const line of plan) {
  if (!line.startsWith('| `')) continue;
  const c = line.split('|').map(x => x.trim());
  // ['', '`src/..`', '+a/−b', 'TAK|—', 'Stan', 'Temat', '']
  const p = c[1].replace(/`/g, '');
  rows.push({ path: 'gra/' + p, pm: c[2], po91: c[3], stan: c[4], temat: c[5] });
}
const hunksJson = f => JSON.parse(execFileSync('node', [`${S}/tools/hunks.mjs`, f, 'json']).toString());
const all = hunksJson(`${S}/all.diff`);
const s2 = hunksJson(`${S}/s2.diff`);
const byPath = arr => Object.fromEntries(arr.map(x => [x.path, x]));
const A = byPath(all), B = byPath(s2);
const fmt = c => Object.entries(c).map(([k, v]) => `${k}:${v}`).join(' ');
const newSet = new Set(fs.readFileSync(`${S}/new-since-edb.txt`, 'utf8').split('\n').filter(Boolean));
const lines101 = [];
lines101.push('| # | Plik (web, origin/main) | +/− od edb8fb56 | Po 91dc998a (etap 2) | Stan w planie | Temat docelowy (plan) | Nowy | Hunki edb→main (klasa) | Hunki etap 2 (klasa) |');
lines101.push('|---|---|---|---|---|---|---|---|---|');
let i = 0;
const missing = [];
for (const r of rows) {
  i++;
  const a = A[r.path], b = B[r.path];
  if (!a) missing.push(r.path);
  lines101.push(`| ${i} | \`${r.path}\` | ${r.pm} | ${r.po91} | ${r.stan} | ${r.temat} | ${newSet.has(r.path) ? 'TAK' : '—'} | ${a ? a.total + ' (' + fmt(a.counts) + ')' : '0'} | ${b ? b.total + ' (' + fmt(b.counts) + ')' : '—'} |`);
}
fs.writeFileSync(`${S}/table101.md`, lines101.join('\n') + '\n');
// hunk lists: stage 2 (23 files)
const s2l = [];
for (const f of s2) {
  const r = rows.find(x => x.path === f.path);
  s2l.push(`- \`${f.path}\` — temat: ${r ? r.temat : '??? BRAK'}; hunki beh. (plik:linia weba w origin/main, nowe): ${f.beh.length ? f.beh.join(', ') : 'brak'}`);
}
fs.writeFileSync(`${S}/hunks-s2.md`, s2l.join('\n') + '\n');
// stage-1 TODO/CZESC files (full delta edb->main)
const s1l = [];
let n1 = 0;
for (const r of rows) {
  if (!/TODO|CZĘŚĆ/.test(r.stan)) continue;
  const a = A[r.path];
  n1++;
  s1l.push(`- \`${r.path}\` — ${r.stan}; temat: ${r.temat}; hunki beh. (edb→main): ${a && a.beh.length ? a.beh.join(', ') : 'brak'}`);
}
fs.writeFileSync(`${S}/hunks-s1todo.md`, s1l.join('\n') + '\n');
console.log('rows', rows.length, 'missingInDiff', missing.length, missing.join(' ; '));
console.log('stage1 TODO/CZESC files', n1);
const topics = {};
for (const r of rows) topics[r.temat] = (topics[r.temat] || 0) + 1;
console.log(JSON.stringify(Object.entries(topics).sort((x, y) => y[1] - x[1]), null, 0));
const stanCount = {};
for (const r of rows) stanCount[r.stan.split(' ')[0]] = (stanCount[r.stan.split(' ')[0]] || 0) + 1;
console.log(JSON.stringify(stanCount));
const inDiffNotPlan = Object.keys(A).filter(p => !rows.find(r => r.path === p));
console.log('in diff but not in plan:', inDiffNotPlan.length, inDiffNotPlan.join(' ; '));
