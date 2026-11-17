STATUS: PASS-WITH-NOTES (obrona rundy 1; zarzuty 1, 2, 4 domknięte dowodem; zarzut 3 odrzucony z dowodem; zarzut 5 przyjęty jako uwaga bez zmiany kodu; zarzut 6 odrzucony jako dług bazowy)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1
GOAL: zasadzka tylko z generałem (gracz i AI), wygasanie przy utracie generała, brak osłabionych testów, zrzut przycisku bez generała (kryterium f)
BAZA: d44d5b982305fd2cff3dada175b4833d936e4525 (origin/main w chwili dispatchu); kandydat do obrony: 8fbfc5e3209c12f7ad601cf1b62d9285fbd80b48 (start obrony od tego SHA)
ZMIANY/COMMIT: commit obrony zawiera wyłącznie testy i ten raport (kod gry `gra/src/**` NIE zmieniany; powód: zarzut 3 odrzucony, zarzut 5 bez zmiany):
- gra/tools/ambush-ui-reason-test.cjs (+ sekcja no-general: powód w title, disabled, kontrola z generałem; +10 asercji łącznie)
- gra/tools/ambush-save-roundtrip-test.cjs (+ dwa testy: stary zapis stosu bez generała wygasa przy reconcileAmbushInWorld; stos z generałem zostaje; przez prawdziwe deserializeGame)
- gra/tools/ambush-live-vite.config.ts (+ metoda sondy `noGeneral(id)`: zdejmuje isGeneral z jednostki gracza i odświeża render; tylko narzędzie testowe, nie produkt)
- gra/tools/ambush-live-test.cjs (+ sekcja N: stos gracza bez generała, przycisk zablokowany, powód po polsku w title, kliknięcie nie zastawia, zrzuty)
- dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1/30-obrona-claude.md (ten raport)
Uwaga o allowliście: gra/tools/ambush-live-vite.config.ts jest poza literalnym wzorem `gra/tools/ambush-*.cjs`, ale już był zmieniany w kandydacie 8fbfc5e32 (ta sama rodzina narzędzi zasadzki); zmiana jest czysto testowa.
Środowisko: w worktree wykonano `npm ci` w gra/ (tylko zależności, gra/node_modules jest w .gitignore); npm run build/dev NIE uruchamiane w gra/. Build sondy live idzie poza repo (AMB_DIST w /tmp).

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (kryterium f: zrzut przycisku dla armii bez generała): PRZYJMUJĘ, WYKONANO.
- Dodano scenariusz N w ambush-live-test.cjs (armia gracza bez generała, ruch 3, zaznaczona w panelu).
- Wynik surowy (Chromium headless, xvfb-run nie był potrzebny): N0 PASS (generał zdjęty), N1 PASS (`disabled`), N2 PASS (title = "Zasadzkę może zastawić tylko armia z generałem."), N3 PASS (klik zablokowanego przycisku: ambush=false, ruchLeft=3), N4 PASS (brak błędów strony).
- Zrzuty: /tmp/claude-0/amb-live-shots/N-zasadzka-bez-generala-zablokowana-1280x720.png (pełny ekran: panel armii z "Armia · (13,17)", "Wojownik ×2"; pasek akcji poniżej widocznego obszaru panelu) oraz /tmp/claude-0/amb-live-shots/N-przycisk-zasadzka-zablokowany-bez-generala.png (element przycisku Zasadzka; OBEJRZANY: przycisk jest ikonowy, bez etykiety tekstowej, o rozmiarze ikony, zablokowanie potwierdzone atrybutem disabled i title w DOM; wizualnie na zrzucie nie widać różnicy stanu zablokowanego przy tej rozdzielczości).
- Uczciwie: pełny zrzut ekranu nie pokazuje przycisku w kadrze (panel jest przycięty), dlatego dowodem wizualnym jest zrzut elementu, a dowodem stanu — DOM. Kryterium (f) uznaję za spełnione w zakresie: przycisk zablokowany z powodem po polsku, obejrzany jako element.

