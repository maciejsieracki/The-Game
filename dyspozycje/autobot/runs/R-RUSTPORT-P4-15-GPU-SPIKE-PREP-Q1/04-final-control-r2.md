STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1
GOAL: Przygotować spike RR-T1 (wgpu pod przezroczystym webview Tauri; M1/M2, IPC, pamięć, fokus, pełny ekran) tak, żeby właściciel uruchomił go jedną komendą na maszynie z GPU i odesłał raport JSON.

ZMIANY/COMMIT: oceniany stan `ac69ea18` (Obrona/Operator r2) na `973ccb25` (Operator r1) na `69f432ba`. Commit Obrony istnieje, nie odtwarzano go. Pliki 69f432ba..ac69ea18: 50, wszystkie `A`, wszystkie w allowliście (`rust-port/spike-gpu-embed/**`, `dyspozycje/rust-port/p4/P4-15-GPU-SPIKE.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1/**`). `git diff --check 69f432ba ac69ea18` czysty. `Cargo.lock` spike'a bez zmian między r1 i r2.

ORZECZENIA (na podstawie kodu i własnych bramek):
1. Okno konsoli PowerShell w buildzie GUI — ODDAL (naprawione). `memory.rs`: Windows+`app` używa `GetProcessMemoryInfo` w procesie (bez `Command`); PowerShell tylko w `cfg(all(windows, not(feature="app")))` z `CREATE_NO_WINDOW`. Jedyne inne `Command::new`: `ps` (macOS, brak konsoli) i `sleep` (test). Kompilacja potwierdzona własnym clippy Windows `app` (dev i `--release`).
2. Pamięć webview — ODDAL (naprawione). Suma RSS potomków (Windows ToolHelp, Linux `/proc`), macOS jawnie NIE_ZMIERZONO z powodem; licznik `generate_allocator_report()`; schemat `spike-gpu-embed/2`. Test `reads_child_memory_on_linux` przechodzi na prawdziwym procesie potomnym.
3. Mapowanie odwrotne — ODDAL (naprawione). P4-15 §1a ma tabele dla P4-3 §9 pkt 1–16 i P4-5B §15 pkt 1–15; sześć wskazanych pozycji opisanych zgodnie z zarzutem (NIE/CZĘŚCIOWO z powodem); `maps_to` w `report.rs` ma `CZESCIOWO`.
4. Logi — ODDAL (naprawione). `logi-r2/01` odtwarza zasianie locka i `cargo update -p gpu-allocator` z EXIT= i `diff` z commitowanym (EXIT=0); `logi-r2/02` = `node --check`; rozbieżność liczby logów r1 wyjaśniona w P4-15 §10.
Uwaga nieblokująca (M2 + pełny ekran) — ODDAL: udokumentowana w P4-15 §7 pkt 8, nie unieważnia wyniku (7).
Agregat: 0 × NAPRAW, 0 × DO DECYZJI CZŁOWIEKA → PASS.

TESTY (własne, kopia drzewa `ac69ea18` w scratchpadzie, czysty `CARGO_TARGET_DIR`, `CARGO_INCREMENTAL=0`, rustc 1.97.0; target i cel rustup usunięte po pracy):
- `cargo fmt --check` → EXIT=0
- `cargo test --locked --no-default-features` → EXIT=0, 39 passed
- `cargo test --locked --no-default-features --features gpu` → EXIT=0, 42 passed, `SKIPPED: no GPU adapter`
- `cargo clippy --locked --all-targets -D warnings` Linux CPU / gpu → EXIT=0 / EXIT=0
- `cargo clippy --locked --all-targets --target x86_64-pc-windows-msvc -D warnings`: `app` (domyślne) → EXIT=0; `app --release` → EXIT=0; gpu → EXIT=0; CPU → EXIT=0
- `node --check ui/spike.js` → EXIT=0
- Linux `app` i macOS: nie odtwarzane; przyjęte logi środowiskowe (brak `gdk-3.0`, brak kompilatora Apple) — NIE_ZMIERZONO.
- Próbka wektorów względem funkcji weba: nie dotyczy (temat bez parytetu z webem; spike nie portuje funkcji weba).
- Punkty (1)–(7) na GPU/WebView: NIE_ZMIERZONO (brak GPU/okna) — zgodnie z regułą anty-halucynacyjną.

INTEGRACJA: `git merge-tree --merge-base 69f432ba origin/rust-port/parity-v2 ac69ea18` → czysto (drzewo `b0128e3b`). Baza przesunęła się do `bf59164b`; między `69f432ba` a `bf59164b` nie zmieniono `src-tauri/Cargo.{toml,lock}`, `rust-port/renderer/Cargo.lock` ani `rust-port/spike-gpu-embed/**`. Kolejność: rebase/cherry-pick `973ccb25` → `ac69ea18` → ten raport FC na aktualny `origin/rust-port/parity-v2`.

BLOKADY: brak blokad tematu. Ograniczenia środowiska bez zmian (GTK/WebKit, Apple SDK, GPU).
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (kolejność wyżej) → READY_FOR_DEPLOY (wystawia orkiestrator) → przebieg u właściciela wg P4-15 §3, raport wg §5.
DEPLOY/PUSH: NIE WYKONANO
