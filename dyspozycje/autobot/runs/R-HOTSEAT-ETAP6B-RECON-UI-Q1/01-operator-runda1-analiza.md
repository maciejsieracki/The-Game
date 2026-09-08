# R-HOTSEAT-ETAP6B-RECON-UI-Q1 — Operator runda 1 — inwentaryzacja kategorii „UI”

**Metoda:** świeży `grep -n -E "ownerId\s*(===|!==)\s*0\b"` na `gra/src/main.ts` (36 530
linii dziś) i `gra/src/ui/*.ts`, worktree `/home/user/wt-hotseat-etap6b-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6B-RECON-UI-Q1`, baza `fe74fb0f`. 276 trafień w `main.ts` + 14 w
`ui/*.ts` (w tym komentarze). Każde trafienie zmapowane skryptem (bisect) na najbliższą
poprzedzającą deklarację `function`, potem klastry o granicznym charakterze zweryfikowane
ręcznie `Read`/`sed` (nie z pamięci, nie z planu). Zero zmian w `gra/src`/`gra/tools`.

## 0. Stan bazowy — korekta przesłanek dispatchu (świeżo zweryfikowane)

- **Etap 5 (`switchActiveHuman`, `main.ts:10426`) JEST zintegrowany** — w odróżnieniu od
  stanu w czasie recon Etapu 6a. KROK 5 (`main.ts:10531-10534`) już zeruje 18 zmiennych
  `_last*` + `_pracaRateFreshFromEndTurn`/`_liveFoodBrutto` (20 łącznie, zgodnie z „18+2”
  z recon Etapu 5) przy każdym przełączeniu fotela.
- **Etap 6a (input, 42 miejsca)** ma zamknięty i zintegrowany DOKUMENT recon
  (`941676d5`), ale **implementacja** (`R-HOTSEAT-ETAP6A-INPUT-Q1`) jest dziś w
  RÓWNOLEGŁYM dispatchu (`96e4c370`), nie w tej bazie: `grep -c "function isMe"
  main.ts` = 0. Traktuję input jako osobny, nienaruszony przez tę rundę temat.
- Plan `PLAN-HOT-SEAT-2-GRACZY.md` §A3 podaje „~75”, §C wiersz 6 podaje sumę „~272”
  całej migracji. **Świeży `grep -c` całego pliku po obu formach `ownerId(===|!==)0`
  daje 276** (main.ts) — blisko „~272”, potwierdza że `~272` liczy WSZYSTKIE podetapy
  łącznie, nie tylko UI.

## 1. Klaster główny — HUD imperium / listy / panele (`main.ts`)

Zweryfikowane `Read` każdej funkcji-nagłówka (nie tylko nazwa z bisect); tam gdzie jedna
nazwa grupowała kod z INNEJ kategorii (input, patrz §3), rozdzielone ręcznie.

