const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const rows = fs.readFileSync(f, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const out = [];
  for (const t of [10, 30, 58, 60]) {
    const r = rows.find(x => x.turn === t);
    if (!r) { out.push(`t${t}: brak`); continue; }
    const aiIds = new Set((r.cityState || []).filter(o => !o.czlowiek).map(o => o.owner));
    let m = 0, p = 0, pr = 0, u = 0;
    for (const o of (r.cityState || [])) {
      if (o.czlowiek) continue;
      m += o.miasta || 0; p += o.porPctSuma || 0; pr += o.ponizejProgu || 0;
    }
    for (const o of (r.owners || [])) if (aiIds.has(o.owner)) u += o.jednostkiWojskowe || 0;
    out.push(`t${t}: jedn. AI ${u}, miasta AI ${m}, por.sr ${(m ? p / m : 0).toFixed(1)}%, ponizej 14% ${pr}, unitCostPace=${r.unitCostPace}`);
  }
  console.log(f.split('/').slice(-2).join('/'));
  console.log(out.join('\n'));
}
