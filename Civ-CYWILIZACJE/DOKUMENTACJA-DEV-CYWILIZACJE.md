# DOKUMENTACJA DEV — Lane CYWILIZACJE (dane + dyplomacja + AI)

> **Dział scalony:** CYWILIZACJE = dawne DANE + DYPLOMACJA + AI  
> **Wersja:** 1.0 — 2026-06-25  
> **Hierarchia prawdy:** kod (`gra/src/game/*.ts`) > dane (`gra/data/*.json`) > panel (`*.xlsx`) > dokumenty  
> **Status modułów:** kod gotowy i przetestowany, wszystkie trzy moduły NIEWPIĘTE do pętli tury (wpinają SILNIK + UI)

---

## 1. Zakres lane + mapa plików

### Dane

| Plik | Rola |
|------|------|
| `gra/data/civs.json` | 9 cywilizacji (styl, jednostka spec., bonus, religia, klastery, mnożnik, ikonaId) + start_gry |
| `gra/data/tech.json` | 20 technologii (Koszt nauki, prereq, epoka, odblokowuje) |
| `gra/data/diplomacy.json` | Model dyplomacji: blok `params`, akcje, zdarzenia, czynniki Respektu, panel A–F |
| `gra/data/ai-params.json` | Parametry AI: trudność (poz. 1/2/3), archetypy 9 cyw., barbarzyńcy, ekspansja |

Źródła danych w Excelu:

| Plik xlsx | Arkusz | Skrypt eksportu | Cel JSON |
|-----------|--------|-----------------|----------|
| `Cywilizacje.xlsx` | `Cywilizacje` | `export-civs.py` | `civs.json` (targeted: nazwyKlastra, mnoznikHandelPieniadz, ikonaId) |
| `Technologie-drzewko.xlsx` | `Technologie` | `export-tech.py` | `tech.json` (pełna regeneracja) |
| `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` | `Bonusy cywilizacji` | `export-bonusy-cyw.py` | `civs.json["bonusy"]` (targeted) |
| `Civ-CYWILIZACJE/Panel-efekty-cyw-dyplomacja.xlsx` | `Bonusy cywilizacji` | `sync-panel-efekty-from-json.py` | panel ← JSON (regeneracja) |
| `Civ-CYWILIZACJE/Bonusy-cywilizacji-9x3.xlsx` | — | `gen-bonusy-cyw-xlsx.py` | wide 9×3 z JSON (generowalny) |
| `Civ-AI/AI-parametry.xlsx` | `AI-parametry` | `export-ai-params.py` | `ai-params.json` (nałożenie wartości, nowe klucze dopisywane) |

### Kod

| Plik | Rola |
|------|------|
| `gra/src/game/diplomacy.ts` | Model dyplomacji — wszystkie czyste funkcje i stałe |
| `gra/src/game/ai.ts` | Decyzje AI na turę — `decideAITurn()` i pomocnicze |
| `gra/src/game/victory.ts` | Warunki zwycięstwa/porażki — `checkVictory()` |
| `gra/src/game/barbarians.ts` | Barbarzyńcy — obozy, spawn, ruch, agresja |
| `gra/src/types/player.ts` | Enum `TypCywilizacji`, interfejsy `Player`, `Skarbiec` |
| `gra/src/types/diplomacy.ts` | `RelacjaDyplomatyczna`, `StanWojny`, `RodzajTraktatu` |

### Skrypty (wszystkie w `gra/tools/`)

- `export-civs.py` — targeted update 3 pól w civs.json (NIGDY nie zastępować `export-data.py`)
- `export-tech.py` — pełna regeneracja tech.json (porównanie dry-run; zatrzymuje się przy różnicach)
- `export-diplomacy.py` — targeted update bloku `params` w diplomacy.json
- `export-bonusy-cyw.py` — targeted update `civs.json["bonusy"]` z Panel-efekty (27 wierszy)
- `sync-panel-efekty-from-json.py` — JSON → arkusz Bonusy w Panel-efekty
- `gen-bonusy-cyw-xlsx.py` — JSON → wide 9×3 Bonusy-cywilizacji-9x3.xlsx

### Testy (wszystkie w `gra/tools/`)

| Plik | Asercje | Status | Uruchomienie |
|------|---------|--------|--------------|
| `diplomacy-test.cjs` | **119** | 119/0 | `node gra/tools/diplomacy-test.cjs` |
| `ai-test.cjs` | **132** | 132/0 | `node gra/tools/ai-test.cjs` |
| `research-test.cjs` | ~22 | — | `node gra/tools/research-test.cjs` |
| `barbarians-test.cjs` | ~25 | — | `node gra/tools/barbarians-test.cjs` |

Testy wymagają `npm install` (esbuild) uruchomionego z `gra/`. Każdy test sam bundle'uje kod przez esbuild.

### Dokumenty towarzyszące (linkowane, nie duplikowane)

- `Dyplomacja/Dyplomacja-DOKUMENTACJA-DEV.md` — architektura dyplomacji, przepływ danych, sekcja po sekcji
- `Dyplomacja/Dyplomacja-zasady.md` — reguły dyplomacji w skrócie
- `Civ-AI/Spec-AI-architektura.md` — architektura AI, kontrakty modułów, grafy zależności
- `Civ-DANE/DOKUMENTACJA-DANE-cywilizacje.md` — opis pól civs.json i pipeline danych

---

## 2. Dane per-cywilizacja

### 2.1 Pola w `civs.json["cywilizacje"]`

| Pole | Typ | Opis |
|------|-----|------|
| `Cywilizacja` | string | Klucz dopasowania (spójny z xlsx, używany przez export-civs.py) |
| `Styl / charakter` | string | Krótki opis stylu gry (humanistyczny, używany w UI) |
| `Jednostka specjalna` | string | Nazwa jednostki spec. (np. "Falanga (Hoplita)") |
| `Bonus startowy` | string | Opis bonusu (do dopracowania mechanicznie) |
| `Bonusy/minusy (do dopracowania)` | string | Minusy/ograniczenia (szkic) |
| `Uwagi` | string\|null | Notatki projektowe (np. "epoka Brązu", "typ główny §9d") |
| `Religia` | string | Religia startowa (system religii w przyszłości) |
| `Typ główny` | boolean | Flaga (aktualnie `false` dla wszystkich — do weryfikacji) |
| `nazwyKlastra` | string[10] | Lista 10 nazw miast klastra (indeks 0 = stolica); źródło: Cywilizacje.xlsx |
| `mnoznikHandelPieniadz` | number | Mnożnik konwersji Handel→Pieniądz (baza 2.0); źródło: Cywilizacje.xlsx |
| `ikonaId` | string | Stabilny identyfikator ikony/emblematu UI (lowercase ASCII); źródło: Cywilizacje.xlsx |
| `bonusy` | BonusCyw[] | Tablica bonusów mechanicznych per cywilizacja (nowe pole, bezpośrednio w JSON) |

