# Evaluator — runda 1/5 — R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1

## Metodologia weryfikacji (samodzielna, w `/home/user/wt-ulepszenia-farma-irygacja-bydlo`)

1. `git diff origin/main..HEAD --stat` pokazał pozornie ogromny, wielotematyczny diff
   (60 plików, w tym `main.ts`, `hud.ts`, `diplomacy-*.ts`, kilkanaście folderów
   `dyspozycje/autobot/runs/` innych tematów) — **zweryfikowano przyczynę**:
   `origin/main` odjechał o 13 commitów od punktu bazowego tego tematu (`3f7c68e3`,
   deklarowanego w dispatchu jako baza izolacji), gałąź tematu go NIE zawiera (`git
   merge-base --is-ancestor origin/main HEAD` → NO). To nie jest wina operatora — to
   naturalny skutek pracy równoległych tematów na `main` po forku worktree. Właściwy
   diff do oceny allowlisty to `git diff 3f7c68e3..HEAD --stat`, który daje dokładnie
   7 plików: `improvement-build.ts`, `map-improvement-qualify-test.cjs`, kanon, oraz
   4 pliki własne raportu/dowodów tematu. **Zgodne z allowlistą, brak dotknięcia
   `gra/`-plików spoza tematu.**
2. `git diff 3f7c68e3..HEAD --check` → czyste (brak whitespace errors).
3. Przeczytany pełny diff `improvement-build.ts` — zmiana dotyczy WYŁĄCZNIE dwóch
   gałęzi `switch` w `canAddFoodLayer()` (`irygacja`, `bydlo`); gałąź `farma` i cała
   reszta pliku (w tym `qualifies()`, `isRiverAdjacent()`, `depositAllowsPlayerImprovement`,
   `hasBlockingDepositForFarm`) — nietknięte, potwierdzone bezpośrednim odczytem
   otaczającego kodu (linie 780-1030), NIE tylko diffem.
4. Potwierdzono, że warunek rzeki dla irygacji (`isRiverAdjacent`, linia 989) i warunek
   złoża na pierwsze postawienie bydła (`isLivestockUnlockedForPlacement`, plik
   `livestock-unlock.ts`, linie 997-1013 w `improvement-build.ts`) leżą POZA
   `canAddFoodLayer()`, w niedotkniętym kodzie — żaden z nich nie został poluzowany.
5. Uruchomiono samodzielnie `node ./node_modules/typescript/bin/tsc --noEmit` w
   `gra/` → **zero błędów** (zgadza się z raportem).
6. Uruchomiono samodzielnie `node tools/map-improvement-qualify-test.cjs` →
   **133 pass, 1 fail** (`oboz lowiecki OK on laka+las`), identycznie jak w raporcie.
   Dla weryfikacji "pre-existing" uruchomiono TEN SAM test na czystym `/home/user/
   The-Game` (checkout `origin/main` @ `79362fb1`, bez zmian tego tematu) →
   **130 pass, 1 fail**, TEN SAM fail. Różnica 130→133 to dokładnie 3 nowe asercje
   dodane przez operatora. Potwierdzone: fail przedistnieje i jest niezwiązany z tematem.
7. Przeczytany diff testów — asercje odwrócone HONEST (stary zakaz → nowe dozwolenie,
   z komentarzem wyjaśniającym dlaczego), DODANE 2 nowe asercje potwierdzające że
   `irygacja+bydlo` BEZ farmy nadal zablokowane (obустronnie: `['bydlo']→irygacja` i
   `['irygacja']→bydlo`), DODANY test na prawdziwym `qualifies()` z realną rzeką
   (`0,2` w fixture) potwierdzający że trójka przechodzi cały gate, nie tylko izolowaną
   funkcję. Zero osłabienia istniejących asercji bez uzasadnienia.
8. Niezależnie PRZELICZONO sumę bonusów z `gra/data/terrain-improvements.json`
   (nie zaufano samemu opisowi): farma `{zywnosc:3,praca:3,handel:3}` + irygacja
   `{5,2,2}` + bydlo `{2,4,3}` = **10/9/8** — DOKŁADNIE zgodne z raportem. Sprawdzono
   też `applyImprovementBonus`/`applyImprovementBonuses` w `terrain-improvements.ts` —
   proste sumowanie bonusów per klucz, brak capów/interakcji, więc arytmetyka jest
   wiarygodna niezależnie od zrzutu ekranu.
9. Otworzono OBA pliki zrzutów (nie zaufano samemu opisowi tekstowemu):
   - `dowody/01-triple-build-toast.png` — realny toast **„Postawiono: bydlo · klik
     ponownie w turze = cofnij"** widoczny na dole ekranu, HUD gry, zero widocznych
     błędów. Potwierdza (a).
   - `dowody/02-triple-render-closeup.png` — widoczna tarasowa/schodkowa struktura
     terenu (spójna z modelem `pole_irygowane`) i sąsiedni zwykły zielony heks bez
     wzoru — kontrast potwierdzony. Identyfikacja OSOBNYCH ikon bydła na tym zrzucie
     jest SŁABA — nie widać jednoznacznie wyróżnionych, odrębnych ikon zwierząt,
     w przeciwieństwie do jednoznacznego tarasowego wzoru farma+irygacja. Operator
     SAM to uczciwie zastrzegł w raporcie (brak hooka do idealnego centrowania kamery,
     brak natywnego tooltipa rozbijającego warstwy) i prosił Evaluatora o osąd —
     traktuję to jako słabszy, ale nie dyskwalifikujący dowód, bo (a) i (b) dowodzą
     obecności wszystkich trzech kluczy w danych silnika (`getPlacedLayers` +
     `tileYield`) niezależnie od czytelności renderu na tym konkretnym zrzucie.
10. Kanon: diff append-only potwierdzony — dodany wiersz w tabeli Historii zmian +
    dopisek w stopce; ŻADEN istniejący wiersz/zdanie nie zostało usunięte ani
    nadpisane (tylko rozszerzone o jedno zdanie w stopce).
11. `WERSJE.md` i `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — brak zmian w tym temacie
    (diff pusty dla obu względem `3f7c68e3`) — zgodne z zakazem aktualizacji przed
    deployem.
12. `git status --porcelain` w worktree — czyste, brak porzuconych plików tymczasowych
    (`.tmp-stack-verify.cjs` itp. faktycznie nieobecne, zgodnie z deklaracją operatora).

## ZARZUTY

Brak.

(Jedyna uwaga niebędąca zarzutem: dowód wizualny (c) w `02-triple-render-closeup.png`
słabo pokazuje osobne ikony bydła — operator to uczciwie zastrzegł, a dane silnika
(`getPlacedLayers`, `tileYield`) niezależnie potwierdzają, że wszystkie trzy warstwy
faktycznie stoją i liczą się do ekonomii. Final Control może, jeśli uzna to za
konieczne, zażądać dodatkowego zrzutu z lepszym kadrowaniem — nie blokuję PASS na tej
podstawie.)

---

STATUS: PASS
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1
ZMIANY-COMMIT: `ee5b7ebf` na `autobot/R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1` —
zweryfikowany właściwy diff to `git diff 3f7c68e3..HEAD` (7 plików, allowlist-only);
`git diff origin/main..HEAD` mylący z powodu 13 commitów, o które `origin/main`
odjechał od bazy izolacji tematu — niezwiązane z pracą operatora.
TESTY: samodzielnie uruchomione — `tsc --noEmit` zielone; `map-improvement-qualify-
test.cjs` → 133 pass / 1 fail, fail potwierdzony jako pre-existing (130 pass/1 fail
na czystym `origin/main` bez zmian tematu, ten sam fail). Suma bonusów +10/+9/+8
niezależnie przeliczona z `terrain-improvements.json` — zgodna.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator → Final Control
DEPLOY/PUSH: NIE WYKONANO
