# R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1 — Operator runda 1 — `switchActiveHuman()` / `ui/hotSeatHandoff.ts`

**Metoda:** świeży `grep`/`Read` całego relevantnego zakresu `gra/src/main.ts` (36186 linii
dziś) i modułów `ui/`, `game/human-owners.ts`, w worktree
`/home/user/wt-hotseat-etap5-recon`, gałąź `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`,
HEAD `2fde1cf8` (dispatch), baza bezpośrednia `06c0eaa5`. **Zero numerów linii skopiowanych
z planu ani z recon Etapu 4 bez świeżej weryfikacji — każdy cytat niżej ma świeży `grep`
z tej rundy.**

## 0. KOREKTA PRZESŁANKI DISPATCHU — Etap 4a NIE jest w main tego worktree

Dispatch tej rundy twierdzi: *"main.ts jest teraz DLUZSZY o zmiany z Etapu 4a
(runWorldEndTurn)"*. **To jest NIEPRAWDZIWE dla stanu, w którym faktycznie pracuję —
zweryfikowane, nie założone:**

```
grep -n "runWorldEndTurn\|switchActiveHuman\|hotSeatHandoff\|advanceSeat\|endActiveHumanTurn" gra/src -r
→ ZERO trafień (poza samym `switchActiveHuman`/`hotSeatHandoff` z tej dyspozycji, które
  jak dispatch sam potwierdza, jeszcze nie istnieją).
```

`git log --oneline -5 -- gra/src/main.ts` w tym worktree pokazuje `triggerPlayerEndTurn`
wciąż jako JEDNĄ funkcję (deklaracja @ **28643**, potwierdzone niżej §1.2) — dokładnie ten
sam monolit 4469 linii, co recon Etapu 4 opisywał 2026-09-07, tylko przesunięty o ~146
linii w dół pliku przez commity, które wylądowały MIĘDZY tamtym reconem a dziś (dyplomacja,
HUD, podbój — niepowiązane z hot-seatem).

**Co się faktycznie stało:** `git branch -a --contains ac5c2c09` pokazuje, że praca Etapu 4a
(`ac5c2c09 Etap 4a hot-seat: wydziel runWorldEndTurn() (Krok 0+1 recon), no-op dowiedziony
30/30` + `dfc1bec3 Etap 4a hot-seat: raport Evaluatora runda 1 (PASS, zero blokujacych
zarzutow)`) istnieje WYŁĄCZNIE na gałęzi `autobot/R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1`
— `git merge-base --is-ancestor ac5c2c09 HEAD` w TYM worktree zwraca **NIE**. Ta gałąź ma
Evaluator PASS, ale **nie przeszła jeszcze Final Control ani integracji orkiestratora**
(§ obieg CLAUDE.md: Final Control → integracja → dopiero wtedy main.ts realnie się zmienia).
`06c0eaa5`, baza mojego worktree, to commit **dispatchu** Etapu 4a na main (sam plik
`00-dispatch.md`), NIE integracja jego wyniku.

**Konsekwencja dla tej rundy:** wszystkie numery linii i cała struktura funkcji niżej są
zweryfikowane względem DZISIEJSZEGO, NIEROZCIĘTEGO `triggerPlayerEndTurn()` — dokładnie tak,
jak nakazuje dyspozycja ("main.ts jest teraz DŁUŻSZY... zweryfikuj od zera"), tylko że
faktyczny stan jest o krok WCZEŚNIEJSZY niż dyspozycja zakładała. To NIE unieważnia projektu
`switchActiveHuman()`/`hotSeatHandoff.ts` niżej — obie funkcje są celowo projektowane jako
**nowy, niewpięty moduł** (dokładnie ten wzorzec, który dyspozycja sama każe stosować,
p. §5 niżej) i nie odwołują się do `runWorldEndTurn()` wprost. Ale **gdy Etap 4a faktycznie
wyląduje w main, numery linii `triggerPlayerEndTurn()`/granicy tury poniżej znów się
przesuną** — kolejna runda tego tematu (albo runda implementacji) musi to odświeżyć, nie
ufać nawet TEJ rundzie dłużej niż do najbliższej integracji.

---

## 1. Inwentaryzacja źródeł stanu (GOAL pkt 1) — świeży grep, dzisiejsze numery

### 1a. Cache'e HUD `_last*` — policzone od zera: **18 w klastrze HUD, nie 19; +2 poza klastrem, semantycznie różne**

Świeży grep:
```
grep -n "let _last\|const _last" gra/src/main.ts
```
daje **20 deklaracji**, ale nie wszystkie są tą samą kategorią co plan sugeruje:

| # | Linia | Nazwa | Kategoria |
|---|---|---|---|
| 1 | 1642 | `_lastNewGameParams` | **NIE jest per-owner** — echo parametrów menu "Nowa gra" (do przycisku "Graj ponownie"), globalne dla SESJI, nie dla właściciela. Zero ryzyka wycieku międzyludzkiego, zero powodu resetować przy handoff. |
| 2 | 2920 | `_lastReligionSpreadTotal` | civ-wide licznik rozprzestrzeniania religii (`lastReligionSpreadByCity` obok, klucz=miasto, nie owner) — dotyczy WSZYSTKICH miast niezależnie od właściciela, nie jest "dane gracza 0". Poza zakresem resetu HUD-per-człowiek. |
| 3-20 | **10529-10625** | klaster HUD imperium (patrz tabela niżej) | **TU jest realne ryzyko** |

Klaster 10529-10625 (przeczytany w całości tej rundy), 18 zmiennych:
`_lastPraca` (10529), `_lastPracaUpkeep` (10534), `_lastPracaAutoUlepszeniaKoszt` (10551),
`_lastPracaCudaKoszt` (10559), `_lastKultura` (10560), `_lastPracaRate` (10561),
`_lastKulturaRate` (10603), `_lastPieniadzRate` (10604), `_lastWealthLevel` (10605),
`_lastWealthMnoznik` (10606), `_lastNaukaRate` (10607), `_lastLudnoscRate` (10608),
`_lastBogactwoRate` (10615), `_lastBogactwoHandel` (10618),
`_lastBogactwoUtrzymanieBudynkow` (10619), `_lastBogactwoUtrzymanieJednostek` (10620),
`_lastBogactwoUtrzymanieSurowcow` (10621), `_lastPlayerCityEcon` (10625).

**Plus DWIE zmienne tej samej klasy, świadomie NIE nazwane `_last*`, więc plan/dyspozycja
by je pominęła przy dosłownym filtrze nazw:**
- `_pracaRateFreshFromEndTurn` (10602, boolean, "jednorazowy guard") — jednoturowa flaga
  współdzielona z `_lastPracaRate`/`_lastPlayerCityEcon`, ten sam mechanizm.
- `_liveFoodBrutto` (10623) — "Live brutto żywności imperium (preview)".

**Rekomendacja liczby dla następnej rundy: 20 zmiennych do rozważenia przy handoff (18 klaster
+ 2 dodatkowe tej samej klasy), NIE 19 z planu i NIE 20 z surowego grepa (które 2 poza
klastrem są out of scope z uzasadnieniem, nie milczącym pominięciem).**

**ZNALEZISKO KRYTYCZNE — resetowanie tych zmiennych NIE WYSTARCZY, bo funkcja, która je
PRZELICZA, jest sama zahardkodowana na `ownerId===0`:**

```
grep -n "function refreshLiveEmpireRatesUnsafe" gra/src/main.ts → 17077
```
Ciało (przeczytane w całości, 17077-17150+):
```ts
function refreshLiveEmpireRatesUnsafe(): void {
  const playerCities = cities.filter(c => c.ownerId === 0);          // 17078
  ...
  // D7: licz ekonomię TYLKO miast gracza (HUD używa wyłącznie ownerId===0).
  ...
  const playerEconUnitsForUpkeep: EconUnit[] = units
    .filter(u => u.ownerId === 0)                                     // 17146
    ...
  const bogactwoUpkeepPreview = previewOwnerUpkeep(
    0, playerCities, data, _menuDifficulty, cityBuilt, playerEconUnitsForUpkeep,
    player.era, player.zbadane, ...);                                 // 17149-17150
```
`player.era`/`player.zbadane` czytają WPROST singleton `player: PlayerState` (deklaracja
@ 10348 `const player: PlayerState = createPlayerState();`), NIE
`playerStateByHuman.get(ME())` (który istnieje od Etapu 3, p. §1e-bis niżej). Cztery
literały `0` (17078, 17146, 17149 x1 pozycyjny) + `player` bezpośrednio.

