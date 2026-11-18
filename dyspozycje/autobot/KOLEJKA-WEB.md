# KOLEJKA WEB — stan na 2026-11-18 (baza origin/main a86a847d7; ostatnia FALA 834; ROBOCZA MD5 76db17269c1c6cd30a14418cbdf65dda)

Czytana przez heartbeat :17 i :47. Źródła stanu (każda pozycja ma odsyłacz):
- `git log origin/main` (commity „ROBOCZA … FALA n” i „FALA n: merge FC …”) — dla FAL 747–834,
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — w bazie a86a847d7 kończy się na FALI 746 (wiersz 10148),
  więc FALE 747–834 są potwierdzane z gita, nie z rejestru,
- TaskList sesji orkiestratora (odsyłacz `#N`); ID workflowów z TaskList nie są potwierdzone w `journal.jsonl`.
Zakres: WYŁĄCZNIE web. Rust tylko jako dług (sekcja DŁUG RUST/REPIN).

## PROCEDURA NOCNA (obowiązuje heartbeat i orkiestratora; kolejność ważna)

1. **Policz aktywne workflowy** (`subagents/workflows/*/`: `agent-*.jsonl` zmieniony <10 min ORAZ brak wyniku FC w `journal.jsonl`). Cel: 4. Brak aktywności >30 min przy braku procesów w worktree = ZWIS → `TaskStop` i wznowienie rundy (nie ślepe czekanie).
2. **Wynik FC (powiadomienie o zakończeniu workflowa):** `PASS`/`PASS-WITH-NOTES` → refs `refs/keep/<TAG>-{op,eval,obrona,fc}` → **wdrożenie** (niżej) → rejestr → push → sprzątanie worktree → dopiero potem start kolejnego. `FAIL`/`BLOCK` → ta sama ID, następna runda (max 5), DODATEK z konkretnymi NAPRAW z FC; **Sonnet na Operatorze tylko po DWÓCH nieudanych rundach Haiku TEGO SAMEGO tematu** (args `opModel:"claude-sonnet-5-5", haikuFailures:2, sonnetWhy:"…"`). Po rundzie 5: `LIMIT-5-EXCEEDED` → zapisz w rejestrze i zostaw do rana (ABC).
3. **START tematu:** dispatch (`00-dispatch.md` + identyczny `00-dispatch-DODATEK-claude.md`) wypchnięty na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, potem `scratchpad/mkwf.sh <ID> "<opis bez apostrofów i />"` i `Workflow` z `scriptPath`, args `{"id","tag","mode":"full","branch":"claude/sprawdzenie-funkcjonalnosci-ek4ra0","cand":"<SHA>","opModel":"claude-haiku-5-5","round":N}`. **`cand` = SHA `origin/main` (albo kandydat będący JEGO POTOMKIEM) — NIGDY HEAD gałęzi dispatchów** (skrypt każe Operatorowi `git checkout --detach ${cand}`; gałąź dispatchów NIE ma kodu main — incydent 2026-11-15: 3 tematy zmierzone na starym kodzie). Przy rundzie ≥2: `cand` = kandydat poprzedniej rundy (potomek main) i `git merge-base --is-ancestor <main> <cand>` PRZED startem.
4. **Nie startuj** przy dysku < 6 GB (`df -h /`; worktree Operatora ≈ 1 GB, sprzątaj zakończone: `git worktree unlock` + `git worktree remove --force --force`; `/tmp/*-live-dist`, `/tmp/civ-*` starsze niż 90 min — ale nie katalogi trwających testów). Nie uruchamiaj tematu z zależnością, jeśli warunek startu nie jest spełniony. Nie startuj tematów „dla zapełnienia” bez realnej pracy.
4a. **Sprzątanie w trakcie nocy (dysk spada o ok. 1 GB na worktree; 4 tematy × 3–4 worktree = do 14 GB):** dla trwającego workflowa zakończone etapy (Operator/Evaluator/Obrona) NIE potrzebują już swoich worktree — najpierw zapisz commity etapów w refs (python po `journal.jsonl`: pola `sha`/`report_sha` każdego wyniku → `git update-ref refs/keep/R-WEB-<TAG>-<etap>`), potem `git worktree unlock` + `git worktree remove --force --force` dla worktree etapów o numerze mniejszym niż bieżący (bieżący etap zostaw). Zakończone workflowy: usuń wszystkie ich worktree po zapisaniu refs `-op/-eval/-obrona/-fc`. Dodatkowo `rm -rf` katalogów `/tmp/*-dist`, `/tmp/civ-*`, `scratchpad/*-bundle*` starszych niż 90 min (nie dotykaj `scratchpad/aiecon`, `kopia`, `dist`, `perf-seq` dopóki trwa pomiar wydajnościowy — sprawdź TaskList; #417 i #419 są już completed).
5. **Decyzje produktowe/progi liczbowe → ABC do właściciela** (AskUserQuestion, po polsku, rekomendacja pierwsza) — **w nocy NIE blokuj na odpowiedzi**: zapisz pytanie w rejestrze („CZEKA NA RANO”) i idź dalej z tematami niezależnymi. Błędy webowe wykryte w testach → osobny temat R-WEB-* bez pytania (stała zgoda 2026-11-01).
6. **Wdrożenie (tylko ROBOCZA, nigdy KANON/FINALNA)** — przepis z FAL 833/834: `cd scratchpad; FALA_NR=<n> setsid nohup ./dep3.sh "<SHA raportu FC (potomek kodu)>" "<pliki testów tematu>" > /dev/null 2>&1 < /dev/null & disown` (merge do `/home/user/integ`, `npm ci`, `tsc`, `logic-test`, testy tematu, `vite build` do `/tmp/civ-deploy-out`, log `/tmp/vbuild.log`); czekaj w tle na `BUILD_DONE` i brak procesu dep3 (`until grep -q BUILD_DONE /tmp/vbuild.log && ! pgrep -f dep3.sh >/dev/null; do sleep 10; done` jako zadanie w tle; foreground `sleep` >60 s zablokowany); konflikt tylko w `wikiBundle.json` → `cd gra && node tools/bundle-wiki-for-game.cjs`, nigdy ręcznie w kodzie; potem `cp finalize-<poprzedni>.sh finalize-<n>.sh`, podmień `m["finalControl"]=…` (python `re.sub`), `./finalize-<n>.sh <n> "tytuł" "zakres" "weryfikacja" "limity" "źródło"` (stempel, ROBOCZA-MANIFEST, WERSJE.md, push main, kontrola MD5 w GitHub Raw, usunięcie integ). **Nie uruchamiaj finalize przed BUILD_DONE.** Sprawdź MD5: `curl …/raw/<sha main>/gra-robocza/Gra-ROBOCZA.html | md5sum` = manifest. Numer FALI: kolejny po ostatniej w `git log origin/main` (obecnie 834 → 835). Bez nakładania deployu na trwające pomiary wydajnościowe (dep3 obciąża CPU).
7. **Po każdym kroku:** wpis w rejestrze, `git push` gałęzi dispatchów, refs/keep, sprzątanie, `TaskUpdate`. Raport w czacie po polsku: tabela (temat | etap | model etapu | od kiedy); uczciwie NIE ZMIERZONO tam, gdzie nie zmierzono.
8. **Dispatch**: zawsze z regułą „baza = origin/main, sprawdź `git merge-base --is-ancestor`, podaj `git rev-parse HEAD`”, allowlistą, zakazem sesji/zadań/harmonogramów, kryteriami binarnymi i plan testów (5 bramek referencyjnych po `npm ci`).

## STAN NA DZIEŃ 2026-11-18 (ta sekcja nadpisuje historię; poprzednie wersje pliku są w git log)

Dysk `/` w chwili odświeżenia: 5,9 GB wolnego (`df -h /`), czyli PONIŻEJ progu z kroku 4 — nowe starty wstrzymane do sprzątania.

## WDROŻONE OSTATNIE 10 FAL (źródło: `git log origin/main`, bo rejestr w bazie kończy się na FALI 746)

| FAL | Commit ROBOCZEJ | Temat (jedno zdanie) | Źródło |
|---|---|---|---|
| 834 | f91060856 | Preset testowy walka-mapy przelicza ekonomię; asercja przewijania panelu miasta (MD5 76db1726). | git f91060856; TaskList #533 |
| 833 | a62b09b3c | Nośnik dopłaty D w traktatach: technologie, złoto, brąz, żelazo, rudy (MD5 5e3de9fb). | git a62b09b3c; TaskList #528 |
| 832 | 13ad6b363 | Usunięcie martwych pól zmęczenia wojną w zegarze profilu (MD5 5bab018a). | git 13ad6b363; TaskList #533 |
| 831 | a72c6b968 | Otwarty panel miasta i panel rekrutacji odświeżają się po końcu tury gracza (MD5 dd31cc6f). | git a72c6b968; TaskList #533 |
| 830 | 0c12240a3 | Traktaty i pokój: ostatni stopień płatności, okno pokoju otwiera się samo (MD5 fdc9f6a0). | git 0c12240a3; TaskList #529, #531 |
| 829 | 1906b3f32 | Okno pokoju wymuszonego z jednym zdaniem na wierzchu oraz ekran „Odkryłeś nową cywilizację” (MD5 fbbefaa4). | git 1906b3f32; TaskList #530 |
| 828 | c8b0e498b | Panel miasta i panel rekrutacji odświeżają listę po odkryciu technologii (PANELREF, MD5 4eea286a). | git c8b0e498b; TaskList #492 |
| 827 | 49ddb0012 | Okno pokoju wymuszonego: tytuł, partner, zdanie, warunki i przycisk na wierzchu; wyliczenia w tooltipach (FPDECLUT, MD5 76797672). | git 49ddb0012; TaskList #525 |
| 826 | 56bb088c1 | Parytet siły i ceny ×10 dla rozejmu, NAP, przemarszu, sojuszy i wasala (TREATYIMPL, MD5 7baf24b2). | git 56bb088c1; TaskList #527 |
| 825 | 2b950566f | Model punktów PW pokoju P·r i P/r wg Power; słabszy dopłaca miastami (PEACEPWIMPL, MD5 487869e7). | git 2b950566f; TaskList #523 |

Pełna lista FAL 650–834: `git log origin/main --grep 'FALA'`; rejestr do FALI 746: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.

## TRWAJĄCE WORKFLOWY (nie uruchamiać drugi raz)

Źródło: TaskList (stan `in_progress`); ID workflowów z TaskList, NIE potwierdzone w `journal.jsonl`. Przed wznowieniem ustalić z journalem workflowów.

| Temat | ID workflowa / runda | Model | Źródło |
|---|---|---|---|
| D2 + hooki testowe (dług testowy: zaufanie w wojnie N=6, playtest) | wf_f5ac066e-687, r3 (baza f2d3d48aa; r1 INFRA/BLOCK, r2 FC FAIL) | Operator SONNET po 2 nieudanych Haiku | TaskList #532 |
| THRESH054: ujednolicenie progu inicjatywy AI do sojuszu 0,6→0,54 (P-2 A) + audyt rozjazdu NAP prog_relacja 50 vs 110. FC PASS-WITH-NOTES; FALA 835 w budowie (build) — wdrożenie w toku, nie start nowego tematu | wf_f8def1e0-d10, r1 | HAIKU | TaskList #539, #537 |
| LIVETREATY: żywa weryfikacja okien płatności traktatów (FALA 833) i ogona pokoju (FALA 830) | wf_bfd088bd-070, r1 | HAIKU | TaskList #540 |
| KOLEJKAREFRESH: odświeżenie tego pliku (ten run) | wf_e1f7c3d0-a0d, r1 | HAIKU | TaskList #541 |

## GOTOWE DO STARTU

Brak. Sprawdzono: tematy AIAI E2–E6 i TREATY-PAY krok 2 nie mają dispatchu w `dyspozycje/autobot/runs/`; TREATY-PAY krok 2 wymaga decyzji ABC. Tematy poprzedniej wersji tej sekcji (FORCEDPEACE, PEACE-PW, TREATIES-POWER-PARITY, DOC-WEARINESS, FPDECLUT) są wdrożone (zob. ZAMKNIĘTE).

## ZALEŻNE (START dopiero po warunku)

- **#542 TREATY-PAY krok 2** — AI jako płatnik D (gracz silniejszy) i stopnie „praca”, „pieniądze (¤)”. Warunek: decyzja ABC z #538 pkt 1–2. Dispatch do napisania po decyzji. Źródło: TaskList #542, #528.
- **#543 AIAI E2** — NAP AI↔AI (15 tur, kara −30/−20 za zerwanie) + płatność D złotem; wpięcie `evaluateTreatyOffer` w turę AI. Warunek: wdrożenie THRESH054 (#539, FALA 835 w budowie) i decyzja ABC P-3, P-6, P-7 (#538). Źródło: TaskList #543, #537; E1 w main a86a847d7 (FC PASS-WITH-NOTES 326dede8e).
- **#544 AIAI E3–E6** — sojusz obronny AI↔AI (kaskada wojny), sojusz pełny, reguła „sojusz z wrogiem” (P-4), symulacja ≥3×150 tur przed wpięciem. Warunek: E2 wdrożone. Źródło: TaskList #544; projekt main 3a00b867f (#535).
- **#408 Dług Rust REPIN** — poza pętlą webową; po FALACH 724–834. Źródło: TaskList #408.

## CZEKA NA RANO — decyzje i weryfikacja właściciela

Rejestr w bazie nie zawiera otwartych pozycji „CZEKA NA RANO” w ostatnich wpisach (kończy się na FALI 746); lista z TaskList.

1. **#538 (pending)**: (1) AI jako płatnik D (gracz silniejszy) z własnych zapasów? (2) ¤ jako osobna pula od złota? (3) P-3 dopłata AI↔AI tylko złotem, P-6 brak wasala AI↔AI, P-7 automatyczne wezwanie do wojny — potwierdzić; (4) założenie PEACELAST: pokój bez technologii, pracy i ¤; (5) NAP: próg Relacji 50 (ścieżka UI „wym. 50”) vs 110 (diplomacy.json) — zalecenie 110.
2. **#464 (completed; RYZYKO otwarte)**: pokój wymuszony bez oddania miasta przy ≤3 miastach przegrywającego — wariant A (jedno miasto za pokój) lub B (bez zmian).
3. **#463 (completed; CZEKA NA RANO)**: waga miasta 10%; stolica / min. 3 miasta; pokój AI-AI przy cenie 0.
4. **#472 (completed; CZEKA RANO)**: utrzymanie Garnizonu 4 vs 2 w danych (mnożnik silnika); decyzja o treści podpowiedzi — #485 (GARNTIP, decyzja A: dane bez zmian).
5. **#509 (completed; CZEKA NA WŁAŚCICIELA)**: akceptacja lub poprawki tekstów ekranu powitalnego (TEKSTY-DO-AKCEPTACJI.md); wdrożenie FALA 829 (TaskList #492) — potwierdzić treść.
6. **#489 (completed; treść „DECYZJE właściciela (otwarte)”)**: pytania ABC 1–4, siege.ts bez trybu „pewne”, balans łuczników vs Wojownik — status do ustalenia z właścicielem.
7. **#441 (pending)**: weryfikacja w grze FAL 764–769 oraz 826–834 (parytet i ceny traktatów ×10, okno pokoju wymuszonego, ogon płatności, nośnik D, odświeżanie paneli po końcu tury).
8. **#545 (pending)**: raport dla właściciela rano — lista FAL 826–834+, co zmienia się w grze, zmierzone vs NIE ZMIERZONO, pytania ABC.
9. **#501 (pending, niski priorytet)**: różnica strat AUTO vs skip w bitwie; pokrycie progSygnaluPokoju tylko w profile-unit.

## DŁUG RUST / REPIN (poza pętlą webową; źródło TaskList)

- #408 — REPIN po FALACH 724–834: treaty-payment, ogon pokoju (peace-tail-payment), ai_diplomacja_prog_sojusz 0,54, refreshOpenPanelsAtTurnStart, martwe pola zmęczenia, hooki civTest.
- #445 — GENSTAR (meta/REPIN dług Rust).
- #446 — REPIN meta.lossCounters.
- #450 — REPIN releaseSplitFromSiege.
- #454 — REPIN planRoadNetwork.
- #457 — GARRISON (dług Rust REPIN).
- #458 — REPIN tabeli zamian (Łucznik → Procarz).
- #460 / #465 — AMBUSH-CORE, AMBUSH-DEPLOY (dług Rust REPIN).
- #506 — RANGEDHEALTH (dług Rust REPIN).

## DŁUG TESTOWY / OBSERWACJE NIE ZMIERZONO

- Chromium NIE ZMIERZONO: #444 (EMPTYQ, także gałąź „Ulepsz”), #445 (GENSTAR, po Reset), #457 (GARRISON), #460 (AMBUSH-CORE, AI→gracz), #465 (rozstawienie), #506 (kart i skutku na bitwy), #508 (odświeżanie przy awansie epoki/utracie miasta w trakcie tury), #502 (widoczność toastu pod nakładką tury).
- #536 DMGLABEL: brak zrzutów PRZED/PO.
- #532 D2/A: NIE ZMIERZONO (playtest = mapa z 1 głównym AI).
- #466 CSSRAW: długi formation-rules, standoff/auto-battle fixture, F8, archer-behind, brandAssets svg?raw.
- #474 GENCAP: w main bez wdrożenia (tylko test); luka: brak asercji limitu stosu super-jednostek (niski priorytet).
- #467 WINGBANDS: przestarzała asercja po AMBUSH-DEPLOY; #472 GARNDIAG: przestarzałe asercje AI1/E4 (tylko test).
- #436 / #440: znany błąd `map-snapshot-load` (zostaje, budżet rotacji autozapisu); Grecy las = 0 (zostaje).

## ZAMKNIĘTE (nie wpisywać do kolejki)

- Traktaty, pokój i zmęczenie: DIPLO-5 (#517, FALA 818), DESPAIRIMPL (#518, FALA 811), PEACEVAZNE (#520, FALA 819), DECLUTTER (#522, FALE 820–821), FORCEDPEACE (#521, FALA 822), DOCWEAR (#523/#524, FALA 823), STALEWEAR (#526, FALA 824), PEACEPWIMPL (#523, FALA 825), TREATYIMPL (#527, FALA 826), FPDECLUT (FALA 827), TREATY-PAY (#528, FALA 833), PEACE-LASTSTAGE (#529, FALA 830), FPAUTOOPEN (#531, FALA 830).
- Testy i porządki: TESTGAPS (FALA 834), LEGACYREMOVE (FALA 832), CITYREFRESH (FALA 831), PANELREF (FALA 828), TECHBADGE (FALA 790), IDSLEAK (FALA 789), WELCOME (FALA 829; akceptacja tekstów otwarta w CZEKA NA RANO).
- Decyzje właściciela zamknięte: miedź bez zmian (#374); AI od tury 1 tak (#375); dźwignia kolejki usunięta (#368); próg zmęczenia 0,8 (#361); oferty AI min. 1 blok (#395); szlak handlowy tylko premia (#311); pełny ruch i cios na końcu ruchu (#407, #409); arbitraż kolizji piechota pierwsza (#410); łucznicy 4/5/6 (#451); UNITSHP jedno pole health (#455); zwolnienie administratora z potwierdzeniem (#360).

## WYKLUCZONE / WSTRZYMANE

- #286 (wojownik barbarzyńców „z supermocą”) — na żądanie właściciela, nie uruchamiać (TaskList #286).
- #57 (nowe epoki Klasyczna/Średniowieczna) — WSTRZYMANE decyzją właściciela, dopiero przy nowej wersji Rust (TaskList #57, pending).
- Wszystko w Rust poza pętlą webową (sekcja DŁUG RUST / REPIN).

## REGUŁY (obowiązują heartbeat i operatorów)

- Zawsze do 4 aktywnych tematów web (właściciel 2026-11-12); start tylko z sekcji GOTOWE DO STARTU i tylko po wypchnięciu dispatchu na gałąź orkiestratora.
- Operatorzy NIE zakładają sesji: `create_session`, `spawn_task`, `create_trigger`, `send_later` są zakazane (zakaz właściciela 2026-11-13).
- Heartbeat NIE zmienia balansu bez zgody właściciela (balans = pozycje z sekcji CZEKA NA RANO).
- Po zakończeniu tematu: integracja, deploy ROBOCZA, push, sprzątanie dysku (worktree zakończonych workflowów).
