# Handoff UI/MAPA → MASTER — A1-Q6 przełączniki mapy przy minimapie

**Status:** GOTOWE (spec) · **CZEKA** mockup D1B + implementacja  
**Decyzja Macieja:** 2026-06-26 · powiązane **A1-Q7** (brak Idee)

---

## Co przesyłam

### Wyłączone całkowicie

- Toolbar / overlay **💡 Opracowanie idei** (#3) — **nie wdrażać** (prototyp `mainview` ignorować).

### Panel `#map-layer-toggles` (nowy element HUD)

**Pozycja:** bezpośrednio **pod** `#minimap-wrap`, lewy-dół (D1B), szerokość ≈ minimapa (~210px).

**Zasada Maciej:** tutaj lądują **wszystkie** przełączniki widoczności **głównej mapy 3D** — nie w toolbarze overlay.

| Toggle | v1.0 | Efekt |
|--------|------|-------|
| 🗺️ Zasięg cywilizacji | **TAK** | tint + obrys granic |
| 🏷️ Nazwy miast | **TAK** | etykiety miast |
| ⛏️ Surowce / 🎖️ Armie / 🏗️ Ulepszenia / 🌫️ Mgła | propozycja lane | patrz `docs/A1-HUD-SCHEMAT-MAPA-D1B.md` § F2 |

- Styl: małe przyciski **toggle** (ON podświetlony).
- **Nie** w lewym toolbarze overlay (#1–8).

### Kontrakt (propozycja)

```ts
interface MapLayerTogglesConfig {
  getTerritoryVisible: () => boolean;
  setTerritoryVisible: (on: boolean) => void;
  getCityLabelsVisible: () => boolean;
  setCityLabelsVisible: (on: boolean) => void;
}
```

Hook w `hud.ts` / `minimapHud.ts`; stan w `main.ts` lub MAPA render state.

---

## Co Odbiorca ma z tym zrobić

| Lane | Zadanie |
|------|---------|
| **UI** | Dodać `#map-layer-toggles` do `Makieta-HUD-D1B-preview.html` + moduł HUD |
| **MAPA** | Egzekwować visible flags w renderze granic i etykiet |
| **MASTER** | Wpięcie przy batch D1B |

---

## DoD

- [ ] Brak ikony Idee w HUD i mockupie (chip „Nowa idea" w side-panel demo — usunąć przy porcie D1B)
- [ ] Granice i nazwy **tylko** przy minimapie
- [ ] Lewy toolbar (jeśli będzie) **bez** #3, #9, #10
- [ ] Toggle persystuje w sesji (localStorage opcjonalnie później)

**Flaga:** GOTOWE (spec)