**Konsekwencja dla `switchActiveHuman()`:** wywołanie `markCityStateDirty()` +
`updateHud()` po przełączeniu `humanSeats.activeHumanOwnerId` na fotel N **nadal
przeliczy i pokaże ekonomię ownera 0**, nie ownera N — bo `refreshLiveEmpireRatesUnsafe`
nie wie, że "gracz" mógł się zmienić. To jest osobna, NIEUJĘTA w planie (tabela B2 planu
mówi o akcesorach `ownerTreasury` itp., które SĄ już `isHuman`-owe od Etapu 3 — ale ta
konkretna funkcja HUD-podglądu jest INNYM call-site'em, poza tamtą listą) migracja, i **musi
zostać zamigrowana na `ME()` PRZED albo W RAMACH implementacji `switchActiveHuman()`** —
inaczej fotel #2 zobaczy żetony HUD (Praca/Kultura/Skarbiec/Nauka…) policzone z MIAST
FOTELA #1, czyli dokładnie ten "wyciek info" z ryzyka planu, tylko przez INNĄ drogę niż
same zmienne `_last*`. Bez tej migracji jedyna bezpieczna opcja w Etapie 5 to **wyzerować
(nie przeliczyć) `_last*` przy handoff** i zaakceptować, że HUD pokaże 0 do najbliższego
realnego ticku ekonomii fotela N (koniec jego pierwszej tury) — degradacja UX, ale bez
wycieku. Decyzja do ABC/właściciela, nie do cichego założenia.

### 1b. Dzienniki zdarzeń — potwierdzone GLOBALNE, i **BEZ POLA ownerId W OGÓLE** (gorzej niż "trzeba filtrować" — filtrować się NIE DA)

Świeże deklaracje:
```
warEventLog          @ 8152   const warEventLog: SidePanelEvent[] = [];
tradeRouteEventLog   @ 13988  const tradeRouteEventLog: SidePanelEvent[] = [];
rationAutoEventLog   @ 14013  ...
pendingAutoRationForNextTurn @ 14021 (nie tablica, ale ta sama rodzina — patrz niżej)
deferredEotHints     @ 14023
villageEventLog      @ 13983
borderMarchEventLog  @ 14020
dismissedSidePanelEventIds @ 14054 (Set<string>)
deferredPlayerUnitRevealIds @ 9561 (Set<string>)
deferredMergePrompts @ 9572
```

**Typ `SidePanelEvent` (`gra/src/ui/sidePanelHud.ts:31-53`, przeczytany w całości)
NIE MA pola `ownerId` ani żadnego odpowiednika.** Jedyne pole zbliżone semantycznie to
`origin?: 'other-civs'` (48-52), z komentarzem w kodzie WPROST: *"Wszystkie inne źródła
`SidePanelEvent` są już filtrowane w silniku do par z udziałem gracza"* — czyli
filtrowanie "czy to dotyczy gracza" dzieje się DZIŚ raz, W MOMENCIE PUSH-a (przy tworzeniu
wpisu), nie przy odczycie. Potwierdzone na trzech konkretnych push-site'ach (świeży odczyt):
- `main.ts:10192-10208` (`checkVeteranEnemyFirstEncounter`, wołane Z WNĘTRZA `refreshFog()`
  @ 10173): `if (u.ownerId === 0) continue;` (10193, hardkodowane) — jednostka ownera 0
  jest "self", każda inna "wróg"; w hot-seat z fotelem N aktywnym to nadal traktuje
  jednostki fotela N jak WROGA (bo `0 !== N`), a jednostki fotela 1 (jeśli akurat 0) jak
  "self" niezależnie od tego, kto naprawdę patrzy. **To jest DODATKOWE, nieujęte w planie
  odkrycie tej rundy** — funkcja wołana wprost z `refreshFog()`, więc `switchActiveHuman()`
  wywołujące `refreshFog()` odziedziczy ten błąd automatycznie.
- `main.ts:8194-8210`, `8294-8300`, `8359-8365` (`recordCivElimEvent` i sąsiedzi) —
  budowa karty bez żadnego pola ownera, tylko tekst gotowy dla "gracza".
- `main.ts:21987-21994` (`__sidePanelLinkTestDebug.seedEvents`) — istniejący hak testowy
  robi dokładnie `warEventLog.length = 0; for (...) warEventLog.unshift(...)` — **to jest
  JUŻ gotowy, sprawdzony wzorzec czyszczenia tablicy zdarzeń, wart ponownego użycia w
  `switchActiveHuman()`** (p. §2 niżej), zamiast wymyślać nowy.

**Wniosek strukturalny (najważniejszy tej podsekcji): "filtrowanie" logów przy handoff
z GOAL pkt 1b jest NIEWYKONALNE w dzisiejszym kodzie** — nie ma po czym filtrować (brak
tagu właściciela). Jedyne dwie uczciwe opcje na Etap 5:
1. **Wyczyść (nie filtruj) wszystkie pięć tablic + oba Sety (`dismissedSidePanelEventIds`,
   `deferredPlayerUnitRevealIds`) i mapę `deferredMergePrompts`/`pendingAutoRationForNextTurn`
   przy KAŻDYM `switchActiveHuman()`** — fotel N startuje z pustym panelem WYDARZEŃ.
   Bezpieczne (zero wycieku), ale fotel N traci WŁASNĄ historię zdarzeń sprzed handoffu
   (bo te też idą do tej samej, jedynej tablicy i giną razem z resztą).
2. **Doczep tag `ownerId`/`forOwnerId` do `SidePanelEvent` i przefiltruj WSZYSTKIE
   push-site'y** (Etap 6 zakresowo, "Toast / hint / dziennik wydarzeń → `isMe(id)`" wg
   tabeli B2 planu) — poprawne rozwiązanie docelowe, ale to jest ZMIANA ~kilkunastu
   miejsc w main.ts, poza zakresem "Etap 5 = projekt + moduł izolowany" tej rundy.

**Rekomendacja: Etap 5 implementuje wariant 1 (czyszczenie) jako jedyny zgodny z
"recon-only dziś / no-op dla 1 fotela" zakresem, z jawnym komentarzem TODO odsyłającym do
tego dokumentu i do przyszłego poszerzenia Etapu 6 o tagowanie zdarzeń.** To NIE jest
milczące uproszczenie planu — to jedyna wykonalna opcja przy dzisiejszym kształcie
`SidePanelEvent`, i musi trafić do ABC jako jawna decyzja (utrata historii zdarzeń fotela
N po powrocie do niego), nie do cichego założenia w kodzie.

### 1c. `selectedId`, `plannedMarches`, panele/modale

```
let selectedId: string | null = null;                    @ 10274
const plannedMarches = new Map<string, PlannedMarchDest>(); @ 22856
```
Obie **globalne, bez klucza właściciela** — dokładnie zgodnie z oczekiwaniem planu
(to są z definicji rzeczy "jednego aktywnego człowieka na raz", nie potrzebują mapy
per-owner, wystarczy je ZAMKNĄĆ/WYCZYŚCIĆ przy handoff, zgodnie z kryterium "nie
przywracaj, zamknij").

**Istniejące funkcje-narzędzia do wykorzystania (potwierdzone, nie nowe):**
- `clearPlayerUnitSelectionStateOnly()` @ **5788** — czyści zaznaczenie (używane dziś w
  fazie 6 `triggerPlayerEndTurn`, p. Etap 4 recon §1 wiersz 6, wciąż aktualne).
- `syncPlayerUnitSelectionOnMap()` @ **5807** — odświeża wizualny stan zaznaczenia na
  mapie po zmianie `selectedId` (wołane dziś w `finally` end-turn).

**Inwentaryzacja WSZYSTKICH funkcji `hide*` paneli/modali/menu w `main.ts`** (świeży grep,
`grep -oE "hide[A-Za-z]+" | sort -u`) — **17 funkcji**, kompletna lista do zamknięcia przy
handoff:
```
hideArmyListHud, hideArmyMergePanel, hideArmyMergePickPanel, hideArmySplitPanel,
hideCityListHud, hideCityPanel, hideDiploListHud, hideDiplomacyAudience,
hideDiplomacyPanel, hideEmpireDetailPanel, hideGamePauseMenu, hideHexContextPanel,
hideMainMenu, hideSaveLoadDialog, hideScienceHubHud, hideSiegeMapPanel, hideWikiHubHud
```
Każda ma odpowiadający `is*Open()` predykat gdzieś w imporcie (potwierdzone dla części:
`isCityPanelOpen`, `isDiplomacyAudienceOpen`, `isDiploListHudOpen`,
`isEmpireDetailPanelOpen`, `isMainMenuOpen`, `isArmyMergePanelOpen`,
`isArmyMergePickPanelOpen`, `isArmySplitPanelOpen`, `isNewGameFlowOpen`,
`isPreBattleOpen` — importy main.ts:465-1210, świeżo zweryfikowane).

**Precedens JUŻ ISTNIEJĄCY w produkcji — częściowe "zamknij wszystko" — do rozszerzenia,
nie wymyślania od zera:**
```ts
// main.ts:22026-22033 (__sidePanelLinkTestDebug.closeAll — hak testowy Playwright)
closeAll: (): void => {
  hideEmpireDetailPanel();
  hideTechTreeView();
  hideCityPanel();
  if (isDiploListHudOpen()) hideDiploListHud();
  document.getElementById('civ-elim-notice-host')?.remove();
  refreshD1bHud();
},
```
Pokrywa 3 z 17 paneli. **`switchActiveHuman()` powinno wprowadzić PRODUKCYJNY odpowiednik
tej funkcji (nie test-hook), pokrywający WSZYSTKICH 17, plus `hidePreBattle()`/
`closeAudience`-owe warianty, plus `plannedMarches.clear()` i
`clearPlayerUnitSelectionStateOnly()`** — dokładny kształt w §2.

Ten sam plik zawiera też gotowy wzorzec introspekcji stanu otwartych widoków —
`__sidePanelLinkTestDebug.openViews()` @ **22012-22020**:
```ts
openViews: (): Record<string, unknown> => ({
  cityPanel: isCityPanelOpen(), cityPanelCityId: getOpenCityPanelCityId(),
  diploList: isDiploListHudOpen(), diploListFilter: getDiploListFilter(),
  empirePanel: isEmpireDetailPanelOpen(), techTree: isTechTreeViewOpen(),
  civElimModal: document.getElementById('civ-elim-notice-host') !== null,
}),
```
**To jest DOSŁOWNIE połowa asercji potrzebnej w teście "no leak" (§4)** — czytamy
istniejące predykaty gry, nie zgadujemy po klasach CSS. Trzeba tylko rozszerzyć o
pozostałe 14 paneli z listy wyżej.

### 1c-bis. UZUPEŁNIENIE RUNDY 2 (Evaluator zarzut #1, PRZYJĘTY) — globalny toast `#civ-hint-toast`

**Pominięte w rundzie 1 — świeżo doczytane teraz.** Świeży grep:
```
grep -n "hintToast\|showHintMessage\|hintOverrideTimer\|hideHintMessage" gra/src/main.ts
```
- `hintToast` (element DOM `#civ-hint-toast`) tworzony @ **1736-1749** (`document.createElement('div')`,
  `document.documentElement.appendChild(hintToast)`) — jeden element globalny, nie per-owner.
- `let hintOverrideTimer: ReturnType<typeof setTimeout> | null = null;` @ **13139**.
- `function showHintMessage(msg, durationMs=3000)` @ **13141-13179** (ciało przeczytane w
  całości): ustawia `hintToast.innerHTML`, `display='block'`, `z-index`, i planuje
  `setTimeout(() => { hintToast.style.display='none'; hintOverrideTimer=null; }, durationMs)`.
  **`hideHintMessage()` NIE ISTNIEJE jako osobna funkcja** — potwierdzone, zero trafień grep
  — jedyne wygaszenie to własny, opóźniony `setTimeout` tej samej funkcji.
- **279 call-site'ów** `showHintMessage(` w `main.ts` (`grep -c "showHintMessage("` →
  dokładnie zgodne z liczbą podaną przez Evaluatora).

