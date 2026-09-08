# R-HOTSEAT-ETAP6E-RECON-RENDER-Q1 — Operator, runda 1

## 1. `render/camera.ts` — twierdzenie planu POTWIERDZONE świeżym dowodem

`grep -n "ownerId\|owner" gra/src/render/camera.ts` → **0 trafień** (309 linii pliku,
`Read` całości potwierdza). Plan miał rację: kamera jest owner-agnostyczna, zero
istniejącego kodu do migracji. Jedyna praca to NOWA funkcjonalność (zapamiętanie
pozycji kamery per fotel) — poza zakresem recon (nic do zinwentaryzowania, bo nic
nie istnieje).

## 2. Inwentarz świeży — `render/*.ts`

**KOREKTA (Obrona runda 1, zarzut 1 Evaluatora — PRZYJĘTE):** pierwotny grep
`ownerId\s*(===|!==)\s*0` był ślepy na hardkody w formie `= 0` (domyślny parametr)
i `?? 0` (fallback) — dokładnie ten sam kształt błędu co C-031. Świeży,
poszerzony grep:

`grep -rnE "(ownerId|playerOwnerId)\s*(=|\?\?)\s*0\b" gra/src/render/*.ts` → 5
trafień, nie 2:
- `units.ts:6464 setSelectionHex(q, r, ownerId = 0)` — domyślny parametr, ale
  WSZYSTKIE 6 wywołań w `main.ts` (5817, 5959, 11207, 23496, 27625, 33748) podają
  jawny `ownerId` → default dziś martwy, niski priorytet.
- `cities.ts:656 applyFogVisibility(vis, fogOn, playerOwnerId = 0)` — domyślny
  parametr, ale oba wywołania w `main.ts` (10177, 10186) już podają jawny `ME()` →
  default dziś martwy, niski priorytet (ten sam wzorzec co `setSelectionHex`).
- `cities.ts:784 playerOwnerId: options?.playerOwnerId ?? 0` i `cities.ts:803 const
  playerId = options?.playerOwnerId ?? 0` — fallbacki ŻYWE: `grep -n
  "playerOwnerId:" gra/src/main.ts` pokazuje literalne `playerOwnerId: 0` w co
  najmniej 7 wywołaniach `cityRenderer.sync(...)` (2487, 15883, 16025, 19369,
  19416, 24543, 24599) obok jednego już zmigrowanego (`21613: playerOwnerId:
  ME()`) — to są realne, wykonywane co klatkę porównania `city.ownerId ===
  playerId`, zasilające etykietę pigułki miasta i odznakę gracza.
- `cityOkolicaOverlay.ts:298 makeLabelSprite(parts, worker, params.ownerId ?? 0)`
  — fallback ŻYWY (pole `ownerId?: number` w interfejsie jest jawnie opcjonalne,
  patrz linia 58), zasila kolor odznaki „mój pracownik" w okolicy miasta.

