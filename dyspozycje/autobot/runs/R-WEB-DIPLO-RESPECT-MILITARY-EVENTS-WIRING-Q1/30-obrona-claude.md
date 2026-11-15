STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
GOAL: zdarzenia Respektu „Przewaga militarna” (+15) i „Słabszy militarnie” (−10) działają w tickach gry, jednorazowo na przejściu progu 50%; obrona odpowiada na zarzuty Evaluatora (fbed55d27).
ZMIANY-COMMIT: baza 20a4479a5 (kandydat Operatora). Kod obrony: 5b87f3cc1 (commit ze zmianami kodu/dokumentacji/testów; allowlista w sekcji ZARZUTY nr 5).
  - gra/src/game/diplomacy-pn-engine.ts: DiploPairMeta.respektMilOffset (skumulowana korekta militarna, brak pola = 0).
  - gra/src/game/diplomacy-military-strength.ts: respektZKorektaMilitarna(bazowy, offset) = clamp(round(bazowy+offset), 0, 100).
  - gra/src/main.ts: applyMilitaryRespektEdgeTick — brak pola stanu = inicjalizacja bez zdarzenia; przy zdarzeniu offset += faktyczne dR (next.respekt − cur.respekt); pętla AI (relacja gracz–AI) respekt = respektZKorektaMilitarna(computeRespekt(potAI, potPlr), meta.respektMilOffset).
  - gra/tools/diplo-respect-military-offset-test.cjs (nowy), gra/tools/diplo-respect-military-events-test.cjs (sekcja D: asercje pod nowy kod).
  - docs/PORADNIK-GRACZA/12-dyplomacja.md (akapit o przewadze militarnej, 50%, jednorazowość), docs/encyklopedia/pojecia/moc-podzial.md l.64 (20% wojna vs 50% Respekt), docs/encyklopedia/pojecia/respekt.md (uwaga o korekcie), gra/src/data/wikiBundle.json (regeneracja: node tools/bundle-wiki-for-game.cjs, 22 rozdz. + 181 haseł).
TESTY (surowe wyniki z tej rundy, w worktree po npm ci --ignore-scripts w gra/):
  - npx tsc --noEmit (gra/): exit 0, 0 błędów (log: /home/user/scratch-tsc-new.log).
  - node tools/diplo-respect-military-edge-test.cjs: 12 OK, 0 FAIL.
  - node tools/diplo-respect-military-events-test.cjs: 30 OK, 0 FAIL (poprzednio 28/0; zmieniona asercja D + 2 nowe).
  - node tools/diplo-respect-military-offset-test.cjs: 12 OK, 0 FAIL — Respekt po pętli AI = [50,65,65,65,65,80,70,70]; zdarzenia t2:A:+15, t6:A:+15, t7:B:−10.
  - MUTATE_NO_OFFSET=1 node tools/diplo-respect-military-offset-test.cjs: 11 OK, 1 FAIL (mutacja czerwieni; stara ścieżka bez korekty gubi zdarzenia).
  - git diff --check: czysty (exit 0).
  - Dwie komendy „dla pewności” z dispatchu (npm test całości, 5 bramek referencyjnych) NIE uruchomiono w tej rundzie — patrz BLOKADY.
BLOKADY:
  - (c) test na prawdziwym ticku dyplomacji (tury 1–30, dwie cywilizacje): NIE ZMIERZONO. main.ts nie jest importowalny w node; pełny tick wymaga uruchomienia gry. Offset-test odtwarza kolejność (krok zdarzeń → pętla AI) na tych samych funkcjach, ale nie jest testem silnika.
  - (e) zrzut Chromium panelu dyplomacji z „Przewaga militarna” w rejestrze: NIE ZMIERZONO. /usr/bin/chromium istnieje, ale scenariusz z grą na turze z przejściem progu nie był uruchomiony.
  - Panel dyplomacji pokazuje Respekt z Mocy (main.ts ~26260: formatPowerRelationLine(playerPower, otherPower) → powerLine.respekt). Korekta militarna NIE jest tam wliczona — liczba w panelu nie zmieni się o +15/−10. Zdarzenie widać w rejestrze (recordDiploFactor), nie w liczbie. Nie poprawiono (wpływ na R-MOC-HUD-GLOWNY-Q1=C, osobna decyzja).
  - Test przypadku „pierwsza ocena pary = inicjalizacja bez zdarzenia” (stare zapisy): kod jest, test jednostkowy NIE dodany.
  - Zapis/odczyt (save/load) korekty: NIE ZMIERZONO na żywo. Kod: meta serializowane w całości (main.ts ~30153 pairMeta, ~38894 diplomacyPairMeta; odczyt ~49025–49027), więc nowe pole przechodzi przez zapis.
  - Wygrana bitwy +5 (wygrana_bitwa), wspolny_wrog +10 i trybut +10 są nadpisywane tą samą pętlą AI (ten sam mechanizm, sprzed tego tematu). NIE naprawiono — poza zakresem tematu; patrz UWAGI.
  - Pozostałe wywołania computeRespekt bez korekty (main.ts ~8708, ~19952, ~25304–25305 propozycje; ~2945/~2961 objectiveRespekt*): decyzje oparte na nich nie widzą +15/−10. Zakres ograniczony do pętli relacji AI, zgodnie z tym, że stan relacji jest źródłem tych decyzji.
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Evaluator r2 — (c) i (e) wymagają uruchomienia gry (headless/Chromium); bez nich kryteria (c), (e) pozostają niespełnione.
DEPLOY/PUSH: NIE WYKONANO

