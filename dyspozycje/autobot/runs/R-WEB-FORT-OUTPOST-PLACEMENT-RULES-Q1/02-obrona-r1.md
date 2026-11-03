STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORT-OUTPOST-PLACEMENT-RULES-Q1
GOAL: Posterunek tylko na wlasnym terytorium przy granicy (jeden predykat: gracz, automat, AI); fort gdziekolwiek.
RUNDY: 1/5 (obrona)

ODPOWIEDZI NA ZARZUTY
1. improvement-build.ts poza allowlista: ODRZUCAM jako wade, prosze o jawna akceptacje odstepstwa. To wspolny kwalifikator panelu i automatu (E-FORT); bez zmiany trzeba by duplikowac predykat (zakaz dispatchu). Zmiana: 1 import + case 'posterunek'.
2. Wygaszenie ekspansji AI przez tech Wojskowosc: PRZYJMUJE. W planExpansionFortBuilding dodana petla 2: gdy fort niedostepny (tech/koszt), AI buduje posterunek z heksu wlasnej granicy (isOutpostPlacementAllowed, ten sam predykat). Fort poza zasiegiem ma priorytet. Pomiar (measure.cjs --techs bez Wojskowosci, 200 jedn./bieg, 15 biegow): 29 posterunkow, wszystkie wewnatrz-przy-granicy, 0 naruszen (measure-post-r2-bezfortu.txt). Z techem: 873 forty + 8 posterunkow przy granicy (measure-post-r2.txt). Test C5-C10; mutacja (usuniecie predykatu w petli 2) daje 3 FAIL.
3. Pomiar przed = 860 posterunkow/0 fortow: ODRZUCAM jako wade. To wynik pomiaru: przypadek AI poza terenem byl realizowany posterunkiem, nie fortem. E-FORT i pelna gra w przegladarce: NIE_ZMIERZONO (E-FORT uzywa tego samego kwalifikatora, pokrytego testem B; auto-improvements.ts bez zmian).
4. Kosmetyka ai-improvements-test sekcja 11: PRZYJMUJE. Zmienne i etykiety zmienione na fort, komentarz kosztu 25.
5. Brak testu behawioralnego komunikatu UI / live testu: ODRZUCAM czesciowo. Komunikat to eksportowana stala, sprawdzana strazniakiem tekstowym (D3). Wywolanie przez prawdziwy strazniak wymaga bootu main.ts w przegladarce: NIE_ZMIERZONO; fort-outpost-territory-live-test.cjs nie uruchomiony.

TESTY (po poprawce, wszystkie EXIT=0): tsc; fort-outpost-placement-rules 40/0; ai-improvements 56/0; fort-strazniaca-zasieg-zakladania; auto-fort-claim; auto-fort-diag; fort-vision; fort-outpost-hard-territory; fort-nodes-save-load; autoimprove-stages-q1; city-defense-terrain-gate; ai2-heks-po-heksie. Logi: gate-*-r2.txt.
BLOKADY: brak
NASTEPNY KROK: Evaluator
DEPLOY-PUSH: NIE WYKONANO
