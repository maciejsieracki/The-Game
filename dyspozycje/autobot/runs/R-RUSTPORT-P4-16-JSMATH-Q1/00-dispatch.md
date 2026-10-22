STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-16-JSMATH-Q1
GOAL: Wspólny moduł `jsmath` w `rust-port/renderer` — bitowo zgodne z V8 `Math.sin/cos/tan/atan2/pow/hypot/exp/log` (fdlibm jak w V8; wzorzec: `src/models/wonders/js_trig.rs` z P4.14 oraz `src/terrain/jsmath.rs` z P4.11), tak aby `geom` (walce, `Quat::from_euler`, tor, sfery itd.), `terrain` i `models/wonders` używały JEDNEJ implementacji zamiast funkcji systemowych (glibc różni się od V8 w ostatnim bicie; w P4.14 912 różnic ≤1e-12 do czasu przeniesienia fdlibm). Zakres: (1) stwórz `src/jsmath/mod.rs` (publiczne funkcje + dokumentacja zakresu argumentów; poza zakresem → jawny fallback i flaga), przenieś kod z `js_trig.rs` i `terrain/jsmath.rs` (zachowaj ich publiczne ścieżki jako re-eksport, by nie złamać testów), (2) przepnij `geom/**` na `jsmath` WSZĘDZIE, gdzie web woła `Math.sin/cos/...` (kontrola: `git grep -n "\.sin()\|\.cos()\|\.tan()\|\.atan2\|\.powf\|\.hypot" rust-port/renderer/src`), (3) wektory z URUCHOMIONEGO V8: dla każdej funkcji ≥ 20 000 argumentów (przedziały: małe, ±π·k, duże do 1e6, specjalne: 0, -0, NaN, ±Inf, subnormalne) → porównanie BITOWE (`to_bits`), (4) re-uruchom WSZYSTKIE istniejące testy zgodności (`geom_*`, `terrain_web_parity`, `wonders_web_parity`, `camera_web_parity`, `pick_*`) — muszą pozostać zielone bez zmiany fixtur; jeśli któryś fixtur się zmieni (bo dotąd był „blisko, ale nie bitowo”), WYLISTUJ i uzasadnij.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (renderer/matematyka grafiki; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2` (zawiera P4.14). Dokumenty z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show origin/...:<ścieżka>`): `p4/P4-14-MOD12-WONDERS.md` (§ fdlibm/V8, uwaga U3), `p4/P4-11-CAMERA-TERRAIN-CPU.md`, `p4/P4-8-GEOMETRY-PRIMS.md`.
WZORZEC WERYFIKACJI jak w P4.11/P4.14: wektory generuj URUCHAMIAJĄC kod w node (V8) w katalogu scratch POZA repo (`three@0.169.0`, `esbuild@0.24.0` tylko jeśli potrzebne), zapisz `gen.ts`/`gen.mjs` + JSON + sha256 w `rust-port/renderer/tests/fixtures/jsmath/` (≤ 8 MB), porównanie bitowe. Bramki: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets [--features gpu] -- -D warnings`, `cargo test --locked --all-targets` w czystym `CARGO_TARGET_DIR` (usuń po pracy), pełne surowe logi z `echo "EXIT=$?"` w dokumencie. Bez nowych zależności, bez `unsafe`, `Cargo.lock` nie ruszać. Test mutacyjny: ≥ 10 mutacji współczynników/gałęzi, wszystkie wykryte.
Równolegle pracują P4.12 (`src/core/**`), P4.13 (`src/models/unit_core/**`), P4.15 (`rust-port/spike-gpu-embed/**`) i P3.19 (engine) — nie dotykaj ich plików; w `src/lib.rs` dopisz co najwyżej jedną linię `pub mod jsmath;` (konflikt jednej linii rozwiąże orkiestrator).
DOKUMENTY (NOWE): `dyspozycje/rust-port/p4/P4-16-JSMATH.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-16-JSMATH-Q1/**`.
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o V8/webie ma komendę/plik:linia; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i nie generuj pytań ABC; luki rozstrzygaj ZAŁOŻENIEM zapisanym w dokumencie.

BINARNE KRYTERIUM SUKCESU
Jedna implementacja `jsmath` używana przez geom/terrain/wonders (dowód `git grep`: brak funkcji systemowych tam, gdzie web używa Math.*), bitowa zgodność z V8 dla ≥ 20 000 argumentów na funkcję, wszystkie dotychczasowe testy zgodności zielone, mutacje wykryte, bramki EXIT=0, zero zmian poza allowlistą.

ALLOWLISTA
`rust-port/renderer/src/jsmath/**` (NOWY), `rust-port/renderer/src/{geom,terrain}/**` i `rust-port/renderer/src/models/wonders/js_trig.rs` (WYŁĄCZNIE przepięcie na `jsmath` i re-eksporty), `rust-port/renderer/tests/jsmath_*.rs`, `rust-port/renderer/tests/fixtures/jsmath/**`, jedna linia w `src/lib.rs`, `dyspozycje/rust-port/p4/P4-16-JSMATH.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-16-JSMATH-Q1/**`. Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `src/{pick,assets,camera,core,models/unit_core}/**`.
IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
