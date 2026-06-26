# Dyplomacja — dokumentacja developerska (architektura, logika, zależności)

> **Autor:** sesja Civ-DYPLOMACJA (rola: architekt). **Wersja:** 1.0 — 2026-06-23.
> **Zakres:** wszystko, co powstało w lane dyplomacji: model `diplomacy.ts`, dane `diplomacy.json`,
> panel `Dyplomacja.xlsx`, skrypt eksportu, testy, dokumenty.
> **Dokumenty towarzyszące:** `Dyplomacja-zasady.md` (skrót reguł), `Dyplomacja-szablon.md` (projekt/intencja),
> `PROJEKT-GRY-master.md` (specyfikacja całości).
> **Hierarchia prawdy:** dla silnika wiążące są `src/game/diplomacy.ts` + `data/diplomacy.json` (`params`);
> szablon = intencja; ten plik = pełny opis wykonawczy.

---

## 0. TL;DR dla dewelopera

- Dyplomacja to **czysty, deterministyczny moduł** (`src/game/diplomacy.ts`) — **bez DOM, bez THREE, bez efektów ubocznych**. Liczy relacje między parami graczy i zwraca decyzje/skłonności AI. Niczego sam nie rysuje ani nie zmienia w pętli gry.
- **Relacja = Zaufanie + Respekt** (0–200). Zaufanie = soft power (akcje), Respekt = hard power (siła/bitwy).
- Wszystkie liczby są w **`Dyplomacja.xlsx` → arkusz `params`** → eksport skryptem → **`diplomacy.json.params`** → `loadDiplomacyParams()` → model. Nie trzeba dotykać kodu, żeby stroić balans.
- Moduł jest **gotowy i przetestowany (90 asercji, tsc=0), ale NIEWPIĘTY** — wpięcie do tury robi SILNIK, panel/okno robi UI.

---

## 1. Mapa plików (co powstało w tym zakresie)

| Plik | Rola | Właściciel/edycja |
|---|---|---|
| `gra/src/game/diplomacy.ts` | **Model wykonawczy** — wszystkie funkcje i stałe domyślne | Civ-DYPLOMACJA |
| `gra/src/types/diplomacy.ts` | Typy stanu gry (RelacjaDyplomatyczna, enumy, DiplomacyState/Config) | współdzielone (czytane) |
| `gra/data/diplomacy.json` | Panel danych + **blok `params`** (kontrakt dla kodu) | Civ-DYPLOMACJA |
| `Dyplomacja.xlsx` | **Panel sterowania dla człowieka** + arkusz `params` (edytowalne liczby) | Civ-DYPLOMACJA |
| `gra/tools/export-diplomacy.py` | Eksport `Dyplomacja.xlsx[params]` → `diplomacy.json[params]` (targeted) | Civ-DYPLOMACJA |
| `gra/tools/diplomacy-test.cjs` | Test jednostkowy (esbuild bundle + 90 asercji) | Civ-DYPLOMACJA |
| `Dyplomacja-zasady.md` | Skrócone reguły (jedno miejsce prawdy) | Civ-DYPLOMACJA |
| `Dyplomacja-DOKUMENTACJA-DEV.md` | Ten dokument | Civ-DYPLOMACJA |

> **Lokalizacja (reorganizacja 2026-06-23):** dokumentacja i panel (`Dyplomacja-szablon.md`, `Dyplomacja-zasady.md`, `Dyplomacja-DOKUMENTACJA-DEV.md`, `Dyplomacja.xlsx`) są w katalogu-hubie **`Civ/Dyplomacja/`**. Pliki kodu/danych/testów ZOSTAJĄ w `gra/` (struktura build). Pliki kanału — w `dyspozycje/`.

**Czego moduł NIE dotyka:** `main.ts`, `render/*`, `battle/*`, inne `game/*`, inne JSON-y. Wpięcie i panel są poza tym lane.

---

## 2. Architektura i przepływ danych

### 2.1 Przepływ parametrów (strojenie balansu — bez kodu)

