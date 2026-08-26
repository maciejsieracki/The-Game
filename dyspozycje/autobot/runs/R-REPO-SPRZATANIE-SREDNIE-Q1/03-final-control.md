# 03 — FINAL CONTROL (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: `R-REPO-SPRZATANIE-SREDNIE-Q1`
MODEL+EFFORT: Opus 5, effort **high**
GOAL: usunąć z repo 591,8 MB / 4096 plików śledzonych wg tabeli dispatchu, bez zmiany
zachowania gry i z zielonymi bramkami.

Worktree: `/home/user/wt-fc-sprzatanie` (detached od `5929929d`, po `git fetch`).
Wszystko niżej uruchomione MOJĄ ręką, nie odczytane z raportów.

## 1. SCOPE — odtworzony trzeci raz, niezależnie

`merge-base(origin/main, HEAD)` = `39ae5d17`. Diff: **4115 D + 6 M + 2 A**
(A = wyłącznie `01-operator.md`, `02-evaluator.md`).

Filtr odwrotny po prefiksach tabeli + `gra/tools/` → **zbiór pusty** (0 trafień).
Liczby i MB per wiersz z `git ls-tree -r -l 39ae5d17` — zgodne **co do znaku**:

| wiersz | plików | MB |
|---|---|---|
| `Gra-ROBOCZA-PLAYTEST-*.html` | 8 | 280,3 |
| `gra-kanon/` | 606 | 107,0 |
| `docs/ux/` | 2928 | 177,5 |
| `docs/archiwum-czatow/` | 51 | 13,4 |
| `_archiwum/` | 19 | 8,2 |
| `_backup/` | 484 | 5,4 |
| **razem tabela** | **4096** | **591,8** |
| + `gra-robocza/tools — kopia/` | 9 | 0,9 |
| + 10 martwych narzędzi `gra/tools/` | 10 | ~0 |

Rozmiar śledzony **816,6 MB → 224,0 MB**, ubyło **592,7 MB** (621 447 009 B);
plików 8557 → 4444. Z prefiksów tabeli na HEAD nie został **ani jeden** plik.

## 2. Granice nienaruszalne (§9) i kryteria 2–3

- `md5sum gra-robocza/Gra-ROBOCZA.html` = **`04a7adcba9c0d6df1490c6842ba46f96`** ✔
- `gra/src` = 6 plików, **16+/4−**, przeczytane naocznie linia po linii: **każda
  zmiana leży wewnątrz bloku JSDoc `/** … *​/`**, zero zmian w kodzie wykonywalnym.
  `gra/data` — diff pusty. Komentarze nie kłamią: mówią, że ścieżka jest
  historyczna, i podają `git show 39ae5d17:<sciezka>`.
- Skan sekretów w diffie AM: **zero** (jedyne trafienie regexu to słowo „tokeny”
  o tokenach designu).
- Historia nieprzepisana, `origin/main` nadal `39ae5d17`, zero `npm run build/dev`,
  zero `npx`, zero `git add -A`.

## 3. Bramki — wszystkie MOJĄ ręką, w `timeout`, z `gra/`

`tsc --noEmit` **0 błędów** · logic **213/213** · tech-tree **19/0** ·
research **33/33** · unit-replace **13/13** · combat **6/6** ·
kontrakt **634 OK / 0 FAIL** · real-render **36/0** · ai-zakup **44/0** ·
scroll **43/0** · dyplo **26/26** · cap-migracja **11/0**.

### 3a. KOREKTA KOREKTY — wartość odniesienia `zelazo` 61 jest POPRAWNA

Operator i Evaluator zgłosili 59/0 z `--no-shots` i **wnieśli o poprawienie
wartości odniesienia z 61 na 59**. Zrobiłem to, czego żaden z nich nie zrobił:
uruchomiłem bramkę **z zrzutami**, na posprzątanym HEAD:

```
node tools/zelazo-zrzuty-25-jednostek-render.cjs --out /tmp/claude-0/zelazo-fc
=== WYNIK: 61 pass / 0 fail ===
```

