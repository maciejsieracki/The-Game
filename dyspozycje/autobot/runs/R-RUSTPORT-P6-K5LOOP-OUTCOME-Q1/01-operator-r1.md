STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1
GOAL: efekty po ciosie (morale, rout, usuniecie z pola) w produkcyjnej sciezce `ProdBody::strike` zgodnie z pinem 07d2fbd72; usuniecie `unported` dla tych efektow.
ZMIANY/COMMIT: baza f7baa3848 (worktree `wip/R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1`), SHA commitu w odpowiedzi koncowej Operatora.
  - rust-port/engine/src/domain/siege_tactics_loop.rs (kod)
  - rust-port/engine/tests/p6_k5loop_outcome_pin.rs (nowy test)
  - rust-port/engine/tests/p6_siege_tactics_loop_body_gen.mjs, p6_siege_tactics_loop_body_pin.rs, p6_siege_tactics_loop_body_vectors/vectors.json (PRZELICZENIE, patrz ODSTEPSTWA)
  - rust-port/engine/tests/p6_siege_tactics_loop_body.rs (1 asercja)
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1/01-operator-r1.md (ten raport)
TESTY: wszystkie EXIT 0 (Cargo.lock niecommitowany; CARGO_TARGET_DIR poza repo).
  - `cargo fmt --check`: 0
  - `cargo clippy --all-targets -- -D warnings`: 0
  - `cargo test --lib`: 118 passed
  - `cargo test --test p6_k5loop_outcome_pin`: 8 passed
  - `cargo test --test 'p6_siege*'`: wszystkie pliki ok (w tym `p6_siege_tactics_loop_body` 8, `p6_siege_tactics_loop_body_pin` 2, `p6_siege_tactics_loop` 4, `p6_siege_tactics_loop_resume` 3)
  - Mutacje (przywrocone): `MORALE_ENEMY_BREAK_GAIN` 5->4 = 1485 rozbieznosci; `start_rout` bez `acted = true` = 790 rozbieznosci (test pinu FAIL w obu).
BLOKADY: brak.
RUNDY: 5/5 (runda 5, Operator SONNET z uzasadnieniem z dispatchu).
NASTEPNY KROK: Evaluator, Obrona, Final Control; integracja dopiero po FC.
DEPLOY/PUSH: NIE WYKONANO

## Kryterium 1: produkcyjne wolanie (linie w siege_tactics_loop.rs po zmianie)
- `ProdBody::strike` wola `single_blow_full` (-> `resolve_outcome`, `siege_tactics_blow.rs:321`) i stosuje `out.blow.effects` przez `apply_outcome_effects`.
- Efekty (pin battleScene.ts 07d2fbd72): `_resolveBlowOutcome` :9019-9068 -> `apply_outcome_effects`; `_applyMoraleDamage` :9722 -> `apply_morale_damage`; `_checkRout` :9783 -> `check_rout` (prog terenu z `ProdUnit.activate.terrain_defence_mult`); `_startRout` :9799 -> `start_rout`; `_startFade`/`_removeUnitFromScene` :9927/:9910 -> `start_fade`; `_gainMorale` :9695 -> `gain_morale`; `_boostEnemiesOnBreak` :9707 -> `boost_enemies_on_break`; `_checkMeleeScreenLost` :9761 -> `check_melee_screen_lost`; `_armyMoraleRatio` :9988 -> `army_morale_ratio` (przez `army_morale_ratio_without_commander`).
- Rout z aktywacji (okrazenie, zdarzenie `StartRout`) idzie teraz tym samym `start_rout` w `complete` (boost wrogow, osłona, facing W/E, `acted`).
- Usuniety wpis `unported` "resolveBlowOutcome-efekty".

