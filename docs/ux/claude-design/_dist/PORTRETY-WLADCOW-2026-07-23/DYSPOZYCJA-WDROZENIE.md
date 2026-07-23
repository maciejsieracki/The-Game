# DYSPOZYCJA — WDROŻENIE PACZKI „PORTRETY-WLADCOW" (2026-07-23)

## Co to jest
30 portretów władców (15 cywilizacji × epoki Kamień + Brąz; Żelazo — TODO, dojdzie później).
Grafiki od Macieja (MJ wg SPEC-PORTRETY-WLADCOW-MJ.md), pokrojone i znormalizowane przez Design:
- `portraits/portrait-{civ}-{epoka}.png` — **kwadrat 418×418 pod medalion** (pełna wysokość kadru:
  twarz + charakterystyczny tors/strój; boki dopełnione rozmytym tłem — bez czarnych pasów w kole),
- `portraits/full/portrait-{civ}-{epoka}-full.png` — pełna komórka 251×418 (pion, do większych kart),
- `portrait-map.json` — mapa civ × epoka → plik (epoki: kamien/braz/zelazo),
- `portraits-preview.html` — podgląd w medalionach 1E (złota/niebieska/czerwona obwódka).

## KROK 1 — Wgranie do repo (Maciej)
Wgraj do `maciejsieracki/The-Game` → `docs/ux/claude-design/01-propozycje-z-design/brand-book/`
(struktura w paczce = docelowa; wszystko idzie do `brand-book/KANON/eksport/`).

## KROK 2 — Zlecenie dla integratora
1. **Medaliony dowódców** (pre-battle nakładka, HUD bitwy, dyplomacja): w kole medalionu zamiast
   sylwetki SVG renderuj `portrait-map[civ][epoka]` (object-fit: cover). Obwódka wg strony:
   Ty #3a6ad0 / wróg #c84040 / dyplomacja złoto #e8d88a — jak dotychczas.
2. **Fallback (obowiązkowy):** brak wpisu/pliku (np. epoka Żelaza) → dotychczasowy medalion
   z ikoną cywilizacji (`civ-icon-map.json`), potem `civ-default.svg`.
3. **Epoka:** wybieraj portret wg bieżącej epoki gracza/AI; jeśli epoka > dostępne portrety,
   bierz najbliższą wcześniejszą (zelazo→braz→kamien).
4. Wersje `full/` — opcjonalnie do dużych kart (np. panel dyplomacji, ekran końca gry). Na razie
   nie wdrażać nigdzie na siłę.
5. Rozdzielczość źródłowa 418px — wystarcza do medalionów i kart ≤200px. Nie skalować w górę powyżej ~250px.

## KROK 3 — Weryfikacja
Otwórz `brand-book/KANON/eksport/portraits-preview.html` — 2×15 medalionów, twarz w kole,
bez ucięcia nakryć głowy (Hetyci — stożkowa czapka, Egipt — nemes).

## Sanity-check przypisań (kolejność arkusza = kolejność spec 1–15)
Grecy · Rzymianie · Chińczycy · Inkowie · Zulusi / Egipt · Sumer · Celtowie · Germanie · Harappa /
Hetyci · Słowianie · Babilonia · Asyria · Fenicjanie.
Uwaga: w tabeli rozpoznania Macieja poz. 2 była opisana jako „Inkowie" — na arkuszu Brązu poz. 2 to
jednoznacznie Rzymianin (karmazynowy płaszcz + kirys); przypisano wg kolejności spec. Gdyby któryś
portret miał trafić do innej cywilizacji — dyspozycja w WYMIANA-UI-DESIGN.md, przemapuję JSON-em (bez recuttingu).

## Historia zmian paczki
- v4 (2026-07-23): portret **Rzymianie · Kamień** — finalna wersja grafiki (wilcza czapa, pełne futro bez karmazynu; źródło Gemini) — ta sama ścieżka pliku, mapa bez zmian.
- v3 (2026-07-23): portret **Rzymianie · Kamień** podmieniony na nowy (wilcza czapa + karmazynowy płaszcz,
  źródło Gemini od Macieja) — ta sama ścieżka pliku, mapa bez zmian.
- v2 (2026-07-23): kadry kwadratów 251→418 px — pełna wysokość (twarz + tors), boki wtopione.
- v1 (2026-07-23): pierwsze cięcie arkuszy Kamień + Brąz.
