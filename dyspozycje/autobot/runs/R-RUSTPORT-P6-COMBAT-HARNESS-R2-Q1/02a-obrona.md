STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-COMBAT-HARNESS-R2-Q1
GOAL: obrona Operatora r1 na zarzuty Evaluatora r1 (02-evaluator.md); poprawka tam, gdzie zarzut zmierzony
ZMIANY/COMMIT: poprawka zarzutu 2 w p6_combat_harness.rs (recount: sasiedztwo ULP zamiast tolerancji 1e-9), p6_combat_harness_gen.mjs (ten sam licznik w raporcie generatora), vectors.json (tylko linia counts; cases/shots bez zmian). SHA: patrz commit (hash podany w odpowiedzi orkiestratorowi). Cargo.lock niecommitowany; combat.rs bez zmian.
TESTY (po poprawce, EXIT 0): cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test --lib (94 passed); p6_combat_harness (2); combat (7); p6_ranged_damage_nan (7); p6_repin_dystans_petla (3); p6_repin_dystans_formulas (8). Generator ponownie uruchomiony: cases 700, shots 1113 bez zmian; shotsRollJustBelow 46 -> 31, shotsRollJustAbove 38 -> 34. Liczniki ULP zmierzone osobnym skryptem node na vectors.json: below 31, above 34, exact 41.
BLOKADY: brak
RUNDY: 2/5 (obrona)

ODPOWIEDZI NA ZARZUTY:

1. Zarzut: GOAL (2) wymagal zdarzen strzalow z -0 w hitPct/damage/targetHp; w wektorach 0 (shotsNegZeroAnyField=0); asercja == 0 to tylko sygnalizator.
   ODRZUCAM (dowod z tekstu pinu 07d2fbd72, gra/src/game/combat.ts, oraz parser LINE w generatorze):
   - Parser bierze wylacznie linie `Dyst-(ATK|DEF)]` (ranged), wiec zdarzenia melee (ok. linie 1150-1181, Math.round bez podlogi) nie wchodza do wektorow.
   - hitPct = Math.max(TW.hit_min, Math.min(TW.hit_max, raw)) (ok. linia 446), hit_min = 15 > 0: wynik to 15, 75 albo raw (NaN -> NaN). Nigdy -0.
   - damage = rangedShotDamage = Math.max(1, Math.round(raw)) (ok. linia 495): Math.max(1, -0) = 1; wynik to >= 1 albo NaN. Nigdy -0.
   - targetHp = hpDef - dmg, przy dmg >= 1 lub NaN. W IEEE x - y daje -0 tylko dla x = -0 i y = +0; y >= 1, wiec wynik nie jest -0. Infinity - dmg = Infinity, NaN propaguje sie jako NaN.
   Wniosek: -0 w polach zdarzen strzalu jest nieosiagalne w petli pinu. Asercja == 0 jest jawnym zalozeniem testu (komentarz w p6_combat_harness.rs). Nie ma rozbieznosci do naprawy w ranged_phase. Pokrycie -0 oznaczone jako NIE_ZMIERZONO_ALE_NIEOSIAGALNE (jak w r1). Zmiany testu nie wymagam.

2. Zarzut: liczniki shots_roll_just_below/just_above uzywaja tolerancji 1e-9 zamiast sasiedztwa 1 ULP, zawyzaja liczby.
   PRZYJMUJE (zmierzone): tolerancja 1e-9 dawala 46 / 38 przypadkow; strict 1 ULP (roll_pct == nastepny double pod/nad hitPct) daje 31 / 34. Obie wartosci >= 20, progi testu sa nadal spelnione.
   Poprawka: w p6_combat_harness.rs funkcje is_ulp_below / is_ulp_above (to_bits -/+ 1, hit_pct skonczony i > 0) zamiast BOUNDARY_EPS; w p6_combat_harness_gen.mjs ulpStep (BigUint64Array) dla licznikow raportu generatora. Wektory (cases, shots, hitPct, damage, targetHp, draws) bez zmian; zmienily sie tylko counts.

Brak oslabionych asercji, brak #[ignore], brak zmian w gra/, rust-port/engine/data/**, Cargo.toml, Cargo.lock, WERSJE.md, origin/main. Brak push i integracji.
NASTEPNY KROK: Evaluator r2 (weryfikacja poprawki 2 i odtworzenie bramek), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
