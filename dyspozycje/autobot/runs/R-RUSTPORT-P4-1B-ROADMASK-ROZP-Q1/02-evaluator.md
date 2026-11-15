# 02 — Evaluator r1 · R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (DTO renderera, rozpoznanie tylko do odczytu)
TEMAT: R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1
GOAL: zweryfikować rozpoznanie Operatora r1 (`1007289cf`): tabela funkcji pinu → Rust, lista wejść producenta `MapViewDto`, podział na wdrożenia, NIE_ZMIERZONO.
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1/02-evaluator.md`), commit na `1007289cf`, bez push.
TESTY: patrz §1 (odtworzone samodzielnie, kody wyjścia).
BLOKADY: brak blokujących. Zarzuty Z1–Z6 do poprawy w dokumencie (żaden nie unieważnia wniosków §1–§2).
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control; poprawki Z1–Z3 przed dispatchem P4-1B-Q1/Q3.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone na `1007289cf`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| Ancestry: `git merge-base --is-ancestor f7baa3848 1007289cf` | 0 (rodzic `1007289cf^` = `f7baa3848`) |
| Allowlista: `git diff --stat f7baa3848 1007289cf` | 2 pliki, oba z allowlisty (`P4-1B-ROADMASK-ROZPOZNANIE.md`, `01-operator-r1.md`); zero zmian w `rust-port/`, `gra/`, `Cargo.lock` |
| `git diff --check f7baa3848 1007289cf` | czysto |
| `cargo fmt --check` (engine, view-model) | 0 / 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | 0 |
| `cargo test --lib` (engine) | 0 — 118 passed, 0 ignored |
| `cargo test --test p6_m07a_rivers_a` (wektory land/medium render, na które powołuje się dokument) | 0 — 17 passed |

Brak zmian kodu ⇒ brak `#[ignore]`, osłabionych asercji i nowego kodu bez wołającego. Dispatch nie wymagał testu.

## 2. Weryfikacja treści (próby wyrywkowe, wszystkie potwierdzone)

- Pin `07d2fbd72`: `ROAD_DIRS` `road-network.ts:32`, `computeRoadMask` `:75`, `roadHexesToRefresh` `:170`, `roadMaskArms/HasNode/IsLonePatch` `:89/:111/:125`; `main.ts:3126` (`mergedImprovementLayers`), `:3144` (`hexHasRoadAt`), wołający maski `:15836`, `:17083`; `road-movement.ts:59/:64`; `terrain-improvements.ts:358/:388`; `gen-helpers.ts` `:152, :5411, :5445, :5550, :5590, :5618, :6012, :7005, :7623, :8148, :8194`; `scene.ts:1306-1320`, `:2873-2877`, `filterRiverPathsForStage` `:1534`.
- Logika `trimMediumTailAlongMain` (warunek `len < 3 || mainKeys.size === 0`, pętla `>= 3`, `&&` na ostatnim i przedostatnim) zgodna z opisem.
- Uzasadnienie „liczenie trimu bez filtra etapu = ten sam wynik”: potwierdzone — `filterRiverPathsForStage` przy etapie ≥ 1 zawsze zostawia `main`, a `mainPathsForJunction` czyta tylko `main`.
- Md5 ciał funkcji `edb8fb56` vs `07d2fbd72` (odtworzone): `trimMediumTailAlongMain`, `trimMediumRenderPathAtMain`, `landRiverRenderPath`, `mediumRiverRenderPath`, `repairRiverPathAdjacency`, `canRiverFlowThrough`, `sanitizeRiverPath` — identyczne.
- Rust `f7baa3848`: `rivers_a.rs:120/224/260/295/317/397/412/436`, `roads.rs:40/46`, `improvement_build.rs:1001`, `improvements.rs:696/1021/1049`, `prims.rs:32` (`HEX_DIRECTIONS` = kolejność pinu), `droga.rs:21-22`, `playable.rs:246-291, :497`, `map_snapshot.rs:174-181`, `improvement_build.rs:203-206`, `engine/Cargo.toml:11` — zgodne. `compute_road_mask`/`trim_medium` w `rust-port` → 0; `river` w `view-model/src/validate.rs` → 0, `road_mask` `:247`.
- `terenBazowy =` poza `map/` tylko `playtestMiastoEkonomia.ts:96,107,114` — potwierdzone (`clearHexForCityCenter` nie zmienia terenu).

