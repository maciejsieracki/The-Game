STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1
GOAL: zuzycie zywnosci armii i ulamek atrycji glodu wg trudnosci wlasciciela (miasto-panstwo -> cityStateDifficulty, gracz/AI -> menu).
ZMIANY/COMMIT: kod do integracji = 183fd5d19 (rodzic 0b0a4b8d4, kod r1 04fc798fd, baza 8dad78b3a). merge-base --is-ancestor: 8dad78b3a i 04fc798fd sa przodkami 183fd5d19. Allowlista: gra/src/game/turn-economy.ts, gra/src/main.ts, gra/tools/citystate-army-food-difficulty-test.cjs, runs/<ID>/01,02 (+03). empire-food.ts i WERSJE.md nietkniete. git diff --check czysty.
TESTY (wlasne, na 183fd5d19, npm ci --ignore-scripts, bez build/dev): tsc 0; logic-test 213/213; ai-test 289/0; citystate-army-food-difficulty-test 29/0; upkeep-difficulty-per-owner 19/0; army-hunger-combat 13/0; auto-wyzywienie-kosztarmii-kryterium 18/0; empire-food-b5 34/0; glod-wojska-karencja 29/10 (dlug sprzed zmiany, identyczny na bazie, poza bramkami).
ROZSTRZYGNIECIE ZARZUTOW: 1 (oblezenie N3, main.ts ~37174) NAPRAWIONE: ulamek per miasto wg effectiveGameDifficultyForOwner(oblCity.ownerId). 2 (karta jednostki 6619, prognoza 16733, provider panelu 33220) NAPRAWIONE wg wlasciciela; brak aktywnego miasta -> menu. 3 (brak testu podpiecia) NAPRAWIONE czesciowo: sekcja H = skan zrodla (nie wykonanie boot()). 4 dlug karencja: ODDAL (notatka).
UWAGI: pozostale odczyty buildEmpireFoodParams z _menuDifficulty (HUD gracza, racje, etykieta, wzrost) dotycza gracza/menu lub nie sa zuzyciem armii/atrycja - zgodnie z zalozeniem Obrony. NIE_ZMIERZONO: test wizualny w przegladarce, wykonanie boot(), build/dev (zakazane).
BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora: merge do main; kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (gra/ vs rust-port/), najpierw main i deploy ROBOCZA, REPIN ekonomii Rust po nim.
DEPLOY/PUSH: NIE WYKONANO
