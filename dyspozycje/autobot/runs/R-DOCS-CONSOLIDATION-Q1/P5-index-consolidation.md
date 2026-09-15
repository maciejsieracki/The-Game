STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-DOCS-P5-INDEX-CONSOLIDATION-Q1
GOAL: Kanoniczna, nawigowalna mapa wejścia i źródeł prawdy na podstawie zweryfikowanych P2/P3/P4, bez kasowania, scalania, zmiany nazw ani cichej zmiany źródeł.
ZMIANY/COMMIT: lokalny, niecommitowany; zmieniono `AGENT-START-HERE.md` i `docs/procesy/INDEX-PROCESU.md`; dodano cztery allowlistowane artefakty P5. Commit/push brak.
TESTY: linki Markdown 32/32 PASS; fenced blocks 6/6 zbilansowane; `node dyspozycje/autobot/tools/process-docs-audit.cjs` PASS; `git diff --check` PASS; skan wrażliwości i trailing whitespace PASS; readback hashy wejść PASS.
BLOKADY: nierozstrzygnięte decyzje właściciela P3: konflikty 1, 4, 5, 6, 7; precedencja nieustalona. Pochodzenie dwóch driftów primary pozostaje niezweryfikowane. Pakiet jest local-only i nie jest jeszcze opublikowany.
RUNDY: 1/5
NASTĘPNY KROK: niezależny Evaluator P5, następnie Final Control P5; dopiero po obu terminalnych odczytach legalne jest otwarcie niedestrukcyjnego P6.
DEPLOY/PUSH: NIE WYKONANO

## Zakres i wynik

Audyt obejmował kanoniczne wejścia i mapy procesu (`README.md`, `AGENT-START-HERE.md`,
`docs/procesy/INDEX-PROCESU.md`, `R-PROC-AUTOBOT.md`), aktywny playbook, handoff,
rejestry, decyzje STRICT/ABC, katalog AutoBot oraz zachowane artefakty P1B/P2/P3/P4
w `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/`. P5 użyło tylko tego worktree:

`/home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1`

P5 naprawiło dwa potwierdzone problemy nawigacyjne:

1. przestarzały opis bieżącej bramki P1B w `AGENT-START-HERE.md` zastąpiono
   jawnym stanem P5 i odsyłaczami do dowodów P2/P3/P4;
2. do `AGENT-START-HERE.md` i `docs/procesy/INDEX-PROCESU.md` dodano jawny
   profil/projekt/board/tenant, zamrożone liczniki audytu, rozdział live-vs-snapshot
   i granicę P6.

Nie zmieniono `README.md`, źródeł decyzji, rejestrów, handoffów, kodu, `gra/`,
`rust-port/`, bazy Kanbana ani remote refs.

## Zmienione ścieżki

Allowlista i faktyczny zakres P5:

