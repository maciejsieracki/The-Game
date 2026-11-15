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

=====================================================================
OBRONA RUNDA 3/5 (Operator/Obrona HAIKU, 2026-11-15) — odpowiedzi na zarzuty Evaluatora (kandydat e05cc2c3e, raport FC 415432167)
=====================================================================
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1 (runda 3, obrona)
GOAL: odpowiedzieć na Z1–Z6; zmierzyć pasek Respektu w audiencji przy zdarzeniu (T2); domknąć tylko to, co da się zmierzyć w tej rundzie.
BAZA: start e05cc2c3e (detached). Kod tej rundy: commit 0811f49f9. Bez merge do origin/main (ff090714d, FALA 730 — poza zakresem, integracja należy do orkiestratora).
ZMIANY-COMMIT:
  - 0811f49f9 (kod + test + dowody): gra/src/main.ts (+2 linie: hak `__respektMilTest.bazaPaskaAudiencji`), gra/tools/diplo-respect-military-live-test.cjs (pomiar paska w T2 zamiast w T15), evidence/respekt-live-result.json, evidence/respekt-live-t2.png.
  - Logika gry: BEZ ZMIAN względem e05cc2c3e. Własną poprawkę paska (dodanie korekty do paska/listy/relacjaTotal) wykonałem, zmierzyłem i COFNĄŁEM — patrz Z1.
  - Ten raport: osobny commit (plik 30-obrona-claude.md).
  - Przy każdym uruchomieniu diplo-* testy nadpisały PNG w innych runs/*/evidence (R-WEB-TRUCE-Q1/evidence/truce-01-modal-rozejm-5.png) — przywrócone `git checkout`, NIE w commicie.

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Z1 (pasek/liczba Respektu w panelu nie uwzględnia korekty; 87 w zrzucie vs 20–49 w haku): PRZYJMUJĘ zarzut o braku korekty na pasku; ODRZUCAM hipotezę, że to błąd wiązania (main.ts). Zarzut jest prawdziwy, ale stan jest inny niż w r2 opisałem.
  - Mój błąd w r2: napisałem „pasek 87/100 z korektą przeżywa tick” — to było FAŁSZYWE. Pasek NIE zawiera korekty. Odwołuję to zdanie.
  - Przyczyna (perspektywa, nie wiązanie): pasek w audiencji = powerLine.respekt = computeRespekt(Moc GRACZA, Moc AI) (main.ts ~26466; diplomacy-display.ts:466–474). Relacja w pętli AI = computeRespekt(Moc AI, Moc GRACZA) + korekta (main.ts ~43338; diplomacy.ts:1707–1714). Oba to udziały w sumie = dopełnienia.
  - Pomiar T2 (test żywy, offset +15): bar = 85 (baza gracza, bez korekty); relacja AI = 30 = baza 15 + korekta 15; bar + baza_relacji = 85 + 15 = 100 (dopełnienie).
  - Pomiar r2 (evidence/respekt-live-t15.png): bar 87 przy offset 0 (po stripStan), relacja 16; 87 + 16 = 103. Różnica 3 wynika z Mocy efektywnej (pasek) vs nominalnej (relacja) — dlatego w teście tolerancja 3.
  - Próba naprawy w tej rundzie: dodanie korekty do paska (i do listy dyplomacji oraz relacjaTotal). Wynik: pasek rośnie o +15 przy zdarzeniu „Przewaga militarna”, czyli w KIERUNKU PRZECIWNYM do relacji AI (relacja AI też rośnie, a pasek to jej dopełnienie). Test T2 nie rozróżniał (bar 100 = clamp(85+15)). Cofnięte.
  - STAN: pasek, lista dyplomacji (main.ts ~8712) i relacjaTotal audiencji NIE uwzględniają korekty. NIE NAPRAWIONO — wymaga decyzji właściciela (ABC): (a) pasek = udział gracza → korekta na pasku jako −offset; (b) zmiana perspektywy paska na AI (100 − udział gracza) → korekta +offset. Dokumentacja respekt.md l.93 opisuje stan obecny (zgodny z kodem).
  - Test w tej rundzie: „T2 panel: pasek = baza gracza” (bar 85 == baza 85) i „dopełnienie 100 ±3” (85 + 15 = 100) — PASS. To mierzy stan obecny, nie korektę na pasku.

Z2 (round-trip zapisu/wczytania tylko przez JSON.parse w haku; ryzyko niskie): PRZYJMUJĘ — realny zapis slotu NIE ZMIERZONO.
  - Powód: pełny zapis i wczytanie slotu w Chromium nie były wykonane w tej rundzie (czas, dysk). Gate diplo-truce-saveload-live-test był w bazie czerwony (RC124, wg r2).
  - Dowód kodowy: pairMeta zapisywane w całości (main.ts ~30415 `Array.from(diplomacyPairMeta...)`, odczyt ~49025–49027). Nie zweryfikowano, czy gate diplomacy-border-era-penalty-live (IndexedDB save/load PASS) zapisuje pairMeta — NIE ZWERYFIKOWANE.
  - Stary zapis (brak pola): zmierzony w teście żywym (T15, stripStan → brak zdarzenia, offset 0).

Z3 (korekta trwała i kumulatywna; 15 → 30 → 20): PRZYJMUJĘ jako założenie do potwierdzenia przez właściciela; kodu nie zmieniam. Dane z evidence/respekt-live-result.json: tura 3 offset 15; tura 9 offset 30 (drugie przekroczenie); tura 10 offset 20 (−10 słabszy). Zapisane jako DO POTWIERDZENIA.

Z4 (asercje tekstowe w events-test sekcja D; offset-test na funkcjach czystych): ODRZUCAM jako defekt. Zachowanie jest pokryte testem żywym na prawdziwym ticku (36 OK / 0 FAIL, realny endTurn, realny tick); w r2 mutacja M4 dała exit 1 i czerwone T2–T8. Asercje tekstowe są dodatkowym strażnikiem wiringu. Zmiana sekcji D („NIE podpięte” → „podpięte”) wynika z zakresu tematu (wiring), nie z osłabienia. applyMilitaryRespektEdgeTick nie zmieniony od r2.

Z5 (baza 2fe362553 nie jest przodkiem kandydata; origin/main = ff090714d): PRZYJMUJĘ jako informację. Nie scalam (zakaz integracji Operatora). Merge-base e05cc2c3e z origin/main = 7c2074e00. Integracja z origin/main (FALA 730) wymaga merge i regeneracji gra/src/data/wikiBundle.json (tools/bundle-wiki-for-game.cjs) przez orkiestratora.

Z6 (bramki niezweryfikowane; 5 bramek referencyjnych, unit-power, diplo-*): PRZYJMUJĘ — zmierzone w tej rundzie wszystkie, które dało się uruchomić w tej rundzie (lista w TESTY). Czerwone na bazie: wyniki zgodne z r2 (zmierzone na 7c2074e00 w r2), NIE ponowione na bazie w tej rundzie.

TESTY (surowe wyniki tej rundy; gra/node_modules: npm ci --ignore-scripts, 71 pakietów):
  - npx tsc --noEmit (gra/): exit 0, 0 błędów (log: scratchpad/r3-tsc.log).
  - tools/diplo-respect-military-edge-test.cjs: 12 OK, 0 FAIL.
  - tools/diplo-respect-military-events-test.cjs: 30 OK, 0 FAIL.
  - tools/diplo-respect-military-offset-test.cjs: RESULT 12 OK, 0 FAIL.
  - tools/diplo-military-strength-test.cjs: 27 PASS / 0 FAIL.
  - tools/diplomacy-border-era-penalty-test.cjs: 39 pass, 0 fail.
  - tools/diplo-truce-impl-test.cjs: 94 PASS, 0 FAIL.
  - tools/diplo-respect-military-live-test.cjs (Chromium, bundle vite z bieżącego kodu, ?civTest=1, tury 1–31): 36 OK / 0 FAIL, consoleErrors 0, finalTurn 31 (JSON). Dowód: evidence/respekt-live-result.json, evidence/respekt-live-t2.png (panelT2: bar 85, base 85, offset 15, relacjaAI 30, Przewaga militarna w tekście = true).
  - tools/diplomacy-border-era-penalty-live-test.cjs (GAME_URL=bundle): RESULT PASS (w tym IndexedDB save/load tego gate'u).
  - Bramki referencyjne: logic-test 213/213 (LOGIC OK); tech-tree-test 20 pass / 0 fail; research-test 33/33 PASSED; ai-unit-replace-same-rules-test 45 passed / 0 failed (UWAGA: to nie jest skrypt „unit-replace 21/21” z dispatchu — uruchomiony skrypt to ai-unit-replace-same-rules); combat-test: „All sanity checks passed.” (bez liczby); unit-power-test 6 pass / 0 fail.
  - Czerwone na bazie (wynik zgodny z r2, NIE ponowiony na bazie w tej rundzie): diplomacy-city-cession-r3-test 56 pass / 17 fail; diplomacy-stol-pw-sum-test 167 pass / 1 fail; diplomacy-direct-negotiation-live-test rc=1 „window.__audienceRelTestDebug.setupListRelationsFixture is not a function”; diplo-truce-live-test 13 pass / 1 fail (przyczyna wg r2: endUntilTurn nie osiągnięto tury 5, NIE zweryfikowana w tej rundzie).
  - git diff --check: exit 0 (przed commitem).
  - Mutacja M4 w tej rundzie: NIE PONOWIONO (applyMilitaryRespektEdgeTick nie zmieniony od r2; wynik r2: exit 1, czerwone T2–T8).
  - Dysk: 3,3 GB wolne po wszystkich buildach. Dispatch wymagał ≥6 GB — NIE SPEŁNIONE; nie usuwałem katalogów /tmp innych sesji. Bundle tej rundy: scratchpad/respekt-r3-dist (do usunięcia przez orkiestratora po FC).

BLOKADY:
  - Pasek / lista dyplomacji / relacjaTotal bez korekty militarnej (Z1) — DECYZJA WŁAŚCICIELA (perspektywa paska: udział gracza vs AI).
  - Realny zapis i wczytanie slotu z polami respektPrzewagaStan / respektMilOffset (Z2) — NIE ZMIERZONO.
  - Czerwone na bazie: city-cession-r3, stol-pw-sum, direct-negotiation-live, L2b diplo-truce-live — dług (poza tematem); bez ponownego pomiaru na bazie w tej rundzie.
  - Mutacja M4 — NIE PONOWIONO w tej rundzie (kod nie zmieniony).

RUNDY: 3/5 (obrona r3)
NASTĘPNY KROK: Evaluator r3 — ocenić Z1 jako „stan udokumentowany, decyzja właściciela” (nie jako błąd kodu) i Z2 jako dług; FC: ustalić, czy 36/0 i dopełnienie 100 ±3 wystarczają dla kryterium (e) bez korekty na pasku. Decyzja ABC do właściciela: perspektywa paska (a/b).
DEPLOY/PUSH: NIE WYKONANO

ZAŁOŻENIA (r3):
  - Perspektywa paska = udział gracza (computeRespekt(gracz, AI)). Ustalona z kodu i pomiaru dopełnienia (85 + 15 = 100), nie z dokumentacji.
  - Korekta trwała i kumulatywna (jak r1/r2) — DO POTWIERDZENIA przez właściciela.

UWAGI-DLA-ORKIESTRATORA:
  - Pre-existing (ten sam problem co Z1): lista dyplomacji (main.ts ~8712, objectiveRespektPctTowardEffective) i relacjaTotal audiencji (audienceRelTotalEffective) nie mają korekty militarnej. Decyzja ABC musi objąć wszystkie trzy miejsca naraz.
  - Pre-existing (jak r1): zdarzenia +5 (wygrana bitwy), +10 (wspólny wróg), +10 (trybut) są nadpisywane pętlą AI tym samym mechanizmem. Osobny temat R-WEB-DIPLO-RESPECT-EVENTS-OVERWRITE-Q1 (nie zakładam go sam).
  - Dysk 3,3 GB (poniżej progu 6 GB z dispatchu). Przy FC zwolnić scratchpad/respekt-r3-dist i zapas z innych worktree.
  - Testy diplo-* nadpisują PNG w cudzych runs/*/evidence — przy FC ignorować lub przywracać z bazy.
