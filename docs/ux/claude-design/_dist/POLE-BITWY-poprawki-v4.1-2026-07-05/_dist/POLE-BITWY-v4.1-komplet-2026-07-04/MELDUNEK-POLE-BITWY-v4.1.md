# MELDUNEK — POLE-BITWY v4.1 komplet (2026-07-04)

Paczka: `POLE-BITWY-v4.1-komplet-2026-07-04.zip`. Skin/szata 1E — lane portuje CSS, logika bez zmian.

## Pliki
1. **The Game - C06 Deployment v4 2026-07-04 (1E).dc.html** — faza rozstawiania, 3 stany (Deployment / AUTO / Ręczne).
2. **The Game - C06 Popup Strategia v4 2026-07-04 (1E).dc.html** — popup Priorytety armii/grupy w 1E.
3. **The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html** — roster kart jednostek.
4. **support.js** — runtime .dc.html (obok plików).
5. **DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md** — handoff lane.

## Poprawki tej sesji (C06 Deployment)
- VS → **skrzyżowane miecze** w górnym pasku.
- Miecze + pasek mocy **wyrównane do pionowej linii podziału mapy** i styku zielony/czerwony — wszystkie 3 plansze (Deployment/AUTO = 960 px, Ręczne = 1144 px / `50% + 184px`).
- Cluster statystyk: infografiki **koń** (konnica) · **skrzyżowane miecze** (piechota) · **łuk** (łucznicy) — zamiast domyślnych glifów.
- Nagłówki grup rosteru: „Grupa 1 · N".
- Paski mocy w stanach AUTO / Ręczne ustawione 50/50 (styk na środku).

## Strategia v4
- Dropdowny w ciemno‑złotej ramce 1E (nie systemowe granatowe), mini‑medaliony typów, strzałka ▾.
- Sekcje: Priorytety armii (Konnica/Łucznicy/Piechota ×3) + Priorytety grupy.
- „Przywróć domyślne (armia)", scroll 1E, zakotwiczenie nad przyciskiem STRATEGIA.

## Do sprawdzenia po stronie Cursora (zauważone przez Design)
Rzeczy poza szatą — logika/kod, nie mockup:
1. **Pasek mocy — proporcja realna.** W mockupie 50/50 (start). W grze ma odzwierciedlać faktyczny stosunek sił i przesuwać się w czasie bitwy.
2. **Liczby clustera (20·60·30·110)** — wartości przykładowe. Podpiąć pod realny stan armii (żywe jednostki per typ), aktualizacja przy stratach.
3. **Puste sloty rosteru** — siatka wyrównana w mockupie (pełne rzędy po 6), ale realna liczba kart zależy od armii → dynamicznie dopełniać rząd albo zwężać panel, bez „dziur".
4. **Popupy Formacja / Linie / Taktyka — równa wysokość pozycji** (~36 px, ten sam padding co Strategia). Część renderuje kod gry.
5. **Dropdowny natywne** — jeśli gdzieś zostały systemowe `<select>` (granatowe), podmienić na styl 1E jak w Strategii.
6. **Karta zabitej/routed jednostki** — potwierdzić osobny wygląd (opacity + „✕") i brak możliwości zaznaczenia.
7. **Skalowanie 1920×1080** — potwierdzić zachowanie przy innych proporcjach (min. szerokość rosteru/toolbaru, żeby się nie nakładały).

## Zgodność mockup ↔ gra (do ujednolicenia)
- **Kolejność liczb strony Wróg**: gra pokazuje `20·60·30·110` (jak Ty); mockup ma stronę Wróg lustrzaną (`110·30·60·20`). Docelowo obie strony `20·60·30·110`.
- **Strzałka „↓" przed „Ty"** — jest w grze, brak w mockupie. Zachować w grze albo dodać do mockupu (drobiazg).

## Status
POLE-BITWY v4.1 — dopięte po stronie Design. Zero emoji, kanon 1E. Lane: port CSS.

*Lane UI · The Game · 1E · POLE-BITWY v4.1 · 2026-07-04*
