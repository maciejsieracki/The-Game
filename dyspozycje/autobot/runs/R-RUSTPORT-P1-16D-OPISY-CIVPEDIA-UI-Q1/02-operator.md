STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1
GOAL: Status z dowodem dla pozostałych haseł CivPedii i 17 paneli „ściąga" na pinie edb8fb56 (runda 2: naprawa defektów #1–#10).
ZMIANY/COMMIT: przepisany nowy plik dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md (rejestr rozbieżności §4, status per hasło §2, status per panel §3). Ten raport. Odtwarzalny skrypt porównawczy: scratchpad .../scratchpad/check.py. Brak zmian w gra/** i w innych P1-16*. Brak commitu.
TESTY: Odczyt wyłącznie przez git show edb8fb56. Mechaniczne porównanie wiki (wikiBundle.json, 169 wpisów) z buildings/units/wonders/terrain-improvements/civs/tech.json: 167 otwartych = 70 ZGODNE-POLA + 78 ROZBIEŻNE + 19 NIEROZSTRZYGNIĘTY; pełnej weryfikacji treści (proza) 0/167. Panele: 17/17 ze statusem (PASS 4, PWN 1, NIEAKTUALNY 2, FAIL 1, NIEROZSTRZYGNIĘTY 9); ścieżki kodu odczytane w cityPanel.ts, empireDetailPanel.ts, production.ts, cities.ts, society-breakdown.ts, population-growth-v85.ts, main.ts (hak getReligionState, 7338).
BLOKADY: (1) Kryterium binarne niespełnione: 19 haseł i 9 paneli NIEROZSTRZYGNIĘTY (wymienione w pliku, §2/§3/§6); proza żadnego hasła nieprzeliczona. (2) Rozbieżności wiki vs dane: RJ-1 (42 jednostki, wiki stale względem commitów 4c1126de/f5a1ce51), RT-1 (28 technologii, commit ab75bb4f), RB-1 (4 budynki ×5), RB-2 (Garnizon — dane zatwierdzone przez właściciela, wiki do korekty), RU-1, RC-1/RC-2. Korekta wiki poza tym tematem. (3) Panel #6 Praca — FAIL (opis „kolejka budowy" bez wyjątku pustej kolejki, production.ts:2085–2090). (4) Panel #7: symbol pieniadzNetto nieobecny w silniku — nieprzeliczone.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (adwersarium, Haiku 5.5 medium): sprawdzić §2 (czy ZGODNE-POLA nie sugeruje PASS), RB-2 (uwagi garnizonu), #2 (wiersze fallbacku), #6 (wyjątek kolejki pustej), oraz liczby w §1 i §5. Następnie Final Control (Sonnet 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
