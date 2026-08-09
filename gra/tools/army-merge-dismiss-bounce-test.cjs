'use strict';
/**
 * army-merge-dismiss-bounce-test.cjs
 *
 * ZGŁOSZENIE BLOKUJĄCE (Maciej, playtest 2026-07-26, bundel 17ca0a4f): "jest
 * jakiś błąd, nie mogę pójść dalej ze zwiadowcą, bo za każdym razem cofa mnie
 * z powrotem do miasta na zakończenie tury" -- doprecyzowane później: cofa NIE
 * ZAWSZE do miasta/punktu startu, czasem w inne, pozornie losowe miejsca.
 *
 * PRZYCZYNA (main.ts + ui/armyMergePanel.ts -- NIE regresja z dzisiejszych
 * commitów garnizonu a08d7a6/1c53024; panel i kolejka odroczonych promptów
 * istnieją od 1f64217, 2026-07-22 -- ale to WŁAŚNIE ta ścieżka teleportuje
 * jednostki, którym gracz dopiero co wydał rozkaz ruchu):
 *
 * Gdy jednostka gracza kończy ruch na heksie, na którym już stoi INNA własna
 * jednostka, main.ts (promptMergeIfCoLocated) pokazuje modal "Połączenie
 * armii" (ui/armyMergePanel.ts, showArmyMergePanel) z dwoma przyciskami:
 * "Połącz armie" (onMerge, BEZ efektu ubocznego na pozycję) i "Zostaw osobno"
 * (onSeparate, main.ts ~5789-5803: assignBounceHexesForUnits PRZESUWA właśnie
 * przybyłą jednostkę z powrotem w stronę heksu, z którego wyszła -- dokładnie
 * jak w army-merge-bounce-test.cjs: heks startowy, jeśli wolny, inaczej losowy
 * sąsiad).
 *
 * Ten modal potrafi wyskoczyć ODROCZONY (main.ts flushDeferredMergePrompts,
 * gdy `endTurnInProgress` był `true` w chwili naturalnego zakończenia
 * animacji ruchu) DOKŁADNIE na przełomie tury -- czyli w momencie, w którym
 * gracz najczęściej klika w mapę, żeby wydać KOLEJNY rozkaz. Do dzisiaj
 * (przed tym fixem) armyMergePanel.ts traktował:
 *   - klik w przyciemnione tło poza panelem,
 *   - klawisz Escape,
 * jako RÓWNOWAŻNE świadomemu kliknięciu "Zostaw osobno" -- czyli KAŻDY
 * przypadkowy klik w mapę / Escape, który trafił w niezauważony modal,
 * SAMOCZYNNIE teleportował właśnie ruszoną jednostkę z powrotem w stronę
 * punktu startu (albo sąsiedniego heksu, jeśli punkt startu akurat zajęty --
 * stąd „czasem do miasta, czasem gdzieś indziej" w drugim doprecyzowaniu).
 *
 * FIX: dismiss (klik w tło / Escape) w ui/armyMergePanel.ts mapuje się teraz
 * na onMerge (bez efektu ubocznego na pozycję) zamiast na onSeparate.
 *
 * Ten test PADA bez poprawki (dismiss -> onSeparate -> bounce z powrotem) i
 * przechodzi po niej (dismiss -> onMerge -> pozycja bez zmian).
 *
 * Usage (z gra/): node tools/army-merge-dismiss-bounce-test.cjs
 *
 * OGRANICZENIE UCZCIWIE PRZYZNANE (wzorzec z tools/danina-podatek-tooltip-ui-test.cjs):
 * main.ts (17+ tys. linii, monolityczny bootstrap zależny od document/window/
 * three.js, bez eksportowanych funkcji) nie da się zbundlować do tego node'owego
 * harnessu. `simulateMoveWithMergePrompt()` niżej ODTWARZA sekwencję main.ts
 * (startAnimatedMove -> zapis pozycji po animacji -> promptMergeIfCoLocated)
 * DOSŁOWNIE tymi samymi wywołaniami realnych, zbundlowanych funkcji z
 * game/armyMerge.ts, a `showArmyMergePanel`/dismiss jest zbundlowany NAPRAWDĘ
 * z ui/armyMergePanel.ts -- to jest właśnie warstwa pod testem.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[army-merge-dismiss-bounce-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY (2026-08-08, nota N5 Evaluatora
// zwiadowca-drewno): NIE 'brandAssets-stub.ts' — ten plik jest współdzielony
// i ŚLEDZONY w gicie (patrz danina-podatek-tooltip-ui-test.cjs), a jego
// zawartość różni się między bramkami. Każde uruchomienie brudziło
// niezwiązany trackowany plik w git status. Nazwa własna dla tej bramki
// (wzorem pre-battle-brandAssets-stub.ts / brandAssets-diplo-treaty-stub.ts)
// trzyma stub poza współdzielonym plikiem.
const STUB_FILE = path.resolve(STUB_DIR, 'army-merge-brandAssets-stub.ts');
const ENTRY = path.join(__dirname, '.army-merge-dismiss-entry.ts');
const BUNDLE = path.join(__dirname, '.army-merge-dismiss-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
// armyMergePanel.ts -> icons/brandAssets.ts robi Vite-owy `import X from '*.svg?raw'`
// + `import.meta.glob(...)` -- esbuild w trybie node/cjs tego nie obsługuje, a treść
// ikon jest tu bez znaczenia (test nie asercjonuje wyglądu ikon, tylko logikę
// dismiss/onSeparate/onMerge), więc podmieniamy moduł na lekki stub.
fs.writeFileSync(STUB_FILE, "export function unitIconSvg() { return ''; }\n", 'utf8');

fs.writeFileSync(
  ENTRY,
  [
    "export { showArmyMergePanel, hideArmyMergePanel, isArmyMergePanelOpen } from '../src/ui/armyMergePanel.ts';",
    "export { exitGarnizon, activeUnitStack, assignBounceHexesForUnits } from '../src/game/armyMerge.ts';",
  ].join('\n'),
  'utf8',
);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[army-merge-dismiss-bounce-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const {
    showArmyMergePanel,
    hideArmyMergePanel,
    isArmyMergePanelOpen,
    exitGarnizon,
    activeUnitStack,
    assignBounceHexesForUnits,
  } = require(BUNDLE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  let pass = 0;
  let fail = 0;
  function assert(cond, msg) {
    if (cond) { pass++; console.log('  [OK]', msg); }
    else { fail++; console.error('  [FAIL]', msg); }
  }

  function isPassable() { return true; }

  /**
   * Odtwarza dokładnie sekwencję main.ts: startAnimatedMove (exitGarnizon +
   * activeUnitStack liczony PO zdjęciu flagi garnizonu) -> zapis pozycji po
   * animacji (main.ts ~16572-16575) -> promptMergeIfCoLocated (main.ts ~5725,
   * bo docelowy heks jest już zajęty przez inną jednostkę) -> onSeparate
   * wpięty pod main.ts ~5789-5803 (assignBounceHexesForUnits + mutacja u.q/u.r).
   */
  function simulateMoveWithMergePrompt(units, moverId, fromQR, destQR) {
    const u = units.find(x => x.id === moverId);
    exitGarnizon(u);
    const stack = activeUnitStack(units, u);
    const movingIds = stack.map(s => s.id);

    for (const su of stack) {
      su.q = destQR.q;
      su.r = destQR.r;
    }

    const onDestHex = units.filter(
      x => x.ownerId === u.ownerId && x.q === destQR.q && x.r === destQR.r && x.inGarnizon !== true,
    );
    const existing = onDestHex.filter(x => !movingIds.includes(x.id));
    if (existing.length === 0) return { dialogShown: false };

    let mergeCalled = false;
    let separateCalled = false;

    showArmyMergePanel({
      hexLabel: '(' + destQR.q + ',' + destQR.r + ')',
      existing: existing.map(x => ({ id: x.id, name: x.typeId })),
      arriving: { id: u.id, name: u.typeId },
      arrivingCount: movingIds.length,
      rejectFrom: { q: fromQR.q, r: fromQR.r },
      moveCost: 1,
      onMerge: () => { mergeCalled = true; },
      onSeparate: () => {
        separateCalled = true;
        // main.ts ~5790-5803, dosłownie.
        const bounces = assignBounceHexesForUnits(units, fromQR.q, fromQR.r, movingIds, isPassable);
        for (const [id, pos] of bounces) {
          const mu = units.find(x => x.id === id);
          if (mu) { mu.q = pos.q; mu.r = pos.r; }
        }
      },
    });

    return { dialogShown: true, getMergeCalled: () => mergeCalled, getSeparateCalled: () => separateCalled };
  }

  console.log('army-merge-dismiss-bounce-test (R-MERGE-DISMISS, zgloszenie blokujace 2026-07-26)\n');

  // -------------------------------------------------------------------------
  // SCENARIUSZ 1 (zgłoszenie właściciela, dosłownie): zwiadowca w garnizonie
  // miasta -> rozkaz ruchu na sąsiedni heks, na którym już stoi inna jednostka
  // (np. straż pilnująca okolic stolicy) -> modal "Połączenie armii" wyskakuje
  // -> gracz przypadkowo klika w mapę / Escape, zanim świadomie zareaguje ->
  // jednostka NIE MOŻE zostać cofnięta w stronę miasta.
  // -------------------------------------------------------------------------
  {
    const units = [
      { id: 'scout', ownerId: 0, q: 5, r: 5, typeId: 'Zwiadowca', ruch: 3, ruchLeft: 3, inGarnizon: true, sentry: true },
      { id: 'sentry-unit', ownerId: 0, q: 6, r: 5, typeId: 'Wojownik', ruch: 1, ruchLeft: 1 },
    ];

    const res = simulateMoveWithMergePrompt(units, 'scout', { q: 5, r: 5 }, { q: 6, r: 5 });
    assert(res.dialogShown === true, 'modal Polaczenie armii pokazany (heks docelowy zajety)');
    assert(isArmyMergePanelOpen(), 'panel realnie otwarty w DOM');

    const scout = units.find(x => x.id === 'scout');
    assert(scout.q === 6 && scout.r === 5, 'PRZED dismissem: zwiadowca stoi tam, gdzie go wyslano (6,5)');

    const overlay = document.querySelector('.civ-amp-overlay');
    assert(overlay != null, 'overlay .civ-amp-overlay istnieje w DOM');
    overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    assert(!isArmyMergePanelOpen(), 'panel zamknal sie po kliku w tlo');
    assert(res.getSeparateCalled() === false, 'dismiss NIE wywoluje onSeparate (Zostaw osobno)');
    assert(res.getMergeCalled() === true, 'dismiss mapuje sie na onMerge (bezpieczny, bez ruchu jednostek)');
    assert(
      scout.q === 6 && scout.r === 5,
      'PO dismissie: zwiadowca WCIAZ na (6,5) -- NIE zostal cofniety do miasta (5,5). Bylo: ' + scout.q + ',' + scout.r,
    );
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ 2: Escape zamiast kliku w tlo -- ten sam efekt (drugie
  // doprecyzowanie: "cofa jednostke... w rozne strony, nie wiadomo dlaczego" --
  // Escape jest jeszcze latwiej nacisnac przypadkiem niz trafic kursorem w tlo).
  // -------------------------------------------------------------------------
  {
    const units = [
      { id: 'scout2', ownerId: 0, q: 10, r: 10, typeId: 'Zwiadowca', ruch: 3, ruchLeft: 3 },
      { id: 'other', ownerId: 0, q: 11, r: 10, typeId: 'Oszczepnik', ruch: 2, ruchLeft: 2 },
    ];

    const res = simulateMoveWithMergePrompt(units, 'scout2', { q: 10, r: 10 }, { q: 11, r: 10 });
    assert(res.dialogShown === true, 'S2: modal pokazany');

    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    const scout2 = units.find(x => x.id === 'scout2');
    assert(!isArmyMergePanelOpen(), 'S2: panel zamknal sie po Escape');
    assert(res.getSeparateCalled() === false, 'S2: Escape NIE wywoluje onSeparate');
    assert(
      scout2.q === 11 && scout2.r === 10,
      'S2: PO Escape zwiadowca WCIAZ na (11,10), nie cofniety. Bylo: ' + scout2.q + ',' + scout2.r,
    );
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ 3: swiadomy wybor gracza "Zostaw osobno" MUSI nadal dzialac
  // (przycisk, nie dismiss) -- fix dotyczy WYLACZNIE dismissu, nie usuwa
  // funkcjonalnosci "Zostaw osobno" jako swiadomej decyzji gracza.
  // -------------------------------------------------------------------------
  {
    const units = [
      { id: 'scout3', ownerId: 0, q: 20, r: 20, typeId: 'Zwiadowca', ruch: 3, ruchLeft: 3 },
      { id: 'blocker', ownerId: 0, q: 21, r: 20, typeId: 'Wojownik', ruch: 1, ruchLeft: 1 },
    ];
    const res = simulateMoveWithMergePrompt(units, 'scout3', { q: 20, r: 20 }, { q: 21, r: 20 });
    assert(res.dialogShown === true, 'S3: modal pokazany');

    const sepBtn = [...document.querySelectorAll('button')].find(b => b.getAttribute('data-act') === 'sep');
    assert(sepBtn != null, 'S3: przycisk "Zostaw osobno" istnieje');
    sepBtn.click();

    assert(res.getSeparateCalled() === true, 'S3: swiadomy klik "Zostaw osobno" nadal wywoluje onSeparate');
    const scout3 = units.find(x => x.id === 'scout3');
    assert(
      scout3.q === 20 && scout3.r === 20,
      'S3: po swiadomym "Zostaw osobno" jednostka wraca do (wolnego) punktu startu -- to oczekiwane, celowe dzialanie przycisku',
    );
  }

  hideArmyMergePanel();

  console.log('\narmy-merge-dismiss-bounce-test: ' + pass + ' pass, ' + fail + ' fail');

  try { fs.unlinkSync(ENTRY); } catch (_) { /* noop */ }

  process.exit(fail > 0 ? 1 : 0);
}

main();
