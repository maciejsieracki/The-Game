# R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 — Final Control, runda 3/5

STATUS: PASS-WITH-NOTES (kod i testy poprawne; GOAL 3-6 ofert/100 tur NIEOSIAGNIETY — DECYZJA WLASCICIELA wymagana)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1
GOAL: 3-6 ofert AI->gracz na 100 tur bez spamu, bez obnizania uczciwosci wyceny.
ZMIANY/COMMIT: kandydat de8c78d6e8e9e9422470658bf3e5dea4b8581d14 (potomek bazy 6612d1596; zmienia gra/src/main.ts, gra/tools/measure-ai-trade-offer-frequency.cjs, test, runs/**; ai-params.json bez zmian). integration_sha = de8c78d6e (kod). Ten plik: osobny commit tylko z raportem.

## Weryfikacja wlasna (surowe wyniki)
- is-ancestor 6612d1596 -> de8c78d6e: TAK. is-ancestor d64cd5d46 (r2) -> de8c78d6e: NIE (kandydat nie ma artefaktow r2; origin/main = 6e1002453).
- git merge-tree origin/main + kandydat: main.ts i measure-*.cjs scalaja sie automatycznie; konflikty add/add TYLKO: ai-trade-offer-frequency-up-test.cjs, 10-operator-claude.md, 30-obrona-claude.md.
- Proba scalenia (cofnieta): test = wersja kandydata (zawiera [R2-1..4] + [R3-A/B]); na scalonym drzewie: tsc --noEmit exit 0; ai-trade-offer-frequency-up-test 28 pass/0 fail; ai-trade-proposal-branch 10/0; ai-trade-proposal-to-player 25 asercji; ai-trade-wiring-e2e-live 44/0; logic 213/213.
- Na kandydacie: tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0; test tematu 28/0.
- Test tematu na bazie (main.ts z 6612d1596): 20 pass / 8 fail (wszystkie [R3-B]) = czerwony na bazie, zielony na kandydacie.
- ai-trade-oneshot-overpay-limit-test: czerwony i na bazie, i na kandydacie, ta sama asercja tekstowa (dlug poza zakresem, dispatch r3 pkt 5; zad. #379).
- Dane pomiarowe z evidence JSON: baza ECON r3-diag 1/450 tur = 0,22/100; po poprawce r3-fix3 s1111=1, s2222=1, s3333=2 => 4/450 = 0,89/100; lejek sumuje sie do 150 (np. s1111 15+0+135).
- Nie uruchamiano ponownie pomiaru w Chromium (NIE_ZMIERZONO przez FC; opieram sie na JSON evidence). Mapa-gen/Mgla nie uruchamiane (kod mapy/mgly nietkniety).

## Zarzuty Evaluatora
1. ODDAL (przyjety i naprawiony w obronie: test scalony; zostaje tylko mechaniczne scalenie plikow raportow przy integracji, kod bez konfliktu).
2. ODDAL z adnotacja: odstep i bramki maja test behawioralny (canAiProposeResourceTrade, decideAIDiplomacy); parytet wyceny ma test silnika [R3-A] + strazników zrodla [R3-B]; limit 1 oferty/AI sprawdzany zrodlowo, bo enqueue zyje w closure boot(). NIE_ZMIERZONO behawioralnie na zywo — ograniczenie architektury, nie wada zmiany.
3. ODDAL: pominiecie trimu dla wymiany cyklicznej nie oslabia uczciwosci (fairnessGate, filtr bilansu PW, handelFairnessGate, podglad gracza zostaja); zgodzono sie z ocena Evaluatora.
4. DO DECYZJI CZLOWIEKA: liczba tur z wykonalna para spada (z ~121-137 do 2-5 /150), bo wybor pary odrzuca pary, ktorych gracz nie udzwignie przez caly czas wymiany; wczesniej te pary byly wybierane, ale nigdy nie trafialy na stol (0,22/100). Netto +4x, ale 0,89 < 3. To realna decyzja produktowa (opcje B/C/D w 10-operator).
5. ODDAL (poprawione w obronie).
6. ODDAL (poprawione).
7. ODDAL (poprawione; kosmetyka).
8. ODDAL: NIE_ZMIERZONO wydajnosci payloadKeepsRealResourcesForPick (clamp + JSON.stringify na kandydata, raz na pare w tickach AI->gracz); pomiar na jednej relacji dozwolony dispatchem.
Zero zarzutow NAPRAW => brak FAIL.

## Zgodnosc z GOAL i regulami
Uczciwosc wyceny nieobnizona; cooldown 15 i ai-params.json bez zmian; bramki kontaktu/wojny/tech/NNS bez zmian; allowlista zachowana (main.ts sciezka AI->gracz, narzedzie pomiarowe, test, runs). Cel czestosci niespelniony zgodnie z DODATKIEM 2 pkt 3 => DECISION_REQUIRED z liczbami, bez dostrajania na sile.

## UWAGI-DLA-ORKIESTRATORA
- Integracja: merge kandydata z origin/main; konflikty add/add: test (wziac wersje kandydata), 10-operator-claude.md i 30-obrona-claude.md (zachowac oba raporty, np. r3 pod nazwami z sufiksem -r3). Kod gry scala sie bez konfliktu. Zweryfikowac po merge: tsc + 5 testow wyzej.
- Decyzja wlasciciela A/B/C/D (zob. 10-operator-claude.md): rekomendacja Operatora C (mniejsza paczka do realnych zasobow, nowy temat); NIE_ZMIERZONO czy osiagnie 3-6.
- Deploy ROBOCZA: poprawka daje realny zysk (0,22 -> 0,89) bez ryzyka spamu (max 2 oferty/AI/150 tur); decyzja po stronie orkiestratora/wlasciciela.

RUNDY: 3/5
NASTEPNY KROK: integracja orkiestratora (merge + bramki) i decyzja wlasciciela ws. celu 3-6.
DEPLOY/PUSH: NIE WYKONANO
