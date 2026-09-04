# PLAN: Gorące krzesło (hot-seat) — dwóch graczy-ludzi przy jednym komputerze

**Status:** PLAN — przed decyzjami ABC właściciela, przed dispatchem.
**Data:** 2026-09-04
**Wyzwalacz (właściciel):** „czy myślisz że wprowadzenie tak zwanego gorącego krzesła
byłoby trudne? czyli żeby można było wybrać dwóch graczy na początku rozgrywki a nie
tylko jednego. [...] przygotuj plan szczegółowy co jest potrzebne, co trzeba zmienić, w
jakie miejsca trzeba zajrzeć, trzeba też przemyśleć czy nie powinniśmy zrobić drugiej
kopii gry i na niej robić testy z tym gorącym krzesłem."

---

## 0. Trzy odkrycia, które zmieniają obraz sprawy

Wstępne rozpoznanie („203 wystąpienia `ownerId === 0` w `main.ts`") sugerowało jednolity,
beznadziejny refaktor. Szczegółowe mapowanie pokazało co innego:

**1. Warstwa akcesorów per-owner JUŻ ISTNIEJE.** `main.ts:25120-25260` zawiera komplet
funkcji owner-agnostycznych: `ownerTreasury`/`setOwnerTreasury` (25126/25129),
`ownerPracaPool`/`setOwnerPracaPool` (25137/25141), `ownerNaukaPool`/`setOwnerNaukaPool`
(25157/25162), `ownerResearchedTechs`/`addOwnerResearchedTechs` (25235/25238),
`empireEpochForOwner` (1755). Każda z nich to `ownerId === 0 ? player.X :
aiXByOwner.get(ownerId)` — czyli **dispatch między dwoma backendami storage w JEDNYM
miejscu**, nie logika rozsiana po kodzie. Cała kategoria „ekonomia" przełącza się w ~10
funkcjach.

**2. AI jest w pełni owner-agnostyczne.** `gra/src/game/ai.ts` (3900+ linii): **zero**
wystąpień `ownerId === 0`. `decideAITurn(ownerId, opts)` jest parametryczne. Praca jest
wyłącznie w bramkach po stronie `main.ts`, nie w silniku AI.

**3. UKRYTA PUŁAPKA, której nie było w rozpoznaniu: `ownerId > 0` == „to jest AI" —
31 wystąpień w `main.ts`.** Najgroźniejsze `main.ts:29332-29333` (budowa listy tur AI):
```ts
for (const u of units) { if (u.ownerId > 0) s.add(u.ownerId); }
for (const c of cities) { if (c.ownerId > 0) s.add(c.ownerId); }
```
Człowiek #2 musi dostać dodatni ownerId (0 zajęte, −1 = barbarzyńcy, −99 = rebelianci).
Bez naprawy tych 31 miejsc **`decideAITurn` zagra turę za człowieka #2** — objaw byłby
mylący („jednostki gracza 2 ruszają się same"). To jest pułapka nr 1 i musi być
zaadresowana ZANIM drugi fotel w ogóle powstanie.

---

## A. Inwentaryzacja warstw zależnych od „gracz = owner 0"

### A1. Mgła wojny / widoczność — POJEDYNCZY GLOBALNY `Set` (kategoria najbardziej ryzykowna)

`main.ts:9203`: `const explored = new Set<string>();` — **jeden Set na całą grę**,
33 wystąpienia (`9203, 9249-9258, 9714, 11187, 18381, 18507-18530, 20552, 22295, 22476,
26754, 27493, 32204, 33023, 33372-33373, 33617-33618, 33845-33846, 34250-34251`).

Warstwa OBLICZENIOWA jest natomiast **już sparametryzowana ownerem**:
`currentVisibleForOwner(ownerId)` (9377) działa dla dowolnego ownera (w tym unia
sojusznicza); `game/visibility.ts:213 unitsVisibleOnMap(units, visibleHexes,
playerOwnerId = 0)`, `map/minimap.ts:71,119`, `render/cities.ts:656
applyFogVisibility(vis, fogOn, playerOwnerId = 0)` — **wszystkie mają już parametr**,
`main.ts` przekazuje im literał `0` (`9702`, `9711`).

Twarde miejsca do usunięcia: `ownPlayerVisibleHexes()` (9317-9323, to tylko „wersja
owner-0" `currentVisibleForOwner`), `currentVisible()` (9354-9356), `refreshFog()`
(9709-9731).

**Przy dwóch ludziach bez zmiany:** gracz 2 od pierwszej tury widzi wszystko, co odkrył
gracz 1 — gra bez mgły de facto. Dodatkowo `main.ts:18521 explored.delete(k)` (cofanie
odkrycia dyplomatycznego) skasowałoby mgłę niewłaściwemu graczowi.

### A2. Input / zaznaczanie / kliknięcia — ~25 miejsc, semantyka „AKTYWNY człowiek"

Główny handler: `main.ts:23046-23330`. Kluczowe: `23124` (`playerSel`), `23185`/`23217`
(klik na miasto własne vs wrogie), `23275` (zaznaczenie jednostki), `23288-23291` (atak),
`23311` (`planMarchTo`), `23150` (`resolveEnemyCityClick({playerOwnerId: 0})` — już
sparametryzowane, tylko literał). Dalej: `19253` (`playerStackAt`), `13150`, `22242`,
`22784-22785`, `32074`, `32267` (cykl jednostek, marsze, koniec animacji), `5392/5409/
5447/5499` (panel jednostki), `12047`, `game/army-cycle.ts:55`.

### A3. UI / HUD / panele / listy — NAJWIĘKSZA kategoria, ~75 miejsc (ale najmniej ryzykowna per-miejsce)

Wzorzec dominujący: `cities.filter(c => c.ownerId === 0)` jako źródło danych widoku.
Lista miast/HUD imperium: `3357, 3360, 3776, 6252, 6706, 11674, 14255, 14302, 14383,
14814, 16303, 16480, 20237-20289, 25263`. Stopy imperium: `16017, 16152, 16187, 16371,
16459, 16540`. Panel wydarzeń/cywilizacji: `14098, 14178, 14492, 14764, 6483`. Cuda:
`3798, 3813, 3850, 3867, 3944`. Rekrutacja: `5812, 5908, 5916, 6011, 6022, 6048`.

**19 zmiennych cache HUD `let _last*`** (`10054-10142`, m.in. `_lastPraca`,
`_lastKultura`, `_lastNaukaRate`, `_lastPlayerCityEcon`) — snapshot ekranu gracza 0 jako
singleton; przy przełączeniu fotela wymagają invalidacji (nie duplikacji).

Moduły w `gra/src/ui/` są **prawie czyste** — realnych miejsc jest ~13:
`ui/cityPanel.ts:4447, 4904, 5118, 8087, 8396, 8554, 9829, 10279`, `ui/siegeMapPanel.ts:
171, 196, 216`, `ui/preBattle.ts:579`, `ui/powerOverlayHud.ts:194`.

### A4. Przepływ tury — 1 funkcja, ~4500 linii

`triggerPlayerEndTurn()` — `main.ts:27416` do ~31960, jeden
`void (async () => { try { … } finally { … } })()`. Fazy: 27538 (6% ruchy gracza),
27585 (10% dyplomacja), 27596 (14% ekonomia — `advanceCityEconomy` dla WSZYSTKICH
ownerów), 29316 (38% tury AI, pętla `ownerLoop` @ 29466), 31498 (94% barbarzyńcy),
31824 (98% zwycięstwo), 31948 (100% „Tura N — twoja kolej"). **`turn++` @ 27543** — w
środku fazy gracza.

Miejsca `ownerId === 0`: `27464, 27477, 27498, 27506, 27625, 27789-27814, 27896, 28024-
28026, 28347, 28728, 28818, 28904, 28924, 28983, 29303, 31123, 31784, 31842`.

**Docelowo:** rozcięcie na `endActiveHumanTurn()` (27416-27543, per człowiek) i
`runWorldEndTurn()` (27585-31960, raz na turę gry) + orkiestrator `advanceSeat()`.

### A5. Ekonomia per-właściciel — JUŻ per-owner

`advanceCityEconomy(cities, …)` (wołane raz @ 27700+) liczy WSZYSTKIE miasta wszystkich
ownerów, wyniki rozdziela `tick.ownerId`. Mapy per-owner: `aiSkarbiecByOwner` (7649),
`aiPracaPoolByOwner` (7667), `aiNaukaPoolByOwner` (7688), `aiBadanaByOwner` (7690),
`aiResearchDone` (7165), `ownerEraByOwner` (1652), `empireFoodStates` (4200),
`goldDeficitStates` (4202). Poza `main.ts`: `game/turn-economy.ts` 8 miejsc (`1438, 1972,
2236, 2346, 2410, 2534, 2844` + `1216`), `game/empire-food.ts:380, 752`,
`game/society-inputs.ts:88, 93`, `game/cities.ts:427`, `game/difficulty-cost.ts:45`.

### A6. Dyplomacja — ~55 miejsc, rdzeń JUŻ symetryczny

`main.ts:7696-7698 getDiploRelation(a, b)` używa klucza `a < b ? a_b : b_a` — para `0_1`
jest legalna. 49 wywołań hardkoduje `0` jako stronę człowieka (`3240, 5298, 6138, 6212,
7724, 9459, 13806, 14082, 14914, 14932, 14959, 15336-15337, 15625, 15832-15866, 16794,
17737, 18143-18150, 18514, 18552, 18867, 19002, 19018, …`), plus `30638`,
`game/forced-war-bronze.ts:295`, `game/forced-war-stone.ts:178`,
`game/diplomacy-border-march.ts:245`.

### A7. Zapis / wczytanie — format NIE zniesie dwóch ludzi

`buildSaveGameSnapshot()` (`main.ts:26713+`): `explored: Array.from(explored)` (26754),
`gracz: { skarbiec, nauka, era, zbadane, badana, researchQueue, … }` (26756-26770) —
jeden Set, jeden obiekt. `game/save.ts:286-346` (`explored: string[]` @ 310,
`gracz?: any` @ 317). Restore: `34131`, `34249-34251`, `34687`.

**WYKRYTA LUKA ISTNIEJĄCA (bug niezależny od hot-seatu):** `aiSkarbiecByOwner` /
`aiNaukaPoolByOwner` **nie są serializowane** (komentarz „Audyt #44" @ `main.ts:26846`).
Człowiek #2 na dodatnim ownerze straciłby skarbiec po wczytaniu.

### A8. Render / kamera — ~15 miejsc, większość już sparametryzowana

`render/units.ts:5797-5798` (`ringStanceForOwner` — domyślna wartość pola, realny
resolver w `main.ts:7722`), `main.ts:7833, 3239, 2238, 2268, 11283, 26447, 12849, 22438`.
`render/camera.ts` — owner-agnostyczna, zero pracy (potrzebne tylko zapamiętanie pozycji
per fotel jako NOWA funkcjonalność).

### A9. AI — zero pracy w `ai.ts`

Bramki w `main.ts`: `29332-29333` (lista tur AI), `6123`, `25173`, `25481`, `1863-1864`,
`10384`, `28182`, `28321` + 31 sztuk `ownerId > 0`. `game/ai-fog.ts` — per-owner Map.
`game/ai-moc-diag.ts:67`.

### A10. Start gry / wybór cywilizacji — ~15 miejsc

`ui/newGameFlow.ts:84-142 NewGameParams` (`civId`, `civName` — pojedyncze;
`selectedAiCivIds?: string[]` to **gotowy wzorzec** dla `humanCivIds`), `main.ts:32418
applyMenuParams` → `_menuCivId` (32470, deklaracja 1415), `9922`/`32528
fillAiOwnerCivMap` (def. 7267 — wyklucza cywilizację gracza z puli AI, musi wykluczać
obie), `8050 applyClusterStartPlan` → `game/cluster-start.ts:24 playerStartHex` (JEDEN
heks startowy), `:53 playerCivId`, `main.ts:2297, 2305, 7251, 32914, 3218, 14098, 26220`.

---

## B. Architektura docelowa

### B1. Nowy moduł `gra/src/game/human-owners.ts` (bezstanowy, testowalny)

```
export const HUMAN_OWNER_PRIMARY = 0;              // zawsze; kompatybilność wsteczna
export interface HumanSeats {
  humanOwnerIds: readonly number[];                // [0] w single, [0, N] w hot-seat
  activeHumanOwnerId: number;
}
export function isHumanOwner(seats, ownerId): boolean
export function isActiveHuman(seats, ownerId): boolean
export function isAiOwner(seats, ownerId): boolean // !human && !barbarian && !rebel
export function nextHumanSeat(seats): number | null
export function isHotSeat(seats): boolean
```
Stan żywy w `main.ts` obok `const player` (9920):
`humanSeats`, `playerStateByHuman: Map<number, PlayerState>`,
`exploredByHuman: Map<number, Set<string>>`.
Aliasy lokalne: `isHuman(id)`, `isMe(id)`, `ME()`.

### B2. Tabela decyzyjna migracji (klucz do ~330 podmian)

| Kontekst wystąpienia | Zamiana | Uzasadnienie |
|---|---|---|
| Render / HUD / panel / minimapa / listy miast i jednostek | `isMe(id)` / `ME()` | pokazujemy ekran aktywnego |
| Klik, zaznaczenie, ruch, atak, marsz, cykl jednostek, koniec tury | `isMe(id)` | tylko aktywny wydaje rozkazy |
| `explored` / `currentVisible()` / `refreshFog()` | `ME()` do renderu, `exploredByHuman.get(id)` do zapisu | osobna mgła per człowiek |
| Toast / hint / dziennik wydarzeń | `isMe(id)` | komunikat do tego, kto patrzy |
| Akcesory ekonomiczne (`ownerTreasury`, `ownerNaukaPool`, …) | `isHuman(id)` | każdy człowiek ma własny skarbiec |
| `advanceCityEconomy`, `turn-economy`, `empire-food`, `society-inputs` | `isHuman(id)` | ekonomia liczy obu w tej samej fazie EOT |
| Auto-badania / auto-ulepszenia / `requireFlowBalance` | `isHuman(id)` | reguła „człowiek vs AI", nie „kto patrzy" |
| Zwycięstwo / eliminacja / moc / ranking | `isHuman(id)` | obaj ludzie są ocenialni |
| Save / load | `isHuman(id)` (pętla po `humanOwnerIds`) | serializujemy obu |
| **`ownerId > 0` == „to jest AI" (31 miejsc)** | `isAiOwner(...)` | inaczej AI gra za człowieka #2 |
| `getDiploRelation(0, X)` (49 miejsc) | `getDiploRelation(ME(), X)` | panel pokazuje relacje aktywnego |

**Reguła kciuka:** funkcja **rysuje / reaguje na input / pokazuje komunikat** → `isMe`.
Funkcja **liczy stan gry** → `isHuman`. Wystąpienie w roli „to jest AI" → `isAiOwner`.

### B3. Alokacja ownerId dla człowieka #2

**Rekomendacja: normalny dodatni ownerId ze slotu klastra** (nie sentinel) — cała
ekonomia, dyplomacja, terytorium, moc i walka już działają dla dodatnich ownerów.
Cena: obowiązkowa naprawa 31 sztuk `ownerId > 0` (Etap 1).

---

## C. Podział na etapy (gra działa po KAŻDYM)

| Etap | Zakres | Ryzyko | Kryterium „gotowe" |
|---|---|---|---|
| **0** | `game/human-owners.ts` + `hotSeatEnabled()` (wzorzec 1:1 z `civFogShortcutsEnabled()`, `main.ts:9214-9228`) + `humanSeats` + aliasy. **Zero podmian.** | bezpieczny | typecheck + bramki zielone, zachowanie bit-w-bit |
| **1** | 31× `ownerId > 0` → `isAiOwner` (m.in. `29332-29333`, `1863-1864`, `6128`, `10384`, `28182`, `28321`, `30129/30201/30307/30319/30407/30422`, `game/owner-utils.ts:16`, `game/ai-moc-diag.ts:67`) | średnie skutkiem, **no-op behawioralny** | 20 tur playtestu bez różnicy w logach |
| **2** | `explored` → `exploredByHuman`; usunięcie `ownPlayerVisibleHexes()`; `currentVisible(ownerId = ME())`; literały `0` w `9702`/`9711` → `ME()` | **wysokie** | ten sam zbiór odkrytych heksów na presecie |
| **3** | `playerStateByHuman`; przepisanie akcesorów `25126-25260`, `1755`, `25235`, `10052`; `difficulty-cost.ts:44` | bezpieczny | identyczne liczby w HUD, testy ekonomii bez zmian |
| **4** | Rozcięcie `triggerPlayerEndTurn` → `endActiveHumanTurn()` + `runWorldEndTurn()` + `advanceSeat()`; przeniesienie `turn++` | **najwyższe** | 30 tur bez różnicy w logach EOT przy 1 człowieku |
| **5** | `switchActiveHuman()` (reset 19 cache'y, zamknięcie paneli, `refreshFog`, kamera) + `ui/hotSeatHandoff.ts` (pełnoekranowa zasłona) | **wysokie (wyciek info)** | po przekazaniu żaden panel/mgła/minimapa poprzednika |
| **6** | Migracja ~272 `ownerId === 0` wg tabeli B2, w 6 podetapach: (a) input ~25, (b) UI ~75, (c) ekonomia ~50, (d) dyplomacja ~55, (e) render ~15, (f) start ~15 | mechaniczny | po każdym podetapie: typecheck + bramki + 20 tur |
| **7** | Save/load v3 (`gracze[]`, `exploredByHuman`, `humanOwnerIds`, `activeHumanOwnerId`) + **naprawa istniejącej luki `aiSkarbiecByOwner` poza sejwem** + `humanCivIds` w kreatorze + dwa heksy startowe | średnie | roundtrip hot-seat; stary sejw v2 wczytuje się bez zmian |

---

## D. Największe ryzyka

1. **`ownerId > 0` = „AI" (31 miejsc)** — bez Etapu 1 `decideAITurn` gra za człowieka #2.
2. **`explored` jako jeden Set** — bez Etapu 2 pełny wyciek mapy; `18521 explored.delete`
   kasuje mgłę niewłaściwemu graczowi.
3. **Wyciek informacji poza mgłą:** 19 cache'y `_last*` (10054-10142), `warEventLog`
   (7909), `villageEventLog` (13401), `borderMarchEventLog`, otwarte panele, `selectedId`
   (9846), `plannedMarches` (21821), pozycja kamery, overlaye tras/terytorium.
4. **Odkładniki EOT** (`deferredEotHints`, `deferredMergePrompts` @ 9196,
   `flushDeferredPlayerUnitReveals`, `preBattle` @ `31123`/`31784`) wyskoczą na ekranie
   następnego gracza, jeśli zostaną w `endActiveHumanTurn`.
5. **`aiSkarbiecByOwner` poza sejwem** (`26846`) — istniejący bug, blokujący dla fotela #2.
6. **`turn++` @ 27543** w środku fazy gracza — przeniesienie dotknie ~50 miejsc
   czytających `turn` (autosave @ 27580, wygasanie traktatów, cooldowny AI).
7. **`triggerPlayerEndTurn` = 4500 linii** w pliku, do którego w 30 dni poszły
   **103 commity** — rozcięcie musi być krótkie i szybko zmergowane.
8. **Bariery walki** (`23930`, `24215-24219`, `24554`) — bez zdefiniowanej relacji
   człowiek↔człowiek gracze albo nie będą mogli się atakować, albo zaatakują bez zgody.
9. **Trasy handlowe** (`game/trade-routes.ts:1097-1138`) potraktują miasta człowieka #2
   jako „obce" i utworzą trasy automatycznie — musi być decyzją, nie skutkiem ubocznym.
10. **`game/first-player-city.ts`** — onboarding pierwszego miasta wyłącznie dla ownera 0
    (`isAwaitingFirstPlayerCity` @ 9269, `playerStartHex` @ 2297, `playerEverOwnedCity`
    @ 2305 — singletony).

---

## E. Osobna kopia gry — REKOMENDACJA: NIE

**Rekomendacja: główna linia za flagą `hotSeatEnabled`. Nie długa gałąź, nie osobny build.**

**Przeciw długiej gałęzi:** `git log --since="30 days" -- gra/src/main.ts` = **103
commity** (~3,4 dziennie) w pliku 35 003 linii. Etapy 4 i 6 dotykają dokładnie tych
rejonów, które AutoBot zmienia codziennie. Gałąź żyjąca 2-3 tygodnie da konflikt w
setkach linii, a poprawności merge 200 hunków w `main.ts` nie da się ręcznie
zweryfikować — realne ryzyko cichego cofnięcia cudzej pracy.

**Przeciw osobnemu buildowi:** `gra/vite.config.ts` produkuje jeden plik IIFE
(`inlineDynamicImports: true`, `manualChunks: undefined`) — osobny build **nie izoluje
kodu**, zmienia tylko domyślną wartość flagi. Powielałby ten sam `main.ts` bez korzyści.

**Za flagą w głównej linii:** projekt ma gotowy wzorzec — `main.ts:9214-9228
civFogShortcutsEnabled()` (łączy `import.meta.env.DEV`, `VITE_CIV_PLAYTEST`, query
`?playtest=`/`?dev=1`, ścieżkę pliku). Wszystkie etapy 0-3 i 6 są **behawioralnym no-opem
przy `humanOwnerIds = [0]`** — lądują w `main` małymi porcjami, każda weryfikowalna
20-turowym playtestem i mergowalna tego samego dnia. Flaga bramkuje **wyłącznie** to, co
zmienia zachowanie: drugi fotel w kreatorze (Etap 7), ekran przekazania i `advanceSeat()`
z więcej niż jednym fotelem (Etapy 4-5). Domyślnie `false` w `Gra-FINALNA.html`, `true`
w `gra-robocza/Gra-ROBOCZA.html`.

**Reżim pracy:** jeden temat AutoBota = jeden etap (lub podetap 6a-6f) = merge w 24h.

---

## F. Skala i kolejność

| # | Kategoria | Miejsc | Semantyka | Ryzyko | Kolejność |
|---|---|---|---|---|---|
| — | `ownerId > 0` = „to jest AI" | **31** | `isAiOwner` | wysokie skutkiem, zerowe zmianą | **1** |
| A5 | Ekonomia (akcesory) | ~10 fn + ~40 call sites | `isHuman` | niskie | 2 |
| A9 | AI (bramki w main) | ~6 | `isAiOwner` | niskie | 3 |
| A1 | Mgła / widoczność | ~35 | `ME()` + Set per człowiek | **wysokie** | 4 |
| A4 | Przepływ tury | ~20 + rozcięcie 4500 linii | `isMe`/`isHuman` | **najwyższe** | 5 |
| A2 | Input / zaznaczanie | ~25 | `isMe` | średnie | 6 |
| A8 | Render / kamera | ~15 | `isMe` / `ME()` | niskie | 7 |
| A3 | **UI / HUD / panele** | **~75** | `isMe` | średnie, rozdrobnione | 8 |
| A6 | Dyplomacja | ~55 | `ME()` | średnie + ABC | 9 |
| A7 | Save / load | ~15 + format | `isHuman` | średnie | 10 |
| A10 | Start gry | ~15 | nowa funkcjonalność | średnie | 11 |

**Suma ≈ 330 miejsc**, z czego ~85% to jednoliniowe podmiany wg tabeli B2.

---

## G. Decyzje ABC do podjęcia przed Etapem 4

- **ABC-1 — relacja gracz1↔gracz2:** (A) zawsze wojna, (B) zawsze neutralni bez
  możliwości traktatu, (C) pełna dyplomacja z UI negocjacji przy jednym ekranie.
- **ABC-2 — moment liczenia ekonomii:** (A) jedna faza EOT po turach obu ludzi
  (rekomendacja — silnik już liczy wszystkich ownerów jednym `advanceCityEconomy`),
  (B) osobno po każdym foteli.
- **ABC-3 — trasy handlowe człowiek↔człowiek:** (A) tak jak z AI, (B) wyłączone.