```
  [Dyplomacja.xlsx]                 [skrypt]                    [dane]                 [model]
  arkusz "params"   ──────────►  export-diplomacy.py  ──────►  diplomacy.json   ──►  loadDiplomacyParams(json)
  kolumna B = wartość            (tylko blok "params")         "params": {...}        │
  (żółta, edytowalna)                                                                 ▼
                                                              { ...DIPLOMACY_PARAMS, ...override }  ← robi SILNIK przy starcie
                                                                                      │
                                                                                      ▼
                                                          applyDiplomaticEvent / aiDiplomacyStance / ...
```

Krok po kroku dla zmiany parametru:
1. Otwórz `Dyplomacja.xlsx`, arkusz **`params`**, zmień liczbę w kolumnie **Wartość** (żółta).
2. Uruchom z katalogu `gra/`: `python3 tools/export-diplomacy.py` (albo `--dry-run` aby podejrzeć).
3. Skrypt nadpisze **tylko** blok `params` w `diplomacy.json` (reszta pliku i inne JSON-y nietknięte).
4. Silnik przy starcie woła `loadDiplomacyParams(diplomacyJson)` i nakłada wartości na domyślne `DIPLOMACY_PARAMS`.

> **WAŻNE:** nie uruchamiać `npm run build` ani `tools/export-data.py` — globalny eksport ma zaszytą ścieżkę i regeneruje wszystkie JSON-y (kasuje pracę innych działów). Do dyplomacji służy wyłącznie `export-diplomacy.py`.

### 2.2 Przepływ logiki w turze (docelowo, po wpięciu przez SILNIK)

```
  start gry:   initialRelation(A,B) dla każdej pary  ->  DiplomacyState.relacje[]
  akcja gracza/AI (handel, dar, wojna, trybut...):    applyDiplomaticEvent(rel, event, params) -> nowa Relation
  co turę:     +per-turn delty (handel/pakt/religia/ekspansja/urazy), zanik urazów co 20 tur,
               wygaszanie traktatów (wygasaTura), aktualizacja Respektu z modułu militarnego
  tura AI:     aiDiplomacyStance(ai, other, rel, ctx) -> {war, peace, trade, ally} -> decyzje ai.ts
  zapis:       DiplomacyState -> save.ts
```

---

## 3. Model danych

### 3.1 `Relation` (slim, używany przez funkcje czyste) — `diplomacy.ts`

| Pole | Typ | Znaczenie |
|---|---|---|
| `zaufanie` | number (0–100) | soft power / goodwill |
| `respekt` | number (0–100) | hard power (z modułu militarnego) |
| `status` | `'wojna' \| 'pokoj' \| 'sojusz' \| 'neutralni'` | bieżący stan |

`relationScore(rel) = clamp(zaufanie + respekt, 0, 200)` = **Relacja ogólna**.

### 3.2 `RelacjaDyplomatyczna` (pełny stan gry, per para) — `types/diplomacy.ts`

| Pole | Typ | Uwaga |
|---|---|---|
| `graczA`, `graczB` | string | id pary (mniejszy id pierwszy; klucz `"idA:idB"`) |
| `zaufanie`, `respekt` | number | jak wyżej |
| `relacjaOgolna` | number | pochodne (= suma); można liczyć dynamicznie |
| `traktaty` | `AktywnyTraktat[]` | `{ rodzaj, wygasaTura: number\|null }` |
| `stanWojny` | `StanWojny` | enum |
| `kontaktNawiazany` | boolean | bez kontaktu brak akcji |
| `urazyHistoryczne` | number | maleją co 20 tur (redukcja po stronie silnika) |

`toRelation(RelacjaDyplomatyczna) → Relation` rzutuje stan gry na model (mapuje `stanWojny` + obecność sojuszu na `status`).

### 3.3 Enumy — `types/diplomacy.ts` / `types/player.ts`

