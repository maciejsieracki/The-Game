# P1.6 — Warianty liczby cywilizacji i rozmiaru mapy (żywy Chromium)

**Temat:** R-RUSTPORT-P1-6-CIVCOUNT-MAPSIZE-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Izolacja: świeży klon repo w scratchpadzie sesji, `git checkout edb8fb56`, `npm ci` w `gra/`.
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5183 --strictPort` (PID 9916), `predev` pominięty.
- Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, viewport 1600×900, Playwright z `gra/node_modules`.
- Ścieżka: menu → „Rozpocznij grę" → „Rozpocznij konfigurację →" (krok 2 Epoka) → wybór epoki → „Dalej →" (krok 3, auto-wybór cywilizacji) → „Dalej →" (krok 4 Ustawienia).
- Każdy zakres wartości wyznaczono klikaniem strzałek ‹ › w tej rundzie (kierunek w obie strony, aż do zapętlenia lub zablokowania), nie z kodu.
- Dane surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P1-6-CIVCOUNT-MAPSIZE-Q1/` — `probe-civ-e0/e1/e2.json` (sekwencje ‹/› dla każdego rozmiaru) oraz `enum-e0.json` (cykl › dla Epoki Kamienia). Skrypt Playwright użyty do klikania **nie został zachowany**: nie ma go w repo, w runie ani w scratchpadzie sesji. Powtórzenie pomiaru wymaga ponownej sondy według kroków z tej sekcji.
- Zrzuty (ten sam przebieg):
  - `dyspozycje/rust-port/p1/screenshots/P1-6-civcount-mapsize.png` — Epoka Kamienia, domyślnie „Standardowy", „Liczba cywilizacji" = 7 (1600×900, widoczne oba wiersze).
  - `dyspozycje/rust-port/p1/screenshots/P1-6-civcount-mapsize-superhuge-kamien.png` — Epoka Kamienia, „Super Huge", „Liczba cywilizacji" = 7.
- `git status gra/data` = 0 linii przed i po sesji przeglądarkowej.
- Dev server ubity: PID 9916 zakończony (`kill -0` nie znajduje procesu), port 5183 zwraca brak odpowiedzi.

## 2. Rozmiar mapy (6 wartości, potwierdzone w DOM)

Kolejność w UI (strzałka ›): Malenki → Mały → Standardowy → Duży → Ogromny → Super Huge → (zapętla do Malenki).

| Wartość w UI | Opis (ikona info, aria-label) |
|---|---|
| Malenki | ~1000 hex (38×26) |
| Mały | ~2000 hex (54×37) |
| Standardowy (domyślny) | ~5000 hex (84×60) |
| Duży | ~10000 hex (120×84) |
| Ogromny | ~20000 hex (168×119) |
| Super Huge | ~80000 hex (336×238) |

Wartości zgodne z `gra/data/ui-params.json` (`nowa_gra.ustawienia`, klucz `map_size`, `domyslny: 2`).

## 3. Liczba cywilizacji — zakres zależny od rozmiaru mapy i epoki

Menu ma **3 wartości** na każdą kombinację rozmiaru i epoki (17 z 18 komórek), a nie ciągły suwak. Wyjątek: Super Huge w Epoce Kamienia ma 2 wartości (§5). Zakresy zmierzone klikaniem; kolumny posortowane rosnąco, kolejność cyklu przy › bywa inna (np. Malenki/Kamień: 5 → 2 → 3, Mały/Kamień: 4 → 6 → 3):

| Rozmiar mapy | Epoka Kamienia (8 dostępnych) | Epoka Brązu (14) | Epoka Żelaza (15) |
|---|---|---|---|
| Malenki | 2, 3, 5 | 3, 4, 6 | 3, 4, 6 |
| Mały | 3, 4, 6 | 4, 5, 7 | 4, 5, 7 |
| Standardowy | 4, 5, **7** (domyślna) | 5, 6, 8 | 5, 6, 8 |
| Duży | 5, 6, 8 | 8, 9, 11 | 9, 10, 12 |
| Ogromny | 6, 7, 8 | 10, 11, 13 | 11, 12, 14 |
| Super Huge | 7, 8 (patrz §5) | 12, 13, 14 | 13, 14, 15 |

