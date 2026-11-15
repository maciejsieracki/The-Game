STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-ELIMINATION-WINDOW-FIXED-HEIGHT-SCROLL-Q1
GOAL: modal eliminacji / zdobycia miasta (`showCityCaptureNotice`) ma stałą maksymalną wysokość = widok minus margines, wyśrodkowany, treść przewija się wewnątrz okna; nagłówek nie jest przycinany; przycisk zamknięcia jest osiągalny przewijaniem; rozwinięcie „Pokaż wszystkie surowce” przewija się zamiast rozpychać okno.
ZMIANY/COMMIT: baza c9da8834a (origin/main, detached). Allowlista:
  - gra/src/ui/cityCaptureNotice.ts — CSS `.civ-ccn-overlay` (+overflow-y:auto, overscroll-behavior:contain) i `.civ-ccn` (max-height: calc(100vh-32px) z fallbackiem 100dvh, overflow-y:auto zamiast ukrytego, margin:auto, overscroll-behavior:contain). Tylko CSS.
  - gra/src/ui/eliminationSpectacle.ts — `.civ-ccn.civ-ccn-spectacle`: max-height calc(100vh-24px) → calc(100vh-32px) z fallbackiem 100dvh, + overscroll-behavior:contain. Tylko CSS.
  - gra/src/ui/civElimNotice.ts — `.cen-card` (dyplomatyczna eliminacja, jednoprzyciskowa): max-height calc(100vh-40px)/100dvh, overflow-y:auto. Tylko CSS (utwardzenie; nie była reprodukowana, patrz NOTY).
  - gra/tools/elimination-window-scroll-test.cjs — NOWY test real render (esbuild IIFE + Chromium/Playwright), 2 warianty × 4 rozmiary okna.
  - runs/R-WEB-UI-ELIMINATION-WINDOW-FIXED-HEIGHT-SCROLL-Q1/evidence/ — zrzuty PNG przed/po, logi bazy i po zmianie.
  Diff: 3 pliki src, 11 insertions / 3 deletions. Brak zmian logiki gry, gra/data, tekstów. Commit: patrz sekcja SHA na końcu.
TESTY:
  - `npx tsc --noEmit` (gra/): exit 0, pusty wynik (0 błędów).
  - Bramki referencyjne (z gra/): logic-test 213/213 (exit 0); research-test 33/33; combat-test „All sanity checks passed.” (exit 0); unit-power-test 6 pass / 0 fail (exit 0).
  - Istniejące testy eliminacji (po zmianie): elimination-spectacle-test 84 PASS / 0 FAIL; elimination-full-spoils-test 114 passed / 0 failed; elimination-toast-merge-test 56 passed / 0 failed.
  - wydarzenia-eliminacja-podboj-karta-test: 24 pass / 4 fail — ten sam wynik NA BAZIE c9da8834a (rozpakowany `git archive` w scratchpadzie, 24/4). Pre-existing, nie zależy od CSS: FAIL (0.5c) kicker „Dyplomacja” dla domyślnego cause, (6a–6c) wpis elim-cs-1-1 w warEventLog po turze. Nie naprawiane (poza allowlistą).
  - NOWY test elimination-window-scroll-test.cjs:
    * NA BAZIE (bez poprawki): 24 PASS / 20 FAIL (exit 1). Wszystkie 20 FAIL to wariant `nospec` (bilans zdobycia bez spectacle, 60 wierszy rozwijanych) w 4 rozmiarach. Surowy pomiar 1000x560: box.top = -942.3, box.bottom = 1502.3, wysokość 2444.6 px, overflow-y: hidden, scrollH = clientH = 2443 (brak przewijania), przycisk „Wróć na mapę” w top 1442 (poza widokiem). Dla 1280x720: box.top = -862.3, bottom 1582.3, h 2444.6, przycisk w top 1522 (nieosiągalny).
    * PO POPRAWCE: 44 PASS / 0 FAIL (exit 0). Pomiar 1000x560 nospec: box top 15, bottom 545, h 530, overflow-y auto, scrollH 2443 > clientH 528, po przewinięciu przycisk w widoku. Spectacle 1000x560: top 15, bottom 545, ttl (ELIMINACJA!) top 143 bottom 173 w widoku, przycisk po przewinięciu w widoku.
    * Dowód mutacyjny: stan „na bazie” jest dokładnie mutacją poprawki (usunięcie max-height/overflow/margin z `.civ-ccn`) — test czerwony 20/20 na asercjach wariantu nospec. Wariant spectacle przechodzi także na bazie (patrz NOTY).
  - Zrzuty (evidence/): before-nospec-{1000x560,1280x720,1366x768,1920x1080}.png (baza) i after-{nospec,spectacle}-long-{…}.png (po zmianie). Obejrzałem after-nospec-long-1000x560.png: modal mieści się w 560 px, nagłówek i bilans widoczne, „Pokaż wszystkie surowce (60)” rozwinięte, lista przewija się wewnątrz okna.
