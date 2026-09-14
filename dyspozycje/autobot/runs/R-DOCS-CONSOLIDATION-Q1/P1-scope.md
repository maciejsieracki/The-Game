# R-DOCS-P1-SCOPE-Q1 — zakres audytu Markdownów

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-DOCS-P1-SCOPE-Q1
GOAL: Ustalić kompletny, bezpieczny i reprodukowalny zakres audytu Markdownów The-Game na lokalnym hoście OVH oraz w relewantnych refach GitHub, z jawnymi wyłączeniami i bez modyfikacji źródeł.
RUNDY: 3/5

## 1. Wynik

Zakres P1 obejmuje:

- primary checkout The-Game: `/home/ubuntu/projects/The-Game`;
- wszystkie 25 zarejestrowanych worktree w kolekcji
  `/home/ubuntu/projects/The-Game-real24-current-worktrees/**`;
- checkout integracyjny `/home/ubuntu/projects/The-Game-real24-integration-staging`;
- relewantny companion project `/home/ubuntu/projects/Autoboot-Monitor`;
- lokalny, czysty checkout refu dokumentacyjnego
  `/home/ubuntu/projects/The-Game-docs-index`;
- refy GitHub zapisane jako lokalne remote-tracking snapshots: `origin/main`,
  `origin/docs/agent-documentation-index-20260914` oraz dodatkowo
  `origin/autobot/real24-staging`, którego relewancję uzasadnia obecność checkoutu
  integracyjnego.

Audyt P2 wybiera wyłącznie regularne pliki o rozszerzeniu `.md`, `.markdown`,
`.mdx` lub `.mdc` z powyższych źródeł, po zastosowaniu polityki wyłączeń z §4.
Pliki historii i dowodów mogą wejść do inventory, ale nie są przez to uznane za
źródła prawdy. Źródło prawdy, duplikaty, nieaktualność i plan konsolidacji należą
do późniejszych faz.

Pełny, maszynowy wykaz ścieżek, SHA, statusów odczytu i wyłączeń znajduje się w
`P1-sources.json`. Ten raport nie kopiuje treści żadnego źródłowego dokumentu.
Liczby wpisów statusu są read-only snapshotem z czasu `generated_at` manifestu;
przy tym odświeżeniu stan companiona wynosi 216 wpisów.

## 2. Host lokalny i zasada odczytu

- Host: `nAgents-ovh`.
- Provider: `OVH` zgodnie z etykietą środowiska/routingu zadania; niezależny dowód
  dostawcy: `N/D`.
- Granica lokalna: ścieżki pod `/home/ubuntu/projects` wymienione w §3 oraz
  zarejestrowane worktree odczytane przez `git worktree list --porcelain`.
- Każdy checkout źródłowy ma status `READ_ONLY_*`: wykonano wyłącznie odczyt
  metadanych, ścieżek, refów, statusu i reguł wyłączeń. Nie wykonano `pull`,
  `reset`, `clean`, `stash`, `rebase`, `merge`, pushu ani deployu.
- Brudny stan checkoutów jest informacją o ryzyku snapshotu, nie powodem do
  czyszczenia. Nie zapisano listy zmienionych ścieżek z obcych checkoutów w
  artefaktach P1.

## 3. Źródła i właściciele

Właściciel w poniższej tabeli oznacza właściciela projektu wynikającego z
publicznego URL `origin` (`maciejsieracki`). Osoba zatwierdzająca zakres poza tym
kontem nie została niezależnie ustalona: `human owner = N/D`.

