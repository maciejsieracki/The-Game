'use strict';
/**
 * R-WEB-DIPLO-ALLIANCE-COUNT-MEASURE-Q1 -- liczenie sojuszy AI<->AI z wierszy JSONL runnera
 * (gra/tools/diplomacy-harder-measure-run.cjs). POMIAR: nic nie zapisuje poza stdout.
 * Zrodlo prawdy sojuszu = pole `pokoj` === 'sojusz' (activeDeals), NIE `status` (relacja moze zostac 'sojusz' bez umowy).
 * Uzycie: node allyclean-count-measure.cjs <plik.jsonl> [...]   (wynik: JSON na stdout)
 */
const fs = require('fs');

const TURY_RAPORT = [10, 20, 30, 40, 50, 60, 67];

function czytaj(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function klucz(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }

/** Zbior par AI<->AI z aktywnym sojuszem (activeDeals, pole pokoj). */
function sojuszeAI(row) {
  const s = new Set();
  for (const p of row.diplo.pairs) {
    if (p.aiAi && p.pokoj === 'sojusz') s.add(klucz(p.a, p.b));
  }
  return s;
}

function sojuszeZGraczem(row) {
  let n = 0;
  for (const p of row.diplo.pairs) if (!p.aiAi && p.pokoj === 'sojusz') n++;
  return n;
}

/** Maks. liczba sojuszy AI<->AI na jedna cywilizacje w turze. */
function maxNaCywilizacje(set) {
  const licz = new Map();
  for (const k of set) {
    const [a, b] = k.split('-').map(Number);
    licz.set(a, (licz.get(a) || 0) + 1);
    licz.set(b, (licz.get(b) || 0) + 1);
  }
  let m = 0;
  for (const v of licz.values()) m = Math.max(m, v);
  return m;
}

function analizuj(file) {
  const rows = czytaj(file).filter((r) => r.diplo && Array.isArray(r.diplo.pairs));
  rows.sort((x, y) => x.turn - y.turn);
  let nowe = 0, usuniete = 0, maxSojuszy = 0, maxNaCiv = 0, turyNaruszen = 0;
  let statusBezUmowy = 0, statusBezUmowyMax = 0;
  const raport = {};
  let poprzedni = null;
  for (const r of rows) {
    const s = sojuszeAI(r);
    maxSojuszy = Math.max(maxSojuszy, s.size);
    const mc = maxNaCywilizacje(s);
    maxNaCiv = Math.max(maxNaCiv, mc);
    if (mc > 2) turyNaruszen++;
    // status 'sojusz' bez aktywnej umowy (slad ALLY66)
    let bez = 0;
    for (const p of r.diplo.pairs) if (p.status === 'sojusz' && p.pokoj !== 'sojusz') bez++;
    statusBezUmowy += bez;
    statusBezUmowyMax = Math.max(statusBezUmowyMax, bez);
    if (poprzedni) {
      for (const k of s) if (!poprzedni.has(k)) nowe++;
      for (const k of poprzedni) if (!s.has(k)) usuniete++;
    }
    if (TURY_RAPORT.includes(r.turn)) {
      raport[r.turn] = { sojuszeAI: s.size, maxNaCywilizacje: mc, sojuszeZGraczem: sojuszeZGraczem(r), statusBezUmowy: bez };
    }
    poprzedni = s;
  }
  // podmiany (na parach kolejnych tur): para mialaa umowe w t-1, nie ma jej w t
  //  - podmianaPartnera: w tej samej turze jeden z uczestnikow dostaje nowego partnera
  //  - odnowienieW1Ture: umowa wraca w t+1 (okno jednej tury bez umowy)
  const tury = rows.map((r) => r.turn);
  const sety = new Map(rows.map((r) => [r.turn, sojuszeAI(r)]));
  let podmianyPartnera = 0, odnowienieW1Ture = 0;
  for (let i = 1; i < tury.length; i++) {
    if (tury[i] !== tury[i - 1] + 1) continue;
    const prev = sety.get(tury[i - 1]), cur = sety.get(tury[i]);
    const zniknelo = [...prev].filter((k) => !cur.has(k));
    const przybylo = [...cur].filter((k) => !prev.has(k));
    for (const k of zniknelo) {
      const [a, b] = k.split('-').map(Number);
      const zmiana = przybylo.some((n) => {
        const [c, d] = n.split('-').map(Number);
        return c === a || d === a || c === b || d === b;
      });
      if (zmiana) podmianyPartnera++;
      if (i + 1 < tury.length && sety.get(tury[i + 1]).has(k)) odnowienieW1Ture++;
    }
  }
  return {
    plik: file,
    tury: [tury[0], tury[tury.length - 1]],
    wiersze: rows.length,
    raportTury: raport,
    maxSojuszyAI: maxSojuszy,
    maxNaCywilizacje: maxNaCiv,
    turyNaruszeniaLimitu2: turyNaruszen,
    noweUmowy: nowe,
    usunieciaUmow: usuniete,
    podmianyPartnera,
    odnowienieW1Ture,
    statusSojuszBezUmowySuma: statusBezUmowy,
    statusSojuszBezUmowyMaxNaTurze: statusBezUmowyMax,
  };
}

if (require.main === module) {
  const wyniki = process.argv.slice(2).map(analizuj);
  process.stdout.write(JSON.stringify(wyniki, null, 1) + '\n');
}
module.exports = { analizuj, sojuszeAI };
