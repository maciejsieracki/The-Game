STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1
GOAL: port 1:1 runCapitalCapturePlunder z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75 jako czyste funkcje w siege_capital_plunder.rs, z wektorami z pinu (wykonanie TS w node); zaleznosci spoza zakresu jako jawne wejscia/trait; wpis TRANSFER_EFFECTS BRAK -> Ported; komentarz siege_surrender.rs:37-38 poprawiony.
ZMIANY/COMMIT: gałąź lokalna rust-port-wip/SIEGE-TRANSFER-Q6-Q1, commit 738eec5ad (kod + wektory). Raport w osobnym commicie na tej samej gałęzi (SHA: patrz komentarz orkiestratora / `git log -1`). Nie pushowano. Baza: 70d7a231d (detached, z dispatchu).
  Allowlista (zachowana):
  - rust-port/engine/src/domain/siege_capital_plunder.rs (nowy, 724 linii): rdzen capital-capture.ts + glue runCapitalCapturePlunder + trait OwnerResourceAccess / PlunderLabels;
  - rust-port/engine/src/domain/mod.rs (rejestracja modulu, kolejnosc alfabetyczna);
  - rust-port/engine/src/domain/siege_transfer.rs (wpis runCapitalCapturePlunder -> Ported + komentarz);
  - rust-port/engine/src/domain/siege_surrender.rs (tylko tabela komentarza: noteCityCapture -> ISTNIEJE Q5, runCapitalCapturePlunder -> PORT);
  - rust-port/engine/tests/p6_siege_capital_plunder.rs (nowy, asercje wektorow);
  - rust-port/engine/tests/p6_siege_capital_plunder_gen.mjs (nowy, generator: wycina funkcje z pinu i wykonuje w node);
  - rust-port/engine/tests/p6_siege_capital_plunder_vectors/vectors.json (nowy; md5 17ad54d949aac84d5aa3432b17c2dec8);
  - rust-port/engine/tests/p6_siege_transfer.rs (TYLKO lista Missing: usunieto runCapitalCapturePlunder; reszta asercji bez zmian).
  Poza allowlista NIC nie zmieniono. Brak zmian w gra/, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (plik wygenerowany przez cargo usuniety przed commitem).
TESTY:
  - pin: odczyt wylacznie przez `git show 07d2fbd72...:gra/...` (poza repo: scratchpad). Zrodla: capital-capture.ts, main.ts (runCapitalCapturePlunder, linie 35558-35700), barbarians.ts (BARBARIAN_OWNER_ID, isBarbarian), society-breakdown.ts (REBEL_FACTION_OWNER_ID = -99).
  - generator: `node tests/p6_siege_capital_plunder_gen.mjs <4 pliki pin> > tests/p6_siege_capital_plunder_vectors/vectors.json` -> 123 przypadki (30 recznych h01-h33 + 90 losowych, ziarno staloe). Pokrycie galezi: rebelia (old -99) 15; brak stolicy / barbarzynca-ofiara / brak zdarzenia 43; przejecie stolicy 24; eliminacja 38 (w tym zwrot dla gracza 10); triumf 3; barbarzynca jako zdobywca 26; barbarzynca jako ofiara 9; stolica wskazana (designated) 38 / fallback najstarsze 82.
  - cargo fmt --check: OK (0 roznic).
  - cargo clippy --all-targets -- -D warnings: OK (exit 0).
  - cargo test --lib: 48 passed, 0 failed.
  - cargo test --test p6_siege_capital_plunder: 2 passed (city_found_order_matches_pin; run_capital_capture_plunder_matches_pin_vectors - asercje: zwrot, mapa stolic, zdobycze Power, spektakl, slot raportu, stan ekonomii, kolejnosc i argumenty wolan UI; osobno czysta sciezka applyBarbarianAware...: wynik zdarzenia i stan ekonomii).
  - Gate Q3-Q5 (bez zmian asercji poza lista Missing): p6_siege_transfer 2 passed; p6_siege_transfer_effects 4 passed; p6_siege_transfer_effects_q4 12 passed; p6_siege_transfer_prod 5 passed; p6_siege_transfer_q5 6 passed; p6_siege_surrender 10 passed.
  - git diff --check: OK.
  - df /: 16 GB wolne przed startem gate'ow (wymog >= 8 GB spelniony).
  - Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (scratchpad/target-q6, usuniety po bramkach).
BLOKADY:
  1. ROZBIEZNOSC BAZY (wymaga decyzji orkiestratora przed integracja). Zlecenie wskazuje origin/rust-port/parity-v2 (f207ea6b1 lub nowszy); dispatch wskazuje 70d7a231d (FC Q5). Gałęzie sa rozbiezne: 70d7a231d NIE jest przodkiem parity-v2 (parity-v2 ma 42 commity spoza 70d7a231d, 70d7a231d ma 10 spoza parity-v2). parity-v2 NIE zawiera rust-port/engine/src/domain/siege_transfer_q5.rs ani tests/p6_siege_transfer_q5*, a kryterium (3) wymaga tych asercji. Pracowano na bazie z dispatchu (70d7a231d). Jesli integracja ma byc na parity-v2, port trzeba przeniesc i sprawdzic ponownie (siege_transfer.rs / TRANSFER_EFFECTS / testy Q5 roznia sie miedzy bazami).
  2. Granice UI (jawne, nie stuby po cichu): tekst linii raportu (captureReportOneLine), spektakl (buildSpectacleForElimination), etykiety (civLabelForOwner, mocLabel, civDisplayNameForOwner, civKeyForOwnerId) sa dostarczane przez trait PlunderLabels; ich tresc nie jest portowana i NIE_ZMIERZONO wzgledem pinu (w wektorach to deterministyczne atrapy: `civ<N>`, `Moc`, `OL:<kind>`, `spec:<label>`). Porownywany jest kontrakt wolan (kolejnosc, nazwa, argumenty), nie ich tekst.
  3. Efekty uboczne nie wykonane tutaj: eliminateOwner, markCityStateDirty, showHintMessage, recordCityCaptureEvent, recordCivElimEvent, showTriumphCityStateNotice - zapisywane w ui_calls z argumentami, wykonanie po stronie wolajacego. recordCityCaptureEvent (store zdarzen miasta) pozostaje BRAK w TRANSFER_EFFECTS (test Missing-list go zawiera).
  4. Wejscia z zewnatrz: lost_power (buildObjectivePowerForOwner(oldOwner).power) i triumph (shouldShowPlayerTriumphCityStateUnification) - wolajacy podaje wartosci; ich porty leza poza tym tematem.
  5. buildCityCaptureReportRows - w Rust budowany jako obiekt argumentow (kind + pola) zgodnie z pinem; NIE jest to osobny modul raportu.
  6. Zalozenia (do akceptacji): Z-PL-1 cityFoundOrder zwraca f64 (INFINITY dla niepasujacego id); Z-PL-2 js_max0 propaguje NaN (w wektorach brak NaN); Z-PL-3 designated = capitalCityIdByOwner.get(old) ?? undefined liczone w run_capital_capture_plunder.
RUNDY: 1/5 (Operator, runda 1). Ostatni werdykt: brak (Operator).
NASTĘPNY KROK: Evaluator r1 (Sonnet) na commicie 738eec5ad, z rozstrzygnieciem blokady 1 (baza) przez orkiestratora przed Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push; integracja i push nie sa zadaniem Operatora).
