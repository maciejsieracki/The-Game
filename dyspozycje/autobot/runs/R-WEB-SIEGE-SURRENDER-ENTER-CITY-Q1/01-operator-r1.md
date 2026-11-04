STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-SURRENDER-ENTER-CITY-Q1
GOAL: po kapitulacji obleganego miasta oblegająca armia wchodzi na heks miasta (staje się garnizonem), zamiast stać pod nim.

## POMIAR PRZED (plik:linia, baza origin/main c4a541a27)
- `resolveSiegeSurrender` (`gra/src/main.ts` ~16177): po zmianie właściciela usuwa obrońców starego właściciela z heksu miasta (`units.splice`), `syncCityGarnizon`, potem `endMapSiege` (~16394) kasuje `oblegaCityId` wszystkich oblegających. Oblegający zostawali na heksie sąsiednim (dist 1, `ruchLeft=0` z `commitBesiege`) -- BŁĄD z zgłoszenia.
- Wejście zdobywcy istnieje tylko dla szturmu/pustego miasta: `applyCityCaptureAfterBattle` (`gra/src/game/post-battle-map.ts` ~465) przesuwa kotwicę i współstos niecywilny na heks miasta. Kapitulacja go NIE wołała (osobna ścieżka). `capital-capture.ts` -- bez zmian (nie dotyczy ruchu jednostek).
- Jedyna ścieżka kapitulacji: oba wywołania ticku (~35996/35998) idą do `resolveSiegeSurrender`. Pozostałe sceny (gracz/AI/AI-AI/barbarzyńcy) przechodzą tą samą funkcją; brak rozgałęzień po ownerId.
- Kolejność ticków: `oblegane=true` w chwili wejścia; wejście to teleport (nie pathfinding), więc blokada wejścia z R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1 jej nie dotyka.

## ZMIANY / COMMIT
- NOWY `gra/src/game/siege-enter-city.ts` (czysty moduł: `planSurrenderEntry`, `enterCityAfterSurrender`).
- `gra/src/main.ts` (+7 linii): import + jedno wywołanie w `resolveSiegeSurrender` PO `city.ownerId=newOwner` i usunięciu obrońców, PRZED `syncCityGarnizon`/`endMapSiege`; jeśli zaznaczona jednostka weszła -- `unitRenderer.setSelectionHex` na heks miasta (bez zmiany zaznaczenia/kamery dla tur AI).
- NOWY test `gra/tools/siege-surrender-enter-city-test.cjs`.
- Logi: `gate-new-test.txt`, `gate-tsc.txt`, `gate-regress-after.txt` w katalogu runu.
- Commit SHA: patrz niżej (uzupełniony po commicie w wiadomości zwrotnej).

## ZAŁOŻENIA (bez ABC)
Z1 gracz/AI/barbarzyńcy jednakowo. Z2 wchodzi JEDEN stos: największy (liczba jednostek niecywilnych), remis -> stos z generałem, dalej najmniejsze id; pozostałe stosy zostają na heksach (bez łączenia -- brak ryzyka naruszenia limitu stosu). Z3 bez kosztu ruchu i bez walki, `ruchLeft` bez zmian; zdjęcie `inGarnizon` i `ufortyfikowanyWPolu`. Z4 obca jednostka na heksie miasta blokuje wejście (po kapitulacji obrońcy starego właściciela są usunięci, więc praktycznie nie występuje). Z5 machiny oblężnicze wchodzą (jak przy szturmie, są niecywilne); cywile i zaokrętowani zostają. Zasady kapitulacji (-1 obywatel, łupy, nazwa, właściciel) bez zmian. Rozmiar garnizonu liczy `syncCityGarnizon` po wejściu.

## TESTY
- `node tools/siege-surrender-enter-city-test.cjs`: 28 OK / 0 FAIL (RED = stan sprzed tematu stoi pod miastem; GREEN gracz/AI/barbarzyńca; wiele stosów; remisy i determinizm; machiny/cywile/zaokrętowani; obca jednostka; 9 mutacji, każda wywraca baterię; strukturalna kolejność w main.ts).
- tsc `--noEmit`: EXIT=0.
- Regresje (27 testów siege/oblez/capture/garrison/militia, `--no-live`): wszystkie EXIT=0 poza dwoma, IDENTYCZNIE czerwonymi na bazie origin/main bez mojej zmiany (zmierzone): `barb-city-capture-cluster-test.cjs` (3 FAIL strukturalne 1d/1f, sprawdzenia tekstu main.ts niezwiązane z kapitulacją) i `siege-tower-breach-everywhere-test.cjs` (timeout 124 również na bazie). Dług poprzedzający temat, NIE regresja.
- Chromium `?civTest=1` (żywa kapitulacja w przeglądarce): NIE_ZMIERZONO (brak vite build w dyspozycji czasowej tej rundy; logika pokryta testem silnikowym na realnym module + test strukturalny kolejności). Zapis/odczyt: pozycja jednostki jest zwykłym `q,r` w `units`, brak nowych pól stanu -- NIE_ZMIERZONO na żywo.

## BLOKADY
Brak. Uwaga dla Evaluatora: żywa weryfikacja w przeglądarce niewykonana; dwa czerwone testy bazowe poza zakresem. Równoległy R-WEB-SIEGE-BADGE-TURNS-TO-SURRENDER-Q1 -- brak konfliktu (nie dotykam logiki kapitulacji poza wstawką), w razie merge zderzenie możliwe tylko w sąsiedztwie `resolveSiegeSurrender`.

## RUNDY
1/5
## NASTĘPNY KROK
Evaluator R1 (opcjonalnie dodać test Chromium `?civTest=1`).
## DEPLOY/PUSH: NIE WYKONANO
Po wdrożeniu: REPIN Rust (kapitulacja/oblężenie) zanotuje orkiestrator.
