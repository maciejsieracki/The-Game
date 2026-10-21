# P3-19 — Spłaszczenie mnożników do wartości (FLATTEN-MULTIPLIERS)

STATUS: PASS-WITH-NOTES (etap Operatora, runda 1/5; notatki: pytania właściciela w sekcji 9; Evaluator i Final Control jeszcze nie oceniali)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1
BAZA: `origin/rust-port/parity-v2` = `d3a73641` (detached)
PIN web: `edb8fb56` (`gra/src/**`, `gra/data/*.json`) — tylko odczyt (`git show` / `git grep`), zero buildu weba, zero zmian w `gra/**`
ZMIANY: niezcommitowane w chwili pisania dokumentu (commit: patrz sekcja 11); DEPLOY/PUSH: NIE WYKONANO
RUNDA: 1/5

---

## 0. Cel i interpretacja

Decyzja właściciela (główny czat, 2026-10-21): „Wszystkie ręczne mnożniki trzeba przeliczyć na konkretne liczby, bez tych mnożników, i wpisać je do nowego kodu jako wartości.”
Doprecyzowanie właściciela: mnożniki były ręcznymi pokrętłami do balansu. Rozwinięte liczby mają być **edytowalnym, jawnym źródłem prawdy**: właściciel zmienia konkretną liczbę, a nie mnożnik. Wzór weba służy wyłącznie do jednorazowego zasilenia tabeli wartościami startowymi (bootstrap) i do udokumentowania równoważności w chwili wygenerowania (ta sekcja). Testy stałe sprawdzają KSZTAŁT i KOMPLETNOŚĆ tabel, a nie zgodność ze wzorem.

Realizacja (zgodnie z interpretacją orkiestratora): tabele wartości w `rust-port/engine/data/derived/*.json`, osadzone w silniku przez `include_str!` (`src/data/derived.rs`). Silnik czyta liczby z tabeli i nie mnoży niczego w czasie gry.

Zakres tej rundy: **koszty surowcowe** (rekrutacja: `Surowiec` + kon; utrzymanie surowcowe jednostek; koszt surowcowy budynków i ich utrzymanie surowcowe). Pozostałe mnożniki (złoto, Praca, żywność, badania, magazyn) są zinwentaryzowane w sekcji 2 z klasyfikacją (a)/(b) i oznaczone jako follow-up (P3-19b), zgodnie z priorytetem dispatchu. Nie są to ukryte pominięcia: każdy wiersz ma status.

## 1. Baseline PRZED zmianami (ZMIERZONO, surowe logi w załączniku A)

- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets --offline -- -D warnings`: EXIT=0
- `cargo test --offline --no-fail-fast`: 324 passed, 0 failed, EXIT=0 (zgodnie z oczekiwaniem dispatchu: 324)

## 2. INWENTARZ mnożników i współczynników weba (`edb8fb56`)

Metoda: `git grep -n -I -E '<wzorce>' edb8fb56 -- gra/src/game/*.ts gra/src/*.ts gra/src/ui/*.ts` (pliki `.ts`, z `-I` żeby pominąć binaria), potem czytanie wskazanych funkcji (`git show edb8fb56:<ścieżka> | cat -n`). Klasa: **(a)** STAŁA = zależy tylko od danych wiersza / epoki / kategorii, da się rozwinąć do liczby; **(b)** DYNAMICZNA = zależy od stanu gry w czasie wykonania (trudność, cywilizacja, tempo, terytorium, liczba miast, stan magazynu), nie da się rozwinąć bez enumeracji stanów.
Status: ROZWINIĘTE (w tej rundzie) / NIEROZWINIĘTE (follow-up P3-19b) / NIE_ZMIERZONO.

| # | Mnożnik / współczynnik | Plik:linia (edb8fb56) | Wzór | Rust w HEAD `d3a73641` | Klasa | Status |
|---|---|---|---|---|---|---|
| 1 | `epochCostMultiplier`: Kamień ×1, Brąz ×2, Żelazo ×4 (≥3 → ×4) | `gra/src/game/building-stock-cost.ts:28-57` | m(Epoka) | brak mnożenia; literał JSON | a | ROZWINIĘTE (stock i utrzymanie jednostek) |
| 2 | `scaleCostByEpoch`: `max(1, round(cost·m))`, zero → zero | `building-stock-cost.ts:60-67` | — | — | a | ROZWINIĘTE |
| 3 | Dopłata koni `MOUNT_UNIT_HORSE_STOCK_COST = 25` → klucz `kon`, dla `Typ == Mount` oprócz `Rydwan (woły)`; skalowana epoką | `building-stock-cost.ts:368-371, 383-390, 415-417` | kon += scaleCostByEpoch(25, Epoka) | brak `kon` (HEAD: brak kolumny w JSON) | a | ROZWINIĘTE. Uwaga: komentarz `:382` i `:398-399` mówi „+5 Koni”, a stała w kodzie to 25; komentarz `:362-367` („×5, było 5”) zgadza się z 25 = 5×5. Przyjęto **25** (wartość w kodzie). Do potwierdzenia przez właściciela (sekcja 9). |
| 4 | `unitResourceUpkeep`: `Utrzymanie surowiec (ilość)` × m(Epoka), bez dopłaty koni | `gra/src/game/economy-upkeep.ts:784-797` | scaleCostByEpoch | `resource_upkeep` = literał JSON | a | ROZWINIĘTE |
| 5 | FALA2 ×2 dla `koszt_surowce` budynków: `scaleStockCostRecord` = `max(1, round(v·2))` | `gra/src/game/r-stawki-strojenie.ts:9, 36-47`; `building-stock-cost.ts:89` | ×2 | literał = JSON bez ×2 | a | ROZWINIĘTE |
| 6 | `buildingEraCostMultiplier` (`epokaWejscia`): 1 / 2 / ×4 dla ≥3, zastosowany po FALA2 | `building-stock-cost.ts:74-81, 84-98` | m(era) | literał JSON | a | ROZWINIĘTE |
| 7 | Utrzymanie surowcowe budynku: N = 5 na każdy typ z `koszt_surowce` | `gra/src/game/economy-upkeep.ts:679, 686-698` | 5 per typ | brak | a | ROZWINIĘTE (`utrzymanie_surowcowe_na_ture`) |
| 8 | Praca budynku (`itemCost` budynek): `round(kosztBudowy + przyrost·(lvl−1)) × buildingEraCostMultiplier` | `gra/src/game/production.ts:312-334` | m(era) × f(level) | `base_work`/`work_increment` = literał JSON | a (per poziom) | NIEROZWINIĘTE → P3-19b |
| 9 | `buildingWorkCost`: `GLOBAL_BUILDING_PROD_MULT 0.25` × `R_STAWKI_KOSZT_MULT 2` × `R_STAWKI_FALA2_MULT 2` (efekt 1.0 względem JSON), potem tempo (b), ulga cywilizacji (b), trudność (b) | `production.ts:504-529` (stała :511) | mieszana | brak | mieszana | NIEROZWINIĘTE → P3-19b (część statyczna); części (b) pozostają funkcją |
| 10 | Koszt zakupu jednostki w złocie: `scaleCostByEpoch(unitCostFromDef, Epoka)` → `unitMoneyCost` (ulga cywilizacji, tempo, trudność) | `production.ts:265-289` (`unitCostFromDef`), `:338`, `:2133-2140` (`unitPurchaseCost`), `:535` (`unitMoneyCost`) | a (epoka) × b | `gold_cost` = literał JSON (bez epoki) | mieszana | NIEROZWINIĘTE → P3-19b. Gold NIE zmieniono w tej rundzie (świadoma decyzja zakresu). |
| 11 | Utrzymanie złota jednostki: `unitUpkeep` ×4 (FALA1×FALA2) na tabeli `scaleCostByEpoch(upkeep, Epoka)` | `economy-upkeep.ts:962-977` (×4 w :976), `:1000-1023` (skala w :1020) | a | `gold_upkeep` = literał JSON | a | NIEROZWINIĘTE → P3-19b (wymaga ustalenia ścieżki `DEFAULT_UNIT_UPKEEP_BY_CATEGORY`) |
| 12 | Utrzymanie złota budynku: `floor(floor(raw·2)·m(era))`, `raw` wg poziomu | `economy-upkeep.ts:640-656` | a (per poziom) | brak | a | NIEROZWINIĘTE → P3-19b |
| 13 | Żywność wojska: `scaleCostByEpoch(food, Epoka)` (`:1088`), ×4 FALA1×FALA2 (`:1073`), mnożnik terytorium (`:1067-1069`), ratio obozu (`:1062-1064`) | `economy-upkeep.ts:1040-1095` | a + b (terytorium, obóz) | brak | mieszana | NIEROZWINIĘTE → P3-19b; części (b) pozostają funkcją |
| 14 | `R_STAWKI_KOSZT_MULT = 2` (współdzielony): Praca budynków (`production.ts:526`), racje ludności (`population-growth-v85.ts:191`), koszt badań (`difficulty-cost.ts:41`) | `r-stawki-strojenie.ts:6`; wskazane użycia | a | brak | a | NIEROZWINIĘTE (poza stock) |
| 15 | Koszt badań: tempo (b) × ×2 (`GLOBAL_RESEARCH_COST_MULT`) × ×2 dla Brązu/Żelaza (`isResearchEraFala2Extra`) × trudność (b) | `difficulty-cost.ts:38-41, 86-100` | mieszana | brak | mieszana | NIEROZWINIĘTE → P3-19b |
| 16 | `scaleImprovementWorkCost` ×2 (Praca ulepszeń terenu) | `r-stawki-strojenie.ts:50-53`; `terrain-improvements.ts:104` | a | brak | a | NIEROZWINIĘTE (Praca, nie surowiec) |
| 17 | `scaledWonderWorkCost` / `scaledWonderFoodCost` ×2 (cuda) | `r-stawki-strojenie.ts:56-63`; `main.ts:3691, 3716, 4356, 4462` | a | brak | a | NIEROZWINIĘTE |
| 18 | Cap magazynu państwa: `DEFAULT_OWNER_STORAGE_PARAMS` 50000 / 500 (skala ×5), `magazynEraMultiplier = 2^(era−1)` | `economy-upkeep.ts:374-377, 392-395` | a | brak | a | NIEROZWINIĘTE (cap, nie koszt) |
| 19 | Stawka utrzymania ludności `citizen-resource-upkeep` (`PRZYWRÓCONA 1,0`, skala ×5) | `gra/src/game/citizen-resource-upkeep.ts:131` (i pokrewne) | a | `citizen-resource-upkeep.json` | a | NIE_ZMIERZONO (nie rozwijano; dane JSON) |
| 20 | Przepustowość konwerterów `throughputFallback` ×5 | `gra/src/game/converters.ts:68` | a | — | a | NIE_ZMIERZONO (produkcja, nie koszt) |
| 21 | Bramki Spichlerz I/II (×5 w komentarzach `building-resource-gate.ts:325-330`) | `building-resource-gate.ts:325-330` | a | — | a | NIE_ZMIERZONO |
| 22 | Dyplomacja: wartości PN jednostek (`diplomacy.rs:1842-1905`, rozjazd ×2 wg P3-17), cennik ×5 (`diplomacy-value-catalog.ts:284-301`) | `gra/src/game/diplomacy-value-catalog.ts`; Rust `src/domain/diplomacy.rs` | a | literały Rust | a | NIE_ZMIERZONO (poza zakresem; `diplomacy.rs` jest poza allowlistą P3-19) |
| 23 | Skala ×5 danych (P1-16D): wartości JSON już przeskalowane w `units.json` / `buildings.json` / `econ-params.json` | dane `gra/data/*.json` | a | dane JSON (identyczne z pinem) | a | ZWERYFIKOWANE jako dane: `units.json` i `buildings.json` w `rust-port/engine/data/` są bajtowo równe pinowi `edb8fb56` (`cmp`) |
| 24 | Dynamiczne: `applyDifficultyCostMultiplier` (trudność), `applyTempoKoszt` (tempo gry), `buildingCostAfterCivDiscount` (ulga cywilizacji), `applyBuildingCostPace` (tempo kreatora), `unitMoneyCost` (civBonusy, pace, owner), mnożnik terytorium i obozu (żywność), liczba miast/dostępność magazynu | `difficulty-cost.ts`, `production.ts:514-535`, `economy-upkeep.ts:1062-1069` | b | brak | b | NIE DA SIĘ rozwinąć bez enumeracji stanów → sekcja 8 |

Wniosek inwentarza: pozycje (a) dotyczące **kosztów surowcowych** (1-7) są rozwinięte w tej rundzie. Pozycje (a) dotyczące Pracy, złota, żywności, badań i magazynu (8-18) wymagają osobnego tematu P3-19b. Pozycje (b) są listowane w sekcji 8.

### 2a. Komendy `git grep` użyte do inwentarza (wklejone, edb8fb56)

```text
git grep -n -I -E 'epochCostMultiplier|scaleCostByEpoch|buildingEraCostMultiplier|R_STAWKI|MOUNT_UNIT|unitResourceUpkeep|buildingResourceUpkeep|scaleImprovementWorkCost|scaledWonderWorkCost' edb8fb56 -- 'gra/src/*.ts' 'gra/src/**/*.ts'
git grep -n -I -E 'unitResourceUpkeep\(|unitStockCost\(|buildingStockCost\(' edb8fb56 -- 'gra/src/*.ts' 'gra/src/**/*.ts'
git grep -n -I -i -E 'ekonomia.?5|5x|SKALA-5X' edb8fb56 -- 'gra/src/*.ts' 'gra/src/**/*.ts' 'gra/src/*/*.ts'
```

Wynik (skrót kluczowych trafień; pełne wyjścia dostępne w sesji): `building-stock-cost.ts` :28,43,60,66,74,84,89,90,368-369,371,383,402,412,415-417; `economy-upkeep.ts` :654-655,794,835,856,878,901,976,1020,1073,1088; `production.ts` :84,312,334,338,507-526,2137,2233; `r-stawki-strojenie.ts` :6,9,12,36,43,50,56; `terrain-improvements.ts` :9,104; `difficulty-cost.ts` :29-41,95-98; `population-growth-v85.ts` :21,191; `main.ts` :1280,3691,3716,4023,4140,4205,4356,4462,8237,8240,8293,15283,... (użycia helperów, bez zmian mnożników).

## 3. ROZWINIĘCIE (klasa a, zakres tej rundy) — reguły i pochodzenie

Źródła liczb: `rust-port/engine/data/units.json` i `buildings.json` są bajtowo równe `edb8fb56:gra/data/*.json` (`cmp` OK, zob. wiersz 23). Dane bazowe NIE zostały zmienione.

Pliki wynikowe (NOWE):
- `rust-port/engine/data/derived/unit-stock-costs.json`: 75 wierszy (jeden na jednostkę z `units.json`), pola `jednostka`, `epoka`, `surowiec` (koszt rekrutacji, łącznie z `kon`), `utrzymanie_surowiec`, `baza` (wartości źródłowe z `units.json` + `dodatek_kon_baza`), `meta` (status BOOTSTRAP, reguła weba, pochodzenie).
- `rust-port/engine/data/derived/building-stock-costs.json`: 42 wiersze (jeden na budynek z `buildings.json`), pola `budynek`, `epokaWejscia`, `koszt_surowce`, `utrzymanie_surowcowe_na_ture`, `baza_koszt_surowce`, `meta`.

Reguła odwzorowana literalnie w generatorze (sekcja 5, `gen-web.mjs`):
- Jednostka: `surowiec[klucz(Surowiec)] = scaleCostByEpoch(Surowiec (ilość), Epoka)`, klucz = małe litery bez diakrytyków (`Brąz`→`braz`, `Żelazo`→`zelazo`, `Drewno`→`drewno`).
- Jednostka `Typ == Mount` i nazwa ≠ `Rydwan (woły)`: `surowiec["kon"] += scaleCostByEpoch(25, Epoka)`.
- Jednostka: `utrzymanie_surowiec[klucz(Utrzymanie surowiec)] = scaleCostByEpoch(Utrzymanie surowiec (ilość), Epoka)`.
- Budynek: `koszt_surowce = buildingStockCost(b)` = `max(1, round(v·2))` dla każdego `v > 0`, potem `max(1, round(x·m(epokaWejscia)))` gdzie m = 1 / 2 / 4 (era 1 / 2 / ≥3).
- Budynek: `utrzymanie_surowcowe_na_ture[k] = 5` dla każdego klucza `k` z `koszt_surowce` z wartością > 0.

Uwaga o semantyce (ważne dla właściciela): web NIE ma kosztów zależnych od aktualnej epoki gry. Mnożnik zależy od pola `Epoka` (jednostka) albo `epokaWejscia` (budynek) danego wiersza, czyli każda jednostka/budynek ma JEDNĄ stałą wartość. Tabela odwzorowuje to 1:1. Nie wprowadzono macierzy „jednostka × epoka gry”, bo web jej nie używa (zob. sekcja 9, pytanie 1).

Rozkład epok w danych: jednostki (75) Kamień 10 (×1), Brąz 40 (×2), Żelazo 25 (×4); budynki (42) wg `epokaWejscia`: 1 → 12, 2 → 15, 3 → 13, 4 → 2 (mnożnik ery 1 / 2 / 4 / 4); koszt surowcowy ma 41 budynków, `palac` nie ma kosztu.

## 4. RÓWNOWAŻNOŚĆ BOOTSTRAPU (jednorazowo, ZMIERZONO)

Dwa niezależne wyliczenia na tych samych danych wejściowych (pin `edb8fb56`):
- (A) `gen-web.mjs` (node v22.22.0): literalna kopia funkcji weba (TS→JS, bez zmiany logiki). To ono wygenerowało tabele.
- (B) `verify-indep.py` (python3 -I): niezależna implementacja opisanej reguły (bez kodu weba), porównanie wiersz po wierszu z tabelami.

Wynik generatora (A):
```text
units=75 buildings=42
```

Wynik porównania (B), surowy stdout:
```text
unit rows compared: 75 (stock+upkeep each)
building rows compared: 42 (stock+upkeep each)
discrepancies: 0
EXIT=0
```

Wniosek: 0 rozbieżności we wszystkich 75 wierszach jednostek i 42 wierszach budynków (stock i utrzymanie), zgodnie z kryterium „0 rozbieżności”.

## 5. Skrypty (zapisane w runs/, literalnie)

Plik: `dyspozycje/autobot/runs/R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1/gen-web.mjs` (uruchomienie: `node gen-web.mjs <units.json> <buildings.json> <outDir>`):

```js
// Literalna kopia logiki weba (edb8fb56), TS -> JS (usunięte tylko adnotacje typów).
// Źródła: gra/src/game/building-stock-cost.ts (l.28-67, 74-98, 368-420),
//         gra/src/game/r-stawki-strojenie.ts (l.6-47), gra/src/game/economy-upkeep.ts (l.784-797, 679-698).
import fs from 'node:fs';

const R_STAWKI_FALA2_MULT = 2; // r-stawki-strojenie.ts:9

// building-stock-cost.ts:28-57
export function epochCostMultiplier(epoch) {
  if (typeof epoch === 'number' && Number.isFinite(epoch)) {
    const ordinal = Math.floor(epoch);
    if (ordinal >= 3) return 4;
    if (ordinal >= 2) return 2;
    return 1;
  }
  if (typeof epoch !== 'string') return 1;
  const normalized = epoch
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return epochCostMultiplier(Number(normalized));
  }
  if (normalized === 'kamien' || normalized === 'stone' || normalized === '1') return 1;
  if (normalized === 'braz' || normalized === 'bronze' || normalized === '2') return 2;
  if (
    normalized === 'zelazo' ||
    normalized === 'zelazo+' ||
    normalized === 'iron' ||
    normalized === 'iron+' ||
    normalized === 'iron plus' ||
    normalized === 'steel' ||
    normalized === 'stal'
  ) return 4;
  return 1;
}

// building-stock-cost.ts:60-67
export function scaleCostByEpoch(cost, epoch) {
  if (!Number.isFinite(cost) || cost < 0) return 0;
  if (cost === 0) return 0;
  return Math.max(1, Math.round(cost * epochCostMultiplier(epoch)));
}

// building-stock-cost.ts:74-81
export function buildingEraCostMultiplier(epokaWejscia) {
  const era = typeof epokaWejscia === 'number' && Number.isFinite(epokaWejscia)
    ? Math.floor(epokaWejscia)
    : 1;
  if (era >= 3) return 4;
  if (era >= 2) return 2;
  return 1;
}

// r-stawki-strojenie.ts:36-47
export function scaleStockCostRecord(raw) {
  const out = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = Math.max(1, Math.round(v * R_STAWKI_FALA2_MULT));
    }
  }
  return out;
}

// building-stock-cost.ts:84-98
export function buildingStockCost(building) {
  const fala2Cost = scaleStockCostRecord(building?.koszt_surowce);
  const eraMultiplier = buildingEraCostMultiplier(building?.epokaWejscia);
  if (eraMultiplier === 1) return fala2Cost;
  const out = {};
  for (const [key, amount] of Object.entries(fala2Cost)) {
    out[key] = Math.max(1, Math.round(amount * eraMultiplier));
  }
  return out;
}

// building-stock-cost.ts:358-360
function stripDiacriticsLower(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

// building-stock-cost.ts:368-371
export const MOUNT_UNIT_HORSE_STOCK_COST = 25;
export const MOUNT_UNIT_HORSE_STOCK_KEY = 'kon';
export const MOUNT_HORSE_EXEMPT_UNIT = 'Rydwan (woły)';

// building-stock-cost.ts:383-390
export function unitRequiresMountHorseStock(unit) {
  if (!unit) return false;
  if ((unit.Typ ?? '').toString().trim() !== 'Mount') return false;
  const name = (unit.Jednostka ?? '').toString().trim();
  return name !== MOUNT_HORSE_EXEMPT_UNIT;
}

// building-stock-cost.ts:402-420
export function unitStockCost(unit) {
  const out = {};
  if (!unit) return out;
  const rawName = (unit.Surowiec ?? '').toString().trim();
  if (rawName && rawName !== '-') {
    const ilosc = unit['Surowiec (ilość)'];
    if (typeof ilosc === 'number' && Number.isFinite(ilosc) && ilosc > 0) {
      const key = stripDiacriticsLower(rawName);
      if (key) out[key] = scaleCostByEpoch(ilosc, unit.Epoka);
    }
  }
  if (unitRequiresMountHorseStock(unit)) {
    out[MOUNT_UNIT_HORSE_STOCK_KEY] =
      (out[MOUNT_UNIT_HORSE_STOCK_KEY] ?? 0) + scaleCostByEpoch(MOUNT_UNIT_HORSE_STOCK_COST, unit.Epoka);
  }
  return out;
}

// economy-upkeep.ts:784-797
export function unitResourceUpkeep(unitDef) {
  const out = {};
  if (!unitDef) return out;
  const rawName = (unitDef['Utrzymanie surowiec'] ?? '').toString().trim();
  if (!rawName || rawName === '-') return out;
  const ilosc = unitDef['Utrzymanie surowiec (ilość)'];
  if (typeof ilosc === 'number' && Number.isFinite(ilosc) && ilosc > 0) {
    const key = stripDiacriticsLower(rawName);
    if (key) out[key] = scaleCostByEpoch(ilosc, unitDef.Epoka);
  }
  return out;
}

// economy-upkeep.ts:679-698
export const BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE = 5;
export function buildingResourceUpkeep(building) {
  const raw = building?.koszt_surowce;
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Generator: wejście = kopie JSON z pinu edb8fb56 (identyczne z engine/data, cmp OK)
// argv: <units.json> <buildings.json> <outDir>
// ---------------------------------------------------------------------------
const [, , unitsPath, buildingsPath, outDir] = process.argv;
const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
const buildings = JSON.parse(fs.readFileSync(buildingsPath, 'utf8'));

const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

const unitRows = units.map((u) => {
  const stock = unitStockCost(u);
  const upkeep = unitResourceUpkeep(u);
  const konBase = unitRequiresMountHorseStock(u) ? MOUNT_UNIT_HORSE_STOCK_COST : 0;
  return {
    jednostka: u.Jednostka,
    epoka: u.Epoka,
    surowiec: sortKeys(stock),
    utrzymanie_surowiec: sortKeys(upkeep),
    baza: {
      surowiec: u.Surowiec ?? null,
      surowiec_ilosc: u['Surowiec (ilość)'],
      utrzymanie_surowiec: u['Utrzymanie surowiec'] ?? null,
      utrzymanie_surowiec_ilosc: u['Utrzymanie surowiec (ilość)'],
      dodatek_kon_baza: konBase,
    },
  };
});

const buildingRows = buildings.map((b) => {
  const stock = buildingStockCost(b);
  const upkeep = buildingResourceUpkeep(b);
  return {
    budynek: b.id,
    epokaWejscia: b.epokaWejscia,
    koszt_surowce: sortKeys(stock),
    utrzymanie_surowcowe_na_ture: sortKeys(upkeep),
    baza_koszt_surowce: b.koszt_surowce ? sortKeys(b.koszt_surowce) : {},
  };
});

const meta = (zrodlo, regula) => ({
  status: 'BOOTSTRAP: wartosci startowe rozwiniete z regul weba. Zrodlem prawdy do recznego balansu jest TA tabela (edytuj liczby, nie mnozniki). Tabela NIE jest porownywana ze wzorem przy buildzie.',
  zrodlo,
  regula_weba: regula,
  wygenerowano: 'R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1 (2026-10-21), generator: P3-19 sekcja 5',
  uwaga_epoka: 'Mnoznik epoki wynika z pola Epoka (jednostka) / epokaWejscia (budynek) danego wiersza, NIE z aktualnej epoki gry (web nie ma kosztow zaleznych od czasu).',
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/unit-stock-costs.json`, JSON.stringify({
  meta: meta('gra/data/units.json @ edb8fb56 (identyczny z rust-port/engine/data/units.json)',
    'building-stock-cost.ts unitStockCost (l.402-420; scaleCostByEpoch l.60-67; epochCostMultiplier l.28-57; MOUNT kon 25 l.368-369, 415-417); economy-upkeep.ts unitResourceUpkeep (l.784-797)'),
  wiersze: unitRows,
}, null, 2) + '\n');
fs.writeFileSync(`${outDir}/building-stock-costs.json`, JSON.stringify({
  meta: meta('gra/data/buildings.json @ edb8fb56 (identyczny z rust-port/engine/data/buildings.json)',
    'building-stock-cost.ts buildingStockCost (l.84-98) = r-stawki-strojenie.ts scaleStockCostRecord x2 (l.36-47), potem buildingEraCostMultiplier (l.74-81); economy-upkeep.ts buildingResourceUpkeep (l.686-698, N=5)'),
  wiersze: buildingRows,
}, null, 2) + '\n');
console.log(`units=${unitRows.length} buildings=${buildingRows.length}`);
```

Plik: `dyspozycje/autobot/runs/R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1/verify-indep.py` (uruchomienie: `python3 -I verify-indep.py <units.json> <buildings.json> <unit-stock-costs.json> <building-stock-costs.json>`):

```python
# Niezależne wyliczenie (BEZ kodu weba, wg opisu reguł z dokumentu P3-19 §2):
#  - jednostka: Surowiec (ilość) x mnożnik epoki (Kamień 1, Brąz 2, Żelazo 4) -> max(1, round)
#  - jednostka: Mount (oprócz 'Rydwan (woły)') -> + kon: 25 x mnożnik epoki -> max(1, round)
#  - jednostka: Utrzymanie surowiec (ilość) x mnożnik epoki -> max(1, round)
#  - budynek: koszt_surowce x2 (FALA2) -> max(1, round), potem x mnożnik ery (1 / 2 / 4 dla epokaWejscia 1 / 2 / >=3)
#  - budynek: utrzymanie surowcowe = 5 na każdy klucz koszt_surowce (wartość > 0)
# Argumenty: units.json buildings.json unit-stock-costs.json building-stock-costs.json
import json
import sys

units_path, buildings_path, utab_path, btab_path = sys.argv[1:5]
units = json.load(open(units_path, encoding="utf-8"))
buildings = json.load(open(buildings_path, encoding="utf-8"))
utab = json.load(open(utab_path, encoding="utf-8"))["wiersze"]
btab = json.load(open(btab_path, encoding="utf-8"))["wiersze"]

EPOCH_MULT = {"Kamień": 1, "Brąz": 2, "Żelazo": 4}
ERA_MULT = {1: 1, 2: 2, 3: 4, 4: 4}
KEY = {"Drewno": "drewno", "Brąz": "braz", "Żelazo": "zelazo", "Kamień": "kamien"}


def rnd(x):
    # Math.round dla dodatnich: floor(x + 0.5)
    return int(x + 0.5)


def scale(cost, mult):
    if cost <= 0:
        return 0
    return max(1, rnd(cost * mult))


disc = []
exp_u = {}
for u in units:
    name = u["Jednostka"]
    m = EPOCH_MULT[u["Epoka"]]
    exp = {}
    if u.get("Surowiec") not in (None, "-") and u.get("Surowiec (ilość)", 0) > 0:
        exp[KEY[u["Surowiec"]]] = scale(u["Surowiec (ilość)"], m)
    if u.get("Typ") == "Mount" and name != "Rydwan (woły)":
        exp["kon"] = exp.get("kon", 0) + scale(25, m)
    exp_u[name] = exp
    up = {}
    if u.get("Utrzymanie surowiec") not in (None, "-") and u.get("Utrzymanie surowiec (ilość)", 0) > 0:
        up[KEY[u["Utrzymanie surowiec"]]] = scale(u["Utrzymanie surowiec (ilość)"], m)
    exp_u[name + "\x00up"] = up

rows_u = {r["jednostka"]: r for r in utab}
if len(rows_u) != len(utab):
    disc.append("unit table: duplicate jednostka keys")
if set(rows_u) != {u["Jednostka"] for u in units}:
    disc.append("unit table: key set differs from units.json")
for name in exp_u:
    if "\x00" in name:
        continue
    r = rows_u.get(name)
    if r is None:
        continue
    if r["surowiec"] != exp_u[name]:
        disc.append(f"UNIT STOCK {name}: table={r['surowiec']} indep={exp_u[name]}")
    if r["utrzymanie_surowiec"] != exp_u[name + "\x00up"]:
        disc.append(f"UNIT UPKEEP {name}: table={r['utrzymanie_surowiec']} indep={exp_u[name + chr(0) + 'up']}")

exp_b = {}
for b in buildings:
    mult = ERA_MULT[max(1, int(b["epokaWejscia"]))]
    st = {}
    for k, v in (b.get("koszt_surowce") or {}).items():
        if v > 0:
            st[k] = max(1, rnd(v * 2))
    st = {k: max(1, rnd(v * mult)) for k, v in st.items()}
    exp_b[b["id"]] = (st, {k: 5 for k, v in (b.get("koszt_surowce") or {}).items() if v > 0})

rows_b = {r["budynek"]: r for r in btab}
if set(rows_b) != set(exp_b):
    disc.append("building table: key set differs from buildings.json")
for bid, (st, up) in exp_b.items():
    r = rows_b.get(bid)
    if r is None:
        continue
    if r["koszt_surowce"] != st:
        disc.append(f"BUILDING STOCK {bid}: table={r['koszt_surowce']} indep={st}")
    if r["utrzymanie_surowcowe_na_ture"] != up:
        disc.append(f"BUILDING UPKEEP {bid}: table={r['utrzymanie_surowcowe_na_ture']} indep={up}")

print(f"unit rows compared: {len(rows_u)} (stock+upkeep each)")
print(f"building rows compared: {len(rows_b)} (stock+upkeep each)")
print(f"discrepancies: {len(disc)}")
for d in disc:
    print(d)
```

## 6. TABELA BYŁO / JEST (zmienione wartości względem obecnego stanu)

Było: dla jednostek = `units.json` (JSON bazowy; ta sama wartość była w HEAD `canonical_recruitment_costs`, P3.17). Dla budynków = literały z HEAD `building_costs.rs` (skrypt sprawdził, że są równe JSON bazowemu dla wszystkich 42 budynków). Jest = tabele `data/derived/`.

Dowód z weba dla każdej zmiany: wzory w sekcji 3 (`building-stock-cost.ts:28-57, 60-67, 74-98, 368-420`; `r-stawki-strojenie.ts:9, 36-47`; `economy-upkeep.ts:679, 686-698, 784-797`).

### Tabela było/jest: jednostki (surowiec rekrutacji, koń, utrzymanie surowcowe)

Zmienione wiersze (tylko te, w których cokolwiek się zmieniło). Epoka = pole `Epoka` z `units.json`.

| Jednostka | Epoka | Surowiec było (JSON) | Surowiec jest (tabela) | Utrzymanie było | Utrzymanie jest |
|---|---|---|---|---|---|
| Procarz | Brąz | drewno 25 | drewno 50 | drewno 5 | drewno 10 |
| Włócznik | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Wojownik z mieczem i tarczą | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Rydwan (woły) | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Konnica | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Galera | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Falanga | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Hieros Lochos (Święty Zastęp) | Żelazo | zelazo 38 | zelazo 152 | zelazo 8 | zelazo 32 |
| Hastati | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Triari | Żelazo | zelazo 38 | zelazo 152 | zelazo 8 | zelazo 32 |
| Jeździec chiński | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Hu Ben Wei (Gwardia Tygrysa) | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Impi | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| uThulwana (Białe Tarcze) | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Wojownik z toporem | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Procarz (Huaracoc) | Brąz | drewno 25 | drewno 50 | drewno 5 | drewno 10 |
| Królewska Gwardia | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Rydwan konny | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Rydwan egipski | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Wojownik z khopesh | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Medżaj (Gwardia Faraona) | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Łucznik nubijski | Brąz | drewno 25 | drewno 50 | drewno 5 | drewno 10 |
| Rydwan sumeryjski | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Włócznik sumeryjski | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Gwardia Królewska Sumeru | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Wojownik mykeński | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Rydwan mykeński | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Wojownik Sherden | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Halabardnik Shang | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Rydwan Shang | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Łucznik akadyjski | Brąz | drewno 25 | drewno 50 | drewno 5 | drewno 10 |
| Gaesatae | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Soldurii | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Rydwan celtycki | Żelazo | zelazo 25 | kon 100, zelazo 100 | zelazo 5 | zelazo 20 |
| Wojownik germański | Żelazo | zelazo 38 | zelazo 152 | zelazo 8 | zelazo 32 |
| Berserker germański | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Taran okuty | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Katapulta | Żelazo | zelazo 38 | zelazo 152 | zelazo 8 | zelazo 32 |
| Wieża oblężnicza | Brąz | braz 38 | braz 76 | braz 8 | braz 16 |
| Wojownik tyrreński | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Wojownik szekelesz | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Konnica lancowa asyryjska | Żelazo | zelazo 25 | kon 100, zelazo 100 | zelazo 5 | zelazo 20 |
| Konnica łucznicza asyryjska | Żelazo | zelazo 25 | kon 100, zelazo 100 | zelazo 5 | zelazo 20 |
| Łucznik asyryjski | Brąz | drewno 25 | drewno 50 | drewno 5 | drewno 10 |
| Drużynnik | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Jeździec z oszczepami | Żelazo | zelazo 25 | kon 100, zelazo 100 | zelazo 5 | zelazo 20 |
| Strażnik bram Harappy | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Piechota induska | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Garnizon Harappy | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Rydwan Kapadokijski | Brąz | braz 25 | braz 50, kon 50 | braz 5 | braz 10 |
| Piechota hetycka | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Gwardia hetycka | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Gwardia Ishtar | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Wojownik babiloński | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Piechota neobabilońska | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Tyrski miecznik | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Wojownik fenicki | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Gwardia Tyreńska | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Thorakites | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Evocati | Żelazo | zelazo 38 | zelazo 152 | zelazo 8 | zelazo 32 |
| iButho z iklwa | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Gwardzista z champi | Brąz | braz 25 | braz 50 | braz 5 | braz 10 |
| Wojownik z żelaznym khopesh | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Mur tarcz (Sargonid) | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |
| Miecznik galijski | Żelazo | zelazo 25 | zelazo 100 | zelazo 5 | zelazo 20 |

Wiersze jednostek: zmienione 65 z 75; bez zmiany 10 (wszystkie 10 jednostek epoki Kamień, mnożnik x1: brak zmiany; pozostałe 65 zmienia mnożnik Brąz x2 / Żelazo x4 lub dopłata koni).

### Tabela było/jest: budynki (koszt_surowce, jednorazowo przy budowie)

| Budynek | Epoka wejścia | Było (Rust HEAD = JSON) | Jest (tabela) |
|---|---|---|---|
| stolarnia | 1 | drewno 25 | drewno 50 |
| kamieniarski | 1 | drewno 30 | drewno 60 |
| kuznia | 2 | drewno 30, kamien 30 | drewno 120, kamien 120 |
| odlewnia_brazu | 2 | drewno 30, kamien 40 | drewno 120, kamien 160 |
| odlewnia_zelaza | 3 | cegla 50, drewno 40 | cegla 400, drewno 320 |
| wielka_odlewnia | 4 | cegla 70, drewno 60 | cegla 560, drewno 480 |
| targowisko | 1 | drewno 30 | drewno 60 |
| port | 2 | drewno 60, kamien 30 | drewno 240, kamien 120 |
| port_wielki | 3 | drewno 60, kamien 50 | drewno 480, kamien 400 |
| spichlerz | 1 | drewno 40 | drewno 80 |
| spichlerz_ii | 2 | drewno 40, kamien 50 | drewno 160, kamien 200 |
| garncarnia | 1 | drewno 30 | drewno 60 |
| cegielnia | 2 | drewno 30, kamien 30 | drewno 120, kamien 120 |
| kamienne_kregi | 1 | kamien 40 | kamien 80 |
| swiatynia | 2 | drewno 30, kamien 40 | drewno 120, kamien 160 |
| biblioteka | 2 | drewno 30, kamien 30 | drewno 120, kamien 120 |
| studnia | 1 | drewno 25 | drewno 50 |
| akwedukt | 2 | drewno 30, kamien 60 | drewno 120, kamien 240 |
| mennica | 2 | drewno 30, kamien 40 | drewno 120, kamien 160 |
| palisada | 1 | drewno 60 | drewno 120 |
| mury | 2 | drewno 40, kamien 80 | drewno 160, kamien 320 |
| koszary | 2 | drewno 40, kamien 40 | drewno 160, kamien 160 |
| magazyn | 2 | drewno 50, kamien 30 | drewno 200, kamien 120 |
| stela | 1 | kamien 30 | kamien 60 |
| palac_ii | 2 | drewno 50, kamien 50 | drewno 200, kamien 200 |
| palac_iii | 3 | cegla 70, drewno 50 | cegla 560, drewno 400 |
| kuznia_zelaza | 3 | cegla 50, drewno 40 | cegla 400, drewno 320 |
| wielka_kuznia | 4 | cegla 80, drewno 60 | cegla 640, drewno 480 |
| fort | 3 | drewno 50, kamien 100 | drewno 400, kamien 800 |
| baszta | 3 | drewno 50, kamien 100 | drewno 400, kamien 800 |
| warsztat_oblezniczy | 3 | drewno 50, kamien 50 | drewno 400, kamien 400 |
| akademia | 3 | cegla 70, drewno 40 | cegla 560, drewno 320 |
| teatr | 3 | cegla 50, drewno 40 | cegla 400, drewno 320 |
| sad | 3 | cegla 50, drewno 30 | cegla 400, drewno 240 |
| dom_starszyzny | 1 | drewno 30 | drewno 60 |
| dwor_zarzadcy | 2 | drewno 30, kamien 30 | drewno 120, kamien 120 |
| pretorium | 3 | cegla 50, drewno 40 | cegla 400, drewno 320 |
| trybunal | 2 | drewno 30, kamien 40 | drewno 120, kamien 160 |
| garnizon | 1 | drewno 30 | drewno 60 |
| laznia_publiczna | 3 | cegla 60, drewno 40 | cegla 480, drewno 320 |
| akademia_wojskowa | 3 | cegla 70, drewno 50 | cegla 560, drewno 400 |

Wiersze budynków: zmienione 41 z 42; bez zmiany 1.

Uwaga o `Konnica` i `Rydwan (woły)`: obie są `Typ == Mount`, ale tylko Konnica dostaje `kon` (wyjątek `Rydwan (woły)` z `building-stock-cost.ts:371`).

## 7. ZMIANY W KODZIE I TESTACH (allowlista)

Kod (silnik):
- `rust-port/engine/data/derived/unit-stock-costs.json` (NOWY), `building-stock-costs.json` (NOWY): tabele wartości.
- `rust-port/engine/src/data/derived.rs` (NOWY): `include_str!` obu tabel, typy serde (`deny_unknown_fields`), `parse_unit_stock_costs()`, `parse_building_stock_costs()`.
- `rust-port/engine/src/data/mod.rs`: jedna linia `pub mod derived;`.
- `rust-port/engine/src/domain/recruitment.rs`: `canonical_recruitment_costs()` czyta `stock_cost` i `resource_upkeep` z wiersza tabeli; `gold_cost`, `gold_upkeep`, `unit_type`, `super_unit` dalej z `units.json` bez zmian. Usunięto `resource_key` (martwy po zmianie). Publiczne sygnatury bez zmian.
- `rust-port/engine/src/domain/building_costs.rs`: `canonical_building_costs()` zachowuje literalne pary `(kosztBudowy, przyrostKosztu)` (Praca poza zakresem), a `resource_cost` pochodzi z tabeli. Publiczne sygnatury bez zmian.
- `lib.rs`: BEZ zmian (nie było potrzeby nowych eksportów).

Testy:
- `rust-port/engine/tests/recruitment.rs`: Konnica `braz 25→50`, `kon None→50`, utrzymanie `braz 5→10`; Rydwan (woły) `braz 50`, `kon None` (wyjątek); Włócznik próg `braz 25→50` (`can_afford` 50 true, 49 false); łączne utrzymanie `braz 5→10` (Włócznik), `drewno 6` bez zmian; test „75 wierszy = units.json” zamieniony na test OKABLOWANIA (stock/upkeep == wiersz tabeli; złoto/typ/super nadal z `units.json`). Usunięto `domain_key` (martwy).
- `rust-port/engine/tests/building_costs.rs`: `palac_iii` drewno `50→400`, cegla `70→560` (JSON 50/70 ×2 FALA2 ×4 era 3).
- `rust-port/engine/tests/parity_suite.rs`: `stolarnia` drewno `25→50` (JSON 25 ×2 FALA2, era 1). Test „vectors” był Rust-autorski (komentarz w teście wskazuje `units.json`), nie nagraniem z weba; zmiana jawnie uzasadniona w komentarzu. Wektor Wojownika (13 / 57→44) bez zmian: Kamień ×1.
- `rust-port/engine/tests/derived_values.rs` (NOWY, 9 testów): KSZTAŁT i KOMPLETNOŚĆ: 75 jednostek 1:1 z `units.json`, epoka zgodna z `units.json`, klucze zasobów (`Surowiec` + `kon` dla Mount oprócz Rydwan), klucze utrzymania, wartości > 0 (u32 z definicji), pochodzenie `baza` = kolumny `units.json`; 42 budynki 1:1 z listą kanoniczną, klucze znane, klucze `koszt_surowce` = klucze `baza_koszt_surowce`, `palac` bez kosztu; okablowanie domeny = tabela. Testy NIE porównują liczb ze wzorem mnożnikowym.

Nie zmieniano: `data/*.json` (bazowe), `gra/**`, `rust-port/renderer/**`, `Cargo.toml`, `bridge.rs`, `playable.rs`, `src/domain/{diplomacy,improvements,map_generator,ai_turn,trade,barbarians}.rs`, `WERSJE.md`, `Cargo.lock` (nie commitowany).

## 8. DOWODY (kod nie mnoży współczynników w czasie gry)

Polecenie: `git grep` w worktree po zmianach na plikach domeny i danych (wynik: tylko komentarze, zero kodu mnożącego):

```text
$ grep -n -E '\* *[0-9]|/ *100|multiplier|mult|FALA|MOUNT|Epoka|epoch|era' src/domain/recruitment.rs src/domain/building_costs.rs src/data/derived.rs
src/domain/recruitment.rs:13:/// Stock cost and upkeep are deliberately separate: upkeep is charged by the
src/domain/recruitment.rs:214:///   bootstrap of the web rules (epoch factor, mount horse surcharge `kon`); the engine
src/domain/recruitment.rs:215:///   applies no multiplier at runtime. The owner balances by editing those numbers.
src/domain/building_costs.rs:110:    // Work (Praca) columns stay the literal `kosztBudowy` / `przyrostKosztu` pairs
src/domain/building_costs.rs:111:    // (P3-19 scope is stock costs only; Work multipliers are a separate follow-up).
src/domain/building_costs.rs:113:    // `data/derived/building-stock-costs.json`; no multiplier is applied at runtime.
src/domain/building_costs.rs:191:/// The remaining balances after an immutable, transactional spend operation.
```

(Jedyne trafienia to komentarze. Kod domeny nie zawiera mnożenia przez współczynnik epoki, dopłaty koni ani FALA2.)

## 9. DYNAMICZNE (klasa b) — NIE rozwinięte, do decyzji właściciela

| Mnożnik / zależność | Gdzie (edb8fb56) | Od czego zależy | Rekomendacja |
|---|---|---|---|
| Ulga cywilizacji (`buildingCostAfterCivDiscount`, `civBonusy`) | `production.ts:521`, `:535` | cywilizacja gracza/AI | zostawić jako funkcję z jawnym parametrem `civ`; tabela = wartość bazowa |
| Tempo kreatora (`applyBuildingCostPace`, `applyTempoKoszt`) | `production.ts:522`; `difficulty-cost.ts:94` | ustawienie gry | funkcja z jawnym parametrem `pace` |
| Trudność (`applyDifficultyCostMultiplier`) | `difficulty-cost.ts:100`; `production.ts:528` | poziom trudności i właściciel | funkcja z jawnym parametrem `difficulty` (lub enumeracja 3 poziomów, jeśli właściciel woli tabele) |
| Mnożnik terytorium i obozu (żywność) | `economy-upkeep.ts:1062-1069` | położenie jednostki (własne / obce terytorium, obóz) | funkcja; enumeracja 2 stanów jest możliwa |
| Dostępność magazynu państwa / liczba miast | `economy-upkeep.ts:374-415`, `ownerResourceStockAll` | stan gry | nie dotyczy kosztu wiersza; zostaje logiką stanu |

Pytania do właściciela (wymagają decyzji, nie zgadujemy):
1. Semantyka epoki: web skaluje wg epoki **wiersza** (jednostki/budynku), nie wg aktualnej epoki gry. Tabela odwzorowuje to 1:1. Czy zostawiamy tak (rekomendacja Operatora: tak), czy chcesz macierz „jednostka × epoka gry” (to byłoby nowe zachowanie, którego web nie ma)?
2. Dopłata koni: kod web = 25 (`building-stock-cost.ts:368`), komentarz = „+5 Koni” (`:382`, `:398-399`). Tabela przyjmuje 25. Potwierdź.
3. Koszty surowcowe budynków: web stosuje ×2 (FALA2) na KAŻDY budynek, niezależnie od epoki, plus era. Tabela = to. Potwierdź, że to docelowa wartość startowa (dotyczy 41 budynków).
4. Zakres: czy P3-19b (złoto, Praca, utrzymanie złota, żywność, badania, magazyn — pozycje 8-18) ma iść jako kolejny temat, czy w tym temacie?

## 10. Zgodność z kryteriami dispatchu

- Inwentarz kompletny (a/b): TAK dla pozycji 1-24 (pozycje 19-22 jako NIE_ZMIERZONO, jawnie).
- Tabele rozwiniętych wartości dla kosztów rekrutacji i budynków (a, surowce): TAK.
- Równoważność bootstrapu jednorazowo, 0 rozbieżności: TAK (sekcja 4).
- Stałe testy kształtu i kompletności, bez zgodności ze wzorem: TAK (`tests/derived_values.rs`).
- Kod silnika nie mnoży współczynników w czasie gry: TAK (sekcja 8).
- Tabela było/jest z dowodem z weba: TAK (sekcja 6).
- Lista dynamicznych do decyzji właściciela: TAK (sekcja 9).
- `fmt` / `clippy -D warnings` / `test` EXIT=0 z liczbą testów ≥ 324: fmt EXIT=0, clippy EXIT=0, test 333 passed (324 + 9 nowych), EXIT=0 (surowe logi w załącznikach B i C).

---

## Załącznik A — BASELINE przed zmianami (surowe, EXIT z echo)

### A1 fmt
```text
EXIT=0
```

### A2 clippy -D warnings
```text
     Locking 17 packages to latest compatible versions
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
   Compiling serde v1.0.229
   Compiling serde_json v1.0.154
    Checking once_cell v1.21.4
    Checking tracing-core v0.1.36
    Checking pin-project-lite v0.2.17
    Checking itoa v1.0.18
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_1c1a1f14-cd9-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 36.85s
EXIT=0
```

### A3 cargo test --offline --no-fail-fast
```text
   Compiling serde_core v1.0.229
   Compiling once_cell v1.21.4
   Compiling zmij v1.0.23
   Compiling memchr v2.8.3
   Compiling tracing-core v0.1.36
   Compiling itoa v1.0.18
   Compiling pin-project-lite v0.2.17
   Compiling tracing v0.1.44
   Compiling serde_json v1.0.154
   Compiling serde v1.0.229
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_1c1a1f14-cd9-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 44.84s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.82s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test wonders_json_parses ... ok
test buildings_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test roundtrip_covers_all_29_data_files ... ok
test rt_auto_battle_params ... ok
test rt_ai_params ... ok
test rt_citizen_resource_upkeep ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_civ_ai ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_civ_params ... ok
test rt_buildings ... ok
test rt_combat_params ... ok
test rt_city_names_pools ... ok
test rt_diplomacy ... ok
test rt_counters ... ok
test rt_e_start_params ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_econ_params ... ok
test rt_miasto_params ... ok
test rt_map_gen_params ... ok
test rt_resources ... ok
test rt_power_params ... ok
test rt_society_params ... ok
test rt_tech ... ok
test rt_terrain_combat ... ok
test rt_terrain_improvements ... ok
test rt_terrain_movement ... ok
test rt_ui_params ... ok
test rt_terrain_yields ... ok
test rt_wonders ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_civ_matrix ... ok
test rt_civs ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test neg_empty_file_is_empty ... ok
test data_files_list_matches_directory_contents ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_missing_file_is_file_missing ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.52s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test auto_battle_params_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test production_diplomacy_api_is_public ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test annexation_requires_vassal_economy_orientation ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test built_in_events_map_to_their_responsible_phases ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test invalid_dimensions_are_rejected_before_allocation ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test canonical_state_dto_vector_round_trips_through_json ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test public_engine_wire_aliases_are_stable ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test impassable_destination_is_allowed_as_the_final_step ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test unreachable_and_missing_fields_are_rejected ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test create_session_is_deterministic_and_contains_playable_entities ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok
test engine_state_can_be_created_advanced_and_round_tripped ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test canonical_state_round_trips_through_serde ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test city_rejects_empty_names_and_zero_population ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test diff_and_serialization_preserve_route_contract ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_credits_income_before_paying_expenses ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## Załącznik B — PO zmianach: fmt, clippy (surowe, EXIT z echo)

### B1 fmt
```text
EXIT=0
```

### B2 clippy -D warnings
```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_1c1a1f14-cd9-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 34.23s
EXIT=0
```

## Załącznik C — PO zmianach: cargo test --offline --no-fail-fast (surowe, pełne, EXIT z echo)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_1c1a1f14-cd9-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 56.01s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 11 tests
test command_wire_shape_is_stable_for_engine_integration ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.58s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test expenditure_requires_both_work_and_all_resources ... ok
test effective_work_cost_is_exactly_half_without_scaling_resources ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test buildings_json_parses ... ok
test wonders_json_parses ... ok
test tech_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civs_count_and_ids_match_web_pin ... ok
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test collection_id_sets_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test embedded_raw_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test rt_citizen_resource_upkeep ... ok
test rt_civ_ai ... ok
test rt_city_names_pools ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_buildings ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_econ_params ... ok
test rt_civ_matrix ... ok
test rt_miasto_params ... ok
test rt_map_gen_params ... ok
test rt_power_params ... ok
test rt_society_params ... ok
test rt_terrain_combat ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_resources ... ok
test rt_tech ... ok
test rt_ui_params ... ok
test rt_terrain_improvements ... ok
test rt_terrain_yields ... ok
test rt_terrain_movement ... ok
test rt_wonders ... ok
test web_pin_constants_are_internally_consistent ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_ai_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test neg_empty_file_is_empty ... ok
test data_files_list_matches_directory_contents ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_missing_file_is_file_missing ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_unreadable_file_is_io ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/derived_values-7eb2b3615468dd51)

running 9 tests
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test unit_table_key_shape_and_positive_integer_values ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/diplomacy-d94c0845f92f376e)

running 31 tests
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test peace_price_uses_treaty_duration_precedence_and_multiplier ... ok
test production_diplomacy_api_is_public ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test annexation_requires_vassal_economy_orientation ... ok
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 31 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test root_reexports_are_the_same_production_api_types ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test multiple_layers_stack_additively_per_resource ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok
test engine_state_can_be_created_advanced_and_round_tripped ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test diff_and_serialization_preserve_route_contract ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_1c1a1f14-cd9-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 5 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

## 11. Commit i kontrola zakresu

- Commit w worktree (jawne `git add`, bez `-A`), bez push. Cargo.lock nie dodawany (`git status` przed commitem).
- DEPLOY/PUSH: NIE WYKONANO.
