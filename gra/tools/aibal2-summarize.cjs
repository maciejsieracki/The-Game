'use strict';
/**
 * aibal2-summarize.cjs -- R-WEB-AI-CULT-BALANCE-MEASURE-Q2 (AIBAL2): zestawienie JSONL z aibal2-measure-run.cjs.
 * POMIAR, tylko odczyt plikow runu (zero zmian gry).
 * Uzycie: node tools/aibal2-summarize.cjs <etykieta=katalog> ...   (tury 20/40/60/90, ziarna z nazw plikow seed*.jsonl)
 * Per etykieta, ziarno i tura (ostatni rekord z dana tura; wznowienia moga powtorzyc tury):
 *   AI (owner != 0, != -1): miasta, jednostki wojskowe, puste miasta, cywilizacje bez miast,
 *   miasta AI ponizej progu porzadku (pole ponizejProgu z cityState), sredni Porzadek AI (porPctSuma/miasta),
 *   miasta AI w buncie (bunt+rebelia), wojny (wars.active), gracz (owner 0): miasta, sredni Porzadek.
 * Sumy od startu do tury (z jednostek/zdarzen, tylko gdy dane sa w rekordach):
 *   straty jednostek AI (unitFlow.zniknietePrzyczyny), zmiany wlasciciela miast (cityTransfers.liczba).
 * Gdy brak danych pola -> wpis NIE ZMIERZONO.
 */
const fs = require('fs');
const path = require('path');

const TURNS = [20, 40, 60, 90];

function loadRecs(file) {
  const byTurn = new Map();
  for (const line of fs.readFileSync(file, 'utf8').trim().split('\n')) {
    if (!line) continue;
    const r = JSON.parse(line);
    byTurn.set(r.turn, r); // ostatni rekord tury wygrywa (wznowienie)
  }
  return byTurn;
}

function aiOwners(r) {
  return (r.owners || []).filter(o => o.owner !== 0 && o.owner !== -1);
}

function snap(byTurn, t) {
  const r = byTurn.get(t);
  if (!r) return null;
  const ai = aiOwners(r);
  const cs = (r.cityState || []).filter(c => c.owner !== 0 && c.owner !== -1);
  const pl = (r.cityState || []).find(c => c.owner === 0) || null;
  const plOwner = (r.owners || []).find(o => o.owner === 0) || null;
  const aiCities = ai.reduce((s, o) => s + o.miasta, 0);
  const aiUnits = ai.reduce((s, o) => s + o.jednostkiWojskowe, 0);
  let empty = 0;
  for (const o of ai) for (const c of (o.miastaWojsko || [])) if (c.wojsko === 0) empty++;
  const noCity = ai.filter(o => o.miasta === 0).length;
  const belowThr = cs.reduce((s, c) => s + (c.ponizejProgu || 0), 0);
  const porSum = cs.reduce((s, c) => s + (c.porPctSuma || 0), 0);
  const bunt = cs.reduce((s, c) => s + (c.bunt || 0) + (c.rebelia || 0), 0);
  const wars = r.wars ? r.wars.active : null;
  return {
    turn: t,
    aiCities,
    aiUnits,
    emptyAiCities: empty,
    aiCivsNoCity: noCity,
    aiBelowPorThr: belowThr,
    aiPorAvgPct: aiCities ? +(porSum / aiCities).toFixed(1) : null,
    aiCitiesInBunt: bunt,
    wars,
    playerCities: plOwner ? plOwner.miasta : null,
    playerPorAvgPct: pl && pl.miasta ? +(pl.porPctSuma / pl.miasta).toFixed(1) : null,
  };
}

function cumulative(byTurn, t) {
  let losses = {};
  let transfers = 0;
  for (const [turn, r] of byTurn) {
    if (turn > t) continue;
    const uf = r.unitFlow && r.unitFlow.owners;
    if (uf) {
      for (const o of uf) {
        if (o.owner === 0 || o.owner === -1) continue;
        for (const [k, v] of Object.entries(o.zniknietePrzyczyny || {})) losses[k] = (losses[k] || 0) + v;
      }
    }
    for (const tr of (r.cityTransfers || [])) transfers += tr.liczba || 0;
  }
  return { losses, transfers };
}

for (const spec of process.argv.slice(2)) {
  const [label, dir] = spec.split('=');
  for (const f of fs.readdirSync(dir).filter(n => /^seed\d+\.jsonl$/.test(n)).sort()) {
    const seed = f.match(/\d+/)[0];
    const byTurn = loadRecs(path.join(dir, f));
    const maxT = Math.max(...byTurn.keys());
    console.log(`== ${label} seed${seed} ostatnia tura ${maxT}`);
    for (const t of TURNS) {
      const s = snap(byTurn, t);
      if (!s) { console.log(`  t${t}: brak`); continue; }
      console.log(`  t${t}: ${JSON.stringify(s)}`);
    }
    const c = cumulative(byTurn, maxT);
    console.log(`  skumulowane do t${maxT}: straty jednostek AI wg przyczyn ${JSON.stringify(c.losses)}; zmiany wlasciciela miast (wszystkie przyczyny) ${c.transfers}`);
  }
}
