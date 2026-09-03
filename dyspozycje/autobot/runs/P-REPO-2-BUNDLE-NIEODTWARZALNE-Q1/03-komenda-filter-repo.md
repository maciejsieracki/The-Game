# Dokładna komenda `git filter-repo` — przygotowana, NIEURUCHOMIONA

**Ta runda nie uruchomiła żadnej z komend niżej — ani w trybie destrukcyjnym, ani
w `--analyze`/`--dry-run`.** GRANICE dispatchu `00-dispatch.md` zakazuje
`git filter-repo` bezwzględnie, bez wyjątku dla trybu analizy, „w tym w worktree
Operatora" — potraktowałem to jako zakaz bez furtki i nie wywołałem narzędzia w
żadnej postaci, także nie w jednorazowym klonie-wyrzutce. Zakres i rozmiar
zweryfikowałem czystym gitem (`git rev-list`, `git cat-file`, `git ls-tree`,
`git log --name-status`) — pełny ślad w `01-operator.md` §GOAL 1/2 i niżej.
**Konsekwencja: Krok 1 (`--analyze`) poniżej jest częścią właściwego wykonania,
NIE czymś, co ja już potwierdziłem** — musi go uruchomić ten, kto faktycznie
wykonuje operację, zanim przejdzie do Kroku 4.

## Zakres

