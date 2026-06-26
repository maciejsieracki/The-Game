# ARCHITEKTURA-PLIKI.md — Inwentarz plików projektu „The Game"

> **Czytaj ten plik przed dodaniem nowych danych — edytuj istniejące źródło zamiast tworzyć nowe.**
> Ostatnia aktualizacja: 2026-06-21.

---

## a) Dokumenty / specyfikacje (*.md)

| Plik | Co zawiera |
|---|---|
| `PROJEKT-GRY-master.md` | Główny dokument projektu — jedyne źródło prawdy; pełna historia decyzji, wszystkie paragrafy §0–§8e |
| `ZASADY-WSPOLPRACY.md` | Reguły pracy nad projektem (format pytań, zasady edycji plików, styl decyzji) |
| `PLAN-PRODUKCJI.md` | Plan etapów i kamieni milowych produkcji (M0–M5) |
| `PLAN-UKONCZENIA-PROJEKTU.md` | Harmonogram ukończenia projektu, priorytety, lista DO-DO |
| `SESJA-AUTONOMICZNA.md` | Instrukcje dla sesji autonomicznych Claude (zakres, ograniczenia, format raportów) |
| `Schemat-dzialania-miasta.md` | Specyfikacja modelu ekonomicznego miasta: cykl tury, zarządzanie ludnością, Podział Pracy |
| `Spec-AI.md` | Specyfikacja sztucznej inteligencji — strategia, taktyka, dyplomacja AI |
| `Spec-ekonomia.md` | Specyfikacja systemu ekonomicznego: Praca, Handel, Pieniądz, budynki, mnożniki |
| `Spec-generator-mapy.md` | Specyfikacja generatora mapy heksowej: biomy, tereny, rozmieszczenie cywilizacji |
| `Spec-spoleczenstwo.md` | Specyfikacja mechanik społecznych: Zdrowie, Szczęście, Kultura, Religia |
| `Macierz-walki-analiza.md` | Analiza macierzy walki: szanse trafień, obrażeń, countery typów jednostek |
| `Dyplomacja-szablon.md` | Szablon i reguły systemu dyplomacji między cywilizacjami |
| `ARCHITEKTURA-PLIKI.md` | Ten plik — inwentarz wszystkich plików projektu |

**Łącznie: 13 plików .md**

---

## b) Dane Excel (*.xlsx)

| Plik | Co zawiera |
|---|---|
| `Jednostki.xlsx` | Jednostki wojskowe (staty, epoki, koszty) · arkusz „Countery" (przewagi typów) · arkusz „Teren" (modyfikatory terenowe walki) |
| `Budynki.xlsx` | Budynki (nazwa, epoka, koszt, efekty: bazowa Praca/Pieniądz, mnożniki, wymagania) |
| `Surowce.xlsx` | Katalog surowców (typ, plony, modyfikatory, receptury przetwarzania) |
| `Plony-terenow.xlsx` | Plony terenów bazowych + nakładek · arkusz „Ruch terenu" (koszty ruchu per teren) |
| `Ekonomia-parametry.xlsx` | Parametry ekonomiczne (4 zakładki: ekonomia ogólna, handel, budynki, populacja) + zakładki społeczne (Zdrowie, Szczęście, Kultura, Religia, Religie cywilizacji) |
| `Spoleczenstwo-parametry.xlsx` | Parametry społeczne (Zdrowie, Szczęście, Kultura, Religia) — dane przeniesione z Ekonomia-parametry |
| `AI-parametry.xlsx` | Parametry decyzji AI (agresja, priorytety, progi dyplomatyczne) |
| `Cywilizacje.xlsx` | Lista cywilizacji · arkusz „Start gry" (rozmieszczenie startowe) · bonusy/minusy/jednostki specjalne |
| `Dyplomacja.xlsx` | Tabele dyplomacji: stany relacji, modyfikatory, zdarzenia, kary/bonusy |
| `Macierz-walki.xlsx` | Macierz liczbowa walki: szanse trafień, obrażenia, countery |
| `Technologie-drzewko.xlsx` | Drzewko technologiczne: technologie, epoki, wymagania, efekty |

