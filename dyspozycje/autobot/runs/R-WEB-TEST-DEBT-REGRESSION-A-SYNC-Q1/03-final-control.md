STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), dlug testowy
TEMAT: R-WEB-TEST-DEBT-REGRESSION-A-SYNC-Q1
GOAL: Synchronizacja 8 testow klasy A (FULLREG) z celowymi zmianami FALA 509-531, bez zmian w gra/src i gra/data.

ZMIANY/COMMIT:
- Kod do integracji: `85a0a6b66` (Obrona r1) na `73052fbdb` (Operator r1), baza `16c0509f6` (= origin/main w chwili kontroli).
- Zakres 16c0509f6..85a0a6b66: 7 plikow `gra/tools/*-test.cjs` + `01-operator-r1.md`. `ai-army-scattered-merge-test.cjs` WRACA do stanu bazowego (zero diffu). Zero gra/src, gra/data, WERSJE.md, rust-port, gra-robocza. Allowlista OK.
- `git diff --check` czysty.
- Commit FC: tylko ten plik (patrz ostatnia linia SHA w raporcie orkiestratora).

ZARZUTY (werdykty):
1. ai-army-scattered-merge (flaky, TRIALS 5->11 pozorna stabilizacja): ODDAL. Obrona cofnela TRIALS do 5 (brak diffu wzgledem bazy), test zostaje czerwony na obciazonym hoscie, koszt zbierania chmury ~51 ms vs prog 3x+10 ms jest mozliwym realnym kosztem AI (FALA 520) = osobny temat perf w `gra/src/game/ai.ts`. Dispatch wprost nakazuje w takim przypadku nie naprawiac w tym temacie i zostawic test czerwony. DO DECYZJI: patrz BLOKADY.
2. sidepanel-hud-deadzone (przyczyna niezmierzona): ODDAL z jawna adnotacja NIE_ZMIERZONO. Brak czerwonego przed/zielonego po; zmiana (czekanie na zniknięcie `.civ-map-load-overlay`, do 240 s; selektor istnieje, mapLoadingOverlay.ts:197) nie osłabia żadnej asercji, tylko warunek czekania. Nie jest dowodem naprawy flaky; nie wolno jej raportowac jako potwierdzonej.
3. siege-blockade C4 (regex zbyt luzny): NAPRAWIONE w obronie (opcjonalna grupa usunieta, regex przypiety do `|| recStackFree <= 0`). Zweryfikowane przeze mnie: regex C4 i C5 dopasowuja `gra/src/main.ts` (true/true). Zarzut zamkniety, nie wymaga rundy 2.

TESTY (samodzielnie, na 85a0a6b66, bez node_modules, dysk 2,6 GB):
- spichlerz-deficyt-scalenie: 58 pass / 0 fail.
- diplo-aggressor-wiring: 15 PASS / 0 FAIL.
- C4/C5 siege: statycznie true/true na main.ts.
- Nie uruchomiono (wymagaja esbuild/Chromium/npm ci; margines dysku): hud-armia, hud-obywatele, prereq, siege (pelny), deadzone, logic-test, ai-test, tsc. Opieram sie na: Evaluator odtworzyl zielono hud-armia 60/60, hud-obywatele 20/20, prereq 60/0, siege 57/0, deadzone 43/0; Operator: logic-test 213/213, ai-test 274/20 bez pogorszenia, tsc czysty. Poprawki obrony od tego czasu dotknely tylko regexa C4 (zweryfikowany) i cofnely scattered do bazy.

BLOKADY:
- ai-army-scattered-merge-test pozostaje flaky/czerwony na obciazonym hoscie. Wymaga osobnego tematu (proponowane ID: R-WEB-AI-CLOUD-GATHER-PERF-Q1, ai.ts) lub decyzji wlasciciela o wartosci progu. NIE blokuje integracji tego tematu.
- deadzone: NIE_ZMIERZONO.

RUNDY: Operator 1, Obrona 1, FC 1 (laczny licznik 3/5).
NASTEPNY KROK: integracja orkiestratora 85a0a6b66 (+ ten commit FC) do main (baza 16c0509f6 = aktualny origin/main, fast-forward/cherry-pick bez konfliktow; zmiany tylko w gra/tools i runs/). Kolejnosc wzgledem origin/rust-port/parity-v2 (783c6b766): niezalezne, zero wspolnych plikow; najpierw main, parity-v2 bez dzialan (REPIN po koncu kolejki webowej). Bez deployu bez osobnej autoryzacji. Nastepnie osobny temat perf dla scattered.
DEPLOY/PUSH: NIE WYKONANO
