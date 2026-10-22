STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1
GOAL: Paczka MOD-03 z `P4-4-MODEL-CATALOG.md`: dekoracje terenu w Rust 1:1 z kodem weba — `lasy-modele`, `djungla-modele`, `teren-gory-wzgorza` (buildery brył; stałe i `hashHeksa` już w `core`/`pick::terrain` z P4.12/P4.10 — reużyj), `dekor-laki-rowniny`, `oaza-pustynia`, `tarasy-model`, buildery z `mapRenderStyle` (bez stałych już zrobionych w P4.12), `riverLod` (34 warianty: 5+5+2×5+2×4+4 + tarasy 2, oaza, wybrzeże/rzeki wg katalogu). Model = drzewo mesh (geometria CPU z `geom` + parametry materiału jako dane). UWAGA: w crate są już dwa typy drzewa sceny (`core::scene` z P4.12 i `models::wonders::model` z P4.14); NIE dodawaj trzeciego — użyj `core::scene` (a jeśli trzeba, dodaj konwersję/trait), a różnice opisz w dokumencie. Zgodność: liczba mesh/trójkątów/wierzchołków, pozycje, bbox, kolory, hash geometrii dla WSZYSTKICH wariantów i reprezentatywnych ziaren `hashHeksa` (min. 50 ziaren na wariant), bitowo; po P4.16 `jsmath` (jeśli już na `parity-v2`) użyj go zamiast systemowego sin/cos, inaczej odnotuj ryzyko.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (decyzja właściciela: grafika/renderer/UI-wizualia => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz; baza d925acb3 lub nowsza) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`.
Crate: `rust-port/renderer` (`civ-renderer`), BEZ GPU w środowisku, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` nie ruszać. Gate: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets [--features gpu] -- -D warnings`, `cargo test --locked --all-targets` (pełne surowe logi z `echo "EXIT=$?"` w dokumencie).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (paczka tego tematu, D-MOD-1..9), `P4-3-RUST-RENDERER-ARCH.md`, `P4-8-GEOMETRY-PRIMS.md` (+ kod `rust-port/renderer/src/geom/**`), `P4-11-CAMERA-TERRAIN-CPU.md` (wzorzec weryfikacji), `P4-6-RENDERER-CRATE-SCAFFOLD.md`.
WZORZEC WERYFIKACJI (jak w P4.11): wektory referencyjne generuj URUCHAMIAJĄC kod weba z pinu `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu scratch POZA repo; `three@0.169.0` + `esbuild@0.24.0` w scratch; node), zapisz JSON + skrypt generatora (`gen.ts`) + sha256 w `rust-port/renderer/tests/fixtures/<temat>/`. Porównuj BITOWO (`to_bits`) tam, gdzie web daje liczby (liczba wierzchołków/trójkątów/mesh, pozycje, bounding boxy, kolory, hash geometrii); każda niezgodność = BŁĄD albo jawnie opisane odchylenie. Zakaz `npm run build`/`dev`, zakaz zmian w `gra/**`. `scene` bez WebGL: buduj grafy obiektów Three bez renderera (geometrie/materiały/grupy), to wystarczy.
Plik `rust-port/renderer/src/lib.rs`: dopisz TYLKO jedną linię `pub mod <twój_moduł>;` (inne tematy robią to samo równolegle — konflikt w tej jednej linii rozwiąże orkiestrator).
Katalog scratch usuń po pracy; nie commituj fixtur > 8 MB (kompresuj/ogranicz zestaw i opisz, co pominięto).
Brak materiałów/shaderów/GPU: model = drzewo mesh (geometria CPU + parametry materiału jako dane: kolor, roughness/metalness, flagi), bez uploadu na GPU. Jeśli typ mesh/materiału z `geom`/`assets` nie wystarcza, dodaj MINIMALNY typ we własnym module (nie zmieniaj `geom/**`).
Ocena wizualna 1:1 wymaga GPU — oznacz jako NIE_ZMIERZONO dla właściciela; dołącz do dokumentu listę „co ocenić wzrokiem po RR-T5”.
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma plik:linia/komendę; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch; nie generuj pytań ABC.

ALLOWLISTA: `rust-port/renderer/src/decor/**` (NOWY moduł; jedna linia `pub mod decor;` w `src/lib.rs`), `rust-port/renderer/tests/decor_*.rs`, `rust-port/renderer/tests/fixtures/decor/**`, `dyspozycje/rust-port/p4/P4-17-MOD03-TERRAIN-DECOR.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/**`
Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/src/{geom,pick,assets,camera,terrain}/**`.
(Równolegle: P3.22 w `rust-port/engine`; P4.13 `src/models/unit_core/**`, P4.15 `rust-port/spike-gpu-embed/**`, P4.16 `src/jsmath/**` + przepięcie w `geom/terrain/wonders`, P5.1 `src-tauri/frontend-v2/**` — nie dotykaj ich plików; konflikt jednej linii w `lib.rs` rozwiąże orkiestrator.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
