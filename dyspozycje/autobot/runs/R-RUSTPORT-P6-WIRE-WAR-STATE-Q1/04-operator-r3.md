# R-RUSTPORT-P6-WIRE-WAR-STATE-Q1 — Operator, runda 3

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-STATE-Q1 (W1)
GOAL: WarTurnState wpiety do PlayableState/GameStateDto (D1=B), test przez pelny SaveSnapshot, wektory z uruchomionego weba.
BAZA: 382599bd0 (origin/rust-port-wip/W1STATE); merge-base z 43f4064b0 bez zmian.

## NAPRAW FC
1. D1=B: `GameStateDto.war` (prywatne, `#[serde(default, skip_serializing_if = WarTurnState::is_default)]`; akcesory `war_turn_state()`, `with_war_turn_state()`, `set_war_turn_state()`) oraz `PlayableState.war` (pub, to samo serde). `WarTurnState`: `Serialize`/`Deserialize` (mapa kluczy jak web `meta`; zly typ calosci => stan pusty), `impl Eq`, `is_default()`. `SaveSnapshot`: `war_turn_state()`, `with_war_turn_state()`, `web_meta()`; przy wczytaniu klucze wojny z `meta` (format weba) migruja do `state.war`, a z `meta` sa usuwane (jedno zrodlo prawdy).
2. Test przez pelny `SaveSnapshot` (tests/p6_wire_war_state_snapshot.rs, 8 testow): stary zapis bez pol laduje bez zmian i zapisuje bez nowych kluczy; round-trip nowego zapisu; migracja meta weba -> state -> eksport `web_meta()` rowny wejsciu; inne pola meta przezywaja; state.war ma pierwszenstwo nad meta; GameStateDto i PlayableState addytywne.
3. Wektory z weba: tests/p6_wire_war_state_vectors/opaque-web.json wygenerowany z `serializeForcedEraPeaceLocks`, `serializeForcedWarWaves`, `aiGeneralCampaignToSave` (esbuild bundle `git archive origin/main gra/src gra/data` poza repo, Node 22.22.0; pole spoza typu `extraDropped` odrzucone przez web, nieobecne w wektorze). Test `web_vectors_for_opaque_fields_round_trip_equal`.

## ZALOZENIA (do akceptacji)
- `impl Eq for WarTurnState` mimo f64 (wartosci z JSON, skonczone) — wymagane przez derive Eq na GameStateDto/PlayableState.
- Przy zapisie wlasnym wojna idzie do `state.war`, nie do `meta`; format weba (klucze meta) dostepny przez `SaveSnapshot::web_meta()`. Konflikt state.war vs meta: wygrywa state.war.
- Wektory pochodza z `origin/main` pobranego w r3 (000358dec, nowszy od pinu 638e90bea); pliki zrodlowe 3 serializatorow nie byly porownywane z pinem (NIE_ZMIERZONO roznicy).
- Stan oblezenia i dyplomacji w W1: surowy JSON (zgodnie z zawezeniem zakresu).

## TESTY (zmierzone)
cargo fmt --check OK; clippy --all-targets -D warnings czysto; lib 22/0; p6_wire_war_state 14/0; p6_wire_war_state_snapshot 8/0; save_load 6/0; p6_zapis_erawar_save 5/0; p6_repin_wojna_2_r4_save 8/0; p6_repin_wojna_3_hook 7/0; state_dto 10/0; replay 6/0; 0 nowych #[ignore]. Pelny cargo test wszystkich binarek: NIE_ZMIERZONO. Dysk po sprzataniu target: 13 GB wolne.
Cargo.lock wygenerowany lokalnie (nie commitowany).

BLOKADY: brak
RUNDY: 3/5
NASTEPNY KROK: Evaluator r3 -> Final Control
DEPLOY/PUSH: NIE WYKONANO
