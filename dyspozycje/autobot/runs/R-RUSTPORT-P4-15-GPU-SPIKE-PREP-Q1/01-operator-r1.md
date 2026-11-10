STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1
ROLA: Operator (Opus 5.5 medium) · RUNDA: 1/5
GOAL: Przygotować spike RR-T1 (wgpu pod przezroczystym webview w Tauri, M1/M2, IPC, pamięć, fokus, pełny ekran) do uruchomienia przez właściciela jedną komendą na maszynie z GPU, z procedurą i szablonem raportu.

BAZA: `origin/rust-port/parity-v2` = `69f432ba1987fd58d6f06eeb25a96827a4017c28` (`git checkout --detach`), izolowany worktree.

ZMIANY/COMMIT (allowlista, wyłącznie nowe pliki):
- `rust-port/spike-gpu-embed/**` — crate `spike-gpu-embed` (poza workspace'ami), Cargo.lock commitowany (trzeci wyjątek, uzasadnienie: P4-15 §2.3).
- `dyspozycje/rust-port/p4/P4-15-GPU-SPIKE.md` — opis, mapowanie na NIE_ZMIERZONO, instrukcja PL, tabela platform, szablon raportu.
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1/01-operator-r1.md` + `logi-r1/*.txt` (surowe logi z EXIT=).
- Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `.github/**`.
- SHA commita: podany w odpowiedzi Operatora (commit w worktree, bez push).

TESTY (logi w `logi-r1/`):
- `cargo test --locked --no-default-features` → EXIT=0, 33 passed (07).
- `cargo test --locked --no-default-features --features gpu` → EXIT=0, 36 passed, `SKIPPED: no GPU adapter` (08).
- `cargo clippy --locked --all-targets --no-default-features --features gpu -- -D warnings` → EXIT=0 (09).
- `cargo check --locked --target x86_64-pc-windows-msvc` → EXIT=101 przed korektą locka (04), EXIT=0 po `cargo update -p gpu-allocator` (05); `cargo clippy … --target x86_64-pc-windows-msvc -- -D warnings` → EXIT=0 (10).
- `cargo check --locked` (Linux, cecha `app`) → EXIT=101: brak `gdk-3.0` (03) — środowisko; kod Linux NIE_ZMIERZONO.
- `cargo check --locked --target aarch64-apple-darwin` → EXIT=101: `objc2-exception-helper` (06) — środowisko; kod macOS NIE_ZMIERZONO.
- `cargo fmt --all -- --check` → EXIT=0 (11); `node --check ui/spike.js` → EXIT=0.
- Uruchomienie spike'a (punkty 1–7): NIE_ZMIERZONO na każdej platformie (brak GPU/okna/WebView).

USTALENIE: złączony lock Tauri+wgpu przypiął `gpu-allocator 0.28.0` do `windows 0.61.3` → błędy typów w `wgpu-hal` dx12 na Windows; naprawione `cargo update -p gpu-allocator` (→ `windows 0.62.2`). Dotyczy też przyszłej integracji wgpu w `src-tauri` (P4-15 §2.4).

ZAŁOŻENIA: Z-S1…Z-S13 w P4-15 §6 (progi IPC 16,7 ms i pamięci 32 MiB, komendy async, współrzędne GDK = CSS, M2 tylko przy M1≠PASS, `tauri-build` jako build-dep, `macos-private-api` bez `unstable`, domyślna cecha `app`).

BLOKADY: brak blokad tematu. Ograniczenia środowiska (jawne): brak GTK/WebKit i kompilatora Apple → kod Linux/macOS niezweryfikowany kompilacją; brak GPU → punkty 1–7 do zmierzenia u właściciela.

SPRZĄTANIE: `CARGO_TARGET_DIR` w scratchpadzie usunięty; cele rustup `x86_64-pc-windows-msvc`, `aarch64-apple-darwin` (dodane tylko do `cargo check`) usunięte.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) → Final Control → integracja orkiestratora; potem uruchomienie u właściciela wg P4-15 §3 i odesłanie raportu wg §5.
DEPLOY/PUSH: NIE WYKONANO
