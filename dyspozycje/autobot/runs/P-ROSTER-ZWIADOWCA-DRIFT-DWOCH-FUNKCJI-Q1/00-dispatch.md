# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — dispatch

TEMAT: `P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.

## WYZWALACZ

Bramka `gra/tools/map-field-battle-test.cjs`, przywrócona do uruchamialności tematem
`P-BRAMKI-INFRA-CRASH-DWIE-Q1`, wykonuje 20 asercji i **jedna jest realnie czerwona**:

```
collectBattleRoster atk: adjacent scout excluded
```

`collectBattleRoster` **nie wyklucza** sąsiadującego zwiadowcy ze składu bitwy, podczas gdy
siostrzana `collectAtkRosterNearCity` **to robi**. Dwie funkcje, które powinny składać ten
sam roster, rozjechały się w jednym warunku.

**Skutek w grze:** zwiadowca stojący obok może być doliczany do siły atakującego tam, gdzie
druga ścieżka go pomija — **skład bitwy zależy od tego, która funkcja go akurat policzyła.**

**Ta asercja czerwieniła się od zawsze — tylko nikt jej nie widział**, bo bramka wywalała się
przed nią z `TypeError`. Naprawa INFRA odsłoniła defekt leżący pod spodem. Final Control
potwierdził, że asercja jest **bajt-identyczna z bazą** `6b81abf4` — nie jest to regres
tamtej naprawy, tylko ujawnienie starego błędu.

## RECON (policzony przez orkiestratora; POTWIERDŹ własnym odczytem i rozszerz)

`gra/src/units/battleRoster.ts`:
- `collectBattleRoster` (`:63`) — `ctx.battleHex = { q: anchor.q, r: anchor.r }`, dystans
  liczony **od kotwicy**: `u => hexDistance(anchor.q, anchor.r, u.q, u.r)`
- `collectAtkRosterNearCity` (`:79`) — `ctx.battleHex = { q: city.q, r: city.r }`, dystans
  liczony **od miasta**: `u => hexDistance(u.q, u.r, city.q, city.r)`
- `collectDefRosterNearCity` (`:95`) — trzecia funkcja tej rodziny, **też ją sprawdź**

Obie wołają wspólne `collectUnitsInRadius` z `BattleRosterIncludeCtx`. **Różnica jest
w `battleHex`, nie w jawnym warunku na zwiadowcę** — czyli predykat wykluczający prawdopodobnie
porównuje pozycję jednostki z `battleHex`, a nie z kotwicą. **To jest hipoteza orkiestratora,
NIE ustalenie — zweryfikuj ją odczytem `collectUnitsInRadius` i predykatu, i napisz w raporcie,
czy się potwierdziła.** Jeśli przyczyna jest inna, opisz prawdziwą.

Wywołania w kodzie gry: `mapFieldBattle.ts:308`, `main.ts:23644`, `:24283-24306`, `:25563`.
**Przed naprawą sprawdź, czy rozjazd nie jest ZAMIERZONY w którymś z tych miejsc** —
`collectBattleRoster` służy bitwie w polu, `collectAtkRosterNearCity` bitwie o miasto.
Jeśli znajdziesz w kodzie albo w komentarzach ślad świadomej różnicy, **zatrzymaj się ze
statusem `DECISION_REQUIRED`** zamiast zrównywać funkcje.

## GOAL

Skład bitwy nie może zależeć od tego, którą funkcją go policzono. Zwiadowca sąsiadujący
z miejscem starcia ma być traktowany **identycznie** w `collectBattleRoster` i
`collectAtkRosterNearCity` — a jeśli `collectDefRosterNearCity` ma ten sam rozjazd, to i tam.

## KRYTERIA KOŃCA (binarne)

1. `node gra/tools/map-field-battle-test.cjs` — **20/20**, w tym asercja
   `collectBattleRoster atk: adjacent scout excluded`.
2. **Asercji NIE WOLNO zmienić, osłabić ani usunąć.** Ma zzielenieć przez naprawę kodu.
   Jeśli po analizie uznasz, że asercja jest błędna — to jest `DECISION_REQUIRED`
   z dowodem, nie samodzielna zmiana testu.
3. **Nowa asercja parytetu** w `gra/tools/map-field-battle-test.cjs`: dla tego samego układu
   jednostek `collectBattleRoster` i `collectAtkRosterNearCity` zwracają **ten sam zbiór ID**
   (kolejność może się różnić — porównuj zbiory, nie listy). Bez niej funkcje rozjadą się
   ponownie za pół roku.
4. **Dowód nietautologiczności:** cofnij naprawę (mutacja), pokaż, że bramka czerwienieje
   i na ilu asercjach, przywróć, pokaż `git diff --quiet`. Osobno: zmutuj naprawiony kod tak,
   żeby zwiadowca był wykluczany w OBU funkcjach zbyt agresywnie (np. też na heksie starcia) —
   asercja parytetu ma wtedy pozostać zielona, a inne czerwone. To dowodzi, że parytet
   nie jest jedynym, co bramka mierzy.
5. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
6. Pięć bramek referencyjnych zielonych: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
   19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
7. Sąsiedztwo zmiany zielone: `node gra/tools/battle-summary-test.cjs`,
   `node gra/tools/auto-battle-power-test.cjs`, `node gra/tools/entity-card-contract-test.cjs`
   oraz każda inna bramka, którą znajdziesz grepem po `battleRoster` / `collectBattleRoster`.
   **Wypisz listę, którą uruchomiłeś, i wynik każdej.**

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — ZIELONO ZA WSZELKĄ CENĘ.** Ta asercja czerwieniła się od zawsze; najprostszą
drogą do zieleni jest jej przepisanie. To jest zakazane (kryterium 2). Poprzedni Operator
w tym obszarze miał ten sam zakaz i się do niego zastosował — dlatego w ogóle wiemy o defekcie.

**Tryb drugi — NAPRAWA JEDNEJ STRONY.** Można zzielenić asercję, dopisując wykluczenie
wyłącznie w `collectBattleRoster` i zostawiając trzecią funkcję rodziny nietkniętą.
Kryterium 3 (parytet) i punkt „sprawdź też `collectDefRosterNearCity`" są po to, żeby
naprawa objęła rodzinę, a nie jeden objaw.

**Tryb trzeci — ZMIANA ZACHOWANIA GRY BEZ ZAUWAŻENIA.** Zwiadowca wchodzący albo wychodzący
ze składu bitwy zmienia siłę stron. **Zmierz i podaj w raporcie**, jak zmienia się wynik
przykładowego starcia przed i po naprawie — jednym konkretnym przykładem, nie ogólnikiem.
Jeśli zmiana jest większa niż kosmetyczna, to jest informacja dla właściciela.

## ALLOWLISTA

- `gra/src/units/battleRoster.ts`
- `gra/tools/map-field-battle-test.cjs` (wyłącznie DODANIE asercji parytetu; zakaz zmiany
  istniejących)
- `dyspozycje/autobot/runs/P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/main.ts` (trzymają go inne tematy, §2b — a ta naprawa go
NIE wymaga), `gra/src/battle/mapFieldBattle.ts` bez jawnego uzasadnienia w raporcie
(jeśli okaże się konieczny — `DECISION_REQUIRED`), pliki z sekretami, `docs/decyzje/**`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .` — dodawaj po jawnych ścieżkach.

## IZOLACJA

Worktree `/home/user/wt-roster-zwiadowca`, gałąź
`autobot/P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1`, baza `fe57a068`. PRZED pracą:
`git -C /home/user/wt-roster-zwiadowca log -1 --oneline` musi pokazać `fe57a068`,
a `git status --short` czyste drzewo. Inaczej — `BLOCK`, nie pisz.

C-001 (bariera CHRONIONA), brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/`
(export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` musi wskazywać katalog POZA
drzewem repo i z UNIKALNYM sufiksem (PID albo losowy) — stała nazwa w `os.tmpdir()`
dała już w tym repo dwa fałszywe wyniki bramek.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Przy decyzji produktowej zatrzymujesz się
ze statusem `DECISION_REQUIRED`. Raport maksymalnie ok. 400 słów, destylat: ścieżki + SHA
zamiast diffu, wynik bramki zamiast logu.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

---

## RATYFIKACJA ORKIESTRATORA (2026-09-05, po rundzie 1 `DECISION_REQUIRED`)

**Diagnoza Operatora jest przyjęta w całości i obala moją hipotezę z sekcji RECON.**
Sprawdziłem sam, w kodzie: `map-field-battle-test.cjs:155-157` to jest

```js
const atkWithScout = collectBattleRoster(hastati, [hastati, ally, scoutNeighbor, warrior2], 'attacker');
assert(atkWithScout.length === 2 && !atkWithScout.some(u => u.typeId === 'Zwiadowca'), ...)
```

Fixture ma **cztery** jednostki, z czego `warrior2` to pełnoprawna jednostka bojowa
ownera 0 w dystansie 1 od kotwicy. Roster ma więc poprawnie **trzy** pozycje.
Człon `!some(Zwiadowca)` **już dziś przechodzi** — czerwieni się wyłącznie `length === 2`.

**Rozjazdu dwóch funkcji NIE MA.** Zgłoszenie w rejestrze (moje) było błędne: oparłem je
na etykiecie asercji, nie na jej treści. Zwiadowca jest wykluczany w obu funkcjach; różnica
liczebności bierze się z różnych fixture'ów, a nie z różnych reguł.

### Co robi runda 2 — NAPRAWA FIXTURE'U, NIE KODU GRY

**Zakaz zmiany `gra/src/**` w tym temacie.** Zazielenienie asercji „naprawą kodu" usunęłoby
z rosteru **jednostkę bojową sąsiadującą z kotwicą** — to byłaby realna zmiana balansu
bitwy w polu, wprowadzona po cichu pod pozorem naprawy testu. Operator zmierzył to
i nazwał wprost; miał rację, że się zatrzymał.

**Przepisz asercję tak, żeby mierzyła swoją własną intencję, nie liczbę:**

```js
const atkWithScout = collectBattleRoster(hastati, [hastati, ally, scoutNeighbor, warrior2], 'attacker');
const ids = new Set(atkWithScout.map(u => u.id));
assert(!ids.has(scoutNeighbor.id), 'collectBattleRoster atk: adjacent scout excluded');
assert(ids.has(hastati.id) && ids.has(ally.id) && ids.has(warrior2.id),
  'collectBattleRoster atk: pozostale trzy jednostki bojowe ZOSTAJA w rosterze');
```

To jest **mocniejsze** niż `length === 2`, nie słabsze: stara wersja przechodziła też wtedy,
gdy roster gubił dowolne dwie jednostki; nowa wymaga imiennie, że wypadł **dokładnie
zwiadowca** i **nikt poza nim**. Liczba asercji rośnie z 20 na 21 — nie spada.

**To NIE jest osłabienie, którego zabraniało kryterium 2.** Kryterium 2 chroniło przed
zzieleniem testu kosztem jego wartości dowodowej. Tutaj wartość rośnie, a naprawiany jest
fixture, który był sprzeczny z sąsiednią asercją `:152-153` — żadna zmiana `gra/src` nie
mogła zazielenić obu naraz. Operator to udowodnił i to jest powód tej ratyfikacji.

### Asercja parytetu — DOPISZ

Operator świadomie jej nie dopisał, żeby nie zabetonować bramki przed decyzją. Decyzja
zapadła: **dopisz ją.** Dla wspólnej kotwicy na heksie miasta `collectBattleRoster`
i `collectAtkRosterNearCity` mają zwracać identyczny **zbiór ID** (nie listę — kolejność
może się różnić). Parytet zachodzi już dziś; asercja ma go utrwalić, żeby funkcje nie
rozjechały się w przyszłości. Docelowo bramka ma **22 asercje**.

### Trzy znaleziska poboczne — ZAREJESTRUJ, NIE NAPRAWIAJ

1. `gra/tools/_tmp-battle-roster-test.cjs` — zacommitowany plik roboczy udający bramkę.
2. `collectDefRosterNearCity` nie filtruje po `ownerId`; kompensują to oba wywołania
   (`siegeDefenders.ts:16`, `main.ts:25593`) — kruche, ale dziś działa.
3. Asercja `map-field-battle-test.cjs:155` była wadliwą kopią `battle-roster-test.cjs:105-109`
   (ta sama reguła, poprawny fixture, zielona). Kopiowanie asercji między bramkami bez
   kopiowania fixture'u to tryb błędu wart zapisania.

Wypisz je w raporcie jako OBSERWACJE. Rejestruje je orkiestrator, nie Ty.

### KRYTERIA KOŃCA rundy 2 (zastępują punkty 1-3 z kryteriów rundy 1)

1. `node gra/tools/map-field-battle-test.cjs` — **22/22**.
2. `git diff <baza>..HEAD -- gra/src/` — **PUSTE**. Ani jednej zmiany w kodzie gry.
3. Mutacja dowodowa: zmień predykat wykluczania cywila tak, żeby zwiadowca wracał do
   rosteru — asercja `adjacent scout excluded` ma zaczerwienić. Cofnij przez KOPIĘ pliku,
   `git diff --quiet`.
4. Druga mutacja: usuń `warrior2` z rosteru w kodzie — nowa asercja „pozostałe trzy
   jednostki bojowe ZOSTAJĄ" ma zaczerwienić. To jest dowód, że przepisana asercja
   pilnuje czegoś, czego stara nie pilnowała.
5. Punkty 5-7 z kryteriów rundy 1 bez zmian (tsc, pięć referencyjnych, sąsiedztwo).