Pogrubiona wartość: potwierdzona w UI jako domyślna dla Epoki Kamienia / Standardowy (zrzut `P1-6-civcount-mapsize.png`) — domyślna jest tu **maksimum** zakresu, nie wartością środkową. Domyślnych wartości dla pozostałych komórek nie zmierzono i nie są podawane. Maksima w Epoce Kamienia: Malenki 5, Mały 6, Standardowy 7, Duży 8, Ogromny 8, Super Huge 8. Sufit 8 (liczba cywilizacji w epoce) ogranicza maksima; nie jest maksimum każdego rozmiaru.

Opis pola w UI (zrzut `P1-6-civcount-mapsize.png`): etykieta „LICZBA CYWILIZACJI”, a pod kartami kroku 4 tekst „Liczba cywilizacji = ile frakcji / obcych klastrów na mapie”. Ikona info przy polu (probe): „Więcej frakcji na mapie”. Podgląd startu na zrzucie `P1-6-civcount-mapsize-superhuge-kamien.png` (Super Huge, wartość 7): „6 obcych cywilizacji na mapie” (6 obcych + gracz = 7).

Liczba cywilizacji w UI przy epoce Kamienia nie przekracza 8, mimo że `gra/data/civs.json` ma 15 cywilizacji — to ograniczenie epoki (`epokaWejscia`), nie rozmiaru mapy.

## 4. Miasta-państwa (sprzężone z rozmiarem, dla kontekstu)

Odczyt po przejściu każdego rozmiaru (Epoka Kamienia, domyślne wartości): Malenki 4, Mały 4, Standardowy 6, Duży 6, Ogromny 8, Super Huge 8. Opis: „Zalecane dla tej mapy" (Standardowy/Ogromny/Malenki) lub „Mniej/Więcej miast w klastrze".

## 5. Anomalia — strzałka „›" nie zawija na Super Huge (Epoka Kamienia)

W Epoce Kamienia przy „Super Huge" zakres obserwowany klikaniem to tylko **7 i 8**. Strzałka › z wartości 8 pozostaje na 8 (9 kliknięć: zawsze 8; `enum-e0.json`), a ‹ przełącza naprzemiennie 8 ↔ 7 (`probe-civ-e0.json`, `leftFrom_start`). Dla pozostałych rozmiarów i epok › zawija (cykl 3 wartości). Przyczyna nieznana; nie stawiam hipotezy bez dowodu. Hipoteza „dwie pozycje 8 w menu" została odrzucona przez dane: przy liście [7, 8, 8] › z 8 wracałoby do 7 (nie zaobserwowano), a ‹ z 8 dawałoby 8 (zaobserwowano 7). Do P1.16 (przypadki brzegowe).

## 6. Odniesienia do źródła

- `gra/src/ui/newGameFlow.ts`: `renderSettingRows` (l. ~1350–1380, strzałki `.arr`, `ch()`), `syncCivTypesOptions` (l. 750), `syncMapScaleOptions` (l. 771), nawigacja kroku (l. ~2050–2085).
- `gra/src/map/newGameMapDefaults.ts`: `civTypesTripleForMapLabel` (l. 633), `clampTypyTripleToEpoch` (l. ~550), `menuBundleFromTriple` (l. 674), `civTypesMenuForMapLabel` (l. ~724).
- `gra/data/ui-params.json`: `map_size` (6 opcji, `domyslny: 2`), `civ_types_count` (w pliku tylko placeholder `["7"]`; faktyczne opcje generowane w runtime).
- `gra/data/civs.json`: 15 cywilizacji (limit puli w epoce wyznacza `epokaWejscia`).

## 7. Nieobserwowane w tej rundzie

- Epoka Żelaza i Brązu: zakresy zmierzone (`probe-civ-e1.json`, `probe-civ-e2.json`); wszystkie 12 komórek zgodne z tabelą §3 (sprawdzone przez cykle ‹/›). Zrzutów nie wykonano (zrzuty tylko dla Kamienia).
- Miasta-państwa: wartości zmierzone tylko dla domyślnych ustawień każdego rozmiaru, bez pełnego przeglądu zakresu.

## 8. Anomalie konsoli

- Konsola: 1 błąd `404 (Not Found)` — taki sam jak w P1.3 i P1.5. Zasób nie został zidentyfikowany. Nie blokuje ekranu. Do P1.16.
