# POLAR: pomiar PRZED/PO metryk mapy „kontynenty” (R-WEB-MAP-POLAR-COMPARE-Q1)

Data: 2026-11-25. Operator: Haiku 5.5, runda 1/5. Bez deployu, bez zmian w `gra/src` i `gra/data`.

- **PO (kandydat):** `c93090bc5` (origin/POLAR-ON-MAIN-wip, merge FC polaru na main).
- **PRZED (baza):** `6fe46acef` (pierwszy rodzic kandydata = main bez polaru).
- **Skrypt pomiarowy:** `gra/tools/polar-before-after-measure.cjs` (nowy, jedyny zmieniony plik w repo).
- **Dane:** `dyspozycje/autobot/runs/R-WEB-MAP-POLAR-COMPARE-Q1/dane/` (`PRZED-kontynenty.jsonl.gz`, `PO-kontynenty.jsonl.gz`, `compare-PRZED-PO.md`, `SHA256SUMS.txt`).

## 1. Zakres pomiaru

- Typ: `kontynenty` (jedyny dotknięty polarą; `ziemia`, `wyspy`, `pangea` nie są mierzone).
- Rozmiary: `malenki`, `maly`, `standardowy` (bez `superogromny`).
- Seedy: 1, 7, 42, 99, 4242. Razem 15 map na każdą wersję.
- Ustawienia: `worldDensity` rivers/forest/desert/relief = medium (jak w `map-polar-continents-test`), `landFraction` = domyślny cel typu (0,30). Przebieg bez jawnego `landFraction` dał te same wyniki dla polara i brzegu (sprawdzone na malenki/42).
- Każdy bieg w osobnym wywołaniu, sekwencyjnie, bez równoległości. Dane zapisywano na bieżąco, więc przerwany bieg nie tracił seedów.

## 2. Mapowanie metryk na ciężkie testy

| Test (`gra/tools/*-test.cjs`) | Niezmiennik | Metryka w skrypcie |
|---|---|---|
| land-sea-ratio | udział lądu vs cel, tol. 0,04 | `landDev` |
| stranded-land | brak lądu w otwartym oceanie, brak pustyni w oceanie | `specks`, `pustOcean` |
| map-coast-buffer | brak lądu przy morzu, brak morza w lądzie, bufor brzegu mapy | `dryTouchSea`, `inlandSea`, `inlandWater`, `borderLand` |
| map-polar-continents | Polarny > 0, sufit 600 | `polar`, `polarBand` (info) |
| map-continents-rivers | liczba mas lądu, rzeki | `masses`, `sea`, `riverPaths`, `riverLen` (info) |
| map-gen-regression | ujścia rzek, czas generacji (limit 7 s, WARN) | `badOutlet`, `badReal`, `ms` |
| deposit-coast | brak złóż na wodzie/wybrzeżu | `depositsOnWater` |
| relief-grid-coverage | pokrycie siatki żelaza/miedzi ≥85% dla mas ≥150 | `ironFail`, `copperFail` |
| world-density | bydło/owce nie na Górach; liczby zasobów | `livestockGory` (+ info: `forest`, `desert`, `hills`) |

Ciężkie testy nie były uruchamiane w całości. Skrypt odtwarza ich metryki na generatorze. Patrz sekcja 6.

## 3. Wyniki: tabela PRZED / PO (per rozmiar × seed)

