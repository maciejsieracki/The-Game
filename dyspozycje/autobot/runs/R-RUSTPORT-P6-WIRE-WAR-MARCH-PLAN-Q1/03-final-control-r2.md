STATUS: FAIL
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1 (W5)
GOAL: planer marszu per owner (MarchCommand): kampania -> dom -> fala -> all-in; niczego nie wykonuje.
ZMIANY/COMMIT: oceniany 654b778b7 (potomek edbd7f554, potomek bazy 0c88dd509). Diff do allowlisty OK (6 plikow, +1136), git diff --check OK, war_world_view.rs/war_turn_state.rs nietkniete. Nie pushowano.
TESTY (uruchomione samodzielnie na 654b778b7, sparse worktree): rustfmt --check OK; clippy --all-targets -D warnings OK; test p6_wire_war_march 14 passed/0 failed/0 ignored; lib 28 passed. 0 nowych #[ignore].
WERDYKT ZARZUTOW R1:
1 all-in niepodpiety: ODDAL (AllInParams + MarchCommand::AllIn, test all_in_attack_comes_last..., adapter test).
2 buildWarCityTargets: ODDAL (wolany w adapterze, ai_war_march_plan.rs:277).
3 brak testu rozkazu domu: ODDAL (home_defense_orders_attack_adjacent_enemy).
4 fala: ODDAL czesciowo; NAPRAW reszta: (a) brak testu adaptera z wrogiem i niepustym WarTurnState.opaque (waves_from_state), (b) brak asercji kolejnosci komend kampania->dom->fala->all-in (test wykluczenia sprawdza tylko zawieranie, nie kolejnosc).
5 wektory z weba: NAPRAW. Dispatch wymagal wektorow dla eksportowanych planHomeWar/planForcedWarWave/planWarAllInCapital/buildWarCityTargets; Operator sam przyznal, ze uzasadnienie "brak generatora" bylo bledne (istnieja gra/tools/*-test.cjs i wzorzec gen-*-vectors.mjs). Zaniechanie wykonalnego wymogu D3 (1:1) nie jest "NIE_ZMIERZONO" ani dlugiem. Minimum: wygenerowac wektory z uruchomionego weba dla przynajmniej planHomeWar i planForcedWarWave i porownac w testach; dla reszty jawne uzasadnienie.
6 numery linii: ODDAL (zmierzone na origin/main cffe39cb9, doc zaktualizowany).
7 Z3/Z4: ODDAL do W8 (wymaga trwalej pamieci histerezy miedzy turami, poza widokiem W5; odchylenie jawnie opisane w module i doc). Warunek: jeden test dokumentujacy skutek Z3 (swieza histereza = brak wygaszenia) mile widziany, nie blokujacy.
NOWY ZARZUT (NAPRAW): tests/p6_wire_war_march.rs ma 689 LOC (wc -l) > limit partii 600 z dispatchu ("DZIEL na dwa pliki testowe"). Podzielic (np. p6_wire_war_march_core.rs / p6_wire_war_march_adapter.rs).
BLOKADY: brak.
RUNDY: FC po rundzie 2/5; nastepna 3/5, ten sam ID, baza 654b778b7.
NASTEPNY KROK: Operator r3 (Sonnet dopuszczalny z uzasadnieniem: generator wektorow weba = wiele sciezek; po 2 rundach Haiku): wektory weba, test adaptera z opaque + asercja kolejnosci komend, podzial pliku testowego. Potem Evaluator, FC.
SHA DO INTEGRACJI: brak (FAIL). Kolejnosc po PASS: kod operatora r3 -> merge na origin/rust-port/parity-v2 (0c88dd509; W5 niezalezne od innych niezintegrowanych tematow W1-W4, ktore sa juz w bazie).
DEPLOY/PUSH: NIE WYKONANO
