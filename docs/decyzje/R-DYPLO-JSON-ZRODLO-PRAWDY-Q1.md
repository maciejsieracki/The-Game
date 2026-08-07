# R-DYPLO-JSON-ZRODLO-PRAWDY-Q1 — czytniki dyplomacji mają czytać z JSON, nie z surowej stałej TS

**Status:** 🟢 **ZAPISANA — B** (2026-08-07) · **WDROŻONA** (2026-08-07, ta sesja)

> **Uwaga o pochodzeniu tego pliku (dopisek Operatora, 2026-08-07).** Ten dokument
> decyzji nie istniał w drzewie roboczym, w którym pracował ten Operator (worktree
> oparty na `main` @ `c9c031e`) — commit zapisujący go (`0a08bf0`) żyje wyłącznie na
> gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nieujednoliconej jeszcze z
> `main`. Tak samo commit `2e67219` („tabela Wiarygodności wdrożona") — źródło 47
> kluczy `wiarygodnosc*` w `gra/data/diplomacy.json` opisane w noty N3 — nie jest
> przodkiem tego drzewa: w tym worktree `gra/data/diplomacy.json` ma dziś **0**
> kluczy `wiarygodnosc*` (zweryfikowane grepem przed startem prac). Treść niżej do
> nagłówka „## Wdrożenie" jest **odtworzona 1:1** przez `git show 0a08bf0:...` (ten
> sam obiekt git, dostępny lokalnie mimo że nieosiągalny z HEAD) — decyzja właściciela
> i jej uzasadnienie są autentyczne, nie parafrazowane. Sekcja „## Wdrożenie" opisuje
> co faktycznie zrobiono **w tym drzewie**, z jego realnym (mniejszym) zakresem
> odwołań — patrz tam po dokładne liczby.

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

> Uwaga: powyższa tabela to inwentaryzacja z gałęzi, na której zapadła decyzja (stan
> po `2e67219`). W drzewie, w którym faktycznie wdrożono zmianę (ta sesja), realne
> liczby były inne — patrz „## Wdrożenie" niżej.

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

### Rozbieżność stanu drzewa vs. inwentaryzacja decyzji (opisana szczerze, nie ukryta)

Operator wykonujący to zlecenie pracował w worktree opartym na `main` **bez** commitów
`2e67219` / `0a08bf0` (patrz dopisek na górze pliku). Skutki dla zakresu:

- `gra/data/diplomacy.json` w tym drzewie ma **0** kluczy `wiarygodnosc*` (nie 47) — cały
  blok Wiarygodności w JSON jest tu jeszcze nieobecny. To NIE zmienia poprawności zadania:
  `loadDiplomacyParams()` po prostu nie nadpisuje niczego dla tych kluczy (brak wpisu → TS
  default), więc przejście na `getBaseDiplomacyParams()` jest w tym punkcie **trywialnie
  neutralne** dla wszystkich `wiarygodnosc*`.
