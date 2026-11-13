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
