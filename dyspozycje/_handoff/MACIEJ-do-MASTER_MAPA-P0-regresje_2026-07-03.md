# Maciej → MASTER: P0 regresje mapy (playtest 2026-07-03)

**Status:** 🔴 **BLOCK** — krok A (brzeg) **NIE zamknięty**  
**Źródło:** playtest `Gra-podglad.html` · Ctrl+F5 + nowa gra · screen Macieja 2026-07-03 ~14:56  
**Screen:** `assets/.../image-7f3f2e9f-6724-4be4-aaa3-fa333294da23.png` (czat MASTER)

**Maciej:** „nadal są czerwone drzewa i woda, ocean, morze na lądzie. Daj tu już Masterowi do poprawy.”

---

## Werdykt

| Wątek | Poprzedni wpis | Teraz |
|-------|----------------|-------|
| A — brzeg | „A zamknięte” (słowne) | **BLOCK** — regresje na playteście |
| Batch 2 | READY | **2a drzewa = P0** (decyzje D-B2 już są, kod nie wdrożony) |

---

## BUG-P0-1 — Czerwone / pomarańczowe drzewa

**Objaw:** Na lądzie mieszanka zielonych i **czerwono-pomarańczowych** koron (cukierkowy efekt).

**Przyczyna (kod):** `gra/src/render/mapRenderStyle.ts` → `addRobloxTree`:
- `autumn = hash2D(...) > 0.72` → `#FF8822` / `#FFCC44` (~28% drzew liściastych)
- Decyzja **D-B2-1 = B** zapisana, **nie zaimplementowana**

**Fix (lane MAPA, priorytet 1):**
1. Usunąć gałąź `autumn` / pomarańcz
2. Zastąpić deterministyczny **ciemny vs jasny** liściasty (D-B2-1 B + D-B2-2 C)
3. Sosna: ciemna oliwka; liściaste: pastel v2 Warm (`#5A8F5A` / `#8FBF7A` zamiast `#33DD55`)

**AC:**
- [ ] Nowa gra — **zero** heksów z koronami `#FF8822` / `#FFCC44`
- [ ] Sosny wyraźnie ciemniejsze od liściastych

**Pliki:** `mapRenderStyle.ts` only (Batch 2a)

---

## BUG-P0-2 — Woda / ocean / morze na lądzie

**Objaw (screen):**
- **Zamknięty niebieski zbiornik** w środku lądu (morze/wybrzeże otoczone trawą)
- Niebieskie hexy „w głębi” mapy, nie przy krawędzi ekranu
- Opcjonalnie: cyjanowe „plamy” pod palmami na wodzie (oaza / tafla wybrzeża?)

**Hipotezy do weryfikacji (lane MAPA):**

| # | Hipoteza | Gdzie |
|---|----------|--------|
| H1 | `removeInlandWaterPools` **przed** `applyCoastRing` — po ring zostają wybrzeża otaczające „fjord” połączony z oceanem korytarzem | `generator.ts` pass 3b — **drugi pass** `removeInlandWaterPools` + `sanitizeCoastHexes` **po** `applyCoastRing` |
| H2 | Zatoka „legalnie” połączona z oceanem (`oceanConnectedWaterKeys` liczy Wybrzeże) — Maciej uznaje za bug | nowa reguła: usuń Morse **bez sąsiada suchego lądu po stronie lądu** / max głębokość zatoki / tylko Morse na krawędzi mapy |
| H3 | **Render** — tafla wody 3D (`buildStyleCoastWaterCap`) na heksie logicznie lądowym | `mapRenderStyle.ts` + `scene.ts` |
| H4 | Rzeki jako pełne niebieskie hexy wyglądające jak morze | `scene.ts` / `gen-helpers` traceRiver |
| H5 | **Stary kanon** — `Gra-podglad.html` bez pass 3b | MASTER: rebuild `npx vite build --outDir $TEMP\civ-dist` → skopiuj do root |