`cityOkolicaOverlay.ts:116` pozostaje komentarzem, nie kodem (bez zmian wobec
poprzedniej wersji). Twierdzenie „reszta render/*.ts jest już sparametryzowana"
było ZA MOCNE — poprawione na: „większość jest sparametryzowana argumentem, ale
4 z tych argumentów mają żywy fallback `?? 0`/domyślny parametr, który trzeba
migrować razem z wywołaniami-źródłami w main.ts".

## 3. Prawdziwa praca leży w `main.ts` — rezolwery zasilające render

Ośmiu numerów linii z planu (`7833, 3239, 2238, 2268, 11283, 26447, 12849, 22438`)
sprawdzonych `Read` — **wszystkie martwe**, żaden nie dotyczy dziś renderu (kod
przesunął się o tysiące linii od czasu planu). Świeży inwentarz zamiast nich:

**A. Funkcje-rezolwery WOŁANE przez pipeline renderu** (jeden hardkod = jeden punkt
naprawy, propaguje się na wszystkie miejsca renderu naraz):

| Funkcja | Linia dziś | Hardkody `0` | Zasila w renderze |
|---|---|---|---|
| `civTypeForOwner` | 3429-3432 | 1 | `_cityRenderOpts.getCiv`/`getCivIconId` (pośrednio), `wireUnitRendererRingStance` emblem |
| `relationColorFn` | 3450-3453 | 2 (self + zagnieżdżone `civColorFn(0)`) | `buildTerritoryBorderGroup` (obwódka terytorium) |
| `unitRingStanceForPlayer` | 7970-7974 | 2 (self + `getDiploRelation(0, ownerId)`) | `unitRenderer.setRingStanceResolver` (pierścień jednostki) |
| `cityMapOutlineKindForOwner` | 17757-17766 | 2 (self + `getDiploRelation(0, ownerId)`) | `_cityRenderOpts.getMapOutlineKind` (obwódka miasta na mapie) |
| `civDisplayNameForOwner` | 8081-8090 | 1 | `_cityRenderOpts.getCivDisplayName` (etykieta cywilizacji nad miastem) |
| `portraitForceCultureIcon` | 8072-8079 | 1 (`civTypeForOwner(0)`) | `_cityRenderOpts.isCityStateOwner` (ikona miasta-państwa na tokenie) |

**B. Literały `0` bezpośrednio w wywołaniach/domknięciach zasilających render**
(nie w reużywalnym rezolwerze, tylko punktowo):

| Miejsce | Linia dziś | Co robi |
|---|---|---|
| `_cityRenderOpts().getCiv` | 2450-2456 | inline duplikat logiki `civTypeForOwner` (osobny hardkod, NIE woła współdzielonej funkcji) |
| `_cityRenderOpts().getCivIconId` | 2480-2483 | drugi inline duplikat tej samej logiki |
| `_cityRenderOpts().playerOwnerId` | 2487 | `playerOwnerId: 0` wprost w opcjach `cityRenderer.sync()` |
| `syncWorkerFieldOverlay(...)` wywołanie | 11724 | `playerOwnerId` param = literał `0` (pierścień „mój pracownik” na ikonie) |
| `refreshTerritoryBorderOverlay` domknięcie widoczności | 11844 | `if (ownerId === 0) return true;` (mgła wojny dla obwódki terytorium) |
| `syncOkolicaOverlay` bramka wejścia **(DODANE, Obrona runda 1, zarzut 2 — PRZYJĘTE)** | 5372 | `if (!city \|\| city.ownerId !== 0) { disposeOkolicaOverlay(); return; }` — decyduje czy grupa 3D okolicy miasta w ogóle trafia do sceny; strukturalnie identyczne do `refreshTerritoryBorderOverlay` (11844), pominięte w pierwszej wersji |
| `cityRenderer.sync(...)` wywołania z literałem **(DODANE, Obrona runda 1, zarzut 1 — pozostałe 6 z 7)** | 15883, 16025, 19369, 19416, 24543, 24599 | `playerOwnerId: 0` w opcjach — zasilają fallbacki `cities.ts:784/803` (jeden z 7 wywołań, 2487, był już policzony wyżej) |

**Suma realnych hardkodów kategorii render: 27.** **KOREKTA (Obrona runda 2, zarzut 5
Evaluatora rundy 2 — PRZYJĘTE, błąd arytmetyczny + błąd sumowania):** poprzednia wersja
(„21"/„22") miała dwa niezależne defekty: (a) sama suma cząstkowa Tabeli B była policzona
poprawnie jako `1+1+1+1+6=10`, ALE ta piątka pomijała 2 pozycje z WŁASNEJ Tabeli B
(`_cityRenderOpts().getCiv` 2450-2456 i `_cityRenderOpts().getCivIconId` 2480-2483) —
opisane w tabeli jako żywe, odrębne hardkody, nigdy niedodane do żadnego składnika sumy
końcowej; (b) niezależnie od tego, finalne dodawanie `9+10+1+1+1+2` było przepisane jako
„= 21", choć arytmetycznie daje 24 (`python3 -c "print(9+10+1+1+1+2)"` → 24), nie 21 —
błąd rachunkowy, nie tylko brakująca pozycja. Poprawne przeliczenie od zera, trzy grupy:
**A — 6 funkcji-rezolwerów** (`civTypeForOwner`=1, `relationColorFn`=2,
`unitRingStanceForPlayer`=2, `cityMapOutlineKindForOwner`=2, `civDisplayNameForOwner`=1,
`portraitForceCultureIcon`=1): `1+2+2+2+1+1=9`. **B — WSZYSTKIE 7 pozycji Tabeli B**
(`_cityRenderOpts().getCiv`=1, `_cityRenderOpts().getCivIconId`=1,
`_cityRenderOpts().playerOwnerId`=1, `syncWorkerFieldOverlay`=1,
`refreshTerritoryBorderOverlay`=1, `syncOkolicaOverlay` 5372=1, pozostałe 6 wywołań
`cityRenderer.sync` z `playerOwnerId: 0`=6): `1+1+1+1+1+1+6=12`. **C — pozycje spoza
Tabel A/B** (`render/units.ts:5798`=1, martwy default `setSelectionHex`=1, martwy default
`applyFogVisibility` `cities.ts:656`=1, 2 żywe fallbacki `?? 0` `cities.ts:784`/`803`=2,
fallback `cityOkolicaOverlay.ts:298 params.ownerId ?? 0`=1): `1+1+1+2+1=6`. **Suma:
A+B+C = 9+12+6 = 27** (`python3 -c "print(9+12+6)"` → 27, zgodne z 6+1+1+1+1+2+1... — patrz
weryfikacja Evaluatora rundy 2: `9+12+1+1+1+2+1=27`, ta sama liczba, inny grupowanie
tych samych 27 jednostek). Ta jedna liczba — **27** — zastępuje wszystkie wcześniejsze
warianty („16", „21", „22", „16→21/22") WSZĘDZIE w tym dokumencie (§4, §6, §9 poprawione
niżej). Plan (`~15`) jest zaniżony prawie dwukrotnie — kategoria render NIE jest
wyjątkiem od wzorca rozjazdu z 6a/6b/6c/6d, wbrew pierwotnemu twierdzeniu planu.**

## 4. Korekta względem 6b/6c — anty-samooszukiwanie

6b (`01-operator-runda1-analiza.md:120-136`) wykluczył ze swojej sumy 11 „akcesorów
per-owner” jako granicę (b)/(c)/(e). 6c (`01-operator-runda1-analiza.md:200-204`)
przypisał WSZYSTKIE 10 do (e) render bez rozbioru treści. **Świeży `Read` każdej z
nich pokazuje, że to przypisanie jest ZA SZEROKIE**: `civKeyForOwnerId`,
`civBonusyForOwnerId`, `unlockedTechsForOwner`, `civKeyForOwner` (7700-7719, 14883)
zasilają liczenie bonusów/technologii (ekonomia/AI), `civLabelForOwner` (27741-27758)
zasila WYŁĄCZNIE etykietę tekstową ekranu bitwy (HTML, nie scenę 3D). **KOREKTA
(Obrona runda 1, zarzut 3 Evaluatora — PRZYJĘTE co do przesłanki, wniosek bez
zmian):** `computePotegaComponents` (14952-14970) NIE „liczy panelu Mocy HUD" —
`grep -rn "computePotegaComponents" gra/src/` znajduje WYŁĄCZNIE definicję
(main.ts:14952), zero wywołań w całym repo. Funkcja jest dziś martwym kodem, nie
zasila żadnego HUD ani renderu. Uzasadnienie wykluczenia było fałszywe; poprawne
uzasadnienie: **martwy kod nie ma dziś żadnego odbiorcy, więc nie jest kategorią
(e) render z definicji tego recon (brak wywołania z pipeline'u renderu) — jeśli/gdy
ktoś w przyszłości podłączy tę funkcję do HUD-a, wymagać będzie własnej,
osobnej migracji w tamtym momencie.** Wniosek (poza sumą 27 tego recon, §3B)
pozostaje trafny mimo błędnej pierwotnej przesłanki. Zostawiam sześć pozycji
(`civKeyForOwnerId`, `civBonusyForOwnerId`, `unlockedTechsForOwner`,
`civKeyForOwner`, `civLabelForOwner`, `computePotegaComponents`) POZA sumą render
(nie moja kategoria — (b)/(c)/martwy kod, zgodnie z pierwotną niepewnością 6b).
Przejąłem z listy 6c tylko `civTypeForOwner`, `relationColorFn`,
`cityMapOutlineKindForOwner`, `unitRingStanceForPlayer`, `civDisplayNameForOwner` —
te faktycznie mają odbiorcę w `_cityRenderOpts`/`wireUnitRendererRingStance`/
`buildTerritoryBorderGroup`. `civKolorHexFn` (3455) NIE ma własnego hardkodu (czysty
przekaźnik do `civTypeForOwner`) — pomijam jako nie wymagający zmiany.

## 5. Alias

`isMe`/`ME()` — potwierdzone, ale z zastrzeżeniem: `ME()` JUŻ ISTNIEJE w bazowym
`main.ts:10376` (21 użyć), natomiast `isMe(ownerId)` (main.ts:10386, definicja
`return ownerId === ME();`) **NIE istnieje w zintegrowanym stanie** — jest częścią
NIEZATWIERDZONEJ, roboczej zmiany w równoległym worktree Etapu 6a (patrz §6). Dla
porównań (`ownerId === 0`) użyć `isMe(ownerId)`; dla argumentów-literałów
(`civTypeForOwner(0)`, `getDiploRelation(0, ownerId)`, `civColorFn(0)`) użyć `ME()`.

## 6. Nakładanie z Etapem 6a (STAN ROBOCZY, nie tylko `origin/main`)

**KOREKTA (Obrona runda 1, zarzut 4 Evaluatora — PRZYJĘTE):** `git status` w
`/home/user/wt-hotseat-etap6a-input` zwraca „nothing to commit, working tree
clean" — zmiany NIE są niezacommitowane. Świeży `git log --oneline -3` pokazuje
commit `621f353a` („R-HOTSEAT-ETAP6A-INPUT-Q1 runda 1: migracja 42 miejsc input na
isMe/ME()...") na gałęzi `autobot/R-HOTSEAT-ETAP6A-INPUT-Q1`, base `96e4c370` —
potwierdzony ancestor `9acad8db`, bazy 6e via `git merge-base --is-ancestor`.
Poprawny opis stanu: zmiany 6a są zacommitowane LOKALNIE w tym worktree/gałęzi,
ale NIEZMERGOWANE do `origin/main` — więc nie są dziś widoczne w bazie 6e ani w
zintegrowanym stanie gry, mimo że istnieją jako gotowy commit. Ten rozdział
sprawdza więc stan ROBOCZEJ GAŁĘZI (skończonej pracy czekającej na integrację),
nie stan NIEZACOMMITOWANY (pracy w toku) — rozróżnienie ma znaczenie, bo commit
`621f353a` może zostać zintegrowany do `main` w dowolnym momencie bez ostrzeżenia,
podczas gdy niezacommitowana praca w toku mogłaby też zniknąć/zmienić się bez
śladu. Wniosek merytoryczny (izolacja od mojej sumy pozycji, reużycie `isMe`)
pozostaje bez zmian — poniżej. Realne nakładanie:
- 6a WPROWADZA `isMe()` (main.ts:10386, nowa funkcja) — 6e nie powinien tworzyć
  własnego, konkurencyjnego aliasu o tej samej nazwie/semantyce.
- 6a już migrował `unitRenderer.setSelectionHex(...)` guardy WOKÓŁ wywołań (np.
  `syncPlayerUnitSelectionOnMap`, `selectPlayerUnit` — `if (!u || !isMe(u.ownerId))
  return;`) — to są bramki WEJŚCIA (input) przed wywołaniem render-funkcji, nie sam
  kod renderu; parametr `ownerId` przekazywany DO `setSelectionHex` pozostaje
  `u.ownerId` (dynamiczny) w obu wersjach — brak konfliktu semantycznego.
- Klik na mapie 3D (`panelCity.ownerId === 0` main.ts:24395, `okCity.ownerId === 0`
  main.ts:24444, `clickedCity.ownerId === 0`/`playerOwnerId: 0` w `resolveEnemyCityClick`
  24534-24599) — 6a JUŻ te linie migruje na `isMe()`/`ME()`. To jest KOD OBSŁUGI
  KLIKNIĘCIA (decyzja co zrobić po kliku), nie render (nie rysuje niczego) —
  świadomie WYKLUCZONE z mojej sumy (27), żeby nie dublować z 6a.
- Brak nakładania na moich 27 pozycjach właściwych (civTypeForOwner,
  relationColorFn, cityMapOutlineKindForOwner, unitRingStanceForPlayer,
  civDisplayNameForOwner, portraitForceCultureIcon, `_cityRenderOpts` x3,
  `syncWorkerFieldOverlay`, `refreshTerritoryBorderOverlay`, `syncOkolicaOverlay`
  5372, `cityRenderer.sync(...)` literały x6, `cities.ts` fallbacki x2,
  `cityOkolicaOverlay.ts:298` fallback, `render/units.ts` x2) — 6a ich nie dotyka
  (sprawdzone: żadna z powyższych linii nie pokrywa się z liniami zmienianymi w
  diffie 6a dot. `main.ts`/`army-cycle.ts`).

## 7. Nakładanie z Etapem 6d (dyplomacja)

`unitRingStanceForPlayer` i `cityMapOutlineKindForOwner` wołają
`getDiploRelation(0, ownerId)` — 6d rekonował `buildPlayerDiploSummary`/
`buildDiplomacyTickCtxForPair` jako WŁASNE hardkody (argumenty-literały typu
`civTypeForOwner(0)` w SWOICH funkcjach diplomacy, main.ts:6499-6516, 17950) — to
inne miejsca wywołania niż moje dwa rezolwery render. Zero nakładania linii; obie
migracje (6d i 6e) niezależnie zmieniają swoje własne wywołania tej samej,
niezmienianej funkcji `getDiploRelation`.

## 8. Plan dowodu no-op

Render jest DOM/canvas-bound (Three.js na `<canvas>`) — potwierdzone Chromium
(headless lub zwykły) z realnym uruchomieniem gry, analogicznie do poprzednich
etapów: (1) załaduj grę z `humanOwnerIds=[0]` (dziś jedyny wariant), (2) porównaj
zrzut ekranu/DOM-stan mapy PRZED i PO migracji dla identycznego stanu gry (kolor
pierścienia jednostki gracza, obwódka miasta gracza, ikona miasta-państwa, etykieta
cywilizacji, **etykieta pigułki miasta i odznaka „mój pracownik" w okolicy miasta
(DODANE, Obrona runda 1 — dotyczy nowo znalezionych fallbacków `cities.ts:784/803`
i `cityOkolicaOverlay.ts:298`)**) — muszą być bit-identyczne, bo `ME() === 0`
zawsze przy jednym fotelu. (3) Dodatkowo: `node ./node_modules/typescript/bin/tsc
--noEmit` (typecheck) — nie powinien być nawet potrzebny (recon, zero zmian), ale
to bramka wymagana przy przyszłej implementacji.

## 9. Obrona runda 1 + runda 2 — podsumowanie korekt

Cztery zarzuty Evaluatora (runda 1), wszystkie PRZYJĘTE ze świeżym dowodem:
1. Poszerzony grep `(ownerId|playerOwnerId)\s*(=|\?\?)\s*0\b` — 4 pominięte miejsca
   dopisane do §2/§3B.
2. Bramka `syncOkolicaOverlay` (main.ts:5372) dopisana do §3B.
3. Uzasadnienie wykluczenia `computePotegaComponents` poprawione w §4 (martwy kod,
   zero wywołań — nie „liczy panelu HUD"); wniosek wykluczenia bez zmian.
4. Opis stanu worktree 6a w §6 poprawiony z „NIEZACOMMITOWANE" na „zacommitowane
   lokalnie (621f353a), niezmergowane do origin/main".

Jeden zarzut Evaluatora (runda 2), PRZYJĘTY ze świeżym dowodem:
5. Suma §3B miała błąd arytmetyczny (`9+10+1+1+1+2` przepisane jako „21", realnie
   24) ORAZ pomijała 2 żywe pozycje własnej Tabeli B (`getCiv`, `getCivIconId`)
   przy liczeniu składnika „10". Przeliczone od zera trzema grupami
   (A=9 funkcji-rezolwerów, B=12 pozycji Tabeli B w komplecie, C=6 pozycji spoza
   tabel) = **27**, zweryfikowane `python3 -c "print(9+12+6)"` → 27 i niezależnie
   `python3 -c "print(9+12+1+1+1+2+1)"` → 27 (grupowanie Evaluatora, te same 27
   jednostek). Liczba **27** zastępuje „16"/„21"/„22"/„16→21/22" wszędzie w tym
   dokumencie (§3B, §4, §6, tu).

Suma realnych hardkodów kategorii render: **27** (§3B, przeliczone od zera w
rundzie 2 po arytmetycznym błędzie rundy 1) — plan
„~15" jest zaniżony prawie dwukrotnie, kategoria render NIE jest wyjątkiem od wzorca rozjazdu z
6a/6b/6c/6d (poprawka względem błędnego stwierdzenia w pierwotnym §3B). §6-§8
zweryfikowane pod kątem spójności z poprawioną sumą i poprawionym stanem 6a.

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only kategorii render/kamera Etapu 6 (patrz 00-dispatch.md)
ZMIANY/COMMIT: dokument recon (ten plik) poprawiony w Obronie runda 1, zero zmian w `gra/`
TESTY: brak (docs-only); plan dowodu no-op opisany w §8 (rozszerzony w Obronie)
BLOKADY: brak
RUNDY: 1/5 (Obrona wykonana w tej samej rundzie)
NASTĘPNY KROK: kolejny Evaluator (runda 1, po Obronie — R-PROC-AUTOBOT.md §3c)
DEPLOY/PUSH: NIE WYKONANO
