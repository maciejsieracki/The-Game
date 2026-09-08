# R-HOTSEAT-ETAP6F-RECON-START-Q1 — Operator, runda 1

## 0. Stan poprzedzający (weryfikacja przed pisaniem)

- `origin/main` @ `48a79940` = ten sam commit co HEAD tego worktree (dispatch). Etap 1
  (`R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1`) jest ZINTEGROWANY: `gra/src/game/human-owners.ts`
  istnieje, `humanSeats`/`isAiOwner`/`HUMAN_OWNER_PRIMARY` żywe w `main.ts` (10370, 11022,
  22338, 22417, 29622 i in.). **Sprawdzone jawnie**: `fillAiOwnerCivMap` (7516-7560) i
  `applyClusterStartPlan` (8420-8450) — ŻADNE z nich nie używa `humanSeats`/`isAiOwner` —
  wciąż czysty wzorzec `ownerId === 0`/`_menuCivId`.
  **KOREKTA (Obrona runda 1, po zarzucie 2 Evaluatora):** twierdzenie "zero nakładania
  Etapu 1" powyżej było fałszywe dla całej kategorii — sprawdzono tylko 2 z 3 funkcji
  o identycznym celu. Trzecia, `restoreAiRosterFromSave` (main.ts:7538-7574, pominięta w
  pierwszym przebiegu — patrz §1 niżej), zawiera na **main.ts:7570** żywe wywołanie
  `isAiOwner(humanSeats, c.ownerId)` (świeży `grep -n "isAiOwner(humanSeats" gra/src/main.ts`
  → trafienie na 7570 wewnątrz zakresu funkcji 7538-7574). To jest realne nakładanie Etapu 1
  na kategorię "start/civ": ścieżka load-sejwu legacy używa dziś `humanSeats`/`isAiOwner` przy
  odtwarzaniu `ownerDisplayName`, więc plan migracji (i) w §3 musi to uwzględnić (funkcja już
  częściowo "rozumie" wielu ludzi po stronie etykiet, mimo że civ-roster nadal liczy jeden
  `playerCivId`).
- Worktree równoległy `/home/user/wt-hotseat-etap6a-input` ISTNIEJE, branch
  `autobot/R-HOTSEAT-ETAP6A-INPUT-Q1` (NIEZINTEGROWANY z main), commit `621f353a`
  (42 miejsca input→isMe/ME()) + **1 linia niezacommitowana** w `main.ts:26304`
  (`checkBarbCampDestroyedAt(...)` → `NOOP_MUTATION_PLACEHOLDER_RUNDA3()`, ślad narzędzia
  mutation-testing, niezwiązany z hot-seat/kategorią start — odnotowuję jako anomalię dla
  orkiestratora, poza zakresem tej rundy). `grep` w tym worktree na `_menuCivId|playerStartHex|
  fillAiOwnerCivMap|applyClusterStartPlan|applyMenuParams` → 68 trafień, ALE żadne nie leży w
  diffie 6a (diff = wyłącznie linia 26304) — zero nakładania kategorii "input" na "start".
- Znaleziono `main.ts:22611 window.__hotSeatTestDebug.seedSecondSeat` (hak z Etapu 5) z
  komentarzem wprost: „dopóki Etap 7 (drugi fotel w kreatorze) nie istnieje" — potwierdza
  niezależnie, że realny drugi wybór cywilizacji w menu jest dziś zerowy (tylko testowy hak).

## 1. Świeży inwentarz (grep + `Read`, dzisiejsze linie)

Zakres ograniczony do 3 plików wskazanych w dispatchu: `main.ts`, `ui/newGameFlow.ts`,
`game/cluster-start.ts`. Wykluczyłem świadomie funkcje-rezolwery czytające
`player.civType || _menuCivId` jako fallback wewnątrz UŻ zainwentaryzowanych gdzie indziej
mechanizmów (np. `civTypeForOwner` @main.ts:3430 i `civDisplayNameForOwner`/
`portraitForceCultureIcon` @~8072-8090 — dosłownie te same linie co w
`R-HOTSEAT-ETAP6E-RECON-RENDER-Q1/01-operator-runda1.md` sekcja 3A; podobnie battle-preview
`defCivId` @27989 — ten sam wzorzec render, nie "start"). Policzone narzędziem
(`python3`, lista linii wklejona, bez liczenia z pamięci):

