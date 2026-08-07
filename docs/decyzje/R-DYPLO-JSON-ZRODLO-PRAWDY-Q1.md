# R-DYPLO-JSON-ZRODLO-PRAWDY-Q1 — czytniki dyplomacji mają czytać z JSON, nie z surowej stałej TS

**Status:** 🟢 **ZAPISANA — B** (2026-08-07)

## Sytuacja

Wdrożenie `R-WIARYGODNOSC-S9-LICZBY-Q1` (commit `2e67219`) wyeksportowało 47 kluczy
`wiarygodnosc*` z `DIPLOMACY_PARAMS` (TypeScript) do `gra/data/diplomacy.json` → `params`.
Evaluator zgłosił notę **N3**: te klucze są w JSON, ale **martwe** — funkcje Wiarygodności czytają
surową stałą `DIPLOMACY_PARAMS`, a nie `getBaseDiplomacyParams()` (jedyne miejsce, które dokleja
JSON przez `loadDiplomacyParams`). Skutek: **edycja JSON-a lub Panelu-D nie zmienia dziś nic
w rozgrywce.** Sprzeczne z CLAUDE.md §2 („źródłem prawdy są JSON-y w `gra/data/`").

Maciej 2026-08-07: „N3 do osobnego zlecenia. Najpierw załatwmy te tematy według obecnych reguł,
a potem deploy do robocza."

## Inwentaryzacja (zweryfikowana w źródle)

Realne odczyty **wartości** z surowej stałej, poza `diplomacy.ts` (który stałą definiuje);
komentarze i importy typów pominięte:

| Plik | Odczytów | Czego dotyczą |
|---|---:|---|
| `gra/src/game/diplomacy-credibility.ts` | **43** | cały blok Wiarygodności (28 funkcji eksportowanych) |
| `gra/src/game/diplomacy-layers.ts` | **5** | `const p = DIPLOMACY_PARAMS` w 5 funkcjach warstw |
| `gra/src/game/diplomacy-value-catalog.ts` | **1** | `handel_zaufanie_perTura` |
| **RAZEM** | **49** | |

## Ustalenie techniczne — dlaczego zmiana jest zachowaniowo neutralna

`getBaseDiplomacyParams()` (`gra/src/game/diplomacy.ts:508`) zwraca `{ ...DIPLOMACY_PARAMS,
...loadDiplomacyParams(diplomacyData) }` z memoizacją w `_baseDiplomacyParams` — **bez**
skalowania po trudności. Skalowanie żyje osobno, w `scaleDiplomacyParamsForDifficulty()`,
wołanym wyłącznie przez `getEffectiveDiplomacyParams()`.

Sprawdzone bezpośrednio: **żaden klucz `wiarygodnosc*` nie występuje** w listach
`DIPLO_RELATION_THRESHOLD_KEYS` / `DIPLO_ZAUFANIE_THRESHOLD_KEYS` /
`DIPLO_RESPEKT_THRESHOLD_KEYS`. Podmiana surowej stałej na `getBaseDiplomacyParams()` nie
wprowadza więc żadnego skalowania tam, gdzie go dziś nie ma. A ponieważ JSON i TS mają dziś
identyczne wartości (pilnowane sekcją 10 testu `wiarygodnosc-test.cjs`), **żadna liczba w grze
się nie zmienia**. Zmienia się jedno: od tej chwili edycja JSON-a zaczyna działać.

## ECHO

**Odpowiedź Macieja:** „b"

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-DYPLO-JSON-ZRODLO-PRAWDY-Q1** | **B** | Cała dyplomacja, nie tylko Wiarygodność: eksport istniejącego `getBaseDiplomacyParams()` + podmiana wszystkich 49 odwołań w 3 plikach. |

**Wariant odrzucony A:** tylko `diplomacy-credibility.ts` (43 odwołania) — zostawiałby 6 odwołań
w dwóch plikach na surowej stałej, czyli ten sam problem wracałby przy pierwszej edycji warstw
z Panelu-D, przy oszczędności sześciu linii.

**Wariant odrzucony C:** usunięcie wartości liczbowych z `DIPLOMACY_PARAMS` i pozostawienie TS
wyłącznie jako typu — znika fallback (literówka w JSON wywala grę zamiast cicho użyć domyślnej),
a `DiplomacyParams` jest typem mapowanym wyprowadzanym z kluczy `DIPLOMACY_PARAMS`, więc refaktor
dotyczyłby 132 parametrów, nie 49 odwołań. Osobny, dużo większy temat — nie mieszać z domknięciem N3.

## Wymogi wdrożenia (wiążące dla Operatora)

1. **Nie duplikować logiki.** Wyeksportować **istniejące** `getBaseDiplomacyParams()`, nie pisać
   drugiej funkcji robiącej to samo.
2. **Zero zmian wartości liczbowych.** Wszystkie bramki muszą dać **identyczne liczby** jak przed
   zmianą. Każda różnica = błąd wdrożenia, nie „poprawka przy okazji".
3. **Nie wprowadzać skalowania po trudności** tam, gdzie go dziś nie ma — używać
   `getBaseDiplomacyParams()`, **nie** `getEffectiveDiplomacyParams()`.
4. **Sprawdzić kolejność inicjalizacji modułów.** Jeśli którekolwiek odwołanie jest w stałej
   modułowej (`const X = DIPLOMACY_PARAMS.foo` na poziomie pliku), zamiana na wywołanie funkcji
   może złapać moduł przed załadowaniem danych — takie miejsca trzeba przenieść do wnętrza funkcji
   albo zostawić leniwe.
5. **Wiązać raz na funkcję**, nie 43 razy: `const P = getBaseDiplomacyParams();` na początku
   funkcji, potem `P.klucz`. Funkcje Wiarygodności biegają per turę per para — nie mnożyć wywołań
   w pętlach.
6. **Test dowodzący, że N3 jest naprawdę zamknięte.** Nie wystarczy „bramki zielone". Potrzebny
   test, który: podmienia wartość w załadowanym JSON, woła `resetEffectiveDiplomacyParamsCache()`,
   i asercjonuje, że funkcja Wiarygodności **zwraca nową wartość**. Bez tego nie ma dowodu, że
   Panel-D cokolwiek zmieni.
7. Bramki obowiązkowe: `npx tsc --noEmit`, `wiarygodnosc-test`, `diplomacy-test`,
   `diplomacy-proposal-test`, `diplomacy-acceptance-points-test`, `diplomacy-locks-test`,
   `diplomacy-value-catalog-test`, `diplomacy-resource-cyclic-trade-test`, `tech-tree-test`,
   `research-test`.

## Wdrożenie

AutoBot Operator→Evaluator. Zmiana jest **nie-balansowa** (zero ruchu na liczbach), więc zgodnie
z `R-PROC-ABC-BALANS` kod może wejść po zielonych bramkach Evaluatora, bez kolejnego pytania ABC.
