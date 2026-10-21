# P2.11 — Reguła migracji zapisów web → `GameState` kanoniczny (Rust/Tauri)

**Temat:** `R-RUSTPORT-P2-11-SAVE-MIGRATION-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Status:** PROPOZYCJA. Każdy punkt bez jednoznacznej odpowiedzi w materiale źródłowym jest oznaczony `D-MIG-n` i NIE jest rozstrzygnięty po cichu. Tabela §4 zawiera 22 klucze top-level + 94 klucze `meta` (łącznie 116 wierszy).

**Piny:**
- web: `main` = `edb8fb56` (odczyt `git show edb8fb56:gra/src/…`), zapis: `gra/src/game/save.ts`, `gra/src/main.ts` (budowa `30476-30682`).
- Rust: `rust-port/parity-v2` = `9e33fc77` (odczyt `git show 9e33fc77:rust-port/engine/src/domain/save_load.rs`).

**Materiał źródłowy:** P2.2 (kontrakt `GameState`, §2 szkielet, §4 klasyfikacja `meta`, §8 rozstrzygnięcia D1–D14 i pkt 9–10), P2.3 (ID i pola jednostek/miast, §4–§5, §9 rozstrzygnięcia), P2.7 (katalog 22+94 kluczy). Nie projektowano kontraktu `GameState` ani schematu ID od nowa. Zero zmian w `gra/**`, zero kodu Rust.

---

## 0. Wynik w skrócie

1. **Architektura:** jednorazowy import (web v3 → zapis natywny Rust). Import czyta surowy JSON (nie typowany DTO), mapuje pola na `GameState` z P2.2/P2.3 i zapisuje wynik w natywnym formacie. Zgodne z §8 D7 P2.2 (import jednokierunkowy). Odwrotność (Rust → web) NIE jest propozycją — kierunek rozstrzygnięty przez właściciela w P2.2 §8 D7 (2026-10-21), `D-MIG-22` zamknięty; otwarta pozostaje tylko konsekwencja dla współdzielenia zapisów.
2. **Sprawdzone fakty z kodu, które zmieniają lub uzupełniają P2.2/P2.3:**
   - Web **nie zapisuje stanu RNG** (builder nie ma żadnego pola RNG; `gra/src` ma 82 wystąpienia `Math.random`). Kontynuacja po imporcie nie może być bit-w-bit zgodna z kontynuacją web → `D-MIG-3`.
   - Web **odrzuca** zapisy `wersja < 3` i `> 3` (`IncompatibleSaveFormatError`, `save.ts` `deserializeGame`). Brak migracji v2→v3 jest celowy (ABC-4).
   - Web ma **aktywną migrację przy wczytaniu** (`migrateLegacyFarmsOnForestInSave`, `save.ts:562`), która modyfikuje dwa nośniki (`mapSnapshot` i `meta.placedImprovements`). Import musi ją odtworzyć → `D-MIG-16`.
   - Trzy korekty rozstrzygnięć P2.2 §8 / P2.3 §9 wynikające z typów w kodzie web: `rallyPoints` jest per właściciel (nie per jednostka, D13b), `autoManageCities` jest per miasto (nie per właściciel, D14), `placedImprovements` i `hexClearingStates` są kluczowane heksem (nie miastem, pkt 9a/9c) → `D-MIG-6`, `D-MIG-18`, `D-MIG-16`.
   - `gracze[]` (`GraczSaveV3`, `save.ts:322`) ma 11 pól, z których `skarbiec`, `nauka`, `zbadane`, `badana`, `researchQueue` i pola tempa NIE mają miejsca w szkielecie `OwnerState` (P2.2 §2) → `D-MIG-4`.
   - Oblężenie: `siegeTurnByCity` (tura startu oblężenia) NIE jest wyprowadzalne z pola `oblega` na jednostce, wbrew P2.3 §9 pkt 9 → `D-MIG-11`.
3. **Liczby:** 22 klucze top-level, 94 klucze `meta` (zweryfikowane listą z buildera, zgodne z P2.7). Wynik klasyfikacji w §5.

---

## 1. Architektura migracji (propozycja)

### 1.1 Rodzaj: jednorazowy import, nie dwukierunkowa kompatybilność
- Import: zapis web v3 → `PersistenceEnvelope { version: 2, state: GameState, … }` (natywny format Rust). Gra działa potem wyłącznie na natywnym formacie.
- Zgodne z §8 D7 P2.2 („import jest jednokierunkowy (web → Rust), nie wymaga żeby Rust zapisywał w formacie czytelnym przez web”).
- Konsekwencje dla gracza (wynikają z P2.2 §8 D7; `D-MIG-22` zamknięty):
  - zapis wykonany w Rust NIE wczyta się w web (gracz na starej wersji nie dostanie zapisu z nowej);
  - gracz nowej wersji wczyta zapis web v3 jednorazowo; po pierwszym zapisie w Rust zapis nie wraca do web.
  - Współdzielenie zapisów między graczami na obu wersjach działa tylko w jedną stronę (web → Rust).

### 1.2 Wejście: surowy JSON, nie `GameStateDto`
Moduł `save_migration` (nowy, w fazie implementacji) przyjmuje `serde_json::Value`. Nie deserializuje do typów Rust, bo:
- web ma pola opcjonalne (`tradeRoutes?`, `seed?`, `mapSnapshot?`, `autoMarch?`, …) i defaulty w `deserializeGame` (np. `humanOwnerIds` domyślnie `[0]`, `tura` domyślnie `1`);
- web toleruje dodatkowe klucze (`meta` bez whitelisty, `save.ts:724`) — patrz `D-MIG-20`.

### 1.3 Kroki importu (kolejność)
1. **Detekcja formatu:** obecność klucza `wersja` (liczba) i brak `version` → ścieżka web. Obecność `version` → ścieżka natywna (`D-MIG-2`).
2. **Bramka wersji:** `wersja == 3` przechodzi. `< 3` → błąd „zapis sprzed hot-seat, nie migrowany” (odpowiednik `IncompatibleSaveFormatError`). `> 3` → błąd „nowsza wersja”. Patrz §3, `D-MIG-1`.
3. **Walidacja kształtu wejścia:** `units`, `cities`, `exploredByHuman`, `gracze`, `humanOwnerIds`, `meta` — tablice/obiekty, z defaultami zgodnymi z `deserializeGame` (`D-MIG-20`).
4. **Tabela ID legacy → nowe ID** (`D-MIG-21`): budowana przed mapowaniem bytów, używana przez wszystkie referencje (w jednostkach, miastach i w `meta`).
5. **Migracje web przy wczytaniu** w kolejności web: `migrateLegacyFarmsOnForestInSave` (`D-MIG-16`).
6. **Mapowanie 22 kluczy top-level i 94 kluczy `meta`** na pola `GameState` (§4). Pola U są czytane i odrzucane.
7. **Stan losowości:** `rng` z `seed` (`D-MIG-3`); `event_queue` pusta (web jej nie zapisuje).
8. **Zapis natywny** (envelope v2) — dopiero po przejściu wszystkich kroków (import atomowy: błąd w dowolnym kroku = brak zapisu wynikowego).

### 1.4 Czego import NIE robi
- Nie przelicza wyprowadzalnych pól (P2.2 §1 pkt 2, INV-3): np. `manpowerMax`, flagi `ma*` miasta (P2.3 D-ID-11).
- Nie zgaduje brakujących danych: brak wymaganego pola → błąd, chyba że jest jawnie zdefiniowany default (§3).

---

### 1.5 Konwersja pozycji i właściciela (rozstrzygnięcia P2.3 §9: D-ID-6, D-ID-7, D-ID-8)

P2.3 §9 wprost przypisuje konwersję pozycji i właściciela do P2.11 (`dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md`, §9, punkt „P2.11 …”). Reguły importu:

- **Pozycja (D-ID-6).** Web `units` i `cities` mają `q`, `r` (number; P2.3 §4 wiersze 5–6, §5 wiersze 3–4) → `HexCoord { q: i32, r: i32 }` 1:1, bez przeliczania. `PositionDto { x: u16, y: u16 }` NIE jest celem importu (warstwa DTO). Wartość niecałkowita lub poza zakresem `i32` → błąd importu. Klucze stringowe `"q,r"` (`exploredByHuman`, `placedImprovements`, `hexClearingStates`, `lootedVillageHexKeys`, `barbCamps`, `clearedBarbCampHexes`, `mapSnapshot`) → parsowanie do `HexCoord`, bez tabeli ID.
- **Właściciel (D-ID-7, D-ID-8).** `ownerId` (number) → `OwnerRef`:
  - `0` → `OwnerRef::Player(PlayerId(0))` — człowiek; kanon 0 (D-ID-8; web `human-owners.ts:21`). Stała `HUMAN_PLAYER_ID = 1` w `rust-port/engine/src/domain/playable.rs:15` jest placeholderem do zmiany i import jej nie stosuje;
  - `n ≥ 1` → `OwnerRef::Player(PlayerId(n))` — ID AI zachowane 1:1, bez przenumerowania;
  - `-1` → `OwnerRef::Barbarian` (web `barbarians.ts:49`);
  - `-99` → `OwnerRef::Rebel` (web `society-breakdown.ts:206`; dotyczy też `rebelPreviousOwnerId`, P2.3 §5 wiersz 47);
  - inna wartość ujemna lub nie-liczba → błąd importu.
  Ta sama konwersja dotyczy `humanOwnerIds`, `activeHumanOwnerId`, kluczy `*ByOwner` i par `"a_b"` (`diploRelations`).

**Cykl życia tabeli `legacy_id → nowe ID` (D-MIG-21).** Tabela powstaje w kroku 4 (§1.3) i żyje przez cały czas trwania importu (kroki 4–8), atomowo razem z importem; po zapisie wynikowym jest porzucana. Nie jest zapisywana, bo P2.3 §9 D-ID-1 zabrania stringowych ID w stanie gry. Ponowny import tego samego pliku buduje tabelę od nowa z licznika (D-ID-3): numery ID różnią się między importami, struktura nie. Odwołania z sesji (UI) nie używają legacy ID — po imporcie gra zna wyłącznie ID natywne.

---

## 2. Wersjonowanie (propozycja, pyt. 5 zadania)

| Wejście | Rozpoznanie | Ścieżka |
|---|---|---|
| web `wersja == 3` | klucz `wersja` (number) | mapowanie `M-WEB-V3` (§4) |
| web `wersja < 3` | jw. | odrzucone, komunikat „sprzed hot-seat”, brak migracji (zgodnie z web, `D-MIG-1`) |
| web `wersja > 3` | jw. | odrzucone „nowsza wersja”; NOWA wersja web wymaga NOWEGO mapowania (plik `M-WEB-V4`), nie cichego rozszerzenia |
| web, dodatkowe pole opcjonalne bez podbicia wersji | jw. | ignorowane (tolerancja jak w web, `D-MIG-20`) |
| natywny Rust `version == 2` | klucz `version` | ścieżka natywna, bez mapowania |
| natywny Rust `version != 2` | jw. | odrzucone (zgodnie z `save_load.rs:138`) |
| `mapSnapshot.fmt != 2` | pole w mapSnapshot | odrzucone jako nieprawidłowy snapshot mapy (`D-MIG-9`) |

Zasada: podbicie `SAVE_VERSION` w web = łamiąca zmiana = nowe mapowanie. Dodanie pola opcjonalnego bez podbicia = tolerancja w `M-WEB-V3`.

---

## 3. Bramki i defaulty (zgodne z `deserializeGame`, `save.ts`)

| Pole | Gdy brak / błędny typ | Źródło |
|---|---|---|
| `wersja` | błąd (brak lub nie-number) | `readVersion`, `save.ts:479` |
| `tura` | `1` | `deserializeGame` |
| `seed` | `undefined` (typ dopuszcza brak) — `D-MIG-9` | typ `SaveGame` |
| `units`, `cities` | `[]` | `deserializeGame` |
| `exploredByHuman`, `gracze` | `[]` | `deserializeGame` |
| `humanOwnerIds` | `[0]` | `deserializeGame` |
| `activeHumanOwnerId` | `0` | `deserializeGame` |
| `tradeRoutes` | Web: `undefined` (`save.ts:723`: `Array.isArray(obj2.tradeRoutes) ? … : undefined`). Propozycja importera (NIE zachowanie web): `[]` | `save.ts:723`; decyzja importera |
| `mapSnapshot` | `undefined` → web regeneruje z `seed` — `D-MIG-9` | `load-map-source.ts` |
| `meta` | `undefined` → brak pól `meta` (każde pole ma własny default, §4) | `restoreGameFromSave` |
| `explored`, `gracz` (v2) | ignorowane (v3 ich nie zapisuje) | `@deprecated` w `SaveGame` |

---

## 4. Tabela mapowania: 22 klucze top-level + 94 klucze `meta`

**Legenda statusu:**
- **TAK** — miejsce jednoznaczne z P2.2 / P2.3 (odwołanie w kolumnie „Uwagi”).
- **TAK+D-MIG-n** — miejsce z P2.2 / P2.3, ale wymaga decyzji lub weryfikacji n.
- **D-MIG-n** — miejsce nierozstrzygnięte w P2.2 / P2.3 (nowa decyzja).
- **ODRZUC** — klasa U (UI/metadane), nie trafia do `GameState` (P2.2 §4 i §8 pkt 10b; P2.3 §9).

Linie web: dla kluczy top-level `main.ts:30478-30682` (builder `buildSaveGameSnapshot`); dla `meta` numer z P2.7 §3 (zakres `main.ts:30495-30671`).

### 4A. Klucze top-level (22)

| # | Klucz web | Linia web | Cel w `GameState` / envelope | Status | Uwagi |
|---|---|---|---|---|---|
| 1 | `wersja` | 30478 | `PersistenceEnvelope.version` (nie `GameState`) | TAK+D-MIG-1, D-MIG-2 | P2.2 §2 uwaga (M15). Bramka: §3. Wartość 3 nie jest numerem Rust (Rust = 2). |
| 2 | `tura` | 30479 | `turn: TurnState` (M6) | TAK | P2.2 §3 M6; `TurnDto` (`state.rs`). |
| 3 | `seed` | 30480 | `settings` (D13d) | TAK | P2.2 §8 D13(d). Stan RNG z niego — `D-MIG-3` (nie ten sam klucz). |
| 4 | `units` | 30481 | `units: Vec<UnitState>` (M4) | TAK+D-MIG-11, D-MIG-19 | P2.3 §4 (25 pól) i D-ID-10/11. Zapisywane są CAŁE obiekty `RuntimeUnit` (`units.slice()`). Pola `oblegaCityId` (oblężenie, `D-MIG-11`) i `inGarnizon` (`D-MIG-19`) wymagają decyzji. |
| 5 | `cities` | 30482 | `cities: Vec<CityState>` (M3) | TAK | P2.3 §5 (61 pól), D-ID-11 (placeholdery) i D-ID-9. Każde miasto: `id` legacy → `CityId` (D-ID-1). |
| 6 | `exploredByHuman` | 30483 | `map` — mgła per właściciel | TAK | P2.2 §8 pkt 10(a). Format `Array<[ownerId, string[] "q,r"]>` → `Map<PlayerId, Set<HexCoord>>`; klucze ownerId wg D-ID-8 (0 = człowiek). |
| 7 | `gracze` | 30484 | `owners` + `economy` + `wonders_tech` + `owners[].policy` | D-MIG-4 | `GraczSaveV3` (`save.ts:322`): 11 pól. `OwnerState` (P2.2 §2) ma tylko `era`. Brak pól: skarbiec, nauka, zbadane, badana, researchQueue, tempoGry, 4 pola tempa. |
| 8 | `humanOwnerIds` | 30485 | `owners` (zbiór fotelowy) | TAK+D-MIG-20 | P2.2 §8 D2. Default `[0]` (§3). |
| 9 | `activeHumanOwnerId` | 30486 | `owners` (wskaźnik aktywnego fotela) | TAK+D-MIG-20 | P2.2 §8 D2. Default `0` (§3). |
| 10 | `autoMarch` | 30487 | `units` (marsz legacy) | D-MIG-5 | Komentarz `save.ts`: „legacy — pierwszy / ostatni planowany”, pełna mapa w `plannedMarches`. Import czy wyprowadzenie — decyzja. |
| 11 | `plannedMarches` | 30488 | `units` (rozkazy per jednostka, D13b) | TAK | P2.2 §8 D13(b). Klucz `unitId` (string) i `attackUnitId` → D-ID-1. |
| 12 | `rallyPoints` | 30489 | `owners[].rally_point` | D-MIG-6 | KOREKTA D13(b): `rallyPoints = new Map<number, RallyPoint>()` (`main.ts:25113`), klucz = właściciel, nie jednostka. Komentarz zapisu: „one explicit rally point per empire”. |
| 13 | `cityProd` | 30490 | `cities` (produkcja miasta, D13a) | TAK+D-MIG-7 | P2.2 §8 D13(a). Wartość `any` (`CityProduction`) — kształt nieskatalogowany. |
| 14 | `cityBuilt` | 30491 | `cities` (lista budynków) | TAK | P2.2 §8 D13(a). Wartość `string[]` (id budynków). Brak modelu budynków w `CityDto` → placeholder (D-ID-11, P2.3). |
| 15 | `aiResearchDone` | 30492 | `wonders_tech` (S) | TAK | P2.2 §2 (`aiResearchDone` w `WondersTechState`); P2.2 §4 wiersz „Pozostałe widoki”. Format `Array<[ownerId, string[]]>`. |
| 16 | `diploRelations` | 30493 | `diplomacy` | TAK+D-MIG-7, D-MIG-8 | P2.2 §3 M9. Wartość `Record<string, any>` (klucz `"a_b"`, `Relation` serialized) — kształt nieskatalogowany; klucze to ownerId → D-ID-8. |
| 17 | `tradeRoutes` | 30494 | `trade_routes: Vec<TradeRoute>` (M11) | TAK | P2.2 §8 pkt 10(d); `TradeRoute` (`trade.rs:392`, serde). Brak = `[]`. |
| 18 | `meta` | 30495-30671 | ROZBITY na 94 pola (§4B) | — | Brak kontenera `meta` w Rust (P2.2 D6: typowane pola). Patrz §4B. |
| 19 | `mapQuality` | 30672 | — | ODRZUC | P2.2 §4 l.104 (U, poza kontraktem). Stan renderu. |
| 20 | `renderQuality` | 30673 | — | ODRZUC | jw. (`_currentRenderOptions`, `main.ts:30` zbiór). |
| 21 | `mapDetailQuality` | 30674 | — | ODRZUC | jw. |
| 22 | `mapSnapshot` | 30682 | `map: MapState` (M1) | TAK+D-MIG-9, D-MIG-16 | P2.2 §3 M1. Format kolumnowy `SerializedMapData` `fmt: 2` (`map/mapSnapshot.ts:111`) ≠ `MapDto` (tiles). Konwersja + brak snapshotu → `D-MIG-9`. Farmy → `D-MIG-16`. |

### 4B. Klucze `meta` (94)

Kolumna „linia web” = P2.7 §3 (`main.ts`). Pola typu `Array.from(x.entries())` są ze swojej natury parami `[klucz, wartość]`.

| # | Klucz `meta` | Linia | Cel w `GameState` | Status | Uwagi |
|---|---|---|---|---|---|
| 1 | `label` | 30496 | envelope (metadane zapisu) | ODRZUC | P2.2 §4 („poza GameState, envelope UI”). Nie trafia do `GameState`. |
| 2 | `savedAt` | 30497 | envelope | ODRZUC | P2.2 §4. |
| 3 | `saveOrigin` | 30498 | envelope | ODRZUC | P2.2 §4. |
| 4 | `newGameParams` | 30499 | `settings` | TAK+D-MIG-7, D-MIG-9 | P2.2 §4 („Konfiguracja startu”). Zawiera `seed` duplikujący top-level `seed` — reguła spójności w `D-MIG-9`. Kształt zawartości nieskatalogowany. |
| 5 | `loadMapSize` | 30502 | envelope | ODRZUC | P2.2 §4 („Metadane zapisu”). |
| 6 | `loadTypSwiata` | 30503 | envelope | ODRZUC | jw. |
| 7 | `loadCivId` | 30504 | envelope | ODRZUC | jw. |
| 8 | `loadLandFraction` | 30505 | envelope | ODRZUC | jw. |
| 9 | `empireFoodStates` | 30506 | `economy` | TAK | P2.2 §4 („Ekonomia imperium”). |
| 10 | `goldDeficitStates` | 30507 | `economy` | TAK | P2.2 §4. |
| 11 | `ownerDefaultPodzialHandlu` | 30508 | `owners[].policy` | TAK | P2.2 §8 D14 (przyjęte). |
| 12 | `ownerDefaultPodzialPracy` | 30511 | `owners[].policy` | TAK | jw. |
| 13 | `ownerDefaultOkolicaFocus` | 30514 | `owners[].policy` | TAK | jw. |
| 14 | `ownerDefaultBudowaProfil` | 30515 | `owners[].policy` | TAK | jw. |
| 15 | `ownerDefaultPoziomRacji` | 30518 | `owners[].policy` | TAK | jw. |
| 16 | `ulepszeniaEmpireByOwner` | 30519 | `economy` | TAK | P2.2 §4 („Ekonomia imperium”). |
| 17 | `mennicaZlotoGrace` | 30520 | `economy` | TAK+D-MIG-7 | P2.2 §4. Kształt `serializeMennicaZlotoGrace` nieskatalogowany. |
| 18 | `playerPracaPool` | 30521 | `economy` | TAK | P2.2 §4 („Ekonomia imperium”). |
| 19 | `budowaListaBiblioteka` | 30522 | — (do decyzji) | D-MIG-10 | P2.2 §4 oznacza „S (U?)”, a P2.2 §8 pkt 10(b) klasyfikuje jako U i odrzuca. Sprzeczność — przed akceptacją odrzucenia zweryfikować, czy to stan gry. |
| 20 | `siegeTurnByCity` | 30527 | `combat` | D-MIG-11 | P2.2 §4 → `combat`. Tura startu oblężenia NIE jest wyprowadzalna z `oblega` (P2.3 §9 pkt 9 tego nie uwzględnia). |
| 21 | `siegeBesiegerByCity` | 30528 | `combat` (lub wyprowadzane z `oblega`) | D-MIG-11 | P2.2 §4 → `combat`. Wyprowadzalne tylko częściowo. |
| 22 | `siegeAiStateByKey` | 30529 | `combat` lub `ai` | D-MIG-11 | P2.2 §4 → `combat`; stan AI, miejsce wieloznaczne. |
| 23 | `pendingDiplomacyInbox` | 30530 | `diplomacy` | TAK | P2.2 §4 („Dyplomacja (stan)”). |
| 24 | `interHumanDiplomacyInbox` | 30532 | `diplomacy` | TAK | P2.2 §4. |
| 25 | `aiOneShotGiftLastTurn` | 30533 | `ai` | TAK | P2.2 §4 („Limity czasowe AI”). |
| 26 | `aiTradeAgreementLastProposalTurn` | 30534 | `ai` | TAK | jw. |
| 27 | `aiAiTradeAgreementLastTurn` | 30535 | `ai` | TAK | jw. |
| 28 | `aiResourceTradeLastProposalTurn` | 30536 | `ai` | TAK | jw. |
| 29 | `aiAudienceLastRequestTurn` | 30537 | `ai` | TAK | jw. |
| 30 | `diplomaticContactEstablished` | 30540 | `diplomacy` | TAK | P2.2 §4 („kontakt/odkrycie” → S). Klucz to `humanOwnerId` → D-ID-8. |
| 31 | `diplomaticallyDiscoveredOwners` | 30544 | `diplomacy` | TAK | jw. |
| 32 | `diplomaticDiscoveryPopupShown` | 30548 | — | ODRZUC | P2.2 §8 pkt 10(b) (flaga popupu). |
| 33 | `veteranEnemyEducationShown` | 30552 | — | ODRZUC | P2.2 §8 pkt 10(b). |
| 34 | `diplomacyDeals` | 30553 | `diplomacy` | TAK | P2.2 §4; `ActiveDeal` (`diplomacy.rs:1441`). |
| 35 | `negotiationTable` | 30556 | `diplomacy` | TAK | P2.2 §4. Propozycja/kontroferta musi przetrwać (komentarz zapisu). |
| 36 | `negotiationSeq` | 30557 | `diplomacy` (licznik) | TAK | P2.2 §4. Licznik musi pozostać monotoniczny (P2.3 §2.3, stabilność ID). |
| 37 | `rejectedOfferCooldowns` | 30558 | `diplomacy` | TAK | P2.2 §4. |
| 38 | `diplomacyPairMeta` | 30559 | `diplomacy` | TAK | P2.2 §4; `DiploPairMeta` (`diplomacy.rs:1190`, serde). |
| 39 | `diplomacyFactorLog` | 30560 | `diplomacy` | TAK | P2.2 §4. |
| 40 | `wiarygodnoscZdarzeniaByOwner` | 30565 | `diplomacy` | TAK | P2.2 §4 („Wiarygodność”). Rust BRAK → placeholder (P2.2 D8/P2.3 D-ID-11). |
| 41 | `wiarygodnoscStrumienByOwner` | 30566 | `diplomacy` | TAK | jw. |
| 42 | `wiarygodnoscOstatniaWojnaTuraByOwner` | 30570 | `diplomacy` | TAK | jw. |
| 43 | `wiarygodnoscP4MilestonesByOwner` | 30571 | `diplomacy` | TAK | jw. |
| 44 | `wiarygodnoscN7ActivePairs` | 30572 | `diplomacy` | TAK | jw. |
| 45 | `aiOwnerCivMap` | 30573 | `owners[].civ` | TAK+D-MIG-12 | P2.2 §4 („Właściciele / era”). Wartości cywilizacji: duplikat `babilon`/`babilonia` (P2.2 D4) → `D-MIG-12`. |
| 46 | `ownerDisplayName` | 30574 | — | ODRZUC (D-MIG-13 do potwierdzenia) | P2.2 §8 pkt 10(b). Wartości nadawane z nazw miast i planu (`main.ts:2230`, `8691`, `9262`); import zmienia tylko nazwy wyświetlane. |
| 47 | `zlozeGrants` | 30575 | `diplomacy` | TAK | P2.2 §4 („Dyplomacja (stan)”). |
| 48 | `surowiecBooleanGrants` | 30576 | `diplomacy` | TAK | P2.2 §4. |
| 49 | `battlePowerPtsByOwner` | 30577 | `ai` | TAK | P2.2 §8 pkt 9(b). |
| 50 | `capitalCityIdByOwner` | 30578 | `owners[].capital` | TAK | P2.2 §8 pkt 9(d). Wartość = id miasta → D-ID-1. |
| 51 | `aiSkarbiecByOwner` | 30581 | `ai` | TAK | P2.2 §8 D13(c). |
| 52 | `aiTargetMemoryByOwner` | 30582 | `ai` | TAK | P2.2 §4 („Limity czasowe AI”). |
| 53 | `aiPracaPoolByOwner` | 30583 | `ai` | TAK | P2.2 §8 D13(c). |
| 54 | `aiNaukaPoolByOwner` | 30584 | `ai` | TAK | P2.2 §8 D13(c). |
| 55 | `aiBadanaByOwner` | 30585 | `ai` | TAK | P2.2 §8 D13(c). |
| 56 | `aiSurplusRedirectedOwners` | 30594 | `ai` | TAK | P2.2 §8 D13(c). Tablica ownerId. |
| 57 | `aiSliderStateByOwner` | 30601 | `ai` | TAK | P2.2 §8 D13(c). |
| 58 | `zdobyczePowerByOwner` | 30602 | `ai` | TAK | P2.2 §8 D13(c); §4 (wieloznaczne → D13c). |
| 59 | `bronzeForceWarPendingOwners` | 30606 | `ai.forced_war` | TAK | P2.2 §8 pkt 9(f) i D1 (rodzina 15 kluczy fal). |
| 60 | `bronzeEraEnterTurnByOwner` | 30611 | `ai.forced_war` | TAK | jw. |
| 61 | `bronzeForceWarCycleOwners` | 30612 | `ai.forced_war` | TAK | jw. |
| 62 | `bronzeForceWarRestUntilByOwner` | 30613 | `ai.forced_war` | TAK | jw. |
| 63 | `bronzeForceWarActiveByPairKey` | 30614 | `ai.forced_war` | TAK | jw. |
| 64 | `regularWarCapturedByPairKey` | 30618 | `ai` (do potwierdzenia) | D-MIG-14 | P2.2 §4 wkłada do grupy fal (16 kluczy), §8 pkt 9(f) liczy 15 bez niego. Builder (`main.ts:30618` komentarz): „NIE przechodzi przez serializeForcedWarState” — to licznik zwykłych wojen AI↔AI. |
| 65 | `stoneForceWarPendingOwners` | 30619 | `ai.forced_war` | TAK | P2.2 §8 pkt 9(f). |
| 66 | `stoneForceWarCycleOwners` | 30620 | `ai.forced_war` | TAK | jw. |
| 67 | `stoneForceWarRestUntilByOwner` | 30621 | `ai.forced_war` | TAK | jw. |
| 68 | `stoneForceWarActiveByPairKey` | 30622 | `ai.forced_war` | TAK | jw. |
| 69 | `ironForceWarPendingOwners` | 30623 | `ai.forced_war` | TAK | jw. |
| 70 | `ironEraEnterTurnByOwner` | 30628 | `ai.forced_war` | TAK | jw. |
| 71 | `ironForceWarCycleOwners` | 30629 | `ai.forced_war` | TAK | jw. |
| 72 | `ironForceWarRestUntilByOwner` | 30630 | `ai.forced_war` | TAK | jw. |
| 73 | `ironForceWarActiveByPairKey` | 30631 | `ai.forced_war` | TAK | jw. |
| 74 | `forcedWarWavesByPairKey` | 30634 | `ai.forced_war` (D1) | TAK+D-ID-1 | P2.7 §4; `ForcedWarWaveState` (`forced-war-waves.ts:27-31`). `unitIds`, `targetCityId` → mapowanie legacy ID. Brakujące pola wpisu → odrzucenie (INV-5, P2.2 §6). |
| 75 | `lootedVillageHexKeys` | 30635 | `barbarians` | TAK | P2.2 §4 („Barbarzyńcy”). Klucze `"q,r"` → `HexCoord`. |
| 76 | `eliminatedOwners` | 30636 | `owners[].eliminated` | TAK | P2.2 §4 („Zniszczenie / zdarzenia”). |
| 77 | `ownerEraByOwner` | 30637 | `owners[].era` | TAK | P2.2 §2 (`OwnerState.era`), §4. |
| 78 | `ownerStartEraByOwner` | 30638 | brak pola w `OwnerState` | D-MIG-15 | P2.2 §4 wkłada do `owners`, ale szkielet `OwnerState` (P2.2 §2) ma tylko `era`. Pole do dodania albo decyzja, że wystarczy `era`. |
| 79 | `placedImprovements` | 30639 | `map` (per heks) | D-MIG-16 | KOREKTA pkt 9(a): `placedImprovements` to `Map<hexKey, layers>` (`main.ts:13257` `placedImprovements.set(hk, …)`), nie per miasto. Farmy w tym rejestrze → migracja `D-MIG-16`. |
| 80 | `fortNodes` | 30645 | `cities` | TAK | P2.2 §8 pkt 9(c). Rejestr fortów z `ownerId`. |
| 81 | `hexClearingStates` | 30646 | `map` (do potwierdzenia) | D-MIG-16 | P2.2 §8 pkt 9(c) → `cities`. Nazwa i `Array.from(x.entries())` wskazują klucz heksowy (jak `placedImprovements`) — do potwierdzenia w kodzie przed przypisaniem. |
| 82 | `pendingImprovementsTurn` | 30647 | `economy` | TAK+D-MIG-7 | P2.2 §4 („Ekonomia imperium”). Wartość `toSave()` — kształt nieskatalogowany. |
| 83 | `completedWorldWonders` | 30648 | `wonders_tech` | TAK | P2.2 §4 („Cuda”), §2. |
| 84 | `placedWorldWonders` | 30649 | `wonders_tech` | TAK | jw. |
| 85 | `wonderBuildSites` | 30650 | `wonders_tech` | TAK | jw. |
| 86 | `simplifiedDiplomacyOwners` | 30654 | `diplomacy` | TAK | P2.2 §4 („Dyplomacja (stan)”). |
| 87 | `foreignTypeOwners` | 30655 | `owners` | TAK | P2.2 §4 („Właściciele / era”). |
| 88 | `typCityCopyOwners` | 30656 | `owners` | TAK | jw. |
| 89 | `clusterCapitalOwnerIds` | 30657 | `map` | TAK | P2.2 §8 pkt 9(c): geografia klastra, nie miasto. |
| 90 | `clusterPlacement` | 30658 | `map` (propozycja) | D-MIG-17 | Zapisany, NIE regenerowany przy wczytaniu (`main.ts:38602`: `saved.meta?.clusterPlacement`). Typ `ClusterPlacement` nieskatalogowany; lokalizacja nierozstrzygnięta w P2.2 §4 („do potwierdzenia”). |
| 91 | `barbCamps` | 30661 | `barbarians` | TAK | P2.2 §4 („Barbarzyńcy”); `BarbCamp` (`barbarians.rs:153`). |
| 92 | `clearedBarbCampHexes` | 30665 | `barbarians` | TAK | jw. |
| 93 | `cityRelig` | 30669 | `cities` | TAK | P2.2 §8 pkt 9(c). Klucz `cityN` (per miasto). |
| 94 | `autoManageCities` | 30670 | `cities[].auto_manage` | D-MIG-18 | KOREKTA D14: `autoManageCities = new Set<string>()` (`main.ts:10275`) to id MIAST, nie właścicieli. Flaga per miasto, nie `owners[].policy`. |

### 4C. Strategia ID per wiersz (116 wierszy)

Kody: `—` = brak referencji ID; `OWN` = `ownerId` (klucz lub wartość) → `OwnerRef` wg §1.5; `CITY` = `cityId` → tabela legacy→`CityId` (D-ID-1, D-MIG-21); `UNIT` = `unitId` → tabela legacy→`UnitId`; `PAIR` = para właścicieli (`"a_b"` lub `…ByPairKey`) → para `OwnerRef`; `HEX` = `"q,r"` → `HexCoord` bez tabeli (§1.5). `?` = kształt kluczy nieskatalogowany — rozstrzygany w kroku D-MIG-7 przed implementacją importera. `+` = kilka typów w jednym wierszu.

| Kod | Wiersze top-level (22) | Wiersze `meta` (94) |
|---|---|---|
| — | 1, 2, 3, 18, 19, 20, 21 | 1–8, 19, 32, 33, 36, 46 (ODRZUC), 83 |
| OWN | 7, 8, 9, 12, 15 | 9–16, 18, 23, 24, 30, 31, 34, 35, 37, 39–43, 45, 49, 51–62, 65–67, 69–72, 76–78, 86–89 |
| OWN? (klucz do potwierdzenia) | — | 17, 25–29, 47, 48 |
| OWN+HEX | 6 | — |
| CITY+OWN | 5 | 21, 50, 80 |
| UNIT+OWN | 4 | — |
| UNIT | 10, 11 | — |
| CITY? (do potwierdzenia) | 13, 14, 17 | 22, 84, 85 |
| PAIR | 16 | 38, 44, 63, 64, 68, 73 |
| PAIR+UNIT+CITY | — | 74 |
| CITY | — | 20, 93, 94 |
| HEX | 22 | 75, 79, 81, 91, 92 |
| HEX? | — | 90 |
| ? | — | 82 |

### 4D. Odwołania do P2.2 — konkretne linie

Odwołania „P2.2 §4 (grupa)” w §4A/§4B rozwiązują się do linii pliku `dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md`:

| Miejsce w P2.2 | Linia |
|---|---|
| §2 szkielet `owners` (M2) / `OwnerState {` | l.29, l.46 (M2: l.59) |
| §3 mapowanie domen, top-level poza `meta` | l.104 |
| §4 Konfiguracja startu | l.83 |
| §4 Gospodarka właściciela | l.84 |
| §4 Ekonomia imperium | l.85 |
| §4 Ekonomia AI | l.86 |
| §4 Miasta i ulepszenia | l.87 |
| §4 Cuda | l.88 |
| §4 Właściciele / era | l.89 |
| §4 Nazwy wyświetlane | l.90 |
| §4 Dyplomacja (stan) | l.91 |
| §4 Dyplomacja (kontakt/odkrycie) | l.92 |
| §4 Wiarygodność | l.93 |
| §4 Limity czasowe AI | l.94 |
| §4 Wojna wymuszona (fale) | l.95 |
| §4 Oblężenia | l.96 |
| §4 Barbarzyńcy | l.97 |
| §4 Weterani / edukacja | l.98 |
| §4 Zniszczenie / zdarzenia | l.99 |
| §4 Pozostałe widoki | l.100 |
| §5 D13 (pola wieloznaczne) / D14 (polityka) | l.120 / l.121 |
| §8 D7 (odpowiedź właściciela, kierunek importu) | l.160 |
| §8 D13 / D14 (rozstrzygnięcia) | l.196 / l.200 |

---

## 5. Zestawienie statusów (116 wierszy: 22 + 94)

Liczenie wykonane z tabel §4A i §4B (status w kolumnie „Status”). Wartości w nawiasach: wiersze z dopiskiem `+D-MIG`/`+D-ID-1` (miejsce pewne, wymaga weryfikacji).

Policzone awk-em z tabel §4A/§4B (116 wierszy):

| Status | Top-level (22) | `meta` (94) | Razem |
|---|---|---|---|
| TAK | 8 | 69 | 77 |
| TAK+D-MIG | 7 | 5 | 12 |
| D-MIG | 3 | 10 | 13 |
| ODRZUC | 3 | 10 | 13 |
| wskaźnik na §4B (`meta`) | 1 | — | 1 |

Wiersze `D-MIG` w `meta`: `budowaListaBiblioteka`, `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey`, `regularWarCapturedByPairKey`, `ownerStartEraByOwner`, `placedImprovements`, `hexClearingStates`, `clusterPlacement`, `autoManageCities`. Wiersze `ODRZUC` w `meta`: `label`, `savedAt`, `saveOrigin`, `loadMapSize`, `loadTypSwiata`, `loadCivId`, `loadLandFraction`, `diplomaticDiscoveryPopupShown`, `veteranEnemyEducationShown`, `ownerDisplayName`. Wiersze `TAK+D-MIG` w `meta`: `newGameParams`, `aiOwnerCivMap`, `pendingImprovementsTurn`, `mennicaZlotoGrace`, `forcedWarWavesByPairKey`.

---

## 6. Decyzje wymagające rozstrzygnięcia (`D-MIG-n`)

Oznaczenie: **[WŁ]** = wymaga decyzji właściciela (wpływ na gracza lub na zapisy); **[INŻ]** = rozstrzygalne inżyniersko, z rekomendacją.

- **D-MIG-1 [WŁ] — zakres wersji wejściowych.** Web odrzuca `wersja < 3` i `> 3`. Rekomendacja: Rust też przyjmuje wyłącznie `3`; zapisy v1/v2 (sprzed hot-seat) są nieczytelne także w web. Decyzja: czy gracze mają dostać migrację starszych zapisów (koszt: nowe mapowanie, brak źródła testowego w repo).
- **D-MIG-2 [INŻ] — rozpoznanie formatu.** Rekomendacja: `wersja` (number) → web; `version` → natywny. Brak obu → błąd.
- **D-MIG-3 [WŁ] — stan losowości i zdarzeń po imporcie.** Zapis web nie zawiera RNG ani kolejki zdarzeń. `gra/src` używa `Math.random` w 82 miejscach, więc web sam nie odtwarza kontynuacji z zapisu deterministycznie. Propozycja: `rng` z `seed` (nowy stan), `event_queue` pusta; kontynuacja NIE jest bit-w-bit zgodna z web. Alternatywa: odrzucić import. Decyzja dotyczy „ciągłości graczy” z D7.
- **D-MIG-4 [INŻ + korekta P2.2] — pola `gracze[]` poza `OwnerState`.** Propozycja: `skarbiec` → `economy` (per właściciel, jak `turn_economy.rs`); `nauka`, `zbadane`, `badana`, `researchQueue` → `wonders_tech` (per właściciel); `era` → `owners[].era`; `tempoGry` i 4 pola tempa → `owners[].policy`. Wymaga dopisania do szkieletu P2.2 §2.
- **D-MIG-5 [INŻ] — `autoMarch`.** Rekomendacja: jeśli `plannedMarches` obecne — `autoMarch` ignorowany (zgodnie z komentarzem web: legacy); jeśli brak `plannedMarches` — `autoMarch` jako jeden wpis. Potwierdzić, że nie ma przypadku `autoMarch ≠ pierwszy wpis plannedMarches`.
- **D-MIG-6 [INŻ, KOREKTA D13b] — `rallyPoints`.** Klucz = właściciel (`main.ts:25113`). Propozycja: `owners[].rally_point`, nie `units`.
- **D-MIG-7 [INŻ] — kształty serializerów nieskatalogowane.** Wartości `any` lub z serializerów: `cityProd`, `diploRelations` (wartości), `mennicaZlotoGrace`, `pendingImprovementsTurn` (`toSave()`), `clusterPlacement` (`ClusterPlacement`), `newGameParams` (zawartość). Wymagany osobny krok katalogowy (P2.7 nie katalogował zawartości) przed implementacją importera.
- **D-MIG-8 [INŻ] — wartości `diploRelations`.** Klucz `"a_b"` (ownerId) i zawartość `Relation` (`diplomacy.rs:104`) — mapowanie wartości wymaga kroku D-MIG-7 i D-ID-8.
- **D-MIG-9 [WŁ] — `mapSnapshot` i seed.**
  - (a) Konwersja kolumnowa `SerializedMapData` (`fmt: 2`, `dict`, `n`, kolumny `q/r/terenIdx/nakladkaIdx/ulepszenieIdx/wlascicielIdx/wioskaIstnieje/wioskaLudnosc/rzekaObecna`, rzadkie `rzekaKrawedzie/zloze/zlozeMinEra/ulepszenia/improvementKey/widocznosc`) → `MapState` (`MapDto` ma `tiles`). `wlascicielIdx` indeksuje `dict` (stringi), nie ownerId — wymaga parsowania.
  - (b) `mapSnapshot` brak (zapisy sprzed zmiany) → web regeneruje z `seed` generatorem. Rust nie ma potwierdzonej zgodności generatora z web (P2.4). Opcje: odrzucić; wymagać snapshotu; użyć generatora Rust (nie gwarantuje tej samej mapy). Decyzja właściciela.
  - (c) `seed` opcjonalny w typie; w buildere zawsze obecny. Brak `seed` przy braku snapshotu = błąd.
  - (d) Spójność: `seed` (top) = `newGameParams.seed` = `mapSnapshot.seed`; niezgodność → błąd importu.
  - (e) `fmt != 2` → odrzucone (jak `isValidMapSnapshot`).
- **D-MIG-10 [WŁ, sprzeczność] — `budowaListaBiblioteka`.** P2.2 §4 pisze „S (U? do potwierdzenia)”, a P2.2 §8 pkt 10(b) odrzuca jako U. Przed przyjęciem odrzucenia trzeba potwierdzić, czy to nie stan gry (kolejka budowy). Klasa U nie została tu zweryfikowana w kodzie.
- **D-MIG-11 [WŁ, korekta P2.3 §9 pkt 9] — oblężenie.** `siegeTurnByCity` (tura startu) jest stanem, którego nie da się wyprowadzić z `oblega` na jednostkach, więc P2.3 §9 („stan po stronie miasta jest WYPROWADZANY”) jest tu niepełny. Propozycja: `combat.siege_started_turn: Map<CityId, Turn>` jako pole przechowywane. `siegeBesiegerByCity` i `siegeAiStateByKey`: miejsce `combat` vs `ai` do potwierdzenia. Wymaga dopisania pola.
- **D-MIG-12 [INŻ, zależność od D4] — wartości cywilizacji.** `aiOwnerCivMap` (i `civ` w `gracze`, jeśli dotyczy) może zawierać `babilon` lub `babilonia`. Po ujednoliceniu enum (P2.2 D4) import musi mieć politykę dla wartości nieznanej: błąd (propozycja) albo fallback `generic`.
- **D-MIG-13 [INŻ] — `ownerDisplayName`.** Klasa U (odrzucone) jest przyjęta. Wartości są nadawane z nazw miast i planu (`main.ts:2230`, `8691`, `9262`), więc utrata nazw po imporcie jest kosmetyczna. Propozycja: odrzucić; nazwy odtwarzane przy starcie. Nie zweryfikowano, czy któreś nazwy wpisuje gracz.
- **D-MIG-14 [INŻ] — `regularWarCapturedByPairKey`.** Poza 15 kluczami fal (P2.2 §8 pkt 9(f)). Propozycja: `ai` (licznik zdobytych miast AI↔AI, nie fala).
- **D-MIG-15 [INŻ] — `ownerStartEraByOwner`.** Brak pola w `OwnerState` (P2.2 §2). Propozycja: dodać `start_era`.
- **D-MIG-16 [INŻ, korekta P2.2 §8 pkt 9(a)/9(c)] — migracja farm i nośniki heksowe.**
  - `migrateLegacyFarmsOnForestInSave` (`save.ts:562`) działa na DWÓCH nośnikach: `mapSnapshot` (`ulepszenieIdx`, `ulepszenia`, `improvementKey`) i `meta.placedImprovements`. Import MUSI zastosować tę samą migrację, bo web stosuje ją na każdej ścieżce wczytania. Wynik: farma na lesie znika, las zostaje, praca nie wraca (ECHO 2026-08-27).
  - Korekta: `placedImprovements` i prawdopodobnie `hexClearingStates` są kluczowane heksem → `map`, nie `cities` (P2.2 §8 pkt 9(a)/9(c)).
  - Redundancja: ulepszenia są w `mapSnapshot` i w `placedImprovements`. Import ma je uzgodnić (propozycja: `placedImprovements` jest źródłem prawdy po migracji, dane z `mapSnapshot` są odtwarzane z niego; do potwierdzenia w kodzie `restorePlacedImprovementsFromSave`).
- **D-MIG-17 [INŻ] — `clusterPlacement`.** Zapisany (nie regenerowany). Propozycja: `map`. Typ do katalogu (D-MIG-7).
- **D-MIG-18 [INŻ, korekta D14] — `autoManageCities`.** Per miasto (`Set<string>` id miast). Propozycja: flaga `auto_manage` w `CityState`, nie `owners[].policy`.
- **D-MIG-19 [WŁ, korekta P2.3 §9 D-ID-5] — `inGarnizon` i `oblegaCityId` w jednostkach.** P2.3 §9 twierdzi, że `inGarnizon` „nie jest trwałym stanem do importu”. Builder jednak zapisuje całe obiekty jednostek (`units.slice()`, `main.ts:30481`), więc pole JEST w zapisie. Decyzja: importować jako dane (zgodnie z 1:1) albo wyprowadzać z pozycji i potwierdzić, że web zawsze daje tę samą wartość. Obecna odpowiedź P2.3 nie wystarcza.
- **D-MIG-20 [INŻ] — tolerancja nieznanych pól.** Web toleruje dodatkowe klucze (w `meta` bez whitelisty, `save.ts:724`; komentarz o polach opcjonalnych bez podbicia wersji). Rust: nieznane klucze top-level i `meta` są ignorowane (z logowaniem), brakujące — defaulty z §3. `explored` i `gracz` (v2) są ignorowane.
- **D-MIG-21 [INŻ] — ID legacy.** Tabela `legacy_id → CityId/UnitId/PlayerId` jest budowana i używana w czasie importu (P2.3 D-ID-1, D-ID-3). Nie jest zapisywana w zapisie natywnym (import jednokierunkowy, D-MIG-22). Zakres „przez całą sesję” z dispatchu rozumiem jako cały czas trwania importu, zgodnie z §1.5 (cykl życia). Zawężenie względem dispatchu wynika z P2.3 §9 D-ID-1 (stringowe ID poza stanem gry), nie jest pominięciem. Dwa problemy do polityki:
  - duplikat `legacy_id` (możliwy teoretycznie dla `prod_…_Math.random`) → błąd importu;
  - referencja do nieistniejącego ID (np. `plannedMarches` wskazuje zniszczoną jednostkę, `forcedWarWaves` wskazuje usunięte miasto) → wpis odrzucany z ostrzeżeniem (propozycja) albo błąd. Decyzja inżynierska z rekomendacją: odrzucić wpis z logiem.
- **D-MIG-22 [ROZSTRZYGNIĘTE 2026-10-21, P2.2 §8 D7 l.160] — kierunek importu.** Odpowiedź właściciela: „import jest jednokierunkowy (web → Rust), nie wymaga żeby Rust zapisywał w formacie czytelnym przez web”. Zamknięte. Pozostaje konsekwencja do odnotowania (nie pytanie): zapisy z Rust nie wczytują się w web; współdzielenie zapisów między graczami działa tylko web → Rust.

---

## 7. Weryfikacja faktów (wykonana w tej rundzie)

- `save.ts` (`edb8fb56`): `SAVE_VERSION = 3` (l.116); `IncompatibleSaveFormatError` dla `ver < 3`; odrzucenie `ver > SAVE_VERSION`; `deserializeGame` z defaultami (`humanOwnerIds: [0]`, `activeHumanOwnerId: 0`, `tura: 1`); `readVersion` (l.479); `migrateLegacyFarmsOnForestInSave` (l.562); typ `SaveGame` (l.336); `GraczSaveV3` (l.322, 11 pól); `serializeGame` (l.520).
- ECHO 2026-08-27 (zarzut 7): źródło w kodzie — `save.ts:530-531` (komentarz do `migrateLegacyFarmsOnForestInSave`, funkcja w `save.ts:562`): „ECHO właściciela 2026-08-27, wariant C: farma znika, las zostaje, praca NIE wraca.” Uwaga: w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` ten sam ECHO datowany 2026-08-27 występuje jako wariant A dla obozu (P-ULEPSZENIA-WYRAB-ZOSTAWIAL-OBOZ-Q1); wariant C odnosi się do farmy, czyli do `save.ts`.
- `main.ts` (`edb8fb56`), builder `buildSaveGameSnapshot`: dokładnie 22 klucze top-level (lista z literału `return {…}` i `mapQuality/renderQuality/mapDetailQuality/mapSnapshot` l.30672-30682) i 94 klucze `meta` (policzone z literału l.30495-30671, zgodne z P2.7 §3).
- Brak pola RNG w buildera: `grep -niE 'rng|random|rand'` po wycinku literału → 0 trafień. `git grep -c Math.random -- gra/src` → 82 (suma).
- `load-map-source.ts`: gałąź `isValidMapSnapshot` (l.53) i fallback do generatora dla snapshotu nieprawidłowego/brakującego; `SerializedMapData` (`map/mapSnapshot.ts:111`, `fmt: 2`).
- Kluczowanie w kodzie: `rallyPoints: Map<number, RallyPoint>` (`main.ts:25113`); `autoManageCities: Set<string>` (`main.ts:10275`); `placedImprovements.set(hk, …)` (`main.ts:13257`); `clusterPlacement` z `saved.meta` (`main.ts:38602`); `ownerDisplayName.set` (`main.ts:2230, 8691, 9262`).
- Rust (`9e33fc77`): `save_load.rs` — `CURRENT_SNAPSHOT_VERSION = 2` (l.34), `SaveSnapshot { version, state, event_queue, rng }` (l.79-80), `validate()` odrzuca `version != 2` (l.138), `migrate_v1` przywraca `rng` z `rng_state` (l.207). Zapis web v3 nie ma żadnego odpowiednika `rng`/`event_queue`.

## 8. Ograniczenia tej rundy
- Nie zweryfikowano kształtu wartości serializerów (`GraczSaveV3` zweryfikowano, reszta w D-MIG-7).
- Nie zweryfikowano, czy `hexClearingStates` i `clusterPlacement` są kluczowane heksem (D-MIG-16, D-MIG-17).
- Nie zweryfikowano, czy `ownerDisplayName` zawiera nazwy wpisywane przez gracza (D-MIG-13).
- Nie zweryfikowano zgodności `TileDto` z kolumnami `SerializedMapData` polem po polu (D-MIG-9a).
- Nie uruchomiono testów ani kompilacji. Brak kodu importera (zakaz w temacie).
