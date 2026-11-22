# KOLEJKA WEB — stan na 2026-11-19 (origin/main = źródło prawdy; ROBOCZA MD5 891481b5 = FALA 876)

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

## STAN NA DZIEŃ 2026-11-19 (ta sekcja nadpisuje historię; poprzednie wersje pliku są w git log)

Rejestr `dyspozycje/REJESTR-PROSB-I-ZADAN.md` jest znów aktualny (wpisy FAL 860–876 i wszystkie decyzje właściciela z 2026-11-19). Wdrożone dziś na ROBOCZĄ: FALE 860–876 (ostatnie: 874 stadnina bez lasu; 875 utrzymanie jednostek ×1/×2/×4 — realnie tylko żywność jednostek 4/8/16; 876 zamiana Żywności na Podatek 1:1). Rebalans epok (flaga `eraRebalansAktywny`) jest WŁĄCZONY.
Nowe starty: `df --output=avail -BG /` ≥ 6 GB (integracja `/home/user/integ` ≥ 4 GB). Integracja do main tylko gdy `origin/main` jest przodkiem HEAD.

## DECYZJE WŁAŚCICIELA 2026-11-19 (ZAPIS PEŁNY — źródło prawdy dla autonomicznej pętli; szczegóły i cytaty w rejestrze)

**ŻYWNOŚĆ JEDNOSTEK — DECYZJA OSTATECZNA (2026-11-19, zaakceptowana tabela): ×4 na epokę jednostki (Kamień ×1, Brąz ×4, Żelazo ×16; 4/16/64 na jednostkę z bazą 1), dla wszystkich jednostek; ANULUJE ustalenia FALI 875 (×1/×2/×4) i dodatkowy mnożnik 1/4/8; pieniądz i surowce utrzymania bez zmian; kurs żywność→Podatek 0,2. Wdrożyć po FC bez dalszego pytania (temat UPKEEPMULT, wf_e37ebeff-a98).** Pozycje 1 i 3 sekcji „CZEKA NA RANO” (korekta skarbca Brąz; spadek żywności epok 4–5) są przez tę decyzję zamknięte.

**ZASADA STAŁA (właściciel 2026-11-19): każdy nowy mnożnik jest DODATKOWY i mnoży obecne współczynniki w grze; nowe ustalenia nie zastępują wcześniejszych decyzji.** (Korekta: FALA 875 źle zastąpiła żywność jednostek ×3/epokę wartością ×1/×2/×4; poprawka w temacie R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1: żywność ×3/epokę przywrócona, dodatkowy mnożnik utrzymania Pieniądza i Żywności 1/4/8, surowce po staremu; kurs żywność→Podatek 0,2.)

