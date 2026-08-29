# 03 — FINAL CONTROL (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: `R-REPO-SCIEZKA-KANON-FINALNA-Q1`
MODEL+EFFORT: Opus 5, effort **high**
GOAL: Odtworzyć oprzyrządowanie dwóch poziomów wydań — KANON i FINALNA — usunięte przy
sprzątaniu repo, oraz doprowadzić dokumentację do stanu zgodnego z faktami.

Worktree `/home/user/wt-fc-kanon` (detached od `35c0f335`, po `git fetch --all`).
Wszystko niżej zmierzone MOJĄ ręką, nie przepisane z raportów.

## 1. SCOPE — trzecia, niezależna reprodukcja

`git merge-base origin/main HEAD` = `b1dca851` (= `origin/main`, czyli commit dispatchu).
Łańcuch gałęzi: `b1dca851` → `67d22bb4` → `72704328` → `fbb60e0b` → `35c0f335`.

`git diff --numstat origin/main..HEAD` — **5 plików, 5 A, 624 ins, 0 del**:

| plik | ins |
|---|---|
| `dyspozycje/autobot/runs/…/01-operator.md` | 149 |
| `dyspozycje/autobot/runs/…/02-evaluator.md` | 234 |
| `gra/tools/cleanup-retention.ps1` | 106 |
| `gra/tools/publish-finalna-snapshot.ps1` | 36 |
| `gra/tools/publish-kanon-snapshot.ps1` | 99 |

Rozbieżność N4 rozstrzygam: na `fbb60e0b` (stan, który oceniał Evaluator) diff to
149+106+36+99 = **390** — **Evaluator ma rację, liczba 376 Operatora jest błędna**
(policzył swój raport przed dopisaniem ostatnich linii). Na `35c0f335` jest 624.

Filtr odwrotny po `gra/src gra/data gra-robocza gra-kanon dyspozycje/abc-turniej
dyspozycje/WERSJE.md` → **0 trafień**. `git status --porcelain` **pusty**
(przed bramkami i po nich). `git diff --check` czysty. **Kryterium 5 spełnione.**

Tożsamość bajtowa wobec `39ae5d17` — blob-SHA, moje wyliczenie:

| skrypt | OLD (`39ae5d17`) | NEW (HEAD) |
|---|---|---|
| `publish-kanon-snapshot.ps1` | `e11b7c50…` | `e11b7c50…` **==** |
| `publish-finalna-snapshot.ps1` | `304a84df…` | `304a84df…` **==** |
| `cleanup-retention.ps1` | `80f9b3d2…` | `80f9b3d2…` **==** |
| `sync-kanon-to-robocza.ps1` | `0e2d51dd…` | **ABSENT** |

`gra-kanon/` nie odtworzony ani jako wpis w drzewie, ani na dysku — **dispatch pkt 4 spełniony.**

## 2. To, czego nie zrobili poprzednicy — SYMULACJA LINIA PO LINII

### 2a. Punkt wyjścia (stan faktyczny `gra-robocza/`, zmierzony `ls`)

`Gra-ROBOCZA.html` (37,5 MB) · `Gra-ROBOCZA-POLE-BITWY.html` (25,5 MB) ·
`ROBOCZA-MANIFEST.json` · `START.html` · `START-FALA199/200/201.html` ·
`CLAUDE.md` · 2 pliki `.md` · `data — kopia/` · `konfigiKopiaMaster/` ·
`srcKopiaMaster/` (12 MB) · `tools/` (928 KB). Razem **73 MB**.
Plików `Gra-KANON*` w `gra-robocza/` **nie ma** → zero kolizji przy `Rename-Item`.

### 2b. PRZEBIEG PIERWSZY — czyste repo, `gra-kanon/` NIE istnieje

`publish-kanon-snapshot.ps1`:

