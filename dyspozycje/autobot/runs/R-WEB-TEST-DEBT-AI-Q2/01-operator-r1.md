STATUS: PASS
DOMAIN: GAME (WEB) — wyłącznie testy
TEMAT: R-WEB-TEST-DEBT-AI-Q2
GOAL: Spłata długu testowego bez zmian zachowania gry (3 testy: ai-home-defense-vs-barbarians, army-recruitment-concentration, spichlerz-deficyt-scalenie).

ZMIANY/COMMIT: baza origin/main 37402ebe1; commit w tej gałęzi (SHA: patrz `git log` — wpisany w odpowiedzi orkiestratorowi). Pliki: gra/tools/ai-home-defense-vs-barbarians-test.cjs, gra/tools/army-recruitment-concentration-test.cjs, gra/tools/spichlerz-deficyt-scalenie-test.cjs, runs/R-WEB-TEST-DEBT-AI-Q2/**. Zero zmian w gra/src, WERSJE.md, rust-port, src-tauri, battle, gra-robocza.

KLASYFIKACJA (wszystkie 10 czerwonych asercji = klasa A, zachowanie gry poprawne):
- hd T2/T4 "jednostka dostaje jakąś komendę": domyślnie konsolidacja armii (army-consolidation.ts, ai.ts ~3880) — jednostka stoi na mieście zbiórki i jest wstrzymana (brak komendy). Po wyłączeniu konsolidacji marsz na wrogie miasto działa (dowód: sonda CONS=off). Uwaga: przyczyna to zbiórka na mieście, nie bramka 8 hex (z dispatchu) — fallback `engageableEnemyCities` marsz poza 8 hex dopuszcza.
- hd T5 "B bez komend": B dostaje ruch (10,10)->(12,10) z DWÓCH nakładek dodanych później: konsolidacja ORAZ applyHomeWarPriorities (ai-war-home-defense.ts, ai.ts ~3390). Samo wyłączenie konsolidacji nie wystarcza (sonda: CONS=off HW=on nadal ruch; CONS=off HW=off -> 0 komend).
- arc 3x call-site: main.ts ~37077 wywołanie owinięte `isCityUnderSiege(...) ? {...} : advanceRecruitmentGated(` (SIEGE-BLOCKADE), więc literał `const recResult = advanceRecruitmentGated(` nie istnieje, wycinek był pusty.
- sp 4x: sygnatura `buildHudState(ownerId: number = ME())` (HOTSEAT), marker testu nieaktualny; 3 pozostałe asercje to kaskada pustego wycinka.

ZMIANA TESTÓW:
- hd: eksport setArmyConsolidationOverride/setHomeWarDefenseOverride; helper withOverlays (zawsze reset do null). T2/T4: (a) domyślna konfiguracja — brak jakiegokolwiek ruchu w stronę zagrożenia; (b) konsolidacja OFF — marsz na wrogie miasto (toQ<25) i brak ruchu ku zagrożeniu. T5: konsolidacja OFF + homeWar OFF -> B 0 komend (izoluje handledThreatIds).
- arc: kotwica wycinka = pierwsze `const recResult = ` z `advanceRecruitmentGated(` w oknie 600 zn.; nowa asercja, że wycinek niepusty (chroni przed cichym pustym wycinkiem — poprzednio asercja "no city.ownerId !== 0" przechodziła trywialnie).
- sp: nowy marker; extractFunctionBody kończy się na `function` o tym samym wcięciu (funkcja zagnieżdżona), by regexy nie sięgały odległego kodu.

MUTACJE (kopie w scratchpad, AI_SRC_DIR / ARMY_RECRUITMENT_MAIN_SOURCE; repo nietknięte):
- usunięcie `!handledThreatIds.has(...)` -> hd FAIL (T5, 45/1)
- promień zagrożenia +1 -> hd FAIL (T2a/b, T4a/b, T6; 35/11)
- hook merge z `ownerId !== 0` -> arc FAIL (1); usunięcie wywołania hooka -> arc FAIL (2)
- fallback `: foodProj.unfedCityCount` -> `: 0` -> sp FAIL (1)

TESTY (PRZED -> PO; logi gate-before-*/gate-after-*.txt, każdy z linią EXIT=):
- ai-home-defense-vs-barbarians: 35 ok/3 fail (EXIT=1) -> 46/0 (EXIT=0)
- army-recruitment-concentration: 26/3 (EXIT=1) -> 30/0 (EXIT=0)
- spichlerz-deficyt-scalenie: 54/4 (EXIT=1) -> 58/0 (EXIT=0)
- ai-war-defend-home 30/0 -> 30/0; ai-army-scattered-merge 33/0 -> 33/0; army-concentration 56/0 -> 56/0
- hud-topbar-grid-gross-net: PRZED 159/0 z --no-mutants; PO 1188/0 pełny przebieg (z mutantami). Wynik PRZED pełnego przebiegu: NIE_ZMIERZONO (plik testu nie zmieniony, więc bez znaczenia dla regresji).
- tsc: NIE_ZMIERZONO (zero zmian w .ts; tylko .cjs).

BLOKADY: brak. Klasa B (prawdziwa usterka gry): nie wykryto. Obserwacja do rozważenia przez orkiestratora (nie naprawiana): nakładka applyHomeWarPriorities wysyła wolną jednostkę z miasta na wroga na własnym terenie także gdy przydzielony obrońca już obsłużony — zgodne z zamierzeniem R-WEB-AI-WAR-DEFEND-HOME, więc uznane za A.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
