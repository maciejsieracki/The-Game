# Rzeki: poziomy i liczba źródeł — recon (R-WEB-MAP-RIVER-TIERS-RECON-Q1), runda 2 (po obronie)

Baza: origin/main `e70abe718` (ROBOCZA 1953d354, FALA 911). Zero zmian w `gra/**`.
Oznaczenia: ZMIERZONO / NIE ZMIERZONO. Liczby z kodu podane z plik:linia.
Runda 2 koryguje tezę rundy 1 (domyślna faza generacji) i uzupełnia pomiar.

## 0. Korekty względem rundy 1

- **Domyślna faza generacji to `main+medium`, nie `main`.** `gra/src/map/riverGenSwitch.ts:73` (`return 'main+medium'`); `generator.ts:493` (`isRiverGenMainOnly`) jest prawdziwe tylko dla `main`. Runda 1 błędnie napisała „domyślnie tylko główne”.
- **Domyślnie generowane są też dopływy (`tributary`)**, nie tylko średnie. Dwa miejsca powstania (`gen-helpers.ts:11861` `pushTributary` i `11873` `pushMedium`) leżą PRZED bramką `if (!isRiverGenFull()) return` (`gen-helpers.ts:11971`). Bramka blokuje tylko etap 3 (`short`, od `gen-helpers.ts:11888`) i dekoracyjne dopływy od ~12007. ZMIERZONO (pomiar, sekcja 3): domyślnie pojawiają się typy `main`, `medium`, `tributary`; typu `short` nie ma w żadnym z 13 pomiarów.
- **Główna przyczyna, że „rzek jest za mało” w grze, to filtr renderu, nie generator.** `gra/src/render/scene.ts:1539-1546` (`filterRiverPathsForStage`): stage 2 (domyślny, `scene.ts:1511`) dodaje tylko `main` i `medium`. `tributary` i `short` są dodawane dopiero przy stage ≥ 3. Czyli domyślnie gracz nie widzi dopływów, mimo że generator je produkuje (59–146 na mapę, sekcja 3).
- Wniosek poprawiony: „trzeci poziom” nie brakuje w generatorze (`short` istnieje, ale jest zablokowany bramką `all`). Brakuje decyzji właściciela, który typ ma być trzecim poziomem i czy renderować `tributary` domyślnie.

## 1. Reguły historyczne (co ustalono o poziomach)

- **Główny nurt (`main`) i dopływ (`tributary`)** — `docs/obieg/MAPA-RZEKI-SPEC.md` §5 (wpis 2026-07-04, „Maciej: równomierna siatka, krawędzie only, S nie serpentyna, anty‑stada, main/tributary”): główny nurt gruby (100% półszerokości), dopływ **50%** (2× cieńszy), max ~2 dopływy na długi main (≥12 hex), łączy się z main w połowie trasy, generowany PO siatce main.
- **Pokrycie siatki** — MAPA-RZEKI-SPEC §2: „Dopływy nie liczą się do pokrycia siatki”. Min. odstęp źródeł ~`0,8 × N` (N to wartość z tabeli §2 tego specu, patrz sekcja 2 niżej).
- **Trzeci poziom** — w `docs/` i `dyspozycje/` NIE ZNALEZIONO wprost reguły „rzeki trzeciego poziomu” (przeszukanie: `trzeci poziom`, `trzeciego poziomu`, `poziom 3` + rzek, `short` + rzek; NIE PRZESZUKANO jeszcze `docs/archiwum/**` i `docs/decyzje/**` w całości, tylko słowami kluczowymi). Spec z 2026-07-04 zna dwa poziomy. Kod: komentarz `gra/src/map/gen-helpers.ts:8632` — „Etap 1=główne→ocean · 2=średnie→sieć|ocean · 3=krótkie→średnie · tributary=dekoracyjne”; typ `RiverPathKind = 'main' | 'medium' | 'short' | 'tributary'` (gen-helpers.ts:8634). Założenie: „trzeci poziom” = `short` (etap 3). Do potwierdzenia przez właściciela (sekcja 5).
- **Otwarte w dokumentacji:** `MAPA-RZEKI-SPEC.md` §2 podaje N=15 dla tieru „Normalnie”, a `MAPA-FAIR-PLAY-SIATKA.md` opisuje 15×15 jako siatkę WODY. Kod dla siatki rzek (medium) daje 5 (sekcja 2). Czy tabela §2 specu miesza te dwie siatki — NIE ROZSTRZYGNIĘTO (wymaga odczytu dokumentu wdrożenia 20:34, którego nie odczytano).

## 2. Stan kodu — rodzaje rzek i miejsca powstawania

