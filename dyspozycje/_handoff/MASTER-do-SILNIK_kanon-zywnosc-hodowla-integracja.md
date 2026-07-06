# MASTER → SILNIK (Grupa F / Integrator): integracja kanonu żywność + hodowla

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` (Maciej — **ZAMKNIĘTE**)  
**Status:** **CZEKA** — **nie zaczynaj** przed flagami lane  
**Batch ID:** **F-FOOD-HODOWLA-01**

---

## Co przesyłam

1. **Kanon produktowy** — jedyny source of truth designu (bonusy, tereny, nakładanie, Inkowie, pustynia).
2. **Dyspozycje lane** (równolegle T0):
   - `MASTER-do-EKONOMIA_kanon-zywnosc-hodowla.md`
   - `MASTER-do-MAPA_kanon-zywnosc-hodowla.md`
3. Oczekiwane handoffy zwrotne:
   - `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md`
   - `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md`

---

## Kolejność (OBOWIĄZKOWA)

```
T0  EKONOMIA + MAPA  (równolegle, bez main.ts)
      ↓
T1  SILNIK — model warstw + wire main.ts  (ten handoff)
      ↓
T2  Integrator — bramka + Gra-podglad-ROBOCZA.html
      ↓
T3  Opus review → Master → finalna
```

**Blokada:** jeśli brak `→ SILNIK: GOTOWE` z **obu** lane EKONOMIA i MAPA → raportuj `→ MASTER: BLOK` (nie wpinaj na ślepo).

---

## Co SILNIK / Integrator ma zrobić w `main.ts`

| # | Zadanie |
|---|---------|
| S1 | **Model heksa — warstwy ulepszeń** zamiast jednego `hex.ulepszenie`: np. `ulepszenia: Ulepszenie[]` lub `warstwy: ImprovementLayer[]` — uzgodnić z handoffami EKONOMIA+MAPA |
| S2 | `buildImprovementFactory` / tryb budowy: dodawanie **warstwy** (nie replace), respekt XOR farma→irygacja vs bydło |
| S3 | `placedKeys` → `placedLayers: Map<hexKey, Set<ImprovementKey>>` (lub równoważne) |
| S4 | Save/load meta: persystencja warstw |
| S5 | Wire `playerCivArchetype` + era dla Inków (import helper z EKONOMIA) |
| S6 | Wire unlock hodowli przy pierwszym pastwisku na złożu |
| S7 | Ghost/preview budowy — composite render z MAPA |
| S8 | Usunąć mapowanie `pastwisko` z UI budowy w main (delegacja do buildModeHud po MAPA/UI) |

---

## Pliki

| Plik | Edycja |
|------|--------|
| `gra/src/main.ts` | **TAK** (jedyny editor Integratora) |
| `gra/src/types/hex.ts` | **TAK** — rozszerzenie modelu (batch SILNIK, po kontrakcie lane) |
| `gra/src/game/save.ts` | **TAK** — migracja save v0.1 → warstwy (fallback: stary single ulepszenie) |

**NIE ruszać:** `improvement-build.ts`, `economy.ts`, `render/improvements.ts` (lane MAPA/EKONOMIA).

**Backup przed batch:** `gra/src/main.ts.bak-SILNIK-2026-06-29-FOOD-HODOWLA`

---

## AC integracji

| AC | Kryterium |
|----|-----------|
| AC-S1 | Postaw farma → irygacja na tym samym heksie (płaski, przy rzece) → plony +8 w panelu okolicy |
| AC-S2 | Postaw farma → bydło (bez irygacji) → +5/+3 |
| AC-S3 | Próba farma+bydło+irygacja → UI blokuje / kwalifikacja false |
| AC-S4 | Tarasy solo wzgórze (Chińczycy); owce na wzgórzu solo; lama solo Inkowie |
| AC-S5 | Farma na złożu → niedozwolone |
| AC-S6 | Inkowie epoka 1–2: panel bez bydło/owce; lama dostępna |
| AC-S7 | Save/load zachowuje warstwy |
| AC-S8 | Stary save z single `ulepszenie` — migracja bez crash |

---

## DoD SILNIK

- [ ] AC-S1–S8
- [ ] `npx tsc --noEmit`
- [ ] `.\gra\tools\bramka-test-publish.ps1` (+ `map-improvement-qualify-test.cjs`)
- [ ] `Gra-podglad-ROBOCZA.html` + md5 w meldunku
- [ ] Wpis `dyspozycje/SILNIK-DO-MASTERA.md` (utwórz jeśli brak)
- [ ] Wpis `docs/obieg/INTEGRATOR-kolejka.md` § WPIĘTE
- [ ] Flaga **`→ MASTER: GOTOWE-ROBOCZA F-FOOD-HODOWLA-01`**
- [ ] **Czeka Opus** przed `Gra-podglad.html`

---

## Weryfikacja przed wpięciem (charter Grupa F)

1. Handoff EKONOMIA + MAPA **kompletne** (API, typy, testy zielone).
2. Decyzja Macieja = kanon MD — **nie pytaj ponownie**.
3. Sprawdź `docs/obieg/MAPA-POLACZEN.md` — warstwa 🟡 cross.
4. Max **1 batch** main.ts na ten temat.

---

## Skrót kanonu (do szybkiego self-check)

| Klucz | +🍞 | +⚙️ | Teren | Solo / stack |
|-------|-----|-----|-------|--------------|
| farma | 3 | 0 | płaski | + iryg **lub** bydło |
| irygacja | 5 | 0 | płaski, pustynia | z farmą lub solo (pustynia) |
| tarasy | 3 | 0 | wzgórze | solo; Chińczycy+Inkowie |
| bydlo | 2 | 3 | płaski | + farma; + owce **nie** (teren) |
| owce | 1 | 2 | wzgórze | solo |
| lama | 1 | 3 | łąka/równ/wzg. | solo; Inkowie |
| lodzie_rybackie | 2 | 3 | morze | solo |

Pełny dokument: `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

**Flaga startu Integratora:** `→ INTEGRATOR: CZEKA EKONOMIA+MAPA` → po GOTOWE obu: **`→ INTEGRATOR: GOTOWE F-FOOD-HODOWLA-01`**