**Ekonomia (rebalans wg epok):** wszystkie surowce ulepszeń bez wzrostu co epokę (stałe wartości z Kamienia); utrzymanie jednostek żywność: pierwotnie ×3/epokę, **zastąpione 2026-11-19 przez ×1/×2/×4 (Kamień/Brąz/Żelazo) dla pieniądza, surowców i żywności**; racje obywateli ×2/epokę; konwertery bez zmian („na razie tylko ulepszenia”); Praca/Drewno „najpierw zmierzyć”; flaga rebalansu ON na ROBOCZEJ (FALA 871); zrzut Żywności z Brązu miał rebalans ON.
**Praca/ulepszenia:** kopalnie rudy (miedź, cyna, żelazo) koszt_praca ×2 (22→44) i koszt ulepszeń wg epoki WŁAŚCICIELA (Brąz/Żelazo droższe), parametr `kosztUlepszenWgEpokiWlasciciela` (temat IMPCOST, w toku); po FC deploy + pomiar 150 tur.
**Żywność/Spichlerz:** nadwyżka ponad cap przepada dziś; decyzja: możliwość zamiany na pieniądze jak Praca (WDROŻONE FALA 876, kurs 1:1 do potwierdzenia). Drenaż Spichlerza w HUD netto (FALA 867).
**Skarbiec w Brązie:** decyzja „2× Brąz, 4× Żelazo” — okazało się, że pieniądz/surowce utrzymania już tak działały (FOODGRANARY mylił się w tym punkcie). OTWARTE PYTANIE: czy dodatkowa korekta kosztów jednostek w Brązie (lekka optymalizacja) — ABC.
**Mennica/glina:** Mennica wymaga złota (decyzja wcześniejsza), ale delta 0 ze złotem = błąd zaokrąglenia (naprawa w toku, MENNICACLAY r2); glina dzielona proporcjonalnie między Cegielnię/Garncarnię.
**Testy/dług:** baza surowców z danych (A), Mennica wymaga złota (A), lama tylko Inkowie (A), stadnina tylko na złożu bez lasu (B, FALA 874), garnizon: nowe scenariusze zamiast starych asercji (A).
**Dyplomacja/wojna:** limit wojen liczy gracza jako cel (A, za flagą OFF, FALA 863); dopłata D w sojuszach AI↔AI = osobny parametr (A; wartość rekomendowana 0,5, właściciel chce pełniejszy pomiar seed 4242/7 t60); limit 2 sojuszy (FALA 865, za flagą OFF); plan wymuszonego pokoju z cesją miast A; pokój z cesją miast — naprawione FALA 873 (przyczyną był stary limit 1 miasta); era wojna świeży pokój „bez preferencji”.
**Forty AI/terytorium:** P1 A; P2 „fort gdy może objąć swoim terenem ≥ 40 nowych heksów; najpierw miasta, forty po limicie miast”; posterunek A (~16); P3 B; P4 A; P5 C; po pomiarze forty prawie nie powstają — decyzja B: zostawić jak jest (temat zamknięty).
**NOWE 2026-11-19 (forty/miasta):** założenie miasta NIE przejmuje fortów ani ulepszeń innej cywilizacji (jak między miastami: zasięg można lekko przesunąć, nic nie znika; odwraca regułę 4+5 / Q3=A z 2026-08-09); zasięg fortu = te same reguły co zasięg miasta; zajęcie fortu TYLKO siłowe (jednostka wojskowa + wojna). Temat FORTTAKEOVER (w toku).
**NOWE 2026-11-19 (ustawienie „Dyplomacja i wojna”):** nowe ustawienie nowej gry, poziomy ŁATWA / NORMALNA / TRUDNA. Łatwa = dziś (kary ×1, bonusy ×1); Normalna = kary ×2 (zwłaszcza sąsiedztwo i wojna) i bonusy ÷2 za wszystkie czynności dodatnie; Trudna = współczynniki ujemne ×3 „dla wszystkiego co się da” i bonusy ÷3 (m.in. sojusze). Prośba: lista parametrów ujemnych i dodatnich dla każdego poziomu (temat WARTEMPER, analiza w toku). Implementacja dopiero po akceptacji listy (ABC).
**Błędy/UX zgłoszone i naprawione:** nakładanie muzyki powitanie→audiencja (FALA 869); ekran powitalny pełne Plusy/Minusy (870); HUD alert/tooltip niedoboru (861), karta surowca (862), HUD netto Spichlerz (867); ucieczka Harappy — autobitwa zgodna (testy w main), tryb ręczny/odwrót na mapie/animacja NIE ZMIERZONE (czekam na scenariusz właściciela).

## TRWAJĄCE WORKFLOWY (stan 2026-11-19 ~22:30 UTC)

