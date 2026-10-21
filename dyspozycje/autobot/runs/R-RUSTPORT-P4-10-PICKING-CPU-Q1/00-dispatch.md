STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-10-PICKING-CPU-Q1
GOAL: RR-T3: picking na CPU (piksel → hex/obiekt) w Rust (`rust-port/renderer/src/pick/**`), odtwarzający algorytm weba z kodu (`gra/src/input/picker.ts`, `render/camera.ts`, `render/hexutil.ts`/`hexShape.ts`, `main.ts` `pickHexAt` ~l.1885) wraz z dziwactwami opisanymi w P4-3 §3.5–3.8 (boki pryzmów, bryły gór/wzgórz, pierwszeństwo jednostek, nakładanie 1,008R, `coastalDrop` 0,045, 0,18 vs 0,22 dla PlytkieMorze, dwa warianty `worldToAxial` i remis `dr == ds`, semantyka `Math.round`). Decyzja domyślna orkiestratora (D-RR-3, do rewizji przez właściciela): odtwarzamy zachowanie 1:1. Czysty CPU.
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
1. Na podstawie kodu weba (git show edb8fb56) i P4-3 §3 zaimplementuj w `pick`: parametry kamery perspektywicznej (zgodnie z `camera.ts`/`scene.ts`: fov 50, near 0,5, yaw 0, pozycja bazowa i promień), konwersję piksel→NDC→promień (własna macierz/odwrócenie — bez zewnętrznych bibliotek), przecięcie promienia z pryzmami heksów (promień 1,008R, wysokości terenu), bryłami gór/wzgórz i jednostkami (pierwszeństwo jednostek), ścieżkę awaryjną `worldToAxial` (oba warianty; dla klików obowiązuje wariant z `picker.ts`) oraz zaokrąglanie zgodne z `Math.round` (nie `f64::round`; recepta P4-3 §3, zweryfikowana).
2. Dane referencyjne: wyciągnij CZYSTE funkcje matematyczne weba (bez DOM/Three) do skryptu węzłowego uruchamianego w osobnym katalogu scratch (kopiuj literalnie, nie przepisuj z pamięci), wygeneruj wektory testowe (piksele→oczekiwany hex/obiekt dla różnych kamer, rozmiarów viewportu, krawędzi hexów, remisów, wzgórz, plaż, nakładania) i zapisz jako fixtures JSON w `rust-port/renderer/tests/fixtures/pick/` z opisem pochodzenia (skrypt wklejony w dokumencie). Jeśli część zachowania zależy od siatki Three.js (raycast po trójkątach), zaimplementuj analitycznie i zaznacz zgodność jako `NIE_ZMIERZONO` tam, gdzie nie ma wektora z weba; podaj listę przypadków do weryfikacji na realnym webie przez właściciela.
3. Hover-picking dodatkowych obiektów (gwiazdki weterana, pigułki miast — P4-3 RR-T13) NIE jest zakresem tego tematu; tylko API, które da się rozszerzyć.
4. Dokument: wyprowadzenie matematyki z plik:linia, tabela dziwactw (odtworzone/pominięte + powód), lista wektorów testowych i przypadków `NIE_ZMIERZONO`.
BINARNE KRYTERIUM: testy porównują wynik pickingu Rust z wektorami weba (co najmniej kilkadziesiąt przypadków, w tym brzegowe i remisy) – zgodnie 100% tam, gdzie wektor pochodzi z funkcji weba; bramki EXIT=0; dokument `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md` z surowymi logami i skryptem referencyjnym.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu (nie wyciąg) `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` z `echo "EXIT=$?"` w dokumencie. Wartości referencyjne mają źródło (komenda/skrypt wklejone w dokumencie lub fixture z opisem pochodzenia). Niepewne = `NIE_ZMIERZONO`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-10-PICKING-CPU-Q1/**`. Kod: `rust-port/renderer/src/pick.rs` albo `rust-port/renderer/src/pick/**`, `rust-port/renderer/tests/pick_*.rs`, `rust-port/renderer/tests/fixtures/pick/**`.
Zero zmian w `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `Cargo.toml`/`Cargo.lock`, `rust-port/renderer/src/lib.rs`, `.github/**` oraz w modułach innych tematów. (Równolegle pracują: RR-T3 `pick`, RR-T4 `geom`, RR-T6 `assets` w tym samym crate — każdy WYŁĄCZNIE w swoim module; P3.17 w `rust-port/engine`.)
Moduł będący jednym plikiem (np. `src/geom.rs`) wolno zamienić na katalog `src/geom/mod.rs` + pliki podrzędne BEZ zmiany `lib.rs`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
