STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-ALLIN-RELEASE-ROBOCZA-Q1
GOAL: Kandydat wydania ROBOCZEJ = origin/main (75f53d58) + produkt R-WEB-WAR-ALLIN-CAPITAL-Q1 po poprawkach z Evaluatora r1 (obrona).
RUNDY: 2/5 (Operator-obrona po Evaluatorze r1)

Baza obrony: commit Operatora r1 `57d739a3` (produkt `230fd53b`). Wszystkie logi: `evidence/r2-*.log.txt`, kazdy z `EXIT=`, bez trailing whitespace.

## Odpowiedzi na zarzuty

1. `git diff --check` (trailing whitespace w r1-vite-build.log.txt:9) - PRZYJMUJE. Linia `[plugin vite:singlefile] ` pochodzi z wyjscia Vite. Bundle zostal przebudowany (zob. pkt 3), wiec stary log r1 usuniety (`git rm`), nowy `r2-vite-build.log.txt` oczyszczony z trailing whitespace (`sed 's/[ \t]*$//'`), tresc poza tym bez zmian. Dowod: `git diff --check 75f53d58 HEAD` po commicie - patrz sekcja Diff.
2. Brak statusu per eksportowany symbol - PRZYJMUJE (tabela nizej). Dodano brakujacy bezposredni dowod dla trzech stalych (test 8j, 6 asercji granicznych, patrz pkt 3).
3. Stale balansowe w kodzie - PRZYJMUJE. Przeniesione do nowego `gra/data/war-allin-params.json` (konwencja repo `gra/data/*.json`, ksztalt `{wartosc, sekcja, opis}` jak ai-params.json), czytane w `warAllInCapital.ts` przez `import warAllInParamsRaw from '../../data/war-allin-params.json'`; eksporty `WAR_ALLIN_LINK_RADIUS`, `WAR_ALLIN_MERGE_RADIUS`, `WAR_ALLIN_NO_MERGE_NEAR_CAPITAL` zachowane (te same wartosci 3 / 10 / 3, zachowanie bit-identyczne: trajektoria ai-buduje ON r2 == ON r1, md5 linii `tura`/`duzeAI` 7937c2e3... w obu). Katalog `data/derived/` z dispatchu nie istnieje w repo (potwierdzone zarzutem 3 Evaluatora) - uzyto realnej konwencji `gra/data/`. UWAGA do orkiestratora: plik `gra/data/war-allin-params.json` jest NOWY i POZA allowlista dispatchu - dodany na mocy poprawki zarzutu 3; wymaga potwierdzenia przez Final Control. Flaga `WAR_ALLIN_CAPITAL_ENABLED` to przelacznik, nie wartosc balansowa - zostaje w kodzie (jak w r1; test 9f).
4. `r1-stamp.log.txt` bez `EXIT=` - PRZYJMUJE. Stary log usuniety (bundle przebudowany), nowy `r2-stamp.log.txt` zawiera `EXIT=0`.
5. ai-test baza NIE_ZMIERZONO - PRZYJMUJE (zmierzone). `r2-base-ai-test.log.txt` (git archive 75f53d58, EXIT=1): 276 passed, 18 failed; kandydat `r2-test-ai-test.log.txt`: 276 passed, 18 failed; posortowane linie faili: identyczne (diff pusty).
6. Rozbieznosc trajektorii ai-buduje-budynki - PRZYJMUJE (atrybucja zmierzona). Kandydat z `WAR_ALLIN_CAPITAL_ENABLED=false` (kopia drzewa w scratchpadzie, tylko ta jedna linia zmieniona, zrodlo w repo nietkniete): `r2-cand-flagOFF-ai-buduje-budynki.log.txt` PASS=40 FAIL=2, `duzeAI` na koncu FIX 40, a `diff` pelnego logu vs `r1-base-ai-buduje-budynki.log.txt` (po odfiltrowaniu linii ze sciezkami /tmp i czasami ms) jest PUSTY, czyli flaga OFF == baza bit-w-bit. Flaga ON (`r2-cand-ai-buduje-budynki.log.txt`, PASS=40 FAIL=2): rozjazd od tury 11 (`panstwaMiasta p=92` vs `p=91`), FIX duzeAI=35, MUT-A 19, MUT-B 35. Wniosek: rozbieznosc pochodzi z reguly wojny (jej wlasnego wlaczenia), nie z szumu ani z innej zmiany; PASS/FAIL identyczne (te same H1 i M6 jak na bazie). NIE_ZMIERZONO: mechanizm (ktore jednostki/miasta wplywaja na `p`), poza zakresem.
7. Piny wartosci w testach ksztaltu (niski priorytet) - CZESCIOWO. Przyjete: `plan.held.length`, `alone.orders.length`, suma 8d wyprowadzone teraz z fixtury (`big.length`, `big.length + 1`). Odrzucone: `eq(mil.length, 8)` (1g) to liczba jednostek bojowych zadana fixtura scenariusza w `war-allin-capital-scenarios.cjs`, nie wartosc balansowa; `eq(movesLast10, 0)` (4c) to niezmiennik "brak oscylacji" (0 ruchow), nie wartosc do dostrojenia.

## Tabela statusu per eksportowany symbol (`gra/src/game/warAllInCapital.ts`, `ai.ts`, `barbarians.ts`)

