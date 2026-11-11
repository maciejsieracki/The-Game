STATUS: PASS-WITH-NOTES (obrona r2 przyjmuje zarzuty 1, 2 i 4 z poprawką i dowodem; zarzut 3 przyjęty jako NIE_ZMIERZONO do dociągnięcia w Final Control; werdykt końcowy należy do Evaluatora/FC)
DOMAIN: GAME
TEMAT: R-WEB-UI-RAW-IDS-AUDIT-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora r2 (raport 20-evaluator-claude.md, commit 749692424) dla kandydata 35644433c: domknąć strażnika wiązań UI, zmierzyć wynik merge z aktualnym origin/main 07d2fbd72 i powtórzyć bramki na wyniku merge.
BAZA: 35644433c (kandydat Evaluatora r2) → commit guardów 1438861545 → merge origin/main 07d2fbd72.
ZMIANY/COMMIT:
- 1438861545 (tylko gra/tools/ids-leak-audit-test.cjs): sekcja 4 dostaje 7 kontroli wiązań UI przez źródło:
  - ui/wikiHubHud.ts: `stripEncyMetadata(entry.full)` obecne oraz brak `${entry.full}`;
  - ui/techDiscoveryNotice.ts: `nazwyZListyId(tech['Odblokowuje surowiec.'])`;
  - ui/cityPanel.ts: `nazwyZListyId(String(t['Dostęp do surowca.']))` i `nazwyZListyId(odblokowujeSurowiec)`;
  - ui/sciencePicker.ts: `label: nazwyZListyId(sur)` i `nazwyZListyId(node.odblokujeSurowiec)`.
