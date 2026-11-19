#!/usr/bin/env node
/**
 * treasury-unit-cost-model.cjs — statyczny model skarbca (¤/turę) dla tematu
 * R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1 (część F: koszty jednostek).
 *
 * Tylko odczyt: nie zmienia gra/src ani gra/data. Uruchomienie:
 *   node gra/tools/treasury-unit-cost-model.cjs
 *
 * Źródła w kodzie (stan origin/main ea8f70197):
 *   - utrzymanie jednostki = round(units.json „Utrzymanie (Pieniądz/turę)” × 4)  [economy-upkeep.ts unitUpkeep;
 *     R_STAWKI_FALA1_FALA2_MULT = 4 w r-stawki-strojenie.ts]. BRAK skali epoki na utrzymaniu.
 *   - koszt rekrutacji = scaleCostByEpoch(„Pieniądz (koszt)”, Epoka): Kamień ×1, Brąz ×2, Żelazo ×4
 *     [building-stock-cost.ts epochCostMultiplier; production.ts unitCostMode/cost].
 *   - budynki: buildingEraCostMultiplier dotyczy KOSZTU BUDOWY, nie utrzymania.
 *
 * Dane zrzutu „Skarbiec imperium” (Brąz, 20 miast, skarbiec 7096) — z zadania właściciela:
 *   wpływy 1550, utrzymanie budynków 786, utrzymanie jednostek 376, netto skarbca 345 (wartość z panelu).
 *   UWAGA: 1550 − 1162 = 388, nie 345; różnica 43 NIE_ZMIERZONO (Administrator, zaokrąglenia lub inna pozycja).
 *
 * Uwaga metodologiczna: model NIE ma sprzężenia zwrotnego (AI/gracz nie zmniejsza armii przy droższych jednostkach).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const UNITS_PATH = path.join(__dirname, '..', 'data', 'units.json');
const R_STAWKI_MULT = 4;
const EPOCH_COST_MULT = { 1: 1, 2: 2, 3: 4 };
const EPOCH_NAME = { 'Kamień': 1, 'Brąz': 2, 'Żelazo': 3 };

const SNAP = { income: 1550, buildingUpkeep: 786, unitUpkeep: 376, netPanel: 345, treasury: 7096 };

function epochOrdinal(epoka) {
  return EPOCH_NAME[epoka] ?? 1;
}

function loadUnits() {
  const rows = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));
  return rows
    .filter((r) => typeof r['Jednostka'] === 'string')
    .map((r) => {
      const ord = epochOrdinal(r['Epoka']);
      const upkeepRaw = Number(r['Utrzymanie (Pieniądz/turę)']) || 0;
      const costRaw = Number(r['Pieniądz (koszt)']) || 0;
      return {
        name: r['Jednostka'],
        typ: r['Typ'] || '?',
        epoka: r['Epoka'],
        ord,
        upkeepGold: upkeepRaw * R_STAWKI_MULT,
        recruitGold: costRaw > 0 ? Math.max(1, Math.round(costRaw * (EPOCH_COST_MULT[ord] ?? 1))) : 0,
      };
    });
}

function summarize(units) {
  const byEra = {};
  for (const u of units) {
    const k = u.epoka;
    byEra[k] = byEra[k] || { n: 0, upkeepSum: 0, recruitSum: 0, recruitN: 0, zeroUpkeep: 0 };
    byEra[k].n += 1;
    byEra[k].upkeepSum += u.upkeepGold;
    if (u.upkeepGold === 0) byEra[k].zeroUpkeep += 1;
    if (u.recruitGold > 0) {
      byEra[k].recruitSum += u.recruitGold;
      byEra[k].recruitN += 1;
    }
  }
  return byEra;
}

/** Wynik netto skarbca przy mnożniku utrzymania jednostek (dotyczy całej puli 376 — górna granica). */
function netWithUnitMult(mult) {
  const unitCost = SNAP.unitUpkeep * mult;
  const delta = unitCost - SNAP.unitUpkeep;
  return { mult, unitCost: round1(unitCost), net: round1(SNAP.netPanel - delta), deltaPerTurn: round1(delta) };
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

function main() {
  const units = loadUnits();
  const byEra = summarize(units);

  console.log('== Utrzymanie i rekrutacja wg epoki jednostki (kod: R_STAWKI ×4 na utrzymanie; epoch x1/x2/x4 na koszt) ==');
  console.log('epoka      | jedn. | utrz./tura śr. (po ×4) | rekrutacja śr. (¤) | utrz. 0 (np. gwardie)');
  for (const [era, s] of Object.entries(byEra)) {
    const avgUp = s.n ? (s.upkeepSum / s.n).toFixed(2) : '-';
    const avgRec = s.recruitN ? (s.recruitSum / s.recruitN).toFixed(1) : '-';
    console.log(`${era.padEnd(10)} | ${String(s.n).padStart(5)} | ${avgUp.padStart(22)} | ${avgRec.padStart(18)} | ${s.zeroUpkeep}`);
  }

  console.log('');
  console.log('== Ile jednostek daje 376 ¤/tura (granice; mix typów NIE_ZMIERZONO) ==');
  const brazUp = units.filter((u) => u.ord === 2 && u.upkeepGold > 0).map((u) => u.upkeepGold);
  const minUp = Math.min(...units.filter((u) => u.upkeepGold > 0).map((u) => u.upkeepGold));
  const maxUp = Math.max(...units.map((u) => u.upkeepGold));
  const avgBrazUp = brazUp.reduce((a, b) => a + b, 0) / brazUp.length;
  console.log(`min stawka ${minUp} ¤ -> max ${Math.round(SNAP.unitUpkeep / minUp)} jedn.; max stawka ${maxUp} ¤ -> min ${Math.ceil(SNAP.unitUpkeep / maxUp)} jedn.`);
  console.log(`średnia stawka Brąz (>0) ${avgBrazUp.toFixed(2)} ¤ -> ok. ${Math.round(SNAP.unitUpkeep / avgBrazUp)} jedn. (gdyby cała pula była Brązem)`);

  console.log('');
  console.log('== Udział kosztów jednostek ==');
  console.log(`376/1162 (koszty) = ${(100 * 376 / 1162).toFixed(1)}%   376/1550 (wpływy) = ${(100 * 376 / 1550).toFixed(1)}%   376/786 (budynki) = ${(100 * 376 / 786).toFixed(1)}%`);
  console.log(`wpływy/koszty = ${(1550 / 1162).toFixed(2)}x   netto wg sumy = ${1550 - 1162} (panel: ${SNAP.netPanel}, różnica ${1550 - 1162 - SNAP.netPanel} NIE_ZMIERZONO)`);

  console.log('');
  console.log('== Warianty: mnożnik utrzymania pieniężnego jednostek (górna granica: cała pula 376) ==');
  console.log('wariant            | mnożnik | koszt jedn. | Δ/tura | netto skarbca (z 345)');
  const variants = [
    ['V0 obecnie', 1],
    ['V1 ostrożny +10%', 1.1],
    ['V2 średni +20%', 1.2],
    ['V3 mocny +30%', 1.3],
    ['Kontrast: jak budynki ×2', 2],
  ];
  for (const [label, m] of variants) {
    const r = netWithUnitMult(m);
    console.log(`${label.padEnd(18)} | ${String(m).padStart(7)} | ${String(r.unitCost).padStart(11)} | ${String(r.deltaPerTurn).padStart(6)} | ${String(r.net).padStart(8)}`);
  }

  console.log('');
  console.log('== Próg zerowania netto (mnożnik, przy którym netto = 0, wg panelu 345) ==');
  const breakEven = 1 + SNAP.netPanel / SNAP.unitUpkeep;
  console.log(`m* = 1 + 345/376 = ${breakEven.toFixed(2)} (koszt jednostek wzrósłby o ${(100 * (breakEven - 1)).toFixed(0)}%)`);

  console.log('');
  console.log('== Skarbiec: czas do wyczerpania przy netto ujemnym (tylko dla wariantów z netto<0) ==');
  for (const [label, m] of variants) {
    const r = netWithUnitMult(m);
    if (r.net >= 0) {
      console.log(`${label}: netto ${r.net} >= 0 -> skarbiec rośnie (nie wyczerpuje się; brak sufitu skarbca w modelu — NIE_ZMIERZONO)`);
    } else {
      console.log(`${label}: netto ${r.net} < 0 -> wyczerpanie ${Math.ceil(SNAP.treasury / -r.net)} tur`);
    }
  }
}

main();
