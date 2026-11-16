# ZLOZA-WIRING-ROZPOZNANIE (#300, wpięcie #104 / #172)

STATUS: ROZPOZNANIE ZAMKNIĘTE (tylko odczyt, bez kodu, bez cargo)
BAZA: `0fccd8dbf` (`origin/rust-port/parity-v2`)
PIN: `07d2fbd72` (`gra/src/**`, web-first)
DATA: 2026-11-16
DISPATCH: `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZA-ROZP-Q1/00-dispatch.md` (na gałęzi `claude/rust-sivvrn`)

Dowody: `git grep` / `git show` na podanych commitach. Numery linii dotyczą plików w tych commitach.

## Odpowiedzi na pytania z dispatchu

### P1. Pin: gdzie są wołane `deactivateZlozeGrantsForDeal` i `syncRelationFromDeals`

Definicje: `deactivateZlozeGrantsForDeal` = `gra/src/game/diplomacy-pn-engine.ts:346` (import w `main.ts:1582`).
`syncRelationFromDeals` = `gra/src/main.ts:22832` (lokalna funkcja w `main.ts`, nie w module).

`deactivateZlozeGrantsForDeal` (4 wywołania kodu; `main.ts:22726` to komentarz):

| Pin | Funkcja nadrzędna | Faza / kontekst |
|---|---|---|
| `main.ts:22774` | `breakTreatyVoluntarily` (:22741) | Dobrowolne zerwanie przez gracza (UI: `breakAllianceDeal` :24774, `onBreakTreaty` :25579). Poza tickiem tury. |
| `main.ts:23694` | `breakTreatiesOnWar` (:23688) | Zerwanie traktatów wojną. Wołane z: `processDiploCrisisQueue` :11705, `playerDeclareWarOnOwner` :13169, `ownerDeclareWarOn` :13206, `joinAllyToWar` :23809, :40442, :41932. Poza tickiem tury. |
| `main.ts:24234` | `runDiplomacyTurnTick` (:24229) | Traktaty wygasłe naturalnie (`expireTreaties`). W tickiem tury. |
| `main.ts:24294` | `runDiplomacyTurnTick` (:24229) | Zerwania za daninę (D6). W tickiem tury. |

`runDiplomacyTurnTick` jest wołany w `runWorldEndTurn` (:38130) na kroku 10 (`setTurnTransition(10, 'Dyplomacja i traktaty…')`, `main.ts:38209-38214`), po `pendingImprovementsTurn.commitTurn()` i przed krokiem 14 (ekonomia imperium, :38220).

`syncRelationFromDeals` (11 wywołań):

| Pin | Funkcja nadrzędna |
|---|---|
| `main.ts:14652` | `requestAiMarchPassage` (:14630) |
| `main.ts:21264` | `resolveAllianceWarCall` (:21210) |
| `main.ts:23017` | `formSisterAlliancesIfThreatened` (:22952) |
| `main.ts:23447` | `applyAiAiHandelSurowiecCmd` (:23433) |
| `main.ts:23677` | `formAiAiTradeAgreementsIfEligible` (:23554) |
| `main.ts:23862` | `finalizeAllianceObligationRefusals` (:23821) |
| `main.ts:24319` | `runDiplomacyTurnTick` (:24229), pętla po `getDiplomaticContacts()` (kontakty gracza) |
| `main.ts:24563` | `applyProposalOutcome` (:24498) |
| `main.ts:41584`, `main.ts:41609` | IIFE w funkcji :41164 (ustalanie dozwolonych właścicieli produkcji AI) |
| `main.ts:47264` | IIFE w funkcji :46768 (`loadStartEra`, ścieżka wczytania) |

### P2. Rust: definicje i wołający poza testami

`deactivate_zloze_grants_for_deal`:
- funkcja czysta: `rust-port/engine/src/domain/diplomacy.rs:4292`;
- metoda na stanie: `diplomacy.rs:1676` (`DiplomacyState::deactivate_zloze_grants_for_deal`);
- wołający produkcyjni:
  - `turn_war_dipl_steps.rs:921` (D1, wygasłe umowy w `run_dipl_steps`, ok. :899);
  - `turn_war_dipl_steps.rs:964` (D6, zerwania za daninę);
  - `diplomacy.rs:1698` (w `break_treaties_on_war`, patrz niżej) i `diplomacy.rs:1716` (w `break_treaty_voluntarily`, patrz niżej).

`sync_relation_status_from_deals`: NIE ISTNIEJE w `0fccd8dbf`. Duplikat usunięto w R-RUSTPORT-P6-ZLOZE-SYNC-MERGE-Q1; jedyna implementacja to `sync_relation_from_deals` (`turn_war_dipl_steps.rs:278`). Wpis w `dyspozycje/autobot/runs/R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/dowody/niepodpiete-surowe.tsv` (`diplomacy.rs:4218`) jest nieaktualny.