| linie | co się dzieje | wynik |
|---|---|---|
| 8–16 | `$projRoot` = korzeń repo, `$kanonRoot` = `<root>/gra-kanon` | OK |
| **13** | `$archiveRoot` przypisany i **nigdy nieużyty** | martwy kod (N1 potwierdzam) |
| 18–20 | `Test-Path gra-robocza/Gra-ROBOCZA.html` → **TRUE** | brak `throw` |
| 22 | `Get-FileHash` MD5 z 37,5 MB | OK (~sekundy) |
| **25–28** | `Test-Path $kanonRoot` → **FALSE** → **pomija `Remove-Item`** | OK |
| **30** | `Copy-Item gra-robocza → gra-kanon -Recurse -Force`; destynacja **nie istnieje**, więc PowerShell tworzy `gra-kanon/` z **zawartością** `gra-robocza/` (nie zagnieżdża) | **poprawnie** |
| 42–45 | 8 par rename, każda za `Test-Path` | **2 się wykonują** (`Gra-ROBOCZA.html`→`Gra-KANON.html`, `Gra-ROBOCZA-POLE-BITWY.html`→`Gra-KANON-POLE-BITWY.html`), **6 cicho pominiętych** (bundle PLAYTEST dziś nie istnieją) |
| 46–47 | `ROBOCZA-MANIFEST.json` skopiowany i usunięty z kanonu | OK |
| 49–56 | `KANON-MANIFEST.json` zapisany | OK |
| 58–72 | `gra-kanon/START.html` **nadpisany** redirectem na `Gra-KANON.html` (kasuje przekopiowany hub właściciela — **zamierzone**) | OK |
| 74–75 | `inject-build-stamp.ps1 -Tier KANON` na `gra-kanon/Gra-KANON.html`; `ValidateSet` (l.6) przyjmuje `KANON` | OK, wolno (37,5 MB przez `ReadAllText` + do 4 iteracji) |
| 77 | `& cleanup-retention.ps1 -Execute …` → patrz 2d | **no-op, exit 0** |
| 79–94 | nadpisuje `<root>/START-GRA.html` | treść identyczna, **bajty nie** — patrz G3 |
| 96–99 | komunikat OK | **exit 0** |

`publish-finalna-snapshot.ps1` **bezpośrednio po**: l.18 `Test-Path
gra-kanon/Gra-KANON.html` → **TRUE** (powstał w l.44) → `Copy-Item` do
`<root>/Gra-FINALNA.html`, l.28 stempel `-Tier FINALNA` → **exit 0**.

`publish-finalna-snapshot.ps1` **uruchomiony dziś, bez wcześniejszej promocji kanonu**:
l.19 `throw "Brak gra-kanon/Gra-KANON.html - najpierw promuj kanon:
publish-kanon-snapshot.ps1"` → **kontrolowana odmowa wskazująca właściwe narzędzie**,
nie awaria.

### 2c. PRZEBIEG DRUGI — `gra-kanon/` JUŻ istnieje

Jedyna różnica leży w l.25–28: `Test-Path $kanonRoot` → **TRUE** → komunikat
„Zastepuje poprzedni kanon" → `Remove-Item -Recurse -Force`. **Po tym l.30 zastaje
destynację nieistniejącą, czyli dokładnie stan przebiegu pierwszego.**

To jest odpowiedź na pytanie przewodnie i jest ona **pozytywna**: skrypt jest
idempotentny **właśnie dzięki** kasowaniu z l.27. Bez niego `Copy-Item -Recurse` na
istniejącą destynację zagnieździłby `gra-kanon/gra-robocza/` (klasyczna pułapka
PowerShella) i l.44 nie znalazłby czego przemianować, a l.75 stemplowałby
nieistniejący plik. **Ten skrypt tej pułapki nie ma.**

Jedyne ryzyko drugiego przebiegu (Windows, `$ErrorActionPreference='Stop'`):
`Remove-Item` z l.27 rzuca, jeśli którykolwiek plik w `gra-kanon/` jest zablokowany
(otwarty `Gra-KANON.html` w przeglądarce, otwarty Eksplorator w tym katalogu).
Skutek: przerwanie **przed** jakąkolwiek modyfikacją — poprzedni kanon zostaje
nienaruszony. Bezpieczny tryb awarii.

### 2d. `cleanup-retention.ps1 -Execute` — symulacja na dzisiejszym repo

| krok | warunek | stan faktyczny (zmierzony) | wynik |
|---|---|---|---|
| 1 (l.19) | `gra-kanon-archiwum/` | **brak** | pominięty |
| 2 (l.28) | `_backup/` | **brak** (skasowany przy sprzątaniu) | pominięty |
| 3 (l.37) | `gra/_backup/` | **istnieje**, ale zawiera `.helmprobe.txt` i `units.ts.TRUNC-as-found-b6` — **żaden nie pasuje do `*.bak*`** | `$byBase` pusty, pętla l.45 nic nie robi |
| 4 (l.52) | rekursywne `*.bak*` po `$projRoot` | **`find` → 0 plików w całym repo** | ciało `ForEach-Object` **nigdy się nie wykonuje** |
| 5 (l.72) | `gra-robocza-kopia/` | **brak** | pominięty |
| — | l.79–89 | `$unique` pusty | „Do usuniecia: 0 elementow, ~0 MB" |
| — | l.98–106 | `foreach` po pustej liście | **exit 0** |