| Źródło | Rola | Właściciel | Ref / SHA użyty do odczytu | Status odczytu |
|---|---|---|---|---|
| `/home/ubuntu/projects/The-Game` | primary checkout | The-Game / maciejsieracki | `main` / `a99f7de59ce643441b641d3b7b11404b6cbdcd82` | `READ_ONLY_METADATA_AND_PATH_SCOPE`; 49 wpisów statusu |
| `/home/ubuntu/projects/The-Game-real24-current-worktrees/**` | aktywna kolekcja topic worktree | The-Game / AutoBot; human owner `N/D` | 25 osobnych SHA, tabela poniżej | `READ_ONLY_REGISTERED_WORKTREE`; status każdego wpisu poniżej |
| `/home/ubuntu/projects/The-Game-real24-integration-staging` | integration staging | The-Game integration / maciejsieracki | `autobot/real24-staging` / `968891c6ecc70ecc916cb9ab09199e20d684fa82` | `READ_ONLY_METADATA_AND_PATH_SCOPE`; 3 wpisy statusu |
| `/home/ubuntu/projects/Autoboot-Monitor` | companion project: mechanizm AutoBot i raporty | Autoboot-Monitor / maciejsieracki | `main` / `c44c381c2deaabccec15686494eb4c63bf54394d` | `READ_ONLY_METADATA_AND_PATH_SCOPE`; 216 wpisów statusu |
| `/home/ubuntu/projects/The-Game-docs-index` | reference checkout dla refu indeksu dokumentacji | The-Game documentation / maciejsieracki | `docs/agent-documentation-index-20260914` / `da493eeebfaa90d47140ba7892ea2578b7f50ea7` | `READ_ONLY_METADATA_AND_PATH_SCOPE`; clean |

### 2.1 Aktywne worktree real24

Kolekcja ma dokładnie 25 katalogów na dysku i 25 odpowiadających im wpisów w
`git worktree list --porcelain`. Status oznacza liczbę wpisów
`git status --porcelain=v1 --untracked-files=normal`; ścieżki zmian nie są
przepisywane do raportu.

