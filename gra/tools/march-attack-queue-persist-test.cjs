'use strict';
/**
 * march-attack-queue-persist-test.cjs — P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE (Przyczyna B,
 * decyzja właściciela `P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE-Q1 = A`, 2026-08-15).
 *
 * Zgłoszenie: klik na dystansowego wroga POPRAWNIE kolejkuje marsz+atak
 * (`plannedMarches`/`marchAttackTargets`, `attackUnitId` ustawiony), ale KAŻDE odznaczenie
 * jednostki (Escape, klik gdzie indziej, otwarcie panelu — `clearPlayerUnitSelection()`, 35
 * wywołań w main.ts) w ciszy kasowało cały wpis przez `clearPlannedMarch(unitId)`, bez
 * rozróżnienia zwykłego marszu od świadomie zakolejkowanego ataku. Gracz widział jednostkę,
 * która doszła na miejsce i nic nie zrobiła.
 *
 * Naprawa: `clearPlannedMarch(unitId?, force = false)` — domyślnie (`force=false`, tak jak
 * wołane jest z `clearPlayerUnitSelection()`) NIE kasuje wpisu z ustawionym `attackUnitId`;
 * `force=true` dla miejsc, które NAPRAWDĘ mają jawnie anulować wszystko (przycisk „Zatrzymaj"/
 * „Anuluj atak" — `stopPlannedMarchForSelected`, rozwiązanie jednostki — `disbandPlayerUnit`,
 * nowe jawne rozkazy które nadpisują poprzedni plan — garnizon/Czuwaj/Zwiedzaj/Pomiń/ruch
 * natychmiastowy, i uruchomienie samego ataku — `tryLaunchMarchAttack`).
 *
 * Pokrycie:
 *  a. force=false + attackUnitId ustawiony → wpis PRZETRWA (plannedMarches ORAZ
 *     marchAttackTargets nietknięte) — to jest DOKŁADNIE naprawiony bug.
 *  b. force=false + zwykły marsz (bez attackUnitId) → kasowany jak dawniej (brak regresji
 *     zwykłego odznaczania).
 *  c. force=true + attackUnitId ustawiony → kasowany bezwarunkowo (jawne anulowanie działa).
 *  d. unitId undefined (masowe czyszczenie): force=false chroni WYŁĄCZNIE wpisy z
 *     attackUnitId, force=true kasuje wszystko.
 *  e. clearPlayerUnitSelection(force?) poprawnie przekazuje force do clearPlannedMarch.
 *  f. unitRenderer.clearPathRoute(): NIE wołane gdy wpis przetrwał (early return), wołane gdy
 *     wpis realnie skasowany dla aktualnie zaznaczonej jednostki.
 *  g. STRAŻNIKI STRUKTURALNE (main.ts): każde z 35 wywołań clearPlayerUnitSelection() I każde
 *     bezpośrednie wywołanie clearPlannedMarch(u.id/atkUnit.id) ma OCZEKIWANY tryb force —
 *     przegląd z raportu Operatora, nie zgadywanie.
 *  h. tryLaunchMarchAttack (integracja pełnego cyklu: marsz zakolejkowany → odznaczenie →
 *     dotarcie → atak) — wykonanie PRAWDZIWEJ funkcji z main.ts, nie kopii formuły.
 *
 * ROZSZERZENIE 2026-08-16 — P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU (decyzja
 * `P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU-Q1 = B`): plan-z-atakiem PRZEŻYWA
 * rozpoczęcie oblężenia (commitBesiege bez force=true, bez zmian), ale gałąź HUD
 * `if (siegeCity) {...} else if (hasPlan) {...}` w `buildArmyStackHudStateInner`
 * wykluczała przycisk „Anuluj atak" właśnie wtedy, gdy jest potrzebny — w trybie
 * oblężenia. Naprawa: dopisany do gałęzi `siegeCity` warunkowy wpis akcji 'march-stop'
 * (reużywa ISTNIEJĄCY handler `stopPlannedMarchForSelected()`, zero duplikacji), widoczny
 * WYŁĄCZNIE gdy `hasPlan && marchAttackTargets.has(active.id)`.
 *  i. Wycięty TEKSTOWO blok `if (siegeCity) { ... }` z `buildArmyStackHudStateInner`
 *     wykonany NAPRAWDĘ (nie reimplementacja) w izolowanym harnessie: (i1) oblężenie +
 *     zakolejkowany atak → akcja 'march-stop'/'Anuluj atak' obecna; (i2) oblężenie BEZ
 *     zakolejkowanego ataku (marchAttackTargets pusty) → akcja NIEOBECNA (zero
 *     zaśmiecania UI); (i3) marchAttackTargets ma wpis, ale hasPlan=false (desync) →
 *     akcja NIEOBECNA (oba warunki wymagane, nie tylko jeden); (i4) isAnimating=true →
 *     akcja obecna, ale disabled=true. Dowód mutacyjny (MUT-SIEGE-GUARD): usunięcie
 *     warunku `hasPlan && marchAttackTargets.has(active.id)` (podmiana na zawsze-prawda)
 *     MUSI złapać scenariusz (i2) — bez warunku przycisk pojawiałby się zawsze w
 *     oblężeniu, także bez czegokolwiek do anulowania.
 *
 * METODA (wzorzec kanoniczny repo — atak-dystansowy-mapa-test.cjs): funkcje wycinane są
 * TEKSTOWO z main.ts po sygnaturze i wykonywane NAPRAWDĘ przez `new Function` z lokalnymi
 * Map/obiektami odpowiadającymi domknięciu main.ts (plannedMarches, marchAttackTargets,
 * selectedId, unitRenderer). Zero reimplementacji logiki w teście.
 *
 * Dowód mutacyjny: MUT-FORCE cofa dokładnie early-return `if (!force && ...) return;` —
 * (a) MUSI się złapać (wpis znowu ginie mimo force=false), (b)/(c) zostają zielone.
 *
 * Bramka (z katalogu gra/): node tools/march-attack-queue-persist-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realMainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

console.log('march-attack-queue-persist-test');

// ---------------------------------------------------------------------------
// Wycinanie funkcji po SYGNATURZE (wzorzec repo).
// ---------------------------------------------------------------------------
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

const SYG_CLEAR_MARCH = 'function clearPlannedMarch(unitId?: string, force = false): void {';
const SYG_CLEAR_SEL = 'function clearPlayerUnitSelection(force = false): void {';

const clearMarchTxt = wytnijFunkcje(realMainSrc, SYG_CLEAR_MARCH);
const clearSelTxt = wytnijFunkcje(realMainSrc, SYG_CLEAR_SEL);
ok(!!clearMarchTxt, 'wycięcie clearPlannedMarch z main.ts powiodło się (sygnatura z parametrem force)');
ok(!!clearSelTxt, 'wycięcie clearPlayerUnitSelection z main.ts powiodło się (sygnatura z parametrem force)');
if (!clearMarchTxt || !clearSelTxt) {
  console.log('march-attack-queue-persist-test: ' + pass + ' passed, ' + fail + ' failed (przerwane — brak harnessu)');
  process.exit(1);
}

/** Buduje harness wykonujący PRAWDZIWE ciało clearPlannedMarch (+opcjonalnie clearPlayerUnitSelection)
 * z lokalnymi zamiennikami domknięcia main.ts. */