- `AGENT-START-HERE.md` — zmieniony, pozostaje pre-existing local-only/untracked;
- `docs/procesy/INDEX-PROCESU.md` — zmieniony istniejący plik;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/23-dispatch-p5-index-consolidation.md` — nowy;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-index-consolidation.md` — nowy;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-evidence.json` — nowy;
- `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-transition-receipt.json` — nowy.

Przed zapisaniem artefaktów P5 worktree miał 64 wpisy statusu; po zapisaniu
czterech nowych artefaktów ma 68. Wszystkie pozostałe dirty/untracked wpisy są
pre-existing i zostały zachowane.

## Tożsamość i live readback

Native readback przed przekazaniem:

- profil: `default`;
- projekt: `the-game` / `The Game Box`;
- `project_id`: `p_9ae9ac64`;
- board: `the-game-real24`;
- tenant: `the-game`;
- task: `t_518149f7`, temat `R-DOCS-P5-INDEX-CONSOLIDATION-Q1`;
- run: `328`, status `running` przed terminalnym przekazaniem;
- branch: `hermes/R-DOCS-CONSOLIDATION-Q1`;
- HEAD worktree: `d3689535ce7a7bf210f187c43448a49716774bfa`;
- completion contract: `local-only`.

`hermes -p default project show the-game` wskazuje board `the-game-real24`.
Historyczna wzmianka `the-game-bugs` w mapie P1B nie została potraktowana jako
bieżący binding. Historyczny `project_id=p_09e13254` pozostaje orphanem legacy.

## Snapshot P2/P3/P4 zachowany w indeksach

P2: granica `2026-09-14T17:37:55Z`, 84 308 rekordów Markdown-like, w tym
76 084 lokalne i 8 224 GitHub, 32 source roots. P2 klasyfikacje:

| Klasyfikacja | Rekordy |
|---|---:|
| `CANONICAL` | 13 740 |
| `EVIDENCE` | 33 217 |
| `HISTORY` | 2 759 |
| `SEPARATE_PROJECT` | 181 |
| `UNKNOWN` | 34 411 |
| Razem | 84 308 |

P3: 12 kategorii źródeł i 10 konfliktów; otwarte dla właściciela pozostają
konflikty 1, 4, 5, 6, 7, bez wybranej precedencji.

P4 statusy:

| Status | Rekordy |
|---|---:|
| `ACTIVE_CANONICAL` | 34 896 |
| `HISTORY` | 18 693 |
| `STALE_CANDIDATE` | 651 |
| `DUPLICATE_CANDIDATE` | 124 |
| `OWNER_DECISION` | 13 181 |
| `SEPARATE_PROJECT` | 181 |
| `UNKNOWN_NEEDS_REVIEW` | 16 582 |
| Razem | 84 308 |

P4 zachowało 21 ścieżek/651 rekordów z markerami stale, 124 grupy dokładnych
powtórzeń w tym samym root, 2 764 grupy replik między rootami oraz 433 unikalne
ścieżki objęte decyzją właściciela. Żaden kandydat nie został usunięty, scalony,
przemianowany ani zarchiwizowany.

P4 odczytało primary jako 2 757/2 757 obecnych rekordów; dwa drifty względem
zamrożonego snapshotu dotyczą `dyspozycje/PYTANIA-OTWARTE.md` i
`dyspozycje/REJESTR-PROSB-I-ZADAN.md`. Dokładne pochodzenie tych zmian pozostaje
niezweryfikowane; P5 nie zmienia ich treści.

## Lokalne, zdalne i companion

Zamrożone przez P2 referencje GitHub:

- `HEAD/main=32bbc72741e21a3bcda2f05e580b55512ca5dd33`;
- `docs/agent-documentation-index-20260914=da493eeebfaa90d47140ba7892ea2578b7f50ea7`;
- `autobot/real24-staging=d387754f530af202ef285f7a27727ea1b1009cd9`.

Świeży read-only `git ls-remote` podczas P5 zwrócił:

- `HEAD/main=30409fdb2938fea93287af9df66a18adc048af26`;
- `docs/agent-documentation-index-20260914=da493eeebfaa90d47140ba7892ea2578b7f50ea7`;
- `autobot/real24-staging=d387754f530af202ef285f7a27727ea1b1009cd9`.

Rozjazd `main` jest live faktem późniejszym niż P2, a nie zmianą snapshotu.
Nie wykonano fetch/pull/push. Remote `ignored/not_ignored` pozostaje `N/D_REMOTE`.
Companion `/home/ubuntu/projects/Autoboot-Monitor` i jego 181 rekordów pozostają
osobnym projektem, bez mieszania źródeł, boardów, profili i decyzji.

## Canonical reading recipes

- start uniwersalny: `README.md`, potem ten indeks i `AGENT-START-HERE.md`;
- norma procesu: `docs/decyzje/R-PROC-AUTOBOT.md`;
- reguły i „nigdy więcej”: `playbook.md`;
- handoff: `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` oraz końcówka
  `dyspozycje/_handoff/KANAL-PRACA.md`;
- temat/ABC/decyzje: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`,
  `dyspozycje/PYTANIA-OTWARTE.md`, `docs/decyzje/<PEŁNE-ID>.md`;
- runtime AutoBot: `dyspozycje/autobot/README.md`,
  `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`;
- evidence: `dyspozycje/autobot/runs/<PEŁNE-ID>/` oraz native event/run/receipt;
- architektura: `ANALIZA-ARCHITEKTURY-Civ.md`, `docs/analiza/README.md`,
  `docs/analiza/01–08-*.md`; fakty implementacji dopiero w `gra/src/**`,
  `gra/data/**` i `rust-port/engine/**`;
- testy procesu: `node dyspozycje/autobot/tools/process-docs-audit.cjs`.

P3-owy tekst zawiera odsyłacz do `docs/decyzje/R-PROC-AUTOBOT-HERMES-KANBAN.md`,
alecz ten plik nie istnieje w aktualnym worktree. P5 nie stworzyło aliasu i nie
używa nieistniejącej ścieżki jako kanonu; aktywny `R-PROC-AUTOBOT.md` oraz
`dyspozycje/autobot/README.md` są sprawdzonymi źródłami procesu.

## Hash readback niezmienionych wejść

Poniższe 12 wejść pochodzi z P4 `input_hash_readback`; wszystkie pozostały
byte-for-byte niezmienione:

