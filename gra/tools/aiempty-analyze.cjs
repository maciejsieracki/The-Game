'use strict';
/**
 * aiempty-analyze.cjs -- R-WEB-AI-EMPTY-CITIES-Q1 (AIEMPTY): zestawienie pustych miast AI z JSONL aibal2-measure-run.cjs.
 * POMIAR, tylko odczyt plikow runu (zero zmian gry).
 *
 * Definicja „puste miasto” (ta sama w obu pomiarach): miasto wlasciciela AI, na ktorego heksie nie stoi
 * zadna jednostka bojowa (owners[].miastaWojsko[].wojsko === 0; predykat z src/main.ts: nie cywil, nie zwiadowca,
 * nie general, nie zaokretowany).
 *   defFALA857 = ai-city-garrison-measure-analyze.cjs: wszyscy wlasciciele rekordu oprocz gracza (owner 0),
 *                liczone osobno pokoj/wojna, suma = pokoj+wojna.
 *   defAIBAL2  = aibal2-summarize.cjs: wlasciciele AI (owner != 0 i != -1).
 * Obie liczone tu jawnie; roznica (jesli jest) = wlasciciel -1 (niezalezne) i podzial pokoj/wojna.
 *
 * Powody dla pustych miast AI w turze T (tylko z danych rekordu; NIE ZMIERZONO = pole nieobecne):
 *   - wlasciciel bez srodkow na najtansza jednostke Brazu (skarbiec < 4 Pn, koszt bazowy Procarza z data/units.json);
 *   - wlasciciel ze srodkami (skarbiec >= 4 Pn) -- przyczyna nieznana z rekordu (zasoby Drewno/Braz NIE ZMIERZONO w JSONL).
 *   - puli rekrutow (owners[].rekruci) brak = 0 -> osobny licznik.
 *
 * Uzycie: node tools/aiempty-analyze.cjs <etykieta=katalog> ...   (czyta seed*.jsonl oraz seed*.jsonl.gz)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const TURNS = [30, 60];
const CHEAP_BRAZ_PN = 4; // Procarz (Brąz), koszt bazowy „Pieniądz (koszt)” z data/units.json -- najtańsza jednostka Brązu

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
function warsOf(r, owner) {
  return (r.wars && r.wars.pairs || []).some(p => p[0] === owner || p[1] === owner);
}
function countDefs(r) {
  const fala = { cities: 0, empty: 0, peaceEmpty: 0, warEmpty: 0 };
  const aibal = { cities: 0, empty: 0 };
  const reasons = { owners: [] };
  for (const o of r.owners || []) {
    if (o.owner === 0) continue;
    const mw = o.miastaWojsko || [];
    const emp = mw.filter(c => c.wojsko === 0).length;
    fala.cities += mw.length;
    fala.empty += emp;
    if (warsOf(r, o.owner)) fala.warEmpty += emp; else fala.peaceEmpty += emp;
    if (o.owner !== -1) { aibal.cities += mw.length; aibal.empty += emp; }
    if (o.owner !== -1 && emp > 0) {
      reasons.owners.push({
        owner: o.owner, miasta: mw.length, empty: emp,
        skarbiec: o.skarbiec, rekruci: o.rekruci, jednostkiWojskowe: o.jednostkiWojskowe,
        glodWojska: o.glodWojska, jednostkiCywilne: o.jednostkiCywilne,
        niezdolnoscSkarbu: (typeof o.skarbiec === 'number') && o.skarbiec < CHEAP_BRAZ_PN,
      });
    }
  }
  return { fala, aibal, reasons };
}

const out = {};
for (const spec of process.argv.slice(2)) {
  const [label, dir] = spec.split('=');
  const files = fs.readdirSync(dir).filter(n => /^seed\d+\.jsonl(\.gz)?$/.test(n)).sort();
  out[label] = out[label] || {};
  for (const f of files) {
    const seed = f.match(/\d+/)[0];
    const byTurn = loadRecs(path.join(dir, f));
    out[label][seed] = {};
    for (const t of TURNS) {
      const r = byTurn.get(t);
      if (!r) { out[label][seed][t] = null; continue; }
      const d = countDefs(r);
      out[label][seed][t] = {
        defFALA857: { ...d.fala, pct: d.fala.cities ? +(100 * d.fala.empty / d.fala.cities).toFixed(1) : null },
        defAIBAL2: { ...d.aibal, pct: d.aibal.cities ? +(100 * d.aibal.empty / d.aibal.cities).toFixed(1) : null },
        owners: d.reasons.owners,
      };
    }
  }
}
// Podsumowanie wiersz po wierszu
for (const [label, seeds] of Object.entries(out)) {
  for (const [seed, byT] of Object.entries(seeds)) {
    for (const t of TURNS) {
      const x = byT[t];
      if (!x) { console.log(`${label} seed${seed} t${t}: brak`); continue; }
      const a = x.defFALA857, b = x.defAIBAL2;
      console.log(`${label} seed${seed} t${t}: FALA857 ${a.empty}/${a.cities} (${a.pct}%; pokoj ${a.peaceEmpty}, wojna ${a.warEmpty}) | AIBAL2 ${b.empty}/${b.cities} (${b.pct}%)`);
    }
  }
}
// Powody (t60) dla kazdego biegu: suma pustych miast u wlascicieli z zerowym skarbcem vs ze srodkami
for (const [label, seeds] of Object.entries(out)) {
  for (const [seed, byT] of Object.entries(seeds)) {
    const x = byT[60];
    if (!x) continue;
    const ow = x.owners;
    const tot = ow.reduce((s, o) => s + o.empty, 0);
    const noGold = ow.filter(o => o.niezdolnoscSkarbu).reduce((s, o) => s + o.empty, 0);
    const withGoldNoRecruit = ow.filter(o => !o.niezdolnoscSkarbu).reduce((s, o) => s + o.empty, 0);
    const noPool = ow.filter(o => !o.rekruci).reduce((s, o) => s + o.empty, 0);
    console.log(`REASONS ${label} seed${seed} t60: puste=${tot}; u wlascicieli skarbiec<${CHEAP_BRAZ_PN} Pn: ${noGold}; skarbiec>=${CHEAP_BRAZ_PN} Pn: ${withGoldNoRecruit}; pula rekrutow=0: ${noPool}`);
  }
}
if (process.env.AIEMPTY_JSON) fs.writeFileSync(process.env.AIEMPTY_JSON, JSON.stringify(out, null, 1));
