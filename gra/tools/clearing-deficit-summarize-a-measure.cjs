'use strict';
/**
 * clearing-deficit-summarize-a-measure.cjs — czytelny przebieg tura po turze dla wyniku A.
 * Usage: node tools/clearing-deficit-summarize-a-measure.cjs <A-*.json>
 */
const fs = require('fs');
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log('TAG', j.tag, 'target', JSON.stringify(j.target), 'river', j.riverFound, 'assign', JSON.stringify(j.assign));
console.log('policy', JSON.stringify(j.policy), 'popFixture', j.popFixture);
console.log('nCand', j.scen && j.scen.nCand, 'hexAfterPlant', JSON.stringify(j.hexAfterPlant));
for (const r of j.error ? [] : j.rows) {
  const tk = j.target.q + ',' + j.target.r;
  const evs = r.ev.filter((e) => e.ev !== 'layers-set' || e.k === tk).map((e) => e.ev === 'clr-set' ? `SET(turn${e.turn},left${e.v.turnsLeft},praca/t${e.v.pracaPerTurn})@${e.k}` : e.ev === 'clr-del' ? `DEL@${e.k}` : `LAYERS@${e.k}=${(e.layers || []).join('+')}`).join(' ');
  console.log(`t${r.turnAfter - 1}->${r.turnAfter} drewno ${r.drewnoBefore}->${r.drewnoAfter} praca ${Math.round(r.pracaBefore)}->${Math.round(r.pracaAfter)} autoKoszt=${r.kosztAutoUlepszen} | hex before[nak=${r.before.nakladka} clr=${r.before.clearing ? r.before.clearing.turnsLeft : '-'} L=${r.before.layers.join('+') || '-'} worked=${r.before.worked}] after[nak=${r.after.nakladka} clr=${r.after.clearing ? r.after.clearing.turnsLeft : '-'} L=${r.after.layers.join('+') || '-'}] | ${evs}`);
}
if (j.reload) console.log('RELOAD', JSON.stringify({ turn: j.reload.turn, pre: j.reload.pre, post: j.reload.post, hexPost: j.reload.hexPost, ev: j.reload.evAfterReload }));
console.log('FINAL', JSON.stringify(j.final), 'errors', JSON.stringify(j.errors));
