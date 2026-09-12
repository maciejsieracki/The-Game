TEMAT:  P-TEST-ELIMINATION-TOAST-MERGE-ANCHORY-PRZESTARZALE-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Evaluatora+Final Control tematu `P-WYDARZENIA-ELIMINACJA-PODBOJ-
KARTA-Q1` (zintegrowane, commit `075737dc`): `gra/tools/elimination-toast-
merge-test.cjs` ma 4 literal-string/count anchory na STARĄ, 3-parametrową
sygnaturę `recordCivElimEvent(csOwnerId, civLabel, details)` i stare
2-polowe wywołania `civElimEventDetails.set(evId, { civLabel, details })`
oraz `showCivElimNotice({ civLabel, details })` — po zintegrowanej zmianie
(4. opcjonalny parametr `cause`, dodatkowe pole w mapie, dodatkowy parametr
w wywołaniu) 4/54 asercji tego pliku regresuje. Final Control potwierdził:
to WYŁĄCZNIE regres formalny (dopasowanie literalnego tekstu), nie regresja
zachowania — wszystkie realnie wykonywane ścieżki (bramki behawioralne)
pozostają zielone.

## GOAL

Zaktualizować 4 przestarzałe anchory w `elimination-toast-merge-test.cjs`
do aktualnego kształtu kodu (`recordCivElimEvent` z 4 parametrami, mapa z
polem `cause`, wywołanie `showCivElimNotice` z `cause`), bez zmiany
semantyki żadnej z pozostałych 50 asercji.

## DOKŁADNE MIEJSCA

W `gra/tools/elimination-toast-merge-test.cjs` znajdź i zaktualizuj:
1. Asercję liczącą wystąpienia `recordCivElimEvent(` w `main.ts` — oczekiwana
   wartość musi uwzględniać AKTUALNĄ liczbę wywołań (1 deklaracja + 2 call
   site'y: ścieżka dyplomatyczna + ścieżka podboju = potencjalnie 3, sprawdź
   dokładnie przez `grep -c` zamiast zgadywać).
2. Literalny string `function recordCivElimEvent(csOwnerId: number, civLabel:
   string, details: string): void {` — zaktualizuj do aktualnej,
   wieloliniowej sygnatury z 4. parametrem `cause` (sprawdź dokładny kształt
   w `main.ts` przed edycją, nie kopiuj na pamięć).
3. Literalny string `civElimEventDetails.set(evId, { civLabel, details });`
   — zaktualizuj do aktualnego kształtu z polem `cause`.
4. Regex/literal `showCivElimNotice({ civLabel: info.civLabel, details:
   info.details })` — zaktualizuj do aktualnego wywołania z `cause`.

Rozważ (i uzasadnij wybór w raporcie), czy lepiej dopasować DOKŁADNY nowy
tekst (kruche, powtórzy się ten sam problem przy następnej legalnej zmianie)
czy przepisać te 4 asercje na coś odporniejszego (np. sprawdzenie obecności
frazy/nazwy funkcji bez sztywnego całego podpisu, analogicznie do naprawy
`P-TEST-TECH-UNLOCK-UNITS-TRIPWIRE-PRZEPROJEKTOWAC-Q1` z tej samej sesji) —
ale NIE osłabiaj przy tym realnego pokrycia (test ma nadal wykrywać, gdyby
ktoś przypadkiem cofnął mechanizm `cause` albo popsuł liczbę call site'ów).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Wszystkie 54 asercje w `elimination-toast-merge-test.cjs` zielone na
   aktualnym `origin/main`.
2. Pozostałe 50 asercji (poza tymi 4) nietknięte semantycznie — diff
   ograniczony do 4 zaktualizowanych miejsc (plus ewentualne przepisanie na
   odporniejszy wzorzec, jeśli tak zdecydujesz).
3. Dowód mutant-testingu dla przynajmniej jednej z naprawionych asercji:
   tymczasowa mutacja odpowiedniego miejsca w `main.ts` (np. usunięcie
   parametru `cause`) powoduje czerwony wynik; przywrócenie — zielony.
4. `tsc --noEmit` 0 błędów.
5. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.
6. Istniejąca bramka `wydarzenia-eliminacja-podboj-karta-test.cjs` bez
   regresu (upewnij się że nie kolidujesz z jej zawartością).

## DOWÓD

Log pełnego przebiegu `elimination-toast-merge-test.cjs` (54/54) + log
mutant-testingu (czerwony/zielony).

## Allowlista

- `gra/tools/elimination-toast-merge-test.cjs`

Zakazane: `gra/src/**` (zero zmian produkcyjnych — to naprawa testu),
`gra/data/*.json`, pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-elimination-toast-merge-anchory`, gałąź
`autobot/P-TEST-ELIMINATION-TOAST-MERGE-ANCHORY-PRZESTARZALE-Q1`, baza
`origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 350 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
