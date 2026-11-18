#!/usr/bin/env node
// R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1 — model arytmetyczny produkcji (tylko odczyt).
// Nie importuje kodu gry: stałe przepisane z plików źródłowych (podane przy każdej stałej).
// Uzycie: node gra/tools/econ-growth-model.cjs
// Wynik: produkcja/turę dla "typowego miasta" (ZAŁOŻENIE: 1 Cegielnia + 1 Garncarnia + 1 Odlewnia żelaza)
// oraz imperium N miast, per epoka 1..5, plus udział czynników (addytywnie vs mnożąco).
'use strict';

// --- Stałe z kodu (źródło w komentarzu) ---
// citizen-consumption-era.ts:19,24: m(e) = 1 + 0.5 × (e − 1)
const m = (e) => 1 + 0.5 * (e - 1);
// converters.ts (budynek_cegielnia_*_przepustowosc, econ-params.json): cykle/turę wg epoki 1..5 (3+ = 100)
const CEGIELNIA_CYKLE = [50, 75, 100, 100, 100];
// converters.ts:189-194 CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE cegielnia=0,50 → mnożnik wyjścia 1+0,5(e−1)
const cegloOutMult = (e) => 1 + 0.5 * (e - 1);
// converters.ts recipe cegielnia: outputAmount 2 cegły za cykl
const CEGLA_NA_CYKL = 2;
// converters.ts:206-213 converterThroughputForEra: odlewnie żelaza = baza 50 × m(e)
const ODLEWNIA_ZELAZA_BAZA = 50;
// econ-params.json budynek_garncarnia_*: 30/50/70/90/110 cykli/turę wg epoki 1..5
const GARNCARNIA_CYKLE = [30, 50, 70, 90, 110];
// econ-params.json: stolarnia / warsztat +10% drewna / kamienia civ-wide ADDYTYWNIE za sztukę
const BONUS_SZT = 0.10;
// economy-upkeep.ts (R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1): cap państwa = baza × (1 + 0,2 × Magazyny)
const MAGAZYN_BONUS = 0.20;
const CAP_BAZA_SUROWCE = 50000; // econ-params.json magazyn_baza_surowce (epoka 1, PANSTWO)
// economy-upkeep.ts:391-394 magazynEraMultiplier(e) = 2^(e-1) (COMPOUND, podwaja się co epokę właściciela);
// economy-upkeep.ts:457 ownerResourceCapacityPerType = round(baza × (1 + 0,2×Magazyny) × 2^(e-1)).
const magazynEra = (e) => Math.pow(2, Math.max(1, e) - 1);
const capSurowcePanstwo = (e, M) => Math.round(CAP_BAZA_SUROWCE * (1 + MAGAZYN_BONUS * M) * magazynEra(e));
// empire-food.ts:190-193 computeCentralFoodCap: baza 1000 (płaska) + Σ Spichlerz (I=1000, II=1500) × 2^(e-1)
const SPICHLERZ_I = 1000, SPICHLERZ_II = 1500, FOOD_BAZA = 1000;
const capZywnosc = (e, nI, nII) => FOOD_BAZA + (nI * SPICHLERZ_I + nII * SPICHLERZ_II) * magazynEra(e);
// citizen-consumption-era.ts:19,24: mnożnik zużycia/produkcji LINIOWY m(e) (dla porównania)
// building-stock-cost.ts:34-40 epochCostMultiplier: utrzymanie budynku wg epoki WEJŚCIA budynku: 1 / 2 / 4 (stałe per budynek, NIE rośnie w czasie)

const eraIdx = (e) => Math.min(Math.max(1, e), 5) - 1;

function miastoTypowe(e) {
  const cegla = CEGIELNIA_CYKLE[eraIdx(e)] * CEGLA_NA_CYKL * cegloOutMult(e); // cegła/t
  const zelazo = ODLEWNIA_ZELAZA_BAZA * m(e); // żelazo/t (1 na cykl)
  const ceramika = GARNCARNIA_CYKLE[eraIdx(e)]; // ceramika/t (1 na cykl)
  return { cegla, zelazo, ceramika };
}

// Imperium: N miast × typowe miasto × (1 + 0,1·Stolarnie + 0,1·Warsztaty) — czynniki civ-wide
// wchodzą ADDYTYWNIE (suma w nawiasie), miasta i epoka WCHODZĄ MNOŻĄCO (iloczyn).
function imperium(e, N, stolarnie = 0, warsztaty = 0) {
  const t = miastoTypowe(e);
  const bonus = 1 + BONUS_SZT * stolarnie + BONUS_SZT * warsztaty;
  return {
    cegla: N * t.cegla,
    zelazo: N * t.zelazo,
    ceramika: N * t.ceramika,
    bonus,
    capSurowce: capSurowcePanstwo(e, 0), // bez Magazynów; z mnożnikiem 2^(e-1)
  };
}

const r = (x) => Math.round(x * 10) / 10;
const lines = [];
lines.push('# Model produkcji — typowe miasto (ZAŁOŻENIE: 1 Cegielnia + 1 Garncarnia + 1 Odlewnia żelaza)');
lines.push('epoka | m(e) | cegła/t | żelazo/t | ceramika/t | cegła × vs e1 | żelazo × vs e1');
const base = miastoTypowe(1);
for (let e = 1; e <= 5; e++) {
  const t = miastoTypowe(e);
  lines.push(`${e} | ${r(m(e))} | ${r(t.cegla)} | ${r(t.zelazo)} | ${t.ceramika} | ${r(t.cegla / base.cegla)} | ${r(t.zelazo / base.zelazo)}`);
}