ODPOWIEDZI NA ZARZUTY EVALUATORA (fbed55d27):
  Z1 (kryterium c, brak testu na tickach; mutacja M4): PRZYJMUJĘ CZĘŚCIOWO. Dodano test sekwencji (offset-test) z kolejnością tick → pętla AI i mutantem (MUTATE_NO_OFFSET=1 czerwieni). Pełnego testu na tickach gry NIE dodano (NIE ZMIERZONO, patrz BLOKADY). Zarzut o M4 (zamiana kierunku +15/−10 w main.ts przechodzi): wiring-test sprawdza nazwy zdarzeń w helperze, nie kierunek przypisania; kierunek pokrywa tylko pełny tick (c). Uznaję zarzut.
  Z2 (kryterium e, brak zrzutu Chromium): PRZYJMUJĘ. Zrzut NIE wykonany (NIE ZMIERZONO). Brak zrzutu = kryterium niespełnione.
  Z3 (nadpisywanie Respektu przez pętlę AI; panel z Power): PRZYJMUJĘ i NAPRAWIONO. Potwierdzenie w kodzie przed poprawką: pętla relacji AI (main.ts, blok `if (diplomaticallyDiscoveredOwnersSet().has(ownerId))`) ustawia `relWithRespekt = {...rel, respekt: computeRespekt(potAI, potPlr)}` i zapisuje go przez setDiploRelation, więc +15/−10 z applyMilitaryRespektEdgeTick było nadpisywane w tej samej turze. Poprawka: respektMilOffset w DiploPairMeta + respektZKorektaMilitarna w pętli AI (commit 5b87f3cc1). Dowód: offset-test (12/0) i mutant (1 FAIL). Panel: NIE naprawiono (patrz BLOKADY). Zarzut o +5 wygrana_bitwa: ten sam mechanizm, nie naprawiony w tym temacie (patrz UWAGI).
  Z4 (dokumentacja, poradnik, moc-podzial 20%): PRZYJMUJĘ i NAPRAWIONO. Dodano akapit do docs/PORADNIK-GRACZA/12-dyplomacja.md (próg 50%, jednorazowość, rejestr); poprawiono docs/encyklopedia/pojecia/moc-podzial.md l.64 (20% = wojna, 50% = Respekt); respekt.md uzupełniono o korektę i o to, że panel pokazuje Respekt z Mocy. wikiBundle zregenerowany narzędziem (diff 1 linia).
  Z5 (allowlista: main.ts i diplomacy-pn-engine.ts poza dispatchem): PRZYJMUJĘ jako odchylenie, do decyzji FC. main.ts jest niezbędny do wpięcia tickiem, pn-engine dodaje pole meta. Dodatkowo poza listą: gra/tools/diplo-respect-military-offset-test.cjs (nowy test). Zakres nie został rozszerzony o inne pliki.
  Z6 (luka testowa: kierunek w main.ts, zapis/odczyt, jednorazowe +15/−10 przy pierwszym ticku dla starych zapisów): PRZYJMUJĘ i NAPRAWIONO częściowo. Brak pola stanu = inicjalizacja bez zdarzenia (main.ts applyMilitaryRespektEdgeTick), więc stary zapis nie dostaje jednorazowego +15/−10. Zapis/odczyt: meta w całości w zapisie (dowód: referencje w main.ts), test na żywo NIE ZMIERZONO. Kierunek w main.ts: patrz Z1.
  Z7 (AI↔AI pominięte, założenie 1): ODRZUCAM jako błąd, zostawiam założenie. Dowód: pętla relacji AI działa tylko dla pary ME()–ownerId (main.ts, blok diplomaticallyDiscoveredOwnersSet); applyMilitaryRespektEdgeTick iteruje tylko pary gracz–o (isMe(o) pominięte; `for (const o of allPowerOwnerIds())` z warunkiem gracz–o). Stały zapis Respektu AI↔AI w tickach nie istnieje; computeRespekt dla AI↔AI pojawia się tylko doraźnie w propozycjach (main.ts ~25304–25305). Nie sprawdzono, czy istnieje inny tick AI↔AI poza tym blokiem (NIE ZMIERZONO).

ZALOŻENIA (rozstrzygnięte przeze mnie):
  - Korekta jest trwała i sumuje się z każdym przejściem progu (+15, +15, −10 → 50 → 65 → 80 → 70). Zgodne z jednorazowością zdarzeń; brak wygaszania. Do potwierdzenia przez FC.
  - Korekta zapisuje faktyczne dR z applyDiplomaticEvent (łącznie z skalą trudności), nie stałą 15/−10.
  - Respekt w relacji clamp [0,100] po dodaniu korekty; przy granicach offset może rozjechać się z sumą zdarzeń (brak kompensacji).

UWAGI-DLA-ORKIESTRATORA:
  - Pre-existing: wszystkie zdarzenia Respektu zapisane w relacji (wygrana_bitwa +5, wspolny_wrog +10, trybut +10, ...) są nadpisywane w pętli AI tym samym mechanizmem co zarzut 3. Poprawka wymaga decyzji produktowej (czy każde zdarzenie ma mieć korektę jak militarne). Zalecany osobny temat R-WEB-DIPLO-RESPECT-EVENTS-OVERWRITE-Q1 — nie zakładam go sam.
  - Decyzja produktowa: panel dyplomacji pokazuje Respekt z Mocy, nie z relacji. Użytkownik nie zobaczy +15/−10 w liczbie. Do decyzji właściciela (ABC): pokazać korektę w panelu czy zostawić rejestr.
  - Zalecany pełny test na tickach (tury 1–30, dwie cywilizacje) i zrzut Chromium — do wykonania przez osobny temat z uruchomieniem gry.
  - node_modules w worktree zainstalowano przez npm ci --ignore-scripts (w worktree nie było node_modules; bez tego tsc/esbuild nie działają). Pliki bundli w gra/tools są ignorowane przez git.
