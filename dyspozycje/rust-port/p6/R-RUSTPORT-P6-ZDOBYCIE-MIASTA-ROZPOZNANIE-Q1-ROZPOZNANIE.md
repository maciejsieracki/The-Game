# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 — rozpoznanie zdobycia miasta (#115 / #175)

Baza: `0ca58770e` (czubek `origin/rust-port/parity-v2`, commit `0ca58770ee976513c8c68bbbb71ac089a9973736`).
Pin (tylko odczyt): `07d2fbd72` → `gra/src/main.ts` (zapis lokalny poza repo: `scratchpad/pin-main.ts`).
Zakres: wyłącznie odczyt. Brak zmian w `src/**`, `tests/**`, `gra/**`, `Cargo.*`.
Runda 2 (poprawki po zarzutach Evaluatora r1): zmiany oznaczone `[R2]`.

Legenda statusu:
- **PROD** — wołane z produkcyjnej ścieżki Rust (poza testami).
- **PORT-NIEPODPIĘTY** — logika/funkcja istnieje w Rust, ale brak wołającego poza testami i poza własnym modułem.
- **BRAK** — brak odpowiednika w Rust.
- **POZA PRODUKCJĄ** — haki testowe pina.
- **NIE_ZMIERZONO** — nie sprawdzono (oznaczone wprost).

Metoda: grep po `rust-port/` z wykluczeniem `**/tests/**` dla symboli: `check_victory`, `check_defeat`, `apply_transfer_with_effects`, `apply_transfer(`, `run_capital_capture_plunder(`, `record_player_ever_owned_city(`, `can_capture_empty_city(`, `record_city_capture_event(`, `resolve_surrender_path(`, `handle_siege_capitulation_phase(`, `apply_city_capture`, `allow_city_capture`, `eliminate_owner`, `enter_city_after_surrender`, `apply_post_capture_law_on_capture`, `rebel_protection_war_request`, `cession`, `transfer_city`, `after_battle`, `post_battle`. [R2] Ten sam zestaw grep powtórzony w `src-tauri/` i `gra-robocza/` (bez `tests/`): zero trafień wołających poza definicjami, więc zakres statusów BRAK / PORT-NIEPODPIĘTY obejmuje cały repo (zmierzono). Jedyne trafienia `cession` poza testami to bramki `city_cession_ok` (patrz W11).

## 1. Węzły pina (przejęcie miasta) — definicje

