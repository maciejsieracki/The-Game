STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K3-Q1 (K3: wieze; obrona Operatora po Evaluatorze r1, runda 1/5)
GOAL: port czesci decyzyjnej `_siegeRamTowerStep` / `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` na K0b/K1/K1b z wektorami z wykonania pinu 07d2fbd72.
ZMIANY/COMMIT: poprawka commit (SHA w sekcji "SHA" nizej, na `ae5676a6c`). Zmienione: `rust-port/engine/src/domain/siege_tactics_tower.rs`, `rust-port/engine/tests/p6_siege_tactics_tower.rs`, `rust-port/engine/tests/p6_siege_tactics_tower_gen.mts`, `rust-port/engine/tests/p6_siege_tactics_tower_vectors/vectors.json` (regenerowany z pina), `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (wiersz 30), ten plik. K0b/K1/K1b (`siege_tactics_walk.rs`, `siege_tactics_approach.rs`, `move.rs`) BEZ zmian. Cargo.lock wygenerowany lokalnie, nie w commicie.

## Odpowiedzi na zarzuty Evaluatora (02-evaluator.md, `6927becbf`)

### Zarzut 1 (`arrive` gubione w `AdvanceToward`) — PRZYJMUJĘ (poprawka + dowod + commit)
- Dowod pinu: `battleScene.ts:8049` `this._advanceToward(ru, wallBase, ru.r, arrive);`, gdzie `arrive` (`:8041-8044`) = `if (ru.q >= wallBase) towerAtWallRows.add(ru.r); done();`. Galaz bramy (`:8035`) przekazuje `done` bez `arrive`.
- Poprawka: `TowerEvent::AdvanceToward { col, row, then_arrive: bool }`. Galaz bramy: `then_arrive: false`; galaz wiezy: `then_arrive: true`. Dokumentacja zdarzenia opisuje obowiazek wolajacego (warunek `ru.q >= col`, dopisanie `ru.r`, potem `done`).
- Generator: atrapa `_advanceToward` zapisuje `thenArrive: done.name === 'arrive'` (nazwa closure z pinu; harness podaje `done` o nazwie `'done'`). Straznik SHA-256 fragmentow pinu bez zmian: `cd4b2e5157b4ae26bfc89924f85cefac3f290e145374effde66a81fdc69b5d36`.
- Wektory regenerowane z pina: `cases=1560`, kategorie bez zmian poza nowa `advance:arrive: 5` (z 11 zdarzen `advance`). md5 `vectors.json` po regeneracji: `0bb55df080395ee8af2ebbbba34fc4ad` (poprzednio `e38a24247e9419a4072ef4d290822693`; zmiana wynika wylacznie z nowego pola `thenArrive` i kategorii).
- Test: `tests/p6_siege_tactics_tower.rs` mapuje `thenArrive` na `then_arrive` i liczy kategorie `advance:arrive`; `assert_eq` rozkladu z `meta.categories` przechodzi.

### Zarzut 2 (galaz `WalkEvent::Refused` / `Gate{refused:true}` niewykonywana) — PRZYJMUJĘ jako fakt, ODRZUCAM zmiane kodu
- Dowod nieosiagalnosci z trzech funkcji: `_siegeMoveRefused` (`:7963-7964`) zwraca `false`, gdy `!_siegeApproachRestricted`. `_siegeApproachRestricted` (`:7951-7955`) zwraca `false` dla `isSiegeUnit(ru.bu)` (tarany i wieze): odmowa dla maszyn nie wystepuje. Piechota w `_siegeInfantryToTowerStep` wychodzi wczesnie przy `towerAtWallRows.size === 0`, a przy niepustym `towerAtWallRows` (`:7960`) `_siegeApproachRestricted` = `!(wallEverBreached || towerAtWallRows.size > 0)` = `false`. Konnica (`mounted`) jest wykluczona na poczatku `_siegeInfantryToTowerStep`. Zatem `Refused` nie moze zajsc w tych trzech funkcjach; wektory `gate:refused = 0` sa zgodne z pinem.
- Ramie `WalkEvent::Refused` w `run_walk` zostaje: jest wymagane przez wyczerpujace dopasowanie zdarzen K1b i jest tym samym kodem, ktory K1b testuje. Odmowa pokryta w `p6_siege_tactics_approach_k1` i `p6_siege_tactics_walk`. Opis w naglowku modulu juz to mowi (`BRAK GALEZI ODMOWY BRAMKI`).

### Zarzut 3 (baza: K1b nie na `origin/rust-port/parity-v2`) — PRZYJMUJĘ jako ustalenie dla orkiestratora (bez zmiany kodu)
- Dispatch w repo (`dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K3-Q1/00-dispatch.md` na `origin/claude/rust-sivvrn`) podaje baze `7276ed3da` (K1b, FC) i gałąź `rust-port-wip/SIEGE-TAKTYKA-K1B-fc`. Tekst zadania z workflow podawal `origin/rust-port/parity-v2`; to sprzeczność, ktora nie nalezy do Operatora. Operator pracowal na bazie z dispatchu w repo.
- Integracja K3 wymaga najpierw K1b na docelowej galezi oraz rozwiazania konfliktu `mod.rs` — decyzja orkiestratora.

### Zarzut 4 (generator nie jest czescia `cargo test`) — ODRZUCAM jako blokade (dowod)
- Dispatch nie wymaga, by generator byl w `cargo test`; wymaga straznika SHA-256 fragmentow pinu, ktory jest i dziala (hash zgodny po regeneracji, patrz zarzut 1). Odtwarzalnosc potwierdzona: generator uruchomiony ponownie na tej samej bazie daje `cases=1560`, ten sam SHA-256 fragmentow i identyczne kategorie poza nowa `advance:arrive`. Zostaje jako udokumentowane uruchamianie recznie: `TOWER_GEN_SCRATCH=<poza repo> node --experimental-strip-types rust-port/engine/tests/p6_siege_tactics_tower_gen.mts`.

### Zarzut 5 (pokrycie NIE_ZMIERZONO; Inf nieprzetestowane; NaN w marszu) — PRZYJMUJĘ jako ograniczenia udokumentowane; NIE zamykam w tej rundzie
- NIE_ZMIERZONO pozostaje: pokrycie linii pinu nie bylo mierzone V8 coverage, liczniki to kategorie wyjsc (`meta.categories`). Wiersz 30 mowi to wprost.
- `Infinity` jako `moveLeft`: nie testowane. Generator losuje tylko skonczone wartosci, a zapis JSON nie koduje Inf. Nie dodaje tego w tej rundzie: wymagaloby rozszerzenia kodowania wektorow i oceny, czy marsz z Inf konczy sie w pinie (guard `_schedule` rzuca po 400 krokach). Dopisane do wiersza 30 jako nieprzetestowane.
- NaN w marszu zapetla sie w pinie; zostaje jawnie opisane (naglowek modulu, wiersz 30).

## Zmiany poza zarzutami
- `cargo fmt` (formatowanie tylko dwoch plikow K3: `siege_tactics_tower.rs` i `tests/p6_siege_tactics_tower.rs`; zmiany skladniowe wylacznie wrapowanie).
- Dopisana kategoria `advance:arrive` w generatorze i w tescie.

## TESTY (CARGO_TARGET_DIR poza repo, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0)
- `cargo fmt --check`: EXIT 0 (po `cargo fmt` na dwoch plikach K3).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 48 passed, 0 failed, 0 ignored, EXIT 0.
- `cargo test --test p6_siege_tactics_approach` 5 passed; `..._approach_k1` 8 passed; `..._walk` 7 passed; `..._end` 8 passed; `..._tower` 12 passed; 0 failed, 0 ignored.
- Generator: `cases=1560 sha256=cd4b2e5157b4ae26bfc89924f85cefac3f290e145374effde66a81fdc69b5d36`.
- NIE_ZMIERZONO: pokrycie linii pinu (V8 coverage).

## BLOKADY
- Brak blokad kodu. Integracja K3 dopiero po K1b na docelowej galezi i rozwiazaniu konfliktu `mod.rs` (zarzut 3).
- Inf jako `moveLeft` nietestowane (zarzut 5).

## SHA
- Poprawka: patrz `git log -1` na galezi detached tej worktree (SHA w raporcie orkiestratora).

RUNDY: 1/5 (obrona)
NASTEPNY KROK: Evaluator r2 / Final Control dla K3 po poprawce `then_arrive`; integracja po K1b.
DEPLOY/PUSH: NIE WYKONANO
