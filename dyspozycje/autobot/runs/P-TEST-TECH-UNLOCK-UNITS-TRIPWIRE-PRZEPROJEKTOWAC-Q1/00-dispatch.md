TEMAT:  P-TEST-TECH-UNLOCK-UNITS-TRIPWIRE-PRZEPROJEKTOWAC-Q1
RUNDA:  1/5
DATA:   2026-09-12
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ

Znalezisko Final Control tematu `P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1`
(zintegrowane, commit `e5ecf4b6`): `gra/tools/tech-unlock-units-test.cjs`
zawiera mechaniczny tripwire oparty o `git diff --stat`, wymuszający ZERO
zmian w `gra/src/ui/entityCards/technologyAdapter.ts` — z definicji czerwony
dla KAŻDEJ legalnej edycji tego pliku, niezależnie od tego czy zmiana jest
poprawna czy nie (potwierdzone tym tematem: 40/1, jedyny fail to sam
tripwire, reszta asercji zielona). Bramka straciła zdolność odróżniania
regresji od legalnej zmiany.

## GOAL

Przeprojektować `gra/tools/tech-unlock-units-test.cjs` tak, żeby zamiast
mechanicznego tripwire'u „zero zmian w pliku" testował SEMANTYKĘ: sekcja
„Jednostki" karty technologii poprawnie pokazuje jednostki odblokowane przez
daną technologię (poprawne dane, poprawna liczba, poprawne linkowanie) — bez
blokowania KAŻDEJ przyszłej, poprawnej edycji `technologyAdapter.ts`.

## DOKŁADNE MIEJSCA

1. `gra/tools/tech-unlock-units-test.cjs` — znajdź dokładny mechanizm
   tripwire'u (prawdopodobnie `git diff --stat` albo hash pliku porównywany
   do zapisanej wartości). Przeczytaj CAŁY plik, zrozum jakie 39 innych
   asercji sprawdza (te są zielone i wartościowe — NIE usuwaj ich, tylko
   zastąp/usuń sam tripwire) i co dokładnie miał chronić tripwire (prawdopodobnie:
   że ktoś przypadkiem zmieni logikę odblokowania jednostek bez zamierzenia).
2. `gra/src/ui/entityCards/technologyAdapter.ts` — WYŁĄCZNIE do odczytu,
   żeby zrozumieć aktualny kontrakt sekcji „Jednostki" (jakie dane wchodzą,
   jak są renderowane) i napisać test oparty o TREŚĆ/ZACHOWANIE, nie o brak
   zmian w pliku.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

1. Test NIE zawiera już mechanizmu blokującego KAŻDĄ zmianę pliku
   (`git diff --stat`/hash porównawczy) — usunięty lub zastąpiony asercją
   semantyczną.
2. Pozostałe 39 asercji testu (dane/liczby/linkowanie jednostek per
   technologia) NIETKNIĘTE albo ulepszone, ale NIE osłabione (zero utraty
   pokrycia).
3. Test faktycznie wykrywa regresję: dowód mutant-testingu — tymczasowa
   celowa mutacja logiki odblokowania jednostek w `technologyAdapter.ts`
   (np. odwrócenie warunku filtrowania jednostek per tech) powoduje czerwony
   wynik NOWEGO testu; przywrócenie oryginału — zielony.
4. Test NIE jest już czerwony po legalnej, w pełni uzasadnionej zmianie tego
   pliku — zademonstruj to używając JUŻ ISTNIEJĄCEGO legalnego diffu z
   commitu `e5ecf4b6` (usunięcie `UNIT_PREVIEW`) jako przykładu: nowy test
   powinien być zielony na tym stanie kodu (bo zmiana była poprawna).
5. `tsc --noEmit` 0 błędów.
6. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) bez regresu.

## DOWÓD

Log testów: stary tripwire (dla dokumentacji, jeśli usuwasz) + nowy test na
`origin/main` (zielony) + nowy test po mutacji (czerwony) + nowy test po
przywróceniu (zielony).

## Allowlista

- `gra/tools/tech-unlock-units-test.cjs`

Zakazane: `gra/src/**` (zero zmian produkcyjnych — to naprawa testu),
`gra/data/*.json`, pliki z sekretami, `docs/decyzje/*.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## Izolacja

Worktree `/home/user/wt-tech-unlock-units-tripwire`, gałąź
`autobot/P-TEST-TECH-UNLOCK-UNITS-TRIPWIRE-PRZEPROJEKTOWAC-Q1`, baza
`origin/main`. C-001: zakaz `npm run build`/`dev` w `gra/`.

## Procedura naprawcza przy FAIL

Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM SAMYM ID/gałęzi.
Po 5 rundach: LIMIT-5-EXCEEDED.

## Ograniczenia wyjścia

Maks. ok. 350 słów w raporcie; ścieżki+SHA zamiast diffu; zakaz `git add -A`.
Nie integrujesz, nie deployujesz, nie pushujesz.
