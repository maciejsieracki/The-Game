STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1
GOAL: odpowiedzieć na zarzuty 1-6 Evaluatora (37ef7b52e, 20-evaluator-claude.md) dla kandydata 4a8eddaaa; diagnoza nakładki „Tworzenie świata” w trakcie tur, bez zmian kodu gry.
BAZA: kandydat 4a8eddaaa43a4037b009503e9a75b49c52d8ff1b (worktree detached, gra/src i gra/data nietknięte).
ZMIANY/COMMIT: nowe gra/tools/world-overlay-midgame-diag-probe.cjs (sonda read-only: stos console.warn „endTurnInProgress”, rejestr nakładki w DOM, log zakończenia startu); runs/.../evidence/probe-real-11.json i probe-mapa-11.json (surowe wyniki sondy); runs/.../30-obrona-claude.md. Wszystkie pliki w allowliście tematu. Zero zmian w gra/src, gra/data, WERSJE.md. Symlink gra/node_modules (nietrackowany, ignorowany) usunięty przed commitem.
TESTY: sonda probe-real-11 (3 tury, ziarno 11): turns=3, hung=0, max endTurn 3443 ms, blk=47 (wszystkie ze stosu canPlayerInitiateEndTurn <- canEndTurn <- refreshD1BModules <- updateHud), DOM .civ-map-load-overlay po każdej turze = 0, log „[civ-perf] wall-clock Nowa gra → hide overlay” obecny, pageerror=0. Sonda probe-mapa-11 (?playtest=mapa, grant -100000, 3 tury): turns=3, hung=0, blk=13 (ten sam stos), DOM .civ-map-load-overlay = 1 po worldReady+3s i po każdej z 3 tur, brak logu „hide overlay” i brak logu „[PlaytestMapa] seed=”, pageerror=0. Bramki kodu (tsc, logic-test, tech-tree, research, unit-replace, combat) NIE były uruchamiane w tej rundzie: kod gry się nie zmienił (git diff --name-only 4a8eddaaa -- wymienia wyłącznie pliki tematu), a wyniki bramek na 4a8eddaaa podał Evaluator (zielone, 213/213, 20/0, 33/0, 21/21, 6/6). NIE_ZMIERZONO w tej rundzie: pełne 30 tur z sondą.
BLOKADY: brak. Ograniczenia pomiaru wymienione przy zarzutach 3, 4, 5, 6.
RUNDY: 2/5 (obrona po ocenie 1/5 Evaluatora)
NASTĘPNY KROK: Final Control (SONNET) na tym SHA; werdykt dotyczy wyłącznie zmienionych wniosków z tabeli poniżej.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — PRZYJMUJĘ (błąd w raporcie Operatora, poprawka wniosku H2)
Dane surowe potwierdzają zarzut. W checkpoint-mapa-mapa-100000-11.json i -150000-11.json każda tura ma overlayVisibleBefore=true, overlayVisibleAfter=true, endTurn.overlayDuringEnd=true. Tabela w 10-operator-claude.md (kolumna „Overlay widoczny w turze = 0”) była błędna. Sonda probe-mapa-11 potwierdza to niezależnie: .civ-map-load-overlay = 1 w DOM po worldReady+3s i po każdej turze, jeden węzeł przez całą partię.
Przyczyna, dlaczego nakładka nie znika w ścieżce mapa, została częściowo ustalona:
- W logu sondy nie ma ani „[civ-perf] wall-clock … hide overlay” (wypisywany przez finishMapLoadWithPerfReport, main.ts:95, loading.hide()), ani „[PlaytestMapa] seed=” (main.ts tuż przed finishMapLoadWithPerfReport w doStartPlaytestMapaSwiata, ~47575). W scenariuszu real oba logi są obecne.
- Jedyny węzeł nakładki został dołączony raz (domAppear=1, attach-appendChild ze stosu doStartPlaytestMapaSwiata, main.ts:47378), a loading.hide() (root.remove) nie został wykonany.
- Brak pageerror, więc nie ma nieobsłużonego wyjątku widocznego dla Playwright.
- Po zakończeniu runu NIE_ZMIERZONO, na którym dokładnie return/wyjątku kończy się doStartPlaytestMapaSwiata. Kandydat z kodu: return po `!newSceneResult` (main.ts:47403, showMainMenu, bez wołania finishMapLoadWithPerfReport), choć w tym runie gra trwa (pary START/DONE tur), więc to niepewne. Wyjątek w buildScene nie pasuje (jego catch w runBuildSceneWithOverlay wywołuje hide). Rozstrzygnięcie wymaga pomiaru z trace (poza zakresem tej diagnozy).
Wniosek H2 zmienia werdykt: z „NIE_ODTWORZONO” na ARTEFAKT — nakładka zostaje w DOM w ścieżce dev-only ?playtest=mapa (zdjęcie nie następuje, bo funkcja startu playtestu nie dochodzi do hide). Realna ścieżka (startGame → foundFirstCity → endTurn, sonda probe-real-11 i runner real-11/-33) nakładki w trakcie tur NIE pokazuje. Efekt dotyczy wyłącznie trybu playtest; na ścieżce gracza nie odtworzono.