#### Struktura obiektu `BonusCyw` (pole `bonusy[]`)

Każdy element tablicy `bonusy` opisuje jeden bonus lub cechę specjalną cywilizacji:

| Pole | Typ | Opis |
|------|-----|------|
| `typ` | string | Klucz rodzaju bonusu (słownik poniżej) |
| `cel` | string | Cel bonusu (np. 'piechota', 'kawaleria', 'budynki', 'handel', 'wszystko') |
| `wartosc` | number\|string | Wartość bonusu: liczba (np. 0.2 = +20%) lub string dla `jednostka_specjalna` |
| `opis` | string | Opis humanistyczny (używany w UI i tooltipach) |
| `realizuje` | string | Dział realizujący bonus: `'walka'` / `'miasto'` / `'ekonomia'` / `'mapa'` |

**Słownik typów bonusów (aktualnie w civs.json):**

| `typ` | Znaczenie | `realizuje` |
|-------|-----------|-------------|
| `bonus_obrona` | Premia do obrony jednostek (np. +20%) | walka |
| `bonus_walka` | Premia do ataku lub ogólna premia bojowa | walka / ekonomia |
| `koszt_redukcja` | Redukcja kosztu produkcji (np. -20% Produkcji budynków) | miasto |
| `bonus_zloto` | Premia do dochodu złota / Pieniądza (np. +15% z portów) | ekonomia |
| `bonus_nauka` | Premia do punktów Nauki | ekonomia |
| `jednostka_specjalna` | Definicja jednostki specjalnej (wartosc = nazwa jednostki) | walka |

**Działy realizacji:**
- `walka` → UNITS (premia do walki, obrony, jednostka spec.)
- `miasto` → MIASTO (koszty budynków, produkcja)
- `ekonomia` → EKONOMIA (złoto, nauka, handel)
- `mapa` → MAPA (ruch, terrain)

**Uwaga:** Pole `bonusy[]` jest przechowywane bezpośrednio w civs.json (nie w xlsx) i nie jest dotykane przez `export-civs.py`. Edycja tylko ręcznie w JSON.

### 2.2 9 cywilizacji (aktualny stan)

| Cywilizacja | Styl | Jednostka spec. | mnożnikHandelPieniądz | ikonaId |
|-------------|------|-----------------|----------------------|---------|
| Grecy | defensywna piechota | Falanga (Hoplita) | 2.3 | grecy |
| Rzymianie | ofensywna piechota + inżynieria | Legion (Legionista) | 2.0 | rzymianie |
| Chińczycy | dystans + kawaleria | Kusznik | 2.4 | chinczycy |
| Inkowie | nauka/kultura + elitarna piechota | Chaska + Królewska Gwardia | 1.9 | inkowie |
| Zulusi | szybka agresywna piechota | Impi | 1.8 | zulusi |
| Egipt | rydwany + łucznicy | Medżaj (Gwardia Faraona) | 2.1 | egipt |
| Sumerowie | ciężka piechota + łucznicy + rydwany | Gwardia Królewska Sumeru | 2.2 | sumerowie |
| Celtowie | agresywna piechota sieczna, brawurowa szarża | Miecznik galijski | 1.9 | celtowie |
| Germanie | piechota leśna, zasadzki, furia | Wojownik germański (framea) | 1.7 | germanie |

### 2.3 Dane startowe (`civs.json["start_gry"]`)

- 1 osadnik na start (gracz)
- 90 cywilizacji na mapie = 9 typów × 10 miast; 1 gracz + 9 rywali AI tego samego typu = klaster
- Cel startu: pokonać rywali własnego typu zanim napotkasz inne typy
- Każdy zamieszkiwalny heks (≥1 żywność) = 1 wioska/1 ludność; przejęcie → obywatele najbliższego miasta

### 2.4 Pipeline Cywilizacje.xlsx → civs.json

Skrypt `export-civs.py` aktualizuje **wyłącznie** pola `nazwyKlastra`, `mnoznikHandelPieniadz` i `ikonaId`. Wszystkie inne pola (styl, jednostka, bonus, religia, uwagi) są w JSON bezpośrednio — nie mają odpowiednika w xlsx i nie są tknięte przez skrypt. Dopasowanie po kluczu `Cywilizacja`. Skrypt robi backup `.bak-CYWILIZACJE` przed zapisem.

**Uwaga: NIGDY nie używać `export-data.py` ani `npm run build` do aktualizacji civs.json.**

---

## 3. Drzewko technologii

### 3.1 Źródło: `tech.json`

20 technologii (stan aktualny). Pola w każdym obiekcie:
- `Technologia` — nazwa (klucz)
- `Epoka` — "Kamień" lub "Brąz"
- `Poziom` — 1–5 (głębokość w drzewie)
- `Dostęp do surowca.` — wymagany dostęp do surowca (string|null)
- `wymagany budynek` — budynek wymagany w mieście (string|null)
- `Wymaga (prereq)` — warunek wstępny (string z "+", "—" = brak)
- `Odblokowuje surowiec.` — co odblokowuje produkcję surowca (string|null)
- `Odblokowuje budynek` — jakie budynki/jednostki odblokuje (string|null)
- `Koszt nauki` — liczba punktów Nauki do zbadania (int)
- `Uwagi` — notatki (string|null)

Koszty nauki (aktualne wartości z tech.json — dostrojone wg referencji tempa, PROPOZYCJA):

| Technologia | Epoka | Koszt nauki |
|-------------|-------|-------------|
| Obróbka drewna | Kamień | 15 |
| Garncarstwo | Kamień | 15 |
| Murarstwo | Kamień | 20 |
| Łucznictwo | Kamień | 15 |
| Oswojenie zwierząt | Kamień | 15 |
| Koło | Kamień | 25 |
| Mistycyzm | Kamień | 15 |
| Wymiana | Kamień | 15 |
| Gospodarka wodna | Kamień | 15 |
| Brązownictwo | Brąz (gate) | **45** |
| Żegluga | Brąz | 40 |
| Pismo | Brąz | 50 |
| Religia | Brąz | 50 |
| Jeździectwo | Brąz | 55 |
| Wojskowość | Brąz | 50 |
| Matematyka | Brąz | 65 |
| Handel | Brąz | 70 |
| Prawo (Kodeks) | Brąz | 60 |
| Budownictwo | Brąz | 80 |
| Waluta | Brąz (gate) | **100** |

