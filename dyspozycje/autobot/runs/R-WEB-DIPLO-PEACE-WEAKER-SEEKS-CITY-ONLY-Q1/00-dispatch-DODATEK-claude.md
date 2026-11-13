# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — DODATEK orkiestratora, RUNDA 3/5 (2026-11-13) — CZYTAJ NAJPIERW

FC rundy 2: FAIL, jeden zarzut (NAPRAW): brak dowodu behawioralnego dla okablowania pozycji militarnej w main.ts (diploProposalWarState ok. l.11743 i gateVerdict AI↔AI ok. l.36575). FC odwrócił strony w peaceMilitaryPosition w main.ts i wszystkie testy dyplomacji zostały zielone. KANDYDAT STARTOWY: 7465018358 (kod; raport FC 408c37b6d). Najpierw `git merge --no-ff origin/main` (f0853a6cc po FALACH 682–683: zmiany diplomacy.json i diplomacy.ts) i tsc. Ten sam ID i gałąź robocza. Zakres rundy 3 jest WĄSKI — nie ruszaj reszty.

## Zadanie (jedyne)
1. Wyciągnij wiązanie pozycji militarnej z main.ts do czystej, eksportowanej funkcji w gra/src/game/diplomacy-military-strength.ts (np. buildPeaceMilitaryStance(wejście: id stron, siły, punkty bitew, bonus trybutu, parametry) → { pozycja: 'silniejsza'|'slabsza'|'pasmo', silniejszyId, ... }), użyj jej w OBU miejscach main.ts (diploProposalWarState i gateVerdict AI↔AI) oraz w ai.ts (jeśli ma własne wiązanie) tak, żeby tie-break był jednym kodem. main.ts ma tylko zbierać dane i wywołać funkcję.
2. Mutacje: M12 (odwrócenie stron w nowej funkcji) i M13 (użycie złej strony/tie-breaku w wywołaniu z main.ts — jeśli wywołanie w main.ts da się mutować tylko regexem, dodaj kontrolę strukturalną, która sprawdza, że main.ts NIE liczy już pozycji samodzielnie i że oba miejsca wywołują funkcję z tymi samymi argumentami kolejnością (id własne, id partnera)); mutacje dopisz do gra/tools/diplo-peace-gate-mutation-run.cjs; każda musi zaczerwienić test zachowania lub kontrolę strukturalną. Dodaj test zgodności tie-breaku ai.ts vs main.ts (ten sam wejściowy remis → ta sama strona silniejsza).
3. Usuń martwe mapowanie oferuj_trybut_za_pokoj w diplomacy-proposals.ts i main.ts, jeśli żaden test na nim nie polega (gałąź w ai.ts usunięta w r2); jeśli test polega — zostaw i opisz.
4. Wszystko inne bez zmian (krok 4b — wymuszony pokój po limicie tur — NIE w zakresie).

## Kryteria końca (binarne)
tsc 0; pięć bramek zielone; diplo-peace-weaker-seeks-city-only-test, diplo-peace-balance-accept-test 32/0, diplo-war-peace-main-guard-test 35/0, ai-test 297/0, diplomacy-test, diplo-war-declare-zero-trust-test, diplo-trust-numbers-test, diplo-json-descriptions-sync-test zielone; sim 19/3 (ten sam dług S3, S4b, M_TUR); mutacje M1–M13 wszystkie zabite (surowe wyjście).

---
# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — DODATEK orkiestratora, RUNDA 2/5 (2026-11-13) — CZYTAJ NAJPIERW

Final Control rundy 1: FAIL (raport 92c852b5d). KANDYDAT STARTOWY: f2367587e (kod 063ce970b). Najpierw `git merge --no-ff origin/main` (ed95085a2 po FALI 681; konflikty rozwiąż zachowując obie zmiany, tylko w plikach z allowlisty) i sprawdź tsc. Ten sam ID i ta sama gałąź robocza.

