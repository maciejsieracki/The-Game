STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-21-MOD09-CITIES-Q1
GOAL: MOD-09 (`P4-4-MODEL-CATALOG.md`, wiersz 9): modele miast i osad w Rust 1:1 z uruchomionym kodem weba `edb8fb56` (`miasto-kamien`, `miasto-braz`, `bronzeCityRoblox`, `stoneCityRoblox`, typy `stoneCity`, `settlementModel`, CPU `cities.ts` bez chipa, `cityMapOutline`), bitowo, `jsmath`, reużycie core bez duplikacji, drzewo `unit_core::model`.
ZMIANY/COMMIT: Evaluator nie zmienia kodu. Oceniane: `c522d6d6` (kod) + `0e35bcbe` (dok.), baza `7cc2e9b8`. Ten plik jest jedyną zmianą (commit na `0e35bcbe`, bez push).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdzono (realnie, z komendą)

| Punkt | Wynik |
|---|---|
| Allowlista | `git diff --name-only 7cc2e9b8 0e35bcbe` → 19 plików, wszystkie w allowliście (`models/cities/**`, `models.rs` +1 linia `pub mod cities;`, `tests/cities_web_parity.rs`, `tests/fixtures/cities/**`, P4-21, runs). `gra/**`, `src-tauri/**`, `engine/**`, `src/{geom,pick,assets,camera,terrain,core}/**`, `unit_core/**`, `Cargo.*` bez zmian. `git diff --check` EXIT=0. Baza `7cc2e9b8` potomkiem `bf59164b` (OK). |
| Pochodzenie wektorów | Odtworzone wg README w scratch poza repo: `git archive edb8fb56 gra/src gra/data`, `three@0.169.0` + `esbuild@0.24.0`, node v22.22.0. Stdout `cities models=1048 outlines=5 steps=14 legacy=2`. SHA-256 `models.json` `023c3540…8bd1c`, `renderer.json` `7d292864…59e69c1`, `gen.ts` `bfcb2ea7…9579b` — **bajtowo identyczne** z P4-21 §6 i z plikami w commicie. SHA-256 8 plików weba z archiwum = tabela P4-21 §6 (8/8). `gen.ts` importuje moduły weba bez zmian (`../websrc/gra/src/render/*`). |
| Pokrycie wariantów | Kamień L1–10 + 0/11/−3/2,5/3,5/6,49/NaN × mur × kolor; brąz grecja/rzym × te poziomy × {brak, mur, palisada, oba} × kolor + router (egipt/sumer/nieznany/pusty); palisada 3 fazy; ghost brąz 11 cyw. × 13 poz. × mury; ghost kamień 11 × 13 × mury + uniwersalny; settlement era 0–3; obrys 4 + `place`; renderer 14 kroków (era 4 → fallback brąz, `palisada`, mgła, reuse, usuwanie); fallback `buildCityModel` 2. Rodziny w teście: `braz 220, ghost_braz 287, ghost_kamien 286, kamien 72, settlement 144, …`. Zgodne z „2 rodziny × 10 poz. × mury + 2 ghost”. Buildery `buildBronzeCity/buildStoneAgeCity` poza zakresem zgodnie z D-MOD-1 (rozstrzygnięte, `LEDGER.md:128` wg P4.7 FC). |
| Zgodność bitowa | Test porównuje `to_bits` (liczniki, bbox, materiały, hash FNV węzłów z `matrixWorld` + hash geometrii f32, detal węzłów 21 modeli); nieznane `f` → panic (brak cichego pomijania). Wynik w czystym targecie: models 192 347 / outlines 616 / renderer 27 035 / legacy 992 / layout 57 — 0 rozbieżności. |
| Drzewo modelu | `CityModel.tree: unit_core::model::UnitModel`; brak czwartego typu drzewa. Tabela `drawables` (Z1) — przyjmuję jako minimalny typ geometrii/materiału (dispatch na to pozwala). |
| `jsmath` | `grep -nE '\.(sin|cos|tan|atan2|hypot|powf|exp|ln|…)\(' src/models/cities/*.rs tests/cities_web_parity.rs` → 0 trafień w kodzie (1 w komentarzu). |
| Reużycie core | `BronzeCiv`, `BRONZE_CIVS`, `rnd` z `core::bronze` (bez kopii, `stone_civ.rs:7-13`); `js_round/js_max/js_min`, `Color`, `quat_from_euler`, prymitywy `geom` reużyte. **Wyjątki — zarzuty 1 i 3.** |
| Mutacje | Skrypt §8.3 powtórzony 1:1: 20/22 zabite, M21/M22 przeżyły (jak raport). Własne E1–E8 (sól `rnd` ghosta kamienia, `depthWrite` obrysu, sufiks `visualKey`, `flatShading` kamienia, kierunek dziury pierścienia, `-0` w HexLoop, promień obrysu, brak usuwania nieobecnych miast): 7/8 zabite; E6 (`point.z || 0`) przeżył — równoważny (sin kątów π/2+iπ/3 nigdy nie daje 0 dla r>0). |

