# KOLEJKA WEB — stan na 2026-11-15 ~21:30 UTC (main bd647523b, ROBOCZA FALA 748 MD5 ead39d06) — PROGRAM NA NOC 15/16.11

Czytana przez heartbeat :17 i :47 (sesja orkiestratora). Zastępuje wersję z 2026-11-14 (stara w historii git: `git log -- dyspozycje/autobot/KOLEJKA-WEB.md`). Zakres: WYŁĄCZNIE web (Rust NIE). Źródła prawdy o stanie: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, TaskList sesji, `git log origin/main`.

## PROCEDURA NOCNA (obowiązuje heartbeat i orkiestratora; kolejność ważna)

1. **Policz aktywne workflowy** (`subagents/workflows/*/`: `agent-*.jsonl` zmieniony <10 min ORAZ brak wyniku FC w `journal.jsonl`). Cel: 4. Brak aktywności >30 min przy braku procesów w worktree = ZWIS → `TaskStop` i wznowienie rundy (nie ślepe czekanie).
2. **Wynik FC (powiadomienie o zakończeniu workflowa):** `PASS`/`PASS-WITH-NOTES` → refs `refs/keep/<TAG>-{op,eval,obrona,fc}` → **wdrożenie** (niżej) → rejestr → push → sprzątanie worktree → dopiero potem start kolejnego. `FAIL`/`BLOCK` → ta sama ID, następna runda (max 5), DODATEK z konkretnymi NAPRAW z FC; **Sonnet na Operatorze tylko po DWÓCH nieudanych rundach Haiku TEGO SAMEGO tematu** (args `opModel:"claude-sonnet-5-5", haikuFailures:2, sonnetWhy:"…"`). Po rundzie 5: `LIMIT-5-EXCEEDED` → zapisz w rejestrze i zostaw do rana (ABC).
3. **START tematu:** dispatch (`00-dispatch.md` + identyczny `00-dispatch-DODATEK-claude.md`) wypchnięty na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, potem `scratchpad/mkwf.sh <ID> "<opis bez apostrofów i />"` i `Workflow` z `scriptPath`, args `{"id","tag","mode":"full","branch":"claude/sprawdzenie-funkcjonalnosci-ek4ra0","cand":"<SHA>","opModel":"claude-haiku-5-5","round":N}`. **`cand` = SHA `origin/main` (albo kandydat będący JEGO POTOMKIEM) — NIGDY HEAD gałęzi dispatchów** (skrypt każe Operatorowi `git checkout --detach ${cand}`; gałąź dispatchów NIE ma kodu main — incydent 2026-11-15: 3 tematy zmierzone na starym kodzie). Przy rundzie ≥2: `cand` = kandydat poprzedniej rundy (potomek main) i `git merge-base --is-ancestor <main> <cand>` PRZED startem.
4. **Nie startuj** przy dysku < 6 GB (`df -h /`; worktree Operatora ≈ 1 GB, sprzątaj zakończone: `git worktree unlock` + `git worktree remove --force --force`; `/tmp/*-live-dist`, `/tmp/civ-*` starsze niż 90 min — ale nie katalogi trwających testów). Nie uruchamiaj tematu z zależnością, jeśli warunek startu nie jest spełniony. Nie startuj tematów „dla zapełnienia” bez realnej pracy.
4a. **Sprzątanie w trakcie nocy (dysk spada o ok. 1 GB na worktree; 4 tematy × 3–4 worktree = do 14 GB):** dla trwającego workflowa zakończone etapy (Operator/Evaluator/Obrona) NIE potrzebują już swoich worktree — najpierw zapisz commity etapów w refs (python po `journal.jsonl`: pola `sha`/`report_sha` każdego wyniku → `git update-ref refs/keep/R-WEB-<TAG>-<etap>`), potem `git worktree unlock` + `git worktree remove --force --force` dla worktree etapów o numerze mniejszym niż bieżący (bieżący etap zostaw). Zakończone workflowy: usuń wszystkie ich worktree po zapisaniu refs `-op/-eval/-obrona/-fc`. Dodatkowo `rm -rf` katalogów `/tmp/*-dist`, `/tmp/civ-*`, `scratchpad/*-bundle*` starszych niż 90 min (nie dotykaj `scratchpad/aiecon`, `kopia`, `dist`, `perf-seq` dopóki #417/#419 trwają).
5. **Decyzje produktowe/progi liczbowe → ABC do właściciela** (AskUserQuestion, po polsku, rekomendacja pierwsza) — **w nocy NIE blokuj na odpowiedzi**: zapisz pytanie w rejestrze („CZEKA NA RANO”) i idź dalej z tematami niezależnymi. Błędy webowe wykryte w testach → osobny temat R-WEB-* bez pytania (stała zgoda 2026-11-01).
6. **Wdrożenie (tylko ROBOCZA, nigdy KANON/FINALNA)** — przepis z FALI 747/748: `cd scratchpad; FALA_NR=<n> setsid nohup ./dep3.sh "<SHA raportu FC (potomek kodu)>" "<pliki testów tematu>" > /dev/null 2>&1 < /dev/null & disown` (merge do `/home/user/integ`, `npm ci`, `tsc`, `logic-test`, testy tematu, `vite build` do `/tmp/civ-deploy-out`, log `/tmp/vbuild.log`); czekaj w tle na `BUILD_DONE` i brak procesu dep3 (`until grep -q BUILD_DONE /tmp/vbuild.log && ! pgrep -f dep3.sh >/dev/null; do sleep 10; done` jako zadanie w tle; foreground `sleep` >60 s zablokowany); konflikt tylko w `wikiBundle.json` → `cd gra && node tools/bundle-wiki-for-game.cjs`, nigdy ręcznie w kodzie; potem `cp finalize-<poprzedni>.sh finalize-<n>.sh`, podmień `m["finalControl"]=…` (python `re.sub`), `./finalize-<n>.sh <n> "tytuł" "zakres" "weryfikacja" "limity" "źródło"` (stempel, ROBOCZA-MANIFEST, WERSJE.md, push main, kontrola MD5 w GitHub Raw, usunięcie integ). **Nie uruchamiaj finalize przed BUILD_DONE.** Sprawdź MD5: `curl …/raw/<sha main>/gra-robocza/Gra-ROBOCZA.html | md5sum` = manifest. Numer FALI: kolejny po ostatniej w `git log origin/main` (obecnie 748 → 749). Bez nakładania deployu na trwające pomiary wydajnościowe (dep3 obciąża CPU).
7. **Po każdym kroku:** wpis w rejestrze, `git push` gałęzi dispatchów, refs/keep, sprzątanie, `TaskUpdate`. Raport w czacie po polsku: tabela (temat | etap | model etapu | od kiedy); uczciwie NIE ZMIERZONO tam, gdzie nie zmierzono.
8. **Dispatch**: zawsze z regułą „baza = origin/main, sprawdź `git merge-base --is-ancestor`, podaj `git rev-parse HEAD`”, allowlistą, zakazem sesji/zadań/harmonogramów, kryteriami binarnymi i plan testów (5 bramek referencyjnych po `npm ci`).

## TRWAJĄCE (21:30; nie uruchamiać drugi raz)

| Temat | ID workflowa / runda | Model | Co dalej po FC |
|---|---|---|---|
| #410 Bitwa: arbitraż kolizji, piechota pierwsza (R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1) | wf_ce781194-250, r1 | Sonnet (uzasadnione) | PASS → FALA 749 (battleScene.ts; pilnuj, by reguła pełnego ruchu nie zregresowała); potem START #421 |
| #417 Harness ekonomii AI (R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1) | wf_3163500e-500, r3 | Sonnet (po 2 nieudanych Haiku) | PASS → wdrożenie (tylko narzędzia + blok civTest w main.ts) → START #418, #419, #415-pomiar; sprawdź wynik `--resume-test` (N5) → rozstrzyga #424 |
| #420+#423 Dług testowy sidecarów i L2b (R-WEB-TEST-DEBT-SIDECAR-HTML-AND-L2B-Q1) | wf_1b099da4-581, r2 (baza main 7ac79dafb) | Haiku | PASS → wdrożenie (tylko testy) |
| #426 Weryfikacja bitwy po pełnym ruchu (R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1) | wf_951a88b2-52e, r3 | Sonnet (po 2 nieudanych Haiku) | PASS → wdrożenie narzędzi; kandydaci z raportu → osobne tematy; START #421 |

## GOTOWE DO STARTU (dispatch w repo; kolejność = priorytet; start gdy slot < 4 i dysk ≥ 6 GB)

1. **R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1** (#428; decyzja właściciela ABC A 2026-11-15): Nauka/Żywność/Handel do samych liczb + wiki §53.1a (regeneracja bundla generatorem). Haiku, `cand` = origin/main. Pliki: `empireDetailPanel.ts`, `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md`.
2. **R-WEB-TEST-DEBT-RESOURCE-USAGE-BREAKDOWN-BUILD-Q1** (#427): test `resource-usage-breakdown-test.cjs` nie buduje się (loader .svg). Haiku, tylko `gra/tools`.

## ZALEŻNE (dispatch w repo; START dopiero po warunku)

3. **R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1** (#421) — po FC #410 **i** #426 (ten sam obszar `battleScene.ts`/narzędzi bitwy). Haiku, pomiary.
4. **R-WEB-ENDTURN-T57-DIAGNOSIS-Q1** (#418) — po FC PASS #417 (harness z AI). Haiku, diagnoza.
5. **R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1** (#419) — po FC PASS #417; **sekwencyjnie** (nie równolegle z innymi ciężkimi testami live ani z dep3) — mierzy czas tury. Haiku.
6. **#415 R-WEB-AI-ARMY-UPKEEP-Q2** (AI utrzymanie armii ponad zapas): kod bramki w `refs/keep/R-WEB-AI-UPKEEP-Q2-r2-*` (flaga OFF), wstrzymany, bo harness nie domykał tury 1. Po #417 PASS: dispatch **pomiaru ON/OFF** na harnessie (README #415 z tematu #417) — wyniki do decyzji ABC (próg/włączenie) **rano**; nie włączaj flagi bez właściciela. Dispatch napisz po #417 (baza: kandydat harnessu + `refs/keep/R-WEB-AI-UPKEEP-Q2-r2-obrona`).
7. **#424 R-WEB-SAVE-LOAD-CITY-WORK-SPLIT-ROUNDTRIP-Q1** — ZATRZYMANY; przesłanka z zlej bazy. Po #417 PASS (wynik `--resume-test` na main): 10/10 → zamknąć jako nieodtworzone; inaczej wznowić (dispatch e4161c9f, refs `refs/keep/R-WEB-SAVELOAD-SPLIT-r1-*`, `cand` = SHA main).

## WDROŻENIA OCZEKUJĄCE
Brak (FALA 748 wdrożona). Następna: **FALA 749** = pierwszy FC PASS z listy TRWAJĄCE.

## DO ZROBIENIA RANO / CZEKA NA DECYZJĘ WŁAŚCICIELA (nie uruchamiać w nocy)
- #415: wyniki pomiaru ON/OFF → próg/włączenie bramki utrzymania armii AI (ABC).
- Kandydaci z raportów #426 (K-A/K-B/K-C: driver ręczny, eksport odwrotów, scenariusz 12v12 „cała armia ucieka bez zabitych”) — ocena właściciela, jeśli wskażą defekt reguł.
- #428/ujednolicenie: po wdrożeniu — potwierdzenie wyglądu w grze.
- Wiki/Civpedia: inne hasła opisujące stary format brutto/netto (jeśli generator wskaże).
- Dług Rust REPIN po zmianach weba FALA 724–748 (#408) — poza pętlą webową.

## WYKLUCZONE / WSTRZYMANE
- #286 (wojownik barbarzyńców „z supermocą”) — na żądanie właściciela, nie uruchamiać.
- #57 nowe epoki Klasyczna/Średniowieczna — wstrzymane (dopiero przy nowej wersji Rust).
- Wszystko w Rust (poza pętlą webową).

## ZAMKNIĘTE (nie wpisywać do kolejki)
FALE 650–748 (zob. rejestr). Decyzje ABC 2026-11-14/15: miedź bez zmian; AI od tury 1 tak; dźwignia kolejki usunięta; walka ręczna RNG AUTO; martwa gałąź żądania miasta ZOSTAJE (2026-11-15, #376); oferty AI min. 1 blok; pełny ruch: pierwszeństwo mają doktryny Obrona/Ostrzał i rozkaz gracza; arbitraż kolizji A (piechota pierwsza); żetony widoku miasta jedna linia; ujednolicenie brutto/netto A. Tematy z `DECYZJE 2026-11-14` (NOTIF-DIPLO-TAB-COUNT, UNIT-CARD-STATS-ENGINE-CANON, NNS-AI-BALANCE-FROM-TURN1, NNS-GATE-REMOVE-QUEUE-LEVER, TRADE-OFFER-FREQUENCY-UP, TRUST-WAR-N6-CLEANUP, RIVERS-FILL-CENTROID-PERF, BATTLE-MANUAL-RNG-DETERMINISM, UI-SIEGE-PANEL-NARROW, ADMIN-DISMISS-CONFIRM) mają FC na main — NIE powtarzać; `R-WEB-AI-CITY-FOR-PEACE-BRANCH-ORDER-Q1` zastąpiony decyzją #376 (nie startować).

## KRÓTKA ŚCIĄGA PO UPADKU KONTENERA
Worktree, journale (`/root/.claude/projects/.../subagents/workflows/<wf>/journal.jsonl`) i refs przeżywają restart. Wznów workflow: `Workflow({scriptPath, resumeFromRunId:<wf id TEGO samego tematu>, args: IDENTYCZNE})` — **nie zamieniaj ID między tematami** (incydent 2026-11-15). Wyniki rund: python po `journal.jsonl` (linie `"type":"result"`, pole `result`; ostatni = FC).

## ZALEŻNE — NOWE (2026-11-16 01:25)
- **#415 runda 2: R-WEB-AI-UPKEEP-ONOFF-MEASURE-100T-Q1** — r1 FC FAIL (refs `refs/keep/R-WEB-UPKEEP-ONOFF-r1-*`), DODATEK 1 zapisany. START dopiero po FC PASS + wdrożeniu **R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1** (wf_8e38b091-f78). `cand` = SHA origin/main PO tym wdrożeniu (nie wcześniej!). `round: 2`, Haiku (r1 = 1 nieudana runda). Przebiegi ciągłe w tle, sekwencyjnie (ok. 3 h).
- **#432 + defekt `playerEverOwnedCityByOwner`** (nie odtwarzany po wczytaniu; blokuje „Zakończ turę” gdy gracz ma 0 miast) — tematy zapisu/wczytania; START po zakończeniu #424 (te same pliki save/load).
- **#419 runda 2: R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1** — r1 FC FAIL (refs `refs/keep/R-WEB-LEDGER-PERF-r1-*`; wynik wstępny: ON +20% średnia / +17% mediana przy load ~7, 1 ziarno × 1 para — NIE ROZSTRZYGNIĘTE). DODATEK 2 zapisany. START TYLKO W CISZY: load < 3 i brak innych przebiegów live (po zakończeniu #415 r2 i innych pomiarów). `cand` = SHA origin/main w chwili startu, `round: 2`, Haiku, scriptPath `WEB-R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1.js`.

## STAN 2026-11-16 ~14:50 UTC (nadpisuje sekcje wyżej, które są historyczne) — main 8265bbec0, ROBOCZA FALA 769 MD5 f24457ae
- WDROŻONE od 15.11: FALE 749–769 (m.in. 764 ręczny pełny ruch, 765 brak domyślnej listy budowy, 766 tekst podpowiedzi audiencji, 767 arbitraż niewybranych, 768 panel obrony bez zer + narzędzia, 769 stary zapis nie czeka na pierwsze miasto). Wszystkie tematy z sekcji TRWAJĄCE/GOTOWE/ZALEŻNE powyżej są ZAMKNIĘTE (zob. rejestr).
- TRWA: tylko R-WEB-AI-UPKEEP-ONOFF-MEASURE-100T-Q1 r3 (wf_2bd2286e-571, Sonnet po 2 nieudanych Haiku; pomiar, flaga OFF). Po FC → ABC właściciela (włączenie bramki utrzymania armii AI).
- Brak tematów gotowych do startu bez decyzji właściciela. Niski priorytet (nie na zapełnienie slotów): #438 hak civTest do odmowy AI (L2b); sprzątanie martwej pozostałości `wspolnaReligia` w main.ts (~44101); #272 obserwacje.
- CZEKA NA WŁAŚCICIELA: bramka utrzymania armii AI (po pomiarze); dane Greków `walka_obrona_piechota_teren_las = 0`; `map-snapshot-load` KNOWN-FAIL (budżet rotacji autozapisu); nieblokująco: zapis z 0 miast ma grać dalej bez porażki?
- ZALEŻNE (2026-11-18): R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 — model PW pokoju P·r / P/r wg Power; START po wdrożeniu FORCEDPEACE i DECLUTQ2 (te same pliki); dispatch w dyspozycje/autobot/runs/.
