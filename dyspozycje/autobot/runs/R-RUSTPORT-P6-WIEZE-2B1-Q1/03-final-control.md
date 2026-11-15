STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B1-Q1
GOAL: planowanie wystrzalow wiez z odroczeniem 180 ms, usuniecie placeholdera dead (czesc 1 z 2)
ZMIANY/COMMIT: oceniany 5e8b673d3 (kod dc0e8367c); ancestry wzgledem bazy 7b52c3842: TAK (merge-base --is-ancestor). Diff tylko na allowliscie.
TESTY (zweryfikowane samodzielnie, CARGO_INCREMENTAL=0, target poza repo, usuniety):
- cargo test --test p6_tower_target_wiring --no-run: exit 101, E0560 (SiegeEnv nie ma pola `tower`, tests/p6_tower_target_wiring.rs:229).
- cargo test --test p6_siege_tactics_loop: 3 passed, 1 FAILED (p6_siege_tactics_loop_matches_pin_text_on_all_vectors, panic tests/p6_siege_tactics_loop.rs:258).
- Brak p6_wieze_2b1_gen.mjs i vectors.json; brak guardu towerShooterRow i stanu destroyed w src.

WERDYKTY NA ZARZUTY
1. E0560 w p6_tower_target_wiring.rs (clippy --all-targets i pelny test padaja; kryterium 4 niespelnione): NAPRAW (dopisac plik do allowlisty, przepisac testy na pending_tower_shots/zegar bez oslabiania).
2. Czerwony p6_siege_tactics_loop_matches_pin_text: NAPRAW (regeneracja generatora i wektorow modelujacych pin; dopisac do allowlisty).
3. Brak testow behawioralnych na wektorach pinu (generator 2B1 + straznik SHA): NAPRAW (dispatch wymaga; blokada Operatora dotyczy innych plikow, nie uzasadnia niewykonalnosci).
4. Brak guardu !towerShooterRow (pin :4209): NAPRAW albo jawny wpis dlugu z uzasadnieniem w rejestrze; Operator zglosil NIE_ZROBIONE bez zgody orkiestratora. Parytet 1:1 (zasada 9) = NAPRAW.
5. Brak stanu destroyed / t.destroyed w tower_shoot: NAPRAW (stan + test pominiecia zburzonej wiezy miedzy planowaniem a wystrzalem).
6. Brak testu planning=true na SiegeLoop: NAPRAW jako test sciezki synchronicznej _schedule (wystrzaly nie trafiaja do zegara); nie wymaga efektu 2B2, wystarczy obserwacja zegara.
7. Zmiana publicznego API uderza w konsumentow poza allowlista: NAPRAW (to samo co 1-2); rozszerzenie allowlisty rundy 2 o tests/p6_tower_target_wiring.rs, tests/p6_siege_tactics_loop_gen.mjs, tests/p6_siege_tactics_loop_vectors/vectors.json oraz generator/wektory 2B1.

Jeden NAPRAW = FAIL. Kierunek kodu (planowanie, stagger, zniszczenie bez muru, brak dead) wyglada poprawnie; p6_wieze_2b1 6/6 zielone wg Operatora, lecz niepelny zakres i regresje poza allowlista blokuja.

BLOKADY: allowlista (decyzja orkiestratora, nie czlowieka): rozszerzyc o 3 pliki z p.7 + generator 2B1.
RUNDY: 1/5 zuzyta, wraca do Operatora tego samego ID (runda 2, baza 5e8b673d3).
NASTEPNY KROK: runda 2 Operatora z rozszerzona allowlista.
DEPLOY/PUSH: NIE WYKONANO
