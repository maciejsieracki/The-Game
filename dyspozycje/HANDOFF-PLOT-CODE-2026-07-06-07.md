# HANDOFF plot code — sesja 2026-07-06 / 2026-07-07

> **Cel:** kontynuacja pracy z repo bez historii czatu.  
> **Wejście do gry:** `gra-robocza/START.html` → **Ctrl+F5** przed każdą nową grą.  
> **Kod źródłowy:** wyłącznie `gra/src/` (nie `gra-robocza/src/`).

---

## Build aktualny

| Pole | Wartość |
|------|---------|
| **Plik** | `gra-robocza/Gra-ROBOCZA.html` |
| **START** | `gra-robocza/START.html` |
| **MD5** | `70b28d10abfe641ce08b68e7a3efa430` |
| **Data publish** | 2026-07-07T22:49:56 |
| **Manifest** | `gra-robocza/ROBOCZA-MANIFEST.json` |
| **Publisher** | Integrator F |

**Łańcuch buildów 07.07 (wieczór → najnowszy):**

| Czas | MD5 (skrót) | Co weszło |
|------|-------------|-----------|
| 16:45 | `ae03f50d…` | Batch playtest B1–B12, klaster, kreator, nazwy, asymetria |
| wieczór | `ee4355af…` | Kolory cywilizacji (`kolorHex` ×15) |
| wieczór | `8fd0dbfc…` | A3 marsz redesign (planned march) |
| ~22:20 | `eead06d7…` | Overlay robotników (E-WORKER-1=A) |
| ~22:25 | `e2c5c711…` | Obwódki w kolorach frakcji (miasta + jednostki) |
| ~22:44 | `8c764e4b…` | **B13** fix BOOT ERROR (cykl importów civ-names ↔ city-names-pool) |
| ~22:50+ | `70b28d10…` | **B14** fix TDZ `anim` w main.ts (refreshFog przed init) — **Maciej: działa** |

---

## Wdrożone (lista skrócona)

### Playtest fixes (06–07.07, build `ae03f50d` + późniejsze)

- **B1** — jeden blok „Surowce w zasięgu" w stopce panelu (`cityPanel.ts`)
- **B2/B2-Q1=B** — panel handlu: zakładki + scroll, suwaki na „Podział handlu i zamożność"
- **B3** — menu pauzy: SVG zamiast emoji (`gamePauseMenu.ts`)
- **B4** — badania: klik w drzewku ustawia cel; przycisk drzewka pod celem; SVG (funkcja; grafika drzewka nadal backlog)
- **B5** — overlay końca tury (`turnTransitionOverlay.ts`)
- **B6** — HUD PAŃSTWO tylko imperium gracza (`hud.ts`, `turn-economy.ts`)
- **B7** — kolejki budowy + rekrutacji na górze panelu Produkcja
- **B8** — strzałki ‹ › nawigacja miast (`cityUxFrame.ts`)
- **B9** — „Zebrana Praca" zaokrąglona do liczb całkowitych
- **B10** — nadprodukcja pracy → kolejny budynek lub pula imperium
- **B11** — refund przy anulowaniu rekrutacji z kolejki
- **B12** — epoka kamienia na starcie (`owner-epoch.ts`)
- **MAP-Q1** — chip ☠ na głodującym stosie armii

### Mapa, AI, start (07.07)

- **Klaster + AI faza 1** — 1 klaster ~3 hex per cywilizacja; founding na obwodzie; stolice obcego typu najpierw przejmują państwa w klastrze (`cluster-spawn.ts`, `ai.ts`, `cluster-start.ts`)
- **A3 (stary MVP)** — Shift+auto-marsz (zastąpiony wieczorem przez A3-P0-REDESIGN)

### Kreator i balans (07.07)

- Tempo badań ×1/×2/×4 (naprawa odwróconych mnożników)
- Koszty budynków ×1/×2/×4 Pracy
- Koszty jednostek ×1/×2/×4 złota
- Wzrost ludności ×1/×2/×4 progu żywności
- Asymetria trudności (koszty + wzrost ludności)
- Las +1 Praca (Równina+Las: 3→4)
- Cap ludności 5 bez / 15 z Akweduktem

### Nazwy i wyświetlanie (07.07)

- Pule nazw 100 founding + 10 państw × 15 cywilizacji (`city-names-pools.json`, `city-names-pool.ts`)
- Pipeline Excel→JSON (`import-city-names-from-xlsx.py`)
- **D-display** — dopisek `· miasto-państwo` dla państw klastra (`display-names.ts`)

