# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 (#354 część B)
GOAL: domknąć kroki zdobycia miasta wpisane przez część A do `notApplied` (prawo po przejęciu, kronika/zdarzenia, kolejka
produkcji, religia) 1:1 z pinem `07d2fbd72`, plus długi DL-1/DL-2/DL-3/DL-6/DL-7 tam, gdzie pin rozstrzyga.
BAZA: `origin/rust-port/parity-v2` = `a5fdb91b8712074bf790b423888d46d39114eb23` (zgodnie z dispatchem, w chwili startu).
GAŁĄŹ: `rust-port-wip/zdobycie-miasta-b-q1` (worktree workflow). Kod: `a1aa7d8c2`, `5af0bc9f2`, `b6e220850` (ostatni commit
kodu); raport w commicie następnym (SHA w wyniku Operatora).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Najpierw web (pin `07d2fbd72`, przeczytany przed kodem)

- `main.ts:36034-36265` `applyCityCaptureToMap`: kolejność `noteCityCapture` (`:36047`, PRZED P9) → P9
  (`applyCityCaptureAfterBattle`, w nim `applyPostCaptureLawOnCapture` przed zmianą właściciela,
  `post-battle-map.ts:573`, pominięte dla zdobywcy-barbarzyńcy) → `settleWonderTransfer` → … → `recordWarCityLossForPair`
  → kolejka produkcji (`:36134-36184`) → religia (`:36202-36215`) → `playerEverOwnedCityByOwner.add` → … →
  `recordCityCaptureEvent` (`:36249`).
- `post-capture-law.ts:62-82` `applyPostCaptureLawOnCapture`; `eliminationSpectacle.ts:138` `noteCityCapture`;
  `culture-religion.ts:788-870` `onCityCapturedReligion`; `diplomacy-display.ts:200-220` `sameCultureCircle`;
  `main.ts:5123-5137` `sanitizeProductionQueue`, `:4095` `parseWonderProdId`, `:4176` `wonderGateOk`,
  `:34999` `capitalCityIdForOwner`, `:5535` `ownerReligionForOwnerId`, `:9813-9834` `civKeyForOwnerId`.
- Religia czyta `city.population` PO stracie P9 i `cityRelig.get(id) ?? { counts: {} }` (bez `resolveCityReligionState`),
  wynik ZAWSZE zapisany (`cityRelig.set`).
- Gameplay poza webem: brak (nic nie wymyślone).

## 2. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/city_capture_apply.rs` | Część B: typy pól stanu (serde) `PlayablePostCaptureLaw`, `PlayableCivChronicle`(+`Vs`), `PlayableCityProduction`/`PlayableProductionItem` z konwersjami do typów domeny; adaptery `apply_note_city_capture`, `apply_capture_law`, `apply_capture_production` (+`capital_city_id_for_owner`, `is_capital_only_building`, `add_praca`), `apply_capture_religion` + port `on_city_captured_religion`, `same_culture_circle`; wpięcie w `apply_storm_capture` w kolejności pinu; `NOT_APPLIED_ALWAYS` bez 4 kroków B; `PIN_STEPS` zaktualizowane; adapter `economy.units` po eliminacji usunięty (DL-7 u źródła). |
| `engine/src/domain/playable.rs` | 3 pola stanu: `post_capture_law_by_city`, `civ_chronicle_by_owner`, `city_prod_by_city` (pusty = pomijany w JSON, stan sprzed zmiany bajt w bajt); 2 inicjalizatory. Uzasadnienie pinem: `City.postCaptureLawTurnsRemaining/wasRebellionReconquest`, `civChronicleByOwner` (`main.ts:2268`), `cityProd` (`main.ts:3448`). |
| `engine/src/domain/eliminacja.rs` | DL-7: `eliminate_owner` usuwa też wpisy `economy.units` rozwiązanych jednostek (pin `disbandOwnerUnits` usuwa obiekt w całości). |
| `engine/tests/p6_zdobycie_miasta_b.rs` (nowy) | Wektory pinu: 281 przypadków religii (adapter na stanie), 9 scenariuszy kolejki, prawo, kronika; testy: brak wpisu religii, cud w kolejce → `not_applied`, fallback „najstarsze miasto”, barbarzyńca zeruje kolejkę, eliminacja czyści `economy.units`, tabela kroków. |
| `engine/tests/p6_zdobycie_miasta_b_bridge.rs` (nowy) | E2E przez most (`StartSiegeStorm`/`Skip`/`Step`/`FinishSiegeBattle`) z wektorem `e2e` generatora; determinizm i niezależność od podziału kroków; round trip JSON. |
| `engine/tests/p6_zdobycie_miasta_b_gen.mjs` + `p6_zdobycie_miasta_b_vectors/vectors.json` (nowe) | Generator wykonujący tekst pinu (strażnik SHA-256 `54ef001acc49f4547fbe7e76d169dd0c9c7384a3425fa61da0d558af73e2b615`); MD5 `vectors.json` = `bf7d5307291b88c950213f4845bbae67` (dwa uruchomienia, ten sam MD5). Kontrola danych: `civs.json`, `society-params.json` Rust = pin; `buildings.json` — `lokalizacja` per id = pin (rekordy 43 vs 44 to znany dryf poza tematem). |