| Klaster | Funkcja(-e) | Linie (dziś) | Liczba | Uzasadnienie kategorii |
|---|---|---|---|---|
| U1 | `updateHud()` | 21843,21873,22045,22074,22160,22296,22391,22395,23070,23092 (i in.) | 13 | Rdzeń renderu HUD gracza — filtr `cities.find(c=>c.ownerId===0)` dla etykiet/pozycji paneli |
| U2 | `refreshLiveEmpireRatesUnsafe()` | 17233,17241,17301,17333,17384,17389 | 6 | Silnik podglądu ekonomii DLA HUD (komentarz w kodzie: „HUD używa wyłącznie ownerId===0”) — zasila `_last*` |
| U3 | `buildEmpireTradeSnap()` | 15509,15529,15530,15533,15638,15646 | 6 | Snapshot dla panelu cywilizacji (handel) |
| U4 | `buildHudState()` | 17410,17456,17486,17504 | 4 | Budowa stanu HUD (chip skarbiec/Praca) |
| U5 | `buildEmpireDetailSnap()` | 15169,15278,15455 | 3 | Panel szczegółów imperium |
| U6 | `wonderHudEntries/wonderHudTargetLabel/wonderPlacementContext` | 3988,4010,4025 | 3 | HUD cudów (dispatch: „cuda”) |
| U7 | `buildHexContextPanelMessage/buildUnitContextTooltipForUnit/buildUnitContextPanelMessage` | 5524,5525,5640,5657,5695,5701 | 6 | Tooltip/panel kontekstowy jednostki — WYKLUCZONE z input (a) przez Etap 6a recon §2, tu poprawnie policzone jako (b) |
| U8 | `buildPlayerCityListEntries/buildPlayerArmyListEntries/buildArmyStackHudStateInner/buildContextPanelData` | 6270,6296,20331,5747 | 4 | Zasilacze list miast/armii dla `ui/cityListHud`/`armyListHud`/`armyStackHud` |
| U9 | panel cywilizacji: `configureEmpireHandelSplit`/`configureEmpireGlobalDefaults`/`mountD1bHud` (wiązanie, `main.ts` ok. 21093-21735) | 21093,21115,21297,21302,21304,21349,21693,21714,21723,21735 | 10 | Wiązanie panelu cywilizacji/HUD build-mode (getter/setter default-per-owner) — **2 pozycje z tej samej leksykalnej okolicy (`21528`,`21538`, `canMerge`/`canSplit`) NALEŻĄ do klastra H Etapu 6a (input) — wykluczone stąd, patrz §3** |
| U10 | `sidePanelEventLinkFor/openSidePanelEventLink/collectTurnEvents` | 14719,14762,14615 | 3 | Panel wydarzeń (dispatch: „panel wydarzeń”) |
| U11 | `buildPlayerDiploSummary()` | 6500,6508 | 2 | Lista/panel cywilizacji (dyplomacja WYŚWIETLANA, nie logika traktatu) |
| U12 | `buildDiploTreasury()` | 17743,17745 | 2 | Skarbiec w panelu dyplomacji (wyświetlenie, nie transfer) |
| U13 | `currentSaveLabel()` / `ensureUlepszeniaHudCityId()` | 28239, 26617 | 2 | Etykieta zapisu, panel ulepszeń |
| U14 | `buildEmpireFoodSnap/buildCultureOverlayData/buildReligionOverlayData` | 15088,15041,15697 | 3 | Overlaye kultury/religii/żywności |
| **SUMA main.ts** | | | **67** | |

## 2. Klaster `ui/*.ts` (kod, bez komentarzy)

| # | Plik:linia | Kod dziś | Podmiana |
|---|---|---|---|
| V1-V4 | `cityPanel.ts:4634,5091,5305,8281` | `const player = city.ownerId === 0;` | `isMe(city.ownerId)` |
| V5 | `cityPanel.ts:8590` | `if (city.ownerId !== 0) { … 'Miasto rywala…' }` | `!isMe(city.ownerId)` |
| V6 | `cityPanel.ts:8748` | `if (city.ownerId !== 0) {` | `!isMe(city.ownerId)` |
| V7 | `cityPanel.ts:10023` | `const owner = city.ownerId === 0 ? 'Gracz' : 'AI';` | `isMe(city.ownerId) ? …` |
| V8 | `cityPanel.ts:10497` | `if (city.ownerId !== 0 \|\| !cfg.onSetCapital) return '';` | `!isMe(city.ownerId)` |
| V9 | `powerOverlayHud.ts:194` | `const cls = d.ownerId === 0 ? ' class="player"' : '';` | `isMe(d.ownerId)` |
| V10 | `siegeMapPanel.ts:171` | `return ownerId === 0 ? 'Gracz' : ('AI ' + ownerId);` | `isMe(ownerId) ? …` |
| V11 | `preBattle.ts:579` | `if (side.ownerId !== undefined) return side.ownerId === 0;` | `return isMe(side.ownerId)` |

**Uwaga strukturalna**: `ui/*.ts` moduły są CZYSTE (nie importują `human-owners.ts`,
wzorzec identyczny do `game/army-cycle.ts` z Etapu 6a) — wymagają wstrzyknięcia `isMe`
jako parametru/callbacku z `main.ts` (ten sam wzorzec co Etap6a §1 klaster A3), NIE
importu bezpośredniego.

**Suma `ui/*.ts`: 11.**

## 3. Nakładanie z Etapem 6a (input) — jawnie sprawdzone

