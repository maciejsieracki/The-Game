STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-RANGED-DAMAGE-NAN-Q1
GOAL: ranged_shot_damage (Rust) dla NaN/Infinity zgodne z pinem 07d2fbd72 (combat.ts:485-495).
ZMIANY/COMMIT: oceniany kod d0afe1a43, raport fa646ebd1 (baza 82bb87fb1). Allowlista: OK (6 plikow: combat.rs, unit_power.rs, nowe p6_ranged_damage_nan{.rs,_gen.mjs,_vectors/ranged.json}, 01-operator-r1.md). Brak gra/, data/, Cargo.toml, WERSJE.md. Cargo.lock nieskommitowany (usuniety z worktree).
TESTY (odtworzone przez Evaluatora, EXIT): fmt --check 0; clippy --all-targets -D warnings 0; cargo test --lib 94 passed; p6_ranged_damage_nan 7 passed; p6_repin_dystans_formulas 8; _petla 3; _fieldpower 1; p6_siege_tactics_blow_full 3; combat 7. Generator node odtworzony: ranged.json bez zmiany (rows=8238, NaN=1914, Inf=1497), straznik SHA przeszedl. Mutacja (ranged_shot_damage_f64 -> stare js_round(raw).max(1.0)): 4 z 7 nowych testow FAIL (wektory, jawne JS, 2x HP NaN) - testy realnie wykrywaja regresje. Brak #[ignore], brak oslabionych asercji (testy p6_repin_* niezmienione), wektory z pinu (tekst pinu wykonany w node), nie reczne.
ZARZUTY (nieblokujace):
1. Testy combat-level (roll<NaN = pudlo, HP NaN, Inf -> rout) wyprowadzone z czytania kodu pinu, nie z wykonania resolveCombat w node (przyznane przez Operatora). Wektory na poziomie funkcji sa twarde; petla - nie.
2. Publiczne unit_power::ranged_shot_damage (i64) zostaje z NaN -> 1, czyli rozjazd z pinem; uzywane tylko w testach (nie w produkcji, grep). Ryzyko, ze przyszly wolajacy go uzyje. Zalecenie: oznaczyc doc-komentarzem/deprecated albo usunac w rundzie integracyjnej.
3. RangedShot::damage (i64) jest informacyjne i traci NaN/Inf (0 / i64::MAX); poprawna wartosc to damage_exact. Akceptowalne (decyzja Operatora wobec petla.rs spoza allowlisty), ale konsument logu/UI musi uzywac damage_exact.
4. Skonczony raw > i64::MAX: target_hp odejmuje dokladna wartosc (zgodne z pinem), dawniej i64::MAX - zmiana zamierzona, routing bez zmian.
5. Straznik SHA zapisany po pierwszym uruchomieniu (nie niezalezny); kontrola dryfu pinu, nie dowod poprawnosci.
6. Pelny cargo test nie uruchomiony (runda integracyjna).
BLOKADY: brak
RUNDY: 1/5 (Evaluator)
NASTEPNY KROK: Obrona Operatora (zarzuty 2, 1) -> Final Control
DEPLOY/PUSH: NIE WYKONANO
