STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1
GOAL: ocalali przegranej armii cofaja sie o 2 heksy od zwyciezcy (nie znikaja), polegli usuwani; HP/doswiadczenie/general zachowane; pole i oblezenie; brak trasy = opisany edge case bez kasacji/teleportu.
ZMIANY/COMMIT: start fc6ba2985 (baza 261e736de). Zmienione: gra/src/game/post-battle-map.ts (zarzut 3), gra/tools/battle-defeat-survivor-retreat-two-hex-test.cjs (39 asercji), gra/tools/battle-defeat-survivor-retreat-browser-{entry.ts,test.cjs} (tryby instant/cap), gra/tools/battle-undeployed-units-test.cjs (wciecie). SHA koncowy: patrz commit czubka (pole sha).

ODPOWIEDZI NA ZARZUTY
1. ODRZUCAM (w tej rundzie; decyzja ABC dla orkiestratora/wlasciciela). Dispatch: "Not ... defeat last city elimination without audit"; wipeDefenderOnCityCenter to istniejaca zasada zdobycia miasta (post-battle-map.ts:198), pokryta siege-defenders 12/0 i post-battle-map 32/0. Zmiana wymaga audytu eliminacji ostatniego miasta. Dowod ze luka jest swiadoma i przypieta: nowy test 12 (garnizon na centrum kasowany, obronca poza centrum cofa sie o 2). ABC: czy ocalali z centrum zdobytego miasta maja uciekac.
2. PRZYJMUJE CZESCIOWO. Dodano testy z realna geometria w tests jednostkowym: test 12 (cities + cityOnBattleHex + oblegaCityId, szturm wygrany), test 13 (cudze miasto nie jest celem odwrotu przegranych atakujacych). 39/0. Harness Chromium nadal uzywa sztucznego swiata (isPassableHex=()=>true, brak cityOnBattleHex) -- NIE zmieniony: umieszczenie garnizonu na centrum skasowaloby go zgodnie z zarzutem 1, a retreatHexPassable zyje w main.ts (poza allowlista). Przeplyw przez main.ts i save-load na plikach zapisu: NIE_ZMIERZONO (JSON round-trip w tescie 10 bez zmian).
3. PRZYJMUJE. post-battle-map.ts retreatAtkRosterToStart: oblegaCityId -> twoHex.noRoute.push(id) przed continue. Dowod: test 8 dopisana asercja `retreatNoTwoHexRouteIds.includes('a0')` -> 39/0.
4. ODRZUCAM zmiane kontraktu, PRZYJMUJE formalna czesc. Rezerwa jest czescia stosu przegranych (ten sam heks); zostawienie jej samej na heksie startowym (1 heks od zwyciezcy, atak z rozdzielonym stosem) przeczy GOAL "cofnij o 2 od zwyciezcy"; nie ginie, to jest sedno UNDEPLOYED-UNITS-LOST (HP, ID, brak kasacji sprawdzane nadal). Poprawiono wciecie/komentarz asercji; 35/0. Wymaga potwierdzenia Final Control; odwrocenie jest tanie (asercja u.q===10).
5. ODRZUCAM. Dispatch: brak legalnej trasy 2 heksow = istniejace zachowanie + opis, bez zmyslania balansu. Fallback celowo nietkniety; zachowanie jest opisane w retreatNoTwoHexRouteIds i pokryte testami 4,5,6,7,13 (brak kasacji, brak wejscia na zajety/wrogi/nieprzechodni heks posredni w scenariuszach sprawdzanych). Skok nad zajetym heksem 1 w starym fallbacku pozostaje znanym dlugiem (do ABC).
6. PRZYJMUJE. Dodano tryb Chromium `instant` (wywoluje prawdziwe BattleScene._skipInstantFallback -> computeInstantResult -> applyPostBattleMap). Wynik: BROWSER PASS, 0 bledow konsoli. UCZCIWIE: w tym przebiegu rachunek natychmiastowy wybil cala strone przegrana (loserSurvivorsExported=0, loserDead=28), wiec sciezka eksportu ocalalych przegranych nie jest tu odroznialna od bazy -- dowod tylko ze ścieżka dziala bez bledow i bez poleglych na mapie (gdy ocalali istnieja, wymagane 2 heksy). computeInstantResult nie jest eksportowany; nie dodawano exportu poza allowlista.
7. PRZYJMUJE. Dodano tryb Chromium `cap` (wymuszony werdykt sufitu `_roundCapVerdict` -> prawdziwe _ffRoundCapResult). Wynik: winner=atakujacy, loserSurvivorsExported=28, loserOnMap=28, wszystkie dystanse 2, loserDeadStillOnMap=0. Przed poprawka (baza battleScene.ts) ta galaz eksportowala tylko zwyciezce -- przegrani znikali. Werdykt wymuszony mockiem (_roundCapVerdict), nie naturalny sufit 150 tur.

TESTY (surowe wyjscia, po zmianach):
- tsc --noEmit: 0 linii bledow.
- battle-defeat-survivor-retreat-two-hex-test.cjs: 39 pass, 0 fail.
- battle-defeat-survivor-retreat-browser-test.cjs: BROWSER PASS (field/skip dystanse 2 x15, siege/skip x25, field/instant, field/cap x28; errors: []).
- battle-undeployed-units 35/0, post-battle-map 32/0, siege-defenders 12/0, battle-dead-units-removed PASS, oblezenie-siege-lifted-po-bitwie 16/0.
- Nie powtarzano pelnej listy bramek referencyjnych (zmiana w tej rundzie: 1 linia produkcyjna w post-battle-map.ts + testy); NIE_ZMIERZONO: battle-skip-equals-auto-resolve (>120 s u Evaluatora), pre-battle-retreat-exhausted 27/6 (dlug bazowy wg Operatora, tekst main.ts).
BLOKADY: ABC: ocalali z centrum zdobytego miasta (zarzut 1); skok fallbacku nad zajetym heksem (5); wariant rezerwy (4).
RUNDY: 1/5 (obrona po r1 Evaluatora)
NASTEPNY KROK: Final Control (zalozenie rezerwy, zarzut 1 jako ABC).
DEPLOY/PUSH: NIE WYKONANO
