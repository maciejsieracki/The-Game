# R-WEB-LONGRUN-100-TURNS-LEAK-Q1 -- dane pomiarowe (runda 1)

Metoda: bundle vite poza repo, Chromium headless (`--use-gl=swiftshader`, `--js-flags=--expose-gc`), `?civTest=1`, mgla OFF (klawisz F),
gracz bez ruchow (tylko `endTurn`), `Math.random` ziarnowany. Mapa Standardowy/kontynenty, seed 4242 (PRE 100 tur, POST 100 tur), seed 777 (PRE tylko do t.73 -- proces przerwany, NIE doprowadzony do t.100).
UWAGA: maszyna byla przeciazona innymi sesjami (load average 13-32 na 4 rdzeniach), wiec ABSOLUTNE czasy ms sa zawyzone ok. 2-3x w przebiegu POST
(`(program)` w profilu: PRE ~12 s, POST ~39 s przy t.95). Wnioski opieraja sie na UDZIALACH w profilu CPU, nie na ms wall-clock.
Trajektorie PRE i POST nie sa identyczne (seed jest ziarnem Math.random, ale harmonogram asynchroniczny roznie sie rozchodzi: t.5 units 59 vs 56).
Pelne tabele co 5 tur: `turns-every5.csv` (label: pre-4242, pre-777, post-4242-fix).

## Czas tury (seed 4242, PRE, ms wall; w tym ~12-20 s to `(program)` = natywny render swiftshader)
| tura | endTurn ms | faza AI ms | dyplomacja AI ms | heap MB (GC) | units | cities |
|---|---|---|---|---|---|---|
| 5 | 30795 | 259 | 9 | 318 | 59 | 42 |
| 25 | 14649 | 318 | 2 | 337 | 61 | 45 |
| 50 | 25401 | 2856 | 2 | 466 | 461 | 77 |
| 70 | 36304 | 4399 | 1 | 544 | 528 | 85 |
| 85 | 48494 | 5493 | 1 | 581 | 523 | 100 |
| 100 | 53220 | 3957 | 1 | 625 | 490 | 106 |
Faza AI (`decideAITurn`) i dyplomacja AI to <10% tury -- NIE sa przyczyna spowolnienia. Spadek t.5 -> t.25 (30 s -> 15 s) to artefakt wczesnych tur (renderer/swiftshader + AI-handel `PDA`->`Kc`->`Do`->`wCA` skan calej mapy), nie rosnacy koszt.

## Profil CPU (PRE, seed 4242, czas inkluzywny w s w turze profilowanej)
| tura | caly profil | endTurn JS (`nkM`) | odswiezenie tras `CAo` | `computeTradeRouteResourceGrants` (`xji`) | `placedImprovementsForOwner` (`Bt`) |
|---|---|---|---|---|---|
| 10 | 33.6 | 0.4 | 0 | 0 | 0.1 |
| 40 | 21.6 | 2.7 | 1.0 | 0.95 | 2.2 |
| 70 | 38.3 | 11.9 | 7.7 | 7.5 | 11.5 |
| 95 | 57.5 | 29.7 | 19.6 | 19.2 | 24.4 |
Koszt `xji` rosnie superliniowo (0 -> 0.95 -> 7.5 -> 19.2 s): trasy handlowe (74 -> 118) x 5 surowcow x 4 zapytania `ownerHasNativeAccess`, a KAZDE zapytanie
(`ownerHasNativeResourceAccess`, main.ts:5202) wola `placedImprovementsForOwner` (main.ts:5151) = petla po WSZYSTKICH ulepszeniach mapy (2953 wpisow, 7188 warstw w t.100)
x `territoryOwnerAt` po wszystkich wezlach terytorium (`lE`, 24 s inkluzywnie). Seed 777 PRE potwierdza: `xji` 1.05 s (t.40) -> 4.22 s (t.70).
Wywolanie: `recomputeTradeRouteResourceGrants` (main.ts:5236) <- `CAo` (odswiezanie tras po kazdej turze, main.ts) <- endTurn.

## Profil CPU POST-FIX (seed 4242, ta sama sciezka, obciazenie maszyny ~3x wieksze)
| tura | caly profil | endTurn JS (`YkM`) | `xji` | `LU` (ownerHasNative) | `CAo` |
|---|---|---|---|---|---|
| 70 | 64.0 | 7.3 | 0 (brak w profilu) | 1.3 | brak w top |
| 95 | 77.2 | 11.6 | 0 (brak w profilu) | 1.45 | 0.8 |
endTurn JS t.95: PRE 29.7 s -> POST 11.6 s MIMO ~3x wiekszego obciazenia maszyny; sciezka `xji` calkowicie zniknela (19.2 s -> 0).
Pozostaly `Bt` (14.3 s inkl. w t.95 POST) pochodzi z INNYCH wolajacych (nie zmienione): `mAA` (auto-ulepszanie jednostek: `UR(G)` -> `YAA/_mA` -> `placedImprovementsForOwner` PER JEDNOSTKA, ok. 5.4 s),
`PDA`/`zAA` (ocena handlu AI, 0.75 s), `Ro`/`lC`/`ii` (ok. 0.7 s kazde).

