STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-3-Q1
GOAL: Przeniesc do Rust delte weba dc8a3adc..4bbef081d (generalowie, bitwa); tryb bitwy i marsze generala w zapisie, generalQuickFollow <-> planned-march; wektory z pinu 4bbef081d.
ZMIANY/COMMIT: poprawka `gen-repin-wojna-3-hook-vectors.mjs` + runbook w `P6-REPIN-WOJNA-3.md` + ten plik. Kod Rust bez zmian wzgledem 51b791180.
TESTY: patrz nizej.
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

ZARZUT 1 (generator nie odtwarza sie z czystego `git archive`): PRZYJMUJE.
Poprawka: generator sam kopiuje `generals.ts` i `generalQuickFollow.ts` do <WORK_DIR>, podmieniajac jedyny import (`'./generals'` -> `'./generals.ts'`) z asercja "dokladnie 1 wystapienie"; pin w <PIN_ROOT> pozostaje nietkniety. Runbook odtworzenia dopisany do `P6-REPIN-WOJNA-3.md` §4.
Dowod: `git archive 4bbef081d gra/src/game gra/src/main.ts` do katalogu poza repo (bez zadnego sed) -> generator -> 700 przypadkow, `cmp` z `tests/p6_repin_wojna_3_vectors/hook.json` = IDENTICAL.

ZARZUT 2 (nie odtworzono pelnego cargo test ani 16 mutantow; logi przyjete): ODRZUCAM jako zarzut do poprawki (nota informacyjna, nie defekt). Kod Rust i testy sa bez zmian od 51b791180 (ta runda dotyka tylko generatora i dokumentow), wiec logi bramek pozostaja wazne.
Dowod z logow (przeliczone w tej rundzie): gate-test.txt 260 binarek, 1981 passed, 0 failed, 1 linia `EXIT=`; gate-fmt i gate-clippy po 1 linii `EXIT=`; mut-W3-M1..M16: kazdy log ma >=1 FAILED i `EXIT=101` (16/16 zabite).
