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

| Plik | Odczytów w kodzie | Czego dotyczą |
|---|---:|---|
| `gra/src/game/diplomacy-credibility.ts` | **42** | odwołania `DIPLOMACY_PARAMS.<klucz>` w całym bloku Wiarygodności (+ osobno **5** wzmianek tej samej formy w komentarzach dokumentacyjnych; razem 47 trafień grepa) |
| `gra/src/game/diplomacy-layers.ts` | **5** | alias `const p = DIPLOMACY_PARAMS;` w 5 funkcjach warstw (bez kropki — regex `DIPLOMACY_PARAMS\.` ich nie łapie) |
| `gra/src/game/diplomacy-value-catalog.ts` | **1** | `handel_zaufanie_perTura` |
| **RAZEM w kodzie** | **48** | |

> **KOREKTA 2026-08-07 (nota N4 Evaluatora rundy 2).** Pierwotna wersja tej tabeli podawała
> 43/5/1 = 49, a sekcja Wdrożenia „47 odwołań w 18 funkcjach". Oba były błędne: 47 to liczba
> **trafień grepa**, na którą składa się **42 odwołania w kodzie + 5 wzmianek w komentarzach**,
> a deklaracji akcesora jest **14**, nie 18. Poprawione wyżej i niżej — liczba ma znaczenie,
> bo przyszły audyt kompletności liczyłby 42 zamiast 49 i mógłby uznać, że 7 odwołań zginęło.

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

### Runda 1 — FAIL (baza przestarzała)

Operator pracował na przestarzałym drzewie (`main @ c9c031e`), sprzed commita `2e67219`
(`R-WIARYGODNOSC-S9-LICZBY-Q1` — 47 kluczy `wiarygodnosc*`). Efekt po nałożeniu łaty rundy 1 na
właściwą bazę: 15 błędów TS2304 „Cannot find name DIPLOMACY_PARAMS" (import usunięty, 15 odwołań
z commita `2e67219` — w tym `wiarygodnoscS4PrzemarszPerTureNormalny`, klucz wskazany wprost
w zleceniu — zostało niepodmienionych). Kod się nie kompilował; cel N3 nie został osiągnięty.

### Runda 2 — wdrożenie kompletne (baza `af68f86`)

Wzorzec z rundy 1 powtórzony **kompletnie**, na właściwej bazie:

1. `getBaseDiplomacyParams()` (`gra/src/game/diplomacy.ts:508`) oznaczona `export` — bez pisania
   drugiej funkcji. Zwraca `{ ...DIPLOMACY_PARAMS, ...loadDiplomacyParams(diplomacyData) }`,
   memoizowana, **bez** skalowania po trudności (skalowanie zostaje osobno,
   w `scaleDiplomacyParamsForDifficulty()`/`getEffectiveDiplomacyParams()`).
2. `gra/src/game/diplomacy-credibility.ts` — **42** odwołania `DIPLOMACY_PARAMS.<klucz>` **w kodzie**
   podmienione w **14** funkcjach (w tym jednej prywatnej, `czasZapomnienia`) na
   `const P = getBaseDiplomacyParams();` raz na początku ciała funkcji + `P.<klucz>`. Dodatkowo
   przeredagowano **5** wzmianek tej samej formy **w komentarzach** dokumentacyjnych — razem **47**
   trafień grepa w bazie `af68f86` (regex `DIPLOMACY_PARAMS\.` nie rozróżnia kodu od komentarza).
3. `gra/src/game/diplomacy-layers.ts` — 5 wystąpień `const p = DIPLOMACY_PARAMS;` (w 5 funkcjach:
   `startRelationForPair`, `startRelationForPlayerSameCivCityState`,
   `startRelationForAiMajorSameCivCityState`, `defaultNeutralRelation`, `barbarianWarRelation`)
   zamienione na `const p = getBaseDiplomacyParams();`.
4. `gra/src/game/diplomacy-value-catalog.ts` — 1 odwołanie (`handel_zaufanie_perTura`) w
   `diplomacyHandelZaufaniePerTura()` zamienione na `const P = getBaseDiplomacyParams(); return P.handel_zaufanie_perTura;`.
5. Import `DIPLOMACY_PARAMS` usunięty z wszystkich trzech plików DOPIERO po podmianie ostatniego
   odwołania — `import { getBaseDiplomacyParams }` (credibility, value-catalog) /
   `import { getBaseDiplomacyParams, type Relation }` (layers).

**Dowód kompletności (W3):** `grep -oE "DIPLOMACY_PARAMS\.[A-Za-z_]+"` w każdym z trzech plików
zwraca **0 wyników** (potwierdzone po zmianie).

**Dowód zachowania (W5):** `gra/tools/wiarygodnosc-test.cjs` sekcja **11** (nowa, sekcja 10
pozostała nietknięta) — osobny bundle esbuild z kopii `src/+data` w katalogu tymczasowym
(`fs.mkdtempSync`/`fs.cpSync`, sprzątane w `finally`), 15 kluczy nadpisanych sentinelami w kopii
`diplomacy.json` (w tym obowiązkowy `wiarygodnoscS4PrzemarszPerTureNormalny`), po
`resetEffectiveDiplomacyParamsCache()` funkcje z **wszystkich trzech** zmienionych plików
zwracają wartość sentinel z JSON, nie default TS; kontrola negatywna potwierdza, że surowa
`DIPLOMACY_PARAMS` w tym samym bundlu się nie zmieniła. Prawdziwy `gra/data/diplomacy.json`
zweryfikowany jako nietknięty przez `git status --porcelain` po teście.

**Bramka strukturalna (sekcja 12, nota N1 Evaluatora).** Sekcja 11 pokrywa funkcjonalnie 15 z 42
odwołań; Evaluator wykazał **empirycznie**, że cofnięcie nieobjętego odwołania z `P.klucz` na
`DIPLOMACY_PARAMS.klucz` przechodzi przez całą baterię 10 bramek niezauważone — czyli dokładnie
tak, jak zginął cel w rundzie 1. Sekcja 12 zamyka lukę **niezależnie od pokrycia funkcyjnego**:
czyta źródła trzech plików i wymaga zera odczytów surowej stałej **w kodzie** (linie komentarza
odfiltrowane — wzmianka w komentarzu jest dozwolona i merytorycznie poprawna), zera aliasów /
spreadów / destrukturyzacji, oraz braku importu `DIPLOMACY_PARAMS`. 3 asercje × 3 pliki = 9.
Falsyfikacja przeprowadzona: cofnięcie `P.wiarygodnoscS3HandelPerTureTrudny` (klucz **nieobjęty**
asercją sekcji 11) → **268 pass, 2 fail**, komunikat wskazuje plik i numer linii.

**Wynik `wiarygodnosc-test.cjs`: 270 pass, 0 fail** (212 z sekcji 1–10 + 49 z sekcji 11 + 9 z sekcji 12).

**Bramki — wszystkie zielone, identyczne z punktem odniesienia** (zero zmian wartości
liczbowych — W1): `npx tsc --noEmit` 0 błędów · `diplomacy-test` 148/148 · `diplomacy-proposal-test`
117/117 · `diplomacy-acceptance-points-test` 225/225 · `diplomacy-locks-test` 70/70 ·
`diplomacy-value-catalog-test` 62/62 · `diplomacy-resource-cyclic-trade-test` 45/45 ·
`diplomacy-layers-test` 22/22 · `tech-tree-test` 19/19 · `research-test` 33/33.