**KOREKTA (Obrona runda 1, po zarzutach 1/3 Evaluatora):** pierwszy przebieg pominął
`restoreAiRosterFromSave` (main.ts:7538-7574) — trzecie (obok `fillAiOwnerCivMap` i
`repairAiRosterFromMap`) wołanie `assignAiCivTypes` o identycznym celu "wyklucz civ gracza
z puli AI". Świeże `grep -n "assignAiCivTypes(" gra/src/main.ts` → dokładnie 3 trafienia:
2139, 7524, 7555 — drugie z nich leży wewnątrz `fillAiOwnerCivMap`, trzecie wewnątrz
`restoreAiRosterFromSave`. Dodatkowo linia `7557` w poprzednim przebiegu była błędnie
przypisana do bucketu `fillAiOwnerCivMap` jako "call site" — fizycznie leży w
`restoreAiRosterFromSave` (zakres 7538-7574). Prawdziwy drugi call site
`fillAiOwnerCivMap(...)` to `main.ts:34041` (`grep -n "fillAiOwnerCivMap("` → 7516 [def],
10552, 34041), a bezpośrednio po nim log `console.log(...)` na `34042`. Tabela i rozbicie
niżej są poprawione o oba efekty.

| Plik | Trafień |
|---|---|
| `main.ts` | 53 |
| `ui/newGameFlow.ts` | 6 |
| `game/cluster-start.ts` | 4 |
| **SUMA** | **63** |

Rozbicie `main.ts` wg mechanizmu (linie, komentarze wykluczone):
- `_menuCivId`/`applyMenuParams` (deklaracja, przypisanie, 6 wywołań, gałęzie
  `player.civType=`): 1627, 33931, 33983, 33986, 34041, 34345, 34434, 34661, 34769, 35019,
  35240, 35518 — **12**
- `fillAiOwnerCivMap` (def + param użycia + 2 realne call site'y + log): 7516, 7526, 10552,
  34041, 34042 — 5 linii mechanizmu, ale `34041` jest FIZYCZNIE tą samą linią co jedno z 12
  wołań `_menuCivId`/`applyMenuParams` powyżej (`fillAiOwnerCivMap(_menuCivId, _gameSeed)` —
  jedno wyrażenie spełnia oba kryteria grepa). Wkład unikalny do sumy `main.ts`: **4**
  (7516, 7526, 10552, 34042 — bez ponownego liczenia 34041, już policzonej w bucketcie
  wyżej). **Ta korekta poprawia błąd rachunkowy popełniony przeze mnie przy pierwszym
  przebiegu tej Obrony** (patrz arytmetyka `python3` niżej — pierwsza wersja sumowała
  12+5+…=54, co dublowało linię 34041; poprawne unikalne sumowanie zbiorów linii daje 53).
- `applyClusterStartPlan` (def + param + call wew. + log + call site): 8420, 8421, 8430, 8444,
  8550 — **5**
- `playerStartHex` (deklaracja + przypisanie + 8 konsumentów: fog×2, kamera×2, serializacja
  zapisu, `foundPlayerStartCity`×2): 2509, 9670, 9771, 9772, 9809, 9810, 12520, 12521, 22576,
  22606, 22607 — **11**
- Literalne wejścia New Game z twardym `civId:'rzymianie'`/`civName:'Rzymianie'` (5 miejsc ×
  2-3 linie, zakresy `python3`-policzone: 22544-22545, 22809-22810, 34739-34740, 35019-35021,
  35240-35242 = 12 linii surowo): 22544, 22545, 22809, 22810, 34739, 34740, 35020, 35021,
  35241, 35242 — **10** (po odjęciu 2 linii nakładających się z bucketem `applyMenuParams`
  powyżej: `35019` i `35240` już policzone tam).
- `newGameParamsForLoad` (rekonstrukcja `civId` z zapisu): 34242, 34250, 34256, 34257 — **4**
- `repairAiRosterFromMap` (`playerCivId: civId` wykluczający cywilizację gracza przy
  naprawie rosteru AI, ten sam cel co `fillAiOwnerCivMap`): 2141 — **1**
- **`restoreAiRosterFromSave` — DODANE w Obronie runda 1** (trzecie wywołanie
  `assignAiCivTypes`, wyklucza civ gracza z puli AI przy odtwarzaniu rosteru z sejwu legacy
  bez zapisanego `meta.aiOwnerCivMap`): def `7538`, hardkodowany filtr właściciela-gracza
  `.filter(id => id !== 0)` `7549`, fallback civ pojedynczy `player.civType || _menuCivId ||
  'grecy'` `7550`, wywołanie `assignAiCivTypes` `7555`, param `playerCivId: civId` `7557`,
  call site `restoreAiRosterFromSave(saved)` `36058` — **6**.

Świeża arytmetyka sumy `main.ts`, policzona jako suma ZBIORU unikalnych linii (nie suma
długości bucketów — te celowo nakładają się przy opisie mechanizmu, np. `34041` należy
opisowo i do `_menuCivId`/`applyMenuParams`, i do `fillAiOwnerCivMap`):

```
python3 -c "
menu=[1627,33931,33983,33986,34041,34345,34434,34661,34769,35019,35240,35518]
fill=[7516,7526,10552,34041,34042]
cluster=[8420,8421,8430,8444,8550]
start=[2509,9670,9771,9772,9809,9810,12520,12521,22576,22606,22607]
literal=set()
for a,b in [(22544,22545),(22809,22810),(34739,34740),(35019,35021),(35240,35242)]:
    literal |= set(range(a,b+1))
loadparams=[34242,34250,34256,34257]
repair=[2141]
restore=[7538,7549,7550,7555,7557,36058]
all_lines=set()
for lst in (menu,fill,cluster,start,literal,loadparams,repair,restore):
    all_lines |= set(lst)
print(len(all_lines))
"
```
→ **53**. Zgadza się z tabelą wyżej.

`ui/newGameFlow.ts` (86-87 `civId`/`civName` w `NewGameParams`, 136 `selectedAiCivIds`
jako wzorzec, 1561-1562/1590 budowa obiektu w kreatorze) — **6**.
`game/cluster-start.ts` (24 `playerStartHex`, 53 `playerCivId` w interfejsach — **te same
numery co w planie sprzed miesięcy**, ten mały plik się nie przesunął; 77/111 użycia) — **4**.

SUMA: `python3 -c "print(53+6+4)"` → **63**.

## 2. Korekta liczby "~15"

**63 ≠ ~15.** Ten sam wzorzec niedoszacowania co w Etapach 6a-6e: plan wymieniał ~7 punktów
kotwiczących (nazwy funkcji/pól), nie każde miejsce KONSUMUJĄCE je. Rzeczywista liczba jest
~4.2× wyższa (63/15 policzone `python3 -c "print(63/15)"` → 4.2). **KOREKTA (Obrona runda 1):**
poprzednia wersja podawała tu 57 i mnożnik 3.8 — po dodaniu pominiętej `restoreAiRosterFromSave`
(zarzut 1 Evaluatora, §1 wyżej) suma main.ts rośnie z 47 do 53, a suma całkowita z 57 do 63.

## 3. Migracja (i) vs nowa funkcjonalność (ii) — jawny podział

**(i) PROSTA MIGRACJA** (3 miejsca — **KOREKTA Obrona runda 1: było 2, brakowało
`restoreAiRosterFromSave`, zarzuty 1/5 Evaluatora** —, wzorzec „musi wykluczać obu ludzi",
analogia `selectedAiCivIds`; razem 11 unikalnych linii z sumy §1: 4 z `fillAiOwnerCivMap` +
1 z `repairAiRosterFromMap` + 6 z `restoreAiRosterFromSave`):
- `fillAiOwnerCivMap(playerCivId, seed)` (def 7516, wywołania 10552/34041) — param
  `playerCivId: string` → `excludedCivIds: readonly string[]` (civ każdego z
  `humanSeats.humanOwnerIds`); wewnątrz `assignAiCivTypes` filtr `allCivIds` musi wykluczyć
  WSZYSTKIE, nie jedną.
- `repairAiRosterFromMap` (2131-2145, `playerCivId: civId` @2141) — identyczny cel, ten sam
  zabieg.
- **`restoreAiRosterFromSave` (7538-7574, DODANE w Obronie runda 1)** — ścieżka legacy-save
  (brak `meta.aiOwnerCivMap`): fallback `civId = player.civType || _menuCivId || 'grecy'`
  (@7550, pojedynczy) przekazany jako `playerCivId: civId` do `assignAiCivTypes` (@7555/7557)
  wymaga tej samej zmiany sygnatury co `fillAiOwnerCivMap` — `excludedCivIds` zamiast
  pojedynczego civ. Dodatkowo @7570 żywe `isAiOwner(humanSeats, c.ownerId)` przy odtwarzaniu
  `ownerDisplayName` — TU już częściowo "rozumie" wielu ludzi (Etap 1), więc migracja civ-
  rosteru w tej funkcji nie jest całkowicie no-op na poziomie CAŁEJ funkcji, tylko na
  poziomie samego wywołania `assignAiCivTypes` (linie 7549-7550/7555/7557) — pozostała część
  funkcji (7566-7573) już jest per-human i nie wymaga zmian.

Dowód no-op (i), rozszerzony na wszystkie 3 funkcje: w single-player `humanSeats.humanOwnerIds
= [0]` → lista wykluczeń ma długość 1, identyczna z dzisiejszym `playerCivId: string` — zero
zmiany zachowania dla `fillAiOwnerCivMap` i `repairAiRosterFromMap`; dla
`restoreAiRosterFromSave` dodatkowo: `civId = player.civType || _menuCivId || 'grecy'` przy
jednym graczu daje identyczną listę wykluczeń `[civId]` jak dziś — sama ścieżka `savedRoster`
(gdy `meta.aiOwnerCivMap` istnieje, główny przypadek dla zapisów już-hot-seat) w ogóle nie
dotyka `assignAiCivTypes`, więc no-op tam jest trywialny z definicji. Test: `node
./node_modules/typescript/bin/tsc --noEmit` (typy) + istniejąca bramka
`tools/hotseat-etap5-no-leak-test.cjs` uruchomiona bez modyfikacji (regresja) + ręczne 20 tur
z `humanOwnerIds=[0]`, porównanie `aiOwnerCivMap` przed/po (musi być identyczna mapa dla tego
samego seeda) + dodatkowo dla `restoreAiRosterFromSave`: 1 legacy-save (bez `meta.aiOwnerCivMap`)
wczytany przed/po zmianie, porównanie odtworzonego rosteru.

**(ii) NOWA FUNKCJONALNOŚĆ** (52 miejsca — **KOREKTA Obrona runda 1**: było 54; po dodaniu
`restoreAiRosterFromSave` do (i) i przeliczeniu sumy głównej na 63, `ii = 63 - 11 = 52`) —
dziś struktury z natury pojedyncze, brak zachowania do porównania (no-op nie ma sensu, zgodnie
z regułą dispatchu):
- `ui/newGameFlow.ts:86-87` `NewGameParams.civId/civName` — pojedyncze pola. Trzeba: drugi
  wybór w kreatorze (ekran/krok UI — poza zakresem recon) + nowe pole, wzorem `136
  selectedAiCivIds?: string[]` — analogicznie `humanCivIds: string[]` (2 elementy w hot-seat,
  1 w single) zamiast rozdzielnych `civId`/`civId2`.
- `main.ts:1627` `_menuCivId: string` — zmienna modułu, singularna. Potrzeba: `_menuCivIds:
  string[]` LUB `Map<ownerId, civId>` równoległe do `humanSeats.humanOwnerIds` (wzorzec
  identyczny jak `playerStateByHuman`/`exploredByHuman` już istniejące od Etapu 1 — NIE
  wymyślam nowego kształtu, powielam istniejący `Map<number, X>` per-human).
- `main.ts:33931-34022 applyMenuParams` — dziś jedno przypisanie `player.civType =
  _menuCivId`; z hot-seat: pętla po `params.humanCivIds`/`humanSeats.humanOwnerIds`,
  zapisująca civ każdego fotela do odpowiadającego `playerStateByHuman.get(ownerId)`.
- `main.ts:2509/8444` + `cluster-start.ts:24/111` `playerStartHex` — jeden heks. Potrzeba:
  `playerStartHexByHuman: Map<number, {q,r}>` (ten sam wzorzec Map-per-human) LUB rozszerzenie
  `ClusterStartPlan.playerStartHex` na `playerStartHexes: Map<number,{q,r}>`; mapgen
  (`buildClusterSpawnPlan`, poza wskazanymi plikami, głębiej w `map/cluster-spawn.ts` —
  odnotowuję jako kolejną warstwę, NIE w zakresie tego recon) musi umieć zarezerwować DWA
  hexy startowe zamiast jednego.
- 8 konsumentów `playerStartHex` (fog×2 @9771-9810, kamera×2 @12520-12521, serializacja
  zapisu @22576, `foundPlayerStartCity`×2 @22606-22607) — każdy dziś odnosi się do
  JEDNEGO heksu; po zmianie na Map muszą przyjąć `ownerId`/`ME()` jako klucz (fog/kamera już
  używają `ME()`/`HUMAN_OWNER_PRIMARY` w sąsiedztwie — patrz komentarz @9760-9768 — więc to
  rozszerzenie istniejącego guard-a, nie projekt od zera).
- 5 literalnych wejść `civId:'rzymianie', civName:'Rzymianie'` (22544, 22809, 34739, 35019,
  35240) — dev/testowe/quick-start ścieżki tworzące `NewGameParams` z jedną cywilizacją
  na sztywno; każde wymaga decyzji: czy hot-seat ma tam DRUGI sztywny wybór (np.
  `'grecy'`), czy te ścieżki zostają single-seat-only (ABC do rozstrzygnięcia przy
  implementacji, nie recon).
- `newGameParamsForLoad` (34239-34257) — rekonstruuje `NewGameParams` z metadanych zapisu;
  zgodnie z ABC-4 (v3 bez migracji) zapis hot-seat i tak nie wczyta się jako v2, ale przy
  wczytywaniu zapisu v3 (już hot-seat) trzeba odtworzyć `humanCivIds`, nie jeden `civId`.

## 4. Wynik (poprawiony w Obronie, runda 1, po 5 zarzutach Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6F-RECON-START-Q1
GOAL: Recon kategorii "start gry/wybór cywilizacji" (6/6, ostatni pod-etap Etapu 6).
ZMIANY/COMMIT: Ten dokument, poprawiony w tej samej rundzie po Obronie (docs-only, zero
zmian w `gra/`): dodano pominiętą `restoreAiRosterFromSave` do inwentarza §1 i kategorii
migracji (i) §3, skorygowano fałszywe "zero nakładania Etapu 1" w §0, naprawiono błędną
atrybucję linii 7557 (należy do `restoreAiRosterFromSave`, nie `fillAiOwnerCivMap`) i log
`fillAiOwnerCivMap` (34042, nie 7557), przeliczono narzędziem (`python3`, sumowanie zbioru
unikalnych linii — nie sumy bucketów) sumę main.ts 47→53 i sumę całkowitą 57→63, poprawiono
mnożnik niedoszacowania 3.8×→4.2×, przeliczono podział (i)/(ii) na 3/52 miejsca (11+52=63).
TESTY: Brak (recon) — plan dowodu no-op opisany §3 rozszerzony na 3 funkcje (w tym
`restoreAiRosterFromSave`, z dodatkowym testem legacy-save); brak testu dla części (ii),
zgodnie z regułą dispatchu (nowa funkcjonalność bez istniejącego zachowania).
BLOKADY: 1 ABC do rozstrzygnięcia przy implementacji (§3, dev/quick-start ścieżki: drugi
sztywny civ czy single-seat-only) — nie blokuje zamknięcia recon.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja poprawek z tej Obrony (§0, §1, §2, §3).
DEPLOY/PUSH: NIE WYKONANO
