'use strict';
// R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 (obrona r4, zarzut 4): przeliczenie etykiet w surowych JSON z offerLog.
// Stare pliki (wygenerowane przed poprawka klasyfikacji) mialy offers/offersOneShot zliczajace rozejm/trybut.
// Ta sama klasyfikacja co gra/tools/measure-ai-trade-offer-frequency-matrix.cjs (classify): handel = cykliczne + jednorazowe
// o actionId z {handel, umowa_handlowa, umowa_szlakow}; reszta = oferty dyplomatyczne. Stare wartosci zapisane w labelsBeforeRelabel.
// Uzycie: node relabel-r4.cjs <plik.json> [...]   (idempotentne: labelsBeforeRelabel nie jest nadpisywane)
const fs = require('fs');
const TRADE = new Set(['handel', 'umowa_handlowa', 'umowa_szlakow']);
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!Array.isArray(d.offerLog)) continue;
  const log = d.offerLog;
  const cyclic = log.filter(x => x.type !== 'jednorazowa').length;
  const oneShotAll = log.filter(x => x.type === 'jednorazowa').length;
  const oneShotTrade = log.filter(x => x.type === 'jednorazowa' && TRADE.has(x.actionId)).length;
  const other = {};
  for (const x of log) if (x.type === 'jednorazowa' && !TRADE.has(x.actionId)) other[x.actionId] = (other[x.actionId] || 0) + 1;
  const t = d.turnsRun || 0;
  if (!d.labelsBeforeRelabel) d.labelsBeforeRelabel = { offers: d.offers, offersOneShot: d.offersOneShot, offersOneShotAll: d.offersOneShotAll ?? null, otherActions: d.otherActions ?? null };
  d.offersCyclic = cyclic;
  d.offersOneShot = oneShotTrade;
  d.offersOneShotAll = oneShotAll;
  d.offers = cyclic + oneShotTrade;
  d.otherActions = other;
  d.per100 = t ? +((d.offers * 100) / t).toFixed(2) : 0;
  d.relabelNote = 'etykiety przeliczone z offerLog (klasyfikacja jak w measure-ai-trade-offer-frequency-matrix.cjs); pierwotne w labelsBeforeRelabel';
  fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
  console.log('relabel', f, 'offers', d.offers, 'cyclic', cyclic, 'oneShotTrade', oneShotTrade, 'other', JSON.stringify(other));
}
