# R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2 — rozpoznanie wiringu zlozeGrants (#104, część 2)

Typ: ROZPOZNANIE, read-only. Zero zmian w `rust-port/**`, `gra/**`, testach.
Baza: `origin/rust-port/parity-v2` = `7193f5de2`.
Pin: `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/diplomacy-pn-engine.ts`, `gra/src/game/diplomacy-treaties.ts`, `gra/src/game/trade-routes.ts`).

## 0. Ustalenia wstępne (rozbieżności z dispatchem)

- W pinie NIE istnieje funkcja `syncRelationStatusFromDeals`. Odpowiednik to `syncRelationFromDeals` (`main.ts:22832`). Nazwa `sync_relation_status_from_deals` występuje tylko po stronie Rust (`diplomacy.rs:4276`).
- `suspendZlozeOnWar` (`main.ts:12706`) to osobna funkcja z pinu, wołana w `breakTreatiesOnWar` (`main.ts:23689`). Opakowuje `suspendZlozeGrantsForWar` (`diplomacy-pn-engine.ts:331`).
- Rust NIE ma `breakTreatiesOnWar` ani `breakTreatyVoluntarily` jako funkcji produkcyjnych. Brakuje też odpowiednika `suspendZlozeOnWar`.
- Komentarz `rust-port/engine/src/domain/turn_war_dipl_steps.rs:33-36` jest nieaktualny. Twierdzi, że w `engine/src` nie ma modelu zlozeGrants (`grep zloze_grant|ZlozeGrant` = pusty). Od R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1 istnieje pole `DiplomacyState::zloze_grants` (`diplomacy.rs:1661`) i metody (`diplomacy.rs:1670`, `1675`). Komentarz do poprawy przy wdrożeniu.

## 1. Tabela: wywołania `deactivateZlozeGrantsForDeal` w pinie

| # | Pin (`main.ts`) | Funkcja pinu (ścieżka) | Ścieżka domenowa | Odpowiednik Rust (plik:linia) | Wołany w produkcji | Co brakuje |
|---|---|---|---|---|---|---|
| 1 | 22774 | `breakTreatyVoluntarily` (od 22741) | Zerwanie dobrowolne przez gracza lub AI (initiator, kara N3/N5) | BRAK. `turn_war_dipl_steps.rs:33` deklaruje „BRAK”. Brak `break_treaty*` w `engine/src` (grep `fn break_` = pusty). | nie dotyczy | Port `breakTreatyVoluntarily` (usunięcie traktatu, kary wiarygodności N3/N5, wywołanie deaktywacji grantów). |
| 2 | 23694 | `breakTreatiesOnWar` (od 23688) | Zerwanie traktatów przez wojnę (wypowiedzenie, casus belli, sojusz, rebelia). Pin: `suspendZlozeOnWar` → `treatiesBrokenByWar` → `removeTreatiesById` → deaktywacja w pętli. | Częściowo: `treaties_broken_by_war` (`alliance_war_obligation.rs:251`) istnieje, ale wołany tylko w teście `p6_dyplomacja_truce_aggressor.rs:504`. Brak `remove` i brak deaktywacji. | NIE. Brak wołającego w `src`. | Port `breakTreatiesOnWar` na jawnym stanie: suspend + treaties_broken + remove + deactivate. Wpięcie w ścieżki wojny (patrz §3, pozycja W-2). |
| 3 | 24234 | `runDiplomacyTurnTick` → `expireTreaties` (`main.ts:24229-24231`, pętla po `dealsBeforeExpire`) | Wygaśnięcie naturalne (koniec `wygasaTura`) | `run_dipl_steps` D1: `turn_war_dipl_steps.rs:917` (`expire_deals`, `diplomacy.rs:1742`), zdarzenia finiszu w pętli 918-924. BRAK wywołania deaktywacji. | TAK: `run_dipl_steps` wołany z `turn_war_pipeline.rs:370` (łańcuch do `advance_turn`: NIE_ZMIERZONO). | W pętli `turn_war_dipl_steps.rs:918-924` dodać `work.diplomacy.deactivate_zloze_grants_for_deal(&d.id)` dla każdego wygasłego traktatu. |
| 4 | 24294 | `runDiplomacyTurnTick` → D6 zerwanie za daninę (`main.ts:24290-24294`, pętla `broken`) | Zerwanie daniny (brak środków w skarbcu) | `turn_war_dipl_steps.rs:959-961` (`retain` po `res.broken`). BRAK deaktywacji. Zdarzenie `TributeRefused` (952-956) jest wpięte. | TAK (jak wyżej, przez `run_dipl_steps`). | Przed `retain` (959-961) wywołać `deactivate_zloze_grants_for_deal` dla każdego `res.broken`. |

