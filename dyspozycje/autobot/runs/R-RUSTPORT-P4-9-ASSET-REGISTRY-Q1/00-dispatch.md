STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-9-ASSET-REGISTRY-Q1
GOAL: RR-T6: rejestr zasobów renderera i test regresyjny „N tur nie zwiększa zasobów” (`rust-port/renderer/src/assets/**`) — odpowiedź na wzrost pamięci z tury na turę w wersji webowej (P4-3 §7: M1 model miasta przebudowywany bez zwalniania, M2 cache tekstur plakietek rosnący, M3 niezdejmowane nasłuchiwacze, M6 niewołane `dispose*`). Czysty CPU: abstrakcja czasu życia zasobów niezależna od wgpu (uchwyty, własność, liczenie referencji, pule, budżet, polityka usuwania, zakresy RAII), którą później wypełni warstwa GPU.
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
1. Zaprojektuj i zaimplementuj (std-only, `forbid(unsafe_code)`) rejestr zasobów: typowane uchwyty z generacją (brak użycia po zwolnieniu), rejestr z licznikami (utworzone/zwolnione/aktywne per rodzaj: bufor, tekstura, pipeline, bind group), zakres (`Scope`/RAII), który zwalnia wszystko co utworzył przy `drop`, współdzielenie z liczeniem referencji, cache z polityką usuwania (LRU/limit rozmiaru) i API „podmień model: utwórz nowy, potem zwolnij stary” (kolejność jak w naprawie M1).
2. Mechanizm subskrypcji/nasłuchiwaczy z gwarancją wyrejestrowania (odpowiednik M3): token zwalniany w `drop`; test, że po zamknięciu sceny liczba aktywnych subskrypcji = 0.
3. Budżet i raport: struktura statystyk (do porównań „przed/po N turach”), konfigurowalne progi (D-RR-7 jest nierozstrzygnięte — parametr, domyślnie: aktywne zasoby po 200 turach ≤ po 10 turach, bez narostu).
4. TESTY (CPU): symulacja tur (deterministyczna) odtwarzająca wzorce M1/M2/M3 — wersja „błędna” (bez zwalniania) musi PRZEKRACZAĆ budżet (test negatywny dowodzi, że test wykrywa wyciek), wersja z rejestrem ma pozostać w budżecie po 10/50/200 turach i 2 rozmiarach mapy; test użycia po zwolnieniu (uchwyt przeterminowany daje błąd, nie panikę); test kolejności „nowy przed starym”.
5. Dokument: mapowanie M1/M2/M3/M6 → mechanizm rejestru (jak ma być użyty przez warstwę GPU i modele), ograniczenia (brak pomiaru realnej pamięci GPU — NIE_ZMIERZONO).
BINARNE KRYTERIUM: testy negatywny i pozytywny N tur przechodzą; API bez `unsafe`; bramki EXIT=0; dokument `dyspozycje/rust-port/p4/P4-9-ASSET-REGISTRY.md` z surowymi logami.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu (nie wyciąg) `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` z `echo "EXIT=$?"` w dokumencie. Wartości referencyjne mają źródło (komenda/skrypt wklejone w dokumencie lub fixture z opisem pochodzenia). Niepewne = `NIE_ZMIERZONO`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-9-ASSET-REGISTRY.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-9-ASSET-REGISTRY-Q1/**`. Kod: `rust-port/renderer/src/assets.rs` albo `rust-port/renderer/src/assets/**`, `rust-port/renderer/tests/assets_*.rs`.
Zero zmian w `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `Cargo.toml`/`Cargo.lock`, `rust-port/renderer/src/lib.rs`, `.github/**` oraz w modułach innych tematów. (Równolegle pracują: RR-T3 `pick`, RR-T4 `geom`, RR-T6 `assets` w tym samym crate — każdy WYŁĄCZNIE w swoim module; P3.17 w `rust-port/engine`.)
Moduł będący jednym plikiem (np. `src/geom.rs`) wolno zamienić na katalog `src/geom/mod.rs` + pliki podrzędne BEZ zmiany `lib.rs`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
