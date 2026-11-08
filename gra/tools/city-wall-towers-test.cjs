'use strict';
/**
 * city-wall-towers-test.cjs
 *
 * R-WEB-PALISADE-BATTLE-WALL-RULES-Q1, runda 2 (R4): wiezyczki strzeleckie co 4 kafle
 * obwodu zarowno przy PALISADZIE, jak i przy MURZE (decyzja wlasciciela 2026-11-03):
 * automatycznie i za darmo, moc strzalu = najmocniejsza jednostka dystansowa epoki
 * wlasciciela miasta, ostrzal w bitwie o miasto (gracz i AI), wyłom usuwa wiezyczke.
 *
 * Czesc A: PRAWDZIWE funkcje (game/city-towers.ts, city-fortification.ts) na realnym
 * units.json / miasto-params.json. Czesc B: okablowanie sceny (battleScene.ts) przypiete
 * do zrodla -- kazda pinezka ma MUTACJE (usuniecie => czerwono). Czesc C: mutacje logiki
 * (re-bundle city-towers.ts ze zepsutym kodem => asercje czerwone).
 * Zywy dowod w Chromium (ostrzal na prawdziwej scenie): tools/palisade-towers-live.cjs.
 *
 * Usage (z gra/): node tools/city-wall-towers-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `city-wall-towers-${RUN}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });
function bundleFile(file, name) {
  const outfile = path.join(OUT, name + '.cjs');
  esbuild.buildSync({ entryPoints: [file], bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' } });
  return require(outfile);
}
const TOW_SRC = path.join(GRA, 'src/game/city-towers.ts');
const T = bundleFile(TOW_SRC, 'towers');
const F = bundleFile(path.join(GRA, 'src/game/city-fortification.ts'), 'fort');
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const ul = Array.isArray(units) ? units : Object.values(units)[0];
const params = JSON.parse(fs.readFileSync(path.join(GRA, 'data/miasto-params.json'), 'utf8'));
const byName = n => ul.find(u => u.Jednostka === n);

function partA(T, label) {
  const res = {};
  const spacing = params.wieze_strzeleckie_odstep_kafli.wartosc;
  const minR = params.wieze_strzeleckie_zasieg_min.wartosc;
  assert(spacing === 4 && minR === 2, `${label}miasto-params.json: odstep wiezyczek 4 kafle, zasieg min 2`);

  // --- rozmieszczenie: co 4 kafle obwodu, bez bramy (pole bitwy: rzedy 0..155, brama 77-78) ---
  // prawdziwa brama sceny: siegeGateRow=77 => rzedy bramy 76..77 (battleScene._placeSiegeTowers)
  const rows = T.towerRows({ rowLo: 0, rowHi: 155, gateRowLo: 76, gateRowHi: 77, spacing });
  const gaps = rows.slice(1).map((r, i) => r - rows[i]);
  assert(rows.length === 39, `${label}39 wiezyczek na obwodzie 156 kafli (wyliczone: ${rows.length})`);
  assert(gaps.every(g => g === 4), `${label}odstep miedzy wiezyczkami = 4 kafle`);
  assert(!rows.some(r => r >= 76 && r <= 77), `${label}brak wiezyczki na kaflach bramy`);
  const rowsG = T.towerRows({ rowLo: 0, rowHi: 155, gateRowLo: 78, gateRowHi: 79, spacing });
  const gapsG = rowsG.slice(1).map((r, i) => r - rowsG[i]);
  assert(rowsG.length === 38 && !rowsG.includes(78) && gapsG.filter(g => g === 8).length === 1, `${label}brama na rzedzie wiezyczki (78-79) wycina ja: 38 wiezyczek, jeden skok 8`);
  const rows2 = T.towerRows({ rowLo: 0, rowHi: 11, gateRowLo: 5, gateRowHi: 5, spacing: 4 });
  assert(JSON.stringify(rows2) === JSON.stringify([2, 6, 10]), `${label}maly obwod 0..11, brama 5: wiezyczki 2,6,10 => ${JSON.stringify(rows2)}`);
  const rows3 = T.towerRows({ rowLo: 0, rowHi: 11, gateRowLo: 5, gateRowHi: 6, spacing: 4 });
  assert(JSON.stringify(rows3) === JSON.stringify([2, 10]), `${label}brama 5-6 wycina wiezyczke 6 => ${JSON.stringify(rows3)}`);

  // --- material: drewno przy palisadzie, kamien przy murze, nic bez obwarowania ---
  assert(T.towerMaterialFor(F.cityFortificationKind(['palisada'])) === 'drewno', `${label}palisada => wiezyczka drewniana`);
  assert(T.towerMaterialFor(F.cityFortificationKind(['mury'])) === 'kamien', `${label}mur => wiezyczka kamienna`);
  assert(T.towerMaterialFor(F.cityFortificationKind(['palisada', 'mury'])) === 'kamien', `${label}mur zastepuje palisade (bez podwojnych wiezyczek)`);
  assert(T.towerMaterialFor(F.cityFortificationKind(['baszta'])) === null, `${label}sama Baszta (budynek) NIE daje wiezyczek ostrzalu`);
  assert(T.towerMaterialFor(F.cityFortificationKind([])) === null, `${label}brak obwarowania => brak wiezyczek`);

  // --- moc strzalu: najmocniejsza jednostka DYSTANSOWA epoki wlasciciela ---
  const dyst = ul.filter(u => u['Rola (linia)'] === 'Dystans');
  const gen = dyst.filter(u => !String(u.Nacja || '').trim());
  const power = u => Number(u.missileAttack ?? u['Atak dystansowy'] ?? 0);
  const inEra = (list, era) => list.filter(u => String(u['Dostępna w epokach'] || u.Epoka).split(';').includes(era));
  const maxP = list => Math.max(...list.map(power));
  const k1 = T.strongestRangedUnitForEra(ul, 1, null);
  assert(k1 && power(k1) === maxP(inEra(gen, 'Kamień')), `${label}era Kamien (generyczna): najmocniejszy = ${k1 && k1.Jednostka} (moc ${k1 && power(k1)})`);
  assert(k1.Jednostka === 'Oszczepnik', `${label}era Kamien: Oszczepnik (missileAttack 4; Lucznik 3)`);
  const b2 = T.strongestRangedUnitForEra(ul, 2, null);
  assert(b2 && power(b2) === maxP(inEra(gen, 'Brąz')), `${label}era Braz (generyczna): najmocniejszy = ${b2 && b2.Jednostka}`);
  assert(b2.Jednostka === 'Procarz', `${label}era Braz: remis mocy 4 rozstrzyga zasieg => Procarz (zasieg 4)`);
  const eg1 = T.strongestRangedUnitForEra(ul, 1, 'egipt');
  assert(eg1.Jednostka === 'Łucznik egipski' && power(eg1) === 6, `${label}Egipt, Kamien: Lucznik egipski (moc 6) -- jednostka narodowa tylko dla swojej nacji`);
  const sum1 = T.strongestRangedUnitForEra(ul, 1, 'sumer');
  assert(sum1.Jednostka === 'Łucznik sumeryjski', `${label}Sumer, Kamien: remis mocy 4 z Oszczepnikiem rozstrzyga zasieg (Lucznik sumeryjski, zasieg 4)`);
  const eg3 = T.strongestRangedUnitForEra(ul, 3, 'egipt');
  assert(eg3.Jednostka === 'Łucznik nubijski', `${label}Egipt, Zelazo: Lucznik nubijski (Braz;Zelazo)`);
  const g3 = T.strongestRangedUnitForEra(ul, 3, null);
  assert(g3 && g3.Jednostka === 'Procarz', `${label}Zelazo bez nacji: brak generycznego strzelca => ZALOZENIE: najlepszy z epok wczesniejszych (Procarz)`);
  const noOther = [byName('Katapulta'), byName('Wojownik'), byName('Rydwan egipski')];
  assert(!dyst.includes(byName('Katapulta')) && T.strongestRangedUnitForEra(noOther, 2, null) === null, `${label}machiny oblezenicze/jazda/piechota nie sa strzelcem wiezyczki`);

  // --- zasieg i cel ---
  assert(T.towerRangeFor(k1, minR) === 2, `${label}zasieg wiezyczki (Oszczepnik, zasieg 2) = 2`);
  assert(T.towerRangeFor(b2, minR) === 4, `${label}zasieg wiezyczki (Procarz, zasieg 4) = 4`);
  assert(T.towerRangeFor({ 'Zasięg ataku (hex)': 1 }, minR) === 2 && T.towerRangeFor(null, minR) === 2, `${label}zasieg nie mniejszy niz 2`);
  const tw = { q: 40, r: 86 };
  const enemies = [{ q: 36, r: 86, hp: 9 }, { q: 38, r: 87, hp: 30 }, { q: 38, r: 85, hp: 5 }, { q: 39, r: 86, hp: 50, dead: true }];
  assert(T.pickTowerTarget(tw, 3, enemies) === 2, `${label}cel: najblizszy w zasiegu 3, remis (d=3) -> najmniej HP (idx 2); martwy (d=1) pominiety`);
  assert(T.pickTowerTarget(tw, 2, enemies) === -1, `${label}poza zasiegiem 2 => brak strzalu`);
  assert(T.pickTowerTarget(tw, 4, enemies) === 2 && T.pickTowerTarget({ q: 0, r: 0 }, 4, enemies) === -1, `${label}wiekszy zasieg nie zmienia najblizszego; odlegla wiezyczka nie strzela`);

  // --- wyłom usuwa wiezyczke ---
  const alive = T.aliveTowerRows(rows, new Set(rows.filter(r => r !== 86)));
  assert(alive.length === rows.length - 1 && !alive.includes(86), `${label}zniszczenie kafla muru usuwa wiezyczke na nim (tylko ta)`);

  // --- palisada = ta sama mechanika co mur (wspolne obwarowanie) ---
  const pal = { rows: T.towerRows({ rowLo: 0, rowHi: 155, gateRowLo: 76, gateRowHi: 77, spacing }), unit: T.strongestRangedUnitForEra(ul, 2, 'zulu') };
  const mur = { rows: T.towerRows({ rowLo: 0, rowHi: 155, gateRowLo: 76, gateRowHi: 77, spacing }), unit: T.strongestRangedUnitForEra(ul, 2, 'zulu') };
  assert(JSON.stringify(pal) === JSON.stringify(mur), `${label}palisada i mur: identyczne rozmieszczenie i moc strzalu (rozni sie tylko model)`);
  res.k1 = k1; res.rows = rows;
  return res;
}

console.log('\nCZESC A -- prawdziwe funkcje (palisada I mur)');
partA(T, '');

// --- CZESC B: okablowanie sceny (pinezki zrodlowe z mutacja) ---
console.log('\nCZESC B -- okablowanie battleScene.ts / siegeWall.ts / miasto-params');
const scene = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');
const wall = fs.readFileSync(path.join(GRA, 'src/battle/siegeWall.ts'), 'utf8');
const pins = [
  ['wiezyczki strzelaja w _beginTurn (raz na ture, gracz i AI jedna sciezka)', scene, /_beginTurn\(\)[\s\S]{0,1800}?if \(this\.siegeWallCol >= 0\) this\._fireSiegeTowers\(\);/],
  ['strzal = _singleBlow(ranged=true) ze statystykami jednostki epoki (nie osobna matematyka)', scene, /this\._singleBlow\(shooter, target, true\)/],
  ['wiezyczki wedlug rodzaju obwarowania (cityFortificationKind) i materialu', scene, /towerMaterialFor\(this\.fortKind\)/],
  ['moc = najmocniejsza jednostka dystansowa epoki OBRONCY', scene, /strongestRangedUnitForEra\(unitList, this\._defenderEra, this\._siegeDefCiv\)/],
  ['wyłom kafla muru/palisady burzy wiezyczke', scene, /this\.wallEverBreached = true;\s*this\._destroyTowerAtRow\(wallRow\);/],
  ['zniszczona wiezyczka nie strzela (kafel bez wytrzymalosci)', scene, /!this\.wallTileHp\.has\(t\.row\)\) \{ this\._destroyTowerAtRow/],
  ['log zdarzen ostrzalu wiezyczek', scene, /'Wieza strzelnicza \(rzad '/],
  ['model palisady w widoku bitwy wg rodzaju obwarowania', scene, /kind: this\.fortKind === 'palisada' \? 'palisada' : 'mur'/],
  ['siegeWall.buildSiegeWall: palisada => buildPalisade (drewniane pale)', wall, /resolved\.kind === 'palisada'\) return buildPalisade\(resolved\)/],
  ['siegeWall.buildWallTower: drewno i kamien', wall, /export function buildWallTower\(\s*material: 'drewno' \| 'kamien'/],
  ['parametry wiezyczek w miasto-params.json', JSON.stringify(params), /wieze_strzeleckie_odstep_kafli[\s\S]*wieze_strzeleckie_zasieg_min/],
];
for (const [name, text, re] of pins) {
  assert(re.test(text), 'pinezka: ' + name);
  const mutated = text.replace(re, '/*MUT*/');
  assert(mutated !== text && !re.test(mutated), '  mutacja gasi pinezke: ' + name);
}

