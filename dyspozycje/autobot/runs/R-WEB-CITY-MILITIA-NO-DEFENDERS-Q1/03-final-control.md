STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1
GOAL: Milicja miasta wg specyfikacji wlasciciela z 2026-11-03 (M1-M5).
ZMIANY/COMMIT: SHA do integracji = 5605d38ff (baza 95a5f267a / kod 3853015fc); plus commit tego raportu (patrz nizej).
TESTY (odtworzone samodzielnie na 5605d38ff):
- tsc --noEmit EXIT=0
- city-militia-no-defenders-test 113 OK / 0 FAIL (10 mutacji lamie test)
- map-field-battle 24/0, militia-garrison-contract 17/0, militia-garrison-router-siege 8/0, siege-defenders 12/0
- barb-city-capture-cluster: 3 FAIL (1d x2, 1f) -- te same 3 na bazie 3853015fc~1 (preexisting)
- budynek-garnizon-test: blad builda esbuild/kotwica ai.ts infraOrder -- identyczny na bazie 3853015fc~1 (preexisting)
- git diff --check czysty; w diffie brak gra-robocza/**, WERSJE.md, rust-port/**
Werdykt zarzutow rundy 1:
1 barbarzyncy -- NAPRAWIONE w R2 (canBarbarianWalkIntoEmptyCity + defenderOptions, main.ts), test + mutacja.
2 ODDAL: makeMilitia/effectiveGarrison/resolveSiegeAttack/estimateDefenderStrength nie sa wolane z main.ts (tylko typy); model zbiorczy zostaje, ZALOZENIE udokumentowane i przypiete testem.
3 ODDAL: ujawnione wyjscia poza allowliste (mapFieldBattle.ts +1 linia ownerEra, main.ts straty ludnosci, barbarians.ts) uzasadnione i konieczne; allowlista przyjeta retroaktywnie.
4 NAPRAWIONE w R2: fallenMilitiaIds z semantyka post-battle-map (czesciowy log nie zakada smierci), rozklad strat per-jednostka tak jak applyAutoLosses (zweryfikowane czytaniem kodu); integracja main.ts bez testu -- NIE_ZMIERZONO (main.ts nietestowalny).
5 NAPRAWIONE w R2: sprzecznosci w PROJEKT-GRY-master.md 9c usuniete.
6 ODDAL (NIE_ZMIERZONO): pomiar pelnej gry/3D przy 60 jednostkach i wizualna weryfikacja wymagaja builda (zakaz w dispatchu). Oznaczenie "Milicja" na pojedynczych modelach nie zmienione (nazwa=typeId jest kluczem snapshotow/replay, battleScene.ts:5374); strona obroncow ma tytul "Milicja (N)".
BLOKADY: brak blokujacych. NOTATKI do integracji/nastepnego tematu: (a) weryfikacja wizualna w przegladarce po deployu robocza, (b) ewentualne oznaczenie modeli milicji (osobny temat, bez zmiany typeId), (c) 2 testy preexisting do osobnych tematow.
RUNDY: 2/5 (FC)
NASTEPNY KROK: integracja orkiestratora. Kolejnosc: najpierw rebase/merge 5605d38ff + ten raport na origin/main; origin/rust-port/parity-v2 (e1c040160) jest niezalezne (gra/ vs rust-port/, brak wspolnych plikow w diffie), integracja nie koliduje -- dowolna kolejnosc, zalecane main przed parity-v2. Nastepny temat sekwencyjnie: R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 (te same pliki oblezenia, po integracji).
DEPLOY/PUSH: NIE WYKONANO
