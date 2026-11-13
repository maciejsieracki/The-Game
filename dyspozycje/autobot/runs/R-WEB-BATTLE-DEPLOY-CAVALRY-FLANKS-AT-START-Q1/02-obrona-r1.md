STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-BATTLE-DEPLOY-CAVALRY-FLANKS-AT-START-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora z rundy 1 (commit a3546ffcc). Odtworzono stan z a3546ffcc, poprawiono test (zarzut 3 i 4), resztę przyjęto jako odstępstwa/luki lub odrzucono z dowodem.
ZMIANY/COMMIT: commit obrony na gałęzi odtworzenia (SHA w raporcie orkiestratora). Zmieniony plik: `gra/tools/battle-deploy-cavalry-flanks-test.cjs`. Kod `formationRules.ts` NIE zmieniony (identyczny z a3546ffcc). Dodany ten raport.

ODPOWIEDŹ NA ZARZUTY
1. ALLOWLISTA (formationRules.ts) — PRZYJMUJĘ jako odstępstwo do zatwierdzenia przez orkiestratora. Poprawka musi leżeć w `initialBattleSlots` (formationRules.ts): to jedyna funkcja liczącą sloty startowe; oba wywołania w battleScene.ts (linie ~5233 i ~16842) przechodzą przez nią, więc zmiana w battleScene.ts nie jest potrzebna. Nie przenoszę logiki do battleScene.ts (duplikacja). Wymagane: zatwierdzenie lub rozszerzenie allowlisty o `gra/src/battle/formationRules.ts`.
2. KRYTERIUM „nie na pierwszej linii” przy najszerszej piechocie — ODRZUCAM zmianę kodu w tej rundzie, z ZAŁOŻENIEM: skrzydło najszerszego szeregu jest skrzydłem, a nie „pierwszą linią” w sensie zgłoszenia (zgłoszenie dotyczyło konnicy wysuniętej PRZED łucznikami i poza ich wierszami). Przy najszerszej piechocie konnica stoi w tym samym szeregu co piechota, na jej końcach, czyli dokładnie w wierszach skrzydeł. Cofnięcie jej o szereg zmieniłoby zachowanie w przypadku, którego właściciel nie zgłaszał. Dla orkiestratora: jeśli właściciel chce konnicę zawsze o szereg za frontem, to decyzja produktowa (ABC), nie błąd kodu.
3. TEST, asercja 5 z klauzulą ucieczki — PRZYJMUJĘ i NAPRAWIAM. Usunięto `|| widestCol === ...`. Asercja jest teraz ścisła: skrzydłowa jednostka konna nie może stać za najszerszym szeregiem (równo z nim jest dopuszczone). Mutacja: po cofnięciu poprawki w formationRules.ts (wersja a3546ffcc~1) test pada na asercji „not ahead of the widest rank” w przypadku „few infantry, many archers”, deploy=false, [atk] (col 31 vs 30). Złapane.
4. TEST, próg odległości 4 zmierzony na 3 — PRZYJMUJĘ i NAPRAWIAM. Próg w teście ustawiony na `d <= 3` (zmierzone maks. 3, wynik 536 asercji PASS). Komunikat i podsumowanie zawierają limit 3.
5. TEST, brak kierunków C-FLANK i terenu — PRZYJMUJĘ CZĘŚCIOWO. Kierunki natarcia po obu stronach (atk/def, znak `sign`) są w teście. C-FLANK to ruch w walce, nie rozmieszczenie startowe, więc poza tym testem. Teren: stub mapy `passable: () => true, at: () => 'plains'` nie sprawdza lasu ani wąwozu. LUKA ZOSTAJE: NIE_ZMIERZONO.
6. WERYFIKACJA WIZUALNA w przeglądarce — PRZYJMUJĘ: NIE_ZMIERZONO. Nie uruchamiałem vite/dev w gra/ (zakaz w dispatchu). Wymagana osobna weryfikacja w przeglądarce przed deployem (poza tą rundą).

TESTY (po poprawce, worktree odtworzony z a3546ffcc, node_modules przez `npm ci --ignore-scripts`, nie commitowane)
- battle-deploy-cavalry-flanks-test: PASS, 536 asercji, maks. odległość 3, limit 3.
- logic-test: LOGIC OK 213/213.
- ai-test: 289 passed, 0 failed.
- tsc --noEmit: 0 błędów.
- battle-flank-close-formation-test: PASS 994 asercje.
- battle-initial-placement-runtime-test: PASS, mutacja złapana 4/4.
- battle-formation-rules-test: PASS.
- battle-cap-500-test: PASS 59.
- battle-undeployed-units-test: PASS=35 FAIL=0.
- battle-ranged-mounted-doctrine-test: 10/10.
- battle-large-mixed-doctrine-matrix-test: 36 scenariuszy, 0 red. Test nadpisuje śledzony `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json`; przywrócony przez `git checkout`.
- NIE uruchamiano battle-natural-chariot-r5-test (vite build w gra/, zakaz).

BLOKADY: brak kodowych. Otwarte dla orkiestratora: (a) zatwierdzenie allowlisty dla formationRules.ts; (b) decyzja ABC co do konnicy na końcach najszerszej linii czołowej; (c) weryfikacja wizualna w przeglądarce (NIE_ZMIERZONO); (d) pokrycie terenu w teście (NIE_ZMIERZONO).

ZAŁOŻENIA
- Brak testu terenowego: placement stub używa 'plains'; przyjęto, że start bitwy na pustej mapie jest wystarczającym dowodem dla tej rundy.
- Próg 3 pola jest zmierzony na 6 składach x 2 strony x 2 tryby deploy, a nie wynika z kodu; przy zmianie składu test może wymagać ponownego pomiaru.

RUNDY: 2/5 (obrona w rundzie 1 zgłoszonej przez Evaluatora)
NASTĘPNY KROK: Evaluator (ponowna weryfikacja testu i decyzja na zarzut 2)
DEPLOY/PUSH: NIE WYKONANO
