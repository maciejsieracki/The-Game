STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1
GOAL: Zmierzyc skutki okna lask 15 tur (AI, aktywny gracz po t16, teksty) bez zmian gra/src; dokument OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md z rzetelnym stanem wiazacym.
ZMIERZONY KANDYDAT: b538be0f41ccac1e8c102457b8332fff30d03764 (baza 055ad0b8e6a087d0c9773ca2989df007801f509b)

ZMIANY/COMMIT:
- git merge-base --is-ancestor 055ad0b8e b538be0f4 -> TAK (exit 0).
- Zmiany kandydata wzgledem bazy: dokument analizy, 10-operator-claude.md, 30-obrona-claude.md, gra/tools/grace15fx-active3-live.cjs, dane dane/aktywny-r3/** (22 pliki wg git diff --stat; +1101/-80). Wszystko w allowliscie.
- git diff 055ad0b8e..b538be0f4 -- gra/src gra/data = PUSTY (zero zmian gry).
- Weryfikacja podpisu b538be0f4 nie jest mozliwa w tym worktree (brak gpg.ssh.allowedSignersFile); nie zmieniano konfiguracji podpisu.

TESTY (wlasny bieg FC na b538be0f4, surowe wyniki):
- npx tsc --noEmit: exit 0, brak bledow.
- node tools/logic-test.cjs: LOGIC OK (213/213).
- node tools/ai-test.cjs: 297 passed, 0 failed.
- tech-tree-test 20 pass/0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test All sanity checks passed.
- early-grace-15-test: 33 passed, 0 failed.
- node --check gra/tools/grace15fx-active3-live.cjs: OK.
- Weryfikacja danych r3 (surowe jsonl/json, python): s11 t16 skarbiec 97, Spichlerz 1, prognoza -30, blokada TAK, "zabraknie 18"; t30 212/15; result t31 220/16, mil 0. s7 t16 68/2, -28, "zabraknie 16"; t17 blokada "zabraknie 2"; t30 166/26; t31 174/28, mil 0. Barbarzyncy: t16 units 0 camps 0; t17 12 obozow/13 jednostek; t30 42 (s11) / 40 (s7). foreignNear puste. barblog: 0 trafien "atak/zdob". Wszystkie liczby w dokumencie (stan wiazacy i tabela 2.3) zgodne z danymi.
- Nie powtarzano biegow gry na zywo (zmiany kandydata to dokument i komentarz).

OCENA ZARZUTOW EVALUATORA I ODPOWIEDZI OBRONY (kazdy sprawdzony w dokumencie/danych):
1. t31 vs t30: poprawione, liczby zgodne z danymi -> ODDAL (zalatwione).
2. Stare zdania w sekcjach 4 i 5: zaktualizowane; pozostale zdania "NIE ZMIERZONO" dotycza realnie niezmierzonych rzeczy -> zalatwione.
3. Pelna lista hakow zmieniajacych stan (startNewGame, foundFirstCity, tidy: rejectAwaitingAiOffers/acceptForcedPeace/flushBattles/closeBattleSummary) ujawniona w dokumencie i naglowku runnera; wplyw nie wykazany, jawnie zastrzezony -> zalatwione. UWAGA: dispatch zakazywal tych hakow; naruszenie jest ujawnione, wyniki trzeba czytac "z hakami".
4. Przyczynowosc suwaka Wyzywienia nieizolowana: poprawnie opisana jako NIEIZOLOWANA; rozbieznosc HUD vs bramka 12 niewyjasniona -> ODDAL jako uwaga (nie blokuje; wniosek dokumentu opiera sie na rozwiazaniu jednostek, ktore jest zmierzone osobno).
5. Pula Pracy na ulepszenia = 100% nie ustawiona: naruszenie stalej zasady maksimum w tym punkcie, jawnie przyznane. Pula dotyczy ulepszen, nie zywnosci ani skarbca bramki -> ODDAL (uwaga do decyzji orkiestratora: powtorka albo przyjecie luki). Nie uznaje za FAIL, bo nie podwaza zmierzonych wnioskow o bramce zywnosciowej, ale wynik NIE spelnia zasady maksimum.
6. Luki zakresu (budowa zywnosci, atak na AI, tooltipy): jawne NIE ZMIERZONO -> ODDAL.
7. Readback barbarzyncow = echo parametru: dokument tak to nazywa, NIE ZWERYFIKOWANO w silniku -> zalatwione.
8. Zdublowane wiersze tur: wymienione w dokumencie; potwierdzone w danych -> ODDAL.
9. Zakres 2 ziarna / 1 wariant podatku: zastrzezone "NIE uogolniac" -> ODDAL.

BLOKADY: brak blokad technicznych.

UWAGI-DLA-ORKIESTRATORA:
- Wynik zmierzony z haki zmieniajacymi stan (grupa b/c); ich wplyw nie zmierzony.
- Kandydat bledu UI: komunikat bramki po t16 proponuje "obnizke racji", gdy suwak Wyzywienia stoi na 0 (zablokowany) po rozwiazaniu jednostki; rozbieznosc 12 miedzy prognoza HUD a bramka niewyjasniona -> osobny temat UI do rozwazenia.
- Pula Pracy 100% niezmierzona; decyzja: powtorka lub przyjecie luki.
- Dane nadaja sie do pytania ABC "co dalej po t16" (jedyne skuteczne wyjscie: rozwiazanie 1-2 jednostek wojskowych; po nim miasto bez obrony, barbarzyncy od t17); pytanie wg ZASAD ABC bez zargonu.
- Wniosek dla AI (n=2) niejednoznaczny, dominuje poziom barbarzyncow.

RUNDY: 3/5
NASTEPNY KROK: integracja orkiestratora (dokument i dane, bez deployu - brak zmian gra/src); nie dotyczy READY_FOR_DEPLOY gry.
DEPLOY/PUSH: NIE WYKONANO
