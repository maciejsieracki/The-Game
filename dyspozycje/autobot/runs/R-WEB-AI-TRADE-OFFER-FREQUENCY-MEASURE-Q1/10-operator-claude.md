# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — raport Operatora (runda 2/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (pomiar; hooki testowe za ?civTest=1; zero zmian reguł handlu i bramek)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyć, jak często AI składa graczowi ofertę handlową (cykliczną i jednorazową) w pełnej grze: ≥3 ziarna × ≥150 tur × ≥3 relacje, tryb przyspieszony, oferty na 100 tur, „Przyjmij” aktywne, pary surowców.
BAZA/KANDYDAT: e71cc287d (detached) + merge origin/main b4853c8e6 → HEAD merge 7e43712c0; commit kodu rundy 2 = SHA w polu sha raportu Workflow.

## ZMIANY-COMMIT (allowlista rozszerzona DODATKIEM r2)
- gra/src/game/civ-test-hooks.ts: nowa funkcja `civTestSeedOverride(search)` — czyta `?civSeed=<liczba>` WYŁĄCZNIE gdy `civTest=1` (inaczej null).
- gra/src/main.ts:
  - import `civTestSeedOverride`;
  - `doStartPlaytestMapaSwiata`: `playtestRunSeed = civTestSeedOverride(location.search) ?? PLAYTEST_MAPA_SEED`; 4 użycia stałej zamienione na `playtestRunSeed` (seed w NewGameParams, overlay, generujSwiatAsync, log). Bez `civTest=1` zachowanie identyczne z dotychczasowym (ziarno 271828).
  - w bloku `if (civTest=1)` obiektu `__aiTradeWiringTestDebug`: nowy `setRelationTotal(ai, total)` (zaufanie = floor(total/2), respekt = reszta, clamp 0–200, zwraca relationTotal po zapisie) oraz w `state()` pole `entries` (WSZYSTKIE wpisy stolu: id, actionId, cyclic, proposer, responder).
- gra/tools/measure-ai-trade-offer-frequency.cjs: env `MEAS_SEED`, `MEAS_REL`; URL `&civSeed=`; ustawienie relacji po prepare; liczenie ofert z `entries` — cykliczne (pending + previewAccept + pary) i jednorazowe (`offersOneShot`, bez payloadu); pola `offersCyclic`, `offersOneShot`, `seed`, `relTotalSet`, `relTotalAfter`.
- dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/evidence/smoke-seed1111-rel40-natural-3t-r2.json (dowód działania haków, patrz TESTY).
- Nie zmieniano: gra/src poza powyższymi (brak zmian reguł), JSON balansu, WERSJE.md, rust-port. `git diff --check` → czysto.

## TESTY (surowe wyniki z terminala)
- `npm ci --ignore-scripts` (gra/) → NPM_EXIT=0. Bez `npm run build/dev`.
- `npx tsc --noEmit -p .` (gra/) → TSC_EXIT=0 (bez wyjścia).
- Bramki (5, na kodzie z tymi zmianami):
  - `node tools/logic-test.cjs` → EXIT=0, `LOGIC OK (213/213)`
  - `node tools/tech-tree-test.cjs` → EXIT=0, `tech-tree-test: 20 pass, 0 fail`
  - `node tools/research-test.cjs` → EXIT=0, `ALL GREEN`
  - `node tools/unit-replace-test.cjs` → EXIT=0, `WSZYSTKIE TESTY ZIELONE (21/21)`
  - `node tools/combat-test.cjs` → EXIT=0, `All sanity checks passed.`
- Bundle vite zbudowany poza repo (`BUNDLE_DIR` w scratchpadzie), smoke:
  - `MEAS_TURNS=3 MEAS_ARM=natural MEAS_SEED=1111 MEAS_REL=40` → `RESULT {"arm":"natural","turnsRun":3,"offers":0,...,"consoleErrors":0}`, EXIT=0, secs=21 (≈7 s/turę).
  - Potwierdzenie haków w JSON: `seed: 1111`, `relTotalSet: 40`, `relTotalAfter: 40` (hak setRelationTotal działa; ziarno przekazane w URL).
