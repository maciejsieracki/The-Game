# R-RUSTPORT-P6-WIRE-WAR-STATE-Q1 — Final Control, runda 2

STATUS: FAIL
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-STATE-Q1 (W1)
GOAL: WarTurnState z kluczami meta jak web; wpiecie do PlayableState/GameStateDto (D1=B); addytywne pola SaveMeta; stary zapis wczytuje sie bez zmian.
ZMIANY/COMMIT: oceniany 382599bd0 (rodzic b68aef519; merge-base z 43f4064b0 OK). Allowlista czysta: war_turn_state.rs, domain/mod.rs, save_load.rs (pole extra + metody), tests/p6_wire_war_state.rs, 01/02-operator. Zero zmian gra/**, WERSJE.md, Cargo.toml.
TESTY (zmierzone przez FC): p6_wire_war_state 14/0; lib 22/0; save_load 6/0; p6_zapis_erawar_save 5/0; p6_repin_wojna_2_r4_save 8/0; clippy --all-targets -D warnings czysto; rustfmt --check OK; git diff --check OK; 0 #[ignore]. Pelny cargo test wszystkich binarek: NIE_ZMIERZONO.

## Zarzuty
1. NAPRAW: brak wpiecia do PlayableState/GameStateDto (state.rs, grep WarTurnState = 0 trafien). D1=B to decyzja wlasciciela. ZALOZENIE: wpiecie przez #[serde(default)] w GameStateDto.
2. ODDAL: SaveMeta.extra + war_turn_state()/with_war_turn_state() + testy serde. Test przez pelny SaveSnapshot ze starym zapisem nadal brak: NAPRAW razem z pkt 1.
3. ODDAL typowanie siege/dyplomacji: surowy JSON z round-tripem nie gubi danych; ZALOZENIE: dopuszczalne w W1 (orkiestrator dopisuje zawezenie zakresu w 00-dispatch.md).
4. ODDAL: dodane warRulesForcedEraDeclared, aggressorFlagUntilByOwner, casusBelliUntilByPair; test managed_meta_keys_cover_every_written_key.
5. ODDAL: numery linii poprawione.
6. ODDAL: ZALOZENIE udokumentowane + test bad_element_inside_array_is_skipped_and_rest_kept.
7. NAPRAW: wektory nadal reczne; kryterium "round-trip = JSON weba na wektorach" niespelnione (Node 22 dostepny). Minimum: wektory z kodu weba dla 3 pol opaque (serializeForcedEraPeaceLocks, serializeForcedWarWaves, aiGeneralCampaignToSave) + testy.
8. ODDAL: ksztalty pol wg zrodla; pole stage = ZALOZENIE.

Werdykt: 3 NAPRAW (D1, test SaveSnapshot, wektory z webu) -> FAIL, wraca do TEGO SAMEGO ID, runda 3/5.
Uwaga procesowa: wiadomosc wlasciciela o ponownym zadaniu pytan jest adresowana do orkiestratora; FC jej nie wykonuje i nie zadaje ABC.
RUNDY: 2/5 zakonczona; nastepna 3/5
NASTEPNY KROK: Operator r3 na bazie 382599bd0 -> Evaluator -> FC.
DEPLOY/PUSH: NIE WYKONANO
