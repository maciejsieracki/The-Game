# Dokument utraty — 8 bundli PLAYTEST, bramka `git filter-repo`

**Status:** przygotowanie. Ten dokument opisuje, co `git filter-repo` (gdy zostanie
faktycznie uruchomiony — NIE w tej rundzie) usunie **nieodwracalnie z historii
Gita**, dla wszystkich osób mających klon tego repozytorium, nie tylko lokalnie.

## Zgoda właściciela (ECHO, dosłowny cytat)

> „Zaakceptuj trwałą utratę tych 2 bundli (BITWA-DUZA, OBLEZENIE-DUZE), idź dalej
> z filter-repo"

Źródło: `dyspozycje/REJESTR-PROSB-I-ZADAN.md:4357` (odpowiedź na pytanie ABC
`P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1`), potwierdzone dispatchem tego tematu
(`00-dispatch.md`, sekcja WYZWALACZ).

**Zakres tej zgody — dosłownie, bez rozszerzania.** Pytanie, na które odpowiedział
właściciel, brzmiało: „Bramka `filter-repo` (nieodwracalne przepisanie historii
Gita) zablokowana — 2 z 8 bundli PLAYTEST nie odtworzą się wcale. Jak postąpić?".
Zgoda dotyczy więc **wyłącznie** odblokowania bramki filter-repo dla ośmiu plików
PLAYTEST, w tym świadomej akceptacji, że dwa z nich (BITWA-DUZA, OBLEZENIE-DUZE)
nie mają mechanizmu automatycznego odtworzenia. Nie jest to zgoda na usunięcie z
historii czegokolwiek innego (`gra-kanon/`, `docs/ux/`, `_archiwum/`, `_backup/`) —
te zostały usunięte z **drzewa roboczego** w osobnym temacie
(`R-REPO-SPRZATANIE-SREDNIE-Q1`) z innym uzasadnieniem (martwy kod, nie
nieodtwarzalna treść) i nadal żyją w historii Gita bez żadnej decyzji o ich losie.

## Co dokładnie zostanie utracone nieodwracalnie

Wszystkie 8 plików: `gra-robocza/Gra-ROBOCZA-PLAYTEST-<NAZWA>.html`. Usunięte z
drzewa roboczego commitem `1f2b430f` (2026-08-26, `R-REPO-SPRZATANIE-SREDNIE-Q1`);
dziś nadal odczytywalne z historii (`git show 1f2b430f^:<ścieżka>`). Stan
bezpośrednio przed usunięciem (ostatnia żywa treść, commit `1f2b430f^` =
`39ae5d17`):

| Plik (`Gra-ROBOCZA-PLAYTEST-<NAZWA>.html`) | Blob SHA | Rozmiar | md5 | Odtwarzalność po `filter-repo` |
|---|---|---|---|---|
| `WALKA` | `5957e86f` | 37 475 652 B | `28d236f5` | Plik pod tą nazwą **powstanie ponownie** (rozszerzony skrypt, patrz niżej), ale jako **bieżący** `Gra-ROBOCZA.html`, nie ten historyczny — bajtowa treść `28d236f5` ginie bezpowrotnie |
| `ODSKOK` | `5957e86f` | 37 475 652 B | `28d236f5` | jw. |
| `ODSKOK-OBLEZENIE` | `5957e86f` | 37 475 652 B | `28d236f5` | jw. |
| `OBLEZENIE-3v3` | `5957e86f` | 37 475 652 B | `28d236f5` | jw. |
| `MAPA` | `e1bceb4a` | 37 475 652 B | `04a7adcb` | Odtwarzalny **bajtowo identycznie** — `04a7adcb` był już wtedy równy bieżącemu `Gra-ROBOCZA.html`, skrypt kopiuje ten sam plik |
| `MIASTO` | `e1bceb4a` | 37 475 652 B | `04a7adcb` | jw. — bajtowo identyczny |
| **`BITWA-DUZA`** | `1e8486b7` | 34 516 352 B | `95021308` | **Plik pod tą nazwą powstanie ponownie** (skrypt rozszerzony w tej rundzie), ale jako kopia BIEŻĄCEGO `Gra-ROBOCZA.html` — treść `95021308` (zamrożona od 2026-07-27, `--follow` w historii potwierdza że to ostatnia zsynchronizowana migawka) **ginie bezpowrotnie i nieodwracalnie** |
| **`OBLEZENIE-DUZE`** | `1e8486b7` | 34 516 352 B | `95021308` | jw. — **nieodwracalna utrata treści `95021308`** |

