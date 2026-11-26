STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, etykieta)
TEMAT: R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1 (HOTSEATHUD, #152)
GOAL: licznik „Dostępne za N tur” przy akcji Pokój w oknie dyplomacji hotseat, spójny z bramką (to samo źródło turnsAtWar pary). Bez zmian w kodzie gry w tej rundzie; wzmocniony tylko test.
ZMIANY/COMMIT: baza kandydat 9634ca74c5ec6005e9869f08c9889a402e4bc7a5. Zmieniony tylko plik gra/tools/hotseat-peace-counter-ui-test.cjs (commit obrony, SHA w polu sha). Kod gry (interHumanDiplomacyHud.ts, main.ts, diplomacy-peace-proposal-timing.ts) nietknięty.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
- Zarzut 1 (brak asercji na syncPeaceBlock w handlerze change i na syncPeaceBlock(defaultKind)): PRZYJĘTY. Dodano dwie asercje źródłowe: (a) hudSrc.includes('syncPeaceBlock(defaultKind);'), (b) regex na blok addEventListener('change', ...) zawierający syncPeaceBlock(k);. Dowód mutacji (surowe wyjście, każda cofnięta przez git checkout):
  MUT-A (komentarz zamiast syncPeaceBlock(k) w handlerze change): FAIL: HUD: zmiana rodzaju w liście ponownie synchronizuje blokadę (syncPeaceBlock(k) w handlerze change); Wynik: PASS=24 FAIL=1; exit=1.
  MUT-B (komentarz zamiast syncPeaceBlock(defaultKind)): FAIL: HUD: stan początkowy blokady synchronizowany dla domyślnego rodzaju (syncPeaceBlock(defaultKind)); Wynik: PASS=24 FAIL=1; exit=1.
  Po przywróceniu: Wynik: PASS=25 FAIL=0, exit 0.
  Uwaga: asercje są źródłowe (dopasowanie tekstu), tak jak reszta części (b) testu; nie dowodzą zachowania DOM. Zachowanie kontrolowane jest tą samą logiką co bramka, a luka zachowania przeglądarki jest opisana w zarzucie 2.
- Zarzut 2 (brak dowodu renderu w żywym Chromium/DOM): PRZYJĘTY. NIE ZMIERZONO — brak jsdom/Chromium w tej rundzie; nie dodawano nowego harnessu DOM (poza zakresem allowlisty tematu). Zachowanie w grze potwierdzone tylko źródłowo (tsc + analiza + asercje tekstowe). Do zrobienia przez Final Control albo osobny temat z harnessem przeglądarki.

TESTY (surowe wyjście, ta runda):
- cd gra && node tools/hotseat-peace-counter-ui-test.cjs → Wynik: PASS=25 FAIL=0, exit 0 (na przywróconym kodzie).
- npx tsc --noEmit → exit 0 (kod gry nietknięty w tej rundzie).
- git diff --check → czysty.
- NIE PONOWIONO w tej rundzie (kod gry bez zmian, poprzedni dowód z Evaluatora na tym samym kodzie): logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0, hotseat-peace-protection 4/0, diplo-human-peace-no-war 13/0, hotseat-etap6d-podetap-b/d/e 48/0 46/0 24/0. Bramki zależne tylko od kodu gry nie były zmieniane.
- npm install --ignore-scripts w gra/ wykonane wyłącznie do uruchomienia testu (typescript). node_modules usunięty po bramkach.

BLOKADY: brak. Brak dostępu do przeglądarki/DOM (NIE ZMIERZONO, patrz zarzut 2).

UWAGI-DLA-ORKIESTRATORA:
- Harness DOM (jsdom lub Chromium) dla okna hotseat nie istnieje w repo; kandydat na osobny temat (weryfikacja renderu okna dyplomacji hotseat).
- Dispatch zakazuje spawn_task; nie użyto.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control — sprawdzić commit obrony (tylko plik testu), potwierdzić mutacje MUT-A/MUT-B i brak zmian kodu gry; zarzut 2 jako NIE ZMIERZONO w długu.
DEPLOY/PUSH: NIE WYKONANO
