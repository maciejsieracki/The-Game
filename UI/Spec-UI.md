# Spec-UI — dokumentacja deweloperska działu Civ-UI

**Autor:** sesja Civ-UI (architekt interfejsu)
**Zakres:** wszystko, co powstało w lane `gra/src/ui/*` + panel parametrów UI + podglądy.
**Stan na:** 2026-06-25. Wersja gry: v0.1 (Kamień & Brąz).
**Stack:** TypeScript + DOM (bez THREE), bundlowane przez Vite, single-file build.

> Czytelniku: ten dokument opisuje WSZYSTKO co robi UI, jak to jest zbudowane, od czego
> zależy, jak to wpiąć i jak stroić parametry. Reguły są wypunktowane tak, by nie było
> niedopowiedzeń. Interakcje z działami potwierdzone (lista sesji + odpowiedzi działów).

---

## 1. Zakres i granice (lane)

Civ-UI odpowiada za **prezentację** — interfejs, panele, HUD, menu. UI **nie** zawiera logiki
gry (ekonomia, walka, AI, generator mapy). UI **czyta** dane z modułów logiki i **woła** callbacki,
które realizuje silnik.

Żelazne reguły działu (obowiązują każdą zmianę w `src/ui/*`):

1. Edytuję **tylko** `src/ui/*` oraz `data/ui-params.json` (mój panel parametrów).
2. **Nie dotykam** `main.ts`, `render/*`, `battle/*`, `game/*`, Exceli innych działów.
   Wpięcie do `main.ts` uzgadnia **Civ-SILNIK** (jedyny właściciel `main.ts` i publikacji kanonu).
3. **Nie publikuję** kanonu `Gra-podglad.html`. Efekty pokazuję w **osobnych** podglądach HTML.
4. Build do testu: `npx vite build` (NIGDY `npm run build` / `export-data.py` — regenerują wszystkie JSON).
5. Kod ASCII + literalny UTF-8 dla polskich napisów (spójnie z `main.ts`). Po edycji — weryfikacja typów.
6. CSS interfejsu jest **scope'owany** (prefiks klasy roota), żeby nie psuć stylów gry.
7. API publiczne jest **wstecznie kompatybilne** i **degraduje się łagodnie**: panel działa nawet
   bez wstrzykniętych haków (pokazuje to, co umie policzyć sam; reszta = placeholder).

---

## 2. Mapa plików (co gdzie)

