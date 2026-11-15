# R7K7C-PRODUCER-ROZPOZNANIE: producenci wpisów skarbca AI i puli Pracy

**Zadanie:** #106 (R7K7C-WIRING), dispatch `R-RUSTPORT-P6-R7K7C-PRODUCER-ROZP-Q1`
**Domena:** GAME, tylko odczyt. Zero zmian kodu.
**Baza:** `1b8b67173` (= `origin/rust-port/parity-v2`), worktree detached.
**Pin:** `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/capital-capture.ts`, odczyt przez `git show`).
**Niepewne punkty:** oznaczone `NIE_ZMIERZONO`.
**Historia:** r1 (Operator, 482c64d3e) → Evaluator r1 FAIL (039857a2d) → poprawki obrony r1 (`02a-obrona.md`): zarzuty 1-6 przyjęte, zmiany opisane w §7.

## 0. Ustalenia kluczowe

1. **Pin nie ma pojęcia „wpisu” w sensie Rust.** `aiSkarbiecByOwner` i `aiPracaPoolByOwner` to `Map` tworzone pusto (`main.ts:10260`, `:10283`). Pin nigdy ich nie seeduje przy starcie: wpisy powstają leniwie przy pierwszym `set` (np. `:10246`, `:22642`, `:34870`, `:34892`, `:38978`, `:39755`, `:42572`), są kasowane `clear()` i `delete` (§1a T-I, T-E), a odtwarzane tylko z zapisu (`:46531`, `:47120`). Odczyt zawsze `?? 0` (`main.ts:34865`, `:34877`, `:22642`). **Brak wpisu = 0, nigdy błąd.**
2. **Rust wymaga wpisu i zwraca błąd.** `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1041`) zwraca `brak producenta` dla AI przy delcie skarbca i puli Pracy. Komentarz w kodzie (`:1037-1040`) nazywa to odchyleniem „OTWARTYM”. Wg zasady 9 (`CLAUDE.md`) to odchylenie od webu do usunięcia w #106, bez pytania właściciela (§4).
3. **Żaden producent produkcyjny nie zapisuje wpisów AI ani puli Pracy w Rust.** Są settery `set_owner_treasury` / `set_owner_praca_pool` (`playable.rs:960-979`) bez wołającego poza testami oraz `apply_dipl_deltas_to_state`, którego `advance_turn` (`playable.rs:1158`) nie wywołuje. Wiring to #106 (pending).
4. **Dwie ścieżki Rust, dwa zachowania przy braku wpisu.** `diplomacy_basket.rs:144-157` (gałąź `praca`, funkcja `transfer_basket_items` `:74`) robi `unwrap_or(0.0)` i tworzy wpis, zgodnie z pinem. `apply_dipl_deltas_to_state` rzuca błąd. Pin traktuje oba miejsca identycznie (`?? 0`).
5. **Settery nie podłogują jak pin.** Pin: `setOwnerTreasury` i `setOwnerPracaPool` robią `Math.max(0, value)` (`main.ts:34868`, `:34880`). Rust `set_owner_treasury` (`playable.rs:960-968`) i `set_owner_praca_pool` (`playable.rs:973-979`) sprawdzają tylko skończoność. Uwaga: sama ścieżka delt (`apply_dipl_deltas_to_state`) już podłogę Pracy stosuje (`if value > 0.0`, z komentarzem pinu); brakuje jej w setterach i w skarbcu (pin ścieżki delt skarbca też nie podłoguje, `main.ts:22640-22642`).
6. **Skarbiec AI bez podłogi przy bankowaniu tury** jest świadomie zgodny z pinem (`main.ts:38975-38978`, R-DEFICYT-ZLOTA-KARA-Q1). W Rust nie ma producenta bankowania AI, więc reguła nie istnieje w kodzie.
7. **Przejęcie stolicy: Rust ma już regułę puli Pracy** w `siege_capital_plunder.rs` (obie gałęzie, §1b P-C). Brakuje wpięcia adaptera `OwnerResourceAccess` do `PlayableState` (#115). Ta poprawka zastępuje wcześniejsze twierdzenie „obsługuje wyłącznie skarbiec”.

## 1. Tabela: wpis w pinie, producent, odpowiednik Rust

Legenda: ZGODNE / BRAK / ROZBIEŻNE / NIE_ZMIERZONO.

### 1a. Skarbiec AI (`aiSkarbiecByOwner`; web `ownerTreasury` / `setOwnerTreasury`)

| # | Pin (plik:linia) | Kto tworzy i kiedy | Odpowiednik Rust (plik:linia) | Stan |
|---|---|---|---|---|
| T-R | Odczyt `ownerTreasury` `main.ts:34864-34866` (`?? 0`) | odczyt | `apply_dipl_deltas_to_state` `turn_war_dipl_steps.rs:1062-1076` (błąd przy braku); `dipl_steps_inputs` `turn_war_inputs.rs:726-736` | ROZBIEŻNE (odchylenie do usunięcia w #106, §4) |
| T-S | Setter `setOwnerTreasury` `main.ts:34867-34871` (`max(0)`, AI do `aiSkarbiecByOwner.set`) | wołany m.in. przy kosztach zakupu/budowy (`:4763`, `:4891`, `:5081`), zatrudnieniu administratora (`:10200`), opcji oblężenia (`:18242`), zysku (`:31821`), łupie bitwy (`:34627`) | `set_owner_treasury` `playable.rs:960-968`: brak wołającego w produkcji; brak podłogi `max(0)`; odrzuca właściciela-człowieka (`EconomyOwnerIsHuman`, `:961`) | BRAK producenta, ROZBIEŻNE (podłoga) |
| T-B | Bankowanie tury AI `main.ts:38950-38978`: `aiSkarb = (get ?? 0) + pieniadz − utrzymanieRazem`, potem odjęcie surowców, `set` BEZ podłogi | koniec tury, dla każdego właściciela AI (`isAiOwner`) | brak odpowiednika producenta. `turn_economy.rs:106` (`credit`) i `:329` operują na `treasury: u64` struktury ekonomii, nie na AI. Pierwszy f64 skarbca właściciela w `turn_economy.rs` to `GoldDeficitTick.skarbiec` (`:486`), czyli konsument, nie producent. Czy bankowanie AI jest podpięte: NIE_ZMIERZONO | BRAK |
| T-D | Delta dyplomacji dla AI `main.ts:22638-22642`: gracz `playerState.skarbiec += delta`, AI `aiSkarbiecByOwner.set((get ?? 0) + delta)` bez podłogi | krok dyplomacji (dani, traktaty, trybut) | `apply_dipl_deltas_to_state` `turn_war_dipl_steps.rs:1041-1108`: logika zgodna z pinem poza brakiem wpisu (błąd zamiast 0). Skarbiec gracza `economy.treasury` bez podłogi, zgodnie z pinem `:22640`. Wołającego w produkcji brak | ROZBIEŻNE + BRAK wiringu (#106) |
| T-A | Administrator AI: `aiHireAdministrators` `main.ts:10238-10246` (`get ?? 0`, `set(treasury − koszt)`) | tura AI, max 1 zatrudnienie na właściciela | brak. Odpowiednik `hireAdministrator` w Rust: NIE_ZMIERZONO | BRAK |
| T-I | Czyszczenie: nowa gra `main.ts:10959` (skarbiec) i `:10961` (pula Pracy AI); `:45037` (skarbiec) i `:45039` (pula Pracy AI); wczytanie `:46528` (pula Pracy: clear + odtworzenie z `saved.meta.aiPracaPoolByOwner`, `:46529-46531`) i `:47116` (skarbiec: clear, odtworzenie z `saved.meta.aiSkarbiecByOwner`, `:47118-47120`) | nowa gra / wczytanie | brak producenta startowego w Rust (brak seedu także po stronie pinu). Ścieżka wczytania w Rust: NIE_ZMIERZONO | NIE_ZMIERZONO |
| T-E | Eliminacja: `aiSkarbiecByOwner.delete` `main.ts:35380`, `aiPracaPoolByOwner.delete` `:35381` (oraz `aiNaukaPoolByOwner`, `aiBadanaByOwner`, `aiResearchDone` `:35382-35384`) | eliminacja właściciela | `eliminate_owner` `eliminacja.rs:48`: w pliku brak jakiegokolwiek odniesienia do `ai_treasury_by_owner` ani `praca_pool_by_owner` (zmierzone `git grep`, 0 trafień). Czyści `power_clear_eliminated_owner`, umowy i stan wojny (`:66-69`) | ROZBIEŻNE (zmierzone; #114 in_progress) |
| T-L | Serializacja: serde `ai_treasury_by_owner` `playable.rs:444` (`default`, `skip_serializing_if` pusta) | zapis/odczyt | struktura zgodna; przebieg load NIE_ZMIERZONO | NIE_ZMIERZONO |
| H-T | Skarbiec człowieka: `playerStateByHuman.get(id).skarbiec` (`main.ts:22640`, `:34865`) | gracz | `economy.treasury` (`playable.rs:950-955`, `turn_war_dipl_steps.rs:1103-1105`). Producent bankowania gracza: NIE_ZMIERZONO (`turn_economy.rs:106`) | ZGODNE strukturalnie |
| H-S | Setter skarbca człowieka z podłogą: `setOwnerTreasury` `main.ts:34868` (`Math.max(0, value)`, gałąź `isHuman`, zapis `playerStateByHuman.skarbiec = v`) | koszty, zyski, łupy dla fotela człowieka (ten sam kod co AI) | Brak. `set_owner_treasury` (`playable.rs:961`) odrzuca człowieka błędem `EconomyOwnerIsHuman`, a skarbiec człowieka w `economy.treasury` nie ma setera z podłogą | ROZBIEŻNE (luka: brak podłogowanego setera dla człowieka) |

### 1b. Pula Pracy (`aiPracaPoolByOwner` dla AI; `pracaPoolByHuman` dla foteli; web `ownerPracaPool` / `setOwnerPracaPool`)

| # | Pin (plik:linia) | Kto tworzy i kiedy | Odpowiednik Rust (plik:linia) | Stan |
|---|---|---|---|---|
| P-R | Odczyt `ownerPracaPool` `main.ts:34876-34878` (`?? 0`) | odczyt | `apply_dipl_deltas_to_state` `turn_war_dipl_steps.rs:1089-1095` (błąd przy braku); `dipl_steps_inputs` `turn_war_inputs.rs:738-740` | ROZBIEŻNE (jak T-R) |
| P-S | Setter `setOwnerPracaPool` `main.ts:34879-34893` (`max(0)`; człowiek do `pracaPoolByHuman`, AI do `aiPracaPoolByOwner`) | wołany m.in. przy zwrocie/migracji (`:5126`, `:5134`, `:5176`), zdobyciu (`:17745`, `:17786`), miastach (`:39747`, `:39777`), przejęciu stolicy (§1b P-C), handlu (§1b P-H), koszyku (§1b P-H), `:40271` (§1b P-X) | `set_owner_praca_pool` `playable.rs:973-979`: brak wołającego w produkcji; brak podłogi (gałąź delt ma podłogę, §0 pkt 5) | BRAK producenta, ROZBIEŻNE (podłoga w setterze) |
| P-M | Produkcja miast AI: `aiPracaPoolByOwner.set` `main.ts:39755`, `:39784` (nadwyżka do puli) | koniec tury, miasta AI | brak odpowiednika produkcyjnego. `turn_economy_post.rs:383-412` (`ai_praca_pool_by_owner`, `js_max0(cur − up)`) to osobna mapa `i64`, bez producenta produkcyjnego (wołający tylko w testach) | BRAK, ROZBIEŻNE (dwie mapy) |
| P-U | Ulepszenia AI: `aiPracaPoolByOwner.set` `main.ts:39984` (`max(0, cur − up)`), `:40009` (`pool − usedAi`) | planowanie ulepszeń AI | `turn_economy_post.rs:401-412` (ta sama logika `up`, ale na osobnej mapie) | ROZBIEŻNE (nazwa mapy) |
| P-K | Koszt jednostek AI: `aiPracaPoolByOwner.set` `main.ts:42572`, `:42941`, `:42992` (`poolBefore − koszt`) | zakup jednostki AI | brak. `ai_zakup_jednostki.rs:197` dotyczy `state.treasury` (złoto), nie puli Pracy. Odpowiednik puli: NIE_ZMIERZONO | BRAK |
| P-H | Gałąź `praca` w `transferBasketItems` `main.ts:12586-12589` (`ownerPracaPool(from) − praca`, `+ praca` dla `to`; wykonanie umowy z koszykiem, `dealId`) | wykonanie umowy z koszykiem, gracz lub AI | `transfer_basket_items` `diplomacy_basket.rs:74`, gałąź praca `:144-157` (`unwrap_or(0.0)`, `max(0)`, insert, odczyt `to` PO zapisie `from`) | ZGODNE (zmierzone, ta pozycja) |
| P-Z | Zapłata Pracą w dostawie cyklicznej: `applyCyclicDeliveryOutcome` `main.ts:24015-24016` (`ownerPracaPool(buyer) − zaplata`, `+ zaplata` dla seller; gałąź `zaplataTyp === 'praca'`) | każda tura dostawy cyklicznej, kupujący/sprzedający (gracz lub AI) | brak wykonania. Pola `zaplata_typ` / `zaplata_per_tura` istnieją tylko jako serde w `diplomacy.rs:1461-1463`; konsumenta w `rust-port/engine/src` nie znaleziono (`git grep`, 0 trafień poza polami) | BRAK (poprawka: wcześniej błędnie opisane jako „koszyk”) |
| P-X | Zapis reszty puli fotela człowieka w pętli produkcji: `setOwnerPracaPool(hOid, playerPracaPool)` `main.ts:40271` (blok „R-HOTSEAT-ETAP6C-ECONOMY-Q1”) | tura, pętla zużycia Pracy przez fotel | NIE_ZMIERZONO: pełna ścieżka zużycia Pracy fotela w Rust nie została prześledzona. Wiadomo tylko, że pula fotela to `praca_pool_by_owner[human_id]` (P-F) | NIE_ZMIERZONO |
| P-C | Przejęcie stolicy: pula przepada (`Zdarzenie 1`), eliminacja: pula przelewana do zwycięzcy (`Zdarzenie 2`). Pin: `capital-capture.ts:314` (`applyCapitalCapturePlunder`), komentarz `main.ts:34874-34877` (`setPracaPool(oldOwner, 0)` bezwarunkowo), `main.ts:35641-35642` (Zdarzenie 1: `pracaPoolPrzejeta: 0`, „pula pracy NADAL przepada bez transferu”), `main.ts:35711-35718` (Zdarzenie 2: pula przejęta do zwycięzcy) | zdobycie stolicy | `siege_capital_plunder.rs`: trait `get_praca_pool`/`set_praca_pool` `:59-60`; gałąź eliminacji `:224-229` (transfer do zwycięzcy, potem `set_praca_pool(old, 0)`); gałąź Zdarzenie 1 `:365-372` (`set_praca_pool(old_owner, 0.0)` na `:372`). Zgodne z pinem. Brak wpięcia: produkcyjnej implementacji `OwnerResourceAccess` dla `PlayableState` nie ma (jedyne implementacje to test `tests/p6_siege_capital_plunder.rs:46` i opakowanie barbarzyńskie `:78`) | ZGODNE w logice; BRAK wpięcia (#115) |
| P-F | Pula Pracy fotela człowieka: `pracaPoolByHuman.set` `main.ts:10897` (drugi fotel), `:13904` (przełączenie), `:29722`, `:47005` (wczytanie) | start / przełączenie / wczytanie | człowiek = `praca_pool_by_owner[human_id]`. Producenta w produkcji brak; wpisy tylko w `tests/p6_r7k7c_owner_pools.rs:161-162` | BRAK |

Źródła „przejęcia stolicy” w pinie, które wcześniej były błędnie cytowane: `main.ts:36146` to zwrot `refundedPraca` z `sanitizeBuildQueue` do `oldOwner` (kolejka produkcji, nie stolica); `main.ts:36180` to `totalForfeitedCapture` doliczane do `atkOwner` (zdobywca przejmujący kolejkę z budynkiem stołecznym). Żadne z nich nie jest regułą „pula przepada”.

## 2. Producenci wpisów AI do dopisania w Rust

Kolejność wg zależności.

| Id | Producent | Faza (Rust) | Stan | Zależy od |
|---|---|---|---|---|
| PR-1 | Brak wpisu = 0 (T-R, P-R): parytet 1:1 z pinem (`?? 0`), zapis w `REJESTR-RUST` przy #106 | wejścia D1-D7 (`dipl_steps_inputs`), `apply_dipl_deltas_to_state` | ROZBIEŻNE, decyzja techniczna (nie ABC, §4) | nic |
| PR-2 | Podłoga `max(0)` w `set_owner_treasury` i `set_owner_praca_pool` jak w pinie (`main.ts:34868`, `:34880`) | settery `playable.rs:960-979` | ROZBIEŻNE, brak testu | nic |
| PR-3 | Wiring `apply_dipl_deltas_to_state` w `advance_turn` (#106) | `playable.rs:1158` | BRAK wołającego | PR-1 |
| PR-4 | Bank tury AI (T-B): `(get ?? 0) + pieniadz − utrzymanie − surowce`, bez podłogi | koniec tury | BRAK | ekonomia AI (NIE_ZMIERZONO) |
| PR-5 | Koszty zakupu, budowy i zatrudnienia AI (T-S, T-A, P-K) | tura AI | BRAK | PR-4 |
| PR-6 | Produkcja Pracy miast AI (P-M) i ulepszenia (P-U) | koniec tury | BRAK, dwie mapy | port miast AI |
| PR-7 | Przejęcie stolicy: logika puli (P-C) jest w `siege_capital_plunder.rs`; brakuje adaptera do `PlayableState` | zdobycie | ZGODNE w logice, BRAK wpięcia | #115 ZDOBYCIE-MIASTA-WIRING |
| PR-8 | Eliminacja: czyszczenie `ai_treasury_by_owner` i `praca_pool_by_owner` (T-E; pin kasuje też naukę i badania, `:35380-35384`) | eliminacja `eliminacja.rs:48` | ROZBIEŻNE (zmierzone 0 trafień) | #114 ELIMINACJA-GRACZA |
| PR-9 | Seed i wczytanie puli fotela człowieka (P-F) | start / wczytanie | BRAK producenta w produkcji | nic |
| PR-10 | Ujednolicenie `ai_praca_pool_by_owner` (turn_economy_post) z `economy.praca_pool_by_owner` | ekonomia po turze | ROZBIEŻNE (dwa magazyny) | decyzja strukturalna |
| PR-11 | Zapłata Pracą w dostawie cyklicznej (P-Z, `main.ts:24015-24016`) | tura, dostawy cykliczne | BRAK (konsumenta `zaplata_typ` nie ma) | port dostaw cyklicznych (NIE_ZMIERZONO, nazwa modułu) |
| PR-12 | Zapis reszty puli fotela w pętli produkcji (P-X, `main.ts:40271`) | tura, fotel człowieka | NIE_ZMIERZONO | PR-9 |

## 3. Propozycja wdrożenia (NIE WDRAŻAĆ w tym temacie)

Każdy temat osobno, z allowlistą i wektorami. Nazwy robocze. Wartości wektorów podane jako (wejście → oczekiwane wg pinu).

**T1: R7K7C-SETTERS-FLOOR** (mała zmiana; PR-2)
- Allowlista (propozycja): `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/tests/p6_r7k7c_owner_pools.rs`.
- W1: `set_owner_treasury(ai=7, -5.0)` → skarbiec AI 7 = `0.0` (pin `main.ts:34868`).
- W2: `set_owner_praca_pool(ai=7, -5.0)` → pula Pracy AI 7 = `0.0` (pin `main.ts:34880`).
- W3 (zmienione): `set_owner_treasury(human, -5.0)` → nadal `Err(EconomyOwnerIsHuman)` (projekt Rust). Pin podłoguje też człowieka (`:34868`, gałąź `isHuman`). Rozbieżność H-S: wektor pisany dopiero po wyborze formy podłogowanego setera dla człowieka (decyzja techniczna w tym temacie, nie ABC).

**T2: R7K7C-DIPL-WIRE** (wiring #106; PR-1, PR-3)
- Allowlista (propozycja): `rust-port/engine/src/domain/playable.rs` (`advance_turn`), `rust-port/engine/src/domain/turn_war_pipeline.rs`, testy `p6_r7k7c_owner_pools.rs`. Usunięcie błędu „brak producenta” w `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1062-1095`) i komentarza `:1037-1040`.
- W4: dania AI dla właściciela 7 bez wpisu, delta `+10.0` → `ai_treasury_by_owner[7] = 10.0` (pin `main.ts:22642`: `?? 0 + delta`).
- W5: delta Pracy `+10.0` dla AI 7 bez wpisu → `praca_pool_by_owner[7] = 10.0`; delta `-15.0` → `0.0` (podłoga, pin `:34880`).
- W6: delta skarbca gracza `-30.0` przy `economy.treasury = 20.0` → `-10.0` (bez podłogi, pin `:22640`).
- Zależność: T1 i decyzja techniczna PR-1 (§4).

**T3: R7K7C-BANK-AI** (PR-4)
- Allowlista: moduł bankowania tury AI (nazwa pliku NIE_ZMIERZONO), testy.
- W7: trzy tury z utrzymaniem większym niż dochód → skarbiec AI ujemny bez podłogi (`main.ts:38975-38978`).
- W8: surowce utrzymania odejmowane w kolejności pinu (`main.ts:38968-38970`).
- Zależność: port ekonomii AI (NIE_ZMIERZONO).

**T4: R7K7C-CAPITAL-POOL** (PR-7, PR-8; zależy od #114 i #115)
- Allowlista: `rust-port/engine/src/domain/siege_capital_plunder.rs` (tylko wpięcie adaptera, logika już jest), `rust-port/engine/src/domain/eliminacja.rs`.
- W9: zdobycie stolicy AI 7 przez gracza 3, pula Pracy AI 7 = 40, skarbiec = 100 → zwycięzca dostaje skarbiec (100) i BEZ przelewu puli (Zdarzenie 1: pula zerowana) → pula AI 7 = 0. Dla eliminacji (Zdarzenie 2) ten sam stan: pula 40 przelana do zwycięzcy (`main.ts:35711-35718`).
- W10: eliminacja AI 7 → `ai_treasury_by_owner`, `praca_pool_by_owner`, `nauka_pool` i mapy badań bez wpisu 7 (pin `main.ts:35380-35384`).

**T5: R7K7C-POOL-UNIFY** (PR-10; decyzja strukturalna)
- Allowlista: `rust-port/engine/src/domain/turn_economy_post.rs`, `rust-port/engine/src/domain/playable.rs`.
- W11: `ai_praca_pool_by_owner` i `economy.praca_pool_by_owner` dają ten sam wynik dla tego samego właściciela (`main.ts:39984`, `:40009`).

Wymóg minimum trzech wektorów spełniony (W1 do W11, każdy z wejściem i oczekiwaniem).

## 4. Decyzja techniczna przy #106 (nie pytanie ABC)

Pytanie „brak wpisu = 0 czy błąd” nie wymaga decyzji właściciela. Pin rozstrzyga je jednoznacznie: `?? 0` przy każdym odczycie (`main.ts:22642`, `:34865`, `:34877`), brak seedu przy starcie. Rust zwraca błąd tylko jako odchylenie, które CLAUDE.md zasada 9 każe usunąć bez pytania. Dlatego:

- **Przyjęte rozwiązanie: parytet 1:1 (brak wpisu = 0)**, do zapisania w `dyspozycje/rust-port/REJESTR-RUST.md` przy #106 jako decyzja techniczna.
- **Odrzucona wcześniejsza opcja B (seed 0 przy starcie i wczytaniu).** Pin nie seeduje (§0 pkt 1), więc seed nie daje zachowania pinu. Po eliminacji (`main.ts:35380-35381`) lub dla właściciela spoza seedu Rust zwróciłby błąd tam, gdzie pin zwraca 0. Ta opcja jest więc niezgodna z pinem.
- **Odrzucona opcja C** (zostawić błąd). Nie ma zysku: #106 nie zamknie się, a krok dyplomacji z AI pozostaje zablokowany.
- Pytanie ABC do właściciela: **brak**. Nie ma świadomego odstępstwa od webu, które wymagałoby decyzji (zasada 9). Jeśli #106 ujawni rzeczywisty konflikt z web, wtedy pytanie ABC zgodnie z zasadą 10.

## 5. Niepewne (NIE_ZMIERZONO)

- Czy bankowanie tury AI (T-B) jest podpięte w Rust i pod jaką nazwą modułu.
- Odpowiednik `hireAdministrator` / `aiHireAdministrators` w Rust.
- Ścieżka wczytania zapisu i nowej gry w Rust (T-I).
- Pełna ścieżka zużycia Pracy fotela człowieka (P-X, `main.ts:40271`).
- Nazwa modułu dostaw cyklicznych w Rust (P-Z, PR-11).
- Czy `ai_zakup_jednostki.rs` ma odpowiednik puli Pracy (P-K).
- Testy i bramki (fmt, clippy, cargo test): NIE_ZMIERZONO. Zmiana to wyłącznie dokument (zero kodu), bramki Rust nie dotyczą tej zmiany.

## 6. Metoda

- Pin: `git show 07d2fbd72:gra/src/main.ts` i `gra/src/game/capital-capture.ts`, wyszukiwanie po `aiSkarbiecByOwner`, `aiPracaPoolByOwner`, `setOwnerTreasury`, `setOwnerPracaPool`, `pracaPoolByHuman`, `ownerPracaPool`, `ownerTreasury`, `applyCapitalCapturePlunder`.
- Rust: `git show 1b8b67173:<plik>` i `git grep` po `ai_treasury_by_owner`, `praca_pool_by_owner`, `set_owner_treasury`, `set_owner_praca_pool`, `apply_dipl_deltas_to_state`, `zaplata`, `OwnerResourceAccess`. Wołający w produkcji to wystąpienia poza `tests/` i poza `p6_r7k7c_*`.
- Zmierzone 0 trafień: `eliminacja.rs` (oba pola), `zaplata_typ` / `zaplata_per_tura` poza definicją serde, implementacje `OwnerResourceAccess` dla `PlayableState`.

## 7. Zmiany po obronie r1 (zarzut → poprawka)

- Zarzut 1 (P-C, PR-7, siege_capital_plunder): PRZYJĘTY. Rust ma regułę puli w obu gałęziach (§1b P-C, §0 pkt 7). Luka to wpięcie (#115), nie logika.
- Zarzut 2 (błędne cytaty pin 36146/36180): PRZYJĘTY. Poprawione źródła w §1b (pod tabelą) i w P-C.
- Zarzut 3 (pytanie ABC o „brak wpisu”): PRZYJĘTY. Usunięte z §4, zastąpione decyzją techniczną z uzasadnieniem. Opcja B odrzucona, bo niezgodna z pinem.
- Zarzut 4 (NIE_ZMIERZONO tam, gdzie zmierzono): PRZYJĘTY w części. T-E i PR-8 zmierzone (0 trafień w `eliminacja.rs`). T-I uzupełnione o `:10961`, `:45039`, `:46528-46531` (pula Pracy). T-B: `turn_economy.rs` ma `treasury: u64` w strukturach ekonomii, pierwszy f64 skarbca właściciela to `GoldDeficitTick.skarbiec` (`:486`).
- Zarzut 5 (W1-W11 bez wartości; W3 niewykonalny): PRZYJĘTY. W1-W11 mają wejścia i oczekiwania (§3). W3 przepisany (setter odrzuca człowieka). Dodana luka H-S (brak podłogowanego setera skarbca człowieka).
- Zarzut 6 (pominięte `main.ts:40271`; handel i koszyk niepoprawnie opisane): PRZYJĘTY. Dodane P-X (40271, NIE_ZMIERZONO). Rozdzielone: `12586-12589` = `transferBasketItems` (ZGODNE), `24015-24016` = `applyCyclicDeliveryOutcome` (P-Z, BRAK). Wcześniejsza etykieta „koszyk” dla 24015 była błędna.