| # | Węzeł (pin, plik:linia) | Rola |
|---|---|---|
| P1 | `applyCityCaptureToMap` — `gra/src/main.ts:36034` | Producent skutków zdobycia w main.ts: `noteCityCapture` (36040), snapshot `wasProtectedRebel` (36055, PRZED P9), **wywołanie P9 (36061)**, `settleWonderTransfer` (~36088), `triggerRebelProtectionWarConsequence` (36090), `maybeResolveRegularWarOnCityCapture` (36092), **`runCapitalCapturePlunder` (36221)**, `reportRows`. [R2] Właściwa zmiana właściciela NIE dzieje się w main.ts — deleguje ją do P9. |
| P9 | [R2] `applyCityCaptureAfterBattle` — import `main.ts:963`, wołanie `main.ts:36061`; definicja w `gra/src/game/post-battle-map.ts` (poza main.ts) | Zmiana właściciela miasta i jednostek; gdy `!isBarbarian(atkOwner)` woła `applyPostCaptureLawOnCapture` (kasuje `rebelPreviousOwnerId` / `rebelProtectionTurnsRemaining` bezwarunkowo). Rdzeń P1. |
| P2 | `captureCityWithoutBattle` — `gra/src/main.ts:36368` | Przejęcie bez bitwy: woła P1 (`36377`), potem odświeżenie mapy i powiadomienie. |
| P3 | `runCapitalCapturePlunder` — `gra/src/main.ts:35558` | Plądrowanie stolicy / eliminacja (ścieżka bojowa i kapitulacja). |
| P4 | `resolveSiegeSurrender` — `gra/src/main.ts:17662` | Kapitulacja oblężenia; gałąź `newOwner` (Transfer): `applyPostCaptureLawOnCapture` (17702) i `triggerRebelProtectionWarConsequence` (17703) wołane bezpośrednio w main.ts; `runCapitalCapturePlunder` w `17828`. |
| P5 | `transferCityByTreaty` — `gra/src/main.ts:36449` | Cesja miasta w pokoju/wasalizacji. **Bez** P1 (komentarz `36401–36404`: „brak `applyCityCaptureToMap`, brak skutków wojennych”). Brak plądrowania. |
| P6 | `applyMapBattleOutcome` — `gra/src/main.ts:34431` (gałąź zdobycia: warunek `34668–34677`, wywołanie `34679`) | Wynik bitwy polowej. [R2] Zdobycie zachodzi dla KAŻDEGO atakującego, gdy: `(allowCityCapture \|\| siegeContext)` i `mapWinner==='atakujacy'` i miasto ma innego właściciela i `areEnemyOwners` i `!fortifiedCaptureBlocked`. Dodatkowo tylko dla atakującego-barbarzyńcy: `!barbCaptureBlockedByRemainingDefenders` (`34664–34666`, `isCityCaptureBlockedByDefenders` z `barbarians.ts`; wymaga zera obrońców nie-barbarzyńskich na heksie PO `applyPostBattleMap`). |
| P7 | `sprawdzPrzegranaPoUtracieMiasta` — `gra/src/main.ts:34017` (checkDefeat `34018–34025`) | Przegrana po utracie OSTATNIEGO miasta w bitwie; wołane z `onBarbarianCityBattleResolved` (`34037`, wołane w `34039`). |
| P8 | `handleSiegeCapitulationPhase` / tick kapitulacji — `gra/src/main.ts:17646`, `38867` | Wejście do `resolveSiegeSurrender` (`17648`, `38867`). |

## 2. Miejsca zdobycia z pina → Rust (tabela wymagana kryterium 1)

Każdy wiersz: miejsce wywołania w pinie → odpowiednik Rust → status.