| Ścieżka | Bajty | SHA-256 |
|---|---:|---|
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-exclusions.md` | 7 150 | `eb3101e246074b613578b4bca57981ce4bbbaec0f04983cb9a7a8818bf3d32ae` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-final-control-evidence.json` | 10 557 | `74512059580e4da055eff21c0e8c5e97e564f9511aec1b061178a499f98f4312` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-markdown-inventory.jsonl` | 50 033 206 | `c3af5d96b715a79df910f1d3b5006b2d9e020506ef1c220e648ed13255310055` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P2-source-manifest.json` | 122 532 | `0b9b3b38582d272f25fb349d42e779378901ca6bcc7dfd0a4ea512f6934bd107` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-conflicts.md` | 8 939 | `31c46694deb1f338cb9c25666b6eaa86b076ca111a1cdd734cec97a2d1d0fc81` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-defense-routing-repair-evidence.json` | 8 394 | `7a26b91ca1524cd273682c266a8f057411e565b8f82f4a8171ed91cd029daf15` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-evaluator-report.md` | 3 928 | `b6c08ad77494b80a6b93a526946b9729524741598bb8f20d7581ae6edb00235a` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-final-control-evidence.json` | 12 703 | `4723285a3c1793caa01ba06f10835cbb321b7a945d4aec22e477aeed775563c7` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-final-control.md` | 8 280 | `8cf1841a2989c7f69c2f1c2c26b84e88aae07e15a562286a82bd3133eee5fbbd` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-source-of-truth-map.jsonl` | 41 215 | `51289857efbcd91dd99f23a15243d2c415d0b2bc4a2a9e3966cd6a18d97cd3fb` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-source-of-truth-map.md` | 10 801 | `580bc158df87207adf2eebe7ddfa78673731b8f22ed63dccf773c1ca8cebcdf3` |
| `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P3-summary.md` | 5 348 | `3eaae297bd01e2d41f5d788da676ba0e73eb809c8a962ee3a80bfe5fa0a046bc` |

Kluczowe artefakty P4 również pozostały niezmienione:

- macierz `P4-stale-duplicate-matrix.jsonl`: 153 698 667 bajtów,
  SHA-256 `d398e05512c3628984f0104b42df1b5bfbcbcebdf8a60c302496ffe68b4abd4f`;
- `P4-final-control-evidence.json`: 599 911 bajtów,
  SHA-256 `a9304fded22685fdd03c1a2e56a22948207199f077ce44ddfb0e91eda1be3e79`;
- `P4-final-control.md`: 4 544 bajty,
  SHA-256 `9b497057d16b52d99ea74fce7a0368fd170ade9368bbba87e2b5681931624f52`;
- `P4-summary.md`: 8 643 bajty,
  SHA-256 `6aa26f6ed38caad360ab062ef19c30fcf5a3b40807ec2ab935a108acbeb97b24`.

## Weryfikacja i niedostępne bramki

Wykonano:

- 32/32 linki Markdown z obu entrypointów rozwiązują się do istniejących plików;
- 6/6 markerów fenced code jest zbilansowanych;
- parser JSONL P2/P3/P4 pozostaje objęty wcześniejszymi dowodami;
- `node dyspozycje/autobot/tools/process-docs-audit.cjs` zwrócił `PASS`;
- `git diff --check` zwrócił `PASS`;
- skan P5 allowlisty: private-key, bearer, credential assignment, IPv4 i e-mail
  nie wystąpiły; trailing whitespace: 0;
- primary i remote zostały odczytane read-only; żaden source/history path nie
  został zapisany przez P5.

Niedostępne lub celowo niewykonane:

- brak commit/tree/remote publication readbacku, bo commit i push są poza allowlistą;
- brak live refresh P2, bo nowa autoryzowana inwentaryzacja jest osobną bramką;
- brak integracji, `READY_FOR_DEPLOY`, P6, merge i deploy;
- native notify-event proof pozostaje nieeksponowany przez wcześniejszy P4
  readback; P5 nie przedstawia subskrypcji jako dowodu powiadomienia.

## Granica P6

Po P5 wymagany jest niezależny Evaluator P5 oraz Final Control P5 z technicznym i
kontekstowym readbackiem. Dopiero ich terminalne przyjęcie pozwala orkiestratorowi
utworzyć P6 jako niedestrukcyjny plan konsolidacji. P6 nie oznacza wyboru
precedencji, usunięcia, scalenia, przeniesienia ani publikacji; dla konfliktów
P3 1/4/5/6/7 nadal potrzebna jest decyzja właściciela.