**Fix proponowany (MASTER → MAPA):**
1. W `generator.ts` po `applyCoastRing` + `sanitizeCoastHexes` → **ponownie** `removeInlandWaterPools(hexes, w, h)` + ewent. `sanitizeCoastHexes`
2. Rozszerzyć test `map-coast-buffer-test.cjs`: N seedów, **zero** `findInlandWaterHexes` po pełnym pipeline
3. Playtest wizualny: brak niebieskich „jezior” otoczonych lądem z każdej strony

**AC:**
- [ ] `findInlandWaterHexes` = 0 na 20 losowych seedach (Mały/Standardowy)
- [ ] Maciej: brak „oceanu na lądzie” na screenie tego typu
- [ ] Brzeg morze ↔ wybrzeże ↔ ląd nadal OK (regresja brzegu)

**Pliki:** `gen-helpers.ts`, `generator.ts`, `gra/tools/map-coast-buffer-test.cjs`, ewent. `scene.ts` / `mapRenderStyle.ts`

---

## Kolejność dla MASTER

```
P0-1  MAPA: D-B2 drzewa (szybki patch — decyzje gotowe)
P0-2  MAPA: woda na lądzie (generator + testy; potem render jeśli dalej widać)
      MASTER: rebuild Gra-podglad.html
      Opus review
      Maciej playtest → dopiero wtedy A = OK
P0-3  Batch 2b D-RUDY, 2c reszta (wg wcześniejszego handoff)
```

**Nie delegować Batch 2c/minimapa przed zamknięciem P0-1 + P0-2.**

---

## Powiązane dokumenty

- `dyspozycje/_handoff/MASTER-handoff-MAPA-teren-D-B2-D-RUDY_2026-07-03.md` — decyzje B/C, D-RUDY
- `dyspozycje/_handoff/MAPA-do-MASTER_brzeg-hybrid-C-2026-07-03.md` — brzeg hybryda C
- D-B2-1 **B**, D-B2-2 **C**, D-B2-3 **A** — kanon grafiki lasu

---

## DoD MASTER

1. Dyspozycja `dyspozycje/MAPA.md` § P0 (lub osobny wpis) z AC powyżej
2. Subagent Composer MAPA — **2 osobne taski** (drzewa | woda) lub 1 sekwencyjny jeśli ten sam plik kolizja
3. Build + `map-coast-buffer-test.cjs` + smoke
4. Opus → kanon
5. Meldunek `MAPA-DO-MASTERA.md` + wpis DZIENNIK

**Flaga:** → MAPA (P0) · **BLOCK** Batch 2c · **BLOCK** publikacja kanonu bez Opus

---

## Update 2026-07-03 ~16:29 — Maciej (playtest 2)

**Screen:** ocean między górami / na lądzie (nadal P0-2).

**Wybrzeże — grafika (akceptacja częściowa):**
- Plaża „zarysowuje się” — **OK zostawiamy na tym etapie**
- Heksy Wybrzeże: **jeden kolor**, bez ciemnoniebieskiej obwódki (fix render — `buildStyleCoastWaterCap` / blend / krawędzie hexa)

**Decyzja D-COAST-2 (Maciej):** **podwójny pasek** heksów Wybrzeże wokół lądu/wyspy (2 warstwy), nie pojedynczy.

| | Dziś | Kanon |
|---|------|--------|
| `applyCoastRing` | 1 pass — ląd przy Morzu → Wybrzeże | **2 passy** — drugi pierścień: suchy ląd graniczący z Wybrzeże → też Wybrzeże |
| Układ | morze → 1× wybrzeże → ląd | morze → 2× wybrzeże → ląd |

**Pliki:** `gen-helpers.ts` `applyCoastRing` (lub `applyCoastRingDouble`), `generator.ts`, `map-coast-buffer-test.cjs`.

**Powiązane P0:** woda w górach — osobno (generator inland pools).

---

## Update 2026-07-03 ~16:30 — Maciej: czerwone drzewa + brak dżungli

**Maciej:** „czerwone drzewa nadal są” · „żadnej dżungli nie widzę” (×2).

**Przyczyna:** decyzje D-B2 **zapisane, kod NIE wdrożony** — lane MAPA jeszcze nie patchował `mapRenderStyle.ts`.