Playwright **jest** dostępny w tej piaskownicy. `(B1)` l. 664 i `(C1)` l. 666 są
w `if (!NO_SHOTS)` (l. 457) — więc `--no-shots` z definicji pomija dwa checki.
**Dispatch miał rację, obaj poprzednicy pomylili zredukowane wywołanie z błędną
referencją.** Kryterium 5 jest spełnione w pełnym brzmieniu, **bez korekty
dispatchu**. Dodatkowo: `git diff 39ae5d17 HEAD -- gra/tools/` to **same
usunięcia** — harness `zelazo` jest bajtowo nietknięty, więc regresja była
strukturalnie niemożliwa.

## 4. Rzecz, której nie zrobili poprzednicy — pełny skan martwych referencji

`git diff --name-only --diff-filter=D` (4115 nazw) → grep po wszystkim, co ZOSTAJE.

### 4a. Kryterium 6 — WERYFIKACJA POZYTYWNA

Pełny sweep plików wykonywalnych (`*.cjs *.mjs *.ts *.js *.py *.ps1 *.sh`) dał
**24 ocalałe pliki** wspominające usunięte ścieżki. Sprawdzone co do sztuki:

- **19** używa `docs/ux/…` **wyłącznie jako katalogu WYJŚCIOWEGO**, z
  `mkdirSync(OUT,{recursive:true})` / `New-Item -Force` / `Test-Path` przed
  zapisem (`baseline-screenshots-{B,E,grupa-b,grupa-c,grupa-d}`,
  `preview-city-ui`, `preview-unit-side-panel`, `capture-trade-basket`,
  `tools/sync-design-github.ps1`, …) — **odtwarzają katalog, nie czytają go**.
- **2 polle** (`poll-claude-design.mjs`, `poll-figma-review.mjs`) — ścieżki są
  celem obserwacji, brak = pusty wynik, nie wyjątek.
- **`publish-robocza-snapshot.ps1`** — **kopiuje** bundel DO nazw PLAYTEST,
  niczego z nich nie czyta → odtwarza 6 z 8.
- **`capture-palisada-wdrozenie.cjs`** — jedyny, który czytał usunięty plik
  (`docs/ux/preview-palisada/_tmp/preview-wdrozenie.html`, **był śledzony**).
  Ma jawny guard `existsSync` → `exit 1` z komunikatem podającym komendę
  odtwarzającą, a jej generator **`gra/tools/build-palisada-preview.cjs` ocalał**.
  Kontrolowana odmowa z drogą wyjścia, nie wywalenie się.

**Werdykt kryterium 6: SPEŁNIONE.** Żadne ocalałe narzędzie nie pada na braku ścieżki.

### 4b. Osiem narzędzi kanonu — łańcuch wywołań sprawdzony

Odczytałem treść każdego z `39ae5d17`. Wszystkie osiem są związane z `gra-kanon/`
źródłem albo celem; `publish-kanon-snapshot.ps1` **odtworzyłby** skasowany katalog.
Zweryfikowałem też argument kaskady Operatora: `publish-kanon-snapshot.ps1:77`
faktycznie woła `& cleanup-retention.ps1 -Execute` — `cleanup-retention` szło za
jedynym wołającym. Tabela §2 raportu Operatora jest **rzetelna co do sztuki**
(sam odnotował, że `check-pole-bundle.cjs` „działało”, i usunął je z powodu zera
wywołań, nie martwoty) — usunięcie mieści się w literze allowlisty.

### 4c. MARTWE REFERENCJE — jawna lista (§13a: nazywam, nie ukrywam)

Żadnej z nich Operator **nie mógł** naprawić — wszystkie leżą w plikach
chronionych (`dyspozycje/**`, `docs/decyzje/**`, `docs/master/**`,
`gra-robocza/START.html`) albo poza allowlistą tematu.

