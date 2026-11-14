STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1
GOAL: karty jednostek (unitAdapter, unitInfoCard, cityPanel legacy) pokazuja statystyki silnika (combatUnitFromDef), nie kolumny PL; zero zmian w units.json i silniku.
ZMIANY/COMMIT: kandydat e917ad63936a5ae0bd41f3394e0801481225fb06 (potomek b3e74f414: git merge-base --is-ancestor = tak). Diff vs baza: unitEngineStats.ts (nowy), unitAdapter.ts, unitInfoCard.ts, cityPanel.ts, unit-detail-card-entitycard-migration-test.cjs, nowy unit-card-stats-engine-canon-test.cjs, runs/**. gra/data i gra/src/game: 0 zmian. git diff --check czysty. Allowlista zachowana.
TESTY (surowe wyjscia, kandydat): tsc 5.9.3 --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; canon-test PASS; migracja kart 40/0; entity-card-contract 75/0. Baza: canon-test z plikami UI bazy -> FAIL (unitAdapter.ts linie 239-243,252,253), czyli czerwony na bazie, zielony po poprawce.
ZARZUTY: 1 ODDAL (helper wola combatUnitFromDef = jedno zrodlo; regex poszerzony w obronie r2, baza 7/6/7 trafien, kandydat 0; migracja sprawdza realny render adaptera). 2 ODDAL (czerwien na bazie zmierzona przeze mnie, jw.). 3 nie wymaga decyzji: zmiana Uderzenie->weaponDamage wynika z ABC nr 8=A; Bonus szarzy (unitExtraField) to osobny istniejacy rozjazd -> UWAGI. 4 ODDAL jako NIE_ZMIERZONO: brak zrzutu Chromium (chromium jest w srodowisku, pelny przebieg gra+karta nie wykonany w tej rundzie); zastepczo realny render DOM adaptera w tescie migracji 40/0 i Wojownik 4/4/22/2 w canon-tescie. Nie blokuje. 5 ODDAL: wikiBundle nie sprawdzony pod katem liczb PL, poza zakresem. 6 ODDAL: zgodne z domyslnym 0 silnika. Zadnego NAPRAW.
BLOKADY: brak
RUNDY: FC 1/5
UWAGI-DLA-ORKIESTRATORA: (a) potwierdz swiadomie zmiane widocznych wartosci (67/75 jednostek ma Uderzenie != weaponDamage); (b) 'Bonus szarzy' w cityPanel/unitAdapter nadal z unitExtraField/extra (silnik: chargeBonus) - osobny temat; (c) wikiBundle/Civpedia - sprawdzic liczby PL osobno; (d) przed deployem na ROBOCZA obejrzec karte Wojownika w grze (oczekiwane 4/4/22/2).
NASTEPNY KROK: integracja e917ad639 (+ ten raport) przez orkiestratora, deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO
