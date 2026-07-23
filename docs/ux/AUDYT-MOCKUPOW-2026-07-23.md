# AUDYT MOCKUPÓW — 2026-07-23

Pełny katalog mockupów UI (nowe — Claude Design vs stare — przedprodukcyjne) + lista kandydatów do archiwizacji. Zadanie ciągnięte po dwóch nieudanych reconach — poniżej całość w jednym przebiegu.

**Metoda:** przegląd plików na dysku (`find`/`md5sum`/`grep`), krzyżowanie z manifestami samego Design (`CANON.md` w dwóch świeżych paczkach `_dist/`), z `KANON-SCIEZEK.md` i `README.md` (`01-propozycje-z-design/`), oraz z `WYMIANA-UI-DESIGN.md` (log wymiany). Nie ruszono żadnego pliku — tylko odczyt.

---

## 0. Kluczowe ustalenie wstępne

Katalog `docs/ux/claude-design/` zawiera **142 pliki `*.dc.html`** (+ 1 plik z uszkodzonym rozszerzeniem, patrz §6) rozrzucone po ~15 katalogach. Zdecydowana większość to **duplikaty tego samego pliku** (identyczne md5) leżące równolegle w:
- katalogu głównym `claude-design/` (płaska kopia robocza),
- `01-propozycje-z-design/brand-book/` (KANON wg `README.md`/`STATUS.md`),
- `_dist/<paczka>/...` (snapshoty konkretnych dostaw, część z podwójnie zagnieżdżonym `_dist/_dist/`),
- `_staging/infografik4`, `_staging/infografik4-full` (kopie robocze tej samej dostawy „menu-icons”),
- `01-propozycje-z-design/brand-book/ostatnie/Ulepszenie infografik*/` (archiwum **starszych** dostaw — potwierdzone diffem: `.../ostatnie/Ulepszenie infografik/brand-book/...` ma **inny hash** niż kanon, `.../ostatnie/Ulepszenie infografik-menu-icons/...` ma **identyczny** hash co kanon).

Po deduplikacji po ekranie zostaje **~50 odrębnych ekranów/artefaktów** (Tabela A). Reszta (142 → 50) to duplikaty/archiwa wewnętrzne Design, nie osobne wersje.

Samo Design prowadzi własny manifest kanonu: `CANON.md` w `_dist/POLE-BITWY-TW-v5-2026-07-23/` i `_dist/DYPLOMACJA-FINAL-2026-07-23/` (identyczna treść w obu, stan na 2026-07-23) — mapa "ekran → plik" + sekcja "ODRZUCONE ITERACJE". **Użyto go jako drugiego źródła prawdy** obok samego skanu plików. Ważne rozbieżności — patrz §6.

---

## 1. TABELA A — Nowe mockupy (Claude Design), zdeduplikowane po ekranie

Ścieżki skrócone względem `docs/ux/claude-design/`. „Wersja" = z nazwy pliku/folderu dostawy; gdy brak — status wg `CANON.md`.

### Fundament / Design System (brand-book)

| Ekran | Kategoria | Wersja | Ścieżka (najnowsza) |
|---|---|---|---|
| Design System v1 | brand-book | 1E | `01-propozycje-z-design/brand-book/The Game - Design System v1 (1E).dc.html` |
| Design System — Warianty | brand-book | eksploracja (odrzucona koncepcyjnie wg CANON, plik nadal w repo) | `01-propozycje-z-design/brand-book/The Game - Design System - Warianty.dc.html` |
| Komponenty | brand-book | 1E | `01-propozycje-z-design/brand-book/The Game - Komponenty (1E).dc.html` |
| Ikony (biblioteka) | brand-book | 1E | `01-propozycje-z-design/brand-book/The Game - Ikony (biblioteka 1E).dc.html` |
| HUD Kit | brand-book | 1E | `01-propozycje-z-design/brand-book/The Game - HUD Kit (1E).dc.html` |
| Motion | brand-book | 1E | `01-propozycje-z-design/brand-book/The Game - Motion (1E).dc.html` |
| Przegląd (hub) | brand-book | 1E | `01-propozycje-z-design/brand-book/The Game - Przegląd (1E).dc.html` |

### Menu / meta

