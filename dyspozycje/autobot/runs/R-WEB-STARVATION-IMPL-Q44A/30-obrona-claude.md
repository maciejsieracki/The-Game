STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-STARVATION-IMPL-Q44A
GOAL: Zdjąć blokadę końca tury gracza z powodu żywności (Q42=C), zostawić głód wojska bez zmian (Q44=A), dodać ostrzeżenie o głodzie. Obrona: odpowiedź na zarzuty 1–6 Evaluatora (90da4bb70611503dfe1e3e0754d60698980c7993).
ZMIANY/COMMIT: baza 22b62f79a; kandydat 9eaf5e958; czubek obrony: patrz pole sha w odpowiedzi. Zmienione w tej rundzie: gra/tools/starvation-no-food-gate-test.cjs (rozszerzony), dyspozycje/analizy/GLOD-WDROZENIE-Q44A-2026-11-28.md (nowy), dyspozycje/autobot/runs/R-WEB-STARVATION-IMPL-Q44A/30-obrona-claude.md (nowy). Kod gry (main.ts, no-negative-stocks.ts) bez zmian w tej rundzie.

ODPOWIEDZI NA ZARZUTY
1. (brak dokumentu GLOD-WDROZENIE) — PRZYJMUJĘ. Dokument napisany: dyspozycje/analizy/GLOD-WDROZENIE-Q44A-2026-11-28.md (stan wiążący, tabela test|przed|po|powód, lista NIE ZMIERZONO).
2. (mutant M2 przeżył; brak wiringu main.ts) — PRZYJMUJĘ. Test źródłowy: nnsGateForPlayer musi zawierać `ignorujZywnosc: true` i wywołanie decideEndTurnGate z levers; `ignorujZywnosc: true` tylko raz w main.ts; ścieżka AI bez opcji. Mutacja M2 (true→false) daje teraz 2 FAIL (wynik surowy: `starvation-no-food-gate-test: 29 passed, 2 failed`).
3. (brak testu tury z ujemną żywnością, zdrowie po 3 turach, brak utraty ludności) — PRZYJMUJĘ CZĘŚCIOWO. Dodano scenariusz Trudny (hpFrac 0,10, karencja 3, 2 jednostki, zapas 0, tury 1–6): tury 1–2 bez utraty HP, tura 3 = 90, tura 4 = 80, tura 6 = 60; zapas clampowany do 0; tura nie jest blokowana. Część „miasto nie traci ludności” NIE pokryta testem: pomiar pokazał, że miasto z własnym deficytem przy zapasie 0 traci ludność (patrz zarzut 6). Asercji o ludności nie dodano, bo wynik jest sprzeczny z oczekiwanym kontraktem i wymaga decyzji właściciela.
4. (komunikat o głodzie bez testu) — PRZYJMUJĘ. Dodano source-scan: komunikat obecny w main.ts, warunek `spPo < 0` w pobliżu. Mutacja M3 (`if (false)`) → 1 FAIL. Nie zweryfikowano w żywym przebiegu (patrz zarzut 5).
5. (test live nie wykonany, bez udokumentowanej próby) — PRZYJMUJĘ z dokumentacją próby. Próba: sprawdzono istniejące narzędzia (end-turn-gate-live-test.cjs, live-nns-gate-smoke-test): oba wymagają bundla --dist i testują inne scenariusze (a–e), nie t16–t20 z 2 jednostkami. Zainstalowano zależności gra/ (npm ci --ignore-scripts, 71 pakietów; nie w repo). Nowego harnessu live nie napisano w tej rundzie. Wynik: NIE ZMIERZONO.
6. (ryzyko miast nienakarmionych przy Q44=A) — ODRZUCAM NIE, PRZYJMUJĘ jako problem otwarty z DOWODEM. Dowód (node, advanceEmpireFood + applyHungerPenaltyV85, zapas 0, miasto c1 bilans -2): tury 1–3 fedByCityId(c1)=false; applyHungerPenaltyV85(pop 5) → nowaLudnosc 4, ubytek true. Zatem miasto traci 1 ludności za turę. Przyczyną jest deficyt miasta, nie wojsko, ale skutek dla gracza jest zgodny z zarzutem. Nie naprawiam: zmiana wymaga hooka ludności (poza allowlistą) i decyzji właściciela (ABC). Oznaczone w dokumencie jako otwarte pytanie.

