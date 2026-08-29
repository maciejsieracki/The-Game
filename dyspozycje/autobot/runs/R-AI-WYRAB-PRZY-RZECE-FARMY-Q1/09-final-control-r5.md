# 09 — FINAL CONTROL, runda 5 (OSTATNIA): R-AI-WYRAB-PRZY-RZECE-FARMY-Q1

Dispatch: `00-dispatch-r5.md`. Zakres tej rundy — **wyłącznie dwie naprawy**: Z-3 (persystencja
znacznika ZASADY 3) i FC-2 (wykluczenie miast-państw z ZASADY 3). Z-1 i FC-1 są zadane
właścicielowi jako Pytania 3 i 4 i **nie wolno ich było ruszać**.

Worktree FC: `/home/user/wt-fc-ai-r5` (galąź `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`).
Worktree scalenia: `/home/user/wt-fc-ai-r5-main` (origin/main + merge galęzi).
Worktree bazowy: `/home/user/wt-fc-ai-r5-clean` (czysty `origin/main` 755e5141).
Artefakty: `fc5-kontrola.txt`, `fc5-bramki.txt`, `fc5-scalenie.txt`.
Sondy własne: `gra/tools/fc5-struktura.cjs`, `gra/tools/fc5-timeline-kontrola.cjs`.

---

## 1. Kontrola proceduralna (obowiązkowa)

| Kontrola | Wynik |
| --- | --- |
| `git fetch origin autobot/…-R5` | OK |
| `git log --oneline` | `8ed9c4f8` (Evaluator) ← `a46dfc7a` (Operator) ← `fd24330b` (FC r4) |
| SHA HEAD galęzi | `8ed9c4f8048752cd9802446be2ea610307868c52` |
| `git ls-remote origin …-R5` | `8ed9c4f8…` — **lokalny == zdalny** |
| `git status --porcelain` | **PUSTY** — zero pracy niezacommitowanej |
| `git diff --check fd24330b HEAD` | exit 0 |

**Zmiany SĄ W COMMITACH.** Brak blokera proceduralnego.

## 2. Granice §9 — kontrola niezależna

Filtr **ODWROTNY** allowlisty (`gra/src/main.ts`, `gra/tools/**`,
`dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/**`) na 14 plikach diffu
`fd24330b..HEAD`: **PUSTY**.

