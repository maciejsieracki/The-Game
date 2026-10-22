STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1
GOAL: Konsolidacja matematyki JS w `rust-port/renderer` po P4.16: (1) `models/unit_core/jstrig.rs` (kopia fdlibm z P4.13) ZASTĄP re-eksportem z `jsmath` (test bitowy `unit_core_trig` pozostaje zielony, fixtury bez zmian); (2) `pick/**` (m.in. `pick/three.rs` `Quat::from_euler_xyz`, `rotacja_dla_heksa`, wszystkie `.sin()/.cos()/.tan()/.atan2/.powf/.hypot` wzorowane w webie na `Math.*`) przepnij na `jsmath` — fixtury `pick_golden` mają pozostać bez zmian, a jeśli któryś się zmieni (bo dotąd był „blisko”), WYLISTUJ i uzasadnij z wektorem z uruchomionego weba; (3) domknij skaner `tests/jsmath_wiring.rs` (forma `<f64>::cos(`, makra, `libm`) tak, by obejmował `pick/**`, `core/**`, `models/**`, `camera.rs`; (4) `git grep` dowód: w `rust-port/renderer/src` brak systemowych wywołań funkcji transcendentalnych tam, gdzie web używa `Math.*` (wyjątki wylistuj z uzasadnieniem, np. czysta geometria niewołana w webie). Nie zmieniaj publicznych sygnatur.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (decyzja właściciela: grafika/renderer/UI-wizualia => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz; baza bf59164b lub nowsza) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`.
Crate: `rust-port/renderer` (`civ-renderer`), BEZ GPU w środowisku, `forbid(unsafe_code)`, bez nowych zależności, `Cargo.lock` nie ruszać. Gate: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets [--features gpu] -- -D warnings`, `cargo test --locked --all-targets` (pełne surowe logi z `echo "EXIT=$?"` w dokumencie).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` (paczka tego tematu, D-MOD-1..9), `P4-3-RUST-RENDERER-ARCH.md`, `P4-8-GEOMETRY-PRIMS.md` (+ kod `rust-port/renderer/src/geom/**`), `P4-11-CAMERA-TERRAIN-CPU.md` (wzorzec weryfikacji), `P4-6-RENDERER-CRATE-SCAFFOLD.md`.
WZORZEC WERYFIKACJI (jak w P4.11): wektory referencyjne generuj URUCHAMIAJĄC kod weba z pinu `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu scratch POZA repo; `three@0.169.0` + `esbuild@0.24.0` w scratch; node), zapisz JSON + skrypt generatora (`gen.ts`) + sha256 w `rust-port/renderer/tests/fixtures/<temat>/`. Porównuj BITOWO (`to_bits`) tam, gdzie web daje liczby (liczba wierzchołków/trójkątów/mesh, pozycje, bounding boxy, kolory, hash geometrii); każda niezgodność = BŁĄD albo jawnie opisane odchylenie. Zakaz `npm run build`/`dev`, zakaz zmian w `gra/**`. `scene` bez WebGL: buduj grafy obiektów Three bez renderera (geometrie/materiały/grupy), to wystarczy.
Plik `rust-port/renderer/src/lib.rs`: dopisz TYLKO jedną linię `pub mod <twój_moduł>;` (inne tematy robią to samo równolegle — konflikt w tej jednej linii rozwiąże orkiestrator).
Katalog scratch usuń po pracy; nie commituj fixtur > 8 MB (kompresuj/ogranicz zestaw i opisz, co pominięto).
Brak materiałów/shaderów/GPU: model = drzewo mesh (geometria CPU + parametry materiału jako dane: kolor, roughness/metalness, flagi), bez uploadu na GPU. Jeśli typ mesh/materiału z `geom`/`assets` nie wystarcza, dodaj MINIMALNY typ we własnym module (nie zmieniaj `geom/**`).
Ocena wizualna 1:1 wymaga GPU — oznacz jako NIE_ZMIERZONO dla właściciela; dołącz do dokumentu listę „co ocenić wzrokiem po RR-T5”.
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma plik:linia/komendę; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch; nie generuj pytań ABC.

ALLOWLISTA: `rust-port/renderer/src/models/unit_core/jstrig.rs` (tylko re-eksport), `rust-port/renderer/src/pick/**` (WYŁĄCZNIE przepięcie na `jsmath`), `rust-port/renderer/src/{camera.rs,core/**}` (jeśli grep wykaże wywołania), `rust-port/renderer/tests/jsmath_wiring.rs`, `rust-port/renderer/tests/unit_core_trig.rs` (tylko jeśli konieczne), `dyspozycje/rust-port/p4/P4-18-JSMATH-CONSOLIDATE.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1/**`
Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/src/{geom,pick,assets,camera,terrain}/**`.
(Równolegle: P4.17 `src/decor/**`, P4.19/P4.20 (`src/models/units_kamien/**`, `src/models/improvements/**`), P3.22 (engine), P4.15 (spike) — nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
