STATUS: FAIL
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1
GOAL: Pola i migracje zapisu (wodzowie, siatka stosu, flagi meta) zadzialajace po wczytaniu; stary zapis bez zmian.
ZMIANY/COMMIT: oceniany 2ad132a1b (baza e4edcd4ae -> 7f38322ae); origin/rust-port/parity-v2 = 1079feb9f (12 commitow dalej, dotyka mod.rs i save_load.rs). Allowlista: 14 plikow, wszystkie w allowliscie. Brak push.
TESTY (powtorzone przez FC): fmt --check rc=0; cargo test 4 nowe binarki (generals_vectors 1, stack_vectors 5, snapshot_flags 3, meta_flags 1) 0 failed, 0 ignored. Wektory weba (710 przypadkow) maja generatory .mjs w repo.
ZARZUTY: 
1. NAPRAW - save_migrations.rs (plan wodzow, plan podzialu stosu) i accessory SaveMeta::auto_build_enabled / player_epoch_war_enabled maja 0 wywolan w kodzie produkcyjnym (git grep po src/ potwierdza). Dispatch wymagal wplywu na stan po wczytaniu; dostarczono martwy kod. 
2. NAPRAW - uzasadnienie "UnitDto nie ma is_general / types.rs poza allowlista" jest nieskuteczne: dispatch jawnie stanowi, ze blokada 'plik poza allowlista' = dopisz ZALOZENIE i rob dalej (NIE BLOCK). types.rs (domain/types.rs:413 UnitDto) trzeba dotknac addytywnie (pole is_general/kolejnosc narodzin) i wpiac demotion do wczytania. is_general juz istnieje w generals.rs i innych modulach - sprawdzic istniejacy nosnik zamiast deklarowac brak.
3. NAPRAW - brak testu p6_zapis_migracje_* przez pelny SaveSnapshot ze starym zapisem, na ktorym migracja zmienia stan (snapshot_flags sprawdza tylko flagi meta).
4. NAPRAW - wpiecie siatki stosu (web main.ts:46573, 37754) niewykonane; zalezne helpery (mapHexPassableForUnit/canUnitOccupyCityHex) nalezy zmierzyc grepem w Rust (szukac snake_case), nie deklarowac "brak".
5. NAPRAW (maly) - plannedMarches vs pathfinding.rs:2250 oraz pola dyplomacji/oblezenia (W1) nadal NIE_ZMIERZONO dla rzeczy mierzalnych grepem/odczytem; zmierzyc albo uzasadnic konkretnym dowodem.
ODDAL: zarzut Obrony o czesciowa nieweryfikowalnosc cudu swiata (web nie ma migracji - zgodne z dispatchem); clippy (FC runda 1 odtworzyl czysto; Obrona zglasza rc=0).
DO DECYZJI CZLOWIEKA: brak (zaprojektowanie pola w UnitDto to implementacja, nie decyzja produktowa; luki = ZALOZENIE).
Dobre: wektory z weba (Node 22) i testy planu zgodne; to baza do wpiecia.
BLOKADY: brak technicznych.
RUNDY: 2/5; werdykt FAIL; decyzja wymagana: brak.
KOLEJNOSC WZGLEDEM origin/rust-port/parity-v2: kod operatora lezy na 7f38322ae, parity-v2 to 1079feb9f (+12). Przed integracja rebase/merge wymagany (konflikty mozliwe w domain/mod.rs, save_load.rs); runda 3 niech startuje z BAZA 1079feb9f lub ma ten rebase w zakresie. SHA do integracji: BRAK (FAIL); najlepszy kandydat do kontynuacji 2ad132a1b / wip autobot/R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1-fc-r2.
NASTEPNY KROK: runda 3 (ten sam ID): wpiac demotion wodzow i siatke stosu do wczytania (SnapshotWire/UnitDto addytywnie), podpiac accessory flag, testy przez pelny SaveSnapshot stary/nowy zapis.
DEPLOY/PUSH: NIE WYKONANO
