# R-AI-TRUDNOSC-AUDYT — rozwój major AI vs poziomy trudności

**Status:** 🟢 Evaluator PASS-WITH-NOTES · gotowe do Grok final · 2026-08-05 · was: 🟠 Operator done (`dadcb48`)  
**Scope:** **tylko major AI** (nie miasta-państwa / `defensiveCopy` / `typCityCopy`)  
**Cel:** (1) audyt — co najbardziej psuje rozwój AI; (2) plan usprawnień **per poziom** 1=Prosty / 2=Normalny / 3=Trudny.

## ECHO (cytat)
> przy okazji, zrób audyt trudności AI, co wpływa najbardziej na to, że AI źle sobie radzi z rozwojem. Mówię głównie o głównych AI, nie o państwach miastach. I zrób plan działania, co możemy jeszcze usprawnić na każdym poziomie trudności, z podziałem na poziomy trudności, żeby AI lepiej sobie radziło. Wszystko zgodnie z zasadą Autobot.

**ECHO P0 (Maciej „1" = wdrażaj P0, 2026-08-05):** realna Praca z `bonus_produkcja` (opcja B C.2 Q1 + zachować scoring `diffProdBonus`) · fix ids `spichlerz`/`cegielnia` w `chooseAIResearch` · L3 `bonus_nauka`=2 (≥ L2).

**ECHO P1 (Maciej „2" = wdrażaj P1-1/P1-2, 2026-08-05):** `majorEarly` budynki gosp. ×0,70 (było ×0,55) · L1 `majorEarly` max tura 25 · drugi zwiadowca −80 pkt score.

## Kontekst już wdrożony (nie powtarzaj jako „brak”)
- FALA 226: P-AI-MOC-BONUS (startowe jednostki/miasta, `bonusWalka`, `bonusNauka`) — major only
- FALA 226: P-AI-008 — threat: jednostki+rozwój zamiast murów
- FALA 220: AI-MANAGE auto-zarządca major; early wzrost/Spichlerz; AI-FOUND/LOCAL
- `ai-params.json` + `loadDifficultyParams` w `ai.ts`
- `ai-difficulty-bonus.ts`

## Metodologia
Przegląd: `gra/data/ai-params.json` (`trudnosc_poziom{1,2,3}_*`), `gra/src/game/ai.ts` (`loadDifficultyParams`, `chooseCityProduction`, `decideAITurn`, `planCityFounding`, `planCityImprovements`, `decideAIEconomySliders`, `chooseAIResearch`), `gra/src/game/ai-difficulty-bonus.ts`, `gra/src/game/ai-threat-mode.ts`, wiring `main.ts` (spawn, nauka, combat, `decideAITurn` opts), docs `P-AI-MOC-BONUS.md`, `P-AI-008.md`, `AI-MANAGE-Q1.md`, rejestr `dyspozycje/REJESTR-PROBLEMOW-AI.md`.

---

## A — Mapa dźwigni (co realnie czyta kod)

### A.1 Parametry trudności per poziom (§7 `ai-params.json`)

| Parametr JSON | L1 Prosty | L2 Normalny | L3 Trudny | Podpięty w kodzie | Wpływ na **rozwój** major AI |
|---|---:|---:|---:|---|---|
| `trudnosc_poziomN_bonus_produkcja` | 0 | **0,10** (+10%) | **0,25** (+25%) | **Częściowo** — `ai.ts:chooseCityProduction` → `diffProdBonus` na `economyScore` (+0 / +20 / +50 pkt scoringu) | **Słaby** — opis w JSON mówi „bonus Pracy”, ale **nie mnoży realnej Pracy/turę** (`main.ts` ekonomia). Tylko lekko podbija priorytet budynków gospodarczych w scoringu. |
| `trudnosc_poziomN_bonus_nauka` | 0 | **+1** pkt/turę | **0** | **TAK** — `main.ts:difficultyScienceBonusForOwner` → `aiNaukaPoolByOwner` | **L2 > L3** — Normalny dostaje +1 Nauki, Trudny **zero** (anomalia balansu). |
| `trudnosc_poziomN_startowe_jednostki` | 0 | **1** | 0 | **TAK** — `ai-difficulty-bonus.ts:planMajorAiDifficultyStartBonuses` przy founding stolicy (`main.ts:grantDifficultyStartBonusesForMajorCapital`) | Pośredni — +1 Wojownik na L2 to wojsko, nie ekonomia; L3 nie dostaje jednostek startowych. |
| `trudnosc_poziomN_startowe_miasta` | 0 | 0 | **1** | **TAK** — j.w. (+1 miasto sąsiad stolicy lub fallback Wojownik) | **Silny na L3** — drugie miasto od startu = podwojona produkcja/terytorium; główna dźwignia Trudnego. |
| `trudnosc_poziomN_bonus_walka` | 0 | 0 | **0,05** (+5%) | **TAK** — `main.ts:difficultyCombatMultForOwner` | Walka, nie rozwój — pośrednio: mniej strat → więcej czasu na budowę. |

### A.2 Parametry „Spryt AI” (T4=B) — **brak w JSON**, tylko fallback w `loadDifficultyParams`

| Pole `DifficultyParams` | L1 | L2 | L3 | Klucz JSON (brak!) | Konsument | Wpływ rozwój |
|---|---:|---:|---:|---|---|---|
| `agresjaMnoznik` | 0,85 | 1,0 | 1,2 | `trudnosc_poziomN_agresja_mnoznik` | `ai.ts:decideAIReaction`, `decideAIDiplomacy` (`main.ts` przekazuje) | **Pośredni** — wyższa agresja na L3 → więcej wojen → suwaki przesuwają Pracę z Nauki (`decideAIEconomySliders`). |
| `dyplomacjaAktywnosc` | 0,8 | 1,0 | 1,25 | `trudnosc_poziomN_dyplomacja_aktywnosc` | `ai.ts:decideAIDiplomacy` | Handel/sojusze — pośrednio surowce i pokój. |
| `celObranie` | 0 | 0,5 | 1,0 | `trudnosc_poziomN_cel_obranie` | `ai.ts:decideAITurn` (scoring celu marszu) | **Pośredni** — L1 atakuje najbliższego; L3 preferuje słabszego → więcej podbojów, mniej budowania. |

**Wniosek A.2:** Trzy ważne dźwignie behawioralne **nie są strojone w Panelu** — tylko hardcode fallback. JSON Panelu nie odzwierciedla pełnego modelu trudności.

### A.3 Parametry globalne (wszystkie poziomy) — wpływ na rozwój major

| Parametr / mechanizm | Wartość / źródło | Konsument | Wpływ rozwój |
|---|---|---|---|
| Archetypy `archetype_*_{wojsko,nauka,ekonomia,obrona}_priorytet` | ±1…±2 per nacja | `ai.ts:readArchMods` → scoring produkcji + `chooseAIResearch` | **Silny** — Zulusi/Germanie (+2 wojsko, −1 ekonomia) chronicznie spowalniają infrastrukturę. |
| `priorytetMilitarny/Ekonomia/Nauka` (Panel D, `civ-ai.json`) | 1–10 | `ai-production-priorities.ts:aiProductionScoreBoosts` | **Średni** — ±75 pkt score przy skrajnych wartościach. |
| `ekspansja_zagroz_zasieg` | 7 hex | `chooseCityProduction` → `underThreat` | **Średni** — P-AI-008 łagodzi (jednostki+rozwój), ale Wojownik 300+ pkt nadal konkuruje ze Spichlerzem. |
| `ekspansja_min_score_hex` | 3 | `planCityFounding` / `findCityFoundingHex` | Jakość lokacji kolonii — słabe hexy odrzucane. |
| `cuda_poziom{1,2,3}_prog_koszt_x` + `throttle_tur` | 25/8 · 45/5 · 70/3 | `loadAiWonderParams` → `decideAiWonderBuild` | Cuda po stabilnej ekonomii — L3 agresywniej. |
| **Major early** (`AI_MAJOR_EARLY_*`) | tura ≤40 LUB avg pop <5 LUB avg budynki <4 | `computeMajorAiEarlyGame` | **Bardzo silny** — tłumi budynki gosp. (×0,55) i wojsko (×0,65); suwaki: 100% wzrost, 40% budynki. |
| **Early phase produkcji** | `myCities.length < 3` | `chooseCityProduction` gałąź §4.1 vs §4.2 | **Silny** — bez Koszar/infrastruktury mid do 3. miasta (L3 start +1 miasto przyspiesza wyjście). |
| **AI-LOCAL** | tura <20 + brak scouta + cluster | `isLocalExpansionPhase` → blokuje `planCityFounding` | **Silny wczesny** — opóźnia ekspansję mimo AI-FOUND pop≥2. |
| **AI-MANAGE** | zawsze ON major | `main.ts:autoManageCity` + `decideAIEconomySliders` | **Pozytywny** — auto-kolejka budynków, max wzrost early, deficyt żywności obniża racje. |
| **P-AI-009** próg ulepszeń | 30 Pracy (10 early major) | `planCityImprovements` | Farmy drogo — świadomie zostaje (rejestr). |
| **canAfford** bramka | pula surowców państwa | `chooseCityProduction` → `null` | **Silny negatywny** — brak produkcji = zmarnowana tura (P-AI-MOC-GAP). |
| **Wojna** | `atWar` | `decideAIEconomySliders` | Przesuwa Pracę na budynki/wojsko, **obniża Naukę**. |

### A.4 Podsumowanie mapy
- **Jedyna dźwignia JSON wyraźnie różnicująca rozwój per poziom:** `bonus_produkcja` (scoring) + `startowe_miasta` (L3) + `bonus_nauka` (tylko L2).
- **Największe dźwignie poza JSON:** `majorEarly`, `earlyPhase` (<3 miasta), `AI-LOCAL`, archetypy wojownicze, `canAfford` stall.
- **Rozjazd opis ↔ kod:** `bonus_produkcja` nie daje realnego +10%/+25% Pracy — tylko punkty w `chooseCityProduction`.

---

## B — Top przyczyny słabego rozwoju (rank)

Legenda typu: **WIRING** = martwy/niepełny podział · **BALANS** = liczby · **POLITYKA** = scoring/heurystyka AI.

| Rank | Przyczyna | Typ | Dowód (plik:funkcja) | Efekt |
|:---:|---|---|---|---|
| **1** | **Faza `majorEarly` tłumi infrastrukturę gospodarczą** (×0,55 score budynków mid-game w early) | POLITYKA | `ai.ts:computeMajorAiEarlyGame` + `chooseCityProduction` (blok `if (majorEarly)` ×0,55/×0,65) | Do tury ~40 lub avg pop <5 AI **świadomie** odkłada Stolarnię/Magazyn/Bibliotekę na rzecz scoutów i minimalnego wojska — główna przyczyna „AI stoi w miejscu” mimo zasobów. |
| **2** | **Bramka `earlyPhase` (<3 miasta) blokuje gałąź mid produkcji** | POLITYKA | `ai.ts:chooseCityProduction` (`earlyPhase = myCities.length < 3`) | Bez Koszar i łańcucha gospodarczego do 3. miasta — na L1/L2 bez bonusu miasta to długa faza tylko Spichlerz+scout+wojna. |
| **3** | **`canAfford` → `null` = zmarnowana produkcja** (myszkowanie surowców) | POLITYKA + BALANS | `ai.ts:chooseCityProduction` (linie `affordable.length === 0 → return null`) · rejestr `P-AI-MOC-GAP` | AI nie buduje nic, gdy brakuje cegły/brązu w puli — pula rośnie, rozwój stoi. |
| **4** | **`bonus_produkcja` nie zwiększa realnej Pracy** (tylko scoring) | WIRING | JSON opis vs `ai.ts:chooseCityProduction:diffProdBonus`; brak użycia w `main.ts` ekonomii | Trudny (+25%) **nie buduje szybciej** — tylko częściej *wybiera* budynek gospodarczy w rankingu. |
| **5** | **Wyścig zwiadowców dominuje early queue** | POLITYKA | `ai.ts:chooseCityProduction` — `Zwiadowca` score **320+economy** vs `spichlerz` **250** | 2 scouty przed infrastrukturą — OK dla wioszek, ale opóźnia Spichlerz/Koszary o wiele tur. |
| **6** | **AI-LOCAL blokuje founding do tury ~20** | POLITYKA | `ai.ts:isLocalExpansionPhase` → `planCityFounding:return null` | Ekspansja terytorialna stoi mimo pop≥2 (AI-FOUND); kolonizacja agresywna dopiero przy pop≥5 (`AI_COLONIZATION_SOURCE_MIN_POP`). |
| **7** | **L3 ma gorszą Naukę niż L2** (`bonus_nauka` 0 vs 1) | BALANS | `ai-params.json` + `main.ts:difficultyScienceBonusForOwner` | Trudny AI **wolniej** w tech niż Normalny — sprzeczne z oczekiwaniem „Trudny = silniejszy rozwój”. |
| **8** | **Archetypy wojownicze karzą ekonomię** (−1…−2 ekonomia, +2 wojsko) | BALANS | `ai-params.json` archetypy + `ai.ts:applyMajorArchetypeProductionBias` | Zulusi/Germanie/Słowianie — chronicznie więcej wojska, mniej budynków (udział wojska do 60%). |
| **9** | **Zagrożenie (7 hex) nadal przyciąga wojsko** | POLITYKA | `ai-threat-mode.ts:aiThreatMajorUnitScores` (baza 300) + `chooseCityProduction` | P-AI-008 poprawił (bez murów), ale Wojownik nadal wygrywa ze Spichlerzem przy sąsiednim wrogu. |
| **10** | **Bug nazw w `chooseAIResearch`** (`Spichlerz` vs id `spichlerz`) | WIRING | `ai.ts:scoreTech` (`allBuilt.has('Spichlerz')`) vs `buildings.json` id `spichlerz` | Tech odblokowujący Spichlerz **zawsze** dostaje +120 pkt — zafałszowany tor badań po zbudowaniu Spichlerza. |
| **11** | **Parametry Spryt AI niewidoczne w Panelu** | WIRING | `ai.ts:loadDifficultyParams` fallback bez kluczy w JSON | Niemożliwe strojenie agresji/dyplomacji/celu per poziom bez kodu. |
| **12** | **Wojna przesuwa suwaki od Nauki** | POLITYKA | `ai.ts:decideAIEconomySliders` (`if (inp.atWar)`) | AI w wojnie spowalnia badania — kumuluje się z agresją L3. |

**Oddzielnie (nie rank rozwój, ale gap Mocy):** brak absorpcji AI major→major (`P-AI-MAJOR-ABSORB`) — nie blokuje wewnętrznego rozwoju, ale utrudnia konsolidację imperiów AI.

---

## C — Plan działań per poziom trudności

### C.1 Poziom 1 — Prosty (AI słabsze, gracz ma przewagę)

| Priorytet | Działanie | Warstwa | Efekt rozwój | Ryzyko | ABC? |
|:---:|---|---|---|---|---|
| Q1 | **Obniżyć priorytet scoutów** — np. score Zwiadowca 320→220 na L1 (param JSON `trudnosc_poziom1_scout_score_delta` lub gałąź w `chooseCityProduction`) | JSON / scoring | Więcej Spichlerz/Koszary przed wyścigiem wioszek | AI mniej prezentów z wioszek — akceptowalne na Łatwym | Nie |
| Q2 | **`majorEarly` krótszy na L1** — `AI_MAJOR_EARLY_MAX_TURN` 40→25 gdy `poziomTrudnosci===1` | scoring | Szybsze wejście w mid-buildings | AI może być bardziej podatne militarnie wcześnie | Nie |
| Q3 | **Podnieść próg `canAfford` fallback** — na L1 przy braku affordable wybierać najtańszy kandydat zamiast `null` | scoring / POLITYKA | Mniej pustych tur produkcji | Może budować „na kredyt" surowców — wymaga bramki | **Tak** (A=pusta tura, B=najtańszy, C=status quo) |
| Ś1 | **Dodać do JSON** `trudnosc_poziom1_bonus_nauka: 0` jawny + dokumentacja „brak bonusu" | docs/JSON | Przejrzystość | — | Nie |
| D1 | **Łagodniejsza agresja** — `agresja_mnoznik` 0,85 już jest; rozważyć `cel_obranie` 0 (zostaje) | JSON (po dopisaniu kluczy) | Mniej wojen → więcej budowania | AI mniej „żywe" militarne | Nie |

### C.2 Poziom 2 — Normalny (baseline)

| Priorytet | Działanie | Warstwa | Efekt rozwój | Ryzyko | ABC? |
|:---:|---|---|---|---|---|
| Q1 | **Naprawić `bonus_produkcja` → realna Praca** — mnożnik `1+bonusProdukcja` na `doBudynkow` / pulę imperium AI w `main.ts` (major only) | WIRING + JSON | +10% tempo budowy — zgodne z opisem Panelu | AI szybciej dominuje ekonomię — monitorować Moc | **Tak** (A=tylko scoring, B=realna Praca, C=obie) |
| Q2 | **`bonus_nauka: 1` zostaje**; rozważyć +1 na L3 zamiast 0 (patrz C.3) | JSON | Utrzymanie tempa badań na Normalnym | — | Nie |
| Q3 | **Skrócić konflikt scout vs Spichlerz** — po 1. zwiadowcy obniżyć score kolejnego scouta o 80 pkt | scoring | Drugi scout nie blokuje Spichlerza 5+ tur | Mniej mapy explored | Nie |
| Ś1 | **Fix `chooseAIResearch`** — `allBuilt.has('spichlerz')` (małe id) | bugfix | Prawidłowy tor tech po Spichlerzu | Niski | Nie |
| Ś2 | **Złagodzić `majorEarly` ×0,55 → ×0,70** dla budynków gospodarczych na L2 | scoring | Więcej infrastruktury przed tura 40 | Wojskowe archetypy mocniejsze wcześniej | Nie |
| D1 | **Parametry Spryt w JSON** — wyeksportować `agresja_mnoznik`, `dyplomacja_aktywnosc`, `cel_obranie` do `ai-params.json` | JSON + panel | Strojenie bez deployu kodu | Panel complexity | Nie |

### C.3 Poziom 3 — Trudny (AI ma dominować rozwojem, nie cheatami MP)

| Priorytet | Działanie | Warstwa | Efekt rozwój | Ryzyko | ABC? |
|:---:|---|---|---|---|---|
| Q1 | **`bonus_nauka: 2`** (lub min. 1) — L3 nie gorszy od L2 w nauce | JSON | Tech parity z/intensywniejsza niż Normalny | Przyspieszone epoki AI | Nie |
| Q2 | **`bonus_produkcja` 0,25 na realną Pracę** (jak C.2 Q1) | WIRING | +25% tempo budowy — główna dźwignia Trudnego oprócz +1 miasta | Gap Mocy vs gracz — **bez** buffowania MP | Nie (techniczne) |
| Q3 | **Start +1 miasto zostaje**; dodać walidację jakości heksu bonusowego (min `ekspansja_min_score_hex`) | scoring/spawn | Kolonia startowa na sensownym hexie | Rzadkie BLOK spawnu | Nie |
| Q4 | **`majorEarly` bypass na L3** gdy `startowe_miasta>0` — skrócić early penalty do tury 25 | scoring | Drugie miasto od razu buduje mid-tier | Szybki snowball | **Tak** |
| Ś1 | **Cuda L3** — `cuda_poziom3_prog_koszt_x` 70→80 (już agresywne); alternatywnie throttle 3→2 | JSON | Cuda jako multiplier późnego rozwoju | AI focus na cuda zamiast miast | Nie |
| Ś2 | **Threat: obniżyć score Wojownika o 40** gdy `!underThreat` na L3 tylko | scoring | Mniej over-production wojska w pokoju | — | Nie |
| D1 | **Ekspansja: `AI_COLONIZATION_SOURCE_MIN_POP` 5→4 na L3** | scoring | Wcześniejsze zakładanie 3. miasta | Mapa zapełniona szybciej | **Tak** |

**Wspólne dla wszystkich poziomów (nie „wzmocnij MP”):**
- Utrzymać P-AI-008 (zagrożenie = rozwój, nie mury).
- Utrzymać AI-MANAGE (auto-zarządca major).
- Rozważyć **converter-priority** (już jest) + **deficyt → budynek** (P-AI-011) — działają; problem to `null` gdy nic nie stać.

---

## D — Propozycja kolejności wdrożeń (P0–P2, max 8)

| # | Priorytet | Zadanie | Poziom | Effort | Efekt | Ryzyko |
|:---:|---|---|---|---|---|---|
| **P0-1** | 🔴 | **Podpiąć `bonus_produkcja` do realnej Pracy AI** (major, per `aiDiffLevelForOwner`) | L2+L3 | Średni (main.ts ekonomia) | Bezpośrednie przyspieszenie budowy — naprawa rozjazdu JSON/kod | Snowball na Trudnym |
| **P0-2** | 🔴 | **Fix `chooseAIResearch` ids** (`spichlerz`/`cegielnia` lowercase) | Wszystkie | Mały | Prawidłowy tor badań po early buildings | Niski |
| **P0-3** | 🔴 | **L3 `bonus_nauka` ≥ L2** (prop. 2 pkt/turę) | L3 | JSON only | Trudny nie gorszy w tech niż Normalny | Szybsze epoki |
| **P1-1** | 🟡 | **Złagodzić `majorEarly` penalty** (×0,55→×0,70 budynki; opcjonalnie krótszy max turn na L1) | L1+L2 | Scoring | Więcej infrastruktury w grze środkowej | Wcześniejsza armia |
| **P1-2** | 🟡 | **Scout score cap po 1. zwiadowcy** lub delta per poziom | L1 priorytet | JSON/scoring | Spichlerz/Koszary nie czekają na 2. scouta | Mniej explored |
| **P1-3** | 🟡 | **Wyeksportować Spryt AI do `ai-params.json`** (agresja, dyplomacja, cel_obranie ×3 poziomy) | Wszystkie | JSON + panel | Strojenie trudności bez kodu | — |
| **P2-1** | 🟢 | **ABC: `canAfford` pusta tura vs fallback najtańszy** | Wszystkie | Scoring + test | Koniec „myszkowania" przy pełnej kolejce | Ekonomiczne dziury |
| **P2-2** | 🟢 | **ABC: L3 skrócony `majorEarly` przy `startowe_miasta=1`** | L3 | Scoring | Drugie miasto od razu w mid-tier produkcji | Snowball |

**Nie wchodzi w kolejkę (świadomie):** buffy MP, absorpcja AI→AI (osobny wątek `P-AI-MAJOR-ABSORB`), zmiana progu ulepszeń P-AI-009 bez ABC.

---

## Powiązane wpisy rejestru

| ID | Status | Powiązanie z audytem |
|---|---|---|
| P-AI-008 | WDROŻONE | Zagrożenie — rozwój zamiast murów (major) |
| P-AI-MOC-BONUS | ZDEPLOYOWANE F226 | Startowe bonusy podpięte; `bonus_produkcja` nadal tylko scoring |
| P-AI-MARTWE-BONUSY | **Częściowo zamknięte** F226 | Został rozjazd `bonus_produkcja` (opis vs kod) |
| P-AI-MOC-GAP | OTWARTE | `canAfford` null, gap Mocy — częściowo F220 |
| P-AI-009 | ŚWIADOMIE-ZOSTAJE | Próg 30 Pracy na ulepszenia |
| P-AI-014 | ZDEPLOYOWANE | `isProductionAllowed` — odróżnić od P-AI-PROD-GATE-PER-OWNER |

---

## Zakazy (operator)
- Nie mieszać MP w rekomendacjach „wzmocnij AI”
- Nie `npm run build` / nie deploy / nie merge main — **ta paczka: tylko docs**
- AutoBot: po audycie → **Evaluator** → Grok prezentuje Maciejowi

---

## E — P0 wdrożone (Operator 2026-08-05)

| ID | Zmiana | Pliki |
|---|---|---|
| **P0-1** | `bonus_produkcja` → realna Praca major AI (`doBudynkow` + `doPuli` × mult) | `gra/src/game/ai-difficulty-bonus.ts` (`difficultyProductionMultiplier`), `gra/src/main.ts` (`difficultyProductionMultForOwner`, tick produkcji ~20734) |
| **P0-2** | Fix ids Spichlerz/Cegielnia w `chooseAIResearch` (lowercase + dual-check) | `gra/src/game/ai.ts` (`scoreTech`) |
| **P0-3** | L3 `bonus_nauka` = 2 (+2/turę, ≥ Normalny) | `gra/data/ai-params.json`, `gra/src/game/ai.ts` (`loadDifficultyParams` fallback) |

**Testy:** `ai-difficulty-bonus-test.cjs` (T-DB-b/f/g), `ai-threat-mode-test.cjs`, `ai-test.cjs` (T2a/T2c bonusNauka L3=2).

**Zachowane:** scoring `diffProdBonus` w `chooseCityProduction` (wiring + realna Praca = zamierzone po P0).

---

## Evaluator (2026-08-05) — P0 re-run

**PASS-WITH-NOTES** · operator tip `fcd21db` · evaluator docs tip (po commit)

### Hard metrics (Evaluator re-run z `gra/`)
| Test | Wynik |
|---|---|
| `npx tsc --noEmit` | **PASS** (0 błędów) |
| `ai-difficulty-bonus-test.cjs` | **PASS** 25/25 |
| `ai-threat-mode-test.cjs` | **PASS** 11/11 |

### Spot-check AC (kod, nie trust Operator)
| AC | Dowód | OK |
|---|---|:---:|
| **P0-1** `difficultyProductionMultiplier` = `1+max(0,bonus)` | `ai-difficulty-bonus.ts:35-36` | ✓ |
| **P0-1** gate major only (gracz/MP/barb → mult 1) | `main.ts:5454-5457` · `qualifiesForMajorAiDifficultyBonus` `ownerId>0` | ✓ |
| **P0-1** tick skaluje **oba** `doBudynkow` i `doPuli` przed `pracaImperialPoolGain` | `main.ts:20747-20751` | ✓ |
| **P0-1** `pracaBudynki` też × mult (bez mutacji `econTick`) | `main.ts:20766-20768` · `econTick` per-city `20364` | ✓ |
| **P0-1** scoring `diffProdBonus` zachowany | `ai.ts:1057-1063` | ✓ |
| **P0-2** lowercase ids + dual-check PascalCase | `ai.ts:548-549` | ✓ |
| **P0-2** test T-DB-g: `allBuilt spichlerz` usuwa +120 bias | `ai-difficulty-bonus-test.cjs:177-184` | ✓ |
| **P0-3** JSON L3 `bonus_nauka`=2 + opis | `ai-params.json:57-60` | ✓ |
| **P0-3** fallback L3=2 | `ai.ts:429` · T-DB-f | ✓ |

### Notes (nie blokery P0)
- Sekcje **A/B** audytu nadal opisują stan **sprzed P0** (np. rank #4 „tylko scoring”, L3 nauka=0) — zaktualizować przy P1/docs pass, nie blokuje kodu.
- Brak testu integracyjnego `main.ts` tick produkcji — tylko unit + spot-check linii; akceptowalne dla P0.
- Podwójny efekt `bonus_produkcja` (scoring + realna Praca) — **zamierzone** wg ECHO P0.

**Gotowe do Grok final** (prezentacja Maciejowi / deploy na sygnał).

---

## F — P1 wdrożone (Operator 2026-08-05, ECHO Maciej „2")

| ID | Zmiana | Pliki |
|---|---|---|
| **P1-1** | `majorEarly` budynki gosp. ×0,55→×**0,70** (`AI_MAJOR_EARLY_ECON_BUILDING_MULT`); wojsko ×0,65 bez zmian | `gra/src/game/ai.ts` (`chooseCityProduction`) |
| **P1-1** | L1 (Prosty): `majorEarly` max tura **25** (`AI_MAJOR_EARLY_MAX_TURN_L1`) zamiast 40 | `gra/src/game/ai.ts` (`computeMajorAiEarlyGame`) |
| **P1-2** | Drugi zwiadowca w early: score **−80** (`AI_EARLY_SCOUT_REPEAT_PENALTY`) gdy `scoutCount≥1`; `AI_EARLY_SCOUT_TARGET` bez zmian | `gra/src/game/ai.ts` (`chooseCityProduction` §4.1) |

**Testy:** `ai-test.cjs` T14-p1-1a/b/c (mult 0.70, L1 turn 25, ranking stolarnia) · T14-p1-2a/b (penalty 80, Spichlerz > 2. scout).

**Zakres:** tylko P1-1 + P1-2 — bez P1-3 Spryt JSON, P2 canAfford, buffów MP.

---

## Evaluator (2026-08-05) — P1 adversarial re-run

**PASS-WITH-NOTES** · operator tip `dadcb48` (`dadcb489e39369fac147cc0abcbbc9160654fd05`)

### SCOPE + regresja (R-PROC-AUTOBOT-EVAL-SCOPE)

| # | Pytanie | Werdykt |
|---|---------|---------|
| 1 | Każda zmiana wynika z P1-1/P1-2? | ✅ Tak — 3 stałe + `computeMajorAiEarlyGame` L1 gate + `computeEarlyScoutProductionScore` + wiring w `chooseCityProduction` |
| 2 | Brak niezwiązanych plików/funkcji? | ✅ Kod: tylko `gra/src/game/ai.ts` + `gra/tools/ai-test.cjs`; docs/handoff operacyjne (5 plików łącznie) |
| 3 | Brak cofnięcia wcześniejszych usprawnień? | ✅ Wojsko ×0,65 bez zmian; `AI_EARLY_SCOUT_TARGET`=2; `defensiveCopy` wyłączone; brak P1-3/P2/MP/`main.ts` |
| 4 | Uboczne ryzyka? | ⚠️ Patrz Notes — **brak regresji od P1** (porównanie `main` vs tip) |

**Forbidden scope check:** brak P1-3 Spryt JSON · brak P2 canAfford · brak buffów MP · brak `main.ts` · brak UI.

### Hard metrics (Evaluator re-run z `gra/`)

| Test | Wynik |
|---|---|
| `npx tsc --noEmit` | **PASS** (0 błędów, ~6,6 s) |
| `node tools/ai-test.cjs` (pełny) | **PASS-WITH-NOTES** — **271 passed / 8 failed** (~0,3 s); T14-p1 **6/6 PASS** |
| `main` baseline (porównanie) | 261 passed / **9 failed** — P1 **nie dodaje** nowych faili; naprawia T2b `poziom3` (efekt uboczny ×0,70) |

### Spot-check AC (kod, nie trust Operator)

| AC | Dowód | OK |
|---|---|:---:|
| **P1-1** econ mult **0.70** (nie 0.55) | `ai.ts:968` `AI_MAJOR_EARLY_ECON_BUILDING_MULT` · użycie `:1267` | ✓ |
| **P1-1** wojsko nadal **×0.65** | `ai.ts:1262-1263` | ✓ |
| **P1-1** L1 max turn **25** | `ai.ts:966` `AI_MAJOR_EARLY_MAX_TURN_L1` · `computeMajorAiEarlyGame` `:995-997` | ✓ |
| **P1-2** scout −80 gdy `scoutCount≥1` | `ai.ts:719` `805` · `computeEarlyScoutProductionScore` `:800-806` | ✓ |
| **P1-2** `AI_EARLY_SCOUT_TARGET` **2** | `ai.ts:717` · gate `:1160` | ✓ |
| **P1-2** `defensiveCopy` wyłączone | `ai.ts:1160` `!opts.defensiveCopy` | ✓ |
| **T14-p1** testy istnieją i przechodzą | `ai-test.cjs:2617-2689` | ✓ |

### Notes (nie blokery P1)

- **8 faili** w pełnym `ai-test.cjs` (T1b/c, T3f, T2S-b/b2, T10b) — **pre-existing na `main`**, nie wprowadzone przez P1; dyplomacja/handel + archetyp ekonomia vs Koszary.
- Sekcje **A/B** audytu nadal opisują ×0,55 / L3 nauka=0 — **stale** (jak po P0); follow-up docs, nie blokuje kodu.
- Operator §F test opis „Spichlerz > 2. scout" — T14-p1-2b weryfikuje tylko matematykę score (−80), nie ranking vs Spichlerz; T11-scout-d pokrywa brak 3. zwiadowca.

**Gotowe do Grok final** (prezentacja Maciejowi / deploy na sygnał — **Evaluator NIE deployuje**).
