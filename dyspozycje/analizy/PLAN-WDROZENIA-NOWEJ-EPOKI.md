# Plan wdrożenia nowej epoki — dokument bazowy

**Temat:** R-DESIGN-EPOKI-KLASYCZNA-SREDNIOWIECZE-ANALIZA-Q1 (runda 1/5, Operator)
**Stan bazy:** origin/main = `c80537eb0`. Wszystkie fakty z `gra/data/*.json` i `gra/src/**` (plik:linia). Liczby oznaczone **PROPOZYCJA** nie są faktem. Miejsca niezbadane oznaczone **NIE_ZMIERZONO**.
**Towarzyszący arkusz:** `dyspozycje/analizy/EPOKI-KLASYCZNA-SREDNIOWIECZE-PROPOZYCJA.xlsx` (arkusze AUDYT_ZALEZNOSCI, SKALOWANIE, PLAN_PRAC, PYTANIA_DO_WLASCICIELA itd.).
**Status:** analiza. Zero zmian w kodzie i danych gry. Nic nie jest zatwierdzone.

---

## A. Stan wyjściowy: co dziś zakłada „3 epoki"

Epoki są dziś zakodowane w trzech miejscach naraz: w danych (tech/units/buildings), w stałych kodu i w **płaskich sufitach** mnożników. Dodanie epoki bez przeglądu tych miejsc powoduje ciche błędy, a nie wyjątki.

Najważniejsze fakty (pełna lista: arkusz AUDYT_ZALEZNOSCI, 61 pozycji):

| # | Co | Gdzie (plik:linia) | Skutek dla E4/E5 |
|---|----|--------------------|------------------|
| 1 | Sufit mnożnika ×4 dla każdej epoki ≥ 3 | `gra/src/game/building-stock-cost.ts:72–81` | Koszty budowy, utrzymania i surowców **nie rosną** po Żelazie |
| 2 | Utrzymanie budynków z tym samym sufitem | `gra/src/game/economy-upkeep.ts:~629–655` | j.w. dla utrzymania |
| 3 | Produkcja ulepszeń: `normalizeProductionEra` zwraca 1, 2 lub 3 | `gra/src/game/terrain-improvements.ts:277–288` | **Błąd utajony:** w epoce 4 produkcja ulepszeń spada z ×2,25 do ×1 |
| 4 | Koszt żywności obywateli: plateau ×4 | `gra/src/game/population-growth-v85.ts:47–50` | Brak wzrostu kosztu żywności |
| 5 | Nieznana nazwa epoki w jednostce → Kamień | `gra/src/game/production.ts:198–215` (`epochNumber` zwraca 1) | Jednostka „Klasyczna” kosztuje jak Kamień |
| 6 | Nieznana nazwa epoki w techu → brak bramki | `gra/src/game/research.ts:253–285` (`epochNumber` zwraca null, `epochGateMet` przepuszcza) | Tech E4 może być odkryty bez całej epoki Żelaza |
| 7 | Tablica 3 epok w UI | `gra/src/ui/sciencePicker.ts:518–525` (clamp do ostatniego elementu) | Epoka 4 pokaże etykietę „Żelazo” |
| 8 | Tablica 3 epok w kodzie | `gra/src/game/civ-entry-epoch.ts:10–11, 78–86` | Typ `GameEpochId` i etykiety zamknięte na 3 |
| 9 | Dopełniacze w powiadomieniu | `gra/src/game/era-change-notify.ts:23–33` | Epoka 4 → „nr 4” |
| 10 | Wojna wymuszona tylko dla Żelaza | `gra/src/game/forced-war-iron.ts:17–30` | Brak odpowiednika dla E4/E5 |
| 11 | Muzyka: osobne ścieżki tylko dla 1 i 2 | `gra/src/audio/muzyka-antyczna.ts:17, 400, 1407–1409` | Epoka 3+ bez własnej muzyki |
| 12 | **Numeracja budynków:** `epokaWejscia=4` już ma Wielka odlewnia i Wielka Kuźnia (Żelazo) | `gra/data/buildings.json` | **Konflikt numeracji** z nową E4 |
| 13 | Magazyn ×2^(e−1), bez limitu | `gra/src/game/economy-upkeep.ts:392–395` | E5 = ×16 — do akceptacji |
| 14 | Przepustowość konwerterów +10%/epokę liniowo | `gra/src/game/converters.ts:142–150` | Do decyzji |

**Dane już przygotowane:** `gra/data/epoka-ludnosc-manpower.json` ma wiersze 1–10 (manpower 1000 → 16000 na ludka dla E1–E5). Wealth cap = epoka × 10 (`econ-params.json`). Cuda parkowane pod E4–E6 istnieją w `wonders.json` (`parkowane_epoka4plus`: Nalanda, Mauzoleum Teodoryka — E4; Angkor Wat — E5; Wielki dzwon — E6). `power-params.json` ma świadomie odrzucone mnożenie przez epokę.

---

## B. Checklista: co przewidzieć i wykonać przy dodaniu epoki N

Każdy punkt ma przypisany **warstwę** i **temat** (sekcja C). „✔” = punkt obowiązkowy dla każdej nowej epoki.

### B1. Dane (`gra/data/`)