| Plik | Rola |
|---|---|
| `gra/src/ui/cityPanel.ts` | Pełnoekranowy **widok miasta** (panel 1). Główny moduł UI. |
| `gra/src/ui/mainMenu.ts` | **Menu główne + ustawienia** (panel 4). |
| `gra/src/ui/newGameFlow.ts` | **Kreator nowej gry** (5 kroków: Intro→Cywilizacja→Epoka→Ustawienia→Generowanie; lista cyw. z `civs.json`; callback `onStart(params)`). |
| `gra/src/ui/preBattle.ts` | Ekran przed-bitwy (istniejący moduł; obsługuje ekran potwierdzenia przed starciem). |
| `gra/src/ui/empireBalance.ts` | Panel **Bilans** (zbiorczy bilans zasobów / turę). |
| `gra/src/ui/hud.ts` | **HUD w grze** (pasek zasobów + przyciski + ramka minimapy). |
| `gra/src/ui/orderPanel.ts` | Panel **Zadowolenie/Porządek** (progi T1/T2, bunt). |
| `gra/src/ui/diplomacyPanel.ts` | **Panel Dyplomacji** (relacje + 5 tierów, podgląd v0.1). |
| `gra/src/ui/sciencePicker.ts` | **Picker celu badań** (#182 — gracz wybiera aktywnie badaną technologię). |
| `gra/src/ui/armyStackPrompt.ts` | **Okno „połącz armie"** (#167 — modal pytający o merge/stack przy spotkaniu jednostek). |
| `gra/src/ui/uiParams.ts` | Typowany **loader parametrów UI** (czyta `data/ui-params.json`). |
| `gra/data/ui-params.json` | **Wartości** parametrów UI (wyjście z Excela). |
| `Civ/UI/UI-parametry.xlsx` | **Panel sterowania** parametrami UI dla Maciej (wejście → JSON). |
| `Civ/UI/Gra-podglad-UI.html` | Podgląd widoku miasta (interaktywny; **nie kanon**). |
| `Civ/UI/Gra-podglad-MENU.html` | Podgląd menu + ustawień (**nie kanon**). |
| `Civ/UI/Gra-podglad-NAUKA.html` | Podgląd pickera celu badań (**nie kanon**). |
| `Civ/UI/Makieta-panel-armii.html` | Makieta panelu armii (#170/#178 — Total War transfer/wymiana; do akceptacji, jeszcze NIE moduł). |
| `Civ/UI/Spec-UI.md` | Ten dokument. |

> **Folder `Civ/UI/`** zbiera wszystkie *dostarczane* pliki UI (dokumentacja + panel sterowania +
> podglądy), żeby nie szukać po Civ root. **Kod gry** (`gra/src/ui/*`, `gra/data/ui-params.json`)
> zostaje w projekcie Vite. **Kanał** (`dyspozycje/UI.md`, `UI-DO-MASTERA.md`) zostaje w `dyspozycje/`.

Makiety-źródła (cudze, tylko czytane jako wzorzec wizualny): `Widok-miasta.html` (widok miasta),
`Makieta-flow-nowa-gra.html` (kreator nowej gry + język wizualny menu).

---

## 3. cityPanel.ts — widok miasta

### 3.1 Model
Pełnoekranowy **overlay** (`position:fixed; inset:0`) tworzony leniwie przy pierwszym pokazaniu,
dopisany do `document.body`. Otwierany kliknięciem miasta na mapie (woła go `main.ts`), zamykany
przyciskiem X / „Mapa" / klawiszem Esc (Esc obsługuje `main.ts`). Układ wg makiety `Widok-miasta.html`:
nagłówek → 3 kolumny → stopka → sekcja „Okolica" (siatka heksów).

### 3.2 Publiczne API
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showCityPanel` | `(city: City, map: GameMap, onClose: () => void) => void` | Pokazuje/odświeża widok dla miasta. **Sygnatura niezmieniona** — stare wywołania działają. |
| `hideCityPanel` | `() => void` | Ukrywa (display:none). |
| `isCityPanelOpen` | `() => boolean` | Czy widoczny. |
| `configureCityPanel` | `(config: CityPanelConfig) => void` | Wstrzyknięcie haków silnika (raz na starcie). Scala z poprzednią konfiguracją. |

Typy eksportowane: `CityPanelConfig`, `GarrisonUnit`.

### 3.3 Kontrakt `configureCityPanel` (wszystkie haki OPCJONALNE)
| Hak | Sygnatura | Domyślne bez haka | Po co |
|---|---|---|---|
| `data` | `GameData` | lazy `loadGameData()` | dane gry (budynki/jednostki/ekonomia) |
| `difficulty` | `'easy'\|'normal'\|'hard'` | `'normal'` | formuły ekonomii |
| `getCities` | `() => City[]` | brak → 1 miasto | wykrycie stolicy + nawigacja ◀▶ |
| `getEpoch` | `(ownerId) => number` | `1` (Kamień) | epoka miasta (lista budowy, nagłówek) |
| `getUnlockedTechs` | `(ownerId) => string[]` | `[]` | filtr dostępnych budynków/jednostek |
| `getBuiltBuildingIds` | `(cityId) => string[]` | brak → placeholder | panel „Budynki w mieście" + „Ulepsz" |
| `getProduction` | `(cityId) => CityProduction\|null` | store lokalny | współdzielenie kolejki z pętlą tury |
| `setProduction` | `(cityId, prod) => void` | store lokalny | zapis kolejki do stanu silnika |
| `getCityBuildingFlags` | `(cityId) => Partial<CityYieldContext>` | brak | efekty budynków w plonach (młyn/spichlerz…) |
| `getUnitsAt` | `(q, r) => GarrisonUnit[]` | placeholder | realny Garnizon (jednostki stojące na hexie miasta) |
| `getTreasury` | `(ownerId) => number` | przycisk ukryty | włącza „Wykup" (rush); brak → przycisk Wykup niewidoczny |
| `onRushBuy` | `(cityId, item, koszt) => void` | przycisk ukryty | silnik realizuje zapłatę + ukończenie; UI nie rusza skarbca |
| `onChange` | `(cityId) => void` | — | powiadomienie po zmianie kolejki (np. odśwież HUD) |
| `onRename` | `(cityId, newName) => void` | — | silnik wykonuje faktyczną zmianę nazwy w modelu |
| `onAutoManage` | `(cityId) => void` | — | przełącza zarządcę automatycznego (przypisanie pracowników = `assignWorkedTiles` w MIASTO) |
| `onArtView` | `(cityId) => void` | — | otwiera widok artystyczny miasta |
| `getCultureState` | `(cityId) => CultureState\|null` | sekcja placeholder | dynamiczna sekcja Kultura i Religia (patrz 3.4b) |
| `getResourceAccess` | `(cityId) => string[]` | sekcja placeholder | lista surowców do których miasto ma dostęp (v0.1 = boolean) |
| `getCityWorkedRange` | `(cityId) => number` | sekcja placeholder | promień okolicy roboczej wg EKONOMII: pop<5→r5, pop≥5→r10, pop≥10→r15 (helper `cityRangeForPopulation`) |
| `getWorkedTiles` | `(cityId) => {q,r}[]` | sekcja placeholder | pola faktycznie obrabiane (N = populacja) wg EKONOMII (`assignWorkedTiles`); UI podświetla je w kompaktowym podglądzie |

`GarrisonUnit = { nazwa: string; category?: string; health?: number; maxHealth?: number }`.

`CultureState = { kulturaSuma: number; przyrost: number; borderRadius: number; thresholds: number[]; zrodla?: { nazwa: string; wartosc: number }[] }`.

### 3.4 Sekcje ekranu
| Sekcja | Status | Źródło danych |
|---|---|---|
| Nagłówek: nazwa / właściciel / epoka / ludność | **REAL** | `City` + `getEpoch` |
| Nawigacja ◀▶ między miastami | **REAL** | `getCities` (miasta tego samego właściciela) |
| Nagłówek — 3 przyciski akcji (Zmień nazwę / Zarządca / Widok) | **REAL** | callbacki `onRename` / `onAutoManage` / `onArtView` |
| Skala czcionki (Mały/Średni/Duży/B.Duży) | **REAL** | `ui-params.json` (font_scale) |
| Bilans plonów (Praca/Pieniądz/Nauka/Kultura/Żywność) | **REAL** | ekonomia (patrz 3.5) |
| Produkcja: pozycja + pasek + ETA + Wstrzymaj/Wznów + Usuń + Wykup\* | **REAL** | kolejka + plony (patrz 3.6) |
| Kolejka budowy + reorder (↑/↓) + usuń (✕) | **REAL** | kolejka (3.6) |
| Dostępne do budowy + Buduj / Ulepsz (model compound/epokowy) | **REAL** | `production.availableProduction` + `getBuiltBuildingIds` |
| Magazyn Żywności (wzrost / ETA) | **REAL** | ekonomia (gdy Spichlerz) |
| Garnizon (HP) | **REAL\*** | `getUnitsAt` |
| Okolica (siatka heksów) | **REAL** | `map.hexes` |
| Kultura i Religia | **REAL\*** | `getCultureState` (patrz 3.4b); placeholder gdy brak haka |
| Surowce (dostęp, nie ilość) | **REAL\*** | `getResourceAccess`; placeholder gdy brak haka |
| Mieszkańcy (nastrój/Zad./Kont./Niezad.) | placeholder | — (poza v0.1) |
| Zdrowie miasta | placeholder | — (poza v0.1) |
| Specjaliści | placeholder | — (poza v0.1) |
| Podział Handlu (suwak 60/30/10) | placeholder | kontrakt EKONOMIA — per-miasto podział + recompute |
| Stopka: nawigacja, Skarb, Zakończ turę | placeholder | — |

\* sekcja „ożywa" dopiero gdy wstrzyknięty jest odpowiedni hak; bez niego pokazuje reprezentatywny placeholder.

### 3.4b Sekcja Kultura i Religia (getCultureState)
Gdy hak `getCultureState(cityId)` jest wstrzyknięty, panel renderuje dynamicznie:
- Kultura łącznie + przyrost/turę.
- Pasek postępu do następnej granicy (z tablicy `thresholds`).
- Zasięg granic (`borderRadius` pierścieni).
- Lista źródeł kultury (`zrodla[]`, opcjonalna).
- Religia — etap 2 (wpis informacyjny; akcje religijne poza v0.1).

Bez haka: placeholder z przykładowymi danymi + badge „podgląd".

### 3.4c AI read-only
Dla miast rywali (`city.ownerId !== 0`) panel ukrywa wszystkie akcje gracza:
- Ukryte: przyciski Buduj, Ulepsz, Wykup, Wstrzymaj/Wznów, Usuń, reorder kolejki.
- Widoczne: cały bilans, garnizon, surowce, kultura — tylko odczyt.
- Sekcja „Dostępne do budowy" wyświetla komunikat „Miasto rywala — budowa niedostępna (podgląd)".

### 3.5 Obliczanie plonów (parzystość z pętlą tury)
Panel liczy plony **tymi samymi czystymi funkcjami** co tick tury (`game/turn-economy.ts` →
`game/economy.ts`), więc liczby w panelu są **zgodne** z tym, co tura faktycznie bankuje:

1. `buildEconParams(data, difficulty)` — parametry ekonomii.
2. `toEconomyCity(city, params, isCapital)` — adapter runtime City → EconomyCity.
3. `workedTilesForCity(city, map)` — kafle: centrum + 6 sąsiadów.
4. `cityYieldPerTurn(econCity, worked, [], params, ctx)` → `{ praca, pieniadz, zywnosc, nauka, kultura }`.
5. `populationGrowth(econCity, zywnosc, params)` → magazyn/wzrost.

Reguła stolicy: pierwsze miasto danego właściciela = stolica (bez korupcji). `ctx` budynków jest
neutralny, dopóki `getCityBuildingFlags` nie poda flag (młyn/spichlerz/targowisko/mennica).
**Bez Spichlerza** nadwyżka żywności nie jest magazynowana (zgodnie z silnikiem) — panel mówi o tym wprost.

### 3.6 Kolejka produkcji
- Stan: `CityProduction = { kolejka: ProductionItem[]; postep: number; wstrzymana?: boolean }` (z `game/production.ts`).
- Źródło stanu: `getProduction`/`setProduction` jeśli wstrzyknięte; inaczej **wewnętrzny store sesyjny**
  (`Map<cityId, CityProduction>`), żeby przyciski działały także przed integracją.
- Operacje (czyste, niemutujące wejścia): `enqueue`, `dequeue` (z `production.ts`), `setPaused(prod, bool)` oraz
  `moveQueueItem(prod, index, dir)` (UI-only — zmienia kolejność tablicy; pozycja 0 = w budowie nie rusza się).
- **ETA** = `ceil((koszt − postep) / praca)` tur; gdy `praca ≤ 0` → „brak Pracy". Gdy `wstrzymana=true` → ETA nie wyświetla się (badge „⏸ wstrzymana").
- **Wstrzymaj / Wznów:** przełącza flagę `wstrzymana` przez `setPaused`. Postęp jest zachowywany — silnik nie bankuje Pracy w wstrzymanej kolejce.
- **Wykup (rush):** koszt = `ceil((koszt − postep) × rush_cost_mnoznik)` w złocie (param z JSON).
  Przycisk pojawia się **tylko** gdy są haki `getTreasury` + `onRushBuy`; nieaktywny gdy gracza nie stać.
  Faktyczna zapłata + ukończenie = `onRushBuy` (silnik) — UI nie rusza skarbca.
- **Ulepsz:** model **compound/epokowy** — `buildingLevelForEpoch(def.epokaWejscia, epoch, def.maksPoziom)` wyznacza docelowy poziom dla bieżącej epoki. Przycisk pojawia się gdy `targetLevel > 1` (tj. epoka pozwala na wyższy poziom). Koszt i nazwa poziomu z `buildingProductionItem(id, data, targetLevel)` + `def.nazwyPoziomow`.
- **Postęp/ukończenie co turę robi SILNIK** (`advanceProduction`) — patrz 8 (zlecenie A). UI tylko mutuje kolejkę i pokazuje stan.

### 3.7 Okolica (kompaktowy wariant B — decyzja Macieja 2026-06-25)

Sekcja Okolica wyświetla **kompaktowy podgląd** (wariant B), nie pełną siatkę terytorium. Pełne
terytorium (do r15) i granice kultury renderuje **MAPA** na mapie świata (handoff:
`_handoff/UI-do-MASTER_okolica-render-mapa.md`).

**Co pokazuje panel:**

| Element | Opis |
|---|---|
| Zasięg roboczy | r5 / r10 / r15 (wg populacji); etykieta: „małe/średnie/duże miasto" |
| Pól w zasięgu | `1 + 3R(R+1)` heksów (wzór dla promienia R) |
| Pól obrabianych | N = populacja; realne z `getWorkedTiles`; brak haka → fallback d≤1 |
| Granica kultury | `getCultureState.borderRadius` (+0..N pierścieni); brak haka → 0 |
| Podgląd SVG | Ograniczone okno (`min(okolica_promien, 3)`); pola obrabiane = zielona obwódka; centrum = złota |
| Hint | „Pełny zasięg (~X pól) i granice kultury widoczne na mapie świata." |

**Kontrakt danych od EKONOMII:** haki `getCityWorkedRange` i `getWorkedTiles` (patrz tabela 3.3).
Brak haka → łagodny fallback (zasięg nieznany = „—", obrabiane = pierścień d≤1).

Heks pointy-top, rozmiar `okolica_hex_px`. Kolor/ikona wg terenu (`TEREN_COL`/`TEREN_ICON`,
las z `Nakladka.Las`). Dystans heksowy sześcienny. **Geometrii heksów świata nie dotyka**
(to lane RENDER) — to osobna, mała siatka poglądowa.

### 3.8 Style i degradacja
- Cały CSS pod `.civ-cs` (zmienne kolorów + komponenty). Nie wycieka do gry.
- Brak haka → sekcja pokazuje placeholder lub ukrywa kontrolkę; nigdy nie rzuca błędem (try/catch wokół ekonomii).

### 3.9 Zależności (importy)
`../game/cities` (typ City) · `../types/map` (GameMap) · `../types/hex` (TerenBazowy, Nakladka) ·
`../data/loader` (loadGameData, GameData) · `../game/production` (availableProduction, frontItem,
enqueue, dequeue, setPaused, buildingProductionItem, buildingLevelForEpoch, typy) · `../game/turn-economy` (buildEconParams,
workedTilesForCity, toEconomyCity, Difficulty) · `../game/economy` (cityYieldPerTurn, populationGrowth,
CityYieldContext) · `./uiParams` (UI_PARAMS). Wszystko **read-only** względem cudzych lane.

---

## 4. mainMenu.ts — menu główne + ustawienia

### 4.1 Model
Pełnoekranowy overlay (`.civ-menu`) w języku wizualnym `Makieta-flow-nowa-gra.html` (ciemne tło + złoto,
Palatino, ornament, tytuł „THE GAME"). Dwa ekrany w jednym overlayu: Menu ↔ Ustawienia.
**Decoupled** — zero importów z `game/*`/`data/*` (poza `uiParams`); steruje się callbackami.

### 4.2 Publiczne API
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showMainMenu` | `(config?: MainMenuConfig) => void` | Pokazuje menu; opcjonalnie (re)konfiguruje. |
| `hideMainMenu` | `() => void` | Ukrywa. |
| `isMainMenuOpen` | `() => boolean` | Czy widoczne. |
| `getMenuSettings` | `() => Record<string,string>` | Bieżące ustawienia jako mapa `key → wybrana opcja`. |

Typy: `MainMenuConfig`, `MenuSetting`.

### 4.3 `MainMenuConfig` (haki opcjonalne)
| Pole | Typ | Opis |
|---|---|---|
| `version` | `string` | Tekst wersji (domyślnie `UI_PARAMS.menu.wersja`). |
| `hasSave` | `() => boolean` | true → aktywne „Kontynuuj"/„Wczytaj". |
| `onNewGame` | `() => void` | „Nowa Gra" → kreator nowej gry. |
| `onContinue` / `onLoad` | `() => void` | wczytanie zapisu (silnik). |
| `onAbout` / `onQuit` | `() => void` | O grze / wyjście. |
| `onSettingsChange` | `(values: Record<string,string>) => void` | po każdej zmianie ustawienia. |

### 4.4 Pozycje menu
Nowa Gra (główny), Kontynuuj, Wczytaj Grę, Ustawienia, O Grze, Wyjdź.
„Kontynuuj"/„Wczytaj" są **wyszarzone** dopóki `hasSave()` ≠ true (system zapisu = silnik).

### 4.5 Ustawienia
Katalog ustawień pochodzi z `UI_PARAMS.menu.ustawienia` (patrz 5). Strzałki ◂ ▸ zmieniają wybór,
„Wstecz" wraca do menu, każda zmiana woła `onSettingsChange(getMenuSettings())`. To ustawienia
**globalne** (audio/grafika/język/skala UI/mgła). Ustawienia **rozgrywki** (trudność/mapa/rywale)
należą do kreatora nowej gry (krok 4 makiety), nie tutaj.

---

## 4a. Nowe moduły UI (stan 2026-06-25)

### 4a.1 newGameFlow.ts — Kreator nowej gry

**Cel:** 5-krokowy kreator nowej gry w stylu wizualnym menu głównego (ciemne tło + złoto + Palatino).
Kroki: **Intro → Cywilizacja → Epoka → Ustawienia → Generowanie**.

**Decoupled:** lista cywilizacji z `civs.json` przez loader; ustawienia rozgrywki z `ui-params.json` (sekcja `nowa_gra`). Silnik dostarcza tylko callback `onStart`.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showNewGameFlow` | `(config: NewGameFlowConfig) => void` | Otwiera kreator (krok 1). |
| `hideNewGameFlow` | `() => void` | Ukrywa (bez usuwania z DOM). |
| `isNewGameFlowOpen` | `() => boolean` | Czy widoczny. |

**`NewGameFlowConfig`:**
| Pole | Typ | Opis |
|---|---|---|
| `data?` | `GameData` | Dane gry (civs.json); brak → lazy loadGameData(). |
| `getCivs?` | `() => CivOption[]` | Nadpisanie listy cywilizacji (silnik/test). |
| `onStart` | `(params: NewGameParams) => void` | **Wymagane.** Silnik startuje grę z wybranymi parametrami. |
| `onCancel?` | `() => void` | Powrót do menu głównego (przycisk Wstecz na kroku 1). |

**`NewGameParams`** (wynik kreatora przekazywany do `onStart`):
`{ civId, civName, epoch, difficulty, mapSize, rivals, speed, seed }`.

**Typy eksportowane:** `CivOption`, `NewGameParams`, `NewGameFlowConfig`.

**Status:** funkcjonalny (5 kroków, wybór cywilizacji z civs.json, epoka Kamień/Brąz dostępna; ustawienia z `ui-params.json → nowa_gra`).

---

### 4a.2 empireBalance.ts — Panel Bilans

**Cel:** zbiorczy bilans wszystkich zasobów imperium na turę (Praca, Pieniądz, Nauka, Kultura, Żywność) — widok sumaryczny, nie per-miasto.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showBalancePanel` | `({ getBalance, getPlayer?, getTurn? }) => void` | Otwiera/odświeża panel. |
| `updateBalancePanel` | `() => void` | Odświeża dane (bez zamykania). |
| `hideBalancePanel` | `() => void` | Ukrywa panel. |
| `isBalancePanelOpen` | `() => boolean` | Czy widoczny. |

`getBalance()` zwraca `{ praca, pieniadz, nauka, kultura, zywnosc }` — sumaryczne delty na turę. Haki `getPlayer` i `getTurn` opcjonalne (podpis gracza / numer tury w nagłówku).

**Status:** funkcjonalny; bez haków pokazuje placeholder zer.

---

### 4a.3 hud.ts — HUD w grze

**Cel:** stały pasek zasobów + przyciski akcji + ramka minimapy widoczne podczas rozgrywki.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showHud` | `(config: HudConfig) => void` | Inicjalizuje i pokazuje HUD. |
| `updateHud` | `() => void` | Odświeża wyświetlane wartości. |
| `hideHud` | `() => void` | Ukrywa HUD. |
| `isHudOpen` | `() => boolean` | Czy widoczny. |

`HudConfig` zawiera `getState` (wymagane) oraz opcjonalne callbacki akcji: `onEndTurn?`, `onOpenCities?`, `onOpenScience?`, `onOpenDiplomacy?`, `onOpenMenu?`.

`getState()` zwraca `HudState`: `{ zloto, zlotoRate, praca, pracaRate, wplyw, nauka, kultura, zadowolenie, osiedla, osiedlaMax, nacja, tura, epoka, epokaPostep?, badana? }`.

**Kluczowe haki configa:** `getState` (dane do wyświetlenia), callbacki przycisków (każdy opcjonalny — przycisk ukryty gdy brak).

**Minimapa:** aktualnie **placeholder** (ramka + napis). Render minimapy należy do działu **MAPA** — HUD tylko rezerwuje przestrzeń i przekazuje element DOM.

**Status:** funkcjonalny pasek + przyciski; minimapa = placeholder.

---

### 4a.4 orderPanel.ts — Panel Zadowolenie/Porządek

**Cel:** wyświetla stan Zadowolenia (Szczęście + Porządek) dla wybranego miasta, sygnalizuje przekroczenie progów T1/T2 i stan buntu.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showOrderPanel` | `(cityId: string, { getOrderState? }) => void` | Otwiera panel dla miasta. |
| `updateOrderPanel` | `(cityId?: string) => void` | Odświeża dane (opcjonalnie zmienia miasto). |
| `hideOrderPanel` | `() => void` | Ukrywa panel. |
| `isOrderPanelOpen` | `() => boolean` | Czy widoczny. |

`getOrderState(cityId)` zwraca `{ szczescie, porzadek, progT1, progT2, bunt? }`. Hak pochodzi od działu **MIASTO** (`order.ts`).

**Logika progów:** Zadowolenie = Szczęście + Porządek. Gdy wynik spada poniżej `progT1` → gorsza efektywność Pracy (T1). Gdy spada poniżej `progT2` → stan buntu (T2). Panel wyświetla aktualny próg, pasek stanu i ostrzeżenie buntu.

**Status:** funkcjonalny UI; bez haka `getOrderState` = placeholder (dane zerowe).

---

### 4a.5 diplomacyPanel.ts — Panel Dyplomacji

**Cel:** przegląd relacji dyplomatycznych gracza z innymi cywilizacjami — tier statusu + opcjonalnie Zaufanie/Respekt. Wersja v0.1 = **tylko podgląd** (bez akcji dyplomatycznych — te wchodzą po wpięciu `applyDiplomaticEvent` do pętli tury).

**DOM-only, decoupled:** zero importów z `game/*` ani `types/*`. Dane podaje silnik przez `getRelations()`.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showDiplomacyPanel` | `(config: DiplomacyPanelConfig) => void` | Pokazuje panel; brak haka → placeholder 5 cywilizacji (po jednej per tier). |
| `updateDiplomacyPanel` | `() => void` | Odświeża dane (np. po zakończeniu tury lub zdarzeniu dyplomatycznym). |
| `hideDiplomacyPanel` | `() => void` | Ukrywa (bez usuwania z DOM). |
| `isDiplomacyPanelOpen` | `() => boolean` | Czy widoczny. |

**Typy eksportowane:**

`DiploRelation = { civ: string; tier: number; zaufanie?: number; respekt?: number }`.

`DiplomacyPanelConfig = { getRelations?: () => DiploRelation[] }`.

Funkcje pomocnicze (eksportowane): `tierLabel(t)`, `tierBg(t)`, `tierFg(t)`.

**5 tierów OFICJALNYCH (potwierdzone przez dział CYWILIZACJE):**
| Tier | Nazwa | Warunek |
|---|---|---|
| 0 | Wojna | STAN (`status='wojna'`) — nadrzędne, nie score |
| 1 | Wrogi | score niski |
| 2 | Neutralny | start relacji = 50 |
| 3 | Przyjazny | score wysoki |
| 4 | Sojusz | STAN (`status='sojusz'`) LUB score ≥ 120 + traktat |

**Mapowanie relacja → tier:** robi wyłącznie **SILNIK** (`diplomacy.relationTier`). UI bierze gotowy tier z `getRelations()` — nie duplikuje progów ani logiki.

**CSS scope:** `.civ-diplo`. Paleta: slate `rgba(20,24,32,.94)` + złoto `#e0b24a` (spójna z `empireBalance.ts`).

**Status:** funkcjonalny podgląd (tier + Zaufanie/Respekt); akcje dyplomatyczne poza v0.1.

---

### 4a.6 sciencePicker.ts — Picker celu badań (#182)

**Cel:** gracz aktywnie wybiera technologię, którą aktualnie bada (nauka sterowana graczem).
Picker wie o dostępnych techach, puli nauki i aktualnym celu — UI tylko pyta i zwraca wybór.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `configureSciencePicker` | `(cfg: SciencePickerConfig) => void` | Wstrzyknięcie haków silnika (raz na starcie). |
| `showSciencePicker` | `(ownerId?: number) => void` | Otwiera overlay (domyślnie `ownerId=0` = gracz). |
| `hideSciencePicker` | `() => void` | Ukrywa. |
| `isSciencePickerOpen` | `() => boolean` | Czy widoczny. |

**`SciencePickerConfig` (wszystkie haki opcjonalne):**
| Hak | Sygnatura | Domyślne bez haka | Po co |
|---|---|---|---|
| `getAvailableTechs` | `(ownerId) => {id, nazwa, koszt, opis?, prereqi?}[]` | placeholder lista | dostępne do badania technologie (po prereq) |
| `getCurrentTarget` | `(ownerId) => string\|null` | null | aktualnie badana tech (podświetlenie) |
| `getSciencePool` | `(ownerId) => number` | 0 | aktualna pula nauki gracza (pasek postępu) |
| `onSelectTarget` | `(techId: string) => void` | — | silnikowy `setPlayerResearchTarget`; UI wywołuje po kliknięciu |

**UX:** overlay `.civ-sci`; lista dostępnych techów (siatka lub lista); pasek pula vs koszt
aktualnego celu; klik = wybór → `onSelectTarget(techId)` → zamknięcie. Graceful degradation:
bez haków pokazuje placeholder z przykładowymi technologiami.

**Podgląd:** `UI/Gra-podglad-NAUKA.html`.

**Zależności:** SILNIK/CYWILIZACJE (drzewko tech + pula nauki + setter `setPlayerResearchTarget`).

**Status:** do implementacji; kontrakt API zatwierdzone.

---

### 4a.7 armyStackPrompt.ts — Okno „połącz armie" (#167)

**Cel:** gdy dwie jednostki gracza spotkają się na tym samym polu, UI pyta: połączyć armie
czy zachować osobno. Logika merge/stacking = UNITS; UI tylko zadaje pytanie i zwraca wybór.

**Publiczne API:**
| Funkcja | Sygnatura | Opis |
|---|---|---|
| `showArmyStackPrompt` | `({ onMerge, onKeep, atakujacy?, cel? }: ArmyStackPromptConfig) => void` | Pokazuje modal. |
| `hideArmyStackPrompt` | `() => void` | Ukrywa (bez usuwania z DOM). |
| `isArmyStackPromptOpen` | `() => boolean` | Czy widoczny. |

**`ArmyStackPromptConfig`:**
| Pole | Typ | Opis |
|---|---|---|
| `onMerge` | `() => void` | **Wymagane.** Silnik/UNITS realizuje scalenie. |
| `onKeep` | `() => void` | **Wymagane.** Gracz rezygnuje z łączenia. |
| `atakujacy?` | `string` | Nazwa/typ jednostki atakującej (do wyświetlenia w modalu). |
| `cel?` | `string` | Nazwa/typ jednostki docelowej (do wyświetlenia w modalu). |

**UX:** modal `.civ-stack`; dwa przyciski: **[Połącz armie]** i **[Nie łącz]**;
Esc lub klik w tło = Nie łącz (woła `onKeep`). UI nie decyduje o logice merge — wyłącznie
pyta i zwraca wybór przez callbacki.

**CSS scope:** `.civ-stack`. Brak zależności od `game/*` poza przekazanymi callbackami.

**Status:** do implementacji; kontrakt API zatwierdzone.

---

### 4a.8 Makieta-panel-armii.html (#170/#178 — do akceptacji)

**Status: MAKIETA (jeszcze NIE moduł).** Plik `UI/Makieta-panel-armii.html` to interaktywna
makieta panelu transferu/wymiany armii w stylu Total War (zarządzanie składem armii między
jednostkami / miastem). Po akceptacji przez Maciej → implementacja modułu.

Logikę transferu i walidacji składu da **UNITS**. UI będzie tylko widokiem i formularzem wyboru.

Numer zadania: #170 (panel transferu) i #178 (wymiana armii między siłami).

---

## 5. Panel parametrów UI: Excel → JSON → kod

### 5.1 Łańcuch
```
UI-parametry.xlsx  --(eksport celowany)-->  gra/data/ui-params.json  -->  gra/src/ui/uiParams.ts (UI_PARAMS)  -->  cityPanel.ts / mainMenu.ts / newGameFlow.ts
```
Maciej zmienia liczbę w Excelu (niebieskie komórki) → eksport do JSON → gra czyta nowe wartości.

### 5.2 Struktura `ui-params.json`
```json
{
  "panel_miasta": {
    "rush_cost_mnoznik": 0.8,
    "okolica_promien": 2,
    "okolica_hex_px": 30,
    "font_scale": [ {"label":"Maly","px":13}, {"label":"Sredni","px":14}, {"label":"Duzy","px":16}, {"label":"B.Duzy","px":18} ],
    "font_scale_domyslna_px": 16
  },
  "menu": {
    "wersja": "0.1 • Kamień & Brąz",
    "ustawienia": [ { "key":"muzyka","label":"Muzyka","opts":["Wył.","Cicho","Średnio","Głośno"],"descs":["Bez muzyki","20%","55%","90%"],"domyslny":2 }, ... ]
  },
  "nowa_gra": {
    "ustawienia": [ { "key":"trudnosc","label":"Trudność","opts":[...],"descs":[...],"domyslny":1 }, ... ]
  }
}
```

### 5.3 Mapowanie Excel ↔ JSON
| Arkusz | Sekcja JSON |
|---|---|
| `Panel-miasta` | `panel_miasta` (skalary + tabela `font_scale[]`) |
| `Menu` | `menu` (`wersja` + tabela `ustawienia[]`; opcje/opisy rozdzielone znakiem `|`) |
| `Nowa-gra` | `nowa_gra` (tabela `ustawienia[]` kreatora: trudność/rozmiar mapy/rywale/prędkość) |
| `INSTRUKCJA` | (tylko opis; nie eksportuje się) |

### 5.4 Typy w `uiParams.ts`
| Typ | Opis |
|---|---|
| `UiPanelMiasta` | Parametry `cityPanel.ts` (rush_cost_mnoznik, okolica_*, font_scale*). |
| `UiMenu` | Parametry `mainMenu.ts` (wersja, ustawienia[]). |
| `UiNowaGra` | Parametry `newGameFlow.ts` (ustawienia[] kreatora rozgrywki). |
| `UiNowaGraSetting` | Jeden wiersz ustawień kreatora: `{ key, label, opts, descs, domyslny }`. |
| `UiMenuSetting` | Jeden wiersz ustawień globalnych (analogiczny do UiNowaGraSetting). |
| `UiParams` | Całość: `{ panel_miasta, menu, nowa_gra }`. |

`UI_PARAMS: UiParams` — gotowy obiekt do importu w modułach UI.

### 5.5 Tabela parametrów
| Klucz | Typ | Zakres / uwagi | Domyślna | Używane w |
|---|---|---|---|---|
| `panel_miasta.rush_cost_mnoznik` | number | 0..1 (0.8 = 80% pozostałej Pracy) | 0.8 | cityPanel „Wykup" |
| `panel_miasta.okolica_promien` | int | 2 zalecane (3 = większa siatka) | 2 | cityPanel Okolica |
| `panel_miasta.okolica_hex_px` | int (px) | rozmiar heksa | 30 | cityPanel Okolica |
| `panel_miasta.font_scale[]` | {label,px}[] | etykiety ASCII | 13/14/16/18 | cityPanel skala |
| `panel_miasta.font_scale_domyslna_px` | int (px) | musi pasować do jednej z opcji | 16 | cityPanel skala (start) |
| `menu.wersja` | string | tekst podtytułu | „0.1 • Kamień & Brąz" | mainMenu |
| `menu.ustawienia[].domyslny` | int | indeks 0..n-1 | per wiersz | mainMenu ustawienia |
| `nowa_gra.ustawienia[]` | UiNowaGraSetting[] | ustawienia kreatora | per wiersz | newGameFlow (krok 4) |

### 5.6 Reguła eksportu (krytyczna)
Eksportuj **tylko** `ui-params.json` (celowany skrypt na te arkusze). **NIGDY** pełny `export-data.py`
ani `npm run build` — regenerują WSZYSTKIE JSON-y i kasują pracę innych działów. (To samo prawo
obowiązuje pozostałe panele: Ekonomia-parametry.xlsx → econ-params.json itd.)

### 5.7 Uwaga o zakresie
UI = prezentacja. Współczynniki **gry** (Praca, plony, wzrost, koszty/efekty budynków, koszty nauki)
**nie** są w `ui-params.json` — siedzą w panelach innych działów (Ekonomia-parametry.xlsx, Budynki.xlsx,
Technologie-drzewko.xlsx…). Tu są wyłącznie parametry interfejsu.

---

## 6. Podglądy HTML i makiety (nie kanon)

Pliki te są **samodzielne** — działają bez builda Vite, na danych przykładowych. Służą do **oceny
wyglądu** przez Maciej/mastera. Nie są kanonem i nie wchodzą do builda.

| Plik | Co pokazuje | Status |
|---|---|---|
| `Gra-podglad-UI.html` | Widok miasta (cityPanel) + kolejka/Buduj/Ulepsz/Zakończ turę | aktywny podgląd |
| `Gra-podglad-MENU.html` | Menu główne ↔ Ustawienia (mainMenu) | aktywny podgląd |
| `Gra-podglad-NAUKA.html` | Picker celu badań (sciencePicker) — lista techów, pasek puli, wybór | nowy (do zbudowania) |
| `Makieta-panel-armii.html` | Panel transferu/wymiany armii (#170/#178) — do akceptacji przez Maciej | makieta (jeszcze NIE moduł) |

`Gra-podglad-UI.html` jest zaktualizowany o sekcję Okolica kompakt (wariant B): statystyki zasięgu
roboczego, pasek pól obrabianych, podgląd SVG heksów.

Wersja „prawdziwa" każdego widoku to moduły TS (`cityPanel.ts`, `mainMenu.ts` itp.), które
renderują to samo na danych silnika.

---

## 7. Wpięcie do silnika (dla Civ-SILNIK)

### 7.1 Widok miasta — minimalnie (działa już po samym rebuildzie)
`main.ts` woła `showCityPanel(city, map, () => {})` (bez zmian). Panel sam robi lazy `loadGameData()`.

### 7.2 Widok miasta — pełne (gdy SILNIK robi M2/produkcję)
```ts
import { configureCityPanel } from './ui/cityPanel';
import { advanceProduction } from './game/production';
const prodMap = new Map<string, import('./game/production').CityProduction>();
configureCityPanel({
  data,
  getCities: () => cities,
  getEpoch: () => player.era,
  getUnlockedTechs: () => [...player.zbadane],
  getBuiltBuildingIds: (id) => builtMap.get(id) ?? [],
  getProduction: (id) => prodMap.get(id) ?? null,
  setProduction: (id, p) => { prodMap.set(id, p); },
  getUnitsAt: (q, r) => units.filter(u => u.q===q && u.r===r).map(u => ({ nazwa:u.typeId, category:u.category, health:u.health, maxHealth:u.maxHealth })),
  getTreasury: () => player.skarbiec,
  onRushBuy: (id, item, koszt) => { player.skarbiec -= koszt; /* dodaj item do miasta */ },
  onChange: () => updateHud(),
  onRename: (id, name) => { cities.find(c => c.id===id)!.name = name; },
  onAutoManage: (id) => { assignWorkedTiles(id); },  // MIASTO: assignWorkedTiles
  getCultureState: (id) => cultureMgr.getState(id),  // MIASTO: culture-religion.ts
  getResourceAccess: (id) => resourceMgr.getAccess(id),  // MIASTO: surowce
});
// w pętli tury, per miasto gracza:
const tick = econ.perCity.find(t => t.cityId === c.id);
const r = advanceProduction(prodMap.get(c.id) ?? {kolejka:[],postep:0}, tick?.praca ?? 0);
prodMap.set(c.id, r.prod);
if (r.completed) { /* zastosuj: dodaj jednostkę/budynek */ }
```

### 7.3 Menu główne
```ts
import { showMainMenu } from './ui/mainMenu';
showMainMenu({
  onNewGame: () => startNewGameFlow(),
  hasSave: () => saves.length > 0,
  onContinue: () => loadLast(), onLoad: () => openLoadScreen(),
  onQuit: () => window.close(),
  onSettingsChange: (v) => applyUiSettings(v),
});
```

### 7.4 Zlecenia dla SILNIK/MIASTO (żeby placeholdery stały się realne)
- **A** [M2]: wpiąć `production.ts` w pętlę tury (prodMap + `advanceProduction` + zastosowanie `completed`)
  oraz wystawić `getProduction/setProduction`. → „Buduj" realnie buduje.
- **B**: śledzić zbudowane budynki per miasto + ich efekty w ekonomii (`toEconomyCity`/ctx). → realne
  „Budynki w mieście", „Ulepsz", magazyn/wzrost, pełny Bilans.
- **C**: 1 linia `configureCityPanel({ data, getCities, getEpoch, getUnlockedTechs })`.

---

## 8. Interakcje z innymi działami (potwierdzone)

Sesje/działy projektu: **Master** (koordynacja), **EKONOMIA**, **Dyplomacja**, **Dane Cywilizacji (DANE)**,
**Units / Battle (UNITS+BITWA)**, **MAPA (RENDER)**, **Silnik (SILNIK)**, **UI** (ten dział), **MIASTO**,
**AI**. Poniżej styki UI z każdym z nich.

| Dział | Co dostarcza UI / czego UI używa | Kierunek | Granica własności |
|---|---|---|---|
| **SILNIK** (`main.ts`, pętla tury, kanon) | woła `showCityPanel`/`showMainMenu`; wpina `configureCityPanel`; tyka `advanceProduction`; publikuje kanon | UI ⇄ SILNIK | UI daje komponenty + kontrakt; SILNIK je wpina i buduje. UI nie rusza `main.ts`. |
| **MIASTO** (`game/cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, Budynki.xlsx) | typy i czyste API produkcji/budynków; dane Porządku/Kultury/Surowców | MIASTO → UI | Logika miasta = MIASTO. UI tylko prezentuje. Kolejka: kształty trzyma UI, advance robi SILNIK. |
| **DANE** (`Cywilizacje.xlsx` → `civs.json`) | lista cywilizacji + religie (do kreatora nowej gry + panelu Kultura/Religia) | DANE → UI | Treść cywilizacji = DANE; UI ją wyświetla. |
| **RENDER-MAPA** (`render/*`, `map/*`) | mapa (`GameMap`, `hexes`) używana w Okolicy; spójność palety terenu | RENDER → UI | Geometria/render świata = RENDER. Okolica w panelu to osobna mała siatka poglądowa, nie kanon mapy. |
| **BITWA/UNITS** (`battle/*`, `render/units.ts`) | dane jednostek do Garnizonu (`getUnitsAt`); `preBattle.ts` to osobny ekran | BITWA → UI | Statystyki/modele jednostek = ich; UI je listuje. |
| **EKONOMIA** (`economy.ts`, `turn-economy.ts`, Ekonomia-parametry.xlsx) | formuły plonów/wzrostu (panel liczy nimi, by mieć parzystość z turą) | EKONOMIA → UI | Liczby ekonomii = EKONOMIA; UI nie zmienia formuł, tylko je wywołuje. Suwak Podziału Handlu (real per-miasto) + zasięg okolicy + nastroje = pytania otwarte do EKONOMIA. |
| **Dyplomacja** (`game/diplomacy.ts`, Dyplomacja.xlsx → diplomacy.json) | tier relacji (obliczony przez SILNIK via `diplomacy.relationTier`) + dane Zaufanie/Respekt | Dyplomacja → UI | Logika relacji = Dyplomacja. UI bierze gotowy tier z `getRelations()` — nie duplikuje progów. |
| **AI** (`game/ai.ts`, AI-parametry.xlsx → ai-params.json) | stan miast/jednostek rywali do podglądu | AI → UI (read-only) | Logika rywali = AI. UI pokazuje miasta/jednostki AI **tylko do odczytu** (`ownerId≠0` → ukryte Buduj/Ulepsz/Wykup/kolejka — **ZROBIONE** w `cityPanel.ts`). AI nie renderuje UI. |

