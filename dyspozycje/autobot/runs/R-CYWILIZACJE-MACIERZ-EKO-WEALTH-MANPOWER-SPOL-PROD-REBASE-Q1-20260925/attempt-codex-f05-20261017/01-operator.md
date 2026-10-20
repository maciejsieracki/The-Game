STATUS: LOCAL_VALIDATION
DOMAIN: GAME
GOAL: Wykonać kontrakty F-05 1B/4B na aktualnym kodzie, bez zmian źródłowych wartości macierzy.
BASE: edb8fb56115e9dec0a58614dfb23ca6173d60c9a; lokalny zakres MP pozostaje osobno w diffie.

ZMIANY:
- civ-bonuses.ts: adapter Egiptu pomija nakładający się ogólny bonus ruchu bitewnego, zachowując wartość specyficzną rydwanów, także zero/ujemną. Inne cywilizacje zachowują ogólny bonus.
- Dodano osobny resolver bonusu embarkacji, który konsumuje wyłącznie dedykowane pole płytkiego morza.
- embarkation.ts korzysta z resolvera embarkacji; istniejąca bramka Żeglugi pozostaje.
- Nie zmieniono BattleScene: obie strony nadal korzystają z istniejącego helpera bitewnego i bonusów swoich właścicieli.

TESTY:
- egypt-movement-precedence-test.cjs: 21 PASS; syntetyczne nierówne wartości w pamięci esbuild, prawdziwy adapter macierzy i moveCostFnFor. Pierwszeństwo, zero/ujemna wartość, inne jednostki i cywilizacje, koszt płytkiego morza, odrębny bonus tego terenu oraz brak Żeglugi.
- civ-bonusy-test.cjs: 36 PASS.
- Typecheck: PASS; direct Vite build: PASS, 893 moduły; git diff --check: PASS.

GRANICE:
Lokalny zakres F-05; nie jest odbiorem całego PR141, pełnej rozgrywki, save/load ani niezależnym Final Control. Nie zmieniono wartości F-04 ani etykiet/holdów. Nie ponawiano run70 ani produkcyjnego harnessu run55. Brak commit/push/deploy.

## Korekta po niezależnym review (2026-10-17)

Embarkacja wyklucza bonusy bitewne wyłącznie Egiptu. Zulusi zachowują koszt 1/1.2, inne cywilizacje składanie ogólnego i dedykowanego bonusu.

Aktualny test zakresu: **24/24 PASS**. Niezależny recheck: PASS-WITH-NOTES, otwarte zarzuty: []. Kontrola negatywna wykrywa pierwotny defekt. [Review](/workspace/pr141-review/review-f05.md), [raport korekt](/workspace/pr141-review/review-repairs.md). Pierwotne wyniki powyżej pozostają historyczne. Final Control łącznego stanu: PASS-WITH-NOTES, otwarte zarzuty [] (audit_remaining). Bez publikacji i bez acceptance 93×15.
