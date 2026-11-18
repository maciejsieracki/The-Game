# R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-DECLUTTER-TOOLTIPS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, tylko prezentacja)
TEMAT: R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-DECLUTTER-TOOLTIPS-Q1
GOAL: w oknie pokoju wymuszonego na wierzchu zostają tytuł, partner, jedno zdanie „dlaczego”, warunki i przycisk; wyliczenia (tury wojny, zmienione miasta, 2,5%/turę, 10%/miasto, kto wygrywa, karencja, zaufanie) przechodzą do tooltipów. Nic nie znika z treści, zachowanie okna bez zmian.
BAZA: 56bb088c122708dbf0459d86a892f81d8d6060d7 (origin/main), `git merge-base --is-ancestor` = OK.

## ZMIANY-COMMIT
Commit z kodem i raportem: patrz SHA w polu `sha` wyniku (gałąź detached, worktree wf_7b2b2f3f-0c3-1).
- `gra/src/game/war-weariness-view.ts`: `ForcedPeaceText` dostaje pola `whyShort` (jedno zdanie: „Zmęczenie wojną osiągnęło X% — pokój jest wymuszony.") i `termsShort` (tylko warunki). Pola `why` i `terms` zostają pełnymi tekstami (ta sama treść, te same liczby z WAR_WEARINESS_PARAMS), więc testy stage/pending/consistency nie wymagały zmian.
- `gra/src/ui/diplomacyAudience.ts` (tylko `showForcedPeaceModal`): widoczne `whyShort` i `termsShort`; `why` i `terms` idą do atrybutu `title` przez istniejący `detailTipAttr` z `diplomacyTipText.ts`. Logika pokoju, Esc, klik w tło i bramka „Zakończ turę” nietknięte.
- `gra/src/ui/hudTitleTooltip.ts`: BEZ ZMIAN. Zakres `.civ-diplo-modal-overlay` już był na liście SCOPE_SELECTOR, okno montuje się w tym overlay.
- Nowy test `gra/tools/diplo-forced-peace-window-declutter-test.cjs` (15 asercji: zachowanie tekstu, źródło okna, 4 mutanty w pamięci, bez zapisów plików).

## TESTY
- `node tools/diplo-forced-peace-window-declutter-test.cjs`: PASS=15 FAIL=0 (mutanty M1–M4 czerwienią kontrolę).
- `node tools/diplo-forced-peace-pending-test.cjs`: PASS=40 FAIL=0.
- `node tools/diplo-weariness-stages-view-test.cjs`: 22 pass / 0 fail.
- `node tools/diplo-weariness-forced-peace-test.cjs`: PASS=14 FAIL=0.
- `node tools/peace-vazne-always-test.cjs`: ZIELONE.
- `node tools/diplo-wiki-weariness-rate-consistency-test.cjs`: asercje OK 18, FAIL 0.
- Bramki referencyjne z §6: `tsc --noEmit` exit 0; logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat „All sanity checks passed.”
- `git diff --check`: czysto.
- Żywy Chromium (zrzut PRZED/PO + hover tooltipa): NIE ZMIERZONO. Powód: wymaga żywej gry w przeglądarce; build do zrzutu nie był uruchamiany w tej rundzie (dozwolony tylko vite bezpośrednio do katalogu poza repo). Evaluator/FC muszą to wykonać przed READY_FOR_DEPLOY (bramka 6).
- `diplo-peace-auto-stale-offer-live-test.cjs` (żywy, Playwright): NIE ZMIERZONO w tej rundzie z tego samego powodu.

## BLOKADY
Brak blokad kodowych. Zależności: `npm ci --ignore-scripts` w `gra/` wykonane (dozwolone dispatchem), `node_modules` poza śledzeniem git. Dysk przed startem: 11 GB wolne.

## RUNDY
1/5, bez porażek (licznik Haiku = 0).

## UWAGI-DLA-ORKIESTRATORA
- Kopie buildów poza repo nie powstały (brak builda w tej rundzie).
- Plik `diplo-forced-peace-pending-test.cjs` nie był zmieniany (w allowliście, ale niepotrzebny).
- Do decyzji właściciela: sformułowanie `whyShort` („Zmęczenie wojną osiągnęło 100% — pokój jest wymuszony.”) powtarza procent z `lead` („Wojna z … osiągnęła 100% zmęczenia — pokój wymuszony.”). Jeśli właściciel woli bez powtórki, skrót `whyShort` można zmienić bez wpływu na testy (testy sprawdzają tylko brak liczb w `whyShort`).

## NASTĘPNY KROK
Evaluator: sprawdzić diff vs 56bb088c1, uruchomić nowy test i bramki z §6, wykonać żywy zrzut okna przed/po i hover tooltipa w Chromium (bramka 6). Potem Final Control i integracja orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