- Mutacja / brak flagi: hak `setRelationTotal` i `entries` są w bloku `if (civTest=1)` (grep: linia wejścia bloku niezmieniona); `civTestSeedOverride` zwraca null bez `civTest=1`. Żywy test „bez flagi hak nieobecny” NIE_ZMIERZONO w tej rundzie (pominięty — czas).
- Tryb przyspieszony: NIE ZAIMPLEMENTOWANO (patrz BLOKADY 2). NIE_ZMIERZONO.

## POKRYCIE vs GOAL (stan po rundzie 2)
- Ziarna: haki gotowe (`?civSeed=`), ale przebiegów ≥3 ziaren NIE wykonano → NIE_ZMIERZONO.
- Relacje: hak gotowy (`setRelationTotal`, zweryfikowany w smoke: 40 → 40); przebiegów ≥3 poziomów NIE wykonano → NIE_ZMIERZONO.
- Tury: 150 tur NIE wykonano; jedyne dane to smoke 3 tury (ziarno 1111, relacja 40, ramię natural) — bez wniosku o częstości.
- Oferty jednorazowe: hak `entries` gotowy; w smoke 0 wpisów (3 tury), brak danych → NIE_ZMIERZONO.
- „Przyjmij aktywne”, pary surowców: bez danych w tej rundzie → NIE_ZMIERZONO.
- Powtarzalność (to samo ziarno = ten sam wynik): NIE_ZMIERZONO.
- Wynik częstości w pełnej grze: NIE_ZMIERZONO.

## WNIOSKI (bez progu)
- Blokady z rundy 1 są w części zdjęte: ziarno, relacja i typ wpisu (cykliczny/jednorazowy) są dostępne przez haki za `?civTest=1`, bez zmian reguł.
- Pomiar pełnego zakresu nadal niewykonalny w tej rundzie z powodu czasu: ~7 s/turę × 150 tur ≈ 17–18 min na jedną komórkę (ziarno × relacja), 9 komórek ≈ 2,6 h wall-clock. Limit bash 590 s i zakaz tła wymagają wznawialnego przebiegu, a skrypt nie zapisuje/wczytuje stanu gry.
- Nie wiadomo, ile z czasu tury to render (swiftshader); bez trybu przyspieszonego nie da się tego ograniczyć po stronie testu.

## BLOKADY / DECYZJA WYMAGANA
1. Tryb przyspieszony (pętla tur bez renderu) z GOAL NIE zaimplementowany — wymaga zmiany w endTurn/render, czego ta runda nie obejmowała; decyzja orkiestratora: osobny mały temat hakowy albo zgoda na zawężenie GOAL.
2. Czas i wznawianie: 9 komórek × 150 tur nie mieści się w jednym wywołaniu bash ani bez tła; potrzebny runner wznawialny (zapis/wczytanie stanu przez istniejące `quickSave`/`loadSlot` haka) albo zmniejszenie zakresu. Decyzja orkiestratora.
3. Decyzja ABC #274 (częstość ofert) nadal bez danych; wniosek dopiero po przebiegach powyżej.

## NASTĘPNY KROK
Orkiestrator: decyzja w sprawie blokad 1–2 (tryb przyspieszony i runner wznawialny albo zawężenie GOAL). Po decyzji: przebiegi 3 ziarna × 3 relacje (parametry: MEAS_SEED, MEAS_REL, MEAS_TURNS, MEAS_RESULT), każdy ≤480 s, wyniki w evidence/.

## RUNDY
2/5 (runda 2, Operator Haiku, po BLOCK r1). Obrona, Evaluator i Final Control poza tym etapem.

DEPLOY/PUSH: NIE WYKONANO
