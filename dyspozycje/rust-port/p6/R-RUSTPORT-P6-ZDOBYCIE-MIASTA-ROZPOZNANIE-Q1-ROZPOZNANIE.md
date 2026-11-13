# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 — rozpoznanie zdobycia miasta (#115 / #175)

Baza: `0ca58770e` (czubek `origin/rust-port/parity-v2`, commit `0ca58770ee976513c8c68bbbb71ac089a9973736`).
Pin (tylko odczyt): `07d2fbd72` → `gra/src/main.ts` (zapis lokalny poza repo: `scratchpad/pin-main.ts`).
Zakres: wyłącznie odczyt. Brak zmian w `src/**`, `tests/**`, `gra/**`, `Cargo.*`.

Legenda statusu:
- **PROD** — wołane z produkcyjnej ścieżki Rust (poza testami).
- **PORT-NIEPODPIĘTY** — logika/funkcja istnieje w Rust, ale brak wołającego poza testami.
- **BRAK** — brak odpowiednika w Rust (grep po `rust-port/`, poza `tests/`).
- **NIE_ZMIERZONO** — nie sprawdzono (oznaczone wprost).

Metoda: grep po `rust-port/` z wykluczeniem `**/tests/**` (`check_victory`, `apply_transfer_with_effects`, `apply_transfer(`, `run_capital_capture_plunder(`, `record_player_ever_owned_city(`, `can_capture_empty_city(`, `record_city_capture_event(`, `resolve_surrender_path(`, `handle_siege_capitulation_phase(`, `apply_city_capture`, `allow_city_capture`, `cession`, `transfer_city`). Nie przeszukiwano `src-tauri/` ani `gra-robocza/` pod kątem wołających (NIE_ZMIERZONO poza `rust-port/`).

## 1. Węzły pina (przejęcie miasta) — definicje

| # | Węzeł (pin, plik:linia) | Rola |
|---|---|---|
| P1 | `applyCityCaptureToMap` — `gra/src/main.ts:36034` | Centralny producent skutków zdobycia: zmiana właściciela, wojna, prawo po przejęciu, eliminacja, **wywołanie `runCapitalCapturePlunder` (36221)**, raport (`reportRows`). |
| P2 | `captureCityWithoutBattle` — `gra/src/main.ts:36368` | Przejęcie bez bitwy: woła P1 (`36377`), potem odświeżenie mapy i powiadomienie. |
| P3 | `runCapitalCapturePlunder` — `gra/src/main.ts:35558` | Plądrowanie stolicy / eliminacja (ścieżka bojowa i kapitulacja). |
| P4 | `resolveSiegeSurrender` — `gra/src/main.ts:17662` | Kapitulacja oblężenia; galąź `newOwner` (Transfer) → `runCapitalCapturePlunder` w `main.ts:17828`. |
| P5 | `transferCityByTreaty` — `gra/src/main.ts:36449` | Cesja miasta w pokoju/wasalizacji. **Bez** P1 (komentarz `36401–36404`: „brak `applyCityCaptureToMap`, brak skutków wojennych”). Brak plądrowania. |
| P6 | `applyMapBattleOutcome` — `gra/src/main.ts:34431` (gałąź zdobycia `34656–34679`) | Wynik bitwy polowej; zdobycie tylko gdy atakujący to barbarzyńca i (`allowCityCapture` lub `siegeContext`) → `applyCityCaptureToMap` w `34679`. |
| P7 | `sprawdzPrzegranaPoUtracieMiasta` — `gra/src/main.ts:34017` (checkDefeat `34018–34025`) | Przegrana po utracie OSTATNIEGO miasta w bitwie poza blokiem VICTORY CHECK; wołane z `onBarbarianCityBattleResolved` (`34037`, wołane w `34039`). |
| P8 | `handleSiegeCapitulationPhase` / tick kapitulacji — `gra/src/main.ts:17646`, `38867` | Wejście do `resolveSiegeSurrender` (`17648`, `38867`). |

## 2. Miejsca zdobycia z pina → Rust (tabela wymagana kryterium 1)

Każdy wiersz: miejsce wywołania w pinie → odpowiednik Rust → status.

