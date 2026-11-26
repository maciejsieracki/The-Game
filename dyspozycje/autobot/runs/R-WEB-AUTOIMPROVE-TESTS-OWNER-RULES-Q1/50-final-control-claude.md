STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-TESTS-OWNER-RULES-Q1
GOAL: klasyfikacja czerwonych testow autoulepszen + weryfikacja zasad 25A (do 50% puli Pracy, calosc na jedzenie, kolejnosc farmy->trzody->irygacja na koncu)
ZMIANY/COMMIT: kandydat 0a4744e1f; `git merge-base --is-ancestor 1bb77a7a0 0a4744e1f` = TAK. diff --stat 1bb77a7a0..0a4744e1f: 5 plikow (AUTOIMPTESTS-2026-11-26.md, 30-obrona-claude.md, autoimprove-owner-rules-test.cjs, autoimprove-pasture-irrigation-q2-test.cjs, autoimprove-stages-q1-test.cjs). Zero zmian w gra/src, kosztach i domyslnych 33% -> allowlista zachowana.
TESTY (surowe wyniki, wlasne uruchomienie na 0a4744e1f): tsc --noEmit: brak bledow; owner-rules 7 OK / 0 FAIL; stages-q1 299 passed / 0 failed; pasture-irrigation-q2 16 OK / 0 FAIL; praca-limit-50 34 passed / 0 failed; praca-miasto-limit-50-cap 50 pass / 0 fail. 5 bramek referencyjnych (logic, tech-tree, research, combat, ai-test) NIE URUCHAMIANE: gra/src identyczne z baza, zmiana tylko w gra/tools/.

OCENA ZARZUTOW:
1. Cap 50% (nr 1): ODDAL jako uwaga, nie FAIL. Zasada 25A jest egzekwowana i przypieta testami: pole (a) (udzial Pracy do puli imperium, MAX_PROCENT_PULI_IMPERIUM=50) w praca-limit-50 sc.2: zadania 60/75/100/150% -> 50 (34/0) oraz praca-miasto-limit-50-cap (50/0). Zadanie 51/60 -> 50 jest wiec pokryte istniejacym testem, tylko nie w nowym pliku. Pole (b) 0-100% to swiadoma naprawa regresji (P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1); jego zmiana to decyzja o grze, wiec DECISION_REQUIRED obrony jest proceduralnie poprawne, nie ciche luzowanie. Zadanie #177 jest zamkniete jako "bez zmian kodu, zasady potwierdzone", co wspiera odczyt: 25A potwierdza dotychczasowe zasady (cap 50% = pole a). Uwaga: domyslne 33% to DEFAULT_ULEPSZENIA_PRACA_PERCENT czyli pole (b) (cap 100) - orkiestrator niech rozstrzygnie, czy pytac wlasciciela.
2. Brak tabeli (nr 2): ZALATANE przez obrone — AUTOIMPTESTS-2026-11-26.md zawiera tabele; 8 czerwonych asercji stages-q1 = STARY-PIN (koszt wg epoki 3 vs plaski); pasture-irrigation-q2 na bazie zielony (zarzut dispatchu nie odtworzony). Przepiecia zmieniaja liczby zgodnie z kosztem epoki 3, bez oslabiania asercji.
3. 19 farm w t24 (nr 3): ODDAL; ZALOZENIE obrony (zgodne z kolejnoscia, orderViol=0) bez pomiaru mechanizmu — NIE ZMIERZONO, do osobnego tematu.
4. M2 (nr 4): ODDAL, komentarz dopisany; nie blokuje.

UWAGI-DLA-ORKIESTRATORA:
- Prog (e) 46->55 to poluzowanie na bazie zielonego testu (zmierzone max 46, margines +9); mutacja E4 (56 tur) ma tylko 1 tura marginesu wobec 55 i NIE ZOSTALA ZMIERZONA (ani przez obrone, ani przeze mnie). Zalecany osobny pomiar E4.
- Test (ii-b) bez mutacji.
- Pytanie o pole (b) (cap 100 vs 50) opcjonalne, wg ZASAD ABC tylko w jezyku skutku dla gry.
BLOKADY: brak blokujacych
RUNDY: FC 1/1 (runda tematu 1/5)
NASTEPNY KROK: integracja orkiestratora (tylko gra/tools i dyspozycje, bez deployu gry); osobny temat: pomiar mutacji E4 i kolejki pickera t24.
DEPLOY/PUSH: NIE WYKONANO
