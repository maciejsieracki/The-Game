STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-WIRING-Q1 (zadanie #104)
GOAL: Wpiac `deactivate_zloze_grants_for_deal` i `sync_relation_status_from_deals` w produkcyjna sciezke stanu (wolajacy w `src/` poza definicjami).
ZMIANY/COMMIT: brak zmian kodu. Baza 23e33793e (czubek origin/rust-port/parity-v2), gałąź wip/R-RUSTPORT-P6-ZLOZE-WIRING-Q1. Commit zawiera wyłącznie ten raport.

DOWODY (git grep w 23e33793e):
- Definicje: rust-port/engine/src/domain/diplomacy.rs:4197 (`deactivate_zloze_grants_for_deal`), :4225 (`sync_relation_status_from_deals`).
- Produkcyjny wolajacy `deactivate_zloze_grants_for_deal`: BRAK. Grep `deactivate_zloze|ZlozeGrant|zloze_grant|zlozeGrant` w rust-port/engine/src poza definicja jest pusty.
- Brak modelu zlozeGrants w stanie gry Rust: `DiplomacyState` (diplomacy.rs ~1650-1700) ma tylko `relations` i `deals`. Pin trzyma `zlozeGrants` w stanie gry (gra/src/main.ts:22774, :23694, :24234, :24294 przypisuja `zlozeGrants = deactivateZlozeGrantsForDeal(...)`). Luka jest jawnie opisana w rust-port/engine/src/domain/turn_war_dipl_steps.rs:34-36.
- `sync_relation_status_from_deals` (diplomacy.rs:4225) jest duplikatem: produkcyjna wersja to `sync_relation_from_deals` (turn_war_dipl_steps.rs:275), wolana w turn_war_dipl_steps.rs:1004 (D7, kontakty gracza). Wersja z diplomacy.rs nie ma produkcyjnego wolajacego.
- Pin: `syncRelationFromDeals` ma wiele wolan (gra/src/main.ts:14652, 21264, 23017, 23447, 23677, 23862, 24319, 24563, 41584, 41609, 47264); w Rust wpieta jest jedna sciezka (D7).
- Test z wektorami pinu juz istnieje: rust-port/engine/tests/p6_r7k7b_zloze_sync.rs. Nie byl uruchamiany w tej rundzie.

DLACZEGO BLOCK:
Kryterium 1 (produkcyjny wolajacy obu funkcji) wymaga dodania do stanu gry Rust nowego modelu `ZlozeGrant` / `zloze_grants` (pole w stanie dyplomacji lub tury, z serializacja i kompatybilnoscia zapisu) oraz wpiecia go w cztery miejsca pinu (breakTreatyVoluntarily, breakTreatiesOnWar, wygasanie D1, zerwanie D6). To wykracza poza "minimalne wolanie" z dispatchu, a allowlista nie obejmuje zmian formatu stanu ani zapisu gry. Nie wykonano tego bez decyzji orkiestratora.

TESTY: NIE_ZMIERZONO. Brak zmian kodu, wiec bramki (`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, nowy test) nie byly uruchamiane. Nie utworzono pliku rust-port/engine/tests/p6_zloze_wiring*.rs.
BLOKADY:
1. Brak modelu zlozeGrants w stanie gry Rust (grep pusty poza definicja). Wpiecie wymaga nowego pola stanu i zmiany formatu zapisu.
2. Allowlista dispatchu nie obejmuje zmian stanu ani zapisu gry.
3. Kryterium 1 niespelnione dla `deactivate_zloze_grants_for_deal`.
RUNDY: 1/5. Ostatni werdykt: brak (pierwsza runda).
NASTEPNY KROK: Decyzja orkiestratora (DECISION_REQUIRED, Operator nie wykonuje): (a) rozszerzyc zakres o model `ZlozeGrant` w stanie gry (osobny temat z allowlista na stan, zapis i migracje), albo (b) zamknac #104 jako "wymaga modelu zlozeGrants, poza zakresem wiringu" i odlozyc. Wiring `sync_relation_status_from_deals` nie powinien byc robiony osobno: produkcyjna sciezka sync juz istnieje jako `sync_relation_from_deals`.
DEPLOY/PUSH: NIE WYKONANO
