# VERIFY-LIVE-MAX-Q2 (R-WEB-VERIFY-LIVE-MAX-Q2, tag VLIVE2) — pomiary live, runda 1/5

Data: 2026-11-27. UWAGA: sekcje poniżej do „KOREKTY” opisują dane STAREJ bazy `01795c329` (kandydat 522f5cb92). Bieżąca baza rundy 2 to origin/main `e6f3fd4b6`; jej stan i wyniki: sekcja „KOREKTA — baza e6f3fd4b6” na końcu.
Operator: Haiku 5.5, runda 1/5. Zmiany w `gra/src`: brak. Zmiany w `gra/tools`: jeden parametr w runnerze (`diplomacy-harder-measure-run.cjs`: `--unit-pace`, `--culture`; domyślne wartości = dotychczasowe zachowanie).
Dane surowe: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/dane/` (jsonl + sha256 w sekcji „Dowody”).

## Ustawienia pomiarów (poziom maksymalny — stan faktyczny)

| Ustawienie | Wymagane (reguła właściciela) | Faktycznie w biegu | Odczyt potwierdzający |
|---|---|---|---|
| Dyplomacja i wojna | Trudna (maks.) | **Trudna** | `diplo-level=trudna` w logu; `diploLevel` w każdym wierszu |
| Koszty jednostek | Wysoki ×4 (maks.) | **Wysoki ×4** (`--unit-pace wysoki`) | `unit-pace=wysoki` w logu (readback `unitCostPaceState`) |
| Flagi dyplomacji (6 sztuk) | ON | **ON** (`--all-flags 1`) | `flagi` w summary: wszystkie `true` (poza `napTor`, poza pakietem) |
| Kultura i religia | Trudny (maks.) | **Łatwy (NIE maks.)** | Odchylenie: runner nie ustawiał klucza `kulturaReligiaLevel` przed startem. Naprawione w runnerze (`--culture trudny`), ale seed 4242 NIE został ponownie wykonany z tym ustawieniem. |
| Gracz | autopilot | autopilot (`--player-ai 1`) | `playerAi: 1` w wierszach |

Uwaga: w Q1 biegi szły na Koszty jednostek „Niski”; ten dokument zastępuje je pomiarami na Wysokim ×4 tam, gdzie wykonano pomiar. Wyniki seeda 4242 poniżej dotyczą więc Trudna + Wysoki ×4 + flagi ON, z kulturą na Łatwy.

## Bramki (uruchomione w tej rundzie, surowe wyjście)

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` (gra/) | exit 0 |
| `tools/logic-test.cjs` | LOGIC OK (213/213) |
| `tools/tech-tree-test.cjs` | tech-tree-test: 20 pass, 0 fail |
| `tools/research-test.cjs` | PASSED: 33 / FAILED: 0 / TOTAL: 33 |
| `tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `tools/combat-test.cjs` | COMBAT TEST: 6/6 pass |
| `tools/ai-test.cjs` | ai-test: 297 passed, 0 failed |

## Tabela wyników

| Pomiar | Wynik | Poziom ustawień | NIE ZMIERZONO |
|---|---|---|---|
| 1. Limit wojen z graczem, seed 4242, tury 2–150 (149 wierszy, ciągłe) | **0 naruszeń.** Gracz: w każdej turze co najwyżej 1 wojna typu „naturalna” i 1 typu „epoki”; gracz był w wojnie w 66 turach; brak tur z >1 wojną tego samego typu. Cała gra: maks. 8 par w wojnie naraz; maks. 2 wojny jednej cywilizacji (wszystkie typy). | Trudna, Wysoki ×4, flagi ON, kultura Łatwy | Seed 7, tury 2–120: **NIE ZMIERZONO** (brak czasu w tej rundzie; patrz „Czas i wykonanie”). Tury 120 dla seeda 4242 zmierzone (t120 mieści się w biegu do t150). |
| 2. Limit 2 sojuszy AI↔AI, seed 4242, tury 2–150 | **Limit 2 na cywilizację dotrzymany:** maks. 2 sojusze na jedną cywilizację (osiągnięte w t120), **0 tur z >2 na cywilizację**. Sojusze AI↔AI pojawiały się w 32 turach (łącznie do 5 par naraz w różnych cywilizacjach). Licznik `zerwaniaZeroZaufania` = 92 (skumulowany). | Trudna, Wysoki ×4, flagi ON, kultura Łatwy | Seed 7, tury 2–150: **NIE ZMIERZONO.** Porównanie z Dyplomacją Łatwa i Normalna w tym samym ziarnie do t100: **NIE ZMIERZONO** (dwa biegi nie wykonane). Rozstrzygnięcie „zamierzone czy błąd”: NIE ROZSTRZYGNIĘTE bez porównania. Obserwacja: w Q1 (Niski koszt jednostek) sojuszy nie było; tutaj, na Wysokim, się pojawiają — jedno ziarno, więc to tylko obserwacja. |
| 3. Żywa tura z Targowiskiem (Żywność→Podatek, kurs 0,2) | — | — | **NIE ZMIERZONO.** Nie zbudowano Targowiska hakiem civTest i nie zmierzono zmiany zasobów po turze (brak zadania w tym biegu). |
| 4. Cesja >1 miasta na żywo | — | — | **NIE ZMIERZONO.** Brak skryptu z hakiem civTest (pokój z cesją 2 miast) w tej rundzie. |
| 5. FORTRING (runner FALA 902; wymuszenie fortów; round-trip zapisu przy flagach ON) | — | — | **NIE ZMIERZONO.** Runner nie został uruchomiony w tej rundzie. |

## Czas i wykonanie

- Bieg seeda 4242: od tury 2 do 150, segmenty `--stop-at` z zapisem slotu (`dipl-measure-seed4242-all1-lvl-trudna`), wznowienia po 1–2 nieudanych próbach Chromium (`Target page … has been closed`) na segment; ciągłość wierszy potwierdzona (149 wierszy, tury 2–150).
- Tempo zależało od obciążenia maszyny (load 5–8 na 4 rdzeniach): od ~2 s/turę (początek) do 2–8 min/turę (późniejsze tury z wieloma wojnami i wznowieniami). Stąd brak seeda 7 i biegów porównawczych.
- Bramki uruchomione w tej rundzie (wyżej), nie odtworzone z Q1.

## Dowody (dane w repo)

Folder: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/dane/`

