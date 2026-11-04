'use strict';
/**
 * roster-space-next-active-unit-test.cjs — R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1.
 * Spacja -> nastepna AKTYWNA jednostka; oblegajace/oblegane tez w kolejce.
 *  A. JEDNOSTKOWA (realny src/game/next-active-unit.ts, esbuild) + porownanie z BAZA (army-cycle: RED).
 *  B. MUTACJE kopii modulu -- kazda musi wywrocic A.
 *  C. STRUKTURALNA main.ts (kolejka Spacji wpieta w activeUnitQueue; handler Spacji: pole tekstowe/modal).
 *  D. ZYWA (Chromium, vite build do /dev/shm; `--no-live` pomija): realny klawisz Spacji.
 * Run z gra/:  node tools/roster-space-next-active-unit-test.cjs [--no-live]
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rsnau-'));
function load(srcDir, tag) {
  const entry = path.join(tmp, tag + '-entry.ts'), out = path.join(tmp, tag + '-bundle.cjs');
  fs.writeFileSync(entry,
    `export { nextActiveUnit, activeUnitQueue, isUnitSiegeInvolved } from ${JSON.stringify(srcDir + '/next-active-unit')};\n` +
    `export { cyclablePlayerArmyLeadsBase, resolveAdjacentPlayerUnitCycle } from ${JSON.stringify(srcDir + '/army-cycle')};\n`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  return require(out);
}

let uid = 0;
const U = (o) => ({ id: 'u' + (++uid), ownerId: 0, q: 0, r: 0, ruchLeft: 2, ruch: 2, ...o });
const ctxFor = (cities, extra = {}) => ({ cities, isMe: (u) => u.ownerId === 0, canMove: (u) => u.ruchLeft > 0, ...extra });
const city = (o) => ({ id: 'c1', q: 5, r: 5, ownerId: 0, oblegane: false, ...o });

function unitChecks(M, label) {
  const R = [];
  const t = (name, cond) => R.push([label + ' ' + name, cond]);
  const ids = (list) => list.map(u => u.id);
  { // 1 aktywna kolejnosc + zapetlenie
    const a = U({ q: 1, r: 0 }), b = U({ q: 2, r: 0 }), c = U({ q: 3, r: 0 });
    const us = [a, b, c], cx = ctxFor([]);
    t('A1 a->b->c->a (zapetlenie)', M.nextActiveUnit(us, a.id, cx) === b.id && M.nextActiveUnit(us, b.id, cx) === c.id && M.nextActiveUnit(us, c.id, cx) === a.id);
    t('A1b brak zaznaczenia -> pierwsza', M.nextActiveUnit(us, null, cx) === a.id);
  }
  { // 2 pomijane: bez ruchu, sentry, ufortyfikowana, auto-explore, garnizon, cudza
    const a = U({ q: 1 }), nomv = U({ q: 2, ruchLeft: 0 }), sen = U({ q: 3, sentry: true }), fort = U({ q: 4, ufortyfikowanyWPolu: true }),
      auto = U({ q: 5, autoExplore: true }), gar = U({ q: 6, inGarnizon: true }), foe = U({ q: 7, ownerId: 1 });
    const us = [a, nomv, sen, fort, auto, gar, foe];
    t('A2 kolejka = tylko aktywna', JSON.stringify(ids(M.activeUnitQueue(us, ctxFor([])))) === JSON.stringify([a.id]));
    t('A2b pojedyncza aktywna -> ta sama (cykl 1)', M.nextActiveUnit(us, a.id, ctxFor([])) === a.id);
  }
  { // 3 oblegajaca bez ruchu trafia do kolejki
    const a = U({ q: 1 }), sg = U({ q: 5, r: 4, ruchLeft: 0, oblegaCityId: 'e1' });
    const cities = [city({ id: 'e1', q: 5, r: 5, ownerId: 1, oblegane: true })];
    t('A3 oblegajaca (bez ruchu) w kolejce, a->siege', M.nextActiveUnit([a, sg], a.id, ctxFor(cities)) === sg.id);
    t('A3b oblegajaca ale miasto juz nieoblegane -> poza kolejka', M.nextActiveUnit([a, sg], a.id, ctxFor([city({ id: 'e1', ownerId: 1, oblegane: false })])) === a.id);
  }
  { // 4 oblegana: garnizon wlasnego miasta
    const a = U({ q: 1 }), g = U({ q: 5, r: 5, ruchLeft: 0, inGarnizon: true });
    const cities = [city({ q: 5, r: 5, ownerId: 0, oblegane: true })];
    t('A4 garnizon oblieganego wlasnego miasta w kolejce', M.nextActiveUnit([a, g], a.id, ctxFor(cities)) === g.id);
    t('A4b ten sam garnizon, miasto NIEoblegane -> pomijany', M.nextActiveUnit([a, g], a.id, ctxFor([city({ oblegane: false })])) === a.id);
    t('A4c cudze oblegane miasto (inny wlasciciel) nie wciaga mojej jednostki', M.nextActiveUnit([a, U({ q: 5, r: 5, ruchLeft: 0 })], a.id, ctxFor([city({ ownerId: 1, oblegane: true })])) === a.id);
  }
  { // 5 oblezenie nie omija uspienia/fortyfikacji
    const a = U({ q: 1 }), s = U({ q: 5, r: 4, ruchLeft: 0, oblegaCityId: 'e1', sentry: true }), f = U({ q: 5, r: 5, ruchLeft: 0, ufortyfikowanyWPolu: true });
    const cities = [city({ id: 'e1', ownerId: 1, q: 9, r: 9, oblegane: true }), city({ q: 5, r: 5, ownerId: 0, oblegane: true })];
    t('A5 uspiona/ufortyfikowana w oblezeniu nadal pominieta', M.nextActiveUnit([a, s, f], a.id, ctxFor(cities)) === a.id);
  }
  { // 6 brak aktywnych -> null; hot-seat
    const nomv = U({ ruchLeft: 0 });
    t('A6 brak aktywnych -> null', M.nextActiveUnit([nomv], null, ctxFor([])) === null && M.nextActiveUnit([], null, ctxFor([])) === null);
    const p0 = U({ q: 1 }), p1 = U({ q: 2, ownerId: 1 });
    t('A7 hot-seat: fotel 1 widzi tylko swoje', M.nextActiveUnit([p0, p1], null, ctxFor([], { isMe: (u) => u.ownerId === 1 })) === p1.id);
  }
  { // 8 stos: jedna pozycja na heks; zaznaczona wypadla z kolejki (wyczerpany ruch) -> nastepna po hexie
    const a = U({ q: 1 }), b = U({ q: 2 }), c = U({ q: 3 });
    b.ruchLeft = 0;
    t('A8 zaznaczona poza kolejka (wyczerpany ruch) -> start od poczatku listy (semantyka istniejacego bebna)', M.nextActiveUnit([a, b, c], b.id, ctxFor([])) === a.id);
  }
  return R;
}

console.log('A. next-active-unit.ts (realny modul, esbuild)');
const NEW = load(path.join(GRA, 'src', 'game'), 'new');
for (const [n, c] of unitChecks(NEW, 'GREEN')) ok(c, n);

console.log('A-RED. ta sama scenariusze na BAZIE (army-cycle: stara logika kolejki) -- siege MUSI byc czerwone');
{
  const OLD = { // baza = to, co robila Spacja przed zmiana (requireMoves=true)
    activeUnitQueue: (us, cx) => NEW.cyclablePlayerArmyLeadsBase(us, true, cx.canMove, cx.isMe),
    nextActiveUnit: (us, id, cx) => NEW.resolveAdjacentPlayerUnitCycle(us, NEW.cyclablePlayerArmyLeadsBase(us, true, cx.canMove, cx.isMe), id, 1),
  };
  const res = unitChecks(OLD, 'RED');
  const red = res.filter(([, c]) => !c).map(([n]) => n);
  ok(red.some(n => /A3 /.test(n)) && red.some(n => /A4 /.test(n)), 'baza: oblegajaca (A3) i oblegana (A4) NIE trafiaja do kolejki', red.join(' | '));
  ok(res.filter(([n, c]) => /A1|A2|A5|A6|A7|A8/.test(n) && !c).length === 0, 'baza: reszta regul (A1,A2,A5-A8) bez zmian = brak regresji zachowania');
}

console.log('B. mutacje next-active-unit.ts (kazda musi wywrocic A)');
const srcMod = fs.readFileSync(path.join(GRA, 'src', 'game', 'next-active-unit.ts'), 'utf8');
const muts = [
  ['siege zawsze false', /if \(c\?\.oblegane === true\) return true;/, 'if (false) return true;'],
  ['oblegana: ignoruj oblegane', /c\.oblegane === true && c\.ownerId/, 'c.ownerId'],
  ['oblegana: ignoruj wlasciciela', /c\.ownerId === u\.ownerId && c\.q/, 'c.q'],
  ['usun filtr sentry/fort/auto', /return u\.sentry !== true && u\.autoExplore !== true && u\.ufortyfikowanyWPolu !== true;/, 'return true;'],
  ['pomin canMove', /u\.inGarnizon !== true && ctx\.canMove\(u\)/, 'u.inGarnizon !== true'],
  ['pomin isMe', /!ctx\.isMe\(u\) \|\| /, ''],
  ['nextActiveUnit delta -1', /currentId, 1\)/, 'currentId, -1)'],
  ['kolejka pusta', /return \[\.\.\.stacks\.values\(\)\]\.sort/, 'return [].sort'],
];
for (const [name, re, rep] of muts) {
  if (!re.test(srcMod)) { ok(false, 'mutacja "' + name + '" pasuje do zrodla'); continue; }
  const mdir = path.join(tmp, 'mut-' + name.replace(/\W+/g, '_'));
  fs.mkdirSync(mdir, { recursive: true });
  for (const f of ['army-cycle.ts', 'armyMerge.ts']) fs.copyFileSync(path.join(GRA, 'src', 'game', f), path.join(mdir, f));
  fs.writeFileSync(path.join(mdir, 'next-active-unit.ts'), srcMod.replace(re, rep).replace(/'\.\.\/units\/setup'/, JSON.stringify(path.join(GRA, 'src', 'units', 'setup'))));
  let killed = false;
  try {
    // armyMerge importuje inne moduly wzgledem src/game -- bundluj z oryginalnym drzewem dla zaleznosci
    const entry = path.join(mdir, 'e.ts'), out = path.join(mdir, 'b.cjs');
    const patched = fs.readFileSync(path.join(mdir, 'next-active-unit.ts'), 'utf8')
      .replace("'./armyMerge'", JSON.stringify(path.join(GRA, 'src', 'game', 'armyMerge')))
      .replace("'./army-cycle'", JSON.stringify(path.join(GRA, 'src', 'game', 'army-cycle')));
    fs.writeFileSync(path.join(mdir, 'next-active-unit.ts'), patched);
    fs.writeFileSync(entry, `export { nextActiveUnit, activeUnitQueue } from ${JSON.stringify(path.join(mdir, 'next-active-unit'))};\n`);
    esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
    const M = require(out);
    killed = unitChecks(M, 'MUT').some(([, c]) => !c);
  } catch (e) { killed = true; }
  ok(killed, 'mutacja "' + name + '" wywraca A');
}

console.log('C. strukturalna main.ts');
const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
ok(/import \{ activeUnitQueue \} from '\.\/game\/next-active-unit';/.test(main), 'main.ts importuje activeUnitQueue');
ok(/function cyclablePlayerArmyLeads\(\): RuntimeUnit\[\] \{[\s\S]{0,400}return activeUnitQueue\(units, \{ cities, isMe: \(u\) => isMe\(u\.ownerId\), canMove: stackCanMove \}\);/.test(main), 'cyclablePlayerArmyLeads() (Spacja/bęben) deleguje do activeUnitQueue');
ok(/function cyclablePlayerArmyLeadsAll\(\): RuntimeUnit\[\] \{\s*return cyclablePlayerArmyLeadsBase\(units, false/.test(main), 'strzalki HUD (All) bez zmian');
const sp = main.slice(main.indexOf("if (e.code === 'Space' || e.key === ' ')"), main.indexOf("if (e.code === 'Space' || e.key === ' ')") + 700);
ok(/tagName === 'INPUT' \|\| ae\.tagName === 'TEXTAREA' \|\| ae\.isContentEditable\)\) return;/.test(sp), 'Spacja: pole tekstowe -> return');
ok(/!isWorldMapUnitMode\(\)\) return;/.test(sp) && /cycleToAdjacentPlayerUnit\(selectedId, 1\)/.test(sp), 'Spacja: modal/panel (isWorldMapUnitMode) -> return; inaczej cykl +1');

async function live() {
  const outDir = '/dev/shm/rsnau-live-' + process.pid;
  try { execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 }); }
  catch (e) { ok(false, 'D0 build bundla', String(e.message).slice(0, 200)); return; }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__frozenTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(2000);
    const mkAt = (o) => page.evaluate((o) => { const h = window.__frozenTestDebug.freeLandHex(); if (!h) return null; return window.__frozenTestDebug.spawn(h.q, h.r, 1, o)[0]; }, o);
    const ids = {
      active: await mkAt({ ruchLeft: 2 }),
      nomove: await mkAt({ ruchLeft: 0 }),
      field: await mkAt({ field: true, ruchLeft: 2 }),
    };
    ok(!!(ids.active && ids.nomove && ids.field), 'D1 3 jednostki testowe (aktywna / bez ruchu / ufortyfikowana)');
    const press = async () => { await page.keyboard.press('Space'); await page.waitForTimeout(250); return page.evaluate(() => window.__frozenTestDebug.selectedId()); };
    await page.evaluate((id) => window.__frozenTestDebug.select(id), ids.active);
    const s1 = await press();
    ok(s1 !== ids.nomove && s1 !== ids.field, 'D2 Spacja nie wybiera jednostki bez ruchu ani ufortyfikowanej', String(s1));
    const seen = new Set([s1]);
    for (let i = 0; i < 12; i++) seen.add(await press());
    ok(!seen.has(ids.nomove) && !seen.has(ids.field), 'D3 w pelnym obiegu pomijane: bez ruchu i ufortyfikowana');
    ok(seen.has(ids.active), 'D4 aktywna jednostka jest w obiegu (zapetlenie)');
    // pole tekstowe
    await page.evaluate(() => { const i = document.createElement('input'); i.id = 'rsnau-in'; document.body.appendChild(i); i.focus(); });
    const before = await page.evaluate(() => window.__frozenTestDebug.selectedId());
    await page.keyboard.press('Space'); await page.waitForTimeout(200);
    ok(before === await page.evaluate(() => window.__frozenTestDebug.selectedId()), 'D5 pole tekstowe aktywne -> Spacja bez efektu');
    await page.evaluate(() => document.getElementById('rsnau-in').remove());
    ok(errs.length === 0, 'D6 zero pageerror', errs.join('|').slice(0, 200));
  } finally { await browser.close(); fs.rmSync(outDir, { recursive: true, force: true }); }
}

(async () => {
  if (!process.argv.includes('--no-live')) { console.log('D. zywa (Chromium)'); await live(); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nwynik: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