**Łącznie: 11 plików .xlsx**

---

## c) Wyeksportowane JSON w gra/data/*.json

Generowane przez `gra/tools/export-data.py` z plików Excel (nie edytuj ręcznie — edytuj źródłowy xlsx).

| Plik JSON | Źródło Excel | Zawartość |
|---|---|---|
| `units.json` | `Jednostki.xlsx` arkusz „Jednostki" | Staty wszystkich jednostek wojskowych |
| `counters.json` | `Jednostki.xlsx` arkusz „Countery" | Macierz przewag typów jednostek |
| `terrain-combat.json` | `Jednostki.xlsx` arkusz „Teren" | Modyfikatory walki per typ terenu |
| `buildings.json` | `Budynki.xlsx` arkusz „Budynki" | Definicje budynków i ich efekty |
| `resources.json` | `Surowce.xlsx` arkusz „Surowce" | Katalog surowców |
| `terrain-yields.json` | `Plony-terenow.xlsx` | Plony terenów + modyfikatory nakładek |
| `terrain-movement.json` | `Plony-terenow.xlsx` arkusz „Ruch terenu" | Koszty ruchu per teren |
| `econ-params.json` | `Ekonomia-parametry.xlsx` | Parametry ekonomiczne (per trudność: easy/normal/hard) |
| `society-params.json` | `Spoleczenstwo-parametry.xlsx` | Parametry społeczne (Zdrowie, Szczęście, Kultura, Religia) |
| `ai-params.json` | `AI-parametry.xlsx` | Parametry decyzji AI |
| `civs.json` | `Cywilizacje.xlsx` | Lista i dane cywilizacji |
| `diplomacy.json` | `Dyplomacja.xlsx` | Tabele dyplomacji |
| `tech.json` | `Technologie-drzewko.xlsx` | Drzewko technologiczne |

**Łącznie: 13 plików JSON**

---

## d) Kod silnika gra/src/**

### Typy (gra/src/types/)

| Plik | Rola |
|---|---|
| `types/index.ts` | Re-eksport wszystkich typów — centralny punkt importu |
| `types/hex.ts` | Typy współrzędnych heksu (axial, cube, offset) |
| `types/map.ts` | Typy mapy: `HexTile`, `GameMap`, definicje terenu |
| `types/unit.ts` | Typy jednostek wojskowych: `Unit`, `UnitType`, staty |
| `types/army.ts` | Typ armii: `Army`, zgrupowanie jednostek |
| `types/city.ts` | Typy miast: `City`, `Building`, kolejka produkcji |
| `types/player.ts` | Typ gracza: `Player`, zasoby, technologie |
| `types/game-state.ts` | Główny stan gry: `GameState`, tura, wszyscy gracze |
| `types/resources.ts` | Typy zasobów: surowce, magazyny, skarbiec |
| `types/tech.ts` | Typy technologii: `Tech`, drzewko, wymagania |
| `types/diplomacy.ts` | Typy dyplomacji: `DiplomaticRelation`, stany relacji |
| `types/turn.ts` | Typy tur: `TurnAction`, fazy tury |

### Dane (gra/src/data/)

| Plik | Rola |
|---|---|
| `data/loader.ts` | Ładowanie plików JSON z `gra/data/` do pamięci gry; mapowanie na typy TS |

### Mapa (gra/src/map/)

| Plik | Rola |
|---|---|
| `map/generator.ts` | Generator mapy heksowej: biomy, rozmieszczenie terenów, startowe cywilizacje |

### Renderowanie (gra/src/render/)

