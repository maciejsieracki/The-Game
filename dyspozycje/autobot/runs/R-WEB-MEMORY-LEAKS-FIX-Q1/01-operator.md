STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-FIX-Q1
GOAL: naprawić w wersji webowej (`gra/`) ścieżki wycieku pamięci M1/M2/M3/M6 z audytu P4.3 §7 i dodać opt-in diagnostykę `?memdebug=1`, żeby właściciel mógł zmierzyć przed/po, czy to była przyczyna niegrywalności po wielu turach. Osobna gałąź, bez merge do `main`, bez deployu, bez `WERSJE.md`.
ZMIANY/COMMIT: patrz §2 i §6 (commit w worktree, bez push)
TESTY: §4 — bez regresji względem baseline'u operatora; `tsc` 0 błędów
BLOKADY: brak (uwagi: §5)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) → Final Control → test właściciela wg §7
DEPLOY/PUSH: NIE WYKONANO

**Zastrzeżenie (reguła anty-halucynacyjna):** nie uruchamiałem gry, przeglądarki ani profilera. Wykazuję statycznie, że zasoby są teraz zwalniane, i że bramki nie czerwienieją. **Wpływ na wydajność i na „niegrywalność po N turach" = `NIE_ZMIERZONO`** do testu właściciela (§7).

## 0. Baza

- Pin z dispatchu: `edb8fb56115e9dec0a58614dfb23ca6173d60c9a` — praca na `git checkout --detach edb8fb56`.
- **Rozjazd:** w chwili pracy `origin/main` = `cfc26c17` (3 commity po pinie: `c799325c`, `b4d37d9f`, `cfc26c17`). Pracowałem na pinie (jawny w dispatchu). Z plików, które zmieniam, między `edb8fb56` a `cfc26c17` zmienił się tylko `gra/src/main.ts`; oba moje miejsca w `main.ts` mają w `cfc26c17` identyczny kontekst (blok `finally` z `endTurnTransition(); endTurnInProgress = false; endTurnStartedAt = 0;` — `cfc26c17:main.ts:36236-36238`; import `perfDebugOverlay` bez zmian), więc łatka powinna przejść z przesunięciem — **nie zweryfikowane rebase'em** (decyzja orkiestratora).

## 1. Ustalenia — weryfikacja na kodzie (numery linii na `edb8fb56`, przed zmianą)

