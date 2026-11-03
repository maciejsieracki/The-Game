STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1
GOAL: blok EmpireFood / auto-racje / atrycja miedzy tickiem ekonomii a bankowaniem (`main.ts:34594-34850`, pin `4bbef081d`, baza `40c358d6f`) 1:1, wpiety w `run_economy_tick_for_game`.

ZMIANY/COMMIT: kod+dowody `dfd1c90ae` (WIP: `5932f0b29`, `c75b516bf`, `5a6251bce`); baza `40c358d6f`.
* NOWE: `domain/turn_economy_empirefood.rs` (koszt armii ze Spichlerzem/Sola, `refreshEconomyFoodTotals`, sklejka bloku), `domain/turn_economy_attrition.rs` (atrycja HP, sprzatanie po zniszczonych, czysta czesc N3), `tests/p6_empirefood_e2e.rs` + `p6_empirefood_vectors/empirefood.json` (5,95 MB), doc `dyspozycje/rust-port/p6/P6-ECON-TICK-EMPIREFOOD.md`.
* WIRE addytywnie (+68/-1): `run_economy_tick_for_game_with_food`; `run_economy_tick_for_game` = wrapper z `None` (zachowanie bez zmian). `mod.rs` +2 `pub mod`. Zero zmian w `city_growth/resource_production/building_costs/state`, `gra/**`, `Cargo.toml`, `WERSJE.md`.

TABELA BLOKU (doc sek. 3): 20 pozycji sklasyfikowanych. Rdzen (`advanceEmpireFood`, auto-racje, `maxSafe`, `recompute`, `cityPopulationCap`) JUZ ISTNIAL w `city_growth.rs::p6_7a` (wektory `p6_7a_empire.rs`) - zweryfikowane `git grep`, nie zakladane. Dolozone: pozycje 3,5,6,9,10(petla),13-16,20(kolejnosc). Dlug z dowodem: HUD/UI, reszta N3.

ZNALEZISKO (falsyfikacja przesłanki, doc sek. 2): blok NIE zmienia `population` ani zapasow miast. Zmienia `poziomRacji` (+ pola domyslne racji), pola zywnosci ticku i stany panstwa; populacje zmienia `applyPostCentralPopulationGrowth` PO bankowaniu (`main.ts:36060`). Prawdziwa mutacja `cities` miedzy tickiem a bankiem to N3 `resolveSiegeSurrender` (zmiana `ownerId` miasta, `main.ts:15870+`) - NIE zaportowana (dlug). Zaportowana czysta czesc N3 (atrycja garnizonu).

TESTY:
* `cargo test --test p6_empirefood_e2e` 2/2: 347 scenariuszy z URUCHOMIONEGO weba (1314 tickow, 829 tickow panstwa), bit w bit: tick po bloku, bankowanie, stany, korekty racji, popCap, jednostki, oblezenia, garnizony, N3. Kontrola negatywna 331/331 rozjechanych.
* Weryfikator `verify-p6-empirefood.py` (`python3 -I`): 22 505 sprawdzen, 0 rozbieznosci; kontrole negatywne 2/2.
* Mutacje: 104, zabite 93, zywe 11 = rownowazne z dowodem (doc sek. 6); brutto 89,4% (<90%), po odjeciu rownowaznych 100%.
* Bramki (logi z jedna linia `EXIT=`): fmt 0, clippy `--all-targets -D warnings` 0, `git diff --check` 0, pelny `cargo test -j 2` (lib + 8 shardow): 2074 passed / 0 failed (baza 2072/0 + 2 nowe).

BLOKADY: brak. NIE_ZMIERZONO: PRZED w tym worktree (przyjeto baze dispatchu 2072/0; PO - 2 nowe testy = 2072); `hp = null` (Z-EF-8); wejscia ulamkowe/nieskonczone poza wektorami. Generator przepisuje sklejke `main.ts` (nieimportowalny), oznaczone numerami linii. Zalozenia Z-EF-1..9 (doc sek. 4), m.in. Z-EF-6: clamp weba wola `maxSafe` bez `humanOwnerIds`/`kosztArmii` (odtworzone doslownie). Nieskomitowany `rust-port/engine/Cargo.lock` (artefakt cargo).

RUNDY: 1/5

NASTEPNY KROK: Evaluator R1 (sprawdzic: zgodnosc sklejki generatora z `main.ts:34594-34830`/`:34986-35004`, falsyfikacje przesłanki, dowody rownowaznosci 11 mutantow, podzial dlugu -Q8 w doc sek. 8).

DEPLOY/PUSH: NIE WYKONANO
