# 07 — Dane JSON i suite testów (analiza)

**Projekt:** The Game (Civ) · **Data analizy:** 2026-06-26
**Zakres:** `gra/data/*.json` (16 plików) + `gra/tools/*-test.cjs` (21 testów) + pipeline eksportu `xlsx → json`.
**Ścieżka źródłowa:** `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\gra\`

---

## 1. Inwentaryzacja plików JSON (`gra/data/`)

Wszystkie 16 plików jest ładowanych statycznie przez `src/data/loader.ts` (import JSON → Vite bundluje je synchronicznie). Właściciele i źródła xlsx pochodzą z `tools/gen-dashboard.py` (META).

| # | Plik | Elementów | Właściciel | Źródło xlsx | Co zawiera |
|---|------|-----------|------------|-------------|------------|
| 1 | `buildings.json` | 26 budynków | Civ-MIASTO | Budynki.xlsx | Definicje budynków: `id`, `nazwa`, `kategoria`, `epokaWejscia` (1–5), `maksPoziom`=10, `nazwyPoziomow`, `baza`/`przyrost` (praca/pieniadz/zywnosc/nauka/kultura/zadowolenie/obrona/mnoznik), `kosztBudowy`, `przyrostKosztu`, `utrzymanie`, `wymagania`, `techUnlock`, opcjonalnie `wymaganySurowiec`/`odblokowuje`. Kategorie: Produkcja, Pieniadz, Zywnosc, Kultura, Nauka, Zdrowie, Obrona, Wojsko, Administracja. |
| 2 | `units.json` | ~50 jednostek | Civ-UNITS | Jednostki.xlsx | Staty jednostek: `Jednostka`, `Epoka` (Kamień/Brąz/Żelazo/Średniowiecze), `Kultura`, `Tech`, koszty (`Pieniądz`, `Ludność`, `Surowiec`), `Utrzymanie`, `żywność/turę`, staty bojowe (`Atak`, `Uderzenie`, `Obrona`, `Ruch`, `Ruch w bitwie`, `Health`, `Próg dezercji`, `Pancerz`, `Przebicie`), dystans (`Atak dystansowy`, `Zasięg`, `Ilość pocisków`), `Rola (linia)` (Wręcz/Dystans/Flanka/Morska/Wsparcie/Oblężnicza), `Typ`, `Klasa` (Standardowa/Specjalna/Super), `Nacja`, bonusy vs typy, `Zmiana na` (awans epoki), `Dostępna w epokach`. Standardowe + specjalne per kultura + super-jednostki (max 1, stolica, respawn) + machiny oblężnicze (Taran/Katapulta/Wieża). |
| 3 | `civs.json` | 9 cywilizacji + `start_gry` (11 param.) | Civ-DANE | Cywilizacje.xlsx | `cywilizacje[]`: Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie — każdy ze stylem, jednostką specjalną, `nazwyKlastra` (10 miast), `mnoznikHandelPieniadz` (1.7–2.4), `ikonaId`, `bonusy[]` (typ/cel/wartość/opis/realizuje), `typCywilizacji`, `archetyp`. `start_gry[]`: konfiguracja startu (1 osadnik, 90 miast, 9 typów, klaster rywali, ludność w terenie, przejmowanie, wzrost, jednostka specjalna). |
| 4 | `tech.json` | 29 technologii + `tempo_gry` | Civ-DANE | Technologie-drzewko.xlsx | `tempo_gry` (szybka 0.2 / standardowa 1.0 / dluga 5.0 — mnożnik kosztu badań). `technologie[]`: `Technologia`, `Epoka` (Kamień/Brąz/Żelazo), `Poziom` (1–8), `Dostęp do surowca`, `wymagany budynek`, `Wymaga (prereq)`, `Odblokowuje surowiec`, `Odblokowuje budynek`, `Koszt nauki` (10–200), `Uwagi`. Drzewko z prereq (np. Jeździectwo = Koło + Brązownictwo). Epoka kończy się tech-em flagowanym (Brązownictwo, Waluta, Sztuka wojenna). |
| 5 | `econ-params.json` | 5 sekcji, ~60 param. | Civ-EKONOMIA | Ekonomia-parametry.xlsx | `ekonomia_miasta` (próg wzrostu, spichlerz, akwedukt, zużycie żywności, suwaki handel/nauka/pieniadz/luksus + praca budynki/teren, korupcja), `budynki` (mnożniki młyna/cegielni/targowiska/mennicy/biblioteki, waluta, przepustowości tartak/mielerz/cegielnia/huta/garncarnia, utrzymanie), `teren_mapa` (bonusy rzeka/las, farmy/irygacja/kopalnia/droga/pastwisko), `wealth` (cap/prog/mnoznik/utrzymanie/zadowolenie/kara), `globalne` (kurs pieniądz-praca, mennica po walucie, luksus→zadowolenie, magazyn, utrzymanie jednostki, skarbiec). Każdy parametr: `{easy, normal, hard, jednostka, opis}`. |
| 6 | `society-params.json` | 5 sekcji + religie | Civ-MIASTO | Społeczeństwo-parametry.xlsx | `zdrowie` (rzeka/akwedukt/studnia/targowisko/ceramika, kary zagęszczenie/bagno/dżungla/zanieczyszczenie/brak wody, modyfikator wzrostu, progi stagnacji/ubytku), `szczescie` (świątynia/amfiteatr/luksus/ustrój/religia/kultura, kary zagęszczenie/wojna/obca kultura/religia/podatki, progi buntu/strajku/bonusów), `kultura` (pałac/świątynia/biblioteka/amfiteatr/cud/specjalista, progi ekspansji granic 1/2/3, konwersja kulturowa), `religia` (prog dominacji, szerzenie, zadowolenie, dyplomacja, konwersja), `religie_cywilizacji[]` (7 wpisów — brak Celtów/Germanów), `porzadek` (wagi szczęście/prawo, progi T1/T2, kary/bonusy produkcji, ryzyko buntu). |
| 7 | `miasto-params.json` | 17 param. | Civ-MIASTO | miasto-params.json (hand-edit) | `min_dystans_miast`=5, `budynek_mnoznik_poziomu`=1.1 (compound), koszty jednostek per rola, `zasieg_okolicy_miasta`=10, `zasieg_okolicy_max`=15 (model liniowy), `praca_udzial_budynki`=0.7, `bonus_obrona_mur_proc`=200, udziały outputu (produkcja 0.4 / pieniadz 0.3 / nauka 0.2 / rozwój 0.1), + 3 pola LEGACY (schodkowy zasięg — nieużywane od 2026-06-25). |
| 8 | `terrain-improvements.json` | 14 ulepszeń + `_meta` | Civ-MIASTO | terrain-improvements.json (hand-edit) | `_meta` (klucze surowców ASCII, decyzje), potem ulepszenia: farma, irygacja, pastwisko, kopalnia, glinianka, kamieniolom, oboz_lowiecki, wyrab, tarasy (Inkowie), lodzie_rybackie, plantacja, warzelnia_soli, fort, droga, posterunek. Każde: `nazwa`, `epoka` (1–3), `bonus{}`, `surowiecOdblokowany`, `teren`, `warunek`, `koszt_praca`, `tech`, `odblokowuje`. Fort/posterunek mają `bonus_obrona_proc`, `zasieg_terytorium`. |
| 9 | `diplomacy.json` | `params` + 12 akcji + 3 param. relacji + zmiany + czynniki + panel A–F | Civ-DYPLOMACJA | Dyplomacja.xlsx | `params` (~40 liczb: zaufanie/respekt per zdarzenie, progi sojusz/wymiana/wasalizacja/wchłonięcie, mnożniki), `akcje_dyplomatyczne[]` (12: nawiązanie, NAP, sojusz, granice, handel, wymiana tech, wspólny wróg, trybut, ultimatum, pokój, wojna, wasalizacja), `parametry_relacji[]` (Relacja/Respekt/Zaufanie), `zmiany_parametrów[]` (Δ per zdarzenie co turę/jednorazowo), `respekt_-_czynniki[]` (wagi % armii/bitwy/ludności/miast/gospodarki/epoki = 100), `panel_sterowania` A–F (wagi potęgi, stałe, progi, tempo zaufania, mnożniki, kalkulator). |
| 10 | `ai-params.json` | ~55 param. | Civ-AI | AI-parametry.xlsx | Trudność Lv1/Lv2/Lv3 (bonus produkcja/nauka, startowe jednostki/miasta, bonus walka), archetypy (grecy/rzym/chiny/zulusi/inkowie/egipt/sumer/celtowie/germanie — delta priorytetu wojsko/nauka/ekonomia/obrona), dyplomacja (progi NAP/trybut/handel/startowa/wojna, max propozycji, HP armii pokój), ruch (wycofanie HP), ekspansja (min dystans, zasięg zagrożenia, heurystyka punkty za żywność/pracę/handel/rzekę/surowiec/kara granica), barbarzyńcy (start tura=5, max obozy=6, dystanse, interwał spawnu, limit, zasięg kontroli/agresji, próg odwrotu). Każdy: `{wartosc, sekcja, opis}`. |
| 11 | `terrain-yields.json` | 7 typów terenu + 2 modyfikatory | Civ-EKONOMIA | Plony-terenow.xlsx | `terrain_types[]`: Łąka, Równina, Wzgórza, Góry, Wybrzeże, Morze, Pustynia — plony (Żywność/Praca/Handel/Drewno/Kamień/Suma). `terrain_modifiers[]`: Rzeka (+żywność/praca/handel), Las (−żywność/handel, +drewno). |
| 12 | `terrain-movement.json` | 7 kosztów + `forestExtra` | Civ-MAPA | Plony-terenow.xlsx | `costs`: Laka=1, Rownina=1, Pustynia=2, Wybrzeze=99, Wzgorza=2, Gory=99, Morze=99. `forestExtra`=1 (dodatkowy koszt lasu). 99 = nieprzechodnie. |
| 13 | `terrain-combat.json` | 7 terenów walki | Civ-MAPA | Plony-terenow.xlsx | Płaskie, Las, Wzgórza, Góry, Rzeka, Pustynia, Wybrzeże/Morze — koszt wejścia, bonus obrona, Δ zasięg dystans, zachowanie kawalerii/rydwanu, efekt specjalny. |
| 14 | `resources.json` | 14 surowców | Civ-EKONOMIA | Surowce.xlsx | `Surowiec`, `Typ` (surowy/hodowla/przetworzony), `Źródło / budynek`, `Uwagi`. Surowe: Żywność, Drewno, Kamień, Glina, Ruda. Hodowla: Bydło, Owce, Lama (tylko Inkowie), Koń. Przetworzone: Deski, Paliwo, Cegła, Ceramika, Brąz. Uwagi o dostępności regionalnej (Nowy Świat brak koni/wołów). **Brak pola `id`** — EKONOMIA używa kluczy ASCII (drewno/kamien/glina/ruda/bydlo/owce/lama/kon/sol/luksus/ruda_zelazo) — rozbieżności zapisane w EKONOMIA-ulepszenia-terenu-v01.md. |
| 15 | `counters.json` | 5 kontrów walki | Civ-UNITS | Macierz-walki.xlsx | Włócznik vs Konnica/Rydwan (+50% atak/obrona), Konnica/Rydwan vs Dystansowe (+50% atak), Procarz vs Włócznik (+50% atak), Atak z flanki vs Falanga/łucznicy (−50% obrona). Status: potwierdzone. |
| 16 | `ui-params.json` | 3 sekcje | Civ-MIASTO (UI) | UI-parametry.xlsx | `_opis` (czytane przez `src/ui/uiParams.ts`). `panel_miasta` (rush_cost_mnoznik=0.8, okolica_promien=2, font_scale[]). `menu` (wersja "0.1 • Kamień & Brąz", ustawienia: muzyka/efekty/grafika/jezyk/skala/mgla). `nowa_gra` (difficulty, map_size, rival_count, game_speed). |

**Uwagi do danych:**
- Wiele plików ma kopie `.bak-*` (np. `buildings.json.bak-EKONOMIA`, `civs.json.bak-CYWILIZACJE-start`) — migawki przed zmianami sprintów.
- `resources.json` **nie ma pola `id`** — EKONOMIA proponuje klucze ASCII; wymaga uzgodnienia z DANE (zapisane w `terrain-improvements.json` `_meta` i EKONOMIA-ulepszenia-terenu-v01.md).
- `society-params.json` `religie_cywilizacji` ma 7 cywilizacji — **brak Celtów i Germanów** (do uzupełnienia).
- `miasto-params.json` ma 3 pola `[LEGACY]` (`zasieg_okolicy_baza/pop5/pop10`) — nieużywane od 2026-06-25, zachowane dla wstecznej zgodności parsowania.

---

## 2. Suite testów (`gra/tools/*-test.cjs`)

**Framework:** brak zewnętrznego runnera (no Jest/Mocha). Każdy test to standalone skrypt Node `.cjs`, który:
1. bundle'uje TypeScript z `src/` przez **esbuild** do tymczasowego CJS (`.logic-bundle.cjs` lub `/tmp/*.cjs`),
2. `require()` bundle'a,
3. wczytuje JSON-y z `data/`,
4. uruchamia asercje na czystej logice (pure logic — brak DOM, brak THREE.js).

**Uruchamianie:** z katalogu `gra/`:
```bash
node tools/<nazwa>-test.cjs
```
**Brak `npm test`** — `package.json` definiuje tylko `data`, `dev`, `build`, `typecheck`. Testy uruchamia się pojedynczo.

**Zależności:** wymaga `npm install` (esbuild). `package.json` devDeps: `jsdom`, `playwright`, `typescript`, `vite`, `vite-plugin-singlefile` — ale testy logiczne potrzebują tylko esbuild (który jest dep transitivnym vite, lub osobno).

### 2.1 Lista 21 testów

| # | Plik testu | Testowany moduł (`src/`) | Co weryfikuje |
|---|------------|--------------------------|---------------|
| 1 | `logic-test.cjs` | map/generator, units/setup, game/visibility, game/cities, data/loader, game/turn-economy, game/playerState, map/gen-helpers, game/siege, game/order, map/territory, game/culture-religion | Najszerszy test czystej logiki: generowanie mapy, reach/path, widoczność, zakładanie miast, ekonomia tury, badania, oblężenie, porządek, kultura/religia. Wczytuje `society-params.json` + `civs.json`. |
| 2 | `combat-test.cjs` | game/combat | Moduł walki §5l: 6 matchupów z deterministycznym LCG, adaptacja nazw pól (PL diakrytyki → ASCII), wczytuje `units.json`/`counters.json`/`terrain-combat.json`. |
| 3 | `ai-test.cjs` | game/ai | `decideAITurn` → `AICommand[]`, `getAiParam`/`readArchMods` czyta `wartosc` (ASCII), skalowanie trudności `poziomTrudnosci`/`loadDifficultyParams`. |
| 4 | `diplomacy-test.cjs` | game/diplomacy | `relationScore`, `applyDiplomaticEvent` (każde zdarzenie + znak + clamp + immutability + params override), `initialRelation`, `aiDiplomacyStance`, `toRelation`, `DIPLOMACY_PARAMS` mirror `diplomacy.json`, `computePotegaNacji` + `computeRespekt`. |
| 5 | `research-test.cjs` | game/ai (chooseAIResearch) | Wybór tech AI: respektuje prereq, nie wybiera zbadanego, heurystyka Garncarstwo > inne na start, archetyp nauka+2, zagrożenie wojenne → Brązownictwo, 3+ miast → Wojskowosc, Jeździectwo wymaga obu prereq. |
| 6 | `currency-test.cjs` | game/economy, game/production | Waluta: Efekt 1 (handelNetto ×2 gdy `walutaOdkryta`), Efekt 2 (`doPuli × targowiskoPracaMnoznik → pieniadzZPracy`), bonusy bazowe Targowiska nienaruszone. |
| 7 | `tech-tempo-test.cjs` | game/tech-tempo | `applyTempoKoszt`: szybka ×0.2, długa ×5.0, standardowa ×1.0, zaokrąglanie `Math.round`, minimum 1. |
| 8 | `wealth-test.cjs` | game/wealth | Model Wealth (EKONOMIA-wealth-projekt.md): cap/prog/mnoznik/utrzymanie/zadowolenie/kara. |
| 9 | `upkeep-test.cjs` | game/economy-upkeep | Utrzymanie budynków (Spec-ekonomia.md s.6/s.7). Bundle tylko upkeep.ts (type-only imports). |
| 10 | `converters-test.cjs` | game/converters | Konwertery (Tartak/Mielerz/Cegielnia/Huta/Garncarnia) — Spec-ekonomia.md s.1.5. |
| 11 | `split-output-test.cjs` | game/production (splitOutput) | Podział outputu miasta na strumienie (produkcja/pieniądz/nauka/rozwój). |
| 12 | `wire-ekonomia-test.cjs` | game/turn-economy | WIRE 1: `computeCityHealth` (zdrowie ≠ 0 bez wody), WIRE 2: `splitPraca` (doBudynkow + doPuli == praca), WIRE 3: Luksus→Wealth (mnożnik > 1), backward compat. |
| 13 | `oblezenie-test.cjs` | game/turn-economy (oblężenie) | `getCityFood`, magazyn maleje o (pop+garnizon), brak dochodu, clamp do 0, `obleganyGlod`, populacja stała, brak regresji, brak garnizonu. |
| 14 | `okolica-test.cjs` | game/okolica | Okolica miasta / przydział mieszkańców do pól. |
| 15 | `found-from-village-test.cjs` | game/cities (foundCityFromVillage) | Zakładanie miasta z wioski. |
| 16 | `koszary-gate-test.cjs` | game/production (availableProduction) | Bramka Koszary: jednostki epoki Brąz (epochNumber=2) wymagają Koszar w mieście. Epoki Kamień/Żelazo bez zmian. |
| 17 | `auto-manage-test.cjs` | game/auto-manage | Auto-zarządzanie mieszkańcami/półami. |
| 18 | `growthmult-compound-test.cjs` | game/economy (7.4/7.5) | `growthMult` (7.4) + compound upkeep (7.5). |
| 19 | `happiness-breakdown-test.cjs` | game/order (happinessBreakdown) | Rozkład zadowolenia w porządku. |
| 20 | `culture-religion-test.cjs` | game/culture-religion | `spreadReligion` (dominance, slot, pressure, range), `cityTradeMultiplier` (gate/civ/fallback), `dominantReligion`, `convertViaTemple`. |
| 21 | `barbarians-test.cjs` | game/barbarians (+ setup.ts) | Barbarzyńcy: obozy, spawn, ruch, agresja, odwrót. |

### 2.2 Pliki pomocnicze (NIE testy)

- `.logic-entry.ts` / `.logic-bundle.cjs` — entry/bundle dla `logic-test.cjs` (generowane).
- `.ai-test-bundle.cjs` / `.ai-test-entry.ts` — bundle dla `ai-test.cjs`.
- `.wire-ekonomia-bundle.cjs` / `.wire-ekonomia-entry.ts`, `.tt-*`, `.research-*`, `.dip-*`, `.koszary-gate-*`, `.krok2-typecheck-*`, `.test-diag-*` — bundle/entry dla poszczególnych testów.
- `.behav-13b.cjs` — test behawioralny (używa `.logic-bundle.cjs`, replikuje end-turn economy).
- `.ai-test-diplo-tmp.cjs` — tmp/plik pośredni.
- `*.bak-*` (np. `ai-test.cjs.bak-CYWILIZACJE`, `okolica-test.cjs.bak-EKONOMIA`, `logic-test.cjs.bak-OSADNIK`, `export-civs.py.bak-*`) — migawki przed sprintami.

---

## 3. Uruchomienie testów — wynik green/red

> **UWAGA:** W sesji analizy backend wykonania shell był niedostępny — testy **nie zostały uruchomione live**. Poniższa tabela do wypełnienia po ręcznym uruchomieniu. Każdy test kończy się exit code 0 (zielony) lub ≠0 (czerwony) i drukuje podsumowanie asercji.

### 3.1 Jak uruchomić

```powershell
cd "C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\gra"
npm install   # jednorazowo — esbuild
# pojedynczo:
node tools/logic-test.cjs
# lub całość pętlą (PowerShell):
$tests = @("logic","combat","ai","diplomacy","research","currency","tech-tempo","wealth","upkeep","converters","split-output","wire-ekonomia","oblezenie","okolica","found-from-village","koszary-gate","auto-manage","growthmult-compound","happiness-breakdown","culture-religion","barbarians")
foreach ($t in $tests) { Write-Host "=== $t ==="; node "tools/$t-test.cjs" 2>&1 | Select-Object -Last 5 }
```

### 3.2 Tabela wyników (do wypełnienia)

| # | Test | Status (green/red) | Liczba asercji | Uwagi |
|---|------|--------------------|----------------|-------|
| 1 | logic-test | ⬜ | | |
| 2 | combat-test | ⬜ | | |
| 3 | ai-test | ⬜ | | |
| 4 | diplomacy-test | ⬜ | | |
| 5 | research-test | ⬜ | | |
| 6 | currency-test | ⬜ | | |
| 7 | tech-tempo-test | ⬜ | | |
| 8 | wealth-test | ⬜ | | |
| 9 | upkeep-test | ⬜ | | |
| 10 | converters-test | ⬜ | | |
| 11 | split-output-test | ⬜ | | |
| 12 | wire-ekonomia-test | ⬜ | | |
| 13 | oblezenie-test | ⬜ | | |
| 14 | okolica-test | ⬜ | | |
| 15 | found-from-village-test | ⬜ | | |
| 16 | koszary-gate-test | ⬜ | | |
| 17 | auto-manage-test | ⬜ | | |
| 18 | growthmult-compound-test | ⬜ | | |
| 19 | happiness-breakdown-test | ⬜ | | |
| 20 | culture-religion-test | ⬜ | | |
| 21 | barbarians-test | ⬜ | | |

**Legenda:** ✅ green = exit 0, wszystkie asercje pass · ❌ red = asercja fail lub crash (sprawdzić stderr).

### 3.3 Typowe przyczyny czerwonych testów
- `esbuild not found` → uruchom `npm install` w `gra/`.
- Brakujący JSON w `data/` → uruchom `npm run data` (wymaga openpyxl + xlsx w `Civ/`).
- Zmiana schematu JSON niezgodna z `loader.ts` → testy wczytują statyczne importy.
- `/tmp/...` na Windows — `combat-test.cjs` pisze do `/tmp/combat-bundle.cjs` (nieistniejące na Win); wymaga adaptacji na `os.tmpdir()`.

---

## 4. Pipeline eksportu (`xlsx → json`)

### 4.1 Źródło prawdy: Excela w `Civ/`

Edycja parametrów odbywa się w plikach `.xlsx` (każdy panel ma właściciela). JSON-y w `gra/data/` są **generowane**, nie edytowane ręcznie (wyjątki: `miasto-params.json`, `terrain-improvements.json` — hand-edit lane Civ-MIASTO; `civs.json` pola `bonusy`/`typCywilizacji`/`archetyp` zarządzane ręcznie).

### 4.2 Skrypt główny: `tools/export-data.py`

**Uruchomienie:** `python3 tools/export-data.py` (lub `npm run data` z `gra/`).

**Uwaga ścieżkowa:** `BASE_DIR = Path("/sessions/epic-jolly-heisenberg/mnt/Civ")` — hardkodowana ścieżka WSL/sesji; na Windows wymaga korekty na lokalną ścieżkę `Civ/`.

Eksportuje 10 funkcji → JSON-y:

| Funkcja | xlsx (w `Civ/`) | Arkusz(y) | Output JSON |
|---------|-----------------|-----------|-------------|
| `export_jednostki` | Jednostki.xlsx | Jednostki / Countery / Teren | `units.json`, `counters.json`, `terrain-combat.json` |
| `export_budynki` | Budynki.xlsx | Budynki | `buildings.json` |
| `export_surowce` | Surowce.xlsx | Surowce | `resources.json` |
| `export_technologie` | Technologie-drzewko.xlsx | Technologie | `tech.json` |
| `export_cywilizacje` | Cywilizacje.xlsx | (wszystkie arkusze) | `civs.json` |
| `export_plony` | Plony-terenow.xlsx | Tereny (2 tabele) | `terrain-yields.json` |
| `export_dyplomacja` | Dyplomacja.xlsx | (arkusze + Panel sterowania A–F) | `diplomacy.json` |
| `export_econ_params` | Ekonomia-parametry.xlsx | Ekonomia miasta / Budynków / Terenu i mapy / Globalne | `econ-params.json` |
| `export_society_params` | Społeczeństwo-parametry.xlsx | Zdrowie / Szczęście / Kultura / Religia / Religie cywilizacji | `society-params.json` |
| `export_ai_params` | AI-parametry.xlsx | (aktywny arkusz) | `ai-params.json` |
| `export_ruch_terenu` | Plony-terenow.xlsx | Ruch terenu | `terrain-movement.json` |

Błędy pojedynczego eksportu nie przerywają całego runu (`try/except` per funkcja — zachowuje istniejący JSON).

### 4.3 Skrypty ukierunkowane (targeted)

| Skrypt | Aktualizuje (tylko wybrane pola) | Źródło |
|--------|----------------------------------|--------|
| `export-civs.py` | `civs.json`: `nazwyKlastra`, `mnoznikHandelPieniadz`, `ikonaId` (dopasowanie po `Cywilizacja`; `bonusy`/`typCywilizacji`/`archetyp` nietknięte) | Cywilizacje.xlsx[Cywilizacje] |
| `export-tech.py` | `tech.json` | Technologie-drzewko.xlsx |
| `export-diplomacy.py` | `diplomacy.json` | Dyplomacja.xlsx |
| `export-ai-params.py` | `ai-params.json` | AI-parametry.xlsx |
| `export-ulepszenia.py` | `terrain-improvements.json` | MIASTO/Ulepszenia-terenu.xlsx |

### 4.4 Generatory paneli (read-only snapshot)

- `gen-dashboard.py` → `MIASTO/Panel-przeglad-danych.html` (single-file, JSON inline, `file://` dwuklik). META: właściciel + źródło xlsx + flaga `mine` (Civ-MIASTO).
- `gen-panel-xlsx.py` → `MIASTO/Panel-przeglad-danych.xlsx` (edytowalny Excel z kolumną "Komentarz Naster").
- `export-panel.py` → konsolidacja wybranych JSON-ów do panelu xlsx (buildings, society-params, miasto-params, terrain-improvements).

### 4.5 npm scripts (`package.json`)

```
"data":       "python3 tools/export-data.py"   # regeneruje data/*.json z xlsx
"predev":     "npm run data"                    # auto-eksport przed dev
"prebuild":   "npm run data"                    # auto-eksport przed build
"dev":        "vite"
"build":      "vite build"
"typecheck":  "tsc --noEmit"
```

Brak `npm test` — testy uruchamiane ręcznie (sekcja 3.1).

### 4.6 Konsument JSON-ów w kodzie

`src/data/loader.ts` importuje statycznie 13 z 16 JSON-ów: `units`, `buildings`, `resources`, `tech`, `civs`, `terrain-yields`, `terrain-combat`, `counters`, `diplomacy`, `econ-params`, `ai-params`, `society-params`, `terrain-movement`. **Nie importuje:** `miasto-params.json`, `terrain-improvements.json`, `ui-params.json` — te czytane bezpośrednio w modułach (np. `src/ui/uiParams.ts` dla ui-params).

### 4.7 Właściciele / lane (z `gen-dashboard.py` META)

| Lane | Pliki JSON (własne) |
|------|---------------------|
| **Civ-MIASTO** | `buildings`, `society-params`, `miasto-params`, `terrain-improvements` (4) |
| Civ-EKONOMIA | `econ-params`, `resources`, `terrain-yields` (3) |
| Civ-MAPA | `terrain-movement`, `terrain-combat` (2) |
| Civ-UNITS | `units`, `counters` (2) |
| Civ-DYPLOMACJA | `diplomacy` (1) |
| Civ-AI | `ai-params` (1) |
| Civ-DANE | `civs`, `tech` (2) |
| Civ-MIASTO (UI) | `ui-params` (1, poza META dashboard) |

---

## 5. Podsumowanie i rekomendacje

### Stan
- **Dane:** 16 JSON-ów pokrywa pełen zakres gry (budynki, jednostki, cywilizacje, tech, ekonomia, społeczeństwo, dyplomacja, AI, teren, surowce, UI). Schemat mieszany (polskie klucze z diakrytykami w listach z xlsx + klucze ASCII w params).
- **Testy:** 21 standalone testów czystej logiki, esbuild-bundle, brak runnera. Pokrycie szerokie (logika, walka, AI, dyplomacja, ekonomia, kultura/religia, barbarzyńcy, oblężenie).
- **Pipeline:** dojrzały — `xlsx → export-data.py → json → loader.ts → gra`. Panele dashboard/html + xlsx do przeglądu/edycji.

### Rekomendacje
1. **Uruchomić testy** w środowisku z shell + `npm install` i wypełnić tabelę §3.2 (status green/red).
2. **Dodać `npm test`** — pętla po `tools/*-test.cjs` z agregacją exit code (obecnie brak w `package.json`).
3. **Dokończyć `society-params.json` `religie_cywilizacji`** — brak Celtów i Germanów (7/9 cyw).
4. **Ujednolicić `resources.json`** — dodać pole `id` (ASCII) lub dokumentować klucze EKONOMIA vs DANE (rozbieżności w EKONOMIA-ulepcszenia-terenu-v01.md).
5. **Usunąć LEGACY pola** w `miasto-params.json` (`zasieg_okolicy_baza/pop5/pop10`) po audycie wstecznej zgodności.
6. **Naprawić `combat-test.cjs` na Windows** — `/tmp/` → `os.tmpdir()`.
7. **Skorygować `BASE_DIR` w `export-data.py`** — hardkodowana ścieżka WSL; uczynić konfigurowalną lub relatywną.
8. **Wyczyścić `.bak-*`** — liczne migawki w `tools/` i `data/`; rozważyć git history zamiast plików `.bak`.

### Metryka
- Pliki JSON: **16** (13 importowanych przez loader + 3 czytane bezpośrednio)
- Testy: **21** (`*-test.cjs`)
- Skrypty eksportu: **7** (`export-*.py`) + **3** generatory paneli (`gen-*.py`, `export-panel.py`)
- Właściciele/lane: **7** (Civ-MIASTO, EKONOMIA, MAPA, UNITS, DYPLOMACJA, AI, DANE)
## Wyniki uruchomienia

**Data uruchomienia:** 2026-06-26 18:17  
**Środowisko:** Windows, v22.17.0 (portable), katalog roboczy `gra/`.  
**Uwaga:** doinstalowano `@esbuild/win32-x64` (`npm install @esbuild/win32-x64 --no-save`) — — poprzednie `node_modules` zawierały binarkę Linux.

| Suite | Status | Zaliczone | Niezaliczone | Razem | Uwagi |
|-------|--------|-----------|--------------|-------|-------|
| `ai-test.cjs` | ZIELONY | 188 | 0 | 188 |  |
| `auto-manage-test.cjs` | ZIELONY | 26 | 0 | 26 |  |
| `barbarians-test.cjs` | ZIELONY | 53 | 0 | 53 |  |
| `combat-test.cjs` | ZIELONY | 6 | 0 | 6 | `os.tmpdir()` (Windows fix) |
| `converters-test.cjs` | ZIELONY | 30 | 0 | 30 |  |
| `culture-religion-test.cjs` | ZIELONY | 43 | 0 | 43 |  |
| `currency-test.cjs` | ZIELONY | 21 | 0 | 21 |  |
| `diplomacy-test.cjs` | ZIELONY | 133 | 0 | 133 |  |
| `found-from-village-test.cjs` | ZIELONY | 24 | 0 | 24 |  |
| `growthmult-compound-test.cjs` | ZIELONY | 20 | 0 | 20 |  |
| `happiness-breakdown-test.cjs` | ZIELONY | 38 | 0 | 38 |  |
| `koszary-gate-test.cjs` | ZIELONY | 18 | 0 | 18 |  |
| `logic-test.cjs` | ZIELONY | 191 | 0 | 191 |  |
| `oblezenie-test.cjs` | ZIELONY | 27 | 0 | 27 |  |
| `okolica-test.cjs` | ZIELONY | 16 | 0 | 16 |  |
| `research-test.cjs` | ZIELONY | 33 | 0 | 33 |  |
| `split-output-test.cjs` | ZIELONY | 46 | 0 | 46 |  |
| `tech-tempo-test.cjs` | ZIELONY | 9 | 0 | 9 |  |
| `upkeep-test.cjs` | ZIELONY | 53 | 0 | 53 |  |
| `wealth-test.cjs` | ZIELONY | 25 | 0 | 25 |  |
| `wire-ekonomia-test.cjs` | ZIELONY | 23 | 0 | 23 |  |

**Podsumowanie asercji:** **1023** zaliczonych, **0** niezaliczonych.
**Podsumowanie suite’ów:** **21** zielonych, **0** czerwonych (z 21 plików `*-test.cjs`).