- ✔ `tech.json`: nowe wiersze (Epoka, Poziom, Wymaga (prereq), Koszt nauki, Odblokowuje *, awansDoEpoki na capstonie). Każdy prereq musi istnieć; brak cykli; koszt według krzywej z SKALOWANIE.
- ✔ `buildings.json`: nowe budynki (`epokaWejscia`, `maksPoziom`, `nazwyPoziomow`, `kosztBudowy`, `przyrostKosztu`, `utrzymanie`, `przyrostUtrzymania`, `wymagania`, `techUnlock`). Ulepszenia = wpis z `upgradeFrom`.
- ✔ `units.json`: nowe jednostki (Epoka, Rola, Pieniądz, Surowiec, Utrzymanie, Atak/Obrona/Health/Ruch/Zasięg, „W zamian za”, Tech, Super-jednostka). Każda linia Wręcz/Dystans/Flanka/Oblężnicza/Morska/Wsparcie ma wpis.
- ✔ `counters.json`, `combat-params.json` (milicja wg epoki), `auto-battle-params.json`, `terrain-combat.json` — kontry dla nowych linii (**NIE_ZMIERZONO** — wymaga przeglądu).
- ✔ `terrain-improvements.json`: nowe ulepszenia (`epoka`, `bonus`, `koszt_praca`, `tech`).
- ✔ `resources.json`: nowe surowce (dziś 15 typów, bez pola epoki). Każdy nowy surowiec: źródło, zużycie, wpływ na magazyn państwa.
- ✔ `wonders.json`: aktywacja parkowanych + nowe cuda (`epokaWejscia`, bramka `techUnlock`, cud wyłączny).
- ✔ `civs.json`: wodzowie dla nowej epoki (dziś klucze `kamien/braz/zelazo/antyk`), unikalne jednostki/budynki.
- ✔ `e-start-params.json`: `typy_cywilizacji_per_epoka` — nowe klucze, jeśli epoka może być startowa.
- ✔ `society-params.json`: tablice per epoka (`szczescie_max_epoka`, `prawo_max_epoka`, `szczescie_skala_kultura_religia`). Komentarz w pliku mówi, że epoki dalsze biorą ostatni wpis — **do potwierdzenia w kodzie** przed dopisaniem wartości.
- ✔ `epoka-ludnosc-manpower.json`: wiersz epoki (już istnieje dla 1–10).
- ✔ `econ-params.json`: magazyn, konwertery, wealth — tylko jeśli zmieniają się wartości bazowe.
- ✔ `ai-params.json`, `civ-ai.json`, `civ-matrix.json`, `civ-params.json`, `diplomacy*.json`, `war-*-params.json`: progi per epoka (**NIE_ZMIERZONO** — pełny przegląd).
- ✔ `ui-params.json`: etykiety kreatora.
- ✔ Wpis **Młyna** w `buildings.json` (dziś Młyn ma tylko parametry w `econ-params.json`, `budynek_mlyn_mnoznik_pracy = 2`). Decyzja: Młyn wodny tylko przy rzece (R-WEB-MILL-RIVER-GATE-Q1).

### B2. Kod gry (`gra/src/game/`)

- ✔ **Stałe epok:** `civ-entry-epoch.ts` (GAME_EPOCH_ORDER, typ GameEpochId, EPOCH_HUD_LABELS), `research.ts` (NUMER_EPOKI, KOLEJNOSC_EPOK), `production.ts` (EPOCH_BY_NAME), `ui/newGameFlow.ts` (START_EPOCH_ORDER), `ui/sciencePicker.ts` (EPOCH_ORDER). Usunąć clamp do 3; nieznana epoka = **błąd**, nie domyślny Kamień.
- ✔ **Bramki:** `research.ts` (epochGateMet, epochTierGateMet), `playerState.ts` (awansDoEpoki), `owner-epoch.ts` (computeMainCivEraFromResearch — cap liczony z danych, OK), `era-gate-ui.ts`.
- ✔ **Mnożniki:** `building-stock-cost.ts` (epochCostMultiplier, buildingEraCostMultiplier — zamienić sufit na tablicę), `economy-upkeep.ts` (buildingUpkeep, magazynEraMultiplier, cap), `converters.ts` (converterThroughputForEra), `terrain-improvements.ts` (normalizeProductionEra — **napraw clamp**), `population-growth-v85.ts` (rationEraFoodCostMultiplier). Wszystkie czytają jedną tablicę.
- ✔ **Produkcja:** `production.ts` (itemCost, unitCostFromDef, gating rekrutacji `epoka≥2 → Koszary`, kaskada rekrutacji — R-EPOKA-KASKADA-JEDNA-Q1). Decyzja: jakie koszary/budynki wymaga E4/E5.
- ✔ **Ekonomia:** `economy.ts`, `turn-economy.ts`, `wealth.ts`, `society-breakdown.ts`, `citizen-resource-upkeep.ts`, `manpower.ts`, `power-objective.ts` (Power bez mnożnika — bez zmian). **NIE_ZMIERZONO** — wzory z epoką wymagają przeglądu.
- ✔ **Walka i AI:** `combat.ts`, `ai.ts`, `ai-era-unit-promotion.ts` (`promoteAiUnitForEra` — przez `epochNumber`), `ai-*`, `wonder-civ-tech.ts`, `wonder-availability.ts`, `militia` (combat-params). AI musi znać nowe jednostki i budynki.
- ✔ **Wojna wymuszona:** `forced-war-iron.ts`, `forced-war-common.ts` — uogólnić lub dodać moduły E4/E5 (wyzwalacz: awans epoki + próg tur od wejścia).
- ✔ **Dyplomacja/handel:** `diplomacy*.ts`, `diplomacy-tech-trade.ts` (wymiana techów — uwzględnić nowe epoki).
- ✔ **Cywilizacje:** `civ-entry-epoch.ts` (getCivEpokaWejscia), `wonder-civ-tech.ts`, `civ-test-hooks.ts`.
- ✔ **Mapa / start:** `map/newGameMapDefaults.ts`, `map/clusters.ts`, `map/cluster-spawn.ts`, `e-start-params-loader.ts` — **NIE_ZMIERZONO**, przegląd.
- ✔ **Zapisy:** `game/save.ts:116` (`SAVE_VERSION = 3`). Bump tylko, jeśli zmienia się format; zawsze test wczytania zapisu z E3.
- ✔ **Zwycięstwo:** `victory.ts` — **NIE_ZMIERZONO**, sprawdzić odniesienia do epoki.

