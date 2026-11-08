'use strict';
/**
 * siege-starvation-duration-test.cjs -- R-WEB-SIEGE-STARVATION-DURATION-REGRESS-Q1.
 * Regres: jednostka stojaca w obleganym miescie, ale BEZ flagi inGarnizon (Ufort.) albo zbudzona wypadem,
 * nie liczyla sie do garnizonu -> sciezka "bez garnizonu" -> poddanie po 2 turach.
 * Obroncy = KAZDA wojskowa jednostka wlasciciela na heksie miasta (siegeDefenderUnits).
 *  A. jednostkowa siegeDefenderUnits   B. symulacja N3 (realne moduly) -- czas trwania >= N, prognoza == poddanie (+-0)
 *  C. strukturalna main.ts (N3 + plakietka)   D. gracz / AI / panstwo-miasto (owner dowolny)
 * Run z gra/:  node tools/siege-starvation-duration-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d !== undefined ? ' -- ' + JSON.stringify(d) : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ssd-'));
function bundle(tag, modPath) {
  const out = path.join(tmp, tag + '-bundle.cjs');
  esbuild.buildSync({ entryPoints: [modPath], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA });
  return require(out);
}
const S = bundle('s', path.join(GRA, 'src', 'game', 'siege-starvation.ts'));
const FC = bundle('fc', path.join(GRA, 'src', 'game', 'siege-surrender-forecast.ts'));
const AS = bundle('as', path.join(GRA, 'src', 'game', 'army-starvation.ts'));
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const getMaxHp = () => 100;
const civ = (u) => u.civilian === true;
const mk = (id, owner, extra = {}) => ({ id, ownerId: owner, q: 3, r: 4, typeId: 'x', hp: 100, hpMax: 100, ...extra });

console.log('A. siegeDefenderUnits');
ok(typeof S.siegeDefenderUnits === 'function', 'funkcja istnieje');
if (typeof S.siegeDefenderUnits === 'function') {
  const city = { ownerId: 7, q: 3, r: 4 };
  const list = [
    mk('a', 7), mk('b', 7, { inGarnizon: true }), mk('c', 7, { inGarnizon: false }),
    mk('civ', 7, { civilian: true }), mk('foe', 1), mk('far', 7, { q: 9 }), mk('dead', 7, { hp: 0 }),
  ];
  const ids = S.siegeDefenderUnits(list, city, civ).map(u => u.id).sort().join(',');
  ok(ids === 'a,b,c', 'nieufortyfikowana i ufortyfikowana jednostka liczone; cywil/obcy/inny heks/martwa nie', ids);
}

/** Replika N3 (main.ts) z REALNYMI modulami; obroncy = siegeDefenderUnits (jak w main.ts); bez modulu = stary filtr inGarnizon. */
function simulate(units, city, hpFrac) {
  const c = { oblegane: true, ...city };
  const all = units.map(u => ({ ...u }));
  const defenders = () => (S.siegeDefenderUnits ? S.siegeDefenderUnits(all, c, civ) : all.filter(u => u.inGarnizon === true));
  const forecast0 = FC.turnsUntilSiegeSurrender(
    { ...c, garnizon: all.filter(u => u.inGarnizon === true).length },
    { food: c.magazynZywnosci, hpFrac, garrison: defenders().map(u => ({ hp: u.hp, hpMax: u.hpMax })) });
  for (let t = 1; t <= 400; t++) {
    const garnCount = all.filter(u => u.inGarnizon === true).length;            // turn-economy.ts: city.garnizon
    c.magazynZywnosci = Math.max(0, c.magazynZywnosci - (c.population + garnCount));
    const params = { food: c.magazynZywnosci, getMaxHp };
    const st0 = S.siegeStarvationState(c, defenders(), params);
    let surrender = st0.surrender;
    if (st0.recordStart) c.siegeStarveStartMaxHp = st0.startMaxHp;
    else if (st0.applyAttrition && !st0.surrender) {
      const r = AS.applyArmyStarvationHpLoss(defenders(), c.ownerId, hpFrac, getMaxHp);
      for (let i = all.length - 1; i >= 0; i--) if (r.destroyedIds.includes(all[i].id)) all.splice(i, 1);
      surrender = S.siegeStarvationState(c, defenders(), params).surrender;
    }
    if (st0.setLegacyPending) c.siegeCapitulationPending = true;
    if (surrender) return { tick: t, forecast0 };
  }
  return { tick: null, forecast0 };
}

