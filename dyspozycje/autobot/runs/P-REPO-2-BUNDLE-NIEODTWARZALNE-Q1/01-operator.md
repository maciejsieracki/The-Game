# 01 — OPERATOR (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/INFRA
TEMAT: `P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1`
MODEL+EFFORT: Sonnet 5, effort high
GOAL: WYŁĄCZNIE przygotowanie — dokument utraty + dokładna komenda `filter-repo`
(nieuruchomiona) + próba rozszerzenia `sync-playtest-bundles.cjs`. Zero wykonania
rewrite historii w tej rundzie.

Worktree: `/home/user/wt-repo-bundle-nieodtwarzalne`, gałąź
`autobot/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1` od `origin/main` = `10aeec78`
(origin/main przesunął się w trakcie pracy innej równoległej sesji na `e5baa201` —
sprawdzone `git merge-base origin/main HEAD` = `10aeec78`, mój branch nadal jego
przodkiem, `gra/src`+`gra/data` diff od merge-base pusty, zero konfliktu z tym
tematem).

## GOAL 1 — zakres filter-repo, ustalony reconem (nie zgadnięty)

**Nie istnieje osobny `docs/decyzje/<ID>.md` dla bramki filter-repo** — sprawdzone
`Glob docs/decyzje/*.md` (403 pliki, żaden P-REPO-2-BUNDLE ani ogólny
"filter-repo-zakres"). Jedyny pisemny zapis celu to łańcuch:
`R-REPO-SPRZATANIE-SREDNIE-Q1` (01/02/03, nota N2/F1 Evaluatora i Final Control)
→ `dyspozycje/PYTANIA-OTWARTE.md:4357` (pytanie ABC) →
`dyspozycje/REJESTR-PROSB-I-ZADAN.md:4357,4379` (ECHO właściciela, dosłowny cytat
w `00-dispatch.md`). Ten łańcuch mówi **wyłącznie** o ośmiu plikach
`gra-robocza/Gra-ROBOCZA-PLAYTEST-*.html` — nigdzie nie pada `gra-kanon/`,
`docs/ux/`, `_archiwum/`, `_backup/` ani `tools — kopia/` (też usunięte w tym samym
commicie `1f2b430f`, ale z innego powodu — martwy kod, nie "nieodwracalna utrata
wartościowej treści"). **Zakres GOAL 1 = wyłącznie te 8 plików, nic więcej** —
rozszerzenie na resztę 592 MB usuniętych w `R-REPO-SPRZATANIE-SREDNIE-Q1` byłoby
zgadywaniem zakresu, którego dispatch wprost zakazuje.

**Ustalone reconem (git plumbing, nie filter-repo — patrz GRANICE niżej):**

- 8 ścieżek, zero rename'ów strukturalnych (`git log --name-status` na każdej: tylko
  kody `A D M`, nigdy `R`) — literalne dopasowanie `--path` w komendzie niżej jest
  kompletne, nie brakuje żadnej historycznej nazwy. (`--follow` sugerował fałszywe
  „przenosiny" z `gra-kanon/Gra-podglad*.html` — to heurystyka podobieństwa treści
  git loga, nie prawdziwy rename; bez znaczenia dla `filter-repo`, który dopasowuje
  ścieżki literalnie.)
- Pierwszy commit wszystkich 8: `f2df10f2`, 2026-07-06. Usunięcie z working tree:
  `1f2b430f`, 2026-08-26 (`R-REPO-SPRZATANIE-SREDNIE-Q1`). Treść żyje w historii
  między tymi datami na `origin/main` (**34 commity** dotykają którejś z 8 ścieżek,
  `git rev-list --count origin/main -- <8 ścieżek>`) oraz na **281 z 298 innych
  gałęzi zdalnych** (patrz niżej); **386** to suma commitów dotykających tych
  ścieżek w CAŁYM repo (`--all`, `main` + 298 gałęzi razem) — poprawka wprowadzona
  w rundzie obrony po zarzucie Evaluatora, patrz `02-utrata-bundli.md` §Commity.
