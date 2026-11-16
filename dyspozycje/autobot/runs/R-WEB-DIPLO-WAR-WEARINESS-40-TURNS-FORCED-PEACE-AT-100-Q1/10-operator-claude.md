# R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 — raport Operatora, runda 2/5

STATUS: BLOCK (częściowo; praca zacommitowana, temat NIE domknięty)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1
GOAL: zmęczenie wojną 40 tur do 100%; 80% = AI tylko proponuje pokój z miastami; 100% = pokój wymuszony, przegrywający oddaje miasta do zrównoważenia ceny; gracz objęty tak samo jak AI.
BAZA: kandydat r1 `35db7c8fc5a2ee484cae05418ef15bae4d0d18c3` (zawiera r2 gracz `ac53f563f`); PIERWSZY KROK wykonany: `git merge origin/main` (774fd0eec) bez konfliktów.

## ZMIANY / COMMIT

- Merge `origin/main` (774fd0eec) w worktree kandydata — bez konfliktów (20 plików, głównie cudze tematy ROAD-PAVED / UNIT-REPLACE-MULTITYPE). `git merge-base --is-ancestor 774fd0eec HEAD` = TAK.
- Commit tematu (SHA: patrz pole `sha` w wyniku Operatora). Allowlista:
  - `gra/tools/diplo-weariness-as-pw-peace-item-test.cjs` — przeskalowanie tur 10..16 → 20..32 (te same poziomy 0,50..0,80, te same wartości Z); asercja (b) przepisana: pokój wymuszony ⇔ L≥1 (`wearinessForcedPeaceDue`), R=0 ⇔ x≥1 (zamiast „bezwarunkowy ⇔ R=0”, co zakładało stary pokój przy 80%); asercja (e): brak `wearinessUnconditionalEndDue` w ai.ts i war-weariness.ts (funkcja usunięta, zgodnie z decyzją 80% = tylko oferta).
  - `gra/tools/diplo-weariness-c615-both-cities-test.cjs` — (e) tabela Z przy turach 2×t (skala 40 tur); wartości [0,17,68,154,273,427,615] bez zmian.
  - `gra/tools/diplo-weariness-migration-peak-test.cjs` (NOWY) — zarzut 4: test migracji szczytu (szczyt 1,0 ze starego zapisu, tura 12 = poziom 0,30 ⇒ brak forced_peace, szczyt przycięty do 0,30, brak finalize); kontrola dodatnia (100% ⇒ forced_peace).
  - `dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1/10-operator-claude.md` — ten raport.
- Kod gry (`gra/src/**`) w tej rundzie NIE zmieniony (poza mergem origin/main).

## MUTACJA (zarzut 4)

- Na pliku roboczym `gra/src/game/war-weariness.ts` usunięto klamrę `if (st.peak > level) st.peak = level;` (sed), uruchomiono `node tools/diplo-weariness-migration-peak-test.cjs` ⇒ FAIL=3, exit 1 (czerwono — mutant wykryty).
- Plik przywrócony z kopii w scratchpadzie; `grep -c MUTANT` = 0; `git diff` pliku = pusty.

## TESTY (surowe wyniki, po merge)

- `npx tsc --noEmit` (gra/): EXIT 0.
- `node tools/diplo-weariness-migration-peak-test.cjs`: PASS=7 FAIL=0, exit 0 (nowy).
- `node tools/diplo-weariness-as-pw-peace-item-test.cjs`: PASS=194 FAIL=0, exit 0 (przed: exit 1).
- `node tools/diplo-weariness-c615-both-cities-test.cjs`: PASS=11 FAIL=0, exit 0 (przed: 10/1).
- `node tools/diplo-weariness-20-turns-test.cjs`: PASS=31 FAIL=0 (nietknięty).
- `node tools/diplo-weariness-display-test.cjs`: PASSED 52 / FAILED 0.
- `node tools/json-descriptions-sync-test.cjs`: exit 0.
- Pozostałe czerwone (NIE naprawione w tej rundzie, surowe wyniki z przebiegu po merge):
  - `diplo-weariness-city-only-test`: PASS=27 FAIL=3 (c: remis sił bez miasta; e1: ochrona przy 0,8; g2: remis przed progiem).
  - `diplo-weariness-pw-behavior-test`: (f) AI→gracz tura 20, wiersz Z po stronie gracza; (b2) bilans „rośnie” przy Z=0 dla mnożnika 0,7 i 1,0 (test zakłada skalę 20 tur).
  - `ai-war-weariness-peace-test`: parametr pelneTur (oczekiwano 20, JSON 40); „równa wojna 200 tur bez miasta ⇒ offer_rejected” dostaje forced_peace; 4a-NN.
  - `diplo-weariness-unconditional-end-test`: TypeError — `wearinessUnconditionalEndDue` nie istnieje (test obsoletny; wg zarzutu 3 do przepisania na test pokoju wymuszonego — NIE ZROBIONO).
  - `diplo-peace-ai-ai-nonnegative-test`: 17 PASS / 4 FAIL (W1–W4) — NIE ZMIENIANO.
  - `ai-losing-war-asks-peace-vs-player-test`: 11 PASS / 1 FAIL — NIE ZMIENIANO.
  - `diplo-peace-balance-accept-test`: A5 (AI silniejsza, 20 tur ⇒ pokój bezwarunkowy) — NIE ZMIENIANO.
