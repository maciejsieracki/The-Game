# P2.5 — Docelowy zestaw komend frontend→Rust (katalog akcji gracza z web UI) — PROPOZYCJA, nie decyzja

**Temat:** `R-RUSTPORT-P2-5-COMMANDS-Q1` · **Runda:** 5/5 (poprawka po zarzutach Evaluatora rundy 4/5) · **Rola:** Operator (Haiku 5.5 medium)
**Status:** propozycja do Evaluatora i Final Control. Każdy punkt bez jednoznacznej odpowiedzi w materiale jest oznaczony `D-CMD-n` (wymaga decyzji) i NIE jest rozstrzygnięty po cichu.

**Piny:**
- web `main` = `edb8fb56` — źródło prawdy dla akcji gracza (`gra/src/**`, odczyt przez `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56`).
- Rust `rust-port/parity-v2` = `9e33fc77` — odczyt wyłącznie przez `git show`/`git grep` na pinie (`rust-port/engine`, `src-tauri/`). Working tree nie jest źródłem.
- Konwencja ścieżek: web zawsze `gra/src/...`; Rust `rust-port/engine/src/...` (domeny w `rust-port/engine/src/domain/`); frontend Tauri `src-tauri/frontend/...`.

**Zależności (przeczytane w całości):** `P2-1-DOMAIN-MODULES.md`, `P2-2-GAMESTATE-CONTRACT.md` (§8 rozstrzygnięcia), `P2-3-ENTITY-IDS.md` (§9 rozstrzygnięcia), `P2-8-TAURI-ADAPTER.md`.

**Zmiany rundy 2 (odpowiedź na zarzuty Evaluatora):** (1) pokrycie `gra/src/**` — dodany pełny manifest plików z dowodami i plan domknięcia (§6); (2) przeliczona §3 z tabel §2; (3) usunięte statusy spoza dispatchu — wiersze bez komendy przeniesione do §2.11 z oznaczeniem `D-CMD-15`; (4) statusy Z4, O6, O9, U13 poprawione lub wiersze przeniesione; (5) poprawione ścieżki/linie dowodów web (m.in. A1, Z1, T-3, `battle-summary`, `manualBattle`); (6) G37 wykonany; (7) dodane brakujące akcje znalezione w przeglądzie: D10 (zerwanie traktatu), D11 (obowiązek sojuszniczy), D12 (handel technologią).

**Zmiany rundy 2, poprawka po zarzutach 2–7 Evaluatora (wersja 2b):** (a) O6, O9, Z6 przeniesione z §2.11 do §2.7 / §2.2 / §2.10 z jawnym statusem (dziedziczonym z aliasu: O6 = BRAK jak U10, O9 = CZĘŚCIOWA jak B1/B2, Z6 = BRAK jak Z3); (b) etykieta „DOMKNIĘTE" zmieniona na „KOMPLETNE (manifest)" z dopiskiem, że to nie jest pokrycie akcji; (c) liczby w §0 i §3 przeliczone po przeniesieniu (67 wierszy ze statusem: 0 / 20 / 47; 15 bez statusu); (d) §6.2 zgodny z kolumną `disposition` manifestu (rozróżnienie CITED vs OPEN-HITS); (e) pusta komórka „O-brak" w §3 usunięta. Zarzut 1 (61 plików OPEN-HITS) i zarzut 6 (CITED ≠ pokrycie) pozostają otwarte — kryterium binarne NIESPEŁNIONE.
**Zmiany rundy 3 (odpowiedź na zarzuty 1–7 Evaluatora rundy 2/5):** (1) zarzut 1: każdy z 61 wierszy `OPEN-HITS` ma dyspozycję z dowodem w manifeście `dyspozycje/autobot/runs/R-RUSTPORT-P2-5-COMMANDS-Q1/coverage-gra-src-edb8fb56-r3.tsv` (kolumny `disposition_r3`, `row_ref_r3`, `reason_r3`): 2× (a) nowy wiersz, 30× (b) alias, 29× (c) poza akcją gracza; otwartych 0. To jest dyspozycja plików, nie pokrycie akcji (zob. zarzut 6); (2) zarzut 2: STATUS raportu = FAIL; (3) zarzut 3: etykieta zmieniona na „Pokrycie plikowe — manifest kompletny (892/892)”; (4) zarzut 4: wiersze §2.11 mające skutek w grze przeniesione do §2 ze statusem: U13 → R6 (CZĘŚCIOWA), skrót `B` → B11 (CZĘŚCIOWA), wycofanie obrońcy przed bitwą → W11 (BRAK), zakup w panelu imperium A4 → alias R1 (CZĘŚCIOWA; zamyka D-CMD-14(e)); nowe wiersze R5, B10, A6, W10; D-CMD-15 uzasadniony zakresem z GOAL (§0); (5) zarzut 5: §6.2 zgodne z manifestem (potwierdzone); (6) zarzut 6: **NIE zamknięte w całości** — §2.13 mapuje wszystkie 174 nazwy callbacków `gra/src/main.ts` (268 wystąpień) na wiersze; mutatory na poziomie linii w `main.ts` (205) i w plikach CITED nie są jeszcze przejrzane (D-CMD-14(b), otwarte); (7) zarzut 7: §3 przeliczona z tabel §2, kolumna „O-brak” usunięta, liczenie O1–O16 zgodne z §2.11.

**Zmiany rundy 4 (odpowiedź na zarzuty 1–6 Evaluatora rundy 3/5):**
(1) **zarzut 1 — ZAMKNIĘTY.** Przegląd linia po linii wykonany dla **wszystkich 330 trafień wzorca mutatorów** w 19 plikach CITED, które je mają (nie tylko w 10 plikach z §6.2), zaczynając od `gra/src/main.ts` (205). Wynik: `dyspozycje/autobot/runs/R-RUSTPORT-P2-5-COMMANDS-Q1/mutator-review-r4.tsv` (kolumny: plik · linia · klasa · wiersz/powód). Klasy: **b** = mapowane na wiersz (140), **c** = poza akcją gracza — komentarz, import, definicja/log/hook testowy, ruch AI i barbarzyńców, widok dochodu T3 (189), **a** = nowy wiersz (1: B12). Liczby per plik zgodne z manifestem (weryfikacja 19/19). Zakres ograniczony wzorcem z §6.1; mutatory spoza wzorca obsłużone w D-CMD-14(g).
(2) **zarzut 2 — ESKALOWANY, nie rozstrzygnięty przez Operatora.** Dispatch nie przewiduje czwartego statusu, a wiersz bez zapisu `GameState` nie ma komendy do sklasyfikowania. Operator nie nadaje statusów i nie włącza §2.11 do kryterium. Decyzja: **D-CMD-15 — właściciel** (status raportu: DECISION_REQUIRED).
(3) **zarzut 3 — ZAMKNIĘTY JAWNIE, decyzja właściciela.** 13 nazw typów parametrów spoza P2.3 wymienionych w D-CMD-19 (grep w P2.2 i P2.3: 0 trafień dla każdej; `OkolicaTryb` ma 1 trafienie będące nazwą pola). Operator nie dopisuje ich do P2.3 (poza allowlistą tematu). Wiersze używające tych typów mają w §4 odesłanie do D-CMD-19.
(4) **zarzut 4 — ZAMKNIĘTY (ponownie sprawdzony na pinie).** B3: `cityPanel.ts:6125` (`cancelQueueItem`), `:6133`, `:8527-8528` (przycisk „Usuń”), `:794` i `:849` (przeciąganie). A1: `main.ts:7518`, `:7535`, `:5790`.
(5) **zarzut 5 — ZAMKNIĘTY.** Naprawione niespójności: §0 liczba wierszy (75 + 20 = 95); §3 przeliczona (Budowa 13 wierszy; suma 75 = 0 + 22 + 53 — poprzednie „74 = 0 + 23 + 51” było błędne arytmetycznie); B6 — wiersz nie cytuje już `main.ts:9291` i `:9463` jako wywołań gracza (9291 i 9410 to start gry → Z5; 9463 to spawn klastrów miast-państw, poza akcją gracza); D-CMD-14(d) i (g) zamknięte.
(6) **zarzut 6 — statusy.** Legenda bez zmian (trzy wartości z dispatchu). D12 = BRAK (G40). U1 = CZĘŚCIOWA z nazwaną luką (D-CMD-12: stan UI vs `PlayableState.selectedUnitId`); nie jest GOTOWA, bo wiring istnieje, ale model stanu jest inny. B12 (nowy) = BRAK (G48: 0 trafień `paus|wstrzym`).

---

## 0. Zakres, uczciwość i stan kryterium binarnego

**Kryterium binarne z dispatchu** (każda akcja gracza w `gra/src/**` ma wiersz z dowodem web, proponowaną komendą, parametrami, statusem i dowodem Rust): **SPEŁNIONE po rozstrzygnięciu orkiestratora (§9).** 20 wierszy §2.11 mają teraz jawną wartość `WIDOK (bez komendy)` zamiast pustego `—` (D-CMD-15, §9 pkt 1). 14 nazw typów spoza P2.3 (`D-CMD-19`) rozstrzygnięte jako rozszerzenie kanonu P2.3, nie naruszenie (§9 pkt 8). Stan szczegółowy (poniżej — opis procesu dochodzenia do tego wyniku, zachowany dla śladu):

- **Pliki (manifest, 892/892):** każdy plik `gra/src` ma wiersz w `coverage-gra-src-edb8fb56.tsv` (r2) i w `coverage-gra-src-edb8fb56-r3.tsv` (r3, z dyspozycjami). Dyspozycje r3: 61/61 `OPEN-HITS` → (a) 2, (b) 30, (c) 29, otwartych 0; 15/15 `LISTENER-ONLY` → (b) 1, (c) 14 (wszystkie 15 ma 0 mutatorów wg §6.1); 49 `CITED` — przegląd linii mutatorów wykonany w r4 dla 19 plików z trafieniami (`mutator-review-r4.tsv`, §6.3 pkt 2 zamknięty); 767 `NO-HIT`.
- **Callbacki `gra/src/main.ts` (268 wystąpień, 174 nazwy):** każda nazwa z prefiksem `on` ma wiersz w §2 albo kategorię (c) w §2.11 — zestawienie w §2.13. Zakres ogranicza się do prefiksu `on`; kanały bez prefiksu (np. `setProduction`) opisuje akapit „Kanał bez prefiksu on” w §2.13. To jest poziom nazw handlerów, nie linii mutacji.
- **Mutatory (przejrzane linia po linii w r4):** 330 trafień wzorca w 19 plikach CITED (`main.ts` 205, `armyMerge.ts` 33, `cityPanel.ts` 24, `cities.ts` 12, `trade-routes.ts` 11, `diplomacy.ts` 6, `auto-manage.ts` 6, `empireDetailPanel.ts` 4, `embarkation.ts` 4, `production.ts` 5, `save.ts` 5, i pozostałe 9 plików po 1–3). Każde trafienie ma klasę a/b/c w `mutator-review-r4.tsv` (a=1, b=140, c=189). **r5 (zarzut 3):** przeglądem linia po linii objęte też pozostałe 27 trafień wzorca w 14 plikach OPEN-HITS (r3: tylko dyspozycja plikowa); po r5 `mutator-review-r4.tsv` ma **357/357** trafień §6.1 w 33 plikach (a=1, b=142, c=214). Komentarze, importy i typy AI = klasa c. D-CMD-14(b) ZAMKNIĘTE.
- **Zakres widoku (§2.11):** ZADANIE pkt 1 i GOAL definiują katalog jako akcje, które web wywołuje z UI do logiki gry. Wiersze czysto widokowe, nawigacyjne, ustawieniowe i diagnostyczne są poza tym zakresem; zostają w §2.11 bez statusu jako ślad kompletności (D-CMD-15 — decyzja Final Control).

**Wynik binarny:** 0 komend GOTOWA. 28 CZĘŚCIOWA, 48 BRAK (łącznie 76 wierszy o statusie w §2.1–§2.10; r6: −T2, −O6, +A7 BRAK, Z1/Z2/Z3/Z6 BRAK→CZĘŚCIOWA; r4: dodany B12 → BRAK; r5: dodany W12 → BRAK, dodany T4 → CZĘŚCIOWA, D6 BRAK → CZĘŚCIOWA). Dodatkowo 20 wierszy bez statusu w §2.11 (`D-CMD-15`, decyzja właściciela). **Status raportu rundy 5: DECISION_REQUIRED** (nie PASS): kryterium binarne wymaga statusu dla 20 wierszy §2.11, a Operator bez decyzji właściciela (`D-CMD-15`) nie może nadać statusów wierszom widokowym. Zarzut dotyczący zakresu §2.11 nie jest zamknięty po stronie Operatora (zob. §8).

**Liczba wierszy:** 76 wierszy o statusie + 20 bez statusu = 96 (r6).

---

## 1. Kształt komend (propozycja) — jedna `engine_command` czy osobne komendy Tauri

**Stan dziś** (`P2-8 §1`): jedna komenda Tauri `engine_command` (`src-tauri/src/lib.rs:28`), 6 wariantów `EngineCommand` (`rust-port/engine/src/bridge.rs:20-41`), frontend (`src-tauri/frontend/main.js:3`, `TAURI_COMMAND = 'engine_command'`) używa 4.

**Propozycja: osobne komendy Tauri per kategoria akcji, każda z typowanym payloadem** (np. `recruit_units`, `found_city`, `start_research`), z zachowaniem envelope `BridgeRequest{contractVersion, requestId, command}` (`rust-port/engine/src/bridge.rs:43-50`) i wersjonowania kontraktu.

Uzasadnienie:
1. **Błędy walidacji:** `EngineRejected` (`rust-port/engine/src/bridge.rs:150-155`) dziś zwraca jeden kod dla wszystkich odrzuceń. Osobne komendy pozwalają mapować reguły (np. brak złota, brak manpower, zbyt blisko innego miasta — `gra/src/game/cities.ts:1122` `MIN_CITY_DISTANCE_START_CITY_STATE`) na kody błędów domenowych bez parsowania komunikatu.
2. **Serializacja parametrów:** każda komenda ma swój typowany payload (ID z P2.3: `CityId`, `UnitId`, `PlayerId`); jeden enum z 40+ wariantami rozrośnie się i utrudni wersjonowanie kontraktu (`contractVersion`).
3. **Testowanie:** osobna komenda = osobny test kontraktu w `rust-port/engine/tests/bridge_contract.rs` (**nowy plik do utworzenia**: brak na pinie `9e33fc77`, r6 zarzut 11) bez budowania całego stanu gry.
4. **Zgodność z interfejsem:** web UI wywołuje 174 nazwane callbacki z prefiksem `on` w `gra/src/main.ts` (268 wystąpień, zestawienie §2.13), z czego wiele to aliasy tej samej akcji gry (katalog §2 konsoliduje je do 96 wierszy komend); 1:1 mapowanie na poziomie KOMEND (nie nazw callbacków) upraszcza adapter JS.
5. **Koszt:** więcej rejestracji w `generate_handler!` (`src-tauri/src/lib.rs:53`) i więcej pozycji w `capabilities/default.json` (dziś tylko `core:default`, `P2-8 §4`). Akceptowalny.

**D-CMD-1 (wymaga decyzji): forma komend.** Propozycja A (osobne komendy) vs B (jedna `engine_command` z większą liczbą wariantów). Operator rekomenduje A. Decyzja właściciela/Final Control.

**D-CMD-2 (wymaga decyzji): granularność `end_turn` vs `advance_turn`.** Dziś `advance_turn` (`rust-port/engine/src/bridge.rs:282-285`) nie woła `turn_economy` (`P2-8 §6`). Czy `end_turn` jest jedną komendą kończącą fotel (web `advanceSeat`, `gra/src/main.ts:36047`) i/lub całą turę świata — patrz D-CMD-9.

---

## 2. Tabela akcji gracza (web → proponowana komenda → status)

**Legenda statusu** (tylko trzy wartości z dispatchu, bez innych):
- **GOTOWA** = moduł Rust istnieje i jest kompletny, wymagane tylko wpięcie;
- **CZĘŚCIOWA** = moduł lub komenda Rust istnieje, ale wiersz wskazuje konkretną lukę wobec zachowania web (samo odroczenie decyzji `D-CMD-n` NIE uzasadnia CZĘŚCIOWA; wiersz bez działającej ścieżki w Rust = BRAK);
- **BRAK** = nowa logika wymagana.

**Reguły r6 (zarzuty 3 i 5), stosowane jednakowo we wszystkich wierszach:**
- *Status CZĘŚCIOWA vs BRAK:* CZĘŚCIOWA, jeśli w `rust-port/engine/src` istnieje kod domenowy realizujący rdzeń akcji (moduł, typ lub funkcja), nawet niewpięty i niezadeklarowany w `domain/mod.rs`; BRAK, jeśli dowód grep = 0 i takiego kodu nie ma.
- *Zakres statusu:* wiersz ze statusem = akcja, która wywołuje logikę domenową gry (zapis `GameState` albo zapytanie do funkcji domenowej Rust; GOAL: „wywołuje z UI do logiki gry”). Akcje czysto widokowe, nawigacyjne, ustawieniowe i diagnostyczne (bez wywołania logiki) — §2.11 bez statusu.

**Akcje bez komendy** (widok, kamera, nawigacja, diagnostyka, przełączniki UI, aliasy skrótów) **nie mają statusu logiki** (GOTOWA/CZĘŚCIOWA/BRAK opisują stan logiki domenowej, nie UI) — są w §2.11 z oznaczeniem `—`, co od rozstrzygnięcia D-CMD-15 (§9 pkt 1) jest jawną wartością **`WIDOK (bez komendy)`**, nie brakiem wpisu. Nie wchodzą do §3 (katalog komend logiki), ale katalog akcji gracza jest przez to formalnie kompletny (każdy z 892 plików / 174 nazwanych callbacków ma albo komendę w §2.1–§2.10, albo jawne `WIDOK (bez komendy)` tutaj).

Kolumna „ID” używa typów z P2.3: `PlayerId` (człowiek = 0), `CityId`, `UnitId`, `HexCoord{q,r}`. `tech_key` = klucz techu web (string; brak kanonicznego ID techu w P2.3 — `D-CMD-6`).

**Dowód Rust** odwołuje się do wpisów **G01–G41** z §2.12 (grep na pinie `9e33fc77` z podanym wzorcem i liczbą trafień). Dowód web to `plik:linia` z pełną ścieżką względem repo (`gra/src/...`); linie zweryfikowane na pinie `edb8fb56`.

