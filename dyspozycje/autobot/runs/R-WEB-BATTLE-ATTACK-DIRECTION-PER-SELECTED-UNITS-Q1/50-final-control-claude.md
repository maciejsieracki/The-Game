# R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1 — Final Control (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1
GOAL: Kierunek natarcia, Formacja i Konnica działają na dokładnie zaznaczone jednostki; brak zaznaczenia = cała armia; meta grupy tylko przy pełnym pokryciu grupy.
ZMIANY/COMMIT: integrować 0721e8d80 (potomek bazy ac3352c25: merge-base --is-ancestor = TAK). Diff vs baza: battleScene.ts, battle-attack-dir-per-selection-test.cjs, 10-walka.md, wikiBundle.json, runs/<ID>/10,30. Mieści się w allowliście; brak main.ts/WERSJE/manifest/rust-port.
TESTY (surowe, kandydat 0721e8d80): tsc --noEmit exit 0; battle-attack-dir-per-selection-test OK checks=32; logic 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6; C-FLANK 960, 536, 163, 994 PASS; melee-doctrine PASS; undeployed-units 37/0; git diff --check czysty. Czerwonych bramek brak (porównanie z bazą zbędne). Mutacji M1-M3 z obrony nie powtarzałem (lektura diffu: resolver zwraca wyłącznie zaznaczone, _fullyCoveredGroupIds bramkuje meta grupy).

## Zarzuty
1. Brak ETAP 1 w Chromium: ODDAL (pomiar ręczny przy deployu). Przyczyna (rozszerzanie na grupę w resolverze) potwierdzona lekturą kodu; poprawka to logika stanu pokryta testami. Wygląd chipu "Natarcie: różne" i zrzuty: NIE ZMIERZONO.
2. Testy e/f nie sprawdzały przestawienia: ODDAL (dodane e2/f0, mutacja M1 FAIL wg obrony).
3. Brak testów 2 grup / chipu: ODDAL (g, g2, h, h2, i). Test AUTO/SKIP deterministyczny nie zrobiony (brak harnessu), pokrycie pośrednie C-FLANK; nota, nie blokuje.
4. Dokumentacja/komentarze: ODDAL (komentarze, poradnik, wikiBundle). Brak hasła w encyklopedii: nota.
5. Komunikat zakresu: ODDAL (dodano "cała grupa (N)"; "cała armia" przy pełnym zaznaczeniu jest prawdziwe).
6. Chip, przypadki brzegowe: ODDAL (poprawione i przetestowane).
7. Dług Rust REPIN: ODDAL (zapisany w 30-obrona-claude.md, sekcja DŁUG RUST; orkiestrator przenosi do rejestru).
Żaden zarzut nie jest NAPRAW.

BLOKADY: brak blokujących. NIE ZMIERZONO: Chromium/chip/AUTO w żywej grze.
UWAGI-DLA-ORKIESTRATORA: (1) meta grupy attackDirection zapisywana, nigdzie nie czytana — decyzja właściciela (odczyt vs usunięcie); (2) po deployu na ROBOCZĄ sprawdzić ręcznie: zaznaczona konnica + Tył, chip "Natarcie: różne", Formacja/Konnica na części jednostek; (3) wpisać dług REPIN do rejestru.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (0721e8d80) i bramki po merge.
DEPLOY/PUSH: NIE WYKONANO
