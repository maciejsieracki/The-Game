STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ekonomia miast-panstw i AI
TEMAT: R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1
GOAL: utrzymanie (budynki + jednostki) w upkeepByOwner wg poziomu trudnosci wlasciciela; miasto-panstwo wg cityStateDifficulty, AI civ i gracz wg menu; liczby bez zmian.
ZMIANY-COMMIT: kod 43c524b55, raport 332635bd0, obrona ab87e76be (SHA do integracji, plus commit FC z tym plikiem). Baza = origin/main 9733ea8b0 (merge-base, origin/main nie ruszyl). Diff do allowlisty: turn-economy.ts (odstepstwo jawne), main.ts (3 linie, wywolanie), nowy upkeep-difficulty-per-owner-test.cjs, katalog runu. Zero zmian gra/data, rust-port, gra-robocza, WERSJE.md.
TESTY (wlasne, na ab87e76be): nowy test 19/0; logic-test 213/213; ai-test 289/0; tsc --noEmit exit 0. node_modules usuniete.
ZARZUTY:
- Z1 allowlista turn-economy.ts: ODDAL (konieczne, advanceCityEconomy tylko tam; orkiestrator akceptuje przy integracji).
- Z2 efekt liczbowy zerowy: ODDAL (dane; decyzja balansu = ABC wlasciciela).
- Z3 AI civ bez suwaka: ODDAL (dispatch: uzyj istniejacych mechanizmow; AI civ = menu).
- Z4 main.ts:36721 (zywnosc armii miast-panstw, empire-food.ts, poza allowlista): ODDAL jako dlug R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1 (DO DECYZJI: czy w zakresie, ABC).
- Z5 praca per owner: ODDAL (dlug, poza zakresem).
- Z6 NIE_ZMIERZONO przegladarka/100 tur: ODDAL (dispatch nie wymagal).
Zadne NAPRAW -> PASS.
BLOKADY: brak blokujacych. Uwagi: zerowy efekt PM; luka 36721; praca globalna.
RUNDY: 1/5
KOLEJNOSC wzgledem origin/rust-port/parity-v2 (707b50c41): niezalezne (zmiany tylko w gra/, brak rust-port); integracja do main przed lub po, bez konfliktu plikowego.
NASTEPNY KROK: integracja orkiestratora (merge do main), ABC: wartosci utrzymania per poziom + zakres zywnosci armii.
DEPLOY/PUSH: NIE WYKONANO
