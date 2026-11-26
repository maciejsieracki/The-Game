STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, etykieta licznika)
TEMAT: R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1 (HOTSEATHUD, #152)
GOAL: w oknie dyplomacji między fotelami (hotseat) gracz widzi „Dostępne za N tur” przy akcji Pokój, spójnie z bramką czasu pokoju (ta sama para, to samo turnsAtWar co humanPeaceRejectReason / peaceProposalIsTooEarly).
ZMIANY/COMMIT: BAZA 7148b2f4e (origin/main). Allowlista: gra/src/game/diplomacy-peace-proposal-timing.ts (nowy czysty helper peaceCounterLabel), gra/src/ui/interHumanDiplomacyHud.ts (pole peaceTurnsAtWar, etykieta, blokada Akceptuj/Wyślij dla pokoju), gra/src/main.ts (3 linie w openInterHumanDiplomacyHud: peaceTurnsAtWar z diploWarStateFor/getDiploRelation tej samej pary), nowy gra/tools/hotseat-peace-counter-ui-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1/10-operator-claude.md. Commit: patrz SHA w polu sha (git diff --check czysty).
TESTY:
- tsc --noEmit (gra/): exit 0 (zainstalowano zależności lokalnie w worktree przez npm install --ignore-scripts; nie uruchamiano build/dev).
- hotseat-peace-counter-ui-test.cjs (nowy): PASS=23 FAIL=0. Rdzeń peaceCounterLabel wykonany naprawdę (transpilacja TS): N=10 (0 tur), 8, 5, 4 („tury”), 1 („turę”), N=0 (10 tur) i brak wojny (undefined, null) -> zgodne z oczekiwaniem. Mutacja 1 (licznik zawsze pusty): 5 niezgodności, wykryta. Mutacja 2 (N+1): 5 niezgodności, wykryta. Plus 9 asercji spięcia HUD<->rdzeń i main.ts.
- hotseat-peace-protection-test.cjs: PASS=4 FAIL=0.
- diplo-human-peace-no-war-test.cjs: PASS=13 FAIL=0.
- hotseat-etap6d-podetap-b-exec-test.cjs: 48 PASS, 0 FAIL.
- hotseat-etap6d-podetap-d-exec-test.cjs: 46 PASS, 0 FAIL.
- hotseat-etap6d-podetap-e-exec-test.cjs: 24 PASS, 0 FAIL.
- NIE WYKONANO w tej rundzie: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0 (nie zmieniają żadnego kodu poza UI/etykietą; uruchomienie pełnych bramek poza zakresem tej rundy, do wykonania przez FC).
- NIE ZMIERZONO: zrzut z żywego Chromium licznika w oknie hotseat (brak uruchomionego harnessu w tej rundzie). Brak renderu DOM w teście (brak jsdom); weryfikacja renderu tylko źródłowa.
BLOKADY: brak blokad technicznych. Uwaga: blokada przycisku dotyczy tylko rodzaju „Pokój” (zgodnie z zakresem bramki humanPeaceRejectReason, która dotyczy wyłącznie zaproponuj_pokoj); rozejm w hotseat nie jest bramkowany przez humanPeaceRejectReason i nie został zmieniony.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja diffu (allowlista, mutacje) i bramki z listy NIE WYKONANO; Final Control z żywą weryfikacją Chromium (licznik w oknie hotseat) jeśli dostępny harness.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Zależności gra/node_modules zainstalowano w worktree (gitignored); nie są częścią commita.
- Źródło prawdy licznika: peaceCounterLabel używa peaceProposalBlocked/peaceProposalTurnsLeft/turyWojnyLabel z tego samego modułu co bramka. Wartość turnsAtWar przekazywana z main.ts liczona identycznie jak w peaceProposalIsTooEarly (ta sama para meId→otherOwnerId).
- Nie tworzono żadnych sesji, zadań, triggerów ani run_in_background.
