# R-PILL-TARCZA-BEZ-MURU — tarcza na pigułce bez widocznego muru/palisady

**Status:** ✅ ZDEPLOYOWANE `ee0e7e04` Q1=A · 2026-08-04 — ZDEPLOYOWANE FALA 223 `ee0e7e04`  
**Zgłoszenie:** Maciej (screenshot Sparta, FALA 222) — szara tarcza na pigułce mimo braku muru/palisady na heksie.

## ECHO
**R-PILL-TARCZA-BEZ-MURU-Q1 = A** — *„a”* (2026-08-04). Tier tarczy wyłącznie z `wallKind` (= model 3D); bez fallbacku `maMur`.

## Dowód wdrożenia
- `wallKindFromBuilt` + `defenseTierFromWallKind` w `cityMapStatChip.ts`
- `_buildBadgeInput` bierze `getWallKind` (ten sam co model 3D)
- `maMur` ignorowane · test `city-map-badge-test.cjs` **19/19** · `tsc` 0

---

## Reguła (potwierdzona, bez zmiany produktu)

Z `R-DESIGN-PANEL-MIASTA` / `R-CITY-PILL-SHIELD-EMBLEM`:

| Stan miasta | Tarcza na pigułce |
|-------------|-------------------|
| brak palisady i murów | **brak tarczy** |
| tylko **palisada** | tarcza **szara** |
| **mury** lub **cytadela** (`fort`) | tarcza **złota** |

**Tak — szara tarcza wyłącznie przy palisadzie.** Bez obwodu obronnego = zero tarczy.

---

## Diagnoza (kod FALA 222 / `132401ef`)

- Bundle ma bramkę `defenseTier !== 0` — tier 0 **nie rysuje** tarczy.
- Szary kolor (`#9a9aa8`) = **wyłącznie** `built.includes('palisada')` → tier 1.
- Model 3D bierze `getWallKind` z **tej samej** listy `cityBuilt`.
- Badge liczy tier przez `defenseTierFromCity(built, city.maMur)` — osobna ścieżka (+ fallback `maMur` → złota, nie szara).

**Wniosek:** albo Sparta ma `palisada` w `cityBuilt` a wał 3D jest niewidoczny/niezsynchronizowany, albo jest rozjazd badge↔model. Cel naprawy: **jedno źródło prawdy** = ten sam `wallKind` co model na mapie.

---

## [TEMAT: Tarcza pigułki bez muru] R-PILL-TARCZA-BEZ-MURU-Q1

**Sytuacja:** Na mapie świata pigułka miasta (Sparta) pokazuje szarą tarczę obrony, a na heksie widać tylko osadę bez palisady/murów. Reguła produktowa: bez obwodu = bez tarczy; szara tylko przy palisadzie.

**Cel pytania:** Jak scalić wskaźnik tarczy z tym, co widać na modelu miasta.

**Dlaczego teraz:** Regresja / rozjazd po FALA 222 (R-CITY-PILL-SHIELD-EMBLEM); myli odczyt obrony miasta na mapie.

### A — Tier wyłącznie z `wallKind` (= model 3D) *(rekomendacja)*
`none` → brak tarczy · `palisada` → szara · `stone` (mury/fort) → złota. Usunąć osobny fallback `maMur` z badge. Wspólna funkcja dla `getWallKind` i pigułki.
- **Za:** jedna prawda z modelem; koniec rozjazdu badge↔heks; proste testy.
- **Za:** zgodne z już zatwierdzoną regułą wizualną.
- **Przeciw:** wymaga drobnej zmiany w `cityMapStatChip.ts` + `cities.ts` (+ test).
- **Przeciw:** save z niespójnym `maMur` bez budynku nie pokaże złotej tarczy (rzadkie).

### B — Zostawić liczenie z `cityBuilt` + `maMur`, tylko utwardzić testy
Bez zmiany ścieżki runtime; dociągnąć asercje i ewentualny log.
- **Za:** mniej ruchu w renderze.
- **Za:** nie rusza kontraktu badge.
- **Przeciw:** nie usuwa możliwej przyczyny rozjazdu z modelem.
- **Przeciw:** Maciej nadal może widzieć tarczę bez wału na heksie.

### C — Tier z `cityBuilt`, ale rysuj tarczę tylko gdy `wallKind !== 'none'`
Podwójna bramka: najpierw budynki, potem wymóg zgodności z modelem.
- **Za:** chroni przed „duchową” tarczą gdy model bez wału.
- **Za:** zostawia semantykę budynków w tierze.
- **Przeciw:** dwie ścieżki do utrzymania.
- **Przeciw:** trudniejsze testy niż wariant A.

**Rekomendacja: A** — tarcza = to samo źródło co wał na mapie.

---

## Pliki (po decyzji)

- `gra/src/render/cityMapStatChip.ts` — `defenseTierFromCity` / helper z `CityWallKind`
- `gra/src/render/cities.ts` — `_buildBadgeInput`
- `gra/tools/city-map-badge-test.cjs`
- ewent. `docs/decyzje/R-DESIGN-PANEL-MIASTA.md` (dopisek: wallKind = prawda)

**Deploy:** osobno, na hasło `deploy`.
