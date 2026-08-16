'use strict';
/**
 * atak-adiacencja-wymagana-test.cjs — P-BITWA-ATAK-DYSTANSOWY-COFNIECIE-Q1=A (2026-08-16,
 * ECHO Maciej: "nie chodziło mi nigdy o to, żeby z pięciu heksów czy z daleka strzelali
 * łucznicy na mapie, bo to w ogóle nie o to chodzi" — cofnięcie CAŁKOWITE mechaniki ataku
 * bez wymogu fizycznej adiacencji, wprowadzonej i wycofanej w 4 rundach tematu
 * P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE, FALA 281→288).
 *
 * CEL: strażnik regresyjny — pilnuje, żeby przyszła sesja nie wprowadziła ponownie ataku
 * z dystansu > 1 heksa na mapie świata bez świadomej decyzji ABC właściciela. Pokrywa
 * WSZYSTKIE 4 ścieżki inicjacji ataku (gracz i AI, jednostka i miasto):
 *   (a) main.ts: tryLaunchMarchAttack (gracz, jednostka→jednostka, egzekucja marszu-z-atakiem)
 *   (b) map/map-attack-city.ts: resolveEnemyCityClick/adjacentPlayerAttackers (gracz, klik miasta)
 *   (c) game/ai.ts: isWithinAttackRange (AI, jednostka→jednostka)
 *   (d) game/ai.ts: isWithinCityAttackRange (AI, jednostka→miasto)
 * + strażniki strukturalne: żadna z usuniętych nazw (unitMapAttackRangeHex,
 *   unitAttackRangeHex, isTargetWithinAttackRange, isTargetWithinStackAttackRange,
 *   canAiEnterUndefendedCityHex, rangedCityAttackEntry, eligibleCityAttackers,
 *   unitAttackRangeHexAi) nie występuje już w źródle — cichy powrót przez skopiowanie
 *   fragmentu kodu (bez świadomej decyzji) zostanie złapany.
 *
 * METODA (wzorzec kanoniczny repo): funkcje niewyeksportowane (ai.ts, main.ts) wycinane są
 * TEKSTOWO po sygnaturze i wykonywane NAPRAWDĘ przez esbuild transformSync + `new Function`;
 * funkcje eksportowane (map-attack-city.ts) bundlowane i require'owane wprost. Zero
 * reimplementacji formuły zasięgu w teście.
 *
 * Bramka (z katalogu gra/): node tools/atak-adiacencja-wymagana-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

console.log('atak-adiacencja-wymagana-test');

function wytnijFunkcje(src, sygnatura) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  if (i < 0) return null;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

// ===========================================================================
// (a) main.ts: tryLaunchMarchAttack — gracz, jednostka→jednostka
// ===========================================================================
{
  const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  const SYG_CLEAR_MARCH = 'function clearPlannedMarch(unitId?: string, force = false): void {';
  const SYG_MARCH_ATTACK = 'function tryLaunchMarchAttack(atkUnit: RuntimeUnit, attackTargetId: string): boolean {';
  const clearMarchTxt = wytnijFunkcje(src, SYG_CLEAR_MARCH);
  const marchAttackTxt = wytnijFunkcje(src, SYG_MARCH_ATTACK);
  ok(!!clearMarchTxt && !!marchAttackTxt, '(a) wycięcie clearPlannedMarch + tryLaunchMarchAttack z main.ts powiodło się');

  if (clearMarchTxt && marchAttackTxt) {
    const entry = path.resolve(__dirname, '.atak-adiacencja-a-entry.ts');
    const out = path.resolve(__dirname, '.atak-adiacencja-a-bundle.cjs');
    fs.writeFileSync(entry, `export { hexDistance } from '../src/units/setup';\n`, 'utf8');
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
      outfile: out, absWorkingDir: GRA_ROOT, logLevel: 'silent',
    });
    const { hexDistance } = require(out);
    fs.rmSync(entry, { force: true });
    fs.rmSync(out, { force: true });

    const js = esbuild.transformSync(clearMarchTxt + '\n' + marchAttackTxt, { loader: 'ts', target: 'node18' }).code;
    const fabryka = new Function('hexDistance', `
      let units = [];
      let currentVisibleSet = new Set();
      let plannedMarches = new Map();
      let marchAttackTargets = new Map();
      let selectedId = null;
      const openCalls = [];
      const unitRenderer = { clearPathRoute: () => {} };
      function currentVisible() { return currentVisibleSet; }
      function keyOf(q, r) { return q + ',' + r; }
      function openPlayerMapUnitAttack(atk, def) { openCalls.push({ atk: atk.id, def: def.id }); }
      ${js}
      return {
        tryLaunchMarchAttack,
        setUnits: (u) => { units = u; },
        setVisible: (keys) => { currentVisibleSet = new Set(keys); },
        getOpenCalls: () => openCalls.slice(),
      };
    `);
    const h = fabryka(hexDistance);

    const atk = { id: 'atk1', typeId: 'Wojownik', q: 0, r: 0, ownerId: 0, ruchLeft: 2, ruch: 2 };
    const defAdjacent = { id: 'def1', typeId: 'Wojownik', q: 1, r: 0, ownerId: 1 };
    h.setUnits([atk, defAdjacent]);
    h.setVisible(['1,0']);
    ok(h.tryLaunchMarchAttack(atk, 'def1') === true,
      '(a) tryLaunchMarchAttack: dystans=1 (adiacencja) → true (atak wykonany)');
    ok(h.getOpenCalls().length === 1,
      '(a) tryLaunchMarchAttack: openPlayerMapUnitAttack woła się dokładnie raz przy adiacencji');

    const defFar2 = { id: 'def2', typeId: 'Procarz', q: 2, r: 0, ownerId: 1 };
    h.setUnits([atk, defFar2]);
    h.setVisible(['2,0']);
    ok(h.tryLaunchMarchAttack(atk, 'def2') === false,
      '(a) tryLaunchMarchAttack: dystans=2 → false (BEZ ataku z dystansu — cofnięte)');

    const defFar5 = { id: 'def3', typeId: 'Łucznik', q: 5, r: 0, ownerId: 1 };
    h.setUnits([atk, defFar5]);
    h.setVisible(['5,0']);
    ok(h.tryLaunchMarchAttack(atk, 'def3') === false,
      '(a) tryLaunchMarchAttack: dystans=5 (dawny "zasięg jednostki dystansowej") → false');
    ok(h.getOpenCalls().length === 1,
      '(a) kontrola: żadne z dwóch odrzuceń poza adiacencją nie wywołało openPlayerMapUnitAttack (licznik nadal 1 z pierwszego przypadku)');
  }
}

// ===========================================================================
// (b) map/map-attack-city.ts: resolveEnemyCityClick — gracz, jednostka→miasto
// ===========================================================================
{
  const ENTRY = path.join(__dirname, '.atak-adiacencja-b-entry.ts');
  const OUT = path.join(__dirname, '.atak-adiacencja-b-bundle.cjs');
  fs.writeFileSync(ENTRY, `export { resolveEnemyCityClick } from '../src/map/map-attack-city';\n`, 'utf8');
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    outfile: OUT, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const { resolveEnemyCityClick } = require(OUT);
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(OUT, { force: true });

  const openCityNear = { id: 'c1', ownerId: 1, q: 3, r: 0, name: 'Sparta', maMur: false, population: 2 };
  const procarzAdjacent = { id: 'u1', ownerId: 0, q: 2, r: 0, ruchLeft: 1, typeId: 'Procarz' };
  const procarzDistant = { id: 'u2', ownerId: 0, q: 0, r: 0, ruchLeft: 1, typeId: 'Procarz' };

  const actionAdjacent = resolveEnemyCityClick({
    city: openCityNear, selectedUnit: procarzAdjacent, units: [procarzAdjacent], playerOwnerId: 0,
  });
  ok(actionAdjacent.kind === 'capture_empty',
    "(b) jednostka dystansowa ADIACENTNA (dystans=1) do miasta bez muru bez obrońców → 'capture_empty' (bez zmian)");

  const actionDistant = resolveEnemyCityClick({
    city: openCityNear, selectedUnit: procarzDistant, units: [procarzDistant], playerOwnerId: 0,
  });
  ok(actionDistant.kind === 'hint_no_adjacent',
    "(b) jednostka dystansowa w dystansie=3 (dawny zasięg Procarza) do miasta bez muru → 'hint_no_adjacent' (BEZ ataku z dystansu — cofnięte)");
}

// ===========================================================================
// (c)+(d) game/ai.ts: isWithinAttackRange + isWithinCityAttackRange — AI
// ===========================================================================
{
  const AI_TS = path.join(GRA_ROOT, 'src', 'game', 'ai.ts');
  const src = fs.readFileSync(AI_TS, 'utf8');
  const SYG_UNIT = 'function isWithinAttackRange(unit: RuntimeUnit, tq: number, tr: number, data: GameData): boolean {';
  const SYG_CITY = 'function isWithinCityAttackRange(\n  unit: RuntimeUnit,\n  city: AICity,\n  data: GameData,\n): boolean {';
  const unitTxt = wytnijFunkcje(src, SYG_UNIT);
  const cityTxt = wytnijFunkcje(src, SYG_CITY);
  ok(!!unitTxt, '(c) wycięcie ai.ts:isWithinAttackRange powiodło się');
  ok(!!cityTxt, '(d) wycięcie ai.ts:isWithinCityAttackRange powiodło się');

  if (unitTxt && cityTxt) {
    const entry = path.resolve(__dirname, '.atak-adiacencja-cd-entry.ts');
    const out = path.resolve(__dirname, '.atak-adiacencja-cd-bundle.cjs');
    fs.writeFileSync(entry, `export { hexDistance } from '../src/units/setup';\n`, 'utf8');
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
      outfile: out, absWorkingDir: GRA_ROOT, logLevel: 'silent',
    });
    const { hexDistance } = require(out);
    fs.rmSync(entry, { force: true });
    fs.rmSync(out, { force: true });

    const js = esbuild.transformSync(unitTxt + '\n' + cityTxt, { loader: 'ts', target: 'node18' }).code;
    const fabryka = new Function('hexDistance', `
      ${js}
      return { isWithinAttackRange, isWithinCityAttackRange };
    `);
    const h = fabryka(hexDistance);

    // (c) jednostka → jednostka
    ok(h.isWithinAttackRange({ q: 0, r: 0, embarked: false }, 1, 0, {}) === true,
      '(c) isWithinAttackRange: dystans=1 → true (adiacencja)');
    ok(h.isWithinAttackRange({ q: 0, r: 0, embarked: false }, 2, 0, {}) === false,
      '(c) isWithinAttackRange: dystans=2 → false (BEZ ataku z dystansu — cofnięte, parytet z graczem)');
    ok(h.isWithinAttackRange({ q: 0, r: 0, embarked: false }, 5, 0, {}) === false,
      '(c) isWithinAttackRange: dystans=5 (dawny "zasięg jednostki dystansowej" AI) → false');
    ok(h.isWithinAttackRange({ q: 0, r: 0, embarked: true }, 1, 0, {}) === false,
      '(c) kontrola: embarked===true blokuje NAWET przy adiacencji (TEMAT #15, niezależne od cofnięcia — zachowane jako neutralne/bezpieczne)');

    // (d) jednostka → miasto (AICity: tylko q/r potrzebne po cofnięciu maMur/hasCityDefenders)
    ok(h.isWithinCityAttackRange({ q: 0, r: 0 }, { q: 1, r: 0 }, {}) === true,
      '(d) isWithinCityAttackRange: dystans=1 → true (adiacencja)');
    ok(h.isWithinCityAttackRange({ q: 0, r: 0 }, { q: 2, r: 0, maMur: false }, {}) === false,
      "(d) isWithinCityAttackRange: dystans=2, miasto BEZ muru (dawniej 'w zasięgu') → false (BEZ ataku z dystansu — cofnięte)");
    ok(h.isWithinCityAttackRange({ q: 0, r: 0 }, { q: 2, r: 0, maMur: true }, {}) === false,
      '(d) isWithinCityAttackRange: dystans=2, miasto Z murem → false (bez zmian, oblężenie zawsze wymagało adiacencji)');
  }
}

// ===========================================================================
// (e) STRAŻNIKI STRUKTURALNE — usunięte nazwy NIE występują już w źródle (cichy powrót złapany)
// ===========================================================================
{
  const files = {
    'main.ts': path.join(GRA_ROOT, 'src', 'main.ts'),
    'game/ai.ts': path.join(GRA_ROOT, 'src', 'game', 'ai.ts'),
    'game/city-hex-movement.ts': path.join(GRA_ROOT, 'src', 'game', 'city-hex-movement.ts'),
    'map/map-attack-city.ts': path.join(GRA_ROOT, 'src', 'map', 'map-attack-city.ts'),
    'game/combat.ts': path.join(GRA_ROOT, 'src', 'game', 'combat.ts'),
  };
  const zakazane = [
    'unitMapAttackRangeHex', 'unitAttackRangeHex', 'isTargetWithinAttackRange',
    'isTargetWithinStackAttackRange', 'canAiEnterUndefendedCityHex', 'rangedCityAttackEntry',
    'eligibleCityAttackers', 'unitAttackRangeHexAi',
  ];
  for (const [label, file] of Object.entries(files)) {
    const src = fs.readFileSync(file, 'utf8');
    for (const nazwa of zakazane) {
      ok(!src.includes(nazwa), `(e) ${label}: nazwa "${nazwa}" NIEOBECNA (mechanika ataku dystansowego na mapie w pełni cofnięta)`);
    }
  }
}

console.log('atak-adiacencja-wymagana-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
