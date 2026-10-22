STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1
GOAL: Paczka MOD-04: rdzeń modeli jednostek w Rust z naprawą D-MOD-9=A, stuby `NotYetPorted` dla paczek 5–7, zgodność bitowa z webem `edb8fb56`.
ZMIANY/COMMIT: oceniany `4e881e11` (Obrona r1) <- `9c30aff8` (dok.) <- `1b52238d` (kod) <- baza `69f432ba`. Ten raport: commit Final Control na `4e881e11` (tylko ten plik). Raport Evaluatora `02-evaluator-r1.md` leży w commicie `6da7fc13` (worktree `wf_590a7af3-626-2`), nie w linii `4e881e11` — orkiestrator dołącza go przy integracji (cherry-pick tylko tego pliku).
TESTY: patrz §2 (wszystko uruchomione samodzielnie przez Final Control).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (Opus 5.5 medium) do `origin/rust-port/parity-v2`.
DEPLOY/PUSH: NIE WYKONANO

# Final Control r1 — P4.13 MOD-04 UNIT-CORE

## 1. Orzeczenia zarzutów Evaluatora r1

| # | Zarzut | Dowód | Orzeczenie |
|---|---|---|---|
| 1 | Brak ZAŁOŻENIA dla kryterium „min. 1 jednostka na kategorię” | Z9 w §1 i akapit §5.2 w `P4-13-MOD04-UNIT-CORE.md` (diff `9c30aff8..4e881e11`); pokrycie: drzewo `buildCategoryModel` per `case` (61 porównanych + 7 jawnych stubów) i klasy sygnatur dla 77 rekordów (175 wywołań). | ODDAL (zamknięte przez Obronę) |
| 2 | Brak logu `--nocapture` | `logi/test-nocapture.txt` z `EXIT=0`; FC powtórzył w czystym targecie — te same liczby. | ODDAL (zamknięte) |
| 3 | `logi/mutate.txt` bez `EXIT=` | Nowy log `detected 22/22, build errors 0`, `EXIT=0`; `mutate.py` liczy błąd budowania jako `BUILD-ERROR`, nie wykrycie. | ODDAL (zamknięte) |
| 4 | Dwie kopie fdlibm (`unit_core/jstrig.rs` i `wonders/js_trig.rs`) | `wonders/**` poza allowlistą, brak w bazie `69f432ba`; rekomendacja osobnego tematu w §5.5 (`R-RUSTPORT-P4-JSTRIG-SHARED-Q1`, roboczo). Duplikacja nie psuje parytetu (oba porty 0 rozbieżności). | ODDAL w tym temacie; orkiestrator rejestruje temat konsolidacji |
| 5 | `quat_from_euler` tylko `debug_assert` porządku XYZ | `model.rs`: `match eu.order` dla 6 porządków; wzory porównane linia po linii z `geom/math.rs:465-500` — identyczne. Test `quat_from_euler_honours_every_order` (5 trójek × 6 porządków, bitowo vs `geom`). Własna mutacja FC (znak w gałęzi `Yxz`, `c1*c2*s3 - s1*s2*c3` -> `+`) zabita: test FAILED, EXIT=101; plik przywrócony. | ODDAL (zamknięte) |
| — | `src/models.rs` (+1 linia) poza dosłowną allowlistą | Dispatch: „w `models/mod.rs` dopisz linię modułu”; w bazie moduł to `models.rs` (Z1). Równoważne. | ODDAL |

Agregat: 0 × NAPRAW, 0 × DO DECYZJI -> PASS.

## 2. Bramki uruchomione samodzielnie (czysty `CARGO_TARGET_DIR` w scratch, `CARGO_INCREMENTAL=0`)

Drzewo `4e881e11`:
- `cargo fmt --all -- --check` EXIT=0
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` EXIT=0
- `cargo test --locked --all-targets -- --nocapture` EXIT=0, 67 passed / 0 failed
- Liczby z logu: `unit_core parity: 68 cases, 61 compared (111368 values bit-exact checked), 7 pending stubs`; `model rule: 175 calls (152 records PL+EN), 19 ported signatures`; `names: 403`; `trig: n=11226 port_mismatch=0 libm_mismatch=792`; `quat_from_euler orders: 5 angle triples x 6 orders`.

Próbne scalenie z `origin/rust-port/parity-v2` @ `d925acb3` (`git merge --no-ff --no-commit 4e881e11`): jedyny konflikt `rust-port/renderer/src/models.rs` (`pub mod wonders;` vs `pub mod unit_core;`), rozwiązany zachowaniem obu linii (`unit_core`, potem `wonders`). Na scaleniu w czystym targecie: fmt / clippy gpu / clippy / test — wszystkie EXIT=0, 84 passed / 0 failed. Scalenie wycofane (`--abort`).

Higiena: `git diff --check 69f432ba 4e881e11` czysty; jedyny plik spoza allowlisty to `src/models.rs` (ODDAL wyżej); `lib.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**`, `geom/pick/assets/camera/terrain` bez zmian.

## 3. Wektory względem weba

Odtworzenie wg `tests/fixtures/unit_core/README.md` w scratch poza repo (three 0.169.0, esbuild 0.24.0, node v22.22.0, `git archive edb8fb56 gra/src gra/data`): `unit_core cases=68 records=77 names=33`, `trig samples=11226`.
- `unit_core.json` SHA-256 `6bb8b2a448aae33c1d30b986313ba6bef732ebe8d84de6e443c808fcc6c28e48` — identyczny z commitem.
- `trig.json` SHA-256 `66c841d910bf18e5964a688e43233d7ac4edf6feb3de3bb8776779236c577df0` — identyczny z commitem.

## 4. Kolejność integracji (dla orkiestratora)

1. `git merge --no-ff 4e881e11` do `rust-port/parity-v2` (@ `d925acb3` lub nowszy) — wnosi `1b52238d`, `9c30aff8`, `4e881e11`.
2. Konflikt `src/models.rs`: zachować `pub mod unit_core;` i `pub mod wonders;`.
3. Dołączyć `02-evaluator-r1.md` z `6da7fc13` oraz ten raport (commit FC).
4. Powtórzyć 4 bramki na scaleniu; dopiero potem `READY_FOR_DEPLOY` (wystawia orkiestrator).
5. Zarejestrować temat konsolidacji fdlibm (`jstrig`/`js_trig`) + przełączenia `geom/camera/pick/terrain`.

NIE_ZMIERZONO (bez zmian): zgodność wizualna 1:1 (wymaga GPU) — lista w §10 dokumentu do oceny po RR-T5.
