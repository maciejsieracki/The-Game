STATUS: DISPATCH (RUNDA 3 — 2× DECISION_REQUIRED rundy 2 rozstrzygnięte przez orkiestratora)
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL RUNDY 3: Domknij oba punkty DECISION_REQUIRED z rundy 2 (07-obrona-runda2.md) — wąskie,
punktowe rozszerzenie allowlisty na dwa dokładnie wskazane miejsca, bez zmiany semantyki kosztu
50 koni ustalonej w rundzie 2.

DECYZJE ORKIESTRATORA (2026-09-08, odpowiedź na oba DECISION_REQUIRED rundy 2):

1. **Zarzut 1 (brak żywego dowodu na realnym `commitBuildRequest`)** → Obrona zaproponowała
   dopisanie DOKŁADNIE dwóch metod do istniejącego, już-scalonego obiektu testowego
   `window.__buildRequestTestDebug` (main.ts ~linia 22197), wzorem już tam obecnych
   `forceCopperDeposit`/`forceForestNoDeposit`: settera magazynu 'kon' imperium i forsera
   złoża konia na hexie. **ZAAKCEPTOWANE.** To jest dokładnie ten sam wzorzec co istniejące
   metody w tym samym obiekcie (test-only debug hook, nie zmiana zachowania gry) — rozszerz
   allowlistę main.ts o TE DWIE METODY WYŁĄCZNIE, w tym samym obiekcie, nie gdzie indziej.

2. **Zarzut 2 (AI/auto-improvements.ts poza allowlistą, AI trwale traci zdolność budowy
   stadniny poza złożem)** → Obrona przedstawiła 3 opcje. Wybieram **opcję (a): rozszerzyć
   allowlistę o `auto-improvements.ts`, wpiąć tam ten sam odczyt magazynu 'kon' co w main.ts
   (symetrycznie do gracza)** — NIE opcję (b) (świadome zaakceptowanie regresji AI): projekt ma
   udokumentowaną, wysoką wagę dla dokładnie tej kategorii błędu (AI przestaje budować coś, co
   wcześniej budowało — właściciel żądał wprost "żeby to już nigdy nie wróciło" przy innym,
   wcześniejszym temacie tej samej kategorii). Cichociche pozostawienie AI bez dostępu do
   stadniny poza złożem byłoby dokładnie tym niepożądanym scenariuszem, niezależnie od tego że
   ten temat dotyczy nowej mechaniki (koszt), nie starej regresji — zasada "AI nie traci
   zdolności budowlanych bez wyraźnej, świadomej decyzji" obowiązuje tu tak samo.

KONTEKST — PRZECZYTAJ RUNDĘ 2 W CAŁOŚCI (05-operator-runda2.md, 06-evaluator-runda2.md,
07-obrona-runda2.md) PRZED PIERWSZĄ ZMIANĄ KODU. W szczególności dokładny cytat Obrony
uzasadniający wykonalność punktu 1 bez naruszenia bariery i dokładne miejsce w
auto-improvements.ts (linia ~524, `buildImprovementQualifier(state)`) dla punktu 2.

ZADANIE:
1. `gra/src/main.ts::__buildRequestTestDebug` (obiekt testowy, ~linia 22197) — dodaj DOKŁADNIE
   dwie metody wzorem `forceCopperDeposit`/`forceForestNoDeposit` tamże: setter magazynu 'kon'
   imperium (np. `setCityKonStock(ownerId, amount)`) i forser złoża konia na hexie (np.
   `forceHorseDeposit(q, r)` / `forceNoHorseDeposit(q, r)`). Użyj tego haka do napisania nowej,
   PRAWDZIWEJ żywej bramki (`stadnina-kon-koszt-live-test.cjs` albo rozszerzenie istniejącej) —
   vite build (`--outDir` poza repo) + headless Chromium — która realnie woła
   `applyBuildRequest`→`commitBuildRequest` dla stadniny poza złożem, z magazynem < 50 (musi się
   nie udać) i >= 50 (musi się udać, magazyn spada dokładnie o 50). To jest ŻYWY DOWÓD na punkt
   (c) binarnego kryterium z `00-dispatch.md`, którego brakowało w rundzie 2.
