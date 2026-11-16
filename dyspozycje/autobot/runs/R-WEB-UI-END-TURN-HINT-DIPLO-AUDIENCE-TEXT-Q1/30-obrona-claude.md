STATUS: DECISION_REQUIRED (zarzut 1 wymaga zmiany poza allowlistą; zarzuty 2 i 3 rozstrzygnięte w kodzie/raporcie)
DOMAIN: GAME
TEMAT: R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1
GOAL: podpowiedź przy zablokowanym „Zakończ turę” wskazuje otwarty modal (audiencja / panel łączenia armii / karta odkrycia technologii) przed komunikatem „Zakończ ekran bitwy…”; bez zmiany logiki blokady.
BAZA: 8f6381fc51a270cedb4b120b551f81aa297fe41f (origin/main). KANDYDAT OPERATORA: 3a75fbef9fb4974adcfce7f94694ac444561dab9 (startowy SHA obrony).
ZMIANY-COMMIT: obrona dodaje wyłącznie `gra/tools/end-turn-hint-diplo-audience-test.cjs` (test wykonawczy, allowlista OK). `gra/src/main.ts` NIE zmieniony w obronie. SHA obrony: patrz pole `sha` w StructuredOutput (commit „R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1: obrona r1 — test wykonawczy podpowiedzi”). Commit obejmuje tylko ten plik i ten raport.

## Odpowiedzi na zarzuty Evaluatora (eval/end-turn-hint-q1, 20-evaluator-claude.md)

### Zarzut 1 — regresja endturn-battle-deadlock-exec-test.cjs (42/7 -> 40/9): PRZYJĘTY, NIE NAPRAWIONY W ZAKRESIE OBRONY (wymaga decyzji orkiestratora)
- Przyczyna potwierdzona: `gra/tools/endturn-battle-deadlock-exec-test.cjs` wstrzykuje do fabryki `hintEndTurnBlocked` listę deps (linie ~126–132 i ~254–262) BEZ `isTechDiscoveryNoticeOpen`. Nowa gałąź `if (isTechDiscoveryNoticeOpen())` rzuca ReferenceError dla scenariuszy B1c i C1b (przy otwartym ekranie bitwy modal jest sprawdzany pierwszy).
- Dowód (zmierzony w tej obronie): kopia harnessu z dopisanym `isTechDiscoveryNoticeOpen` w deps i w obiekcie wywołania (`isTechDiscoveryNoticeOpen: () => false`), uruchomiona jako nietrackowany plik `gra/tools/zz-tmp-probe-exec.cjs` i natychmiast usunięta: wynik `endturn-battle-deadlock-exec-test: 42 pass, 7 fail` = baza. Plik tracked nie został zmieniony (`git status` po próbie: tylko test obrony).
- Dlaczego nie naprawiono: plik harnessu nie mieści się w allowlistcie dispatchu (`gra/tools/end-turn-*hint*` i nowy test). Zmiana go = naruszenie granicy allowlisty (FAIL wg §9). Nie obchodzę tego (np. `typeof`-guardem w produkcyjnym kodzie tylko po to, by harness nie rzucał — to maskowanie testu, odrzucone).
- DECYZJA DLA ORKIESTRATORA: (a) rozszerzyć allowlistę o `gra/tools/endturn-battle-deadlock-exec-test.cjs` i dodać dwie linie (dep `isTechDiscoveryNoticeOpen` + wartość `() => false` w wywołaniu fabryki), albo (b) zaakceptować regresję jako dług do osobnego tematu. Bez jednej z tych decyzji kandydat ma realną regresję istniejącego testu wykonawczego (40/9 vs 42/7).

### Zarzut 2 — test tematu tylko tekstowy: PRZYJĘTY I NAPRAWIONY
- Dodano w `gra/tools/end-turn-hint-diplo-audience-test.cjs` sekcje (e) i (f):
  - (e) WYKONANIE: ciało `hintEndTurnBlocked` (wycięte przez `bodyOf`) uruchamiane przez `new Function` z jawnie podanymi zmiennymi wolnymi (lista `HINT_DEPS`: 14 nazw, w tym `isTechDiscoveryNoticeOpen`). Brak zmiennej = błąd = FAIL (nie cicha luka). Siedem przypadków: audiencja otwarta -> tekst audiencji; panel armii -> tekst armii; karta techu -> tekst techu; ekran bitwy -> „Zakończ ekran bitwy…”; bitwa w kolejce bez modala -> „Zakończ ekran bitwy…”; audiencja + ekran bitwy -> audiencja (modal pierwszy); karta techu + bitwa w kolejce -> karta techu (modal pierwszy).
  - (f) mutacje WYKONAWCZE w pamięci: usunięcie gałęzi audiencji (przy otwartej audiencji wynik ≠ tekst audiencji) i przestawienie kolejności (modal po bitwie, oba otwarte -> wynik ≠ audiencja). Obie wykryte.