Uwaga do pozycji 4: pin dla trybutu wywołuje dwukrotnie (`tributeBreaks` przy `trybut_odmowa`, potem pętla `broken`). Rust ma jedno miejsce (`report.tribute_breaks`). Deaktywacja dotyczy identyfikatorów z `broken`, więc semantyka jest taka sama.

## 2. Wywołania pomocnicze (`suspendZlozeOnWar`, `syncRelationFromDeals`)

### 2a. Zawieszenie grantów przy wojnie

| Pin | Rola | Rust | Produkcja |
|---|---|---|---|
| `suspendZlozeOnWar` `main.ts:12706` | `zlozeGrants = suspendZlozeGrantsForWar(zlozeGrants, a, b)` + komunikat „Dostęp do złoża wygasł — wojna” | Metoda `DiplomacyState::suspend_zloze_grants_for_war` (`diplomacy.rs:1670`); czysta funkcja `suspend_zloze_grants_for_war` (`diplomacy.rs:4228`). | NIE: brak wołającego w `src` (tylko testy `p6_zloze_grants_state.rs`). |
| Wołanie pinu: `breakTreatiesOnWar` `main.ts:23689` | Wołane PRZED `treatiesBrokenByWar`, czyli także gdy nie ma zerwanych traktatów. | Brak. | NIE. |

Zachowanie do odtworzenia: `suspendZlozeOnWar(a,b)` zawiesza aktywne granty tylko dla pary (w obu kierunkach) i to nawet wtedy, gdy `brokenIds` jest puste (wcześniejszy `return` w 23691 następuje dopiero po suspend).

### 2b. `syncRelationFromDeals` (pin `main.ts:22832`) vs Rust

Pin: `syncRelationFromDeals(a,b)` ustawia `sojusz` (jeśli traktat sojuszniczy) lub `pokoj` (jeśli NAP), nie nadpisuje `wojna`. Rust: `sync_relation_status_from_deals` (`diplomacy.rs:4276`) czysta funkcja i `sync_relation_from_deals` (`turn_war_dipl_steps.rs:275`, dla `DiplomacyState`).

| Wywołanie pinu (linia) | Odpowiednik Rust w produkcji |
|---|---|
| 24319 (D7 kontakty gracza `ME()↔oid`) | TAK: `turn_war_dipl_steps.rs:1004` (wołane w pętli kontaktów `run_dipl_steps`). |
| 14652, 21264, 23017, 23447, 23677, 23862, 24563, 41584 | NIE_ZMIERZONO: nie mapowano pojedynczo. Rust nie ma w produkcji wołającego dla tych ścieżek; `sync_relation_from_deals` ma jedno wołanie w `src` (1004). |

`sync_relation_status_from_deals` (`diplomacy.rs:4276`): brak wołającego w `src` (tylko test `p6_r7k7b_zloze_sync.rs:105`). Obie wersje (`sync_relation_from_deals` i `sync_relation_status_from_deals`) robią to samo. Duplikat do scalenia.

## 3. Lista brakujących elementów (plik:linia)