### B3. UI (`gra/src/ui/`)

- ✔ Panel nauki i drzewko: `sciencePicker.ts` (kolumny, etykiety), `techTreeView.ts`, `scienceHubSnapshotLogic.ts`, `techDiscoveryNotice.ts`.
- ✔ Komunikaty: `era-change-notify.ts` (dopełniacze), `hud.ts`, `diploListHud.ts`.
- ✔ Miasto i budowa: `cityPanel.ts`, `buildModeHud.ts`, `unitRecruitCard.ts`, `entityCards/*Adapter.ts`, `hexContextTooltip.ts`.
- ✔ Kreator: `newGameFlow.ts` (epoka startowa, typy cywilizacji).
- ✔ Portrety i ikony: `leaderPortraits.ts`, `icons/brandAssets.ts`, `empireDetailPanel.ts`.
- ✔ **CivPedia / wikiBundle:** opisy budynków, jednostek, technologii i cudów (wpisy E4/E5). Przegląd: „obietnice w CivPedii” (AUDYT-CIVPEDIA-MARTWE-OBIETNICE.md).
- ✔ **Tooltipy i teksty:** bez „Żelazo jako ostatnia epoka” w tekstach stałych.
- ✔ **Tłumaczenia/teksty:** nazwy epok (nominatyw, dopełniacz, lokatyw), nazwy jednostek i budynków.

### B4. Grafika (3D, modele, ikony)

- ✔ Modele 3D i ikony nowych jednostek (`render/units.ts`, `render/jednostki-*.ts`) — wzorce: `kamien-lucznicy-opus5.ts`, `braz-konnica-opus5.ts`.
- ✔ Modele budynków (`render/improvements.ts` i wizualizacje miast).
- ✔ Ikony cudów, surowców i ulepszeń terenu.
- ✔ Muzyka epoki (`audio/muzyka-antyczna.ts`): ścieżka per epoka lub decyzja o wspólnej.

### B5. Testy

