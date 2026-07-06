# MASTER → MAPA: brzeg hybryda C (D-MAPA-BRZEg)

> **Status:** GOTOWE do implementacji  
> **Decyzja:** `docs/decyzje/D-MAPA-BRZEg.md` · **Maciej = C** (2026-07-03)  
> **Delta:** `docs/decyzje/D-MAPA-DELTA.md` · **Maciej = A** (2026-07-03)  
> **Priorytet:** 🔴 P0 — bloker wizualny playtestu mapy

---

## Kontekst

Maciej (playtest + screenshot): brzeg wygląda jak **klif**; piasek niewidoczny; rzeki u ujścia nienaturalne.  
Iteracje A-COAST-SAND v2–v6 **nie rozwiązały** problemu — patch na cienkich paskach krawędzi Wybrzeże.

---

## Co zaimplementować (C = hybryda)

### 1. Piasek na lądzie (A)

- Heks **suchego lądu** (Łąka, Równina, …) z sąsiadem `Wybrzeże` → **piaskowa nakładka na górnej powierzchni** (min. pas od krawędzi w stronę morza, ~25–35% promienia heksa).
- Kolor: `COAST_SAND_ROBLOX` (#E8D4A0) — spójny z brand.

### 2. Szeroka plaża na Wybrzeżu (B)

- Heks `Wybrzeże`: **górna powierzchnia = piasek** (nie tylko cienki box na krawędzi).
- Jasnoniebieska tafla (`buildStyleCoastWaterCap`) **tylko od strony Morza** (kierunek brzegu), nie pod piaskiem przy lądzie.

### 3. Łagodniejszy profil (C)

- Obniżyć różnicę wysokości ląd ↔ Wybrzeże (mniej pionowej ściany).
- Piasek na styku **wypełnia szczelinę** wizualną między heksami.

### 4. Delta rzeki (D-MAPA-DELTA = **A**)

- U ujścia (`riverPaths` końcówka na Wybrzeże / sąsiedni ląd): **fan / rozszerzenie** na **2–3 heksy** Wybrzeże.
- Woda delty: **jasnoniebieska** (ta sama paleta co Wybrzeże), poziom tafli wybrzeża.
- Szerokość wstęgi rośnie ku morzu (nie stała jak na lądzie).
- Piasek u ujścia: zgodnie z brzegiem C — delta **zastępuje** wąski pas piasku na krawędzi ujścia.
- Utrzymać ciągłość z odcinkiem lądowym (v6) — delta to **kontynuacja**, nie nowy segment w oceanie.

---

## Pliki (lane MAPA)

| Plik | Zakres |
|------|--------|
| `gra/src/render/mapRenderStyle.ts` | nowe: `buildStyleLandCoastSandCap`, rozszerzenie `buildStyleCoastSandEdges` / cap |
| `gra/src/render/scene.ts` | montaż nakładek ląd + Wybrzeże; profil wysokości |
| `gra/src/map/generator.ts` | tylko jeśli trzeba (pierścień Wybrzeże już jest) |
| `gra/tools/map-coast-buffer-test.cjs` | rozszerzyć o asercje „land beach cap” |

**NIE ruszać:** `main.ts`

---

## DoD

- [ ] Nowa gra → brzeg: **widać piasek** z kamery izometrycznej (ląd + wybrzeże)
- [ ] **Delta:** rzeka u ujścia rozszerza się w jasnoniebieskie Wybrzeże (fan 2–3 heksy)
- [ ] Brak „szczeliny wody” między piaskiem a trawą
- [ ] `map-coast-buffer-test.cjs` — ZIELONE
- [ ] Screenshot przed/po w `MAPA-DO-MASTERA.md`
- [ ] Meldunek → MASTER → rebuild kanon (F)

---

## Anty-wzorzec

❌ Kolejny v7 tylko większy `BoxGeometry` na krawędzi Wybrzeże bez powierzchni lądu.
