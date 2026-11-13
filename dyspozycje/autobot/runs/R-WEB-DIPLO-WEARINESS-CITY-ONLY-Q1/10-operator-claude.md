# R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1
GOAL: zmęczenie wojną nadal kończy długie wojny, ale WYŁĄCZNIE oddaniem miast (bez złota i surowców), miarą „kto słabszy” jest siła militarna, a słabsza strona z jednym miastem nie kupuje pokoju do końca wojny (zmiany 1–5 z DODATKU).
BAZA: 5a50a5958 (origin/main f0853a6cc). Kod + testy: commit 1c43a9818. Ten raport: commit po nim (czubek pracy = jego SHA).
ZAKAZY: bez zmian w diplomacy-ai-offer-balance.ts, diplomacy-ai-forced-peace.ts, diplomacy-proposals.ts, power-objective.ts, WERSJE.md, gra-robocza/, rust-port/. Bez npm run build/dev. Bez git add -A. Bez spawn_task ani create_session.

## Zmiany (plik:linia po commicie 1c43a9818)

- gra/src/game/war-weariness.ts
  - :107 `stageCityLimit` — stopień 1 oddaje 1 miasto (było 0: złoto było jedyną walutą stopnia 1). Zmiana 2.
  - :125 `planEscalatedPeacePayment` — plan WYŁĄCZNIE z miast (było: najpierw złoto i surowce). Zmiana 2.
  - :201 `WearinessTickDeps.weakerOf?` (nowy, opcjonalny) — słabsza strona wg siły militarnej; brak = dawna reguła po udziale. Zmiana 1.
  - :240 tick — przegrywający = `weakerOf` (remis: reguła compareMilitaryStrength, większe id = słabsze). Usunięta gałąź „clearlyLosing” z pokojem wzajemnym bez zapłaty (zmiana 3).
  - :246 `shareForDespair = min(loserShare, udzialWyraznie)` — słabsza strona przy remisie (udział 0,5) liczona jak na progu 0,45, więc nie wypada z oferty (zmiana 3, reguła remisu).
  - :254 `if (ownCities <= 1) none` — słabsza strona z jednym miastem nie składa oferty (zmiana 4).
  - :289 `cityGiven` — pokój (także chroniony / wyczerpanie) tylko gdy w planie jest miasto (zmiana 4).
  - :296 finalize — karencja 40 zwykły / 100 chroniony bez zmian (z JSON).
  - Bez zmian: `loserDespair`, `despairStage`, `offerMultiplier`, `data/war-weariness-params.json` (zero zmian w JSON).
- gra/src/main.ts (`tickAiAiWarWeariness`, :36639)
  - :36667 `shareOf` — udział SIŁY MILITARNEJ (diploMilitarySideOf), było requesterShare(Power). Zmiana 1.
  - :36672 `weakerOf` — peaceStanceOf na sile militarnej. Zmiana 1.
  - Reszta okablowania bez zmian (price, pay, finalize z lockTurns).
- gra/src/game/ai.ts (decideAIDiplomacy, blok zmęczenia)
  - :7034 `wearyShare` = silaMilitarnaAI / (AI + partner); fallback rw tylko przy braku danych siły. Zmiana 1 dla gałęzi AI.
  - :7037 `loserDespair` liczony z `wearyShare` (było `rw`). Bramka oddania miasta (`peacePosMil==='slabsza'`) bez zmian — już wcześniej miasto-only.
- gra/src/game/diplomacy-proposals.ts — BEZ ZMIAN. :1375 `wearinessPeacePriceFactor` (rabat ceny od zmęczenia, bez złota). :1384 `nonCitySweetener` odrzuca złoto/surowce w ofercie gracza (już wcześniej). Zgodne z zmianą 2.
- gra/src/game/diplomacy-ai-offer-balance.ts — BEZ ZMIAN. Brak ścieżek zmęczenia (grep: 0 trafień).
- gra/src/game/diplomacy-ai-forced-peace.ts — BEZ ZMIAN. :356-361 `runAiAiPeaceTick` (wymuszony pokój AI↔AI) już płaci wyłącznie miastami (filtr `kind==='miasto'`, wcześniejszy D2). Zmiana 5 spełniona bez edycji. Patrz UWAGI.

## Mapa zmian 1–5 (DODATEK)

- Zmiana 1 (miara = siła militarna): war-weariness.ts:240, main.ts:36667/36672, ai.ts:7034. TAK.
- Zmiana 2 (tylko miasta, bez złota/surowców): war-weariness.ts:107/125; proposals i forced-peace już tak. TAK.
- Zmiana 3 (usuń pokój wzajemny bez zapłaty; remis = słabsza płaci miastem): war-weariness.ts:240/246 (gałąź usunięta). TAK.
- Zmiana 4 (słabsza z 1 miastem nie kupuje pokoju; ochrona tylko z miastem): war-weariness.ts:254/289. TAK. SKUTEK DO OCENY WŁAŚCICIELA: chroniony przegrywający z ≤3 miastami (= minMiastPoOddaniu) nie ma czego oddać, więc pokój nie dochodzi; wojna trwa do decyzji silniejszej strony lub eliminacji. Test e2 to potwierdza.
- Zmiana 5 (wymuszony pokój tylko miastem): diplomacy-ai-forced-peace.ts:356-361 już tak. Bez edycji.

## TESTY (surowe wyjścia, cwd gra/)

