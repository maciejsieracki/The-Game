// Mutacje na kopiach K07B: jedna zmiana w linii kodu bloku pinu, weryfikator musi zwrócić EXIT 1 (zabity).
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const V2 = process.argv[2];   // src-tauri/frontend-v2 (worktree)
const PIN = process.argv[3];  // katalog z gra/src (pin edb8fb56)
const SCR = process.argv[4];  // katalog roboczy poza repo
const files = ['k07b-p1.ts', 'k07b-p2.ts'];
const sites = [];
for (const f of files) {
  const lines = readFileSync(join(V2, 'src/ui/cityPanel', f), 'utf8').split('\n');
  let inBlock = false;
  lines.forEach((l, i) => {
    if (l.startsWith('// pin edb8fb56')) inBlock = true;
    else if (l === '// pin-end') inBlock = false;
    else if (inBlock && !/^\s*(\/\/|\*|\/\*)/.test(l) && /===|!==|&&|\|\| | \+ /.test(l)) sites.push({ f, i, l });
  });
}
const ops = [[/===/, '!=='], [/!==/, '==='], [/&&/, '||'], [/\|\|/, '&&'], [/ \+ /, ' - ']];
const mutants = [];
for (const s of sites) {
  const op = ops.find(([re]) => re.test(s.l));
  if (!op) continue;
  mutants.push({ id: `${s.f}:${s.i + 1}`, file: s.f, line: s.i, text: s.l.replace(op[0], op[1]) });
}
const stride = Math.max(1, Math.floor(mutants.length / 60));
const chosen = mutants.filter((_, k) => k % stride === 0);
let killed = 0;
const survived = [];
for (const m of chosen) {
  const dir = join(SCR, 'm');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'tools/dom-harness'), { recursive: true });
  mkdirSync(join(dir, 'src/ui/cityPanel'), { recursive: true });
  cpSync(join(V2, 'tools/dom-harness/verify-k07b-copies.mjs'), join(dir, 'tools/dom-harness/verify-k07b-copies.mjs'));
  cpSync(join(V2, 'tools/dom-harness/k07a-subs.mjs'), join(dir, 'tools/dom-harness/k07a-subs.mjs'));
  for (const f of files) cpSync(join(V2, 'src/ui/cityPanel', f), join(dir, 'src/ui/cityPanel', f));
  const p = join(dir, 'src/ui/cityPanel', m.file);
  const ls = readFileSync(p, 'utf8').split('\n');
  ls[m.line] = m.text;
  writeFileSync(p, ls.join('\n'));
  const r = spawnSync(process.execPath, [join(dir, 'tools/dom-harness/verify-k07b-copies.mjs'), '--pin-dir', PIN], { encoding: 'utf8' });
  if (r.status === 1) killed++;
  else survived.push({ id: m.id, status: r.status, text: m.text.trim().slice(0, 120) });
}
console.log(JSON.stringify({ sitesTotal: sites.length, mutantsTotal: mutants.length, run: chosen.length, killed, survivedCount: survived.length, survived }, null, 1));
