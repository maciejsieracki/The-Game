STATUS: PASS-WITH-NOTES (obrona r1; ostatni werdykt należy do Final Control)
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1
GOAL: Naprawić zarzuty Evaluatora (0ac035538) do kandydata c30727ede: regresja po wczytaniu/nowej grze, licznik i komunikat po „Rekrutuj wszystkie”, testy live.
ZMIANY-COMMIT: baza c30727ede -> aaf22bc85 (gra/src/ui/empireRecruitPanel.ts, gra/tools/empire-recruit-all-live-test.cjs) -> 05f649925 (gra/src/main.ts, gra/tools/army-auto-recruit-general-live-test.cjs). Branch lokalny: obrona/R-WEB-UI-EMPIRE-RECRUIT-PANEL-MOVE-TO-ARMY-PANEL-Q1 (bez push). Nie tknięto WERSJE.md, gra-robocza/, rust-port/.
SHA-KOD-KONCOWY: 05f649925

ODPOWIEDZI NA ZARZUTY
Zarzut 1 (KRYTYCZNY, sekcja pusta po wczytaniu/nowej grze): PRZYJĘTY. Przyczyna potwierdzona w kodzie: resetEmpireRecruitPanelSession ustawiał panelCfg = null, a configureEmpireRecruitPanel działa tylko raz w boot(); mountEmpireRecruitSection wychodził przy !panelCfg. Poprawka: reset nie czyści panelCfg (domknięcia czytają żywy stan gry). Dowód: empire-recruit-all-live-test L17-L24a PASS (wcześniej TimeoutError na L24). Mutant (przywrócone panelCfg = null): test CZERWONY - L1-L24a PASS, potem TimeoutError przy czekaniu na [data-unit] po wczytaniu (exit 1). Komentarz przy configureEmpireRecruitPanel poprawiony.
Zarzut 2 (WYSOKI, licznik i komunikat po „Rekrutuj wszystkie”): PRZYJĘTY (mechanizm z kodu, potwierdzony testem). onOrder -> markCityStateDirty -> synchroniczna przebudowa panelu armii; render szedł na odłączony węzeł root. Poprawka: liveHost(root) - render na aktualnie podłączonym [data-erp-root] po onOrder/orderAll/wyborze generała. Dowód: empire-recruit-all-live-test L13 (liczniki przyjętych typów wróciły do 0) PASS po poprawce (wcześniej FAIL). Komunikat „Rekrutacja wszystkich: przyjęto…” NIE_ZMIERZONO w DOM (test go nie sprawdza; brak zrzutu po poprawce).
Zarzut 3 (ŚREDNI, proces: testy live nieuruchomione): PRZYJĘTY, uruchomione. Patrz TESTY. Zarzut „live-verify-w18-w24” ODRZUCONY: ten commit nie zmienia żadnego pliku live-verify-w18-w24-* i żaden z nich nie odwołuje się do rekrutacji (grep bez trafień), więc nie był to test zaktualizowany przez kandydata.
Zarzut 4 (NISKI, map-controls-behind-panels-live): PRZYJĘTY jako otwarty problem, NIE NAPRAWIONE. Test przechodzi (exit 0), ale wiersz „rekrutacja-imperium” jest N/A: „panel się nie otworzył”. Baza 50f607fe3 mierzy ten wiersz (brak nakładania na toolbar-ikony, zoom-dock, minimapa). Sonda na kandydacie w tym scenariuszu: .civ-emp-panel.open = true, .civ-emp-mass = 0, [data-erp-root] = 0. Czyli sekcja rekrutacji nie jest renderowana w panelu armii w tym scenariuszu, a test milcząco przepuszcza. Przyczyna NIE_ZMIERZONO (nie zbadano, czy to brak rekrutacji w tym stanie gry, czy błąd renderu panelu armii). Wymaga osobnej decyzji Orkiestratora; test NIE jest tu uczciwym dowodem dla tego panelu.