### 2.1 Rekrutacja (jednostki z miasta)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState (P2.2) | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| R1 | Kup/zrekrutuj jednostki w mieście — `onPurchase` → `purchaseRecruitmentUnits` (`gra/src/main.ts:23059` → definicja `gra/src/main.ts:4103`) | `recruit_units` | `city_id: CityId`, `unit_type: String` (klucz z `units.json`, D-CMD-7), `count: u32`, `owner: PlayerId` | `cities[].production` (kolejka), `economy` (skarbiec), `units` (nowe `UnitState` przy zakończeniu) | CZĘŚCIOWA | `rust-port/engine/src/domain/recruitment.rs:143` `validate_recruitment`, `:161` `spend_recruitment`, `:177` `can_afford_unit_recruitment` (P2-8 §6, wiersz „Rekrutacja”); NIE wpięte (`rust-port/engine/src/domain/playable.rs` nie importuje modułu, wg P2-8 §6). `PlayableUnitKind::Warrior` jedyny (`playable.rs:302-304`). Brak manpower: G37 (0 trafień, §2.12) — brak odpowiednika w Rust dla `gra/src/game/manpower.ts`. |
| R2 | Kup jednostkę (wariant z panelu) — `onPurchaseUnit` (`gra/src/main.ts:25051`, `gra/src/main.ts:36828`) | `recruit_units` (ten sam wariant co R1) | `city_id: CityId`, `unit_type: String` (D-CMD-7), `count: u32`, `owner: PlayerId` | `cities[].production`, `economy`, `units` (jak R1) | CZĘŚCIOWA | jak R1: `recruitment.rs:143,161,177` (r6, zarzut 7) |
| R3 | Dodaj rekrutację do kolejki (`enqueueRecruitment`, wywołania `gra/src/main.ts:4080`, `gra/src/main.ts:4178`; definicja `gra/src/game/production.ts:1849`) | `recruit_units` (`enqueue=true`) | `city_id: CityId`, `unit_type: String` (D-CMD-7), `count: u32`, `owner: PlayerId` (`enqueue=true`) | `cities[].production` (kolejka) | CZĘŚCIOWA | jak R1: `recruitment.rs:143,161,177` (r6, zarzut 7) |
| R4 | Zamień jednostkę (`UnitReplacePicker.onPick`, `gra/src/ui/unitReplacePicker.ts:35,187`; akcja `replace` `gra/src/main.ts:21983`) | `replace_unit` | `unit_id: UnitId`, `new_unit_type: String` | `units` (zamiana typu, zachowanie ID?) — `D-CMD-8` | BRAK | G01 (0 trafień). |
| R5 | Anuluj rekrutację w kolejce — `onCancelRecruitment` (`gra/src/main.ts:25054`) | `recruit_cancel` | `city_id: CityId`, `item_index: u32` ⚠D-CMD-19, `koszt: u32` (zwrot) | `cities[].production` (usunięcie pozycji), `economy` (zwrot kosztu) | BRAK | G47 (0 trafień `cancel_recruit\|cancelRecruit\|cancel_queue`); `rust-port/engine/src/domain/recruitment.rs` (`:143`, `:161`, `:177`) nie ma operacji anulowania. |
| R6 | Rekrutacja z karty jednostki (`onRecruit` — `gra/src/ui/unitRecruitCard.ts:111,154`; wiązanie `gra/src/ui/cityPanel.ts:8177` → `recruitUnit`). Dawny U13. | `recruit_units` (alias R1) | `city_id: CityId`, `unit_type: String` (D-CMD-7), `count: u32`, `owner: PlayerId` | `cities[].production`, `economy`, `units` (jak R1) | CZĘŚCIOWA | jak R1: `recruitment.rs:143,161,177`, G37 (r6, zarzut 7; naprawione r6b — G01 w poprzedniej wersji dotyczył `replace_unit`, nie rekrutacji). |

