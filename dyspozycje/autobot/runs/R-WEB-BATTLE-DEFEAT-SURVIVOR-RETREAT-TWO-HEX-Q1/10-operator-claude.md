STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1
GOAL: ocalali przegranej armii cofaja sie o 2 heksy od zwyciezcy (nie znikaja), polegli usuwani; zachowane HP/doswiadczenie/general; AI i gracz identycznie; pole i oblezenie; brak trasy = opisany edge case bez kasacji/teleportu.
ZMIANY/COMMIT: baza 261e736de. Pliki (allowlista):
- gra/src/battle/battleScene.ts (3 miejsca eksportu wyniku: normalny koniec, sufit przewijania, natychmiastowy wynik _resolveInstant -> survivors = ocalali OBU stron, nie tylko zwyciezcy)
- gra/src/game/post-battle-map.ts (odwrot przegranych o 2 heksy; PostBattleMapResult += retreatedTwoHexIds, retreatNoTwoHexRouteIds)
- gra/tools/battle-defeat-survivor-retreat-two-hex-test.cjs (NOWY, 31 asercji, mutacja red->green)
- gra/tools/battle-defeat-survivor-retreat-browser-{entry.ts,entry.html,test.cjs} (NOWE, Chromium: pole + szturm oblezenia)
- gra/tools/battle-undeployed-units-test.cjs (1 asercja zmieniona, patrz ZALOZENIA)
SHA: patrz commit czubka (pole sha w StructuredOutput).

DIAGNOZA (przeczytany istniejacy kod, nie zgadywane):
1. KORZEN znikania: BattleScene konczyla bitwe eksportujac do mapy wylacznie ocalalych ZWYCIEZCY (`_battleUnitsForMapExport(winner roster)`; analogicznie sciezka przewijania i `_resolveInstant`). applyManualSurvivors usuwa kazda zalogowana jednostke spoza `survivors`, wiec rozbici/ocalali PRZEGRANEJ strony (HP>0, rout lub zlamana armia) znikali z mapy. Tylko remis eksportowal obie strony.
2. Odwrot na mapie byl 1-heksowy (fan-out 1..3 krokow, pierwszy wolny) dla obroncow po wygranej ATK, a atakujacy po przegranej wracali na heks startowy (1 heks od bitwy).
NAPRAWA:
- Eksport ocalalych obu stron (przegrani z HP>0 wracaja; polegli HP<=0 nadal nie).
- applyPostBattleMap: przegrani cofaja sie o DOKLADNIE 2 heksy od heksu bitwy (obroncy: kierunek pickRetreatTargetAwayFromAttacker x2 od swojego heksu; atakujacy: heks startowy + 1 krok dalej od bitwy). Stos (jednostki z tego samego heksu) cofa sie razem. Warunki legalnej trasy: heks posredni przechodni i bez obcych jednostek, cel przechodni, calkiem wolny, bez cudzego miasta; isPassableHex (main.ts retreatHexPassable) nadal wyklucza oblegane miasta. Gdy brak trasy 2-heksowej: DOTYCHCZASOWE zachowanie (obroncy: dawny fan-out 1..3 / zostaja; atakujacy: heks startowy), jednostka NIE jest kasowana ani teleportowana; id trafiaja do retreatNoTwoHexRouteIds.
- Ta sama funkcja obsluguje gracza i AI, reczna/AUTO/Skip, atakujacego/obronce, pole i szturm (wspolny applyPostBattleMap).

TESTY (surowe wyjscia):
- tsc --noEmit: czysto (0 bledow).
- battle-defeat-survivor-retreat-two-hex-test.cjs: 31 pass, 0 fail (przypadki: manual atk wygrywa/obronca wygrywa, AUTO lossPct z martwymi, woda na celu, woda na heksie posrednim, cel zajety, wrogi heks posredni, miasto zwyciezcy jako cel, oblegajacy z oblegaCityId zostaje, rezerwa poza logiem, save/load JSON, remis bez zmian, BattleScene._battleUnitsForMapExport).
- MUTACJA red->green: z bazowym post-battle-map.ts ten test = FAIL (d0 stoi 12,21 zamiast 2 heksy od bitwy; TypeError na braku retreatedTwoHexIds); po przywroceniu poprawki 31/0. UWAGA uczciwie: sam helper _battleUnitsForMapExport nie zmienil sie (poprawka jest w miejscach wywolania), wiec zmiane eksportu pokrywa test przegladarkowy ponizej, nie ten jednostkowy.
- Chromium (prawdziwy BattleScene 3D w headless chrome-1194 przez Vite HTTP, wynik -> prawdziwy applyPostBattleMap): `battle-defeat-survivor-retreat-browser-test.cjs` BROWSER PASS.
  * pole (Skip), winner=obronca: wyeksportowanych ocalalych 40, z czego przegranych 18; na mapie 18, wszystkie 2 heksy od heksu bitwy; 10 poleglych usunietych, 0 poleglych na mapie.
  * szturm oblezenia (Skip, mury), winner=atakujacy: ocalalych przegranych 25, wszystkie 25 na mapie, wszystkie 2 heksy; 3 polegle usuniete.
  * Przy slabych/rownych armiach oblezenie bez wylomu konczy sie REMIS (sufit 150 tur, ABC 2026-11-10) - remis nietkniety (fan-out 1 heks).
  * Brak bledow konsoli/pageerror. NIE zmierzono: pelnego przeplywu w main.ts (UI pre-battle -> Skip -> podsumowanie); harness podaje wynik sceny do applyPostBattleMap tym samym kontraktem, ale bez main.ts.