| # | Ustalenie (potwierdzone / odrzucone) | Dowód plik:linia |
|---|---|---|
| M1 | **POTWIERDZONE.** `visualKey` zawiera `level` (= populacja); zmiana klucza → `scene.remove(grp)` + `_disposeModel(id)` + nowy model. `_disposeModel` zwalnia tylko `userData['mats']` i `['perCityGeos']`, a w aktywnym stylu `'roblox'` (`mapRenderStyle.ts:40`) modele budują `buildMiastoBraz`/`buildMiastoKamien`, które tych kluczy nie ustawiają → przy każdej przebudowie 0 zwolnień. Wszystkie geometrie i materiały tych builderów są tworzone **per wywołanie** (nic współdzielonego): `new THREE.Mesh(new THREE.BoxGeometry…)` itd. | `cities.ts:475,481,490,504-511,516,934-945`; `cities.ts:238-248`; `miasto-braz.ts:103-104,113,127,140,212-228,367,375,383,514-531,678,687,695`; `miasto-kamien.ts:93-94,103,117,130,176-192,460,468,477`; brak `Sprite/Line/Points` i brak modułowych cache'y zasobów w obu plikach (grep) |
| M2 | **POTWIERDZONE.** `statTexCache` (`Map<string, CanvasTexture>`) — nowa tekstura dla każdego nowego klucza plakietki (`cityMapBadgeKey`: nazwa, populacja, produkcja, wzrost %, ostrzeżenie, hover, era, stolica, LOD). Usuwanie tylko: inny LOD (`syncStatChips`) i `dispose()` renderera. `_removeStatChip` celowo nie zwalnia tekstury (współdzielona). | `cities.ts:415,575,697,750-761,864-876`; `cityMapStatChip.ts:1034-1047,1071-1079,1130-1133` |
| M3 | **POTWIERDZONE (zawężone).** Dwa pola nigdy nie zdejmowane: `_deployToolbarDocClick` (`document` `click`) i `_deployLayoutListener` (`window` `resize`); domknięcia trzymają `this`. Dodatkowo `battleScene.ts:11919` nadpisywał pole bez zdjęcia poprzedniego nasłuchiwacza. **Natomiast `dispose()` JEST wołane na wszystkich 5 ścieżkach tworzenia** — nie trzeba zmieniać `main.ts`: `main.ts:27514`→`:27562`; `:28160`→`:28211`; `:29884` (fabryka) → `battle/mapFieldBattle.ts:512`→`:557`; `:30250`→`:30299`; `:30384`→`:30390`. Ścieżki wyjścia bez wyniku (Wycofaj się / anuluj) wołają `this.dispose()` wewnątrz sceny przed `onCancelCb`: `battleScene.ts:3250,3948,9837`. | `battleScene.ts:2191,3597-3714,11919-11929,13258-13263,13277,13513-13524,18102-18107`; `grep removeEventListener` dla obu pól → 0 |
| M6 | **POTWIERDZONE liczbowo (24/32 bez wywołań), ODRZUCONE jako wyciek rosnący z turami** — decyzja per funkcja w §3. 22 z 24 to singletony modułów (geometrie/materiały/tekstury współdzielone przez wszystkie żetony danego typu, ograniczone liczbą typów); wywołanie w trakcie gry zwolniłoby zasoby używane przez żywe meshe. Brak punktu cyklu życia, w którym WSZYSTKIE odbiorcy są niszczone (ładowanie gry odtwarza renderery bez sprzątania starej sceny — patrz §5 U3). | grep `^export function dispose` w `render/` → 32; wywołania poza definicją/komentarzem → 0 dla 24 (§3) |

## 2. Zmiany (plik:linia po zmianie)

| # | Zmiana | Plik:linia | Ryzyko |
|---|---|---|---|
| M1 | Nowa funkcja `registerOwnedMeshResources(group)` — zaraz po zbudowaniu modelu Brąz/Kamień zbiera (Set, bez duplikatów) geometrie i materiały wszystkich `Mesh` do `userData['mats']`/`['perCityGeos']`, więc istniejący `_registerModel`/`_disposeModel` je zwalnia. Wołana PRZED doczepieniem sprite'ów (plakietka ze wspólną teksturą, 🔥, wspólna geometria `THREE.Sprite`), więc rejestr obejmuje tylko zasoby tego modelu. | `gra/src/render/cities.ts:241-247` (owinięcie), `:252-279` (funkcja) | Niskie: buildery nie współdzielą zasobów między wywołaniami (dowód §1). Legacy `buildSettlementModel` (styl `civ`/`minecraft`, nieaktywny) — bez zmian. |
| M1 (d) | Zasoby starego modelu zwalniane dopiero **po** `scene.add(nowy)` (wcześniej: przed budową nowego). | `cities.ts:512-515`, `:540-541`, `:568-569` | Niskie; wszystko w jednym synchronicznym wywołaniu `sync()`. |
| M2 | `CityRenderer.pruneUnusedStatChipTextures()` — `dispose()` + usunięcie z cache każdej tekstury, której klucza nie ma w `statSpriteKeys` (czyli nie wisi na żadnym żywym sprite). Wołana na końcu `sync()` i na końcu tury (`main.ts`). Plus `getMemDebugCounts()`. | `cities.ts:593-623`; `main.ts:36001-36014` | Niskie: żywy sprite zawsze ma teksturę spod klucza z `statSpriteKeys` (`cities.ts:864-876` przed zmianą). Wygląd bez zmian — ten sam klucz maluje identyczną teksturę; obrazki godła/portretu/ikony wracają synchronicznie z cache obrazków (`cityMapStatChip.ts:265-267`). Koszt: ponowne malowanie canvasu plakietki po powrocie do wcześniejszego klucza (np. hover po `sync`) — `NIE_ZMIERZONO`. |
| M3 | `dispose()` zdejmuje `_deployToolbarDocClick` (`document` click) i `_deployLayoutListener` (`window` resize) i zeruje pola; przy ponownym budowaniu paska zdejmuje poprzedni nasłuchiwacz przed nadpisaniem. | `gra/src/battle/battleScene.ts:3708-3718`, `:11930-11934` | Niskie: `dispose()` idempotentne (pola zerowane); `finished = true` już na początku `dispose()`. |
| diag | Nowy plik `gra/src/render/memDebug.ts`: `isMemDebugEnabled()` (`?memdebug=1`, liczone raz), `logRendererMemoryAtTurnEnd(renderer, turn, extra)` — jedna linia `console.log` z `geometries`, `textures`, `programs`, licznikami miast i (jeśli przeglądarka udostępnia) `jsHeapMB`. Wywołanie w `finally` przejścia tury. Bez parametru: return po jednym porównaniu. | `gra/src/render/memDebug.ts` (nowy); `main.ts:135` (import), `:36001-36014` | Brak wpływu bez parametru (logika gry nietknięta; owinięte `try/catch`). |