| # | Miejsce w pinie (plik:linia) | Kontekst | Odpowiednik Rust (plik:linia) | Status |
|---|---|---|---|---|
| W1 | `main.ts:34679` (w `applyMapBattleOutcome` 34431; warunek 34668–34677) | Bitwa polowa: zdobycie przy `(allowCityCapture\|\|siegeContext)`; dla barbarzyńcy dodatkowo sprawdzenie obrońców (34664–34666) | BRAK. Grep `allow_city_capture` / `apply_city_capture` pusty | **BRAK** |
| W2 | `main.ts:36221` (w P1 `applyCityCaptureToMap` 36034) | Plądrowanie stolicy po zdobyciu (ścieżka bitwy i oblężenia) | `siege_capital_plunder.rs:504` `run_capital_capture_plunder` (port logiki, wektory w `tests/p6_siege_capital_plunder.rs`) | **PORT-NIEPODPIĘTY** (wołający brak; `siege_transfer.rs:180–188` jawnie: „wolajacy niepodpiety - W8”) |
| W3 | `main.ts:17828` (w P4 `resolveSiegeSurrender`, gałąź newOwner) | Plądrowanie stolicy przy kapitulacji | `siege_capital_plunder.rs:504` (jw.) | **PORT-NIEPODPIĘTY** |
| W4 | `main.ts:17662`–`17877` (P4 gałąź Transfer) | Skutki przejęcia przy kapitulacji (zmiana właściciela, pop, kolejka, wojna, prawo) | `siege_transfer.rs:340` `apply_transfer_with_effects` (wołający poza testami: BRAK; komentarz `playable.rs:553` „BRAK wolajacego w produkcji”) | **PORT-NIEPODPIĘTY** |
| W5 | `main.ts:17648` / `38867` (P8) — decyzja kapitulacji | Kolejka kapitulacji, decyzja głodowa/licznik | `siege_surrender.rs:119` `handle_siege_capitulation_phase`, `:171` `resolve_surrender_path`, `:149` `surrender_tick_action` (czysta decyzja) | **PORT-NIEPODPIĘTY** (wołający tylko w testach modułu) |
| W6 | `main.ts:36352` (`tryAutoCaptureEmptyCityAt`, 36313) — auto-zdobycie pustego miasta | Przejęcie bez bitwy | `barbarians.rs:551` `can_capture_empty_city` (predykat, bez P2) | **BRAK** (P2 nie ma odpowiednika; predykat PORT-NIEPODPIĘTY) |
| W7 | `main.ts:32536` (`capture_empty` z kliknięcia wroga na mapie) | Przejęcie pustego miasta przez gracza | jw. (P2 brak) | **BRAK** |
| W8 | `main.ts:36749`, `36754` (`executeSilentSiegeStorm` 36730) — szturm AI bez UI | Zdobycie miasta po szturmie AI | P2 brak | **BRAK** |
| W9 | `main.ts:36833` (`launchSiegeStormFromMap` 36799) — szturm gracza | Zdobycie po szturmie | P2 brak | **BRAK** |
| W10 | `main.ts:36377` (wewnątrz P2) — `applyCityCaptureToMap` | Wspólny producent dla W6–W9 | BRAK (jw., W1) | **BRAK** |
| W11 | `main.ts:12661` (`transferCityByTreaty` w wykonaniu propozycji, P5 36449) — cesja pokojowa | Zmiana właściciela bez skutków wojennych i bez plądrowania | [R2] **Producent BRAK.** Istnieją wyłącznie bramki (wstrzyknięte predykaty `city_cession_ok` / `cs_blocks_cession`): `ai_peace_city_offer.rs:234` i `:280`; `war_turn_ai_ai.rs:79`, `:126`, `:139`; `diplomacy_war_weariness_tick.rs:194`, `:377`; `diplomacy_ai_forced_peace.rs:382`, `:644`. Brak funkcji przenoszącej miasto. Pin: `game/diplomacy-value-catalog.ts` (`planCityCession`, Z1/Z2) — NIE_ZMIERZONO po stronie Rust | **BRAK** (producent); bramki PORT |
| W12 | `main.ts:34017` / `34039` (P7 sprawdzPrzegranaPoUtracieMiasta) — przegrana po bitwie z miastem barbarzyńców | Ostatnie miasto gracza utracone w bitwie | `victory.rs:261` `check_defeat` (czysta funkcja, `victory.rs:292` w `check_victory` 273); wołający produkcyjny check_victory/check_defeat: **BRAK** | **PORT-NIEPODPIĘTY** (kontrakt pure; hak po bitwie BRAK) |
| W13 | `main.ts:34037` `onBarbarianCityBattleResolved` → P7. [R2] Produkcyjny wołający: `main.ts:43398` (`launchIncomingMapFieldBattle`, faza barbarzyńców), callback przekazany w `main.ts:43406`. To jedyne produkcyjne wejście drugiej ścieżki przegranej. | Hak onResolved bitwy barbarzyńców | BRAK | **BRAK** |
| W14 | [R2] `main.ts:28612` (`captureViaSiegeSurrender` → `resolveSiegeSurrender`); `main.ts:28682`–`28685` (`__defeatTestDebug`, `onBarbarianCityBattleResolved` w 28685); `main.ts:28468`, `28632`, `28700`, `28690`, `28905` (`captureCityForTest`, `captureCityByBarbarians`, pozostałe `__*TestDebug`) | Haki testowe (nie produkcja) | n/d | **POZA PRODUKCJĄ** (test-hook; nie port) |

Uwaga do W12: P7 wołany jest z `onBarbarianCityBattleResolved`; w pinie dodatkowo `checkDefeat` z `sprawdzPrzegranaPoUtracieMiasta` jest jedynym miejscem poza końcem tury. Rust `check_victory` ma `gracz_kiedys_mial_miasto` (`victory.rs:107–111`), a pin używa `playerEverOwnedCityByOwner.has(HUMAN_OWNER_PRIMARY)` (pin `34020`). Zgodność mapowania tej flagi: NIE_ZMIERZONO (wejście wołającego nie istnieje w Rust).

