TEMAT:  P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1 (RECON, nie implementacja)
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko recon `P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1` §4
(`dyspozycje/REJESTR-PROSB-I-ZADAN.md` linie 201-217): zmienna modułowa
`playerPracaPool` (SILNIK — koszty założenia miasta, koszt wycinki, kolejka
budowy, upkeep końca tury, reset gry/save-load) jest nadal używana
BEZPOŚREDNIO w starszym, centralnym kodzie tury gracza, zamiast przez
per-fotel akcesory `ownerPracaPool`/`setOwnerPracaPool` (istniejące od Etapu
3, i użyte poprawnie przez migrację cache `_last*` w
`P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1`, commit `54f297dc`). Przy
realnym drugim fotelu-człowieku te miejsca liczyłyby koszty/pulę TYLKO dla
fotela 0 niezależnie od tego, kto faktycznie gra — błąd SILNIKA (realna
ekonomia), nie tylko wyświetlania jak w temacie cache. **ECHO właściciela
2026-09-11: świadomie odłożone do osobnego tematu, wymaga WŁASNEGO reconu
przed implementacją** (większy, ryzykowniejszy zakres niż cache).
Dziś (2026-09-12), po zamknięciu commitu `54f297dc`, poproszono o
sprawdzenie czy temat nie jest już wykonany — NIE JEST (`playerPracaPool`
nadal zmienna modułowa `let playerPracaPool: number = 0;`, dziś
`main.ts:11173`, czytana/pisana bezpośrednio w co najmniej: `23090`
(`setPlayerPracaPool`), `32007` (upkeep końca tury), `32120` (lokalny cień
`hOidPracaPool`, wymaga sprawdzenia czy to już per-fotel czy pozorne),
`36263`/`37123` (reset/nowa gra) — linie PRZESUNIĘTE względem starego
reconu (`13013-13020`/`13195-13210`/`13241-13314`/`31791-31824`/
`36040-36901`/`37809-37840`) przez commit cache-migracji; ten dispatch
wymaga ŚWIEŻEGO przeliczenia, nie kopiowania starych numerów linii.

## GOAL TEJ RUNDY — WYŁĄCZNIE RECON, ZERO IMPLEMENTACJI

Ustalić PEŁNĄ, aktualną (2026-09-12) mapę wszystkich miejsc w `main.ts`,
gdzie SILNIK (nie cache HUD) czyta lub pisze `playerPracaPool` bezpośrednio
zamiast przez `ownerPracaPool(ownerId)`/`setOwnerPracaPool(ownerId, v)`, i
zaproponować (bez wdrażania) plan migracji tych miejsc na per-fotel —
dokładnie ten sam dwuetapowy wzorzec, jaki zadziałał dla tematu cache:
recon zamknięty → orkiestrator/właściciel decyduje o zakresie → osobny
dispatch implementacji.

## ZAKRES RECONU (co ma dostarczyć raport)

1. Pełna, ŚWIEŻA lista miejsc czytających/piszących `playerPracaPool`
   bezpośrednio w `main.ts` (grep + ręczna weryfikacja każdego trafienia —
   nie kopiuj automatycznie starych numerów linii z reconu Etapu 6c, mogły
   się przesunąć po `54f297dc`). Dla KAŻDEGO miejsca: numer linii aktualny
   na 2026-09-12, funkcja/blok, czy to koszt/upkeep/reset/save-load, i czy
   ownerId jest jednoznacznie dostępny w danym scope (np. `ME()`, pętla po
   `humanOwnerIds`, albo trzeba go dociągnąć z zewnątrz).
2. Specjalna uwaga na `main.ts:32120` (`let playerPracaPool =
   hOidPracaPool;` — LOKALNY cień zmiennej modułowej, inna nazwa niż
   zmienna globalna o tej samej nazwie w tym samym pliku): ustal, czy to
   już jest per-fotel poprawny kod (cień nazwany identycznie dla czytelności
   diffu) czy realna kolizja nazw wymagająca wyjaśnienia w raporcie.
3. Dla każdego klastra (koszt założenia miasta / koszt wycinki / kolejka
   budowy / upkeep końca tury / reset nowej gry+save-load) — oceń RYZYKO
   migracji: czy dotyczy tylko fotela aktywnego człowieka (bezpieczne, dziś
   no-op przy `humanOwnerIds.length===1` jak w temacie cache) czy potencjalnie
   dotyka też AI-owców (ryzykowne, może zmienić realną ekonomię AI — jeśli
   tak, WYRAŹNIE to oznacz i NIE proponuj migracji tego miejsca bez ECHO).
4. Save-load (v3, `Etap 7`, już zintegrowany) — sprawdź czy format zapisu
   gry serializuje `playerPracaPool` per-fotel już dziś (współpraca z
   `pracaPoolByHuman`) czy jako pojedynczą liczbę — jeśli jako pojedynczą,
   to jest DODATKOWY, poważniejszy problem (utrata danych fotela ≠0 przy
   zapisie/wczytaniu) i musi być osobno wypunktowany w raporcie z osobnym
   poziomem pilności.
5. Co najmniej 2 warianty implementacji (analogicznie do reconu Etapu 6c
   §7: warianty A/B/C) z jawnymi kompromisami (zakres jednej rundy vs.
   kilku węzłów, ryzyko regresji ekonomii AI, koszt weryfikacji).
6. Jawna rekomendacja Operatora którego wariantu użyć i dlaczego — ale
   BEZ wdrażania go w tej rundzie.

## KRYTERIA KOŃCA TEJ RUNDY — binarne PRAWDA/FAŁSZ

1. Dokument recon istnieje pod `dyspozycje/autobot/runs/
   P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1/01-operator-recon.md`,
   zawiera pełną, świeżo zweryfikowaną (nie skopiowaną) listę miejsc z
   aktualnymi numerami linii.
2. Raport jawnie rozstrzyga zagadkę `main.ts:32120`
   (`hOidPracaPool`/lokalny cień) — nie zostawia jej otwartą.
3. Raport jawnie odpowiada na pytanie o save-load (per-fotel czy
   pojedyncza liczba) z dowodem (cytat kodu serializacji/deserializacji).
4. Zero zmian w `gra/src/**` — to jest recon, nie implementacja. Jedyny
   dozwolony zapis to sam dokument recon (i opcjonalnie uzupełnienie
   istniejącego dokumentu recon Etapu 6c, jeśli Operator uzna to za
   właściwe miejsce na krzyżowe odniesienie — NIE edytuj tamtego dokumentu
   merytorycznie, tylko dopisz odnośnik).
5. Evaluator zweryfikował PRZYNAJMNIEJ 3 losowo wybrane pozycje z listy
   Operatora bezpośrednio w kodzie (nie ufa liczbie linii na słowo) i
   potwierdza brak pominiętych miejsc (własny, niezależny grep).

## Allowlista

- `dyspozycje/autobot/runs/P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1/01-operator-recon.md` (nowy plik)
- Czytanie (bez zapisu): `gra/src/main.ts`, `gra/src/game/*.ts`,
  `dyspozycje/REJESTR-PROSB-I-ZADAN.md`,
  `dyspozycje/autobot/runs/P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-RECON-Q1/01-operator-recon.md`

Zakazane: JAKAKOLWIEK zmiana w `gra/src/**` (to recon, implementacja jest
osobnym, przyszłym tematem po decyzji właściciela), `gra/data/*.json`,
pliki z sekretami, `docs/decyzje/*.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-hotseat-playerpracapool-recon`, gałąź
`autobot/P-HOTSEAT-PLAYERPRACAPOOL-SILNIK-PER-FOTEL-Q1`, baza
`origin/main`. Recon czysto tekstowy — `tsc`/testy nie dotyczy (zero zmian
kodu), ale jeśli Operator chce zweryfikować hipotezę uruchomieniem
istniejącej bramki (np. `hotseat-drugi-fotel-tura-test.cjs`), to dozwolone
jako narzędzie diagnostyczne, nie jako zmiana.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny brak (miejsce pominięte, pytanie
nierozstrzygnięte); runda N+1 na TYM SAMYM ID/gałęzi. Po 5 rundach:
LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Sam dokument recon może być dłuższy (analogicznie do Etapu 6c — recon to
dokument referencyjny, nie krótki raport rundy), ale STRESZCZENIE w
raporcie rundy maks. ok. 400 słów, z odnośnikiem do pełnego dokumentu.
Zakaz `git add -A`. Nie integrujesz (poza samym dokumentem recon), nie
deployujesz, nie pushujesz — orkiestrator commituje dokument recon po
Evaluator PASS.
