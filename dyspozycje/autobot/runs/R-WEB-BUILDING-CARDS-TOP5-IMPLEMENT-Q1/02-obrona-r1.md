STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — Operator (obrona) na zarzuty Evaluatora r1
TEMAT: R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1
GOAL: jak w 00-dispatch.md (karty budynków: Top 5 po Rysie, „Co możesz teraz zrobić”, ukrycie niedostępnych/martwych, −30% korupcji).

ZMIANY-COMMIT: stan odtworzony z a8688bdec (kod b679ed33c). Obrona: **ed1383e9a** (`gra/tools/building-cards-top5-test.cjs`, `runs/<ID>/01-operator-r1.md`) + commit tego pliku. Bez zmian w kodzie gry, `tech.json` ani `cityPanel.ts`.

ZARZUT 1 (BLOKADY nieścisłe) — PRZYJMUJĘ. Zmierzyłem 40 widocznych budynków: wiersze kafelka „Technologie” policzone z prawdziwego `playerFacingNote` (wycinek `cityPanel.ts`) i `tech.json`, sprawdzone frazami `_martweFrazy`. Wynik: 5 wierszy na 3 kartach. Oprócz dwóch przypadków Evaluatora jest trzeci, którego nie wskazał nikt:
- Akademia: „Odblokowuje budynek: Akademia; Teatr” + „Uwagi tech: … Teatr = NOWY budynek…”;
- Akademia wojskowa: „Uwagi tech: … prereq elitarnych jednostek żelaznych”;
- Warsztat oblężniczy: „Odblokowuje budynek: …; Jednostki: Katapulta” + „Uwagi tech: jednostki: Katapulta…”.
BLOKADY w 01-operator-r1.md wymieniają teraz wszystkie trzy. Naprawa wymaga `cityPanel.ts` (poza allowlistą), a `tech.json` jest zakazany. Decyzja należy do orkiestratora: runda 2 z rozszerzoną allowlistą albo osobny temat R-WEB.

ZARZUT 2 (luka w pokryciu testu) — PRZYJMUJĘ. Dodałem sekcję [G] i opis zakresu w nagłówku testu:
- kotwica w źródle: host `buildBuildingDetailCardViaEntityCard` woła `appendTechDetailBlock(techBody, data, def.techUnlock)`, a kafelek pokazuje „Odblokowuje budynek” i `playerFacingNote(t.Uwagi)` (`cityPanel.ts` nie daje się bundlować w izolacji, tak samo jak w building-detail-card-entitycard-migration-test);
- treść wierszy kafelka liczona z prawdziwego `playerFacingNote` (esbuild transform wycinka źródła);
- porównanie z listą ZNANY_STAN_HOST (5 pozycji, wypisywane jako „ZNANY STAN … poza allowlistą”). Nowe trafienie daje FAIL (regres). Zniknięcie trafienia daje FAIL „zaktualizuj listę”.
Dowód: test **1179 pass / 0 fail** (wcześniej 1175, +4 asercje [G]). Mutacja: usunięcie wpisu „akademia_wojskowa … elit” z listy daje **1178/1 FAIL** „brak NOWYCH fraz martwych…”, czyli strażnik działa.

ZARZUT 3 (raport > 600 słów) — PRZYJMUJĘ. 01-operator-r1.md skrócony i poprawiony: `wc -w` = **492**.

TESTY (po ed1383e9a, w moim worktree):
| Bramka | Wynik |
|---|---|
| building-cards-top5-test | 1179/0 |
| gen-building-cards-top5 --check | OK |
| tsc --noEmit | 0 błędów |
logic-test i ai-test pominięte: obrona nie zmienia plików źródłowych gry (tylko test .cjs i raport), a wyniki r1 (213/213, 289/0) potwierdził Evaluator.

UWAGA spoza zakresu (od Evaluatora): Top3 Trybunału („+1 pieniądza i +2 Szczęścia”, z CSV po FC analizy) nie zgadza się z „Zadowolenie +1 pkt/turę” w sekcji Plony tej samej karty. Do rewizji treści, nie ruszam.

BLOKADY: kafelek „Technologie” hosta — 3 karty, 5 wierszy (wyżej); poza allowlistą.
RUNDY: 1/5 + obrona
NASTĘPNY KROK: Final Control; orkiestrator decyduje o blokadzie; właściciel potwierdza założenia 1–5.
DEPLOY-PUSH: NIE WYKONANO