| Katalog | Branch | HEAD | Wpisy statusu |
|---|---|---|---:|
| `R-RUSTREAL-01-SCAFFOLD-Q1` | `autobot/R-RUSTREAL-01-SCAFFOLD-Q1-current` | `031bd1d87aee906f49af8c3dba31979c0fe0d419` | 2 |
| `R-RUSTREAL-02-STATE-DTO-Q1` | `autobot/R-RUSTREAL-02-STATE-DTO-Q1-current` | `837082b257cfcc8a637cda0d5bfa005dda4009be` | 3 |
| `R-RUSTREAL-03-RNG-Q1` | `autobot/R-RUSTREAL-03-RNG-Q1-current` | `8e3b25e0c00b2ed5e06aaf452f5cd5b1d7468c78` | 3 |
| `R-RUSTREAL-04-HEX-TERRAIN-Q1-kanban` | `autobot/kanban/R-RUSTREAL-04-HEX-TERRAIN-Q1` | `2cccd74c01428a598af41ff3e9ce8173a16e5d98` | 2 |
| `R-RUSTREAL-05-MAP-GENERATOR-Q1-kanban` | `autobot/kanban/R-RUSTREAL-05-MAP-GENERATOR-Q1` | `719b28c447afd66bf24909119571e72761f2192e` | 3 |
| `R-RUSTREAL-06-IMPROVEMENTS-Q1-kanban` | `autobot/kanban/R-RUSTREAL-06-IMPROVEMENTS-Q1` | `bd3320568c5c90a1564c11055397b5c14fad3750` | 2 |
| `R-RUSTREAL-07-RESOURCE-PRODUCTION-Q1-kanban` | `autobot/kanban/R-RUSTREAL-07-RESOURCE-PRODUCTION-Q1` | `8c997a7273009393db15fb7c2e13ff2675129a9e` | 2 |
| `R-RUSTREAL-08-BUILDING-COSTS-Q1-kanban` | `autobot/kanban/R-RUSTREAL-08-BUILDING-COSTS-Q1` | `1ea8b3c17736cf2df742ba6166ba44cbe7183e72` | 2 |
| `R-RUSTREAL-09-TURN-ECONOMY-Q1-kanban` | `autobot/kanban/R-RUSTREAL-09-TURN-ECONOMY-Q1` | `d0d37cffa285e09d8e67d53a304aa65d175c9238` | 5 |
| `R-RUSTREAL-10-CITY-GROWTH-Q1-kanban` | `autobot/kanban/R-RUSTREAL-10-CITY-GROWTH-Q1` | `8bef10a89e02b3a9d231a2eb5a1b534697063960` | 2 |
| `R-RUSTREAL-11-UNIT-EPOCH-Q1-kanban` | `autobot/kanban/R-RUSTREAL-11-UNIT-EPOCH-Q1` | `0edd6f0e3e80cee5142e7457c69c32065b41b1eb` | 2 |
| `R-RUSTREAL-12-RECRUIT-UPKEEP-Q1-kanban` | `autobot/kanban/R-RUSTREAL-12-RECRUIT-UPKEEP-Q1` | `68274784f5662ab8adb514ec2fcce06ab8dfbd09` | 2 |
| `R-RUSTREAL-13-PATHFINDING-Q1-kanban` | `autobot/kanban/R-RUSTREAL-13-PATHFINDING-Q1` | `acf1baeb2121e26c449cc64df720a7c8f495d3ca` | 5 |
| `R-RUSTREAL-14-COMBAT-Q1-kanban` | `autobot/kanban/R-RUSTREAL-14-COMBAT-Q1` | `75b95397056504562711dcdd40010376db14c177` | 2 |
| `R-RUSTREAL-15-DIPLOMACY-Q1-kanban` | `autobot/kanban/R-RUSTREAL-15-DIPLOMACY-Q1` | `88b8c7fa0e56e86c2992fbf75e138ee8d8e09a4c` | 6 |
| `R-RUSTREAL-16-TRADE-Q1-kanban` | `autobot/kanban/R-RUSTREAL-16-TRADE-Q1` | `2b791e6d2a9e6dd17122f82e64410a75c3a7d393` | 6 |
| `R-RUSTREAL-17-BARBARIANS-Q1-kanban` | `autobot/kanban/R-RUSTREAL-17-BARBARIANS-Q1` | `d790a4380c9fd2126b48ff27c25997852103f88b` | 2 |
| `R-RUSTREAL-18-AI-TURN-Q1-kanban` | `autobot/kanban/R-RUSTREAL-18-AI-TURN-Q1` | `d3b671a600ccada2a1b01df6ed837e99115c5513` | 3 |
| `R-RUSTREAL-19-EVENT-QUEUE-Q1-kanban` | `autobot/kanban/R-RUSTREAL-19-EVENT-QUEUE-Q1` | `865ad9e3a551be0b3eb82ba42804eb2ae04b22ee` | 2 |
| `R-RUSTREAL-20-SAVE-LOAD-Q1-kanban` | `autobot/kanban/R-RUSTREAL-20-SAVE-LOAD-Q1` | `5ecb5ae2ebbc1dc4c3cb814baf3ae709394d5af9` | 3 |
| `R-RUSTREAL-21-REPLAY-Q1-kanban` | `autobot/kanban/R-RUSTREAL-21-REPLAY-Q1` | `88b8c7fa0e56e86c2992fbf75e138ee8d8e09a4c` | 0 |
| `R-RUSTREAL-21-REPLAY-Q1-r2` | `hermes/R-RUSTREAL-21-REPLAY-Q1-r2` | `968891c6ecc70ecc916cb9ab09199e20d684fa82` | 4 |
| `R-RUSTREAL-22-TAURI-BRIDGE-Q1-kanban` | `autobot/kanban/R-RUSTREAL-22-TAURI-BRIDGE-Q1` | `88b8c7fa0e56e86c2992fbf75e138ee8d8e09a4c` | 0 |
| `R-RUSTREAL-23-STEAM-ADAPTER-Q1-kanban` | `autobot/kanban/R-RUSTREAL-23-STEAM-ADAPTER-Q1` | `88b8c7fa0e56e86c2992fbf75e138ee8d8e09a4c` | 0 |
| `R-RUSTREAL-24-PARITY-BENCH-CI-Q1-kanban` | `autobot/kanban/R-RUSTREAL-24-PARITY-BENCH-CI-Q1` | `88b8c7fa0e56e86c2992fbf75e138ee8d8e09a4c` | 0 |

