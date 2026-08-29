# RAPORT FINAL CONTROL — R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (runda 1)

Rola: Final Control. Worktree: `/home/user/wt-fc-flaga2` (detached na `91626f06`).
Worktree pomocniczy próbnego scalenia: `/home/user/wt-fc-flaga2-merge`.

**UWAGA NA POJĘCIA (reguła stała właściciela):** cały ten raport dotyczy **AI CYWILIZACJI**
(komputerowych przeciwników). **AI GRACZA** (automat wspierający gracza) nie jest w tym
temacie ani dotykana, ani mierzona, ani nie wnoszę o niej żadnego twierdzenia.

---

## 1. Kontrola proceduralna — praca JEST w commitach

`git fetch origin autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1` wykonany.
Trzy commity gałęzi ponad merge-base, pełne SHA:

| SHA (pełne) | Data | Temat |
|---|---|---|
| `6e7f8b1090ec2a82112980220f388a4a22e75ea8` | 2026-08-27 19:04:48 +0000 | Operator r1: oznaczenie miasta-państwa gaśnie przy KAŻDYM przejęciu miasta |
| `ac4b9bfe7ac91299e23b52787558af522583387f` | 2026-08-27 19:07:17 +0000 | raport Operatora runda 1 (PASS-WITH-NOTES) |
| `91626f06a74453a456eba191c3dbaadb6658bfc3` | 2026-08-27 20:47:07 +0000 | raport Evaluatora runda 1 (PASS-WITH-NOTES) |

- `git status --porcelain` w `/home/user/wt-fc-flaga2` na `91626f06`: **pusty**. Cała zmiana
  źródłowa siedzi w commicie `6e7f8b10`, nie w worktree.
- Worktree Operatora `/home/user/wt-op-flaga` (`ac4b9bfe`): `git status` **pusty**.
- Worktree Evaluatora `/home/user/wt-ev-flaga2` (`91626f06`): `git status` **pusty**.
- Worktree bazowy Evaluatora `/home/user/wt-ev-flaga2-main` (`27be5705`): dwa pliki
  **untracked** — `gra/tools/flaga-mp-ev.cjs`, `gra/tools/flaga-mp-ev.vite.config.ts`.
  Sprawdziłem: **żaden plik `gra/src/` nie jest tam zmodyfikowany** (`git status` nie pokazuje
  ani jednego `M`). To jest jego przyrząd pomiarowy wstawiony do czystego drzewa, a nie mutacja
  źródła — **pomiar „PRZED" Evaluatora stoi**.

**Wniosek: brak pracy niezacommitowanej. Nie ma blokera z tego tytułu.**

## 2. Granice §9 — sprawdzone niezależnie

| Granica | Wynik |
|---|---|
| Filtr odwrotny allowlisty | **PUSTY** — 11 plików, wszystkie w allowlistie (`gra/src/main.ts`, `gra/src/game/display-names.ts`, 7× `gra/tools/**`, 2× `runs/<ID>/**`) |
| `dyspozycje/WERSJE.md` | **nietknięte** (`git diff --stat` pusty) |
| `gra/src/map/improvement-build.ts`, `gra/data/terrain-improvements.json` (temat równoległy) | **nietknięte** — kolizji nie ma |
| Push do `main` | **nie było** — żaden z trzech SHA nie jest osiągalny z `origin/main` |
| `git diff --check` | **czysto** |
| `npm run build` / `npm run dev` / `npx` | brak w commitach; własny build wyłącznie `node ./node_modules/vite/bin/vite.js` |
| `--outDir` unikalny per rola | moje: `/tmp/civ-dist-flaga-fc` i `/tmp/civ-dist-flaga-fc-merge` — nie kolidują z `-op`/`-ev` |

## 3. Bramki — zmierzone własną ręką na gałęzi

Pięć bramek referencyjnych, dokładne liczby:

| Bramka | Wynik | exit |
|---|---|---|
| `logic-test.cjs` | **LOGIC OK (213/213)** | 0 |
| `tech-tree-test.cjs` | **19 pass, 0 fail** | 0 |
| `research-test.cjs` | **33 / 0 / 33 — ALL GREEN** | 0 |
| `unit-replace-test.cjs` | **13/13 zielone** | 0 |
| `combat-test.cjs` | **6/6 pass** | 0 |