Nie ruszano: `siege_tactics_loop.rs`, `siege_battle_session.rs`, `siege_battle_apply.rs`, `p6_k5loop_wiring_a*`, `bridge.rs`,
`bridge_contract.rs`, `save_load.rs`, `client`, `renderer`, `src-tauri`, `gra/`. Wektory części A bez zmian.

## 3. Decyzje techniczne (do `REJESTR-RUST.md` przez orkiestratora)

- **D-ZMB-1** Pola stanu w `PlayableState` obok `PlayableCity` (wzorzec `oblegane`/`captured_from_owner_by_city`), typy serde
  w `city_capture_apply.rs` z konwersją do istniejących typów domeny (`CivChronicle`, `CityProduction`) — logika pinu tylko
  w istniejących modułach (`note_city_capture`, `sanitize_build_queue`, `filter_queue`, `apply_post_capture_law_on_capture`).
- **D-ZMB-2** Klucze: kronika po id stanu (gracz = 1, jak `praca_pool_by_owner`, D-ZMA-5); kolejka/prawo po `CityId`.
- **D-ZMB-3** `capitalCityIdForOwner(atk)` w kroku kolejki: jawna stolica zdobywcy z mapy `designated` (sprzed zdobycia; pin
  zmienia `capitalCityIdByOwner` dopiero w `runCapitalCapturePlunder`), inaczej `oldestCityOfOwner`. Flaga `is_capital`
  zdobytego miasta (stolica ofiary) NIE jest brana za stolicę zdobywcy.
- **D-ZMB-4** `wonderGateOk` bez portu: pozycja cudu (`__wonder__:`) przechodzi bramkę, a krok dopisuje `wonderGateOk` do
  `not_applied` (jawnie, nie po cichu). W stanie Rust kolejka nie jest dziś zasilana, więc ścieżka nieosiągalna w grze.
- **D-ZMB-5** `civKeyForOwnerId` = `PlayablePlayer::civilization` dopasowane do `civs.json` (`ikonaId`/`Cywilizacja`) →
  `ikonaId`, brak wiersza = `''` (pin: nieznany właściciel nie dziedziczy macierzy). Sprawdzenie wiersza macierzy pominięte:
  wszystkie cywilizacje `civs.json` mają `ikonaId` = `typCywilizacji` (wektory pokrywają znane, nieznane i puste klucze).
- **D-ZMB-6** Religia: `religion_by_city` (u32) — wynik pinu jest całkowity (`Math.round`, `floor`, reszty całkowite),
  zapis zawsze (także `{}`), jak `cityRelig.set`.

## 4. Tabela W1–W14 i DL-1…DL-7

