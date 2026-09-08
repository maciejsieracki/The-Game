STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1
GOAL: portret gracza (atakującego) i przeciwnika wracają na ekranie „Wynik bitwy" — w tym
konkretnie dla wzorca „gracz jako ATAKUJĄCY vs miasto-państwo" wskazanego przez właściciela.

WERDYKT-REPRODUKCJA: TAK, ustalona PRAWDZIWA przyczyna — ale inna niż hipoteza dispatchu
(isCityState/civTypeForOwner dla gracza, ownerId 0, jest matematycznie zawsze `false`,
zweryfikowane; to NIE tam). Prawdziwa przyczyna: `gra/src/battle/mapFieldBattle.ts`
(`launchFieldBattleFromMap`/`summaryMeta()`) — JEDYNY kod obsługujący atak gracza na miasto
BEZ MURU (`field_battle`) — budował `summary` dla `applyMapBattleOutcomeWithSummary` BEZ 8
pól: `atkCivIconId/defCivIconId/atkIsCityState/defIsCityState/atkIsBarbarian/defIsBarbarian/
atkEra/defEra`. `buildCommanderCorner` (postBattleSummary.ts) ma `!civIconId` w TEJ SAMEJ
klauzuli co `isBarbarian`/`isCityState` — brakujący `civIconId` sam wystarcza, by
`portraitUrl=null`, a skoro obie flagi też `undefined` (falsy), ŻADNA z 3 gałęzi ikony się
nie trafia → generyczny `PB_SVG.commander` dla ATAKUJĄCEGO (gracz) I OBROŃCY jednocześnie —
dokładnie zgłoszenie właściciela. Trzy inne wywołania (main.ts: atak-pole, atak-przychodzący,
szturm z murem) mają te pola od `R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1`; TA gałąź (dodana tym
samym tematem, ale w OSOBNYM pliku poza jego allowlistą) została pominięta. Miasta-państwa
korelują z regresem silniej niż pełne cywilizacje, bo częściej są jeszcze bez muru, gdy
gracz je atakuje (idą `field_battle`, nie szturmem) — stąd wzorzec ze zgłoszenia; atak na
DOWOLNE miasto bez muru byłby dotknięty identycznie.

ZMIANY-COMMIT: `gra/src/battle/mapFieldBattle.ts` (dopisane 8 pól do typu `summary` w
`MapFieldBattleLaunchDeps.applyMapBattleOutcomeWithSummary` i do literału `summaryMeta()`,
przekazanie z już policzonego `pbInfo` — zero nowego liczenia); nowa bramka
`gra/tools/r-bitwa-portret-gracza-miasto-panstwo-otwarte-test.cjs`. UWAGA ZAKRESU: plik NIE
był w allowlistcie 00-dispatch.md (ta wymieniała tylko UI-pliki + 3 funkcje main.ts) —
dispatch nie znał istnienia tej równoległej ścieżki. Naprawiłem mimo to, bo to jedyne
miejsce prawdziwej przyczyny; FC/właściciel proszę ocenić czy to wymaga ECHO retroaktywnie.

TESTY: `tsc --noEmit` 0 błędów. 5 referencyjnych: 213/213, 19/19, 33/33, 13/13, 6/6.
Sąsiednia bramka `map-field-battle-test.cjs` 22/22 (bez regresji). Nowa bramka 14/14 —
importuje PRAWDZIWY, niezmodyfikowany `launchFieldBattleFromMap` (esbuild), symuluje klik
„Auto" i CHWYTA realny `summary`: PO (dysk) — wszystkie 8 pól zdefiniowane poprawnie
(atkIsCityState=false, defIsCityState=true, oba civIconId/era ustawione); PRZED (mutacja
zawartości pliku na stan sprzed naprawy, zbudowana, zmierzona, PRZYWRÓCONA bit-w-bit,
`git diff` czysty po) — wszystkie 8 pól `undefined`, różne od PO (nietautologiczność).

DOWOD-CHROMIUM: żywy, realny świat (`__aiBuildingsTestDebug.startNewGame`+
`__cityStateStartUnitsTestDebug.foundPlayerStartCity`, seed 778899, 8 miast-państw), realny
klon jednostki gracza (`__rebelProtectionTestDebug.captureViaBattle` — realny silnik, nie
mock), realny klik+marsz+`Wypowiedz wojnę`+Auto → REALNY ekran „Wynik bitwy" ze zrzutem
(`after-auto-resolve.png`, oba medaliony poprawne). NIE mam jednak pewności, że TA konkretna
złapana bitwa faktycznie przeszła przez buggy `launchFieldBattleFromMap` (role
atakujący/obrońca w UI wyszły odwrotnie niż oczekiwałem — możliwe, że AI zaatakowało jako
pierwsze w tej samej turze, inną, poprawną ścieżką main.ts) — NIE twierdzę więc, że to jest
żywy zrzut PRZED/PO buga; dowodem buga jest wyłącznie test node wyżej (real, nie
reimplementacja). Wielogodzinne próby precyzyjnego wymuszenia klik-gracza-pierwszy (bez
wyścigu z turą AI) na losowym świecie nie dały deterministycznego zrzutu w tej rundzie.

BLOKADY: (1) scenariusz „AI/miasto-państwo atakuje, gracz broni" (luka zgłoszona przez
Evaluatora R1) — nie ma dziś deterministycznego sandboksu wymuszającego agresję AI na
żądanie; zbudowanie go (nowy hak testowy w stylu `forceBronzeForcedWarOnPlayer`) to nowa
infrastruktura, koszt rzędu osobnej rundy, poza allowlistą main.ts tego dispatchu — zostawiam
jako blokadę, nie zgaduję kosztu w powietrzu: wymaga ECHO na rozszerzenie allowlisty main.ts.
(2) Punkt „ZMIANY-COMMIT" wyżej — plik poza pierwotną allowlistą.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator ocenia: (a) czy naprawa mapFieldBattle.ts mimo scope-gap jest do
przyjęcia, (b) czy dowód node (real function, PRZED/PO, nietautologiczny) wystarcza obok
niepewnego zrzutu Chromium, (c) decyzję o blokadzie 1.
DEPLOY/PUSH: NIE WYKONANO
