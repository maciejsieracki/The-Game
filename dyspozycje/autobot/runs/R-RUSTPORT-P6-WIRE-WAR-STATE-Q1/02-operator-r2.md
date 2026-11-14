# R-RUSTPORT-P6-WIRE-WAR-STATE-Q1 — Operator, runda 2 (obrona)

STATUS: PASS-WITH-NOTES (partia 2; zakres W1 nadal NIEPELNY — patrz ODPOWIEDZI pkt 1, 3, 7)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-STATE-Q1 (W1)
GOAL: WarTurnState z kluczami meta jak web; addytywne pola SaveMeta; stary zapis bez pol wczytuje sie bez zmian.
ZMIANY-COMMIT: SHA w sekcji ZMIANY (commit wykonany po tej notatce).
Allowlista: rust-port/engine/src/domain/war_turn_state.rs, rust-port/engine/src/domain/save_load.rs (tylko pole `extra` + metody war), rust-port/engine/tests/p6_wire_war_state.rs, dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-STATE-Q1/02-operator-r2.md. Bez zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri. Cargo.lock i target/ NIE w commicie.

## ODPOWIEDZI NA ZARZUTY (baza: b68aef519)
1. PRZYJMUJE (czesciowo). Wpiecie do SaveMeta wykonane (pkt 2). Wpiecie do PlayableState/GameStateDto (D1) NIE wykonane — NIE_ZMIERZONO, kolejna partia. Powod: state.rs (3454 LOC) wymaga osobnej partii z testem round-trip GameStateDto.
2. PRZYJMUJE. SaveMeta dostal pole `extra` (serde flatten, skip gdy puste) i metody `war_turn_state()` / `with_war_turn_state()`. Round-trip SaveMeta przez serde: test `save_meta_keeps_war_state_through_serde`. Stary zapis (tylko battleModeSettingVersion): `save_meta_from_old_save_writes_no_war_keys_by_default`. Test przez pelny SaveSnapshot NIE dodany (NIE_ZMIERZONO) — sciezka SaveSnapshot uzywa tego samego SaveMeta.
3. PRZYJMUJE czesciowo. Oblezenie (siegeTurnByCity, siegeBesiegerByCity, siegeAiStateByKey) i 24 klucze dyplomacji z meta (main.ts:36912-36914, 36919-37051) sa przechowywane jako surowy JSON (`SIEGE_RAW_META_KEYS`, `DIPLOMACY_RAW_META_KEYS`), test `siege_and_diplomacy_raw_keys_round_trip_unchanged`. Typowany model (tabela 4 planu) — NIE w tej partii.
4. PRZYJMUJE. Dodano do OPAQUE: warRulesForcedEraDeclared, aggressorFlagUntilByOwner, casusBelliUntilByPair (main.ts:37025, 37032-37033). warRulesEraWarCountByCiv jest juz typowany w SaveMeta (pole era_war_count_by_civ), wiec nie jest w WarTurnState. Test: `managed_meta_keys_cover_every_written_key`.
5. PRZYJMUJE. Numery linii w docstringu poprawione wzgledem origin/main 638e90bea (literal meta 36874-36918; pola wojenne 37020-37051; serializatory forced-war-common.ts:155-159, forced-war-waves.ts:237-245, ai-general-war-campaign.ts:156-170).
6. PRZYJMUJE jako ZALOZENIE (udokumentowane w docstringu) i PRZYPIETE TESTEM: `bad_element_inside_array_is_skipped_and_rest_kept`. Web tego jednoznacznie nie potwierdza (NIE_ZMIERZONO).
7. PRZYJMUJE jako NIE_ZMIERZONO / otwarte. Node 22 jest dostepny (/opt/node22/bin/node v22.22.0), ale buildSaveGameSnapshot siedzi w main.ts (46964 LOC, DOM, zaleznosci); izolowany generator nie zostal napisany w tej partii. Wektory nadal reczne.
8. PRZYJMUJE. Ksztalty opakowanych pol poprawione wg zrodla webu: regularWarCapturedByPairKey {ownerA,ownerB,capturedByA,capturedByB} (main.ts:2308-2311); warWearinessByPairKey {warStart,peak,stage,...} (war-weariness.ts:150); forcedEraPeaceUntilNextEraByPairKey [[key,{ownerId,era}]] (forced-war-common.ts:155-169); forcedWarWavesByPairKey [[key,{nextWaveId,waves,history}]] (forced-war-waves.ts:237-245); aiGeneralWarCampaignByOwner [[ownerId,{targetOwnerId,stage,gatherTurnsCompleted,...}]] (ai-general-war-campaign.ts:156-170). Pole `stage` campaign: typ napisowy w teście jest ZALOZENIEM (NIE_ZMIERZONO wzgledem typu TS).
9. PRZYJMUJE — gates uruchomione (ponizej).

## TESTY (commit tej rundy)
- cargo test --test p6_wire_war_state: 14 passed, 0 failed, 0 ignored (bylo 7).
- cargo test --lib: 22 passed, 0 failed.
- cargo test --test p6_repin_wojna_2_r4_save: 8 passed. --test p6_zapis_erawar_save: 5 passed.
- cargo test --test p6_8a_pending_improvements (7), p6_dyplomacja_truce_aggressor (14), p6_repin_autoimpr_terrain (8), p6_repin_wojna_3_hook (7), replay (6), save_load (6): wszystkie 0 failed.
- cargo clippy --all-targets -- -D warnings: czysto.
- rustfmt --check na zmienionych plikach: OK. git diff --check: OK.
- Pelny cargo test wszystkich binarek crate: NIE_ZMIERZONO (uruchomione tylko binarki dotykajace save_load/war_turn_state).

## BLOKADY
1. D1: brak wpiecia do PlayableState/GameStateDto (state.rs).
2. Brak typowanego modelu oblezenia i dyplomacji (wartosci surowe).
3. Wektory z uruchomionego weba (Node 22) — NIE_ZMIERZONO.
4. Pelny cargo test wszystkich binarek — NIE_ZMIERZONO.
5. Test SaveSnapshot ze starym zapisem — NIE_ZMIERZONO (test na poziomie SaveMeta).

## RUNDY: 2/5
## NASTEPNY KROK: partia 3 — D1 (GameStateDto + #[serde(default)]), typy oblezenia i dyplomacji, generator wektorow z Node 22, test SaveSnapshot; potem Evaluator (Sonnet).
## DEPLOY/PUSH: NIE WYKONANO