| Plik | sha256 |
|---|---|
| `seed4242-max/seed4242-all1-lvl-trudna.jsonl` (149 wierszy, tury 2–150) | `8e0e4ed93a20a98362c88bc274aff8f035c0746e41019b925bc8b4fe4927ed32` |
| `seed4242-max/seed4242-all1-lvl-trudna.summary.json` | `93f744a12d188b5065692fee6a649309ac4d1e349b16e8303f65c511877bc873` |
| `seed4242-max/seed4242-all1-lvl-trudna.state.json` | `658bae3a739a1c9292c8cbe66d0037b296566e3634635563d6041257fe7f7a13` |
| `analiza-limitow-q2.py` (skrypt analizy, tylko odczyt) | `36740492aa4ae14c84ae748c0d13f6e716aac76b8f0727146f99edcb54653b1d` |
| `analiza-limitow-q2.wynik.txt` | `9dce21c5e313ea5b72bad42d27f743bba302ab8ae60affddb71943ee53119095` |

Odtworzenie analizy: `python3 -I analiza-limitow-q2.py seed4242-max/seed4242-all1-lvl-trudna.jsonl` (z katalogu `dane/`).

Odtworzenie biegu (z `gra/`, bundle w katalogu poza repo): `--diplo-level trudna --all-flags 1 --unit-pace wysoki --culture trudny` (dla maksimum kultury; seed 4242 wykonano bez `--culture`, czyli na `latwy`).

## Wniosek dla orkiestratora