Bramka tematu i sąsiedztwo: `flaga-mp-nie-gasnie-test` **31 PASS / 0 FAIL**,
`forced-war-stone` **32/0**, `forced-war-bronze` **44/0**, `forced-war-stone-main-guard` **18/0**,
`forced-war-bronze-main-guard` **25/0**, `display-names` **27/0**, `power-ranking` **10/0**,
`power-ranking-view` **29/0** (tej Evaluator nie uruchamiał), `ai-war-gate` **24/0**.

`tsc --noEmit`: **0 błędów**. Build: `848 modules transformed`, OK.

## 4. Znaleziska własne (czego nie ma w żadnym z dwóch poprzednich raportów)

### 4.1 ROZJAZD Z `main` — twierdzenie Evaluatora jest już nieaktualne (zweryfikowane, bez skutku dla integracji)

Evaluator napisał: „baza = `origin/main` = `27be5705` (merge-base identyczny, **brak rozjazdu**)".
W chwili jego pomiaru to była prawda. **Dziś już nie jest.** `origin/main` stoi na `127db163`,
czyli **17 commitów** ponad merge-base `27be5705` — weszły dwie integracje tematów równoległych
(`R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1`, `R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1`).
Istotne: **`main` też ruszył `gra/src/main.ts`** (+63 linie) oraz `gra/src/game/save.ts` (+130).
To ten sam plik, który zmienia nasza gałąź — ryzyko konfliktu jest realne i nikt go dotąd nie mierzył.

Zmierzyłem próbnym scaleniem w osobnym worktree:

- `git merge --no-commit --no-ff` gałęzi na `origin/main`: **`Auto-merging gra/src/main.ts` →
  „Automatic merge went well". Lista konfliktów (`--diff-filter=U`): pusta.**
- Na **drzewie połączonym** (main + gałąź): `tsc --noEmit` **0 błędów**, build **OK**, oraz:

| Bramka na drzewie połączonym | Wynik |
|---|---|
| `flaga-mp-nie-gasnie-test` | 31/0 |
| logic / tech-tree / research / unit-replace / combat | 213/213, 19/0, 33/0, 13/13, 6/6 |
| `forced-war-stone` / `forced-war-bronze` | 32/0, 44/0 |
| `display-names` / `power-ranking` | 27/0, 10/0 |
| **`farma-lesie-usun-istniejace-test`** (bramka świeżo z `main`) | **143/0** |
| **`hodowla-las-test`** (bramka świeżo z `main`) | **100/0** |
| **`map-improvement-qualify-test`** (zmieniona w `main`) | **126/0** |

Trzy ostatnie to bramki, których **nie było w drzewie mierzonym przez Operatora i Evaluatora** —
dopiero one dowodzą, że nasz temat nie psuje świeżo zintegrowanych tematów równoległych.
**Skutek: rozjazd jest, ale nie boli. Integracja może iść wprost, bez rebase.**

### 4.2 BRAK MIGRACJI ISTNIEJĄCYCH SEJWÓW — naprawa działa tylko „od teraz"

Naprawa gasi flagę **w chwili przejęcia**. Nie ma żadnego kodu, który gasiłby ją przy
**wczytaniu sejwu**. Przeszedłem wszystkie wystąpienia `startCityState` w `gra/src/`
(`main.ts` 5121 / 8048 / 8146 / 27313 / 27666 / 31889 / 31906, `ai.ts`, `cities.ts`,
`display-names.ts`) — w ścieżce wczytywania **nic tej flagi nie normalizuje**.

Skutek dla sejwu założonego **przed** tym commitem, w którym cywilizacja już zdobyła miasto
miasta-państwa: flaga w pliku jest `true`, po wczytaniu nikt jej nie gasi, a
`isOwnerClusterCityState` ma warunek trzeci `cities.some(c => c.ownerId === ownerId && c.startCityState)`
liczony na **bieżącym** właścicielu. Zdobywca zostaje miastem-państwem **na zawsze** — dokładnie
ta sama choroba, którą temat leczy.

Nie zostawiam tego jako przypuszczenia. Sonda (esbuild na `display-names.ts`, kształt sejwu
sprzed naprawy: owner 1 = pełna cywilizacja trzymająca zdobyte `c8` z `startCityState:true`,
owner 4 = prawdziwe MP, `meta` niosąca poprawne zbiory `{4}`):

```
PO WCZYTANIU STAREGO SEJWU (bez migracji):
  owner 1 (pelna cywilizacja) traktowany jak miasto-panstwo: true      <-- choroba wraca
  owner 4 (prawdziwe MP)      traktowany jak miasto-panstwo: true
PO HIPOTETYCZNEJ MIGRACJI (gaszenie flagi na miastach zdobywcy):
  owner 1: false   owner 4: true                                       <-- tak ma byc
```

