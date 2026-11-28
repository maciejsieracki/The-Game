STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16B
GOAL: Przywrócić 5 czerwonych testów po zmianie sygnatury canPlayerInitiateEndTurn (ENDQUIET) bez zmian logiki gry i bez osłabiania wzorców; skan pozostałych testów PRZED/PO.
ZMIANY/COMMIT: Kod gry bez zmian (git diff b075137 -- gra/src gra/data = pusty). Zmiany testów pochodzą z commitu WIP a87d15ddd i zostały zweryfikowane niezależnie (5/5 zielone, mutacje czerwone). Ta runda dodaje tylko dokumenty: dyspozycje/analizy/DLUG-TESTOWY-Q16B-2026-11-28.md oraz ten raport. Commit: patrz pole sha w odpowiedzi.
TESTY:
- Po (a87d15ddd): diplo-forced-peace-pending 40/0; diplomacy-sensible-deals-main-guard 22/0; koniec-tury-f1-f4-runda3 39/0; koniec-tury-g1-g2-runda4 41/0; load-game-blockers-exec 15/0.
- Przed (b075137): 39/1; 20/2; 37/2; 39/2; RC 1 (TypeError: canPlayerInitiateEndTurn is not a function).
- Mutacje (kopia main.ts, potem przywrócenie, git diff gra/src pusty): usunięcie pendingForcedPeace w bramce -> FAIL g; usunięcie hasPendingAutoPreBattle -> FAIL F3-A2; zmiana nazwy funkcji -> FAIL F3-A1; usunięcie healStale jako pierwszej instrukcji -> FAIL A-order; diplomacy: 7 wbudowanych mutacji czerwonych; load-game: wbudowane M1, M2 czerwone.
- Skan (gra/tools, testy nie-live): endturn-battle-deadlock-exec 49/0 -> 49/0; endturn-battle-deadlock 38/0 -> 38/0; endturn-quiet 10/0 -> 10/0; no-negative-stocks-end-turn-gate-levers 34/0 -> 34/0; no-negative-stocks-endturn 19/0 -> 19/0; ai-wojny-zwykle-cap-dwa-miasta 2/2 -> 2/2 (nie-nagłówkowe, NIE ZBADANO); hotseat-drugi-fotel-tura RC2 -> RC2 (Chromium, NIE ZBADANO).
- Pominięte: 5 testów live (Chromium/bundle) — nie uruchamiane.
- tsc / logic / ai-test: NIE ZMIERZONO w tej rundzie (kod gry bez zmian).
BLOKADY: brak blokady tematu. Otwarte luki do odnotowania: (1) load-game: zaślepki nnsGateForPlayer / prunePendingForcedPeace / pendingForcedPeaceTreaties nie sprawdzone osobno pod kątem konieczności; (2) ai-wojny-zwykle-cap i hotseat-drugi-fotel-tura są czerwone przed i po, poza zakresem tego tematu.
RUNDY: 1/5
UWAGI-DLA-ORKIESTRATORA:
- Zaślepka nnsGateForPlayer zwraca { blokada: false } w harnessie load-game. Maskuje blokadę NNS w scenariuszach tego testu. Test nie sprawdza tej gałęzi, więc nie osłabia asercji o nagłówku. Warto odnotować.
- Baza dispatchu była podana dwuznacznie (args.cand = b075137, a w DODATKU baza = a87d15ddd WIP). Pracowałem na a87d15ddd, zweryfikowałem go względem b075137 i wyniki PRE podałem z b075137.
- Dwa testy (ai-wojny, hotseat) uruchomiły vite build do unikalnego katalogu w /tmp (wymóg samego testu); katalog hotseat usunięto.
NASTĘPNY KROK: Integracja orkiestratora po Final Control. Osobne tematy (poza tym zakresem): ai-wojny-zwykle-cap-dwa-miasta (FAIL fast-forward, przyczyna nieznana) oraz hotseat-drugi-fotel-tura (środowisko Chromium).
DEPLOY/PUSH: NIE WYKONANO
