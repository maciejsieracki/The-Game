STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-R7K7-Q1
GOAL: wpiecie krokow dyplomacji D1-D7 pinu w faze Diplomacy `run_war_turn` (kolejnosc faz bez zmian)
ZMIANY/COMMIT: baza db1e75378; nowy modul `rust-port/engine/src/domain/turn_war_dipl_steps.rs`; zmiany w `turn_war_pipeline.rs` (krok 3b, `WarTurnInputs.dipl`, `WarTurnReport.dipl`, `WarTurnError::DiplStep`), `turn_war_inputs.rs` (producent `dipl_steps_inputs`), `diplomacy.rs` (tylko pole `ActiveDeal.cyclic_ever_failed`, serde default + skip), `mod.rs` (rejestracja); testy `tests/p6_wire_war_dipl_steps.rs`, `tests/p6_wire_war_dipl_steps_gen.mjs`, `tests/p6_wire_war_dipl_steps_vectors/vectors.json`. Cargo.lock NIE w commicie. SHA commitu: w odpowiedzi Operatora (commit zawiera ten raport, wiec SHA nie moze byc wpisany w ten plik).
TESTY: wyniki i EXIT w sekcji Bramki na koncu.
BLOKADY: brak blokad; jawne BRAKI D2(rejestr)/D4/P7 nizej.
RUNDY: 1/5 (zadanie wskazywalo nazwe `01-operator-r4.md`; ta sama runda 1 zapisana pod obiema nazwami)
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## Tabela krok -> funkcja -> status wpiecia

Kolejnosc wewnatrz fazy Diplomacy = kolejnosc pinu (`runDiplomacyTurnTick` main.ts:24229): D1, D2, D3, (D4), D5, D6, D7, potem istniejacy tick relacji par i hamulec D8. Kolejnosc FAZ bez zmian (kryterium 3).

| Krok pinu | Funkcja Rust | Status |
|---|---|---|
| D1 `expireTreaties` :24231 | `DiplomacyState::expire_deals` (`wygasaTura > turn`) wolane z `run_dipl_steps` | WPIETE, wektor z pinu (`expire`) |
| D2 finisz wiarygodnosci wygaslych traktatow :24233-24270 | `finish_requests` -> `DiplStepsReport.credibility_requests`, `barbarian_grace` | WPIETE jako ZLECENIA w raporcie. BRAK: rejestr wiarygodnosci (`appendCredibilityEvent`) nie ma portu Rust (grep `append_credibility`, `credibility_event` w `engine/src`: tylko `TruceDiplomacy.credibility_events`), wiec zlecenia nie sa nigdzie zapisywane, karencja `recordBarbarianCooperationGrace` tez nie. Przyczyna: osobny duzy temat (model rejestru zdarzen/strumieni), nie klocek K7. Wartosci z `diplomacy.json` (P1/P2/P3). |
| D3 `tickCyclicResourceTradeDeals` :24077 | `tick_cyclic_resource_trade_deals` (+ `transfer_quantity_resource`, `normalize_resource_quantity` z diplomacy.rs) | WPIETE, test behawioralny 3 tur + barter atomowy. UWAGA: wskazane w dispatchu `build_cyclic_resource_transfers` (diplomacy.rs:2620) jest BUDOWNICZYM transferow z koszyka przy zawarciu umowy, nie tickiem tury - nie jest wolane w tym kroku (audyt R7 pomylil role). Poza zakresem jawnie: P7 (`applyDiploP7Bonuses`, brak magazynu `diplomacyTradeStreak`; ROZNICA), UI/log zdarzen. Zdarzenia N6 -> zlecenia (jak D2). |
| D4 `updateWiarygodnoscStreamsThisTurn` :24184, `tickWiarygodnoscBezWojnyMilestone` :12058 | brak | BRAK z dowodem: brak rejestru strumieni wiarygodnosci w Rust (jak D2). Nie ma funkcji do wpiecia; port wymaga modelu `CredibilityStreamEntry`. |
| D5 `tickTruceExpiries` :12122 | `truce_end_tick_pair` (wola `truce_expiry_action`) na portach `TruceDiplomacy`; stan z `war.diplomacy` + opaque `diplomacyPairMeta` / `pendingDiplomacyInbox` | WPIETE, test behawioralny (tura 3). Oferta w skrzynce: wpis bez `civName` (etykieta UI nie ma portu). Skutek `declareWarAfterTruce`: tylko relacja (zerwanie traktatow = B2, jak w hamulcu). |
| D6 `tickDiplomacyPayments` + zerwania :24275-24298 | `active_deals_to_payment_deals`, `tick_diplomacy_payments`, `tribute_break_pairs` (port 1:1 diplomacy-economy.ts), `trybut_odmowa` przez `DiplomacyState::apply_event` | WPIETE, wektory z pinu (5 scenariuszy) + 3 tury. Komunikaty HUD nie portowane. |
| D7 dobra wola, galaz z hamulcem | `run_brake_phase` krok 1 (istniejace, `ai_diplomacy_turn.rs:170-183`) | WPIETE wczesniej (nie zmieniane). ROZNICA: licznik w `BrakePhaseState.dobra_remaining`, pin trzyma go w `diplomacyPairMeta.dobraWolaRemainingTur`. |
| D7 galaz bez hamulca `tickDobraWolaOnRelation` | `tick_dobra_wola_on_relation`, wolane gdy `DiplStepsInputs.brake_flag_off` | WPIETE, wektory z pinu (9). Flaga na pinie domyslnie ON (`DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true`, wylaczenie tylko override testowy), wiec produkcyjnie galaz jest nieosiagalna; domyslnie `false` (= ON). |
| D7 `syncRelationFromDeals` :24319 | `sync_relation_from_deals` dla kontaktow | WPIETE (sojusz > NAP, wojna nietknieta), test. |
| D8 | bez zmian | WPIETE wczesniej |
| `applyBorderMarchPenaltiesEndTurn` :24331 | brak | poza zakresem D1-D6, NIE ROZPATRYWANE |

