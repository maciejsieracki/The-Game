# Spec-AI — ARCHITEKTURA (dokumentacja dla dewelopera)

Dział: **Civ-AI — Inteligencja przeciwników i „żyjący świat"**
Projekt: The Game (gra 4X w stylu Cywilizacji). Stack: TypeScript + Three.js (Vite).
Wersja dokumentu: 2026-06-23. Status: v0.1.

> Ten dokument opisuje **co realnie zbudowano w dziale AI**, jak to działa, jakie ma reguły,
> jakie parametry (panel → JSON), jak wpina się do silnika i jak styka z innymi działami.
> Towarzyszy mu projektowy `Spec-AI.md` (założenia §1–§9) — tu jest **warstwa implementacyjna i kontrakty**.
> Gdzie dokument różni się od `Spec-AI.md`, źródłem prawdy jest **kod** (sekcja „Stan implementacji").

---

## 0. Zakres działu i pliki

| Plik | Rola | Czystość |
|------|------|----------|
| `gra/src/game/ai.ts` | Decyzje rywali AI w turze (ruch, ekspansja, atak, produkcja) | czysty moduł (bez DOM/THREE/main.ts) |
| `gra/src/game/victory.ts` | Warunki zwycięstwa/porażki (dominacja typu, nauka, eliminacja) | czysty moduł |
| `gra/src/game/barbarians.ts` | Neutralni barbarzyńcy: obozy, spawn, agresja, ruch | czysty moduł |
| `AI-parametry.xlsx` | **Panel parametrów dla Maciej** (sterowanie liczbami) | Excel → JSON |
| `gra/data/ai-params.json` | Parametry wczytywane przez kod (wynik eksportu z panelu) | dane |
| `gra/tools/export-ai-params.py` | Eksport panelu `AI-parametry.xlsx` → `ai-params.json` (NOWY, ten pakiet) | skrypt |
| `Spec-AI.md` | Projekt/założenia (design) | dokument |

**Zasada żelazna:** moduły AI to **czyste funkcje** — nie mutują stanu gry, **zwracają dane/komendy**,
które wykonuje silnik (Civ-SILNIK, `main.ts`). AI **nie** dotyka `main.ts`, renderu ani bitwy bezpośrednio.

---

## 1. Przegląd architektury

```
                 ┌──────────────────────────────────────────────┐
                 │                 Civ-SILNIK (main.ts)          │
                 │   pętla tury: po turze gracza wywołuje AI     │
                 └───────────────┬───────────────┬──────────────┘
        decideAITurn(...)        │               │  checkVictory(...) co turę
        zwraca AICommand[]       │               │  zwraca VictoryResult|null
                 ┌───────────────▼───┐   ┌───────▼───────────┐   ┌─────────────────┐
                 │      ai.ts        │   │    victory.ts     │   │  barbarians.ts  │
                 │ (decyzje rywali)  │   │ (warunki wygranej)│   │ (żyjący świat)  │
                 └─────────┬─────────┘   └───────────────────┘   └────────┬────────┘
                           │ czyta                                         │ czyta
                 ┌─────────▼───────────────── ai-params.json ─────────────▼────────┐
                 │  panel: AI-parametry.xlsx  →  export-ai-params.py  →  JSON       │
                 └──────────────────────────────────────────────────────────────────┘
```

Silnik dostarcza modułom AI: listę jednostek (`RuntimeUnit[]`), miast (`City[]`), mapę (`GameMap`),
dane statyczne (`GameData` — w tym `aiParams`, `units`, `buildings`, `terrainYields`) i opcje (`AITurnOpts`).
Moduł zwraca **listę komend**; silnik je interpretuje i aplikuje (ruch, walka przez `combat.ts`, produkcja przez `production.ts`).

**Graf zależności (import):**

- `ai.ts` → `types/map`, `types/hex` (`Nakladka`), `data/loader` (`GameData`), `units/setup` (`RuntimeUnit`, `hexDistance`, `computePath`, `keyOf`), `game/cities` (`City`, `canFoundCity`).
- `victory.ts` → `game/cities` (`City`). Nic więcej (celowo odcięte od `types/player`).
- `barbarians.ts` → `types/map`, `types/hex` (`TerenBazowy`), `data/loader` (`GameData`), `units/setup` (`RuntimeUnit`, `hexDistance`, `computePath`, `keyOf`).

Wszystkie trzy są **deterministyczne** (losowość tylko przez jawny `seed`).

---

## 2. `ai.ts` — decyzje rywali

### 2.1 Wejście / wyjście

```ts
export function decideAITurn(
  playerId: number,
  units: RuntimeUnit[],
  cities: AICity[],          // = City[]
  map: GameMap,
  data: GameData,
  opts: AITurnOpts = {},
): AICommand[]
```

`AITurnOpts`:
- `civType?: string` — wartość `TypCywilizacji` (z `civs.json`) → mapowana na archetyp.
- `cityBuildings?: Record<string, string[]>` — już zbudowane budynki per `cityId` (by nie kolejkować duplikatu).

**Komendy zwracane** (`AICommand` — unia dyskryminowana po `type`):

| `type` | Pola | Znaczenie |
|--------|------|-----------|
| `move` | `unitId, toQ, toR` | Przesuń jednostkę o **jeden krok** ku celowi |
| `foundCity` | `unitId` | Załóż miasto na polu osadnika |
| `attack` | `unitId, targetUnitId` | Atak na jednostkę wroga (silnik rozstrzyga przez `combat.ts`) |
| `build` | `cityId, buildingId` | Wstaw budynek/jednostkę do kolejki produkcji miasta |
| `endTurn` | — | Koniec tury tego gracza AI (zawsze ostatnia komenda) |

> `buildingId` to nazwa pasująca do `Budynek`/`Jednostka` w danych (np. `'Mury'`, `'Wojownik'`, `'Spichlerz'`).

### 2.2 Pętla decyzji (algorytm `decideAITurn`)

1. Podział na `myUnits/myCities/enemyUnits/enemyCities` wg `ownerId`.
2. **Archetyp:** `opts.civType` → `CIV_TO_ARCH` → `readArchMods(data, archKey)` (deltas: wojsko/nauka/ekonomia/obrona). Brak/nieznany typ → fallback `grecy`.
3. **Krok 2 — PRODUKCJA:** dla każdego mojego miasta `chooseCityProduction(...)` → ewentualna komenda `build` (jedna na miasto).
4. **Krok 4 — RUCH I ATAK:** sortuj jednostki (super → bojowe → osadnicy), potem per jednostka:
   - **Osadnik:** jeśli `canFoundCity(q,r,cities,map)` → `foundCity`; inaczej `findSettlerTarget(...)` (najlepsze pole ≥ `min_dystans_miast`) i krok ku niemu.
   - **Bojowa** (`ruchLeft > 0`):
     - sąsiad-wróg (dystans 1) → `attack`;
     - sąsiednie miasto wroga → `move` na nie (silnik = zdobycie);
     - inaczej marsz ku **najbliższemu miastu wroga** (§8d dominacja); po drodze: dystansowe trzymają się z tyłu jeśli wróg ≤ 3 i daleko od domu; przechwyć wroga jeśle `distToUnit < distToCity && ≤ 3`;
     - brak miast wroga → eksploracja **najbliższej neutralnej wioski** (`findNearestVillage`);
     - inaczej patrol: wróć ku najbliższemu własnemu miastu jeśli > 2 pola.
5. `endTurn`.

### 2.3 `chooseCityProduction` — priorytety produkcji

Zwraca `id` budynku/jednostki do zbudowania lub `null`.

- **Zagrożenie** (wróg ≤ `ekspansja_zagroz_zasieg` od miasta): `Mury` (jeśli brak) score `300+obrona`, `Wojownik` score `280+wojsko`.
- **Faza wczesna** (`myCities.length < 3`): `Spichlerz` (250), `Osadnik` (200, gdy < 3 miast), `Wojownik` (190+wojsko, gdy miasto bez garnizonu), `Lucznik` (180+wojsko).
- **Faza środkowa** (≥ 3 miast): `Koszary` (200+wojsko), `Wojownik` (170+wojsko), `Lucznik` (165+wojsko), budynki ekonomiczne `Tartak/Cegielnia/Huta/Magazyn/Targowisko` (140+ekonomia), `Osadnik` (100).
- **Mnożnik archetypu:** `score += delta * 20` dla kategorii wojsko/ekonomia/obrona.
- **Filtr:** budynki już zbudowane (z `opts.cityBuildings`) są pomijane; jednostki można budować wielokrotnie. Wybór = najwyższy score.

### 2.4 `hexCityScore` — heurystyka wyboru pola pod miasto

Suma punktów (parametry z sekcji „§3 Ekspansja"):
- Żywność ≥ 3 → `+ekspansja_heurystyka_zywnosc_pkt` (3)
- Praca ≥ 2 → `+...praca_pkt` (2)
- Handel ≥ 1 → `+...handel_pkt` (1)
- sąsiedztwo rzeki (`hex.rzeka.obecna`) → `+...rzeka_pkt` (2)
- surowiec (`Nakladka.ZlozeGliny`/`ZlozeRudy`) → `+...surowiec_pkt` (2)
- miasto wroga < `ekspansja_zagroz_zasieg` (5) → `+...granica_kara` (−3)

`findSettlerTarget` skanuje wszystkie pola lądowe (pomija `morze/wybrzeze/gory`), odrzuca pola < `min_dystans_miast` od dowolnego miasta i bierze najwyższy `hexCityScore`.

### 2.5 Archetypy (osobowość)

`CIV_TO_ARCH`: `grecy→grecy, rzymianie→rzym, chinczycy→chiny, zulusi→zulusi, inkowie→inkowie, egipt→egipt, babilon→sumer`.
`readArchMods` czyta `archetype_<arch>_{wojsko|nauka|ekonomia|obrona}_priorytet` jako deltę priorytetu.

> **ROZBIEŻNOŚĆ Z DANE:** archetypy pokrywają **7 typów**. Aktualny roster to **9 typów** (doszli **Celtowie** i **Germanie**).
> Dla nich brak wpisu w `CIV_TO_ARCH` → fallback `grecy`. Do zrobienia: dodać `archetype_celtowie_*` i `archetype_germanie_*`
> (panel + JSON) oraz mapowanie w `CIV_TO_ARCH`. Patrz sekcja 10 (TODO).

### 2.6 Reguły `ai.ts` (zwięźle)

- Jedna komenda `build` na miasto na turę; jeden krok ruchu (`move`) na jednostkę na turę.
- AI atakuje tylko sąsiada (dystans 1); dalej maszeruje ścieżką `computePath` (te same reguły terenu co gracz).
- Cel strategiczny v0.1 = **zniszczyć miasta rywali własnego typu** (§8d) — jednostki ciągną do najbliższego miasta wroga.
- Dystansowe (`lucznik/procarz/oszczepnik`) unikają pierwszej linii, gdy wróg blisko, a one daleko od domu.

---

## 3. `victory.ts` — warunki zwycięstwa

```ts
export function checkVictory(input: VictoryInput): VictoryResult | null
```

`VictoryInput`: `players: VictoryPlayer[]` (`id, typCywilizacji, ai`), `cities: City[]`, `gracz: number`,
`epokaKoncowa?`, `naukaUkonczona?`, `liczbaOsadnikow?`.
`VictoryResult`: `{ winner: number, rodzaj: 'dominacja' | 'nauka' | 'przegrana' }`.

**Kolejność rozstrzygania (pierwszy trafiony wygrywa):**
1. **Dominacja typu (§8d.1):** wszyscy rywale o tym samym `typCywilizacji` co `gracz` są **wyeliminowani** (0 miast). Wymaga, by istniał ≥ 1 taki rywal.
2. **Przegrana:** `gracz` ma 0 miast **i** `liczbaOsadnikow === 0` (nie ma z czego się odbudować).
3. **Nauka/kosmos (§8d.2):** `epokaKoncowa && naukaUkonczona`.
4. Inaczej `null` (gra trwa).

Pomocnicze (eksportowane, pure): `playersOfType(players, typ, exceptId?)`, `citiesOf(playerId, cities)`, `isEliminated(playerId, cities)` (= 0 miast).

**Reguła kluczowa:** gracz/AI jest **wyeliminowany dopiero gdy traci WSZYSTKIE miasta** — zdobycie samej stolicy nie kończy gry
(stolica przenosi się do innego miasta, super-jednostka odradza się). Dominacja sprawdzana **przed** własną przegraną
(wymiana ciosów w tej samej turze rozstrzyga się na korzyść gracza).

---

## 4. `barbarians.ts` — barbarzyńcy („żyjący świat")

Neutralna frakcja: `BARBARIAN_OWNER_ID = -1` (`isBarbarian(ownerId)`). Nigdy nie myli się z graczem (0) ani AI (1..N).

### 4.1 Struktury
- `BarbCamp { id, q, r, spawnCooldown }` — stacjonarny obóz (punkt spawnu, regeneracja).
- `BarbUnit extends RuntimeUnit { healthFrac?, campId? }` — jednostka z opcjonalnym HP do logiki odwrotu.
- `BarbSpawn { campId, q, r, typeId }` — żądanie utworzenia jednostki (silnik instancjuje z `units.json`, `ownerId = -1`).
- Komendy: `BarbCmdMove`, `BarbCmdAttack` (`BarbCommand`).

### 4.2 Funkcje (pure)
- `barbariansActive(turn, params)` — `turn >= startTurn`.
- `spawnCamps(map, existing, cities, params, seed)` → nowe obozy. Pole: istniejący, przejezdny ląd, **neutralne** (`wlasciciel===null`), ≥ `minDistFromCity` od miast, ≥ `campSpacing` od innych obozów. Deterministyczny shuffle (LCG Fisher-Yates z `seed`). Limit `maxCamps`.
- `tickCamps(camps, barbUnits, allUnits, map, params)` → `{ camps, spawns }`. Odlicza `spawnCooldown`; przy 0 i gdy w `campControlRadius` jest < `unitsPerCamp` jednostek → 1 `BarbSpawn` na wolnym sąsiednim polu, reset cooldownu do `spawnInterval`. Przy zapełnionym limicie/braku pola: cooldown zostaje 0 (próbuje dalej).
- `decideBarbarianMoves(barbUnits, playerUnits, cities, camps, map, params)` → `BarbCommand[]`. Per jednostka (priorytet): (1) ranny (`healthFrac < retreatHpFrac`) → krok ku najbliższemu obozowi; (2) sąsiad-wróg → atak; (3) cel (jednostka/miasto) w `aggroRadius` → krok ku najbliższemu; (4) bezczynność → dryf ku obozowi. Barbarzyńcy nigdy nie atakują siebie.

### 4.3 Parametry `BarbParams` + `FALLBACK_BARB_PARAMS`

| Pole | Default | Klucz panelu (`barbarzyncy_*`) |
|------|---------|--------------------------------|
| `startTurn` | 5 | `barbarzyncy_start_tura` |
| `maxCamps` | 6 | `barbarzyncy_max_obozy` |
| `minDistFromCity` | 5 | `barbarzyncy_min_dystans_miasto` |
| `campSpacing` | 6 | `barbarzyncy_odstep_obozow` |
| `spawnInterval` | 6 | `barbarzyncy_interwal_spawnu` |
| `unitsPerCamp` | 2 | `barbarzyncy_jednostek_na_oboz` |
| `campControlRadius` | 3 | `barbarzyncy_zasieg_kontroli` |
| `aggroRadius` | 6 | `barbarzyncy_zasieg_agresji` |
| `retreatHpFrac` | 0.3 | `barbarzyncy_prog_odwrotu_hp` |
| `unitTypeId` | `'Wojownik'` | (stały, nie z panelu) |

`loadBarbParams(data)` czyta te klucze z `ai-params.json`, z fallbackiem do defaultów. **Odporne** na `wartosc`/`wartość`
(czyta `entry['wartość'] ?? entry['wartosc']`). **Te klucze dodano do panelu w tym pakiecie** (wcześniej ich nie było → działały tylko defaulty).

---

## 5. System parametrów (panel → JSON)

### 5.1 Struktura
- **Panel:** `AI-parametry.xlsx`, arkusz `AI-parametry`. Kolumny: **`Parametr` | `Wartość` | `Sekcja` | `Opis` | `Status`** (`Status` dodany w tym pakiecie: `LIVE` = czytany przez kod teraz / `PLANOWANE` = zdefiniowany, czeka na wpięcie).
- **JSON:** `gra/data/ai-params.json` — obiekt `{ <klucz>: { "wartosc": <liczba>, "sekcja": <str>, "opis": <str> } }`.
- **Kod czyta** przez `data.aiParams[<klucz>]` (z `GameData`, wczytane przez `loader.ts`).

### 5.2 Pełny rejestr parametrów (po sekcjach)

**§2 Ruch**
- `ai_wycofanie_hp_prog` = 0.3 — **PLANOWANE** (próg HP odwrotu jednostki AI; `ai.ts` jeszcze nie implementuje odwrotu — barbarzyńcy mają własny `retreatHpFrac`).

**§3 Ekspansja — LIVE (czyta `ai.ts`)**
- `ekspansja_min_dystans_miast` = 5 · `ekspansja_zagroz_zasieg` = 5
- `ekspansja_heurystyka_zywnosc_pkt` = 3 · `..._praca_pkt` = 2 · `..._handel_pkt` = 1 · `..._rzeka_pkt` = 2 · `..._surowiec_pkt` = 2 · `..._granica_kara` = −3

**§6 Dyplomacja — PLANOWANE** (zdefiniowane; `ai.ts` ich nie czyta — patrz sekcja 8 DYPLOMACJA)
- `dyplomacja_strach_prog_nap` = 60 · `dyplomacja_strach_prog_trybut` = 60 · `dyplomacja_relacja_handel` = 30 · `dyplomacja_relacja_startowa_rywale` = −20 · `dyplomacja_relacja_prog_wojna` = −40 · `dyplomacja_max_propozycji_ture` = 1 · `dyplomacja_zdrowie_armii_pokój` = 0.4

**§7 Trudność — PLANOWANE** (3 poziomy; aplikuje je SILNIK/ekonomia przy spawnie AI, nie `ai.ts`)
- poziom1 (Prosty): bonus_produkcja 0, bonus_nauka 0, startowe_jednostki 0, startowe_miasta 0, bonus_walka 0
- poziom2 (Normalny): bonus_produkcja 0.1, bonus_nauka 1, startowe_jednostki 1, startowe_miasta 0, bonus_walka 0
- poziom3 (Trudny): bonus_produkcja 0.25, bonus_nauka 0, startowe_jednostki 0, startowe_miasta 1, bonus_walka 0.05

**§8 Archetypy — LIVE (czyta `ai.ts`)** — 7 typów × {wojsko, nauka, ekonomia, obrona} (delty −1..+2). Najważniejsze:
- Rzym: wojsko +1 · Zulusi: wojsko +2, nauka −1, ekonomia −1 · Sumer: nauka +2, wojsko −1 · Chiny: wojsko −1, nauka +1, ekonomia +1 · Grecy: nauka +1 · Egipt: ekonomia +1 · Inkowie: obrona +1.

**§5 Barbarzyńcy — LIVE (czyta `barbarians.ts`)** — 9 kluczy `barbarzyncy_*` (tabela w sekcji 4.3). Dodane w tym pakiecie.

> Uwaga: parametr `nauka` w archetypach jest zdefiniowany, ale **heurystyka nauki (§5 Spec-AI) nie jest jeszcze w `ai.ts`** —
> delta nauki zadziała dopiero po dopisaniu wyboru technologii.

### 5.3 Eksport panel → JSON: `gra/tools/export-ai-params.py`

Skrypt (w tym pakiecie) **nakłada** wartości z `AI-parametry.xlsx` na istniejący `ai-params.json`
(zachowuje strukturę/kolejność, puste komórki = brak zmiany), wzorem `export-panel.py` (Civ-MIASTO).
- Kolumna Excela **`Wartość`** → klucz JSON **`wartosc`** (ASCII) — skrypt zapisuje pod nazwą `wartosc`, żeby zgadzało się z plikiem danych.
- Nowe wiersze w panelu (klucz spoza JSON) są **dopisywane** do JSON z `wartosc/sekcja/opis`.
- Użycie: `python3 gra/tools/export-ai-params.py` (czyta z folderu Civ, pisze do `gra/data/ai-params.json`).
- **NIE** używać `export-data.py` ani `npm run build` (regenerują wszystkie JSON-y i kasują cudzą pracę). Tylko ten celowany skrypt.

---

## 6. Integracja z silnikiem (Civ-SILNIK) — kontrakt wpięcia

To robi **wyłącznie SILNIK** w `main.ts`. AI tylko dostarcza funkcje.

**Gdzie w pętli tury:**
1. Po turze gracza, dla każdego AI `playerId`: `cmds = decideAITurn(playerId, units, cities, map, data, { civType, cityBuildings })` → wykonaj `cmds` po kolei.
2. „Żyjący świat" co turę: `params = loadBarbParams(data)`; jeśli `barbariansActive(turn, params)` → `spawnCamps(...)` (gdy < `maxCamps`), `tickCamps(...)` (utwórz `spawns` jako `RuntimeUnit` z `ownerId=-1`), `decideBarbarianMoves(...)` → wykonaj.
3. Po turze: `res = checkVictory({ players, cities, gracz, epokaKoncowa, naukaUkonczona, liczbaOsadnikow })`; jeśli `!== null` → ekran końca (Civ-UI).

**Jak wykonać `AICommand`:**

| Komenda | Wykonanie w silniku |
|---------|---------------------|
| `move` | przesuń jednostkę na (`toQ,toR`), zdejmij `ruchLeft`/koszt ruchu |
| `foundCity` | `foundCity(...)` z `cities.ts`; usuń osadnika |
| `attack` | rozstrzygnij `combat.ts` (`resolveCombat`), zastosuj wynik (usuń/ranny/zdobądź) |
| `build` | `buildingProductionItem`/`unitProductionItem` + `enqueue` z `production.ts` na kolejce miasta |
| `endTurn` | zakończ turę tego AI |

**Co silnik MUSI dostarczyć:** `RuntimeUnit[]` (pola `id, ownerId, q, r, category, typeId, ruchLeft`), `City[]`, `GameMap` (`hexes`, `terenBazowy`, `rzeka`, `nakladka`, `wioska`, `wlasciciel`, `coords`), `GameData` (`aiParams, units, buildings, terrainYields`).
**Bonusy trudności** (`trudnosc_*`) aplikuje SILNIK przy spawnie AI (startowe jednostki/miasta) oraz ekonomia/walka (przez `turn-economy.buildEconParams` / mnożnik walki) — nie `ai.ts`.

---

## 7. Interakcje z innymi działami

| Dział | Co AI od niego bierze / mu daje | Kontrakt / punkt styku | Status |
|-------|--------------------------------|------------------------|--------|
| **Civ-SILNIK** | wykonawca komend; woła `decideAITurn`, barbarzyńców, `checkVictory` | sekcja 6 | do wpięcia |
| **Civ-DANE** | `civs.json.TypCywilizacji` → archetyp (`opts.civType` → `CIV_TO_ARCH`) | string typu cyw. | LIVE (7/9 typów) |
| **Civ-MIASTO** | `City`, `canFoundCity`, `foundCity`; `buildingId` musi pasować do `buildings.json`; `cityBuildings` | `cities.ts`, `production.ts` | LIVE |
| **Civ-UNITS/Battle** | `RuntimeUnit` (kategorie super/osadnik/lucznik…), `typeId` z `units.json`; `attack` → `combat.ts` (`resolveCombat`, countery, flanki) | `units/setup.ts`, `combat.ts` | LIVE (atak), reszta walki przez silnik |
| **Civ-MAPA** | `GameMap`: plony terenu (`terrainYields`), rzeki, `Nakladka` (surowce), wioski; **spawn klastrów** (rozmieszczenie typów) | `types/map`, `Spec-generator-mapy.md §0.1` | mapa LIVE; klastry PLANOWANE |
| **Civ-EKONOMIA** | koszt produkcji/Praca; bonus trudności produkcji; „czy stać na wojsko" | `economy.ts`/`turn-economy.ts` (`cityYieldPerTurn`, `buildEconParams`) | PLANOWANE (AI nie sprawdza skarbca) |
| **Civ-DYPLOMACJA** | relacje → wojna/pokój; `aiDiplomacyStance(ctx)` zwraca postawę AI | `diplomacy.ts`: `AIDiplomacyContext`, `AIDiplomacyStance`, `aiDiplomacyStance(...)`, `relationScore(rel)` | PLANOWANE (gotowy hak, niewpięty w `ai.ts`) |
| **Civ-UI** | ekran końca gry z `VictoryResult` | `victory.ts` → UI | PLANOWANE |

**Najważniejsze styki do zrealizacji:**
- **MAPA → AI (spawn klastrów):** wg `Spec-generator-mapy.md §0.1` — 9 typów, każdy = 1 stolica + do 9 rywali tego samego typu (klaster do 10 miast, `min_dystans` ≈ 9 heks). **MAPA rozmieszcza** klastry startowo; **AI rozwija** je osadnikami w obrębie własnego typu. Cel „dominacja typu" (`victory.ts`) opiera się o ten model. Przekazanie kontraktu przez `_handoff/`.
- **DYPLOMACJA → AI:** `aiDiplomacyStance(ctx: AIDiplomacyContext): AIDiplomacyStance` już istnieje w `diplomacy.ts` — `ai.ts` powinien go wołać dla decyzji wojna/pokój/NAP/trybut, używając progów `dyplomacja_*`. Dziś `ai.ts` zachowuje się czysto militarnie (marsz na rywala typu).
- **EKONOMIA → AI:** zanim AI zakolejkuje jednostkę, powinno sprawdzić budżet (`cityYieldPerTurn`/skarbiec). Dziś produkcja jest wybierana wg priorytetu **bez kontroli kosztu**.

---

## 8. Stan implementacji: LIVE vs PLANOWANE

| Obszar (Spec-AI §) | Status w kodzie |
|--------------------|-----------------|
| §2 Ruch/atak jednostek | **LIVE** (`ai.ts` krok 4) |
| §2.3 Odwrót rannych jednostek AI | PLANOWANE (jest tylko u barbarzyńców) |
| §3 Ekspansja (zakładanie, heurystyka, wioski) | **LIVE** |
| §4 Produkcja (fazy, zagrożenie, archetyp) | **LIVE** |
| §5 Nauka (wybór technologii) | **PLANOWANE** (brak w `ai.ts`) |
| §6 Dyplomacja (war/peace/NAP/trybut) | PLANOWANE (hak `aiDiplomacyStance` gotowy) |
| §7 Trudność — poziom 1 (Prosty) | **LIVE** (te same zasady co gracz) |
| §7 Trudność — 3 poziomy (bonusy) | PLANOWANE (parametry są; aplikuje SILNIK) |
| §8 Archetypy 7 typów | **LIVE** (brak Celtów/Germanów = 9 typów) |
| §9 victory.ts (dominacja/nauka/przegrana) | **LIVE** (testowane) |
| Barbarzyńcy (spawn/tick/ruch) | **LIVE** (test `barbarians-test`: 53/0) |

---

## 9. Znane bugi / ryzyka / TODO

1. **`wartosc` vs `wartość` w `ai.ts` (RYZYKO).** `getAiParam`/`readArchMods` czytają tylko `entry.wartość` (z diakrytykiem), a `ai-params.json` przechowuje klucz `wartosc` (ASCII). Jeśli `loader.ts` nie normalizuje nazwy pola, zwracane jest `undefined` zamiast wartości → parametry AI po cichu nie działają. `barbarians.ts` robi to dobrze (`entry['wartość'] ?? entry['wartosc']`). **Zalecenie:** ujednolicić `ai.ts` do `?? entry['wartosc']` (1 linia w `val`/`getAiParam`). Do weryfikacji: czy `loader.ts` mapuje pole.
2. **Archetypy 7/9 typów.** Brak `Celtowie`/`Germanie` w `CIV_TO_ARCH` i w panelu — fallback `grecy`. Dodać `archetype_celtowie_*`, `archetype_germanie_*` (panel + JSON) + mapowanie.
3. **AI nie sprawdza budżetu.** `chooseCityProduction` wybiera wg priorytetu, ignorując koszt/Pracę/skarbiec. Styk z EKONOMIA do dopięcia.
4. **Spawn klastrów (90 miast).** Reguła zatwierdzona (`Spec-generator-mapy.md §0.1`), ale niezaimplementowana — MAPA rozmieszcza, AI rozwija; bez tego „dominacja typu" nie ma startowej struktury.
5. **Brak heurystyki nauki (§5).** Delta `nauka` w archetypach jest nieużywana do czasu dopisania wyboru technologii.
6. **`combat-test` w piaskownicy** nie przechodzi przez blokadę zapisu `/tmp` (plik `nobody`) — to środowisko, nie kod (`combat.ts` kompiluje się i eksportuje pełen zestaw funkcji).

---

## 10. Słownik i odniesienia

- **Archetyp** — „osobowość" typu cywilizacji (delty priorytetów produkcji). 7 wartości: grecy, rzym, chiny, zulusi, inkowie, egipt, sumer.
- **Dominacja typu (§8d.1)** — zwycięstwo przez zniszczenie wszystkich miast rywali własnego typu.
- **Klaster** — 1 stolica + do 9 rywali tego samego typu (do 10 miast/typ); patrz `Spec-generator-mapy.md §0.1`.
- **RuntimeUnit** — runtime'owa jednostka (`units/setup.ts`): `id, ownerId, q, r, category, typeId, ruchLeft`.
- **Odniesienia:** `Spec-AI.md` (design §1–§9), `PROJEKT-GRY-master.md §8b/§8c/§8d`, `Spec-generator-mapy.md §0.1` (spawn klastrów), `gra/src/game/{ai,victory,barbarians,combat,diplomacy,production,cities}.ts`.

---
*Dokument utrzymuje sesja Civ-AI. Zmiany parametrów: w `AI-parametry.xlsx` → `export-ai-params.py` → `ai-params.json` (nigdy `export-data.py`).*
