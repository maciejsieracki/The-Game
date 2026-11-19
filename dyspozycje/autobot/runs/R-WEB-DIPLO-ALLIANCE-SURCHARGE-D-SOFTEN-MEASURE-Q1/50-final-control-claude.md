STATUS: PASS-WITH-NOTES
DOMAIN: GAME (parametr za flagą torSojuszyAktywny=OFF + pomiar)
TEMAT: R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1
GOAL: parametr dopłataDMnoznikAiAi skalujący wyłącznie dopłatę D w sojuszach AI↔AI (domyślnie 1,0 = bez zmiany) + pomiar wariantów; wartość wybiera właściciel.
ZMIANY/COMMIT: kandydat 01b79fa518a40119d67451f998e3c557459ec7db; baza d425dd0a3cef94bdc65b98ba25454fc9947eb180 jest jego przodkiem (merge-base --is-ancestor: tak). Diff 6 plików, +287/-4: gra/data/ai-ai-treaty-params.json, gra/src/game/ai-ai-treaty-evaluate.ts, gra/src/main.ts, gra/tools/ai-ai-alliance-measure-run.cjs, gra/tools/ai-ai-alliance-surcharge-test.cjs (nowy), dyspozycje/.../30-obrona-claude.md. Wszystko w allowliście tematu. git diff --check: czysto. Brak zmian w ai.ts, treaty-payment.ts, ai-ai-alliance-tick.ts. evaluateTreatyOffer wołane wyłącznie z ai-ai-treaty-tick.ts i ai-ai-alliance-tick.ts (ścieżka AI↔AI); gracz/NAP/przemarsz nietknięte. Przy mnożniku 1,0 D = split.D bit-w-bit; parity.D nieskalowane.

OCENA ZARZUTÓW (bez etykiet ról):
- Zarzut 1 (kandydat == baza, brak parametru/settera/haka): NIETRAFNY dla 01b79fa51. Oparty na błędnie przekazanym SHA kandydata (= baza). Na właściwym SHA parametr, setter ForTest i hak civTest istnieją. ODDAL.
- Zarzut 2 (brak testów 1,0/0,5 i mutacji): NIETRAFNY. Jest ai-ai-alliance-surcharge-test.cjs (D1-D8, mutanty M1-M3 wykryte). ODDAL.
- Zarzut 3 (brak tabeli pomiaru 1,0/0,5/0,25, seed 4242/7, 60 tur): CZĘŚCIOWO TRAFNY. Pomiar seed 4242 dla trzech mnożników jest w raporcie obrony, ale tura 60 i seed 7 NIE ZMIERZONO. Nie blokuje: GOAL to parametr (domyślnie bez zmiany) plus pomiar wspierający decyzję ABC; brak t60/seed 7 ogranicza pewność wyboru wartości, nie poprawność kodu. ODDAL jako uwaga.
- Zarzut 4 (brak raportu Operatora, ABC, lokalizacji D, histogramu odmów): CZĘŚCIOWO TRAFNY. Lokalizacja D: ai-ai-treaty-evaluate.ts, krok 8 (skalowanie dopłaty). Odmowy D i gotowość dla seeda 4242 podane w obronie (D 102/82/16). Pytanie ABC należy do orkiestratora. ODDAL jako uwaga.
- Zarzut 5 (brak commita): NIETRAFNY, commit 01b79fa51 istnieje (błąd przekazania SHA).