// --- CZESC C: mutacje logiki city-towers.ts (re-bundle zepsutego kodu) ---
console.log('\nCZESC C -- mutacje logiki (zepsuty city-towers.ts => asercje czerwone)');
const orig = fs.readFileSync(TOW_SRC, 'utf8');
const mutations = [
  ['odstep wiezyczek 4 -> 5', s => s.replace('export const DEFAULT_TOWER_SPACING = 4;', 'export const DEFAULT_TOWER_SPACING = 5;').replace(/Math\.floor\(inp\.spacing \?\? DEFAULT_TOWER_SPACING\)/, 'Math.floor(DEFAULT_TOWER_SPACING)')],
  ['wiezyczki rowniez na bramie', s => s.replace('if (r >= inp.gateRowLo && r <= inp.gateRowHi) continue;', '')],
  ['najslabsza zamiast najmocniejszej jednostki', s => s.replace('if (p > bp ||', 'if (p < bp ||')],
  ['palisada bez wiezyczek', s => s.replace("if (kind === 'palisada') return 'drewno';", '')],
  ['mur bez wiezyczek', s => s.replace("if (kind === 'mur') return 'kamien';", '')],
  ['zasieg bez minimum', s => s.replace('Math.max(minRange, Math.round(unit ? unitReach(unit) : 0))', 'Math.round(unit ? unitReach(unit) : 0)')],
  ['wyłom nie usuwa wiezyczki', s => s.replace('rows.filter(r => intactWallRows.has(r))', 'rows.slice()')],
  ['strzal do wroga poza zasiegiem', s => s.replace('if (d < 1 || d > range) continue;', 'if (d < 1) continue;')],
];
let mutIdx = 0;
for (const [name, fn] of mutations) {
  const mutSrc = fn(orig);
  if (mutSrc === orig) { assert(false, 'mutacja nieskuteczna (tekst nie znaleziony): ' + name); continue; }
  const f = path.join(OUT, `mut-${mutIdx}.ts`);
  fs.writeFileSync(f, mutSrc);
  let Tm; try { Tm = bundleFile(f, 'mut' + mutIdx); } catch (e) { assert(false, 'mutacja nie buduje sie: ' + name + ' ' + e.message); continue; }
  mutIdx++;
  const before = fail; const passBefore = pass; const savedLog = console.log; const savedErr = console.error;
  console.log = () => {}; console.error = () => {};
  let threw = false;
  try { partA(Tm, ''); } catch (e) { threw = true; }
  console.log = savedLog; console.error = savedErr;
  const caught = fail > before || threw;
  // asercje czesci A zepsutej wersji licza sie jako wykrycie mutacji -- wycofaj je z licznikow
  const newFails = fail - before; fail = before; pass = passBefore;
  assert(caught, `mutacja wykryta (${newFails} czerwonych asercji): ${name}`);
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