- `StanWojny`: `Pokoj | Rozejm | Wojna | CasusBelli`.
- `RodzajTraktatu`: `PaktNieagresji | SojuszWojskowy | OtwartGranice | PrawoWojskowePrzemarszu | UmowaHandlowa | Wasalizacja | Rozejm`.
- `TypCywilizacji`: `Grecy | Rzymianie | Chinczycy | Inkowie | Zulusi | Egipt | Babilon | DrobnaCywilizacja`.

### 3.4 Typy AI — `diplomacy.ts`

- `AIDiplomacyContext`: `{ isMinorCiv: boolean, militaryRatio: number, currentTurn: number, turnsAtWar: number }`.
- `AIDiplomacyStance`: `{ willingnessWar, willingnessPeace, willingnessTrade, willingnessAlly }` — każde ∈ [0,1].
- `DiplomacyParams`: zmienny (number-valued) widok kluczy `DIPLOMACY_PARAMS` — typ dla override'ów i loadera.

---

## 4. API — funkcje publiczne (`src/game/diplomacy.ts`)

Wszystkie czyste i deterministyczne; żadna nie mutuje wejścia.

| Funkcja | Sygnatura | Opis |
|---|---|---|
| `relationScore` | `(rel: Relation) => number` | Relacja ogólna = clamp(Zaufanie+Respekt, 0, 200). |
| `applyDiplomaticEvent` | `(rel, event: DiplomaticEvent, params?) => Relation` | Nakłada jednorazowe zdarzenie; zwraca NOWĄ Relację (clamp 0–100 per składowa); może zmienić `status`. |
| `aiDiplomacyStance` | `(ai: Player, other: Player, rel, ctx: AIDiplomacyContext) => AIDiplomacyStance` | Skłonności AI (wojna/pokój/handel/sojusz). |
| `initialRelation` | `(a: Player, b: Player) => Relation` | Relacja startowa pary (korekty: ten sam typ −20, różny typ −5). |
| `toRelation` | `(rdip: RelacjaDyplomatyczna) => Relation` | Rzut pełnego stanu na model. |
| `loadDiplomacyParams` | `(json: unknown) => Partial<DiplomacyParams>` | Czyta `json.params`; ignoruje braki/nie-liczby/nieznane klucze; brak → `{}`. |
| `DIPLOMACY_PARAMS` | `const` | Domyślne wartości wszystkich parametrów (fallback). |

**Wzorzec użycia w silniku (raz przy init):**
```ts
import { DIPLOMACY_PARAMS, loadDiplomacyParams, applyDiplomaticEvent } from './game/diplomacy';
const params = { ...DIPLOMACY_PARAMS, ...loadDiplomacyParams(diplomacyJson) };
// ...
const nowa = applyDiplomaticEvent(rel, 'dar', params);
```

---

## 5. Parametry — pełna referencja (38)

Źródło: `Dyplomacja.xlsx[params]` = `diplomacy.json.params` = `DIPLOMACY_PARAMS`. Wartości domyślne poniżej.

### 5.1 Jednorazowe Zaufanie

| Klucz | Wartość | Znaczenie |
|---|---|---|
| `handelZawarcie_zaufanie` | 2 | zawarcie umowy handlowej |
| `pomocSojusznikowi_zaufanie` | 10 | pomoc w wojnie sojusznikowi |
| `wspolnyWrogNawiazanie_zaufanie` | 5 | wspólny wróg — nawiązanie |
| `dar_zaufanie` | 6 | podarunek gratis (× `mnoznikPodarunku`) |
| `zlamanaPaktGracz_zaufanie` | −40 | złamany pakt przez gracza |
| `zlamanaPaktAI_zaufanie` | −20 | złamany pakt przez AI |
| `zdrada_zaufanie` | −50 | zdrada / atak z zaskoczenia (status→wojna) |
| `szpiegWykryty_zaufanie` | −15 | wykryte szpiegostwo |
| `rywalizacjaTenSamTyp_zaufanie` | −20 | rywalizacja tego samego typu (start) |
| `roznicaKulturowa_zaufanie` | −5 | różnica kulturowa (start) |

### 5.2 Jednorazowe Respekt

