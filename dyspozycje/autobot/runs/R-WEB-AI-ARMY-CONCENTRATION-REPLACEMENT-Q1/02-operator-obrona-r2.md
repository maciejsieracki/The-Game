STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — AI
TEMAT: R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1
GOAL: Każda cywilizacja AI zbiera armię w jednym miejscu, także armię zastępczą po stratach.
RUNDA: 2/5 (obrona zarzutów Evaluatora R1)

## Odpowiedzi na zarzuty

1. Pangea, cel nieosiągnięty, merge_radius — PRZYJMUJĘ CZĘŚCIOWO, reszta DECYZJA_WYMAGANA.
   Pomiar r1 (1 zestaw ziaren, różne trajektorie) był szumem co do metryk pierwszej armii. Pomiar r2: 8 ziaren sparowanych PRE/POST na TYM SAMYM kodzie
   (PRE = ARS_MUTATE=gate-off), 150 tur (`pomiar-r2-per-ziarno.txt`, `gra/tools/ai-army-replacement-aggregate.cjs`). Pangea fala1: klastry +0.17 [-0.07, 0.40],
   promień +0.04 [-0.63, 0.72], odłączeni +0.01 [-0.01, 0.03] — statystycznie bez zmiany. JEDYNE istotne pogorszenie: shareArmiesOverWars +0.078 [0.020, 0.136]
   (6 ziaren gorsze / 0 lepsze). Mechanizm (hipoteza z kodu, NIE_ZMIERZONO osobno): zbierająca się zastępcza grupa >= 3 w mieście zbiórki tworzy drugi
   rozpoznawany "oddział" równolegle do marszu poprzedniego. Marsz ze skupiska < 3 na pangea: 0.412 -> 0.275 [-0.259, -0.014] (zmiana mniejsza niż na flat).
   Obejścia w ai.ts/army-concentration.ts bez zmiany `merge_radius` (war-allin-params.json) i planera `warAllInCapital.ts` (poza allowlistą) nie ma bez zmiany
   znaczenia "jedna armia". → **DECYZJA_WYMAGANA (do orkiestratora)**: czy dopuścić zmianę `merge_radius`/łączenia grup w `warAllInCapital.ts` (poza allowlistą)
   albo zaakceptować shareArmiesOverWars pangea +0.08 jako koszt. Założenie robocze do czasu decyzji: koszt akceptowalny, bo cel (zbieranie zastępstw) jest osiągnięty na flat (fala2+) i nie pogorszył się na pangea fali 1 poza tą jedną metryką.

2. Pogorszenia fali 1 pominięte, brak uśrednienia/CI — PRZYJMUJĘ. Pełna tabela PRE/POST/różnica sparowana/95% CI/liczba ziaren w `pomiar-r2-per-ziarno.txt`.
   Flat fala1: klastry +0.17 [-0.08, 0.42], promień +0.59 [-0.24, 1.43] (6 ziaren gorsze/1 lepsze; CI zawiera 0 — brak dowodu pogorszenia, ale trend niekorzystny),
   mediana tur do dołączenia fala1 4 -> 9 (n=2 ziarna z danymi, CI bez wartości — NIE_ZMIERZONO rzetelnie, tylko ~0-3 zdarzeń/ziarno), fala1.neverJoined 0.72 -> 0.00 (poprawa).
   Fala2+ flat (to jest właściwy cel): klastry 3.42 -> 2.85 [-0.90, -0.26], promień 8.21 -> 7.31 [-1.71, -0.09], odłączeni 0.38 -> 0.33 [-0.08, -0.02],
   czas do dołączenia mean 2.30 -> 1.74 — wszystkie istotne, 7-8/8 ziaren lepsze. Fala2+ pangea: wyniki z 6 ziaren, CI szerokie (promień +1.49 [-2.9, 5.8], overWars +0.22 [-0.02, 0.45]) — niejednoznaczne, NIE dowód poprawy.
   Poprawka błędu raportu r1: nagłówek cytował korzystne wartości; r1 mylił się w "pogorszeniach fali 1 flat" jako szumie — w r2 pokazane z CI.

