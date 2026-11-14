STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1 (ZLOZE-SYNC-MERGE, #104 część 2, T3 z R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2)
GOAL: Ujednolicić dwie funkcje synchronizacji relacji z umów w Rust (`sync_relation_from_deals` vs `sync_relation_status_from_deals`), wzorzec: pin `syncRelationFromDeals` (`gra/src/main.ts` @ 07d2fbd72, def. ok. 22832).

BAZA: 6acb1d81b (czubek origin/rust-port/parity-v2). Poprzedni HEAD worktree (78af786ed) NIE był potomkiem bazy, więc gałąź `wip/R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1` utworzona z 6acb1d81b (zgodnie z dispatchem: "przestaw").

## Tabela równoważności (krok 1)

Pin: `main.ts:22832`, `syncRelationFromDeals(a,b)`; warunki z `gra/src/game/diplomacy-treaties.ts` (pin) `hasTreaty` ok. 300-312, `normalizeTreatyKind` ok. 212-215.

| Aspekt | Pin (web, 07d2fbd72) | `sync_relation_from_deals` (mutator, `turn_war_dipl_steps.rs:275`) | `sync_relation_status_from_deals` (czysty, `diplomacy.rs` przed usunięciem, ok. 4276) |
|---|---|---|---|
| Wejście: status | `getDiploRelation(a,b).status` | `state.relation(a,b)` lub `Relation::default()` | argument `current` |
| Wejście: umowy | `activeDeals` | `state.deals` | argument `deals` |
| Wojna | `status==='wojna'` -> return | `status == War` -> `false`, bez zmiany | `current == War` -> `None` |
| Sojusz | `dealInvolvesOwners && isAllianceDealKind` -> `sojusz` (pierwszeństwo) | `d.parties == CivilizationPair::new(a,b) && d.kind.is_alliance()` -> `Alliance` | to samo predykat -> `Some(Alliance)` |
| NAP | `hasTreaty(activeDeals,a,b,PaktNieagresji)`; `normalizeTreatyKind` jest tożsamością dla NAP | `state.has_deal(a,b,Some(Nap))` = `parties==pair && kind==Nap` -> `Peace` | `has_nap_between`: `parties==pair && kind==Nap` -> `Some(Peace)` |
| Brak umowy | status bez zmian | `false`, bez zapisu | `None` |
| Zapis | `{...rel, status}` (zachowuje trust/respect) | `rel.status = target; set_relation(pair, rel)`; zwraca `true` | nie zapisuje (zwraca wartość) |
| Neutralność | nie ustawiana | nie ustawiana | nie ustawiana |

Wniosek: predykaty i wynik statusu są identyczne; pin, mutator i czysty wariant dają ten sam status dla każdego wejścia. Brak rozbieżności wymagającej decyzji. Różnica tylko kształtu: mutator zwraca `bool` (używany do `report.synced_status`), czysty zwraca `Option`.

Przypadki brzegowe: para bez relacji (default), wojna (no-op), sojusz i NAP jednocześnie (sojusz wygrywa), umowa o innej parze (pair normalizowany w obu), umowa typu `SojuszWojskowy` (w Rust osobny kind, `is_alliance()`).

## Krok 2: usunięcie duplikatu
- Usunięto czysty duplikat `sync_relation_status_from_deals` oraz helpery `deal_involves_owners`, `has_nap_between` z `rust-port/engine/src/domain/diplomacy.rs`. Czysty wariant nie miał produkcyjnego wołającego (tylko test wektorowy).
- Zostawiono jedną implementację: `sync_relation_from_deals` (`turn_war_dipl_steps.rs:275`), wołaną z D7 (`turn_war_dipl_steps.rs` ok. 1004).
- Test `tests/p6_r7k7b_zloze_sync.rs::sync_relation_from_deals_matches_pin_vectors` przepięty na mutator (`DiplomacyState` + `set_relation` + `add_deal`); dodano asercję: zwrot `false` => status bez zmian; relacja startuje z zaufaniem 37 i respektem 21, asercje sprawdzają, że po sync oba przetrwały (pin: `{...rel, status}`). Asercje `changed>0` w tym teście są bez osłabienia (były wcześniej). Asercje `>=150` (liczniki wektorów) są w innym teście tego pliku, `vectors_meet_minimum_counts_and_pin` (linie 56-57), i nie były zmieniane.
- Dodano test `sync_relation_from_deals_without_stored_relation`: ścieżka bez zapisanej relacji w stanie (`unwrap_or_default` = `Neutral`): NAP => pokój, NAP+sojusz => sojusz, brak traktatu => `false` i brak zapisu relacji. Równoważność domyślnej wartości z `getDiploRelation` w pinie: NIE_ZMIERZONO co do wartości domyślnej (test zakłada `Neutral` zgodnie z `Relation::starting()`).
- Zaktualizowano komentarz `turn_war_dipl_steps.rs` (bloki D7 ok. 32-36 i ok. 41-43). Stara wersja twierdziła, że w Rust nie ma modelu `zlozeGrants` (grep pusty) - to było nieaktualne: istnieje `DiplomacyState::zloze_grants` i `deactivate_zloze_grants_for_deal`; nadal BRAK wywołania w tickach (luka jawna, dla ZLOZA-WIRING).

## Wołania z pinu poza 24319 (10 miejsc) - NIE wpinane
Lokalizacje w pinie (main.ts): 14652, 21264, 23017, 23447, 23677, 23862, 24563, 41584, 41609, 47264.
NIE_ZMIERZONO: nie zmapowano w tym temacie, który odpowiednik Rust (poza pinem) odpowiada każdemu wywołaniu. W Rust produkcyjne wołanie `sync_relation_from_deals` istnieje wyłącznie w D7 (`turn_war_dipl_steps.rs` ok. 1004). Mapowanie 10 miejsc -> temat ZLOZA-WIRING/kolejny temat.

## ZMIANY/COMMIT
Allowlista (`git diff --stat`):
- rust-port/engine/src/domain/diplomacy.rs (-36)
- rust-port/engine/src/domain/turn_war_dipl_steps.rs (komentarze)
- rust-port/engine/tests/p6_r7k7b_zloze_sync.rs (przepięcie testu na mutator)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1/01-operator-r1.md
`Cargo.lock` nie commitowany (wygenerowany przez cargo, nieśledzony, usunięty po bramkach). `gra/` nietknięte. `git diff --check` czysty.

## TESTY (kody wyjścia, w `rust-port/engine`, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)
- `cargo fmt --check`: EXIT 0 (po `cargo fmt`, które zmieniło tylko 2 pliki allowlisty)
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: EXIT 0 (114 passed, 0 failed, 0 ignored)
- `cargo test --test p6_r7k7b_zloze_sync`: EXIT 0 (3 passed)
- `cargo test --test p6_wire_war_dipl_steps`: EXIT 0 (8 passed)
Brak `#[ignore]`, brak osłabionych asercji.

## BLOKADY
- Mapowanie 10 wołań z pinu poza 24319 do Rust: NIE_ZMIERZONO (opisane wyżej).
- Brak wpięcia `deactivateZlozeGrantsForDeal` (poza zakresem tego tematu; ZLOZA-WIRING).

## RUNDY
1/5 (werdykt: PASS)

## NASTĘPNY KROK
Orkiestrator: Evaluator r1 (weryfikacja tabeli równoważności i przepięcia testu), potem Final Control. Osobny temat na 10 wołań pinu i ZLOZA-WIRING.

## DEPLOY/PUSH
NIE WYKONANO