**Ryzyko potwierdzone jako realne, nie hipotetyczne:** jeśli fotel A wywoła
`showHintMessage('Za mało rekrutów...', 2800)` tuż przed handoff, a `switchActiveHuman()`
(projekt §2 rundy 1) go nie dotyka — `hintOverrideTimer` nadal odlicza w tle, `hintToast`
pozostaje `display:block` z tekstem specyficznym dla stanu/akcji fotela A, widocznym fotelowi
B aż do wygaśnięcia własnego timeoutu (do 4500ms wg najdłuższych wywołań, np. linia 4157).
To jest DOKŁADNIE ryzyko planu "wyciek info poza mgłą", tylko przez kanał pominięty w
inwentaryzacji rundy 1 (bo nazwa nie pasuje do wzorca `_last*`/`*EventLog`/`hide*`).

**Poprawka do §2 KROK 1 (patrz niżej, wprowadzona w tej rundzie):** ponieważ nie ma
`hideHintMessage()`, `switchActiveHuman()` musi wygasić toast RĘCZNIE, tym samym wzorcem co
`showHintMessage()` samo robi na końcu swojego `setTimeout` — `clearTimeout(hintOverrideTimer)`
+ `hintOverrideTimer=null` + `hintToast.style.display='none'`. Dostępność zmiennych: obie
(`hintToast`, `hintOverrideTimer`) żyją w TYM SAMYM domknięciu `main.ts` co planowana lokalizacja
`switchActiveHuman()` (~10360-10400) — `hintOverrideTimer`/`hintToast` deklarowane niżej w pliku
(13139/1736) nie stanowi problemu, bo `switchActiveHuman()` jest wołana dopiero w runtime, długo
po pełnej inicjalizacji domknięcia (identyczny wzorzec do referencji `markCityStateDirty`/
`focusCameraOnOwnerCapital` w KROKACH 5/6, które też odwołują się do funkcji zadeklarowanych
w innych miejscach tego samego domknięcia).

### 1c-ter. UZUPEŁNIENIE RUNDY 2 (Evaluator zarzut #2, PRZYJĘTY) — globalny „build mode"/„found city mode"

**Pominięte w rundzie 1 — §1c grepował WYŁĄCZNIE wzorzec nazw `hide[A-Za-z]+`, co
strukturalnie wykluczyło ten stan (nazwa nie zaczyna się od `hide`).** Świeży grep:
```
grep -n "buildModeOpen\|foundCityMode\|activeImprovementKey\|activeWonderId\|function exitBuildMode\|isAwaitingFirstPlayerCity" gra/src/main.ts
```
- `let foundCityMode = false;` @ **2513** (deklarowana wcześniej niż reszta klastra —
  potwierdzone, nie błąd przepisania).
- `let buildModeOpen = false;` @ **11457**, `let activeImprovementKey: ImprovementKey | null = null;`
  @ **11458**, `let activeWonderId: string | null = null;` @ **11459** — cztery zmienne
  globalne, bez klucza właściciela, sterujące trybem budowy/zakładania miasta na mapie.
- `function exitBuildMode(): void` @ **12456-12472** (ciało przeczytane w całości):
  ```ts
  function exitBuildMode(): void {
    if (isAwaitingFirstPlayerCity()) return;         // 12462 — GUARD, patrz niżej
    buildModeOpen = false;
    foundCityMode = false;
    activeImprovementKey = null;
    activeWonderId = null;
    clearBuildModeVisuals();
    refreshBuildApi();
    refreshBuildHighlight();
    refreshD1bHud();
    popOverlay('build-mode');                        // 12471 — zarejestrowana na escapeOverlayStack
  }
  ```

**Ryzyko potwierdzone jako WYŻSZE niż info-leak, zgodnie z zarzutem Evaluatora:** bez
wywołania `exitBuildMode()` w `switchActiveHuman()`, fotel B odziedziczyłby
`buildModeOpen===true`/`activeImprovementKey`/`activeWonderId` ustawione przez fotel A —
pierwsze kliknięcie fotela B na mapie trafiłoby w ścieżkę `11936-11971` (budowa
ulepszenia/cudu) i **wykonałoby akcję budowy na koncie fotela A, kliknięciem fotela B**
(nie tylko pokazało cudzy tekst — faktycznie zmodyfikowałoby stan gry pod złym ownerem,
jeśli którakolwiek z tych ścieżek nie sprawdza jawnie `ME()`/ownera osobno — do zweryfikowania
osobno w rundzie implementacji, ale sam FAKT dziedziczenia trybu jest już potwierdzony tu).

