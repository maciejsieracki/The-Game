# R-WEB-DISBAND-REFUND-RESOURCES-Q1 — dispatch (2026-11-09)

GOAL: Przy ROZWIĄZANIU jednostki gracza (`disbandPlayerUnit`, main.ts ~6147) wraca 100% surowców zużytych przy werbunku (pole `Surowiec` / `Surowiec (ilość)` w units.json, mapowanie: `gra/src/game/building-stock-cost.ts` ~276-345; konsumpcja: main.ts ~3938 i ~32890), oprócz dotychczasowego zwrotu rekrutów. Decyzja właściciela (ABC, 2026-11-09): wariant A — zwrot 100%. Pieniądze NIE wracają (poza tym co dziś).

BAZA: origin/main (FALA 566, 1493bb5c9). Operator: HAIKU 5.5.

ZAKRES:
1. Diagnoza w raporcie: skąd werbunek zdejmuje surowiec (pula państwa), czy są inne ścieżki rozwiązania (AI/`disbandOwnerUnits` przy upadku stolicy — NIE zwracać; "Zastąp" — nie ruszać), czy ten sam zwrot ma objąć zwolnienie jednostki z powodu bankructwa/utrzymania (tylko zgłoś, nie zmieniaj).
2. Implementacja: czysta funkcja zwrotu (np. w building-stock-cost.ts) + wywołanie w `disbandPlayerUnit` (dodanie do puli państwa tym samym mechanizmem, którym werbunek odejmuje; clamp do ewentualnego limitu magazynu jeśli istnieje, wtedy zgłoś).
3. Komunikat gracza: do hintu dopisać „+N drewna" itp. (po polsku, nazwa surowca w mianowniku/dopełniaczu poprawnie, bez surowych id).
4. Jednostki bez surowca (Surowiec=null/0) — brak zmian. Jednostka zrekrutowana „za darmo" (bez konsumpcji) — nie zwracaj więcej niż zużyto (jeśli brak śladu — zgłoś w raporcie).
5. Test `gra/tools/disband-refund-resources-test.cjs`: drewno, brąz, koń; jednostka bez surowca; hint; brak zwrotu pieniędzy; brak regresji refundManpowerToEmpire.

ALLOWLISTA: gra/src/main.ts, gra/src/game/building-stock-cost.ts (+ ewentualnie nowy plik w gra/src/game/), gra/tools/disband-refund-resources-test.cjs, dyspozycje/autobot/runs/R-WEB-DISBAND-REFUND-RESOURCES-Q1/. Zakaz: WERSJE.md, gra-robocza/, npm run build/dev, git add -A, deploy/push.
BRAMKI: tsc --noEmit, logic-test, testy rekrutacji/manpower/stock-cost wskazane w raporcie, nowy test.
