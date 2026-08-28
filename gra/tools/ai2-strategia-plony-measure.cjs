'use strict';
/**
 * ai2-strategia-plony-measure.cjs — POMIAR OPERATORA (nie bramka), runda 2,
 * czesc B tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1: liczbowa podstawa PROJEKTU STRATEGII.
 *
 * Dla kazdego ulepszenia liczy DELTE plonu heksa na ture (`tileYield`, src/game/economy.ts)
 * wzgledem tego samego heksa bez tego ulepszenia — osobno dla reprezentatywnych terenow.
 * Kolejnosc priorytetow profilu ma wynikac z TYCH liczb, nie z intuicji.
 *
 * Run z gra/:  node tools/ai2-strategia-plony-measure.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = process.env.AI2_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.ai2-plony-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai2-plony-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'warning' });
const M = require(BUNDLE);
const TI = require(path.resolve(GRA_ROOT, 'data', 'terrain-improvements.json'));

const TERENY = [
  ['Laka  bez rzeki', { terenBazowy: 'laka', nakladka: 'brak', maRzeke: false }],
  ['Laka  Z RZEKA  ', { terenBazowy: 'laka', nakladka: 'brak', maRzeke: true }],
  ['Laka  las+rzeka', { terenBazowy: 'laka', nakladka: 'las', maRzeke: true }],
  ['Rownina Z RZEKA', { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: true }],
  ['Wzgorza bez rz. ', { terenBazowy: 'wzgorza', nakladka: 'brak', maRzeke: false }],
];
const KLUCZE = Object.keys(TI).filter(k => typeof TI[k] === 'object' && TI[k] !== null && !Array.isArray(TI[k]));

function d(base, withImp) {
  return {
    z: (withImp.zywnosc || 0) - (base.zywnosc || 0),
    p: (withImp.praca || 0) - (base.praca || 0),
    h: (withImp.handel || 0) - (base.handel || 0),
    dr: (withImp.drewno || 0) - (base.drewno || 0),
  };
}
console.log('# DELTA PLONU NA TURE per ulepszenie (tileYield), zywnosc/praca/handel/drewno + koszt Pracy');
for (const [nazwa, tile] of TERENY) {
  const base = M.tileYield({ ...tile, ulepszeniaKeys: [] });
  console.log(`\n## ${nazwa}  (baza: zyw ${base.zywnosc} · praca ${base.praca} · handel ${base.handel} · drewno ${base.drewno})`);
  const rows = [];
  for (const k of KLUCZE) {
    const y = M.tileYield({ ...tile, ulepszeniaKeys: [k] });
    const dd = d(base, y);
    if (dd.z === 0 && dd.p === 0 && dd.h === 0 && dd.dr === 0) continue;
    const meta = M.getImprovementMeta(k);
    rows.push({ k, ...dd, koszt: meta ? meta.kosztPraca : null, suma: dd.z + dd.p + dd.h });
  }
  rows.sort((a, b) => b.suma - a.suma);
  for (const r of rows) {
    console.log(`  ${r.k.padEnd(20)} zyw ${String(r.z).padStart(3)} · praca ${String(r.p).padStart(3)} · handel ${String(r.h).padStart(3)} · drewno ${String(r.dr).padStart(3)} | suma z+p+h ${String(r.suma).padStart(3)} | koszt Pracy ${r.koszt}`);
  }
  // pary „farma + X"
  const bazaFarma = M.tileYield({ ...tile, ulepszeniaKeys: ['farma'] });
  const pary = [];
  for (const k of KLUCZE) {
    if (k === 'farma') continue;
    const y = M.tileYield({ ...tile, ulepszeniaKeys: ['farma', k] });
    const dd = d(bazaFarma, y);
    if (dd.z === 0 && dd.p === 0 && dd.h === 0 && dd.dr === 0) continue;
    pary.push({ k, ...dd, suma: dd.z + dd.p + dd.h });
  }
  pary.sort((a, b) => b.suma - a.suma);
  if (pary.length) {
    console.log(`  -- warstwa DRUGA na farmie (baza farma: zyw ${bazaFarma.zywnosc} · praca ${bazaFarma.praca} · handel ${bazaFarma.handel}) --`);
    for (const r of pary.slice(0, 8)) {
      console.log(`  +${r.k.padEnd(19)} zyw ${String(r.z).padStart(3)} · praca ${String(r.p).padStart(3)} · handel ${String(r.h).padStart(3)} · drewno ${String(r.dr).padStart(3)} | suma z+p+h ${String(r.suma).padStart(3)}`);
    }
  }
}