| # | Gdzie | Co jest martwe | Waga |
|---|---|---|---|
| **F1** | `dyspozycje/WERSJE.md:8` (CHRONIONY, aktywny rejestr) | nazywa `publish-kanon-snapshot.ps1` i `publish-finalna-snapshot.ps1` — **oba usunięte**. `Gra-FINALNA.html` **zostaje w repo bez żadnego narzędzia promocji**. Owner-fact z `playbook.md` §1 („trzy poziomy: ROBOCZA → KANON → FINALNA”) traci oprzyrządowanie dwóch poziomów | **NAJWAŻNIEJSZA** |
| **F2** | `gra-robocza/START.html` **i `gra-robocza/START-FALA201.html`** | po **16** odwołań do 8 usuniętych bundli w KAŻDYM → 2×8 martwych kafli w hubie właściciela. Evaluator zgłosił tylko `START.html` — **drugi hub jest nowym znaleziskiem** | wysoka (UX właściciela) |
| **F3** | `docs/decyzje/DYSPOZYCJA-STALA-SILNIK.md:20` + `docs/master/INDEX-PLIKOW.md:90`, `AUDYT-2026-06-27.md:82`, `protokoly/MASTER-SILNIK.md:84` | `bramka-test-publish.ps1`. **Potwierdzam niezależnie tor „Grupa F” jako wycofany PRZED tym tematem**: jego cele `Gra-podglad.html`, `Gra-podglad-ROBOCZA.html`, `Gra-podglad-TEST.html` **nie istnieją już w bazie `39ae5d17`** | średnia (martwe już wcześniej) |
| **F4** | `.cursor/rules/chat-export-auto.mdc:9` (reguła always-on) | link do usuniętego `docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md`; `sync-chat-export.py` odtworzy katalog (`mkdir parents`), ale `REJESTR-CZATOW.md` przepadł | średnia |
| **F5** | `playbook.md:64` / `playbook.json:235` / `.claude/skills/civ-autobot*/SKILL.md` | C-015 mówi „bez `gra-robocza/`, `gra-kanon/` … ~810 MB” — po sprzątaniu nieaktualne. Operator **słusznie** nie tknął (§9 pkt 7 i 4) | kosmetyczna, domena PROCESS |
| **F6** | `.gitattributes:17` | `gra-kanon/*.html -text` — reguła bez adresata | kosmetyczna |
| **F7** | `gra-robocza/srcKopiaMaster/ui/{brandAssets,unitRecruitCard}.ts` | komentarze na `docs/ux/` w ocalałej kopii `src` (poza allowlistą) | kosmetyczna |
| **F8** | `check-pole-bundle.cjs` (usunięty) | działał na ocalałym `Gra-podglad-POLE-BITWY.html` (25 MB, root). Utrata sprawnej diagnostyki, której GOAL nie wymagał — ale zero wywołań, więc w literze dispatchu | nota |

Setki pozostałych trafień to dokumenty **historyczne** (`docs/archiwum/**`,
`dyspozycje/_handoff/**`, `DZIENNIK-MASTERA.md`) — narracja o przeszłości,
nie instrukcja wykonawcza. Nie zgłaszam ich jako defektów.

### 4d. Nota N2 Evaluatora — POTWIERDZONA odczytem kodu

`gra-robocza/tools/sync-playtest-bundles.cjs` zna **6** nazw (l. 12–17);
`generate-start-hub.cjs` wystawia **8** kafli (l. 15–22), w tym
`BITWA-DUZA` i `OBLEZENIE-DUZE`, których sync **nie odtworzy**.
Uzasadnienie wiersza 1 tabeli („odtwarzalne jedną komendą”) jest **fałszywe dla
2 z 8**. Treść żyje w historii Gita — i to jest właśnie powód, dla którego
**bramka `filter-repo` NIE MOŻE ruszyć, zanim właściciel tego nie rozstrzygnie**.

## 5. Próbny merge do `origin/main`

`git merge-tree --write-tree origin/main 5929929d` → exit 0, drzewo
`d59bc47b`, **zero konfliktów**. `git merge-base --is-ancestor origin/main
5929929d` → prawda: `origin/main` jest przodkiem gałęzi, merge jest trywialny.