### 2.2 GitHub refs użyte jako snapshoty

Remote URL The-Game: `https://github.com/maciejsieracki/The-Game.git`.
Remote URL companiona: `https://github.com/maciejsieracki/Autoboot-Monitor.git`.

| Remote-tracking ref | SHA użyty | Dlaczego w scope | Status |
|---|---|---|---|
| `refs/remotes/origin/main` | `1a355346ef12c7cdbb27dd6fb9d7da2b56c3682b` | baseline z dispatchu | `READ_ONLY_LOCAL_REMOTE_TRACKING_SNAPSHOT` |
| `refs/remotes/origin/docs/agent-documentation-index-20260914` | `da493eeebfaa90d47140ba7892ea2578b7f50ea7` | ref indeksu dokumentacji wskazany w dispatchu | `READ_ONLY_LOCAL_REMOTE_TRACKING_SNAPSHOT` |
| `refs/remotes/origin/autobot/real24-staging` | `d387754f530af202ef285f7a27727ea1b1009cd9` | dodatkowy ref uzasadniony checkoutem stagingowym | `READ_ONLY_LOCAL_REMOTE_TRACKING_SNAPSHOT` |

Nie wykonano fetchu. Bieżący SHA na serwerze GitHub i świeżość lokalnych
remote-tracking refs: `N/D`. Dla `origin/main...main` odczytano `[behind=101,
ahead=6]`; dla lokalnego stagingu względem jego remote-tracking ref `[behind=0,
ahead=11]`. To są relacje lokalnych snapshotów, nie dowód publikacji.

## 3. Co jest kandydatem do audytu Markdownów

Poza wyłączeniami z §4 P2 powinno zebrać metadane dla każdego regularnego pliku o
rozszerzeniu:

- `.md` — podstawowy Markdown;
- `.markdown`, `.mdx` — warianty Markdown, jeśli występują;
- `.mdc` — reguły Cursor o składni Markdown-like.

P2 zapisuje ścieżkę względną wobec source root, root źródłowy, local/remote,
tracked/untracked, rozmiar, liczbę linii, pierwszy nagłówek, SHA-256 i status.
P1 nie porównuje treści i nie wyciąga wniosków o duplikatach.

Jawne wyjątki od reguły ukrytych ścieżek:

- `.claude/**` — dokumentacja skills i workflow; Markdown-like pliki pozostają
  kandydatami;
- `.cursor/**` — reguły i automatyzacje procesu; pliki `.mdc` pozostają
  kandydatami;
- `docs/archiwum-procesu/**`, `dyspozycje/autobot/runs/**` oraz nie-tempowe
  `Autoboot-Monitor/runs/**` — kandydaci klasy `HISTORY`/`EVIDENCE`, nie
  automatycznie canonical.

## 4. Wyłączenia z normalnej dokumentacji

Wyłączenie oznacza „nie przekazuj do zwykłego inventory Markdownów”; nie oznacza
usuwania ani czyszczenia plików.

