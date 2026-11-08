STATUS: PASS-WITH-NOTES (zmierzony zysk JS końca tury 1,25x mediana; GOAL 2x NIE osiągnięty w allowliście — tabela udziałów poniżej)
DOMAIN: GAME
TEMAT: R-WEB-PERF-ENDTURN-AI-PHASE-Q1
GOAL: JS końca tury (137 miast / 321 jednostek) >= 2x niżej, bez zmiany wyników i determinizmu AI.
ZMIANY/COMMIT: RUNDA 3/5 na bazie eeb668b72 (kandydat R2 aa9d5d1ce). SHA commitu R3: patrz ostatnia linia odpowiedzi końcowej (git log). Pliki:
- gra/src/main.ts: (1) empireActiveResourceLabelsForOwnerRaw -> getResourceAccessForCity (active-only; main.ts:8132 z .potential nietknięty); (2) blokada oblężenia w zakresie computePath liczona z listy obleganych miast (siegeScopeMemo); (3) ownPlayerVisibleHexes używa memo dysków widoczności (visibleDiskKeys, klucz map.hexes, <=3000 wpisów, ta sama kolejność wstawiania).
- gra/src/units/setup.ts: siegeScopeMemo (czyszczone razem z siegeScopeCache).
- gra/src/game/okolica.ts: Intl.Collator zamiast localeCompare (tie-break w assignWorkedTiles, ~385 ms self); memo computeLostToNearerSiblingByCity porównywane pole po polu zamiast napisu-sygnatury (~205 ms).
- NOWE: gra/tools/perf-endturn-r3-equiv-test.cjs; harness: flaga PERF_BUILD_ONLY. Zero zmian w render/, gra/data, WERSJE.md, rust-port, src-tauri.
PROFIL (CDP, evidence/profile-top15.txt): baza tura 1 JS 7250 ms: runAiPhase 4411 incl, decideAITurn 1284, syncUnitsRender 1351 (render, poza allowlistą), empireActiveResourceLabels 660, computePath 655, syncStatChips 710, computeVisibleAt 331 self, hexesInCitySight 255, compareScoredOkolicaTiles ~385 (profil DEEP), besiegedCityAtHex ~333. Po zmianach: wszystkie te pozycje poza top-15 / obniżone (computePath 655->~310, empireActiveResourceLabels poza top). Zostaje: render/HUD (syncUnitsRender ~760, renderLoop ~720, syncStatChips ~490, updateMatrixWorld ~216 — render/ wykluczony: KANDYDAT NA OSOBNY TEMAT, razem ~2 s), assignWorkedTiles ~434 incl (okolicaTiles), decideAITurn ~809.
POMIAR A/B/A/B/A/B (3 przebiegi procesu na stronę, każdy 3 tury EOT = n=9 na stronę; SwiftShader, host współdzielony, load 3,9–9,6, zapisane w scratchpad ab-*.load):
- JS ms (CDP): baza min 4512 / med 5693 / max 7250; kandydat min 3947 / med 4571 / max 5024. Stosunek median = 1,25x. Pary tur: 1,03–1,67x (rozrzut duży przez load).
- Wall ms: baza med 23835 (17225–26925); kandydat med 20105 (17890–21756).
Cel 2x: NIEOSIĄGNIĘTY. Dominujący pozostały koszt to render/HUD (render/ wykluczony) i bazowa logika AI.
TESTY (logi w runs/.../gate-*-r3.txt, z EXIT=):
- tsc --noEmit EXIT=0; logic-test 213/213 EXIT=0; ai-test 274 passed / 20 failed (= baza, te same; EXIT=1 jak baza).
- gate-equiv-r3.txt PASS: collator vs localeCompare 23994 par 0 różnic; assignWorkedTiles 220 stanów 0 różnic; computeLostToNearerSibling 1320 wywołań (trafienia/zmiana pop/owner/kolejność) 0 różnic; computePath+computeReachable 240 stanów (memo oblężenia vs pełna lista) 0 różnic. Prawdziwe funkcje przez esbuild, baza = git show HEAD. Mutacje WYKRYTE: odwrócony tie-break (191 różnic), memo ignoruje ownerId (440), ignoruje promień (163), pusta lista obleganych (229).
- Regresje (87 testów resource*/deposit*/diplomacy*/trade-*/okolica*/war-allin*/building-resource*/ai-resource*/turn-economy*): kandydat 15 nonzero, baza (src cofnięte) 15 nonzero, te same pliki i te same komunikaty (różnią się tylko PID w ścieżkach tmp; war-allin hash 6b "got" identyczny d28c8b7ffce7a3ec) — gate-regr-r3.txt, gate-regr-base-r3.txt. 4 testy live (vite) padają na obu (infra).
NIE_ZMIERZONO: dynamiczny test równoważności visibleDiskKeys (w main.ts, nie headless; logika = tablica kluczy w kolejności iteracji Set computeVisibleAt, memo po map.hexes jak siblingMemoByMap) — pokryty pośrednio: harness EOT i ai-test bez regresji, brak hashu stanu gry baza vs kandydat w harnessie. Zapis stanu dużej gry do pliku: niezrealizowany (stan seedowany deterministycznie seedem 1412026 w każdym przebiegu).
BLOKADY: brak. Uwaga: sprzątanie /tmp/civ-*-live-* po testach live odrzucone przez klasyfikator (współdzielony /tmp) — zostały 4 katalogi tymczasowe testów live; build harnessu w scratchpadzie (cand/, base/ ~75 MB każdy).
RUNDY: 3/5
NASTĘPNY KROK: Evaluator -> Final Control; decyzja orkiestratora: przyjąć PASS-WITH-NOTES (1,25x) albo osobny temat na render/HUD końca tury (syncUnitsRender, syncStatChips, renderLoop ~2 s z ~4,6 s JS kandydata).
DEPLOY/PUSH: NIE WYKONANO
