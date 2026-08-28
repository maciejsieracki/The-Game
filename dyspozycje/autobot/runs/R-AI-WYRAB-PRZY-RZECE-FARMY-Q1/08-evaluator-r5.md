# 08 — EVALUATOR, runda 5 (OSTATNIA): R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

Worktree: `/home/user/wt-ev-ai-r5` @ `a46dfc7a474d59785fa0c8920bc715fef63706f5`
(pobrany z `origin/autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`, czyli zdalny SHA, nie kopia
lokalna Operatora). Baza porownania: `fd24330b` (`origin/…-R4`), zweryfikowana jako
`git merge-base`.

---

## 1. Filtr ODWROTNY allowlisty — PUSTY

```
git -c core.quotePath=false diff --name-only fd24330b HEAD | grep -v -E '^(gra/src/main\.ts|gra/tools/|dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/)'
-> (pusty)
```

10 plikow, `+1048/−25`. Poza allowlista: nic. `git status --porcelain` na starcie: pusty
(praca JEST w commicie). `git diff --check`: czysto.

`gra/src/main.ts` = **4 hunki**, `+84/−25`, z czego wiekszosc „−" to samo przesuniecie
wciecia bloku ZASADY 3 pod nowy straznik. Realna tresc zmiany:

| # | miejsce | tresc |
|---|---------|-------|
| 1 | `applyClusterStartPlan` (~7910) | `aiSurplusRedirectedOwners.clear()` przy starcie nowej gry |
| 2 | `buildSaveGameSnapshot` → `meta` (~24995) | `aiSurplusRedirectedOwners: Array.from(aiSurplusRedirectedOwners)` |
| 3 | blok ZASADY 3 (~28524) | opakowanie w `if (!opts.defensiveCopy) { … }` |
| 4 | `restoreGameFromSave` (~32101) | `clear()` + odczyt `saved.meta?.aiSurplusRedirectedOwners` |

Zgodnosc z konwencja pliku sprawdzona: klucz jest **wewnatrz literalu `meta: {`** (otwarcie
w linii 24909; sasiedztwo `eliminatedOwners` 25009), a odczyt w `restoreGameFromSave` ma
dokladnie ten sam ksztalt `clear()` → `as number[] | undefined` → `if (?.length)` → petla
`add`, co `eliminatedOwners` i `typCityCopyOwners` (offsety 171–201 i 230–233 wzgledem
poczatku funkcji). `restoreGameFromSave` ma **jedno** wywolanie (31808) — nie ma drugiej
sciezki wczytania, ktora naprawa by omijala.

---

## 2. Powtorzenie obu scenariuszy WLASNA METODA

Sonda: `gra/tools/ev5-z3-fc2-kontrola.cjs` (moja, nowa). Celowo **inny algorytm** niz
`ai5-zasada3-harness.cjs` Operatora — bo bramka tematu (Z3l/Z3m) i sonda dowodowa Operatora
maja jednego wspolnego autora ekstrakcji; gdyby ekstrakcja lapala zly fragment, oba
konsumenty klamalyby zgodnie. Roznice:

- blok ZASADY 3 lokalizuje sie **od konca**: kotwica `[AI] Zasada 3` w `console.error` →
  domkniecie `catch` → nastepna klamra domykajaca = koniec straznika → **odwrotne**
  dopasowanie klamr do jego otwarcia (Operator szuka w przod ostatniego `if (`/`try {`
  o wcieciu 12);
- zapis: wycinam **caly** literal `meta: { … }` i szukam klucza na **glebokosci 1** tego
  literalu (Operator: `indexOf` miedzy dwiema sygnaturami funkcji) — to dowodzi takze, ze
  klucz nie wpadl przypadkiem do zagniezdzonego obiektu;
- scenariusz Z-3 na **trzech** ownerach naraz (cywilizacja w nadwyzce, cywilizacja BEZ
  nadwyzki, miasto-panstwo w nadwyzce), a nie jednym; plus przypadek **starego sejwu**;
- scenariusz FC-2 na **jawnych rosterach** (3PM/3CIV, 1PM/5CIV, 5PM/1CIV), nie na ziarnie PRNG.

