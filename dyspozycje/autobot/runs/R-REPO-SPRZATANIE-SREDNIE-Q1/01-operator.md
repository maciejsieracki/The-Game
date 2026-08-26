# 01 — OPERATOR (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: `R-REPO-SPRZATANIE-SREDNIE-Q1`
MODEL+EFFORT: Opus 5, effort high
GOAL: Usunąć z repo 591,8 MB w 4096 plikach śledzonych (wariant średni właściciela),
tak żeby gra działała identycznie i wszystkie bramki były zielone.

Worktree: `/home/user/wt-op-sprzatanie`, gałąź `autobot/R-REPO-SPRZATANIE-SREDNIE-Q1`
od `origin/main` = `39ae5d17`. Merge-base potwierdzony: `39ae5d17`.

## 1. Co usunięte — porównanie pozycja po pozycji z tabelą dispatchu

| Pozycja tabeli | Plików wg dispatchu | Plików faktycznie | MB wg dispatchu | MB zmierzone |
|---|---|---|---|---|
| `gra-robocza/Gra-ROBOCZA-PLAYTEST-*.html` | 8 | **8** | 280,3 | **280,3** |
| `gra-kanon/` | 606 | **606** | 107,0 | **107,0** |
| `docs/ux/` | 2928 | **2928** | 177,5 | **177,5** |
| `docs/archiwum-czatow/` | 51 | **51** | 13,4 | **13,4** |
| `_archiwum/` | 19 | **19** | 8,2 | **8,2** |
| `_backup/` | 484 | **484** | 5,4 | **5,4** |
| `gra-robocza/tools — kopia/` | — | **9** | — | **0,9** |
| **RAZEM 6 pozycji liczbowych** | **4096** | **4096** | **591,8** | **591,8** |

Plus **10 martwych narzędzi** w `gra/tools/` (§2 i §3 niżej).

**Kontrola „ani jednej ścieżki więcej".** `git diff --name-status 39ae5d17 HEAD`:
4115 usunięć + 6 modyfikacji, nic innego. 4115 = 4096 (tabela) + 9 (`tools — kopia`)
+ 10 (martwe narzędzia). Filtr odwrotny — lista wszystkich usuniętych ścieżek
z odjętymi prefiksami tabeli i `gra/tools/` — zwraca **zbiór pusty**.
6 modyfikacji to wyłącznie sześć plików `gra/src` z komentarzami (§4).

`gra-robocza/tools — kopia/` to starsza kopia z ery `Gra-podglad`: 6 z 9 plików
identycznych z `gra-robocza/tools/`, 3 różne — i w każdym z tych trzech kopia jest
**starsza** (ścieżki `Gra-podglad*.html` zamiast `Gra-ROBOCZA*.html`). Nic unikalnego
nie ginie.

## 2. Osiem narzędzi zależnych od `gra-kanon/` — rozstrzygnięcie per narzędzie

Wspólny dowód martwoty (dotyczy całej ósemki): **zero wywołań** w bramkach §6
`R-PROC-AUTOBOT.md`, w `gra/package.json` (`scripts`: data/predev/prebuild/dev/build/
typecheck/serve:robocza), w CI (repo **nie ma** `.github/`), w regułach `.cursor/**`
i w skillach `.claude/**` (grep po ośmiu nazwach: `BRAK TRAFIEN`). Wszystkie wzmianki
to dokumentacja historyczna ery „Grupa A–F / Master / INTEGRATOR", zastąpionej obiegiem
AutoBot. Decyzja: **usunąć wszystkie osiem** — `gra-kanon/` skasowany.

