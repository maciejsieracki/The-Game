STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-6-RENDERER-CRATE-SCAFFOLD-Q1
GOAL: Decyzje właściciela (LEDGER 2026-10-21): renderer w Rust, silnik = wgpu bezpośrednio (D-RR-1=A), tekst rysowany w Rust (D-RR-4=A), tylko styl `roblox` (D-RR-8=A). Utwórz SZKIELET crate'a renderera `rust-port/renderer`
(plan P4.3 §5, temat-kandydat „RR-T0” — przygotowanie pod RR-T2/T3/T4/T6): samodzielny crate (jak `rust-port/engine`, bez workspace), podział na moduły CPU (czysta matematyka, testowalna bez GPU) i GPU (feature),
workflow CI, test sondujący adapter GPU, który w środowisku bez GPU jest jawnie pomijany z powodem. To NIE jest implementacja renderera — tylko szkielet, który umożliwia równoległą pracę kolejnych tematów bez kolizji plików.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela 2026-10-21: wszędzie, gdzie wchodzą rendery i grafika — Opus 5.5 medium;
  R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `17454b33` (P3.16) lub nowszą.
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (zwłaszcza §1 silnik/MSRV, §2 osadzenie, §5 tematy RR-T*, §7.3 rejestr zasobów, §9 czego nie da się zmierzyć), `.github/workflows/rust-engine.yml` (wzór CI),
`rust-port/engine/Cargo.toml` (konwencje: edition, metadane), `src-tauri/Cargo.toml`.
ŚRODOWISKO: brak GPU (`/dev/dri`), brak sterownika Vulkan/EGL — testy GPU nie uruchomią się; dostęp do crates.io jest (build ONLINE dozwolony dla nowego crate'a). Rust lokalny 1.97.0.
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; cargo w `rust-port/renderer`; po zakończeniu usuń swój podkatalog targetu; NIE commituj `target/`.
`Cargo.lock`: dla crate'a biblioteki/binarnego w tym projekcie dotąd nie commitowano lock-ów — ZDECYDUJ i UZASADNIJ w dokumencie (zalecenie: commituj `rust-port/renderer/Cargo.lock`, bo wgpu ma wiele zależności przechodnich i dryf wersji jest ryzykiem; to jedyny wyjątek od „bez Cargo.lock”).

ZADANIE
1. `rust-port/renderer/Cargo.toml`: nazwa `civ-renderer`, edition 2021, `rust-version = "1.87"`, zależność `wgpu` przypięta do dokładnej wersji (`=30.0.1`) za FEATURE `gpu` (domyślnie WYŁĄCZONY lub włączony — uzasadnij; kod CPU musi się kompilować i testować bez GPU);
   inne zależności minimalne i uzasadnione (np. `bytemuck` dla buforów) — bez bibliotek matematycznych/ECS bez uzasadnienia; sprawdź licencje (MIT/Apache) i wypisz drzewo zależności (`cargo tree --depth 1`).
2. Szkielet modułów (każdy z krótkim `//!` opisem zakresu i odwołaniem do tematu RR-T*, bez atrap logiki udających działanie): `geom` (RR-T4), `pick` (RR-T3/T13), `camera` (RR-T2/T12), `assets` (rejestr zasobów, RR-T6), `material` (RR-T5), `text` (RR-T8), `overlays` (RR-T9), `models` (RR-T7), `view` (DTO widoku, RR-T13).
   Moduły bez implementacji NIE mogą eksportować funkcji udających działanie — wystarczą puste moduły z opisem; kompilacja bez ostrzeżeń.
3. `src/lib.rs` z `#![forbid(unsafe_code)]` jeśli możliwe (uzasadnij wyjątki dla warstwy GPU), feature `gpu`.
4. Test `tests/gpu_probe.rs` (cfg feature `gpu`): próba utworzenia instancji i adaptera wgpu; brak adaptera => test KOŃCZY SIĘ SUKCESEM z jawnym komunikatem „SKIPPED: no GPU adapter” i zapisem do wyjścia (nie ciche zaliczenie) — a w środowisku z GPU wypisuje nazwę adaptera/backend. Jeden test CPU sanity (np. kompilacja i `cargo test` bez cechy).
5. `.github/workflows/rust-renderer.yml`: fmt, clippy `-D warnings`, test (bez GPU) na ubuntu-latest, `paths: rust-port/renderer/**` + sam workflow, wzorowany na `rust-engine.yml` (bez zmiany tamtego pliku). Windows jako osobny job opcjonalnie — opisz.
6. Dokument `dyspozycje/rust-port/p4/P4-6-RENDERER-CRATE-SCAFFOLD.md`: struktura, decyzje (Cargo.lock, feature gpu), PEŁNE surowe wyjścia `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` (bez i z `--features gpu`) z `echo "EXIT=$?"`; co NIE jest zmierzone (GPU).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez surowego logu z EXIT. Zakaz atrap (puste funkcje udające działanie). Wszystko, czego nie da się zmierzyć bez GPU = `NIE_ZMIERZONO`. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
`cargo fmt --check`, `clippy -D warnings`, `cargo test` (bez cechy i z `--features gpu`) EXIT=0 w `rust-port/renderer`; test sondujący pomija się jawnie bez GPU; workflow CI poprawny składniowo (sprawdź przez parser YAML); dokument z surowymi logami; zero zmian poza allowlistą.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-6-RENDERER-CRATE-SCAFFOLD.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-6-RENDERER-CRATE-SCAFFOLD-Q1/**`.
Worktree: `rust-port/renderer/**` (NOWE, w tym ewentualny `Cargo.lock` wg decyzji powyżej), `.github/workflows/rust-renderer.yml` (NOWY). Zero zmian w `rust-port/engine/**`, `src-tauri/**` (podniesienie `rust-version` jest częścią spike'u RR-T1), `gra/**`, `.github/workflows/rust-engine.yml`.
(Równolegle: P4.4 katalog modeli, P3.13 kontrola bramki P3 — dokumenty; nie dotykaj.)

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator uprawnień — zostaw zmiany w indeksie i opisz dokładnie (nie obchodź blokady).
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