- **W-1** `rust-port/engine/src/domain/turn_war_dipl_steps.rs:917-924` — brak deaktywacji grantów przy wygaśnięciu (pozycja 3).
- **W-2** `rust-port/engine/src/domain/turn_war_dipl_steps.rs:959-961` — brak deaktywacji przy zerwaniu za daninę (pozycja 4).
- **W-3** brak `break_treaties_on_war` i `break_treaty_voluntarily` (pozycje 1-2). Brak odpowiednika `removeTreatiesById` jako operacji domenowej (w Rust jest `retain`, np. 961).
- **W-4** brak wołającego `suspend_zloze_grants_for_war` w produkcji (`diplomacy.rs:1670`). Potrzebny hak w ścieżce wojny (przed usunięciem traktatów, jak w pinie).
- **W-5** `diplomacy.rs:1675` `deactivate_zloze_grants_for_deal` (metoda) — brak wołającego w produkcji.
- **W-6** `treaties_broken_by_war` (`alliance_war_obligation.rs:251`) — brak wołającego w produkcji.
- **W-7** `sync_relation_status_from_deals` (`diplomacy.rs:4276`) — brak wołającego; duplikat `sync_relation_from_deals` (`turn_war_dipl_steps.rs:275`).
- **W-8** komentarz `turn_war_dipl_steps.rs:32-36` — nieaktualny (patrz §0).
- **W-9** NIE_ZMIERZONO: wołania `breakTreatiesOnWar` w pinie (`main.ts` 11705, 13169, 13206, 23809, 40442, 41932) — nie sprawdzono, które ścieżki wojny mają odpowiednik w Rust. Część z nich zależy od tematu CRED-HAK-WYPOWIEDZENIE (#120).
- **W-10** NIE_ZMIERZONO: czy `eliminate_owner` (`diplomacy.rs:1683`, czyści deale) powinien też deaktywować granty eliminowanego właściciela. Pin nie był sprawdzany pod tym kątem.

## 4. Propozycja tematów wykonawczych

Każdy temat jest mały, zakres jest jawny. Kolejność: T1, T3 (niezależne), potem T2 (zależy od T1).

### T1 — ZLOZE-WIRE-EXPIRE-TRIBUTE (W-1, W-2)
- Zakres: w `run_dipl_steps` dodać deaktywację grantów dla wygasłych (D1) i zerwanych za daninę (D6), 1:1 z pinem `main.ts:24234` i `24294`.
- Allowlista: `rust-port/engine/src/domain/turn_war_dipl_steps.rs`, `rust-port/engine/tests/p6_wire_war_dipl_steps.rs` (lub nowy plik `p6_zloze_wire_expire_tribute.rs`), wektory z pinu (generator w node, wzorem `p6_zloze_grants_state_gen.mjs`), komentarz z W-8.
- Zależności: brak.
- Szacowana liczba rund Operatora: 1-2.

### T2 — ZLOZE-WIRE-WAR-BREAK (W-3, W-4, W-5, W-6)
- Zakres (etap a, czysta domena): `break_treaties_on_war` i `break_treaty_voluntarily` na jawnym stanie `DiplomacyState` (suspend + treaties_broken + remove + deactivate, kolejność jak pin `main.ts:23688-23694`, `22741-22774`). Bez wpinania w produkcję.
- Zakres (etap b, wpięcie): wołanie w ścieżkach wojny i dobrowolnego zerwania (W-9), po ustaleniu list ścieżek.
- Allowlista (a): `rust-port/engine/src/domain/diplomacy.rs`, `rust-port/engine/src/domain/alliance_war_obligation.rs`, testy `p6_zloze_grants_state.rs`.
- Zależności: T1 (ta sama semantyka deaktywacji); etap b zależy od #120 CRED-HAK-WYPOWIEDZENIE i od ścieżek `declare_forced_wars` / `declare_from_assignments` (NIE_ZMIERZONO, czy są w produkcji).
- Szacowana liczba rund: etap a 2-3, etap b 3-5 (zależy od liczby ścieżek wojny).

### T3 — ZLOZE-SYNC-MERGE (W-7, W-8)
- Zakres: scalić `sync_relation_status_from_deals` (`diplomacy.rs:4276`) i `sync_relation_from_deals` (`turn_war_dipl_steps.rs:275`) w jedną funkcję; poprawić komentarz `turn_war_dipl_steps.rs:32-36`; dodać wołanie dla pozostałych wywołań pinu z §2b (po rozpoznaniu każdego z 8 miejsc: osobny krok w T3 albo odnotowanie jako NIE_ZMIERZONO).
- Allowlista: `rust-port/engine/src/domain/diplomacy.rs`, `rust-port/engine/src/domain/turn_war_dipl_steps.rs`, `rust-port/engine/tests/p6_r7k7b_zloze_sync.rs`, `p6_wire_war_dipl_steps.rs`.
- Zależności: brak (T3 nie zmienia deaktywacji).
- Szacowana liczba rund: 1-2.

## 5. Niepewne twierdzenia (NIE_ZMIERZONO)

- Łańcuch wywołań od `advance_turn` do `run_dipl_steps` (`turn_war_pipeline.rs:370`).
- Które z pozostałych wywołań `breakTreatiesOnWar` (pin 11705, 13169, 13206, 23809, 40442, 41932) mają odpowiednik w Rust.
- Pozostałe wywołania `syncRelationFromDeals` (§2b) poza pozycją 1004.
- Czy `eliminate_owner` wymaga deaktywacji grantów (W-10).
- Stan testów: nie uruchamiano `cargo` (rozpoznanie read-only).
