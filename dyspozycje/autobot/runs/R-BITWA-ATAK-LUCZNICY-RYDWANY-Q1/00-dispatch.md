# AutoBot dispatch — łucznicy i rydwany nie uczestniczą skutecznie w bitwie

TEMAT: `R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1`
DATA: 2026-10-28
STATUS: OPERATOR — ROZPOZNANIE / NAPRAWA
MODEL + EFFORT: Operator GPT-6 Luna Medium; następnie niezależny Evaluator GPT-6 Luna Medium i Final Control GPT-6 Luna Medium.

## ZGŁOSZENIE WŁAŚCICIELA
W testach/playteście łucznicy często nie dołączają do walki: utrzymują nadmierny dystans lub cofają się i przez to nie używają się skutecznie. Rydwany (w zgłoszeniu: „redwani”) w Ataku stoją bezczynnie; zwarta linia nie może blokować ich działania. Właściciel oczekuje, że ruch dystansowych pozwoli im walczyć z bezpiecznej pozycji, ale będzie zbliżał je do przeciwnika w obrębie własnego ugrupowania, bez ucieczki i bez pozostawania poza walką. Rydwany/konnica mają realizować uzgodnione działanie z boku lub od tyłu zależnie od doktryny/typu ataku, a ograniczenie równej linii piechoty nie może ich unieruchamiać.

## ZATWIERDZONY KONTRAKT DOKTRYN
- **Atak:** piechota idzie uporządkowanie do przodu; dystansowi podążają za linią, nie wyprzedzają jej ani nie uciekają od walki; konnica i rydwany zachowują skrzydłową rolę/atakują w zasięgu działania swojej broni.
- **Obrona:** piechota i dystansowi utrzymują pozycję/linię; konnica i rydwany zachowują możliwość osłony skrzydeł i reakcji bojowej zgodnej z istniejącym kontraktem.
- **Szturm:** każda jednostka naciera indywidualnie na najbliższy osiągalny cel; ruch chaotyczny i wyprzedzanie są zamierzone.
- Nie zmieniać tego, że gracz wybiera tryb bitwy automatycznej/ręcznej przed wejściem do pola bitwy; to osobny temat.

## ZADANIE OPERATORA
1. Odtworzyć z produkcyjnych metod w `battleScene.ts` przypadek łucznika, który odsuwa się/nie podchodzi oraz rydwanu zablokowanego przez Atakową zwartą linię.
2. Ustalić dokładną przyczynę dla każdej roli i każdej doktryny; odróżnić brak legalnego ruchu/strzału, rezerwę dystansu, kolizję, blokadę formacji i błędną klasyfikację jednostki.
3. Dodać test regresyjny testujący produkcyjne planowanie/move candidates (nie wyłącznie kopię reguły). Potwierdzić, że strzały faktycznie mogą być wykonane w zasięgu, dystansowi nie uciekają, rydwan dostaje legalny krok/atak, a zwarta linia ogranicza wyłącznie właściwe role.
4. Naprawić tylko znaleziony defekt w najmniejszym zakresie i zapisać dokładne ograniczenia fixture.

## ALLOWLISTA
- `gra/src/battle/battleScene.ts` — tylko potwierdzone poprawki zachowania taktycznego.
- testy skupione na planowaniu/ruchu/aktywacji bitwy w `gra/tools/`.
- raporty tego runu i właściwe wpisy rejestru błędów.

Zakaz: zmian ekonomii, AI kampanii strategicznej, mapy/rozstawienia początkowego, morale i statystyk jednostek; nie rozszerzać roli Obrony/Szturmu bez reproduktora; brak commitu, merge, pushu i deployu z etapu operatora.

## BRAMKI
Operator → niezależny Evaluator (odtworzenie i review diffu) → Final Control. Bez twierdzenia „naprawione” przed przejściem niezależnych bramek. Jeśli nie da się odtworzyć, raport zawiera dokładne limity i operator nie wprowadza spekulacyjnych zmian.
