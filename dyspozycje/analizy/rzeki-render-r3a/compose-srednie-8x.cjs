'use strict';
// Kompozycja (uzycie: node compose-srednie-8x.cjs <katalog-runs> <8x|4x> <wyjscie.png> [cx cy]): wiersz 1 PRZED (S1, S2, ALL), wiersz 2 PO (S1, S2, ALL). Wycinek 320x240 ze srodka kadru, skala 2x.
const fs = require('fs');
const path = require('path');
const { PNG } = require(path.resolve(__dirname, '../../../gra/node_modules/pngjs'));
const [dir, zoom, out, cx = '640', cy = '400'] = process.argv.slice(2);
const names = [`PRZED-S1`, `PRZED-S2`, `PRZED`, `PO-S1`, `PO-S2`, `PO`];
const W = 320, H = 240, SC = 2, GAP = 8;
const files = names.map((n) => path.join(dir, `${n}-zblizenie-${zoom}.png`));
const imgs = files.map((f) => PNG.sync.read(fs.readFileSync(f)));
const cols = 3, rows = 2;
const OW = cols * W * SC + (cols - 1) * GAP, OH = rows * H * SC + (rows - 1) * GAP;
const out_ = new PNG({ width: OW, height: OH });
out_.data.fill(255);
imgs.forEach((img, k) => {
  const col = k % cols, row = Math.floor(k / cols);
  const ox = col * (W * SC + GAP), oy = row * (H * SC + GAP);
  const x0 = Math.round(cx - W / 2), y0 = Math.round(cy - H / 2);
  for (let y = 0; y < H * SC; y++) for (let x = 0; x < W * SC; x++) {
    const sx = x0 + Math.floor(x / SC), sy = y0 + Math.floor(y / SC);
    const si = (sy * img.width + sx) * 4, di = ((oy + y) * OW + (ox + x)) * 4;
    for (let c = 0; c < 4; c++) out_.data[di + c] = img.data[si + c];
  }
});
fs.writeFileSync(out, PNG.sync.write(out_));
console.log('ok', out, OW, OH, names.join(' | '));
