# R-WEB-UI-END-TURN-BLOCK-EVENT-Q1 — obrona Operatora, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-END-TURN-BLOCK-EVENT-Q1
GOAL: Blokada „Zakończ turę” (bramka NNS) jest wydarzeniem w zakładce „Ważne” z pełnym komunikatem i akcjami (podatek / racja / „Zmienię sam”), a nie tylko tooltipem.
BAZA: c7c2ae352 (jeden commit na ff090714d). Gałąź robocza: `wip/R-WEB-UI-END-TURN-BLOCK-EVENT-Q1-obrona`.
ZMIANY-COMMIT: kod + dowody `f8c1864317a1ec1effd570d2601f84ff18b6beed`; ten raport w commicie następnym (SHA w polu `sha` odpowiedzi). Pliki kodu: `gra/src/main.ts`, `gra/src/ui/sidePanelHud.ts`, `gra/tools/end-turn-block-event-test.cjs`, `gra/tools/end-turn-block-event-live-test.cjs`. Dowody: `evidence/blokada-wydarzenie-wazne.png`, `evidence/end-turn-block-event-live.json`, `evidence/mutacja-m1-zywnosc-sekcja.json`, `evidence/mutacja-m2-przycisk-podatek.json`. Poza allowlistą: `gra/src/ui/hud.ts` (patrz zarzut 5). Logika bramki (`no-negative-stocks.ts`) NIE zmieniana.

## Odpowiedzi na zarzuty Evaluatora (r1)

1. **Widoczność „Zmienię sam” — PRZYJMUJĘ (poprawka + dowód).** Przed poprawką przyciski siedziały w przewijanym kontenerze `.sp-scroll` (overflow auto), który kończył się na y=616; „Zwiększ podatek” miał dół na y=617, „Zmienię sam” na y=645 (poza kontenerem). Poprawka: przyciski akcji renderowane PRZED długim podtytułem (`sidePanelHud.ts`), więc są widoczne pod tytułem karty. Test żywy ma nową asercję „przyciski karty blokady są widoczne i klikalne”: `inViewport && elementFromPoint trafia w przycisk && brak przycięcia przez przodka z overflow`. Przed poprawką FAIL (obie `visible:false`), po poprawce PASS. Zrzut `evidence/blokada-wydarzenie-wazne.png` pokazuje oba przyciski.

2. **Żywność — PRZYJMUJĘ (błąd realny + scenariusz).** `openEmpireDetailFromHud('zywnosc')` przekazywało sekcję, której blok panelu nie zna (`empirePanelBlockForSection` nie ma case `zywnosc`; mapowanie `zywnosc → spichlerz` jest w innej funkcji, mapie żetonów HUD). Poprawka: `openEmpireDetailFromHud('spichlerz')` (blok „SPICHLERZ CENTRALNY”, `empireDetailPanel.ts` l.4459). Dodany scenariusz żywności w teście żywym: bramka blokuje na zasobie `spichlerz` → karta z przyciskiem „Otwórz racje” (act `open-food`) → przycisk widoczny i klikalny → po kliku w panelu pojawia się nagłówek „SPICHLERZ CENTRALNY”. Mutacja M1 (powrót do `'zywnosc'`) → FAIL na tej asercji (`evidence/mutacja-m1-zywnosc-sekcja.json`, passed=24 failed=1). Czego NIE zmierzono: zniknięcie karty żywności po zmianie racji (patrz zarzut 3).

3. **Zniknięcie karty po ręcznej zmianie — PRZYJMUJĘ CZĘŚCIOWO.** Dodany krok w teście żywym: druga tura, blokada skarbca, próba zakończenia (karta jest), potem ręczna zmiana podziału przez `setTaxSplit` (ta sama funkcja zapisu co przycisk, bez kliku w DOM suwaka) + `withRender` → karta znika (`count 0`) i bramka puszcza turę (PASS). NIE ZMIERZONO: (a) klik w DOM suwaka podatku — suwak panelu imperium zapisuje podział osobnym writerem (`main.ts` ok. l.28213, `onOwnerDefaultChange`), którego test nie kliknął; (b) zmiana suwaka RACJI i zniknięcie karty żywności; (c) zniknięcie bez wymuszonego `withRender` (test wymusza odświeżenie gry — to nie jest pomiar zwykłego odświeżenia HUD).

4. **Czerwień na bazie — ODRZUCAM (dowód).** Test na bazie (sidePanelEventFilter.ts cofnięty do ff090714d) kończy się exit 1, bo brakuje eksportu `endTurnBlockEventOf` — czyli brak samej funkcjonalności, a nie błąd testu. To jest czerwień wymagana dispatchem („nowy test czerwony na bazie”). Asercje behawioralne są czerwone mutacjami: jednostkowa r1 32/2, żywa M1 (24/1), M2 (21/4). Nie powtarzałem pomiaru na bazie w tej rundzie (cytuję pomiar Evaluatora).

5. **hud.ts poza allowlistą — PRZYJMUJĘ jako odchylenie.** Trzy linie w `hud.ts`: pole `onEventButton` w `HudConfig` i przekazanie do `createSidePanelHud` w `mountSidePanel`. Bez tego `main.ts` nie ma drogi do przycisków karty (panel jest tworzony z konfiguracji w `hud.ts`). Brak zmiany logiki. Prośba do FC: zaakceptować jako konieczne wpięcie albo dopisać do allowlisty.

