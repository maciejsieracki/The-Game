STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI bitwy, pozycjonowanie etykiet obrazen)
TEMAT: R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1
GOAL: etykiety obrazen nad jedna jednostka nie nakladaja sie; kolory i tresc liczb bez zmian.
ZMIANY/COMMIT: kandydat f1356f78d410c64ade21fe2c1dc0da9086b795f7 (potomek bazy cc7ba08669f1, `git merge-base --is-ancestor` = tak). Diff vs baza: battleScene.ts (+23/-1, tylko _spawnDamageLabel + pole owner + import), nowy damageLabelStack.ts, nowy test battle-damage-label-stack-test.cjs, raporty 10/30. Allowlista zachowana; brak zmian regul walki/kolorow, WERSJE.md, gra-robocza. integration_sha = f1356f78d (kod); ten raport jest osobnym commitem tylko dokumentacji.
ZARZUTY:
1 (brak pomiaru Chromium): ODDAL - zmierzone przeze mnie niezaleznie (patrz TESTY).
2 (slaby dowod mutacyjny, wiring regexem): ODDAL z uwaga - test S symuluje os czasu w px, mutanty obrony 8/6/1 FAIL; zachowanie wiringu potwierdzone na zywo.
3 (offset z liczby aktywnych): ODDAL - poprawione w f1356f78d (Y z aktualnej wysokosci aktywnych etykiet, krok 20 px przez skale kamery).
4 (etykieta tuz przed wygasnieciem): ODDAL - opacity 1-p^2, nadal zajmuje miejsce; konserwatywne, kosmetyczne.
Zadnego NAPRAW => brak FAIL.
TESTY (wlasne, surowe wyjscie, worktree na f1356f78d, npm ci --ignore-scripts):
- tsc --noEmit: EXIT 0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: PASSED 33/0 ALL GREEN; unit-replace-test: 21/21; combat-test: 6/6
- battle-damage-label-stack-test: 23 PASS, 0 FAIL; battle-damage-colors-test: 28 PASS / 0 FAIL
- Zywy Chromium (xvfb, vite build poza repo, ?playtest=mapa, bitwa 28v28, 1440x900): wlasna sonda (scratchpad, poza repo) - ta sama jednostka gracza, 4 etykiety co 350 ms, potem 7 co 600 ms, odczyt style.top z DOM: minimalny odstep miedzy sasiednimi etykietami 20.6-21.8 px przy czcionce 15 px, n=2..11, 13 PASS / 0 FAIL, bez bledow strony, kolory wg strony (11 etykiet, 0 zlych). Zgodne z pomiarem obrony (21-22 px).
- Baza "PRZED": nie budowana osobno; pomiar przed z raportu 30 (wszystkie etykiety na tym samym worldY 0.92), NIE ZMIERZONO przeze mnie.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA:
- W sondzie duration etykiet = 60000 ms (jak w harnessie kolorow), wiec wygasanie nie mierzone na zywo (pokryte testem S). Inny zoom niz domyslny nie sprawdzany.
- manualBattle.ts (osobna kopia FloatLabel) nie objety - poza zakresem.
RUNDY: FC 1 (po rundzie 2 operatora/obrony)
NASTEPNY KROK: integracja orkiestratora (merge f1356f78d do main, bramki), deploy po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