**KRYTYCZNE — `exitBuildMode()` jest NO-OPEM (linia 12462), gdy `isAwaitingFirstPlayerCity()`
zwraca `true`** — potwierdzone czytaniem komentarza @ 12457-12461: to CELOWY,
udokumentowany invariant `R-PIERWSZE-MIASTO` ("jeden choke-point... dopóki gracz nie ma
pierwszego miasta, tryb zakładania miasta jest NIEWYJŚCIOWY"). **To oznacza, że zwykłe
wywołanie `exitBuildMode()` z `switchActiveHuman()` NIE ZAMKNIE trybu budowy, jeśli fotel A
jest w trakcie zakładania swojego pierwszego miasta w momencie handoff** — realistyczny
scenariusz wczesnej gry hot-seat (dokładnie tak, jak zarzucił Evaluator), bo każdy fotel
zaczyna grę bez miasta i `isAwaitingFirstPlayerCity()` prawdopodobnie NIE jest dziś
per-owner (do potwierdzenia osobno w rundzie implementacji — poza zakresem tej poprawki,
ale flagowane jako pytanie otwarte w §6 niżej).

**Decyzja projektowa (nowa w tej rundzie, do §2 KROK 1 niżej):** `switchActiveHuman()` NIE
może polegać wyłącznie na `exitBuildMode()` (bo bywa no-opem właśnie wtedy, gdy ryzyko jest
najbardziej realne). Woła `exitBuildMode()` jako pierwszą próbę (poprawny, "grzeczny" reset z
czyszczeniem wizualiów), a **jeśli `isAwaitingFirstPlayerCity()` jest prawdą, dodatkowo
wymusza reset czterech zmiennych wprost** (`buildModeOpen=false; foundCityMode=false;
activeImprovementKey=null; activeWonderId=null;`) — świadome ODSTĄPIENIE od invariantu
`R-PIERWSZE-MIASTO` w KONTEKŚCIE handoff (nie w kontekście Escape/PPM, których invariant
dotyczył pierwotnie). **To jest decyzja wymagająca potwierdzenia ABC/właściciela**, bo
zmienia zachowanie udokumentowanego, celowego mechanizmu — zgłaszam jawnie jako punkt do
decyzji, nie ciche obejście (p. §6 pkt 6 niżej).

### 1d. Mgła wojny / overlay mapy — DOBRA WIADOMOŚĆ, ale z JEDNYM krytycznym zastrzeżeniem

**`refreshFog()` (main.ts:10134-10175, przeczytana w całości) jest DZIŚ W PEŁNI
sparametryzowana przez `ME()`** — koniec do końca, nie tylko "ma parametr, main.ts
przekazuje 0" jak plan cytował ze starych numerów:
```ts
function refreshFog(...): void {
  const vis = currentVisible();                       // 10137 — używa ME() wewnętrznie
  addExplored(exploredByHuman.get(ME())!, vis);        // 10142
  ...
  cityRenderer.applyFogVisibility(vis, true, ME());    // 10159
  ...
}
```
`ownPlayerVisibleHexes()` (9711) filtruje `u.ownerId === ME()` (9713) i
`c.ownerId === ME()` (9717) — **NIE literałem 0**. `currentVisible()` (9746) woła
`ownPlayerVisibleHexes()` i dokłada widoczność sojuszników `ME()`. **Wniosek: samo
wywołanie `refreshFog()` po zmianie `humanSeats.activeHumanOwnerId` PRZEŁĄCZY mgłę na
nowego aktywnego człowieka bez żadnej dodatkowej pracy** — to jest DOKŁADNIE mechanizm,
którego `switchActiveHuman()` potrzebuje z punktu (c)/(d) GOAL-u.

**ZASTRZEŻENIE KRYTYCZNE (nieujęte w planie, znalezione tej rundy przez czytanie
komentarza przy deklaracji, main.ts:10367-10374):**
```ts
const exploredByHuman: Map<number, Set<string>> = new Map([[HUMAN_OWNER_PRIMARY, explored]]);
```
Komentarz WPROST: *"Dziś zawiera dokładnie jeden wpis... DOSŁOWNIE ten sam obiekt Set...
pełne odseparowanie na osobne Sety per fotel to RUNDA 2 tego samego tematu [Etapu 2]."*
**Świeży grep całego pliku (`exploredByHuman\.`) daje TYLKO TE TRZY trafienia** — deklaracja,
jeden odczyt w `refreshFog()`, jeden komentarz. **`.set()` na tej mapie NIE JEST wołane
NIGDZIE w kodzie.** Runda 2 Etapu 2 (pełne rozdzielenie Setów) **nigdy nie powstała** —
`git log --all --oneline | grep -i etap.2` nie pokazuje żadnego drugiego commita Etapu 2
poza tym jednym scaffoldem.

**Konsekwencja PRAKTYCZNA, poważniejsza niż "wyciek":** jeśli `switchActiveHuman(N)`
zostanie wywołane z `N` nieobecnym w `exploredByHuman`, linia 10142
(`exploredByHuman.get(ME())!`) zwróci `undefined`, a wywołanie `addExplored(undefined, vis)`
**rzuci wyjątek w trakcie `refreshFog()`** — to nie jest scenariusz "info leak", to jest
**CRASH**. Jedyny bezpieczny sposób wywołania `switchActiveHuman(N)` z DRUGIM prawdziwym
fotelem to najpierw `exploredByHuman.set(N, new Set())` (osobny, PUSTY Set — fotel N
zaczyna bez mgły odkrytej, poprawnie) — **to MUSI być pierwszym krokiem ciała
`switchActiveHuman()`, nie założeniem, że dane już tam są.**

### 1e. Minimapa — DOBRA WIADOMOŚĆ, plan miał TU nieaktualny numer linii

Plan (§A1) cytuje `main.ts:9702, 9711` jako miejsca, gdzie rzekomo "main.ts przekazuje
literał `0`" do funkcji minimapy/widoczności. **Świeży odczyt dzisiejszego wywołania
`getMinimapData` (main.ts:21436-21461) pokazuje to DAWNO NAPRAWIONE:**
```ts
getMinimapData: () => {
  const vis = currentVisible();
  return getMinimapData(map, cameraGroundTarget(), cities.map(...), units.map(...), {
    visible: vis,
    explored: fogExploredForRender(),
    playerOwnerId: ME(),      // 21458 — NIE literał 0
    fogOn,
  });
},
```
**Minimapa jest już w pełni hot-seat-gotowa, zero pracy Etapu 5 tu potrzebnej** — to
kolejne potwierdzenie, że numery linii z planu (napisanego przed Etapem 2) są stare i że
Etap 2 faktycznie objął minimapę, mimo że własny komentarz w kodzie Etapu 2 (§1d wyżej)
przyznaje niedokończone rozdzielenie Setów gdzie indziej — te dwa fakty nie są sprzeczne
(dostęp/parametr jest gotowy, dane leżące pod spodem nadal współdzielone).

### 1e-bis. Odkryty WZORZEC SYSTEMOWY: trzy mapy `XByHuman` — wszystkie mają TĘ SAMĄ, jeszcze nie zauważoną w planie lukę

Świeży grep `HUMAN_OWNER_PRIMARY` w main.ts pokazuje **trzy** mapy zbudowane wg identycznego
wzorca "jeden wpis, aliasujący istniejący singleton, reszta odłożona":
```
exploredByHuman:  Map<number, Set<string>>   @ 10375  — new Map([[HUMAN_OWNER_PRIMARY, explored]])
playerStateByHuman: Map<number, PlayerState> @ 10387  — new Map([[HUMAN_OWNER_PRIMARY, player]])
pracaPoolByHuman: Map<number, {praca:number}> @ 10395 — new Map([[HUMAN_OWNER_PRIMARY, playerPracaCell]])
```
`playerStateByHuman` ma DODATKOWO żywe konsumenty w akcesorach ekonomicznych Etapu 3
(potwierdzone, main.ts:1962, 26167-26280): `isHuman(ownerId) ? playerStateByHuman.get(ownerId)!.X
: aiXByOwner.get(ownerId)`. **Ten wzorzec jest bezpieczny TYLKO DLATEGO, że `isHuman(ownerId)`
dziś zawsze implikuje `ownerId===HUMAN_OWNER_PRIMARY`** (bo `humanOwnerIds` ma jeden
element) — **w momencie, gdy `humanOwnerIds` faktycznie zyska drugi element (co jest
CAŁYM celem hot-seatu), `isHuman(N)` zwróci `true` dla nowego fotela, ale
`playerStateByHuman.get(N)!` będzie `undefined.skarbiec` → CRASH**, dokładnie tej samej
natury co ryzyko fog z §1d. **To jest odkrycie tej rundy, nieobecne explicite w planie ani
w dyspozycji** — plan mówił o "Etapie 3: akcesory ekonomiczne JUŻ per-owner" jako o rzeczy
zamkniętej; w rzeczywistości akcesory są gotowe NA PRZYJĘCIE drugiego wpisu, ale nikt jeszcze
nie napisał kodu, który by ten wpis WSTAWIŁ.

**Wniosek zbiorczy dla §1d/1e-bis: `switchActiveHuman(newOwnerId)` musi, jako pierwszy krok
(przed jakimkolwiek `refreshFog`/`updateHud`), upewnić się, że WSZYSTKIE TRZY mapy
`XByHuman` mają wpis dla `newOwnerId` — a jeśli nie mają, UTWORZYĆ świeży, pusty/startowy
wpis (nowy `Set()`, nowy `createPlayerState()`, `{praca:0}`), NIE crashować i NIE
alias'ować cudzego obiektu.** To jest twardy prerekwizyt implementacyjny, którego brak w
projekcie z dyspozycji (GOAL pkt 2 mówi tylko "ustawia `humanSeats.activeHumanOwnerId`") —
bez tego kroku `switchActiveHuman()` działałby WYŁĄCZNIE w trybie 1-fotelowym (no-op na
`ME()===0` zawsze), czyli nigdy nie zostałby faktycznie przetestowany na drugim fotelu.

---

## 2. Projekt `switchActiveHuman(newActiveOwnerId: number): void`

Lokalizacja: nowa funkcja wewnątrz domknięcia `main.ts` (obok `ME()`/`isHuman()`,
~10360-10400), **BEZ eksportu, BEZ call-site'u produkcyjnego w tej rundzie** — dokładnie
wzorzec Etapu 0 (`human-owners.ts` istniał "martwy" zanim cokolwiek go wołało).

```ts
function switchActiveHuman(newActiveOwnerId: number): void {
  if (newActiveOwnerId === humanSeats.activeHumanOwnerId) return; // no-op, nie ma do kogo przełączać

  // KROK 0 (prerekwizyt z §1d/§1e-bis — MUSI być pierwszy, inaczej refreshFog()/akcesory
  // ekonomiczne crashują na undefined dla fotela, który nigdy wcześniej nie był aktywny):
  if (!exploredByHuman.has(newActiveOwnerId)) exploredByHuman.set(newActiveOwnerId, new Set());
  if (!playerStateByHuman.has(newActiveOwnerId)) playerStateByHuman.set(newActiveOwnerId, createPlayerState());
  if (!pracaPoolByHuman.has(newActiveOwnerId)) pracaPoolByHuman.set(newActiveOwnerId, { praca: 0 });

  // KROK 1 — zamknij WSZYSTKIE panele/modale aktywnego (starego) fotela. Zamyka, NIE
  // przywraca (kryterium planu: "żaden panel poprzednika"). Kolejność: najpierw
  // blokujące modale end-turn/bitwy, potem panele HUD, na końcu menu.
  if (isPreBattleOpen()) hidePreBattle();
  if (isDiplomacyAudienceOpen()) hideDiplomacyAudience();
  if (isDiploListHudOpen()) hideDiploListHud();
  hideCityPanel();
  hideEmpireDetailPanel();
  hideSiegeMapPanel();
  hideArmyMergePanel();
  hideArmyMergePickPanel();
  hideArmySplitPanel();
  hideArmyListHud();
  hideCityListHud();
  hideDiplomacyPanel();
  hideGamePauseMenu();
  hideHexContextPanel();
  hideMainMenu();
  hideSaveLoadDialog();
  hideScienceHubHud();
  hideWikiHubHud();
  document.getElementById('civ-elim-notice-host')?.remove(); // wzorzec z closeAll() @ 22031

  // KROK 1b (DOPISANE runda 2, Evaluator zarzut #1, §1c-bis) — wygaś globalny toast
  // #civ-hint-toast RĘCZNIE (hideHintMessage() NIE ISTNIEJE — jedyne wygaszenie w
  // dzisiejszym kodzie to własny setTimeout showHintMessage(), main.ts:13141-13179).
  // Bez tego kroku tekst hint-a specyficzny dla akcji fotela A (np. "Za mało rekrutów...")
  // zostaje widoczny fotelowi B aż do (do 4500ms) wygaśnięcia timera.
  if (hintOverrideTimer !== null) { clearTimeout(hintOverrideTimer); hintOverrideTimer = null; }
  hintToast.style.display = 'none';

  // KROK 1c (DOPISANE runda 2, Evaluator zarzut #2, §1c-ter) — zamknij globalny
  // build-mode/found-city-mode (main.ts:2513, 11457-11459), którego §1c rundy 1 pominęło
  // (grep po wzorcu nazw `hide*` strukturalnie go nie widział). Ryzyko WYŻSZE niż
  // info-leak: bez tego fotel B pierwszym kliknięciem na mapie przejmuje i wykonuje
  // NIEDOKOŃCZONĄ akcję budowy/założenia miasta fotela A.
  exitBuildMode(); // gałąź guard-false (isAwaitingFirstPlayerCity()===false): TO wywołanie
  // faktycznie czyści wizualia + popOverlay('build-mode') — main.ts:12456-12471, ciało
  // odczytane w całości. W gałęzi PONIŻEJ (guard-true) exitBuildMode() jest NO-OPEM
  // (main.ts:12462, `if (isAwaitingFirstPlayerCity()) return;` PRZED jakąkolwiek z tych
  // linii) — więc blok if niżej NIE jest "na wszelki wypadek dodatkowym resetem", tylko
  // JEDYNYM miejscem, które w tej gałęzi w ogóle coś czyści.
  //
  // exitBuildMode() jest NO-OPEM (main.ts:12462), gdy isAwaitingFirstPlayerCity()
  // jest prawdą (invariant R-PIERWSZE-MIASTO) — realistyczny scenariusz wczesnej gry
  // hot-seat. Świadome, udokumentowane ODSTĄPIENIE od tego invariantu W KONTEKŚCIE
  // handoff (DECYZJA DO POTWIERDZENIA ABC — p. §1c-ter/§6 pkt 6): wymuś reset wprost,
  // jeśli "grzeczna" ścieżka się nie wykonała — TU MUSIMY ODTWORZYĆ RĘCZNIE dokładnie to,
  // co exitBuildMode() zrobiłoby PO guardzie, nie tylko podzbiór.
  //
  // KROK 1c POPRAWKA runda 3 (Evaluator runda 2, zarzut #2 NOWY): runda 2 odtwarzała
  // tu WYŁĄCZNIE 4 zmienne stanu (12463-12466), pomijając clearBuildModeVisuals() (12467)
  // i popOverlay('build-mode') (12471) — obie normalnie wołane przez exitBuildMode() PO
  // guardzie, ale w tej gałęzi (guard-true) nigdy nie wykonane. Bez clearBuildModeVisuals()
  // → removeBuildGhosts() (main.ts:11821-11836) nie chowa #civ-build-ghost-chip
  // (main.ts:11768-11778, realny widoczny DOM pozycjonowany na ekranie względem kursora,
  // zostawiony na 'flex' jeśli mysz była nad mapą w build-mode) ani ghostGroup/
  // ghostCityGroup w scenie THREE.js ani mineEligibleGroup — duszek budowy/miasta fotela A
  // MOŻE zostać widoczny na ekranie fotela B. Bez popOverlay('build-mode') → wpis
  // {id:'build-mode', onClose:()=>exitBuildMode()} (main.ts:12474-12476) zostaje na
  // wspólnym, globalnym escapeOverlayStack (gra/src/ui/escapeOverlayStack.ts, stos
  // WSPÓLNY dla wszystkich foteli) — pierwszy Escape fotela B trafia w ten stary wpis
  // fotela A, dopóki fotel B sam nie wejdzie w build-mode (pushOverlay dedupluje po id,
  // nic innego go nie zdejmie). Precedens JUŻ ISTNIEJĄCY w main.ts (reset build-mode przy
  // nowej grze, main.ts:34305-34309, świeżo zweryfikowany), pokazujący dokładnie ten sam
  // wzorzec "resetuj build-mode BEZ przechodzenia przez exitBuildMode()":
  //   buildModeOpen = false; popOverlay('build-mode'); activeImprovementKey = null;
  //   resetMapOverlayToggleDefaults(); clearBuildModeVisuals();
  // — dowodzi, że popOverlay('build-mode') i clearBuildModeVisuals() są częścią WZORCA
  // twardego resetu, nie opcją. `refreshBuildApi()`/`refreshBuildHighlight()`/
  // `refreshD1bHud()` (pozostałe trzy linie ciała exitBuildMode() po guardzie, 12468-12470)
  // NIE są tu potrzebne osobno: `refreshD1bHud()` to alias `updateHud` (main.ts:646,
  // `import { updateHud as refreshD1bHud } from './ui/hud'`) — już wołane w KROK 7 niżej;
  // `refreshBuildHighlight()` tylko czyści highlight/mine-overlay w gałęziach, które
  // clearBuildModeVisuals() już czyści wprost (unitRenderer.clearHighlight() +
  // clearMineEligibleOverlay(), main.ts:12350-12354) — wołanie obu byłoby zbędnym
  // duplikatem, nie brakiem; `refreshBuildApi()` przelicza dostępność budowy dla fotela
  // ODCHODZĄCEGO (wciąż ownerId hardkodowany na '0' wewnątrz, main.ts:12261/12262 —
  // osobny dług, poza zakresem tej poprawki), więc wołanie go tutaj nie miałoby sensu
  // przed KROK 4 (przełączenie fotela) i tak.
  if (isAwaitingFirstPlayerCity()) {
    buildModeOpen = false;
    foundCityMode = false;
    activeImprovementKey = null;
    activeWonderId = null;
    clearBuildModeVisuals(); // main.ts:12350-12354 — chowa ghostChip/ghostGroup/
    // ghostCityGroup/mineEligibleGroup; BEZ tego duszek budowy fotela A może zostać
    // widoczny fotelowi B (patrz komentarz wyżej).
    popOverlay('build-mode'); // gra/src/ui/escapeOverlayStack.ts — zdejmuje wpis fotela A
    // ze WSPÓLNEGO stosu Escape; BEZ tego pierwszy Escape fotela B trafia w martwy wpis
    // fotela A (patrz komentarz wyżej).
  }

  // KROK 2 — zaznaczenie/marsze/kamera: zamknij, nie przywracaj (kryterium planu).
  clearPlayerUnitSelectionStateOnly();
  selectedId = null;
  plannedMarches.clear();

  // KROK 3 — dzienniki zdarzeń: WYCZYŚĆ (nie filtruj — patrz §1b, filtrowanie niemożliwe
  // bez tagu ownerId na SidePanelEvent). Wzorzec identyczny do
  // __sidePanelLinkTestDebug.seedEvents() @ 21987-21994 (warEventLog.length = 0).
  warEventLog.length = 0;
  villageEventLog.length = 0;
  tradeRouteEventLog.length = 0;
  rationAutoEventLog.length = 0;
  borderMarchEventLog.length = 0;
  dismissedSidePanelEventIds.clear();
  deferredPlayerUnitRevealIds.clear();
  deferredMergePrompts.length = 0;
  deferredEotHints.length = 0;
  pendingAutoRationForNextTurn = null;

  // KROK 4 — przełącz fotel (TU, po zamknięciu/wyczyszczeniu powyżej, PRZED refreshem
  // niżej — refreshFog()/updateHud() muszą już widzieć NOWEGO aktywnego, inaczej
  // przeliczą fotel odchodzący).
  humanSeats = { ...humanSeats, activeHumanOwnerId: newActiveOwnerId };

  // KROK 5 — invalidacja cache'y HUD (§1a). Zerowanie, NIE przeliczanie — patrz
  // ZNALEZISKO KRYTYCZNE §1a: refreshLiveEmpireRatesUnsafe() jest dziś zahardkodowana
  // na ownerId===0 i przeliczy DALEJ dane fotela 0, jeśli nie zostanie osobno
  // zamigrowana na ME() (poza zakresem tej rundy — flagowane do decyzji ABC).
  _lastPraca = 0; _lastPracaUpkeep = 0; _lastPracaAutoUlepszeniaKoszt = 0;
  _lastPracaCudaKoszt = 0; _lastKultura = 0; _lastPracaRate = 0;
  _lastKulturaRate = 0; _lastPieniadzRate = 0; _lastWealthLevel = 1;
  _lastWealthMnoznik = 1; _lastNaukaRate = 0; _lastLudnoscRate = 0;
  _lastBogactwoRate = 0; _lastBogactwoHandel = 0;
  _lastBogactwoUtrzymanieBudynkow = 0; _lastBogactwoUtrzymanieJednostek = 0;
  _lastBogactwoUtrzymanieSurowcow = {}; _lastPlayerCityEcon = [];
  _pracaRateFreshFromEndTurn = false; _liveFoodBrutto = 0;
  markCityStateDirty(); // empireEconDirty=true, powerDirty=true, _maxSafeRationCache.clear()

  // KROK 6 — kamera: skok na stolicę nowego aktywnego (funkcja JUŻ generyczna po
  // ownerId, main.ts:26316 focusCameraOnOwnerCapital — ŻADNA nowa "pamięć kamery per
  // fotel" nie jest potrzebna wbrew sugestii planu A8 "nowa funkcjonalność").
  focusCameraOnOwnerCapital(newActiveOwnerId);

  // KROK 7 — odśwież widoki zależne od ME(): fog/minimapa/HUD są już w pełni
  // sparametryzowane (§1d/§1e) — samo wywołanie wystarcza.
  refreshFog();
  updateHud();
}
```

**Uzasadnienie kolejności KROK 3 przed KROK 4:** czyszczenie logów NIE zależy od tego,
który fotel jest aktywny (czyścimy bezwarunkowo), więc kolejność względem KROKU 4 nie ma
znaczenia funkcjonalnego DLA TEGO kroku — ale KROK 5 (zerowanie `_last*`) i KROK 6/7
(kamera/fog/HUD) **muszą** iść PO KROKU 4, inaczej `ME()` w `refreshFog()`/
`focusCameraOnOwnerCapital` nadal zwróci starego ownera.

**Rzeczy z GOAL pkt 1, o których świadomie NIE robię nic w tej funkcji, z uzasadnieniem:**
- `_maxSafeRationCache` (Map keyed by cityId, nie ownerId) — już inwalidowana globalnie
  przez `markCityStateDirty()` (KROK 5), nie potrzebuje osobnego resetu (miasta mają
  unikalne id niezależnie od właściciela, nie ma czego "przeciekać" między fotelami przez
  TEN konkretny cache).
- `checkVeteranEnemyFirstEncounter`'s `u.ownerId === 0` hardkod (§1b) — **NIE naprawiam
  tutaj** (to jest zmiana zachowania wewnątrz `refreshFog()`, poza zakresem "projekt
  `switchActiveHuman()`", i dotyka pliku, który recon Etapu 4 już analizował z innego
  powodu) — zgłaszam jako dług w §6, nie milczę.

---

## 3. Projekt `ui/hotSeatHandoff.ts`

### 3.1 Precedens — `preBattle.ts`, zweryfikowany jako bezpieczny wzorzec

`showPreBattle()` (`ui/preBattle.ts:209-258`, przeczytane w całości) robi dokładnie:
```ts
hidePreBattle();
showMapScrim();                          // scrim: document.createElement + appendChild(body)
overlayEl = buildOverlay(info, cb, opts); // treść: document.createElement + appendChild(body)
document.body.appendChild(overlayEl);
...
pushOverlay('pre-battle', handlePreBattleEscape);  // ui/escapeOverlayStack.ts — stos Escape
```
`ui/escapeOverlayStack.ts` (przeczytany w całości) to gotowy, reużywalny mechanizm: stos
nakładek + `Keyboard Lock API` na Escape + globalny listener. **`hotSeatHandoff.ts`
powinno wołać `pushOverlay('hot-seat-handoff', ...)`/`popOverlay('hot-seat-handoff')`
zamiast wynajdywać własny mechanizm Escape/z-index-warstw.**

### 3.2 Dlaczego "miganie poprzedniego widoku między klatkami" NIE jest realnym ryzykiem, JEŚLI zachowana jedna zasada

JavaScript w przeglądarce jest single-threaded: **przeglądarka nie może wymalować klatki
w trakcie wykonywania synchronicznego kodu** — malowanie (paint) czeka na pierwszy moment,
w którym stos wywołań wraca do pustego (koniec taska/mikrotaska). `showPreBattle()` montuje
scrim + overlay **synchronicznie, w jednym wywołaniu**, więc mimo że stan gry (dane bitwy)
mógł się zmienić tuż przed, użytkownik NIGDY nie widzi klatki "pomiędzy" — albo widzi stary
ekran (przed wywołaniem), albo już z overlayem (po). **Ta sama własność chroni
`hotSeatHandoff` — pod jednym warunkiem, którego `showPreBattle()` też przestrzega:
montowanie overlay'a musi się zdarzyć PRZED pierwszym `await`/`setTimeout` w funkcji, która
je wywołuje**, nie "gdzieś w środku" po jakimś asynchronicznym kroku.

**Weryfikacja względem realnego call-site'u `triggerPlayerEndTurn()` (main.ts:28643,
przeczytane 28643-28660 tej rundy):** ciało to `function triggerPlayerEndTurn(): void {
healStuckDeferredPreBattleQueueOnEndTurnAttempt(); if (!canPlayerInitiateEndTurn())
{...return;} ...` — **synchroniczne aż do (potwierdzonego w recon Etapu 4, wciąż aktualne
strukturalnie) `void (async () => {...})()` startującego dalej**. Przyszły
`advanceSeat()` (Etap 4b, NIE zaimplementowany — patrz §5) analogicznie: dopóki wywołanie
`showHotSeatHandoff()` znajdzie się na SAMYM POCZĄTKU ciała `advanceSeat()` (albo w
synchronicznej gałęzi PRZED jakimkolwiek `await`), zero ryzyka wycieku klatki — to nie
wymaga NOWEGO mechanizmu synchronizacji, tylko DYSCYPLINY KOLEJNOŚCI w miejscu wywołania,
analogicznie do tego, jak `showPreBattle()` już to robi.