- **Nowe ryzyko zakresu, nieujęte w dotychczasowej dyspozycji: 298 gałęzi zdalnych
  poza `main`, ŻADNA nie jest przodkiem `origin/main`** (`git merge-base
  --is-ancestor` = fałsz dla wszystkich 298) — to stare, nigdy nieusunięte gałęzie
  tematów AutoBot/Cursor z odrębną historią (integracja tego repo bywała przez
  cherry-pick/odtworzenie treści, nie zawsze `git merge`, więc gałąź tematu
  pozostaje osobną linią czasu na zawsze). **281 z tych 298 ma WŁASNE commity
  dotykające którejś z 8 ścieżek.** Konsekwencja: `filter-repo` uruchomiony na
  pełnym mirror-klonie (wszystkie refy) miałby nieporównywalnie większy promień
  rażenia niż dotychczas dyskutowano (force-push 299 gałęzi zamiast jednej) — i
  odwrotnie, rewrite WYŁĄCZNIE `main` **nie** czyni utraty pełną: treść nadal
  byłaby odczytywalna z tych gałęzi, dopóki ktoś ich też nie usunie/przepisze.
  **To pytanie nie ma dotąd żadnej decyzji właściciela** — ECHO cytowane w
  dispatchu odpowiadało wyłącznie na pytanie „zaakceptować utratę 2 bundli", nie
  na „co zrobić z 298 innymi gałęziami". Rekomendacja OPERATORA (nie decyzja):
  komenda niżej celuje **wyłącznie w `main`** (świeży, pojedynczy klon
  `--single-branch --branch main`, nie mirror) — to jedyny zakres pokryty
  faktycznym ECHO. Sprzątanie 298 gałęzi to osobny temat `PROCESS`, wymaga
  własnego dispatchu i własnej zgody właściciela; wskazuję go jako notatkę do
  rejestru, nie rozstrzygam tutaj.

## GOAL 2 — dokument utraty i dokładna komenda

Oba w plikach tego runu:
- [`02-utrata-bundli.md`](02-utrata-bundli.md) — pełna lista traconych elementów,
  cytat ECHO, uzasadnienie.
- [`03-komenda-filter-repo.md`](03-komenda-filter-repo.md) — dokładna komenda,
  krok po kroku, plan rollbacku, co dzieje się PO uruchomieniu.

