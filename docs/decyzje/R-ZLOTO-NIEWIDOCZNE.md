# R-ZLOTO-NIEWIDOCZNE — surowe złoże złota widoczne na mapie

**Status:** ✅ **ZDEPLOYOWANE** `0bea1d88` (FALA 97) · kod `76d671f` · verify/close 2026-08-05  
**Zgłoszenie:** Maciej 2026-07-26 — „nie widzę surowca złota na mapie (nie kopalnia)”.

## Diagnoza (stan przed fixem)

Złoto **istniało w danych** (`hex.zloze = 'zloto'`, rzadkość 0,03, Wzgórza/Góry), ale `buildStyledResourceOverlay` w gałęzi `zloze` obsługiwało tylko `miedz` / `zelazo` / `wegiel` / `sol` — dla `zloto` zwracało `null`, więc na heks nie trafiał żaden obiekt 3D.

## Wdrożenie (76d671f → FALA 97)

| Element | Plik | Dowód |
|---------|------|-------|
| Model surowego złoża (roblox) | `gra/src/render/ulepszenia-modele-p3b.ts` | `buildZlozeZloto()` — 4 skupiska obrzeża, skała + żyła + samorodek |
| Styled path (minecraft/inne) | `gra/src/render/styleResources.ts` | `styledGoldOre()` |
| Podpięcie w overlay | `gra/src/render/styleResources.ts` | `case 'zloto':` w `buildStyledResourceOverlay` |
| Podgląd dev | `gra/tools/.zloze-mockup/` | mockup pięciu złóż przez tę samą funkcję co mapa |

**Aktywny styl gry:** `roblox` (`GAME_MAP_RENDER_STYLE` w `mapRenderStyle.ts`) — gracz widzi `buildZlozeZloto()`.

## Znane ograniczenie (bez zmiany)

W stylu `civ` ścieżka `buildResourceOverlay` / `buildResourceOverlayFromZloze` zwraca generyczne `oreRocks()` dla `zloto` — to osobna, starsza ścieżka; **nie jest** aktywnym stylem rozgrywki. Rozszerzenie enum `Nakladka` o `ZlozeZlota` wymagałoby decyzji właściciela (zapis w stanie gry).

## Bramki verify/close (2026-08-05)

- `tsc --noEmit` 0
- `node tools/zloze-zloto-render-test.cjs` **7/7**
- `node tools/zloto-test.cjs` 43/43 (łańcuch gameplay bez regresji)

## Tip dla playtestu

Złoto jest **rzadkie** (~3% heksów lądu, głównie Wzgórza/Góry). Szukaj ciemnych wychodni skalnych ze złotą żyłą na obrzeżu heksa (środek wolny pod ulepszenie). Ctrl+F5 + **Nowa gra** po deploy.
