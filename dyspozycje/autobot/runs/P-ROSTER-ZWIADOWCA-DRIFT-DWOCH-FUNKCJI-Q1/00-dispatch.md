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