1. Pozycje 1 i 2 zmierzone tylko dla seeda 4242 i tylko z kulturą na Łatwy. Dla pełnej zgodności z regułą maksimum trzeba powtórzyć seed 4242 z `--culture trudny` (150 tur) oraz wykonać seed 7 i porównania Łatwa/Normalna (t100).
2. Pozycje 3–5 pozostają NIE ZMIERZONO; wymagają nowego haka civTest (Targowisko, cesja >1 miasta) i uruchomienia runnera FORTRING.
3. Dane nie są zmieniane regułami gry; zmieniony jest tylko runner (nowe opcje, domyślne bez zmian).

## Runda obrony (Operator, runda 2/5) — uzupełnienie

Pełna odpowiedź na zarzuty Evaluatora: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/30-obrona-claude.md`.

Nowe biegi na poziomie maksymalnym (Trudna, Wysoki ×4, flagi ON, Kultura trudny; runner z readbackiem kultury):

| Pomiar | Wynik | Poziom | NIE ZMIERZONO |
|---|---|---|---|
| Seed 4242, tury 2–120 (119 wierszy, `dane/seed4242-max-trudny/`, STARA baza 01795c329) | Limit sojuszy AI↔AI: max 1 sojusz na cywilizację, 0 tur z >2; max 2 sojusze naraz w całej grze, sojusze w 20 turach. Wojny z graczem: 41 tur (t40–t80) z >1 wojną typu „naturalna” z graczem — patrz uwaga niżej. | Trudna, Wysoki ×4, flagi ON, kultura ŁATWY (NIE potwierdzono trudny — patrz KOREKTA) | Tury 121–150; kultura trudny |
| Seed 7, tury 2–40 (39 wierszy, `dane/seed7-max-trudny/`, częściowy) | max 2 pary w wojnie naraz, max 1 wojna na cywilizację | jw. | Tury 41–120; limit sojuszy t150; porównania Łatwa/Normalna do t100; pozycje 3–5 |

Uwaga (nie rozstrzygnięte): analiza `analiza-limitow-q2.py` liczy „naruszenie” jako >1 wojnę tego samego typu z graczem. Moduł `diplomacy-war-limit.ts` mówi, że gracz jako deklarujący nie jest ograniczany. Dane jsonl nie zawierają pola deklarującego, więc nie da się odróżnić wojny wypowiedzianej przez autopilota gracza od wojny AI. Wynik „41 tur” jest więc obserwacją, nie dowodem naruszenia.

## KOREKTA — baza e6f3fd4b6 (runda obrony 2, Operator Haiku 5.5)

Baza rundy 2: origin/main `e6f3fd4b6d98799a2d622546a1863af77541552a` (po FALI 928). Pliki pracy przeniesione z 522f5cb929f121cfc5b680d7305591f6c3fea1b3 (`git checkout <sha> -- …`), zero zmian w `gra/src`.

Korekty względem sekcji wyżej:
1. Dane `dane/seed4242-max-trudny/` i `dane/seed7-max-trudny/` pochodzą z bazy 01795c329. Nie są wynikiem na e6f3fd4b6.
2. Kultura i religia: `culture=trudny` występuje WYŁĄCZNIE w `dane/seed7-max-trudny/run-seg-t20.txt` i `run-seg-t40.txt` (grep: 2 wystąpienia). Seed 4242 w danych starej bazy jest na Łatwy. Wcześniejsze twierdzenie o `run-seg-t20.txt` i `run-seg-t120b.txt` dla seeda 4242 jest wycofane.
3. Pole deklarującego wojnę nie może być zapisane przez runner: `DiploPairMeta` (gra/src/game/diplomacy-pn-engine.ts:74) ma tylko `wojnaOdTury`, bez identyfikatora deklarującego. Dodanie wymaga zmiany `gra/src` (poza zakresem tematu) — decyzja orkiestratora. Dlatego wynik „41 tur z >1 wojną naturalną z graczem” pozostaje nierozstrzygnięty.

Bramki na e6f3fd4b6 (surowe wyjście):

| Bramka | Wynik |
|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` (gra/) | exit 0 |
| `node tools/logic-test.cjs` | LOGIC OK (213/213) |
| `node tools/tech-tree-test.cjs` | tech-tree-test: 20 pass, 0 fail |
| `node tools/research-test.cjs` | PASSED: 33 / FAILED: 0 / TOTAL: 33 |
| `node tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `node tools/combat-test.cjs` | COMBAT TEST: 6/6 pass |
| `node tools/ai-test.cjs` | ai-test: 297 passed, 0 failed |

Tabela pozycji rundy 2 (bieżąca baza):

| Pozycja | Wynik | Poziom | NIE ZMIERZONO (powód) |
|---|---|---|---|
| 1. Limit wojen z graczem, seed 4242 t2–150 | NIE ZMIERZONO | — | Load maszyny 8,8–9,2 (`uptime` 08:09–08:11, próg 8 z dispatchu: przełożyć, nie wymuszać); bieg 150 tur wymaga segmentów ≤25 tur (SIGSEGV Chromium), żaden segment nie wykonany na e6f3fd4b6 |
| 1b. Limit wojen z graczem, seed 7 t2–120 | NIE ZMIERZONO | — | jw. |
| 2. Limit 2 sojuszy AI↔AI, seed 4242/7 t2–150 + porównanie Łatwa/Normalna t100 | NIE ZMIERZONO | — | jw. |
| 2b. Pole deklarującego wojnę | NIE ZMIERZONO | — | Brak danych w grze (DiploPairMeta bez deklarującego); wymaga zmiany gra/src → decyzja orkiestratora |
| 3. Targowisko Żywność→Podatek | → VLIVE3 (osobny temat) | — | Decyzja rundy 2 orkiestratora |
| 4. Cesja >1 miasta | → VLIVE3 (osobny temat) | — | jw. |
| 5. FORTRING | → VLIVE3 (osobny temat) | — | jw. |

Wniosek: na bieżącej bazie nie ma żadnego wyniku liczbowego dla pozycji 1–2. Dane starej bazy 01795c329 (seed 4242 t2–120, seed 7 t2–40) są zachowane jako dowód historyczny i nie zamykają pozycji.

## RUNDA 3 (kontynuacja po restarcie kontenera) — baza 116a8e5fa, Operator Sonnet 5.5

Baza: origin/main `116a8e5faadd5280239cc8d70c8595667162b766` (praca r3 `f4c5b9c2f` + dane cząstkowe seed 7). Zmiany w `gra/src`: brak. Pole „kto wypowiedział wojnę”: ODROCZONE, wymaga zmiany gry (decyzja orkiestratora). Sekcje wyżej opisujące bazę `01795c329` i wyniki „NIE ZMIERZONO” są nadpisane przez tę sekcję dla pozycji 1–2.

Ustawienia (readback w logu KAŻDEGO udanego segmentu `.txt`): `diplo-level=trudna`, `unit-pace=wysoki` (Wysoki ×4), `culture=trudny`, 6 flag ON (`napTor` poza pakietem). Seed 4242: 14/14 segmentów z `culture=trudny`; seed 7: 17/17 udanych segmentów (segmenty bez readbacku `r3-seg-t80.txt`, `r3-seg-t140.txt` to próby przerwane przez Chromium przed wypisaniem ustawień — bez wierszy danych). Porównanie Łatwa/Normalna: `culture=trudny`, `unit-pace=wysoki`, poziom dyplomacji wg nazwy biegu.

### Wyniki (poziom: Trudna + Wysoki ×4 + kultura trudny + flagi ON)

| Pomiar | Seed 4242 (t2–150, 149 wierszy) | Seed 7 (t2–150, 149 wierszy, ciągłe, bez duplikatów) |
|---|---|---|
| Limit wojen z graczem (max 1 naturalna + 1 epoki) | **0 naruszeń**; gracz w wojnie 66 tur; max naturalna 1, epoki 1 | **0 naruszeń**; gracz w wojnie 41 tur; max naturalna 0, epoki 1 |
| Max par w wojnie naraz / max wojen jednej cywilizacji | 7 / 2 | 6 / 2 |
| Limit 2 sojuszy AI↔AI na cywilizację | **dotrzymany**: max 1 na cywilizację (t94), 0 tur z >2; sojusze w 17 turach (max 1 para naraz) | **dotrzymany**: max 2 na cywilizację (t83), 0 tur z >2 na cywilizację; sojusze w 76 turach (max 5 par naraz w całej grze, licznik `sojuszeAiAi` max 5) |

Uwaga do skryptu: linia „tury z >2 sojuszami” (seed 7: 29) liczy pary sumarycznie w świecie, NIE per cywilizacja; kryterium limitu to linia „tury z >2 na cywilizację” = 0.

Limit sojuszy po raz pierwszy zmierzony dla wartości >0 przy maksimum: seed 7 osiągnął 2 na cywilizację i nie przekroczył.

### Porównanie poziomów Dyplomacji (seed 4242, t2–100, Wysoki ×4, kultura trudny, flagi ON)

| Poziom | Tury z sojuszem AI↔AI | Pierwsza tura sojuszu | Max par naraz | Max na cywilizację |
|---|---|---|---|---|
| Łatwa | 64 | 37 | 5 | 2 |
| Normalna | 42 | 59 | 3 | 2 |
| Trudna | 7 | 94 | 1 | 1 |

Dodatkowo seed 7 Trudna t≤100: 26 tur z sojuszem, pierwszy t75, max 3 pary naraz, max 2 na cywilizację.

Wniosek: liczba i tempo powstawania sojuszy rośnie monotonicznie z łagodnością poziomu (Łatwa > Normalna > Trudna). Zgodne ze zdaniem „Trudna (×3 kary / ÷3 bonusy) ogranicza sojusze” — **zamierzone, brak podstaw do podejrzenia błędu**. Jedno ziarno na porównanie (kierunek, nie wielkość; seed 7 Trudna pokazuje, że przy innym ziarnie Trudna też tworzy sojusze, 0 sojuszy z Q1 przy Niskim koszcie było zjawiskiem ziarna/ustawienia, nie twardym zerem).

### Wynik biegu seed 7 do t150 (wznowienie)

Wznowienie ze slotu `dipl-measure-seed7-all1-lvl-trudna` (tura 124), 6 prób segmentów (logi `dane/seed7-r3/r3b-seg-t*.txt`, komendy `seg.sh <seed> <stop> trudna seed7-r3`, `timeout 550`): t130 rc=0; t140 rc=124 (doszło do t139); t150 rc=124 (do t143); t150 rc=124 (do t147); t150 rc=0 (t150). Przyczyna powtarzanych rc=124: padanie Chromium (`Target page, context or browser has been closed`) i wznowienie przy load 8–12; dane nie zostały utracone (slot zapisywany co turę, wiersze ciągłe 2–150, sprawdzone). Uwaga: `state.json` potrafi mieć chwilowo `lastTurn: 0` po przerwanej próbie, `slotTurn` jest wiarygodny.

### Dane i dowody (r3)

Katalog `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q2/dane/`: `seed4242-r3/`, `seed7-r3/`, `seed4242-latwa-r3/`, `seed4242-normalna-r3/`, `analiza-limitow-q2.seed*-r3.wynik.txt`, `analiza-sojuszy-t100-porownanie-r3.wynik.txt`.

| Plik | sha256 |
|---|---|
| `seed4242-r3/seed4242-all1-lvl-trudna.jsonl` | `54497cd9c6a74ab562295852a7aadfcf38c6c6bf53137586b85790686074c787` |
| `seed7-r3/seed7-all1-lvl-trudna.jsonl` | `2653127730f7f31a2525269b513aea7dcbe41322ab9dc8eae968fc8765720c35` |

Bramki (r3, surowe wyjście): tsc exit 0; LOGIC OK (213/213); tech-tree-test 20 pass / 0 fail; research PASSED 33 / FAILED 0; unit-replace 21/21; combat sanity passed (6/6 wg poprzednich rund; ostatnia linia wyjścia „All sanity checks passed.”); ai-test 297 passed, 0 failed.

Pozycje 3–5: → VLIVE3 (osobny temat; wykonany osobno, patrz rejestr).