| Klucz | Wartość | Znaczenie |
|---|---|---|
| `przewagaMilitarna_respekt` | 15 | przekroczenie progu siły (2×/5×) |
| `slabszyMilitarnie_respekt` | −10 | gracz słabszy militarnie |
| `wygraBitwa_respekt` | 5 | wygrana bitwa |
| `trybut_respekt` | 10 | akceptacja trybutu |
| `wspolnyWrogAkceptacja_respekt` | 10 | wspólny wróg — akceptacja |

### 5.3 Co turę (Zaufanie)

| Klucz | Wartość | Znaczenie |
|---|---|---|
| `handel_zaufanie_perTura` | 1 | aktywny handel |
| `aktywnyPakt_zaufanie_perTura` | 1 | dotrzymany pakt NAP/sojusz |
| `dobraWola_zaufanie_perTura` | 1 | efekt dobrej woli po podarunku |
| `wspolnyWrog_zaufanie_perTura` | 1 | trwająca kooperacja |
| `wspolnaReligia_zaufanie_perTura` | 0.5 | wspólna religia (max +15) |
| `odmiennaReligia_zaufanie_perTura` | −0.5 | odmienna religia (max −10) |
| `ekspansjaGranica_zaufanie_perTura` | −2 | ekspansja/osadnictwo przy granicy |
| `urazyHistoryczne_zaufanie_perTura` | −2 | urazy (zanik co 20 tur) |

### 5.4 Progi akcji (panel C)

| Klucz | Wartość | Warunek |
|---|---|---|
| `progSojuszZaufanie` | 60 | Sojusz wojskowy: Zaufanie ≥ |
| `progWymianaTechZaufanie` | 70 | Wymiana technologii: Zaufanie ≥ |
| `progWasalizacjaRespekt` | 70 | Wasalizacja: Respekt ≥ |
| `progWchloniecieRespekt` | 90 | Wchłonięcie: Respekt ≥ |
| `progMinimalnyRelacja` | 30 | Dyplomacja możliwa: Relacja ≥ |
| `progSojuszRelacja` | 120 | Sojusze realistyczne: Relacja ≥ |

### 5.5 Wartości startowe i mnożniki (panel E) + drobni

| Klucz | Wartość | Znaczenie |
|---|---|---|
| `startZaufanie` | 20 | startowe Zaufanie |
| `startRespekt` | 30 | startowy Respekt |
| `mnoznikZaufania` | 1 | globalny mnożnik dynamiki Zaufania |
| `mnoznikRespektu` | 1 | globalny mnożnik dynamiki Respektu |
| `mnoznikPodarunku` | 1 | mnożnik wpływu podarunków |
| `turyEfektuPodarunku` | 5 | ile tur trwa efekt podarunku |
| `progPoboczneAkceptacja` | 60 | drobni: Respekt > → akceptują prawie wszystko |
| `progPoboczneHandel` | 30 | drobni: Relacja > → handel + granice cywilne |
| `progPoboczneWojna` | 15 | drobni: Relacja < → mogą wypowiedzieć wojnę |

---

## 6. Reguły

### 6.1 Zdarzenia jednorazowe (`DiplomaticEvent`)

Modyfikatory z §3.3 szablonu używają kluczy `params` (tabele 5.1–5.2). Dodatkowo zdarzenia z akcji §1 mają wartości stałe (literały w kodzie, poza `params`):

| Zdarzenie | Efekt | Status |
|---|---|---|
| `wojna_wypowiedziana` (bez casus belli) | Zaufanie −20 | wojna |
| `wojna_casus_belli` (z casus belli) | Zaufanie −10 | wojna |
| `pokoj` | Zaufanie +5 | pokój |
| `zdrada` | Zaufanie −50 | wojna |
| `ultimatum_spelnione` | Zaufanie −5 | — |
| `ultimatum_bezpodstawne` | Zaufanie −10, Respekt −10 | — |
| `trybut_odmowa` | Zaufanie −10 | — |
| `trybut_oferta_przyjeta` | Zaufanie +5 | — |
| `wymiana_tech_gratis` | Zaufanie +5 | — |
| `wspolna_religia` (seed) | Zaufanie +1 | — |
| (pozostałe: `handel`, `dar`, `wspolny_wrog`, `pomoc_sojusznikowi`, `zlamana_obietnica[_ai]`, `tarcia_graniczne`, `wygrana_bitwa`, `przewaga_militarna`, `slabszy_militarnie`, `trybut_zaakceptowany`) | wg `params` 5.1–5.2 | — |

