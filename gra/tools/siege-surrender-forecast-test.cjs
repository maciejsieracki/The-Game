'use strict';
/**
 * siege-surrender-forecast-test.cjs -- R-WEB-SIEGE-BADGE-TURNS-TO-SURRENDER-Q1.
 * Plakietka oblezenia ZAWSZE pokazuje liczbe tur do poddania sie miasta.
 *  A. JEDNOSTKOWA (realny src/game/siege-surrender-forecast.ts, esbuild): wartosci, odmiana PL, null.
 *  B. SYMULACJA ticków (odwzorowanie turn-economy.ts + handleSiegeCapitulationPhase) vs prognoza --
 *     scenariusze zapasy 10/5/1/0, rozne zuzycie (ludnosc, garnizon), pending, spichlerz wypelniony.
 *  C. STRUKTURALNA: wzory w turn-economy.ts / main.ts nadal takie jak zakladane (strażnik dryfu) + wpiecie plakietki.
 *  D. MUTACJE kopii modulu -- kazda musi wywrocic A/B.  E. ZAPIS/ODCZYT (JSON) nie zmienia prognozy.
 * Run z gra/:  node tools/siege-surrender-forecast-test.cjs
 * RED (modul nieobecny): SIEGE_FORECAST_MODULE=/nie/istnieje node tools/siege-surrender-forecast-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d !== undefined ? ' -- ' + JSON.stringify(d) : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ssf-'));

function bundle(tag, modPath) {
  const out = path.join(tmp, tag + '-bundle.cjs');
  esbuild.buildSync({ entryPoints: [modPath], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA });
  return require(out);
}
const REAL = process.env.SIEGE_FORECAST_MODULE || path.join(GRA, 'src', 'game', 'siege-surrender-forecast.ts');
if (!fs.existsSync(REAL)) {
  console.log('  [FAIL] modul prognozy nie istnieje: ' + REAL);
  console.log('RESULT pass=0 fail=1'); process.exit(1);
}
const F = bundle('real', REAL);

/** Odwzorowanie mechanizmu: tick ekonomii + faza kapitulacji; zwraca numer konca tury, w ktorym miasto przejete (albo null po limit). */
function simulate(c, limit = 500) {
  const city = { ...c };
  for (let t = 1; t <= limit; t++) {
    const garn = city.garnizon != null && city.garnizon > 0 ? city.garnizon : 0;
    const zuzycie = city.population + garn;
    city.magazynZywnosci = Math.max(0, (city.magazynZywnosci ?? 0) - zuzycie); // turn-economy.ts (oblegane)
    const glod = city.magazynZywnosci <= 0;
    if (glod) {                       // main.ts: if (tick.obleganyGlod) handleSiegeCapitulationPhase
      if (city.siegeCapitulationPending) return t; // resolveSiegeSurrender
      city.siegeCapitulationPending = true;
    } else if (city.siegeCapitulationPending) {    // else if (pending) resolveSiegeSurrender
      return t;
    }
  }
  return null;
}
const mk = (food, pop, garnizon, pending = false) => ({ oblegane: true, population: pop, garnizon, magazynZywnosci: food, siegeCapitulationPending: pending });

