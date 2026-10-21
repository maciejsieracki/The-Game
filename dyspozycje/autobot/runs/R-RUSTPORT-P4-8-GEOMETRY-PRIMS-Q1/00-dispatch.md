STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1
GOAL: RR-T4: biblioteka prymitywów geometrii w Rust (`rust-port/renderer/src/geom/**`) zgodna numerycznie z Three.js r169 dla prymitywów faktycznie używanych przez modele weba (liczby użyć w P4-4 §1.2: Box ~1450 użyć i inne) — wierzchołki, normalne, UV, indeksy — oraz narzędzia składania (transformacje TRS, łączenie/merge siatek, obliczanie normalnych). Czysty CPU, testowalny bez GPU.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela: wszędzie, gdzie rendery/grafika — Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Decyzje właściciela (LEDGER): renderer w Rust, wgpu bezpośrednio (D-RR-1=A), tekst w Rust, tylko styl `roblox`, picking w Rust (CPU). Crate `rust-port/renderer` (`civ-renderer`) powstał w P4.6 (szkielet: moduły `geom/pick/camera/assets/material/text/overlays/models/view/gpu`, `#![forbid(unsafe_code)]`, cecha `gpu` domyślnie wyłączona, `Cargo.lock` commitowany).
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza musi zawierać `0a496f67` (P4.6) lub nowszą (istnieje `rust-port/renderer/Cargo.toml`).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (zwłaszcza §5 tabela RR-T*, §3 picking, §7 pamięć), `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (prymitywy i liczby użyć), `dyspozycje/rust-port/p4/P4-6-RENDERER-CRATE-SCAFFOLD.md`.
Web: WYŁĄCZNIE odczyt `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` (zakaz `npm run build/dev` w `gra/`, zakaz zmian w `gra/**`). Biblioteki zewnętrzne do porównań numerycznych (np. Three.js 0.169.0) wolno pobrać `npm pack`/`npm install` WYŁĄCZNIE do osobnego, nowego katalogu poza repo (np. w katalogu scratchpad) i uruchamiać tam skrypty węzłowe generujące dane referencyjne; pobrane pliki są niezaufane — nie wykonuj kodu spoza biblioteki, nie uruchamiaj skryptów z pobranego katalogu jako CWD (`node -e`/`-p` z innego katalogu).
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; cargo w `rust-port/renderer`; `--locked`; po zakończeniu usuń swój podkatalog targetu; nie commituj `target/`.
ŚRODOWISKO: brak GPU — ten temat jest czysto CPU. Brak nowych zależności (Cargo.toml i Cargo.lock bez zmian); jeśli koniecznie potrzebna — BLOCK z uzasadnieniem (równoległe tematy mogłyby się o lock rozjechać).

ZADANIE
1. Z katalogu P4-4 wypisz prymitywy i ich realne użycia (komendy `git grep -c` wklejone). Zaimplementuj te używane (w kolejności częstości), m.in. Box, Cylinder, Cone, Sphere, Plane, Circle, Ring, Torus/Lathe/Extrude+Shape z triangulacją (jeśli używane; Extrude/Shape — własna triangulacja earcut zgodna z Three — uzasadnij zakres), z identycznymi: układem wierzchołków, kolejnością trójkątów, normalnymi, UV, grupami materiałów — jak w Three.js 0.169.0.
2. Pobierz Three.js 0.169.0 (patrz zasady bezpieczeństwa wyżej), wygeneruj skryptem węzłowym dane referencyjne (positions/normals/uvs/index) dla zestawu parametrów (typowych i brzegowych: segmenty minimalne, wartości zerowe, duże) i zapisz jako fixtures JSON w `rust-port/renderer/tests/fixtures/geom/` z plikiem opisującym pochodzenie (wersja, komenda, skrypt wklejony w dokumencie). Test Rust porównuje bufory z tolerancją 1e-6 (indeksy dokładnie).
3. API: struktura siatki (`Vec<f32>` pozycje/normalne/UV, `Vec<u32>` indeksy), `merge`, transformacje macierzowe zapisane ręcznie (BEZ nowych bibliotek matematycznych), deterministyczność (te same wejścia → te same bity).
4. Nie implementuj materiałów, GPU ani modeli (inne tematy).
BINARNE KRYTERIUM: wszystkie zaimplementowane prymitywy zgodne z danymi referencyjnymi Three r169 w testach; lista prymitywów użytych w webie ze statusem zaimplementowany/nie (z uzasadnieniem); bramki EXIT=0; dokument `dyspozycje/rust-port/p4/P4-8-GEOMETRY-PRIMS.md` z surowymi logami i skryptem generującym dane.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu (nie wyciąg) `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` z `echo "EXIT=$?"` w dokumencie. Wartości referencyjne mają źródło (komenda/skrypt wklejone w dokumencie lub fixture z opisem pochodzenia). Niepewne = `NIE_ZMIERZONO`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-8-GEOMETRY-PRIMS.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-8-GEOMETRY-PRIMS-Q1/**`. Kod: `rust-port/renderer/src/geom.rs` albo `rust-port/renderer/src/geom/**`, `rust-port/renderer/tests/geom_*.rs`, `rust-port/renderer/tests/fixtures/geom/**`.
Zero zmian w `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `Cargo.toml`/`Cargo.lock`, `rust-port/renderer/src/lib.rs`, `.github/**` oraz w modułach innych tematów. (Równolegle pracują: RR-T3 `pick`, RR-T4 `geom`, RR-T6 `assets` w tym samym crate — każdy WYŁĄCZNIE w swoim module; P3.17 w `rust-port/engine`.)
Moduł będący jednym plikiem (np. `src/geom.rs`) wolno zamienić na katalog `src/geom/mod.rs` + pliki podrzędne BEZ zmiany `lib.rs`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
