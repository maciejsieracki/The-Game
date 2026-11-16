# R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 — obrona Operatora, odpowiedź na zarzuty Evaluatora (runda 2)

STATUS: PASS-WITH-NOTES (częściowo: zarzut 1 wdrożony; zarzuty 2–7 i 9 otwarte lub wymagają decyzji — szczegóły niżej)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1
GOAL: zmęczenie wojną 40 tur do 100%; 80% = AI tylko proponuje pokój z miastami (bez bezwarunkowego końca); 100% = pokój wymuszony, wyraźnie przegrywający oddaje tyle miast, ile trzeba do zrównoważenia ceny; brak wyraźnie przegrywającego = pokój bez miast; gracz objęty tak samo jak AI.
BAZA: 0c913c13bd7dc46ee12132e41c7e31337b44c99e (kandydat r1, detached). Kod operatora na gałęzi bez zmian poza commitem r2.

## ZMIANY / COMMIT

- ac53f563f — `gra/src/main.ts` (tylko ten plik w r2):
  - `tickAiAiWarWeariness`: do pól `pairs` dodane pary `{a: ME(), b: major}` dla każdej głównej AI w stanie `wojna` z graczem (zarzut 1). Ten sam `runWarWearinessTick` obsługuje obie strony (`forced_peace` płatne miastami przegrywającego, bez bramki bilansu).
  - Po wywołaniu tick: dla każdego `outcome.action === 'forced_peace'` z udziałem gracza wyświetla się toast `showHintMessage` (zarzut 2, część: komunikat po polsku; liczba oddanych miast lub „bez miast”).
- Nie zmieniano: `war-weariness.ts`, `ai.ts`, JSON, testy (r1 bez zmian).
- Allowlista: tylko `gra/src/main.ts` w r2 + ten raport. `git diff --stat 0c913c13b ac53f563f` = 1 plik (main.ts).

## TESTY (surowe wyniki, uruchomione 2026-11-16 w worktree)

- `npx tsc --noEmit` (gra/, po `npm ci --ignore-scripts`): EXIT 0.
- `node tools/diplo-weariness-20-turns-test.cjs`: exit 0, PASS=31 FAIL=0 (mutanty wykryte).
- `node tools/json-descriptions-sync-test.cjs`: exit 0, 19 pass / 0 fail.
- `node tools/diplo-weariness-as-pw-peace-item-test.cjs`: exit 1 (czerwony, jak w r1).
- `node tools/diplo-weariness-city-only-test.cjs`: exit 1, PASS=27 FAIL=3 (jak w r1, 3 FAIL).
- `node tools/diplo-weariness-unconditional-end-test.cjs`: exit 1 (test obsoletny — testuje usunięty pokój bezwarunkowy).
- `node tools/ai-war-weariness-peace-test.cjs`: exit 1 (jak w r1).
- NIE ZMIERZONO w r2: pozostałe czerwone z r1 (pw-behavior 17 FAIL, c615, nonnegative W1–W4, ai-losing-war-asks, weaker-seeks-city-only, balance-accept, city-cession-r3) — nie uruchamiano ponownie; wynik r1 zakłada się bez zmian (kod war-weariness.ts/ai.ts nie zmieniony w r2).
- NIE ZMIERZONO: symulacja ≥3 ziarna × ≥150 tur; Chromium (panel, toast, okno); test migracji szczytu (zarzut 4).

## ODPOWIEDZI NA ZARZUTY EVALUATORA

