// REPIN-DELTA-3 runda 2: klasyfikacja hunkow dc8a3adc -> 4bbef081d z rozdzieleniem komentarz/kod
// oraz wlascicielem hunka z blame (commit wprowadzajacy linie) zamiast dominujacego tagu pliku.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const REPO = '/home/user/The-Game/.claude/worktrees/wf_8c6276dd-898-3';
const NEW = '4bbef081d', OLD = 'dc8a3adc';
const run = (...a) => execFileSync('git', a, { cwd: REPO, maxBuffer: 1 << 30, encoding: 'utf8' });
const diff = fs.readFileSync(`${S}/d3.diff`, 'utf8');
const files = []; let cur = null, h = null;
for (const line of diff.split('\n')) {
  if (line.startsWith('diff --git ')) { cur = { path: line.split(' b/')[1], hunks: [] }; files.push(cur); h = null; continue; }
  const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (m) { h = { oldStart: +m[1], oldN: m[2] === undefined ? 1 : +m[2], newStart: +m[3], newN: m[4] === undefined ? 1 : +m[4], minus: [], plus: [] }; cur.hunks.push(h); continue; }
  if (!h) continue;
  if (line.startsWith('-') && !line.startsWith('---')) h.minus.push(line.slice(1));
  else if (line.startsWith('+') && !line.startsWith('+++')) h.plus.push(line.slice(1));
}
const subj = new Map();
for (const l of run('log', NEW, '--not', OLD, '--format=%H%x09%s').split('\n')) {
  const [hh, ...r] = l.split('\t'); if (hh) subj.set(hh, r.join('\t'));
}
const tagOf = s => {
  const m = /R-[A-Z0-9][A-Z0-9-]*|PYTANIE-\d+|ABC-\d+|\bK0\d[A-Z]?\b/.exec(s || '');
  if (m) return m[0].replace(/-Q\d+$/, '');
  // runda 2: commity bez tagu R- — mapowanie po slowach kluczowych tematu (zrodlo: temat commita)
  if (/STAGES|auto-ulepsz|autoimprove|auto-improv|tartak|wycink/i.test(s || '')) return 'R-WEB-AUTOIMPROVE(bez-R-tagu)';
  if (/fort|posterunek|terytori/i.test(s || '')) return 'R-WEB-OUTPOST-FORT-TERRITORY(bez-R-tagu)';
  if (/przegran|rozejm|wojn|pok[oó]j|agresor|dyplo|era-war|wymuszon/i.test(s || '')) return 'R-WEB-PEACE/WAR(bez-R-tagu)';
  if (/^docs\(release\): WERSJE/.test(s || '') || /^deploy\(robocza\)/.test(s || '')) return 'DEPLOY-WERSJE(bez-tematu)';
  if (/^merge:/.test(s || '')) return 'MERGE(bez-tematu)';
  return null;
};
const blame = {};
function loadBlame(path) {
  if (blame[path]) return blame[path];
  const out = run('blame', '--line-porcelain', NEW, '--', path);
  const arr = [null]; let curH = null;
  for (const l of out.split('\n')) {
    if (/^[0-9a-f]{40} \d+ \d+/.test(l)) curH = l.slice(0, 40);
    else if (l.startsWith('\t')) arr.push(curH);
  }
  blame[path] = arr; return arr;
}
const isBlank = s => s.trim() === '';
const isCom = s => /^\s*(\/\/|\/\*|\*|\*\/)/.test(s);
const isImp = s => /^\s*(import\s|export\s+(\*|\{[^}]*\}\s*from)|export\s+\{)/.test(s);
const isTyp = s => /^\s*(export\s+)?(type|interface)\s/.test(s) || (/^\s*\w+\??\s*:\s*[\w<>\[\]|"' .]+;?\s*$/.test(s) && !/[=(]/.test(s));
const strip = s => s.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`/g, '""').replace(/\/\/.*$/, '').replace(/\s+/g, '');
function cls(hk) {
  const all = [...hk.minus, ...hk.plus].filter(s => !isBlank(s));
  if (all.length === 0) return 'pusty';
  if (all.every(isCom)) return 'komentarz';
  if (all.every(isImp)) return 'import';
  if (all.every(isTyp)) return 'typ';
  if (hk.minus.length && hk.minus.length === hk.plus.length && hk.minus.every((s, i) => strip(s) === strip(hk.plus[i]))) return 'nazwa/tekst';
  const ms = hk.minus.map(strip).filter(x => x).sort().join('\n'), ps = hk.plus.map(strip).filter(x => x).sort().join('\n');
  if (ms === ps) return 'nazwa/tekst';
  const hasCode = all.some(s => !isCom(s) && !isImp(s) && !isTyp(s));
  const hasCom = all.some(isCom);
  if (!hasCode) return 'bez-kodu(komentarz/typ/import)';
  return hasCom ? 'kod+komentarz' : 'kod';
}
const rows = [];
for (const f of files) {
  const arr = loadBlame(f.path);
  for (const hk of f.hunks) {
    const c = cls(hk);
    const lines = hk.newN > 0 ? Array.from({ length: hk.newN }, (_, i) => hk.newStart + i) : [Math.max(1, hk.newStart)];
    const count = {};
    for (const n of lines) {
      const hh = arr[n]; if (!hh) continue;
      let sbj = subj.get(hh);
      if (!sbj) { sbj = run('log', '-1', '--format=%s', hh).trim(); }  // commit sprzed dc8 scalony po dc8
      const t = tagOf(sbj) || (subj.has(hh) ? 'BEZ-TAGU' : 'SCALONY-SPRZED-DC8(bez-tagu)');
      count[t] = (count[t] || 0) + 1;
    }
    const owner = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'NIEPRZYPISANY';
    const codeLines = [...hk.minus, ...hk.plus].filter(s => !isBlank(s) && !isCom(s) && !isImp(s) && !isTyp(s));
    rows.push({ file: f.path, newStart: hk.newStart, newN: hk.newN, oldN: hk.oldN, cls: c, owner, ownerCounts: count, codeLines: codeLines.length, firstPlus: (hk.plus.find(s => !isBlank(s)) || hk.minus.find(s => !isBlank(s)) || '').trim().slice(0, 90) });
  }
}
fs.writeFileSync(`${S}/hunks3.json`, JSON.stringify(rows));
const tally = k => rows.reduce((o, r) => ((o[r[k]] = (o[r[k]] || 0) + 1), o), {});
console.log('hunks', rows.length, 'files', files.length);
console.log('klasa', JSON.stringify(tally('cls')));
console.log('owner', JSON.stringify(tally('owner')));
