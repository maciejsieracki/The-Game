'use strict';
/**
 * ai-city-garrison-measure-diag.cjs -- R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 (r4): zestawienie z JSONL runnera
 * (ai-economy-measure-run.cjs) zbudowanego z tymczasowa instrumentacja diagnostyczna (patrz runs/.../dowody-r4/diag-patch.py):
 *  - puste miasta AI w turach kontrolnych (pokoj/wojna),
 *  - per wlasciciel w t60: miasta/puste/poza miastem/skarbiec/utrzymanie,
 *  - histogram odejsc jedynej jednostki bojowej z miasta wg zrodla (plik:linia ai.ts) i wg wlasciciela,
 *  - powody braku rekrutacji garnizonu (pickNull/pickOther/buy:*).
 * Uzycie: node tools/ai-city-garrison-measure-diag.cjs <seedN.jsonl>
 */
const fs = require('fs');
const recs = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(l => JSON.parse(l));
const inWar = (r, o) => (r.wars && r.wars.pairs || []).some(p => p[0] === o || p[1] === o);
console.log('== puste miasta AI (bez wojska) / miasta');
for (const r of recs) {
  if (![10, 20, 30, 40, 50, 60].includes(r.turn)) continue;
  const a = { peace: [0, 0], war: [0, 0] };
  for (const o of r.owners) {
    if (o.owner === 0) continue;
    const k = inWar(r, o.owner) ? 'war' : 'peace';
    a[k][1] += o.miastaWojsko.length;
    a[k][0] += o.miastaWojsko.filter(c => c.wojsko === 0).length;
  }
  const all = [a.peace[0] + a.war[0], a.peace[1] + a.war[1]];
  console.log(`t${r.turn} pokoj ${a.peace[0]}/${a.peace[1]} wojna ${a.war[0]}/${a.war[1]} razem ${all[0]}/${all[1]} (${(100 * all[0] / Math.max(1, all[1])).toFixed(1)}%)`);
}
const last = recs[recs.length - 1];
console.log(`== per wlasciciel t${last.turn} (puste > 0)`);
const rows = last.owners.filter(o => o.owner !== 0).map(o => ({
  owner: o.owner, miasta: o.miastaWojsko.length, puste: o.miastaWojsko.filter(c => c.wojsko === 0).length,
  poza: o.wojskoPozaMiastem.length, wojsko: o.miastaWojsko.reduce((s, c) => s + c.wojsko, 0) + o.wojskoPozaMiastem.length,
  skarbiec: o.hud && o.hud.skarbiecStan != null ? o.hud.skarbiecStan : o.skarbiec, wojna: inWar(last, o.owner),
})).filter(r => r.puste > 0).sort((a, b) => b.puste - a.puste);
for (const r of rows) console.log(JSON.stringify(r));
const gd = last.diag && last.diag.garrisonDiag;
if (gd) {
  console.log('== odejscia jedynej jednostki bojowej z miasta wg zrodla (plik:linia komendy move; ">ownCity" = cel to wlasne miasto)');
  for (const [k, v] of Object.entries(gd.leave).sort((a, b) => b[1] - a[1])) console.log(' ', k, v);
  if (gd.leave2) {
    console.log('== faktyczne odejscia jedynej jednostki (pozycja przed/po petli komend wlasciciela) wg ostatniej komendy jednostki');
    for (const [k, v] of Object.entries(gd.leave2).sort((a, b) => b[1] - a[1])) console.log(' ', k, v);
  }
  console.log('== wg wlasciciela|plik');
  for (const [k, v] of Object.entries(gd.leaveOwner).sort((a, b) => b[1] - a[1])) console.log(' ', k, v);
  console.log('== rekrutacja garnizonu: wlasciciel|powod');
  for (const [k, v] of Object.entries(gd.recruit).sort()) console.log(' ', k, v);
}
