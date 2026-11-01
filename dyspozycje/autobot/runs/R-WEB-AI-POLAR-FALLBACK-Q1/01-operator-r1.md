STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-POLAR-FALLBACK-Q1
GOAL: AI w ekspansji nie zakłada miasta na heksie polarnym jako ostatni fallback; Pangea 1001 po 30 turach 0 miast AI na polarnym.

## (1) Przyczyna źródłowa (zmierzona w żywej grze)
Bundle ROBOCZA `83f64d3f` skopiowany do scratchpadu i zinstrumentowany (`live-diag-patch.py.txt`: tylko liczniki + log w gałęzi fallback; repo i `gra-robocza/` nietknięte). Pangea 1001, żywa gra, log przy `egipt#22@61,108`, tura 24:
`{land:10377, excl:0, close:1407, reach:8736, lowscore:234, pass:0, maxLow:-5.76, polarLand:169, minScore:3, minDist:4, myCities:8, clusterCenter:(62,103), clusterRadius:5, bestPolarScore:60}`.
- Heksy niepolarne: 1407 odpada na separacji (`ai.ts` pętla `tooClose`), 8736 na twardym wymogu `isHexWithinAnyCityReach` (zasięg własnych miast/fortów), a **wszystkie 234 w zasięgu mają wynik < `ekspansja_min_score_hex`=3 (najlepszy −5,76)** -> `pass:0`. Źródło odrzucenia to próg minScore (`ai.ts` `if (score < minScore) continue`), nie zasięg wyszukiwania.
- Heks polarny dostał 60, bo bonus klastra `+50*ekspansjaScale` (`ai.ts` blok `clusterCenter`) stosuje się też do polarnego, a polarny omija nie tylko ranking, ale w praktyce i próg (przy +50 przechodzi minScore). Gałąź `bestHex === null && bestPolarHex !== null` (`ai.ts` ok. 4883) zwróciła go jako fallback.
- Wniosek: zasięg nie jest za wąski (234 kandydatów w zasięgu istnieje, ale poniżej progu jakości). Rozszerzanie wyszukiwania niepolarnego nie ma tu zastosowania; właściwa poprawka = `null`.

## (2) Poprawka
`gra/src/game/ai.ts` (`findCityFoundingHex`, tylko końcówka): fallback na polarny dozwolony WYŁĄCZNIE gdy AI nie ma żadnego własnego miasta (`hexOpts.myCities` puste = pierwsze miasto; mapa cała polarna, inaczej AI nie zaistnieje, zachowane P4 z `ai-avoid-polar-pick-test.cjs`). W ekspansji (>=1 własne miasto) brak kandydata niepolarnego ponad progiem -> `null`. Założenie (luka rozstrzygnięta bez ABC): jedyny wywołujący (`ai.ts:2917`) zawsze przekazuje `myCities`. Zero nowych kluczy, zero zmian w `clusters.ts`/generatorze.

## Pomiar (żywa gra, bundle ROBOCZA + patch POST `live-post-patch.py.txt`, szczegóły `gate-live-measure.txt`)
| bieg | tura | miasta AI | miasta AI na polarnym | log |
| Pangea 1001 PRE (kontrola) | 31 | 59 | 1 (`egipt#22@61,108`) | polar-fallback |
| Pangea 1001 POST | 31 | 60 | 0 | polar-null x6 (T25-31) |
| Pangea 4242 POST | 51 | 83 | 0 | brak wyzwolenia |
| Kontynenty 4242 POST | 51 | 78 | 0 | brak wyzwolenia |
| Wyspy 1001 POST | 31 | 60 | 0 | brak wyzwolenia |
| Wyspy 3333 POST | 31 | 61 | 0 | brak wyzwolenia |
Wpływ na liczbę miast: Pangea 1001 59 -> 60 (po rozbieżności; różnica w granicach szumu, polarne 1 -> 0). Biegi bez wyzwolenia gałęzi `null` są bit-w-bit jak PRE (deterministyczne, brak rozbieżności), więc PRE-liczby T50 dla 4242 równe POST (wniosek z determinizmu, osobnego biegu PRE NIE_ZMIERZONO). Powtarzalność w 2 biegach Pangea 1001: NIE_ZMIERZONO osobno (kontrola PRE dała log i polarne miasto zgodnie z T4). T100 oraz próg ekspansji −10…+25%: NIE_ZMIERZONO (koszt biegu; efekt zmiany ogranicza się do rzadkiego przypadku, 1 miasto na ~60).

## (3) Test
Nowy `gra/tools/ai-polar-fallback-test.cjs` (F1-F5): polarny z wysokim wynikiem + niepolarne < minScore -> null; z kandydatem niepolarnym -> niepolarny; pierwsze miasto na mapie całkiem polarnej -> fallback działa; cała polarna z własnym miastem -> null bez logu; bonus klastra na polarnym -> null. Wynik 8/8. Mutacja (przywrócony stary `ai.ts`): 3 FAIL (F1a, F1b, F5) -> test łapie regresję.

## ZMIANY/COMMIT
Allowlista: `gra/src/game/ai.ts`, `gra/tools/ai-polar-fallback-test.cjs`, `dyspozycje/autobot/runs/R-WEB-AI-POLAR-FALLBACK-Q1/**`. SHA: patrz commit na gałęzi worktree (podany w odpowiedzi końcowej; commit zawiera ten raport).

## TESTY
- `gate-tsc.txt`: tsc --noEmit, brak błędów, EXIT=0 (merytorycznie: 0 diagnostyk).
- `gate-polar-tests.txt` + osobne EXIT: pick=0 (16/16), plan=0, parity=0, sim=0, nowy ai-polar-fallback-test=0 (8/8).
- Żywa gra: tabela wyżej.
BLOKADY: brak (jeden bieg Wyspy 3333 w pierwszej próbie padł na `waitAwaitingCity timeout` przy 4 równoległych biegach, powtórzony osobno i zielony).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja zmiany ai.ts:~4883, testu i mutacji; ewentualny dobieg PRE T50/T100 i próg ekspansji).
DEPLOY/PUSH: NIE WYKONANO