### Wieczór 22:00+ (07.07)

- **A3-P0-REDESIGN** — marsz bez Shift: planned march, markery tur, Stop/Kontynuuj, save/load (`planned-march.ts`, `main.ts`)
- **Kolory cywilizacji (B)** — `kolorHex` resolver, mapa/minimapa/dyplomacja/HUD (`civ-visual.ts`, `civs.json`)
- **Obwódki frakcji** — heks miasta + ring jednostek w `kolorHex`; wojna = civ color + czerwony akcent (`cities.ts`, `units.ts`)
- **E-WORKER-1=A** — toggle 👤 przy minimapie, overlay robotników ze wszystkich miast gracza (`workerFieldOverlay.ts`, `okolica.ts`)

---

## Decyzje Macieja (ZAMKNIĘTE)

| ID | Litera | Cytat / treść (skrót) | Dokument |
|----|--------|------------------------|----------|
| **A3-P0-REDESIGN** | — | Klik bez Shift → ścieżka + markery tur; STOP przy przeszkodzie; przerwanie = nowy cel lub Stop | [`docs/decyzje/A3-marsz-sciezka-2026-07-07.md`](../docs/decyzje/A3-marsz-sciezka-2026-07-07.md) |
| **A3-P0-2** | **B** | „Zapisujemy marsz w save; po wczytaniu kontynuuje" | [`docs/decyzje/A3-P0-2-save-marsz.md`](../docs/decyzje/A3-P0-2-save-marsz.md) |
| **A3-P0-3** | **A** | Cel planowany bez natychmiastowego ruchu; segment po end-turn lub Kontynuuj | [`docs/decyzje/A3-P0-3-timing-marszu.md`](../docs/decyzje/A3-P0-3-timing-marszu.md) |
| **A3-Q1** (poprzednik) | **A** | Shift+auto-marsz MVP — **zastąpiony** przez A3-P0-REDESIGN | [`docs/decyzje/A3-shift-auto-marsz.md`](../docs/decyzje/A3-shift-auto-marsz.md) |
| **E-WORKER-1** | **A** | Overlay robotników = wszystkie pola 👤 ze wszystkich miast gracza | [`docs/decyzje/E-map-worker-overlay-2026-07-07.md`](../docs/decyzje/E-map-worker-overlay-2026-07-07.md) |
| **D-display** | — | Dopisek `· miasto-państwo` dla państw klastra (nie imperium) | [`docs/decyzje/D-display-miasto-panstwo-2026-07-07.md`](../docs/decyzje/D-display-miasto-panstwo-2026-07-07.md) |
| **B-kolory** | **B** | `kolorHex` per cywilizacja na mapie, jednostkach, dyplomacji | (wdrożenie `civ-visual.ts`; brak osobnego pliku decyzji — cytat w sesji 07.07) |
| **B1-Q1** | **B** | Jeden blok surowców w stopce | [`docs/decyzje/B1-panel-surowce.md`](../docs/decyzje/B1-panel-surowce.md) |
| **B2-Q1** | **B** | Panel handlu: zakładki + scroll (bez powrotu do szkieletu designera) | [`docs/decyzje/B2-Q1-panel-handlu-zakladki.md`](../docs/decyzje/B2-Q1-panel-handlu-zakladki.md) |
| **B3-Q1** | **A** | Menu pauzy: SVG zamiast emoji | [`docs/decyzje/B3-B4-ui-svg-badania.md`](../docs/decyzje/B3-B4-ui-svg-badania.md) |
| **B4-Q1/2/3** | **A** | Wybór tech z drzewka; SVG; przycisk drzewka u góry | j.w. |
| **B5** | **A** | Overlay końca tury z paskiem i „Teraz gra: …" | [`docs/decyzje/B5-koniec-tury-feedback.md`](../docs/decyzje/B5-koniec-tury-feedback.md) |
| **B6-Q1** | **A** | HUD PAŃSTWO = tylko imperium gracza | [`docs/decyzje/B6-hud-panstwo.md`](../docs/decyzje/B6-hud-panstwo.md) |
| **B7-Q1** | **A** | Kolejki budowy + rekrutacji na górze | [`docs/decyzje/B7-B8-produkcja-miasto-nav.md`](../docs/decyzje/B7-B8-produkcja-miasto-nav.md) |
| **B8-Q1** | **B** | Strzałki ‹ › przy nazwie miasta | j.w. |
| **B9-Q1** | **B** | Zaokrąglenie Zebranej Pracy w UI | [`docs/decyzje/B9-B10-produkcja-praca.md`](../docs/decyzje/B9-B10-produkcja-praca.md) |
| **B10-Q1** | **A** | Nadwyżka pracy → kolejny budynek lub pula imperium | j.w. |
| **MAP-Q1** | — | Chip ☠ na głodującym stosie | [`docs/decyzje/MAP-Q1-glod-jednostka.md`](../docs/decyzje/MAP-Q1-glod-jednostka.md) |
| **CLUSTER-AI-F1** | — | Klaster ~3 hex; AI faza 1 (przejęcie przed ekspansją) | [`docs/decyzje/CLUSTER-KRAWEDZ-AI-FAZA1-2026-07-07.md`](../docs/decyzje/CLUSTER-KRAWEDZ-AI-FAZA1-2026-07-07.md) |
| **B-tempo-badań** | — | Szybka ×1 / Standardowa ×2 / Długa ×4 | [`docs/decyzje/B-tempo-badania-2026-07-07.md`](../docs/decyzje/B-tempo-badania-2026-07-07.md) |
| **B-koszty-budynków** | — | Niski/Normalny/Wysoki ×1/×2/×4 Pracy | [`docs/decyzje/B-koszty-budynkow-tempo-2026-07-07.md`](../docs/decyzje/B-koszty-budynkow-tempo-2026-07-07.md) |
| **B-koszty-jednostek** | — | Niski/Normalny/Wysoki ×1/×2/×4 złota | [`docs/decyzje/B-koszty-jednostek-tempo-2026-07-07.md`](../docs/decyzje/B-koszty-jednostek-tempo-2026-07-07.md) |
| **B-trudność-asymetria** | — | Łatwa/Trudna asymetria kosztów | [`docs/decyzje/B-trudnosc-koszty-asymetria-2026-07-07.md`](../docs/decyzje/B-trudnosc-koszty-asymetria-2026-07-07.md) |
| **B-wzrost-ludności** | — | Wysoki/Normalny/Wolny ×1/×2/×4 | [`docs/decyzje/B-wzrost-ludnosci-tempo-2026-07-07.md`](../docs/decyzje/B-wzrost-ludnosci-tempo-2026-07-07.md) |
| **B-las-produkcja** | — | Las +1 Praca | [`docs/decyzje/B-las-produkcja-2026-07-07.md`](../docs/decyzje/B-las-produkcja-2026-07-07.md) |
| **B-city-names** | — | Pule 100+10 nazw | [`docs/decyzje/B-city-names-pools-2026-07-07.md`](../docs/decyzje/B-city-names-pools-2026-07-07.md) |
| **D-nazwy-miast** | — | Wiring pul nazw + auto-nazwy AI | [`docs/decyzje/D-nazwy-miast-pule-2026-07-07.md`](../docs/decyzje/D-nazwy-miast-pule-2026-07-07.md) |
| **B-popcap** | partial | Cap 5/15 z Akweduktem wdrożony; epoka IV >15 **bez ABC** | [`docs/decyzje/B-popcap-akwedukt-audit.md`](../docs/decyzje/B-popcap-akwedukt-audit.md) |