| # | Miejsce w pinie (plik:linia) | Kontekst | Odpowiednik Rust (plik:linia) | Status |
|---|---|---|---|---|
| W1 | `main.ts:34679` (w `applyMapBattleOutcome` 34431) | Bitwa: zdobycie miasta przez barbarzyńcę (allowCityCapture) lub oblężenie (siegeContext) | BRAK. Brak funkcji o tej semantyce; grep `allow_city_capture`/`apply_city_capture` pusty | **BRAK** |
| W2 | `main.ts:36221` (w P1 `applyCityCaptureToMap` 36034) | Plądrowanie stolicy po zdobyciu (ścieżka bitwy i oblężenia) | `siege_capital_plunder.rs:504` `run_capital_capture_plunder` (port logiki, wektory w `tests/p6_siege_capital_plunder.rs`) | **PORT-NIEPODPIĘTY** (wołający brak; `siege_transfer.rs:180–188` jawnie: „wolajacy niepodpiety - W8”) |
| W3 | `main.ts:17828` (w P4 `resolveSiegeSurrender`, galąź newOwner) | Plądrowanie stolicy przy kapitulacji | `siege_capital_plunder.rs:504` (jw.) | **PORT-NIEPODPIĘTY** |
| W4 | `main.ts:17662`–`17877` (P4 galąź Transfer) | Skutki przejęcia przy kapitulacji (zmiana właściciela, pop, kolejka, wojna, prawo) | `siege_transfer.rs:340` `apply_transfer_with_effects` (wołający poza testami: BRAK; komentarz `playable.rs:553` „BRAK wolajacego w produkcji”) | **PORT-NIEPODPIĘTY** |
| W5 | `main.ts:17648` / `38867` (P8) — decyzja kapitulacji | Kolejka kapitulacji, decyzja głodowa/licznik | `siege_surrender.rs:119` `handle_siege_capitulation_phase`, `:171` `resolve_surrender_path`, `:149` `surrender_tick_action` (czysta decyzja) | **PORT-NIEPODPIĘTY** (wołający tylko w testach modułu) |
| W6 | `main.ts:36352` (`tryAutoCaptureEmptyCityAt`, 36313) — auto-zdobycie pustego miasta | Przejęcie bez bitwy | `barbarians.rs:551` `can_capture_empty_city` (predykat, bez P2) | **BRAK** (P2 nie ma odpowiednika; predykat PORT-NIEPODPIĘTY) |
| W7 | `main.ts:32536` (`capture_empty` z kliknięcia wroga na mapie) | Przejęcie pustego miasta przez gracza | jw. (P2 brak) | **BRAK** |
| W8 | `main.ts:36749`, `36754` (`executeSilentSiegeStorm` 36730) — szturm AI bez UI | Zdobycie miasta po szturmie AI | P2 brak | **BRAK** |
| W9 | `main.ts:36833` (`launchSiegeStormFromMap` 36799) — szturm gracza | Zdobycie po szturmie | P2 brak | **BRAK** |
| W10 | `main.ts:36377` (wewnątrz P2) — `applyCityCaptureToMap` | Wspólny producent dla W6–W9 | BRAK (jw., W1) | **BRAK** |
| W11 | `main.ts:12661` (`transferCityByTreaty` w wykonaniu propozycji, P5 36449) — cesja pokojowa | Zmiana właściciela bez skutków wojennych i bez plądrowania | BRAK. `grep cession|transfer_city` w `rust-port/` (poza testami) pusty. Pin: `game/diplomacy-value-catalog.ts` (`planCityCession`, Z1/Z2) — NIE_ZMIERZONO po stronie Rust | **BRAK** |
| W12 | `main.ts:34017` / `34039` (P7 sprawdzPrzegranaPoUtracieMiasta) — przegrana po bitwie z miastem barbarzyńców | Ostatnie miasto gracza utracone w bitwie | `victory.rs:261` `check_defeat` (czysta funkcja, `victory.rs:292` w `check_victory` 273); wołający produkcyjny check_victory/check_defeat: **BRAK** (grep po `rust-port/` poza testami; wołający tylko w `victory.rs` i `tests/p6_victory.rs`) | **PORT-NIEPODPIĘTY** (kontrakt pure; hak po bitwie BRAK) |
| W13 | `main.ts:34037` `onBarbarianCityBattleResolved` → P7 | Hook onResolved bitwy barbarzyńców | BRAK | **BRAK** |
| W14 | `main.ts:28905`, `28468`, `28632`, `28700`, `28690` (`captureCityForTest`, `captureCityByBarbarians`, `__*TestDebug`) | Haki testowe (nie produkcja) | n/d | **POZA PRODUKCJĄ** (test-hook; nie port) |

Uwaga do W12: P7 wołany jest tylko z `onBarbarianCityBattleResolved`; w pinie dodatkowo `checkDefeat` z `sprawdzPrzegranaPoUtracieMiasta` jest jedynym miejscem poza końcem tury. Rust `check_victory` ma `gracz_kiedys_mial_miasto` (`victory.rs:107–111`), a pin używa `playerEverOwnedCityByOwner.has(HUMAN_OWNER_PRIMARY)`. Zgodność mapowania tej flagi: NIE_ZMIERZONO (wejście wołającego nie istnieje w Rust).