3. Zastój (brak limitu oczekiwania, <3 jednostek) — PRZYJMUJĘ, naprawione kodem + testem.
   `army-concentration.ts`: `WAR_REPLACEMENT_RALLY_MAX_WAIT_TURNS = 6` (tury, gdy WSZYSTKIE luźne jednostki stoją już w mieście zbiórki, a próg niezebrany)
   oraz `WAR_REPLACEMENT_RALLY_MAX_LOOSE_TURNS = 30` (łączny wiek luźnej jednostki, np. pętla w tranzycie). Zwolnienie lepkie (brak oscylacji), stan czyszczony
   gdy jednostka dołączy do skupiska >= 3. Stan: mapa modułowa klucz `ownerId:unitId`, `resetReplacementRallyState()`; reset przy restarcie procesu tylko wydłuża czekanie.
   Założenie (jawne): AI z łącznie < 3 jednostek też najpierw czeka (kolejne rekruty mogą dołączyć), koszt <= 6 tur jednorazowo — odrzuciłem regułę "łącznie <3 = brak bramki",
   bo wysyłałaby pierwsze 2 zastępstwa pojedynczo (dokładnie zgłoszony problem; wykazał to scenariusz S2). Testy: S3 (jedyna jednostka i para bez uzupełnienia ruszają w <= 8 t),
   S4a (limit czekania = 6 dokładnie, nie biegnie gdy ktoś jest w drodze, lepkość, limit wieku 30), S4b (żywa pętla decideAITurn: para + trzecia nigdy nie docierająca rusza <= t=32).
   Skok `no-move|city-waiting` w pomiarze (flat 190 -> 1010 jednostko-tur z 8 ziaren, pangea 29 -> 540) to zamierzone oczekiwanie ograniczone limitem; w pomiarze r2 po limicie jednostki ruszają
   (relWait w instrumentacji: 3-104 jednostko-tur/ziarno). Nadal NIE_ZMIERZONO: łączny czas oczekiwania per jednostka (rozkład).

4. Brak pomiaru per cywilizacja/archetyp, histogram plik:linia, symulacja z atrapami, kontynenty — PRZYJMUJĘ CZĘŚCIOWO.
   Per cywilizacja (indeks 1-4, 8 ziaren, tabela w `pomiar-r2-per-ziarno.txt`): flat — odłączeni i promień spadają u civ 1,2,4, civ3 promień 7.08 -> 7.26 (bez zmiany), klastry spadają u wszystkich;
   pangea — civ1-3 promień/odłączeni lekko rosną (np. civ3 odłączeni 0.362 -> 0.408), civ4 bez zmiany. W symulacji wszystkie cywilizacje mają `civType: 'grecy'` (sim.cjs:228),
   więc archetypy: NIE_ZMIERZONO (to ograniczenie harnessu, nie wynik). Histogram przyczyn z plik:linia: sposób wyznaczenia komendy ruchu (`warAllInCapital.ts:661/:699` przed, `ai.ts` bramka/fallback po);
   instrumentacja jednorazowa na pangea seed 1-3 (kod cofnięty): pozostały marsz par/pojedynczych PO to (a) zwolnienia limitem czekania (`army-concentration.ts` zwolnienie lepkie; 3/24/104 jednostko-tur),
   (b) fallback braku trasy do miasta zbiórki (ai.ts, `step === null`; 0/68/10 jednostko-tur) i (c) reszta NIE_ZMIERZONO (seed 1: ~84 marszy bez (a)/(b);
   hipoteza: różnica klasteryzacji bramki — jednostki eligible+keep — i harnessu — wszystkie własne jednostki bojowe, oraz rozbicie skupiska w trakcie ruchu).
   Pełne gry w przeglądarce nadal NIE_ZMIERZONO (~30 s/turę, nierealne w tej turze); symulacja z atrapami rekrutacji/walki to jedyny pomiar zachowania ruchu.
   Kontynenty: 0 fal, wynik identyczny PRE/POST (r1) — dowód per typ świata jest tylko dla flat i pangea; kontynenty NIE_ZMIERZONO.

5. `war-allin-march|pair` 629 / singleton 283 PO; test nie pokrywa fallbacku braku trasy — PRZYJMUJĘ.
   Przyczyny rozbite w pkt 4. Nowy test S5: miasto zbiórki otoczone morzem -> każda z 3 jednostek bez trasy dostaje komendę marszu na cel (nie jest porzucona),
   żadna komenda nie prowadzi do miasta zbiórki, komendy zbliżają do celu (3/3 ruchów). Pokrycie fallbacku przez przebieg `firstStep === null` potwierdzone wynikiem testu (PASS), nie osobnym licznikiem w kodzie produkcyjnym.

