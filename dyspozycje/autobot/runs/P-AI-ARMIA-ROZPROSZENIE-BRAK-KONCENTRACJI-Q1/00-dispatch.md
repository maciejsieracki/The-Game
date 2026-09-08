STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1
GOAL: Zdiagnozuj i napraw brak realnej koncentracji armii AI w jedną dużą siłę — właściciel
obserwuje totalne rozproszenie jednostek zamiast łączenia w jedną armię (dzieloną tylko przy
zagrożeniu z dwóch stron), mimo istniejącego, już wdrożonego mechanizmu koncentracji.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne): "Cywilizacje AI miały łączyć wszystkie swoje armie w
  jedną dużą armię, ewentualnie dzielić ją tylko wtedy, gdy mają zagrożenie z dwóch stron. W
  tym momencie jest jednak totalne rozproszenie jednostek, co powoduje utratę możliwości
  uderzenia większą armią i przewagi od razu na starcie, ponieważ przyjęliśmy nową zasadę, że
  większa armia ma większe szanse, likwiduje morale i łatwiej okrąża przeciwnika."
- Świeżo zweryfikowany przez orkiestratora: mechanizm koncentracji armii JUŻ ISTNIEJE i jest
  rozbudowany (`gra/src/game/army-concentration.ts`, funkcje `planArmyConcentration`/
  `planArmyFrontMerge`/`clusterUnitsByProximity`, stała `ARMY_CONCENTRATION_RADIUS`), wołany z
  `gra/src/game/ai.ts` w co najmniej trzech miejscach powiązanych z osobnymi, udokumentowanymi
  decyzjami: `R-ARMIA-KONCENTRACJA-AI-BARB-Q1` (major AI, ok. linia 3119-3155),
  `R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1` (łączenie WIELU klastrów przez
  `planArmyFrontMerge`, ok. linia 3156-3203), oraz osobna kopia dla miast-państw/kopii
  obronnych wewnątrz `decideDefensiveCopyTurn` (ok. linia 3773-3801, celowo NIŻSZY priorytet
  niż u głównych cywilizacji — komentarz ok. 3784-3796). Bramka wejściowa:
  `canConcentrateArmy(opts)` (ok. linia 1184-1186) — dość szeroka (`isMajorAiOwner(opts) ||
  opts.cityStateOffensiveSupport === true`), więc sam gate raczej NIE jest przyczyną braku
  koncentracji dla głównych cywilizacji AI — zweryfikuj to jednak świeżo, nie zakładaj.
- NIE zakładaj z góry która część łańcucha zawodzi — sprawdź WSZYSTKIE poniższe kandydatury
  świeżym Read/symulacją, każdą osobno:
  a. `ARMY_CONCENTRATION_RADIUS` (promień, w którym `planArmyConcentration` w ogóle uznaje
     jednostki za "swój klaster" do połączenia) może być zbyt MAŁY względem typowych
     odległości między garnizonami miast na dużej mapie — jeśli jednostki są rozsiane po
     odległych miastach, a promień obejmuje tylko kilka heksów, mechanizm nigdy realnie ich
     nie zbierze w jedną armię, mimo że kod "działa zgodnie z projektem" w wąskim sensie.
  b. Kolejność/priorytet w głównej pętli decyzyjnej jednostki (`ai.ts` ok. 3119-3210) — czy
     KAŻDA jednostka faktycznie trafia pod `planArmyConcentration`/`planArmyFrontMerge`, czy
     inne, wyżej priorytetowe ścieżki (obrona domu, marsz ofensywny na konkretny cel, patrol)
     przechwytują większość jednostek WCZEŚNIEJ, zanim dotrą do logiki koncentracji — jeśli
     tak, koncentracja jest formalnie "wołana", ale realnie prawie nigdy nic nie robi.
  c. `isLocalExpansionPhase`/`clusterConsolidationPhase` i inne fazy AI (sprawdzone w
     równoległych tematach tej sesji, np. `P-AI-EKSPANSJA-ODBUDOWA-MIAST-PO-WOJNIE-Q1`) mogą
     interferować z fazą koncentracji wojskowej w sposób, który rozprasza jednostki (np.
     każde nowe miasto dostaje własny garnizon obronny, nigdy nieoddawany do głównej armii).
  d. Sprawdź czy "nowa zasada" wspomniana przez właściciela (większa armia = większe szanse
     w walce, redukcja morale przeciwnika, łatwiejsze okrążanie) jest już zaimplementowana w
     silniku walki (`gra/src/battle/`) i czy AI w ogóle ma świadomość/wagę tej zasady przy
     decyzji "łączyć czy nie" — jeśli mechanizm koncentracji nie bierze pod uwagę korzyści z
     rozmiaru armii przy wyborze celu/momentu ataku, może "technicznie działać" a i tak
     prowadzić do rozproszenia w praktycznych scenariuszach.
  e. Rozróżnij WYRAŹNIE głównego AI (`isMajorAiOwner`) od miast-państw/kopii obronnych — jeśli
     rozproszenie dotyczy głównie miast-państw, przypomnij że mają CELOWO niższy priorytet
     koncentracji (komentarz ok. 3784-3796) — to może być zamierzone, nie bug; jeśli dotyczy
     głównych cywilizacji, to jest realny problem.

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja wielu tur (wzorem innych tematów tej sesji,
   np. `diag-*.cjs` w `dyspozycje/autobot/runs/P-AI-*`): cywilizacja AI z kilkoma miastami i
   jednostkami wojskowymi rozsianymi po terytorium, brak bezpośredniego zagrożenia z dwóch
   stron naraz, symulacja N tur. Zmierz: czy jednostki faktycznie konsolidują się w jedną
   (albo niewiele) grupę(-y), czy pozostają rozproszone — policz liczbę odrębnych klastrów
   jednostek (`clusterUnitsByProximity`) w czasie.
