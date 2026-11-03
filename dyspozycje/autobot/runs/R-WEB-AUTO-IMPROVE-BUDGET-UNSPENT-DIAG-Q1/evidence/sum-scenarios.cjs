const fs = require('fs');
const EV = '/home/user/The-Game/.claude/worktrees/wf_38915974-af5-1/dyspozycje/autobot/runs/R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1/evidence/';
for (const f of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(EV + f + '.json', 'utf8'));
  console.log('\n##### ' + f, 'errors=', JSON.stringify(j.errors), 'foundAt=', JSON.stringify(j.foundAt), 'policy=', JSON.stringify(j.effectivePolicy0 && j.effectivePolicy0[0]));
  let totSpent = 0;
  for (const r of j.rows) {
    const c = r.calls.map(x => `pool=${Math.round(x.pool)} n=${x.picksN} cost=${x.picksCost} ${JSON.stringify(x.hist)} probe=${x.probeN}/${x.probeCost} ${JSON.stringify(x.probeHist)}`).join(' || ');
    totSpent += r.kosztAuto;
    console.log(`t${r.turnAfter} pool ${Math.round(r.poolBefore)}->${Math.round(r.poolAfter)} auto=${r.kosztAuto} ev=${r.evN} pops=${r.cities.map(c => c.pop)} def=${r.deficitN} | ${c || 'BRAK WYWOLANIA'}`);
  }
  console.log('suma autoKoszt=', totSpent);
  for (const [t, s] of Object.entries(j.snaps)) {
    console.log(`SNAP t${t}: total=${s.total} owned=${s.owned} cities=${JSON.stringify(s.perCity.map(c => `pop${c.pop}/worked${c.workedN}/hex${c.hexesInRadius}`))} nTech=${s.nTechs}`);
    console.log('   classes=', JSON.stringify(s.classes));
    console.log('   hasKey=', JSON.stringify(s.hasKeyCounts), ' terenBez=', JSON.stringify(s.terenInEmpty));
  }
}
