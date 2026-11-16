# R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 — raport Operatora, runda 1/5

STATUS: BLOCK (częściowe wdrożenie silnika AI↔AI; testy czerwone; gracz NIE objęty pokojem wymuszonym)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1
GOAL: zmęczenie wojną 40 tur do 100%; 80% = AI tylko proponuje pokój z miastami (bez bezwarunkowego końca); 100% = pokój wymuszony, wyraźnie przegrywający oddaje tyle miast, ile trzeba do zrównoważenia ceny; brak wyraźnie przegrywającego = pokój bez miast.
BAZA: origin/main = 0c80544ee (FALA 779). Dispatch czytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md, 9013 B). Dodatek 00-dispatch-DODATEK-claude.md ma 124 B i jest ucięty ("Decyzje ABC właściciela: 40 tur / 800ferta + 100") — specyfikację wzięto z 00-dispatch.md.

## ZMIANY / COMMIT
SHA: patrz pole `sha` w StructuredOutput (commit „R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 r1").
Pliki (allowlista tematu):
- gra/data/war-weariness-params.json — pelneTur 20→40; nowy progWymuszonyPokoj=1,0; progKoncaZmeczenia=0,8 zachowany jako skala krzywej PW (NIE pokój bezwarunkowy); _wzor/_progi/_opis przepisane po polsku (liczby z etykietami w formacie wymaganym przez sync-test).
- gra/src/game/war-weariness.ts — usunięte wearinessUnconditionalEndDue; dodane wearinessForcedPeaceDue(level) = level >= progWymuszonyPokoj; tick runWarWearinessTick: przy >=1,0 pokój wymuszony (action 'forced_peace' zamiast 'mutual_peace'); przegrywający = wyraźnie słabszy (udział <= udzialWyraznie 0,45) i cena > 0 → plan TYLKO miast (planEscalatedPeacePayment bez limitu maxMiastNaPokoj, cap = miasta − minMiastPoOddaniu (3), 0 przy battlePending, cityCessionOk, stolica zakazana przez assets); brak wyraźnie przegrywającego lub cena 0 → pokój bez miast; migracja szczytu: st.peak = min(peak, bieżący poziom) (stary zapis 20-turowy nie wymusza pokoju po wczytaniu).
- gra/src/game/ai.ts — usunięta gałąź „pokój bezwarunkowy" przy zmęczeniu (AI→gracz przy 80% → zostaje istniejąca eskalacja z miastem); usunięty import wearinessUnconditionalEndDue i pole `bezwarunkowy` w typie komendy zaproponuj_pokoj.
- gra/src/main.ts — usunięty odczyt flagi bezwarunkowy (neededPn zawsze z peaceOfferAiRequestPn; peaceBareAllowed = rodzaj === 'rozejm'); usunięte mapowanie '/bezw' w trace.
- gra/tools/diplo-weariness-20-turns-test.cjs — przeskalowane do 40 tur (20/32/40; 2,5%/tura; g: forced_peace w turze 40; g3: przy 80% brak forced). Test zielony 31/0.
- gra/tools/json-descriptions-sync-test.cjs — a1: celowe różnice względem bazy (pelneTur 40, progWymuszonyPokoj); c1: sprawdza wearinessForcedPeaceDue zamiast wearinessUnconditionalEndDue. Test zielony 19/0.

Nie zmieniano: rust-port, WERSJE.md, manifest, gra-robocza, wikiBundle, panel UI, widok (war-weariness-view.ts).

## TESTY
- Baza 0c80544ee (przed zmianą): wszystkie 15 testów zielone (diplo-weariness-* ×8, ai-war-weariness-peace 101/0, diplo-peace-ai-ai-nonnegative 21/0, ai-losing-war-asks-peace 12/0, diplo-peace-weaker-seeks 35/0, json-descriptions-sync 19/0).
- tsc --noEmit (gra/): EXIT 0, 0 linii wyjścia (liczba z surowego wyjścia).
- Po zmianie — ZIELONE: diplo-weariness-20-turns 31/0 (zaktualizowany), json-descriptions-sync 19/0 (zaktualizowany), diplo-truce-r1 31/0, diplo-weariness-display ALL PASSED, diplo-weariness-pw-row-ui 10/0.
- Po zmianie — CZERWONE (świadomie: oczekiwania oparte o skalę 20 tur albo o bezwarunkowy koniec przy 80%; NIE naprawiono w tej rundzie):
  - diplo-weariness-as-pw-peace-item-test: (a) tury 11–16 (skala 20 tur) — FAIL ×6.
  - diplo-weariness-c615-both-cities-test: (e) Z(615) tury 10..16 — 1 FAIL.
  - diplo-weariness-city-only-test: 3 FAIL (c: remis sił bez miasta; e1: „ochrona na końcu zmęczenia 0,8 → pokój bezwarunkowy"; g2: remis sił).
  - diplo-weariness-pw-behavior-test: 17 FAIL (b2 tury 11–15 — skala 20; f: wiersz Z po stronie gracza, tury 15/20).
  - diplo-weariness-unconditional-end-test: czerwony/bez wyniku — test obsoletny (testuje usunięty pokój bezwarunkowy); do usunięcia albo przepisania na pokój wymuszony.
  - ai-war-weariness-peace-test: 'równa wojna 200 tur bez miasta → brak pokoju bez zapłaty' (zmiana 3) — teraz forced_peace (zgodnie z dispatchem: brak wyraźnego przegrywającego → pokój bez miast); cooldown; pelneTur 20 w JSON; stan pary.
  - diplo-peace-ai-ai-nonnegative-test: 4 FAIL W1–W4 (forced_peace omija bramkę nieujemnego bilansu i regułę „jedno miasto nie kupi pokoju").
  - ai-losing-war-asks-peace-vs-player-test: 1 FAIL (1) Harappa — komenda pokojowa przy t≥10 (obsoletne progi 80%).
  - diplo-peace-weaker-seeks-city-only-test: 3 FAIL (h5b, h6, h6b — bezwarunkowy koniec przy 0,8).
  - diplo-peace-balance-accept-test: 1 FAIL (A5 — AI silniejsza proponuje bezwarunkowy przy 20 turach).
  - diplomacy-city-cession-r3-test: 2 FAIL (oddanie 2 miasta przy zmęczeniu; żądanie tury 20 „zmęczenie ≥0,8 wyprzedza").
  Razem czerwone: ok. 40 asercji w 9 plikach. Każdy wymaga decyzji „przeskaluj ×2" albo „przepisz na nowe zachowanie".

## BLOKADY
1. GRACZ (wojna gracz↔AI) przy 100% NIE jest objęty pokojem wymuszonym. Tick obejmuje tylko pary AI↔AI (isMajorAiCivForForcedPeace). Przy 100% w wojnie z graczem ai.ts nie wymusza niczego (wpada w istniejącą eskalację z miastem). Wymagane: wpięcie gracza w tick (lub osobna ścieżka w main.ts) + okno komunikatu „Wojna osiągnęła 100% zmęczenia — pokój wymuszony. Oddajesz/Otrzymujesz: …" + wpis w „Ważne". To jest główna część prośby właściciela — temat NIEZAMKNIĘTY.
2. Panel dyplomacji / war-weariness-view.ts: etapy 50/80/100% i „za ile tur" — NIE zrobione (widok nie zawiera progów).
3. Civpedia/wiki hasło zmęczenia (h) — NIE zrobione (wikiBundle nietknięty). _opis w JSON zaktualizowany.
4. Migracja: mechanizm (clamp szczytu) jest w kodzie; brak dedykowanego testu pkt (b) („szczyt 1,0 przy turze 20 nie wymusza pokoju po wczytaniu").
5. Symulacja ≥3 ziarna × ≥150 tur: NIE ZMIERZONO. Chromium (panel + okno wymuszonego pokoju): NIE ZMIERZONO.
6. Lista długu Rust (g) (REPIN: zmęczenie, pokój wymuszony, tabela PW): NIE sporządzona w tej rundzie.
7. Nowe testy do stałej listy deployu (f): nie dopisano.

## ZAŁOŻENIA / DECYZJE DO POTWIERDZENIA
- ZAŁOŻENIE A (ważne): pokój wymuszony (100%) NIE stosuje bramki nieujemnego bilansu AI↔AI (regula 2026-11-09) i zachodzi także przy cenie 0, przy jednym mieście i przy równej sile. Wynika wprost z dispatchu („musi zabrać pokój"). Koliduje z testami diplo-peace-ai-ai-nonnegative W1–W4 i z zasadą „zmiana 4". DO POTWIERDZENIA przez właściciela/orkiestratora.
- ZAŁOŻENIE B: przy battlePending liczba miast = 0 (pokój bez zapłaty w bieżącej bitwie), jak w istniejącej eskalacji.
- ZAŁOŻENIE C: progKoncaZmeczenia (0,8) zostaje w JSON jako skala krzywej PW (wearinessPeaceX); nie został usunięty, bo tabela PW z niego korzysta i ma własne testy.
- ZAŁOŻENIE D: w pokoju wymuszonym płacą tylko miasta (złoto/surowce wykluczone, zgodnie z CITY-ONLY).
- DO DECYZJI (DECISION_REQUIRED, nie zgadywano): waga miasta +10% przy 40 turach = ok. 4 tury przyspieszenia na miasto zamiast 2 — NIE zmieniono (zgłoszone w dispatchu).
- Pokój wymuszony zmienia event 'mutual_peace' → 'forced_peace' w typie outcome; konsumentów poza testami nie ma (grep po src/).

## NASTĘPNY KROK (runda 2/5)
1. Decyzja orkiestratora/właściciela o ZAŁOŻENIU A (bilans) i o B/D.
2. Wpięcie gracza do wymuszenia (main.ts + okno komunikatu + „Ważne") — największa luka.
3. Przeskalowanie / przepisanie 9 czerwonych testów (lista wyżej); usunięcie lub przepisanie diplo-weariness-unconditional-end-test.
4. Widok etapów (panel) + Civpedia (h) + test migracji (b).
5. Dopiero potem symulacja ≥3×150 tur i Chromium.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch addendum (00-dispatch-DODATEK-claude.md) jest ucięty do 124 B — orkiestrator powinien go uzupełnić przed rundą 2.
- Zmieniony został plik testu wspólny z innymi tematami: gra/tools/json-descriptions-sync-test.cjs (a1/c1). Inne tematy weariness mogą kolidować.
- Wycieki artefaktów testów (.uend-*, .dip-*) w gra/tools — usunięte przed commitem.
- Nie uruchamiano npm run build/dev; użyto tylko `npm ci --ignore-scripts` w gra/ (node_modules usunięto po pracy).

DEPLOY/PUSH: NIE WYKONANO
