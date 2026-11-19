STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FLEE-SPEED-HARAPPA-FASTER-Q1
GOAL: Ustalić, czy uciekające jednostki Harappy (Strażnik bram) uciekają szybciej niż jednostki gracza, i czy reguła "ucieczka = 50% ruchu" działa spójnie.
ZMIANY/COMMIT: brak zmiany gry (wynik: brak regresu). Dodany test parytetu gra/tools/battle-flee-speed-parity-test.cjs; raport tym plikiem. Baza: 04722f538 (origin/main).
TESTY:
- tsc --noEmit: EXIT 0, 0 linii błędów.
- battle-flee-speed-parity-test.cjs (Chromium, prawdziwa bitwa 3D): 34 PASS, 0 FAIL (3 scenariusze).
- Mutacja (ucieczka.mnoznik_ruchu 0.5 -> 1 w kopii roboczej): 29 FAIL, 7 PASS. Plik przywrócony (git checkout).
- battle-flee-move-half-test.cjs (istniejący): 34 PASS, 0 FAIL.
- NIE ZMIERZONO: test czysty (esbuild bez przeglądarki); ucieczka w RĘCZNYM trybie bitwy; czas wizualny ucieczki; bieg z civ gracza (harness ma cywilizacje: []).

POMIARY (max/tura = kroki uciekiniera w jednej turze; limit = floor(0.5 * normal)):
| jednostka | wł. | normal | limit | max/tura | kroków (tur) |
|---|---|---|---|---|---|
| Wojownik (Warrior) | def | 4 | 2 | 2 | 162 (84) |
| Strażnik bram Harappy | def | 3 | 1 | 1 | 23 (23) |
| Strażnik bram Harappy | atk | 3 | 1 | 1 | 52 (52) |
| Hastati (gracz-like) | def | 3 | 1 | 1 | 9 (9) |

PRZYCZYNA: brak regresu; (c)/(a). Dane: units.json Wojownik "Ruch w bitwie (heksy)"=4, Strażnik bram=3, Hastati=3; civ-matrix.json Harappa walka_ruch_bitwa_proc=0 (brak bonusu ruchu). Wszystkie uciekające jednostki we wszystkich scenariuszach mieściły się w limicie. Harappa nie jest szybsza od jednostek o tej samej bazie. Bonusy ruchu innych cywilizacji (Zulusi +20%, Egipt +15% ruchu bitwy) działają na jednostki ich właściciela, nie Harappy; nie zmierzono, jaką cywilizacją gra właściciel.

Ścieżka kodu: gra/src/battle/battleScene.ts:7867 _fleeMovePointsFor (floor(mnoznik*normal), min 1); :10462 _fleeStep (cap raz na turę); :6232 ścieżka planu AUTO (cap na klonie).

DECYZJA: brak zmiany gry. Opcje dla właściciela: (1) podać zapis lub cywilizację i jednostkę z obserwacją, to pozwoli zrobić pomiar w trybie ręcznym; (2) zostawić jak jest.

NASTĘPNY KROK: orkiestrator decyduje; przy obserwacji z trybu ręcznego potrzebny osobny pomiar.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
UWAGI-DLA-ORKIESTRATORA: brak.
