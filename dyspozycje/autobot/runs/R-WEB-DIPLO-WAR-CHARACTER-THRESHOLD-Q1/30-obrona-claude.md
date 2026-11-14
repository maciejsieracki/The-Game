# R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1
GOAL: Charakter cywilizacji przesuwa próg przewagi siły militarnej do wypowiedzenia wojny przez AI (agresywna przy mniejszej przewadze, ostrożna przy większej). Baza 20% z JSON, przesunięcie z bias.warSilaBonus, clamp [10%, 35%]. Bez zmian kodu produkcyjnego w tej obronie; zmieniony jest wyłącznie test i raport.
BAZA: d1ebe5aeb (kandydat Operatora, runda 1). Commit obrony: 195d9a1fb (ponad d1ebe5aeb zmieniony jest tylko gra/tools/diplo-war-character-threshold-test.cjs, +25 linii; `git diff --stat d1ebe5aeb HEAD` potwierdza).

## 1. Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — błędne twierdzenie o diplo-war-peace-sim (2 FAIL zamiast 3)
PRZYJMUJĘ. Raport Operatora (10-operator-claude.md, sekcja 4 i 6) był błędny: S3 nie przeszło.
Dowód (surowe wyjście `node tools/diplo-war-peace-sim-test.cjs` na d1ebe5aeb i na 5a50a5958):
- `FAIL: S3: gracz (silna AI, bez utraty) dostaje „czuje się silniejsze" w turach 7-9 (po minTur 7) — [...]`
- `FAIL: S4b: kontrola — bez utraty w turze 8 odrzucenie „silniejsze" jest — [...]`
- `FAIL: M_TUR wykryty: bez bramki minTurWojny AI składa propozycję w turze 1 (S1/S7b padają) — [...]`
- `diplo-war-peace-sim-test: 19 pass / 3 fail`
Wynik na bazie 5a50a5958 jest identyczny: te same trzy FAIL, `19 pass / 3 fail`. Zgodne z dispatchem (dług #352: S3, S4b, M_TUR), czyli kryterium „≤ 3 FAIL" jest spełnione, ale zdanie o „2 FAIL, S3 przeszło" z raportu 10-operator jest nieprawdziwe i zostaje sprostowane tutaj.

### Zarzut 2 — 14/20/28 zamiast 15/20/30 z dispatchu
ODRZUCAM zmianę kodu, PRZYJMUJĘ jawne przedstawienie do decyzji właściciela.
Uzasadnienie (liczby, nie przypuszczenia):
- Dawne bonusy z resolveDiplomacyCivBias (ai.ts, l. 6736–6790) to: agresywna −0,06 (tolerancja < 7) lub −0,10 (tolerancja ≥ 7), ostrożna +0,08, neutralna 0.
- Dispatch wymaga mapowania liniowego z jednym współczynnikiem (krok 2: „Mapowanie liniowe, jawne w JSON (współczynnik + zakres)"). Przy jednym współczynniku k: 20 + k·(−0,06) = 15 daje k ≈ 83,3; 20 + k·(+0,08) = 30 daje k = 125. Oba wymagania jednocześnie są niemożliwe.
- Uzyskanie 15/30 wymagałoby dwóch współczynników (osobno dla strony ujemnej i dodatniej) — to zmiana specyfikacji, a nie poprawka błędu, więc nie wprowadzam jej samodzielnie.
- Test scenariusza z dispatchu (przewaga 18/25/32) daje te same rozstrzygnięcia przy 14/20/28 jak przy 15/20/30 (18 ≥ 14 wypowiada, 18 < 20 i 18 < 28 nie; 25 ≥ 20 wypowiada, 25 < 28 nie; 32 ≥ 28 wypowiada). Test w gra/tools/diplo-war-character-threshold-test.cjs sekcja (b) to sprawdza.
Opcje dla właściciela (bez zmiany kodu w tej rundzie): (A) zatwierdzić 14/20/28 i zakres 10–35 — rekomendacja, bo wartości wynikają z istniejących danych charakteru; (B) dwa współczynniki (osobno ujemny i dodatni) dla osiągnięcia 15/30 — wymaga nowego ABC; (C) zmiana zakresu lub współczynnika w gra/data/diplomacy-war-peace-params.json (`przesuniecieProguWojnyCharakter.wspolczynnikPpNaJednostke`, `min`, `max`) bez zmiany kodu.

### Zarzut 3 — brak tabeli cywilizacja → przesunięcie → efektywny próg
PRZYJMUJĘ. Tabela dla wszystkich 15 cywilizacji z data/civ-ai.json jest w sekcji 2 niniejszego raportu. Wartości zweryfikowałem (skrypt Pythona na civ-ai.json według reguł resolveDiplomacyCivBias, plus asercja w teście, sekcja (g), 15/15 OK). Zgadza się z zarzutem Evaluatora.

### Zarzut 4 — niskie pokrycie testu (granice ≥/>, brak realnych cywilizacji)
PRZYJMUJĘ. Dodano w gra/tools/diplo-war-character-threshold-test.cjs (commit 195d9a1fb):
- sekcja (f): przewaga dokładnie 14% (agresywna) i 28% (ostrożna) → wypowiedzenie (granica ≥, zgodna z `sa * 100 >= sb * prog` w diplomacy-military-strength.ts l. 114); przewaga 13% i 27% → brak.
- sekcja (g): wszystkie 15 cywilizacji z civ-ai.json, oczekiwany efektywny próg z tabeli.
Wynik: `diplo-war-character-threshold-test: 42 OK, 0 FAIL` (przed rozszerzeniem: 22 OK).
Mutacja (MUTATE_SHIFT=1, współczynnik = 0): `25 OK, 17 FAIL` (przed rozszerzeniem: 16 OK, 6 FAIL). Test pozostaje zachowaniowy (decideAIDiplomacy), nie tylko regex.

### Zarzut 5 — hamulec zerowego zaufania w main.ts nadal używa 20%; origin/main przesunął się
ODRZUCAM jako zarzut blokujący (informacja przyjęta do wiadomości).
- Dowód zgodności z dispatchem: DODATEK, krok 3: „wojna przy zerowym zaufaniu przez N tur dla silniejszej strony działa niezależnie od przesunięcia (przewaga „o włos" wystarcza)". Hamulec w main.ts (militaryBrakeOutcome, progPrzewagiProc z diplomacy-military-strength-params.json = 20) jest więc zgodny z tą regułą. Zakaz z dispatchu wyklucza zmianę main.ts.
- Komentarz do zarzutu: przy agresywnej AI przewaga 14–19% wypowiada wojnę tylko przez ścieżkę Zaufanie < 30 (decideAIDiplomacy), nie przez hamulec zerowego zaufania. Zachowanie to zapisane w raporcie Operatora (sekcja 5) i w teście (d)/(e).
- origin/main: w momencie obrony origin/main = ec86239a7 (FALA 684), a bazą jest d1ebe5aeb, który zawiera f0853a6cc. Konflikt merge NIE sprawdzony w tej rundzie — NIE_ZMIERZONO; integracja należy do orkiestratora.

## 2. Tabela: cywilizacja → archetyp → przesunięcie → efektywny próg (do zatwierdzenia przez właściciela)

Wzór: próg = clamp(20 + 100 × warSilaBonus, 10, 35). Dane: data/civ-ai.json (agresywnosc, sklonnoscDoPodboju, tolerancjaRyzyka); main.ts l. 42584 przekazuje je do resolveDiplomacyCivBias jako agresywnoscRaw, sklonnoscDoPodboju, tolerancjaRyzyka.

| Cywilizacja | agresywnosc | pod. | tolerancja | Archetyp | warSilaBonus | Przesunięcie (pp) | Efektywny próg |
|---|---|---|---|---|---|---|---|
| Chińczycy | 2 | 1 | 2 | ostrożna | +0,08 | +8 | 28% |
| Sumerowie | 3 | 2 | 3 | ostrożna | +0,08 | +8 | 28% |
| Harappa | 2 | 2 | 4 | ostrożna | +0,08 | +8 | 28% |
| Fenicjanie | 3 | 2 | 3 | ostrożna | +0,08 | +8 | 28% |
| Grecy | 4 | 2 | 4 | neutralna | 0 | 0 | 20% |
| Inkowie | 4 | 3 | 4 | neutralna | 0 | 0 | 20% |
| Egipt | 4 | 2 | 4 | neutralna | 0 | 0 | 20% |
| Hetyci | 5 | 2 | 4 | neutralna | 0 | 0 | 20% |
| Słowianie | 6 | 3 | 4 | neutralna | 0 | 0 | 20% |
| Babilonia | 4 | 2 | 4 | neutralna | 0 | 0 | 20% |
| Celtowie | 6 | 4 | 6 | agresywna | −0,06 | −6 | 14% |
| Germanie | 6 | 4 | 6 | agresywna | −0,06 | −6 | 14% |
| Asyria | 8 | 5 | 4 | agresywna | −0,06 | −6 | 14% |
| Rzymianie | 8 | 4 | 8 | agresywna, tolerancja ≥ 7 | −0,10 | −10 | 10% (dolna granica) |
| Zulusi | 9 | 5 | 9 | agresywna, tolerancja ≥ 7 | −0,10 | −10 | 10% (dolna granica) |

Uwaga: Słowianie (agresywnosc 6, pod. 3) i Asyria (pod. 5) są w tabeli, bo agresywnosc ≥ 7 lub pod ≥ 4 decyduje o archetypie agresywnym (Asyria: pod 5 ≥ 4). Słowianie: agresywnosc 6 < 7 i pod 3 < 4, więc są neutralni — to zgodne z kodem, nie błąd.

Poprzednia tabela w 10-operator-claude.md (sekcja 3) opisywała tylko archetypy; ta zastępuje ją kompletną listą.

## 3. Testy (surowe wyniki w tej rundzie)

- `node tools/diplo-war-character-threshold-test.cjs` → `diplo-war-character-threshold-test: 42 OK, 0 FAIL`, exit 0.
- `MUTATE_SHIFT=1 node tools/diplo-war-character-threshold-test.cjs` → `[MUTACJA]: 25 OK, 17 FAIL`, exit 1 (czerwone jest m.in. zachowanie na decideAIDiplomacy).
- `node tools/diplo-war-peace-sim-test.cjs` na 195d9a1fb (= d1ebe5aeb w kodzie) → `19 pass / 3 fail` (FAIL: S3, S4b, M_TUR).
- `node tools/diplo-war-peace-sim-test.cjs` na 5a50a5958 (baza) → `19 pass / 3 fail` (te same trzy FAIL) — dług, nie regresja.
- `npm ci --ignore-scripts` w gra/ — wykonane (node_modules w worktree, nie w git).
- `git diff --check d1ebe5aeb HEAD` → czysto (bez wyjścia).
- Pozostałe bramki (tsc, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, ai-test 297/0, zero-trust 43/0, peace-weaker 32/0, stance-wiring 10/0, diplomacy 149/0) — NIE_ZMIERZONO w tej rundzie na 195d9a1fb; zmiana względem d1ebe5aeb dotyczy wyłącznie gra/tools/diplo-war-character-threshold-test.cjs (`git diff --stat d1ebe5aeb HEAD`: 1 plik, +25), więc kod testowany przez te bramki jest identyczny. Wyniki z raportu Evaluatora (wykonane na d1ebe5aeb) zostają wiarygodne dla kodu.
- Dla zarzutu 1 użyto surowego wyjścia, nie pamięci.

## 4. Zmiany w tej rundzie (ZMIANY-COMMIT)

- 195d9a1fb — gra/tools/diplo-war-character-threshold-test.cjs (+25): sekcje (f) granice i (g) 15 realnych cywilizacji.
- Ten raport: dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1/30-obrona-claude.md (osobny commit, tylko ten plik).
- Brak zmian w ai.ts, diplomacy-war-peace-profile.ts, diplomacy-war-peace-params.json, main.ts, WERSJE.md, gra-robocza/, rust-port/.

## 5. Odmowy i decyzje poza tym tematem

Brak odmów wykonania dispatchu. Zarzut 2 zostawiony właścicielowi (ABC), zgodnie z dispatchem („wartości wyjściowe do akceptacji właściciela").

BLOKADY: decyzja właściciela wymagana przed READY_FOR_DEPLOY: zatwierdzenie tabeli z sekcji 2 (14/20/28, zakres 10–35) albo wybór opcji A/B/C z zarzutu 2.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (SONNET) po ponownym Evaluatorze; orkiestrator decyduje o integracji po decyzji właściciela.
DEPLOY/PUSH: NIE WYKONANO

## 6. UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez wykonywania)

- origin/main przesunął się do ec86239a7 (FALA 684) ponad f0853a6cc; przed integracją sprawdzić `git merge-base --is-ancestor 195d9a1fb <SHA integracji>` oraz `git diff --stat` (pkt 5 orkiestratora w CLAUDE.md). Nie sprawdzałem konfliktów.
- Wymagany `npm ci --ignore-scripts` w gra/ po świeżym worktree — zrobiony tutaj, node_modules nie w git.
- Dług #352 (diplo-war-peace-sim, 3 FAIL) potwierdzony na bazie 5a50a5958; nie jest skutkiem tego tematu.
- Raport 10-operator-claude.md zawiera nieprawdziwe zdanie o S3 (zarzut 1) i niepełną tabelę (zarzut 3). Ten plik (30-obrona) je koryguje; orkiestrator może to zachować jako historię.
- Pliki pomocnicze testu (.diplo-war-character-threshold-entry.ts, .bundle.cjs) są usuwane przez test; nie zostały w git.
