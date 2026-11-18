# KOLEJKA WEB — stan na 2026-11-18 (baza kandydata a86a847d7; origin/main fb5b2045a = FALA 835; ROBOCZA MD5 5bc75dc23e87cde560cb71ad892d70b6)

Czytana przez heartbeat :17 i :47. Źródła stanu (każda pozycja ma odsyłacz):
- `git log origin/main` (commity „ROBOCZA … FALA n” i „FALA n: merge FC …”) — dla FAL 747–835,
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — kończy się na FALI 746 (wiersz 10148), więc FALE 747–835 są potwierdzane z gita, nie z rejestru,
- listy zadań sesji orkiestratora NIE są źródłem tego pliku (nie są w repo); pozycje z nich wpisane tylko po potwierdzeniu w repo.
Zakres: WYŁĄCZNIE web. Rust tylko jako dług (sekcja DŁUG RUST/REPIN).

## PROCEDURA NOCNA (obowiązuje heartbeat i orkiestratora; kolejność ważna)

1. **Policz aktywne workflowy** (`subagents/workflows/*/`: `agent-*.jsonl` zmieniony <10 min ORAZ brak wyniku FC w `journal.jsonl`). Cel: 4. Brak aktywności >30 min przy braku procesów w worktree = ZWIS → `TaskStop` i wznowienie rundy (nie ślepe czekanie).
2. **Wynik FC (powiadomienie o zakończeniu workflowa):** `PASS`/`PASS-WITH-NOTES` → refs `refs/keep/<TAG>-{op,eval,obrona,fc}` → **wdrożenie** (niżej) → rejestr → push → sprzątanie worktree → dopiero potem start kolejnego. `FAIL`/`BLOCK` → ta sama ID, następna runda (max 5), DODATEK z konkretnymi NAPRAW z FC; **Sonnet na Operatorze tylko po DWÓCH nieudanych rundach Haiku TEGO SAMEGO tematu** (args `opModel:"claude-sonnet-5-5", haikuFailures:2, sonnetWhy:"…"`). Po rundzie 5: `LIMIT-5-EXCEEDED` → zapisz w rejestrze i zostaw do rana (ABC).
3. **START tematu:** dispatch (`00-dispatch.md` + identyczny `00-dispatch-DODATEK-claude.md`) wypchnięty na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, potem `scratchpad/mkwf.sh <ID> "<opis bez apostrofów i />"` i `Workflow` z `scriptPath`, args `{"id","tag","mode":"full","branch":"claude/sprawdzenie-funkcjonalnosci-ek4ra0","cand":"<SHA>","opModel":"claude-haiku-5-5","round":N}`. **`cand` = SHA `origin/main` (albo kandydat będący JEGO POTOMKIEM) — NIGDY HEAD gałęzi dispatchów** (skrypt każe Operatorowi `git checkout --detach ${cand}`; gałąź dispatchów NIE ma kodu main — incydent 2026-11-15: 3 tematy zmierzone na starym kodzie). Przy rundzie ≥2: `cand` = kandydat poprzedniej rundy (potomek main) i `git merge-base --is-ancestor <main> <cand>` PRZED startem.
4. **Nie startuj** przy dysku < 6 GB (`df -h /`; worktree Operatora ≈ 1 GB, sprzątaj zakończone: `git worktree unlock` + `git worktree remove --force --force`; `/tmp/*-live-dist`, `/tmp/civ-*` starsze niż 90 min — ale nie katalogi trwających testów). Nie uruchamiaj tematu z zależnością, jeśli warunek startu nie jest spełniony. Nie startuj tematów „dla zapełnienia” bez realnej pracy.
4a. **Sprzątanie w trakcie nocy (dysk spada o ok. 1 GB na worktree; 4 tematy × 3–4 worktree = do 14 GB):** dla trwającego workflowa zakończone etapy (Operator/Evaluator/Obrona) NIE potrzebują już swoich worktree — najpierw zapisz commity etapów w refs (python po `journal.jsonl`: pola `sha`/`report_sha` każdego wyniku → `git update-ref refs/keep/R-WEB-<TAG>-<etap>`), potem `git worktree unlock` + `git worktree remove --force --force` dla worktree etapów o numerze mniejszym niż bieżący (bieżący etap zostaw). Zakończone workflowy: usuń wszystkie ich worktree po zapisaniu refs `-op/-eval/-obrona/-fc`. Dodatkowo `rm -rf` katalogów `/tmp/*-dist`, `/tmp/civ-*`, `scratchpad/*-bundle*` starszych niż 90 min (nie dotykaj `scratchpad/aiecon`, `kopia`, `dist`, `perf-seq` dopóki trwa pomiar wydajnościowy — sprawdź TaskList; #417 i #419 są już completed).
5. **Decyzje produktowe/progi liczbowe → ABC do właściciela** (AskUserQuestion, po polsku, rekomendacja pierwsza) — **w nocy NIE blokuj na odpowiedzi**: zapisz pytanie w rejestrze („CZEKA NA RANO”) i idź dalej z tematami niezależnymi. Błędy webowe wykryte w testach → osobny temat R-WEB-* bez pytania (stała zgoda 2026-11-01).
6. **Wdrożenie (tylko ROBOCZA, nigdy KANON/FINALNA)** — przepis z FAL 833/834: `cd scratchpad; FALA_NR=<n> setsid nohup ./dep3.sh "<SHA raportu FC (potomek kodu)>" "<pliki testów tematu>" > /dev/null 2>&1 < /dev/null & disown` (merge do `/home/user/integ`, `npm ci`, `tsc`, `logic-test`, testy tematu, `vite build` do `/tmp/civ-deploy-out`, log `/tmp/vbuild.log`); czekaj w tle na `BUILD_DONE` i brak procesu dep3 (`until grep -q BUILD_DONE /tmp/vbuild.log && ! pgrep -f dep3.sh >/dev/null; do sleep 10; done` jako zadanie w tle; foreground `sleep` >60 s zablokowany); konflikt tylko w `wikiBundle.json` → `cd gra && node tools/bundle-wiki-for-game.cjs`, nigdy ręcznie w kodzie; potem `cp finalize-<poprzedni>.sh finalize-<n>.sh`, podmień `m["finalControl"]=…` (python `re.sub`), `./finalize-<n>.sh <n> "tytuł" "zakres" "weryfikacja" "limity" "źródło"` (stempel, ROBOCZA-MANIFEST, WERSJE.md, push main, kontrola MD5 w GitHub Raw, usunięcie integ). **Nie uruchamiaj finalize przed BUILD_DONE.** Sprawdź MD5: `curl …/raw/<sha main>/gra-robocza/Gra-ROBOCZA.html | md5sum` = manifest. Numer FALI: kolejny po ostatniej w `git log origin/main` (obecnie 835 → 836). Bez nakładania deployu na trwające pomiary wydajnościowe (dep3 obciąża CPU).
7. **Po każdym kroku:** wpis w rejestrze, `git push` gałęzi dispatchów, refs/keep, sprzątanie, `TaskUpdate`. Raport w czacie po polsku: tabela (temat | etap | model etapu | od kiedy); uczciwie NIE ZMIERZONO tam, gdzie nie zmierzono.
8. **Dispatch**: zawsze z regułą „baza = origin/main, sprawdź `git merge-base --is-ancestor`, podaj `git rev-parse HEAD`”, allowlistą, zakazem sesji/zadań/harmonogramów, kryteriami binarnymi i plan testów (5 bramek referencyjnych po `npm ci`).

## STAN NA DZIEŃ 2026-11-18 (ta sekcja nadpisuje historię; poprzednie wersje pliku są w git log)

Nowe starty: sprawdzić `df -h /` przed każdym startem (próg z kroku 4). Wartość wolnego miejsca nie jest tu zapisywana — jest zmienna między pomiarami.
Ostatnia FALA w `git log origin/main`: 835 (fb5b2045a). Rejestr w repo kończy się na FALI 746.

## WDROŻONE OSTATNIE 10 FAL (źródło: `git log origin/main`, subject commita ROBOCZEJ)

| FAL | Commit ROBOCZEJ | Temat (jedno zdanie) | Źródło (subject commita) |
|---|---|---|---|
| 835 | fb5b2045a | Jeden próg gotowości AI do sojuszu 0,54; inicjatywa AI jak ocena propozycji. | „ROBOCZA 5bc75dc2 FALA 835” |
| 834 | f91060856 | Preset testowy walka-mapy przelicza ekonomię; asercja przewijania panelu miasta. | „ROBOCZA 76db1726 FALA 834” |
| 833 | a62b09b3c | Nośnik dopłaty D w traktatach: technologie, złoto, brąz, żelazo, rudy. | „ROBOCZA 5e3de9fb FALA 833” |
| 832 | 13ad6b363 | Usunięcie martwych pól zmęczenia wojną w zegarze profilu. | „ROBOCZA 5bab018a FALA 832” |
| 831 | a72c6b968 | Otwarty panel miasta i panel rekrutacji odświeżają się po końcu tury gracza. | „ROBOCZA dd31cc6f FALA 831” |
| 830 | 0c12240a3 | Traktaty i pokój: ostatni stopień płatności; okno pokoju otwiera się samo. | „ROBOCZA fdc9f6a0 FALA 830” |
| 829 | 1906b3f32 | Okno pokoju wymuszonego z jednym zdaniem na wierzchu; ekran powitalny nowej cywilizacji. | „ROBOCZA fbbefaa4 FALA 829” |
| 828 | c8b0e498b | Panel miasta i panel rekrutacji odświeżają listę po odkryciu technologii. | „ROBOCZA 4eea286a FALA 828” |
| 827 | 49ddb0012 | Okno pokoju wymuszonego: tytuł, partner, zdanie, warunki i przycisk na wierzchu; wyliczenia w tooltipach. | „ROBOCZA 76797672 FALA 827” |
| 826 | 56bb088c1 | Parytet siły i ceny x10 dla rozejmu, NAP, przemarszu, sojuszy i wasala. | „ROBOCZA 7baf24b2 FALA 826” |

Pełna lista FAL: `git log origin/main --grep 'FALA'`. Rejestr (do FALI 746): `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.

## TRWAJĄCE WORKFLOWY (stan 2026-11-18 22:25 UTC; origin/main e29f8c8b3 = FALA 846)

| Temat | wf | Model etapu |
|---|---|---|
| R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 r2 (wariant C, baza 8a2d31af9) | wf_456a1f27-c8e | Operator HAIKU |
| R-WEB-DIPLO-HARDER-RELATIONS-A-NEIGHBOR-TENSION-Q1 r1 (etap A, za flagą) | wf_8d891a52-8b4 | Operator HAIKU |
| R-WEB-AI-AI-ALLIANCES-E3-WIRING-FLAGGED-Q1 r1 (etap B1, za flagą) | wf_5cc7b000-7e5 | Operator HAIKU |
| R-WEB-TEST-DEBT-Q6 r1 | wf_1bf9e5b0-744 | Operator HAIKU |

Bieg orkiestratora poza workflow: pomiar ekonomii 150 tur, ziarna 4242 i 7 (/tmp/econ-out, /tmp/econ-run.sh).
Kolejka na później: etap B2/B4 (wspólne wojny, koalicja antylidera), etap C (Zaufanie 0), reguła wojen C po pomiarze WARMEASURE, TERRITORYRACE r3, punkt B audytu ekonomii.

## GOTOWE DO STARTU

Brak pozycji potwierdzonych w repo (dispatch w `dyspozycje/autobot/runs/` i warunek startu). Katalogi runs/ nie zawierają dispatchów tematów AIAI E2–E6 ani TREATY-PAY krok 2.

## ZALEŻNE (START dopiero po warunku)

Brak pozycji potwierdzonych w repo. AIAI E1 jest w main jako czysta funkcja `evaluateTreatyOffer`, niewpięta w grę (a86a847d7, merge FC 326dede8e; subject „AIAIE1: merge FC 326dede8e”). Dalsze kroki AIAI wymagają dispatchu i decyzji właściciela — wpis po ich zapisaniu w `runs/`.

## CZEKA NA RANO — decyzje i weryfikacja właściciela

Rejestr w repo nie zawiera markerów „CZEKA NA RANO”. Poniżej pozycje „DO DECYZJI WŁAŚCICIELA” z rejestru (przegląd ograniczony do FAL 722–746; brak zamknięcia w rejestrze do wiersza 10148). Statusu po FALI 746 nie zbadano.

1. Gęstość listy wojsk w oknie rozstawienia przy 640 px i wartości liczbowe premii w chipach (rejestr L10123, FALA 744: „jeszcze nie zadane”).
2. Plakietka „+X” obok „Brutto · netto” jest redundantna — do decyzji (rejestr L10001, FALA 729); status po FALI 746 nie ustalony.
3. Palisada w kolejce po odblokowaniu Murarstwa i awans Palisada → Mury kamienne po odblokowaniu Budownictwa (rejestr L9944).
4. Stała C dla AI→gracz bez mnożnika cywilizacji; C 615 vs 500 zależne od tury (rejestr L9961, FALA 722).

## DŁUG RUST / REPIN (źródło: rejestr, wpisy FAL 730–745)

- FALA 730 — REPIN reguły ilości ofert AI (rejestr L10004).
- FALA 731 — REPIN: melee_latched, przeplanowanie uciętych ścieżek, cavTrail (rejestr L10010).
- FALA 740 — REPIN prezentacji karty „Skąd zapasy” (rejestr L10076).
- FALA 741 — REPIN: mnożnik 3, sufit 64, estymata (rejestr L10082).
- FALA 742 — pn_per_szt → pn_per_blok (rejestr L10107).
- FALA 743 — REPIN podłogi bloku w aiNeedPerTurn (rejestr L10121).
- FALA 744 — REPIN (rejestr L10123).
- FALA 745 — REPIN logiki bitewnej, pełny ruch i cios na końcu ruchu (rejestr L10142).

## DŁUG TESTOWY / OBSERWACJE NIE ZMIERZONO (źródło: rejestr)

- FALA 728: test recruitment-panel-compact-row — 7 FAIL, dług bazowy (rejestr L9998).
- FALA 729: 4 testy czerwone — resource-usage-breakdown, ui-language-count-renderer, citizen-resource-upkeep (2 FAIL), empire-armia-produkcja (rejestr L10001).
- FALA 740: martwa sonda ledgerAuditE3c* w main.ts; dziennik AI nie przeżywa zapisu (rejestr L10076).
- FALA 744: defense-breakdown-test (TypeError grecy.bonusy); 4 testy pr141 / budynek-civ-bonus-u17 (rejestr L10123).
- FALA 745: długi bazowe doctrine-live r3 i line-advance-browser (sidecary zwracają HTML) (rejestr L10142).
- FALA 746: t57 endTurn — przyczyna nierozstrzygnięta; pomiar w konfiguracji domyślnej NIE ZMIERZONO (rejestr L10148).

## ZAMKNIĘTE (nie wpisywać do kolejki; źródło: rejestr)

- Decyzje ABC 2026-11-15: żetony widoku miasta bez zmian (wariant A, temat zamknięty); żądanie miasta po 20 turach wojny zostaje (rejestr L10134–10137).
- FALA 741: ilość odbioru oferty AI ≤ 3× potrzeba AI, decyzja ABC B (rejestr L10082).
- FALA 743: oferta AI przy małej potrzebie = 1 pełny blok epoki, decyzja ABC 2026-11-15 B (rejestr L10117–10121).
- FALA 745: pełny ruch i cios na końcu ruchu, wariant B wdrożony (rejestr L10138–10142).

## WYKLUCZONE / WSTRZYMANE

Brak pozycji potwierdzonych w repo. Pozycje z listy zadań sesji (np. #286, #57) usunięte do czasu potwierdzenia decyzji w rejestrze.

## REGUŁY (obowiązują heartbeat i operatorów)

- Zawsze do 4 aktywnych tematów web (właściciel 2026-11-12); start tylko z sekcji GOTOWE DO STARTU i tylko po wypchnięciu dispatchu na gałąź orkiestratora.
- Operatorzy NIE zakładają sesji: `create_session`, `spawn_task`, `create_trigger`, `send_later` są zakazane (zakaz właściciela 2026-11-13).
- Heartbeat NIE zmienia balansu bez zgody właściciela (balans = pozycje z sekcji CZEKA NA RANO).
- Po zakończeniu tematu: integracja, deploy ROBOCZA, push, sprzątanie dysku (worktree zakończonych workflowów).
