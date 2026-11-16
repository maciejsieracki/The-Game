# R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 — obrona Operatora, odpowiedź na zarzuty Evaluatora (runda 3)

STATUS: PASS-WITH-NOTES (częściowo: zarzuty 1, 2, 3, 5, 6, 8 wdrożone i zielone; zarzut 4 (widok etapów) NIE ZROBIONE; zarzut 7 (pomiary) NIE ZMIERZONO; zarzut 9 (decyzja ABC) bez zmiany — czeka na właściciela)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1
GOAL: zmęczenie wojną 40 tur do 100%; 80% = tylko oferta z miastami (bez bezwarunkowego końca); 100% = pokój wymuszony, wyraźnie przegrywający płaci miastami; gracz objęty tak samo jak AI (okno + „Ważne”); testy zgodne z nowymi regułami; wikiBundle zsynchronizowany.
BAZA: d31b45d5d8504b247d61d96800b17233d5ca372d (kandydat r2). Sprawdzone: `git merge-base --is-ancestor 774fd0eec HEAD` = OK (origin/main 774fd0eec jest przodkiem; merge nie był potrzebny).

## ZMIANY / COMMIT

Commit r3: SHA zwrócony w polu `sha` orkiestratorowi (HEAD po commicie tej rundy). Allowlista r3:
- `gra/src/game/war-weariness.ts`: (a) zawieszenie pokoju wymuszonego przy `battlePending` (odroczenie na następną turę, zarzut 1+2); (b) `WearinessTickOutcome` dostaje pola `loser`/`winner`; wynik `forced_peace` je wypełnia.
- `gra/src/main.ts`: pętla gracza po `runWarWearinessTick` — zamiast samego toasta: wpis w `warEventLog` (id `forced-peace-<tura>-<para>`, „Pokój wymuszony: …”) + `showForcedPeaceModal`; import `showForcedPeaceModal`. Pary gracza (ME↔major w wojnie) były już w r2.
- `gra/src/ui/diplomacyAudience.ts`: nowa eksportowana funkcja `showForcedPeaceModal` (natywne okno po polsku, „Oddajesz: N miasta.” / „Otrzymujesz: N miasta.” / „Pokój bez wymiany miast.”).
- `gra/tools/diplo-weariness-unconditional-end-test.cjs`: USUNIĘTY (`git rm`) — obsoletny (pokój bezwarunkowy przy 80%, wyjątek Node). Zastąpiony przez:
- `gra/tools/diplo-weariness-forced-peace-test.cjs` (NOWY): 14 asercji + mutant F9.
- `gra/tools/ai-war-weariness-peace-test.cjs`: `pelneTur` 20→40; izolacja pokoju wymuszonego w `PRE_END_PARAMS` (`progWymuszonyPokoj = 2`); asercje „koniec zmęczenia” zastąpione asercją „80%+ NIE proponuje pokoju bezwarunkowego”; scenariusz 11 tur (poziom 0,475 < 0,5) przeskalowany do 20 tur (poziom 0,70).
- `gra/tools/diplo-weariness-city-only-test.cjs`: tury wojny ×2 (10→20, 15→30, 16→32) = ten sam poziom na skali 40 tur; asercja e1 przepisana na „80% → oferta z miastem, karencja chronionego 100”; mutant M5 przepięty na karencję w gałęzi OFERTY (poprzednia gałąź forced jest już pokryta przez test F3).
- `gra/tools/diplo-weariness-pw-behavior-test.cjs`: pętla tur 10..20 → 20..40; `cAt(10)`→`cAt(20)`; `[10,15,20]`→`[20,30,40]`; asercja (b) „AI proponuje pokój bezwarunkowy <=> bilans>=0” zastąpiona „AI NIE proponuje pokoju bezwarunkowego” (galezi nie ma w ai.ts); (b2) okno tur 21..25.
- `gra/tools/diplo-peace-ai-ai-nonnegative-test.cjs`: W1–W4 — `progWymuszonyPokoj = 2` (izolacja ofert; wcześniej `progKoncaZmeczenia = 2`).
- `gra/tools/ai-losing-war-asks-peace-vs-player-test.cjs`: skala tur ×2 (`[10,11,12,15,16,20,60]` → `[20,22,24,30,32,40,80]`, próg `t<16`→`t<32`, `t>=10`→`t>=20`) — ten sam poziom zmęczenia.
- `gra/tools/diplo-peace-balance-accept-test.cjs`: A5 przepisana na „40 tur (100%/80%+): AI NIE proponuje pokoju bezwarunkowego”.
- `gra/src/data/wikiBundle.json`: regeneracja `node tools/bundle-wiki-for-game.cjs` (zarzut 5/6).
- `docs/encyklopedia/pojecia/zmeczenie-wojna.md`, `docs/encyklopedia/pojecia/rozejm-pokoj.md`: źródło wiki — 20→40 tur, 80% = oferta z miastami (bez bezwarunkowego), 100% = pokój wymuszony; przykład liczbowy i tabela parametrów przeliczone.
- `dyspozycje/autobot/runs/.../30-obrona-claude.md`: ten raport.

