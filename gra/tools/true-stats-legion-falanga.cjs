'use strict';
/** Prawdziwe staty = JSON z macierzy v2 po odjęciu skali (Atak/Obrona/Obraż/Przeb/Panc/Szarża ÷10) */
const fs = require('fs');
const path = require('path');
const UNITS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'units.json'), 'utf8'));
const H = UNITS.find((u) => u['Jednostka'] === 'Hastati');
const F = UNITS.find((u) => u['Jednostka'] === 'Falanga');

function trueStats(raw) {
  return {
    Atak: raw['Atak'] / 10,
    Obrona: raw['Obrona'] / 10,
    Obrazenia: raw['Obrażenia'] / 10,
    Przebicie: raw['Przebicie'] / 10,
    Pancerz: raw['Pancerz'] / 10,
    Szarza: raw['Uderzenie'] / 10,
    Zdrowie: raw['Health'],
    AtakDyst: (raw['Atak dystansowy'] || 0) / 10,
  };
}

function hitPct(atk, obr, bonus = 0) {
  return Math.max(15, Math.min(75, 40 + atk - obr + bonus));
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

function sim(atk, def, seed = 42) {
  const rng = lcg(seed);
  let hpA = atk.Zdrowie;
  let hpD = def.Zdrowie;
  let round = 0;
  while (hpA > 0 && hpD > 0 && round < 500) {
    round++;
    const rA = rng() * 100;
    if (rA < hitPct(atk.Atak, def.Obrona)) {
      hpD -= dmgTw(atk.Obrazenia, def.Pancerz, atk.Przebicie);
    }
    if (hpD <= 0) break;
    const rD = rng() * 100;
    if (rD < hitPct(def.Atak, atk.Obrona)) {
      hpA -= dmgTw(def.Obrazenia, atk.Pancerz, def.Przebicie);
    }
  }
  return { round, hpA: Math.max(0, hpA), hpD: Math.max(0, hpD) };
}

const L = trueStats(H);
const Fa = trueStats(F);

console.log('=== RAW JSON (macierz 0-100) ===');
console.log('Legion Atak/Obrona:', H['Atak'], '/', H['Obrona']);
console.log('Falanga Atak/Obrona:', F['Atak'], '/', F['Obrona']);
console.log('');
console.log('=== PRAWDZIWE (÷10) — do modelu TW ===');
console.log('Legion:', L);
console.log('Falanga:', Fa);
console.log('');
console.log('=== TW Rome 2 (prawdziwe staty) ===');
const hLF = hitPct(L.Atak, Fa.Obrona);
const hFL = hitPct(Fa.Atak, L.Obrona);
const dLF = dmgTw(L.Obrazenia, Fa.Pancerz, L.Przebicie);
const dFL = dmgTw(Fa.Obrazenia, L.Pancerz, Fa.Przebicie);
console.log('Legion -> Falanga: hit', hLF + '%, dmg/traf', dLF);
console.log('Falanga -> Legion: hit', hFL + '%, dmg/traf', dFL);
console.log('E[dmg/tura]:', (hLF / 100) * dLF, 'vs', (hFL / 100) * dFL);
console.log('');
const b = sim(L, Fa);
console.log('=== SYMULACJA (seed=42, szarża off, bez pilum) ===');
console.log('Zwycięzca:', b.hpD <= 0 ? 'Legion' : 'Falanga');
console.log('Tura:', b.round, '| HP Legion:', b.hpA, '| HP Falanga:', b.hpD);