- Realne liczby odwołań do surowej stałej `DIPLOMACY_PARAMS.xxx` w tym drzewie (policzone
  `grep -oE 'DIPLOMACY_PARAMS\.[A-Za-z0-9_]+'`, licząc każde wystąpienie osobno):

  | Plik | Odwołań (to drzewo) | Odwołań (inwentaryzacja decyzji) |
  |---|---:|---:|
  | `diplomacy-credibility.ts` | **36** (19 unikalnych kluczy, 14 funkcji) | 43 |
  | `diplomacy-layers.ts` | **5** (wzorzec `const p = DIPLOMACY_PARAMS;`, 5 funkcji) | 5 |
  | `diplomacy-value-catalog.ts` | **1** | 1 |
  | **RAZEM** | **42** | 49 |

  Różnica (36 vs 43 w credibility.ts) wynika z brakującego commitu `2e67219`, który — wedle
  jego nazwy — dopisał dodatkowe odwołania do Wiarygodności nieobecne w tym drzewie. Zgodnie
  z poleceniem zlecenia („pracuj na SWOICH liczbach, nie na moich") wdrożenie podmieniło
  **wszystkie 42** faktycznie znalezione odwołania — sto procent pokrycia w tym drzewie.

- **Zerowa różnica wartości JSON vs TS w całym `DIPLOMACY_PARAMS`**, nie tylko w kluczach
  użytych przez te 3 pliki: skrypt weryfikacyjny porównał wszystkie 127 kluczy TS przeciw 85
  kluczom obecnym w `gra/data/diplomacy.json` → **0 rozbieżności wartości**. To silniejszy
  dowód neutralności niż wymagane minimum (sprawdzenie tylko kluczy użytych w 3 plikach).

### Zmiany kodu

1. **`gra/src/game/diplomacy.ts`** — `getBaseDiplomacyParams()` (już istniejące, linia ok. 463)
   oznaczone `export`. Zero zmian logiki/memoizacji — funkcja nie została napisana ponownie.
2. **`gra/src/game/diplomacy-credibility.ts`** — import `DIPLOMACY_PARAMS` → `getBaseDiplomacyParams`;
   14 funkcji (w tym 1 prywatna, `czasZapomnienia`) dostały `const P = getBaseDiplomacyParams();`
   na początku ciała i czytają `P.klucz` zamiast `DIPLOMACY_PARAMS.klucz`. Publiczny sygnatury
   funkcji (w tym eksportowanej `wartoscBiezaca`, używanej przez `tools/wiarygodnosc-test.cjs`
   z ustalonym kontraktem 3-argumentowym) **niezmienione**.
3. **`gra/src/game/diplomacy-layers.ts`** — import zamieniony analogicznie; 5 miejsc
   `const p = DIPLOMACY_PARAMS;` → `const p = getBaseDiplomacyParams();`. Wszystkie 5 już były
   lokalne (wewnątrz ciała funkcji) — brak stałych modułowych, więc **brak problemu kolejności
   inicjalizacji (wymóg 3)**.
4. **`gra/src/game/diplomacy-value-catalog.ts`** — import zamieniony; jedyne odwołanie
   (`diplomacyHandelZaufaniePerTura`) czyta teraz `getBaseDiplomacyParams().handel_zaufanie_perTura`.

Weryfikacja końcowa: `grep -n "DIPLOMACY_PARAMS" <plik>` w każdym z 3 plików zwraca wyłącznie
komentarze (0 odwołań wartościowych). `DIPLOMACY_PARAMS` pozostaje `export const` w
`diplomacy.ts` (używane gdzie indziej, poza zakresem tego zlecenia — nietknięte).

### Wymóg 3 (kolejność inicjalizacji modułów) — wynik kontroli

Żadne z 42 podmienionych odwołań nie żyło w stałej na poziomie modułu — wszystkie były już
wewnątrz ciał funkcji (leniwe z definicji). Nie było więc miejsc wymagających przeniesienia.

### Dowód W5 — test `tools/wiarygodnosc-test.cjs`, sekcja 10

Ograniczenie mechanizmu: esbuild inline'uje `import ... from '.../diplomacy.json'` jako literał
JS **w chwili budowania** bundla — `resetEffectiveDiplomacyParamsCache()` czyści wyłącznie
memoizację `_baseDiplomacyParams` w już zbudowanym module, NIE treść pliku JSON zamrożoną w
bundlu. Prawdziwego dowodu „edytuję JSON i widzę nową wartość bez rebuildu" nie da się więc
uzyskać na tym samym bundlu, którego już użyto — dokładnie tak samo jak w produkcyjnym Vite
(JSON też jest bundlowany statycznie).

Zamiast tego sekcja 10 buduje **drugi, osobny bundle** z modyfikowanej **kopii** całego drzewa
`src/` + `data/` w katalogu tymczasowym (`fs.mkdtempSync` + `fs.cpSync`, sprzątane w `finally`) —
prawdziwy `gra/data/diplomacy.json` pozostaje nietknięty przez cały czas (potwierdzone
`git status --porcelain` = puste po każdym uruchomieniu testu). W kopii nadpisano 3 klucze na
wartości jawnie różne od domyślnych TS (żeby wykluczyć przypadkową zgodność):

| Klucz | TS default | Override w kopii JSON |
|---|---:|---:|
| `wiarygodnoscStartTrudny` | 0 | 77 |
| `wiarygodnoscProgWzorCnoty` | 40 | 5 |
| `startZaufanie` | 20 | 63 |

Trzy asercje, po `resetEffectiveDiplomacyParamsCache()` na świeżo zbudowanym bundlu:

1. **`diplomacy-credibility.ts`, `wiarygodnoscStartowa('hard')`** → oczekiwane **77** (przejście
   bezpośrednie JSON→wynik).
2. **`diplomacy-credibility.ts`, `wiarygodnoscBand(10)`** → oczekiwane **`'wzor_cnoty'`** (TS
   default dawałby `'uczciwy'`, bo próg 40 > 10; po override progu na 5, W=10 przekracza próg).
3. **`diplomacy-layers.ts`, `defaultNeutralRelation().zaufanie`** → oczekiwane **63**.

Kontrola negatywna (weryfikacja Operatora przed finalizacją, nie na stałe w suicie): przy
tymczasowym przywróceniu przedwdrożeniowych wersji `diplomacy-credibility.ts` /
`diplomacy-layers.ts` (kopie z `git show HEAD:...`) te same 3 asercje **padają** —
`wiarygodnoscStartowa('hard')` zwraca 0 (nie 77), `wiarygodnoscBand(10)` zwraca `'uczciwy'`
(nie `'wzor_cnoty'`), `defaultNeutralRelation().zaufanie` zwraca 20 (nie 63) — dokładnie tak, jak
przewiduje diagnoza N3 (surowa stała TS, JSON ignorowany). Po przywróceniu wersji po zmianie: z
powrotem 155/0 PASS. To zamyka pętlę dowodową: test **rozróżnia** stan przed/po, nie jest
tautologią.

Sekcje 1–9 istniejącego pliku (bundle `WC`, zbudowany z prawdziwych, niezmodyfikowanych danych)
służą jako kontrola „przed" w locie: np. `wiarygodnoscStartowa('hard') === 0` (asercja
istniejąca, linia ok. 271) i `band(39)==='uczciwy'` / `band(40)==='wzor_cnoty'` (linie 214–215) —
potwierdzają, że bez override funkcje nadal zwracają defaulty TS (bo JSON w tym drzewie nie ma
jeszcze kluczy `wiarygodnosc*`).

