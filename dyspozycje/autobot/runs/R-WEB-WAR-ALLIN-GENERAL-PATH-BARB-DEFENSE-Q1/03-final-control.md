STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-WAR-ALLIN-GENERAL-PATH-BARB-DEFENSE-Q1
GOAL: Sciezka kampanii wodza (attacking) nie przejmuje obroncow domu przed barbarzyncami.
ZMIANY/COMMIT: weryfikowany f1ca757ef (baza ee269b6ed); diff do allowlisty: tylko gra/src/game/ai.ts, gra/tools/war-allin-general-path-barb-defense-test.cjs, runs/<ID>/**. Brak gra-robocza, WERSJE.md, rust-port, src-tauri, battle. git diff --check czysto.
TESTY (powtorzone samodzielnie na f1ca757ef): nowy test 24/0 (na ai.ts z bazy: 14 passed, 10 failed = RED prawdziwy); keep-barb-defense 8/8; war-allin-capital 98/98; ai-home-defense-vs-barbarians 46/46; ai-war-defend-home 30/30; ai-general-war-campaign 51/51; army-concentration 56/56; ai-army-scattered-merge 33/33; ai-move-full-range 20/20; tsc EXIT=0; war-allin-capital-quick 8 hashy identyczne baza vs f1ca757ef. Mutacje M1-M3 nie powtarzane (z logow Operatora).
ZARZUTY: 1 cywile/okrety/wodz jako obronca -> ODDAL (naprawione w R2, filtr + T8). 2 stos obronca+1 zolnierz -> ODDAL (T9 zielony takze na bazie R1, brak utraty rozkazu). 3 determinizm/czas kampanii -> ODDAL (hashe identyczne; roznica czasu w szumie; pelny czas gry NIE_ZMIERZONO). 4 duplikacja 4b/4b2 -> ODDAL (dlug swiadomy, refaktor poza zakresem). 5 logi gate bez wynikow -> ODDAL (zgodne z dispatchem). 6 Chromium -> ODDAL (temat AI, poza zakresem).
UWAGA POZA ZAKRESEM: glowna sciezka decideAITurn tez wola assignHomeDefenders na pelnym myUnits bez filtra cywilow -- osobny temat.
BLOKADY: brak. RUNDY: 2/5.
NASTEPNY KROK: integracja orkiestratora f1ca757ef (+ commit tego raportu) na origin/main (ee269b6ed); niezalezna od origin/rust-port/parity-v2 (inne drzewo: gra/ vs Rust) -- kolejnosc dowolna, najpierw main.
DEPLOY/PUSH: NIE WYKONANO
