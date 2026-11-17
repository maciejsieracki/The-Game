STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-DESPAIR-SHOW-FORMULA-IMPL-Q1
GOAL: obrona Operatora na zarzuty Evaluatora (b5e84b545, kandydat 4971c8c19). Rola: Obrona (Haiku).

ZMIANY-COMMIT: baza 61c7b64cb, kandydat 4971c8c19 (kod bez zmian w tej obronie). Commit obrony: tylko gra/tools/diplo-weariness-display-test.cjs (+ ten raport). SHA końcowy: patrz pole sha w odpowiedzi. Nie dotknięto war-weariness.ts, params.json, ai.ts, main.ts, WERSJE.md, wikiBundle.

ODPOWIEDZI NA ZARZUTY:
Z1 (plik poza allowlistą gra/tools/diplo-panel-aiai-both-labels-test.cjs, asercja A6 „Ty" → nazwa cywilizacji): PRZYJMUJĘ jako jawne odstępstwo od allowlisty. Konieczne wg kryterium 4 (bez zmiany test byłby czerwony). Zakres: 3 linie. Zatwierdzenie odstępstwa — decyzja orkiestratora.
Z2 (tabela parytetu odbiega od dispatchu): PRZYJMUJĘ częściowo, poprawka w commicie.
  - Poziomy zmęczenia ustawione dokładnie jak w dispatchu: level = tury/pelneTur + 0,1·miasta (war-weariness.ts:85, pelneTur=40) → tury 0 / 11,2 / 20 / 40 daje 0 / 0,28 / 0,5 / 1 (wcześniej 11 zamiast 11,2).
  - Udziały: 0,27 / 0,45 / 0,46 (przegrywa wg progu, udział > 0,45 → 0) / 0,5 (remis). Dodano 0,46 i 0,5.
  - Gałąź „rowny" sprawdza teraz wartość zmęczenia i brak desperacji (nowy test E5b).
  - ODRZUCAM udział 0,6 w tabeli przegrywającego: strona o udziale > 0,5 jest wygrywająca (compareMilitaryStrength, próg 110%), więc 0,6 nie jest przypadkiem przegrywającego. Pokrywa E3b.
  - Wynik: E5 48/48 zgodnych (było 24/24), E5b OK; diplo-weariness-display-test 54/0.
  - Mutacja (przywrócona bramka isWarWeary w gałęzi 'ai', plik przywrócony po teście): exit 1, FAIL [E4a], FAIL [E5] 38/48 (10 niezgodności, np. share 0,27 tury 0 lost 0: panel 0 vs exp 0,1999). Po revert: 54/0.
Z3 (brak dowodu live Chromium): PRZYJMUJĘ zarzut. NIE ZMIERZONO. Powód: dispatch zakazuje npm run build/dev w gra/, a harness live (bundle HTML + hak civTest + zrzut panelu) nie był w tej rundzie zbudowany; dysk 2,1 GB wolnego (próg web 4 GB). Wygląd tooltipu i podpisów w panelu niezweryfikowany wizualnie.
Z4 (komentarze ai.ts w main.ts): ODRZUCAM jako zarzut do tej rundy. main.ts jest zakazany do edycji, a kryterium 3 dotyczy war-weariness-view.ts. Zapis informacyjny: src/main.ts:12237 („ai.ts (gracz↔AI) liczy z bieżącego poziomu") jest prawdziwy co do poziomu; src/main.ts:45063 („co ai.ts (wearyLevel)") też. Do decyzji orkiestratora przy okazji późniejszego tematu.

TESTY (surowe wyjście, na 4971c8c19 + commit obrony):
- tsc --noEmit: exit 0, brak wyjścia
- diplo-weariness-display-test: PASSED 54 / FAILED 0 (po poprawce)
- diplo-panel-aiai-both-labels-test: Wynik 17 OK, 0 FAIL
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: 6/6 pass
Długu bazowego nie było (wszystkie zielone).

BLOKADY: dowód live (Z3) — NIE ZMIERZONO, z powodem jak wyżej.
RUNDY: obrona 1/5 (runda operatora 1 + obrona).
NASTĘPNY KROK: Final Control na commicie obrony (zachowany kandydat 4971c8c19 + tylko plik testu i raport). Decyzja orkiestratora: zatwierdzenie odstępstwa Z1 i akceptacja NIE ZMIERZONO live (Z3).
UWAGI-DLA-ORKIESTRATORA: node_modules w gra/ to symlink do worktree wf_53d42f7d-755-2/gra/node_modules (gitignored, nie usunięty — zakaz rm). Dysk 2,1 GB wolnego.
DEPLOY/PUSH: NIE WYKONANO
