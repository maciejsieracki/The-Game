# OPERATOR — runda 1 (R-RUSTPORT-P6-K5LOOP-FACING-Q1)
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-FACING-Q1
GOAL: Port `_nearestEnemy`/`_updateFacing`/`facingFromTo` i `relativeHit` z pinu do generatora i do ProdBody. Stan `facing` jednostek
  i łuk ciosu liczony z AKTUALNEGO facing i pozycji. Test ≥300 sekwencji wieloaktywacyjnych z porównaniem hit/dmg/hp/engaged/trace i facing.

Baza: 4d2e1dfcb (FC K5LOOP-BODY r3). Pin: 07d2fbd72 (tylko odczyt, `git show`). Commit: SHA w sekcji DEPLOY/PUSH.

## Zrobione (kod)
1. Generator (`tests/p6_siege_tactics_loop_body_gen.mjs`):
   - WYKONYWANY tekst pinu: `facingToward` (battleScene.ts:347), `facingFromTo` (359), `oppositeDir` (370), `relativeHit` (385),
     `manhattan` (1917), `_nearestEnemy` (8296), `_updateFacing` (8334), przypisanie `attacker.facing = facingFromTo(...)` z `_doMeleeAttack` (9104).
   - Enum `Dir` (const enum, poza strip-only Node) to prelude `{N:0,E:1,S:2,W:3}`; wartości strzeżone `expectLine` na liniach 316-319.
   - Usunięte stuby `relativeHit` (poprzednio `arcOf`) i `_nearestEnemy` (poprzednio `null`). `arcOf` usunięte.
   - Nowy strażnik `FACING_SHA256` = 6d4858ed...eae3 (SHA-256 wyciętych fragmentów facing; wartość zapisana w generatorze i w teście pinu).
   - `DOATTACK_SHA256` bez zmian (592a6cbc..., zgodny z pinem).
   - Instrumentacja (nie logika): `_updateFacing` dopisuje `facing` do sladu (jak dotąd), `relativeHit` zapisuje łuk do `OUT.arc`; `dirYaw` = stub 0 (render).
   - Stan: `facing` początkowy 0..3, `facing` każdej jednostki po KAŻDEJ aktywacji w wektorach; łuk każdego ciosu w `blow.arc`.
2. ProdBody (`src/domain/siege_tactics_loop.rs`):
   - `ProdUnit.facing: f64` (nowe pole); `ProdBody.facing: [Vec<f64>; 2]` (stan), `pub fn facing(unit)`.
   - `UpdateFacing` w `start`: `update_facing` = najbliższy żywy wróg (Manhattan, pierwszy minimalny), `facing_toward` z obecnym facing; brak wroga = bez zmian.
   - `complete`: najpierw zwrot atakującego ku celowi (`facing_toward`, jak `_doMeleeAttack`), potem `hit_arc = relative_hit(facing obrońcy, pozycje)`.
   - `BlowRecord.hit_arc: HitArc` (nowe pole, obserwacja).
   - Używa istniejących `siege_tactics_inputs_pos::{facing_toward, relative_hit, JsVal}` (bez zmian w tym pliku).
3. Testy:
   - `p6_siege_tactics_loop_body_pin.rs`: `facingSha256` (assert), ≥300 sekwencji (było ≥200), per aktywacja: `facing` każdej jednostki, `hitArc` każdego ciosu,
     pokrycie `facing_changes > 0` i `reverse_arc_diff > 0` (cios A→B, potem B→A z innym łukiem). Nic nie osłabiono.
   - `p6_siege_tactics_loop_body.rs`: konstruktory `ProdUnit` z `facing: 0.0`; oczekiwany łuk `melee_blow()` ustawiony na `Flank`
     (obrońca (1,0) facing N, atak z (0,0): kierunek W, czyli flank wg `relativeHit`). Poprzednia wartość `Front` była wartością szablonu, nie pinu.
4. Vectors: `vectors.json` 2.99 MB (≤ 8 MB). Generator: 320 sekwencji, 1740 aktywacji, 684 ciosy, `reverseArcDiff` = 39.

## Bramki (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usunięty po bramkach)
- `cargo fmt --check` (rust-port/engine): EXIT 0 (po `cargo fmt` na plikach tematu)
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: 88/88, EXIT 0
- `cargo test --test p6_siege_tactics_loop_body_pin`: 1/1, EXIT 0 (320 sekwencji, facing/arc/engaged/trace zgodne z pinem)
- `cargo test --test p6_siege_tactics_loop_body` + `p6_siege_tactics_loop`: 4/4 + 4/4, EXIT 0
- `node p6_siege_tactics_loop_body_gen.mjs` po zmianie komentarzy: wektory bajt-w-bajt identyczne (cmp SAME)
- `git diff --check`: EXIT 0
- Pełny `cargo test` NIE wykonany (zgodnie z dispatchem: runda integracyjna).

## Zmieniony zakres (allowlista)
- rust-port/engine/src/domain/siege_tactics_loop.rs
- rust-port/engine/tests/p6_siege_tactics_loop_body.rs, p6_siege_tactics_loop_body_pin.rs, p6_siege_tactics_loop_body_gen.mjs
- rust-port/engine/tests/p6_siege_tactics_loop_body_vectors/vectors.json
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FACING-Q1/01-operator-r1.md
- Nie dotknięto: gra/**, rust-port/engine/data/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (plik lock utworzony przez cargo został usunięty, nie commitowany).

## BLOKADY / NIE_ZMIERZONO
- Kontratak `_defenderCounters`, efekty `_resolveBlowOutcome` (morale/rout po ciosie), `_targetInRange`, `BLOW_HIT_T`: poza zakresem (dispatch); nadal nieportowane.
- Ruch: ProdBody nie porusza jednostek, więc `_updateFacing` po krokach (`_advanceStep`, ruch po `_moveCostForUnit`) nie jest w ciele; ścieżki ruchu są nieportowane.
- `dirYaw` (yaw modelu) = render, stub 0; nie jest częścią stanu facing.
- `Dir` jako prelude, nie przez wykonanie `const enum` (ograniczenie strip-only Node); wartości strzeżone liniami 316-319.
- Pokrycie zgodności łuku dotyczy szablonu w zwarciu (AUTO, bez oblężenia, bez strzelca, bez doktryny), jak w poprzednich rundach.
- Push / integracja / deploy: NIE WYKONANO (Operator nie pushuje; gałąź robocza lokalna).

## RUNDY
1/5 (Operator). Następny krok: Evaluator (Sonnet) na 01-operator-r1 i diff od 4d2e1dfcb.
NASTĘPNY KROK: Evaluator — sprawdzić, czy łuk i facing są liczone z pinu (nie z szablonu), oraz czy asercje nie zostały osłabione.
DEPLOY/PUSH: NIE WYKONANO
