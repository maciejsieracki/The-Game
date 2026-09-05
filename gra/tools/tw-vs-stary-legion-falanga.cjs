'use strict';
/**
 * Legion (Hastati) ATK vs Falanga — cios za cios.
 * Parametry z units.json po korekcie: Atak÷10, Obrona÷2 (200%), dmg-staty÷10, HP 1:1.
 * Nowy system: TW Rome 2 hit + dmg TW v3.
 * Stary: resolveCombat macierz v2 (porównanie).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');

// --- konwersja statów gry → wartości do TW ---
function fromGame(raw) {
  return {
    name: raw['Jednostka'],
    Atak: raw['Atak'] / 10,
    Obrona: raw['Obrona'] / 2, // korekta 200%
    Obrazenia: raw['Obrażenia'] / 10,
    Przebicie: raw['Przebicie'] / 10,
    Pancerz: raw['Pancerz'] / 10,
    Szarza: raw['Uderzenie'] / 10,
    Zdrowie: raw['Health'],
    AtakDyst: (raw['Atak dystansowy'] || 0) / 10,
    Pociski: raw['Ilość pocisków'] || 0,
  };
}

const HIT_BASE = 40;
const HIT_MIN = 15;
const HIT_MAX = 75;

function hitTw(atk, obr, bonus = 0) {
  return Math.max(HIT_MIN, Math.min(HIT_MAX, HIT_BASE + atk - obr + bonus));
}
function dmgTw(obraz, panc, przeb, charge = 0) {
  return Math.max(0, obraz - panc) + przeb + charge;
}
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function simTw(atk, def, opts = {}) {
  const chargeNeg = opts.chargeNegated !== false;
  const rng = lcg(opts.seed ?? 42);
  let hpA = atk.Zdrowie;
  let hpD = def.Zdrowie;
  let round = 0;
  const log = [];
  let meleeRound = 0;

  const pociski = typeof atk.Pociski === 'number' ? atk.Pociski : parseInt(String(atk.Pociski), 10) || 0;
  if (atk.AtakDyst > 0 && pociski > 0) {
    log.push('--- pilum ---');
    for (let i = 0; i < pociski && hpD > 0; i++) {
      round++;
      const h = hitTw(atk.Atak, def.Obrona);
      const r = rng() * 100;
      if (r < h) {
        const d = dmgTw(atk.AtakDyst, def.Pancerz, 0);
        hpD -= d;
        log.push(`R${round} ${atk.name} pilum TRAF ${r.toFixed(1)}<${h.toFixed(1)}% dmg=${d.toFixed(1)} → ${def.name} HP=${Math.max(0, hpD).toFixed(1)}`);
      } else {
        log.push(`R${round} ${atk.name} pilum CHYB ${r.toFixed(1)}>=${h.toFixed(1)}%`);
      }
    }
  }

  log.push('--- zwarcie (szarża ' + (chargeNeg ? 'OFF' : 'ON') + ') ---');
  while (hpA > 0 && hpD > 0 && round < 500) {
    round++;
    meleeRound++;
    const isR1 = meleeRound === 1;
    const cHit = !chargeNeg && isR1 ? atk.Szarza : 0;
    const cDmg = !chargeNeg && isR1 ? atk.Szarza : 0;

    const hA = hitTw(atk.Atak, def.Obrona, cHit);
    const rA = rng() * 100;
    if (rA < hA) {
      const d = dmgTw(atk.Obrazenia, def.Pancerz, atk.Przebicie, cDmg);
      hpD -= d;
      log.push(
        `R${round} ${atk.name} TRAF ${rA.toFixed(1)}<${hA.toFixed(1)}% dmg=${d.toFixed(1)} → ${def.name} HP=${Math.max(0, hpD).toFixed(1)}`,
      );
    } else {
      log.push(`R${round} ${atk.name} CHYB ${rA.toFixed(1)}>=${hA.toFixed(1)}%`);
    }
    if (hpD <= 0) break;

    const hD = hitTw(def.Atak, atk.Obrona, 0);
    const rD = rng() * 100;
    if (rD < hD) {
      const d = dmgTw(def.Obrazenia, atk.Pancerz, def.Przebicie);
      hpA -= d;
      log.push(
        `R${round} ${def.name} TRAF ${rD.toFixed(1)}<${hD.toFixed(1)}% dmg=${d.toFixed(1)} → ${atk.name} HP=${Math.max(0, hpA).toFixed(1)}`,
      );
    } else {
      log.push(`R${round} ${def.name} CHYB ${rD.toFixed(1)}>=${hD.toFixed(1)}%`);
    }
  }

  return {
    winner: hpD <= 0 ? atk.name : hpA <= 0 ? def.name : 'remis',
    round,
    hpA: Math.max(0, hpA),
    hpD: Math.max(0, hpD),
    log,
  };
}

// --- stary silnik ---
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
const BUNDLE = path.join(os.tmpdir(), `combat-bundle-lf-${TMPDIR_RUN_ID}.cjs`);
const esbuild = path.join(GRA, 'node_modules', '.bin', 'esbuild');
execSync(
  `"${esbuild}" "${path.join(GRA, 'src/game/combat.ts')}" --bundle --platform=node --format=cjs --outfile="${BUNDLE}"`,
  { stdio: 'pipe' },
);
const { resolveCombat } = require(BUNDLE);
const unitsRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const countersRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/counters.json'), 'utf8'));
const terrainRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-combat.json'), 'utf8'));

function adaptUnit(raw) {
  return {
    typNazwa: raw['Jednostka'],
    rola: raw['Rola (linia)'],
    Atak: raw['Atak'],
    Obrazenia: raw['Obrażenia'],
    Obrona: raw['Obrona'],
    Uderzenie: raw['Uderzenie'],
    Pancerz: raw['Pancerz'],
    Przebicie: raw['Przebicie'],
    Health: raw['Health'],
    'Prog dezercji (% health)': raw['Próg dezercji (% health)'],
    'Atak dystansowy': raw['Atak dystansowy'] || 0,
    'Ilosc pociskow': raw['Ilość pocisków'] || '—',
    'Kara obrony z flanki (%)': raw['Kara obrony z flanki (%)'],
    'Kara obrony z tyłu (%)': raw['Kara obrony z tyłu (%)'],
  };
}

const H = unitsRaw.find((u) => u['Jednostka'] === 'Hastati');
const F = unitsRaw.find((u) => u['Jednostka'] === 'Falanga');
const legion = fromGame(H);
const falanga = fromGame(F);

const tw = simTw(legion, falanga, { seed: 42, chargeNegated: true });
const old = resolveCombat(adaptUnit(H), adaptUnit(F), {
  defenderTerrain: 'Płaskie',
  terrainData: terrainRaw.map((t) => ({
    Teren: t['Teren'],
    'Bonus Obrona': t['Bonus Obrona'],
    'Delta Zasieg (dystansowi)': t['Δ Zasięg (dystansowi)'],
    'Efekt specjalny': t['Efekt specjalny'],
  })),
  counters: countersRaw.map((c) => ({
    'Typ atakujacy': c['Typ atakujący'],
    'Cel (typ)': c['Cel (typ)'],
    Bonus: c['Bonus'],
    'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'],
    Status: c['Status'],
  })),
  rng: lcg(42),
  attackerMoved: true,
  attackerPosition: 'front',
});

console.log('=== PARAMETRY (JSON: Atak÷10, Obrona÷2, dmg÷10, HP 1:1) ===');
console.log('Legion:', legion);
console.log('Falanga:', falanga);
console.log('');
console.log('=== CIOS ZA CIOS (TW Rome 2 + dmg v3) ===');
console.log(
  `Legion→Falanga: hit ${hitTw(legion.Atak, falanga.Obrona).toFixed(1)}% dmg/traf ${dmgTw(legion.Obrazenia, falanga.Pancerz, legion.Przebicie).toFixed(1)}`,
);
console.log(
  `Falanga→Legion: hit ${hitTw(falanga.Atak, legion.Obrona).toFixed(1)}% dmg/traf ${dmgTw(falanga.Obrazenia, legion.Pancerz, falanga.Przebicie).toFixed(1)}`,
);
console.log('');
console.log(`WYNIK TW: ${tw.winner} | tura ${tw.round} | HP ${tw.hpA.toFixed(1)} / ${tw.hpD.toFixed(1)}`);
console.log('');
tw.log.forEach((l) => console.log(l));
console.log('');
console.log('=== STARY silnik (macierz v2, surowy JSON) ===');
console.log(
  `WYNIK: ${old.winner} | tura ${old.rounds} | HP ${old.attackerHpLeft} / ${old.defenderHpLeft}${old.routed.length ? ' routed=' + old.routed.join(',') : ''}`,
);
