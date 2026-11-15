'use strict';
/**
 * ai-trade-qty-cap-bench.cjs — R-WEB-AI-TRADE-OFFER-QTY-CAP-3X-NEED-Q1, pomiar czasu petli.
 * Usage (from gra/): node tools/ai-trade-qty-cap-bench.cjs [sciezka-do-modulu.ts]
 * Domyslnie: src/game/ai-trade-proposal.ts. Scenariusz: zapas gracza (nadwyzka) Z w {20000, 100000},
 * potrzeba AI duza (netRate = -Z), bramka przepuszcza tylko odbior <= 5 (wymusza przeszukanie).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const modulePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', 'src', 'game', 'ai-trade-proposal.ts');
const BUNDLE = path.resolve(__dirname, '.ai-trade-qty-bench-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-qty-bench-entry.ts');
fs.writeFileSync(entry, `export { selectAiTradeBarter } from ${JSON.stringify(modulePath)};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { selectAiTradeBarter } = require(BUNDLE);

function run(Z) {
  let calls = 0;
  const t0 = process.hrtime.bigint();
  const r = selectAiTradeBarter({
    aiResources: [
      { key: 'drewno', stock: 1e9, netRate: 0, deficit: false, surplus: true, reserve: 0 },
      { key: 'wegiel', stock: 0, netRate: -Z, deficit: true, surplus: false, reserve: 0 },
    ],
    playerResources: [
      { key: 'drewno', stock: 0, netRate: -1, deficit: true, surplus: false, reserve: 0 },
      { key: 'wegiel', stock: Z, netRate: 0, deficit: false, surplus: true, reserve: 0 },
    ],
    turns: 1,
    fairnessGate: (g, rq) => { calls++; return rq <= 5; },
    resolvePayloadPn: p => ({ givePn: p.giveItems[0].ilosc, receivePn: p.receiveItems[0].ilosc }),
    evaluateExactPayload: () => true,
  });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { ms, calls, receiveQty: r ? r.receiveQty : null };
}

console.log('module: ' + modulePath);
for (const Z of (process.env.BENCH_Z ? process.env.BENCH_Z.split(",").map(Number) : [20000, 100000])) {
  const res = run(Z);
  console.log(`Z=${Z}: czas=${res.ms.toFixed(1)} ms, wywolania bramki=${res.calls}, receiveQty=${res.receiveQty}`);
}
fs.rmSync(BUNDLE, { force: true });
fs.rmSync(entry, { force: true });