| rozmiar | seed | landDev | specks | borderLand | inlandSea | polar | badOutlet | depWater | ironFail | copperFail | masses | riverPaths | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| malenki | 1 | 0,0001 / 0,0001 | 0 / 0 | 55 / 70 | 12 / 15 | 0 / 42 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 3 / 6 | 58 / 61 | 6873 / 8196 |
| malenki | 7 | 0,0001 / 0,0004 | 2 / 0 | 58 / 66 | 0 / 20 | 36 / 39 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 15 / 7 | 70 / 68 | 3439 / 2859 |
| malenki | 42 | 0,0001 / 0,0001 | 0 / 0 | 81 / 85 | 0 / 0 | 0 / 57 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 6 / 8 | 60 / 63 | 3318 / 3439 |
| malenki | 99 | 0,0001 / 0,0009 | 4 / 0 | 47 / 47 | 9 / 9 | 28 / 28 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 21 / 17 | 75 / 74 | 3679 / 3510 |
| malenki | 4242 | 0,0001 / 0,0001 | 0 / 0 | 71 / 65 | 2 / 1 | 0 / 41 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 2 / 5 | 46 / 68 | 3101 / 3483 |
| maly | 1 | 0,0001 / 0,0001 | 1 / 0 | 24 / 54 | 87 / 10 | 0 / 102 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 8 / 11 | 104 / 114 | 7371 / 7576 |
| maly | 7 | 0,0001 / 0,0002 | 0 / 0 | 10 / 37 | 58 / 148 | 0 / 115 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 11 / 20 | 107 / 111 | 8557 / 8445 |
| maly | 42 | 0,0001 / 0,0001 | 0 / 0 | 28 / 56 | 42 / 11 | 0 / 147 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 10 / 11 | 113 / 112 | 6744 / 9025 |
| maly | 99 | 0,0001 / 0,0001 | 0 / 0 | 25 / 53 | 43 / 71 | 0 / 77 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 15 / 20 | 120 / 114 | 8370 / 11394 |
| maly | 4242 | 0,0001 / 0,0001 | 0 / 0 | 25 / 47 | 35 / 0 | 0 / 104 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 6 / 14 | 119 / 126 | 6217 / 9035 |
| standardowy | 1 | 0,0000 / 0,0001 | 0 / 0 | 60 / 42 | 483 / 730 | 0 / 387 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 13 / 24 | 229 / 249 | 110012 / 137381 |
| standardowy | 7 | 0,0000 / 0,0000 | 0 / 0 | 41 / 84 | 1089 / 1121 | 0 / 402 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 13 / 29 | 214 / 246 | 42294 / 66290 |
| standardowy | 42 | 0,0000 / 0,0001 | 0 / 0 | 44 / 26 | 960 / 927 | 0 / 404 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 11 / 22 | 215 / 229 | 60187 / 73268 |
| standardowy | 99 | 0,0000 / 0,0001 | 0 / 0 | 111 / 63 | 801 / 1082 | 0 / 381 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 12 / 29 | 231 / 251 | 48998 / 143942 |
| standardowy | 4242 | 0,0000 / 0,0000 | 1 / 0 | 57 / 42 | 457 / 833 | 0 / 371 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 13 / 22 | 235 / 247 | 59113 / 58840 |

Zbiorczo (suma PRZED / suma PO; średnia Δ = PO−PRZED na parę):

| metryka | PRZED | PO | średnia Δ | max pogorszenie | pogorszone pary | werdykt |
|---|---|---|---|---|---|---|
| landDev (|udział−cel|) | 0,00075 | 0,00224 | +0,0001 | +0,00081 (|dev| ≤ tol 0,04) | 8/15 | BEZ REGRESJI (w tolerancji testu) |
| specks (ląd w oceanie) | 8 | 0 | −0,53 | 0 | 0/15 | BEZ REGRESJI |
| pustOcean | 0 | 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| dryTouchSea (bufor wybrzeża) | 0 | 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| inlandWater | 0 | 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| borderLand (ląd w buforze brzegu mapy) | 737 | 837 | +6,7 | +43 (standardowy 7) | 9/15 | REGRESJA kierunkowa; baza też łamie asercję (sekcja 4) |
| inlandSea (morze w środku lądu) | 4078 | 4978 | +60 | +376 (standardowy 4242) | 8/15 | REGRESJA kierunkowa, bez asercji testu (sekcja 4) |
| polar (heksy Polarny) | 64 | 2697 | +175,5 | n/d (wzrost) | 14/15 wzrost | BEZ REGRESJI: PO > 0 i ≤ sufit 600 we wszystkich 15 mapach |
| badOutlet / badReal | 0 / 0 | 0 / 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| depositsOnWater | 0 | 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| ironFail / copperFail (masy ≥150) | 0 / 0 | 0 / 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| livestockGory | 0 | 0 | 0 | 0 | 0/15 | BEZ REGRESJI |
| masses, sea, riverPaths, riverLen, riverHexes, forest, desert, hills | info | info | mieszane | n/d | n/d | INFO (bez asercji) |
| ms (czas generacji, suma) | 378 273 | 546 683 | | | | INFO, NIE ZMIERZONO czysto (sekcja 5) |

Uwaga do `polar`: w PRZED zero heksów Polarny na 13 z 15 map (zgodnie z MAP-POLAR-ZERO). PO daje 28–404 heksów na każdej mapie, czyli mieści się w sufitach testu (≤600).

## 4. Dwie metryki z wynikiem „REGRESJA kierunkowa”