function zbudujHarness(marchTxt, selTxt) {
  const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
  const js = esbuild.transformSync(
    marchTxt + (selTxt ? '\n' + selTxt : ''),
    { loader: 'ts', target: 'node18' },
  ).code;
  const fabryka = new Function(`
    let plannedMarches = new Map();
    let marchAttackTargets = new Map();
    let selectedId = null;
    const calls = [];
    const unitRenderer = { clearPathRoute: () => calls.push('clearPathRoute') };
    function clearPlayerUnitSelectionStateOnly() { calls.push('stateOnly'); selectedId = null; }
    ${js}
    return {
      clearPlannedMarch,
      clearPlayerUnitSelection: typeof clearPlayerUnitSelection === 'function' ? clearPlayerUnitSelection : undefined,
      plannedMarches, marchAttackTargets,
      setSelectedId: (id) => { selectedId = id; },
      getCalls: () => calls.slice(),
      resetCalls: () => { calls.length = 0; },
    };
  `);
  return fabryka();
}

// ===========================================================================
// (a)-(d): clearPlannedMarch w izolacji
// ===========================================================================
{
  const h = zbudujHarness(clearMarchTxt, null);
  ok(!!h, 'harness clearPlannedMarch (solo) zbudowany');

  // (a) force=false (domyślne), attackUnitId ustawiony → PRZETRWA
  h.plannedMarches.set('u1', { destQ: 5, destR: 5, attackUnitId: 'enemy1' });
  h.marchAttackTargets.set('u1', 'enemy1');
  h.clearPlannedMarch('u1');
  ok(h.plannedMarches.has('u1') === true,
    '(a) force=false + attackUnitId ustawiony → plannedMarches PRZETRWAŁ (to jest naprawiony bug)');
  ok(h.marchAttackTargets.has('u1') === true,
    '(a) force=false + attackUnitId ustawiony → marchAttackTargets PRZETRWAŁ');
  ok(h.plannedMarches.get('u1').attackUnitId === 'enemy1',
    '(a) wpis nietknięty co do treści (attackUnitId niezmieniony)');

  // (b) force=false, zwykły marsz (bez attackUnitId) → kasowany jak dawniej
  h.plannedMarches.set('u2', { destQ: 3, destR: 3 });
  h.clearPlannedMarch('u2');
  ok(h.plannedMarches.has('u2') === false,
    '(b) force=false + zwykły marsz (brak attackUnitId) → skasowany (brak regresji zwykłego odznaczenia)');

  // (c) force=true, attackUnitId ustawiony → kasowany bezwarunkowo (jawne anulowanie)
  h.plannedMarches.set('u1', { destQ: 5, destR: 5, attackUnitId: 'enemy1' });
  h.marchAttackTargets.set('u1', 'enemy1');
  h.clearPlannedMarch('u1', true);
  ok(h.plannedMarches.has('u1') === false,
    '(c) force=true + attackUnitId ustawiony → plannedMarches skasowany (jawne anulowanie działa)');
  ok(h.marchAttackTargets.has('u1') === false,
    '(c) force=true + attackUnitId ustawiony → marchAttackTargets skasowany');

  // (d) unitId undefined (masowe): force=false chroni TYLKO wpisy z attackUnitId
  h.plannedMarches.clear(); h.marchAttackTargets.clear();
  h.plannedMarches.set('withAtk', { destQ: 1, destR: 1, attackUnitId: 'e' });
  h.plannedMarches.set('plain', { destQ: 2, destR: 2 });
  h.marchAttackTargets.set('withAtk', 'e');
  h.clearPlannedMarch(undefined);
  ok(h.plannedMarches.has('withAtk') === true && h.plannedMarches.has('plain') === false,
    '(d) masowe czyszczenie force=false: wpis z attackUnitId przetrwał, zwykły marsz skasowany');
  h.clearPlannedMarch(undefined, true);
  ok(h.plannedMarches.size === 0 && h.marchAttackTargets.size === 0,
    '(d) masowe czyszczenie force=true: WSZYSTKO skasowane (jawne anulowanie/reset)');

  // (nie istniejący unitId) → no-op, brak wyjątku
  h.clearPlannedMarch('brak-takiego-id');
  ok(true, '(kontrola) clearPlannedMarch na nieistniejącym unitId nie rzuca wyjątku');
}

