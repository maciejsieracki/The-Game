# 02 — EVALUATOR (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: `R-REPO-SCIEZKA-KANON-FINALNA-Q1`
MODEL+EFFORT: Opus 5, effort **high**
GOAL: odtworzyć oprzyrządowanie poziomów wydań KANON i FINALNA usunięte przy sprzątaniu
repo i uzgodnić dokumentację ze stanem faktycznym.

Worktree `/home/user/wt-ev-kanon`, detached od `fbb60e0b` po `git fetch --all`.
Wszystko niżej uruchomione moją ręką. Listy ścieżek nie przepisywałem z raportu
Operatora — wyciągnąłem je mechanicznie z treści skryptów (`grep` po `Join-Path`,
`Test-Path`, `Copy-Item`, `Set-Content`, `Remove-Item`, `Get-ChildItem`,
`Rename-Item`, `&`) i każdą sprawdziłem osobno.

## 1. Zakres — odtworzony niezależnie

`merge-base(origin/main, HEAD)` = `b1dca851`. Diff `origin/main..HEAD`:
**4 pliki A, 390 insercji, 0 delecji** (3 skrypty 99+36+106 = 241 + raport 149).
`git diff --check` czysty, `git status` pusty.
Filtr odwrotny po `gra/src gra/data gra-robocza gra-kanon dyspozycje/abc-turniej
dyspozycje/WERSJE.md` → **0 trafień**. Granice §9 nienaruszone.

Tożsamość bajtowa z `39ae5d17` potwierdzona blob-SHA (nie diffem):
`publish-kanon` `e11b7c50…`, `publish-finalna` `304a84df…`, `cleanup-retention`
`80f9b3d2…` — OLD == NEW co do znaku. `sync-kanon-to-robocza.ps1` `HEAD:` → **ABSENT**.

## 2. Moja własna inwentaryzacja ścieżek (reguła a)

`$projRoot` = korzeń repo w obu wariantach wyprowadzenia (`Split-Path` ×2 z
`gra/tools`) — zweryfikowane osobno dla `publish-*` (l.9–11) i `cleanup` (l.10).

### `publish-kanon-snapshot.ps1` — 20 ścieżek

| ścieżka | rola | dziś w repo | werdykt |
|---|---|---|---|
| `gra-robocza/` | źródło `Copy-Item -Recurse` l.30 | **TAK** (tracked) | OK |
| `gra-robocza/Gra-ROBOCZA.html` | warunek wstępny l.18, `throw` | **TAK** | OK |
| `gra-kanon/` | **cel, tworzony** l.30; l.25 `Test-Path` przed `Remove-Item` | NIE | OK — zgodne z pkt 4 dispatchu |
| `gra-kanon-archiwum` (`$archiveRoot` l.13) | **przypisany, nigdy nieużyty** | NIE | nota N1 |
| 8 par rename l.33–40 | `Rename-Item` pod `Test-Path` l.44 | **2 z 8 źródeł istnieje** | patrz N2 |
| `gra-kanon/ROBOCZA-MANIFEST.json` | usuwany l.47, guard | powstanie z kopii (`gra-robocza/ROBOCZA-MANIFEST.json` **TAK**) | OK |
| `gra-kanon/KANON-MANIFEST.json` | zapis l.56 | tworzony | OK |
| `gra-kanon/START.html` | zapis l.72 | tworzony | OK |
| `gra/tools/inject-build-stamp.ps1` | wywołanie l.75, `-Tier KANON` | **TAK** | OK |
| `gra/tools/cleanup-retention.ps1` | wywołanie l.77, `-Execute` | **TAK po tej zmianie** | OK |
| `START-GRA.html` (korzeń) | nadpisanie l.94 | **TAK** | idempotentne — potwierdzone |

**Kontrola pozytywna zamiast wiary w kod:** porównałem
`git ls-tree 39ae5d17:gra-kanon` z dzisiejszym `ls gra-robocza`. Historyczny kanon
ma dokładnie układ, jaki produkuje l.30+l.42–45: `CLAUDE.md`,
`JEDNOSTKI-DO-POPRAWY-staty.md`, `LISTA-JEDNOSTEK-HP-ATAK-OBRONA.md`,
`konfigiKopiaMaster`, `srcKopiaMaster`, `data — kopia`, `tools` — plus
`Gra-KANON*.html` i `KANON-MANIFEST.json`, **bez** `ROBOCZA-MANIFEST.json`.
To empiryczny dowód, że `Copy-Item` do nieistniejącego celu daje zamierzony układ
i że `gra-kanon/` nie jest warunkiem wstępnym, tylko produktem.

`START-GRA.html`: porównałem heredoc l.79–94 z plikiem na dysku znak po znaku
(`cat -A`) — treść identyczna, plik ma BOM, `Set-Content -Encoding UTF8` w
Windows PowerShell 5.1 też pisze BOM. Nadpisanie jest bezstratne.

