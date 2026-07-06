# Maciej — otwarte tematy MAPA / playtest (nie powtarzać w czacie)

**Utworzono:** 2026-07-04 · **MASTER czyta na starcie sesji MAPA/playtest**  
**Playtest:** `gra-robocza/START.html` → Ctrl+F5 · batony **F** / **M** obok minimapy (klawiatura opcjonalna)

Maciej prosił: *„zapisz tematy, nie będę się powtarzał”*. Ten plik = **source of truth** dla tych wątków.

Legenda: `[ ]` czeka playtest · `[~]` fix wdrożony, werdykt Macieja · `[x]` zamknięte · `[—]` w kanonie

---

## 1. Skróty FoW (dev)

| Kontrolka | Zamierzenie | Status |
|-----------|-------------|--------|
| **M** (baton / klawisz) | Cały **ląd** odkryty (przyciemniony), **FoW zostaje**, ocean ukryty | `[x]` Maciej 2026-07-04 |
| **F** (baton / klawisz) | Pełne wyłączenie mgły (wolniejsze) — **tylko dev** | `[x]` Maciej 2026-07-04 |

**Fix v3 2026-07-04:** batony F/M obok minimapy · `fogUiToolsEnabled` (prod off: `VITE_CIV_HIDE_FOG_UI=1`) · minimapa respektuje M · build sync `Gra-podglad*.html`

**Fix v2:** M + `landReveal` w setFog · wybrzeże w ALL_LAND_KEYS · ignore `e.repeat`

**DoD:** `[x]` hint + efekt wizualny · batony widoczne w roboczej · F tylko dev

---

## 2. Ocean znika przy oddaleniu kamery

**Objaw:** przy zoom out znika enoceana / szare rogi kadru; przy zoom in wraca.

**Przyczyna (diagnoza):** za mała płaszczyzna oceanu + `THREE.Fog` + `fog:true` na materiale tafla.

**Fix `[~]` 2026-07-04:** `render/scene.ts` — większy padO, fog.far↑, `oceanMat.fog=false`, tło `deepOcean`.

**Handoff:** `dyspozycje/_handoff/MAPA-do-MASTER_ocean-zoom-out_2026-07-04.md`

**Otwarte ABC:** czy **M** ma pokazywać niebieski ocean wokół wyspy (opcje B/C w handoff).

**DoD:** max zoom out = ciągła ciemnoniebieska tafla, bez szarych trójkątów

---

## 3. Rzeki po **krawędziach** heksów (nie przez środek)

**Wymaganie Macieja:** rzeka biegnie **granica** między heksami, załamuje się w rogach („chrześcijańskie” kąty), **nie** przez środek pola.

**Generator:** OK — `markRiverPath` → `rzeka.krawedzie[]` (`gen-helpers.ts`).

**Render bug (naprawiony `[~]` 2026-07-04):** błędne mapowanie kierunku sąsiada → róg heksa (pointy-top: krawędź `dir` = rogi `(dir+1),(dir+2)`).

**Pliki:** `render/scene.ts` — `hexEdgeMidpointByDir`, `sharedCornerBetweenEdgeDirs`, `buildRiverPointsFromHexPath`, ujście bez środków heksów.

**DoD:** wstęga wzdłuż granic; załamania w wierzchołkach; brak linii przez centrum heksa

---

## 4. Pięć rodzajów **wzgórz** + pięć rodzajów **gór**

**Wymaganie Macieja:** 5 wizualnie odróżnialnych wariantów wzgórz i 5 gór (deterministycznie per heks, ten sam kształt — różne palety).

**Kod `[~]` (sesja wcześniejsza):** `render/mapRenderStyle.ts`

| Typ | Warianty (nazwy robocze) |
|-----|--------------------------|
| **Wzgórza** | łąka, las, pastwisko, step, bagno — `HILL_VARIANTS_ROBLOX` / `MINECRAFT` |
| **Góry** | granit, piaskowiec, bazalt, łupek, tuf — `MOUNTAIN_VARIANTS` |
| **Las (bonus)** | 5 typów drzew — `TREE_VARIANTS` |

**Wybór wariantu:** `decorVariant5(q, r, seed, salt)` — salt 400=góry, 500=wzgórza, 300=las.

**Status:** w **roboczej**; **nie zpromowane do kanonu** · brak sign-off Macieja czy widać różnicę na mapie.

**Ryzyko:** różnice tylko kolorystyczne — Maciej może oczekiwać **kształtów**; wtedy osobna dyspozycja MAPA (mesh per wariant).

**DoD Macieja:** na jednym screenie widać ≥3 różne wzgórza i ≥3 różne góry obok siebie · akceptacja lub „mocniejsze różnice”

---

## 5. Strefy klimatyczne (pas suchy + dżungla + umiarkowany)

**Status:** `[~]` decyzja **A wąski** 2026-07-05 · implementacja MAPA w toku

**Decyzja Macieja (2026-07-05):** **A wąski** — pas suchy **~15%** wysokości mapy · dżungla nad/pod · umiarkowany dalej  
**Zapis:** `docs/decyzje/MAPA-STREFY-KLIMAT-ABC-2026-07-05.md` · handoff `MASTER-do-MAPA_strefy-klimat-A-waski-2026-07-05.md`

**Wizja (Maciej 2026-07-04 wieczór):**
- **Środek mapy (oś r):** wąski pas **suchy** — pustynie tylko tutaj
- **Nad i pod pasem:** **dżungla** (lasy tropikalne — render D-B2-3 już jest)
- **Dalej w górę/dół:** klimat **umiarkowany** — dużo lasu

**Propozycja MASTER:** opcja **A** (pełne 3 strefy w generatorze + render), wąski pas ~15–20% wysokości mapy.

**DoD przed kodem:** Maciej wybiera A/B/C + szerokość pasa suchego (wąski vs średni).

**Pliki docelowe:** `gen-helpers.ts` (climateZoneAt + progi pustyni/lasu), `mapRenderStyle.ts` (dżungla ze strefy, nie hash).

---

## Kolejność sugerowana (MASTER)

1. **Strefy klimatyczne (temat 5)** — **jutro**, decyzja ABC  
2. Rzeki (temat 3) — Ctrl+F5, nowa mapa  
3. Ocean zoom (temat 2)  
4. Warianty wzgórz/gór (temat 4)  
5. ~~Pustynia wyżej / wysokości morze~~ — fix wdrożony 2026-07-04 (`terrain-height-audit`)  
6. ~~FoW M/F (temat 1)~~ — `[x]` 2026-07-04

---

## Jak zamykać wpis

Maciej: `OK rzeki` / `OK ocean` / `OK wzgórza` / `OK pustynia` / ~~`OK FoW`~~ → MASTER ustawia `[x]` + wpis w `DZIENNIK-MASTERA.md`.
