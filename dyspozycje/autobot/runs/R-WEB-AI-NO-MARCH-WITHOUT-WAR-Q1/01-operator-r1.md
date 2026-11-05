STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-NO-MARCH-WITHOUT-WAR-Q1
GOAL: AI (cywilizacje i panstwa-miasta) nie wybiera celu ofensywnego, nie zbiera armii pod cel i nie rusza marszem na podmiot X bez faktycznego stanu wojny z X.
RUNDY: 1/5

## Pomiar PRZED (plik:linia, baza origin/main 95731af6a)
- Relacja pary to JEDEN wpis `diplomacyRelations` pod nieuporzadkowanym kluczem `a<b ? a_b : b_a` (main.ts getDiploRelation ~9289, setDiploRelation ~10363). Stan "wojna po jednej stronie" w danych NIE istnieje; wypowiedzenie (ownerDeclareWarOn 12015, petla dipCmds ~39100, processDiploCrisisQueue) zapisuje relacje atomowo w jednym `setDiploRelation`. Roznice gracz<->AI / AI<->AI / panstwo-miasto: te same funkcje, ten sam zapis.
- Bramka `canEngageOwner` (main.ts ~38208: barbarzynca lub status 'wojna') filtruje `engageableEnemyUnits/Cities` w ai.ts 3557-3558, wiec zwykly marsz/atak (ai.ts 4192 `citiesForMarch`) jest bramkowany; warAllIn (main.ts 32470) i kampania wodza (prepareAiGeneralWarCampaign, main.ts 7129, targetOwners tylko status 'wojna') tez sa filtrowane przy budowie.
- LUKA (ZMIERZONA, RED): dyrektywa wojny wymuszonej epoki. main.ts ~38165 budowala `forcedWarDirective` z rejestrow `bronze/stone/ironForceWarActiveByPairKey` BEZ sprawdzenia relacji, a ai.ts 3686-3688 brala `forcedWarTargetCities = cities.filter(owner == target)` (wszystkie miasta celu, bez `aiCanEngageOwner`), po czym `citiesForMarch`/`forcedWarTargetCity`/fale (ai.ts 4014-4200) prowadzily marsz na te miasta. Sondowanie `decideAITurn` z `canEngageOwner: o => o !== 2` + `forcedWar{attacker->2}`: 4 jednostki maszeruja pod mur i jedna wchodzi na heks miasta celu (8,6) bez wojny. Rejestr jest sprzatany tylko w `finalizePeaceTreatyBetween` (10838) i eliminateOwner; wpis zostaje przy innej drodze wyjscia z wojny (np. zapis wczytany, wojna zakonczona sciezka bez cleanupu) -> napastnik dalej maszeruje "po cichu", a pozniejsze (ponowne) wypowiedzenie daje kolejna wojne i szturm. Spojne ze zgloszeniem wlasciciela (marsz bez wojny, potem nagle wypowiedzenie).
- Nie znaleziono sciezki, w ktorej wypowiedzenie jest cofane/nadpisywane przez tick: tickDiplomacy zachowuje status (`atWar ? 'wojna' : slimStatus`), AI-tick pary gracz<->AI zapisuje `{...rel}` w tej samej funkcji bez odroczonego nadpisu statusu.

## Zmiany (allowlista)
- gra/src/game/ai.ts: (1) `forcedWarAttack` wymaga `aiCanEngageOwner(opts, forcedWar.targetOwnerId)` (marsz/zbiorka/fale wojny wymuszonej tylko przy faktycznej wojnie; inaczej zwykle zachowanie, ktore samo jest bramkowane). (2) wejscie w kampanie wodza: `if (!aiCanEngageOwner(opts, campaign.target.ownerId)) return false;` (zbiorka recruiting/gathering i marsz attacking tylko przy wojnie; obrona w ramach wspolnej bramki).
- gra/src/main.ts (tylko relacje/wypowiedzenie): przed zbudowaniem `forcedWarDirective` sprzatanie nieaktualnych wpisow rejestrow wojny wymuszonej (para bez status 'wojna') razem z `forcedWarWavesByPairKey` -> marsz przerwany takze dla armii juz w drodze (nastepna decyzja AI nie ma dyrektywy), a stary wpis nie wskrzesza sie przy pozniejszej zwyklej wojnie.
- gra/tools/ai-no-march-without-war-q1-test.cjs (NOWY, 10 asercji).
- Bez zmian balansu; bez zmian w ai-general-war-campaign.ts, ai-march-guard.ts, army-concentration.ts (nie wymagaly).

