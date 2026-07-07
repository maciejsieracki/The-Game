# B-popcap-akwedukt — audyt limitu ludności (2026-07-07)

**Status wdrożenia:** PARTIAL → **FIXED** (cap 15 z Akweduktem dodany w tej sesji).

## Oczekiwana mechanika (Maciej)

| Stan | Cap ludności | Nadwyżka żywności przy cap |
|------|--------------|----------------------------|
| Bez Akweduktu | **5** (normal) | Bufor wzrostu rośnie, +1 zablokowany; część armii wg suwaka B5; reszta przepada (cap bufora) |
| Z Akweduktem | **15** (twardy) | j.w. — wzrost zablokowany, nie idzie na +1 |
| Epoka 4+ | >15 | **NIE wdrożone** — wymaga decyzji ABC |

## Audyt kodu — przed fixem

### ✅ Cap 5 bez Akweduktu — IMPLEMENTED

- `gra/src/game/economy.ts` — `populationGrowth()`, `cityPopulationCap()` (po fixie)
- `gra/data/econ-params.json` — `akwedukt_prog_ludnosci` normal=5
- `gra/src/ui/cityPanel.ts` — chip „Limit”, `atPopCap`
- Test: `gra/tools/akwedukt-popcap-test.cjs` (3/3 pass przed rozszerzeniem)

### ⚠️ Cap 15 z Akweduktem — PARTIAL → FIXED

**Przed:** `popCap = maAkwedukt ? Number.MAX_SAFE_INTEGER : …` — brak limitu 15.

**Po fixie:**
- Nowy parametr `akwedukt_max_ludnosci` (normal=15) w `econ-params.json`
- `cityPopulationCap(maAkwedukt, params)` w `economy.ts`
- UI: „cap 15” zamiast „bez limitu”

### ✅ Nadwyżka żywności przy cap — IMPLEMENTED (B5)

- Bufor (`magazynZywnosci`) kumuluje się zawsze; wzrost tylko gdy `ludnosc < popCap` (`economy.ts:703`)
- Clamp bufora: `growthFoodStorageCap` w `turn-economy.ts:982` — nadwyżka ponad cap bufora ginie
- Armia: `empire-food.ts` — `advanceEmpireFood()` dzieli brutto wg suwaka wzrost/armia; bez Spichlerza 50% netto armii odkłada, ze Spichlerzem 100% do pojemności

### ✅ Odblokowanie Akweduktu — IMPLEMENTED

- `gra/data/tech.json` — tech „Budownictwo” → budynek Akwedukt (epoka Brąz)
- `gra/data/buildings.json` — id `akwedukt`, kategoria Zdrowie, epokaWejscia 2
- `turn-economy.ts` — `builtIds.includes('akwedukt')` → `maAkwedukt`

### ❌ Epoka 4 unlock >15 — MISSING (zamierzone)

- `tech.json` Inżynieria (Epoka Żelazo): uwaga „Akwedukt ulepszony” — **brak hooka w kodzie wzrostu**
- `owner-epoch.ts` — epoka imperium z badań; **brak powiązania z pop cap**

---

## Zmiany w tej sesji

| Plik | Zmiana |
|------|--------|
| `gra/src/game/economy.ts` | `cityPopulationCap()`, `akweduktMaxLudnosci`, cap 15 |
| `gra/src/game/turn-economy.ts` | `buildEconParams` + fallback 5/15 |
| `gra/data/econ-params.json` | `akwedukt_max_ludnosci` |
| `gra/src/ui/cityPanel.ts` | UI cap 5/15, `atPopCap` dla obu stanów |
| `gra/tools/akwedukt-popcap-test.cjs` | +2 testy cap 15 |

---

## Epoka 4 — propozycja ABC (szkic, bez wdrożenia)

**Sytuacja:** Po Akwedukcie miasto rośnie do 15 i staje. W tech.json jest zapowiedź „Akwedukt ulepszony” (Inżynieria, Epoka Żelazo), ale brak mechaniki >15.

**A — Ulepszony Akwedukt (poziom budynku / tech Inżynieria)**  
Podnosi cap do np. 25 lub 30 per miasto. Proste, widoczne w panelu miasta, spójne z istniejącą notatką w tech.json.

**B — Cud / polityka imperium (epoka 4)**  
Jeden slot cudu lub edykt państwowy: +5 cap we wszystkich miastach z Akweduktem. Zachęca do jednej dużej metropolii vs wiele małych.

**C — Cap zależny od epoki właściciela**  
`akwedukt_max_ludnosci` dynamiczny: epoka 3 = 15, epoka 4 = 22, epoka 5 = 30. Mniej mikrozarządzania budynkami, trudniejsze do komunikacji w UI.

**Rekomendacja (szkic): A** — najbliżej zapowiedzi „Akwedukt ulepszony”, lokalna decyzja gracza per miasto.

---

## Weryfikacja

```text
npx tsc --noEmit
node gra/tools/akwedukt-popcap-test.cjs
node gra/tools/spichlerz-wzrost-test.cjs
node gra/tools/empire-food-b5-test.cjs
```
