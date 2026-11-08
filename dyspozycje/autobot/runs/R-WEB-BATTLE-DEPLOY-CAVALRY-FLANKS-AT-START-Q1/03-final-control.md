STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-BATTLE-DEPLOY-CAVALRY-FLANKS-AT-START-Q1
GOAL: Konnica i rydwany na starcie bitwy na skrzydłach, blisko własnych jednostek, nie przed nimi.
ZMIANY/COMMIT: kod a3546ffcc (formationRules.ts initialBattleSlots, nowy test, 01), obrona 9bbac60e7 (test: asercja 5 bez klauzuli ucieczki, próg 3, 02). Potomek 0679666ac (is-ancestor OK). Diff do 0679666ac: formationRules.ts, battle-deploy-cavalry-flanks-test.cjs, raporty 01/02.

WERDYKTY ZARZUTÓW
1. Allowlista formationRules.ts: ODDAL. Źródło błędu (initialBattleSlots obsługuje start i reset deploy), zmiana 10 linii, dispatch każe naprawiać u źródła. Orkiestrator zatwierdza plik świadomie.
2. Konnica na końcach najszerszej linii czołowej (piechota najszersza): ODDAL / DO DECYZJI CZŁOWIEKA (ABC zadaje orkiestrator). To klasyczne skrzydło, a nie przypadek zgłoszony przez właściciela.
3. Test: asercja 5 naprawiona w obronie (po cofnięciu formationRules do 0679666ac test pada), próg 3 = zmierzone maksimum: ODDAL. Luka C-FLANK/teren: NIE_ZMIERZONO, poza rozmieszczeniem startowym.
4. Weryfikacja wizualna w przeglądarce: NIE_ZMIERZONO (zakaz vite/dev w gra/). Wymagana po deployu.

TESTY (własne, na 9bbac60e7): logic 213/213; ai 289/0; tsc 0; cavalry-flanks PASS 536 asercji, max odległość 3; mutacja (formationRules z 0679666ac) -> FAIL; flank-close 994 PASS; initial-placement-runtime PASS (mutacja 4/4); formation-rules PASS; cap-500 59; undeployed 35/0; ranged-mounted 10/10; large-mixed-doctrine-matrix 36 scen., 0 red (01-matrix.json przywrócony). Nie uruchomiono natural-chariot-r5 (vite build zakazany).
BLOKADY: brak kodowych.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (merge-base z 0679666ac; sprawdź is-ancestor i diff --stat), pytanie ABC o konnicę na końcach najszerszej linii.
DEPLOY/PUSH: NIE WYKONANO
