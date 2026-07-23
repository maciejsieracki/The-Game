# The Game — Design System v1 (1E) — HANDOFF (PACZKA FINAL)

Kierunek: **1E Painted Imperial**. Tokeny **FROZEN v1.0**. Zero emoji. Dyplomacja = uścisk dłoni.
Ikony: 3C line, stroke-only, `viewBox 0 0 24`, warianty 24/40 px, `stroke=currentColor`/gold (nauka niebieska, wojna czerwona, sukces zielony).

## Mapa ekran → plik repo (camelCase, gra/src/ui/)
| Makieta `brand-book/` | Plik repo |
|---|---|
| Ekran Menu (1E) | `mainMenu.ts` |
| Ekran Kreator + Kreator Kroki | `newGameFlow.ts` |
| HUD Kit (1E) | `hud.ts` |
| Ekran Miasto (1E) | `cityPanel.ts` |
| Ekran Dyplomacja (1E) | `diplomacyPanel.ts` |
| Ekran Walka + Walka Warianty | `preBattle.ts` |
| Ekran Badania (1E) | `sciencePicker.ts` |
| Ekran Wojsko (1E) | `armyListHud.ts` |
| Koniec gry / Porażka | `victoryScreen.ts` |
| Rejestr ikon | `icons/iconRegistry.ts` (czyta `eksport/icons-manifest.json`) |
| Zmienne tokenów | `brandTokenVars.ts` (z `eksport/tokens.css`/`.json`) |

## Eksport (brand-book/eksport/)
- `tokens.css` / `tokens.json` — **FROZEN v1.0**, `--tg-*`.
- `icons-manifest.json` — id Tier 1–7 → `-24.svg`/`-40.svg`.
- `building-icon-map.json` — id budynku gry → `bld-*` (`icons/buildings/*.svg` @24).
- `civ-icon-map.json` — id cywilizacji → `civ-*` (`icons/civilizations/*.svg` @24 line, 15 + `civ-default`).
- `epoch-icon-map.json` — id epoki startowej → `epoch-*` (`icons/epochs/*.svg` @24 line): kamien→osada, braz→ingot+trzon, zelazo→skrzyżowane miecze. Osobny rejestr (nie icons-manifest).
- `unit-icon-map.json` — kategoria jednostki → `unit-*` (`icons/units/*.svg` @24).
- `icons/tier1..tier7/` — UI chrome (24+40).
- `icons/buildings/` (13) · `icons/units/` (12) · `icons/improvements/` (10) · `icons/resources-map/` (6) — @24.
- `icons/menu-emblem.svg` (80×80).
- `menu-background.css` · `motion.css` · `menu-components.css`.

## Zasady integracji
1. Kolory/geometria wyłącznie z `--tg-*`. Nie hardkodować hex.
2. Ikony przez `iconRegistry` czytający `icons-manifest.json`; budynki/jednostki mapować przez `building-icon-map.json` / `unit-icon-map.json` (fallback `_default`).
3. `currentColor` dziedziczy kolor z rantu medalionu / kontekstu.
4. Animacje: `motion.css` (@keyframes tg-*). Menu: `menu-background.css` + `menu-components.css`.
5. Semantyka ikon zamknięta — nie podmieniać rysunków bez dyspozycji.

## Changelog
- **FINAL** (2026-07-01): eksport Tier 3–7 (24/40), buildings/units/improvements/resources-map, 3 manifesty, menu-emblem, menu-background/motion/menu-components.css, mapa ekran→plik camelCase. **PACZKA FINAL.**
- v2: mapa ekran→TS, semantyka bez pergaminu, tokeny FROZEN, warianty 24/40, nawigacja.
- v1: pierwszy handoff.

*Lane UI · The Game · 1E · PACZKA FINAL · 2026-07-01*

## Szata sync 2026-07-03
Aktualizacja szaty HUD do stanu gry (W2 + Wiki + decyzje D16/D17):
- **USUNIĘTO** strefę D (3 banery liderów) — D16=A, brak do v1.0.
- **USUNIĘTO** stały placeholder panelu kontekstowego — D17=A, domyślnie UKRYTY. Stany: C0 pusty · C1 heks · C2 jednostka (patrz HUD Kit).
- **DODANO** przycisk **Wiki** przed Menu (zielony `#a8c878`, ikona `eksport/icons/ui-wiki.svg`) + klatka panelu Wiki 340px.
- **PRZESUNIĘTO** Wydarzenia NAD stos tury (`bottom:172px`), nie u góry ekranu.
- **Toolbar B**: 5 medalionów — Miasto, Nauka, Dyplomacja, Wojsko, Budowa.
- **Ekran Miasto**: górny pasek + Wiki widoczne; minimapa/tura/toolbar UKRYTE; dim opaque.
- Nowy asset: `eksport/icons/ui-wiki.svg`.
- Pliki: `HUD Mapy layout (1E)`, `HUD Kit (1E)`, `Ekran Miasto (1E)`.
