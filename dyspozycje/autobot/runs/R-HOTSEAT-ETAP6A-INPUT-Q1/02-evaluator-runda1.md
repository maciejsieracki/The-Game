# R-HOTSEAT-ETAP6A-INPUT-Q1 — Evaluator runda 1

**Model+effort:** sonnet-5, effort high (pełna niezależna weryfikacja: grep/Read per klaster,
własne uruchomienie tsc + 5 bramek referencyjnych + własny live-run bramki no-op).

## Metoda

Świeży `git log`/`git diff --stat` vs `merge-base HEAD origin/main`, `Read`/`grep -n`
każdego z 42 miejsc A-H osobno (nie zbiorczy grep), `Read` obu funkcji D
(`executePlannedMarchesEndTurn`/`applyMarchSegmentInstant`) i pełnego ciała
`endActiveHumanTurn`/`renderLoop` dla F1-F10, własny `tsc --noEmit`, własne uruchomienie
5 bramek referencyjnych + `scout-explore-deselect-cycle-test`/`army-merge-separate-return-
mainguard-test`, własny pełny live-run `hotseat-etap6a-input-noop-test.cjs` (nie tylko
odczyt logu Operatora — osobny proces w tle, obserwowany turami do końca), własna
weryfikacja obu blokad (1)/(3) niezależnym pomiarem odległości marker/call w
`barb-camp-destruction-test.cjs` na HEAD i na bazie.

## Wynik

Wszystkie 42 miejsca A-H potwierdzone zmigrowane pod cytowanymi liniami (zero
`ownerId\s*(===|!==)\s*0` w ich zakresie; ok. 230 pozostałych trafień w main.ts to
kategorie b/c/d, poza zakresem — zgodne z tabelą wykluczeń recon §2). `isMe(ownerId)`
(main.ts:10390) poprawny alias `ownerId === ME()`. D1-D3/F1-F5 faktycznie używają
parametru `humanOwnerId` (nie `ME()`) — potwierdzone `Read` sygnatur i ciał funkcji.
F6-F10 (`renderLoop`, main.ts ok. 33710-33765) używają `isMe()`/`ME()`, nie
`humanOwnerId` — to ODSTĘPSTWO od litery dispatchu pkt 4 ("WSZYSTKICH 13 pozycjach"),
ALE w pełni ujawnione i uzasadnione w `01-operator-runda1.md` (sekcja „Decyzja rundy")
z poprawnym argumentem architektonicznym: `renderLoop()` nie jest wołane z wnętrza
konkretnego `endActiveHumanTurn(humanOwnerId)`, nie ma strukturalnego dostępu do tego
parametru; zgodne też z oryginalną tabelą Podmiana z recon §1. Weryfikacja własna
potwierdza ten sam wniosek — nie liczę tego jako zarzut.

`army-cycle.ts` A3: parametr `isMe` z bezpiecznym defaultem, wywołanie w main.ts poprawne.
Komentarze D3/F3 zaktualizowane. `tsc --noEmit`: 0 błędów (własne uruchomienie). 5 bramek
referencyjnych własnym uruchomieniem: 213/213, 19/19, 33/33, 13/13, 6/6 — zgodne.
`scout-explore-deselect-cycle-test`/`army-merge-separate-return-mainguard-test`: 34/34,
73/73 zielone. `git diff --stat`/`--check` vs merge-base: dokładnie 4 pliki z allowlisty,
zero stray-edits, zero błędów whitespace.

**Bramka no-op — własny pełny live-run (nie tylko log Operatora):** uruchomiłem
`hotseat-etap6a-input-noop-test.cjs` od zera we własnym procesie, obserwowałem live
wszystkie 60 tur (3×20). Wynik własny: `PASS (20/20 identycznych PRZED/PO, jsExcPRZED=0,
jsExcPO=0, nietautologiczność=OK)`, `EXIT:0`. PO/PRZED identyczne hash-po-hash (w tym w
punktach przyrostu jednostek 11→13→15→16→19→20). ZEPSUTY rozbiega się dokładnie od tury 4
— identycznie jak deklaruje Operator.

Blokada (1) `mgla-odkrycie-wzdluz-sciezki-test.cjs`: potwierdzona niezależnie — 2 nowe FAIL
to hardkodowany stary literał w regexie testu (main.ts:188/202), plik poza allowlistą.
Blokada (3) `barb-camp-destruction-test.cjs`: potwierdzona pre-istniejąca — zmierzyłem
odległość marker→call na HEAD i na bazie `origin/main` niezależnie dla obu FAIL-ujących
asercji (2109/2098 vs window 1600; 1910/1821 vs window 900) — oba przekraczają okno na
OBU wersjach, nie tylko po tej rundzie. Blokada (2) `plannedMarchesSize=0`: potwierdzona —
klaster D zweryfikowany wyłącznie strukturalnie (Read sygnatur), nie żywo w 60-turowym
biegu; akceptowalne na tę rundę (kod trywialny, chroniony przez tsc).

## ZARZUTY: brak

Żadne z niespełnień nie zostało znalezione — wszystkie deklaracje Operatora
zweryfikowane jako dokładne, w tym jedno miejsce (F6-F10) gdzie deklaracja odbiega od
litery dispatchu, ale odstępstwo jest ujawnione, uzasadnione i — po niezależnej analizie
architektonicznej — poprawne.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6A-INPUT-Q1
GOAL: Migracja 42 miejsc kategorii "input" main.ts z ownerId===0/!==0 na isMe(ownerId)/!isMe(ownerId)/ME(), klaster D+F na realny parametr humanOwnerId, bramka dowodu no-op.
TESTY: Niezależnie potwierdzone: tsc --noEmit 0 błędów; 5 bramek referencyjnych 213/213, 19/19, 33/33, 13/13, 6/6; scout-explore-deselect-cycle-test 34/34, army-merge-separate-return-mainguard-test 73/73; własny pełny live-run hotseat-etap6a-input-noop-test.cjs (60 tur, 3 warianty) → PASS (20/20 PRZED=PO, nietautologiczność OK, rozbieżność ZEPSUTY od tury 4); git diff --stat/--check vs merge-base zgodny z allowlistą, zero stray-edits.
BLOKADY: (1) mgla-odkrycie-wzdluz-sciezki-test.cjs 2 nowe FAIL — potwierdzone, poza allowlistą, wymaga osobnej rundy aktualizującej regex testu (nie blokuje tego PASS). (2) plannedMarchesSize=0 w całym biegu bramki no-op — klaster D zweryfikowany tylko strukturalnie, nie żywo; akceptowalne na tę rundę. (3) barb-camp-destruction-test.cjs 2 FAIL — potwierdzone pre-istniejące niezależnym pomiarem na HEAD i bazie.
RUNDY: 1/5
ZARZUTY: brak
NASTĘPNY KROK: Final Control; blokady (1)-(2) do rejestru jako follow-up (nie wymagają naprawy w tym temacie/rundzie).
DEPLOY/PUSH: NIE WYKONANO