| Rodzaj | Gdzie powstaje | Bramka | Render (stage) |
|---|---|---|---|
| `main` | `generateRivers` (gen-helpers.ts:11790), siatka `mainCell` | zawsze | stage ≥1; szerokość `scene.ts:1323-1324` `min(1.35, 0.85+len·0.008)` |
| `medium` | `pushMedium` (gen-helpers.ts:11873), `traceMediumRiver` (≈9478) | przed bramką (zawsze, także domyślnie) | stage ≥2 (domyślny) |
| `tributary` | `pushTributary` (gen-helpers.ts:11861), `addTributariesForMainRiver` (8537/8586), dekoracyjne ~12007 | przed bramką (zawsze); dekoracyjne pomijane dla Pangei/`largeMapPerf` | **stage ≥3 — domyślnie UKRYTE** (`scene.ts:1546`) |
| `short` | etap 3, `generatePhase3ShortRivers` (od gen-helpers.ts:11888) | tylko `isRiverGenFull()` (`gen-helpers.ts:11971`), czyli `?riverGenPhase=all` | stage ≥3 |

Szerokość renderu dopływów/krótkich (`scene.ts:1325-1328`): `widthMul` 0,4 (<10 hex) / 0,55 (<18) / 0,7 (≥18) względem półszerokości głównej. Poprzednie „do 25% szerokości” z rundy 1 było BEZ ŹRÓDŁA i jest odrzucone. Spec §5 podaje 50% dla dopływa.

Siatka źródeł: `resolveRiverMapParams` (`gra/src/map/newGameMapDefaults.ts:338`), `mainCell = riverGridCellSizeForTier(tier)` (newGameMapDefaults.ts:281-285): **low=10 · medium=5 · high=5**. Fallback bez w,h (`riverCoverageCellSize`, gen-helpers.ts:8600) zwraca 10 dla medium — niespójne z 5 (do wyjaśnienia). `tributaryCell = max(3, round(mainCell·0,5))`. `mainGridStride = 1`.

## 3. Pomiar (runda 2)

Metoda: bundle esbuild generatora (`generateMap`) w scratchpadzie, domyślna faza (brak `location`, więc `main+medium`), tier rzek `medium`, typ `kontynenty`, bez zmian w repo. Lista map: 5 ziaren (1, 7, 42, 99, 2026) × 3 rozmiary z `gra/tools/river-path-adjacency-test.cjs:25-29` = 15 map.

**ZMIERZONO (13 z 15 map):**

| Rozmiar | Seed | main (liczba / hex) | medium | tributary | źródeł main | czas gen. (ms) |
|---|---|---|---|---|---|---|
| 84×60 | 1 | 47 / 425 | 25 / 273 | 8 / 98 | 47 | 10 535 |
| 84×60 | 7 | 40 / 385 | 29 / 301 | 18 / 229 | 40 | 3 957 |
| 84×60 | 42 | 45 / 408 | 16 / 173 | 12 / 142 | 45 | 4 345 |
| 84×60 | 99 | 45 / 417 | 19 / 220 | 13 / 178 | 45 | 3 575 |
| 84×60 | 2026 | 45 / 425 | 22 / 195 | 15 / 180 | 45 | 3 954 |
| 168×120 | 1 | 124 / 1473 | 44 / 549 | 81 / 1285 | 124 | 142 443 |
| 168×120 | 7 | 137 / 1662 | 50 / 711 | 59 / 934 | 137 | 58 503 |
| 168×120 | 42 | 120 / 1423 | 42 / 580 | 67 / 1023 | 120 | 60 849 |
| 168×120 | 99 | 136 / 1681 | 41 / 554 | 74 / 1067 | 136 | 55 009 |
| 168×120 | 2026 | 130 / 1504 | 55 / 763 | 63 / 1047 | 130 | 39 179 |
| 240×168 | 1 | 204 / 2518 | 87 / 1199 | 146 / 2159 | 204 | 219 828 |
| 240×168 | 7 | 213 / 2790 | 94 / 1403 | 119 / 1848 | 213 | 119 238 |
| 240×168 | 42 | 188 / 2574 | 97 / 1377 | 141 / 2119 | 188 | 150 350 |

Typu `short` = 0 we wszystkich 13 mapach (zgodnie z bramką).

**NIE ZMIERZONO (2 mapy):** 240×168 seed 99 i 2026. Powód: po seedzie 42 wolne miejsce na dysku spadło do 0 MB (błąd `Disk full` w `/tmp`), a próg operatora to ≥4 GB; po usunięciu `gra/node_modules` zostało 1,2 GB. Pomiar do dokończenia po zwolnieniu dysku (ok. 2 × 150–220 s).

**Czasy:** ZMIERZONO, ale pojedynczy przebieg bez powtórzeń, na współdzielonej maszynie (wariancja duża: 168×120 seed 1 = 142 s vs seed 7 = 58 s). Traktować jako rząd wielkości.

**Źródła i podwojenie:** ZMIERZONO liczbę startów `main` (= źródeł): 40–47 (84×60), 120–137 (168×120), 188–213 (240×168). NIE ZMIERZONO wpływu zmiany `mainCell` na tę liczbę (nie wykonano wariantu).

**Ścieżka „ile rzek widać”:** ZMIERZONO w kodzie — domyślnie widać `main`+`medium` (stage 2). Na 168×120 seed 42 to 120+42 = 162 widocznych z 229 wygenerowanych (dopływy 67 ukryte).

## 4. Parametry liczby źródeł i podwojenie

