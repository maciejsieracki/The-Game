STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GENERALS-OVER-LIMIT-Q1
GOAL: liczba zywych jednostek z `isGeneral` nigdy nie przekracza `generalLimitForEra` epoki wlasciciela; nadmiar ze starych zapisow traci tylko flage.
ZMIANY/COMMIT: weryfikowany kod = f347c1888f1e799b77532374c092de8a54df5426 (Operator, baza 9b019a7d8) + 0dfb78066532b1db3978951e32b1604ba97193f8 (Obrona, tylko 02-obrona-r1.md). Diff do bazy: generals.ts, main.ts, generals-limit-invariant-test.cjs, 01/02 md -- calosc w allowliscie; `git diff --check` czysty. Ten plik: commit FC (patrz raport).
TESTY (wlasne, na 0dfb78066, npm ci --ignore-scripts): generals-limit-invariant ALL PASS EXIT=0; tsc --noEmit EXIT=0; logic-test 213/213; ai-test 274 passed / 20 failed (= baza); general-eligible-unit-roster, army-leadership, ai-general-war-campaign, recruitment-batch-contract, recruit-rally-default-save EXIT=0. Mutacja (generals.ts+main.ts z bazy): test pada (FAIL), po przywroceniu czysto.
ROZSTRZYGNIECIE ZARZUTOW:
1. Test modelowy, brak live w Chromium -- ODDAL (ograniczenie srodowiska: brak chromium; strażnik zrodla main.ts + prawdziwe funkcje; poprawka minimalna, 2 miejsca narodzin + migracja). NIE_ZMIERZONO live.
2. Rozjazd liczb mutacji -- ODDAL (rozne mutacje: A 4, B 6, C 10 asercji; nie blokuje).
3. Wodz z kolejki przejety z miastem -> zwykla jednostka -- ODDAL (swiadome, udokumentowane, bezpieczne dla niezmiennika; do notatek wydania).
Zero NAPRAW.
BLOKADY: brak chromium (testy empire-recruit-*, army-panel-*, *-live) NIE_ZMIERZONO.
RUNDY: 1/5
KOLEJNOSC INTEGRACJI: wzgledem origin/rust-port/parity-v2 (8bc2efcf8) -- zmiany dotycza gra/src (web), parity-v2 ma wlasne gra/src/main.ts; `git merge-tree` 8bc2efcf8 vs SHA koncowy daje czyste scalenie (bez konfliktow). Zalecenie: najpierw cherry-pick/merge do main (po HUD-TOPBAR-LAYOUT-A i przed tematem cudow -- ten sam main.ts), potem ewentualnie parity-v2.
NASTEPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
