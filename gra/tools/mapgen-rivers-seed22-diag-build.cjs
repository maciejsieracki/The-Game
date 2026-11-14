#!/usr/bin/env node
/**
 * Buduje wrapper generacji do Node (esbuild) z opcjonalną instrumentacją liczników (plugin onLoad —
 * src/ NIE jest zmieniany na dysku). Użycie: node mapgen-rivers-seed22-diag-build.cjs <esbuild-main.js> <out.js> [--instr]
 * Instrumentacja: licznik wejść do wybranych funkcji; co 10 s (Date.now) wypisuje stan liczników na stderr.
 */
const path = require('path'); const fs = require('fs');
const esbuild = require(process.argv[2]);
const out = process.argv[3]; const instr = process.argv.includes('--instr');
const plugin = {
  name: 'instr',
  setup(b) {
    b.onLoad({ filter: /gen-helpers\.ts$/ }, (a) => {
      let s = fs.readFileSync(a.path, 'utf8');
      if (instr) {
        const names = ['growRiverInlandBeforeDrainage', 'estimateLandCentroidFromSeed', 'estimateLandCentroidFromSeedUncached', 'aStarRiverToTarget', 'aStarRiverToSea'];
        for (const n of names) {
          // Początek ciała: pierwszy wiersz zaczynający się od ")" i kończący na "{" po sygnaturze
          // (jednowierszowe sygnatury: "function n(...): T {" w jednym wierszu).
          const st = new RegExp('(?:export\\s+)?function\\s+' + n + '\\b').exec(s);
          if (!st) { console.error('NO MATCH', n); continue; }
          const tail = s.slice(st.index);
          const bm = /(?:\n\)[^\n]*\{\n)|(?:^[^\n]*\)[^\n]*\{\n)/.exec(tail);
          if (!bm) { console.error('NO BODY', n); continue; }
          const re = null;
          const bodyStart = st.index + bm.index + bm[0].length - 1;
          const m = { index: bodyStart };
          const hook = ` const __g:any=globalThis; const __d=(__g.__diag??(__g.__diag={})); __d['${n}']=(__d['${n}']|0)+1; const __n=Date.now(); if(!__g.__dl||__n-__g.__dl>=10000){ __g.__dl=__n; console.error('CNT t='+((__n-(__g.__diagT0||__n))/1000).toFixed(0)+'s '+JSON.stringify(__d)); }`;
          void re;
          s = s.slice(0, m.index) + hook + '\n' + s.slice(m.index);
        }
      }
      return { contents: s, loader: 'ts' };
    });
  },
};
esbuild.build({
  entryPoints: [path.join(__dirname, 'mapgen-rivers-seed22-diag-wrap.ts')],
  bundle: true, platform: 'node', format: 'cjs', outfile: out, plugins: [plugin], logLevel: 'error',
  loader: { '.json': 'json' },
}).catch(() => process.exit(1));