| # | Status |
|---|---|
| W1 | ZASTOSOWANO (szturm gracza z wyłomem, część A) + kroki B w tej samej ścieżce. |
| W2 | ZASTOSOWANO (część A). |
| W3, W4, W5 | POZA ZAKRESEM (kapitulacja). |
| W6, W7, W8, W9 | POZA ZAKRESEM (zdobycie bez bitwy / AI). |
| W10 | Producent P1 wspólny — kroki B działają także dla przyszłego wołającego P2. |
| W11 | POZA ZAKRESEM (cesja). |
| W12, W13 | POZA ZAKRESEM (przegrana po utracie miasta). |
| W14 | n/d (haki testowe). |
| DL-1 | ZASTOSOWANO: `onCityCapturedReligion` → `religion_by_city` (281 wektorów + E2E). |
| DL-2 | NIE ZASTOSOWANO (poza allowlistą): pin ZAPISUJE `capturedFromOwnerId` — `save.ts:352-353` (`cities: City[]`, „the live `cities` array”), odczyt `save.ts:724`; pole jest polem `City` (`cities.ts:984`). Wymaga zmiany `save_load.rs` (poza allowlistą tego tematu) → osobny temat. |
| DL-3 | NIE ZMIENIONO (pin rozstrzyga, ale wskazuje inne źródło): pin trzyma klucze `diplomacyPairMeta` z `_` (`main.ts:35242-35244` `diploPairKeyHasOwner` dzieli po `_`), więc `WarTurnState::clear_eliminated_owner_war_state` JEST zgodne z pinem; rozbieżny jest zapis stanu `war_turn_declare::pair_key` (`min-max`). Naprawa u źródła = zmiana formatu klucza w całym `war_turn_declare`/`turn_war_inputs` (poza allowlistą, wpływ na zapis) → osobny temat; obejście D-ZMA-8 zostaje. |
| DL-4 | ZASTOSOWANO: prawo po przejęciu, kronika (`noteCityCapture`), kolejka produkcji; NIE: `recordCityCaptureEvent` (patrz §6). |
| DL-5 | POZA ZAKRESEM (dispatch). |
| DL-6 | NIE ZASTOSOWANO: wektor mocy ofiary wymaga generatora wykonującego producentów mocy pinu (`buildObjectivePowerForOwner`) na stanie eliminacji — osobny temat (POWER-*). |
| DL-7 | ZASTOSOWANO u źródła (`eliminacja.rs`), adapter części A usunięty; test `eliminacja_usuwa_wpisy_economy_units_u_zrodla`. |

`notApplied` na ścieżce gracza po części B (pozostałe wpisy, każdy z uzasadnieniem pinem — brak pola/portu w stanie):
`inGarnizon/oblegaCityId`, `foundedByOwner`, `rebelState`, `seedCityOwnerDefaults` (ustawienia miasta), `applyLiveSafeRationForCity`
(racje), `clearCityStateFlagOnCapture` (`startCityState`), `onCityCapturedCulture` (`ownCultureShare`),
`triggerRebelProtectionWarConsequence` (bez `rebelState` zawsze no-op), `syncCityGarnizon`, `recordCityCaptureEvent`; przy
stolicy `naukaPool`, `spichlerz`; przy eliminacji przez gracza `shouldShowPlayerTriumphCityStateUnification`.

## 5. Testy (dokładne wyniki)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`…/scratchpad/zmb/target`, poza repo).

- `cargo fmt --all -- --check`: EXIT 0. `cargo clippy --all-targets -- -D warnings`: EXIT 0 (przed ostatnim dopisaniem testów;
  ponowione w pełnej bramce, wynik §5a).
- Testy dotknięte (jedno wywołanie): lib 144/144, `bridge_contract` 10/10, `p6_k5loop_wiring_b` 15/15, `_pin` 2/2,
  `p6_siege_transfer` 3/3, `_effects` 3/3, `_effects_q4` 2/2, `_prod` 4/4, `_q5` 12/12, `p6_siege_capital_plunder` 5/5,
  `p6_siege_capture_events` 6/6, `p6_zdobycie_miasta_a` 6/6, `p6_zdobycie_miasta_a_bridge` 7/7, `p6_zdobycie_miasta_b` 9/9
  (po dopisaniu: 11/11), `p6_zdobycie_miasta_b_bridge` 3/3 (po normalizacji flagi, §6).
- Wektory części A: bez zmian (MD5 pliku nietknięty, testy A zielone).
- Generator: `node rust-port/engine/tests/p6_zdobycie_miasta_b_gen.mjs` → pinSha256 `54ef001a…b615`, MD5 `bf7d5307291b88c950213f4845bbae67`,
  dwa uruchomienia = ten sam MD5.

### 5a. Pełna bramka

Na kodzie `b6e220850` (checkout z `dyspozycje/`, w tle `setsid nohup`): `cargo fmt --all -- --check` EXIT 0;
`cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` EXIT 0 — 553 binarek
testowych, 4202 passed, 0 failed, 1 ignored (istniejący przed tematem; temat nie dodaje `#[ignore]`). Target tematu
usunięty po bramce.

