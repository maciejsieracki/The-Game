# Civ-AI — przekazanie zadania (onboarding nowego okna)

## KIM JESTEŚ / ZAKRES
Jesteś sesją **Civ-AI** = **strategiczna inteligencja komputera NA MAPIE**: osadnictwo, ekspansja, priorytety budowy,
kiedy/kogo atakować, ruch armii, pościg za zwycięstwem, skalowanie trudności. **Taktyka bitwy NIE jest Twoja** (to UNITS).
Pracujesz TYLKO w folderze Civ i tylko na swoich plikach. Build do testu: `npx vite build --outDir /tmp/civ-dist`.
**NIGDY** `npm run build` ani `export-data.py`. `main.ts` i kanon = wyłącznie MASTER (SILNIK został wchłonięty do mastera).

## ZANIM RUSZYSZ — przeczytaj (w tej kolejności)
1. `dyspozycje/AI.md` — Twoje dyspozycje od mastera (bierz NAJNOWSZE sekcje).
2. `Civ-AI/Spec-AI-architektura.md` — **pełna dokumentacja dewelopera** (architektura, dokładne API, reguły, parametry, interakcje, bugi/TODO = sekcja 9). **ZACZNIJ STĄD.**
3. `Civ-AI/README.md` — indeks całego działu (co gdzie leży).
4. `PLAYBOOK-operacyjny-Civ.md` §11–14 — limity iteracji, handoffy, sędzia.
Reguły operacyjne: **backup przed zmianą** (`cp plik plik.bak-AI`); kanał = piszesz do `dyspozycje/AI-DO-MASTERA.md` + to samo w czacie; pytania **tekstem** (NIE AskUserQuestion/popup); tryb **event-driven** (ruszasz, gdy Maciej wywoła).

## CZYM SIĘ ZAJMOWAŁEM (ZROBIONE — nie rób od nowa)
- `barbarians.ts` — gotowy, test `barbarians-test` **53/0**.
- `victory.ts` — dominacja typu / nauka / przegrana — gotowy, logika przetestowana.
- **Dokumentacja dewelopera** `Spec-AI-architektura.md` + indeks `README.md`.
- **Panel** `AI-parametry.xlsx` odświeżony: 68 parametrów, kolumna **Status** (LIVE/PLANOWANE), dołożone klucze `barbarzyncy_*`; skrypt **`gra/tools/export-ai-params.py`** (panel → `ai-params.json`), zweryfikowany (roundtrip 68 kluczy).
- **Konsolidacja:** wszystkie nie-growe pliki AI przeniesione do katalogu `Civ-AI/` (+ `_archiwum/`). Master poinformowany.
- **DECYZJA MACIEJ (ważne):** profil/charakter cywilizacji **ZOSTAJE w panelu AI** (`archetype_*` w `ai-params.json`), **NIE** w DANE/`civs.json`. Nadpisuje wcześniejszą dyspozycję „profil z DANE". **Nie przepinaj `ai.ts` na `civs.json`.**

## CZYM MASZ SIĘ ZAJĄĆ (WISZĄCE — wg mastera 24.06 + sekcja 9 dokumentacji)
1. **(BEZPIECZNE, Twój lane, odblokowane) Fix odczytu parametru w `ai.ts`.** `getAiParam`/`readArchMods` czytają tylko `entry.wartość` (z diakrytykiem), a `ai-params.json` ma klucz `wartosc` (ASCII) → mogą zwracać `undefined` zamiast wartości (parametry AI po cichu nie działają). Popraw na `entry.wartość ?? entry.wartosc` (jak już robi `barbarians.ts`). To prawdopodobnie odblokowuje WSZYSTKIE parametry AI. Zacznij od tego.
2. **Skalowanie trudności Easy/Normal/Hard.** Parametry `trudnosc_*` są w panelu, `ai.ts` ich nie konsumuje. Część po stronie `ai.ts` (priorytety/walka), część przy spawnie AI = master.
3. **Ekspansja świadoma typu (klaster ~9 rywali tego samego typu)** wg `Spec-generator-mapy.md §0.1`. `ai.ts` zakłada miasta heurystycznie, ale nie zna klastrów typu. Rozmieszczenie startowe klastrów robi MAPA i przekaże przez `dyspozycje/_handoff/`. Logikę ekspansji w turze pisz już; pełne klastry po handoffie MAPA.
4. **Archetypy 7/9.** Brak `Celtowie`/`Germanie` w `CIV_TO_ARCH` i w panelu. Dodaj `archetype_celtowie_*`, `archetype_germanie_*` (panel + mapowanie w `ai.ts`).
5. **Kontrola budżetu.** `ai.ts` buduje wg priorytetu bez sprawdzania kosztu/skarbca. Styk z EKONOMIA (`economy.ts`: `cityYieldPerTurn`) — uzgodnij przez `_handoff`.
6. **Heurystyka nauki §5** (wybór technologii) — brak w `ai.ts`; delta `nauka` w archetypach nieużywana, dopóki tego nie dopiszesz.

