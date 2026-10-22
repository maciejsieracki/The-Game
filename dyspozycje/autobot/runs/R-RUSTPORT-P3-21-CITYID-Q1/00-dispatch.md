STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-21-CITYID-Q1
GOAL: Typ `CityId` (newtype, `#[serde(transparent)]`, jak `PlayerId`/`CampId` z P3.20 w `domain/ids.rs`) dla WSZYSTKICH identyfikatorów miast w `rust-port/engine/src/domain/**` zamiast surowych `u64`/`i64`/`usize` użytych jako ID miasta (kandydaci z P3.20: `ai_turn.rs` `city_buildings` klucz ID miasta, `barbarians.rs` `cleared_city_ids`, oraz pola `city_id`/`id` miast w `AiCity`, `PlayableCity`, `CitySnapshot`, `TradeCity`, komendach i zdarzeniach; pełną listę ustal `git grep` i zapisz w tabeli decyzji „CityId / bez zmian” z uzasadnieniem dla każdego trafienia — przeczytaj `dyspozycje/rust-port/p3/P3-20-OWNERREF-CAMPID.md` §2 jako wzorzec i `p2/P2-3-ENTITY-IDS.md`). Kontrakt JSON bez zmian (transparent liczba); jeśli ID miasta w web jest tekstem lub w zapisach ma inną postać — NIE zmieniaj, opisz. Zachowaj publiczne ścieżki (`pub use`), testy bez osłabiania; nowe testy round-trip i konwersji.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2` (≥ `6d77d02e`, zawiera P3.19, P3.20, P3.22 r1–5, wszystkie renderer/frontend). Dokumenty z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`): `p3/P3-20-OWNERREF-CAMPID.md`, `p2/P2-3-ENTITY-IDS.md`, `p3/P3-13-GATE-FINAL-CONTROL.md` (CITY w otwartych punktach).
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; cargo w `rust-port/engine`; po zakończeniu usuń swój podkatalog; nie commituj `Cargo.lock`/`target`. Gate: fmt, clippy `--all-targets -D warnings`, test (baseline ≥ 367) — PEŁNE surowe logi z `echo "EXIT=$?"` w dokumencie (`git add -f` dla `*.log`).
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie ma komendę/plik:linia; niepewne = NIE_ZMIERZONO; zakaz osłabiania testów. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i nie generuj pytań ABC; luki rozstrzygaj ZAŁOŻENIEM zapisanym w dokumencie.

BINARNE KRYTERIUM SUKCESU
`git grep` po surowych ID miast w `domain/**` pokazuje tylko jawne wyjątki z uzasadnieniem; JSON/save/DTO/parity_suite bez zmiany oczekiwań (zmieniają się tylko konstrukcje typów); fmt/clippy/test EXIT=0, ≥ 367 testów + nowe testy; tabela decyzji kompletna.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-21-CITYID.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/**`. Kod: `rust-port/engine/src/domain/**` (z jawną listą zmienionych plików), `rust-port/engine/src/bridge.rs` WYŁĄCZNIE konwersje, `rust-port/engine/tests/*.rs`. Zero zmian w `data/**`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.
IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
