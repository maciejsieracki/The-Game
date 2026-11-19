#!/usr/bin/env node
/**
 * food-granary-model.cjs — statyczny model żywności i Spichlerza Centralnego (Brąz) dla tematu
 * R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1 (część A–D: żywność).
 *
 * Tylko odczyt, bez zmian w gra/src i gra/data. Uruchomienie:
 *   node gra/tools/food-granary-model.cjs
 *
 * Formuły z kodu (origin/main ea8f70197):
 *   cap centralny = centralCapBaza(1000, econ-params magazyn_centralny_baza_zywnosc)
 *                 + Σ Spichlerz I 1000 / II 1500 × magazynEraMultiplier(e)   [empire-food.ts computeCentralFoodCap;
 *                   building-resource-gate.ts SPICHLERZ_EMPIRE_CAP_I/II; economy-upkeep.ts magazynEraMultiplier = 2^(e-1)]
 *   zapas po turze = min(cap, zapas + produkcja − wyżywienie − armia), obcięcie do capu PRZEPADA [empire-food.ts ok. l.283-290]
 *   wyżywienie = Σ pop × poziomRacji × R_STAWKI_KOSZT_MULT(2) × m(e)   [population-growth-v85.ts computeCityRationCost]
 *                m(e) = 2^(e-1) gdy eraRebalansAktywny (econ-era-rebalance-params.json), inaczej 1+0,5(e-1)
 *   armia (żywność jednostki) = units.json „żywność/turę” × 3^(e-1) × 4 (R_STAWKI)   [econ-era-rebalance.ts + economy-upkeep.ts]
 *                → Kamień 4, Brąz 12, Żelazo 36 na jednostkę dziennie (flaga ON).
 *
 * Dane zrzutu „SPICHLERZ CENTRALNY” (Brąz): zapas 29 086 / cap 54 000; produkcja 3363; wyżywienie 1046;
 * wojsko 312; nadwyżka 2317; przyrost zapasów 2005. Spójność: 3363−1046−312 = 2005 (zgadza się).
 * „Spichlerz stolicy +29 399” ≈ zapas przed armią (29086 + 312 = 29398). NIE_ZMIERZONO w kodzie: nazwa pola w panelu.
 *
 * Dekompozycja 54 000 = 1000 + 2×(1000·a + 1500·b) przy e=2: 2000a + 3000b = 53 000 → a,b całkowite
 * np. (10 I, 11 II), (13 I, 9 II), (16 I, 7 II). Który zestaw — NIE_ZMIERZONO (brak liczby budynków w zrzucie).
 */
'use strict';

const SNAP = {
  zapas: 29086,
  produkcja: 3363,
  wyzywienie: 1046,
  wojsko: 312,
  epoka: 2,
};

const CAP_BASE = 1000;
const SPICHLERZ_I = 1000;
const SPICHLERZ_II = 1500;

function magazynMult(e) {
  return Math.pow(2, Math.max(1, e) - 1);
}

function capFor({ nI, nII, e }) {
  return CAP_BASE + magazynMult(e) * (SPICHLERZ_I * nI + SPICHLERZ_II * nII);
}

function consumptionMult(e, rebalance) {
  return rebalance ? Math.pow(2, e - 1) : 1 + 0.5 * (e - 1);
}

/**
 * Symulacja zapasu. Warianty przyjmują:
 *   prodMult   — mnożnik produkcji żywności z ulepszeń (ulepszenia stałe na epoce 1)
 *   decayRate  — utrata zapasu na turę powyżej progu decayFrom (ułamek capu)
 *   convRate   — konwersja nadwyżki powyżej convFrom (ułamek capu) na ¤ (1 żywność → convRate ¤)
 */
