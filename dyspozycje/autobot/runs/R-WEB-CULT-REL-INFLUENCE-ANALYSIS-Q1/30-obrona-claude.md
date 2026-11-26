STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza i propozycja, bez zmian kodu gry)
TEMAT: R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1 (CULTRELANALYSIS #172), runda obrony 1
GOAL: obrona Operatora po Evaluatorze (dfa0883f9): odpowiedź na 9 zarzutów, poprawka modelu i dokumentu.
ZMIANY/COMMIT: baza = kandydat 62128ae7d (detached HEAD). Commit obrony: SHA w polu sha wyniku. Zmienione ścieżki (allowlista): dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md (przepisany), dyspozycje/analizy/model-kultura-religia-entry.ts (nowy, wejście bundla esbuild), dyspozycje/analizy/model-kultura-religia-2026-11-26.py (USUNIĘTY: reimplementacja zastąpiona bundlem), dyspozycje/autobot/runs/R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1/30-obrona-claude.md (ten raport). Zero zmian w gra/**, gra-robocza/, gra-kanon/, rust-port/, WERSJE.md, manifest.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Model w Pythonie usunięty. Nowy model to bundle esbuild@0.24.0 z dyspozycje/analizy/model-kultura-religia-entry.ts, który importuje prawdziwe funkcje gry (computeHappinessBreakdown, computeLawBreakdown, computePorPct, loadRevoltParams, updateRevoltGrace, loadOrderParams). Etykieta „zmierzone" usunięta; wszystkie liczby oznaczone SILNIK (obliczone bundlem, NIE w grze).
2. PRZYJMUJĘ. Bundle liczy wszystkie poziomy: x=7 (neutralny), x=10 (mały), x=16 (duży), dolny próg Szczęścia, garnizon 0–6, epoki 1–3, trudności easy/normal/hard. Tabele A, B, C, E, F w model-out.txt (scratchpad).
3. PRZYJMUJĘ. Wartości 16/23/33 oznaczone jako wybrane stałe, nie mnożnik (23·1,6 = 36,8 ≠ 33). Epoki 2–3 policzone przez silnik (tabela B), nadal bez zatwierdzenia.
4. PRZYJMUJĘ (z dowodem). `clampPct` (society-breakdown.ts:498–505) obcina sumę netto wszystkich linii Szczęścia, a `pctFromNetto` (503–505) i `szPct` (811) są czytane przez Porządek. Dokument opisuje to w §1 i §3 jako konsekwencję i wymaga analizy konsumentów szPct (NIE PRZEANALIZOWANO). Wariant „bez obcięcia" przeniesiony na wariant z dolnym progiem (−50/−100).
5. PRZYJMUJĘ. Dodano kolumnę „tura buntu" (updateRevoltGrace, grace 3 tury) oraz minimum jednostek do progu krytycznego (porzadek_prog_bunt_skrajny_pct: 12 normal, 6 easy, 14 hard). Wynik: bunt skrajny w turze 1 → bunt w turze 5 (n=0, b/c/d). Skutek buntu po jego uruchomieniu NIE PRZEANALIZOWANO.
6. PRZYJMUJĘ w części opisowej. Dodano §1 i §4: udział religii po podboju = 1 − udział poprzedniego właściciela (culture-religion.ts:806–807), konwersja kultury (kultura_konwersja_*), brak limitu czasowego kar. Start udziału KULTURY po podboju NIE SPRAWDZONY; tempo konwersji NIE ZMIERZONO.
7. PRZYJMUJĘ. Świątynia: epokaWejscia 2, wymagania Kamienne kręgi, baza zadowolenie 2 (buildings.json). Rozbieżność z komentarzem „+3" (society-breakdown.ts, pole buildingZadowolenie) zapisana w §5 jako do rozstrzygnięcia. Dodano Garnizon (budynek, prawo_garnizon_budynek_epoka 25/35/47) i Pretorium (epoka 3). Teatr (epokaWejscia 3, suppressed, wliczony w Akademię) i Amfiteatr: NIE MODELOWANE, zapisane w §2 i §7.
8. PRZYJMUJĘ. Trudność easy/hard w tabelach B i E (garnizon 25/15, cap 5/4, prawo_max_epoka 35/55/75 i 45/75/100, wagi 0,55/0,45 i 0,45/0,55). Neutralny d=2 na krawędzi (30,2 wynikał z ręcznego przeliczenia z błędnym mianownikiem; SILNIK: normal, epoka 1, neutralny d bez budynków = 2 jednostki, Por 44,7).
9. PRZYJMUJĘ. Streszczenie przepisane na wartości SILNIKA (pusty pop 5, normal, epoka 1). Różnica a−d w Szczęściu = 43 pkt (nie 60), w Porządku 21,5 pkt (nie 30), bo silnik dolicza podatki −5,6 i inny mianownik Prawa. Ryzyka AI (§5): bez liczb, oznaczone NIE ZMIERZONO.

WYNIKI MODELU (SILNIK, z surowego wyjścia model-out.txt, nie z pamięci):
- Mały, normal, epoka 1, d, bez budynków: n0 Por 0 (bunt skrajny, bunt w turze 5), n1 22,3 (bunt), n2 44,7 (niepokój, neutral). Minimum do neutral: 2; do wyjścia z buntu skrajnego: 1.
- Mały, normal, epoka 1, a (własna + własna), bez budynków: n0 Por 21,5 (bunt), n1 43,8 (neutral). Minimum do neutral: 1.
- Duży BEZ obcięcia, normal, epoka 1, d: >6 do neutral, 4 do wyjścia z buntu skrajnego.
- Duży z dolnym progiem −100, normal, epoka 1, d: 4 do neutral, 3 do wyjścia z buntu skrajnego (z Garnizonem budynek: 3 / 2). Epoka 3 normal: >6 / >6 bez budynków.
- Duży z dolnym progiem −50, normal, epoka 1, d: 3 do neutral, 2 do wyjścia z buntu skrajnego.
- Wniosek: zmiana samego x przy obcięciu od 0% nie zmienia scenariusza d (identycznie jak mały); cel „4 jednostki" w tierze neutralnym wymaga progu poniżej 0%.
- Mianowniki (F): szMax 33,6 = 30 × 1,12 i prawMax 44,8 = 40 × 1,12 dla pop 5 (wszystkie trudności, epoka 1). Podatki (wysokie_podatki) = −5,56 przy domyślnej Zamożności dla wszystkich scenariuszy.

TESTY:
- Bundle: `npx -y esbuild@0.24.0 dyspozycje/analizy/model-kultura-religia-entry.ts --bundle --platform=node --format=cjs --outfile=<scratchpad>/model.cjs --log-level=warning` → EXIT 0.
- Uruchomienie: `node <scratchpad>/model.cjs > <scratchpad>/model-out.txt` → EXIT 0, 629+ linii wyjścia.
- Git: allowlista zachowana; `git diff --check` i `git status` przed commitem: do wykonania (patrz wynik sha).
- Bramki kodu gry: brak (zgodnie z dispatchem); npm run build/dev w gra/ NIE wykonano.

BLOKADY: brak blokad technicznych. Otwarte luki (NIE ZMIERZONO / NIE SPRAWDZONO): start udziału kultury po podboju; tempo konwersji kultury i religii; wpływ świątyni na religię (convertViaTemple); czy haKult i order.ts biorą udział w wyniku; konsumenci szPct przy dolnym progu; skutek buntu po grace; Amfiteatr i Teatr; wpływ na AI, stolice i balans wojen.

UWAGI-DLA-ORKIESTRATORA:
- Propozycja „duży" z rundy 1 została w tej obronie SKORYGOWANA: „4 jednostki" w tierze neutralnym wymaga dolnego progu Szczęścia (np. −100%), a nie samego usunięcia obcięcia (>6 jednostek). Decyzja właściciela (wariant obcięcia i wartość progu) musi przejść turniej C-018 przed pokazaniem właścicielowi.
- Bundle jest budowany npx z rejestru npm (esbuild@0.24.0). Komenda jest w pliku wejścia i w dokumencie §2.
- Prośba o wpis do listy zadań: rozstrzygnięcie rozbieżności „Świątynia +3" vs baza 2 w danych (buildings.json) oraz weryfikacja, czy `cultureHappiness`/`haKult` i `order.ts` biorą udział w turze.
- Proces: nie użyto spawn_task, create_session, create_trigger, send_later, run_in_background. Nie integrowano, nie deployowano, nie pushowano.

NASTĘPNY KROK: Final Control (Sonnet) po commicie obrony; po FC orkiestrator decyduje o ABC wariantu (turniej C-018) i kolejności CULTRELSETTING (#173).
RUNDY: 1/5 (obrona)
DEPLOY/PUSH: NIE WYKONANO
