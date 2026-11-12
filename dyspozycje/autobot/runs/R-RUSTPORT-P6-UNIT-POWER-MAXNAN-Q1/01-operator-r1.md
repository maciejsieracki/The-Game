STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-POWER-MAXNAN-Q1
GOAL: unit_power::ranged_shot_accuracy (i pokrewne funkcje z pinu) zgodne z JS Math.max/Math.min dla NaN/Inf; wektory z wykonania tekstu pinu 07d2fbd72.
ZMIANY/COMMIT: kod ca23053a32e287062deacb0428ddef61e664bb18 (baza da50d1753, detached HEAD w worktree). Allowlista: rust-port/engine/src/domain/unit_power.rs; rust-port/engine/tests/p6_unit_power_maxnan.rs; rust-port/engine/tests/p6_unit_power_maxnan_gen.mjs; rust-port/engine/tests/p6_unit_power_maxnan_vectors/maxnan.json; dyspozycje/autobot/runs/R-RUSTPORT-P6-UNIT-POWER-MAXNAN-Q1/**. siege_tactics_blow_full.rs NIE zmieniany (brak lokalnego js_max; już używa siege_tactics_blow::js_max). Cargo.lock NIE commitowany (untracked, wygenerowany przez cargo). Literały struktur w testach: brak zmian.
TESTY:
- cargo fmt --check (rust-port/engine): EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 88 passed, 0 failed
- cargo test --test p6_repin_dystans_formulas: 8 passed
- cargo test --test p6_repin_dystans_fieldpower: 1 passed
- cargo test --test p6_repin_dystans_petla: 3 passed
- cargo test --test p6_siege_tactics_blow_full: 3 passed
- cargo test --test p6_unit_power_maxnan (NOWY): 2 passed (wektory: acc=225, w tym 29 z NaN w expected; hits=1125, w tym 399 z NaN; ranges=225, w tym 31 z NaN; plus test jawnych przypadków JS)
- NIE_ZMIERZONO: pełny cargo test --test 'p6_*' (przekroczył 300 s przy kompilacji binarek; pełny cargo test wykona runda integracyjna).
- NIE_ZMIERZONO: nowy test uruchomiony na kodzie PRZED zmianą (z kodu przed zmianą ranged_shot_accuracy(NaN,9)=9 zamiast NaN, więc asercje powinny paść; nie sprawdzono empirycznie).
- Generator: node rust-port/engine/tests/p6_unit_power_maxnan_gen.mjs. SHA-256 fragmentu combat.ts (hitChanceTw, rangeDamageTw, rangedShotAccuracy) = 3f57e2ba744179a2620e2e352770ee81db077458ad7f130294758d4e4f97ad0e; SHA-256 gra/data/combat-params.json = 5cc90d60c76da67039a1330261a00584933216c8ec80bff3db5183b05c07326e (straznik: zmiana pinu -> błąd generatora).

OCENA użyć max/min/clamp (unit_power.rs i sąsiednie):
- unit_power.rs:64 ranged_shot_accuracy = js_max(melee, missile) <-> combat.ts:477 Math.max(meleeAttack, missileAttack). PRZED: ROZBIEŻNE dla NaN (f64::max). PO: ZGODNE. Naprawione.
- unit_power.rs:70 range_damage_tw = js_max(1.0, missile-armor) <-> combat.ts:469 Math.max(1, missileAttack-armor). PRZED: ROZBIEŻNE dla NaN. PO: ZGODNE. Naprawione (funkcja ma w pinie port i wektory).
- unit_power.rs:93 hit_chance_tw = js_max(min, js_min(max, raw)) <-> combat.ts:446 Math.max(TW.hit_min, Math.min(TW.hit_max, raw)). PRZED: ROZBIEŻNE dla NaN (f64 min/max połykały NaN, wynik = hit_max). PO: ZGODNE. Naprawione. Wartości skończone bez zmian.
- unit_power.rs:82 ranged_shot_damage: js_round(raw).max(1.0) as i64 <-> combat.ts:495 Math.max(1, Math.round(raw)). ROZBIEŻNE dla NaN i Inf (f64::max zamienia NaN na 1; Inf nasyca się do i64::MAX). NIE NAPRAWIONE: typ zwracany to i64, a JS NaN nie ma reprezentacji całkowitej; poprawka wymaga zmiany typu i callerów w combat.rs (poza allowlistą). Wartości skończone zgodne (istniejące wektory). DO DECYZJI przez FC.
- unit_power.rs field_power i reszta pliku: brak max/min/clamp (NIEDOTYCZY).
- combat.rs:258 clamp(0,1), :299 fold(1.0, f64::max), :456 i :461 clamp(0.10,0.25), :474 clamp(0,1): NIE_ZMIERZONO (poza allowlistą; nie porównywane z pinem w tej rundzie).
- combat.rs:816-853 js_max (recruitment::army_merge): już JS-semantyka, NIEDOTYCZY.
- brake_power.rs:193 (komentarz): Rust f64::max celowo nieużywane dla NaN w computeObjectivePower (błąd wejścia); NIEDOTYCZY tej zmiany.
- siege_tactics_blow_full.rs:252 js_max(atk_melee_raw, atk_missile): już JS-semantyka, NIEDOTYCZY.

RUNDY: 1/5 (Operator HAIKU)
BLOKADY: ranged_shot_damage (i64) nie zgadza się z pinem dla NaN/Inf; wymaga decyzji o typie zwracanym (f64) i zmianie callerów w combat.rs, poza allowlistą tego tematu. Brak migracji stanu (brak nowych pól serde).
NASTĘPNY KROK: Evaluator: weryfikacja diffu ca23053a3, uruchomienie generatora (straznik SHA), decyzja w sprawie ranged_shot_damage; Final Control; pełny cargo test w rundzie integracyjnej.
DEPLOY/PUSH: NIE WYKONANO (zakaz push i integracji w dispatchu).