| Plik | Rola |
|---|---|
| `render/scene.ts` | Główna pętla renderowania Canvas: orkiestruje wszystkie warstwy |
| `render/hexutil.ts` | Narzędzia geometrii heksów: konwersje współrzędnych, piksel↔heks, sąsiedztwo |
| `render/camera.ts` | Kamera: przesunięcie (pan), przybliżenie (zoom), transformacje widoku |
| `render/units.ts` | Rysowanie jednostek wojskowych na mapie (sprite'y, etykiety) |
| `render/cities.ts` | Rysowanie miast i zasięgu terytorialnego na mapie |

### Wejście (gra/src/input/)

| Plik | Rola |
|---|---|
| `input/picker.ts` | Obsługa kliknięć: przeliczanie piksela myszy na heks, zaznaczanie jednostek/miast |

### Gra (gra/src/game/)

| Plik | Rola |
|---|---|
| `game/visibility.ts` | System mgły wojny: obliczanie widoczności heksów per gracz |
| `game/cities.ts` | Logika miast: wzrost populacji, produkcja, zarządzanie budynkami, zasięg |

### UI (gra/src/ui/)

| Plik | Rola |
|---|---|
| `ui/cityPanel.ts` | Panel interfejsu miasta: wyświetlanie stanu, kolejka produkcji, zarządzanie ludnością |

### Główny punkt wejścia

| Plik | Rola |
|---|---|
| `main.ts` | Punkt startowy: inicjalizacja gry, pętla zdarzeń, łączenie modułów |

**Łącznie: 26 plików .ts (12 types + 1 loader + 1 generator + 5 render + 1 picker + 2 game + 1 cityPanel + 1 units/setup + 1 main + 1 setup)**

### Dodatkowy plik

| Plik | Rola |
|---|---|
| `units/setup.ts` | Inicjalizacja startowych jednostek gracza i AI na początku gry |

---

## e) Makiety HTML (pliki wizualne / prototypy UI)

| Plik | Co pokazuje |
|---|---|
| `Makieta-HUD-mapa-swiata.html` | Makieta HUD mapy świata: pasek stanu, minimapa, panele zasobów |
| `Makieta-flow-nowa-gra.html` | Makieta przepływu ekranu „Nowa gra": wybór cywilizacji, ustawienia |
| `Scena-mapy-lowpoly.html` | Scena 3D mapy w stylu low-poly (Three.js / WebGL) — wizualizacja terenu |
| `Widok-miasta.html` | Widok panelu miasta: budynki, ludność, kolejka produkcji, zasoby lokalne |
| `Ekran-bitwy.html` | Ekran bitwy heksowej: plansza taktyczna, jednostki, HUD walki, auto-rozegraj |
| `Podglad-armii.html` | Podgląd armii: lista jednostek, staty, roster |
| `Katalog-assetow-lowpoly.html` | Katalog assetów graficznych (modele low-poly, tekstury) |
| `Porownanie-jednostek-A-B.html` | Porównanie dwóch jednostek A vs B: staty, countery, symulacja walki |

**Łącznie: 8 plików .html (makiety/widoki)**

---

## f) Narzędzia gra/tools/

| Plik | Rola |
|---|---|
| `tools/export-data.py` | Konwertuje wszystkie pliki Excel z Civ/ na JSON do gra/data/ (uruchom po każdej zmianie w xlsx) |
| `tools/smoke.cjs` | Smoke test: szybki test ładowania gry i renderowania pierwszej klatki (Node.js) |
| `tools/logic-test.cjs` | Testy logiki gry: walka, ekonomia, widoczność (Node.js, bundlowany ze źródeł TS) |

**Łącznie: 3 pliki narzędziowe** (+ 2 pliki wewnętrzne: `.logic-bundle.cjs`, `.logic-entry.ts`)

---

## g) Build + backupy

| Plik / folder | Co zawiera |
|---|---|
| `Gra-podglad.html` | Bieżący single-file build gry (IIFE, bez type=module) — plik do otwierania przez file:// |
| `Gra-podglad-BACKUP.html` | Poprzednia stabilna wersja buildu — bezpieczny punkt powrotu |
| `_backup/` | Archiwum snapshotów: `Gra-podglad_baseline.html` + foldery `gra_*` (gra_baseline, gra_city, gra_cityview, gra_clean, gra_fog, gra_fogoverlay, gra_gallery, gra_movecost, gra_river, gra_wybrzeze) |
| `gra/index.html` | Punkt wejścia dla serwera deweloperskiego Vite (nie otwierać przez file://) |
| `gra/vite.config.ts` | Konfiguracja Vite: build, bundlowanie IIFE, ścieżki wyjściowe |
| `gra/tsconfig.json` | Konfiguracja TypeScript |
| `gra/package.json` | Zależności npm (Vite, TypeScript, Three.js) |

---

## Podsumowanie

| Kategoria | Liczba plików |
|---|---|
| Dokumenty .md | 13 |
| Dane Excel .xlsx | 11 |
| JSON w gra/data/ | 13 |
| Kod silnika .ts | 26 |
| Makiety HTML | 8 |
| Narzędzia tools/ | 3 (+2 wewnętrzne) |
| Build + backupy | 7 (+ 10 snapshotów w _backup/) |

---

## h) Podział pracy równoległej (parallel-safe)

Cel: umożliwić pracę nad różnymi elementami gry w OSOBNYCH rozmowach/taskach tego samego Projektu „The Game", korzystających z tego samego folderu Civ, bez konfliktów.

### 1) Elementy niezależne (bezpieczne równolegle — każdy ma własne pliki)

| Element | Excel (źródło) | JSON (eksport) | Kod silnika |
|---|---|---|---|
| Jednostki | `Jednostki.xlsx` | `units.json`, `counters.json`, `terrain-combat.json` | `src/render/units.ts` (model) |
| Budynki | `Budynki.xlsx` | `buildings.json` | (logika: `src/game/economy.ts`) |
| Technologie | `Technologie-drzewko.xlsx` | `tech.json` | — |
| Ekonomia | `Ekonomia-parametry.xlsx` | `econ-params.json` | `src/game/economy.ts` |
| Społeczeństwo | `Spoleczenstwo-parametry.xlsx` | `society-params.json` | — |
| Walka | — | — | `src/game/combat.ts` (+ §5l w master) |
| AI | `AI-parametry.xlsx` | `ai-params.json` | `src/game/ai.ts` |
| Dyplomacja | `Dyplomacja.xlsx` | `diplomacy.json` | `src/game/diplomacy.ts` |
| Mapa/teren | `Plony-terenow.xlsx` | `terrain-yields.json`, `terrain-movement.json` | `src/map/generator.ts` |
| Cywilizacje | `Cywilizacje.xlsx` | `civs.json` | — |
| Makiety | każda to osobny plik HTML (`Makieta-*.html`) — w pełni niezależne | — | — |

### 2) Pliki wspólne (edytować POJEDYNCZO, jeden task naraz)

`src/main.ts`, `src/render/scene.ts`, `src/render/units.ts`, `src/data/loader.ts`, `src/types/*`, `tools/export-data.py`, `PROJEKT-GRY-master.md`, `ZASADY-WSPOLPRACY.md`.

### 3) Zasady

- Każdy task trzyma się SWOICH plików (element). Różne pliki = brak konfliktu.
- Pliki wspólne: jeden task naraz; po każdej zmianie kodu silnika → build + smoke (`tools/smoke.cjs`).
- Dane płyną przez Excel → JSON (`tools/export-data.py`, odporny na cloud-only) → silnik (`loader.ts` czyta JSON).
- Na starcie każdej rozmowy/taska: przeczytać `ARCHITEKTURA-PLIKI.md` + `PROJEKT-GRY-master.md` + pamięć, żeby nie duplikować bytów ani nie edytować cudzego pliku.
- Backup: kopia do `_backup/` przed ryzykowną zmianą; rewert = kopiowanie z `_backup`.
- Synchronizacja między taskami = przez dysk (OneDrive) + ten plik jako mapa.