- ✔ **Testy nowe:** bramka epoki (nieznana epoka = błąd), kolejność epok, mnożniki (tablica), koszty tech (krzywa), wzrost magazynu, produkcja ulepszeń w E4 (regresja błędu #3 z A), awans epoki (capstone), jednostki bez linii = błąd walidacji.
- ✔ **Testy regresji:** E1–E3 bez zmian wartości (test parytetu), istniejące testy (`tools/epoka-merge-recruit-test.cjs`, `smoke_test.cjs`).
- ✔ **Walidator danych:** wszystkie prereq istnieją; każdy `epokaWejscia` ∈ znanych epok; każdy `W zamian za` i `Tech` istnieje; brak duplikatów nazw.
- ✔ **Build i uruchomienie:** zgodnie z regułami projektu (w `gra/` bez `npm run build`/`dev` w dispatchach analitycznych; wykonanie tylko w tematach kodowych wg R-PROC-AUTOBOT §9).

### B6. Wersja Rust (`rust-port/`, `src-tauri/`)

- ✔ Parity-v2: dane (eksport danych z gra/data), repin grafiki, wektory parytetu.
- ✔ Nie zaczynać przed stabilizacją danych w `gra/`.

### B7. Dokumentacja i rejestry

- ✔ `WERSJE.md` — **tylko przy deployu**, nie w dispatchu (zasada procesu).
- ✔ Rejestr pytań (`dyspozycje/PYTANIA-OTWARTE.md`) — wpisy decyzji przed startem.
- ✔ Dokumentacja balansu (`BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`) — wzory per epoka, aktualizacja.
- ✔ Opis epoki dla gracza (CivPedia), changelog w rejestrze tematów.

---

## C. Kolejność prac, zależności i podział na tematy

### C1. Graf zależności (ogólny)

```
R-EPOKA-FUNDAMENT-KOD-Q1 ──► R-EPOKA-SKALA-MNOZNIK-Q1 ──┐
        │                                              │
        ▼                                              ▼
R-DANE-E*-TECH-Q1 ──► R-DANE-E*-BUDYNKI-Q1 ──► R-DANE-E*-JEDNOSTKI-Q1 ──► R-DANE-E*-ULEPSZENIA-SUROWCE-CUDA-Q1
                                                                   │
                                                                   ▼
                                                  R-DANE-E*-CYWILIZACJE-Q1
                                                                   │
                                                                   ▼
R-SILNIK-E*-PRODUKCJA-EKONOMIA-Q1 ──► R-SILNIK-E*-WALKA-AI-Q1 ──► R-UI-E*-Q1 ──► R-GRAFIKA-E*-Q1
        │
        ▼
R-ZAPIS-E*-Q1 ──► R-TEST-E*-Q1 ──► R-BALANS-E*-Q1 ──► R-RUSTPORT-E*-Q1
```

Kolejność warstw: **dane → kod → UI → AI → grafika → zapisy → testy → balans → Rust**. Dane są pierwsze, bo kod i testy walidują liczby i identyfikatory z JSON.

### C2. Tematy i rozmiar

| ID tematu (propozycja) | Warstwa | Rozmiar | Zależy od | Ryzyko |
|---|---|---|---|---|
| R-EPOKA-FUNDAMENT-KOD-Q1 | Kod: stałe epok, clampy, błędy na nieznanej epoce | M | Q3 (numeracja) | H |
| R-EPOKA-SKALA-MNOZNIK-Q1 | Kod: tablica mnożników (kosztów, magazynu, konwerterów, ulepszeń, żywności) | M | FUNDAMENT, Q1, Q2 | H |
| R-DANE-E4-TECH-Q1 | Dane: 12 techów E4 | M | FUNDAMENT | M |
| R-DANE-E4-BUDYNKI-Q1 | Dane: 10 budynków E4 + wpis Młyna | M | TECH-E4 | M |
| R-DANE-E4-JEDNOSTKI-Q1 | Dane: 12 jednostek E4 (1 super) + counters | L | TECH-E4 | H |
| R-DANE-E4-ULEPSZENIA-SUROWCE-CUDA-Q1 | Dane: ulepszenia, surowce, cuda | M | BUDYNKI-E4 | M |
| R-DANE-E4-CYWILIZACJE-Q1 | Dane: wodzowie, unikalne, e-start | S | JEDNOSTKI-E4 | M |
| R-SILNIK-E4-PRODUKCJA-EKONOMIA-Q1 | Kod: produkcja, upkeep, magazyn, szczęście, Wealth | M | SKALA-MNOZNIK, dane E4 | H |
| R-SILNIK-E4-WALKA-AI-Q1 | Kod: walka, AI, wojna wymuszona, milicja | L | PRODUKCJA-EKONOMIA | H |
| R-UI-E4-Q1 | UI: sciencePicker, drzewko, etykiety, CivPedia, HUD | M | PRODUKCJA-EKONOMIA | M |
| R-GRAFIKA-E4-Q1 | Grafika: modele, ikony, portrety, muzyka | L | UI-E4 | M |
| R-ZAPIS-E4-Q1 | Zapisy: SAVE_VERSION, migracja | S | PRODUKCJA-EKONOMIA | M |
| R-TEST-E4-Q1 | Testy nowe i regresyjne | M | wszystkie E4 | M |
| R-BALANS-E4-Q1 | Symulacje AI-vs-AI, strojenie | L | TEST-E4 | H |
| R-RUSTPORT-E4-Q1 | Rust parity-v2 | L | BALANS-E4 | M |
| R-*-E5 (powtórka) | Ten sam łańcuch dla Średniowiecza | M | R-*-E4 | M |

Rozmiary: S ≈ 1 dispatch, M ≈ 2–3 dispatche, L ≈ 4+ dispatchy lub wiele rund.

### C3. Równoległość i konflikty plików

- **Sekwencyjnie (konflikt plików):** `research.ts`, `production.ts`, `building-stock-cost.ts`, `economy-upkeep.ts`, `main.ts`, `sciencePicker.ts` — dotykają ich wiele tematów; jeden temat naraz.
- **Równolegle (bezpieczne):** dane E4 (`tech.json`, `buildings.json`, `units.json`, `terrain-improvements.json`, `civs.json`) mogą iść w osobnych tematach, jeśli każdy ma własny plik. Uwaga: `units.json` i `buildings.json` są duże — jeden temat na plik.
- **Zakaz równoległości:** dwa tematy z tym samym `tech.json` (np. E4 i E5) — najpierw E4 do końca, potem E5 (wymóg prerequisitów i awansu).
- **Grafika i Rust:** zawsze po stabilizacji danych w `gra/` (dane są źródłem dla parity-v2).

---

## D. Bramki jakości (per etap)

| Etap | Bramka | Kryterium przejścia |
|---|---|---|
| Fundament kodu | Test nieznanej epoki | Nieznana epoka = błąd (nie Kamień, nie null) |
| Mnożniki | Test parytetu E1–E3 | Wartości identyczne z dzisiejszymi |
| Dane | Walidator JSON | Prereq, `epokaWejscia`, `Tech`, `W zamian za` — wszystkie istnieją; brak cykli |
| Ekonomia | Test 100 tur | Brak wycieków, czas tury w limicie (**NIE_ZMIERZONO** — zmierzyć) |
| Ekonomia | Test ulepszeń w E4 | Produkcja ×2,25 (nie ×1) w epoce 3 i ×3,375 w epoce 4 |
| AI | Symulacja AI-vs-AI per epoka | Żadna epoka nie jest zdominowana (wygrane w zakresie ustalonym przez właściciela) |
| Balans | Pomiar krzywej | Efektywny koszt wzrasta ~×2 na epokę (PROPOZYCJA) |
| UI | Przegląd w przeglądarce | Etykiety E4/E5 poprawne w panelu nauki, drzewku i powiadomieniu (wymóg realnej weryfikacji w przeglądarce) |
| Grafika | Przegląd wizualny | Każda nowa jednostka i budynek ma model/ikonę |
| Zapisy | Test wczytania | Zapis z E3 wczytany bez zmian |
| Rust | Wektory parytetu | Zgodne z `gra/` dla E1–E5 |

---

## E. Ryzyka i pułapki

1. **Sufit ×4 (`building-stock-cost.ts:72–81`).** Najgroźniejsza pułapka: bez zmiany E4/E5 mają takie same koszty jak Żelazo. Test musi sprawdzić wzrost, nie tylko poprawność wartości.
2. **Clamp w `normalizeProductionEra` (`terrain-improvements.ts:277–278`).** Produkcja ulepszeń spada w E4. Istnieje w kodzie już dziś, ujawni się po pierwszym awansie do E4.
3. **Nieznana nazwa epoki → cichy fallback** (`production.ts:207–215` → Kamień; `research.ts:261–285` → brak bramki). Zamienić na błąd walidacji przy ładowaniu danych.
4. **Konflikt numeracji `epokaWejscia`.** Dwa budynki Żelaza mają `epokaWejscia=4` (`buildings.json`). Po wprowadzeniu E4 jako Klasyczna ich mnożnik zmieni się nieoczekiwanie. Decyzja Q3 przed startem.
5. **Clamp w `sciencePicker.ts:524`.** Epoka 4 pokaże „Żelazo”. Widoczne od razu w UI.
6. **Ukryte założenie „3 epoki”** w `population-growth-v85.ts:48–49`, `livestock-unlock.ts:98` (`era<3`), `era-change-notify.ts:23–33`, `muzyka-antyczna.ts:17`. Każde wymaga decyzji, nie tylko zmiany liczby.
7. **Szczęście per epoka (`society-params.json`).** Tablice z „ostatnim wpisem” — po dodaniu E4 wartość może się cicho utrwalić. Potwierdzić fallback w kodzie (**NIE_ZMIERZONO**).
8. **Magazyn ×2^(e−1) bez limitu.** E5 = ×16 (cap 800 000 / typ przy bazie 50 000). Wpływ na zachowanie AI i gracza do zmierzenia (**NIE_ZMIERZONO**).
9. **Balans tech.** Krzywa ×1,15 na poziom + skok ×2 na epokę to PROPOZYCJA. Dane Żelaza mają nieregularności (Brązownictwo = 180 przy medianie poziomu 88). Testy balansu obowiązkowe.
10. **Dane jednostek: rozrzut HP i Ataku.** Istniejące linie mają HP 16–3600 i Atak 0–20. Nowe jednostki nie mogą mieć wartości poza zakresem bez uzasadnienia; kontry są **NIE_ZMIERZONO**.
11. **AI nieznające nowych jednostek.** `promoteAiUnitForEra` opiera się na `epochNumber`; bez wpisu w tabeli AI nie awansuje jednostek.
12. **Wojna wymuszona tylko dla Żelaza** (`forced-war-iron.ts`). Bez uogólnienia AI nie wypowie wojny w E4/E5 wg tej reguły.
13. **Cud wyłączny epoki** (`owner-epoch.ts`): bez przypisania cudów do E4/E5 awans wymaga tylko techów (Q7).
14. **Muzyka i grafika** — bez nich epoka „działa”, ale wygląda na niedokończoną. Zaplanować jako osobny temat.
15. **Rust parity.** Repin grafiki bez stabilnych danych wymusi wielokrotne repin. Zakaz przed końcem prac na `gra/`.
16. **Migracja zapisów.** Wczytanie zapisu z E3 po zmianie tablic — test obowiązkowy; `SAVE_VERSION` zmieniać tylko przy zmianie formatu.
17. **NIE_ZMIERZONO w `main.ts` (370 trafień regex).** Najbardziej zależny plik; przegląd linia po linii przed R-SILNIK.

---

## F. Szablon dispatchu (dla każdej warstwy)

Każdy dispatch zawiera:

1. **TEMAT** (pełne ID), **DOMAIN**, **RUNDA**.
2. **GOAL:** jedno zdanie celu końcowego i kryterium końca.
3. **ALLOWLISTA:** dokładne ścieżki plików (np. `gra/data/tech.json`). Zero wildcardów w `gra/**`.
4. **ZAKAZY:** `WERSJE.md` (dopiero przy deployu), `rust-port/**`, `src-tauri/**`, `battle/**` (jeśli nie dotyczy), `npm run build` / `dev` (w analizie), `git add -A`.
5. **KRYTERIA KOŃCA:** lista sprawdzalnych warunków (np. „walidator JSON zielony”, „test X dodany i przechodzi”, „zrzut ekranu panelu nauki z E4”).
6. **TESTY:** dokładne polecenia i oczekiwany wynik (`EXIT=0`).
7. **PARAMETRY:** wartości z arkusza SKALOWANIE (wersja A/B wg decyzji Q1).
8. **FORMAT RAPORTU:** STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK / DEPLOY-PUSH.
9. **WYKONANIE:** wszystko w pierwszym planie (bez `run_in_background`); raport zawiera SHA commitów i wyniki bramek.

---

## G. Pytania do właściciela (ABC — przed startem implementacji)

Pełna lista z rekomendacjami: arkusz PYTANIA_DO_WLASCICIELA (14 pozycji). Najważniejsze:

- **Q1 — mnożnik kosztu epoki:** A: ×8 / ×16 (kontynuacja podwajania) czy B: ×6 / ×9 (×1,5 na epokę). *Rekomendacja: A, z testem balansu.*
- **Q2 — sufit ×4:** zastąpić tablicą? *Rekomendacja: TAK (bez tego E4/E5 nie rosną).*
- **Q3 — numeracja `epokaWejscia`:** przenumerować Wielkie odlewnie (4 → 3) czy zmienić numerację epok. *Rekomendacja: przenumerować.*
- **Q4 — Młyn:** wodny (rzeka) w E4 + wiatrakowy poza rzeką w E5? *Rekomendacja: TAK, wiatrak jako odrębny budynek do decyzji.*
- **Q5 — nazwy epok:** Klasyczna / Średniowiecze. *Rekomendacja: jak w zleceniu.*
- **Q6 — 12 technologii na epokę.** *Rekomendacja: TAK.*
- **Q7 — cud wyłączny do awansu:** *Rekomendacja: TAK, zgodnie z obecnym mechanizmem.*
- **Q8 — nowe surowce:** Srebro w v1, reszta w v2. *Rekomendacja: jak wyżej.*
- **Q9 — konwerter:** liniowo (dziś). *Rekomendacja: TAK.*
- **Q10 — szczęście max:** 80 / 100 (PROPOZYCJA) po weryfikacji fallbacku.
- **Q11 — unikalne jednostki cywilizacji:** wszystkie 15 czy wybrane. *Rekomendacja: wybrane (6–8). Velites i Kataphraktos są współdzielone przez 3 cywilizacje każdy — traktowane jako warianty, nie unikaty (ZAŁOŻENIE do potwierdzenia).*
- **Q12 — epoka 6:** poza zakresem tego planu.
- **Q13 — wiatrak:** budynek (nie ulepszenie terenu).
- **Q14 — kolejność:** sekwencyjnie E4 → E5.

---

## H. Podsumowanie propozycji (PROPOZYCJA, nie fakt)

- **Technologie:** 12 na epokę; poziomy 10–12 (E4) i 13–15 (E5); koszt = 1100 × 1,15^(Poziom−10) dla E4 i 2200 × 1,15^(Poziom−13) dla E5.
- **Budynki:** 10 na epokę (E4: Forum, Termy, Amfiteatr, Hipodrom, Bank, Arsenał, Młyn wodny, Świątynia wielka, Biblioteka wielka, Mury kamienne; E5: Zamek, Katedra, Uniwersytet, Gildia kupców, Stajnia rycerska, Szpital, Młyn wiatrakowy, Kancelaria królewska, Zbrojownia, Port kogowy).
- **Jednostki:** 12 na epokę, w tym po jednej super-jednostce (Gwardia cesarska; Gwardia królewska).
- **Ulepszenia terenu:** 6 w E4, 4 w E5 (w tym Oliwnica, Winnica, Kopalnia srebra, Droga cesarska, Gospodarstwo trójpolowe).
- **Surowce:** Srebro (E4), Oliwa (E4), Wino (E4), Skóra (E4), Wosk (E5 — opcjonalny).
- **Cuda:** aktywacja parkowanych (Nalanda, Mauzoleum Teodoryka — E4; Angkor Wat — E5) + nowe propozycje (Partenon, Forum Trajana, Wielka Biblioteka Aleksandrii — E4; Hagia Sophia, Alhambra, Katedra w Chartres — E5).
- **Skalowanie:** efektywny koszt ×2 na epokę (A: 1, 2, 4, 8, 16). Wariant B: 1, 2, 4, 6, 9.

---

## I. Załącznik: pełna lista miejsc zależnych od epoki (61 pozycji, z audytu)

Źródło: arkusz `AUDYT_ZALEZNOSCI` (ten sam zestaw, pełne opisy w arkuszu). Lista służy jako lista kontrolna przy każdej kolejnej epoce: przy każdej pozycji sprawdź, czy wymaga zmiany, i odnotuj decyzję. Stan: FAKT = zmierzone w kodzie/danych; NIE_ZMIERZONO = do pomiaru w kolejnym temacie.

| Nr | Plik | Linia / miejsce | Co zależy od epoki | Stan |
|---|---|---|---|---|
| 1 | `gra/data/tech.json` | — | 32 techy; Epoka: Kamień 12 / Brąz 12 / Żelazo 8; awansDoE… | FAKT |
| 2 | `gra/data/tech.json` | pole Koszt nauki | Koszt bazowy = tempo szybkie x1; tempo x2/x4 w tech-tempo.ts | FAKT |
| 3 | `gra/data/buildings.json` | pola epokaWejscia, maksPoziom, kosztBudowy, przyrostKosztu, utrzymanie, przyrostUtrzymania, techUnlock | 42 budynki; epokaWejscia 1–4; Wielka odlewnia i Wielka Ku… | FAKT |
| 4 | `gra/data/units.json` | pole Epoka (string), Pieniądz (koszt), Dostępna w epokach, W zamian za | 75 jednostek; Epoka: Kamień 11 / Brąz 39 / Żelazo 25 | FAKT |
| 5 | `gra/data/terrain-improvements.json` | _meta.epoka; pola epoka per ulepszenie | Epoka 1=Kamień, 2=Brąz, 3=Żelazo; np. fort (E3), droga_br… | FAKT |
| 6 | `gra/data/epoka-ludnosc-manpower.json` | epoki[] wiersze 1–10 | Ludność/manpower na ludka: E1 10k/1000, E2 20k/2000, E3 4… | FAKT |
| 7 | `gra/data/econ-params.json` | ~513–525 wealth_cap_na_epoke; ~610–620 magazyn_baza_surowce / magazyn_bonus_surowce_na_budynek | Wealth cap = epoka×10; magazyn = FLAT (E1), ×2^(e-1) w ko… | FAKT |
| 8 | `gra/data/society-params.json` | szczescie_max_epoka (easy [20,40,60]); szczescie_skala_kultura_religia (x(e) formuła, komentarz ~linia 248) | Tablice per epoka; wg komentarza JSON „epoki dalsze biorą… | FAKT (komentarz) |
| 9 | `gra/data/power-params.json` | ~16–20 mnoznikEpoki (wszystkie 1); ~108–112 mnoznik_epoki_aktywny=false | Power NIE mnożona przez epokę (P-B odrzucone) | FAKT |
| 10 | `gra/data/wonders.json` | parkowane_epoka4plus (nalanda E4, mauzoleum_teodoryka E4, angkor_wat E5, wielki_dzwon E6, kopiec_grobowy E1); cuda[] 19 wpisów | Cuda parkowane pod E4–E6 już istnieją w danych | FAKT |
| 11 | `gra/data/civs.json` | cywilizacje[] (15); epokaWejscia (kamien/braz/zelazo); wodzowie {kamien,braz,zelazo,antyk} | Wodzowie dla E4/E5 brak; klucz antyk istnieje | FAKT |
| 12 | `gra/data/e-start-params.json` | typy_cywilizacji_per_epoka: kamien/braz/zelazo (default/min/max) | Limity typów cywilizacji per epoka startu (3 klucze) | FAKT |
| 13 | `gra/data/combat-params.json` | militia_roster — typy wg EPOKI właściciela (komentarz R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1) | Milicja wybiera jednostki wg epoki | FAKT |
| 14 | `gra/data/resources.json` | 15 surowców (Żywność…Stal); brak pola epoka | Brak nowych surowców E4/E5 | FAKT |
| 15 | `gra/data/counters.json, auto-battle-params.json, terrain-combat.json` | — | Kontry i parametry walki — zależne od linii jednostek | NIE_ZMIERZONO |
| 16 | `gra/data/ai-params.json, civ-ai.json, civ-matrix.json, civ-params.json` | ~ liczne (ai-params: „epoka Brązu” dla obozów nadmorskich; 17× ai_tolerancja_ryzyka) | Parametry AI per cywilizacja i epoka — NIE_ZMIERZONO pełn… | NIE_ZMIERZONO |
| 17 | `gra/data/ui-params.json` | etykiety kreatora (epoki) | Etykiety epok w kreatorze | NIE_ZMIERZONO |
| 18 | `gra/data/diplomacy*.json, war-*-params.json, diplomacy-tick-params.json` | ~ liczne trafienia „epok” | Dyplomacja/wojna wymuszona zależna od epoki | NIE_ZMIERZONO |
| 19 | `gra/src/game/civ-entry-epoch.ts` | 10–11 GAME_EPOCH_ORDER=[kamien,braz,zelazo] + typ GameEpochId; 21–23 gameEpochIndex; 78–81 EPOCH_HUD_LABELS (3); 85–86 clamp do długości tablicy | Stała tablica 3 epok; poza nią clamp do ostatniej | FAKT |
| 20 | `gra/src/game/research.ts` | 253–257 NUMER_EPOKI (3 wpisy); 261–268 epochNumber (nieznana → null); 272–285 epochGateMet (null → bramka spełniona) | Nowe nazwy epok bez wpisu = techy BEZ bramki epoki (cicho) | FAKT |
| 21 | `gra/src/game/research.ts` | 323 KOLEJNOSC_EPOK; 370–386 techCost (fallback +8/epokę gdy brak Koszt nauki) | Fallback kosztu i kolejność epok | FAKT |
| 22 | `gra/src/game/production.ts` | 198–215 EPOCH_BY_NAME (3 pary) + epochNumber (nieznane → 1 = Kamień!) | Jednostka z nową nazwą epoki będzie traktowana jak Kamień… | FAKT |
| 23 | `gra/src/game/production.ts` | 343–365 itemCost budynku × buildingEraCostMultiplier; 369 jednostka scaleCostByEpoch; 1041–1067 gating rekrutacji (epoka≥2 → wymagane Koszary) | Koszt budowy/jednostek i bramka Koszar | FAKT |
| 24 | `gra/src/game/building-stock-cost.ts` | 60–67 scaleCostByEpoch; 72–81 epochCostMultiplier + buildingEraCostMultiplier: >=3 → 4 (SUFIT ×4) | Płaski sufit ×4 dla każdej epoki ≥3 — E4/E5 nie rosną | FAKT |
| 25 | `gra/src/game/building-stock-cost.ts` | ~86–104 buildingStockCost (FALA2 ×2, potem era mult) | koszt_surowce budynku × FALA2 × mnożnik epoki | FAKT |
| 26 | `gra/src/game/building-stock-cost.ts` | 412, 417 — koszt surowcowy jednostek (scaleCostByEpoch) | Koszt surowców jednostek skalowany epoką | FAKT |
| 27 | `gra/src/game/economy-upkeep.ts` | 392–395 magazynEraMultiplier = 2^(e−1) (bez limitu); 454 cap = (baza+bonus×n)×mult | Cap magazynu rośnie ×2/epokę: E5 = ×16 | FAKT |
| 28 | `gra/src/game/economy-upkeep.ts` | ~629–655 buildingUpkeep = floor(floor(...)×2) × buildingEraCostMultiplier (SUFIT ×4) | Utrzymanie budynków — ten sam sufit ×4 | FAKT |
| 29 | `gra/src/game/economy-upkeep.ts` | 794, 1020, 1088 scaleCostByEpoch (utrzymanie/żywność jednostek) | Utrzymanie jednostek skalowane epoką | FAKT |
| 30 | `gra/src/game/converters.ts` | 142–150 converterThroughputForEra = base×(1+0.10×(e−1)) liniowo | Przepustowość konwerterów rośnie liniowo | FAKT |
| 31 | `gra/src/game/terrain-improvements.ts` | 270–288 normalizeProductionEra() zwraca 1|2|3 (era≥4 → 1!) i ×1.5^(e−1) | BŁĄD UTAJONY: po wejściu w E4 produkcja ulepszeń wraca do… | FAKT |
| 32 | `gra/src/game/population-growth-v85.ts` | 47–50 rationEraFoodCostMultiplier: ≤1→1, 2→2, inaczej 4 (plateau) | Koszt żywności obywateli: E4/E5 = ×4 (bez wzrostu) | FAKT |
| 33 | `gra/src/game/terrain-improvements.ts` | — | Wykrycie epoki gracza dla ulepszeń (improvement-tech.ts:7… | FAKT |
| 34 | `gra/src/game/livestock-unlock.ts` | 98 if (isNewWorldCiv && era<3) false | Nowy Świat: bydło/owce od epoki 3 (hardcode liczby) | FAKT |
| 35 | `gra/src/game/era-gate-ui.ts` | 23–30 eraLabelForNumber (fallback „Epoka N”); 87 maxEra = maxDefinedEra(techRows) (auto) | Etykiety epok; maxEra liczony z danych (dobrze) | FAKT |
| 36 | `gra/src/game/era-change-notify.ts` | 23–33 ERA_GENITIVE_LABELS {1:Kamienia,2:Brązu,3:Żelaza}; 27–29 fallback „nr N” | Powiadomienie o awansie: E4 pokaże „nr 4” | FAKT |
| 37 | `gra/src/game/owner-epoch.ts` | 91–93 maxDefinedEra (auto z tech.json); 106–122 computeMainCivEraFromResearch (cap min(10), gate: wszystkie techy epoki + cud wyłączny) | Awans epoki per właściciel — dobrze skalowany danymi; wym… | FAKT |
| 38 | `gra/src/game/playerState.ts` | 216 epochNumber(TechDef); ~199, 310–323 awansDoEpoki | Zasada: awans przez jawne pole awansDoEpoki | FAKT |
| 39 | `gra/src/game/forced-war-iron.ts` | 17–30 wojna wymuszona w Żelazie (WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI=25); forced-war-common.ts | Wojna wymuszona tylko dla Żelaza (osobny plik) | FAKT |
| 40 | `gra/src/game/save.ts` | 116 SAVE_VERSION = 3 | Format zapisu; epoka zapisywana (do potwierdzenia jako li… | FAKT |
| 41 | `gra/src/ui/sciencePicker.ts` | 518–525 EPOCH_ORDER = [Kamień,Brąz,Żelazo]; clamp Math.min(length−1) | Epoka 4 pokaże etykietę „Żelazo” (BŁĄD UTAJONY) | FAKT |
| 42 | `gra/src/ui/newGameFlow.ts` | 520 START_EPOCH_ORDER = [kamien,braz,zelazo]; 2411–2413 epochHasCivs / civsForEpoch | Kreator: wybór epoki startowej (3 opcje) | FAKT |
| 43 | `gra/src/ui/techTreeView.ts` | 23 trafienia (regex epok) | Drzewko technologii: kolumny per epoka | NIE_ZMIERZONO (bez przeglądu) |
| 44 | `gra/src/ui/sciencePicker.ts, ui/scienceHubSnapshotLogic.ts, ui/techDiscoveryNotice.ts` | trafienia regex (101 / 16 / 6) | Panel nauki i powiadomienia o odkryciu | NIE_ZMIERZONO (bez przeglądu) |
| 45 | `gra/src/ui/cityPanel.ts, ui/hud.ts, ui/buildModeHud.ts, ui/unitRecruitCard.ts` | 125 / 16 / 6 / 6 trafień | Panel miasta, HUD, rekrutacja — etykiety i kolejność epok | NIE_ZMIERZONO (bez przeglądu) |
| 46 | `gra/src/ui/leaderPortraits.ts, ui/icons/brandAssets.ts, ui/empireDetailPanel.ts` | 16 / 19 / (empireDetailPanel: trafienia) | Portrety wodzów wg epoki, ikony | NIE_ZMIERZONO (bez przeglądu) |
| 47 | `gra/src/ui/newGameFlow.ts` | 139 trafień (regex) | Kreator nowej gry: epoka, typy cywilizacji, mapa | NIE_ZMIERZONO (bez przeglądu) |
| 48 | `gra/src/main.ts` | 370 trafień regex (najwięcej w projekcie) | Główny plik gry — tury, zmiana epoki, toasty, AI | NIE_ZMIERZONO (bez przeglądu) |
| 49 | `gra/src/game/ai.ts` | 28 trafień; ai-era-unit-promotion.ts (promoteAiUnitForEra: epochNumber dep) | AI awansuje jednostki przy zmianie epoki (przez epochNumber) | FAKT (struktura) |
| 50 | `gra/src/game/wonder-civ-tech.ts, wonder-availability.ts, wonders-data.ts` | 35 / 14 / 4 trafienia | Dostępność cudów wg epoki i bramki techUnlock | NIE_ZMIERZONO (bez przeglądu) |
| 51 | `gra/src/game/economy.ts, turn-economy.ts, wealth.ts, society-breakdown.ts, citizen-resource-upkeep.ts` | 12 / 14 / 25 / 49 / 14 trafień | Ekonomia, Wealth (epoka×10), szczęście (x per epoka), upk… | FAKT (wealth) / NIE_ZMIERZONO (reszta) |
| 52 | `gra/src/game/manpower.ts` | 88 trafień | Manpower/ludność per epoka (wiersze JSON 1–10) | FAKT (dane 1–10) / NIE_ZMIERZONO (kod) |
| 53 | `gra/src/game/production.ts` | 95 trafień (regex); ~1028–1040 R-EPOKA-KASKADA-JEDNA-Q1 | Kaskada rekrutacji epok (Zwiadowca wyjątek) | FAKT (komentarz) |
| 54 | `gra/src/battle/battleScene.ts, gra/src/game/combat.ts, render/units.ts` | 4 / (combat.ts) / 6 trafień | Kontry i render jednostek per linia | NIE_ZMIERZONO (bez przeglądu) |
| 55 | `gra/src/render/kamien-lucznicy-opus5.ts, render/braz-konnica-opus5.ts, render/jednostki-p6-super.ts, render/jednostki-z3-plemiona.ts, render/improvements.ts` | 3 / 3 / 3 / 5 / 24 trafień | Modele 3D i ikony per epoka/linia | FAKT (nazwy plików) / NIE_ZMIERZONO |
| 56 | `gra/src/audio/muzyka-antyczna.ts` | 17 setEra (1=Kamień, 2=Brąz; era≥3 „na razie”); 400 if era===2; 1407–1409 playlist; 1492 buildDron if era===2 | Muzyka epok: tylko 1 i 2 mają własne ścieżki | FAKT |
| 57 | `gra/src/map/newGameMapDefaults.ts, map/clusters.ts, map/cluster-spawn.ts, map/improvement-build.ts` | 52 / 22 / 3 / 6 trafień | Generator mapy i zasoby startowe per epoka | NIE_ZMIERZONO (bez przeglądu) |
| 58 | `gra/src/data/e-start-params-loader.ts, data/loader.ts` | 17 / 6 trafień | Loader parametrów startu i danych | NIE_ZMIERZONO (bez przeglądu) |
| 59 | `gra/src/game/civ-test-hooks.ts, tools/*.cjs (testy epok)` | 3 trafienia (civ-test-hooks); tools/epoka-merge-recruit-test.cjs | Testy epok wymagają aktualizacji (liczba epok = 3 w założ… | FAKT (istnieje test) |
| 60 | `gra/src/game/victory.ts` | 3 trafienia (Żelazo w tekście) | Warunki zwycięstwa powiązane z epoką? | NIE_ZMIERZONO |
| 61 | `rust-port/** (poza zakresem tej rundy — tylko wzmianka)` | — | Port Rust: dane, repin, wektory parytetu | NIE_ZMIERZONO |
