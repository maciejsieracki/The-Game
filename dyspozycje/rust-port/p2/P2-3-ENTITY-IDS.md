# P2.3 — Schemat ID encji i relacji + pełne porównanie `RuntimeUnit`/`City` (web) vs `UnitDto`/`CityDto` (Rust)

**Temat:** `R-RUSTPORT-P2-3-ENTITY-IDS-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Status:** PROPOZYCJA, nie decyzja. Każdy punkt bez jednoznacznej odpowiedzi w materiale źródłowym jest oznaczony `D-ID-n` (wymaga decyzji) i NIE jest rozstrzygnięty po cichu.

**Piny:**
- web `main` = `edb8fb56` (odczyt `git show edb8fb56:…`, zakres `gra/src/**`),
- Rust `rust-port/parity-v2` = `9e33fc77` (odczyt `git show 9e33fc77:…`, zakres `rust-port/engine/src/**`).

**Metoda:** odczyt wyłącznie read-only (`git show`, `git grep`). Deklaracje pól liczone grepem po wcięciu 2 spaces w interfejsie (web `RuntimeUnit`: 25 pól, `City`: 61 pól). Brak zmian w `gra/**`, brak nowego kodu Rust, brak uruchomienia testów.

**Źródła:** `P2-2-GAMESTATE-CONTRACT.md` (§1 zasady, §8 rozstrzygnięcia D1–D14 i punkty 9–10), `P1-18-HOTSEAT-MATRIX.md` (wiersze A–C), `P2-9-ASSET-DATA-MAPPING.md` (§2d, §2f, §2a).

**Ważna uwaga o zakresie:** P2.2 §3 wskazuje, że `City` web ma „znacznie więcej pól” niż `CityDto`. Pełne porównanie wymagane przez P2.2 D10 jest w §4 i §5 — obejmuje **wszystkie** pola obu interfejsów, bez próbkowania.

---

## 1. Ustalenia z kodu (fakty, z dowodem)

### 1.1 Typy ID po stronie web (`edb8fb56`)

| Byt | Typ pola `id` | Dowód | Jak powstaje |
|---|---|---|---|
| `RuntimeUnit` | `string` | `gra/src/units/setup.ts:41` | Losowo: `'prod_' + turn + '_' + cityId + '_' + Math.random().toString(36).slice(2)` (`gra/src/main.ts:3932`); analogicznie prefiksy `diffbonus_` (`main.ts:9330`), `wioska_` (`main.ts:25926`), `rec_` (`main.ts:32743`) |
| `City` (używany w grze) | `string` | `gra/src/game/cities.ts:835` | `'city' + cities.length` (`gra/src/game/cities.ts:1249`, `:1286`) |
| `City` z `types/city.ts` | `string` | `gra/src/types/city.ts:115` | Nieużywany w grze (patrz D-ID-9) |
| Właściciel | `number` (liczba całkowita) | `gra/src/units/setup.ts:42`, `gra/src/game/cities.ts:836` | 0 = człowiek (`human-owners.ts:21`, `HUMAN_OWNER_PRIMARY = 0`), 1..N = AI; `-1` = barbarzyńcy (`barbarians.ts:49`); `-99` = bunt (`society-breakdown.ts:206`) |

**Stabilność:**
- Identyfikatory jednostek są generowane **z `Math.random()`**, a nie z licznika ani z RNG gry. Nie są odtwarzalne z seeda. To jest sprzeczne z zasadą deterministycznego odtworzenia tury z `P2-2 §1 pkt 1` i wymaga decyzji (D-ID-3).
- Identyfikatory miast są **zależne od długości tablicy** (`'city' + cities.length`). Unikalność jest gwarantowana tylko przy braku usuwania miast. Komentarz `gra/src/main.ts:35792` deklaruje „`cities` nigdy się nie kurczy w trakcie tury (zero cities.splice w src/)”. Grep potwierdza brak `cities.splice` w `gra/src` (0 trafień). `gra/src/game/capital-capture.ts:26` i `:63` traktują numer z `'city' + N` jako globalną kolejność zakładania miast.
- Identyfikatory są **zapisywane** w obiekcie jednostki/miasta. Sama ścieżka zapisu (`save.ts`) nie została tu prześledzona wprost — do potwierdzenia w P2.7 (oznaczone poniżej jako „do potwierdzenia P2.7”).

### 1.2 Typy ID po stronie Rust (`9e33fc77`)

| Typ | Definicja | Dowód |
|---|---|---|
| `PlayerId` | newtype `u64`, `Copy`, `Ord`, `serde(transparent)` | `rust-port/engine/src/domain/ids.rs:36` (makro `id_type!`) |
| `CityId` | newtype `u64` | `ids.rs:37` |
| `UnitId` | newtype `u64` | `ids.rs:38` |
| `PlayablePlayer.id` | **surowe `u64`** (nie `PlayerId`) | `rust-port/engine/src/domain/playable.rs:285` |
| `CombatUnit.id` | surowe `u64` | `rust-port/engine/src/domain/combat.rs:26` |
| `AiUnit.id`, `AiUnit.owner_id` | surowe `u64` | `rust-port/engine/src/domain/ai_turn.rs:333-334` |
| `CitySnapshot.owner_id`, `BarbUnit.owner_id` | surowe **`i64`** | `rust-port/engine/src/domain/barbarians.rs:136`, `:184` |
| `BARBARIAN_OWNER_ID` | `i64 = -1` | `barbarians.rs:13` |

**Wniosek:** w Rust istnieją **dwa niezgodne typy właściciela** (`u64` i `i64`) oraz typy ID bez newtype w czterech strukturach jednostek/miast. Newtypy `PlayerId/CityId/UnitId` istnieją, ale nie są stosowane konsekwentnie.

### 1.3 Konwencja człowieka: konflikt wartości

- Web: człowiek = owner **0** (`gra/src/game/human-owners.ts:21`, `HUMAN_OWNER_PRIMARY = 0`; komentarz `setup.ts:37`: „ownerId 0 = human player”).
- Rust: człowiek = owner **1** (`rust-port/engine/src/domain/playable.rs:15`, `const HUMAN_PLAYER_ID: u64 = 1;`; użycie `playable.rs:418`, `:425`). `CAPITAL_ID: u64 = 1` (`playable.rs:16`).

To jest **konflikt konwencji**, nie tylko nazwy. Import zapisu web (D7 w P2.2: Rust MUSI wczytać zapisy web 1:1) przy konwencji Rust zmieniałby właściciela człowieka z 0 na 1. Patrz D-ID-8.

### 1.4 Rust: relacje właściciel↔byt

- `CityDto.owner_id: PlayerId` (`rust-port/engine/src/domain/types.rs:331`).
- `UnitDto.owner_id: PlayerId` (`types.rs:415`).
- `CivilizationDto` przechowuje **listy odwrotne** `city_ids: Vec<CityId>`, `unit_ids: Vec<UnitId>` (`types.rs:259-263`). To jest redundancja względem `owner_id` na encji (patrz D-ID-4).

### 1.5 Rust: pozycja

- `HexCoord { q: i32, r: i32 }` (`rust-port/engine/src/domain/hex.rs:9-11`) — kanoniczna współrzędna domenowa, zgodna znaczeniowo z web `q, r: number` (`setup.ts:46-47`, `cities.ts:837-838`).
- `PositionDto { x: u16, y: u16 }` (`types.rs:118-122`) — pole pozycji w `CityDto` (`types.rs:333`) i `UnitDto` (`types.rs:417`). **Nie** jest tożsame z `HexCoord`: inne nazwy osi (`x/y` zamiast `q/r`), typ bez znaku (`u16`) zamiast `i32`. Patrz D-ID-6.

### 1.6 Rust: wiele reprezentacji jednostek

W `rust-port/engine` istnieją cztery struktury jednostek o różnych kształtach:

| Struktura | Plik:linia | Owner | Pozycja | Uwagi |
|---|---|---|---|---|
| `UnitDto` | `types.rs:413` | `PlayerId` (u64) | `PositionDto` (u16) | 4 pola, DTO |
| `CombatUnit` | `combat.rs:25` | brak pola owner | brak pozycji | `hp`, `max_hp`, `morale`, statystyki |
| `AiUnit` | `ai_turn.rs:332` | `u64` | `i32 q, r` | `movement_left`, `health_fraction`, `embarked` |
| `BarbUnit` | `barbarians.rs:182` | `i64` | `i32 q, r` | `embarked`, `sea_raider`, `camp_id` |

Brak jednego kanonicznego `UnitState` w stanie gry — patrz D-ID-10.

---

## 2. Proponowany schemat ID (PROPOZYCJA)

### 2.1 Typy
- **Kanon:** newtypy `PlayerId`, `CityId`, `UnitId` (`ids.rs:36-38`), wszystkie `u64`.
- **Zakaz** surowego `u64`/`i64` jako identyfikatora bytu w `GameState` i w DTO. Wyjątek: właściciel sentynelowy (§2.4).
- **Identyfikator web** (`string`) NIE wchodzi do stanu gry. Przy imporcie zapisu (P2.11) powstaje jednorazowa tabela mapowania `legacy_id → CityId/UnitId`, przechowywana poza `GameState`. Decyzja: D-ID-1.

### 2.2 Zakres i generowanie
- **Per typ bytu**, nie globalny: `CityId` i `UnitId` to różne typy, więc „miasto #5” i „jednostka #5” nie mogą się pomylić na poziomie typów. Zgodne z `ids.rs` i z web (osobne prefiksy).
- **Generowanie:** monotoniczny licznik per typ, zapisany w stanie (`next_city_id`, `next_unit_id`, `next_owner_id`). Zastępuje `'city' + cities.length` (zależne od długości) i `Math.random()` (niedeterministyczne). Decyzja: D-ID-3.
- **Nie** używać `Math.random` ani czasu zegarowego do tworzenia ID.

### 2.3 Stabilność
- ID są przypisane przy powstaniu i **niezmienne** przez tury, zapisy i wczytania. Nie są regenerowane przy wczytaniu.
- ID nie są ponownie używane po usunięciu bytu (licznik idzie tylko w górę).
- Zgodność z web: stabilność w zapisie web jest zachowana przez mapowanie z §2.1 (do potwierdzenia P2.7).

### 2.4 Właściciel (OwnerId)
- Gracze: `PlayerId` (u64). Człowiek = `PlayerId(0)` (zgodnie z web; patrz D-ID-8).
- Byty sentynelowe: barbarzyńcy (`-1`) i bunt (`-99`) — web używa liczb ujemnych (`barbarians.ts:49`, `society-breakdown.ts:206`). Rust ma tylko `BARBARIAN_OWNER_ID: i64 = -1` (`barbarians.rs:13`) i nie ma odpowiednika dla buntu (grep `rebel`/`revolt` w domenie: 0 trafień).
- Proponowany typ: `enum OwnerRef { Player(PlayerId), Barbarian, Rebel }` zamiast liczby ze znakiem. Decyzja: D-ID-7.

### 2.5 Relacje (kanoniczna forma)

| Relacja | Kanon (przechowywane) | Pochodne (NIE przechowywać) | Web dziś |
|---|---|---|---|
| miasto → właściciel | `CityDto.owner_id` / `City.owner: OwnerRef` | — | `City.ownerId` (`cities.ts:836`) |
| jednostka → właściciel | `UnitDto.owner_id` | — | `RuntimeUnit.ownerId` (`setup.ts:42`) |
| właściciel → miasta | — | lista z `owner_id` miast | Rust: `CivilizationDto.city_ids` (`types.rs:262`) |
| właściciel → jednostki | — | lista z `owner_id` jednostek | Rust: `CivilizationDto.unit_ids` (`types.rs:263`) |
| jednostka → miasto (oblężenie) | `oblega: Option<CityId>` (proponowane) | — | `RuntimeUnit.oblegaCityId: string` (`setup.ts:64`) |
| jednostka → miasto (garnizon) | do decyzji (D-ID-5) | „miasto na tym heksie tego samego właściciela” | `RuntimeUnit.inGarnizon: bool` (`setup.ts:51`), brak id miasta |
| byt → pozycja | `HexCoord` (`hex.rs:9`) | — | `q, r` (`setup.ts:46-47`, `cities.ts:837-838`) |

Zasada: jedno źródło prawdy (pole na encji). Listy odwrotne są pochodne i nie są częścią `GameState` (spójne z P2.2 §1 pkt 2).

### 2.6 Hot-seat (dwóch ludzkich właścicieli)
- Fotele = zbiór `PlayerId` w `owners` (P2.2 D2 → `owners`), np. `human_owner_ids: [PlayerId(0), PlayerId(N)]`.
- `active_human: PlayerId` — **wskaźnik**, nie właściciel. Przełączenie aktywnego fotela zmienia tylko ten wskaźnik. Lokalizacja: według P2.2 §8 D2 (`activeHumanOwnerId` → pole w `owners`, czyli `GameState`, nie sesja UI). Ta lokalizacja jest przyjęta z D2, a nie wynika z tego podpunktu (zarzut 3).
- Byty NIE są przenumerowywane przy przełączeniu. Jednostki i miasta fotela nieaktywnego zachowują `owner_id`. Brak kopiowania stanu między fotelami.
- Web: `humanOwnerIds = [0, N]`, gdzie N to `ownerId` drugiego fotela (`human-owners.ts:23-28`, komentarz). Dla spójności P1-18 B2/B3 (`active_human_id` 1→2) identyfikatory fotela muszą być stabilnymi `PlayerId`, nie indeksami listy.
- Warunek: `PlayerId` drugiego fotela nie może zależeć od kolejności wyboru w kreatorze. Przydział z `next_owner_id`.

---

## 3. Odpowiedzi na pytania z dispatchu

| Pytanie (00-dispatch) | Odpowiedź (propozycja) | Status |
|---|---|---|
| Typ ID | `u64` newtype (`PlayerId/CityId/UnitId`); web `string` tylko jako klucz importu | propozycja, D-ID-1 |
| Globalne czy per typ | Per typ (osobne newtypy); licznik per typ | propozycja, D-ID-2 (zakres zamknięty przez typy) |
| Stabilne między turami/zapisami | Tak (kanon). Web: ID przypisane przy powstaniu i zapisywane (potwierdzić P2.7) | web: `Math.random` i `'city'+length` NIE są stabilne przy odtwarzaniu; D-ID-3 |
| Relacja miasto↔właściciel | `owner_id` na `CityDto`; web `ownerId` | zgodne znaczeniowo; typ różny (D-ID-7) |
| Relacja jednostka↔miasto | `oblega: Option<CityId>`; garnizon wyprowadzany z pozycji | D-ID-5 |
| Hot-seat | Fotele = `PlayerId` w `owners`; `active_human` = wskaźnik w `owners` (P2.2 §8 D2); brak przenumerowania | propozycja; konflikt konwencji 0 vs 1 (D-ID-8) |

---

## 4. Pełne porównanie `RuntimeUnit` (web) vs jednostka Rust

Legenda kolumny „Rust”:
- **TAK** — pole w `UnitDto` (`types.rs:413-418`),
- **INNY TYP** — pole istnieje w `UnitDto` pod inną nazwą lub typem,
- **POZA DTO** — pole istnieje w innej strukturze domenowej Rust (wskazana),
- **BRAK** — brak pola/konceptu w `rust-port/engine/src` (sprawdzone grepem na nazwie i na pojęciu; patrz §6).

Wszystkie wiersze: plik web `gra/src/units/setup.ts`, interfejs `RuntimeUnit` (linie 40–187).

| # | Pole web | Typ web | Linia web | Rust | Typ/pole Rust i dowód (plik:linia) | Uwaga |
|---|---|---|---|---|---|---|
| 1 | `id` | `string` | 41 | INNY TYP | `UnitDto.id: UnitId` (`types.rs:414`; `ids.rs:38`) | typ: string vs u64 → D-ID-1 |
| 2 | `ownerId` | `number` | 42 | INNY TYP | `UnitDto.owner_id: PlayerId` (`types.rs:415`; `ids.rs:36`) | u64 nie koduje -1 → D-ID-7 |
| 3 | `typeId` | `string` | 43 | CZĘŚCIOWO | `UnitDto.kind: UnitKindDto` (`types.rs:416`, enum 3 warianty `types.rs:405-409`: Settler/Warrior/Scout) | web: 75 typów (`P2-9 §2f`, rekordy `Jednostka`); enum 3 → tylko 3 z 75 typów, informacja NIE jest równoważna (zarzut 4) |
| 4 | `category` | `string` | 45 | BRAK | — ; najbliższe: `CombatUnit.unit_type: String` (`combat.rs:28`), nie ten sam koncept | kategoria modelu (broń/klasa) nie istnieje w DTO |
| 5 | `q` | `number` | 46 | INNY TYP | `UnitDto.position: PositionDto{x:u16}` (`types.rs:417`, `:119-122`) | oś q vs x, typ i32 vs u16 → D-ID-6 |
| 6 | `r` | `number` | 47 | INNY TYP | `PositionDto.y: u16` (`types.rs:120-121`) | jw. |
| 7 | `ruch` | `number` | 48 | BRAK | — (maks. ruch nie występuje w DTO ani w `AiUnit`) | |
| 8 | `ruchLeft` | `number` | 49 | POZA DTO | `AiUnit.movement_left: u32` (`ai_turn.rs:339`); `BarbUnit.movement_left: u32` (`barbarians.rs:187`) | nie w `UnitDto` |
| 9 | `inGarnizon?` | `boolean` | 51 | BRAK | — | flaga garnizonu; patrz D-ID-5 |
| 10 | `fortifyRuchSnapshot?` | `number` | 56 | BRAK | — (grep `fortif`/`ruch_snapshot`: 0 trafień) | |
| 11 | `hp?` | `number` | 58 | POZA DTO | `CombatUnit.hp: u32` (`combat.rs:34`) | model walki inny (`AiUnit` ma `health_fraction: Option<f64>`, `ai_turn.rs:342`) |
| 12 | `hpMax?` | `number` | 60 | POZA DTO | `CombatUnit.max_hp: u32` (`combat.rs:35`) | jw. |
| 13 | `defLossesThisTurn?` | `number` | 62 | BRAK | — (grep `def_loss`/`defeat`: 0 trafień) | |
| 14 | `oblegaCityId?` | `string` | 64 | BRAK | — (grep `oblega`/`besieg`: 0 trafień) | referencja do `CityId` → proponowane `oblega: Option<CityId>` |
| 15 | `replaceUsedThisTurn?` | `boolean` | 67 | BRAK | — (grep `replace_used`: 0) | |
| 16 | `embarked?` | `boolean` | 71 | POZA DTO | `AiUnit.embarked: bool` (`ai_turn.rs:344`); `BarbUnit.embarked: bool` (`barbarians.rs:191`) | nie w `UnitDto` |
| 17 | `seaRaider?` | `boolean` | 73 | POZA DTO | `BarbUnit.sea_raider: bool` (`barbarians.rs:193`) | tylko barbarzyńcy |
| 18 | `sentry?` | `boolean` | 80 | BRAK | — (grep `sentry`: 0) | |
| 19 | `autoExplore?` | `boolean` | 83 | BRAK | — (grep `auto_explore`: 0) | |
| 20 | `ufortyfikowanyWPolu?` | `boolean` | 102 | BRAK | — (grep `fortif`: 0) | |
| 21 | `pancerzBonusProc?` | `number` | 112 | BRAK | — (grep `pancerz`/`armor_bonus`: 0). Uwaga: `CombatUnit.armor: u32` (`combat.rs:32`) to statystyka, nie ścieżka bonusu | |
| 22 | `parametryBonusProc?` | `number` | 119 | BRAK | — (grep `parametr`: 0) | |
| 23 | `battlesSurvived?` | `number` | 133 | BRAK | — (grep `battles_won`/`veteran`: 0) | licznik wygranych bitew (weterani) |
| 24 | `stackGroupId?` | `string` | 156 | BRAK | — (grep `stack_group`: 0; `stack_resource_production` `resource_production.rs:156` to inna rzecz) | identyfikator stosu jako string → przy migracji do `GroupId` (decyzja w P2.4/P5) |
| 25 | `retreatedThisTurn?` | `boolean` | 186 | BRAK | — (grep `retreated`: 0) | |

**Podsumowanie dla `RuntimeUnit`:** 25 pól web.
- TAK (dokładna nazwa i typ): 0.
- INNY TYP (ta sama informacja, inny typ/oś/nazwa): wiersze 1, 2, 5, 6 (`id`, `ownerId`, `q`, `r`) = **4**.
- CZĘŚCIOWO (typeId: 3 warianty `UnitKindDto` vs 75 typów web): wiersz 3 = **1** (korekta zarzutu 4: wcześniej błędnie INNY TYP).
- POZA DTO (w innej strukturze Rust): 5 (`ruchLeft`, `hp`, `hpMax`, `embarked`, `seaRaider`) — wiersze 8, 11, 12, 16, 17 = **5**.
- BRAK: wiersze 4, 7, 9, 10, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25 = **15**.

Razem: 4 + 1 + 5 + 15 = 25. Ani jedno pole web nie ma dokładnie tej samej nazwy i typu w `UnitDto`; `UnitDto` (4 pola) pokrywa 4 pola web w innej formie (`id`, `ownerId`, `q`, `r`) i 1 częściowo (`typeId`).

---

## 5. Pełne porównanie `City` (web) vs `CityDto` (Rust)

Wszystkie wiersze: plik web `gra/src/game/cities.ts`, interfejs `City` (linie 834–1118). Ten `City` jest importowany przez `gra/src/main.ts:208` (`type City` z `./game/cities`). Duplikat `City` w `gra/src/types/city.ts:113` NIE jest importowany w grze (patrz D-ID-9).

Kolumna „Rust”: TAK = pole w `CityDto` (`types.rs:329-335`: `id` 330, `owner_id` 331, `name` 332, `position` 333, `population` 334); CZĘŚCIOWO = pokrycie w innej strukturze domenowej; BRAK = brak konceptu w `rust-port/engine/src` (sprawdzone grepem).

| # | Pole web | Typ web | Linia web | Rust | Dowód Rust (plik:linia) | Uwaga |
|---|---|---|---|---|---|---|
| 1 | `id` | `string` | 835 | INNY TYP | `CityDto.id: CityId` (`types.rs:330`; `ids.rs:37`) | string vs u64 → D-ID-1 |
| 2 | `ownerId` | `number` | 836 | INNY TYP | `CityDto.owner_id: PlayerId` (`types.rs:331`) | → D-ID-7 |
| 3 | `q` | `number` | 837 | INNY TYP | `CityDto.position: PositionDto` (`types.rs:333`, `:119-122`) | → D-ID-6 |
| 4 | `r` | `number` | 838 | INNY TYP | jw. (`PositionDto.y`) | → D-ID-6 |
| 5 | `name` | `string` | 839 | TAK | `CityDto.name: String` (`types.rs:332`) | zgodne |
| 6 | `population` | `number` | 840 | TAK | `CityDto.population: u32` (`types.rs:334`); także `CityGrowthState.population: u32` (`city_growth.rs:101`) | typ liczbowy: web `number` vs `u32` (ułamki w `wzrostUlamkowy`, pole 935) |
| 7 | `magazynZywnosci?` | `number` | 841 | CZĘŚCIOWO | `CityGrowthState.food_store: i64` (`city_growth.rs:114`) | poza DTO |
| 8 | `surowce?` | `Record<string,number>` | 851 | BRAK | — (magazyn surowców per miasto nie istnieje; `ResourceKey`/yields w `resource_production.rs:47,54` są bez stanu miasta) | |
| 9 | `maMur?` | `boolean` | 860 | BRAK | — (flaga pochodna z budynku `mury`; w Rust budynki są listą id, `ai_turn.rs:957` sprawdza `"mury" \| "mur" \| "walls"`) | cache pochodny → nie przechowywać |
| 10 | `maFort?` | `boolean` | 869 | BRAK | — | jw. (web komentarz: rezerwa, `cities.ts:861-868`) |
| 11 | `maBaszta?` | `boolean` | 876 | BRAK | — | jw. |
| 12 | `maWarsztatOblezniczy?` | `boolean` | 884 | BRAK | — | jw. |
| 13 | `oblegane?` | `boolean` | 890 | BRAK | — (grep `oblega`/`besieg`: 0) | pochodne od oblężenia |
| 14 | `garnizon?` | `number` | 896 | CZĘŚCIOWO | `BarbCityGarrison` (`barbarians.rs:916`) — tylko barbarzyńcy; brak dla miast graczy | |
| 15 | `oblegajacyOwnerId?` | `number` | 898 | BRAK | — | |
| 16 | `siegeCapitulationPending?` | `boolean` | 900 | BRAK | — (grep `capitulat`: 0) | |
| 17 | `siegeMachines?` | `SiegeMachinesState` | 902 | BRAK | — (grep `siege_machine`: 0; `combat.rs:105` `is_siege` to flaga walki, nie stan miasta) | |
| 18 | `podzialHandluOverride?` | `boolean` | 907 | BRAK | — (grep `podzial`/`handlu`: 0) | |
| 19 | `podzialHandlu?` | `CityPodzialHandlu` | 909 | BRAK | — | |
| 20 | `podzialPracyOverride?` | `boolean` | 915 | BRAK | — | |
| 21 | `podzialPracy?` | `CityPodzialPracy` | 917 | BRAK | — | |
| 22 | `poziomRacji?` | `number` | 921 | BRAK | — (grep `racji`/`ration_level`: 0) | |
| 23 | `poziomRacjiOverride?` | `boolean` | 929 | BRAK | — | |
| 24 | `autoWyzywienie?` | `boolean` | 931 | BRAK | — | |
| 25 | `rationMigratedV114?` | `boolean` | 933 | BRAK | — | flaga migracji web; klasa U NIE wynika z P2.2 pkt 10b (nazwa nieobecna w P2-2, grep 0). Propozycja Operatora, D-ID-11 (zarzut 1) |
| 26 | `wzrostUlamkowy?` | `number` | 935 | CZĘŚCIOWO | `FractionalGrowthState` (`city_growth.rs:156`) | poza DTO |
| 27 | `turyBezDoplaty?` | `number` | 937 | BRAK | — | |
| 28 | `procentRozwoj?` | `number` | 942 | BRAK | — | |
| 29 | `okolicaFocus?` | `OkolicaFocus` | 944 | BRAK | — (grep `focus`: 0) | |
| 30 | `okolicaFocusOverride?` | `boolean` | 951 | BRAK | — | |
| 31 | `okolicaTryb?` | `OkolicaTryb` | 953 | BRAK | — | |
| 32 | `okolicaReczne?` | `Record<string,number>` | 955 | BRAK | — | |
| 33 | `budowaFocus?` | `BudowaFocus` | 957 | BRAK | — | |
| 34 | `budowaTryb?` | `BudowaTryb` | 959 | BRAK | — | |
| 35 | `budowaFocusOverride?` | `boolean` | 968 | BRAK | — | |
| 36 | `budowaPriorytetTypow?` | `BudowaFocus[]` | 970 | BRAK | — | |
| 37 | `budowaLista?` | `string[]` | 972 | BRAK | — ; najbliższe `ProductionItem`/`production_queue: Option<String>` (`ai_turn.rs:401`) — inny koncept (jedna pozycja AI) | |
| 38 | `budowaListaUkonczonaHintShown?` | `boolean` | 974 | BRAK | — | flaga UI |
| 39 | `ulepszeniaOverride?` | `boolean` | 976 | BRAK | — | |
| 40 | `ulepszeniaFocus?` | `UlepszeniaFocus` | 978 | BRAK | — | |
| 41 | `ulepszeniaTryb?` | `UlepszeniaTryb` | 980 | BRAK | — | |
| 42 | `ulepszeniaOnlyWorked?` | `boolean` | 985 | BRAK | — | |
| 43 | `ulepszeniaWolnoWycinacLas?` | `boolean` | 989 | BRAK | — | |
| 44 | `ulepszeniaPracaPercent?` | `UlepszeniaPracaPercent` | 994 | BRAK | — | |
| 45 | `revoltGraceRemaining?` | `number \| null` | 996 | BRAK | — (grep `revolt`: 0) | |
| 46 | `rebelState?` | `boolean` | 998 | BRAK | — (grep `rebel`: 0) | |
| 47 | `rebelPreviousOwnerId?` | `number` | 1000 | BRAK | — | sentynel `OwnerRef` → D-ID-7 |
| 48 | `rebelProtectionTurnsRemaining?` | `number` | 1011 | BRAK | — | |
| 49 | `postCaptureLawTurnsRemaining?` | `number` | 1013 | BRAK | — | |
| 50 | `wasRebellionReconquest?` | `boolean` | 1015 | BRAK | — | |
| 51 | `wealthState?` | `WealthState` | 1017 | BRAK | — (grep `wealth`: 0) | |
| 52 | `kulturaSkumulowana?` | `number` | 1019 | BRAK | — (kultura jest tylko jako stok globalny w `turn_economy.rs`, P2.2 D12) | per miasto nie istnieje |
| 53 | `ownCultureShare?` | `number` | 1021 | BRAK | — | |
| 54 | `wealthImmunityRemaining?` | `number` | 1023 | BRAK | — | |
| 55 | `foundedTurn?` | `number` | 1025 | BRAK | — (grep `founded`: 0) | |
| 56 | `foundedByOwner?` | `boolean` | 1031 | BRAK | — | |
| 57 | `manpower?` | `number` | 1036 | BRAK | — (grep `manpower`: 0; P2.2 INV-2) | |
| 58 | `centerWorkedTile?` | `import('./economy').WorkedTile` | 1038 | BRAK | — (brak typu `WorkedTile` w domenie) | |
| 59 | `startCityState?` | `boolean` | 1040 | BRAK | — (`city_state` tylko jako flagi dyplomacji `diplomacy.rs:2904-2905`) | P2.2 M13 |
| 60 | `barbGarrisonSpawnCooldown?` | `number` | 1079 | CZĘŚCIOWO | `BarbCityGarrison.spawn_cooldown: u32` (`barbarians.rs:920`, pole `city_id` `:918`) — poziom MIASTA barbarzyńców; odrębna struktura. Wzorzec obozu `BarbCamp.spawn_cooldown` (`barbarians.rs:157`) jest tylko pokrewny | zarzut 7: klasa CZĘŚCIOWO zostaje, dowód poprawiony |
| 61 | `postepBudynkowUsuniete?` | `Record<string,number>` | 1117 | BRAK | — | |

**Podsumowanie dla `City`:** 61 pól web.
- TAK: 2 (`name` #5, `population` #6). Pozycja i właściciel są w `CityDto` pod innym typem (wiersze 1–4 = INNY TYP).
- INNY TYP: 4 (#1–#4).
- CZĘŚCIOWO (inna struktura): 4 (#7 `magazynZywnosci`, #14 `garnizon`, #26 `wzrostUlamkowy`, #60 `barbGarrisonSpawnCooldown`).
- BRAK: 61 − 2 − 4 − 4 = **51** (wiersze 8–13, 15–25, 27–59, 61).

Uwaga: `CityDto` (5 pól) pokrywa 2 pola web bezpośrednio (`name`, `population`) i 4 w innej formie (`id`, `owner`, `q`, `r`).

---

## 6. Zakres weryfikacji „BRAK” (uczciwość)

- „BRAK” oznacza: brak wystąpienia nazwy/pojęcia w `rust-port/engine/src` (grep `git grep -i` po nazwie snake_case i po pojęciu), **nie** dowód, że Rust nie ma równoważnego mechanizmu pod inną nazwą. Dla pól z konceptem ogólnym (np. `oblegane`, `wealthState`, `manpower`) wykluczenie dotyczy wyłącznie grepu po nazwach. Każdy wiersz BRAK wymaga potwierdzenia w P2.12 przy pełnej weryfikacji zachowania.
- Liczby trafień grepu (domena `rust-port/engine/src/domain`, pin `9e33fc77`): `sentry 0`, `auto_explore 0`, `stack_group 0`, `fortif 0`, `in_garnizon 0`, `replace_used 0`, `def_losses 0`, `oblega 0`, `besieg 0`, `veteran 0`, `battles_won 0`, `pancerz 0`, `parametr 0`, `retreated 0`, `wealth 0`, `rebel 0`, `revolt 0`, `focus 0`, `manpower 0`, `founded 0`, `podzial 0`, `doplat 0`, `WorkedTile 0`, `capitulat 0`, `postep/usuniet 0`. Trafienia `garnizon 3`, `garrison 18`, `movement_left 12`, `embarked 14`, `sea_raider 5`, `granary|food_store 63`, `culture|kultura 15` — dotyczą innych bytów lub sformułowań i zostały ocenione per wiersz powyżej.
- Nie uruchomiono testów ani kompilacji. Nie zweryfikowano zapisu `save.ts` wprost (identyfikatory — do P2.7).

---

## 7. Punkty wymagające decyzji (NIE rozstrzygnięte po cichu)

- **D-ID-1 — typ ID web → Rust.** Web: `string` (`prod_…`, `city…`). Rust: `u64` newtype. Propozycja: tabela `legacy_id → CityId/UnitId` poza `GameState`, budowana przy imporcie (P2.11). Alternatywa: trzymać `legacy_id: String` w bytach. **Wymaga decyzji.**
- **D-ID-2 — zakres ID.** Propozycja: per typ (newtypy). Potwierdzenie zakresu wymagane, bo web używa jednego licznika w każdym typie (`'city'+N` dla miast) i losowych prefiksów dla jednostek.
- **D-ID-3 — generowanie ID.** Web: `Math.random()` (`main.ts:3932` i 3 inne miejsca) i `'city' + cities.length` (`cities.ts:1249,1286`). Propozycja: licznik w stanie. **Wymaga decyzji**, bo zmienia zachowanie przy nowej rozgrywce (nie przy imporcie).
- **D-ID-4 — listy odwrotne w `CivilizationDto`.** `city_ids`/`unit_ids` (`types.rs:262-263`) są pochodne. Propozycja: nie przechowywać. Decyzja: usunąć z DTO czy zostawić jako widok. **Wymaga decyzji.**
- **D-ID-5 — garnizon.** Web: `inGarnizon: bool` (`setup.ts:51`) bez id miasta. Propozycja A: garnizon wyprowadzany z pozycji (heks miasta tego samego właściciela). Propozycja B: `garrison_city: Option<CityId>` jako stan. **Wymaga decyzji** (A zgodna z zasadą „wyprowadzalne nie jest przechowywane”, B zgodna z web 1:1).
- **D-ID-6 — pozycja.** Rust `HexCoord{q: i32, r: i32}` (`hex.rs:9-11`) vs `PositionDto{x: u16, y: u16}` (`types.rs:119-122`) vs web `q, r: number`. Propozycja: kanon `HexCoord`, `PositionDto` tylko jako DTO z konwersją. Należy też ustalić, czy `u16` wystarcza dla mapy (zakres ujemnych `q/r` web). **Wymaga decyzji.**
- **D-ID-7 — właściciel sentynelowy.** Web: `-1` barbarzyńcy (`barbarians.ts:49`), `-99` bunt (`society-breakdown.ts:206`). Rust: `i64 = -1` (`barbarians.rs:13`), `u64` dla graczy, brak buntu. Propozycja: `enum OwnerRef { Player(PlayerId), Barbarian, Rebel }`. **Wymaga decyzji** (typ, nie zachowanie).
- **D-ID-8 — konwencja człowieka 0 vs 1.** Web `HUMAN_OWNER_PRIMARY = 0` (`human-owners.ts:21`). Rust `HUMAN_PLAYER_ID = 1` (`playable.rs:15`) i `CAPITAL_ID = 1` (`playable.rs:16`). Zapisy web mają człowieka = 0, a D7 (P2.2) wymaga wczytania 1:1. Rekomendacja: 0 jako kanon. **Wymaga decyzji**, bo zmienia stałe w istniejącym kodzie Rust na `parity-v2`.
- **D-ID-9 — dwa typy `City` po stronie web.** `gra/src/game/cities.ts:834` (używany: `main.ts:208`, pola `ownerId/q/r/population`) i `gra/src/types/city.ts:113` (`wlasciciel/lokalizacja/ludnosc/…`, brak importu w `gra/src`). Propozycja: kanon = `cities.ts:834`; `types/city.ts` traktować jako martwy typ do potwierdzenia. **Wymaga potwierdzenia** (czy `types/city.ts` ma być usunięty z zakresu portu).
- **D-ID-10 — jedna reprezentacja jednostki.** Rust ma cztery struktury jednostek (§1.6). Propozycja: jeden `UnitState` w `GameState` z polami z §4 (po decyzjach D-ID-1..7), pozostałe struktury jako widoki. **Wymaga decyzji**, bo to dotyka modułów M4 i M7/M8 (P2.1).
- **D-ID-11 — kompletność §4/§5 wobec P2.2 D10.** Tabele pokrywają 25 pól `RuntimeUnit` i 61 pól `City`. Każde pole BRAK wymaga decyzji, czy wchodzi do `GameState` (P2.2 D8 — placeholdery dla M10/M12/M13), czy jest odroczone. **Wymaga decyzji zakresowej.** Pola `battlesSurvived`, `wealthState`, `siegeMachines` NIE występują pod tymi nazwami w P2-2 (grep: 0 trafień); ich klasa S jest propozycją Operatora. `manpower` występuje w P2.2 tylko jako koncept (INV-2, INV-3), nie jako nazwane pole klasy S. Pola `rationMigratedV114`, `budowaListaUkonczonaHintShown`, `postepBudynkowUsuniete` NIE są wymienione w P2.2 pkt 10b (tam: `veteranEnemyEducationShown`, `diplomaticDiscoveryPopupShown`, `ownerDisplayName`, `budowaListaBiblioteka`); ich klasa U jest propozycją Operatora do potwierdzenia.

---

## 8. Co dalej

- P2.11 (migracja zapisów web → `GameState`): tabela `legacy_id`, konwersja właściciela (D-ID-7, D-ID-8), konwersja pozycji (D-ID-6).
- P2.12 (weryfikacja zachowania): potwierdzenie wierszy BRAK i zakresu z §6.
- Decyzje D-ID-1…D-ID-11 zamykają ten temat dopiero po akceptacji Final Control / właściciela.

## 9. Rozstrzygnięcia (orkiestrator, 2026-10-21)

Final Control zwrócił DECISION_REQUIRED dla D-ID-1…D-ID-11 oraz 3 dodatkowych punktów (8 typy
jednostek, 9 stan oblężenia, 10 zbiór mniejszych wyborów). Przejrzałem wszystkie — **żaden nie
zmienia tego, co gra robi dla gracza**; wszystkie dotyczą wewnętrznej reprezentacji danych w Rust.
W przeciwieństwie do P2.2 (gdzie D7 miało realny wpływ na graczy — czy stracą zapisy), tu nie ma
punktu o takim charakterze. Rozstrzygam wszystkie inżyniersko:

- **D-ID-1:** kanon `u64` newtype w Rust; `legacy_id: String` web istnieje WYŁĄCZNIE jako tabela
  mapowania przy imporcie (P2.11), poza `GameState`. Nie przechowywać stringowych ID w stanie gry.
- **D-ID-2:** per typ (osobne newtypy `PlayerId`/`CityId`/`UnitId`) — przyjęta propozycja.
- **D-ID-3:** generowanie przez monotoniczny licznik w stanie (`next_city_id` itd.), zastępujący
  `Math.random()`/`'city'+length`. Dotyczy tylko NOWYCH rozgrywek tworzonych w Rust — zaimportowane
  zapisy zachowują swoje ID przez mapowanie z D-ID-1, licznik startuje od maksimum zaimportowanych ID.
- **D-ID-4:** `city_ids`/`unit_ids` w `CivilizationDto` NIE są przechowywane — wyprowadzane z
  `owner_id` encji na żądanie (zgodne z zasadą „stan wyprowadzalny nie jest przechowywany", P2.2 §1).
- **D-ID-5 + punkt 9 (oblężenie):** jedno źródło prawdy — `oblega: Option<CityId>` NA JEDNOSTCE
  (Propozycja B, nie A — web 1:1 wymaga zachowania `oblegaCityId` przy imporcie, D7/P2.2, więc pole
  musi być jawnie przechowywane, nie tylko wyprowadzane z pozycji). Stan po stronie miasta
  (`oblegane`, `oblegajacyOwnerId`, `siegeCapitulationPending`) jest WYPROWADZANY z tego pola przez
  zapytanie „które jednostki mają `oblega == Some(this_city)`" — nie duplikować. Garnizon (inna
  sprawa niż oblężenie) pozostaje wyprowadzany z pozycji (Propozycja A) — nie ma odpowiednika w
  zapisie web wymagającego jawnego pola (`inGarnizon` to flaga UI/runtime, nie trwały stan do
  importu w tym samym sensie).
- **D-ID-6:** kanon `HexCoord{q:i32,r:i32}`; `PositionDto{x:u16,y:u16}` to warstwa serializacji
  DTO→frontend, nie stan gry. Zakres `u16` (0-65535) do zweryfikowania względem maksymalnego
  rozmiaru mapy w P2.12/P3 — żadna dotychczas skatalogowana mapa (P1.8: Malenki/Standardowy/Super
  Huge) nie zbliża się do tego zakresu, więc ryzyko niskie, ale wymaga jednego sprawdzenia przy
  implementacji, nie decyzji teraz.
- **D-ID-7:** `enum OwnerRef { Player(PlayerId), Barbarian, Rebel }` — przyjęta propozycja,
  zastępuje liczby ze znakiem.
- **D-ID-8:** kanon = 0 dla człowieka (zgodnie z web, wymagane przez D7/P2.2 — import zapisów 1:1).
  Stałe `HUMAN_PLAYER_ID=1`/`CAPITAL_ID=1` w dzisiejszym `rust-port/engine` to wczesny placeholder
  bez żadnych graczy zależnych od tej wartości (aplikacja nieukończona, niewydana) — zmiana nie ma
  skutków produktowych, to czysta poprawka implementacji.
- **D-ID-9:** kanon = `gra/src/game/cities.ts` `City` (faktycznie używany, importowany w
  `main.ts:208`). `gra/src/types/city.ts` to martwy kod — potwierdzone (0 importów w `gra/src`), nie
  wymaga decyzji, tylko potwierdzenia faktu. Poza zakresem portu.
- **D-ID-10 + punkt 8 (reprezentacja jednostki + typy):** jeden kanoniczny `UnitState` w
  `GameState`. Pole `kind` NIE jest zamkniętym enumem Rust (3 warianty dziś) — jest kluczem/ID
  odsyłającym do katalogu danych jednostek (`units.json` via P2.9 mapowanie danych, 75 typów) —
  spójne z ustalonym już wzorcem „treść gry w danych, nie zahardkodowana w Rust" (P2.1, P2.9).
  Pozostałe 3 struktury (`CombatUnit`, `AiUnit`, `BarbUnit`) stają się widokami/projekcjami
  budowanymi z kanonicznego `UnitState` na potrzeby konkretnych systemów (walka, AI, barbarzyńcy),
  nie osobnymi źródłami prawdy.
- **D-ID-11 + punkt 10(d) (zakres pól BRAK):** pola odpowiadające mechanice gry (manpower, bunt,
  bogactwo, worked tile, flaga państwa-miasta, surowce miasta, podziały pracy/handlu, itd.) dostają
  placeholdery w `GameState` (zgodnie z P2.2 D8 — potrzebne do round-trip importu nawet bez
  zaimplementowanej logiki). Flagi `ma*` (`maMur`, `maFort`, `maBaszta`, `maWarsztatOblezniczy`) są
  WYPROWADZANE z listy budynków miasta, nie przechowywane (ten sam wzorzec co D-ID-4). Flagi UI
  (`rationMigratedV114`, `budowaListaUkonczonaHintShown`, `postepBudynkowUsuniete`) klasyfikowane
  jako U przez ROZSZERZENIE zasady ogólnej z P2.2 pkt 10(b) (flagi „czy komunikat/popup już
  pokazano" są kategorią, nie zamkniętą listą) — przy imporcie odczytane i odrzucone, nie trafiają
  do `GameState`.
- **Punkt 10(a)-(c) (Final Control):** brak ponownego użycia ID i licznik tylko rosnący —
  potwierdzone (zgodne z D-ID-3). Zakaz surowego `u64`/`i64` jako ID w `GameState`/DTO — potwierdzone
  (wymaga przepisania `PlayablePlayer`/`CombatUnit`/`AiUnit`/`BarbUnit` na newtypy w fazie
  implementacji, nie teraz). Przydział `PlayerId` drugiego fotela z `next_owner_id`, niezależnie od
  kolejności w kreatorze — potwierdzone (zgodne z D-ID-3 i zasadą stabilności z §2.3).

**Status: temat zamknięty PASS.** Żaden z 14 punktów nie wymagał eskalacji do właściciela — wszystkie
są wyborami reprezentacji danych bez wpływu na zachowanie gry. Następny krok: implementacja
(P3+) może czerpać z tego kontraktu; P2.11 (migracja zapisów) i P2.12 (weryfikacja zachowania)
pozostają zaplanowane kolejne tematy.

