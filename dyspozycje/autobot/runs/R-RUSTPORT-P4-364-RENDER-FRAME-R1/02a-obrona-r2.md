# R-RUSTPORT-P4-364-RENDER-FRAME-R1: Obrona Operatora, runda 2

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: domknięcie luk ramki renderera z `RENDER_FRAME_GAPS` (DODATEK r2) wg kodu webu (pin `07d2fbd72`); obrona zarzutów Z1–Z3 Evaluatora r2 (`02-evaluator-r2.md`, commit `a028c5039`).
ZMIANY/COMMIT: baza obrony = `a028c5039` (Evaluator r2, nad Operatorem r2 `d82635c1d`, nad bazą r2 `ff037335d`). Pliki: `rust-port/engine/src/domain/render_frame.rs` (1 linia kodu + komentarze, Z1), `rust-port/engine/tests/p4_364_render_frame.rs` (+10 testów), katalog runs (ten raport, `mutate-obrona-r2.py`, `mutate-obrona-r2.log`, `gate-*-obrona-r2.log`). Wszystko w allowliście r2. Brak plików spoza allowlisty; `Cargo.lock` bez zmian. SHA commitu w linii końcowej raportu orkiestratora (gałąź `rust-port-wip/364-render-frame-r2-obrona`).
TESTY: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --test p4_364_render_frame` 37/37 EXIT 0 (27 + 10 nowych); pełny engine `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) EXIT 0: 527 bloków, 3965 passed, 0 failed, 1 ignored (sprzed tematu); dysk przed pełną bramką 8745 MiB. Mutanty Evaluatora EV1–EV11 na kodzie po obronie: 11/11 ZABITE (`mutate-obrona-r2.log`). Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w unikalnym podkatalogu scratchpadu (`obr364r2b/tgt`), usunięty po bramkach.
BLOKADY: brak.
RUNDY: 2/5 (obrona rundy 2)
NASTĘPNY KROK: Final Control r2.
DEPLOY/PUSH: NIE WYKONANO

## Z1 (blokujący): epoka limitu miast z fotela zapytania zamiast `player.era` — PRZYJMUJĘ

Poprawka (`render_frame.rs`, `FoundCityCtx::new`): `era: owner_era(state, me)?` → `era: owner_era(state, HUMAN_OWNER_ID)?`, z komentarzem pinu: `const playerEra = player.era ?? 1` (`main.ts:12924`), `player` = jeden obiekt fotela głównego (`main.ts:13713`), `player.era` ustawia wyłącznie `reconcilePlayerEraFromResearch()` z `civTypeForOwner(0)` (`main.ts:2522-2532`). `ownerId: ME()` i `foundingTerritoryOpts(ME())` zostają per fotel. Odwzorowanie asymetrii hotseatu jest teraz takie samo jak dla `player_era` w `improvement_build_state`. Komentarz `check()` poprawiony (`cities.ts:1316-1327` zamiast `:1163` dla limitu).

Test na fotelu 2 z INNĄ epoką niż fotel główny: niewykonalny na `PlayableState`, co niżej udowadniam. `owner_era_facts` (`turn_war_epoch.rs:118-139`) daje każdemu człowiekowi epokę startu z `params.epoch_id`. AI dostaje `ownerEraByOwner` pusty, czyli ten sam fallback `gameStartEra()`. Stan nie niesie badań ani epoki per właściciel. Dlatego `owner_era(state, me) == owner_era(state, HUMAN_OWNER_ID)` dla każdego stanu, a mutant „epoka fotela zapytania” jest równoważny (w `mutate-obrona-r2.log` ostatnia pozycja PRZEŻYŁ zgodnie z oczekiwaniem). Zamiast wektora asymetrii dodałem:
- `obrona_r2_z1_limit_miast_fotela_2_z_epoki_fotela_glownego`: asercja niezmiennika `epochs_with_sources({1,2})` = ta sama epoka. Gdy stan dostanie epokę per fotel, test zgłosi brak wektora asymetrii. Do tego limit na granicy dla fotela 2 (hotseat): baza 1, 1 miasto, Kamień → `1 >= 1` odmowa (pusto); Brąz (era 2) → limit `1 + (2-1)*5 = 6` → pełny wektor ręczny fotela 2 (`cities.ts:1316-1327`).

Dowód: commit obrony; test zielony; mutant EV1 i EV3 zabija także ten test.

## Z2 (blokujący): 9/11 mutantów przeżywa — PRZYJMUJĘ (testy dla EV1–EV7, EV10 i EV11)

Wyrocznie liczone ręcznie (Z3): lokalna `pin_axial_distance` przepisana z `map/territory.ts:57-61`; stałe `CITY_RADIUS_POP1 = 5` (`territory.ts:89-93`), `FORT_RADIUS = 5` (`territory.ts:75`), `MIN_CITY_DIST = 4` (`cities.ts:1117`); oczekiwane listy heksów wypisane literalnie. Mapa scenariusza 8×5, stolica (1,1) pop 1 (asercja w `hotseat_state`).