Gate: Brązownictwo=45 zamyka Epokę Kamienia; Waluta=100 zamyka Epokę Brązu. Tempo generowania Nauki per turę ustala EKONOMIA/MIASTO — CYWILIZACJE widzą tylko koszty.

### 3.2 Pipeline Technologie-drzewko.xlsx → tech.json

Skrypt `export-tech.py` robi pełną regenerację (nie targeted). Tryb `--dry-run` porównuje xlsx z JSON i zatrzymuje się przy różnicach — wymagana świadoma decyzja przed zapisem. Backup nosi suffix `.bak-CYWILIZACJE`.

### 3.3 Model Nauki — podział odpowiedzialności

**Nasza odpowiedzialność (CYWILIZACJE):** koszty techów w `tech.json` + pipeline exportu.

**Nie nasza odpowiedzialność:**
- Produkcja i podział punktów Nauki per miasto → **MIASTO** (wewnętrzna ekonomika)
- Agregacja globalnego worka Nauki → **EKONOMIA** (`research.ts`)
- Magazyn i wydawanie (stan badania, `ukonczone[]`) → **EKONOMIA/research.ts**
- Wybór techu przez AI → **my** (przez `chooseAIResearch` w `ai.ts`)

Model: Wspólna pula Nauki zbierana z miast → wydawana na wybrany tech; koszt = `Koszt nauki` z tech.json.

**Uwaga:** tempo nauki (ile punktów/turę generuje miasto) jest ustalane przez EKONOMIA/MIASTO — CYWILIZACJE widzą tylko koszty.

---

## 4. Dyplomacja

> Szczegółowa dokumentacja: `Dyplomacja/Dyplomacja-DOKUMENTACJA-DEV.md`  
> Reguły w skrócie: `Dyplomacja/Dyplomacja-zasady.md`

### 4.1 Model relacji

**Relacja = Zaufanie + Respekt** (zakres 0–200)

| Składnik | Zakres | Start | Opis |
|----------|--------|-------|------|
| Zaufanie | 0–100 | 20 | Soft power — zmienia się od akcji dyplomatycznych, paktów, handlu, podarunków, religii |
| Respekt | 0–100 | 30 | Hard power — zależy wyłącznie od siły/wielkości armii, bitew, epoki, liczby miast |

**Korekty startowe** (`initialRelation()`):
- Jeśli ten sam `TypCywilizacji` → Zaufanie −20 (rywalizacja w klastrze)
- Jeśli różny typ (żaden nie jest `DrobnaCywilizacja`) → Zaufanie −5 (różnica kulturowa)

### 4.2 Tiery relacji (`relationTier()` + `TIER_NAMES`)

Status `'wojna'` lub `'sojusz'` jest nadrzędny nad punktowym wynikiem.

| Tier | Nazwa | Warunek |
|------|-------|---------|
| 0 | Wojna | `status === 'wojna'` (override) |
| 1 | Wrogi | score < 30 |
| 2 | Neutralny | score ∈ [30, 60) |
| 3 | Przyjazny | score ∈ [60, 120) |
| 4 | Sojusz | `status === 'sojusz'` (override) lub score ≥ 120 |

`TIER_NAMES = ['Wojna', 'Wrogi', 'Neutralny', 'Przyjazny', 'Sojusz']`

### 4.3 API modułu `diplomacy.ts`

```typescript
// Łączna relacja (0-200)
relationScore(rel: Relation): number

// Tier UI (0-4)
relationTier(rel: Relation): 0|1|2|3|4

// Jednorazowe zdarzenie dyplomatyczne (niemutowalne, zwraca nową Relation)
applyDiplomaticEvent(rel, event: DiplomaticEvent, params?): Relation

// Decyzja AI: gotowość do wojny/pokoju/handlu/sojuszu (0-1)
aiDiplomacyStance(aiPlayer, otherPlayer, rel, context): AIDiplomacyStance

// Relacja startowa dla pary graczy
initialRelation(playerA, playerB): Relation

// Projekcja RelacjaDyplomatyczna → slim Relation
toRelation(rdip: RelacjaDyplomatyczna): Relation

// Wczytanie overrides z diplomacy.json["params"] (używa SILNIK przy inicie)
loadDiplomacyParams(json): Partial<DiplomacyParams>

// Obliczenie Respektu (hard power) jako ważona średnia 6 wejść [0,1] → wynik 0..100
computeRespekt(inputs: RespektInputs, wagi?: RespektWagi): number

// Per-turowe przesunięcie RelacjaDyplomatycznej (niemutowalne)
tickDiplomacy(rdip: RelacjaDyplomatyczna, ctx: TickCtx): RelacjaDyplomatyczna
```

### 4.4 Zdarzenia dyplomatyczne (`DiplomaticEvent`)

21 typów zdarzeń jednorazowych (stosowane przez `applyDiplomaticEvent`):

| Zdarzenie | Efekt |
|-----------|-------|
| `wojna_wypowiedziana` | Zaufanie −20, status='wojna' |
| `pokoj` | Zaufanie +5, status='pokoj' |
| `handel` | Zaufanie +2 |
| `wspolny_wrog` | Zaufanie +5, Respekt +10 |
| `zlamana_obietnica` | Zaufanie −40 |
| `zlamana_obietnica_ai` | Zaufanie −20 |
| `zdrada` | Zaufanie −50, status='wojna' |
| `tarcia_graniczne` | Zaufanie −2 |
| `dar` | Zaufanie +6 × mnoznikPodarunku |
| `wspolna_religia` | Zaufanie +1 (seed; per-tura → silnik) |
| `pomoc_sojusznikowi` | Zaufanie +10 |
| `wygrana_bitwa` | Respekt +5 |
| `przewaga_militarna` | Respekt +15 |
| `slabszy_militarnie` | Respekt −10 |
| `trybut_zaakceptowany` | Respekt +10 |
| `wojna_casus_belli` | Zaufanie −10, status='wojna' |
| `ultimatum_spelnione` | Zaufanie −5 |
| `ultimatum_bezpodstawne` | Zaufanie −10, Respekt −10 |
| `trybut_odmowa` | Zaufanie −10 |
| `trybut_oferta_przyjeta` | Zaufanie +5 |
| `wymiana_tech_gratis` | Zaufanie +5 |
| `zerwanie_handlu` | Zaufanie −10 (§1.5: zerwanie UmowaHandlowej; szablon −15 Relacja / −10 Zaufanie) |