| # | Narzędzie | Odwołanie do kanonu | Stan PRZED zmianą | Wywołania | Werdykt |
|---|---|---|---|---|---|
| 1 | `bramka-test-publish.ps1` | tylko **komentarze** (l. 2, 10, 60) | **już zepsute** — cele `Gra-podglad-ROBOCZA.html` i `Gra-podglad.html` w rootcie nie istnieją | `docs/decyzje/DYSPOZYCJA-STALA-SILNIK.md:20` (blok „Grupa F", KROK C) + archiwa | MARTWE → usunięte |
| 2 | `sync-kanon-to-robocza.ps1` | **kod**, l. 11–12 `throw "Brak gra-kanon/Gra-podglad.html"` | **już zepsute** — tego pliku nie ma w `gra-kanon/` | 1 handoff z 2026-07-03 | MARTWE → usunięte |
| 3 | `compare-units-kanon.cjs` | **kod**, l. 8–11 (`Gra-KANON.html`, `data — kopia/units.json`) | działało | **zero** poza dispatchem | MARTWE (cała funkcja = porównanie z kanonem) → usunięte |
| 4 | `publish-finalna-snapshot.ps1` | **kod**, l. 19 `throw` bez kanonu | działało | `WERSJE.md`, `KANAL-PRACA.md` — wzmianki historyczne, nie wywołania | MARTWE → usunięte |
| 5 | `cleanup-retention.ps1` | `gra-kanon-archiwum` (l. 18) + `_backup` (l. 27) | katalog `gra-kanon-archiwum` **nie istnieje**; wszystkie bloki pod `Test-Path` → nie wywala się | wołane **wyłącznie** z `publish-kanon-snapshot.ps1:77` — czyli z poz. 7 | MARTWE (idzie za jedynym wołającym) → usunięte |
| 6 | `audyt-abc-handoff.ps1` | **kod**, l. 114, ale pod `Test-Path` → drukuje `BRAK` | **już drukowało BRAK** dla obu ścieżek | `docs/obieg/*` (wycofany tor Master) | MARTWE → usunięte |
| 7 | `publish-kanon-snapshot.ps1` | **kod**: tworzy `gra-kanon/` z `gra-robocza/` | działało | brak żywych; deploy to dziś osobna bramka po `READY_FOR_DEPLOY` | MARTWE **i aktywnie szkodliwe** (odtworzyłoby 107 MB kanonu) → usunięte |
| 8 | `check-pole-bundle.cjs` | **kod**, l. 6, ale `existsSync` → drukuje `MISSING` | działało (ścieżka rootowa istnieje) | **zero** poza dispatchem | MARTWE → usunięte |

`dyspozycje/autobot/playbook.json` — **NIE tknięte, świadomie.** Jedyne wystąpienie
`gra-kanon` (l. 235) to *treść reguły* C-015 o sparse-checkoucie worktree, nie ścieżka
wykonywalna. Plik jest **generowany** z `playbook.md` (§9 granica 7: nigdy ręcznie),
a zmiana C-015 to zmiana procesu — §9 granica 4 zakazuje jej w allowliście tematu
produktowego. To osobny temat `PROCESS`.

## 3. `docs/ux` — dwa dodatkowe martwe narzędzia (poza zakresem dispatchu, w allowliście)

Dispatch wskazał zależności tylko dla `gra-kanon`. Skan wykazał **14 narzędzi w `gra/tools/`
odwołujących się do `docs/ux`**. Rozdzielone dowodem:

- **8 narzędzi „tylko wyjście"** (`baseline-screenshots-{A,B,E,grupa-b,grupa-c,grupa-d}`,
  `capture-trade-basket-preview`, `preview-city-ui-screenshots`,
  `preview-unit-side-panel-screenshots`) — każde robi `mkdirSync(OUT, {recursive:true})`
  **zanim** cokolwiek czyta. **Zostawione.** Dowód z uruchomienia:
  `node tools/preview-unit-side-panel-screenshots.cjs` **odtworzyło**
  `docs/ux/preview-unit-panel/` i padło dopiero na `browserType.launch: Executable
  doesn't exist at /opt/pw-browsers/chromium_headless_shell-1228/...` — to brak binarki
  Playwright w tej piaskownicy (INFRA), **nie** brakująca ścieżka repo. Katalog po teście
  usunięty, drzewo czyste.
