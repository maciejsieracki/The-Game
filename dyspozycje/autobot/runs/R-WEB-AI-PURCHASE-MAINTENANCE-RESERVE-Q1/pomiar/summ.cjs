const fs = require('fs');
const [a, b] = process.argv.slice(2);
const load = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const A = load(a), B = load(b);
const majors = [1, 7, 13];
const at = (R, t) => R.perTurn.find((x) => x.turn === t);
function line(R, t) {
  const p = at(R, t); if (!p) return null;
  return majors.map((o) => p.rows.find((r) => r.o === o)).filter(Boolean);
}
for (const t of [20, 40, 60, 80, 100]) {
  const x = line(A, t), y = line(B, t);
  if (!x || !y) { console.log('T' + t, 'brak'); continue; }
  const f = (rows) => rows.map((r) => `${r.o}: mil ${r.mil} mst ${r.cities} skarb ${r.treas} utrz ${r.upkeep}`).join(' | ');
  console.log(`T${t} BAZA  ${f(x)}\nT${t} PO    ${f(y)}`);
  console.log(`   sumMil baza ${x.reduce((s, r) => s + r.mil, 0)} po ${y.reduce((s, r) => s + r.mil, 0)}`);
}
// bankructwo: tury ze skarbcem <0 u majors
for (const [n, R] of [['baza', A], ['po', B]]) {
  let neg = 0, tot = 0, wars = 0, minT = 1e9, zeroMil = 0;
  for (const p of R.perTurn) for (const r of p.rows.filter((r) => majors.includes(r.o))) { tot++; if (r.treas < 0) neg++; if (r.war) wars++; minT = Math.min(minT, r.treas); if (r.mil === 0) zeroMil++; }
  console.log(n, 'tury<0:', neg + '/' + tot, 'tury-w-wojnie:', wars, 'min skarb:', minT, 'tury z 0 wojsk:', zeroMil, 'ostatnia tura', R.perTurn[R.perTurn.length - 1].turn);
}
// wszystkie AI (z miastami panstw)
for (const [n, R] of [['baza', A], ['po', B]]) {
  const p = at(R, 40); console.log(n, 'T40 wszystkie AI mil:', p.rows.reduce((s, r) => s + r.mil, 0), 'skarb<0:', p.rows.filter((r) => r.treas < 0).length);
}
