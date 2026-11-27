STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-REBEL-WORLD-NEWS-Q1 (tag AIREBELNEWS)
GOAL: bunt miasta AI (nowe gry) dodaje wpis do trwałej listy „Wydarzenia na świecie” w oknie dyplomacji, widoczny przy znanym właścicielu; tryb zgodności bez zmian.
ZMIANY/COMMIT: kandydat 8008761e4fdf86ddc2b027e232839c4927baccd4, baza e6f3fd4b6d98799a2d622546a1863af77541552a (origin/main). `git merge-base --is-ancestor baza kandydat` = OK. diff --stat: 4 pliki, +162/-2 (diplo-world-news.ts, main.ts +7, ai-city-rebellion-news-test.cjs, 10-operator-claude.md) - wszystko w allowliście; diploListHud.ts i layout nietknięte. Logika/progi buntu nietknięte; dziennik (warEventLog) zachowany, wpis listy dopisany obok.
TESTY (własny przebieg, surowe wyjście):
- tsc --noEmit: exit 0
- ai-city-rebellion-news-test: PASS 24/0; mutacja (usunięcie linii worldDiploNewsPush w main.ts) = 23/1 CZERWONE, po przywróceniu main.ts bez zmian (git status czysty)
- diplo-world-news-test: PASS 67/0
- logic: 213/213; tech-tree: 20/0; research: 33/0; unit-replace: 21/21; combat: 6/6
- ai-test: 297 passed, 0 failed; society-breakdown: 56 OK, 0 FAIL; ai-city-rebellion-gate: PASS=37 FAIL=0
- Przegląd kodu: filtr widoczności = worldDiploNewsVisible (a=b=właściciel) + wcześniejszy return przy braku kontaktu; id wpisu deterministyczne (dedup w worldDiploNewsPush); sanitize akceptuje 'rebelia' (stary zapis bez niej się wczytuje, nowy zachowuje rodzaj); zapis/odczyt listy istnieje (main.ts 42661/53037); render używa klasy dl-wn-<newsKind>, ikona z wpisu.
- Render w Chromium (zrzut okna dyplomacji) oraz bieg żywy na maksymalnych ustawieniach: NIE ZMIERZONO (nie wykonano ani przez Operatora, ani w FC).
BLOKADY: brak.
UWAGI (ODDAL, nie FAIL): (1) brak zrzutu/biegu żywego - kryterium binarne spełnione przez jawne NIE ZMIERZONO; (2) brak dyspozycyjnego dokumentu dyspozycje/analizy/AI-REBELIA-WPIS-SWIAT-2026-11-27.md (nie wymagany do zamknięcia); (3) brak stylu CSS per rodzaj 'rebelia' (zgodnie z zakazem zmian layoutu). Zarzuty Evaluatora: brak; obrona: brak.
UWAGI-DLA-ORKIESTRATORA: integracja main.ts - zmiana to 1 import + 7 linii, ryzyko konfliktu z AIPLUS10/LIVEGATE2 niskie; po deployu wskazany pomiar żywy NIE ZMIERZONO (zrzut okna dyplomacji po buncie AI na Trudny/Kultura trudny/Koszty Wysoki x4).
RUNDY: FC 1/5
NASTĘPNY KROK: integracja orkiestratora (merge FC, deploy ROBOCZA wg procedury).
DEPLOY/PUSH: NIE WYKONANO
