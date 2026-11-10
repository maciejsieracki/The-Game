STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1
GOAL: Paczka MOD-04 (P4-4 §4.2): rdzeń modeli jednostek w Rust — routing z naprawą D-MOD-9=A, getGeo* (88), buildBaseAvatar, buildCategoryModel (20 case), applyCultureOverrides, decorateChariot, attachEmbarkBoat, kon-nowy-model, galera-model, jednostki-p1-rdzen (z nieużywanymi eksportami); delegacje do paczek 5–7 jako jawne stuby; zgodność bitowa z webem.
ZMIANY/COMMIT: kod `1b52238d` na bazie `origin/rust-port/parity-v2` @ `69f432ba` (worktree, bez push): `rust-port/renderer/src/models.rs` (+1 linia), `src/models/unit_core/*.rs` (13 nowych), `tests/unit_core_{json,model_rule,trig,web_parity}.rs`, `tests/fixtures/unit_core/**` (3,0 MB). Dokumentacja w drugim commicie: `dyspozycje/rust-port/p4/P4-13-MOD04-UNIT-CORE.md`, ten raport, `logi/*.txt`, `mutate.py`.
TESTY: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets --features gpu -- -D warnings` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (pełne logi `logi/`). Parytet vs uruchomiony web edb8fb56 (three 0.169.0, node v22.22.0), `to_bits()`: 61 przypadków / 111 368 wartości — 0 rozbieżności; części 88+20+65 — 0; routing 175 wywołań — klasy sygnatur ≡ klasy ModelId, 19 sygnatur równych; nazwy 403 — 0; trig 11 226 — port 0, glibc 792. Mutacje 20/20.
BLOKADY: brak.
UWAGI: (1) ZAŁOŻENIE Z1: `models.rs` jest plikiem, nie `models/mod.rs` — linia modułu dopisana w `models.rs`. (2) Z2: test reguły nazwany `unit_core_model_rule.rs` (allowlista `unit_core_*.rs`). (3) Odkrycie: `Math.sin/cos` V8 ≠ glibc (1 ulp, 792/11 226) — port fdlibm w `unit_core/jstrig.rs`; `camera`/`pick`/`terrain`/`geom` nadal używają std trig (poza allowlistą) → propozycja osobnego tematu. (4) 73 buildery paczek 5–7 = `NotYetPorted` (lista w dokumencie §7). (5) Wygląd 1:1 NIE_ZMIERZONO (GPU) — lista do oceny wzrokiem po RR-T5 w dokumencie §10.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) — odtworzenie fixture wg `tests/fixtures/unit_core/README.md`, bramki, przegląd §1 (założenia) i §7 (stuby).
DEPLOY/PUSH: NIE WYKONANO
