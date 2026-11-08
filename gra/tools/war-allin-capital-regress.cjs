'use strict';
/** Uruchamia testy dotkniete zmiana (AI / barbarzyncy / wojna wymuszona) i drukuje EXIT + ostatnia linie wyniku. */
const { spawnSync } = require('child_process');
const path = require('path');
const tests = process.argv.slice(2);
let bad = 0;
for (const t of tests) {
  const r = spawnSync(process.execPath, [path.join(__dirname, `${t}.cjs`)], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 300000, maxBuffer: 1 << 28 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split('\n').filter(l => /pass|fail|PASS|FAIL|ok|OK|\d+\s*\/\s*\d+/.test(l));
  console.log(`${t} EXIT=${r.status} :: ${(lines[lines.length - 1] || '').trim().slice(0, 140)}`);
  if (r.status !== 0) bad++;
}
console.log(`NIEZIELONE: ${bad}`);
process.exit(bad ? 1 : 0);