Przepływ danych (skrót): **DANE/EKONOMIA/MIASTO → (JSON/typy) → UI (render) → (callbacki) → SILNIK (mutacje stanu, pętla tury) → render kanonu.**

### 8.1 Potwierdzenia działów (2026-06-25)

**MIASTO:**
- Kultura JEST w v0.1 — `getCultureState` obsługuje pełny render (suma, przyrost, borderRadius, thresholds, zrodla).
- Surowce = DOSTĘP (boolean) — `getResourceAccess` zwraca listę nazw surowców; UI renderuje checklistę dostępu.
- Specjaliści / Zdrowie — poza v0.1 (placeholder w panelu wprost to komunikuje).
- `getOrderState` — hak do `orderPanel.ts`; pochodzi z `order.ts` w MIASTO.
- `onAutoManage` → wywołuje `assignWorkedTiles(cityId)` po stronie MIASTO (automatyczne przypisanie pracowników).

**CYWILIZACJE / DANE:**
- Tier dyplomacji oblicza SILNIK (`diplomacy.relationTier`); UI bierze gotowy tier z `getRelations()`.
- `civs.json` jest kompletne — lista cywilizacji zasilana z `Cywilizacje.xlsx` przez DANE.
- Emblematy cywilizacji = odpowiedzialność działu UI/RENDER (nie DANE); DANE dostarcza dane, UI/RENDER je wyświetla.

