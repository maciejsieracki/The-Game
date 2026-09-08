# R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1 — Evaluator runda 1

**Metoda:** świeży `Read`/`grep -nE "ownerId\s*(===|!==)\s*0"` niezależnie na wszystkich
5 plików `game/*.ts` z listy dispatchu ORAZ `main.ts` (36530 linii, 276 trafień —
potwierdzone identycznie z raportem Operatora), świeży `git show`/`git log` dla
commitów `302ea837` i pokrewnych, świeży `grep -c "isHuman("`/`Read` wszystkich
call-site'ów, świeże sprawdzenie `dyspozycje/REJESTR-PROSB-I-ZADAN.md` dla wszystkich
tematów `R-HOTSEAT-ETAP*`. Worktree `/home/user/wt-hotseat-etap6c-recon`, ten sam
worktree co Operator, zero zmian w `gra/`.

## Wynik weryfikacji §1 (twierdzenie planu §A5) — POTWIERDZONE

Świeży grep per plik daje identyczne liczby i lokalizacje jak w raporcie Operatora:
`cities.ts` czysty (tylko komentarz `:427`); `turn-economy.ts` 7 fallbacków
(`1441,1975,2246,2356,2420,2544,2868`) + 1 realny wyjątek `sumEconomyForPlayerCities`
(`:1219`); `empire-food.ts` `:379,984` realne; `society-inputs.ts` `:88,93` realne;
`difficulty-cost.ts:45` znany/wykluczony. Dodatkowo zweryfikowałem, że fallback
`turn-economy.ts` faktycznie jest martwy w praktyce: `main.ts:29135` (`advanceCityEconomy`)
przekazuje `empireEpochForOwner` jako resolver — potwierdzone świeżym `Read`. Klaster A
(bank Skarbiec/Nauka, `main.ts:29570-29625`) i klastry C/D/E/F/G zweryfikowane linia po
linii — dokładna zgodność z cytowanym kodem. §1-§2(A-G), §5 (plan dowodu) — bez zarzutów.

## ZARZUTY

**1. [WYSOKA WAGA] Sprawdzenie nakładania z „Etapem 4" (dyspozycja p.5) jest niekompletne
— pominięty CAŁY zintegrowany temat, który już zmienił kod dokładnie wewnątrz własnego
Klastra D Operatora; kluczowa liczba użyta jako dowód jest błędna.**

Miejsce: `02. §4 „Etap 4"` raportu Operatora oraz `§0` (weryfikacja stanu bazowego).

