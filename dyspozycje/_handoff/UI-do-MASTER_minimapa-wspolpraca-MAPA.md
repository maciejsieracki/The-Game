# UI → MASTER: Minimapa HUD — współpraca z działem MAPA

**Data:** 2026-06-26  
**Od:** Civ-UI  
**Do:** MASTER → dział MAPA  
**Status:** UI gotowe (obie ścieżki zaimplementowane), czekamy na wybór wariantu przez MAPĘ

---

## Cel

Minimapa w HUD (prawy-dolny róg, 200×140 px) musi pokazywać widok przeglądowy świata.  
Decyzja Macieja: **przygotować we współpracy z MAPĄ**, pełny HUD wepnie master DOPIERO gdy minimapa gotowa.

HUD ma gotowy slot (`div.civ-mini`, pozycja fixed right:12 bottom:12) z dwoma alternatywnymi hakami w `HudConfig`.

---

## DWA WARIANTY KONTRAKTU

### WARIANT A — MAPA renderuje do elementu (`onMountMinimap`)

```typescript
// W HudConfig (addytywne, opcjonalne):
onMountMinimap?: (el: HTMLElement, api: { width: number; height: number }) => void;
```

- UI przekazuje gotowy `<div>` o rozmiarze 200×140 px
- MAPA startuje swój renderer (WebGL canvas, skalowany widok z góry) **wewnątrz** `el`
- Wywołanie: **jednorazowe** przy `showHud(config)`
- UI ignoruje `getMinimapData` gdy `onMountMinimap` jest obecne (priorytet A > B)
- Klik → `onMinimapClick(nx*100, ny*100)` (znormalizowane 0–100); MAPA przelicza na hex sama

**Kiedy użyć:** gdy MAPA chce dostarczyć własny skalowany render 3D (buildScene z ortho kamerą z góry) lub własny canvas 2D z heksami.

---

### WARIANT B — UI rysuje z danych (`getMinimapData`)

```typescript
// W HudConfig:
getMinimapData?: () => MinimapData | null;

// Typ MinimapData (zdefiniowany w hud.ts, eksportowany):
interface MinimapHexData {
  q: number;
  r: number;
  teren: string;          // klucz TerenBazowy: 'Laka'|'Rownina'|'Wzgorza'|'Gory'|'Wybrzeze'|'Morze'|'Pustynia'
  ownerColor?: string;    // CSS hex np. '#e05050', undefined = niczyje
}
interface MinimapData {
  cols: number;
  rows: number;
  hexes: MinimapHexData[];
  viewport?: { x: number; y: number; w: number; h: number }; // pozycja ramki widoku kamery
}
```

- UI rysuje lekką przeglądową siatkę prostokątów (1 kafelek = 1 hex) na `<canvas>`
- Kolory terenu wbudowane w hud.ts (Morze=#2a6080, Łąka=#5a9e48, Góry=#8a8a8a itd.)
- Obrys właściciela = cienka ramka w `ownerColor`
- Biały prostokąt = viewport kamery (przesuwa się co turę)
- Klik → `onMinimapClick(q, r)` z dokładnym aksjalnym hex
- Refresh: przy każdym `updateHud()` (po każdej turze)

**Kiedy użyć:** gdy MAPA chce dostarczyć tylko dane (GameMap/hexes), a rysowanie zostawia UI. Lżejsze, bez duplikacji renderera.

---

## REKOMENDACJA (na podstawie materiałów MAPY)

**Rekomendujemy WARIANT B (`getMinimapData`).**

Uzasadnienie z analizy istniejących plików MAPY:

1. Handoff `MAPA-do-MASTER_placement-i-widok-glowny.md` wprost stwierdza: *„minimapa statyczna (narysowana raz) — do implementacji przez Civ-UI"* — MAPA zakładała, że UI rysuje.
2. `buildScene` (renderer 3D) jest ciężki (516 kB bundle z Three.js). Duplikowanie go w małym slocie 200×140 px tylko dla minimapy = kosztowne + ryzyko kolizji WebGL kontekstów.
3. Dane `GameMap` (`hexes: Record<"q,r", Hex>` z `terenBazowy`, `wlasciciel`) są dostępne natywnie — wystarczy je spłaszczyć do `MinimapHexData[]`.
4. MAPA ma już `wlasciciel: string | null` per hex oraz `TerenBazowy` enum — bezpośrednie mapowanie na kontrakt B.

Przykładowa implementacja po stronie MAPY (kilka linii):

```typescript
function getMinimapData(): MinimapData {
  const hexList = Object.values(gameMap.hexes).map(h => ({
    q: h.q, r: h.r,
    teren: h.terenBazowy,                    // TerenBazowy enum → string key
    ownerColor: h.wlasciciel
      ? playerColorMap[h.wlasciciel]         // Record<playerId, CSScolor>
      : undefined,
  }));
  return {
    cols: gameMap.szerokoscQ,
    rows: gameMap.wysokoscR,
    hexes: hexList,
    viewport: camera.getHexViewport(),       // opcjonalnie
  };
}
```

---

## PYTANIE DO MAPY (ABC)

**MAPA, wybierz jeden wariant:**

**A.** Dostarczę `onMountMinimap` — montuję własny renderer WebGL/canvas do slotu UI.  
**B.** Dostarczę `getMinimapData` — przekazuję dane hexów, UI rysuje siatkę. *(rekomendowane)*  
**C.** Mam inną propozycję (opisz w handoffie zwrotnym do mastera).

Odpowiedź jako `MAPA-do-MASTER_minimapa-wybor-wariantu.md`.

---

## NOTA DLA MASTERA

- UI ma już obie ścieżki gotowe w `gra/src/ui/hud.ts` (addytywne haki w `HudConfig`, brak zmian w istniejących eksportach)
- Pełny `hud.ts` wpnie master do kanonu DOPIERO gdy minimapa gotowa (decyzja Macieja)
- Podgląd działającej minimapy (wariant B, siatka 20×14): `UI/Gra-podglad-HUD.html`
- Backup oryginalnego hud.ts: `gra/src/ui/hud.ts.bak-UI`
