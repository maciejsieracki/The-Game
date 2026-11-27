STATUS: FAIL
DOMAIN: GAME (integralność zapisu)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: Po wczytaniu zapisu stan B ma być równy stanowi A (ciągłość zapis-wczytanie). NIE OSIĄGNIĘTE.

ZMIANY-COMMIT: kandydat cbeddd1fdab6379abc9550ddfcfab417e049fbb9, baza 31a1ad39d93e2f8b64ef37fc6cca974fb2849e63.
- `git merge-base --is-ancestor` baza -> kandydat: ANC_OK.
- `git diff --stat` baza..kandydat: 4 pliki (dokument stanu ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md, 10-operator-claude.md, 30-obrona-claude.md, diag-savefix-r2-main.patch), 220+/91-. Wszystko dokumentacja/run-dir; w allowliście.
- `git diff --name-only baza..kandydat -- gra` = 0 plików. Zero zmian w kodzie gry.
- savedigest-run.cjs: zgodny z bazą (zarzut 7 naprawiony). `grep -c __savefixDiag gra/src/main.ts` = 0.
- Brak plików `gra/tools/save-load-continuity-*` (0).

OCENA ZARZUTÓW (bez etykiet ról):
1 (brak poprawki): POTWIERDZONY, git diff -- gra = 0. Obrona przyjęła.
2 (przyczyna nieznana): POTWIERDZONY, dokument stanu sam to deklaruje.
3 (brak testu ciągłości, zgodności wstecznej, mutacji czerwonej): POTWIERDZONY.
4 (brak dokumentu): ODDALONY formalnie (dokument istnieje), ale to dokument stanu bez przyczyny, nie naprawy.
5 (pokrycie 1/16): POTWIERDZONY, reszta NIE ZMIERZONO.
6 (ścieżka harnessu): obrona częściowo słuszna (restoreJson przechodzi przez restoreGameFromSave z mapSnapshot); pozostaje niezmierzona ścieżka UI (loadNeedsMapRebuild, regenerateWorldForLoad, wczytanie z pauzy). Zarzut w części o niemierzonej ścieżce UI utrzymany.
7 (higiena): NAPRAWIONY w kandydacie (potwierdzone diffem i grep-em).

TESTY: Bramki (tsc, 5 referencyjnych, testy tematu) NIE URUCHOMIONE przeze mnie: kandydat nie zmienia gra/, więc nie ma czego bramkować, a testu tematu nie ma. Wyniki liczbowe: NIE ZMIERZONO. Poziom maks. wg zasady testowania: nie dotyczy (brak pomiarów w tej rundzie).

BLOKADY: brak poprawki w gra/src; przyczyna B != A nieznana; brak testu regresji i mutacji; pomiar tylko dla cfg max/seed 4242/t3; ścieżka UI niezmierzona.

RUNDY: 2/5 zużyte po FC; ten werdykt = FAIL, wraca do Operatora tego samego ID (runda 3). Decyzja właściciela: niewymagana.

NASTĘPNY KROK: runda 3 (Operator): zrzut ownerBonusy/ownerCivKey/mpMults i pól miasta 26 w A@t3 vs B po restore; bisekcja po kolejności Map i zmiennych let; pomiar ścieżki UI (regenerateWorldForLoad, wczytanie z pauzy); potem poprawka + test save-load-continuity + zgodność wsteczna + mutacja czerwona. Patch diag-savefix-r2-main.patch NIE integrować (poza main.ts zależny od __savefixDiag).

UWAGI-DLA-ORKIESTRATORA: kandydat nadaje się do integracji WYŁĄCZNIE jako dokumentacja stanu (bez gra/), ale nie jest READY_FOR_DEPLOY. Kandydat BŁĄD-GRY (z obrony): wczytanie z pauzy nie odbudowuje mapy, do potwierdzenia testem.

DEPLOY/PUSH: NIE WYKONANO
