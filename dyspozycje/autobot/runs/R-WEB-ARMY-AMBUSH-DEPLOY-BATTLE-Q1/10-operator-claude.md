STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1
GOAL: bitwa z zasadzki: zastawiający ma strefę obejmującą także pole wroga (AI rozstawia się automatycznie na skrzydłach i tyłach linii wroga); zaskoczeni rozstawiają się w długiej linii, max 3 jednostki w szeregu (AMBUSH_FORMATION_MAX_WIDTH = 3); zwykłe bitwy bez zmian.
BAZA: 1c452ec35717373a4c39d17ccff19b30a7c37273 (origin/main, FALA 786). Dispatch czytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (commit 82c7e4354), DODATEK z tej samej gałęzi.

ZMIANY-COMMIT (allowlista, git add jawnymi ścieżkami):
- gra/src/battle/ambushDeploy.ts (NOWY): czysta geometria. ambushLineIdeal (szereg max 3 w poprzek, kolejne szeregi cofają się o rankStep), ambushResolveCells (najbliższe wolne pole, bez nakładania, w granicach), ambushFlankCells (AI-zastawiający: skrzydła daleko od wiersza środkowego, potem tyły linii zaskoczonych; deterministycznie).
- gra/src/battle/battleScene.ts: BattleOpts.ambush?: { surprisedSide }; pole _ambushSurprisedSide ustawiane w konstruktorze; _applyAmbushDeployIdeal wpięte w place() (_placeUnits) i w _placeUnitsOneSide (reset); _inDeployPlayerZone/_clampDeployPlayerCol: gracz-zastawiający = całe pole; komunikat po polsku w fazie rozstawiania (dwa warianty). Zwykła bitwa: _applyAmbushDeployIdeal wychodzi od razu przy surprised===null, zakresy stref bez zmian.
- gra/src/main.ts: openPlayerMapUnitAttackCore(..., ambushSurprised = false); fireAmbushOnHex przekazuje true (gracz wpadł w zasadzkę = atak gracza na zasadzkę AI); przy true: deploy=true i opts.ambush={surprisedSide:'atk'}.
- gra/tools/ambush-deploy-geometry-test.cjs (NOWY): test czystej geometrii.
- dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1/10-operator-claude.md (ten raport).
Nie ruszano: battleCommanderStar.ts, panelu TEMPO/minimapy, WERSJE.md, manifestu, gra-robocza/, rust-port/, gra/ build/dev.

TESTY (surowe wyniki, uruchomione w worktree, npm ci wykonane w gra/ bez build):
- npx tsc --noEmit (gra/): exit 0, 0 linii błędów.
- node gra/tools/ambush-deploy-geometry-test.cjs: WYNIK 20 OK / 0 FAIL (szerokość ≤3 dla N=1,5,12,30,60; przydział bez nakładania i w granicach; zajęte pola omijane; za mało miejsca → null; AI-flank deterministyczny i na skrzydłach; mutacja width=N łamie limit).
- node gra/tools/ambush-core-test.cjs: 40 OK / 0 FAIL.
- node gra/tools/ambush-wiring-test.cjs: 28 OK / 0 FAIL.
- node gra/tools/ambush-realstep-test.cjs: 16 OK / 0 FAIL.
- node gra/tools/ambush-ui-reason-test.cjs: 5 OK / 0 FAIL.
- node gra/tools/battle-commander-star-test.cjs: 17 PASS / 0 FAIL.
- node gra/tools/battle-commander-star-reset-test.cjs: 10 PASS / 0 FAIL.
- NIE ZMIERZONO: 5 bramek referencyjnych, mgla-sciezka-inwariant 42/0, load-game-regression 34/0, determinizm, pełne battle-* (znane timeouty), testy w przeglądarce (Chromium), zrzuty 1280×720. Powód: brak czasu rundy Operatora na pełny pakiet; FC musi uruchomić.

BLOKADY / NIEZREALIZOWANE (jawnie, dla FC):
1. Ograniczenie ≤3 w szeregu działa TYLKO na rozstawieniu startowym (AUTO i wejście w fazę). Ręczne przesuwanie w fazie rozstawiania NIE jest ograniczane do linii (dispatch: „wymuszone/ograniczone”) — NIE ZROBIONE.
2. Ścieżka AI→gracz: fireAmbushOnHex przy ruchu AI na zasadzkę gracza NIE otwiera bitwy (istniejąca luka z FALI 786: tylko komunikat „Zasadzka się powiodła”). Stąd gracz-zastawiający w realnej grze nie jest osiągalny; wpięcie zastawiającego-gracza wymaga otwarcia bitwy obrony (launchIncomingMapFieldBattle z flagą ambush) — NIE ZROBIONE, do decyzji orkiestratora.
3. Wizualizacja strefy (_buildDeployZone: zielone/mgła) nadal pokazuje dawne połowy pola; strefa gracza-zastawiającego jest poprawna logicznie, nie graficznie — NIE ZROBIONE.
4. Dla zaskoczonego w długiej linii fallback kolizji z _placeUnits może przesunąć jednostkę poza szereg (przy zajętych polach) — szerokość gwarantuje tylko geometria idealna, nie fallback. NIE ZMIERZONO w scenie.
5. Brak wpisu w wiki/Civpedia „Zasadzka” o rozstawieniu i brak regeneracji wikiBundle (dispatch pkt e) — NIE ZROBIONE.
6. Dług Rust (REPIN) dla rozstawienia z zasadzki — do zapisu w rejestrze, nie wykonany.
7. Test nie dodany do listy deployu (nie zidentyfikowano pliku listy w tej rundzie).
8. Zapis/wczytanie w trakcie rozstawiania i Reset (pkt 4 GOAL): Reset (_resetDeploySide) używa tego samego _applyAmbushDeployIdeal; zapis/wczytanie NIE ZMIERZONO.

ZAŁOŻENIA (luki rozstrzygnięte założeniem):
- „Długa linia max 3 szerokości” = szereg poprzek pola ≤3 jednostki; kolejne szeregi cofają się wzdłuż osi natarcia (kolumny).
- AI-zastawiający: skrzydła (|wiersz − środek| × 2) + odległość od frontu zaskoczonych × 0,5; remis: mniejszy wiersz, potem kolumna.

RUNDY: 1/5 (Operator, Haiku).
NASTĘPNY KROK: Evaluator — przegląd diffu, potem FC; FC decyduje o punktach 1–2 (ścieżka AI→gracz, ręczne ograniczenie linii) i o Chromium.
DEPLOY/PUSH: NIE WYKONANO
