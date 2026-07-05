# DESIGN → UI · C-04 / C-05 / A-19 — Oblężenie na mapie świata (1E)

Kierunek 1E. Tokeny FROZEN. Zero emoji (SVG line). Modale na mapie świata — NIE pole bitwy 3D.

## Pliki
- `brand-book/The Game - C04 Atak miasto wybor v2 (1E).dc.html` → port `cityAttackChoice.ts`
- `brand-book/The Game - C05 Panel oblezenie v2 (1E).dc.html` → port `siegeMapPanel.ts`
- `brand-book/The Game - A19 Miasto zdobyte v2 (1E).dc.html` → port `cityCaptureNotice.ts`

## C-04 Atak na miasto (modal centrum, mapa przyciemniona)
Ornament ⚔ (SVG) + Georgia „Atak na miasto". Medalion miasta + Kapua + tagi (Mur miejski / Garnizon N / Populacja N). „Atakujesz: Legioniści ×1". 2 karty: **Oblężaj** (ciepły brąz #c87840, skrót 1) · **Szturm** (#3a6ad0, skrót 2). Anuluj (Esc). Skróty małym tekstem.

## C-05 Panel oblężenia (mapa widoczna, panel prawy)
Mapa świata + uproszczony HUD (pasek zasobów, minimapa) w tle. Panel prawy 360px: nagłówek „Oblężenie · Tura 3", cel (Kapua · Mur · Garnizon 4), statystyki (Zapasy/Zużycie/Oblegających/Milicja), ostrzeżenie kapitulacji, sekcja machin (Taran w budowie 60% + przyciski Taran/Wieża), akcje **Kontynuuj** (złoto) · **Szturm** (#3a6ad0) · **Odwrót** (slate). Skróty Enter/2/Esc.

## A-19 Miasto zdobyte (modal centrum węższy)
Medalion miasta (SVG, nie 🏛), „Miasto zdobyte" + Kapua + opis (pusty garnizon), 3 staty (Populacja/Osiedla/Złoto), przycisk **Rozumiem** (Enter).

## Kolory akcji
Oblężaj = ciepły brąz #c87840 · Szturm = niebieski #3a6ad0 (Ty) · Anuluj/Odwrót = neutral slate outline.

## Status
C-04 / C-05 / A-19 v2 gotowe. Po Design: lane portuje 3 pliki .ts (bez main.ts). Następne: C-19/C-20 mur na polu bitwy.

*Lane UI · The Game · 1E · C-04/C-05/A-19 · 2026-07-04*