Dodatkowe skutki po zdobyciu (już PORT w module, bez wołającego):
- `record_city_capture_event` — `siege_capture_events.rs:182` (PORT-NIEPODPIĘTY; `spectacle` nie portowane).
- `record_player_ever_owned_city` — `siege_transfer_q5.rs:107` (PORT; wołający w pinie `playerEverOwnedCityByOwner.add` — `main.ts:36214–36218` (P1/W2) i `17816`; w Rust wołający **NIE_ZMIERZONO**).
- `power_record_city_capture` — `playable.rs:554–561` → `WarTurnState::record_capture_power_gain` (`war_turn_state.rs:654`); pin `main.ts:35669–35675` (akumulator zdobyczy). BRAK wołającego w produkcji (komentarz `playable.rs:553`).
- `can_capture_empty_city` — `barbarians.rs:551` (predykat dla W6–W7; BRAK P2).

## 3. Lista braków (kryterium 2)

Pola / funkcje / producenci po stronie Rust, bez których zdobycie nie wpięte w produkcję:

| Brak | Pin (źródło) | Co trzeba | Uwagi |
|---|---|---|---|
| Producent `applyCityCaptureToMap` (P1) | `main.ts:36034–36220+` | Port: zmiana właściciela wszystkich skutków wojennych (`recordWarCityLossForPair`, `maybeResolveRegularWarOnCityCapture`, `triggerRebelProtectionWarConsequence`, `applyPostCaptureLawOnCapture`), wywołanie W2, `reportRows`, `eliminatedCivLabel`. | Rust ma komponenty (`diplomacy_war_peace_profile::record_war_city_loss`, `war_turn_declare::register_regular_war_city_loss`, `siege_transfer_effects::rebel_protection_war_request`), ale brak złożenia. |
| Producent `captureCityWithoutBattle` (P2) | `main.ts:36368–36387` | Port + wiring W6–W9. | Zależy od wejść `canCaptureCityWithoutBattle`, `fortifiedCityCaptureBlocked`, `collectAtkRosterNearCity` (NIE_ZMIERZONO w Rust). |
| Gałąź zdobycia w bitwie (W1) | `main.ts:34656–34679` | Port warunku (barbarzyńca + allowCityCapture/siegeContext) i wywołania P1. | Brak `applyMapBattleOutcome` w Rust o tej semantyce (`combat.rs` obsługuje fazę dystansu — NIE_ZMIERZONO, czy obejmuje wynik bitwy polowej). |
| Producent cesji (P5 / W11) | `main.ts:36449–36500` | Port `transferCityByTreaty`, a na nim `cityCessionPlanFor` / `planCityCession` z pina (`game/diplomacy-value-catalog.ts`). | Brak nazwy `cession`/`transfer_city` w Rust. |
| Wołający `apply_transfer_with_effects` (W4) | `main.ts:17700–17893` | Wiring w `resolveSiegeSurrender` (kolejność: efekty → wejście garnizonu → `endMapSiege` wg `siege_surrender.rs` nagłówka). | Zależność W8 / #106 (`R7K7C-WIRING`) i #120 — NIE_ZMIERZONO, czy #106 wpływa na kolejność `advance_turn`. |
| Wołający `run_capital_capture_plunder` (W2/W3) | `main.ts:35558`, `17828`, `36221` | Wiring po P1/P4; akumulatory zdobyczy (`power_record_city_capture`, pin 35669–35675). | Zależy od producenta P1. |
| Wołający `check_defeat` po bitwie (W12/W13) | `main.ts:34017–34039`, `28682`(hak) | Hak po `launchIncomingMapFieldBattle` → `check_defeat` z flagą `gracz_kiedys_mial_miasto` z produkcji. | Zależy od producenta bitwy barbarzyńców (K5-LOOP, #113) i ustalenia `playerEverOwnedCityByOwner` w Rust (NIE_ZMIERZONO, czy istnieje w PlayableState). |
| Predykat bitwy/oblężenia (`siegeContext`, `allowCityCapture`) | `main.ts:33979`, `34057`, `34669` | Wejście do producenta bitwy. | Brak w Rust (grep `allow_city_capture` pusty). |
| Wołający `record_player_ever_owned_city` | `main.ts:36214–36218`, `17816` | Wiring w P1 / P4 przed wejściem garnizonu. | NIE_ZMIERZONO w produkcji Rust. |
| Wołający `record_city_capture_event` | pin `recordCityCaptureEvent` (wywoływany z P1/P4) | Wiring + `spectacle` (BRAK w Rust, zaznaczone w `siege_transfer.rs:188–195`). | Zależność W8. |

Zależności z dispatchu i rejestru tematów (numery #NN z listy zadań orkiestratora):
- #106 `R7K7C-WIRING` (`apply_dipl_deltas_to_state`) — szczególnie wpływ na stan dyplomacji po zdobyciu (NIE_ZMIERZONO w tym temacie).
- #120 `CRED-HAK-WYPOWIEDZENIE` — hak P4 dla wypowiedzenia wojny; ścieżki wojny z P1 (`maybeResolveRegularWarOnCityCapture`, `triggerRebelProtectionWarConsequence`) zakładają gotowe deklaracje — NIE_ZMIERZONO, czy #120 jest warunkiem wstępnym.
- #113 `K5LOOP-WIRING` — produkcyjna pętla bitwy oblężniczej: wejście do W8/W9 (szturm) i do W1 (wyłom) zależy od tej pętli.
- #97/#98 (`K5-LOOP-AUTO`, `K5-LOOP-WYLOM`) — wyłom i auto-zdobycie w pętli oblężenia.
- #86 `POWER-BITWY-ZDOBYCZE` i #114 `ELIMINACJA-GRACZA` — zakończone; stan mocy i eliminacja są gotowe po stronie stanu, ale wołający zdobycia nie istnieje.

## 4. Plan podziału na tematy wykonawcze (kryterium 3)

Liczby rund są SZACUNKIEM (nie pomiarem). Kolejność zgodna z zależnościami.

| Temat | Zakres | Zależności | Szacunek rund |
|---|---|---|---|
| Z1 `ZDOBYCIE-PRODUCENT-P1` | Port `applyCityCaptureToMap` (P1) bez wiringu bitwy: skutki wojenne, eliminacja, raport, wywołanie `run_capital_capture_plunder` (W2) i `record_player_ever_owned_city`. Wektory z pina. | brak (moduły PORT istnieją) | ok. 3 |
| Z2 `ZDOBYCIE-WIRING-KAPITULACJA` | Podpięcie `apply_transfer_with_effects` (W4) i `run_capital_capture_plunder` (W3) w `resolveSiegeSurrender` (kolejność z pina `17700–17893`); akumulator zdobyczy. | Z1; #106 (NIE_ZMIERZONO) | ok. 2–3 |
| Z3 `ZDOBYCIE-BEZ-BITWY` | Port `captureCityWithoutBattle` (P2) i wiring W6, W7 (`capture_empty`, auto-zdobycie). | Z1 | ok. 2 |
| Z4 `ZDOBYCIE-SZTURM` | Wiring W8, W9 (szturm AI i gracza) do P2. | Z3; #113 (dla szturmu z UI) | ok. 2–3 |
| Z5 `ZDOBYCIE-BITWA-PRODUCENT` | Port gałęzi zdobycia z `applyMapBattleOutcome` (W1, `34656–34679`) i wynik bitwy polowej w zakresie tej gałęzi. | Z1; #97/#98/#113 dla oblężenia; NIE_ZMIERZONO, czy `combat.rs` obejmuje wynik bitwy | ok. 4–6 (zależy od zakresu `applyMapBattleOutcome`) |
| Z6 `ZDOBYCIE-PRZEGRANA-OSTATNIE-MIASTO` | Hak P7 po bitwie barbarzyńców (W12, W13) z `check_defeat`; flaga `gracz_kiedys_mial_miasto` w stanie. | Z5 (producent bitwy barbarzyńców); NIE_ZMIERZONO | ok. 2 |
| Z7 `ZDOBYCIE-CESJA-POKOJOWA` | Port `transferCityByTreaty` (P5, W11) i `planCityCession` z pina. | niezależne od Z1–Z6 (bez P1); pin `game/diplomacy-value-catalog.ts` | ok. 2–3 |

Kolejność proponowana: Z1 → (Z2 ∥ Z3 ∥ Z7) → Z4 i Z5 → Z6. Z7 może startować równolegle z Z1 (nie zależy od P1).

Uwaga procesowa: każdy temat z kodem Rust wymaga ≥ 8 GB wolnego miejsca na `/` przed startem (zasada 5 z `CLAUDE.md`). W chwili rozpoznania wolne: 8,9 GB.

## 5. Niepewne / NIE_ZMIERZONO

- Pełna semantyka `applyMapBattleOutcome` (`main.ts:34431–~34700`) i jej odpowiednik w Rust: NIE_ZMIERZONO.
- Wołający w `src-tauri/` i `gra-robocza/`: NIE_ZMIERZONO (grep ograniczony do `rust-port/`).
- Mapowanie `playerEverOwnedCityByOwner` na stan Rust: NIE_ZMIERZONO.
- Wpływ #106 i #120 na kolejność wojny przy zdobyciu: NIE_ZMIERZONO.
- Zgodność liczb i progów (np. wyłom, `fortifiedCityCaptureBlocked`) — poza zakresem rozpoznania; brak pomiaru.
- Brak uruchomienia `cargo test` (zmiany tylko dokumentacyjne): TESTY NIE DOTYCZY.