### 4.5 Efekty per-turę (stosowane przez SILNIK, nie przez diplomacy.ts)

| Stan | Δ Zaufanie/turę |
|------|----------------|
| Aktywny handel | +1 |
| Aktywny pakt NAP/sojusz | +1 |
| Efekt podarunku (przez `turyEfektuPodarunku`=5 tur) | +1 |
| Wspólny wróg | +1 |
| Wspólna religia | +0.5 |
| Odmienna religia | −0.5 |
| Ekspansja przy granicy | −2 |
| Urazy historyczne (zanikają co 20 tur) | −2 |

### 4.6 Progi akcji

| Akcja | Próg |
|-------|------|
| Sojusz wojskowy | Zaufanie ≥ 60 |
| Wymiana technologii | Zaufanie ≥ 70 |
| Wasalizacja | Respekt ≥ 70 |
| Wchłonięcie | Respekt ≥ 90 |
| Dyplomacja możliwa | Relacja ≥ 30 |
| Sojusz osiągalny | Relacja ≥ 120 |

### 4.7 Panel parametrów i pipeline

```
Dyplomacja.xlsx [arkusz "params"]
  kolumna A = klucz (np. "handelZawarcie_zaufanie")
  kolumna B = wartość (edytowalna)
        ↓
  export-diplomacy.py (targeted: tylko blok "params")
        ↓
  diplomacy.json["params"]
        ↓
  loadDiplomacyParams(json) → Partial<DiplomacyParams>
        ↓  (SILNIK przy inicie)
  { ...DIPLOMACY_PARAMS, ...override }
```

Klucze w bloku `params` (diplomacy.json) odpowiadają **dokładnie** nazwom pól `DIPLOMACY_PARAMS` w kodzie. Domyślne wartości są zahardkodowane w `DIPLOMACY_PARAMS` — panel nadpisuje tylko te, które się różnią.

### 4.8 `computeRespekt` — obliczanie Hard Power

```typescript
computeRespekt(inputs: RespektInputs, wagi: RespektWagi = DEFAULT_RESPEKT_WAGI): number
// wynik: 0..100
```

Oblicza Respekt jako ważoną średnią 6 znormalizowanych wejść (każde ∈ [0,1]).

**Interfejs `RespektInputs`** (SILNIK dostarcza znormalizowane wartości z UNITS/MIASTO/EKONOMIA):

| Pole | Waga domyślna | Źródło danych |
|------|---------------|---------------|
| `stosunekWojska` | 25% | UNITS: silaAI / silaGracza znorm. |
| `wygraneBitwy` | 20% | UNITS: historia bitew znorm. |
| `wielkoscWojska` | 18% | UNITS: bezwzględna liczba/siła znorm. |
| `miasta` | 15% | MIASTO: liczba miast AI vs. partner znorm. |
| `gospodarka` | 12% | EKONOMIA: siła gospodarcza znorm. |
| `epoka` | 10% | CYWILIZACJE: przewaga epoki technologicznej znorm. |

**Wzór:** `clamp(round(Σ inputs[k] * wagi[k]), 0, 100)` (suma wag = 100).

Wynik 100 = pełna dominacja we wszystkich aspektach; ~50 = równowaga; ~0 = pełna słabość.

SILNIK wywołuje `computeRespekt` raz na turę per para (gracz ↔ AI) i wpisuje wynik do `RelacjaDyplomatyczna.respekt`.

**Wagi strojone panelem:** `DEFAULT_RESPEKT_WAGI` = zahardkodowane w `diplomacy.ts`; panel_sterowania A (`diplomacy.json["respekt_-_czynniki"]`) może je nadpisać przez `loadDiplomacyParams`.

### 4.9 `tickDiplomacy` — per-turowe przesunięcie relacji

```typescript
tickDiplomacy(rdip: RelacjaDyplomatyczna, ctx: TickCtx): RelacjaDyplomatyczna
// niemutowalne — zwraca nowy obiekt
```

Przesuwa `RelacjaDyplomatyczną` o jedną turę do przodu. SILNIK wywołuje raz na turę per para.

**Interfejs `TickCtx`** (SILNIK ustawia flagi na podstawie aktywnych traktatów, stanu mapy i AI):

| Pole `TickCtx` | Typ | Efekt |
|----------------|-----|-------|
| `turn` | number | Numer tury (wygasanie traktatów, zanik urazów co 20 tur) |
| `aktywnyHandel` | boolean? | +1 Zaufanie/turę |
| `aktywnyPakt` | boolean? | +1 Zaufanie/turę (NAP lub sojusz) |
| `dobraWolaAktywna` | boolean? | +1 Zaufanie/turę (efekt podarunku) |
| `wspolnyWrog` | boolean? | +1 Zaufanie/turę |
| `wspolnaReligia` | boolean? | +0.5 Zaufanie/turę |
| `odmiennaReligia` | boolean? | −0.5 Zaufanie/turę |
| `ekspansjaPrzyGranicy` | boolean? | −2 Zaufanie/turę |

**Zanik urazów:** co 20 tur (`turn % 20 === 0`) pole `urazyHistoryczne` zmniejsza się o krok 2 ku 0.

**Wygasanie traktatów:** usuwane gdy `traktat.wygasaTura !== null && wygasaTura <= ctx.turn`.

**Pole `relacjaOgolna`** (pochodne): przeliczane po każdym tick jako `zaufanie + respekt`.

---

## 5. AI

> Szczegółowa architektura: `Civ-AI/Spec-AI-architektura.md`

### 5.1 `decideAITurn()` — wejście/wyjście

```typescript
function decideAITurn(
  playerId: number,
  units: RuntimeUnit[],
  cities: AICity[],      // = City[]
  map: GameMap,
  data: GameData,
  opts: AITurnOpts = {}
): AICommand[]
```

`AITurnOpts` (wszystkie opcjonalne):

| Pole | Typ | Opis |
|------|-----|------|
| `civType` | string | Typ cywilizacji (np. 'grecy') → mapowanie na archetyp |
| `cityBuildings` | Record\<cityId, string[]\> | Zbudowane budynki per miasto (unikanie duplikatów) |
| `poziomTrudnosci` | 1\|2\|3 | Trudność (1=Prosty, 2=Normalny domyślny, 3=Trudny) |
| `canAfford` | (cityId, buildingId) => boolean | Bramka budżetowa — jeśli wszystko nieopłacalne, ignorowana (fallback) |
| `clusterCenter` | {q, r} | Centrum klastra tej cywilizacji (z MAPA) — bonus dla osadnika |
| `clusterRadius` | number | Promień klastra (razem z clusterCenter) |