| Klasa | Ścieżki / wzorce | Powód |
|---|---|---|
| Git control | `**/.git/**`, pliki kontrolne worktree | metadane Git, nie dokumentacja |
| Zagnieżdżone worktree | `**/.worktrees/**` | kopie zadań i stan lokalny; tylko jawnie allowlistowana kolekcja real24 jest źródłem |
| Zależności | `**/node_modules/**` | dependency tree, także symlink dzielony przez worktree |
| Build/cache | `**/gra/dist/**`, `**/gra/dist-*/**`, `**/dist/**`, `**/target/**`, `**/build/**`, `**/.next/**`, `**/.cache/**`, `**/.turbo/**`, `**/coverage/**` | artefakty odtwarzalne, nie źródła |
| Generated/playtest | `/home/ubuntu/projects/The-Game/gra-robocza/**` i bundle playtestowe | lokalny snapshot/runtime generowany przez deploy/playtest |
| Temp/runtime | `**/tmp/**`, `**/_sandbox/**`, `**/*.log`, `**/*.tmp`, `**/*.bak-*`, `**/__pycache__/**` | stan chwilowy, logi i kopie robocze |
| Test/dependency state companiona | `Autoboot-Monitor/.venv/**`, `**/.pytest_cache/**`, `**/.ruff_cache/**`, `**/*.egg-info/**` | środowiska i cache testowe |
| Generated evidence companiona | `Autoboot-Monitor/logs/**`, `Autoboot-Monitor/evidence/**`, `Autoboot-Monitor/runs/**/*-tmp/**` | artefakty testów; nie-tempowe raporty runów pozostają klasą EVIDENCE |
| Generated gate artifacts | `dyspozycje/autobot/logs/**`, ukryte bundle/entry/stub/mockup w `gra/tools/**` | wynik bramek i sond, odtwarzalny poza dokumentacją |
| Sekrety | `**/.env`, `**/.env.*`, nazwy credential/token/private-key | nigdy nie czytać ani nie zapisywać; wyjątek `.env.example` nie jest potrzebny do P1 |
| Ukryte ścieżki domyślnie | dowolny komponent zaczynający się od `.` poza `.claude/**` i `.cursor/**` | kontrola, cache lub stan lokalny; generic rule domyka nieznane przypadki |

`archiwum/**`, `docs/archiwum-procesu/**`, `dyspozycje/autobot/runs/**` i
nie-tempowe raporty `Autoboot-Monitor/runs/**` nie są kasowane ani pomijane
bezwarunkowo: później dostają etykietę historii/dowodu. To rozróżnienie nie jest
analizą duplikatów.

## 5. Kontrola ukrytych katalogów

Sprawdzono globami top-level i dla wszystkich dzieci kolekcji real24:

- `/home/ubuntu/projects/The-Game/.[!.]*`;
- `/home/ubuntu/projects/The-Game-real24-current-worktrees/*/.[!.]*`;
- `/home/ubuntu/projects/The-Game-real24-integration-staging/.[!.]*`;
- `/home/ubuntu/projects/Autoboot-Monitor/.[!.]*`;
- zagnieżdżone `.worktrees` primary i companiona.

Wynik klasyfikacji:

- `.git` — control, wyłączony;
- `.claude` i `.cursor` — ukryte, ale jawnie włączone jako dokumentacja;
- `.worktrees` — zagnieżdżone kopie, wyłączone; ich liczniki są w
  `P1-sources.json`;
- `.pytest_cache`, `.ruff_cache`, `.venv` — cache/środowiska, wyłączone;
- ukryte bundle, stubs i mockup directories w `gra/tools` — generated/tool,
  wyłączone;
- `dyspozycje/_handoff/.shadow-state.json` — runtime state, wyłączony;
- root kolekcji real24 nie ma dodatkowego ukrytego dziecka poza jawnie
  zarejestrowanymi katalogami; każdy z 25 jego rootów ma tylko znane `.git`,
  `.claude`, `.cursor` oraz ukryte pliki kontrolne.

Nie ma nieprzypisanej ukrytej ścieżki w sprawdzonych rootach. Dla dowolnej
niezarejestrowanej, głęboko zagnieżdżonej ścieżki untracked dowód nie jest pełny
(`N/D`); obowiązuje jednak generic dot-component exclusion, więc taka ścieżka
nie może wejść do P2 bez jawnego przeglądu.

