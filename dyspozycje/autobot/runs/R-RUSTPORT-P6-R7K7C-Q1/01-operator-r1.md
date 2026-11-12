STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-Q1
GOAL: efekty umow dyplomatycznych na skarbce i pule Pracy w PlayableState (K7-C) + producent skarbca AI / puli Pracy; wektory z pinu 07d2fbd72 (D3 - NIE_ZMIERZONO, patrz BLOKADY)
ZMIANY/COMMIT: baza 82bb87fb1 (detached, wg dispatchu). Allowlista: `rust-port/engine/src/domain/playable.rs` (pola `PlayableReplaceEconomy.ai_treasury_by_owner` i `praca_pool_by_owner` z `#[serde(default, skip_serializing_if)]`, wariant `PlayableError::EconomyOwnerIsHuman`, settery `set_owner_treasury` / `set_owner_praca_pool`), `src/domain/turn_war_dipl_steps.rs` (czysta funkcja `apply_dipl_deltas_to_state`, atomowa), `src/domain/turn_war_inputs.rs` (producent w `dipl_steps_inputs`: skarbce AI i pule Pracy z `economy`), nowe `tests/p6_r7k7c_owner_pools.rs`, `tests/p6_r7k7c_gen.mjs`, `tests/p6_r7k7c_vectors/payments.json`. Brak zmian w gra/, WERSJE.md, Cargo.toml, Cargo.lock (plik wygenerowany przez build usuniety, nie w commicie), origin/main, rust-port/parity-v2. SHA commitu: w odpowiedzi operatora (`git log -1` na gałęzi wip; commit zawiera ten raport, wiec SHA nie moze byc wpisany tutaj).
TESTY: patrz sekcja "Bramki" nizej.
BLOKADY: (1) NIE PODPIETE pod tur: `apply_dipl_deltas_to_state` istnieje jako funkcja, ale NIKT jej nie wola w ruchu tury (advance_turn w `playable.rs` poza zakresem allowlisty dla wywolania). Przyrosty skarbcow/pul z `DiplStepsReport.treasury_deltas` / `praca_deltas` nie zapisuja sie do PlayableState miedzy turami. (2) Wektory pinu dla D3 `tickCyclicResourceTradeDeals` (main.ts:24077) - NIE_ZMIERZONO: funkcja jest domknieciem w `main.ts`, zalezy od co najmniej `activeDeals`, `buildDiploTreasury`, `ownerResourceStock`, `applyCyclicDeliveryOutcome`, `diplomacyNormalizeSurowiecIlosc`, `isDiploTickWarBrakeEnabled`; bez stubowania ~tuzina domkniec i przerobki pinu nie da sie jej wykonac. Pokrycie D3 zostaje: testy behawioralne 3 tur w `p6_wire_war_dipl_steps.rs`. (3) Pelny `cargo test --no-fail-fast` NIE uruchomiony (NIE_ZMIERZONO; disk, patrz nizej). (4) Brak wektorow pinu dla `applyOneShotGoldTransfer` / basketu jednorazowego (main.ts ~12548-12589, 12700): poza D1-D7, nie wpiete. (5) Skarbce AI i pule Pracy NIE rosna miedzy turami (brak fazy Economy w Rust, jak zapasy miast w KNOWN_GAPS[2]) - producent zwraca to, co wpisano; puste mapy = producent nieobecny (blad przy uzyciu), nie zero.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (decyzja orkiestratora: czy wpiac `apply_dipl_deltas_to_state` w advance_turn w kolejnym temacie; wymaga zmiany poza allowlista)
DEPLOY/PUSH: NIE WYKONANO

## Pomiar na pinie (07d2fbd72, tylko odczyt)

Efekty umow zmieniajace skarbce i zapasy miast:

| Efekt | Pin | Stan w Rust przed zmiana | Stan po zmianie |
|---|---|---|---|
| Danina: przelew skarbca platnik -> odbiorca co tura | `tickDiplomacyPayments` diplomacy-economy.ts:78; `activeDealsToPaymentDeals` :52 | `tick_diplomacy_payments` (Treasury trait), skarbiec gracza z `economy.treasury`, AI BRAK producenta | AI z `ai_treasury_by_owner` |
| Zerwanie danin (`trybut_odmowa`) | `tributeBreakPairsFromDeals` diplomacy-economy.ts:125, main.ts:24275-24298 | `tribute_break_pairs` | bez zmiany |
| Handel cykliczny D3: przelew surowca miedzy miastami | `tickCyclicResourceTradeDeals` main.ts:24077 (ownerResourceStock, applyCyclicDeliveryOutcome) | `tick_cyclic_resource_trade_deals`, zapasy z `economy.city_stock` | bez zmiany (zapasy juz byly w stanie) |
| Zlota i Praca przy zawarciu umowy (koszyk) | main.ts ~12548-12589 (applyOneShotGoldTransfer, diplomacyPnPraca), ~12700-12701 | poza D1-D7 | nie ruszane |

Konsument skarbca AI i puli Pracy w `computeObjectivePower` (wynik: BRAK KONSUMENTA):
- `gra/src/game/power-objective.ts` `computeObjectivePower` czyta wylacznie: jednostki, wygraneBitwy/bitwyPktSum, sumaLudkow, rekrutEkw, miasta, heksyTerytorium, budynki, techZbadane, ulepszeniaTerenu, kulturaImperium, miastaJednoscReligii, zdobyczePower. Brak pola skarbca i puli Pracy w `EmpirePowerRaw`.
- `gra/data/power-params.json`: brak skladnika skarbca / Pracy (klucze skladnikow: armia, bitwy, ludki, rekruci, miasta, terytorium, infra, tech, ulepszenia, kultura, religia, zdobycze).
- Wniosek: w `power_raw_for_owner` nie ma czego podlaczac. Zaden skladnik mocy nie jest ExplicitZero/Missing z powodu braku skarbca lub puli Pracy. Krok (3) w wersji "podlaczyc producenta do power_raw_for_owner" jest N/A. Producent skarbca AI i puli Pracy jest podlaczony wylacznie do wejsc kroku dyplomacji (`DiplStepsInputs`).

