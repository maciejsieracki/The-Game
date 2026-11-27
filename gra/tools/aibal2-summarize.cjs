'use strict';
/**
 * aibal2-summarize.cjs -- R-WEB-AI-CULT-BALANCE-MEASURE-Q2 (AIBAL2): zestawienie JSONL z aibal2-measure-run.cjs.
 * POMIAR, tylko odczyt plikow runu (zero zmian gry).
 * Uzycie: node tools/aibal2-summarize.cjs <etykieta=katalog> ...
 * Czyta seed*.jsonl oraz seed*.jsonl.gz (gzip rozpakowywany w pamieci; nie trzeba rozpakowywac recznie).
 * Per etykieta, ziarno i tura (tury 20/40/60/90; ostatni rekord z dana tura wygrywa, bo wznowienia moga ja powtorzyc):
 *   AI (owner != 0, != -1): zywe cywilizacje AI (aiCivsAlive), miasta, jednostki wojskowe, puste miasta,
 *   zywe cywilizacje AI bez miast (aiCivsNoCityAlive), miasta AI ponizej progu porzadku (ponizejProgu z cityState),
 *   sredni Porzadek AI (porPctSuma/miasta), miasta AI w buncie (bunt+rebelia), wojny aktywne (wars.active),
 *   wojny z graczem (wars.withPlayer), wojny AI-AI (wars.aiAi).
 *   Gracz (owner 0): miasta, sredni Porzadek. Owner -1 (niezalezne): miasta (ownerMinus1Cities).
 * Sumy OD STARTU do danej tury (z rekordow turn <= t):
 *   cumLossesAiByCause: straty jednostek AI wg przyczyn (unitFlow.owners[].zniknietePrzyczyny),
 *   cumCityOwnerChanges: suma cityTransfers[].liczba, wszystkie przyczyny NIE rozbite (bunt vs podboj NIE ZMIERZONO).
 * Brak pola w rekordzie -> wartosc null (nie zero).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TURNS = [20, 40, 60, 90];

function readText(file) {
  const buf = fs.readFileSync(file);
  return (file.endsWith('.gz') ? zlib.gunzipSync(buf) : buf).toString('utf8');
}

function loadRecs(file) {
  const byTurn = new Map();
  for (const line of readText(file).trim().split('\n')) {
    if (!line) continue;
    const r = JSON.parse(line);
    byTurn.set(r.turn, r); // ostatni rekord tury wygrywa (wznowienie)
  }
  return byTurn;
}

function aiOwners(r) {
  return (r.owners || []).filter(o => o.owner !== 0 && o.owner !== -1);
}

function cumulative(byTurn, t) {
  const losses = {};
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
  const belowThr = cs.reduce((s, c) => s + (c.ponizejProgu || 0), 0);
  const porSum = cs.reduce((s, c) => s + (c.porPctSuma || 0), 0);
  const bunt = cs.reduce((s, c) => s + (c.bunt || 0) + (c.rebelia || 0), 0);
  const ownerMinus1 = (r.cityState || []).filter(c => c.owner === -1).reduce((s, c) => s + (c.miasta || 0), 0);
  const c = cumulative(byTurn, t);
  return {
    turn: t,
    aiCivsAlive: ai.length,
    aiCities,
    aiUnits,
    emptyAiCities: empty,
    aiCivsNoCityAlive: ai.filter(o => o.miasta === 0).length,
    aiBelowPorThr: belowThr,
    aiPorAvgPct: aiCities ? +(porSum / aiCities).toFixed(1) : null,
    aiCitiesInBunt: bunt,
    wars: r.wars ? r.wars.active : null,
    warsWithPlayer: r.wars ? r.wars.withPlayer : null,
    warsAiAi: r.wars ? r.wars.aiAi : null,
    playerCities: plOwner ? plOwner.miasta : 0,
    playerPorAvgPct: pl && pl.miasta ? +(pl.porPctSuma / pl.miasta).toFixed(1) : null,
    ownerMinus1Cities: ownerMinus1,
    cumLossesAiByCause: c.losses,
    cumCityOwnerChanges: c.transfers,
  };
}

for (const spec of process.argv.slice(2)) {
  const [label, dir] = spec.split('=');
  const files = fs.readdirSync(dir).filter(n => /^seed\d+\.jsonl(\.gz)?$/.test(n)).sort();
  for (const f of files) {
    const seed = f.match(/\d+/)[0];
    const byTurn = loadRecs(path.join(dir, f));
    const maxT = Math.max(...byTurn.keys());
    console.log(`== ${label} seed${seed} ostatnia tura ${maxT} (plik ${f})`);
    for (const t of TURNS) {
      const s = snap(byTurn, t);
      if (!s) { console.log(`  t${t}: brak`); continue; }
      console.log(`  t${t}: ${JSON.stringify(s)}`);
    }
  }
}
