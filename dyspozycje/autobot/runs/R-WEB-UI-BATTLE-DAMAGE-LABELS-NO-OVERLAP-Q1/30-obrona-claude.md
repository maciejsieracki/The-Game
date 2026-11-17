STATUS: PASS-WITH-NOTES (obrona Operatora, runda 2; zarzuty 1–3 przyjęte z poprawką, zarzut 4 odrzucony)
DOMAIN: GAME (UI bitwy, pozycjonowanie etykiet obrażeń)
TEMAT: R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1
GOAL: etykiety obrażeń nad jedną jednostką nie nakładają się i są czytelne; kolory i treść liczb bez zmian.
BAZA: origin/main cc7ba08669f163cb5867ad1b6180c92a17d7402c. Kandydat Evaluatora 42689353e (potomek bazy, sprawdzone `git merge-base --is-ancestor`). Poprawka obrony na tej bazie w commicie z sekcją ZMIANY-COMMIT.

ZMIANY-COMMIT:
- gra/src/battle/damageLabelStack.ts: krok etykiet w PIKSELACH EKRANU (DMG_LABEL_STACK_STEP_PX = 20), przeliczany na jednostki świata skalą kamery (damageLabelStackStepWorld); damageLabelStackY(baseY, activeYs, stepWorld) = max(baseY, aktualne Y aktywnych etykiet + krok). Usunięte damageLabelStackOffset (liczenie po liczbie aktywnych etykiet).
- gra/src/battle/battleScene.ts (_spawnDamageLabel, ~10580–10605): aktywne etykiety tej jednostki liczone po AKTUALNEJ wysokości (worldPos.y + age*riseRate, age<duration), krok z worldToScreen (2 punkty, 1 jedn. świata). Kolor, treść, duration 2000, riseRate 0.00012 bez zmian. Allowlista: battleScene.ts (pozycjonowanie etykiet) + nowy helper + test; bez zmian reguł walki/obrażeń/kolorów, bez WERSJE.md, bez gra-robocza.
- gra/tools/battle-damage-label-stack-test.cjs: test A (czysta funkcja), S (symulacja osi czasu: odstępy w px), B (wiring w battleScene.ts), C (kolor/treść/czas życia bez zmian).
- dyspozycje/autobot/runs/R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1/30-obrona-claude.md (ten raport).
Commit: patrz pole sha w odpowiedzi strukturalnej (SHA commita obrony zawiera wszystkie 5 plików powyżej).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
Zarzut 1 (kryterium b: brak pomiaru w żywym Chromium; "krok 0,30 nie potwierdzony wizualnie"): PRZYJMUJĘ.
  - Pomiar wykonany (xvfb, Chromium headless, build z haczykami testowymi poza repo: tmpC/tmpD w scratchpadzie). Boot mapy ok. 25–80 s; limit BATTLE_DMG_MAP_BOOT_MS=200000. Pierwsze uruchomienie Chromium tuż po buildzie padało ("Target page ... closed") — drugie uruchomienie na tym samym buildzie przechodzi.
  - Sonda: ta sama jednostka gracza (atk20, HP 56→18), trzy etykiety: pierwszy cios produkcyjnym _doAttack, kolejne dwa przez produkcyjne _spawnDamageLabel (kolejne cios tego samego atakującego nie zadawały obrażeń, HP bez zmian; to ograniczenie sondy, nie produktu).
  - WYNIK DOWODOWY poprawki Evaluatora: krok 0,30 jedn. świata przy skali 7,4–8,2 px/jedn. = 2,2 px ekranu, przy czcionce 15 px. Poprzedni kandydat NIE spełniał celu (modelY 428,2 / 426,0 / 423,7 → odstępy 2,2 px). To potwierdza zarzut 1 w części dotyczącej skuteczności kroku — dlatego krok zmieniono na px (20 px).
  - PO POPRAWCE (ta sama sonda, ta sama skala): modelY 427,0 / 405,7 / 383,6 → odstępy 21,3 i 22,1 px; domY 418,5 / 397,2 / 375,1 (zgodnie z modelem). Zrzut: scratchpad/shots-fix/.
  - PRZED (kod origin/main cc7ba0866, ten sam build-harness): wszystkie etykiety na worldY 0,92 (brak stosowania przesunięcia), nakładają się w jednym miejscu (domY 422–439 zależnie od fazy ticka, zrzut scratchpad/shots-before/).
  - Ograniczenie: harness ustawia duration etykiet na 60000 ms (haczyk testowy z oryginalnego harnessu), więc w sondzie etykiety nie wygasają; wygasanie pokryte testem S.