Uczciwie o zakresie: bramka tematu **ma** asercje `T8/T8b/T8c` o rekonstrukcji legacy, ale
pilnują one sejwu zakładanego **po** naprawie (flaga już zgaszona → zbiory MP nie wciągają
zdobywcy). Przypadku sejwu **sprzed** naprawy nie pokrywa żadna asercja i **nie wspomina o nim
żaden z dwóch raportów**. Nie jest to naruszenie granicy ani błąd Operatora — ECHO wariantu A
mówi o „chwili przejęcia", więc migracja jest poza literą dyspozycji. Ale jest to różnica między
„naprawione" a „naprawione w oczach właściciela, który wczyta swój sejw": **właściciel wczytujący
istniejącą grę nie zobaczy skutku tej naprawy dla cywilizacji, które już zdobyły miasto MP.**
Temat równoległy `R-ULEPSZENIA-FARMA-LESIE-USUN-ISTNIEJACE-Q1` dostał na dokładnie ten dylemat
osobne ECHO (wariant C = posprzątać stan już istniejący). Tu takiego ECHO nie ma. **Do decyzji
właściciela osobnym pytaniem ABC, nie do naprawy w tej rundzie.**

### 4.3 `markCityStateDirty()` nie jest pilnowane przez ŻADNĄ asercję (własna mutacja)

Zmiana ma dwie połowy: gaszenie flagi **oraz** unieważnienie cache etykiet
(`if (clearCityStateFlagOnCapture(c)) markCityStateDirty();`). Sprawdziłem, czy druga połowa jest
w ogóle chroniona. Mutacja: usuwam **wyłącznie** oba wywołania `markCityStateDirty()`, zostawiając
gaszenie nietknięte (`main.ts` 12461 i 24127).

**Wynik: bramka tematu dalej `31 PASS, 0 FAIL`.** Mutacja przechodzi niezauważona.

Kontrola poprawności mojego stanowiska pomiarowego — ta sama bramka pod mutacją klasyczną
(`clearCityStateFlagOnCapture` na no-op): **22 PASS, 9 FAIL**. Stanowisko działa, więc wynik
negatywny wyżej jest wiarygodny, a nie artefaktem.

Oceniam to jako **notę, nie bloker**: Evaluator zmierzył w prawdziwej przeglądarce, że etykiety
faktycznie się odświeżają (portret wymuszony `[1,8,15,22,29,36] → []`), więc **zachowanie jest
poprawne**. Niepokryta jest tylko odporność na przyszłą regresję. Drzewo po mutacjach przywrócone
— `git status` pusty (zweryfikowane).

### 4.4 Ryzyko „wyzwolenia miasta" — sprawdzone i ODDALONE

Gaszenie flagi wisi na **współdzielonym** haku `onOwnerChanged` (`post-battle-map.ts:492`), więc
zadałem pytanie, którego nie zadał żaden z dwóch raportów: czy istnieje ścieżka, w której miasto
**wraca** do prawdziwego miasta-państwa (wyzwolenie / oddanie), przy której ten hak trwale
zdegradowałby autentyczne MP? Przeszukałem `gra/src/` za `wyzwol|liberat|oddaj_miasto|returnCity|
restoreCity`: **zero trafień mechaniki**. Takiej ścieżki w grze nie ma. **Regresji z tego tytułu
nie ma** — zapisuję jako wynik negatywny, żeby przy kolejnej zmianie nikt nie badał tego drugi raz.
Zastrzeżenie na przyszłość: gdyby wyzwalanie miast kiedyś powstało, ten hak trzeba przejrzeć ponownie.

### 4.5 Pytanie ABC tematu NIE JEST ZAREJESTROWANE (C-031 / §0c)

Operator i Evaluator zgodnie podnieśli bloker: warstwa `pre_contact` kasuje komendę
`wypowiedz_wojne` między dwiema **AI CYWILIZACJI**, gdy człowiek nie odkrył napastnika we mgle
wojny — Evaluator dał na to rozstrzygający dowód (zbiór AI wypowiadających wojnę = zbiór AI
odkrytych przez gracza we wszystkich 4 ziarnach; ledger `pre_contact` 529/0). Evaluator napisał
„popieram jego pytanie ABC z §3".

Sprawdziłem, czy to pytanie gdziekolwiek żyje poza raportami:

