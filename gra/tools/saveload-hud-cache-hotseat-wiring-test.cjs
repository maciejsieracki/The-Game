'use strict';
/**
 * saveload-hud-cache-hotseat-wiring-test.cjs — R-WEB-HOTSEAT-HUD-CACHE-Q1 (statyczny).
 * Dowodzi, ze `restoreGameFromSave` zeruje WSZYSTKIE 6 cache HUD dla KAZDEGO fotela z
 * `humanSeats.humanOwnerIds` (pola kultura/auto-ulepszenia/cuda nie da sie zabrudzic w
 * hot-seat Chromium bez konca tury -- ten test jest dla nich dowodem w kodzie).
 * Usage (z gra/): node tools/saveload-hud-cache-hotseat-wiring-test.cjs
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../src/main.ts'), 'utf8');
let pass = 0, fail = 0;
const ok = (l, c) => { if (c) { pass++; console.log('  OK  ' + l); } else { fail++; console.error(' FAIL ' + l); } };
const start = src.indexOf('function restoreGameFromSave(');
ok('restoreGameFromSave znaleziona', start > 0);
const nextFn = src.indexOf('\n    function ', start + 40);
const body = src.slice(start, nextFn > 0 ? nextFn : undefined);
const loop = /for \(const oid of humanSeats\.humanOwnerIds\) \{([^}]*)\}/g;
let found = null, m;
while ((m = loop.exec(body))) if (/setOwnerLastPracaRate\(oid, 0\)/.test(m[1])) found = m[1];
ok('petla po humanSeats.humanOwnerIds zerujaca cache istnieje', !!found);
for (const f of ['setOwnerLastPracaRate', 'setOwnerLastPracaUpkeep', 'setOwnerLastPracaAutoUlepszeniaKoszt',
  'setOwnerLastPracaCudaKoszt', 'setOwnerLastKultura', 'setOwnerLastKulturaRate']) {
  ok(f + '(oid, 0) w petli', !!found && found.includes(f + '(oid, 0);'));
}
ok('_lastPraca (pula) NIE zerowane w petli', !!found && !/setOwnerLastPraca\(/.test(found));
console.log('\nsaveload-hud-cache-hotseat-wiring-test: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail ? 1 : 0);