2. `gra/src/game/auto-improvements.ts` (~linia 524, `buildImprovementQualifier(state)`) — wpnij
   do budowy `state`/`ImprovementBuildState` używanego tu TEN SAM odczyt magazynu 'kon'
   imperium (`horseStockAvailable`) i dostępu handlowego (`tradeRouteKonUnlocked`), analogicznie
   do main.ts z rundy 2, tak żeby AI/automat miasta mogło budować stadninę poza złożem gdy
   magazyn imperium ma >= 50 'kon' — dokładnie ta sama reguła co dla gracza, nie osobna,
   łagodniejsza czy trudniejsza.
3. Żywy dowód PRZED/PO dla punktu 2: symulacja `decideAITurn`/`pickAutoImprovements` z magazynem
   imperium >= 50 'kon' i heksem poza złożem — AI FAKTYCZNIE wybiera budowę stadniny (nie tylko
   nie odrzuca jej formalnie).

BINARNE KRYTERIUM SUKCESU: (1) nowa żywa bramka Chromium potwierdza realne odjęcie 50 'kon'
przez `commitBuildRequest` w zbudowanej grze (nie symulacja równoległa); (2) AI/automat miasta
buduje stadninę poza złożem gdy magazyn >= 50 'kon', potwierdzone żywą symulacją
`decideAITurn`; (3) wszystkie testy z rund 1-2 nadal zielone (stadnina-kon-koszt-test.cjs,
stadnina-las-test.cjs, hodowla-las-test.cjs, hex-tooltip-stadnina-kopalnia-cyny-test.cjs,
food-hodowla-test.cjs — z uwzględnieniem już potwierdzonych pre-istniejących FAIL). `tsc
--noEmit` czysty, 5 bramek referencyjnych zielone.

ALLOWLISTA (rozszerzona wg decyzji orkiestratora powyżej, PONAD allowlistę rundy 2):
- `gra/src/main.ts` — DODATKOWO: WYŁĄCZNIE obiekt `__buildRequestTestDebug` (dwie nowe metody
  testowe, wzorem istniejących w tym samym obiekcie) — poza tym main.ts pozostaje w zakresie
  wyłącznie z rundy 2 (`ImprovementBuildState` ~12538-12539, `commitBuildRequest()`
  ~12921-12969)
- `gra/src/game/auto-improvements.ts` — WYŁĄCZNIE wpięcie odczytu magazynu 'kon'/dostępu
  handlowego do budowy `state` używanego w `buildImprovementQualifier(state)` (~linia 524) —
  nie przepisuj reszty logiki AI ulepszeń
- Wszystkie pozycje allowlisty z `00-dispatch.md` i `04-dispatch-runda2.md` pozostają aktywne
- `gra/tools/*-test.cjs` (nowa żywa bramka Chromium + rozszerzenie testów AI)
- `dyspozycje/autobot/runs/P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1/*`
Zakaz `git add -A`. Zakaz zmiany wartości 50. Zakaz dotykania jakiegokolwiek innego miejsca w
main.ts poza dwiema nowymi metodami `__buildRequestTestDebug` i już zaakceptowanym zakresem
rundy 2.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "zamknięte" bez FAKTYCZNIE żywej bramki
Chromium wołającej realny `commitBuildRequest` (nie kolejnej symulacji równoległej — to
dokładnie ten błąd, który Evaluator złapał w rundzie 2). Zakaz deklaracji naprawy AI bez
żywego dowodu że `decideAITurn` faktycznie WYBIERA budowę stadniny (nie tylko że qualifier
zwraca `true` w izolacji).

IZOLACJA: kontynuuj w istniejącym worktree `/home/user/wt-stadnina-koszt`, ta sama gałąź
`autobot/P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do bramki
Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 3.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry + ekonomii + AI + żywa bramka Chromium, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
