STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz jako cel wojen epoki Kamienia/Brazu/Zelaza na rowni z AI, bez zmian progow/licznikow/kosztow; narzedzie pomiarowe; bieg dymny.
ZMIANY/COMMIT: kandydat 2bcb3c7807beb2454f476e4f18c6e000cf1dd606. `git merge-base --is-ancestor 8af54d2dc 2bcb3c780` = tak (ANC_OK). diff --stat vs 8af54d2dc: 7 plikow (+362/-124): gra/src/main.ts, gra/src/game/war-rules-multiwar.ts, gra/tools/era-war-engine-scenario-test.cjs, era-war-measure-run.cjs, forced-war-iron-main-guard-test.cjs, runs/.../10-operator-claude.md, 30-obrona-claude.md. Wszystko w allowliscie; brak WERSJE.md/gra-robocza/gra-kanon/rust-port/data.
TESTY (wlasne, surowe, na detached 2bcb3c780): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; era-war-engine-scenario 27 OK/0 FAIL; era-war-player-included 10/0; era-war-defer-not-cancel 29/0; era-war-delays 55/0; era-war-ignore-treaties 22/0; era-war-bronze-player-target 44/0; forced-war-bronze 48/0; iron 55/0; stone 31/0; multi-turn-simulation 48/0; bronze-main-guard 22/0; iron-main-guard 36/0; stone-main-guard 15/0. Mutacja MUTATE=gate: 26 OK / 1 FAIL (czerwieni tylko pin tekstowy S9).
OCENA ZARZUTOW:
1 (seed 7 ze starego builda): ODRZUCONY. out2/era-seed7.jsonl (01:10, 119 wierszy, tury 2-120) powstal na dist2 po poprawce filtra; deklaracje seed 7 identyczne jak z dist.
2 (pending Braz AI4 t41-t109 przez pairing-unresolved/sojusz): ODDAL jako uwaga. Skutek twardej reguly "sojusz z napastnikiem blokuje" (decyzja wlasciciela); naprawa = zmiana reguly -> ABC wlasciciela. Pomiar: seed 4242 24x pairing-unresolved + 1x civ-cap-target; seed 7 18x pairing-unresolved.
3 (test S6-S8 to lustro toru main.ts): ODDAL jako uwaga. Prawda (mutacja gate czerwieni tylko pin S9), ale czysta bramka isEraWarTargetDelayOk jest teraz wspolna z main.ts, wiring pilnuja piny; pelny main.ts w node niemozliwy bez Chromium.
4 (powody niewystartowania): NAPRAWIONY w r4 (hak 'not-searched' w main.ts dla trzech epok), tylko odczyt.
5 (rownowaznosc wznowienia save/load vs bieg ciagly): ODDAL, NIE ZMIERZONO. Backfill Zelaza zawezony do epoki 3 (test S10).
6 (etykieta iron t117 seed 4242, cel gracz w epoce 2): ODDAL. Napastnik AI19 jest w Zelazie (etykieta = epoka napastnika); prog gracza wg jego Brazu (77+40=117) zgodny z decyzja o puli gracza. Bledu nie wykazano.
7 (dowody poza repo w /tmp/claude-0/ew4): nie naruszenie; do sprzatniecia przez orkiestratora.
POMIAR (out2, dist2, 120 tur, gracz AI): seed 4242 - Kamien t40: 3 wojny (AI4->gracz), Braz t79/84/92 (cele AI), Zelazo t109/117/118 (t117 AI19->gracz). Seed 7 - Kamien t40: 3 wojny (AI1->gracz), Braz t79/81/91, Zelazo t105/107/112 (cele AI). Gracz bywa celem Kamienia w obu ziarnach, Zelaza w 1 z 2, Brazu w 0 z 2 (gracz wszedl w Braz t77, prog 40 => najwczesniej t117).
BLOKADY: brak blokujacych. Ograniczenie: hunki r4 (hak not-searched, filtr backfillu Zelaza) nie byly objete zywym biegiem 120 tur - NIE ZMIERZONO (pokryte testami S10 i guardami, tsc czysty).
UWAGI-DLA-ORKIESTRATORA: (a) ABC: czy pending Brazu przy zablokowaniu wszystkich par sojuszem ma miec fallback poza sojuszem; (b) opcjonalny osobny temat: bieg wznawialny save/load vs ciagly; (c) posprzatac /tmp/claude-0/ew4; (d) integrujac sprawdz merge-base kodu i diff --stat (main.ts, war-rules-multiwar.ts).
RUNDY: 4/5; werdykt FC: PASS-WITH-NOTES.
NASTEPNY KROK: integracja orkiestratora (merge-tree, bramki), potem decyzja deployu osobno.
DEPLOY/PUSH: NIE WYKONANO
