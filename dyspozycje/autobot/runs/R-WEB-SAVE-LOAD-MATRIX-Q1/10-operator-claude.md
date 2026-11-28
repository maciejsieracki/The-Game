STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-MATRIX-Q1 (runda 3/5, Operator SONNET po 2 nieudanych rundach HAIKU; wznowienie po restarcie kontenera)
GOAL: Macierz zapis/wczytanie na MAKSIMUM (rivals=9, civTypes=14, barbarzyńcy Trudny, Wysoki ×4, kultura trudny, dyplomacja trudna), diagnoza bunt/t10, klik UI, A==A', render po wczytaniu; poprawka tylko po odtworzeniu błędu.
ZMIANY/COMMIT:
- Kod gry (jedyna zmiana): `gra/src/main.ts` +22 linii — zapis/czyszczenie/odtworzenie trzech map stanu absorpcji miast-państw przez AI (`aiCsFailCount`, `aiCsTrybutSince`, `aiCsWasalSince`). Commit z kodem: `dfae6298c`. Bez zmian: `cities.ts`, `gra/data`, balans, `WERSJE.md`, manifest.
- Testy/narzędzia: `gra/tools/save-load-ai-cs-absorption-state-test.cjs` (nowy), `gra/tools/save-load-podzial-pracy-representation-test.cjs` (nowy), `gra/tools/save-load-continuity-live.cjs` (WIP poprzedniego Operatora zweryfikowany i rozszerzony), `gra/tools/save-load-continuity-ui-live.cjs` (rivals/civtypes z argumentów, logi).
- Dokument: `dyspozycje/analizy/ZAPIS-WCZYTANIE-MACIERZ-2026-11-27.md` (sekcja 0A = stan wiążący r3; stara sekcja R2 oznaczona jako nie-maksimum).
- Dane: `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-MATRIX-Q1/dane/` (pliki r3b-*, bunt-*, aionly-*, render-*, ui-*; `r3b-READBACK.txt` z `cfgUsed` każdej komórki, `r3b-AA-porownanie.txt`).
- SHA bazy: `286d594d3`. SHA tego commita raportu: zwrócony w polu `sha` wyniku (czubek pracy).
TESTY (liczby z surowego wyjścia):
- ZNALEZIONY PRAWDZIWY BŁĄD GRY: komórka bunt/7/zapis t7 (rivals=9): B≠A **0/6 tur równych** (powtórzone 2×); w turze 8 przebieg ciągły wchłania 106 miast-państw, po wczytaniu 0. Zmierzona przyczyna: przy zapisie trybut=106, wasal=106; po wczytaniu 0/0 (`__turnSlowdownTestDebug.collections()`). Po poprawce: **6/6 tur równych**, po wczytaniu 106/106.
- Test statyczny absorpcji: 12/0 (na źródle sprzed poprawki czerwony; 3 mutacje czerwone). Test reprezentacji podziału Pracy: 5/0 (mutacja czerwona 6/18).
- Diagnoza bunt/t10 z r2: **(a) tylko reprezentacja** (martwe pole `podzialPracy` przy `override=false`); bunt/4242/t10 na rivals=9: B==A 6/6, 0 surowych różnic. Kod gry w tej sprawie niezmieniony.
- Macierz (rivals=9, maksimum): 10 komórek z B==A 6/6 (max 4242/7 × t3/t10 z poprzedniej rundy; bunt/4242 t3 i t10, bunt/7 t3, aionly/4242 t3, aionly/7 t3 na buildzie przed poprawką; bunt/7 t7 po poprawce) + bunt/7/t7 przed poprawką = błąd (zielone po poprawce). Szczegóły i pliki: dokument sekcja 0A.3.
- Klik UI (rivals=9): max/4242/t3 z cofnięciem 1 tury: 5/5 OK; max/4242/t3 bez cofnięcia: 5/5 OK; max/7/t3: 3/3 OK; 0 błędów strony. 6. tura niedosięgnięta w limicie 590 s narzędzia.
- A==A' (rivals=9): max/4242: 9 tur (t4–t12) identyczne bajt w bajt między dwoma nowymi biegami + 6 tur względem starszego biegu; max/7: 6 tur względem starszego biegu; bunt/7: 6 tur w trzech niezależnych biegach.
- Render (max/4242, zapis t10, build po poprawce): hexCount 20160 przed i po 6 turach; miasta 142→151, jednostki 194→244; 0 błędów strony i 0 błędów konsoli; zrzut `dane/render-max-4242-t10-po-wczytaniu.png` spójny (HUD „TURA 10”).
- Bramki po poprawce: tsc 0 · logic 213/213 · tech-tree 20/0 · research 33/0 · unit-replace 21/21 · combat 6/6 · ai-test 297/0 · early-grace-15 33/0 · society-breakdown 56/0 · ai-city-order-need-wiring 267/0 · save-load-sort 4/4 · ledger-history 4/0 · budowa-priorytet 6/0 · determinism-save-load-resume PASS · roundtrip-state-drift (warstwa statyczna) OK.
BLOKADY / NIE ZMIERZONO (jawnie):
- aionly/{4242,7}/t10, bunt/7/t10 (bieg ciągły A do t16 nie mieści się w limicie 590 s narzędzia przy 20–50 s/turę na obciążonej maszynie, start sesji 100–250 s; podstawiono t7 tylko dla bunt/7), bunt/4242/t7, aionly/*/t7.
- Klik UI ≥6 tur (osiągnięto 5/5 i 3/3), wariant z cofnięciem o 3 tury (dirty=3) po poprawce; rozstrzygnięcie hipotezy „zasiew Math.random” nie wykonane osobnym eksperymentem.
- A==A' ≥10 tur × 2 ziarna (osiągnięto 9 tur dla 4242 i 6 tur dla 7).
- Liczba obiektów miast/jednostek w SCENIE 3D (brak haka) — zmierzono liczniki stanu, siatki wiosek/ulepszeń, hexCount, błędy.
- Komórki „przed poprawką” nie powtórzone na buildzie po poprawce; dynamiczna warstwa `save-load-roundtrip-state-drift-test` (5 min/ziarno), `save-load-deserialize-fields-audit` (live) nieuruchomione.
- Porównanie komórki render (B vs A) pokazało rozjazd wyłącznie w polu `effPP` dodanym do runnera w tej rundzie (A z wcześniejszej rundy go nie ma) — artefakt porównania, komórka nie liczona w tabeli.
RUNDY: 3/5 (r3; poprzednie przerwanie restartem kontenera = INFRA, nie liczone)
NASTĘPNY KROK: Evaluator (zweryfikować tezę przyczynową o aiCs*, test statyczny i mutacje, zakres diffu `main.ts` +22); ewentualnie runda dopełniająca: aionly t10 / klik UI ≥6 tur / A==A' ≥10 tur w segmentach (wymaga mniejszego obciążenia maszyny lub zwiększenia limitu czasu biegu).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Poprawka zmienia FORMAT ZAPISU (nowe opcjonalne pola `meta.aiCsFailCount|aiCsTrybutSince|aiCsWasalSince`); stare zapisy się wczytują (puste mapy jak dotąd) — wpływ na grę: wczytanie zapisu w trakcie absorpcji miast-państw przez AI przestaje zmieniać przebieg. Jeśli po FC ma iść na ROBOCZĄ, to zmiana w `gra/src` (FALA).
2. Legacy zapisy zrobione przed poprawką w trakcie absorpcji nadal wczytają się z pustymi zegarami (zachowanie dotychczasowe); odtworzenie zegarów z `activeDeals` (id traktatów `ai_cs_wasal_*`/`ai_cs_trybut_*` + `zawartaTura`) byłoby możliwe, ale nie jest wierne po przejściu trybut→wasal — nie wdrożone.
3. Bardzo prawdopodobne, że FAIL „dirty3” z r2 (wczytanie w tej samej sesji po 3 turach, rozjazd w mieście-państwie city15) to ta sama klasa błędu (niewyczyszczone zegary z cofanej przyszłości) — do potwierdzenia w rundzie dopełniającej.
4. Wydajność maszyny: 4 równoległe tematy powodują 20–55 s/turę i start sesji 100–250 s; macierz pełna (np. t10 dla aionly) wymaga biegów A >590 s — albo ciszej na maszynie, albo runner z checkpointem sesji (nie istnieje).
5. Znaleziska poza zakresem: brak haka liczącego obiekty sceny miast/jednostek w teście render (propozycja osobnego tematu z hakiem civTest).