## 6. Checklista §16b

1. `00-dispatch.md` istnieje, `GOAL` **identyczny** w dispatchu i w trzech raportach ✔
2. ID `R-REPO-SPRZATANIE-SREDNIE-Q1` to samo we wszystkich rundach ✔
3. Werdykt Evaluatora oparty na artefaktach — zweryfikowałem jego liczby własnym
   uruchomieniem; **jedyna rozbieżność to jego korekta wartości 61, którą obalam** ✔
4. §3b — patrz §7 niżej ⚠
5. Licznik rund: 1/5, bez cichego resetu, jedna gałąź, jedno ID ✔
6. `REJESTR-PROSB-I-ZADAN.md` — **BRAK WPISU o tym temacie** ⚠ (§7)
7. Temat niedzielony na węzły — nie dotyczy ✔

## 7. Ocena uwag wobec §3b

Wszystkie uwagi (N1–N4 Evaluatora oraz F1–F8 moje) dotyczą **plików chronionych
albo spoza allowlisty tematu**, są **nieuchronnym skutkiem wiążącej decyzji
właściciela** o skasowaniu tabeli i **żadna nie podważa** GOAL, dowodu, zakresu
ani granic §9: gra ma to samo md5, `gra/src` tknięty wyłącznie w komentarzach,
komplet bramek zielony w pełnym brzmieniu, żadne narzędzie się nie wywala.
Odesłanie do Operatora **zmusiłoby go do naruszenia §9** (musiałby edytować
`WERSJE.md`, `docs/decyzje/**`, `START.html`). → **klasyfikacja: KOSMETYCZNE +
osobny temat**, nie `FAIL`.

**Warunek §3b i §16b pkt 4/6 jest jednak spełniony tylko w połowie:** uwagi
**nie zostały jeszcze zapisane w rejestrze**, a `REJESTR-PROSB-I-ZADAN.md`
nie zna tego tematu. Żadna z trzech ról nie mogła tego zrobić — `dyspozycje/**`
poza raportami runu jest na liście „czego nie wolno tknąć”. **To obowiązek
orkiestratora, do wykonania W TYM SAMYM kroku integracji**, nie później:

1. wpis zamknięcia `R-REPO-SPRZATANIE-SREDNIE-Q1` w rejestrze;
2. `R-REPO-HUB-START-MARTWE-KAFLE-Q1` — F2 (oba huby, 2×8 kafli);
3. `R-REPO-SCIEZKA-KANON-FINALNA-Q1` — F1 (czy KANON/FINALNA nadal istnieją
   jako poziomy wydań; jeśli tak, trzeba odtworzyć oprzyrządowanie);
4. `R-DOCS-MARTWE-ODWOLANIA-PO-SPRZATANIU-Q1` — F3, F4, F6, F7;
5. `R-PROC-C015-PO-SPRZATANIU-Q1` (domena PROCESS) — F5;
6. **przed bramką `filter-repo`**: rozstrzygnięcie N2/§4d z właścicielem —
   2 z 8 bundli nie są odtwarzalne, a `filter-repo` czyni utratę nieodwracalną.

## 8. Raport terminalny

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-REPO-SPRZATANIE-SREDNIE-Q1
GOAL: usunąć 591,8 MB / 4096 plików wg tabeli dispatchu, bez zmiany zachowania gry, z zielonymi bramkami
ZMIANY/COMMIT: zweryfikowany `5929929d` (4115 D + 6 M + 2 A od `39ae5d17`); mój commit = wyłącznie ten plik
TESTY: tsc 0 · 213/213 · 19/0 · 33/33 · 13/13 · 6/6 · 634/0 · 36/0 · 44/0 · 43/0 · 26/26 · 11/0 · zelazo **61/0 ze zrzutami**
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora + 6 wpisów rejestrowych z §7
DEPLOY/PUSH: NIE WYKONANO

**GOTOWOŚĆ DO INTEGRACJI: TAK**