- Źródłowe sprawdzenia (a)–(d) z poprzedniej wersji zostały bez zmian.
- Nagłówek pliku zaktualizowany o (e)/(f).

### Zarzut 3 — modal pierwszy, a inny powód blokady: ODRZUCONY (dowód: dispatch i kod)
- Dispatch (00-dispatch-DODATEK-claude.md, „Kolejność gałęzi: modal PIERWSZY”) wprost wymaga kolejności modal -> bitwa. Obrona nie zmienia tej kolejności.
- Zarzut trafnie opisuje ryzyko: `canPlayerInitiateEndTurn()` (main.ts ~40685–40743) nie zawiera warunku modala, więc przy otwartej audiencji i blokadzie np. ofertą handlową AI (`hasBlockingAiTradeOfferForPlayer`, ~40776) albo bramką NNS, podpowiedź wskaże zamknięcie audiencji, choć to nie ona blokuje. To ograniczenie zachowania ZAAKCEPTOWANE przez dispatch (GOAL: „modal PIERWSZY”); nie jest błędem implementacji względem dispatchu. Do decyzji FC/właściciela: czy warunkować gałęzie modali przez rzeczywistą przyczynę (wtedy zmiana kolejności dispatchu), czy zostawić. Obrona NIE zmienia logiki.

### Zarzut 4 (Evaluator: bez zarzutu) — tsc: zmierzone w tej obronie, patrz TESTY.

## TESTY (surowe wyniki, gra/, po `npm ci` w worktree obrony; bez `npm run build/dev`)
- `npx tsc --noEmit` -> exit 0, brak wyjścia (0 błędów).
- `node tools/logic-test.cjs` -> `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs` -> `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs` -> `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs` -> `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs` -> `All sanity checks passed.`, exit 0.
- `node tools/end-turn-hint-diplo-audience-test.cjs` -> `passed=16 failed=0`, exit 0 (było 6/0 przed obroną; +7 przypadków wykonawczych, +2 mutacje wykonawcze, +1 wzorzec).
- Istniejące testy end-turn (`git grep -l hintEndTurnBlocked gra/tools`), kandydat + obrona (obrona nie zmienia main.ts):
  - `diplomacy-sensible-deals-main-guard-test.cjs` -> `22 passed, 0 failed`, exit 0.
  - `end-turn-block-event-test.cjs` -> `passed=35 failed=0`, exit 0.
  - `endturn-battle-deadlock-test.cjs` -> `38 pass, 0 fail`, exit 0.
  - `koniec-tury-f1-f4-runda3-test.cjs` -> `39 pass, 0 fail`, exit 0.
  - `endturn-battle-deadlock-exec-test.cjs` -> `40 pass, 9 fail`, exit 1 (regresja zarzutu 1; baza 42/7 wg Evaluatora, potwierdzona probą z deps: 42/7).
  - `no-negative-stocks-endturn-test.cjs` -> `18 passed, 1 failed`, exit 1 (dług bazowy wg Evaluatora; bazy nie uruchamiałem ponownie).
  - `load-game-blockers-exec-test.cjs` -> exit 1 bez linii podsumowania (dług bazowy wg Evaluatora: wyjątek stack na bazie; NIE_ZMIERZONO na bazie w tej rundzie).
- `git diff --check` (worktree) -> czysto, exit 0.
- NIE_ZMIERZONO: render w Chromium / realna podpowiedź w przeglądarce przy otwartej audiencji (tylko wykonanie funkcji w Node).
- Audyt polszczyzny (kryterium b): w `auditTexts()` bez zmian, przechodzi (brak surowych ID i angielskich słów w czterech komunikatach).

## BLOKADY
- Zarzut 1: wymaga decyzji orkiestratora o allowliście (2 linie w `gra/tools/endturn-battle-deadlock-exec-test.cjs`). Bez tego kryterium (c) „istniejące testy end-turn zielone” NIE jest spełnione (exec 40/9).

## RUNDY
Obrona rundy 1 (Operator Haiku, Obrona Haiku). Po tej obronie: 1/5 obrony; orkiestrator decyduje o rundzie 2 (allowlista).

## NASTĘPNY KROK
Orkiestrator: (1) decyzja o allowliście dla `endturn-battle-deadlock-exec-test.cjs` (albo dług osobnym tematem); (2) po decyzji FC na zarzucie 3 (kolejność modal/przyczyna) — ewentualna runda Operatora z tym samym ID. Dopiero wtedy Final Control.

## DEPLOY/PUSH: NIE WYKONANO
(Obrona nie integruje, nie deployuje i nie pushuje na main.)
