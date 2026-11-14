# R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1 — raport obrony Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1
GOAL: Potwierdzić na żywej grze (Chromium, bundle vite poza repo, `?playtest=mapa&civTest=1`), że okno „Umowa wymiany surowców” z AI nie przebudowuje węzłów DOM przy dodaniu pozycji po obu stronach, że obie strony są wypełnialne przed jednym „Zaproponuj”, że neutralna podpowiedź pojawia się przy pustej stronie (obie strony symetrycznie) oraz zebrać zrzuty przed/po.
BAZA: kandydat 638e4c61d (zawiera 75e238e52 i ddc0d8dda — oba są przodkami, sprawdzone `git merge-base --is-ancestor`). Ta runda: commit obrony na 638e4c61d.
ZMIANY-COMMIT: patrz sekcja „Odpowiedzi na zarzuty” (commit SHA na końcu raportu). Dotknięte pliki: `gra/tools/live-verify-wave-689-697-a2-trade.cjs`, `runs/…/trade-live-pre.json`, `runs/…/trade-live-mut.json`, `runs/…/shots-pre/03,04`, `runs/…/shots-mut/03,04`, ten raport. Brak zmian w `gra/src`, `gra/data`, `WERSJE.md`.

## Odpowiedzi na zarzuty Evaluatora (21506092b)

| Zarzut | Decyzja | Dowód |
|---|---|---|
| 1. P3c słaby: ten sam surowiec (Drewno) po obu stronach | PRZYJMUJĘ — poprawka + commit | `addResource('recv', giveRes.resId)` wybiera inny surowiec niż oferowany. W `trade-live-pre.json`: `audLabels.give = "Drewno"`, `audLabels.recv = "Glina"`, `found = [true, true]`. Surowiec po stronie „oferują” jest już różny, więc samo `includes` rozróżnia obie strony. |
| 2a. P4 tylko dla pustej strony „oferują”, brak symetrii | PRZYJMUJĘ — nowy check `P4-give-empty` | Po P3 okno ponownie otwarte; `reopenedRows = {give: 0, receive: 0}` (stan czysty). Dodana tylko strona „oferują”; `hintGiveEmpty = "Dodaj, co oddasz w zamian — albo wyślij jako dar"` (PASS). Lustrzany `hintAfterGive = "Dodaj, co chcesz dostać w zamian — albo wyślij jako dar"` (PASS, P4). |
| 2b. Brak mutacji dla P3 i P4 | ODRZUCAM (z uzasadnieniem) | Dispatch: „dowód mutacyjny jeśli możliwy (np. … cofnięcie poprawki FALI 692)”. Poprawka FALI 692 to `morphBasketMarkup` (`basketMorphChildren` → `box.innerHTML`). Dotyczy wyłącznie zachowania węzłów (P2). Mutacja P3 (przycisk „Zaproponuj”) albo P4 (podpowiedź) testowałaby inną ścieżkę kodu, niezwiązaną z FALĄ 692, więc nie dowodziłaby poprawki. Mutacja tej poprawki jest wykonana i daje FAIL w P2 (sekcja Testy). |
| 3. P5 zapisane na sztywno jako PASS; absolutne ścieżki w JSON | PRZYJMUJĘ — poprawka + commit | P5 sprawdza teraz istnienie i niezerowy rozmiar czterech plików (`bytes: [309921, 293530, 342738, 441584]` w pre). Usunięte twierdzenie „obejrzane w sesji” z runnera. `res.dist` = `path.basename(DIST)`, ścieżka zrzutów względna (`../dyspozycje/…/shots-pre`). `grep -l '/home/\|/tmp/'` na obu JSON: brak trafień. |
| 4. „Brak migotania” mierzone tylko identycznością węzłów | ODRZUCAM | Dispatch, GOAL pkt 2 dosłownie: „identyczność węzła `===` przed/po; brak migotania = brak zastąpienia węzła”. Runner mierzy właśnie to. Analiza klatek nie była wymagana. Ograniczenie zostaje odnotowane w raporcie jako niezmierzone wizualnie (patrz Uwagi). |
| 5. Dispatch nieobecny na origin/main | PRZYJMUJĘ jako obserwację (nie naprawiam) | `git show origin/main:…/00-dispatch.md` → „path does not exist in origin/main”. Plik istnieje na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (ls-tree potwierdza). Rozbieżność bazy 75e238e52 vs ddc0d8dda nie ma skutku: oba są przodkami kandydata. |
| 6. Martwa funkcja `itemsStr`; `submitDisabledWhenOnlyGive=false` | PRZYJMUJĘ część (usunięcie) / ODRZUCAM część (zarzut do kodu gry) | `itemsStr` usunięta (martwy kod). `submitDisabledWhenOnlyGive=false` to zmierzony fakt, nie błąd: P3 wymaga aktywnego „Zaproponuj” gdy obie strony są niepuste, a podpowiedź „…albo wyślij jako dar” sugeruje, że jednostronna oferta (dar) jest celowa. Decyzja, czy dar ma być dozwolony, należy do właściciela, nie do tego tematu. |

## Punkty dispatchu (wynik rundy 2)

