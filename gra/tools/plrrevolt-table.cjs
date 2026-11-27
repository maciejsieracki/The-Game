'use strict';
/**
 * plrrevolt-table.cjs -- R-WEB-PLAYER-LASTCITY-REVOLT-Q1 (obrona r2): tabela z zapisow biegow (tylko odczyt).
 * Uzycie: node tools/plrrevolt-table.cjs <katalog-z-plikami-*.jsonl.gz>
 * Dla kazdego biegu: ostatnia tura, pierwsza tura bez miast gracza (owner 0), zmiana liczby miast
 * owner 1 i owner -99 w tej turze (ownersOfCities), tury z -99 w ownersOfCities, zakres jednostek gracza.
 * Porzadek (Morale/Porzadek) NIE jest w tych zapisach -> nie jest tu raportowany (NIE ZMIERZONO).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const dir = path.resolve(process.argv[2]);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl.gz')).sort();
console.log('bieg | ostatniaTura | turaUtratyMiastGracza | owner1 delta w tej turze | citiesAll delta | pierwszaTura owner-99 w ownersOfCities | jW gracza min..max');
for (const f of files) {
  const recs = zlib.gunzipSync(fs.readFileSync(path.join(dir, f))).toString('utf8')
    .split('\n').filter(Boolean).map(l => JSON.parse(l));
  let lossTurn = null, lossIdx = -1, rebelFirst = null, jwMin = Infinity, jwMax = -Infinity;
  const cnt = (r, o) => { const x = r.owners.find(q => q.owner === o); return x ? x.miasta : 0; };
  recs.forEach((r, i) => {
    const p = r.owners.find(o => o.owner === 0);
    if (p) { jwMin = Math.min(jwMin, p.jednostkiWojskowe); jwMax = Math.max(jwMax, p.jednostkiWojskowe); }
    const oc = (r.diag && r.diag.ownersOfCities) || [];
    if (rebelFirst === null && oc.includes(-99)) rebelFirst = r.turn;
    if (lossTurn === null && cnt(r, 0) === 0 && i > 0) { lossTurn = r.turn; lossIdx = i; }
  });
  let d1 = 'brak', dAll = 'brak';
  if (lossIdx > 0) {
    const a = recs[lossIdx - 1], b = recs[lossIdx];
    d1 = `${cnt(a, 1)}->${cnt(b, 1)}`;
    dAll = `${a.diag.citiesAll}->${b.diag.citiesAll}`;
  }
  const last = recs[recs.length - 1].turn;
  console.log(`${f.replace('.jsonl.gz', '')} | t${last} | ${lossTurn === null ? 'brak' : 't' + lossTurn} | ${d1} | ${dAll} | ${rebelFirst === null ? 'brak' : 't' + rebelFirst} | ${jwMin}..${jwMax}`);
}