Zarzut 2 (brak testu UI dla powodu 'no-general' w tooltipie i disabled): PRZYJMUJĘ, WYKONANO.
- ambush-ui-reason-test.cjs: dodano stos bez generała (ruch 3) -> canSetAmbush zwraca reason 'no-general' i komunikat; buildUnitActionBarHtml z tym komunikatem daje title = komunikat i atrybut disabled; kontrola: ten sam stos z generałem daje ok=true.
- Wynik: "Wynik: 10 OK, 0 FAIL" (poprzednio 5/0).
- Handler main.ts ~27497 i przycisk ~27243 nadal nie zmienione (korzystają z canSetAmbush); pokrycie przez N1-N3 w live.

Zarzut 3 (AI nie ma ścieżki zastawiania; brak testu-strażnika na przyszłą ścieżkę AI): ODRZUCAM z dowodem.
- Dowód (grep po gra/src, wykonany na 8fbfc5e32): `grep -rn "ambush *= *true\|ambush: *true\|setAmbush(" gra/src --include=*.ts` daje tylko: gra/src/game/ambush.ts:113 (definicja setAmbush), gra/src/main.ts:27508 (setAmbush w obsłudze akcji gracza), gra/src/main.ts:45767 (`ambush: true` jako flaga ataku, nie stan zasadzki). Żaden plik AI nie ustawia stanu zasadzki; w gra/src nie ma pliku ai*.ts na poziomie katalogu głównego src, a AI nie zastawia zasadzek w tej bazie.
- Wymóg dispatchu (2) "warunek w kodzie AI/ambush.ts, wspólna funkcja z graczem" jest spełniony tak, jak dopuszcza dispatch: reguła żyje w jednej funkcji (canSetAmbush / stackHasGeneral w ambush.ts) i każda przyszła ścieżka zastawiania musi ją wywołać. Test-strażnik na nieistniejącą ścieżkę AI byłby spekulacją (ang. speculative test) i nie został dodany.
- Dla przyszłości: UWAGA-DLA-ORKIESTRATORA (poniżej), a nie zmiana tego tematu.

Zarzut 4 (brak testu starego zapisu z zasadzką stosu bez generała przez realny krok synchronizacji): PRZYJMUJĘ, WYKONANO.
- ambush-save-roundtrip-test.cjs: dwa nowe testy przez prawdziwe deserializeGame + reconcileAmbushInWorld (ten sam krok co main.ts:15325, który jest cienkim wrapperem nad reconcileAmbush w ambushMove.ts:30-35).
  * Stary zapis, stos z zasadzką (ambush=true, ambushAt='3,4,0') bez isGeneral: reconcile zwraca 2, obie jednostki bez ambush i bez ambushAt. PASS.
  * Stos z generałem i zasadzką: reconcile zwraca 0, zasadzka zostaje. PASS.
- Wynik: "Wynik: 7 OK, 0 FAIL" (poprzednio 5/0).
- Mutacja (dokładnie jak w dispatchu): w gra/src/game/ambush.ts zastąpiono `|| !stampsWithGeneral.has(u.ambushAt)` przez `|| false`, uruchomiono ambush-save-roundtrip-test.cjs -> wynik: "FAIL: stary zapis: stos z zasadzka bez generala wygasa przy reconcile po wczytaniu -- Expected values to be strictly equal:" oraz "Wynik: 6 OK, 1 FAIL" (test czerwienieje). Następnie `git checkout -- gra/src/game/ambush.ts` (plik przywrócony, git status czysty dla src).

Zarzut 5 (uwaga, nieblokująca: ścieżka 'rozstawienie bez generała -> AUTO' zostawiona): PRZYJMUJĘ jako uwagę; kod bez zmian.
- Uzasadnienie zgodne z 10-operator-claude.md §2: zastawiający ma zawsze generała, więc ścieżka jest nieosiągalna dla zastawiającego, ale osiągalna dla zaskoczonego gracza bez generała (wpadł w zasadzkę AI); komunikat ambushDeployFeedbackText dotyczy zaskoczonych. Usunięcie ryzykowałoby zmianę zachowania poza dispatchem (battleScene.ts jest poza zakresem tego tematu, dispatch: "NIE idzie żaden temat w battleScene.ts" równolegle).

