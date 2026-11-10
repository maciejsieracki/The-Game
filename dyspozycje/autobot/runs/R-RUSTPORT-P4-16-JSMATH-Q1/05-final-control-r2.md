STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-16-JSMATH-Q1
GOAL: Jeden moduł `jsmath` w `rust-port/renderer`, bitowo zgodny z V8 `Math.sin/cos/tan/atan2/pow/hypot/exp/log`, używany przez `geom`, `terrain` i `models/wonders` zamiast funkcji systemowych; wektory z V8 (≥ 20 000 na funkcję); dotychczasowe testy zgodności zielone bez zmiany fixtur.

ZMIANY/COMMIT: Final Control nie zmienia kodu. Oceniany commit Obrony `0fc97d46` (rodzic `fc106495` Operatora r1, baza `8761c6c3`). Ten raport dopisany osobnym commitem dokumentacyjnym na `0fc97d46`.
- Allowlista: `git diff --name-only 8761c6c3 0fc97d46` — 36 ścieżek, wszystkie w allowliście dispatchu; `lib.rs` jedna linia `pub mod jsmath;`; `pick/**`, fixtury dotychczasowych testów, `Cargo.toml`, `Cargo.lock` nietknięte. `git diff --check 8761c6c3 0fc97d46` czysty.
- Kolejność integracji: `origin/rust-port/parity-v2` = `d925acb3` (P4.12, P3.19). `git merge-tree --write-tree d925acb3 0fc97d46` → drzewo `c8f4e8df`, bez konfliktów. Lokalny commit sondujący `776acb05` (merge, NIE wypchnięty) — bramki na nim zielone (niżej). Zalecana integracja: merge `0fc97d46` (lub tego commitu raportu) na `d925acb3`.

ORZECZENIA:
1. Terrain obraca przez `pick::three::Quat::from_euler_xyz` (systemowe sin/cos) — ODDAL (naprawione). `terrain/mod.rs:125-138` `quat_from_euler_xyz` przez `js_sin/js_cos`, wzór zgodny z three r169 `setFromEuler` 'XYZ'; 3 wywołania przepięte (`:144`, `:655`, `:664`). Grep w `src/{geom,terrain,models/wonders}`: zero wywołań systemowych funkcji przestępnych i `from_euler_xyz` z `pick`. Funkcje `pick` nadal wołane z `terrain` (`max_zoom_dist`, `axial_to_world`, `sqrt3`, `rotacja_dla_heksa`, `wariant_dla_heksa`) nie liczą trygonometrii (sprawdzone w `pick/{hex,terrain,camera}.rs`).
2. Skaner `jsmath_wiring` przepuszcza część form — ODDAL (naprawione). Rekurencja, forma `f64::fn(`, pośrednie helpery `pick`. Uwaga FC (bez wpływu na werdykt): forma `<f64>::cos(` nadal uchodzi skanerowi; moja mutacja FC-M1 (`c2 = <f64>::cos(y / 2.0)`) została jednak wykryta przez test liczbowy `terrain_rotation_uses_v8_trig`. Kod nie zawiera tej formy; propozycja ewentualnego domknięcia w osobnym temacie razem z `pick/**`.

TESTY (czysty `CARGO_TARGET_DIR` na `/dev/shm`, usunięty po pracy):
- Na `0fc97d46`: `cargo fmt --all -- --check` FMT_EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; to samo z `--features gpu` EXIT=0; `cargo test --locked --all-targets` EXIT=0 — 12 binariów, 81 testów ok (geom_three_parity 17, terrain_web_parity 5, wonders_web_parity 4, camera_web_parity 5, pick_golden 7, jsmath_v8_parity 13, jsmath_wiring 4).
- Na sondzie scalenia `776acb05`: fmt EXIT=0, clippy EXIT=0, test EXIT=0 (wszystkie wyniki `ok`, 0 failed).
- Wektory: `node v22.22.0 gen.mjs` odtworzony — wszystkie 11 plików `.bin` bajtowo identyczne z commitem.
- Niezależna próbka FC (własny generator, inne ziarno LCG i rozkłady: małe, ±1e3, skala log 1e±20, losowe bity f64, k·π/8; 5 000 przypadków na funkcję, uruchomiony V8 vs `civ_renderer::jsmath`, release): sin/cos/tan/atan/acos/exp/log/atan2/pow/hypot — 0 różnic bitowych dla każdej; glibc na tych samych danych 60 (atan) – 714 (hypot) różnic.
- Mutacja FC-M1 (wyżej): wykryta, plik przywrócony (`git status` czysty).

BLOKADY: brak. Ryzyko szczątkowe poza allowlistą: `pick/**` liczy systemowymi sin/cos/tan (osobny temat). INFRA: kompilacja na tmpfs. NIE_ZMIERZONO: Windows/macOS.

RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (merge na `d925acb3`, bramki na wyniku) → READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
