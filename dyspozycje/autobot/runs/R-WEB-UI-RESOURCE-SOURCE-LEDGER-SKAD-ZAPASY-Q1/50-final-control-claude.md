STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: dziennik "Skąd zapasy" (źródła przyrostu/zużycia surowców, suma = zmiana stanu, UI w panelu surowców, pamięć N=10 tur)
ZMIANY/COMMIT: oceniany kandydat 4d2359e82843f52f4d643d7f7fc1b70e53226f80 (151658632 partia 1, 60afb0e45 obrona, 4d2359e82 raport obrony). Diff vs 5f5f1c3ca: resource-ledger.ts (nowy), turn-economy.ts, econ-params.json, resource-ledger-test.cjs, 2 raporty runs/ — w allowliście, brak plików poza nią. Kandydat jest potomkiem 5f5f1c3ca (merge-base --is-ancestor: OK). UWAGA: 5f5f1c3ca NIE jest przodkiem origin/main (3d1670626, 182 commitów przodem); integracja będzie wymagała merge z main (merge-tree nie sprawdzano).
TESTY (zmierzone przeze mnie na 4d2359e82): tsc --noEmit exit 0; resource-ledger-test 1028 passed / 0 failed (a: różnica 0, cap-12: 0, stolarnia: 0); logic-test 213/213; git diff --check czysty. NIE ZMIERZONO: pozostałe bramki referencyjne (zaufano raportowi obrony: tech-tree 20/0, research GREEN, unit-replace 21/21, combat), perf tick 100 tur, Chromium, hash stanu gry.

WERDYKT PER ZARZUT:
1 NAPRAW — księga nie pokrywa zużycia obywateli, utrzymania, budowy/rekrutacji, handlu, szlaków, miast, łupów, darów; test (a) tylko na fixture pipeline, brak ≥3 ziaren × 30 tur na ścieżce gry. Realna luka wobec GOAL/kryterium (a).
2 NAPRAW — brak źródeł "Umowa wymiany z <civ>" i "Warzelnia (<miasto>)" oraz testu (b).
3 NAPRAW — brak UI "Skąd zapasy" i zrzutu Chromium (kryterium e, NIE pomijać).
4 NAPRAW — brak pomiaru wydajności (kryterium d).
5 NAPRAW — pamięć N tur niepodłączona do stanu gry/zapisu; appendLedgerTurn/readLedgerHistoryTurns tylko w teście.
6 NAPRAW — brak testu determinizmu/hash stanu na poziomie gry (kryterium c).
7 ODDAL (naprawione w obronie 60afb0e45: wariant cap-12, różnica 0 — potwierdzone uruchomieniem).
8 ODDAL (naprawione w obronie: stolarnia jako osobne źródło, różnica 0 — potwierdzone).
9 ODDAL jako uwaga procesowa: DODATEK identyczny z 00-dispatch.md, baza 5f5f1c3ca nieprzodkowa main — do decyzji orkiestratora (nie wada kodu).

Uzasadnienie FAIL: zarzuty 1–6 to niewykonany zakres z dispatchu, nie spór; partia 1/4 jest solidna i zielona, ale temat nie spełnia kryteriów binarnych (a-pełne, b, c, d, e). Zasada: choć jeden NAPRAW => FAIL.
Rekomendacja: kandydat 4d2359e82 jest bezpieczną podstawą dla partii 2 (handel/umowy/warzelnia + zużycie w turn-economy i building-stock-cost), potem 3 (miasto/bitwa/łup/historia N w zapisie) i 4 (UI + Chromium + perf + determinizm). Kolejne rundy startować z 4d2359e82 po scaleniu z aktualnym main (wikiBundle/rejestry).

BLOKADY: brak technicznych; zakres otwarty (partie 2–4).
RUNDY: 1/5 (FC r1)
NASTĘPNY KROK: orkiestrator dopisuje DODATEK z podziałem partii i bazą 4d2359e82 (+merge main), kolejna runda Operatora tego samego ID.
UWAGI-DLA-ORKIESTRATORA: środowisko FC nie miało node_modules — wykonano npm ci w gra/ w worktree (nieśledzone). Szlak handlowy: decyzja właściciela 2026-11-14 (#311): tylko premia, bez przesuwania zapasów — partia z handlem/szlakiem nie powinna księgować szlaku jako źródła zapasów.
DEPLOY/PUSH: NIE WYKONANO