Kolumne PRZED dla Z-3 uzyskuje **inaczej niz Operator**: nie mutuje zrodla, tylko pomijam
zapis i odczyt w round-tripie (rownowazne stanowi sprzed naprawy, bez dotykania tekstu pliku).

Wynik (`ev5-kontrola.txt`, 20/20 asercji zielonych):

```
stale z cities.ts: MAX=100 DEFAULT=70 pula(MAX)=0%

PRZED  | znaczniki po load: []    CIV-w-nadwyzce 100 -> 100 (pula 0%) | CIV-bez 60 -> 60 | PM 60 -> 60
PO     | znaczniki po load: [11]  CIV-w-nadwyzce 100 ->  70 (pula 30%)| CIV-bez 60 -> 60 | PM 60 -> 60
LEGACY | znaczniki po load: []    CIV-w-nadwyzce 100 -> 100 (pula 0%) | CIV-bez 60 -> 60 | PM 60 -> 60

R1 3PM/3CIV  PRZED: PM 3/3 (miasta na MAX 3), znaczniki 3 | CIV 3/3
             PO:    PM 0/3 (miasta na MAX 0), znaczniki 0 | CIV 3/3
R2 1PM/5CIV  PRZED: PM 1/1, znaczniki 1 | CIV 5/5    PO: PM 0/1, znaczniki 0 | CIV 5/5
R3 5PM/1CIV  PRZED: PM 5/5, znaczniki 5 | CIV 1/1    PO: PM 0/5, znaczniki 0 | CIV 1/1
```

**Wynik zgodny z Operatorem co do liczby.** `100 → 100` przy puli imperium `0 %` PRZED
i `100 → 70` przy puli `30 %` PO; miasta-panstwa `N/N → 0/N`, AI CYWILIZACJI `N/N` w obu
kolumnach. Rozbieznosci brak — nie ma tu znaleziska.

Dodatkowo moja sonda pokazuje dwie rzeczy, ktorych scenariusz Operatora nie obejmowal:

- owner, ktory **nigdy** nie byl przekierowany (`CIV-bez` 60 → 60), pozostaje nietkniety —
  naprawa nie „resetuje wszystkim" podzialu po wczytaniu;
- **stary sejw bez pola** (`LEGACY`) wczytuje sie bez wyjatku, ze zbiorem pustym.

## 2b. Wiazanie z prawdziwym silnikiem (czego sonda sama nie dowodzi)

Sprawdzone bezposrednio w `main.ts`, bo od tego zalezy, czy sonda mierzy cos realnego:

- `opts.defensiveCopy` powstaje jako `defensiveCopy: typCityCopyOwners.has(ownerId)`
  (`main.ts:27637`) — to naprawde miasta-panstwa, a nie inna flaga o podobnej nazwie;
- sasiedni blok CUDA-AI uzywa **doslownie** tego samego straznika `if (!opts.defensiveCopy) {`
  — wzorzec skopiowany, nie wymyslony;
- blok ZASADY 3 (28524) i blok suwakow `decideAIEconomySliders` (27547) sa w **tej samej**
  iteracji `ownerLoop` (27483–29237), suwaki **wczesniej** — co ma znaczenie dla noty 3(d) nizej;
- `applyClusterStartPlan` ma jedno wywolanie (30887, nowa gra) i nie lezy na sciezce
  wczytania sejwu (31808) — dodany `clear()` nie kasuje tego, co przed chwila odtworzono.

---

## 3. Z-1 i FC-1 — NIE TKNIETE (potwierdzone)

- `git diff fd24330b HEAD --name-only` nie zawiera `gra/src/game/cities.ts`,
  `gra/src/game/auto-improvements.ts` ani `gra/src/map/improvement-build.ts`.
- Diff `main.ts` przeszukany na `ULEPSZENIA_ONLY_WORKED`, `onlyWorked`, `applyBuildRequest`,
  `assertPlayerTerritoryForBuild`, `improvement-build` — **zero trafien**.

Obie sprawy czekaja na ECHO wlasciciela w stanie nienaruszonym.

---

## 4. Bramki (wlasna reka, z `gra/`, w `timeout`) — `ev5-bramki.txt`

Piec referencyjnych: logic **213/213**, tech-tree **19/0**, research **33/33**,
unit-replace **13/13**, combat **6/6**. `tsc --noEmit` exit 0.
Build `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r5-ev --emptyOutDir`
OK (22,16 s).

