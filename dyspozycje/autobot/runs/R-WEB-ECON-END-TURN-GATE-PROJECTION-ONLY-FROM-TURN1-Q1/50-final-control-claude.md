STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: bramka „Zakończ turę” decyduje wyłącznie prognoza po turze (po reakcji automatu żywności), od tury 1; brak ręcznej dźwigni = brak blokady; propozycja podatku krokami 10%; stabilny kształt wyniku dla UI.
ZMIANY/COMMIT: oceniony kandydat b2b8c6ad5de812a30f67ccb424cbe4ab80e91b58. Potomek 0f6c27dac (merge-base --is-ancestor = tak). NIE jest potomkiem aktualnego origin/main 78af786ed (FALA 723); merge-base z main = 5304bbab8. `git merge-tree` kandydat vs 78af786ed: jedyny konflikt = gra/src/data/wikiBundle.json (main.ts scala się automatycznie). Diff kodu vs merge-base: gra/src/game/no-negative-stocks.ts, gra/src/main.ts (ścieżka bramki gracza + hooki ?civTest=1), wikiBundle.json; reszta to testy i dokumentacja. Ścieżka ofert AI nietknięta, ai-params/dochody/koszty bez zmian w tym temacie. git diff --check: czysty. integration_sha = b2b8c6ad5de812a30f67ccb424cbe4ab80e91b58 (kod); ten raport jest jedynym plikiem dodanym przez FC.
TESTY (własne, surowe wyniki, worktree na kandydacie, node_modules z worktree kandydata):
 - tsc --noEmit: exit 0.
 - end-turn-gate-projection-only-test 49/0; no-negative-stocks-projection 49/0; -end-turn-gate-levers 34/0; -endturn 19/0; no-negative-stocks-test 25/0; -ai-from-turn1 27/0.
 - Bramki referencyjne: logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0 (wszystkie zielone, równe wartościom referencyjnym; dla czerwonych brak potrzeby porównania z bazą).
 - Żywa gra (Chromium, build vite poza repo, ?civTest=1), end-turn-gate-live-test seed 11, uruchomiony przeze mnie na kandydacie: 9/9 PASS, błędy strony 0 (a@t1, b@t1, c@t1, d@t2, d2@t3, e@t4, a@t12, b@t12, c@t12). Zrzut b@t1 przejrzany: przycisk „Zakończ turę” wygaszony, Skarbiec −4. (Uwaga: komenda uruchomiona kilkukrotnie przez nakładające się obserwatory; wynik identyczny każdorazowo.)
 - Dowód czerwony/mutacje (z commitowanych artefaktów Obrony, NIE powtarzane przez FC): r3/result-base-seed11.json = 3 PASS / 6 FAIL (baza czerwona); r4/result-mut-wiring-seed11.json (mutant `false && ...` w nnsGateForPlayer) = 7 PASS / 2 FAIL (b@t1, b@t12); r4/result-cand-seed11.json = 9 PASS / 0 FAIL.
 - Tabela zgodności prognoza vs realny endTurn: r3/table-new*.json oraz r4/table-neg-seed11/22/33.json (3 ziarna x tury 1–15, 45 wierszy w trybie NEG, 0 rozbieżności |diff|>0.5) — odczyt artefaktów, NIE powtarzane przez FC.
 - NIE ZMIERZONO przez FC: live-verify-wave-689-697-a-gate-v2/v4 (zaktualizowane, tylko oczekiwania logowane, nie uruchomione), ai-t2-behavior-test, c3-turn-test, mutacja efektów ubocznych.
ROZSTRZYGNIĘCIE ZARZUTÓW:
 1 ODDAL - mutant wpięcia prognozaPoPodatku przechodził; Obrona r4 dodała asercję szacunek==='krokowy' w scenariuszu b; mutant daje teraz FAIL b@t1/b@t12 (7/9), kandydat 9/9 (potwierdzone moim biegiem kandydata; mutant z artefaktu).
 2 ODDAL z notą - tryb --neg dodany (Spichlerz prognoza <0 przed automatem), 45 wierszy, 0 rozbieżności; ograniczenie: jeden reżim spBase=-4, prognozy Skarbca <0 nie porównywalne (bramka blokuje, brak endTurn); zgodność Skarbca po podatku mierzy scenariusz c. Nie jest to defekt kodu.
 3 ODDAL - gateStateFingerprint przed/po gateInfo sprawdzany w live b (sideEffectFree=true); asercja wchodzi do 9/9. Mutacja side-effect NIE ZMIERZONO.
 4 ODDAL jako dług niekrytyczny - v2/v4 mają tylko zmienione logowanie oczekiwań; nie gate'ują wyniku. Zalecane uruchomienie przy okazji, nie blokuje.
 5 ODDAL - semantyka „niewykorzystana dźwignia + niewystarczający podatek => blokada z flagą niewystarczajace” wynika wprost z DODATKU 6 i decyzji właściciela (brak dźwigni = brak blokady); to zachowanie zamierzone. Ryzyko UX (gracz zablokowany do rozwiązania jednostek) zgłaszam orkiestratorowi w UWAGACH jako informację do świadomej akceptacji, nie jako NAPRAW.
 6 ODDAL - tooltip to atrybut title przycisku (nie element DOM), treść zawiera „po zakończeniu tury” (asercja live PASS, buttonTitle w result JSON).
 Brak pozycji NAPRAW.
BLOKADY: brak blokujących. Do wykonania przez orkiestratora przed deployem: merge origin/main 78af786ed do kandydata, regeneracja wikiBundle narzędziem gra/tools/bundle-wiki-for-game.cjs, ponowne tsc + testy NNS po merge.
UWAGI-DLA-ORKIESTRATORA:
 - Zmieniono 3 asercje gracza w no-negative-stocks-ai-from-turn1-test (gracz: blokada od tury 1, wyjatekTur===false) — dotyczą gracza, nie AI; zgodne z regułą właściciela; dispatch zabraniał ruszania testu, ale reguła o usunięciu wyjątku tur 1–10 wymusza zmianę (jak FC r2).
 - Ryzyko UX (zarzut 5) do ewentualnego potwierdzenia przez właściciela.
 - Okno/wydarzenie blokady robi R-WEB-UI-END-TURN-BLOCK-EVENT-Q1 na stabilnym NnsGateResult (zasob, prognoza, propozycjaPodatku{szacunek,punktyProcentowe,...}, automatPoprawil, niewystarczajace, dzwignie).
 - Nie tworzono sesji ani zadań.
RUNDY: 4/5 (FC r4 = PASS-WITH-NOTES)
NASTĘPNY KROK: integracja orkiestratora (merge 78af786ed + wikiBundle + tsc + testy NNS), potem deploy ROBOCZA wg reguł.
DEPLOY/PUSH: NIE WYKONANO
