# R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1 — Operator, runda 1

## 0. Stan poprzedzający

`git log -1 -- gra/src/main.ts` → `93fd6ffb` ("Etap 5 hot-seat: switchActiveHuman()...").
Etapy 0/1/2/3/5 zintegrowane i żywe: `human-owners.ts`, `humanSeats`, `isAiOwner`,
`exploredByHuman: Map<number, Set<string>>` (main.ts:10393), `playerStateByHuman:
Map<number, PlayerState>` (10405), `switchActiveHuman()` (10420+). Wszystkie numery
niżej świeżo zweryfikowane `Read`/`grep` w tym worktree — numery z planu (`26713`,
`26754`, `26846`, `34131`, `34249-34251`, `34687`) są **martwe** (main.ts urósł/przesunął
się od czasu pisania planu); realne miejsca podane niżej.

## 1. ABC-4 — cytat i konsekwencja dla projektu

`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md:12-19`: *„Zapis dostaje wersję v3 i stare zapisy
przestają działać. […] Etap 7 NIE pisze funkcji migrującej v2→v3 […]. Ma za to jasno
komunikować użytkownikowi, że zapis jest w starym formacie, zamiast wywalać się po cichu
albo wczytywać śmieci."* — wiążące. Tabela §C wiersz 7 ("roundtrip; stary sejw v2 wczytuje
się bez zmian") jest przestarzała i **odrzucona** zgodnie z dispatchem. Projekt niżej jest
w całości zgodny z ABC-4: brak migracji, twardy błąd czytelny dla użytkownika.

## 2. Świeży inwentarz `buildSaveGameSnapshot()`/restore

`buildSaveGameSnapshot()` def. `main.ts:28256`. Pola dot. hot-seatu:
- `wersja: 2` (literał, `28290`) — do zmiany na `SAVE_VERSION` (bump 2→3).
- `explored: Array.from(explored)` (`28295`) — **jeden globalny `Set`**, TYLKO gracz 0.
  Wymaga rozszerzenia na `exploredByHuman`.
- `gracz: { skarbiec, nauka, era, zbadane, badana, researchQueue, tempoGry,
  buildingCostPace, kosztJednostekPace, wzrostLudnosciPace, ruchSwiataPace }`
  (`28298-28310`) — **jeden obiekt `player`**, TYLKO gracz 0. Wymaga `gracze[]`.
- `humanSeats`/`exploredByHuman`/`playerStateByHuman` — **grep potwierdza zero wystąpień
  wewnątrz `buildSaveGameSnapshot`** (`sed -n '28256,28470p'` przeszukane, brak trafień) —
  to jest dokładnie luka do zamknięcia.

Restore: `restoreGameFromSave()` def. `main.ts:35646`. `explored` odtwarzane `35766: for
(const k of saved.explored ?? []) explored.add(k)`; `gracz` odtwarzany `35768-35786:
player.skarbiec = saved.gracz.skarbiec ...` itd. — zapis wprost do zmiennych modułu
`explored`/`player`, **nie** do `exploredByHuman`/`playerStateByHuman`.

**Ważna własność runtime, potwierdzona `Read` linii `10393`/`10405`:** `exploredByHuman =
new Map([[HUMAN_OWNER_PRIMARY, explored]])` i `playerStateByHuman = new Map([[
HUMAN_OWNER_PRIMARY, player]])` — to jest **ten sam obiekt** (alias), nie kopia. Dlatego
dzisiejsze `explored.add(k)`/`player.skarbiec = ...` w restore **już pośrednio** aktualizują
wpis gracza 0 w obu mapach `ByHuman` — single-player restore jest więc *dziś* przypadkowo
spójny z modelem per-human. To ułatwia projekt no-op (§6): pętla `for (ownerId of
humanOwnerIds)` przy `humanOwnerIds=[0]` operująca na `exploredByHuman.get(0)`/
`playerStateByHuman.get(0)` da IDENTYCZNY efekt uboczny na `explored`/`player`, bo to te
same referencje.

## 3. Bug `aiSkarbiecByOwner`/`aiNaukaPoolByOwner` — **JUŻ NAPRAWIONY, nie dotyczy dziś**