### 5b. Mutanty (`scratchpad/zmb/mut.py`, bramka = `p6_zdobycie_miasta_b` + `_b_bridge` + `_a_bridge`, źródła przywracane, `git status` czysty po serii)

32 mutanty: 31 ZABITYCH, 1 RÓWNOWAŻNY.
- Religia M01–M15 (krąg kultury, gałąź tego samego kręgu, inwersja udziału, `Math.round`, fallback populacji, filtr
  „innych”, kolejność Hamiltona, dosypka reszty, gałąź starego właściciela, gałąź bez starego, dodanie `newCount`, strażnik
  barbarzyńcy, populacja po stracie, zamiana religii stron, pusty klucz cywilizacji) — wszystkie ZABITE.
- Prawo M16–M17, kronika M18–M19, M30 (wpięcie) — ZABITE.
- Kolejka M20–M25, M27, M29, M32 — ZABITE (M24 i M32 po dopisaniu wektora `stolica_front_z_postepem` i testu barbarzyńcy).
- DL-7 M26 — ZABITY po dopisaniu testu `eliminacja_usuwa_wpisy_economy_units_u_zrodla`.
- Religia — wpięcie M28 ZABITY.
- **M31 RÓWNOWAŻNY**: zwrot Pracy z WEWNĘTRZNEJ `sanitizeBuildQueue` (w `sanitizeProductionQueue`) kierowany do złego
  właściciela — druga sanityzacja działa na kolejce już oczyszczonej przez pierwszą i zawsze zwraca `refundedPraca = 0`
  (idempotencja, ten sam fakt sprawdza `effects_queue_vectors_match_pin` z Q3), więc gałąź nie ma skutku.

## 6. Długi i uwagi

- ZMB-DL-1 `recordCityCaptureEvent` (karta zdarzenia zdobycia) NIE wpięty: wymaga portu `buildCityCaptureReportRows`
  (`main.ts:1781`, tekst wierszy), `capturePopLossReportRow` (`cities.ts:1255`), `civLabelForOwner`/`ownerDiploLabel`
  (`main.ts:36576`) i magazynu `CaptureEventStore` w stanie. Dispatch wymienia „wpis zdarzenia/kroniki” — kronika
  (`noteCityCapture`) zastosowana, karta zdarzenia → osobny temat (ZDOBYCIE-MIASTA-C / raport zdobycia).
- ZMB-DL-2 DL-2 (`capturedFromOwnerId` w zapisie) — pin zapisuje; zmiana `save_load.rs` poza allowlistą. Nowe pola B
  (`post_capture_law_by_city`, `civ_chronicle_by_owner`, `city_prod_by_city`) też nie są w `save_load` (pin zapisuje
  `cityProd` `save.ts:396/729`, kronikę `meta.civChronicleByOwner` `main.ts:2267`).
- ZMB-DL-3 Remis części ułamkowej w metodzie Hamiltona: pin `localeCompare`, Rust porównanie bajtowe; zgodne dla kluczy
  ASCII (wektory), dla nazw z polskimi znakami w pozycji remisu NIE_ZMIERZONO.
- ZMB-DL-4 DL-3 — patrz tabela: rozbieżny format klucza w zapisie stanu (`-` zamiast `_` pinu), nie w czyszczeniu.
- ZMB-DL-5 DL-6 — wektor mocy ofiary przy eliminacji (POWER-*).
- ZMB-DL-6 `wonderGateOk` bez portu (D-ZMB-4).
- Obserwacja (poza zakresem): `gracz_kiedys_mial_miasto` ma `#[serde(skip)]`, więc odpowiedzi mostu różnią się tą flagą
  zależnie od tego, czy stan przeszedł przez JSON (ścieżka `Skip` vs `Step`); test determinizmu B normalizuje flagę.
- Kolejka produkcji w `PlayableState` nie jest dziś zasilana przez ekonomię Rust (puste `city_prod_by_city`) — krok jest
  zgodny z pinem, ale w grze aktywny dopiero po wpięciu produkcji (EKONOMIA-TURA).

## 7. Następny krok

Evaluator (runda 1): regeneracja generatora (SHA/MD5), przegląd kolejności kroków wobec `main.ts:36034-36265`, mutanty,
decyzja co do zakresu ZMB-DL-1 (karta zdarzenia) i DL-2/DL-3 (allowlista).
