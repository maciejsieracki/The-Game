STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1
GOAL: RR-T2a (część CPU tematu RR-T2 z P4.3 §5): kamera i teren w `rust-port/renderer` BEZ GPU. Odtwórz w Rust 1:1 z kodu weba (a) kontroler kamery (`gra/src/render/camera.ts`: orbit/pan/zoom, kółko, edge-pan, `blockPointerAt`/`blockWheelAt`, `DRAG_THRESHOLD_PX = 6`, ograniczenia zoomu, jednostki) jako czystą maszynę stanów wejście → parametry kamery (zgodną z modułem `pick::camera` z P4.10), oraz
(b) generator SIATKI terenu (CPU): dla każdego heksu pryzmat 1,008R z wysokościami, kolorami per typ terenu i styl `roblox` (D-RR-8=A), bryły gór/wzgórz, `coastalDrop` 0,045, plaże, woda (`seaSurfaceY` 0,18), mgła przez zerowanie instancji (`ZERO_MATRIX`) — wynik to bufory (pozycje, normalne, kolory, indeksy, macierze instancji) gotowe do wysłania na GPU w kolejnym temacie. Weryfikacja liczbowa względem kodu weba (wektory z uruchomionych funkcji weba w osobnym katalogu scratch, jak w P4.10), nie wizualna.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela: wszędzie, gdzie rendery/grafika — Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `7aab83f5` (P3.18 + renderer P4.8–P4.10) lub nowszą.
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; po zakończeniu usuń swój podkatalog; nie commituj `Cargo.lock` silnika (`rust-port/engine/Cargo.lock`) ani `target/`.
Decyzje właściciela (LEDGER): renderer w Rust, wgpu bezpośrednio, tekst w Rust, tylko styl `roblox`, picking w Rust, wejście zbiera natywna powierzchnia Rust (UI-Q3=B), etykiety zakotwiczone rysuje Rust (UI-Q2=A).
Web: WYŁĄCZNIE odczyt `git show edb8fb56:<ścieżka>` / `git grep`; zakaz `npm run build/dev` w `gra/`. Biblioteki (Three.js 0.169.0, esbuild) wolno pobrać `npm pack`/`npm install` WYŁĄCZNIE do osobnego nowego katalogu scratch poza repo i uruchamiać skrypty węzłowe stamtąd (pobrane pliki niezaufane — CWD poza katalogiem pobranej biblioteki, `node -e` z innego katalogu); wzór: `rust-port/renderer/tests/fixtures/pick/gen.ts` i `README` z P4.10.
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (§3, §4, §5 RR-T2), `p4/P4-10-PICKING-CPU.md` (te same funkcje terenu/kamery, adaptacje, `NIE_ZMIERZONO`), `p4/P4-8-GEOMETRY-PRIMS.md`, `p4/P4-4-MODEL-CATALOG.md` (pliki terenu), `rust-port/renderer/src/{pick,geom,camera}*` na parity-v2.
Nowe zależności: ZAKAZ (std-only). Dodanie `pub mod terrain;` do `src/lib.rs` jest DOZWOLONE (jedyna zmiana `lib.rs`).

ZADANIE
1. `camera`: maszyna stanów kontrolera kamery zgodna z `camera.ts` (wektory testowe z uruchomionego kodu weba dla sekwencji zdarzeń: drag, kółko, edge-pan, bloki wejścia, granice zoomu, czas dt); parametry wyjściowe zgodne z `pick::camera` (nie duplikuj matematyki — użyj/rozszerz istniejącą, jeśli to możliwe bez zmian w `pick`; jeśli potrzebna zmiana w `pick` — BLOCK z opisem).
2. `terrain`: budowa siatek terenu CPU (patrz GOAL) z `scene.ts` (funkcje budujące teren, kolory `TERRAIN_*`/`mapRenderStyle.ts`, instancje, góry/wzgórza) — używając `geom` (P4.8). Wektory referencyjne z uruchomionych funkcji weba (bity/tolerancja 1e-6 jak w P4.8/P4.10), dla map testowych o różnych typach terenu, rozmiarach i seedach; przypadki: plaże, woda, góry, wzgórza, mgła.
3. Dokument: wyprowadzenie z plik:linia, tabela odtworzone/pominięte (z powodem), lista `NIE_ZMIERZONO` (wszystko, co wymaga GPU/obrazu), skrypty referencyjne wklejone, surowe logi.
BINARNE KRYTERIUM: kamera i teren zgodne z wektorami z kodu weba (liczby przypadków w dokumencie; 100% tam, gdzie wektor pochodzi z funkcji weba), bramki renderera EXIT=0 (`cd rust-port/renderer`: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets --features gpu -- -D warnings`, `cargo test --locked --all-targets`), dokument `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1/**`.
Worktree: `rust-port/renderer/src/camera.rs` albo `src/camera/**`, `rust-port/renderer/src/terrain/**` (NOWE) + jedna linia `pub mod terrain;` w `rust-port/renderer/src/lib.rs`, `rust-port/renderer/tests/{camera,terrain}_*.rs`, `rust-port/renderer/tests/fixtures/{camera,terrain}/**`.
Zero zmian w `rust-port/engine/**`, `src/pick/**`, `src/geom/**`, `src/assets/**`, `Cargo.toml`/`Cargo.lock`, `.github/**`, `gra/**`, `src-tauri/**`.
(Równolegle: P3.19 i P3.20 w `rust-port/engine` — nie dotykaj.)

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` z `echo "EXIT=$?"` w dokumencie (nie wyciąg). Każda liczba i twierdzenie ma plik:linia lub komendę. Niepewne = `NIE_ZMIERZONO`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.
IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