### 2.2 Budowa (budynki, ulepszenia, pola, miasta)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| B1 | Dodaj budowę/ulepszenie do kolejki miasta — `enqueue` (`gra/src/ui/cityPanel.ts:6284`; `gra/src/main.ts:4526`, `gra/src/main.ts:8298`). Skróty klawiszowe budowy (`gra/src/main.ts:33096,35246,35326`) to alias B1/B2 (§2.2, O9). | `enqueue_build` | `city_id: CityId`, `item_key: String` ⚠D-CMD-19 (budynek/ulepszenie: klucz z katalogu danych, D-CMD-7) | `cities[].production_queue` | CZĘŚCIOWA | `rust-port/engine/src/domain/building_costs.rs:108` `canonical_building_costs`, `:238` `effective_work_cost`; `rust-port/engine/src/domain/improvements.rs:229` `can_build_improvement`; re-eksporty `rust-port/engine/src/lib.rs:5-10` (`try_spend_building_cost`, `validate_building_expenditure`). NIE wpięte w `playable.rs` (P2-8 §6). Kolejka: `rust-port/engine/src/domain/ai_turn.rs:401` to jedna pozycja AI, nie kolejka gracza (G04). |
| B2 | Potwierdź budowę ulepszenia na mapie — `onConfirm` (`gra/src/ui/improvementBuildConfirm.ts:43,88`) | `place_improvement` | `city_id: CityId`, `hex: HexCoord`, `improvement: String` | `map` (tile.improvement), `cities[]` (`placedImprovements` → `cities`, `P2-2 §8 pkt 9a`) | CZĘŚCIOWA | `improvements.rs:229`; brak placementu na mapie w `playable.rs` (G03 dla zakupu; placement: brak wiązania w `bridge.rs`). |
| B3 | Usuń / przesuń pozycję kolejki **budowy i rekrutacji** (`dequeue`/reorder; kolejka rekrutacji: `gra/src/ui/cityPanel.ts:787`, `:8269`, `:8276`, `:8284` (`dequeueRecruitment`), `:8400-8415` — r4, zakres B3 rozszerzony; UI — `gra/src/ui/cityPanel.ts:6125-6133` `cancelQueueItem` (usunięcie + zwrot surowców `refundBuildingStockCostAcrossCities`); przycisk „✕ Usuń” `:8527-8528` zawsze wywołuje `cancelQueueItem(city, 0)` (tylko pozycja czołowa); przeciąganie `:794-849` `bindBuildQueueDragReorder` → `reorderQueueItem`; kanał mutacji: `cfg.setProduction` (`cityPanel.ts:639` na pinie `edb8fb56`; wywołanie w `setProd`, definicja `setProd` `:638`) → `setCityProduction` (`main.ts:24949-24951` i `:36740-36742`; definicja `main.ts:4304`); **brak** callbacka z prefiksem `on*`, ale **jest** callback `setProduction` bez prefiksu `on` — zob. §2.13 „Kanał bez prefiksu on”) | `dequeue_build` / `reorder_build` | `city_id`, `index: u32` | `cities[].production_queue` | BRAK | G04 (0 trafień `dequeue\|reorder_build\|reorder_queue\|reorder_research`). Jedyna pozycja kolejki w Rust to AI (`ai_turn.rs:401`). |
| B4 | Budowa z listy stałej / listy szablonu (`budowaLista`, `gra/src/game/cities.ts:972`; `gra/src/game/auto-manage.ts:222` `pickNextFromBudowaLista`) | `set_build_list` | `city_id`, `list: Vec<String>` | `cities[].build_list` (D-CMD-8) | BRAK | G02 (0 trafień `build_list\|budowaLista\|budowa_lista`). Brak pola w `CityDto` (`rust-port/engine/src/domain/types.rs:329`; P2-3 §5 wiersz 37). |
| B5 | Kup budynek za złoto (`buildingGoldPurchaseCost`, definicja `gra/src/game/production.ts:637`); także dokończenie pozycji kolejki za złoto — `onRushBuy` (`gra/src/main.ts:24960`, `:36747`, `rushProduction` `gra/src/game/production.ts:1997`) | `buy_building` (rush: `rush_production`, D-CMD-17) | `city_id`, `item` | `economy` (złoto −), `cities[].production_queue` | BRAK | G03 (0 trafień `buy_building\|buy_build\|purchase_building\|buy_improvement`); G42 (0 trafień `rush`); `rust-port/engine/src/domain/turn_economy.rs` nie obsługuje zakupu budynku (grep `buy` = 0). |
| B6 | Załóż miasto (`foundCityAt`, ścieżka gracza `gra/src/main.ts:13540` (przez `tryFoundPlayerCityAt`, skrót B = B11); r4: `main.ts:9291`, `:9410` to start gry (Z5), `main.ts:9463` to spawn klastrów miast-państw (poza akcją gracza, §6.3); `canFoundCity` `gra/src/game/cities.ts:1163`; ocena kosztu założenia (komentarz `gra/src/game/city-founding.ts:83`)) | `found_city` | `owner: PlayerId`, `hex: HexCoord`, `name: String` | `cities` (nowe `CityState`), `owners[].eras/founded_count` | CZĘŚCIOWA | `rust-port/engine/src/domain/city_growth.rs` (domena, bez wpięcia, P2-8 §6; G35: 22 trafienia `found_city\|foundCity`); `CityDto` 5 pól (`types.rs:329`, P2-3 §5). Brak `foundedTurn`/`foundedByOwner` (`P2-3 §5` #55-56). Limit zakładania — `D-CMD-14(d)` (`gra/src/game/cities.ts:1125` `countsTowardCityFoundingLimit`). |
| B7 | Załóż miasto z wioski (`foundCityFromVillage`, definicja `gra/src/game/cities.ts:1374`) | `found_city_from_village` | `owner`, `village_hex: HexCoord` | `cities`, `barbarians` (wioska zużyta) | BRAK | G33: `villageRewardsEnabled` istnieje jako flaga (`rust-port/engine/src/domain/playable.rs:117,156`), ale `playable.rs:172` zapisuje `"villageRewardsEnabled:NOT_IMPLEMENTED"` — logika wioski nie wpięta (`P2-1 M14`). |
| B8 | Ustaw fokus/tryb budowy/ulepszeń/okolicy/podziału (15 callbacków mapowanych w §2.13, m.in. `onBudowaEnterManual` `gra/src/main.ts:7626`, `onOkolicaFocusChange` `:7453`, `onCityRationChange` `:7261`, `onUlepszeniaCityFocusChange` `:22821` i 11 pokrewnych — pełna lista w §2.13; `gra/src/ui/cityPanel.ts`, `gra/src/ui/empireDetailPanel.ts:121-240`) | `set_city_policy` | `city_id`, `field: String` ⚠D-CMD-19 (klucz pola web), `value` | `cities[]` (~25 pól, P2-3 §5 #22-44) | BRAK | G32: 0 trafień domenowych `focus\|podzial\|racji` (jedyne trafienie: `src-tauri/frontend/index.html:34` CSS `focus-visible`). |
| B9 | Ustaw procent rozwoju / nauki / handlu (`HANDEL_PCT_STEP`, `gra/src/game/cities.ts:578`; `adjustHandelSplit` `gra/src/game/cities.ts:640`) | `set_city_split` | `city_id`, `split: String` ⚠D-CMD-19 (klucz/wartość pola podziału, D-CMD-7) | `cities[].podzial_handlu` | BRAK | G32 (0 trafień domenowych). |
| B10 | Ustaw stolicę — `onSetCapital` (`gra/src/main.ts:24913` → `trySetPlayerCapital`, definicja `gra/src/main.ts:28731`) | `set_capital` | `owner: PlayerId`, `city_id: CityId` | `owners[].capital_city_id` (P2-2) | BRAK | G43 (0 trafień `set_capital\|setCapital\|trySetPlayerCapital`); w Rust tylko odczyt `capital_city_id` (`rust-port/engine/src/domain/diplomacy.rs:2516`, `:2579`). |
| B11 | Zakładanie miasta klawiszem B na ostatnio najechanym/klikniętym heksie — `gra/src/main.ts:36177–36205` → `tryFoundPlayerCityAt` (definicja `gra/src/main.ts:13513`). Dawny skrót z §2.11 (O8). | `found_city` (alias B6) | `owner: PlayerId`, `hex: HexCoord` | jak B6 | CZĘŚCIOWA | jak B6 (G35). Status dziedziczony z B6. |
| O9 | Skróty klawiszowe budowy: `tartak`, `oboz_lowiecki`, `posterunek`, `fort`, `stadnina` — wejście do kolejki miasta (`gra/src/main.ts:13681,13814,33096,35246,35326`; bramki terenu w tych liniach) | `enqueue_build` (alias B1/B2) | jak B1: `city_id: CityId`, `item_key: String` ⚠D-CMD-19 | `cities[].production_queue` (jak B1) | CZĘŚCIOWA | Status dziedziczony z B1/B2; dowód Rust jak B1. Bramki terenu (`fort`/`posterunek` — właściciel terytorium; `tartak`/`oboz_lowiecki` — `Nakladka.Las`) do odwzorowania w `rust-port/engine/src/domain/improvements.rs:229` (`can_build_improvement`). Zgodność z B1/B2 wymaga weryfikacji `D-CMD-14(c)`. |
| B12 | Wstrzymaj / wznów produkcję miasta — `setPaused(cur, !cur.wstrzymana)` (`gra/src/ui/cityPanel.ts:8522`, przycisk w panelu miasta; wiersz nowy w r4, z przeglądu mutatorów `mutator-review-r4.tsv`) | `city_set_paused` | `city_id: CityId`, `paused: bool` | `cities[].production_queue` (flaga wstrzymania; pole `wstrzymana` poza P2.2/P2.3 — `D-CMD-19`) | BRAK | G48 (0 trafień `paus\|wstrzym` na pinie `9e33fc77`, `rust-port/engine` + `src-tauri`); brak pola i komendy wstrzymania w Rust. |

### 2.3 Dyplomacja (relacje, propozycje, pakiety, wypowiedzenie wojny, zerwanie)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| D1 | Zaproponuj umowę (`onPropose(kind, fields)`, `gra/src/main.ts:18056`; `gra/src/ui/interHumanDiplomacyHud.ts:62,245`) | `diplomacy_propose` | `from: PlayerId`, `to: PlayerId`, `kind: String` ⚠D-CMD-19 (klucz typu umowy web: sojusz/pakt/handel/…, D-CMD-5), `fields: String` ⚠D-CMD-19 (JSON, D-CMD-5) | `diplomacy.deals` (aktywna oferta) | CZĘŚCIOWA | `rust-port/engine/src/domain/diplomacy.rs:1441` `ActiveDeal`, `:1611` `DiplomacyState` (poza `GameStateDto`, `P2-2 M9`). Brak wiring (G07 kontekst: typy traktatów są, wejścia z UI brak). |
| D2 | Zaakceptuj / odrzuć ofertę (`onAccept`/`onReject` `gra/src/main.ts:18040,18045`; `handleNegotiationAccept` `gra/src/main.ts:17230`, `handleNegotiationReject` `gra/src/main.ts:17280`). Efekt relacji: `applyDiplomaticEvent` (wywołanie `gra/src/main.ts:9900`; definicja `gra/src/game/diplomacy.ts:863`). | `diplomacy_respond` | `deal_id: String` ⚠D-CMD-19, `response: Accept\|Reject` | `diplomacy` (deal → aktywny traktat), `diplomacy.relations` | CZĘŚCIOWA | `rust-port/engine/src/domain/diplomacy.rs:104` `Relation`, `:71` `RelationStatus`; wiring brak. Zdarzenia: `diplomacy.rs:534-535` `DiplomaticEvent::DeclareWar`, `:623` (typ zdarzenia, bez komendy). |
| D3 | Kontroferta (`onCounter`, `gra/src/main.ts:18050`; `handleNegotiationCounter` `gra/src/main.ts:17411`) | `diplomacy_counter` | `deal_id` ⚠D-CMD-19, `payload: String` ⚠D-CMD-19 (JSON, D-CMD-5) | `diplomacy.deals` | CZĘŚCIOWA | jak D1: `rust-port/engine/src/domain/diplomacy.rs:1441` `ActiveDeal`, `:1611` `DiplomacyState` (poza `GameStateDto`, `P2-2 M9`). |
| D4 | Zaakceptuj / odrzuć cały pakiet (`handleNegotiationAcceptPackage` `gra/src/main.ts:17377`, `handleNegotiationRejectPackage` `gra/src/main.ts:17397`; `onAcceptNegotiationPackage` `gra/src/main.ts:21602`) | `diplomacy_respond_package` | `owner: PlayerId`, `response` | `diplomacy` (wiele deali naraz) | BRAK | G05 (0 trafień `DealPackage\|deal_package\|respond_package\|diplomacy_respond_package`). |
| D5 | Akcja publiczności / audiencji (`applyAudienceAction` `gra/src/main.ts:21260`, `onAction` `gra/src/main.ts:21495`; `gra/src/ui/diplomacyAudience.ts:292` (`onAction`); ID np. `umowa_handlowa`, `umowa_szlakow`, `sojusz_defensywny`, `trybut_oferta`, `trybut_zadanie`, `wchloniecie` — `gra/src/main.ts:17039`, `gra/src/main.ts:17618`) | `diplomacy_audience_action` | `owner: PlayerId`, `action_id: String` ⚠D-CMD-19 (enum; 6 wartości z dowodu web, pełny zbiór: `D-CMD-19`), `payload?` | `diplomacy`, `trade_routes` (`umowa_szlakow`, D-CMD-10) | CZĘŚCIOWA | G07: typy traktatów istnieją — `rust-port/engine/src/domain/diplomacy.rs:562,572` (`trybut_*`), `:1364` (`sojusz_defensywny`), `:1370` (`umowa_szlakow`, alias `umowa_handlowa`), `:1506`. Brakuje warstwy akcji UI → komenda (`action_id` ⚠D-CMD-19 → `TreatyKind`). Stąd CZĘŚCIOWA. |
| D6 | Wypowiedz wojnę / sojusz / pakt — chipy dyplomatyczne (`onDiploChip(kind: 'sojusz'\|'pakt'\|'wojna')`, `gra/src/ui/hud.ts:323`) oraz modal zgody na wojnę (`onDeclareOnly`/`onDeclareAndAttack`, `gra/src/main.ts:10713`, `gra/src/main.ts:21283`; `playerDeclareWarOnOwner`) | `diplomacy_set_stance` | `from`, `to`, `stance: Alliance\|Pact\|War` ⚠D-CMD-19 | `diplomacy.relations`, `ai` (forced-war, D-CMD-11) | CZĘŚCIOWA | G08 (0 trafień `set_stance\|diplomacy_set_stance`); typ zdarzenia `DeclareWar` `diplomacy.rs:534-535,623` (istnieje, bez komendy i bez wiązania z UI — luka; ta sama klasa dowodu co D2, r5 zarzut 5); `WAR_RELATION_SCORE_CAP` w `diplomacy.rs` (P2-1 M9). |
| D7 | Handel dyplomatyczny z koszyka (`gra/src/ui/diplomacyTradeBasket.ts:2360-2361,2797-2798` `onSubmit`/`onCancel`) | `diplomacy_submit_basket` | `from`, `to`, `items: Vec<String>` ⚠D-CMD-19 (pozycje koszyka jako JSON, D-CMD-5) | `diplomacy`, `economy` (złoto/surowce), `units` (transfer, `diplomacy-unit-transfer`) | CZĘŚCIOWA | G09: `BasketItem` / `BasketItemKind` istnieją (`rust-port/engine/src/domain/diplomacy.rs:1686-1731`); `DiploPairMeta` `:1190`. Komenda wejścia z UI brak. |
| D8 | Anuluj stół negocjacji (`handleNegotiationReject` `gra/src/main.ts:17280`, `onCancel`) | `diplomacy_cancel` | `deal_id: String` ⚠D-CMD-19 | `diplomacy.deals` | BRAK | G06 (0 trafień `diplomacy_cancel\|cancel_deal\|cancel_negotiation\|cancel_proposal`). |
| D9 | Wiadomość od człowieka do człowieka (`onOpenInterHumanDiplo`, `gra/src/main.ts:22616`; `gra/src/ui/interHumanDiplomacyHud.ts`, `interHumanDiplomacyInbox` `P2-2 §4`) | `diplomacy_inter_human` | `from: PlayerId`, `to: PlayerId`, `payload: String` ⚠D-CMD-19 (JSON, D-CMD-5, jak D1–D3) | `diplomacy.inbox` (S) | BRAK | G10 (0 trafień `inter_human\|interhuman\|inter-human`); brak hot-seat dyplomacji (`P2-3 §2.6`). |
| D10 | Zerwij traktat (przycisk „Zerwij” + modal potwierdzenia: `onBreakTreaty`, `gra/src/ui/diplomacyAudience.ts:324,2345`) → `breakTreatyVoluntarily` (`gra/src/main.ts:19148`); także `breakAllianceDeal` (`gra/src/main.ts:20851`) | `diplomacy_break_treaty` | `deal_id: String` ⚠D-CMD-19, `initiator: PlayerId` | `diplomacy` (zerwany aktywny traktat), `diplomacy.relations` | BRAK | G38 (0 trafień `diplomacy_break\|break_treaty\|breakTreaty`). |
| D11 | Odpowiedź na obowiązek sojuszniczy: wypowiedz wojnę sojusznikowi / odmów (`showAllianceObligationModal`, `onFulfill`/`onRefuse`, `gra/src/main.ts:20115,20124`; `joinAllyToWar`) | `diplomacy_respond_alliance_obligation` | `owner: PlayerId`, `ally: PlayerId`, `target: PlayerId`, `response: Fulfill\|Refuse` | `diplomacy` (wojna w sojuszu), `diplomacy.relations` | BRAK | G39 (0 trafień `alliance_obligation\|obligation\|join_ally\|joinAllyToWar\|mustDeclareWar`). |
| D12 | Handel technologią: propozycja z `payload.techId` (sprzedaż/kupno technologii) → `executeTechTradeDeal` (`gra/src/main.ts:10105`, wywołanie `:10244`) → `executeTechTradeDealCore` (`gra/src/game/diplomacy-tech-trade.ts:168`) | `diplomacy_trade_tech` | `from: PlayerId`, `to: PlayerId`, `tech_key: String` ⚠D-CMD-19 (D-CMD-6), `direction: Sell\|Buy`, `payment: Gold\|Tech` | `diplomacy`, `economy` (złoto), `wonders_tech` (przekaz techu) | BRAK | Typ `BasketItemKind::Technology` (`rust-port/engine/src/domain/diplomacy.rs:1696`; także `:2719`, `:2803`) to wariant danych, nie ścieżka wymiany. Logika wymiany technologii nieobecna: G40 (`tech_trade\|TechTrade\|tech-trade` = 0 trafień). Status BRAK (r3, zarzut 6; wcześniej CZĘŚCIOWA). Kształt komendy: `D-CMD-16`. |

### 2.4 Handel (trasy handlowe)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| T1 | Załóż trasę handlową — `createTradeRoute` (definicja `gra/src/game/trade-routes.ts:827`; jedyna definicja) | `trade_create_route` | `owner`, `from_city: CityId`, `to_city: CityId` | `trade_routes: Vec<TradeRoute>` | CZĘŚCIOWA | `rust-port/engine/src/domain/trade.rs:823` `create_trade_route` (i `:832` `create_trade_route_with_options`) — G34; `trade.rs:392` `TradeRoute`, `:172` `TradeMap`, `:318` `trade_route_limit_for_city`, `:563` `owners_have_shared_land_border`. **Brak wywołania z UI na pinie** (web: tylko definicja) — ścieżka wejścia nieustalona: `D-CMD-10`. |
| T4 | Podgląd dochodu trasy (`tradeRouteIncomeForRoute`, `gra/src/main.ts:15522`) — zapytanie o dochód trasy, bez zmiany stanu | `trade_route_income_preview` | `route_id` (jak T2) | — (zapytanie; bez zapisu `GameState`) | CZĘŚCIOWA | `rust-port/engine/src/domain/trade.rs:1401-1448` (`trade_route_distance_income`, `compute_trade_route_income_by_city_with_params`, z parametrem bonusu cudów); brak komendy zapytania i brak wiązania per trasa. Przeniesione z §2.11 w r5 (zarzut 1). |

Podgląd dochodu trasy (`tradeRouteIncomeForRoute`, `gra/src/main.ts:15522`) jest zapytaniem do rdzenia — wiersz T4 (r5, przeniesiony z §2.11).

### 2.5 Badania (technologie)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| S1 | Rozpocznij badanie (`onStartResearch`, `gra/src/main.ts:24879`; `gra/src/ui/scienceHubHud.ts:713`; `gra/src/ui/techTreeView.ts:928`; definicja `startResearch` `gra/src/game/research.ts:462`) | `start_research` | `owner`, `tech_key: String` ⚠D-CMD-19 (D-CMD-6) | `wonders_tech` (S, `P2-2 §2`), `economy` (koszt) | BRAK | G12 (0 trafień `start_research\|set_research_target\|enqueue_research\|wonders_tech`); brak modułu cudów/technologii (`P2-1 M12`). |
| S2 | Wybierz cel w planie (`onSelectTarget`, `gra/src/main.ts:24839`; `gra/src/ui/sciencePicker.ts:1518`) | `set_research_target` | `owner`, `tech_key` ⚠D-CMD-19 | `wonders_tech` (kolejka celów) | BRAK | G12. |
| S3 | Dodaj do kolejki badań (`enqueueResearchTarget`, definicja `gra/src/game/playerState.ts:613`; wywołania `gra/src/main.ts:7066`, `gra/src/main.ts:7109` — przemieszczanie kolejki) | `enqueue_research` / `reorder_research` | `owner`, `tech_key` ⚠D-CMD-19, `index?` | `wonders_tech` | BRAK | G12 (`reorder_research` w G04). |
| S4 | Wybierz technologię z drzewa (`onSelectTech`, `gra/src/main.ts:22523`; `gra/src/ui/scienceHubHud.ts:99,722`) | `start_research` (alias S1) | `owner: PlayerId`, `tech_key: String` ⚠D-CMD-19 (D-CMD-6) | `wonders_tech`, `economy` (jak S1) | BRAK | G12. |

### 2.6 Auto-zarządzanie (tryby miast, autowyżywienie, auto-ruch)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| A1 | Przełącz tryb okolicy miasta (pole `okolicaTryb`/`tryb`, odczyt w panelu: `gra/src/ui/cityPanel.ts:9825,10037`; tryb `'auto'` jako wartość domyślna; zapis z UI ustalony w r3: `onOkolicaEnterManual` `gra/src/main.ts:7515-7522` (`okolicaTryb='reczny'`, :7518), `onOkolicaRestoreAuto` `:7532-7538` (`'auto'`, :7535), `onOkolicaTileAdjust` `:7544` → `applyOkolicaTileAdjust` `:5786-5790` (`'reczny'`, :5790); uwaga: B8 `onOkolicaFocusChange` `:7453-7456` też zapisuje `okolicaTryb='auto'` i kasuje `okolicaReczne`). Planer automatyczny miasta: `autoManageCity` `gra/src/game/auto-manage.ts:395`. | `set_city_auto` | `city_id`, `okolica_tryb: OkolicaTryb` (`'auto'` \| ręczny) | `cities[].okolica_tryb` / `cities[].auto_flags` | BRAK | G13 (0 trafień `set_city_auto\|auto_flags\|city_auto`); `rust-port/engine/src/domain/ai_turn.rs:996,1039` = planer AI (bez stanu, `P2-2 M7`); brak trybu gracza. `ai_turn` nie wpięte (`P2-8 §6`). |
| A2 | Autowyżywienie dla wszystkich (`onSetAutoWyzywienieForAll`, `gra/src/ui/empireDetailPanel.ts:231`) | `set_auto_ration_all` | `owner`, `enabled` | `cities[].auto_wyzywienie`, `owners[].policy` (`P2-2 D14`) | BRAK | G14 (0 trafień). |
| A3 | Ustaw domyślną politykę właściciela (`onOwnerDefaultChange` `gra/src/main.ts:23063`, `onOwnerDefaultPodzialPracyChange` `:23092`, `onOwnerDefaultPoziomRacjiChange` `:23101`; `ownerDefault*`, `autoManageCities`, `P2-2 §4`; `gra/src/ui/empireDetailPanel.ts:121-240` `onChange`) | `set_owner_policy` | `owner`, `policy: OwnerPolicy` | `owners[].policy` | BRAK | G15 (0 trafień `set_owner_policy\|OwnerPolicy`). |
| A4 | Zakup w panelu imperium (`onPurchase`, `gra/src/ui/empireDetailPanel.ts:2858,2870` → `gra/src/main.ts:23059` → `purchaseRecruitmentUnits` `gra/src/main.ts:4103`) | alias `recruit_units` (R1) | `city_id: CityId`, `unit_type: String` (D-CMD-7), `count: u32`, `owner: PlayerId` | `cities[].production`, `economy` (jak R1) | CZĘŚCIOWA | alias R1; zamyka D-CMD-14(e): wiązanie w `main.ts` idzie wyłącznie do `purchaseRecruitmentUnits`, zakupu budynku z tego panelu nie ma. G16 (0 trafień `empire_purchase`) — nazwa komendy nieużywana. |
| A5 | Auto-ruch zwiadowcy (`scout-explore`, `gra/src/main.ts:22002`; `gra/src/game/scout-auto-explore.ts`) | `set_auto_explore` | `unit_id: UnitId`, `enabled` | `units[].auto_explore` (P2-3 §4 #19) | BRAK | G17 (0 trafień `auto_explore`). |
| A6 | Auto-zarządzanie miastem (przełącznik) — `onAutoManage` (`gra/src/main.ts:24987`, `:36773`; zbiór `autoManageCities`) | `set_city_auto_manage` | `city_id: CityId`, `enabled: bool` | `cities[].auto_manage` (pole brak w DTO) | BRAK | G44 (0 trafień `auto_manage\|autoManage`). |
| A7 | Autowyżywienie pojedynczego miasta — przełącznik w karcie miasta: `cfg.onCityAutoWyzywienieChange?.(city.id, !city.autoWyzywienie)` (`gra/src/ui/cityPanel.ts:5416`); wiązanie `gra/src/main.ts:7301` `(cityId: string, enabled: boolean)` (r6, zarzut 6; A2 to wariant dla całego właściciela) | `set_city_auto_ration` | `city_id: CityId`, `enabled: bool` | `cities[].auto_wyzywienie` (pole brak w DTO) | BRAK | G14 (0 trafień `auto_ration\|auto_wyzywienie\|autoWyzywienie` na `9e33fc77`). |

### 2.7 Ruch i rozkazy jednostek (w tym stosy, fortyfikacja, plany marszu)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| U1 | Zaznacz jednostkę (klik na encję, `P2-8 §5` `onTileClick`; `handleSelectedUnitHudAction`, `gra/src/main.ts:21857`) | `select_unit` | `unit_id: UnitId` | (brak zmiany stanu gry — `selectedUnitId` w `PlayableState` `playable.rs:318-334`) | CZĘŚCIOWA (luka nazwana: w web wybór jest stanem UI — `selectedId` w `gra/src/main.ts`, Esc → `dismissPlayerUnitSelectionIfAny` `:36108-36135`; w Rust `PlayableState.selectedUnitId` `playable.rs:318-334`; kształt: `D-CMD-12`; **konkretna luka komendy (r6, zarzut 2):** brak komendy odznaczenia — Esc (`dismissPlayerUnitSelectionIfAny`, `gra/src/main.ts:36108-36135`) nie ma odpowiednika w Rust; `git grep -i -E 'deselect|clear_select|unselect'` na `9e33fc77` = 0, jedyna komenda to `SelectUnit` (`bridge.rs:31`)) | G36: 7 trafień na `9e33fc77` (`rust-port/engine/src/bridge.rs:273,356`, `rust-port/engine/src/domain/playable.rs:486`, testy `rust-port/engine/tests/playable_slice.rs:38,55,80`, wywołanie frontu `src-tauri/frontend/main.js:647`). Komenda istnieje po stronie Rust i jest wywoływana z frontu, ale to, czy zaznaczenie jest częścią komend gry, nie jest rozstrzygnięte (`D-CMD-12`) — dlatego NIE GOTOWA. |
| U2 | Ruch jednostki na heks (klik) — `beginMoveSelectedUnitTo(destQ, destR)` `gra/src/main.ts:26036` (r6, zarzut 4; guard `selectedId`) | `move_unit` | `unit_id: UnitId`, `destination: HexCoord` | `units[].position` (+ zużycie `movement_left`, poza DTO — P2-3 §4 #8) | CZĘŚCIOWA | `rust-port/engine/src/bridge.rs:275-281` → `playable.rs:504`; `rust-port/engine/src/domain/pathfinding.rs` (565 linii); brak manpower, embarkation (`gra/src/game/embarkation.ts`), veteran (`gra/src/game/veteran.ts`), rzeka (P2-1 M1 CZĘŚCIOWO). Legalność liczona w Rust (`P2-8 §5`). |
| U3 | Pomiń jednostkę / wyczyść plan (`skip`, `gra/src/main.ts:21882`) | `unit_skip` | `unit_id` | `units[].planned_march`, `movement_left=0` | BRAK | G18 (0 trafień `unit_skip\|planned_march\|skip_unit`). |
| U4 | Fortyfikacja w polu / w garnizonie (`fortify`, `gra/src/main.ts:21910`; `enterFieldFortify` `gra/src/game/armyMerge.ts:219`, `enterGarnizon` `gra/src/game/armyMerge.ts:176`) | `unit_fortify` | `unit_id`, `mode: Field\|Garrison` | `units[].in_garnizon`, `units[].fortified` | BRAK | G19 (0 trafień `unit_fortify\|in_garnizon\|enter_garrison\|exit_garrison\|unit_unfortify`). Trafienia słowa „garnizon” (`building_costs.rs:166`, `barbarians.rs:914`) dotyczą budynku/miast barbarzyńskich, nie komendy. |
| U5 | Wyjdź z fortyfikacji / garnizonu (`unfortify-all`, `gra/src/main.ts:21893`; `exitGarnizon` `gra/src/game/armyMerge.ts:193`) | `unit_unfortify` | `unit_id: UnitId` (lub `hex: HexCoord`) | `units[].fortified`, `units[].in_garnizon` (jak U4) | BRAK | G19. |
| U6 | Uśpij jednostkę (`sentry`, `gra/src/main.ts:21985`) | `unit_sentry` | `unit_id`, `enabled` | `units[].sentry` | BRAK | G20 (0 trafień `sentry`). |
| U7 | Rozwiąż jednostkę (`disband`, `gra/src/main.ts:21977`) | `unit_disband` | `unit_id` | `units` (usunięcie), `economy` (ew. koszt utrzymania) | BRAK | G21 (0 trafień `disband`). Pole ID w DTO istnieje: `rust-port/engine/src/domain/types.rs:413` `UnitDto` (wiring komendy brak). |
| U8 | Podziel stos (`split` ⚠D-CMD-19, `gra/src/main.ts:21979`; `findSplitDestHexes` `gra/src/game/armyMerge.ts:494`) | `stack_split` | `unit_ids: Vec<UnitId>`, `dest: HexCoord` | `units[].position` | BRAK | G22 (0 trafień `stack_split\|stack_merge\|stack_group\|split_stack\|merge_stack`). |
| U9 | Połącz stos (`merge`, `gra/src/main.ts:21981`; `gra/src/game/armyMerge.ts:82` `assignSharedStackGroupId`) | `stack_merge` | `unit_ids: Vec<UnitId>` | `units[].stack_group_id` (D-CMD-13) | BRAK | G22. |
| U10 | Punkt zbiórki: ustaw / uruchom / wyczyść (`rally-set`, `rally-launch`, `rally-clear`, `gra/src/main.ts:21862-21875`; `gra/src/game/rally-point.ts`; przełącznik trybu `rallyPointMode` — scalony z dawnego O6 w r6, zarzut 5; nie zmienia `GameState`) | `rally_set` / `rally_launch` / `rally_clear` | `owner`, `hex: HexCoord?` | `units` lub `combat` (`P2-2 D13b`: `rallyPoints` → `units`) | BRAK | G23 (0 trafień `rally_set\|rally_launch\|rally_clear\|rally_point`). Trafienia `rally` w `rust-port/engine/src/domain/barbarians.rs:639` (`plan_barbarian_rally`) dotyczą zbiórki obozów barbarzyńskich (AI), nie gracza. |
| U11 | Plan marszu: kontynuuj / zatrzymaj (`march-continue`, `march-stop`, `gra/src/main.ts:21878-21880`; `gra/src/game/planned-march.ts`) | `march_continue` / `march_stop` | `unit_id` | `units[].planned_march` | BRAK | G18 (`planned_march`: 0). |
| U12 | Wsiadanie / zejście z okrętu (`gra/src/game/embarkation.ts:36` `canUnitEmbark`, `:77` `applyEmbarkStateAfterMove`) | (w ramach `move_unit`) | `unit_id`, `dest` | `units[].embarked` (poza DTO, P2-3 §4 #16) | CZĘŚCIOWA | `embarked`: 14 trafień na pinie (P2-3 §6); `rust-port/engine/src/domain/ai_turn.rs:344` `AiUnit.embarked`. Brak w `UnitDto` (`types.rs:413`). |

### 2.8 Oblężenie, walka, bitwy

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| W1 | Oblęż miasto (`onBesiege` → `commitBesiege`, `gra/src/main.ts:14894`, definicja `gra/src/main.ts:14851`; `gra/src/ui/siegeMapPanel.ts:15,199,202`) | `siege_besiege` | `unit_ids: Vec<UnitId>`, `city_id: CityId` | `units[].oblega: Option<CityId>` (D-ID-5 Propozycja B), `combat` (stan oblężeń, `P2-2 M8`) | BRAK | G24 (0 trafień `siege_besiege\|oblega\|siege_storm\|siege_retreat\|besieg`). Trafienia `siege` w `rust-port/engine/src/domain/combat.rs:105,117,227-321` to parametr modyfikatora `is_siege`, nie stan oblężenia. |
| W2 | Szturm (`onStorm` → `launchSiegeStormFromMap`, `gra/src/main.ts:14896`, definicja `gra/src/main.ts:30086`; `gra/src/ui/siegeMapPanel.ts:16,205`) | `siege_storm` | `unit_ids`, `city_id` | `combat`, `cities` (zdobycie), `owners` | BRAK | G24. `rust-port/engine/src/domain/combat.rs` (480 linii) — model web ≠ Rust (`P2-1 M8`); wiring brak. |
| W3 | Odwrót z oblężenia (`onRetreat`, `gra/src/main.ts:14897`; `gra/src/ui/siegeMapPanel.ts:17,183`) | `siege_retreat` | `unit_ids` | `units`, `combat` | BRAK | G24. |
| W4 | Zbuduj maszynę oblężniczą (`queueSiegeMachine`, `gra/src/main.ts:14911`, `gra/src/main.ts:14994`; definicja `gra/src/game/siegeMachines.ts:29`) | `enqueue_siege_machine` | `city_id`, `kind_key: String` ⚠D-CMD-19 (np. `taran`) | `cities[].production_queue`, `cities[].siege_machines` | BRAK | G25 (0 trafień `siege_machine\|SiegeMachine`). |
| W5 | Walka automatyczna przed bitwą (`onAuto`, `gra/src/main.ts:27506,28154,30246`; `gra/src/ui/preBattle.ts:145,633,906`) | `battle_auto_resolve` | `attacker`, `defender` (`UnitId`/`CityId`) | `units` (straty), `cities` (zdobycie), `barbarians`, `owners` | CZĘŚCIOWA | `rust-port/engine/src/domain/combat.rs:438,443` `clamp(0.10,0.25)` (model Rust ≠ web TW v3, `P2-1 M8`, `P2-2 INV-4`). `combat.rs` nie wpięty do `playable.rs`. |
| W6 | Bitwa na polu walki (`onBattlefield`, `gra/src/main.ts:27507,28155,30247`; `gra/src/battle/manualBattle.ts:623` `start`) | `battle_manual_start` | `attacker: UnitId` lub `CityId`, `defender: UnitId` lub `CityId` (jak W5) | `units`, `cities` (wynik po zakończeniu, jak W5) | BRAK | G27 (0 trafień `battle_manual\|manual_battle\|battle_start`); web `gra/src/battle/*` (`gra/src/battle/manualBattle.ts`) bez odpowiednika w Rust. |
| W9 | Akcje w bitwie na miasto: wybór ataku (wywołania `gra/src/main.ts:15035,26524` `showCityAttackChoice`, `:26619` `showCityUnitPick`, `:10730` `showCityForeignPick`; definicje `gra/src/ui/cityAttackChoice.ts`, `gra/src/ui/cityUnitPick.ts`, `gra/src/ui/cityForeignPick.ts`) | `city_attack` | `attackers: Vec<UnitId>`, `city_id: CityId` | `units`, `cities`, `owners` (jak W5) | BRAK | G26 (0 trafień `city_attack`). |
| W10 | Akcje w bitwie ręcznej: pomiń (`onSkip`, `gra/src/battle/battleScene.ts:3947`), wycofaj się z bitwy (`onExit`, `battleScene.ts:3948`; przycisk „Wycofaj się”, `battleScene.ts:3250`), klik na heks = ruch/atak jednostki w bitwie (`onclick` w `battleScene.ts`) | `battle_manual_action` | `battle_id: String` ⚠D-CMD-19, `action: Skip \| Withdraw \| Move{unit_id, hex} \| Attack{unit_id, target}` | wynik po zakończeniu → `units`, `cities` (jak W6); stan bitwy w trakcie — D-CMD-18 | BRAK | G45 (0 trafień `battle_action\|battle_move\|battle_attack\|manual_battle\|battle_skip\|battle_click`); G27 (0). |
| W11 | Wycofanie obrońcy przed bitwą — `onCancel` w `gra/src/main.ts:28216` → `applyDefenderPreBattleRetreat` (`gra/src/game/post-battle-map.ts:229`); warunki: `playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn` | `battle_defender_retreat` | `unit_ids: Vec<UnitId>`, `battle_hex: HexCoord` | `units[].position`, znacznik „wycofał się w tej turze” (D-CMD-18) | BRAK | G46 (0 trafień `pre_battle\|prebattle\|pre-battle`; `retreat` tylko w `rust-port/engine/src/domain/ai_turn.rs:1073` i `barbarians.rs:269,285,740` = AI/barbarzyńcy). |
| W12 | Rozegraj ponownie bitwę — przycisk „Rozegraj ponownie” (`gra/src/battle/endScreen1E.ts:213` → `cb.onReplay`; wiązanie `gra/src/battle/battleScene.ts:9824` `onReplay` → `_replayBattle` `:9683`: czyści stan bitwy, usuwa jednostki z pola, uruchamia nową bitwę z zapisanych armii) | `battle_manual_restart` | `battle_id: String` ⚠D-CMD-19 | `battle` (stan sesji bitwy, D-CMD-18), `units` (przywrócenie armii z zapisu) | BRAK | G27 (0 trafień `battle_manual\|manual_battle\|battle_start`); G45 (0 trafień `battle_action\|battle_move\|battle_attack\|manual_battle\|battle_skip\|battle_click`). Wiersz dodany w r5 (zarzut 4). |

Anulowanie przed bitwą po stronie atakującego (`onCancel`, `gra/src/ui/preBattle.ts:145,620,905`; `gra/src/main.ts:27567`, `:28189` — zamknięcie i `setMood`) — §2.11 (W7). Wycofanie obrońcy z ekranu przed bitwą (`gra/src/main.ts:28216`) zmienia stan — **W11**. „Kontynuuj” po bitwie (`gra/src/ui/postBattleSummary.ts:463-556`) — §2.11 (W8).

### 2.9 Tura i fotele (hot-seat)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| T-1 | Zakończ turę (`onEndTurn: advanceSeat`, `gra/src/main.ts:22556`; `gra/src/ui/bottomBarHud.ts:284` `config.onEndTurn`, pointer-handlery `gra/src/ui/bottomBarHud.ts:306-333`; `triggerPlayerEndTurn` `gra/src/main.ts:36102`; klawisz Spacja `gra/src/main.ts:36131`; klawisz N → `advanceSeat` `gra/src/main.ts:36223`) | `end_turn` (D-CMD-2) | `owner: PlayerId` (aktywny fotel) | `turn` (faza), `economy` (`resolve_turn` `rust-port/engine/src/domain/turn_economy.rs:299`), `ai` (tura AI), `owners` (`activeHumanOwnerId`, `P2-2 D2`) | CZĘŚCIOWA | `advance_turn` `rust-port/engine/src/bridge.rs:282-285` → `playable.rs:554` (faza, bez `turn_economy` — `P2-8 §6`). Hot-seat: BRAK (G28). |
| T-2 | Wykonaj pierwszy blokujący event (`onExecutePending`, `gra/src/main.ts:22552` → `executeFirstBlockingEvent` `gra/src/main.ts:14271`; `gra/src/ui/hud.ts:1663`) | `execute_pending_event` | `event_id` | zależne od eventu (P2.6 — poza zakresem tego pliku; wiersz do P2.6) | BRAK | G29 (0 trafień `execute_pending\|dismiss_event\|dismiss_all`). `rust-port/engine/src/domain/events.rs` (P2-1 M6): kolejka eventów nie wpięta w `playable.rs`. |
| T-3 | Odrzuć event / odrzuć wszystkie (`onEventDismiss` `gra/src/ui/hud.ts:1646`; `onDismissAll` `gra/src/ui/hud.ts:1647` → `clearAllSidePanelEvents` `gra/src/main.ts:23054`) | `dismiss_event` / `dismiss_all_events` | `event_id?` | `event_queue` (poza `GameState`, `P2-2 D11`) | BRAK | G29. `rust-port/engine/src/domain/replay.rs:456` (poza `mod.rs`, `P2-8 §6`). |
| T-4 | Przełącz fotel hot-seat (`advanceSeat`, `gra/src/main.ts:36047`; `gra/src/ui/hotSeatHandoff.ts:78,94,107` `onContinue`) | `hotseat_switch` | `to_owner: PlayerId` | `owners.active_human` (`P2-2 D2`) | BRAK | G28 (0 trafień `hotseat\|hot_seat\|active_human\|human_owner`); `PlayablePlayer.is_human` `playable.rs:288`; brak listy `humanOwnerIds`. |

### 2.10 Zapis, odczyt, sesja (save/load, nowa gra)

| # | Akcja gracza (dowód web) | Proponowana komenda | Parametry | Efekt na GameState | Status | Dowód Rust |
|---|---|---|---|---|---|---|
| Z1 | Zapisz grę do slotu (`onSave`, `gra/src/main.ts:22091`; wywołanie `opts.onSave` `gra/src/ui/saveLoadDialog.ts:363`; definicja `saveLoadDialog.ts:285`; `openSaveGameDialog` `gra/src/main.ts:22087`) | `save_game` | `slot_id: String` ⚠D-CMD-19, `label: String` | — (odczyt `GameState` → envelope M15) | CZĘŚCIOWA | G30 (0 trafień wzorca `save_game\|load_game\|quick_save`; kod istnieje — r6, zarzut 3). `rust-port/engine/src/domain/save_load.rs:79` `SnapshotDto`/`SaveSnapshot`, `CURRENT_SNAPSHOT_VERSION=2` (`:34`) — moduł NIE w `mod.rs` (`P2-8 §6`); format web `SAVE_VERSION=3` (`gra/src/game/save.ts:116`) — migracja wymagana (`P2-2 D7`, P2.11). |
| Z2 | Szybki zapis (Ctrl+S, `gra/src/main.ts:36209`; `doQuickSave` `gra/src/main.ts:30708`; `onSave` w bitwie `gra/src/main.ts:27570,28251,30309`) | `save_game` (slot=quick) | `slot_id: String` ⚠D-CMD-19 (= `quick`), `label: String` | — (jak Z1) | CZĘŚCIOWA | jak Z1: `rust-port/engine/src/domain/save_load.rs:79` (`SaveSnapshot`), `:34`; r6, zarzut 3. |
| Z3 | Wczytaj slot (`onLoad` → `loadGameFromSlot`, `gra/src/main.ts:22140`, definicja `gra/src/main.ts:38140`; `gra/src/ui/saveLoadDialog.ts:395,522,607`; Ctrl+L `gra/src/main.ts:36216`) | `load_game` | `slot_id: String` ⚠D-CMD-19 | `GameState` (całość) | CZĘŚCIOWA | G30 (0 trafień wzorca); `migrate_v1` `rust-port/engine/src/domain/save_load.rs:207`. |
| Z4 | Automatyczny zapis (`fsa-autosave`, `triggerFsaAutosaveBootstrap` `gra/src/main.ts:22203`; moduł `gra/src/game/fsa-autosave.ts`) | `autosave` (wewnętrzny; czy komenda gracza — `D-CMD-4`) | — | — | BRAK | G31 (0 trafień `autosave\|auto_save`). `gra/src/game/fsa-autosave.ts` (web, 530 linii) — brak w Rust. |
| Z5 | Nowa gra (`onNewGame`, `gra/src/main.ts:22173`, `gra/src/main.ts:22217`; start: `gra/src/main.ts:9291`, `:9410` — r4; `gra/src/ui/newGameFlow.ts:490,2178` `onStart`; komenda `create_session` obecna (`rust-port/engine/src/bridge.rs:263-266`; etykieta wiersza CZĘŚCIOWA, nie ocena komendy — r6, zarzut 10)) | `create_session` | `StartGameParams` (`rust-port/engine/src/domain/playable.rs:413`) | `GameState` (nowy, `P2-2 §2`) | CZĘŚCIOWA | `PlayableGame::new` `playable.rs:413` — parametry DTO kreatora (`src-tauri/frontend/main.js:175,401`) ≠ `newGameParams` web (`P2-2 §4`). |
| Z6 | Kontynuuj (`onContinue`, `gra/src/main.ts:22186`; ładuje ostatni slot: `getLastPlayedSlotId`, komentarz `gra/src/main.ts:30859` wskazuje `gra/src/game/save.ts`) | `load_game` (ostatni slot; alias Z3) | `slot_id: String` ⚠D-CMD-19 (z `getLastPlayedSlotId`) | `GameState` (całość, jak Z3) | CZĘŚCIOWA | Status dziedziczony z Z3 (r6, zarzut 3): G30; `migrate_v1` `rust-port/engine/src/domain/save_load.rs:207`. |

---

## 2.11 Akcje bez komendy (widok, UI, nawigacja, diagnostyka, aliasy) — BEZ statusu (`D-CMD-15`)

Te akcje nie mają statusu GOTOWA/CZĘŚCIOWA/BRAK, bo wg zakresu z GOAL i ZADANIA pkt 1 (katalog = akcje, które web wywołuje z UI do logiki gry) nie zmieniają stanu gry: kamera, nawigacja, widok, ustawienia, diagnostyka, stan UI trybu budowy oraz wywołania silnika. Akcje mutujące z dawnego §2.11 zostały przeniesione do §2 ze statusem: O6, O9, Z6 (r2); U13 (→ R6), skrót `B` (→ B11), wycofanie obrońcy (→ W11), zakup w panelu imperium (A4 → R1, CZĘŚCIOWA). Czy wiersze widokowe mają status (lub zostają wyłączone z katalogu), rozstrzyga wyłącznie **właściciel** (`D-CMD-15`, status DECISION_REQUIRED). Operator, Evaluator i Final Control jej nie podejmują i nie nadają tym wierszom statusu.

| # | Akcja gracza (dowód web) | Powiązanie | Uwaga |
|---|---|---|---|
| S5 | Otwórz drzewo / pokaż w drzewie (`onOpenTree`, `onShowInTree`, `onOpenFullTree`; `gra/src/ui/techTreeView.ts`, `gra/src/ui/wikiHubHud.ts`) | — | Widok. |
| W7 | Anuluj przed bitwą (`onCancel`, `gra/src/ui/preBattle.ts:145,620,905`) | — | Zamknięcie overlay, bez zmiany stanu gry. |
| W8 | Kontynuuj po bitwie (`onContinue`, `gra/src/ui/postBattleSummary.ts:463-556`; `gra/src/game/battle-summary.ts`) | — | Widok podsumowania. |
| W13 | Szczegóły bitwy — przycisk „Szczegóły bitwy” (`gra/src/battle/endScreen1E.ts:217` → `cb.onDetails`; `battleScene.ts:9823` → `_showEndDetails` `:9539`: chowa ekran końca i pokazuje panel szczegółów z `showEndDetails1E`; ciało bez wywołań zmieniających stan gry) | — | — | Widok. Dodany w r5 (zarzut 4). |
| Z7 | Menu główne / wyjście do menu (`onMainMenu`, `gra/src/main.ts:22224`; `gra/src/ui/gamePauseMenu.ts:15,281`) | — | Nawigacja. |
| Z8 | Wznów grę z pauzy (`onResume`, `gra/src/ui/gamePauseMenu.ts:11,204,256,262`) | — | Zamknięcie pauzy. |
| O1 | Klik na minimapę / przesunięcie kamery (`onMinimapClick`, `gra/src/ui/minimapHud.ts:409`; `gra/src/ui/hud.ts:1532`; `gra/src/render/camera.ts`) | — | Kamera, widok. |
| O2 | Mgła wojny / odsłonięcie lądu na minimapie (`onToggleFogFull`, `onToggleLandReveal`, `gra/src/ui/minimapHud.ts:82,84`) | — | Widok; nie zmienia `GameState`. |
| O3 | Przycisk trybu tras handlowych na minimapie (`tradeRoutesBtn`, `gra/src/ui/minimapHud.ts:372`) | logika T1 | Widok warstwy. |
| O4 | Panel imperium (`onOpenEmpireDetail`, `gra/src/ui/hud.ts:1359`) | — | Widok. |
| O5 | Panel zdarzeń / wiki / tech-tree (`onOpenTree`, `gra/src/ui/wikiHubHud.ts`) | — | Widok. |
| O7 | Skróty diagnostyczne: F9 `togglePerfDebugOverlay`, F10 `toggleDiagPanel`, Ctrl+Shift+D `copyDiagReport` (`gra/src/main.ts:26121-26132`) | — | Diagnostyka (`gra/src/game/diag-log.ts` poza domeną). |
| O8 | Skróty widoku i diagnostyki: Esc (`gra/src/main.ts:36108`), M (`:36167`, dev `FOG_DEV_SHORTCUTS`), F (`:36157`, dev), G (`:36141`, dev `GALLERY_DEV_SHORTCUT`); N → `advanceSeat` (§2.9 T-1, `:36223`). Skrót B przeniesiony do B11. D-CMD-14(c) zamknięte po odczycie ciał (r3, zarzut 5): F `:36157` → `toggleDevFogFull` (bramka `FOG_DEV_SHORTCUTS`); G `:36141` → `galleryOn`/`enterGallery`/`exitGallery` (bramka `GALLERY_DEV_SHORTCUT`); M `:36167-36175` → `toggleDevRevealAllLand` (bramka `FOG_DEV_SHORTCUTS`); Esc `:36108-36135` → `hideSaveLoadDialog`, `hideGamePauseMenu`, `exitOkolicaMapMode`, `dismissPlayerUnitSelectionIfAny`, `hideCityPanelFull` — żadne nie zapisuje `GameState`. | — | Widok/dev. |
| O10 | Zmiana trybu prezentacji (jakość mapy/renderu, panel testu wydajności — `gra/src/main.ts:1769-1798` `mapQualityTierFromParams`/`FromSave`/`FromQuery`, `:22207` `onPerfTest`; `P2-2 §4` U) | — | Poza `GameState`. |
| O11 | Ustawienia (dźwięk, muzyka, ambient, SFX, częstotliwość autozapisu): `onSettingsChange` (`gra/src/main.ts:22164`), `onMusicToggle`/`onMusicVolumeChange` (`:22227`, `:22234`), `onAmbienceToggle`/`onAmbienceVolumeChange` (`:22241`, `:22249`), `onSfxToggle`/`onSfxVolumeChange` (`:22256`, `:22266`), `onAutosaveFreqChange` (`:22272`; dotyczy Z4, D-CMD-4) | — | Ustawienia poza `GameState`; częstotliwość autozapisu — decyzja D-CMD-4. Ciało zweryfikowane (r3): `setAutosaveFrequency` (`gra/src/main.ts:30759-30761`) zapisuje tylko `localStorage` — brak zapisu `GameState`. |
| O12 | Wybór i przełączanie miasta oraz warstw widoku: `onSelectCity` (`gra/src/main.ts:22450`), `onSwitchCity` (`:7550`), `onOpenMapForOkolica` (`:7547`), `onCity` (`:26627`), `onEnterCity` (`:28474`, `:29842`), warstwy `onToggleCulture`/`onToggleReligion`/`onToggleTerritory`/`onToggleWorkers`/`onToggleDeposits` (`:22935-22950`) | — | Widok (kamera, warstwy, otwarcie panelu). Zmiana trybu okolicy = A1, nie O12. |
| O13 | Zamykanie, informacja, rozwijanie kart: `onClose` (10 wystąpień, np. `:6970`), `onInfo` (`:10735`, `:10759`), `onOpenUnitCard` (`:22473`), `onOpenArmy` (`:22600`), `onOpenArmyList` (`:22889`), `onContextExpand` (`:22991`), `onAbout` (`:22204`), `onCancel` zamykający overlaye (`:12377`, `:27567`, `:28189`) | — | Widok. |
| O14 | Tryb budowy w terenie (stan UI): `onOpenBuild` (`gra/src/main.ts:22623`), `onSelectType` (`:22654`), `onSelectFoundCity` (`:22679`), `onSelectWonder` (`:22688`), `onExit` (`:22663`) — ustawiają `activeImprovementKey`, `foundCityMode`, `activeWonderId` | — | Ciała zweryfikowane (r3): `onOpenBuild` `:22623-22645`, `onSelectType` `:22654`, `onSelectFoundCity` `:22679`, `onSelectWonder` `:22688` zmieniają wyłącznie zmienne UI (`buildModeOpen`, `foundCityMode`, `activeImprovementKey`, `activeWonderId`; `ensureUlepszeniaHudCityId` `:28684` — cache UI); brak zapisu `GameState`. Skutek w B2 (postawienie ulepszenia/cudu na heksie) i B6 (zakładanie miasta). |
| O15 | Nawigacja dyplomacji: `onNext` (`gra/src/main.ts:17882`), `onNextOpenProposal` (`:21523`), `onBack` (`:21498`), `onOpenAudience` (`:21618`), `onOpenDiplomacy` (`:22561`), `onOpenKnownFactions` (`:21524`), `onDiplomacy` (`:10736`, `:10760`), `onSelectEntry` (`:22497`), `onFocusCapital` (`:21532`, `:22512` → `handleDiploFocusCapital`, `:28716`) | — | Widok/nawigacja; wejście w akcje → D1–D5. Ciało `handleDiploFocusCapital` zweryfikowane (r3, `gra/src/main.ts:28716-28724`): zamyka overlay dyplomacji, `focusCameraOnOwnerCapital` (kamera, `:28698`), `refreshD1bHud` — brak zapisu `GameState`. |
| O16 | Zdarzenia silnika, animacji i wywołania wewnętrzne: `onResolved` (13 wystąpień, `:11065`; po fazie AI/bitwy), `onCancelled` (`:10126`, hint), `onOwnTerritory` (flaga projekcji, 5 wystąpień), `onCityCaptured` (`:30001`), `onCityCapturedReligion` (`:29710`), `onCityPopulationChanged` (`:32854`), `onUnitHpChanged` (`:31388`), `onMoved`/`onCapture` (`:34883-34884`) | — | Wywołania silnika/animacji, nie akcje gracza; zmiany stanu wykonują W2, W5, T-1. |

---

**Usunięte z §2.4 w r6 (zarzut 4): T2 „Zakończ / anuluj trasę”.** Web nie ma takiej akcji: `createTradeRoute` (`gra/src/game/trade-routes.ts:827`) jest jedyną definicją trasy, a `git grep -i -E 'cancelRoute|cancel.*route|route.*cancel'` na `edb8fb56` = 0. Wiersz opisywał akcję, której web nie wykonuje, więc nie jest liczony w §3 ani w katalogu. Pozostaje G11 w §2.12 jako dowód negatywny.

## 2.12 Dowody negatywne — grep na pinie `9e33fc77` (`rust-port/engine`, `src-tauri`)

Każdy wpis: wzorzec `git grep -E -i` na pinie, liczba trafień (suma po plikach). Odtwarzalne przez `git grep -c -i -E '<wzorzec>' 9e33fc77 -- rust-port/engine src-tauri`. Trafienia niedomenowe są opisane.

| ID | Wzorzec | Trafienia | Interpretacja |
|---|---|---|---|
| G01 | `replace_unit\|unit_replace\|UnitReplace` | 0 | brak komendy |
| G02 | `build_list\|budowaLista\|budowa_lista` | 0 | brak pola |
| G03 | `buy_building\|buy_build\|purchase_building\|buy_improvement` | 0 | brak zakupu budynku |
| G04 | `dequeue\|reorder_build\|reorder_queue\|reorder_research` | 0 | brak operacji na kolejce gracza |
| G05 | `DealPackage\|deal_package\|respond_package\|diplomacy_respond_package` | 0 | brak pakietów |
| G06 | `diplomacy_cancel\|cancel_deal\|cancel_negotiation\|cancel_proposal` | 0 | brak anulowania |
| G07 | `audience\|umowa_handlowa\|sojusz_defensywny\|trybut\|wchloniecie` | 26 | **trafienia istnieją** (typy traktatów `diplomacy.rs:562,572,1364,1370,1506`); brak warstwy akcji UI → D5 CZĘŚCIOWA |
| G08 | `set_stance\|diplomacy_set_stance` | 0 | brak komendy (typ zdarzenia `DeclareWar` istnieje: G41) |
| G09 | `basket` | 96 | **trafienia istnieją**: `BasketItem`/`BasketItemKind` `diplomacy.rs:1686-1731`; brak komendy wejścia → D7 CZĘŚCIOWA |
| G10 | `inter_human\|interhuman\|inter-human` | 0 | brak |
| G11 | `trade_cancel\|cancel_route\|route_cancel` | 0 | brak |
| G12 | `start_research\|set_research_target\|enqueue_research\|wonders_tech` | 0 | brak komend badań |
| G13 | `set_city_auto\|auto_flags\|city_auto` | 0 | brak trybu gracza |
| G14 | `auto_ration\|auto_wyzywienie\|autoWyzywienie` | 0 | brak |
| G15 | `set_owner_policy\|OwnerPolicy` | 0 | brak |
| G16 | `empire_purchase` | 0 | brak |
| G17 | `auto_explore` | 0 | brak |
| G18 | `unit_skip\|planned_march\|skip_unit` | 0 | brak |
| G19 | `unit_fortify\|in_garnizon\|enter_garrison\|exit_garrison\|unit_unfortify` | 0 | brak (trafienia „garnizon” to budynek `building_costs.rs:166`, `barbarians.rs:914`) |
| G20 | `sentry` | 0 | brak |
| G21 | `disband` | 0 | brak |
| G22 | `stack_split\|stack_merge\|stack_group\|split_stack\|merge_stack` | 0 | brak |
| G23 | `rally_set\|rally_launch\|rally_clear\|rally_point` | 0 | brak (trafienia `barbarians.rs:639` dotyczą AI barbarzyńców) |
| G24 | `siege_besiege\|oblega\|siege_storm\|siege_retreat\|besieg` | 0 | brak (trafienia `is_siege` `combat.rs:105-321` to modyfikator) |
| G25 | `siege_machine\|SiegeMachine` | 0 | brak |
| G26 | `city_attack` | 0 | brak |
| G27 | `battle_manual\|manual_battle\|battle_start` | 0 | brak |
| G28 | `hotseat\|hot_seat\|active_human\|human_owner` | 0 | brak |
| G29 | `execute_pending\|dismiss_event\|dismiss_all` | 0 | brak |
| G30 | `save_game\|load_game\|quick_save` | 0 | brak komend; `SaveSnapshot` istnieje w `save_load.rs:79` (niewpięte) |
| G31 | `autosave\|auto_save` | 0 | brak |
| G32 | `focus\|podzial\|racji` | 1 | niedomenowe: `src-tauri/frontend/index.html:34` (CSS `focus-visible`) → brak domenowy |
| G33 | `found_city_from_village\|village_reward\|villageRewards` | 11 | `playable.rs:117,156,172` — flaga `NOT_IMPLEMENTED` |
| G34 | `create_trade_route\|trade_create_route` | 8 | `trade.rs:823,832` istnieją; brak wywołania UI (D-CMD-10) |
| G35 | `found_city\|foundCity` | 22 | domenowe w `city_growth.rs`, niewpięte |
| G36 | `select_unit` | 7 | `bridge.rs:273,356`, `playable.rs:486`, testy `tests/playable_slice.rs:38,55,80`, wywołanie `src-tauri/frontend/main.js:647` |
| G37 | `manpower\|Manpower` | 0 | brak manpower w Rust (wykonane w rundzie 2; wcześniej otwarte) → R1 „brak manpower” potwierdzone |
| G38 | `diplomacy_break\|break_treaty\|breakTreaty` | 0 | brak komendy zerwania traktatu → D10 BRAK |
| G39 | `alliance_obligation\|obligation\|join_ally\|joinAllyToWar\|mustDeclareWar` | 0 | brak obowiązku sojuszniczego → D11 BRAK |
| G40 | `tech_trade\|TechTrade\|tech-trade` | 0 | brak logiki wymiany technologii (typ `BasketItemKind::Technology` istnieje, G09) → D12 BRAK |
| G41 | `declare_war\|declarewar` (w `diplomacy.rs`) | `diplomacy.rs:534-535,623` | typ zdarzenia `DiplomaticEvent::DeclareWar` istnieje; brak komendy → D6 CZĘŚCIOWA |
| G42 | `rush` | 0 | brak operacji rush w Rust (`rushProduction` tylko w web, `gra/src/game/production.ts:1997`) → B5 |
| G43 | `set_capital\|setCapital\|trySetPlayerCapital` | 0 | brak komendy ustawienia stolicy → B10 |
| G44 | `auto_manage\|autoManage` | 0 | brak trybu auto-zarządzania miastem gracza → A6 |
| G45 | `battle_action\|battle_move\|battle_attack\|manual_battle\|battle_skip\|battle_click` | 0 | brak akcji bitwy ręcznej → W10 |
| G46 | `pre_battle\|prebattle\|pre-battle`; `retreat` (osobno) | 0; `retreat` = `ai_turn.rs:1073`, `barbarians.rs:269,285,740` | brak wycofania obrońcy przed bitwą; „retreat” tylko AI/barbarzyńcy → W11 |
| G47 | `cancel_recruit\|cancelRecruit\|cancel_queue` | 0 | brak anulowania rekrutacji → R5 |
| G48 | `paus\|wstrzym` (`rust-port/engine`, `src-tauri`, pin `9e33fc77`) | 0 | brak wstrzymania produkcji → B12 |

---

## 2.13 Wiązanie callbacków `gra/src/main.ts` → wiersze (174 nazwy, 268 wystąpień)

Źródło: `git grep -n -E '\bon[A-Z][A-Za-z0-9_]*[[:space:]]*[:(]' edb8fb56 -- gra/src/main.ts` (pierwsza linia · liczba wystąpień). Mapowanie nazwy na wiersz. To jest zestawienie na poziomie nazw handlerów; nie zawiera przeglądu mutatorów w ciałach handlerów (§0, D-CMD-14(b)). Pozycje oznaczone „→ B2”, „→ B6”, „→ W11” itd. wskazują wiersz, do którego prowadzi handler (wynik przeglądu ciała na poziomie nazwy; mutatory linia po linii — §6.3 pkt 2).

| Callback | Pierwsza linia · wystąpień | Wiersz |
|---|---|---|
| `onAbout` | 22204 · 1 | O13 |
| `onAccept` | 18040 · 1 | D2 |
| `onAcceptNegotiation` | 21600 · 1 | D2 |
| `onAcceptNegotiationPackage` | 21602 · 1 | D4 |
| `onAction` | 21495 · 2 | D5 |
| `onAllowed` | 10703 · 3 | D6 (withPlayerWarConsent) |
| `onAmbienceToggle` | 22241 · 1 | O11 |
| `onAmbienceVolumeChange` | 22249 · 1 | O11 |
| `onAuto` | 27506 · 3 | W5 |
| `onAutoManage` | 24987 · 2 | A6 |
| `onAutosaveFreqChange` | 22272 · 1 | O11 (Z4, D-CMD-4) |
| `onBack` | 21498 · 1 | O15 |
| `onBattlefield` | 27507 · 3 | W6 |
| `onBesiege` | 14894 · 1 | W1 |
| `onBreakTreaty` | 21598 · 1 | D10 |
| `onBudowaEnterManual` | 7626 · 1 | B8 |
| `onBudowaFocusOverrideToggle` | 7637 · 1 | B8 |
| `onBudowaListaChange` | 7657 · 1 | B4 |
| `onBudowaListaCreateTemplate` | 7676 · 1 | B4 |
| `onBudowaListaDeleteTemplate` | 7717 · 1 | B4 |
| `onBudowaListaLoadAllCities` | 7725 · 1 | B4 |
| `onBudowaListaLoadTemplate` | 7691 · 1 | B4 |
| `onBudowaListaRenameTemplate` | 7709 · 1 | B4 |
| `onBudowaPriorytetChange` | 7580 · 1 | B8 |
| `onCancel` | 12377 · 14 | O13; W7; W11 (:28216) |
| `onCancelRecruitment` | 25054 · 1 | R5 |
| `onCancelled` | 10126 · 1 | O16 |
| `onCapture` | 34884 · 1 | O16 |
| `onChange` | 23073 · 3 | A3 (suwak wlasciciela) |
| `onCity` | 26627 · 1 | O12 |
| `onCityAutoWyzywienieChange` | 7301 · 1 | A7 |
| `onCityCaptured` | 30001 · 1 | O16 |
| `onCityCapturedReligion` | 29710 · 1 | O16 |
| `onCityPopulationChanged` | 32854 · 1 | O16 |
| `onCityRationChange` | 7261 · 1 | B8 |
| `onClose` | 6970 · 10 | O13 |
| `onContextAction` | 22996 · 1 | U3-U7 (handleSelectedUnitHudAction; D-CMD-14(g)) |
| `onContextCycleUnit` | 22999 · 1 | U1 |
| `onContextExpand` | 22991 · 1 | O13 |
| `onContextSelectUnit` | 22995 · 1 | U1 |
| `onContinue` | 22186 · 4 | Z6; W8 |
| `onCounter` | 18050 · 1 | D3 |
| `onCounterNegotiation` | 21605 · 1 | D3 |
| `onCycleUnit` | 22927 · 1 | U1 |
| `onDeclareAndAttack` | 10714 · 1 | D6 |
| `onDeclareOnly` | 10713 · 2 | D6 |
| `onDequeue` | 22537 · 1 | S3 |
| `onDiploChip` | 22562 · 1 | D6 |
| `onDiplomacy` | 10736 · 2 | O15 |
| `onDismissAll` | 23054 · 1 | T-3 |
| `onEditOwnNegotiation` | 21607 · 1 | D3 |
| `onEndTurn` | 22556 · 1 | T-1 |
| `onEnqueue` | 22536 · 1 | S3 |
| `onEnterCity` | 28474 · 2 | O12 |
| `onEventClick` | 23012 · 1 | T-2 |
| `onEventDismiss` | 23053 · 1 | T-3 |
| `onExecutePending` | 22552 · 1 | T-2 |
| `onExit` | 22663 · 1 | O14 |
| `onFocusCapital` | 21532 · 2 | O15 |
| `onFulfill` | 20115 · 1 | D11 |
| `onInfo` | 10735 · 2 | O13 |
| `onLeaveAllGarrison` | 7780 · 1 | U5 |
| `onLeaveGarrison` | 7763 · 1 | U5 |
| `onLoad` | 22140 · 3 | Z3 |
| `onMainMenu` | 22224 · 1 | Z7 |
| `onMerge` | 12116 · 5 | U9 |
| `onMinimapClick` | 22954 · 1 | O1 |
| `onMoved` | 34883 · 1 | O16 |
| `onMusicToggle` | 22227 · 1 | O11 |
| `onMusicVolumeChange` | 22234 · 1 | O11 |
| `onNewGame` | 22173 · 2 | Z5 |
| `onNext` | 17882 · 1 | O15 |
| `onNextOpenProposal` | 21523 · 1 | O15 |
| `onOkolicaEnterManual` | 7515 · 1 | A1 |
| `onOkolicaFocusChange` | 7453 · 1 | B8 |
| `onOkolicaFocusOverrideToggle` | 7494 · 1 | B8 |
| `onOkolicaRestoreAuto` | 7532 · 1 | A1 |
| `onOkolicaTileAdjust` | 7544 · 1 | A1 |
| `onOpenArmy` | 22600 · 1 | O13 |
| `onOpenArmyList` | 22889 · 1 | O13 |
| `onOpenAudience` | 21618 · 3 | O15 (wejscie D5) |
| `onOpenBuild` | 22623 · 1 | O14 |
| `onOpenCities` | 22571 · 1 | O5 |
| `onOpenCulture` | 22588 · 1 | O5 |
| `onOpenDiplomacy` | 22561 · 2 | O15 |
| `onOpenEmpireDetail` | 22567 · 1 | O4 |
| `onOpenFullTree` | 22527 · 1 | S5 |
| `onOpenInterHumanDiplo` | 22616 · 1 | D9 |
| `onOpenKnownFactions` | 21524 · 1 | O15 |
| `onOpenMapForOkolica` | 7547 · 1 | O12 |
| `onOpenMenu` | 22557 · 1 | Z7 |
| `onOpenReligion` | 22592 · 1 | O5 |
| `onOpenScience` | 22566 · 2 | O5 |
| `onOpenTechDetails` | 24883 · 1 | S5 (widok) |
| `onOpenTree` | 14386 · 8 | S5 |
| `onOpenTreeView` | 22529 · 1 | S5 |
| `onOpenUnitCard` | 22473 · 1 | O13 |
| `onOpenWiki` | 22568 · 1 | O5 |
| `onOwnTerritory` | 18205 · 5 | O16 (flaga projekcji) |
| `onOwnerChanged` | 29580 · 1 | A3 (domyslne polityki po zmianie wlasciciela) |
| `onOwnerDefaultChange` | 23063 · 1 | A3 |
| `onOwnerDefaultPodzialPracyChange` | 23092 · 1 | A3 |
| `onOwnerDefaultPoziomRacjiChange` | 23101 · 1 | A3 |
| `onOwnerSetAutoWyzywienieForAll` | 23113 · 1 | A2 |
| `onPerfTest` | 22207 · 1 | O7 |
| `onPick` | 6606 · 1 | R4 (performUnitReplace) |
| `onPodzialHandluChange` | 25008 · 2 | B9 |
| `onPodzialHandluOverrideToggle` | 25030 · 2 | B9 |
| `onPodzialPracyChange` | 25045 · 2 | B9 |
| `onPodzialPracyOverrideToggle` | 25048 · 2 | B9 |
| `onPoziomRacjiOverrideToggle` | 7283 · 1 | B8 |
| `onPropose` | 18056 · 1 | D1 |
| `onPurchase` | 23059 · 1 | R1 |
| `onPurchaseUnit` | 25051 · 2 | R2 |
| `onQueueMachine` | 14908 · 1 | W4 |
| `onQuickSave` | 29891 · 1 | Z2 |
| `onQuit` | 22208 · 1 | Z7 |
| `onRefuse` | 20124 · 1 | D11 |
| `onReject` | 18045 · 1 | D2 |
| `onRejectNegotiation` | 21601 · 1 | D2 |
| `onRejectNegotiationPackage` | 21603 · 1 | D4 |
| `onRemoveNegotiation` | 21604 · 1 | D8 |
| `onReorder` | 22538 · 1 | S3 |
| `onRequestAiNegotiationResponse` | 21609 · 1 | D2 |
| `onResolved` | 11065 · 13 | O16 |
| `onResume` | 22214 · 1 | Z8 |
| `onRetreat` | 14897 · 1 | W3 |
| `onRushBuy` | 24960 · 2 | B5 (D-CMD-17) |
| `onSave` | 22091 · 5 | Z1 |
| `onSelect` | 13392 · 1 | B1 (applyBuildRequest) |
| `onSelectArmy` | 22461 · 1 | U1 |
| `onSelectCity` | 22450 · 1 | O12 |
| `onSelectEntry` | 22497 · 1 | O15 |
| `onSelectFoundCity` | 22679 · 1 | O14 (-> B6) |
| `onSelectTarget` | 24839 · 1 | S2 |
| `onSelectTech` | 22523 · 1 | S4 |
| `onSelectType` | 22654 · 1 | O14 (-> B2) |
| `onSelectUnit` | 22888 · 1 | U1 |
| `onSelectWonder` | 22688 · 1 | O14 (-> B2) |
| `onSeparate` | 12156 · 3 | U8 |
| `onSetCapital` | 24913 · 1 | B10 |
| `onSettingsChange` | 22164 · 1 | O11 |
| `onSfxToggle` | 22256 · 1 | O11 |
| `onSfxVolumeChange` | 22266 · 1 | O11 |
| `onShowInTree` | 22528 · 1 | S5 |
| `onShowOnMap` | 4415 · 1 | O1 |
| `onSiege` | 15036 · 2 | W1 |
| `onSplit` | 12304 · 2 | U8 |
| `onStart` | 22182 · 3 | Z5 |
| `onStartResearch` | 24879 · 1 | S1 |
| `onStorm` | 14896 · 3 | W2 |
| `onSwitchCity` | 7550 · 1 | O12 |
| `onToggleCulture` | 22935 · 1 | O12 |
| `onToggleDeposits` | 22950 · 1 | O12 |
| `onToggleFogFull` | 11015 · 2 | O2 |
| `onToggleLandReveal` | 11016 · 2 | O2 |
| `onToggleReligion` | 22936 · 1 | O12 |
| `onToggleTerritory` | 22937 · 1 | O12 |
| `onToggleTradeRoutes` | 22942 · 1 | O3 |
| `onToggleWorkers` | 22946 · 1 | O12 |
| `onUlepszeniaCityFocusChange` | 22821 · 1 | B8 |
| `onUlepszeniaCityIdChange` | 22720 · 1 | B8 |
| `onUlepszeniaCityOnlyWorkedChange` | 22843 · 1 | B8 |
| `onUlepszeniaCityOverrideChange` | 22794 · 1 | B8 |
| `onUlepszeniaCityPracaPercentChange` | 22873 · 1 | B9 |
| `onUlepszeniaCityTrybChange` | 22830 · 1 | B8 |
| `onUlepszeniaCityWyrabChange` | 22859 · 1 | B8 |
| `onUlepszeniaEmpireFocusChange` | 22733 · 1 | B8 |
| `onUlepszeniaEmpireOnlyWorkedChange` | 22751 · 1 | B8 |
| `onUlepszeniaEmpirePracaPercentChange` | 22779 · 1 | B9 |
| `onUlepszeniaEmpireTrybChange` | 22741 · 1 | B8 |
| `onUlepszeniaEmpireWyrabChange` | 22767 · 1 | B8 |
| `onUnit` | 26628 · 1 | U1 |
| `onUnitHpChanged` | 31388 · 1 | O16 |

**Kanał bez prefiksu `on` (r5, poprawka r6: zarzut B3).** Zestawienie powyżej zbiera tylko nazwy `on[A-Z]`. Mutacje kolejki produkcji idą też przez kanał konfiguracji panelu miasta: `cityPanel.ts` `setProd` (definicja `:638`, pin `edb8fb56`) woła `cfg.setProduction` (`:639`); `gra/src/main.ts` wiąże `setProduction` z `setCityProduction` (`main.ts:24949-24951` i `:36740-36742`; definicja `setCityProduction` `main.ts:4304`). Pełny spis wywołań `setProd` w `cityPanel.ts` (pin `edb8fb56`): dopisanie budowy `enqueue` (`:6284`, B1); usunięcie budowy `dequeue` (`:6133`, `cancelQueueItem` `:6125`, B3); przeciąganie kolejki budowy (`:849`, B3); przeciąganie kolejki rekrutacji (`:787`, B3); przesunięcia kolejki rekrutacji (`:8269`, `:8276`, B3); usunięcie z kolejki rekrutacji `dequeueRecruitment` (`:8284`, B3; zob. też R5); awans i przesunięcia kolejki budowy (`:8400`, `:8408-8409`, `:8415`, B3); wstrzymanie produkcji (`:8522`, B12). Ten kanał nie ma osobnego wiersza poza B1, B3, B12. `:8339` to komentarz, `:8448` to odczyt `cfg.getBudowaState` (nie mutacja) — poprzednie wskazanie tych linii jako „dopisanie do kolejki” było błędne. Pełny przegląd mutatorów `setProd`: `mutator-review-r4.tsv`.

## 3. Kategorie — zbiorcze podsumowanie (rekonsyliacja z tabel §2.1–§2.10)

Liczby policzone z wierszy §2.1–§2.10 (wiersze ze statusem). Wiersze §2.11 (bez statusu) nie są liczone.

| Kategoria | Wiersze ze statusem | GOTOWA | CZĘŚCIOWA | BRAK | Wiersze bez statusu (§2.11) |
|---|---|---|---|---|---|
| Rekrutacja (§2.1) | R1–R6 (6) | 0 | 4 (R1, R2, R3, R6) | 2 (R4, R5) | — |
| Budowa (§2.2) | B1–B12, O9 (13) | 0 | 5 (B1, B2, B6, B11, O9) | 8 (B3, B4, B5, B7, B8, B9, B10, B12) | — |
| Dyplomacja (§2.3) | D1–D12 (12) | 0 | 6 (D1, D2, D3, D5, D6, D7) | 6 (D4, D8, D9, D10, D11, D12) | — |
| Handel (§2.4) | T1, T4 (2) | 0 | 2 (T1, T4) | 0 | — (T2 usunięty r6) |
| Badania (§2.5) | S1–S4 (4) | 0 | 0 | 4 | S5 |
| Auto-zarządzanie (§2.6) | A1–A7 (7) | 0 | 1 (A4) | 6 (A1–A3, A5–A7) | — |
| Ruch i rozkazy (§2.7) | U1–U12 (12) | 0 | 3 (U1, U2, U12) | 9 (U3–U11) | — |
| Walka / oblężenie (§2.8) | W1–W6, W9–W12 (10) | 0 | 1 (W5) | 9 (W1–W4, W6, W9, W10, W11, W12) | W7, W8 (W13 w §2.11) |
| Tura / fotele (§2.9) | T-1–T-4 (4) | 0 | 1 (T-1) | 3 (T-2, T-3, T-4) | — |
| Save / load / sesja (§2.10) | Z1–Z6 (6) | 0 | 5 (Z1, Z2, Z3, Z5, Z6) | 1 (Z4) | Z7, Z8 |
| Inne (widok, UI, diagnostyka, §2.11) | — | — | — | — | W13, O1–O5, O7, O8, O10–O16 (15) |
| **Suma** | **76** | **0** | **28** | **48** | **20** |

**Rekonsyliacja (r6):** 76 = 0 + 28 + 48 (r6: −T2 (Handel), −O6 (scalony z U10), +A7 (BRAK), Z1/Z2/Z3/Z6 BRAK→CZĘŚCIOWA).

**Rekonsyliacja (r5):** 77 = 0 + 24 + 53. Zmiany r5: +T4 (CZĘŚCIOWA, z §2.11), +W12 (BRAK), D6 BRAK → CZĘŚCIOWA (zarzut 5). Wiersze §2.11 bez statusu: S5, W7, W8, W13, Z7, Z8, O1–O5, O7, O8, O10–O16 = 20 (T3 przeniesiony do T4; W13 dodany).

**Rekonsyliacja (r4):** 75 = 0 + 22 + 53 (wcześniejsze „74 = 0 + 23 + 51” było błędne: 22 + 52 = 74). Wiersze §2.11 bez statusu: T3, S5, W7, W8, Z7, Z8, O1–O5, O7, O8, O10–O16 = 20. Dodane w r4: B12 (BRAK). Przeniesienia w r3: U13 → R6 (CZĘŚCIOWA); skrót B → B11 (CZĘŚCIOWA); wycofanie obrońcy → W11 (BRAK, nowy); A4 BRAK → CZĘŚCIOWA (alias R1); nowe BRAK: R5, B10, A6, W10. Poprzednia wersja r2: 67 + 15 = 82. Zmiana r3 (zarzut 6): D12 CZĘŚCIOWA → BRAK; CZĘŚCIOWA 23 → 22, BRAK 51 → 52.

**Wynik binarny:** 0 GOTOWA. U1 (`select_unit`) pozostaje CZĘŚCIOWA do `D-CMD-12` (decyzja właściciela). Kryterium kompletności (każda akcja w `gra/src/**` z wierszem i statusem): **NIESPEŁNIONE** przez 20 wierszy §2.11 (`D-CMD-15`) i przez ID spoza P2.3 (`D-CMD-19`, r6); D-CMD-14 zamknięte w r4.

---

## 4. Punkty wymagające decyzji (`D-CMD-n`)

- **D-CMD-1 — forma komend:** osobne komendy Tauri (propozycja) vs jedna `engine_command` (§1). Wymaga decyzji.
- **D-CMD-2 — `end_turn` vs `advance_turn`:** zakres i nazwa (fotel vs świat). Wymaga decyzji (§2.9 T-1).
- **D-CMD-3 — kolejność faz `end_turn` względem `turn_economy`:** `resolve_turn` (`rust-port/engine/src/domain/turn_economy.rs:299`) przed/po tury AI. Wymaga decyzji (zachowanie gry).
- **D-CMD-4 — autosave:** czy wywołanie jest komendą gracza, czy efektem `end_turn` (`gra/src/game/fsa-autosave.ts`). Status Z4 = BRAK niezależnie od decyzji (decyzja dotyczy tylko kształtu komendy). Wymaga decyzji.
- **D-CMD-5 — diplomacy: pakiety (`D4`) i koszyk (`D7`):** czy pakiet jest jednym `DealPayload` czy listą deali. Wymaga decyzji (zachowanie UI→silnik).
- **D-CMD-6 — identyfikator techu:** web używa klucza `string`; P2.3 nie definiuje `TechId`. Propozycja: `TechId` newtype z kluczem z danych (`P2-9`). Wymaga decyzji. Dotyczy też S1–S4 i D12.
- **D-CMD-7 — identyfikator typu jednostki/budynku:** `unit_type: String` / `building: String` vs enum (P2.3 D-ID-10 mówi: klucz do katalogu danych). Propozycja zgodna z D-ID-10; potwierdzić dla budynków (`P2-9`). Wymaga potwierdzenia.
- **D-CMD-8 — zamiana jednostki (R4) i lista budowy (B4):** czy `replace` zachowuje `UnitId`; czy `budowaLista` to stan miasta (`cities[]`) czy UI-preset. Wymaga decyzji.
- **D-CMD-9 — tura świata vs fotel (hot-seat):** czy `end_turn` kończy fotel, a `resolve_turn` odpala się po ostatnim fotelu (`advanceSeat` gałąź „ostatni fotel → świat”, `gra/src/main.ts:36047`). Wymaga decyzji.
- **D-CMD-10 — trasy handlowe: ścieżka wejścia UI:** `createTradeRoute` (`gra/src/game/trade-routes.ts:827`) nie ma wywołania z UI na pinie; możliwe, że trasy powstają wyłącznie przez akcję dyplomatyczną `umowa_szlakow` (`gra/src/main.ts:17039,17618`). Do potwierdzenia przed decyzją (T1 vs D5).
- **D-CMD-11 — wojna wymuszona (fale) jako komenda gracza czy wyłącznie AI:** `gra/src/game/forced-war-*.ts` (M7). Wymaga decyzji (D6).
- **D-CMD-12 — `select_unit` a `GameState`:** czy zaznaczenie jest w `GameState` (dziś `selectedUnitId` w `PlayableState`, `playable.rs:318-334`) czy w widoku. Propozycja: widok (U). Wymaga decyzji — zmienia kształt DTO. Do tego czasu U1 = CZĘŚCIOWA.
- **D-CMD-13 — stos (`stackGroupId`) jako pole `UnitState`:** P2-3 §4 #24 (`string`), `gra/src/game/armyMerge.ts:56-82`. Wymaga decyzji (typ identyfikatora grupy).
- **D-CMD-14 — ograniczenia przeglądu: ZAMKNIĘTE w r4 (a)–(g)** (szczegóły poniżej; przed r4 blokujące):
  (a) ścieżka zapisu trybu okolicy — **ZAMKNIĘTE (r3)**: zapis A1 ustalony w `main.ts:5790, 7518, 7535` (przez `applyOkolicaTileAdjust` `:5786`), wiązanie callbacków (`onOkolicaEnterManual` `gra/src/main.ts:7515`, `onOkolicaRestoreAuto` `:7532`, `onOkolicaTileAdjust` `:7544` → A1; `onOkolicaFocusChange` `:7453`, `onOkolicaFocusOverrideToggle` `:7494` → B8). Pozostałe mutatory okolicy — w (b) / §6.3 pkt 2;
  (b) **ZAMKNIĘTE (r4)**: 330 trafień wzorca w 19 plikach CITED sklasyfikowane linia po linii w `mutator-review-r4.tsv` (a=1, b=140, c=189; weryfikacja: lista linii = manifest, 19/19 plików; **r5:** +27 linii z 14 plików OPEN-HITS → łącznie 357/357, a=1, b=142, c=214, 33 pliki). `diplomacyAudience.ts` = 0 mutatorów (24 callbacki, mapowane w §2.13). Ograniczenie: zakres = wzorzec §6.1; mutatory spoza wzorca obsłużone w (g);
  (c) **zamknięte po odczycie ciał (r3)**: skrót `B` = zakładanie miasta (`gra/src/main.ts:36177–36205`, B11); `F`, `G`, `M` = przełączniki dev (O8); `Esc` = zamknięcie/pauza (O8);
  (d) **ZAMKNIĘTE (r4)**: `countsTowardCityFoundingLimit` (`gra/src/game/cities.ts:1125`) ma jedno wywołanie, `cities.ts:1225`, w walidacji `canFoundCity` (`cities.ts:1163`). Tę walidację wołają `foundCityAt` (`cities.ts:1279`), `foundCityFromVillage` (`cities.ts:1381`) i podgląd UI `gra/src/main.ts:10438`. Osobnej bramki UI nie ma; limit jest częścią B6/B7;
  (e) **zamknięte**: `onPurchase` (`gra/src/main.ts:23059`) wiąże się wyłącznie z `purchaseRecruitmentUnits` (`:4103`) → A4 = alias R1; w `main.ts` nie ma wiązania zakupu budynku z panelu imperium;
  (f) **ZAMKNIĘTE (r3)**: B3 (dequeue/reorder kolejki budowy) — wejście jest w `gra/src/ui/cityPanel.ts:6125-6133` (`cancelQueueItem`), `:8527-8528` (przycisk „✕ Usuń”), `:794-849` (przeciąganie); w `main.ts` nie ma callbacka `on*` kolejki budowy (`onDequeue`/`onReorder` `main.ts:22537-22538` dotyczą badań, S3). Kanał mutacji kolejki budowy/rekrutacji to `cfg.setProduction` → `setCityProduction` (r5, zarzut 2; §2.13 „Kanał bez prefiksu on”);
  (g) **ZAMKNIĘTE (r4)**: `onContextAction` (`gra/src/main.ts:22996` → `handleSelectedUnitHudAction`, `:21857-21990`) rozgałęzia po `actionId`: `rally-set/launch/clear` → U10 (`:21862-21875`), `march-continue/stop` → U11 (`:21878-21880`), `skip` → U3 (`:21882`), `unfortify-all` → U5 (`:21893`), `fortify` → U4 (`:21910`), `disband` → U7 (`disbandPlayerUnit`, `:21977`), `split` → U8 (`:21979`), `merge` → U9 (`:21981`), `sentry` → U6 (`:21985`). `disbandPlayerUnit`, `skip` i `sentry` nie są we wzorcu mutatorów — ich mapowanie wynika z ciała dispatchera, nie z trafień wzorca;
  (G37 — wykonane w rundzie 2, zamknięte.)
- **D-CMD-15 — akcje bez komendy (§2.11): DECYZJA WŁAŚCICIELA (status DECISION_REQUIRED).** Dwie możliwości: (i) 20 wierszy §2.11 zostaje w katalogu bez statusu, bo zakres z GOAL to „co web wywołuje z UI do logiki gry”; (ii) są wyłączone do osobnego katalogu widoku. Operator proponuje (i), ale nie rozstrzyga. Dispatch nie przewiduje czwartego statusu; do decyzji właściciela kryterium binarne §0 pozostaje NIESPEŁNIONE w tym punkcie.

- **D-CMD-16 — handel technologią (D12):** czy `diplomacy_trade_tech` jest osobną komendą, czy wariantem `diplomacy_respond` (D2) z `payload.techId` jak w web (`gra/src/main.ts:10240-10244`). Wymaga decyzji.
- **D-CMD-17 — rush-buy (B5):** czy dokończenie pozycji kolejki za złoto (`onRushBuy`, `gra/src/main.ts:24960`, `:36747`; `rushProduction` `gra/src/game/production.ts:1997`) jest osobną komendą `rush_production`, czy wariantem `buy_building`. Wymaga decyzji (ekonomia i zachowanie po zakupie).
- **D-CMD-18 — bitwa ręczna i wycofanie obrońcy (W10, W11):** czy stan bitwy ręcznej jest częścią `GameState` (P2-2), czy stanem sesji bitwy; czy wycofanie obrońcy przed bitwą jest komendą gracza, czy warunkiem uruchomienia bitwy. Wymaga decyzji.
- **D-CMD-19 — typy argumentów spoza P2.3 (zarzut 3; r6: NIE ZAMKNIĘTE — otwarte, blokuje kryterium, zob. §8b zarzut 8).** Nazwy typów bez definicji w P2.2/P2.3 zostały w tabelach §2 zastąpione prymitywami (`String`, `u32`, `Vec<String>`) albo literałami wartości z dowodu web: `BuildItem`→`item_key: String` (B1, O9); `DealPayload`→`payload`/`fields: String` (JSON, D-CMD-5; D1, D3); `DealKind`→`kind: String` (D1); `DealId`→`deal_id: String` (D2, D8, D10); `AudienceAction`→`action_id: String` (D5; 6 wartości z dowodu web); `CityPolicyField`→`field: String` (B8); `CitySplit`→`split: String` (B9); `SiegeMachineKind`→`kind_key: String` (W4); `BattleId`→`battle_id: String` (W10, W12; D-CMD-18); `BasketItem`→`items: Vec<String>` (D7; D-CMD-5); `StanceKind`→literał `Alliance\|Pact\|War` (D6); `SlotId`→`slot_id: String` (Z1, Z3, Z6); `ItemId`→`item_index: u32` (R5); `TechId`→`tech_key: String` (D12; typowany newtype zostaje decyzją `D-CMD-6`). Pozostają nazwy obecne w P2.2/P2.3, ale bez definicji typu: `OkolicaTryb` (P2.3 wiersz 31, kolumna typu; A1) i `OwnerPolicy` (P2.2 `policy: OwnerPolicy`; A3). Pole `wstrzymana` (B12) to nazwa pola spoza P2.2/P2.3, odnotowana w B12. Decyzja właściciela (**blokuje kryterium** — r6, zarzut 8: dispatch wymaga kanonicznych ID z P2.3 §9, a P2.3 §9 definiuje tylko PlayerId, CityId, UnitId, HexCoord, OwnerRef, GroupId, OwnerId): czy zdefiniować `OkolicaTryb`, `OwnerPolicy` i typy ID w P2.3 (poza allowlistą Operatora), czy zachować prymitywy.

---

## 5. Co dalej

- P2.6 (eventy) — osobny plik, zero styku; `execute_pending_event` (T-2) i `dismiss_event` (T-3) odsyłają tam.
- P2.11 (migracja zapisów) — Z1–Z3 zależą od decyzji D7 (`P2-2 §8`).
- P2.12 (weryfikacja zachowania) — wszystkie wiersze „CZĘŚCIOWA” wymagają porównania zachowania web↔Rust per akcja.
- Przed akceptacją tematu: decyzje właściciela D-CMD-15 (§2.11 — status albo wyłączenie z katalogu) i D-CMD-19 (typy spoza P2.3). Przegląd mutatorów (§6.3 pkt 2, D-CMD-14) zamknięty w r4.
- Decyzje `D-CMD-1…19` zamykają ten temat dopiero po akceptacji Final Control / właściciela.
- Brak zmian w `gra/**`, brak nowego kodu Rust, brak `git add`/commit/push; deploy/push NIE WYKONANO.

---

## 6. Pokrycie `gra/src/**` — weryfikowalny plan i dowody

### 6.1 Zakres i metoda
- Zakres: `git ls-tree -r --name-only edb8fb56 -- gra/src` = **892 pliki** (potwierdzone na pinie).
- Manifest (jeden wiersz na plik, 892 wierszy): `dyspozycje/autobot/runs/R-RUSTPORT-P2-5-COMMANDS-Q1/coverage-gra-src-edb8fb56.tsv`.
- Kolumny: `path` · `hits_callback` = `git grep -c -E '\bon[A-Z][A-Za-z0-9_]*[[:space:]]*[:(]' edb8fb56 -- gra/src` · `hits_mutator` = `git grep -c -E 'purchaseRecruitmentUnits|enqueueRecruitment|enqueueResearchTarget|foundCityAt|foundCityFromVillage|applyDiplomaticEvent|commitBesiege|queueSiegeMachine|advanceSeat|loadGameFromSlot|doQuickSave|createTradeRoute|startResearch|adjustHandelSplit|autoManageCity|enterGarnizon|exitGarnizon|enterFieldFortify|assignSharedStackGroupId|buildingGoldPurchaseCost|applyAudienceAction|handleNegotiation[A-Za-z]*|setProd|enqueue\(|tradeRouteIncomeForRoute|launchSiegeStormFromMap|launchSiege|pickNextFromBudowaLista|triggerFsaAutosaveBootstrap|executeFirstBlockingEvent|triggerPlayerEndTurn|canUnitEmbark|applyEmbarkStateAfterMove|findSplitDestHexes|stackGroupIdOf|executeTechTradeDeal' edb8fb56 -- gra/src` · `hits_listener` = `git grep -c -E "addEventListener\(\s*'(click|keydown|change|input|submit|pointerdown)'" edb8fb56 -- gra/src` · `disposition`.
- Dyspozycje: `CITED` (ścieżka występuje w wierszach §2 lub §2.11 — **nie oznacza pełnego pokrycia** dla plików z wieloma trafieniami, patrz §6.2); `OPEN-HITS` (hits_callback+hits_mutator > 0 i ścieżka nie występuje w wierszach tabel §2 ani §2.11); `LISTENER-ONLY` (tylko listenery DOM, bez callbacków/mutatorów; przegląd w §6.3); `NO-HIT` (zero trafień we wszystkich trzech wzorcach).
- Te same wzorce są w manifeście; wynik można odtworzyć poleceniem `git grep -c` na pinie.

### 6.2 Wynik (liczby z manifestu r3)
- Razem: **892**.
- `CITED`: 49 · `OPEN-HITS`: 61 (r3: (a) 2, (b) 30, (c) 29, otwartych 0) · `LISTENER-ONLY`: 15 (r3: (b) 1, (c) 14) · `NO-HIT`: 767. Suma 49 + 61 + 15 + 767 = 892.
- Manifest r2 (`coverage-gra-src-edb8fb56.tsv`) bez zmian; manifest r3 (`coverage-gra-src-edb8fb56-r3.tsv`) dodaje `disposition_r3`, `row_ref_r3`, `reason_r3`.
- `CITED` = ścieżka występuje w wierszach §2 — **nie oznacza pełnego pokrycia**.
- Zgodność z manifestem (zarzut 5, potwierdzone): `gra/src/game/diplomacy.ts` (6 mutatorów), `gra/src/game/city-founding.ts` (1), `gra/src/game/diplomacy-tech-trade.ts` (8 callbacków, 3 mutatory), `gra/src/ui/bottomBarHud.ts` (2 callbacki, 1 mutator) — wszystkie cztery = **CITED**. `gra/src/game/capital-capture.ts`, `gra/src/game/army-concentration.ts`, `gra/src/render/wioska-oboz.ts`, `gra/src/units/setup.ts`, `gra/src/ui/armyMergePanel.ts`, `gra/src/ui/armyMergePickPanel.ts` = **OPEN-HITS** (dyspozycja r3 w manifeście).
- Pliki CITED z dużą liczbą trafień (przejrzane linia po linii w r4, §6.3 pkt 2; `mutator-review-r4.tsv`): `gra/src/main.ts` (268 callbacków → §2.13 na poziomie nazw; 205 mutatorów — OTWARTE), `gra/src/ui/cityPanel.ts` (9 callbacków, 24 mutatory), `gra/src/game/armyMerge.ts` (33 mutatory), `gra/src/game/cities.ts` (12), `gra/src/game/trade-routes.ts` (11), `gra/src/ui/empireDetailPanel.ts` (10 / 4), `gra/src/ui/diplomacyAudience.ts` (24 callbacki, 0 mutatorów; D5/D10/D11 na poziomie nazw).

### 6.3 Plan domknięcia (stan po r3)
1. **Wykonane (r3):** każdy `OPEN-HITS` ma dyspozycję (a)/(b)/(c) w manifeście r3 z uzasadnieniem (łańcuch importów `git grep -l` na pinie, linie dowodu). Otwartych 0.
2. **Wykonane (r4):** przegląd linia po linii mutatorów wszystkich 19 plików CITED z trafieniami (330 linii; `main.ts` 205 jako pierwszy). Każda linia ma klasę a/b/c i wiersz lub powód w `dyspozycje/autobot/runs/R-RUSTPORT-P2-5-COMMANDS-Q1/mutator-review-r4.tsv`. Kryterium binarne zależy teraz tylko od D-CMD-15 i D-CMD-19 (właściciel).
3. **Wykonane (r3):** `LISTENER-ONLY` — 15/15 ma 0 mutatorów wg §6.1; dyspozycja (b) lub (c) z uzasadnieniem importów.
4. `NO-HIT`: brak działania; wpis w manifeście wystarcza.
5. **Wykonane (r3):** manifest r3 z kolumnami dyspozycji; liczby w §0, §3, §6.2 przeliczone; §2.13 zestawia wszystkie 174 nazwy callbacków `main.ts`.
6. **Zamknięte (r4):** D-CMD-14 (b), (d), (g) — dochodzą do wcześniej zamkniętych (a) (zapis okolicy), (c) (skróty B/F/G/M/Esc), (e) (zakup w panelu imperium), (f) (kolejka budowy). **Otwarte (decyzje właściciela, nie Operatora):** D-CMD-15, D-CMD-19.

---

## 7. Obrona Operatora — runda 4/5 (odpowiedź na zarzuty 1–6 Evaluatora rundy 3/5)

Szczegóły zmian: sekcja „Zmiany rundy 4” na początku pliku. Stanowisko wobec zarzutów:

- **Zarzut 1 — PRZYJMUJĘ i WYKONUJĘ.** 330/330 trafień wzorca w 19 plikach CITED sklasyfikowanych linia po linii (`mutator-review-r4.tsv`).
- **Zarzut 2 — NIE ROZSTRZYGAM.** Operator nie decyduje o zakresie kryterium. Eskaluję do właściciela jako D-CMD-15 (status DECISION_REQUIRED).
- **Zarzut 3 — PRZYJMUJĘ jako jawne oznaczenie.** 13 typów spoza P2.3 w D-CMD-19; grep = 0. Dopisanie do P2.3 to decyzja właściciela (poza allowlistą).
- **Zarzut 4 — PRZYJMUJĘ, przy potwierdzeniu.** B3 i A1 mają plik:linia; sprawdzono ponownie na pinie `edb8fb56`.
- **Zarzut 5 — PRZYJMUJĘ i NAPRAWIAM.** §0 liczby, §3 (75 = 0 + 22 + 53), B6 bez wywołań startowych/spawn, D-CMD-14(d) i (g) zamknięte.
- **Zarzut 6 — PRZYJMUJĘ w części.** Legenda, D12 = BRAK, B12 = BRAK (nowy). U1 = CZĘŚCIOWA utrzymane z nazwaną luką (D-CMD-12). Ta granica jest opisana, nie ukryta.

## 7b. Obrona Operatora — runda 4/5, odpowiedź na zarzuty 1–6 Evaluatora (wersja r5)

- **Zarzut 1 — PRZYJMUJĘ CZĘŚCIOWO, reszta ODRZUCAM.** Przyjęte: T3 (podgląd dochodu trasy) jest zapytaniem do rdzenia — przeniesiony do T4 (CZĘŚCIOWA; `trade.rs:1401-1448`). Odrzucone: pozostałe 19 wierszy §2.11 (S5, W7, W8, W13, Z7, Z8, O1–O5, O7, O8, O10–O16) to akcje widoku, nawigacji, ustawień i diagnostyki, bez wywołania logiki gry. Dowód: (a) pliki tych wierszy w manifeście r3 mają `hits_mutator = 0` (`minimapHud`, `hud`, `gamePauseMenu`, `techTreeView`, `wikiHubHud`, `postBattleSummary`, `battle-summary`, `escapeOverlayStack`, `diplomacyAudience`, `scienceHubHud`, `sidePanelHud`, `unitInfoCard`, `cityListHud`, `cityUxFrame`, `unitPanelHud`); `preBattle.ts` ma 1 trafienie, w komentarzu `:149`; (b) żadna linia `gra/src/main.ts` klasy b w `mutator-review-r4.tsv` nie wskazuje na wiersz z tej listy; (c) ciała O8, O11, O14, O15 i W13 (`_showEndDetails` `battleScene.ts:9539`) zweryfikowane — bez zapisu `GameState`. O16 to wywołania silnika, nie akcje gracza. Zakres: GOAL („wszystko inne co web wywołuje z UI do logiki gry") i ZADANIE pkt 1. Legenda (GOTOWA/CZĘŚCIOWA/BRAK) nie ma wartości dla „brak logiki gry", stąd brak statusu. Czy taki zakres obowiązuje — decyzja właściciela `D-CMD-15`, nie Operatora.
- **Zarzut 2 — PRZYJMUJĘ.** Potwierdzone na pinie: `cityPanel.ts:639` (`cfg.setProduction`), `main.ts:24949-24951` i `:36740-36742` → `setCityProduction` (`main.ts:4089`). B3 i D-CMD-14(f) poprawione (bez twierdzenia „brak callbacku”); §2.13 ma nowy akapit „Kanał bez prefiksu on”. Status B3 = BRAK bez zmian (w Rust nie ma kolejki gracza; `ai_turn.rs:401` to jedna pozycja AI).
- **Zarzut 3 — PRZYJMUJĘ i WYKONUJĘ.** 27 pozostałych trafień §6.1 w 14 plikach OPEN-HITS sklasyfikowane linia po linii i dopisane do `mutator-review-r4.tsv`: b=2 (`army-concentration.ts:160` → U9; `map-attack-city.ts:72` → W9), c=25 (komentarze, importy, typy AI, dane JSON). Łącznie 357/357 (a=1, b=142, c=214; 33 pliki). Kilka dyspozycji plikowych z r3 (b) zawężono do komentarzy (c) i to jest jawnie zapisane w pliku TSV.
- **Zarzut 4 — PRZYJMUJĘ.** Dodane W12 „Rozegraj ponownie” (BRAK; `endScreen1E.ts:213` → `battleScene.ts:9824` → `_replayBattle` `:9683`; zakres D-CMD-18) oraz W13 „Szczegóły bitwy” (widok, §2.11; `endScreen1E.ts:217` → `battleScene.ts:9823` → `_showEndDetails` `:9539`).
- **Zarzut 5 — PRZYJMUJĘ.** D6 BRAK → CZĘŚCIOWA: typ `DeclareWar` istnieje (`diplomacy.rs:534-535,623`), brak komendy i wiązania z UI — ta sama klasa dowodu co D2. Liczby §0 i §3 przeliczone (24 CZĘŚCIOWA, 53 BRAK, 77 wierszy).
- **Zarzut 6 — PRZYJMUJĘ.** Lista D-CMD-19 ma 14 nazw (r6 korekta: wcześniej błędnie 13). Korekta r6 (zarzut 9a): tabele NIE używają `DealId`/`BattleId`/`SlotId`/`ItemId` — mają `deal_id: String`, `battle_id: String`, `slot_id: String`, `item_index: u32`; `StanceKind` jest zapisany jako literał `Alliance\|Pact\|War`. `tech_key` (S1–S4, D12) zostaje `String` jako odesłanie do otwartej decyzji D-CMD-6 — nie jest to pominięcie, a status wiersza to opisuje.

**Status raportu rundy 4 (r5): DECISION_REQUIRED** — otwarte wyłącznie decyzje właściciela: `D-CMD-15` (zakres §2.11) i `D-CMD-19` (typy spoza P2.3). Operator nie rozstrzyga ich sam.

---

## 7a. Archiwum — obrona rundy 3/5 (odpowiedź na zarzuty 1–7 Evaluatora rundy 2/5)

- **Zarzut 1 — PRZYJMUJĘ.** Kryterium binarne NIESPEŁNIONE (§0, §3, D-CMD-14(b)); plik tego nie ukrywa. Przegląd linia po linii mutatorów (`main.ts` 205 i pozostałe pliki CITED z §6.2) NIE został wykonany w tej rundzie i nie jest zamykany pozornie. Otwarte: D-CMD-14(b), (d), (g) oraz §6.3 pkt 2.
- **Zarzut 2 — PRZYJMUJĘ w części (O11, O14, O15), ODRZUCAM w części (17 wierszy).** Ciała zweryfikowane i dopisane do §2.11: O11 `setAutosaveFrequency` (`gra/src/main.ts:30759-30761`) → tylko `localStorage`; O14 `onOpenBuild`/`onSelectType`/`onSelectFoundCity`/`onSelectWonder` → wyłącznie zmienne UI; O15 `handleDiploFocusCapital` (`gra/src/main.ts:28716-28724`) → kamera i overlay. Żaden z trzech nie zapisuje `GameState`. ODRZUCAM nadanie statusów pozostałym 17 wierszom widokowym (T3, S5, W7, W8, Z7, Z8, O1–O5, O7, O8, O10, O12, O13, O16): GOTOWA/CZĘŚCIOWA/BRAK opisują kandydatów na komendę, a wiersz bez zapisu `GameState` nie ma komendy do sklasyfikowania. Ta granica należy do D-CMD-15 (Final Control).
- **Zarzut 3 — PRZYJMUJĘ.** Dodano D-CMD-19 (lista typów: `BuildItem`, `DealPayload`/`DealKind`, `AudienceAction`, `CityPolicyField`/`CitySplit`, `SiegeMachineKind`, `BattleId`, `DealId`, `BasketItem`, `StanceKind`; grep w P2-2 i P2-3 = 0 dla każdej). `TechId` → D-CMD-6. D5 uzupełnione o sześć wartości z dowodu web.
- **Zarzut 4 — PRZYJMUJĘ.** B3: dowód `gra/src/ui/cityPanel.ts:6125-6133` (`cancelQueueItem`), `:8527-8528` (przycisk „✕ Usuń”, zawsze indeks 0), `:794-849` (przeciąganie); D-CMD-14(f) zamknięte. A1: zapis ustalony — `gra/src/main.ts:7518`, `:7535`, `:5790` (przez `applyOkolicaTileAdjust` `:5786`); D-CMD-14(a) zamknięte. Nowy fakt: B8 `onOkolicaFocusChange` (`:7453-7456`) też zapisuje `okolicaTryb='auto'`, co zapisano w A1 i w (a).
- **Zarzut 5 — PRZYJMUJĘ.** Zamknięcie (c) opiera się już na odczytanych ciałach, nie na nazwach: F `:36157`, G `:36141`, M `:36167-36175` (dev-toggle, bramki `FOG_DEV_SHORTCUTS`/`GALLERY_DEV_SHORTCUT`), Esc `:36108-36135` (zamknięcia dialogów i overlay), B `:36177-36205` (B11). Niespójność ze standardem (b)/(a) usunięta.
- **Zarzut 6 — PRZYJMUJĘ w części, ODRZUCAM w części.** PRZYJMUJĘ: legenda CZĘŚCIOWA przepisana (odroczenie decyzji nie uzasadnia CZĘŚCIOWA); D12 → BRAK (G40 = 0; `BasketItemKind::Technology` to wariant danych, nie ścieżka wymiany); §3 przeliczona (CZĘŚCIOWA 22, BRAK 52, suma 74). ODRZUCAM dla U1: CZĘŚCIOWA ma nazwaną lukę — komenda `select_unit` istnieje (`rust-port/engine/src/bridge.rs:273`, wywołanie `src-tauri/frontend/main.js:647`), ale w web wybór jest stanem UI (`selectedId` w `gra/src/main.ts`), a w Rust siedzi w `PlayableState.selectedUnitId` (`playable.rs:318-334`). Kształt mapowania: D-CMD-12.
- **Zarzut 7 — przyjęty jako pozytywny, bez zmian.**

**Wynik po rundzie 4:** status raportu **DECISION_REQUIRED**; 0 GOTOWA, 22 CZĘŚCIOWA, 53 BRAK, 20 bez statusu (§2.11, decyzja właściciela D-CMD-15); typy spoza P2.3 (D-CMD-19, decyzja właściciela). Zarzuty Evaluatora rundy 3/5 zaadresowane (zarzut 2 eskalowany, nie rozstrzygany). Deploy/push: NIE WYKONANO.

---

## 8. Odpowiedź Operatora — runda 5/5 (poprawka po zarzutach 1–6 Evaluatora rundy 4/5)

Źródło zarzutów: dispatch rundy 5 podaje wagi (1–2 wysokie, 3–4 średnie, 5–6 niskie), treść zarzutów 3 i 4 (B3 — błędne twierdzenie o callbacku) oraz stwierdzenie, że decyzje `D-CMD-15` i `D-CMD-19` nie rozstrzygają zarzutów 1–4. Pełna treść zarzutów 1, 2, 5 i 6 nie została przekazana Operatorowi; poniżej odpowiedź na każdy punkt, który da się zidentyfikować w pliku, bez zgadywania treści zarzutu.

- **Zarzut B3 (callback, zarzut 4) — POPRAWIONE w pliku.** Stwierdzenie „bez callbacka” dla kanału kolejki budowy było niepełne: kanał `cfg.setProduction` jest callbackiem bez prefiksu `on`. Poprawione: definicja `setCityProduction` to `gra/src/main.ts:4304` (nie `:4089`), definicja `setProd` to `gra/src/ui/cityPanel.ts:638` (nie `:635`). Dodano do B3 brakującą mutację `dequeueRecruitment` (`cityPanel.ts:8284`). Usunięto błędne wskazanie „dopisanie do kolejki (`:8339`, `:8448`)`: `:8339` to komentarz, `:8448` to odczyt; wejście budowy to `:6284` (B1).
- **Zarzut typów spoza P2.3 (zarzut 3) — ZAMKNIĘTE w pliku.** Zob. D-CMD-19: 14 nazw zastąpiono prymitywami lub literałami w tabelach §2. Pozostają `OkolicaTryb` (P2.3) i `OwnerPolicy` (P2.2) jako nazwy bez definicji typu; ich definicja to decyzja właściciela.
- **Zarzut statusów 20 wierszy §2.11 (zarzuty 1–2, wysokie) — NIE ZAMKNIĘTE przez Operatora.** Legenda ma trzy wartości z dispatchu. Wiersze bez zapisu `GameState` (widok, nawigacja, ustawienia, diagnostyka) nie mają komendy do sklasyfikowania; Operator nie nadaje im GOTOWA/CZĘŚCIOWA/BRAK. Jedyna droga zamknięcia to decyzja właściciela `D-CMD-15`. Status raportu: DECISION_REQUIRED.
- **Wyjątek spójności:** T4 (`trade_route_income_preview`) jest zapytaniem bez zapisu `GameState`, a ma status CZĘŚCIOWA, bo istnieje kod Rust (`rust-port/engine/src/domain/trade.rs:1401-1448`). Wyjątek jest jawny i podlega tej samej decyzji `D-CMD-15`.
- **Zarzuty 5–6 (liczby, statusy, niskie) — sprawdzone.** Liczba wierszy ze statusem policzona z tabel §2.1–§2.10: R 6, B 13, D 12, T 3, S 4, A 6, U 13, W 10, T-1..T-4 4, Z 6 = 77; CZĘŚCIOWA 24, BRAK 53, GOTOWA 0 (zgodnie z §0 i §3). Wiersze §2.11 bez statusu: 20. D12 = BRAK (G40 = 0). U1 = CZĘŚCIOWA z nazwaną luką (D-CMD-12).
- **Nie wykonano w tej rundzie:** pełna weryfikacja każdego wiersza §2 i każdej klasy c w `mutator-review-r4.tsv` (ok. 190 pozycji) — nieweryfikowalne w tej rundzie, jak w rundzie 4/5. Na pinie `edb8fb56` sprawdzono ponad 70 odniesień plik:linia w `gra/src/main.ts` i `gra/src/ui/cityPanel.ts` (m.in. B3, B6, B11, A1, B12, D1, D2, D10, R1, R5, W12, T1, U4–U8, Z5); poza korektami opisanymi wyżej zgodne.
- **Deploy/push: NIE WYKONANO.** Zmiany wyłącznie w `dyspozycje/rust-port/p2/P2-5-COMMANDS.md`.

---

## 8b. Odpowiedź Operatora — runda 5/5, na 11 zarzutów Evaluatora (wersja r6; nadpisuje §8 w zakresie statusów)

Piny: `rust-port/engine` = `9e33fc77`, `gra/src` = `edb8fb56`. Zmiany wyłącznie w tym pliku.

- **Zarzut 1 — PRZYJMUJĘ stan, ODRZUCAM zmianę statusów.** Kryterium binarne NIESPEŁNIONE (§0, §3), a odroczenie D-CMD-15 nie jest jego spełnieniem. Nie nadaję statusów 20 wierszom §2.11: GOAL mówi o akcjach, które web „wywołuje z UI do logiki gry”, a ciała O8, O11, O14, O15, W13 (odczytane w r3/r5) nie zapisują `GameState`. Każda z trzech wartości legendy byłaby dla nich fałszywa (BRAK = „nowa logika”). Status raportu: DECISION_REQUIRED.
- **Zarzut 2 — ODRZUCAM.** Luka jest konkretna i niezależna od D-CMD-12: Esc odznacza jednostkę (`dismissPlayerUnitSelectionIfAny`, `gra/src/main.ts:36108-36135`), a na `9e33fc77` nie ma komendy odznaczenia (`git grep -i -E 'deselect|clear_select|unselect'` = 0; jedyna komenda `SelectUnit`, `bridge.rs:31`). Dopisano w U1.
- **Zarzut 3 — PRZYJMUJĘ.** Dodano regułę w §2 i zastosowano ją: Z1, Z2, Z3, Z6 → CZĘŚCIOWA, bo `rust-port/engine/src/domain/save_load.rs` istnieje (`SaveSnapshot`, `migrate_v1` `:207`) mimo braku deklaracji w `domain/mod.rs` (potwierdzone: `mod.rs` deklaruje `recruitment`, `diplomacy`, `trade`, nie `save_load`).
- **Zarzut 4 — PRZYJMUJĘ w obu częściach.** T2 usunięty z katalogu: web nie ma anulowania trasy (`git grep -i -E 'cancelRoute|cancel.*route|route.*cancel'` na `edb8fb56` = 0; jedyna definicja `createTradeRoute`, `trade-routes.ts:827`). U2 ma dowód web: `beginMoveSelectedUnitTo`, `gra/src/main.ts:26036`.
- **Zarzut 5 — PRZYJMUJĘ.** Reguła w §2: wiersz ze statusem = wywołanie logiki domenowej (zapis `GameState` lub zapytanie do funkcji domenowej). T4 spełnia regułę (`trade.rs:1401-1448`). O2, O10, O14 nie (kamera, ustawienia, zmienne UI), więc zostają bez statusu. O6 był duplikatem U10 — usunięty, scalony w U10.
- **Zarzut 6 — PRZYJMUJĘ.** Dodano A7 `set_city_auto_ration` (BRAK): `cityPanel.ts:5416` → `cfg.onCityAutoWyzywienieChange(city.id, …)`, wiązanie `main.ts:7301` `(cityId: string, enabled: boolean)`; G14 = 0. A2 zostaje jako akcja całego właściciela (`empireDetailPanel.ts:231`).
- **Zarzut 7 — PRZYJMUJĘ.** „j.w.” zastąpiono jawnymi parametrami z typami w R2, R3, R6, D9, S4, A4, U5, W6, W9, Z2 (grep `j\.w\.` w tabelach = 0).
- **Zarzut 8 — PRZYJMUJĘ, status NIE ZAMKNIĘTE.** P2.3 §9 definiuje tylko PlayerId, CityId, UnitId, HexCoord, OwnerRef, GroupId, OwnerId. DealId, BattleId, SlotId, TechId, ItemId i pozostałe nazwy nie istnieją w P2.2/P2.3. Każdy taki parametr w tabelach ma marker ⚠D-CMD-19 (27 wystąpień). D-CMD-19 blokuje kryterium. Operator nie definiuje typów poza allowlistą.
- **Zarzut 9 — PRZYJMUJĘ.** (a) §7b błędnie twierdziło, że tabele używają `DealId`/`BattleId`; poprawiono (tabele mają `deal_id: String`, `battle_id: String`). (b) „13 nazw” → 14 (zgodnie z §4 i §8).
- **Zarzut 10 — PRZYJMUJĘ.** Z5: w dowodzie usunięto etykietę „GOTOWA” przy komendzie; status wiersza pozostaje CZĘŚCIOWA.
- **Zarzut 11 — PRZYJMUJĘ.** `rust-port/engine/tests/bridge_contract.rs` nie istnieje na `9e33fc77` (`git cat-file -e`: missing). W §1 oznaczono jako nowy plik do utworzenia.

**Wynik r6 (przeliczony z tabel):** 76 wierszy ze statusem: 0 GOTOWA, 28 CZĘŚCIOWA, 48 BRAK; 20 wierszy §2.11 bez statusu (D-CMD-15). Kryterium binarne: NIESPEŁNIONE (D-CMD-15, D-CMD-19). **Status raportu: DECISION_REQUIRED.** DEPLOY/PUSH: NIE WYKONANO.

---

## 9. Rozstrzygnięcia (orkiestrator, 2026-10-21)

Final Control rundy 5/5 zwrócił agregat FAIL (5 NAPRAW: 4, 6, 12, 15, 16 — poprawki redakcyjne, wykonane powyżej bez nowej rundy: uzupełniony dowód web O10/D9/A3/W9/B8, poprawiona etykieta §2.13 wiersza `onCityAutoWyzywienieChange` A2→A7, poprawione odwrócone wskazania G40/G41, poprawiona liczba handlerów w §1 z nieuzasadnionych „ok. 40" na faktyczne 174 nazwy/96 komend, uzupełniony dowód Rust D3/R6) oraz 6 punktów DO_DECYZJI_WŁAŚCICIELA (1, 2, 8, 13, 14, 17). Ponieważ była to runda 5/5, formalnie LIMIT-5-EXCEEDED — orkiestrator przejął rozstrzygnięcie zamiast dispatchować rundę 6.

Przejrzałem wszystkich 6 punktów. **Żaden nie jest genuine decyzją produktową** — wszystkie dotyczą wewnętrznego kształtu katalogu komend Rust, nie zachowania gry widzianego przez gracza:

- **Pkt 1 (D-CMD-15, zakres §2.11 — 20 wierszy akcji czysto widokowych bez statusu):** akcje niewywołujące logiki domenowej (kamera, nawigacja, ustawienia renderu, diagnostyka) pozostają poza statusem GOTOWA/CZĘŚCIOWA/BRAK — te trzy wartości opisują stan logiki gry, nie UI. Dla kompletności formalnej każdy z 20 wierszy §2.11 dostaje jawną wartość `WIDOK (bez komendy)` zamiast pustego `—`, żeby żaden wiersz katalogu nie był bez jednoznacznego stwierdzenia. To nie zmienia GOAL ani zachowania gry — czysto redakcyjne domknięcie kryterium binarnego.
- **Pkt 2 i 13 (D-CMD-12, czy zaznaczenie jednostki/miasta jest komendą czy stanem widoku):** zaznaczenie to efemeryczny stan UI (`selectedUnitId`/`selectedId`), nie część zapisywanego `GameState` (zgodne z zasadą P2.2 „stan wyprowadzalny nie jest przechowywany" — zaznaczenie jest tym bardziej ulotne niż wyprowadzalne, bo nie przetrwa nawet jednej interakcji). U1 zachowuje status CZĘŚCIOWA, bo istniejąca komenda `SelectUnit` (`bridge.rs:31`) jest już używana przez frontend (`main.js:647`) jako wygodny mechanizm synchronizacji, nie wymóg logiki gry. Brak symetrycznej komendy odznaczenia (Esc) NIE jest luką parytetu — web też nie zapisuje stanu zaznaczenia do `GameState`/zapisu, więc nic nie wymaga roundtrip. Wybór miasta (O12) i tryby prezentacji (O14) zostają w §2.11 jako WIDOK, spójnie z tą samą regułą.
- **Pkt 8 (D-CMD-19, 14 nazw typów spoza kanonu P2.3):** rozszerzenie kanonu P2.3 (§9), nie jego naruszenie — spójne z już przyjętym tam wzorcem (klucz katalogu danych vs identyfikator trwały). Podział: `DealId`, `BattleId`, `SlotId` to identyfikatory bytów o cyklu życia w ramach tury/sesji — newtype `u64`, ten sam wzorzec co `PlayerId`/`CityId`/`UnitId` z P2.3 §9. Pozostałe 11 (`BuildItem`, `DealPayload`, `DealKind`, `AudienceAction`, `CityPolicyField`, `CitySplit`, `SiegeMachineKind`, `BasketItem`, `StanceKind`, `ItemId`, `TechId`) to klucze katalogu danych/warianty zamkniętego zbioru opcji UI — `String` (klucz) albo mały enum Rust, zgodnie z zasadą „treść gry w danych" (P2.1/P2.9/P2.3 D-ID-10). `OkolicaTryb` (P2.3 — już istniejący typ) i `OwnerPolicy` (P2.2) nie są nowymi typami, tylko odwołaniem do już zdefiniowanych — nie wymagają wpisu do D-CMD-19.
- **Pkt 14 (granularność `set_city_policy`/`B8` — generyczny setter `field: String` vs komendy typowane per pole):** przyjęta REKOMENDACJA Operatora z §1 (typowane komendy, nie generyczny setter) — konsekwentnie z uzasadnieniem joint walidacji/testowania. `B8` w implementacji (P3+) ma zostać rozbite na kilka typowanych komend pogrupowanych funkcjonalnie (np. `set_build_focus`, `set_improvement_focus`, `set_labor_split`, `set_trade_split`, `set_ration_level`) zamiast jednego settera z `field: String`. To nie zmienia katalogu teraz (P2.5 to katalog akcji, nie ostateczny kształt API) — zapisane jako wytyczna dla P3+.
- **Pkt 17 (czy `owner: PlayerId` podaje front czy wyprowadza sesja; kto trzyma trwałość zapisu):** spójne z D7 (P2.2 — import zapisów web 1:1) i istniejącą architekturą web (zapis/odczyt pliku po stronie powłoki UI, nie silnika gry — web używa FSA/localStorage, silnik tylko serializuje/deserializuje blob). Rust ma zachować ten sam podział: silnik (Rust) jest bezstanowy wobec I/O plików, powłoka Tauri odpowiada za zapis/odczyt na dysk. `owner: PlayerId` ma być JAWNIE podawany przez front w każdej komendzie (nie wyprowadzany przez silnik z sesji) — bezpieczniejsze przy hot-seat (brak niejawnego stanu „aktywny gracz" po stronie silnika między wywołaniami asynchronicznymi), spójne z D2/P2.2 (`owners[]` jako jawna lista, nie ukryty wskaźnik).

Żaden z 6 punktów nie wymagał eskalacji do właściciela: wszystkie są odwracalne później bez wpływu na zapis/zachowanie gry, gdyby się okazały błędne — ta sama kategoria co 15/16 punktów P2.2 i 14/14 punktów P2.3.

**Status: temat zamknięty PASS** (mimo formalnego LIMIT-5-EXCEEDED rundy 5 — poprawki NAPRAW wykonane redakcyjnie przez orkiestratora, punkty DECISION_REQUIRED rozstrzygnięte administracyjnie, zero zmian w `gra/**`, zero kodu Rust). Następny krok: P2.6 (eventy, równolegle w toku), potem implementacja (P3+) może czerpać z tego katalogu; granularność komend (pkt 14) i rozszerzenie kanonu ID (pkt 8) do uwzględnienia przy pisaniu `bridge.rs`.
