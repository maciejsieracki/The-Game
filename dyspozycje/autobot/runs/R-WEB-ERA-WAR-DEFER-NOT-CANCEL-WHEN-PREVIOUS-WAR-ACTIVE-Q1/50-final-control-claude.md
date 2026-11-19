STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-DEFER-NOT-CANCEL-WHEN-PREVIOUS-WAR-ACTIVE-Q1
GOAL: wojna Brazu/Zelaza odroczona przez trwajaca wojne ma wybuchnac po zniknieciu blokady, nie wisiec bez celu.
ZMIANY/COMMIT: kandydat 8df9ac864fe697cfff8ebade92defe151dfd5025; `git merge-base --is-ancestor 4643c43ce 8df9ac864` = TAK. `git diff --stat` (6 plikow, +188/-48): forced-war-common.ts (+39), main.ts (+39/-?), era-war-defer-not-cancel-test.cjs (+68), forced-war-iron-main-guard-test.cjs (1 linia, pin), dwa raporty run-dir. Wszystko w allowliscie; brak gra-robocza/kanon/WERSJE.md/rust-port.

TESTY (wlasne, surowe wyjscie; node_modules z innego worktree przez symlink, poza commitem):
- tsc --noEmit --ignoreDeprecations 6.0 (TS 6.0.2): baza 0 bledow, kandydat 0 bledow.
- era-war-defer-not-cancel 28/0. Mutacja (usuniecie filtra wojen naturalnych w main.ts) -> 27 passed, 1 failed (czerwone); plik przywrocony, git status czysty.
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace-archer-slinger 51/0; combat 6/6.
- era-war-delays 55/0; era-war-ignore-treaties 22/0.
- forced-war-iron-main-guard: baza 34/1, kandydat 34/1 (ta sama porazka 'finalizePeaceTreatyBetween uzbraja odpoczynek Zelaza'; pin zaktualizowany -> brak regresji).
- forced-war-bronze 45/3, forced-war-iron 54/1, multi-turn 43/5: IDENTYCZNIE jak baza 4643c43ce (porazki = progi 20/25 w testach vs 40 w JSON; dlug testowy niezwiazany ze zmiana).

OCENA ZARZUTOW:
1 pin zrodlowy: naprawiony, wynik = baza (34/1). OK.
2 brak biegu dymnego 120 tur: PRAWDA; dodatek nazywal go obowiazkowym. Mechanizm utraty NIE rozstrzygniety biegiem; poprawka to zabezpieczenie (pending bez partnera dostaje wolny cel), dowod tylko na poziomie funkcji czystej i zrodla. Nota, nie FAIL: 3 rundy, ograniczenie narzedzia pomiarowego, zmiana mala, za istniejacymi blokadami, bez zmiany progow/kosztow, bez regresji wzgledem bazy.
3 bramki 48/0, 55/0, 48/0, 41/0: wyniki identyczne z baza, niezalezne od zmiany (era-war-delays faktycznie 55/0). Czerwonych asercji nie uznaje za zielone — osobny temat.
4 wojna naturalna celu: przyjety i naprawiony (filtr countActiveWarsForOwnerExcludingBarbarians == 0 w main.ts; asercja + mutacja czerwona).
5 kolejnosc join/fallback: join-first i wylaczenie pary Kamienia dla Brazu/Zelaza wprowadzone. exhausted(cand.ownerId, actor.era): era napastnika = era wypowiadanej wojny, spojne z l.529 (join uzywa pair.era); odrzucenie uzasadnione. Brak osobnego testu zachowania dolaczania — nota.
6 brak testu silnikowego Kamien->pending->pokoj->start: PRAWDA, nadal brak (czysta logika + regex zrodlowy). Nota.
7 gracz jako cel: fallback celuje tylko w AI, zgodnie z ui-params.json l.185; sciezka playerFirst bez zmian. Wyjasnione wystarczajaco.

BLOKADY: brak blokad na werdykt. Niezamkniete: (a) brak dowodu z biegu 120 tur seed 4242 (tabela prob/wypowiedzen NIE ZMIERZONO); (b) brak testu silnikowego scenariusza odroczenia; (c) 9 czerwonych asercji w trzech testach (identyczne jak baza).
RUNDY: 3/5 (FC: PASS-WITH-NOTES).
NASTEPNY KROK: integracja orkiestratora (merge-base sprawdzony); potem osobne tematy: (1) narzedzie pomiarowe z logami wojen epoki + bieg dymny przed deployem, (2) naprawa progow 20/25 vs JSON 40 w testach.
UWAGI-DLA-ORKIESTRATORA: skutecznosc w silniku NIE ZMIERZONO — nie oznaczac jako zweryfikowane w grze po deployu. Bramki dispatchu (48/0, 55/0, 48/0, 41/0) sa nieaktualne wzgledem bazy.
DEPLOY/PUSH: NIE WYKONANO
