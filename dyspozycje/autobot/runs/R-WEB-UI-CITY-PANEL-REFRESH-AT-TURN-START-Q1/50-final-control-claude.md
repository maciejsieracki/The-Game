STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1
GOAL: odswiezenie otwartego panelu miasta i panelu rekrutacji imperium po koncu tury gracza (zachowanie przewijania), test zywy z mutacja.
ZMIANY/COMMIT: kandydat 11c2856223ad840da90ced54e27f82d3ad71d895 (potomek bazy 0c12240a3 - merge-base --is-ancestor OK). Diff vs baza: gra/src/main.ts (+65, helper refreshOpenPanelsAtTurnStart + 1 wywolanie po validateRecruitGeneral w triggerPlayerEndTurn), gra/tools/city-panel-refresh-at-turn-start-live-test.cjs (nowy), raporty 10/30. Allowlista zachowana (brak gra-robocza/kanon/WERSJE/rust-port). Kod = 4d93fba1e. Ten raport = commit nad kandydatem.
TESTY (wlasne, na buildzie kandydata, ZMIERZONO): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; army-panel-recruit-remove 21/0; army-auto-recruit-general-ui 11/0; administrators-wizard 58/0. Chromium (Vite build poza repo): city-panel-refresh-at-turn-start-live-test VERDICT PASS (B==C, era 2->2, panel otwarty po EOT, A!=C); open-panel-refresh-after-tech-live-test VERDICT PASS. MUTACJA (usuniecie wywolania refreshOpenPanelsAtTurnStart po EOT, osobny build): VERDICT FAIL "B != swiezy render C". Bramki czerwone baza-vs-kandydat: brak czerwonych.
ZARZUTY: 1 (scrollTop bez asercji, zaznaczenia/fokus) - ODDAL: kod zachowuje scrollTop, cityPanel nie ma pol input, input panelu rekrutacji chroniony guardem fokusu; luka asercji scrollTop = NIE ZMIERZONO (nota). 2 (panel rekrutacji bez pomiaru zywego po EOT) - ODDAL: ten sam helper, testy paneli zielone; migotanie NIE ZMIERZONO (nota). 3 (hak setPlayerTreasury opcjonalny) - ODDAL: test daje BLOCKED zamiast falszywego PASS. 4 (DODATEK = kopia dispatchu) - ODDAL: uwaga proceduralna, ocena wg dispatchu. Zadnego NAPRAW.
BLOKADY: brak
RUNDY: FC 1/5
UWAGI-DLA-ORKIESTRATORA: opcjonalny niski temat: asercja scrollTop + pomiar zywy panelu rekrutacji po EOT. Do sprzatniecia: /tmp/fc1, gra/node_modules w worktree FC; testy panelowe nadpisuja PNG w runs/R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1 (cofniete, niezacommitowane).
NASTEPNY KROK: integracja orkiestratora (kod 4d93fba1e jest w kandydacie) + bramki, deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
