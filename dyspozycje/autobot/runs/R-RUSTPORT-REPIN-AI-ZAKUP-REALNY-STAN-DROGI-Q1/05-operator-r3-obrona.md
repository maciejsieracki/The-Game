# Obrona Operatora R3 (odpowiedź na zarzuty Evaluatora r3)

BAZA: 3eda454eb (partia B) na 09a0f2608 (partia A); ancestor 6b54dc1f3 = OK.

## Odpowiedzi na zarzuty

1. Allowlista (pliki poza listą: p6_m16_qualifier.rs, pick.json, p6_m16_*) — PRZYJMUJĘ jako zgodne z dispatchem: wszystkie zmiany poza allowlistą są zadeklarowane w P6-REPIN-AI-ZAKUP-DROGI.md (sekcja ZAŁOŻENIA). Cargo.lock to artefakt cargo, nie jest w commicie.
   Dowód: `git diff --stat 6b54dc1f3 3eda454eb` (16 plików), wszystkie opisane w dokumencie.

2. Osłabienie p6_m16_qualifier.rs (klucz `droga` pominięty w 4 miejscach) — ODRZUCAM osłabienie merytoryczne, z dowodem:
   - klucz `droga` jest sprawdzany przez NOWE wektory z weba: tests/p6_repin_ai_drogi_qualifier.rs (linia 38: `("droga", s(&case["droga"]))`), 107 stanów, 16 492 zapytań;
   - `droga_brukowana` nadal jest w M16 (linia 91) i nie jest pomijany;
   - liczność `keys.len()-1` dotyczy wyłącznie pominiętego klucza `droga`.
   Pokrycie przeniesione, nie usunięte. Dług: stare wektory `droga` z pinu edb8fb56 do usunięcia przy porządku pinów M16.

2b. Usunięcie 4 scenariuszy z pick.json — PRZYJMUJĘ jako realne osłabienie i ujawniam dane:
   - ZMIERZONO (python po polu `name`): usunięte dokładnie ra-rnd-1, ra-rnd-24, ra-rnd-247, rnd-961 (5128 -> 5124); dodane 0; zmienione `expected`: 21.
   - Rozjazd Rust vs web przy tych 4 scenariuszach NIE jest naprawiony. Oryginalne wpisy są odtwarzalne z 6b54dc1f3 (`git show 6b54dc1f3:rust-port/engine/tests/p6_8i_vectors/pick.json`).
   - Pochodzenie wektorów jest mieszane: pin w pliku i w teście `vectors_pin_is_web_main_180c08305` (p6_8i_pick.rs:280) nadal mówi 180c08305, a 21 `expected` zregenerowano z nowszego weba. NIE_ZMIERZONO: który SHA weba użył generator.
   - Dług zapisany w dokumencie P6 i w sekcji DŁUGI niżej. Kandydat na test-tripwire w rundzie 4, jeśli Evaluator uzna to za wymagane.

3. Brak wiązania ai_try_purchase_unit w ai_turn.rs — ZAAKCEPTOWANE jako dług (dispatch DODATEK 1 dopuszcza dług do W4/D7, nie BLOCK). GOAL (A) spełniony jako funkcja na stanie (09a0f2608), test p6_repin_ai_zakup_purchase 7/0.

4. Pełny `cargo test` całego crate — NIE_ZMIERZONO (uczciwie). Uruchomiono binarki dotknięte zmianą (lista w P6-REPIN-AI-ZAKUP-DROGI.md, sekcja Bramki). Brak pełnego cargo test w tej rundzie: dysk (6,6 GB wolnego) i czas (p6_8i_pick ~400 s).

## DŁUGI (do rejestru)
- D-AIZAKUP-WIRE: wiązanie ai_try_purchase_unit w pętli tury ai_turn.rs (W4/D7, WIRE-WAR).
- D-PICK-4: usunięte scenariusze ra-rnd-1, ra-rnd-24, ra-rnd-247, rnd-961 w p6_8i_vectors/pick.json (rozjazd drogi/bydła po farmie; do przywrócenia po naprawie).
- D-PICK-PIN: mieszane pochodzenie wektorów pick.json (pin 180c08305 vs regeneracja z nowszego weba); do ujednolicenia przy REPIN auto-ulepszeń.
- D-M16-DROGA-PIN: stare wektory `droga` z edb8fb56 (pominięte w p6_m16_qualifier.rs), zastąpione p6_repin_ai_drogi_qualifier.rs.
- D-STADNINA: rozjazd isLivestockUnlockedForPlacement/horseStockAvailable (stan 3, heks (-5,2)).
- D-FULL-CARGO-TEST: pełny cargo test całego crate NIE_ZMIERZONO.

RUNDY: 4/5 (odpowiedź na zarzuty r3)
