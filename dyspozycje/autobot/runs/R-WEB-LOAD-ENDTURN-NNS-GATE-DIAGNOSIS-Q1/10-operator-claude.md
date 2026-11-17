# R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (bramka „Zakończ turę” NNS po wczytaniu zapisu) — tylko diagnoza, bez zmian reguł i bez zmian w `gra/src`, `gra/data`
TEMAT: R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1
BAZA: `origin/main` = `439b1e1ae0a6dbec769495941dff30867aa8857e` (ancestor-check OK; worktree przełączony na ten SHA)
GOAL: ustalić, kiedy i dlaczego bramka NNS blokuje „Zakończ turę” po wczytaniu zapisu; czy to realny defekt wczytania; rekomendacja (bez implementacji).

## ZMIANY/COMMIT
- `gra/tools/nns-stale-forecast-after-load-repro.cjs` — minimalne repro w żywym Chromium (vite build poza repo, `CHROME_PATH=/usr/bin/chromium`).
- `dyspozycje/autobot/runs/R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1/10-operator-claude.md` — ten raport.
- `dyspozycje/autobot/runs/R-WEB-LOAD-ENDTURN-NNS-GATE-DIAGNOSIS-Q1/evidence/` — surowe JSON/logi i skrypty probe (użyte do pomiarów).
- `gra/src`, `gra/data`: zero zmian (`git status`: tylko powyższe ścieżki, untracked). Commit tylko tych ścieżek (`git add <ścieżka>`).

## POMIARY (liczby z surowego wyjścia; Chromium headless, `?playtest=mapa&civTest=1`)

Odczyt: `window.__aiTradeWiringTestDebug.nnsDiag()`. Uwaga pomiarowa: `forecast` w odczycie jest cache sprzed tego odczytu (nnsDiag czyta cache przed `nnsGateForPlayer()`, które może go przeliczyć), więc raport używa dwóch kolejnych odczytów.

| Zapis | Tura | „Zakończ turę” po wczytaniu | Warunek blokady i liczby | To samo bez wczytania |
|---|---|---|---|---|
| A (quickSave tury 1) wczytany w ŚWIEŻEJ stronie | 1 | DZIAŁA: endTurn 1→2, `bramkaBlokuje=false`, cache `null` | — | świeża gra tura 1: DZIAŁA (identycznie) |
| A wczytany w TEJ SAMEJ stronie (po endTurn do tury 2 tej samej gry) | 1 | NIE DZIAŁA: `bramkaBlokuje=true`, endTurn 1→1 (nie przechodzi) | cache po przeliczeniu: `spichlerzObecny=0`, `spichlerzPo=-48`, `turaPrognozy=1`; komunikat „po zakończeniu tury zabraknie 46 … podatek +28 złota” | ta sama tura 1 w świeżej grze: bramka wolna, endTurn przechodzi |
| Gra świeża, endTurn 1→2 (bez wczytania) | 2 | NIE DZIAŁA (blokada w turze 2 niezależna od wczytania) | `spichlerzObecny=0`, `spichlerzPo=-48`; komunikat „zabraknie 46” | — (to jest stan bez wczytania) |
| B (zapis tura ≥20, kilka miast) | — | NIE ZMIERZONO | scenariusz mapa blokuje już turę 2 (patrz niżej); interwencja harnessu odblokowała jedną turę, nie dociągnięto do tury 20 | NIE ZMIERZONO |
| C (kampania / większa gra) | — | NIE ZMIERZONO | nie uruchomiono w tej rundzie | NIE ZMIERZONO |

Dodatkowe pomiary:
- Świeża gra, tura 1: `forecast=null`, `bramka=false`, endTurn przechodzi (2 odczyty, także po `setPlayerEraForTest(1)`). Brak błędów `[NNS]` w konsoli.
- Wczytanie A w świeżej stronie (bez wcześniejszej gry): tura 1, endTurn 1→2, potem `spichlerzPo=-48` (zgodnie z grą źródłową).
- Interwencja harnessu: `setSpichlerzPanstwa(0, 400)` przy tura 2 → `bramkaBlokuje=false` (odczyt po ustawieniu: `sp=400`). Pełnego przebiegu tury 2 po interwencji nie zweryfikowano.

## WNIOSEK

1. **Blokada w turze 2 (świeża gra, scenariusz mapa) NIE jest artefaktem wczytania.** Realna prognoza po turze wynosi `spichlerzPo=-48` przy zapasie spichlerza 0 (bez wczytania). Jest to zgodne z obecną logiką bramki (prawdziwa prognoza < 0). Pytanie projektowe dla właściciela: czy taki start (zapas 0, deficyt 48) ma być zablokowany w turze 2 w scenariuszu testowym — NIE ZMIERZONO w prawdziwej nowej grze (nie sprawdzano domyślnego startu spichlerza).
2. **Wczytanie w tej samej stronie daje INNĄ prognozę niż wczytanie w świeżej stronie.** Ta sama tura 1 i ten sam zapis: świeża strona → bramka wolna; ta sama strona po grze → bramka blokuje z `spichlerzPo=-48`. To jest realna różnica zachowania po wczytaniu i uzasadnia nazwanie tego defektem wczytania w tym scenariuszu.
3. **Hipoteza H1 z dispatchu (cache nieprzeliczony po wczytaniu) w swojej prostej formie NIE potwierdza się.** Po wczytaniu `turaPrognozy` zmienia się z 2 na 1, czyli przeliczenie po wczytaniu zachodzi (dirty-gate zadziałał). Problem leży więc w danych wejściowych przeliczenia, nie w samym fladze: przeliczenie w stanie wczytanym daje −48, a w świeżej stronie daje brak prognozy (`null`). Co dokładnie różni te dwa wejścia (np. stan miast/`ME()`, `empireFoodStates`, mapy utrzymania jednostek lub `cityBuilt`, które mogą nie być odtworzone/wyczyszczone przy wczytaniu w tej samej stronie) — **NIE ZMIERZONO**; to jest najbliższy następny pomiar.
4. Odpowiedź na pytanie dispatchu: **realny defekt wczytania: TAK w scenariuszu „wczytaj w tej samej stronie po grze” (zmierzone, A, tura 1); NIE ZMIERZONO dla zapisów ze środka rozgrywki (B) i kampanii (C); w świeżej stronie po wczytaniu brak defektu (zmierzone).**

