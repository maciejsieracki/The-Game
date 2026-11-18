# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1 — Obrona Operatora r1

```text
STATUS: PASS (obrona: 3 zarzuty PRZYJĘTE z poprawką, 1 zarzut PRZYJĘTY jako dług dla orkiestratora, 1 pozycja informacyjna)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1
GOAL: atakujący przy murze w ProdBody (wieża, piechota pod wieżę, taran/wieża, marsz); zarzuty Evaluatora r1.
ZMIANY/COMMIT: baza obrony = 5f7cc39cc (raport Evaluatora; kod 197d98d42, rodzic 48832747b = BAZA dispatchu);
               commit obrony na rust-port-wip/siege-atk-a-q1-obrona-r1 (SHA w sekcji „Commit” niżej i w odpowiedzi)
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; p6_k5loop_siege_atk_a 7/7 (było 6, +1 nowy);
       8 testów bramkowych EXIT 0 (9+9+6+7+8+10+8+2); lib prod_tag_tests 1/1; pełny engine — §6;
       generator: vectors.json i vectors_nan.json bajt w bajt bez zmian (MD5 d0be50ae…, 8336eef3…), nowy vectors_edge.json;
       mutanty obrony 5/5 zabite (w tym E04 Evaluatora)
BLOKADY: brak
RUNDY: 1/5 (obrona do rundy 1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Baza worktree obrony: `5f7cc39cc` (gałąź Evaluatora; zawiera kod operatora `197d98d42` i raport `fd9e0eb6c`). Linia
„BAZA:” dispatchu (`origin/rust-port/parity-v2` = `48832747b` w chwili startu tematu) dotyczy kodu Operatora; obrona
doklejana jest do łańcucha ocenianego przez Evaluatora, żeby FC oceniało jeden liniowy łańcuch. Integrację z
`aad01dc1d`+ (merge-tree) robi orkiestrator.

## 1. Zarzut 1 (średni, pokrycie) — mutant E04, granice planszy w `advance_toward_pick` — PRZYJMUJĘ

Pin (`07d2fbd72`, `battleScene.ts:7902`):
`if (nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS) continue;` — Rust `siege_tactics_atk.rs:329` 1:1. Kod był
poprawny, brakowało wektora rozstrzygającego (Evaluator ma rację: `VecTerrain` zwraca dla pól poza planszą
„przechodnie, koszt 1”, więc mutant nie jest równoważny).

Poprawka (generator wykonuje tekst pinu, bez losowania pozycji):
- `p6_k5loop_siege_atk_a_gen.mjs`: funkcja `edgeCase(edge, boxed)` — katapulta (`cata`, `machRange 3`, poza zasięgiem
  muru, gałąź `:6214-6216` → `_advanceToward`) na krawędzi: N `(12,0)`, S `(12,155)`, W `(0,40)`, E `(67,40)`.
  Wariant `boxed`: trzy sąsiednie pola NA planszy zajmują sojusznicy, więc jedynym kandydatem bez danego członu warunku
  granicy byłby kierunek poza planszą; pin kończy bez kroku (`cata-toward-idle`). Wariant `free`: te same pozycje bez
  blokad (krok na planszy, `cata-toward-step`). Wyniki pinu (z `vectors_edge.json`):

  | wektor | gałąź pinu | kroki |
  |---|---|---|
  | edge-N-boxed / free | cata-toward-idle / cata-toward-step | [] / [(13,0)] |
  | edge-S-boxed / free | cata-toward-idle / cata-toward-step | [] / [(13,155)] |
  | edge-W-boxed / free | cata-toward-idle / cata-toward-step | [] / [(1,40)] |
  | edge-E-boxed / free | cata-toward-idle / cata-toward-step | [] / [(66,40)] |

- Zbiór generowany PO zbiorach bazowym i NaN do osobnego pliku `vectors_edge.json` — `vectors.json` i
  `vectors_nan.json` zostały bajt w bajt (MD5 `d0be50ae8ded1441dbe71a66c520a2aa`, `8336eef3d6ee820df25a1c0b3609f6b2`
  przed i po; SHA wycinków pinu bez zmian `c3ec2390…87325`). Linia `moveLeft-zero` w `makeCase` nie zużywa RNG, więc nie
  przesuwa sekwencji losowań zbiorów bazowych.
- `p6_k5loop_siege_atk_a.rs`: nowy test `zgodnosc_z_pinem_krawedzie_i_bez_ruchu` — pełne porównanie `check_case` dla 88
  wektorów (ślad, czas, kroki, facing, stan końcowy, `occByKey`, tagi) + jawne asercje: dla każdej z 4 krawędzi
  `boxed` = `cata-toward-idle` bez kroków, `free` = `cata-toward-step`; strażnik 90 s jak w pozostałych testach pętli.
  `brak_tagow_t2a_dla_atakujacego` obejmuje teraz także `VECTORS_EDGE`.

Dowód (mutanty obrony, skrypt `scratchpad/siegeatka-obr/mut.py`: podmiana → `cargo test --test p6_k5loop_siege_atk_a`
→ przywrócenie; `git status` po przebiegu = tylko zamierzone zmiany):

| mutant | wynik |
|---|---|
| O1 usunięty `nc < 0` | ZABITY (`zgodnosc_z_pinem_krawedzie_i_bez_ruchu`) |
| O2 usunięty `nr < 0` (= E04 Evaluatora) | ZABITY |
| O3 usunięty `nc >= BF_COLS` | ZABITY |
| O4 usunięty `nr >= BF_ROWS` | ZABITY |

## 2. Zarzut 2 (niski, pokrycie) — licznik `inf-walk-idle` bez wektorów — PRZYJMUJĘ

Pin: `_siegeInfantryToTowerStep` (`:8098-8099`) — `if (!this._bfsFirstStep(ru, goal)) return false;
this._siegeWalkTo(ru, goal, done); return true;`, a `_siegeWalkTo` (`:8010`) kończy od razu przy `ru.moveLeft <= 0`.
Gałąź jest osiągalna w AUTO: `_activateUnit` (`:6048-6178`) nie bramkuje `moveLeft` przed `:6179` (sprawdzone: w tym
zakresie brak odczytu `moveLeft`).

Poprawka: w generatorze tryb `moveLeft-zero` (`me.moveLeft = 0` po zbudowaniu scenariusza) i 80 scenariuszy `inf`
w `vectors_edge.json`; wynik pinu: `inf-walk-idle` = 49 wektorów (reszta: `climb` 8, tagi T2b/T4). Test
`zgodnosc_z_pinem_krawedzie_i_bez_ruchu` wymaga `inf-walk-idle >= 20` i każdy z tych wektorów przechodzi pełne
porównanie z Rust (w tym `moveLeft` bitowo, czas aktywacji 0, brak kroków).

## 3. Zarzut 3 (niski) — `ActivateEvent::AdvanceToward` poza `siege_atk` pomijane po cichu — PRZYJMUJĘ

Zmiana w `siege_tactics_loop.rs`:
- ramię dopasowania ma strażnika: `ActivateEvent::AdvanceToward { col, row } if siege_atk => toward = Some((col, row))`;
  w każdym innym przypadku zdarzenie spada do ramienia `other => skipped.push(prod_tag(other))`;
- `prod_tag`: `ActivateEvent::AdvanceToward { .. } => "marsz-poza-oblezeniem"` (jawny tag, nie `inne`, nie cisza).
  Wybrałem jawny tag zamiast `debug_assert!`, bo zgodnie z zasadą „bez cichego zera” ścieżka zostawia ślad także
  w buildzie release; zdarzenie pozostaje strukturalnie nieosiągalne (maszyna emituje je tylko w gałęzi
  `isSiegeUnit && side === 'atk' && siegeWallCol >= 0`, pin `:6187`, Rust `siege_tactics_activate.rs:384-390`), więc
  wektory się nie zmieniają.
- Test jednostkowy `prod_tag_tests::advance_toward_outside_siege_atk_has_explicit_tag` (lib). Mutant O5 (`"marsz-poza-
  oblezeniem"` → `"inne"`) — ZABITY.