Operator pisze: `grep -c "isHuman(" main.ts` = 10 (wyłącznie akcesory Etapu 3)" i na tej
podstawie stwierdza, że poza Etapem 3 main.ts nie ma innych migracji `isHuman`. Świeży
`grep -n "isHuman("  main.ts` (wykonany niezależnie) daje **13**, nie 10. Różnica to:
definicja samej funkcji (`main.ts:10382`) + **dwa call-site'y z osobnego, zintegrowanego
tematu `R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1`** (commit `e2c765ac`, potwierdzony
`ZINTEGROWANE` w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`): `main.ts:11141`
(`promptMergeIfCoLocated`, guard łączenia jednostek) i **`main.ts:29237`** — DOKŁADNIE
wewnątrz pętli, którą Operator sam opisuje jako „Klaster D — Auto-racje/auto-podnoszenie
Wyżywienia" (`main.ts:29226-29251`): `if (isHuman(ownerId)) { pendingAutoRationForNextTurn
= autoRationResult; }`. Rejestr opisuje to wprost: „`main.ts:28907` `ownerId === 0` →
`isHuman(ownerId)` wewnątrz pętli auto-racjonowania, `pendingAutoRationForNextTurn`".

§4 Operatora omawia „Etap 4" wyłącznie jako strukturalne rozcięcie
(`runWorldEndTurn`/`endActiveHumanTurn`/`advanceSeat` już wydzielone) i stwierdza „żadnej
kolizji z samym rozcięciem" — pomijając całkowicie ten odrębny, zintegrowany podetap
przygotowawczy, mimo że dispatch p.5 wprost wymaga sprawdzenia nakładania z „Etapem
3/4/6a/6b" i mimo że rejestr (jedyne wiarygodne źródło stanu wg CLAUDE.md/README) ma ten
temat jawnie wpisany jako zamknięty dzień przed dispatchem tej rundy. Dlaczego ma
znaczenie: to dokładnie rodzaj przeoczenia, przed którym ostrzegał dispatch (p. „ryzyko
WYŻSZE niż przy 6a/6b") — Klaster D Operatora opisuje 4 literały do podmiany, nie
wspominając, że sąsiedni guard w TEJ SAMEJ pętli już przeszedł migrację; przyszła runda
implementacji ryzykuje albo powielenie już wykonanej pracy, albo (gorzej) wprowadzenie
niespójnego wzorca obok już poprawnego `isHuman(ownerId)` w identycznym kontekście.

**2. [WYSOKA WAGA] Inwentaryzacja main.ts jest niekompletna — co najmniej 3 dodatkowe
realne literały `ownerId===0` w kategorii (c) (era/zbadane technologie) nigdzie
niewymienione ani jawnie wykluczone.**

Świeżym `Read`/`grep` (`aiResearchDone.get(ownerId)` i pokrewne) znalazłem:

- `main.ts:3466` `unlockedTechSetForOwner(ownerId)`: `if (ownerId === 0) return
  player.zbadane; return aiResearchDone.get(ownerId) ?? new Set();` — **TRZECIA**, nie
  druga, niezależna kopia logiki „unlocked techs for owner" opisanej w Klastrze B
  Operatora (który znalazł tylko `main.ts:7717-7719` i `:30259-30261`, nazywając je „dwie
  NIEZALEŻNE kopie"). Co gorsza: to WŁAŚNIE ta funkcja jest przekazywana jako
  `resolveOwnerTech` w wywołaniu `advanceCityEconomy` (`main.ts:29135-29159`, świeżo
  zweryfikowane) — funkcja, na której Operator opiera dowód, że main.ts „zawsze przekazuje
  resolver" do `turn-economy.ts` (czyniąc tamten fallback martwym kodem w praktyce), a mimo
  to sam ten resolver nie trafił do inwentaryzacji Klastra B ani do żadnego innego klastra.
- `main.ts:1988` `syncOwnerEraFromResearch(ownerId)`: `if (ownerId === 0) return false;`
  — literał w funkcji synchronizującej epokę per-owner (kategoria „era" z dyspozycji p.2),
  wołanej z 6 miejsc w main.ts (`:2046,2118,3664,4071,9352,26580,36081`).
- `main.ts:2170` `countTechForOwner(ownerId)`: `if (ownerId === 0) return
  player.zbadane.size;` — literał w funkcji liczącej zbadane technologie per-owner
  (kategoria „zbadane technologie" z dyspozycji p.2), wołanej z `:2293,2348`.

Żadne z tych trzech miejsc nie występuje w dokumencie Operatora (potwierdzone grepem po
`01-operator-runda1-analiza.md`), ani nie jest jawnie wykluczone jako poza zakresem
(w przeciwieństwie do rebelii czy akcesorów nazw/kolorów w Klastrze H, które SĄ jawnie
opisane i wykluczone z uzasadnieniem). Dlaczego ma znaczenie: podważa zarówno kryterium
binarne rundy („kompletna świeżo zweryfikowana lista miejsc"), jak i rozliczenie z „~50"
w §3 — suma 29 jest zaniżona o co najmniej te 3 pozycje (a metoda, która przeoczyła
funkcje z dokładnie tych samych plików i tego samego wzorca `aiResearchDone.get(ownerId)
?? new Set()` już analizowanego w Klastrze B, budzi wątpliwość czy 276 trafień main.ts
zostało rzeczywiście wyczerpująco zmapowane, a nie tylko te leżące wewnątrz
`runWorldEndTurn()`).

## Uwaga poza zarzutami (nie liczy się do werdyktu)

Klaster H (rebelia, `main.ts:30169`) jest zgłoszony jawnie jako niejednoznaczny — to
poprawna praktyka (zgodnie z regułą przeciw samooszukiwaniu), nie zarzut.

---

STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1
GOAL: Recon-only (zero kodu) dla podetapu 6c (ekonomia) planu hot-seat
TESTY: Świeży `grep -nE "ownerId\s*(===|!==)\s*0"` per plik (5× `game/*.ts` + `main.ts`,
276 trafień main.ts potwierdzone identyczne), świeży `grep -n "isHuman("` main.ts (13, nie
10), świeży `git show 302ea837`/`git log --oneline --all | grep -i hotseat`, świeży odczyt
`dyspozycje/REJESTR-PROSB-I-ZADAN.md`, świeży `Read` wszystkich cytowanych klastrów A-H i
call-site'ów `advanceCityEconomy`/`previewCityEconomy`. Zero kompilacji potrzebne (zero
zmian kodu).
BLOKADY: brak nowych — 1 pozycja odziedziczona z raportu Operatora (rebelia,
`main.ts:30169`), jawnie zgłoszona przez Operatora, nie stanowi zarzutu.
RUNDY: 1/5
ZARZUTY:
1. Sprawdzenie nakładania z Etapem 4 niekompletne — pominięty zintegrowany temat
   `R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1` (`e2c765ac`), który już zmigrował
   `main.ts:29237` (wewnątrz własnego Klastra D Operatora) na `isHuman`; liczba
   `grep -c "isHuman(" main.ts = 10` użyta jako dowód jest błędna (rzeczywiście 13).
2. Inwentaryzacja main.ts niekompletna — pominięte `main.ts:3466`
   (`unlockedTechSetForOwner`, trzecia kopia logiki Klastra B, i to WŁAŚNIE ta przekazywana
   jako resolver do `advanceCityEconomy`), `main.ts:1988` (`syncOwnerEraFromResearch`),
   `main.ts:2170` (`countTechForOwner`) — 3 realne literały kategorii (c) nigdzie
   niewymienione ani wykluczone, zaniżające sumę „29" w §3.
NASTĘPNY KROK: Obrona runda 1 (ta sama gałąź, ten sam worktree) — R-PROC-AUTOBOT.md §3c,
niepusta lista zarzutów wymaga rundy Obrony przed kolejnym Evaluatorem.
DEPLOY/PUSH: NIE WYKONANO
