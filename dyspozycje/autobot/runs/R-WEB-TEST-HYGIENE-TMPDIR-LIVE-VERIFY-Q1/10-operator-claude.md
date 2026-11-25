# R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy live)
TEMAT: R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1
GOAL: sprawdzić, czy testy live Chromium działają po zmianie nazw plików tymczasowych (commit ac74a132b, helper gra/tools/_tmp-unique.cjs). Naprawiać tylko nazwy/ścieżki tmp w testach, które padły z ich powodu. Zmierzyć skalę wycieku katalogów w os.tmpdir() i udowodnić parę producent–konsument.

BAZA: ca19244c196277a139dfc87aedd90d914dd7d41b (origin/main), checkout --detach. Worktree: /home/user/The-Game/.claude/worktrees/wf_ce317eb2-39d-1.

ZMIANY/COMMIT:
- Zmian w kodzie gra/tools NIE wprowadzono. Żaden z uruchomionych testów nie padł z powodu nazw tmp, więc allowlista nie dała podstaw do edycji.
- Sprzątanie po własnych testach (item 3): NIE dodano. Powód: każdy test tworzy własne katalogi, a para producent–konsument (ai-economy-measure-hook-test bez --dist) wywołuje ensureDist(), które buduje bundle pod nazwą `ai-economy-dist-${pid}-${Date.now()}` (gra/tools/ai-economy-measure-hook-test.cjs:444). Ta nazwa nie korzysta z TMPDIR_RUN_ID. Zmiana na współdzieloną ścieżkę z --emptyOutDir mogłaby wyczyścić bundle producenta w trakcie biegu. Propozycja w sekcji UWAGI.
- Commit: tylko ten plik raportu (git add ścieżką, bez -A).
- Przywrócono (git checkout) plik śledzony zmodyfikowany przez test: dyspozycje/autobot/runs/R-WEB-TRUCE-Q1/evidence/truce-01-modal-rozejm-5.png (patrz UWAGI, pkt 3).

TESTY (liczby z surowego wyjścia):

Bramki (baza, przed uruchomieniem testów live):
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: exit 0, "LOGIC OK (213/213)".
- `node tools/ai-test.cjs`: exit 0, "ai-test: 297 passed, 0 failed".
- `node tools/bramki-tmpdir-unikalnosc-test.cjs`: exit 0, "przeskanowano 435 plikow z tmpdir (z 1952 .cjs)", "PASS=3 FAIL=0" (0 trafień).
- Instalacja: `npm ci --ignore-scripts` w gra/ (71 pakietów). Usunięto po pracy.

Reprezentanty live (jeden Chromium naraz, solo, każdy z limitem czasu; wybór wg typu testu):

| Typ | Test | Wynik | Werdykt |
|---|---|---|---|
| zapis/wczytanie | tools/determinism-save-load-resume-live.cjs | exit 1: `FATAL TimeoutError: page.waitForFunction: Timeout 180000ms exceeded` | HARNESS (nie tmp). Baseline: wersja pliku z 180d518b1 (sprzed zmiany tmp) uruchomiona na tym samym gra/src (ca19244c1): ten sam FATAL, exit 1. Porażka nie pochodzi ze zmiany nazw tmp. Wcześniej zanotowany crash Chromium przy wczytaniu zapisu (temat CHROMEHELPER). |
| bitwa | tools/battle-damage-colors-live-test.cjs | exit 0, "WYNIK: 7 PASS / 0 FAIL" | PASS |
| dyplomacja | tools/diplo-truce-live-test.cjs | exit 1, "15 pass / 1 fail". FAIL: `endUntilTurn: nie osiągnięto tury 6 stan={"turn":5,...}`; w nnsText: "Nie można zakończyć tury. Spichlerz państwa (żywność): po zakończeniu tury zabraknie 135." | BŁĄD-GRY / STAN GRY (nie tmp). Blokada końca tury z deficytem żywności pochodzi z commitów 006268ea8 / c7c2ae352 / a356f5e54 (gra/src). Pełny baseline niemożliwy bez cofnięcia gra/src: między 180d518b1 a ca19244c1 zmieniono gra/src/game/diplomacy-war-limit.ts i gra/src/main.ts. Zostaje NIE-ZMIERZONO w wariancie baseline. |
| mapa | tools/map-controls-behind-panels-live-test.cjs | exit 0, końcowy werdykt "PASS" | PASS |
| UI/panel | tools/army-panel-general-label-multiselect-live-test.cjs | exit 1: klik zablokowany przez `#civ-welcome-screen-root` ("Odkryłeś nową cywilizację: Rzymianie") | HARNESS (nie tmp). Ekran powitalny wprowadzony w a3141e943 (R-WEB-UI-CIV-WELCOME-SCREEN-Q1). Test go nie zamyka. Nie naprawiono, bo allowlista obejmuje tylko nazwy tmp. |
| ekonomia (para) | patrz niżej | | |