## 6. Poza zakresem lokalnym

`git worktree list --porcelain` wykazał również kopie, których nie wolno mieszać
z aktywną kolekcją real24:

- `/home/ubuntu/projects/The-Game-loadtest-worktrees/**` — 24 detached load/
  performance worktree;
- `/home/ubuntu/projects/The-Game-real24-worktrees/**` — 1 starszy detached
  real24 worktree;
- `/home/ubuntu/projects/The-Game-worktrees/**` — 13 innych topic worktree;
- `/home/ubuntu/projects/The-Game/.worktrees/**` — 1 zagnieżdżona kopia zadania;
- `/home/ubuntu/projects/Autoboot-Monitor/.worktrees/**` — 25 zagnieżdżonych kopii
  companiona;
- pojedyncze kopie procesowe/deployowe:
  `The-Game-autobot-kanban-rule-20260912`, `The-Game-kanban-cleanup-20260912`,
  `The-Game-latest-origin-main`, `The-Game-process-merge-20260913`,
  `The-Game-robocza-deploy-20260912`;
- historyczny checkout integracyjny
  `/home/ubuntu/projects/The-Game-integration-main-20260912` — branch
  `integration/real24-final-20260912`, HEAD
  `d387754f530af202ef285f7a27727ea1b1009cd9`, 0 wpisów statusu; właściciel
  projektu `The-Game / integration`, status odczytu
  `NOT_READ_AS_DOCUMENT_SOURCE`. Nie mieszać go z bieżącym
  `/home/ubuntu/projects/The-Game-real24-integration-staging`.

Wszystkie sześć pojedynczych checkoutów ma ścieżkę, powód wyłączenia, właściciela
i status odczytu w `P1-sources.json`; żaden nie jest skanowany jako źródło P2.

Bieżący worktree raportowy
`/home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1`
jest workspace'em wyjściowym, nie źródłem wejściowym. Nie audytuje się własnych
artefaktów P1 jako dokumentacji projektu.

## 7. Ograniczenia i N/D

1. Nazwa hosta i routing mówią `OVH`, ale nie wykonano niezależnej walidacji
   providera: `N/D`.
2. Refy GitHub są lokalnymi snapshotami `refs/remotes/origin/*`; bez fetchu nie
   ma dowodu bieżącego stanu serwera ani świeżości: `N/D`.
3. Właściciel człowiek poza kontem repozytorium nie został znaleziony w zakresie
   P1: `N/D`.
4. P1 nie ocenia, który dokument wygrywa konflikt, nie porównuje hashy treści,
   nie wykrywa duplikatów i nie rekomenduje usuwania/scalania.
5. Nie skanowano arbitralnego całego systemu plików poza zadeklarowanymi rootami,
   zarejestrowanymi worktree i kontrolą dot-componentów; ścieżki spoza tej
   granicy są poza zakresem.

## 8. Następna bramka

`P2 — inwentaryzacja Markdownów`: programowe zebranie metadanych per plik,
bez ładowania tysięcy treści do promptu i z zachowaniem wyłączeń z §4.

ZMIANY/COMMIT: trzy nowe artefakty wyłącznie na allowliście P1; źródła, kod,
`gra-robocza`, WERSJE, handoffy, Kanban DB i inne worktree nietknięte. Commit
raportowy nie został wykonany.
TESTY: odczyt `git worktree list --porcelain` (25/25 dzieci kolekcji real24),
`git rev-parse`, `git remote get-url origin`, `git status --porcelain=v1`,
`git ls-files` dla metadanych Markdownów, globy hidden-rootów i `git diff --check`.
BLOKADY: brak; ograniczenia §7 są jawnie zapisane jako `N/D`.
NASTĘPNY KROK: niezależny Evaluator P1, potem Final Control i readback Orchestratora.
DEPLOY/PUSH: NIE WYKONANO
