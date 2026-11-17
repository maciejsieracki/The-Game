STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING
GOAL: wpiecie advance_step_decide -> do_move_effects (terrain/occ_by_key w ProdBody, mounted w ProdMoveWorld) + test p6_k5doc_t4e z mutacjami
ZMIANY/COMMIT: d8bfb1d3e (rodzic 760be5187) = tylko 03-operator-r3.md (+11), zero kodu. Baza dispatchu 760be5187 jest rodzicem d8bfb1d3e. Obrona 4cf1d0b2a: tylko raport.
TESTY: NIE_ZMIERZONO. df -h / = 5.3 GB wolne (FC, wymog >= 8 GB) -> bramek nie uruchamiano.
BLOKADY: BLOCK INFRA (dysk) potwierdzony niezaleznie.
RUNDY: r3 (FAIL, INFRA)

Zarzuty:
1. BLOCK INFRA dysk - ODDAL (przyczyna po stronie orkiestratora; kod nieoceniony).
2. Zero dostarczonego kodu - NAPRAW (temat niedostarczony).
3. Brak testu p6_k5doc_t4e i wektorow - NAPRAW.
4. Brak mutacji (a)-(d) - NAPRAW.
5. Patch wip-r2 a60791ba2 nieuzyty - ODDAL (punkt wyjscia dla r4).
6. HEAD worktree d44d5b982 != baza - ODDAL (r4: checkout --detach 760be5187).

Werdykt: FAIL (min. jeden NAPRAW). Raport operatora uczciwy, bez falszywego PASS.
NASTEPNY KROK: orkiestrator zwalnia dysk do >= 8 GB; DODATEK r4, baza 760be5187, ten sam ID.
DEPLOY/PUSH: NIE WYKONANO