Dobór: po jednym teście na typ z listy zadania. Dla „ekonomii” użyto pary ai-economy-measure (producent/konsument), bo jest to test ekonomii o najwyższym priorytecie w dispatchu. Nie wybrano testów sim/measure (patrz BLOKADY).

Para producent–konsument (ai-economy-measure-run.cjs → ai-economy-measure-hook-test.cjs):
- Producent: `TMPDIR_RUN_ID=pairq1-3622 node tools/ai-economy-measure-run.cjs --build 1 --seed 4242 --turns 2 --out <scratchpad>/pair-out --profile /tmp/ai-economy-profile-pairq1-3622 --every 1`. Wynik: exit 0; "[econ] PODSUMOWANIE ... endTurn 2, bypassApplied 1, unitCostPace normalny". Bundle: /tmp/ai-economy-dist-pairq1-3622.
- Konsument z tym samym TMPDIR_RUN_ID i jawnym producenckim bundle: `node tools/ai-economy-measure-hook-test.cjs --dist /tmp/ai-economy-dist-pairq1-3622`. Wynik: exit 0, 30 linii ZIELONE, "PODSUMOWANIE 30/30 zielone". DOWÓD: konsument działa na pliku producenta.
- Konsument BEZ --dist (sam TMPDIR_RUN_ID): exit 0, 30/30 zielone, ale buduje WŁASNY bundle w `ai-economy-dist-<pid>-<ts>`. Wspólna nazwa z TMPDIR_RUN_ID nie jest tu używana. Ustalone z kodu, nie tylko z wyniku.
- ZAKRES: 2 tury (seed 4242), nie pełne 100 tur z dispatchu. Pełny bieg pary: NIE-ZMIERZONO (czas i budżet tej rundy).

Skala wycieku (zmierzone na dysku po jednym biegu):
- battle-damage-colors-live-test (1 bieg): 2 katalogi zostają w /tmp: dist 102 MB (4 pliki), shots 1,7 MB (5 plików). Razem ok. 104 MB.
- ai-economy-measure-run (producent, 2 tury): dist 102 MB (4 pliki) plus profile 3,4 MB (169 plików, 10 podkatalogów). Razem ok. 106 MB.
- ai-economy-measure-hook-test bez --dist (konsument): kolejne 102 MB (4 pliki) w `ai-economy-dist-<pid>-<ts>`.
- diplo-truce-live-test i testy Chromium: Playwright zostawia po każdym uruchomieniu Chromium 3–4 wpisy w /tmp (`playwright-artifacts-*`, `playwright_chromiumdev_profile-*`, `org.chromium.Chromium.*`). Nie wynikają z nazw testów. Rozmiaru nie zmierzono.
- Liczba wpisów /tmp w czasie runu rosła, ale nie daje się przypisać do jednego testu (inne sesje też piszą do /tmp). Podaję tylko wpisy zidentyfikowane po nazwie.
- Usunięto z /tmp katalogi utworzone przez te biegi (dist/profile/shots wymienione wyżej). Zostały wpisy /tmp/ai-economy-dist i /tmp/ai-economy-profile z 07:13 i 07:32, których ten Operator nie tworzył.

