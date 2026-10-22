Rozmiar = suma LOC niepuste plików web, których **punkt główny** (pierwszy punkt przed `-` w `mapping-manual.tsv`) należy do zakresu tematu. Progi: S < 300, M 300–999, L 1000–1999, XL ≥ 2000 LOC web. Tematy bez plików web (P6-22 replay, P6-23, P6-24) nie mają rozmiaru web.

| ID tematu | punkty | pliki web | LOC web (suma) | rozmiar | allowlista Rust | zależności | równoległość |
|---|---|---|---|---|---|---|---|
| R-RUSTPORT-P6-1-STAN-STARTOWY | P6.1 | 16 | 3291 | XL | domain/playable.rs, domain/player.rs, domain/unit_epoch.rs, domain/state.rs, tests/p6_1_stan_startowy.rs (nowy) | P5 zamknięte | start |
| R-RUSTPORT-P6-2-KOMENDY | P6.2 | 1 | 528 | M | domain/types.rs, domain/session.rs, tests/p6_2_komendy.rs (nowy) | P6.1 | po P6.1 (wspólny types.rs) |
| R-RUSTPORT-P6-3-TEREN | P6.3 | 3 | 720 | M | domain/terrain.rs, domain/improvements.rs, domain/pathfinding.rs, tests/p6_3_teren.rs (nowy) | P6.2 | sekwencyjnie z P6-4 (pathfinding.rs) |
| R-RUSTPORT-P6-4-JEDNOSTKI-RUCH | P6.4 | 4 | 877 | M | domain/pathfinding.rs, domain/recruitment.rs, tests/p6_4_ruch.rs (nowy) | P6.3 | sekwencyjnie z P6-3 i P6-5 |
| R-RUSTPORT-P6-5-JEDNOSTKI-ZYCIE | P6.5 | 5 | 2336 | XL | domain/recruitment.rs, domain/combat.rs (tylko bonusy budynków), tests/p6_5_jednostki.rs (nowy) | P6.4 | sekwencyjnie z P6-4 |
| R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE | P6.6 | 7 | 2790 | XL | domain/state.rs, domain/terrain.rs, tests/p6_6_miasta.rs (nowy) | P6.5 | po P6-5 (state.rs) |
| R-RUSTPORT-P6-7-MIASTA-WZROST | P6.7 | 8 | 2644 | XL | domain/city_growth.rs, domain/building_costs.rs, tests/p6_7_wzrost.rs (nowy) | P6.6 | sekwencyjnie z P6-6 |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | P6.8 | 18 | 9306 | XL | domain/resource_production.rs, domain/turn_economy.rs, domain/improvements.rs, tests/p6_8_ekonomia.rs (nowy) | P6.7 | sekwencyjnie z P6-7; XL: podział 8a produkcja / 8b utrzymanie / 8c okolica |
| R-RUSTPORT-P6-9-TURA | P6.9, P6.10 | 4 | 3079 | XL | domain/turn_economy.rs, domain/events.rs, tests/p6_9_tura.rs (nowy) | P6.8 | po P6-8 (turn_economy.rs) |
| R-RUSTPORT-P6-11-AI | P6.11 | 17 | 7413 | XL | domain/ai_turn.rs, domain/power.rs (nowy), data/derived.rs, tests/p6_11_ai.rs (nowy) | P6.9 | 11a–11c sekwencyjnie (ai_turn.rs) |
| R-RUSTPORT-P6-12-AI-WOJNY | P6.12 | 8 | 1951 | L | domain/forced_war.rs (nowy), domain/ai_turn.rs (tylko wywołanie), tests/p6_12_wojny.rs (nowy) | P6.11 (wspólny ai_turn.rs) | równolegle z P6-13/P6-16/P6-17 (rozłączne allowlisty, patrz §6b-i) |
| R-RUSTPORT-P6-13-WALKA | P6.13 | 16 | 4755 | XL | domain/combat.rs, data/units_combat.rs, tests/p6_13_walka.rs (nowy) | P6.4, P6.9 | równolegle z P6-12/P6-16/P6-17 (rozłączne allowlisty) |
| R-RUSTPORT-P6-14-DYPLOMACJA | P6.14 | 26 | 10966 | XL | domain/diplomacy.rs, tests/p6_14_dyplomacja.rs (nowy); podział 14a propozycje/traktaty, 14b bilans AI, 14c katalog wartości | P6.9 | 14a–14c sekwencyjnie (diplomacy.rs) |
| R-RUSTPORT-P6-15-HANDEL | P6.15 | 9 | 2752 | XL | domain/trade.rs, tests/p6_15_handel.rs (nowy) | P6.14 | po P6-14 |
| R-RUSTPORT-P6-16-KULTURA-RELIGIA | P6.16 | 1 | 1365 | L | domain/culture.rs (nowy), domain/turn_economy.rs (tylko pole culture), tests/p6_16_kultura.rs (nowy) | P6.9 | równolegle z P6-12/P6-13/P6-17 (turn_economy.rs po P6-9) |
| R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA | P6.17 | 9 | 1617 | L | data/buildings_tech.rs, domain/improvements.rs (po P6-8), tests/p6_17_tech.rs (nowy) | P6.8 | równolegle z P6-12/P6-13/P6-16 (improvements.rs po P6-8) |
| R-RUSTPORT-P6-18-BARBARZYNCY-PANSTWA | P6.18 | 6 | 3307 | XL | domain/barbarians.rs, tests/p6_18_barbarzyncy.rs (nowy) | P6.13 | po P6-13 |
| R-RUSTPORT-P6-19-ZWYCIESTWO | P6.19 | 1 | 210 | S | domain/events.rs, domain/victory.rs (nowy), tests/p6_19_zwyciestwo.rs (nowy) | P6.9, P6.14, P6.17 | po P6-17 |
| R-RUSTPORT-P6-20-SAVE | P6.20 | 3 | 1852 | L | domain/save_load.rs, tests/p6_20_zapis.rs (nowy) | P6.1–P6.19 | po domknięciu stanu |
| R-RUSTPORT-P6-21-LOAD | P6.21 | 1 | 55 | S | domain/save_load.rs, tests/p6_21_wczytanie.rs (nowy) | P6.20 | sekwencyjnie z P6-20 |
| R-RUSTPORT-P6-22-REPLAY | P6.22 | 0 | 0 | n/d (bez plików web) | domain/replay.rs, tests/p6_22_replay.rs (nowy) | P6.20 | po P6-20 |
| R-RUSTPORT-P6-23-TESTY (REGUŁA, nie równoległy temat) | P6.23 | 0 | 0 | n/d (bez plików web) | brak wspólnych plików tests/ (tests/p6_* są per temat) | każdy temat | wewnątrz każdego tematu; autotests Cargo domyślne, każdy plik tests/*.rs to osobny crate, brak [[test]] w Cargo.toml |