Wołający produkcyjni `sync_relation_from_deals`: tylko `turn_war_dipl_steps.rs:1008` (D7 w `run_dipl_steps`).

Łańcuch wywołań produkcyjnych:
`advance_turn` (`playable.rs:1400`) → faza `TurnPhase::Diplomacy` (`playable.rs:1422-1423`) → `run_diplomacy_war_phase` (`playable.rs:1480`) → `run_war_turn` (`playable.rs:1491`; `turn_war_pipeline.rs:251`) → krok 3b → `run_dipl_steps` (`turn_war_pipeline.rs:370`, `turn_war_dipl_steps.rs:899`).

Kolejność kroków D1→D2→D3→D4→D5→D6→D7 jest zgodna z pinem. D8 (hamulec) jest po nich, jak na pinie.

Metody domenowe bez wołających produkcyjnych:
- `DiplomacyState::break_treaties_on_war` (`diplomacy.rs:1690`) jest wołany tylko z `break_treaties_on_war_by_player` (`diplomacy_player_war.rs:233`, wołanie :241), a ten tylko z `declare_war_by_player` (`diplomacy_player_war.rs:311`, wołanie :326). `declare_war_by_player` nie ma wołającego w `src` poza testami.
- `DiplomacyState::break_treaty_voluntarily` (`diplomacy.rs:1708`): zero wołających w `src`.
- `suspend_zloze_grants_for_war` (`diplomacy.rs:1671` / `4272`): wołany tylko z `break_treaties_on_war`.

Źródła danych dla grantów i umów w produkcji:
- `ZlozeGrant` jest tworzony wyłącznie w `diplomacy_basket.rs:87` (`transfer_basket_items`, `diplomacy_basket.rs:74`). `transfer_basket_items` nie ma wołającego w `src` poza testami (`tests/p6_zloza_basket.rs`). W produkcji `zloze_grants` zawsze pozostaje puste.
- `ActiveDeal` trafia do stanu przez `add_deal` (`diplomacy.rs:1780`; zero wołających w `src`) albo przez `apply_accepted_proposal` (`diplomacy.rs:4226`), wołane z `TruceDiplomacy::propose` (`diplomacy_truce_flow.rs:163`, :186). `propose` nie ma wołającego w `src`. W produkcji `deals` pochodzi wyłącznie z wczytanego zapisu (NIE_ZMIERZONO: ścieżka wczytania).
- Kontakty dla D7: `turn_war_pipeline.rs:232-238` czyta `war.opaque["diplomaticallyDiscoveredOwners"]`. W `src` nie ma producenta tego klucza (`war_turn_state.rs:97` tylko wymienia klucz; zapis tylko w teście `tests/p6_wire_war_pipeline.rs:308`). W nowej grze pętla D7 jest pusta.

### P3. Lista wpięć (bez implementacji)

Stan wpięć w Rust względem pinu (4 wołania `deactivate` + 11 wołań `sync`):

| # | Pin | Rust | Status |
|---|---|---|---|
| D1 deactivate (wygasłe) | `main.ts:24234` | `turn_war_dipl_steps.rs:921` | WPIĘTE w kroku D1, ale nieaktywne w produkcji (brak umów w produkcji) |
| D6 deactivate (daniny) | `main.ts:24294` | `turn_war_dipl_steps.rs:964` | WPIĘTE w kroku D6, ale nieaktywne w produkcji (j.w.) |
| `breakTreatiesOnWar` deactivate | `main.ts:23694` | `diplomacy.rs:1690-1698` (`break_treaties_on_war`) | NIEWPIĘTE: brak wołającego produkcyjnego; 6 wołających po stronie pinu |
| `breakTreatyVoluntarily` deactivate | `main.ts:22774` | `diplomacy.rs:1708-1716` (`break_treaty_voluntarily`) | NIEWPIĘTE: brak wołającego produkcyjnego (brak akcji UI w Rust) |
| D7 sync (kontakty gracza) | `main.ts:24319` | `turn_war_dipl_steps.rs:1008` | WPIĘTE w kroku D7; pętla pusta w nowej grze (brak producenta `diplomaticallyDiscoveredOwners`) |
| pozostałe 10 wołań sync | patrz tabela P1 | brak | NIEWPIĘTE (NIE_ZMIERZONO: odpowiedniki w Rust nieustalone) |
| produkcja `ZlozeGrant` | `main.ts:12694-12695`, `:24591-24592`, `:24635-24636` (`transferBasketItems`) | `diplomacy_basket.rs:87` | NIEWPIĘTE: brak wołającego produkcyjnego |

