STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; logika gry bez zmian)
TEMAT: R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1 (runda 3/5, baza db29c24d1)
GOAL: (3) kara za zerwanie NAP AI↔AI; (2) wiring ticku w żywej grze, ziarno 4242.

ZMIANY-COMMIT:
- 709661eeb: hak civTest `__truceTestDebug.aiAiNapLiveProof` {concludeNap, setRelation (SETUP), state (odczyt)} w gra/src/main.ts; test gra/tools/ai-ai-treaty-live-proof-breach-test.cjs; dowody punkt3-*.
- commit (2), SHA w polu sha: gra/tools/ai-ai-treaty-live-proof-wiring-run.cjs (kopia runnera ekonomii + setEnabled(true) + wiring.log), gra/tools/ai-ai-treaty-live-proof-wiring-test.cjs, dowody/wiring-clean, dowody/wiring-MUTANT-D0, ten raport.
- Logika gry (ai-ai-treaty-tick.ts, evaluate, params, diplomacy, ai.ts) NIE zmieniana. torAktywny=false w danych. Mutacje tylko w kopii; źródło przywrócone (cmp OK).

TESTY:
(3) KARA: czysty bundle, ziarno 4242, Zaufanie 100. ON Δrespekt −30 (50→20), OFF Δ 0 (50→50): Δ(ON)−Δ(OFF) = −30. LOW (Respekt 20) → 0 (clamp). A1-A6: 10 OK / 0 FAIL. Mutacja dR=0: A4 FAIL (kara 0), A5 FAIL (20 zamiast 0) → czerwień.
  Zaufanie: wojna zeruje Zaufanie (100→0) w ON i OFF. Spadek −20 z 'zlamana_obietnica_ai' NIE jest izolowany tym testem (NIE ZMIERZONO osobno).
(2) WIRING: ziarno 4242, tor ON przez całą grę, 60 tur (59 zakończonych EOT), bypass NNS 1x. A1 OK (59 wierszy), A2 OK (skarbiec min 0), A3 OK (NAP=1: Egipt(1)–Fenicjanie(22), 15 tur, dopłata 829 ¤ od 22), A4 OK (0 pageerror). Mutacja D=0 w kopii: NAP=1 z D=0, brak dopłaty → A3 FAIL → czerwień.
  ROZBIEŻNOŚĆ DO ROZSTRZYGNIĘCIA: log podaje dopłatę 829 ¤, ale metryka skarbca (ownerTreasury) nie pokazuje przepływu: właściciel 22 ≈113 ¤ w t21, 168 w t22; Egipt(1) 482→513 w t22. Planner (ai-ai-treaty-tick.ts) wymaga D ≤ skarbiec płatnika; przy ≈113 ¤ to niespójne. Możliwe: rozjazd aiSkarbiecByOwner vs ownerTreasury w metryce, albo przelew niewykonany. NIE ZMIERZONO.
  Liczba prób ticku i powody odmów: NIE ZMIERZONO (tick nie eksportuje liczników; bez zmiany logiki).
Bramki: tsc --noEmit 0; logic-test 213/213; tech-tree-test 20 pass / 0 fail; research-test 33/33; unit-replace-test 21 OK / 0 FAIL; combat-test PASS; ai-ai-treaty-evaluate-test 21 PASS / 0 FAIL; ai-ai-treaty-nap-wiring-test WYNIK ZIELONE (44/44 sprawdzeń).
Dowody: dyspozycje/autobot/runs/R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1/dowody/ (punkt3-*.json, wiring-clean/, wiring-MUTANT-D0/).

BLOKADY: rozstrzygnięcie rozbieżności dopłaty D (pkt 2); liczniki ticku i odmów NIE ZMIERZONO.
RUNDY: 3/5
NASTĘPNY KROK: orkiestrator decyduje: hak odczytu aiSkarbiecByOwner w turze NAP (rozstrzygnięcie D); ewentualnie ponowna weryfikacja ziarna 7.
UWAGI-DLA-ORKIESTRATORA: (a) wznowienie z slotu (tura 20→60) zakończyło się „Target page closed” w openGame; użyto przebiegu świeżego; wznowienie wymaga zbadania. (b) 59 linii „AI↔AI Umowa Handlowa” to istniejący tor handlowy, nie NAP. (c) Bundle i wyniki robocze w katalogu scratchpad (poza repo).
DEPLOY/PUSH: NIE WYKONANO
