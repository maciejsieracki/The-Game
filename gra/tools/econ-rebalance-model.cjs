#!/usr/bin/env node
'use strict';
/*
 * econ-rebalance-model.cjs — R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1
 * MODEL STATYCZNY (bez sprzezenia zwrotnego, bez zmian w grze). Czyta pomiar gracza
 * (owner 0) z seed{4242,7}.jsonl i przelicza per tura PRZED / PO dla wariantow.
 * Uzycie: node gra/tools/econ-rebalance-model.cjs [katalog_pomiaru] [--csv]
 * Domyslny katalog: /tmp/econ-final (pliki seed*.jsonl z runu pomiarowego).
 *
 * ZALOZENIA (NIE_ZMIERZONO tam, gdzie pomiar ich nie podaje):
 *  - epoka wlasciciela w pomiarze = 2 (Braz) przez caly bieg; epoka 3 to PROJEKCJA statyczna.
 *  - brutto surowcowe (Drewno/Kamien/Glina/Ceramika) pochodzi z ulepszen (gorna granica);
 *    bazowy wydajnosc ulepszenia epoki 2 = 75 (tartak 50 x1,5) -> N_imp = brutto / 75
 *    (dolna granica liczby ulepszen; farmy/tarasy nie sa liczone).
 *  - delta bonusu zywnosc/praca = (bm(e) - bm_pomiar) * N_imp * UDZIAL_ZYWN (0,5 zalozenie).
 *  - racje obywateli: poziom 1 = 2 zywnosci/os./ture; m(e) = 1 + step*(e-1); step PRZED = 0,5.
 *  - zywnosc wojska na jednostke = baza typu (sredni Braz = 2, units.json x skala epoki)
 *    x4 (R_STAWKI_FALA1_FALA2_MULT) x uF(e) x CAMP_SHARE (1 = marsz = gorna granica).
 *  - zywnosc netto pomiaru = spichlerzRate (pomiar); produkcja = netto + zuzycie PRZED.
 *  - Praca: pracaRate z pomiaru = netto po utrzymaniu (zgodnie z ujemnymi wartosciami seed 7).
 *  - Drewno zuzycie wojska = utrzymanieJednostekSurowce.drewno(t) * kU(e).
 *  - NIE uwzglednia: spadku populacji, zmiany liczby miast/jednostek, capu spichlerza
 *    (seed 4242: 1000 przy t90 -> spichRate ~ 0), sprzezenia zwrotnego.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--')) || '/tmp/econ-final';
const CSV = args.includes('--csv');

const TURNS = [30, 60, 90, 120, 150];
const SEEDS = [4242, 7];
const RM_BASE = 1.5;         // rmPRZED(2): mnoznik surowcowy epoki pomiaru
const BM_MEAS = 1;           // bmPRZED(2): dodatek zywnosc/praca w epoce pomiaru
const M_MEAS = 1.5;          // mPRZED(2): mnoznik racji obywateli w epoce pomiaru
const UDZIAL_ZYWN = 0.5;     // NIE_ZMIERZONO: udzial ulepszen zywnosc/praca wzgledem N_imp
const UNIT_BASE_AVG = 2;     // NIE_ZMIERZONO: sredni typ jednostki = Braz (units.json 1 x2)
const R_STAWKI_X4 = 4;       // R_STAWKI_KOSZT_MULT(2) x R_STAWKI_FALA2_MULT(2)
const RATION_PER_POP = 2;    // racje poziom 1 (econ-params racje_zywnosc_1 = 2)
const CAMP_SHARE = 1;        // 1 = marsz (gorna granica); oboz = 0,5
const BAZA_IMP_EPOKA2 = 75;  // tartak 50 x1,5 (epoka 2)

// rm(e): mnoznik surowcowy; bm(e): dodatek zywnosc/praca/handel; m(e): racje obywateli;
// uF(e): dodatkowy mnoznik zywnosci wojska; kU(e): mnoznik utrzymania jednostek surowcem.
const VARIANTS = {
  PRZED: {
    rm: e => Math.pow(1.5, e - 1), bm: e => e - 1, m: e => 1 + 0.5 * (e - 1),
    uF: () => 1, kU: () => 1,
  },
  OSTROZNY: { // rm x1,25/epoke, bm +0,5/epoke; racje step 0,6; wojsko +25%/epoke
    rm: e => Math.pow(1.25, e - 1), bm: e => 0.5 * (e - 1), m: e => 1 + 0.6 * (e - 1),
    uF: e => 1 + 0.25 * (e - 1), kU: () => 1,
  },
  SREDNI: { // Braz (e2): rm x1,25, bm +0,5 (wchodzi w Brazu); Zelazo (e3): ZAMROZONE na poziomie Brazu;
            // racje step 0,75; wojsko +50%/epoke; Drewno jednostek x1,25
    rm: e => Math.pow(1.25, Math.min(e - 1, 1)), bm: e => 0.5 * Math.min(e - 1, 1),
    m: e => 1 + 0.75 * (e - 1), uF: e => 1 + 0.5 * (e - 1), kU: () => 1.25,
  },
  REKOMENDOWANY: { // Braz (e2): rm x1,25, bm +0,5, racje step 0,6, wojsko x1,25; Zelazo (e3): ZAMROZONE na poziomie Brazu
    // (wszystkie zmiany wchodza w Brazu, Zelazo nie dodaje wzrostu); Drewno jednostek bez zmian
    rm: e => Math.pow(1.25, Math.min(e - 1, 1)), bm: e => 0.5 * Math.min(e - 1, 1),
    m: e => 1 + 0.6 * (e - 1), uF: e => 1 + 0.25 * Math.min(e - 1, 1), kU: () => 1,
  },
  MOCNY: { // rm 1,0 i bm 0 we wszystkich epokach (stale od Brazu); racje step 1,0; wojsko +100%/epoke; Drewno x1,5
    rm: () => 1, bm: () => 0, m: e => 1 + 1.0 * (e - 1), uF: e => 1 + 1.0 * (e - 1), kU: () => 1.5,
  },
};

function loadSeed(seed) {
  const rows = new Map();
  const file = path.join(dir, `seed${seed}.jsonl`);
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const x = JSON.parse(line);
    rows.set(x.turn, x);
  }
  return rows;
}

function snapshot(rows, t) {
  const x = rows.get(t);
  if (!x) throw new Error(`brak tury ${t} w pomiarze`);
  const o = x.owners.find(w => w.owner === 0);
  if (!o) throw new Error(`brak owner 0 w turze ${t}`);
  const h = o.hud;
  const byTyp = {};
  for (const s of h.surowceTyp) byTyp[s.typ] = s;
  const sur = ['Drewno', 'Kamień', 'Glina', 'Ceramika'];
  const bruttoSur = sur.reduce((a, k) => a + ((byTyp[k] && byTyp[k].brutto) || 0), 0);
  const drewno = byTyp['Drewno'] || {};
  return {
    t,
    pop: o.obywatele,
    units: o.jednostkiWojskowe,
    pracaNet: h.pracaRate,
    spichNet: h.spichlerzRate,
    drewnoBrutto: drewno.brutto || 0,
    drewnoZuz: drewno.zuzycie || 0,
    drewnoUnitUpkeep: (o.utrzymanieJednostekSurowce || {}).drewno || 0,
    bruttoSur,
  };
}

// Wynik dla wariantu v w epoce e (e = 2 pomiar; e = 3 projekcja statyczna).
function evalVariant(v, s, e) {
  const nImp = s.bruttoSur / BAZA_IMP_EPOKA2;               // NIE_ZMIERZONO, dolna granica
  const bmDelta = (v.bm(e) - BM_MEAS) * nImp * UDZIAL_ZYWN;  // delta bonusu wzgledem pomiaru

  // Drewno: brutto przeskalowane rm(e)/RM_BASE; zuzycie cywilne bez zmian; wojsko * kU
  const drewnoBrutto = s.drewnoBrutto * (v.rm(e) / RM_BASE);
  const drewnoZuzCywilne = s.drewnoZuz - s.drewnoUnitUpkeep;
  const drewnoNet = drewnoBrutto - drewnoZuzCywilne - s.drewnoUnitUpkeep * v.kU(e);

  // Praca: netto pomiaru + delta bonusu pracy od ulepszen
  const praca = s.pracaNet + bmDelta;

  // Zywnosc: produkcja z pomiaru (netto + zuzycie PRZED w epoce 2) + delta bonusu - racje - wojsko
  const racjeMeas = s.pop * RATION_PER_POP * M_MEAS; // m_PRZED(2) = 1,5
  const wojskoMeas = s.units * UNIT_BASE_AVG * R_STAWKI_X4 * CAMP_SHARE;
  const prodFood = s.spichNet + racjeMeas + wojskoMeas;
  const racjePO = s.pop * RATION_PER_POP * v.m(e);
  const wojskoPO = s.units * UNIT_BASE_AVG * R_STAWKI_X4 * v.uF(e) * CAMP_SHARE;
  const food = prodFood + bmDelta - racjePO - wojskoPO;

  return { drewnoNet: drewnoNet, praca: praca, food: food, racje: racjePO, wojsko: wojskoPO, nImp: nImp };
}

function fmt(x) {
  if (!Number.isFinite(x)) throw new Error('NaN w wyniku');
  return (Math.round(x * 10) / 10).toString().replace('.', ',');
}

const out = [];
const sep = CSV ? ';' : ' | ';
for (const seed of SEEDS) {
  const rows = loadSeed(seed);
  out.push(`## seed ${seed}`);
  out.push(['tura', 'epoka', 'wariant', 'Drewno netto/t', 'Praca netto/t', 'Zywnosc netto/t', 'racje obyw.', 'zywnosc wojska', 'N_imp (dolna gr.)'].join(sep));
  for (const t of TURNS) {
    const s = snapshot(rows, t);
    for (const e of [2, 3]) {
      for (const name of Object.keys(VARIANTS)) {
        const r = evalVariant(VARIANTS[name], s, e);
        out.push([t, e === 2 ? 'Braz(2)' : 'Zelazo(3, proj)', name,
          fmt(r.drewnoNet), fmt(r.praca), fmt(r.food), fmt(r.racje), fmt(r.wojsko), fmt(r.nImp)].join(sep));
      }
    }
  }
}
console.log(out.join('\n'));
