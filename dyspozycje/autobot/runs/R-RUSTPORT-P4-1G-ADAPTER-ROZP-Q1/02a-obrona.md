# 02a — Obrona Operatora (R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1
GOAL: rozpoznanie adaptera `renderer/src/view.rs` (DTO → wejścia renderera), tylko odczyt
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` (poprawki r2), ten plik; baza obrony = commit Evaluatora `ded3d0da0` (rodzic `9d4f351c9`, baza tematu parity-v2 `2f9a12786`). Zero kodu, zero `gra/`, zero `Cargo.lock`.
TESTY: nie dotyczy (dokument; bez `cargo`/`npm`). `git diff --cached --check` czysty. Pomiary poniżej.
BLOKADY: bez zmian względem r1 (§6 dokumentu); usunięta fałszywa zależność oblężeń/Q5 od R1.
RUNDY: obrona r1 (po Evaluatorze r1 FAIL)/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — `to_int32` istnieje: PRZYJMUJĘ
Dowód: `grep -rn to_int32 rust-port/renderer/src` → 3 trafienia: `geom/earcut.rs:793` (definicja `fn to_int32(x: f64) -> i32`, doc-komentarz `:791`, `!is_finite → 0`, `trunc`, `rem_euclid(4_294_967_296.0)`), `:804`, `:805`. Mój pomiar w r1 był błędny.
Poprawka: §2 (pułapka `seed`) — opis istniejącej funkcji i plan wyniesienia do modułu wspólnego (`geom/js_num.rs`, `pub(crate)`) bez duplikatu; §7 Q1 — zakres i allowlista rozszerzone o `geom/earcut.rs` (tylko usunięcie lokalnej funkcji + import), `geom/js_num.rs` (NOWY), `geom/mod.rs` (deklaracja); §9 — skorygowana komenda (usunięte `to_int32` z grepa „→ 0”, dopisana korekta z 3 trafieniami).

### Zarzut 2 — `top_y_at` istnieje, zależność od R1 fałszywa: PRZYJMUJĘ
Dowód: `rust-port/renderer/src/pick/terrain.rs:303-308` `pub fn top_y_at(&self, h: HexCoord) -> f64`, mapa wypełniana w `build_terrain_pick_scene` (`:332`) wartością `height + y_offset` (`:410`). Pin: `topYAt` (`units.ts:6515-6518`) → `terrainTopY(hex)` = `spec.height + spec.yOffset` (`units.ts:222-225`) — ta sama formuła.
Poprawka: §3.6 wiersz `top_y` → ZGODNE z opisem domknięcia adaptera; §4 R1 — usunięte `topYAt` i logika `pickUnitIdAt`; §7 — jawne zdanie, że Q5 (oblężenia) nie zależy od R1, tylko od Q2; §8 pkt 5 — zmierzony, zawężony do nieistotnej dla oblężeń kwestii innych `terrainTopY` (`cities.ts:85`, `wonderRenderer.ts:45`).
Uwaga poboczna (nie zarzut): komentarz w `terrain.rs:304` cytuje `units.ts:6409-6412`, w pinie `topYAt` jest w `:6515-6518` — odnotowane w §3.6, poprawa poza tym tematem (kod tylko do odczytu).

### Zarzut 3 — `ray_to_unit` to port `pickUnitIdAt`: PRZYJMUJĘ
Dowód: `rust-port/renderer/src/pick/mod.rs:190-193` `pub fn ray_to_unit(ray: &Ray, units: &[UnitPickModel]) -> Option<usize>` z doc-komentarzem „`unitRenderer.pickUnitIdAt` for a ray”.
Poprawka: §3.5 wiersz picking — „ROZBIEŻNE (tylko dane)”: port istnieje, brakuje wyłącznie `UnitPickModel.meshes`; §4 R1 — R1 dostarcza tylko siatki żetonów.

### Zarzut 4 — niespójny konsument pól robotników: PRZYJMUJĘ
Dowód: `cities/overlay/worker_field.rs:169` `build_worker_field_overlay(…, player_owner_id: f64)` jest wołany wewnątrz `sync_worker_field_overlay(…, player_owner_id: Option<f64>)` (`:198-202`); pin `main.ts:15441`: `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())`.
Poprawka: §2 (wiersz „właściciel”) i §3.3 (`viewer.owner_id`) ujednolicone na `sync_worker_field_overlay` z `Option<f64>` (adapter podaje `Some(owner as f64)`); `build_…` opisane jako funkcja wewnętrzna. §3.7 był już poprawny.

### Zarzut 5 — komentarz `view.rs` sprzeczny z D-DTO-1: PRZYJMUJĘ
Dowód: `rust-port/renderer/src/view.rs:1-3`: „read-only view model (DTO) computed from the engine `GameState` … including the `PositionDto(x, y)` ↔ axial `(q, r)` mapping”; wg D-DTO-1 = A DTO leżą w crate `view-model`, adapter tylko tłumaczy.
Poprawka: §1 wiersz `view.rs` — odnotowana sprzeczność; §7 Q1 — zakres obejmuje przepisanie komentarza modułu (plik `view.rs` był już na allowliście Q1).

## Pomiary (komendy)
- `grep -rn to_int32 rust-port/renderer/src`; `sed -n 785,805p rust-port/renderer/src/geom/earcut.rs`
- `sed -n 295,340p` i `:385,412p rust-port/renderer/src/pick/terrain.rs`; `sed -n 180,200p rust-port/renderer/src/pick/mod.rs`
- `sed -n 165,205p rust-port/renderer/src/cities/overlay/worker_field.rs`; `sed -n 1,5p rust-port/renderer/src/view.rs`
- `git show 07d2fbd72:gra/src/render/units.ts | sed -n 220,225p` i `6515,6518p`; `git grep -n "function terrainTopY" 07d2fbd72 -- gra/src`; `git show 07d2fbd72:gra/src/main.ts | sed -n 15439,15442p`