- NIE ZMIERZONO w tej rundzie: symulacja ≥3 ziarna × ≥150 tur, Chromium (okno, panel, zrzuty 1280×720).

## ODPOWIEDZI NA ZARZUTY FC r1 (wiążące 1–7, 10)

1+2. Gracz przy 100% (ac53f563f, obecny w kodzie: `tickAiAiWarWeariness` dodaje pary gracz↔AI). W tej rundzie NIE dodano natywnego okna po polsku ani wpisu w „Ważne”. Toast `showHintMessage` istnieje. OTWARTE.
3. 11 czerwonych testów: naprawione 2 (as-pw-peace-item, c615). Pozostałe 9 (city-only ×3, pw-behavior, ai-war-weariness-peace, unconditional-end, nonnegative W1–W4, ai-losing-war-asks, weaker-seeks-city-only, balance-accept, city-cession-r3) — NIE ZROBIONO. Wymaga przepisania asercji po decyzji zarzutu 9 o bilansie AI↔AI. Bez wyjątków Node.
4. Test migracji szczytu + mutacja: ZROBIONE.
5. Widok etapów 50/80/100% i „za ile tur” w `war-weariness-view.ts` — NIE ZROBIONO (plik widoku bez zmian; brak w nim etykiet etapów).
6. Civpedia/wikiBundle — NIE ZROBIONO.
7. Pomiary (symulacja, Chromium) — NIE ZMIERZONO.
10. Lista długu Rust (REPIN) — do wpisania przez orkiestratora: `gra/data/war-weariness-params.json` (`pelneTur` 40, `progWymuszonyPokoj` 1,0, `karencjaPoPokojuTur`, `karencjaChronionegoTur`); `gra/src/game/war-weariness.ts` (`wearinessForcedPeaceDue`, migracja szczytu w `runWarWearinessTick`); `gra/src/game/war-weariness-view.ts` (skala 40 tur w widoku); `gra/src/game/ai.ts` (80% = tylko oferta, komentarz przy bramce pokoju).

Zarzut 9 (bilans AI↔AI, cena 0 / 1 miasto, waga miasta 10%): NIE ZMIENIONO — decyzja produktowa; założenia z dispatchu pozostawione.

## BLOKADY

1. Okno natywne i wpis „Ważne” dla pokoju wymuszonego (zarzut 2) — brak.
2. 9 czerwonych testów (zarzut 3) — brak przepisania.
3. Widok etapów (zarzut 5) i Civpedia/wikiBundle (zarzut 6) — brak.
4. Symulacja ≥3×150 tur, Chromium — NIE ZMIERZONO.
5. Test „gracz przy 100%” (zachowanie gracza w tickAiAiWarWeariness) — brak testu automatycznego.

## ZAŁOŻENIA

- Z1: asercja (b) w teście as-pw-peace-item: „R=0 ⇔ x≥1” (x z progKoncaZmeczenia 0,8) — zachowanie tabeli PW, nie decyzja o pokoju.
- Z2: migracja szczytu — szczyt przycinany do bieżącego poziomu w `runWarWearinessTick` (istniejący mechanizm); test go weryfikuje.

## NASTĘPNY KROK

1. Orkiestrator: decyzja o zarzucie 9 (ABC) przed przepisaniem pozostałych testów.
2. r3 (Operator): okno natywne + „Ważne” dla gracza, widok etapów 40 tur, test gracza przy 100%, przepisanie pozostałych testów z jednozdaniowym uzasadnieniem, wikiBundle.
3. Dopiero potem symulacja ≥3×150 tur i Chromium.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch podany w treści zadania: `00-dispatch.md` nie istnieje w origin/main ani w kandydacie; DODATEK w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` jest ucięty. Specyfikacja z treści dispatchu.
- Plik `10-operator-claude.md` nadpisano raportem r2 (r1 dostępny w historii git, SHA 0c913c13b).
- `gra/node_modules` zainstalowane (`npm ci --ignore-scripts`) w worktree — do sprzątania po integracji.
- Dysk: 7,9 GB wolne przy starcie (`/`, 80% zajęte).
- Nie uruchamiano `npm run build`/`dev`. Brak push, brak merge do main, brak deployu.

DEPLOY/PUSH: NIE WYKONANO
