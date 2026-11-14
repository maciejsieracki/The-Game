# DISPATCH R-RUSTPORT-P6-WYPOWIEDZENIE-GRACZA-PORT-Q1 (runda 1)

TEMAT: WYPOWIEDZENIE-GRACZA-PORT — port wypowiedzenia wojny przez GRACZA jako komendy silnika Rust, a następnie hak P4 (`chargeWarDeclarationCredibility` -> `CredibilityRegistry::note_war_entered`) w tej ścieżce. Decyzja właściciela (14.11): opcja A z rozpoznania CRED-HAK (#120). Dotyczy tylko WYPOWIEDZENIA GRACZA; sojusz (`joinAllyToWar`) i klaster (`resolveClusterCityStateWarOnPlayer`) są osobnymi tematami i NIE wchodzą w zakres.
DOMENA: GAME. Baza: a381dd13f (czubek origin/rust-port/parity-v2, sprawdzone 14.11). Worktree na `wip/R-RUSTPORT-P6-WYPOWIEDZENIE-GRACZA-PORT-Q1`. PRZED pracą: `git merge-base --is-ancestor a381dd13f HEAD`; inaczej BLOCK z przyczyną BASE.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — `ownerDeclareWarOn` (ok. :13160-13210): wywołania `chargeWarDeclarationCredibility(ME(), ownerId)` ok. :13168 i `chargeWarDeclarationCredibility(attackerId, defenderId)` ok. :13205; definicja `chargeWarDeclarationCredibility` ok. :12176; hak P4 `wiarygodnoscOstatniaWojnaTuraByOwner.set` ok. :12223-12224. Potwierdź numery sam.

KONTEKST (rozpoznanie na a381dd13f): w `rust-port/engine/src` NIE ma funkcji ani komendy gracza wypowiadającej wojnę. Jedyny wariant to `DiplomaticEvent::DeclareWar` w `diplomacy.rs:544/632` (czysto relacyjny). `TruceDiplomacy::declare_war*` (`diplomacy_truce_flow.rs:239/247`) nie ma produkcyjnego wołającego poza testami `p6_repin_rozejm_silnik.rs`.

GOAL: (1) dodać produkcyjną komendę gracza `wypowiedz wojne` w silniku (wejście z pinu `ownerDeclareWarOn`, z warunkami i kolejnością zgodnymi z pinem), (2) w tej komendzie wołać hak P4 w miejscu i kolejności zgodnych z pinem (przed zmianą stanu, jak `chargeWarDeclarationCredibility` w pinie), (3) test z wektorami pinu.

ALLOWLISTA (tylko te pliki):
- rust-port/engine/src/domain/diplomacy_truce_flow.rs (komenda gracza / wołanie haka)
- rust-port/engine/src/domain/credibility.rs (tylko jeśli potrzebne)
- rust-port/engine/src/domain/<moduł komend gracza, jeśli istnieje; nazwij go w raporcie>
- rust-port/engine/tests/p6_wypowiedzenie_gracza*.rs (nowy test)
- rust-port/engine/tests/p6_wypowiedzenie_gracza_gen.mjs (generator wektorów z tekstu pina w node)
- rust-port/engine/tests/p6_wypowiedzenie_gracza_vectors/ (wygenerowane wektory)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WYPOWIEDZENIE-GRACZA-PORT-Q1/ (raporty)

NIE ROBIĆ: sojuszu (`joinAllyToWar`), klastra (`resolveClusterCityStateWarOnPlayer`), `zlozeGrants` (#104), zmian formatu zapisu, `stream_kind_of` (alias umowa_handlowa — decyzja właściciela, nieotwarta). Nie twórz martwego wrappera: komenda musi mieć produkcyjnego wołającego (np. ścieżka wejścia gracza w silniku), inaczej BLOCK z dowodem.

KRYTERIA KOŃCA:
1. Produkcyjna komenda wypowiedzenia gracza z numerami linii Rust i pina `ownerDeclareWarOn`, z wołającym poza testami.
2. Hak P4 wołany w tej komendzie, z numerem linii Rust i pina; kolejność względem zmian stanu zgodna z pinem.
3. Test z wektorami z generatora `.mjs` (wykonuje tekst pina w node), strażnik SHA-256 wyciętych fragmentów, liczniki niepustości > 0, porównanie stanu wiarygodności przed/po.
4. Brak `#[ignore]`, brak osłabionych asercji.
5. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test. Odtwórz je samodzielnie.
6. Jeśli wypowiedzenie gracza wymaga modelu, którego nie ma w Rust (np. brak warunków wojny w stanie), STATUS BLOCK z dowodem `git grep` i propozycją, bez kodu.

DYSK: przed startem `df -h /`. Poniżej 4 GB — STATUS BLOCK z przyczyną DISK.
NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
