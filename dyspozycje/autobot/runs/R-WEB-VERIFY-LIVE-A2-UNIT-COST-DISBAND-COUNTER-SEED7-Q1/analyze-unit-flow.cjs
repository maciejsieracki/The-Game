'use strict';
// Analiza R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1 (tylko odczyt).
// Uzycie: node analyze-unit-flow.cjs  (czyta *-seed*.jsonl.gz z katalogu skryptu; wynik JSON na stdout).
// Kolumny: unitFlow (hak __aiEconomyMeasure.unitFlowTurn, runner --unit-flow 1); wlasciciele AI = owner != 0,
// "wspolni" = zywi (miasta>0 lub jednostki>0) w OBU biegach danego ziarna w danej turze.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const DIR = __dirname;
const runs = {
  '4242': { niski: 'niski-seed4242.jsonl.gz', normalny: 'normalny-seed4242.jsonl.gz' },
  '7': { niski: 'niski-seed7.jsonl.gz', normalny: 'normalny-seed7.jsonl.gz' },
};
const load = f => {
  const m = new Map();
  for (const l of zlib.gunzipSync(fs.readFileSync(path.join(DIR, f))).toString('utf8').trim().split('\n')) {
    const r = JSON.parse(l);
    if (m.has(r.turn)) throw new Error('duplikat tury ' + r.turn + ' w ' + f);
    m.set(r.turn, r);
  }
  return m;
};
const fmt = x => (Math.round(x * 100) / 100).toString();
const out = {};
for (const seed of Object.keys(runs)) {
  const R = { niski: load(runs[seed].niski), normalny: load(runs[seed].normalny) };
  out[seed] = {};
  const turnsAll = [...R.niski.keys()].filter(t => R.normalny.has(t)).sort((a, b) => a - b);
  for (const T of [30, 60, 90]) {
    if (!R.niski.has(T) || !R.normalny.has(T)) { out[seed]['t' + T] = 'brak wiersza'; continue; }
    const alive = rr => { const s = new Set(); for (const o of rr.get(T).owners) if (o.owner !== 0 && (o.miasta > 0 || o.jednostkiWojskowe > 0)) s.add(o.owner); return s; };
    const aN = alive(R.niski), aM = alive(R.normalny);
    const common = new Set([...aN].filter(x => aM.has(x)));
    const sumUnits = (rr, set) => rr.get(T).owners.filter(o => set.has(o.owner)).reduce((s, o) => s + o.jednostkiWojskowe, 0);
    const res = {
      wspolnychWlascicieli: common.size, aiZywyNiski: aN.size, aiZywyNormalny: aM.size,
      jednostkiWspolni_niski: sumUnits(R.niski, common), jednostkiWspolni_normalny: sumUnits(R.normalny, common),
      jednostkiWszyscy_niski: sumUnits(R.niski, aN), jednostkiWszyscy_normalny: sumUnits(R.normalny, aM),
    };
    res.roznicaProc_wspolni = fmt((res.jednostkiWspolni_normalny / res.jednostkiWspolni_niski - 1) * 100);
    for (const [name, rr] of [['niski', R.niski], ['normalny', R.normalny]]) {
      let nowe = 0, bez = 0; const przy = {};
      for (const t of turnsAll) {
        if (t > T) break;
        const fl = rr.get(t).unitFlow;
        if (!fl || fl.baseline) continue;
        for (const o of fl.owners) {
          if (!common.has(o.owner)) continue;
          nowe += o.noweId; bez += o.zniknieteBezPrzyczyny;
          for (const [c, n] of Object.entries(o.zniknietePrzyczyny)) przy[c] = (przy[c] || 0) + n;
        }
      }
      res['przeplyw_' + name] = { noweId: nowe, zniknieteBezPrzyczyny: bez, przyczyny: przy };
    }
    out[seed]['t' + T] = res;
  }
  const epo = {};
  for (const [name, rr] of [['niski', R.niski], ['normalny', R.normalny]]) {
    const acc = {};
    for (const t of turnsAll) {
      const epokaBy = new Map((rr.get(t).unitFlow?.owners || []).map(x => [x.owner, x.epoka]));
      for (const o of rr.get(t).owners) {
        if (o.owner === 0 || o.jednostkiWojskowe <= 0) continue;
        const k = epokaBy.get(o.owner);
        const a = acc[k] || (acc[k] = { n: 0, pieniadz: 0, zywnosc: 0, surowce: 0, glod: 0 });
        a.n++; a.pieniadz += o.utrzymanieJednostekPieniadz; a.zywnosc += o.zywnoscArmiiTura;
        a.surowce += Object.values(o.utrzymanieJednostekSurowce || {}).reduce((s, v) => s + v, 0);
        if (o.glodWojska) a.glod++;
      }
    }
    epo[name] = Object.fromEntries(Object.entries(acc).map(([k, a]) => [k, {
      ownerTury: a.n, srPieniadz: fmt(a.pieniadz / a.n), srZywnosc: fmt(a.zywnosc / a.n),
      srSurowceSuma: fmt(a.surowce / a.n), glodTur: a.glod }]));
  }
  out[seed].utrzymaniePerEpoka = epo;
}
console.log(JSON.stringify(out, null, 1));
