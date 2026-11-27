STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src)
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1
GOAL: pomiar, czy gracz moze stracic ostatnie miasto przez bunt; r4 = readback ustawien, A/B inertnosc haka civTest, ownerChangesTail, dokument.
ZMIERZENIA FC (kandydat 6ab34c647, baza bf299e885):
- `git merge-base --is-ancestor bf299e885 6ab34c647`: OK (ANCESTOR_OK). Commity bf299e885..6ab34c647: 3f6bae092 (operator r4), 6ab34c647 (obrona r4).
- `git diff --stat bf299e885 6ab34c647 -- gra/src gra/data`: 0 linii. Poza run-dir zmienione tylko: dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md i gra/tools/plrrevolt-run.cjs = allowlista r4. `git diff --check`: czysto.
- Hak civTest: `git diff --stat 909a057fa bf299e885 -- gra/src` = main.ts +47, 0 usuniec (czysty dodatek); `git diff 3bef0082b bf299e885 -- gra/src` = pusty, co potwierdza twierdzenie dokumentu.
ZMIANY/COMMIT: kandydat 6ab34c647 (integration_sha); raport FC w commicie raportu.
TESTY (wlasne uruchomienie, worktree FC po npm ci --ignore-scripts, surowe wyjscie):
- tsc --noEmit: exit 0, brak bledow
- logic-test: 213/213
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-test: 297 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
Dane r4 (weryfikacja wlasna): readback 3 biegow (4242/7/778899) zawiera difficulty trudny, kosztJednostekPace wysoki, diplomacyWarLevel trudna, kulturaAI trudny, barbariansLevelGra trudny; ab-compare.txt: 15/15 tur zgodnosc stateHash i digestu; jsonl: zmiany wlasciciela miasta gracza 0->-1 path applyCityCaptureToMap (stos onAuto/showPreBattle), zmian na -99: 0 w kazdym z 3 biegow.
OCENA ZARZUTOW EVALUATORA (bez etykiet rol):
1. (brak roznic tur vs REALDEF4) ZALATANY: doc sekcja 00 pkt 5 podaje 4242 +6 tur, 778899 -1, seed 7 ok. +15; zweryfikowane w tekscie. Odrzucony jako blokada.
2. (stare sekcje bez oznaczenia) ZALATANY: sekcja 0 ma adnotacje "Dokument historyczny r3" z odeslaniem do 00; poprawne. Uwaga kosmetyczna.
3. (barbariansLevelGra null w A) ZALATANY: opisane wprost w pkt 6; w danych potwierdzone (jeden z 5 summary ma null, to ab-nohook). Wniosek poprawny, bo gra/src A i B roznia sie wylacznie +47 liniami haka a stateHash identyczny 15/15.
4. (komentarz runnera) ZALATANY: obrona poprawila komentarz, zachowanie bez zmian (diff gra/tools: 1 wiersz).
5. (brak GRACE15 w bazie) PRZYJETY JAKO OGRANICZENIE, nie blokada: wniosek dotyczy kodu sprzed FALI 935; GRACE15 jest juz na main (zadanie #217), wiec przed pytaniem ABC pomiar trzeba powtorzyc na aktualnym main.
6. (1 ziarno A/B, 15 tur; pop >= 5 nie zmierzone) PRZYJETY jako jawne ograniczenie zgodne z dispatchem.
BLOKADY: brak. Ograniczenia: A/B tylko ziarno 4242, t2-t16; bunt przy populacji >= 5 NIE ZMIERZONO; wynik dotyczy kodu bez GRACE15.
RUNDY: 4/5 (FC r4).
NASTEPNY KROK: integracja orkiestratora (dokument + dane + narzedzie, bez deployu; zero zmian gra/src wzgledem bf299e885). Pytanie ABC o ochrone ostatniego miasta gracza dopiero po pomiarze na bazie z GRACE15 (FALA 935).
UWAGI-DLA-ORKIESTRATORA: (a) wynik merytoryczny: w tych biegach gracz traci jedyne miasto przez barbarzyncow (t16/t29/t12), nie przez bunt; ochrony ostatniego miasta gracza przed buntem w kodzie nie ma (society-breakdown.ts:522-533 tylko AI), ale przy pop 1-4 bunt jest wylaczony (immunitet osiedla); (b) powtorzyc krotki pomiar na main z GRACE15 (miasto dluzej zyje, pop >= 5 staje sie osiagalna); (c) ekran porazki po utracie: "TWOJE IMPERIUM UPADLO" z WCZYTAJ GRE / ROZPOCZNIJ OD NOWA.
DEPLOY/PUSH: NIE WYKONANO
