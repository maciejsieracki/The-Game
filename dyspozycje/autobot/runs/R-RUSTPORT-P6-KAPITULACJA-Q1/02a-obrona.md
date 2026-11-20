# R-RUSTPORT-P6-KAPITULACJA-Q1 — obrona Operatora, runda 1 (po Evaluatorze r1 = FAIL)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-KAPITULACJA-Q1 (kapitulacja głodowa oblężenia, W3/W4/W5)
GOAL: kapitulacja głodowa w produkcyjnym ticku (`PlayableGame::advance_turn`, faza `SIEGE_TICK_PHASE` = Economy) 1:1 z
pinem `07d2fbd72`, z kryterium końca E2E (kolejka produkcji, łup stolicy/eliminacja, status wojny, karta zdarzenia)
przypiętym wektorami generatora wykonującego tekst pinu.
BAZA: kod Operatora r1 `4f34cb30d` + raport Evaluatora `f85172513` (gałąź `eval/kapitulacja-q1`), merge-base z
`origin/rust-port/parity-v2` = `e1f61c503` (bez zmian bazy). Gałąź obrony: `oper/kapitulacja-q1-obrona`.
ZMIANY/COMMIT: kod `cd7a96eaa` + `43cfc469e` (pełna bramka na `43cfc469e`), raport w commicie następnym (SHA w wyniku obrony); szczegóły pkt 2.
RUNDY: 1/5 (obrona po FAIL Evaluatora r1)
DEPLOY/PUSH: NIE WYKONANO