Bramki tematu: `ai4-popyt-obywatele-test` **50/0** (48/0 + Z3l + Z3m, zero utraconych
asercji), `ai2-heks-po-heksie-test` **35/0**.

Mutacje `ai4-mutacje.cjs`: **18 dowodow / 0 podejrzanych**. Sprawdzilem adresowanie:
M16 (usun ZAPIS) → czerwieni **wylacznie** Z3l; M17 (usun ODCZYT) → **wylacznie** Z3l;
M18 (zdejmij wykluczenie miast-panstw) → **wylacznie** Z3m. Obie nowe asercje sa wiec
nietautologiczne i celne.

Save/load (bo naprawa dotyka snapshotu i restore): fort-nodes-save-load **18/0**,
map-snapshot-load **58/0** (+1 znany, zastany), autosave-quota-fail **20/0**,
okolica-load-reconcile **23/23**.

**Zastany regres, NIE pogorszony:** `ai-praca-split-parity-test` **21/1**. Potwierdzilem
**sam**, w osobnym worktree `/tmp/ev5-main` na swiezym `origin/main` = `755e5141`:
identyczne 21/1, ten sam test 6 („Kontrakt 10 % ulepszen → 90 % budynkow", komunikat
„gracz i AI czytaja udzial ulepszen jako dopelnienie jedynego podzialu"). Nie naprawiany —
dispatch zabrania.

**Scalalnosc:** probne `git merge --no-commit --no-ff a46dfc7a` na swiezym `origin/main`
(`755e5141`) — „Automatic merge went well", zero konfliktow (auto-merge `gra/src/main.ts`
i `gra/src/game/ai.ts`). Merge przerwany, worktree usuniety.

---

## 5. Ocena zgloszenia Operatora do §14 — `clear()` w `applyClusterStartPlan`

Operator sam zglosil te linie jako „poza litera dispatchu". **Uznaje ja za w zakresie
i rekomenduje ZOSTAWIC.** Uzasadnienie:

1. Przed runda 5 `aiSurplusRedirectedOwners` **nie byl zerowany nigdzie** — ani przy starcie
   nowej gry, ani przy wczytaniu. Wsrod sasiadow w tym samym bloku `applyClusterStartPlan`
   (`eliminatedOwners.clear()`, `typCityCopyOwners.clear()`, `aiResearchDone.clear()`) byl
   jedynym zbiorem bez `clear()`. To luka wprowadzona w rundzie 4, nie przez te naprawe.
2. Bez tej linii persystencja z naprawy Z-3 **rozszerzalaby** ten przeciek: znacznik
   przetrwalby nie tylko wczytanie, ale i przejscie „wczytaj sejw → menu → nowa gra".
3. Jedna linia, plik na allowliscie, wzorzec identyczny z sasiadami, zerowy wplyw na
   sciezke wczytania (rozne wywolania — 30887 vs 31808, sprawdzone).

Nie jest to poszerzenie GOAL-u; jest to warunek poprawnosci tej samej naprawy.

---

## 6. BRAK DOWODU (§13a) — przenosze i uzupelniam

Nie sa to blokady rundy 5; sa to granice tego, co zostalo zmierzone.

- **(a) Brak pomiaru w rozgrywce/przegladarce.** Oba dowody (moj i Operatora) wykonuja
  **prawdziwy tekst** `main.ts` przez `new Function`, ale **poza petla tury** i poza
  `runAiPhase`. Zielona bramka NIE jest dowodem zachowania w rozgrywce. Nikt — ani Operator,
  ani ja — nie zagral tury w przegladarce i nie zobaczyl, ze AI CYWILIZACJI po wczytaniu
  sejwu znowu klada ulepszenia terenu.
- **(b) Brak realnego save/load przez UI.** Round-trip idzie przez prawdziwe fragmenty
  zapisu i odczytu + `JSON.parse(JSON.stringify(...))`. Nie przez `localStorage`/IndexedDB,
  nie przez pelny obiekt `SaveGame`, nie przez `validateLoadedSave`.
- **(c) Nieznana czestosc aktywacji.** Nie wiadomo, jak czesto AI CYWILIZACJI faktycznie
  wpada w stan nadwyzki w normalnej partii — czyli jak czesto ta naprawa w ogole dziala.
