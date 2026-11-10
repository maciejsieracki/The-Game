STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1
ROLA: Operator (obrona, Opus 5.5 medium) · RUNDA: 2/5
GOAL: Przygotować spike RR-T1 (wgpu pod przezroczystym webview Tauri; M1/M2, IPC, pamięć, fokus, pełny ekran) do uruchomienia przez właściciela jedną komendą na maszynie z GPU, z procedurą i szablonem raportu JSON.

BAZA: commit Operatora r1 `973ccb25` (rodzic `69f432ba` = `origin/rust-port/parity-v2` z dispatchu), izolowany worktree.

ODPOWIEDZI NA ZARZUTY (Evaluator r1, FAIL) — szczegóły i dowody: P4-15 §10.
1. (blokujący) PowerShell bez CREATE_NO_WINDOW przy windows_subsystem="windows" — PRZYJMUJĘ. Ścieżka `app` na Windows czyta pamięć w procesie (`GetProcessMemoryInfo`), nie uruchamia żadnego procesu; PowerShell tylko bez `app` i z `CREATE_NO_WINDOW`. Dowód: logi-r2/08, 09, 11.
2. (5) bez pamięci webview — PRZYJMUJĘ. (5b) suma RSS + lista procesów potomnych (Windows ToolHelp, Linux /proc), macOS jawnie NIE_ZMIERZONO (XPC); (5c) licznik `generate_allocator_report()` wgpu. Status (5) nadal z RSS procesu (Z-S14). Schemat raportu `spike-gpu-embed/2`. Dowód: logi-r2/04 (testy, w tym prawdziwy proces potomny).
3. Brak tabeli odwrotnej / zawyżone pokrycie — PRZYJMUJĘ. P4-15 §1a: wszystkie pozycje P4-3 §9 (1–16) i P4-5B §15 (1–15) z TAK/CZĘŚCIOWO/NIE i powodem; `maps_to` w raporcie z `CZESCIOWO`.
4. Brak surowych logów — PRZYJMUJĘ. logi-r2/01: odtworzenie zasiania locka kopią src-tauri/Cargo.lock + `cargo update -p gpu-allocator` → lock bajtowo identyczny z commitowanym (diff EXIT=0); logi-r2/02 node --check. logi-r1/02 nigdy nie istniał; logi-r1 ma 12 plików (r1 błędnie podał 11). logi-r1 bez zmian.
U. M2 bez resize okna-dziecka — PRZYJMUJĘ dokumentacyjnie (P4-15 §7 pkt 8).

TESTY (logi-r2/, skrypt logi-r2/gates-r2.sh, CARGO_INCREMENTAL=0, CARGO_TARGET_DIR w scratchpadzie, rustc 1.97.0):
- 01 odtworzenie locka → EXIT=0, diff z commitowanym EXIT=0
- 02 node --check ui/spike.js → EXIT=0
- 03 cargo check --locked (Linux app) → EXIT=101, brak gdk-3.0 (środowisko)
- 04 cargo test --locked --no-default-features → EXIT=0, 39 passed
- 05 cargo test --locked --no-default-features --features gpu → EXIT=0, 42 passed, SKIPPED: no GPU adapter
- 06/07 clippy -D warnings Linux gpu/CPU → EXIT=0
- 08/09 clippy -D warnings x86_64-pc-windows-msvc app/CPU → EXIT=0
- 10 cargo fmt --check → EXIT=0
- 11 grep powershell/CREATE_NO_WINDOW → EXIT=0
- macOS: nie odtwarzane (brak kompilatora Apple, jak r1). Uruchomienie (1)–(7): NIE_ZMIERZONO.

BLOKADY: brak blokad tematu. Ograniczenia środowiska bez zmian (GTK/WebKit, Apple, GPU).
SPRZĄTANIE: CARGO_TARGET_DIR i kopia crate'a w scratchpadzie usunięte; cel rustup x86_64-pc-windows-msvc usunięty; `gen/` (tauri-build, ignorowany) usunięty.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 → Final Control → integracja orkiestratora (rebase na aktualny origin/rust-port/parity-v2).
DEPLOY/PUSH: NIE WYKONANO
