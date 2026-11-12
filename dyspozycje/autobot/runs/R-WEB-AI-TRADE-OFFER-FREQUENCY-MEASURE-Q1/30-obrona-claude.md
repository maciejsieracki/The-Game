# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — obrona Operatora (runda 2, Obrona Haiku)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (pomiar; hooki za ?civTest=1; zero zmian reguł handlu i bramek)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyć częstość ofert AI→gracz w pełnej grze (≥3 ziarna × ≥150 tur × ≥3 relacje, tryb przyspieszony, tabela zbiorcza). NIE_ZMIERZONO w całości — patrz odpowiedzi na zarzuty 1, 2, 8.
BAZA/KANDYDAT: 259aaa615 (start obrony); nowy commit obrony = SHA w polu sha.
NUMERACJA: odpowiedzi według zarzutów Evaluatora (nr 1–8) z 20-evaluator-claude.md.

## ZMIANY-COMMIT (obrona r2)
- gra/src/main.ts (+2 linie, w bloku `?civTest=1`): pole `relTotalAi` w `__aiTradeWiringTestDebug.state()` = relationTotal pary AI(start)↔gracz (odczyt, bez zapisu).
- gra/tools/measure-ai-trade-offer-frequency.cjs:
  - `MEAS_GATE=1` = tryb bramki: URL bez `civTest=1`, z `civSeed=999`; zapis `pass` (seed = 271828 i brak haka).
  - Relacja przypinana (`setRelationTotal`) PRZED każdym endTurn (`relBeforeEnd`), po turze zapisywane `relTotalAi`; pola `relDrift`, `relPinnedBeforeEnd`, `relTotalFirst/Last`.
  - Etykiety `seedNote`/`relationNote` wyliczane z env (dawne stałe były błędne).
- dyspozycje/.../evidence/: gate-noflag-civSeed999-r3.json, gate-MUTANT-seedgate-removed-r3.json, smoke-seed1111-rel40-r3-repeat-A.json, smoke-seed1111-rel40-r3-repeat-B.json (przed przypięciem relacji), smoke-seed1111-rel40-r3-pinned.json, natural-seed1111-rel40-r3-partial.json (częściowy 150-tur, przerwany).
- Nie zmieniano: gra/src poza powyższymi 2 liniami, JSON balansu, WERSJE.md, rust-port. Mutant `civ-test-hooks.ts` cofnięty (`git checkout`), nie jest w commicie.

