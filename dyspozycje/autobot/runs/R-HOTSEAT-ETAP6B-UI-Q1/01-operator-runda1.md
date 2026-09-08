# R-HOTSEAT-ETAP6B-UI-Q1 — Operator runda 1

## Migracja 78 miejsc rdzeniowych (klastry U1-U14 main.ts + V1-V11 ui/*.ts)

Świeży grep (`ownerId\s*(===|!==)\s*0\b`) na kodzie sprzed rundy potwierdził 78 miejsc
rdzeniowych z recon pod (przesuniętymi o ok. +1..+2 linie od czasu recon) numerami — po
migracji świeży grep w DOKŁADNIE tych samych zakresach funkcji (U1-U14: `updateHud`,
`refreshLiveEmpireRatesUnsafe`, `buildEmpireTradeSnap`, `buildHudState`,
`buildEmpireDetailSnap`, `wonderHudEntries/TargetLabel/PlacementContext`,
`buildHexContextPanelMessage/buildUnitContextTooltipForUnit/buildUnitContextPanelMessage`,
`buildPlayerCityListEntries/buildPlayerArmyListEntries/buildArmyStackHudStateInner/
buildContextPanelData`, `mountD1bHud`, `collectTurnEvents/sidePanelEventLinkFor/
openSidePanelEventLink`, `buildPlayerDiploSummary`, `buildDiploTreasury`,
`currentSaveLabel/ensureUlepszeniaHudCityId`, `buildCultureOverlayData/buildEmpireFoodSnap/
buildReligionOverlayData`) daje **ZERO trafień** — sprawdzone TAKŻE dla form `= 0`/`?? 0`
(Etap 6e ostrzeżenie) w tych zakresach: brak przypadków poza komentarzami prozy. Wszystkie
67 (main.ts) + 11 (ui/*.ts) = 78 miejsc zmigrowane na `isMe(ownerId)`/`!isMe(ownerId)`/
`ME()`, reużywając istniejący alias Etapu 6a. `ui/*.ts` (cityPanel.ts, powerOverlayHud.ts,
siegeMapPanel.ts, preBattle.ts) otrzymały wstrzykiwany parametr `isMe` wzorcem 1:1 z
`game/army-cycle.ts` (domyślna wartość `ownerId === 0` dla niezmigrowanych callerów — stąd
resztowe literały `ownerId === 0` widoczne w grepie tych plików to WYŁĄCZNIE fallbacki
domyślne, nie przeoczenia; `ui/hud.ts` — jedyny caller `showPowerOverlay` — poza allowlistą,
korzysta z domyślnej wartości). Podłączone w main.ts: `configureCityPanel`(x2, w tym
new-game rebuild), `configurePreBattle`(x2), `siegePanelActions`.

## Write-site cache `_last*` w `runWorldEndTurn()` (krytyczne znalezisko recon)

`runWorldEndTurn()` zmienia sygnaturę na `(humanOwnerId: number)`, jedyne wywołanie
(`endActiveHumanTurn`) przekazuje realny parametr. Zmigrowane na `humanOwnerId` (zamiast
literału `0`): filtr `_lastLudnoscRate`, `econ.upkeepByOwner.get()`/
`resourceUpkeepByOwner.get()` (feedujące `_lastBogactwoUtrzymanieBudynkow/Jednostek/
Surowcow/Rate`), `ownerResourceStockAll`/`deductBuildingStockCostAcrossCities`,
`buildingResourceUpkeepByOwner.set()`/`unitResourceUpkeepByOwner.set()`. Sprawdzalne:
wywołanie z `humanOwnerId !== ME()` realnie zmienia, którego ownera dotyczy odczyt/zapis
tych 4 cache'y Bogactwa + Ludności.

**Rozliczone, NIE zmigrowane w tej rundzie (jawnie, nie milcząco)** — przypisane Etapowi 6c
(ekonomia, recon `R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1` §4 Klaster G, wprost nazywa te linie
jako swoje "5 pozostałych"): `popBeforeTick` (feeduje deltę `_lastLudnoscRate`, więc ta
delta pozostaje niepoprawna dla `humanOwnerId≠0` dopóki 6c nie zmigruje), pc-filtr
`_lastWealthLevel`/`_lastWealthMnoznik`, drugie przeliczenie `_lastKultura` niżej w tej
samej funkcji. Także `_lastPracaRate/_lastPieniadzRate/_lastNaukaRate/_lastKulturaRate`
zasilane przez `playerEcon = sumEconomyForPlayerCities(econ, cities)` — literał `ownerId===0`
jest WEWNĄTRZ `game/turn-economy.ts:1219` (poza main.ts/allowlistą tego tematu, jawnie
przypisane (c) przez recon 6c). Sekwencja Etap 6b→6c (dispatch, `NASTĘPNY KROK`) istnieje
właśnie dlatego, że oba dotykają tej samej funkcji.

## `refreshPlayerCityEcon()` (znalezisko Etapu 6c, dołączone do tej rundy)

Numer linii zweryfikowany świeżo (`main.ts:6717-6750`, nadal aktualny). Dodany parametr
`ownerId: number`; oba call-site'y podłączone: `runWorldEndTurn()` przekazuje
`humanOwnerId`, `refreshLiveEmpireRatesUnsafe()` (U2, live-preview) przekazuje `ME()`.

## Bramka dowodu no-op — `gra/tools/hotseat-etap6b-ui-noop-test.cjs` (NOWA)

Wzorzec 1:1 z `hotseat-etap6a-input-noop-test.cjs` (PRZED/PO/ZEPSUTY, Chromium realny,
seed PRNG, hash SHA-256/turę). Na turę: realne otwarcie panelu miasta
(`__hotSeatTestDebug.openCityPanelForTest`, ta sama ścieżka co klik miasta), realny klik
chipa paska HUD `[data-act]` z rotacją 5 sekcji panelu imperium (skarbiec/kultura/miasta/
handel/moc — pokrywa U1/U3/U4/U5/U9/U12/U14), zrzut HTML paska HUD i `openViews()`, realny
`endTurn()` (write-site `runWorldEndTurn(humanOwnerId)` wykonuje się w środku).

**Wynik pełnego przebiegu (20 tur, `HOTSEAT6B_TURNS` domyślnie 20):** PRZED vs PO —
**20/20 identycznych hashy**, 0 wyjątków JS w obu wariantach. Nietautologiczność (`isMe()`
na sztywno `false`) — **0/20 identycznych** wobec PO, rozbieżność od tury 1 (panel miasta i
chipy imperium przestają rozpoznawać jednostki/miasta gracza) — dowód, że bramka realnie
dotyka migrowanego kodu, nie jest zielona tautologicznie. Zweryfikowane też mini-przebiegiem
3-turowym przed pełnym uruchomieniem.

**Zakres pokrycia jawnie rozliczony w komentarzu pliku bramki**: panel oblężenia (`.civ-smp`,
V10), przed-bitwa (`.pb-overlay`, V11) i cuda (placement UI, U6) NIE są otwierane w tej
bramce — wymagałyby fabrykacji realnej wojny/muru/kontaktu wojsk lub odblokowanej technologii
cudu w 20 turach od czystego seeda, poza rozsądnym budżetem tej rundy. Power overlay
bezpośrednio (`showPowerOverlay`, V9) jest DZIŚ NIEOSIĄGALNY z normalnej gry — `main.ts`
zawsze ustawia `cfg.onOpenEmpireDetail`, więc klik chipa "moc" idzie przez Empire Detail
Panel (pokryty rotacją sekcji), nie przez `showPowerOverlay()` (martwa gałąź w
`handleHudBarAction`, `ui/hud.ts`). Zgłoszone Evaluatorowi wprost, nie ukryte — migracje V9-
V11 mają dowód `tsc`+wzorzec-identyczny-do-army-cycle, ale nie mają realnego dowodu
behawioralnego Chromium w tej rundzie.

## Bramki

- `tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- `hotseat-etap6b-ui-noop-test.cjs`: PASS (20/20 PRZED=PO, nietautologiczność OK).
- `git diff --check`: czysto. `git status`: dokładnie 5 plików allowlisty + 1 nowy plik
  bramki.

## Allowlist / izolacja

Zmiany wyłącznie w: `gra/src/main.ts` (klastry U1-U14 + write-site `runWorldEndTurn()` +
`refreshPlayerCityEcon()`), `gra/src/ui/cityPanel.ts`, `gra/src/ui/siegeMapPanel.ts`,
`gra/src/ui/preBattle.ts`, `gra/src/ui/powerOverlayHud.ts`, nowy
`gra/tools/hotseat-etap6b-ui-noop-test.cjs`. Brak `git add -A` (pliki dodane po nazwie).
