# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — dispatch (bitwa ręczna: jeden kontratak + morale od mocy)

TEMAT: `R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel)

> „Mam też na myśli bitwę ręczną, kiedy po prostu straty są podobne, czasem większe,
> i jedna jednostka potrafi zadać większe straty dużej armii, niż wynikałoby to ze
> składu armii."

Pomysł na rozwiązanie:
> „Jednostka powinna oddawać obrażenia tylko raz. Jeśli kolejna jednostka atakuje
> z flanki lub innego miejsca, zadaje jedynie obrażenia. W ten sposób rozwiązujemy
> problem przewagi liczebnej (…) a kontratakować może tylko raz, przy pierwszym ataku."

Kalibracja morale:
> „Dla dziesięciokrotnej przewagi morale powinno spadać o 50%, a wszystkie inne stany
> proporcjonalnie."

Korekta kryterium przewagi:
> „To nie jest dobre rozwiązanie, gdy przeciwnik ma mało, ale bardzo silnych jednostek.
> W takim wypadku lepszy byłby mechanizm mocy, czyli porównanie siły jednej i drugiej
> armii. Jeśli moc drugiej armii jest znacząco większa, można byłoby zastosować
> współczynnik obniżenia morale."

## RECON (zweryfikowany odczytem kodu; POTWIERDŹ własnym odczytem)

**A. Kontratak dziś jest w KAŻDEJ rundzie każdego starcia.** `gra/src/game/combat.ts`,
pętla `resolveCombat` (`:788`): po ataku następuje blok „Defender counter-attacks
simultaneously" (`:1049-1064`) — bezwarunkowo, w każdej rundzie. `resolveCombat` jest
ściśle 1v1 i **nie zna pojęcia stosu**, więc dwudziesta jednostka atakująca w tej samej
turze obrywa kontratak dokładnie tak samo jak pierwsza. To jest arytmetyczna przyczyna
zgłoszonego objawu.

**B. Obrażenia liczone z bazowych statów, `hpDef` nie wchodzi do wzoru** (`:1015`, `:1053`).
**Właściciel JAWNIE ODRZUCIŁ naprawę tej przyczyny** („Nie chodzi o jednostki ranne.
Bitwa powinna wyglądać dokładnie tak, jak wygląda"). **Nie skaluj obrażeń od HP.**

**C. Model morale — `gra/src/battle/battleScene.ts`.** `MORALE_START = 100` (`:1010`),
`MORALE_HIT_LOSS_SCALE = 100` (`:1013`). Pole `morale` = bieżąca pula, `moraleMax` =
morale startowe używane do UŁAMKA ROUTOWANIA (`:1907-1908`), `fleeMorale` = próg ucieczki
(`:1914`). Morale strony liczone jako `suma bieżących / suma startowych` (`:8597-8599`).
Inicjalizacja: `morale: moraleBase, moraleMax: moraleBase` (`:4332`, także `:4179`, `:5074`).
Istniejące kary: flanka −8, tyły −15, otoczenie −10 (`:1026-1031`), nakładane w
`_applyMoraleDamage` (`:7790`).

**D. Moc armii JUŻ ISTNIEJE i nie trzeba jej wymyślać.** `sumRosterFieldM` /
`armyFieldPower` (`gra/src/game/auto-battle-power.ts:50-58`) — ta sama wielkość, na której
stoi auto-bitwa. Użycie jej tutaj daje JEDNĄ definicję przewagi dla obu systemów walki.
**Uwaga:** `armyFieldPower(u.def)` czyta definicję jednostki, więc nie widzi ani weterana,
ani bieżącego HP — patrz GOAL 2, gdzie jest to jawnie rozstrzygnięte.

## GOAL

Dwie zmiany, obie w bitwie taktycznej 3D. Rozwiązują dwa **rozłączne** problemy: pierwsza
sprawia, że przewaga **się opłaca**; druga sprawia, że słabsza strona **ucieka**.

### GOAL 1 — jeden kontratak na turę obrońcy

Obrońca oddaje kontratak **tylko pierwszemu atakującemu w danej turze**. Kolejni napastnicy
w tej samej turze zadają obrażenia, ale kontrataku nie otrzymują.

- **Który atakujący:** pierwszy w kolejności ataków w turze. Nie najsilniejszy, nie losowy.
  To rozstrzygnięcie właściciela — kolejność ataków ma być elementem taktyki gracza.
- **Bez wyjątków.** Jednostka ufortyfikowana ani broniąca miasta **nie** zachowuje kontrataku
  wobec każdego napastnika. Obrona murów ma się opłacać przez modyfikatory obrony, nie przez
  darmowe dodatkowe kontrataki. To również rozstrzygnięcie właściciela, jawne.
- Stan „obrońca już kontratakował w tej turze" **resetuje się na początku każdej tury**.
- Wewnątrz JEDNEGO starcia kontratak działa jak dziś (w każdej rundzie tego starcia) —
  zmiana dotyczy DRUGIEGO i kolejnych atakujących w tej samej turze, nie rund w środku
  pojedynczego pojedynku. **Nie przebudowuj `resolveCombat` na wielojednostkową.**

### GOAL 2 — startowa kara morale od stosunku MOCY

Na starcie bitwy słabsza strona dostaje jednorazowe obniżenie morale:

```
r = moc_strony_silniejszej / moc_strony_słabszej      (r ≤ 1 → brak kary)
spadek = min(65%, 50% × log₁₀(r))
```

Wartości do odtworzenia w bramce (baza morale 100):

| r | spadek | morale startowe |
|---|---|---|
| 1,5 | 8,8% | 91 |
| 2 | 15,1% | 85 |
| 3 | 23,9% | 76 |
| 5 | 34,9% | 65 |
| **10** | **50,0%** | **50** |
| 20 | 65,1% → sufit 65,0% | 35 |
| 100 | sufit 65,0% | 35 |

Pięć rozstrzygnięć, wszystkie wiążące:

1. **Kryterium to MOC, nie liczebność** (`sumRosterFieldM`) — 20 Wojowników nie ma
   onieśmielać Falangi.
2. **Moc ważona BIEŻĄCYM HP** — armia 20 jednostek pobitych do 10% HP nie ma liczyć się
   jak świeża. `armyFieldPower` czyta samą definicję, więc trzeba to zrobić jawnie.
3. **Liczone RAZ, na starcie bitwy.** Zakaz przeliczania co rundę — tworzyłoby spiralę
   śmierci (im więcej strat, tym gorszy stosunek, tym większa kara).
4. **Wyłącznie kara dla słabszego. Żadnej premii dla silniejszego** — premia wypychałaby
   morale ponad maksimum.
5. **Obniża `morale` (pulę bieżącą), a NIE `moraleMax` ani `fleeMorale`.** To jest sedno
   działania: jednostka startuje BLIŻEJ progu ucieczki, a ułamek morale strony
   (`suma bieżących / suma startowych`, `:8597-8599`) startuje poniżej 100%. Obniżenie
   `moraleMax` razem z `morale` **zniweczyłoby cały efekt** — ułamek wróciłby do 100%
   i strona nie routowałaby ani odrobinę szybciej. Istniejące kary (flanka −8, tyły −15,
   otoczenie −10) działają dalej, od obniżonego poziomu.

## OGRANICZENIA — WIĄŻĄCE, NIE PODLEGAJĄ PONOWNEJ OCENIE

- **Zakaz skalowania obrażeń od HP** — odrzucone przez właściciela wprost (recon B).
- **Zakaz dotykania auto-bitwy mapy** (`auto-battle-power.ts`, `auto-battle-params.json`) —
  to węzeł W1, osobny temat, dispatchowany równolegle. Czytać `sumRosterFieldM` wolno,
  modyfikować NIE. Wejście w te pliki = naruszenie allowlisty.
- **Morale od przewagi NIE trafia na mapę.** `RuntimeUnit` nie dostaje pola morale;
  `effectiveDefenderM` nie dostaje kary morale. Rozstrzygnięcie właściciela: „tylko bitwa
  ręczna 3D".
- **Węzeł W3 SKREŚLONY przez właściciela** — nie przenoś flanki, tyłów ani otoczenia do
  auto-bitwy; `attackerPosition` na mapie zostaje `'front'`. Nie jest to przeoczenie.

## KRYTERIA KOŃCA (binarne)

1. Nowa bramka `gra/tools/walka-jeden-kontratak-test.cjs`: w scenariuszu „N jednostek
   atakuje jednego obrońcę w jednej turze" liczba kontrataków obrońcy wynosi **dokładnie 1**
   dla N = 1, 2, 5 i 20. Osobna asercja: po przejściu do następnej tury licznik wraca do zera
   i obrońca znów może kontratakować raz.
2. Ta sama bramka zawiera asercję dla obrońcy **ufortyfikowanego i w mieście** — też
   dokładnie 1 kontratak, bez wyjątku.
3. Nowa bramka `gra/tools/walka-morale-przewaga-mocy-test.cjs`: dla stosunków mocy
   1,5 / 2 / 3 / 5 / 10 / 20 / 100 spadek morale zgadza się z tabelą z GOAL 2 (tolerancja
   ±0,2 p.p.), sufit 65% działa, `r ≤ 1` daje spadek 0.
4. Ta sama bramka ma **asercję na pułapkę z GOAL 2 punkt 5**: `moraleMax` i `fleeMorale`
   słabszej strony pozostają nietknięte, a ułamek morale strony na starcie jest **niższy
   niż 100%**. Bez tej asercji temat jest niezamknięty.
5. Ta sama bramka ma asercję na **ważenie HP**: dwie armie o identycznych definicjach
   jednostek, jedna pobita do 10% HP — stosunek mocy ma to odzwierciedlać.
6. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
7. Pięć bramek referencyjnych zielonych: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
   19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
8. Zielone także: `battle-roster-test.cjs`, `battle-summary-test.cjs`, `battle-hp-display-test.cjs`,
   `map-field-battle-test.cjs`, `teren-walki-etapy-test.cjs`, `army-hunger-combat-test.cjs`.
   Jeśli któraś miała zaszyte wartości sprzed zmiany — zaktualizuj i **wypisz w raporcie
   dokładnie które i dlaczego**.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz uznania tematu za zamknięty bez pokazania, że każda nowa bramka CZERWIENIEJE po
cofnięciu odpowiadającej jej zmiany w źródle.** Trzy przebiegi obowiązkowe, każdy z wynikiem
w raporcie: (a) bramki na czystej bazie — czerwone; (b) po pełnej zmianie — zielone;
(c) po cofnięciu SAMEJ linii utrzymującej `moraleMax` nietknięte — bramka z kryterium 4 ma
znów czerwienieć. Sam „zielony po zmianie" nie jest dowodem, że test cokolwiek mierzy.

**Drugi tryb do pilnowania: kontratak „naprawiony" w złym miejscu.** Łatwo jest wyłączyć
kontratak wewnątrz `resolveCombat` i dostać zieloną bramkę, która mierzy pojedynek zamiast
tury. Udowodnij w raporcie, że wewnątrz JEDNEGO starcia kontratak nadal działa w każdej
rundzie — inaczej naprawa poszła o poziom za nisko i zmienia bitwę zupełnie inaczej,
niż prosił właściciel.

## ALLOWLISTA

- `gra/src/game/combat.ts`
- `gra/src/battle/battleScene.ts`
- `gra/data/combat-params.json` — **tutaj**, i tylko tutaj, zakładasz parametry nowej kary
  morale: współczynnik `50%` i sufit `65%` jako dwa nazwane pola. To jest plik danych bitwy
  taktycznej. **Nie** wpisuj tych liczb do `auto-battle-params.json` (należy do węzła W1,
  poza allowlistą) ani jako magicznych wartości wprost w wyrażeniu w kodzie — mają być
  jedną liczbą do przestrojenia, wzorem pozostałych parametrów walki.
- `gra/tools/walka-jeden-kontratak-test.cjs` (NOWY)
- `gra/tools/walka-morale-przewaga-mocy-test.cjs` (NOWY)
- istniejące bramki z kryterium 8 — wyłącznie aktualizacja zaszytych wartości, jawnie uzasadniona
- `dyspozycje/autobot/runs/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/game/auto-battle-power.ts`, `gra/data/auto-battle-params.json`,
`gra/src/main.ts`, pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-walka-w2`, gałąź `autobot/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2`,
baza jawnie: **`origin/main`** na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA), brzmienie dosłowne z `playbook.md`: „Zakaz `npm run build`/`dev`
w `gra/` (export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir`". Jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; bramki `node gra/tools/*-test.cjs` nie są
zakazem objęte. `--outDir` musi wskazywać katalog POZA drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Przy decyzji produktowej zatrzymujesz się ze statusem `DECISION_REQUIRED`.
Raport maksymalnie ok. 400 słów, destylat.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja, `READY_FOR_DEPLOY` i deploy/push —
wyłącznie ręką orkiestratora.
