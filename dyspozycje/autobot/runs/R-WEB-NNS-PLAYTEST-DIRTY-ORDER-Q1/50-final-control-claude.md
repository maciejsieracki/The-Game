# R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-PLAYTEST-DIRTY-ORDER-Q1
GOAL: K1 markCityStateDirty w presecie playtest=mapa; K2 kolejnosc zerowania empireEconDirty; presety bez zmian.
ZMIANY/COMMIT: kandydat 0a48c7c53 jest potomkiem bazy 0c12240a3 (merge-base --is-ancestor: tak); diff vs baza = 2 pliki raportow (10-operator, 30-obrona) w runs/; gra/ bez zmian. Integrowac: SHA tego commita raportu FC (zawiera 0a48c7c53 jako rodzica).
ROZSTRZYGNIECIE ZARZUTOW: (1) ODDAL - mutacje wykonalem sam (nizej); test zywy NIE ZMIERZONO, GOAL dopuszcza hakowy. (2) ODDAL - tylko opisowy; mapowanie skorygowane w obronie (l.49559 miasto, l.49798 mapa; oba maja wywolanie). (3) ODDAL - poza zakresem GOAL(3); do UWAG. Zero NAPRAW.
K2: main.ts l.23250-23252: refreshLiveEmpireRates zeruje flage PRZED refreshLiveEmpireRatesUnsafe, catch przywraca true; zerowanie po przeliczeniu zgubiloby dirty ustawiony w trakcie. Brak realnej utraty - slusznie bez zmiany.
TESTY (surowe wyjscie; kandydat = kod bazy): tsc --noEmit bez bledow; logic-test LOGIC OK 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; playtest-mapa-dirty-forecast-test 10 pass/0 fail. Mutacja l.49798 (markCityStateDirty -> void 0): 7 pass/3 fail; po przywroceniu 10/0. Bramki czerwone baza-vs-kandydat: brak.
BLOKADY: brak. Chromium / test zywy t1 prognoza!=null: NIE ZMIERZONO.
RUNDY: FC po rundzie 1/5.
UWAGI-DLA-ORKIESTRATORA: zamknac #492/#501 K1 jako "w bazie f3bf2cc67", K2 jako "brak efektu". Opcjonalny osobny temat: doStartPlaytestWalkaMapy (main.ts ~l.49303) robi cities.push bez markCityStateDirty. gra/node_modules w worktree do sprzatania.
NASTEPNY KROK: integracja orkiestratora, rejestr.
DEPLOY/PUSH: NIE WYKONANO