## 4. Zarzut 4 (dług, zgodnie z dispatchem) — `ProdBody::wall_ever_breached` vs `SiegeEnv::wall_ever_breached` — PRZYJMUJĘ jako dług

Bez zmian kodu w tym temacie (dispatch: sekcja „Długi” dla T2b/T4/#369, m.in. synchronizacja `wall_ever_breached`).
Wpis jest w `01-operator-r1.md` §8 „Długi”. Do przeniesienia przez orkiestratora do `REJESTR-RUST.md` (#369 K5LOOP-WIRING
/ T7), bo `REJESTR-RUST.md` jest poza allowlistą tematu.

## 5. Pozycja informacyjna Evaluatora — bez sprzeciwu

Potwierdzam: bramki r1 zielone, generator bajt w bajt, filtr `Facing` w `p4_1i3_actions.rs` (D-INT-2) bez zmian w tej
obronie, baza `48832747b`; parity-v2 jest dalej (`aad01dc1d`), integracja wymaga merge-tree (zadanie orkiestratora).

## 6. Bramki obrony (`CARGO_TARGET_DIR` = scratchpad `siegeatka-obr/target`, flagi z dispatchu)

| bramka | wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_a` | 7 passed, EXIT 0 |
| 8 testów bramkowych z dispatchu | bridge_contract 9, p4_1i3_actions 9, p6_k5doc_t8 6, p6_k5loop_close_r4 7, p6_k5loop_outcome_pin 8, p6_k5loop_siege_def 10, p6_siege_tactics_loop_body 8, p6_siege_tactics_loop_body_pin 2 — EXIT 0 |
| `cargo test --lib prod_tag_tests` | 1 passed (w przebiegu mutantów, wersja niezmutowana zielona w pełnym teście) |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | `EXIT full 0`; 537× `test result: ok`; 4045 passed, 0 failed, 1 ignored (istniejący; +2 względem r1: nowy test krawędzi i `prod_tag_tests`) |
| generator (`/opt/node22/bin/node …_gen.mjs`) | EXIT 0; SHA wycinków `c3ec2390…87325`; stare pliki wektorów bajt w bajt |

## 7. Pliki (allowlista)

- `rust-port/engine/src/domain/siege_tactics_loop.rs` (strażnik ramienia, `prod_tag`, moduł testowy `prod_tag_tests`);
- `rust-port/engine/tests/p6_k5loop_siege_atk_a.rs` (nowy test, `VECTORS_EDGE`);
- `rust-port/engine/tests/p6_k5loop_siege_atk_a_gen.mjs` (tryb `moveLeft-zero`, `edgeCase`, zapis `vectors_edge.json`);
- nowy `rust-port/engine/tests/p6_k5loop_siege_atk_a_vectors/vectors_edge.json`;
- ten raport.

Brak zmian w `renderer/`, `view-model/`, `bridge.rs`, `battle_setup*.rs`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`;
brak `#[ignore]`, brak usuniętych asercji, wektory r1–r4 nietknięte.

## 8. Sprzątanie

`CARGO_TARGET_DIR` obrony usunięty po bramkach. Brak push/deploy/integracji.