**Spec implementacji A3:** [`docs/decyzje/A3-SPEC-WDROZENIA.md`](../docs/decyzje/A3-SPEC-WDROZENIA.md)

---

## OTWARTE / bez ABC

| Temat | Status | Uwagi |
|-------|--------|-------|
| **Wasalizacja AI faza 1** | Nie wdrożona | Priorytet AI = przejęcie wojskiem; wasalizacja odłożona |
| **Epoka IV, ludność >15** | Szkic ABC w `B-popcap-akwedukt-audit.md` (rekomendacja A: ulepszony Akwedukt) | **Bez implementacji** — czeka na ABC Macieja |
| **Banery / infografiki badań** | Backlog designu | B4 część graficzna — emoji/przestarzałe drzewko wizualnie |
| **Kanon / FINALNA** | Nie promowane po 07.07 | Ostatni kanon: `7856d345…` (06.07); robocza `e2c5c711…` — **duży dryf** |
| **Excel → gra (nazwy)** | Pipeline gotowy | Maciej edytuje `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` → hasło „eksportuj nazwy miast" |
| **A3 edge case'y** | Nieweryfikowane | Blokada terenu, koniec ruchu w połowie trasy, detour |
| **B2 (kanon nadpisany)** | OTWARTY operacyjnie | Brak punktu przywrócenia starego panelu; decyzja B2-Q1=B = nowy układ zakładek |

