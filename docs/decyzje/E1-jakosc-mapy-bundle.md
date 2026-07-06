# E1 — Jakość mapy: jeden preset Roblox (decyzja Macieja)

| Pole | Wartość |
|------|---------|
| **ID** | E1-Q-BUNDLE |
| **Ekran** | Kreator nowej gry → krok 4 |
| **Decydent** | Maciej |
| **Data** | 2026-06-29 |
| **Status** | **ZAMKNIĘTE** (podgląd 3 paneli — sign-off Maciej 2026-06-29) |

---

## Sign-off podglądu (Maciej, 2026-06-29)

- Porównanie Niska / Średnia / Wysoka: **brak wyraźnej różnicy wizualnej** — **akceptacja** pod kątem wydajności (jeden suwak OK).
- Narzędzie referencyjne: `Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html` (opcjonalny playtest, nie blokuje wdrożenia).
- **SILNIK:** bundled preset **wpięty** 2026-06-29 — czeka Opus + promocja kanonu (INTEGRATOR).

---

## Decyzje Macieja (2026-06-29)

### E1-Q1 — Styl mapy

**= Roblox** (stały). Brak wyboru civ / minecraft / innych stylów w kreatorze v1.

### E1-Q2 — Jeden suwak dla gracza

**= Tak.** Karta **„Jakość mapy”** (Niska / Średnia / Wysoka) **zastępuje** kombinowanie osobnych parametrów GPU i dekoracji.

Gracz **nie musi** wchodzić w zaawansowane opcje, żeby ustawić wydajność vs wygląd.

**Zaawansowane opcje** zostają tylko dla: seed, barbarzyńcy, tryb bitew, mgła debug, warunki zwycięstwa — **bez** osobnego suwaka „Jakość renderu GPU”.

### E1-Q3 — Las a rozgrywka (KRYTYCZNE)

**= Jakość graficzna NIE zmienia rozgrywki.**

| Warstwa | Źródło prawdy | Wpływ jakości |
|---------|---------------|---------------|
| **Czy hex ma las** | `hex.nakladka === Nakladka.Las` z **generatora** | **ZERO** — ten sam seed = te same hexy z lasem |
| **Tartak, wycinka, ruch** | logika gry na `nakladka` / `ulepszenie` | **ZERO** |
| **Dekoracja 3D drzew** | `scene.ts` / `mapRenderStyle.ts` | **TYLKO wygląd meshy** (prostsze modele, mniej wielokątów) |

**Zakaz:** `robloxLite` (lub inny preset) **nie może** zmniejszać liczby drzew na hex, pomijać hexów z lasem ani zmieniać seed/hash placement dekoracji w sposób sugerujący inną mapę logiczną.

---

## Tabela presetów (kanon — jeden suwak → pełny pakiet)

Funkcja kontraktu: `bundledMapQualityPreset()` w `gra/src/map/newGameMapDefaults.ts`.

| Jakość mapy (UI) | `renderQuality` | `mapDetailQuality` | GPU (skrót) | Dekoracje 3D (skrót) |
|------------------|-----------------|---------------------|-------------|----------------------|
| **Niska** | `low` | `low` | bez AA, pixelRatio 1.0, bez cieni | prostsze meshe wszędzie; **las = ten sam coverage** |
| **Średnia** | `medium` | `medium` | pixelRatio 1.5, bez cieni | pełne meshe na mapie ≤3000 hex; powyżej — uproszczone **meshe**, nie mniej lasów |
| **Wysoka** | `high` | `high` | AA, pixelRatio 2.0, cienie 1024 | pełne meshe zawsze |

**Generator (`generujSwiat`)** — bez parametru jakości. Zawsze ten sam wynik dla `(seed, rozmiar, typ)`.

---

## Podział lane (wykonanie)

| Krok | Lane | Deliverable |
|------|------|-------------|
| 1 | **MASTER** | Ten dokument + handoffy + kontrakt `bundledMapQualityPreset()` |
| 2 | **UI (Grupa E)** | Jeden suwak; usunąć `render_quality` z modala; stopka bez „wkrótce”; `buildParams()` używa bundla |
| 3 | **MAPA** | Naprawa `robloxLite`: dekoracje ≠ gameplay las; test regresji |
| 4 | **SILNIK** | `mapRenderOptionsFromParams()` → bundle; zapis save; brak dual-track |
| 5 | **INTEGRATOR** | Rebuild kanonu po meldunkach lane |

Handoffy: `dyspozycje/_handoff/MASTER-do-{UI,MAPA,SILNIK}_E1-jakosc-mapy-bundle.md`

Spec techniczny (szczegóły): `docs/grupa-e/SPEC-jakosc-render-i-mapa.md` § addendum 2026-06-29.

---

*Maciej, 2026-06-29*
