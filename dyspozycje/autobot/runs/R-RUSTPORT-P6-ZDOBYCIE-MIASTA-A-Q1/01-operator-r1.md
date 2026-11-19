# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A)
GOAL: zdobycie miasta po wygranym szturmie gracza z wyłomem (hak T7b `CityCaptureRequested`) zastosowane do
`PlayableState` w kolejności pinu `07d2fbd72`: wejście na heks miasta → bramka zdobycia → `applyCityCaptureToMap`
(P1) z `applyCityCaptureAfterBattle` (P9) → `validateActiveSieges`; wpięte w komendę mostu `FinishSiegeBattle`.
BAZA: `origin/rust-port/parity-v2` = `01abcbf5e` (zgodnie z dispatchem; T7b + PIN2 w środku).
GAŁĄŹ: `rust-port-wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1` (worktree workflow). SHA końcowe: w commicie raportu (sekcja „Commit”).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Najpierw web (pin `07d2fbd72`, przeczytany przed kodem)

- `main.ts:34431-34745` `applyMapBattleOutcome`: w szturmie `fortifiedCaptureBlocked = cityCaptureBlocked = stormCaptureBlocked`,
  więc wygrana z wyłomem przechodzi przez `applyPostBattleMap` z `holdPositionAfterWin = false` — wejście na heks
  odbywa się ZAWSZE (także gdy zdobycie potem nie zajdzie, np. pokój). Bramka zdobycia `:34661-34677`
  (`isCityCaptureBlockedByDefenders`, różny właściciel, `areEnemyOwners`, `!fortifiedCaptureBlocked`), wołanie P1 `:34679`,
  `validateActiveSieges` `:34744` po zdobyciu.
- `post-battle-map.ts:431-467` (`wipeDefenderOnCityCenter` `:191-199`, `retreatDefendersAfterAtkWin` `:331-340`,
  `moveAtkRosterOntoBattleHex` `:357-378` z `syncStackRuchLeft` = minimum), `applyCityCaptureAfterBattle` `:493-596`.
- `main.ts:36034-36264` `applyCityCaptureToMap`, `runCapitalCapturePlunder` `:35558-35780`, `eliminateOwner` `:35348`,
  `recordWarCityLossForPair` `:11543`, `diploEnsureWarStart` `:11488`, `maybeResolveRegularWarOnCityCapture` `:35986`
  (gracz po którejkolwiek stronie = no-op, Q3), `beginWonderTransferWatch`/`settleWonderTransfer` `:4231-4268`,
  `buildAllTerritoryNodes` `:5667`, `endMapSiege` `:17880`, akcesory zasobów `:34864-34990` (`Math.max(0, v)`).
- Gameplay poza webem: brak (nic nie wymyślone; kroki bez pola w stanie są jawnie pominięte, patrz §4).

## 2. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/city_capture_apply.rs` (nowy) | Konsument haka: `apply_storm_capture` (kroki 1–4), `is_city_capture_blocked_by_defenders` (port `barbarians.ts:499-507`), węzły terytorium ze stanu + watch/settle cudów, `recordWarCityLossForPair` na `diplomacyPairMeta`, adapter `OwnerResourceAccess` nad stanem + wołanie `run_capital_capture_plunder` (Q6), sukcesja stolicy, eliminacja, zdobycze Power; DTO `CityCaptureResultDto`; tabela `PIN_STEPS` i `NOT_APPLIED_ALWAYS`. |
| `engine/src/domain/siege_battle_apply.rs` | `enter_city_hex_after_atk_win` (część `applyPostBattleMap` oddana hakowi przez T7b), `validate_storm_siege` (wydzielone bez zmiany zachowania z `apply_outcome`), `end_map_siege` `pub(crate)`, pole `SiegeBattleResultDto::capture` (addytywne, `skip_serializing_if = None`), `finish` woła konsumenta. `apply_outcome` bez zmian zachowania (wektory T7b bajt w bajt). |
| `engine/src/domain/playable.rs` | Pole `captured_from_owner_by_city: BTreeMap<CityId, PlayerId>` (web `City.capturedFromOwnerId`, pisane i czytane przez `applyCapturePopulationLoss` `cities.ts:1235`; bez niego odbicie miasta traciłoby ludność wbrew pinowi). Pusta mapa = pole pomijane w JSON (stan sprzed zmiany bajt w bajt). |
| `engine/src/domain/mod.rs` | `pub mod city_capture_apply;` |
| `engine/tests/p6_zdobycie_miasta_a.rs` (nowy) | Wektory pinu: 12 scenariuszy + 8 przypadków blokady barbarzyńców + tabela wywołań pinu. |
| `engine/tests/p6_zdobycie_miasta_a_bridge.rs` (nowy) | E2E przez most (`StartSiegeStorm`/`Step`/`Skip`/`FinishSiegeBattle`), eliminacja, niezależność od podziału kroków, JSON addytywny, jawne powody braku zdobycia, AI↔AI = błąd. |
| `engine/tests/p6_zdobycie_miasta_a_gen.mjs` + `p6_zdobycie_miasta_a_vectors/vectors.json` (nowe) | Generator wykonujący tekst pinu (strażnik SHA-256 tekstu pinu `a5810e8a71a92c5422914e24de5e00170a7b000250ad6b242e7c4e3411878979`); MD5 `vectors.json` = `04c0ea29e185c7ae3e3dc634cc8fca7e`. |

