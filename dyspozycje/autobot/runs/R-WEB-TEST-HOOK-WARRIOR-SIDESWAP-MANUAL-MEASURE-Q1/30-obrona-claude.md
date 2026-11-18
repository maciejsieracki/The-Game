# R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1 — Obrona Operatora (runda 1, odpowiedź na Evaluatora aee3826)

STATUS: DECISION_REQUIRED (zarzut 3: zakres zmian main.ts poza blokiem civTest — decyzja właściciela; pozostałe zarzuty przyjęte)
DOMAIN: GAME (hooki civTest + narzędzie pomiarowe; zero zmian zasad walki)
TEMAT: R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1
GOAL: odpowiedzieć na 6 zarzutów; skorygować wnioski pomiaru; domknąć dowody bramek.
ZMIANY/COMMIT: gałąź autobot/R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1 (SHA = pole sha). Zmienione: civ-test-hooks.ts (komentarz), tools/sideswap-hooks-static-test.cjs (nowy), evidence/gate-r2-summary.txt, evidence/pewne-auto-seed-pairing.txt. main.ts bez zmian.

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Potwierdzone: wiersze swap AUTO są lustrzanym powtórzeniem wierszy atk. Zbiory zwycięzców sceny-atakującego są identyczne na ziarnach {4,12,14,16,18,20} w obu rolach (evidence/pewne-auto-seed-pairing.txt). Pooling 12/40 jest nieważny; niezależne n=20. Obrońca 14/20: Wilson 95% [48,1; 85,5], czyli obejmuje 50%. Wniosek "poza 50%" odwołany.
2. PRZYJMUJĘ. Wniosek "rola, nie strona" wycofany. W AUTO rola i strona nie są rozdzielone (stosy identyczne). W trybie ręcznym gracz jest pierwszy w kolejce (battleScene.ts:5765-5768, `order.push(...player, ...enemy)`), co jest kandydatem na przyczynę odwrócenia pewne/manual. Przyczyna NIE ZMIERZONA.
3. PRZYJMUJĘ FAKT, DECYZJA WŁAŚCICIELA. main.ts poza blokiem civTest: `let _civTestSwapSides` i konstruktor BattleScene (ok. 20 linii). Nie da się tego przenieść do bloku, bo scena dostaje role przez konstruktor. Przy fladze wyłączonej `swapSides ? B : A` daje A. Dowód runtime NIE ZMIERZONO. Opcje: A) przyjąć odchylenie i dowieść runtime w rundzie 2; B) wycofać konstruktor, pomiar swap NIE ZMIERZONY.
4. PRZYJMUJĘ. Dodano ostrzeżenie w komentarzu `setSwapSides` (civ-test-hooks.ts): zamiana dotyczy tylko sceny; ścieżka mapowa AI->gracz nie jest zamieniana. Kod callbacka bs.play bez zmian (poza zakresem blokiem civTest).
5. PRZYJMUJĘ. Dodano gra/tools/sideswap-hooks-static-test.cjs: test statyczny 7/7 PASS; mutacja przez kopię pliku bez linii `setSwapSides` daje 1 FAIL (exit 1). Poprzedni dowód mutacji (bundle bazy) dowodził tylko braku API. Pusty gate-tsc.txt uzupełniony przez evidence/gate-r2-summary.txt z kodem wyjścia.
6. CZĘŚCIOWO PRZYJMUJĘ. Raport obrony mieści się w limicie 400 słów. Tryb ręczny nie jest czystym 10v10 (Wódz w stosie, rozkaz "atakuj"). Czy wszystkie jednostki wykonały rozkaz: NIE ZMIERZONO.

## Bramki (runda 2; surowe wyjścia w evidence/gate-r2-summary.txt)
tsc EXIT 0; logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat EXIT 0; static 7/7 PASS; mutacja 1 FAIL.

Korekta: 60-pomiar-tabela.md zostaje surowym zapisem; wiarygodne n w AUTO to 20, nie 40.

## BLOKADY
- Zarzut 3 wymaga decyzji właściciela (A/B powyżej).
- Ścieżka mapowa AI->gracz: NIE ZMIERZONO.
- Przyczyna asymetrii: NIE ZMIERZONA (wymaga izolacji kolejności tury).
- Dysk: 2,8 GB wolnego po npm ci w worktree (poniżej progu 4 GB dla weba); node_modules do usunięcia przy sprzątaniu.

## RUNDY
Operator runda 1/5; obrona runda 1 (ten raport). Następnie Evaluator r2.

## NASTĘPNY KROK
Decyzja właściciela w zarzucie 3 (A lub B), potem Evaluator r2 i Final Control.

DEPLOY/PUSH: NIE WYKONANO
