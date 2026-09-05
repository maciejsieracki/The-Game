# R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — dispatch (algorytm autowyżywienia)

TEMAT: `R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel)

> „Nie jest pożądana sytuacja, że jedne miasta głodują, a drugie mają super nadwyżkę.
> Raczej ta nadwyżka powinna być równomiernie rozkładana w całej cywilizacji, a wszystkie
> miasta będą się rozwijać wolniej, a nie tak, że jedno rośnie bardzo szybko, a drugie
> w ogóle. Oczywiście wyjątkiem jest sytuacja, gdy miasto osiągnie swój limit; wtedy nie
> musi się rozwijać i powinno mieć zerowy przyrost. **Generalnie system autowyżywienia
> powinien dążyć do tego, aby w każdym mieście był podobny wzrost, jednocześnie unikając
> głodu.** Dla całej cywilizacji wzrost powinien się spowalniać lub przyspieszać
> w zależności od ilości żywności. Obecnie niepożądane są sytuacje, w których jedne miasta
> rosną bardzo szybko i mają wysoki przyrost, a jednocześnie są na minusie. To jest bez sensu."

Wcześniej, ze zrzutu Spichlerza:
> „Sparta ma jeden [mieszkańca], a to miasto jest bardzo stare, już powinno mieć większą
> ludność. To samo Ateny, też tylko dwa, a było moim pierwszym miastem."

## RECON ORKIESTRATORA — CO JEST ZMIERZONE, A CO JEST HIPOTEZĄ

**ZMIERZONE (z liczb na zrzucie właściciela, 12 miast) — odwrotna zależność wzrostu
od bilansu żywności:** Ateny bilans **+24** → wzrost **−1%**; Sparta bilans **+13**,
koszt racji **0** → **−4%**; Korynt **+15** → **−2%**. Jednocześnie Milet **−21** → **+7%**,
Jin **−4** → **+7%**, Zhao **−12** → **+7%**, Yan **−13** → **+4%**.
**Miasta z nadwyżką się kurczą, miasta z deficytem rosną.** To jest objaw do wyjaśnienia.

**Mechanizm podany wprost przez panel miasta:** „Wyżywienie 0 · −10%", rozbicie
„Wyżywienie −10% / Małe miasto +5% / Szczęście +1% = −4%". Czyli nadwyżka Sparty bierze się
**stąd, że jej `poziomRacji` stoi na zerze** — miasto nic nie wydaje na jedzenie i płaci
za to −10% wzrostu.

**HIPOTEZA GŁÓWNA — POTWIERDŹ ALBO OBAL, NIE PRZYJMUJ NA WIARĘ.**
Autowyżywienie jest **wszystko-albo-nic** i kilka miast deficytowych blokuje podniesienie
racji w CAŁYM imperium. `autoRaiseRationsForGrowth` (`gra/src/game/empire-food.ts:627`)
podnosi `poziomRacji` o `WYZYWIENIE_STEP` we **wszystkich** miastach właściciela naraz
(pętla `:666-672`), po każdym kroku przelicza bilanse i **cofa krok**, gdy pula centralna
< 0 albo kryterium bilansu niespełnione (`:693-699`); kryteria sumują wszystkie miasta
(`computeEmpireCityFoodNadwyzka`, `:412-426`). Na zrzucie cztery miasta są na minusie —
jeśli one blokują krok, Sparta i Ateny nie dostaną racji **mimo własnej nadwyżki i mimo
że Spichlerz Centralny ma 279/1000, rośnie o +22/turę i deklaruje „wszystkie miasta
nakarmione"**.

**Pierwszym zadaniem Operatora jest rozstrzygnąć tę hipotezę pomiarem** — odtworzyć układ
ze zrzutu w bramce i pokazać, czy krok faktycznie jest cofany przez miasta deficytowe.
Jeśli hipoteza jest fałszywa, **powiedz to wprost i podaj prawdziwą przyczynę** — recon
orkiestratora nie jest wiążący co do przyczyny, tylko co do objawu.

**Co JUŻ DZIAŁA i czego nie psuć:** redystrybucja z puli centralnej (`empire-food.ts:257-265`)
działa poprawnie — to ona dopłaca Miletowi z pozycji „Pomoc miastom −50". Nadwyżka trafia
do puli centralnej (`:249-251`), cap puli klampowany (`:276`).

## GOAL

Funkcją celu autowyżywienia przestaje być „podnoś racje wszystkim, dopóki się da",
a staje się **wyrównywanie WZROSTU między miastami przy twardym warunku braku głodu**.

Trzy własności, wszystkie wymagane:

1. **(A) Minimalizacja rozrzutu wzrostu.** Algorytm dąży do zbliżonego procentowego
   przyrostu we wszystkich miastach właściciela, zamiast maksymalizować przyrost części
   z nich. Twardy warunek nadrzędny: **żadne miasto nie głoduje**.
2. **(B) Miasto na limicie ludności wychodzi z optymalizacji.** Ma zerowy przyrost i **nie
   konsumuje racji ponad potrzebę** — jego porcja wraca do puli dla pozostałych.
   To jest wchłonięty temat `R-AUTOWYZYWIENIE-LIMIT-LUDNOSCI-STOP-Q1`, ECHO właściciela
   wariant (a).
3. **(C) Tempo wzrostu CAŁEJ cywilizacji skaluje się z dostępną żywnością** — przy
   niedoborze wszystkie miasta rosną wolniej, zamiast części rosnąć szybko kosztem reszty.

**Zakaz sytuacji odwrotnej zależności:** po naprawie nie może istnieć para miast, w której
miasto z **dodatnim** bilansem ma **niższy** wzrost niż miasto z **ujemnym** bilansem,
przy tej samej wielkości i tych samych modyfikatorach. To jest binarnie sprawdzalne.

## KRYTERIA KOŃCA (binarne)

1. Nowa bramka `gra/tools/autowyzywienie-rowny-wzrost-test.cjs`, odtwarzająca układ
   ze zrzutu właściciela (12 miast, cztery deficytowe, pula centralna 279/1000):
   - **PRZED naprawą** bramka pokazuje odwrotną zależność (miasta z nadwyżką rosną wolniej
     od deficytowych) — czyli **czerwienieje na czystej bazie**;
   - **PO naprawie** rozrzut przyrostu między miastami spada, żadne miasto nie głoduje,
     a odwrotna zależność nie występuje.
2. Osobna asercja na własność (B): miasto na limicie ludności ma przyrost 0 i **nie
   podnosi swojego `poziomRacji` ponad potrzebę** — porcja wraca do puli.
3. Osobna asercja na własność (C): przy zmniejszeniu dostępnej żywności o połowę
   **wszystkie** miasta zwalniają, zamiast części zatrzymać się całkowicie.
4. Rozstrzygnięcie hipotezy „wszystko-albo-nic" zapisane w raporcie **z pomiarem**:
   potwierdzona albo obalona, z liczbami.
5. `tsc --noEmit` zielone.
6. Zielone: `empire-food-test` i pozostałe bramki dotykające `empire-food.ts` — wypisz
   je z nazwy i wynikiem. Jeśli któraś miała zaszyte wartości sprzed zmiany,
   **zaktualizuj i wypisz dokładnie które i dlaczego**.
7. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz uznania tematu za zamknięty na podstawie tego, że „rozrzut się zmniejszył".**
Rozrzut spada trywialnie, gdy wszystkie miasta przestaną rosnąć. Bramka musi asertować
**jednocześnie** trzy rzeczy: mały rozrzut, brak głodu ORAZ dodatni łączny przyrost
imperium. Wykaż, że wariant „zatrzymaj wszystkich" **nie przechodzi** Twojej bramki.

**Drugi tryb: reimplementacja zamiast pomiaru.** Bramka ma wołać prawdziwą pętlę ekonomii,
nie własną kopię wzoru na przyrost. Kopia zawsze potwierdzi to, co sama liczy.

**Trzeci tryb: przyjęcie hipotezy orkiestratora na wiarę.** Hipoteza „wszystko-albo-nic"
jest opisana szczegółowo i brzmi przekonująco — to nie znaczy, że jest prawdziwa.
Zmierz ją, zanim na niej zbudujesz naprawę.

## ALLOWLISTA

- `gra/src/game/empire-food.ts`
- `gra/data/` — wyłącznie plik parametrów wyżywienia, jeśli naprawa wymaga nowej stałej
  (nazwana wartość w danych, nie magiczna liczba w kodzie)
- `gra/tools/autowyzywienie-rowny-wzrost-test.cjs` (NOWY)
- istniejące bramki `empire-food*` — wyłącznie aktualizacja zaszytych wartości, jawnie uzasadniona
- `dyspozycje/autobot/runs/R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A/`

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/src/ui/**` (to jest węzeł B, osobny temat
dispatchowany równolegle — wejście tam = naruszenie allowlisty), pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-autowyzywienie-a`, gałąź `autobot/R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A`,
baza jawnie: `origin/main` na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA), brzmienie dosłowne z `playbook.md`: „Zakaz `npm run build`/`dev`
w `gra/` (export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja:
`node ./node_modules/typescript/bin/tsc --noEmit`; bramki `node gra/tools/*-test.cjs` nie są
zakazem objęte. `--outDir` musi wskazywać katalog POZA drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów, destylat. **Raport commituj OD RAZU po zapisaniu** —
poprzednia fala straciła raport Evaluatora przy restarcie kontenera, bo został w pamięci procesu.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja, `READY_FOR_DEPLOY` i deploy/push —
wyłącznie ręką orkiestratora.

---

# RATYFIKACJA ORKIESTRATORA (2026-09-05) — rozstrzygnięcie zarzutów 1 i 2

## Zarzut 1 — ROZJAZD WEWNĄTRZ MOJEGO DISPATCHU, uznaję błąd

Allowlista mówiła „istniejące bramki **`empire-food*`**", a kryterium 6 tego samego dispatchu
żądało zielonych „bramek **dotykających `empire-food.ts`**" — to są dwa różne zbiory.
`auto-wyzywienie-kosztarmii-kryterium-test.cjs` należy do drugiego, nie do pierwszego.
Operator musiał zaktualizować w nim 3 zaszyte wartości, bo **pinowały wynik zapadki, czyli
dokładnie zgłaszany objaw** — zostawienie ich oznaczałoby utrwalenie defektu w bramce.

**ALLOWLISTA ZOSTAJE ROZSZERZONA** o `gra/tools/auto-wyzywienie-kosztarmii-kryterium-test.cjs`,
wyłącznie w zakresie aktualizacji zaszytych wartości, jawnie uzasadnionej w raporcie
(3 liczby + komentarz; istota testu — `kosztArmii` w kryterium — nietknięta).
**To nie jest naruszenie §16a pkt 1** i nie ma być tak orzekane.

## Zarzut 2 — TRAFNY I ISTOTNY, ale nie do naprawy w tym węźle

Evaluator ma rację: `grep -rn popCapByCityId gra/src` trafia **wyłącznie w `empire-food.ts`**,
więc żaden realny caller nie podaje mapy limitów i **własność (B) jest w grze martwa** —
działa wyłącznie w bramce. To jest realna luka wobec ECHO właściciela (wariant (a):
miasto na limicie ma zerowy przyrost i nie konsumuje racji ponad potrzebę).

**Nie da się jej domknąć w tym węźle i nie jest to wina wykonawcy:**
- wpięcie wymaga `gra/src/main.ts` (`:28128`, `:28152`, `:28179`, `:16256`, `:16285`),
  a `main.ts` jest w tym dispatchu **zakazany bezwzględnie**;
- `main.ts` jest w tej chwili **zajęty przez `P-AI-NIE-STAWIA-BUDYNKOW-Q1`**, więc
  równoległe wejście łamałoby §2b;
- węzeł B tego tematu to UI („stan przycisku"), nie wpięcie danych — Evaluator słusznie
  zauważył, że to nie tam.

**Rozstrzygnięcie: osobny temat następczy** `R-AUTOWYZYWIENIE-LIMIT-WPIECIE-POPCAP-Q1`,
dispatchowany po zwolnieniu `main.ts`. Parametr `popCapByCityId` jest **opcjonalny**,
a brak mapy daje zachowanie wsteczne — więc integracja tego węzła jest bezpieczna
i niczego nie psuje. Własność (B) zostaje **zaimplementowana i pokryta bramką**,
a jedynie nieaktywna do czasu wpięcia.

**Final Control: orzekaj zarzut 2 jako ODDAL** — jest trafny co do faktu, ale wskazuje
pracę leżącą poza allowlistą tego węzła, a orkiestrator przejął ją osobnym tematem.
Nie stawiaj `NAPRAW`, bo naprawa tutaj byłaby naruszeniem granicy §9.

## Zarzut 3 — przyjęty i naprawiony przez obronę

Miasto na limicie miało poziom przybity do stałej 1,5, nigdy nie przycięty do wspólnego
`level`. Skutek zmierzony przez Evaluatora był **odwrotny do intencji właściciela**:
włączenie (B) pogarszało sytuację miast rosnących (`uniformLevel` 0,5 → 0). Poprawka
`Math.min(WYZYWIENIE_POZIOM_NA_LIMICIE, level)`. **Final Control ma zweryfikować tę
poprawkę własnym pomiarem**, nie przyjąć jej z raportu.

## Uznanie najważniejszego wyniku tego węzła

**Moja hipoteza główna „wszystko-albo-nic" została OBALONA jako przyczyna — i o to prosiłem.**
Dispatch wymagał jej zmierzenia, nie przyjęcia na wiarę, i tak się stało. Prawdziwą przyczyną
jest **asymetria**: obniżanie działa per-miasto i zależy od kolejności iteracji
(`maxSafePoziomRacjiForCity` pytała „jak nisko musi zejść TO JEDNO miasto, żeby CAŁE imperium
się zbilansowało", więc pierwsze odpytane miasto pochłaniało całą korektę), podczas gdy
podnoszenie jest lockstep i cofane globalnie. Pomiar rozstrzygający: to samo imperium,
ta sama tura, flow −22 → `maxSafe` **0 dla Sparty, 2 dla Jin**; po naprawie **4 dla wszystkich 12**.