// Trzy wartości N miast z pomiaru AI (średnia miast ownera: t25 ≈ 4,3; t50 ≈ 11,9; t75 ≈ 16,3)
// (ai-economy jsonl: econ-growth-analyze.cjs, seed4242)
lines.push('');
lines.push('# Imperium (N miast z pomiaru AI seed4242, epoka założona wg tury, NIEZMIERZONA mapa tura→epoka)');
lines.push('N | e | cegła/t | żelazo/t | ceramika/t (sumy ×N)');
for (const [N, e] of [[4.3, 1], [4.3, 2], [11.9, 2], [11.9, 3], [16.3, 3], [16.3, 4]]) {
  const im = imperium(e, N);
  lines.push(`${N} | ${e} | ${r(im.cegla)} | ${r(im.zelazo)} | ${r(im.ceramika)}`);
}

// Udział wzrostu: od (N=4,3; e=1) do (N=16,3; e=4) — rozkład log-przyrostu na czynniki mnożące.
// Czynnik miast: 16,3/4,3; epoka: produkt m(e)×outMult; bonusy: 1 (brak Stolarni/Warsztatów w modelu).
const a = imperium(1, 4.3);
const b = imperium(4, 16.3);
const fCity = 16.3 / 4.3;
const fEra = b.zelazo / (a.zelazo * fCity); // epoka (żelazo: m(e) liniowe)
const fEraBrick = b.cegla / (a.cegla * fCity); // epoka (cegła: cykle × outMult, liniowe)
lines.push('');
lines.push('# Dekompozycja mnożąca (żelazo, e1 N=4,3 → e4 N=16,3)');
lines.push(`czynnik miast = ${r(fCity)}x; czynnik epoki (żelazo, m(e) liniowe) = ${r(fEra)}x; czynnik epoki (cegła, cykle×outMult) = ${r(fEraBrick)}x`);
lines.push(`całkowity wzrost żelaza = ${r(b.zelazo / a.zelazo)}x = ${r(fCity)} × ${r(fEra)}`);
lines.push('Uwaga: m(e) i outMult są LINIOWE w epoce (1+0,5(e−1)), nie wykładnicze; składanie wykładnicze = NIE znaleziono w konwerterach (converters.ts:127-136 odrzuca wariant compound).');

// Kontrola: wpływ +10% addytywnie za Stolarnię (N=16,3, e=3) — zmiana względna
const b3 = imperium(3, 16.3, 0, 0).zelazo;
const b3s = imperium(3, 16.3, 5, 0).zelazo; // 5 Stolarni (wpływ tylko na drewno – tu pokazujemy mnożnik bonusu)
lines.push(`Kontrola: bonus civ-wide 5 Stolarni = ×${r(imperium(3, 16.3, 5).bonus)} (dotyczy drewna, nie żelaza; żelazo ×1 w modelu).`);
void b3; void b3s;


// --- Sufit (cap) państwa: JEDYNY czynnik wykładniczy po stronie zapasów ---
lines.push('');
lines.push('# Cap surowców państwa (per typ) = 50000 × (1+0,2×Magazyny) × 2^(e−1)  [economy-upkeep.ts:391-394,457]');
lines.push('epoka | mnożnik 2^(e−1) | cap M=0 | cap M=5 | cap / poprzednia epoka (M=0)');
for (let e = 1; e <= 5; e++) {
  lines.push(`${e} | ${magazynEra(e)} | ${capSurowcePanstwo(e, 0)} | ${capSurowcePanstwo(e, 5)} | ${e === 1 ? '-' : r(capSurowcePanstwo(e, 0) / capSurowcePanstwo(e - 1, 0))}`);
}
// Ile tur produkcji żelaza (imperium N=16,3, e=4, bez zużycia) potrzeba do capu — ORIENTACYJNIE
const ironN163e4 = imperium(4, 16.3).zelazo;
lines.push(`Żelazo imperium N=16,3 e=4: ${r(ironN163e4)}/t (model per typowe miasto, bez Stolarni); tury do capu M=0 (400000) bez zużycia = ${r(capSurowcePanstwo(4, 0) / ironN163e4)}`);
lines.push('UWAGA: model NIE odtwarza HUD gracza (zrzut: Surowce +153,1k/t brutto). Różnica ~10x NIEWYJAŚNIONA — patrz dokument §0/§6.');

// --- Sufit żywności (Spichlerz) ---
lines.push('');
lines.push('# Cap żywności imperium = 1000 + (Spichlerz I×1000 + Spichlerz II×1500) × 2^(e−1)  [empire-food.ts:190-193]');
lines.push('epoka | przykład 6×I+3×II | cap');
for (let e = 1; e <= 5; e++) lines.push(`${e} | 6I+3II | ${capZywnosc(e, 6, 3)}`);
lines.push('Max spichlerza w jsonl = 85000 (seed4242 t75) = zgodne z tą formułą dla e=4 i 10500 pojemności Spichlerzy (6I+3II), NIE potwierdzone liczbą Spichlerzy w danych.');

// --- Udział czynników wzrostu żelaza e1→e4 w skali logarytmicznej ---
const ln = Math.log;
const cityShare = ln(16.3 / 4.3), eraShare = ln(b.zelazo / a.zelazo / (16.3 / 4.3));
lines.push('');
lines.push('# Udział czynników we wzroście żelaza e1 (N=4,3) → e4 (N=16,3), skala ln');
lines.push(`miasta (mnożąco): ln(3,79)=${r(cityShare)} (${r(100 * cityShare / (cityShare + eraShare))}%); epoka m(e) liniowe: ln(2,5)=${r(eraShare)} (${r(100 * eraShare / (cityShare + eraShare))}%); cap państwa ×8 (NIE wlicza się do produkcji, tylko do sufitu zapasów): ln(8)=${r(ln(8))}`);

console.log(lines.join('\n'));
