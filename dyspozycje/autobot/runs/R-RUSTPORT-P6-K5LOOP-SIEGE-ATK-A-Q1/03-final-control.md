# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1
GOAL: atakujący przy murze w ProdBody: wejście na mur od wieży, piechota pod wieżę, taran/wieża, marsz
      (_advanceToward/_siegeWalkTo); zdjęte tagi wieza-wejscie/piechota-do-wiezy/taran-wieza/marsz; ClimbWall bez DTO.
ZMIANY/COMMIT: oceniany łańcuch 197d98d42 (kod Operatora) -> fd9e0eb6c (raport) -> 5f7cc39cc (Evaluator)
               -> eaf709a67 (Obrona); merge-base z origin/rust-port/parity-v2 = 48832747b (BAZA dispatchu).
               Ten raport = commit-dziecko eaf709a67 na gałęzi fc/siege-atk-a-q1 (tylko ten plik).
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; nowy test 7/7; 8 testów bramkowych EXIT 0;
       pełny cargo test --all-targets --no-fail-fast na DRZEWIE PO MERGE z parity-v2 789d49bd8: EXIT 0,
       538 x "test result: ok", 4053 passed / 0 failed / 1 ignored (istniejący);
       generator odtworzony bajt w bajt (3 pliki wektorów); mutanty FC 6: 5 zabitych, 1 równoważny (uzasadniony)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge na parity-v2 789d49bd8+; merge-tree czysty), wpis długów do REJESTR-RUST.md
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, łańcuch, allowlista (sprawdzone samodzielnie)