**EKONOMIA (pytania otwarte):**
- Suwak Handlu (per-miasto podział Nauka/Pieniądz/Luksus) — kontrakt interfejsu potwierdzony (placeholder 60/30/10); implementacja real = EKONOMIA.
- Zasięg okolicy — dynamiczny promień z populacją (`r5`/`r10`/`r15`) — haki `getCityWorkedRange`/`getWorkedTiles` gotowe w `CityPanelConfig`; kto dostarcza dane (EKONOMIA czy MIASTO) — do uzgodnienia z masterem.
- Nastroje (Szczęście / Porządek) — kanał przez `orderPanel.ts`; formuły = EKONOMIA/MIASTO.

**SILNIK/CYWILIZACJE (nowe kontrakty z sciencePicker.ts):**
- `getAvailableTechs(ownerId)` — lista techów dostępnych do badania (po prereq, bez już zbadanych).
- `getCurrentTarget(ownerId)` — aktualnie badana technologia (id lub null).
- `getSciencePool(ownerId)` — aktualna pula punktów nauki.
- `setPlayerResearchTarget(techId)` — setter celu badań; UI wywołuje go przez hak `onSelectTarget`.

**UNITS (nowe kontrakty z armyStackPrompt.ts):**
- Silnik UNITS wywołuje `showArmyStackPrompt({ onMerge, onKeep, atakujacy, cel })` gdy dwie jednostki gracza spotkają się na polu.
- Callbacki `onMerge`/`onKeep` realizuje UNITS — UI nie zna logiki merge/stacking.

