'use strict';
/**
 * ai-ai-alliance-limit-audit.cjs -- R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1 (analiza danych pomiaru).
 * Wejście: pliki JSONL z gra/tools/diplomacy-harder-measure-run.cjs (wiersz = tura, diplo.pairs[] z a,b,aiAi,status).
 * Wyjście: per plik tabela tur (pary sojuszu, maks. sojuszy na cywilizację, duplikaty, pary spoza AI),
 * pierwsza tura przekroczenia limitu i para(y), które przekraczają.
 *
 *   node tools/ai-ai-alliance-limit-audit.cjs [plik.jsonl ...] [--limit 2] [--co 5]
 *   domyślnie: /tmp/allflags-keep/seed*-all1.jsonl oraz seed*-all0.jsonl, limit 2, co 5 tur.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let limit = 2;
let co = 5;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit') limit = Number(args[++i]);
  else if (args[i] === '--co') co = Number(args[++i]);
  else files.push(args[i]);
}
if (files.length === 0) {
  const dir = '/tmp/allflags-keep';
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).sort()) if (/^seed\d+-all[01]\.jsonl$/.test(f)) files.push(path.join(dir, f));
  }
}

for (const file of files) {
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  console.log(`== ${path.basename(file)} (wierszy: ${rows.length}, limit ${limit})`);
  let pierwsze = null;
  let maxCalosc = 0;
  let duplikaty = 0;
  let poza = 0;
  for (const r of rows) {
    if (!r.diplo || !Array.isArray(r.diplo.pairs)) continue;
    const sojusze = r.diplo.pairs.filter(p => p.status === 'sojusz');
    const seen = new Set();
    const naCiv = new Map();
    for (const p of sojusze) {
      const k = Math.min(p.a, p.b) + '-' + Math.max(p.a, p.b);
      if (seen.has(k)) duplikaty++;
      seen.add(k);
      if (p.aiAi !== true) poza++;
      naCiv.set(p.a, (naCiv.get(p.a) ?? 0) + 1);
      naCiv.set(p.b, (naCiv.get(p.b) ?? 0) + 1);
    }
    const mx = Math.max(0, ...naCiv.values());
    maxCalosc = Math.max(maxCalosc, mx);
    const przekroczone = [...naCiv.entries()].filter(([, n]) => n > limit).map(([c]) => c);
    if (przekroczone.length && !pierwsze) {
      pierwsze = {
        tura: r.turn,
        civ: przekroczone,
        pary: sojusze.filter(p => przekroczone.includes(p.a) || przekroczone.includes(p.b)).map(p => `${p.a}-${p.b}`),
      };
    }
    if (r.turn % co === 0 || r.turn === rows[rows.length - 1].turn) {
      console.log(`  t${r.turn}\tpary=${sojusze.length}\tmax_na_civ=${mx}\t${mx > limit ? 'PRZEKROCZONY' : 'ok'}`);
    }
  }
  console.log(`  maks. sojuszy na cywilizację (cała seria): ${maxCalosc}; duplikaty par: ${duplikaty}; pary z nie-AI: ${poza}`);
  console.log(`  pierwsze przekroczenie: ${pierwsze ? `tura ${pierwsze.tura}, civ ${pierwsze.civ.join(',')}, pary ${pierwsze.pary.join(' ')}` : 'brak'}`);
}
