# P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 — Obrona Operatora, runda 1 (druga faza)

STATUS: PASS-WITH-NOTES
DOMAIN: INFRA
TEMAT: P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1
MODEL+EFFORT: Operator (obrona) — Opus 5, effort high
GOAL: Żadna bramka w `gra/tools/` nie może dać wyniku zależnego od tego, czy w tej samej
chwili biegnie inny przebieg — jej albo czyjkolwiek.
ZMIANY/COMMIT: `93f59ed9` (69 plików: 57× usunięcie handlerów sygnałów + sweep startowy,
11× naprawa dosłownych ścieżek `/tmp/`, `bramki-tmpdir-unikalnosc-test.cjs` + reguły R4/R5,
katalog runu). Allowlista dotrzymana: cały diff w `gra/tools/**/*.cjs` i katalogu runu,
staging po jawnych ścieżkach, zero `git add -A`, `git diff --check` czysty.
**Zero zmian w asercjach, progach i logice pomiarowej** — zweryfikowane maszynowo na
usuniętych liniach diffu (0 trafień `assert|check(|FAIL|prog|threshold|MARGIN`).
RUNDY: 1/5 (druga faza tej samej rundy, nie nowa runda)
NASTĘPNY KROK: Final Control (werdykt per zarzut, §3c)
DEPLOY/PUSH: NIE WYKONANO

**Sześciu zarzutów nie podważam; pięć naprawiłem w tej rundzie.** Jeden (Z7) odrzucam
wyłącznie jako zarzut wobec Operatora — co do treści zgadzam się z Evaluatorem.

## Izolacja — rozbieżność, która nie jest kolizją

Prompt każe oczekiwać HEAD `91877f11`; drzewo było czyste, ale HEAD to `1585db98`.
`git merge-base --is-ancestor 91877f11 HEAD` przechodzi, a wszystkie 16 commitów między
nimi należy do tego tematu (9 moich, 4 Evaluatora). `91877f11` to baza fazy pierwszej —
obrona z definicji startuje po Evaluatorze. Warunek `BLOCK` chroni przed cudzą pracą
w worktree; takiej nie ma.

## Werdykt per zarzut (§3c pkt 2)