6. **Duplikacja zapisu podatku — PRZYJMUJĘ (refaktor).** Poprzednio `setTaxSplit` (hook testowy) i przycisk pisały podział osobno. Wydzielono `applyPodzialHandluGracza(p, n, l)` (`main.ts`, ok. l.39900): `normalizePodzialHandlu` → `ownerDefaultPodzialHandlu.set(ME(), s)` → `markCityStateDirty()` → `updateHud()` → zwraca `s`. `setTaxSplit` (l.~31997) i przycisk „Zwiększ podatek” wywołują tę samą funkcję (przycisk dodatkowo `refreshD1bHud()`, jak poprzednio). Treść `setTaxSplit` przed zmianą była tożsama (te same 4 kroki). Test wiringu w `end-turn-block-event-test.cjs` zaktualizowany do wspólnej funkcji (wcześniej sprawdzał stary zapis inline; po refaktorze 1 asercja była czerwona, teraz 35/0). NIE ZMIERZONO: suwak DOM ma osobny writer (zarzut 3a) — poza zakresem, nie ruszany.

7. **Nieblokujące / licznik „wymaga decyzji” — ODRZUCAM (uzasadnienie).** DODATEK 1/2 orkiestratora: dla pieniędzy nie ma automatu, wydarzenie jest PYTANIEM/informacją z przyciskiem, nie decyzją blokującą. Reguła licznika nie zmieniona: liczy tylko zdarzenia blokujące (`blocking`), a karta ma `kind:'info'`, `important:true`, bez `blocking`. Zrzut pokazuje „1 WYMAGA DECYZJI · 1 INFORMACYJNA”: „wymaga decyzji” to karta „Produkcja: Rzym” (kolejka pusta), a karta blokady liczy się jako informacyjna. Zgodne z DODATKIEM 2. Decyzja do potwierdzenia przez FC/właściciela, bez zmiany kodu.

## TESTY (surowe wyjścia, `gra/`)

- `npx tsc --noEmit` → exit 0 (bez wyjścia)
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `ALL GREEN` (exit 0)
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `All sanity checks passed.` (exit 0)
- `node tools/end-turn-gate-projection-only-test.cjs` → `49 passed, 0 failed`
- `node tools/end-turn-block-event-test.cjs` → `passed=35 failed=0` (exit 0)
- `node tools/end-turn-block-event-live-test.cjs --dist <build poza repo> --out runs/.../evidence` (Chromium, `?civTest=1`) → `passed=25 failed=0 pageerrors=0`
- Mutacja M1 (`'spichlerz'` → `'zywnosc'`) → `passed=24 failed=1`
- Mutacja M2 (wywołanie zapisu w przycisku zastąpione no-opem) → `passed=21 failed=4` (FAIL: po kliku podatek, bramka puszcza turę, karta znika, tura kończy się)
- `git diff --check` → czysty
- Build do testu żywego: `npx vite build --outDir <scratchpad>/dist-obrona --emptyOutDir` (poza repo; `npm run build/dev` nie uruchamiane). `node_modules` w `gra/` zainstalowane przez `npm ci --ignore-scripts` (71 pakietów).

## BLOKADY

- Brak. Odchylenie od allowlisty: `gra/src/ui/hud.ts` (zarzut 5).
- NIE ZMIERZONO: klik w DOM suwaka podatku i suwaka racji; zniknięcie karty żywności po zmianie racji; zwykłe odświeżenie HUD bez `withRender`; klik „Otwórz racje” w DOM bez testu (wykonany przez `page.evaluate` na przycisku karty).

## RUNDY

2/5 (obrona r2). Zarzuty r1 przyjęte: 1, 2, 3 (częściowo), 5, 6. Odrzucone z dowodem: 4, 7.

## UWAGI-DLA-ORKIESTRATORA

- Start z c7c2ae352 zgodnie z zadaniem; gałąź robocza `wip/R-WEB-UI-END-TURN-BLOCK-EVENT-Q1-obrona` NIE jest wypchnięta, nie integrowana, nie na main.
- Dispatch r3/DODATEK 3 mówił o bazie aktualny origin/main (ff090714d). Kandydat jest o jeden commit na ff090714d; przed integracją sprawdzić `git merge-base --is-ancestor` względem aktualnego main.
- Sprzątanie po FC: `gra/node_modules` (zainstalowane w tej rundzie) oraz build w scratchpadzie (`dist-obrona`, `dist-m1`, `dist-m2`).
- Zrzut zdarzenia blokady po poprawce jest w `evidence/blokada-wydarzenie-wazne.png`; widać oba przyciski pod tytułem „Nie można zakończyć tury”.

## NASTĘPNY KROK

Evaluator r3 (SONNET) na kandydacie `f8c1864317a1ec1effd570d2601f84ff18b6beed` (+ commit raportu), potem Final Control. Przed deployem wymagany osobny zakaz/autoryzacja push/deploy zgodnie z procesem.

DEPLOY/PUSH: NIE WYKONANO