**Jedyny scenariusz realnego ryzyka:** gdyby `switchActiveHuman()` (KROK 7, `refreshFog()`)
zawierało jakikolwiek `await` PRZED zamontowaniem overlay'a — świeży odczyt §2 potwierdza,
że **`switchActiveHuman()` zaprojektowana wyżej jest CAŁKOWICIE synchroniczna** (zero
`await`/`Promise`/`setTimeout` w żadnym z 7 kroków — wszystkie wołane funkcje,
`refreshFog`/`updateHud`/`focusCameraOnOwnerCapital`, są dziś synchroniczne, potwierdzone
sygnaturami `: void` przy odczycie). To oznacza: **kolejność `showHotSeatHandoff()` →
`switchActiveHuman(N)` → (czekaj na klik) → `hideHotSeatHandoff()` jest bezpieczna, ale
RÓWNIEŻ kolejność odwrotna (`switchActiveHuman(N)` → `showHotSeatHandoff()` → czekaj →
ukryj) jest bezpieczna** — bo cała `switchActiveHuman()` mieści się w jednym
mikrotasku, przeglądarka i tak nie zdąży wymalować nic pomiędzy. **Rekomendacja:
`showHotSeatHandoff()` PIERWSZE mimo to** — nie dla bezpieczeństwa (oba porządki są
bezpieczne z powodu wyżej), tylko dla UX: overlay z tekstem "Przekazanie kontroli..."
powinien poprzedzać jakikolwiek błysk przeliczeń HUD, nie następować po nim, żeby gracz
nie zobaczył nawet KOŃCOWEGO (poprawnego) stanu fotela N przed kliknięciem "kontynuuj" —
zgodnie z duchem dyspozycji ("MIĘDZY switchActiveHuman() a odsłonięciem HUD").

