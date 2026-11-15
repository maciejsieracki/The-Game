'use strict';
/**
 * pre-battle-retreat-exhausted-test.cjs
 *
 * P-WYCOFANIE-JEDNORAZOWE-TURA (Maciej 2026-08-13): obrońca gracza, który RAZ
 * wycofał się z bitwy (przycisk "Wycofaj" na ekranie preBattle) w danej turze,
 * przy KOLEJNYM ataku na niego W TEJ SAMEJ TURZE (niezależnie czy atakuje ta sama
 * jednostka wroga, czy inna) NIE MOŻE się wycofać ponownie — musi rozstrzygnąć
 * bitwę (Auto lub ręcznie). Przycisk "Wycofaj" ma być wtedy WIDOCZNY, ale
 * wyszarzony (disabled), z osobnym komunikatem od blokady garnizonowej. Reset na
 * początku kolejnej tury.
 *
 * / EN: a player's defender who retreated ONCE from a battle (the "Retreat"
 * button on the preBattle screen) in a given turn cannot retreat again on the
 * NEXT attack against them THIS SAME TURN (whether the same enemy unit attacks
 * or a different one) — must resolve the battle (Auto or manual). The "Retreat"
 * button must then be VISIBLE but greyed out (disabled), with a message distinct
 * from the garrison lock. Reset at the start of the next turn.
 *
 * Dwie części:
 *  A) TEKSTOWY PIN na src/main.ts (wzorzec z army-merge-separate-return-
 *     mainguard-test.cjs) — pinuje DOKŁADNE formuły w launchIncomingMapFieldBattle
 *     (budowa PreBattleInfo, onCancel, ustawienie flagi) oraz reset EOT, żeby
 *     przyszła zmiana logiki, która po cichu usunie/rozluźni warunek, dała FAIL.
 *  B) UI regresja preBattle.ts (esbuild + jsdom, wzorzec z
 *     pre-battle-defender-retreat-test.cjs) — dowodzi RZECZYWISTEGO renderu:
 *     przycisk widoczny+disabled, osobny komunikat, klik nie odpala onCancel,
 *     Esc nie odpala onCancel.
 *  C) SYMULACJA logiki tury (bez importu main.ts, bo to nieeksportowana funkcja
 *     wewnątrz domknięcia) — mirror DOKŁADNIE tych samych formuł co w części A
 *     (pinowanych tekstowo), odtwarzający scenariusz z zadania: wycofanie ->
 *     drugi atak w tej samej turze -> blokada -> reset EOT -> znowu może się
 *     wycofać.
 *
 * Usage (z gra/): node tools/pre-battle-retreat-exhausted-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// A) PIN TEKSTOWY na src/main.ts
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

const fnStart = mainSrc.indexOf('function launchIncomingMapFieldBattle(');
ok(fnStart >= 0, '[A] znaleziono function launchIncomingMapFieldBattle( w main.ts');

// R-WEB-TEST-DEBT-BASELINE-Q3 R2 (klasa A, zarzut 2): stary marker konca funkcji
// "}, { defaultAction: 'manual' });" nie istnieje juz w main.ts (showPreBattle wywolany
// z obiektem opcji w innym ksztalcie; grep: defaultAction: 'manual' w l. 33410/34174/36818).
// Granica ciala = nastepna deklaracja funkcji na tym samym poziomie zagniezdzenia (4 spacje).
const fnEndMarkerIdx = fnStart >= 0 ? mainSrc.indexOf('\n    function ', fnStart + 10) : -1;
ok(fnEndMarkerIdx > fnStart, '[A] znaleziono koniec funkcji (kolejna funkcja na poziomie 4 spacji po launchIncomingMapFieldBattle)');
const fnEnd = fnEndMarkerIdx > fnStart ? fnEndMarkerIdx : -1;
const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';

// A1) retreatExhaustedThisTurn policzone z defRosterRef PRZED budową pbInfo.
ok(/const retreatExhaustedThisTurn = retreatBudgetExhausted\(defRosterRef\);/.test(fnBody),
  '[A1] retreatExhaustedThisTurn = retreatBudgetExhausted(defRosterRef) — licznik odwrotów rosteru (limit 3), nie tylko lidera');

// A2) defenderCanRetreat gasi się, gdy retreatExhaustedThisTurn===true (obok istniejącego warunku garnizonu).
ok(/defenderCanRetreat: playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn,/.test(fnBody),
  '[A2] defenderCanRetreat: playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn — trzeci warunek NIE zniknął');

// A3) PreBattleInfo dostaje osobne pole retreatExhaustedThisTurn, ODRÓŻNIALNE od defenderLockedByGarnizon.
ok(/retreatExhaustedThisTurn: playerDefends && !defenderLockedByGarnizon && retreatExhaustedThisTurn,/.test(fnBody),
  '[A3] retreatExhaustedThisTurn: playerDefends && !defenderLockedByGarnizon && retreatExhaustedThisTurn — pole przekazane do PreBattleInfo, osobne od defenderCanRetreat');

// A4) onCancel: obrona-w-głąb dołącza !retreatExhaustedThisTurn do warunku wykonania wycofania.
ok(/if \(playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn\) \{/.test(fnBody),
  '[A4] onCancel: warunek wykonania applyDefenderPreBattleRetreat zawiera !retreatExhaustedThisTurn (obrona w głąb — nie tylko widoczność przycisku w UI)');

// A5) po wycofaniu, CAŁY roster obrony dostaje retreatedThisTurn = true (nie tylko lider).
{
  const applyIdx = fnBody.indexOf('applyDefenderPreBattleRetreat({');
  const markIdx = fnBody.indexOf('recordRetreatOnRoster(defRosterRef);');
  ok(applyIdx >= 0 && markIdx > applyIdx,
    '[A5] "recordRetreatOnRoster(defRosterRef);" obecne i wykonywane PO applyDefenderPreBattleRetreat(...) (jednostki faktycznie się przesunęły, zanim zapisujemy odwrót)');
}

// A6) exploit-guard: formuła NIE degeneruje się do samego playerDefends && !defenderLockedByGarnizon
//     (czyli trzeci warunek faktycznie coś ogranicza, nie jest martwym kodem obok).
ok(!/defenderCanRetreat: playerDefends && !defenderLockedByGarnizon,/.test(fnBody),
  '[A6] stara formuła BEZ !retreatExhaustedThisTurn nie występuje już w main.ts (naprawa nie jest zdublowana/martwa)');

// ---------------------------------------------------------------------------
// A7) PIN reset EOT (main.ts, pętla "Restore movement for all units").
// ---------------------------------------------------------------------------
const eotStart = mainSrc.indexOf('// Restore movement for all units');
ok(eotStart >= 0, '[A7] znaleziono marker "// Restore movement for all units"');
const eotLoopStart = eotStart >= 0 ? mainSrc.indexOf('for (const u of units) {', eotStart) : -1;
ok(eotLoopStart > eotStart, '[A7] znaleziono "for (const u of units) {" po markerze EOT');
const eotLoopEnd = eotLoopStart >= 0 ? mainSrc.indexOf('\n        }', eotLoopStart) : -1;
ok(eotLoopEnd > eotLoopStart, '[A7] znaleziono zamknięcie pętli EOT');
const eotBody = (eotLoopStart >= 0 && eotLoopEnd > eotLoopStart) ? mainSrc.slice(eotLoopStart, eotLoopEnd) : '';

ok(/u\.ruchLeft = u\.ruch;/.test(eotBody),
  '[A7] pętla EOT zawiera reset u.ruchLeft = u.ruch (punkt zaczepienia — istniejący wzorzec resetu na turę)');
ok(/resetRetreatCountOfUnit\(u\);/.test(eotBody),
  '[A7] pętla EOT zeruje licznik odwrotów (resetRetreatCountOfUnit) — na nową turę armia ma znów 3 odwroty');

// ---------------------------------------------------------------------------
// A8) PIN RuntimeUnit.retreatedThisTurn (setup.ts) i PreBattleInfo.retreatExhaustedThisTurn (preBattle.ts).
// ---------------------------------------------------------------------------
const SETUP_TS = path.join(__dirname, '..', 'src', 'units', 'setup.ts');
const setupSrc = fs.readFileSync(SETUP_TS, 'utf8');
ok(/odwrotyWTurze\?: number;/.test(setupSrc),
  '[A8] RuntimeUnit (units/setup.ts) ma pole odwrotyWTurze?: number (licznik, nie boolean)');

const PREBATTLE_TS = path.join(__dirname, '..', 'src', 'ui', 'preBattle.ts');
const preBattleSrc = fs.readFileSync(PREBATTLE_TS, 'utf8');
ok(/retreatExhaustedThisTurn\?: boolean;/.test(preBattleSrc),
  '[A8] PreBattleInfo (ui/preBattle.ts) ma pole retreatExhaustedThisTurn?: boolean');

// ---------------------------------------------------------------------------
// B) UI regresja realnego renderu preBattle.ts (esbuild + jsdom).
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[pre-battle-retreat-exhausted-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.pre-battle-retreat-exhausted-entry.ts');
  const OUT = path.join(__dirname, '.pre-battle-retreat-exhausted-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const STUB_FILE = path.resolve(STUB_DIR, 'pre-battle-brandAssets-stub.ts');

  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(
    STUB_FILE,
    [
      "export function terrainIconSvg() { return ''; }",
      "export function civIconSvg() { return ''; }",
      "export function brandIconSvg() { return ''; }",
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(path.join(STUB_DIR, 'leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    "export { showPreBattle, hidePreBattle, isPreBattleOpen } from '../src/ui/preBattle.ts';\n",
    'utf8',
  );

  const stubBrandAssetsPlugin = {
    name: 'stub-brand-assets-prebattle-retreat-exhausted',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: STUB_FILE }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'hud-stub.ts'),
      }));
    },
  };

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: OUT,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    plugins: [stubBrandAssetsPlugin],
  });

  const { showPreBattle, hidePreBattle, isPreBattleOpen } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  const baseInfo = {
    atakujacy: {
      nazwa: 'Wróg',
      ownerId: 2,
      units: [{ nazwa: 'Wojownik', kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
    },
    obronca: {
      nazwa: 'Zwiadowca',
      ownerId: 0,
      units: [{ nazwa: 'Zwiadowca', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
    },
    teren: 'Rownina',
    szanseAtkPct: 72,
    miejsce: 'Pole',
    tura: 3,
    canRetreat: false,
  };

  // --- Scenariusz 1: retreatExhaustedThisTurn=true, defenderCanRetreat=false ---
  // Dokładnie stan main.ts po DRUGIM ataku na jednostkę, która już się wycofała.
  let cancelCalled1 = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false, retreatExhaustedThisTurn: true },
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => { cancelCalled1 = true; } },
  );
  if (!isPreBattleOpen()) throw new Error('[B1] preBattle overlay not open');
  const overlay1 = document.body.lastElementChild;
  const buttons1 = [...document.querySelectorAll('button')];
  const retreatBtn1 = buttons1.find(b => b.textContent && b.textContent.includes('Wycofaj'));
  ok(!!retreatBtn1,
    '[B1] przycisk Wycofaj JEST WIDOCZNY gdy retreatExhaustedThisTurn=true (nie znika jak przy garnizonie)');
  ok(!!retreatBtn1 && retreatBtn1.hasAttribute('disabled'),
    '[B1] przycisk Wycofaj ma atrybut disabled gdy retreatExhaustedThisTurn=true');
  const noRetreat1 = overlay1.querySelector('.pb-noretreat');
  ok(!!noRetreat1 && /wyczerpano trzy odwroty w tej turze/.test(noRetreat1.textContent || ''),
    '[B1] komunikat blokady zawiera "wyczerpano trzy odwroty w tej turze" (osobny od garnizonowego)');
  ok(!!noRetreat1 && !/to wróg wybrał bitwę/.test(noRetreat1.textContent || ''),
    '[B1] komunikat blokady NIE jest komunikatem garnizonowym ("to wróg wybrał bitwę") — dwa różne teksty');
  if (retreatBtn1) retreatBtn1.click();
  ok(!cancelCalled1, '[B1] klik na wyszarzony przycisk Wycofaj NIE odpala onCancel (disabled blokuje klik)');

  // Esc też nie może odpalić onCancel w tym stanie (retreatUiEnabled musi zwrócić false).
  const escEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  document.dispatchEvent(escEvent);
  ok(!cancelCalled1, '[B1] Esc NIE odpala onCancel gdy retreatExhaustedThisTurn=true (retreatUiEnabled=false)');
  hidePreBattle();

  // --- Scenariusz 2: kontrola — blokada garnizonowa (retreatExhaustedThisTurn brak/false) ---
  // Musi zachować STARE zachowanie: przycisk znika CAŁKOWICIE, inny komunikat.
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: false },
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
  );
  const overlay2 = document.body.lastElementChild;
  const buttons2 = [...document.querySelectorAll('button')];
  ok(!buttons2.some(b => b.textContent && b.textContent.includes('Wycofaj')),
    '[B2 kontrola] gdy retreatExhaustedThisTurn brak (garnizon) — przycisk Wycofaj nadal CAŁKOWICIE znika (stare zachowanie nienaruszone)');
  const noRetreat2 = overlay2 ? overlay2.querySelector('.pb-noretreat') : null;
  ok(!!noRetreat2 && /to wróg wybrał bitwę/.test(noRetreat2.textContent || ''),
    '[B2 kontrola] komunikat garnizonowy ("to wróg wybrał bitwę") nienaruszony');
  hidePreBattle();

  // --- Scenariusz 3: kontrola — defenderCanRetreat=true (brak żadnej blokady) ---
  let cancelCalled3 = false;
  showPreBattle(
    { ...baseInfo, defenderCanRetreat: true },
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => { cancelCalled3 = true; } },
  );
  const buttons3 = [...document.querySelectorAll('button')];
  const retreatBtn3 = buttons3.find(b => b.textContent && b.textContent.includes('Wycofaj'));
  ok(!!retreatBtn3 && !retreatBtn3.hasAttribute('disabled'),
    '[B3 kontrola] gdy defenderCanRetreat=true — przycisk Wycofaj aktywny (bez disabled)');
  if (retreatBtn3) retreatBtn3.click();
  ok(cancelCalled3, '[B3 kontrola] klik na aktywny przycisk Wycofaj nadal odpala onCancel (regresja UI nie wystąpiła)');
  hidePreBattle();

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// C) SYMULACJA scenariusza z zadania na poziomie logiki (mirror formuł A1-A5,
//    pinowanych tekstowo wyżej) — wycofanie -> drugi atak w TEJ SAMEJ turze ->
//    blokada -> reset EOT -> znowu może się wycofać.
// ---------------------------------------------------------------------------
function runLogicSimulation() {
  // R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1: mirror formuł main.ts (A1-A7)
  // na LICZNIKU odwrotów (limit 3 na turę), nie na fladze boolowskiej.
  const MAX = 3;
  const countOf = u => (typeof u.odwrotyWTurze === 'number' ? u.odwrotyWTurze : (u.retreatedThisTurn === true ? 1 : 0));
  const rosterCount = roster => roster.reduce((m, u) => Math.max(m, countOf(u)), 0);
  // Mirror main.ts: budowa pbInfo dla scenariusza "AI/barbarzyńca atakuje gracza".
  function buildDefenderPreBattleFields(defRoster, playerDefends, defenderLockedByGarnizon) {
    const retreatExhaustedThisTurn = rosterCount(defRoster) >= MAX;
    return {
      defenderCanRetreat: playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn,
      retreatExhaustedThisTurn: playerDefends && !defenderLockedByGarnizon && retreatExhaustedThisTurn,
    };
  }
  // Mirror main.ts: onCancel handler (recordRetreatOnRoster).
  function onCancelRetreat(defRoster, playerDefends, defenderLockedByGarnizon, retreatExhaustedThisTurn) {
    if (playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn) {
      const next = rosterCount(defRoster) + 1;
      for (const u of defRoster) { u.odwrotyWTurze = next; u.retreatedThisTurn = undefined; }
      return true; // wycofanie wykonane
    }
    return false; // zablokowane
  }
  // Mirror main.ts: reset EOT (resetRetreatCountOfUnit).
  function resetTurnFlags(units) {
    for (const u of units) { u.odwrotyWTurze = 0; u.retreatedThisTurn = undefined; }
  }

  const defender = { id: 'def1', ownerId: 0 };
  const defRoster = [defender];

  // Odwrot #1, #2, #3 w TEJ SAMEJ turze (rózne ataki) -> każdy wykonany.
  for (let k = 1; k <= MAX; k++) {
    const f = buildDefenderPreBattleFields(defRoster, true, false);
    ok(f.defenderCanRetreat === true, '[C' + k + '] atak #' + k + ' tej tury: odwrot dozwolony (licznik ' + rosterCount(defRoster) + ' < ' + MAX + ')');
    const done = onCancelRetreat(defRoster, true, false, f.retreatExhaustedThisTurn);
    ok(done === true && defender.odwrotyWTurze === k, '[C' + k + '] odwrot #' + k + ' wykonany, licznik = ' + k);
  }

  // Atak #4 W TEJ SAMEJ TURZE -> wyczerpany: przycisk wyszarzony, onCancel nie cofa.
  const f4 = buildDefenderPreBattleFields(defRoster, true, false);
  ok(f4.defenderCanRetreat === false && f4.retreatExhaustedThisTurn === true,
    '[C4] po 3 odwrotach: defenderCanRetreat=false, retreatExhaustedThisTurn=true (wyszarzony z powodem)');
  ok(onCancelRetreat(defRoster, true, false, f4.retreatExhaustedThisTurn) === false && defender.odwrotyWTurze === MAX,
    '[C4] obrona-w-głąb: wycofanie po wyczerpaniu NIE wykonuje się, licznik nadal 3');

  // Reset EOT (nowa tura) -> licznik 0, znowu 3 odwroty.
  resetTurnFlags([defender]);
  ok(defender.odwrotyWTurze === 0, '[C5] po resecie EOT: licznik = 0');
  const f5 = buildDefenderPreBattleFields(defRoster, true, false);
  ok(f5.defenderCanRetreat === true, '[C5] w NOWEJ turze: odwrot znów dozwolony (licznik per-tura)');

  // Stary zapis (boolean true, bez licznika) liczony jako 1 odwrot.
  const legacy = [{ id: 'old', retreatedThisTurn: true }];
  ok(buildDefenderPreBattleFields(legacy, true, false).defenderCanRetreat === true,
    '[C6] stary zapis boolean true = 1 odwrot: nadal może się wycofać (migracja 1/0)');

  // Kontrola: garnizon nadal blokuje niezależnie od licznika (dwa niezależne powody).
  const garrisoned = { id: 'def2', ownerId: 0, odwrotyWTurze: 0 };
  const fg = buildDefenderPreBattleFields([garrisoned], true, true);
  ok(fg.defenderCanRetreat === false && fg.retreatExhaustedThisTurn === false,
    '[C7 kontrola] garnizon: defenderCanRetreat=false ALE retreatExhaustedThisTurn=false — dwa NIEZALEŻNE, odróżnialne powody blokady');
}

// ---------------------------------------------------------------------------
async function main() {
  runLogicSimulation();
  await runUiPart();

  console.log(`\npre-battle-retreat-exhausted-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