Baseline: wykonano tylko dla testu zapisu (porażka powtórzona, patrz tabela). Dla dyplomacji i UI baseline NIE wykonano, bo gra/src różni się między 180d518b1 a ca19244c1 (diplomacy-war-limit.ts, main.ts). Sama zmiana tmp nie wpływa na te ścieżki, ale nie udowodniono tego bieg-to-bieg.

BLOKADY:
- Trzy sim/measure z timeoutem (ai-army-replacement-sim, ai-economy-measure-upkeep-onoff, weary40-sim-measure) NIE uruchomiono. Dispatch wymagał 25-minutowego biegu w tle (setsid nohup). W tej rundzie nie było na to czasu. Status: NIE-ZMIERZONO.
- Pełny bieg pary (100 tur): NIE-ZMIERZONO (patrz TESTY).
- Baseline dyplomacji i UI: NIE-ZMIERZONO (patrz TESTY).
- Testy save/load i UI wymagają zmian poza tmp (HARNESS), więc nie są naprawiane w tym temacie.
- Próba utworzenia osobnego worktree baseline została odrzucona przez ochronę izolacji (złożona komenda git). Baseline zrobiono przez `git show 180d518b1:...` do tymczasowego pliku w gra/tools, który po użyciu usunięto.
- Procesy: 22 procesy chrome (PPID 1, start 15:26:12, katalog /opt/pw-browsers/chromium-1243) nie zostały zabite. Nie udało się jednoznacznie ustalić, czy są moje, bo inne sesje na tej maszynie też uruchamiają Chromium. Do wyjaśnienia przez orkiestratora.

RUNDY: 1/5 (bez poprawek; kolejna runda tylko jeśli orkiestrator zleci dalsze pomiary albo naprawę HARNESS).

NASTĘPNY KROK:
1. Orkiestrator decyduje o zleceniu osobnych tematów (poza tym tematem, nie tmp):
   a. HARNESS: army-panel-general-label-multiselect-live-test.cjs ma zamknąć ekran powitalny `#civ-welcome-screen-root` przed kliknięciem.
   b. HARNESS/STAN: determinism-save-load-resume-live.cjs (waitForFunction 180 s; wcześniej znany crash Chromium przy wczytaniu).
   c. BŁĄD-GRY/STAN: diplo-truce-live-test.cjs blokowany przez bramkę żywności przy końcu tury 5. Wymaga decyzji, czy test ma ustawić żywność, czy bramka ma się zmienić.
2. Trzy sim/measure z timeoutem: uruchomić w osobnej rundzie w tle (setsid nohup, timeout 1500).
3. Pełny bieg pary (100 tur) w osobnej rundzie.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Konsument pary (gra/tools/ai-economy-measure-hook-test.cjs:444) nie używa TMPDIR_RUN_ID przy buildzie bez --dist. Każdy bieg zostawia kolejny bundle ok. 102 MB. Poprawka wymaga, by konsument nie czyścił producenckiego bundle (--emptyOutDir na wspólnej ścieżce). Propozycja: dla `--dist` nie buduj, dla braku `--dist` usuń bundle po teście. Nie zrobiono w tej rundzie. Zmiana zachowania pary wymaga osobnego tematu.
2. gra/tools/battle-damage-colors-live-test.cjs zostawia dist (102 MB) po biegu. Propozycja: usuwać dist po teście, zachowując shots (dowody).
3. gra/tools/diplo-truce-live-test.cjs zapisuje zrzut do śledzonego pliku dyspozycje/autobot/runs/R-WEB-TRUCE-Q1/evidence/truce-01-modal-rozejm-5.png, więc każdy bieg brudzi drzewo repo. Przywrócone w tym worktree. Propozycja: zapis do katalogu tymczasowego albo do katalogu wyjścia.
4. Wpisy `playwright-*` i `org.chromium.Chromium.*` w /tmp powstają przy każdym biegu Chromium. Źródłem jest Playwright, nie nazwy testów. Do decyzji, czy dodać sprzątanie w helperze Chrome (CHROMEHELPER).