console.log('A. jednostkowa');
ok(F.turnsUntilSiegeSurrender(mk(10, 5, 0)) === 3, 'zapasy 10, zuzycie 5 -> 3 tury (2 do wyzerowania + 1 przejecie)');
ok(F.turnsUntilSiegeSurrender(mk(5, 5, 0)) === 2, 'zapasy 5, zuzycie 5 -> 2');
ok(F.turnsUntilSiegeSurrender(mk(1, 9, 3)) === 2, 'zapasy 1, zuzycie 12 -> 2');
ok(F.turnsUntilSiegeSurrender(mk(0, 9, 0)) === 2, 'zapasy 0 (pending jeszcze nie) -> 2');
ok(F.turnsUntilSiegeSurrender(mk(0, 9, 0, true)) === 1, 'pending -> 1');
ok(F.turnsUntilSiegeSurrender(mk(999, 9, 0, true)) === 1, 'pending z zapasami -> 1 (zgodnie z main.ts)');
ok(F.turnsUntilSiegeSurrender({ oblegane: false, population: 5, magazynZywnosci: 3 }) === null, 'nie oblezone -> null');
ok(F.turnsUntilSiegeSurrender({ oblegane: true, population: 0, garnizon: 0, magazynZywnosci: 5 }) === null, 'zuzycie 0 i zapasy>0 -> null (brak bledu)');
ok(F.turnsUntilSiegeSurrender({ oblegane: true, population: 4 }) === 2, 'brak pola magazynu -> traktowane jak 0');
ok(F.turnsUntilSiegeSurrender(mk(NaN, 4, 0)) === 2, 'NaN zapasow -> bez bledu (0)');
ok(F.turnsUntilSiegeSurrender(mk(1, 4, 0), { food: 20 }) === 6, 'ctx.food nadpisuje zapasy (20/4=5 +1)');
ok(F.turnsUntilSiegeSurrender(mk(1000, 9, 0)) === 113, 'pelny spichlerz 1000/9 -> 113, bez bledu');
ok(F.siegeConsumptionPerTurn({ population: 9, garnizon: 3 }) === 12 && F.siegeConsumptionPerTurn({ population: 9 }) === 9, 'zuzycie = ludnosc + garnizon');
const pl = (n) => F.siegeSurrenderBadgeText(n);
ok(pl(1) === 'poddanie za 1 turę', 'PL 1', pl(1));
for (const n of [2, 3, 4, 22, 23, 24, 102]) ok(pl(n) === 'poddanie za ' + n + ' tury', 'PL ' + n + ' tury', pl(n));
for (const n of [5, 11, 12, 13, 14, 15, 20, 21, 25, 100, 111]) ok(pl(n) === 'poddanie za ' + n + ' tur', 'PL ' + n + ' tur', pl(n));
ok(pl(null) === 'poddanie: —', 'PL null -> myslnik');
ok(/zużycie 12\/turę/.test(F.siegeSurrenderTooltip(3, 20, 12)) && /3 tury/.test(F.siegeSurrenderTooltip(3, 20, 12)), 'tooltip wyjasnia liczbe i zuzycie');
ok(/nie maleją/.test(F.siegeSurrenderTooltip(null, 5, 0)), 'tooltip null');

console.log('B. symulacja ticków vs prognoza');
let simN = 0, simBad = [];
for (const food of [0, 1, 5, 10, 11, 49, 50, 51, 200]) {
  for (const pop of [1, 3, 5, 9, 12]) {
    for (const garn of [0, 1, 4, 10]) {
      for (const pending of [false, true]) {
        const c = mk(food, pop, garn, pending);
        const sim = simulate(c), fc = F.turnsUntilSiegeSurrender(c);
        simN++;
        if (sim !== fc) simBad.push({ food, pop, garn, pending, sim, fc });
      }
    }
  }
}
ok(simBad.length === 0, 'prognoza == symulacja dla ' + simN + ' scenariuszy (zapasy x ludnosc x garnizon x pending)', simBad.slice(0, 3));
// wielu oblegajacych nie zmienia zuzycia oblezonego miasta (zuzycie = ludnosc + garnizon obroncow)
ok(F.turnsUntilSiegeSurrender({ ...mk(10, 5, 0), oblegajacyOwnerId: 3 }) === simulate(mk(10, 5, 0)), 'liczba/wlasciciel oblegajacych nie wplywa na wynik (zgodnie z turn-economy.ts)');
// odliczanie co tura maleje o 1 az do 1
{ let c = mk(23, 4, 1); let prev = F.turnsUntilSiegeSurrender(c), mono = true, steps = 0;
  while (prev > 1 && steps < 50) { c = { ...c, magazynZywnosci: Math.max(0, c.magazynZywnosci - 5) }; if (c.magazynZywnosci <= 0) c.siegeCapitulationPending = true; const n = F.turnsUntilSiegeSurrender(c); if (n !== prev - 1) mono = false; prev = n; steps++; }
  ok(mono && prev === 1, 'licznik maleje o 1 na ture az do 1 (i konczy na 1 = "w tej turze oblezenia")'); }

