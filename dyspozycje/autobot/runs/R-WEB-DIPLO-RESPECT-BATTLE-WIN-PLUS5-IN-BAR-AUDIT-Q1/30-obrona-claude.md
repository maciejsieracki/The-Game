STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-BATTLE-WIN-PLUS5-IN-BAR-AUDIT-Q1
GOAL: Zmierzyć, czy „Wygrana bitwy (historia) +5” wchodzi do paska Respektu (A/B/C). Kandydat 274e3a882, baza b2d5b4e51.
ZMIANY-COMMIT: tylko nowy test pomiarowy gra/tools/diplo-respect-battle-win-plus5-test.cjs i ten raport. Kod gry nietknięty (poprawka nie wdrożona: decyzja wymagana). SHA: patrz pole sha.
TESTY: POMIAR (surowe liczby z `node tools/diplo-respect-battle-win-plus5-test.cjs`, czyste funkcje z gry, bez runtime):
- S0 (pts=0 na wygraną): pasek 50->50 po każdej z 4 wygranych; rel.respekt 50->55 zaraz po zdarzeniu, po ticku 50 (t1-t3). +5 nadpisane.
- S1 (pts=60 na wygraną, wartość ZAŁOŻONA): pasek 50->55->59->62->65; rel.respekt po ticku 45/41/38/35.
- Wiring main.ts: tick (~45396) nadpisuje rel.respekt; pasek (~3080, ~27286) czyta powerLine.respekt, nie rel.respekt. Asercje testu: 4/4 OK.
- Bramki: tsc --noEmit 0; logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- Start S0/S1 zakładany: bar=50, potPl=potAI (liczniki zakładane, nie z zapisu gry).
BLOKADY: wartość M pokonanego składu (60) i liczniki imperiów są założone; pomiar w żywej grze/Chromium nie wykonany. Rachunek zrzutu 87 nieweryfikowalny bez P i A z zapisu.
RUNDY: obrona, runda 2/5 (po FAIL Evaluatora, zarzuty 1-4). Decyzja wymagana: tak.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dodano test pomiarowy i powyższe surowe liczby.
2. PRZYJMUJĘ. Potwierdzone w kodzie: power-objective.ts computeObjectivePower, bitwyCoeff=2 dla enemy_m_sum. Pomiar: wygrane podnoszą pasek przez Moc (S1: +15 w 4 wygranych), a samo zdarzenie +5 nie wnosi nic (S0). Opcja A dublowałaby wkład Mocy.
3. PRZYJMUJĘ częściowo. Pasek = round(100*P/(P+A)) + offset (diplomacy.ts computeRespekt; main.ts respektBarWithMilitaryOffset). Bez P i A z zapisu nie rozbijam wartości 87. Wiadomo, że +5 z wygranych nie wchodzi do 87. Offset +15 (przewaga) jest jednorazowy, nie liczony 4 razy.
4. PRZYJMUJĘ. SHA w polu sha. Ścieżka poprawiona: gra/src/ui/diplomacyAudience.ts (w raporcie 10 podano „diplomacyAudience.ts:2418”). Status DECISION_REQUIRED uzasadniony pomiarem (wynik B dla +5), nie brakiem pomiaru.

WNIOSEK: hipoteza B dla samego +5 potwierdzona (zdarzenie nie wchodzi do paska i jest nadpisywane w ticku). Pasek reaguje na wygrane wyłącznie przez Moc (bitwy).

DECISION_REQUIRED — pytanie ABC (po polsku):
A) Dodać +5 za wygraną do paska (zmiana widoczna: ok. +5 za każdą wygraną, +20 po 4 wygranych; ryzyko podwójnego liczenia z Mocą).
B) (rekomendowane) Zostawić wzór; usunąć wpis „Wygrana bitwy +5” z listy „ZA CO CIĘ LUBIĄ”, bo nie wchodzi do paska. Wkład wygranych zostaje w Mocy.
C) Zostawić bez zmian i potwierdzić, że +5 to tylko etykieta historii bojowej.
Niezmierzone: czy +5 wpływa na Relację/zaufanie poza paskiem (nie sprawdzano).

UWAGI-DLA-ORKIESTRATORA (poza zakresem): tick zapisuje rel.respekt = computeRespekt(potAI, potPl), czyli z odwróconą kolejnością argumentów względem paska; w S1 rel.respekt spada 50->35. Nie zbadano, czy ta wartość jest gdziekolwiek czytana.

NASTĘPNY KROK: właściciel wybiera A/B/C; przy A osobny temat z testem przed/po i mutacją.
DEPLOY/PUSH: NIE WYKONANO
