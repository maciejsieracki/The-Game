# R-HOTSEAT-ETAP6A-RECON-INPUT-Q1 — Operator runda 1 — inwentaryzacja kategorii „input"

**Metoda:** świeży `grep -n`/`Read` całego relevantnego zakresu `gra/src/main.ts` (36 216
linii dziś) i `gra/src/game/army-cycle.ts`, w worktree `/home/user/wt-hotseat-etap6a-recon`,
gałąź `autobot/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1`, HEAD `43cd1f14` (dispatch), baza
`911b5fcc`. **Zero numerów linii skopiowanych z planu ani z dispatchu bez świeżej
weryfikacji** — każdy cytat niżej ma świeży grep/Read z tej rundy. Zero zmian w
`gra/src`/`gra/tools` — dokument czysto analityczny.

---

## 0. KOREKTA PRZESŁANKI DISPATCHU — Etap 5 NIE jest zintegrowany

Dispatch (i README/plan) twierdzi: *„Etapy 0-5 (w tym `human-owners.ts`, `isHuman`/
`isAiOwner`, `ME()`, `humanSeats`) są już zintegrowane"* oraz w nagłówku zadania 4: *„Etap 5
(`switchActiveHuman()`, świeżo zintegrowany)"*. **To jest częściowo nieprawdziwe —
zweryfikowane komendą, nie z pamięci (playbook C-056):**

```
grep -rn "switchActiveHuman" gra/src/  → ZERO trafień
find gra/src -iname "*hotseat*" -o -iname "*hot-seat*"  → ZERO plików (ui/hotSeatHandoff.ts nie istnieje)
git merge-base --is-ancestor db09fef1 HEAD
  (db09fef1 = "R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 runda 2b: Evaluator PASS, zero zarzutow")
  → kod wyjścia ≠ 0 → NIE JEST PRZODKIEM HEAD
git branch -a --contains db09fef1  → wyłącznie autobot/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
```

Rejestr (`dyspozycje/REJESTR-PROSB-I-ZADAN.md:99`) potwierdza tę samą lukę z drugiej
strony: istnieje wpis WYŁĄCZNIE dla `R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1` (dokument,
ZAMKNIĘTE), z notatką *„Następny krok: dispatch implementacji
`R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1` na podstawie tego recon"* — **żadnego wpisu dla samej
implementacji nie ma**, mimo że branch `autobot/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1` istnieje
z 4 rundami pracy i Evaluator PASS (`db09fef1`). Implementacja została zrobiona i
zewaluowana, ale **nigdy nie przeszła Final Control/integracji orkiestratora** — dokładnie
ten sam wzorzec, który recon Etapu 5 sam odkrył dla Etapu 4a tamtej nocy (branch z PASS,
ale nie w `main`).

**Co JEST potwierdzone jako faktycznie zintegrowane (kod fizycznie obecny w tym HEAD):**

| Etap | Dowód w kodzie (ten HEAD) | Status |
|---|---|---|
| 0 | `gra/src/game/human-owners.ts` istnieje, eksportuje `HumanSeats`/`isHumanOwner`/`isAiOwner`/`isActiveHuman`/`nextHumanSeat`/`isHotSeat` | ZINTEGROWANY |
| — | `main.ts:10358-10365`: `ME()`, `isHuman(ownerId)` (lokalne aliasy) | ZINTEGROWANY |
| 1 | 31× `ownerId > 0` → `isAiOwner(humanSeats, …)` — potwierdzone m.in. `main.ts:2069-2070, 7564, 10867, 22183, 22262, 29308, 29447, 30481-30482` | ZINTEGROWANY |
| 3 | Akcesory `main.ts:26167-26279` (`ownerTreasury`/`ownerPracaPool`/`ownerNaukaPool`/`ownerResearchedTechs`) już rozgałęziają `isHuman(ownerId) ? playerStateByHuman.get(...) : aiXByOwner.get(...)` | ZINTEGROWANY |
| 4a+4b | `runWorldEndTurn()` (`main.ts:28643`), `endActiveHumanTurn(humanOwnerId)` (`main.ts:32999`), `advanceSeat()` (`main.ts:33174`) — wszystkie obecne i wpięte (`onEndTurn`/`endTurn` @ `21042`/`21630` wołają `advanceSeat()`) | ZINTEGROWANY |
| **5** | `switchActiveHuman()` / `ui/hotSeatHandoff.ts` | **BRAK w kodzie — TYLKO na osobnej, niezmergowanej gałęzi** |

**Konsekwencja dla tej rundy (pkt 4 zadania, „sprawdź nakładanie z Etapem 4/5"):**
nakładanie z Etapem 4 jest realne i sprawdzone niżej (§4). Nakładanie z Etapem 5 jest
dziś **zerowe nie dlatego, że luki zostały zamknięte, tylko dlatego że Etap 5 fizycznie
nie istnieje w main.ts tej gałęzi** — żadne z miejsc input nie może być „już pokryte przez
`switchActiveHuman()`", bo nie ma czego wołać. To NIE unieważnia scope'u tego tematu (input
nadal trzeba zamigrować niezależnie), ale unieważnia założenie dispatchu, że Etap 5 tworzy
dodatkową siatkę bezpieczeństwa dla resetu `selectedId`/`plannedMarches` przy przełączeniu
fotela — tej siatki dziś nie ma. Jedyny istniejący dziś reset `selectedId`/`plannedMarches`
to `clearPlayerUnitSelectionStateOnly()` wołane wewnątrz `endActiveHumanTurn()` (linia
33128, tuż po `runPlannedMarchesAtPlayerEndTurn()`) — działa dla KAŻDEGO końca tury
(pojedynczy człowiek), nie jest specyficzne dla przełączenia fotela w hot-seat.