| Temat | Model etapu | Uwagi |
|---|---|---|
| IMPCOST — koszt ulepszeń wg epoki właściciela + kopalnie rudy ×2 (wf_6ea5ebea-20b) | Evaluator SONNET | po FC deploy jako kolejna FALA + pomiar 150 tur |
| MENNICACLAY r2 — Mennica (zaokrąglenie podziału Handlu) + HUD gliny (wf_a13e0d64-f24) | Operator HAIKU | r1 FC FAIL; baza c2342a78e |
| WARTEMPER — lista parametrów kar/bonusów dla Łatwa/Normalna/Trudna (wf_d888bb67-4c5) | Operator HAIKU | analiza; po FC → ABC właścicielowi |
| FORTTAKEOVER — miasto nie przejmuje fortów; zasięg fortu jak miasta; zajęcie tylko siłą (wf_67a822a6-aa1) | Operator HAIKU | po FC deploy jako kolejna FALA |

## GOTOWE DO STARTU (KOLEJNOŚĆ OBOWIĄZUJĄCA od 2026-11-19 ~23:00 UTC; start gdy aktywnych < 4 i dysk ≥ 6 GB; dispatch (00-dispatch + DODATEK) JUŻ zapisany dla każdej pozycji, skrypt WEB-<TAG>.js wygenerowany mkwf.sh; `cand` = SHA origin/main)