| # | Odpowiedź | Dowód z wytworu |
|---|---|---|
| 1 | **PRZYJMUJĘ** | Minimalna reprodukcja `execSync('sleep 8')` + SIGTERM po 2 s: **bez** handlera `exit=143` natychmiast, **z** handlerem z `cf148d0e` sygnał połknięty, `SYNC DONE`, **`exit=0`**. Wariant „handler + re-raise" sprawdzony osobno — **też połknięty, `exit=0`**; ten sam handler POZA `execSync` działa (`exit=143`). Więc żaden wariant handlera nie jest bezpieczny: rejestracja zdejmuje domyślną akcję sygnału, a `execSync` (`vite build`) to większość czasu życia bramki. Blok usunięty z **57/57** plików (przed podmianą zweryfikowany jako bajt-w-bajt identyczny). Po naprawie na PRAWDZIWEJ bramce: SIGTERM w fazie `vite build (fix)` → martwa **<3 s, `exit=143`**. |
| 2 | **PRZYJMUJĘ** | Mutacja `path.join(os.tmpdir(), 'civ-zz-mut6', 'dist')` w pliku ZE znacznikiem unikalności (czyli w każdym z 57 naprawionych) → bramka **`PASS=3 FAIL=0`, `exit=0`**. Przyczyna w kodzie: forma wieloargumentowa nie jest pojedynczym literałem, spadała do R3, a R3 tłumi `fileHasUniqueMark`. Konkatenacja (M2/M7) nie była łapana wcale. Po poprawce: M2 → `[R4] exit=1`, M6 → `[R1] exit=1`, M7 → `[R4] exit=1`; wszystkie cofnięte, bramka `PASS=3 FAIL=0`. |
| 3 | **PRZYJMUJĘ** | Potwierdzone: 13 plików z dosłownym `/tmp/` i bez `os.tmpdir()`. `miasta-panstwa-wylaczone-ui-render-test.cjs:19` — stała nazwa **z `--emptyOutDir`**, czyli najwyższa klasa ryzyka z mojej własnej tabeli; `perf-long-session-live-test.cjs` pisał zrzut pod stałą nazwę mimo „naprawy". Przyczyna źródłowa: pula audytu była zdefiniowana przez `grep os.tmpdir()`, więc ta klasa była dla niej **niewidzialna z definicji**. Nowa **R5 skanuje KAŻDY plik**; naprawionych 11; mutacja M8 → `[R5] exit=1`, cofnięta. |
| 4 | **PRZYJMUJĘ** | Kryterium binarne i w chwili raportu Evaluatora niespełnione. Uruchomiłem **wszystkie 26 zmodyfikowanych przeze mnie bramek Chromium** + `miasta-panstwa-wylaczone-ui-render-test.cjs` — tabela niżej. |
| 5 | **PRZYJMUJĘ** | Eksperyment powtórzony metodą wskazaną przez Evaluatora: kopia kodu bazowego `91877f11` z **nazwą prywatną** `civ-obrona-z5-prywatny`, 2× równolegle → **`A=1 B=1`**, te same dwa objawy (`ENOTEMPTY … rmdir`, `failed to load config from`). Mechanizm dowiedziony bez dotknięcia ścieżki używanej przez inny worktree; plik roboczy i katalog usunięte, drzewo czyste. |
| 6 | **PRZYJMUJĘ** | Narracja tego raportu ograniczona; materiał dowodowy §3c przeniesiony do tabel (dispatch: „tabela nie liczy się do limitu — jest wytworem"). Raportu `01` **nie skracam**: to dokument, który Evaluator faktycznie oceniał; przepisanie go po ocenie zaciemniłoby ślad dla Final Control (§13b). |
| 7 | **ODRZUCAM jako zarzut wobec Operatora** (co do treści — zgoda) | Dowód z normy: §9 pkt 4 — „Zmiana samego procesu nigdy nie jedzie w allowliście tematu produktowego". Jedyny rejestr bramek to `R-PROC-AUTOBOT.md` §6, jawnie zakazany w allowliście dispatchu. Rejestracja **nie mogła** się tu wydarzyć bez naruszenia granicy `FAIL`. Przekazuję orkiestratorowi jako osobny temat `PROCESS`. |

## Czym zastąpiłem handlery sygnałów (Z1)

Sweep **startowy**, nie sygnałowy: kasuje wyłącznie wpisy o sygnaturze `-<pid>-<6 znaków>`,
których **proces już nie żyje** (`process.kill(pid,0)`; `EPERM` = „żywy", czyli w stronę
zachowawczą). Zmierzone na przynętach — martwy PID **usunięty**; żywy PID **nietknięty**;
`*-shots-*` **zachowany** (§9 pkt 6); nazwa bez sygnatury **nietknięta**. Przy okazji
odzyskał dwie realne sieroty (`era-change-notify-bundle-5770-…`, `-7191-…`) — wyciek był
faktem, nie hipotezą. Katalog osierocony przez zabity przebieg został sprzątnięty przez
sweep następnego. Nazwy bez sygnatury (m.in. niezałatane kopie w `wt-garnizon`) są poza
zasięgiem sweepa z konstrukcji — §2b nietknięte.

**Korekta własnego pomiaru:** pierwszy przebieg testu zabijalności był NIEWAŻNY — zabiłem
podpowłokę (PID 15221), nie node'a (15223), który przeżył. Powtórzone na PID node'a.
Zgłaszam, bo ten właśnie błąd pomiarowy mógł mnie doprowadzić do fałszywego „naprawione".

## Luka, która ZOSTAJE (zgłaszam, nie ukrywam)

Cztery pliki używają `fs.mkdtempSync(path.join(os.tmpdir(), 'civ-…-'))` — `weterani`,
`hud-moc-warstwa`, `hud-obywatele-chip`, `moc-ranking-rozjazd`. Unikalność mają
z definicji kontraktu Node (GOAL spełniony), ale ich nazwy **nie niosą PID-a**, więc
sweep nie ma jak orzec, czy katalog jest sierotą, czy własnością żywego przebiegu —
i celowo ich nie rusza. Przerwany przebieg tej czwórki zostawi katalog na dysku.
Nie „naprawiam" tego przez zgadywanie po czasie modyfikacji: skasowanie katalogu
żywej bramki jest gorsze niż jeden zostawiony katalog.

## DO DECYZJI CZŁOWIEKA

**Domyślne nazwy katalogów raportowych `--out`** (`flaga-mp-*`, `wojny-kamien-ev/fc`).
Uczyniłem je unikalnymi, bo stała nazwa łamie GOAL, ale są to **wytwory dla człowieka**,
nie artefakty wewnętrzne: komu w nawyku albo w skrypcie siedzi stały `/tmp/ev-wojny-out`,
temu zmiana domyślnej nazwy go psuje. Wytwór sam nie rozstrzyga, czy to martwe
jednorazówki z zamkniętych tematów (tak sugerują nazwy `ev`/`fc`/`audyt`), czy żywy
warsztat. Wywołanie z jawnym `--out` jest nietknięte w obu wariantach. Rozróżnienie, które
zastosowałem: cel konsumowany w tym samym procesie (DIST/WORK) dostaje sufiks sprzątany
przez sweep; wytwór do odczytania później (raporty, zrzuty) dostaje sufiks `-p<pid>`
**celowo poza sygnaturą sweepa**, żeby sweep nie skasował dowodu.

## Dwie obserwacje z tej fazy (nie zarzuty — ustalenia)

**1. `miasta-panstwa-wylaczone-ui-render-test.cjs` jest czerwona PRE-ISTNIEJĄCO.**
Nie deklaruję tego — zmierzyłem tą samą metodą, której użyłem przy szóstce czerwonych
w rundzie 1: podmieniłem plik na wersję z `91877f11` i uruchomiłem. **Obie wersje dają
`11 pass, 1 fail`, na tej samej asercji** (`log silnika "[NewGame] Mapa: …" pojawił się`).
Moja zmiana dotyczy wyłącznie nazwy katalogu buildu i nie ma z tą asercją związku.
Plik przywrócony, drzewo czyste.

**2. Bramka `mgla-odkrycie-wzdluz-sciezki-live-render-test.cjs` brudzi repo poza
jakąkolwiek allowlistą.** Zapisuje zrzuty do **śledzonego w gicie** katalogu CUDZEGO
tematu (`dyspozycje/autobot/runs/P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1/dowody/`) — samo
jej uruchomienie zmodyfikowało `live-02-po-turze.png`. Przywróciłem plik (`git checkout`),
drzewo jest czyste i tej zmiany NIE commituję. To ta sama klasa co temat tej rundy —
wspólny, stały cel zapisu, do którego pisze więcej niż jeden przebieg — tyle że wewnątrz
repo, nie w `/tmp`, więc żadna z reguł R1–R5 jej nie widzi. **Nie naprawiam tego sam:**
przeniesienie katalogu zrzutów zmienia miejsce, w którym cudzy zamknięty temat trzyma
swój dowód wizualny (§9 pkt 6), a tego wytwór nie rozstrzyga. Kandydat na osobny temat.

## Obciążenie maszyny — dlaczego zmniejszyłem równoległość

Przy czterech bramkach Chromium naraz `load average` sięgnął **13,9**. To ten sam zakres,
w którym padły próby 1–2 z rundy 1 (18–25) — a bramka przewrócona brakiem CPU raportuje
`FAIL`, którego nikt nie odróżni od regresu. Zszedłem na dwa równoległe przebiegi:
wolniej, ale wynik znaczy to, co znaczy. Sam sweep pod tym obciążeniem zachował się
poprawnie — w szczycie sześć katalogów z sygnaturą, **wszystkie z żywym PID-em, zero
skasowanych**, katalogi zrzutów nietknięte.

Przy zmniejszaniu równoległości ubiłem sygnałem dwie osierocone bramki i dostałem
**niezamierzone potwierdzenie obu połówek naprawy Z1 naraz**: obie zginęły od `SIGTERM`
natychmiast (przed naprawą połknęłyby go), a ich katalogi robocze zniknęły przy starcie
następnej bramki — **poza katalogiem `…-shots-…`, który sweep zachował**, bo zrzut jest
dowodem (§9 pkt 6). Zabijalność i sprzątanie zadziałały w warunkach produkcyjnych, nie
na przynętach.

## TESTY (uruchomione w tej fazie, nie przepisane)

| bramka | wynik |
|---|---|
| `tsc --noEmit` | **0 błędów** (14,5 s) |
| `logic-test` | **213/213** |
| `tech-tree-test` | **19/19** |
| `research-test` | **33/33** |
| `unit-replace-test` | **13/13** |
| `combat-test` | **6/6** |
| `mgla-sciezka-inwariant-test` | **42/42** |
| `bramki-tmpdir-unikalnosc-test` | **PASS=3 FAIL=0**; M2→R4, M6→R1, M7→R4, M8→R5, każda `exit=1`, wszystkie cofnięte |

15 szybkich bramek zmodyfikowanych w tym temacie, każda osobno — **wszystkie `exit=0`**:
`_tmp-battle-roster`, `_tmp-siege` 11/11, `city-defense-terrain-gate` 34/34,
`counter-migration` 15/15, `defense-breakdown` 44/44, `era-change-notify` 8/8,
`fortify-pole` 41/41, `teren-walki-etapy`, `walka-jeden-kontratak` 24/24,
`walka-morale-przewaga-mocy` 123/123, `hud-moc-warstwa`, `hud-obywatele-chip` 20/20,
`moc-ranking-rozjazd`, `structure-defense-bonus` 8/8, `weterani`.
