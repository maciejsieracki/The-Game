STATUS: PASS
DOMAIN: GAME
TEMAT: P-BITWA-OBRONCY-PRZED-MUREM-Q1
GOAL: obrońcy w bitwie z murem oblężniczym nigdy nie startują/nie lądują PRZED murem.

WERDYKT PRZYCZYNY (dowód żywy, Chromium/Playwright, real vite build, real BattleScene):
- (A) START bitwy (`_placeUnits` -> `_placeSiegeDefenders`, gra/src/battle/battleScene.ts):
  zmierzone PRZED tematem — 0/28 obrońców poniżej `siegeWallCol`. Ta gałąź była już
  poprawna; ŻADNA z kandydatur (a)/(b)/(c) z dispatchu się nie potwierdziła na starcie.
- (B) REALNY DEFEKT: tryb "AUTO-rozegranie bitwy" (klawisz R, `_toggleManualMode()`).
  `_activateUnit` wykonuje krok doktryny (`_executeGroupDoctrineStep`) dla KAŻDEJ
  jednostki bez ręcznego rozkazu — w tym obrońców oblężenia — ZANIM kod dociera do
  istniejącej blokady "SIEGE DEFENDER HOLD" (komentarz "NAPRAWA problem 4") kilkadziesiąt
  linii niżej. Doktryna domyślna "steady" liczy cel jako `_forwardCol('def', q, 2)` = 2
  kolumny w stronę atakującego, wprost przez mur. Zmierzone PRZED naprawą: 2/28 obrońców
  z muru (`onWallWalkway`) schodzi z q=siegeWallCol na q=siegeWallCol-1 (przed mur, strona
  atakującego) już w 1. turze AUTO — dokładnie objaw ze zgłoszenia (dwie flagowane
  jednostki po złej stronie muru, reszta armii daleko z tyłu). Najbliższe kandydaturze (d)
  z dispatchu, ale mechanizm to generyczna ścieżka ruchu trybu AUTO nieświadoma muru, nie
  osobny "wypad".
- DODATKOWO (drugi, niezależny defekt tej samej klasy, ta sama funkcja rodzina):
  `_placeUnitsOneSide('def', siegeMode)` (Reset podczas fazy rozstawiania) miała
  analogiczną gałąź 'atk' sprawdzającą `siegeMode`, ale gałąź 'def' ją POMIJAŁA —
  liczyła kolumnę względem środka pola (DEPLOY_DEF_FRONT_COL≈36), nie względem muru
  (siegeWallCol≈40). Obecnie nieosiągalna z istniejących call site'ów (oba mają
  `deployPlayerSide:'atk'`), ale to publiczne API sceny (Reset) bez żadnej bariery przed
  przyszłym wywołaniem z graczem-obrońcą — naprawiona jako regresja tej samej klasy.

NAPRAWA (WYŁĄCZNIE gra/src/battle/battleScene.ts, logika obrońcy przy murze):
1. `_activateUnit`: doktryna trybu AUTO wyłączona dla `ru.side==='def' && siegeWallCol>=0`
   (obrońca oblężenia ma jedno zachowanie — trzymać mur/tyły — realizowane niżej w tym
   samym pliku).
2. `_placeUnitsOneSide`: dla `side==='def' && siegeMode && siegeWallCol>=0` deleguje do
   `_placeSiegeDefenders` (ten sam mechanizm co start bitwy), zamiast generycznego wzoru
   frontCol/rankStep.
3. Debug hook `_debugRecordSiegeColumns()` (tylko `typeof window!=='undefined'`) zapisuje
   `window.__lastBattleScene` + `window.__siegeColTestDebug` po każdym (re)rozstawieniu —
   bez wpływu na rozgrywkę, użyty przez nową bramkę.

ZMIANY/COMMIT: gra/src/battle/battleScene.ts (+53/-1); nowa bramka
gra/tools/bitwa-obroncy-mur-kolumny-test.cjs. SHA commitu — patrz git log tej gałęzi.

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- Bramki oblężenia (regresja): oblezenie-test 27/27, siege-ai-test 17/17,
  siege-defenders-test 12/12, map-siege-test 6/6, oblezenie-remis-endsiege-test 271/271,
  oblezenie-siege-lifted-po-bitwie-test 16/16 — wszystkie zielone, bez regresji.
- NOWA bramka `bitwa-obroncy-mur-kolumny-test.cjs` (real Chromium, real vite build,
  macierz A/B nietautologiczności — MUT rewertuje strażnik naprawy i odtwarza defekt na
  tej samej scenie): 6/6 PASS. (A) start bitwy: 0/28 poniżej muru. (B1) BASE po 1 turze
  AUTO: 0/28 poniżej muru. (B2) MUT po tej samej turze: 1/28 poniżej muru (defekt
  odtworzony na złym kodzie — dowód, że asercja mierzy realny mechanizm).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator.
DEPLOY/PUSH: NIE WYKONANO
