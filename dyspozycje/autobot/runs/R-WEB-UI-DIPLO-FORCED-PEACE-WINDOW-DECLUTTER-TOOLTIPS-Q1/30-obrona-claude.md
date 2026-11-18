# Obrona Operatora — R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-DECLUTTER-TOOLTIPS-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, tylko prezentacja)
TEMAT: R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-DECLUTTER-TOOLTIPS-Q1
GOAL: okno pokoju wymuszonego: na wierzchu tytuł, partner, jedno zdanie „dlaczego”, warunki i przycisk; wyliczenia w tooltipach. Bez zmian logiki pokoju.
ZMIANY/COMMIT: kod operatora 1101d7fdc (baza 56bb088c1 jest przodkiem: `git merge-base --is-ancestor` = OK). Brak nowych zmian kodu w tej rundzie. Ten raport: commit z plikiem 30-obrona-claude.md. Pliki kodu bez zmian względem 1101d7fdc.
TESTY (liczby z surowego wyjścia, uruchomione w tej rundzie):
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/diplo-forced-peace-window-declutter-test.cjs`: PASS=15 FAIL=0 (w tym mutanty M2–M4 czerwienią test).
- `node tools/diplo-forced-peace-pending-test.cjs`: PASS=40 FAIL=0.
- `node tools/diplo-weariness-stages-view-test.cjs`: 22 pass / 0 fail.
- `node tools/diplo-weariness-forced-peace-test.cjs`: PASS=14 FAIL=0.
- `node tools/peace-vazne-always-test.cjs`: WYNIK: ZIELONE.
- `node tools/diplo-wiki-weariness-rate-consistency-test.cjs`: asercje OK 18, FAIL 0.
- Żywa pętla w Chromium: `tools/diplo-peace-auto-stale-offer-live-test.cjs` na buildzie vite do katalogu poza repo (`SKIP_BUILD=1`): PASS=15 FAIL=0, zero pageerror/console.error. Wyjście: `<scratchpad>/obrona-r1/live.log`.
- Zrzut okna w Chromium (bundle poza repo, prawdziwa tura z zmęczeniem 100%): `<scratchpad>/obrona-r1/after-okno.png` oraz `<scratchpad>/obrona-r1/after-hover.png`. Odczytane z DOM: `<p>` z tekstem „Zmęczenie wojną osiągnęło 100% — pokój jest wymuszony.” ma atrybut title o długości 387 znaków; `<p>` warunków ma title o długości 91 znaków; lead „Wojna z Grecy osiągnęła 100% zmęczenia — pokój wymuszony.” nie ma title.

Odpowiedzi na zarzuty Evaluatora:
1. Brak zrzutu z żywego Chromium — PRZYJMUJĘ CZĘŚCIOWO. Wykonano zrzut PO (okno z realnej tury, 100% zmęczenia) i dowód DOM dla tooltipów (długości title, patrz wyżej). Zrzut PRZED nie został wykonany: NIE ZMIERZONO (wymagałby osobnego buildu z kodu 56bb088c1; nie zrobiono w tej rundzie). Hover: natywny tooltip `title` jest rysowany przez system operacyjny i nie trafia do zrzutu headless, więc na zrzucie hover-owym widać okno bez dymka. Obecność tooltipa potwierdzono atrybutem title, nie wizualnie. NIE ZMIERZONO wizualnego dymka.
2. `diplo-peace-auto-stale-offer-live-test` nie został uruchomiony — PRZYJMUJĘ, uruchomiony teraz: PASS=15 FAIL=0 (patrz wyżej). Build przez vite do katalogu poza repo (nie `npm run build`).
3. Dwa zdania o zmęczeniu na wierzchu (`lead` i `whyShort`) — ODRZUCAM w tej rundzie. Dowód: `tools/diplo-weariness-stages-view-test.cjs:94` wymaga równości `mLoser.lead === 'Wojna z Egipt osiągnęła 100% zmęczenia — pokój wymuszony.'`, a `tools/diplo-forced-peace-window-declutter-test.cjs:58` sprawdza `t.lead` tekstem „Wojna z Rzym osiągnęła 100% zmęczenia…”. Zmiana `lead` wymagałaby edycji testu spoza allowlisty (`diplo-weariness-stages-view-test.cjs`). `lead` niesie nazwę partnera (wymóg GOAL: partner na wierzchu), a `whyShort` jest jedynym „dlaczego”. Powtórzenie procentu jest kwestią redakcyjną, zgłoszoną przez Evaluatora jako niekrytyczna; rozstrzygnięcie należy do orkiestratora lub właściciela (propozycja: usunąć procent z `whyShort` albo z `lead` po zgodzie na zmianę testu).

Uwagi dla orkiestratora: `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` (ignorowane przez git). Kopie buildów: `<scratchpad>/obrona-r1/dist` (poza repo).

BLOKADY: brak dla kodu. Otwarte: zrzut PRZED i wizualny dymek hover (NIE ZMIERZONO).
RUNDY: 1/5 (obrona).
NASTĘPNY KROK: Evaluator r2 na commicie tej obrony; decyzja w sprawie duplikatu procentu (pkt 3) do orkiestratora/właściciela.
DEPLOY/PUSH: NIE WYKONANO
