STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-14-FMT-CLIPPY-HYGIENE-Q1
GOAL: Higiena bramek CI dla `src/data/**`: `cargo fmt --check` jest czerwony na bazie w plikach danych
(Evaluator P3.4b wskazał m.in. `civilizations.rs:1303/1310`, `economy_society.rs:148`, `terrain_map.rs:9`) oraz
clippy zgłasza ostrzeżenie „duplicated attribute” w `data/civilizations.rs:3`. Zlikwiduj te naruszenia
w plikach danych BEZ zmiany zachowania, tak by `rustfmt --check` na tych plikach i clippy na nich były czyste.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow,
  Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0`
(dokumentacja; czytaj przez `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`;
baza zawiera `914eec6b`. Baseline: `cargo test --offline` PRZED zmianami (oczekiwane 256 passed) oraz
`rustfmt --check` i `cargo clippy --all-targets` — zapisz surowe wyniki „przed”.
KOSZT DYSKU: `CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0` dla wszystkich komend cargo.
Nie twórz `target/` w worktree, nie commituj `Cargo.lock`. Workflow CI: `.github/workflows/rust-engine.yml` (przeczytaj, które kroki są bramką).

ZADANIE
1. Wypisz wszystkie naruszenia `rustfmt --check` i ostrzeżenia clippy w plikach z allowlisty.
2. Napraw: formatowanie (`rustfmt` TYLKO na plikach z allowlisty, np. `rustfmt --edition <z Cargo.toml> <plik>`;
   NIE `cargo fmt --all` — dotknęłoby plików innych tematów) i duplikat atrybutu w `civilizations.rs`.
3. Ostrzeżenia clippy poza allowlistą (np. `bridge.rs` large_enum_variant) — NIE naprawiaj, tylko wylistuj.
4. Zero zmian zachowania: `cargo test --offline` ma dać identyczną liczbę przechodzących testów.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „czyste” bez surowego wyniku `rustfmt --check` (EXIT) wklejonego dosłownie. Zakaz zmian semantycznych
udających formatowanie — Evaluator porówna `git diff -w` (ignorowanie białych znaków) i oczekuje pustego diffu
poza usunięciem duplikatu atrybutu.

BINARNE KRYTERIUM SUKCESU
`rustfmt --check` EXIT=0 na wszystkich plikach z allowlisty; clippy bez ostrzeżeń dla tych plików;
`cargo test --offline` EXIT=0, ta sama liczba testów co baseline; `git diff -w` bez zmian poza usunięciem
duplikatu atrybutu; surowe logi w `dyspozycje/rust-port/p3/P3-14-FMT-CLIPPY-HYGIENE.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-14-FMT-CLIPPY-HYGIENE.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-14-FMT-CLIPPY-HYGIENE-Q1/**`.
Worktree: WYŁĄCZNIE `rust-port/engine/src/data/{buildings_tech,civilizations,economy_society,economy_society_part2,terrain_map,units_combat}.rs`.
NIE: `src/data/mod.rs` i `src/data/loader.rs` (P3.12), `domain/**`+`bridge.rs` (P3.4c), `tests/**`, `Cargo.toml`, `lib.rs`, `gra/**`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
