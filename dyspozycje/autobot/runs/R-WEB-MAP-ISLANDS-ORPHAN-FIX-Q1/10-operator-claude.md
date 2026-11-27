STATUS: PASS-WITH-NOTES
DOMAIN: GAME (gra/src/map: generator.ts, gen-helpers.ts; nowy test gra/tools/map-islands-orphan-test.cjs)
TEMAT: R-WEB-MAP-ISLANDS-ORPHAN-FIX-Q1 (tag MAPFIX2)
GOAL: usunąć osierocone heksy sieci rzecznej na wyspach po MAPFIX (cel: 0 osieroconych ORAZ 0 samotnych lądów na mapach z MAPREGDIAG, bez pogorszenia pozostałych).
ZMIANY/COMMIT: patrz SHA w raporcie orkiestratora (commit na gałęzi wf_d7ad9b86-4bd-1, baza origin/main 6319eaf66).
  - gra/src/map/gen-helpers.ts: purgeOpenOceanLandSpecksAndReconcileRivers (purge + ensureRiverOutlets do zbieżności, max 4 przebiegi) i clearStrayWaterRiverMarks (zdjęcie znaczników rzeki tylko z heksów wodnych poza trasami).
  - gra/src/map/generator.ts: wywołanie helpera w miejscu dawnego purgeOpenOceanLandSpecks (przebieg 3e-final).
  - gra/tools/map-islands-orphan-test.cjs (nowy, ciężki ~7-9 min).
  - dyspozycje/analizy/MAPA-WYSPY-OSIEROCONE-NAPRAWA-2026-11-27.md (tabela przed/po).
  - dyspozycje/autobot/runs/R-WEB-MAP-ISLANDS-ORPHAN-FIX-Q1/10-operator-claude.md (ten plik).
TESTY:
  - tsc --noEmit (gra/): exit 0.
  - Pomiary orphanCount / solitaryLand (measure-def, wyspy, standardowy):
    PRZED (MAPFIX): 777/medium 6/0 (zmierzone), 7/medium 24, 2026/medium 1, 777/high 10/0, 7/high 18/0, 123/high 4 (dwie ostatnie z MAPREGDIAG).
    PO (finalna zmiana): 777/medium 0/0, 7/medium 0/0, 2026/medium 0/0, 777/high 0/0, 7/high 0/0, 123/high 0/0.
  - map-islands-orphan-test.cjs: PASS (orphan=0 solitary=0, riverHexCount=7832).
  - map-offmask-stranded-fix-test.cjs (MAPFIX): 5 pass / 0 fail.
  - earth-template-test.cjs: 9 pass / 1 fail — "Antarktyda w szablonie (found 0)". Pin sprzed decyzji 5B; poprawiony na main w 5317bff8a (ANTARDOC), nieobecnym w bazie 6319eaf66. Nie wynika z tej zmiany (NIE ZMIERZONO na bazie tym samym skryptem).
  - map-gen-regression-test.cjs (sekcje A-E): NIE ZMIERZONO — limit czasu tematu (sekcja B = kilkanaście map po ~5-9 min). Wnioskowane (nie zmierzone): twarde naruszenia 11 -> 5 (baza 690947a2a = 5).
  - Lekkie testy river-*, world-density, cluster-plan-name, determinism-save-load, bramki logic/tech-tree/research/unit-replace/combat/ai-test: NIE ZMIERZONO w tym temacie.
  - Mutacja czerwona: NIE URUCHOMIONA na bazie tym samym testem; dowód pośredni: baza (zwykły purge) daje orphan 10 na 777/high (MAPREGDIAG), a finalny kod 0.
BLOKADY: brak blokad procesu. Brak: pełnej regresji map-gen (czas), pozostałych lekkich testów (czas), pomiaru mutacji na bazie (czas).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: (1) uruchomić map-gen-regression-test.cjs (lub sekcję B z run-sections) na tym commicie i potwierdzić liczbę twardych naruszeń <= 5; (2) lekkie testy river-* i determinism; (3) ocena wizualna wyspy z rzekami po deployu (usunięte znaczniki rzeki na wodzie poza trasami).
UWAGI-DLA-ORKIESTRATORA:
  - Zmiana dotyczy pętli wszystkich typów mapy, ale tylko tam, gdzie purge usuwa heks rzeczny, daje różnicę. Pozostałe typy nie były mierzone poza testami wymienionymi wyżej (NIE ZMIERZONO).
  - clearStrayWaterRiverMarks usuwa dekoracyjny znacznik rzeki z heksu morskiego poza trasami. Nie zmienia tras, lądu ani ujść. Warto ocenić wizualnie.
  - Kolejność w pętli: ensureRiverOutlets nie gwarantuje sam z siebie zerowej liczby osieroconych (przycina trasy, a potem pruneRiversNotReachingRealSea/pruneInvalidShortRiverPaths mogą odciąć kolejne); stąd pętla.
  - Odpowiedź na pytanie o pangea bboxFill (z FC MAPREGDIAG) nie była przedmiotem tego tematu.
DEPLOY/PUSH: NIE WYKONANO
