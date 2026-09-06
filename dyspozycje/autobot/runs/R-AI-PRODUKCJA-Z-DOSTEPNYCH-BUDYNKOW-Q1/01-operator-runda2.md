# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Operator, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów. Runda 2 realizuje ratyfikację orkiestratora (00-dispatch.md, sekcja "RATYFIKACJA") — punkty #1-#4.

## 1. Trzynaście zaszytych literałów — PRZYJĘTE, zero zmian kodu

Pełna lista, dziedziczona z rund 1/Obrony/Final Control, potwierdzona ponownym grepem (`'nazwa_budynku'` w `chooseCityProduction`/`applyMajorArchetypeProductionBias`):

**Fortyfikacja/priorytet (5):**
- `mury` (x2 miejsca: defensiveCopy threat-branch l.~1472, defensiveCopy base-fortification l.~1512) / `palisada` (defensiveCopy l.~1687) — BuildingDef nie ma flagi "to jest ściana" odróżniającej fortyfikację od koszar/fortu/baszty w tej samej grupie "Wojsko i obrona"; wymagałoby nowego pola w `buildings.json` (poza allowlistą, `gra/data/**` zakazane).
- `koszary` — dawny flat 200+militaryScore był świadomą decyzją "koszary przed rekrutacją"; boost całej grupy zamiast tego jednego budynku łamie ai-test T3a/T3b/T3g.
- `biblioteka`, `akademia` — Panel D (priorytetNauka) ma realnie przesuwać wybór ku nauce (ai-production-priority-test P7b/P7d); boost całej grupy zamiast tych dwóch łamie ai-jednostki-tylko-zakup-test (stela wygrywa z jednostkami w oknie majorEarly).

**Konwertery/deficyty surowców (8):** `cegielnia`, `odlewnia_brazu`, `odlewnia_zelaza`, `wielka_odlewnia` (CONVERTER_FOR_RESOURCE, l.~1745) + `stolarnia`, `garncarnia`, `kamieniarski`, `kuznia` (AI_BUILDING_FOR_DEFICIT, l.~2105) — oba miejsca robią `candidates.push({id:<literał>})` jako REALNE nowe źródło kandydata (nie modyfikację istniejącego). Eliminacja wymaga pola "co ten budynek wytwarza" w `buildings.json` (dziś jest tylko `koszt_surowce` = co zużywa) — poza allowlistą tej rundy, nie zamawiane.

Zero zmian kodu w tym punkcie, zgodnie z ratyfikacją. Dodałem tylko `spichlerz` do listy udokumentowanych wyjątków (patrz §3) — 14. pozycja od tej rundy.

## 2. P-AI-008 usunięta całkowicie

Usunięty filtr `buildingCandidates.filter(c => c.id !== 'mury')` blokujący major AI. Mury/Fort/Baszta wchodzą do normalnego punktowania grupowego ("Wojsko i obrona") jak koszary/warsztat_oblężniczy/akademia_wojskowa.

Priorytet PODNIESIONY (nie sztywne odblokowanie) w dwóch sytuacjach, oba na istniejących sygnałach:
- **Zagrożenie** — ten sam `underThreat`, który steruje resztą gałęzi §4.3 (`threatUnits`/`majorThreatDevBoostActive`). Bonus `AI_MAJOR_WALL_THREAT_BONUS=180`.
- **Miasto przygraniczne** — nowa funkcja `isBorderCity()`, reużywająca `opts.territoryNodes` (silnik już podaje `buildAllTerritoryNodes()` WSZYSTKICH właścicieli dla D-IMPROVEMENTS/`territoryOwnerAt`) — sprawdza, czy promień terytorium własnego + obcego miasta nachodzą na siebie w marginesie 3 hex. Bonus `AI_MAJOR_WALL_BORDER_BONUS=60`. Bez `territoryNodes` (stare wywołania) → zawsze `false`, zero regresji.

`ai-threat-mode.ts` (`aiThreatWallProductionScore` zwracające `null` dla major AI) jest poza allowlistą tego tematu — zostaje jako STARA, nieużywana dla tej gałęzi dokumentacja P-AI-008. Flaguję jako sprzątnięcie do osobnego tematu (nie naprawiam przy okazji, C-025).