### `publish-finalna-snapshot.ps1` — 4 ścieżki

`gra-kanon/Gra-KANON.html` (**NIE ma dziś** → `throw` l.19 z nazwą właściwego
narzędzia: kontrolowana odmowa, kolejność łańcucha), `Gra-FINALNA.html` w korzeniu
(**TAK, tracked** — to ten plik, który zostawał bez narzędzia promocji, znalezisko F1),
`gra/tools/inject-build-stamp.ps1` (**TAK**), `$projRoot`.

### `cleanup-retention.ps1` — 6 ścieżek

`gra-kanon-archiwum` NIE · `_backup` NIE · `gra\_backup` **TAK** (tracked; literał
z backslashem — na Windows rozwiąże się poprawnie, na Linuksie `Test-Path` da fałsz
i gałąź zostanie pominięta) · `gra-robocza-kopia` NIE · rekurencja `*.bak*` po całym
`$projRoot` · `$dir` z pipeline'u. **Każda gałąź osłonięta `Test-Path`.**

Policzyłem `*.bak*` sam: `find . -path ./.git -prune -o -name '*.bak*'` → **0**;
`git ls-files | grep '\.bak'` → **0**. `gra/_backup` zawiera dwa pliki
(`.helmprobe.txt`, `units.ts.TRUNC-as-found-b6`) — żaden nie pasuje do filtra.
**Dziś skrypt jest no-opem, ale nie strukturalnie**: gałąź 3 ma żywy katalog i przy
pierwszym `*.bak*` zacznie kasować pliki z drzewa roboczego — to zamierzone
(retencja D3A), odnotowuję, bo woła to `publish-kanon` automatycznie z `-Execute`.

**Notę Operatora o `$script:seenBakGroups` (l.57 vs l.63) potwierdzam i uściślam.**
Przy zerowej liczbie `*.bak*` `ForEach-Object` nie wykona się ani razu, zmienna
pozostanie nieustawiona, a l.63 czyta `$null.Keys`. Sprawdziłem, czy coś w łańcuchu
podnosi rygor: **`Set-StrictMode` nie występuje w żadnym z trzech skryptów ani w
`inject-build-stamp.ps1`** (`grep` po `gra/tools/*.ps1`). Bez StrictMode `$null.Keys`
zwraca `$null`, `foreach` iteruje zero razy — **przejdzie**. Ryzyko jest realne
wyłącznie przy profilu użytkownika ustawiającym StrictMode; wtedy `$ErrorActionPreference
= 'Stop'` przerwie promocję na `publish-kanon:77`. Zgadzam się z decyzją, żeby nie
poprawiać nieprzetestowanego skryptu deploy-class — nota jest właściwą formą.

## 3. Reguła b — czy nie odtworzono za dużo, i czy słusznie pominięto

**`sync-kanon-to-robocza.ps1` — potwierdzam NIE-odtworzenie, trzy powody sprawdzone osobno:**

1. l.11 `throw "Brak gra-kanon/Gra-podglad.html"`. Sprawdziłem bazę:
   `git ls-tree -r 39ae5d17 -- gra-kanon | grep Gra-podglad` → **pusto**. W kanonie
   `39ae5d17` są wyłącznie `Gra-KANON*.html`. Skrypt był **martwy już przed
   sprzątaniem** — wywaliłby się w pierwszej instrukcji wykonawczej.
2. l.89 nadpisałby `gra-robocza/START.html`. Odczytałem `publish-robocza-snapshot.ps1`
   — komentarz brzmi dosłownie: „START.html w gra-robocza/ — utrzymywany ręcznie
   (hub playtestów); publish nie nadpisuje". Sprzeczność z żywym narzędziem
   potwierdzona. Dodatkowo l.100 nadpisuje `ROBOCZA-MANIFEST.json` poza deployem,
   a l.102 celuje w `Gra-podglad-ROBOCZA.html` (w korzeniu jest tylko
   `Gra-podglad-POLE-BITWY.html`).
3. Jedyne żywe odwołanie: `dyspozycje/_handoff/MASTER-do-UI_miasto-krok3-A-2026-07-03.md`.
   Sprawdziłem nagłówek: `l.3` → **`STATUS: ANULOWANY (2026-07-03)`**. Reszta trafień
   to raporty runów. Kierunek wsteczny KANON→ROBOCZA nie jest częścią GOAL.

**Nic zbędnego nie wróciło.** `gra/tools/*.ps1` ma dziś 15 plików; przybyły dokładnie 3.

## 4. Reguła c — łańcuch wywołań kompletny