Zero zmian w: `gra/data/**`, `gra/src/game|map|units|ai/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, plikach `miasto-*.ts`, `cityMapStatChip.ts`, `manualBattle.ts`.

## 3. Funkcje `dispose*` w `gra/src/render/` (32) — decyzje

Wywoływane już przed zmianą (8): `disposeCityMapBadgeTexturesForOtherLod`, `disposeCityMapOutline`, `disposeCityOkolicaOverlayGroup`, `disposeCityStatChipTextures`, `disposeMergedDecor`, `disposeRangeOverlayGroup`, `disposeTradeRoutesOverlayGroup`, `disposeWorkerFieldOverlayGroup` — bez zmian.

Niewywoływane (24) — **wszystkie: celowo nie wywołane w tej rundzie**:

| Funkcja | Plik | Powód |
|---|---|---|
| `disposeBrazKonnicaOpus5Geometries`, `disposeBrazLucznikNubijskiOpus5Geometries`, `disposeBrazMiecznikOpus5Geometries`, `disposeBrazProcarzOpus5Geometries`, `disposeBrazRydwanKapadokijskiOpus5Geometries`, `disposeBrazRydwanKonnyOpus5Geometries`, `disposeBrazRydwanWolyOpus5Geometries`, `disposeBrazTaranOpus5Geometries`, `disposeBrazWlocznikOpus5Geometries`, `disposeHastatiOpus5Geometries`, `disposeKamienBazoweOpus5Geometries`, `disposeKamienInkaOpus5Geometries`, `disposeKamienLucznicyOpus5Geometries`, `disposeKamienZuluTaranOpus5Geometries`, `disposeZelazoJezdziecOszczepamiOpus5Geometries`, `disposeZelazoKonnicaAsyryjskaOpus5Geometries` | `render/<nazwa>-opus5.ts` | Singletony geometrii modułu (np. `braz-konnica-opus5.ts:894-908`) współdzielone przez WSZYSTKIE żetony danego typu na mapie i w bitwach; liczba ograniczona typami → nie rośnie z turą. Wywołanie przy żywych żetonach = zwolnienie zasobu w użyciu (zasada (a) dispatchu). |
| `disposeKopalniaCynyGeometrie`, `disposeKopalniaZlotaGeometrie` | `render/kopalnia-*-opus5.ts` | Cache `GEOS`/`MATS` modułu (`kopalnia-cyny-opus5.ts:347-352`) współdzielone przez wszystkie kopalnie; ograniczone. |
| `disposeUnitStatPlateResources`, `disposeUnitOwnerEmblemResources`, `disposeUnitUpgradeBadgeResources`, `disposeUnitVeteranBadgeResources` | `render/unitStatPlate.ts:914`, `unitOwnerEmblem.ts:510`, `unitUpgradeBadges.ts:453`, `unitVeteranBadges.ts:287` | Cache'e modułu kluczowane ograniczonym zbiorem (pasma HP, właściciele, typy) — współdzielone przez wszystkie tabliczki; P4.3 §7.1 („Sprawdzone i ograniczone"). |
| `disposeWorkerFieldSpriteCache` | `render/workerFieldOverlay.ts:208` | Tekstury ikon robotników współdzielone przez wszystkie nakładki; ograniczone (`workerFieldOverlay.ts:56-61`). |
| `disposeRiverBuckets` | `render/riverLod.ts:408` | Kubełki rzek budowane raz przy budowie sceny (`scene.ts:1300,1348,2964-2986`); żyją tyle co scena. Jedyny sensowny punkt to zniszczenie sceny przy wczytaniu gry — tam dziś nikt nie sprząta całej starej sceny (§5 U3), więc samo wywołanie tej jednej funkcji niczego nie domyka. |

## 4. Bramki (pełne surowe wyjścia w plikach obok)

- `cd gra && npm ci` → `added 71 packages, and audited 72 packages in 7s` · `EXIT=0`.
- Baseline (przed zmianą, `edb8fb56`): `01-operator-bramki-baseline.txt` (680 linii, każde polecenie zakończone `EXIT=$?`).
- Po zmianie: `01-operator-bramki-po.txt` (680 linii).
- Skrypt (identyczny dla obu): `npx tsc --noEmit` + `node tools/<test>.cjs` dla 8 testów, po każdym `echo "EXIT=$?"`.

| Bramka | Dispatch oczekuje | Baseline | Po zmianie |
|---|---|---|---|
| `npx tsc --noEmit` | 0 błędów | brak wyjścia, `EXIT=0` | brak wyjścia, `EXIT=0` |
| `logic-test` | 213/213 | `LOGIC OK (213/213)` `EXIT=0` | `LOGIC OK (213/213)` `EXIT=0` |
| `tech-tree-test` | 19/19 | `19 pass, 0 fail` `EXIT=0` | `19 pass, 0 fail` `EXIT=0` |
| `research-test` | 33/33 | `PASSED: 33 / FAILED: 0` `EXIT=0` | identycznie `EXIT=0` |
| `unit-replace-test` | 13/13 | `(13/13)` `EXIT=0` | `(13/13)` `EXIT=0` |
| `combat-test` | 6/6 | `6/6 pass` `EXIT=0` | `6/6 pass` `EXIT=0` |
| `mgla-sciezka-inwariant-test` | 42/42 | **`41 pass, 1 fail` `EXIT=1`** (pre-istniejące) | **`41 pass, 1 fail` `EXIT=1`** — ten sam przypadek |
| `entity-card-contract-test` | 75/0 | `75 pass, 0 fail` `EXIT=0` | `75 pass, 0 fail` `EXIT=0` |
| `map-field-battle-test` | 22/22 | `24 ok, 0 fail` `EXIT=0` | `24 ok, 0 fail` `EXIT=0` |

`mgla`: błąd jest na `edb8fb56` PRZED moimi zmianami: `FAIL: [1] … ["src/battle/battleScene.ts:7998 ru.q = col;","src/battle/battleScene.ts:7999 ru.r = row;"]` (01-operator-bramki-baseline.txt:510). Po zmianie te same dwie linie kodu, przesunięte o +11 przez dopisek w `dispose()`: `battleScene.ts:8009/8010`. Skaner klasyfikuje po tekście linii (blok [5]: „klucz = tekst linii"), więc przesunięcie nie zmienia wyniku. Nie naprawiam (poza zakresem). `map-field-battle-test` ma dziś 24 przypadki, nie 22 — oba przebiegi 24/0. Jedyne różnice baseline↔po w `diff`: czasy `[civ] mapGen ms` i numer linii w komunikacie `mgla`.
Nie uruchamiałem: `npm run build`/`dev`, vite, `*-real-render-test`, `ai-buduje-budynki-test`, `unit-power-test`.

## 5. Uwagi (poza zakresem, do decyzji orkiestratora)

- U1: `mgla-sciezka-inwariant-test` czerwony pre-istniejąco na pinie (`battleScene.ts:7998-7999` niesklasyfikowane) — rozjazd z liczbą referencyjną dispatchu (42/42).
- U2: `CityRenderer.dispose()` nie zwalnia `SpriteMaterial` 🔥 (`revoltSprites.clear()` bez `dispose`, `cities.ts:694` przed zmianą) — drobne, ograniczone liczbą miast w buncie, przy nowej grze. Nie ruszałem.
- U3: ścieżki wczytania/nowej gry (`main.ts:37030-37034`, `:37154`, `:37499`, `:37748`, `:37972`) tworzą nowe `CityRenderer`/`UnitRenderer` bez `dispose()` poprzednich (scena jest odtwarzana) — potencjalny wyciek **na wczytanie**, nie na turę. Kandydat na osobny temat.
- U4: M4/M5 z P4.3 nie były w zakresie dispatchu — nietknięte.
- U5: istniejący `?perfDebug=1` (`main.ts:35864-35872`) loguje te same liczniki na STARCIE tury; `?memdebug=1` dodaje koniec tury + `programs` + liczniki miast. Można używać obu naraz.

## 6. Commit

Pliki (jawne `git add`): `gra/src/render/cities.ts`, `gra/src/render/memDebug.ts` (nowy), `gra/src/battle/battleScene.ts`, `gra/src/main.ts`, `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/01-operator.md`, `…/01-operator-bramki-baseline.txt`, `…/01-operator-bramki-po.txt`. SHA — w odpowiedzi Operatora do orkiestratora. `git diff --check` czysty. `gra/node_modules` usunięty po pracy.

## 7. INSTRUKCJA TESTU DLA WŁAŚCICIELA (krok po kroku)

Cel: sprawdzić, czy po poprawce liczniki pamięci przestają rosnąć z turami, i porównać z wersją bez poprawki. Potrzebne: Chrome/Edge na komputerze.

**A. Uruchom wersję Z poprawką**
1. Zbuduj/uruchom grę z gałęzi tego tematu tak, jak zwykle uruchamiasz wersję testową (orkiestrator poda adres po Final Control). Kroki A–B i 10–11, 12b, 13 działają tak samo w wersji zbudowanej (`vite build`, nazwy klas zminifikowane) i deweloperskiej (`npm run dev` na Twoim komputerze, nazwy klas czytelne). Jedynie krok 12a wymaga wersji deweloperskiej. *(R-WEB-MEMORY-LEAKS-FIX-Q1 r1 obrona, zarzut 2.)*
2. Do adresu dopisz `?memdebug=1&perfDebug=1` (jeśli w adresie jest już `?`, dopisz `&memdebug=1&perfDebug=1`). Przykład: `http://localhost:5173/?memdebug=1&perfDebug=1`. `perfDebug` jest potrzebny do uczciwego porównania z `main` (krok 9).
3. Naciśnij **F12** → zakładka **Console**. W polu filtra wpisz `memdebug`.
4. Zacznij nową grę (najlepiej ta sama mapa/ziarno i ten sam poziom trudności, który dawał spowolnienie), z kilkoma przeciwnikami AI.
5. Klikaj **Koniec tury**. Po każdej turze w konsoli pojawi się linia:
   `[memdebug] koniec tury=12 · geometries=… · textures=… · programs=… · cityModels=… · cityBadgeTextures=… · cityBadgeTexturesFreed=… · jsHeapMB=…`