console.log('C. strukturalna (straznik dryfu mechanizmu + wpiecie)');
const eco = fs.readFileSync(path.join(GRA, 'src/game/turn-economy.ts'), 'utf8');
const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
ok(/const zuzycie = city\.population \+ garnizon;[\s\S]{0,200}magazynPoTurze = Math\.max\(0, magazynPrzed - zuzycie\);[\s\S]{0,80}obleganyGlod = magazynPoTurze <= 0;/.test(eco), 'turn-economy.ts: zuzycie = ludnosc + garnizon, podloga 0, glod gdy <= 0');
const phase = main.slice(main.indexOf('function handleSiegeCapitulationPhase'), main.indexOf('function handleSiegeCapitulationPhase') + 700);
ok(/if \(city\.siegeCapitulationPending\) \{\s*resolveSiegeSurrender\(city\.id\);\s*return;\s*\}\s*if \(getCityFood\(city\) <= 0\) \{\s*city\.siegeCapitulationPending = true;/.test(phase), 'main.ts: faza kapitulacji (pending -> przejecie; zapasy<=0 -> pending)');
ok(/import \{[^}]*turnsUntilSiegeSurrender[^}]*\} from '\.\/game\/siege-surrender-forecast'/.test(main), 'main.ts importuje prognoze');
ok(/siegeSurrenderBadgeFor\(city\)/.test(main) && /civ-siege-surrender/.test(main) && /data-siege-surrender/.test(main), 'plakietka: element licznika w etykiecie oblezenia');
const upd = main.slice(main.indexOf('function updateSiegeHtmlLabels'), main.indexOf('function updateSiegeHtmlLabels') + 900);
ok(/siegeSurrenderBadgeFor\(sc\)/.test(upd), 'licznik odswiezany w petli etykiet (co klatke, tylko przy zmianie tekstu)');
const refreshFn = main.slice(main.indexOf('function refreshSiegeHtmlLabels'), main.indexOf('function refreshSiegeHtmlLabels') + 1800);
ok(/if \(!city\.oblegane\) continue;/.test(refreshFn), 'widocznosc: te same zasady co dotychczasowa plakietka (kazde city.oblegane, wlasne i wroga)');
ok(!/siegeCapitulationPending\s*=(?!=)/.test(fs.readFileSync(REAL, 'utf8')), 'modul prognozy nie zapisuje stanu kapitulacji');

console.log('D. mutacje');
const src = fs.readFileSync(REAL, 'utf8');
const muts = [
  ['bez +1 przejecia', s => s.replace('Math.ceil(food / cons) + 1', 'Math.ceil(food / cons)')],
  ['floor zamiast ceil', s => s.replace('Math.ceil(food / cons)', 'Math.floor(food / cons)')],
  ['pending -> 0', s => s.replace('return 1;\n  const raw', 'return 0;\n  const raw')],
  ['zapasy 0 -> 1', s => s.replace('if (food <= 0) return 2;', 'if (food <= 0) return 1;')],
  ['bez garnizonu w zuzyciu', s => s.replace('return city.population + garnizon;', 'return city.population;')],
  ['odmiana 2-4 -> tur', s => s.replace("m10 >= 2 && m10 <= 4", "m10 >= 5 && m10 <= 4")],
  ['12-14 jak 2-4', s => s.replace('(m100 < 12 || m100 > 14)', 'true')],
  ['brak null dla zuzycia 0', s => s.replace('if (!(cons > 0)) return null;', '')],
];
for (const [name, fn] of muts) {
  const mp = path.join(tmp, 'mut.ts'); const m = fn(src);
  if (m === src) { ok(false, 'mutacja "' + name + '" nie zmienila zrodla'); continue; }
  fs.writeFileSync(mp, m);
  let killed = false;
  try {
    const M = bundle('mut' + Math.random().toString(36).slice(2), mp);
    const probes = [
      M.turnsUntilSiegeSurrender(mk(10, 5, 0)) === 3, M.turnsUntilSiegeSurrender(mk(11, 5, 0)) === 4, M.turnsUntilSiegeSurrender(mk(10, 3, 2)) === 3,
      M.turnsUntilSiegeSurrender(mk(0, 9, 0)) === 2, M.turnsUntilSiegeSurrender(mk(0, 9, 0, true)) === 1,
      M.turnsUntilSiegeSurrender({ oblegane: true, population: 0, magazynZywnosci: 5 }) === null,
      M.siegeSurrenderBadgeText(3) === 'poddanie za 3 tury', M.siegeSurrenderBadgeText(12) === 'poddanie za 12 tur',
      M.siegeSurrenderBadgeText(24) === 'poddanie za 24 tury',
    ];
    killed = probes.some(p => !p);
  } catch { killed = true; }
  ok(killed, 'mutacja "' + name + '" wywraca testy');
}

console.log('E. zapis/odczyt');
{ const c = mk(14, 4, 2); const rt = JSON.parse(JSON.stringify(c));
  ok(F.turnsUntilSiegeSurrender(rt) === F.turnsUntilSiegeSurrender(c), 'prognoza po JSON round-trip identyczna');
  const rp = JSON.parse(JSON.stringify(mk(0, 4, 0, true)));
  ok(F.turnsUntilSiegeSurrender(rp) === 1, 'pending przezywa zapis (cities.ts: siegeCapitulationPending persystowane)'); }
const cit = fs.readFileSync(path.join(GRA, 'src/game/cities.ts'), 'utf8');
ok(/siegeCapitulationPending\?: boolean;/.test(cit), 'cities.ts: pole siegeCapitulationPending w modelu (zapis)');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('RESULT pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);