6. Mutacja łamliwa, brak RED na bazie, brak asercji na metryki pierwszej armii — ODRZUCAM CZĘŚCIOWO / PRZYJMUJĘ CZĘŚCIOWO.
   - Mutacja przez podmianę literału GATE_ON: łamliwość to zamierzony kompromis — test rzuca wyraźny błąd ("nie znaleziono dokładnie jednej bramki"), gdy linia się zmieni, zamiast cicho przejść
     (przy fałszywej mutacji test byłby zielony bez dowodu). ODRZUCAM jako błąd; zostawiam jawną porażkę. RED na kodzie bazowym: funkcje `planWarReplacementRally`/`resetReplacementRallyState` nie istnieją w bazie,
     test nie ładuje się (TypeError) — formalnie RED; dowód zachowaniowy RED = mutacja S1/S2 (naruszeń > 0) i pomiar bramka wyłączona 0.124 vs 0.025.
   - Asercje na metryki pierwszej armii — PRZYJMUJĘ jako uwagę: dodałem do raportu mierzalną regułę (CI w `pomiar-r2-per-ziarno.txt`), ale NIE dodaję asercji bramkowej na klastry/promień pierwszej armii,
     bo pomiar jest szumowy (CI zawierają 0, a symulacja jest atrapą); to byłaby test niestabilny. Zamiast tego S1 sprawdza "skupisko powstaje, dopiero po nim marsz" oraz że zebrana armia startuje w t=1 (regresja).
   - Poprawka asercji S1/S2: naruszenia liczone DO pierwszego legalnego startu skupiska >= 3 (po nim para bez uzupełnienia jest z zamysłu zwalniana limitem — S4).

## ZMIANY/COMMIT
Commit r2: patrz SHA w NASTĘPNY KROK / odpowiedzi orkiestratora (lokalny, bez push). Zmienione: `gra/src/game/army-concentration.ts`, `gra/src/game/ai.ts` (2 linie: parametr `currentTurn` + opcje),
`gra/tools/ai-army-replacement-concentration-test.cjs`, nowy `gra/tools/ai-army-replacement-aggregate.cjs`, `dyspozycje/autobot/runs/R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1/**`.
Zero zmian: gra-robocza, WERSJE.md, rust-port, ai-params.json, warAllInCapital.ts, war-allin-params.json.

## TESTY
- tsc --noEmit EXIT=0 (`gate-tsc-r2.txt`).
- ai-army-replacement-concentration-test 34/34 EXIT=0 (`gate-replacement-test-r2.txt`), mutacja S1/S2 łamie test, pomiar 2 ziarna x 70 tur: marsz poniżej progu 0.025 (bez bramki 0.124), ms/turę AI bez wzrostu.
- Regresja r2 (`gate-regresja-r2.txt`): army-concentration 56/0, army-consolidation OK, army-consolidation-e2e 6/0, army-recruitment-concentration 29/0, ai-general-war-campaign 51/0, ai-war-gate 24/0, army-merge-bounce 4/0;
  war-allin-capital-test 94/4 (jak baza — r1 potwierdził na HEAD), ai-siege-requires-war-test 47/1 — TEN SAM wynik na bazie b89ecee44 (sprawdzone podmianą plików), nie z mojej zmiany.
  Pełne 134 pliki r1 NIE powtórzone w r2 (zmiany r2 dotykają tylko bramki luźnych jednostek).
- Pomiar 8 ziaren x 150 tur x {flat, pangea}, PRE/POST sparowane: `pomiar-r2-per-ziarno.txt`.

## BLOKADY
DECYZJA_WYMAGANA (orkiestrator): pangea shareArmiesOverWars +0.078 (istotne) — wymaga zmiany poza allowlistą (`warAllInCapital.ts`/`merge_radius`) albo akceptacji kosztu. Nie zadano ABC.

## RUNDY
2/5. Ostatni werdykt: FAIL (Evaluator R1) -> obrona r2.

## NASTĘPNY KROK
Evaluator R2: pkt 1 (decyzja o merge_radius) i pkt 4 (archetypy NIE_ZMIERZONO).
DEPLOY/PUSH: NIE WYKONANO