Zarzut 2 (dowód mutacyjny słaby; wiring tylko regexem): PRZYJMUJĘ częściowo.
  - Dodano symulację osi czasu (S) liczącą odstępy w pikselach, i mutanty: (a) licznik-aktywnych zamiast wysokości (wersja Evaluatora) → 8 FAIL, w tym D (t=2100) −0,132 — zgodnie z zarzutem 3; (b) krok zerowy → 6 FAIL; (c) --scene: battleScene bez damageLabelStackY → 1 FAIL (B). Surowe wyjście: scratchpad/mut/.
  - B (regex po źródle battleScene) pozostaje jako test wiringu; zachowanie na żywo pokryte sondą (pkt 1). Tego nie uważam za pełny dowód zachowania — to jest powód sondy.
Zarzut 3 (offset liczony z liczby aktywnych, nie z wysokości; po wygaśnięciu A następna nakłada się): PRZYJMUJĘ — poprawka wprowadzona.
  - Nowe pozycje: max(baza, aktualne Y aktywnych + krok). Scenariusz Evaluatora (A 0, B 0,5, C 1,0, D 2,1): D jest ≥ krok nad C (test S: "D lezy >= krok nad C"; mutant licznika daje −0,132).
Zarzut 4 (etykieta tuż przed wygaśnięciem liczy się jako aktywna; kosmetyczne): ODRZUCAM.
  - Dowód: _tickFloatLabels (battleScene.ts ~9967) ustawia opacity = 1 − p², więc etykieta w ostatnim ~10% czasu życia jest już prawie przezroczysta, ale nadal zajmuje miejsce na ekranie. Wykluczenie jej z listy przed wygaśnięciem spowodowałoby, że nowa etykieta nachodzi na widoczną. Zachowanie konserwatywne (brak nakładania) jest zgodne z GOAL; to nie jest nakładanie, tylko odstęp o jedną etykietę dłuższy niż minimum. Wykluczamy tylko etykiety z age ≥ duration (zgodnie z tickiem).

TESTY (surowe wyniki z tej rundy):
- node tools/logic-test.cjs → LOGIC OK (213/213), EXIT 0
- node tools/tech-tree-test.cjs → tech-tree-test: 20 pass, 0 fail, EXIT 0
- node tools/research-test.cjs → ALL GREEN, EXIT 0
- node tools/unit-replace-test.cjs → WSZYSTKIE TESTY ZIELONE (21/21), EXIT 0
- node tools/combat-test.cjs → All sanity checks passed., EXIT 0
- node tools/battle-damage-colors-test.cjs → WYNIK: 28 PASS / 0 FAIL, EXIT 0
- node tools/battle-damage-label-stack-test.cjs → WYNIK: 23 PASS, 0 FAIL, EXIT 0
- npx tsc --noEmit (gra/) → EXIT 0
- Mutanty testu (--src / --scene): count-based 8 FAIL; krok zerowy 6 FAIL; scene bez stackY 1 FAIL — wszystkie EXIT 1.
- Żywy Chromium, istniejący harness battle-damage-colors-live-test.cjs (nietknięty, build z haczykami): WYNIK 7 PASS / 0 FAIL (4 kroki kolor wg strony, log: 7 etykiet, 0 złych kolorów, brak błędów strony). Zrzuty: scratchpad/shots-orig/.
- Żywa sonda (3 etykiety, 1 cel): PASS 4/0 (scratchpad/run-fix2.log, shots-fix/).
- Nie zmierzono: widok na żywo przy innym zoomie niż domyślny (krok w px dostosowuje się do skali, ale nie sprawdzono wizualnie); manualBattle.ts (osobna kopia FloatLabel, HPBAR_Y 1.05) nie objęte zmianą.

BLOKADY: brak. Zakres: tylko battleScene.ts (pozycja etykiet), helper, test. node_modules w gra/ zainstalowany (npm ci --ignore-scripts), ignorowany przez git.

RUNDY: 2/5 (runda 1: operator; runda 2: ta obrona)
NASTĘPNY KROK: Evaluator (runda 3) na commicie obrony; kryterium (b) spełnione sondą na żywo (odstępy 21–22 px), kryterium (a) i (c) zielone.
UWAGI-DLA-ORKIESTRATORA:
- Krok w px jest przeliczany z kamery przy każdym spawnie (worldToScreen 2×). Nie zmienia to innych etykiet (ich wysokość w jednostkach świata pozostaje).
- Dla manualBattle.ts (osobny FloatLabel, HPBAR_Y 1.05) ten sam problem może wystąpić; nie ruszane (poza zakresem, zgodnie z dispatchem).
- Sonda na żywo jest w scratchpadzie (probe-harness.cjs, poza repo); nie dodawana do gra/tools, żeby nie poszerzać allowlisty.
DEPLOY/PUSH: NIE WYKONANO
