# Rzeki: poziomy i liczba źródeł — recon (R-WEB-MAP-RIVER-TIERS-RECON-Q1)

Baza: origin/main `e70abe718` (ROBOCZA 1953d354, FALA 911). Zero zmian w `gra/**`.
Oznaczenia: ZMIERZONO / NIE ZMIERZONO. Liczby z kodu podane z plik:linia.

## 1. Reguły historyczne (co ustalono o poziomach)

- **Główny nurt (`main`) i dopływ (`tributary`)** — `docs/obieg/MAPA-RZEKI-SPEC.md` §5 (wpis 2026-07-04, „Maciej: równomierna siatka, krawędzie only, S nie serpentyna, anty‑stada, main/tributary"): główny nurt gruby (100% półszerokości), dopływ **50%** (2× cieńszy), max ~2 dopływy na długi main (≥12 hex), łączy się z main w połowie trasy, generowany PO siatce main.
- **Pokrycie siatki** — MAPA-RZEKI-SPEC §2: „Dopływy nie liczą się do pokrycia siatki". Min. odstęp źródeł ~`0,8 × N`.
- **Trzeci poziom** — w dokumentach `docs/` i `dyspozycje/` NIE ZNALEZIONO wprost reguły „rzeki trzeciego poziomu" (przeszukanie: `trzeci poziom`, `trzeciego poziomu`, `poziom 3` + rzek, `short` + rzek). Spec z 2026-07-04 zna tylko dwa poziomy. Najbliższa reguła w kodzie: komentarz `gra/src/map/gen-helpers.ts:8632` — „Etap 1=główne→ocean · 2=średnie→sieć|ocean · 3=krótkie→średnie · tributary=dekoracyjne"; typ `RiverPathKind = 'main' | 'medium' | 'short' | 'tributary'` (gen-helpers.ts:8634). Czyli w kodzie „trzeci poziom" = `short` (etap 3), a `medium` jest drugim poziomem. Założenie do potwierdzenia przez właściciela: trzeci poziom to właśnie `short`.
- Wniosek: w specu ani w kodzie nie ma reguły „dwa poziomy → trzy poziomy" zapisanej jako decyzja. Wymaga potwierdzenia (ABC), czy właściciel myśli o `short` czy o nowym, czwartym typie.

## 2. Stan kodu — rodzaje rzek i miejsca powstawania

| Rodzaj | Gdzie powstaje | Szerokość w renderze | Uwagi |
|---|---|---|---|
| `main` | `generateRivers` (gen-helpers.ts:11790), siatka `riverGridCellSizeForTier` | `scene.ts` widthMul 0,85–1,35 | etap 1 |
| `medium` | `traceMediumRiver` (gen-helpers.ts:9478), `mode==='medium'` (9464) | `scene.ts:1313-1316` (trim + mediumRiverRenderPath) | etap 2 |
| `short` | `mode==='short'` (gen-helpers.ts:9434–9462, 10025–10057) | `scene.ts` widthMul 0,4/0,55/0,7 zależnie od długości | etap 3 („trzeci poziom") |
| `tributary` | `addTributariesForMainRiver` (gen-helpers.ts:8586, `riverKinds.push('tributary')`), `traceTributary` (9487) | `scene.ts` 50% (spec §5) | dekoracyjne |

Bramka generacji (kluczowe): `src/map/generator.ts:493-499` i `src/map/riverGenSwitch.ts:76-83`:
- `getRiverGenPhase()` domyślnie **`main`** (`riverGenMainOnly`), pełny tor tylko `?riverGenPhase=all`.
- `gen-helpers.ts:11971`: `if (!isRiverGenFull()) return` — przy domyślnej fazie `main` generator **nie** produkuje `medium`, `short`, `tributary` ani top-upu. Zgodne z wpisem WERSJE.md (FALA 166/167, „Domyślnie tylko główne rzeki").
- Render: `getRiverRenderStage()` (`scene.ts:1517`) domyślnie 2 (main+medium), ale przy fazie `main` typów `medium`/`short`/`tributary` i tak nie ma w `riverPathKinds`.
- **Skutek:** dziś w grze domyślnie widoczne są WYŁĄCZNIE rzeki główne. To jest główna przyczyna „za mało rzek" — nie tylko parametry siatki.

Siatka źródeł: `resolveRiverMapParams` (`src/map/newGameMapDefaults.ts:338`), `mainCell = riverGridCellSizeForTier(tier)` (newGameMapDefaults.ts:281): **low=10 · medium=5 · high=5** (komentarz „Kanon 2026-08-01: 10/5/5"). Uwaga: spec MAPA-RZEKI-SPEC §2 podaje N=15 dla „Normalnie" (wdrożone 20:34) — rozbieżność dokumentacji z kodem do wyjaśnienia. Fallback bez w,h (`riverCoverageCellSize`, gen-helpers.ts:8600) zwraca 10 dla medium — też niespójne z 5. `tributaryCell = max(3, round(mainCell·0,5))`. Parametr `mainGridStride = 1` (każda komórka).

## 3. Pomiar 15 map standardowych

NIE ZMIERZONO. Powód: w worktree ani w checkout `/home/user/The-Game` nie ma `gra/node_modules` (esbuild wymagany przez `gra/tools/river-count-quick.cjs`), a instalacja zależności nie była częścią tego tematu. Istniejące narzędzia do pomiaru: `gra/tools/river-count-quick.cjs` (168×120, kontynenty/ziemia, seed 42), `gra/tools/river-density-test.cjs`, `gra/tools/river-grid-coverage-test.cjs`, `gra/tools/river-path-adjacency-test.cjs`. Czas generowania mapy: NIE ZMIERZONO. Lista 15 map: NIE ZMIERZONO (nie odczytano `river-path-adjacency-test.cjs` pod kątem listy).

## 4. Parametry liczby źródeł i podwojenie

- Źródła główne = komórki siatki `mainCell` × 1 start na komórkę (stride 1). Liczba źródeł ≈ liczba komórek lądu z drogą do morza.
- **Podwojenie źródeł = zmniejszenie boku komórki o √2:** medium 5 → ~3,5; w kodzie wymaga liczby całkowitej (`Math.floor(q/cellSize)`), więc realnie 4 (≈1,56× źródeł) lub 3 (≈2,8×). Dokładne ×2 nie jest osiągalne przy całkowitym boku bez zmiany geometrii siatki (np. offset lub prostokąt). Alternatywa: zachować bok, a zwiększyć liczbę startów na komórkę (wymaga zmiany `mainGridStride` / pętli). Każdy wariant to inny skutek dla wyglądu — decyzja właściciela.
- Parametr `0,8·N` (min. odstęp źródeł): przy zmianie boku komórki trzeba go przeliczyć, inaczej źródła się zlepią — ryzyko klastrowania (spec §2 „anty-stada").
- Ryzyka: reguła sąsiedztwa rzek (`river-path-adjacency-test.cjs`), bufor od morza (`river-sea-buffer-test.cjs`), odstęp między ujściami, wydajność (+12% z RIVMOUTH-wip/fc3, bde050bcf — NIE ZMIERZONO, gałęzi nie odczytano w tym temacie).
- Liczba rzek po zmianie dla 15 map: NIE ZMIERZONO.

## 5. Projekt trzeciego poziomu (warianty do wyboru, skutek dla wyglądu)

- **Wariant A — włączyć `short` w domyślnej grze:** zmiana bramki generacji (`isRiverGenFull`/`riverGenPhase` domyślnie `main+short`) i renderu (stage 3). Gracz zobaczy cieńsze, krótsze dopływy dopływów (wzdłuż istniejących rzek, do 25% szerokości głównej). Za: kod istnieje i był testowany (FALA 174/177). Przeciw: rzeki pojawią się dopiero po przejściu przez bramkę wydajności; ryzyko klastrów wokół źródeł.
- **Wariant B — nowy czwarty typ (dopływ dopływu):** nowy `kind`, generowany po `tributary`, krótszy, łączący się z `tributary` a nie z main. Za: wyraźny trzeci poziom w hierarchii główne→boczne→trzeciego poziomu. Przeciw: nowy typ w `types/map.ts`, `scene.ts`, serializacji i testach — większy zakres; trzeba rozstrzygnąć, czy `short` nie jest już tym poziomem.
- Liczby dla 15 map i koszt generowania: NIE ZMIERZONO.

Decyzja wymagana (pytanie ABC do właściciela, nie rozstrzyga Operator): czy „trzeci poziom" = `short` (wariant A), czy nowy typ (wariant B).

## 6. Testy i piny zmieniane przez (a) trzeci poziom, (b) 2× źródeł, (c) RIVMOUTH-wip/fc3

Lista z `gra/tools/` (nazwy istnieją, zawartość zweryfikowana tylko nagłówkiem/listą):
- ciężkie: `map-gen-regression-test.cjs`, `river-density-test.cjs`, `river-grid-coverage-test.cjs`, `world-density-test.cjs` (wg REPRO 2026-11-25: ~243 s), `map-continents-rivers-test.cjs`;
- lekkie / sąsiedztwo: `river-path-adjacency-test.cjs`, `river-sea-buffer-test.cjs`, `river-map-scale-test.cjs`, `medium-river-test.cjs`, `river-confluence-edge-test.cjs`, `river-yield-both-sides-test.cjs`, `river-turn-window-test.cjs`;
- diagnostyki (nie bramki): `river-count-quick.cjs`, `river-cap-diagnostic.cjs`, `river-density-diag.cjs`.
- (a) trzeci poziom: wszystkie testy liczące `riverPathKinds` i `main` vs pozostałe; (b) 2× źródeł: testy grid-coverage i density (progi pokrycia ≥85%); (c) RIVMOUTH: testy ujść (`river-confluence-edge-test.cjs`, `river-sea-buffer-test.cjs`).
- Hashe/pin-pliki: NIE ZMIERZONO (nie sprawdzono `dyspozycje/` pod kątem pinów rzek).

## Binarne kryterium
- Pkt 1–6 obecne: TAK (pkt 3 i część pkt 4–5 jako NIE ZMIERZONO z uzasadnieniem).
- `gra/**` bez zmian: TAK (patrz git diff w raporcie).
