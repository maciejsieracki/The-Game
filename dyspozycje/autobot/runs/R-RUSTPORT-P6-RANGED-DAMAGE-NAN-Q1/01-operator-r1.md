STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1
GOAL: ranged_shot_damage (Rust) dla NaN/Infinity zgodne z pinem 07d2fbd72 (combat.ts:485-495, `Math.max(1, Math.round(raw))`), zamiast 1 / i64::MAX. Wartosci skonczone bez zmian; NaN trafienia/obrazen zachowuje sie jak na pinie.
ZMIANY/COMMIT: kod d0afe1a438685543ddced26e77ee6688394157c9 (galaz lokalna wip/R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1, baza 82bb87fb1; NIE pushowana). Raport w osobnym commicie (SHA w sekcji DEPLOY/PUSH). Pliki:
- rust-port/engine/src/domain/unit_power.rs (allowlista)
- rust-port/engine/src/domain/combat.rs (allowlista)
- rust-port/engine/tests/p6_ranged_damage_nan.rs (NOWY, allowlista p6_ranged_damage_nan*)
- rust-port/engine/tests/p6_ranged_damage_nan_gen.mjs (NOWY, generator)
- rust-port/engine/tests/p6_ranged_damage_nan_vectors/ranged.json (NOWY, 8238 wierszy: expected NaN=1914, Infinity=1497)
- siege_tactics_blow_full.rs: NIE zmieniany (wolajacy tylko ranged_damage_mult_for, bez zmian sygnatury)
Nie dotykano: gra/**, rust-port/engine/data/**, WERSJE.md, Cargo.toml, Cargo.lock (wygenerowany przez cargo, nieskomitowany), testow p6_repin_* ani asercji.

ZMIENIONE SYGNATURY:
- unit_power::ranged_shot_damage_f64(typ: Option<&str>, jednostka: Option<&str>, missile_attack: f64, armor: f64, counter_mult: f64) -> f64 [NOWA; pin-dokladna, Math.max(1, Math.round(raw))]
- unit_power::ranged_shot_damage(...) -> i64 [sygnatura BEZ ZMIAN; cialo: wrapper nad _f64, NaN -> 1 jak dawniej, inaczej `as i64`]
- combat::ranged_phase::RangedShot: NOWE pole `damage_exact: f64`; pole `damage: i64` BEZ ZMIAN (NaN -> 0, Inf -> i64::MAX, informacyjne)
- combat.rs (wewnetrzne): damage_exact_to_i64 [prywatna], pętla fazy dystansowej uzywa ranged_shot_damage_f64 i `hp -= damage_exact` (f64)
Uwaga: `damage` pozostaje i64, zeby istniejace testy (p6_repin_dystans_petla.rs: `assert_eq!(res.shots[0].damage, 45)`, `assert_eq!(s.damage, 0)`) przeszly bez zmiany asercji; ten plik spoza allowlisty NIE byl edytowany. Alternatywa (damage: f64) wymaga zmiany literalow w tym tescie.

ZAOKRAGLENIE: ranged_shot_damage_f64 uzywa siege_tactics_blow::js_round (dokladny JS Math.round), a nie wewnetrznego floor(x+0.5). Roznica tylko dla |raw| >= 2^52 (i wartosci, gdzie x+0.5 zaokragla sie w gore); po podlodze max(1) wynik dla pozostalych przypadkow identyczny.

ZNANA ROZBIEZNOSC Z DAWNYM ZACHOWANIEM (zamierzona, zgodna z pinem): skonczony raw > i64::MAX (np. 1e308) dawniej dawal damage = i64::MAX i odejmowal 9.2e18 od HP; teraz HP celu odejmuje dokladna wartosc (1e308). Efekt na routing identyczny (cel ginie/ucieka w obu przypadkach), zmienia sie tylko wartosc target_hp.

TESTY:
- cargo fmt --check (rust-port/engine): EXIT 0 (po cargo fmt; zmienione tylko pliki z tego tematu)
- cargo clippy --all-targets -- -D warnings: EXIT 0 (po dodaniu #[allow(clippy::too_many_arguments)] na helperze testowym)
- cargo test --lib: 94 passed, 0 failed
- cargo test --test p6_ranged_damage_nan (NOWY): 7 passed (wektory pin 8238 wierszy, w tym NaN/Inf; jawne przypadki JS; roll<NaN=pudlo; NaN obrazen -> HP NaN; NaN kontra -> HP NaN; Infinity -> HP -Inf i routing; skonczone bez zmian: Procarz 45, HP 55)
- cargo test --test p6_repin_dystans_formulas: 8 passed (bez zmiany asercji)
- cargo test --test p6_repin_dystans_petla: 3 passed (bez zmiany asercji)
- cargo test --test p6_repin_dystans_fieldpower: 1 passed
- cargo test --test p6_unit_power_maxnan: 2 passed
- cargo test --test combat: 7 passed
- cargo test --test p6_siege_tactics_blow_full: 3 passed
- Generator: node rust-port/engine/tests/p6_ranged_damage_nan_gen.mjs -> zapisano ranged.json; straznik: SHA-256 fragmentu (rangeDamageTw + rangedShotDamage z combat.ts, rangedDamageMultFor z unit-power.ts) = 3a9325c769ab07605a52d4992cf15dfaa3441f15f5bc8b5d36b1fc832b187178 (zapisany po pierwszym uruchomieniu na PINIE 07d2fbd72, NIE niezaleznie zweryfikowany), SHA combat-params.json = 5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e (zgodny z MAXNAN).
- NIE_ZMIERZONO: zachowanie fazy dystansowej wzgledem pinu w testach p6_ranged_damage_nan (combat-level) wyprowadzone z CZYTANIA kodu pinu (combat.ts ~1036-1041: `roll < hitPct`, `hpDef -= dmg`), NIE z wykonania resolveCombat w node.
- NIE_ZMIERZONO: nowe testy uruchomione na kodzie PRZED zmiana (czy padaja na starym kodzie) — nie sprawdzono.
- NIE_ZMIERZONO: pelny `cargo test` / `cargo test --test 'p6_*'` (czas kompilacji); pelny przebieg wykona runda integracyjna.

BLOKADY: brak blokad technicznych. Jedyne odstepstwo od dispatchu: pole `damage` w RangedShot pozostaje i64 (patrz wyzej), a nowe pole `damage_exact` niesie wartosc f64.

RUNDY: 1/5 (Operator, Haiku 5.5)

NASTEPNY KROK: Evaluator (Sonnet) — weryfikacja: (a) generator/wektory vs pin, (b) czy nowe testy padaja na 82bb87fb1 (NIE_ZMIERZONO tutaj), (c) decyzja, czy zostawic pole damage i64 czy przejsc na f64 razem z edycja p6_repin_dystans_petla.rs; (d) pełny cargo test w rundzie integracyjnej.

DEPLOY/PUSH: NIE WYKONANO (brak push; galaz lokalna wip/R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1, kod d0afe1a43; raport w commicie po nim).