## Decyzje orkiestratora (w mocy decyzji właściciela „tylko miasto jako słodzik”)
D1. ALLOWLISTA ROZSZERZONA o gra/src/game/diplomacy-ai-forced-peace.ts (wymóg AI↔AI „silniejsza przyjmuje tylko za miasto” nie da się spełnić bez niego); wymuszony pokój po limicie tur ma przestrzegać nowej reguły albo być wyraźnie opisany jako mechanizm zmęczenia (krok 4b) — wtedy zostaw i zapisz w raporcie jako NIE ROBIONE w 4a.
D2. Złoto i surowce NIE są dozwolonym słodzikiem pokoju ani rozejmu w żadnym kierunku (także słabsza AI → silniejszy gracz). „Trybut” jako osobna umowa (żądanie danin z Respektem +10) nie jest pokojem i nie podlega tej zmianie.
D3. Z5 (słabsza strona ma ≤ 1 miasto): nie może kupić pokoju/rozejmu (brak miasta do oddania) — zachowaj, opisz w raporcie jako „zostaje do kroku 4b/ochrony przegrywającego” i dodaj test.

## Zarzuty FC do zamknięcia (każdy z dowodem w danych/mutacji)
1. Regresje względem bazy 646d95248: diplo-peace-balance-accept-test 24/5 (A1, A4, A5, B1, C1; baza 29/0) i diplo-war-peace-main-guard-test 32/3 (R3; baza 35/0). Asercje o starej regule (przewaga rw > 20%, „czuje się silniejsze”, mnożnik ceny) przepisz na nową regułę (siła militarna, słabsza szuka, miasto jako słodzik); żaden test nie osłabiony poza tym. sim-test: dług bazowy 3 FAIL (S3, S4b, M_TUR) — nie więcej.
2. Brak dowodu mutacyjnego (h): dla KAŻDEJ bramki egzekwującej nową regułę w evaluatePeaceAiGate, diplomacy-proposals.ts (cityGivePn ≥ basePn), forced-peace, ai.ts (pozycja słabsza/silniejsza), main.ts (pozycjaMilitarna) — mutacja usuwająca bramkę musi zaczerwienić test behawioralny (nie regex). Pokaż surowe wyniki mutacji.
3. Rozejm z miastem słabszej AI niewdrożony: słabsza AI proponuje rozejm i pokój razem z miastem (oferuj_miasto_za_pokoj dla pokoju działa; dodaj rozejm).
4. Testy pasma (progRozniceSilyPokoj > 0) i przypadku jednego miasta (D3).
5. Remis rozstrzygany tak samo w ai.ts i main.ts (naprawione w r1 — utrzymaj, test).

## Kryteria końca runda 2 (binarne)
tsc 0; pięć bramek zielone; diplo-peace-balance-accept-test 29/0 (przepisane asercje), diplo-war-peace-main-guard-test 35/0, diplo-war-peace-sim-test ≤ 3 FAIL (te same), nowy test z mutacjami; raport 10-operator-claude.md.

---
# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — DODATEK orkiestratora (runda 1)

## Decyzje właściciela (2026-11-13), w kolejności
- Miara: SIŁA MILITARNA (armia + rekruci + wygrane bitwy z tej wojny + bonus trybutu) z kroków 2 i 3 (computeMilitaryStrength / compareMilitaryStrength, pomocnik siły narodu w main.ts z kroku 3). Gospodarki nie liczymy.
- Zawsze słabsza militarnie strona szuka rozejmu lub pokoju (także przy małej różnicy siły), silniejsza odrzuca. Przy idealnym remisie rozstrzyga deterministyczna reguła z kroku 2 (nie ma „idealnego remisu”).
- Słabsza musi wyrównać różnicę miastem — to jedyny dozwolony słodzik. Cena miasta liczona w PN dokładnie tak, jak dziś liczy się cenę miast przy pokoju. Żadnych pieniędzy, żadnych surowców, żadnych innych elementów koszyka ofert w roli słodzika pokoju lub rozejmu.
- Nowa reguła zastępuje stare „AI czuje się silniejsze” (rw ≥ 0,55, brak utraty miasta, < 10 tur) oraz mnożnik ceny pokoju od siły (do ×2, ×0,5 dla słabego). ZOSTAJE minimalny czas wojny przed pokojem (1–8 tur). Gracz i AI podlegają tej samej mierze.
- Rozejm 5/10/15 tur i jego tryb propozycji AI (rozejm gdy wojna < 20 tur, potem pokój) bez zmian; te same zasady (słabsza szuka, silniejsza odrzuca, miasto jako słodzik) dotyczą rozejmu.
- W JSON dodaj parametr progu różnicy siły dla pokoju (domyślnie 0 = każda różnica) z opisem po polsku, żeby właściciel mógł go później zmienić na 20%, bez zmiany kodu.

