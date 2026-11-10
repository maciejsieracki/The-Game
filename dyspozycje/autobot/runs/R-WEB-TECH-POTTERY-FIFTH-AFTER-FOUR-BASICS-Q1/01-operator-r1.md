STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TECH-POTTERY-FIFTH-AFTER-FOUR-BASICS-Q1
GOAL: Garncarstwo odblokowuje się dopiero po zbadaniu Rolnictwa, Łowiectwa, Obróbki drewna i Oswojenia zwierząt (piąta technologia do wynalezienia); przed tym nie pojawia się w „Możesz wybrać”, po spełnieniu wymagań pojawia się i nie wyprzedza technologii Poziomu 1 w osi epoki.
ZMIANY/COMMIT: commit kodu 3a881d48c (branch: worktree wf_2fe6e43a-249-1, baza origin/main 1d068199676d).
  - gra/data/tech.json: prereq Garncarstwa = „Obróbka drewna + Rolnictwo + Łowiectwo + Oswojenie zwierząt”; wpis przeniesiony za „Oswojenie zwierząt” (oś orderedTechsInEpoch = Poziom, potem kolejność w tablicy). Koszt 40 i Poziom 1 NIE zmienione.
  - gra/data/tech-cards-top5.json: zregenerowany gen-tech-cards-top5.cjs (--check OK). Treść identyczna (sprawdzone porównaniem JSON), zmieniła się tylko kolejność kluczy.
  - gra/src/data/wikiBundle.json: zregenerowany tools/bundle-wiki-for-game.cjs; diff = wyłącznie linia prereq Garncarstwa.
  - docs/encyklopedia/technologie/garncarstwo.md: 1 linia „Wymaga (prereq)” (brak generatora stron technologii; ręczna zmiana jednej linii, zgłoszone w BLOKADY).
  - gra/tools/tech-pottery-fifth-test.cjs (nowy): 45 asercji.
  - gra/tools/tech-tree-test.cjs: Wymiana depth 1 → 2; dodana asercja Garncarstwo depth 1.
  - gra/tools/building-tech-gate-test.cjs: łańcuch Wymiany i „po zbadaniu wszystkich” rozszerzone o Obróbkę drewna i Łowiectwo.
  - gra/tools/building-cost-resource-availability-test.cjs: „Garncarstwo bez prereq” → „Garncarstwo wymaga 4 podstaw”.
  - Nie zmieniono: gra/src/game/research.ts, ai.ts, WERSJE.md, gra-robocza/, gra/ build/dev, git add -A.
TESTY (node tools/<test>.cjs, z gra/):
  - tech-pottery-fifth-test: 45 pass, 0 fail (prereq/koszt/Poziom; oś epoki; niedostępne bez każdej z 4 podstaw; dostępne po 4; validateTechGraph OK bez cykli; głębokość Garncarstwo 1, Wymiana 2, Brązownictwo 2; z pustego stanu osiągalne wszystkie 32; zapis ze zbadanym Garncarstwem zachowuje je; AI: 32 wybory bez null, 5. wybór = Garncarstwo, także pod zagrożeniem).
  - tech-tree-test: 20 pass, 0 fail.
  - research-test: 33 pass, 0 fail.
  - tech-cards-top5-test: 594 pass, 0 fail (po regeneracji).
  - building-tech-gate-test: 96 pass, 0 fail.
  - building-cost-resource-availability-test: 62 pass, 0 fail.
  - ai-difficulty-bonus-test: 97 pass, 0 fail.
  - ai-threat-mode-test: 12 pass, 0 fail. iron-gating-impl-test: 130 OK, 0 FAIL. owner-epoch-test: 13 pass, 0 fail. granary2-tech-data-guard-test: 14/0. civpedia-technologie-rys-historyczny-test: 324/0. civpedia-gra-id-mostek-test: PASS. diplomacy-tech-trade-test: 30/0. diplomacy-basket-transfer-test: 24/24. tech-tempo-test: 15/0. tech-unlock-units-test: 126/0. science-hub-test: 7/0. spichlerz-widocznosc-test: 45/0. logic-test: 213/213.
  - NIE_ZMIERZONO: npm run build / dev (zakazane); przeglądarka (temat nie jest wizualny, nie uruchamiano gry).
BLOKADY:
  - tech-discovery-badge-diorama-test: 61 PASS / 2 FAIL (B2 Hutnictwo żelaza — przecięcie badge z elipsą gruntu; c1 — wysokość diorama 209 px). Nie są związane z prereq; NIE_ZMIERZONO na main (nie cofano danych, by porównać), bo test nie został uruchomiony na HEAD bez zmian.
  - card-resource-purpose-test: 101 PASS / 1 FAIL — asercja [B] o regexie w src/ui/entityCards/buildingAdapter.ts („utrzymanie w Pieniądzu”); ten temat nie zmienia tego pliku, więc porażka pochodzi z wcześniejszego stanu main (NIE_ZMIERZONO na main).
  - Dług: REPIN Rust (tech.json: nowa kolejność i prereq Garncarstwa) — do zrobienia przy REPIN drzewka.
  - Do decyzji właściciela (poza zakresem, nie zmieniano): koszt Garncarstwa w tech.json = 40 (tempo Szybka), a „tempo_gry” opisuje Tier 1 Kamienia jako bazowo 5 PN; docs/encyklopedia/technologie/garncarstwo.md podaje „koszt 20 PN” (stare dane). Zrzut właściciela pokazuje 320 PN (tempo Standardowe/Długie); zgodność nie była sprawdzana poza tech.json.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diff 3a881d48c vs origin/main, uruchomienie testów z listy; Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO

ZACHOWANIE (dla właściciela/Evaluatora):
  - Zapisy gry: research.ts nie ma migracji; zbadane Garncarstwo zostaje w `ukonczone` (availableTechs tylko filtruje listę dostępnych). Gracz, który ma Garncarstwo bez podstaw, zachowuje tę technologię. Przetestowane asercją.
  - AI (scoreTech/chooseAIResearch): bez zawieszenia — 32 wybory, bez null. Kolejność startowa: Obróbka drewna / Rolnictwo / Łowiectwo / Oswojenie (koszt 5 każdy), potem Garncarstwo. Koszt do Garncarstwa wzrósł z 40 do 60 PN bazowo (+20 PN, Szybka); odblokowanie Spichlerza/Cegielni przesunięte o cztery wybory. Tempo nie spada poza tym opóźnieniem.
  - Brązownictwo (Garncarstwo + Murarstwo + Obróbka drewna) i Wymiana (Garncarstwo + Rolnictwo + Oswojenie) pozostają osiągalne; Brąz startuje po czterech podstawach + Garncarstwie (łącznie 6 technologii zamiast 3 przed zmianą w łańcuchu Wymiany).
  - Brak cykli (validateTechGraph OK). Poziom 1 pozostaje, więc tiery (ZASADA 2) bez zmian.