2. Ustal DOKŁADNĄ przyczynę (może być więcej niż jedna z pięciu kandydatur wyżej) z dowodem.
3. Napraw źródło problemu — jeśli przyczyna to promień zbyt mały (a), rozważ zwiększenie GO
   TYLKO jeśli masz dowód że to faktycznie rozwiązuje problem bez nieproporcjonalnych skutków
   ubocznych (np. jednostki teleportujące się/maszerujące absurdalnie daleko) — jeśli zmiana
   wymaga nowej liczby balansu bez jasnego, bezpiecznego zakresu, ZATRZYMAJ SIĘ i zgłoś ABC
   zamiast zgadywać wartość. Jeśli przyczyna to kolejność priorytetów (b) lub interferencja
   faz (c), popraw kolejność/warunki tak, by koncentracja faktycznie miała szansę zadziałać
   dla większości garnizonów, nie tylko formalnie się wykonywać.
4. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1 — po naprawie liczba odrębnych klastrów
   jednostek AI powinna być wyraźnie mniejsza (armia bardziej skonsolidowana), przy zachowaniu
   zdolności do podziału gdy zagrożenie faktycznie nadchodzi z dwóch różnych kierunków
   jednocześnie (nie psuj tego scenariusza obronnego).

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt przyczyny (z dowodem — symulacja, nie
domysł). AI konsoliduje jednostki w wyraźnie mniejszą liczbę większych grup w typowym
scenariuszu bez zagrożenia z dwóch stron, potwierdzone PRZED/PO. Scenariusz podziału przy
realnym zagrożeniu z dwóch kierunków nadal działa (brak regresji). `tsc --noEmit` czysty, 5
bramek referencyjnych zielone, istniejące testy koncentracji armii (jeśli są, plik z
"concentration"/"koncentracja" w nazwie w `gra/tools/`) nadal zielone lub świadomie
rozszerzone.

ALLOWLISTA:
- `gra/src/game/army-concentration.ts` (WYŁĄCZNIE jeśli diagnoza wskaże że przyczyna leży
  tutaj — np. promień/próg klastrowania)
- `gra/src/game/ai.ts` (WYŁĄCZNIE kolejność/warunki wołania `planArmyConcentration`/
  `planArmyFrontMerge` w głównej pętli decyzyjnej — nie przepisuj całej logiki AI)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1/*`
Zakaz `git add -A`. Zakaz zmiany zachowania miast-państw/kopii obronnych (celowo niższy
priorytet koncentracji, osobna, udokumentowana decyzja) chyba że diagnoza wprost pokaże że
TO jest źródło zgłoszenia właściciela — wtedy zatrzymaj się i zgłoś ABC zamiast cicho zmieniać
priorytet.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji wielu tur (nie samo czytanie kodu i domysł — istniejący mechanizm WYGLĄDA
kompletnie na papierze, właściciel zgłasza że w praktyce nie działa, więc czytanie kodu bez
symulacji nic nie rozstrzygnie). Zakaz deklaracji "naprawiono koncentrację" bez dowodu że
faktyczna liczba klastrów jednostek maleje w symulacji, nie tylko że funkcja jest wołana
częściej.

IZOLACJA: worktree `/home/user/wt-ai-armia-koncentracja`, gałąź
`autobot/P-AI-ARMIA-ROZPROSZENIE-BRAK-KONCENTRACJI-Q1`, baza `origin/main` @ `5f0fa0e8`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
