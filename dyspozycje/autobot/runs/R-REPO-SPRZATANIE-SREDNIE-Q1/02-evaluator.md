# 02 — EVALUATOR (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-REPO-SPRZATANIE-SREDNIE-Q1
MODEL+EFFORT: Opus 5, effort high
GOAL: Usunąć z repo 591,8 MB w 4096 plikach śledzonych, których obecna gra nie
potrzebuje, tak żeby gra działała identycznie i bramki były zielone.
(§16a pkt 9: GOAL Operatora = GOAL dispatchu, bez przesunięcia.)

Worktree: `/home/user/wt-ev-sprzatanie` (detached @ `ee5141b2`; gałąź trzyma worktree
Operatora, więc założony przez `--detach` od `origin/autobot/...`). `gra/node_modules`
= symlink do `/home/user/The-Game/gra/node_modules` (nie jest śledzony).
Wszystkie liczby niżej odtworzone MOJĄ ręką, żadna nie przepisana z 01-operator.md.

## 1. SCOPE — co usunięto (kryterium 1 i 7)

`git merge-base origin/main HEAD` = `39ae5d17` (= `origin/main`). Diff od merge-base:
**4115 D + 6 M + 1 A**, gdzie A = `01-operator.md`.

Liczby per wiersz tabeli, liczone z `git ls-tree -r -l 39ae5d17` — zgodne CO DO ZNAKU:

| Wiersz | Plików | MB | Tabela |
|---|---|---|---|
| `gra-robocza/Gra-ROBOCZA-PLAYTEST-*.html` | 8 | 280,3 | 8 / 280,3 ✔ |
| `gra-kanon/` | 606 | 107,0 | 606 / 107,0 ✔ |
| `docs/ux/` | 2928 | 177,5 | 2928 / 177,5 ✔ |
| `docs/archiwum-czatow/` | 51 | 13,4 | 51 / 13,4 ✔ |
| `_archiwum/` | 19 | 8,2 | 19 / 8,2 ✔ |
| `_backup/` | 484 | 5,4 | 484 / 5,4 ✔ |
| RAZEM | **4096** | **591,8** | ✔ |

Ponad tabelę: 9 × `gra-robocza/tools — kopia/` + 10 × `gra/tools/*` = 4115.

**Filtr odwrotny** (usunięte ścieżki NIE pasujące do prefiksów tabeli + `gra/tools/`
+ `tools — kopia/`) — **zbiór pusty**. Zero trafień z `gra/src`, `gra/data`,
`dyspozycje/`, `docs/decyzje/`, `docs/master/`, `docs/encyklopedia/`.

**Kontrola w drugą stronę** (kryterium c) — `git ls-files` na HEAD dla każdego prefiksu
tabeli: `gra-kanon` 0, `docs/ux` 0, `docs/archiwum-czatow` 0, `_archiwum` 0, `_backup` 0,
`tools — kopia` 0, `Gra-ROBOCZA-PLAYTEST-*` 0. Nic z tabeli nie zostało.

Rozmiar śledzony: `39ae5d17` = 8557 plików / 856 299 052 B (816,6 MB) → HEAD = 4443 plików /
234 867 630 B (224,0 MB). **Ubyło 621 431 422 B = 592,6 MB.** (Operator podał 592,7 MB /
621 445 917 B — różnica 14 495 B to jego własny raport, którego nie doliczył. Bez znaczenia,
oba > 591,8 MB.)

`gra/_backup/` (2 pliki) **nie jest** wierszem tabeli (tabela mówi o `_backup/` w korzeniu,
484 pliki — wszystkie 484 usunięte stamtąd). Pozostawienie poprawne.

## 2. Granice §9 i bariery dispatchu

- `md5sum gra-robocza/Gra-ROBOCZA.html` = `04a7adcba9c0d6df1490c6842ba46f96` ✔ (kryterium 2).
- `git diff 39ae5d17 HEAD -- gra/src gra/data`: `gra/data` **pusty**; `gra/src` = 6 plików,
  16 linii `+` / 4 `−`, **każda wewnątrz bloku `/** … *​/` i każda zaczyna się od ` * `**.
  Obejrzane naocznie linia po linii (kryterium 3) — zero kodu wykonywalnego. Pliki:
  `render/miasto-kamien.ts`, `ui/cityAttackChoice.ts`, `ui/icons/brandAssets.ts`,
  `ui/leaderPortraits.ts`, `ui/preBattle.ts`, `ui/techIcons.ts` — dokładnie sześć z dispatchu.