- **2 narzędzia tolerancyjne** (`poll-claude-design.mjs`, `poll-figma-review.mjs`) —
  `if (!existsSync(dir)) return` / gałąź `BRAK`. **Zostawione.** Uruchomione po kasacji:
  oba `exit 0` („Propozycje: 0 · Wejście E: 0"). Pliki wyjściowe w `docs/obieg/`
  przywrócone przez `git checkout --`.
- **2 narzędzia palisady** (`capture-palisada-wdrozenie.cjs`) — wejście to *regenerowalny*
  `_tmp`; przy braku drukuje instrukcję i wychodzi kodem 1 (kontrolowany guard, nie crash).
  **Zostawione.**
- **2 narzędzia, które faktycznie by się wywaliły** — `export-figma-frames-c.mjs`
  i `export-figma-review-assets.mjs`: robią `page.goto('file://' + <plik w docs/ux/figma>)`
  bez żadnego guarda → `ERR_FILE_NOT_FOUND`. Kryterium 6 dispatchu („żadne narzędzie
  w `gra/tools/` nie wywala się na brakującej ścieżce") jest bezwarunkowe, a allowlista
  obejmuje `gra/tools/*` (usunięcie martwych narzędzi). Wywołania: zero poza dokumentacją
  wewnątrz kasowanego `docs/ux` i jednym handoffem z lipca. **Usunięte.**
  *To jedyne rozszerzenie zakresu poza literę dispatchu — do jawnej akceptacji Evaluatora.*

Poza `gra/tools/`: `.cursor/hooks/pre-compact-sync.py` (hook `preCompact`, żywy) czyta
`docs/archiwum-czatow/.../REJESTR-CZATOW.md`, ale ma `if not REJESTR.is_file(): return []`
→ po kasacji staje się **no-opem z kodem 0**, nie wywala się. `gra/tools/sync-chat-export.py`
ma `EXPORT_DIR.mkdir(parents=True, exist_ok=True)` → odtwarza katalog.

## 4. Sześć komentarzy `docs/ux` w `gra/src`

Faktycznie **7 linii w 6 plikach** (dispatch mówi „sześć referencji" — w
`gra/src/render/miasto-kamien.ts` są dwie: l. 35 i l. 351). Wszystkie to JSDoc,
**zero importów** — potwierdzone.

`cityAttackChoice.ts` · `ui/icons/brandAssets.ts` · `ui/leaderPortraits.ts` ·
`ui/techIcons.ts` · `ui/preBattle.ts` · `render/miasto-kamien.ts`

Każde miejsce dostało notę, że `docs/ux/` zostało usunięte w tym temacie i że treść
jest w historii Gita (`git show 39ae5d17:<ścieżka>`). W `brandAssets.ts` dodatkowo
wskazanie realnej kopii w repo: `gra/src/ui/icons/brand/` (**71 plików**, zweryfikowane).

**Dowód braku zmian w kodzie wykonywalnym:** cały `git diff -- gra/src` to 16 linii `+`
i 4 linie `-`, **każda zaczyna się od `` * ``** (wnętrze bloku `/** … */`).
`gra/data/**` — diff pusty.

## 5. Bramki — zmierzone PRZED i PO kasacji, w tym samym worktree

| Bramka | Referencja | PRZED | PO |
|---|---|---|---|
| `tsc --noEmit` (binarka z `node_modules`) | 0 błędów | **0** | **0** |
| `logic-test.cjs` | 213/213 | **213/213** | **213/213** |
| `tech-tree-test.cjs` | 19/0 | **19 pass, 0 fail** | **19 pass, 0 fail** |
| `research-test.cjs` | 33/33 | **33/33** | **33/33** |
| `unit-replace-test.cjs` | 13/13 | **13/13** | **13/13** |
| `combat-test.cjs` | 6/6 | **6/6 pass** | **6/6 pass** |
| `praca-jeden-podzial-kontrakt-test.cjs` | 634/0 | **634 OK, 0 FAIL** | **634 OK, 0 FAIL** |
| `praca-jeden-podzial-real-render-test.cjs` | 36/0 | **36 pass, 0 fail** | **36 pass, 0 fail** |
| `ai-jednostki-tylko-zakup-test.cjs` | 44/0 | **44 passed, 0 failed** | **44 passed, 0 failed** |
| `build-panel-ulepszenia-scroll-real-render-test.cjs` | 43/0 | **43 pass, 0 fail** | **43 pass, 0 fail** |
| `dyplo-pakt-ekspansja-granica-test.cjs` | 26/26 | **26/26 passed** | **26/26 passed** |
| `praca-cap-migracja-luka-test.cjs` | 11/0 | **11 passed, 0 failed** | **11 passed, 0 failed** |
| `zelazo-zrzuty-25-jednostek-render.cjs --no-shots` | 61/0 | **59 pass / 0 fail** | **59 pass / 0 fail** |

Wszystko z katalogu `gra/`, każde wywołanie w `timeout`.
`map-gen-regression-test` — **nieuruchamiany** (zakaz dispatchu).

**Rozbieżność referencji (NIE regresja).** `zelazo-…-render.cjs --no-shots` daje **59**,
nie 61 — tak samo **przed** i **po** kasacji, na nietkniętym `origin/main`. Przyczyna
mechaniczna: dwa checki — `(B1) powstało N plików PNG` i `(C1) arkusz zbiorczy 5x5` —
leżą **wewnątrz** bloku `if (!NO_SHOTS)` (l. 457–…). Liczba 61 jest osiągalna tylko
z `--out <katalog>`; z `--no-shots` jest arytmetycznie nieosiągalna. Referencja
w dispatchu sparowała wynik pełnego runu z flagą `--no-shots`. Zgłaszam jako
**korektę wartości odniesienia**, nie jako zieloną liczbę (§13a).

## 6. Rozmiar i granice

| | Plików śledzonych | Bajtów | MB |
|---|---|---|---|
| PRZED (`39ae5d17`) | 8557 | 856 299 052 | **816,6** |
| PO | 4442 | 234 853 135 | **224,0** |
| **Ubyło** | **4115** | **621 445 917** | **592,7** |

592,7 MB = 591,8 (tabela) + 0,9 (`tools — kopia`) + reszta (10 narzędzi, ~kilkadziesiąt kB).

- `md5sum gra-robocza/Gra-ROBOCZA.html` — **`04a7adcba9c0d6df1490c6842ba46f96`**
  sprawdzone PRZED, po każdym z czterech commitów i na końcu. Bez zmian.
- `gra/data/**` — diff pusty. `gra/src/**` — wyłącznie komentarze.
- Nie tknięte: `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
  `gra-robocza/START.html`, `docs/decyzje/**`, `docs/master/**`, `docs/encyklopedia/**`,
  `dyspozycje/**` (poza tym raportem), `.git/**`.
- Zero `npm run build` / `npm run dev` / `npx`. Zero `git add -A` / `git add .` —
  kasowanie wyłącznie `git rm`, dodawanie plikiem po pliku.
- Historia **nie** przepisywana: żadnego `filter-repo`, `force-push`, `gc`.
- Bez integracji, deployu i pusha do `main`.

## 7. NOTY — do decyzji orkiestratora/właściciela, poza allowlistą tego tematu

1. **Uzasadnienie wiersza 1 tabeli jest nieścisłe.** „Odtwarzalne jedną komendą" nie jest
   prawdą dla wszystkich ośmiu bundli PLAYTEST. md5 przed kasacją: `MAPA` i `MIASTO`
   = `04a7adcb` (identyczne z `Gra-ROBOCZA.html`), `WALKA`/`ODSKOK`/`ODSKOK-OBLEZENIE`/
   `OBLEZENIE-3v3` = `28d236f5` (**starszy** bundel), `BITWA-DUZA`/`OBLEZENIE-DUZE`
   = `95021308` (inny, mniejszy bundel — 34,5 MB vs 37,5 MB). Do tego
   `gra-robocza/tools/sync-playtest-bundles.cjs` wymienia **6 nazw, nie 8** — `BITWA-DUZA`
   i `OBLEZENIE-DUZE` nie odtworzy w ogóle. Treść pozostaje w historii Gita do czasu
   osobnej bramki `filter-repo`; **jeśli te dwa snapshoty mają wartość, trzeba je wyjąć
   przed przepisaniem historii.** Skryptu nie ruszałem — `gra-robocza/tools/` nie jest
   w allowliście.
2. **`gra-robocza/tools/generate-start-hub.cjs`** generuje `START.html` z linkami do
   ośmiu skasowanych bundli — po regeneracji hub będzie miał 8 martwych linków.
   `START.html` i `gra-robocza/tools/` poza allowlistą.
3. **`START-GRA.html:12`** linkuje do `gra-kanon/START.html` — link martwy. Root poza allowlistą.
4. **`.gitattributes:17`** (`gra-kanon/*.html   -text`) — wzorzec bez pokrycia. Poza allowlistą.
5. **`docs/decyzje/DYSPOZYCJA-STALA-SILNIK.md:20`** wskazuje na usunięty
   `bramka-test-publish.ps1`. `docs/decyzje/**` jest chronione — do osobnego tematu
   `PROCESS`. To jedyne miejsce w **aktywnym** katalogu decyzji, które po tej zmianie
   wskazuje w pustkę; uznałem je za wycofane (tor „Grupa F", którego artefakty
   `Gra-podglad*.html` już nie istnieją, a §1/§6 normy go nie zna) — **proszę Evaluatora
   o niezależne potwierdzenie tej oceny.**
6. **`.cursor/hooks/pre-compact-sync.py`** + `gra/tools/sync-chat-export.py`: nie wywalają
   się, ale cały mechanizm archiwizacji czatów traci cel razem z `docs/archiwum-czatow/`.
7. **Awaria pre-istniejąca, niezwiązana ze sprzątaniem:** `gra/tools/build-palisada-preview.cjs`
   pada na `Could not resolve .../gra/tools/.palisada-preview-entry.ts` — tego pliku
   **nigdy nie było** w repo (`git cat-file -e 39ae5d17:… → does not exist`). Nie naprawiam
   (§14, poza zakresem).

## Raport terminalny

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: R-REPO-SPRZATANIE-SREDNIE-Q1
GOAL: usunąć 591,8 MB / 4096 plików wg tabeli dispatchu bez zmiany zachowania gry
ZMIANY/COMMIT: `1f2b430f` (8 bundli PLAYTEST + `tools — kopia`) · `3b888b0a`
(`gra-kanon/` + 8 martwych narzędzi) · `47b4d749` (`docs/ux/` + 2 martwe narzędzia
figma + 6 komentarzy) · `45e76cd9` (`docs/archiwum-czatow/`, `_archiwum/`, `_backup/`)
TESTY: tsc 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 ·
combat 6/6 · kontrakt 634/0 · real-render 36/0 · ai-zakup 44/0 · scroll 43/0 ·
dyplo 26/26 · cap-migracja 11/0 · zelazo `--no-shots` 59/0 (referencja 61 dotyczy runu
z `--out`, patrz §5). Wszystkie identyczne przed i po kasacji.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5 High) — weryfikacja §1 (żadna ścieżka spoza tabeli),
§2 (werdykty per narzędzie), §3 (rozszerzenie o 2 narzędzia figma — akceptacja albo cofnięcie),
§4 (diff `gra/src` naocznie), §7 nota 1 i 5.
DEPLOY/PUSH: NIE WYKONANO (gałąź tematu wypchnięta, `main` nietknięty)