### 3.3 Kontrakt modułu (projekt, zero implementacji)

```ts
// ui/hotSeatHandoff.ts
export interface HotSeatHandoffInfo {
  fromLabel: string;   // np. "Gracz 1" / nazwa cywilizacji fotela odchodzącego
  toLabel: string;     // np. "Gracz 2"
  toCivIconId?: string; // ikona cywilizacji nowego aktywnego — spójność z civIconSvg (preBattle.ts wzorzec)
}
export function showHotSeatHandoff(info: HotSeatHandoffInfo, onContinue: () => void): void;
export function hideHotSeatHandoff(): void;
export function isHotSeatHandoffOpen(): boolean;
```
Wewnętrznie: `document.createElement('div')` pełnoekranowy (`position:fixed; inset:0;
z-index:` WYŻSZY niż `pb-map-scrim`/`preBattle` overlay (sprawdzić realną wartość z-index
w `preBattle.ts`/CSS przy implementacji — handoff musi przykryć WSZYSTKO, w tym ewentualny
niedomknięty modal, jako ostatnia linia obrony), treść: nazwa/ikona nowego fotela + przycisk
"Kliknij aby kontynuować" (klik → `onContinue()` → wołający `hideHotSeatHandoff()`).
`pushOverlay('hot-seat-handoff', () => {/* Escape = brak akcji, ekran NIE może być pominięty
bez kliknięcia — inaczej gracz 2 mógłby Escape'ować prosto do stanu gracza 1 zanim
switchActiveHuman zdąży (patrz §3.2, w praktyce nieistotne, bo switchActiveHuman jest
synchroniczne, ALE Escape nie powinien w ogóle być dostępną drogą ucieczki z tego
konkretnego overlaya, bezpieczeństwo przez politykę, nie tylko przez fizykę silnika)*/})`.

---

## 4. Plan dowodu "no leak" (GOAL pkt 4)

### 4.1 Rozstrzygnięcie headless-Node vs Chromium — **Chromium, z konkretnym uzasadnieniem z ISTNIEJĄCEGO precedensu, nie hipotezą**

Recon Etapu 4 (§6.2) **proponował** czysty headless Node (esbuild bundle + hash
`buildSaveGameSnapshot()`). Ale **`gra/tools/hotseat-etap4-noop-test.cjs` (już
NAPISANY I PASS, `R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1`), świeżo przeczytany w całości tej
rundy, pokazuje że w PRAKTYCE ta propozycja została ODRZUCONA przez samego wykonawcę
Etapu 4** — cytat z docstringu tego pliku (main.ts nie jest modułem, cała logika żyje w
jednym domknięciu):
> *"`tools/logic-test.cjs` (esbuild bundle czystych funkcji) NIE pokrywa pełnego
> silnika/EOT; jedyny sposób odpalenia PRAWDZIWEGO `triggerPlayerEndTurn()` to realny
> `vite build` + realny headless Chromium."*

**To samo dotyczy `switchActiveHuman()`/`hotSeatHandoff.ts` — W JESZCZE WIĘKSZYM STOPNIU:**
w przeciwieństwie do `triggerPlayerEndTurn()` (głównie logika), `switchActiveHuman()`
(§2) w WIĘKSZOŚCI kroków dotyka bezpośrednio DOM (`document.getElementById`,
`hideXPanel()` manipulujące realnymi elementami) i THREE.js (`refreshFog()` →
`cityRenderer.applyFogVisibility`, `syncCampMeshes`, `wonderRenderer` — obiekty sceny
3D), a `hotSeatHandoff.ts` SAM W SOBIE jest czystym modułem DOM/CSS. **Headless Node bez
przeglądarki nie ma jak zweryfikować ANI DOM-owej, ANI THREE.js-owej części tego zakresu
— rozstrzygnięcie: Chromium (Playwright), rozszerzenie ISTNIEJĄCEGO, już dowiedzionego
harnessu `hotseat-etap4-noop-test.cjs`, nie budowa od zera.**

### 4.2 Proponowany plik i mechanizm: `gra/tools/hotseat-etap5-no-leak-test.cjs`

Reużyj z `hotseat-etap4-noop-test.cjs` (ten sam plik, ten sam wzorzec, potwierdzone
funkcje): `buildBundle()` (realny `vite build` do `os.tmpdir()`, C-001-zgodny),
`launchBrowser()` (Playwright Chromium + fallback `FALLBACK_CHROME` ze
swiftshaderem), `runOnceWithRetry`/`closeBrowserSafely` (odporność na crash/zawis
headless Chromium — Evaluator Etapu 4 to wymusił, nie pomijać).

**NOWY hak testowy potrzebny w `main.ts`** (implementacja, nie ta runda — recon-only) —
wzorzec identyczny do `__sidePanelLinkTestDebug`/`__eraTestDebug`/`__musicEraTestDebug`
(main.ts:21987+, 21630, 22053 — WSZYSTKIE trzy świeżo potwierdzone jako ten sam wzorzec:
"Hak testowy... wołany WYŁĄCZNIE z Playwright..."):
```ts
(window as any).__hotSeatTestDebug = {
  // Wstrzyknij drugi fotel + syntetyczny, RÓŻNY stan gry (bez tego test nie ma czego
  // porównywać — Etap 7, drugi fotel w kreatorze, jeszcze nie istnieje, więc jedyna
  // droga do stanu 2-fotelowego W TEŚCIE jest przez ten hak, nie przez normalną grę).
  seedSecondSeat: (ownerId: number, opts: { exploredKeys?: string[]; skarbiec?: number }): void => {
    humanSeats = { humanOwnerIds: [...humanSeats.humanOwnerIds, ownerId], activeHumanOwnerId: humanSeats.activeHumanOwnerId };
    exploredByHuman.set(ownerId, new Set(opts.exploredKeys ?? []));
    const ps = createPlayerState();
    if (opts.skarbiec !== undefined) ps.skarbiec = opts.skarbiec;
    playerStateByHuman.set(ownerId, ps);
    pracaPoolByHuman.set(ownerId, { praca: 0 });
  },
  switchActiveHuman: (ownerId: number): void => switchActiveHuman(ownerId),
  // Odczyt stanu widocznego dla asercji "no leak" — rozszerzenie
  // __sidePanelLinkTestDebug.openViews() (22012) o WSZYSTKIE 17 paneli z §1c + fog/kamera.
  snapshotVisibleState: (): Record<string, unknown> => ({
    activeHumanOwnerId: humanSeats.activeHumanOwnerId,
    exploredKeysForActive: [...(exploredByHuman.get(ME()) ?? [])],
    selectedId,
    plannedMarchesSize: plannedMarches.size,
    cameraFocus: camCtrl.getFocusState(),
    warEventLogLen: warEventLog.length,
    villageEventLogLen: villageEventLog.length,
    openPanels: {
      cityPanel: isCityPanelOpen(), preBattle: isPreBattleOpen(),
      diplomacyAudience: isDiplomacyAudienceOpen(), diploList: isDiploListHudOpen(),
      empirePanel: isEmpireDetailPanelOpen(), siegeMap: isSiegeMapPanelOpen(),
      armyMerge: isArmyMergePanelOpen(), armyMergePick: isArmyMergePickPanelOpen(),
      armySplit: isArmySplitPanelOpen(), mainMenu: isMainMenuOpen(),
      /* + pozostałe is*Open() z §1c, do skompletowania w rundzie implementacji */
    },
    hotSeatHandoffOpen: isHotSeatHandoffOpen(),
    // DOPISANE runda 2 (Evaluator zarzuty #1/#2, §1c-bis/§1c-ter) — bez tych dwóch pól
    // test nie łapie ANI wycieku toastu, ANI odziedziczonego trybu budowy.
    hintToastVisible: hintToast.style.display !== 'none',
    buildModeOpen,
    foundCityMode,
    activeImprovementKey,
    activeWonderId,
    // DOPISANE runda 3 (Evaluator runda 2, zarzut #2 NOWY — KROK 1c był tylko
    // częściową poprawką) — bez tych DWÓCH pól §4.2 z rundy 2 przechodziłby zielono
    // mimo widocznego duszka budowy na ekranie fotela B (dokładnie luka, którą znalazł
    // Evaluator: 4 zmienne stanu wyzerowane, ale nic wizualnego/stosu Escape sprawdzone).
    ghostChipVisible: ghostChip.style.display !== 'none', // main.ts:11768-11778/11835
    escapeOverlayTopId: top()?.id ?? null, // gra/src/ui/escapeOverlayStack.ts `top()` —
    // NOWY import potrzebny obok już istniejącego `pushOverlay, popOverlay` (main.ts:1065)
    // w rundzie implementacji: `import { pushOverlay, popOverlay, top } from
    // './ui/escapeOverlayStack';`. `null`/inny id niż `'build-mode'` = brak przecieku
    // wpisu fotela A; `'build-mode'` widoczny tutaj PO switchActiveHuman() = dokładnie
    // regresja z zarzutu #2 rundy 2.
  }),
};
```

**Scenariusz testu:**
1. `vite build` + Chromium (jak Etap 4).
2. `__cityStateStartUnitsTestDebug.startNewGame('normal', N)` (ISTNIEJĄCY hak, main.ts
   ~22239, dowiedziony przez `hotseat-etap4-noop-test.cjs`) — realny bootstrap gry,
   zamiast reimplementować inicjalizację.
3. Kilka realnych ruchów/zaznaczeń jako "fotel A" (owner 0) — zaznacz jednostkę, otwórz
   panel miasta, przesuń kamerę, odkryj kawałek mapy przez normalny ruch — **realny stan,
   nie sztuczny**, żeby test wykrywał regresje w prawdziwych ścieżkach kodu, nie tylko w
   haku. **DOPISANE runda 2 (Evaluator zarzuty #1/#2):** dodatkowo wywołaj realną akcję
   wyzwalającą `showHintMessage(...)` (np. kliknij "Zastąp" bez dostępnych zamienników,
   main.ts:6193, tekst rozpoznawalny "Zastąp: brak dostępnych zamienników tego typu.") oraz
   wejdź w tryb budowy ulepszenia (`buildModeOpen=true`, `activeImprovementKey` ustawiony na
   realny klucz przez kliknięcie chipa budowy) — BEZ zamykania go przed krokiem 5, żeby
   test faktycznie łapał dziedziczenie obu stanów przez fotel B.
4. `window.__hotSeatTestDebug.seedSecondSeat(1, { exploredKeys: [inny, disjunktywny zestaw
   heksów niż fotel A], skarbiec: 12345 })` — fotel B z CELOWO różnym, rozpoznawalnym
   stanem.
5. `window.__hotSeatTestDebug.switchActiveHuman(1)`.
6. `const snap = await page.evaluate(() => window.__hotSeatTestDebug.snapshotVisibleState())`.
7. **Asercje PASS/FAIL, każda z konkretnym warunkiem, nie "powinno wyglądać dobrze":**
   - `snap.activeHumanOwnerId === 1`.
   - `snap.selectedId === null` (zaznaczenie fotela A NIE przetrwało).
   - `snap.plannedMarchesSize === 0`.
   - `snap.exploredKeysForActive` **równe DOKŁADNIE** zbiorowi wstrzykniętemu w kroku 4
     (nie zawiera ŻADNEGO klucza z eksploracji fotela A z kroku 3 — to jest TEN test,
     który realnie łapie "wyciek mgły").
   - `snap.warEventLogLen === 0` i `snap.villageEventLogLen === 0` (logi wyczyszczone,
     zero wpisów z sesji fotela A widocznych fotelowi B).
   - Każdy klucz w `snap.openPanels` === `false` (żaden panel fotela A nie przetrwał —
     w tym panel otwarty w kroku 3).
   - `snap.cameraFocus` odpowiada stolicy fotela B, NIE pozycji ustawionej w kroku 3 dla
     fotela A (porównanie z `hexToWorld(capitalQ_B, capitalR_B)` — wzorzec
     `__sidePanelLinkTestDebug.hexToWorld` @ 22022, już istnieje).
   - **DOPISANE runda 2 (Evaluator zarzut #1):** `snap.hintToastVisible === false` (toast
     hint-a fotela A z kroku 3 NIE jest widoczny fotelowi B).
   - **DOPISANE runda 2 (Evaluator zarzut #2):** `snap.buildModeOpen === false`,
     `snap.foundCityMode === false`, `snap.activeImprovementKey === null`,
     `snap.activeWonderId === null` (tryb budowy wszczęty w kroku 3 przez fotela A NIE
     przetrwał handoff — to jest test, który realnie łapie przejęcie niedokończonej akcji
     budowy, zgodnie z zarzutem Evaluatora).
   - **DOPISANE runda 3 (Evaluator runda 2, zarzut #2 NOWY):** `snap.ghostChipVisible ===
     false` i `snap.escapeOverlayTopId !== 'build-mode'` (patrz jednak SCENARIUSZ B niżej —
     w TYM scenariuszu, owner 0 już ma miasto po `startNewGame`, więc build-mode wszczęty w
     kroku 3 idzie przez gałąź `isAwaitingFirstPlayerCity()===false`, czyli `exitBuildMode()`
     bez guarda — to jest scenariusz, który KROK 1c z rundy 1/2 już poprawnie obsługiwał.
     Asercje tu są regresyjne, nie są tym testem, który łapie zarzut Evaluatora rundy 2 —
     ten jest w SCENARIUSZU B).

### SCENARIUSZ B (NOWY, runda 3, Evaluator zarzut #2) — build-mode w gałęzi
`isAwaitingFirstPlayerCity()===true`, uruchamiany OSOBNO od Scenariusza A wyżej, bo Scenariusz
A nie ćwiczy tej gałęzi (owner 0 tam już ma miasto):

B1. `vite build` + Chromium (jedno uruchomienie przeglądarki, nowa strona/reload między
    Scenariuszem A i B, żeby stan gry nie mieszał się między nimi).
B2. `__cityStateStartUnitsTestDebug.startNewGame('normal', N)` — świeży bootstrap, PRZED
    założeniem jakiegokolwiek miasta przez fotel A (bez dodatkowych kroków zakładania miasta,
    które automatyczny bootstrap mógłby wykonać — do potwierdzenia w rundzie implementacji,
    czy `startNewGame` zostawia gracza bez miasta czy z nim; jeśli bootstrap ZAWSZE daje
    miasto startowe, potrzebny będzie hak testowy czyszczący `cities`/`playerEverOwnedCity`
    wprost, analogicznie do `seedSecondSeat`, żeby wymusić `isAwaitingFirstPlayerCity()
    ===true` deterministycznie — flagowane tu jako TODO implementacji, nie rozstrzygnięte w
    tej rundzie recon).
B3. Zweryfikuj w evaluate: `isAwaitingFirstPlayerCity() === true` (wymaga wystawienia tej
    funkcji na `__hotSeatTestDebug` obok `switchActiveHuman`/`snapshotVisibleState` —
    dopisać do haka w rundzie implementacji) — bez tej asercji Scenariusz B mógłby po cichu
    wykonać się w złej gałęzi, dokładnie tak jak Scenariusz A.
B4. Wejdź w tryb zakładania miasta/budowy jako fotel A: klik chipa/kontrolki zakładania
    miasta tak, by `foundCityMode=true` (lub `buildModeOpen=true` + `activeImprovementKey`),
    i przesuń kursor nad heksem mapy tak, by `ghostChip.style.display` faktycznie przeszło na
    `'flex'` (main.ts, handler ruchu myszy nad mapą w build-mode — ustawia to bezwarunkowo
    przy hover, potwierdzić dokładny handler w rundzie implementacji) — bez tego kroku
    `ghostChipVisible` byłoby fałszywie `false` NIEZALEŻNIE od poprawki, i test nic by nie
    dowodził.
B5. `window.__hotSeatTestDebug.seedSecondSeat(1, {...})`.
B6. `window.__hotSeatTestDebug.switchActiveHuman(1)`.
B7. `const snap = await page.evaluate(() => window.__hotSeatTestDebug.snapshotVisibleState())`.
B8. **Asercje, specyficzne dla tej gałęzi:**
    - `snap.buildModeOpen === false`, `snap.foundCityMode === false`,
      `snap.activeImprovementKey === null`, `snap.activeWonderId === null` (te 4 przechodziły
      zielono JUŻ od rundy 2 — regresyjne, nie nowe).
    - `snap.ghostChipVisible === false` **(NOWA asercja runda 3 — to jest ta, która w
      rundzie 2 przeszłaby fałszywie zielono mimo widocznego duszka, bo pole nie istniało w
      `snapshotVisibleState()`)**.
    - `snap.escapeOverlayTopId !== 'build-mode'` **(NOWA asercja runda 3 — łapie martwy
      wpis fotela A na wspólnym `escapeOverlayStack`)**.

8. **Dowód "brak migotania"** (uzupełnienie §3.2 REALNYM pomiarem, nie tylko
   argumentem teoretycznym): `page.evaluate` synchronicznie woła
   `showHotSeatHandoff(...); switchActiveHuman(1);` W JEDNYM wywołaniu `evaluate` (co
   gwarantuje wykonanie w jednym tasku przeglądarki) i OD RAZU (bez `await` między) czyta
   `document.querySelector('.hot-seat-handoff-overlay').getBoundingClientRect()` +
   `getComputedStyle(...).zIndex` — potwierdza że overlay pokrywa `innerWidth`x`innerHeight`
   i ma z-index wyższy niż canvas/HUD, W TYM SAMYM evaluate co przełączenie stanu (żaden
   `await page.waitForTimeout` między nimi, który dałby przeglądarce szansę na
   niekontrolowany paint) — to jest realna, wykonywalna weryfikacja twierdzenia z §3.2,
   nie sama teoria.

**Kryterium PASS: WSZYSTKIE asercje kroku 7 i 8 zielone. Jakakolwiek FAŁSZ = FAIL z
nazwą pola, które przeciekło.**

---

## 5. Nakładanie z Etapem 4b (GOAL pkt 5)

**Odpowiedź: NIE, `switchActiveHuman()`/`hotSeatHandoff.ts` NIE wymagają, żeby
`advanceSeat()` już istniał — potwierdzone przez sam projekt §2/§3, zero odwołania do
`advanceSeat`/`endActiveHumanTurn`/`runWorldEndTurn` w ciele którejkolwiek z dwóch nowych
funkcji.** Obie są wołalne i w pełni testowalne (§4) przez bezpośrednie wywołanie z
Playwright (`__hotSeatTestDebug.switchActiveHuman(...)`), dokładnie jak `human-owners.ts`
(Etap 0) był testowalny (`hotseat-human-owners-test.cjs`) zanim cokolwiek w main.ts go
wołało.

**Ale (nieujęte w pytaniu dyspozycji wprost, więc dopisuję jako doprecyzowanie, nie
milczę o tym) — istnieje INNA zależność, nie od Etapu 4b, tylko od NIEDOKOŃCZONEJ części
Etapu 2/Etapu 3 (§1d, §1e-bis):** samo NAPISANIE `switchActiveHuman()` nie zależy od
niczego więcej, ale **UŻYTECZNE, DWU-FOTELOWE URUCHOMIENIE jej (czy to w teście z §4, czy
docelowo w grze) zależy od kroku 0 tej funkcji** (seed trzech map `XByHuman` dla nowego
ownera) — który sama `switchActiveHuman()` już zawiera (§2, KROK 0), więc **funkcjonalnie
zależność jest zaadresowana WEWNĄTRZ tej samej funkcji, nie blokuje Etapu 5**, ale warto
to jawnie odróżnić od "zależność od Etapu 4b" (której NIE MA) — to jest zależność od
Etapu 2/3, którą Etap 5 **sam naprawia jako efekt uboczny swojego kroku 0**, nie od
którego by miał czekać.

**Rekomendacja jawna: gdy Etap 4a faktycznie wyląduje w main (§0), runda implementacji
Etapu 5 musi zweryfikować od zera, czy `runWorldEndTurn()` (po jego faktycznym
wydzieleniu) wprowadza JAKIKOLWIEK nowy stan wymagający resetu w `switchActiveHuman()` —
ta runda recon nie mogła tego sprawdzić, bo `runWorldEndTurn()` fizycznie nie istnieje w
main tego worktree (§0).**

---

## 6. Rekomendacje / dług jawny (nie milczę o żadnym)

1. **`refreshLiveEmpireRatesUnsafe()` (main.ts:17077) hardkodowana na `ownerId===0` i na
   singleton `player`** — musi zostać zamigrowana na `ME()`/`playerStateByHuman.get(ME())`
   ZANIM `switchActiveHuman()` może obiecać poprawne (nie tylko wyzerowane) żetony HUD dla
   fotela #2. Decyzja ABC: czy to wchodzi w zakres implementacji Etapu 5, czy zostaje
   udokumentowanym długiem do Etapu 6. **Rekomendacja Operatora: Etap 6 zakresowo (jest to
   dokładnie kategoria "Ekonomia" z tabeli F planu), Etap 5 tylko zeruje.**
2. **`checkVeteranEnemyFirstEncounter` (main.ts:10192-10196) hardkodowana `u.ownerId===0`,
   wołana Z WNĘTRZA `refreshFog()`** — `switchActiveHuman()` dziedziczy ten błąd przez samo
   wywołanie `refreshFog()`. Poza zakresem tej rundy (dotyczy Etapu 6, kategoria "input/HUD"),
   ale musi trafić na listę tamtego etapu — nie było w oryginalnej liście 31 miejsc Etapu 1
   ani w żadnej innej sekcji planu.
3. **Trzy mapy `XByHuman` (`exploredByHuman`, `playerStateByHuman`, `pracaPoolByHuman`)
   nigdy nie otrzymują drugiego wpisu w dzisiejszym kodzie** (§1d, §1e-bis) — bez KROKU 0
   `switchActiveHuman()` (albo analogicznego kodu gdzie indziej) każda próba realnego
   drugiego fotela kończy się `undefined.pole` crashem, nie samym wyciekiem. To
   NAJWAŻNIEJSZE znalezisko tej rundy — zmienia charakter ryzyka Etapu 5 z "wyciek info"
   (jak głosi plan) na "wyciek info ORAZ ukryty crash-blocker", i wyjaśnia, dlaczego
   żaden dotychczasowy etap (0-4a) nie mógł być faktycznie zweryfikowany z DWOMA
   prawdziwymi fotelami — każdy z nich testował wyłącznie tryb 1-fotelowy (no-op), zgodnie
   z własnymi kryteriami "gotowe", ale to znaczy, że **hot-seat z 2 fotelami jest dziś,
   pierwszy raz w całym planie, faktycznie WYKONYWALNY do przetestowania dopiero od
   Etapu 5** (bo dopiero tu ktokolwiek pisze kod, który seeduje drugi wpis) — poprzednie
   etapy były bezpiecznymi no-opami, ale ŻADEN z nich sam w sobie nie dowodził, że drugi
   fotel faktycznie zadziała.
4. **Event logi (`warEventLog` i 4 siostry) nie mają pola ownera** (§1b) — Etap 5 musi
   czyścić, nie filtrować; poprawne tagowanie to osobny zakres (Etap 6, "Toast/dziennik
   wydarzeń"). Zgłaszam do ABC jako świadomą utratę historii zdarzeń fotela po powrocie do
   niego, dopóki tagowanie nie powstanie.
5. **Etap 4a (`runWorldEndTurn`) istnieje TYLKO na osobnej gałęzi, Evaluator PASS, ale
   NIE zintegrowany** (§0) — kolejna runda dowolnego tematu hot-seat musi to sprawdzić od
   zera przed poleganiem na numerach linii `triggerPlayerEndTurn()`.
6. **(DOPISANE runda 2, Evaluator zarzut #2, §1c-ter) — `switchActiveHuman()` odstępuje od
   invariantu `R-PIERWSZE-MIASTO` przy wymuszonym resecie build-mode, gdy
   `isAwaitingFirstPlayerCity()` jest prawdą.** Projekt §2 KROK 1c wymusza
   `buildModeOpen=false`/`foundCityMode=false`/`activeImprovementKey=null`/
   `activeWonderId=null` WPROST (z pominięciem guarda `exitBuildMode()`), zamiast
   pozostawić stan niewyjściowy do momentu założenia miasta — bo w kontekście handoff
   priorytet ma "żaden ślad fotela A widoczny fotelowi B" nad pierwotnym uzasadnieniem
   invariantu ("gracz nie może się wymigać od założenia miasta"), które dotyczyło
   Escape/PPM/toggle w RAMACH JEDNEGO fotela, nie przekazania kontroli MIĘDZY fotelami.
   **To jest decyzja ZMIENIAJĄCA udokumentowane, celowe zachowanie (R-PIERWSZE-MIASTO,
   Maciej 2026-07-24) — wymaga jawnego potwierdzenia ABC/właściciela przed rundą
   implementacji, nie może zostać cichym założeniem tego dokumentu.** Dodatkowo: skoro
   fotel B otrzymuje w ten sposób wygaszony build-mode, ale WŁASNY
   `isAwaitingFirstPlayerCity()` (jeśli nie jest per-owner — pytanie otwarte z §1c-ter)
   może natychmiast ponownie wymusić dla niego analogiczny tryb — do zweryfikowania osobno
   w rundzie implementacji, poza zakresem tej poprawki recon.
7. **(DOPISANE runda 3, Evaluator runda 2, zarzut #2 NOWY — ZAMKNIĘTE)** KROK 1c
   (gałąź `isAwaitingFirstPlayerCity()===true`) w wersji z rundy 2 odtwarzało wyłącznie 4
   zmienne stanu z ciała `exitBuildMode()`, pomijając `clearBuildModeVisuals()`
   (main.ts:12467→11821-11836, chowa `#civ-build-ghost-chip`/`ghostGroup`/`ghostCityGroup`/
   mine-overlay) i `popOverlay('build-mode')` (main.ts:12471, zdejmuje wpis ze wspólnego
   `escapeOverlayStack`). Poprawione w tej rundzie: KROK 1c (§2) dopisuje oba wywołania,
   komentarz przy `exitBuildMode()` poprawiony (nie sugeruje już, że to wywołanie "i tak"
   czyści wizualia w gałęzi guard-true), `snapshotVisibleState()` (§4.2) rozszerzone o
   `ghostChipVisible`/`escapeOverlayTopId`, dodany osobny SCENARIUSZ B (§4.2) ćwiczący
   dokładnie gałąź `isAwaitingFirstPlayerCity()===true` (Scenariusz A z rundy 2 jej nie
   ćwiczy — owner 0 tam już ma miasto po `startNewGame`). Weryfikacja: `05-operator-runda3.md`
   w tym katalogu.

