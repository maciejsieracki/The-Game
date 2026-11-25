#!/usr/bin/env node
'use strict';
/*
 * econ-rebalance-model.cjs — R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1 (runda 2, obrona)
 * MODEL STATYCZNY (bez sprzezenia zwrotnego, bez zmian w grze). Czyta pomiar gracza
 * (owner 0) z seed{4242,7}.jsonl i przelicza per ture PRZED / PO dla wariantow.
 * Uzycie: node gra/tools/econ-rebalance-model.cjs [katalog_pomiaru] [--csv]
 * Domyslny katalog: /tmp/econ-final.
 *
 * ZALOZENIA (NIE_ZMIERZONO tam, gdzie pomiar ich nie podaje):
 *  - epoka wlasciciela w pomiarze = 2 (Braz) przez caly bieg; epoka 3 to PROJEKCJA statyczna.
 *  - liczba ulepszen NIE jest zmierzona. Dwa estymatory (zakres, nie granica):
 *      UPK = hud.pracaUpkeep / 2  (utrzymanie Pracy = 2 na ulepszenie w Brazie; liczy wszystkie
 *            platne ulepszenia wg computePracaUpkeepByOwner)
 *      BRU = surowceBrutto / 75   (gora: brutto zawiera lasy i Ceramike, nie tylko ulepszenia)
 *  - delta bonusu zywnosc/praca = (bm(e) - 1) * N_imp * UDZIAL_ZYWN (UDZIAL 0,5 = NIE_ZMIERZONO).
 *    Ta sama delta trafia tez do Pracy (uproszczenie: mozliwe podwojne liczenie).
 *  - racje obywateli: poziom 1 = 2 zywnosci/os./ture; m(e) = 1 + step*(e-1); PRZED(2) = 1,5.
 *  - zywnosc wojska na jednostke = units.json zywnosc/ture (=1 dla wszystkich) x skala epoki JEDNOSTKI
 *    (Kamien x1, Braz x2, Zelazo x4) x R_STAWKI x4 x 1 (marsz, wlasne terytorium).
 *    Skad: 4 (jednostki Kamienia) lub 8 (jednostki Brazu). Miks jednostek w pomiarze NIE_ZMIERZONO
 *    -> oba warianty. uF(e) to mnoznik wlasciciela (nowy, propozycja).
 *  - Drewno utrzymania jednostek = utrzymanieJednostekSurowce.drewno(t) * kU(e).
 *  - Praca: pracaRate z pomiaru (netto po utrzymaniu); zmiana mnoznika utrzymania ulepszen
 *    (pU(e), baza 2 w Brazie) odejmuje (pU(e) - 2) * N_imp.
 *  - NIE uwzglednia: spadku populacji, capu spichlerza (cap 1000 w t30-t90, 3000 t120, 5000 t150
 *    w seed 4242), zmiany liczby miast/jednostek, sprzezenia zwrotnego.
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--')) || `${require('os').tmpdir()}/econ-final-${TMPDIR_RUN_ID}`;
const CSV = args.includes('--csv');

const TURNS = [30, 60, 90, 120, 150];
const SEEDS = [4242, 7];
const RM_MEAS = 1.5;          // rm(2) w pomiarze
const M_MEAS = 1.5;           // m(2) w pomiarze
const RATION_PER_POP = 2;     // racje poziom 1
const UDZIAL_ZYWN = 0.5;      // NIE_ZMIERZONO
const CAMP_SHARE = 1;         // marsz (gorna granica zuzycia)
const UNIT_FOOD = { KAM: 4, BRAZ: 8 }; // zywnosc/ture jednostki po skali epoki jednostki x R_STAWKI x4
const PRACA_UPK_MEAS = 2;     // mnoznik utrzymania ulepszenia w Brazie (1/2/4)

// bm(e) jest CALKOWITE na ulepszenie (base + bm), bez zaokraglen. bm(e) = e-1 = dzisiejsza regula (+1/epoke).
// Wariant ograniczony do Brazu: min(e-1, 1) => w Zelazie zamrozony na poziomie Brazu.
const VARIANTS = {
  PRZED: {
    rm: e => Math.pow(1.5, e - 1), bm: e => e - 1, m: e => 1 + 0.5 * (e - 1),
    uF: () => 1, kU: () => 1, pU: e => Math.pow(2, e - 1),
  },
  OSTROZNY: { // surowce x1,25/epoke (bez zamrozenia); bonusy bez zmian; racje step 0,6; wojsko +25%/epoke
    rm: e => Math.pow(1.25, e - 1), bm: e => e - 1, m: e => 1 + 0.6 * (e - 1),
    uF: e => 1 + 0.25 * (e - 1), kU: () => 1, pU: e => Math.pow(2, e - 1),
  },
  SREDNI: { // Braz: surowce x1,25, bonus +1 (jak dzis), racje step 0,75, wojsko +50%, Drewno jednostek x1,25;
            // Zelazo: surowce i bonus ZAMROZONE, racje/wojsko dalej rosna; utrzymanie Pracy 3/6
    rm: e => Math.pow(1.25, Math.min(e - 1, 1)), bm: e => Math.min(e - 1, 1),
    m: e => 1 + 0.75 * (e - 1), uF: e => 1 + 0.5 * (e - 1),
    kU: e => 1 + 0.25 * Math.min(e - 1, 1), pU: e => (e === 2 ? 3 : 6),
  },
  REKOMENDOWANY: { // Braz: surowce x1,25, bonus +1 (jak dzis, bez obciecia), racje step 0,6 (Braz 1,6; Zelazo 2,2),
                   // wojsko x1,25 w Brazie; Zelazo: surowce, bonus i wojsko (uF) ZAMROZONE na poziomie Brazu;
                   // Drewno jednostek x1,25 (Brąz, zamrozone); utrzymanie Pracy 2/4 bez zmian wzgledem PRZED
    rm: e => Math.pow(1.25, Math.min(e - 1, 1)), bm: e => Math.min(e - 1, 1),
    m: e => 1 + 0.6 * (e - 1), uF: e => 1 + 0.25 * Math.min(e - 1, 1),
    kU: e => 1 + 0.25 * Math.min(e - 1, 1), pU: e => Math.pow(2, e - 1),
  },
  MOCNY: { // surowce stale (x1,0), bonus 0 (farma 4 -> 3 juz w Brazie, -25%), racje step 1,0,
           // wojsko +100%/epoke, Drewno jednostek x1,5, utrzymanie Pracy 4/8
    rm: () => 1, bm: () => 0, m: e => 1 + 1.0 * (e - 1), uF: e => 1 + 1.0 * (e - 1),
    kU: () => 1.5, pU: e => 2 * Math.pow(2, e - 1),
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
    pracaUpkeep: h.pracaUpkeep || 0,
    spichNet: h.spichlerzRate,
    drewnoBrutto: drewno.brutto || 0,
    drewnoZuz: drewno.zuzycie || 0,
    drewnoUnitUpkeep: (o.utrzymanieJednostekSurowce || {}).drewno || 0,
    bruttoSur,
  };
}

const NIMP = {
  UPK: s => s.pracaUpkeep / PRACA_UPK_MEAS,
  BRU: s => s.bruttoSur / 75,
};

// Wynik dla wariantu v w epoce e (e = 2 pomiar; e = 3 projekcja statyczna).
// nImp: liczba ulepszen (estymator); perUnit: zywnosc/ture na jednostke (miks KAM=4 / BRAZ=8).
function evalVariant(v, s, e, nImp, perUnit) {
  const bmDelta = (v.bm(e) - 1) * nImp * UDZIAL_ZYWN;   // wzgledem pomiaru (bm pomiaru = 1)

  const drewnoBrutto = s.drewnoBrutto * (v.rm(e) / RM_MEAS);
  const drewnoZuzCywilne = s.drewnoZuz - s.drewnoUnitUpkeep;
  const drewnoNet = drewnoBrutto - drewnoZuzCywilne - s.drewnoUnitUpkeep * v.kU(e);

  const pracaUpk = (v.pU(e) - PRACA_UPK_MEAS) * nImp;
  const praca = s.pracaNet + bmDelta - pracaUpk;

  const racjeMeas = s.pop * RATION_PER_POP * M_MEAS;
  const wojskoMeas = s.units * perUnit * CAMP_SHARE;
  const prodFood = s.spichNet + racjeMeas + wojskoMeas;   // produkcja odtworzona z pomiaru (zalozenie miksu)
  const racjePO = s.pop * RATION_PER_POP * v.m(e);
  const wojskoPO = s.units * perUnit * v.uF(e) * CAMP_SHARE;
  const food = prodFood + bmDelta - racjePO - wojskoPO;

  return { drewnoNet, praca, food, racje: racjePO, wojsko: wojskoPO, nImp };
}

function fmt(x) {
  if (!Number.isFinite(x)) throw new Error('NaN w wyniku');
  return (Math.round(x * 10) / 10).toString().replace('.', ',');
}

const out = [];
const sep = CSV ? ';' : ' | ';
out.push(['seed', 'tura', 'epoka', 'wariant', 'estymator N_imp', 'miks jednostek', 'N_imp',
  'Drewno netto/t', 'Praca netto/t', 'Zywnosc netto/t', 'racje obyw.', 'zywnosc wojska'].join(sep));
for (const seed of SEEDS) {
  const rows = loadSeed(seed);
  for (const t of TURNS) {
    const s = snapshot(rows, t);
    for (const e of [2, 3]) {
      for (const name of Object.keys(VARIANTS)) {
        for (const nm of Object.keys(NIMP)) {
          for (const mix of Object.keys(UNIT_FOOD)) {
            const nImp = NIMP[nm](s);
            const r = evalVariant(VARIANTS[name], s, e, nImp, UNIT_FOOD[mix]);
            out.push([seed, t, e === 2 ? 'Braz(2)' : 'Zelazo(3,proj)', name, nm, mix, fmt(nImp),
              fmt(r.drewnoNet), fmt(r.praca), fmt(r.food), fmt(r.racje), fmt(r.wojsko)].join(sep));
          }
        }
      }
    }
  }
}
console.log(out.join('\n'));
