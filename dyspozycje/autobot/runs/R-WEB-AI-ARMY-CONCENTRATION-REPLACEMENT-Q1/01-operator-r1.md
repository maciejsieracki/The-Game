STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — AI
TEMAT: R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1
GOAL: AI zbiera armię w jednym miejscu, także armię zastępczą po stratach (próg i promień z `army-concentration.ts`, bez zmian balansu/upkeepu).
ROLA/RUNDA: Operator, runda 1/5. Baza: `origin/main` b89ecee44 (>= 23dd158e9).

## Czytane wcześniej (żeby nie powtarzać)
P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1 (lokalny `planArmyConcentration` + `planArmyFrontMerge`, tylko gałąź BEZ wojny: ai.ts:3450-3580), R-WEB-ARMY-CONSOLIDATION-Q1 (flaga DEFAULT ON: pokój = zbiórka w stolicy, ai.ts:3585; wojna = `applyWarAllInCapitalToCommands`, ai.ts:3980). Wojna: lokalna koncentracja jest WYŁĄCZONA (`consolidationPeace` ai.ts:3448) i cały ruch jednostek bojowych przejmuje `planWarAllInCapital` (warAllInCapital.ts:610).

## Przyczyna (hipoteza właściciela potwierdzona w symulacji)
W wojnie `planWarAllInCapital` tnie jednostki w grupy łańcuchowo (link 3, warAllInCapital.ts:661) i wysyła KAŻDĄ grupę — także 1-2 świeże jednostki — samodzielnie na najbliższy cel (:699); rendezvous tylko do grupy w promieniu 10 (:765). Brak progu siły i brak wspólnego punktu zbiórki: jednostki z różnych miast po utracie armii głównej „trickle'ują" pojedynczo.

## Pomiar (NIE pełna gra w przeglądarce — ~30 s/turę, 6x150 tur NIE_ZMIERZONO)
`gra/tools/ai-army-replacement-sim.cjs`: prawdziwy `decideAITurn` + `buildWarCityTargets` + domyślne flagi (konsolidacja, all-in, multiwar), prawdziwy generator mapy; ATRAPY: rekrutacja (1 jedn./miasto/4 tury, cap 14), walka (pojedynki wg lokalnej przewagi, mury), brak zdobywania miast. 4 cywilizacje, 3 miasta, pierścień wojen od t20, 150 tur, 6 ziaren × światy flat/pangea/kontynenty. Pełna tabela: `pomiar-przed-po.txt`, surowe: `sim-{pre,post}-{flat,pangea}.json` (per cywilizacja: `perCiv`).
„Fala 2+" = jednostki urodzone po zniszczeniu armii głównej (≥3 strat w 2 turach).

| metryka (flat, 6 ziaren) | PRZED | PO |
|---|---|---|
| (a) klastrów (r=4) fala 2+ / udział odłączonych | 3.46 / 0.39 | 2.80 / 0.33 |
| (b) średni promień rozproszenia fala 2+ | 8.28 | 7.25 |
| (c) mediana/średnia tur do dołączenia do skupiska ≥3 (fala 2+) | 1 / 2.29 | 0 / 1.78 |
| (d) fala 2+, 15 tur po stracie: w armii ≥3 / singleton w polu / para / czeka w mieście | .67/.15/.13/.02 | .75/.11/.05/.06 |
| marsz na cel jednostek ze skupiska <3 (udział jednostko-tur) | 0.21 (6467) | 0.04 (917) |
| ms/wywołanie AI | 24.8 | 22.3 |
| (pangea) marsz <3 | 0.33 (1696) | 0.21 (1096) |
| (pangea) ms/wywołanie | 25.1 | 28.9 (NIE rozstrzygnięto: szum 2 trajektorii) |