Nie dotknięto: `ai.ts`, `battleScene.ts`, `gra/src/ui/**` poza `diplomacyAudience.ts`, `gra/` build/dev. `npm run build`/`dev` NIE uruchomiono. `npm ci --ignore-scripts` wykonano w `gra/` (node_modules poza git).

## TESTY (surowe wyniki r3, uruchomione w worktree)

- `npx tsc --noEmit` (gra/): EXIT 0.
- diplo-weariness-forced-peace-test (NOWY): PASS=14 FAIL=0 (F1 100%→forced_peace z miastami; F2 80% nie wymusza; F3 chroniony → karencja 100; F4 cena 0 → bez pay; F5 remis sił → pokój bez miast; F6 battlePending → odroczenie; F7 gracz (id 0) przegrywający → forced_peace; F8 stolica nigdy; F9 mutant wyłączonej gałęzi → F1 czerwony).
- diplo-weariness-city-only-test: PASS=30 FAIL=0 (r2: 27/3). Mutanty M1–M10 + W1–W2: wszystkie wykryte.
- diplo-weariness-pw-behavior-test: 147 pass / 0 fail (r2: 17 FAIL).
- ai-war-weariness-peace-test: PASS=101 FAIL=0 (r2: exit 1; Node exception usunięty — wcześniej `unconditional-end` i `ai-war-weariness-peace` rzucały wyjątek w r2 tylko z powodu obsoletnej galęzi).
- diplo-peace-ai-ai-nonnegative-test: 21 PASS / 0 FAIL (r2: W1–W4 czerwone).
- ai-losing-war-asks-peace-vs-player-test: WYNIK 12 PASS / 0 FAIL (r2: 11/1).
- diplo-peace-balance-accept-test: 32 pass / 0 fail (r2: A5 czerwone).
- diplo-weariness-as-pw-peace-item-test: PASS=194 FAIL=0 (bez zmian).
- diplo-weariness-c615-both-cities-test: PASS=11 FAIL=0 (bez zmian).
- diplo-weariness-20-turns-test: PASS=31 FAIL=0 (bez zmian; nazwa pliku historyczna — 20 tur, zachowane na życzenie kompatybilności).
- diplo-weariness-migration-peak-test (zarzut 4): PASS=7 FAIL=0. MUTACJA wykonana ręcznie w r3: usunięcie linii `if (st.peak > level) st.peak = level;` (war-weariness.ts:285) → PASS=4 FAIL=3 (czerwono); przywrócone → PASS=7 FAIL=0, plik źródłowy bez śladów mutanta.
- json-descriptions-sync-test: 19 pass / 0 fail (po regeneracji wikiBundle).
- NIE URUCHOMIONO w r3: referencyjne logic 213 / tech-tree / research / unit-replace / combat (zmiany r3 nie dotykają ich modułów; r2 Evaluator: zielone). NIE ZMIERZONO: Chromium (okno gracza, zrzuty 1280×720) — brak uruchomienia przeglądarki w tej rundzie.
- Nierozstrzygnięte bazowe (nie zlokalizowane po nazwie w tools/ w tej rundzie): `diplo-weaker-seeks-city-only` i `diplo-city-cession-r3` — wg Evaluatora czerwone także na bazie 774fd0eec (dług bazowy, nie regresja); bez zmian w r3.

## ODPOWIEDZI NA ZARZUTY EVALUATORA (r2 → r3)

1. (KRYTYCZNY) okno natywne + wpis „Ważne” dla gracza — PRZYJMUJĘ, WDROŻONE W KODZIE: `showForcedPeaceModal` (natywne okno, diplomacyAudience.ts) + wpis `warEventLog` (main.ts); toast usunięty. Dowód: `tsc` EXIT 0; wiring w main.ts (blok po `runWarWearinessTick`). NIE ZWERYFIKOWANE W PRZEGLĄDARCE (brak Chromium w tej rundzie) — do potwierdzenia.
   Pokój wymuszony gracza bez cichego zrzutu miast: miasta wybiera ta sama logika co AI↔AI (`planEscalatedPeacePayment`, stolica zakazana, min. 3 miasta).
   Przy bitwie w toku (`battlePending`): PRZYJMUJĘ jako odroczenie (pkt 1+2 z dodatku orkiestratora) — dowód: test F6 (`action === 'none'`, brak pay/peace, stan pary zostaje). ZAŁOŻENIE: wcześniejsze „battlePending = 0 miast” (dispatch, założenia) zastąpione odroczeniem; to zmiana zachowania — zgłaszam orkiestratorowi.