---

## Błędy playtestu — status (źródło: `REJESTR-BUGOW-PLAYTEST-2026-07-06.md`)

| ID | Temat | Status w kodzie (07.07) | Uwagi |
|----|-------|-------------------------|-------|
| **B1** | Duplikat „Surowce w zasięgu" | ✅ **NAPRAWIONE** (B1-Q1) | Do weryfikacji wizualnej po `e2c5c711…` |
| **B2** | Kanon nadpisany roboczą | ⚠️ **OTWARTY** (operacyjny) | Model handlu zamknięty B2-Q1=B |
| **B3** | Stare menu pauzy (emoji) | ✅ **NAPRAWIONE** (B3-Q1=A) | W buildzie `ae03f50d+` |
| **B4** | Badania + drzewko | 🟡 **CZĘŚCIOWO** | Funkcja (klik, pozycja przycisku) ✅; infografiki/dizajn drzewka ❌ |
| **B5** | Feedback końca tury | ✅ **NAPRAWIONE** | Overlay wdrożony |
| **B6** | Rozjazd PAŃSTWO vs MIASTO | ✅ **NAPRAWIONE** (B6-Q1=A) | Tylko imperium gracza; pełny audyt agregacji nie był tematem |
| **B7** | Kolejka rekrutacji na dole | ✅ **NAPRAWIONE** (B7-Q1=A) | |
| **B8** | Brak prev/next miast | ✅ **NAPRAWIONE** (B8-Q1=B) | |
| **B9** | Float garbage w Pracy | ✅ **NAPRAWIONE** (B9-Q1=B) | |
| **B10** | Nadprodukcja pracy | ✅ **NAPRAWIONE** (B10-Q1=A) | |
| **B11** | Brak refundu rekrutacji | ✅ **NAPRAWIONE** | |
| **B12** | Brąz zamiast Kamienia na starcie | ✅ **NAPRAWIONE** | `owner-epoch-test.cjs` |

**Rejestr źródłowy:** [`dyspozycje/REJESTR-BUGOW-PLAYTEST-2026-07-06.md`](REJESTR-BUGOW-PLAYTEST-2026-07-06.md)  
**Raport dnia:** [`dyspozycje/RAPORT-DZIEN-2026-07-07.md`](RAPORT-DZIEN-2026-07-07.md)

---

## Następny krok plot code — priorytety

1. **Wasalizacja AI faza 1** — jedyna duża mechanika gameplay z 07.07 bez wdrożenia; kontrakt w `CLUSTER-KRAWEDZ-AI-FAZA1` (faza 1 = przejęcie wojskiem, wasalizacja = faza 2?).
2. **ABC epoka IV >15 ludności** — szkic gotowy (`B-popcap-akwedukt-audit.md`); po decyzji Macieja → implementacja ulepszonego Akweduktu / nowy cap.
3. **Weryfikacja + edge case'y A3 planned march** — blokada terenu, save/load w trakcie marszu, STOP przy przeszkodzie; test `planned-march-test.cjs` 11/11, brak testu wizualnego.

---

## Pliki kluczowe (szybki start)

| Obszar | Pliki |
|--------|-------|
| Marsz | `gra/src/game/planned-march.ts`, `gra/src/main.ts` |
| Kolory/obwódki | `gra/src/game/civ-visual.ts`, `gra/src/render/cities.ts`, `gra/src/render/units.ts` |
| Worker overlay | `gra/src/render/workerFieldOverlay.ts`, `gra/src/game/okolica.ts` |
| Display names | `gra/src/game/display-names.ts` |
| Klaster/AI | `gra/src/map/cluster-spawn.ts`, `gra/src/game/ai.ts`, `gra/src/game/cluster-start.ts` |
| Kreator | `gra/src/ui/newGameFlow.ts`, `gra/data/ui-params.json` |
| Testy | `gra/tools/planned-march-test.cjs`, `display-names-test.cjs`, `civ-visual-test.cjs`, `difficulty-cost-test.cjs` |

**Maciej gotowe:** [`docs/MACIEJ-GOTOWE.md`](../docs/MACIEJ-GOTOWE.md)  
**Rejestr decyzji:** [`docs/obieg/REJESTR-DECYZJI.md`](../docs/obieg/REJESTR-DECYZJI.md)

---

*Zapisano: 2026-07-07 wieczór — dla `plot code`.*