Styki wymagające jeszcze koordynacji:
- Per-miasto stan kolejek `prodMap` — w `main.ts` (SILNIK) czy osobny `game/productionState.ts` (do decyzji mastera).
- Religia/Kultura pełna (akcje zmiany religii) — czeka na wpięcie `culture-religion.ts` (MIASTO, plan M5).

---

## 9. Stan sekcji i co je „ożywia"
| Placeholder | Ożywia |
|---|---|
| Budynki w mieście / Ulepsz | zlecenie **B** (`getBuiltBuildingIds` + efekty) |
| Magazyn/wzrost realny, Bilans pełny | zlecenie **B** (flagi budynków w ekonomii) |
| „Buduj realnie buduje" | zlecenie **A** (advanceProduction w turze) |
| Garnizon | hak `getUnitsAt` (BITWA/UNITS) |
| Kultura i Religia (dynamiczna) | hak `getCultureState` (MIASTO, culture-religion.ts) |
| Surowce (dostęp) | hak `getResourceAccess` (MIASTO) |
| Okolica — zasięg roboczy + pola obrabiane | haki `getCityWorkedRange` + `getWorkedTiles` (EKONOMIA) |
| Podział Handlu (interaktywny) | per-miasto podział + recompute (EKONOMIA) |
| Mieszkańcy / Zdrowie / Specjaliści | poza v0.1 — przyszłe moduły |
| Dyplomacja (akcje) | `applyDiplomaticEvent` w pętli tury (SILNIK + Dyplomacja) |
| Picker nauki — lista techów + pula | haki `getAvailableTechs` + `getSciencePool` + `getCurrentTarget` (SILNIK/CYWILIZACJE) |
| Picker nauki — wybór celu | hak `onSelectTarget` = `setPlayerResearchTarget` (SILNIK) |
| Merge armii (realny) | callbacki `onMerge`/`onKeep` z modelu UNITS |

