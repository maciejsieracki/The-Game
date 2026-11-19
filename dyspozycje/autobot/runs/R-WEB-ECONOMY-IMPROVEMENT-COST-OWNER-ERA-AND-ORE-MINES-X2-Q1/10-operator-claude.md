# R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-IMPROVEMENT-COST-OWNER-ERA-AND-ORE-MINES-X2-Q1
GOAL: kopalnie rudy (miedź, cyna, żelazo) ×2 w danych; koszt budowy ulepszenia wg epoki WŁAŚCICIELA (0,5/1/2, dalej ×2), flaga w danych (domyślnie ON).
ZMIANY-COMMIT: patrz commit na gałęzi roboczej (SHA w polu `sha` raportu orkiestratora). Allowlista:
- gra/data/terrain-improvements.json:339,358,377 (koszt_praca 22→44: kopalnia_miedzi, kopalnia_zelaza, kopalnia_cyny; zloto:396 bez zmian)
- gra/data/improvement-cost-params.json (NOWY, `kosztUlepszenWgEpokiWlasciciela: true`)
- gra/src/game/terrain-improvements.ts:177-211 (IMPROVEMENT_COST_PARAMS, flaga + setter ForTest, `scaleTerrainImprovementWorkCostForOwner(base, epokaUlepszenia, ownerEra)`; flaga OFF = stary wzór)
- gra/src/game/improvement-tech.ts:91,107,121 (`getImprovementMeta(key, ownerEra?)`)
- gra/src/map/improvement-build.ts:978-980,1661-1663,1700 (gracz: state.playerEra)
- gra/src/game/ai.ts:3209,4171,5742 (`opts.civEra`)
- gra/tools/era-improvement-cost-upkeep-test.cjs (asercje przepisane: flaga OFF = dawna asercja; ON = wg epoki właściciela)
- gra/tools/improvement-cost-owner-era-test.cjs (NOWY)

TABELA KOSZTÓW (Praca, budowa), PRZED → PO:

| Ulepszenie (baza dane, epoka) | Kamień | Brąz | Żelazo |
|---|---|---|---|
| farma (20, ep.1) | 20 → 20 | 20 → 40 | 20 → 80 |
| fort (25, ep.3) | 100 → 25 | 100 → 50 | 100 → 100 |
| kopalnia miedzi (44, ep.2) | 44 → 44 | 44 → 88 | 44 → 176 |
| kopalnia żelaza (44, ep.3) | 176 → 44 | 176 → 88 | 176 → 176 |
| kopalnia cyny (44, ep.2) | 44 → 44 | 44 → 88 | 44 → 176 |
| kopalnia złota (22, ep.2, bez zmiany) | 22 → 22 | 44 → 44 | 44 → 88 |

PRZED = wzór epoki ulepszenia (flaga OFF = identyczny). PO = mnożnik epoki właściciela.

TESTY:
- tsc --noEmit: EXIT 0
- logic-test: LOGIC OK 213/213
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/0
- unit-replace-test: 21/21
- combat-test: 6/6
- econ-era-rebalance-test: 37 ok, 0 FAIL
- ai-economy-measure-hook-test: 23/23
- ai-territory-race-test: 29 OK, 0 FAIL
- improvement-era-scaling-test: 144 PASS, 0 FAIL
- auto-improvements-test: 46 passed, 0 failed
- ai-improvements-test: 56 passed, 0 failed
- era-improvement-cost-upkeep-test: 124 pass, 0 fail (po aktualizacji; przed: 13 fail, bo domyślna flaga ON zmienia epokę kosztu)
- improvement-cost-owner-era-test (nowy): 49 pass, 0 fail
- **auto-fort-claim-test: 60 pass, 3 FAIL** — CZERWONE:
  - "bez limitu (brak fortow) droga JEST budowana" (got [])
  - "fort stoi, brak innych kandydatow -> drogi ruszaja"
  - "dane produkcyjne: najdrozsze ulepszenie niedoboru (44) < fort (25)" (m7, niezmienniczość danych)
  Te same 3 FAIL przy fladze OFF (sprawdzone podmianą JSON i przywróceniem na true) → przyczyna to PODWOJENIE danych kopalń, nie flaga. Nie osłabiałem asercji. WYMAGA DECYZJI orkiestratora: re-baseline fixtury albo korekta testu m7.
- Dym 45 tur seed 4242: NIE ZMIERZONO (nie uruchomiono bundla/runnera w tej rundzie).

BLOKADY:
1. auto-fort-claim-test 3 FAIL (patrz wyżej).
2. auto-improvements.ts (`getImprovementMeta` w pickFortClaims i ~1773–2132) NIE dostało epoki właściciela → liczy wg Kamienia (×0,5). Niezgodne z kosztem budowy gracza/AI. Wymaga przekazania ownerEra z silnika (main.ts) — poza tym, co wolno w tej rundzie bez zmiany sygnatur opts.
3. gra/src/ui/entityCards/improvementAdapter.ts:180 (karta katalogowa „Koszt (Praca)”) nadal woła wzór epoki ulepszenia — karta nie zna właściciela; pokazuje wartość sprzed zmiany.
4. ai.ts: `opts.civEra` zakłada, że silnik go podaje (main.ts) — NIE ZWERYFIKOWANO.
5. Nie zmieniano main.ts, buildModeHud.ts, hud.ts (tylko wyświetlanie przez getImprovementMeta z improvement-build — pokryte).

ZAŁOŻENIA (rozstrzygnięte w kodzie):
- Epoka właściciela = `state.playerEra` (gracz) i `opts.civEra` (AI); brak → 1 (Kamień), jak `?? 1` w reszcie kodu.
- Flaga OFF nie cofa podwojenia kopalń w danych (dane są wspólne); „bit-w-bit” dotyczy formuły kosztu, nie wartości kopalń. Do decyzji orkiestratora.
- Utrzymanie Pracy ulepszeń (x1/2/4) i plony nietknięte.

NASTĘPNY KROK: orkiestrator decyduje o auto-fort-claim (re-baseline) i o przekazaniu owner era do auto-improvements; potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: brak nowych sesji/zadań (zakaz respektowany).