1. **R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1** (tag ERAWARPLAYER; zadanie #52) — gracz celem wszystkich wojen epoki + narzędzie pomiarowe + bieg 120 tur + progi testów 40.
2. **R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1** (tag DIPLOWARLEVEL; #53) — ustawienie nowej gry „Dyplomacja i wojna” Łatwa/Normalna/Trudna.
3. **R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1** (tag ENABLEFLAGS; #54) — włączenie 6 flag dyplomacji + pomiar 90 tur seed 4242/7.
4. **R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1** (tag UPKEEPPACE; #50) — START dopiero po FC i integracji UPKEEPMULT i RECRUITMULT.
5. **R-WEB-TEST-DEBT-Q12** (#37) — pozostałe czerwone testy (auto-fort-claim 66/2 droga, D10 plUpkeepForm, entity-card-cross-links, fishing-boats-666, hodowla-las, diplo-forced-peace-live-paths) — dispatch DO NAPISANIA przy starcie (Haiku, bez ABC).
6. **R-WEB-VERIFY-LIVE** (#38) — weryfikacja na żywo: pokój z cesją miast (873), limit 2 sojuszy (865, po ENABLEFLAGS), reguła wojen z graczem (863), żywa zamiana Żywności→Podatek (876), bieg dymny po zmianach kosztów, pomiar 150 tur rebalans — dispatch DO NAPISANIA przy starcie (Haiku).
7. **TREASURY refresh** (#39) — odświeżyć treasury-unit-cost-model.cjs + dokument SKARBIEC po wdrożeniu kosztów jednostek — dispatch DO NAPISANIA (Haiku, dokumentacja).

W TOKU (nie startować drugi raz): ERAWARPLAYER r3 Sonnet (wf_d7c71990-f52), CHROMEHELPER (wf_d707750c-c8b), VERIFYLIVEA (wf_d03f1b16-5b4). WDROŻONE: ENABLEFLAGS jako FALA 888. NASTĘPNE: VERIFY-LIVE-B (pełny pomiar flag dyplomacji OFF/ON seed 4242/7 z runnerem wznawialnym ai-economy/diplomacy-harder, poziomy Dyplomacji i wojny × 3 (sojusze AI↔AI na Trudnej), wojny epoki (po ERAWARPLAYER), żywe testy zapisu) — dispatch DO NAPISANIA po ERAWARPLAYER.
WDROŻONE 2026-11-19/20: FALE 860–888 (ostatnia 881 = wojna epoki bez partnera; ROBOCZA MD5 f20a283a).
PÓŹNIEJ (NIE startować): koszty badań i budynków (sekcja PÓŹNIEJ niżej).

## ZALEŻNE (START dopiero po warunku)

- **R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1** (decyzja właściciela ABC A: „Koszty jednostek” Niski/Normalny/Wysoki ×1/×2/×4 mnoży też utrzymanie Pieniądz+surowce+żywność; w domyślnej grze ×2) — START po FC i integracji UPKEEPMULT oraz RECRUITMULT (te same pliki).
- **R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1** (decyzja właściciela C, dispatch zapisany) — START po FC i integracji FORTPLACE (te same pliki territory/fort).
- **Implementacja ustawienia „Dyplomacja i wojna”** (UI w newGameFlow.ts, mnożniki kar/bonusów, zapis/wczytanie, domyślnie ŁATWA) — dopiero po FC WARTEMPER i akceptacji listy przez właściciela (ABC: osobny wybór niezależny od głównej trudności; czy bonusy ÷ dotyczą też gracza i AI↔AI; wartości liczbowe).
- **Pomiar 150 tur po IMPCOST** (seed 4242/7, rebalans ON) po wdrożeniu FALI z IMPCOST.
- (ZAMKNIĘTE 2026-11-19: właściciel zdecydował o włączeniu 6 flag dyplomacji — temat R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1.)
- **Dopłata D sojuszy AI↔AI (0,5?)** — dopiero po pełniejszym pomiarze seed 4242/7 t60 i decyzji.

## PÓŹNIEJ (polecenie właściciela 2026-11-19; NIE startować teraz)

- Analiza i balans KOSZTÓW BADAŃ oraz KOSZTÓW BUDYNKÓW (po przetestowaniu przez właściciela zmian ulepszeń i kosztów jednostek). PRIORYTET OBECNY: wdrożyć na ROBOCZĄ zmiany kosztów jednostek (UPKEEPMULT → RECRUITMULT → UPKEEPPACE), żeby właściciel mógł testować balans.

## CZEKA NA RANO / ODPOWIEDŹ WŁAŚCICIELA (ABC do zadania, gdy właściciel wraca)

1. Skarbiec w Brązie: czy dodatkowa korekta kosztów jednostek (A +10%/B +20%/C +30% lub bez zmian), po ustaleniu, że pieniądz/surowce już skalują ×1/×2/×4.
2. Kurs zamiany Żywności na Podatek (dziś 1:1) i ewentualne zabezpieczenie zapasu na utrzymanie wojska.
3. Spadek żywności jednostek w epokach 4–5 (108/324 → 16) po FALI 875 — akceptacja lub korekta mnożnika.
4. Ucieczka Harappy: scenariusz (bitwa 3D vs odwrót na mapie, tryb ręczny vs automatyczny).
5. Lista „Dyplomacja i wojna” (po WARTEMPER): nazwy poziomów OK, wartości liczbowe, zakres (gracz/AI↔AI/państwa-miasta).
6. Stare pozycje z 2026-11-15/18 (gęstość listy wojsk 640 px, plakietka „+X”, Palisada→Mury, stała C AI→gracz) — status po FALI 746 nie ustalony.

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


## AKTUALIZACJA 2026-11-20 ~02:00 UTC
FALA 889 WDROŻONA (ERAWARPLAYER; ROBOCZA MD5 b69800bb, main 7cf570839). W TOKU: VERIFYLIVEA, TESTDEBTQ13. NASTĘPNE: VERIFY-LIVE-B (dispatch po scaleniu VERIFYLIVEA). OTWARTE ABC: pending Brązu blokowany sojuszami (pairing-unresolved) — czy sojusz ma blokować wojnę epoki.

VERIFYLIVEB zintegrowany do main aba2ddd02 (testy live ustawien, bez deployu). NASTĘPNE po VERIFYLIVEA: VERIFYLIVEB-2 (hak civTest dla applyMenuParams + rekrutacja/utrzymanie/zamiana żywności/koszt budowy; przebieg przez kreator), potem VERIFY-LIVE-B pomiar flag OFF/ON + 3 poziomy dyplomacji.

VERIFYLIVEA zintegrowany do main d42ec8560 (bez deployu). W TOKU 2026-11-20 ~02:50: TESTDEBTQ13, VERIFYLIVEB2 (hak __settingsLive + kreator na żywo). NASTĘPNE: pomiar flag OFF/ON + 3 poziomy dyplomacji (VERIFY-LIVE-B pomiar), licznik rozwiązań jednostek + seed 7 pomiaru kosztów jednostek (osobny temat z hakiem).

VERIFYLIVEB2 zintegrowany do main 2ae9a3b87 (hak __settingsLive; bez deployu). W TOKU 2026-11-20 ~03:20: TESTDEBTQ13 r3, DIPLOMEASURE (runner wznawialny + flagi OFF/ON). NASTĘPNE (po DIPLOMEASURE, ten sam plik runnera): pomiar 3 poziomów „Dyplomacja i wojna” przez __settingsLive.startNewGame (90 tur × 2 ziarna). STONE-ERA-ENTRY-40: zamknięty bez skutku.

## STAN KOŃCOWY SESJI 2026-11-20 ~10:25 UTC (zamknięcie na polecenie właściciela — limit zużycia; nie startować nowych tematów)
- origin/main = c11f21980 (ostatnia FALA ROBOCZA = 889; FALE od 875 do 889 wdrożone; wszystko po 889 zintegrowane do main BEZ deployu: VERIFYLIVEA/A2/B/B2, TESTDEBTQ13 r5, DIPLOMEASURE, POLARZERO — hooki ?civTest=1, testy, dokumenty).
- JEDYNY TRWAJĄCY: DIPLOLEVELS (R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1; wf_0b9402f1-4e5; Obrona Haiku, ~3 h; Operator 8413b4c12 + Evaluator 1f26e88ec zapisane jako DIPLOLEVELS-wip/op i DIPLOLEVELS-wip/eval; w commicie Operatora tylko 1 z 6 biegów: seed4242-all1-lvl-latwa). Wznowienie po restarcie: Workflow({scriptPath: scratchpad/WEB-DIPLOLEVELS.js, resumeFromRunId: "wf_0b9402f1-4e5", args: {"id":"R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1","tag":"DIPLOLEVELS","mode":"full","branch":"claude/sprawdzenie-funkcjonalnosci-ek4ra0","cand":"83da0fb183bf2c2f21ece413b7080cc60e862043","round":1}}); jeśli skrypt zaginął — dispatch jest w runs/R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1/. Po FC: refs/keep, merge-tree, integracja bez deployu (dep3 z testami diplomacy-harder-measure-hook-test, diplomacy-measure-resume-test).
- CZEKA NA ODPOWIEDŹ WŁAŚCICIELA (ABC): (1) POLARY na mapach Kontynenty: A1 przywrócić w generatorze (rek.), A2 zmienić asercję climate-band-test, C zostawić czerwony; (2) Konnica 49 (wiki) czy 98 (units.json) — blokuje hud-moc-warstwa-test:168, moc-ranking-rozjazd-test:145, mur-paradoks-test; (3) czy garnizon min. 1 liczy się jako „wręcz” w składzie armii AI; (4) otwarcie R-WEB-TEST-DEBT-Q14 (87 czerwonych: D50/E26/B10); (5) czy −28…−37% jednostek AI przy domyślnym „Koszty jednostek” Normalny ×2 jest zamierzone (rekrutacja, nie rozpad) czy łagodniejszy mnożnik dla AI; (6) czy sojusz ma blokować wojnę epoki w parowaniu (pending Brązu stał 68 tur w seed 4242, 24× pairing-unresolved); (7) dopłata D sojuszy AI↔AI (rek. 0,5; dziś 1.0), tor NAP AI↔AI (0 w pomiarze).
- PÓŹNIEJ (polecenie właściciela, NIE teraz): koszty badań i budynków.
- NIE ZMIERZONO (zbiorczo): równoważność wznowionego biegu save/load; liczba miast AI i zerwania traktatów poza zerowym zaufaniem; powód mniejszej rekrutacji przy Normalny ×2; tura AI i zamiana Żywność→Podatek z Targowiskiem w żywej grze; wczytanie aktywnej gry po reloadzie (SIGSEGV Chromium).

AKTUALIZACJA KOŃCOWA 2026-11-20 ~11:45 UTC: DIPLOLEVELS ZAKOŃCZONY i zintegrowany do main (bez deployu) — NIE MA już trwających workflowów. Sekcja STAN KOŃCOWY wyżej: pozycja „JEDYNY TRWAJĄCY: DIPLOLEVELS” jest NIEAKTUALNA. Zostają wyłącznie pytania ABC do właściciela (lista wyżej) oraz tematy PÓŹNIEJ. Nowe tematy startować dopiero po odpowiedziach właściciela.

## DZIENNIK DECYZJI WŁAŚCICIELA 2026-11-22 (zapis, NIC NIE STARTOWANE — właściciel: „na razie nie zaczynam żadnych nowych rzeczy”)

1. Polar na mapach „Kontynenty”: **A1** — przywrócić pas polarny w generatorze (werdykt POLARZERO: 40a29e4c6 go zabrał). Ryzyko: hashe map/testy determinizmu. Deploy ROBOCZA jako kolejna FALA (890+).
2. Konnica fieldPower: **98 jak w units.json**; poprawić wiki (49→98) i piny (hud-moc-warstwa-test:168, moc-ranking-rozjazd-test:145, mur-paradoks-test).
3. Garnizon min. 1 w mieście AI: **nie liczy się jako „wręcz”** w pomiarze składu armii (ai-army-composition-per-civ).
4. −28…−37% jednostek AI przy „Koszty jednostek: Normalny ×2”: **zostaje bez zmian**.
5. Sojusz a wojna epoki: **sojusz NIE blokuje wojny epoki**. Parowanie ma dobierać innych graczy AI do skutku, aż wszystkie pary będą dobrane (nie każdy ma sojusz ze wszystkimi); gdy par brak — wojny po trzech (ustalone wcześniej). Poprawka silnika (pending Brązu seed 4242 stał 68 tur). Deploy ROBOCZA.
6. Dopłata D sojuszy AI↔AI: **0,5** (dziś 1,0). Deploy ROBOCZA.
7. R-WEB-TEST-DEBT-Q14 (87 czerwonych testów): **otworzyć po decyzjach 1–3**. Start dopiero na polecenie właściciela.

Zadania #66–#71 zaktualizowane. Kolejność po poleceniu „startuj”: Q14 (testy z decyzji 2–3) oraz tematy gry 1, 5, 6 jako osobne ID z Operatorem Haiku.

Uzupełnienie 2026-11-22 (druga seria ABC):
8. Poziomy „Dyplomacja i wojna” (tabela POMIAR-POZIOMY-DYPLOMACJI-2026-11-20.md): **korekta wartości** — właściciel poda, który poziom i co zmienić; do tego czasu bez implementacji.
9. Tor NAP AI↔AI (pomiar dał 0): **zostawić jak jest**.
10. Stare pozycje UI z 2026-11-15/18 (lista wojsk 640 px, plakietka „+X”, Palisada→Mury, stała C AI→gracz): **uznane za zamknięte**.
11. Pytania o wyścig o terytorium (P1–P5), drenaż Spichlerza i garnizon AI (sufit rezerwy, homeDefenderPool) były już rozstrzygnięte i wdrożone wcześniej (forty: decyzja B; Spichlerz: ABC A, FALA 867; garnizon: FALA 857) — wpisy w taskach usunięte jako nieaktualne.

FALA 890 WDROŻONA (2026-11-22): AI bez utrzymania jednostek w turach 1–40 (ROBOCZA MD5 668f6110, main aa96cfc61). NASTĘPNE po poleceniu właściciela: polar A1 → Q14 (z Konnicą 98 i garnizonem) → parowanie wojen epoki → dopłata D 0,5. NIE ZMIERZONO skutku na żywo (Wysoki ×4); do weryfikacji w grze przez właściciela.
