# DISPATCH R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1 (runda 1)

TEMAT: ZLOZE-SYNC-MERGE (#104 część 2, temat T3 z rozpoznania `R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2`): ujednolicenie dwóch funkcji synchronizacji relacji z umów w Rust.
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `6acb1d81b` (czubek `origin/rust-port/parity-v2`). PRZED pracą: `git merge-base --is-ancestor 6acb1d81b HEAD` musi być prawdą; inaczej przestaw. Gałąź robocza: `wip/R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — `syncRelationFromDeals` (ok. 22832; 10 wywołań poza 24319, w tym 14652, 21264, 23017, 23447, 23677, 23862, 24563, 41584, 41609, 47264). Uwaga: w pinie NIE MA `syncRelationStatusFromDeals`; ta nazwa występuje tylko w Rust.

## GOAL
W Rust są dwie funkcje o podobnym celu: `sync_relation_from_deals` (mutująca, `rust-port/engine/src/domain/turn_war_dipl_steps.rs` ok. 275–290, produkcja tylko z ok. 1004) i `sync_relation_status_from_deals` (czysta, zwraca `Option<RelationStatus>`, `rust-port/engine/src/domain/diplomacy.rs` ok. 4276, bez wołającego w produkcji). Krok 1: ustal równoważność semantyczną (`has_nap_between` vs `state.has_deal`; `deal_involves_owners` vs `d.parties == pair`). Krok 2: jeśli równoważne — usuń duplikat (zostaw jedną sygnaturę, zaktualizuj komentarz `turn_war_dipl_steps.rs` ok. 32–36, który jest nieaktualny). Jeśli NIE są równoważne — nie usuwaj żadnej; napisz w raporcie dowód rozbieżności (wektor/przypadek) i zostaw obie z jawnym komentarzem; to będzie NIE_ZMIERZONO do decyzji.

## ZAŁOŻENIA (zasada 9)
- Pin jest wzorcem: semantykę porównuj z pinem `syncRelationFromDeals` (`main.ts` ok. 22832), nie z Rust-owym dublem.
- Wołania z pinu poza 24319 (10 miejsc): NIE wpinamy w tym temacie; odnotować w raporcie, czy odpowiednik istnieje w Rust.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/diplomacy.rs` (usunięcie duplikatu LUB dopisek komentarza)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (usunięcie duplikatu LUB komentarz 32–36 i ewentualne przepięcie wołania)
- `rust-port/engine/tests/p6_r7k7b_zloze_sync.rs`, `rust-port/engine/tests/p6_wire_war_dipl_steps.rs` (tylko jeśli zmieniają się sygnatury)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Raport: tabela równoważności (wejścia, wyjścia, przypadki brzegowe) z plik:linia obu funkcji i dowodem z pinu.
2. Albo: jedna funkcja usunięta, wołania przepięte, testy zielone; albo: rozbieżność udokumentowana wektorem i obie zostawione.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_r7k7b_zloze_sync`; `cargo test --test p6_wire_war_dipl_steps`. Jeśli zmiany tylko w komentarzu — wystarczy `cargo fmt --check` i `cargo test --lib`; napisz to w raporcie.
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT I COMMIT
`01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1/`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/…`, BEZ push. Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
