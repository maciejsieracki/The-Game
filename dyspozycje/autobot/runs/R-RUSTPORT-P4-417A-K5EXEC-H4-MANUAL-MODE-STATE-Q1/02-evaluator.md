STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb reczny gracza w ciele bitwy (czesc A), runda 2: wektory KROKU ciala z wykonania tekstu pinu 07d2fbd72 dla hold / none / move / attack / attackMove
ZMIANY/COMMIT: oceniany kod = f6cde9a26 (Operator r2; baza 707654e47 jest przodkiem). Evaluator zmienia wylacznie ten raport (poprzedni raport r1 zachowany jako 02-evaluator-r1.md). Pliki Operatora w allowliscie: siege_tactics_loop.rs (+49/-7), p6_k5loop_wiring_a_gen.mjs (+306/-0), manual_body_step_vectors.json (nowy), p4_417a_manual_body_vectors.rs (nowy, dozwolony przez dispatch r2 pkt 2), raporty. Pliki spoza allowlisty: brak. gra/ i istniejace pliki wektorow nietkniete, git diff --check czysty, brak #[ignore] w diffie.
TESTY (odtworzone samodzielnie):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- pelny cargo test --all-targets --no-fail-fast: EXIT 0; 4432 passed, 0 failed, 1 ignored (ignorowany istnial przed r2). Oba nowe testy zielone: glowny 1410 przypadkow, marsz atomowy 284 przypadki, 0 rozbieznosci.
- regeneracja wektorow: WIRING_A_MANUAL_BODY_STEPS=1 node p6_k5loop_wiring_a_gen.mjs, MD5 59e325fda1f0b3e5bbf20185e613f4ea = plik w repo (generator deterministyczny, 1410 przypadkow, dropped 0/0).
- straznik SHA-256 pinu 3eeeb760bc0efdbb8108ac3dcf36efe5a202a8f1bec5583ede354abc0d4da34d bez zmian (diff generatora: same dopiski, 0 usuniec); SHA-256 generatora 19f76e74e3589a1088a3ebec950800ecfdba6564fc13e00815048ab4f6a82303 zgodne z raportem Operatora.
- generator wykonuje tekst pinu (_activateUnit -> _performPlayerOrder); stuby _doMove/_doAttack tylko nagrywaja decyzje i przestawiaja jednostke, odmowa muru woła _siegeMoveRefused z pinu; predykaty w Rust liczone portami, nie kopiowane z pinu.
- bramki renderera: nie dotyczy (temat engine).
MUTANTY (16 NOWYCH, innych niz M1-M22, M4/M8/M11-M16 i N1-N17 Operatora; na plikach produkcyjnych player_order_move.rs, player_order_attack.rs, siege_tactics_loop.rs; uruchamiane przeciw p4_417a_manual_body_vectors; pliki przywrocone, git status czysty):
ZABITE (13): E1 ReachedTarget tylko po kolumnie (18 rozb.), E2 usuniety adjacent_enemy w move (107), E3 order_done tylko po kolumnie (34), E4 backtrack move bez flagi avoid (9), E7 attackMove: roster zagrozen bez filtra removed (2), E8 attackMove: pos==target tylko po kolumnie (5), E9 attack: allow bez flagi avoid (8), E10 attack: prev zawsze Some (81), E11 attackMove: prev zawsze Some (61), E12 sortowanie zagrozen odwrocone (67), E13 hold zdejmuje rozkaz (60), E15 roster attack: removed zawsze false (2), E16 enemy_pos z zamienionym q/r (302).
PRZEZYLY, JAWNIE ROWNOWAZNE (3): E5 (usuniecie `dr != 0 &&` w galezi SideRow move: przy dr==0 pole (q,r) zajmuje sam aktor w occByKey, wiec free() jest false); E6 (usuniecie `!u.fading_out` w attack_order_step: find idzie po enemies_of, ktore juz filtruje dead/fadingOut/routed); E14 (usuniecie ensure_group_meta_of dla none+AUTO w decide_manual: galaz doktryny :6388 dopisuje ten sam wpis grupy przed koncem aktywacji, ten sam stan koncowy).
Kryterium >= 8 nowych mutantow: SPELNIONE (13 zabitych + 3 rownowazne z uzasadnieniem).
ZARZUTY (nieblokujace; do obrony / r3):
1. Podprzyczyna "cel = pozycja takze dla attack" (dispatch glowny kryt. 4, dispatch r2 pkt 2) ma 0 przypadkow w wektorach (licznik attack/cel-pozycja = 0; tag liczony w tags_of, ale test go nie asertuje). Operator uznaje wariant za geometrycznie niemozliwy, co nie jest prawda dla celu `removed` (attack go nie filtruje, :18397) stojacego na polu aktora; layout generatora uzywa zbioru `used`, wiec go nie konstruuje. Brak dowodu pin == Rust dla tego wariantu. Zalecane: dodac wariant (removed wrog na polu aktora) albo jawnie zapisac NIE_ZMIERZONO.
2. Test porownuje tylko stan aktora (rodzaj, krok, cel, rozkaz po, lastAutoMoveFrom, wpisy grup, pozycja); stan pozostalych jednostek i occByKey po aktywacji nie sa porownywane.
3. none z doktryna AUTO tylko dla piechoty wrecz; kolejne kroki marszu doktryny po pierwszym nie sa porownywane (zadeklarowane przez Operatora).
4. Wariant z murem sceny: dla atakujacego tylko rozkaz move (bramka :18436); oblezenie reczne = r3; blokada generala nieaktywna (czesc B). Zgodne z zakresem r2.
5. Progi pokrycia routed/removed/fadingOut niskie (>= 5), faktycznie 25/15/17; marsz atomowy tylko na podzbiorze 284 przypadkow bez none.
BLOKADY: brak
RUNDY: Evaluator r2 (runda 2/5)
NASTEPNY KROK: Obrona (zarzut 1), Final Control; po PASS r2 -> r3 tego samego ID (oblezenie reczne + kolejka execute_units_immediate, fx _siegeSafeApproach z portow)
DEPLOY/PUSH: NIE WYKONANO