## TESTY (surowe wyniki)
- `npm ci --ignore-scripts` (gra/): EXIT=0. Bez `npm run build/dev`.
- `npx tsc --noEmit -p .` (gra/): TSC_EXIT=0.
- Bramki: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.` (wszystkie EXIT=0).
- Bundle vite do scratchpadu (BUNDLE_DIR poza repo), build 23,80 s.
- Zarzut 3 (bez flagi): `MEAS_GATE=1 MEAS_SEED=999` → `{"seedSeen":271828,"seedExpected":271828,"hookPresent":false,"pass":true}`.
- Zarzut 4 (mutacja): w `civTestSeedOverride` usunięto `isCivTestEnabled` (plik tymczasowo zmieniony, build bundle-mut) → `{"seedSeen":999,"seedExpected":271828,"hookPresent":false,"pass":false}`. Bramka wykrywa mutanta. Mutacje `setRelationTotal`/`entries` NIE wykonane (NIE_ZMIERZONO).
- Zarzut 5 (powtarzalność): dwa przebiegi smoke (3 tury, seed 1111, rel 40, natural, przed przypięciem): identyczne `perTurn`, `offers`, `tableEnd` (repeat-A vs repeat-B). Tylko 3 tury i 0 ofert; brak powtórzeń dla ≥3 ziaren.
- Zarzut 7 (dryf relacji), zmierzone:
  - bez przypięcia: relTotalAi po turach = 29, 9, 11 (repeat-A), ustawione 40;
  - z przypięciem: relBeforeEnd = 40 w każdej turze, relTotalAi po endTurn = 29 w każdej turze (smoke-pinned). Wniosek: endTurn sam obniża relację (~−11), a AI widzi wartość przypiętą.
- Częściowy przebieg 150 tur (seed 1111, rel 40, natural, MEAS_MAX_SEC 470): `turnsRun` 23, `stoppedBy` = "blad: page.waitForFunction: Timeout 90000ms exceeded.", diag: tura 24, `endBlocks`: "[EndTurn] blocked: preBattleOpen {pending: true}" (x3). Oferty: 2 (obie jednorazowe, actionId "rozejm", tury 11 i 17), cykliczne 0, „Przyjmij” aktywne 0. per100 nie policzono (przerwanie). Tury 1–23 łącznie ~470 s.

## POKRYCIE vs GOAL (stan po obronie r2)
- Ziarna: 1 (1111) w danych; ≥3 NIE_ZMIERZONO.
- Relacje: 1 poziom (40, przypięty); ≥3 NIE_ZMIERZONO.
- Tury: 23 z 150 (jeden przebieg, przerwany); NIE_ZMIERZONO.
- Tryb przyspieszony: NIE zaimplementowany; NIE_ZMIERZONO.
- Tabela zbiorcza: NIE wykonana.

## ODPOWIEDZI NA ZARZUTY EVALUATORA
1. (GOAL niespełniony, brak pomiaru ≥3×≥150×≥3) — PRZYJMUJĘ. Nie naprawione w tej rundzie. Dane: 23 tury z 150, jedna komórka. Powód: (a) runner przerywa na oknie przedbitewnym (`preBattleOpen`, tura 24) — `clearBattles` klika `.pb-overlay [data-act="auto"]`, które nie zwolniło blokady; przyczyny nie zbadano; (b) brak wznawialnego stanu między wywołaniami bash (każde wywołanie zaczyna od tury 0); (c) przy ~7 s/turę jedna komórka 150 tur ≈ 1050 s > limit 590 s. Wymaga decyzji orkiestratora (patrz BLOKADY).
2. (tryb przyspieszony niezaimplementowany) — PRZYJMUJĘ jako fakt. NIE naprawione: zmiana pętli endTurn/render wykracza poza hooki i wymaga osobnej decyzji (ścieżka A: osobny mały temat hakowy; ścieżka B: zawężenie GOAL).
3. (brak testu bez flagi) — PRZYJMUJĘ, NAPRAWIONE: tryb MEAS_GATE (wynik wyżej, pass:true).
4. (brak dowodu mutacyjnego) — PRZYJMUJĘ, CZĘŚCIOWO NAPRAWIONE: mutacja bramki ziarna wykryta (pass:false). Nieobjęte: mutacje `setRelationTotal` i `entries` (NIE_ZMIERZONO; wymagałyby kolejnych buildów/testów).
5. (surowe wyniki i powtarzalność) — PRZYJMUJĘ częściowo: powtórzenie 3-turowego smoke identyczne (wyniki w evidence/). Zakres ziaren NIE_ZMIERZONO. Realnej zmiany mapy między ziarnami NIE porównano (NIE_ZMIERZONO) — zarzut o haku ziarna pozostaje otwarty.
6. (niespójne etykiety w smoke r2) — PRZYJMUJĘ, NAPRAWIONE w skrypcie (etykiety z env). Plik smoke-seed1111-rel40-natural-3t-r2.json POZOSTAWIONY jako historyczny z błędnymi etykietami (nie edytuję dowodów). Nowe pliki r3 mają poprawne etykiety.
7. (dryf relacji bez dowodu trwałości) — PRZYJMUJĘ, zmierzone i zaradzone: dryf realny (40 → 29 po endTurn). Zaradzenie: przypięcie przed każdym endTurn (relBeforeEnd = 40 w każdej turze). Dryf po turze nadal istnieje i jest zapisany (relDrift = true); to ograniczenie interpretacji, nie błąd haka.
8. (brak liczb do ABC #274) — PRZYJMUJĘ. Nie ma wniosku o częstości. Jedyna liczba: 2 oferty w 23 turach (obie jednorazowe „rozejm”); nie jest podstawą decyzji ABC (jedna komórka, przerwany przebieg).

## BLOKADY / DECYZJA WYMAGANA
1. Pomiar GOAL niewykonany (zarzut 1). Potrzebna decyzja: (A) osobny temat hakowy: tryb przyspieszony + obsługa okna przedbitewnego w runnerze + zapis/wczytanie stanu (quickSave/loadSlot) do wznowienia; albo (B) zawężenie GOAL do pomiaru z mniejszą liczbą tur/komórek i jawnym NIE_ZMIERZONO reszty.
2. Okno przedbitewne (`preBattleOpen`) blokuje endTurn w teście (tura 24) — przyczyna nieznana; potrzebna diagnoza przed kolejnym przebiegiem.
3. Decyzja ABC #274 bez danych.

## NASTĘPNY KROK
Orkiestrator: decyzja A/B z blokady 1 oraz zlecenie diagnozy okna przedbitewnego (blokada 2). Dopiero potem przebiegi 3 ziarna × 3 relacje z wynikiem zbiorczym.

## RUNDY
2/5 (obrona). Evaluator i Final Control poza tym etapem.

DEPLOY/PUSH: NIE WYKONANO
