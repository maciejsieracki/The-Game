STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1
GOAL: (A) cel ataku AI w wojnie z AI = najblizsze miasto wroga; (B) pokoj AI<->AI wymuszony po 2 turach od prosby, z cena (przegrany placi); (C) AI zajmuja miasta AI.

ZMIANY/COMMIT: a5bb11156 (baza ae292911f = origin/main >= 57a7ada40). Pliki:
- NOWE gra/src/game/ai-war-target-select.ts (A: AI->AI cele = wszystkie miasta wroga z polem `defenders`; gracz i barbarzynca-atakujacy: tylko stolica),
- NOWE gra/src/game/diplomacy-ai-forced-peace.ts (B: licznik prosby, uprawnienie pary, plan platnosci zloto->surowce->cesja 1 miasta, bilans zwyciezcy, decyzja wait/accept_paid/force),
- gra/src/game/warAllInCapital.ts (pole `defenders` + remis: slabiej broniowane, potem nizsze id; bez pola = stary porzadek),
- gra/src/game/diplomacy-siege-war-gate.ts (`aiAutoSiegeAllowed`),
- gra/src/main.ts (cele przez buildWarCityTargets; rejestracja prosby AI->AI; `tickAiAiPeaceRequests`; zapis/wczytanie/czyszczenie rejestru prosb; auto-oblezenie AI-AI),
- gra/data/ai-params.json (klucz `tury_do_pokoju_po_prosbie` = 2, z opisem),
- NOWY gra/tools/ai-war-nearest-city-peace-2t-test.cjs, logi gate-*.txt, harness sim-harness-*.cjs.
Nie ruszono: gra-robocza/**, WERSJE.md, rust-port/**, PEACE_TREATY_LOCK_TURNS, regul wypowiadania wojny/kar/zajmowania miast gracza.

STAN ZASTANY (kod bazy, plik:linia, main.ts bazy):
1. Cel ataku: main.ts:31809 (`warAllInContextFor`) dawal wylacznie STOLICE wrogow; planer warAllInCapital.ts:414 `nearestTarget` wybiera najblizszy z listy.
2. PRZYCZYNA GLOWNA braku zajec: main.ts:16298 `scanAutoSiegesAfterAiTurn` -> `city.ownerId !== 0 => continue`: auto-oblezenie (jedyna droga do szturmu na miasto z murem) tylko dla miast GRACZA. Wejscie na heks obcego miasta z murem zablokowane (city-hex-movement.ts:61, `canAiEnterEmptyEnemyCity`), z obroncami (:60). Obwarowane miasta AI byly wiec nie do zdobycia dla AI.
3. Pokoj AI<->AI: komendy `zaproponuj_pokoj`/`oferuj_trybut_za_pokoj` do innej AI byly GUBIONE (main.ts:38293 petla komend obsluguje wobec nie-gracza tylko wojne i handel surowcami). Jedyna droga: auto-pokoj po 2 zdobytych miastach (main.ts:32499, `maybeResolveRegularWarOnCityCapture`, wolane z :16010 i :32590) -- przy 2. wniosku (C) = zeru zajec, wojny AI<->AI praktycznie nie konczyly sie pokojem.
4. Wojny wymuszone epok: wylaczone z pokoju po prosbie (ZALOZENIE zgodne z R9: bez automatycznego konca); `isForcedPeaceEligiblePair` odrzuca pary z rejestrow Kamien/Braz/Zelazo.

IMPLEMENTACJA:
- A: planer wybiera najblizsze miasto od kotwicy KAZDEJ grupy wojsk (odleglosc heksowa); stolica jest celem tylko gdy najblizsza.
- B: prosba (pierwsza z pary, licznik nie odnawiany) -> `tickAiAiPeaceRequests` raz na ture po fazie AI. Cena = baza PW pokoju (500, `treatyBasePnFromConfig`) x mnoznik bramki zwyciezcy (`evaluatePeaceAiGate`). Zwyciezca przyjmuje przed limitem tylko gdy bramka 'ok' i bilans po zaplacie >= 0; w turze T+2 pokoj ZAWSZE (platnosc maksymalna mozliwa, takze 0). Platnosc istniejacymi formami koszyka (`transferBasketItems`: zloto, surowiec_ilosc, miasto; cesja po pre-kontroli `cityCessionPlanFor`, stolica/ostatnie miasto zakazane), skutki pokoju zwykle (`finalizePeaceTreatyBetween`, blokada bez zmian). Gracz nie jest zmuszany (para z czlowiekiem odrzucona).
- C: `aiAutoSiegeAllowed`: AI oblega obwarowane miasto innej AI w stanie wojny (miasta gracza jak dotad; barbarzyncy i hotseat-inni gracze bez zmian). Dalej dziala istniejacy tor: maszyny/szturm AI, `captureCityWithoutBattle`.

TESTY:
- gra/tools/ai-war-nearest-city-peace-2t-test.cjs: PO 29/29 PASS + 10/10 mutacji zabitych (gate-test-green.txt, EXIT=0); BAZA RED 3/29 (gate-red-base.txt, EXIT=1). Zakres: cel = najblizsze miasto (decideAITurn+planer), remis, gracz/barbarzynca bez zmian; pokoj w T+2, T+1 odrzucony, platnosc zloto/surowce/miasto, bilans przed < 0 / po >= 0, brak zmuszania gracza i wojen wymuszonych; AI-AI auto-oblezenie, zajecie pustego miasta (`executeAiCityMove`), mur blokuje wejscie; straznik okablowania main.ts (tekstowy).
- tsc --noEmit: EXIT=0 (gate-tsc.txt). git diff --check: EXIT=0.
- Regresje 200 testow (*war*,*peace*,*siege*,ai-*,*diplomacy*,*capital-capture*,*forced-war*): PRZED 49 fail, PO 49 fail (te same; wczesniej istniejace). Jedna regresja wykryta i naprawiona: war-era-counter-test (regex adjacencji `regularWarCapturedByPairKey.clear()`) 82/0. Wyniki w gate-regresje-przed-po.txt.
- Live (vite build w /tmp): ai-wojny-zwykle-cap-dwa-miasta 22/0; forced-war-r9-no-auto-end 22/0; diplomacy-city-cession 17/0; ai-general-war-campaign-live 68/0. diplo-war-peace-live-test: 2 FAIL (DOM panelu zdarzen) + CRASH przegladarki -- ten sam CRASH na bazie (NIE_ZMIERZONO czy 2 FAIL wystepuja na bazie).

BLOKADY / NIE_ZMIERZONO (jawnie):
- Pelne symulacje gier (>= 6 ziaren, 150+ tur, PRZED/PO): NIE_ZMIERZONO. Sonda realnego bundla (Maly, ziarno 1): generacja swiata 86 s + ok. 15 s/ture => ok. 40-60 min na ziarno x 12 biegow; niewykonalne przy zakazie pracy w tle i limicie 590 s/wywolanie. Harness gotowy (sim-harness-war-sim.cjs + sim-harness-prep-war.cjs, bundle ze zmodyfikowanej KOPII poza repo). Do wykonania przez orkiestratora poza tym ograniczeniem. Metryki "liczba zajetych miast > 0 w typowych grach", "opoznienie pokoju wzgledem prosby", "czas tury AI" -- NIE_ZMIERZONO w pelnej grze; potwierdzone na poziomie funkcji silnika (test) i analiza kodu.
- Histogram przyczyn braku zajec zmierzony TYLKO statycznie (pkt 2 powyzej), nie w symulacji.
- Znak bilansu pokoju w grze (`evaluate_proposal`): wyliczony modelem czystym (baza 500 PW x mnoznik), nie wywolaniem evaluateProposal w pelnej grze.
- Wyjscie poza literalna allowliste (minimalne, konieczne dla GOAL): warAllInCapital.ts (tie-break; plik nie nazywa sie `war-*`), nowy ai-war-target-select.ts, siege-gate (`diplomacy-siege-war-gate.ts`), main.ts: cele/auto-oblezenie/zapis stanu (nie tylko finalizacja pokoju). Klucz parametru TYLKO w ai-params.json (nie dublowany w diplomacy-war-peace-params.json -- jedno zrodlo).
- ZALOZENIA: "najblizsze" = odleglosc heksowa od kotwicy grupy (nie sciezkowa); cesja max 1 miasto na pokoj (istniejaca regula); prosba pochodzi z istniejacej oceny `decideAIDiplomacy` (przegrywajaca strona), zwyciezca = druga strona pary; miasta-panstwa i kopie typu poza mechanizmem pokoju wymuszonego (tylko glowne AI); pokoj wymuszony pomija zwykla bramke "za wczesnie" dopiero po limicie.
- Przeciwko nowemu ryzyku: auto-oblezenie skanuje teraz wszystkie obwarowane miasta po turze AI (koszt O(miasta z murem x jednostki)); NIE_ZMIERZONO w pelnej grze.

RUNDY: 1/5
NASTEPNY KROK: Evaluator R1 (przeglad kodu + weryfikacja testu/mutacji; wykonanie symulacji pelnych gier poza limitem 590 s lub decyzja o akceptacji NIE_ZMIERZONO).
DEPLOY/PUSH: NIE WYKONANO