## Bramki (czysty `CARGO_TARGET_DIR`, nowy katalog, commit `c522d6d6`)

```
$ cargo fmt --all -- --check                                   EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings           EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings  EXIT=0
$ cargo test --locked --all-targets                            EXIT=0  (18 binarek "Running", 110 testów, 0 failed)
$ cargo test --locked --test cities_web_parity -- --nocapture  EXIT=0  (5/5, wszystkie "0 mismatches")
```

Sonda scalenia z bieżącym `origin/rust-port/parity-v2` @ `66e6572d`: konflikt wyłącznie w `src/models.rs` (oczekiwana 1 linia; rozwiązanie `pub mod cities;` przed `improvements`), po rozwiązaniu fmt EXIT=0, clippy EXIT=0, `cargo test --locked --all-targets` EXIT=0 (w tym `jsmath_wiring`).

## Zarzuty

1. **Duplikacja core (kryterium „reużycie core bez duplikacji”).** `models/cities/model.rs:86-105` `trace_pointy_top_hex` jest kopią `core::hex_shape::append_pointy_top_hex` (istniała już na bazie `7cc2e9b8`, `core/hex_shape.rs:32`), a `model.rs:107-119` `hex_ring_points_xz_js` — kopią `core::hex_shape::hex_ring_points_xz`. Kopia `trace_pointy_top_hex` nie jest nigdzie udokumentowana (P4-21 §3 i uwaga 1 w BLOKADACH mówią tylko o `hex_ring_points_xz`). Od `a880484e` (P4.18, już w `parity-v2` @ `66e6572d`) obie funkcje core liczą przez `js_cos/js_sin` (`git show origin/rust-port/parity-v2:rust-port/renderer/src/core/hex_shape.rs` linie 10, 21-25, 33-48), więc po integracji obie kopie są czystymi duplikatami, a uzasadnienie w `model.rs:109-110`, P4-21 §3 i uwaga 1 raportu jest nieaktualne. Wymagane: przenieść pracę na bieżące `parity-v2`, użyć `core::hex_shape::{append_pointy_top_hex, hex_ring_points_xz}`, usunąć kopie, zaktualizować P4-21 §3/§5 (M22 przestaje dotyczyć kodu miast) i uwagę w raporcie; parytet bitowy musi pozostać 0 rozbieżności.
2. **Nieprawdziwa liczba w raporcie i dokumencie.** Raport i P4-21 §8.1 podają „19 binarek testowych”; surowy log samego Operatora (P4-21 §9, sekcja `cargo test --locked --all-targets`) ma 18 linii `Running` (lib + 17 testów integracyjnych), 19. pochodzi z osobnego przebiegu `--nocapture`. Mój przebieg w czystym targecie: 18. Poprawić liczbę.
3. **Drobna duplikacja `terrainTopY`.** `models/cities/renderer.rs:75-80` `terrain_top_y` powtarza `core::map_style::terrain_surface_top_y(t, GAME_MAP_RENDER_STYLE, 0.0)` (`core/map_style.rs:385-389`, ta sama formuła `height + y_offset`); w crate jest też `pick::terrain::Terrain::top_y()` używane przez `wonders::renderer::top_y`. Użyć istniejącej funkcji (albo udokumentować, dlaczego nie); wynik renderera musi pozostać bitowo zgodny.

Uwagi (nie zarzuty): `OWNER_COLORS`/`owner_color` są drugą kopią `wonders::renderer::{OWNER_COLORS, default_owner_color}`, ale web też ma dwie niezależne stałe (`cities.ts:92`, `wonderRenderer.ts:21`) — lustro weba, akceptuję. Fallback `buildCityModel` nieosiągalny z `sync` (Z6) — jawne odchylenie, zweryfikowane bitowo. `NIE_ZMIERZONO` (GPU/wzrok) — lista P4-21 §7 kompletna dla dispatchu.

TESTY: jak wyżej — wszystkie bramki zielone, wektory odtworzone bajtowo, mutacje 20/22 + 7/8 własnych (przeżyłe równoważne).
BLOKADY: brak technicznych; FAIL z powodu zarzutów 1–3 (kryterium reużycia core + rzetelność raportu).
NASTĘPNY KROK: Operator r2 (ten sam ID): rebase na bieżące `origin/rust-port/parity-v2`, usunięcie zarzutów 1–3, ponowne bramki i parytet; potem Evaluator r2.