Każda zmiana clampowana do [0,100] per składowa. Nieznane zdarzenie = no-op.

### 6.2 Logika AI (`aiDiplomacyStance`)

**Cywilizacje główne:**
- `war` = agresja_archetypu·0.5 + (Respekt/100)·0.3 + (1 − Relacja/200)·0.2; = 0 gdy już trwa wojna.
- `peace` = 0.8 w pokoju; na wojnie: zmęczenie (turaWojny/20, max 0.5) + presja (gdy `militaryRatio`<1) + goodwill (Zaufanie/100·0.2).
- `trade` = gdy Relacja ≥ 30: handel_archetypu·0.6 + (Relacja/200)·0.4.
- `ally` = tylko gdy Zaufanie ≥ 60 ∧ Relacja ≥ 120: (Zaufanie/100)·0.6 + bonus_lojalności + nadwyżka Relacji.

**Drobni (§5.2):** `ally`=0 zawsze; `trade`=0.6 gdy Relacja>30 (inaczej 0.2); `war`=0.2 gdy Relacja<15 (inaczej 0.05); `peace`=Respekt/60 (lub 0.9 gdy Respekt>60).

**Archetypy (§4 szablonu):**

| Typ | Agresja | Handel | Bonus lojalności (sojusz) |
|---|---|---|---|
| Grecy | 0.40 | 0.75 | +0.10 |
| Rzymianie | 0.75 | 0.50 | 0 |
| Chińczycy | 0.20 | 0.85 | +0.20 |
| Inkowie | 0.45 | 0.25 | +0.15 |
| Zulusi | 0.90 | 0.20 | −0.20 |
| Egipt | 0.35 | 0.60 | 0 |
| Babilon | 0.30 | 0.65 | 0 |
| Drobna | 0.15 | 0.60 | n/d |

### 6.3 Relacje startowe

`initialRelation`: baza Zaufanie 20 / Respekt 30. Korekta: ten sam typ → −20 Zaufanie (rywalizacja); różne typy główne → −5 (różnica kulturowa); para z drobną → bez kary. Status startowy `neutralni`.

### 6.4 Dostępność akcji (§2 szablonu)

12 akcji; główni = pełny zestaw, drobni = podzbiór: 1 TAK, 2 UPR, 3 NIE, 4 UPR(cywilne), 5 UPR(jednorazowo), 6 NIE, 7 NIE, 8 TAK, 9 UPR(poddanie), 10 TAK, 11 TAK, 12 TAK.

---

## 7. Założenia projektowe (przyjęte; do akceptacji mastera)

- **(a) Start Relacji = 50** (= 20+30), nie 60. „60" było legacy. Poprawione w `diplomacy.json` (`parametry_relacji` + `params`) i `Dyplomacja.xlsx` (`Parametry relacji!C3` oraz arkusz `params`).
- **(b) §3.1 (Relacja 0–200) > §5.2 (progi ujemne).** Relacja nie bywa ujemna (suma dwóch ≥0). Próg wojny drobnych przemapowany: `progPoboczneWojna` −40 → **15**. Trigger „gracz atakuje" obsługuje silnik.

---

## 8. Zależności i ograniczenia

- **Importy:** `types/diplomacy.ts` (`RelacjaDyplomatyczna`, `StanWojny`), `types/player.ts` (`Player`, `TypCywilizacji`). Brak innych.
- **Czystość:** zero DOM, zero THREE, zero I/O, zero losowości. Funkcje deterministyczne → łatwe do testów i wpięcia.
- **TS strict:** plik przechodzi `tsc` z `strict + noUncheckedIndexedAccess + verbatimModuleSyntax`.