`AICommand[]` — komendy do wykonania przez silnik:

| Typ | Pola | Znaczenie |
|-----|------|-----------|
| `move` | unitId, toQ, toR | Ruch jednostki |
| `foundCity` | unitId | Założenie miasta przez osadnika |
| `attack` | unitId, targetUnitId | Atak na jednostkę |
| `build` | cityId, buildingId | Kolejkowanie produkcji |
| `endTurn` | — | Koniec tury AI (zawsze ostatnia komenda) |

### 5.2 Kolejność decyzji w turze

1. **Produkcja** — dla każdego miasta: `chooseCityProduction()` → komenda `build`
2. **Ruch i atak** — jednostki sortowane: super → militar → osadnicy:
   - 4a: osadnik — jeśli może założyć miasto → `foundCity`; jeśli nie → szuka najlepszego hexu
   - 4b: sąsiednia jednostka wroga → `attack`; sąsiednie miasto wroga → `move` na nie
   - 4c: marsz na najbliższe miasto wroga (cel dominacji §8d)
   - 4d: eksploracja najbliższej neutralnej wioski
   - 4e: patrol przy własnym mieście (jeśli >2 heksy od domu)
   - **4f: fallback idle** — jeśli żadna z powyższych: ruch w kierunku własnego miasta lub centrum mapy (jednostki NIGDY nie stoją biernie)
3. `endTurn`

### 5.3 Produkcja (`chooseCityProduction()`)

Priorytet bazowy wszystkich kategorii = 100; archetype delta = ±20 pkt/jednostkę moda; difficulty bonus `bonusProdukcja` skaluje wynik ekonomii.

| Faza | Priorytet (z grubsza) |
|------|-----------------------|
| Zagrożenie (wróg ≤5 pól) | Mury (300+), Wojownik (280+) |
| Wczesna (<3 miast) | Spichlerz (250), Osadnik (200), Wojownik bez straży (190+), Łucznik (180+) |
| Środkowa | Koszary (200+), Wojownik/Łucznik (170+), budynki ekonomiczne (140+), Osadnik (100) |

Bramka `canAfford`: jeśli wszystkie kandydaty nieopłacalne → fallback do najwyżej punktowanego (produkcja nigdy całkowicie zablokowana).

### 5.4 Archetypy i `CIV_TO_ARCH`

9 cywilizacji jest mapowanych w `ai.ts` na klucze ai-params.json:

```
CIV_TO_ARCH = {
  'grecy'     → 'grecy'
  'rzymianie' → 'rzym'
  'chinczycy' → 'chiny'
  'zulusi'    → 'zulusi'
  'inkowie'   → 'inkowie'
  'egipt'     → 'egipt'
  'babilon'   → 'sumer'   // TypCywilizacji.Babilon = Sumerowie w danych
  'celtowie'  → 'celtowie'
  'germanie'  → 'germanie'
}
```

**Uwaga: rozbieżność enum vs dane** — `TypCywilizacji` w `player.ts` ma 7 typów i używa `Babilon` jako kodu dla Sumerów. Civs.json i ai-params.json używają nazwy `Sumerowie`/`sumer`. Klucz `CIV_TO_ARCH['babilon'] = 'sumer'` jest mostem. Celtowie i Germanie nie mają wpisów w `TypCywilizacji` — **decyzja Macieja do podjęcia**: czy dodać `Celtowie` i `Germanie` do enuma.

Delta priorytetów per archetyp (z ai-params.json):

