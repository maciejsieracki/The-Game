STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1
GOAL: Wektory pinu 07d2fbd72 dla NaN/Inf/ulamkow w amunicji i maxRounds (#137), tylko testy, z mutacjami V-K3.
ZMIANY/COMMIT: Operator 3fd4d96770090a874061ca7a9e62e98a48fa6431 (rodzic 0fccd8dbf). 4 pliki, wszystkie w allowliscie `rust-port/engine/tests/p6_combat_nan_inf*` (test .rs, generator .mjs, skrypt mutacji .sh, vectors.json). Kod produkcyjny i Cargo.lock nietkniete. `git diff --check` czysty. Trailer commita bez nazwy modelu.
TESTY (Final Control, niezaleznie na SHA Operatora, detached):
- `cargo fmt --check`: OK. `cargo clippy --all-targets -- -D warnings`: OK.
- `cargo test --test p6_combat_nan_inf`: 4/4 PASS.
- Generator `node p6_combat_nan_inf_gen.mjs` uruchomiony ponownie: straznik SHA pinu zgodny, wynik bajt-w-bajt identyczny z zacommitowanym vectors.json (brak diffu): 18 przypadkow (V-A1 8, V-A2 1, V-A3 1, V-K2 8), 16 mierzonych w Rust, 2 NIE_ZMIERZONO (ulamki 0.5, 2.5).
- Wartosci wektorow zgodne z recon §5: NaN/-Inf/-0/0 -> 0 strzalow, 0.5 -> 1, 1 -> 1, 2.5 -> 3, +Inf z maxRounds 5 -> 5 strzalow i rundy 6, V-A2 -> 3 strzaly obroncy, V-K2 -> 0 strzalow i rundy 0.
- Mutacje V-K3 (skrypt operatora): M1 (`>` -> `>=` w limicie) i M2 (`ammo > 0` -> `ammo >= 0`) daja HARNESS=FAIL dla p6_combat_nan_inf i p6_combat_harness; baza PASS; combat.rs przywrocony, identyczny z HEAD; bledy=0.
- Wlasne mutacje FC: usuniecie dekrementu amunicji obroncy -> p6_combat_nan_inf FAIL (zabity); usuniecie `defender.hp > 0.0` w strzale obroncy -> p6_combat_harness FAIL (poza zakresem wektorow V-A*, zabity przez harness); `ammo <= 0` -> `< 0` w warunku wyjscia -> przezyl, ale to mutant rownowazny (warunek while w combat.rs:1153-1154 i tak konczy petle). combat.rs po mutacjach przywrocony (cmp z kopia).
BLOKADY: brak.
RUNDY: 1/5 (Operator r1, Evaluator r1, Final Control r1).
ZARZUTY: brak do NAPRAW / ODDAL / DO DECYZJI.
UWAGI (nie blokuja):
1. NaN i +-Inf nie sa reprezentowalne w `ammo: i64`; Rust dostaje wartosci zastepcze (NaN -> 0, +Inf -> 1000000), a generator sprawdza na pinie, ze zdarzenia, HP, rundy i rout sa takie same jak dla oryginalu. To dowod rownowaznosci proxy, nie bezposredni test NaN w Rust.
2. Ulamki 0.5 i 2.5: tylko pin (NIE_ZMIERZONO w Rust); zalezy od niewdrozonej reguly konwersji (recon §4, decyzja techniczna orkiestratora do REJESTR-RUST.md). Rozjazd 0.5 (pin 1 strzal) i 2.5 (pin 3 strzaly) vs `as i64` pozostaje udokumentowany, nie naprawiany.
3. Log tekstowy (naglowek `=== Faza dystansowa ===`, komunikat limitu) sprawdzany tylko w generatorze, Rust nie produkuje logu.
4. Poza zakresem tego tematu (zgodnie z dispatchem): V-K1 (funkcje konwersji, wymagaja kodu), V-M1/V-M2 (maxRounds NaN/Inf, granica), V-M3 (ryzyko zawieszenia). V-K3 "V-M*" pokrywa p6_combat_harness.
5. Nie uruchomiono pelnego `cargo test` calego engine (temat tylko dodaje testy): uruchomiono test tematu, p6_combat_harness w bazie skryptu mutacji oraz clippy dla wszystkich celow.
NASTEPNY KROK: integracja orkiestratora na parity-v2 (sprawdzic `git merge-base --is-ancestor 3fd4d9677 <cel>` i `git diff --stat`), refs/keep/R-RUSTPORT-P6-NAN-INF-WEKTORY-Q1-fc, wpis w REJESTR-RUST.md, sprzatanie worktree.
DEPLOY/PUSH: NIE WYKONANO
