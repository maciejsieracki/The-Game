# MASTER-E1-jakosc-podglad_2026-06-29

## Metadane

| Pole | Wartość |
|------|---------|
| **Rola** | MASTER + Maciej (decydent) |
| **Temat czatu** | E1 jakość mapy — podgląd 3 presetów + dekoracje |
| **Data sesji** | 2026-06-26 … 2026-06-29 |
| **Powiązane pliki** | `gra/src/qualitypreview/*`, `docs/decyzje/E1-jakosc-mapy-bundle.md`, `Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html` |

---

## Podsumowanie sesji

- Zbudowano podgląd E1: 3 presety (Niska/Średnia/Wysoka) na **tej samej** mapie — jeden canvas WebGL, 3 sceny (fix niebieskiego ekranu).
- Naprawiono las parity w lane MAPA (`forestTreeCountForHex` — ten sam coverage logiczny).
- Dodano pełną dekorację podglądu: 12 miast, surowce, 17 ulepszeń, obóz oblężenia.
- **Maciej:** praktycznie nie widać różnicy między presetami — **akceptacja** jeśli pomaga w wydajności.
- **E1 wdrożenie SILNIK:** bundled preset już wpięty 2026-06-29 (`mapRenderOptionsFromParams` → bundle).
- **Nowa decyzja F-CITY-HEX:** miasto czyści hex (tylko grunt widoczny); bonusy centrum zostają w ekonomii (snapshot).

---

## Decyzje i ustalenia

| ID / temat | Ustalenie | Status |
|------------|-----------|--------|
| E1-Q-BUNDLE | Jeden suwak, Roblox stały, las logiczny bez zmian | ZAMKNIĘTE |
| E1 podgląd | Brak wizualnej różnicy OK | Sign-off Maciej |
| F-CITY-HEX | Czysty hex po founding; bonusy w mieście niewidoczne | ZAMKNIĘTE → EKONOMIA+SILNIK |

---

## Następne kroki

1. SILNIK: Opus + promocja kanonu (E1 już w ROBOCZA).
2. EKONOMIA → SILNIK: F-CITY-HEX (snapshot + wiring main.ts).
3. MAPA P2: skip dekoracji na hexach miasta (opcjonalne wzmocnienie).

---

## Eksport pełny (Cursor UI)

```
(wklej tutaj pełny eksport z Cursor)
```