Dodatkowe skutki po zdobyciu (już PORT w module, bez wołającego w produkcji):
- `record_city_capture_event` — `siege_capture_events.rs:182` (PORT-NIEPODPIĘTY; `spectacle` nie portowane).
- `record_player_ever_owned_city` — `siege_transfer_q5.rs:107` (PORT; pin: `playerEverOwnedCityByOwner.add` — `main.ts:36214–36218` (P1/W2) i `17816`; wołający w Rust poza testami: BRAK, zmierzono grepem).
- `power_record_city_capture` — `playable.rs:554–561` → `WarTurnState::record_capture_power_gain` (`war_turn_state.rs:654`); pin `main.ts:35669–35675` (akumulator zdobyczy). BRAK wołającego w produkcji (komentarz `playable.rs:553`).
- `can_capture_empty_city` — `barbarians.rs:551` (predykat dla W6–W7; BRAK P2).

## 3. Lista braków (kryterium 2)

Pola / funkcje / producenci po stronie Rust, bez których zdobycie nie wpięte w produkcję:

| Brak | Pin (źródło) | Co trzeba | Uwagi |
|---|---|---|---|
| [R2] Producent `applyCityCaptureAfterBattle` (P9) — zmiana właściciela | `main.ts:963` (import), `main.ts:36061` (wołanie), `game/post-battle-map.ts` (definicja) | Port zmiany właściciela miasta i jednostek, wejścia garnizonu, oraz `applyPostCaptureLawOnCapture` gdy atakujący nie jest barbarzyńcą (kasowanie stanu rebelii). | BRAK w Rust: grep `after_battle` / `post_battle` poza testami — pusty. Element Rust do złożenia: `siege_transfer_effects::apply_post_capture_law_on_capture` (`siege_transfer_effects.rs:163`). |
| Producent `applyCityCaptureToMap` (P1) | `main.ts:36034–36221+` | Port kolejności: snapshot `wasProtectedRebel` (36055) PRZED P9 (36061); `triggerRebelProtectionWarConsequence` (36090); `maybeResolveRegularWarOnCityCapture` (36092); `settleWonderTransfer`; W2; `reportRows`; `noteCityCapture` (36040); `playerEverOwnedCityByOwner.add`. | Rust ma komponenty (`siege_transfer_effects::rebel_protection_war_request` `:211`, `diplomacy_war_peace_profile::record_war_city_loss`, `war_turn_declare::register_regular_war_city_loss`), brak złożenia. |
| Producent `captureCityWithoutBattle` (P2) | `main.ts:36368–36387` | Port + wiring W6–W9. | Zależy od wejść `canCaptureCityWithoutBattle`, `fortifiedCityCaptureBlocked`, `collectAtkRosterNearCity` (NIE_ZMIERZONO w Rust). |
| Gałąź zdobycia w bitwie (W1) | `main.ts:34668–34679` | [R2] Port warunku (dla każdego atakującego; dla barbarzyńcy dodatkowo `isCityCaptureBlockedByDefenders`, 34664–34666) i wywołania P1 (34679). | Brak `applyMapBattleOutcome` w Rust o tej semantyce (`combat.rs` obsługuje fazę dystansu — NIE_ZMIERZONO, czy obejmuje wynik bitwy polowej). |
| Producent cesji (P5 / W11) | `main.ts:36449–36500` | Port `transferCityByTreaty`, a na nim `cityCessionPlanFor` / `planCityCession` z pina (`game/diplomacy-value-catalog.ts`). | [R2] Bramki `city_cession_ok` istnieją w Rust (patrz W11) i muszą być WEJŚCIEM tematu Z7, nie są producentem. |
| Wołający `apply_transfer_with_effects` (W4) | `main.ts:17700–17893` | Wiring w `resolveSiegeSurrender` (kolejność: efekty → wejście garnizonu → `endMapSiege` wg `siege_surrender.rs` nagłówka). | [R2] `apply_transfer_with_effects` sam woła `apply_post_capture_law_on_capture` i `rebel_protection_war_request` (`siege_transfer.rs:374`, `:381`); `enter_city_after_surrender` wg komentarza `siege_transfer.rs:171` idzie PO nim. Zależność W8 / #106 (`R7K7C-WIRING`) i #120 — NIE_ZMIERZONO, czy #106 wpływa na kolejność `advance_turn`. |
| Wołający `run_capital_capture_plunder` (W2/W3) | `main.ts:35558`, `17828`, `36221` | Wiring po P1/P4; akumulatory zdobyczy (`power_record_city_capture`, pin 35669–35675). | Zależy od producenta P1. |
| Wołający `check_defeat` po bitwie (W12/W13) | `main.ts:34017–34039`; produkcyjny call site `main.ts:43398–43406` (callback); hak `main.ts:28685` | [R2] Hak po `launchIncomingMapFieldBattle` (faza barbarzyńców) → `check_defeat` z flagą `gracz_kiedys_mial_miasto` z produkcji. | Zależy od producenta bitwy barbarzyńców (K5-LOOP, #113) i ustalenia `playerEverOwnedCityByOwner` w Rust (NIE_ZMIERZONO, czy istnieje w PlayableState). |
| Predykat bitwy/oblężenia (`siegeContext`, `allowCityCapture`) | `main.ts:33979`, `34057`, `34669` | Wejście do producenta bitwy. | Brak w Rust (grep `allow_city_capture` pusty). |
| Wołający `record_player_ever_owned_city` | `main.ts:36214–36218`, `17816` | Wiring w P1 / P4 przed wejściem garnizonu. | Zmierzono: brak wołającego poza testami. |
| Wołający `record_city_capture_event` | pin `recordCityCaptureEvent` (wywoływany z P1/P4) | Wiring + `spectacle` (BRAK w Rust, zaznaczone w `siege_transfer.rs:188–195`). | Zależność W8. |

### 3a. [R2] Istniejące komponenty Rust (do złożenia w P1/P4/P9; wszystkie bez wołającego poza modułem `siege_transfer*`)

| Komponent Rust | Odpowiednik w pinie | Wołający w Rust (poza testami) |
|---|---|---|
| `siege_enter_city::enter_city_after_surrender` — `rust-port/engine/src/domain/siege_enter_city.rs:132` | `enterCityAfterSurrender` (`siege-enter-city.ts`), wejście garnizonu w P4 | Opisany w `siege_surrender.rs` (nagłówek) i `siege_transfer.rs:171`; produkcja: BRAK. |
| `eliminacja::eliminate_owner` — `rust-port/engine/src/domain/eliminacja.rs:48` | eliminacja właściciela (P1 / P3) | grep poza definicją: **0 trafień** w `rust-port/` (bez `tests/`). Rozbieżność z #114 („produkcyjna ścieżka eliminacji”, zakończone) — NIE_ZMIERZONO, czy #114 używa innej nazwy wejścia. |
| `siege_transfer_effects::apply_post_capture_law_on_capture` — `siege_transfer_effects.rs:163` | `applyPostCaptureLawOnCapture` (P9 i P4 `main.ts:17702`) | `siege_transfer.rs:374` (wewnątrz `apply_transfer_with_effects`, PORT-NIEPODPIĘTY) |
| `siege_transfer_effects::rebel_protection_war_request` — `siege_transfer_effects.rs:211` | `triggerRebelProtectionWarConsequence` (P1 `main.ts:36090`, P4 `17703`) | `siege_transfer.rs:381` (jw.) |

## 4. Plan podziału na tematy wykonawcze (kryterium 3)

Liczby rund są SZACUNKIEM (nie pomiarem). Kolejność zgodna z zależnościami.

| Temat | Zakres | Zależności | Szacunek rund |
|---|---|---|---|
| Z1 `ZDOBYCIE-PRODUCENT-P1` | [R2] Port P9 `applyCityCaptureAfterBattle` (zmiana właściciela, garnizon, `applyPostCaptureLawOnCapture`) razem z P1 (`applyCityCaptureToMap`): kolejność snapshotu `wasProtectedRebel` → P9 → wojna rebeliantów; skutki wojenne, eliminacja, raport, wywołanie W2 i `record_player_ever_owned_city`. Wektory z pina. Składa komponenty z §3a. | brak (moduły PORT istnieją) | ok. 4 (zwiększone o P9) |
| Z2 `ZDOBYCIE-WIRING-KAPITULACJA` | Podpięcie `apply_transfer_with_effects` (W4) i `run_capital_capture_plunder` (W3) w `resolveSiegeSurrender` (kolejność z pina `17700–17893`); akumulator zdobyczy. | Z1; #106 (NIE_ZMIERZONO) | ok. 2–3 |
| Z3 `ZDOBYCIE-BEZ-BITWY` | Port `captureCityWithoutBattle` (P2) i wiring W6, W7 (`capture_empty`, auto-zdobycie). | Z1 | ok. 2 |
| Z4 `ZDOBYCIE-SZTURM` | Wiring W8, W9 (szturm AI i gracza) do P2. | Z3; #113 (dla szturmu z UI) | ok. 2–3 |
| Z5 `ZDOBYCIE-BITWA-PRODUCENT` | [R2] Port gałęzi zdobycia z `applyMapBattleOutcome` (W1, warunek 34668–34677): bramka dla każdego atakującego, dodatkowa bramka obrońców tylko dla barbarzyńcy (`isCityCaptureBlockedByDefenders`); wynik bitwy polowej w zakresie tej gałęzi. | Z1; #97/#98/#113 dla oblężenia; NIE_ZMIERZONO, czy `combat.rs` obejmuje wynik bitwy | ok. 4–6 (zależy od zakresu `applyMapBattleOutcome`) |
| Z6 `ZDOBYCIE-PRZEGRANA-OSTATNIE-MIASTO` | Hak P7 po bitwie barbarzyńców (W12, W13) z `check_defeat`; wołający produkcyjny `main.ts:43406`; flaga `gracz_kiedys_mial_miasto` w stanie. | Z5 (producent bitwy barbarzyńców); NIE_ZMIERZONO | ok. 2 |
| Z7 `ZDOBYCIE-CESJA-POKOJOWA` | Port `transferCityByTreaty` (P5, W11) i `planCityCession` z pina. [R2] Uwzględnić istniejące bramki `city_cession_ok` (wejścia, nie producent) w ai_peace_city_offer / war_turn_ai_ai / diplomacy_war_weariness_tick / diplomacy_ai_forced_peace. | niezależne od Z1–Z6 (bez P1); pin `game/diplomacy-value-catalog.ts` | ok. 2–3 |

Kolejność proponowana: Z1 → (Z2 ∥ Z3 ∥ Z7) → Z4 i Z5 → Z6. Z7 może startować równolegle z Z1 (nie zależy od P1).

Uwaga procesowa: każdy temat z kodem Rust wymaga ≥ 8 GB wolnego miejsca na `/` przed startem (zasada 5 z `CLAUDE.md`). W chwili rozpoznania wolne: 8,9 GB.

## 5. Niepewne / NIE_ZMIERZONO

- Pełna semantyka `applyMapBattleOutcome` (`main.ts:34431–~34700`) i jej odpowiednik w Rust: NIE_ZMIERZONO.
- [R2] Mapowanie `playerEverOwnedCityByOwner` na stan Rust: NIE_ZMIERZONO.
- [R2] Rozbieżność `eliminate_owner` (0 wołających) z #114 (zakończone jako produkcyjna ścieżka): NIE_ZMIERZONO, czy #114 używa innego wejścia.
- Wpływ #106 i #120 na kolejność wojny przy zdobyciu: NIE_ZMIERZONO.
- Zgodność liczb i progów (np. wyłom, `fortifiedCityCaptureBlocked`) — poza zakresem rozpoznania; brak pomiaru.
- Brak uruchomienia `cargo test` (zmiany tylko dokumentacyjne): TESTY NIE DOTYCZY.
