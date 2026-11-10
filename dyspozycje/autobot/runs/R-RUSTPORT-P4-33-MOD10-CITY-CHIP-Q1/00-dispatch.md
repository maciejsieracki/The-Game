STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1
GOAL: MOD-10 (`R-RUSTPORT-P4-MOD-10-CITY-CHIP` z `P4-4-MODEL-CATALOG.md`) w `rust-port/renderer` (baza `parity-v2` ≥ `95b91471`: raster shapes/text/image, atlas (P4.31) i units::overlay (P4.32) zintegrowane): nakładki miast rysowane przez `Canvas2dLite` — port 1:1 `gra/src/render/cityMapStatChip.ts` (1133 LOC; klucze tekstur przez `raster::atlas`), `cityOkolicaOverlay.ts`, `workerFieldOverlay.ts` (pin `edb8fb56`): wszystkie wywołania `ctx.*`, układ, kolory, teksty (fonty `raster::text`, emoji/SVG `raster::image`; emoji R4 wg decyzji D-TXT-3 zapisanej w P4-30), dane wejściowe jako DTO (bez logiki gry; `cityOkolicaOverlay → rangeOverlay` z MOD-13 zintegrowanego `models/misc`), tekstura RGBA + metadane. Weryfikacja: jak P4.32 (Chromium 141 uruchomiony na kodzie weba, SSIM ≥ 0,985 / mean ≤ 1,5 / px>16 ≤ 5 procent, wyjątki jawnie; determinizm 1.87 vs najnowszy; mutacje ≥ 15; fixtury z manifestem sha256). Nie rób uploadu GPU.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (decyzja właściciela: grafika/renderer/UI-wizualia => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz; baza 9ec9c9d8 lub nowsza) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`.
Crate: `rust-port/renderer` (`civ-renderer`), BEZ GPU w środowisku, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` nie ruszać. Gate: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets [--features gpu] -- -D warnings`, `cargo test --locked --all-targets` (pełne surowe logi z `echo "EXIT=$?"` w dokumencie).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (paczka tego tematu, D-MOD-1..9), `P4-3-RUST-RENDERER-ARCH.md`, `P4-8-GEOMETRY-PRIMS.md` (+ kod `rust-port/renderer/src/geom/**`), `P4-11-CAMERA-TERRAIN-CPU.md` (wzorzec weryfikacji), `P4-6-RENDERER-CRATE-SCAFFOLD.md`.
WZORZEC WERYFIKACJI (jak w P4.11): wektory referencyjne generuj URUCHAMIAJĄC kod weba z pinu `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu scratch POZA repo; `three@0.169.0` + `esbuild@0.24.0` w scratch; node), zapisz JSON + skrypt generatora (`gen.ts`) + sha256 w `rust-port/renderer/tests/fixtures/<temat>/`. Porównuj BITOWO (`to_bits`) tam, gdzie web daje liczby (liczba wierzchołków/trójkątów/mesh, pozycje, bounding boxy, kolory, hash geometrii); każda niezgodność = BŁĄD albo jawnie opisane odchylenie. Zakaz `npm run build`/`dev`, zakaz zmian w `gra/**`. `scene` bez WebGL: buduj grafy obiektów Three bez renderera (geometrie/materiały/grupy), to wystarczy.
Plik `rust-port/renderer/src/lib.rs`: dopisz TYLKO jedną linię `pub mod <twój_moduł>;` (inne tematy robią to samo równolegle — konflikt w tej jednej linii rozwiąże orkiestrator).
Katalog scratch usuń po pracy; nie commituj fixtur > 8 MB (kompresuj/ogranicz zestaw i opisz, co pominięto).
Brak materiałów/shaderów/GPU: model = drzewo mesh (geometria CPU + parametry materiału jako dane: kolor, roughness/metalness, flagi), bez uploadu na GPU. Jeśli typ mesh/materiału z `geom`/`assets` nie wystarcza, dodaj MINIMALNY typ we własnym module (nie zmieniaj `geom/**`).
Ocena wizualna 1:1 wymaga GPU — oznacz jako NIE_ZMIERZONO dla właściciela; dołącz do dokumentu listę „co ocenić wzrokiem po RR-T5”.
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma plik:linia/komendę; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch; nie generuj pytań ABC.

ALLOWLISTA: `rust-port/renderer/src/cities/overlay/**` (NOWY podmoduł) i minimalne `pub mod overlay;` w `rust-port/renderer/src/cities/mod.rs` (opisz), `rust-port/renderer/tests/cityoverlay_*.rs`, `rust-port/renderer/tests/fixtures/cityoverlay/**` (≤ 8 MB), `rust-port/renderer/Cargo.toml`/`Cargo.lock` (tylko jeśli nieuniknione; opisz), `dyspozycje/rust-port/p4/P4-33-MOD10-CITY-CHIP.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1/**`
Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/src/{geom,pick,assets,camera,terrain,models,decor,core,jsmath}/**`.
(Równolegle: P4.27 (ujednolicenie sceny: `models/**`, `core/scene.rs`, `decor/**` — nie dotykaj), P6.1 r3 (engine), P5.4 (frontend-v2).)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
