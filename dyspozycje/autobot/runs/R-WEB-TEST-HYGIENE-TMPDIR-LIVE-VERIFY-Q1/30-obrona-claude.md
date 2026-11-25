# R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy live)
TEMAT: R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1
GOAL: odpowiedzieć na trzy zarzuty Evaluatora (ff799e557) dowodem albo przyjąć zarzut; nie zmieniać kodu gra/ (zakaz: zmiana gra/src i gra/data, osłabianie asercji).
BAZA: 4211cfd6a (checkout --detach, zgodnie z dispatchem). Worktree: /home/user/The-Game/.claude/worktrees/wf_ce317eb2-39d-3.

ZMIANY/COMMIT:
- Zmian w kodzie gra/ NIE wprowadzono (zarzuty nie wymagały poprawki kodu; poprawki nazw tmp nie były potrzebne, bo żaden test nie padł z powodu nazw tmp).
- Jedyny commit tej rundy: ten plik raportu (git add ścieżką, bez -A).

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (brak pełnego biegu pary 100 tur; 3 sim/measure niezmierzone): PRZYJMUJĘ, NIE POPRAWIONO w tej rundzie.
- Dowód stanu: 10-operator-claude.md, sekcja BLOKADY, nadal podaje NIE-ZMIERZONO dla pełnej pary (100 tur) i dla ai-army-replacement-sim, ai-economy-measure-upkeep-onoff, weary40-sim-measure.
- Powód: w tej rundzie nie uruchomiłem 25-minutowych biegów (zakaz run_in_background; setsid nohup w pierwszym planie wymaga osobnej rundy). Nie podaję ich jako zmierzone.
- Zakres pary z rundy 1 (2 tury, 30/30 zielone, --dist producenta) pozostaje jedynym dowodem pary.

Zarzut 2 (brak baseline bieg-do-biegu dla diplo-truce i army-panel; grep tmpdir w save-load = 0): PRZYJMUJĘ część, ODRZUCAM klasyfikacje z dowodem.
- Dowód A (nazwy tmp nie są przyczyną dla żadnego z trzech testów):
  - `git show --stat ac74a132b` (commit zmiany nazw tmp, 99 plików) NIE zawiera gra/tools/diplo-truce-live-test.cjs, gra/tools/army-panel-general-label-multiselect-live-test.cjs ani gra/tools/determinism-save-load-resume-live.cjs.
  - `grep -ln _tmp-unique` na tych trzech plikach: brak trafień (rc=1).
  - `grep -c tmpdir gra/tools/determinism-save-load-resume-live.cjs`: 0.
  - Zmiana tmp nie dotknęła tych plików, więc ich porażka nie może pochodzić z nazw tmp.
- Dowód B (diplo-truce, BŁĄD-GRY/STAN GRY, nie HARNESS):
  - Komunikat „Nie można zakończyć tury” jest definicją gry: gra/src/ui/sidePanelEventFilter.ts:125 (END_TURN_BLOCK_EVENT_TITLE), wydarzenie-blokada z bramki żywności.
  - Commity wprowadzające bramkę 006268ea8, c7c2ae352, a356f5e54 są w historii ca19244c1 (`git merge-base --is-ancestor` potwierdzone dla 006268ea8).
  - Test oczekuje tury 6, gra blokuje koniec tury 5 z deficytem spichlerza. Klasyfikacja: BŁĄD-GRY/STAN GRY (do decyzji, czy test ma ustawić żywność, czy bramka ma się zmienić). Nie jest to naprawa w tym temacie (zakaz zmiany gra/src).
  - Baseline bieg-do-biegu dla tego testu: NIE-ZMIERZONO (gra/src zmieniono między 180d518b1 a ca19244c1; nie cofałem kodu gry).