### Zarzut 2 — PRZYJMUJĘ (objaw istnieje, źródło ustalone, H4 poprawiony) i wyjaśniam
Log „[EndTurn] blocked: endTurnInProgress” występuje na ścieżce realnej (real-11: 22 wpisy w pierwszych 30, sonda: 47 blokad w 4 turach). Źródło ustalone stosem z sondy (console.warn opakowany w init-script, zapis new Error().stack):
  canPlayerInitiateEndTurn (main.ts:39504) <- Object.canEndTurn (main.ts:~31554/27485) <- render2.update <- refreshD1BModules <- updateHud
czyli to odpytanie stanu przycisku/HUD (canEnd), a NIE drugie wywołanie endTurn. Runner woła endTurn raz na turę (triggerPlayerEndTurn: START/DONE po jednej parze w logu sondy). Blokada jest czysto diagnostyczna (odmowa w canPlayerInitiateEndTurn zwraca false, nie wpływa na tura 1→2, endTurnSeen=true, hung=0). Wniosek: blokady to hałas logu wywołany co klatkę HUD podczas trwającego endTurn; nie są zawieszeniem. H4 („zawieszenie endTurn 9→10 na realnej ścieżce”) pozostaje NIE_ODTWORZONO dla 30 tur (runner real-11/-33: hung=0, max 3876/3369 ms), a nie tylko „bez analizy”.
Zauważone do UWAG: canPlayerInitiateEndTurn loguje console.warn przy każdym odpytaniu HUD (main.ts:39504), stąd tysiące wpisów przy długim endTurn; kandydat na osobny drobny temat (poziom logu, nie gameplay).

### Zarzut 3 — PRZYJMUJĘ (zawężenie pokrycia)
Scenariusz mapa to 4 tury, 1 ziarno (11), grant -100000 przed turą 1. H2/H3 dla tur >4, dla narastającego deficytu i dla grantu w środku partii to NIE_ZMIERZONO (nie wykonano). Metadana „map: Standardowy” w checkpointach runnera jest niezgodna z playtestem (rozmiar „Maly”, main.ts:47376) — przyjmuję jako błąd etykiety w runnerze (pole metadanych, nie wynik pomiaru); nie wpływa na wnioski real.

### Zarzut 4 — PRZYJMUJĘ (ograniczenie ścieżki)
Start realny idzie przez hak window.__nnsMeasureDebug.startGame() (wywołuje realne doStartGame; stos nakładki startowej wskazuje doStartGame main.ts:46520), a pierwsze miasto przez foundFirstCity(). Ścieżka przez klikanie menu NIE_ZMIERZONO. Zrzutów ekranu nie wykonano (NIE_ZMIERZONO). Werdykt „realna ścieżka” odnosi się do wywołania doStartGame i endTurn, nie do UI.

### Zarzut 5 — PRZYJMUJĘ (osobny temat, nie naprawiany)
Seed 22: generacja świata nie zakończyła się w 500 s (checkpoint-real-real-22.json: done=false, ostatnia faza „Kontynenty 7/10 · Rzeki — uzupełnianie”, „Upłynęło: 8:07”). Nie powtórzono ziarna ani ziarna odniesienia na tej samej maszynie (NIE_ZMIERZONO, czy to defekt generatora czy obciążenie). Kryterium „≥2 ziarna” spełnione przez 11 i 33. Idzie do UWAG-DLA-ORKIESTRATORA.

