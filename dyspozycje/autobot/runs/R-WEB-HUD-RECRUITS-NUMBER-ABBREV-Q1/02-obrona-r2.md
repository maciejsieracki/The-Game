STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-HUD-RECRUITS-NUMBER-ABBREV-Q1 (obrona, runda 2)

Zarzut 1 (tooltip Armia): PRZYJMUJĘ. hud.ts armiaChipTitle: "Pula rekrutów" przez formatCompactNumber przy numerycznym s.rekruci (fallback: rekruciLabel). Test rozszerzony o asercję tooltipu chipa Armia; RED (kod r1) 3 FAIL (1k, 12,3k, 1,2M), GREEN OK (test-red-r2.txt, test-green-r2.txt). tsc EXIT=0, hud-number-abbrev-test OK.
Zarzut 2 (znaczniki/karty armii): ODRZUCAM jako brak zakresu — pomiar: units.ts:6411 odznaka "×N" (mała liczba jednostek), armyListHud.ts:137 "N · M jedn.", armyStackHud.ts:351 HP "x / y" — to małe liczby całkowite, nie wartości tys./mln; brak użycia formatManpower w tych plikach. Nic do ujednolicenia.
Zarzut 3 (test-red.txt z innej wersji testu): PRZYJMUJĘ — log r1 jest historyczny; odtwarzalny RED dla commitowanego testu to test-red-r2.txt.
Zarzut 4 (6 testów HUD FAIL przed i po): ODRZUCAM jako dług poza zakresem; identyczne PRZED/PO, przyczyny NIE_ZMIERZONO, do osobnego tematu.
