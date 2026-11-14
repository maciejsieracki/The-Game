STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; bez zmian logiki gry)
TEMAT: R-WEB-DETERMINISM-WAR-T19-DIVERGENCE-DIAG-Q1
GOAL: źródło niedeterminizmu przebiegu wojny (rozjazd digestu od T19/T20) i rozstrzygnięcie (a)/(b).
ZMIANY/COMMIT: kandydat 061f8a50c3a73f4f9fa3c25f5fa8fe44931868ed (potomek bazy 3cc205e4a: `git merge-base --is-ancestor` = tak). Diff vs baza: 4 pliki, +419: gra/tools/determinism-war-t19-diag-dump.cjs, gra/tools/determinism-war-t19-diag-cmp.cjs, runs/<ID>/10-operator-claude.md, 30-obrona-claude.md. Zgodne z allowlistą; gra/src nietknięty.

## Zarzuty
| Nr | Decyzja | Uzasadnienie |
|---|---|---|
| 1 skrypty niezacommitowane | ODDAL | oba pliki są w kandydacie, `node --check` OK. |
| 2 brak kontroli bez trybu przyspieszonego | ODDAL | kontrola wykonana (FAST_MODE=0): rozjazd od T19 bez FIXED_NOW, 22/22 z FIXED_NOW; etykieta zmierzona. |
| 3 Math.random ODRZUCONE | ODDAL | przeetykietowane na NIE_ZMIERZONO; sam sprawdziłem: wywołania resolveCombat w battleScene.ts:20838 i manualBattle.ts:1062 nie przekazują `rng`. |
| 4 zakres digestu | ODDAL | wniosek zawężony do pól zmierzonych. |
| 5 stackGroupSeq / cities.ts:89 | ODDAL | opisane statycznie; reszta NIE_ZMIERZONO, opcje (a)/(b) opisane jako decyzja na osobny temat. |
Zero NAPRAW. Brak realnej decyzji produktowej w tym temacie (wybór a/b to osobny temat).

## Weryfikacja własna
- Potwierdzono w kodzie: armyMerge.ts:75 `'sg'+ownerId+'_'+Date.now().toString(36)+'_'+seq`; użycia stackGroupId to porównania równości.
- `tsc --noEmit -p gra/tsconfig.json`: rc=0 (surowe, node_modules podlinkowane tymczasowo, usunięte).
- `git diff --check 3cc205e4a..061f8a50c`: czysto (brak wyjścia).
- Testy tematu: temat diagnostyczny (brak testów jednostkowych); przebiegów Chromium nie powtarzałem (NIE_ZMIERZONO przeze mnie; opieram się na surowych wynikach z raportów operatora/obrony: 8 przebiegów + 2 kontrole, 2 ziarna w trybie przyspieszonym, 1 ziarno w zwykłym).
- 5 bramek referencyjnych: nie uruchamiane, bo kod gry (gra/src, gra/data) bez zmian względem bazy; nie ma czerwonych do porównania.

## Wynik merytoryczny
Źródło: Date.now() w stackGroupId (armyMerge.ts:75), jedyna różnica w polach zmierzonych (units, cities, zapis bez savedAt). Artefakt tożsamości, nie logiki. Zamrożony zegar daje 22/22.

BLOKADY: brak. NIE_ZMIERZONO: walka z fallbackiem Math.random w 22 turach; kolejki negocjacji w pamięci; cities.ts:89; stackGroupSeq po wczytaniu; seed 314159 w zwykłym trybie.

UWAGI-DLA-ORKIESTRATORA:
1. Osobny temat harnessu: normalizacja stackGroupId w digeście (b) + test regresji FIXED_NOW, oba ziarna.
2. Decyzja właściciela (a) deterministyczne ID + trwały licznik w zapisie.
3. UWAGA-1: walka ręczna/sceniczna bez `rng` w resolveCombat (battleScene.ts:20838, manualBattle.ts:1062) — osobny temat z przebiegiem z walką.
4. Tekst 10-operator-claude.md mówi o niezacommitowanych skryptach (nieaktualne po obronie).
5. Brak tworzenia sesji/zadań.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (dokumentacja + narzędzia, bez wdrożenia).
DEPLOY/PUSH: NIE WYKONANO