| Archetyp | wojsko | nauka | ekonomia | obrona | Charakter |
|----------|--------|-------|----------|--------|-----------|
| grecy | 0 | +1 | 0 | 0 | balans + nauka |
| rzym | +1 | 0 | 0 | 0 | militarystyczny |
| chiny | −1 | +1 | +1 | 0 | nauka + ekonomia |
| zulusi | +2 | −1 | −1 | 0 | agresywny (wojsko #1) |
| inkowie | 0 | 0 | 0 | +1 | defensywny |
| egipt | 0 | 0 | +1 | 0 | ekonomiczny/kulturowy |
| sumer | −1 | +2 | 0 | 0 | badawczy (nauka #1) |
| celtowie | +2 | −1 | 0 | +1 | agresywny + warowny |
| germanie | +2 | −1 | −1 | 0 | agresywny (wojsko #1) |

### 5.5 Trudność (`loadDifficultyParams()`)

Wczytywana z ai-params.json (klucze `trudnosc_poziom{N}_*`):

| Poziom | bonusProdukcja | bonusNauka | startoweJednostki | startoweMiasta | bonusWalka |
|--------|----------------|------------|------------------|----------------|------------|
| 1 Prosty | 0 | 0 | 0 | 0 | 0 |
| 2 Normalny | +10% | +1/turę | +1 | 0 | 0 |
| 3 Trudny | +25% | 0 | 0 | +1 miasto | +5% |

`bonusNauka`, `startoweJednostki`, `startoweMiasta` i `bonusWalka` — AI zgłasza je do silnika, sam ich nie stosuje.

### 5.6 `chooseAIResearch()` — wybór technologii

```typescript
chooseAIResearch(
  techData: readonly AITechDef[],
  ukonczone: ReadonlySet<string> | string[],
  opts: AIResearchOpts = {}
): string | null
```

Heurystyka punktowa (§5 Spec-AI):
- Odblokowanie Spichlerza → +120; Cegielni → +80 (gdy nie jest zbudowana)
- Mury pod zagrożeniem → +110; Koszary/wojsko → zależne od fazy i zagrożenia
- Brązownictwo → kluczowy enabler (+70 wczesna/+90 zagrożenie)
- Pismo → prereq Biblioteki (+20 wczesna / +50 późna)
- Tańsze techy → mały bonus tie-breaker (+max 30 punktów)
- Archetyp: delta `nauka` × 20 pkt na jednostkę
- Prereqs muszą być ukończone; ukończona tech → −Infinity (wykluczona)

Silnik: jeśli `aiResearchState.biezace === null` → wywołuje `chooseAIResearch()` i startuje badanie.

### 5.7 `checkVictory()` — warunki zwycięstwa

```typescript
checkVictory(input: VictoryInput): VictoryResult | null
```

Kolejność sprawdzania (pierwszy pasujący wygrywa):

1. **Dominacja** — wszyscy rywale tego samego typu mają 0 miast (≥1 rywal musiał istnieć)
2. **Przegrana** — gracz ma 0 miast i 0 osadników
3. **Nauka** — `epokaKoncowa && naukaUkonczona` (finałowa epoka + statek kosmiczny)

Eliminacja = 0 miast (utrata wszystkich, nie tylko stolicy). Zdobycie stolicy = przejęcie skarbca + kapituła przenosi się do kolejnego miasta.

### 5.8 Barbarzyńcy (`barbarians.ts`)

Trzy czyste funkcje wywoływane przez silnik:

| Funkcja | Co robi |
|---------|---------|
| `spawnCamps(map, existing, cities, params, seed)` | Zwraca nowe obozy (deterministyczne, Fisher-Yates LCG) |
| `tickCamps(camps, barbUnits, allUnits, map, params)` | Dekrementuje cooldown, generuje `BarbSpawn[]` gdy gotowe |
| `decideBarbarianMoves(barbUnits, playerUnits, cities, camps, map, params)` | Zwraca `BarbCommand[]` (move/attack) |

Priorytety ruchu barbarzyńcy: retreat (HP < próg) → attack sąsiada → chase w zasięgu agresji → idle do obozu.

`BARBARIAN_OWNER_ID = -1` (sentinel, nigdy nie myli się z gracze/AI).

Parametry z ai-params.json (`barbarzyncy_*`):

| Parametr | Wartość | Opis |
|----------|---------|------|
| `barbarzyncy_start_tura` | 5 | Pierwsza aktywna tura |
| `barbarzyncy_max_obozy` | 6 | Max obozów naraz |
| `barbarzyncy_min_dystans_miasto` | 5 | Min odległość od miasta |
| `barbarzyncy_odstep_obozow` | 6 | Min odległość między obozami |
| `barbarzyncy_interwal_spawnu` | 6 | Co ile tur spawn jednostki |
| `barbarzyncy_jednostek_na_oboz` | 2 | Limit żywych w promieniu obozu |
| `barbarzyncy_zasieg_kontroli` | 3 | Promień liczenia jednostek obozu |
| `barbarzyncy_zasieg_agresji` | 6 | Promień pościgu |
| `barbarzyncy_prog_odwrotu_hp` | 0.3 | Próg HP dla odwrotu |

### 5.9 `decideAIReaction` — fight/flee przy sąsiedztwie

```typescript
decideAIReaction(inp: ReakcjaInputs): ReakcjaAI
// wynik: { akcja: 'bitwa'|'odwrot', ratio: number, powod: string }
```

Decyduje czy jednostka AI powinna zaatakować czy wycofać się gdy jednostka gracza wejdzie w sąsiedni heks (brak ZoC — gracz może przejść). Czysta funkcja deterministyczna.

**Interfejs `ReakcjaInputs`:**

| Pole | Typ | Opis |
|------|-----|------|
| `silaAI` | number | Siła bojowa jednostki (lub stosu) AI |
| `silaGracza` | number | Siła bojowa jednostki (lub stosu) gracza |
| `wartoscJednostkiAI` | number | Wartość strategiczna jednostki AI (cenne jednostki są ostrożniejsze) |
| `weWlasnymTerytorium` | boolean | Czy AI jest na własnym terytorium? |
| `stanWojny` | boolean | Czy trwa formalny stan wojny? |
| `zaufanie` | number? | Zaufanie AI do gracza (0-100); domyślnie 50 |
| `agresjaArchetypu` | number? | Agresja archetypu (0-1); domyślnie 0.5 |

**Stałe progów (eksportowane, strojalne):**

| Stała | Wartość | Znaczenie |
|-------|---------|-----------|
| `PROG_BITWA` | 0.9 | Min. efektywne ratio sił do wybrania 'bitwa' |
| `TERYTORIUM_MNOZNIK` | 1.25 | Mnożnik silaAI gdy AI jest na własnym terytorium |
| `AGRESJA_WPLYW` | 0.4 | Ile agresja obniża próg bitwy: `progEff = PROG_BITWA - agresja * AGRESJA_WPLYW` |
| `WARTOSC_PROG_OBS` | 0.5 | Próg "cenności" jednostki: wartoscAI/silaGracza > 0.5 → podnosi próg o `WARTOSC_KOREKTA` |
| `WARTOSC_KOREKTA` | 0.15 | Podniesienie progu dla cennych jednostek |
| `PRZYJAZN_ZAUFANIE_PROG` | 60 | Zaufanie ≥ 60 → tryb pokojowy (override chyba że b. agresywny i wystarczająca przewaga) |
| `AGRESJA_AGRESYWNY_PROG` | 0.7 | Agresja ≥ 0.7 → nadpisuje tryb pokojowy |

**Reguły (w kolejności priorytetu):**
1. Pokój + przyjazny (`!stanWojny && zaufanie >= 60`) → 'odwrot', CHYBA ŻE `agresja >= 0.7` i `ratioEff >= progEff`
2. `ratioEff >= progEff` → 'bitwa'
3. Za słaby → 'odwrot'

**Wykonanie:** 'bitwa' → UNITS wydaje komendę ataku; 'odwrot' → MAPA cofa jednostkę.

### 5.10 `decideAIReinforcements` — posiłki

```typescript
decideAIReinforcements(
  silaAIstarcie: number,
  silaGracza: number,
  kandydaci: readonly PosilekKandydat[],
): { dorzuc: string[]; powod: string }
```

Decyduje które pobliskie jednostki AI powinny dołączyć do bitwy jako posiłki.

**Interfejs `PosilekKandydat`:**

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string | Id jednostki (jak RuntimeUnit.id) |
| `sila` | number | Siła bojowa kandydata |
| `wartosc` | number | Wartość strategiczna (cenne jednostki zostają z tyłu) |
| `dystans` | number | Odległość w heksach od miejsca bitwy |

**Strategia:**
- Cel: łączna siła AI ≈ 1.2× silaGracza (comfortable superiority).
- Jeśli `silaAIstarcie >= 1.2 * silaGracza` → nikt nie jest dorzucany (zachowaj jednostki).
- Kwalifikują się tylko kandydaci z `dystans <= 1` i `wartosc <= silaGracza * WARTOSC_PROG_OBS`.
- Sortowanie: najtańsze (niski `wartosc`) wchodzą pierwsze; cenne jednostki zostają z tyłu.

**Wykonanie:** ruch + atak — odpowiedzialność SILNIKA.

### 5.11 `decideAIDiplomacy` — decyzje dyplomatyczne AI (v0.1)

```typescript
decideAIDiplomacy(
  inp: DiplomacjaInputs,
  params?: Partial<DiplomacjaParams>,
): AIDiplomacyCommand[]
```

Podejmuje decyzje dyplomatyczne AI na koniec tury dla wszystkich relacji. Reużywa `aiDiplomacyStance` z `diplomacy.ts` (nie duplikuje logiki relacjaScore/tier).

**Interfejs `DiplomacjaInputs`:**

| Pole | Typ | Opis |
|------|-----|------|
| `myPlayerId` | string | Id gracza AI (właściciel decyzji) |
| `relacje` | RelacjaWejscie[] | Lista relacji ze wszystkimi innymi graczami/AI |
| `agresja` | number | Agresja archetypu tej cyw. (0..1) z ai-params.json |
| `epoka` | number? | Numer epoki (0=Kamień, 1=Brąz; na przyszłość v0.2) |

**Interfejs `RelacjaWejscie`** (per partner):

| Pole | Typ | Opis |
|------|-----|------|
| `partnerId` | string | Id partnera |
| `relation` | Relation | Bieżąca relacja (zaufanie+respekt+status) |
| `respektWzgledny` | number | Znormalizowana siła AI względem partnera (0..1; >0.5 = AI silniejsza) |
| `stanWojny` | boolean | Czy trwa formalny stan wojny? |

**`AIDiplomacyCommand` — discriminated union (v0.1 zakres):**

| `type` | Kiedy |
|--------|-------|
| `'oferuj_trybut_za_pokoj'` | Priorytet 1: stanWojny + respektWzgledny ≤ 0.25 (krytyczna słabość) |
| `'zaproponuj_pokoj'` | Priorytet 2: stanWojny + respektWzgledny ≤ PROG_POKOJ_SLABOSC (0.4) |
| `'zadaj_trybut'` | Priorytet 3: !stanWojny + respektWzgledny ≥ PROG_TRYBUT (0.7) + agresja średnia (≥0.25 i <0.75) |
| `'wypowiedz_wojne'` | Priorytet 4: !stanWojny + wrogie nastawienie + rw ≥ PROG_WOJNA_SILA (0.6) + agresja ≥ PROG_WOJNA_AGRESJA (0.5) + score < progMinimalnyRelacja |

**Stałe progów (eksportowane z `ai.ts`, strojalne przez `DiplomacjaParams`):**

| Stała | Wartość | Znaczenie |
|-------|---------|-----------|
| `PROG_WOJNA_SILA` | 0.6 | Min. respektWzgledny do wypowiedzenia wojny (≈ 1.5:1 stosunek sił) |
| `PROG_WOJNA_AGRESJA` | 0.5 | Min. agresja do wypowiedzenia wojny |
| `PROG_TRYBUT` | 0.7 | Min. respektWzgledny do żądania trybutu |
| `PROG_POKOJ_SLABOSC` | 0.4 | Max. respektWzgledny przy którym AI proponuje pokój (≈ słabość < 0.67:1) |

**TODO v0.2:** `zaproponuj_sojusz` (willingnessAlly), `zaproponuj_handel` (willingnessTrade) — stub widoczny w kodzie.

**Uwaga implementacyjna:** v0.1 używa stub-obiektów Player (`typCywilizacji: 'grecy'`) zamiast pełnych obiektów Player — silnik v0.2 powinien przekazać realne obiekty.

---

## 6. Granice z innymi działami

| Dział | Co dostarcza CYWILIZACJE | Co dostarcza tamten dział |
|-------|-------------------------|--------------------------|
| **MIASTO** | Koszty techów (`Koszt nauki`), warunki odblokowania budynków/jedn. | Produkcja Nauki per turę per miasto; wewnętrzna ekonomika |
| **EKONOMIA** | mnoznikHandelPieniadz per cywilizacja, koszty tech | Agregacja globalnego worka Nauki; przeliczenie Handel→Pieniądz; budżet per miasto (canAfford) |
| **MAPA** | — | Rozmieszczenie klastrów (clusterCenter/clusterRadius dla AI osadników); silnik czyta i przekazuje do `AITurnOpts` |
| **UI** | TIER_NAMES, ikonaId, getRelations()+tier (czyste dane) | Panel dyplomacji (okno), renderowanie ikon, wyświetlanie tierów |
| **SILNIK / MASTER** | `decideAITurn()`, `checkVictory()`, `spawnCamps()`, `tickCamps()`, `decideBarbarianMoves()`, `aiDiplomacyStance()`, `computeRespekt()`, `tickDiplomacy()`, `decideAIReaction()`, `decideAIReinforcements()`, `decideAIDiplomacy()` | Pętla tury; wpisanie komend; spawn barbarzyńców; wywoływanie `loadDiplomacyParams()` + `loadDifficultyParams()` przy inicie |

**Kontrakty do wpięcia (po stronie SILNIKA):**
- `decideAITurn()` wywołany raz per AI player per tura → komendy aplikowane sekwencyjnie
- `checkVictory()` wywołany po każdej zakończonej turze → null = gra trwa
- `aiDiplomacyStance()` wywołany przed propozycją dyplomatyczną AI
- `computeRespekt()` wywołany raz na turę per para (gracz ↔ AI) — SILNIK normalizuje wejścia z UNITS/MIASTO/EKONOMIA, wynik wpisuje do `RelacjaDyplomatyczna.respekt`
- `tickDiplomacy()` wywołany raz na turę per para — SILNIK ustawia flagi `TickCtx` na podstawie aktywnych traktatów, stanu mapy i AI
- `decideAIReaction()` wywołany gdy jednostka gracza wejdzie w sąsiedni heks jednostki AI — SILNIK dostarcza siły i kontekst terytorium
- `decideAIReinforcements()` wywołany gdy AI decyduje o posiłkach przy toczącej się walce
- `decideAIDiplomacy()` wywołany raz per AI player na koniec tury — SILNIK dostarcza `DiplomacjaInputs` (respektWzgledny z UNITS/EKONOMIA), realizuje komendy
- Per-turowe delty Zaufania (handel, pakt, podarunek, religia, ekspansja, urazy) → `tickDiplomacy()` je agreguje; SILNIK tylko ustawia flagi `TickCtx`

---

## 7. Testy — liczby i uruchamianie

### Jak uruchomić

```bash
# Z katalogu gra/
npm install          # raz — instaluje esbuild (wymagane przez testy)
node tools/diplomacy-test.cjs
node tools/ai-test.cjs
node tools/research-test.cjs
node tools/barbarians-test.cjs
```

Każdy test sam bundle'uje TypeScript przez esbuild, uruchamia asercje i wypisuje `X passed, Y failed`.

### Liczby asercji (stan aktualny po dodaniu testów dyplomacji/AI)

| Test | Asercji | Status | Zakres |
|------|---------|--------|--------|
| diplomacy-test.cjs | **119** | 119/0 | 10+ sekcji: DIPLOMACY_PARAMS mirror, relationScore, applyDiplomaticEvent (wszystkie 21 zdarzeń + sign + clamp + immut + params override + zerwanie_handlu), initialRelation, aiDiplomacyStance (minor + main paths), toRelation, loadDiplomacyParams, progPoboczneWojna, relationTier + TIER_NAMES, computeRespekt (wagi, edge), tickDiplomacy (flagi, wygasanie, urazy co 20 tur) |
| ai-test.cjs | **132** | 132/0 | decideAITurn (produkcja, ruch, atak, osadnik, klaster, fallback), archetypes, trudność, decideAIReaction (fight/flee, terytorium, agresja, pokój-przyjazny, cenna jednostka), decideAIReinforcements (przewaga, brak kandydatów, dorzucanie), decideAIDiplomacy (4 priorytety, PROG_*, overridy) |
| research-test.cjs | ~22 | — | chooseAIResearch (heurystyka, prereqs, archetypy, pusta lista) |
| barbarians-test.cjs | ~25 | spawnCamps, tickCamps, decideBarbarianMoves (retreat, attack, chase, idle) |

### Reguły bezpieczeństwa

- **Backup przed eksportem:** skrypty robią `.bak-CYWILIZACJE` automatycznie
- **Build/test tylko w /tmp:** przy edycji plików przez bash (pułapka OneDrive — pliki mogą być ucięte w widoku basha); buduj z świeżej kopii
- **Pułapka OneDrive:** Read (narzędzie Claude) = autorytatywna kopia; bash może widzieć plik ucięty po edycji
- **NIGDY:** `export-data.py`, `npm run build` do aktualizacji civs.json/tech.json — tylko dedykowane skrypty targeted
- **NIGDY:** modyfikacja kodu/danych/main.ts przez skrypt dokumentacyjny

---

## 8. Otwarte kwestie i handoffy

### Do decyzji Macieja

1. **`ikonaId`** — wartości w civs.json ustawione (lowercase ASCII), ale aktualny stan grafik/emblematów w UI do potwierdzenia
2. **`Typ główny`** — flaga w civs.json jest `false` dla wszystkich 9 cywilizacji; nie wiadomo czy jest aktualnie używana
3. **Enum `TypCywilizacji`** w `player.ts` ma 7 typów (bez Celtów i Germanów). Celtowie i Germanie istnieją w ai-params.json i civs.json, ale brak ich w enumie. `CIV_TO_ARCH['babilon'] = 'sumer'` jest mostem dla Sumerów. Trzeba zdecydować: dodać `Celtowie` i `Germanie` do `TypCywilizacji`?

### Handoffy techniczne (do konkretnych działów)

4. **MAPA (pkt3):** musi przekazywać `clusterCenter` i `clusterRadius` per cywilizacja do `AITurnOpts` przy wywołaniu `decideAITurn()` — bez tego osadnicy AI nie mają bonu kierunkowego
5. **EKONOMIA (pkt5):** musi dostarczyć funkcję `canAfford(cityId, buildingId) => boolean` do `AITurnOpts` — bez tego AI nie uwzględnia budżetu przy produkcji (fallback działa, ale ineffektywnie)
6. **SILNIK:** wpięcie modułów do pętli tury — `decideAITurn`, `checkVictory`, `spawnCamps`/`tickCamps`/`decideBarbarianMoves`, `computeRespekt` (per para per tura), `tickDiplomacy` (per para per tura), `decideAIReaction` (przy sąsiedztwie), `decideAIReinforcements` (przy walce), `decideAIDiplomacy` (koniec tury AI), `loadDiplomacyParams` i `loadDifficultyParams` przy inicie
7. **Referencja tempa nauki:** model `chooseAIResearch` używa tylko kosztów techów — nie zna aktualnego tempa generowania Nauki przez AI; heurystyka jest poprawna, ale AI może wybierać techy bez uwzględnienia ile tur zajmie badanie. Potencjalny przyszły argument do `AIResearchOpts`

### Archetypy dyplomacji — rozbieżność

`ARCHETYPE_AGGRESSION` i `ARCHETYPE_TRADE` w `diplomacy.ts` definiują tylko 8 wpisów (7 typów + DrobnaCywilizacja, w tym `Babilon`). Nie mają wpisów dla `Celtowie` ani `Germanie` — fallback na wartości Greków (`0.40`/`0.50`). Wymaga uzupełnienia gdy enum zostanie rozszerzony.

---

## 9. Status testów i decyzje projektowe

### Status testów (stan 2026-06-25)

| Test | Wynik | Uwagi |
|------|-------|-------|
| `diplomacy-test.cjs` | **119 passed, 0 failed** | Pokrywa computeRespekt + tickDiplomacy + zerwanie_handlu |
| `ai-test.cjs` | **132 passed, 0 failed** | Pokrywa decideAIReaction + decideAIReinforcements + decideAIDiplomacy |
| `research-test.cjs` | nie zmieniony | ~22 asercji; status z poprzedniej rundy |
| `barbarians-test.cjs` | nie zmieniony | ~25 asercji; status z poprzedniej rundy |

Wszystkie nowe moduły (computeRespekt, tickDiplomacy, decideAIReaction, decideAIReinforcements, decideAIDiplomacy) są przetestowane, ale **NIEWPIĘTE do pętli tury** — wpina SILNIK + UI.

### Decyzje projektowe v0.1 (odnośnik)

Decyzje T1–T4 podjęte podczas projektowania dyplomacji/AI v0.1 udokumentowane w:
`Civ-CYWILIZACJE/PROPOZYCJA-dyplomacja-AI-v0.1.md §5`

Kluczowe decyzje:
- **T1:** `computeRespekt` jako osobna czysta funkcja (nie inline w tickDiplomacy) — pozwala SILNIKOWI kontrolować częstotliwość przeliczania
- **T2:** `tickDiplomacy` nie zmienia Respektu (tylko Zaufanie + wygasanie) — Respekt przelicza SILNIK przez computeRespekt
- **T3:** `decideAIDiplomacy` v0.1 = tylko 4 komendy (wojna/pokój/trybut); sojusz/handel = v0.2 TODO
- **T4:** stub Player w decideAIDiplomacy (typCywilizacji='grecy') — silnik v0.2 przekaże realne obiekty
