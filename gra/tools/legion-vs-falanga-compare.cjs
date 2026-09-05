'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
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
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const BUNDLE = path.join(os.tmpdir(), `combat-bundle-legion-${TMPDIR_RUN_ID}.cjs`);
const esbuild = path.join(GRA, 'node_modules', '.bin', 'esbuild');
execSync(`"${esbuild}" "${path.join(GRA, 'src/game/combat.ts')}" --bundle --platform=node --format=cjs --outfile="${BUNDLE}"`, { stdio: 'pipe' });

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

function adaptCounters(raw) {
  return raw.map((c) => ({
    'Typ atakujacy': c['Typ atakujący'],
    'Cel (typ)': c['Cel (typ)'],
    Bonus: c['Bonus'],
    'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'],
    Status: c['Status'],
  }));
}

function adaptTerrain(raw) {
  return raw.map((t) => ({
    Teren: t['Teren'],
    'Bonus Obrona': t['Bonus Obrona'],
    'Delta Zasieg (dystansowi)': t['Δ Zasięg (dystansowi)'],
    'Efekt specjalny': t['Efekt specjalny'],
  }));
}

const H = adaptUnit(unitsRaw.find((u) => u['Jednostka'] === 'Hastati'));
const F = adaptUnit(unitsRaw.find((u) => u['Jednostka'] === 'Falanga'));
const counters = adaptCounters(countersRaw);
const terrainData = adaptTerrain(terrainRaw);

function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// STARY: silnik macierz v2 (resolveCombat)
const old = resolveCombat(H, F, {
  defenderTerrain: 'Płaskie',
  terrainData,
  counters,
  rng: lcg(42),
  attackerMoved: true,
  attackerPosition: 'front',
});

// TOTAL WAR v3 — Legion ATK, Falanga DEF, płasko, szarża zanegowana
const L = { Atak: 9, Obrona: 7, Obrazenia: 10, Przebicie: 4, Pancerz: 9, Zdrowie: 75 };
const P = { Atak: 5, Obrona: 10, Obrazenia: 5, Przebicie: 2, Pancerz: 8, Zdrowie: 100 };

function hitTW(a, d) {
  return Math.max(10, Math.min(95, 50 + (a - d) * 5));
}
function dmgTW(ob, pa, pr) {
  return Math.max(0, ob - pa) + pr;
}

let hpL = L.Zdrowie;
let hpP = P.Zdrowie;
let twRound = 0;
let twWinner = null;
const rng2 = lcg(42);

while (hpL > 0 && hpP > 0 && twRound < 500) {
  twRound++;
  if (rng2() * 100 < hitTW(L.Atak, P.Obrona)) {
    hpP -= dmgTW(L.Obrazenia, P.Pancerz, L.Przebicie);
  }
  if (hpP <= 0) {
    twWinner = 'Legion';
    break;
  }
  if (rng2() * 100 < hitTW(P.Atak, L.Obrona)) {
    hpL -= dmgTW(P.Obrazenia, L.Pancerz, P.Przebicie);
  }
  if (hpL <= 0) {
    twWinner = 'Falanga';
    break;
  }
}

console.log('STARY SYSTEM (resolveCombat, seed=42)');
console.log('  Zwycięzca:', old.winner === 'attacker' ? 'Legion' : old.winner === 'defender' ? 'Falanga' : 'remis');
console.log('  Tura:', old.rounds);
console.log('  HP Legion po bitwie:', old.attackerHpLeft);
console.log('  HP Falanga po bitwie:', old.defenderHpLeft);
console.log('');
console.log('TOTAL WAR v3 (propozycja statów, seed=42)');
console.log('  Zwycięzca:', twWinner);
console.log('  Tura:', twRound);
console.log('  HP Legion po bitwie:', Math.max(0, hpL));
console.log('  HP Falanga po bitwie:', Math.max(0, hpP));