---

## 10. Walidacja i ograniczenia
- **Typecheck:** `tsc` z `gra/tsconfig.json` (strict, noUncheckedIndexedAccess, verbatimModuleSyntax,
  moduleResolution bundler, lib DOM) — moduły UI przechodzą na 0 błędów.
- **Build kanonu** (`npx vite build`) i publikację robi **SILNIK** lokalnie. Sandbox bywa nieświeży
  (dehydratacja OneDrive) → realnego builda nie odpalam tutaj; weryfikuję typy na wiernych stubach.
  Trwały fix dla całego projektu: ustawić folder Civ na „Always keep on this device".
- Podglądy HTML nie wymagają builda (samodzielne).

---

## 11. Otwarte decyzje / parked
1. Styl polskich napisów: literalny UTF-8 (jak `main.ts`) vs `\uXXXX` — przyjęto UTF-8; do zmiany na życzenie.
2. `prodMap` w `main.ts` czy `game/productionState.ts`.
3. Religia/Kultura — akcje zmiany religii (czeka na M5 w MIASTO).
4. Kreator nowej gry — **ZROBIONE** (`newGameFlow.ts`).
5. HUD w grze — **ZROBIONE** (`hud.ts`).
6. Panel Zadowolenia/Porządku — **ZROBIONE** (`orderPanel.ts`).
7. Panel Dyplomacji (podgląd v0.1) — **ZROBIONE** (`diplomacyPanel.ts`). Akcje dyplomatyczne — kolejna iteracja.
8. Miasta AI read-only (ukryte Buduj/Ulepsz/Wykup dla `ownerId≠0`) — **ZROBIONE** w `cityPanel.ts`.
9. Zasięg okolicy dynamiczny z populacją (`r5`/`r10`/`r15`) — **ZROBIONE** (haki `getCityWorkedRange`/`getWorkedTiles` w `CityPanelConfig`; render kompakt w `cityPanel.ts`). Kontrakt z EKONOMIA otwarty (kto dostarcza dane).
10. Nastroje / suwak Handlu — kontrakt otwarty z EKONOMIA.
11. Picker celu badań (#182) — kontrakt API w `sciencePicker.ts` zatwierdzone; implementacja do zrobienia + podgląd `Gra-podglad-NAUKA.html`.
12. Okno merge armii (#167) — kontrakt API w `armyStackPrompt.ts` zatwierdzone; implementacja do zrobienia (logika = UNITS).
13. Panel armii (#170/#178) — makieta `Makieta-panel-armii.html` do akceptacji przez Maciej; po akceptacji → implementacja modułu (logika = UNITS).

---

## 12. Słowniczek
- **Lane** — przypisany zakres plików sesji.
- **Kanon** — `Gra-podglad.html` (oficjalny single-file build); publikuje tylko SILNIK.
- **Placeholder** — wizualnie kompletna sekcja na danych przykładowych, czekająca na realne dane.
- **Hak (hook)** — opcjonalny callback z `configureCityPanel`/`MainMenuConfig`/`NewGameFlowConfig`.
- **Parzystość** — panel liczy plony tym samym kodem co tura, więc liczby się zgadzają.
- **Tier** — poziom relacji dyplomatycznej (0–4); oblicza SILNIK, UI wyświetla.
- **Dostęp** — model surowców v0.1: boolean (masz/nie masz), nie ilość.