`bridge.rs`: bez zmian (D-ZMA-2: rozszerzenie `FinishSiegeBattle`, `CONTRACT_VERSION` = 1 bez zmian; `bridge_contract` zielony).
Nie ruszano: `siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `client`, `renderer`, `src-tauri`, `gra/`.

## 3. Decyzje techniczne (do `REJESTR-RUST.md` przez orkiestratora)

- **D-ZMA-1** Wejście na heks (wipe/odwrót/ruch stosu kotwicy) wykonuje konsument haka, nie `apply_outcome`: wektory T7b
  zostają bajt w bajt. `spendAttackMpOnLive` (już wykonany w części B) jest przemienny z ruchem i `syncStackRuchLeft`
  (`max(0, min − 1)` = `min(max(0, a − 1), …)`), co pokrywają wektory (kotwica `ruchLeft` 3, stos 1.5).
- **D-ZMA-2** Komenda mostu: rozszerzenie `FinishSiegeBattle` (w pinie zdobycie jest częścią `finishSiegeStormBattle`).
  Wynik w addytywnym `result.capture`; `captureRequested` (kontrakt T7b) zostaje.
- **D-ZMA-3** `capturedFromOwnerId` jako pole stanu obok `PlayableCity` (wzorzec `oblegane`).
- **D-ZMA-4** Kroki pinu bez pola w `PlayableState` są wymienione w `capture.notApplied` (nie po cichu); każde wywołanie
  z tekstu pinu P1+P9 ma wpis w `PIN_STEPS` (test `kazde_wywolanie_pinu_ma_wpis_w_tabeli` czyta listę wywołań wyciętą
  z pinu przez generator).
- **D-ZMA-5** Id: stan ma gracza = 1 (web 0); `run_capital_capture_plunder` dostaje id webu (1 → 0), skutki wracają na id
  stanu. Właściciel 0 w stanie = jawny błąd (niejednoznaczny).
- **D-ZMA-6** Stolica: web `capitalCityIdByOwner` ↔ `PlayableCity::is_capital`; brak flagi = fallback „najstarsze miasto”
  (`city<N>` z `CityId`). Po zdobyciu miasto traci flagę; sukcesja ustawia flagę nowej stolicy ofiary.
- **D-ZMA-7** AI↔AI (`maybeResolveRegularWarOnCityCapture` z auto-pokojem) nieosiągalne z komendy (szturm wydaje tylko
  gracz); para AI↔AI = `SiegeBattleError::Producer` → `Aborted`, stan bez zmian (D-WIRB-8).
- **D-ZMA-8** Eliminacja: `eliminacja::eliminate_owner` + adapter usuwający `diplomacyPairMeta` ofiary w formacie klucza
  stanu `min-max` (pin `eliminateOwner` kasuje meta par; `WarTurnState::clear_eliminated_owner_war_state` szuka `a_b`).
- **D-ZMA-9** `validateActiveSieges` liczony dwa razy: w `apply_outcome` (T7b, przed wejściem) i po zdobyciu / po
  wejściu bez zdobycia (kontrakt U2). Dla stanów osiągalnych wynik = jednorazowe wołanie pinu po zdobyciu (wektory).
- **D-ZMA-10** Moc ofiary (`buildObjectivePowerForOwner`) liczona tylko w gałęzi eliminacji, po zmianie właściciela
  miasta, przed `eliminateOwner` (kontrakt `siege_capital_plunder.rs`), producentami stanu (`power_raw_for_owner`).

## 4. Tabela W1–W14 (zastosowano / poza zakresem)

| # | Miejsce w pinie | Status w tym temacie |
|---|---|---|
| W1 | `main.ts:34679` gałąź zdobycia `applyMapBattleOutcome` | ZASTOSOWANO dla szturmu (`siegeContext`); bitwa polowa z `allowCityCapture` — poza zakresem (Z5). |
| W2 | `main.ts:36221` `runCapitalCapturePlunder` w P1 | ZASTOSOWANO (przejęcie stolicy + sukcesja, eliminacja, zdobycze Power). |
| W3 | `main.ts:17828` plądrowanie przy kapitulacji | POZA ZAKRESEM (kapitulacja, Z2). |
| W4 | `main.ts:17662-17877` Transfer kapitulacji | POZA ZAKRESEM (Z2). |
| W5 | `main.ts:17648`/`38867` decyzja kapitulacji | POZA ZAKRESEM. |
| W6 | `main.ts:36352` auto-zdobycie pustego miasta | POZA ZAKRESEM (Z3; producent P1 gotowy do użycia). |
| W7 | `main.ts:32536` `capture_empty` | POZA ZAKRESEM (Z3). |
| W8 | `main.ts:36749/36754` szturm AI | POZA ZAKRESEM (brak komendy; AI↔AI = D-ZMA-7). |
| W9 | `main.ts:36833` zdobycie bez bitwy w `launchSiegeStormFromMap` (brak obrońców + machiny) | POZA ZAKRESEM (T7b zwraca `NoDefendersCaptureRequested`; Z3/Z4). Szturm z bitwą = W1. |
| W10 | `main.ts:36377` P1 w `captureCityWithoutBattle` | Producent P1 ZASTOSOWANO (wspólny); wołający P2 poza zakresem. |
| W11 | `main.ts:12661` cesja pokojowa | POZA ZAKRESEM (Z7). |
| W12 | `main.ts:34017/34039` przegrana po utracie miasta | POZA ZAKRESEM (Z6). |
| W13 | `main.ts:34037` hak bitwy barbarzyńców | POZA ZAKRESEM (Z6). |
| W14 | haki testowe pinu | n/d. |

Kroki P1/P9 bez pola w stanie (`notApplied`, D-ZMA-4): `noteCityCapture` (kronika), `inGarnizon/oblegaCityId`,
`applyPostCaptureLawOnCapture` (pola Prawa/rebelii), `foundedByOwner`, `rebelState`, `seedCityOwnerDefaults`,
`applyLiveSafeRationForCity`, `clearCityStateFlagOnCapture`, `onCityCapturedCulture`, `triggerRebelProtectionWarConsequence`
(bez `rebelState` zawsze no-op), `cityProd` (sanityzacja kolejki, zwrot Pracy), `onCityCapturedReligion`, `syncCityGarnizon`,
`recordCityCaptureEvent`; przy stolicy dodatkowo `naukaPool`, `spichlerz`; przy eliminacji przez gracza
`shouldShowPlayerTriumphCityStateUnification`.

## 5. Testy (dokładne wyniki)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`…/scratchpad/zma/target`, poza repo).

- `cargo fmt --all -- --check` (z `rust-port/engine`): EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- Testy dotknięte (jedno wywołanie `cargo test --lib --test …`): EXIT 0 — lib 144/144, `bridge_contract` 10/10,
  `p6_k5loop_wiring_b` 15/15, `p6_k5loop_wiring_b_pin` 2/2, `p6_siege_transfer` 3/3, `p6_siege_transfer_effects` 3/3,
  `p6_siege_transfer_effects_q4` 2/2, `p6_siege_transfer_prod` 4/4, `p6_siege_transfer_q5` 12/12,
  `p6_siege_capital_plunder` 5/5, `p6_siege_capture_events` 6/6, `p6_zdobycie_miasta_a` 6/6, `p6_zdobycie_miasta_a_bridge` 7/7.
- Po regeneracji wektorów (kotwica `ruchLeft` 3): `p6_zdobycie_miasta_a` 6/6, `p6_zdobycie_miasta_a_bridge` 7/7 (EXIT 0).
- Generator: `node rust-port/engine/tests/p6_zdobycie_miasta_a_gen.mjs` → pinSha256 `a5810e8a…8979`, MD5 `04c0ea29e185c7ae3e3dc634cc8fca7e`
  (dwa uruchomienia, ten sam MD5 = determinizm generatora).
- Pełny `cargo test --all-targets --no-fail-fast` (checkout z `dyspozycje/`, kod = commit `39d39ae0a` + raport): EXIT 0,
  551 binarek testowych, 4188 passed, 0 failed, 1 ignored (istniejący przed tematem; temat nie dodaje `#[ignore]`).
  Po nim dopisano tylko asercję testu mostu (flaga `playerEverOwnedCityByOwner`, zabija M33) — powtórzone: fmt EXIT 0,
  clippy `--all-targets -D warnings` EXIT 0, `p6_zdobycie_miasta_a` 6/6, `p6_zdobycie_miasta_a_bridge` 7/7.
