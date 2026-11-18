STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-WIRING-FLAGGED-Q1
GOAL: Sojusze AI↔AI (cel min. 1, limit 2 na cywilizację) za flagą torSojuszyAktywny=false; zachowanie gry bez zmian.
ZMIANY/COMMIT: baza e29f8c8b3 -> kandydat 8bbb02e12 -> obrona (commit podany w polu sha odpowiedzi). Zmieniony plik: gra/tools/ai-ai-alliance-tick-test.cjs (+S13, +S14, +mutanty M7, M8; komentarz nagłówka). Kod gry (ai-ai-alliance-tick.ts, main.ts, params) NIE zmieniony.
ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (brak runnera i analizatora ai-ai-alliance-measure-*.cjs): PRZYJMUJĘ. NIE ZREALIZOWANO w tej rundzie. Powód: runner musi uruchomić przeglądarkę (Playwright nie jest zainstalowany; w gra/node_modules brak; /usr/bin/google-chrome jest, ai-economy-measure-run.cjs domyślnie szuka /usr/bin/chromium) oraz włączyć flagę przez __truceTestDebug.aiAiAllianceTickForTest.setEnabled(true) i odczytać liczbę sojuszy AI↔AI (brak hooka odczytu liczby sojuszy w main.ts; istnieje tylko setEnabled i runTick). Wymaga to nowego haka odczytu (kod gry, poza allowlistą tej paczki testowej) — do decyzji orkiestratora.
- Zarzut 2 (brak biegu dymnego 30 tur, seed 4242, flaga true): PRZYJMUJĘ. NIE_ZMIERZONO. Brak bundla vite i Playwright w tej piaskownicy; nie uruchomiono.
- Zarzut 3 (mutacja limitu proponenta `ileP > maxSojuszy` przeżyła): PRZYJMUJĘ i NAPRAWIONO. Dowód: nowy test S13 (proponent z 2 sojuszami nie proponuje) oraz mutant M7. Wynik: MUT-DETECTED M7_proposer_limit_off_by_one (S13).
- Zarzut 4 (usunięcie `if (info.hasAlliance) continue;` przeżyło): PRZYJMUJĘ i NAPRAWIONO. Dowód: test S14 (prefilter=true, hasAlliance=true, evaluate akceptuje -> zero sojuszy) oraz mutant M8. Wynik: MUT-DETECTED M8_has_alliance_gate_removed (S14).
- Zarzut 5 (nota: zawarcie przez addTreaty/syncRelationFromDeals, nie applyProposalOutcomeImpl): PRZYJMUJĘ jako odnotowaną odchyłkę. Bez zmiany kodu: applyProposalOutcomeImpl wymaga wyniku z UI gracza (applyAcceptedProposal), więc nie da się jej użyć dla pary AI↔AI bez przebudowy. Do decyzji orkiestratora, czy to zostaje (zgodne z precedensem sojuszu siostrzanego).
- Zarzut 6 (nota: brak listy „Układy w świecie”, pkt 5 niezrealizowany): ODRZUCAM jako blokadę, potwierdzam stan. Dowód: grep -rn "Układy w świecie" gra/src zwraca 0 trafień. Zgodnie z dispatchem nie tworzono nowego UI; pkt 5 pozostaje otwarty jako uwaga.
TESTY:
- npm ci --ignore-scripts w gra/ (71 pakietów, tylko do uruchomienia testów; bez npm run build/dev).
- node tools/ai-ai-alliance-tick-test.cjs: SUMMARY suite 19/19 OK; mutanty 8/8 wykryte (M1..M8). Surowe wyjście: wszystkie S1–S14 OK; MUT-DETECTED dla M1–M8.
- npx tsc --noEmit: EXIT 0, 0 linii wyjścia.
- node tools/ai-ai-treaty-evaluate-test.cjs: rc=0.
- node tools/ai-ai-treaty-nap-wiring-test.cjs: rc=0.
- Bieg dymny 30 tur seed 4242 z flagą true: NIE_ZMIERZONO.
- Runner i analizator sojuszy: NIE dostarczone (patrz zarzut 1).
- Długie biegi 150 tur × 3 ziarna: NIE_ZMIERZONO (zgodnie z dispatchem, orkiestrator).
BLOKADY: brak runnera/analizatora pomiaru i biegu dymnego (zarzuty 1 i 2) — wymagają instalacji Playwright i nowego haka odczytu liczby sojuszy AI↔AI; ten krok nie jest zakończony.
RUNDY: 2/5
NASTĘPNY KROK: Orkiestrator decyduje: (a) osobny temat na runner+analizator z hakiem odczytu sojuszy i instalacją Playwright w piaskownicy, albo (b) zaakceptować tor bez pomiaru (flaga pozostaje false). Bez tego nie włączać torSojuszyAktywny.
UWAGI-DLA-ORKIESTRATORA:
1. Zarzut 5 (addTreaty zamiast applyProposalOutcomeImpl) pozostaje odchyłką do akceptacji.
2. W katalogu /home/user/The-Game/.claude/worktrees/ pozostał pusty plik wyjściowy /home/user/The-Game/.claude/worktrees/wf_5cc7b000-7e5-3-tsc.txt (0 linii) z sesji obrony; poza worktree, niezacommitowany, nieistotny.
DEPLOY/PUSH: NIE WYKONANO
