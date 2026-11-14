# DISPATCH R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 (runda 1)

TEMAT: ZLOZE-WIRE-WAR-BREAK etap a (#104, temat T2 z rozpoznania `R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2`): czysta domena zerwania traktatów przy wojnie i przy dobrowolnym zerwaniu, na jawnym stanie `DiplomacyState`. BEZ wpinania w produkcję (etap b = osobny temat, po #120).
DOMENA: GAME (Rust port, bez zmian w `gra/`).
Baza: `533d46dd3` (czubek `origin/rust-port/parity-v2`). PRZED pracą: `git merge-base --is-ancestor 533d46dd3 HEAD` musi być prawdą; inaczej przestaw. Gałąź robocza: `wip/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1` z tego SHA.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` — `breakTreatiesOnWar` (ok. 23686–23700: `suspendZlozeOnWar`, `treatiesBrokenByWar`, `removeTreatiesById`, pętla `deactivateZlozeGrantsForDeal`, dalej zdarzenia kary), `breakTreatyVoluntarily` (ok. 22741–22774: `breakPlan`, `n3Window`, `n5Charged`, `removeTreatiesById`, `deactivateZlozeGrantsForDeal` ok. 22774). Funkcje pomocnicze pina: `git show 07d2fbd72:gra/src/game/diplomacy-pn-engine.ts` (`suspendZlozeGrantsForWar` ok. 331–344, `deactivateZlozeGrantsForDeal` ok. 346–352). Numery linii sprawdź przed użyciem.

## GOAL
W `DiplomacyState` (lub w funkcjach wolnych w tym samym module) są dwie operacje domenowe: (1) `break_treaties_on_war(a, b)` — zawiesza granty między parą (`suspend`), usuwa umowy zerwane przez wojnę (`treatiesBrokenByWar`) i dla każdej wygasza granty powiązane (`deactivate`), w kolejności jak pin; (2) `break_treaty_voluntarily(...)` — dobrowolne zerwanie jednej umowy: plan kar (`breakPlan`) jak pin, usunięcie umowy, deaktywacja grantów. Operacje są czyste względem stanu gry (bez kar wiarygodności, bez zdarzeń UI — te są poza zakresem etapu a, zapisz to w raporcie jako NIE_ZROBIONE).

## ZAŁOŻENIA (zasada 9: parytet 1:1)
- Kolejność operacji jak w pinie: suspend → treatiesBrokenByWar → removeTreatiesById → deactivate dla każdego id.
- Nie zmieniaj istniejących funkcji `deactivate_zloze_grants_for_deal` ani `suspend_zloze_grants_for_war` (już są w `diplomacy.rs`); tylko je wołaj.
- Jeśli `treatiesBrokenByWar` nie ma odpowiednika w Rust — zaimplementuj jako czystą funkcję z wektorami z pinu; jeśli wymaga stanu poza zakresem allowlisty — STATUS BLOCK z dowodem.

## ALLOWLISTA (tylko te pliki)
- `rust-port/engine/src/domain/diplomacy.rs` (nowe metody/funkcje wolne; bez zmian istniejących)
- `rust-port/engine/src/domain/alliance_war_obligation.rs` (tylko jeśli `treatiesBrokenByWar` tam pasuje; w przeciwnym razie nie dotykaj)
- `rust-port/engine/tests/p6_zloze_break_war_a.rs` (NOWY)
- `rust-port/engine/tests/p6_zloze_break_war_a_gen.mjs` (NOWY): wykonuje tekst pina w node (wzorem `p6_zloze_grants_state_gen.mjs`), strażnik SHA-256 wyciętych fragmentów pina
- `rust-port/engine/tests/p6_zloze_break_war_a_vectors/vectors.json` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1/**`
ZAKAZ: `turn_war_dipl_steps.rs`, `playable.rs`, `gra/**`, `Cargo.toml`, `Cargo.lock` (nie commitować), `git add -A`, push do `parity-v2`.

## KRYTERIA KOŃCA
1. Funkcje `break_treaties_on_war` i `break_treaty_voluntarily` (lub odpowiedniki nazwane w raporcie) z sygnaturami i plik:linia.
2. Test wektorowy: wektory wygenerowane przez generator (wykonuje pin), asercje na stanie: grant zawieszony/wygaszony, umowa usunięta, id zwrócone; liczniki niepustości > 0 dla każdej gałęzi (wojna z umową zerwaną, bez umowy, dobrowolne z planem).
3. Brak `#[ignore]`, brak osłabionych asercji, brak wołającego w produkcji (dozwolone; etap b).
4. Bramki EXIT 0 w `rust-port/engine` (z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach): `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_zloze_break_war_a`; `cargo test --test p6_zloze_grants_state`; `cargo test --test p6_zloze_wire_expire_tribute`.
5. `git diff --stat` tylko na allowliście; `git diff --check` czysty.

## RAPORT I COMMIT
`01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1/`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY (w tym: co NIE zrobione — kary wiarygodności, zdarzenia, etap b)/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. Commit na `wip/…`, BEZ push. Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
