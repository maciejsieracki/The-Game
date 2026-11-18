STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: Każde miasto AI trzyma stały garnizon (min. 1 jednostka bojowa), także w pokoju; garnizon nie dołącza do armii (wariant C: rezerwacja z priorytetem).
ZMIANY/COMMIT: kandydat 1484bdc1e; merge-base --is-ancestor 8a2d31af9 -> OK. diff --stat: ai-city-garrison.ts +16, main.ts +34/-?, ai-city-garrison-min-one-test.cjs +9, 2 raporty. Allowlista zachowana (brak gra-robocza/kanon/WERSJE/rust-port/JSON).
TESTY (własne, surowe wyjście, kandydat 1484bdc1e): tsc --noEmit pusty (0); min-one 16/0; ai-war-city-garrison 21/0; army-concentration 56/0; home-defense-vs-barbarians 46/0; ai-war-defend-home 30/0; siege-ai 17/0; logic 213/213; tech-tree 20/0; combat 6/6; ai-war-army-seeks-army 22/0.
MUTACJA własna: getCityGarrisonUnitIds -> pusta mapa: min-one 12/4 (czerwony), ale army-concentration 56/0 i ai-war-city-garrison 21/0 NADAL zielone; źródło przywrócone (git checkout, status czysty). Dyskryminacja istniejących testów słaba, potwierdza zarzut 4.

OCENA ZARZUTÓW (NAPRAW = wymagane do PASS; ODDAL = uwaga):
1. Brak pomiaru PRZED/PO w żywej grze: NAPRAW. Dispatch: "skuteczność = liczby z pomiaru w grze; bez pomiaru = NIE ZMIERZONO; brak poprawy = FAIL". Skuteczność niedowiedziona.
2. Brak testu dla main.ts (aiGarrisonGoldReserve/isGarrisonPriority): ODDAL częściowo - obrona r3 wyniosła decyzję do czystej funkcji isGarrisonPriorityPurchase z testami H6/H6b/H7; samo wpięcie w main.ts i rezerwa nadal bez testu (uwaga).
3. Garnizon nie wykluczony z homeDefenderPool, armyMerge, all-in, generała, odsieczy, zwiadu: NAPRAW. Własny grep: getCityGarrisonUnitIds użyte tylko w ai.ts 3742 (marsz), 4156 (koncentracja), 5690; armyMerge.ts/ai-war-home-defense.ts bez wykluczenia. To wprost niezrealizowane zadanie 1 z dispatchu i sedno zgłoszenia właściciela ("nie miały dołączyć do głównej armii"). Konflikt z zasadą (g) NIE jest powodem odłożenia: homeDefenderPool to obrona domu, ale dodatkowo audyt wskazał zbiórkę w jednym mieście - decyzja bez ABC była dozwolona tylko jako DECISION_REQUIRED, a nie jako cichy brak; nie zadano pytania.
4. Próg sc.4 nie przywrócony, G7 niewzmocniony: NAPRAW (zadanie 3 r2 niewykonane ani nie uzasadnione dowodem; mutacja wyżej pokazuje brak dyskryminacji w army-concentration).
5. isGarrisonPriority dla każdej jednostki bojowej: ZROBIONE w r3 (isGarrisonPriorityPurchase: candId === Wojownik && cityNeedsGarrison; kod zweryfikowany w diffie). OK.
6. aiGarrisonGoldReserve: ryzyko zamrożenia ekonomii przy ~78 pustych miastach (pending x koszt Wojownika odejmowane od skarbca dla wszystkich innych zakupów, bez filtra zdolności zakupu; koszt O(miasta x jednostki) na kandydata): NAPRAW/NIE ZMIERZONO. Zmiana wpływa na ekonomię całej AI, brak pomiaru Pieniądz/turę PRZED/PO; wymaga ograniczenia (np. sufit rezerwy lub filtr miast w zasięgu zakupu) i pomiaru.
7. Operator r2 BLOCK; zdublowany import: ZROBIONE (scalone w r3). Zadania 1,3,4 r2 nadal otwarte.

WERDYKT: FAIL. Kandydat nie spełnia dispatchu: (a) brak wykluczenia garnizonu ze wszystkich ścieżek, (b) brak pomiaru w żywej grze, (c) rezerwa złota bez pomiaru wpływu na ekonomię, (d) testy istniejące nie wykrywają mutacji. Pozytywy: tsc i wszystkie bramki zielone, regres brak, priorytet tylko dla Wojownika, wspólna funkcja i test czysty działają.
BLOKADY: brak decyzji właściciela dla homeDefenderPool (rekomendacja: wykluczyć garnizon z puli ofensywnej, a w puli obrony domu zostawić, bo (g) mówi że garnizon broni miasta - wystarczy ABC jednozdaniowe); pomiar wymaga Chromium i przebiegu 60 tur.
RUNDY: FC r2 po r3 obrony; łącznie runda 3/5 (rundy 4 i 5 pozostają).
NASTĘPNY KROK: runda 4 do TEGO SAMEGO ID: wykluczyć garnizon z armyMerge, all-in, generała, odsieczy i puli ofensywnej; zadać ABC dla homeDefenderPool; ograniczyć rezerwę; test dyskryminujący G7/army-concentration (czerwony na mutacji pustej mapy); pomiar seed 4242 t30/t60 z surowymi liczbami PRZED/PO i Pieniądz/turę.
UWAGI-DLA-ORKIESTRATORA: dispatch przewiduje Sonnet na Operatorze dopiero po 2 nieudanych rundach Haiku tego samego tematu - warunek spełniony (r1 FAIL, r2 BLOCK), pisemne uzasadnienie wymagane w dispatchu. Chromium: sprawdzić dostępność /opt/pw-browsers.
DEPLOY/PUSH: NIE WYKONANO
