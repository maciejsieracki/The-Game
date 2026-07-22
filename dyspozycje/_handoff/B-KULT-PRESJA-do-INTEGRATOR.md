# B → INTEGRATOR — Presja kultury i religii (KULT-PRESJA-01…06)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-23 |
| **Decyzje** | `docs/decyzje/B-KULT-PRESJA-2026-07-23.md` |
| **Warstwa** | 🟡 cross (`culture-religion.ts` + wpięcie tury w `main.ts`) |
| **Status handoffu** | 🟡 ZAPISANE — **nie wdrażać** bez `działaj` od Macieja |

## Co przesyłam

Maciej zamknął **paczkę 1/2** (presja **kultury**) i **paczkę 2/2** (religia mirror + capture + symetria):

| ID | Maciej | Skrót |
|---|---|---|
| KULT-PRESJA-01 | **A** | Siła = suma `kulturaSkumulowana` imperium (HUD) |
| KULT-PRESJA-02 | **A** | Zasięg = okolica miasta (`cityRangeForPopulation` + `cityBorderRadius`) |
| KULT-PRESJA-03 | **Custom** | easy **7%** · normal **5%** · hard **3%** /t gdy silniejsi |
| KULT-PRESJA-04 | **A** | Religia **mirror** kultury: siła imperium · zasięg okolicy · tempo **7/5/3%** |
| KULT-PRESJA-05 | **A** | Po podboju **zachować** aktualny % kultury/religii z presji (pre-konquest) |
| KULT-PRESJA-06 | **A** | **Symetria:** wróg może **obniżać** nasz % u granicy — ten sam tempo **7/5/3%** |

**Supersedes:** KULT-01 hex-claim · primary effect ≠ tylko terytorium (B-KULT-REL-Q1 może zostać osobno).

## Algorytm — presja kultury (01–03, 06)

### Dane wejściowe (co turę, end-turn)

```
cities[]           — wszystkie miasta na mapie
difficulty         — easy | normal | hard
societyParams      — kultura_presja_proc_tura
```

### Krok 1 — siła imperium

```ts
function empireCultureTotal(cities: City[], ownerId: number): number {
  return sum(c.kulturaSkumulowana ?? 0 for c in cities where c.ownerId === ownerId);
}
```

### Krok 2 — zasięg źródła

Dla każdego miasta źródłowego `S` (owner `oS`):

```ts
radius = citySightRadius(S.population, S.kulturaSkumulowana ?? 0);
// = cityRangeForPopulation(pop) + cityBorderRadius(kultura)  [okolica.ts]
targets = cities T where T.ownerId !== oS && hexDistance(S, T) <= radius;
```

### Krok 3 — push + pull (symetryczny, 06)

Dla każdej pary `(S → T)`:

```ts
rate = societyParams.kultura.kultura_presja_proc_tura[difficulty]; // 7/5/3

if empireCultureTotal(oS) > empireCultureTotal(oT):
  // push: zwiększ udział kultury oS w mieście T
  applyCulturePressure(T, cultureIdOf(oS), +rate);

if empireCultureTotal(oT) > empireCultureTotal(oS):
  // pull (06): obniż udział kultury oT (obrońcy) na mieście T gdy wróg silniejszy w zasięgu
  applyCulturePressure(T, cultureIdOf(oT), -rate);  // floor 0%
```

**Uwaga modelu udziału:** dziś `City.ownCultureShare` = jeden licznik [0,1] „nasza vs obca". Przy presji wielostronnej rozważyć:

- **Wariant A (MVP):** presja tylko między **dwoma** właścicielami graniczącymi w zasięgu; `ownCultureShare` = udział kultury **właściciela** miasta vs reszta.
- **Wariant B (pełny):** mapa `cultureMix: Record<cultureId, pct>` per miasto — większy diff.

**Rekomendacja MVP:** presja zwiększa udział kultury **pushera** kosztem „obcej" puli; właściciel miasta bez zmian do capture.

### Krok 4 — pre-konquest + capture (05)

- Presja działa **przed** podbojem — wysoki % kultury gracza na obcym mieście → po capture mniejsze kary Sz / szybsza stabilizacja.
- **KULT-PRESJA-05:** przy capture **NIE** zerować mixu — zachować `ownCultureShare` / udział religii zbudowany presją jako stan startowy po podboju.
- Konwersja bazowa (budynki) działa **od** tego poziomu w górę.

### Krok 5 — kolejność w turze

```
1. accumulateCulture (plon /t)
2. tickCulturePressure()      ← NOWE (01–03, 06)
3. tickCityCultureReligion()  (convertCulture — istniejące)
4. tickReligionPressure()     ← NOWE (04, 06 mirror)
5. spreadReligion()
```

## Algorytm — presja religii (04, mirror)

Identyczna struktura jak kultura, osobne liczniki:

```ts
function empireReligionTotal(cities: City[], ownerId: number): number {
  // suma wyznawców / skumulowanej religii imperium — analogicznie do kultury
}

rate = societyParams.religia.religia_presja_proc_tura[difficulty]; // 7/5/3 mirror
// tickReligionPressure() — push gdy silniejsi, pull (−rate) gdy wróg silniejszy (06)
```

## Pliki

| Plik | Zmiana |
|------|--------|
| `gra/data/society-params.json` | ✅ `kultura_presja_proc_tura` + ✅ `religia_presja_proc_tura` (7/5/3) |
| `gra/src/game/culture-religion.ts` | `empireCultureTotal`, `empireReligionTotal`, `tickCulturePressure`, `tickReligionPressure`, symetria push/pull |
| `gra/src/game/okolica.ts` | reuse `citySightRadius` — **bez zmian** jeśli import wystarczy |
| `gra/src/game/conquest-stability.ts` | **05:** zachowanie mixu przy capture (read/write) |
| `gra/src/main.ts` | **F only** — wywołanie po accumulateCulture |
| `gra/tools/culture-religion-test.cjs` | § presja kultura+religia: zasięg, delta, symetria push+pull, cap, capture |
| `gra/src/ui/cityPanel.ts` | opcjonalnie: linia „Presja: +X%/t z [cywilizacja]" |

## Testy (DoD)

| # | Scenariusz |
|---|------------|
| T1 | Imperium A kultura 500, B 100 — miasto B w zasięgu A → +5%/t (normal) |
| T2 | B silniejsze — brak pushu z A |
| T3 | Oba w zasięgu — obie strony pchają **i obniżają** symetrycznie (06) |
| T4 | `ownCultureShare` nie przekracza 1.0 / nie poniżej 0.0 |
| T5 | Miasto poza `citySightRadius` — brak presji |
| T6 | easy=7, hard=3 z JSON (kultura + religia) |
| T7 | Religia mirror (04): `empireReligionTotal` + `religia_presja_proc_tura` |
| T8 | Capture (05): miasto z 60% presji → po podboju nadal ~60%, nie reset |

**Bramki:** `npx tsc --noEmit` · `node tools/culture-religion-test.cjs` · `node tools/conquest-stability-test.cjs`

## Zakazy

- ❌ **Nie** przywracać `culture-hex-claim.ts`
- ❌ **Nie** wpięcie `main.ts` w tej sesji bez `działaj`
- ❌ **Nie** reset mixu przy capture (05)

## Flaga

**CZEKA** — dokumentacja + JSON; implementacja po **`działaj`** Macieja.