- Regresja (wszystkie 0 fail): post-battle-map 32/0, siege-defenders 12/0, auto-battle-loss-audit 52/0, city-militia-no-defenders 110/0, city-militia-no-population-loss PASS, city-militia-regen-cooldown 53/0, battle-dead-units-removed PASS, battle-skip-equals-auto-resolve 38/0, battle-skip-siege-parity 17/0, battle-siege-nearby-units-join 14/0, battle-cap-500 59/0, pre-battle-defender-retreat OK, retreat-garnizon-fortyfikacja 27/0, battle-roster 7/0, auto-battle-simultaneous 29/0, army-merge-separate-return 73/0, army-stack-limit 51 OK, auto-battle-active-roster-event 6/0, barb-city-behavior 178/0, barb-city-owner-contract 3/3, city-capture-pop-loss 29/0, city-limit-conquered 24/0, oblezenie-remis-endsiege 271/0, oblezenie-siege-lifted-po-bitwie 16/0, palisade-battle-wall-rules 55/0, siege-blockade-no-recruit-reinforce 57/0, wonder-transfer-on-conquest 43/0, battle-undeployed-units 35/0 (po zmianie 1 asercji).
- Czerwone IDENTYCZNIE na bazie 261e736de (porownane): mgla-sciezka-inwariant 41/1, okolica-ownership-change-reconcile 12/15 (3 fail), weterani-test 1 fail (dlug #191), pre-battle-retreat-exhausted-test 27/6 (straznik tekstowy main.ts - main.ts NIETKNIETY).

ZALOZENIA (luki rozstrzygniete w tej rundzie):
1. Rezerwa przegranego stosu (poza logiem zdarzen) nie ginie i cofa sie RAZEM ze stosem (zamiast zostac sama obok zwyciezcy). Przez to zmieniona jedna asercja w battle-undeployed-units-test.cjs: "rezerwa zostaje na hexie startowym" -> "rezerwa nie ginie, ten sam ID, pelne HP, cofa sie ze stosem o 2 heksy". Evaluator moze ocenic, czy chce wariant "rezerwa zostaje na starcie" (tanio odwracalne).
2. Oblegajacy z oblegaCityId przegrywajacy szturm zostaja na pozycji blokady (nie cofaja sie o 2) - zgodnie z zakazem zmiany ograniczen oblezenia/blokady.
3. Atakujacy, ktorego start nie sasiaduje z heksem bitwy, zachowuje dotychczasowe zachowanie (start).
4. Remis nie jest "przegrana" - bez zmian (fan-out 1 heks), ale ocalali obu stron sa teraz poprawnie eksportowani.

BLOKADY / DECYZJE DLA WLASCICIELA (nie rozstrzygane tu, bez audytu):
- wipeDefenderOnCityCenter: przy wygranej ATK nadal KASUJE cala zaloge na heksie miasta, rowniez ocalalych z HP>0 (zasada zdobycia miasta; dispatch wylacza "defeat last city elimination" bez audytu). Ocalali broniacy MIASTA nie cofaja sie wiec o 2 heksy - decyzja ABC: czy ocalali z centrum zdobytego miasta maja uciekac (wymaga audytu eliminacji ostatniego miasta).
- Odwrot atakujacego z pozycji blokady oblezenia (oblegaCityId) pozostaje bez 2-heksowego cofniecia (zalozenie 2).
- Dotychczasowy fallback (gdy brak trasy 2-heksowej) wciaz moze przeskoczyc nad zajetym heksem 1 do heksu 2 (dawna petla step 1..3) - nietkniete celowo.
- Zgloszone, nie naprawiane: isPassableHex z main.ts nie wyklucza cudzych NIEobleganych miast; nowa sciezka 2-heksowa sama je wyklucza, stary fallback nie.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (przejrzec zalozenia 1-2 i wipeDefenderOnCityCenter jako ABC), potem Obrona i Final Control.
DEPLOY/PUSH: NIE WYKONANO