`publish-kanon:77` → `& (Join-Path $PSScriptRoot 'cleanup-retention.ps1') -Execute
-KanonArchiwumKeep 5 -BackupHtmlKeep 3 -RoboczaKopiaDaysKeep 7`. Plik **istnieje**
po zmianie, a jego blok `param()` l.2–7 przyjmuje **wszystkie cztery** przekazane
parametry co do nazwy i typu (`[switch]$Execute`, trzy `[int]`). Zgodność sprawdzona
argument po argumencie, nie samą obecnością pliku.

`publish-kanon:75` i `publish-finalna:28` → `inject-build-stamp.ps1`. Plik istnieje,
`param()` ma `[Parameter(Mandatory)][string]$HtmlPath`,
`[ValidateSet('ROBOCZA','KANON','FINALNA')][string]$Tier`, `[string]$Md5` — obie
wartości `-Tier` przechodzą walidację. **`ValidateSet` z `KANON` i `FINALNA` w
ocalałym narzędziu to niezależne potwierdzenie, że oba poziomy były żywe** — zgodne
z ECHO właściciela.

**Łańcuch ROBOCZA → KANON → FINALNA jest po tej zmianie kompletny i domknięty.**

## 5. Reguła d — `WERSJE.md` opisuje stan faktyczny

`dyspozycje/WERSJE.md` **nietknięty** — potwierdzam, że to poprawne, nie unik.
`l.7–8` nazywa `gra/tools/publish-kanon-snapshot.ps1` i
`gra/tools/publish-finalna-snapshot.ps1`; **obie ścieżki po tej zmianie istnieją**,
więc zdanie stało się prawdziwe bez edycji pliku CHRONIONEGO. Kryterium 3 spełnione.
Edycja byłaby tu szkodą: usuwałaby prawdziwy opis.

Nie poprzestałem na linii 8 — wyciągnąłem **wszystkie** nazwy `*.ps1/*.cjs/*.mjs`
z całego `WERSJE.md` (73 unikalne) i sprawdziłem każdą wobec `git ls-files`.
Nierozwiązane: `battle-smoke.cjs`, `determinizm-harness.cjs`, `rzeki-harness.cjs`
(74. trafienie `.dip-bundle.cjs` to artefakt mojego regexu, nie nazwa pliku).
Wszystkie trzy leżą w **historycznych wpisach publikacji**, nie w instrukcji
wykonawczej, i **żadna nie należy do ścieżki KANON/FINALNA** — poza allowlistą tego
tematu (dispatch pkt 3 wskazuje wyłącznie martwe odwołania F1). Zgłaszam do rejestru,
nie do naprawy tutaj.

## 6. Reguła e — żaden skrypt nie zakłada `gra-kanon/` jako warunku wstępnego

- `publish-kanon`: `gra-kanon/` **jest tworzony** (l.30), a jedyne dotknięcie przed
  utworzeniem jest pod `Test-Path` (l.25). ✔
- `publish-finalna`: **wymaga** `gra-kanon/Gra-KANON.html` — ale to **poprawna
  kolejność łańcucha**, nie martwe założenie; `throw` l.19 podaje narzędzie naprawcze. ✔
- `cleanup-retention`: `gra-kanon-archiwum` pod `Test-Path`. ✔

## 7. Reguła f — ograniczenie dowodu POTWIERDZONE niezależnie (§13a)

Sprawdziłem sam: `which pwsh powershell pwsh-preview` → **nic**;
`/usr/bin/pwsh` i `/opt/microsoft` → **nie istnieją**; `command -v dotnet` → **nic**;
`dpkg -l | grep -i powershell` → **pusto**. **Interpretera nie ma, nie da się nawet
sparsować składni bez wykonania.** Weryfikacja jest w 100% statyczna — potwierdzam
i nie obalam ograniczenia Operatora. **Żaden skrypt promocji nie został uruchomiony
ani przeze mnie, ani (wg dowodów w drzewie) przez Operatora**: `gra-kanon/` nie
istnieje, `Gra-FINALNA.html` i `START-GRA.html` nie są w diffie.

Nie jest to obejście: właściciel uruchamia te narzędzia na Windows, gdzie
`Get-FileHash`, `Rename-Item -Force` i BOM-owy `Set-Content` zachowują się tak, jak
zakłada kod. To ta sama sytuacja dowodowa, w jakiej te skrypty żyły przez cały rok
przed sprzątaniem.

## 8. Bramki — moją ręką, w `timeout`, z `/home/user/wt-ev-kanon/gra`

