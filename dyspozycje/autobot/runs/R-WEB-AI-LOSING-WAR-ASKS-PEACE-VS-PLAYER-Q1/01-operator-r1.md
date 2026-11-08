STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-LOSING-WAR-ASKS-PEACE-VS-PLAYER-Q1
GOAL: ustalic z dowodem, czemu przegrywajaca AI (Harappa 3127 vs 46079, rw = 0,0635) nie prosi gracza o pokoj, i naprawic minimalnie bez zmiany progow.
ZMIANY/COMMIT: gra/src/main.ts (+1 galaz w lancuchu dispatchu AI->gracz), gra/tools/ai-losing-war-asks-peace-vs-player-test.cjs (nowy), ten raport. SHA: patrz `git log` galezi worktree (commit "R-WEB-AI-LOSING-WAR-ASKS-PEACE-VS-PLAYER-Q1 r1").
BLOKADY: brak. Weryfikacja w zywej grze (Chromium) NIE_ZMIERZONO w tej rundzie (zakaz npm run build w gra/); dowod = test zachowania ai.ts + test zrodla dispatchu z mutantem.

PRZYCZYNA (dowod plik:linia)
- ai.ts ok. 6735-6770 (N1a, R-WEB-PEACE-CITY-CESSION-Q1 r3): dla wojny z graczem, rw <= 0,15-0,01*(agr-5) (+ bonus zmeczenia), >= 3 miast (2 przy zmeczeniu) i miasta pokrywajacego cene, AI emituje `oferuj_miasto_za_pokoj` i robi `continue` -- komenda ZASTEPUJE trybut (priorytet 1) i `zaproponuj_pokoj` (priorytet 2).
- main.ts (lancuch `else if (targetId === 0)` po `dipCmds`, ok. l. 40352-40372) kierowal na stol negocjacji tylko: zaproponuj_pokoj, zadaj_trybut, oferuj_trybut_za_pokoj, sojusz, handel, umowa, handel_surowiec, pakt. `oferuj_miasto_za_pokoj` i `zada_miasto_za_pokoj` nie mialy galezi -> komenda ginela po cichu. Whitelist w enqueueNegotiationFromAiCmd (l. 19182) i mapowanie w diplomacy-proposals.ts (l. 2016) byly gotowe, ale nieosiagalne.
- Pomiar (scenariusz Harappa, rw 0,0635, Zaufanie 0, Respekt 29): od tury 3 wojny AI z >= 3 miastami emituje WYLACZNIE oferuj_miasto_za_pokoj (t3..t150, zloto 0 i 500); z 2 miastami: trybut (zloto>0) albo zaproponuj_pokoj. Czyli kazda przegrywajaca AI z >= 3 miastami jest "niema" wobec gracza.
- Bisect: f73db4cff (2026-10-31, CITY-CESSION r3) wprowadzil komende bez galezi dispatchu (diff main.ts tego commita: tylko etykiety + whitelist). Regres od tego commita; FALA WEARINESS (obnizony minMiast do 2, wyzszy prog rw) poszerzyla zasieg.

PYTANIA DISPATCHU
(1) Sciezka AI->gracz: decideAIDiplomacy (priorytety: miasto, trybut krytyczny rw<=0,25, zaproponuj_pokoj rw<=progPokojSlabosc lub sygnaly) -> main.ts dispatch -> enqueueNegotiationFromAiCmd. Zaufanie 0, Wrogi, Respekt 29 NIE blokuja (nie czytane w tych bramkach). Bramki: aiPeaceTimeOk (minTurWojny), !aiFeelsStronger, cooldown odrzuconej oferty (isOfferRejectedOnCooldown), dedup oczekujacej.
(2) Wojna epoki: w REJESTR-PROSB-I-ZADAN.md brak wpisu zakazujacego AI proszenia o pokoj w wojnie epoki lub wobec gracza (grep wojna epoki/ERAIGN/ERAMARCH x pokoj: 0 trafien); ERAIGN/ERAMARCH dotycza wypowiedzenia i marszu. Nie wymaga DECISION_REQUIRED. Czy ta wojna byla wymuszona wojna epoki: NIE_ZMIERZONO (brak zapisu gry).
(3) War weariness (runWarWearinessTick) liczy WYLACZNIE pary AI<->AI (war-weariness.ts "Pary AI↔AI", decyzja 2026-11-03: gracz bez zmian; pokoj z graczem decyduje gracz). Dla pary AI->gracz zmeczenie wchodzi tylko w ai.ts (warWearinessLevel -> bonus progu miasta/oferta) i dziala od ~100 tur (progChetnosci 0,5 przy pelneTur 200); nie ma wskaznika w UI. To zachowanie zgodne z decyzja, nie blad; zmiana (np. zmeczenie widoczne/wczesniejsze dla pary z graczem) = nowy prog -> pytanie ABC orkiestratora.
(4) Regres: tak, patrz bisect.

NAPRAWA
main.ts: galaz `else if (cmd.type === 'oferuj_miasto_za_pokoj' || cmd.type === 'zada_miasto_za_pokoj') enqueueDiplomacyPendingFromCmd(ownerId, cmd)`. Zadnych zmian progow, ai-params.json ani ai.ts.
Uwaga dla Evaluatora: sprawdzic w zywej grze, ze oferta miasta pojawia sie na stole i gracz moze ja przyjac/odrzucic (clampBasketItemsToAffordable przepuszcza pozycje 'miasto' domyslna galezia maxAffordableQty; trimProposalForZeroBalance nie dotyka koszyka bez zlota); zada_miasto_za_pokoj (silna AI zada miasta gracza) staje sie teraz rowniez osiagalne -- to zamierzone przez CITY-CESSION r3, ale zmienia zachowanie silnej AI wobec gracza (rw >= 0,7, >= 20 tur wojny) -- do wiadomosci orkiestratora.

TESTY
- node tools/ai-losing-war-asks-peace-vs-player-test.cjs: 12 PASS / 0 FAIL (w tym mutant usuniecia galezi wykryty)
- logic-test 213/213; ai-test 289/0; diplomacy-proposal-test 190/190 (mutacje 16/16); ai-war-nearest-city-peace-2t-test PASS; ai-war-weariness-peace-test PASS=90 FAIL=0; tsc --noEmit: 0 bledow.
- diplomacy-ai-forced-peace*: osobnego testu nie ma w tools (nazwa niedopasowana); pokrycie przez ai-war-nearest-city-peace-2t-test.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja przyczyny i diffu; ewentualnie dowod w Chromium), potem Obrona, Final Control.
DEPLOY/PUSH: NIE WYKONANO