console.log('B. czas trwania: 3 jednostki (bez fortyfikacji / ufortyfikowane), zapasy 10, ludnosc 5');
for (const [name, extra] of [['bez flagi (stoja w miescie)', { inGarnizon: false }], ['ufortyfikowane', { inGarnizon: true }]]) {
  for (const [diff, frac] of [['latwy', 0.06], ['normalny', 0.08], ['trudny', 0.10]]) {
    const units = [mk('u1', 7, extra), mk('u2', 7, extra), mk('u3', 7, extra)];
    const city = { ownerId: 7, q: 3, r: 4, population: 5, magazynZywnosci: 10 };
    const r = simulate(units, city, frac);
    // pierwszy tick zera zapasow zapisuje start (bez atrycji), potem k tickow atrycji: k = floor(0.5/frac)+1
    const k = Math.floor(0.5 / frac + 1e-9) + 1;
    const stockTurns = extra.inGarnizon ? Math.ceil(10 / (5 + 3)) : Math.ceil(10 / 5);
    const expected = stockTurns + k;
    ok(r.tick !== null && r.tick >= 7, name + ' / ' + diff + ': poddanie w turze ' + r.tick + ' (>= 7, nie 2)', r);
    ok(r.tick === expected, name + ' / ' + diff + ': dokladnie ' + expected + ' tur (zapasy ' + stockTurns + ' + glod ' + k + ')', r);
    ok(r.forecast0 === r.tick, name + ' / ' + diff + ': prognoza plakietki (' + r.forecast0 + ') == faktyczne poddanie (' + r.tick + ')', r);
  }
}

console.log('D. miasto bez zadnej jednostki: sciezka historyczna (2 tury po zerze zapasow)');
{
  const r = simulate([], { ownerId: 7, q: 3, r: 4, population: 5, magazynZywnosci: 0 }, 0.08);
  ok(r.tick === 2 && r.forecast0 === 2, 'brak obroncow -> 2 tury, prognoza 2', r);
}
console.log('D. wlasciciel dowolny (gracz 0 / AI 3 / panstwo-miasto 9)');
for (const owner of [0, 3, 9]) {
  const units = [mk('u1', owner), mk('u2', owner, { inGarnizon: true })];
  const r = simulate(units, { ownerId: owner, q: 3, r: 4, population: 4, magazynZywnosci: 8 }, 0.08);
  ok(r.tick !== null && r.tick >= 7 && r.forecast0 === r.tick, 'owner ' + owner + ': ' + r.tick + ' tur, prognoza == faktyczne', r);
}

console.log('C. strukturalna main.ts');
const i3 = main.indexOf('N3: TURA OBLEZENIA');
const n3 = main.slice(i3, i3 + 4000);
ok(/siegeDefenderUnits\(units, oblCity, isCivilianUnit\)/.test(n3), 'N3: obroncy przez siegeDefenderUnits');
ok(!/realGarnizonUnits = units\.filter/.test(n3), 'N3: brak filtra tylko-inGarnizon');
const ib = main.indexOf('function siegeSurrenderBadgeFor');
const badge = main.slice(ib, ib + 1800);
ok(/siegeDefenderUnits\(units, city, isCivilianUnit\)/.test(badge) && !/inGarnizon === true/.test(badge), 'plakietka: obroncy przez siegeDefenderUnits (ten sam zbior co N3)');

console.log('RESULT pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);
