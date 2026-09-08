# R-HOTSEAT-ETAP6B-UI-Q1 — Final Control runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6B-UI-Q1
GOAL: Niezależna weryfikacja gotowości do integracji migracji 78 miejsc rdzeniowych
UI/HUD/paneli (U1-U14 main.ts + V1-V11 ui/*.ts) na isMe/!isMe/ME() + write-site cache
`_last*` w `runWorldEndTurn(humanOwnerId)` + `refreshPlayerCityEcon(ownerId)`.

TESTY (wszystkie wykonane świeżo, niezależnie, worktree `/home/user/wt-hotseat-etap6b-ui`):
1. Fresh grep `ownerId\s*(===|!==|=|\?\?)\s*0\b` w ciałach wszystkich 26 funkcji U1-U14
   (granice ciał wyznaczone programowo przez dopasowanie nawiasów `{}` od nagłówka
   funkcji) — **ZERO trafień** we wszystkich poza `runWorldEndTurn()`. W
   `runWorldEndTurn()` (28989-33335) 25 pozostałych trafień sprawdzonych ręcznie —
   wszystkie leżą POZA 11 write-site'ami cache `_last*` (dotyczą populacji/buntu/rosterów
   walki/AI-parytetu, logika niezwiązana z HUD), zgodne z jawnym rozliczeniem
   Operatora/Evaluatora. Bezpośrednio potwierdzone w kodzie: `_lastLudnoscRate`
   (29496, `c.ownerId === humanOwnerId`), `econ.upkeepByOwner.get(humanOwnerId)`/
   `resourceUpkeepByOwner.get(humanOwnerId)` (29610-29644), `refreshPlayerCityEcon(econ.perCity,
   humanOwnerId)` (29495) — realny parametr, nie literał/`ME()` global.
2. `ui/*.ts`: `cityPanel.ts`, `siegeMapPanel.ts`, `preBattle.ts`, `powerOverlayHud.ts` —
   jedyne pozostałe `ownerId === 0` to fallbacki domyślne wzorca wstrzykiwanego hooka
   (`cfg.isMe?.(ownerId) ?? (ownerId === 0)`, identyczne do `game/army-cycle.ts`) plus
   dwa jawnie rozliczone hardkody (7476, 7575, patrz BLOKADY). 5 call-site'ów w main.ts
   (`configureCityPanel` x2, `configurePreBattle` x2, `siegePanelActions`) potwierdzone
   `Read` — wszystkie przekazują `isMe: (ownerId) => isMe(ownerId)`, reużywając istniejący
   alias Etapu 6a (`main.ts:10398`, `return ownerId === ME();`) — brak duplikatu.
3. `tsc --noEmit` (świeże uruchomienie z `gra/`): 0 błędów, exit 0.
4. 5 bramek referencyjnych, uruchomione świeżo: logic-test 213/213, tech-tree-test 19/19,
   research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
5. `hotseat-etap6b-ui-noop-test.cjs`, pełny przebieg własnym uruchomieniem (Chromium,
   ~12 min): PRZED vs PO = **20/20 identycznych hashy**, 0 wyjątków JS w obu wariantach.
   PO vs ZEPSUTY (isMe() na sztywno false) = **0/20 identycznych**, rozbieżność od tury 1
   — nietautologiczność potwierdzona. Wynik skryptu: `PASS`.
6. `git diff --stat`/`--check` względem bazy `e76adba2`: zmienione WYŁĄCZNIE pliki
   allowlisty — `gra/src/main.ts`, `gra/src/ui/{cityPanel,siegeMapPanel,preBattle,
   powerOverlayHud}.ts`, nowy `gra/tools/hotseat-etap6b-ui-noop-test.cjs`, raporty rundy.
   `--check` czysto, `git status` czyste, brak `git add -A`.
7. Boundary check: region `extraCityPanelConfig` (main.ts:6857-7359), świadomie wyłączony
   z 78 przez recon, nadal zawiera 5 niezmigrowanych literałów `ownerId === 0`/`!== 0` —
   potwierdza, że Operator NIE przekroczył zakresu (nie migrował poza allowlistą kategorii).
8. Konflikt z równoległym R-HOTSEAT-ETAP6E-RENDER-Q1: worktree
   `/home/user/wt-hotseat-etap6e-render` wciąż w toku (working tree niescommitowany,
   modyfikuje `main.ts`). Porównanie hunków `git diff` obu gałęzi względem wspólnej bazy
   `e76adba2`: zero nakładających się linii. Najbliższa para (6b: `buildDiploTreasury`,
   stare linie 17748-17756; 6e: `cityMapOutlineKindForOwner`, stare linie 17763-17775)
   dotyczy dwóch różnych funkcji z 7-liniowym odstępem — bez konfliktu.

BLOKADY (potwierdzone jako nieblokujące integracji tego tematu):
1. `game/turn-economy.ts:1219` (`sumEconomyForPlayerCities`, `ownerId===0`) — plik poza
   allowlistą, jawnie przypisany Etapowi 6c przez własny recon tego etapu (Klaster G).
2. `cityPanel.ts:7476/7575` (`ownerId: 0`/`ownerId = 0`, poza formami `===`/`!==` — stąd
   pominięte przez metodę regex recon) → konsumowane przez `isPlayerOwner()`
   (`game/difficulty-cost.ts:44-46`, `return ownerId === 0`) — plik poza allowlistą.
   Recon 6c (§ linia 60) **niezależnie i wcześniej** nazywa `difficulty-cost.ts:45` jako
   „znany, świadomie wyłączony, czeka na osobną decyzję produktową" (dziedziczy z Etapu 3,
   commit `302ea837`) — Obrona rundy trafnie odrzuciła migrację samego cityPanel.ts jako
   kosmetyczną (funkcja docelowa i tak zredukowałaby realny ownerId do `===0`) i poprawnie
   dopisała oba miejsca do BLOKAD zamiast milczeć. Zgodne z już zaakceptowanym precedensem.
3. Bramka Chromium nie otwiera paneli oblężenia/przed-bitwy/cudów w 20 turach od czystego
   seeda (brak scenariusza wojny/muru/technologii cudu) — pokrycie ograniczone do
   miasta+imperium+HUD. Migracje V10/V11/U6 mają dowód `tsc`+wzorzec identyczny do
   `army-cycle.ts`, nie mają dowodu behawioralnego Chromium w tej rundzie.
4. `powerOverlayHud.ts` (V9, `showPowerOverlay`) nieosiągalny z normalnej gry dziś —
   `main.ts` zawsze ustawia `cfg.onOpenEmpireDetail`, klik chipa „moc" idzie przez Empire
   Detail Panel (pokryty rotacją sekcji w bramce), nie przez `showPowerOverlay()`.
   Zgłoszone jawnie, kod martwy w obecnej architekturze — brak realnego ryzyka behawioralnego.

Ocena: żadna z 4 BLOKAD nie zagraża binarnemu kryterium sukcesu tej rundy
(no-op przy `humanOwnerIds=[0]`, dowiedziony nietautologicznie) ani nie tworzy ukrytego
długu — wszystkie są jawnie przypisane do właściwych etapów (6c/6d) lub są ograniczeniami
metody dowodu (Chromium coverage), nie lukami w samej migracji zakresu (b).

RUNDY: 1/5

WERDYKT KOŃCOWY: PASS. Wszystkie 78 miejsc rdzeniowych zmigrowane i potwierdzone świeżym
grepem z zerem trafień w zakresach klastrów; write-site `runWorldEndTurn(humanOwnerId)`
faktycznie sparametryzowany (nie `ME()` global) na 11 write-site'ach cache, zweryfikowane
bezpośrednio w kodzie; `refreshPlayerCityEcon(ownerId)` podłączona z obu call-site'ów
poprawnie. `tsc` czysty, 5 bramek referencyjnych zielone, nowa bramka no-op PASS z
udowodnioną nietautologicznością (własne uruchomienie, nie tylko powtórzenie raportu
Operatora/Evaluatora). Diff ograniczony wyłącznie do allowlisty. Brak konfliktu z
równoległym Etapem 6e (różne funkcje, bez nakładania się linii). 4 ujawnione BLOKADY są
zasadnie przypisane innym etapom lub stanowią udokumentowane ograniczenie metody dowodu —
żadna nie jest ukrytym niedopatrzeniem tej rundy. Obrona rundy 1 poprawnie rozpoznała i
rozliczyła zarzut Evaluatora bez kosmetycznej, mylącej migracji.

NASTĘPNY KROK: integracja allowlist-only przez orkiestratora (merge do `main`), następnie
sekwencyjnie Etap 6c (ekonomia) — dotyka tej samej `runWorldEndTurn()`.
DEPLOY/PUSH: NIE WYKONANO