## 1. Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| Z1 (blokujący) kryterium E2E: kolejka, łup/eliminacja, `recordWarCityLossForPair`, karta zdarzenia nieprzypięte | **PRZYJMUJĘ** | Generator wykonuje teraz z tekstu pinu (wycięte z `main.ts`): `runCapitalCapturePlunder`, `recordWarCityLossForPair` + `diploEnsureWarStart`/`getDiploPairMeta`/`setDiploPairMeta`, `sanitizeProductionQueue` + `parseWonderProdId`, `capitalCityIdForOwner`, `buildCityCaptureReportRows`, `captureReportOneLine`/`ShortLine`, `mirrorCaptureReportRowsForVictim`, `recordCityCaptureEvent`, `recordCivElimEvent`; `capturePopLossReportRow` z `cities.ts`; moduły w całości: `capital-capture.ts`, `production.ts`, `diplomacy-war-peace-profile.ts`, `diplomacy-pn-engine.ts`, `power-labels.ts`, `retained-side-panel-events.ts`, `building-stock-cost.ts`, `society-breakdown.ts`, `buildings.json`. Zaślepki zostały wyłącznie dla UI i pól bez odpowiednika w stanie (lista w nagłówku generatora). Każda tura każdego scenariusza porównuje teraz: stolice, skarbce, pule Pracy, technologie, wojny, metę par, zdobycze mocy, kolejki produkcji i `capture_events` (`assert_capture_steps`). Nowe scenariusze: `stolica_przejecie` (łup skarbca, pula Pracy przepada, sukcesja stolicy, Pałac usunięty z kolejki, postęp do zdobywcy), `stolica_gdzie_indziej` (E09: wyznaczona stolica ≠ najstarsze miasto), `kolejka_nowa_stolica_gracza` (Pałac zostaje), `eliminacja` (skarbiec + Praca + technologie, `disbandOwnerUnits`, relacje i meta skasowane, karta ELIMINACJA). Mutanty E01, E02, E03, F04, F06, E09 — pkt 3. |
| Z2 (blokujący) warunek heksu przy usuwaniu obrońców | **PRZYJMUJĘ** | Scenariusz `obroncy_poza_heksem` (cywil ofiary na heksie usuwany, wojsko ofiary na sąsiednim heksie i daleko zostaje) + test `capitulation_keeps_old_owner_units_outside_city_hex`. Mutant F05 — pkt 3. |
| Z3 (blokujący) filtr właściciela w `siegeDefenderUnits` | **PRZYJMUJĘ** | Scenariusz `obcy_wojskowy_na_heksie` (Wojownik właściciela 103 na heksie miasta) + test `foreign_military_unit_on_city_hex_is_not_garrison` (brak startu głodu, flaga legacy). Mutant E17 — pkt 3. |
| Z4a faza Economy (E10) | **PRZYJMUJĘ częściowo / ODRZUCAM częściowo** | Przyjęte: faza wpięcia jest teraz nazwaną stałą `siege_surrender::SIEGE_TICK_PHASE` (doc z cytatem pinu i W8 r7 Q2), `advance_turn` porównuje z nią; test `siege_tick_phase_is_economy_after_diplomacy` przypina wartość (Economy), kolejność względem Diplomacy w `canonical_phase_order` i wykonanie ticka w turze. Odrzucone (z dowodem): mutacja samego warunku na `Diplomacy` w `advance_turn` jest dziś **behawioralnie równoważna** — w pętli faz `Economy` następuje bezpośrednio po `Diplomacy`, a ani gałąź `Economy`, ani faza `Production` nie mają innych skutków przed tickiem (`playable.rs` `advance_turn`: jedyna praca w `Diplomacy` = `run_diplomacy_war_phase`, wykonywana w obu wariantach przed tickiem). Rozróżni je dopiero EKONOMIA-TURA (#352), gdy tick ekonomii trafi do fazy Economy — wtedy test wektora WIRE 4 musi to przypiąć (dług KAP-DL-4). |
| Z4b ścieżka `Err` (F07, E08) i semantyka błędu ≠ pin (D-KAP-3) | **PRZYJMUJĘ (semantyka pinu)** | D-KAP-3 r2: blok N3 pinu jest w `try { for (...) } catch (errSiege) { console.error(...) }` (`main.ts:38809-38872`). Teraz: `run_siege_turn` zwraca `SiegeTickReport` z `error: Option<(CityId, String)>`; kapitulacja liczona na kopii stanu (błąd = skutki tej kapitulacji cofnięte w całości), pętla miast kończy się na błędzie (pozostałe miasta nieprzetworzone — jak jeden `try` wokół `for`), `advance_turn` loguje (`eprintln!`, odpowiednik `console.error`) i **tura trwa** — brak miękkiej blokady. Testy: `capitulation_error_rolls_back_city_effects` (błąd PO mutacjach: zła meta pary w `recordWarCityLossForPair` → stan bez zmian), `capitulation_error_does_not_block_advance_turn` (2 tury z rzędu, flaga zostaje), `capitulation_error_stops_city_loop_like_pin` (miasto 905 nieprzetworzone). F07 (cofanie `economy`) — mutant nieaktualny: kod cofania usunięty razem ze starą semantyką. E08 (odrzucenie zdobywcy-barbarzyńcy) — **ODRZUCAM jako równoważny**: `is_barbarian(x)` = `x == -1` (`siege_capital_plunder.rs:34`), a zdobywca pochodzi z `PlayerId` (`u64`: `oblegajacy_owner_id` albo właściciel jednostki), więc `new_owner` nigdy nie jest `-1` — gałąź jest martwa w typach (strażnik zostaje jako defensywny, D-KAP-6). Odstępstwo od pinu (świadome, techniczne): pin zostawia połowiczne mutacje sprzed wyjątku, Rust cofa kapitulację miasta w całości (D-KAP-3 r2, do rejestru). |
| Z5 D-KAP-2 zegar głodu bez ticka ekonomii | **PRZYJMUJĘ jako warunek w rejestrze** | Bez zmian kodu (nieosiągalne w grze, KAP-DL-5). Wpis do rejestru (KAP-EV-1): **nie wolno wpiąć rozpoczęcia oblężenia na mapie ani Load z `oblegane`/`citySiege` przed EKONOMIA-TURA (#352) albo przeniesieniem zegara WIRE 4 (`turn-economy.ts:2808-2830`)** — inaczej brak `magazynZywnosci` = kapitulacja po 2 turach. |
| Z6 AI↔AI: szturm odrzuca, kapitulacja przejmuje bez licznika | **PRZYJMUJĘ jako dług w rejestrze** | Bez zmian kodu w tej rundzie (licznik `regularWarCapturedByPairKey` + auto-pokój to osobny temat, KAP-DL-1). Wpis KAP-EV-3: niespójność D-ZMA-7 (szturm AI↔AI = błąd) vs kapitulacja AI↔AI (przejęcie + `not_applied`); do ujednolicenia w temacie licznika. Scenariusz `ai_ai` przypina obecne zachowanie (karta zdarzenia pomijana jak w pinie: `oldOwner !== 0 && newOwner !== 0`). |
| Z7 trudność / E14 / E19 / doc-komentarz | **PRZYJMUJĘ (trudność, doc) / ODRZUCAM (E14, E19 — zgodnie z oceną Evaluatora)** | `glod_wojska_hp_frac` zwraca `Result`: nieznana etykieta = błąd ticka (`report.error`, liczony jak w pinie jako pierwszy krok miasta), nie cichy `Normal`; test `unknown_difficulty_is_reported_not_defaulted`. Doc-komentarz `siege_battle()` wrócił nad swoją funkcję (`playable.rs`). E14/E19: Evaluator sam uznał je za nieblokujące/równoważne w zakresie wektorów — bez zmian. |

## 2. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_surrender.rs` | `SiegeTickReport::error`, `SIEGE_TICK_PHASE`; `run_siege_turn` → `SiegeTickReport` (semantyka `try/catch` N3: kapitulacja na kopii, `break` na błędzie); `glod_wojska_hp_frac` → `Result` (Z7). |
| `engine/src/domain/playable.rs` | `advance_turn`: tick na `SIEGE_TICK_PHASE`, błąd logowany, tura trwa (usunięte cofanie kolejki/wojny/ekonomii dla ticka); doc-komentarz `siege_battle()` przywrócony. |
| `engine/tests/p6_kapitulacja_gen.mjs` | Kroki Z1 wykonywane z tekstu pinu (lista w pkt 1), id miast `city`+N (`cityFoundOrder`, Rust `plunder_id`), domyślna wyznaczona stolica ofiary `city910`, 6 nowych scenariuszy (24 razem), migawka rozszerzona o stolice/zasoby/wojny/metę/zdobycze/kolejki/karty. SHA-256 tekstu pinu: `17b8f1fb42402207df7284aede2b604bf3a5c5fa0545f33cf8e597c8463e78a9` (więcej plików pinu niż w r1). |
| `engine/tests/p6_kapitulacja_vectors/vectors.json` | Regenerowane: MD5 `63c07bee154e716b0c7d8a44b062c8eb` (dwa uruchomienia, ten sam MD5). |
| `engine/tests/p6_kapitulacja.rs` | `assert_capture_steps` (Z1), budowa stanu z zasobami/stolicami/kolejkami, 8 nowych testów (Z1–Z4, Z7), 15 testów razem. |

`city_capture_apply.rs`: **bez zmian** — port był poprawny; zarzut dotyczył braku przypięcia, nie błędu (wszystkie nowe
wektory przeszły bez poprawek kodu kapitulacji). Nie ruszano: `siege_transfer.rs`, `siege_capital_plunder.rs`,
`siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `bridge.rs`, `save_load.rs`, `eliminacja.rs`,
`client`, `renderer`, `src-tauri`, `gra/`.

Wejście scenariusza `eliminacja`: `lostPower {101: 228}` = moc ofiary policzona przez Rust (`lost_power_of`) dla tego
stanu, podana pinowemu `buildObjectivePowerForOwner` (producenci mocy mają własne wektory POWER-*; ten sam wzorzec co
Q6). Z nią wiersz „Moc” karty ELIMINACJA i `zdobyczePowerByOwner` są porównywane bajt w bajt.

## 3. Mutanty (bramka: `p6_kapitulacja` + `p6_zdobycie_miasta_a` + `p6_zdobycie_miasta_b`; źródła przywracane)

Skrypt: `scratchpad/kapq1ob/mut_ob.py` (log `mut_ob.log`); mutacja wewnątrz wskazanej funkcji, test `cargo test --test
p6_kapitulacja --test p6_zdobycie_miasta_a --test p6_zdobycie_miasta_b`, źródło przywracane po każdym mutancie
(`git status` czysty po serii). 14 mutantów: **14 ZABITYCH**, 0 przeżyło.

| ID | Mutacja | Wynik (testy, które padły) |
|---|---|---|
| E01 | brak `capital_plunder` w kapitulacji | ZABITY (`tick_matches_pin_vectors_all_scenarios`, `tick_is_deterministic`) |
| E02 | brak `apply_capture_production` | ZABITY (j.w.) |
| E03 | brak `record_war_city_loss_for_pair` | ZABITY (wektory, `capitulation_error_rolls_back_city_effects`, `…outside_city_hex`) |
| F04 | karta zdarzenia z pustymi wierszami | ZABITY (wektory, `advance_turn_runs_capitulation_end_to_end`) |
| F05 | usuwanie jednostek starego właściciela bez warunku heksu | ZABITY (`capitulation_keeps_old_owner_units_outside_city_hex`, wektory) |
| F06 | brak `apply_record_city_capture_event` | ZABITY (wektory, E2E) |
| E09 | `designated` (stolice przed przejęciem) puste | ZABITY (wektory `stolica_*`, E2E) |
| E17 | obrońcy bez filtra właściciela | ZABITY (`foreign_military_unit_on_city_hex_is_not_garrison`, wektory) |
| E10 | `SIEGE_TICK_PHASE` = `Diplomacy` | ZABITY (`siege_tick_phase_is_economy_after_diplomacy`) |
| N01 | błąd kapitulacji nie przerywa pętli miast | ZABITY (`capitulation_error_stops_city_loop_like_pin`) |
| N02 | kapitulacja na stanie zamiast na kopii (brak cofnięcia przy błędzie) | ZABITY (`capitulation_error_rolls_back_city_effects` i in.) |
| N03 | nieznana trudność = cichy `Normal` | ZABITY (`unknown_difficulty_is_reported_not_defaulted`) |
| N04 | błąd ticka odrzuca turę (stara semantyka) | ZABITY (`capitulation_error_does_not_block_advance_turn`) |
| N05 | brak `playerEverOwnedCityByOwner.add` | ZABITY (wektory) |

Równoważne / nieaktualne (bez zmian kodu): **E08** (strażnik zdobywcy-barbarzyńcy) — martwy w typach (`PlayerId` = `u64`,
barbarzyńca = `-1`); **F07** (cofanie `economy` przy błędzie) — kod usunięty razem ze starą semantyką D-KAP-3;
**E14/E19** — uznane przez Evaluatora za nieblokujące; **E10 na samym warunku `if` w `advance_turn`** — równoważny do czasu
EKONOMIA-TURA (pkt 1, Z4a). Mutanty r1 Operatora M01–M28 i Evaluatora E11–E13/E15/F16/E18/E20 — zabite wcześniej; testy
nie zostały osłabione (żadna asercja nie usunięta).

## 4. Bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` =
`scratchpad/kapq1ob/target` (poza repo, usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| Testy dotknięte (jedno wywołanie, `--no-fail-fast`): lib 149, `bridge_contract` 10, `p6_k5loop_wiring_b` 15, `_b_pin` 2, `p6_kapitulacja` **15**, `p6_siege_capital_plunder` 3, `p6_siege_capture_events` 3, `p6_siege_surrender` 10, `p6_siege_transfer` 2, `_effects` 4, `_effects_q4` 12, `_prod` 5, `_q5` 6, `p6_zdobycie_miasta_a` 6, `_a_bridge` 7, `p6_zdobycie_miasta_b` 16, `_b_bridge` 6 | EXIT 0, 0 failed |
| Pełny `cargo test --all-targets --no-fail-fast` na `43cfc469e` (w tle `setsid nohup`, strażnik dysku < 1 GB nie zadziałał, 04:56:58–05:16:49) | **EXIT 0**: 554 binarki, **4230 passed, 0 failed, 1 ignored** (istniejący sprzed tematu; brak nowych `#[ignore]`) |
| Generator `node rust-port/engine/tests/p6_kapitulacja_gen.mjs` (2 uruchomienia) | SHA-256 tekstu pinu `17b8f1fb42402207df7284aede2b604bf3a5c5fa0545f33cf8e597c8463e78a9`, MD5 `vectors.json` `63c07bee154e716b0c7d8a44b062c8eb` (oba razy), 24 scenariusze, `git status` czysty po uruchomieniu |

Osłabionych / usuniętych asercji: brak (testy r1 zmienione tylko w sygnaturze `run_siege_turn` → `report.error == None`,
liczbie scenariuszy 18 → 24 i `glod_wojska_hp_frac(...).ok()`).

## 5. Długi (do `REJESTR-RUST.md` przez orkiestratora)

- KAP-DL-1…7 (r1) bez zmian.
- **KAP-DL-8** `eliminacja.rs::eliminate_owner` nie kasuje puli AI wyeliminowanego (`aiSkarbiecByOwner`, `aiPracaPoolByOwner`,
  `aiResearchDone` — pin `main.ts:35380-35384`); skarbiec/Praca są już 0 po łupie (akcesory `?? 0` nierozróżnialne), ale
  technologie ofiary zostają w `researched_techs_by_owner` (dane martwe: brak miast i jednostek). Test porównuje
  technologie bez wyeliminowanych. Poza allowlistą — temat ELIMINACJA (#114).
- **KAP-DL-9** `record_war_city_loss_for_pair` zapisuje `utraty` pod id stanu (`old_owner.to_string()`), pin pod id webu
  (`String(oldOwner)`): dla ofiary-gracza klucz `"1"` vs `"0"`. Scenariusze tematu mają ofiarę-AI (zgodne); rozjazd
  dotyczy utraty miasta przez gracza (kod B, poza tematem kapitulacji AI→gracz) — do weryfikacji w temacie licznika wojny.
- **KAP-EV-1** (Z5) warunek wpięcia startu oblężenia/Load — jak w pkt 1.
- **KAP-EV-2** (Z4) D-KAP-3 r2: semantyka błędu N3 = pin (log, tura trwa, pętla miast przerwana); świadome odstępstwo:
  brak połowicznych mutacji (kapitulacja miasta atomowa).
- **KAP-EV-3** (Z6) niespójność AI↔AI szturm vs kapitulacja.
- E10: rozróżnienie fazy Economy/Diplomacy behawioralnie dopiero po EKONOMIA-TURA (#352).

## 6. Następny krok

Evaluator r2: regeneracja generatora (SHA `17b8f1fb…78a9`, MD5 `63c07bee…eb`), mutanty E01–E10/E17/F04–F06 na nowym
kodzie, przegląd D-KAP-3 r2 i długów KAP-DL-8/9.