- Mutanty (`scratchpad/zma/mut.py`, 33 mutanty, bramka = oba testy tematu, źródła przywracane, `git status` po serii czysty):
  30 ZABITYCH (M01–M08, M10–M29, M31, M33 — M33 po dopisaniu asercji flagi gracza), 3 RÓWNOWAŻNE (uzasadnienie):
  - M09 (P9 wejście tylko kotwicy): stos kotwicy stoi już na heksie miasta po `moveAtkRosterOntoBattleHex`, więc
    przestawienie pozycji w P9 jest dla stanów osiągalnych no-opem (koszt ruchu P9 nadal liczony — M11 zabity);
  - M30 (`endMapSiege` w zdobyciu pominięte): `oblegane` zdjęte już w P9, a gotowe machiny zużyte wcześniej przez
    `consumeReadyMachines` (`apply_outcome`) — brak różnicy stanu;
  - M32 (`oblegane` w P9 pominięte): `endMapSiege` kilka kroków dalej zdejmuje flagę; kroki pomiędzy (cuda, meta pary)
    jej nie czytają.

Pokrycie wektorów (wszystkie z wykonania tekstu pinu, bez ręcznych liczb): zwykłe miasto, obrońca ocalały na centrum
(wipe) + obrońca spoza rosteru (splice P9), stolica wyznaczona z sukcesją, stolica przez fallback „najstarsze”, eliminacja
(majątek, technologie, jednostki i relacje ofiary), odbicie bez straty ludności, ludność 1, cuda w terytorium + fort,
meta wojny pary (ta sama wojna), pokój (wejście bez zdobycia, oblężenie kończy się), bez wyłomu (brak haka), wygrana
obrońcy. E2E przez most: zdobycie stolicy z sukcesją, eliminacja z akumulatorem zdobyczy > 0, niezależność od podziału
`StepSiegeBattle` (16 ms / 7.5+33+160 ms / Skip = ten sam stan i wynik), determinizm, round trip JSON.

