'use strict';
/**
 * siege-surrender-enter-city-test.cjs -- R-WEB-SIEGE-SURRENDER-ENTER-CITY-Q1.
 *  A. JEDNOSTKOWA (realne src/game/siege-enter-city.ts, esbuild): RED = stan sprzed tematu
 *     (brak wywolania => jednostka pod miastem), GREEN = enterCityAfterSurrender.
 *  B. MUTACJE kopii modulu -- kazda musi wywrocic A.
 *  C. STRUKTURALNA main.ts: wywolanie w resolveSiegeSurrender PO zmianie wlasciciela i usunieciu
 *     obroncow, PRZED endMapSiege; import.
 * Run z gra/:  node tools/siege-surrender-enter-city-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ssec-'));
const SRC = path.join(GRA, 'src', 'game', 'siege-enter-city.ts');

function build(tag, text) {
  const f = path.join(tmp, tag + '.ts'), out = path.join(tmp, tag + '.cjs');
  fs.writeFileSync(f, text);
  esbuild.buildSync({ entryPoints: [f], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error' });
  return require(out);
}
const real = build('real', fs.readFileSync(SRC, 'utf8'));
function mutated(tag, from, to) {
  const t = fs.readFileSync(SRC, 'utf8');
  if (!t.includes(from)) throw new Error('mutacja nie znalazla: ' + from);
  return build(tag, t.replace(from, to));
}

const CIV = new Set(['Osadnik', 'Robotnik', 'Zwiadowca']);
const deps = { isCivilian: u => CIV.has(u.typeId) };
const city = { id: 'c1', q: 2, r: 0 };
const U = (id, owner, q, r, extra) => Object.assign({ id, ownerId: owner, typeId: 'Wojownik', category: 'miecznik', q, r, oblegaCityId: 'c1' }, extra || {});
const pos = (units, id) => { const u = units.find(x => x.id === id); return u.q + ',' + u.r; };
const CITY = '2,0';

function scenarioSingle(owner) { return [U('a', owner, 3, 0)]; }

console.log('A. jednostkowa');
// RED: bez wejscia (stan sprzed tematu) jednostka stoi pod miastem
{
  const u = scenarioSingle(0);
  ok(pos(u, 'a') === '3,0', 'RED: bez enterCityAfterSurrender jednostka stoi pod miastem (3,0)');
}
for (const [label, owner] of [['gracz', 0], ['AI', 2], ['barbarzynca', -1]]) {
  const u = scenarioSingle(owner);
  const moved = real.enterCityAfterSurrender(u, city, owner, deps);
  ok(pos(u, 'a') === CITY && moved.length === 1, `GREEN ${label}: jednostka wchodzi na heks miasta`);
}
// zdjecie inGarnizon / fortyfikacji polowej, ruchLeft bez zmian
{
  const u = [U('a', 0, 3, 0, { inGarnizon: true, ufortyfikowanyWPolu: true, ruchLeft: 0 })];
  real.enterCityAfterSurrender(u, city, 0, deps);
  ok(u[0].inGarnizon === undefined && u[0].ufortyfikowanyWPolu === undefined && u[0].ruchLeft === 0, 'zdjete inGarnizon/ufortyfikowanyWPolu, ruchLeft bez zmian');
}
// wiele stosow: najwiekszy wchodzi, reszta zostaje
{
  const u = [U('a1', 0, 3, 0), U('a2', 0, 3, 0), U('b1', 0, 2, 1)];
  real.enterCityAfterSurrender(u, city, 0, deps);
  ok(pos(u, 'a1') === CITY && pos(u, 'a2') === CITY && pos(u, 'b1') === '2,1', 'wiele stosow: wchodzi najwiekszy, drugi zostaje');
}
// remis: general wygrywa, potem najmniejsze id
{
  const u = [U('z1', 0, 3, 0), U('g1', 0, 2, 1, { isGeneral: true })];
  real.enterCityAfterSurrender(u, city, 0, deps);
  ok(pos(u, 'g1') === CITY && pos(u, 'z1') === '3,0', 'remis: stos z generalem wchodzi');
  const v = [U('m2', 0, 3, 0), U('k1', 0, 2, 1)];
  real.enterCityAfterSurrender(v, city, 0, deps);
  ok(pos(v, 'k1') === CITY && pos(v, 'm2') === '3,0', 'remis: najmniejsze id (deterministycznie)');
  const w = [U('k1', 0, 2, 1), U('m2', 0, 3, 0)];
  real.enterCityAfterSurrender(w, city, 0, deps);
  ok(pos(w, 'k1') === CITY, 'kolejnosc tablicy nie ma znaczenia');
}
// cywile i zaokretowane zostaja; machiny (niecywilne) wchodza
{
  const u = [U('w', 0, 3, 0), U('s', 0, 3, 0, { typeId: 'Osadnik' }), U('e', 0, 3, 0, { embarked: true }), U('t', 0, 3, 0, { typeId: 'Taran', category: 'oblezenie' })];
  real.enterCityAfterSurrender(u, city, 0, deps);
  ok(pos(u, 'w') === CITY && pos(u, 't') === CITY, 'wojownik i machina wchodza');
  ok(pos(u, 's') === '3,0' && pos(u, 'e') === '3,0', 'cywil i zaokretowany zostaja');
}
// jednostka bez oblegaCityId / z innego miasta nie wchodzi; cudza nie wchodzi
{
  const u = [U('x', 0, 3, 0, { oblegaCityId: 'c2' }), U('y', 0, 3, 0, { oblegaCityId: undefined }), U('z', 5, 3, 0)];
  real.enterCityAfterSurrender(u, city, 0, deps);
  ok(u.every(x => x.q === 3), 'nie-oblegajace / cudze nie wchodza');
}
// Z4: obca jednostka na heksie miasta blokuje
{
  const u = [U('a', 0, 3, 0), U('foe', 7, 2, 0, { oblegaCityId: undefined })];
  const moved = real.enterCityAfterSurrender(u, city, 0, deps);
  ok(moved.length === 0 && pos(u, 'a') === '3,0', 'obca jednostka w miescie => nikt nie wchodzi');
}
// determinizm
{
  const mk = () => [U('a2', 0, 3, 0), U('a1', 0, 3, 0), U('b', 0, 2, 1)];
  const p1 = JSON.stringify(real.planSurrenderEntry(mk(), city, 0, deps));
  const p2 = JSON.stringify(real.planSurrenderEntry(mk().reverse(), city, 0, deps));
  ok(p1 === p2 && p1 === '["a1","a2"]', 'plan deterministyczny', p1 + ' vs ' + p2);
}

console.log('B. mutacje');
const battery = (m) => {
  try {
    const r = [];
    let u = [U('a', 0, 3, 0)]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'a') === CITY);
    u = [U('a1', 0, 3, 0), U('a2', 0, 3, 0), U('b1', 0, 2, 1)]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'a1') === CITY && pos(u, 'b1') === '2,1');
    u = [U('z1', 0, 3, 0), U('g1', 0, 2, 1, { isGeneral: true })]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'g1') === CITY);
    u = [U('w', 0, 3, 0), U('s', 0, 3, 0, { typeId: 'Osadnik' })]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 's') === '3,0');
    u = [U('a', 0, 3, 0), U('foe', 7, 2, 0, { oblegaCityId: undefined })]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'a') === '3,0');
    u = [U('x', 0, 3, 0, { oblegaCityId: 'c2' })]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'x') === '3,0');
    u = [U('e', 0, 3, 0, { embarked: true })]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'e') === '3,0');
    u = [U('a', 0, 3, 0, { inGarnizon: true })]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(u[0].inGarnizon === undefined);
    u = [U('a', 0, 3, 0), U('b', 5, 3, 0)]; m.enterCityAfterSurrender(u, city, 0, deps); r.push(pos(u, 'b') === '3,0');
    return r.every(Boolean);
  } catch (e) { return false; }
};
ok(battery(real) === true, 'bateria przechodzi na kodzie realnym');
const muts = [
  ['u.q = city.q;', 'u.q = u.q;'],
  ['if (g.length !== best.length) { if (g.length > best.length) best = g; continue; }', 'if (g.length !== best.length) { if (g.length < best.length) best = g; continue; }'],
  ['if (gGen !== bGen) { if (gGen) best = g; continue; }', 'if (gGen !== bGen) { continue; }'],
  ['|| deps.isCivilian(u)) continue;', ') continue;'],
  ['if (u.q === city.q && u.r === city.r && u.ownerId !== newOwnerId) return [];', ''],
  ['u.oblegaCityId !== city.id) continue;', 'false) continue;'],
  ['u.embarked === true ||', 'false ||'],
  ['if (u.inGarnizon) delete u.inGarnizon;', ''],
  ['u.ownerId !== newOwnerId || u.oblegaCityId', 'u.oblegaCityId'],
];
muts.forEach(([a, b], i) => ok(battery(mutated('m' + i, a, b)) === false, 'mutacja ' + (i + 1) + ' wywraca baterie: ' + a.slice(0, 50)));

console.log('C. strukturalna main.ts');
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const fnStart = main.indexOf('function resolveSiegeSurrender(');
const fnEnd = main.indexOf('function endMapSiege(', fnStart);
const body = main.slice(fnStart, fnEnd);
const iOwner = body.indexOf('city.ownerId = newOwner;');
const iSplice = body.indexOf('units.splice(i, 1)');
const iEnter = body.indexOf('enterCityAfterSurrender(units, city, newOwner');
const iEnd = body.indexOf('endMapSiege(cityId);\n      // NOTA B');
ok(/import \{ enterCityAfterSurrender \} from '\.\/game\/siege-enter-city'/.test(main), 'import w main.ts');
ok(iOwner > 0 && iSplice > iOwner && iEnter > iSplice && iEnd > iEnter, 'kolejnosc: zmiana wlasciciela < usuniecie obroncow < wejscie < endMapSiege', [iOwner, iSplice, iEnter, iEnd].join(','));
ok(body.indexOf('syncCityGarnizon(city);', iEnter) > iEnter, 'syncCityGarnizon po wejsciu');
ok((main.match(/enterCityAfterSurrender\(/g) || []).length === 1, 'jedno wywolanie (jedna sciezka kapitulacji)');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