> Integrację do silnika/kanonu (wpięcie `decideAITurn`/`checkVictory`/barbarzyńców w pętlę tury) **zgłaszasz MASTEROWI** przez `dyspozycje/_handoff/AI-do-MASTER_<temat>.md` + meldunek w `AI-DO-MASTERA.md`. Sam NIE ruszasz `main.ts`.

## GDZIE CZEGO SZUKAĆ (mapa plików)
- **Dokumentacja + reguły działu:** `Civ-AI/Spec-AI-architektura.md` (główna), `Civ-AI/Spec-AI.md` (design §1–9), `Civ-AI/README.md` (indeks).
- **Kod (Twój lane, w drzewie gry):**
  - `gra/src/game/ai.ts` — decyzje rywali: `decideAITurn` (wejście/wyjście = lista komend), `chooseCityProduction`, `hexCityScore`, `findSettlerTarget`, `CIV_TO_ARCH`/`readArchMods` (archetypy).
  - `gra/src/game/victory.ts` — `checkVictory` (dominacja/nauka/przegrana).
  - `gra/src/game/barbarians.ts` — `spawnCamps`/`tickCamps`/`decideBarbarianMoves`, `loadBarbParams`.
- **Parametry (pętla sterowania):** panel `Civ-AI/AI-parametry.xlsx` → `python3 gra/tools/export-ai-params.py` → `gra/data/ai-params.json` (to czyta kod przez `data.aiParams`). Sekcje w panelu: §2 Ruch, §3 Ekspansja, §5 Barbarzyńcy, §6 Dyplomacja, §7 Trudność, §8 Archetypy.
- **Testy:** `gra/tools/barbarians-test.cjs`; logiczne `node gra/tools/logic-test.cjs`. UWAGA: w piaskownicy `logic-test` bywa blokowany przez „ucięty" `data/diplomacy.json` — to **nieświeży mount OneDrive**, nie błąd (chmura ma plik cały; lek: folder Civ → „Always keep on this device").
- **Styki/kontrakty (CZYTASZ, nie edytujesz):** `diplomacy.ts` (`aiDiplomacyStance` — gotowy hak wojna/pokój), `economy.ts`/`turn-economy.ts` (koszt/budżet, `buildEconParams` z trudnością), `production.ts` (`availableProduction`/`enqueue`/`advanceProduction` — jak silnik realizuje komendę `build`), `cities.ts` (`City`, `canFoundCity`), `units/setup.ts` (`RuntimeUnit`, `hexDistance`, `computePath`), `Spec-generator-mapy.md §0.1` (klastry 9 typów).
- **Kanał:** czytaj `dyspozycje/AI.md`; pisz `dyspozycje/AI-DO-MASTERA.md` (+ czat). Handoffy: `dyspozycje/_handoff/`.
- **Twoja lista kroków/odhaczanie:** `Status-projektu-The-Game.xlsx`, zakładka `Civ-AI`.

## PIERWSZY RUCH (rekomendacja)
Zacznij od **pkt 1** (fix `wartość`↔`wartosc` w `ai.ts` — 1 linia, odblokowuje parametry): `cp ai.ts ai.ts.bak-AI` → popraw → test → meldunek. Potem pkt 2 (trudność) i pkt 3 (ekspansja świadoma typu). **Profil cywilizacji ZOSTAJE w panelu AI** (decyzja Maciej) — nie przenoś do DANE.