Zarzut 6 (B3/B5/B6 czerwone w ambush-live-test; scenariusz B bez zielonego dowodu): ODRZUCAM jako zarzut kodu, dane poniżej.
- Pełny run bieżącego kandydatu (A + N + B) na tym samym buildzie: WYNIK 23 PASS / 3 FAIL; FAIL = B3 (`s1.ambush` nadal true po bitwie, brak nakładania OK), B5 (brak komunikatu „Zasadzka się powiodła" w DOM), B6 (faza AI nie wznowiona po bitwie: preBattleOpen=true). B2 (AI weszło w zasadzkę: okno bitwy otwarte) i B4 PASS.
- Ten sam zestaw fail (B3/B5/B6) zmierzył Evaluator na bazie d44d5b98 (18/3) i na kandydacie (18/3) -> dług bazowy, nie regresja tej rundy. Nie naprawiany tutaj (poza zakresem, dotyka ścieżki po bitwie AI).

RUNDY: 1/5 (obrona rundy 1; odpowiedzi na 6 zarzutów)

TESTY (surowe wyniki, wykonane na worktree po wykonaniu zmian; HEAD przed commitem obrony = 8fbfc5e32):
- `npx tsc --noEmit` (gra/): exit 0 (log: /tmp/claude-0/tsc-obrona.log, bez błędów)
- ambush-core-test.cjs: "Wynik: 48 OK, 0 FAIL" (exit 0)
- ambush-realstep-test.cjs: "Wynik: 16 OK, 0 FAIL" (exit 0)
- ambush-save-roundtrip-test.cjs: "Wynik: 7 OK, 0 FAIL" (exit 0; po mutacji: 6 OK, 1 FAIL)
- ambush-wiring-test.cjs: "Wynik: 28 OK, 0 FAIL" (exit 0)
- ambush-ui-reason-test.cjs: "Wynik: 10 OK, 0 FAIL" (exit 0)
- ambush-live-test.cjs (Chromium, pełny run A+N+B, build vite poza repo): "WYNIK: 23 PASS / 3 FAIL" (FAIL: B3, B5, B6 — ten sam dług bazowy co na d44d5b98); sekcja N: 5/5 PASS.
- NIE PONOWIONO w tej rundzie (nie dotknięte zmianą testową; ostatnie pomiary Evaluatora na tym samym kandydacie): ambush-deploy-geometry 20/0, -scene 26/0, -zone-visual 11/0, -wiring 15/0, line-width 240, lineside-guard 757, identity 1776, mgla-sciezka-inwariant 42/0, 5 bramek referencyjnych (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6). Kod gra/src nie zmieniany w obronie, więc wyniki te są nieruszone.
- Mutacje: reguła wygaśnięcia w reconcileAmbush -> save-roundtrip czerwone (1 FAIL) — PASS jako dowód czerwienienia testu.

BLOKADY: brak blokad technicznych. Dispatch 00-dispatch.md nie był w origin/main (jest w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); kryteria czytano z tej gałęzi (zgodnie z uwagą w dispatchu).

NASTĘPNY KROK: Evaluator (ponowna weryfikacja zmian testowych i zrzutu N), potem Final Control. Orkiestrator integruje po FC (merge-base względem d44d5b98 / bieżącego main).

UWAGI-DLA-ORKIESTRATORA:
1. Kryterium (f) zrealizowane scenariuszem N (element przycisku obejrzany). Pełny zrzut panelu nie pokazuje przycisku w kadrze; jeśli właściciel chce zrzut całego paska akcji, trzeba przewinąć panel — to osobny drobny temat UI, nie blokuje.
2. Przyszła ścieżka AI zastawiania zasadzek MUSI wołać canSetAmbush (zawiera 'no-general'); warto to dopisać do dispatchu następnego tematu AI, jeśli taki powstanie.
3. B3/B5/B6 (ambush-live-test) to dług bazowy: warto osobnego tematu „ambush-live-test B3/B5/B6" z decyzją, czy test czy kod ma być poprawiony.
4. W worktree zainstalowano gra/node_modules (npm ci, zależności). Sprzątanie worktree i node_modules zostawiam orkiestratorowi (dispatch: zakaz rm w worktree).

DEPLOY/PUSH: NIE WYKONANO