6. Zapisuj (albo zrób zrzut ekranu konsoli) co ok. 10 tur, do tury 60–100.

**Co obserwować**
- `geometries` i `textures`: powinny rosnąć tylko razem z grą (więcej miast/jednostek/ulepszeń), a przy podobnej liczbie miast **stabilizować się**, nie rosnąć tura w turę bez końca.
- `cityBadgeTextures` powinno być mniej więcej równe liczbie widocznych miast (± kilka), a nie rosnąć z każdą turą.
- `cityBadgeTexturesFreed` > 0 oznacza, że stare plakietki są faktycznie zwalniane.
- `jsHeapMB` (tylko Chrome/Edge) — zużycie pamięci JS; po bitwach ręcznych nie powinno trwale skakać w górę.

**B. Porównanie z wersją BEZ poprawki (`origin/main`)**
7. Uruchom wersję z `origin/main` z `?perfDebug=1` (ta flaga już tam jest; loguje `geometries=`/`textures=` na STARCIE tury gracza — filtr konsoli: `perfDebug`). `?memdebug=1` na `main` nic nie robi.
8. Zagraj tę samą liczbę tur tym samym scenariuszem i zanotuj `geometries`/`textures` co 10 tur.
9. Porównaj **wyłącznie linie `[perfDebug] EOT start` z obu wersji** — to ten sam punkt pomiaru (start tury) i ten sam kod logu w obu wersjach. Linii `[memdebug]` (koniec tury, PO przycięciu cache plakietek) nie zestawiaj z `[perfDebug]` liczba do liczby: różny moment w turze daje różne wartości bez żadnego wycieku; `[memdebug]` służy do oceny trendu w wersji z poprawką i do liczników miast. Porównuj **trend** (przyrost na 10 tur przy podobnej liczbie miast i jednostek), nie pojedyncze wartości. Nie wiadomo z góry, która wersja wyjdzie lepiej — to jest właśnie pomiar (`NIE_ZMIERZONO` do Twojego testu). Jeśli obie wersje rosną tak samo i gra tak samo zwalnia, przyczyna niegrywalności leży gdzie indziej (to też jest ważny wynik). *(Obrona, zarzut 3.)*

