# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1
GOAL: atakujący przy murze w ProdBody: wejście na mur od wieży, piechota pod wieżę, taran/wieża, marsz
      (_advanceToward/_siegeWalkTo); zdjęcie tagów wieza-wejscie/piechota-do-wiezy/taran-wieza/marsz; ClimbWall bez DTO.
ZMIANY/COMMIT: oceniany kod 197d98d42 (rodzic 48832747b = BAZA dispatchu), raport operatora fd9e0eb6c;
               ten raport = commit-dziecko fd9e0eb6c na rust-port-wip/siege-atk-a-q1-eval-r1 (tylko ten plik)
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; nowy test 6/6; 8 plików bramkowych zielone; lib siege_tactics_atk 2/2;
       pełny engine EXIT 0 (537 binarek ok, 4043 passed / 0 failed / 1 ignored — istniejący); generator odtworzony
       bajt w bajt; mutanty Evaluatora 14: 13 zabitych, 1 przeżył (E04, granica planszy)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona (02a-obrona.md), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista

- `git merge-base origin/rust-port/parity-v2 fd9e0eb6c` = `48832747b` (BAZA z dispatchu). Od tego czasu parity-v2 poszło
  do `aad01dc1d` (#371-T5a) — integracja orkiestratora musi to uwzględnić (merge-tree), poza oceną.
- `git diff --stat 48832747b fd9e0eb6c`: 10 plików, wszystkie w allowliście: `siege_tactics_loop.rs`,
  `siege_tactics_actions.rs` (WYŁĄCZNIE wariant `ClimbWall`, `ActionError::ClimbWallWithoutDto`, ramię w
  `actions_to_dto` — sprawdzone w diffie), nowy `siege_tactics_atk.rs` + jedna linia `pub mod` w `domain/mod.rs`, nowy
  test/generator/wektory, `p4_1i3_actions.rs` (plik z sekcji dozwolonych zmian), raport. Brak zmian w `renderer/`,
  `view-model/`, `bridge.rs`, `battle_setup*.rs`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md`. Raport nie ma sekcji „Pliki
  spoza allowlisty”, bo takich plików nie ma (potwierdzone).
- Brak `#[ignore]` w diffie; brak usuniętych linii `assert*` (`git diff … | grep '^-.*assert'` puste).
- `Ram`, `TowerDestroyed`, `LeaveField` nie dodane — zgodnie z dispatchem (pin w gałęziach T2a woła tylko wejście na mur
  i wpis dziennika; `_attackGate` = T2b). Sprawdzone w tekście pinu `:8022-8101`.

## 2. Bramki odtworzone (moje przebiegi, `CARGO_TARGET_DIR` w scratchpadzie `siegeatka-eval/target`, flagi z dispatchu)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_a` | 6 passed, EXIT 0 |
| 8 testów bramkowych (`p6_k5loop_siege_def`, `p6_siege_tactics_loop_body`, `…_body_pin`, `p6_k5loop_outcome_pin`, `p6_k5loop_close_r4`, `p6_k5doc_t8`, `p4_1i3_actions`, `bridge_contract`) | 10+8+2+8+7+6+9+9 passed, EXIT 0 |
| `cargo test --lib siege_tactics_atk` | 2 passed, EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | `EXIT full 0`; 537× `test result: ok`; 4043 passed, 0 failed, 1 ignored (istniejący `e2e::dump_tick1_econ_for_web_generator`) |
| `node …/p6_k5loop_siege_atk_a_gen.mjs` (TS z `/opt/node22`) | EXIT 0, SHA wycinków `c3ec2390…87325`; MD5 `vectors.json` `d0be50ae…` i `vectors_nan.json` `8336eef3…` identyczne przed i po (bajt w bajt) |

Renderer nie dotyczy (temat bez renderera). Wolne miejsce: 12 GB na starcie, 5,3 GB po pełnym teście (inny workflow
w toku) — target usunięty po bramkach (§7).

## 3. Orakul: generator wykonuje tekst pinu

- Generator wycina z `git show 07d2fbd72:…` metody `_activateUnit` (`:6048-6299`), `_advanceToward` (`:7892-7916`),
  `_siegeApproachRestricted`/`_siegeMoveRefused`, `_bfsFirstStep`, `_siegeWalkTo` (`:8006-8019`), `_siegeRamTowerStep`
  (`:8022-8053`), `_trySiegeTowerClimb` (`:8056-8084`), `_siegeInfantryToTowerStep` (`:8087-8101`), `_doMove`
  (`:8685-8776`) i resztę zależności; strażnik nagłówków, końców metod i SHA-256. Sam sprawdziłem numery linii w pinie
  (zgodne z raportem i dispatchem `:6179-6220`).
- Opakowania harnessu (`_trySiegeTowerClimb`, `_doMove`, `_updateFacing`, `_advanceToward`) tylko rejestrują i delegują do
  oryginału (zmiana nazwy przez `rename`, treść nietknięta). Atrapy-znaczniki dotyczą wyłącznie gałęzi spoza T2a.
- Stuby wejść są zgodne z pinem: `siegeGateCol = wallCol` (pin `:4045` ustawia zawsze `wallCol`), `shootingEnabled`
  w pinie jest wyłącznie `true` w AUTO (grep: brak przypisania `false` w scenie), `_executeGroupDoctrineStep` → `true`
  (pin: każda ścieżka `return true`, a Rust `doctrine_returns` przeszedł 175 wektorów `tag-doctrine`).

## 4. Przegląd kodu wobec pinu (wynik: zgodny)

- `tower_climb_allowed` = `:8057-8066` (DIRS4 N,E,S,W; korona w wierszu `ru.r`, nie `r+dr` — jak w pinie).
- `infantry_to_tower_plan` = `:8088-8100`; `ram_tower_plan` = `:8023-8053` (taran: `nearGate` z `min`, BFS z `prefRow =
  siegeGateRow`, `_advanceToward(siegeGateCol, siegeGateRow)`; wieża: `q >= wallBase` → dopisanie, cel z
  `wallTileHp.has` = klucze mapy, także HP 0 — zgodnie z `.has`).
- `advance_toward_pick` = `:7896-7915` (kolejność N,S,W,E, `=== Infinity` — NaN NIE odrzuca, `d < best`).
- `siege_atk_climb`: kolejność `occ.delete → q = wallCol → onWallWalkway → wyłom+log → occ.set → moveLeft = 0`;
  akcje `Log` przed `ClimbWall`, czas 0. Zgodne z `:8067-8082`.
- Czas marszu: `t0` kroku k = k·(240+70), `dur` = kroki·240 + `_schedule`·70 (ostatni krok u celu bez `_schedule`).
- `arrive` wieży wykonywany także na ścieżce preludium `_advanceToward` (pin: `done = arrive`). Na ścieżce bez ruchu
  `q < wallBase`, więc dopisanie i tak nie zachodzi — zgodne.
- Decyzje wież liczone przed maszyną: między startem aktywacji a `:6179` pin zmienia tylko `ru.range`
  (`_applyTerrainRange`), morale okrążenia i `facing`; żadna z trzech funkcji ich nie czyta. Rout z okrążenia kończy
  aktywację wcześniej (`_fleeStep`). Teza operatora potwierdzona.
- Pętla marszu z `moveLeft = NaN` nie ma licznika iteracji (K1b), ale kończy się: BFS daje pierwszy krok najkrótszej
  ścieżki do celu niezależnego od pozycji maszerującego, więc odległość maleje ściśle; odmowa/brak terenu ustawia
  `moveLeft = 0`. To parytet z pinem (warunek `ru.moveLeft <= 0` fałszywy dla NaN); „lekcja NaN” z dispatchu jest
  spełniona przez test zakończenia (90 marszów wielokrokowych z NaN) i strażnik 90 s — dosłowne `|| is_nan()` złamałoby
  parytet (wektory pinu mają marsz wielokrokowy z NaN).

## 5. Zmiana istniejącej asercji (`p4_1i3_actions.rs`, D-INT-2) — przyjęta

Filtr pomija w oknie wieży `Facing` atakującego, który nie jest pierwszym `Facing` po jego `Rout`. Filtr działa tylko po
stronie Rust: nie może ukryć brakującej akcji pinu (wektory bez zmian, ich `Facing` po `Rout` nadal porównywane), może
ukryć tylko dodatkowy zwrot z aktywacji, którego generator okna (`_fireOneTower` bez aktywacji) nie modeluje — analogia
do istniejącego wyjątku `synthetic_def` z T1. Ruchy/ciosy atakującego w oknie nadal dają rozbieżność. Uzasadnienie
pisemne w `01-operator-r1.md` §3.1 jest.

## 6. Mutanty Evaluatora (`siegeatka-eval/mut.py`, każdy: podmiana → `cargo test --test p6_k5loop_siege_atk_a` → przywrócenie; `git status` po przebiegu czysty)

| Mutant | Wynik |
|---|---|
| E01 wejście na mur: stare pole nie zwalniane w `occByKey` | ZABITY (zgodność, NaN) |
| E02 `arrive` po `_advanceToward`: `q >= base` → `q > base` | ZABITY |
| E03 taran `nearGate`: `min` → `max` | ZABITY |
| E04 `advance_toward_pick`: usunięty warunek `nr < 0` | **PRZEŻYŁ** |
| E05 marsz: `passable_free` bez zajętości | ZABITY |
| E06 plan BFS bez zajętości | ZABITY |
| E07 `ProdOps::infantry_to_tower` bez `infantry_missing` | ZABITY (`bez_terenu_jawne_tagi_ruchu`) |
| E08 czas marszu: GAP na każdy krok zamiast na `_schedule` | ZABITY |
| E09 wieża pod murem bez dopisania wiersza | ZABITY |
| E10 tag `oblezenie` bez ciosu | ZABITY (także `brak_tagow_t2a…`) |
| E11 cel wieży bez `!occupied(korona)` | ZABITY |
| E12 cel piechoty: drugi człon bez `!rows.has(r)` | ZABITY |
| E13 `arrive` po `_siegeWalkTo` pominięte | ZABITY |
| E14 `_advanceToward`: koszt `Infinity` nie odrzuca | ZABITY |

Razem z 22 mutantami operatora (sprawdziłem ich opis wobec kodu; nie powtarzałem) pokrycie warunków jest mocne.

E04 — analiza: w wektorach tylko 1 (+1 NaN) przypadek `_advanceToward` przy krawędzi planszy, nierozstrzygający.
Teren testowy (`VecTerrain`) zwraca dla `(q, -1)` „przechodnie, koszt 1”, więc mutant NIE jest równoważny: jednostka
w wierszu 0 stojąca w celu (remis d=1 dla N/S/W/E) wybrałaby N = `(q,-1)`. Analogicznie pozostałe trzy człony granicy
(`nc < 0`, `nc >= BF_COLS`, `nr >= BF_ROWS`) są niepokryte. Kod jest poprawny (przepisany 1:1 z pinu `:7902`), brakuje
wektora.

## 7. Zarzuty (do Obrony / następnej rundy)

1. (średni, pokrycie) E04 przeżył: granice planszy w `advance_toward_pick` (`nc<0`, `nr<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`)
   bez wektora rozstrzygającego. Wymagane: scenariusze generatora z jednostką na krawędzi (wiersz 0/155, kolumna 0)
   i celem dającym remis z kierunkiem poza planszą, albo test jednostkowy na `advance_toward_pick` z terenem
   przechodnim poza planszą.
2. (niski, pokrycie) Gałąź `inf-walk-idle` (BFS ma krok, `moveLeft <= 0`) ma 0 wektorów — generator losuje `moveLeft`
   piechoty z `[1,2,3,4,6,8]`. Ścieżka idzie przez wspólne K1b, ale nazwa licznika istnieje bez pokrycia.
3. (niski, informacyjnie) `ActivateEvent::AdvanceToward` poza `siege_atk` jest teraz pomijane bez tagu (dawniej
   `marsz`). Strukturalnie nieosiągalne (maszyna emituje je tylko dla machiny atakującego przy murze, a niespójny mur
   kończy się wcześniej tagiem), ale warto `debug_assert!`/jawny tag zamiast cichego pominięcia.
4. (dług, zgodnie z dispatchem) `ProdBody::wall_ever_breached` ustawiane wejściem na mur nie trafia do
   `SiegeEnv::wall_ever_breached` — zapisane przez operatora w §8 „Długi” (T2/T7 #369). Do rejestru orkiestratora.

Werdykt: PASS-WITH-NOTES — parytet z pinem potwierdzony wektorami wykonującymi tekst pinu, bramki zielone, allowlista
czysta; zarzut 1 to luka testu (nie kodu), do domknięcia w Obronie albo jako dług w FC.

## 8. Sprzątanie

`CARGO_TARGET_DIR` (`siegeatka-eval/target`, 3,6 GB) usunięty po bramkach i mutantach. Brak push/deploy/integracji.
