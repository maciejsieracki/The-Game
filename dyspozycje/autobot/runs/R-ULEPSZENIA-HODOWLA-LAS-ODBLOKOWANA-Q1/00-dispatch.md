# DISPATCH — R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1

TEMAT: R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1
DOMAIN: GAME
DATA: 2026-08-27

## ECHO WLASCICIELA (padla wczesniej w tej sesji, nigdy niezdispatchowana — blad orkiestratora)

Wlasciciel odpowiedzial „Tak, odwracamy — wszystkie trzy" na pytanie o cofniecie zakazu
budowy hodowli zwierzecej (owce, bydlo/Trzoda, lama) na nakladce Las — zakaz byl decyzja
z 2026-07-29 (`isLivestockImprovementBlockedOnForest`, `gra/src/map/improvement-build.ts:225-227`,
komentarz „Maciej 2026-07-29"). Decyzja ta nigdy nie trafila do rejestru ani do dispatchu —
naprawiane teraz.

## GOAL

Hodowla zwierzeca (owce, bydlo, lama) przestaje byc zakazana na heksach z nakladka Las.
Kazda z trzech kwalifikuje sie do budowy na lesie identycznie jak na terenie bez lasu, wg
wlasnych regul terenu bazowego (Wzgorza dla owiec, Laka/Rownina dla bydla, Wzgorza/Gory dla lamy) —
zakaz Las znika, reszta kwalifikacji zostaje bez zmian.

## KRYTERIA KONCA (wszystkie wymagane)

1. **Zakaz lasu usuniety dla wszystkich trzech kluczy** (`owce`, `bydlo`, `lama`) —
   `isLivestockImprovementBlockedOnForest` przestaje zwracac `true` dla nakladki Las (albo
   funkcja jest usuwana i zastapiona brakiem blokady — wybierz mniejszy, czystszy diff).
2. **Wszystkie punkty egzekwowania znalezione i naprawione** — wzoruj sie na inwentaryzacji
   z tematu obozu lowieckiego (`R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`, 7 punktow: gracz,
   automat, AI, tooltip, `galleryTerrainEligible`, migracja, commit) — zrob WLASNA inwentaryzacje
   dla hodowli, nie zakladaj ze punkty sa identyczne.
3. **`gra/data/terrain-improvements.json` zaktualizowany:** `owce.warunek` dziś zawiera
   dosłownie „nakładka Las zabroniona" — usun to zdanie, zostaw slad decyzji (nie kasuj historii,
   napisz ze zakaz zostal cofniety 2026-08-27, wzorem jak zrobiono to dla farmy w tym samym dniu).
4. **Pomiar PRZED i PO na >= 3 ziarnach:** liczba heksow z lasem, na ktorych kazda z trzech
   hodowli sie kwalifikuje — PRZED oczekiwane 0 (dzisiejszy zakaz), PO oczekiwane > 0 tam,
   gdzie teren bazowy pasuje (Wzgorza+Las dla owiec/lamy, Laka/Rownina+Las dla bydla).
5. **Dowod, ze reszta kwalifikacji terenu NIE zmienila sie:** hodowla na terenie bez lasu
   (dzisiejszy stan) dziala identycznie PRZED i PO — to jest naprawa jednego wyjatku, nie
   przeprojektowanie reguly terenu.
6. **Dowod nie-tautologiczny:** kazda nowa/zmieniona asercja czerwieni sie pod jedna celowana
   mutacje zrodla. Podaj mutacje i wynik.
7. Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
   unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
8. `map-improvement-qualify-test` (117/0 wg ostatniego stanu) bez pogorszenia — sprawdz aktualna
   liczbe na swiezym `main` przed startem i podaj ja w raporcie.
9. Bramka obozu lowieckiego (91/0) bez pogorszenia — hodowla i oboz wspoluzywaly wczesniej
   czesci logiki „nakladka zwierzeca"; upewnij sie ze zmiana hodowli nie rusza obozu.

## ALLOWLISTA (nic poza tym)

- `gra/src/map/improvement-build.ts`
- `gra/data/terrain-improvements.json`
- `gra/src/ui/**` — WYLACZNIE teksty podpowiedzi/tooltipow o warunku terenu hodowli
- `gra/tools/**` (bramka tematu + sondy)
- `dyspozycje/autobot/runs/R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1/**`

## GRANICE (naruszenie = FAIL)

- Zakaz `npm run build` / `npm run dev`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-hodowla-las-<rola> --emptyOutDir`.
- Zakaz `npx`, `git add -A`, pushu do `main`, zmian w `dyspozycje/WERSJE.md`.
- **NIE ruszaj** reguly farmy (`isFarmBaseTerrain`, `FOREST_BLOCKED_IMPROVEMENT_KEYS`) ani
  reguly obozu lowieckiego (`FOREST_DEPENDENT_IMPROVEMENT_KEYS`) — to sa zamkniete, osobne
  tematy z tego samego dnia. Twoja zmiana dotyczy WYLACZNIE hodowli.
- **UWAGA WSPOLBIEZNOSC:** rownolegle biegna cztery inne tematy, jeden z nich
  (`R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`) tez moze dotykac `improvement-build.ts`.
  Pracujesz we wlasnym worktree — to jest OK, integracja bedzie sekwencyjna.
- **Nie poszerzaj zakresu (§14).**

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora. Limit 5 rund.

**Final Control obowiazkowo:** `git fetch` + `git log` + SHA + potwierdzenie ze zmiany SA
W COMMITACH. Praca niezacommitowana = BLOKER.