## Struktury rosnace (seed 4242, PRE; rozmiar wpisow / wpisy zagniezdzone; dane z `window.__leakDump`)
| struktura | plik:linia | t.50 | t.60 | t.100 | wzrost/ture (t.50-100) | ocena |
|---|---|---|---|---|---|---|
| `placedImprovements` | gra/src/main.ts:14638 | 1294 / 1996 warstw | 1904 / 3090 | 2953 / 7188 | ~137 warstw | stan gry (ulepszenia AI/gracza); wejscie kosztu `Bt` -- NIE wyciek, ale mnoznik kosztu |
| `improvementMeshes` (THREE.Group) | main.ts:14656 | 1294 | 1904 | 2953 | 33 | 1 grupa na ulepszone pole; stan renderu proporcjonalny do stanu gry |
| `cityBuilt` | main.ts:3292 | 76 / 882 | 79 / 1128 | 105 / 1970 | 22 | stan gry (budynki) |
| `roadRenderedHexes` | main.ts:14664 | 241 | 301 | 992 | 15 | stan renderu drog |
| `wiarygodnoscZdarzeniaByOwner` | main.ts:9101 (`appendCredibilityEvent`, game/diplomacy-credibility.ts:158) | 123 zdarzen | 177 | 362 (POST: 441) | 4.7-6.3 | BEZ przycinania (tablica tylko rosnie, zdarzenia wygasaja logicznie, nie sa usuwane); skala mala (<=450 wpisow), koszt pomijalny -- OBSERWACJA |
| `units` / `cities` | -- | 461 / 77 | 482 / 80 | 490 / 106 | ~0.6 / 0.6 | stan gry, plateau jednostek od t.60 |
| `explored` | main.ts:11670 | 217 | 271 | 271 | 1.1 | plateau |
| `tradeRoutes` | main.ts:3297 | 74 | 83 | 118 | 0.9 | stan gry; mnoznik kosztu `xji` |
| `activeDeals`, `diplomacyRelations`, powiadomienia | -- | 26 | 28 | 30 | 0.1 | plateau, NIE rosna |
Pozostale ~40 module-level Map/Set/tablic: bez wzrostu > 1 wpisu/ture (pelny zrzut w `.jsonl` poza repo; tu tylko lista wzrostow z `an.py`).
Pamiec: po wymuszonym GC (`heapGC`) 312 MB (t.1) -> 625 MB (t.100) = +3.1 MB/ture, LINIOWO, bez przyspieszenia po t.60 (t.50 466 MB, t.100 625 MB: +3.2 MB/ture) -- zgodne ze wzrostem stanu gry/siatek, brak oznak wycieku wykladniczego. Surowy `usedJSHeapSize` (przed GC) zawyza o 40-120 MB (smieci).
DOM: 1289 -> 1301-1308 wezlow (plaski). Timery (setTimeout/aktywne): 0-1 (plaskie), interwaly 3 (plaskie).

## Listenery (licznik netto addEventListener - removeEventListener)
383 (t.1) -> 5135 (t.100), ok. +47/ture, od poczatku gry (rowniez t.5-20 przy 42 miastach) -- NIE przyspiesza po t.60.
Zrodla (osobny przebieg `--lkstack`, 10 tur): elementy `HTMLButtonElement/Div/Span`, przypinane po `innerHTML=` przy KAZDYM odswiezeniu paneli:
1) pasek narzedzi mapy `ui/mapToolbarHud.ts:161` (+29/ture, t.5->t.10), 2) panel wydarzen `ui/sidePanelHud.ts` (`sp-toggle-other-civs`/dismiss, +12/ture), 3) przycisk `data-wykonaj` w dolnym pasku `ui/bottomBarHud.ts:275` (+6/ture).
Elementy sa wymieniane (DOM plaski), listenery na odlaczonych wezlach znikaja z GC; licznik netto rosnie, bo `removeEventListener` nie jest wolany -- to NIE jest wyciek pamieci
(brak listenerow na window/document w top-12 miejsc). Ocena: licznik, nie wyciek.