TESTY (surowe wyniki tej rundy):
- npx tsc --noEmit -p gra: exit 0 (po zmianach testu: wynik w odpowiedzi)
- starvation-no-food-gate-test (rozszerzony): 31 passed, 0 failed
- mutacje (kopie źródeł przywracane po każdej): M1 `if (false)` w decideEndTurnGate: 29 passed, 2 failed; M2 ignorujZywnosc false w main.ts: 29 passed, 2 failed; M3 `if (false)` komunikatu: 30 passed, 1 failed; M4 Trudny 0,08: 27 passed, 4 failed. Po przywróceniu: 31 passed, 0 failed; cmp źródeł: identyczne.
- endgate-lever-baseline-test: 5 passed, 0 failed
- no-negative-stocks-end-turn-gate-levers-test: 34 passed, 0 failed
- end-turn-gate-projection-only-test: 49 passed, 0 failed
- end-turn-block-event-test: passed=36 failed=0
- no-negative-stocks-endturn-test: 19 passed, 0 failed
- no-negative-stocks-test: 25 passed, 0 failed
- glod-wojska-karencja-test: 40 pass, 0 fail
- army-hunger-combat-test: 13 pass, 0 fail
- population-civ-matrix-wiring-test: 122 passed, 0 failed
- NIE ZMIERZONO: no-negative-stocks-c3-turn-test, end-turn-gate-live-test, live-nns-gate-smoke-test, pozostałe bramki z dispatchu (logic, tech-tree, research, unit-replace, combat, ai-test, early-grace-15, save-load-*, save-block-pre-capital, load-camera).

BLOKADY:
- Live Chromium (t16–t20, Trudny, 2 jednostki, klik „Zakończ turę”): NIE ZMIERZONO — brak harnessu dla tego scenariusza w tej rundzie.
- Przepisanie 7 testów z dispatchu na nowy kontrakt: NIE WYKONANE jako przepisanie asercji. Powód: te testy wywołują bramkę bez opcji ignorujZywnosc (ścieżka AI/domyślna), której kontrakt ma pozostać bez zmian; ich zielony wynik jest dowodem, że ścieżka AI nie zmieniła się. Kontrakt gracza pokrywa nowy test. Tabela test|przed|po|powód w dokumencie.
- Ryzyko miast nienakarmionych (zarzut 6): otwarte, wymaga decyzji właściciela.

RUNDY: 2/5 (runda 1: Operator HAIKU PASS-WITH-NOTES; Evaluator FAIL; obrona = runda 2)
NASTĘPNY KROK: Evaluator: weryfikacja nowego testu i dokumentu; FC; orkiestrator decyduje o pytaniu ABC dotyczącym utraty ludności miast nienakarmionych (zarzut 6) przed integracją lub jako osobny temat.

UWAGI-DLA-ORKIESTRATORA:
- node_modules w gra/ zainstalowany lokalnie w worktree (npm ci --ignore-scripts); nie jest w repo.
- Pytanie do właściciela (ABC, subagent nie pyta): czy miasto nienakarmione przy wyczerpanym zapasie państwa ma tracić ludność po zdjęciu blokady (stan obecny) — wariant A: zostaje jak jest (miasta tracą 1 ludności/turę przy deficycie miasta); wariant B: brak utraty ludności, gdy zapas państwa <0 lub 0 (wymaga zmiany hooka ludności, poza allowlistą tego tematu).
- Bez spawn_task/create_session/run_in_background; bez push.

DEPLOY/PUSH: NIE WYKONANO
