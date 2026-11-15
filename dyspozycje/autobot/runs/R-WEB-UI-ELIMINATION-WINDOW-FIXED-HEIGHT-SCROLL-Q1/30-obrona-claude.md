STATUS: PASS-WITH-NOTES (obrona rundy 1; werdykt końcowy należy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-UI-ELIMINATION-WINDOW-FIXED-HEIGHT-SCROLL-Q1
GOAL: modal eliminacji / zdobycia miasta (`showCityCaptureNotice`, `showCaptureReportNotice`) ma stałą maksymalną wysokość = widok minus margines, wyśrodkowany, treść przewija się wewnątrz okna; nagłówek nie jest przycinany; przycisk zamknięcia osiągalny przewijaniem; rozwinięcie „Pokaż wszystkie surowce” przewija się zamiast rozpychać okno.
ZMIANY/COMMIT: baza c9da8834a; kandydat Operatora 20cd331d9; poprawki obrony w commicie obrony (SHA w sekcji końcowej). Allowlista: gra/src/ui/cityCaptureNotice.ts (bez zmian względem 20cd331d9), gra/src/ui/eliminationSpectacle.ts (bez zmian względem 20cd331d9), gra/src/ui/civElimNotice.ts (COFNIĘTE do c9da8834a), gra/tools/elimination-window-scroll-test.cjs (rozszerzony), runs/R-WEB-UI-ELIMINATION-WINDOW-FIXED-HEIGHT-SCROLL-Q1/** (raport + evidence).
TESTY (surowe wyniki, z pliku, uruchomione przeze mnie na tym worktree; gra/node_modules zainstalowane przez `npm ci`, bez build/dev):
  - `npx tsc --noEmit` (gra/): exit 0 -> evidence/tsc.txt (wcześniej 0 bajtów, teraz z linią exit).
  - logic-test: exit 0, ostatnia linia „PASS [213] cityfix…” -> evidence/gate-logic-test.txt
  - tech-tree-test: „20 pass, 0 fail”, exit 0 -> evidence/gate-tech-tree-test.txt
  - research-test: „PASSED: 33 / FAILED: 0 / TOTAL: 33”, exit 0 -> evidence/gate-research-test.txt
  - unit-replace-test: exit 0, „[OK] cross-type melee matrix passes for all 15 civilizations…” -> evidence/gate-unit-replace-test.txt
  - combat-test: exit 0, „All sanity checks passed.” -> evidence/gate-combat-test.txt
  - elimination-spectacle-test: „84 PASS, 0 FAIL”, exit 0; elimination-full-spoils-test: „114 passed, 0 failed”, exit 0; elimination-toast-merge-test: „56 passed, 0 failed”, exit 0 (evidence/gate-*.txt)
  - NOWY elimination-window-scroll-test (wersja po obronie, 4 rozmiary × 3 warianty: spectacle, nospec, report-spectacle, report-nospec): 88 PASS / 0 FAIL, exit 0 -> evidence/run-after-r2.txt
  - DOWÓD MUTACYJNY (baza c9da8834a w cityCaptureNotice.ts + eliminationSpectacle.ts przy tym samym teście): 48 PASS / 40 FAIL, exit 1 -> evidence/run-mutation-base-r2.txt. Wszystkie 40 FAIL to warianty bez spectacle (nospec i report-nospec), 4 rozmiary × 5 asercji × 2 warianty. Warianty widowiskowe (spectacle, report-spectacle) PRZECHODZĄ także na bazie.
  - Pomiar bazy dla wariantu widowiskowego (1280x720, długa treść, rozwinięte surowce, evidence/run-base-spectacle-and-nospec.txt): box top 11, bottom 709, h 698 <= ih 720; scrollH 2733 > clientH 696, overflowY auto; ttl (ELIMINACJA!) top 139 w widoku; po przewinięciu przycisk w widoku. Czyli na bazie wariant widowiskowy NIE ma obcięcia nagłówka ani dolnej krawędzi poza ekran.
  - pre-existing (bez zmian, poza allowlistą): wydarzenia-eliminacja-podboj-karta-test 24/4 identycznie na bazie i na kandydacie (zarzut z raportu Operatora, nie ruszane).
BLOKADY: brak technicznych. NIE_ZMIERZONO: przyczyna zgłoszenia właściciela (zrzut „ELIMINACJA! Egipt”) — patrz odpowiedź na zarzut 1.
RUNDY: 1/5 (Operator); obrona = runda 1 odpowiedzi na zarzuty Evaluatora (c8390b30e).
NASTĘPNY KROK: Final Control (SONNET) — ocenić: (a) czy zgłoszenie właściciela jest rozstrzygnięte (NIE: nie odtworzone na bazie w wariancie widowiskowym, patrz zarzut 1); (b) czy zakres poprawki (cityCaptureNotice `.civ-ccn` + spectacle 32px/dvh) jest zaakceptowany jako utwardzenie zgodne z GOAL, z jawną adnotacją w rejestrze; (c) rejestracja testu w bramkach = decyzja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

## ODPOWIEDZI NA ZARZUTY EVALUATORA (c8390b30e)

ZARZUT 1 (zgłoszenie właściciela nie odtworzone na bazie, wariant spectacle): PRZYJMUJĘ CZĘŚCIOWO.
  - Dowód: run-base-spectacle-and-nospec.txt (baza, 1280x720, spectacle, długa treść): box.top=11, box.bottom=709, ih=720, ttl w widoku. Na bazie wariant widowiskowy mieści się w oknie i przewija; NIE odtworzyłem obcięcia opisanego przez właściciela.
  - Poprawka, którą wykonałem (zgodna z GOAL, nie z dowodem na zgłoszenie): `.civ-ccn.civ-ccn-spectacle` max-height calc(100vh-24px) -> calc(100vh-32px) z fallbackiem 100dvh i overscroll-behavior:contain. Liczba 32 px wynika wprost z GOAL („np. calc(100vh - 32px)”), nie z pomiaru zgłoszenia.
  - Przyczyna zgłoszenia u właściciela: NIE_ZMIERZONO. Możliwe przyczyny (nie zbadane): przeglądarka/zoom/100dvh na mobile, inna wersja buildu, stan DOM z innym blokiem. Wniosek dla FC: poprawka dla wariantu widowiskowego jest UTWARDZENIEM klasy błędu, a NIE potwierdzoną naprawą zgłoszonego przypadku. Raport końcowy/rejestr musi to tak opisać.
  - Wariant bez spectacle (nospec, report-nospec) — tu baza JEST czerwona (40 FAIL) i poprawka to realna naprawa obcięcia (box.top=-942, h=2444 px na 1000x560 na bazie; po poprawce top=15, bottom=545, przewijanie działa).

ZARZUT 2 (brak zrzutu „przed” dla spectacle): PRZYJMUJĘ.
  - Dodane: evidence/before-spectacle-long-{1000x560,1280x720,1366x768,1920x1080}.png (zrzuty z uruchomienia na bazie c9da8834a, ten sam test). Zrzuty „po” istnieją: after-spectacle-long-*.png.
  - Uwaga: zrzuty przed-spectacle pokazują, że na bazie modal mieści się w widoku (zgodnie z pomiarem z zarzutu 1).

ZARZUT 3 (harness: izolowany bundle esbuild + setContent, brak CSS gry, stub brandIconSvg; ~190 px pustego miejsca na zrzucie nospec): PRZYJMUJĘ JAKO OTWARTE, NIE ROZSTRZYGNIĘTE.
  - Nie zweryfikowałem w żywej grze (brak czasu w tej rundzie; wymagałoby build vite do /tmp, poza zakresem obrony bez zlecenia). Pustą przestrzeń nad „ELIMINACJA!”/tytułem w wariancie nospec NIE_ZMIERZONO: prawdopodobnie `.civ-ccn-ic` z pustym SVG ze stuba. ODRZUCAM stwierdzenie, że to na pewno defekt realny lub na pewno artefakt — brak dowodu w obie strony. Wpisuję do UWAGI-DLA-ORKIESTRATORA jako osobny temat do sprawdzenia w żywej grze.

ZARZUT 4 (civElimNotice.ts bez testu i bez reprodukcji; showCaptureReportNotice nieobjęty testem): PRZYJMUJĘ.
  - civElimNotice.ts: COFNIĘTE do c9da8834a (git checkout c9da8834a -- gra/src/ui/civElimNotice.ts). Uzasadnienie: zmiana była nieprzetestowana i poza zgłoszeniem; wycofanie zawęża diff do ścieżek objętych testem.
  - showCaptureReportNotice (panel Wydarzenia, ta sama klasa `.civ-ccn`): DODANO wariant report-spectacle i report-nospec do testu (4 rozmiary każdy). Na kandydacie 88/0; na bazie report-nospec czerwone (część z 40 FAIL w mutacji). Ten sam przycisk-selektor rozszerzono do `[data-stay],[data-close]`.

ZARZUT 5 (test nie wpisany do bramek; sztywna ścieżka FALLBACK_CHROME; zależność od lokalnego playwright/esbuild): PRZYJMUJĘ CZĘŚCIOWO.
  - FALLBACK_CHROME: teraz nadpisywany zmienną środowiskową ELIM_CHROME (domyślna wartość jak wcześniej). Test działa bez zmian ścieżki systemowej (launch domyślny i /usr/bin/chromium przed fallbackiem).
  - Wpisanie do bramek R-PROC §6 / stałych testów: ODRZUCAM w zakresie Operatora — to decyzja orkiestratora (NOTA 4 Operatora). Zostawiam jawnie w UWAGI-DLA-ORKIESTRATORA.

ZARZUT 6 (przycisk „Wróć na mapę” nie jest sticky; 2400 px pod widokiem na 1000x560 bez przewijania): ODRZUCAM.
  - GOAL (dispatch, kopiuję): „przewijanie pozwala dojść do końca, do „Pokaż wszystkie surowce” i przycisku zamknięcia”. Przycisk jest osiągalny przewijaniem; test sprawdza to po scrollTop = scrollHeight (asercja „po przewinięciu do końca przycisk … w widoku”, 88/0).
  - Sticky button to zmiana UX spoza GOAL i spoza allowlisty tematu (wymagałaby zmiany układu stopki). Pozostawiam jako uwagę UX.

ZARZUT 7 (evidence/tsc.txt 0 bajtów; raport Operatora podał unit-power-test zamiast tech-tree i unit-replace): PRZYJMUJĘ.
  - tsc.txt: zapisany z wynikiem i linią exit 0.
  - tech-tree-test 20/0, unit-replace-test 21/21 (wynik z pliku: „[OK] … 15 civilizations”; test drukuje OK-linie, nie licznik 21/21 — podaję to, co jest w surowym wyjściu), research-test 33/33, logic-test 213, combat-test „All sanity checks passed.” — wszystkie w evidence/gate-*.txt.

## ZMIANY W TEJ RUNDZIE (obrona)
  1. gra/src/ui/civElimNotice.ts: cofnięte do c9da8834a (zarzut 4).
  2. gra/tools/elimination-window-scroll-test.cjs: (a) wariant trwałego raportu (showCaptureReportNotice) x2 warianty x 4 rozmiary; (b) selektor przycisku zamknięcia `[data-stay],[data-close]`; (c) ELIM_CHROME dla ścieżki przeglądarki (zarzut 5).
  3. evidence/: before-spectacle-long-*.png, after-report-spectacle-long-*.png, gate-*.txt, run-after-r2.txt, run-base-spectacle-and-nospec.txt, run-mutation-base-r2.txt, tsc.txt (z wynikiem).
  4. Brak zmian w logice gry, gra/data, tekstach. cityCaptureNotice.ts i eliminationSpectacle.ts: bez zmian względem kandydata 20cd331d9.

## UWAGI-DLA-ORKIESTRATORA (poza zakresem; decyzja orkiestratora)
  - Przyczyna zgłoszenia właściciela (ELIMINACJA! Egipt, wariant widowiskowy) NIE_ZMIERZONO. Zalecam test w żywej grze (vite build do /tmp, ?civTest=1 lub realna tura) na przeglądarce właściciela lub z zoomem ≠100%; bez tego zgłoszenie nie jest zamknięte.
  - Pusta przestrzeń ~190 px nad nagłówkiem w wariancie nospec (zrzut po poprawce, 1000x560): prawdopodobnie `.civ-ccn-ic` + pusty SVG ze stuba testu. Do sprawdzenia w żywej grze, osobny temat.
  - Rejestracja testu elimination-window-scroll-test.cjs w bramkach R-PROC §6: decyzja orkiestratora.
  - Dług bazowy (nieruszany): wydarzenia-eliminacja-podboj-karta-test 24/4 na bazie i na kandydacie.
  - Baza kandydata c9da8834a jest starsza niż origin/main (origin/main ma 9c035f139 i nowsze). Nie sprawdzałem rebase na nowszy main: NIE_ZMIERZONO (poza zadaniem obrony).
  - Kandydat 20cd331d9 NIE jest w origin/main ani na żadnej gałęzi zdalnej poza commitem raportu Evaluatora; nie pushowałem (zakaz).