Wyłącznie gałąź `main` (patrz `01-operator.md` §GOAL1 — 298 innych gałęzi
zdalnych, 281 z nich dotyka tych samych plików, pozostaje poza zakresem tej
operacji, bo nie ma na nie ECHO właściciela). Osiem ścieżek, dopasowanie
literalne (zweryfikowane: zero rename'ów strukturalnych na żadnej z nich):

```
gra-robocza/Gra-ROBOCZA-PLAYTEST-WALKA.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-ODSKOK.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-MAPA.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-MIASTO.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html
gra-robocza/Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html
```

## Krok 0 — backup PEŁNEGO repo (rollback przed czymkolwiek)

Zrób to PRZED dotknięciem czegokolwiek. To jedyny sposób odzyskania stanu, gdyby
coś poszło źle na dowolnym kroku niżej — łącznie z 298 gałęziami spoza zakresu tej
operacji, które i tak trzeba mieć w kopii.

```bash
git clone --mirror <URL-origin-tego-repo> \
  /sciezka/backup/civ-the-game-PRZED-filter-repo-$(date +%Y%m%d-%H%M).git
```

Zweryfikuj kopię przed kontynuacją: `git -C <backup>.git rev-list --all --count`
ma zwrócić tę samą liczbę commitów co świeży `git fetch` na oryginale, a
`git -C <backup>.git branch -r | wc -l` ma pokazać 299 gałęzi (albo więcej, jeśli
ktoś doda w międzyczasie).

## Krok 1 — świeży, izolowany klon TYLKO `main` + `--analyze`

Nigdy na oryginalnym repo ani na worktree Operatora. Świeży klon tylko jednej
gałęzi (nie mirror z 299 gałęziami — to celowo ogranicza blast radius do
dokładnie tego, co obejmuje ECHO):

```bash
git clone --single-branch --branch main <URL-origin-tego-repo> \
  /sciezka/scratch/civ-filter-repo-main-only
cd /sciezka/scratch/civ-filter-repo-main-only
git filter-repo --analyze
```

Przejrzyj `.git/filter_repo/analysis/path-all-sizes.txt` (posortowane od
największych) i potwierdź naocznie, że osiem ścieżek z §Zakres wyżej rzeczywiście
figuruje jako największe pozycje — to jest właściwy dry-run wymagany kryterium 2
`00-dispatch.md`, którego ja nie wykonałem (patrz nagłówek tego pliku).

## Krok 2 — właściwe usunięcie (NIEODWRACALNE od tego momentu)

Dopiero po ręcznym potwierdzeniu Kroku 1. W tym samym katalogu ze Kroku 1
(`filter-repo` wymaga świeżego klonu lub `--force`; ten klon jest świeży, więc
`--force` nie powinno być potrzebne — dodaj je tylko, jeśli narzędzie odmówi mimo
świeżego klonu, bo `--analyze` zostawił ślad w `.git/filter_repo/`):

```bash
git filter-repo --invert-paths \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-WALKA.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-ODSKOK.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-MAPA.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-MIASTO.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html \
  --path gra-robocza/Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html
```

`--invert-paths` + osiem `--path` = „usuń dokładnie te osiem ścieżek z każdego
commita całej historii `main`, zostaw wszystko inne nietknięte". `filter-repo`
sam przelicza wszystkie commity od korzenia — SHA każdego commita na `main` się
zmieni (to jest właśnie „przepisanie historii").

**Efekt uboczny narzędzia, do zapamiętania:** `filter-repo` domyślnie **usuwa
remote `origin`** z klonu po zakończeniu (zabezpieczenie przed przypadkowym
pushem nieprzejrzanej rewrite'y). Trzeba go dodać ponownie przed Krokiem 4.

## Krok 3 — weryfikacja PO, w tym samym klonie

```bash
git log --all --oneline -- gra-robocza/Gra-ROBOCZA-PLAYTEST-WALKA.html   # 0 wynikow = usuniete z historii
git log --all --oneline -- gra-robocza/Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html  # 0 wynikow
md5sum gra-robocza/Gra-ROBOCZA.html   # ma dzialac, plik nietkniety (nie byl w --path)
node ./node_modules/typescript/bin/tsc --noEmit   # 0 bledow, jesli node_modules obecne
du -sh .git   # zmierzony spadek vs backup z Kroku 0
```

Powtórz dla pozostałych sześciu nazw. Wszystkie muszą dać 0 wyników w
`git log --all`.

## Krok 4 — push (OSOBNA autoryzacja, NIE ten sam krok co Krok 2)

**Nie część tej bramki.** Wymaga jawnej, oddzielnej zgody właściciela
bezpośrednio przed wykonaniem — dokładnie jak `00-dispatch.md` §OBIEG i §GRANICE
wymagają. Gdy autoryzacja padnie:

```bash
git remote add origin <URL-origin-tego-repo>   # filter-repo go usunal w Kroku 2
git push --force origin main
```

Po pushu: `origin/main` ma nową historię. Każdy inny klon repozytorium (inne
maszyny, inne worktree tej sesji, w tym wszystkie obecnie żywe worktree AutoBota)
rozjeżdża się z nowym `origin/main` i wymaga `git fetch` + ponownego
`git reset --hard origin/main`/nowego klona — to nie jest opcjonalne po
force-push przepisanej historii, stare lokalne kopie mieszają starą i nową linię
commitów.

## Rollback

- **Przed Krokiem 4 (przed pushem):** rollback = usuń katalog scratch-clone ze
  Kroku 1/2. `origin/main` na serwerze jest nietknięty aż do faktycznego pusha —
  do tego momentu operacja jest w pełni odwracalna samym skasowaniem lokalnego
  klonu.
- **Po Kroku 4 (po pushu):** rollback NIE jest możliwy standardowymi środkami —
  to jest właśnie nieodwracalność, którą ECHO właściciela akceptuje. Jedyna
  ścieżka awaryjna: `git push --force origin <backup-mirror-z-Kroku-0>:main`,
  czyli przywrócenie całej gałęzi `main` z kopii zapasowej — **to również
  force-push i również wymaga świadomej decyzji**, nie jest „bezpiecznym Ctrl+Z".
  Backup z Kroku 0 jest jedynym, co czyni tę ścieżkę w ogóle możliwą — bez niego
  po Kroku 4 nie ma odwrotu w żadnej formie.

## Co NIE jest częścią tej operacji (jawnie, żeby nikt się nie pomylił)

- `gra-kanon/`, `docs/ux/`, `_archiwum/`, `_backup/`, `tools — kopia/` —
  nadal w historii `main`, bez ECHO co do ich losu. Osobny temat, jeśli
  właściciel zechce.
- 298 gałęzi zdalnych poza `main` — nietknięte tą komendą, treść ośmiu plików
  nadal odczytywalna z 281 z nich. Osobny temat PROCESS, jeśli pełne
  wyeliminowanie treści z całego repozytorium (nie tylko z `main`) ma być celem.
- `git gc --aggressive`/`git repack` po rewrite — `filter-repo` uruchamia `git gc`
  automatycznie na końcu (chyba że podano `--no-gc`); nie trzeba nic dodatkowego
  poza standardowym zachowaniem narzędzia.
