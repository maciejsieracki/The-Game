# 50-final-control-claude — R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1 (Final Control, runda 3 obrony)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + dokumentacja + testy + narzędzie pomiarowe)
TEMAT: R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1
GOAL: ceramika zużywana przez obywateli już w Kamieniu (1 na obywatela na turę); bez ceramiki kara −2 Szczęścia / −1% Rozwoju za brakujący surowiec (wariant A, bez zmian kary i bez ceramiki startowej).
ZMIANY/COMMIT: kandydat df5333720cdd28b477c611408f376c5c39960211 (potomek e0be467a8 — `git merge-base --is-ancestor` = TAK). Zakres kodu/danych vs punkt wyjścia tematu (d4c3c39d3): citizen-resource-upkeep.json (+ceramika w epoce 1, _opis), citizen-resource-upkeep.ts (tylko komentarz), wikiBundle.json (regen), poradnik 06 + szczescie.md, testy/narzędzia citizen*/szczescie*, citizen-ceramics-panel-shot.cjs, runs/<ID>/**. Wszystko w allowliście; brak WERSJE.md/manifestu/rust-port. `git diff --check` czysty.
INTEGRACJA: integration_sha = df5333720. Kandydat NIE jest potomkiem origin/main (e956b5015); próba `git merge --no-commit --no-ff origin/main` → JEDYNY konflikt: gra/src/data/wikiBundle.json (plik generowany). Orkiestrator: merge + `node tools/bundle-wiki-for-game.cjs`. Dowód spójności: uruchomienie generatora na kandydacie nie zmienia wikiBundle.json (0 różnic).

TESTY (surowe wyniki, własny przebieg):
- tsc --noEmit (gra/): exit 0, 0 linii.
- citizen-resource-upkeep-test: 122 passed, 2 failed (kotwica `const ordPctRaw = evaluateOrderFromBreakdown(` i F1 mutant 1). TE SAME 2 czerwone na punkcie wyjścia d4c3c39d3 (107 passed, 2 failed) — dług bazowy, nie regresja.
- szczescie-przebudowa-skali-test: 516 OK / 4 FAIL (liczność katalogu budynków 44 vs 41 itd.); na d4c3c39d3 515 OK / 4 FAIL — te same 4, niezwiązane z tematem.
- citizen-consumption-era-mult-test: PASS; citizen-upkeep-era-mult-test: 681/0.
- 6 bramek referencyjnych (§6): logic 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6, unit-power 6/0 — wszystkie exit 0.
- Mutacja kryterium (a): usunięcie "ceramika" z epoki 1 w JSON → test czerwienieje (m.in. „Epoka 1 … want [ceramika,drewno,glina]”, `deductions.ceramika` undefined, happinessDelta 4≠6); JSON przywrócony, worktree czysty.
- Sekcja L: drenaż pop 20 = 20 ceramiki, missing/−2/−1, z ceramiką +2, parytet AI (sygnatury bez ownerId) — zielone w ramach 122.
- Dowód Chromium (kryterium e): ocena dwóch PNG + JSON — panel „Magazyn państwa” pokazuje wiersz Ceramika z „Obywatele: POKRYTE” (5000) i „Obywatele: NIEDOBÓR” (0), podsumowanie „obywatele: pokryte / niedobór”; epoka 1, errors: []; JSON bez ścieżek /home/user (0 trafień).

ZARZUTY:
1. Zrzuty przy sztucznym magazynie 5000 i z oknem dyplomacji w tle — ODDAL. Kryterium (e) wymagało panelu pokrycia z ceramiką w liście Kamienia i stanu z brakiem — oba widoczne. Kara −2/−1% w UI: pokryta testami logiki; zrzut czystego HUD z realnym magazynem NIE_ZMIERZONO (nieblokujące).
2. Ścieżki worktree w JSON — ODDAL (naprawione w df5333720, zweryfikowane: 0 trafień).
3. Brak potomstwa origin/main — ODDAL do integracji (zmierzone: 1 konflikt, wikiBundle, regeneracja generatorem).
4. Dług bazowy 2 czerwone asercji — ODDAL (czerwone identycznie na d4c3c39d3; kod gra/src kandydata = baza).
Brak NAPRAW ⇒ nie FAIL.

DO DECYZJI CZŁOWIEKA (DECISION_REQUIRED, nieblokujące wdrożenia): pomiar (d) z r2 — gracz pasywny bez Garncarni nie ma ceramiki 60/60 tur (kara trwa bez końca), AI pierwsza ceramika t.13–15, połowa AI t.23–47. Wariant A wdrożony zgodnie z literalnym poleceniem; B (ceramika startowa) / C (łagodniejsza kara w Kamieniu) czekają na odpowiedź właściciela.

BLOKADY: brak technicznych.
UWAGI-DLA-ORKIESTRATORA:
- empireDetailPanel.ts ~l.3413–3414: tooltip „+1 Szczęście każde miasto / kara −1 Szczęście” rozjeżdża się z kodem (±2, G8 z 2026-09-05) — dług sprzed tematu, osobny drobny temat tekstowy.
- Dług testowy: kotwica ordPctRaw w citizen-resource-upkeep-test.cjs (main.ts używa `const ordPctRaw = happinessCivKey`) — osobny temat.
- Dług Rust: REPIN tabeli obywateli (Kamień + ceramika).
- Do integracji: merge origin/main + regeneracja wikiBundle; `gra/node_modules` w tym worktree to symlink (nie śledzony) — usunąć przy sprzątaniu.
RUNDY: FC po rundzie 3 obrony (łącznie 3/5).
NASTĘPNY KROK: integracja orkiestratora (merge origin/main, regen wikiBundle, bramki) → READY_FOR_DEPLOY → decyzja właściciela ABC (A/B/C).
DEPLOY/PUSH: NIE WYKONANO
