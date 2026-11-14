# P6-REPIN-OBLEZENIE-LIMIT-BLOKADA — tabela luk (R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1)

Baza: `rust-port/parity-v2` = `43f4064b0`. Web: `origin/main` = `638e90bea`, FALA ≤ 606.
Pomiar: runda 1 Operatora (Haiku 5.5). Wszystkie wskazania `plik:linia` z bazy `43f4064b0` lub z `origin/main`.

## Cel (z dispatchu)

(a) Oblężenie bez wyłomu: sufit 150 tur → REMIS, miasto zostaje obrońcy; dotyczy też bitwy ręcznej; Pomiń = wynik jak AUTO (SKIP-SIEGE `c8e3e4664`).
(b) SIEGE-NEARBY (`218d7d5cf`): blokada tylko stosów faktycznie oblegających; własne jednostki dołączają do armii oblegającej poza miastem, nie do armii w mieście (`siegeArmyGroupId`).

## Tabela luk

| # | Element webowy (źródło) | Odpowiednik w Rust (`rust-port/engine`) | Stan | Działanie w tej rundzie |
|---|---|---|---|---|
| L1 | Parametr `oblezenie.bez_wylomu_max_tur = 150` (`gra/data/combat-params.json:54`, web `origin/main`) | Wpiety (runda 2): pola `Oblezenie.bez_wylomu_max_tur` i `_bez_wylomu_max_tur_opis` w `src/data/units_combat.rs`, wartosc 150 w `rust-port/engine/data/combat-params.json`; czyta ja `domain/siege_no_breach.rs::siege_no_breach_max_rounds_from_data`. | ZROBIONE (dane) | Stala w kodzie usunieta. Rust `combat-params.json` nie jest pelna kopia webowego (rozjazd poza tematem). |
| L2 | `_roundCapVerdict` + `siegeNoBreachMaxRounds` (`battleScene.ts:1128, 2504, 9433-9456`) | Brak. Rust nie ma taktycznej pętli tur: `domain/combat.rs:319` `resolve_combat` jest jednorazowe. | BRAK pętli | Dodano czysty predykat `domain/siege_no_breach.rs` (`round_cap_verdict`, `siege_no_breach_cap`). Podpięcie do pętli = osobny temat. |
| L3 | Stan muru/wylomu (`siegeWallCol`, `wallEverBreached`) | Brak odpowiednika (grep `wylom|breach|wall_ever|siege_wall` w `src/`: tylko `is_truce_breach` dyplomacji, bez związku). | BRAK | Wejście do predykatu jako `bool` (Z-NB-1/2). |
| L4 | Remis / werdykt 'remis' w bitwie oblężniczej (`_finishDraw`, `battleScene.ts`) | `combat.rs` ma `Winner::Draw` (`combat.rs:~120`), ale bez sufitu tur i bez zasady „miasto zostaje obrońcy”. | CZĘŚCIOWO (typ) | Brak zmian w `combat.rs` (poza allowlistą). |
| L5 | Bitwa ręczna i Pomiń = wynik AUTO (`battleScene.ts` `_roundCapVerdict` wspólny) | Brak warstwy bitwy ręcznej w Rust. | BRAK | Poza zakresem engine; dokumentacja. |
| L6 | `besiegeArmyGroups` (`armyMerge.ts:177-189`) | Brak. | BRAK | Dodano `domain/siege_nearby_lock.rs::besiege_army_groups` (port 1:1, Z-SN-1..4). |
| L7 | `besiegeLockTargets` (`armyMerge.ts:195-207`) | Brak. | BRAK | Dodano `siege_nearby_lock.rs::besiege_lock_targets` (zwraca indeksy). |
| L8 | `stackGroupIdOf` (`armyMerge.ts:57-62`) | Brak (Rust nie ma pola `stackGroupId`). | BRAK | Dodano `stack_group_id_of` z polem `explicit_stack_group_id` (Z-SN-1). |
| L9 | `commitBesiege` / `startMapSiege` / `siegeArmyGroupId` (`main.ts`, web) | Brak warstwy UI; w Rust nie ma `siegeArmyGroupId`. Pole `oblega_city_id` istnieje (`domain/siege_sortie.rs:68`, `domain/recruitment.rs:430`). | BRAK (UI) | Poza zakresem (Z-SN-5). |
| L10 | Dołączanie własnych jednostek do armii oblegającej poza miastem (`inheritSiegeOnJoin`) | Brak. `domain/siege_enter_city.rs` obsługuje tylko wejście po kapitulacji. | BRAK | Nie zaimplementowano. |
| L11 | Wektory testowe „z uruchomionego weba” (dispatch) | Runda 2: `gen-vectors.cjs` uruchamia kod weba (Node 22.22, `git archive origin/main gra/src gra/data`): cap i `_roundCapVerdict` (battleScene.ts), `stackGroupIdOf`/`besiegeArmyGroups`/`besiegeLockTargets` (armyMerge.ts), `hexDistance` (setup.ts). Wynik: `tests/p6_repin_oblezenie_limit_vectors/vectors.rs` (15 cap, 336 werdykt, 400 SIEGE-NEARBY). | ZMIERZONO | Test `p6_repin_oblezenie_limit_web.rs`. Przy okazji runda 2 usunela blad: cap nie ogranicza do 400 (min tylko w werdykcie). |

## Co dodano w tej rundzie

* `rust-port/engine/src/domain/siege_no_breach.rs`: `FF_MAX_ROUNDS`, `SIEGE_NO_BREACH_MAX_ROUNDS_WEB`, `siege_no_breach_cap`, `round_cap_verdict`, `RoundCapVerdict`.
* `rust-port/engine/src/domain/siege_nearby_lock.rs`: `LockUnit`, `stack_group_id_of`, `besiege_army_groups`, `besiege_lock_targets`.
* `rust-port/engine/src/domain/mod.rs`: rejestracja obu modułów.
* `rust-port/engine/tests/p6_repin_oblezenie_limit_cap.rs` (8 testów), `rust-port/engine/tests/p6_repin_oblezenie_limit_lock.rs` (6 testów).

## Otwarte decyzje / zgłoszenia

* D-OBL-1 (runda 2): parametr wpiety; allowlista `data/** dla parametru` obejmuje `src/data/units_combat.rs` (struktura Oblezenie). Do potwierdzenia przez orkiestratora.
* D-OBL-2 (ZAŁOŻENIE): zachowanie „remis przy 150 turach” dotyczy oblężenia bez wyłomu; bitwy z wyłomem zostają przy sufitie 400 (zgodnie z webem).
* D-OBL-3 (ZAŁOŻENIE): stała 150 w Rust jest kopią wartości webowej do czasu wpięcia danych (Z-NB-1).
* D-OBL-4: brak pętli taktycznej w Rust → temat „petla bitwy taktycznej” musi poprzedzić pełne domknięcie L2–L5.
* D-OBL-5: SIEGE-NEARBY (L9, L10) wymaga warstwy stanu gry w Rust, której nie ma; poza tym tematem.