// ===========================================================================
// (f) unitRenderer.clearPathRoute(): NIE wołane gdy wpis przetrwał, wołane gdy realnie skasowany
// ===========================================================================
{
  const h = zbudujHarness(clearMarchTxt, null);
  h.setSelectedId('u1');
  h.plannedMarches.set('u1', { destQ: 5, destR: 5, attackUnitId: 'enemy1' });
  h.resetCalls();
  h.clearPlannedMarch('u1'); // force=false, przetrwa (early return) -- clearPathRoute NIE wołane
  ok(!h.getCalls().includes('clearPathRoute'),
    '(f) wpis przetrwał (early return) → unitRenderer.clearPathRoute() NIE wołane (trasa marszu zostaje widoczna)');

  h.resetCalls();
  h.clearPlannedMarch('u1', true); // force=true, realnie kasuje -- clearPathRoute wołane (unitId===selectedId)
  ok(h.getCalls().includes('clearPathRoute'),
    '(f) wpis realnie skasowany dla zaznaczonej jednostki → unitRenderer.clearPathRoute() wołane');
}

// ===========================================================================
// (e) clearPlayerUnitSelection(force?) poprawnie przekazuje force do clearPlannedMarch
// ===========================================================================
{
  const h = zbudujHarness(clearMarchTxt, clearSelTxt);
  ok(typeof h.clearPlayerUnitSelection === 'function', 'harness: clearPlayerUnitSelection wycięte i wykonywalne');

  h.setSelectedId('u1');
  h.plannedMarches.set('u1', { destQ: 5, destR: 5, attackUnitId: 'enemy1' });
  h.marchAttackTargets.set('u1', 'enemy1');
  h.clearPlayerUnitSelection(); // domyślne force=false
  ok(h.plannedMarches.has('u1') === true,
    '(e) clearPlayerUnitSelection() bez argumentu (domyślne odznaczenie) → plan-z-atakiem PRZETRWAŁ');

  // clearPlayerUnitSelectionStateOnly (stub) zeruje selectedId po każdym wywołaniu -- tak jak
  // robi to prawdziwy main.ts -- trzeba jednostkę "zaznaczyć" ponownie przed kolejnym wywołaniem.
  h.setSelectedId('u1');
  h.clearPlayerUnitSelection(true); // jawne force=true
  ok(h.plannedMarches.has('u1') === false,
    '(e) clearPlayerUnitSelection(true) → plan-z-atakiem skasowany (jawne anulowanie przez wrapper)');
}

