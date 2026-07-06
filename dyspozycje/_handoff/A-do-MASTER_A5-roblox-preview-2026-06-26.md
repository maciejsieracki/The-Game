# GRUPA A → MASTER: A5-Roblox — podgląd miast brązu (propozycja wizualna)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **→ MASTER: GOTOWE** (podgląd only — **nie** kanon) |
| **Data** | 2026-06-26 |
| **Warstwa** | 🟢 izolowana (nowy moduł render + bronzepreview) |
| **Decyzja Macieja** | **brak ABC** — osobno od A5-S1 (klasyczny v1.0 = już A) |

---

## Co przesyłam

Alternatywny renderer miast epoki brązu w stylu Roblox (klocki, `flatShading`), **ten sam kontrakt API** co `buildBronzeCity`:

```ts
buildBronzeCityRoblox(civ, level, ownerCol, withWalls)
```

| Plik | Rola |
|------|------|
| `gra/src/render/bronzeCityRoblox.ts` | renderer Roblox (10 cyw × poz. 1–10 × mur) |
| `gra/src/bronzepreview/main.ts` | przełącznik `?style=roblox` |
| `gra/src/bronzepreview/index.html` | hint: dwa rzędy z/bez murów |
| `Civ-MAPA/Gra-podglad-MIASTA-BRAZ.html` | podgląd klasyczny · auto `?pack=full` |
| `Civ-MAPA/Gra-podglad-MIASTA-BRAZU-ROBLOX.html` | podgląd Roblox · auto `?pack=full&style=roblox` |

**Układ MAP-S1 (oba HTML):** dla każdej cywilizacji **dwa rzędy** — górny bez murów, dolny z murami; lewo→prawo poziom 1→10.

---

## Co Master ma z tym zrobić

1. **Przekaż Maciejowi** oba pliki HTML do oceny wizualnej (playtest offline, zero terminala).
2. **Po ABC Macieja** (np. A5-Roblox: A=wpiąć / B=poprawki / C=odrzuć):
   - **A** → dyspozycja lane A: podmiana `cities.ts` lub flaga stylu + rebuild F
   - **B** → lane A iteracja `bronzeCityRoblox.ts`
   - **C** → archiwum propozycji, bez wpięcia
3. **Nie** rebuild kanonu z tego handoffu — to nie jest bugfix.

---

## DoD (Master)

- [ ] Maciej otworzył oba podglądy
- [ ] Decyzja ABC zapisana w `REJESTR-DECYZJI.md` (ID proponowane: **A5-Roblox**)
- [ ] Jeśli A: wpis w kolejce Integratora (🟢 batch render)

---

## Self-check lane (2026-06-26)

- `map-improvement-qualify-test.cjs` **43/43**
- `world-density-test.cjs` **28/28**
- Build bronzepreview: OK (`vite.bronzepreview.config.ts`)

**Nie dotyka:** `main.ts` · `Gra-podglad.html` · `cities.ts` (gry)