### Zarzut 6 — PRZYJMUJĘ (H5 bez stosu resetu)
Nie odtworzono resetu do „TURA 1 / Załóż miasto”, więc nie ma stosu z reproduktora. H5 (regenerateWorldForLoad przy wczytaniu, main.ts:46399/47641, loadNeedsMapRebuild main.ts:10160) pozostaje NIE_ZMIERZONO. Wniosek końcowy należy czytać jako: w tym pomiarze nakładka w trakcie tur nie wraca na realnej ścieżce; reset z W80A/W80B nie został odtworzony ani zlokalizowany.

## Tabela hipotez (poprawiona)

| Hipoteza | Wynik (poprawiony) | Dowód |
|---|---|---|
| H1: nakładka wraca w trakcie partii na realnej ścieżce (nowa gra -> miasto -> endTurn) | NIE_ODTWORZONO (2 ziarna 30 tur, runner real-11/-33; sonda real-11 3 tury: DOM=0 po każdej turze) | evidence/checkpoint-real-real-11.json, -33.json; evidence/probe-real-11.json |
| H2: ?playtest=mapa + grant wywołuje ponowne generowanie świata w trakcie tury | ARTEFAKT (ścieżka playtest): nakładka startowa playtestu zostaje w DOM przez wszystkie tury (1 węzeł, brak hide); NIE jest ponownym generowaniem; zakres: tury 1-4, grant przed turą 1 | evidence/probe-mapa-11.json; checkpoint-mapa-*.json (overlayVisibleBefore/After=true) |
| H3: reset do „TURA 1 / Załóż miasto” przy deficycie ~130–150k | NIE_ZMIERZONO (tury >4 i narastający deficyt nie były badane; w tych 4 turach brak resetu, tura 1→5, miasto 1) | checkpoint-mapa-*.json, checkpoint-real-*.json |
| H4: zawieszenie endTurn 9→10 / endTurnInProgress na realnej ścieżce | NIE_ODTWORZONO (30/30 tur, hung=0, max 3876 ms); log endTurnInProgress występuje, źródło = odpytanie HUD (canEnd), nie zawieszenie | checkpoint-real-real-11/-33.json; probe-real-11.json (stos blk) |
| H5: regeneracja świata przy wczytaniu zapisu | NIE_ZMIERZONO (nie testowano wczytania; brak stosu resetu) | kod: main.ts:46399, 47641, 10160 |

## UWAGI-DLA-ORKIESTRATORA
1. Dispatch: oryginalny 00-dispatch.md nie istnieje w origin/main; użyto wersji z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md) oraz DODATEKU z tej samej gałęzi.
2. Kandydat do osobnego tematu (defekt playtestu, dev-only): doStartPlaytestMapaSwiata nie dochodzi do finishMapLoadWithPerfReport w ścieżce ?playtest=mapa (brak logów „[PlaytestMapa] seed=” i „hide overlay”), nakładka zostaje na ekranie przez całą partię. Nie dotyczy realnej ścieżki. Rozstrzygnąć trace’em między main.ts:47378 a 47575.
3. Kandydat do osobnego tematu (generator): seed 22 nie kończy generacji w 500 s (faza „Rzeki — uzupełnianie”). Potencjalny realny defekt: nakładka „Tworzenie świata” zostaje bez końca. Wymaga powtórzenia z ziarnem odniesienia.
4. Kandydat drobny (log): canPlayerInitiateEndTurn (main.ts:39504) loguje console.warn przy każdym odpytaniu HUD w trakcie endTurn; hałas w logu, bez wpływu na grę.
5. Pozostaje NIE_ZMIERZONO: reset do „TURA 1 / Załóż miasto” (W80A/W80B) i ścieżka wczytania zapisu (H5). Wymaga osobnego tematu diagnostycznego.
6. Gałąź dispatchu nie zawiera sekcji „środowisko/stan/zadanie rundy” opisanej w zleceniu; oceniono wg treści z DODATKU.