| Mutant | Gałąź pinu | Nowy test | Wektor | Wynik mutacji |
|---|---|---|---|---|
| EV1 założenie dla fotela głównego zamiast `seat` | `main.ts:12923-12943`, `:12906-12920` | `obrona_r2_ev1_zalozenie_miasta_fotela_2_wg_wlasnego_terytorium` | hotseat: fotel 2 (człowiek) z miastem (7,4). Fotel 1: `[(5,0),(6,0),(5,1),(6,1),(4,2),(5,2),(3,3),(4,3),(2,4),(3,4)]`; fotel 2: `[(6,0),(7,0),(5,1),(6,1),(4,2),(5,2),(3,3),(4,3),(2,4),(3,4)]` (pierścień `d ∈ [4,5]` wokół własnego miasta, `d ≥ 4` od drugiego) | ZABITY |
| EV2 bez `!isHexInForeignFortTerritory` | `main.ts:12917-12918`, `fort-territory.ts:158-173` | `obrona_r2_ev2_obcy_fort_wyklucza_heksy_obcego_terytorium` | obcy fort (5,3), miasto fotela 2 (7,4): heksy (6,1),(5,2),(4,3),(3,4) mają właściciela = miasto fotela 2 (`d(7,4)=4 < d(1,1)=5`, `territoryOwnerAt`: bliższe miasto) i leżą w promieniu fortu → odrzucone; zostaje `[(5,0),(6,0),(5,1),(4,2),(3,3),(2,4)]`. Fort `contestedUseless` nie wyklucza (`:167`) | ZABITY |
| EV3 bez `cityLimitBase` | `main.ts:12933`, `cities.ts:1319` (`?? 10`) | `obrona_r2_ev3_limit_miast_z_city_limit_base` (+ test Z1) | baza 1 przy 1 mieście → pusto; baza 2 → pełny pierścień | ZABITY |
| EV4 Zwiadowca w `fieldPowerM` | `auto-battle-power.ts:37-43` | `obrona_r2_ev4_zwiadowca_poza_moca_pola_stosu` | Wojownik (cache 27) + Zwiadowca (cache 6 > 0) w stosie: `fieldPowerM` = 27 (nie 33); `count` 2, hp 22 + 10. `Osadnik` nie ma wpisu w `units.json` Rust, więc brak wektora; to ten sam zbiór `BATTLE_EXCLUDED_TYPES` | ZABITY |
| EV5 `Łatwy` → poziom 2 | `main.ts:9517-9520`, `ai-difficulty-bonus.ts:41-60` | `obrona_r2_ev5_latwy_to_poziom_1` | bonus poziomu 1 = -0.05 (`ai-params.json`), wojownik AI: `fieldPowerM` 26.6 (`Łatwy` i `easy`), `Normalny` 27 | ZABITY |
| EV6 `hp` bez dolnej granicy | `main.ts:33115` (`Math.max(0, …)`) | `obrona_r2_ev6_hp_dolna_granica_zero` | `hp = -5` → jednostka `hp 0`, `hpMax 22`; vitals stosu `hp 0` | ZABITY |
| EV7 próg weterana 3 → 2 | `veteran.ts:106-110`, `:118` | `obrona_r2_ev7_progi_poziomu_weterana` | bitwy 0/1/2/3/5 → poziom 1/2/2/3/3, gwiazdki 0/1/2/3/3 | ZABITY |
| EV8 cud dla fotela głównego | `qualifyingWonderHexesForPlayer` | (istniejący) `r2_build_highlight_cud_wg_wonder_placement` | — | ZABITY |
| EV9 bonus trudności dla człowieka | `qualifiesForMajorAiDifficultyBonus` | (istniejący) `r2_vitals_bonus_trudnosci_ai` | — | ZABITY |
| EV10 `horseStockAvailable` = 0 | `main.ts:16315`, `livestock-unlock.ts` (od Żelaza bez złoża: magazyn `kon >= 50`) | `obrona_r2_ev10_stadnina_z_magazynu_koni` | Żelazo; magazyn stolicy `kon` 49 → pusto, 50 → równiny terytorium (m.in. (2,1)); 99 koni w mieście innego właściciela się nie liczy (`citySurowceSumForOwner(0)`) | ZABITY |
| EV11 `ownUnitHexKeys` puste | `main.ts:16319`, `improvement-build.ts` FORT | `obrona_r2_ev11_fort_poza_terytorium_przy_wlasnej_jednostce` | heks (7,2), `d(1,1)=7 > 5`: bez jednostki brak, z jednostką gracza jest; reszta podświetlenia bez zmian | ZABITY |

Skrypt mutacji: `mutate-obrona-r2.py`. Mutanty EV1–EV9 odtworzyłem z opisów w `02-evaluator-r2.md`, bo plik `mutate-eval-r2.py` na `a028c5039` zawiera tylko EV10 i EV11. Każdy mutant to dokładnie jedna podmiana w `render_frame.rs`, sprawdzana licznikiem wystąpień = 1, a źródło jest przywracane w `finally` (zweryfikowane `cmp` z kopią). Log: `mutate-obrona-r2.log` (11/11 ZABITE; Z1 równoważny, jak opisałem wyżej).

## Z3 (uwaga): wyrocznie z funkcji crate'u — PRZYJMUJĘ dla nowych testów

Nowe testy liczą oczekiwania bez funkcji crate'u: lokalna `pin_axial_distance` i stałe z pinu. Jedyny wyjątek to wartość 26.6 w EV5. To literał (`fieldPowerM` po `applyDifficultyCombatToUnitDef` × 0.95 i `Math.round(x*10)/10`), a test pilnuje też jego relacji do niezmutowanego 27 i do bonusu -0.05 z danych. Starych testów r2 nie przepisywałem, bo Evaluator uznał je za akceptowalne, a zakres obrony to Z1–Z2.

## Incydent procesu (z raportu Evaluatora)

Ta obrona używała wyłącznie unikalnego podkatalogu scratchpadu `obr364r2b/` (target, logi, kopia zapasowa źródła), nie wspólnego `gates.sh`. Wcześniejsza, przerwana próba obrony (restart kontenera, gałąź `partial-rust-port-wip/364-render-frame-r2-obrona`, `8eeb09b07`) zawierała tylko poprawkę Z1 i sondę `zz_probe`. Sondę usunąłem, a poprawkę Z1 wprowadziłem tutaj od nowa.