- Źródła główne = komórki siatki `mainCell` × 1 start na komórkę (stride 1).
- **Podwojenie źródeł = zmniejszenie boku komórki:** (5/4)² = 1,56× dla boku 4; ×2 wymaga boku ≈ 3,5, który przy całkowitym `Math.floor(q/cellSize)` nie jest osiągalny dokładnie. Alternatywa: zachować bok 5 i dać 2 starty na komórkę (zmiana pętli startów). NIE ZMIERZONO liczby po zmianie — wariant nie wykonany.
- Parametr min. odstępu źródeł `~0,8·N` trzeba przeliczyć przy zmianie boku, inaczej źródła się zlepią (ryzyko „stad”, spec §2).
- Ryzyka (NIE ZMIERZONO, testy nie uruchomione): reguła sąsiedztwa (`river-path-adjacency-test.cjs`), bufor od morza (`river-sea-buffer-test.cjs`), odstęp ujść, wydajność (+12% z RIVMOUTH-wip/fc3, bde050bcf — gałęzi nie odczytano w tym temacie).
- Dla 4 wariantów skutek dla wyglądu różny (gęstość vs. zlepianie) — decyzja właściciela.

## 5. Projekt trzeciego poziomu (warianty do wyboru, skutek dla gracza)

- **Wariant A — pokazać `short` i/lub `tributary` domyślnie:** zmiana `getRiverGenPhase` domyślnie na `all` lub `getRiverRenderStage` domyślnie na 3. Gracz zobaczy dopływy (już generowane, 59–146 na mapę) i krótkie odgałęzienia. Kod istnieje (FALA 174/177). Przeciw: czas generowania rośnie (etap 3, `short`, nie zmierzono), a „trzeci poziom” wciąż byłby tym samym typem co dopływy.
- **Wariant B — nowy czwarty typ (dopływ dopływu):** nowy `kind`, generowany po `tributary`. Za: wyraźna hierarchia główne → boczne → trzeciego poziomu. Przeciw: nowy typ w `types/map.ts`, `scene.ts`, serializacji i testach; trzeba rozstrzygnąć, czy `short` już nie jest tym poziomem.
- Liczby kosztu dla obu wariantów: NIE ZMIERZONO.

Decyzja wymagana (pytanie ABC do właściciela, nie rozstrzyga Operator): (1) czy „trzeci poziom” = `short` (A), czy nowy typ (B); (2) czy dopływy (`tributary`) mają być widoczne domyślnie — to zmiana wyglądu, jest już generowane.

## 6. Testy i piny zmieniane przez (a) trzeci poziom, (b) 2× źródeł, (c) RIVMOUTH-wip/fc3

Lista nazw z `gra/tools/` (istnienie potwierdzone listingiem; zawartości NIE przeczytano poza `river-path-adjacency-test.cjs:25-40`):
- ciężkie: `map-gen-regression-test.cjs`, `river-density-test.cjs`, `river-grid-coverage-test.cjs`, `world-density-test.cjs` (wg REPRO 2026-11-25 ~243 s), `map-continents-rivers-test.cjs`;
- lekkie / sąsiedztwo: `river-path-adjacency-test.cjs` (5 ziaren × 3 rozmiary, `seeds` linia 25, `sizes` 26–30), `river-sea-buffer-test.cjs`, `river-map-scale-test.cjs`, `medium-river-test.cjs`, `river-confluence-edge-test.cjs`, `river-yield-both-sides-test.cjs`, `river-turn-window-test.cjs`;
- diagnostyki (nie bramki): `river-count-quick.cjs` (tylko `main`/hex, tier medium, 168×120), `river-cap-diagnostic.cjs`, `river-density-diag.cjs`.
- (a) trzeci poziom: testy liczące `riverPathKinds` oraz widoczność stage 2 vs 3 (`scene.ts:1539`); (b) 2× źródeł: `river-grid-coverage-test.cjs`, `river-density-test.cjs` (progi pokrycia wg nazw, NIE zweryfikowane progi); (c) RIVMOUTH: `river-confluence-edge-test.cjs`, `river-sea-buffer-test.cjs`.
- Piny/hashe: NIE ZMIERZONO (nie przeszukano `dyspozycje/` pod kątem pinów rzek).

## Binarne kryterium (stan po rundzie 2)
- Pkt 1 (reguły): częściowo — słowa kluczowe przeszukane, `docs/archiwum/**` i `docs/decyzje/**` nie przeczytane w całości. Brak trzeciego poziomu wprost.
- Pkt 2 (kod): TAK, po korekcie sekcji 0.
- Pkt 3 (pomiar): CZĘŚCIOWO — 13 z 15 map ZMIERZONO, 2 NIE ZMIERZONO (dysk).
- Pkt 4: CZĘŚCIOWO — parametry i miejsca wskazane; liczby po podwojeniu NIE ZMIERZONO.
- Pkt 5: warianty z liczbami tylko dla generatora (sekcja 3), koszt NIE ZMIERZONO.
- Pkt 6: nazwy testów TAK, piny NIE ZMIERZONO.
- `gra/**` bez zmian: TAK (`git status` czysty po przywróceniu dwóch śledzonych plików `gra/tools/.river-count*`, usuniętych przypadkowo i przywróconych `git checkout --`).