---

## 7. Checklist kryterium sukcesu tej rundy

- [x] Kompletna mapa źródeł stanu, świeże numery linii, żaden globalny cache pominięty —
      §1a-e + 1e-bis (w tym 3 mapy `XByHuman` nieujęte w planie).
- [x] Rozbieżność liczby cache'y `_last*` (18 klaster + 2 poza, plan mówił "19") wyjaśniona,
      nie przemilczana — §1a.
- [x] Konkretny projekt `switchActiveHuman()` z nazwami funkcji/miejscami wywołania — §2
      (7 kroków, każdy z uzasadnieniem kolejności).
- [x] Konkretny projekt `ui/hotSeatHandoff.ts` z analizą bezpieczeństwa synchroniczności
      opartą o realny precedens (`preBattle.ts`/`escapeOverlayStack.ts`), nie hipotezę — §3.
- [x] Wykonywalny plan dowodu "no leak", z rozstrzygnięciem headless/Chromium opartym o
      ISTNIEJĄCY, już dowiedziony precedens (`hotseat-etap4-noop-test.cjs`), nie o
      propozycję z dokumentu, która okazała się porzucona w praktyce — §4.
- [x] Sprawdzenie nakładania z Etapem 4b: brak twardej zależności, jawnie odróżnione od
      OSOBNEJ, realnej zależności od niedokończonego Etapu 2/3 — §5.