1. (KRYTYCZNY, gracz nie objęty pokojem wymuszonym) — PRZYJMUJĘ. Poprawka: `ac53f563f`, `main.ts` `tickAiAiWarWeariness` dodaje pary gracz↔major w wojnie do tego samego ticku. Dowód: `git diff 0c913c13b ac53f563f --stat` = 1 plik; tsc EXIT 0. Ograniczenie: brak testu sprawdzającego zachowanie gracza przy 100% (nie napisano testu w tej rundzie) — zaliczono jako NIE ZMIERZONO w symulacji.
2. (KRYTYCZNY, brak okna i wpisu w „Ważne”) — CZĘŚCIOWO. Przyjęto: toast po polsku przez `showHintMessage` (ac53f563f). ODRZUCAM jako wykonane: modalne okno oraz wpis w „Ważne” (`warEventLog`) — nie zrobiono w tej rundzie; wymaga osobnego wzorca UI (recordWarDeclarationEvent jako wzór) i zostaje jako otwarty punkt do r3 lub osobnego tematu. Bez tego gracz widzi tylko krótki toast.
3. (WYSOKI, 11 czerwonych testów, regresja) — PRZYJMUJĘ FAKT, NIE NAPRAWIONO. Czerwone testy kodują stare zachowanie (skala 20 tur, pokój bezwarunkowy przy 80%, bramka nieujemnego bilansu AI↔AI). Część wymaga decyzji (zarzut 9), część przepisania. Nie przepisywano asercji „na zielono" bez decyzji — to byłoby osłabianie testów. Lista do r3: as-pw-peace-item (×6 tur 11–16), c615 (1), city-only (3), pw-behavior (17), unconditional-end (usunąć lub przepisać na wymuszenie), ai-war-weariness-peace (1 + Node exception), ai-ai-nonnegative (4, zależne od zarzutu 9), ai-losing-war-asks-peace (1), weaker-seeks-city-only (3), balance-accept (1), city-cession-r3 (2). Wyjątki Node w unconditional-end i ai-war-weariness-peace do wyjaśnienia (exit 1 z wyjątku, nie z asercji).
4. (WYSOKI, brak testu migracji) — NIE ZROBIONO. Mechanizm (clamp `if (st.peak > level) st.peak = level` w war-weariness.ts:279–283) istnieje; test mutacyjny z r1 potwierdza brak wykrycia usunięcia. Do r3: test ze szczytem 1,0 w store i poziomem 0,3 → brak `forced_peace`.
5. (WYSOKI, widok etapów 50/80/100% i „za ile tur”) — PRZYJMUJĘ, NIE ZROBIONO. `war-weariness-view.ts` bez zmian; do r3.
6. (ŚREDNI, Civpedia/wikiBundle) — PRZYJMUJĘ, NIE ZROBIONO. Do r3 (wikiBundle.json wymaga regeneracji po zmianie opisów).
7. (ŚREDNI, NIE ZMIERZONO) — PRZYJMUJĘ jako fakt. Symulacja ≥3×150 tur i Chromium nie wykonane w tej rundzie.
8. (NISKI, json-descriptions-sync-test.cjs) — ODRZUCAM zarzut o osłabieniu: asercje merytoryczne nie zostały osłabione; zmiana a1/c1 wynika z nowego parametru `progWymuszonyPokoj` i zamiany funkcji (`wearinessUnconditionalEndDue` → `wearinessForcedPeaceDue`). Test zielony 19/0. Ryzyko kolizji z innymi tematami weariness — przyjęte do wiadomości orkiestratora.
9. (DO DECYZJI, pokój AI↔AI omija bramkę nieujemnego bilansu, zachodzi przy cenie 0 i 1 mieście) — NIE ZMIENIONO. To jest decyzja produktowa (dispatch: „musi zabrać pokój”), wymaga potwierdzenia właściciela przez orkiestratora (pytanie ABC). Ten sam zakres obejmuje teraz gracza. Waga miasta 10% przy 40 turach (≈4 tury na miasto) — bez zmiany, do decyzji.
10. (PROCES) — PRZYJMUJĘ. Dodatek 00-dispatch-DODATEK-claude.md w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` jest ucięty (124 B); plik `00-dispatch.md` NIE istnieje w `origin/main` ani w kandydacie (`git ls-tree` pokazuje tylko 10-operator-claude.md), więc specyfikacja pochodzi z treści dispatchu przekazanej do Operatora. Baza kandydata 0c80544ee vs origin/main (FALA 781, 774fd0eec): rebase/merge-tree nie wykonany w r2 — orkiestrator decyduje o integracji.

## BLOKADY

1. Okno modalne i wpis w „Ważne” dla pokoju wymuszonego (zarzut 2) — otwarte.
2. 11 czerwonych testów (zarzut 3) — otwarte, wymaga przepisania lub decyzji (zarzut 9).
3. Test migracji szczytu (zarzut 4) — otwarte.
4. Widok etapów i Civpedia/wikiBundle (zarzuty 5–6) — otwarte.
5. Symulacja ≥3×150 tur, Chromium — NIE ZMIERZONO.
6. Decyzja właściciela: zarzut 9 (bilans AI↔AI, cena 0, 1 miasto, waga miasta 10%).

## ZAŁOŻENIA

- Z1: toast `showHintMessage` jako minimalny komunikat dla gracza w r2 (pełne okno odłożone; patrz zarzut 2).
- Z2: para gracz↔AI używa tej samej wyceny (`price`), bramki cityCessionOk i planu tylko-miasta co AI↔AI; nie dodawano osobnej wyceny dla gracza.
- Z3: przy wojnie gracza z kilkoma AI tick przetwarza każdą parę osobno (bez zmian kolejności).

## NASTĘPNY KROK

1. Orkiestrator: potwierdzić zarzut 9 (pytanie ABC) i zdecydować, czy okno modalne + „Ważne” wchodzą w r3 czy osobny temat.
2. r3 (Operator): przepisać 11 czerwonych testów (po decyzji), dodać test migracji, test gracza przy 100%, wpis w „Ważne”, widok etapów, wikiBundle.
3. Dopiero potem symulacja ≥3×150 tur i Chromium.

## UWAGI-DLA-ORKIESTRATORA

- Nie ma `00-dispatch.md` w repo dla tego tematu — orkiestrator powinien dopisać go do gałęzi, jeśli ma być źródłem prawdy.
- `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` w worktree (do sprzątania po integracji).
- Nie uruchamiano `npm run build`/`dev`. Nie wykonano pusha ani merge do main.

DEPLOY/PUSH: NIE WYKONANO