## Wejscia (producenci)

`dipl_steps_inputs(&PlayableState)` w `turn_war_inputs.rs`: skarbiec tylko gracza (`economy.treasury`), zapasy miast z `economy.city_stock`, stolica z `is_capital`, moc armii z tego samego producenta co skladnik `jednostki`. BRAK producentow (skarbiec AI, pula Pracy) => `WarTurnError::DiplStep` z powodem, sprawdzane leniwie (tylko gdy krok korzysta), stan nietkniety (atomowo, test). Pusty stan dyplomacji nie wymaga zadnych wejsc (test).

Efekty poza `WarTurnState` (zapasy miast, skarbce, Praca) NIE sa stosowane do `PlayableState` (playable.rs poza allowlista): raport niesie `city_resources`, `treasury_deltas`, `praca_deltas` (analogicznie do `declarations`). Do zrobienia przez wolajacego w kolejnym klocku.

Znaleziona pulapka: `normalize_resource_quantity` zaokragla w dol do kroku 10 dla czesci surowcow (np. drewno) - self-heal pinu; testy uzywaja krotnosci 10.

## ROZNICA B (wzgledem pinu)

- B-K7-1: D1-D7 w Rust w fazie Diplomacy(2) przed tickiem relacji - zgodnie z pinem wzgledem D8; kolejnosc wzgledem Economy/AI bez zmian (Q1-Q4 otwarte).
- B-K7-2: D2/D4/P7 jak wyzej (zlecenia zamiast zapisu; brak strumieni; brak serii dostaw).
- B-K7-3: lista wlascicieli D5 = gracze + AI + wlasciciele miast (posortowana); pin `[0, ...aiOwnerCivMap.keys()]`.
- B-K7-4: dobra wola z hamulcem: magazyn `BrakePhaseState` zamiast `PairMetaWeb`.

## Zmiany oczekiwan w istniejacych testach

Zadnych. Asercje p6_wire_war_*, p6_brake_*, p6_tickdiplo bez zmian i bez oslabien.

## Wektory z pinu

`tests/p6_wire_war_dipl_steps_gen.mjs` (esbuild bundle zrodel pinu 07d2fbd72, straznik SHA-256 trzech plikow: diplomacy-economy.ts 3e0c7867..., diplomacy-pn-engine.ts ee1b1aab..., diplomacy-treaties.ts 9b8e3bd8...). Wyniki: `payments` (5), `dobra` (9), `expire` (3) w `vectors.json`.

## Bramki

Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo. Baza db1e75378.

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: EXIT 0 (60 passed)
- `cargo test --test p6_wire_war_pipeline --test p6_wire_war_inputs --test p6_wire_war_diplo --test p6_wire_war_epoch --test p6_wire_war_pop --test p6_wire_war_stores --test p6_brake_inputs --test p6_tickdiplo --test p6_wire_war_dipl_steps`: EXIT 0 (nowe: 7 passed)
- pelny `cargo test --no-fail-fast` (nohup, log `/tmp/claude-0/k7full.log`): EXIT=0, 408 binarek, 3006 passed, 0 failed (jeden test `pick_auto_improvements_matches_pinned_web_vectors` trwal > 60 s, nie przerywany)
- df przed startem 13 GB, po 9,8 GB (target poza repo, do usuniecia po zakonczeniu).