| Symbol | Status | Dowod |
|---|---|---|
| `WAR_ALLIN_CAPITAL_ENABLED` | OK | test 9f (flaga jawna w module), harness eksportuje; `war-allin-capital-test` EXIT=0 |
| `setWarAllInCapitalOverride` | OK | uzyty w testach 1-8 (ON/OFF), np. test.cjs:44, :208/:211 |
| `isWarAllInCapitalEnabled` | OK | test 9d (main.ts bramkuje kontekst) + harness.cjs:93 |
| `WarCapitalTarget`, `WarAllInContext`, `WarAllInNav`, `WarAllInUnit`, `WarAllInOrder`, `WarAllInPlan` (typy) | OK (kompilacja) | `tsc --noEmit` EXIT=0 (`r2-tsc.log.txt`); uzywane przez ai.ts/barbarians.ts/main.ts; brak runtime |
| `WAR_ALLIN_LINK_RADIUS` | OK | test 8j1/8j2 (granica L i L+1), JSON 9i/9j; mutacja `<=`->`<` zawala 8j1 |
| `WAR_ALLIN_MERGE_RADIUS` | OK | test 8j3/8j4 (M i M+1) + 8e; mutacja zawala 8j3 |
| `WAR_ALLIN_NO_MERGE_NEAR_CAPITAL` | OK | test 8j5/8j6 + 8g/8g2; mutacja zawala 8j5 i 8g |
| `planWarAllInCapital` | OK | sekcje 8, 10, 1-7 (rozkazy, grupowanie, determinizm, brak nalozen); 91/0 |
| `decideBarbarianMoves` (nowy parametr `warAllIn`) | OK | test.cjs:157-180 (barbarzyncy ku stolicy gracza, garnizon), barbarzyncy-krazenie 249/0, barb-city-behavior 177/0 |
| `decideAITurn` (parametr `warAllIn` w opcjach) | OK | test.cjs:210, ai-test baza==kandydat, ai-prod-fallback 17/0, ai-city-recovery 7/0 |

Mutacja kontrolna (tymczasowa, zrodlo przywrocone `cp`): `<=`->`<` w 3 porownaniach dalo `87 passed, 4 failed` (8g, 8j1, 8j3, 8j5); przywrocone zrodlo: `91 passed, 0 failed` (`r2-test-war-allin-capital-test.log.txt`).

## Zmiany w kodzie (obrona)
- `gra/data/war-allin-params.json` (NOWY), `gra/src/game/warAllInCapital.ts` (import JSON + 3 stale), `gra/tools/war-allin-capital-harness.cjs` (eksport 3 stalych), `gra/tools/war-allin-capital-test.cjs` (testy 8j, 9h-9j, wyprowadzone liczby).
- Bundle przebudowany: Vite (`r2-vite-build.log.txt` EXIT=0, 896 modulow) -> `stamp-bundle.cjs` (`r2-stamp.log.txt` EXIT=0) -> `gra-robocza/Gra-ROBOCZA.html`; `ROBOCZA-MANIFEST.json` (nowe pola gorne; `previousReleaseManifest` zachowane) i `START.html` (`generate-start-hub.cjs`).
- NOWY bundle (z faktycznego pliku): md5 `23893f19cc904b61065b20e712fb6b35`, sha256 `0cf2f66f69d67711caa0c39c67ed6e2510e04b9d7e8bf46dfe99157e304b578b`, 69964335 B. Stary (r1) `4340812b...` jest NIEAKTUALNY. `verify-robocza-bundle.cjs` (`r2-verify.log.txt`): manifest match OK, stamp WARN (znane), VERIFY OK, EXIT=0.

## Testy (r2, surowe logi z EXIT=)
tsc EXIT=0; war-allin-capital 91/0; logic 213/213; barbarzyncy-krazenie 249/0; barb-city-behavior 177/0; territory-border 9/0; recruitment-panel-compact-row 39/0; recruitment-panel-height-real-render 13/0; recruit-card-manpower-real-render 20/0; web-memory-leaks 30/0; ai-prod-fallback 17/0; ai-city-recovery 7/0; autosave-quota-fail 20/0; city-badge-growth-percent 38/0; city-badge-zoom-lod 67/0; city-map-badge 62/0 (wszystkie EXIT=0); ai-test 276/18 EXIT=1 == baza zmierzona. mgla-sciezka-inwariant NIE ponawiany w r2 (zmiana nie dotyka battleScene; wynik r1 41/1 == baza, logi r1-*), NIE_ZMIERZONO na nowym bundlu.
Smoke Chromium `?memdebug=1` na nowym bundlu: pokoj 12 tur mediana endTurn 5684 ms (`r2-smoke-peace.log.txt`, EXIT=0), wojna wymuszona AI<->AI 12 tur mediana 5526 ms (`r2-smoke-war.log.txt`, EXIT=0); ERRORS [], BAD_RESPONSES []. Smoke nadal nie sledzi ruchu jednostek (NIE_ZMIERZONO dotarcie armii do stolic w przegladarce; dowod tylko harness headless).

## Plan publishu i rollback (bez zmian co do idei; hashe zaktualizowane)
Galaz `integration/robocza-turnslow-20261023` od 75f53d58 z commitami: produkt (`230fd53b` + commit obrony), bundle/manifest/START/run docs. Po publishu: readback md5 `23893f19...`, wpis `WERSJE.md` (poza kandydatem). Rollback: revert -> bundle `99c6b33b2587673b3c377d40d22f6396` (sha256 `6f969412d7e9b8a651b92259b135e299ca04d9b238d6722714522d75c4a51b07`, 69956805 B).

NASTEPNY KROK: Evaluator r2 (niezalezny md5 bundla, diff vs allowlista z dopisanym `gra/data/war-allin-params.json`, ponowny test 8j), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
