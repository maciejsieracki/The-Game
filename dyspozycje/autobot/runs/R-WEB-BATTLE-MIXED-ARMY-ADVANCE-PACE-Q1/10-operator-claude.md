STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1
GOAL: w rozkazie Atak cała armia mieszana (piechota, strzelcy, machiny, konnica) idzie tempem najwolniejszej jednostki do pierwszego wzwarcia wręcz; konnica poza regułą tempa (FALA 554/578); strzelcy po wzwarciu trzymają dystans (zarzut 1 rundy 1).
ZMIANY/COMMIT: runda 4/5, baza kandydata 6ea477041 (wejście bez zmian w battleScene.ts). Zmieniony plik: gra/tools/battle-mixed-army-advance-pace-test.cjs (test regresyjny). Brak zmian w gra/src (reguły walki, flanki konnicy 554/578 nietknięte). SHA commita: patrz pole sha.
ZAMKNIĘTE ZARZUTY FC RUNDY 1:
- Zarzut 1 (kryterium 3, kite strzelca po wzwarciu): DODANY test B (B1, B2) wymuszający mechanizm w izolacji. Scenariusz: jeden łucznik obok jednego wroga wręcz (q 10 vs 11), łucznik na jednostce 'manual' (ścieżka _rangedAction; przy doktrynie AUTO ścieżka _executeGroupDoctrineStep nie wykonuje kite, zmierzone). Wynik: 6 ruchów kite, każdy zwiększa dystans; krok z sąsiedztwa przywraca dystans do 2 (MELEE_SAFE_GAP). Mutacja MUTATE_KITE=1 (rangedKite=false): B1 i B2 FAIL (0 ruchów kite), wynik exit 1. Uwaga: test sprawdza, że strzelec z wrogiem wręcz w zasięgu 2 cofa się, a nie pełne kryterium 'dystans >= 2 w każdym momencie' (wróg wręcz dochodzi ponownie w swojej turze; po jego ruchu dystans wraca do 1). Kryterium 'gdy możliwe i w zasięgu' jest pokryte krokiem z sąsiedztwa; pełna ciągłość dystansu w wielu turach NIE_ZMIERZONO.
- Zarzut 2 (test strzelców nie odróżnia bazy): NIEMOŻLIWE przy obecnym scenariuszu. Pomiar MEASURE: baza 81e357dee i poprawka dają archers spread 0 w każdym kroku (krok 0..12). Zawężono kryterium 1 do machin (A3). Archer check zostaje jako regresja, oznaczona 'NIE rozroznia bazy' (A2). Machiny: baza spread 2 w krokach 4..12, poprawka 0..1 (pomiar z progiem 1, zob. ZAPIS PROGU niżej). Przy TOL_RANK1=2 (decyzja ABC) baza przechodzi próg 2 -- mutacja machin NIE czerwieni testu. To jest luka, nie zamknięty zarzut (DECISION_REQUIRED).
- Zarzut 4 (grupa bez piechoty / kontakt innej grupy): DODANY test C1: g1 (piechota) w kontakcie z wrogiem od rundy 0, g2 (łucznicy + taran, bez piechoty) ma spread 0,1,2,2,... <= TOL_RANK1=2 przez 12 rund. Mutacja group-scope (usunięty warunek groupId w meleeContact, kopia sceny w src/battle, usunięta po pomiarze): C1 PASS -- NIE czerwieni. Próba relacyjnego testu (trajektoria g2 z kontaktem g1 vs bez) odrzucona: trajektorie różnią się również bez mutacji (wpływ ścieżek/kolejności tury), więc test nie jest rozstrzygający. NIE_ZMIERZONO: mutacja dla zarzutu 4.
- TOL / TOL_RANK1 (decyzja ABC): TOL = 2, TOL_RANK1 = 2 wpisane w test. Zgodnie z dispatchem bez zmian wartości w engine.
- Zarzut 5 (AUTO=SKIP parity): poza zakresem tej rundy, NIE_ZMIERZONO (nie uruchamiano battle-skip-equals-auto-resolve-test; limit 590 s).

ZMIANA TESTU (dla porównania z rundą 1): A1 melee spread <= TOL (2); A2 archers spread <= TOL_RANK1 (2, regresja); A3 machines spread <= TOL_RANK1 (2); A4 archers advance; B1/B2 kite; C1 group without infantry.

TESTY (surowe wyjścia, ta sesja):
- tsc --noEmit (gra): exit 0, brak błędów.
- battle-mixed-army-advance-pace-test.cjs (fix, 6ea477041 + nowy test): PASS A1, A2, A3, A4, B1, B2, C1; exit 0. Pomiar: piechota 0; łucznicy 0; machiny 0/1 w krokach 0..12 (approach window 13 rund).
- battle-mixed-army-advance-pace-test.cjs z MUTATE_KITE=1: FAIL B1 (0 ruchów kite), FAIL B2; AssertionError, exit 1 (mutacja czerwieni kite).
- Mutant group-scope (sed na kopii battleScene): C1 PASS -> brak czerwienia (NIE_ZMIERZONO, patrz zarzut 4).
- Baza 81e357dee (kopia sceny, SCENE_FILE), MEASURE: machiny spread 2 w krokach 4..12 (poprawka 0..1); archers 0; piechota 0. Przy progu 1 test czerwieni bazę; przy progu 2 nie.
- battle-line-advance-uniform-test.cjs (W19): exit 0, 17 linii PASS.
- battle-cavalry-flank-default-test.cjs: exit 0 (1 PASS, 0 FAIL w wyjściu).
- battle-large-mixed-doctrine-matrix-test.cjs: exit 0 (wyjście bez linii PASS/FAIL; zmienia 01-matrix.json w R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1 -- przywrócone git checkout, nie w diffie).
- battle-ranged-mounted-doctrine-test.cjs: exit 0 (wyjście bez linii PASS/FAIL).
- battle-formation-rules-test.cjs: exit 0.
- battle-standoff-two-warriors-test.cjs: exit 0 (9 PASS, 0 FAIL).
- NIE_ZMIERZONO: battle-skip-equals-auto-resolve-test (zarzut 5, limit czasu), pozostałe battle-*/ai-battle-* (poza limitem 280 s tej rundy), zrzut Chromium.

BLOKADY:
- DECISION_REQUIRED (ABC): TOL_RANK1 = 2 nie pozwala czerwienić mutacji machin (baza = 2 = próg). Pytanie: (a) zostawić 2 i uznać mutację machin za NIE_ZMIERZONO, czy (b) dodać osobną bramkę regresji = zmierzona wartość 1 (nowy próg, wymaga zgody). Operator nie dodał progu sam.
- NIE_ZMIERZONO: mutacja dla zarzutu 4 (grupa bez piechoty), ciągłość dystansu strzelca w wielu turach po kontakcie.
- Pozostałe NIE_ZMIERZONO: AUTO=SKIP, zrzut Chromium.

RUNDY: 4/5 (wejście z rundy 3; tu zamknięte zarzuty 1, 2 częściowo, 4 częściowo).
NASTĘPNY KROK: Evaluator (Sonnet): zweryfikować test B (kite, mutacja MUTATE_KITE=1 czerwieni) i decyzję ABC o progu machin (DECISION_REQUIRED). Zarzut 4 (mutacja) i zarzut 2 (machiny) do decyzji właściciela albo osobnego tematu.
DEPLOY/PUSH: NIE WYKONANO
