'use strict';
/**
 * ai-cult-rel-measure-flow.cjs -- R-WEB-AI-CULT-REL-DIAG-Q1 (obrona): zestawienie przepływów z JSONL wyprodukowanego
 * przez ai-cult-rel-measure-run.cjs z flagami `--unit-flow 1 --city-state 1` (tylko odczyt plików, zero wpływu na grę).
 *
 * Uzycie: node tools/ai-cult-rel-measure-flow.cjs <etykieta=katalog> ...   (katalog z seed<S>.jsonl)
 * Per etykieta (właściciele AI = owner > 0; gracz = 0, rebelianci = -99, barbarzyńcy = -1):
 *   - stan co 10 tur: miasta, jednostki wojskowe, puste miasta, Porządek śr. (PorPct), miasta poniżej progu buntu skrajnego,
 *     bunt, rebelia, skarbiec AI;
 *   - NOWE jednostki AI od tury 2 (`noweId`: produkcja i zakup RAZEM -- rozdziału nie mierzy hak);
 *   - ZNIKNIĘCIA jednostek AI wg przyczyny (`zniknietePrzyczyny`, `zniknieteBezPrzyczyny`);
 *   - PRZEJĘCIA miast (z -> na) z pola `cityTransfers` (liczone przez hak cityTransfersLast);
 *   - utrzymanie jednostek i budynków AI (suma po turach, pieniądz), z pola owners;
 *   - pierwsza tura, w której AI ma budynki Prawa / Szczęścia (z hud.budynkiPerTyp każdej tury).
 */
const fs = require('fs');
const path = require('path');
const LAW = ['garnizon', 'pretorium', 'dom_starszyzny', 'dwor_zarzadcy', 'sad', 'trybunal'];
const HAP = ['swiatynia', 'kamienne_kregi', 'teatr', 'akademia', 'biblioteka', 'stela', 'laznia_publiczna', 'studnia', 'akwedukt'];
const NAZWA = { 0: 'gracz', '-99': 'rebelia', '-1': 'barbarzynca' };
const nazwa = (o) => NAZWA[String(o)] || ('AI' + o);

function analizuj(dir) {
  const files = fs.readdirSync(dir).filter(f => /^seed\d+\.jsonl$/.test(f));
  const out = [];
  for (const f of files) {
    const recs = fs.readFileSync(path.join(dir, f), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    const sum = { plik: f, nowe: 0, znikniecia: {}, utraconeMiasta: {}, zdobyteMiasta: {}, utrzymanieJednostek: 0, utrzymanieBudynkow: 0, stan: [], pierwszaTuraPrawo: null, pierwszaTuraSzczescie: null };
    for (const r of recs.sort((a, b) => a.turn - b.turn)) {
      const uf = r.unitFlow;
      if (uf && !uf.baseline) {
        for (const o of uf.owners) {
          if (o.owner <= 0) continue;
          sum.nowe += o.noweId;
          for (const [k, v] of Object.entries(o.zniknietePrzyczyny || {})) sum.znikniecia[k] = (sum.znikniecia[k] || 0) + v;
          sum.znikniecia['bez-przyczyny'] = (sum.znikniecia['bez-przyczyny'] || 0) + (o.zniknieteBezPrzyczyny || 0);
        }
      }
      for (const tr of r.cityTransfers || []) {
        if (tr.z > 0 && tr.z !== tr.na) {
          const k = tr.na > 0 ? 'AI->AI' : 'AI->' + nazwa(tr.na);
          sum.utraconeMiasta[k] = (sum.utraconeMiasta[k] || 0) + tr.liczba;
        }
        if (tr.na > 0 && tr.z !== tr.na) {
          const k = tr.z > 0 ? 'AI<-AI' : 'AI<-' + nazwa(tr.z);
          sum.zdobyteMiasta[k] = (sum.zdobyteMiasta[k] || 0) + tr.liczba;
        }
      }
      const ai = r.owners.filter(o => o.owner > 0);
      sum.utrzymanieJednostek += ai.reduce((s, o) => s + (o.utrzymanieJednostekPieniadz || 0), 0);
      sum.utrzymanieBudynkow += ai.reduce((s, o) => s + (o.utrzymanieBudynkowPieniadz || 0), 0);
      let law = 0, hap = 0;
      for (const o of ai) {
        const b = (o.hud && o.hud.budynkiPerTyp) || {};
        for (const id of LAW) law += b[id] || 0;
        for (const id of HAP) hap += b[id] || 0;
      }
      if (law > 0 && sum.pierwszaTuraPrawo === null) sum.pierwszaTuraPrawo = r.turn;
      if (hap > 0 && sum.pierwszaTuraSzczescie === null) sum.pierwszaTuraSzczescie = r.turn;
      if (r.turn % 10 === 0 && r.cityState) {
        const cs = r.cityState.filter(c => c.owner > 0);
        const miasta = cs.reduce((s, c) => s + c.miasta, 0);
        const por = cs.reduce((s, c) => s + c.porPctSuma, 0);
        const ponizej = cs.reduce((s, c) => s + c.ponizejProgu, 0);
        const bunt = cs.reduce((s, c) => s + c.bunt, 0);
        const reb = cs.reduce((s, c) => s + c.rebelia, 0);
        const jedn = ai.reduce((s, o) => s + o.jednostkiWojskowe, 0);
        const puste = ai.reduce((s, o) => s + o.miastaWojsko.filter(c => c.wojsko === 0).length, 0);
        const skarb = ai.reduce((s, o) => s + (o.skarbiec || 0), 0);
        sum.stan.push(`t${r.turn}: miasta ${miasta}, jednostki ${jedn}, puste ${puste} (${(100 * puste / Math.max(1, miasta)).toFixed(0)}%), Porzadek sr ${(por / Math.max(1, miasta)).toFixed(1)}, ponizej progu ${ponizej}, bunt ${bunt}, rebelia ${reb}, skarbiec AI ${skarb}`);
      }
    }
    out.push(sum);
  }
  return out;
}

for (const spec of process.argv.slice(2)) {
  const [label, dir] = spec.split('=');
  for (const s of analizuj(dir)) {
    console.log(`== ${label} ${s.plik}`);
    for (const l of s.stan) console.log('  ' + l);
    console.log(`  NOWE jednostki AI (t2-koniec, produkcja+zakup razem): ${s.nowe}`);
    console.log('  ZNIKNIĘCIA jednostek AI wg przyczyny: ' + JSON.stringify(s.znikniecia));
    console.log('  UTRACONE miasta AI: ' + JSON.stringify(s.utraconeMiasta));
    console.log('  ZDOBYTE miasta przez AI: ' + JSON.stringify(s.zdobyteMiasta));
    console.log(`  utrzymanie AI (pieniądz, suma po turach): jednostki ${s.utrzymanieJednostek}, budynki ${s.utrzymanieBudynkow}`);
    console.log(`  pierwsza tura z budynkiem Prawa: ${s.pierwszaTuraPrawo}, Szczęścia: ${s.pierwszaTuraSzczescie}`);
  }
}