| Item | Stan kodu (`gra/src/render/mapRenderStyle.ts`) | Decyzja Macieja |
|------|-----------------------------------------------|-----------------|
| Czerwone drzewa | `autumn > 0.72` → `#FF8822` **nadal w kodzie** | D-B2-1 **B** — usunąć |
| Dżungla | **zero** implementacji (brak hooka biomu) | D-B2-3 **A** — wdrożyć |

**P0-1 ESCALATION — pierwszy commit lane MAPA (blokujący playtest):**
1. Usunąć `autumn` / `#FF8822` / `#FFCC44`
2. Wdrożyć D-B2-1 B + D-B2-2 C (sosna ciemna, liściaste jasne)
3. Wdrożyć D-B2-3 A — **widoczna** dżungla:
   - Hook: `Nakladka.Las` + biom ciepły (np. szum temperatury / bliskość równika w generatorze — **MAPA musi dodać flagę** `hex.climate` lub derive z `(r/height)`)
   - Wizual: 5–7 drzew/hex, ciemniejsza zieleń, **palmy + parasol**, wyraźnie inne niż las umiarkowany
   - **AC Macieja:** na mapie standardowej w strefie ciepłej widać co najmniej kilka hexów „dżungla” (nie mylić z zwykłym lasem)

**Bez tego fixu kanon nie publikować** — regres wizualny potwierdzony 3× playtest Macieja.

---

## Update 2026-07-03 ~16:31 — Maciej: hex pod miastem + obwódka zasięgu

**Maciej:** na mapie miasta nadal widać **heksy** (teren pod modelem); **obwódka zasięgu** miasta dziwnie zaznaczona — nie spójna, nie łączy się w jeden pas.

### BUG-P1 — Hex terenu pod miastem (F-CITY-HEX niedokończone wizualnie)

**Co działa:** `applyCityFoundingToHex` czyści nakładki/złoża w danych; `hideDecorAtHex` chowa las/ozdoby 3D.

**Czego brakuje:** **płaski kafel terenu (zielony prism)** nadal renderuje się pod modelem miasta — gracz widzi „heks na heksie”.

**Fix (MAPA + SILNIK):**
- MAPA `scene.ts`: opcja ukrycia / spłaszczenia mesh terenu na hexie miasta (platforma pod `cities.ts` albo instanced matrix zero jak dekoracje)
- SILNIK `main.ts`: wołać `reapplyCityHexDecorHides()` po `buildScene` / load save / każde miasto w `cities[]` (funkcja **istnieje, nigdy nie wołana** poza `finalizeCityFounding`)

**AC:** hex centrum miasta = tylko model osady / platforma, bez widocznego zielonego terenu i drzew.

### BUG-P2 — Obwódka zasięgu okolicy — porozrywana

**Objaw:** niebieski pas granicy zasięgu nie tworzy **ciągłego pierścienia** — przerwy, zygzaki, niespójne odcinki.

**Przyczyna (kod):** `rangeOverlay.ts` → `buildBorderBandMesh` — osobny czworokąt na każdej krawędzi zewnętrznej heksa; `hexTopY` **różne** na wzgórzu vs równinie → pas „pływa”; brak zgrzewu rogów. W `mainview/main.ts` jest już fix ciągłej linii (`buildTerritoryObjects`, dokładnie `HEX_R`).

**Fix (MAPA / UI overlay):**
- `cityOkolicaOverlay.ts` + `rangeOverlay.ts`: granica zasięgu jak `mainview` — **jedna ciągła linia** (`LineSegments`) + opcjonalny jednolity Y offset
- Albo: weld corner quads / jeden outline mesh na obwód całego `rangeKeys` Set
- Ujednolicić promień obrysu (`HEX_R * 0.97` tint vs pełny `HEX_R` border → rozjazd)

**AC:** obwódka zasięgu okolicy (panel miasta) = **jeden zamknięty pas** bez przerw na rogach hexów.

**Lane:** MAPA (render) · SILNIK (reapply hide + sync po rebuild sceny)

**Priorytet:** P1 obok P0 (miasto czytelność) — nie blokuje P0 mapy, ale przed kanonem v1.

---