TESTY (surowe wyniki; kod = 05f649925 chyba że zaznaczono)
- tsc --noEmit: exit 0 (po aaf22bc85).
- git diff --check: czysty (przed commitami 05f649925).
- empire-recruit-all-live-test: 29 passed, 0 failed (po aaf22bc85 i po 05f649925). Baza 50f607fe3: 29/0 (wg Evaluatora). Kandydat c30727ede: L13 FAIL + TimeoutError L24.
- MUTANT panelCfg=null: exit 1, TimeoutError (czerwony) - patrz zarzut 1.
- army-auto-recruit-general-live-test: baza 50f607fe3 17 passed/0 (uruchomione w kopii bazy). Kandydat c30727ede: 15/2 (L13 „panel zamknięty” - test-artefakt: sekcja siedzi w DOM panelu armii, więc count()===0 nie oznacza zamknięcia; L15 „zginął” toast nie pojawił się: walidacja generała wołana z getGenerals przy każdej przebudowie panelu armii, także zamkniętego, więc komunikat wypadał poza turą). Poprawki: L13 sprawdza klasę .civ-emp-panel.open; getGenerals wywołuje validateRecruitGeneral tylko gdy isEmpireDetailPanelOpen() (jak dawny modal). Wynik po poprawkach (05f649925): 17 passed, 0 failed.
- map-controls-behind-panels-live-test: exit 0, ale wiersz rekrutacja-imperium = N/A (patrz zarzut 4). Baza: wiersz zmierzony, bez nakładania.
- empire-recruit-in-army-panel-test: 13 passed, 0 failed (po 05f649925).
- empire-recruit-affordability-test 17/0, empire-recruit-all-test 31/0, empire-recruit-live-test 23/0, empire-recruit-panel-no-inner-scroll-test 18/0, empire-recruit-panel-real-render-test 29/0 (uruchomione po aaf22bc85, PRZED 05f649925; zmiana w 05f649925 dotyczy getGenerals i testu army-auto - NIE_ZMIERZONO ponownie dla tych pięciu).
- Bramki referencyjne z zarzutu (tech-tree, research, logic-test, unit-replace, combat, unit-power) NIE uruchamiane w tej rundzie (zmiany nie dotykają ich modułów); wynik Evaluatora pozostaje wg jego raportu.
- Zrzuty Chromium (panel na górze, wąskie 1024x640, pasek bez REKRUTACJA): NIE_ZMIERZONO w tej rundzie.

WERYFIKACJA ZAUWAŻONA PODCZAS PRACY (dla Orkiestratora)
- Panel armii po zakończeniu tury jest zamykany (hideEmpireDetailPanel), ale wiersze [data-unit] zostają w DOM poza ekranem (civ-emp-panel fixed, left=1280 w oknie 1280 px). Test all-live poprawiono: openArmyRecruitSection() idempotentnie + waitForSelector visible.
- R-WEB-UI-RECRUIT-PANEL-COUNTERS-RESET-ON-CLOSE-Q1 zachowane: resetEmpireRecruitDrafts przy zamknięciu panelu armii (empireDetailPanel.ts) bez zmian.

BLOKADY
- map-controls: wiersz rekrutacji nie jest mierzony (vacuous PASS) - otwarte.
- Komunikat „Rekrutacja wszystkich: przyjęto…” po poprawce NIE_ZMIERZONO w DOM/zrzucie.
- Zrzuty wizualne (panel na górze, wąskie okno) NIE_ZMIERZONO.

UWAGI-DLA-ORKIESTRATORA (poza zakresem; nie zakładano sesji)
- Test map-controls wymaga decyzji: naprawa renderu sekcji w panelu armii (jeśli błąd) albo jawne oznaczenie wiersza jako FAIL zamiast N/A.
- Zmiana getGenerals (main.ts) przywraca czas walidacji dawnego modalu; otwarte pytanie, czy śmierć generała przy zamkniętym panelu ma być zgłaszana w turze (jak teraz, zgodnie z komentarzem przy endTurn).

NASTĘPNY KROK: Evaluator (ponowny przegląd 05f649925 + rozstrzygnięcie zarzutu 4) -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5 (obrona)