- `dyspozycje/PYTANIA-OTWARTE.md` — `grep` za `FLAGA-MIASTO-PANSTWO`, `pre_contact`,
  `preContact`: **zero trafień**.
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — są dwa wiersze tematu (przyczyna główna oraz
  `ECHO = A — do dispatchu`), ale **ani jednego wiersza o blokerze `pre_contact` wykrytym
  w rundzie 1**.

Czyli bloker istnieje wyłącznie w treści dwóch raportów w `runs/`. Zgodnie z §0c (C-031) tak
wygląda **zgubione zgłoszenie**: nie ma subagenta w locie, nie ma zadanego pytania ABC, nie ma
udokumentowanego powodu odłożenia. **To nie blokuje scalenia kodu** — blokuje **zamknięcie
tematu**, bo ostatnia klauzula GOAL-a wisi właśnie na tej decyzji. Zadanie dla orkiestratora
przed zamknięciem: zarejestrować pytanie ABC (wraz z informacją Evaluatora, że przy wariancie A
poprawka mieści się w całości w `gra/src/main.ts`, czyli w pliku już objętym allowlistą), a obok
niego pytanie z §4.2 o migrację istniejących sejwów.

## 5. Weryfikacja twierdzeń poprzedników

- Inwentaryzacja trzech ścieżek przejęcia i pominięcie rebelii: przeczytałem
  `isOwnerClusterCityState` (`display-names.ts:49-59`) — pierwszy warunek to `if (ownerId <= 0)
  return false`, więc argument Operatora/Evaluatora o `REBEL_FACTION_OWNER_ID = -99` **jest
  poprawny u źródła**. Potwierdzam.
- Hak `onOwnerChanged` jest istotnie **jedynym** miejscem wołanym po `city.ownerId = atkOwner`
  (`post-battle-map.ts:485` → `:492`). Potwierdzam.
- Ścieżka pokojowa (`main.ts:23705`) faktycznie zamieniła surowe `city.startCityState = false` na
  wspólną funkcję — jedna ścieżka gaszenia zamiast dwóch rozjeżdżających się. Potwierdzam.
- Twierdzenie o zerowym rozjeździe z `main`: **nieaktualne, poprawione w §4.1** (bez skutku
  dla decyzji).

## 6. Ocena GOAL-a

Trzy z czterech członów GOAL-a zmierzone i osiągnięte (oznaczenie MP gaśnie u głównych
cywilizacji 6/6 → 0/6; prawdziwe miasta-państwa nadal oznaczone; lista potęg i portret władcy
wracają). Człon czwarty — „wojna wymuszona epoki Kamienia **faktycznie wybucha w rozgrywce**" —
osiągnięty **częściowo**: 3 wypowiedzenia na 4 ziarna, dwa ziarna z zerem. Kryterium 3 dispatchu
brzmi „**Zero wypowiedzeń = FAIL**" — zera nie ma, więc nie jest to FAIL, ale nie jest to też
pełne spełnienie GOAL-a. Reszta wisi na blokerze `pre_contact`, który leży **poza allowlistą**
i wymaga ECHO właściciela (§14). Operator słusznie go nie ruszył.

**Zgodnie z §13a nazywam brak dowodu brakiem dowodu:** nie mam dowodu, że po zdjęciu blokera
`pre_contact` wojny wybuchną na wszystkich ziarnach — nikt tego nie zmierzył, bo poprawki jeszcze
nie ma. Zielone bramki i 31/31 bramki tematu **nie są** dowodem zachowania w rozgrywce; dowodem
zachowania jest playtest Evaluatora, i on pokazuje wynik częściowy.

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
GOAL: Cywilizacja prowadzona przez komputer przestaje być traktowana jak miasto-państwo w chwili przejęcia miasta należącego wcześniej do miasta-państwa, niezależnie od tego czy przejęła je siłą czy pokojowo; po zmianie wojna wymuszona epoki Kamienia faktycznie wybucha w rozgrywce, a cywilizacja po podboju wraca na listę potęg i odzyskuje portret władcy.
ZMIANY/COMMIT: Zweryfikowane trzy commity na `autobot/R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1`: `6e7f8b1090ec2a82112980220f388a4a22e75ea8` (zmiana źródłowa + bramka tematu), `ac4b9bfe7ac91299e23b52787558af522583387f` (raport Operatora), `91626f06a74453a456eba191c3dbaadb6658bfc3` (raport Evaluatora). Merge-base = `27be5705`. Praca niezacommitowana: BRAK — `git status` pusty w `/home/user/wt-fc-flaga2`, `/home/user/wt-op-flaga` i `/home/user/wt-ev-flaga2`; w bazowym `/home/user/wt-ev-flaga2-main` tylko dwa pliki untracked (własny harness Evaluatora), `gra/src/` nietknięte. Filtr odwrotny allowlisty: PUSTY (11 plików, wszystkie w allowlistie). `dyspozycje/WERSJE.md`, `gra/src/map/improvement-build.ts`, `gra/data/terrain-improvements.json` nietknięte. Brak pushu do `main`. `git diff --check` czysto. Plus ten raport (`03-final-control.md`).
TESTY: Pięć bramek referencyjnych własną ręką na gałęzi: logic 213/213, tech-tree 19/0, research 33/33, unit-replace 13/13, combat 6/6. Bramka tematu `flaga-mp-nie-gasnie-test` 31/0. Sąsiedztwo: forced-war-stone 32/0, forced-war-bronze 44/0, forced-war-stone-main-guard 18/0, forced-war-bronze-main-guard 25/0, display-names 27/0, power-ranking 10/0, power-ranking-view 29/0 (Evaluator jej nie uruchamiał), ai-war-gate 24/0. `tsc --noEmit` 0 błędów. Build `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-flaga-fc --emptyOutDir` OK (848 modułów). NOWE — PRÓBNE SCALENIE NA AKTUALNY `origin/main` (`127db163`, 17 commitów ponad merge-base, `main` też ruszył `gra/src/main.ts`): auto-merge bez konfliktów, a na drzewie połączonym `tsc` 0 błędów, build OK i komplet bramek zielony, w tym trzy bramki nieobecne w drzewach Operatora i Evaluatora — farma-lesie-usun-istniejace 143/0, hodowla-las 100/0, map-improvement-qualify 126/0. WŁASNA MUTACJA: usunięcie wyłącznie `markCityStateDirty()` (gaszenie flagi zostawione) NIE zaczerwienia bramki tematu (31/0) — kontrola stanowiska: no-op `clearCityStateFlagOnCapture` daje 22/9 FAIL, więc wynik negatywny jest wiarygodny. WŁASNA SONDA: sejw sprzed naprawy po wczytaniu nadal oznacza zdobywcę jako miasto-państwo (`isOwnerClusterCityState(1) === true`). Drzewo po mutacjach przywrócone, `git status` pusty.
BLOKADY: (1) DECYZJA WŁAŚCICIELA (ABC) — bloker GOAL-a, nie kodu: warstwa `pre_contact` kasuje `wypowiedz_wojne` między dwiema AI CYWILIZACJI, gdy człowiek nie odkrył napastnika; potwierdzam dowód Evaluatora, poza allowlistą, §14. (2) NOWE — to pytanie ABC NIE JEST NIGDZIE ZAREJESTROWANE: zero trafień w `dyspozycje/PYTANIA-OTWARTE.md`, brak wiersza w `REJESTR-PROSB-I-ZADAN.md`; wg §0c/C-031 to zgubione zgłoszenie. Blokuje ZAMKNIĘCIE tematu, nie scalenie kodu. (3) NOWE — brak migracji istniejących sejwów (§4.2), udowodniony sondą; poza literą ECHO wariantu A, do osobnego pytania ABC. (4) NOTA — `markCityStateDirty()` bez asercji (§4.3); zachowanie poprawne (playtest Evaluatora), niepokryta tylko odporność na regresję. (5) BRAK DOWODU (§13a) — nie ma dowodu, że po zdjęciu blokera `pre_contact` wojny wybuchną na wszystkich ziarnach; nikt tego nie mierzył. (6) ODDALONE — ryzyko trwałej degradacji prawdziwego MP przez wspólny hak `onOwnerChanged` przy wyzwoleniu miasta: takiej mechaniki w `gra/src/` nie ma (§4.4).
RUNDY: 1/5
NASTĘPNY KROK: Integracja orkiestratora na `origin/main` (`127db163`) — scalenie zweryfikowane jako bezkonfliktowe i zielone, rebase niepotrzebny. Przed zamknięciem tematu orkiestrator rejestruje dwa pytania ABC: (a) bloker `pre_contact` (przy wariancie A poprawka mieści się w całości w `gra/src/main.ts`, już w allowlistie), (b) migracja istniejących sejwów. Dopiero po ECHO na (a) ostatnia klauzula GOAL-a może zostać uznana za spełnioną.
DEPLOY/PUSH: NIE WYKONANO — wypchnięta wyłącznie gałąź tematu z tym raportem; bez integracji, bez deployu, bez pushu do `main`.

GOTOWOSC DO INTEGRACJI: TAK
