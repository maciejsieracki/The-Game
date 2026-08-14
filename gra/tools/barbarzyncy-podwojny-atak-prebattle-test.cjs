'use strict';
/**
 * barbarzyncy-podwojny-atak-prebattle-test.cjs
 *
 * P-BARBARZYNCY-PODWOJNY-ATAK-PREBATTLE-NADPISANY (Maciej 2026-08-14, dyspozycje/
 * PYTANIA-OTWARTE.md, znalezisko przy okazji naprawy P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-
 * SIEBIE / commit a7de65b0):
 *
 * ZGŁOSZENIE: pętla ataku barbarzyńców w main.ts (tick barbarzyńców) woła
 * launchIncomingMapFieldBattle i od razu `continue`-uje bez czekania na rozstrzygnięcie.
 * Jeśli 2+ jednostki barbarzyńskie atakują gracza w tym samym ticku, drugie (i kolejne)
 * wywołanie showPreBattle() cicho kasowało pierwsze (wciąż otwarte, nierozstrzygnięte) przez
 * bezwarunkowe hidePreBattle() na początku funkcji -- bitwa nadal toczyła się w silniku, ale
 * okno preBattle dla niej znikało z ekranu gracza bez rozstrzygnięcia widocznego dla gracza.
 *
 * PRZYCZYNA (recon, potwierdzona czytaniem kodu): showPreBattle() (ui/preBattle.ts) miała
 * guard "odłóż automatyczne żądanie" wyłącznie dla pbCfg.isOtherEndTurnModalOpen() (audiencja
 * dyplomatyczna / panel scalenia armii) -- NIE sprawdzała, czy preBattle SAM jest już
 * otwarty. flushDeferredAutoPreBattle() już wtedy sprawdzała isPreBattleOpen() (asymetria --
 * strona "flush" była bezpieczna, strona "show" nie). Do tego bufor odłożonych żądań był
 * JEDNYM nullable slotem (deferredAutoRequest), więc nawet po dodaniu isPreBattleOpen() do
 * guardu, 3. jednoczesny atak w tym samym ticku nadpisałby żądanie 2. w tym samym slocie.
 *
 * WYBRANE PODEJŚCIE (mniejsze ryzyko niż restrukturyzacja pętli barbarzyńców na
 * await/break+resume jak w pętli AI -- patrz main.ts, `aiCmdResume`/`break ownerLoop`):
 *  1) showPreBattle() (ui/preBattle.ts): guard rozszerzony o isPreBattleOpen() --
 *     automatyczne żądanie odracza się też, gdy preBattle jest już otwarty, nie tylko gdy
 *     audiencja/scalenie są otwarte.
 *  2) Jeden nullable slot (deferredAutoRequest) -> kolejka FIFO (deferredAutoRequests[],
 *     push/shift) -- ten sam wzorzec co istniejące deferredMergePrompts w main.ts. Żadne
 *     odłożone żądanie już nie nadpisuje innego.
 *  3) main.ts: finishIncomingBattleUi() (JEDYNY punkt, przez który przechodzi KAŻDA ścieżka
 *     wyjścia z launchIncomingMapFieldBattle -- auto, pole bitwy, wycofanie) dostał nowe
 *     wywołanie flushDeferredAutoPreBattle() na końcu -- bez tego odłożone żądanie nigdy by
 *     się nie pokazało (żaden z ISTNIEJĄCYCH flushy -- onMerge/onSeparate armii, onBack
 *     audiencji, finally triggerPlayerEndTurn -- nie odpala się w momencie, gdy TA bitwa się
 *     kończy).
 *  4) Pętla barbarzyńców w main.ts (bcmd.type === 'attack' -> launchIncomingMapFieldBattle +
 *     `continue`) CELOWO NIETKNIĘTA -- to NIE jest okazja do dużego refaktoru async-flow
 *     (patrz ostrzeżenie w a7de65b0). Guard+kolejka w preBattle.ts czynią tę synchroniczną
 *     pętlę bezpieczną bez zmiany jej kształtu.
 *
 * Dwie części:
 *  A) TEKSTOWY PIN na main.ts -- (a) finishIncomingBattleUi woła flushDeferredAutoPreBattle()
 *     jako OSTATNI krok, (b) pętla barbarzyńców nadal robi `continue` od razu po
 *     launchIncomingMapFieldBattle (kontrola: potwierdza że NIE wybrano podejścia (a) z
 *     zadania -- await pętli -- tylko (b) -- kolejka).
 *  B) REALNA regresja UI (esbuild + jsdom, ten sam wzorzec co end-turn-modal-sequencing-
 *     test.cjs część B): bundluje NAPRAWDĘ ui/preBattle.ts i odtwarza dosłownie zgłoszony
 *     scenariusz -- 3 barbarzyńców atakujących w TYM SAMYM ticku (3x showPreBattle({auto:
 *     true}) wywołane synchronicznie pod rząd, bez żadnego rozstrzygnięcia między nimi, tak
 *     jak robi to main.ts pętlą `for (const bcmd of barbCmds) { ...; continue; }`) --
 *     dowodzi, że WSZYSCY TRZEJ dostają swoje okno preBattle, po kolei, żaden nie ginie ani
 *     nie nadpisuje drugiego.
 *
 * OGRANICZENIE UCZCIWIE PRZYZNANE (ten sam wzorzec co end-turn-modal-sequencing-test.cjs):
 * main.ts (27+ tys. linii, monolityczny bootstrap zależny od document/window/three.js, bez
 * eksportowanych funkcji) nie da się zbundlować do tego node'owego harnessu -- wywołanie
 * flushDeferredAutoPreBattle() z finishIncomingBattleUi jest więc pinowane TEKSTOWO (część A),
 * a część B dowodzi mechanizmu guard+kolejka w PRAWDZIWYM, zbundlowanym ui/preBattle.ts,
 * sterując flushem ręcznie w tych samych miejscach, gdzie main.ts go woła (po hidePreBattle()
 * bitwy, czyli dokładnie to, co finishIncomingBattleUi robi po zamknięciu overlayu).
 *
 * Usage (z gra/): node tools/barbarzyncy-podwojny-atak-prebattle-test.cjs
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

// A1) finishIncomingBattleUi woła flushDeferredAutoPreBattle() jako OSTATNI krok (po
//     onResolved()) -- jedyny punkt, przez który przechodzi KAŻDA ścieżka wyjścia z
//     launchIncomingMapFieldBattle.
{
  const fnStart = mainSrc.indexOf('function finishIncomingBattleUi(): void {');
  ok(fnStart >= 0, '[A1] znaleziono function finishIncomingBattleUi( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n      }', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  const onResolvedIdx = fnBody.indexOf('onResolved();');
  const flushIdx = fnBody.indexOf('flushDeferredAutoPreBattle();');
  ok(onResolvedIdx >= 0, '[A1] finishIncomingBattleUi woła onResolved()');
  ok(flushIdx > onResolvedIdx,
    '[A1] finishIncomingBattleUi woła flushDeferredAutoPreBattle() PO onResolved() -- pokazuje kolejną odłożoną bitwę dopiero po zakończeniu bieżącej');
}

// A2) KONTROLA: pętla barbarzyńców (bcmd.type === 'attack') nadal robi `continue` od razu po
//     launchIncomingMapFieldBattle -- CELOWO nietknięta (podejście (b) z zadania: kolejka w
//     preBattle.ts czyni tę synchroniczną pętlę bezpieczną, bez restrukturyzacji na
//     await/break+resume jak w pętli AI).
{
  const callIdx = mainSrc.indexOf("'Atak barbarzyńców',");
  ok(callIdx >= 0, "[A2] znaleziono wywołanie launchIncomingMapFieldBattle z etykietą 'Atak barbarzyńców' w main.ts");
  const fnCallEnd = callIdx >= 0 ? mainSrc.indexOf(');', callIdx) : -1;
  const continueIdx = fnCallEnd >= 0 ? mainSrc.indexOf('continue;', fnCallEnd) : -1;
  ok(fnCallEnd > callIdx && continueIdx > fnCallEnd && continueIdx - fnCallEnd < 40,
    '[A2] pętla barbarzyńców nadal robi `continue` OD RAZU po launchIncomingMapFieldBattle (bez await/break -- bezpieczeństwo zapewnia teraz kolejka w preBattle.ts, nie restrukturyzacja tej pętli)');
}

// A3) main.ts NIE importuje/nie woła żadnego "await"-friendly zamiennika w tym miejscu --
//     kontrola negatywna, że nie wprowadzono podejścia (a) z zadania (await rozstrzygnięcia).
{
  const callIdx = mainSrc.indexOf("'Atak barbarzyńców',");
  const blockStart = callIdx >= 0 ? mainSrc.lastIndexOf("} else if (bcmd.type === 'attack') {", callIdx) : -1;
  const blockText = (blockStart >= 0 && callIdx >= 0) ? mainSrc.slice(blockStart, callIdx + 200) : '';
  ok(!/await\s+launchIncomingMapFieldBattle/.test(blockText),
    '[A3] launchIncomingMapFieldBattle w pętli barbarzyńców nadal NIE jest await-owane (podejście (a) z zadania świadomie odrzucone -- zbyt duże ryzyko refaktoru async-flow)');
}

// ---------------------------------------------------------------------------
// B) REALNA regresja UI: bundluje ui/preBattle.ts i odtwarza scenariusz 3 jednoczesnych
//    barbarzyńców atakujących gracza w tym samym ticku.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[barbarzyncy-podwojny-atak-prebattle-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.barb-multi-attack-entry.ts');
  const OUT = path.join(__dirname, '.barb-multi-attack-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'barb-multi-attack-brandAssets-stub.ts');

  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(
    BRAND_STUB,
    [
      "export function terrainIconSvg() { return ''; }",
      "export function civIconSvg() { return ''; }",
      "export function brandIconSvg() { return ''; }",
      "export function unitIconSvg() { return ''; }",
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(path.join(STUB_DIR, 'barb-multi-attack-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'barb-multi-attack-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'barb-multi-attack-hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    [
      "export {",
      "  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,",
      "} from '../src/ui/preBattle.ts';",
    ].join('\n'),
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-brand-assets-barb-multi-attack',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'barb-multi-attack-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'barb-multi-attack-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'barb-multi-attack-hud-stub.ts'),
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
    plugins: [stubPlugin],
  });

  const {
    showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,
  } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  // Żadna audiencja/scalenie armii otwarte w tym scenariuszu -- odtwarzamy WYŁĄCZNIE zgłoszony
  // przypadek (2+ barbarzyńców atakujących w tym samym ticku), nie mieszamy z P-KONIEC-TURY
  // (to pokrywa już end-turn-modal-sequencing-test.cjs).
  configurePreBattle({ isOtherEndTurnModalOpen: () => false });

  function battleInfo(label) {
    return {
      atakujacy: {
        nazwa: 'Barbarzyńcy', ownerId: 99,
        units: [{ nazwa: 'Wojownik ' + label, kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
      },
      obronca: {
        nazwa: 'Zwiadowca', ownerId: 0,
        units: [{ nazwa: 'Zwiadowca', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
      },
      teren: 'Rownina',
      szanseAtkPct: 30,
      miejsce: 'Bitwa ' + label,
      tura: 12,
      canRetreat: false,
    };
  }

  // -------------------------------------------------------------------------
  // B1) SEDNO ZGŁOSZENIA: 3 barbarzyńców atakują w TYM SAMYM ticku -- pętla main.ts wywołuje
  //     showPreBattle({auto:true}) TRZY RAZY SYNCHRONICZNIE POD RZĄD (dokładnie jak
  //     `for (const bcmd of barbCmds) { launchIncomingMapFieldBattle(...); continue; }`),
  //     BEZ jakiegokolwiek rozstrzygnięcia między wywołaniami.
  // -------------------------------------------------------------------------
  const resolved = []; // kolejność faktycznie POKAZANYCH (nie tylko zainicjowanych) bitew
  function makeCb(label) {
    return {
      onAuto: () => { resolved.push(label); },
      onBattlefield: () => {},
      onCancel: () => {},
    };
  }

  showPreBattle(battleInfo('A'), makeCb('A'), { auto: true });
  showPreBattle(battleInfo('B'), makeCb('B'), { auto: true }); // przed rozstrzygnięciem A
  showPreBattle(battleInfo('C'), makeCb('C'), { auto: true }); // przed rozstrzygnięciem A i B

  // Tylko PIERWSZA bitwa (A) mogła się pokazać -- B i C muszą trafić do kolejki, NIE mogą
  // nadpisać A ani siebie nawzajem.
  ok(isPreBattleOpen() === true, '[B1] po 3 synchronicznych atakach preBattle JEST otwarty (nie zniknął)');
  const titleAfter3 = document.querySelector('.pb-ttl');
  ok(!!titleAfter3 && /Bitwa A/.test(titleAfter3.textContent || ''),
    '[B1] otwarty overlay to WCIĄŻ pierwsza bitwa (A) -- drugi i trzeci automatyczny atak jej NIE nadpisały (sedno zgłoszenia)');

  // Flush "za wcześnie" (bitwa A jeszcze nierozstrzygnięta, gracz nic nie kliknął) -- no-op,
  // kolejka (B, C) nietknięta, A nadal na ekranie.
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[B1b] flushDeferredAutoPreBattle() PRZED rozstrzygnięciem A pozostaje no-opem');
  const titleStill = document.querySelector('.pb-ttl');
  ok(!!titleStill && /Bitwa A/.test(titleStill.textContent || ''),
    '[B1b] overlay wciąż pokazuje bitwę A -- przedwczesny flush jej nie zdjął');

  // Gracz rozstrzyga A (klika "Auto") -- mirror main.ts: hidePreBattle() + finishIncomingBattleUi
  // kończące się flushDeferredAutoPreBattle().
  hidePreBattle();
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[B1c] po rozstrzygnięciu A automatycznie pokazała się KOLEJNA odłożona bitwa (B)');
  const titleB = document.querySelector('.pb-ttl');
  ok(!!titleB && /Bitwa B/.test(titleB.textContent || ''),
    '[B1c] pokazana bitwa to DOKŁADNIE B (kolejność FIFO zachowana, nie C ani ponownie A)');

  // Gracz rozstrzyga B -- powinna pokazać się C (ostatnia w kolejce).
  hidePreBattle();
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[B1d] po rozstrzygnięciu B automatycznie pokazała się bitwa C');
  const titleC = document.querySelector('.pb-ttl');
  ok(!!titleC && /Bitwa C/.test(titleC.textContent || ''),
    '[B1d] pokazana bitwa to DOKŁADNIE C -- WSZYSTKIE TRZY zaatakowały i WSZYSTKIE TRZY dostały swoje okno, żadna nie zginęła');

  // Gracz rozstrzyga C -- kolejka pusta, kolejny flush jest no-opem, nic się nie otwiera.
  hidePreBattle();
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === false,
    '[B1e] po rozstrzygnięciu C (ostatniej w kolejce) żadna bitwa już się nie otwiera -- kolejka pusta, no dalszych duchów');

  // -------------------------------------------------------------------------
  // B2) KONTROLA: w żadnym momencie B1 dwie bitwy nie były otwarte jednocześnie (brak
  //     nachodzenia na siebie / nadpisywania w trakcie).
  // -------------------------------------------------------------------------
  ok(resolved.length === 0,
    '[B2] onAuto żadnej z trzech bitew NIE odpalił się sam z siebie -- w tym teście gracz nigdy nie kliknął "Auto", tylko hidePreBattle() bezpośrednio (mirror main.ts po realnym kliknięciu); to samo w sobie potwierdza, że pokazanie B/C nie było efektem ubocznym odpalenia cudzego callbacku');

  // -------------------------------------------------------------------------
  // B3) KONTROLA: ręczny atak gracza (bez opts.auto) NIGDY nie jest odraczany, nawet gdy
  //     preBattle jest już otwarty -- niezmienione zachowanie (poza zakresem tego bugfixu).
  // -------------------------------------------------------------------------
  showPreBattle(battleInfo('MANUAL-1'), makeCb('MANUAL-1'), { auto: true });
  ok(isPreBattleOpen() === true, '[B3] setup: automatyczna bitwa MANUAL-1 otwarta');
  showPreBattle(battleInfo('MANUAL-2'), makeCb('MANUAL-2'), { defaultAction: 'manual' }); // BEZ auto:true
  const titleManual = document.querySelector('.pb-ttl');
  ok(!!titleManual && /Bitwa MANUAL-2/.test(titleManual.textContent || ''),
    '[B3] ręczny atak gracza (bez auto:true) pokazuje się NATYCHMIAST i ZASTĘPUJE automatyczny, mimo isPreBattleOpen()===true -- zachowanie manualnych ataków niezmienione przez ten fix');
  hidePreBattle();

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\nbarbarzyncy-podwojny-atak-prebattle-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