### Wyniki bramek (dokładne liczby, ten sam punkt odniesienia przed/po)

| Bramka | Przed zmianą | Po zmianie | Identyczne? |
|---|---|---|---|
| `npx tsc --noEmit` | exit 0 | exit 0 | tak |
| `wiarygodnosc-test.cjs` | 152 pass / 0 fail | 155 pass / 0 fail (+3 nowe z sekcji 10) | tak (152 stare bez zmian + 3 nowe, wszystkie PASS) |
| `diplomacy-test.cjs` | 148/0, exit 0 | 148/0, exit 0 | tak, bajt-w-bajt |
| `diplomacy-proposal-test.cjs` | 87/90 PASS, exit 1 (3 przedistniejące fail, NIE z tego zlecenia) | 87/90 PASS, exit 1 | tak, bajt-w-bajt |
| `diplomacy-acceptance-points-test.cjs` | 225/0, exit 0 | 225/0, exit 0 | tak, bajt-w-bajt |
| `diplomacy-locks-test.cjs` | 69/70, exit 1 (1 przedistniejący fail id5) | 69/70, exit 1 | tak, bajt-w-bajt |
| `diplomacy-value-catalog-test.cjs` | 61/62, exit 1 (1 przedistniejący fail) | 61/62, exit 1 | tak, bajt-w-bajt |
| `diplomacy-resource-cyclic-trade-test.cjs` | 44/45, exit 1 (1 przedistniejący fail) | 44/45, exit 1 | tak, bajt-w-bajt |
| `tech-tree-test.cjs` | 19/0, exit 0 | 19/0, exit 0 | tak, bajt-w-bajt |
| `research-test.cjs` | 33/0, exit 0 | 33/0, exit 0 | tak, bajt-w-bajt |
| `diplomacy-layers-test.cjs` (dodatkowa, nie w liście obowiązkowej) | 22/0, exit 0 | 22/0, exit 0 | tak, bajt-w-bajt |

Cztery bramki (`diplomacy-proposal-test`, `diplomacy-locks-test`, `diplomacy-value-catalog-test`,
`diplomacy-resource-cyclic-trade-test`) mają w tym drzewie przedistniejące czerwone testy — inne
liczby niż podane w zleceniu (117/117, 70/70, 62/0, 45/0), spójnie z ogólną rozbieżnością stanu
drzewa opisaną wyżej. To NIE regresja tego zlecenia: log przed i po zmianie jest **bajt-w-bajt
identyczny** (`diff` bez różnic) dla każdej z tych czterech bramek — dowód, że zlecenie nie
dołożyło ani nie usunęło żadnego niepowodzenia.

### Rzeczy NIE zrobione / poza zakresem

- Nie naprawiono 4 przedistniejących czerwonych testów (`diplomacy-proposal-test` id
  wchłonięcia, `diplomacy-locks-test` id5, `diplomacy-value-catalog-test` ruda=kopalnia,
  `diplomacy-resource-cyclic-trade-test`) — to inny temat, poza zakresem N3, i CLAUDE.md §7
  zabrania „naprawiania przy okazji".
- Nie scalono tego worktree z gałęzią `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (commity
  `2e67219`/`0a08bf0`) — zabronione operacje git w tej sesji (worktree izolowany, zero
  merge/rebase/checkout). Gdy oba drzewa się połączą, warto ponownie policzyć odwołania —
  spodziewane 43/5/1 zamiast dzisiejszych 36/5/1, ale mechanizm (getBaseDiplomacyParams,
  binding raz na funkcję) będzie już na miejscu i powinien objąć nowe odwołania bez konfliktu
  merge'owego w większości przypadków (te same nazwy funkcji, ten sam wzorzec).
- Deploy do ROBOCZA — nie wykonany (hasło `deploy` nie padło; zresztą deploy jest zastrzeżony
  dla sesji lokalnej/Opus 5 wg CLAUDE.md pkt 4).
