STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAP-OFFMASK-STRANDED-FIX-Q1
GOAL: P3 0 suchego lądu poza maską Ziemi, P4 0 samotnych suchych heksów na oceanie
ZMIANY/COMMIT: kandydat 4a0b13b7c; merge-base --is-ancestor 1bb77a7a0 4a0b13b7c = TAK. Kod: gra/src/map/earth-land-mask.ts, gen-helpers.ts (cutBackEarthLandOutsideMask), generator.ts (blok 3e-final, 13 linii), test map-offmask-stranded-fix-test.cjs, docs/obieg/MAPA-KANON-GENERATOR.md, dokumenty runu.
TESTY (własne, kandydat 4a0b13b7c, z surowego wyjścia):
- tsc --noEmit: exit 0
- map-offmask-stranded-fix-test: 5 pass, 0 fail
- stranded-land-test: 18 pass, 0 fail
- climate-band-test: PASS; fair-play-grid-test: 8 pass, 0 fail
- determinism-save-load-resume-test: WYNIK PASS; river-density-test: 2 passed, 0 failed
- earth-template-test: 9 pass, 1 fail (Antarktyda r=85, znany stary pin #145, nie z tej zmiany)
- world-density-test: 29/2 (rzeki sum, pustynia sum) — IDENTYCZNIE na bazie 1bb77a7a0 (zmierzone), więc bez regresji
- river-sea-buffer-test: 6 pass, 3 fail — znany dług bazy (#167), bez zmiany
- Zarzut 1 (woda) niezależny pomiar Ziemia 777: baza plytkie 1596 / morze 15409 / łąka 1559 / poza maską 72 / suchy ląd przy głębokim morzu 0 -> kandydat plytkie 1635 / morze 15447 / łąka 1482 / poza maską 0 / przy głębokim 0. Seed 42 analogicznie (poza maską 72->0). Wybrzeże płytkie zachowane; wzgórza/góry/równina/pustynia bez zmian. Regresja z zarzutu 1 usunięta.
- Zarzut 2: zmiana maski (izolowane heksy szablonu) potrzebna dla earth-template (found 5); ląd suchy bez zmian, 33 heksy wody płytkie->głębokie — akceptowalne, odnotowane.
BLOKADY / NIE ZMIERZONO: map-gen-regression-test i relief-grid-coverage-test (przekroczony limit 580 s na 4 rdzeniach, wynik brak); logic/tech-tree/research/ai-test/combat (nie dotyczą generatora, nie uruchamiane); rzeki -1/-5 nieprzypisane per heks. Żaden pin nie przepięty.
Zarzuty: 1 NAPRAWIONY (potwierdzone pomiarem); 2 ODDANY/uwaga (zmierzony, uzasadniony); 3 generator.ts poza allowlistą — 13 linii, konieczne (kolejność etapów), ODDANY do akceptacji orkiestratora; 4 częściowo (patrz NIE ZMIERZONO); 5 NAPRAWIONY (asercja plytkie_morze>0); 6 NAPRAWIONY.
RUNDY: FC po obronie rundy 2/5
NASTĘPNY KROK: orkiestrator: zaakceptować generator.ts w allowlist; przed integracją uruchomić map-gen-regression i relief-grid na cichej maszynie; potem integracja.
DEPLOY/PUSH: NIE WYKONANO
