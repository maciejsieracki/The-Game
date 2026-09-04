# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — dispatch

TEMAT: `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high; Evaluator — **Opus 5**, effort high
(temat wizualny, `R-PROC-AUTOBOT.md` §9 poz. 6b); Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel, ze zrzutem mapy)

> „Zauważyłem, że czasem miasta danej cywilizacji, zamiast nazywać się z listy miast,
> nazywają się Chińczycy. To nie tak powinna się nazywać stolica danej cywilizacji, tylko
> zgodnie z nazwami miast tej cywilizacji, tak jak Ateny były dla Grecji czy Rzym dla
> Rzymian. Trzeba to sprawdzić i poprawić, bo w kilku cywilizacjach to widziałem. Być może
> nazwa miasta została pomylona z nazwą cywilizacji i, co ważne, trzeba sprawdzić
> historycznie, która stolica tej cywilizacji była pierwotna, i tak ją nazwać."

Zrzut: plakietka na mapie — korona, napis **CHIŃCZYCY**, liczba **4**.

**ECHO właściciela po przedstawieniu wyniku reconu (AskUserQuestion):**
**„Pokaż nazwę miasta i cywilizację"** — etykieta obcej stolicy ma nieść OBA człony,
wzorem państw-miast: `Xi'an · Chińczycy`, plus korona jak dotąd.

## RECON — HIPOTEZA WŁAŚCICIELA SIĘ NIE POTWIERDZIŁA, PRZYCZYNA JEST INNA

To jest najważniejsza część dispatchu. **Nie ma błędu w danych ani w nadawaniu nazw.**

**A. Dane są kompletne dla WSZYSTKICH cywilizacji.**
`gra/data/city-names-pools.json`, klucz = `ikonaId` cywilizacji, kształt wpisu
(`nazwa_pl`, `miasta_cywilizacji`, `miasta_panstwa`) w `city-names-pool.ts:39-43`.
Chińczycy mają **100** nazw miast (`Xi'an`, `Luoyang`, `Pekin`, `Nankin`, `Kaifeng`, …)
i **10** nazw państw-miast (`Qin, Qi, Chu, Jin, Yan, Zhao, Wei, Han, Lu, Song`).
**Wszystkie 15 cywilizacji mają dokładnie 100 + 10 pozycji**, a walidator tego pilnuje
(`city-names-pool.ts:243-248`). Nie ma cywilizacji z brakującą ani krótką listą.

**B. Fallback „nazwa cywilizacji jako nazwa miasta" istnieje, ale jest MARTWY.**
`city-names-pool.ts:126` (`stateCityNameAt(pools, ikonaId, 0, ikonaId)`) i
`civ-names.ts:90` — oba dają `ikonaId`, czyli `chinczycy` **małymi literami**, nie
„Chińczycy". Przy obecnych danych nigdy nie są osiągane. Pozostałe fallbacki dają
`Stolica` (`city-names-pool.ts:76`), `Rywal N` (`:91`), `Miasto` (`:187`).

**C. PRZYCZYNA: świadoma podmiana w warstwie WYŚWIETLANIA.**
`display-names.ts:174` — warunek
`isForeign && opts?.isCapital === true && !isCityState && !isCityStateOwner`
prowadzi do `display-names.ts:252`: `if (isClusterCapital && cleanCiv) return cleanCiv;`
→ zwraca nazwę cywilizacji zamiast nazwy miasta. Miasto **ma poprawną nazwę z puli**
(np. `Xi'an`) — jest tylko przykryta na etykiecie.
Wołający: `render/cities.ts:778-789` (`_cityMapLabel`), `:861-862`, korona `:839`;
wpięcie `main.ts:2284`.