## Wymagane zachowanie
1. Gdy AI jest silniejsza (S_AI > S_gracz): gracz proponuje rozejm/pokój → AI ODRZUCA, chyba że oferta zawiera miasto gracza o wartości PN ≥ wymaganej ceny (cena pokoju liczona jak dotąd, ale bez mnożnika od siły); dozwolona oferta tylko z miast.
2. Gdy AI jest słabsza (S_AI < S_gracz): AI SAMA proponuje rozejm/pokój (zgodnie z istniejącą logiką czasu wojny: rozejm < 20 tur, potem pokój), a propozycja zawiera miasto AI jako słodzik; gracz przyjmuje lub odrzuca (silniejszy gracz nigdy nie jest zmuszony).
3. AI↔AI: słabsza proponuje, silniejsza przyjmuje tylko za miasto.
4. Propozycje, w których słodzikiem są pieniądze lub surowce, są odrzucane lub niegenerowane (oferty wywołane przez przegrywającego w mechanizmie zmęczenia wojną — krok 4b — zostaw bez zmian w tym temacie, tylko opisz w raporcie, co kolidowałoby z nową regułą).
5. Karencja po pokoju, minimalny czas wojny, wiarygodność, okno wczesnej fazy — bez zmian.

## Do zbadania i opisania w raporcie (z plik:linia)
- Wszystkie miejsca: bramka pokoju (evaluatePeaceAiGate lub odpowiednik), cena pokoju i jej mnożnik od siły, „czuje się silniejsze”, generowanie oferty przez AI (ai.ts ok. 7118–7150), skrzynka propozycji gracza, AI↔AI w main.ts; co zostało zastąpione, co zostało.
- Co dzieje się, gdy słabsza strona nie ma miasta do oddania (jedno miasto): zaproponuj zachowanie (np. brak możliwości pokoju do końca wojny albo ochrona z mechanizmu zmęczenia) i zapisz jako założenie, NIE wymyślaj nowej mechaniki.

## Kryteria końca (binarne)
- tsc --noEmit exit 0; pięć bramek: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplomacy-test, diplo-military-strength-test, diplo-war-battle-counter-test, diplo-war-declare-zero-trust-test, diplo-trust-numbers-test bez regresji; testy bramek pokoju (np. diplo-peace-*, diplomacy-proposals-*) zaktualizowane tylko w asercjach o starej regule; diplo-war-peace-sim-test porównany z bazą (dług: 3 FAIL jak na bazie).
- Nowy test gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs: (a) słabsza AI proponuje, silniejszy gracz nie jest zmuszony; (b) silniejsza AI odrzuca ofertę bez miasta; (c) przyjmuje przy mieście o wartości PN ≥ ceny, odrzuca przy mniejszej; (d) oferta ze złotem/surowcami nie przełamuje oporu; (e) minimalny czas wojny nadal blokuje; (f) rozejm i pokój tak samo; (g) remis rozstrzygnięty deterministycznie; (h) każda bramka egzekwująca regułę w ai.ts/diplomacy-proposals.ts/main.ts pokryta mutacją, która czerwieni test zachowania (lekcja W45/W47: usunięcie bramki w kodzie musi zmieniać wynik testu, a nie tylko regex).
- Raport 10-operator-claude.md z tabelą „stare → nowe” i listą założeń.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 5 GB: sprzątaj po sobie (node_modules, zrzuty w /tmp). Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A.