## Stan Rust przed zmiana (zmierzony w kodzie)

- `PlayableState.economy` (`PlayableReplaceEconomy`): `treasury` (tylko gracz ludzki), `city_stock` (zapasy miast), `units`. BRAK: skarbcow AI, puli Pracy.
- `dipl_steps_inputs` (turn_war_inputs.rs): wstawial skarbiec gracza ludzkiego i zapasy miast; `treasury` AI i `praca_pool` puste.
- Skutek: danina z platnikiem AI, albo krok wymagajacy puli Pracy, konczyl sie `WarTurnError::DiplStep` (STRICT, brak cichego zera). Po zmianie: brak wpisu nadal daje blad, wpis z `economy` jest uzywany.

## Zmiany (kod)

1. `playable.rs`: `PlayableReplaceEconomy` + `ai_treasury_by_owner: BTreeMap<u64, f64>`, `praca_pool_by_owner: BTreeMap<u64, f64>` (`#[serde(default, skip_serializing_if = "BTreeMap::is_empty")]`). Zapis bez nowych pol jest bajt w bajt taki sam (test `default_economy_serializes_without_owner_pool_keys`). `PlayableError::EconomyOwnerIsHuman(u64)`. `PlayableGame::set_owner_treasury` (odrzuca NaN/Inf i gracza ludzkiego), `set_owner_praca_pool` (odrzuca NaN/Inf).
2. `turn_war_dipl_steps.rs`: `apply_dipl_deltas_to_state(state, treasury_deltas, praca_deltas) -> Result<(), WarTurnError>`. Liczy i waliduje wszystkie nowe wartosci przed zapisem; brak producenta wlasciciela lub NaN/Inf = blad i zero zmian (test atomowosci). Gracz ludzki -> `economy.treasury`, pozostali -> `ai_treasury_by_owner`.
3. `turn_war_inputs.rs` `dipl_steps_inputs`: dokleja skarbce AI (`entry().or_insert`, gracz ludzki nie jest nadpisywany) i pule Pracy z `economy`.

## Wektory z pinu

- `tests/p6_r7k7c_gen.mjs` (generator, straznik SHA-256 `gra/src/game/diplomacy-economy.ts` = 3e0c7867...), wykonuje kod pinu przez esbuild. PRNG mulberry32, ziarno 20261112.
- `tests/p6_r7k7c_vectors/payments.json`: 203 przypadki (200 losowych + 3 brzegowe: pusty zestaw, wygasanie w turze, ujemna kwota). Kazdy przypadek: `activeDealsToPaymentDeals`, `tickDiplomacyPayments` (paid/broken/messages/saldo), `tributeBreakPairsFromDeals`.
- Test `payment_vectors_from_pin_match_rust` (w `p6_r7k7c_owner_pools.rs`): asercja `>= 150` przypadkow, porownanie pole po polu. Wynik: PASS (203/203).
- D3: BRAK wektorow z pinu (BLOKADA 2).

## Testy i bramki

- `cargo fmt --check` (rust-port/engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (2m51s).
- `cargo test --lib`: 94 passed, 0 failed.
- `cargo test --test p6_r7k7c_owner_pools`: 9 passed, 0 failed (w tym 203 wektory payments, compat serde, settery, producent, apply atomowy, NaN).
- `cargo test --test p6_wire_war_dipl_steps`: 8 passed (zmieniony modul).
- `cargo test --test p6_wire_war_inputs`: 16 passed (zmieniony producent).
- `cargo test --test p6_wire_war_stores`: 7 passed.
- Srodowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), usuniety po bramkach.
- `git diff --check`: EXIT 0.
- Pelny `cargo test --no-fail-fast`: NIE_ZMIERZONO.

## Disk

- Start: df 8.6 GB wolne (bramka >= 8 GB spelniona na starcie).
- Po `cargo clippy --all-targets` spadlo do 3.0 GB, po testach do 2.4 GB. Dispatch zakazuje dalszych ciezkich buildow przy < 2 GB. Pelny `cargo test` NIE uruchomiony z tego powodu.
- Nie usuwalem cudzych katalogow w scratchpadzie (`target-u1` 2.5 GB, `pin-rest` 830 MB, `target-k5loop` 326 MB) - to nie sa dane tego operatora. Zwolnilem wlasny `target-r7k7c`.
- Orkiestrator: sprzatanie dysku przed kolejna runda Rust.

## Dlug i zalecenia dla kolejnej rundy (nie robione tutaj)

- Wpiac `apply_dipl_deltas_to_state` w krok tury (advance_turn w `playable.rs`) po `run_war_turn`, z wejsciem `report.treasury_deltas` / `praca_deltas`. Wymaga rozszerzenia allowlisty o wywolanie w playable.rs. To jest prawdziwa luka: bez tego efekty umow nie zapisuja sie miedzy turami.
- Wektory D3 z pinu: wymagaja wyciecia closure `tickCyclicResourceTradeDeals` do modulu testowego (przerobka pinu poza zakresem tego tematu) - decyzja orkiestratora.
- Kroki poza D1-D7 (koszyk jednorazowy, zlota i Praca przy zawarciu): osobny temat.
