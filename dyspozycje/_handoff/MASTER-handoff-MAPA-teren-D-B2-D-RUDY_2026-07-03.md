# MASTER ← sesja MAPA teren (2026-07-03)

**Od:** czat MASTER z Maciejem  
**Status:** GOTOWE do delegacji lane MAPA + ewent. rebuild kanonu  
**Flaga:** → MASTER (plan batchy) → MAPA (Composer) → Opus → MASTER (integracja/kanon)

---

## 1. Werdykt Macieja — krok A (brzeg)

**Maciej (2026-07-03):** „A i wszystko do mastera, co zrobiłeś”

| Interpretacja | Akcja MASTER |
|---------------|--------------|
| **A = OK brzeg** | Traktuj hybrydę C + delta ujść rzek jako **zamknięte** na v1; Batch 2 może startować |
| Weryfikacja | Jednorazowy smoke: Ctrl+F5 `Gra-podglad.html` + nowa gra — brzeg + rzeki (jeśli regres → hotfix MAPA przed B) |

**Stan kodu brzegu (z wcześniejszej sesji — nie edytowano w tej rozmowie):**
- `mapRenderStyle.ts` — hybryda C (piasek ląd + tafla woda), `ROBLOX_TERRAIN_VIS[Wybrzeze]`
- `scene.ts` — rzeki wybrzeżne, `riverMouthEdgeKeys`
- `gen-helpers.ts` — `traceRiver` domknięcie na Wybrzeże
- Testy: `map-coast-buffer-test.cjs` **81/81** (wg meldunku hybrid C)
- Handoff: `dyspozycje/_handoff/MAPA-do-MASTER_brzeg-hybrid-C-2026-07-03.md`

---

## 2. Kolejność prac (Maciej)

**„b i c później a”** → potem **„A”** = domknięcie A, dalej B+C:

| Krok | Temat | Status |
|------|--------|--------|
| **A** | Brzeg hybryda C | **Zamknięte** (werdykt Macieja) |
| **B** | Batch 2 dekoracje 3D v2 Warm | **READY** — deleguj MAPA |
| **C** | Korekty pojedynczych kolorów heksów | Po playteście B |

**Batch 1 (done):** `TERRAIN_ROBLOX` v2 Warm — heksy + scena (nie dekoracje 3D).

---

## 3. Decyzje ABC — D-B2 (las / dżungla)

| ID | Wybór | Implementacja |
|----|-------|---------------|
| **D-B2-1** | **B** | Usunąć pomarańcz (`autumn`); liściaste = ciemna + jasna zieleń |
| **D-B2-2** | **C** | Sosna ciemna oliwka; liściaste jaśniejsze (pastel v2 Warm) |
| **D-B2-3** | **A** | Dżungla = wariant `Nakladka.Las` w biomie ciepłym (bez nowego terenu) |

**Pliki lane MAPA:**
- `gra/src/render/mapRenderStyle.ts` — `addRobloxTree`, `buildStyleForestCluster`, paleta zieleni
- `gra/src/render/scene.ts` — przekazanie biomu / flagi jungle do cluster build
- Hook biomu: generator lub istniejący param klimatu (sprawdź `generator.ts` / `gen-helpers.ts`)

**AC:**
- [ ] Brak `#FF8822` / `#FFCC44` na drzewach Roblox
- [ ] Sosny ciemne; liściaste jaśniejsze od sosny
- [ ] Biom ciepły + Las → gęstszy klaster (5–7), palmy/parasol, ciemniejsza zieleń
- [ ] `robloxLite` / jakość mapy — ta sama liczba drzew, prostsze meshe OK (E1)

---

## 4. Decyzja produktowa — D-RUDY (złoża metali)

**Maciej:** miedź **Wzgórza** · żelazo **Góry** · wygląd **grudki** (nie wiaderka) · miedź miedziana · żelazo szkliste.

