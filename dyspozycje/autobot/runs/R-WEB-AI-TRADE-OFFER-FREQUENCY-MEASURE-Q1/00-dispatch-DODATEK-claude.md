# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (ef27be007). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: WYŁĄCZNIE nowy gra/tools/measure-ai-trade-offer-frequency.cjs (+ ewentualny entry .ts/.html w gra/tools) i dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/**. ZAKAZ zmian gra/src/**, JSON balansu, WERSJE.md, rust-port. Wzorzec: ai-trade-wiring-e2e-live-test.cjs (hak testowy, bundle vite poza repo).
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; długie przebiegi z limitem 590 s i raportem częściowym. Nie integrujesz, nie pushujesz.

## DODATEK (runda 2/5, 2026-11-12) — ROZSTRZYGNIĘCIE ORKIESTRATORA po BLOCK r1
BAZA: kandydat e71cc287d (web-wip/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1) + merge origin/main (b4853c8e6). MODEL: Operator HAIKU, Obrona HAIKU.
DECYZJA: allowlista ROZSZERZONA o gra/src/main.ts i gra/src/civ-test-hooks.ts (lub istniejący plik hooków) — TYLKO nowe hooki testowe aktywne wyłącznie z ?civTest=1 (nieosiągalne w zwykłej grze; wzorzec: setUlepszeniaPolicy w installCivTestHooks): ustawienie ziarna, ustawienie relacji pary (zaufanie/respekt), tryb przyspieszony (pętla tur bez renderu), odczyt listy ofert AI→gracz (cyklicznych i jednorazowych) z polem „Przyjmij aktywne”. ZERO zmian reguł handlu i bramek. 
POMIAR: ≥3 ziarna × ≥150 tur × ≥3 poziomy relacji; przebiegi dziel na części mieszczące się w limicie 590 s (raport częściowy + wznowienie), wynik zbiorczy w tabeli: ziarno, relacja → oferty/100 tur (cykliczne, jednorazowe), aktywne Przyjmij, pary surowców.
KRYTERIA: hooki tylko za ?civTest=1 (test: bez flagi hook nieobecny); mutacja; tsc + 5 bramek; surowe wyniki w evidence/.

## DODATEK (runda 3/5, 2026-11-12) — FC FAIL r2 → NAPRAW; MODEL: SONNET (uzasadnienie niżej)
UZASADNIENIE SONNET (CLAUDE.md zasada modeli): dwie nieudane rundy Haiku tego samego tematu (r1 BLOCK, r2 FAIL); temat wymaga zmian wieloplikowych w pętli tury (tryb przyspieszony, obsługa okna preBattleOpen, wznawialny runner).
BAZA: kandydat 486c4ef2d (web-wip/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1-r2) + merge origin/main (b4853c8e6).
NAPRAW 1: tryb przyspieszony dla ?civTest=1 (pętla endTurn bez renderu/animacji; hak np. __civTest.runTurns(n) z pominięciem rysowania) — czas tury ≤ ~1 s; zero wpływu na zwykłą grę (test: bez flagi hak nieobecny).
NAPRAW 2: obsługa okna preBattleOpen (bitwa przerywała pomiar w turze 24): w trybie testowym automatycznie rozstrzygaj/zamykaj okno (np. SKIP/AUTO) zgodnie z regułami gry; zapisz w raporcie jak.
NAPRAW 3: runner wznawialny — pomiar w partiach ≤590 s na wywołanie (stan: ziarno, relacja, tura, wyniki cząstkowe do pliku JSON), pętla w tle; wynik zbiorczy: ≥3 ziarna × ≥150 tur × ≥3 relacje (niska/średnia/wysoka) → tabela oferty/100 tur (cykliczne, jednorazowe), aktywne „Przyjmij”, pary surowców.
NAPRAW 4: testy: bez flagi hak nieobecny; mutacje dla civTestSeedOverride, setRelationTotal, entries; powtarzalność (to samo ziarno = ten sam wynik) udowodniona dwoma przebiegami.
NAPRAW 5: surowe wyniki w evidence/ (nie tylko smoke); etykiety w JSON poprawne.
ALLOWLISTA: j.w. (main.ts, civ-test-hooks.ts, gra/tools/measure-ai-trade-offer-frequency.cjs i testy) — hooki WYŁĄCZNIE za ?civTest=1; zakaz zmian reguł gry i balansu.
KRYTERIA: tsc + 5 bramek; pełna tabela pomiaru; wniosek o częstości BEZ progu narzuconego (liczby do decyzji właściciela).