// MUT-FORCE: cofnięcie early-return chroniącego attackUnitId -> (a) MUSI się złapać, (b)/(c) zostają zielone
{
  const zRegex = /if \(!force && plannedMarches\.get\(unitId\)\?\.attackUnitId\) return;\n\s*/;
  ok(zRegex.test(clearMarchTxt), '(MUT-FORCE) wzorzec early-return znaleziony w wyciętym tekście (mutacja przygotowana poprawnie)');
  const mutTxt = clearMarchTxt.replace(zRegex, '');
  ok(mutTxt !== clearMarchTxt, '(MUT-FORCE) mutacja faktycznie zmieniła tekst');
  const hMut = zbudujHarness(mutTxt, null);
  hMut.plannedMarches.set('u1', { destQ: 5, destR: 5, attackUnitId: 'enemy1' });
  hMut.marchAttackTargets.set('u1', 'enemy1');
  hMut.clearPlannedMarch('u1'); // force=false domyślne
  ok(hMut.plannedMarches.has('u1') === false,
    '(MUT-FORCE) po cofnięciu early-return: force=false znowu kasuje attackUnitId → ZŁAPANE, wraca zgłoszony bug');

  // kontrola: (b)/(c) niedotknięte tą mutacją
  hMut.plannedMarches.set('u2', { destQ: 1, destR: 1 });
  hMut.clearPlannedMarch('u2');
  ok(hMut.plannedMarches.has('u2') === false,
    '(MUT-FORCE) kontrola: (b) zwykły marsz nadal kasowany po mutacji (mutacja trafia wyłącznie w ochronę attackUnitId)');
  hMut.plannedMarches.set('u3', { destQ: 1, destR: 1, attackUnitId: 'x' });
  hMut.clearPlannedMarch('u3', true);
  ok(hMut.plannedMarches.has('u3') === false,
    '(MUT-FORCE) kontrola: (c) force=true nadal kasuje po mutacji (bez zmiany)');
}

// ===========================================================================
// (g) STRAŻNIKI STRUKTURALNE: przegląd 35 wywołań clearPlayerUnitSelection() + wywołania
// clearPlannedMarch(u.id/atkUnit.id, ...) — każde MUSI mieć oczekiwany tryb force, zgodnie z
// raportem Operatora (P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE, 2026-08-15).
// ===========================================================================
{
  // g1: DOKŁADNIE jedno wystąpienie force=true dla disbandPlayerUnit (jednostka już usunięta z units).
  const disbandTxt = wytnijFunkcje(realMainSrc, 'function disbandPlayerUnit(unitId: string): boolean {');
  ok(!!disbandTxt && /clearPlayerUnitSelection\(true\)/.test(disbandTxt),
    '(g1) disbandPlayerUnit woła clearPlayerUnitSelection(true) — jednostka usunięta, force=true poprawny');

  // g2: tryLaunchMarchAttack -- plan spełnił rolę, atak się uruchamia -- force=true.
  const marchAttackTxt = wytnijFunkcje(realMainSrc, 'function tryLaunchMarchAttack(atkUnit: RuntimeUnit, attackTargetId: string): boolean {');
  ok(!!marchAttackTxt && /clearPlannedMarch\(atkUnit\.id,\s*true\)/.test(marchAttackTxt),
    '(g2) tryLaunchMarchAttack woła clearPlannedMarch(atkUnit.id, true) — plan skonsumowany przez sam atak');

  // g3: stopPlannedMarchForSelected -- jedyny dziś jawny przycisk anulowania -- MUSI wołać
  // clearPlannedMarch(selectedId, true), NIE surowe plannedMarches.delete(selectedId) (stary,
  // dziurawy kod nie czyścił marchAttackTargets).
  const stopTxt = wytnijFunkcje(realMainSrc, 'function stopPlannedMarchForSelected(): void {');
  ok(!!stopTxt && /clearPlannedMarch\(selectedId,\s*true\)/.test(stopTxt),
    '(g3) stopPlannedMarchForSelected (przycisk „Zatrzymaj"/„Anuluj atak") woła clearPlannedMarch(selectedId, true)');
  ok(!!stopTxt && !/plannedMarches\.delete\(/.test(stopTxt),
    '(g3) kontrola: stopPlannedMarchForSelected NIE robi już surowego plannedMarches.delete() (stary dziurawy kod usunięty)');

  // g4: beginMoveSelectedUnitTo (ruch natychmiastowy) -- nowy jawny rozkaz nadpisuje stary plan -- force=true.
  const beginMoveTxt = wytnijFunkcje(realMainSrc, 'function beginMoveSelectedUnitTo(destQ: number, destR: number): boolean {');
  ok(!!beginMoveTxt && /clearPlannedMarch\(u\.id,\s*true\)/.test(beginMoveTxt),
    '(g4) beginMoveSelectedUnitTo woła clearPlannedMarch(u.id, true) — nowy rozkaz ruchu nadpisuje stary plan');

  // g5: handleSelectedUnitHudAction -- gałęzie 'skip'/garnizon('fortify')/'sentry'/'scout-explore'
  // (enabling) to jawne nowe rozkazy gracza -- WSZYSTKIE force=true. Liczymy wystąpienia
  // "clearPlannedMarch(u.id, true)" w całej funkcji (4 oczekiwane, jedna per gałąź).
  const hudActionTxt = wytnijFunkcje(realMainSrc, 'function handleSelectedUnitHudAction(actionId: string): void {');
  ok(!!hudActionTxt, '(g5) handleSelectedUnitHudAction wycięte z main.ts');
  const forceCallsInHud = (hudActionTxt.match(/clearPlannedMarch\(u\.id,\s*true\)/g) || []).length;
  ok(forceCallsInHud === 4,
    `(g5) handleSelectedUnitHudAction: DOKŁADNIE 4 wywołania clearPlannedMarch(u.id, true) — skip/garnizon/sentry/scout-explore (got ${forceCallsInHud})`);
  ok(!/clearPlannedMarch\(u\.id\);/.test(hudActionTxt),
    '(g5) kontrola: ŻADNE wywołanie w tej funkcji nie zostało z domyślnym (bezargumentowym) force — wszystkie jawnie force=true');

  // g6: doStartGame (nowa gra) i restoreGameFromSave (wczytanie zapisu) -- oba MUSZĄ czyścić
  // marchAttackTargets RAZEM z plannedMarches (dawniej czyściły tylko plannedMarches, zostawiając
  // widmowe wpisy attackUnitId po nieistniejących jednostkach).
  const doStartGameTxt = wytnijFunkcje(realMainSrc, 'async function doStartGame(params: NewGameParams): Promise<void> {');
  ok(!!doStartGameTxt && /plannedMarches\.clear\(\);\s*\n[\s\S]*?marchAttackTargets\.clear\(\);/.test(doStartGameTxt),
    '(g6) doStartGame: marchAttackTargets.clear() woła się razem z plannedMarches.clear() (reset nowej gry)');
  const restoreSaveTxt = wytnijFunkcje(realMainSrc, 'function restoreGameFromSave(saved: SaveGame): void {');
  ok(!!restoreSaveTxt && /plannedMarches\.clear\(\);\s*\n[\s\S]*?marchAttackTargets\.clear\(\);/.test(restoreSaveTxt),
    '(g6) restoreGameFromSave: marchAttackTargets.clear() woła się razem z plannedMarches.clear() (wczytanie zapisu, przed odbudową z loadedMarches)');

  // g7: przycisk HUD 'march-stop' -- etykieta rozróżnia zwykły marsz od zakolejkowanego ataku.
  ok(/hasQueuedAttack \? 'Anuluj atak' : 'Zatrzymaj'/.test(realMainSrc),
    "(g7) etykieta przycisku 'march-stop' rozróżnia „Anuluj atak” (plan z attackUnitId) od „Zatrzymaj” (zwykły marsz)");

  // g8: dokładnie 32 REALNE wywołania clearPlayerUnitSelection( w main.ts (+ 1 definicja = 33
  // w kodzie bez komentarzy) -- liczba zmierzona przeglądem Operatora (P-BITWA-MARSZ-POTEM-ATAK-
  // NIE-KOLEJKUJE, 2026-08-15): linie komentarzy (JSDoc, `//`) są wyfiltrowane, żeby dodanie
  // opisowego komentarza wspominającego tę samą nazwę funkcji nie psuło strażnika. Strażnik przed
  // cichym dodaniem/usunięciem call site'u bez przeglądu.
  const codeOnlyMain = realMainSrc.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  const wystapieniaWKodzie = (codeOnlyMain.match(/clearPlayerUnitSelection\(/g) || []).length;
  ok(wystapieniaWKodzie === 33,
    `(g8) DOKŁADNIE 33 wystąpienia "clearPlayerUnitSelection(" w KODZIE main.ts, bez komentarzy (1 definicja + 32 realne wywołania) — zgodne z przeglądem Operatora (got ${wystapieniaWKodzie})`);
}

// ===========================================================================
// (h) INTEGRACJA: tryLaunchMarchAttack -- pełne wykonanie PRAWDZIWEJ funkcji z main.ts (nie kopii),
// z prawdziwymi zależnościami wyciętymi obok niej, potwierdzające że po "odznaczeniu" (symulowanym
// przetrwaniem wpisu w plannedMarches/marchAttackTargets, jak realnie robi force=false) atak
// faktycznie się odpala przy dotarciu.
// ===========================================================================
{
  const SYG_WITHIN = 'function isTargetWithinAttackRange(atkUnit: RuntimeUnit, tq: number, tr: number): boolean {';
  const SYG_WITHIN_STACK = 'function isTargetWithinStackAttackRange(atkUnit: RuntimeUnit, tq: number, tr: number): boolean {';
  const SYG_STACK_AT = 'function playerStackAt(u: RuntimeUnit): RuntimeUnit[] {';
  const SYG_RANGE = 'function unitAttackRangeHex(u: RuntimeUnit): number {';
  const SYG_LOOKUP = 'function lookupUnitDef(typeId: string): any {';
  const SYG_MARCH_ATTACK = 'function tryLaunchMarchAttack(atkUnit: RuntimeUnit, attackTargetId: string): boolean {';

  const parts = [SYG_LOOKUP, SYG_RANGE, SYG_WITHIN, SYG_WITHIN_STACK, SYG_STACK_AT, SYG_CLEAR_MARCH, SYG_MARCH_ATTACK]
    .map(syg => wytnijFunkcje(realMainSrc, syg));
  const allFound = parts.every(Boolean);
  ok(allFound, '(h) wycięcie wszystkich zależności tryLaunchMarchAttack z main.ts powiodło się');

  if (allFound) {
    const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
    const unitsJson = require('../data/units.json');
    const js = esbuild.transformSync(parts.join('\n'), { loader: 'ts', target: 'node18' }).code;
    const fabryka = new Function('deps', `
      const { data, unitMapAttackRangeHex, hexDistance, activeUnitStack } = deps;
      let units = [];
      let currentVisibleSet = new Set();
      const openCalls = [];
      // Domknięcie main.ts które clearPlannedMarch (wciągnięte tu jako realna zależność
      // tryLaunchMarchAttack) normalnie czyta/mutuje -- ustawiane per-test-case.
      let plannedMarches = new Map();
      let marchAttackTargets = new Map();
      let selectedId = null;
      const unitRenderer = { clearPathRoute: () => {} };
      function currentVisible() { return currentVisibleSet; }
      function keyOf(q, r) { return q + ',' + r; }
      function openPlayerMapUnitAttack(atk, def) { openCalls.push({ atk: atk.id, def: def.id }); }
      ${js}
      return {
        tryLaunchMarchAttack,
        setUnits: (u) => { units = u; },
        setVisible: (keys) => { currentVisibleSet = new Set(keys); },
        setPlannedMarch: (id, dest) => { plannedMarches.set(id, dest); if (dest.attackUnitId) marchAttackTargets.set(id, dest.attackUnitId); },
        hasPlannedMarch: (id) => plannedMarches.has(id),
        hasAttackTarget: (id) => marchAttackTargets.has(id),
        getOpenCalls: () => openCalls.slice(),
      };
    `);
    const combatBundleEntry = path.resolve(__dirname, '.march-attack-persist-entry.ts');
    const combatBundleOut = path.resolve(__dirname, '.march-attack-persist-bundle.cjs');
    fs.writeFileSync(combatBundleEntry, `
export { unitMapAttackRangeHex } from '../src/game/combat';
export { hexDistance } from '../src/units/setup';
export { activeUnitStack } from '../src/game/armyMerge';
`, 'utf8');
    esbuild.buildSync({
      entryPoints: [combatBundleEntry], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile: combatBundleOut, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
      absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
    });
    const { unitMapAttackRangeHex, hexDistance, activeUnitStack } = require(combatBundleOut);

    const h = fabryka({ data: { units: unitsJson }, unitMapAttackRangeHex, hexDistance, activeUnitStack });

    const lucznik = { id: 'atk1', typeId: 'Łucznik', q: 0, r: 0, ownerId: 0, ruchLeft: 2, ruch: 2 };
    const wrog = { id: 'def1', typeId: 'Wojownik', q: 3, r: 0, ownerId: 1, ruchLeft: 2, ruch: 2 };
    h.setUnits([lucznik, wrog]);
    h.setVisible(['3,0']);
    // Zakolejkowany marsz-z-atakiem, DOKŁADNIE jak main.ts po kliku na dystansowego wroga
    // (planMarchTo → syncMarchAttackTarget) -- wpis PRZETRWAŁ symulowane odznaczenie (naprawa
    // force=false nie usuwa go z zewnątrz, dokładnie tak jak realnie działa dziś).
    h.setPlannedMarch('atk1', { destQ: 3, destR: 0, attackUnitId: 'def1' });
    ok(h.hasPlannedMarch('atk1') && h.hasAttackTarget('atk1'),
      '(h) SETUP: plan marszu-z-atakiem zarejestrowany PRZED wywołaniem tryLaunchMarchAttack (symuluje stan "po przetrwanym odznaczeniu")');

    // Scenariusz zgłoszenia: jednostka DOTARŁA w zasięg (Łucznik zasięg=3, dystans=3) — egzekucja
    // marszu na końcu segmentu (main.ts:~19691) woła dokładnie to wywołanie.
    const wynik = h.tryLaunchMarchAttack(lucznik, 'def1');
    ok(wynik === true,
      '(h) tryLaunchMarchAttack(Łucznik@dystans=3, cel w zasięgu i widoczny) → true (atak się uruchamia PO przetrwanym odznaczeniu)');
    ok(h.getOpenCalls().length === 1 && h.getOpenCalls()[0].atk === 'atk1' && h.getOpenCalls()[0].def === 'def1',
      '(h) openPlayerMapUnitAttack woła się DOKŁADNIE raz z prawidłową parą atakujący/cel — dowód end-to-end, że plan po "przetrwaniu" odznaczenia faktycznie kończy się realnym atakiem po dotarciu, nie cichym zgaśnięciem');
    ok(h.hasPlannedMarch('atk1') === false && h.hasAttackTarget('atk1') === false,
      '(h) PO uruchomieniu ataku: plan skonsumowany (clearPlannedMarch(atkUnit.id, true) wewnątrz tryLaunchMarchAttack wyczyścił oba wpisy)');

    // kontrola: cel poza zasięgiem/niewidoczny -> atak się NIE uruchamia, plan zostaje nietknięty
    h.setPlannedMarch('atk1', { destQ: 3, destR: 0, attackUnitId: 'def1' });
    h.setVisible([]); // mgła
    const wynikMgla = h.tryLaunchMarchAttack(lucznik, 'def1');
    ok(wynikMgla === false, '(h) kontrola: cel w mgle → tryLaunchMarchAttack zwraca false (bez regresji)');
    ok(h.hasPlannedMarch('atk1') === true,
      '(h) kontrola: atak nieudany (mgła) → plan NIE skonsumowany, zostaje do kolejnej próby (early return PRZED clearPlannedMarch)');

    fs.rmSync(combatBundleEntry, { force: true });
    fs.rmSync(combatBundleOut, { force: true });
  }
}

// ===========================================================================
// (i) P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU: blok `if (siegeCity) {...}`
// z buildArmyStackHudStateInner, wycięty TEKSTOWO i wykonany NAPRAWDĘ (ta sama metoda co
// (a)-(h) wyżej — zero reimplementacji formuły).
// ===========================================================================
{
  const SYG_SIEGE_BLOK = 'if (siegeCity) {';
  const siegeBlokTxt = wytnijFunkcje(realMainSrc, SYG_SIEGE_BLOK);
  ok(!!siegeBlokTxt, '(i) wycięcie bloku `if (siegeCity) {...}` z main.ts powiodło się');

  if (siegeBlokTxt) {
    // Kontrola treści PRZED wykonaniem: blok musi zawierać dokładnie ten warunek ochronny
    // (nie inny, przypadkowo podobny) -- inaczej harness testowałby coś innego niż realny kod.
    ok(/if \(hasPlan && marchAttackTargets\.has\(active\.id\)\) \{/.test(siegeBlokTxt),
      '(i) SETUP: blok siegeCity zawiera oczekiwany warunek `hasPlan && marchAttackTargets.has(active.id)`');
    ok(/id: 'march-stop'/.test(siegeBlokTxt) && /label: 'Anuluj atak'/.test(siegeBlokTxt),
      "(i) SETUP: blok siegeCity dopisuje akcję id='march-stop', label='Anuluj atak'");

    function zbudujSiegeHarness(blokTxt) {
      const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
      const js = esbuild.transformSync(blokTxt, { loader: 'ts', target: 'node18' }).code;
      // `siegeCity`/`active`/`hasPlan`/`marchAttackTargets`/`isAnimating` to dokładnie te
      // same nazwy zmiennych z domknięcia buildArmyStackHudStateInner, które blok czyta.
      const fabryka = new Function(`
        return function(siegeCity, active, hasPlan, marchAttackTargets, isAnimating) {
          const actions = [];
          ${js}
          return actions;
        };
      `);
      return fabryka();
    }

    const runSiege = zbudujSiegeHarness(siegeBlokTxt);
    const findMarchStop = (actions) => actions.find(a => a.id === 'march-stop');

    // (i1) oblężenie + zakolejkowany atak (hasPlan=true, marchAttackTargets ma wpis) →
    // akcja 'march-stop'/'Anuluj atak' OBECNA.
    {
      const mt = new Map([['u1', 'enemy1']]);
      const acts = runSiege({ id: 'c1' }, { id: 'u1', ufortyfikowanyWPolu: false }, true, mt, false);
      const ms = findMarchStop(acts);
      ok(!!ms, "(i1) oblężenie + zakolejkowany atak → akcja 'march-stop' OBECNA w panelu oblężenia");
      ok(!!ms && ms.label === 'Anuluj atak', "(i1) etykieta akcji = 'Anuluj atak'");
      ok(!!ms && ms.disabled === false, '(i1) isAnimating=false → przycisk NIE disabled');
    }

    // (i2) oblężenie BEZ zakolejkowanego ataku (marchAttackTargets pusty) → akcja
    // NIEOBECNA -- gracz nie ma czego anulować, UI nie zaśmiecony.
    {
      const mt = new Map();
      const acts = runSiege({ id: 'c1' }, { id: 'u1', ufortyfikowanyWPolu: false }, false, mt, false);
      ok(!findMarchStop(acts),
        "(i2) oblężenie BEZ zakolejkowanego ataku → akcja 'march-stop' NIEOBECNA (zero zaśmiecania UI)");
    }

    // (i3) marchAttackTargets MA wpis dla tej jednostki, ale hasPlan=false (desync, nie
    // powinien wystąpić w realnej grze, ale blok wymaga OBU warunków jawnie) → NIEOBECNA.
    {
      const mt = new Map([['u1', 'enemy1']]);
      const acts = runSiege({ id: 'c1' }, { id: 'u1', ufortyfikowanyWPolu: false }, false, mt, false);
      ok(!findMarchStop(acts),
        '(i3) marchAttackTargets ma wpis, ale hasPlan=false → NIEOBECNA (oba warunki wymagane, nie tylko jeden)');
    }

    // (i4) isAnimating=true → akcja nadal OBECNA, ale disabled=true (spójne z gałęzią
    // hasPlan poza oblężeniem, `disabled: isAnimating`).
    {
      const mt = new Map([['u1', 'enemy1']]);
      const acts = runSiege({ id: 'c1' }, { id: 'u1', ufortyfikowanyWPolu: false }, true, mt, true);
      const ms = findMarchStop(acts);
      ok(!!ms && ms.disabled === true, '(i4) isAnimating=true → akcja OBECNA, ale disabled=true');
    }

    // (i) kontrola bez regresji: 'siege-hold' i 'fortify' nadal obecne niezależnie od
    // stanu zakolejkowanego ataku (blok siegeCity nie stracił swoich oryginalnych akcji).
    {
      const acts = runSiege({ id: 'c1' }, { id: 'u1', ufortyfikowanyWPolu: true }, false, new Map(), false);
      ok(!!acts.find(a => a.id === 'siege-hold'), "(i) kontrola: akcja 'siege-hold' nadal obecna");
      const fortifyAct = acts.find(a => a.id === 'fortify');
      ok(!!fortifyAct && fortifyAct.active === true,
        "(i) kontrola: akcja 'fortify' nadal obecna i odzwierciedla ufortyfikowanyWPolu=true");
    }

    // MUT-SIEGE-GUARD: usunięcie warunku ochronnego -> (i2) MUSI się złapać (przycisk
    // pojawiałby się w oblężeniu ZAWSZE, także bez czegokolwiek do anulowania).
    {
      const guardRegex = /if \(hasPlan && marchAttackTargets\.has\(active\.id\)\) \{/;
      ok(guardRegex.test(siegeBlokTxt), '(MUT-SIEGE-GUARD) warunek ochronny znaleziony w wyciętym tekście (mutacja przygotowana poprawnie)');
      const mutTxt = siegeBlokTxt.replace(guardRegex, 'if (true) {');
      ok(mutTxt !== siegeBlokTxt, '(MUT-SIEGE-GUARD) mutacja faktycznie zmieniła tekst');
      const runSiegeMut = zbudujSiegeHarness(mutTxt);
      const actsMut = runSiegeMut({ id: 'c1' }, { id: 'u1', ufortyfikowanyWPolu: false }, false, new Map(), false);
      ok(!!findMarchStop(actsMut),
        "(MUT-SIEGE-GUARD) po usunięciu warunku: 'march-stop' pojawia się nawet BEZ zakolejkowanego ataku → ZŁAPANE, wraca zaśmiecanie UI");
    }
  }
}

console.log('march-attack-queue-persist-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