| Surowiec | Teren | Pole | Render |
|----------|-------|------|--------|
| Miedź | **Wzgórza** | `hex.zloze='miedz'` | `styledCopperOre` — grudki, `#B87333` |
| Żelazo | **Góry** | `hex.zloze='zelazo'` | `styledIronOre` — szkliste żyły |
| Węgiel | Góry | `hex.zloze='wegiel'` | bez zmiany |
| Glina | Łąka/rzeka | `ZlozeGliny` | dzbany OK |

**Gap dziś:**
- `gen-helpers.ts`: miedź i żelazo obie na `Gory` → **miedź → Wzgorza**
- Legacy `Nakladka.ZlozeRudy` + `styledOre` (złote grudki) — wycofać z generatora
- `improvement-build.ts` / `mainview`: kopalnia na Wzgórza wymaga `ZlozeRudy` — **naprawić na `zloze=miedz`**

**Pliki:**
- `gra/src/map/gen-helpers.ts` — `BASE_DEPOSIT_RULES`
- `gra/src/map/improvement-build.ts`, `gra/src/mainview/main.ts`
- `gra/src/render/styleResources.ts` — `styledCopperOre`, `styledIronOre`
- Testy: `map-deposits-era-test.cjs`, `grupa-b-lane-test.cjs` (jeśli dotyczy)

**AC:**
- [ ] Miedź tylko Wzgórza; żelazo tylko Góry (generator + test)
- [ ] Kopalnia: kwalifikacja zgodna z terenem
- [ ] Brak nowych `ZlozeRudy` na świeżej mapie
- [ ] Grudki wizualnie odróżnialne; żelazo „szkliste”

**Otwarte (Maciej nie odpowiedział):** konkuencja miedź vs owce na Wzgórza — domyślnie **1 złoże/hex, losowo** (bez zmiany).

---

## 5. Batch 2 — pełny zakres (poza D-B2 + D-RUDY)

Po drzewach i rudach (ten sam lane MAPA, ten sam plik `mapRenderStyle.ts` + satelity):

| Element | Plik | Uwaga |
|---------|------|--------|
| Wzgórza / krzewy | `mapRenderStyle.ts` | stonowane v2 Warm |
| Oazy / palmy | `buildStyleOasis` | `#33DD55` → pastel |
| Ulepszenia 3D | `robloxImprovements.ts` | neon → pastel pro |
| Miasta klockowe | `robloxCity.ts` | earth tones |
| Minimapa | `minimapHud.ts` | **Batch 3** — sync wszystkich `TEREN_KOLOR` |

---

## 6. Co zrobił ten czat (MASTER ops — bez kodu gry)

- Zapis decyzji w `dyspozycje/DZIENNIK-MASTERA.md` (kolejność A→B+C, D-RUDY, D-B2)
- Meldunek w `dyspozycje/MAPA-DO-MASTERA.md` (D-B2)
- Ten handoff
- Archiwum: `docs/archiwum-czatow/master/MASTER-MAPA-teren-decyzje_2026-07-03.md`

**Nie ruszano:** `main.ts`, `Gra-podglad.html`, kod lane MAPA w tej rozmowie.

---

## 7. Propozycja batchy dla MASTER

```
Batch 2a (MAPA, ~1 sprint): D-B2 drzewa + dżungla wizualna
Batch 2b (MAPA):            D-RUDY generator + render + testy
Batch 2c (MAPA):            reszta dekoracji (wzgórza, oazy, robloxImprovements, robloxCity)
Batch 3 (MAPA):             minimapa sync
```

Po każdym batchu: build `/tmp/civ-dist` → testy → Opus → MASTER kanon.

---

## 8. DoD dla MASTER po lane

1. Composer MAPA melduje w `MAPA-DO-MASTERA.md`
2. Testy MAPA zielone + bramka 17 suitów
3. Opus APPROVE
4. MASTER rebuild + kopiuj `Gra-podglad.html`
5. Maciej playtest wizualny Batch 2

**Flaga końcowa:** → Maciej (playtest) · CZEKA na C (tuning heksów) po B
