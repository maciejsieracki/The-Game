STATUS: PASS-WITH-NOTES (częściowo: 2 pozycje naprawione, sweep nie-live zmierzony, 107+45+4 czerwonych poza zakresem tej rundy)
DOMAIN: GAME (testy; zero zmian logiki gry — gra/src nietknięte)
TEMAT: R-WEB-TEST-DEBT-Q13
GOAL: usunąć czerwone po FALACH 875–888 w obowiązujących regułach (bez osłabiania asercji), zmierzyć pełny sweep nie-live, błędy gry zgłosić jako kandydatów.
BAZA: origin/main 2127238ace30b2c5a51e78a190f5587a525aa27c (detached, worktree wf_8df7df1a-9c1-1)

ZMIANY/COMMIT:
- gra/tools/ai-test.cjs — 5 pozycji (poziom3 economy, T5a, T5b, T5d, T5f) — przyczyna: FIXTURE NIEZGODNY Z KONTRAKTEM main.ts (stary pin testów)
  * main.ts zawsze przekazuje `isProductionAllowed` do decideAITurn; test go nie przekazywał -> garnizon fallback `garrisonUnitCandidatesForCity` (ai.ts ~1965) zwracał Wojownika mimo canAfford=false -> 3 x Wojownik zamiast 0 build (T5a/T5b/T5f). Dodano `isProductionAllowed: () => true` (kontrakt main.ts). Asercje bez zmian.
  * Garnizon min. 1 w każdym mieście AI (decyzja właściciela 2026-11-18, FALA 857, R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1): miasta testowe bez jednostki bojowej dostawały garnizon Wojownika zamiast badanej produkcji (poziom3 economy; T5d ekon=3 mil=3). Fixture: po jednym Wojowniku-garnizonie w każdym mieście (`garrisonedUnits`, `garrisonF`). Asercje bez zmian.
- gra/tools/war-rules-multiwar-main-guard-test.cjs — 3 pozycje — przyczyna: DRYF REGEXÓW na main.ts (stary pin)
  * klaster państw-miast: `chargeWarDeclarationCredibility(csOwnerId, ME())` jest ~520 znaków od początku pętli (okno 500 za krótkie) -> okno 900 (kolejność asercji bez zmian).
  * applyAllianceObligationsOnWar: sygnatura zmieniona na `(attackerId, victimId, typWojny: TypWojny = 'naturalna')` (FALA R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1) -> marker dopasowany do nowej sygnatury. Sprawdzane warunki (bramka przed joinAllyToWar) bez zmian.
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q13/10-operator-claude.md, 20-sweep-nonlive.txt (ten raport i surowy sweep).

TESTY (surowe wyniki, po zmianach):
- war-rules-multiwar-main-guard-test: przed 18 PASS / 3 FAIL -> po 21 PASS / 0 FAIL
- ai-test: przed 292 passed / 5 failed -> po 297 passed / 0 failed (uruchomienie z CHROME_PATH=/usr/bin/google-chrome)
- Bramki: tsc --noEmit rc=0 (bez wyjścia); logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33/0 (TOTAL 33); unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21); combat-test "All sanity checks passed." (6 OK)
- Sweep nie-live: 1101 plików gra/tools/*-test.cjs bez chrome/puppeteer/playwright, timeout 60 s, 4 równolegle, wynik: 945 zielonych (exit 0), 156 czerwonych = 107 (exit 1) + 45 (exit 124, timeout pod obciążeniem) + 4 (exit 2). Surowe wiersze: dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q13/20-sweep-nonlive.txt.
- Pozycje z dispatchu: empire-food-b5-test, building-upkeep-resources-test, diplomacy-value-catalog-test, hodowla-las-test — NIE są na liście czerwonych sweepu (zielone w tym przebiegu); forced-war-iron/stone/bronze — CZERWONE (patrz niżej, NIE naprawiono w tej rundzie).

BLOKADY / NIE ZMIERZONO:
- 156 czerwonych z sweepu NIE zostało zaklasyfikowanych do pozycji „stary pin / martwy / błąd gry” w tej rundzie. Lista w 20-sweep-nonlive.txt. Nie mam listy czerwonych z FC DIPLOWARLEVEL/ENABLEFLAGS/UPKEEPPACE w tym worktree (sekcja DECYZJE w KOLEJKA-WEB.md nie zawiera list testów), więc „nowe względem FC” nie zostało ustalone.
- 45 pozycji exit 124 (timeout 60 s przy 4 równoległych) — NIE ZMIERZONO sekwencyjnie; wiele to generatory map (pangea/river/coast/relief/...) i może być tylko przeciążeniem.
- Pierwsze obserwacje (NIE rozstrzygnięte, do triage w kolejnej rundzie):
  * forced-war-stone-test 28/3: „start po 25 turach” got 40 want 25 — prawdopodobnie kolizja z regułą R1 (tura 40) dla Kamienia (war-rules-multiwar.ts: Kamień -> R1 obowiązuje, R-WEB-ERA-DELAY-Q1); oczekiwanie testu może być stare. Wymaga decyzji/analizy przed zmianą.
  * forced-war-iron-test 54/1: „próg startu Żelaza = 20 tur” — src ma próg 20 z JSON (forced-war-iron.ts:130, R-WEB-ERA-DELAY-Q1), do sprawdzenia dlaczego test się rozjeżdża.
  * forced-war-bronze-test: SOME TESTS FAILED (nie badano).
  * Kandydaci błędów gry do ewentualnego R-WEB-* (NIE naprawiane): brak — nie stwierdzono w tej rundzie wiarygodnego błędu gry; NIE ZMIERZONO.
- Poza zakresem allowlisty, zauważone (NIE dotykane): w worktree po teście pojawiły się niezacommitowane zmiany `gra/src/game/barbarians.ts` (usunięty blok w decideBarbarianMoves ~2558) i `gra/tools/.victory-screen-bundle.css` (4 dodatkowe zmienne CSS). Nie są moje — nie zacommitowano ich i nie cofnięto. Orkiestrator powinien sprawdzić źródło przed integracją.

RUNDY: 1/5
NASTĘPNY KROK: runda 2 (Operator Haiku): triage 156 czerwonych z 20-sweep-nonlive.txt, najpierw grupa forced-war-{stone,iron,bronze} i wszystkie wiersze exit 1 (wg ostatniej linii PASS/FAIL); dla każdej pozycji tabela pozycja | stan przed | przyczyna | co zrobiono | stan po. Ustalić listę czerwonych z FC DIPLOWARLEVEL/ENABLEFLAGS/UPKEEPPACE (z ich run-dir na gałęzi FC), aby odróżnić nowe od starych.
DEPLOY/PUSH: NIE WYKONANO