- Dowód C (army-panel, HARNESS):
  - `grep civ-welcome-screen-root` w gra/tools/army-panel-general-label-multiselect-live-test.cjs: test NIE obsługuje ekranu powitalnego.
  - Ekran `civ-welcome-screen-root` (gra/src/ui/civWelcomeScreen.ts) wprowadzony commitem a3141e943, który jest w historii ca19244c1.
  - Klasyfikacja: HARNESS (test nie zamyka nowego ekranu). Baseline bieg-do-biegu: NIE-ZMIERZONO.
- Dowód D (save-load): jedyny wykonany baseline (z rundy 1, 180d518b1: ten sam FATAL TimeoutError, exit 1) zostaje. Plik nie używa tmpdir (grep = 0).

Zarzut 3 (inna ścieżka worktree w raporcie, 22 niezabite procesy chrome): PRZYJMUJĘ jako obserwację, wyjaśnienie z dowodem.
- `git worktree list` (ta sama przestrzeń): wf_ce317eb2-39d-1 istnieje, HEAD 4211cfd6a (ta sama baza co runda 1). wf_ce317eb2-39d-2 HEAD ff799e557 (raport Evaluatora). wf_ce317eb2-39d-3 (ta sesja Operatora obrony) HEAD 4211cfd6a, locked.
- Raport rundy 1 podaje -1 jako swój worktree. Ta sesja działa w -3. Nie mogę z tej sesji ustalić, czy runda 1 działała w -1 czy -3; -1 istnieje i jest na tym samym SHA, więc ścieżka w raporcie jest prawdziwym worktree, ale nie jest tym, w którym działa obrona.
- Procesy chrome: `ps -eo pid,ppid,lstart,args | grep -i chrom` daje obecnie 0 procesów. Nie mogę potwierdzić właściciela 22 procesów z 15:26 (raport rundy 1). Niczego nie zabijałem (zakaz pkill po nazwie).
- Sprzątanie worktree -1 i ewentualnych procesów: decyzja orkiestratora, nie tego tematu.

TESTY (liczby z surowego wyjścia rundy 1, nie uruchamiano ponownie w tej rundzie):
- tsc 0; logic 213/213; ai-test 297/0; bramki-tmpdir-unikalnosc-test PASS=3 FAIL=0 (z 10-operator-claude.md).
- W tej rundzie NIE uruchamiano ponownie testów live ani bramek: brak zmian kodu, dyspozycja obrony dotyczyła odpowiedzi na zarzuty i dowodów statycznych (git show/grep/ps).

BLOKADY:
- Pełny bieg pary 100 tur: NIE-ZMIERZONO.
- 3 sim/measure z timeoutem: NIE-ZMIERZONO.
- Baseline bieg-do-biegu dla diplo-truce i army-panel: NIE-ZMIERZONO (klasyfikacje oparte na dowodach statycznych A–C).
- Testy save/load, dyplomacja, UI: naprawa poza tmp (HARNESS / BŁĄD-GRY) wymaga osobnych tematów.

RUNDY: 2/5 (obrona). Bez poprawek kodu; zarzuty 1–3 rozstrzygnięte jak wyżej.

NASTĘPNY KROK:
1. Orkiestrator: decyzja o osobnych tematach (poza tym tematem): HARNESS army-panel (obsługa #civ-welcome-screen-root), STAN/BŁĄD-GRY diplo-truce (bramka żywności przy końcu tury 5: test czy gra), zapis/wczytanie (SIGSEGV Chrome przy load).
2. Osobna runda: pełny bieg pary 100 tur i 3 sim/measure (setsid nohup, timeout 1500, w pierwszym planie).
3. Decyzja o sprzątaniu wpisów tmp po konsumencie pary (UWAGI z rundy 1, pkt 1–4) i worktree wf_ce317eb2-39d-1.
4. Zarzut 3: ustalenie, w którym worktree działała runda 1, i właściciela 22 procesów chrome z 15:26 (obecnie 0 widocznych).

DEPLOY/PUSH: NIE WYKONANO
