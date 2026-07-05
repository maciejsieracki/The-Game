# DESIGN → UI · POLE-BITWY HUD v4 (1E)

ZLECENIE-ID: POLE-BITWY-HUD-v4-2026-07-04 · styl 1E · zero emoji.
Kolory: Ty #3a6ad0 · wróg #c84040 · złoto #e8d88a · HP zielony · morale złoty.

## Pliki
- `The Game - C06 Deployment v4 2026-07-04 (1E).dc.html` → `battleScene.ts` + `battleHudTheme.ts` (3 klatki: Deploy · AUTO · R+roster)
- `The Game - C09 Roster lewy panel v4 2026-07-04 (1E).dc.html` → roster region + mini-klatka scroll >30

## Mapowanie region → kod
| Region UI | Plik/moduł |
|---|---|
| Top bar (tura·prędkość·VS·K/P/Ł·Wycofaj·emblemat) | battleScene.ts › renderTopBar |
| Pasek mocy poziomy + „Ostatnie starcia" | battleScene.ts › renderPowerBar |
| Prawy rail 56px (P·V·R·M·MUZ·H·»·WYCOF) | battleHudTheme.ts › railButtons |
| Minimapa lewy dół | battleScene.ts › renderMinimap |
| Dolny toolbar deploy (Formacja·Konnica·Linie·Taktyka·Strategia·Reset·Start walki) | battleScene.ts › deployToolbar |
| Toolbar R (Taktyka·Strategia) + popup Taktyka | battleScene.ts › combatToolbar / tacticsPopup |
| Lewy roster (filtry·akcje·siatka 6-kol·scroll) | battleScene.ts › rosterPanel (skin z C09) |
| Karta jednostki | battleHudTheme.ts › unitCard |
| Placeholder mapy B (heksy·sylwetki·ramki grup·złota obwódka·linia nieb/czerw) | render silnika 3D (tło) |

## Tooltips rail (pełne słowa)
P = Pauza · V = Prędkość · R = Auto/Ręczne · M = Mapa/minimapa · MUZ = Muzyka/dźwięk · H = Paski HP/morale · » = Pomiń turę · WYCOF = Wycofaj.

## Stany C06
- **Deploy**: roster? nie (deploy = dolny toolbar formacji); minimapa TAK; top z emblematem cyw.; Start walki = czerwony CTA (wariant B złoty w stopce).
- **AUTO**: roster ukryty · toolbar ukryty · rail widoczny · R bez podświetlenia.
- **R**: lewy roster (scroll pionowy, 6 kol) · toolbar = Taktyka+Strategia · popup Taktyka otwarty · hint „SPACJA = tura" · rail R podświetlony.

## Karta jednostki (MUST)
ikona SVG typu · nazwa/HP tekst · badge grupy · pasek HP (zielony) · pasek morale (złoty) · obwódka zaznaczenia niebieska (#3a6ad0) · martwy/routed = przyciemnienie.

## Filtry / zaznaczenie
Filtry: Konnica · Piechota · Łucznicy · Wszystkie · Grupa 1–3 · Generał (aktywny chip = złoto). Zaznaczenie: Odznacz · Grupuj (◆ SVG diament) · Rozgrupuj.

## Poza scope
C-01 · C-12 · C-19/C-20 oblężenie · balans · log starć (paczka 1).

*Lane UI · The Game · 1E · POLE-BITWY HUD v4 · 2026-07-04*
