# R-PR141-CODEX-F04-PRECEDENCE-DECISION-20261018 — precedence pokrywających się bonusów

**Data decyzji:** 2026-10-18  
**Status:** OWNER DECISION — dokumentacja reguły precedence  
**Zakres:** polityka pierwszeństwa dla pokrywających się starych bonusów przy późniejszym podłączaniu zatwierdzonych wartości F-04. Nie jest to source approval ani implementacja.

## Literalne pytanie i odpowiedź właściciela

**Pytanie:** „F-04 — jak traktować pokrywające się stare bonusy przy podłączaniu zatwierdzonych wartości do istniejących mechanizmów? Dotyczy m.in. rzymskich −20% kosztu budynków; odrębne, zatwierdzone rabaty G11 pozostają oddzielnymi efektami i sumują się tylko zgodnie z decyzjami 3B/5A.”

**Odpowiedź właściciela, 2026-10-18:** „A — jak w G1: macierz zastępuje tylko pokrywający efekt, także przy zerze; pozostałe efekty zachowujemy.”

## Znaczenie i ograniczenia

Dla przyszłego, osobno autoryzowanego podłączenia F-04: jeśli zatwierdzona wartość macierzy pokrywa ten sam efekt co stary bonus, macierz zastępuje wyłącznie ten pokrywający się efekt. Reguła obejmuje również zatwierdzoną wartość zero. Nie oznacza to wyzerowania lub usunięcia innych, odrębnych efektów.

Odrębne zatwierdzone rabaty G11 pozostają osobnymi efektami i mogą być sumowane wyłącznie w granicach reguł zapisanych w decyzjach 3B/5A. To odwołanie nie ustanawia nowych wartości ani nie zmienia treści tych decyzji.

Przykład wskazany w pytaniu: rzymski −20% kosztu budynków jest przykładem starego bonusu do rozpatrzenia jako overlap przy implementacji; decyzja nie określa tutaj algorytmu, kolejności etapów ani nowego parametru.

## Odrębne bramki

Wartości F-04 zostały ustanowione jako nowe źródło w decyzji [`R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018`](R-PR141-CODEX-F04-SOURCE-APPROVAL-20261018.md): dokładnie 360 wartości z zatwierdzonego workbooka. Niniejsza decyzja nie rozszerza tego scope, nie aktywuje consumerów i nie zatwierdza zachowania produktu.

Każdy adapter wymaga osobnego audytu konkretnych call paths i overlapów, mapowania do odpowiedniego zatwierdzonego pola oraz dispatchu implementacyjnego. Nie wolno automatycznie klasyfikować nowych mechanik religii, wealth ani pozostałych parametrów jako zatwierdzonych. Nie zmieniono danych, kodu, testów, runtime ani statusu produktu.

ECHO do wspólnego `dyspozycje/PYTANIA-OTWARTE.md` zostanie dopisane po zwolnieniu wspólnego writera przez root; ten plik decyzji zachowuje literalny Q/A i datę.
