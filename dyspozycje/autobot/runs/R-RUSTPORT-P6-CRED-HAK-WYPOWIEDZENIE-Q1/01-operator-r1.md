STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1 (zadanie #120, CRED-HAK-WYPOWIEDZENIE)
GOAL: podpiac hak P4 (`chargeWarDeclarationCredibility` -> `note_war_entered`) w trzech sciezkach produkcyjnych: wypowiedzenie wojny przez gracza, sojusz, klaster.
ZMIANY/COMMIT: brak zmian kodu. Baza 23e33793e (czubek origin/rust-port/parity-v2), gałąź wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1. Commitowany jest wyłącznie ten raport. Brak edycji rust-port/, gra/, origin/main.
TESTY: NIE_ZMIERZONO. Bramki cargo (fmt/clippy/test) nie uruchomiono, bo nie ma zmiany do sprawdzenia; BLOCK zapadl przed implementacja (kryterium 5 dispatchu).
BLOKADY: trzy z czterech sciezek pinu nie maja wolajacego w produkcji Rust.

## KROK 0: wykaz sciezek (git grep w 23e33793e, rust-port/engine/src)

Pin (`git show 07d2fbd72:gra/src/main.ts`), wywolania `chargeWarDeclarationCredibility` potwierdzone: 13168 (gracz, ME vs owner), 13205 (gracz, attacker/defender), 23806 (sojusz, allyId vs mustDeclareWarOn, skipN2AllianceDefense), 40441 (klaster, csOwnerId vs ME), 41931 (AI, ownerId vs targetId). Definicja: 12176.

| Sciezka pinu | Odpowiednik Rust | Wolajacy w produkcji | Hak P4 |
|---|---|---|---|
| Wypowiedzenie gracza (13168, 13205) | `TruceDiplomacy::declare_war` / `declare_war_opts` (diplomacy_truce_flow.rs:239/247) | BRAK. Wolaja tylko testy (p6_repin_rozejm_silnik.rs:223-282). `EngineCommand` (bridge.rs:26) nie ma komendy wypowiedzenia wojny (CreateSession, AddPlayer, SelectUnit, MoveUnit, AdvanceTurn, GetState). | NIE (brak `note_war_entered` w tych funkcjach) |
| Sojusz (23806) | brak deklaracji po stronie sojusznika; `alliance_war_obligation.rs` tylko liczy `must_declare_war_on` (linie 147/166/204), `diplomacy_truce.rs:147` tylko filtruje | BRAK | NIE |
| Klaster (40441) | brak odpowiednika (grep `cluster`/`klaster` w logice wojny: 0 trafien dla deklaracji) | BRAK | NIE |
| AI z hamulca (41931 / hamulec) | `turn_war_dipl_steps::note_war_declarations` (turn_war_dipl_steps.rs:876-899), wolany z `turn_war_pipeline.rs:422` po `run_brake_phase` | TAK (produkcja, run_war_turn) | TAK |
| Wojna wymuszona (41931 ForceWar) | `war_turn_declare::declare_forced_wars` (war_turn_declare.rs:110) wola `note_war_declarations` | BRAK w produkcji (wolaja tylko testy p6_wire_war_declare*.rs, p6_cred_wojna_forced.rs; `declare_from_assignments` tez bez wolajacego) | tylko w funkcji, nie w produkcji |

Wniosek: produkcyjny hak P4 istnieje wylacznie dla wojny z hamulca AI (turn_war_pipeline.rs:422). Dla trzech sciezek z dispatchu (gracz, sojusz, klaster) w produkcji NIE MA miejsca wywolania, do ktorego mozna by podpiac hak.

## Dlaczego nie implementuje

Kryterium 5 dispatchu: jesli sciezka nie istnieje w produkcji, zglos BLOCK z dowodem, nie tworz martwego wrappera. Podpiecie haka do `declare_war_opts` dalo by funkcje wolana tylko z testow (wzorzec FAIL, ZDOBYCIE-WIRING). Dodanie komendy wypowiedzenia wojny do `EngineCommand` lub modelu sojuszu/klastra to nowa funkcjonalnosc, nie podpiecie haka, wiec wykracza poza allowliste i GOAL.

## Uwagi do zakresu (do decyzji orkiestratora)

- Rozjazd z dispatchem: w `diplomacy_truce_flow.rs` (jak i w pinie) zlamanie rozejmu/oferty (Z8/N1) jest naliczane w `declare_war_opts` przez `credibility_events`, ale bez `note_war_entered`. Pin wymaga obu (licznik P4 zerowany zawsze, kara N2 tylko przy `!skipN2`). Gdy powstanie wolajacy gracza, trzeba dopisac `note_war_entered` w kolejnosci pinu (kara przed zerowaniem licznika).
- Truce-end -> wojna (`truce_end_to_war_core` -> `declare_war_after_truce`, diplomacy_truce_end.rs:207) pin opisuje jako wojne BEZ kary (tickTruceExpiries), wiec nie powinna wolac haka P4. Nie zmieniano.
- Sciezka wojny wymuszonej: `declare_forced_wars` ma hak, ale nie ma wolajacego w produkcji. To osobny dlug (wpiecie wojny wymuszonej w run_war_turn), nie objety tym tematem.
- Zadanie #120 w rejestrze opisuje takze `declare_forced_wars`/`declare_from_assignments` w produkcji; to tez nie jest zrobione.

## Proponowane kolejne kroki (decyzja wlasciciela/orkiestratora, nie Operatora)

1. Zdecydowac, czy nowy temat ma najpierw dodac produkcyjna komende wypowiedzenia wojny przez gracza (EngineCommand + wolajacy `declare_war_opts`), a dopiero potem hak P4. Bez tego sciezka gracza nie ma miejsca wpiecia.
2. Sojusz i klaster: najpierw potwierdzic w pinie, kto i kiedy realnie wola `chargeWarDeclarationCredibility` dla sojusznika i klastra (23806, 40441), a w Rust zbudowac produkcyjne wywolanie; to osobne tematy.
3. Wojna wymuszona: wpiac `declare_forced_wars` do run_war_turn (dlug z #120).

RUNDY: 1/5 (pierwsza runda Operatora, BLOCK bez kodu)
NASTĘPNY KROK: decyzja orkiestratora wg punktu 1 powyzej; ewentualny nowy dispatch z zakresem na komende gracza.
DEPLOY/PUSH: NIE WYKONANO (commit tylko raportu lokalnie w worktree; brak push).