Kroki do wykonania (kolejność zależności):
1. Producent kontaktów: zapełnić `diplomaticallyDiscoveredOwners` z kontaktów gracza. Bez tego D7 nie robi nic w nowej grze. Zależność od tematu kontaktów (hamulec D8, `brake_inputs.rs:168-173`).
2. Producent umów i grantów: wpiąć `add_deal` i `transfer_basket_items` do realizacji umów (pin `applyProposalOutcome` :24498, `executePnDealTransfer` :12680). Dopóki to nie zadziała, deaktywacja nie ma danych do pracy.
3. Wojna produkcyjna: podpiąć `break_treaties_on_war` do ścieżek wojny (pin :13169, :13206, :11705, :23809, :40442, :41932). Dla gracza zależy to od #305 (`declare_war_by_player` nie ma wołającego). Kolejność jak na pinie: `suspend_zloze_grants_for_war`, potem zerwanie umów, potem deaktywacja grantów. Kara `zlamana_obietnica` poza tym krokiem (etap a w komentarzu `diplomacy.rs:1686`).
4. Dobrowolne zerwanie: podpiąć `break_treaty_voluntarily` do akcji UI (pin :22741, wywołania :24774, :25579). Efekty N3/N5 i zdarzenia relacji są poza zakresem tej metody.
5. Pozostałe 10 wołań `syncRelationFromDeals`: mapować na odpowiedniki Rust, osobny temat po ustaleniu nazw.
6. Testy: `p6_r7k7b_zloze_sync.rs` i `p6_zloze_grants_state.rs` testują tylko funkcje czyste (`deactivate_zloze_grants_for_deal`, `sync_relation_from_deals`). Czy istnieją wektory pinu dla wpięć z kroków 1-5: NIE_ZMIERZONO.

### P4. Czy #104 i #172 są zrobione na parity (czy wołający produkcyjny istnieje)?

- #104 (deactivate i sync w stanie): CZĘŚCIOWO. Wpięte są 2 z 4 wołań deactivate (D1, D6) oraz 1 z 11 wołań sync (D7). Wołający produkcyjny tych wpięć istnieje (`advance_turn` → `run_war_turn`), ale działają na pustych danych (brak umów i grantów w produkcji). Brak wołających produkcyjnych dla `breakTreatiesOnWar` i `breakTreatyVoluntarily`.
- #172 (wpięcie `zlozeGrants`): NIEZROBIONE. Brak wołającego produkcyjnego `transfer_basket_items`, brak producenta `ZlozeGrant` w produkcji.

Wniosek: nie ma czego zamykać jako "ZINTEGROWANE" dla #104 bez wpięcia producentów (kroki 1-3 wyżej). Rejestr (`R-RUSTPORT-P6-R7K7B-Q1` i `R-RUSTPORT-P6-WIRE-WAR-R7K7-Q1`) opisuje stan sprzed wpięcia D1/D6 i jest nieaktualny w tym punkcie.

## Niespójności znalezione przy rozpoznaniu (do korekty, bez zmian kodu)

1. Nagłówek `turn_war_dipl_steps.rs:35-40` mówi, że `deactivate_zloze_grants_for_deal` w ticku jest "BRAK", podczas gdy kod wpina go w `:921` i `:964`. Komentarz jest nieaktualny.
2. `dyspozycje/autobot/runs/R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/dowody/` podaje `sync_relation_status_from_deals` w `diplomacy.rs:4218` jako niepodpięte. Funkcja nie istnieje w `0fccd8dbf`.
3. Doc-komentarz `break_treaties_on_war` (`diplomacy.rs:1686-1687`) deklaruje "Wywołujący w produkcji: brak (etap b)". To zgodne z kodem; etap b (wpięcie) nie został wykonany. Doc-komentarz `break_treaty_voluntarily` (`diplomacy.rs:1703-1707`) również nie ma wołającego produkcyjnego.

## Niepewne miejsca (NIE_ZMIERZONO)

- Ścieżka wczytania zapisu webowego: czy `war.opaque` niesie `diplomaticallyDiscoveredOwners`, `zloze_grants` (alias `zlozeGrants`, `diplomacy.rs:1660-1661`) i `deals` z zapisu. Nie sprawdzono kodu wczytania ani zapisu webowego.
- Odpowiedniki Rust dla 10 nieopodpiętych wołań `syncRelationFromDeals` (nazwy funkcji nie wyszukiwano).
- Testów nie uruchamiano (dispatch: tylko odczyt, bez cargo).

## Zakres i granice

- Zmiany kodu: brak. Jedyny plik to ten dokument.
- Push do `rust-port/parity-v2`: nie wykonano.
- Gałąź robocza: `rust-port-wip/ZLOZA-ROZP-Q1` od `0fccd8dbf`.
