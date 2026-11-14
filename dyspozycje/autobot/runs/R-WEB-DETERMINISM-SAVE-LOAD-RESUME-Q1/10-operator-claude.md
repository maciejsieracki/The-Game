# R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 (zadanie #373)
GOAL: wznowiona gra z zapisu ma dawać ten sam przebieg co gra nieprzerwana (ten sam ziarno).

## Wejście (zgodność z dispatchem)
- Dispatch: `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, plik `dyspozycje/autobot/runs/R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1/00-dispatch.md` (commit f734ed0e6). Plik istnieje TYLKO na tej gałęzi, NIE na `origin/main`.
- DODATEK orkiestratora `00-dispatch-DODATEK-claude.md` NIE istnieje ani na `origin/main`, ani na gałęzi claude. Zakres wziąłem z samego `00-dispatch.md` (ALLOWLISTA, KRYTERIA, ZAKAZ).
- Baza: `85f7961b1` (origin/main), worktree odłączony (detached) od tego SHA.

## Diagnoza (ZMIERZONE CZYTANIEM KODU, NIE URUCHOMIENIEM)
Liczniki w domknięciu `boot()` w `gra/src/main.ts`, których NIE było w zapisie i NIE były przywracane przy wczytaniu:
- `_detIdSeq` (ok. l.2011): licznik sufiksów ID (`detIdSuffix`, 8 miejsc: prod_, rec_, barb_, wioska_ itd.).
- `_autoBattleSeqTurn` / `_autoBattleSeq` (ok. l.2017–2019): licznik walk w turze w soli strumienia `autoBattleRng`.
  Sól zawiera id atakującego (`String(atkId)`), a `gameStreamRng` mieszający hashStr(salt) — więc inne ID dają inne rzuty.
Wznowiona gra (świeża strona + load) startuje te liczniki od zera, zatem ID i sole walk różnią się od gry nieprzerwanej.
To jest HIPOTEZA ZGODNA Z KODEM, nie zmierzony przebieg. Pomiar przeglądarkowy nie był wykonany (patrz NIE_ZMIERZONO).

## Zmiana (commit na gałęzi wf_32c25af3 / detached HEAD, SHA w polu sha odpowiedzi)
- `gra/src/main.ts` `buildSaveGameSnapshot`: w `meta` dodane `detIdSeq`, `autoBattleSeqTurn`, `autoBattleSeq`.
- `gra/src/main.ts` `restoreGameFromSave` (po `turn = saved.tura;`): przywrócenie; brak pola = 0 / 0 / -1 (stary zapis = dotychczasowe zachowanie). `meta` przechodzi przez `deserializeGame` bez zmian (save.ts l.742, `meta: obj.meta`), więc nie trzeba zmieniać save.ts.
- Nowy test `gra/tools/determinism-save-load-resume-test.cjs` (źródłowy: zapis pól, odczyt z domyślnymi, kolejność po `turn = saved.tura`, passthrough meta). Wynik: 8 PASS, exit 0.
- Mutacja (kopia w scratchpad, pole zapisu przemianowane na `detIdSeqX`): test czerwieni A1, `WYNIK: FAIL (1)`.

## Bramki (liczby z surowego wyjścia)
- `tsc --noEmit` (gra/): exit 0, brak błędów.
- `node tools/determinism-same-seed-test.cjs`: exit 0, 13 linii PASS, 0 FAIL (bez regresji względem bazy).
- `node tools/determinism-save-load-resume-test.cjs`: exit 0, WYNIK: PASS.
- `npm ci --ignore-scripts` w gra/ (tylko zależności, bez `npm run build/dev`): 71 pakietów, exit 0.

## TESTY — co NIE zostało wykonane
- NIE_ZMIERZONO: tabela digestów tura po turze (nieprzerwana vs wznowiona, przed i po naprawie) w przeglądarce (?civTest=1, Chromium). Brak harnessu save+load+K tur; wykonanie wymagałoby osobnego skryptu Playwright. Kryteria (a) i (b) z dispatchu NIE są spełnione dowodem — do domknięcia w rundzie 2 lub w FC.
- NIE_ZMIERZONO: „stary zapis wczytuje się bez błędu” jako test przeglądarkowy (kryterium c) — pokryte tylko logiką domyślnych wartości w kodzie.
- NIE_ZMIERZONO: mutacja w przeglądarce (kryterium d) — pokryta mutacją źródłową testu.
- NIE_ZMIERZONO: pozostałe testy zapisu (save-*, pr141-runtime-save-load-harness i inne testy live) — nie uruchamiane.
- NIE_ZMIERZONO: DRUGA CZĘŚĆ dispatchu (ścieżka walki taktycznej i `resolveCombat` bez rng w battleScene.ts / manualBattle.ts / combat.ts / siege.ts) — nie badana w tej rundzie.

## BLOKADY
- Brak DODATKU orkiestratora (plik nieobecny na obu gałęziach); zakres wzięto z 00-dispatch.md.
- Brak pomiaru przeglądarkowego (patrz wyżej): zmiana jest poprawna tylko na poziomie kodu i testu źródłowego, nie dowiedziona na przebiegu gry.

## RUNDY
1/5 (ostatni werdykt: brak; to pierwsza runda Operatora).

## UWAGI-DLA-ORKIESTRATORA
- Poza zakresem: `Math.random` pozostałe w `gra/src/game/**` są wyliczone w `determinism-same-seed-test.cjs` (WYJATKI). Nie sprawdzałem, czy któryś z nich jest na ścieżce wznowionego przebiegu.
- Zgłoszenie do rozważenia: `_detIdSeq` nie jest resetowany przy nowej grze w tej samej sesji przeglądarki (tylko przy przeładowaniu strony). Test z dwóch kolejnych „Nowa gra” w jednej sesji może dawać różne ID mimo tego samego ziarna.

## NASTĘPNY KROK
Runda 2 (lub FC): harness przeglądarkowy — gra do tury N → zapis → (a) K tur nieprzerwanie, (b) load + K tur; tabela digestów (hook `window.__civTest` `digest` w main.ts), dla ≥2 ziaren, ≥10 tur; test mutacji w przeglądarce; druga część dispatchu (walka taktyczna).

DEPLOY/PUSH: NIE WYKONANO
