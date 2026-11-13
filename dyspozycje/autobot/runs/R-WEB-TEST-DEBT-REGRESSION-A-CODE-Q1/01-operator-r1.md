STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TEST-DEBT-REGRESSION-A-CODE-Q1
GOAL: Rozstrzygnac, czy czerwone testy klasy A to regresja kodu czy nieaktualny test; naprawic wlasciwa strone.
ZMIANY/COMMIT: baza origin/main 16c0509f6. Tylko 4 pliki gra/tools/*-test.cjs (zero zmian w gra/src). SHA: commit "R-WEB-TEST-DEBT-REGRESSION-A-CODE-Q1 r1" (SHA w odpowiedzi koncowej).

## Werdykty (wszystkie 4: TEST-NIEAKTUALNY, brak KOD-REGRESJA)

1. web-memory-leaks-test [3] M1 -> TEST-NIEAKTUALNY.
   Kod: gra/src/render/cities.ts:1017-1033 (_registerModel/_disposeModel) + geometryContentPool.ts (release: dispose dopiero gdy --refs==0) + cities.ts:583-585 (nowy model rejestrowany PRZED zwolnieniem starego, wiec zasoby wspolne maja refs 2->1 i zyja dalej w nowym modelu). Stary test oczekiwal dispose wszystkich 20 geometrii/18 materialow (got 6/0) i perCityGeos.length == geos.size (26 vs 20; tablica ma duplikaty kanonicznych geometrii po poolOwned).
   Pomiar braku wycieku (skrypt poza repo, 3 uruchomienia, identyczne wyniki): 30 miast x 8 przebudow (pop 2..80) x 4 cykle, potem sync([]). W trakcie cyklu zywych geometrii 60 (pula: 60 wspolnych, 2460 odwolan; bez puli ok. 30x20), po zdjeciu miast: zywe geometrie 0, zywe materialy 0, pula 0/0, stale we wszystkich 4 cyklach (laczna liczba utworzonych geometrii rosnie 90->360, zywych po cyklu 0). renderer.info.memory niedostepne bez WebGL w node; zliczono zdarzenia 'dispose' + stats() puli.
   Poprawka testu: asercje zastapione regula "zasob wspolny nie jest dispose'owany przy zdjeciu instancji, tylko po ostatnim odwolaniu, a liczba nie rosnie": rejestr userData pokrywa zasoby; po przebudowie kazdy zasob starego modelu zwolniony LUB wspolny z nowym; wspolny nie zwolniony gdy uzywany; po zdjeciu miasta WSZYSTKIE zwolnione i pula pusta; 4 cykle x 12 miast: 0 zywych po cyklu, stala liczba w trakcie. Wynik: 69 passed, 0 failed (3x). Asercje nie oslabione: lapia brak release (pula niepusta / zywe zasoby).
2. merge-decor-no-regress-test -> TEST-NIEAKTUALNY. gra/src/render/scene.ts:1628 (FALA 530) wola renderer.setOpaqueSort(...) takze na sharedRenderer; atrapa fakeRenderer w tescie go nie miala. Dodano no-op setOpaqueSort. Wynik 49 pass / 0 fail.
3. mgla-odkrycie-wzdluz-sciezki-test -> TEST-NIEAKTUALNY. gra/src/main.ts:12216-12226: ownPlayerVisibleHexes() (FALA 529, perf) liczy visibleDiskKeys(u.q, u.r, sight) zamiast computeVisibleAt(u.q, u.r, map, sight); zrodlem nadal biezaca pozycja jednostek, zero heksow sciezki (kontrakt testu zachowany). Regex straznika poszerzony o oba wywolania. 17 pass / 0 fail.
4. fort-outpost-hard-territory-test I5 -> TEST-NIEAKTUALNY. gra/src/main.ts:41230-41235: sweepFortCaptures() nadal wolany bezwarunkowo bezposrednio po flushAiCityRenderBatch() (faza AI); pomiedzy nimi doszla tylko instrukcja `deferRefreshFogUnitSync = null;`. Kontrakt "hard territory" (zdobycie fortu przez wejscie wojska po fazie AI) nienaruszony. Regex dopuszcza te jedna instrukcje. 80 passed / 0 failed.

TESTY: 4 testy zielone j.w.; tsc --noEmit EXIT 0; logic-test 213/213; ai-test 274 passed / 20 failed (bez pogorszenia; gra/src nietkniete).
BLOKADY: brak. npm ci wykonane lokalnie w worktree i usuniete (node_modules, pliki tymczasowe). Nie uruchamiano przegladarki. Pomiar nie obejmuje UnitRenderer (ta sama pula, poza zakresem dispatchu).
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
