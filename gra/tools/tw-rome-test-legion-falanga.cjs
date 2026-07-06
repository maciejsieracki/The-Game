'use strict';
/**
 * Test: obecne staty units.json + model TW (Rome 2 hit + dmg v3)
 * Legion (Hastati) ATK vs Falanga DEF, płasko, szarża zanegowana
 */
const fs = require('fs');
const path = require('path');

const UNITS = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'units.json'), 'utf8'),
);
const H = UNITS.find((u) => u['Jednostka'] === 'Hastati');
const F = UNITS.find((u) => u['Jednostka'] === 'Falanga');

const HIT_BASE = 40;
const HIT_MIN = 15;
const HIT_MAX = 75;

function hitPct(atk, obr, bonus = 0) {
  return Math.max(HIT_MIN, Math.min(HIT_MAX, HIT_BASE + atk - obr + bonus));
}
function dmgTw(obraz, panc, przeb) {
  return Math.max(0, obraz - panc) + przeb;
}
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function unitRow(u) {
  return {
    name: u['Jednostka'],
    Atak: u['Atak'],
    Obrona: u['Obrona'],
    Obrażenia: u['Obrażenia'],
    Przebicie: u['Przebicie'],
    Pancerz: u['Pancerz'],
    Szarża: u['Uderzenie'],
    Zdrowie: u['Health'],
    AtakDyst: u['Atak dystansowy'] || 0,
    Pociski: u['Ilość pocisków'] || 0,
  };
}

function simBattle(atk, def, opts = {}) {
  const chargeNegated = opts.chargeNegated !== false;
  const rng = lcg(opts.seed ?? 42);
  let hpA = atk.Zdrowie;
  let hpD = def.Zdrowie;
  let round = 0;
  const log = [];

  // Pilum (2 rzuty) — hit Rome 2 z Atak wręcz, dmg TW z Atak dystansowy
  const pociski = typeof atk.Pociski === 'number' ? atk.Pociski : parseInt(String(atk.Pociski), 10) || 0;
  if (atk.AtakDyst > 0 && pociski > 0) {
    log.push('--- Faza dystansowa (pilum) ---');
    for (let i = 0; i < pociski && hpD > 0; i++) {
      round++;
      const hit = hitPct(atk.Atak, def.Obrona);
      const roll = rng() * 100;
      if (roll < hit) {
        const d = dmgTw(atk.AtakDyst, def.Pancerz, 0);
        hpD -= d;
        log.push(`R${round} pilum TRAF ${roll.toFixed(1)}<${hit}% dmg=${d} Falanga HP=${hpD}`);
      } else {
        log.push(`R${round} pilum CHYB ${roll.toFixed(1)}>=${hit}% Falanga HP=${hpD}`);
      }
    }
  }

  log.push('--- Zwarcie (szarża ' + (chargeNegated ? 'ZANEGOWANA' : 'aktywna') + ') ---');

  while (hpA > 0 && hpD > 0 && round < 500) {
    round++;
    const chargeHit = !chargeNegated && round === 1 ? atk.Szarża : 0;
    const chargeDmg = !chargeNegated && round === 1 ? atk.Szarża : 0;

    const hitA = hitPct(atk.Atak, def.Obrona, chargeHit);
    const rollA = rng() * 100;
    if (rollA < hitA) {
      const d = dmgTw(atk.Obrażenia, def.Pancerz, atk.Przebicie) + chargeDmg;
      hpD -= d;
      log.push(
        `R${round} Legion TRAF ${rollA.toFixed(1)}<${hitA}% dmg=${d} Falanga HP=${Math.max(0, hpD)}`,
      );
    } else {
      log.push(`R${round} Legion CHYB ${rollA.toFixed(1)}>=${hitA}%`);
    }
    if (hpD <= 0) break;

    const hitD = hitPct(def.Atak, atk.Obrona, 0);
    const rollD = rng() * 100;
    if (rollD < hitD) {
      const d = dmgTw(def.Obrażenia, atk.Pancerz, def.Przebicie);
      hpA -= d;
      log.push(
        `R${round} Falanga TRAF ${rollD.toFixed(1)}<${hitD}% dmg=${d} Legion HP=${Math.max(0, hpA)}`,
      );
    } else {
      log.push(`R${round} Falanga CHYB ${rollD.toFixed(1)}>=${hitD}%`);
    }
  }

  const winner =
    hpD <= 0 ? 'Legion (Hastati)' : hpA <= 0 ? 'Falanga' : 'remis';
  return { winner, round, hpA: Math.max(0, hpA), hpD: Math.max(0, hpD), log };
}

const legion = unitRow(H);
const falanga = unitRow(F);

const hitLegion = hitPct(legion.Atak, falanga.Obrona);
const hitFalanga = hitPct(falanga.Atak, legion.Obrona);
const dmgLegion = dmgTw(legion.Obrażenia, falanga.Pancerz, legion.Przebicie);
const dmgFalanga = dmgTw(falanga.Obrażenia, legion.Pancerz, falanga.Przebicie);

const battle = simBattle(legion, falanga, { seed: 42, chargeNegated: true });

console.log('=== STATY Z GRY (units.json) ===');
console.log('Legion:', legion);
console.log('Falanga:', falanga);
console.log('');
console.log('=== MODEL TW: Rome 2 hit + dmg max(0,Obraż-Pancerz)+Przeb ===');
console.log('Legion -> Falanga: hit', hitLegion + '%, dmg/trafienie', dmgLegion);
console.log('Falanga -> Legion: hit', hitFalanga + '%, dmg/trafienie', dmgFalanga);
console.log('E[dmg/tura]:', (hitLegion / 100) * dmgLegion, 'vs', (hitFalanga / 100) * dmgFalanga);
console.log('');
console.log('=== WYNIK (seed=42, Legion ATK, szarża zanegowana) ===');
console.log('Zwycięzca:', battle.winner);
console.log('Tura:', battle.round);
console.log('HP Legion:', battle.hpA, '/ HP Falanga:', battle.hpD);
console.log('');
console.log('=== LOG (pierwsze 12 linii) ===');
battle.log.slice(0, 12).forEach((l) => console.log(l));
if (battle.log.length > 12) console.log('... +' + (battle.log.length - 12) + ' linii');
