STATUS: FAIL
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1
GOAL: Final Control rundy 2 (kod operatora a535debbb na bazie a006068f1)
ZMIANY/COMMIT: oceniono a535debbb (a006068f1 jest przodkiem; refs/keep/...-op-r2 = a535debbb). Diff do allowlisty: improvement_build.rs (bramka epoki, era z player_era), p6_8i_pick.rs (pin), pick.json, helpers.json, P6-REPIN-AUTOIMPROVE-PICK.md, runs/.../tools. Wszystko w allowliscie.
TESTY (z diffu i raportu operatora; cargo nie uruchamiany ponownie: 6,7 GB wolnego, bieg ok. 400 s):
- bramka epoki stadniny zgodna z webem (STADNINA_FREE_FROM_ERA=3): OK w diffie.
- p6_8i_pick: 1 FAILED, 947/5128 niezgodnych (baseline przed zmiana 5/5 PASS) = regresja bramki; wektory przesuniete na nowy web bez portu D2/D3.
ZARZUTY:
1. NAPRAW: test pick czerwony (947). Kryterium "cargo test 0 failed" niespelnione; czerwonego testu nie wolno integrowac do parity-v2.
2. NAPRAW: brak klasyfikacji przyczyn 947 (NIE_ZMIERZONO); bez niej D2/D3 to zgadywanie. Skrypt klasyfikacji ma trafic do runs/.../tools.
3. NAPRAW: M16 `droga` nadal NIE ZROBIONE (SUPERSEDED_KEY w p6_m16_qualifier.rs:19). Mierzalne: policzyc pominiete wpisy, zregenerowac/odblokowac.
4. NAPRAW: pin nadal mieszany w p6_8i_relief, p6_repin_autoimpr_terrain, p6_m16_* (180c08305); ma byc jeden pin cffe39cb9.
5. NAPRAW: 4 scenariusze (rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247) sa w pliku, ale wszystkie 4 niezgodne.
6. ODDAL: zarzuty rundy 1 (brak stadniny, brak tabeli, brak nazwy pinu pick) - wykonane w r2; Cargo.lock/target posprzatane.
7. ODDAL: brak clippy - do wykonania po zazielenieniu pick.
DO DECYZJI CZLOWIEKA: brak.
BLOKADY: brak technicznych; liczby 5124/964 i 5128/947 nie sa porownywalne 1:1 (zalozenie operatora przyjete).
RUNDY: 2/5, werdykt FAIL
SHA DO INTEGRACJI: BRAK (nie integrowac). Zmiana stadniny w improvement_build.rs jest kandydatem dopiero po zielonym pick.
KOLEJNOSC wzgledem origin/rust-port/parity-v2: parity-v2 = cd7145e23, a006068f1 jest jego przodkiem; roznica to pliki unit-replace i p6_wire_war_* (bez improvement_build.rs i pick). Runda 3 ma wejsc na cd7145e23 przed FC.
NASTEPNY KROK: runda 3, to samo ID: klasyfikacja 947, D2 bydlo/pastwiska, D3 inne/kolejnosc (partie <=600 LOC), M16 droga, jeden pin, clippy, pelny cargo test.
DEPLOY/PUSH: NIE WYKONANO
