STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-PLAYER-PARITY-FIXES-Q1
GOAL: Naprawić asymetrie AI vs gracz (seed suwaków T1, podłoga skarbca w dyplomacji, trudność miast-państw w zakupie, martwy fallback ownerId===0), bez ruszania armii AI / progu zakupu / ai_rush_jednostka_rezerwa_zlota.
ZMIANY/COMMIT: SHA commitu kodu w pierwszej linii odpowiedzi Operatora (ten plik jest w tym samym commicie). Baza: origin/main 59868d84f (zawiera AI-PURCHASE-MAINTENANCE-RESERVE, N10 i ARMY-STACK-LIMIT). Pliki: gra/src/game/ai.ts, gra/src/game/turn-economy.ts, gra/src/main.ts, nowy gra/tools/ai-player-parity-fixes-test.cjs, ten katalog. ai-params.json bez zmian.

POPRAWKI (założenia opisane tu, bo dispatch zostawił wybór):
1. Seed. Dawny seed AI `{...DEFAULT_PODZIAL_HANDLU, procentNauka:60}` = Nauka 60 / Skarb 60 / Zamożność 20 = 140%. normalizePodzialHandlu po cichu zamieniało to w T1 na 40/60/0, a od T2 (po pierwszej korekcie decideAIEconomySliders) AI miało 60/20/20. Nowy `aiSeedPodzialHandlu()` (ai.ts): Nauka 60 (polityka AI), Zamożność 20 (jak domyślny podział gracza, próg utrzymania poziomu), Skarb = reszta = 20. Wybór: dokładnie ten podział, do którego AI i tak dochodzi w T2, więc T1 jest spójna z T2+. Gracz bez zmian (20/60/20). Użyte w 4 miejscach seedu main.ts. Wymagana towarzysząca zmiana: baza pierwszej korekty suwaków (`sliderSt.procentNauka`) czytana z faktycznego seeda ownera zamiast stałej gracza 20 — bez niej nowy seed dałby przy pierwszej korekcie Skarb 0 / Zamożność 40.
2. Dyplomacja. Podłoga `Math.max(0,…)` w `buildDiploTreasury().add` usunięta (jedna reguła dla gracza i AI). To NIE było zabezpieczenie przed bankructwem: każdy przelew (applyOneShotGoldTransfer, tick trybutu) najpierw sprawdza `saldo płatnika >= kwota`, więc ani gracz, ani AI nie oddadzą więcej niż mają (test potwierdza dla obu). Podłoga działała tylko na ODBIORCĘ AI z długiem (deficyt Złota): każdy dar kasował mu dług (-30+10=0, gracz: -20). Bankowanie tury celowo nie podłogowuje (komentarz R-DEFICYT-ZLOTA-KARA-Q1), więc to było niespójne. Brak podstaw do DECISION_REQUIRED.
3. Miasta-państwa. `purchaseRecruitmentUnit` budowało pozycję z globalnym `_menuDifficulty`, a kolejka produkcji AI, availableProduction i unitCost zastępowania — z `effectiveGameDifficultyForOwner` (trudność miast-państw). Teraz zakup oraz oba konteksty zastępowania (replaceAvailabilityCtx…) używają trudności właściciela; dla gracza wartość bez zmian. Przykład: gra Easy, miasto-państwo, Wojownik = 10 (globalna) vs 5 (właściciel). Uwaga: koszt faktycznie pobierany przy zakupie AI i tak pochodził od wołającego (item.koszt z kolejki), więc wpływ jest głównie na spójność pozycji i ścieżki zastępowania.
4. Fallback epoki. Dowód: wszystkie wywołania advanceCityEconomy/previewCityEconomy w main.ts podają resolveOwnerEra (test statyczny), więc w grze gałąź jest martwa. NIE usunięta: żyje w harnessach tools/*-test.cjs bez resolvera (usunięcie = zmiana sygnatur + ok. 20 testów poza allowlistą). Uzasadnienie: 12 literałów zastąpionych jednym `legacyEraForOwner` z komentarzem (w tym ostrzeżenie: dla ownera != 0, także drugiego człowieka w hot-seat, zwraca epokę 1 — nowy kod ma zawsze przekazywać resolver).
5. Nie ruszono: armia AI, próg zakupu, ai_rush_jednostka_rezerwa_zlota.

POMIAR dochodu AI T1–T10 (realny advanceCityEconomy, 1 miasto AI, seed mapy 9191; T2+ = stan 60/20/20 w obu wariantach — to założenie wyliczone z kodu korekty, nie pomiar silnikiem pętli AI):
T1 przed→po: Skarb 7,00→2,00; Nauka 4,00→7,00; Zamożność 0,00→2,00. T2–T10: 2/7/2 identycznie. Suma T1–T10: Skarb 25→20 (−5 jednorazowo w T1), Nauka 67→70. Skutek: AI traci jednorazowo ok. 5 złota na miasto w T1 (T1 zgodna z własną polityką), nic w T2+.

TESTY:
- Nowy ai-player-parity-fixes-test.cjs: 42/42 po poprawce (w tym 1 asercja sumy epok); na bazie (src cofnięte) 12 FAIL — każda poprawka pada na bazie.
- logic-test 213/213; tsc --noEmit czysto; ai-test 274 passed / 20 failed, lista porażek identyczna z bazą (diff pusty).
- Pomocniczo: ai-nauka-podzial-tura1-seed-test 8/8, ai-slider-test 46/46, ai-purchase-maintenance-reserve-test 44/44, adjust-handel-split-suma-test 46/46.
- Nie wykonano pomiaru live w Chromium; liczby dochodu T1–10 pochodzą z silnika ekonomii, nie z pełnej gry.
BLOKADY: brak. Uwaga poboczna (poza zakresem, nie ruszona): tick ekonomii liczy utrzymanie miast-państw na globalnym `_menuDifficulty` (main.ts ok. 36710), a podgląd utrzymania AI na trudności właściciela — możliwy kolejny temat.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) r1, potem Obrona (Haiku), Final Control.
DEPLOY/PUSH: NIE WYKONANO