- Nietknięte: `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
  `gra-robocza/START.html`, `docs/decyzje/**`, `docs/master/**`, `docs/encyklopedia/**`,
  `dyspozycje/**` poza `runs/<ID>/`. Historia nieprzepisana, brak `git add -A`, brak `npx`,
  brak `npm run build/dev`.
- Skan sekretów po liniach `+` całego diffu (§16a pkt 5): **zero trafień**.

## 3. Bramki — uruchomione MOJĄ ręką, w moim worktree, każda w `timeout`

Referencyjne (kryterium 4):
`tsc --noEmit` → **0 błędów** · `logic-test` **213/213** · `tech-tree-test` **19 pass, 0 fail** ·
`research-test` **33/33** · `unit-replace-test` **13/13** · `combat-test` **6/6**.

Tematy zamknięte w serii (kryterium 5):
`praca-jeden-podzial-kontrakt-test` **634 OK / 0 FAIL** · `praca-jeden-podzial-real-render-test`
**36 pass / 0 fail** · `ai-jednostki-tylko-zakup-test` **44 passed / 0 failed** ·
`build-panel-ulepszenia-scroll-real-render-test` **43 pass / 0 fail** ·
`dyplo-pakt-ekspansja-granica-test` **26/26 passed** · `praca-cap-migracja-luka-test`
**11 passed / 0 failed**.

`zelazo-zrzuty-25-jednostek-render.cjs --no-shots` → **59 pass / 0 fail**, nie 61.
**Potwierdzam korektę Operatora, ale INNYM pomiarem niż jego** (reguła (d)): uruchomiłem tę
samą bramkę z `--no-shots` na commicie BAZOWYM `39ae5d17` (w `/home/user/The-Game`) —
**również 59/0, przed jakąkolwiek kasacją**. Do tego odczyt źródła: `NO_SHOTS` (l. 76),
blok `if (!NO_SHOTS)` (l. 457), checki `(B1)` (l. 664) i `(C1)` (l. 666) leżą wewnątrz tego
bloku. Wniosek: **61 to wartość dla przebiegu ZE zrzutami; 59 jest poprawną wartością
odniesienia dla `--no-shots`. To błąd wartości w dispatchu, nie regresja sprzątania.**

`map-gen-regression-test` — nieuruchamiany (zakaz dispatchu).

## 4. Build (kryterium 6, moje własne)

`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ev --emptyOutDir`
(kanon C-001, nigdy `npm run build`) → **✓ built in 23.69s, 848 modules transformed**,
`/tmp/civ-dist-ev/index.html` 37 475 193 B, exit 0. Skasowanie `docs/ux/` niczego nie złamało.

## 5. Osiem narzędzi zależnych od `gra-kanon` (kryterium d) — mierzone inaczej niż u Operatora

Operator dowodził przez „zero wywołań w bramkach §6 / `package.json` / CI / `.cursor` / `.claude`".
Ja zmierzyłem inaczej: **`git grep` po CAŁYM drzewie na HEAD, ograniczony do plików
wykonywalnych i konfiguracyjnych** (`*.cjs *.mjs *.ts *.js *.json *.ps1 *.yml *.html
.gitattributes`) — bo interesuje mnie nie „czy ktoś to woła w bramce", tylko „czy cokolwiek
w repo jeszcze na to wskazuje w sposób wykonywalny".

Wynik: `git grep -E '<10 nazw narzędzi>' HEAD -- <pliki wykonywalne>` → **jedno trafienie**:
`gra/tools/publish-robocza-snapshot.ps1:5` — i to **komentarz**
(`# Master NIE używa tego skryptu do finalnej — publish-kanon-snapshot.ps1`), nie wywołanie.
Dodatkowo `git grep -l 'gra-kanon' HEAD -- gra/tools` → **zero plików**: żadne pozostawione
narzędzie nie odwołuje się już do kanonu. Werdykt Operatora (8 × MARTWE, usunąć) ma pokrycie.

**Ostrzeżenie o moim własnym błędzie pomiaru (§13b):** pierwsze podejście zrobiłem
`git grep … 39ae5d17 -- . ':!…'` z pathspecami wykluczającymi i dostałem **zero trafień dla
wszystkich dziesięciu narzędzi** — fałszywy negatyw, pathspec z myślnikiem/globem cicho
wyzerował wyszukiwanie. Wychwycone kontrolą sanity (znany hit `bramka-test-publish`
w `DYSPOZYCJA-STALA-SILNIK.md`). Liczby wyżej pochodzą z poprawionego, zweryfikowanego
przebiegu. Zapisuję, bo „zero trafień" bez sanity-checku to typowy sposób, w jaki taka
weryfikacja przechodzi w samooszukiwanie.

**Nota §7 (5) Operatora — POTWIERDZAM, niezależnie.** `docs/decyzje/DYSPOZYCJA-STALA-SILNIK.md`
KROK C wskazuje na usunięty `gra/tools/bramka-test-publish.ps1`. Dowód, że tor „Grupa F" był
martwy **już przed tą zmianą**: KROK D tego samego dokumentu wskazuje na
`Gra-podglad-ROBOCZA.html`, a `git ls-tree -r 39ae5d17` **nie zna tego pliku** — dokument był
nieaktualny przed sprzątaniem. Usunięcie narzędzia nie podcina żadnej żywej procedury.
`docs/decyzje/**` jest chroniony — poprawka to osobny temat.

## 6. Dwanaście narzędzi `docs/ux` pozostawionych (kryterium 6) — sprawdzone same

`git grep -l 'docs/ux' HEAD -- gra/tools` → 12 plików. Przejrzałem każdy pod kątem
„czyta z `docs/ux`" vs „pisze do `docs/ux`":

- 8 używa `docs/ux` **wyłącznie jako katalogu WYJŚCIOWEGO** tworzonego
  `mkdirSync(OUT,{recursive:true})` (`baseline-screenshots-B/E/grupa-b/grupa-c/grupa-d`,
  `capture-trade-basket-preview`, `preview-city-ui-screenshots`,
  `preview-unit-side-panel-screenshots`) — brak ścieżki nie jest błędem, katalog powstaje.
- 2 polle (`poll-claude-design.mjs`, `poll-figma-review.mjs`) czytają przez `existsSync(...)`
  z gałęzią „nie ma → pomiń".
- `capture-palisada-wdrozenie.cjs` ma kontrolowany guard (`existsSync` → komunikat +
  `process.exit(1)`), nie wywala się na stack trace.
- `.unit-panel-preview-entry.ts` — sama wzmianka w komentarzu.

**Żadne z 12 nie czyta pliku z `docs/ux` bez guarda.** Kryterium 6 spełnione.

**Rozszerzenie zakresu Operatora (2 narzędzia figma) — ZATWIERDZAM.** Sprawdziłem treść obu
na `39ae5d17`: `export-figma-frames-c.mjs` robi `page.goto(url)` na
`docs/ux/figma/grupa-C/FIGMA-FRAMES-C.html`, a `export-figma-review-assets.mjs` na
`docs/ux/figma/02-icons/preview-tier1-5.html` i `.../E-01-PO-REFERENCJA.html` — w obu
`existsSync` chroni **tylko katalog wyjściowy**, nigdy pliku wejściowego. Po kasacji `docs/ux`
padłyby na brakującej ścieżce → pozostawienie ich byłoby naruszeniem kryterium 6.
Mieszczą się w allowliście dispatchu (`gra/tools/*`).

## 7. NOTY — rzeczy, których Operator nie zgłosił albo zgłosił nieściśle

**(N1) MARTWE LINKI W CHRONIONYM HUBIE — najważniejsza nota.** Operator zgłosił
„`START-GRA.html:12`". **Taki plik w tym repo nie istnieje** (`ls` i `git ls-files` — brak).
Realny problem jest gdzie indziej i jest większy: `gra-robocza/START.html` ma **16 linii
odwołań do 8 usuniętych bundli PLAYTEST** (8 `href` + 8 `card-meta` z md5), identycznie
`gra-robocza/START-FALA201.html`. To hub, który właściciel faktycznie otwiera — po integracji
**8 kafli w nim będzie prowadzić donikąd**. `START.html` i `ROBOCZA-MANIFEST.json` są jawnie
chronione dispatchem (a generuje je `gra-robocza/tools/generate-start-hub.cjs`, który też
dopisuje do manifestu) — **nie wolno tego naprawić w tym temacie**. Do rejestru jako osobny
temat, do wykonania PRZED albo RAZEM z integracją, inaczej właściciel zobaczy zepsuty hub.

**(N2) Uzasadnienie wiersza 1 tabeli jest nieścisłe — potwierdzam Operatora, moim pomiarem.**
md5 ośmiu usuniętych bundli, liczone z `git show 39ae5d17:<ścieżka>`:
`04a7adcba9c0` — MAPA, MIASTO (= bieżący `Gra-ROBOCZA.html`);
`28d236f57d2e` — WALKA, ODSKOK, ODSKOK-OBLEZENIE, OBLEZENIE-3v3;
`95021308eb1e` — BITWA-DUZA, OBLEZENIE-DUZE.
Czyli **tylko 2 z 8 były kopią bieżącego bundla**, nie 8. Dodatkowo lista `names` w
`gra-robocza/tools/sync-playtest-bundles.cjs` (l. 11–17) zna **6 nazw** i nie zawiera
`BITWA-DUZA` ani `OBLEZENIE-DUZE`. Zapis tabeli „Odtwarzalne jedną komendą" jest więc
**fałszywy dla 2 z 8 plików, a dla pozostałych 6 odtwarza bieżący bundel, nie ten historyczny**.
Nie łamie to tabeli (właściciel wybrał wariant średni świadomie), ale ma konsekwencję dla
KOLEJNEJ bramki: **`git filter-repo` skasuje te treści nieodwracalnie**. Orkiestrator musi to
postawić właścicielowi przed bramką przepisania historii, nie po.

**(N3) `.gitattributes:17`** — `gra-kanon/*.html   -text` to reguła bez celu. Nieszkodliwa
(gitattributes na nieistniejącej ścieżce jest no-op), poza allowlistą tematu. Do sprzątnięcia
przy okazji.

**(N4) `dyspozycje/autobot/playbook.json:235`** — treść reguły C-015 wymienia `gra-kanon/`.
Dispatch dopuszczał ten plik w allowliście, ale **Operator słusznie go nie tknął**: §9 pkt 7
zakazuje ręcznej edycji `playbook.json` (jest generowany z `playbook.md`), a §9 pkt 4 zakazuje
zmiany procesu w allowliście tematu produktowego. Poprawka C-015 = osobny temat `PROCESS`.

**(N5) Limit raportu.** 01-operator.md w polu terminalnym przekracza ~400 słów z §11 —
`PASS-WITH-NOTES`, nie `FAIL` (§11 wprost).

## 8. Werdykt

Kryteria 1–7 spełnione i **odtworzone niezależnie**: zakres domknięty w obie strony,
591,8 MB tabeli usunięte co do znaku (faktycznie 592,6 MB z rozszerzeniem), md5 gry
niezmienione, `gra/src` wyłącznie komentarze, 13 bramek zielonych, build vite przechodzi,
żadne pozostawione narzędzie nie pada na brakującej ścieżce.

`PASS-WITH-NOTES`, nie `PASS`, z powodu **(N1)** — chroniony `START.html` zostanie
z 8 martwymi kaflami i to jest widoczne dla właściciela — oraz **(N2)**, które musi być
rozstrzygnięte przed bramką `filter-repo`. Obie noty leżą **poza allowlistą tego tematu**,
więc nie są wadą wykonania Operatora; są warunkami brzegowymi dla orkiestratora.

## Raport terminalny

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-REPO-SPRZATANIE-SREDNIE-Q1
GOAL: usunąć 591,8 MB / 4096 plików śledzonych wg tabeli dispatchu, bez zmiany zachowania gry, z zielonymi bramkami
ZMIANY/COMMIT: weryfikacja `ee5141b2`; własny commit = tylko ten raport
TESTY: patrz §3 — 13 bramek + tsc + build vite, wszystkie uruchomione w `/home/user/wt-ev-sprzatanie`
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO — wyłącznie gałąź tematu
