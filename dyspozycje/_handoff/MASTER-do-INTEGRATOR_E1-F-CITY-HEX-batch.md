# MASTER → INTEGRATOR: E1 jakość (3 presety start) + F-CITY-HEX — publikacja ROBOCZA

**Data:** 2026-06-29  
**Decyzje:** `docs/decyzje/E1-jakosc-mapy-bundle.md` · `docs/decyzje/F-city-hex-czysty.md`  
**Sign-off Maciej:** E1 podgląd OK · F-CITY-HEX (drzewa/owce znikają pod miastem) OK  
**Flaga:** → INTEGRATOR: GOTOWE  
**Warstwa:** 🟡 cross (main.ts + render/scene + UI kreator + save)

---

## Komunikat do wklejenia (Integrator / Silnik)

```
→ INTEGRATOR: GOTOWE

- Moduł / pliki:
  · E1-Q-BUNDLE — jakość mapy: Niska / Średnia / Wysoka (kreator startu)
    gra/data/ui-params.json · gra/src/ui/newGameFlow.ts · gra/src/map/newGameMapDefaults.ts
    gra/src/main.ts (mapRenderOptionsFromParams → bundledMapQualityPreset)
    gra/src/game/save.ts (mapQuality)
  · E1 las parity — ten sam las logiczny, prostsze meshe na Niskiej
    gra/src/render/mapRenderStyle.ts · gra/src/render/scene.ts
  · F-CITY-HEX — czysty hex pod miastem (drzewa/owce/ulepszenia znikają)
    gra/src/game/city-hex-clear.ts · gra/src/game/cities.ts (centerWorkedTile)
    gra/src/render/scene.ts (hideDecorAtHex) · gra/src/main.ts (finalizeCityFounding)

- Warstwa: 🟡 cross (render + main.ts + save + kreator)

- Self-test: kod w gra/src ✅ · map-quality-forest-parity 98/98 ✅
  · Publikacja Gra-podglad-ROBOCZA.html — czeka rebuild Integratora

- Wersja testowa MD5: *(Integrator uzupełni po build → ROBOCZA)*

- Co sprawdzić po wpięciu:
  1. Kreator → ustawienia → Jakość mapy: Niska / Średnia / Wysoka → start bez crash
  2. ?mapQuality=Wysoka na ROBOCZA — preset bez kreatora
  3. Załóż miasto na hexie z lasem lub owcą → brak dekoracji w murach; sąsiednie hexy OK
  4. HUD + panel miasta — bez regresji
  5. Save/load — mapQuality zachowane

- Handoff pełny: dyspozycje/_handoff/MASTER-do-INTEGRATOR_E1-F-CITY-HEX-batch.md
- Decyzje: docs/decyzje/E1-jakosc-mapy-bundle.md · docs/decyzje/F-city-hex-czysty.md
```

---

## Stan w `gra/src` (kod — JUŻ jest)

| Moduł | Pliki | Status kodu |
|-------|--------|-------------|
| **E1 — 3 presety startu** | `ui-params.json` (`map_quality`: Niska/Średnia/Wysoka), `newGameFlow.ts`, `main.ts` (`mapRenderOptionsFromParams` → `bundledMapQualityPreset`), `save.ts` (`mapQuality`) | ✅ wpięte |
| **E1 — las parity** | `render/mapRenderStyle.ts`, `render/scene.ts`, `tools/map-quality-forest-parity-test.cjs` | ✅ wpięte |
| **F-CITY-HEX** | `game/city-hex-clear.ts`, `game/cities.ts` (`centerWorkedTile`), `render/scene.ts` (`hideDecorAtHex`), `main.ts` (`finalizeCityFounding`) | ✅ wpięte w źródle |

## Stan publikacji HTML (NIE aktualne w całości)

| Plik | E1 bundle (29.06) | F-CITY-HEX (po sign-off) |
|------|-------------------|---------------------------|
| `Gra-podglad-ROBOCZA.html` | ✅ | ✅ md5 `611613f4…` *(stary — aktualny kanon: `4602e752…`)* (2026-06-29 Integrator) |
| `Gra-podglad.html` (kanon) | ✅ build wspólny | ✅ md5 `611613f4…` *(stary — aktualny kanon: `4602e752…`)* — czeka Opus |

**Podgląd referencyjny (NIE gra):** `Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html` — tylko porównanie 3 presetów; nie zastępuje ROBOCZA.

---

## Co INTEGRATOR ma zrobić

### AC-1 — Rebuild ROBOCZA
```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
# skopiuj → Gra-podglad-ROBOCZA.html (+ PLAYTEST-* jeśli bundel wspólny)
```

### AC-2 — Bramka logiczna
```powershell
.\tools\bramka-test-publish.ps1
node tools/map-quality-forest-parity-test.cjs   # 98 pass
node tools/okolica-test.cjs
node tools/smoke.cjs
```

### AC-3 — Bramka wizualna (ISO-4)
1. **Kreator → Nowa gra** — krok ustawień: **Jakość mapy** = Niska / Średnia / Wysoka (domyślnie Średnia).
2. Start gry z każdą opcją (min. 1× Niska, 1× Wysoka) — mapa się buduje, brak crash.
3. **F-CITY-HEX:** załóż miasto na hexie z lasem / owcą → **brak** dekoracji w murach; sąsiednie pola bez zmian.
4. HUD + panel miasta — bez regresji.

### AC-4 — Query playtest (opcjonalnie)
`Gra-podglad-ROBOCZA.html?mapQuality=Wysoka` — preset bez kreatora.

### AC-5 — Meldunek
- Wpis w `docs/obieg/INTEGRATOR-kolejka.md` + MD5 ROBOCZA
- Po Opus → promocja `Gra-podglad.html`

---

## Pliki dotknięte (integracja już w src — tylko build)

- `gra/src/main.ts` — bundle jakości + `finalizeCityFounding` / `hideDecorAtHex`
- `gra/src/ui/newGameFlow.ts` — `map_quality` → `NewGameParams.mapQuality`
- `gra/src/render/scene.ts` — `hideDecorAtHex`, las parity
- `gra/src/game/city-hex-clear.ts` — nowy
- `gra/data/ui-params.json` — 3 opcje jakości

**NIE ruszać:** `qualitypreview/*` (osobny entry, poza kanonem).

---

## DoD

- [x] AC-1–AC-2 (build + bramka logiczna)
- [x] ROBOCZA md5 w kolejce Integratora: `611613f49b8fdb92a550cae887606db3` *(stary — aktualny kanon: `4602e752…`)*
- [ ] AC-3 ISO-4 playtest wizualny Macieja
- [ ] Opus → promocja formalna kanonu