| Punkt | Wynik | Dowód |
|---|---|---|
| 1. Otwarcie okna z AI (akcja 14) | PASS | `checks` P1; overlay `.civ-diplo-basket-overlay` otwarty |
| 2a. Węzły przeżywają dodanie po „oferujemy” | PASS | `checks` P2a: box, `.cdb-body-scroll`, `.cdb-col` strony B — `===` przed/po; expando obecny |
| 2b. Węzły przeżywają dodanie po „oferują” | PASS | `checks` P2b: `===` przed/po (w tej rundzie wykonane jako drugie dodanie, po P2a) |
| 3a. Obie strony niepuste → „Zaproponuj” aktywny | PASS | `submitDisabled = false` |
| 3b. Jeden klik = jedna propozycja | PASS | `tableBefore = 0`, `tableAfter = 1`; `ownRemove = 2`; toast „Propozycja na stole — użyj Przyjmij w Punkty wymiany” |
| 3c. Propozycja zawiera obie strony | PASS | `audLabels`: give „Drewno”, recv „Glina”, oba znalezione w `.civ-diplo-aud` (różne surowce) |
| 4. Neutralna podpowiedź przy pustej stronie (obie strony symetrycznie) | PASS | `hintAfterGive` (recv pusta) i `hintGiveEmpty` (give pusta); brak frazy „ryzyko odrzucenia” w `.cdb-neutral-hint` |
| 5. Zrzuty przed/po, obejrzane | PASS | `shots-pre/01..04`, `shots-mut/01..04` (deviceScaleFactor 1, 1600×1000). Operator obejrzał 01–04; w tej rundzie ponownie obejrzano 01 i 03 (opis niżej) |

Uwaga do zakresu P4: podpowiedź `.cdb-neutral-hint` pojawia się tylko, gdy DOKŁADNIE jedna strona jest pusta (kod: `oneSideEmpty` = XOR). Przy obu pustych stronach `bothEmptyHint = null` (zapisane w JSON, bez PASS/FAIL).

## Testy (surowe wyniki tej rundy)

- Build kandydata `vite build --outDir <scratchpad>/dist-trade-w` → `✓ built in 18.72s` (poza repo).
- Build mutanta (`box.innerHTML = inner` w `morphBasketMarkup`, kopia w scratchpad) → `✓ built in 16.91s`.
- Runner `--tag pre` → `RESULT tag=pre: checks=11 FAIL=0 pageErrors=0`; `{"P1":PASS,"P2":PASS,"P3":PASS,"P4":PASS,"P5":PASS}`.
- Runner `--tag mut` → `RESULT tag=mut: checks=11 FAIL=2 pageErrors=0`; `{"P1":PASS,"P2":FAIL,"P3":PASS,"P4":PASS,"P5":PASS}`. FAIL: `P2a` (`scroll:false, colB:false, expando:false`) i `P2b`. Mutacja wykrywa zastąpienie węzłów.
- `git diff --check` → czysty.
- `gra/src` i `gra/data` nie zmienione względem 638e4c61d (`git diff --stat` puste). Testy jednostkowe (tsc, logic, trade-dialog-no-rerender) NIE były uruchamiane w tej rundzie, bo kod gry się nie zmienił; wynik 19/19 z rundy 1 pochodzi z raportu Operatora i Evaluatora.
- `node_modules` w `gra/` zainstalowane przez `npm ci --ignore-scripts` (ignorowane przez .gitignore); nie commitowane.

## Zrzuty (ponowny przegląd tej rundy)

- 01 (`shots-pre/01-okno-otwarte-puste.png`): obie strony puste („—”), „Zaproponuj” nieaktywny. Pod przyciskami widać czerwony tekst „Dodaj co najmniej jedną pozycję w „Co oddajesz” lub „Co dostajesz””. Ten tekst nie jest w `.cdb-neutral-hint`, a runner go nie mierzy. Jego źródła w `gra/src` nie znalazłem grepem tej frazy, więc nie twierdzę, skąd pochodzi.
- 03 (`shots-pre/03-po-dodaniu-oferuja-przed-zaproponuj.png`): po obu stronach po „20” (Drewno i Glina), „Zaproponuj” aktywny. W panelu punktów: „Oddajesz mniej niż fair min — partner może odrzucić (W4-A)” i „Szczegóły: poniżej progu — ryzyko odrzucenia przez partnera”. To ostrzeżenia wyceny, nie część tego tematu; nie są w sprzeczności z P4, bo P4 dotyczy stanu z pustą stroną.

## BLOKADY

Brak blokad technicznych. Odstępstwa od dispatchu:
- Mutacja P3/P4 nie wykonana — uzasadnienie w tabeli zarzutów (pkt 2b).
- Wizualny brak migotania nie zmierzony (tylko identyczność węzłów, jak zapisano w dispatchu).

## UWAGI-DLA-ORKIESTRATORA

1. Poza zakresem: propozycja „20 Drewno za 20 Drewno” z poprzedniej rundy zostaje wysłana mimo ostrzeżenia o fair min; w audiencji „Przyjmij” jest wyłączony z powodem „Oferta nieuczciwa dla partnera”. Czy to zamierzone, decyduje właściciel (zgłoszenie do rejestru, nie do tego tematu).
2. Dispatch (00-dispatch.md) jest tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na origin/main — do uporządkowania przez orkiestratora.
3. Kandydat 638e4c61d jest w tej gałęzi z commitami obrony; orkiestrator decyduje o integracji (Operator nie integruje).
4. Tekst „Dodaj co najmniej jedną pozycję…” z zrzutu 01 nie jest mierzony przez runner i nie zlokalizowałem jego źródła w `gra/src` — do ewentualnego doprecyzowania w osobnym temacie, jeśli właściciel chce tę podpowiedź w testach.

## RUNDY

2/5 (runda obrony po Evaluatorze r1). Zarzuty przyjęte: 1, 2a, 3, 5 (obserwacja), 6 (usunięcie `itemsStr`). Odrzucone z dowodem: 2b, 4, 6 (zarzut do kodu gry).

## NASTĘPNY KROK

Evaluator (SONNET): ponowna weryfikacja commitu obrony (runner, JSON, zrzuty pre/mut). Potem Final Control.

## DEPLOY/PUSH

NIE WYKONANO (Operator nie pushuje ani nie integruje).
