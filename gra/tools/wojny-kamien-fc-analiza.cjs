'use strict';
/**
 * wojny-kamien-fc-analiza.cjs — analiza zrzutow harnessu Final Control.
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1
 * Uruchomienie: node tools/wojny-kamien-fc-analiza.cjs <kat-z-json> [...]
 */
const fs = require('fs');
const path = require('path');

const dirs = process.argv.slice(2);
if (dirs.length === 0) { console.error('podaj katalog(i) z fc-*.json'); process.exit(1); }

const files = [];
for (const d of dirs) {
  for (const f of fs.readdirSync(d)) {
    if (f.startsWith('fc-') && f.endsWith('.json') && f !== 'fc-podsumowanie.json') {
      files.push(path.join(d, f));
    }
  }
}
files.sort();

const rows = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const snaps = d.snaps;
  const last = snaps[snaps.length - 1];

  // wypowiedzenia wojny = nowa para w warPairs
  const decl = [];
  for (let i = 1; i < snaps.length; i++) {
    const prev = new Set(snaps[i - 1].warPairs);
    for (const p of snaps[i].warPairs) if (!prev.has(p)) decl.push({ t: snaps[i].t, pair: p });
  }
  // zakonczenia wojen
  const end = [];
  for (let i = 1; i < snaps.length; i++) {
    const cur = new Set(snaps[i].warPairs);
    for (const p of snaps[i - 1].warPairs) if (!cur.has(p)) end.push({ t: snaps[i].t, pair: p });
  }

  // glowne AI = owner > 0, nie simpl, nie typCopy, nie wyeliminowany
  const mainAi = last.owners.filter(o => o.o > 0 && !o.simpl && !o.typCopy).map(o => o.o);

  // tura przeskoku bramki isCityState dla glownych AI
  const flip = {};
  const flipCities = {};
  for (const s of snaps) {
    for (const o of s.owners) {
      if (o.o <= 0 || o.simpl || o.typCopy) continue;
      if (o.isCS && flip[o.o] == null) { flip[o.o] = s.t; flipCities[o.o] = o.cities; }
    }
  }

  // warstwy: liczba rekordow owner x tura
  const layers = { full: 0, simplified: 0, pre_contact: 0 };
  const fullOwners = new Set();
  for (const s of snaps) {
    for (const o of s.owners) {
      if (!o.layer) continue;
      layers[o.layer] = (layers[o.layer] || 0) + 1;
      if (o.layer === 'full') fullOwners.add(o.o);
    }
  }

  // brama AI -> gracz ze stanu: score vs prog 30 (tylko AI odkryte przez gracza)
  let gateObs = 0, scoreUnder30 = 0, minScore = Infinity, minZ = Infinity;
  for (const s of snaps) {
    const disc = new Set(s.contacts);
    for (const p of s.plr) {
      if (!disc.has(p.o)) continue;
      gateObs++;
      if (p.score < 30) scoreUnder30++;
      if (p.score < minScore) minScore = p.score;
      if (p.z < minZ) minZ = p.z;
    }
  }

  // kontakty z glownymi AI
  const mainAiSet = new Set(mainAi);
  const contactedMainAi = new Set();
  for (const s of snaps) for (const oid of s.contacts) if (mainAiSet.has(oid)) contactedMainAi.add(oid);

  // konsolidacja: liczba miast z flaga startCityState nalezacych do glownych AI
  const konsol = snaps.map(s => ({
    t: s.t,
    csCitiesMainAi: s.owners.filter(o => mainAiSet.has(o.o)).reduce((a, o) => a + o.csCities, 0),
    csOwners: s.owners.filter(o => o.simpl || o.typCopy).length,
  }));
  let stabOd = null;
  for (let i = konsol.length - 1; i > 0; i--) {
    if (konsol[i].csCitiesMainAi !== konsol[i - 1].csCitiesMainAi) { stabOd = konsol[i].t; break; }
  }

  rows.push({
    plik: path.basename(f),
    ziarno: d.seed, tryb: d.mode, trudnosc: d.difficulty,
    turaKoncowa: last.t, tur: snaps.length,
    zwiadRozkazy: d.exploreEnabled, jednostkiGraczaKoniec: last.plrUnits,
    zwiadowcyKoniec: last.scouts.length,
    prodLog: d.prodLog,
    wypowiedzenia: decl, wypowiedzenN: decl.length,
    zGraczem: decl.filter(x => x.pair.startsWith('0x') || x.pair.endsWith('x0')).length,
    zakonczenia: end,
    glowneAI: mainAi,
    bramkaCsPrzeskok: flip, miastaPrzyPrzeskoku: flipCities,
    warstwy: layers, ownerzyFull: Array.from(fullOwners).sort((a, b) => a - b),
    kontaktyKoniec: last.contacts,
    kontaktyGlowneAI: Array.from(contactedMainAi).sort((a, b) => a - b),
    bramaGracz: { obserwacje: gateObs, scorePonizej30: scoreUnder30,
      minScore: minScore === Infinity ? null : minScore,
      minZaufanie: minZ === Infinity ? null : minZ, prog: 30 },
    stonePendingMax: Math.max(...snaps.map(s => s.stonePending.length)),
    stoneActiveMax: Math.max(...snaps.map(s => s.stoneActive.length)),
    kartyWydarzenWojna: last.warEvents.filter(e => /wojn/i.test(e.title || '')).length,
    kartyWydarzenRazem: last.warEvents.length,
    panelWojnyZGraczem: last.panelPlayer.length,
    panelWojnyMiedzyAI: last.panelOthers.length,
    konsolidacjaStabilnaOdTury: stabOd,
    csMiastaUGlownychAIKoniec: konsol[konsol.length - 1].csCitiesMainAi,
    unblock: d.unblockCount, bledy: d.errors, sekundy: Math.round(d.ms / 1000),
  });
}

console.log(JSON.stringify(rows, null, 2));