Ścieżki zakazane (`dyspozycje/WERSJE.md`, `gra/data/**`, `package*.json`, `.github/**`):
**zero trafień**. Pod `gra/src/` zmieniony **wyłącznie `main.ts`** (4 hunki, +84/−25;
większość „−" to przesunięcie wcięcia ciała ZASADY 3 pod nowy strażnik).
Build wyłącznie `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r5-fc
--emptyOutDir` — exit 0, 21,81 s. Zero `npm run build/dev`, zero `npx`, zero `git add -A`,
zero pushu do `main`.

### Z-1 i FC-1 — NIE tknięte (potwierdzone)

- `gra/src/game/cities.ts`, `gra/src/game/auto-improvements.ts`,
  `gra/src/map/improvement-build.ts` **nie występują w diffie galęzi**.
- Diff `main.ts` nie zawiera `ULEPSZENIA_ONLY_WORKED`, `onlyWorked`, `applyBuildRequest`
  ani `assertPlayerTerritoryForBuild`.

## 3. Kontrola strukturalna własną sondą (`fc5-struktura.cjs`) — 16/16 OK

Skaner znakowy z obsługą stringów/komentarzy/template-literali, liczący **głębokość klamr** —
nie `indexOf`, nie dopasowanie liniowe.

- klucz `aiSurplusRedirectedOwners` jest kluczem na **głębokości 1** jedynego literału
  `meta: {` w kodzie (linia 24909…25044), obok `eliminatedOwners`, `typCityCopyOwners`,
  `aiPracaPoolByOwner`, `zdobyczePowerByOwner`;
- `restoreGameFromSave` zdefiniowana **raz** (31872) i ma **jedno wywołanie** (31808) —
  nie ma drugiej ścieżki wczytania, którą naprawa by omijała;
- odczyt `saved.meta?.aiSurplusRedirectedOwners` leży wewnątrz ciała tej funkcji,
  `clear()` **poprzedza** pętlę `add()`;
- cały blok ZASADY 3 leży **wewnątrz** `if (!opts.defensiveCopy) {` (28524), a sąsiedni blok
  CUDA-AI (28555) używa **dosłownie tego samego** warunku;
- `opts.defensiveCopy` powstaje jako `defensiveCopy: typCityCopyOwners.has(ownerId)`
  (27519 i 27637) — to naprawdę miasta-państwa, nie inna kategoria;
- `aiSurplusRedirectedOwners.clear()` na starcie nowej gry stoi w serii ~12 bratnich
  `clear()` w `applyClusterStartPlan` (7859), tuż za `eliminatedOwners.clear()`.

Ta sama sonda **na scaleniu z `origin/main`**: również 16/16 OK (linie przesunięte).

## 4. Kontrola behawioralna własną sondą (`fc5-timeline-kontrola.cjs`) — 25/25

Metoda **inna niż u Operatora i u Evaluatora**: scenariusz to **oś czasu wielu tur**
(T1 nadwyżka → SAVE → **nowa sesja** → T2 → T3), a nie pojedyncza kolumna PRZED/PO;
między zapisem a odczytem stoi **prawdziwy `JSON.stringify` / `JSON.parse`** (Evaluator
świadomie go pominął, Operator serializował w pamięci); kolumna PRZED powstaje przez
**zdjęcie naprawy z tego samego tekstu źródłowego**, nie z osobnej kopii kodu.
Wykonywany jest **prawdziwy tekst `main.ts`**: blok ZASADY 3 wraz ze strażnikiem, dosłowna
linia zapisu do `meta` i dosłowny blok odczytu w `restoreGameFromSave`.

**Z-3, oś czasu (AI CYWILIZACJI owner 11, 3 miasta, suwak własny AI = 40%):**

```
PRZED: T1 100,100,100 | meta={}                                  | poLoad 100,100,100 znacznik=[]   | T2 100,100,100 | T3 100,100,100
PO   : T1 100,100,100 | meta={"aiSurplusRedirectedOwners":[11]}  | poLoad 100,100,100 znacznik=[11] | T2  40, 40, 40 | T3  40, 40, 40
```

- PRZED: po wczytaniu znacznik pusty → gałąź powrotu **martwa**; T2 i T3 zostają na 100%
  budynków, czyli `procentPuliImperiumZBudynkow(100) = 0` — **zero Pracy na ulepszenia terenu,
  trwale**. Regres jest trwały, nie jednorazowy (sprawdzone na dwóch kolejnych turach).
- PO: znacznik przechodzi przez JSON jako płaska tablica liczb `[11]`, jest odtwarzany,
  a T2 wraca z 100% → pula imperium **60%**.
- Owner 12 (**nigdy** nie w nadwyżce) nietknięty w obu kolumnach na całej osi czasu (70 → 70).
- **Stary sejw bez pola** nie wywala odczytu i daje pusty zbiór — kompatybilność wstecz OK.

**FC-2, 3 jawne rostery, wszyscy ownerzy w nadwyżce:**

```
roster 1: PRZED mp=4/4 civ=3/3 znacznikMP=1 | PO mp=0/4 civ=3/3 znacznikMP=0
roster 2: PRZED mp=7/7 civ=2/2 znacznikMP=2 | PO mp=0/7 civ=2/2 znacznikMP=0
roster 3: PRZED mp=1/1 civ=5/5 znacznikMP=1 | PO mp=0/1 civ=5/5 znacznikMP=0
```

Miasta-państwa PRZED dostawały przekierowanie **na wszystkich miastach**, PO nie dostają go
w ogóle (0/N) i **nie dostają znacznika** — więc nie mogą też przeciec do sejwu. AI CYWILIZACJI
dostaje przekierowanie **identycznie w obu kolumnach** — naprawa niczego nie zwęziła.

**Zgodność z pomiarami Operatora i Evaluatora: pełna, rozbieżności brak.**

## 5. Mutacje — moje własne, na PRAWDZIWYM pliku

Nie na harnessie, tylko na `gra/src/main.ts`, z przywróceniem (`git status` po każdej: pusty).

| Mutacja | Skutek |
| --- | --- |
| `if (!opts.defensiveCopy)` → `if (true)` (zdjęcie FC-2) | bramka tematu **49/1**, czerwone **wyłącznie Z3m** |
| usunięcie bloku odczytu z `restoreGameFromSave` (zdjęcie Z-3) | bramka tematu **49/1**, czerwone **wyłącznie Z3l**; moja sonda też czerwona |

Obie nowe asercje bramki tematu (Z3l, Z3m) **realnie wiążą** naprawy i są celne — jedna
mutacja czerwieni dokładnie jedną asercję, nie obie i nie inne.

## 6. Próbne scalenie z aktualnym `origin/main`

`origin/main` = `755e5141`. `git merge --no-commit --no-ff 8ed9c4f8`:
**Automatic merge went well, ZERO konfliktów** (auto-merge `gra/src/main.ts`,
`gra/src/game/ai.ts`; `git diff --diff-filter=U` puste). `main` wnosi po drodze
`game/save.ts`, `game/forced-war-iron.ts`, `game/display-names.ts` i duże zmiany
`map/improvement-build.ts` — żadna nie koliduje z tymi 4 hunkami.

Na scaleniu: obie naprawy obecne, `tsc --noEmit` exit 0, pięć bramek referencyjnych
213/213, 19/0, 33/33, 13/13, 6/6, bramki tematu 50/0 i 35/0, mutacje 18/18,
sonda strukturalna 16/16. Zastany `ai-praca-split-parity-test` 21/1 — bez zmian.

## 7. Bramki własną ręką (galąź `8ed9c4f8`)

Pięć referencyjnych: logic **213/213**, tech-tree **19/0**, research **33/33**,
unit-replace **13/13**, combat **6/6**. `tsc --noEmit` exit 0. Build exit 0.
Tematu: `ai4-popyt-obywatele-test` **50/0** (dispatch wymagał 48 + 2 nowe → 50),
`ai2-heks-po-heksie-test` **35/0**, `ai4-mutacje` **18 dowodów, 0 podejrzanych**.
Save/load (bo naprawa zmienia format sejwu): fort-nodes-save-load **18/0**,
map-snapshot-load **58/0** (+1 known-fail), autosave-quota-fail **20/0**,
okolica-load-reconcile **23/23**, save-load-sort **4/4**, fsa-autosave **55/0**,
load-fail-toast-zindex **15/0**.

**ZASTANE, potwierdzone przeze mnie na czystym `origin/main` `755e5141`
(`/home/user/wt-fc-ai-r5-clean`), NIE pogorszone, NIE naprawiane:**

- `ai-praca-split-parity-test` **21/1** (test 5) — identycznie na galęzi, na `main` i na scaleniu;
- `pre-battle-save-test` — **INFRA**, esbuild „No loader is configured for .svg" na
  `brandAssets.ts` / `scienceOwlIcon.ts`; identyczny błąd na czystym `origin/main`,
  **nie pochodzi z tej galęzi**, nie jest bramką referencyjną.

## 8. Zgłoszenie Operatora do §14 — moja ocena

`aiSurplusRedirectedOwners.clear()` dodany w `applyClusterStartPlan` (nowa gra).
**Oceniam JAKO KONIECZNE NASTĘPSTWO naprawy, nie poszerzenie zakresu — zostawić.**
Uzasadnienie własne: znacznik był jedynym zbiorem w tej serii ~12 bratnich `clear()`
bez zerowania; **odkąd jest trwały**, bez tej linii przejście „wczytaj sejw → menu → nowa gra"
w tej samej sesji przeglądarki dziedziczyłoby przekierowanych ownerów z poprzedniej partii.
Naprawa bez tej linii byłaby niepełna. Zgadzam się z Evaluatorem.

## 9. Znaleziska własne Final Control (rundy 5)

**FC-3 (NOWE, NIE bloker, do backlogu).** Blok sprzątania po eliminacji ownera
(`main.ts` ~23834–23850) usuwa ownerId z ~20 map per-owner (`aiSkarbiecByOwner`,
`aiPracaPoolByOwner`, `typCityCopyOwners`, …), ale **nie** z `aiSurplusRedirectedOwners`.
Odkąd zbiór jest trwały, wpis wyeliminowanego ownera zostaje w pamięci i w sejwie.
To ta sama klasa przeoczenia, która wyprodukowała Z-3. Sprawdziłem skutek praktyczny:
`allocFreeRivalOwnerId` (8008) bierze `max+1`, więc ponowne użycie id jest rzadkie, a gdy
nastąpi — trafia do **ścieżki zakładania miasta-państwa** (8032/8051), gdzie po naprawie FC-2
blok ZASADY 3 i tak jest pomijany, więc znacznik nigdy nie zostanie skonsumowany. Efekt:
**martwy wpis, samoczyszczący się przy pierwszym przebiegu, jeśli id trafi do AI CYWILIZACJI.**
Nie blokuję, ale to należy dopisać do backlogu razem ze sprzątaniem po eliminacji.

**FC-4 (potwierdzenie noty Evaluatora (d), NIE bloker).** `aiSliderStateByOwner`
**nie jest w sejwie** — potwierdziłem grepem: zbiór ma tylko definicję (7469), zapisy
(27588/27595) i odczyty (27505, 28540), zero linii w literale `meta`. Powrót po wczytaniu
czyta więc `aiSliderStateByOwner.get(ownerId)?.procentBudynki ?? DEFAULT_PODZIAL_PRACY(70)`.
Potwierdzam też, że to **jednorazowe, nie trwałe**: blok suwaków (27504–27597) i blok ZASADY 3
(28524) są w **tej samej iteracji `ownerLoop`** (start 27483), suwaki **przed** ZASADĄ 3,
i `aiSliderStateByOwner.set(...)` wykonuje się w **obu** gałęziach tego bloku. **Zastrzeżenie
własne:** blok suwaków jest opakowany w `if (!isCommandResume)`, więc na ścieżce wznowienia
po komendzie powrót może jednorazowo trafić w DEFAULT 70 zamiast wartości AI. Osobna sprawa,
poza zakresem tej rundy.

## 10. BRAK DOWODU (§13a) — jawnie

1. **Zero pomiaru w rozgrywce w przeglądarce.** Wszystkie trzy warstwy dowodów (Operator,
   Evaluator, moja) wykonują prawdziwy tekst `main.ts`, ale **poza pętlą tury i poza
   `runAiPhase`**. Zielona bramka NIE jest dowodem zachowania w rozgrywce.
2. **Zero realnego save/load przez UI** — localStorage/IndexedDB, pełny `SaveGame`,
   `validateLoadedSave`. Mój round-trip idzie przez `JSON.stringify`/`parse` na atrapie sejwu.
3. **Nieznana częstość wpadania AI CYWILIZACJI w stan nadwyżki** — czyli jak często naprawa
   Z-3 w ogóle działa i jak duży był realny wpływ regresu.
4. **FC-4 wyżej:** powrót idzie do wartości, którą suwaki ustawiły w tej samej turze; nie
   zmierzyłem ścieżki `isCommandResume`.
5. **Stary sejw z galęzi rundy 4** (zapisany z ZASADĄ 3 obejmującą miasta-państwa) zostawi
   miasto-państwo na 100% na zawsze — po FC-2 gałąź powrotu dla nich nie biegnie. Galąź
   rundy 4 **nigdy nie była deployowana**, więc bez skutku praktycznego; sprawdziłem tylko
   tyle, że taki sejw nie wywala wczytywania.
6. **FC-3 wyżej:** nie zmierzyłem realnej częstości ponownego użycia ownerId po eliminacji.
7. **Braki dowodu rund 2–4 przechodzą dalej** — ta runda ich nie zamykała i nie zamknęła.

## 11. Stan tematu jako całości

Runda 5 dowiozła **dokładnie to, co dispatch zlecił, i nic ponadto**. Ale temat jako całość
**nie domyka się**, bo dwie z czterech blokad rundy 4 zostały świadomie wyłączone z tej rundy
i czekają na decyzję właściciela:

- **Z-1** — `DEFAULT_ULEPSZENIA_ONLY_WORKED` na wszystkich czterech profilach automatu
  **GRACZA** (Pytanie 3 ABC);
- **FC-1** — ręczny przycisk „buduj" gracza poza ZASADĄ 2 (Pytanie 4 ABC).

**Limit rund jest wyczerpany (5/5).** Nie ma już rundy, w której dałoby się je domknąć
w ramach tego ID.

---

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (Final Control, runda 5/5 — OSTATNIA)
GOAL: AI CYWILIZACJI i AI GRACZA (profil „zrownowazone") buduja domyslnie sama zywnosc;
      niedobor surowca otwiera reszte listy na czas jego trwania; budowa poza zlozami tylko
      na heksach obrabianych przez obywateli; nadwyzka -> AI CYWILIZACJI przesuwa srodki na
      budynki, AI GRACZA wylacznie sygnalizuje; R4-Q2=C — przelacznik „wolno wycinac las"
      dla automatu GRACZA. W TEJ RUNDZIE kontroluje WYLACZNIE dwie naprawy z dispatchu:
      Z-3 (persist znacznika ZASADY 3) i FC-2 (wykluczenie miast-panstw z ZASADY 3).
ZMIANY/COMMIT: kontrolowany HEAD `8ed9c4f8` na `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R5`
      (`a46dfc7a` Operator, `8ed9c4f8` Evaluator; baza `fd24330b`). Praca W COMMITACH,
      `git status` pusty, lokalny == zdalny. Filtr ODWROTNY allowlisty: PUSTY.
      Pod `gra/src/` zmieniony wylacznie `main.ts` (4 hunki, +84/-25). Zero zmian w
      `gra/data/**`, `cities.ts`, `auto-improvements.ts`, `improvement-build.ts`,
      `dyspozycje/WERSJE.md`. Wlasny commit FC doklada `09-final-control-r5.md`,
      `fc5-kontrola.txt`, `fc5-bramki.txt`, `fc5-scalenie.txt` oraz wlasne sondy
      `gra/tools/fc5-struktura.cjs` i `gra/tools/fc5-timeline-kontrola.cjs`.
TESTY: piec bramek referencyjnych wlasna reka z `gra/`, w `timeout`: logic 213/213,
      tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6. `tsc --noEmit` exit 0.
      Build `--outDir /tmp/civ-dist-ai-r5-fc` exit 0 (21,81 s). Bramki tematu:
      ai4-popyt-obywatele 50/0 (dispatch wymagal 48+2), ai2-heks-po-heksie 35/0,
      ai4-mutacje 18/18. Save/load: fort-nodes 18/0, map-snapshot 58/0, autosave-quota 20/0,
      okolica-load-reconcile 23/23, save-load-sort 4/4, fsa-autosave 55/0,
      load-fail-toast-zindex 15/0. WLASNA SONDA STRUKTURALNA `fc5-struktura.cjs` 16/16
      (skaner klamr, nie indexOf): klucz w `meta` na glebokosci 1, restoreGameFromSave
      jedna definicja i JEDNO wywolanie, blok ZASADY 3 w calosci pod `!opts.defensiveCopy`,
      ten sam warunek co CUDA-AI. WLASNA SONDA BEHAWIORALNA `fc5-timeline-kontrola.cjs`
      25/25 (os czasu T1->SAVE->nowa sesja->T2->T3, prawdziwy JSON round-trip):
      Z-3 PRZED 100->100 pula 0 % TRWALE (T2 i T3) vs PO 100->40 pula 60 %; owner
      nieprzekierowany 70->70; stary sejw bez pola OK. FC-2 na 3 rosterach:
      PM N/N -> 0/N i zero znacznikow, CIV N/N w obu kolumnach.
      WLASNE MUTACJE NA PRAWDZIWYM main.ts: zdjecie straznika FC-2 -> bramka 49/1,
      czerwone WYLACZNIE Z3m; usuniecie odczytu Z-3 -> bramka 49/1, czerwone WYLACZNIE Z3l.
      PROBNE SCALENIE z `origin/main` 755e5141: ZERO konfliktow; na scaleniu tsc 0,
      213/213, 19/0, 33/33, 13/13, 6/6, 50/0, 35/0, 18/18, sonda strukturalna 16/16.
      ZASTANE, potwierdzone na CZYSTYM origin/main (osobny worktree), NIE pogorszone,
      NIE naprawiane: `ai-praca-split-parity-test` 21/1 (test 5) oraz INFRA
      `pre-battle-save-test` (esbuild „No loader for .svg", nie z tej galezi).
BLOKADY: brak blokad dla ZAKRESU rundy 5 — obie zlecone naprawy sa dowiedzione.
      1. §14 Operatora (`aiSurplusRedirectedOwners.clear()` w `applyClusterStartPlan`):
         oceniam jako KONIECZNE NASTEPSTWO naprawy, nie poszerzenie zakresu — zostawic.
      2. POZA ZAKRESEM RUNDY, WCIAZ OTWARTE i NIE tkniete: Z-1 (`onlyWorked` na czterech
         profilach automatu GRACZA) i FC-1 (reczny przycisk „buduj" gracza poza ZASADA 2).
         Czekaja na ECHO wlasciciela (Pytania 3 i 4). TEMAT JAKO CALOSC NIE DOMYKA SIE
         bez tej decyzji, a limit rund jest WYCZERPANY (5/5).
      3. FC-3 (nowe, NIE bloker, backlog): blok sprzatania po eliminacji ownera nie usuwa
         wpisu z `aiSurplusRedirectedOwners`, mimo ze zbior jest juz trwaly — ta sama klasa
         przeoczenia co Z-3. Skutek praktyczny martwy (reuse ownerId trafia do sciezki
         miasta-panstwa, gdzie blok i tak jest pomijany), ale nalezy dopisac do backlogu.
      4. FC-4 (nowe, NIE bloker): `aiSliderStateByOwner` nie jest w sejwie, wiec powrot
         czyta wartosc, ktora suwaki ustawily w TEJ SAMEJ iteracji ownerLoop; blok suwakow
         jest jednak pod `if (!isCommandResume)`, wiec na sciezce wznowienia po komendzie
         powrot moze jednorazowo trafic w DEFAULT 70. Osobna sprawa, poza zakresem.
      5. BRAK DOWODU (§13a), 7 pozycji — patrz sekcja 10: (a) zero pomiaru w rozgrywce
         w przegladarce, poza petla tury i poza runAiPhase; (b) zero realnego save/load
         przez UI (localStorage/IndexedDB, pelny SaveGame, validateLoadedSave);
         (c) nieznana czestosc stanu nadwyzki AI CYWILIZACJI; (d) FC-4 wyzej;
         (e) stary sejw z galezi rundy 4 zostawi miasto-panstwo na 100 % (galaz nigdy
         nie deployowana — bez skutku praktycznego); (f) FC-3 wyzej; (g) braki dowodu
         rund 2-4 przechodza dalej.
RUNDY: 5/5 — LIMIT WYCZERPANY. Runda 5 zuzyta w calosci na Z-3 i FC-2. Werdykt FC r5:
      PASS-WITH-NOTES dla zakresu rundy. Poprzednie werdykty FC: r2 —, r4 FAIL.
NASTEPNY KROK: integracja orkiestratora dla ZAKRESU RUNDY 5 (Z-3 + FC-2) na `main`
      z zielonymi bramkami; rownolegle DECYZJA WLASCICIELA (ECHO Pytania 3 i 4) co do
      Z-1 i FC-1 — bez niej temat NIE zamyka sie w tym ID i wymaga nowego ID.
      FC-3 i FC-4 do backlogu. `READY_FOR_DEPLOY` wystawia wylacznie orkiestrator
      po faktycznej integracji.
DEPLOY/PUSH: NIE WYKONANO deployu ani pushu do `main`. Wykonano wylacznie push
      wlasnego commita Final Control na galaz tematu.
```

## GOTOWOSC DO INTEGRACJI

**GOTOWOSC DO INTEGRACJI: TAK — dla ZAKRESU RUNDY 5 (Z-3 + FC-2).** Obie naprawy są
dowiedzione trzema niezależnymi warstwami, wiążą je celne mutacje, nie pogarszają żadnej
bramki, scalają się z `origin/main` bez konfliktu i są kompatybilne wstecz ze starym sejwem.

**ZAMKNIECIE TEMATU: NIE — Z-1 i FC-1 pozostają nierozstrzygnięte i wymagają decyzji
właściciela co do całości; limit rund (5/5) jest wyczerpany.** Integracja tej paczki
**nie zamyka** `R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`. Po ECHO właściciela na Pytania 3 i 4
domknięcie wymaga **nowego ID tematu**.