## REPRO (minimalne, `gra/tools/nns-stale-forecast-after-load-repro.cjs`)

Kroki: świeża gra → quickSave tura 1 → endTurn (tura 2, blokada −48) → `loadSlot` tej samej tury 1 w tej samej stronie → odczyt (blokada) → endTurn (nie przechodzi). Kontrola: świeża strona → `loadSlot` tury 1 → odczyt (wolne) → endTurn (przechodzi). Wynik surowy: `evidence/repro-stale-forecast-after-load.json`. Błędy strony: 0.

Uwaga o narzędziu: wcześniejsza wersja diagnostyczna (A/B/W2/W3 w jednym pliku) została usunięta z repo, bo ścieżka „wczytaj w stronie z własną grą” w niej nie była wiarygodna (w jednym przebiegu wczytanie nie zmieniło tury w czasie 120 s; nie ustalono przyczyny). Surowy wynik tej wersji zostawiono w `evidence/run1-A-B-diag-timeline-raw.json` tylko jako zapis przebiegu.

## KANDYDACI NA NAPRAWĘ (bez implementacji; decyzja właściciela)
- K1 (diagnostyczny, najpierw): porównać wejścia `projectEmpireFoodAfterTick` / `previewCityEconomy` po wczytaniu w tej samej stronie i w świeżej stronie (różnice map: `empireFoodStates`, `playerEconUnitsForUpkeep`, `cityBuilt`, `_lastPlayerCityEcon`, `ME()`). Dopiero wtedy wybrać poprawkę.
- K2 (prawdopodobna poprawka po K1): w ścieżce wczytania (`restoreGameFromSave`, ok. src/main.ts:49576) zresetować lub odtworzyć wszystkie mapy wejściowe prognozy NNS przed `markCityStateDirty()`, tak by przeliczenie po wczytaniu operowało wyłącznie na stanie zapisu.
- K3 (ochrona, bez znajomości przyczyny): unieważnić `_nnsHumanForecast` przy wczytaniu (ustawić `null`) i wymusić przeliczenie przed pierwszą oceną bramki. Nie usuwa przyczyny (przeliczenie i tak dało −48), więc nie wystarcza samo.
- K4 (decyzja projektowa, niezależna): czy tura 2 w scenariuszu mapa (zapas 0, deficyt −48) ma być blokowana bramką NNS — sprawdzić domyślny start spichlerza w prawdziwej nowej grze (NIE ZMIERZONO).

## TESTY
- `npx tsc --noEmit -p .` w `gra/`: exit 0 (`TSC_EXIT=0`, bez komunikatów).
- Repro w Chromium: wynik JSON powyżej, `bledyStrony=[]`.
- 5 bramek referencyjnych: NIE URUCHAMIANO (rozliczenie: brak zmian kodu gry; diagnoza nie wymaga bramek, a pełny zestaw nie został uruchomiony w tej rundzie).

## BLOKADY / NIE ZMIERZONO
- B (tura ≥20, kilka miast) i C (kampania): nie zmierzono (budżet rundy, blokada w turze 2 scenariusza mapa).
- Przyczyna różnicy wejść po wczytaniu (punkt 3 wniosku): nie ustalono.
- Domyślny start spichlerza w prawdziwej nowej grze: nie sprawdzono.
- Dlaczego świeża strona w turze 1 zwraca `forecast=null` (czy to brak miast gracza na tym etapie, czy inna ścieżka): nie ustalono; w konsoli brak błędów `[NNS]`.
- Część trafień `awaitingFirstPlayerCity` w konsoli przy świeżej grze przed `setPlayerEraForTest`: nie analizowano.

## RUNDY
1/5 (runda 1 tego dispatchu; poprzednie wyniki wg dopisku orkiestratora nie dotarły do repo).

## NASTĘPNY KROK
Orkiestrator decyduje o kolejnej rundzie: K1 (porównanie wejść prognozy po wczytaniu w tej samej stronie i w świeżej stronie) jako osobny pomiar, następnie decyzja właściciela (K2 vs K4) przed implementacją.

## UWAGI-DLA-ORKIESTRATORA
- Nie zakładano sesji, zadań ani harmonogramów (zakaz z dispatchu zachowany).
- Mapa `playtest=mapa` blokuje turę 2 już w świeżej grze; ma to wpływ na każdy przyszły pomiar „tura ≥20” w tym scenariuszu — trzeba użyć innego startu albo jawnej interwencji harnessu (użyto `setSpichlerzPanstwa`, opisane wyżej).
- Narzędzie `nnsDiag` (hak civTest, `src/main.ts` ~31186) zwraca `forecast` przed przeliczeniem; przy przyszłych pomiarach trzeba brać kolejny odczyt, albo poprawić kolejność w haku (zmiana w src — poza tym tematem).

DEPLOY/PUSH: NIE WYKONANO
