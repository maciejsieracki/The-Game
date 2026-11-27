'use strict';
/**
 * plrrevolt-summarize.cjs -- R-WEB-PLAYER-LASTCITY-REVOLT-Q1: podsumowanie biegu (tylko odczyt plikow runu).
 * Uzycie: node tools/plrrevolt-summarize.cjs <katalog-out-z-seedN.jsonl>
 * Dla wlasciciela 0 (gracz): liczba miast per tura, tury zmiany wlasciciela miast gracza (cityId -> nowy owner),
 * pierwsza tura bez miast gracza, oraz zdarzenia konsoli z events.log (Rebelia / Bunt / Barbarzyncy).
 * Porzadek miast NIE jest eksportowany przez hak metryk (cityOrderState lokalny w main.ts) -> NIE ZMIERZONO.
 */
const fs = require('fs');
const path = require('path');
const dir = path.resolve(process.argv[2]);
const jf = fs.readdirSync(dir).find(f => /^seed\d+\.jsonl$/.test(f));
const seed = jf.match(/\d+/)[0];
const recs = fs.readFileSync(path.join(dir, jf), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
let prevOwner = new Map();
const lines = [];
let firstZero = null;
for (const r of recs) {
  const own = new Map();
  for (const o of r.owners) for (const mw of (o.miastaWojsko || [])) own.set(mw.cityId, o.owner);
  const cityCount0 = (r.owners.find(o => o.owner === 0) || { miasta: 0 }).miasta;
  for (const [cid, oldO] of prevOwner) {
    const newO = own.get(cid);
    if (oldO === 0 && newO !== undefined && newO !== 0) lines.push(`t${r.turn}: ${cid} 0 -> ${newO}`);
  }
  if (cityCount0 === 0 && firstZero === null) firstZero = r.turn;
  prevOwner = own;
}
console.log(`seed=${seed} tur=${recs.length} ostatniaTura=${recs.length ? recs[recs.length - 1].turn : '-'}`);
console.log('ZMIANY WLASCICIELA MIAST GRACZA (wg miastaWojsko):', lines.length ? '\n  ' + lines.join('\n  ') : 'brak');
console.log('PIERWSZA TURA BEZ MIAST GRACZA:', firstZero === null ? 'brak (do ostatniej tury)' : firstZero);
const ev = path.join(dir, `seed${seed}.events.log`);
if (fs.existsSync(ev)) {
  const all = fs.readFileSync(ev, 'utf8').split('\n').filter(l => /evt-console/.test(l));
  const reb = all.filter(l => /Rebelia|\[Bunt\]|zdobyt|podbit|captur|conquer/i.test(l));
  console.log(`ZDARZENIA KONSOLI (rebelia/bunt/podboj): ${reb.length}`);
  for (const l of reb.slice(0, 40)) console.log('  ' + l.replace(/^\S+ evt-console /, '').slice(0, 160));
}
