STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; zero zmian gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q11
GOAL: Odpowiedź na 6 zarzutów Evaluatora (commit e1d5e7bdb) do kandydata 216cecb09; poprawki w tej samej rundzie.
ZMIANY/COMMIT: patrz sekcja SHA na końcu. Pliki: gra/tools/rekrutacja-koszty-polowa-all-test.cjs, gra/tools/mennica-magazyn-test.cjs, gra/tools/fixtures/units-baza-329db81ff.json (nowy), 30-obrona-claude.md.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (naprawione). Baza kosztów 329db81ff czytana z kopii w fixtures/units-baza-329db81ff.json (git show usunięty, także nieużywany import execFileSync). Test nie zależy od historii git. Wynik: PASS, 75/75 jednostek kosztowych, 214 pól zmienionych, 150 pól chronionych.

2. PRZYJMUJĘ, częściowo naprawione. Wartość 0 była błędna jako oczekiwanie (0 unieważnia test wycieku mnożnika). Przywróciłem oczekiwanie 2 (decyzja 67B). Dodałem ZLOTO_STOCK={zloto:10} do wszystkich czterech scenariuszy (decyzja pkt 2). DOWÓD: eksperyment ze złotem 0 i 10 daje delta 0 w obu przypadkach; test sprzed kandydata (HEAD~1) też dawał got 0. Zatem Mennica nie dowozi własnego plonu do pieniadzBrutto w tym scenariuszu. To znalezisko gry, nie błąd testu. Asercja zostaje CZERWONA z opisem (patrz BLOKADY).

3. ODRZUCAM jako blokadę (zostawiam jako uwagę). Dowód z raportu Evaluatora: mutacja Równina.Drewno 5->6 zaczerwieniła ekonomia-5x (1 fail) i hex-plony (4 fail). Test wartości z danych nie jest tautologią całego zestawu. Nie dodaję pinów, bo dispatch wymaga czytania wartości z danych dla inwariantów.

4. ODRZUCAM z dowodem. Budżet AI dla tarasów = 100% puli bez limitu procentowego: gra/src/game/ai.ts:2993 i :3204 (`AI/państwa-miasta: 100% puli, BEZ limitu % (właściciel 2026-10-31)`). Taras kosztuje 25 Pracy, więc do 4 tarasów mieści się w budżecie. Asercja `>=1 && koszt<=100` jest uczciwą dolną granicą. Test: 18/0.

5. ODRZUCAM z dowodem. Piny 13/3 i 38/8 zgadzają się z gra/data/units.json (Wojownik „Surowiec (ilość)” 13, „Utrzymanie surowiec” 3; Hieros Lochos 38/8). Decyzja ABC 2026-11-19 pkt 1 wprost uznaje „wielokrotności ×5 jednostek” za nieaktualne. Pin do aktualnego stanu danych jest zgodny z dispatchem. Test: 280/0.

6. Informacyjne, bez zmiany. Znalezisko Garncarnia (Cegielnia zjada glinę) zostaje czerwone z opisem w teście.

## Wyniki testów (surowe liczby, uruchomione w tej rundzie)
- ekonomia-5x-inwariant-test: 280 passed, 0 failed
- grupa-b-lane-test: 49 pass, 0 fail
- hex-plony-magazyn-test: 14 passed, 0 failed
- zloto-test: 45 pass, 0 fail
- tarasy-cywilizacje-test: 18 passed, 0 failed
- rekrutacja-koszty-polowa-all-test: PASS (exit 0)
- mennica-magazyn-test: 39 passed, 2 failed (czerwone, patrz BLOKADY)
- tsc --noEmit (gra/): exit 0

Bramki logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6: NIE_ZMIERZONO w tej rundzie (src i data nie zmienione; rundę ograniczono do testów tematu).

## BLOKADY (czerwone z opisem błędu gry, nie błędu testu)
- mennica-magazyn-test: „Mennica BEZ Waluty” got 0 want 2 (Mennica nie dowozi plonu Pieniądza w scenariuszu; niezależne od złota). Wymaga wyjaśnienia przez orkiestratora.
- mennica-magazyn-test: „Garncarnia: ceramika > 0” got undefined (Cegielnia zjada całą glinę z magazynu 40 w jednym ticku; kolejność konwerterów). Znalezisko gry.

## UWAGI-DLA-ORKIESTRATORA
- Zarzut 3 (tautologia) zostaje jako uwaga; mutację wykrywają inne testy (patrz wyżej).
- W środowisku worktree utworzono symlink gra/node_modules -> worktree wf_6859d754-245-1 (ignorowany przez .gitignore, nie commitowany).
- Plik /tmp/none utworzony przez pomyłkę poza repo; do usunięcia ręcznie (rm zabroniony dispatchem).

RUNDY: 2/5 (runda obrony po FAIL/zarzutach Evaluatora)
NASTĘPNY KROK: Evaluator rundy 2 weryfikuje poprawki w mennica i rekrutacja; orkiestrator decyduje o czerwonych asercjach mennica.
DEPLOY/PUSH: NIE WYKONANO