- **(d) Powrot idzie do DEFAULT (70 %), nie do wartosci wybranej wczesniej przez AI.**
  `aiSliderStateByOwner` **nie jest** w sejwie (sprawdzilem: zero wystapien w
  `buildSaveGameSnapshot`), wiec po wczytaniu galaz powrotu spada na
  `DEFAULT_PODZIAL_PRACY`. Potwierdzam ocene Operatora, ze to **osobna sprawa poza zakresem**
  i **nie** trwale zablokowanie — dodatkowo zmierzylem, dlaczego: blok suwakow
  (`decideAIEconomySliders`, 27547) biegnie w tej samej iteracji `ownerLoop` **przed**
  ZASADA 3 (28524) i bezwarunkowo odtwarza `aiSliderStateByOwner` (`set` w obu galeziach,
  27588/27595, o ile nie `isCommandResume`). Skutek: jednorazowe cofniecie do 70 % w turze
  po wczytaniu, potem AI liczy suwaki normalnie. Zgloszone, nie naprawiane.
- **(e) Stary sejw z zablokowana wartoscia sie nie odblokuje.** Sejw zapisany kodem sprzed
  tej naprawy, ale JUZ z ZASADA 3 (czyli z galezi rundy 4), wczyta sie z pustym zbiorem
  i zostanie na `procentBudynki = 100`. Praktycznie nieszkodliwe — galaz rundy 4 nigdy nie
  byla deployowana, wiec takie sejwy nie istnieja u graczy; sprawdzilem tylko tyle, ze taki
  sejw **nie wywala wczytywania** (przypadek LEGACY, zielony).
- **(f) Braki dowodu rundy 4 przenosze bez zmian**: skutek strategiczny ZASADY 2 dla sily
  AI CYWILIZACJI w dluzszej grze; Z-6 (pusta kolejka produkcji a `pracaImperialPoolGain`).
- **(g) Nie oceniam Z-1 ani FC-1** — nie sa w zakresie tej rundy i czekaja na ECHO wlasciciela.

---

## 7. Stan tematu po tej rundzie (dla Final Control i orkiestratora)

Zakres **dispatchu rundy 5** (Z-3 + FC-2) jest domkniety i udowodniony niezaleznie.
Zakres **tematu jako calosci** — nie: `Z-1` i `FC-1` pozostaja otwarte i sa pytaniami do
wlasciciela (Pytania 3 i 4). To ostatnia dozwolona runda, wiec temat nie zamyka sie procesem;
zamkniecie wymaga decyzji wlasciciela co do tych dwoch spraw. Zglaszam to jawnie, zgodnie
z dispatchem, i nie przedluzam petli.