## 6. Długi

- ZMA-DL-1 `onCityCapturedReligion` bez portu: `stores.religion_by_city` nie zmienia się przy zdobyciu (pin miesza religię).
  Osobny temat (wymaga `civKeyForOwnerId`, okręgów kultury, religii cywilizacji).
- ZMA-DL-2 Zapis/odczyt `captured_from_owner_by_city` w `save_load` (poza allowlistą) — NIE_ZMIERZONO, czy pin zapisuje
  `capturedFromOwnerId` (pole obiektu miasta).
- ZMA-DL-3 `WarTurnState::clear_eliminated_owner_war_state` dzieli klucz `diplomacyPairMeta` po `_`, a stan zapisuje
  `min-max` — eliminacja poza tym tematem nie czyści meta par (tu obejście adapterem D-ZMA-8).
- ZMA-DL-4 Pola P1/P9 bez miejsca w stanie (lista `notApplied`, §4): kronika, Prawo/rebelia, `foundedBy*`, `startCityState`,
  udział kultury, kolejka produkcji, garnizon, magazyn zdarzeń zdobycia, pula nauki, Spichlerz, zjednoczenie miast-państw.
- ZMA-DL-5 AI↔AI `maybeResolveRegularWarOnCityCapture` z auto-pokojem (D-ZMA-7) — przy szturmie AI (W8).
- ZMA-DL-6 Wartość mocy ofiary w eliminacji nie jest sprawdzana wektorem pinu (producenci mocy mają własne wektory POWER-*);
  test mostu sprawdza tylko, że akumulator zdobyczy rośnie.
- ZMA-DL-7 `eliminate_owner` usuwa jednostki ofiary z `units`, ale nie z `economy.units` (istniejące zachowanie modułu).
- Dysk: target tematu w scratchpadzie do usunięcia po bramkach (robi Operator na końcu).

## 7. Następny krok

Evaluator (runda 1): weryfikacja wektorów (regeneracja generatora, SHA/MD5), mutanty, kompletność tabeli W1–W14 i `PIN_STEPS`.