**C. Pomiar pamięci w DevTools po N turach AI**
10. F12 → zakładka **Memory** → zaznacz **Heap snapshot** → **Take snapshot** w turze ~5. Zanotuj rozmiar (np. „85 MB").
11. Zagraj N tur (np. 50), stocz 2–3 bitwy ręczne. Kliknij ikonę kosza (**Collect garbage**), potem **Take snapshot** ponownie. Zanotuj rozmiar.
12. (Opcjonalnie) sprawdzenie, czy zakończone bitwy nie wiszą w pamięci (M3):
    - **12a — tylko wersja deweloperska (`npm run dev`):** w drugim snapshocie wybierz widok **Comparison** względem pierwszego i wyszukaj `BattleScene`. W wersji zbudowanej (`vite build`) ta nazwa jest zminifikowana i wyszukiwanie nic nie znajdzie, więc tam użyj 12b.
    - **12b — działa w każdej wersji:** w zakładce **Console** (poza bitwą, na mapie świata) wpisz `getEventListeners(document).click?.length` i `getEventListeners(window).resize?.length`. To polecenie konsoli DevTools Chrome/Edge, nie kod gry. Zanotuj obie liczby, stocz jedną bitwę ręczną z fazą rozstawienia, wróć na mapę i wpisz je ponownie. Zrób tak przy 2–3 bitwach. Na `origin/main` po każdej takiej bitwie oczekiwany jest trwały przyrost, bo dwa nasłuchiwacze sceny bitwy nie były zdejmowane (`addEventListener` w `battleScene.ts:11929`, `:13263`, `:13524`, `:18107` na `edb8fb56`). W wersji z poprawką liczby powinny wracać do wartości sprzed bitwy. Inne części gry mogą dokładać własne nasłuchiwacze, więc patrz na przyrost po bitwie, nie na wartość bezwzględną. *(Obrona, zarzut 2.)*
13. Zakładka **Performance** → **Record** → 1–2 tury → **Stop**: porównaj czas „Koniec tury" w turze ~5 i ~60 dla obu wersji.
14. Powtórz 10–13 na wersji z `origin/main` i porównaj liczby.

Wynik przekaż orkiestratorowi (liczby z konsoli co 10 tur + rozmiary snapshotów). Do tego czasu skutek poprawki = `NIE_ZMIERZONO`.
