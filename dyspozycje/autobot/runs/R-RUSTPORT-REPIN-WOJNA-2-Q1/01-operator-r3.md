# R-RUSTPORT-REPIN-WOJNA-2-Q1 - Operator-impl, raport

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-2-Q1
GOAL: REPIN-WOJNA-2 (pin `dc8a3adc`), zakres rundy 3 z dispatchu: (1) `planned-march.ts` `generalTargetId` w `PlannedMarchDest` + save/load; (2) integracja battle-mode z zapisem (logika, nie UI); (3) wektory z uruchomionego weba, mutacje, niezalezny weryfikator; domkniecie NaN z R2.
Uwaga: dispatch ma naglowek `RUNDA: 3/5`, a polecenie orkiestratora mowi `Runda 1/5`. Przyjeto zakres rundy 3 z dispatchu (U1-U4 byly juz zintegrowane na `parity-v2`); polecenie wskazywalo `01-operator-r1.md`, ale ten plik istnieje (raport poprzedniej rundy); nie nadpisano go, raport zapisano jako `01-operator-r3.md`.

ZMIANY/COMMIT:
- baza: `rust-port/parity-v2` @ `9e56f6e3c` (detached)
- `9fa90f04a` port planned-march `generalTargetId` (pathfinding.rs, testy p6_4_march, nowy test r3, wektory, generator)
- `3496f1c37` battle-mode logika z zapisem (`restored_setting_version`, `player_battle_automatic_only`) + nearest_living_general z V8-kompatybilnym sortowaniem (domkniecie NaN z R2)
- commit dokumentu (dossier `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-2.md` §Runda 3, ten raport, logi, `verify-r3.py`): SHA w `git log -1` tej galezi
- pliki w allowliscie: `rust-port/engine/src/domain/{pathfinding,battle_mode,generals}.rs`, `tests/p6_4_march.rs` (dopisek pola, bez zmiany asercji), `tests/p6_repin_wojna_2_r3_*`, katalog runu, dossier. Poza allowlista: nic. `gra/**`, `renderer`, `src-tauri`, `Cargo.toml`, `WERSJE.md` nietkniete. `Cargo.lock` pozostaje nieSledzony (nie commitowany).

TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (`fmt-r3b.log`)
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`clippy-r3b.log`); w trakcie poprawiono lint `needless_range_loop` w `v8_sort_small`
- `cargo test --no-fail-fast`: 1591 passed / 0 failed, 220 binarek, EXIT=0 (`test-r3.log`). Baseline 1313 z dispatchu jest nieaktualny; pomiar przed R3 NIE_ZMIERZONO.
- nowe testy: `p6_repin_wojna_2_r3_planned_march` (3), `p6_repin_wojna_2_r3_battle_mode` (3), `p6_repin_wojna_2_r3_nearest_nan` (1); istniejace `p6_4_march` (6), `p6_repin_wojna_2_generals` (13), `p6_repin_wojna_2_battle_mode` (3) zielone.
- mutanty (wszystkie zabite): PM1 (usuniety wyjatek `generalTargetId` od odrzucenia zgodnej pozycji), PM2 (niepusty filtr przy zapisie), BM1 (bez `isMe`), NM1 (bez odwrocenia runu w sortowaniu). Logi `mut-pm1.log`, `mut-pm2.log`, `mut-bm1.log`, `mut-nm1.log`, `mut-nm1b.log`.
- weryfikator niezalezny `verify-r3.py` (`python3 -I`, od zera z TS): 0 rozbieznosci (planned-march 900 + 300 przypadkow, battle-mode 126 wierszy, nearest 400 przypadkow z symulacja TimSort). Log `verify-r3.log`.
- wektory z uruchomionego weba dc8a3adc: `planned-march-general.json` (349 kB), `battle-mode-restore.json` (10 kB), `nearest-nan.json` (103 kB); wszystkie < 10 MB.

Znalezisko podczas pracy: rozbieznosc `nearest_living_general` przy NaN wspolrzednej kandydata byla REALNA (przypadek 25 wektorow: web wybiera `c`, Rust linear-min wybieral `b`). Naprawiono przez odtworzenie kolejnosci wywolan komparatora V8 TimSort dla n < 64. Stary zarzut R2 (NIE_ZMIERZONO) jest zamkniety w zakresie n < 64.

BLOKADY:
- `meta.battleModeSettingVersion` w zapisie: pole nie istnieje w `save_load.rs` (SaveSnapshot v2 = `version`, `state`, `event_queue`, `rng`). Dodanie jest zmiana formatu zapisu; nie wykonano. Logika (normalizacja przy wczytaniu i `playerBattleAutomaticOnly`) jest gotowa jako czyste funkcje.
- Nie blokuje: brak.

RUNDY: 3/5 wg dispatchu (zamkniete w tej rundzie: zakres 1-3; otwarte: meta zapisu). Ostatni werdykt: brak (pierwsze wykonanie tej rundy).

ZALOZENIA (zapisane w dossier):
- Z-R3-1: sortowanie V8 dla n < 64 bez scalania; rostery generalow gracza < 64 (NIE_ZMIERZONO w grze). Dla n >= 64 i niespojnego komparatora wynik moze sie roznic.
- Z-R3-2: `isMe` jako parametr `bool`; sposob wyznaczenia po stronie gry poza zakresem.
- Z-R3-3: `battleAlwaysManual` jako `Option<bool>`, tylko jawne `false` aktywuje tryb.

NASTEPNY KROK: osobna partia (nowy krok w tym samym ID, po decyzji o formacie) - pole `meta.battleModeSettingVersion` w `save_load.rs` (zapis `_battleModeSettingVersion` przy save, normalizacja przy load wg `main.ts:40819-40821`) oraz wpiecie `player_battle_automatic_only` w miejsce wywolan silnika (poza zakresem logiki). Po tym temat do zamkniecia.

DEPLOY/PUSH: NIE WYKONANO