| Ekran | Kategoria | Wersja | Ścieżka | Uwaga |
|---|---|---|---|---|
| Ekran Menu (bez hero) | menu | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Menu (1E).dc.html` | wg CANON **odrzucony** na rzecz Menu Hero |
| Ekran Menu Hero | menu | 1E | `01-propozycje-z-design/ekrany-hero/The Game - Ekran Menu Hero (1E).dc.html` | **AKTUALNY** wg CANON |
| Ekran Intro Hero | menu | 1E | `01-propozycje-z-design/ekrany-hero/The Game - Ekran Intro Hero (1E).dc.html` | aktualny |
| Ekran Kreator | kreator | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Kreator (1E).dc.html` | aktualny |
| Kreator — kroki | kreator | 1E | `01-propozycje-z-design/brand-book/The Game - Kreator Kroki (1E).dc.html` | aktualny |
| Ekran Koniec Gry (zwycięstwo) | menu | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Koniec Gry (1E).dc.html` | aktualny |
| Koniec — Porażka | menu | 1E | `01-propozycje-z-design/brand-book/The Game - Koniec Porażka (1E).dc.html` | aktualny (uwaga nazwy w CANON — §6) |

### Ekrany pełne

| Ekran | Kategoria | Wersja | Ścieżka | Uwaga |
|---|---|---|---|---|
| Ekran Badania | badania | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Badania (1E).dc.html` | aktualny |
| Ekran Dyplomacja (lista frakcji) | dyplomacja | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Dyplomacja (1E).dc.html` | aktualny |
| **Dyplomacja — panel negocjacji (TW v1.1)** | dyplomacja | v1.1, **2026-07-23** | `_dist/DYPLOMACJA-FINAL-2026-07-23/brand-book/KANON/mockupy/The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html` | **NAJŚWIEŻSZA dostawa** — zatwierdzona, wdrożona w grze (patrz §5) |
| Ekran Wojsko | wojsko | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Wojsko (1E).dc.html` | aktualny |
| Ekran Walka | pole-bitwy | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Walka (1E).dc.html` | wg CANON **odrzucony** — zastąpiony flow grupy C |
| Walka — Warianty | pole-bitwy | 1E | `01-propozycje-z-design/brand-book/The Game - Walka Warianty (1E).dc.html` | odrzucony (jw.) |
| Walka Hub (Grupa-C) | pole-bitwy | — | `The Game - Walka Hub Grupa-C (1E).dc.html` | hub nawigacyjny do flow C |

### Miasto (W3)

| Ekran | Kategoria | Wersja | Ścieżka | Uwaga |
|---|---|---|---|---|
| Ekran Miasto (baza) | miasto | 1E | `01-propozycje-z-design/brand-book/The Game - Ekran Miasto (1E).dc.html` | odrzucony wg CANON |
| Ekran Miasto W3 (baza) | miasto | 1E | `The Game - Ekran Miasto W3 (1E).dc.html` | odrzucony wg CANON |
| **Ekran Miasto W3** | miasto | **v3** | `The Game - Ekran Miasto W3 v3 (1E).dc.html` | **AKTUALNY** (chrome + 4 klatki) |
| Miasto Zakładki W3 | miasto | v1 | `The Game - Miasto Zakładki W3 (1E).dc.html` | odrzucony — zastąpiony „6 klatek" |
| Miasto Zakładki W3 cz2 | miasto | v1 cz2 | `The Game - Miasto Zakładki W3 cz2 (1E).dc.html` | odrzucony (jw.) |
| Miasto Zakładki W3 | miasto | v2 | `The Game - Miasto Zakładki W3 v2 (1E).dc.html` | odrzucony (jw.) |
| Miasto Zakładki W4 | miasto | v2 | `The Game - Miasto Zakładki W4 v2 (1E).dc.html` | wariant boczny, poza numeracją CANON — status niejasny, prawdopodobnie porzucony |
| **Miasto Zakładki W3 — 6 klatek** | miasto | **v3** | `The Game - Miasto Zakladki W3 v3 6klatek (1E).dc.html` | **AKTUALNY** wg CANON |

### Mapa / HUD

| Ekran | Kategoria | Wersja | Ścieżka | Uwaga |
|---|---|---|---|---|
| HUD Mapy — layout | mapa | 1E | `The Game - HUD Mapy layout (1E).dc.html` | aktualny, jedyny HUD-mapowy plik faktycznie obecny w repo |

**Luka synchronizacji (nie w repo, tylko w `CANON.md`):** `HUD Panele stany`, `HUD Jednostka wybrana`, `HUD Miasto wybrane`, `A-08 Tryb budowy ulepszeń`, `A-04 Panel heks kontekst` — Design deklaruje je jako część kanonu, ale **żaden z tych plików fizycznie nie istnieje w repo** — sync z chmury Design jeszcze nie dowieziony (patrz §6).

### Pole bitwy — flow grupy C (+ POLE BITWY TW v5)

| Ekran | Kategoria | Wersja | Ścieżka | Uwaga |
|---|---|---|---|---|
| C-01 Pre-bitwa | pole-bitwy | v2 | `The Game - C01 Pre-bitwa v2 (1E).dc.html` | odrzucony |
| **C-01 Pre-bitwa** | pole-bitwy | **v3** | `The Game - C01 Pre-bitwa v3 (1E).dc.html` | aktualny |
| C-02 Rozstawienie | pole-bitwy | v2 | `The Game - C02 Rozstawienie v2 (1E).dc.html` | odrzucony |
| **C-04 Atak na miasto** (modal) | pole-bitwy | v2 | `The Game - C04 Atak miasto wybor v2 (1E).dc.html` | aktualny |
| C-04 Oblężenie (HUD-only) | pole-bitwy | v2 | `The Game - C04 Oblezenie v2 (1E).dc.html` | odrzucony — zastąpiony modalem C04 v2 |
| **C-05 Panel oblężenia** (modal) | pole-bitwy | v2 | `The Game - C05 Panel oblezenie v2 (1E).dc.html` | aktualny |
| C-05 Szturm muru (HUD-only) | pole-bitwy | v2 | `The Game - C05 Szturm muru v2 (1E).dc.html` | odrzucony (jw.) |
| C-06 Deployment | pole-bitwy | v2 | `The Game - C06 Deployment v2 (1E).dc.html` | odrzucony |
| C-06 Deployment | pole-bitwy | v3 | `The Game - C06 Deployment v3 (1E).dc.html` | odrzucony |
| C-06 Deployment | pole-bitwy | v4, 2026-07-04 | `The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` | odrzucony — zastąpiony przez POLE BITWY TW v5 |
| **C-06 Popup Strategia** | pole-bitwy | v4, 2026-07-04 | `The Game - C06 Popup Strategia v4 2026-07-04 (1E).dc.html` | aktualny wg CANON (mimo starszej daty w nazwie) |
| **C-06 POLE BITWY** — TW v5 (ręczna·AUTO·deploy, 6 klatek) | pole-bitwy | **v5, 2026-07-23** | `_dist/POLE-BITWY-TW-v5-2026-07-23/brand-book/KANON/mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html` | **NAJŚWIEŻSZA dostawa** — zastępuje Deployment v2–v4, C07 HUD bitwy v2, C23 v1, C12 v3 (wizualnie); przyjęta, integracja po stronie repo w toku (§5) |
| C-09 Karty jednostek | pole-bitwy | v2 | `The Game - C09 Karty jednostek v2 (1E).dc.html` | odrzucony — zastąpiony Roster v4 |
| **C-09 Roster (lewy panel)** | pole-bitwy | v4, 2026-07-04 | `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` | aktualny |
| C-12 Koniec bitwy | pole-bitwy | v2 | `The Game - C12 Koniec bitwy v2 (1E).dc.html` | odrzucony — wg CANON zastąpiony przez klatkę 5 TW v5 |
| **A-19 Miasto zdobyte** | pole-bitwy | v2 | `The Game - A19 Miasto zdobyte v2 (1E).dc.html` | aktualny |
| **Popupy deploy** (zbiorczy) | pole-bitwy | v5, 2026-07-05 | `The Game - Popupy deploy v5 2026-07-05 (1E).dc.html` | aktualny |

**Luka synchronizacji:** `C-23 Szczegóły bitwy v1` (wg CANON zastąpiony, plik i tak nieobecny), `Atlas ikon bitwy i jednostek`, `Jednostki — infografiki kanon v1` — deklarowane w `CANON.md`, **nieobecne w repo** (§6).

### Infografiki / panele danych

| Ekran | Kategoria | Wersja | Ścieżka | Uwaga |
|---|---|---|---|---|
| Budynki — infografiki (kanon) | infografiki | v1, 2026-07-05 | `The Game - Budynki infografiki kanon v1 2026-07-05 (1E).dc.html` | aktualny |
| Panel Moc imperium | inne (panel danych) | v3, 2026-07-06 | `Panel Moc imperium v3 2026-07-06 (1E).dc.html..html` | aktualny wg CANON, **ale nazwa pliku uszkodzona** — podwójne rozszerzenie `.dc.html..html` (§6) |

### Hub / index dostaw (nie „ekran" gry, ale ekran nawigacyjny paczki)

| Ekran | Kategoria | Ścieżka | Uwaga |
|---|---|---|---|
| START — KANON aktualny | brand-book (hub) | `_dist/POLE-BITWY-TW-v5-2026-07-23/brand-book/KANON/START - KANON aktualny (1E).dc.html` oraz identyczny w `_dist/DYPLOMACJA-FINAL-2026-07-23/...` | indeks-hub obu świeżych paczek 2026-07-23 |

**Podsumowanie Tabeli A:** **50 odrębnych ekranów/artefaktów** po deduplikacji (w tym 8 świadomie „odrzuconych" wg własnego CANON Design, ale nadal fizycznie leżących w repo — nie usuwaj ich bez potwierdzenia, to dokumentacja historii iteracji) + **8 ekranów zadeklarowanych przez Design, a nieobecnych w repo** (luka sync, nie luka projektowa — §6).

---

## 2. TABELA B — Stare mockupy (poza `claude-design`)

Wzorzec zadania: `Makieta-*.html` + `Gra-podglad-*.html` w korzeniu, `UI/`, `Civ-UNITS/`, `Civ-MAPA/`, `archiwum/`, `UI/_archiwum/`, `_archiwum/`. **37 plików** pasuje ściśle do wzorca; poniżej + kilka dodatkowych plików HTML znalezionych w tych samych katalogach (poza wzorcem nazw), skatalogowanych pomocniczo i oznaczonych „(bonus)".

### Korzeń repo

| Plik | Ekran | Status |
|---|---|---|
| `Gra-podglad-POLE-BITWY.html` | Pole bitwy | **ZASTĄPIONY** — `C06 Pole bitwy odswiezenie` (POLE BITWY TW v5, 2026-07-23) |
| `Makieta-drzewko-technologii.html` | Drzewko technologii (Kamień+Brąz) | **JEDYNE ŹRÓDŁO** — brak odpowiednika w Design |

### `UI/`

| Plik | Ekran | Status |
|---|---|---|
| `Gra-podglad-HUD.html` | — | **ARCHIWUM** — martwy redirect (`location.replace('../Gra-podglad.html')`, plik docelowy **nie istnieje** w repo) |
| `Gra-podglad-KREATOR-E2.html` | Kreator (bundle silnika, 4657 linii) | **JEDYNE ŹRÓDŁO** — to nie statyczny mockup tylko zrzut działającego silnika; inny rodzaj artefaktu niż `.dc.html` |
| `Gra-podglad-MENU.html` | — | **ARCHIWUM** — martwy redirect (jw.) |
| `Gra-podglad-UI.html` | Widok Miasta — Biskupin | **ZASTĄPIONY** — `Ekran Miasto W3 v3` / `Miasto Zakladki W3 6 klatek` |
| `Makieta-HUD-D1B-preview.html` | — | **ARCHIWUM** — martwy redirect |
| `Makieta-HUD-mapa-swiata.html` | — | **ARCHIWUM** — martwy redirect |
| `Makieta-POROWNANIE-MAPY.html` | — | **ARCHIWUM** — redirect do `Makieta-START.html` (żywy, ale sam launcher w dużej mierze prowadzi do martwych stubów) |
| `Makieta-START.html` | Launcher/index starych mockupów | **ARCHIWUM (funkcjonalnie)** — większość linkowanych celów to martwe redirecty |
| `Makieta-cuda.html` | Cuda świata (Wonders) | **JEDYNE ŹRÓDŁO** — brak ekranu Cudów w Design |
| `Makieta-drzewko-uklad-bez-przeciec.html` | Drzewko technologii — układ bez przecięć | **JEDYNE ŹRÓDŁO** |
| `Makieta-dyplomacja.html` | Dyplomacja | **ZASTĄPIONY** — `Ekran Dyplomacja` + `Dyplomacja panel negocjacji v1.1` (DYPLOMACJA FINAL) |
| `Makieta-flow-nowa-gra.html` | — | **ARCHIWUM** — martwy redirect |
| `Makieta-panel-armii.html` | Panel zarządzania armią | **ZASTĄPIONY** — `C09 Roster lewy panel v4` |
| `Makieta-panel-jednostki.html` | Panel jednostki | **ZASTĄPIONY** — `C09 Karty jednostek v2` / `Roster v4` |
| `Makieta-preBattle.html` | Uwarunkowania bitwy (pre-battle) | **ZASTĄPIONY CZĘŚCIOWO** — `C01 Pre-bitwa v3` istnieje, ale nakładka TW-style (3 klatki: pole/miasto/obrona) jest **w trakcie dostarczania** — zob. §5 (`DO-DESIGN-2026-07-23`) |
| `Katalog-UX-wszystkie-panele.html` *(bonus)* | Rejestr A–E | do przeglądu — indeks linkuje częściowo martwe stuby |
| `Warstwa1-Design-System-podglad.html` *(bonus)* | Decyzje ABC Warstwy 1 | **ZASTĄPIONY** — `Design System v1 (1E)` |

### `UI/_archiwum/` (już zarchiwizowane lokalizacją)

| Plik | Status |
|---|---|
| `Gra-podglad-MENU_legacy-mock-2026-06-29.html` | **ARCHIWUM** |
| `Makieta-flow-nowa-gra_legacy-mock-2026-06-29.html` | **ARCHIWUM** |

### `Civ-UNITS/`

| Plik | Ekran | Status |
|---|---|---|
| `Makieta-pasek-armii.html` | Pasek armii | **ZASTĄPIONY** — `C09 Roster lewy panel v4` |
| `Makieta-przed-bitwa.html` | — | **ARCHIWUM** — redirect stub ("Przekierowanie — Makieta preBattle") |
| `Galeria-jednostek-4widoki.html` *(bonus)* | Galeria stylu jednostek (4 widoki) | **JEDYNE ŹRÓDŁO** — referencja artystyczna, nie ekran UI |
| `Legionista-Minecraft-vs-Roblox.html` *(bonus)* | Porównanie stylu grafiki | **JEDYNE ŹRÓDŁO** — jw. |
| `_backup/*.html` (3 pliki, jw. Galeria z sufiksem daty) *(bonus)* | — | **ARCHIWUM** — kopie zapasowe |

### `Civ-MAPA/`

| Plik | Ekran | Status |
|---|---|---|
| `Gra-podglad-CUDA-ROBLOX.html` | Cuda świata 3D (Roblox) | **JEDYNE ŹRÓDŁO** — art/3D, poza zakresem Design |
| `Gra-podglad-JAKOSC-MAPY.html` | Jakość mapy (Niska/Średnia/Wysoka) | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-MIASTA-BRAZ.html` | Miasta — epoka brązu (11 nacji) | **JEDYNE ŹRÓDŁO** — art 3D, nie mockup UI |
| `Gra-podglad-MIASTA-BRAZU-ROBLOX.html` | jw., styl Roblox | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-MIASTA-KAMIEN-ROBLOX.html` | Miasta — epoka kamienia (Roblox) | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-MIASTA-WSZYSTKIE.html` | Miasta — kamień+brąz (10 cyw.) | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-MIASTA.html` | Miasta — epoka kamienia (10 poziomów) | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-OBLEZENIE.html` | Oblężenie — 9 miast/cywilizacja (art 3D) | **JEDYNE ŹRÓDŁO** — inny zakres niż UI-modal `C04/C05 Oblężenie` |
| `Gra-podglad-PLACEMENT-FOOD.html` | Placement UX — ulepszenia terenu | **JEDYNE ŹRÓDŁO** (możliwy przyszły odpowiednik: brakujący `A08 Tryb budowy ulepszeń`, §6) |
| `Gra-podglad-RZYM-ROBOPRO.html` | Rzym — styl RoboProBlocks | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-ULEPSZENIA-ROBLOX.html` | Lista ulepszeń na mapie (3D) | **JEDYNE ŹRÓDŁO** |
| `Gra-podglad-ULEPSZENIA.html` | jw. | **JEDYNE ŹRÓDŁO** |
| `Makieta-panel-miasta.html` | Panel Miasta (prawdziwy mockup UI, nie art 3D) | **ZASTĄPIONY** — `Ekran Miasto W3 v3` / `Miasto Zakladki 6 klatek` |

### `archiwum/` (root, już zarchiwizowane lokalizacją)

| Plik | Status |
|---|---|
| `Makieta-assety-mapy.html` | **ARCHIWUM** |
| `Makieta-ekran-bitwy.html` | **ARCHIWUM** (treściowo dawno zastąpione przez flow C) |
| `Makieta-mapa-2D.html` | **ARCHIWUM** |

### `_archiwum/` (root, już zarchiwizowane lokalizacją)

| Plik | Status |
|---|---|
| `Katalog-assetow-lowpoly.html` *(bonus, poza wzorcem nazw)* | **ARCHIWUM** |
| `Podglad-armii.html` *(bonus)* | **ARCHIWUM** |
| `Podglad-jednostka-roblox.html` *(bonus)* | **ARCHIWUM** |
| `Porownanie-jednostek-A-B.html` *(bonus)* | **ARCHIWUM** |
| `dist-*/index.html` (7 folderów) | **wykluczone z audytu** — to zbudowane bundle gry (build output), nie mockupy UI |

---

## 3. LISTA PRZESTARZAŁYCH DO WYMIANY — kandydaci do archiwizacji

**Główny deliverable.** Stare mockupy z jednoznacznym, świeższym odpowiednikiem w Claude Design:

| # | Stary plik | Zastępuje go (Design) |
|---|---|---|
| 1 | `Gra-podglad-POLE-BITWY.html` | `_dist/POLE-BITWY-TW-v5-2026-07-23/.../The Game - C06 Pole bitwy odswiezenie (1E).dc.html` |
| 2 | `UI/Gra-podglad-UI.html` | `The Game - Ekran Miasto W3 v3 (1E).dc.html` |
| 3 | `UI/Makieta-dyplomacja.html` | `The Game - Ekran Dyplomacja (1E).dc.html` + `Dyplomacja panel negocjacji v1.1` (DYPLOMACJA FINAL) |
| 4 | `UI/Makieta-panel-armii.html` | `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` |
| 5 | `UI/Makieta-panel-jednostki.html` | `The Game - C09 Karty jednostek v2 (1E).dc.html` (docelowo Roster v4) |
| 6 | `UI/Makieta-preBattle.html` | `The Game - C01 Pre-bitwa v3 (1E).dc.html` — **częściowo**, nakładka TW jeszcze w drodze (§5) |
| 7 | `UI/Warstwa1-Design-System-podglad.html` | `The Game - Design System v1 (1E).dc.html` |
| 8 | `Civ-UNITS/Makieta-pasek-armii.html` | `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` |
| 9 | `Civ-MAPA/Makieta-panel-miasta.html` | `The Game - Ekran Miasto W3 v3 (1E).dc.html` |

**Dodatkowo — martwe przekierowania, niezależnie od Design** (kandydaci do usunięcia, bo wskazują na nieistniejący `Gra-podglad.html`): `UI/Gra-podglad-HUD.html`, `UI/Gra-podglad-MENU.html`, `UI/Makieta-HUD-D1B-preview.html`, `UI/Makieta-HUD-mapa-swiata.html`, `UI/Makieta-flow-nowa-gra.html`, `UI/_redirect-to-engine.html`, `Civ-UNITS/Makieta-przed-bitwa.html`, `UI/Makieta-POROWNANIE-MAPY.html` (redirect w łańcuchu do `Makieta-START.html`).

**9 twardych kandydatów z odpowiednikiem w Design + 8 już martwych redirectów = 17 plików do porządków**, bez ruszania niczego teraz.

---

## 4. LISTA LUK — ekrany tylko w starym mockupie (do zrobienia w Design)

### Prawdziwe luki UI (wymagają docelowo mockupu w Design)

| Ekran | Stary mockup(-y) | Uwaga |
|---|---|---|
| Drzewko technologii (layout drzewa badań) | `Makieta-drzewko-technologii.html`, `UI/Makieta-drzewko-uklad-bez-przeciec.html` | `Ekran Badania (1E)` w Design to lista/panel badań, **nie** graf drzewa — różny układ, nie 1:1 |
| Cuda świata (Wonders) | `UI/Makieta-cuda.html`, `Civ-MAPA/Gra-podglad-CUDA-ROBLOX.html` (art) | brak jakiegokolwiek ekranu Cudów w Design |
| Placement/ulepszenia terenu (tryb budowy na mapie) | `Civ-MAPA/Gra-podglad-PLACEMENT-FOOD.html`, `Gra-podglad-ULEPSZENIA(-ROBLOX).html` | Design **deklaruje** `A-08 Tryb budowy ulepszeń` w CANON, ale plik nieobecny w repo — luka zniknie po dowiezieniu syncu (§6), nie po nowym zleceniu |

### Materiały referencyjne 3D/art (poza zakresem prac Claude Design — informacyjnie, nie realna luka projektowa)

`Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html`, `Gra-podglad-MIASTA*.html` (5 wariantów), `Gra-podglad-OBLEZENIE.html`, `Gra-podglad-RZYM-ROBOPRO.html`, `Civ-UNITS/Galeria-jednostek-4widoki.html`, `Legionista-Minecraft-vs-Roblox.html` — to eksploracje stylu graficznego (Roblox/low-poly/RoboProBlocks) i renderów 3D, nie layouty UI. Claude Design robi mockupy interfejsu (`.dc.html`), nie assety 3D — nie traktować jako zaległość Design.

`UI/Gra-podglad-KREATOR-E2.html` — pełny zrzut działającego silnika (bundle 4657 linii), inna kategoria artefaktu niż mockup statyczny; brak potrzeby zlecania odpowiednika w Design.

---

## 5. Nota o świeżych dostawach 2026-07-23

Trzy pakiety wpłynęły do `docs/ux/claude-design/_dist/` i `DO-DESIGN-2026-07-23/` tego samego dnia (commity `5ac222d`, `507cf0a`, `d600175`, `980e016`):

1. **DYPLOMACJA v1.1 (TW-adapt)** (`_dist/DYPLOMACJA-v1.1-2026-07-23/`) — propozycja do akceptacji, dostarczona jako `Makieta DYPLOMACJA v1.1 -TW-adapt- 1E-.html` (**nie** `.dc.html` — wersja robocza/input, nie kanon).
2. **DYPLOMACJA FINAL** (`_dist/DYPLOMACJA-FINAL-2026-07-23/`) — zatwierdzona dzień później, zawiera właściwy kanoniczny `The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html`. Wg `WYMIANA-UI-DESIGN.md`: **„wdrożona w grze 1:1, ZAMKNIĘTA"**. Ta wersja jest w Tabeli A jako aktualna.
3. **POLE-BITWY-TW-v5** (`_dist/POLE-BITWY-TW-v5-2026-07-23/`) — 6 klatek (ręczna/AUTO/deploy), zawiera `The Game - C06 Pole bitwy odswiezenie (1E).dc.html`. Wg `WYMIANA-UI-DESIGN.md`: **„przyjęte, wdrożenie po stronie integratora"** — czyli mockup zaakceptowany, ale **integracja do kodu gry jeszcze nie wykonana**. To najświeższy i jedyny aktualny mockup pola bitwy — zastępuje całą starą serię Deployment v2–v4 oraz `Gra-podglad-POLE-BITWY.html`.
4. **DO-DESIGN-2026-07-23** (`docs/ux/claude-design/DO-DESIGN-2026-07-23/`) — to jest **zlecenie WYCHODZĄCE do Design**, nie dostawa. Zawiera makietę wejściową `makiety/Makieta-PREBATTLE-v1-TW-nakladka.html` (nakładka pre-battle na widocznej mapie, 3 klatki: atak w polu / atak na miasto / obrona bez wycofania) + zrzuty stanu gry (`zrzuty-stan-gry/`, w tym `dyplomacja-wdrozona.png` — dowód wdrożenia punktu 2). Status wg kanału: **CZEKA na Design** — stąd `UI/Makieta-preBattle.html` w Tabeli B pozostaje oznaczony jako zastąpiony tylko **częściowo** (C01 Pre-bitwa v3 istnieje, ale nakładka TW-style dla samej walki jeszcze nie wróciła jako `.dc.html`).

---

## 6. Uwagi techniczne / anomalie znalezione

- **Plik z uszkodzonym rozszerzeniem:** `docs/ux/claude-design/Panel Moc imperium v3 2026-07-06 (1E).dc.html..html` — podwójne rozszerzenie (`.dc.html` + `.html`). Nie pasuje do wzorca `*.dc.html`, więc narzędzia/skrypty filtrujące po tym wzorcu **go pomijają**. Wymaga poprawki nazwy (osobna decyzja właściciela — nie ruszałem pliku).
- **Rozjazd nazw ASCII vs diakrytyki:** `CANON.md` referuje `Koniec Porazka` (bez polskich znaków), fizyczny plik to `Koniec Porażka` (z ż) — to ten sam ekran, nie luka. Podobnie kilka plików w CANON nie ma sufiksu daty obecnego w rzeczywistej nazwie pliku (`C06 Popup Strategia v4` → plik ma dopisane ` 2026-07-04`, `Popupy deploy v5` → ` 2026-07-05`, `Budynki infografiki kanon v1` → ` 2026-07-05`, `Panel Moc imperium v3` → ` 2026-07-06`) — również dopasowane, nie luki.
- **Prawdziwa luka synchronizacji Design↔repo:** `CANON.md` deklaruje 8 plików jako część aktualnego kanonu, których **fizycznie nie ma nigdzie w repo**: `HUD Panele stany (1E)`, `HUD Jednostka wybrana (1E)`, `HUD Miasto wybrane (1E)`, `A-08 Tryb budowy ulepszeń (1E)`, `A-04 Panel heks kontekst (1E)`, `Jednostki — infografiki kanon v1 (1E)`, `Atlas ikon bitwy i jednostek (1E)`, `C-23 Szczegóły bitwy v1`. To zgodne z wcześniejszym wpisem w `WYMIANA-UI-DESIGN.md`: „**Zlecenie 2 (zaległe):** dosłać `eksport/`... nie dojechał w żadnej z 3 paczek" — sugeruje, że Design ma te ekrany u siebie, ale paczka eksportu do repo jest niekompletna. Warto to zamknąć przy najbliższym kontakcie z Design, zanim ktoś zacznie szukać tych plików w repo.
- **`ostatnie/` w `01-propozycje-z-design/brand-book/`** zawiera też niepowiązane pliki biznesowe (`Zarzadzanie/GTD.docx`, `Karta_Projektu_Agile.docx`) i dwa `.zip` (`Ulepszenie infografik.zip`, `Ulepszenie infografik2.zip`) — nie mockupy, pominięte w tabelach, ale zaśmiecają katalog kanonu Design; do rozważenia przy porządkach.

---

## Podsumowanie liczbowe

| Miara | Liczba |
|---|---|
| Pliki `*.dc.html` w `claude-design/` (surowe, ze wszystkimi duplikatami) | 142 (+1 z uszkodzonym rozszerzeniem) |
| Odrębne ekrany po deduplikacji (Tabela A) | **50** |
| — z tego zadeklarowane w CANON.md ale nieobecne w repo (luka sync) | 8 |
| Stare mockupy wg wzorca zadania (Tabela B, ścisłe dopasowanie) | **37** (+10 dodatkowych plików HTML poza wzorcem nazw, skatalogowanych pomocniczo) |
| — z tego już ARCHIWUM (lokalizacja lub martwy redirect) | 16 |
| — z tego JEDYNE ŹRÓDŁO (brak odpowiednika w Design) | 15 (w tym 12 to referencje artystyczne 3D poza zakresem Design) |
| **Kandydaci do wymiany/archiwizacji (główny deliverable, §3)** | **9** (+8 martwych redirectów niezależnie od Design) |
| Prawdziwe luki UI wymagające przyszłego mockupu Design | 3 (drzewko technologii, Cuda świata, placement/ulepszenia terenu) |

---

## Konsolidacja 2026-07-23 (wykonana)

Zadanie dokumentacyjne: naprawa martwych linków huba kanonu (`01-propozycje-z-design/brand-book/KANON/START - KANON aktualny (1E).dc.html`). Przed konsolidacją hub linkował **40 unikalnych plików** `mockupy/*.dc.html`, z czego fizycznie w `KANON/mockupy/` istniały tylko **2** (+ `support.js`) — **38 linków martwych**.

**Metoda:** parsowanie hrefów huba skryptem, `find`/`md5sum` po repo (w tym rozpakowanie `.zip` z `01-propozycje-z-design/brand-book/` — okazało się, że 4 z „brakujących" plików były spakowane w archiwach roboczych Design, nierozpakowane na dysku). Przy kilku wariantach tego samego pliku wybierano najnowszy wg daty w nazwie folderu dostawy / zip, przy remisie — md5 najnowszego zipu. Nic w `KANON/mockupy/` nie zostało nadpisane; hub i `CANON.md` nie były dotykane.

**Wynik: 34 linki ożywione, 6 nadal brak w repo.**

### Tabela mapowań

| # | Link huba (`mockupy/…`) | Źródło skopiowane | Status |
|---|---|---|---|
| 1 | The Game - Design System v1 (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Design System v1 (1E).dc.html` | OŻYWIONY |
| 2 | The Game - Komponenty (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Komponenty (1E).dc.html` | OŻYWIONY |
| 3 | The Game - Ikony (biblioteka 1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Ikony (biblioteka 1E).dc.html` | OŻYWIONY |
| 4 | The Game - HUD Kit (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - HUD Kit (1E).dc.html` | OŻYWIONY |
| 5 | The Game - Motion (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Motion (1E).dc.html` | OŻYWIONY |
| 6 | The Game - Ekran Menu Hero (1E).dc.html | `01-propozycje-z-design/ekrany-hero/The Game - Ekran Menu Hero (1E).dc.html` (+ `assets/hero-menu.png` dokopiowany, plik go wymagał) | OŻYWIONY |
| 7 | The Game - Ekran Intro Hero (1E).dc.html | `01-propozycje-z-design/ekrany-hero/The Game - Ekran Intro Hero (1E).dc.html` (+ `assets/hero-intro.png` dokopiowany) | OŻYWIONY |
| 8 | The Game - Ekran Kreator (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Ekran Kreator (1E).dc.html` | OŻYWIONY |
| 9 | The Game - Kreator Kroki (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Kreator Kroki (1E).dc.html` | OŻYWIONY |
| 10 | The Game - Ekran Koniec Gry (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Ekran Koniec Gry (1E).dc.html` | OŻYWIONY |
| 11 | The Game - Koniec Porazka (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Koniec Porażka (1E).dc.html` (nazwa źródła z polskimi znakami „ż" → skopiowano pod nazwą ASCII oczekiwaną przez hub) | OŻYWIONY |
| 12 | The Game - Ekran Badania (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Ekran Badania (1E).dc.html` | OŻYWIONY |
| 13 | The Game - Ekran Dyplomacja (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Ekran Dyplomacja (1E).dc.html` | OŻYWIONY |
| 14 | The Game - Dyplomacja panel negocjacji v1.1 -1E-.dc.html | już w `KANON/mockupy/` | JUŻ ISTNIAŁ (nietknięty) |
| 15 | The Game - Ekran Wojsko (1E).dc.html | `01-propozycje-z-design/brand-book/The Game - Ekran Wojsko (1E).dc.html` | OŻYWIONY |
| 16 | The Game - HUD Mapy layout (1E).dc.html | `claude-design/The Game - HUD Mapy layout (1E).dc.html` (płaska kopia robocza) | OŻYWIONY |
| 17 | The Game - HUD Panele stany (1E).dc.html | rozpakowane z `claude-design/Ulepszenie infografik14.zip` → `brand-book/The Game - HUD Panele stany (1E).dc.html` (najnowsza z 5 kopii w różnych zipach, 2026-07-04 06:20) | OŻYWIONY |
| 18 | The Game - HUD Jednostka wybrana (1E).dc.html | jw., ten sam zip | OŻYWIONY |
| 19 | The Game - HUD Miasto wybrane (1E).dc.html | jw., ten sam zip (uwaga: starsze zipy z 07-03 mają inny md5 tego pliku — odrzucone jako nieaktualne) | OŻYWIONY |
| 20 | The Game - A08 Tryb budowy ulepszen (1E).dc.html | — | **BRAK W REPO** (sprawdzono też wszystkie `.zip` w `claude-design/`) |
| 21 | The Game - A04 Panel heks kontekst (1E).dc.html | — | **BRAK W REPO** (jw.) |
| 22 | The Game - Ekran Miasto W3 v3 (1E).dc.html | `claude-design/The Game - Ekran Miasto W3 v3 (1E).dc.html` | OŻYWIONY |
| 23 | The Game - Miasto Zakladki W3 6klatek (1E).dc.html | `claude-design/The Game - Miasto Zakladki W3 v3 6klatek (1E).dc.html` (hub oczekuje nazwy bez „v3" — rozbieżność nazw, ten sam ekran) | OŻYWIONY |
| 24 | The Game - PreBattle nakladka v1.1 (1E).dc.html | już w `KANON/mockupy/` | JUŻ ISTNIAŁ (nietknięty) |
| 25 | The Game - C01 Pre-bitwa v3 (1E).dc.html | `claude-design/The Game - C01 Pre-bitwa v3 (1E).dc.html` | OŻYWIONY |
| 26 | The Game - C06 Pole bitwy odswiezenie (1E).dc.html | `_dist/POLE-BITWY-TW-v5-2026-07-23/brand-book/KANON/mockupy/The Game - C06 Pole bitwy odswiezenie (1E).dc.html` | OŻYWIONY |
| 27 | The Game - C06 Deployment v4 (1E).dc.html | `claude-design/The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` (hub bez daty; uwaga: w różnych paczkach `_dist/` krążą warianty tego pliku o różnych md5 — wybrano wersję z płaskiej kopii roboczej, spójną z większością paczek `poprawki-v4.1`) | OŻYWIONY |
| 28 | The Game - C06 Popup Strategia v4 (1E).dc.html | `claude-design/The Game - C06 Popup Strategia v4 2026-07-04 (1E).dc.html` (hub bez daty) | OŻYWIONY |
| 29 | The Game - C07 Pole HUD bitwy v2 (1E).dc.html | rozpakowane z `claude-design/Ulepszenie infografik14.zip` → `brand-book/The Game - C07 Pole HUD bitwy v2 (1E).dc.html` | OŻYWIONY |
| 30 | The Game - C09 Roster lewy panel v4 (1E).dc.html | `claude-design/The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` (hub bez daty) | OŻYWIONY |
| 31 | The Game - C04 Atak miasto wybor v2 (1E).dc.html | `claude-design/The Game - C04 Atak miasto wybor v2 (1E).dc.html` | OŻYWIONY |
| 32 | The Game - C05 Panel oblezenie v2 (1E).dc.html | `claude-design/The Game - C05 Panel oblezenie v2 (1E).dc.html` | OŻYWIONY |
| 33 | The Game - A19 Miasto zdobyte v2 (1E).dc.html | `claude-design/The Game - A19 Miasto zdobyte v2 (1E).dc.html` | OŻYWIONY |
| 34 | The Game - C23 Szczegoly bitwy v1 (1E).dc.html | — | **BRAK W REPO** |
| 35 | The Game - C12 Koniec bitwy v3 (1E).dc.html | — | **BRAK W REPO** (w repo istnieje tylko `C12 Koniec bitwy v2`, żadna wersja v3 nie znaleziona nawet w zipach) |
| 36 | The Game - Popupy deploy v5 (1E).dc.html | `claude-design/The Game - Popupy deploy v5 2026-07-05 (1E).dc.html` (hub bez daty) | OŻYWIONY |
| 37 | The Game - Jednostki infografiki kanon v1 (1E).dc.html | — | **BRAK W REPO** |
| 38 | The Game - Budynki infografiki kanon v1 (1E).dc.html | `claude-design/The Game - Budynki infografiki kanon v1 2026-07-05 (1E).dc.html` (hub bez daty) | OŻYWIONY |
| 39 | The Game - Atlas ikon bitwy i jednostek (1E).dc.html | — | **BRAK W REPO** |
| 40 | The Game - Panel Moc imperium v3 (1E).dc.html | `claude-design/Panel Moc imperium v3 2026-07-06 (1E).dc.html..html` (plik źródłowy ma uszkodzone podwójne rozszerzenie, patrz §6 — skopiowany pod poprawną nazwą oczekiwaną przez hub) | OŻYWIONY |

### Do dosłania przez Design (6 plików, nigdzie w repo, w tym w archiwach `.zip`)

- `The Game - A08 Tryb budowy ulepszen (1E).dc.html` — A-08, tryb budowy ulepszeń terenu
- `The Game - A04 Panel heks kontekst (1E).dc.html` — A-04, panel kontekstu heksu
- `The Game - C23 Szczegoly bitwy v1 (1E).dc.html` — C-23, raport szczegółów bitwy
- `The Game - C12 Koniec bitwy v3 (1E).dc.html` — tylko v2 istnieje w repo, hub oczekuje v3
- `The Game - Jednostki infografiki kanon v1 (1E).dc.html` — infografiki jednostek
- `The Game - Atlas ikon bitwy i jednostek (1E).dc.html` — atlas ikon

Pokrywa się dokładnie z 8-elementową listą luk z §6 audytu, pomniejszoną o 4 plik(i), które okazały się fizycznie obecne w archiwach `.zip` katalogu głównego `claude-design/` (nierozpakowane): `HUD Panele stany`, `HUD Jednostka wybrana`, `HUD Miasto wybrane` oraz dodatkowo `C07 Pole HUD bitwy v2` (ten ostatni nie był wcześniej wymieniony w §6 jako luka, ale hub go linkuje i też siedział tylko w zipach). Do 6 pozycji powyżej doszedł też `C12 Koniec bitwy v3` (poprzednio §6 nie flagowało tego jako luki, bo `C12 v2` fizycznie istnieje — ale hub żąda konkretnie wersji „v3", której nigdzie nie ma).

### Uwaga o `support.js`

Wszystkie skopiowane pliki referują `./support.js` relatywnie — działa bez zmian, bo `support.js` już siedzi w `KANON/mockupy/`. Skrypt jest generycznym runtime'em bez allowlisty nazw plików (czyta manifest/template wbudowany inline w każdym `.dc.html`), więc obsługuje nowe pliki automatycznie. Jeden plik — `The Game - Panel Moc imperium v3 (1E).dc.html` — ma własny inline `<script>` (nie korzysta z `support.js` w ogóle) — zgodnie z przewidywaniem zadania, nic nie trzeba było robić.

### Znalezisko poboczne (nie naprawiane — poza zakresem)

Kilka skopiowanych plików ma wewnętrzne linki nawigacyjne (stopka) do innych ekranów pod nazwami z myślnikiem em-dash „—" i starszymi nazwami (np. `The Game — Przegląd (1E).dc.html`, `The Game — Ekran Menu (1E).dc.html`), których nie ma w `KANON/mockupy/` pod tymi nazwami. To wewnętrzna nawigacja poszczególnych makiet Design (nie hub), obecna w plikach już przed konsolidacją — nie ruszane, bo to treść własności Design, a zadanie dotyczyło wyłącznie linków huba.