**Werfyfikowalność komendy (§ reguła anty-samooszukiwania) — jawne ograniczenie.**
GRANICE tego dispatchu zakazuje bezwzględnie `git filter-repo` „w tym w worktree
Operatora", bez wyjątku dla `--analyze`/`--dry-run` — w odróżnieniu od GOAL 2,
który dopuszcza je warunkowo („jeśli narzędzie to wspiera"). Rozstrzygnąłem
konflikt na rzecz **dosłownego brzmienia GRANICE** (potrójnie powtórzony zakaz
nazywa narzędzie wprost, bez warunku) — **nie uruchomiłem `git filter-repo` w
żadnym trybie**, także nie w jednorazowym klonie-wyrzutce. Zamiast tego zakres i
rozmiar zweryfikowałem czystym gitem (`git rev-list --objects --all`, `git
cat-file --batch-check`, `git ls-tree`, `git log --name-status`) — dokładny ślad
komend w `03-komenda-filter-repo.md` §Weryfikacja. To NIE jest równoważne
`--analyze`, więc **pierwszym krokiem faktycznego wykonania musi być
`git filter-repo --analyze` na świeżym klonie** — jawnie zapisane jako Krok 1
komendy, nieuruchomione przeze mnie.

## GOAL 3 — rozszerzenie sync-playtest-bundles.cjs

**WYKONALNE, zrobione.** Recon (nie zgadywanie): `git log --all --follow` na obu
plikach ujawnił, że do 2026-07-27 (commit `74ad7f2a`) `BITWA-DUZA`/`OBLEZENIE-DUZE`
miały **identyczny blob SHA co `Gra-ROBOCZA.html` w tym samym commicie** — czyli
były synchronizowane tym samym mechanizmem „kopia głównego bundla" co pozostała
szóstka, tyle że nie przez ten konkretny skrypt (`git log --all -p` na
`sync-playtest-bundles.cjs` nigdy nie zawiera tych dwóch nazw — inny, nieznaleziony
w repo mechanizm je synchronizował). Po `74ad7f2a` synchronizacja ustała — plik
zamarł na blobie `1e8486b7` (md5 `95021308`) aż do usunięcia. **Żaden z 10
historycznych blobów obu plików (`git log --all` przeliczone jeden po drugim) nie
jest inną, "poprawniejszą" treścią niż ten ostatni — wszystkie to kolejne zamrożone
migawki tego samego mechanizmu, żaden nie różni się jakościowo.** Rozszerzenie
skryptu o te dwie nazwy przywraca dokładnie ten sam efekt końcowy, jaki miały do
2026-07-27 — nie jest to nowy wymysł, tylko odtworzenie zerwanej synchronizacji.

Zmiana: `gra-robocza/tools/sync-playtest-bundles.cjs` — `names[]` z 6 na 8 pozycji
+ komentarz źródłowy z dowodem. Nowy plik:
`gra-robocza/tools/sync-playtest-bundles-test.cjs` — żywy test, uruchamia
PRAWDZIWY skrypt (kopię pliku, nie reimplementację) w izolowanym `os.tmpdir()` na
kopii bieżącego `Gra-ROBOCZA.html`, zero zapisu w drzewie repo. Wynik:

```
=== WYNIK: 9/9 ===
```

(8 nazw × md5 zgodny z bundlem źródłowym + 1 dowód nietautologiczności: skrypt
sprzed tego tematu, uruchomiony na tych samych oczekiwanych nazwach, poprawnie
**nie** tworzy dokładnie tych dwóch przywróconych plików — test faktycznie
odróżnia stan przed/po).

**Uwaga o ścieżce w dispatchu.** Dispatch (linia 6, allowlista) nazywa plik
`gra/tools/sync-playtest-bundles.cjs` — taki plik **nie istnieje**
(`find` po całym repo: jedyne trafienie to `gra-robocza/tools/`). Potraktowałem to
jako oczywistą literówkę ścieżki w dispatchu (treść WYZWALACZ/RECON dispatchu
poprawnie cytuje `gra-robocza/tools/sync-playtest-bundles.cjs`) i pracowałem na
realnej, jedynej istniejącej ścieżce — zgłaszam wprost, nie milczę o rozbieżności.

**`tsc --noEmit` — pominięty, zasadnie.** `gra/tsconfig.json` ma
`"include": ["src"]` — `gra-robocza/tools/**` nie jest w ogóle objęte kompilacją
TypeScript (to `.cjs`, nie `.ts`, i leży poza `gra/`). Kryterium końca 4 dispatchu
przewiduje dokładnie ten przypadek („jeśli nie, pomiń").

**5 bramek referencyjnych — nie dotyczy.** `gra/src` i `gra/data` mają pusty diff
od merge-base (potwierdzone `git diff --stat`), więc logika gry jest bajtowo
nietknięta — bramki `logic-test`/`tech-tree-test`/`research-test`/
`unit-replace-test`/`combat-test` nie mogły zmienić wyniku. Nie uruchamiałem ich
osobno (nie ma czego regresować w pliku, którego diff jest pusty) — jeśli
Evaluator chce niezależnego potwierdzenia liczbami, mogę je odpalić w rundzie
obrony.

## Zmiany / commit

Jeden commit na tej gałęzi, allowlista:
- `dyspozycje/autobot/runs/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1/01-operator.md` (ten plik)
- `dyspozycje/autobot/runs/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1/02-utrata-bundli.md`
- `dyspozycje/autobot/runs/P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1/03-komenda-filter-repo.md`
- `gra-robocza/tools/sync-playtest-bundles.cjs` (rozszerzenie `names[]`, GOAL 4)
- `gra-robocza/tools/sync-playtest-bundles-test.cjs` (nowy, żywy test GOAL 4)

Zero zmian w `gra/src`, `gra/data`, `.git/**` (poza odczytem), `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`, `docs/decyzje/**`. Zero
uruchomienia `git filter-repo`/`filter-branch`/`push --force` w jakiejkolwiek
formie, także `--analyze`/`--dry-run`.

## Testy

`node gra-robocza/tools/sync-playtest-bundles-test.cjs` → `9/9`, exit 0.
`git status --short` po teście → tylko dwa pliki `.cjs` z allowlisty, zero
niespodziewanych artefaktów w `gra-robocza/` (test działa w `os.tmpdir()`).
`git diff --stat <merge-base> HEAD -- gra/src gra/data` → pusty.

## Blokady

Brak blokady technicznej. **Otwarta kwestia do rejestru** (nie blokuje tej rundy,
bo GOAL 1 ma jednoznaczny zapis celu dla 8 plików): 298 gałęzi zdalnych poza
`main`, z czego 281 dotyka tych samych plików własnymi commitami — decyzja o ich
losie nie jest częścią obecnego ECHO i wymaga osobnego tematu PROCESS przed
uznaniem utraty za faktycznie pełną/nieodwracalną w całym repozytorium (patrz
GOAL 1 wyżej i `03-komenda-filter-repo.md` §Zakres).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO
