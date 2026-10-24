'use strict';
/**
 * endturn-battle-deadlock-test.cjs
 *
 * R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1 (zgłoszenie właściciela 2026-10-24, tura 43 / 1900 p.n.e.):
 * przycisk „ZAKOŃCZ TURĘ" zablokowany, podpowiedź „Zakończ ekran bitwy, potem zakończ turę.",
 * a ŻADEN ekran bitwy nie jest widoczny. Gracz nie prowadzi bitew sam -- jedyne, co się dzieje,
 * to wojna, czyli ataki AI/barbarzyńców na jednostki gracza (launchIncomingMapFieldBattle ->
 * showPreBattle({auto:true})). Gdy taki atak trafia do kolejki odłożonych żądań
 * (deferredAutoRequests w ui/preBattle.ts), hasPendingAutoPreBattle() === true blokuje koniec tury.
 *
 * PRZYCZYNA KORZENIOWA (potwierdzona czytaniem kodu i wykonaniem istniejących testów na origin/main):
 *  - Sprzątacz `healStuckDeferredPreBattleQueueOnEndTurnAttempt()` (timeout 8 s, siatka na
 *    zaległą kolejkę) był wołany WYŁĄCZNIE z `endActiveHumanTurn()`.
 *  - Ale `advanceSeat()` (klik HUD, klawisz N) najpierw sprawdza bramkę
 *    `canPlayerInitiateEndTurn()` (która odrzuca przy hasPendingAutoPreBattle()) i dopiero
 *    po niej dochodzi do `endActiveHumanTurn()`.
 *  - Więc przy zalegającej kolejce sprzątacz był NIEOSIĄGALNY: klik był odrzucany przez bramkę,
 *    a hint „Zakończ ekran bitwy" wskazywał na bitwę, której nie widać. Deadlock trwały.
 *  - Istniejące testy to potwierdzają: koniec-tury-g1-g2-runda4-test.cjs pin A9 oraz
 *    koniec-tury-f1-f4-runda3-test.cjs pin F2-A11 (oba: triggerPlayerEndTurn woła sprzątacz jako
 *    PIERWSZĄ instrukcję, przed bramką) są na origin/main CZERWONE -- regresja po refaktorze
 *    R-HOTSEAT (triggerPlayerEndTurn stało się cienkim aliasem advanceSeat()).
 *  - Dodatkowo: kolejka może zostać „osierocona" (żądanie w kolejce, brak ekranu, brak blokującego
 *    modala), bo nic jej nie wznowiło (flush jest tylko w określonych punktach). Osierocony
 *    `overlayEl` odpięty od DOM zaś sprawiał, że isPreBattleOpen() === true przy niewidocznym ekranie.
 *
 * NAPRAWA (ZAŁOŻENIA: nie zmieniamy zachowania legalnej blokady, gdy ekran bitwy jest otwarty):
 *  1) advanceSeat() i triggerPlayerEndTurn() wołają sprzątacz PRZED bramką.
 *  2) healStuck...: na interaktywnej próbie, gdy nic nie blokuje, NAJPIERW pokazuje odłożoną bitwę
 *     (flushDeferredAutoPreBattle), a dopiero potem (jeśli ekranu nadal brak) sprawdza wiek i czyści.
 *     Pomijane w trakcie trwającej tury świata (endTurnInProgress).
 *  3) siatka bezpieczeństwa: healStaleEndTurnBlockers() planuje (setTimeout 0) flush, gdy kolejka
 *     jest niepusta, bez ekranu i bez blokującego modala. Timer ponownie sprawdza blokady.
 *  4) preBattle.ts: isPreBattleOpen() = overlayEl !== null && overlayEl.isConnected (osierocony
 *     overlay nie blokuje już końca tury).
 *
 * Części:
 *  A) PIN TEKSTOWY na main.ts i ui/preBattle.ts (kolejność wywołań, obecność siatki).
 *  B) REALNY bundel ui/preBattle.ts (esbuild + jsdom): kolejka z N bitwami drenuje się w skończonej
 *     liczbie kroków; osierocony overlay nie jest „otwarty"; legalne odroczenie (modal) nie
 *     gubi żądania.
 *
 * OGRANICZENIE (uczciwie): main.ts (monolityczny bootstrap) nie da się zbundlować do węzłowego
 * harnessu, więc zachowanie bramki/sprzątacza w main.ts jest pinowane tekstowo (część A), a
 * mechanika kolejki i isPreBattleOpen() jest dowodzona na prawdziwym ui/preBattle.ts (część B).
 *
 * Usage (z gra/): node tools/endturn-battle-deadlock-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const PREBATTLE_TS = path.join(__dirname, '..', 'src', 'ui', 'preBattle.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const preSrc = fs.readFileSync(PREBATTLE_TS, 'utf8');

// Wyciąga ciało funkcji zaczynającej się od `header` do początku następnej deklaracji `function `
// na tym samym poziomie wcięcia (4 spacje w main.ts). Zwraca '' gdy brak.
function bodyOf(src, header, indentNextFn) {
  const start = src.indexOf(header);
  if (start < 0) return '';
  const next = src.indexOf('\n' + indentNextFn + 'function ', start + header.length);
  return next > start ? src.slice(start, next) : src.slice(start);
}

// ---------------------------------------------------------------------------
// A) PIN TEKSTOWY
// ---------------------------------------------------------------------------
{
  const advBody = bodyOf(mainSrc, 'function advanceSeat(): void {', '    ');
  const healIdx = advBody.indexOf('healStuckDeferredPreBattleQueueOnEndTurnAttempt();');
  const gateIdx = advBody.indexOf('if (!canPlayerInitiateEndTurn())');
  ok(advBody.length > 0, '[A1-setup] znaleziono function advanceSeat(');
  ok(healIdx >= 0 && gateIdx > healIdx,
    '[A1] advanceSeat(): sprzątacz kolejki (healStuck...) wołany PRZED bramką canPlayerInitiateEndTurn() -- inaczej zalegająca kolejka blokuje sprzątanie (sedno deadlocka)');
}

{
  const tpet = bodyOf(mainSrc, 'function triggerPlayerEndTurn(): void {', '    ');
  const healIdx = tpet.indexOf('healStuckDeferredPreBattleQueueOnEndTurnAttempt();');
  const gateIdx = tpet.indexOf('if (!canPlayerInitiateEndTurn())');
  ok(healIdx >= 0 && gateIdx > healIdx,
    '[A2] triggerPlayerEndTurn(): sprzątacz PRZED bramką (ta sama kolejność co advanceSeat)');
}

{
  const heal = bodyOf(mainSrc, 'function healStuckDeferredPreBattleQueueOnEndTurnAttempt(): void {', '    ');
  const flushIdx = heal.indexOf('flushDeferredAutoPreBattle();');
  const ageIdx = heal.indexOf('oldestPendingAutoPreBattleAgeMs();');
  const openAfterFlush = /flushDeferredAutoPreBattle\(\);\s*\n\s*(?:\/\/[^\n]*\n\s*)*if \(isPreBattleOpen\(\)\) return;/.test(heal);
  ok(heal.length > 0, '[A3-setup] znaleziono function healStuckDeferredPreBattleQueueOnEndTurnAttempt(');
  ok(flushIdx >= 0 && ageIdx > flushIdx && openAfterFlush,
    '[A3] healStuck...: NAJPIERW flushDeferredAutoPreBattle() (pokaż odłożoną bitwę), POTEM `if (isPreBattleOpen()) return;`, DOPIERO potem wiek/czyszczenie');
  ok(/if \(!endTurnInProgress\) flushDeferredAutoPreBattle\(\);/.test(heal),
    '[A3b] flush w healStuck jest pominięty w trakcie trwającej tury świata (endTurnInProgress)');
  ok(/if \(ageMs <= 8000\) return;/.test(heal) && /clearDeferredAutoPreBattleQueue\(\);/.test(heal),
    '[A3c] próg 8000ms i czyszczenie zachowane (siatka na naprawdę martwą kolejkę)');
}

{
  // Bramka NIE osłabiona: canPlayerInitiateEndTurn nadal blokuje przy hasPendingAutoPreBattle().
  const gate = bodyOf(mainSrc, 'function canPlayerInitiateEndTurn(): boolean {', '    ');
  ok(/if \(isPreBattleOpen\(\) \|\| hasPendingAutoPreBattle\(\)\) \{/.test(gate),
    '[A4] bramka canPlayerInitiateEndTurn() NADAL blokuje przy isPreBattleOpen()||hasPendingAutoPreBattle() -- legalna blokada nie została osłabiona');
  const hint = bodyOf(mainSrc, 'function hintEndTurnBlocked(): void {', '    ');
  ok(/if \(isPreBattleOpen\(\) \|\| hasPendingAutoPreBattle\(\)\) \{/.test(hint),
    '[A4b] podpowiedź hintEndTurnBlocked() nadal odzwierciedla blokadę');
}

{
  // Siatka: healStaleEndTurnBlockers planuje watchdog, a watchdog wznawia flush i sprawdza blokady.
  const stale = bodyOf(mainSrc, 'function healStaleEndTurnBlockers(): void {', '    ');
  ok(/maybeScheduleDeferredPreBattleQueueWatchdog\(\);/.test(stale),
    '[A5] healStaleEndTurnBlockers() planuje siatkę bezpieczeństwa (maybeScheduleDeferredPreBattleQueueWatchdog)');
  const maybe = bodyOf(mainSrc, 'function maybeScheduleDeferredPreBattleQueueWatchdog(): void {', '    ');
  ok(/hasPendingAutoPreBattle\(\)/.test(maybe) && /isPreBattleOpen\(\)/.test(maybe)
    && /isDiplomacyAudienceOpen\(\)/.test(maybe) && /isArmyMergePanelOpen\(\)/.test(maybe)
    && /scheduleDeferredPreBattleQueueWatchdog\(\);/.test(maybe),
    '[A5b] siatka planuje timer tylko gdy kolejka niepusta, brak ekranu, brak audiencji i brak scalenia armii');
  const sched = bodyOf(mainSrc, 'function scheduleDeferredPreBattleQueueWatchdog(): void {', '    ');
  ok(/window\.setTimeout\(\(\) => \{/.test(sched) && /flushDeferredAutoPreBattle\(\);/.test(sched)
    && /if \(endTurnInProgress\) return;/.test(sched) && /if \(isPreBattleOpen\(\) \|\| isDiplomacyAudienceOpen\(\) \|\| isArmyMergePanelOpen\(\)\) return;/.test(sched),
    '[A5c] watchdog (setTimeout 0) ponownie sprawdza blokady (w tym endTurnInProgress) przed flushem');
}

{
  // Osierocony overlay nie liczy się jako otwarty ekran bitwy.
  const isOpen = bodyOf(preSrc, 'export function isPreBattleOpen(): boolean {', '');
  ok(/return overlayEl !== null && overlayEl\.isConnected;/.test(isOpen),
    '[A6] preBattle.ts: isPreBattleOpen() = overlayEl !== null && overlayEl.isConnected (osierocony overlay nie blokuje końca tury)');
}

// ---------------------------------------------------------------------------
// B) REALNY bundel ui/preBattle.ts (esbuild + jsdom)
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[endturn-battle-deadlock-test] jsdom missing -- npm ci w gra/');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.endturn-deadlock-entry.ts');
  const OUT = path.join(__dirname, '.endturn-deadlock-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'endturn-deadlock-brandAssets-stub.ts');

  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(BRAND_STUB, [
    'export function terrainIconSvg() { return \'\'; }',
    'export function civIconSvg() { return \'\'; }',
    'export function brandIconSvg() { return \'\'; }',
    'export function unitIconSvg() { return \'\'; }',
  ].join('\n'), 'utf8');
  const LEADER_STUB = path.join(STUB_DIR, 'endturn-deadlock-leaderPortraits-stub.ts');
  fs.writeFileSync(LEADER_STUB, [
    'export function leaderPortraitUrl() { return null; }',
    'export function leaderName() { return \'\'; }',
  ].join('\n'), 'utf8');
  const AUDIO_STUB = path.join(STUB_DIR, 'endturn-deadlock-audio-stub.ts');
  fs.writeFileSync(AUDIO_STUB, [
    'export function startPreBattleMusic() {}',
    'export function stopPreBattleMusic() {}',
  ].join('\n'), 'utf8');
  const HUD_STUB = path.join(STUB_DIR, 'endturn-deadlock-hud-stub.ts');
  fs.writeFileSync(HUD_STUB, 'export function setArmyStackHudSuppressed() {}\n', 'utf8');

  fs.writeFileSync(ENTRY, [
    'export {',
    '  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,',
    '  hasPendingAutoPreBattle,',
    "} from '../src/ui/preBattle.ts';",
  ].join('\n'), 'utf8');

  const stubPlugin = {
    name: 'stub-endturn-deadlock',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({ path: AUDIO_STUB }));
      build.onResolve({ filter: /hud$/ }, () => ({ path: HUD_STUB }));
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
    plugins: [stubPlugin],
  });

  const {
    showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle,
    flushDeferredAutoPreBattle, hasPendingAutoPreBattle,
  } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  let audienceOpen = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => audienceOpen });

  function battleInfo(label) {
    return {
      atakujacy: {
        nazwa: 'Barbarzyncy', ownerId: 99,
        units: [{ nazwa: 'Wojownik ' + label, kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
      },
      obronca: {
        nazwa: 'Osada', ownerId: 0,
        units: [{ nazwa: 'Milicja', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
      },
      teren: 'Rownina', szanseAtkPct: 30, miejsce: 'Bitwa ' + label, tura: 43, canRetreat: false,
    };
  }
  const cb = () => ({ onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} });
  const shownTitle = () => {
    const t = document.querySelector('.pb-ttl');
    return t ? (t.textContent || '') : '';
  };

  // B1) ODTWORZENIE STANU Z ZGŁOSZENIA: bitwa wojenna odłożona w kolejce, ekranu brak, nic nie
  //     blokuje. Stan „osierocony" -- hasPending=true, isPreBattleOpen=false. Przed naprawą to
  //     była trwała blokada końca tury; teraz siatka (flush) musi tę bitwę pokazać.
  showPreBattle(battleInfo('WOJNA-1'), cb(), { auto: true });            // pokazana
  audienceOpen = true;
  showPreBattle(battleInfo('WOJNA-2'), cb(), { auto: true });            // odłożona (audiencja)
  ok(hasPendingAutoPreBattle() === true, '[B1-setup] WOJNA-2 odłożona w kolejce');
  // Gracz zamyka audiencję BEZ flusha (ścieżka, której nic nie wznawia) i rozstrzyga WOJNA-1
  // bez wywołania flusha:
  audienceOpen = false;
  hidePreBattle();
  ok(isPreBattleOpen() === false && hasPendingAutoPreBattle() === true,
    '[B1] stan osierocony odtworzony: kolejka niepusta, ekranu brak, blokady brak (to był deadlock)');
  flushDeferredAutoPreBattle();                                           // to, co robi siatka/heal
  ok(isPreBattleOpen() === true && /WOJNA-2/.test(shownTitle()),
    '[B1b] flush (siatka bezpieczeństwa) POKAZUJE odłożoną bitwę WOJNA-2 zamiast zostawiać ją w kolejce');
  hidePreBattle();
  ok(hasPendingAutoPreBattle() === false && isPreBattleOpen() === false,
    '[B1c] po rozstrzygnięciu WOJNA-2 kolejka pusta, brak ekranu -- koniec tury nie ma czym być zablokowany');

  // B2) OSIEROCONY OVERLAY: overlay odpięty od DOM bez hidePreBattle() NIE może być „otwartym"
  //     ekranem bitwy (przed naprawą isPreBattleOpen() zwracało true i blokowało sprzątanie).
  showPreBattle(battleInfo('ORPHAN'), cb());                              // ręczna akcja
  ok(isPreBattleOpen() === true, '[B2-setup] bitwa ORPHAN otwarta');
  for (const el of Array.from(document.querySelectorAll('.pb-overlay'))) el.remove();
  ok(isPreBattleOpen() === false,
    '[B2] osierocony overlay (odpięty od DOM) NIE liczy się jako otwarty ekran bitwy -- isPreBattleOpen()===false');
  // Po osieroceniu kolejna bitwa musi się pokazać (nie zostać zablokowana przez martwy overlay).
  showPreBattle(battleInfo('AFTER-ORPHAN'), cb(), { auto: true });
  ok(isPreBattleOpen() === true && /AFTER-ORPHAN/.test(shownTitle()),
    '[B2b] po osieroceniu nowa bitwa (auto) pokazuje się natychmiast -- martwy overlay nie wiesza kolejki');
  hidePreBattle();

  // B3) DRENAŻ KOLEJKI W SKOŃCZONEJ LICZBIE KROKÓW: N=4 bitwy wojenne w jednym ticku, rozstrzygane
  //     po kolei. Pętla siatki (flush + rozstrzygnięcie) musi opróżnić kolejkę w ≤ N+1 krokach
  //     i pokazać każdą dokładnie raz, w kolejności FIFO.
  audienceOpen = false;
  const N = 4;
  showPreBattle(battleInfo('W0'), cb(), { auto: true });
  for (let i = 1; i < N; i++) showPreBattle(battleInfo('W' + i), cb(), { auto: true });
  const shownOrder = [];
  let steps = 0;
  const MAX_STEPS = N + 2;
  while (steps < MAX_STEPS) {
    steps++;
    const t = shownTitle();
    const m = /Bitwa (W\d+)/.exec(t);
    if (isPreBattleOpen() && m) {
      shownOrder.push(m[1]);
      hidePreBattle();                       // gracz rozstrzyga bieżącą bitwę
    }
    flushDeferredAutoPreBattle();            // siatka / flush po rozstrzygnięciu
    if (!hasPendingAutoPreBattle() && !isPreBattleOpen()) break;
  }
  ok(hasPendingAutoPreBattle() === false && isPreBattleOpen() === false,
    '[B3] kolejka N=4 opróżnia się w skończonej liczbie kroków (brak ducha blokującego koniec tury)');
  ok(JSON.stringify(shownOrder) === JSON.stringify(['W0', 'W1', 'W2', 'W3']),
    '[B3b] każda z 4 bitew pokazana dokładnie raz, FIFO -- żadna nie zginęła ani nie została zdublowana; got ' + JSON.stringify(shownOrder));

  // B4) LEGALNE ODROCZENIE NIE GUBI ŻĄDANIA: gdy audiencja jest otwarta, flush nic nie robi, a
  //     żądanie zostaje w kolejce (siatka też nie może go wtedy pokazać ani skasować).
  audienceOpen = true;
  showPreBattle(battleInfo('LEGAL-1'), cb(), { auto: true });
  showPreBattle(battleInfo('LEGAL-2'), cb(), { auto: true });
  ok(isPreBattleOpen() === false && hasPendingAutoPreBattle() === true,
    '[B4-setup] przy otwartej audiencji automatyczne żądania są odraczane (nic nie pokazane)');
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === false && hasPendingAutoPreBattle() === true,
    '[B4] przy otwartej audiencji flush jest no-opem, żądanie zostaje w kolejce (legalne odroczenie, nie kasowane)');
  audienceOpen = false;
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[B4b] po zamknięciu audiencji odroczona bitwa się pokazuje');
  hidePreBattle();
  flushDeferredAutoPreBattle();
  hidePreBattle();
  flushDeferredAutoPreBattle();
  ok(hasPendingAutoPreBattle() === false, '[B4c] kolejka ostatecznie pusta po rozstrzygnięciu');

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
  try { fs.unlinkSync(BRAND_STUB); } catch { /* ignore */ }
  try { fs.unlinkSync(LEADER_STUB); } catch { /* ignore */ }
  try { fs.unlinkSync(AUDIO_STUB); } catch { /* ignore */ }
  try { fs.unlinkSync(HUD_STUB); } catch { /* ignore */ }
}

async function main() {
  await runUiPart();
  console.log(`\nendturn-battle-deadlock-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
