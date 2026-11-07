'use strict';
// analiza.cjs -- porownanie pomiaru N=10 vs N=3 (ta sama instrumentacja, seed 4242, Maly, 3 AI + panstwa-miasta).
// Uzycie: node analiza.cjs <n10.json> <n3.json>
const fs = require('fs');
const [a, b] = process.argv.slice(2);
const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const runs = { N10: load(a), N3: load(b) };
const ownersOf = (R) => [...new Set(R.perTurn.flatMap((p) => p.rows.map((r) => r.o)))].sort((x, y) => x - y);
const at = (R, t) => R.perTurn.find((x) => x.turn === t);
for (const [n, R] of Object.entries(runs)) {
  console.log(`== ${n}: tury ${R.perTurn[0].turn}..${R.perTurn[R.perTurn.length - 1].turn}, done=${R.done}, error=${R.error || 'brak'}, owners=${ownersOf(R).join(',')}`);
  for (const t of [20, 40, 60, 80, 100]) {
    const p = at(R, t); if (!p) { console.log(`T${t} brak`); continue; }
    const ai = p.rows.filter((r) => r.o !== 0);
    const sumMil = ai.reduce((s, r) => s + r.mil, 0);
    const sumCities = ai.reduce((s, r) => s + r.cities, 0);
    const minTreas = Math.min(...ai.map((r) => r.treas));
    const zeroMil = ai.filter((r) => r.mil === 0).map((r) => r.o);
    const row = ai.map((r) => `${r.o}:m${r.mil}/c${r.cities}/$${r.treas}${r.war ? '/W' : ''}`).join(' ');
    console.log(`T${t} sumMil=${sumMil} sumMiasta=${sumCities} minSkarb=${minTreas} zeroMil=[${zeroMil}] | ${row}`);
  }
  let neg = 0, tot = 0, wars = 0, minT = Infinity, zero = 0;
  const cityDrop = [];
  const prevCities = {};
  for (const p of R.perTurn) {
    for (const r of p.rows) {
      tot++;
      if (r.treas < 0) neg++;
      if (r.war) wars++;
      minT = Math.min(minT, r.treas);
      if (r.mil === 0) zero++;
      if (prevCities[r.o] !== undefined && r.cities < prevCities[r.o]) cityDrop.push(`T${p.turn}:o${r.o} ${prevCities[r.o]}->${r.cities}`);
      prevCities[r.o] = r.cities;
    }
  }
  console.log(`   (owner,tura) skarbiec<0: ${neg}/${tot}; (owner,tura) w wojnie: ${wars}; min skarbiec: ${minT}; (owner,tura) z 0 wojsk: ${zero}`);
  console.log(`   spadki liczby miast: ${cityDrop.length ? cityDrop.join(' ; ') : 'brak'}`);
  const last = R.perTurn[R.perTurn.length - 1];
  console.log(`   T${last.turn} miasta razem (owner>0): ${last.rows.reduce((s, r) => s + r.cities, 0)}`);
}
