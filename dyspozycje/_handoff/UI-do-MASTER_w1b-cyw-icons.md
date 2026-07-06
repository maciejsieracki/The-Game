# Handoff — W1b · Ikony cywilizacji (kreator + medaliony)

> **Od:** MASTER · **Data:** 2026-06-26  
> **Trigger Macieja:** infografiki per cyw. w kreatorze (zamiast monogramów)  
> **Blokada:** brak `eksport/icons/civilizations/` w PACZKA FINAL

---

## Problem

- Mockup `The Game - Ekran Kreator (1E).dc.html` ma **medalion + SVG line-icon** per cyw. (7 przykładów inline).
- Gra (`newGameFlow.ts`) ma **monogramy liter** (`CIV_GLYPHS`) — wygląda „goło”.
- PACZKA FINAL: budynki, jednostki, HUD tier1–7 — **bez zestawu cywilizacji**.

## Co Design dostarcza (dyspozycja w WYMIANA-UI-DESIGN.md)

| Element | Spec |
|---------|------|
| Folder | `eksport/icons/civilizations/` |
| Pliki | `{ikonaId}.svg` × **15** (patrz mapa poniżej) |
| Rozmiar | **24×24** viewBox, stroke-only 3C, `currentColor` |
| Manifest | `eksport/civ-icon-map.json` — `{ "map": { "grecy": "civ-grecy", …, "_default": "civ-default" } }` |
| Referencja | 7 ikon z mockupu kreatora (partenon, gladius, pagoda, słońce, tarcza, piramida, ziggurat) |

### Mapa `ikonaId` → plik (z `gra/data/civs.json`)

| ikonaId | Cywilizacja | Uwaga mockup |
|---------|-------------|--------------|
| grecy | Grecy | ✅ partenon w mockupie |
| rzymianie | Rzymianie | ✅ skrzyżowane gladiusy |
| chinczycy | Chińczycy | ✅ pagoda |
| inkowie | Inkowie | ✅ słońce/koło |
| zulusi | Zulusi | ✅ tarcza |
| egipt | Egipt | ✅ piramida |
| sumer | Sumerowie | ✅ ziggurat |
| celtowie | Celtowie | **nowa** (Design) |
| germanie | Germanie | **nowa** |
| harappa | Harappa | **nowa** |
| hetyci | Hetyci | **nowa** |
| slowianie | Słowianie | **nowa** |
| babilonia | Babilonia | **nowa** |
| asyria | Asyria | **nowa** |
| fenicjanie | Fenicjanie | **nowa** |

## Co Lane UI zrobi po dostawie (W1b)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/icons/brand/civ-icon-map.json` | sync z eksport |
| `gra/src/ui/icons/brand/civilizations/*.svg` | sync z eksport |
| `gra/src/ui/icons/brandAssets.ts` | `civIconSvg(ikonaId)` |
| `gra/src/ui/newGameFlow.ts` | karty cyw.: `.tg-medallion` + SVG zamiast `ng-glyph`; layout jak mockup |
| `gra/src/ui/diplomacyPanel.ts` | *(opcjonalnie W1c)* baner cyw. — ten sam SVG |

**NIE ruszać:** `main.ts`.

## DoD W1b

- [ ] 15/15 SVG w repo + manifest
- [ ] Kreator krok Cywilizacja: medalion + ikona (zero monogramów liter)
- [ ] `victory-screen-test` + `smoke` OK
- [ ] Meldunek `UI-DO-MASTERA.md` → MASTER build kanon

**Flaga:** ~~CZEKA Design~~ **GOTOWE** (zip `Ulepszenie infografik.zip` · 16 SVG + civ-icon-map.json) · lane W1b zintegrowany 2026-06-26
