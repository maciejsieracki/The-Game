# R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1 — rozpoznanie wpięcia zlozeGrants (#104)

Status: rozpoznanie, BEZ zmian kodu. Baza: `fc2ed160f` (`origin/rust-port/parity-v2`).
Pin (tylko odczyt): `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/diplomacy-pn-engine.ts`).
Wszystkie linie Rust: `rust-port/engine/src/...` na bazie `fc2ed160f`.
Wersja 2: poprawki po obronie Operatora (zarzuty 1–7, plik `02a-obrona.md`). Zmienione miejsca oznaczone „(popr. v2)".

## 1. Model zlozeGrants

| Element | Pin (web) | Rust (fc2ed160f) | Dowód |
|---|---|---|---|
| typ `ZlozeGrant` | `diplomacy-pn-engine.ts:115` | jest: `ZlozeGrant` (pola: granter/grantee/partner, zloze_id, hex_key, active, deal_id) | `rust-port/engine/src/domain/diplomacy.rs:4185` |
| stan gry `zlozeGrants` | `main.ts:10010` (deklaracja), `:10973` (reset nowej gry) | BRAK pola w stanie (`DiplomacyState` nie ma listy grantów) | grep `zloze_grant\|ZlozeGrant` w `rust-port/engine/src` poza `diplomacy.rs:41xx-42xx` = pusto |
| tworzenie grantu przy realizacji koszyka (kind `zloze`) | `main.ts:12613` (`transferBasketItems`, `:12566`) | BRAK. Typ `BasketItemKind::Deposit` jest (`diplomacy.rs:1740-1760`, serde `zloze`), używany tylko do wyceny (`diplomacy.rs:2002`), nic nie tworzy grantu | `diplomacy.rs:1747`, `:2002` |
| zapis / odczyt w save | `main.ts:37358` (zapis `meta.zlozeGrants`), `:47251-47253` (wczyt) | BRAK | grep pusty |
| licznik debug | `main.ts:30649` | BRAK | - |

Konsument grantów (popr. v2): `git grep -n -i "zloze.*grant\|grant.*zloze\|ZlozeGrant\|suspendZloze\|deactivateZloze\|zlozeGrant" 07d2fbd72 -- gra/src` (bez `*.json`) daje wyłącznie definicje w `diplomacy-pn-engine.ts:115, :331, :346` oraz wywołania w `main.ts` (tabela sekcji 2), plus komentarz `gra/src/game/trade-routes.ts:1817-1818`. Pin NIE ma konsumenta grantów w logice dostępu do złoża poza `main.ts`. Zakres wpięcia = utrzymanie stanu (tworzenie, wygaszanie, zawieszanie, zapis), nie nowa reguła gameplay. Ten punkt jest ZAMKNIĘTY (wcześniej NIE_ZMIERZONO).

## 2. Wywołania w pinie → odpowiednik w Rust

| Pin | Funkcja (pin) | Kontekst | Rust | Status |
|---|---|---|---|---|
| `main.ts:22774` | `deactivateZlozeGrantsForDeal` | `breakTreatyVoluntarily` (`:22741`), dobrowolne zerwanie umowy | brak komendy: w `rust-port/engine/src` nie ma funkcji zrywającej umowę dobrowolnie (popr. v2: `DiplomaticEvent::VoluntaryTreatyBreak` `diplomacy.rs:588, :672` i `CredibilityEvent::ZerwanieDobrowolneTraktat` `credibility.rs:196, :260, :318` istnieją, ale NIE MA żadnego wywołania konstruującego te zdarzenia w `engine/src`) | BRAK (komenda do zbudowania, nie tylko hak) |
| `main.ts:23694` | `deactivateZlozeGrantsForDeal` | `breakTreatiesOnWar` (`:23688`), pętla po `brokenIds` | `treaties_broken_by_war` jest (`alliance_war_obligation.rs:251`) ale używany tylko w testach (`tests/p6_dyplomacja_truce_aggressor.rs:504`) | BRAK |
| `main.ts:24234` | `deactivateZlozeGrantsForDeal` | `runDiplomacyTurnTick` (`:24229`), traktat wygasły w `expireTreaties` | `DiplomacyState::expire_deals` (`diplomacy.rs:1727`) wołane z `turn_war_dipl_steps.rs:917` — BEZ hooka na grant | BRAK (hak do dopięcia w tym miejscu) |
| `main.ts:24294` | `deactivateZlozeGrantsForDeal` | `runDiplomacyTurnTick` D6, zerwanie za daninę | `tribute_break_pairs` (`turn_war_dipl_steps.rs:238`) wołane `:950`; usunięcie umowy NIE wywołuje deaktywacji grantu | BRAK |
| `main.ts:23689` (→ `main.ts:12706`) | `suspendZlozeGrantsForWar` (przez `suspendZlozeOnWar`) | pierwsza linia `breakTreatiesOnWar` — działa też, gdy nic nie zerwano | brak; `suspend_zloze_grants_for_war` nie istnieje w Rust (grep) | BRAK |

