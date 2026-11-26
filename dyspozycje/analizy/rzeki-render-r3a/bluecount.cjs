'use strict';
/**
 * Licznik pikseli "rzeki" (jasny niebieski) w kadrze zblizenia (R-WEB-MAP-RIVER-RENDER-VISUAL-Q1, obrona r2).
 * Uzycie: node bluecount.cjs <plik1.png> [plik2.png ...]
 * Obszar: x 0..979, y 120..659 (bez HUD i bez oceanu po prawej). Progi: b >= 170, r <= 110, b - r >= 90.
 * Miara ILOSCI tuszu rzek w kadrze, nie szerokosci ani liczby linii. Ten sam kadr = ta sama kamera (zoom 8x).
 */
const path = require('path');
const fs = require('fs');
const { PNG } = require(path.resolve(__dirname, '../../../gra/node_modules/pngjs'));

for (const f of process.argv.slice(2)) {
  const P = PNG.sync.read(fs.readFileSync(f));
  let n = 0;
  for (let y = 120; y < 660; y++) {
    for (let x = 0; x < 980; x++) {
      const i = (y * P.width + x) * 4;
      const r = P.data[i];
      const b = P.data[i + 2];
      if (b >= 170 && r <= 110 && b - r >= 90) n++;
    }
  }
  console.log(JSON.stringify({ file: path.basename(f), bluePx: n }));
}
