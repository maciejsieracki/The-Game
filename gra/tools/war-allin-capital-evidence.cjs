'use strict';
/** Zbiera logi dowodowe do dyspozycje/autobot/runs/R-WEB-WAR-ALLIN-CAPITAL-Q1/evidence/ (kazdy z EXIT=). */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const gra = path.resolve(__dirname, '..');
const out = path.resolve(gra, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-WAR-ALLIN-CAPITAL-Q1', 'evidence');
fs.mkdirSync(out, { recursive: true });
const jobs = [
  ['test.log.txt', [path.join(__dirname, 'war-allin-capital-test.cjs')]],
  ['sim-before-after.log.txt', [path.join(__dirname, 'war-allin-capital-quick.cjs'), '90']],
  ['perf.log.txt', [path.join(__dirname, 'war-allin-capital-perf.cjs'), '40', '3']],
  ['tsc.log.txt', [path.join(gra, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit']],
];
for (const [name, args] of jobs) {
  const r = spawnSync(process.execPath, args, { cwd: gra, encoding: 'utf8', maxBuffer: 1 << 28 });
  fs.writeFileSync(path.join(out, name), (r.stdout || '') + (r.stderr || '') + `\nEXIT=${r.status}\n`);
  console.log(name, 'EXIT=' + r.status);
}
