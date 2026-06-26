# HANDOFF: MAPA → MASTER — placement UX + widok główny + kontrakt granic

**Data:** 24.06.2026 · **Od:** Civ-MAPA · **Status:** STATUS + KONTRAKT (do wykorzystania przy integracji; część do przekazania UX po akceptacji Macieja).

## 1. Co gotowe (podglądy w Civ-MAPA/)
- `Gra-podglad-WIDOK-GLOWNY.html` — główna plansza (HUD 13 elementów wg Civ7) nad żywą mapą 3D; ikona 🔨 Budowa → TRYB BUDOWA (panel 15 ulepszeń, kursor-młotek, ghost-chip, podświetlenie kwalifikujących heksów, **ghost-preview**: półprzezroczysty model na hover, solidny po kliku). Powrót do mapy. — MOCKUP UX (dane w HUD = placeholder).
- `Gra-podglad-PLACEMENT.html` — sam tryb placement.
- `Gra-podglad-ULEPSZENIA.html` — galeria 15 ulepszeń × tereny.
- `Ulepszenia-na-terenach-matryca.xlsx` — matryca „ulepszenie × teren" (weryfikacja reguł).
- Render: `gra/src/render/improvements.ts` (15 ulepszeń, klucze = `terrain-improvements.json`).

## 2. KONTRAKT GRANIC (dla MIASTO — przez mastera)
Placement używa ZAŚLEPKI granic. Do realnej integracji potrzebuję od MIASTA:
```
isInTerritory(q, r): boolean   // czy heks należy do terytorium gracza
```
- Wejście: aksjalne (q,r). Wyjście: boolean.
- STUB obecny: `axialDist ≤ 3` od dowolnego węzła miasta/posterunku (`TERRITORY_RADIUS=3`).
- Podmianka docelowa: `Set<string>` granic („q,r") z modułu MIASTO (granice kultury + posterunki). MAPA tylko czyta.
- Powiązane reguły, których egzekwowanie trzyma MAPA: teren per ulepszenie (matryca), irygacja = sąsiad rzeki, droga = sieć miasto↔posterunek. Liczby/granice = MIASTO/ekonomia.

## 3. Do przekazania UX (po akceptacji układu przez Macieja)
Widok główny to mockup do przejęcia przez Civ-UI. TODO dla UX:
- minimapa statyczna (narysowana raz), liczby zasobów = placeholder (podpiąć ekonomię), „Tura" kosmetyczna (podpiąć silnik),
- pasek „TRYB BUDOWA" lekko nachodzi na górny pasek zasobów (margines),
- modale toolbara 1–7 zablokowane w trybie Budowa (do decyzji UX),
- banery cyw — dane armii losowe (podpiąć roster AI).
Źródła: `gra/src/mainview/*`, `gra/src/placementpreview/*`.

## 4. Czego potrzebuję / pytania
- Realne `isInTerritory` od MIASTA (pkt 2) — gdy ruszy integracja placement do gry.
- Decyzja Macieja: akceptacja układu widoku głównego → wtedy pełny handoff do UX.