## 3. Zarzuty

1. **Z1 (średni, propozycja Q1 niewykonalna w allowliście).** §3 Q1 każe w `engine/tests/p4_1b_road_mask.rs` asertować zgodność `ROAD_DIRS` silnika z `renderer::…::droga::ROAD_DIRS`. `civ-engine` nie zależy od `civ-renderer` (`engine/Cargo.toml`: tylko `civ-view-model`, pusta `[dev-dependencies]`), a `Cargo.toml` nie jest w allowliście Q1; dodanie ciężkiego renderera jako dev-dependency silnika jest też niepożądane. Poprawka: w Q1 asercja tylko z `mapgen::prims::HEX_DIRECTIONS`; zgodność z `droga::ROAD_DIRS` przenieść do testu po stronie renderera (P4-1G) albo do osobnego wpisu.
2. **Z2 (niski, NIE_ZMIERZONO, które da się zmierzyć).** §1.2 i §4 pkt 3: `isReliefTerrain` — zmierzyłem: md5 ciała `d072c38a` na `edb8fb56` i `07d2fbd72` (identyczne; `gen-helpers.ts:5997`). Pozycję zamknąć jako zmierzoną.
3. **Z3 (niski, NIE_ZMIERZONO zawężalne).** §4 pkt 2 (`tarasy` w `mergedImprovementLayers`): warstwa złoża zwierząt `foodLayerFromAnimalDeposit` (`terrain-improvements.ts:349-353`) zwraca wyłącznie `'bydlo'`/`'owce'`, więc nie może dać `tarasy`. Niepewność dotyczy tylko `placedImprovements` (`main.ts:3132-3135`). Zawęzić wpis.
4. **Z4 (niski, pominięty konsument).** §1.2 nie wymienia drugiego konsumenta `riverPaths`/`riverPathKinds` w pinie: `render/mapRenderStyle.ts:1362-1370` `computeRiverDeltaHexKeys` (delta tylko dla `main`, na surowej ścieżce, `pathReachesOpenSea`). Producentowi wystarczą surowe `rivers`, ale P4-1G musi wiedzieć, że delta liczy się z `rivers`, a nie z `river_render_paths`. Dopisać do §1.2/§4 pkt 6.
5. **Z5 (niski, niezmiennik Q3).** `SnapshotMap.hexes` jest w kolejności `Object.keys` (`map_snapshot.rs:172-173`), nie gwarantuje `r`-major wymaganego przez `MapViewDto.hexes` (kontrakt §1.4, `validate_map`). Q3 przyjmuje `&SnapshotMap` jako domyślne źródło — dopisać jawny krok sortowania/indeksowania `r`-major i test negatywny (snapshot z kluczami w innej kolejności).
6. **Z6 (kosmetyczny).** §2, wiersz `riverPaths`: „`rivers_b..e2` (poza `rivers_a`/`rivers_b`) to szkielety” jest wewnętrznie sprzeczne; `rivers_b.rs` ma podmoduł `rivers_b/` (nie jest szkieletem), szkielety M00 to `rivers_c/d/e1/e2.rs` (oraz `generate.rs`). Poprawić sformułowanie.

## 4. Ocena

Rozpoznanie jest rzetelne: wszystkie sprawdzone odwołania `plik:linia` (pin i Rust) się zgadzają, wniosek kluczowy (brak jednego modelu mapy z 8 wariantami terenu + rzekami z rodzajami + ulepszeniami; jedynie `SnapshotMap` ma komplet) potwierdzony. Zarzuty dotyczą precyzji propozycji wdrożeń i domknięcia dwóch NIE_ZMIERZONO; Z1 trzeba poprawić przed dispatchem P4-1B-Q1.