TESTY (własne uruchomienie na 01b79fa51, katalog gra/, npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic-test: 213/213
- tech-tree-test: 20 pass / 0 fail
- research-test: 33/0
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-ai-treaty-evaluate-test: 21 pass / 0 fail, mutanty niewykryte 0
- ai-ai-alliance-tick-test: suite 19/19, mutanty 8/8
- ai-ai-alliance-surcharge-test: ALL GREEN, mutanty M1-M3 wykryte
NIE_ZMIERZONO przez FC: pomiar przeglądarkowy (liczby seed 4242 pochodzą z raportu obrony); payment-wiring/NAP/koalicja nie powtarzane (diff ich nie dotyka; wnioskowanie z diffu).

BLOKADY: brak blokad technicznych. NIE ZMIERZONO: tura 60 i seed 7; wznowienie runnera ze slotu przy 1,0 zakończyło się awarią przeglądarki (niezdiagnozowane). Wariant wykładnikowy dopłataDWykladnikR nie zrobiony (poza minimalnym zakresem).
RUNDY: FC po rundzie 2/5. Założenie: zarzuty 1, 2, 5 wynikały z błędnego SHA kandydata.
NASTĘPNY KROK: orkiestrator integruje 01b79fa51, zadaje pytanie ABC o mnożnik (rekomendacja obrony: A 0,5; B 0,25; C 1,0 status quo) i decyduje o dopomiarze seed 7 / t60 oraz diagnozie awarii wznowienia. Domyślne 1,0 = zero zmiany zachowania, więc integracja bezpieczna.
UWAGI-DLA-ORKIESTRATORA: skrypt workflow przekazał SHA kandydata = baza; do poprawy. Seed 4242: przy 0,25 pierwszy sojusz t34 vs t42, odmowy D 16 vs 102 (jeden seed).
DEPLOY/PUSH: NIE WYKONANO

---
## FC rundy 3 (kandydat 5a45ccc2dc2c3a0895e11aa7d8c13455058b44f2, baza fae3b45614f960733ef2a83e8e473dd85d510fc2)
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (parametr za flagą torSojuszyAktywny=OFF + pomiar)
TEMAT: R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-SOFTEN-MEASURE-Q1
GOAL: parametr dopłataDMnoznikAiAi (domyślnie 1,0 = bez zmiany) skalujący wyłącznie D w sojuszach AI↔AI; zarzuty Evaluatora domknięte; wartość mnożnika wybiera właściciel po pomiarze.
ZMIANY/COMMIT: merge-base --is-ancestor fae3b4561 -> 5a45ccc2d: TAK. Diff względem origin/main 053406cec: 8 plików (+374/-4): ai-ai-treaty-params.json (+param 1.0), ai-ai-treaty-evaluate.ts (+20: aiAiDopłataMnoznik, setter ForTest, krok 8 skaluje D; przy 1,0 D = split.D bit-w-bit), main.ts (+6: import + hak civTest), ai-ai-alliance-measure-run.cjs (--mnoznik), ai-ai-alliance-surcharge-test.cjs (nowy, D1-D10 + M1-M4), raporty w runs/. Brak zmian w gra-robocza/, WERSJE.md, manifeście, ai.ts, treaty-payment.ts. ai-ai-treaty-evaluate.ts poza literalną allowlistą, ale to jedyne miejsce liczenia D (importerzy tylko ai-ai-*, test D8) - UWAGA, nie FAIL.
OCENA ZARZUTÓW:
1. Brak testu fallbacku: NAPRAWIONE (D9 + mutant M4 wykryty; potwierdzone uruchomieniem).
2. Pomiar niepełny (t60, seed 7): NIE ZMIERZONO, ODDAL jako uwaga (zakaz ponawiania z addendum; GOAL to parametr, pomiar wspiera ABC). Decyzja ABC oparta na jednym ziarnie 4242.
3. dopłataDWykladnikR niezrobiony + plik poza allowlistą: ODDAL jako uwaga (wariant opcjonalny, miejsce merytorycznie właściwe).
4. Okablowanie haka: NAPRAWIONE statycznie (D10); działanie w przeglądarce NIE ZMIERZONO. ODDAL jako uwaga.
TESTY (własne, gra/, npm ci --ignore-scripts, na 5a45ccc2d): tsc --noEmit exit 0; logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-ai-alliance-tick-test 19/19, mutanty 8/8; ai-ai-alliance-limit-test SUMMARY OK (4/4+4/4); ai-ai-treaty-evaluate-test 21/0, mutanty niewykryte 0; ai-ai-alliance-surcharge-test D1-D10 OK, M1-M4 MUT-OK, ALL GREEN; diplomacy-zero-trust-unit-test 43/0; ai-ai-alliance-measure-hook-test 28/28 mutantów, ZIELONY; diplo-treaty-payment-carrier-test 11/0; diplo-treaty-payment-wiring-test 468/0.
BLOKADY: brak technicznych. NIE ZMIERZONO: pomiar t60/seed 7, hak w przeglądarce. unit-replace-full-cost-test pre-existing FAIL (zgłoszone przez obronę) nie uruchamiane.
RUNDY: FC po rundzie 3 (obrona 4/4 zarzutów odpowiedzianych).
NASTĘPNY KROK: integracja 5a45ccc2d przez orkiestratora; osobny pomiar seed 4242 i 7, 60 tur, mnożniki 1,0/0,5/0,25 przed pytaniem ABC o wartość.
UWAGI-DLA-ORKIESTRATORA: pre-existing FAIL unit-replace-full-cost-test (39/1 na 053406cec) - osobny temat. Domyślne 1,0 = zero zmiany zachowania, integracja bezpieczna.
DEPLOY/PUSH: NIE WYKONANO