**Cleanup jest dziś kompletnym no-opem — potwierdzam trzeci raz, tym razem przez
sprawdzenie zawartości `gra/_backup` (czego żaden z poprzedników nie zrobił: obaj
napisali „każda gałąź osłonięta", ale gałąź 3 **nie jest** osłonięta `Test-Path`,
tylko pustym wynikiem `-Filter '*.bak*'`).**

Nota `$script:seenBakGroups` (obaj poprzednicy) — **potwierdzam i doprecyzowuję skutek**:
przy kroku 4 z zerowym wynikiem zmienna nigdy nie powstaje, l.63 czyta `$null.Keys`.
Bez `Set-StrictMode` `foreach` po `$null` iteruje zero razy — **przechodzi**.
`Set-StrictMode` nie występuje w żadnym z czterech skryptów łańcucha (sprawdziłem
`grep` po `publish-kanon`, `publish-finalna`, `cleanup-retention`, `inject-build-stamp`).
Ryzyko resztkowe, którego nikt nie nazwał: skrypty są wołane operatorem `&` **w tym samym
runspace**, więc `Set-StrictMode` z **profilu PowerShella właściciela** też by zadziałał.
Gdyby zadziałał, przerwanie nastąpi w `publish-kanon:77` — czyli **po** zbudowaniu
i ostemplowaniu `gra-kanon/`, a **przed** zapisem `START-GRA.html`: kanon byłby
kompletny i grywalny, ale skrypt zwróciłby błąd. Nie jest to blokada promocji.

### 2e. Co realnie wyląduje w `gra-kanon/` (skutki uboczne, nazwane)

- **G4 — korekta rekordu.** Operator napisał „7 z 8 par rename cicho pomijanych".
  **Evaluator poprawił na 6 z 8 i ma rację — potwierdzam niezależnie**:
  `gra-robocza/Gra-ROBOCZA-POLE-BITWY.html` **istnieje** (25,5 MB), więc para 8
  się wykona. Pomijanych jest **6**, wykonują się **2**.
- **G5 — kwantyfikuję notę N5.** `START-FALA199/200/201.html` trafiają do kanonu
  **bez rename**. `START-FALA201.html` ma **10 unikalnych `href`, wszystkie do
  `Gra-ROBOCZA*.html`** — w `gra-kanon/` te nazwy po rename **nie istnieją**, więc
  wszystkie 10 kafli tego huba będzie martwe wewnątrz kanonu. Hub kanonu to jednak
  `START.html` (l.72), który działa. Kosmetyka, nie blokada.
- `srcKopiaMaster/` (12 MB) i `tools/` jadą do kanonu razem z resztą — tak samo jak
  przed sprzątaniem. Wynikowy `gra-kanon/` ≈ **73 MB**.


### 2f. G3 — korekta twierdzenia Operatora o `START-GRA.html`

Operator napisał: „`publish-kanon:94` nadpisuje `START-GRA.html` treścią identyczną
z obecną (**idempotentne**)". Sprawdziłem to bajt po bajcie i twierdzenie jest
**prawdziwe co do treści, ale nie co do bajtów**:

```
sed -n '80,93p' publish-kanon-snapshot.ps1  vs  START-GRA.html bez BOM
  →  diff pusty: TREŚĆ IDENTYCZNA
cat -A START-GRA.html  →  BOM (EF BB BF) + końce linii LF
```

`Set-Content -Encoding UTF8` w Windows PowerShell 5.1 zapisuje **BOM + CRLF**,
a w PowerShell 7 — **bez BOM**. Plik na dysku ma dziś **BOM + LF**. Do tego
`START-GRA.html` **nie jest objęty** żadną regułą w `.gitattributes` (l.16–18 pokrywają
tylko `gra-robocza/*.html`, `gra-kanon/*.html`, `Gra-FINALNA*.html`), więc przy
`core.autocrlf=false` `git status` pokaże ten plik jako **zmodyfikowany** po każdej
promocji — 14 linii różnicy końcami linii, zero różnicy treści.

