STATUS: PASS
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL: Stadnina poza złożem konia płatna 50 'kon' z magazynu imperium (jednorazowo per
stadnina); na złożu bez zmian; handel 'kon' możliwy; AI odzyskuje zdolność budowy; UI/toast
komunikuje koszt.

WERDYKT: PASS. Wszystkie trzy rundy potwierdzone niezależnie, zero rozbieżności z raportami
Operatora/Evaluatora.

DOWÓD WŁASNEJ WERYFIKACJI:
(a) Stadnina na złożu: sekcja E `stadnina-kon-koszt-live-test.cjs` — buduje mimo magazynu=0,
kod (`livestock-unlock.ts`) potwierdza `hexHasHorseDeposit(hex)` jako pierwszy człon OR, koszt
nigdy nie sprawdzany na złożu.
(b)+(c) Realny `applyBuildRequest`→`commitBuildRequest`: uruchomiono `stadnina-kon-koszt-live-
test.cjs` (vite build + headless Chromium) — 19/19 pass. `__buildRequestTestDebug.
applyBuildRequest` (main.ts) to bezpośrednie wywołanie produkcyjnej funkcji, nie duplikat.
Sekcja D dowodzi odjęcia dokładnie 50.
(d) AI: `hodowla-las-test.cjs` — 112/112, sekcja [4] woła realny `pickAutoImprovements`
(bundlowany esbuildem) z `city.surowce.kon`: 49→false, 50→true, 500→true, złoże→true
niezależnie od magazynu — faktyczny wybór budowy.
Handel koniem: potwierdzone z rundy 1 (10/10 OK), `diplomacy-value-catalog.ts`/
`diplomacy-goods.ts`/`empire-diplo-resource-flow.ts`/`econ-params.json` nietknięte od rundy 1.
Bydło/owce/lama: `isLivestockUnlockedForPlacement` zwraca `true` bezwarunkowo dla
`norm !== 'stadnina'` — niezmieniona gałąź.

ZMIANY-COMMIT: `gra/src/main.ts` — dokładnie 3 hunki (2 z rundy 2, 1 z rundy 3 — dwie nowe
metody testowe `setCityKonStock`/`forceHorseDeposit`/`forceNoHorseDeposit` w
`__buildRequestTestDebug`). `gra/src/game/auto-improvements.ts` — 1 hunk, wyłącznie budowa
`state` w `pickAutoImprovements`. `gra/src/game/livestock-unlock.ts`,
`gra/src/map/improvement-build.ts` — zgodne z rundami 1-2, bez nieautoryzowanych rozszerzeń.

TESTY (wszystkie uruchomione samodzielnie): `tsc --noEmit` 0 błędów. 5 bramek referencyjnych
zielone. `stadnina-kon-koszt-test.cjs` 17/17. `stadnina-kon-koszt-live-test.cjs` 19/19
(Chromium). `hodowla-las-test.cjs` 112/112. `stadnina-las-test.cjs` 28/28.
`hex-tooltip-stadnina-kopalnia-cyny-test.cjs` 29/29. `food-hodowla-test.cjs` 20/4 —
potwierdzone identyczne 4 FAIL na czystym commicie bazowym, pre-istniejące.

BLOKADY: (1) `tradeRouteKonUnlocked` dla AI zostaje `false` na stałe (jawny, zgłoszony dług,
poza zakresem rundy 3). (2) Tooltip hexa "23/50 koni" nadal niewdrożony (zastąpiony toastem,
który spełnia kryterium (b)).

NASTĘPNY KROK: integracja orkiestratora → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
