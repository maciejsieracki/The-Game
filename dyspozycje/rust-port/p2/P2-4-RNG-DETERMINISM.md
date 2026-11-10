# P2.4 — Zgodność RNG: web vs `rust-port/engine` (weryfikacja faktów)

**Temat:** `R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Piny:** web `main` = `edb8fb56` (`gra/src/map/*.ts`, `gra/src/game/*.ts`); Rust = `rust-port/parity-v2` = `9e33fc77` (`rust-port/engine/src/domain/map_generator.rs`, `barbarians.rs`).
**Charakter:** weryfikacja faktów, nie decyzja projektowa. Zero zmian w `gra/**` i w kodzie Rust.

## Status

**NIEZGODNE** dla pełnej sekwencji generatora świata (kolejność i liczba wywołań RNG po stronie Rust różni się od web).
Prymitywy: `mulberry32`, permutacja 256, offsety kształtu, cell-bias (seedy < 4e6) są **ZGODNE** (matematycznie identyczne, zweryfikowane liczbowo). `hashInt3` jest **ZGODNE-EMPIRYCZNIE** (inna implementacja: float × ToInt32 po stronie web, `wrapping_mul` u32 po stronie Rust; zgodne tylko w testowanym zakresie, sekcja 3). Pangea i wyspy: **NIEROZSTRZYGNIĘTE** (sekcja 4). Ziemia: **NIEZGODNE** (sekcja 4), co samo wystarcza do werdyktu.

## 1. Algorytmy — co faktycznie jest w kodzie

| Element | Web (`gra/src/map/gen-helpers.ts`) | Rust (`map_generator.rs`) | Ocena |
|---|---|---|---|
| Generator strumienia | `mulberry32(seed)`: `s = seed>>>0; s += 0x6d2b79f5; t = Math.imul(s^(s>>>15), 1\|s); t ^= t + Math.imul(t^(t>>>7), 61\|t); return ((t^(t>>>14))>>>0)/2^32` | `Mulberry32::next_u32`: `wrapping_add(0x6d2b_79f5)`, `wrapping_mul(1\|state)`, `wrapping_mul(61\|t)`, `t ^ (t>>14)`; `next_f64 = u32/2^32` | identyczne (ta sama stała, ta sama kolejność operacji, u32) |
| Seed 0 | `generateMap`: `seed \|\| 42` (`generator.ts:159`) | `if seed == 0 { 42 }` | zgodne w `generateMap` |
| Seed 0 w API `generujSwiat` | `generator.ts:837`: seed 0 → losowy z `Date.now()` | brak odpowiednika (0 → 42) | **NIEZGODNE** (ścieżka wejścia, nie generator) |
| Permutacja 256 | `for i=255..1: j=floor(rand()*(i+1)); swap` | `for i in (1..256).rev(): j=floor(next_f64()*(i+1)); swap` | identyczne |
| Offsety kształtu | `defaultShapeParams`: `rand()*500` ×6, kolejność mtnX, mtnY, forX, forY, desX, desY | `ShapeParams::from_rng`: `next_offset()=rand*500` ×6, ta sama kolejność | identyczne |
| Skala kształtu | `noiseScale=0.13`, potem `/= sizeNorm` (`generator.ts:174-180`); `sizeNorm = max(w,h)/36` | `0.13/size_norm`, `size_norm = max(w,h)/36` **z `.max(1.0)`** | zgodne dla `max(w,h) ≥ 36`; dla mniejszych map Rust nie skaluje (pozarngowe) |
| Hash komórkowy | `hashInt3(a,b,c)`: iloczyny jako liczby JS (float), `^` przez ToInt32 | `hash_int3`: `wrapping_mul` u32 | ZGODNE-EMPIRYCZNIE: zgodne tylko przy iloczynach < 2^53 (nie monotonicznie, sekcja 3) |
| Cell bias | `terrainCellBias`, `terenCoverageCellSize()` = **4** (`gen-helpers.ts:889-891`) | `terrain_cell_bias`: `q/4`, `r/4` | zgodne |

## 2. Test liczbowy (skrypty w scratchpadzie, poza repo)

Web: kopia 1:1 funkcji z `gen-helpers.ts` (Node 22). Rust: kopia 1:1 z `map_generator.rs` (`rustc -O`). Porównano dla seedów `42, 43, 1, 999999, 4000000, 4100000, 4294967295`:

- 20 000 kolejnych wartości `mulberry32` (u32 po przeskalowaniu): **IDENTYCZNE** dla wszystkich 7 seedów.
- Permutacja 256 (`buildPermTable` vs `build_permutation`): **IDENTYCZNE** dla wszystkich 7 seedów.
- `hashInt3` vs `hash_int3` (siatka a<40, b<40 krok 7, Evaluator-reprodukcja): seedy **4 000 000, 4 000 001, 4 010 000, 4 100 000** — 0 różnic; seedy **4 100 001, 4 200 001, 4 294 967 295** — różne dla wszystkich punktów siatki (216/216). Wynik NIEMONOTONICZNY (sekcja 3); „IDENTYCZNE dla seedów ≤ 4 100 000" z wersji R1 było mylące i zostało skorygowane.
- Dryf strumienia web: JS `s` rośnie bez maskowania; web == dokładna arytmetyka u32 do wywołania (1-based) **4 917 758–4 917 760** zależnie od seeda (seed 42: pierwsza rozbieżność przy wywołaniu **4 917 759**; seed 4 294 967 295: **4 917 758**). Wersja R1 podawała „4 917 757" — błędna liczba, skorygowana.

Skrypty (poza repo): `scratchpad/rng/web_rng.js`, `scratchpad/rng/rust_rng.rs`, `scratchpad/rng/hashq.js`, `scratchpad/rng/verify-r2.js`.

## 3. Zakres `hashInt3` (ZGODNE-EMPIRYCZNIE)

Iloczyn `c * 2246822519` przekracza 2^53 dla `c` powyżej okolic 4.0e6. Empirycznie: losowe seedy z [4.0e6, 2^32) dają rozbieżność w **3980/4000** (R1) i **3981/4000** (Evaluator, osobny przebieg; wynik losowy). Granica nie jest monotoniczna — seed 4 100 000 zgadza się tylko dlatego, że ma końcowe zera binarne (iloczyny są wtedy dokładnie reprezentowalne), a 4 100 001 już nie. Zakres „bezpieczny" należy traktować jako **nieudowodniony**; pewne jest tylko: dla seedów z UI (`Math.floor(Math.random()*1e6)`, `newGameFlow.ts`) wszystkie iloczyny są < 2^53. Dla seedów API ≥ ~4e6 web i Rust mogą dawać różne hashe terenu.

## 4. Kolejność wywołań generatora świata (`generujSwiat` vs `generate_map`)

- **Zgodne:** perm → offsety kształtu → centra kontynentów dla `kontynenty` (web `buildFiveZoneContinentCenters`: per centrum jitter nq, jitter nr, pickR = 3 wywołania w tej kolejności; Rust `build_continent_centers`: te same 3 wywołania na centrum, ta sama kolejność pól).
- **NIEZGODNE — `ziemia` (Earth):** web `buildContinentCenters(rand, nCenters, …)` konsumuje `rand()`; Rust `build_world_centers` dla `Earth` zwraca `Vec::new()` (0 wywołań).
- **ZIEMIA (Earth) — NIEZGODNE (potwierdzone):** Rust `build_world_centers` dla `WorldType::Earth` zwraca `Vec::new()` (`map_generator.rs:519`, parity-v2 9e33fc77): 0 wywołań RNG. Web `generator.ts:197` wywołuje `buildContinentCenters(rand, …)` w gałęzi nie-pangea/nie-wyspy: konsumuje `rand()`. Rozjazd już na granicy centrów.
- **NIEROZSTRZYGNIĘTE — `pangea`, `wyspy`:** web `buildPangeaBlobCenters` (`generator.ts:195`) i `buildSixteenGridIslandCenters` (`generator.ts:193`) vs Rust `build_pangea_centers` (`map_generator.rs:565`) i `build_island_centers` (`:617`). Implementacje wyglądają na różne (inne funkcje, pętle, struktury losowania). Liczby i kolejności wywołań **nie zmierzono** — status NIEROZSTRZYGNIĘTY, nie „prawdopodobnie różne". Nie wpływa na werdykt, bo ziemia już daje NIEZGODNE.
- **NIEZGODNE — po centrach:** web w `generateMap` dalej konsumuje `rand` (`growMountainRanges`, `generateRivers`, `ensureForestGridCoverage`, `ensureDepositGridCoverage`, itd., `generator.ts:417-733`) oraz osobne strumienie:
  - `clusters.ts:1927` — `mulberry32((seed ^ 0x9e3779b9) >>> 0)`;
  - `clusters.ts:3321` — `mulberry32(seed)` **bez XOR** (seed = `opts.seed ?? 42`, ten sam seed co główny strumień generatora; R1 błędnie podawała linię 3401 i „XOR");
  - `cluster-spawn.ts:273, 294, 485` — `mulberry32(seed ^ 0x…)`;
  - `gen-helpers.ts:12073, 12520` — `mulberry32((seed ^ 0x9e3779b9)>>>0)` / `(seed ^ 0x85ebca6b)>>>0`;
  - **`villages.ts:92-93` (`lcgNext`, NIE było w R1):** LCG Numerical Recipes `next = (state*1664525 + 1013904223) >>> 0`, `rnd = next/2^32`; seedowany `(effectiveSeed ^ 0x5eed) >>> 0` i wywoływany z `generator.ts:675` (`placeVillages`). Dla `state < 2^32` iloczyn < 2^53, więc JS jest tu dokładny. Ta sama stała występuje w `barbarians.ts:706` (web) i `barbarians.rs:342` (Rust, poza ścieżką map_generator). Rust `map_generator.rs` nie ma odpowiednika placeVillages (grep: brak). Status villages: NIEROZSTRZYGNIĘTY w zakresie ścieżki mapy; nie zmienia werdyktu.
  Rust po centrach **nie konsumuje RNG** (`generate_map` kończy się na `apply_climate_bands`, `mark_coast_tiles`, `add_core_rivers`, wszystkie deterministyczne/hashowe). Wniosek: sekwencja RNG po pierwszej fazie różni się, więc wynik pełnej mapy nie może być zgodny bitowo.

## 5. Wnioski i ograniczenia

- Prymitywy RNG (mulberry32, permutacja, offsety kształtu, centra `kontynenty`, cell-bias dla seedów < 4e6) są **zgodne** z web.
- Pełny generator **nie** jest zgodny: brak konsumpcji RNG po centrach w Ruście i inna gałąź dla `ziemia`/`pangea`/`wyspy`.
- Web `mulberry32` przestaje być dokładny po ~4.9 mln wywołań jednego strumienia (teoretyczny limit, nie zmierzono liczby wywołań dla pełnej mapy).
- Nie porównywano wartości `fbm`/`landMask` (to nie jest RNG); zgodność mapy bitowo nie jest tu tezą.
- Wynik dotyczy pinów wskazanych wyżej; rekomendacja jest faktem, nie decyzją (decyzja o portowaniu kolejności RNG należy do P2.2+).

## 6. Rekomendacje do rozstrzygnięcia w P2.2+ (fakty, bez decyzji)

1. Ustalić, czy kontrakt P2.4 wymaga bitowej zgodności pełnej mapy (wtedy: port całej konsumpcji RNG po centrach + osobne strumienie), czy zgodności prymitywów + porównania wyniku testami fixture z P1.
2. Zdecydować o zachowaniu `seed > ~4e6` (np. `hashInt3` w u64/BigInt-equivalent w Ruście albo ograniczenie zakresu seeda po stronie web).
3. Zdecydować o semantyce seed 0 w API (web: losowy z czasu; Rust: 42).