BLOKADY: brak blokad technicznych. Uwaga środowiskowa: `npm ci` w gra/ (tylko instalacja zależności, bez build/dev) — node_modules w worktree, nie w git.
RUNDY: 1/5 (Operator, runda 1)
NASTĘPNY KROK: Evaluator (SONNET) — zweryfikować: (a) test czerwony na bazie i zielony po poprawce (run-base.txt / run-after.txt); (b) decyzję, czy wariant spectacle ma być traktowany jako reprodukcja zgłoszenia.
DEPLOY/PUSH: NIE WYKONANO

NOTY (NIE_ZMIERZONO / ZAŁOŻENIA):
  1. Zgłoszenie właściciela (zrzut „ELIMINACJA! Egipt” z blokiem „Elefantyna”/BILANS) NIE daje się odtworzyć na BAZIE w wariancie spectacle: dla c9da8834a `.civ-ccn-spectacle` już ma max-height + overflow-y:auto i pomiar w 4 rozmiarach oraz 1280x400, 390x844, 360x640, 800x1000 mieści się w widoku (top ≥ 0, bottom ≤ innerHeight). Przyczyna zgłoszonego obcięcia u właściciela NIE_ZMIERZONO (możliwe: inna przeglądarka/zoom/100dvh na mobile, albo stan DOM z inną zawartością — nieodtworzone). ZAŁOŻENIE: zgłoszenie dotyczy klasy błędu „modal wyższy niż okno, bez przewijania” w ścieżce `.civ-ccn` bez spectacle oraz w `.civ-ccn-spectacle` przy braku dolnego/górnego marginesu; poprawka obejmuje obie ścieżki i wymusza margin:auto oraz max-height z dvh.
  2. Obserwacja poza zakresem (UWAGI-DLA-ORKIESTRATORA): w wariancie bez spectacle (nospec) nad nagłówkiem „ELIMINACJA!” / tytułem jest pusta przestrzeń ~190 px (na zrzucie po poprawce, 1000x560). Prawdopodobnie `.civ-ccn-ic` z `modalIcon('cp-buildings', 24)` lub pusty element ikony — NIE_ZMIERZONO przyczyny (nie badane; poza allowlistą CSS-u nagłówka). Warto osobnego tematu.
  3. `civElimNotice.ts` (dyplomatyczna eliminacja) nie był reprodukowany; zmiana to utwardzenie tego samego wzorca (max-height + przewijanie) — bez testu pomiarowego. Jeżeli Evaluator uzna za zbędne, można ją cofnąć bez wpływu na resztę.
  4. Test nie wchodzi do tabeli bramek R-PROC §6 (nie jest bramką referencyjną); to świadoma decyzja, do rozstrzygnięcia przez orkiestratora.
  5. `wydarzenia-eliminacja-podboj-karta-test` 4 FAIL pre-existing na bazie c9da8834a — do osobnego długu testowego.
