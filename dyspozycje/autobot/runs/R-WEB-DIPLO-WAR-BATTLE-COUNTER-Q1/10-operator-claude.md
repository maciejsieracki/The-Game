# R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1 — raport Operatora (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1
GOAL: stan pary zapisuje (a) punkty wygranych bitew z bieżącej wojny osobno dla każdej strony (niski/wysoki id), zerowane przy wybuchu wojny, dla wszystkich właścicieli; (b) czasowy bonus trybutu +10% siły dla pobierającego przez 10 tur; plus czyste funkcje odczytu. Bez podpięcia do decyzji AI, pokoju i UI.
BAZA: kandydat 42bf2d9df (detach). Worktree: /home/user/The-Game/.claude/worktrees/wf_926b6ea3-412-1

ZMIANY/COMMIT (allowlista, git diff --name-only 42bf2d9df):
- gra/src/game/diplomacy-military-strength.ts: nowe czyste pomocniki addWarBattlePoints, resetWarBattlePoints, readWarBattlePoints, grantTributeBonus, isTributeBonusActive (bez importu silnika; typy strukturalne).
- gra/src/game/diplomacy-pn-engine.ts: DiploPairMeta + pola OPCJONALNE wojnaBitwyPkt?: { niski, wysoki }, trybutBonus?: { dla, doTury }. freshDiploPairMeta bez zmian.
- gra/src/main.ts (tylko): import helperów; setDiploRelation (przejście w wojnę zeruje licznik; wyjście z wojny zeruje licznik); diploRecordWarBattlePoints + diploGrantTributeBonusFor (nowe funkcje obok diploEnsureWarStart); wywołanie diploRecordWarBattlePoints(winOid, loserOid, pts) w bloku zapisu battlePowerPtsByOwner (koniec bitwy); diploGrantTributeBonusFor(proposerId, responderId) w gałęzi akceptacji 'trybut_zadanie'. Zapis Power (battlePowerPtsByOwner), applyMilitaryWinRespectEvent i serializacja NIE zmienione (serializacja diplomacyPairMeta jest już generyczna JSON, nowe pola jadą same).
- gra/tools/diplo-war-battle-counter-test.cjs (NOWY): 30 przypadków (a)–(g).
- gra/data/diplomacy-military-strength-params.json: bez zmian (trybutBonusTur=10 już istnieje).
- dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-BATTLE-COUNTER-Q1/10-operator-claude.md (ten raport).
Commit: patrz pole SHA w odpowiedzi strukturalnej (commit zawiera wyłącznie powyższe ścieżki, bez git add -A).

TESTY (surowe wyniki z tej rundy):
- npx tsc --noEmit (gra/): exit 0.
- node tools/diplo-war-battle-counter-test.cjs: "Wynik: 30 PASS / 0 FAIL", exit 0.
- node tools/diplo-military-strength-test.cjs: "RESULT: 27 PASS / 0 FAIL", exit 0.
- node tools/diplomacy-test.cjs: "[diplomacy-test] 148 passed, 0 failed (total 148)", exit 0.
- node tools/diplo-respect-military-events-test.cjs: "Wynik: 24 OK, 0 FAIL", exit 0.
- Bramki: logic-test "LOGIC OK (213/213)"; tech-tree-test "20 pass, 0 fail"; research-test "PASSED: 33 / FAILED: 0 / TOTAL: 33"; unit-replace-test "WSZYSTKIE TESTY ZIELONE (21/21)"; combat-test "COMBAT TEST: 6/6 pass". Wszystkie exit 0.
- git diff --check: czysty.
- Zachowanie gry bez zmian (dowód grep): pliki odwołujące się do nowych pól = wyłącznie diplomacy-military-strength.ts, diplomacy-pn-engine.ts, main.ts (wiring powyżej) i nowy test oraz diplo-military-strength-test.cjs (test istniejący, nie czyta pól). Żadna decyzja AI (ai.ts), pokoju (diplomacy.ts / diplomacy-proposals.ts), Power (power-objective.ts) ani UI nie czyta wojnaBitwyPkt/trybutBonus.

BLOKADY: brak. Uwaga: dysk / wolne miejsce przy starcie: 4,2 GB (df -h /); npm ci --ignore-scripts wykonane w worktree gra/ (node_modules do sprzątnięcia po integracji).

ZAŁOŻENIA (luki rozstrzygnięte w raporcie):
1. Reset licznika przy starcie wojny: dispatch wskazuje diploEnsureWarStart. Ta funkcja jest LENIWA (stempluje wojnaStartTura przy pierwszym odczycie, może wystartować PO pierwszej bitwie tej wojny), więc zerowanie w niej skasowałoby punkty pierwszej bitwy. Zerowanie wpięto w setDiploRelation — jedyny punkt mutacji statusu, w gałęzi przejścia w 'wojna' (prevStatus !== 'wojna'). Stempel wojnaStartTura zachowuje dotychczasową logikę.
2. Zakończenie wojny: licznik zerowany w tej samej gałęzi setDiploRelation (wyjście z wojny). Odczyt poza wojną zwraca 0 także bez tego (readWarBattlePoints).
3. Kierunek trybutu: zaakceptowane 'trybut_zadanie' (proposer żąda, responder płaci) — pobierający = proposerId. Jedyne miejsce w main.ts z 'trybut_zaakceptowany' (linia ~25032). Trybut_oferta (oferta płacącego) bonusu nie daje — zgodnie z opisem „pobierający”.
4. Bonus trybutu nie wymaga wojny (dispatch nie stawia takiego warunku). Aktywny w turze T, gdy T < doTury = tura przyjęcia + trybutBonusTur (10 tur: tury 5..14 dla przyjęcia w 5).
5. Punkty bitew = dokładnie ta sama wartość co w battlePowerPtsByOwner (battlePowerPointsFromDefeatedEnemy liczone z przegranego rosteru), tylko zwycięzca dostaje punkty (przegrany — 0), tylko gdy para w statusie 'wojna'. Pary z barbarzyńcami/miastami-państwami też dostają zapis, jeśli są w statusie wojny (bez konsumenta — nieszkodliwe).
6. Serializacja: zapis diplomacyPairMeta jest generyczny (Array.from(...entries())), wczytanie bezpośrednie. Stary zapis bez pól = 0 bitew, brak bonusu (test (f)). Nie dodano osobnego pola do zapisu.
7. Znane ograniczenie (poza zakresem tej rundy): stempel wojnaStartTura może nie być zdejmowany w ścieżkach, które nie przechodzą przez setDiploRelation; reset licznika jest wpięty w setDiploRelation, więc licznik nie przecieka między wojnami przez normalne przejścia statusu.

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja zgodności z dispatchem (pkt 1–7 powyżej), potem Obrona (Haiku), Final Control (Sonnet). Krok 3 (reset) i 4 (trybut) są wpięte w kod; kroki 'podpięcie do AI/pokoju' — poza zakresem tego tematu.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
