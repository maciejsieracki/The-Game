# R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1 — rozpoznanie wpięcia zlozeGrants (#104)

Status: rozpoznanie, BEZ zmian kodu. Baza: `fc2ed160f` (`origin/rust-port/parity-v2`).
Pin (tylko odczyt): `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/diplomacy-pn-engine.ts`).
Wszystkie linie Rust: `rust-port/engine/src/...` na bazie `fc2ed160f`.

## 1. Model zlozeGrants

| Element | Pin (web) | Rust (fc2ed160f) | Dowód |
|---|---|---|---|
| typ `ZlozeGrant` | `diplomacy-pn-engine.ts:115` | jest: `ZlozeGrant` (pola: granter/grantee/partner, zloze_id, hex_key, active, deal_id) | `rust-port/engine/src/domain/diplomacy.rs:4185` |
| stan gry `zlozeGrants` | `main.ts:10010` (deklaracja), `:10973` (reset nowej gry) | BRAK pola w stanie (`DiplomacyState` nie ma listy grantów) | grep `zloze_grant\|ZlozeGrant` w `rust-port/engine/src` poza `diplomacy.rs:41xx-42xx` = pusto |
| tworzenie grantu przy realizacji koszyka (kind `zloze`) | `main.ts:12613` (`transferBasketItems`, `:12566`) | BRAK. Typ `BasketItemKind::Deposit` jest (`diplomacy.rs:1740-1760`, serde `zloze`), ale nic nie tworzy grantu | `diplomacy.rs:1747` |
| zapis / odczyt w save | `main.ts:37358` (zapis `meta.zlozeGrants`), `:47251-47253` (wczyt) | BRAK | grep pusty |
| licznik debug | `main.ts:30649` | BRAK | - |

Pin NIE ma konsumenta grantów w logice dostępu do złoża w `main.ts` (grep `zlozeGrants` daje tylko wyżej wymienione miejsca). Zakres wpięcia = utrzymanie stanu (tworzenie, wygaszanie, zawieszanie, zapis), nie nowa reguła gameplay. Nie zweryfikowano, czy konsument jest w innych plikach pinu (`trade-routes.ts:1817` tylko komentarz) — NIE_ZMIERZONO poza `gra/src/game/trade-routes.ts` komentarzem.

## 2. Wywołania w pinie → odpowiednik w Rust

| Pin | Funkcja (pin) | Kontekst | Rust | Status |
|---|---|---|---|---|
| `main.ts:22774` | `deactivateZlozeGrantsForDeal` | `breakTreatyVoluntarily` (`:22741`), dobrowolne zerwanie umowy | brak wywołania; brak komendy zerwania dobrowolnego w Rust (NIE_ZMIERZONO, czy istnieje odpowiednik `break_treaty_voluntarily` — grep nie znalazł funkcji o tej nazwie) | BRAK |
| `main.ts:23694` | `deactivateZlozeGrantsForDeal` | `breakTreatiesOnWar` (`:23688`), pętla po `brokenIds` | `treaties_broken_by_war` jest (`alliance_war_obligation.rs:251`) ale używany tylko w testach (`tests/p6_dyplomacja_truce_aggressor.rs:504`) | BRAK |
| `main.ts:24234` | `deactivateZlozeGrantsForDeal` | `runDiplomacyTurnTick` (`:24229`), traktat wygasły w `expireTreaties` | `DiplomacyState::expire_deals` (`diplomacy.rs:1727`) wołane z `turn_war_dipl_steps.rs:917` — BEZ hooka na grant | BRAK (hak do dopięcia w tym miejscu) |
| `main.ts:24294` | `deactivateZlozeGrantsForDeal` | `runDiplomacyTurnTick` D6, zerwanie za daninę | `tribute_break_pairs` (`turn_war_dipl_steps.rs:238`) wołane `:950`; usunięcie umowy NIE wywołuje deaktywacji grantu | BRAK |
| `main.ts:23689` (→ `main.ts:12706`) | `suspendZlozeGrantsForWar` (przez `suspendZlozeOnWar`) | pierwsza linia `breakTreatiesOnWar` — działa też, gdy nic nie zerwano | brak; `suspend_zloze_grants_for_war` nie istnieje w Rust (grep) | BRAK |

