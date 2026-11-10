STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-13-GATE-FINAL-CONTROL-Q1
GOAL: Plan P3.13: „Final Control danych i assetów przed otwarciem P4–P6”. Bramka P3 (PLAN §4): „dane ładowane ze źródła (nie hard-coded), manifest assetów przechodzi walidację wobec web”.
Zweryfikuj NIEZALEŻNIE, z dowodami, czy bramka P3 jest spełniona na `origin/rust-port/parity-v2` (HEAD `17454b33` lub nowsza), wypisz każdy punkt P3.1–P3.14 (+P3.4b/c, P3.8b, P3.15, P3.16) ze statusem, i wskaż, co NIE jest zamknięte (np. P3.10 fixtures — blokada: brak nagrań z weba, P2.10 DECISION_REQUIRED) oraz czy to blokuje start P4–P6. Wydaj werdykt bramki (PASS / PASS-WITH-NOTES / FAIL) z rekomendacją.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; potwierdź bazę (zawiera `17454b33`).
Przeczytaj: `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` (§4 P3, bramka P3), `LEDGER.md` (wpisy P3.*), `p1/P1-12-DATA-CATALOG.md`, `p1/P1-11-ASSET-CATALOG.md`, `p2/P2-9-ASSET-DATA-MAPPING.md`, dokumenty `dyspozycje/rust-port/p3/*` (na parity-v2 pod tą ścieżką).
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`, cargo w `rust-port/engine`; po zakończeniu usuń swój podkatalog targetu; nie commituj `Cargo.lock`/`target/`.

ZADANIE (dokument `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md`)
1. Własny przebieg bramek: `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --offline` — PEŁNE surowe wyjścia z `echo "EXIT=$?"` (oczekiwane 323 passed).
2. Dane: czy WSZYSTKIE 29 plików `gra/data/*.json` z pinu `edb8fb56` są w `rust-port/engine/data/` bajtowo identyczne (`git hash-object` vs `git rev-parse edb8fb56:gra/data/<plik>` — wklej tabelę 29/29), czy loader ładuje je z katalogu (nie `include_str!` w ścieżce produkcyjnej — sprawdź, gdzie `include_str!` jeszcze występuje i oceń, czy to „hard-coded” w sensie bramki), czy round-trip/zgodność (P3.11, P3.15) i ich normalizacje N1/N2 są akceptowalne dla bramki.
3. Assety: 428/428 + manifest (`tests/assets_manifest.rs`), sumy per kategoria z P1.11; potwierdź brak fontów/modeli 3D/SFX w pinie (zgodnie z P3.8) i że to zgodne z decyzją właściciela o renderze w Rust (modele będą kodem — P4.4).
4. Zgodność ID i newtypów (P3.4b/c): wypisz pola celowo pozostawione jako `u64` (lista z P3-4C §1b) i oceń, czy któreś blokuje P4–P6.
5. Tabela statusu P3.1–P3.14 (+ podtematy): temat → SHA integracji → dowód → status; lista otwartych punktów (P3.10 fixtures, `gen.py`, `OwnerRef`, src-tauri bez GTK itp.) z oceną, czy blokują bramkę.
6. Werdykt bramki P3 + rekomendacja: co otwiera P4–P6 teraz, a co zostaje warunkiem (np. P3.10 przed P6 testami zgodności). Bez zmyślania — niepewne = `NIE_ZMIERZONO`.

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie ma dowód (komenda+wynik wklejone). Zakaz przepisywania statusów z LEDGER bez własnego sprawdzenia. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Dokument zawiera własne surowe bramki (EXIT), tabelę hashy 29/29, status P3.1–P3.14, listę otwartych punktów i werdykt; zero zmian poza allowlistą.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-13-GATE-FINAL-CONTROL-Q1/**`. Zero zmian w `rust-port/**` (kod/dane/assety), `src-tauri/**`, `gra/**`.

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