## TESTY (gra/, node; node_modules z `npm ci --ignore-scripts`)
- Nowy test: PASS 10 (gate-ai-no-march-test.txt, EXIT=0). RED przed poprawka (sondowanie powyzej), GREEN po. K+ (w wojnie napastnik maszeruje, kampania zmienia decyzje) - harness czuly. Przypadki: dyrektywa bez wojny, wojna->pokoj w kolejnej turze (marsz przerwany), rola defender, kampania recruiting/gathering/attacking, symetria klucza pary.
- Mutacje: usuniecie bramki forcedWar w ai.ts -> test pada (zabita); usuniecie bramki kampanii -> zabita tylko strazniczym testem statycznym (kampania w attacking i tak nie maszerowala w scenariuszu; zachowanie behawioralne tej galezi: czesciowo).
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Regresje (125 plikow wg listy dispatchu, 2 rownolegle, timeout 100 s; gate-regresje-po.txt): padaja 14: ai-test (274/20, bez zmian), ai-march-avoid-foreign-territory, barb-camp-destruction, 5x diplomacy-*, siege-blockade-no-recruit-reinforce i siege-tower-breach-everywhere (timeout), forced-war-bronze-main-guard, forced-war-bronze-new-game-reset, forced-war-iron-main-guard, war-allin-capital. Zbior = zbior z R-WEB-AI-NO-SIEGE-WITHOUT-WAR-Q1 (10) + 4 pliki spoza tamtego zakresu; te 4 zmierzone na czystym origin/main: padaja identycznie (te same komunikaty PRZED = PO, diff pusty). Pozostalych 10 PRZED nie mierzylem w tej rundzie (opieram sie na liscie z poprzedniego tematu): PRZED=PO dla nich NIE_ZMIERZONO tutaj.
- Uwaga proces: uruchomienie suity zapisuje artefakty do dyspozycje/** (png, R-WEB-WAR-ALLIN-CAPITAL-Q1/); przywrocono `git checkout -- dyspozycje` + usunieto nieznane pliki; w commicie tylko allowlista.

## NIE_ZMIERZONO
- Odtworzenie w realnym endTurn (Chromium, >=3 ziarna x >=100 tur, mgla OFF), metryki marszu/relacji przed-po, determinizm AI w pelnej grze, czas decyzji AI: NIE_ZMIERZONO (swiat w Chromium tworzy sie >8 min; brak budzetu 590 s/wywolanie x 3 ziarna). Zastapione testami na prawdziwym `decideAITurn` i strazniczymi.
- Ktora konkretnie sciezka wyjscia z wojny zostawila wpis rejestru w grze wlasciciela: NIE_ZMIERZONO (brak zapisu gry). Fix dziala niezaleznie od sciezki.

## BLOKADY
Brak blokady technicznej. Decyzja produktowa (opcjonalna) do ABC orkiestratora: (A) obecne - brak wojny = brak marszu, AI wypowiada wedlug istniejacych regul i maszeruje dopiero po zapisie wojny (w tej samej turze mozliwe, bo dipCmds przed ruchem); (B) dodatkowo wymuszac minimum 1 tura miedzy wypowiedzeniem a pierwszym krokiem marszu; (C) jak A + okno ostrzezenia dla gracza. Rekomendacja A (zero zmiany balansu).
Kandydat na zmiane poza allowlista: dokladne zrodlo niespojnosci karty "Wojny:" (kontakt) - bez zmian.

NASTEPNY KROK: Evaluator R1 (+ ewentualnie zamkniecie luki pomiaru Chromium na jego budzecie).
DEPLOY/PUSH: NIE WYKONANO
