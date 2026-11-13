STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-ARMY-MERGE-PANEL-LIST-VISIBILITY-Q1
Obrona rundy 1/5 (baza 59d326396). Uwaga 1: PRZYJETA (test: przemiatanie scrollTop co 7 px; mutant offsetTop -> FAIL).
Uwaga 2: Enter ODRZUCONA jako poza GOAL (GOAL (e) obejmuje klawiature; domyslne Enter bez fokusu = merge jak wczesniej, test c3); Spacja ODRZUCONA (test c4: merge=0).
Uwaga 3: PRZYCZYNA WYJASNIONA: PRE_REF domyslnie origin/main, ktory zawiera juz wdrozony panel; z ARMY_SPLIT_PRE_REF=798ec59eb~1 18 PASS / 0 FAIL. Nie regresja.
Uwaga 4: PRZYJETA (korekta: PNG 492 KB). Uwaga 5: bez zarzutu.
Bramki: gate-obrona-*.txt (po jednej linii EXIT=).
