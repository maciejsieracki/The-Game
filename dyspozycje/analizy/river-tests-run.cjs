'use strict';
/**
 * Równoległe uruchamianie testów rzek w kopii scratch (R-WEB-MAP-RIVER-TIERS-RECON-Q1, r3, pkt 7).
 * Użycie: node river-tests-run.cjs <SCRATCH-z-tools/> <wyjście.jsonl> <par> "<ENV=V;ENV2=V|->" <test1.cjs> <test2.cjs> ...
 * Testy kopiowane do <SCRATCH>/tools/ (tam gdzie ../src, ../node_modules). Wynik: linia JSON {test, env, code, ms, tail}.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const [, , SCRATCH, OUT, PAR, ENVS, ...tests] = process.argv;
const env = { ...process.env };
if (ENVS && ENVS !== '-') for (const kv of ENVS.split(';')) { const [k, v] = kv.split('='); env[k] = v; }
let next = 0, running = 0;
function launch() {
  while (running < Number(PAR) && next < tests.length) {
    const t = tests[next++];
    running++;
    const t0 = Date.now();
    const child = cp.spawn('node', [path.join(SCRATCH, 'tools', t)], { env, cwd: path.join(SCRATCH, 'tools') });
    let buf = '';
    child.stdout.on('data', (d) => { buf += d; });
    child.stderr.on('data', (d) => { buf += d; });
    child.on('close', (code) => {
      const lines = buf.split('\n').filter((l) => l && !l.startsWith('[civ]'));
      fs.appendFileSync(OUT, JSON.stringify({ test: t, env: ENVS, code, ms: Date.now() - t0, tail: lines.slice(-4) }) + '\n');
      running--;
      launch();
    });
  }
}
launch();