`node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów** (exit 0) ·
`logic-test` **213/213** · `tech-tree-test` **19 pass / 0 fail** ·
`research-test` **33/33 ALL GREEN** · `unit-replace-test` **13/13** ·
`combat-test` **6/6**. Wszystkie exit 0. `map-gen-regression-test` **nie uruchamiany**
(zakaz higieny). `node_modules` wpięte dowiązaniem na czas bramek i **usunięte po nich** —
`git status` po sprzątnięciu pusty. Zero `npm run build/dev`, zero `npx`, zero
`git add -A`, zero pushu do `main`.

## 9. Noty (nie podważają GOAL)

- **N1** — `publish-kanon:13` `$archiveRoot` przypisany i nigdy nieużyty; `gra-kanon-archiwum`
  nie istnieje. Martwa linia odziedziczona po `39ae5d17`. Nie ruszać w tym temacie:
  wymóg tożsamości bajtowej jest cenniejszy niż kosmetyka. Do rejestru.
- **N2 — KOREKTA LICZBY W RAPORCIE OPERATORA.** Operator napisał „7 z 8 par rename
  cicho pomijanych… bundle PLAYTEST/POLE-BITWY nie istnieją". Policzyłem sam:
  `gra-robocza/` zawiera **`Gra-ROBOCZA.html` ORAZ `Gra-ROBOCZA-POLE-BITWY.html`**
  (oba tracked). Pomijanych jest **6 z 8**, wykonywanych **2**; para POLE-BITWY
  **wykona się**. Artefakt bez zmian, liczba w raporcie błędna.
- **N3 — BŁĘDNA PRZESŁANKA PRZY „GRUPIE F".** Operator: „Cztery narzędzia »Grupa F« —
  żadne nie leży na ścieżce KANON/FINALNA". Odczytałem je z `39ae5d17`:
  `compare-units-kanon.cjs` celuje **wprost** w `gra-kanon/Gra-KANON.html` (l.8, 64–65)
  i **`Gra-FINALNA.html` (l.10)** — dokładnie w dwa artefakty tego tematu, nazwami
  żywymi, nie wycofanym torem `Gra-podglad`. Pozostałe trzy potwierdzam jako tor
  `Gra-podglad` (`bramka-test-publish` l.9/11, `audyt-abc-handoff` l.114,
  `check-pole-bundle` l.4–6) — martwe. **Sam werdykt „nie odtwarzać" podtrzymuję**:
  `compare-units-kanon.cjs` to diagnostyka, nikt jej nie woła, łańcuch promocji jej nie
  potrzebuje, a §14 zakazuje poszerzania zakresu. **Uzasadnienie jednak jest nieprawdziwe
  i musi zostać sprostowane w rekordzie** — dispatch pkt 5 wprost przewidywał ten
  przypadek. Rekomendacja: osobny temat/pytanie do właściciela, czy chce z powrotem
  diagnostykę porównawczą KANON/FINALNA.
- **N4** — `git diff --stat` daje **390** insercji, raport Operatora mówi **376**
  (liczba sprzed doszlifowania własnego raportu). Kosmetyczne, ale to liczba podana
  jako dowód zakresu.
- **N5** — `gra-robocza/` niesie dziś `START-FALA199/200/201.html`, które trafią do
  `gra-kanon/` bez zmiany nazwy (nie ma ich na liście rename). Skutek historyczny,
  nie regresja tej zmiany.

## 10. Werdykt

Artefakt jest **poprawny**: trzy właściwe skrypty, bajtowo identyczne, łańcuch
wywołań domknięty, żadna ścieżka nie jest ślepa, `gra-kanon/` tworzony a nie
zakładany, `WERSJE.md` prawdziwy bez edycji pliku chronionego, granice §9
nienaruszone, bramki zielone. Odrzucenie `sync-kanon-to-robocza.ps1` jest
**niezależnie udowodnione**, nie przyjęte na słowo.

Braki dotyczą **wyłącznie rekordu**, nie kodu: dwie liczby (N2, N4) i jedna błędna
przesłanka przy narzędziu, którego werdykt mimo to podtrzymuję (N3). Żadna nie
zmienia zawartości gałęzi, więc odsyłanie do Operatora kosztowałoby rundę bez
zmiany artefaktu. → **PASS-WITH-NOTES**, z wnioskiem, żeby Final Control
sprostował N2 i N3 w rekordzie i zdecydował o rejestracji N1/N3/N5.

## 11. Raport terminalny

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-REPO-SCIEZKA-KANON-FINALNA-Q1
GOAL: odtworzyć oprzyrządowanie poziomów wydań KANON i FINALNA usunięte przy sprzątaniu repo i uzgodnić dokumentację ze stanem faktycznym
ZMIANY-COMMIT: weryfikowany `fbb60e0b` (4 A / 390 ins / 0 del od `origin/main`); mój commit = wyłącznie ten plik
TESTY: tsc 0 błędów · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 · combat 6/6 — wszystkie moją ręką, exit 0; PowerShell NIEURUCHAMIALNY (brak pwsh/powershell/dotnet — sprawdzone), weryfikacja statyczna §13a
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Final Control, runda 1
DEPLOY-PUSH: NIE WYKONANO