Alias `isMe(id)`, który plan §B1 opisuje jako część fundamentu Etapu 0 („Aliasy lokalne:
`isHuman(id)`, `isMe(id)`, `ME()`"), **też nie istnieje**:
```
grep -c "isMe(" gra/src/main.ts → 0
```
Migracja kategorii „input" (tabela B2: „→ `isMe(id)`") będzie musiała albo dodać ten alias
(`function isMe(id: number): boolean { return id === ME(); }`, jedna linia, zero ryzyka —
kandydat do zrobienia NA START rundy implementacji Etapu 6a, poza allowlistą tego
recon-only tematu), albo pisać `ownerId === ME()` wprost w każdym miejscu. Rekomendacja:
dodać alias — jedna definicja, 42 miejsca call site zamiast rozjazdu stylu.

---

## 0b. Korekty rundy 2 (Obrona) — odpowiedź na zarzuty Evaluatora `02-evaluator-runda1.md`

Wszystkie 3 zarzuty **PRZYJĘTE**. Pełne uzasadnienie z dowodem: `03-obrona-runda1.md` (ten
sam run). Tu tylko mapa co się zmieniło w tym dokumencie, żeby dalsza lektura była spójna:

1. **Zarzut 1 (materialny)** — drugi handler `window.addEventListener('keydown', …)`
   (`main.ts:33185`) w ogóle nie był analizowany w rundzie 1. Zawiera `sel.ownerId === 0`
   na **`main.ts:33273`** (klawisz **B**, „Found a city") — dodane niżej jako **A4** w
   Klastrze A (kategoria „zaznaczenie", jak zauważył Evaluator). Ten sam handler wiąże też
   **Spację** → `cycleToAdjacentPlayerUnit(selectedId, 1)` (`main.ts:33215`) jako faktyczny
   klawiszowy punkt wejścia „cyklu jednostek" — udokumentowane niżej pod A3, ale świeży
   `Read` (`main.ts:5992-6007`) potwierdza, że ta funkcja NIE zawiera własnego literału
   `ownerId` — deleguje do `cyclablePlayerArmyLeads()` (już policzone jako A3) i
   `selectPlayerUnit()` (już policzone jako A2) — więc dostaje opis, ale NIE osobny numer w
   sumie (byłoby podwójne liczenie tych samych call site'ów). **Suma rdzeniowa: 41 → 42**
   (+1, wyłącznie A4).
2. **Zarzut 2 (materialny)** — §4 poniżej poprawione. Świeży `sed -n '32999,33130p'`
   potwierdza: F1-F5 (5 pozycji, `main.ts:33055-33111`) fizycznie leżą wewnątrz ciała
   `endActiveHumanTurn`; D1-D3 (3 pozycje, `main.ts:23275-23332`,
   `executePlannedMarchesEndTurn`/`applyMarchSegmentInstant`) są ODDZIELNYMI funkcjami
   zdefiniowanymi setki linii wcześniej, WOŁANYMI z wnętrza `endActiveHumanTurn` przez
   `runPlannedMarchesAtPlayerEndTurn()` (`main.ts:33127`), nie leżą tam leksykalnie.
   Poprawne zdanie: „5 z 13 pozycji klastra D+F (F1-F5) leży fizycznie w ciele
   `endActiveHumanTurn`; D1-D3 są wołane z jej wnętrza, ale zdefiniowane osobno; F6-F10
   leżą w `renderLoop`." (Poprzednie „10 z 13" miało też czysty błąd arytmetyczny:
   5+3=8, nie 10 — usunięty razem z resztą.)
3. **Zarzut 3 (kosmetyczny)** — `disbandPlayerUnit` (`main.ts:6010`, guard
   `u.ownerId !== 0` na `main.ts:6014`, wołane z HUD `main.ts:20464`, akcja `'disband'`)
   dodane do tabeli wykluczeń §2 z jawnym uzasadnieniem (nie do klastra H — patrz dowód w
   `03-obrona-runda1.md` punkt 3 dla rozróżnienia od merge/split).

**Nowa liczba rdzeniowa kategorii (a): 42** (było 41, +1: A4). Wszystkie sumy/odniesienia
do „41" w §1-§5 poniżej zaktualizowane na 42.

---

## 1. Inwentaryzacja miejsc kategorii „input" — świeże numery linii

Zakres zgodnie z definicją kategorii (a) w dispatchu: klik na jednostkę/hex, zaznaczenie,
ruch (move/pathfinding aktywowany klikiem), atak (inicjacja, nie mechanika), marsz
(`plannedMarches`/`runPlannedMarchesAt*`), cykl jednostek. **„Koniec tury" wyłączony z
zakresu (już Etap 4)** — potwierdzone: żadne z miejsc niżej nie jest wewnątrz fazy
`runWorldEndTurn()` (28643+); dwa klastry (D, F) SĄ wewnątrz `endActiveHumanTurn()`
(32999+, faza gracza, nie świata) i `renderLoop()` — to kontynuacja ruchu zainicjowanego
klikiem, nie logika końca tury, więc mieszczą się w kategorii (a) zgodnie z jej własną
definicją („marsz" jest jawnie wymieniony).

### Klaster A — cykl życia zaznaczenia (`selectedId`)

| # | Linia | Kod dziś | Podmiana |
|---|---|---|---|
| A1 | `main.ts:5810` | `if (!u \|\| u.ownerId !== 0) return;` (`syncPlayerUnitSelectionOnMap`) | `if (!u \|\| !isMe(u.ownerId)) return;` |
| A2 | `main.ts:5927` | `if (!u \|\| u.ownerId !== 0) return;` (`selectPlayerUnit`) | `if (!u \|\| !isMe(u.ownerId)) return;` |
| A3 | `game/army-cycle.ts:55` | `u => u.ownerId === 0 && isUnitActiveForCycle(u) && (...)` (`cyclablePlayerArmyLeadsBase`, moduł CZYSTY, bez stanu gry) | Moduł nie importuje `human-owners.ts` (świadomie, header comment). Fix: dodać parametr `isMe: (u: RuntimeUnit) => boolean` wstrzykiwany przez main.ts (wzorzec identyczny jak już istniejący `canMove`), main.ts woła `cyclablePlayerArmyLeadsBase(units, true, stackCanMove, (u) => isMe(u.ownerId))`. |
| A4 | `main.ts:33273` | `if (sel && sel.ownerId === 0) { foundQ = sel.q; foundR = sel.r; }` (drugi handler `window.addEventListener('keydown', …)`, `main.ts:33185`, klawisz **B** „Found a city on the last hovered/clicked hex" — fallback na zaznaczoną jednostkę, gdy brak `lastBHex`/`hoverKey`) | `if (sel && isMe(sel.ownerId)) { foundQ = sel.q; foundR = sel.r; }` |

**Punkt wejścia klawiaturowy cyklu (bez osobnego numeru w sumie):** ten sam drugi handler
`keydown` wiąże **Spację** → `cycleToAdjacentPlayerUnit(selectedId, 1)` (`main.ts:33215`) —
to jest faktyczny klawiszowy punkt wejścia „cyklu jednostek" wymieniony wprost w dispatchu.
Świeży `Read main.ts:5992-6007` potwierdza: `cycleToAdjacentPlayerUnit()` sama NIE zawiera
literału `ownerId` — deleguje do `cyclablePlayerArmyLeads()` → `cyclablePlayerArmyLeadsBase`
(A3) i do `selectPlayerUnit()` (A2). Nie dostaje więc osobnego numeru (podwójne liczenie tych
samych call site'ów), ale opis kategorii „cykl" w tym dokumencie byłby niekompletny bez
wzmianki o tym, skąd naprawdę wchodzi się do A3/A2 z klawiatury — strzałki HUD ◀▶ wchodzą do
tego samego mechanizmu inną drogą (`onCycleUnit`/`onContextCycleUnit`, `main.ts:21403/21475`,
poza zakresem klawiatury, ale ten sam wzorzec bez własnego literału).

### Klaster B — handler kliku mapy (`canvas.addEventListener('mouseup', …)`, `main.ts:24003-24356`)

Główny handler input z dispatchu — dziś fizycznie tutaj (stare numery planu 23046-23330
są martwe, plik przesunął się o ~960 linii od czasu pisania planu).

| # | Linia | Kod dziś | Podmiana |
|---|---|---|---|
| B1 | `24081` | `if (panelCity && panelCity.ownerId === 0) {` | `if (panelCity && isMe(panelCity.ownerId)) {` |
| B2 | `24112` | `!isTerritoryHexOwnedBy(hit.q, hit.r, 0, nodes)` (fn już generyczna, tylko literał) | `!isTerritoryHexOwnedBy(hit.q, hit.r, ME(), nodes)` |
| B3 | `24114` | `!isPlayerTerritoryHex(hit.q, hit.r, playerCityNodes(), nodes, 0)` (fn generyczna, literał = domyślny param) | `..., ME())` |
| B4 | `24130` | `if (okCity && okCity.ownerId === 0) {` | `if (okCity && isMe(okCity.ownerId)) {` |
| B5 | `24159` | `const playerSel = sel && sel.ownerId === 0 ? sel : null;` | `sel && isMe(sel.ownerId) ? sel : null;` |
| B6 | `24220` | `if (clickedCity.ownerId === 0) {` | `if (isMe(clickedCity.ownerId)) {` |
| B7 | `24229` | `resolveEnemyCityClick({ …, playerOwnerId: 0, … })` (fn generyczna, wywołanie #1) | `playerOwnerId: ME()` |
| B8 | `24252` | `if (clickedCity.ownerId === 0) {` | `if (isMe(clickedCity.ownerId)) {` |
| B9 | `24253` | `visibleStackOnHex(units, hit.q, hit.r, 0)` (fn generyczna, literał) | `visibleStackOnHex(units, hit.q, hit.r, ME())` |
| B10 | `24285` | `resolveEnemyCityClick({ …, playerOwnerId: 0, … })` (wywołanie #2) | `playerOwnerId: ME()` |
| B11 | `24310` | `if (cu && cu.ownerId === 0) {` | `if (cu && isMe(cu.ownerId)) {` |
| B12 | `24320` | `} else if (selectedId !== null && cu !== null && cu.ownerId !== 0) {` | `!isMe(cu.ownerId)` |
| B13 | `24323` | `if (atkUnit && atkUnit.ownerId === 0 && stackCanMove(atkUnit) && …` | `isMe(atkUnit.ownerId)` |
| B14 | `24326` | `} else if (atkUnit && atkUnit.ownerId === 0) {` | `isMe(atkUnit.ownerId)` |
| B15 | `24346` | `if (sel && sel.ownerId === 0) {` | `if (sel && isMe(sel.ownerId)) {` |
| B16 | `24349` | `} else if (cu !== null && cu.ownerId !== 0) {` | `!isMe(cu.ownerId)` |

### Klaster C — `planMarchTo()` (`main.ts:23054-23130`)

| # | Linia | Kod dziś | Podmiana |
|---|---|---|---|
| C1 | `23069` | `if (!u \|\| u.ownerId !== 0) return false;` | `!isMe(u.ownerId)` |
| C2 | `23087` | `x.ownerId !== 0 && x.ownerId !== u.ownerId` (szuka celu ataku = „nie ja i nie ten sam właściciel co ja") | `!isMe(x.ownerId) && x.ownerId !== u.ownerId` |

### Klaster D — kontynuacja marszu na koniec tury gracza (`executePlannedMarchesEndTurn`/`applyMarchSegmentInstant`, wołane z `endActiveHumanTurn`)

| # | Linia | Kod dziś | Podmiana |
|---|---|---|---|
| D1 | `23277` | `.filter(u => u.ownerId === 0 && plannedMarches.has(u.id) …` (`executePlannedMarchesEndTurn`) | `isMe(u.ownerId)` |
| D2 | `23289` | `if (!u \|\| !dest \|\| u.ownerId !== 0) return false;` (`applyMarchSegmentInstant`) | `!isMe(u.ownerId)` |
| D3 | `23332` | `if (u.ownerId === 0) hutCollected = checkVillageRewardsAlongPath(...)` | `isMe(u.ownerId)` |

Komentarz na `23333-23336` („`u` jest zawsze graczem, guard `u.ownerId !== 0` wyżej —
nigdy barbarzyńcą") jest semantycznie sprzężony z literałem C1/D2 — po migracji na `isMe`
komentarz zostaje poprawny TYLKO jeśli guard nadal wyklucza barbarzyńcę/AI, co `isMe`
zachowuje (barbarzyńca ma `ownerId=-1`, nigdy nie jest `ME()`), ale komentarz odwołuje się
dosłownie do „gracza" (owner 0) — do zaktualizowania w rundzie implementacji, nie tylko
kod.

### Klaster E — inicjacja ataku klikiem (`main.ts:24964-24970`)

| # | Linia | Kod dziś | Podmiana |
|---|---|---|---|
| E1 | `24965` | `if (atkUnit.ownerId === 0 && defUnit.ownerId !== 0 && !playerIsAtWarWith(defUnit.ownerId)) {` | `isMe(atkUnit.ownerId) && !isMe(defUnit.ownerId)` — **UWAGA**: `playerIsAtWarWith` (main.ts:9825) sam hardkoduje `0` dwa razy (`if (ownerId === 0) return false; return areEnemyOwners(0, ownerId);`) — to jest funkcja KATEGORII DYPLOMACJA (A6/podetap d, wzorzec `getDiploRelation(0,X)`→`getDiploRelation(ME(),X)` z tabeli B2), używana WEWNĄTRZ input handlera. Nie liczę jej do kategorii (a) — jej migracja należy do podetapu (d), ale FLAGUJĘ zależność: dopóki (d) nie zmigruje `playerIsAtWarWith`, atak inicjowany przez fotel #2 przeciw fotelowi #1 (czy odwrotnie) będzie liczony błędnie (traktowany jak atak gracza 0 niezależnie od tego, kto naprawdę kliknął). |

### Klaster F — dokończenie animacji ruchu + auto-cykl po ruchu (`renderLoop()`, `main.ts:33327+`, oraz analogiczny „snap" w `endActiveHumanTurn()`)

Kontynuacja/finalizacja ruchu zainicjowanego klikiem (`startAnimatedMove`) — kategoria
„ruch" z definicji zadania.

| # | Linia | Kod dziś | Funkcja | Podmiana |
|---|---|---|---|---|
| F1 | `33055` | `if (u.ownerId === 0 && anim.pathHexes.length > 0) {` | `endActiveHumanTurn` (snap animacji przy end-turn) | `isMe(u.ownerId)` |
| F2 | `33068` | `applyCityVisitBonusesAlongPath(stack, anim.pathHexes, u.ownerId === 0)` | jw. | `isMe(u.ownerId)` |
| F3 | `33085` | `runScoutsAutoExplore(units, map, explored, 0, unitSight, Math.random, …)` (literał param `playerOwnerId`) | jw. | `ME()` |
| F4 | `33103` | `if (u.ownerId === 0) { if (checkVillageRewardAt(...)) … }` (callback `onAfterStep` scoutów) | jw. | `isMe(u.ownerId)` |
| F5 | `33111` | `applyCityVisitBonusesAtHex(u, u.q, u.r, u.ownerId === 0)` | jw. | `isMe(u.ownerId)` |
| F6 | `33405` | `if (u.ownerId === 0) hutCollected = checkVillageRewardsAlongPath(pathHexes);` | `renderLoop` (koniec animacji, ścieżka) | `isMe(u.ownerId)` |
| F7 | `33410` | `applyCityVisitBonusesAlongPath(stack, pathHexes, u.ownerId === 0)` | jw. | `isMe(u.ownerId)` |
| F8 | `33414` | `if (u.ownerId === 0) hutCollected = checkVillageRewardAt(destQ, destR);` | jw. (bez ścieżki) | `isMe(u.ownerId)` |
| F9 | `33416` | `if (u.ownerId === 0 && applyCityVisitBonusesAtHex(u, destQ, destR, true)) {` | jw. | `isMe(u.ownerId)` |
| F10 | `33466` | `if (u && u.ownerId === 0 && selectedId === finishedId && !stackCanMove(u) …` (auto-cykl „bęben" po wyczerpaniu ruchu) | jw. | `isMe(u.ownerId)` |

### Klaster G — podgląd trasy pod kursorem (`mousemove`, `main.ts:23954`)

| # | Linia | Kod dziś | Podmiana |
|---|---|---|---|
| G1 | `23954` | `if (!uSel \|\| uSel.ownerId !== 0) { … zeruj podgląd trasy … }` | `!isMe(uSel.ownerId)` |

### Klaster H — akcje scalania/rozdzielania armii wywołane z HUD (klik przycisku „Scal"/„Rozdziel")

| # | Linia | Kod dziś | Funkcja |
|---|---|---|---|
| H1 | `11188` | `if (!active \|\| active.ownerId !== 0) return;` | `openSplitPanelForSelected` |
| H2 | `11294` | `visibleStackOnHex(units, srcQ, srcR, 0, activeGroupId)` (literał, fn generyczna) | jw. |
| H3 | `11326` | `if (!active \|\| active.ownerId !== 0) return;` | `openMergePanelForSelected` |
| H4 | `21373` | `if (!u \|\| u.ownerId !== 0) return false;` | `canMerge` (wiązanie HUD `armyStack.canMerge`) |
| H5 | `21383` | `if (!u \|\| u.ownerId !== 0) return false;` | `canSplit` (wiązanie HUD `armyStack.canSplit`) |

Wszystkie pięć → `isMe(...)`/`!isMe(...)`.

**Suma kategorii (a) „input" policzona świeżo (runda 2, po korekcie §0b): 4+16+2+3+1+10+1+5
= 42 miejsc** (A4+B16+C2+D3+E1+F10+G1+H5; poprzednia runda: 3+16+2+3+1+10+1+5 = 41, brakowało
A4 — main.ts:33273, patrz §0b/zarzut 1).

---

## 2. Rozliczenie z liczbą „~25" z planu

**Plan: ~25. Świeży policzony wynik (po korekcie rundy 2, §0b): 42 — różnica +17 (+68%), nie
milczę o niej.**

Przyczyny rozjazdu, zweryfikowane:

1. **Plan liczył tylko `===0`, nie `!==0`.** Plan A2 wymienia literały typu „`23150`
   (`resolveEnemyCityClick({playerOwnerId: 0})`)" i podobne — ale w praktyce każde miejsce
   typu „to NIE jest moja jednostka" (`ownerId !== 0`, np. klaster B12/B16, C2, E1 część 2)
   jest RÓWNIE realnym miejscem migracji (`isMe`→`!isMe`) i plan ich nie wylicza osobno.
   W klastrach B-H powyżej **13 z 42 pozycji to `!== 0`**, nie `=== 0`. (A4, dodane w
   rundzie 2, jest `===0` — nie zmienia licznika `!==0`.)
2. **Plan nie uwzględniał `game/army-cycle.ts:55`** (cykl jednostek) jako osobnej,
   policzalnej pozycji — wspomina „cykl jednostek" opisowo, ale nie w liczbie.
3. **Klaster D+F (kontynuacja marszu/animacji na koniec tury gracza, 13 pozycji) plan
   umieszcza pod nagłówkiem A2 opisowo („marsz — `plannedMarches`, `runPlannedMarchesAt*`")
   ale bez policzenia — to największy pojedynczy blok różnicy (13 z 17 nadwyżki).** F1-F10
   (10 pozycji) leżą fizycznie wewnątrz `endActiveHumanTurn()`/`renderLoop()`; D1-D3
   (3 pozycje) są zdefiniowane w oddzielnych funkcjach WOŁANYCH z wnętrza `endActiveHumanTurn`
   (patrz rozróżnienie w §4, poprawione w rundzie 2) — w obu przypadkach żadne nie leży w
   głównym handlerze kliku (`canvas.addEventListener('mouseup', …)`), więc łatwo je pominąć
   przy pobieżnym gropie po samym tym handlerem.
4. **Klaster H (merge/split armii, 5 pozycji)** nie jest wymieniony w A2 w ogóle (plan
   wspomina tylko „5392/5409/5447/5499 panel jednostki" — stare numery, które w dzisiejszym
   pliku odpowiadają raczej tooltipowi kontekstowemu, klaster wykluczony niżej, nie
   merge/split).

**Co świadomie WYKLUCZYŁEM z liczby 42 (granica kategorii, nie błąd):**

| Klaster | Linie | Powód wykluczenia |
|---|---|---|
| Tooltip/panel kontekstowy jednostki | `5634, 5651, 5689, 5695, 5741` | Renderuje HTML opisu jednostki (`buildUnitContextTooltipForUnit`/`buildUnitContextPanelMessage`/`buildContextPanelData`) — to jest „co pokazać", nie „jak zareagować na klik". Wzorzec B2: „Render/HUD/panel → `isMe`/`ME()`" (podetap **b**, UI, nie **a**, input). |
| `buildArmyStackHudStateInner` | `20176` | Zasila ten sam tooltip (wołane z `5634-5636`) — ta sama kategoria (b). |
| Build-mode: ważność heksu pod budowę/teren zablokowany | `6093, 12526, 12539, 21906, 21929, 30361` | `isUnitInPlayerTerritory`/`showBuildTerritoryBlockedHint`/`assertPlayerTerritoryForBuild`/`updateHud` — mechanika budowy i HUD, nie „klik = zaznacz/rusz/atakuj/marsz/cyklu jednostki". Reaguje pośrednio na klik (tryb budowy), ale semantycznie to podetap (b)/(c), nie (a). |
| `afterPlayerUnitSpawned` | `11157` | Wyzwalane przez PRODUKCJĘ jednostki (koniec tury/miasto), nie klik gracza — mimo że w środku woła `selectPlayerUnit`. Kategoria ekonomia/produkcja (c), efekt uboczny „zaznacz nową jednostkę" jest wtórny. |
| `playerIsAtWarWith` | `9825-9828` | Patrz klaster E — kategoria dyplomacja (A6/podetap d), używana WEWNĄTRZ input handlera, nie migrowana w tym podetapie. |
| `disbandPlayerUnit` (runda 2 — zarzut Evaluatora 3) | `main.ts:6010` (definicja), guard `u.ownerId !== 0` na `main.ts:6014`, wołane z HUD `main.ts:20464` (akcja `'disband'`) | Guard strukturalnie identyczny do H4/H5 (funkcja wołana z callbacku HUD na zaznaczonej jednostce), ALE efekt jest TERMINALNY: usuwa jednostkę z gry na stałe i zwraca Manpower do puli imperium (`refundManpowerToEmpire`, `main.ts:6019`) — nie wpływa na dalszy klik/zaznaczenie/ruch/atak/marsz/cykl nad POZOSTAŁYMI jednostkami, w odróżnieniu od klastra H (scal/rozdziel), które fizycznie zmieniają skład jednostek biorących udział w DALSZYM cyklu/ruchu tej samej tury (stąd H jest policzone, a disband — bliższe ekonomii/produkcji, podetap **c** — nie). Jawnie sprawdzone i wykluczone, nie przeoczone — patrz `03-obrona-runda1.md` pkt 3 dla pełnego uzasadnienia rozróżnienia od klastra H. |

Te wykluczenia (12 pozycji, było 11 — dodano `disbandPlayerUnit` w rundzie 2) + 42
rdzeniowych = **54 pozycje `ownerId===0`/`!==0` dotknięte przez klik/zaznaczenie/ruch/atak/
marsz/cykl w szerokim sensie**, z czego **42 należy wprost do podetapu (a)**, reszta do
(b)/(c)/(d) i będzie migrowana przy okazji tamtych podetapów — **nie migrować ich teraz,
żeby nie dublować allowlisty podetapów** (zgodnie z regułą tego dispatchu przeciw
dublowaniu pracy Etapu 4).

Dla porównania: całościowy grep `main.ts` po `\bownerId\s*(===|!==)\s*0\b` (wszystkie
kategorie A1-A10 razem) daje **273 trafienia** — bardzo blisko `~272` z opisu podetapu 6 w
dispatchu (`Migracja ~272 ownerId === 0`), co sugeruje, że liczba `~272` w dispatchu
faktycznie pochodzi z **całego pliku obiema formami** (`===`/`!==`), nie tylko `===0` —
podczas gdy `~25` dla samej kategorii (a) było szacunkiem opisowym z planu, nie policzonym.
Rekomendacja: przy zamykaniu tego recon zaktualizować `PLAN-HOT-SEAT-2-GRACZY.md` §A2/§F z
`~25` na **42 (rdzeń) / 54 (rdzeń + graniczne)**, analogicznie do korekty „18+2 zamiast 19"
z recon Etapu 5.

---

## 3. Propozycje podmian — patrz tabele w §1 (kolumna „Podmiana"/osobna kolumna przy
klastrach D-H). Wzorzec jednolity: `ownerId === 0` → `isMe(ownerId)`, `ownerId !== 0` →
`!isMe(ownerId)`, literał `0` jako argument funkcji już-generycznej → `ME()`. Warunek
wstępny: dodanie jednoliniowego aliasu `isMe(id)` w `main.ts` obok istniejącego `ME()`
(patrz §0) — bez niego każda z 42 podmian musiałaby pisać `ownerId === ME()` wprost, co
działa identycznie, ale rozjeżdża się ze stylem `isHuman(id)`/`isAiOwner(...)` już
istniejącym w pliku.

---

## 4. Nakładanie z Etapem 4/5

**Etap 4 (zintegrowany) — nakładanie REALNE, potwierdzone kodem:**

`endActiveHumanTurn(humanOwnerId: number)` (`main.ts:32999`) **przyjmuje** `humanOwnerId`
jako parametr, ale ciało zaczyna się `void humanOwnerId; // patrz komentarz wyżej --
zarezerwowane pod Etap 6/8, nieużywane dziś` (linia 33000, komentarz `32991-32994`
dosłownie: *„podłączenie punktowych literałów `0` (np. `runScoutsAutoExplore`, main.ts ok.
28590) do tego argumentu jest ŚWIADOMIE odłożone do Etapu 6 (tabela B2 planu hot-seat)"*.
**To jest dokładnie klaster D+F z §1 (13 pozycji łącznie) — z rozróżnieniem, które runda 2
(Obrona) poprawia po zarzucie 2 Evaluatora (poprzednia wersja tego zdania miała błąd
arytmetyczny 5+3=„10" zamiast 8, i myliła „wołane z" z „fizycznie wewnątrz"):**

- **5 z 13** (F1-F5, `main.ts:33055-33111`) leżą **fizycznie w leksykalnym ciele**
  `endActiveHumanTurn` — potwierdzone świeżym `sed -n '32999,33130p'`.
- **3 z 13** (D1-D3, `main.ts:23275-23332`, `executePlannedMarchesEndTurn`/
  `applyMarchSegmentInstant`) są zdefiniowane jako ODDZIELNE funkcje setki linii przed
  `endActiveHumanTurn` (32999) — **wołane** z jej wnętrza przez
  `runPlannedMarchesAtPlayerEndTurn()` (`main.ts:33127`), nie leżą tam leksykalnie.
- Pozostałe **5 z 13** (F6-F10, `main.ts:33405-33466`) leżą w `renderLoop` (33327+), zgodnie
  z kolumną „Funkcja" w tabeli §1 klastra F.

Innymi słowy: **Etap 4b samo przygotowało hak (`humanOwnerId`) i JAWNIE zostawiło literały
`0` na miejscu, czekając na ten właśnie temat** — nie jest to przypadkowe nakładanie, to
zaplanowana zależność, niezależnie od tego, czy dana pozycja leży fizycznie w ciele
`endActiveHumanTurn` (F1-F5) czy w funkcji przez nią wołanej (D1-D3). Runda implementacji
Etapu 6a MUSI podłączyć `humanOwnerId` (parametr) zamiast literału `0` we WSZYSTKICH 13
pozycjach klastra D+F, nie tylko F1-F5 — inaczej `endActiveHumanTurn(N)` wywołane dla
fotela #2 nadal operowałoby na danych/mgle/mgle-village-reward fotela #1 tak samo dla D1-D3
jak dla F1-F5.

Reszta klastra (A, B, C, E, G, H — 29 pozycji: 4+16+2+1+1+5, gdzie A obejmuje teraz też A4
dodane w rundzie 2) leży POZA `endActiveHumanTurn`/`runWorldEndTurn` — w drugim handlerze
`keydown` (A4), pierwszym handlerze `mouseup`/`mousemove` (klastry A1-A2/B/C/E/G) i
funkcjach wywoływanych z HUD (klaster H) — te NIE są dotknięte przez Etap 4 i wymagają
migracji niezależnie od niego. (Runda 1 nie liczyła tu klastra A wprost — 13+25=38≠41 —
ta poprawka domyka też tamto niedopowiedzenie: 42−13(D+F)=29.)

**Etap 5 (NIE zintegrowany, patrz §0) — nakładanie ZEROWE, bo nie ma czego nakładać.**
Żadne z 42 miejsc nie jest dziś „pokryte" przez `switchActiveHuman()`, bo ta funkcja nie
istnieje w tym HEAD. W szczególności: reset `selectedId`/`plannedMarches` przy
PRZEŁĄCZENIU FOTELA (w odróżnieniu od zwykłego końca tury pojedynczego człowieka) nie ma
dziś żadnej implementacji — `clearPlayerUnitSelectionStateOnly()` (wołane w
`endActiveHumanTurn`, linia 33128) czyści `selectedId` przy KAŻDYM końcu tury człowieka,
co przypadkiem (nie celowo) daje częściowe pokrycie: gdy fotel #1 kończy turę, jego
zaznaczenie i tak zostaje wyczyszczone, zanim cokolwiek innego się wydarzy — ale to jest
efekt uboczny mechanizmu end-turn, nie zabezpieczenie przed wyciekiem specyficzne dla
hot-seatu (nie czyści np. `foreignUnitInspectId`, otwartych paneli, `hexDetailHex` —
dokładnie luki, które recon Etapu 5 już opisał i którymi ma się zająć jego WŁASNA,
nieukończona jeszcze implementacja).

**Wniosek dla dispatcherskiego pytania „czy migracja input może być no-opem pokrytym przez
Etap 4/5":** NIE w żadnym z 42 miejsc — wszystkie wymagają jawnej podmiany kodu w tej lub
przyszłej rundzie. Etap 4 przygotował HAK (parametr `humanOwnerId`) dla podzbioru D+F, ale
sam haka nie użył — to zadanie tego tematu.

---

## 5. Plan dowodu no-op

**Rekomendacja: Chromium (Playwright/Puppeteer), nie headless Node.** Uzasadnienie —
zweryfikowane, nie założone z automatu jak sugerował dispatch:

- Wszystkie 42 miejsca siedzą w `main.ts` w funkcjach, które albo (a) są bindowane
  bezpośrednio do zdarzeń DOM (`canvas.addEventListener('mouseup'/'mousemove', …)`,
  klastry B/G), albo (b) są wołane z callbacków HUD wstrzykiwanych przez moduły `ui/*`
  (`armyStack.onSelectUnit`/`canMerge`/`canSplit`, klaster H) — żaden z tych call site'ów
  nie jest osiągalny z czystej logiki w Node (w odróżnieniu np. od `game/ai.ts`, które
  `gra/tools/*-test.cjs` bunduje i uruchamia headless, bo jest zero-DOM).
- Wyjątek częściowy: **klaster A3 (`game/army-cycle.ts:55`) JEST czystą funkcją** (zero DOM,
  bierze `units`/`canMove` jako argumenty) — dla NIEJ SAMEJ da się napisać test headless w
  stylu istniejącego `gra/tools/scout-explore-deselect-cycle-test.cjs` (ten sam moduł, ten
  sam wzorzec harnessu) — ale to sprawdza tylko funkcję w izolacji, NIE dowodzi no-opa
  całej kategorii „input" w grze.
- Klastry D/F (kontynuacja marszu/animacji) są wewnątrz `async () => { try {...} finally
  {...} }()` domknięcia `endActiveHumanTurn`, które samo zależy od stanu DOM (`isAnimating`,
  `anim`, `unitRenderer`, `camCtrl`) — nie da się ich wywołać bez uruchomionej gry w
  przeglądarce.

**Konkretna, wykonywalna metoda (wzorem Etapu 4 §4.1/Etapu 5 §4.1, potwierdzona
istniejącym `run` narzędziem projektu):**

1. Zbuduj grę deweloperskim Vite (`node ./node_modules/vite/bin/vite.js build --outDir
   dist --emptyOutDir` w `gra/`, jedyna dozwolona komenda buildu wg C-001) albo uruchom
   dev server, jeśli runda implementacji ma dostęp do przeglądarki na żywo.
2. Chromium (headless dopuszczalne — DOM potrzebny, nie ekran) wykonuje SEKWENCJĘ
   realnych zdarzeń wskaźnika: klik jednostki (zaznaczenie, klaster A/B), klik heksu
   (ruch, klaster B/C/F), klik wrogiej jednostki sąsiadującej (atak, klaster E), zlecenie
   marszu wieloturowego + „Zakończ turę" (marsz, klaster D), naciśnięcie Spacji (cykl,
   klaster A3) — **PRZED i PO** podmianie kodu, na tym samym seedzie/starcie.
3. Porównanie: `explored` (Set po serializacji), `plannedMarches`, pozycje/HP/ruchLeft
   wszystkich jednostek, `selectedId`, log tury (`console.warn('[EndTurn]…')`) — bit-w-bit
   identyczne przy `humanOwnerIds=[0]` (jedyny fotel, `isMe(0)===true` zawsze dziś, bo
   `activeHumanOwnerId` domyślnie `HUMAN_OWNER_PRIMARY=0` i nikt jeszcze nie zmienia
   `humanSeats`).
4. 20 tur zgodnie z kryterium „gotowe" z planu §C — z co najmniej jedną turą wykonującą
   każdy z sześciu typów akcji (klik/zaznaczenie/ruch/atak/marsz/cykl), nie tylko przelot
   „End Turn" bez interakcji (to by nie dotknęło ŻADNEGO z 42 miejsc realnie).
5. Dodatkowo: `node ./node_modules/typescript/bin/tsc --noEmit` (0 błędów) — powinno być
   zbędne przy zero zmian tej rundy, obowiązkowe przy rundzie implementacji.

---

## Podsumowanie dla Evaluatora

- 42 miejsca rdzeniowe kategorii (a), świeże numery linii, z konkretną podmianą każde
  (41 w rundzie 1 + A4 dodane w rundzie 2 po zarzucie Evaluatora, patrz §0b).
- Liczba „~25" z planu skorygowana na 42 (+17), z jawnym rozbiciem przyczyn rozjazdu
  (§2) — analogicznie do wzorca „18+2 zamiast 19" z Etapu 5.
- Korekta krytyczna przesłanki dispatchu: Etap 5 (`switchActiveHuman()`) NIE jest
  zintegrowany, wbrew dispatchowi i planowi — zweryfikowane `git merge-base
  --is-ancestor` + brakiem plików + rejestrem (§0). Etap 4 JEST zintegrowany i
  bezpośrednio nakłada się na 13 z 42 miejsc (klaster D+F; 5 z tych 13 — F1-F5 — leżą
  fizycznie wewnątrz jej ciała leksykalnie, 3 — D1-D3 — są zdefiniowane osobno, ale wołane
  z jej wnętrza, patrz §4 poprawione w rundzie 2 po zarzucie Evaluatora) — z jawnym hakiem
  (`humanOwnerId`, dziś `void`-owany) czekającym na ten temat.
- Alias `isMe(id)` z planu §B1 nie istnieje — do dodania w rundzie implementacji.
- Plan dowodu no-op: Chromium/Playwright, nie Node headless — uzasadnione strukturą
  kodu (DOM-bound event handlers), z wyjątkiem częściowym dla `army-cycle.ts` (czysty
  moduł, testowalny headless w izolacji, ale nie jako dowód całej kategorii).