- `git merge-base origin/rust-port/parity-v2 eaf709a67` = `48832747b` = BAZA z dispatchu.
- parity-v2 przesunęło się do `789d49bd8` (#371-T5a/T5b). `git merge-tree --write-tree origin/rust-port/parity-v2
  eaf709a67` = drzewo `63bba7dcc` bez konfliktów. Pełną bramkę uruchomiłem na tymczasowym commicie merge (gałąź
  lokalna usunięta po bramce), więc wynik dotyczy stanu PO integracji.
- `git diff --stat 48832747b eaf709a67`: 13 plików, wszystkie w allowliście: `siege_tactics_loop.rs`,
  `siege_tactics_actions.rs` (wyłącznie wariant `BattleAction::ClimbWall`, `ActionError::ClimbWallWithoutDto` i ramię
  w `actions_to_dto`), nowy `siege_tactics_atk.rs` + jedna linia `pub mod` w `domain/mod.rs`, nowe
  `p6_k5loop_siege_atk_a.rs` / `_gen.mjs` / `_vectors/{vectors,vectors_nan,vectors_edge}.json`, `p4_1i3_actions.rs`
  (plik z sekcji dozwolonych zmian), raporty runu. Brak zmian w `renderer/`, `view-model/`, `bridge.rs`,
  `battle_setup*.rs`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`.
- Brak `#[ignore]` w diffie, brak usuniętych linii `assert*`, wektory `p6_k5loop_close_*` nietknięte.
- Commity mają wyłącznie trailer `Claude-Session:`, bez `Co-Authored-By` z nazwą modelu.
- `Ram`, `TowerDestroyed`, `LeaveField` nie dodane: pin w gałęziach T2a (`:8022-8101`) nie wywołuje ich efektów
  (`_attackGate` = T2b). Zgodne z dispatchem („tylko te, które pin wywołuje”).

## 2. Bramki (moje przebiegi; `CARGO_TARGET_DIR` = scratchpad `siegeatka-fc/target`, flagi z dispatchu)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_a` | 7 passed |
| `p6_k5loop_siege_def`, `p6_siege_tactics_loop_body`, `…_body_pin`, `p6_k5loop_outcome_pin`, `p6_k5loop_close_r4`, `p6_k5doc_t8`, `p4_1i3_actions`, `bridge_contract` | 10, 8, 2, 8, 7, 6, 9, 9 passed; EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (w tle `setsid nohup`, drzewo po merge z `789d49bd8`) | `EXIT full 0`; 538× ok; 4053 passed, 0 failed, 1 ignored |
| generator `/opt/node22/bin/node …_gen.mjs` | EXIT 0; SHA wycinków pinu `c3ec2390…87325`; MD5 `vectors.json` `d0be50ae…`, `vectors_nan.json` `8336eef3…`, `vectors_edge.json` `3291b709…` identyczne przed i po; `git status` czysty |

Pokrycie gałęzi (wyjście generatora): bazowe 1240 wektorów — `inf-walk` 208, `climb` 104, `ramtower-walk` 228,
`ramtower-walk-idle` 44, `ramtower-toward-step` 53, `ramtower-toward-idle` 49, `tower-atwall` 33, `cata-toward-step`
87, `cata-toward-idle` 35, `breachLogged` 92, `multiStep` 216; NaN 460 (`moveLeftNanMultiStep` 90, `costNanStep` 12);
krawędzie/`moveLeft 0` 88 (`inf-walk-idle` 49, krawędzie N/S/W/E ×2). Renderer nie dotyczy tematu.

## 3. Przegląd kodu wobec pinu (`07d2fbd72`, `battleScene.ts`)

Porównałem tekst pinu `:6179-6220`, `:7892-7916`, `:8006-8101` z `siege_tactics_atk.rs`:
- `tower_climb_allowed` = `:8057-8066` (DIRS4, `towerAtWallRows.has(ru.r + dr)`, korona w `ru.r`, `.has` na kluczach).
- `infantry_to_tower_plan` = `:8088-8100` (wyjście strzelca `primaryRanged && canShoot && shootingEnabled !== false`,
  `Wait` przy celu, `NotHandled` gdy BFS bez kroku).
- `ram_tower_plan` = `:8023-8053` (`nearGate` z `min`, BFS z `prefRow = siegeGateRow`, fallback
  `_advanceToward(siegeGateCol, siegeGateRow)`; wieża `q >= wallBase` → `AtWall`, `arrive` z dopisaniem wiersza).
- `advance_toward_pick` = `:7896-7915` (kolejność N,S,W,E, granice planszy, `=== Infinity`, `d < bestDist` ostre).
- `siege_atk_climb` (`siege_tactics_loop.rs`): kolejność `occ.delete → q → onWallWalkway → wyłom+Log → occ.set →
  ClimbWall → moveLeft 0`, czas 0 — zgodna z `:8067-8082`.
- Tag po stronie `atk` przy murze: zdjęte `wieza-wejscie`, `piechota-do-wiezy`, `taran-wieza`, `marsz`; zostają jawne
  `atak-muru` (`_attackWallTile`, T2b) i `oblezenie` (cios/doktryna/strzelec/jazda/falanga przy murze — T2b/T4), bez
  cichego zera. Spełnia kryterium końca.

## 4. Mutanty Final Control (`siegeatka-fc/mut.py`: podmiana → `cargo test --test p6_k5loop_siege_atk_a` → przywrócenie; `git status` po przebiegu czysty)

| Mutant | Wynik |
|---|---|
| F1 `tower_climb_allowed`: `tower_rows.contains(r + dr)` → `contains(r)` | ZABITY |
| F2 piechota: wyjście strzelca bez `can_shoot` | ZABITY |
| F3 taran: `is_ram && !gate_open` → `is_ram` | PRZEŻYŁ — RÓWNOWAŻNY (niżej) |
| F4 taran `nearGate`: `<= 1` → `< 1` | ZABITY |
| F5 wyłom: log przy każdym wejściu (bez `!wall_ever_breached`) | ZABITY |
| F6 wieża `AtWall`: `q >= wall_base` → `q > wall_base` | ZABITY |

F3 — równoważność: w AUTO pin woła `_siegeRamTowerStep` wyłącznie pod warunkiem `(isRam && !this.gateOpen) || isTower`
(`:6191`), a Rust ma ten sam strażnik zewnętrzny (`siege_tactics_activate.rs:356`). Taran przy otwartej bramie nie
dochodzi do wewnętrznego warunku `:8025`, więc jego usunięcie nie zmienia zachowania w zakresie T2a. Wewnętrzny warunek
ma znaczenie wyłącznie dla trybu ręcznego (`_performSiegeManualOrder`, poza tematem); port go zachowuje 1:1.

Łącznie z 22 mutantami Operatora, 14 Evaluatora i 5 Obrony próg dispatchu (>= 12) jest spełniony z dużym zapasem.

## 5. Orzeczenia zarzutów

| # | Zarzut (źródło) | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | E04: granice planszy w `advance_toward_pick` bez wektora (Evaluator, średni) | ODDAL | Naprawione w Obronie: `vectors_edge.json` (krawędzie N/S/W/E, warianty boxed/free); mutanty O1–O4 zabite; stare wektory bajt w bajt (sprawdziłem MD5 sam). |
| 2 | `inf-walk-idle` bez wektorów (Evaluator, niski) | ODDAL | Naprawione: tryb `moveLeft-zero`, 49 wektorów `inf-walk-idle`, asercja `>= 20` w teście. Osiągalność w AUTO potwierdzona w pinie (`:6048-6178` nie czyta `moveLeft`). |
| 3 | `AdvanceToward` poza `siege_atk` pomijane po cichu (Evaluator, niski) | ODDAL | Naprawione: strażnik ramienia + jawny tag `marsz-poza-oblezeniem`, test `prod_tag_tests`, mutant O5 zabity. |
| 4 | `ProdBody::wall_ever_breached` nie synchronizowane z `SiegeEnv::wall_ever_breached` (Evaluator, dług) | ODDAL (dług z dispatchu) | Dispatch wprost przypisuje to do sekcji „Długi” (T2b/T4/#369); wpis jest w `01-operator-r1.md` §8. Do przeniesienia do `REJESTR-RUST.md` przez orkiestratora. |
| 5 | F3 przeżył (FC) | ODDAL | Mutant równoważny w zakresie AUTO (§4). |
| 6 | Filtr `Facing` atakującego w `p4_1i3_actions.rs` (zmiana asercji D-INT-2) | ODDAL | Uzasadnienie pisemne w `01-operator-r1.md` §3.1; filtr tylko po stronie Rust, nie ukrywa akcji pinu (zwrot z `_startRout` dalej porównywany); brak zmian wektorów. Dopuszczone sekcją „Dozwolone zmiany” dispatchu. |

Brak orzeczeń NAPRAW. Brak pozycji DO DECYZJI CZŁOWIEKA (brak gameplay poza webem).

## 6. Uwagi dla integracji (PASS-WITH-NOTES)

1. Integracja na aktualne parity-v2 (`789d49bd8` w chwili FC): merge-tree czysty, pełny test na drzewie po merge zielony.
2. Długi do `REJESTR-RUST.md`: synchronizacja `wall_ever_breached` (ProdBody ↔ SiegeEnv, #369/T7); gałęzie T2b
   (`atak-muru`, `oblezenie`, `_attackGate`, `_breachGate`, `_breachWallTile`, `destroy_tower_at_row`); DTO
   `ClimbWall` w I5b (#370).
3. Kolejny temat na `siege_tactics_loop.rs` (T2b/T4) dopiero po integracji tego.

## 7. Sprzątanie

`CARGO_TARGET_DIR` FC usunięty po bramkach i mutantach; tymczasowa gałąź merge usunięta. Wolne: 11 GB. Brak
push/deploy/integracji.