Źródła wywołań `breakTreatiesOnWar` na pinie (każde przenosi zawieszenie grantów): `main.ts:11705` (`processDiploCrisisQueue` :11650), `:13169` (`playerDeclareWarOnOwner` :13152), `:13206` (`ownerDeclareWarOn` :13197), `:23809` (`joinAllyToWar` :23797), `:40442` i `:41932` (`runWorldEndTurn` :38130). Po stronie Rust: brak hooka wojny na grantach; rozpoznanie wojny Rust jest w `war_turn_declare.rs` / `turn_war_pipeline.rs` (NIE_ZMIERZONO szczegółów wpięcia — poza zakresem tego rozpoznania). Stan usuwania umów przy wojnie w Rust: sekcja 7.

Wywołanie `deactivateZlozeGrantsForDeal` w `main.ts` jest 4 razy; w Rust 0 razy. Dokument `turn_war_dipl_steps.rs:32-36` już dziś deklaruje tę lukę jawnie („BRAK").

## 2a. Realizacja koszyka — korekta (popr. v2, zarzut 1)

Poprzednia wersja wskazywała jako kandydata `diplomacy.rs:2639`. To błąd: linia 2636 to początek `pub fn build_cyclic_resource_transfers(...)` (`diplomacy.rs:2636`), która buduje wyłącznie transfery cykliczne `QuantityResource` / `Gold` / `Work` i nie obsługuje `Deposit`.

Stan Rust na `fc2ed160f`:
- `BasketItemKind::Deposit` — tylko definicja (`diplomacy.rs:1740-1760`) i wycena (`diplomacy.rs:2002`, gałąź `basket_item_pn`).
- `apply_accepted_proposal` (`diplomacy.rs:4157-4170`) aktualizuje wyłącznie listę `ActiveDeal`; nie przenosi zasobów ani kwot.
- `transfer_quantity_resource` (`diplomacy.rs:2514`) i `transfer_surowiec_ilosc` (`diplomacy.rs:2618`) — transfery pojedynczych kategorii, bez odpowiednika `transferBasketItems`.
- `grep -i basket rust-port/engine/src` (fc2ed160f) nie zwraca żadnej funkcji realizującej koszyk (tylko typy, wycena i sumy PN).

Pin: `transferBasketItems` (`main.ts:12566`) jest wołany z `:12694-12695`, `:24591-24592`, `:24635-24636`, `:35894`, `:35962`. Realizacja koszyka w Rust NIE ISTNIEJE jako funkcja; nie ma punktu zaczepienia dla `zlozeGrants` (push `:12613`).

Wniosek: ZLOZA-B wymaga najpierw portu realizacji koszyka (wszystkie kinds, nie tylko `zloze`) albo decyzji, że port realizacji jest osobnym tematem. Rozmiar ZLOZA-B podnosi się do 3–4 rund (zob. sekcja 5). Ten punkt jest zamknięty: „brak odpowiednika", nie „NIE_ZMIERZONO".

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

1. Stan: `zloze_grants: Vec<ZlozeGrant>` w stanie gry (`PlayableState` lub `DiplomacyState`), reset w nowej grze (pin `:10973`), zapis/odczyt (pin `:37358`, `:47251-47253`). Bez migracji schematu, jeśli pole dodane jako `#[serde(default)]` (do potwierdzenia w temacie wykonawczym; komentarz `diplomacy.rs:4180` wymaga zmiany — zob. sekcja 6).
2. Tworzenie grantu w realizacji koszyka: port realizacji `transferBasketItems` (pin `:12566`, push `:12613`) — NIE istnieje w Rust (sekcja 2a). Kind `Deposit` → grant z `deal_id`.
3. Wygaszanie: `deactivate_zloze_grants_for_deal` w 4 miejscach (pin `:22774`, `:23694`, `:24234`, `:24294`); dla `:22774` najpierw komenda dobrowolnego zerwania (sekcja 2, sekcja 7).
4. Zawieszanie przy wojnie: `suspend_zloze_grants_for_war(grants, a, b)` (pin `diplomacy-pn-engine.ts:331`) — jedno wywołanie, w odpowiedniku `breakTreatiesOnWar`; Rust: `treaties_broken_by_war` (`alliance_war_obligation.rs:251`) jest tylko w testach — hook wojny w produkcji to osobny problem (zob. sekcja 7, #120 CRED-HAK-WYPOWIEDZENIE).
5. Synchronizacja relacji: podpięcie `sync_relation_from_deals` w miejscach pinu z tabeli sekcji 3 (lub świadomie: zakres tylko poza tym tematem).
6. Testy: wektory istnieją (`tests/p6_r7k7b_zloze_sync.rs`, generator `tests/p6_r7k7b_zloze_sync_gen.mjs`, wektory `tests/p6_r7k7b_vectors/vectors.json`). Brak testów integracyjnych „grant powstaje przy transferze → znika po zerwaniu/wojnie/wygaśnięciu".

## 5. Propozycja podziału na tematy wykonawcze (popr. v2, zarzut 4 i 1–2)

Zależności (ujednolicone): **A jest wymagane przez B, C i D** (każdy dotyka stanu grantów). **E jest niezależne od A–D.** Kolejność: A → B, C, D (B, C, D mogą iść po A w dowolnej kolejności); E równolegle z A.

- **ZLOZA-A (stan + zapis + reset)** — pola w stanie, reset (pin `:10973`), serializacja (`:37358`, `:47251-47253`) z `serde(default)`; korekta komentarza `diplomacy.rs:4180` („zadnych nowych pól"). Pliki: `rust-port/engine/src/domain/diplomacy.rs`, moduł stanu/zapisu (NIE_ZMIERZONO dokładnych plików). Rozmiar: 1–2 rundy. Tu musi być zmierzony wpływ `serde(default)` na format zapisu.
- **ZLOZA-B (tworzenie grantu przy transferze koszyka)** — wymaga najpierw portu realizacji koszyka (sekcja 2a), który w Rust nie istnieje; ZLOZA-B obejmuje więc port realizacji (przynajmniej kinds `zloze`, a najpewniej wszystkie kinds `transferBasketItems`). Test: wektory z pinu `transferBasketItems` dla kind `zloze`. Rozmiar (popr. v2): 3–4 rundy; wymaga decyzji o zakresie przed startem.
- **ZLOZA-C (wygaszanie: wygaśnięcie, zerwanie daniną, zerwanie dobrowolne)** — zależy od A. Pin `:24234`, `:24294`, `:22774`. Dla `:22774` trzeba zbudować całą komendę dobrowolnego zerwania (usunięcie umowy, zdarzenie `VoluntaryTreatyBreak`, okno N3 — tu lista zdarzeń już istnieje w `diplomacy.rs:588, :672` i `credibility.rs:196`, ale bez konstruktora), nie tylko hak. Rozmiar (popr. v2): 2–3 rundy.
- **ZLOZA-D (zawieszenie przy wojnie + hook wojny)** — zależy od A; hook `breakTreatiesOnWar` w produkcji wymaga decyzji o zakresie (6 wywołań pinu, sekcja 2). Rozmiar: 2–3 rundy. Ryzyko: duży zakres, styk z `war_turn_declare.rs` i #120; stan usuwania umów w Rust przy wojnie — sekcja 7.
- **ZLOZA-E (sync relacji: wpięcie `sync_relation_from_deals` w 10 miejsc pinu + usunięcie duplikatu)** — niezależne od A–D. Rozmiar: 2 rundy. Ryzyko: część miejsc (`runWorldEndTurn`, `restoreGameFromSave`) dotyka ścieżek poza tym tematem.

## 6. Ryzyka

- Brak konsumenta grantów w pinie poza `main.ts` (sekcja 1): błąd w wpięciu nie da się zobaczyć w dostępie do złoża; testy muszą sprawdzać stan `zloze_grants` wprost.
- Duplikat `sync_relation_status_from_deals` vs `sync_relation_from_deals`: ryzyko rozjazdu, jeśli obie będą rozwijane.
- (popr. v2) Komentarz `rust-port/engine/src/domain/diplomacy.rs:4177-4180` deklaruje „Bez migracji: zadnych nowych pol w stanie gry". ZLOZA-A tę deklarację zmienia; komentarz trzeba zaktualizować w tym samym temacie, a wpływ `serde(default)` na zapis jest NIE_ZMIERZONO do czasu pomiaru w ZLOZA-A.
- (popr. v2) Port realizacji koszyka (sekcja 2a) jest nieznany w rozmiarze; może wpływać na wiele kinds, nie tylko `zloze`. Przed startem ZLOZA-B potrzebna decyzja o zakresie.
- `treaties_broken_by_war` nie jest w produkcji: zawieszenie grantów przy wojnie nie ma hooka bez szerszego wpięcia wojny (sekcja 7).
- Brak NIE_ZMIERZONO: uruchomienia `cargo test` nie wykonano (rozpoznanie tylko do odczytu; zgodnie z dispatchem TESTY = NIE DOTYCZY).

## 7. Luki i ustalenia (NIE_ZMIERZONO oraz stan po obronie)

Zamknięte w wersji 2:
- (zarzut 2) Komenda zerwania dobrowolnego: w `rust-port/engine/src` nie ma funkcji zrywającej umowę dobrowolnie ani konstruktora `DiplomaticEvent::VoluntaryTreatyBreak` / `CredibilityEvent::ZerwanieDobrowolne*`. Zakres ZLOZA-C to cała komenda (sekcja 5).
- (zarzut 3) Konsumenci grantów poza `main.ts` w pinie: brak (sekcja 1).
- (zarzut 7, ustalenie) Ścieżka wojny w Rust: `declare_war_opts` (`rust-port/engine/src/domain/diplomacy_truce_flow.rs:247-273`) ustawia stan rozejmu, wojnę i relację, ale NIE usuwa umów i nie zawiesza grantów. `grep -n "deals.retain"` w `rust-port/engine/src` (fc2ed160f) daje tylko `diplomacy.rs:1723` (upsert umowy) i `diplomacy.rs:1728` (wygaśnięcie). Pin: `breakTreatiesOnWar` (`main.ts:23688`) usuwa zerwane umowy i zawiesza granty. Różnica w produkcji wojny jest więc potwierdzona dla tej funkcji; czy wywołujący (`war_turn_declare.rs`, `turn_war_pipeline.rs`) usuwa umowy innymi drogami — NIE_ZMIERZONO (poza zakresem tego rozpoznania, powiązane z #120).

Pozostają NIE_ZMIERZONO:
- Odpowiednik `restoreGameFromSave` (pin `:47264`) w Rust, który odtwarza relacje z traktatów przy wczytaniu.
- Wpływ `#[serde(default)]` na format zapisu (nie sprawdzano schematu save; mierzy ZLOZA-A).
- Czy plik `gra/src/game/trade-routes.ts:1817` wskazany komentarzem `diplomacy-basket-transfer.ts` istnieje w pinie (nie sprawdzano; wskazówka do ZLOZA-B).
