STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1
GOAL: Domknięcie uwag z P4.22 (MOD-13, zintegrowany): (1) PODPIĘCIE prawdziwego samplera reliefu: `models/misc` (`ReliefSource`, płachta kopalni na `Wzgorza`/`Gory`, `rangeOverlay`) dziś dostaje sampler wstrzykiwany, a wektory zweryfikowano na polu analitycznym ze shimu (`relief_shim.ts`); po P4.17 prawdziwy `reliefSurfaceSampler` istnieje w `renderer/src/decor/relief.rs` — podłącz go jako implementację domyślną i dodaj wektory z URUCHOMIONEGO weba z PRAWDZIWYM `reliefSurfaceSampler` (bez shimu) na mapach zawierających `Wzgorza`/`Gory` (płachta kopalni + nakładki zasięgu przecinające wzgórza), porównanie bitowe; (2) DEDUPLIKACJA `overlay::js_to_fixed(digits)` (w `models/misc/overlay.rs`) z `core::jsnum::js_to_fixed3` — jedna implementacja w `core::jsnum` (uogólniona na `digits`), z testem bitowym względem V8 `Number.prototype.toFixed` na ≥ 20 000 wartości (w tym ujemne, zaokrąglenia połówkowe, duże/małe, NaN/Inf), reszta kodu używa jej; (3) uporządkuj komentarz modułu `models.rs` (nieaktualne „Empty until the first batch lands”). Zachowaj publiczne ścieżki, istniejące fixtury MOD-13 bez zmian (jeśli któryś się zmienia — wylistuj i uzasadnij wektorem z weba).
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (renderer; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2` (≥ `f1a1740c`, zawiera P4.12, P4.17, P4.22, jsmath). Dokumenty z `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `p4/P4-22-MOD13-MISC.md` (uwagi, `ReliefSource`, §4–§5), `p4/P4-17-MOD03-TERRAIN-DECOR.md`, `p4/P4-12-MOD01-CORE.md`. WZORZEC WERYFIKACJI jak w P4.17/P4.22: wektory z uruchomionego kodu weba (`git archive edb8fb56` do scratch POZA repo, `three@0.169.0` + `esbuild@0.24.0`, node), generator + JSON + sha256 w `rust-port/renderer/tests/fixtures/<temat>/`, porównanie `to_bits`. Bramki: `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets [--features gpu] -- -D warnings`, `cargo test --locked --all-targets` w czystym `CARGO_TARGET_DIR` (usuń po pracy), pełne surowe logi z `echo "EXIT=$?"`. Bez nowych zależności, bez `unsafe`, `Cargo.lock` nie ruszać. Scratch: używaj własnego unikalnego katalogu (np. `mktemp -d`), NIE nadpisuj katalogów innych sesji.
Równolegle: P4.21 `src/models/cities/**`, P4.23 `src/models/units_braz/**` + `unit_core` + `jsmath`, P5.2 `frontend-v2`, P3.23 engine, P3.13R dokument — nie dotykaj ich plików (w `core/jsnum.rs` ewentualnie dodaj funkcję bez zmiany istniejących sygnatur).
DOKUMENTY (NOWE): `dyspozycje/rust-port/p4/P4-24-MISC-RELIEF-WIRE.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1/**`.
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie/V8 ma komendę/plik:linia; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i nie generuj pytań ABC; luki rozstrzygaj ZAŁOŻENIEM zapisanym w dokumencie.

BINARNE KRYTERIUM SUKCESU
Sampler prawdziwy podpięty i zweryfikowany bitowo na mapach z `Wzgorza`/`Gory` względem uruchomionego weba bez shimu; jedna implementacja `toFixed` z testem ≥20 000 wartości vs V8; fixtury MOD-13 bez zmian lub zmiany uzasadnione; bramki EXIT=0; mutacje wykrywane.

ALLOWLISTA
`rust-port/renderer/src/models/misc/**`, `rust-port/renderer/src/core/jsnum.rs`, `rust-port/renderer/src/models.rs` (tylko komentarz), `rust-port/renderer/tests/{misc_*,core_*,jsnum_*}.rs`, `rust-port/renderer/tests/fixtures/{misc,jsnum}/**`, `dyspozycje/rust-port/p4/P4-24-MISC-RELIEF-WIRE.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1/**`. Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `src/{geom,pick,assets,camera,terrain,decor,jsmath}/**`, `Cargo.toml`, `Cargo.lock`.
IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`; logi `*.log` przez `git add -f`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