(e) histogram przyczyn (jednostko-tury poza armią ≥3, wojna): PRZED flat: war-allin-march|singleton 3617, war-allin-march|para 2834, no-move 669 (źródło: warAllInCapital.ts:661/699 przez ai.ts:3969). PO flat: other-move (dojście do punktu zbiórki) 2848, no-move|czeka w mieście 1049, war-allin-march 917. Dispersja per archetyp (`sklonnoscDoPodboju` 1-4): NIE_ZMIERZONO — profil per cywilizacja w symulacji tylko częściowo różnicuje (perCiv w JSON bez rozbicia na archetyp).
Kontynenty: wojna nigdy nie dochodzi do kontaktu (0 zdarzeń „armia zniszczona", identyczny wynik PRZED/PO; pierwsza armia: 2.79 klastra, 50% odłączonych, promień 4.34 — przyczyna NIE_ZMIERZONO, hipoteza: brak trasy lądowej do celu).

## Zmiana
- `gra/src/game/army-concentration.ts`: `pickReplacementRallyCity`, `planWarReplacementRally` (:367, :391) — jednostka spoza skupiska ≥ `ARMY_CONCENTRATION_MIN_UNITS` w `ARMY_CONCENTRATION_RADIUS` jest „luźna"; punkt zbiórki = własne miasto najbliższe celu wojny (remis: id). Walczące jednostki liczą się do skupisk, nie są ruszane.
- `gra/src/game/ai.ts` (tylko `applyWarAllInCapitalToCommands`, :3989/:4024): luźne jednostki idą do miasta zbiórki zamiast na cel; skupisko ≥3 rusza jak dotąd; brak trasy do miasta → jednostka wraca do starego marszu (bez porzucania). Bramka tylko dla głównego wywołania (:3969, `gateLooseUnits=true`); kampania Generała (ai.ts ~4361) bez zmian. Flaga ARMY_CONSOLIDATION OFF = zachowanie bazowe. Zero nowych kluczy `ai-params.json`, zero zmian balansu/upkeepu.
- Nowe: `gra/tools/ai-army-replacement-concentration-test.cjs` (24 asercje), `gra/tools/ai-army-replacement-sim.cjs` (harness).

## TESTY
- `ai-army-replacement-concentration-test.cjs`: 24/24 (gate-replacement-test.txt, EXIT=0). Scenariusze z prawdziwym `decideAITurn`: S1 świeża rozproszona armia (0 marszów z <3; każdy ruch luźnej zbliża do miasta zbiórki; marsz dopiero po skupisku), S2 armia główna zniszczona → nowe jednostki z 2 miast zbierają się w jednym mieście, powstaje nowa armia, regresja: zebrana armia rusza w t1. MUTACJA (bramka `if (false)` w kopii bundla ai.ts = stan PRZED): S1/S2 mają naruszenia >0 → test czerwony. Pomiar w teście: 2 ziarna×70 tur, udział marszów <3: 0.025 vs 0.124 bez bramki; czas AI bez wzrostu.
- `army-concentration-test.cjs` 56/56 (gate-army-concentration-test.txt). tsc `--noEmit`: EXIT=0 (gate-tsc.txt).
- Regresja PRZED/PO (134 pliki): 34 czerwone w OBU stanach (te same kody); zero nowych czerwonych (gate-regresja-przed-po.txt). `war-allin-capital-test` 94/4 identycznie z ai.ts z HEAD (sprawdzone podmianą pliku). Podzbiór wojenny zielony (consolidation 10/0 i 6/0, general-war-campaign 51/0, multiwar 57/0).
- NIE uruchomiono: pełnej gry w przeglądarce; weryfikacji wizualnej (temat nie-wizualny).

## BLOKADY / NOTATKI DLA EVALUATORA
1. Przy pangea pierwsza armia nie poprawiła się (klastry 2.39→2.83, odłączeni 0.36→0.40 — różne trajektorie, szum) i udział tur z >2 skupiskami ≥3 wzrósł (0.16→0.30 fala 1): zbierające się zastępstwa tworzą drugą/trzecią grupę, gdy poprzednia już maszeruje. Nie wyeliminowano tego (reuse `merge_radius`=10 z war-allin-params.json poza allowlistą).
2. ZAŁOŻENIE: liczba armii = liczba wojen zostaje (decyzja R-WEB-ARMY-CONSOLIDATION-Q1); „jedno miejsce" znaczy: każda armia jest skupiskiem r=4 ≥3 jednostki. Jeśli właściciel chce JEDNEJ armii także przy 2 wojnach — DECYZJA_WYMAGANA (do orkiestratora).
3. ZAŁOŻENIE: punkt zbiórki = miasto najbliższe CELU (nie fronta/centroidu) — jednostki z tyłu przechodzą pojedynczo do niego (w tranzycie liczą się jako „singleton w polu").
4. Kampania Generała, wymuszona wojna (`planForcedWarWave`) i miasta-państwa: bez zmian, nie mierzone.
5. Równoległe tematy na ai.ts: zmiana ograniczona do jednej funkcji + importu; konflikty scali orkiestrator.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (przegląd luk 1-2, ewentualnie decyzja o merge skupisk ≥3 poza promieniem 10).
DEPLOY/PUSH: NIE WYKONANO
ZMIANY/COMMIT: SHA w sekcji poniżej.