function simulate({ cap, prodMult = 1, decayRate = 0, decayFrom = 1, convRate = 0, convFrom = 1, turns = 60, rebalance = true }) {
  let stock = SNAP.zapas;
  const prod = SNAP.produkcja * prodMult;
  const cons = SNAP.wyzywienie * (rebalance ? 1 : consumptionMult(SNAP.epoka, false) / consumptionMult(SNAP.epoka, true));
  const army = SNAP.wojsko;
  let gold = 0;
  let fullTurn = null;
  let wasted = 0;
  for (let t = 1; t <= turns; t++) {
    let next = stock + prod - cons - army;
    const over = stock - decayFrom * cap;
    if (over > 0 && decayRate > 0) next -= decayRate * over;
    const convOver = stock - convFrom * cap;
    if (convOver > 0 && convRate > 0) {
      const conv = Math.min(convOver, Math.max(0, next - stock));
      next -= conv;
      gold += conv * convRate;
    }
    if (next >= cap) {
      if (fullTurn === null) fullTurn = t;
      wasted += next - cap;
      next = cap;
    }
    stock = Math.max(0, next);
  }
  return { stockEnd: Math.round(stock), fullTurn, wastedTotal: Math.round(wasted), goldTotal: Math.round(gold), netPerTurn: Math.round(prod - cons - army) };
}

function main() {
  const cap = capFor({ nI: 10, nII: 11, e: SNAP.epoka });
  console.log(`cap (dekompozycja 10 I + 11 II, e=2) = ${cap}  (zrzut: 54000)`);
  console.log(`przyrost netto = ${SNAP.produkcja} − ${SNAP.wyzywienie} − ${SNAP.wojsko} = ${SNAP.produkcja - SNAP.wyzywienie - SNAP.wojsko}  (zrzut: +2005)`);
  console.log(`tury do capu (bez zmian) = ${Math.ceil((cap - SNAP.zapas) / (SNAP.produkcja - SNAP.wyzywienie - SNAP.wojsko))}  (zrzut: ~12)`);
  // Pasek w panelu = zywnoscWplywMiast (brutto PRZED armią) → zywnoscRate (netto PO armii); ZMIERZONO w empireDetailPanel.ts.
  const offBrutto = Math.round(SNAP.produkcja - SNAP.wyzywienie * consumptionMult(2, false) / consumptionMult(2, true));
  const onBrutto = SNAP.produkcja - SNAP.wyzywienie;
  console.log(`brutto miast (przed armią): flaga OFF = ${offBrutto}, flaga ON = ${onBrutto}; zrzut paska = 2267 → 1954 (różnica ${2267 - 1954} ≈ wojsko ${SNAP.wojsko})`);
  console.log(`zrzut 2267 NIE zgadza się z OFF (${offBrutto}) ani z ON (${onBrutto}); implikowane wyżywienie miast = ${SNAP.produkcja - 2267} (NIE_ZMIERZONO)`);
  console.log('');

  const variants = [
    ['V0 obecnie', {}],
    ['V1 ostrożny: produkcja ulepszeń −10%', { prodMult: 0.9 }],
    ['V2 średni: produkcja −20% + psucie 2%/t nad 50% capu', { prodMult: 0.8, decayRate: 0.02, decayFrom: 0.5 }],
    ['V3 mocny: produkcja −30% + konwersja 0,2 ¤/żywność nad 70% capu', { prodMult: 0.7, convRate: 0.2, convFrom: 0.7 }],
    ['Kontrast: psucie 2%/t nad 50% (bez zmiany produkcji)', { decayRate: 0.02, decayFrom: 0.5 }],
  ];
  console.log('wariant | zapas po 60 t | pierwsza tura przy capie | przepadek (suma) | ¤ z konwersji | netto/t przed psuciem');
  for (const [label, v] of variants) {
    const r = simulate({ cap, ...v });
    console.log(`${label} | ${r.stockEnd} | ${r.fullTurn ?? '—'} | ${r.wastedTotal} | ${r.goldTotal} | ${r.netPerTurn}`);
  }
  console.log('');
  console.log('Uwaga: psucie „2%/t nad 50% capu” NIE zatrzymuje wzrostu przy capie (stacjonarny zapas > cap);');
  console.log('skutek tylko przy niższej produkcji. Liczby to PROPOZYCJE do wyboru, nie wartości przyjęte.');
}

main();
