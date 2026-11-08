STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PANGEA-LAND-FRACTION-OTHER-Q1
GOAL: Pangea ma dawac faktyczny udzial ladu w +-2 pp deklaracji dla 30-70% (20% w +-3 pp), bez zmiany hashy Kontynenty/Wyspy/Ziemia i bez regresu Pangea 60%.

## Pomiar (srednia z 3 ziaren 1/42/99, rzeki off; surowe: `before-*.txt`, `after-*.txt`)
| deklarowany | Maly przed -> po | Standardowy przed -> po |
|---|---|---|
| 20% | 11,4 -> 20,0 | 10,9 -> 20,0 |
| 30% | 17,0 -> 30,0 | 15,4 -> 30,0 |
| 40% | 34,8 -> 40,0 | 34,5 -> 40,0 |
| 50% | 43,4 -> 50,0 | 45,1 -> 50,0 |
| 60% | 57,4 -> 60,0 | 59,4 -> 59,4 (bajt-w-bajt) |
| 70% | 65,8 -> 66,4 (NIE spelnia) | 69,4 -> 69,4 (bajt-w-bajt) |

## Przyczyna (zmierzone: `pangea-land-other-stages.cjs`, Standardowy seed 42)
- Baza maski daje malo: 30% -> 13,56% suchego ladu przed dosypaniem (etap 08), 50% -> 40,40%, 60% -> 55,72% (cel 30/50/60).
- `topUpPangeaLandFraction` (`gra/src/map/gen-helpers.ts` ~3705) rosnie 1 warstwa/runde tylko z kandydatow o >= 3 suchych sasiadach: 28-101 kandydatow/runde (log DBGTOP), `maxRounds=12` konczy sie daleko przed celem (30%: 2734 -> 3271 z 6048). Generator bazowy tez zanizal (mask), ale go nie ruszano, by zachowac 60% Standardowy.

## Poprawka (ZMIANY)
`gra/src/map/gen-helpers.ts` (tylko `topUpPangeaLandFraction` + 2 stale): FAZA 2 uruchamiana gdy po fazie 1 niedobor > 1,5% heksow mapy: dylatacja brzegu warstwa po warstwie (>= 2, w ostatecznosci >= 1 suchy sasiad), kolejnosc: wynik maski, potem odleglosc od srodka (zwarty obrys), do celu, max 200 rund; margines/bufor szerokosci jak w fazie 1. Przy niedoborze <= 1,5% nie robi nic -> Pangea Standardowy 60%/70% bajt-w-bajt (hashe `pangea-hash-base.txt` == gate-determinism: ecdcc4aa/8d345ea7/5da29363/a5dcd09e). `generator.ts`, `map-gen-params.json`, `newGameMapDefaults.ts` BEZ zmian. Narzedzia nowe: `gra/tools/pangea-land-other-measure.cjs`, `pangea-land-other-stages.cjs`.

## Testy (logi `gate-*.txt`)
- determinism: hashe Kontynenty/Wyspy/Ziemia (4 ziarna) identyczne, Pangea 59-61% — EXIT=0
- pangea-land-fraction (20/50/80%) 3/3 PASS — EXIT=0; capital-sep-pangea 3/3 — EXIT=0; cluster-spread 5/5 — EXIT=0; ai-city-yield 42 PASS/0 FAIL — EXIT=0
- ai-avoid-polar-player-parity: PARITY same=30/30 maxDist=0 BEZ regeneracji `BASE` (nie bylo potrzeby) — EXIT=0
- `tsc --noEmit` czysty — EXIT=0
- measure Standardowy: PASS (EXIT=0); measure Maly: EXIT=1 tylko przez 70%.
- map-gen-regression: NIE_ZMIERZONO do konca (test rzek, >24 min w tym srodowisku; czesc czasow: mala 61 s, standard 318 s, duza 787 s, wyliczone przez rzeki, nie ladu). Do ponowienia przez Evaluatora.

## BLOKADY / ZALOZENIA
- Maly 70%: sufit strukturalny ~66,4% (wnetrze poza strefa brzegowa d<=10 i buforem szerokosci; pierscienie marginesu juz ponad capami `marginLandCapForBorderDistance`). Osiagniecie 68-72% wymagaloby zmiany polityki marginesu (poza allowlista, dotyka innych typow) -> ZALOZENIE: nie ruszano; wymaga decyzji orkiestratora.
- Maly 60%: mapa zmieniona celowo (57,4 -> 60,0); Standardowy 60% bez zmian.
- Wizualnej weryfikacji ksztaltu (przegladarka) nie wykonano: NIE_ZMIERZONO; 1 masa ladu w audycie etapow (masses=1).

## RUNDY: 1/5
## NASTEPNY KROK: Evaluator (powtorzyc map-gen-regression, ocena ksztaltu Pangea 20/30% i decyzja ws. Maly 70%).
## DEPLOY/PUSH: NIE WYKONANO
## COMMIT: patrz SHA w odpowiedzi (commit zawiera ten raport)
