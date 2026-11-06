# Obrona R1 - R-WEB-LONGRUN-100-TURNS-LEAK-Q1

Baza odtworzenia: 11024e26b (Operator). Brak zmian kodu w obronie.

1. Seed 777 / kryterium 2 ziaren: PRZYJMUJE jako lukę, ODRZUCAM jako FAIL. NIE_ZMIERZONO (777 PRE do t.73, brak POST). Pomiar >8 min na świat, 4 rdzenie. Seed 777 PRE daje ten sam hotspot (1,05 s t.40 -> 4,2 s t.70), więc przyczyna jest wskazana na obu ziarnach. Dokończenie 777 = decyzja orkiestratora.
2. Brak porównywalnych ms: ODRZUCAM jako błąd, potwierdzam ograniczenie. Wall-clock PRE/POST nieporównywalny (load 13-32 na 4 rdzeniach, różne trajektorie). Dowód to udziały w profilu CPU (xji 19,2 s -> brak; JS endTurn t.95 29,7 s -> 11,6 s). Efekt wall-clock: NIE_ZMIERZONO.
3. Drugi hotspot placedImprovementsForOwner (~14 s w t.95, mAA): PRZYJMUJE jako fakt, poprawki nie wdrażam. Dispatch dopuszcza poprawkę tylko jednoznaczną i małą; cache w pętli auto-ulepszania to inna ścieżka (opcja A). Do decyzji orkiestratora jako osobny temat.
4. Słabość testu memo: CZĘŚCIOWO PRZYJMUJĘ. Warunki 1-3 używają syntetycznego predykatu celowo (test sprawdza kontrakt memoizacji: identyczne wyniki, mniej wywołań bazowych). Poprawność względem prawdziwego predykatu wynika z inspekcji (czyste odczyty, main.ts:5202-5232) potwierdzonej przez Evaluatora oraz z regresji trade-grant 62/0, zloto-szlak 54/0, mennica-uspienie 49/0. Warunek 4 (regex) sprawdza tylko podpięcie, nie zachowanie - zgoda. Bez zmiany kodu.
5. Listenery i pamięć nieodtworzone przez Evaluatora: ODRZUCAM jako zarzut do poprawki. Dane są w raw-*.jsonl i turns-every5.csv, odtwarzalne skryptem gra/tools/longrun-100-turns-leak-q1-measure.cjs.

Dodatkowo: 5 FAIL trade-ilosc-test Evaluator potwierdził na czystym 80919e2ae (35/5 identycznie) - blokada Operatora zamknięta; dług testowy poza zakresem tematu.