Skutek funkcjonalny: **żaden** (przeglądarka nie widzi różnicy). Skutek procesowy:
szum w `git status` przy pliku spoza allowlisty tematu. Nota, nie wada.

## 3. G1 — ZNALEZISKO WŁASNE, którego nie ma w żadnym z dwóch raportów

Dispatch pkt 4: „Skrypt ma go tworzyć **przy promocji**, **nie repo ma go trzymać**".
Sprawdziłem, czy cokolwiek to **egzekwuje**:

```
git check-ignore -v gra-kanon/Gra-KANON.html   →  NIE IGNOROWANY
grep -i 'kanon' .gitignore                     →  BRAK WPISU
grep -n 'kanon' .gitattributes                 →  l.17  gra-kanon/*.html -text
```

**`.gitignore` nie zna `gra-kanon/`.** Po pierwszej promocji właściciela `git status`
pokaże ~73 MB nieśledzonych plików, a `.gitattributes:17` wciąż zaprasza je do repo
(`-text` ma sens tylko dla plików **śledzonych**). Temat sprzątania usunął 107 MB
`gra-kanon/`; nic nie stoi na drodze, by wróciło pierwszym nieostrożnym `git add`.

**Nie jest to wada tej paczki i Operator nie mógł tego naprawić** — `.gitignore` nie
jest na allowliście (`gra/tools/*.ps1` · `dyspozycje/WERSJE.md` linia 3 · raporty).
**To wpis rejestrowy dla orkiestratora**, dokładnie tym trybem, którym F1 z poprzedniego
Final Control stało się tym tematem.

## 4. G2 — DOWÓD EMPIRYCZNY, że ścieżka działa u właściciela

Uruchomić skryptów nie mogę (§13a, patrz §6). Zamiast tego znalazłem **ślad ich
poprzedniego uruchomienia na maszynie właściciela**:

```
Gra-FINALNA.html  →  ...color:#9ee6b8...>FINALNA · 9409d51d · 2026-07-20 19:17
gra-robocza/Gra-ROBOCZA.html → ...color:#d4af37...>ROBOCZA &#183; b895fc4e &#183; 2026-08-26 10:17
```

`#9ee6b8` to **dokładnie** kolor gałęzi `'FINALNA'` z `inject-build-stamp.ps1:20`,
a `#d4af37` — gałęzi `default`/ROBOCZA (l.21). Innymi słowy: `Gra-FINALNA.html`
leżący dziś w repo **został wyprodukowany przez odtwarzany właśnie
`publish-finalna-snapshot.ps1:28`** 2026-07-20. To najmocniejszy dowód, jaki da się
zdobyć bez wykonania: łańcuch nie jest hipotezą, on już raz przebiegł end-to-end
na tych plikach.

(Drobiazg: stempel FINALNA z 07-20 ma `bottom:6px` i jest widoczny, dzisiejszy
`inject-build-stamp.ps1` pisze `hidden`+`display:none`+`bottom:32px`. Różnica pochodzi
z **ocalałego** `inject-build-stamp.ps1`, nie z niczego, co ten temat odtwarza —
ale właściciel powinien wiedzieć, że po najbliższej promocji pieczęć FINALNA będzie
ukryta, tak jak jest już dziś w ROBOCZA.)

## 5. Spójność ścieżki jako całości — ROBOCZA → KANON → FINALNA

| ogniwo | narzędzie | stan |
|---|---|---|
| build → ROBOCZA | `publish-robocza-snapshot.ps1` | **ocalało**, nietknięte |
| ROBOCZA → KANON | `publish-kanon-snapshot.ps1` | **odtworzone**, wejście `gra-robocza/Gra-ROBOCZA.html` **istnieje** |
| KANON → FINALNA | `publish-finalna-snapshot.ps1` | **odtworzone**, wejście `gra-kanon/Gra-KANON.html` **produkuje ogniwo poprzednie** (l.44) |
| pieczęć wszystkich trzech | `inject-build-stamp.ps1` | **ocalało**, `ValidateSet` = ROBOCZA/KANON/FINALNA |
| retencja po promocji kanonu | `cleanup-retention.ps1` | **odtworzone**, argumenty l.77 zgodne z `param()` l.2–7 |

