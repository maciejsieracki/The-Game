# 01 — OPERATOR (runda 1/5)

STATUS: PASS
DOMAIN: INFRA
TEMAT: `R-REPO-SCIEZKA-KANON-FINALNA-Q1`
MODEL+EFFORT: Opus 5, effort **high**
GOAL: Odtworzyć oprzyrządowanie poziomów wydań KANON i FINALNA usunięte przy sprzątaniu repo
oraz doprowadzić dokumentację do stanu zgodnego z faktami.

Worktree: `/home/user/wt-op-kanon`, gałąź `autobot/R-REPO-SCIEZKA-KANON-FINALNA-Q1` od `origin/main`
(`b1dca851`), sparse-checkout bez `gra-robocza/` i `archiwum/` (C-015).

## 1. Werdykt per skrypt

| Skrypt | Decyzja | Uzasadnienie |
|---|---|---|
| `publish-kanon-snapshot.ps1` | **ODTWORZONY** | ECHO właściciela („Tak, odtwórz"); jedyna ścieżka ROBOCZA→KANON. Ocalały `publish-robocza-snapshot.ps1:5` wymienia go z nazwy jako następny krok łańcucha (rząd 2) |
| `publish-finalna-snapshot.ps1` | **ODTWORZONY** | ECHO właściciela; jedyny producent `Gra-FINALNA.html`, który został w repo jako sierota (F1) |
| `cleanup-retention.ps1` | **ODTWORZONY** | Wołany bezwarunkowo z `publish-kanon-snapshot.ps1:77` (`-Execute`). Bez niego promocja kanonu przerywa się na `$ErrorActionPreference='Stop'` |
| `sync-kanon-to-robocza.ps1` | **NIE ODTWORZONY** | §14. Trzy niezależne powody niżej |
| 4 narzędzia „Grupa F" | **NIE ODTWORZONE** | Żadne nie leży na ścieżce KANON/FINALNA; tor wycofany przed sprzątaniem (potwierdzenie FC, F3) |

### 1a. Dlaczego `sync-kanon-to-robocza.ps1` NIE wraca

1. **Jest martwy wobec dzisiejszego nazewnictwa.** `l.11` rzuca przy braku
   `gra-kanon/Gra-podglad.html`. `publish-kanon-snapshot.ps1` produkuje `Gra-KANON.html` —
   nigdy `Gra-podglad.html`. Ten plik nie istniał już w bazie `39ae5d17` (tor „Grupa F").
   Odtworzony wywaliłby się przy pierwszym uruchomieniu — dokładnie ryzyko z reguły
   przeciw samooszukiwaniu.
2. **Kolidowałby z żywą konwencją.** `l.89` nadpisuje `gra-robocza/START.html` zaślepką
   na `Gra-podglad.html`; ocalały `publish-robocza-snapshot.ps1:70` mówi wprost:
   „START.html w gra-robocza/ — utrzymywany ręcznie (hub playtestów); publish nie nadpisuje".
   Skasowałby hub właściciela. `l.100` nadpisuje `ROBOCZA-MANIFEST.json` poza deployem
   (§9 pkt 5). `l.102` tworzy `Gra-podglad-ROBOCZA.html` — cel nieistniejący.
3. **Zero żywych odwołań.** Jedyne wystąpienie poza raportami runów to
   `dyspozycje/_handoff/MASTER-do-UI_miasto-krok3-A-2026-07-03.md:6` — dokument oznaczony
   w nagłówku `STATUS: ANULOWANY (2026-07-03)`.

Właściciel nie wymienił synchronizacji wstecznej. Nie poszerzam zakresu.

## 2. Audyt ścieżek — każda pozycja sprawdzona wobec faktycznego stanu repo

Odtworzenie **bajtowo identyczne** z `39ae5d17` (`git show ... | git hash-object` = blob z `39ae5d17`).
Żadnej „poprawki przy okazji" w narzędziu klasy deploy, którego nie da się tu uruchomić.

### 2a. `publish-kanon-snapshot.ps1` (99 l.)

| l. | Ścieżka | Stan dziś | Skutek |
|---|---|---|---|
| 9–11 | `gra/tools`, `gra/`, projRoot | IST | ok |
| 13 | `gra-kanon-archiwum` (`$archiveRoot`) | BRAK | **zmienna przypisana i nigdy nieużyta** — martwa linia, bez skutku |
| 18–22 | `gra-robocza/Gra-ROBOCZA.html` (twardy `throw`) | **IST** (md5 `04a7adcb`) | ok, warunek spełniony |
| 25–30 | `gra-kanon/` | BRAK → **tworzony** | zamierzone (dispatch pkt 4) |
| 32–45 | 8 par rename, każda pod `if (Test-Path)` | 7 nazw PLAYTEST/POLE-BITWY **BRAK** w `gra-robocza/` | renamy cicho pomijane, **bez błędu**; `publish-robocza-snapshot.ps1:57,74–76` odtwarza 6 PLAYTEST + POLE-BITWY przy następnej publikacji ROBOCZEJ → tabela nie jest przestarzała, tylko bezczynna do tego czasu |
| 46–47 | `ROBOCZA-MANIFEST.json` w kopii | IST (przychodzi z `Copy-Item`) | usuwany, guard |
| 56 | `gra-kanon/KANON-MANIFEST.json` | tworzony | ok |
| 72 | `gra-kanon/START.html` | tworzony | **naprawia martwy kafel** „Kanon" w `START-GRA.html:12` |
| 75 | `gra/tools/inject-build-stamp.ps1` `-Tier KANON` | **IST**, `ValidateSet` zawiera `'KANON'` (l.6) | ok |
| 77 | `gra/tools/cleanup-retention.ps1` | odtworzony w tym temacie | ok |
| 94 | `START-GRA.html` (nadpisanie) | IST; **treść na dysku identyczna z heredocem l.79–94** | idempotentne, zero niespodzianki |

### 2b. `publish-finalna-snapshot.ps1` (36 l.)

| l. | Ścieżka | Stan dziś | Skutek |
|---|---|---|---|
| 17–20 | `gra-kanon/Gra-KANON.html` (twardy `throw`) | **BRAK** | **poprawne** — produkuje go `publish-kanon-snapshot.ps1`; komunikat błędu wskazuje dokładnie to narzędzie. Kontrolowana odmowa, nie awaria |
| 25–26 | `Gra-FINALNA.html` (projRoot) | **IST** | sierota z F1 dostaje z powrotem swojego producenta |
| 28 | `inject-build-stamp.ps1` `-Tier FINALNA` | **IST**, `ValidateSet` zawiera `'FINALNA'` | ok |
| 36 | `dyspozycje/WERSJE.md`, `_handoff/KANAL-PRACA.md` | IST | tylko `Write-Host`, plików nie dotyka |

### 2c. `cleanup-retention.ps1` (106 l.)

| l. | Ścieżka | Stan dziś | Skutek |
|---|---|---|---|
| 18 | `gra-kanon-archiwum` | BRAK | `Test-Path` → pomijane |
| 27 | `_backup` | **BRAK** (usunięty przy sprzątaniu) | `Test-Path` → pomijane |
| 36 | `gra/_backup` | IST | filtr `*.bak*` → 0 trafień |
| 52–53 | rekursja po projRoot za `*.bak*` | **0 plików `*.bak*` w całym repo** (zweryfikowane `find`) | `.git` nietraversowany (brak `-Force`, katalog ukryty), `node_modules` odfiltrowany l.53 |
| 71 | `gra-robocza-kopia` | BRAK | `Test-Path` → pomijane |

**Wniosek:** dziś skrypt jest kompletnym no-opem, każda gałąź osłonięta, żadna nie rzuca.

**NOTA (utajona kruchość, statycznie).** `l.57` inicjalizuje `$script:seenBakGroups` wyłącznie
wewnątrz ciała `ForEach-Object`. Przy zerowej liczbie `*.bak*` — czyli **dokładnie w dzisiejszym
stanie repo** — pozostaje `$null`, a `l.63` czyta `$null.Keys`. Domyślny PowerShell (bez
`Set-StrictMode`) zwraca `$null`, a `foreach` po `$null` iteruje zero razy, więc przechodzi;
pod `Set-StrictMode -Version 2+` rzuciłby i przerwał promocję kanonu na `l.77`.
**Nie poprawiam:** na tej maszynie nie ma PowerShella, więc nie potwierdzę żadnego wariantu
(§13a), a nieprzetestowana edycja narzędzia klasy deploy jest gorsza niż jawna nota.
Do rozstrzygnięcia przez Evaluatora/właściciela jako osobna, jednolinijkowa poprawka.

## 3. Punkt 3 dispatchu — `dyspozycje/WERSJE.md:8`

`WERSJE.md:7–8` nazywa `gra/tools/publish-kanon-snapshot.ps1` i
`gra/tools/publish-finalna-snapshot.ps1`. **Po tej zmianie oba pliki istnieją** — obie nazwy
rozwiązują się do faktycznych ścieżek, a opis („KANON i FINALNA promują się OSOBNYMI
skryptami… logowane NIEZALEŻNIE") jest zgodny z odtworzoną treścią (`publish-kanon`
nie dotyka FINALNEJ; `publish-finalna` czyta wyłącznie `Gra-KANON.html`).

**Kryterium 3 spełnione przez odtworzenie narzędzi, bez edycji pliku.** `WERSJE.md` jest
rejestrem CHRONIONYM (§9 pkt 5) o zaburzonym kodowaniu w nagłówku; edycja poprawnej linii
byłaby zmianą bez powodu. Wystąpienia w l. 3614+ to **wpisy historyczne** minionych promocji
(narracja o przeszłości, nie instrukcja) — nietknięte. `sync-kanon-to-robocza` i
`cleanup-retention` w `WERSJE.md` **nie występują** (`grep`: 0 trafień), więc decyzja
z §1a nie tworzy tam nowego martwego odwołania.

## 4. Ograniczenie dowodu (§13a) — czytać przed oceną

**Skrypty są w PowerShellu, maszyna jest linuksowa. Nie uruchomiłem żadnego z nich i nie
udaję, że to zrobiłem.** Sprawdziłem, czy interpreter w ogóle jest dostępny —
`which pwsh powershell` oraz `ls /usr/bin/pwsh /opt/microsoft` → **brak**. Nie jest więc
dostępne nawet parsowanie składni bez wykonania. Weryfikacja jest **w 100% statyczna**:
odczyt treści linia po linii + konfrontacja każdej ścieżki z `ls`/`git ls-files`/`find`.
Bramki niżej **nie dotykają** tych skryptów — dowodzą wyłącznie, że nic nie wpadło
przypadkiem do `gra/`.

Żadnego skryptu promocji nie uruchomiłem (zakaz dispatchu). `gra-kanon/` nie został
odtworzony jako katalog z zawartością — 107 MB zostaje usunięte.

## 5. Bramki — uruchomione moją ręką, z `gra/`, każda w `timeout`

`node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów** (exit 0) ·
`logic-test` **213/213** · `tech-tree-test` **19 pass / 0 fail** ·
`research-test` **33/33** · `unit-replace-test` **13/13** · `combat-test` **6/6**.
Wszystkie exit 0. `map-gen-regression-test` — **nie uruchamiany** (zakaz dispatchu).
`node_modules` wpięte do worktree dowiązaniem na czas bramek i **usunięte po nich**;
`git status` po sprzątnięciu **pusty**.

## 5a. Kryterium 5 — zero wycieku poza allowlistę

`git status --porcelain` → **pusto**. `git diff origin/main..HEAD --stat` → **4 pliki,
376 insercji, 0 delecji**: raport + trzy `.ps1` o **99 / 36 / 106** liniach — co do sztuki
zgodne z tabelą dispatchu. Filtr odwrotny `git diff --name-only origin/main..HEAD --
gra/src gra/data gra-robocza gra-kanon dyspozycje/abc-turniej dyspozycje/WERSJE.md`
→ **zbiór pusty**. `git diff --cached --check` czysty. Zero `npm run build/dev`,
zero `npx`, zero `git add -A`, zero pushu do `main`.

## 6. Raport terminalny

STATUS: PASS
DOMAIN: INFRA
TEMAT: R-REPO-SCIEZKA-KANON-FINALNA-Q1
GOAL: odtworzyć oprzyrządowanie KANON/FINALNA i uzgodnić dokumentację ze stanem faktycznym
ZMIANY/COMMIT: `67d22bb4` (raport) + `72704328` (3 skrypty). Allowlista: `gra/tools/publish-kanon-snapshot.ps1`, `gra/tools/publish-finalna-snapshot.ps1`, `gra/tools/cleanup-retention.ps1` — wszystkie **bajtowo identyczne z `39ae5d17`** (zgodność blob-SHA). `dyspozycje/WERSJE.md` **nietknięty** (uzasadnienie §3). `sync-kanon-to-robocza.ps1` **nie odtworzony** (§1a)
TESTY: tsc **0** · logic **213/213** · tech-tree **19/0** · research **33/33** · unit-replace **13/13** · combat **6/6**. Skrypty PowerShell: **weryfikacja wyłącznie statyczna, brak interpretera na maszynie — patrz §4**
BLOKADY: brak. Do rozstrzygnięcia przez Evaluatora: nota o utajonej kruchości `cleanup-retention.ps1:57/63` (§2c) — nie jest blokadą, jest jawnie zgłoszonym ryzykiem niemożliwym do potwierdzenia na tej maszynie
RUNDY: 1/5
NASTĘPNY KROK: Evaluator, runda 1
DEPLOY/PUSH: NIE WYKONANO
