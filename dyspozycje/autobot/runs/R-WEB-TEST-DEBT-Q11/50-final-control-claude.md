STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; zero zmian gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q11
GOAL: Zaktualizować testy do decyzji właściciela 2026-11-19 (baza surowców z danych, Mennica wymaga złota, lama tylko inkaska) + re-baseline testu rekrutacji.
ZMIANY/COMMIT: kandydat aabdf8a74659ff807a7d04fe6f47729c1b36caa2; ea8f70197 jest jego przodkiem (merge-base --is-ancestor: tak). diff --stat: 11 plików, wyłącznie allowlista (7 testów w gra/tools, 2 fixtury, 2 raporty runs); zero zmian w gra/src i gra/data (git diff --name-only, puste).
TESTY (własne uruchomienie, surowe wyjście): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ekonomia-5x 280/0; grupa-b 49/0; hex-plony 14/0; zloto 45/0; tarasy 18/0; rekrutacja PASS (exit 0; 214 pól zmienionych, 150 chronionych); mennica-magazyn 39 passed / 2 failed (exit 1).
OCENA ZARZUTÓW:
1 NAPRAWIONY: rekrutacja czyta bazę z fixtures/units-baza-329db81ff.json i niekoszty z fixtures/units-nonkoszt-2026-11-19.json; brak git show; PASS w czystym drzewie (node_modules to symlink do innego worktree).
2 CZĘŚCIOWO: oczekiwanie przywrócone na 2, złoto 10 w scenariuszach; asercja czerwona (got 0). Zgodne z dispatchem (zostaw czerwone i opisz); intencja testu zachowana. Znalezisko gry/scenariusza do wyjaśnienia, nie blokada merge.
3 ODDAL (uwaga): mutacje terrain-yields łapią ekonomia-5x i hex-plony.
4 ODDAL: budżet AI 100% puli (wg obrony, ai.ts); dolna granica >=1 akceptowalna.
5 ODDAL: piny 13/3 i 38/8 zgodne z gra/data/units.json; podstawa decyzja ABC pkt 1.
6 informacyjne: Garncarnia ceramika (Cegielnia zjada glinę) czerwone z opisem.
BLOKADY: brak blokad technicznych. Czerwone celowo (opisane w teście): mennica "Mennica BEZ Waluty" got 0 want 2; "Garncarnia ceramika>0" got undefined.
RUNDY: FC 1/5 (po rundzie 2 obrony)
NASTĘPNY KROK: orkiestrator integruje; 2 czerwone asercje mennica zostają w zestawie, rozważyć osobny temat R-WEB-* na błędy gry (Mennica/Cegielnia).
UWAGI-DLA-ORKIESTRATORA: znaleziska gry (Mennica delta 0 niezależnie od złota; Cegielnia zjada całą glinę); /tmp/none do ręcznego usunięcia; mutacji nie powtarzałem (oparte na dowodzie Evaluatora).
DEPLOY/PUSH: NIE WYKONANO
