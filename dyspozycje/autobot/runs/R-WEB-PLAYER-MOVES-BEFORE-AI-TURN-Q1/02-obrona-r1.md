STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-MOVES-BEFORE-AI-TURN-Q1
ROLA: Operator (obrona) r1

Z1 PRZYJMUJE. Live RED odtworzony na bazie f568e1ed3 + WYLACZNIE instrumentacja (phaseMark + hak testowy; patrz red-baza-instrumentacja.diff, zero zmian zachowania). gate-player-moves-RED-przed.txt: 26 OK / 18 FAIL, EXIT=1; live FAIL: L1b,c,d, L2a,c, L3b,d, L5b,c, L6c,e, L7b,c (kolejnosc swiata przed ruchami, ANIM_FINISH po WORLD_START, marsz fotela przepada, swiat rusza przy otwartym oknie bitwy). GREEN: 44 OK / 0 FAIL.
Z2 PRZYJMUJE. Mutacja jest teraz "wykryta" tylko gdy wprowadza NOWA porazke o oczekiwanym kodzie (S1/S3/S4/S5); M2 na bazie wykrywana niezaleznie od innych porazek bazy (log RED: M2 OK po S3). Dodana M5 (ruch fotela PO przelaczeniu). Wszystkie 5 mutacji OK na poprawce.
Z3 ODRZUCAM. Zweryfikowane: ostatnia linia gate-player-moves-RED-przed.txt to EXIT=1 (stary i nowy log); EXIT=0 ma GREEN. Brak rozbieznosci.
Z4 PRZYJMUJE CZESCIOWO. Zmierzone PRZED vs PO: 43 pliki statyczne - identyczny zbior EXIT!=0 (9) i identyczne linie FAIL (cmp: 0 roznic); przyczyny istniejace (przypiete numery linii/liczniki, ReferenceError w wycinkach, test "PRZED" celowo FAIL). Live PO vs PRZED: events-defer 0/0, etap5-no-leak 0, 6d-a-live 0, saveload-hud-cache 0, saveload-praca-pool 0 (PO; zielone, brak regresji); drugi-fotel-tura 2/2, FOTEL2-CYWILIZACJA 2/2, dyplo-kontakt 2/2 (wizard .civ-newgame .start nie znaleziony - przedtem samo), end-turn-input-stability 1/1 (brak przegladarki Playwright pod domyslna sciezka), end-turn-gameplay-runtime 1/1 (wymaga env WORLD_GEN_DIST), 6d-b/c/e-live 124/124 (timeout 180-200 s, srodowisko). Brak testu, ktory przechodzi PRZED a pada PO. NIE_ZMIERZONO: pozostale live render/UI bez zwiazku z koncem tury. Zapis: gate-regresje-przed-po.txt.
Z5 PRZYJMUJE. Dodane L6 (live, Chromium): marsz-z-atakiem otwiera REALNE okno bitwy; przy otwartym oknie 3 s brak WORLD_START/AI_START (PLAYER_BATTLE_WAIT_START); klik Auto -> BATTLE_WAIT_END < WORLD_START < PLAYER_TURN_BEGIN. Na bazie L6c/L6e FAIL (swiat rusza przy oknie).
Z6 PRZYJMUJE jako dokumentacje + test, bez zmiany kodu. Dodane L7 (live). Ustalone: switchActiveHuman (KROK 2, main.ts ~12581) i tak robi plannedMarches.clear() ("marsze: zamknij, nie przywracaj"), wiec dawniej marsz kon. fotela przepadal w calosci; teraz jednostka dochodzi do pola przy wrogu (L7b), okno bitwy nie wycieka na kolejny fotel (L7c/e). Atak z marszu przy zmianie fotela nie jest odpalany - ZALOZENIE.
DECYZJA_WYMAGANA (nieblokujaca, domyslnie = obecne zachowanie): czy w hot-seat atak z marszu nie-ostatniego fotela ma byc wykonany w jego nastepnej turze (wymaga zmiany switchActiveHuman). Uwaga: wpis marchAttackTargets nie jest czyszczony przez switchActiveHuman (istniejace, poza zakresem).

ZMIANY/COMMIT: gra/src/main.ts (hak testowy: queueMarchAttack, hasAttackTarget, battleOpen; phaseMark PLAYER_MARCH_RESULT), gra/tools/player-moves-before-ai-turn-test.cjs, logi gate-*.txt, red-baza-instrumentacja.diff, ten raport. Logika gry bez zmian wzgledem c76886bc0.
TESTY: nowy test 44 OK/0 FAIL EXIT=0; tsc EXIT=0.
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