---

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Evaluator, runda 5/5 — OSTATNIA)
GOAL: AI CYWILIZACJI i AI GRACZA (profil „zrownowazone") buduja domyslnie sama zywnosc;
      niedobor surowca otwiera reszte listy na czas jego trwania; budowa poza zlozami tylko
      na heksach obrabianych przez obywateli; nadwyzka -> AI CYWILIZACJI przesuwa srodki na
      budynki, AI GRACZA wylacznie sygnalizuje; R4-Q2=C — przelacznik „wolno wycinac las"
      dla automatu GRACZA. W TEJ RUNDZIE oceniam WYLACZNIE dwie naprawy z dispatchu:
      Z-3 (persist znacznika ZASADY 3) i FC-2 (wykluczenie miast-panstw z ZASADY 3).
ZMIANY/COMMIT: oceniany `a46dfc7a` na `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`
      (baza `fd24330b`). Filtr ODWROTNY allowlisty: PUSTY. `main.ts` = 4 hunki, zero zmian
      w `gra/data/**`, `cities.ts`, `auto-improvements.ts`, `improvement-build.ts`,
      `dyspozycje/WERSJE.md`. Wlasny commit Evaluatora dokłada `08-evaluator-r5.md`,
      `ev5-kontrola.txt`, `ev5-bramki.txt` i wlasna sonde `gra/tools/ev5-z3-fc2-kontrola.cjs`.
TESTY: piec bramek referencyjnych wlasna reka z `gra/`, w `timeout`: logic 213/213,
      tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6. `tsc --noEmit` exit 0.
      Build --outDir /tmp/civ-dist-ai-r5-ev OK (22,16 s). Bramki tematu: ai4-popyt-obywatele
      50/0, ai2-heks-po-heksie 35/0. Mutacje ai4-mutacje 18/0 — M16 i M17 czerwienia
      wylacznie Z3l, M18 wylacznie Z3m (asercje nietautologiczne, celne).
      Save/load: fort-nodes-save-load 18/0, map-snapshot-load 58/0, autosave-quota-fail 20/0,
      okolica-load-reconcile 23/23. WLASNA SONDA `ev5-z3-fc2-kontrola.cjs` (inny algorytm
      ekstrakcji, inne scenariusze) 20/20: Z-3 PRZED 100->100 pula 0 % vs PO 100->70 pula 30 %,
      owner nieprzekierowany nietkniety, stary sejw bez pola nie wywala wczytywania;
      FC-2 na 3 jawnych rosterach PM N/N -> 0/N przy AI CYWILIZACJI N/N w obu kolumnach.
      Zgodnie z pomiarem Operatora — rozbieznosci brak.
      ZASTANE CZERWONE, potwierdzone przeze mnie na swiezym `origin/main` (`755e5141`,
      worktree /tmp/ev5-main): `ai-praca-split-parity-test` 21/1, ten sam test 6 —
      identyczne, NIE pogorszone, NIE naprawiane (dispatch zabrania).
      Probne scalenie z `origin/main`: bez konfliktow.
BLOKADY: brak blokad wykonawczych dla zakresu rundy 5.
      1. Zgloszenie Operatora do §14 (`aiSurplusRedirectedOwners.clear()` w
         `applyClusterStartPlan`) — OCENIAM JAKO W ZAKRESIE, rekomenduje zostawic:
         zbior byl jedynym sasiadem bez `clear()` w tym bloku, a persystencja bez tej linii
         rozszerzalaby zastany przeciek na przejscie „sejw -> menu -> nowa gra".
      2. POZA ZAKRESEM RUNDY, WCIAZ OTWARTE: Z-1 (`DEFAULT_ULEPSZENIA_ONLY_WORKED = true`
         na wszystkich czterech profilach automatu GRACZA) i FC-1 (reczny przycisk „buduj"
         gracza poza ZASADA 2) — potwierdzam, ze NIE zostaly tkniete; czekaja na ECHO
         wlasciciela (Pytania 3 i 4). Temat jako calosc NIE domyka sie bez tej decyzji,
         a to byla ostatnia dozwolona runda.
      3. BRAK DOWODU (§13a), 7 pozycji — szczegoly w §6 wyzej: (a) zero pomiaru w rozgrywce
         w przegladarce, (b) zero realnego save/load przez UI (localStorage/IndexedDB,
         pelny SaveGame, validateLoadedSave), (c) nieznana czestosc wpadania AI CYWILIZACJI
         w stan nadwyzki, (d) powrot po wczytaniu idzie do DEFAULT 70 %, nie do wartosci
         wybranej przez AI (`aiSliderStateByOwner` nie jest w sejwie) — jednorazowy, nie
         trwaly, bo suwaki licza sie dalej w tej samej iteracji przed ZASADA 3, (e) stary
         sejw z galezi rundy 4 zostanie na 100 % (galaz nigdy nie deployowana, wiec bez
         skutku praktycznego; sprawdzone tylko tyle, ze nie wywala wczytywania), (f) braki
         dowodu rundy 4 przeniesione bez zmian (skutek strategiczny ZASADY 2; Z-6),
         (g) nie oceniam Z-1 ani FC-1.
RUNDY: 5/5 — limit wyczerpany. Werdykt Evaluatora tej rundy: PASS-WITH-NOTES dla zakresu
      dispatchu (Z-3 + FC-2). Temat jako calosc wymaga decyzji wlasciciela (Z-1, FC-1).
NASTEPNY KROK: Final Control (Opus 5, effort high) — `git fetch` + `git log` + SHA
      + potwierdzenie, ze zmiany SA w commitach; ocena calosci tematu wobec GOAL,
      nie tylko zakresu rundy 5.
DEPLOY/PUSH: NIE WYKONANO deployu ani pushu do `main`. Push wylacznie galezi tematu
      `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`.
```
