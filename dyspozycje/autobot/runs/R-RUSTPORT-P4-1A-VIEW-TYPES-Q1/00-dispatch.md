# DISPATCH R-RUSTPORT-P4-1A-VIEW-TYPES-Q1 (runda 1)

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1A-VIEW-TYPES-Q1 — pierwszy temat z kontraktu DTO renderera (P4-1).
MODEL: Operator (impl i pomiary), Obrona, Evaluator, Final Control — wszystkie **Opus 5.5** (renderer/grafika Rust, zasada właściciela).

GOAL: Typy modelu widoku (DTO) z `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` §3 jako osobny crate `rust-port/view-model` (serde camelCase, JSON-safe), testy JSON (round-trip, nazwy kluczy, niezmiennik ID) i pomiar rozmiaru snapshotu dla map 3000 i 8000 heksów.

DECYZJE TECHNICZNE PRZYJĘTE PRZEZ ORKIESTRATORA (zasada 9: decyzje techniczne podejmuje orkiestrator, zapis w REJESTR-RUST.md):
- D-DTO-1 = A: typy w osobnym crate `rust-port/view-model` (zależy tylko od serde); silnik i renderer zależą od niego.
- D-DTO-2 = B: DTO z newtypami ID; adapter (P4-1G) zamieni na istniejące `String`/`i32`/`i64`. Ten temat NIE zmienia silnika.
- D-DTO-3 = B: statyczna mapa raz, warstwy dynamiczne pełne; pomiar rozmiaru w tym temacie, rewizja po pomiarze (wpisać wynik do dokumentu).

BAZA: `origin/rust-port/parity-v2` (czubek w chwili dispatchu: 525a2ef7b). Przed pracą: `git merge-base --is-ancestor 525a2ef7b HEAD`.
Dokument wejściowy: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` na `origin/claude/rust-sivvrn`, sekcja §3 (typy).

ALLOWLISTA (wszystko poza tym = FAIL):
- `rust-port/view-model/**` (NOWY crate: Cargo.toml, src/**, tests/**)
- `rust-port/Cargo.toml` — WYŁĄCZNIE dopisanie członka workspace, jeśli workspace istnieje
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/**`

ZERO ZMIAN W: `gra/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.lock` (nie commitować).

BRAMKI (EXIT 0, na czystym CARGO_TARGET_DIR poza repo):
- `cargo fmt --check` w `rust-port/view-model`
- `cargo clippy --all-targets -- -D warnings`
- `cargo test --all-targets`
- `git diff --check`

KRYTERIA KOŃCA:
1. Typy §3 zaimplementowane, serde camelCase, każdy typ z testem round-trip JSON.
2. Test nazw kluczy JSON (zgodnych z kontraktem §3, bez dryfu).
3. Test niezmiennika ID (newtypy zachowują wartość po round-trip).
4. Pomiar rozmiaru snapshotu dla 3000 i 8000 heksów: liczby w dokumencie P4-1 §4.1 (arytmetyka vs pomiar, oznaczone).
5. Brak `#[ignore]`, brak osłabionych asercji, `forbid(unsafe_code)`.
6. Każde twierdzenie o webie z dowodem plik:linia (pin `07d2fbd72`).

PROCES: Operator (impl) → Operator (pomiary) → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit z jawnym `git add`, NIGDY `-A`. Bez push na parity, bez deployu.
Commit bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
