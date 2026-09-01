TEMAT:  P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Trzy niezależne batche treści (`R-KARTY-HISTORIA-B1-Q1`, `-T1-Q1`, `-I1-Q1`)
zgodnie zaraportowały (Operator I Evaluator, każdy niezależnie) ten sam,
nieblokujący, ale powtarzający się problem: `gra/tools/entity-card-historia-section-test.cjs`
(z tematu infrastrukturalnego `R-KARTY-HISTORIA-INFRA-Q1`) używa TRZECH
REALNYCH, PRODUKCYJNYCH encji jako fixture „jeszcze pustych" —
`stolarnia` (budynek), `Łowiectwo` (technologia), `farma` (ulepszenie) —
i asercjuje na sztywno, że ich karty NIE pokazują sekcji „Rys historyczny".
To działało w chwili integracji INFRA (żadna encja nie miała jeszcze pola),
ale z definicji projektu `R-KARTY-HISTORIA-Q1` KAŻDA z tych trzech encji
prędzej czy później dostanie treść w swoim batchu — i wtedy test fałszywie
czerwienieje, mimo że system działa dokładnie tak, jak powinien.

Dodatkowo test [5] (linie ~262-283) ma POKREWNY, cichszy błąd: sprawdza że
adapter IGNORUJE pole o złej wielkości liter (np. `Historia` zamiast
`historia` dla budynku) przez zbudowanie fixture jako `{...buildingRow,
Historia: 'Zła wielkość liter'}` — ale `buildingRow` to PRAWDZIWY wiersz z
danych, więc gdy prawdziwe pole `historia` (poprawna wielkość liter) już ma
treść (po integracji batcha), spread niesie tę treść dalej, i test
przypadkiem przechodzi z INNEGO powodu niż zamierzony (czyta prawdziwe pole,
nie ignoruje niepoprawnego) — dziś to się manifestuje jako FAIL, bo
asercja oczekuje `undefined`, a dostaje realną treść.

## GOAL
Napraw `gra/tools/entity-card-historia-section-test.cjs`, żeby był
niezależny od tego, ile treści historycznej już wpisano do
`gra/data/**`:

**Sekcja [4] (linie ~231-256):** zamiast twardej asercji „sekcja NIE
istnieje", zrób asercję WARUNKOWĄ na podstawie REALNEGO stanu pola w
danych: odczytaj wartość pola źródłowego dla danej encji (`historia`
lowercase dla building/improvement, `Historia` capitalized dla technology/
unit — użyj tych samych `window.__resolve*Row`/`window.__*ToSlug` helperów
co reszta pliku) i asercjuj `historiaExists === (pole jest niepuste)`. Test
ma być PRAWDZIWY niezależnie od tego, czy dana encja ma już treść, czy
jeszcze nie — sprawdza ZGODNOŚĆ obecności sekcji ze stanem danych, nie
konkretną, z czasem nieaktualną wartość.

**Sekcja [5] (linie ~262-283):** dla KAŻDEGO z 4 przypadków „zła wielkość
liter" (buildingWrongCase, techWrongCase, unitWrongCase,
improvementWrongCase), przed wstrzyknięciem złego pola USUŃ z kopii wiersza
POPRAWNE pole (np. `const { historia, ...rest } = buildingRow; const row =
{ ...rest, Historia: 'Zła wielkość liter' };`), żeby test sprawdzał
DOKŁADNIE to, co deklaruje — że adapter ignoruje złą wielkość liter — a nie
przypadkowo przechodził/nie przechodził w zależności od tego, czy prawdziwe
dane akurat mają czy nie mają wypełnionego pola.

Nie zmieniaj sekcji [1]-[3] (fixture w pamięci, bez realnych danych — już
odporne na ten problem) ani żadnego innego pliku.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Test przechodzi w 100% NA DZISIEJSZYM stanie `main` (przed integracją
   B1/T1/I1 — czyli bez pola `historia` w żadnej z tych 3 encji).
2. Test PRZECHODZI w 100% RÓWNIEŻ po symulowanym wstrzyknięciu (wyłącznie w
   pamięci testu, bez mutacji `gra/data/**`) niepustego pola `historia`/
   `Historia` do `stolarnia`/`Łowiectwo`/`farma` — dowód: tymczasowo (w
   ramach weryfikacji, NIE w commitowanym kodzie testu) podmień odczyt tak,
   jakby te 3 encje miały już treść, i pokaż że test nadal jest zielony.
3. Sekcja [5]: dowód nietautologiczności — z powrotem podstaw STARĄ wersję
   (bez usuwania poprawnego pola) na fixture z NIEPUSTYM prawdziwym polem
   `historia`/`Historia` i pokaż, że WTEDY test [5] faktycznie czerwienieje
   (odtwarza dokładnie zgłoszony błąd), a po poprawce — nie.
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/tools/entity-card-historia-section-test.cjs` WYŁĄCZNIE. Zakazane
bezwzględnie: `gra/data/**`, `gra/src/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-KARTY-HISTORIA-TEST-FIXTURE-REALNE-DANE-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 2 za spełnione bez REALNEGO odtworzenia scenariusza
„encja ma już treść" (nie samego czytania kodu) — to jest dokładnie
scenariusz, który już trzy razy naprawdę wystąpił w tej sesji. Zakaz
zmiękczenia testu przez usunięcie asercji zamiast naprawienia jej logiki.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only.
