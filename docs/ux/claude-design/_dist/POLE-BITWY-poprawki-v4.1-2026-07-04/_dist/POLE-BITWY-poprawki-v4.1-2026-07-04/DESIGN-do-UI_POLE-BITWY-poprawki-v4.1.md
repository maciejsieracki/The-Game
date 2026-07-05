# DESIGN → UI · POLE-BITWY poprawki v4.1 (1E)

ZLECENIE: POLE-BITWY-poprawki-v4.1-2026-07-04 · styl 1E · zero emoji.
Kolory: Ty #3a6ad0 · wróg #c84040 · złoto #e8d88a.

## 1. Popup Strategia 1E (GŁÓWNA POPRAWKA) — nowy plik
`The Game - C06 Popup Strategia v4 2026-07-04 (1E).dc.html` → skin dla panelu priorytetów w `battleScene.ts` (Strategia).
- Nagłówek złoty (Georgia) + ikona SVG.
- Każdy typ (Konnica/Łucznicy/Piechota) z mini-medalionem SVG (koń / łuk / tarcza).
- **Dropdowny 1E**: ciemne tło `#161c28→#0a0d14`, złota ramka, złota strzałka SVG (koniec z domyślnym granatowym stylem przeglądarki).
- Stała wysokość + **scroll 1E** (nie „pływający" długi panel). Zakotwiczyć nad przyciskiem STRATEGIA (jak popup Taktyka).
- „Przywróć domyślne (armia)" = outline; „Skopiuj z priorytetów armii" = złoty CTA (stopka sticky).
- Checkbox „Własne priorytety tej grupy" w stylu 1E (złoty check).

## 2–4. Notatki do skinu (lane, drobne)
- **Top-bar cluster** „Ty ⌂20 ⚔60 ➹30 ·110 VS …": dodać `gap` między ikoną a liczbą + separatory, symetria wokół VS (czytelność).
- **Nagłówki grup rosteru** „1 / 20": zmienić na „Grupa 1 · 20" (mały podpis) — rozróżnić nr grupy od liczby jednostek.
- **Puste sloty w grupie**: wyrównać siatkę lub pokazać placeholder slotu (teraz wyglądają na niedokończone).

## Bez zmian (spójne)
Rail 56px, minimapa, pasek mocy zielony/czerwony, dolny toolbar, START WALKI czerwony CTA, ramki grup na polu.

*Lane UI · The Game · 1E · POLE-BITWY poprawki v4.1 · 2026-07-04*
