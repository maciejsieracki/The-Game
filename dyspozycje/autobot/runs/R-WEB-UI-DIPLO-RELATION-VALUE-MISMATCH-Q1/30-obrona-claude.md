STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1
GOAL: obrona operatora r3 po zarzutach Evaluatora (raport 4df7394bd, kandydat 31113b324). Odpowiedź na każdy zarzut: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód). Zmiany kodu gra/src: BRAK (rozstrzygnięcie nazw etykiet = decyzja ABC właściciela).
BAZA/KANDYDAT: kandydat 31113b3243dd0b47b917ab804f9da5e014d53f77 (zawiera origin/main 44af89169; merge: już zawarte). Gałąź robocza: web-wip/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1-obrona-r3.
ZMIANY: gra/tools/diplomacy-relation-value-mismatch-live-test.cjs (asercje na obie wartości + faza wojny), dyspozycje/autobot/runs/R-WEB-UI-DIPLO-RELATION-VALUE-MISMATCH-Q1/** (raport, evidence). gra/src: nietknięte.

## Korekta definicji (zarzut 1, PRZYJMUJĘ)

Raport r2 (10-operator-claude.md) nazwał 11,6 „zapisaną” relacją. To błąd. Kod:
- main.ts:24632-24650 `buildProposalEvalContext`: `rel = { ...relRaw, respekt: proposerRespekt }`, gdzie `proposerRespekt = computeRespekt(potProposer, potResponder)` (diplomacy.ts:1681, = round(100·P_self/(P_self+P_partner))). Respekt zapisany jest NADPISYWANY udziałem mocy proponenta.
- main.ts:21161 i :21212: wiersz „Wpływ Relacji na deal” bierze `entry.proposerOwnerId`. Dla propozycji AI proponentem jest AI (id 1). Stąd 11,6 = Zaufanie 0,6 + udział mocy AI (≈11).
- Liczba 89 w prawym panelu (main.ts:25354-25358 `audienceRelTotalEffective` / `objectiveRespektPctTowardEffective`) to udział mocy GRACZA (strona przeciwna, wersja efektywna). 11 + 89 = 100: to dwa kierunki tej samej proporcji mocy, a nie dwie różne zapisane wartości.
- Wartość ZAPISANA (stored) dla pary: `rel = getDiploRelation(ME(), ownerId)` (main.ts:25444), przekazana do `buildDiplomacyLockContextBase` (main.ts:25451, respekt: rel.respekt w :25386). Zmierzona w oknie jako „masz 50” (Respekt) i „masz 0.6” (Zaufanie). Zapisana suma = 0,6 + 50 = **50,6** (nie jest wyświetlana jako jedna liczba).

Poprawna definicja trzech wielkości (ta sama para, ten sam scenariusz, 2026-11-12, pokój):
| Wielkość | Wzór / źródło | Wartość w pomiarze | Gdzie widoczna |
|---|---|---|---|
| A. Zapisana (stored, perspektywa gracza) | Zaufanie 0,6 + rel.respekt zapisany (main.ts:25444, :25386) | 0,6 + 50 = 50,6 | tylko jako „masz 50” / „masz 0.6” w liniach blokad |
| B. Nominalna power-based, perspektywa gracza | round(Zaufanie + objectiveRespektPctToward) (main.ts:25349-25352, audienceRelTotal) | 90 | „masz 90” w liniach blokad „wymaga Relacji 110 (masz 90)”; progi handlu/daru (main.ts:25762) |
| C. Efektywna power-based, perspektywa gracza | round(Zaufanie + objectiveRespektPctTowardEffective) (main.ts:25354-25358) | 90 / 200, Respekt 89 / 100 | „Stan bieżący: Relacja 90 / 200 · … Respekt 89 / 100” (audiencja, prawy panel) |
| D. Perspektywa proponenta (AI), nadpisany respekt | treatyEvalRelationTotal(buildProposalEvalContext) (main.ts:24632-24650, :21212) | 0,6 + 11 = 11,6 | „Wpływ Relacji na deal … Relacja 11,6” (wiersz PW, modyfikator −88,4%) |

Uwaga: B i C dają w tym scenariuszu tę samą wartość 90, bo nie ma bonusów (weteran/fortyfikacja/trudność). Rozdział B od C przy aktywnych bonusach NIE_ZMIERZONO (zarzut 6, patrz niżej).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — definicja „zapisana” dla 11,6 jest fałszywa: PRZYJMUJĘ
Dowód: main.ts:24632-24650 (nadpisanie `respekt: proposerRespekt`), main.ts:21161/21212 (proponent = AI), main.ts:25444/25386 (zapisany respekt „masz 50”), wiersz z drvm-result.json: `Relacja 11,6 · Twoja strona słabsza (−88,4% PW); oni: baza`. Poprawiona definicja w tabeli powyżej. Etykieta wariantu B musi opisywać perspektywę proponenta, nie „zapisaną” wartość.

### Zarzut 2 — tabela UI → źródło pomija trzecią wartość Respektu („masz 50”): PRZYJMUJĘ
Dowód: evidence/drvm-result.json, `linieRespekt`: `zablokowana — wymaga Respektu 70 (masz 50)`. Nowa asercja w teście: `blokady pokazują „masz 50”` (PASS). Tabela wielkości A–D zawiera wartość z tej linii (A). Tabela UI → źródło (ten sam ekran, pomiar Chromium):
| Miejsce w UI | Tekst (surowy, z pomiaru) | Źródło | Wielkość |
|---|---|---|---|
| Wiersz „Wpływ Relacji na deal” (okno propozycji AI) | `Relacja 11,6 · Twoja strona słabsza (−88,4% PW); oni: baza` | main.ts:21161/21212 → buildProposalEvalContext → computePlayerAcceptanceSides (main.ts:21277) → diplomacyAcceptanceBalance.ts (`relTotal = side.relCurrent`) | D |
| Audiencja „Stan bieżący” | `Relacja 90 / 200 · Zaufanie 1 / 100 · Respekt 89 / 100` | main.ts:25639 (audienceRelTotalEffective), respekt z objectiveRespektPctTowardEffective (main.ts:25354-25358) | C |
| Blokady pakt/sojusz/przemarsz | `wymaga Zaufania 30 (masz 0.6) i Relacji 110 (masz 90)` | buildDiplomacyLockContextBase (main.ts:25451), relTotal nominalny (main.ts:25349-25352) | B (relacja), A (zaufanie) |
| Blokady respektu | `wymaga Respektu 70 (masz 50)` | rel.respekt zapisany (main.ts:25386) | A |

### Zarzut 3 — brak pomiaru stanu wojny i clampRelationForWar: PRZYJMUJĘ (pomiar wykonany, wynik częściowy)
Dowód: faza wojny w teście (`__civTest.setWar(ai, 0)`, ponowne otwarcie okna z HUD), evidence/drvm-result.json pole `okno_wojna`, zrzut evidence/drvm-02-okno-wojna.png, log evidence/drvm-test.log:
- Status po wymuszeniu: `WOJNA` (linieWojna). Wiersz „Wpływ Relacji na deal” NIE JEST RENDEROWANY (`relRowsRaw: []`); linieWojna: `handel niedostępny w wojnie`. Propozycja AI (pakiet handlowy) jest w wojnie nieważna, więc nie ma w UI liczby PW w stanie wojny.
- Audiencja nadal pokazuje: `Stan bieżący: Relacja 90 / 200 · Zaufanie 1 / 100 · Respekt 89 / 100 · nastawienie: Wrogi (etykieta Wrogi: limit wojenny 29)`. Dopisek „limit wojenny 29” pochodzi z diplomacyAudience.ts:1273-1279 i diplomacy-display.ts:344: przycinana jest etykieta nastawienia, a liczba 90/200 pozostaje surowa.
- Wniosek o clampRelationForWar dla 11,6 (wyprowadzony z kodu, NIE zmierzony w UI, bo wiersz nie istnieje w wojnie): buildProposalEvalContext nadpisuje respekt PRZED treatyEvalRelationTotal (diplomacy-proposals.ts:712-715 clamp tylko dla status 'wojna'). relationScore = zaufanie·1 + respekt·1 (diplomacy.ts:839, DIPLOMACY_PARAMS mnożniki 1, diplomacy.ts:193-194) = 0,6 + 11 = 11,6 ≤ WAR_RELATION_SCORE_CAP 29 → clampRelationForWar zwraca rel bez zmian (diplomacy.ts:1121-1123). Czyli dla tej propozycji clamp nie zmienia 11,6. Liczby w wojnie dla wiersza PW: NIE_ZMIERZONO (wiersz nieobecny). Clamp działa realnie na zapisany rel (50,6 > 29), co widać w etykiecie nastawienia „limit wojenny 29”.

### Zarzut 4 — test nie asertuje obu wartości: PRZYJMUJĘ
Dowód: gra/tools/diplomacy-relation-value-mismatch-live-test.cjs. Dodane asercje (wszystkie PASS w drvm-test.log):
- `wiersz „Wpływ Relacji na deal” pokazuje 11,6 (wartość PW)` — has116
- `okno pokazuje „Relacja 90 / 200” (audiencja) w TYM SAMYM oknie` — has90
- `okno pokazuje „Respekt 89 / 100” (efektywny, prawy panel)`
- `blokady pokazują „masz 50” (zapisany Respekt, trzecia wielkość)`
Stary test asertował tylko `length >= 1` i `/\/\s*200/`. Wynik: `diplomacy-relation-value-mismatch-live-test: 10 pass, 0 fail`. Ograniczenie zaakceptowane: pomiar dotyczy jednej pary i jednej skali mocy (asercje są dla tego scenariusza; test nie jest ogólnym dowodem).

### Zarzut 5 — logi bramek nie trafiły do commita: PRZYJMUJĘ
Dowód: evidence/bram-tsc.log (rc=0), evidence/bram-logic-test.log (`LOGIC OK (213/213)`), evidence/bram-tech-tree-test.log (`tech-tree-test: 20 pass, 0 fail`), evidence/bram-research-test.log (`PASSED: 33 / FAILED: 0 / TOTAL: 33`), evidence/bram-unit-replace-test.log (`WSZYSTKIE TESTY ZIELONE (21/21)`), evidence/bram-combat-test.log (`All sanity checks passed.`), evidence/drvm-test.log (`10 pass, 0 fail`). Wszystkie w commicie.

### Zarzut 6 — rozdział nominalnej od efektywnej przy aktywnych bonusach: NIE_ZMIERZONO (przyjmuję brak pomiaru)
Scenariusz nie ma bonusów (weteran/fortyfikacja/trudność), więc B = C = 90. Pomiar wymagałby innego stanu gry; poza zakresem tej rundy. Wniosek z kodu (nie z pomiaru): B i C różnią się tylko, gdy obiektywna moc efektywna różni się od nominalnej (main.ts:2897-2930).

## Bramki i testy (surowe wyjścia w evidence/, pliki zacommitowane)
- `npx tsc --noEmit` (gra/): rc=0, bez wyjścia błędów (bram-tsc.log: `rc=0`)
- `node tools/logic-test.cjs`: rc=0, `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs`: rc=0, `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs`: rc=0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs`: rc=0, `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs`: rc=0, `All sanity checks passed.`
- `node --check tools/diplomacy-relation-value-mismatch-live-test.cjs`: OK (po edycji)
- Chromium (vite bundle zbudowany poza repo, `vite build --outDir` w scratchpad, zero zmian w gra/src): `diplomacy-relation-value-mismatch-live-test: 10 pass, 0 fail`, zero console.error/pageerror.
- Mutacja: NIE DOTYCZY (brak zmiany kodu gra/src; test pomiarowy, asercje sprawdzone przez PASS na realnych liniach).

## Surowe liczby pomiaru (drvm-result.json, pokój, AI id=1)
- statusPrzedEndTurn: `pokoj`
- PW: `Relacja 11,6 · Twoja strona słabsza (−88,4% PW); oni: baza`
- Audiencja: `Stan bieżący: Relacja 90 / 200 · Zaufanie 1 / 100 · Respekt 89 / 100 · nastawienie: Życzliwy`
- Blokady: `masz 0.6`, `masz 90`, `masz 50`
- Wojna (po setWar): `WOJNA`, PW nieobecny, `Relacja 90 / 200 … nastawienie: Wrogi (etykieta Wrogi: limit wojenny 29)`

## Status ABC (nie zmieniam kodu sam)
Pomiar pokazuje dwie różne perspektywy i dwie skale (D = proponent AI, C = gracz efektywny), plus zapisaną wartość A (50,6), którą UI pokazuje tylko jako „masz 50”. Nazwy etykiet i wybór wariantu (A ujednolicić / B etykiety / C zostawić) są decyzją właściciela. Proponowane etykiety (wariant B, poprawione o perspektywę):
- PW: „Relacja z perspektywy proponenta: 11,6 (zaufanie + udział mocy proponenta)”
- Audiencja: „Relacja 90 / 200 (zaufanie + udział mocy gracza, efektywnie)”
- Blokady: „zapisany Respekt 50 (historia)” obok nominalnej 90

## RUNDY
3/5 (runda obrony operatora po FC FAIL r1 i Evaluator r2). Evaluator r2 wystawił 6 zarzutów; wszystkie rozstrzygnięte (5 PRZYJMUJĘ, 1 NIE_ZMIERZONO z uzasadnieniem).

## NASTĘPNY KROK
Orkiestrator: (1) ABC właściciela: wariant A/B/C i nazwy etykiet powyżej; (2) po wyborze B: Operator R4 — etykiety w diplomacyAcceptanceBalance.ts i diplomacyAudience.ts, mutacja testu, tsc + 5 bramek; (3) bramka wojny w UI: PW nieobecny w wojnie, więc liczba D w wojnie nie istnieje, dopóki propozycja nie jest ważna — zdecydować, czy to ma być opisane w etykiecie.

DEPLOY/PUSH: NIE WYKONANO