- `npx tsc --noEmit` → exit 0.
- Bramki z dispatchu:
  - logic-test → `LOGIC OK (213/213)`, exit 0.
  - tech-tree-test → `20 pass, 0 fail`, exit 0.
  - research-test → `PASSED: 33 / FAILED: 0`, exit 0.
  - unit-replace-test → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
  - combat-test → `COMBAT TEST: 6/6 pass`, exit 0.
- Pozostałe wymienione w dispatchu:
  - diplo-peace-weaker-seeks-city-only-test → `32 pass / 0 fail`, exit 0.
  - diplo-peace-stance-wiring-test → `10 pass / 0 fail`, exit 0.
  - diplo-peace-balance-accept-test → `32 pass / 0 fail`, exit 0.
  - diplo-war-peace-main-guard-test → `35 pass / 0 fail`, exit 0.
  - ai-test → `297 passed, 0 failed`, exit 0.
  - diplomacy-test → `149 passed, 0 failed`, exit 0 (bez regresji).
  - ai-losing-war-asks-peace-vs-player-test → `12 PASS / 0 FAIL`, exit 0.
  - ai-war-weariness-peace-test (dispatch: „weariness-test ~96/0”) → `PASS=98 FAIL=0`, exit 0 (po przepisaniu asercji o starej regule).
- Nowy test: gra/tools/diplo-weariness-city-only-test.cjs → `baza: 10/10`, `PASS=16 FAIL=0`, exit 0. Mutanty (każdy czerwieni ≥1 sprawdzenie):
  - M1 ignoruj weakerOf (Power) → czerwone: a2.
  - M2 złoto w puli miast → czerwone: b.
  - M3 bez guardu jednego miasta → czerwone: d.
  - M4 bez wymogu miasta w pokoju → czerwone: c, e2.
  - M5 karencja bez rozróżnienia ochrony → czerwone: e1 (f przechodzi, bo nie zależy od ochrony).
  - M6 remis bez klampu udziału → czerwone: c, g.
- Dwa testy z dispatchu NIE są zielone na BAZIE (zweryfikowane na 5a50a5958 przez git archive do scratchpad):
  - diplo-peace-ai-ai-nonnegative-test: dispatch „20/0”, realnie `19 PASS, 1 FAIL` także na bazie (W1: „ochrona przegrywajacego, bilanse >= 0 -> pokoj”). Ten sam wynik przed i po zmianie — NIE jest regresją tematu.
  - diplo-war-peace-sim-test: 3 FAIL (S3, S4b, M_TUR) na bazie i po zmianie — identyczne nazwy, bez nowych.
- Przepisane asercje w ai-war-weariness-peace-test.cjs (tylko stara reguła): 4a (mutual_peace → offer_rejected bez miasta), 4a-NN, 4b (6 miast), 4g-TEN (mutual_peace → offer_rejected), 4h (cena dodatnia + miasta, bez złota), stopień 1 (1 miasto), 7c (chroniony z 3 miastami → brak pokoju), 7i (karencja na miastach; wyczerpanie na miastach). Żadna asercja nie osłabiona poza tą zmianą reguły.

## BLOKADY
- Brak. Testy na żywo w grze (Chromium) NIE wykonane: NIE_ZMIERZONO (tylko logika i okablowanie).

## RUNDY
- 1/5. Operator HAIKU.

## NASTĘPNY KROK
- Evaluator (SONNET): przegląd diffu 5a50a5958..1c43a9818 (allowlista: war-weariness.ts, main.ts, ai.ts, dwa testy, nowy test); potwierdzić założenia poniżej.

## ZAŁOŻENIA (luki w dispatchu, rozstrzygnięte w kodzie)
1. Stopień 1 oddaje 1 miasto (`stageCityLimit`), bo złoto już nie jest walutą; inaczej stopień 1 nie mógłby nic zaoferować.
2. „Słabsza” = wynik `compareMilitaryStrength` (remis: większa armia, dalej mniejsze id). Strona słabsza przy udziale 0,45–0,5 też składa ofertę (klamp udziału w desperacji), bo zmiana 3 wymaga, by słabsza przy remisie płaciła miastem.
3. „Ochrona z jednym miastem nie powoduje pokoju”: zaimplementowane jako wymóg `ownCities > 1` oraz miasta w planie. Przy minMiastPoOddaniu=3 praktycznie: chroniony z ≤3 miastami nie kupuje pokoju.
4. Wymuszony pokój AI↔AI (`runAiAiPeaceTick`, `requesterShareOf` w main.ts) nadal mierzy „przegrywanie” udziałem Power (`isStillLosing`). Zmiana 1 dotyczy zmęczenia; tej ścieżki nie ruszałem.

## UWAGI-DLA-ORKIESTRATORA
- Ścieżka wymuszonego pokoju AI↔AI (`isStillLosing`/`requesterShareOf` w main.ts, okolice :36617) wciąż liczy „kto przegrywa” po Power, a nie po sile militarnej. Jeśli właściciel chce spójności, to osobny temat (poza zakresem tej rundy).
- Dispatch wskazuje `tools/diplo-weariness-city-only-test.cjs` jako „nowy test z mutacjami”: zrobiony, mutacje wbudowane w sam test (bez osobnego skryptu).
- Dług: diplo-peace-ai-ai-nonnegative-test W1 i diplo-war-peace-sim-test (S3, S4b, M_TUR) są czerwone już na bazie 5a50a5958 — nie należą do tego tematu.
- Pliki tymczasowe testów (`.wcity-*`, `.aiweary-*`) sprzątane przez same testy; nic z nich nie commitowane.

DEPLOY/PUSH: NIE WYKONANO