- [x] Zero zmian w `gra/src/**`/`gra/tools/**` — wyłącznie ten plik zapisany (do
      potwierdzenia przez `git status` w rundzie Evaluatora).
- [x] Korekta przesłanki dispatchu (Etap 4a nie w main tego worktree) zgłoszona jawnie,
      nie zignorowana ani niecicho przyjęta — §0.
- [x] **RUNDA 2** — oba zarzuty Evaluatora (`02-evaluator-runda1.md`) PRZYJĘTE i wprowadzone:
      globalny toast `#civ-hint-toast`/`showHintMessage()` (§1c-bis, §2 KROK 1b, §4.2) i
      globalny build-mode/found-city-mode wraz z no-opem `exitBuildMode()` pod
      `isAwaitingFirstPlayerCity()` (§1c-ter, §2 KROK 1c, §4.2, §6 pkt 6 — decyzja ABC).
      Pełna odpowiedź z dowodami: `03-obrona-runda1.md` w tym katalogu.
- [x] **RUNDA 3** — zarzut Evaluatora rundy 2 (`04-evaluator-runda2.md`, KROK 1c
      częściowy: pomijał `clearBuildModeVisuals()`/`popOverlay('build-mode')` w gałęzi
      `isAwaitingFirstPlayerCity()===true`) PRZYJĘTY i wprowadzony: §2 KROK 1c dopisane oba
      wywołania + poprawiony komentarz, §4.2 `snapshotVisibleState()` rozszerzone o
      `ghostChipVisible`/`escapeOverlayTopId`, dodany osobny SCENARIUSZ B ćwiczący gałąź
      guard-true (§4.2), §6 pkt 7. Każdy cytowany numer linii zweryfikowany świeżym
      `grep`/`sed` tej rundy (patrz `05-operator-runda3.md`). Zarzut #1 (toast) zamknięty od
      rundy 2, nie ruszany.