Dowód kodowy (nie domysł z planu): zapis `main.ts:28389 aiSkarbiecByOwner:
Array.from(aiSkarbiecByOwner.entries())` i `28392 aiNaukaPoolByOwner:
Array.from(aiNaukaPoolByOwner.entries())` — OBA pola SĄ serializowane, z komentarzem
wprost `// Audyt #44: aiSkarbiecByOwner nie bylo w snapshotcie -- czyszczone przy load bez
odtworzenia`. Restore: `36282-36289` — po `aiSkarbiecByOwner.clear()` następuje pętla
odtwarzająca z `saved.meta?.aiSkarbiecByOwner`; symetrycznie `35896-35899` dla
`aiNaukaPoolByOwner`. Czyli komentarz w planie (`main.ts:26846`, „nie są serializowane")
opisuje stan **SPRZED** naprawy Audytu #44 — plan nie został zaktualizowany po tej
naprawie. **Wniosek: bug NIE jest dziś aktywny ani w single-player, ani potencjalnie w
hot-seat** — obie mapy (`Map<number, X>`, per-owner z natury) są już w pełni okrężne
(save→clear→restore) dla KAŻDEGO ownerId, AI czy człowiek. Etap 7 **nie ma tu nic do
naprawy** — jedyne zadanie to potwierdzić w implementacji, że drugi człowiek (dodatni
owner) korzysta z TEJ SAMEJ ścieżki co dziś AI-ownerzy (już działa, bo `isHuman(ownerId) ?
playerStateByHuman.get(ownerId)!.skarbiec : aiSkarbiecByOwner.get(ownerId)` — akcesor
`main.ts:26481` już przełącza na `playerStateByHuman`, a TO pole właśnie zyskuje
serializację w tym etapie w §4 niżej). Dispatch pkt 2 rozstrzygnięty: **luka nie istnieje
jako osobny temat ABC** — plan wymaga tylko korekty (odnotowania, że opis jest
nieaktualny), nie osobnego zgłoszenia bugu.

## 4. Projekt kształtu v3 (kontrakt, bez implementacji)

```ts
// game/save.ts — SaveGame v3 (fragment; pola bez zmian pominięte)
// Importy typów pace z modułów źródłowych (nie duplikaty) — zgodnie z
// game/playerState.ts:114-128 i building-cost-tempo.ts/unit-cost-tempo.ts/
// population-growth-tempo.ts/ruch-swiata-tempo.ts (string-union, nie number).
import type { BuildingCostPace } from './building-cost-tempo';
import type { KosztJednostekPace } from './unit-cost-tempo';
import type { WzrostLudnosciPace } from './population-growth-tempo';
import type { RuchSwiataPace } from './ruch-swiata-tempo';

export const SAVE_VERSION = 3; // z 2

export interface GraczSaveV3 {
  skarbiec: number;
  nauka: number;
  era: number;
  zbadane: string[];
  badana: string | null;
  researchQueue: string[];
  tempoGry: string;
  buildingCostPace: BuildingCostPace;
  kosztJednostekPace: KosztJednostekPace;
  wzrostLudnosciPace: WzrostLudnosciPace;
  ruchSwiataPace: RuchSwiataPace;
}

export interface SaveGame {
  wersja: number; // 3
  // ... pola bez zmian (units, cities, cityProd, ...) ...

  /** v3: lista per-human, klucz = ownerId. Zastępuje `gracz`. */
  gracze: Array<[number, GraczSaveV3]>;
  /** v3: mgła wojny per-human. Zastępuje `explored`. */
  exploredByHuman: Array<[number, string[]]>;
  /** v3: fotele ludzkie — z HumanSeats. */
  humanOwnerIds: number[];
  activeHumanOwnerId: number;

  /** @deprecated pola v2, USUNIĘTE z zapisu v3 (nie wypisywane przez serializeGame v3).
   *  Zostają w typie jako opcjonalne WYŁĄCZNIE po to, by kod odczytujący stary JSON
   *  (przed odrzuceniem w deserializeGame, patrz §5) się kompilował — deserializeGame
   *  rzuca ZANIM którykolwiek konsument przeczyta te pola z obiektu v2. */
  gracz?: any;
  explored?: string[];
}
```

Przykładowy JSON (hot-seat, 2 ludzi, ownerId 0 i 3):
```json
{
  "wersja": 3,
  "humanOwnerIds": [0, 3],
  "activeHumanOwnerId": 3,
  "gracze": [
    [0, { "skarbiec": 120, "nauka": 40, "era": 2, "zbadane": ["kolo"], "badana": null,
          "researchQueue": [], "tempoGry": "standardowa", "buildingCostPace": "niski",
          "kosztJednostekPace": "niski", "wzrostLudnosciPace": "wysoki", "ruchSwiataPace": "krotki" }],
    [3, { "skarbiec": 80,  "nauka": 15, "era": 1, "zbadane": [], "badana": "pismo",
          "researchQueue": ["pismo"], "tempoGry": "standardowa", "buildingCostPace": "wysoki",
          "kosztJednostekPace": "normalny", "wzrostLudnosciPace": "normalny", "ruchSwiataPace": "dlugi" }]
  ],
  "exploredByHuman": [[0, ["3,4", "3,5"]], [3, ["10,2", "10,3"]]],
  "meta": { "aiSkarbiecByOwner": [[1, 50], [2, 30]], "aiNaukaPoolByOwner": [[1, 10]] }
}
```
Format `Array<[ownerId, X]>` (nie tablica obiektów z wbudowanym `ownerId`) jest wybrany
**dla zgodności z istniejącym idiomem** — cały plik `main.ts` serializuje mapy per-owner
dokładnie tak (`aiSkarbiecByOwner`, `aiResearchDone`, `ownerDisplayName`,
`battlePowerPtsByOwner` — wszystkie `Array.from(map.entries())`), a `gracze`/
`exploredByHuman` są w runtime dosłownie `Map<number, X>` (`playerStateByHuman`,
`exploredByHuman`), więc `Array.from(playerStateByHuman.entries())` daje ten kształt bez
przekształceń pośrednich.

`aiSkarbiecByOwner`/`aiNaukaPoolByOwner` — bez zmian względem dzisiejszego stanu (§3),
zostają w `meta` jak dziś.

## 5. Wykrywanie starego formatu + komunikat (zgodnie z ABC-4, bez migracji)

**Dowód, że dzisiejszy mechanizm robi coś PRZECIWNEGO niż wymaga ABC-4:**
`game/save.ts:606-609` (`deserializeGame`) rzuca TYLKO gdy `ver > SAVE_VERSION`
("nowsza niż obsługiwana"); komentarz `save.ts:584`: *„Older versions (wersja <
SAVE_VERSION) are accepted: callers may migrate."* — czyli dziś zapis v1 wczytałby się
pod v2 bez błędu (fallbacki `??`). Dla bumpu 2→3 to jest DOKŁADNIE zachowanie zakazane
przez ABC-4 (ciche wczytanie śmieci: `saved.gracze` byłoby `undefined`, pętla po nim
dałaby zero graczy). Dodatkowo `loadFromLocal()` (`save.ts:792-796`) **połyka** każdy
wyjątek z `deserializeGame` w `catch { return null; }` — dowolny komunikat błędu ginie,
zostaje tylko `null`; `loadGameFromSlot` (`main.ts:35489-35496`) na `!saved` pokazuje
ZAWSZE ten sam ogólny tekst `'Nie można wczytać tego zapisu.'`, nieodróżnialny od
uszkodzonego pliku.

**Projekt (2 zmiany, obie potrzebne, żadna nie istnieje dziś):**
1. `deserializeGame` dostaje NOWĄ, osobną gałąź: `if (ver < 3) throw new
   IncompatibleSaveFormatError(...)` — **twardy próg `3`, nie `< SAVE_VERSION`** (to
   rozmyślnie inne kryterium niż istniejące `ver > SAVE_VERSION`: przyszłe pola opcjonalne
   nadal mogą być dodawane bez bumpu wersji, zgodnie z istniejącym komentarzem
   `save.ts:356` „bez bumpu SAVE_VERSION" — v3 jest JEDNORAZOWYM twardym cięciem
   nakazanym przez ABC-4, nie precedensem generalnej migracji-zawsze-w-górę).
   `IncompatibleSaveFormatError extends Error` (nowa, eksportowana klasa w `save.ts`) —
   komunikat np. `'Ten zapis pochodzi ze starszej wersji gry (v'+ver+') sprzed trybu
   gorącego krzesła i nie może być wczytany. Rozpocznij nową grę.'`.
2. `loadFromLocal()` w swoim `catch` **rethrow'uje WYŁĄCZNIE**
   `IncompatibleSaveFormatError` (inne błędy nadal → `null`, bez zmiany zachowania dla
   uszkodzonego JSON-a). `loadGameFromSlot` owija `await loadFromLocal(...)` w
   dedykowany `try/catch (e) { if (e instanceof IncompatibleSaveFormatError) {
   if (!fromInGamePause) openStartupMainMenu(); showHintMessage(e.message, 6000); return; } }`
   — **kolejność wołań `openStartupMainMenu()` PRZED `showHintMessage()` jest
   OBOWIĄZKOWA**, zgodnie z udokumentowaną naprawą N-ZINDEX-TOAST tuż obok
   (`main.ts:35544-35561` + realny kod wywołań `main.ts:35573-35576`:
   `if (!fromInGamePause) openStartupMainMenu(); showHintMessage(...)`) —
   `showHintMessage()` (`main.ts:13329`) czyta `isMainMenuOpen()` SYNCHRONICZNIE w
   chwili wywołania, żeby ustawić z-index toastu na 600; dopiero zamontowane
   `.civ-menu` (z-index 500) sprawia, że `isMainMenuOpen()===true`. Odwrócona
   kolejność (jak w poprzedniej wersji tego dokumentu) dałaby z-index 320 dla
   scenariusza startowego (`fromInGamePause===false` — dokładnie ten z §7b: stary
   zapis v2 wczytywany z ekranu startowego) i toast zostałby zamalowany przez
   `.civ-menu` (500 > 320) na całe 6000ms — realne naruszenie ABC-4 ("jasno
   komunikować"). Poprawiona kolejność powyżej jest identyczna z istniejącym,
   już poprawnym wzorcem gałęzi `ok===false` w tej samej funkcji — **dokładnie
   ten sam wzorzec** co istniejąca gałąź `fatal.length > 0`
   (`main.ts:35494-35501`, komunikat + `openStartupMainMenu()` + wczesny `return`), więc
   zero nowej architektury UI, tylko nowa gałąź obok istniejącej.

Bez zmiany (2) komunikat z (1) i tak wpadłby w generyczny `catch` zewnętrzny
(`main.ts:35630-35638`, `'Błąd wczytywania zapisu.'`) — czytelny, ale **nieinformacyjny
w sposób wymagany przez ABC-4** (nie mówi "stary format"), dlatego obie zmiany są
konieczne, nie tylko (1).

## 6. Nakładanie z Etapem 6f (`humanCivIds`, dwa heksy startowe)

Sprawdzone przeciw `R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md` §3(ii):
Etap 6f już projektuje `NewGameParams.humanCivIds: string[]` i
`playerStartHexByHuman: Map<number, {q,r}>`/`ClusterStartPlan.playerStartHexes`. **Zero
duplikacji, jawny podział:** 6f projektuje KSZTAŁT tych struktur w runtime (nowa
funkcjonalność, poza save/load); Etap 7 odpowiada TYLKO za to, by raz gdy te struktury
istnieją, przepłynęły przez zapis — a to już się dzieje mechanicznie: `meta.newGameParams:
_lastNewGameParams ? {..._lastNewGameParams, seed: _gameSeed} : undefined` (`main.ts:
28320-28322`) **spreaduje CAŁY obiekt `NewGameParams`** do `meta`, więc gdy 6f doda pole
`humanCivIds` do `NewGameParams`, ono automatycznie trafi do zapisu BEZ zmian w
`buildSaveGameSnapshot` (potwierdzone `Read`, nie domysł). Jedyna praca Etapu 7 tutaj:
`newGameParamsForLoad()` (`main.ts:34237`, rekonstrukcja `NewGameParams` przy wczytaniu —
dziś czyta `saved.gracz?.era` na `34251`, do przepisania na `saved.gracze` po zmianie
kształtu) musi odczytać `humanCivIds` z `meta.newGameParams` zamiast zakładać jeden
`civId` — ale SAMĄ semantykę „dwa heksy startowe" (mapgen, `map/cluster-spawn.ts`)
projektuje 6f, nie 7.

## 7. Plan dowodu no-op i dowodu komunikatu (metody wykonywalne)

**(a) No-op `humanOwnerIds=[0]`:** dzięki aliasowaniu z §2 (`exploredByHuman`/
`playerStateByHuman` dzielą referencję z `explored`/`player` przy jednym fotelu), pętla
zapisu `for (id of humanSeats.humanOwnerIds) gracze.push([id,
snapshotOf(playerStateByHuman.get(id)!)])` przy `humanOwnerIds=[0]` daje TABLICĘ
JEDNOELEMENTOWĄ o treści identycznej z dzisiejszym `gracz`. Test: (1) rozszerzyć istniejący
wzorzec strukturalny (`gra/tools/load-fail-toast-zindex-test.cjs` jako szablon grep-owego
testu na `main.ts`, bo main.ts nie da się zbundlować) o asercję: `gracze.length === 1 &&
gracze[0][0] === 0` po zapisie w single-player; (2) manualny playtest: zapisz →
wczytaj → porównaj `skarbiec/nauka/era/explored.size` przed/po (identyczne, jak dziś) na
świeżej grze 5-turowej; (3) `node ./node_modules/typescript/bin/tsc --noEmit` na typach
`GraczSaveV3`.

**(b) Komunikat przy starym formacie (NIE roundtrip):** test bezpośredni na `save.ts`
(plik jest zwykłym modułem, importowalnym — potwierdzone: `gra/tools/planned-march-test.cjs`
i `postep-pamiec-usuniecie-test.cjs` już importują `game/save`, więc `deserializeGame`
JEST testowalne bez stubowania całego `main.ts`, w odróżnieniu od (a)):
```js
const v2 = { wersja: 2, tura: 1, units: [], cities: [], explored: [], gracz: {} };
assert.throws(() => deserializeGame(JSON.stringify(v2)), IncompatibleSaveFormatError);
```
Uzupełniająco: strukturalny grep-test na `main.ts` (wzorem `load-fail-toast-zindex-test.cjs`)
sprawdzający, że gałąź `IncompatibleSaveFormatError` w `loadGameFromSlot` woła
`openStartupMainMenu()` PRZED `showHintMessage` z tekstem zawierającym „starszej
wersji"/„gorącego krzesła" (dokładnie odwrotna kolejność niż istniejący bug
N-ZINDEX-TOAST — nowa gałąź musi go NIE powtórzyć; test failuje, jeśli kolejność
w kodzie jest odwrócona). Manualnie: 1 realny zapis v2 z bieżącej gry (dziś dostępny w
`localStorage`/IndexedDB dowolnego gracza) wczytany PO wdrożeniu v3 — oczekiwany toast z
treścią „starszej wersji", **bez** wejścia w `restoreGameFromSave` (crash) i **bez** menu
startowego z pustym stanem gry.

## 8. Wynik

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1
GOAL: Recon-only Etapu 7 (save/load v3) — OSTATNI etap planu hot-seat, zgodny z ABC-4
(bez migracji, czytelny komunikat niekompatybilności).
ZMIANY/COMMIT: Ten dokument (docs-only, zero zmian w `gra/`).
TESTY: Brak (recon) — plan dowodu no-op (a) i dowodu komunikatu (b) opisany w §7,
wykonywalny dopiero w implementacji.
BLOKADY: Brak ABC do rozstrzygnięcia w tej rundzie — bug `aiSkarbiecByOwner` obalony
dowodem kodowym (§3, już naprawiony), nakładanie z 6f rozliczone jawnie (§6).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja świeżości numerów linii (§2-§6), poprawności
obalenia bugu Audytu #44 (§3) i zgodności projektu v3 z ABC-4 (§4-§5).
DEPLOY/PUSH: NIE WYKONANO
