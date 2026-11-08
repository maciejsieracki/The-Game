STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PANGEA-LAND-FRACTION-Q1
GOAL: Pangea przy deklarowanym 60% lądu daje 59-61% (było 56,0-56,2%), bez zmiany Kontynentów/Wysp/Ziemi.

## Przyczyna (zmierzona, 6 ziaren, standard 168x120, 20160 hex; `gate-stage-after.txt`, narzędzie `gra/tools/pangea-land-stage-diag.cjs`)
Pomiar liczy ląd tak jak generator (`countLandSeaHexes`, Wybrzeże = woda) - pomiar nie jest przyczyną.
Udział suchego lądu per etap (seed 42): mask 42,4 -> rebalance1 51,0 -> rebalance2 47,5 -> thickenCoast 51,5 -> enforceLandPct 53,5 -> ensure_A 55,7 -> finalize/ensure_B/rzeki 55,7 (rzeki NIE zmieniają lądu).
Pozostałe ziarna: rebalance1 50,8-51,2; enforceLandPct 53,4-53,8; końcowo 55,4-56,4.
Przyczyna: `applyLandFractionByScore(..., 'mask', fillMin)` (gen-helpers.ts, filtr `landScores >= minMaskFillScore`, fillMin = 0.03+t*0.08) wyczerpuje kandydatów maski ~7-9 pp przed celem 60%; kolejne etapy (enforceLandPct) mają ten sam próg, więc tylko mosty `ensurePangeaSingleContinent` dokładają ~2 pp. Stały deficyt ~4 pp = próg maski, nie rzeki/wybrzeże.

## Poprawka
`topUpPangeaLandFraction` (gen-helpers.ts, nowa funkcja) wołana w generator.ts po `08_po_ensure_B`, przed `applyCoastRing`: dosypuje ląd tylko przy istniejącym lądzie (>=3 suchych sąsiadów, brak nowych wysp/korytarzy), warstwami wg wyniku maski, z pominięciem marginesu mapy i bufora szerokościowego. Tylko ścieżka `typ==='pangea'`.

## Wyniki (Pangea 60%, standard, bez rzek dla hashy; 6 ziaren z rzekami: FINAL)
seed 42: 59,15 | 99: 59,68 | 2026: 59,95 | 7777: 59,67 | 1: 59,49 | 7: 59,37 (przed: 55,4-56,4). Wszystkie w 59-61%.
Determinizm innych typów: hash sha256 `hexes` Kontynenty/Wyspy/Ziemia x ziarna 1,42,99,7777 (rzeki wyłączone) IDENTYCZNE przed/po (`gate-det-before.txt` vs `gate-det-after.txt`; Kontynenty 30,00%, Wyspy 50,00%). Hashe Pangei zmieniają się celowo (mapy istniejących ziaren Pangei będą inne - ROBOCZA).

## TESTY (EXIT=0 != PASS; wynik merytoryczny)
- tsc --noEmit: czysto (`gate-tsc.txt`).
- capital-sep-pangea-test: 3 passed, 0 failed.
- cluster-spread-test: 5 passed, 0 failed.
- cluster-start-recovery2-test: 29 passed, 0 failed.
- ai-avoid-polar-pick: 16 passed; -plan: onPolar=0; -sim: 15 runów, onPolar=0.
- ai-avoid-polar-player-parity-test: FAIL (EXIT=1), PARITY same=20/30. Wszystkie 10 odchyleń to mapy PANGEA (pangea4242 ... pangea5555), 20 map Kontynenty/Wyspy identyczne. To fixture startów gracza zmierzony na starych mapach Pangei - oczekiwana konsekwencja zmiany map Pangei (dopuszczona w dispatchu), nie regresja AI. Nie mogłem przegenerować fixture (plik poza allowlistą). Czy test przechodzi na bazie: NIE_ZMIERZONO (wniosek z rozkładu odchyleń).
- Weryfikacja wizualna w przeglądarce: NIE_ZMIERZONO (brak w zakresie; jakość jednej masy sprawdzona testami capital-sep/cluster-spread; singleContinent wymuszany po top-upie przez istniejące etapy 09).

## ZMIANY/COMMIT
028753fa9 (gen-helpers.ts, generator.ts, tools/pangea-land-stage-diag.cjs, tools/pangea-land-determinism-test.cjs, katalog runu). Zero zmian w clusters.ts, ai.ts, gra-robocza, WERSJE.md, rust-port.
BLOKADY: ai-avoid-polar-player-parity-test wymaga przegenerowania fixture Pangei (poza allowlistą) - do decyzji orkiestratora/Evaluatora (dodatkowa allowlista lub osobny temat).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (niezależny pomiar 59-61% + hash innych typów + ocena fixture parity).
DEPLOY/PUSH: NIE WYKONANO