**D. To była JAWNA decyzja projektowa, zdeployowana.**
`docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md:11`: „Stolica obcego państwa: **etykieta
cywilizacji** (np. „Chińczycy") **oraz** marker wizualny (korona…)". Dokument używa
dosłownie tego samego przykładu, który zobaczył właściciel. Rejestr:
`REJESTR-PROSB-I-ZADAN.md:150`, `MAP-UX-CLUSTER-LABEL-Q1`, **ZDEPLOYOWANE FALA 296**
(`a37f7123`, commity `9d33e8f` + `d3470ed`). Powiązane: `:276` `R-AUDYT-STOLICE-VS-MP`.
**Ten temat ŚWIADOMIE zmienia tamtą decyzję na wyraźne żądanie właściciela** — to nie jest
naprawa błędu, to zmiana projektu.

**E. Dlaczego „w kilku cywilizacjach": objaw jest jednakowy dla KAŻDEJ.**
Nie zależy od kompletności danych — zależy wyłącznie od tego, czy miasto jest obcą stolicą.

**F. Wzorzec docelowy JUŻ ISTNIEJE w tym samym pliku, dwie linie niżej.**
`display-names.ts:253-255`: państwa-miasta dostają
`` `${cleanCity}${CITY_STATE_SEPARATOR}${cleanCiv}` `` → „Yan · Chińczycy".
Guard `isCityStateOwner` (`display-names.ts:172,174`) chroni je przed podmianą z (C).
**Zmiana sprowadza się do ujednolicenia gałęzi stolicy z gałęzią państwa-miasta** —
nie do budowy nowego formatu.

**G. Dane wejściowe są już dostępne** — `cleanCity` powstaje z `cityName` w tym samym
bloku (`display-names.ts:242-244`), a `formatCityMapLabel` dostaje `city` z nazwą
(`render/cities.ts:782-788`). **Nie trzeba przekazywać niczego nowego przez `main.ts`.**

**H. Druga część zgłoszenia właściciela — „sprawdzić historycznie, która stolica była
pierwotna" — jest BEZPRZEDMIOTOWA po ustaleniu (A) i (C)**, ale nie ignoruj jej milcząco:
sprawdź, czy pierwsza pozycja `miasta_cywilizacji` każdej cywilizacji jest sensowną
stolicą historyczną (dla Chińczyków `Xi'an` — Chang'an, stolica Zachodniej Han i Tangów,
jest historycznie zasadne), i **napisz w raporcie, czy któraś cywilizacja ma na pierwszej
pozycji nazwę oczywiście nie-stołeczną**. Jeśli tak — zgłoś jako `DECISION_REQUIRED`,
NIE zmieniaj danych samodzielnie (kolejność puli to decyzja właściciela).

## GOAL

### GOAL 1 — etykieta obcej stolicy niesie oba człony

`display-names.ts:252` przestaje zwracać samą nazwę cywilizacji. Obca stolica dostaje
`nazwa miasta` + separator + `nazwa cywilizacji`, **tym samym separatorem i w tej samej
kolejności co państwa-miasta** (`CITY_STATE_SEPARATOR`, gałąź `:253-255`) — chodzi
o ujednolicenie, nie o drugi wariant formatu. Korona i liczba populacji bez zmian.

Zachowaj degradację, którą ma gałąź państw-miast: gdy `cleanCity` brakuje albo jest równe
`cleanCiv`, wracamy do samej nazwy cywilizacji zamiast produkować „Chińczycy · Chińczycy".

### GOAL 2 — państwa-miasta i miasta gracza bez zmian

Gałąź `isCityState` (`:253-256`) i ścieżka miast własnych (`isForeign === false`) mają
zachowanie **identyczne jak dziś**. Udowodnij asercją, nie deklaracją.

### GOAL 3 — bramka testowa

Nowa `gra/tools/mapa-etykieta-stolicy-test.cjs`, minimum:
1. obca stolica → etykieta zawiera ORAZ nazwę miasta, ORAZ nazwę cywilizacji,
   w kolejności i z separatorem identycznym jak dla państwa-miasta;
2. obca stolica, gdy nazwa miasta = nazwa cywilizacji → brak duplikatu
   („Chińczycy · Chińczycy" NIE występuje);
3. obca stolica bez nazwy miasta → sama nazwa cywilizacji (degradacja, nie pusty string
   ani separator-sierota);
4. państwo-miasto → etykieta DOKŁADNIE jak dziś (regresja);
5. zwykłe obce miasto (nie stolica) → etykieta DOKŁADNIE jak dziś (regresja);
6. miasto gracza → etykieta DOKŁADNIE jak dziś (regresja);
7. nazwa techniczna (`isTechnicalOwnerLabel`) nadal jest odfiltrowywana w obu członach.

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] `node tools/mapa-etykieta-stolicy-test.cjs` — 100% pass, minimum 7 asercji.
- [ ] Zrzut żywego Chromium mapy z widoczną obcą stolicą — **obejrzany i opisany**,
      w `dowody/`. Sprawdź na nim, czy dłuższa etykieta (dwa człony zamiast jednego)
      nie rozjeżdża plakietki ani nie zachodzi na sąsiednie heksy — **to jest realne
      ryzyko tej zmiany**, bo etykieta rośnie mniej więcej dwukrotnie.
- [ ] Raport odpowiada na pytanie (H): czy pierwsza pozycja `miasta_cywilizacji` każdej
      z 15 cywilizacji jest sensowną stolicą historyczną. Lista, nie ogólnik.
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.
- [ ] Bez regresu na bramkach nazw/etykiet — **znajdź je sam**
      (`ls gra/tools/ | grep -Ei "name|nazw|label|etykiet|city-names|display"`),
      uruchom WSZYSTKIE, podaj wyniki; czerwona → sprawdź parytet na czystej bazie
      PRZED zgłoszeniem jako regres.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy, specyficzny dla tego tematu: „naprawa" nieistniejącego błędu w danych.**
Właściciel podejrzewał pomylenie nazwy miasta z nazwą cywilizacji w danych. Recon to
obalił: dane są kompletne dla wszystkich 15 cywilizacji, a podmiana dzieje się w warstwie
wyświetlania. **Zakaz dotykania `city-names-pools.json` i `civs.json`** — jeśli uznasz, że
dane jednak są wadliwe, pokaż to konkretnym wpisem i zgłoś `DECISION_REQUIRED`, zamiast
edytować.

**Tryb drugi: cofnięcie cudzej decyzji szerzej, niż o to poproszono.**
`MAP-UX-CLUSTER-LABEL-Q1` jest zdeployowaną decyzją (FALA 296). Właściciel zmienia
**jeden** jej element — etykietę obcej stolicy. Korona, marker, zachowanie państw-miast
i miast własnych zostają. Każda zmiana poza tym jednym elementem to wyjście poza zakres.

**Tryb trzeci: uznanie tematu wizualnego za zamknięty bez obejrzanego zrzutu.**
Etykieta rośnie dwukrotnie — zrzut jest tu nie formalnością, tylko jedynym sposobem
zobaczenia, czy plakietka się nie rozjeżdża.

**Tryb czwarty: test tautologiczny.** Pokaż, że bramka czerwienieje po mutacji — przywróć
`return cleanCiv;` w linii 252, uruchom, wklej liczbę faili, cofnij.

## ALLOWLISTA

- `gra/src/game/display-names.ts`
- `gra/src/render/cities.ts` (**tylko** jeśli konieczne — recon (G) mówi, że dane już tam
  są; jeśli edytujesz, uzasadnij w raporcie)
- `gra/tools/mapa-etykieta-stolicy-test.cjs` (nowy)
- `dyspozycje/autobot/runs/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, **`docs/decyzje/**` (w tym
`MAP-UX-CLUSTER-LABEL-Q1.md` — aktualizację decyzji robi orkiestrator po integracji,
nie ty)**, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`,
`playbook.json`, **`gra/data/city-names-pools.json`, `gra/data/civs.json`** (recon A — dane
są poprawne), **`gra/src/main.ts`, `gra/src/game/visibility.ts`,
`gra/src/ui/entityCards/**`, `gra/src/ui/techDiscoveryNotice.ts`,
`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts`,
`gra/data/society-params.json`, `gra/src/ui/empireDetailPanel.ts`** — zajęte przez
równolegle biegnące tematy (`R-PROC-AUTOBOT.md` §2b).
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-mapa-etykieta-stolicy`, gałąź
`autobot/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte. `--outDir` poza drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie zmieniasz danych nazw miast ani cywilizacji.
- Nie zmieniasz korony, markera stolicy ani liczby populacji na plakietce.
- Nie zmieniasz etykiet państw-miast, zwykłych obcych miast ani miast gracza.
- Nie aktualizujesz `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` — to robi orkiestrator.
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.