Region `main.ts:21093-21735` (klaster U9) i klaster H Etapu 6a (`openSplitPanelForSelected`
`11343`/`openMergePanelForSelected` `11481`/`canMerge` `21528`/`canSplit` `21538`) leżą w
tym samym pliku blisko siebie, ale są **rozłączne funkcjonalnie**: U9 to gettery/settery
domyślnych podziałów Pracy/Handlu/Racji per-owner (panel cywilizacji), klaster H to
zdolność scalania/rozdzielania ZAZNACZONEJ armii (input). Zweryfikowane `Read` obu miejsc
osobno (§1 tej rundy dla U9, cytat Etapu 6a dla H) — **2 pozycje (`21528`,`21538`)
świadomie wykluczone z sumy 67 powyżej**, żeby nie dublować allowlisty Etapu 6a. Poza tym
brak nakładania: reszta klastrów UI (U1-U8, U10-U14) nie pokrywa się z żadnym z 42 miejsc
input.

## 4. Cache `_last*` (20 zmiennych) — decyzja: MIGRACJA U1/U2 NIEWYSTARCZAJĄCA — POPRAWKA RUNDA 2 (Obrona)

**POPRAWKA (Obrona runda 1, w odpowiedzi na zarzut Evaluatora [ISTOTNY] nr 1 — zarzut
PRZYJĘTY, dowód w `03-obrona-runda1.md`):** wersja pierwotna tego paragrafu twierdziła
błędnie, że „żadna z 20 zmiennych `_last*` nie zawiera własnego literału `ownerId`” —
sprawdzone wyłącznie punktowe odczyty (`main.ts:4154,12563,17549,26499,35419`), z pominięciem
**trzeciego write-site**: `runWorldEndTurn()` (`main.ts:28957-33313`).

Świeży dowód (`Read`/`grep`, `main.ts` dzisiejszy stan):
- `main.ts:29464` — `_lastLudnoscRate = cities.filter(c => c.ownerId === 0).reduce(...)`
  — BEZPOŚREDNI literał `ownerId === 0` przypisujący do zmiennej cache, wewnątrz
  `runWorldEndTurn()`, poza U1 (`updateHud()`) i U2 (`refreshLiveEmpireRatesUnsafe()`,
  17232-17395).
- `main.ts:29403` — `const playerEcon = sumEconomyForPlayerCities(econ, cities)` (sama
  funkcja przyjmuje listę miast już przefiltrowaną wcześniej po `ownerId===0` — zasila
  dalej `_lastPracaRate`/`_lastPieniadzRate`/`_lastNaukaRate`/`_lastKulturaRate`/`_lastKultura`
  na liniach 29405-29411).
- `main.ts:29578` — `econ.upkeepByOwner.get(0)` i `main.ts:29590` — `econ.resourceUpkeepByOwner.get(0)`
  — zahardkodowany literał właściciela 0, zasilający `_lastBogactwoHandel`/
  `_lastBogactwoUtrzymanieBudynkow`/`Jednostek`/`Surowcow`/`_lastBogactwoRate`
  (`main.ts:29608-29612`).

**Rewizja konkluzji: migracja SAMYCH funkcji zasilających U1 (`updateHud()`) i U2
(`refreshLiveEmpireRatesUnsafe()`) NIE WYSTARCZY.** `runWorldEndTurn()` jest TRZECIM,
niezależnym write-site tego samego cache, z własnymi literałami `ownerId===0`/`.get(0)`,
odpalanym co turę PRZED odczytem HUD — jeśli aktywny fotel to gracz 1, cache po tym
tick'u i tak zostanie nadpisany danymi fotela 0, niezależnie od stanu migracji U1/U2, aż
do najbliższego zerowania przez Etap 5 KROK 5 (które czyści cache przy PRZEŁĄCZENIU
fotela, nie po każdym end-turn). To jest **TWARDA ZALEŻNOŚĆ dla rundy implementacji
Etapu 6b — nie kosmetyka**: `runWorldEndTurn()` musi zostać przełączony na ten sam hak
`humanOwnerId` co klaster D+F Etapu 6a, RÓWNOLEGLE z migracją U1/U2, inaczej podetap (b)
zostanie zintegrowany z pozostawioną trzecią luką, niewidoczną w typecheck/bramkach, ale
łamiącą no-op przy `humanOwnerIds` różnym od `[0]` (a docelowo — poprawność danych przy
aktywnym fotelu ≠ 0 nawet przy `humanOwnerIds=[0,1]`).

