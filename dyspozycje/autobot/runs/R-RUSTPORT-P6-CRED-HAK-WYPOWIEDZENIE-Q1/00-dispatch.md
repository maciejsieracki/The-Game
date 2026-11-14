# DISPATCH R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1 (runda 1)

TEMAT: CRED-HAK-WYPOWIEDZENIE — hak P4 (`chargeWarDeclarationCredibility`) dla wypowiedzenia wojny przez gracza, sojuszu i klastra (zadanie #120). Follow-up po FC CRED-WOJNA-Q1 (BLOCK).
DOMENA: GAME. Baza: a381dd13f (czubek origin/rust-port/parity-v2, sprawdzone 14.11). Worktree na `wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — wywołania hooka: wypowiedzenie gracza ok. :13168 i :13205, sojusz ok. :23806, klaster ok. :40441. Potwierdź numery linii sam.

KROK 0: `git grep` w `rust-port/engine/src` na `declare_war`, `declare_war_opts`, `note_war_entered`, `charge_war_declaration`. Rust: `diplomacy_truce_flow.rs:239/247` (`declare_war_opts`) NIE woła haka. Wykaz: które ścieżki Rust odpowiadają wypowiedzeniu gracza, sojuszowi i klasterowi; które brakuje.

GOAL: podpiąć hak P4 we wszystkich trzech ścieżkach produkcyjnych, zgodnie z pinem, z zachowaniem kolejności względem zmian stanu.

ALLOWLISTA (rozszerzona świadomie po FC CRED-WOJNA):
- rust-port/engine/src/domain/diplomacy_truce_flow.rs
- rust-port/engine/src/domain/credibility.rs (tylko jeśli potrzebne)
- rust-port/engine/tests/p6_cred_hak_wypowiedzenie*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1/01-operator-r1.md

NIE ROBIĆ: zlozeGrants (#104, poza zakresem), zmian formatu zapisu, zmian w `stream_kind_of` (alias umowa_handlowa — decyzja właściciela, nieotwarta).

KRYTERIA KOŃCA:
1. Każda z trzech ścieżek (wypowiedzenie gracza, sojusz, klaster) ma produkcyjne wołanie haka, z numerem linii Rust i pin.
2. Test z wektorami pinu (generator `.mjs` wykonujący tekst pinu w node, strażnik SHA-256 wyciętych fragmentów), liczniki niepustości > 0, porównanie stanu wiarygodności przed/po.
3. Brak `#[ignore]`, brak osłabionych asercji.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test.
5. Jeśli ścieżka nie istnieje w produkcji — zgłoś BLOCK z dowodem, nie twórz martwego wrappera (wzorzec z ZDOBYCIE-WIRING: FAIL).

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`, `git stash` bez tagu. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).

REBASE 14.11: baza przepisana z 23e33793e na a381dd13f. Cele zweryfikowane na tej bazie (brak produkcyjnego wołającego potwierdzony przez git grep).
