# 02 — Evaluator r1 — R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1

STATUS: FAIL
DOMAIN: GAME (renderer, DTO widoku — rozpoznanie, tylko odczyt)
TEMAT: R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1
GOAL: zweryfikować adwersarialnie rozpoznanie adaptera `renderer/src/view.rs` (#216) Operatora r1 (`9d4f351c95741c08eace0802642300df19275c6d`).
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1/02-evaluator.md`), commit lokalny na `9d4f351c9`, bez push.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdziłem (realnie)

- Dispatch: `git show origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1/00-dispatch.md`.
- Baza: `origin/rust-port/parity-v2` = `2f9a12786d4056dc499037667edbcf8cb5041fb8` (bez zmian od startu Operatora); rodzic `9d4f351c9` = `2f9a12786` — zgodne.
- Allowlista: `git diff --stat 2f9a12786 9d4f351c` → 2 pliki, oba w allowliście (`dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` NOWY, `runs/.../01-operator-r1.md`). Zero `gra/`, zero `.rs`, zero `Cargo.lock`. `git diff --check` czysty (exit 0).
- Bramki: diff nie zawiera kodu, więc `#[ignore]`/osłabione asercje/wołający nie dotyczą. `cargo fmt -- --check` w `rust-port/renderer` → exit 0, w `rust-port/view-model` → exit 0 (`rust-port/` nie ma workspace’u, `cargo fmt --all` z katalogu `rust-port` → błąd „could not find Cargo.toml”, nie formatowanie). `clippy -D warnings` i `cargo test --lib`: NIE WYKONANO — zero zmian `.rs` względem zintegrowanej bazy, rozpoznanie tylko do odczytu (dispatch: „ZERO zmian kodu”), wolne 8,5 GB.
- Rust (na `9d4f351c9`): sprawdziłem ok. 45 odwołań plik:linia z §1–§4 (`view-model/src/{root,map,units,owners,overlays,battle,ids}.rs`, `renderer/src/models/cities/renderer.rs`, `models/wonders/renderer.rs`, `models/misc/{siege,range,overlay,build_highlight}.rs`, `terrain/mod.rs`, `pick/{hex,terrain,mod}.rs`, `cities/overlay/{okolica,worker_field}.rs`, `units/mod.rs`, `core/bronze.rs`, `stat_plate.rs`, oba `OwnerEmblemContext`). Zgodne poza zarzutami niżej.
- Pin `07d2fbd72`: ok. 60 linii `main.ts` (`refreshFog`, `syncUnitsRender`, `_cityRenderOpts`, `refreshBuildHighlight`, oblężenia, terytorium, zasięgi, szlaki, okolica, `setPathRoute`, `hideDecorAtHex`), `render/units.ts` (6095/6524/6571/6608/5787/5919/6139), `render/scene.ts` (800/1263/1580/1730/2347/2469/2860/2873/3164/3172/3526), `game/civ-visual.ts:80-106`. Wszystkie sprawdzone numery trafiają w opisany kod.

## Zarzuty

1. **Fałszywy wynik pomiaru `to_int32` → 0.** §2 („W `renderer/src` nie ma pomocnika `to_int32` (`grep -rn "to_int32" renderer/src` → 0)”) oraz §9 (łączny grep `…|to_int32` → „0 trafień”). Faktycznie: `rust-port/renderer/src/geom/earcut.rs:791-801` — `fn to_int32(x: f64) -> i32`, „JavaScript `ToInt32` … (`x | 0`)”, z `rem_euclid(2^32)` i `0` dla NaN/Inf. Ten sam grep daje 3 trafienia. Wniosek „adapter musi mieć własne `ToInt32`” i pozycja Q1 („`ToInt32` dla `seed`”) prowadzą do duplikatu; poprawnie: wynieść istniejącą funkcję do wspólnego modułu (`pub(crate)`) i jej użyć (allowlista Q1 musi wtedy objąć `geom/earcut.rs` albo nowy moduł pomocniczy).
2. **`top_y` oblężeń błędnie oznaczone ROZBIEŻNE/BRAK; `topYAt` błędnie w R1.** §3.6 (wiersz `top_y`: „wysokość bierze się z renderera żetonów (BRAK)… NIE_ZMIERZONO”), §4 R1 (`topYAt` na liście brakujących), §8 pkt 5. Faktycznie: `rust-port/renderer/src/pick/terrain.rs:303-308` — `TerrainPickScene::top_y_at(&self, h: HexCoord) -> f64`, z komentarzem „`unitRenderer.topYAt(q, r)` … nominal prism top of an existing hex (fog does not matter), 0 outside the map”, budowane przez `build_terrain_pick_scene` (`pick/terrain.rs:332`). Port `topYAt` już istnieje, więc `SiegeMarkerRenderer::sync(…, top_y, …)` (`siege.rs:543-549`) da się zasilić bez R1. Status wiersza powinien być ZGODNE (adapter: `|q, r| pick.top_y_at(HexCoord{…})` z konwersją `f64` → `i32`), pkt 5 §8 do usunięcia, a zależność Q5 od R1 dla oblężeń — nie istnieje.
3. **`pickUnitIdAt` błędnie w R1 jako brakujące.** §4 R1 wymienia `pickUnitIdAt`. Faktycznie: `rust-port/renderer/src/pick/mod.rs:190-193` — `ray_to_unit(ray, units: &[UnitPickModel])`, opisane jako „`unitRenderer.pickUnitIdAt` for a ray”. Brakuje tylko źródła `UnitPickModel.meshes` (to §3.5 opisuje poprawnie). R1 ma wymieniać budowę siatek żetonów, a nie `pickUnitIdAt`.
4. **Niespójny konsument pól robotników.** §2 i §3.3 podają `build_worker_field_overlay(…, player_owner_id: f64)` (`worker_field.rs:169`), a §3.7 — `sync_worker_field_overlay(…, player_owner_id: Option<f64>)` (`:198-202`). Pin woła `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())` (`main.ts:15441`), więc wejściem adaptera jest `sync_worker_field_overlay` z `Option<f64>` — §2 i §3.3 do ujednolicenia (konwersja `OwnerRef` → `Some(f64)`).
5. **(Uwaga, nieblokująca)** §1 cytuje nagłówek `view.rs` („Empty until RR-T13 lands”), ale nie odnotowuje, że jego opis („view model (DTO) computed from the engine `GameState` … `PositionDto(x, y)` ↔ axial”) jest sprzeczny z D-DTO-1 (DTO w osobnym crate `view-model`, adapter tylko tłumaczy). Q1 powinien przewidzieć przepisanie komentarza modułu `view.rs`.

## Ocena kryteriów końca dispatchu

1. Tabela DTO → wejście → pin → status: jest i jest w większości poprawna; zarzuty 2–4 to błędne statusy/wejścia.
2. Lista blokad: jest; zarzut 2 usuwa jedną fałszywą zależność (oblężenia ← R1).
3. Podział na wdrożenia z allowlistą: jest; Q1 do korekty po zarzucie 1.
4. NIE_ZMIERZONO: jest (11 pozycji); pkt 5 to fałszywe NIE_ZMIERZONO (zmierzalne jednym grepem).

## Werdykt

FAIL — dokument zawiera jawnie fałszywy wynik pomiaru (zarzut 1: grep zgłoszony jako „0 trafień”, a daje 3) oraz dwa wejścia renderera opisane jako brakujące, choć istnieją (zarzuty 2, 3), co zmienia blokady i zależności w §6–§7. Poprawki są wąskie i mieszczą się w allowliście; runda 2 Operatora: zarzuty 1–4 (5 opcjonalnie).

BLOKADY: brak (poprawki dokumentu).
NASTĘPNY KROK: Operator r2 (ten sam ID) — korekta §2, §3.3, §3.6, §4 R1, §6, §7 Q1/Q5, §8 pkt 5, §9.