Źródła wywołań `breakTreatiesOnWar` na pinie (każde przenosi zawieszenie grantów): `main.ts:11705` (`processDiploCrisisQueue` :11650), `:13169` (`playerDeclareWarOnOwner` :13152), `:13206` (`ownerDeclareWarOn` :13197), `:23809` (`joinAllyToWar` :23797), `:40442` i `:41932` (`runWorldEndTurn` :38130). Po stronie Rust: brak hooka wojny na grantach; rozpoznanie wojny Rust jest w `war_turn_declare.rs` / `turn_war_pipeline.rs` (NIE_ZMIERZONO szczegółów wpięcia — poza zakresem tego rozpoznania).

Wywołanie `deactivateZlozeGrantsForDeal` w `main.ts` jest 4 razy; w Rust 0 razy. Dokument `turn_war_dipl_steps.rs:32-36` już dziś deklaruje tę lukę jawnie („BRAK").

## 3. syncRelationFromDeals / sync_relation_status_from_deals

Pin `syncRelationFromDeals` (`main.ts:22832`): wyjście przy `wojna`; sojusz (`isAllianceDealKind`) > NAP (`hasTreaty` PaktNieagresji) → `setDiploRelation`.

Rust ma DWIE funkcje o tej samej semantyce:

- `sync_relation_from_deals(state: &mut DiplomacyState, a, b) -> bool` — `turn_war_dipl_steps.rs:275`. Jedyny wołający produkcyjny: `turn_war_dipl_steps.rs:1004` (kontakty gracza, odpowiada pinowi `:24319`). Test: `tests/p6_wire_war_dipl_steps.rs:725`.
- `sync_relation_status_from_deals(current, deals, a, b) -> Option<RelationStatus>` — `diplomacy.rs:4225`, czysta funkcja z pola „R-RUSTPORT-P6-WIRE-WAR-R7K7B". Wołana WYŁĄCZNIE z `tests/p6_r7k7b_zloze_sync.rs:105`. Duplikat funkcji produkcyjnej (ta sama logika).

Pozostałe wywołania `syncRelationFromDeals` na pinie, bez odpowiednika produkcyjnego w Rust (grep: jedyny produkcyjny wołający to `:1004`):

| Pin | Funkcja (pin) |
|---|---|
| `main.ts:14652` | `requestAiMarchPassage` (`:14630`) |
| `main.ts:21264` | `resolveAllianceWarCall` (`:21210`) |
| `main.ts:23017` | `formSisterAlliancesIfThreatened` (`:22952`) |
| `main.ts:23447` | `applyAiAiHandelSurowiecCmd` (`:23433`) |
| `main.ts:23677` | `formAiAiTradeAgreementsIfEligible` (`:23554`) |
| `main.ts:23862` | `finalizeAllianceObligationRefusals` (`:23821`) |
| `main.ts:24563` | `applyProposalOutcome` (`:24498`) |
| `main.ts:41584`, `:41609` | `runWorldEndTurn` (`:38130`) |
| `main.ts:47264` | `restoreGameFromSave` (`:46225`) — po wczytaniu (NIE_ZMIERZONO, czy Rust odtwarza relacje z traktatów przy wczytaniu) |

Wniosek: `sync_relation_status_from_deals` (`diplomacy.rs:4225`) nie jest wpięta; produkcyjną funkcją jest `sync_relation_from_deals` (`turn_war_dipl_steps.rs:275`), wpiętą tylko w jednym z jedenastu miejsc pinu. Zalecane: NIE dodawać trzeciej kopii; użyć `sync_relation_from_deals` i usunąć/zdeprecjonować duplikat po wpięciu (lub zostawić tylko jako wektor testowy).

## 4. Brakujące elementy (lista do implementacji)

1. Stan: `zloze_grants: Vec<ZlozeGrant>` w stanie gry (`PlayableState` lub `DiplomacyState`), reset w nowej grze (pin `:10973`), zapis/odczyt (pin `:37358`, `:47251-47253`). Bez migracji schematu, jeśli pole dodane jako `#[serde(default)]` (do potwierdzenia w temacie wykonawczym).
2. Tworzenie grantu w realizacji koszyka: `transfer_basket_items` (pin `:12566`, push `:12613`) — kind `Deposit` → grant z `deal_id`. Rust: miejsce realizacji umowy (NIE_ZMIERZONO nazwa; kandydat `diplomacy.rs` wokół `:2639`).
3. Wygaszanie: `deactivate_zloze_grants_for_deal` w 4 miejscach (pin `:22774`, `:23694`, `:24234`, `:24294`).
4. Zawieszanie przy wojnie: `suspend_zloze_grants_for_war(grants, a, b)` (pin `diplomacy-pn-engine.ts:331`) — jedno wywołanie, w odpowiedniku `breakTreatiesOnWar`; Rust: `treaties_broken_by_war` (`alliance_war_obligation.rs:251`) jest tylko w testach — hook wojny w produkcji to osobny problem (poza tym tematem, zob. #120 CRED-HAK-WYPOWIEDZENIE pokrywa część ścieżek).
5. Synchronizacja relacji: podpięcie `sync_relation_from_deals` w miejscach pinu z tabeli sekcji 3 (lub świadomie: zakres tylko poza tym tematem).
6. Testy: wektory istnieją (`tests/p6_r7k7b_zloze_sync.rs`, generator `tests/p6_r7k7b_zloze_sync_gen.mjs`, wektory `tests/p6_r7k7b_vectors/vectors.json`). Brak testów integracyjnych „grant powstaje przy transferze → znika po zerwaniu/wojnie/wygaśnięciu".

## 5. Propozycja podziału na tematy wykonawcze

Zależności: A → B → C; D niezależne od A (czysta logika), ale wymaga A do testów integracyjnych.

- **ZLOZA-A (stan + zapis + reset)** — pola w stanie, reset, serializacja z `serde(default)`. Pliki: `rust-port/engine/src/domain/diplomacy.rs`, `playable.rs`/`save` (NIE_ZMIERZONO dokładnych). Rozmiar: 1–2 rundy.
- **ZLOZA-B (tworzenie grantu przy transferze koszyka)** — zależy od A. Test: wektor z pinu `transferBasketItems` dla kind `zloze`. Rozmiar: 1–2 rundy.
- **ZLOZA-C (wygaszanie: wygaśnięcie, zerwanie daniną, zerwanie dobrowolne)** — zależy od A. Pin `:22774`, `:24234`, `:24294`. Rozmiar: 1–2 rundy. Dobrowolne zerwanie wymaga najpierw ustalenia, czy istnieje komenda Rust (NIE_ZMIERZONO).
- **ZLOZA-D (zawieszenie przy wojnie + hook wojny)** — zależy od A; hook `breakTreatiesOnWar` w produkcji wymaga decyzji o zakresie (6 wywołań pinu). Rozmiar: 2–3 rundy. Ryzyko: duży zakres, styk z `war_turn_declare.rs` i #120.
- **ZLOZA-E (sync relacji: wpięcie `sync_relation_from_deals` w 10 miejsc pinu + usunięcie duplikatu)** — niezależne od A–D. Rozmiar: 2 rundy. Ryzyko: część miejsc (`runWorldEndTurn`, `restoreGameFromSave`) dotyka ścieżek poza tym tematem.

Kolejność sugerowana: A → B → C → D; E równolegle.

## 6. Ryzyka

- Brak konsumenta grantów w pinie (sekcja 1): błąd w wpięciu nie da się zobaczyć w dostępie do złoża; testy muszą sprawdzać stan `zloze_grants` wprost.
- Duplikat `sync_relation_status_from_deals` vs `sync_relation_from_deals`: ryzyko rozjazdu, jeśli obie będą rozwijane.
- `treaties_broken_by_war` nie jest w produkcji: zawieszenie grantów przy wojnie nie ma hooka bez szerszego wpięcia wojny.
- Brak NIE_ZMIERZONO: uruchomienia `cargo test` nie wykonano (rozpoznanie tylko do odczytu; zgodnie z dispatchem TESTY = NIE DOTYCZY).

## 7. Luki zadeklarowane jawnie (NIE_ZMIERZONO)

- Czy Rust ma komendę zerwania traktatu dobrowolnego (odpowiednik `breakTreatyVoluntarily`, pin `:22741`).
- Nazwa i miejsce realizacji koszyka w Rust (kandydat do ZLOZA-B).
- Czy `restoreGameFromSave` na pinie (`:47264`) ma odpowiednik w Rust, który odtwarza relacje.
- Wpływ ewentualnego `#[serde(default)]` na format zapisu (nie sprawdzano schematu save).
