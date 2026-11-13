STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1
GOAL: Spacja -> nastepna aktywna jednostka; oblegajace/oblegane tez w kolejce.
ZMIANY/COMMIT: weryfikowany 985d0407d (rodzic b9a878167, baza origin/main 16195968b). Allowlista czysta: gra/src/game/next-active-unit.ts, gra/src/main.ts, gra/tools/roster-space-next-active-unit-test.cjs, runs/<ID>/**. Zero zmian: WERSJE.md, gra-robocza, rust-port, src-tauri, ui.
TESTY (odtworzone samodzielnie na 985d0407d): tsc --noEmit EXIT=0; roster-space-next-active-unit-test 43 OK/0 FAIL EXIT=0 (D7-D11 Chromium z oblezeniem); scout-explore-deselect-cycle 34/0; side-panel-unit-cycle-arrows 20/0.
ZARZUTY:
1. Brak Chromium dla oblezenia -> ODDAL (naprawione w obronie: haki civTest-only + D8-D11 zielone).
2. Efekt uboczny w bebnie/Zwiedzaj -> ODDAL (naprawione: spaceActiveUnitQueue tylko dla Spacji, siege:true jedyne wywolanie, test strukturalny pilnuje).
3. Regresje niepelne -> ODDAL: end-turn-* i hotseat-etap6a nie dotykaja Spacji/kolejki (przed/po identyczne wg Operatora); wzorce select/next-unit/keyboard/hotkey/space pokryte (scout-cycle, side-arrows, frozen 76/0 wg obrony).
4. nextActiveUnit niepodpiety / semantyka spoza kolejki -> ODDAL (eksport wymagany dispatchem, semantyka resolveAdjacentPlayerUnitCycle bez zmian; zalozenie opisane).
Brak NAPRAW, brak DO DECYZJI CZLOWIEKA -> PASS.
BLOKADY: brak. node_modules usuniety.
RUNDY: FC 1/5
NASTEPNY KROK: integracja orkiestratora: cherry-pick b9a878167 + 985d0407d na aktualny origin/main (baza 16195968b; mozliwe konflikty w main.ts), bramki, potem READY_FOR_DEPLOY. Wzgledem origin/rust-port/parity-v2: temat webowy (gra/) niezalezny; integrowac do main PRZED ewentualnym REPIN (parity-v2 b520768b0 nie zawiera tej zmiany; REPIN osobnym tematem po wdrozeniu do ROBOCZEJ).
DEPLOY/PUSH: NIE WYKONANO
