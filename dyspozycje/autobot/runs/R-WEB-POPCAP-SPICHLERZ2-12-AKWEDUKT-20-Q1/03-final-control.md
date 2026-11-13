STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-POPCAP-SPICHLERZ2-12-AKWEDUKT-20-Q1
GOAL: Drabinka limitu ludnosci 5 / Spichlerz I 8 / Spichlerz II 12 / Akwedukt 20.
ZMIANY/COMMIT: SHA do integracji df197a377692783cbc0ee15190b417058261e2f1 (baza c4a541a27; commity 339ae6f45, df197a377). Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri.
KOLEJNOSC: baza c4a541a27 jest przodkiem origin/main; origin/rust-port/parity-v2 (b520768b0) rozgalezia sie od f4c89d008. Integracja najpierw do main/ROBOCZA; parity-v2 dostaje zmiane dopiero przez REPIN (econ-params, city_population_cap) po wdrozeniu.

ZARZUTY (rozstrzygniecie):
1. Regresja growthmult-compound (clamp NaN): NAPRAWIONE w r2 (odporny clamp, Infinity gdy brak akweduktMaxLudnosci). Zweryfikowane: 17 pass / 7 fail = baza; 7 padajacych to asercje utrzymania/linear, bez 'growth triggered'. Zamkniete.
2. main.ts poza allowlista: ODDAL. Zmiana konieczna (2 wywolania cityPopulationCap), minimalna, jawnie zgloszona; wszystkie wywolania w src/ (cityPanel, v85, main x2) dostaja flage II. Zatwierdzenie/rozszerzenie allowlisty przy integracji nalezy do orkiestratora.
3. Pomiar balansu pelnej gry: ODDAL. NIE_ZMIERZONO (tylko proxy populationGrowth: Akwedukt + Spichlerz II daje pop 20 zamiast 12 po 100 turach). Orkiestrator decyduje o pelnym pomiarze albo jego pominieciu przed deployem.
4. Nieaktualne komentarze: NAPRAWIONE w r2 (cityPanel, society-breakdown, population-growth-tempo, ai). Pozostaje opis w society-params.json (pop 12 jako cap, mnoznik 1,48x) - tylko tekst, dlug do rejestracji.
5. wikiBundle 'limit 6': ODDAL, poza zakresem; osobny dlug tekstowy.

TESTY (samodzielnie, detached df197a377, gra/): tsc --noEmit EXIT=0; popcap-spichlerz2-akwedukt20 46/46; akwedukt-popcap 7/7; spichlerz-cap-citypanel-wiring 12/12; population-growth-v85 50/50; population-civ-matrix-wiring 122/122; growthmult-compound 17/7 (=baza); ai-granary-prog-populacji-spojnosc 12/12; empire-food-b5 34/34; pr141-population-behavior 24/24; auto-wyzywienie-live-recalc 42/42; spichlerz-hud-params-parity 66/66; autowyzywienie-rowny-wzrost 60/60; city-state-mp-growth 9/9. Pady identyczne przed/po (wg Evaluatora): spichlerz-wzrost, spichlerz-widocznosc, spichlerz-deficyt-scalenie, citizen-resource-upkeep. node_modules usuniety, git status czysty.
DIFF vs ALLOWLISTA: zgodny poza main.ts (pkt 2). ai.ts: tylko progi granaryPriorityBonus, bramki marszu/zbiorki nietkniete.
BLOKADY: brak.
RUNDY: FC po 2/5
NASTEPNY KROK: integracja orkiestratora (df197a377 na main), deploy po osobnej autoryzacji; REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