**Da się przejść całą drogę. Dziury wykonawczej NIE MA.** Sprawdziłem to trzykrotnie:
przez wejścia (każde istnieje albo jest produkowane przez poprzednie ogniwo), przez
wyjścia (każde jest wejściem następnego) i przez `grep` po całym repo za czymkolwiek
wykonywalnym, co dotyka `gra-kanon`/`Gra-KANON`/`Gra-FINALNA` — trafienia to **wyłącznie
te trzy odtworzone skrypty**, zero sierot i zero brakujących ogniw.

**Dziura jest natomiast w WERYFIKACJI, nie w promocji (G7).** `verify-robocza-bundle.cjs`
(l.8–9) sprawdza **wyłącznie** `gra-robocza/Gra-ROBOCZA.html` vs `ROBOCZA-MANIFEST.json`.
Odpowiednika dla `KANON-MANIFEST.json` nie ma. `gra-robocza/tools/verify-publish-markers.ps1`
domyślnie celuje w `Gra-podglad.html` (martwy tor „Grupa F"). Jedynym narzędziem,
które czytało `gra-kanon/Gra-KANON.html` **i** `Gra-FINALNA.html`, było skasowane
`compare-units-kanon.cjs` (l.8–10 — **potwierdzam notę N3 Evaluatora odczytem
z `39ae5d17`; przesłanka Operatora, że „żadne z czterech nie leży na ścieżce
KANON/FINALNA", jest fałszywa**). Werdykt „nie odtwarzać" **podtrzymuję** (§14,
dispatch pkt 5: brak wywołań, promocja go nie potrzebuje) — ale asymetria „ROBOCZA
ma weryfikator, KANON i FINALNA nie mają żadnego" jest osobnym tematem, nie wadą tej paczki.

## 6. Bramki — MOJĄ ręką, w `timeout`, z `gra/`

`tsc --noEmit` → **exit 0, 0 błędów** · `logic-test` **213/213** ·
`tech-tree-test` **19 pass / 0 fail** · `research-test` **33/33 ALL GREEN** ·
`unit-replace-test` **13/13** · `combat-test` **6/6** — każda exit 0.
`map-gen-regression-test` **nieuruchamiany** (dyrektywa dispatchu).
`node_modules` wpięte dowiązaniem na czas bramek i **usunięte** po nich;
`git status --porcelain` po usunięciu **pusty**. **Kryterium 4 spełnione.**

**OGRANICZENIE DOWODU (§13a).** Żaden skrypt promocji **nie został uruchomiony** i nie
udaję, że został. `pwsh`/`powershell` na tej maszynie nie ma, więc niedostępne jest nawet
parsowanie składni bez wykonania. Cała weryfikacja §2–§5 jest **statyczna**: odczyt linia
po linii + konfrontacja każdej ścieżki z `ls`/`find`/`git ls-files`/`git check-ignore`.
Symulacja z §2b–2d jest **rozumowaniem o semantyce PowerShella**, nie pomiarem.
`gra-kanon/` nie został odtworzony.

## 7. Kryteria dispatchu

1. Skrypty ścieżki obecne, każdy z uzasadnieniem; `sync-kanon-to-robocza.ps1` z jawnym
   „nie odtworzony, bo…" — **spełnione**. Odrzucenie potwierdzam własnym pomiarem:
   `git ls-tree 39ae5d17 -- gra-kanon | grep Gra-podglad` → pusto, więc l.11 rzucałaby
   przy pierwszym uruchomieniu **już przed sprzątaniem**; do tego kolizja z
   `publish-robocza-snapshot.ps1:70`. **Nieodtworzenie jest tu decyzją poprawną, nie luką.**
2. Lista wszystkich ścieżek per skrypt — **spełnione** (Operator: tabele; Evaluator:
   30 ścieżek niezależnie; ja: §2b–2d + §5).
3. `dyspozycje/WERSJE.md` zgodny ze stanem faktycznym — **spełnione BEZ EDYCJI pliku
   chronionego**. Sprawdziłem maszynowo wszystkie **73** nazwy skryptów w pliku:
   `publish-kanon-snapshot.ps1` i `publish-finalna-snapshot.ps1` (l.7–8) **rozwiązują się**.
   Nierozwiązanych zostaje **4**, nie 3 jak podał Evaluator: `.dip-bundle.cjs`,
   `battle-smoke.cjs`, `determinizm-harness.cjs`, `rzeki-harness.cjs` — **wszystkie
   w wpisach historycznych** (l. 216, 231, 240, 1692, 2678, 3270, 3298), żaden na
   ścieżce KANON/FINALNA, żaden w zakresie znaleziska F1. Drobna korekta rekordu.
4. Bramki — **spełnione** (§6).
5. `git status` czysty, zero zmian w chronionych — **spełnione** (§1).

## 8. Próbny merge do `origin/main`

`git merge-tree --write-tree origin/main HEAD` → **exit 0**, drzewo
`d11b6041fa910aba096e8f5a7ead84d5176fafbb`, **zero konfliktów**.
`git merge-base --is-ancestor origin/main HEAD` → prawda; `origin/main` jest przodkiem
gałęzi, **merge jest trywialny (fast-forward)**.

## 9. Checklista §16b

1. `00-dispatch.md` istnieje; GOAL w czterech raportach jest **parafrazowany**, nie
   przepisany co do znaku — semantycznie identyczny, bez sprzeczności. Nota, nie wada ⚠
2. ID `R-REPO-SCIEZKA-KANON-FINALNA-Q1` identyczne we wszystkich rundach ✔
3. Werdykt Evaluatora oparty na artefaktach; jego trzy korekty rekordu (N2, N3, N4)
   **weryfikowałem osobno i wszystkie trzy potwierdzam** ✔
4. §3b — patrz §10 ⚠
5. Licznik rund 1/5, bez cichego resetu, jedna gałąź, jedno ID ✔
6. **G8 — wpis rejestrowy `R-REPO-SCIEZKA-KANON-FINALNA-Q1` w
   `REJESTR-PROSB-I-ZADAN.md:3146` nadal ma status „OTWARTE — WYMAGA DECYZJI
   WŁAŚCICIELA"**, mimo że ECHO właściciela („Tak, odtwórz narzędzia") padło i jest
   zacytowane w dispatchu. `dyspozycje/**` poza raportami runu jest poza allowlistą —
   **obowiązek orkiestratora w kroku integracji** ⚠
7. Temat niedzielony na węzły — nie dotyczy ✔

## 10. Ocena uwag wobec §3b

Wszystkie uwagi (N1–N5 Evaluatora, G1–G10 moje) są albo **kosmetyczne**, albo dotyczą
plików **poza allowlistą** (`.gitignore`, `.gitattributes`, `REJESTR-PROSB-I-ZADAN.md`).
**Żadna nie podważa GOAL, dowodu, zakresu ani granic §9.** Odesłanie do Operatora
zmusiłoby go do naruszenia allowlisty. → **klasyfikacja: KOSMETYCZNE + wpisy rejestrowe**,
nie `FAIL`.

**Do wykonania przez orkiestratora W TYM SAMYM kroku integracji:**

1. zamknięcie wpisu `R-REPO-SCIEZKA-KANON-FINALNA-Q1` w rejestrze (dziś „OTWARTE") — G8;
2. nowy temat **`R-REPO-GITIGNORE-GRA-KANON-Q1`** — G1: `gra-kanon/` do `.gitignore`
   (i decyzja, co z `.gitattributes:17`), zanim właściciel wykona pierwszą promocję;
3. nowy temat **`R-REPO-WERYFIKATOR-KANON-FINALNA-Q1`** — G7: KANON i FINALNA nie mają
   żadnego weryfikatora bundla, gdy ROBOCZA ma `verify-robocza-bundle.cjs`;
4. nota do właściciela przy przekazaniu: **pierwsze uruchomienie `publish-kanon-snapshot.ps1`
   wytworzy ~73 MB nieśledzonych plików w `gra-kanon/`** — to zamierzone, ale
   **nie wolno ich dodać do repo** (patrz pkt 2), oraz `START-GRA.html` może pokazać się
   jako zmieniony wyłącznie przez końce linii (G3), co należy odrzucić `git checkout`, nie commitować.

## 11. Raport terminalny

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-REPO-SCIEZKA-KANON-FINALNA-Q1
GOAL: odtworzyć oprzyrządowanie poziomów wydań KANON i FINALNA usunięte przy sprzątaniu repo i uzgodnić dokumentację ze stanem faktycznym
ZMIANY/COMMIT: zweryfikowany `35c0f335` (5 A / 624 ins / 0 del od `b1dca851`); mój commit = wyłącznie ten plik
TESTY: tsc 0 błędów · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 — moją ręką, exit 0. Skryptów PowerShell NIE uruchomiono (§13a)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora + 4 pozycje z §10
DEPLOY/PUSH: NIE WYKONANO

**GOTOWOŚĆ DO INTEGRACJI: TAK**