- a2f27ab66 (merge --no-ff origin/main 07d2fbd72, bez konfliktów; `git merge-tree` czysty przed merge). Pliki z main wchodzą bez zmian po mojej stronie (ai.ts, main.ts, save.ts, empireRecruitPanel.ts, gra-robocza/* z main). Allowlista własna tej rundy: wyłącznie gra/tools/ids-leak-audit-test.cjs (+ merge).
- wikiBundle.json: `node tools/bundle-wiki-for-game.cjs` na wyniku merge → `git status` bez zmian (zmierzone; bundle zgodny z docs/).
- Ten raport: osobny commit, `git add` ścieżką (bez -A).
- Nie zmieniano: tech.json, docs/, WERSJE.md, gra-robocza/ (przez tę rundę), liczb, efektów, terminów Danina/Podatek/Handel.

ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (wikiHubHud bez stripEncyMetadata nie czerwieni testów): PRZYJMUJĘ. Poprawka: kontrola wiązania w ids-leak-audit sekcja 4 (commit 1438861545).
  Dowód mutacyjny (surowe wyjście, kod przywrócony `git checkout --` po każdej mutacji):
  - M1 `stripEncyMetadata(entry.full)` → `entry.full`: „FAIL wikiHubHud: widok „pełny" po stripEncyMetadata(entry.full)”, „FAIL wikiHubHud: brak surowego ${entry.full} w widoku pełnym”, „WYNIK: 1639 ok, 2 FAIL”.
- Zarzut 2 (opakowania nazwyZListyId bez dowodu mutacyjnego): PRZYJMUJĘ. Poprawka: kontrole wiązań dla techDiscoveryNotice, cityPanel (2 miejsca), sciencePicker (2 miejsca). Każda mutacja czerwieni test:
  - M2 techDiscoveryNotice bez wrappera: „FAIL techDiscoveryNotice: resourceUnlocked przez nazwyZListyId”, „WYNIK: 1640 ok, 1 FAIL”.
  - M3 cityPanel bez wrappera: „FAIL cityPanel: „Surowiec (tech)” przez nazwyZListyId”, „FAIL cityPanel: „Odblokowuje surowiec” przez nazwyZListyId”, „WYNIK: 1639 ok, 2 FAIL”.
  - M4 sciencePicker bez wrappera: „FAIL sciencePicker: etykieta surowca przez nazwyZListyId”, „FAIL sciencePicker: lista odblokowanych surowców przez nazwyZListyId”, „WYNIK: 1639 ok, 2 FAIL”.
  - Po przywróceniu: `git status` czysty poza commitem guardów.
  - Uwaga: to strażnik źródłowy (wiązanie wywołania), nie test renderu; nie dowodzi, że tekst na ekranie jest poprawny. Ten dowód daje wyłącznie Chromium (zarzut 3).
- Zarzut 3 (brak zrzutu Chromium kart ulepszenia/odkrycia i panelu odkryć): PRZYJMUJĘ JAKO LUKĘ — NIE_ZMIERZONO w tej rundzie. Nie wykonałem zrzutów kart ulepszenia, karty odkrycia ani panelu odkryć; nie uruchamiałem Chromium w tej rundzie (czas i brak gotowego skryptu dla tych kart). Ustalenie do Final Control: dociągnąć zrzuty albo zaakceptować lukę pisemnie. Wcześniejsze potwierdzenie (nagłówek miasta z Administratorem) pochodzi z raportu Evaluatora, nie z mojego pomiaru.
- Zarzut 4 (kandydat nie zawiera origin/main 07d2fbd72): PRZYJMUJĘ. Poprawka: merge a2f27ab66 (patrz wyżej). Dowody:
  - `git merge-tree --write-tree HEAD origin/main` przed merge: wynik bez listy konfliktów (tree 81b75fc8b182394529c7748871137cc4f6c7bd79).
  - `git merge --no-ff origin/main`: „Merge made by the 'ort' strategy.”, 27 plików, 1777 insertions / 585 deletions, bez „CONFLICT”.
  - `git status --short` po merge: pusty.
  - Regeneracja wikiBundle na wyniku merge: bez różnic (patrz wyżej).
  - Bramki na wyniku merge (powtórzone, surowe wyjścia):
    - `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
    - ids-leak-audit-test.cjs: „WYNIK: 1641 ok, 0 FAIL”.
    - wonder-text-no-raw-ids-test.cjs: „WYNIK: 132 ok, 0 FAIL”.
    - improvement-adapter-resource-note-test.cjs: „77 pass, 0 fail”.
    - city-administrator-test.cjs: „117 passed, 0 failed”.
    - city-administrator-economy-test.cjs: „72 passed, 0 failed”.
    - logic-test.cjs: „LOGIC OK (213/213)”.
    - tech-tree-test.cjs: „tech-tree-test: 20 pass, 0 fail”.
    - research-test.cjs: „ALL GREEN”.
    - unit-replace-test.cjs: „WSZYSTKIE TESTY ZIELONE (21/21)”.
    - combat-test.cjs: „All sanity checks passed.”.
  - NIE_ZMIERZONO na wyniku merge: szerszy przegląd 186 testów (zarzut 4 wspomina o nim tylko dla bazy). Nie powtarzałem go; zostaje dla Evaluatora/FC.
  - NIE_ZMIERZONO: zrzuty Chromium na nowym main (ai.ts/main.ts/empireRecruitPanel.ts weszły z main; nie uruchamiałem gry w przeglądarce).
- Uwaga procesowa (z raportu Evaluatora, nie zarzut): oryginalny `00-dispatch.md` nie istnieje na origin/main; przyjęto DODATEK jako obowiązujący (jak w r1/r2).

ZARZUTY PRZYJĘTE / ODRZUCONE: przyjęto 1, 2, 4 (z poprawką i dowodem); przyjęto 3 jako NIE_ZMIERZONO; odrzucono 0.

TESTY: patrz sekcja „Bramki na wyniku merge” w odpowiedzi na zarzut 4. Liczby z surowego wyjścia tej sesji.

BLOKADY: brak blokad technicznych. Otwarte do Final Control: zrzuty Chromium kart ulepszenia/odkrycia i panelu odkryć (zarzut 3); szerszy przegląd 186 testów na wyniku merge (NIE_ZMIERZONO).
RUNDY: obrona r2 (po zarzutach Evaluatora r2). Obrona r1 (commit 0dbdd2843) zachowana w historii gita.
NASTĘPNY KROK: Evaluator r3 na commicie tego raportu (odtworzyć: 1641/0 ids-leak, mutacje M1–M4, merge-tree i bramki na wyniku merge); następnie Final Control z dociągnięciem zrzutów Chromium (zarzut 3).
DEPLOY/PUSH: NIE WYKONANO