2. (KRYTYCZNY) 7 czerwonych testów (regresje) — PRZYJMUJĘ i NAPRAWIONO: 7/7 zielone (city-only, pw-behavior, ai-war-weariness-peace, unconditional-end [→ forced-peace], nonnegative W1–W4, ai-losing-war-asks, balance-accept). Każda zmiana asercji ma jednozdaniowe uzasadnienie w pliku (skala 40 tur = ten sam poziom przy ×2 tur; izolacja pokoju wymuszonego tam, gdzie testy dotyczą reguł ofert; galęzi „koniec zmęczenia” nie ma w `ai.ts` — `grep -rn "koniec zmeczenia" src` = pusto). ZERO wyjątków Node w tych plikach.
3. (WYSOKI) obsoletny `unconditional-end` z wyjątkiem Node — PRZYJMUJĘ: plik usunięty, zastąpiony testem pokoju wymuszonego (`diplo-weariness-forced-peace-test.cjs`, 14/0, z mutantem F9). Nie zostawiono wyjątku.
4. (WYSOKI) widok etapów 50/80/100% + „za ile tur” (`war-weariness-view.ts`) — PRZYJMUJĘ, NIE ZROBIONO w r3 (brak czasu/kontekstu na UI panelu). Otwarte — do r4 albo osobnego tematu. Nie deklaruję jako wykonane.
5. (ŚREDNI) Civpedia/wikiBundle — PRZYJMUJĘ i WDROŻONE: źródło `docs/encyklopedia/pojecia/zmeczenie-wojna.md` + `rozejm-pokoj.md` zaktualizowane (40 tur; 80% = oferta z miastami; 100% = pokój wymuszony); `wikiBundle.json` zregenerowany; `json-descriptions-sync-test` 19/0.
6. (WYSOKI) test gracza przy 100% — PRZYJMUJĘ, CZĘŚCIOWO: testy F3/F6/F7/F8 w `diplo-weariness-forced-peace-test.cjs` pokrywają logikę czystą (gracz jako strona pary, wybór miast bez stolicy, min. 3 miasta, odroczenie przy bitwie, remis = pokój bez miast). Wiring w `main.ts` (pary gracza, okno) nie ma testu automatycznego — brak; dopisać w r4.
7. (ŚREDNI) pomiary: symulacja ≥3 ziarna × ≥150 tur, Chromium — NIE ZMIERZONO (brak uruchomienia w tej rundzie). Stan jawny.
8. (NISKI/PROCES) lista długu Rust i „CZEKA NA RANO” w rejestrze — PRZYJMUJĘ: listę wpisuję poniżej (UWAGI). Rejestru nie zmieniam (poza zakresem Operatora). `00-dispatch.md` nadal nieobecny w origin/main — odnotowane.
9. (DO DECYZJI WŁAŚCICIELA) pokój AI↔AI przy cenie 0 / 1 mieście i bilans PW ujemny (zarzut 9 r2): NIE ZMIENIONO. Zachowane: bramka nieujemnego bilansu AI↔AI nadal obowiązuje oferty (`isAiAiPeaceBalanceAllowed`); pokój wymuszony omija tę bramkę wyłącznie przy 100% (zgodnie z założeniem A orkiestratora). Waga miasta +10% przy 40 turach i „min. 3 miasta / stolica nigdy / battlePending” — bez zmian (założenia dispatchu). CZEKA NA RANO (ABC właściciela).
10. (PROCES) PRZYJMUJĘ jako fakt: rebase/merge — origin/main jest przodkiem (sprawdzone). Lista długu Rust: patrz niżej.

## BLOKADY

1. Zarzut 4 (widok etapów 50/80/100% i „za ile tur”, `war-weariness-view.ts`) — OTWARTE.
2. Zarzut 7 (pomiary: symulacja ≥3×150 tur; Chromium: okno gracza, panel, zrzuty) — NIE ZMIERZONO.
3. Brak testu automatycznego wiringu main.ts dla gracza przy 100% (pary gracza, okno) — OTWARTE.
4. Okno i wpis „Ważne” nie zweryfikowane w przeglądarce — OTWARTE.
5. Decyzje ABC właściciela (zarzut 9; waga miasta 10%; stolica/min. 3 miasta; odroczenie przy battlePending zamiast „0 miast”) — CZEKA NA RANO.

## UWAGI-DLA-ORKIESTRATORA

- Dług Rust (REPIN) z tego tematu: `war-weariness-params.json:zmeczenie.pelneTur` (40), `progWymuszonyPokoj` (1,0), `progKoncaZmeczenia` (0,8 — tylko skala krzywej PW, nie pokój), `runWarWearinessTick` gałąź `forced_peace` (odroczenie przy battlePending, plan miast, karencja 40/100), migracja szczytu `if (st.peak > level)`, usunięty pokój bezwarunkowy w `ai.ts`, `planEscalatedPeacePayment`, okno/wpis gracza (`showForcedPeaceModal`, `warEventLog`), `wikiBundle` z nowymi frazami.
- Zmiana zachowania do zatwierdzenia: odroczenie pokoju wymuszonego przy `battlePending` (zamiast zapisu bez miast).
- Znalezisko poza zakresem: `diplo-weariness-20-turns-test.cjs` nosi nazwę historyczną; wszystkie jego asercje przechodzą na skali 40 tur (sprawdzić, czy nazwę zmienić przy porządkach).
- `00-dispatch.md` nie istnieje w origin/main; specyfikacja z dodatków (DODATEK 0/1) i z treści dispatchu.
- Rejestr (`REJESTR-PROSB-I-ZADAN.md`) i `WERSJE.md` — bez zmian (Operator nie edytuje).

DEPLOY/PUSH: NIE WYKONANO
