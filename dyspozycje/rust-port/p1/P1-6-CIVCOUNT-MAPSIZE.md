# P1.6 — Warianty liczby cywilizacji i rozmiaru mapy (żywy Chromium)

**Temat:** R-RUSTPORT-P1-6-CIVCOUNT-MAPSIZE-Q1 · **Runda:** 1/5 · **Pin:** `main` = `edb8fb56`

## 1. Metoda i dowody

- Izolacja: świeży klon repo w scratchpadzie sesji, `git checkout edb8fb56`, `npm ci` w `gra/`.
- Vite bezpośrednio: `node ./node_modules/vite/bin/vite.js --port 5183 --strictPort` (PID 9916), `predev` pominięty.
- Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, viewport 1600×900, Playwright z `gra/node_modules`.
- Ścieżka: menu → „Rozpocznij grę" → „Rozpocznij konfigurację →" (krok 2 Epoka) → wybór epoki → „Dalej →" (krok 3, auto-wybór cywilizacji) → „Dalej →" (krok 4 Ustawienia).
- Każdy zakres wartości wyznaczono klikaniem strzałek ‹ › w tej rundzie (kierunek w obie strony, aż do zapętlenia lub zablokowania), nie z kodu.
- Dane surowe: `dyspozycje/autobot/runs/R-RUSTPORT-P1-6-CIVCOUNT-MAPSIZE-Q1/` (skrypty i JSON-y sondy w scratchpadzie, kopie `probe-civ-e0/e1/e2.json`).
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

Menu ma **3 opcje** na każdy rozmiar (min / domyślna / max), a nie ciągły suwak. Zakresy zmierzone klikaniem:

| Rozmiar mapy | Epoka Kamienia (8 dostępnych) | Epoka Brązu (14) | Epoka Żelaza (15) |
|---|---|---|---|
| Malenki | 2, 3, 5 | 3, 4, 6 | 3, 4, 6 |
| Mały | 3, 4, 6 | 4, 5, 7 | 4, 5, 7 |
| Standardowy | 4, 5, **7** (domyślna) | 5, 6, 8 | 5, 6, 8 |
| Duży | 5, 6, 8 | 8, 9, 11 | 9, 10, 12 |
| Ogromny | 6, 7, 8 | 10, 11, 13 | 11, 12, 14 |
| Super Huge | 7, 8 (patrz §5) | 12, 13, 14 | 13, 14, 15 |

Pogrubiona wartość: potwierdzona w UI jako domyślna dla Epoki Kamienia / Standardowy (zrzut `P1-6-civcount-mapsize.png`). Górna granica każdego zakresu w Epoce Kamienia jest ograniczona liczbą cywilizacji dostępnych w tej epoce (8).

Opis pola w UI: „Liczba frakcji na mapie"; podsumowanie kroku 4 (np. Standardowy / 7) pokazuje „7 na mapie" i „6 obcych cywilizacji" — zgodnie z tym, że gracz zajmuje jedno miejsce.

Liczba cywilizacji w UI przy epoce Kamienia nie przekracza 8, mimo że `gra/data/civs.json` ma 15 cywilizacji — to ograniczenie epoki (`epokaWejscia`), nie rozmiaru mapy.

## 4. Miasta-państwa (sprzężone z rozmiarem, dla kontekstu)

Odczyt po przejściu każdego rozmiaru (Epoka Kamienia, domyślne wartości): Malenki 4, Mały 4, Standardowy 6, Duży 6, Ogromny 8, Super Huge 8. Opis: „Zalecane dla tej mapy" (Standardowy/Ogromny/Malenki) lub „Mniej/Więcej miast w klastrze".

## 5. Anomalia — strzałka „›" nie zawija na Super Huge (Epoka Kamienia)

W Epoce Kamienia przy „Super Huge" zakres obserwowany klikaniem to tylko **7 i 8**. Strzałka › z wartości 8 nie przechodzi do 7 (9 kliknięć: zawsze 8), a ‹ przeskakuje naprzemiennie 8 ↔ 7. Dla pozostałych rozmiarów zawijanie działa. Przyczyna nie jest potwierdzona w DOM; prawdopodobna (z kodu, nie zweryfikowana w UI): `civTypesMenuForMapLabel` (`gra/src/map/newGameMapDefaults.ts`, l. ~715–730, `menuBundleFromTriple` l. 674) przycina górną granicę triady do maksimum epoki (8), więc w menu mogą być dwie pozycje „8" i `syncCivTypesOptions` (`gra/src/ui/newGameFlow.ts` l. 750–769) przywraca wartość przez `indexOf`. Do P1.16 (przypadki brzegowe).

## 6. Odniesienia do źródła

- `gra/src/ui/newGameFlow.ts`: `renderSettingRows` (l. ~1350–1380, strzałki `.arr`, `ch()`), `syncCivTypesOptions` (l. 750), `syncMapScaleOptions` (l. 771), nawigacja kroku (l. ~2050–2085).
- `gra/src/map/newGameMapDefaults.ts`: `civTypesTripleForMapLabel` (l. 633), `clampTypyTripleToEpoch` (l. ~550), `menuBundleFromTriple` (l. 674), `civTypesMenuForMapLabel` (l. ~724).
- `gra/data/ui-params.json`: `map_size` (6 opcji, `domyslny: 2`), `civ_types_count` (w pliku tylko placeholder `["7"]`; faktyczne opcje generowane w runtime).
- `gra/data/civs.json`: 15 cywilizacji (limit puli w epoce wyznacza `epokaWejscia`).

## 7. Nieobserwowane w tej rundzie

- Epoka Żelaza i Brązu: zakresy zmierzone, zrzutów nie wykonano (zrzuty tylko dla Kamienia).
- Miasta-państwa: wartości zmierzone tylko dla domyślnych ustawień każdego rozmiaru, bez pełnego przeglądu zakresu.

## 8. Anomalie konsoli

- Konsola: 1 błąd `404 (Not Found)` — taki sam jak w P1.3 i P1.5. Zasób nie został zidentyfikowany. Nie blokuje ekranu. Do P1.16.
