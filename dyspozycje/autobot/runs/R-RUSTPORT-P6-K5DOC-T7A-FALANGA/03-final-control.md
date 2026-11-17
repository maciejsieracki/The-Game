STATUS: FAIL (BLOCK INFRA: bramki clippy i pelny cargo test nie do odtworzenia przy dysku < 8 GB)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7A-FALANGA
GOAL: port falangi (is_phalanx, phalanx_line_front, phalanx_action_decide, phalanx_step_decide)
ZMIANY/COMMIT: koncowy SHA 1120f110c; baza f85622878 jest przodkiem (merge-base --is-ancestor OK). Diff bazy: 7 plikow, wszystkie w allowliscie (siege_tactics_phalanx.rs, mod.rs +1 linia, p6_k5doc_t7a.rs, _gen.mjs, vectors.json, 01-operator-r1.md, 02a-obrona.md). Brak #[ignore], brak zmian poza allowlista.
TESTY (zmierzone przez FC): cargo fmt --check -p civ-engine EXIT 0; cargo test --test p6_k5doc_t7a 10/10, 0 ignored, EXIT 0. NIE_ZMIERZONO przez FC: clippy --all-targets -D warnings (Obrona: EXIT 0 przy 9,0 GB), cargo test --all-targets --no-fail-fast (nikt nie odtworzyl). Dysk w FC: 6,7 -> 5,5 -> 5,1 GB (< 8 GB, BLOCK wg dispatchu).
ZARZUTY:
1 mutant premii +6 sasiada falangi: ODDAL (Obrona dodala wektor remisu 409477d73, mutant FAIL wg Obrony; FC nie powtorzyl mutacji, NIE_ZMIERZONO).
2 mutant granicy nr>=BF_ROWS: ODDAL (wektory 4 krawedzi + pole nr=155; mutant FAIL wg Obrony dla jednej krawedzi).
3 clippy i pelny test: NAPRAW (powtorzyc przy >= 8 GB wolnego). To jedyny powod FAIL.
4 odtworzone: ODDAL (potwierdzone fmt i 10/10).
5 rozbieznosci dispatch/pin (brak Schedule, AdvanceStep), mutant rownowazny d_enemy>d_now: ODDAL.
6 dlug NFD norm_name; trailery commitow z nazwa modelu: DO DECYZJI CZLOWIEKA (trailery wg regul sesji vs dispatch; NFD znany dlug).
BLOKADY: INFRA dysk < 8 GB.
RUNDY: FC r1/5
NASTEPNY KROK: runda 2 tego samego ID (DODATEK r2, baza 1120f110c) po zwolnieniu dysku >= 8 GB: clippy + pelny cargo test, ewentualnie powtorzenie mutacji z 409477d73; przy zielonych bramkach PASS.
DEPLOY/PUSH: NIE WYKONANO
