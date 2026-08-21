# 01-operator — R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1
GOAL: komunikat o nowym odkryciu (popup karty odkrycia technologii,
`gra/src/ui/techDiscoveryNotice.ts`) nigdy nie wychodzi poza obrys ekranu —
twardy margines od góry/dołu viewportu; dla treści dłuższej niż dostępna
wysokość — scrollowalny obszar wewnątrz karty ze złotym (nie systemowym
szarym) paskiem przewijania.

## Recon (krok 1-2 z dyspozycji)

1. Kontener karty `.tdn-card` (linia ~226) JUŻ MIAŁ twardy margines
   viewportowy: `max-height:calc(100vh - 36px)` (36px = 2×18px paddingu hosta
   `#civ-tech-discovery-notice-host{padding:18px}`) — to od redesignu w
   commit `83405147` (feat: trzy karty od Designu). Karta jest
   `display:flex;flex-direction:column`, nagłówek (`.tdn-head`) i stopka
   (`.tdn-foot`) mają `flex:none`, a wewnętrzny obszar treści `.tdn-scroll`
   ma `flex:1;min-height:0;overflow:auto` — czyli STRUKTURALNIE overflow już
   był poprawnie izolowany na wewnętrznym obszarze (nie na całym oknie/tle),
   nagłówek i przycisk zamknięcia zostają widoczne/przypięte. Brakującym
   elementem względem GOAL było WYŁĄCZNIE brak custom złotego paska
   przewijania na `.tdn-scroll` — bez niego przeglądarka renderuje domyślny
   systemowy (szary) scrollbar, co i tak łamie wymóg z dyspozycji.
2. Wzorzec złotego scrollbara już istnieje w kodzie i jest spójny w kilku
   modułach (`cityPanel.ts`, `preBattle.ts`, `postBattleSummary.ts`):
   `scrollbar-width:thin` + (Firefox) `scrollbar-color:rgba(232,216,138,.25)
   transparent` + (WebKit) `::-webkit-scrollbar{width:5px}` +
   `::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);
   border-radius:4px}`. Wybrałem wariant z `preBattle.ts`/`postBattleSummary.ts`
   (nie `cityPanel.ts`) bo używa dokładnie tego samego odcienia złota
   `rgba(232,216,138,...)`, który JUŻ jest używany wszędzie w
   `techDiscoveryNotice.ts` (obramowania sekcji, tekst, itd.) — spójność
   koloru w obrębie tego samego pliku, nie tylko "jakiś złoty".

## Zmiana (krok 3)

- `.tdn-scroll`: `overflow:auto` → `overflow-y:auto;overflow-x:hidden` (bez
  poziomego scrolla treści karty) + dodane 3 reguły złotego scrollbara
  (thin/webkit width 5px/webkit thumb rgba gold).
- `STYLE_ID` podbity `v2` → `v3` (ten sam wzorzec co poprzedni bump `v1`→`v2`
  w tej samej sesji dla zmiany CSS w tym pliku) — `ensureStyles()` robi
  early-return jeśli tag stylu o danym ID już istnieje w DOM, więc bez bumpu
  gracze z już otwartą sesją (stary `<style>` w `document.head`) nie
  dostaliby nowego CSS bez pełnego przeładowania strony.
- Krok 4 (nie zmieniać treści/danych karty): niedotknięte — jedyna zmiana to
  CSS `.tdn-scroll` i stała `STYLE_ID`.

Twardy margines góra/dół NIE wymagał nowej wartości — istniejący
`calc(100vh - 36px)` już spełnia GOAL i jest spójny z paddingiem hosta w tym
samym module; zmiana nowej, niezależnej wartości byłaby niespójna bez
uzasadnienia (zgodnie z ograniczeniem z dyspozycji).

## TESTY

- `cd gra && npx tsc --noEmit`: 0 błędów przypisywalnych zmianie (jedyny
  output to pre-istniejący warning `TS5101` o deprecated `baseUrl` w
  `tsconfig.json` — zweryfikowane przez `git stash`/`stash pop`: identyczny
  output PRZED zmianą, więc niezwiązany z tym tematem).
- Build produkcyjny (`node ./node_modules/vite/bin/vite.js build --outDir
  dist --emptyOutDir`) NIE wykonany — `node_modules/vite/bin/vite.js` nie
  istnieje w tym worktree (brak `npm install` — zgodnie z zasadami nie
  uruchamiałem `npm run build`/`npm run dev`, a osobny `npm install` nie był
  częścią dyspozycji). Weryfikacja ograniczona do statycznej analizy CSS +
  `tsc --noEmit`; brak testu jednostkowego dla tego modułu w `gra/tools/`
  (sprawdzone: brak pliku `*techDiscovery*-test.cjs`).
- Wizualnie NIE zweryfikowano w przeglądarce (brak zbudowanego dist) — stąd
  PASS-WITH-NOTES zamiast PASS: logika CSS jest poprawna wg tego samego
  wzorca co 3 inne, już działające moduły w repo, ale bez renderu w
  przeglądarce Evaluator/Final Control powinien to potwierdzić wizualnie
  (screenshot z długą kartą, np. technologia z wieloma Budynkami/Jednostkami/
  Ulepszeniami — np. „Obróbka drewna" ze zgłoszenia właściciela).

## BLOKADY

Brak blokujących. Nota: brak `node_modules` w worktree uniemożliwił build
wizualny — jeśli Evaluator/Final Control ma dostęp do zainstalowanych
zależności, zalecana szybka wizualna weryfikacja tej jednej karty.

## ZMIANY/COMMIT

Plik: `gra/src/ui/techDiscoveryNotice.ts` (CSS `.tdn-scroll` + bump
`STYLE_ID`). Commit lokalny na branchu `autobot/R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1`
(SHA w raporcie integracji poniżej / `git log --oneline -1` po commicie).

## NASTĘPNY KROK

Evaluator: potwierdzić wizualnie (build + otwarcie karty z długą treścią) że
(a) karta nigdy nie wychodzi poza viewport, (b) scrollbar wewnętrzny jest
złoty a nie systemowy szary, (c) nagłówek/przycisk zamknięcia pozostają
widoczne przy scrollowaniu treści.

DEPLOY/PUSH: NIE WYKONANO
