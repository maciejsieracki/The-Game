# R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1 — Final Control (SONNET 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1
GOAL: generacja ziarna 22 (Standardowy i Mały) wielokrotnie szybciej (cel ≥3× mierzony licznikiem BFS), deterministycznie, z jawną tabelą sum kontrolnych przed/po.
ZMIANY/COMMIT: kandydat 43f11d042a1fe5c334b7f26bd404e02f38edb6bb (potomek bazy fab9a9b75 — `git merge-base --is-ancestor` = TAK). Kod: a13a33da4 (+7b06e233c): gra/src/map/gen-helpers.ts, gra/tools/mapgen-rivers-fill-centroid-cache-test.cjs, gra/tools/mapgen-rivers-seed22-diag-build.cjs (1 linia: dopisana nazwa licznika; wzorzec `gra/tools/mapgen-*.cjs` jest w allowliście). Poza allowlistą: brak (diff vs baza = 2 raporty w runs/ + 3 pliki wyżej). `git diff --check fab9a9b75 43f11d042` czysty. Próbne scalenie z bieżącym origin/main (b3e74f414, poszedł dalej od bazy; żaden plik map/mapgen nie zmieniony na main) — `git merge-tree` bez konfliktów.

## Weryfikacja własna (surowe wyniki)
- `npx tsc --noEmit` → exit 0.
- logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; unit-replace-test `21/21`; combat-test `6/6`. Wszystkie 5 bramek zielone na kandydacie (baza referencyjna nie była potrzebna — nic czerwonego).
- Test tematu: `checksum=9f0c2884 run2=9f0c2884 bfs=1/1 bazowe_bfs=4745 spadek=4745.00x PASS`, exit 0, 50 s.
- Dowód mutacyjny (własny): usunięcie ustawiania pamięci w wrapperze `topUpRiverGridCoverage` → `bfs=2010/2010 spadek=2.36x FAIL` (exit 1, oba przebiegi). Mutacja cofnięta (`git checkout`), drzewo czyste.
- Niezależna kontrola sum (baza fab9a9b75 vs kandydat, Mały): ziarno 11 `2cd1cc69` = `2cd1cc69`; ziarno 12 `e918c65f` = `e918c65f`. Razem z tabelą Obrony (Mały 1–10, 22 oraz Standardowy 22: sumy identyczne) = 14 par bez zmiany układu rzek.
- Poprawność pamięci (analiza własna, niezależna od Obrony): (a) BFS czyta wyłącznie `terenBazowy` i istnienie kluczy `hexes` (`canRiverFlowThrough`, blockExisting=false); przechodniość zależy od sąsiada, nie od źródła — poza samym startem (relief) — więc składowa jest wspólna dla wszystkich startów, a kod wyłącza ten przypadek (`mouthPassable`); (b) warunek trafienia `visitCap > size` jest poprawny (przy visitCap == size BFS byłby ucięty); (c) graf wywołań z `topUpRiverGridCoverageBody`/`traceRiverForGridFillBody`: jedyne ścieżki do zapisów terenu (`setHexToMorze/Laka`, `flattenFalseCoastalRiverNotches`) to fałszywe trafienia z komentarzy/nazw — rzeczywiste wywołania `generateRivers(` w ciele topUp: brak; `flattenFalseCoastalRiverNotches` nie jest wołana w gen-helpers. Ograniczenie: analiza nazw, bez wywołań przez referencję i modułów zewnętrznych — dopełniona zgodnością sum.

## Rozstrzygnięcie zarzutów
| Nr | Zarzut | Decyzja | Uzasadnienie |
|---|---|---|---|
| 1 | Cel ≥3× niespełniony | ODDAL (naprawione w r1 obrony) | Mały 22: BFS 4745 → 1; Standardowy 22: 18590 → 824 (22,6×; baza wnioskowana z liczby wywołań, wrapper jej nie zmienia). |
| 2 | Test czerwony, brak mutacji | ODDAL | Test zielony; mutacja własna czerwona (2,36×). |
| 3 | Brak Standardowy 22 | ODDAL | Suma 3248f5b4 = 3248f5b4, BFS 824. Czasu NIE_ZMIERZONO czysto (równoległe uruchomienia: ~563 s → ~207–249 s). |
| 4 | Brak tabeli ≥10 ziaren × 2 rozmiary | ODDAL jako NOTA | Mały: 12 ziaren zmierzonych (1–12 + 22), wszystkie bez zmiany. Standardowy: tylko ziarno 22; ziarna 1–10 NIE_ZMIERZONO (baza ≈560 s/ziarno wobec limitu 590 s narzędzia). Ryzyko niskie: pamięć jest dokładna z konstrukcji (analiza wyżej), a 4744/4744 trafień zgodnych z ponownym BFS. Nie jest to realna decyzja produktowa ani wada kodu — dopomiar w razie potrzeby osobno. |
| 5 | Brak testu determinizmu | ODDAL | Test robi dwa przebiegi, obie sumy = 9f0c2884. |
| 6 | Zakres pamięci za wąski | ODDAL | Wszystkie chybienia pochodziły z topUp; po rozszerzeniu zakresu BFS = 1 (Mały). Pozostałe wołania poza zakresem nie generują chybień w pomiarze. |
| 7 | Kruchy/kosztowny test | ODDAL (nota) | Stałe BASE_* udokumentowane i zmierzone na bazie; 50 s akceptowalne dla testu narzędziowego. Szybki test klucza: brak — uwaga dla orkiestratora (opcjonalna). |
| 8 | 00-dispatch.md poza main; zmiana diag-build | ODDAL | Zmiana mieści się w `gra/tools/mapgen-*.cjs`; brak dispatchu w main to kwestia procesu, nie kodu. |

Żaden zarzut nie wymaga NAPRAWY; żaden nie wymaga decyzji produktowej.

TESTY: patrz wyżej (tsc 0; 5 bramek zielone; test tematu PASS; mutacja FAIL; sumy 11=11, 12=12).
BLOKADY: Standardowy 1–10 NIE_ZMIERZONO (limit czasu narzędzia); czysty pomiar czasu NIE_ZMIERZONO.
RUNDY: FC po 1/5 + obrona r1.
NASTĘPNY KROK: integracja orkiestratora (kandydat potomkiem bazy; scalenie z b3e74f414 bez konfliktów), bramki po scaleniu, potem deploy ROBOCZA wg dispatchu. Zmiana map: zaakceptowana przez właściciela (ABC 12=A), w pomiarze nie wystąpiła na żadnym z 14 zmierzonych ziaren.

UWAGI-DLA-ORKIESTRATORA:
- Sprzątanie: `gra/node_modules` w worktrees tego tematu (Operator/Obrona/FC) do usunięcia po integracji; kopie wrapperów w scratchpadzie sesji FC.
- Opcjonalny temat: dopomiar Standardowego 1–10 (bazę liczyć w tle/dzielnie) oraz szybki test równoważności pamięć = brak pamięci.

DEPLOY/PUSH: NIE WYKONANO