**Rzeczywista, dosłowna utrata dotyczy 6 z 8 plików pod względem bajtowej
historycznej treści** (tylko MAPA/MIASTO są dziś identyczne z bieżącym bundlem —
reszta traci swoją unikalną, zamrożoną wersję). Wcześniejsze uzasadnienie
„odtwarzalne jedną komendą" (tabela `R-REPO-SPRZATANIE-SREDNIE-Q1`) było, jak
ustalił tamten Evaluator i Final Control niezależnie (`02-evaluator.md` nota N2,
`03-final-control.md` §4d), **ścisłe wyłącznie dla MAPA/MIASTO** — dla pozostałej
szóstki „odtwarzalne" oznacza „pod tą nazwą powstanie plik", nie „powstanie ta sama
treść". Właściciel akceptował explicite tylko utratę BITWA-DUZA/OBLEZENIE-DUZE
(bo tylko te dwie nie miały wtedy ŻADNEGO mechanizmu tworzącego plik pod tą
nazwą) — utrata bajtowej treści pozostałej czwórki (WALKA/ODSKOK/ODSKOK-OBLEZENIE/
OBLEZENIE-3v3, md5 `28d236f5`) nie była nazwana wprost w pytaniu ABC, choć jest
tym samym rodzajem straty. Zgłaszam to jawnie jako doprecyzowanie — nie jako
przeszkodę: rozszerzony skrypt (ta runda) sprawia, że po `filter-repo` **wszystkie
8 nazw dalej istnieją jako pliki**, więc funkcjonalny skutek dla PLAYTEST-hubu jest
identyczny dla całej ósemki, mimo że bajtowa treść ginie tylko dla sześciu.

## Commity, których dotyczy operacja

**34 commity na `origin/main`** dotykają którejś z 8 ścieżek (pierwszy `f2df10f2`,
2026-07-06; ostatni z żywą treścią `1f2b430f^`=`39ae5d17`, 2026-08-26; zweryfikowane
`git rev-list --count origin/main -- <8 ścieżek>`). To jest zakres faktycznej
operacji `filter-repo` opisanej w `03-komenda-filter-repo.md` (celuje wyłącznie w
`main`). Osobno, dla porównania skali: **386 commitów w całej historii repozytorium**
(`--all`, czyli 34 z `main` plus commity z pozostałych 298 gałęzi zdalnych, patrz
`01-operator.md` §GOAL 1) dotyka którejś z 8 ścieżek — ta liczba NIE opisuje zakresu
komendy niżej, tylko skalę, gdyby ktoś kiedyś zdecydował rozszerzyć operację na
wszystkie gałęzie.

Pełna, zweryfikowana liczba unikalnych obiektów gita dowolnego typu, jakie
kiedykolwiek istniały pod tymi 8 ścieżkami w całej historii (`--all`): **1545
obiektów łącznie — z czego 389 to unikalne blob-y, 386 to commit-y (ta sama liczba
co wyżej, inny licznik: tu commit jako obiekt gita, nie „commit dotykający ścieżki"
w sensie diffa), 770 to tree** (rozbicie per typ: `git rev-list --objects --all --
<8 ścieżek> | git cat-file --batch-check='%(objectname) %(objecttype)
%(objectsize)'`, policzone `awk` po kolumnie typu). Suma rozmiarów tych **389
blobów: ok. 11,61 GB nieskompresowanej treści** (zmierzone tym samym poleceniem,
`awk` sumujące kolumnę rozmiaru dla wierszy `blob`).
Realny spadek rozmiaru `.git` po `gc` będzie dużo mniejszy niż 11 GB (obiekty są
dziś delta-skompresowane w pakach), ale rząd wielkości potwierdza, że operacja ma
realny sens dla rozmiaru repo, nie tylko dla „porządku".

**Otwarte, nieudokumentowane dotąd ryzyko zakresu — patrz `01-operator.md` §GOAL 1
i `03-komenda-filter-repo.md` §Zakres:** 298 gałęzi zdalnych poza `main`, żadna nie
jest przodkiem `main`, 281 z nich ma własne commity dotykające tych 8 ścieżek.
Komenda w `03-komenda-filter-repo.md` celuje wyłącznie w `main` — na tych 281
gałęziach treść pozostanie czytelna aż do osobnej decyzji o ich losie. To
oznacza, że sformułowanie „nieodwracalna utrata" w tym dokumencie jest ścisłe
**dla linii historii `main`**, nie dla całego repozytorium wraz z jego
niewkasowanymi gałęziami tematów.

## Podsumowanie dla właściciela/orkiestratora

1. Zgoda właściciela pokrywa dokładnie to, co ten dokument opisuje: usunięcie
   ośmiu plików PLAYTEST z historii `main`, ze świadomością że dwa z nich
   (BITWA-DUZA, OBLEZENIE-DUZE) nie mają dziś żadnego mechanizmu odtwarzającego
   plik pod tą nazwą.
2. Ta runda **dodała** mechanizm odtwarzający plik pod tą nazwą dla całej ósemki
   (rozszerzony `sync-playtest-bundles.cjs`) — więc po `filter-repo` **żadna z 8
   nazw nie zniknie z hubów** (`gra-robocza/START.html` itp.), tylko sześć z nich
   będzie zawierać bieżący bundel zamiast swojej historycznej, zamrożonej wersji.
3. Bajtowa treść sześciu wersji (`28d236f5`×4, `95021308`×2) ginie nieodwracalnie
   z linii historii `main`. To jest właśnie ta utrata, którą właściciel
   zaakceptował ECHO wyżej — dla dwóch nazwanych explicite, dla pozostałej
   czwórki jako ten sam rodzaj skutku niedookreślony w treści pytania.
4. Los 298 pozostałych gałęzi zdalnych to osobna, nieautoryzowana dotąd decyzja —
   nie blokuje wykonania na `main`, ale czyni słowo „nieodwracalna" ścisłym tylko
   dla `main`, dopóki ta decyzja nie zapadnie.
