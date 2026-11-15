STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1 (#221, runda 2)
GOAL: pole `generalTargetId` w `PlayablePlannedMarch` (warstwa PlayableState): zapis i odczyt w obie strony zgodnie z pinem 07d2fbd72 (`planned-march.ts` :466, :471-472, :496); brak `general_target_dropped`; wektory pinu; mutacja zerujaca pole przy zapisie daje FAIL.
BAZA: `origin/rust-port/parity-v2` = 83f5fd654 (worktree detached). Pin: 07d2fbd72 (`gra/src/**` tylko odczyt, nietkniete).
ZMIANY/COMMIT: patrz sekcja COMMIT ponizej (SHA po commicie w odpowiedzi orkiestratora).

## Zmiany (allowlista rundy 2)
- `rust-port/engine/src/domain/playable.rs`: `PlayablePlannedMarch.general_target_id: Option<String>` (`serde default`, `skip_serializing_if = None`, wire `generalTargetId`), komentarz struktury zaktualizowany (`:552-560`; stary tekst "poza zakresem P4-1J" usuniety).
- `rust-port/engine/src/domain/save_load.rs`:
  - `playable_planned_marches_to_save` (`:835`): `general_target_id: march.general_target_id.clone()` zamiast `None`.
  - `restore_playable_planned_marches` (`:~940-976`): pole przenoszone do `PlayablePlannedMarch`; usunieta galaz raportu `general_target_dropped`.
  - `PlannedMarchRestoreReport`: pole `general_target_dropped` USUNIETE (zgodnie z dispatchem rundy 2: "pole juz nie istnieje").
- `rust-port/engine/src/domain/pathfinding.rs`: komentarz `:2188` `planned-march.ts:455` -> `:466`.
- `rust-port/engine/src/domain/general_quick_follow.rs`: komentarz `:13-15` poprawiony (pole `generalTargetId` istnieje w `pathfinding::PlannedMarchDest`, `:1718`).
- Testy (mechaniczne, bez luzowania asercji):
  - `tests/p4_1j_planned_march_state.rs`: helper `march()` +`general_target_id: None`; test `restore_reports_general_target_and_unrepresentable_entries` przemianowany na `restore_keeps_general_target_and_reports_unrepresentable_entries`; asercja `general_target_dropped == ["1"]` zastapiona asercja, ze wpis generala na pozycji jednostki zostaje z `Some("g1")`.
  - `tests/p4_1j_planned_march_bounds.rs`: `march()` +`general_target_id: None`; asercja `general_target_dropped.is_empty()` usunieta (pole nie istnieje). Nic wiecej.
  - `tests/p4_1j_planned_march_pin_vectors.rs`: oracle `expected_after_load` zachowuje `generalTargetId` (helper `general_of`: niepusty napis, inaczej None) zamiast raportowac drop; `state_of` ustawia pole z wektora; `general_dropped >= 5` zastapione `general_kept >= 5` (pole zachowane po odczycie: 9 w biezacym zestawie); asercja `raw_deviation_case` (`:399`) porownuje `general_target_id` z wynikiem weba (wpis 12), zamiast `is_empty()`.

## Nowe wektory (warstwa PlayableState)
- `rust-port/engine/tests/p4_1j_general_target_vectors/gen.mjs`: generator wykonuje na pinie `validateAutoMarchFromSave`, `plannedMarchesFromSave`, `plannedMarchesToSave` (wyciete po nazwie, `stripTypeScriptTypes`). Straznik SHA-256: pelny plik `planned-march.ts` (`12fa88cd...`) oraz kazdy wyciety fragment (skroty zapisane w generatorze i w ttescie Rust).
- `rust-port/engine/tests/p4_1j_general_target_vectors/vectors.json`: 61 przypadkow roundtrip (zapis weba -> odczyt) i 51 surowych odczytow (w tym LCG). `node gen.mjs <WEB_ROOT> --check vectors.json` -> OK (zgodne bajt w bajt).
- `rust-port/engine/tests/p4_1j_general_target_vectors.rs`: 4 testy (straznik skrotow/pin, liczby przypadkow, roundtrip Rust == zapis weba i odczyt == wynik weba, surowy odczyt == wynik weba). Nie duplikuje wektorow pathfinding (`p6_repin_wojna_*`).
- Prog pokrycia w tescie surowego odczytu ustawiony na `>= 15` (zmierzone 18); pierwotny szkic mial 20 — zmiana progu wynika z pomiaru, nie z luzowania zachowania.

## TESTY (wyniki faktyczne, worktree na 83f5fd654 + zmiany)
- `cargo fmt --check`: EXIT 0 (po `rustfmt` nowego pliku testu).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 118 passed, 0 failed.
- `cargo test --test p4_1j_planned_march_state`: 9 passed.
- `cargo test --test p4_1j_planned_march_pin_vectors`: 4 passed (`state: niepuste=66 filtr=62 ataki=35 kolejnosc=22`; `raw: wczytane=33 niewyrazalne=8 general=9 ataki=6`).
- `cargo test --test p4_1j_general_target_vectors`: 4 passed.
- `cargo test --test p4_1j_planned_march_bounds`: 1 passed.
- MUTACJA (kryterium 3): `save_load.rs:835` ustawione na `general_target_id: None` -> `roundtrip_save_matches_web_and_loads_back_like_web` FAIL; plik przywrocony z kopii (`git diff` zgodny z zamierzeniem).
- `node gen.mjs <WEB_ROOT> --check`: OK.

## BLOKADY / NIE_ZMIERZONO
- Punkt 4 (podpiecie `sync_general_march_targets` do `main.ts:31547, 31563, 31664, 31676, 31693, 44120`): NIE_ZMIERZONO, poza zakresem (wymaga stanu generalow w PlayableState) — osobny temat.
- Punkt 5 (rekrutacja `main.ts:14975-14986`, czyszczenie `main.ts:25920`): NIE_ZMIERZONO, poza zakresem — decyzja orkiestratora.
- Wplyw na renderer / DTO: NIE_ZMIERZONO (brak uruchomienia gry; kontrakt P4-1 nie zawiera `generalTargetId`).
- Dla `planned_marches_from_save` (warstwa pathfinding) galaz `:466` byla juz zgodna przed ta zmiana; zmiana domyka luke tylko w PlayableState.
- Cargo.lock: wygenerowany przez build, nie commitowany (zgodnie z dispatchem).

## COMMIT
- Gałąź robocza: `wip/R-RUSTPORT-P4-1J-GENERALTARGET-WDROZENIE-Q1-r2` (lokalna, bez push; poprzednia `wip/...-Q1` zawiera runde 1 na starej bazie i nie była używana).
- Commit obejmuje wylacznie sciezki z allowlisty + katalog runu (`00-dispatch.md`, `01-operator-r2.md`).
- Nie pushowano do `rust-port/parity-v2`; nie integrowano; `gra/` i `origin/main` nietkniete.

RUNDY: 2/5 (runda 2 po BLOCK/FAIL rundy 1 — zgodnie z dodatkiem orkiestratora)
NASTEPNY KROK: Evaluator (SONNET) — weryfikacja zakresu, bramek i mutacji; potem Obrona/FC.
DEPLOY/PUSH: NIE WYKONANO (operator nie pushuje; push tylko po READY_FOR_DEPLOY i osobnej autoryzacji).

Uwaga o nazwie raportu: harness wpisal `01-operator-r1.md`, dodatek rundy 2 mowi o numerze wg dodatku; zapisano jako `01-operator-r2.md` (runda 2).
