STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1
GOAL: Dac `run_city_economy_resource_phase` produkcyjnego wolajacego z `advanceCityEconomy` (web pin `4bbef081d`, `turn-economy.ts:2250-2913`): tabela plastrow + port plastrow, ktorych zaleznosci sa na `parity-v2`, reszta jako jawny dlug.

ZMIANY/COMMIT: praca `c836d99c2` (baza `e0c0a9ac5`, detached; commit raportu = HEAD tego brancha `worktree-wf_5dee3e19-131-1`). Nowe: `domain/turn_economy_advance.rs`, `tests/p6_adv_city_econ_pipeline.rs`, `tests/p6_adv_city_econ_vectors/advance.json` (1.8 MB, odtwarzalny bajt w bajt z `git archive 4bbef081d`), `dyspozycje/rust-port/p6/P6-ADVANCE-CITY-ECONOMY.md` (tabela plastrow P0-P24, dlug -Q2a..-Q5, mutacje), generator/weryfikator/mutate, logi `gate-*.txt`. Poza nowymi plikami: `domain/mod.rs` (1 linia `pub mod`), `turn_economy_resources.rs` (`fn` -> `pub(crate) fn` dla `runtime_active_built_ids_for_city`; w allowliscie). `Cargo.lock` niecommitowany. Zero zmian w `gra/`, `Cargo.toml`, `turn_economy.rs`.

ZAPORTOWANE (S1-S8): `owners_with_mennica`, przepustowosci i bonusy, liczniki Stolarni/Kamieniarni/Magazynow, `owner_resource_cap_for`, faza zasobow wolana z `advance_city_economy_resources(&mut [state::City], ..)`, widok Spichlerza/Garncarni per miasto, drenaz Mennicy, reconcile capow. Wejscia terenowe (`computeTerritoryResourceYieldByCity`, `computeWorkedMagazynYieldsByCity` - brak w Rust) jako PARAMETRY (ZALOZENIE + dlug -Q2a). Petla plonow miast nie zapisuje `City.surowce` (`:2482`, `:2823`, `:2832` jedyne zapisy), wiec kolejnosc efektow na `surowce` jest zachowana. Wiazanie z `ai_turn`/`turn_economy.rs`: NIE wykonane (ZALOZENIE + dlug; NIE_ZMIERZONO integracja).

TESTY: wektory z URUCHOMIONEGO prawdziwego `advanceCityEconomy` (519 scen.: 230 plain, 250 full, 39 brzegowych N-1/N/N+1 dla progu Mennicy `<1` i capu; 360 `thrCases`, 18 `happyCases`) - test Rust 4/4, porownanie bitowe `City.surowce`, pol `CityEconomyTick`, wartosci posrednich zrzuconych z weba. Weryfikator `python3 -I`: 0 rozbieznosci (cap/Magazyny/Mennice/bonusy/przepustowosci wszystkie scen.; sumy per owner klasy plain; liczniki Stolarni/Kamieniarni bez resolvera); niezaleznie NIE liczone: rozdzial puli po miastach, klasa full, liczniki z resolverem etykiet. Mutacje: 40, zabite 37, 3 rownowazne z dowodem plik:linia (M21, M26, M38; 100% nierownowaznych, 92.5% brutto). Luki FC zamkniete: wektor `converter_throughputs_for_era`, `ceramika_happiness_bonus(0)` z weba. Bramki PO ostatniej zmianie kodu: fmt/clippy `-D warnings --all-targets`/`git diff --check` EXIT=0; pelny `cargo test -j 2` lib 22 + s0-s4 = 2033 passed / 0 failed (baza dispatchu 2027/0; +6 = 4 nowe + 2 z obrony `8510b112a`; bezposredni PRZED NIE_ZMIERZONO).

BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator R1 (mapowanie plastrow P0-P24, zakres vs ZALOZENIE o petli, rownowaznosc M21/M26/M38).
DEPLOY/PUSH: NIE WYKONANO