**Asercje dodane w `ai-produkcja-pokrycie-katalogu-test.cjs` (sekcja D):**
(a) zagrożenie + katalog prawie pełny → wybór `mury` — PASS.
(a2) przygraniczne (bez zagrożenia) + katalog prawie pełny → wybór `mury` — PASS.
(b) świeże miasto, bez zagrożenia/granicy → wybór ≠ `mury` (wybrano `stolarnia`) — PASS.
(c) miasto-państwo bez garnizonu → wybór `Wojownik` (nietknięte) + pokrycie 42/42 — PASS.

Zaktualizowałem też trzy istniejące bramki testujące dosłownie usuniętą regułę (nie osłabione — assercje odwrócone na nowy kontrakt, ta sama liczba): `ai-threat-mode-test.cjs` (T8d/T8e), `ai-balans-step2-test.cjs` (T3a), `ai-balans-step2-smoke.cjs` (`baseline-5-5-5`).

Miasta-państwa (`defensiveCopy`) — gałąź NIETKNIĘTA: mury/palisada action nadal identyczna jak przed tą rundą.

## 3. Spichlerz przywrócony jako wyjątek — częściowo

Dodałem boost `AI_MAJOR_SPICHLERZ_PRIORITY_BONUS` (tylko major AI, `!opts.defensiveCopy`). **DECISION_REQUIRED nowy:** pełne odtworzenie historycznej pozycji (2.-4. miejsce) wymaga bonusu ~15-30 (proxy-symulacja), ale KAŻDA wartość ≥9 psuje chroniony gate `ai-jednostki-tylko-zakup-test` (44/0 → 41/3, AI przestaje proponować jednostki w oknie majorEarly z canAfford zawsze dostępnym). Zmierzone bisekcją. Wybrałem wartość BEZPIECZNĄ = **8** (44/0 zielone), która w proxy-symulacji przesuwa Spichlerz tylko o ok. 1 pozycję (11.→10.), nie na historyczną 2.-4. Właściciel decyduje: akceptować częściową poprawę, czy zlecić osobną kalibrację (np. rozluźnienie damping majorEarly) w nowym temacie.

## 4. Kryterium 4 (150 tur w prawdziwym silniku) — odroczone

Zgodnie z ratyfikacją: NIE dostarczone tą rundą. Zarejestrowane jako otwarte ryzyko — nocny przebieg + playtest właściciela, przed integracją do `main` warto potwierdzić brak trwałego "platonu" na jednostkach (ryzyko zgłoszone przez Final Control rundy 1).

## Testy

`tsc --noEmit`: 0 błędów. 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6. Cała rodzina `ai-*.cjs` (39 plików) uruchomiona indywidualnie: zero nowych regresji względem bazowego stanu przed rundą (zweryfikowane przez porównanie z uruchomieniem na `git stash` cofniętym do HEAD rundy 1) — 4 pliki mają PRZEDISTNIEJĄCE, niezwiązane czerwone (ai-balans-step3-test 7/1, ai-praca-split-parity-test 21/1, ai-slider-test 33/5, ai-test.cjs 291/4 — identyczne liczby przed i po). `ai-buduje-budynki-test.cjs` pominięty (realny Vite+Chromium, rząd minut, Final Control rundy 1 już potwierdził że mierzy `seedCityOwnerDefaults`, nie `chooseCityProduction` — niezwiązane z tą zmianą).

## BLOKADY

DECISION_REQUIRED (nowy, §3): magnitude bonusu Spichlerza ograniczona przez chroniony gate — patrz wyżej. Poza tym brak.

## ZMIANY/COMMIT

Allowlist: `gra/src/game/ai.ts`, `gra/tools/ai-produkcja-pokrycie-katalogu-test.cjs`, `gra/tools/ai-threat-mode-test.cjs`, `gra/tools/ai-balans-step2-test.cjs`, `gra/tools/ai-balans-step2-smoke.cjs`, ten raport. Commit SHA — patrz `git log` po zapisie.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator rundy 2.
DEPLOY/PUSH: NIE WYKONANO