## Kryterium 2: wektory pinu
- Generator `p6_siege_tactics_loop_body_gen.mjs` WYKONUJE tekst pinu: `_resolveBlowOutcome`, `_applyMoraleDamage`, `_gainMorale`, `_boostEnemiesOnBreak`, `_checkMeleeScreenLost`, `_startRout`, `_startFade`, `_removeUnitFromScene`, `_armyMoraleRatio`, `armyMoraleRatioWithoutCommander` (army-leadership.ts) oraz stale 1129/1141/1144-1145; strazniki linii i SHA-256 `outcomeSha256 = 6cc2b1e08bcee451d42d8d022c446c6ef42f8e4d045087dff5a653d7a09f737c`.
- 320 sekwencji, 1758 aktywacji, porownanie stanu KAZDEJ jednostki po KAZDEJ aktywacji (HP, morale, dead, removed, fadingOut, routed, acted, facing) + liczba wywolan ripple `_shakeAlliesOnLoss`.
- Liczniki pokrycia (vectors.json `coverage`, wszystkie > 0): fxFades 42 (Kill), moraleOnlyHits 163 (MoraleOnly), routedByBlow 94 (rout po ciosie), fxRouts 171, fxGains 197, fxBoosts 213, fxCollapse 92 (armia w odwrocie, mnoznik 1.3), removedAfterKill 152, fxShakes 42.
- Nowy test `p6_k5loop_outcome_pin.rs`: SHA + niepustosc licznikow + niezalezne przeliczenie z danych + 3 nazwane scenariusze (Kill, MoraleOnly, rout-flaga) z recznymi oczekiwaniami + teren obronny + armia w odwrocie + dowodca (tag) + oslona wrecz (RUST-ONLY).

## Kryterium 3
Brak `#[ignore]`, brak oslabionych asercji (jedyna zmieniona asercja w `p6_siege_tactics_loop_body.rs` dotyczy usunietego wpisu `resolveBlowOutcome-efekty`; zastapiona silniejsza: brak wpisu + obronca `removed` po Kill). Brak martwego wrappera (`apply_outcome_effects` i reszta wolane z `strike`/`complete`).

## ODSTEPSTWA od allowlisty (jawnie, konieczne, zgodne z uzasadnieniem (d) dispatchu rundy 5)
Efekty po ciosie zmieniaja stan po kazdym trafieniu, wiec istniejace wektory `p6_siege_tactics_loop_body_*` (generator ze stubem `_resolveBlowOutcome` stosujacym tylko zabicie) musialy zostac przeliczone: generator wykonuje teraz prawdziwy tekst pinu zamiast stuba, `vectors.json` zregenerowany (zmiana kolejnosci wywolan PRNG generatora: nowe pole `moraleMax`), test pinu porownuje dodatkowo `removed`/`acted` i `fx`. Pozostale dane (rzuty, scenariusze) generuja sie z tego samego ziarna 2301. Poza tym `ProdBody` ma nowe pole pub `morale_max`, `is_army_commander` (domyslnie: morale startowe / false), zeby NIE zmieniac literalow `ProdUnit` w istniejacych testach.

## JAWNIE NIEPORTOWANE (NIE_ZMIERZONO, nie BLOCK)
- Ripple `_shakeAlliesOnLoss` przy zabiciu (wymaga #123): tag `shakeAlliesOnLoss` w `unported`, generator liczy wywolania pinu i test porownuje ich liczbe.
- Efekty dowodcy (`isArmyCommander`, `_removeCommanderMoraleBonus`, `_disableManualIfCommanderLost`): tagi `dowodca-rout` / `dowodca-fade`; w generatorze stuby rzucaja (dowodca = false). Dowodca jest wylaczony z `_armyMoraleRatio` zgodnie z pinem.
- `occByKey`, `routedUnits` (brak konsumenta w ProdBody), render/dzwiek/log.
- Oslona wrecz (`_checkMeleeScreenLost`): zaimplementowana, ale wektory pinu NIE pokrywaja (w generatorze wszystkie jednostki `primaryRanged = false`); test Rust-only, NIE_ZMIERZONO wzgledem pinu.
- `BLOW_HIT_T` (150 ms) pozostaje wejsciem adaptera (`ProdUnit::body_ms`); `_targetInRange` wybor celu = wejscie adaptera (`melee_target`), bez zmian.
- Sciezka wiezy (`tower_blow`) nadal zapisuje `wieza-resolveBlowOutcome-efekty` (poza zakresem rundy: strzaly wiez w atakujacych).