Zerowanie z Etapu 5 (KROK 5, `main.ts:10531-10534`) pozostaje POTRZEBNE jako druga,
niezależna warstwa (zapobiega odczytowi STARYCH danych bezpośrednio po handoffie, zanim
`runWorldEndTurn()` zdąży odświeżyć), ale NIE zastępuje migracji write-site'u w
`runWorldEndTurn()` — obie warstwy potrzebne, zgodnie z pierwotnym podejrzeniem z
dispatchu (pkt. kontekstowy o Etapie 5), teraz potwierdzonym w drugą stronę: to nie
read-site migracja jest zbędna obok zerowania, to zerowanie jest niewystarczające obok
brakującej migracji write-site'u.
Ryzyko rezydualne: gdyby kiedyś oba fotele miały renderować HUD JEDNOCZEŚNIE (nie hot-seat,
tylko split-screen) — poza zakresem planu.

## 5. Rozliczenie z liczbą „~75”

**Suma rdzeniowa policzona świeżo: 67 (main.ts) + 11 (ui/*.ts) = 78** — różnica +3 (+4%)
względem „~75”, znacznie mniejsza niż rozjazd Etapu 6a (+68%). Przyczyny:

1. Plan liczył orientacyjnie, bez rozbicia `===`/`!==` (jak przy input) — tu obie formy
   są w sumie 78 zliczone razem, bez podwójnego liczenia.
2. **Świadomie WYKLUCZONE z 78** (granica kategorii, nie przeoczenie): funkcje-akcesory
   generyczne per-owner bez własnego renderu — `civTypeForOwner`, `relationColorFn`,
   `civKeyForOwnerId`, `civBonusyForOwnerId`, `unlockedTechsForOwner`, `civDisplayNameForOwner`,
   `civKeyForOwner`, `civLabelForOwner`, `cityMapOutlineKindForOwner`, `unitRingStanceForPlayer`,
   `computePotegaComponents` (`main.ts` ok. 3430-14964, ~11 funkcji, 1 literał każda) —
   te są WOŁANE przez UI, ale same nie są „panel/HUD/lista” — bliżej podetapu (e) render
   lub (c) ekonomia (przypisanie nazwy cywilizacji/koloru, nie logika co pokazać). Podobnie
   `extraCityPanelConfig()` (6 wystąpień, `main.ts:6857-7359`) — config callbacków panelu
   miasta zawiera zarówno CZYSTY odczyt (`getCultureState`) jak i AKCJE piszące stan
   (`onCityRationChange` zmienia `poziomRacji`) — **granica (b)/(c) nieostra**, flaguję
   zamiast milcząco przypisywać; wykluczona z sumy 78, do decyzji w rundzie implementacji
   czy migrować razem z (b) czy z (c).
3. **POPRAWKA (Obrona runda 1):** stwierdzenie „`_last*` nie mają OSOBNYCH literałów
   `ownerId`, 0 dodatkowych miejsc” było błędne — patrz §4 zrewidowane. `runWorldEndTurn()`
   dodaje realny, nowy write-site (3+ literały/`.get(0)` konkretne, zasilające 11 z 20
   zmiennych `_last*`) — POZA sumą 78 (to write-site cache ekonomii/tury, nie panel/HUD
   render sam w sobie), ale rozliczony jawnie jako TWARDA ZALEŻNOŚĆ implementacyjna, nie
   pomijany milczeniem.
4. **POPRAWKA (Obrona runda 1, zarzut Evaluatora [ŚREDNI] nr 2 — PRZYJĘTY):** granica
   (b)/(c) pominęła komunikaty `showHintMessage` bramkowane `ownerId===0`/`tick.ownerId===0`
   wewnątrz ticków ekonomii/głodu/buntu — strukturalnie identyczne z `extraCityPanelConfig`
   (bramkowanie WYŚWIETLENIA komunikatu człowiekowi, nie logika mechaniki). Świeżo
   zweryfikowane (`Read`/`grep`, dzisiejsze linie):
   - `main.ts:10091` — `if (showPlayerHints && u.ownerId === 0) { ... showHintMessage(...) }`
   - `main.ts:29333` (`if (tick.ownerId === 0) { playerDamagedCount += ...; playerDestroyedCount += ... }`)
     + `main.ts:29379-29382` (`showHintMessage('Głód: utracono ...')` / `'Głód wojska: ...'`)
     gałęziony na zmiennych zasilonych przez powyższy `tick.ownerId===0`.
   - `main.ts:29787` (analogiczny `tick.ownerId === 0` przy buncie/deficycie złota) +
     `main.ts:29833` (`showHintMessage('Deficyt Złota: utracono ...')`).
   Te 3 klastry (5 konkretnych linii) DOPISANE jako nowa pozycja graniczna (b)/(c) —
   patrz punkt 5 niżej — z tym samym uzasadnieniem co `extraCityPanelConfig`: kod mechaniki
   tury (ekonomia/głód/bunt) DECYDUJE co pokazać człowiekowi po `ownerId`, więc dotyka
   zarówno (c) jak i (b). `showHintMessage` ma 308 wystąpień w pliku — TYLKO powyższe 3
   klastry mają bezpośrednią bramkę `ownerId===0`/`tick.ownerId===0` w bezpośrednim
   sąsiedztwie (zweryfikowane `grep -n "ownerId\s*===\s*0" main.ts` + ręczny przegląd
   kontekstu wokół każdego trafienia w promieniu ~15 linii); pozostałe wywołania
   `showHintMessage` nie są bramkowane po ownerId (wywoływane już wewnątrz kodu, który
   dotyczy wyłącznie gracza, albo nie dotyczą rozróżnienia właściciela).

**Konkluzja (zrewidowana): 78 rdzeniowych + 20 granicznych (11 akcesorów + 6
`extraCityPanelConfig` + 3 klastry `showHintMessage`/5 linii) = 98 potencjalnych, z czego
78 jednoznacznie (b). Dodatkowo: `runWorldEndTurn()` (§4) — TWARDA ZALEŻNOŚĆ write-site
cache `_last*`, POZA sumą 78/98, obowiązkowa do migracji RÓWNOLEGLE z U1/U2 w rundzie
implementacji.**

## 6. Plan dowodu no-op

Jak Etap 6a: **Chromium (Playwright), nie Node headless** — wszystkie klastry U1-U14/V1-V11
są DOM-bound (renderują HTML/canvas) lub wołane z callbacków HUD wstrzykiwanych przez
`ui/*.ts`. Zero czystych funkcji w tej kategorii (w odróżnieniu od `army-cycle.ts` w
Etapie 6a) — brak wyjątku headless. Sekwencja: otwórz każdy dotknięty panel (miasto,
imperium, cuda, wydarzenia, oblężenie, przed-bitwą, moc) przy `humanOwnerIds=[0]`,
porównaj wyrenderowany HTML/wartości liczbowe PRZED/PO podmianie, bit-w-bit identyczne.
20 tur z otwarciem każdego z ~8 paneli co najmniej raz. Dodatkowo `tsc --noEmit` (0
błędów, dziś niepotrzebne — zero zmian kodu tej rundy).

## Podsumowanie dla Evaluatora

- 78 miejsc rdzeniowych kategorii (b) UI, świeże numery linii, klastrowane U1-U14
  (main.ts, 67) + V1-V11 (ui/*.ts, 11), z podmianą `ownerId===0→isMe(id)`/`!==0→!isMe(id)`/
  literał→`ME()`.
- „~75” z planu potwierdzone w przybliżeniu (+3), jawnie rozliczone.
- 2 pozycje (`21528`,`21538`, canMerge/canSplit) świadomie wykluczone — należą do klastra H
  Etapu 6a (input), nie UI — sprawdzone przez `Read`, nie z pamięci.
- Cache `_last*` (20 zmiennych): migracja struktury NIEPOTRZEBNA — Etap 5 już zeruje je
  przy handoff. **Migracja U1/U2 (funkcji zasilających) SAMA NIE WYSTARCZY** (poprawka
  Obrona runda 1) — `runWorldEndTurn()` jest trzecim, niezależnym write-site'em tego
  samego cache z własnymi literałami `ownerId===0`/`.get(0)` (§4) i musi zostać
  przełączony na hak `humanOwnerId` RÓWNOLEGLE z U1/U2 w rundzie implementacji — TWARDA
  ZALEŻNOŚĆ, nie kosmetyka.
- 20 pozycji granicznych (11 akcesorów nazw/kolorów cywilizacji + 6 `extraCityPanelConfig`
  + 3 klastry/5 linii `showHintMessage` bramkowane `ownerId===0` w tickach ekonomii/głodu/
  buntu, dopisane Obrona runda 1) jawnie wyłączone z sumy 78 z uzasadnieniem — do decyzji
  przy implementacji.
- Plan dowodu no-op: wyłącznie Chromium — brak wyjątku headless w tej kategorii.