**borderLand (ląd w buforze brzegu mapy).** Asercja `map-coast-buffer-test` wymaga zera. Ta asercja nie jest spełniona ani w PRZED, ani w PO:
- PRZED: od 10 do 111 heksów na każdej z 15 map. Zero nie osiąga żadna mapa.
- PO: od 26 do 85 heksów. Również zero nie osiąga żadna mapa.
- Oficjalny `map-coast-buffer-test.cjs` uruchomiony na kandydacie (`c93090bc5`) zgłasza `FAIL: ląd w buforze brzegu` dla wszystkich typów i seedów, które zdążył wykonać, zanim limit czasu (580 s) go przerwał: kontynenty, pangea, wyspy, ziemia, oraz `generujSwiat` malenki/maly/standardowy. Log zapisany tylko w scratchpadzie sesji (nie w repo). Pełny wynik testu NIE ZMIERZONO (przerwany).
- Wniosek: ta asercja była czerwona już w bazie (na podstawie metryki PRZED), a PO nie naprawia jej i pogarsza liczby w 9 z 15 map (średnio +6,7 heksu). Ocena, czy to blokuje deploy, należy do orkiestratora.

**inlandSea (morze w środku lądu).** Testy nie mają asercji tej metryki dla `generujSwiat` (asercja `findInlandSeaHexes` dotyczy tylko `generateMap` 54×37, a ta przeszła w teście oficjalnym). Zmiana jest mieszana w znaku: PO > PRZED na 8 z 15, ale na malenki/maly bywa w obie strony. Na standardowym PO > PRZED na 4 z 5 seedów (+376 na seed 4242). W sumie 4078 → 4978. Jest to regresja wg kierunku, ale nie łamie żadnej istniejącej asercji.

## 5. Czas

- Pomiary były sekwencyjne, ale nie izolowane. W tym czasie na hoście pracowały inne sesje. Liczby ms dla standardowego (PRZED 39–110 s, PO 58–144 s) służą tylko jako orientacja.
- Test `map-gen-regression` ma limit 7 s na standardowy. Obie wersje go przekraczają na tej maszynie. Test daje WARN, nie FAIL. Czasu nie oceniam jako regresji polara.

## 6. Co NIE zostało zmierzone

- Pełne uruchomienie ciężkich testów: land-sea-ratio, stranded-land, map-gen-regression, map-continents-rivers, relief-grid-coverage, world-density, deposit-coast, map-coast-buffer. Dispatch zabrania uruchamiania pełnych ciężkich testów. Metryki odtworzono skryptem. Oficjalny `map-coast-buffer-test` uruchomiono tylko na kandydacie i przerwano po 580 s.
- Typy `ziemia`, `wyspy`, `pangea`, `superogromny`.
- Metryki wizualne i rozgrywkowe (wybrzeże, Antarktyda w grze).

## 7. Bramki (kod gry bez zmian, sprawdzone na kandydacie)

- `tsc --noEmit` w `gra/`: exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/ai-test.cjs`: ai-test: 297 passed, 0 failed.
- `map-polar-continents-test.cjs` (uruchomiony na kandydacie, pełny): PASS (polar 387/402/404/371 dla seedów 1/7/42/4242, malenki/42 = 57, ziemia/42 = 0).

## 8. Dane i integralność

| plik | SHA256 |
|---|---|
| `dane/PRZED-kontynenty.jsonl.gz` | e226dc623bd1d60276b539fdeb382d5c20d177d5ed0901957f3efa178b5dcb6c |
| `dane/PO-kontynenty.jsonl.gz` | 1a225b0823df024e68c9bb9a32c7894d130c1cedda200a82f7692847161ecc10 |
| `dane/compare-PRZED-PO.md` | 0a332be83debdb7c1c3a7c710f052671671930bb0218be987a6559ee8e233e4e |

Odtworzenie: `node gra/tools/polar-before-after-measure.cjs run --gra <gra> --tree <nazwa> --out <plik>` (wymaga `ESBUILD_MODULE`), a porównanie: `... compare PRZED.jsonl PO.jsonl`.

## 9. Wnioski dla orkiestratora (bez decyzji po stronie Operatora)

1. Polar działa zgodnie z celem: pas polarny jest w każdej mapie kontynentów (PRZED zero na 13/15), a sufit testu jest zachowany. Test `map-polar-continents-test` przechodzi.
2. Bez dodatkowych regresji w stranded, buforze wybrzeża (dryTouchSea, inlandWater), ujściach rzek, złożach, reliefie i udziale lądu.
3. Dwie metryki rosną: `borderLand` (+ w 9/15, asercja czerwona już w bazie) i `inlandSea` (+ w 8/15, bez asercji). Decyzja o deployu należy do właściciela lub FC: czy traktować je jako blokadę, czy jako dług z innego tematu.
