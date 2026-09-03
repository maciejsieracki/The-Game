TEMAT: P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1
RUNDA: 2/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/main.ts (deferredPlayerUnitRevealIds i miejsca użycia — linie ok.
3537, 9106, 10110-10203, 10541-10548, 28266, 31169), gra/src/render/units.ts
(UnitRenderer.sync — opacity/dimming tokenu)
MODEL+EFFORT: claude-opus-5, effort high dla Operatora i Evaluatora (temat wizualny,
dotyka gra/src/render/**, stała zgoda właściciela — R-PROC-AUTOBOT.md §5a); Final
Control claude-sonnet-5.

WYZWALACZ (dosłownie od właściciela, decyzja po pytaniu ABC rundy 1)
Runda 1 zakończyła się DECISION_REQUIRED — trzy opcje przedstawione właścicielowi:
(A) pokazuj token jednostki w budowie (przyciemniony/półprzezroczysty) zamiast pełnej
niewidoczności, (B) [odrzucone], (C) [odrzucone]. Właściciel wybrał opcję **A**.

RECON (nie powtarzaj — już wykonane przez orkiestratora i Operatora/Obronę rundy 1,
worktree /home/user/wt-jednostka-niewidoczna, commit `eddf493f`)
- Mechanizm dziś: `deferredPlayerUnitRevealIds` (Set<string>, main.ts:9106) — populowany
  w dwóch miejscach narodzin jednostki gracza w trakcie `endTurnInProgress` (linie 3537,
  28266). `syncUnitsRender()` (main.ts:10110) FILTRUJE te ID CAŁKOWICIE z listy `src`
  przekazywanej do `unitRenderer.sync(src, display)` (linia 10114-10116, 10203) — token
  nie istnieje w scenie Three.js w ogóle, dopóki `flushDeferredPlayerUnitReveals()`
  (main.ts:10541-10548) nie wyczyści seta — wołane w bloku `finally` (linia 31169) PO
  `runAiPhase()` i `yieldTurnTransitionUi()`.
- Silnik renderowania to Three.js, `UnitRenderer.sync(units, stackDisplay?)`
  (`render/units.ts:5964`) — CAŁY model jednostki buduje się SYNCHRONICZNIE w jednym
  wywołaniu `sync()` (odrzuca hipotezę "model 3D ładuje się z opóźnieniem", potwierdzone
  reconem rundy 1).
- Medalion właściciela (`unitOwnerEmblem.ts:328-414`) — tarcza+glif rysują się od razu,
  portret/sygnet dociąga się asynchronicznie z cache (`assetByKey`/`getEmblemAsset`,
  `loadImageInto`) — hipoteza główna rundy 1, ale NIE W PEŁNI POTWIERDZONA (różnica ok.
  5px, nie pełna niewidoczność tokenu) — traktuj jako możliwy WSPÓŁISTNIEJĄCY drobny
  efekt, NIE jako główną przyczynę tego tematu (główna przyczyna to filtrowanie `src`
  opisane wyżej, to jest bezsporne i wystarczające do wyjaśnienia zgłoszenia właściciela).
- Wzorzec materiału z opcjonalną przezroczystością już istnieje w `render/units.ts`:
  `MatFactory` (linia 713) — `(color, metalness?, roughness?, transparent?, opacity?) =>
  THREE.MeshStandardMaterial`. Jednostka to prawdopodobnie GRUPA wielu meshy/materiałów
  (ciało, broń, ewentualnie tarcza/emblemat) — zastosowanie jednolitej przezroczystości
  całego tokenu wymaga PRZEJŚCIA po wszystkich materiałach grupy tokenu (traverse), nie
  jednego materiału — potwierdź to reconem w kodzie, nie zakładaj struktury.
- `unitRenderer.sync(src, display)` wołane w main.ts:10203 — jedyne miejsce łączące dane
  silnika z renderem tokenów.

GOAL
1. Jednostki gracza w oknie odroczenia (`deferredPlayerUnitRevealIds`) PRZESTAJĄ być
   całkowicie filtrowane z `src` w `syncUnitsRender()` — zamiast tego przechodzą do
   `unitRenderer.sync()` z jawnym oznaczeniem "w budowie/odroczona" (np. dodatkowy
   parametr/Set przekazywany do `sync()`, lub pole na `RuntimeUnit`/kopii przekazywanej
   do renderu — wybierz podejście minimalizujące zmianę API, uzasadnij w raporcie).
2. `UnitRenderer.sync()` dla jednostek oznaczonych jako odroczone renderuje TOKEN W PEŁNI
   (ten sam model/animacja co normalna jednostka), ale WIZUALNIE PRZYCIEMNIONY/
   półprzezroczysty (np. opacity ok. 0.4-0.5, `transparent: true` na WSZYSTKICH
   materiałach tokenu) — dobierz wartość opacity tak, by token był wyraźnie odróżnialny
   od w pełni odsłoniętej jednostki, ale nadal rozpoznawalny (nie prawie niewidoczny —
   to zaprzeczałoby celowi tego tematu).
3. W momencie `flushDeferredPlayerUnitReveals()` (main.ts:10541), token PRZECHODZI z
   przyciemnionego na w pełni widoczny (kolejny `syncUnitsRender()` bez oznaczenia
   odroczenia dla tego ID) — bez migotania/zniknięcia w trakcie przejścia.
4. Zero zmian w logice SAMEGO mechanizmu odroczenia (KIEDY jednostka trafia do
   `deferredPlayerUnitRevealIds`, kiedy jest z niego usuwana) — WYŁĄCZNIE zmiana tego,
   CO renderuje się w oknie odroczenia (przyciemniony token zamiast nic).
5. Zero regresji na innych mechanizmach przezroczystości/podświetlenia tokenów jednostek
   (pierścienie właściciela/wojny — `OWNER_RING_OPACITY`/`WAR_RING_OPACITY` linia 5929,
   5941; czaszka głodu — `STARVING_SKULL_OPACITY` linia 6217; moneta deficytu —
   `GOLD_DEFICIT_COIN_OPACITY` linia 6275) — znajdź reconem czy którykolwiek z tych
   efektów mógłby nakładać się na przyciemnioną jednostkę w niespodziewany sposób
   (np. podwójne przyciemnienie) i jeśli tak, udokumentuj w raporcie jak rozwiązane.

KRYTERIA KOŃCA (binarne)
1. Żywy render w headless Chromium: sekwencja zrzutów PRZED naprawą (jednostka
   niewidoczna w oknie odroczenia) i PO naprawie (jednostka widoczna, przyciemniona, w
   tym samym oknie) — porównanie side-by-side, ten sam scenariusz odtworzenia co w
   rundzie 1 (dowody rundy 1 w worktree, jeśli istnieją, jako punkt odniesienia).
2. Żywy render potwierdza przejście przyciemniony→pełna widoczność w momencie flush, bez
   klatki z brakiem tokenu ani z podwójnym tokenem.
3. Test (jednostkowy lub Playwright) na strukturze danych jednej jednostki w oknie
   odroczenia potwierdza: token obecny w scenie (nie filtrowany), materiał(y) mają
   `opacity < 1` i `transparent === true`; po flush — `opacity === 1` (lub materiał bez
   wymuszonej przezroczystości, zgodnie z normalnym stanem jednostki).
4. Zero regresji na istniejących testach renderu jednostek (znajdź reconem, np.
   units-render-*-test.cjs lub podobne w gra/tools/) i na 5 bramkach referencyjnych.
5. `tsc --noEmit` czysty.

ALLOWLISTA (nic poza tym)
- gra/src/main.ts — WYŁĄCZNIE `syncUnitsRender()` (linie ok. 10110-10203) i wywołanie
  `unitRenderer.sync()` w tej funkcji; ZERO zmian w miejscach populacji/czyszczenia
  `deferredPlayerUnitRevealIds` (linie 3537, 9106, 10541-10548, 28266, 31169) poza
  ewentualnym przekazaniem dodatkowego parametru do `sync()`.
- gra/src/render/units.ts — WYŁĄCZNIE `UnitRenderer.sync()` i pomocnicze funkcje
  budowy/aktualizacji materiału tokenu jednostki wywoływane z tej metody.
- Nowy lub rozszerzony test w gra/tools/*-test.cjs dla tego tematu.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana WARUNKÓW
kiedy jednostka trafia do/wychodzi z odroczenia, zmiana `runAiPhase`/
`yieldTurnTransitionUi`, zmiana medalionu właściciela (`unitOwnerEmblem.ts`) — to
osobny, nie w pełni potwierdzony wątek, poza zakresem tej rundy.

IZOLACJA
worktree /home/user/wt-jednostka-niewidoczna (istniejący, commit `eddf493f`, runda 1
zamknięta DECISION_REQUIRED bez integracji — ZERO zmian z rundy 1 trafiło do main, więc
worktree można kontynuować BEZ resetu, ale orkiestrator NAJPIERW sprawdzi `git status`
i zsynchronizuje z najnowszym origin/main przed startem tej rundy), gałąź
autobot/P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1.
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-jednostka-niewidoczna-r2 --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania KTÓREGOKOLWIEK kryterium końca za spełnione bez żywego zrzutu z headless
Chromium pokazującego RÓŻNICĘ między stanem PRZED (token niewidoczny) i PO (token
przyciemniony, ale widoczny) w TYM SAMYM scenariuszu odtworzenia. Zakaz twierdzenia, że
"opacity zostało ustawione" na podstawie samego kodu źródłowego bez zrzutu/testu
faktycznie renderującego scenę i odczytującego wartość z żywego materiału Three.js.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED (ta runda liczy
się jako runda 2/5, po rundzie 1 zakończonej DECISION_REQUIRED).

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control
(Sonnet 5) i integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree
Operatora, ręką orkiestratora.

OBIEG
Operator (Opus 5, effort high) → Evaluator (Opus 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