---

## 9. Testy i weryfikacja

- **Test:** `gra/tools/diplomacy-test.cjs` — samodzielny (esbuild bundluje `diplomacy.ts` → CJS, potem asercje). **90 asercji, 0 błędów.** Pokrywa: `relationScore`, każde zdarzenie (znak/clamp/immutability/override), `initialRelation`, `aiDiplomacyStance` (ścieżka drobnych i głównych + progi), `toRelation` (wszystkie gałęzie), `loadDiplomacyParams`, remap progu drobnych.
- **Uruchomienie (na maszynie z pełnym repo):** z `gra/`: `node tools/diplomacy-test.cjs`.
- **Typecheck:** `npx tsc --noEmit` (lub izolowany strict — patrz §10).

---

## 10. Build i pułapki środowiska (WAŻNE dla wykonawcy w piaskownicy)

- **NIE** `npm run build`, **NIE** `tools/export-data.py` (globalny prebuild z zaszytą ścieżką regeneruje wszystkie JSON-y). Build do testu: `npx vite build --outDir /tmp/civ-dist`, potem kopiowanie do celu (robi SILNIK).
- **Dehydracja OneDrive:** plik *edytowany* bywa w piaskownicy widziany jako ucięty (esbuild/tsc: „Unexpected end of comment/input"), choć na dysku jest cały. Wtedy: NIE sklejać z backupu; budować/testować ze świeżej kopii (odczyt → zapis kopii → bundling z kopii). Pliki NOWE propagują się świeżo. `rm` na mougncie bywa „Operation not permitted".

---

## 11. Interakcje z innymi działami gry

> Zmapowane na **realne działy (sesje) projektu Civ**: Master, EKONOMIA, Dane Cywilizacji, Units/Battle,
> MAPA, Silnik, UI, MIASTO, AI opponent intelligence. Dyplomacja jest modułem CZYSTYM — sama nie liczy
> siły ani nie wydaje Pieniędzy; przyjmuje dane wejściowe i zwraca decyzje/skłonności.

| Dział (sesja) | Co dyplomacja OD niego potrzebuje | Co dyplomacja MU dostarcza | Styk / priorytet |
|---|---|---|---|
| **Civ - Master** | akcept założeń (a)(b), priorytety, dyspozycje | raporty (`DYPLOMACJA-DO-MASTERA.md`), ten dokument | koordynacja |
| **Civ-EKONOMIA** | stan skarbca, czy odblokowana Waluta, transfer Pieniądza | kwoty/efekty akcji: posłaniec 5, łapówki 30–150, trybut ≥10/turę, reparacje 50–500, wymiana tech 50–300, granice 10–60; strumienie handlu | API skarbca przy zawieraniu/utrzymaniu umów — **wysoki** |
| **Civ - Dane Cywilizacji** | `TypCywilizacji` (archetyp) + **religia** każdej cyw. z `civs.json` | — | tabele archetypów (agresja/handel/lojalność) + delty religijne zależą od tych danych — **wysoki** |
| **Civ - Units / Battle** | wynik bitew (wygrana/przegrana), próg siły 2×/5×, komponenty siły wojska | — | emituje zdarzenia `wygrana_bitwa` (+5R), `przewaga_militarna` (+15R), `slabszy_militarnie` (−10R) — **wysoki** |
| **Civ MAPA** | sąsiedztwo (nawiązanie kontaktu), sygnał osadnictwa/ruchu wojsk przy granicy | — | `kontaktNawiazany`; per-turn `ekspansjaGranica` (−2) — średni |
| **Civ - Silnik** | wpięcie do pętli tury, `loadDiplomacyParams(json)` przy starcie, wstawianie `respekt`+`militaryRatio` z militariów, wołanie funkcji, save/load | cały model (API §4) | **integrator — krytyczny** (bez niego dyplomacja nie działa w grze) |
| **Civ-UI** | — | bieżące Zaufanie/Respekt/Relacja, dostępność akcji wg progów (§6.4), dźwignia negocjacyjna | okno/panel dyplomacji — średni |
| **Civ-MIASTO** | liczba miast i terytorium (15% Respektu), zakładanie miast przy granicy | skutki akcji 12: wasalizacja/wchłonięcie (przejęcie miast, niezadowolenie N tur), trybut do skarbca | wpływ na Respekt + wasal/wchłonięcie — średni |
| **Civ - AI opponent intelligence** | — (konsument) | `aiDiplomacyStance()` → {war, peace, trade, ally}; wymaga `AIDiplomacyContext` (`militaryRatio`, `turnsAtWar`) | AI woła stance w swojej turze i podejmuje akcje — **wysoki** |

**Kluczowe kontrakty międzymodułowe (do spięcia przy wpinaniu):**
1. **Respekt = WEJŚCIE, nie wynik.** Liczą go Units/Battle + agregat Power (stosunek wojska 25%, wygrane bitwy 20%, wielkość 18%, miasta 15% [MIASTO], gospodarka 12% [EKONOMIA], epoka 10%). SILNIK wstawia `respekt` i `militaryRatio` co turę. Dyplomacja siły NIE liczy.
2. **Religia + typ = z Dane Cywilizacji.** `civs.json` musi nieść religię i `TypCywilizacji`; inaczej delty religijne i archetypy AI nie zadziałają.
3. **Pieniądz = z EKONOMII.** Każda płatna akcja (trybut, łapówka, reparacje, posłaniec) idzie przez API skarbca; dyplomacja podaje kwoty/efekty, ekonomia wykonuje transfer.
4. **AI = konsument decyzji.** Czy wypowiedzieć wojnę / przyjąć pokój / handel / sojusz — decyduje AI na bazie `aiDiplomacyStance`.
5. **SILNIK = orkiestrator.** Per-turn delty, zanik urazów co 20 tur, wygasanie traktatów (`wygasaTura`), `loadDiplomacyParams`, save/load `DiplomacyState`.

> **Granice lane (potencjalne kolizje do pilnowania):** „Respekt — czynniki" (wagi) dotyka EKONOMII (gospodarka), MIASTA (miasta/teren) i Units/Battle (wojsko) — wagi powinny być uzgodnione z masterem, by nie liczyć tego samego dwa razy. Religia: źródło danych = Dane Cywilizacji, ale dynamika zadowolenia/konwersji to lane „kultura/religia" (jeśli powstanie) — dyplomacja tylko czyta stan religii pary.

---

## 12. Co zostaje (TODO / handoff)

- **SILNIK:** wpiąć `diplomacy.ts` do pętli tury (init `initialRelation`, per-turn delty, zanik urazów, wygasanie traktatów, wstawianie `respekt` z militariów, wołanie `aiDiplomacyStance` w turze AI) + nałożyć `loadDiplomacyParams(json)` przy starcie.
- **UI:** okno/panel dyplomacji (akcje wg dostępności §6.4, podgląd Zaufanie/Respekt/Relacja, dźwignia).
- **Militaria:** dostarczyć komponenty Respektu + `militaryRatio`.
- **Pełny eksport:** ewentualnie rozszerzyć `export-diplomacy.py` o synchronizację pozostałych sekcji panelu (na teraz wystarcza `params`).
- **Decyzje mastera:** akcept założeń (a) i (b).

---

## 13. Słowniczek i źródła

**Pojęcia:** Relacja ogólna (Zaufanie+Respekt, 0–200), Zaufanie (soft power), Respekt/Strach (hard power), dźwignia negocjacyjna, casus belli, wasalizacja/wchłonięcie, cywilizacja drobna.

**Źródła:** `PROJEKT-GRY-master.md`, `Dyplomacja-szablon.md`, `Dyplomacja-zasady.md`, `gra/data/diplomacy.json`, `gra/src/game/diplomacy.ts`, `gra/src/types/diplomacy.ts`, `gra/tools/diplomacy-test.cjs`, `gra/tools/export-diplomacy.py`.
