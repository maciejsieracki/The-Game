STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe + hak odczytowy, bez zmian zasad gry)
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1
GOAL: hak odczytowy, runner i analizator pomiaru sojuszy AI↔AI (flaga wyłączona vs włączona) + bieg dymny.
ZMIANY/COMMIT: kandydat aaffff2efc263d1529d2bd3a9bf7da122663b41e; baza d1dae2355 jest przodkiem (merge-base --is-ancestor OK). Diff: 9 plików, +506/-2: main.ts (+71, hak), ai-ai-alliance-tick.ts (licznik proby/odmowy), 3 narzędzia gra/tools/ai-ai-alliance-measure-*.cjs, raporty 10/30 i dowody. Wszystko w allowliście; brak zmian w gra-robocza/kanon/WERSJE/rust-port.
TESTY (własne, surowe wyjście): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; ai-ai-alliance-tick-test 19/19, mutanty 8/8; hook-test WYNIK ZIELONY, 9 mutantów wykrytych, 0 FAIL. Analizator na dowody/ zwraca tabelę (seed 4242, 30 tur, flaga true, 302 prób/302 odmów, 0 sojuszy, 0 wojen); grep NaN w jsonl = 0.
OCENA ZARZUTÓW: (1) mutacja stanu przez getDiploRelation: NAPRAWIONE (diplomacyRelations.get bez tworzenia relacji; zweryfikowane w diffie; brak wpisu = neutralni = nie-wojna). (2) test statyczny: częściowo naprawiony (H8a/H8b/H9, mutanty M5 +5/M5b/M5c wykryte), ale test NADAL statyczny, bez bundle; odstępstwo od p.4 dispatchu, ODDAJĘ jako uwagę (nie blokuje: hak jest tylko odczytem pod ?civTest=1, a bieg dymny na bundlu dowodzi działania end-to-end). (3) dowód nieanalizowalny: NAPRAWIONE (analizator przyjmuje *.jsonl, potwierdzone).
Hak: wymuszenie flagi tylko pod ?civTest=1 i window.__civAiAllianceMeasureForce; flaga domyślna niezmieniona.
BLOKADY: brak.
RUNDY: 1/5 (po obronie)
UWAGI-DLA-ORKIESTRATORA: (a) hak-test statyczny, brak testu behawioralnego na bundlu; (b) jsonl dymny zaczyna się od tury 2 (29 wierszy), przyczyna nieznana; (c) w biegu dymnym ON 302/302 odmów, 0 sojuszy w 30 tur, istotne dla długiego pomiaru (100-150 tur x 3 ziarna) i późniejszego ABC; NIE_ZMIERZONO poza 30 turami.
NASTĘPNY KROK: integracja orkiestratora, potem długie biegi.
DEPLOY/PUSH: NIE WYKONANO
