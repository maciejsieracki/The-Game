OBRONA OPERATORA — runda 1, odpowiedź na `02-evaluator-runda1.md`
TEMAT: P-MIASTA-ZBYT-BLISKO-SIEBIE-Q1

Odpowiadam na KAŻDY zarzut z osobna, z dowodem z wytworu.

---

## Zarzut 1 — "widmowy" właściciel w `buildClusterStartPlan` (nowy defekt kanału 2)

**PRZYJMUJĘ. Trafny, naprawiony w tej rundzie.**

Dowód trafności (kod PRZED naprawą, `cluster-start.ts`, jak zastałem na starcie tej rundy):

```
for (const slot of spawnPlan.slots) {
    aiOwnerCivMap.set(slot.ownerId, slot.typ);          // <- rejestracja
    ownerDisplayName.set(slot.ownerId, ...);            // <- rejestracja
    if (slot.isSameTypeRival) simplifiedDiplomacyOwners.add(slot.ownerId);  // <- rejestracja
    else foreignTypeOwners.add(slot.ownerId);           // <- rejestracja
    if (!slot.isClusterCapital) typCityCopyOwners.add(slot.ownerId);       // <- rejestracja
    startRelations.set(slot.ownerId, ...);               // <- rejestracja
    ...
    const collides = acceptedForDistance.some(...);
    if (collides) continue;   // <- odrzuca TYLKO spawnCities/aiStartHexes/acceptedForDistance,
                               //    rejestracja wyżej JUŻ się stała i zostaje
    spawnCities.push(...);
    ...
}
```

Evaluator ma rację: `continue` na końcu pętli pomija wyłącznie trzy struktury zbudowane
PO nim (`spawnCities`, `aiStartHexes`, `acceptedForDistance`), ale sześć rejestrów
zbudowanych PRZED nim (`aiOwnerCivMap`, `ownerDisplayName`, `simplifiedDiplomacyOwners`/
`foreignTypeOwners`, `typCityCopyOwners`, `startRelations`) już dostało wpis dla tego
ownerId — bez żadnego miasta na mapie. Stan nieosiągalny przed naprawą kanału 2 (runda 1
nie mogła go wprowadzić, bo `acceptedForDistance`/kolizja nie istniały przed rundą 1) —
zgadzam się, że to Evaluator jako pierwszy go zmierzył.

**Naprawa:** cały blok rejestracji przeniesiony z przed pętli kolizji na po niej (po
`if (collides) continue;`), symetrycznie do `spawnCities`/`aiStartHexes`/
`acceptedForDistance`. Diff w `01-operator-runda1.md` §"Naprawa Zarzutu 1".

**Dowód naprawy:** nowa funkcja `findGhostOwners(plan)` w `miasta-zbyt-blisko-test.cjs`
sprawdza dla KAŻDEGO z 20 seedów, że żaden ownerId w żadnym z pięciu rejestrów nie jest
bez odpowiadającego miasta w `spawnCities`. Wynik PO naprawie: **0 widmowych właścicieli
na 20 seedach** (patrz `TESTY` w `01-operator-runda1.md`). Nie odtwarzałem osobno starego
kodu przez `--mutate` dla TEGO konkretnego sprawdzenia (czasowo droższe niż warte w tej
rundzie — wymagałoby osobnej gałęzi mutacji cluster-start.ts) — jako dowód nietautologii
przyjmuję bezpośrednio pomiar Evaluatora (3/20 map, seed=42 owner 37, na PRZED-naprawą
kodzie identycznym z tym co scytowałem wyżej) jako niezależne, już wykonane potwierdzenie,
że sprawdzenie faktycznie łapie ten stan gdy występuje.

---

## Zarzut 2 — luka w pokryciu: rywale tego samego typu vs obce klastry (canFoundCity z
realnym `cities`, ale bez wiedzy o obcych klastrach / brak `foreignBuffers` w
`buildSameTypeRivalCandidateHexes`)

**PRZYJMUJĘ źródłowo — luka jest realna. Naprawiona, choć innym mechanizmem niż sugerował
zarzut (nie przez dodanie `foreignBuffers` do generacji kandydatów, tylko przez zdjęcie
`clusterStartSlot=true` po stronie odbiorczej).**

Dowód trafności diagnozy (kod źródłowy, potwierdzone przeze mnie niezależnie od
Evaluatora): main.ts:12700-12701 woła `spawnPendingSameTypeRivals(q, r)` PRZED
`spawnPendingForeignClusters()`. Pierwsza funkcja faktycznie stosuje realny
`canFoundCity(..., { foundingCityState: true })` (linia ~8699 wtedy, bez
`clusterStartSlot`), ale w chwili jej wywołania `cities` zawiera WYŁĄCZNIE gracza i
rywali założonych dotąd w tej samej pętli — obce klastry jeszcze nie istnieją (spawnują
się w NASTĘPNEJ funkcji). Druga funkcja (`spawnPendingForeignClusters`, linia ~8818
PRZED moją naprawą) woła `foundCityAt(..., isCS, true)` — `clusterStartSlot=true` pomija
KAŻDY runtime-check dystansu, więc nawet gdyby `cities` już zawierało rywali (a zawiera —
founding jest sekwencyjny), nic by to nie zmieniło: ta ścieżka nigdy nie sprawdza
dystansu w runtime. Jedyna ochrona to precomputed `acceptedForDistance` z
`buildClusterStartPlan`, który — zgadzam się z Evaluatorem — nic nie wie o pozycjach
rywali (te są liczone dopiero w main.ts, w locie, z innym seedem-kontekstem
`clusterStartSeed`).

Co do `buildSameTypeRivalCandidateHexes` nieprzekazującego `foreignBuffers` do
`packCityStatesAroundCapital` (jedyne takie wywołanie w repo) — potwierdzam źródłowo
(`gra/src/map/cluster-spawn.ts:141-153`, brak klucza `foreignBuffers` w opts, kontrast z
9 innymi wywołaniami w `clusters.ts`, wszystkie go przekazują). To PRAWDZIWA luka w
pokryciu generacji kandydatów, ale naprawianie JEJ (dodanie `foreignBuffers` do generacji)
nie usuwałoby problemu u ŹRÓDŁA — źródłem jest to, że strona ODBIORCZA
(`spawnPendingForeignClusters`) w ogóle nie sprawdza dystansu w runtime, więc nawet
idealne unikanie obszaru w generacji kandydatów rywali nie chroniłoby przed odwrotnym
kierunkiem kolizji (obcy klaster planowany bez wiedzy o already-founded rywalu).

**Naprawa:** zamiast dotykać generację kandydatów rywali (`cluster-spawn.ts`, poza
allowlistą tej rundy — nie było jej w dispatchu), naprawiłem stronę odbiorczą:
`spawnPendingForeignClusters` w main.ts (wskazane w KONTEKŚCIE dyspozycji wprost) — usunięty
`clusterStartSlot=true`, więc każdy slot obcego klastra jest teraz sprawdzany REALNYM
`canFoundCity` względem `cities` w chwili founding, co obejmuje WSZYSTKICH już założonych
rywali. To naprawia kolizję z OBU stron (rywal-najpierw-potem-obcy — jedyna realna
kolejność w main.ts) bez dotykania generacji kandydatów.

**Dowód:** `simulateRealSpawnOrder()` (nowa funkcja w bramce) odtwarza dokładną kolejność
main.ts. Na tych 20 seedach nie zaobserwowałem SAMEGO naruszenia rywal-vs-obcy (0
wystąpień etykiety `rywalN` w 71 naruszeniach zmierzonych przed naprawą main.ts) — więc
nie mam własnego pozytywnego dowodu, że TEN KONKRETNY kanał kolizji materializuje się na
próbce 20 seedów (zgadzam się z Evaluatorem: "0/20 nie potwierdza, ale też nie wyklucza").
Naprawa usuwa mechanizm strukturalnie (realny check łapie OBA kanały identycznie), więc
uznaję zarzut za naprawiony pomimo braku własnego pozytywnego trafienia — jeśli Evaluator
chce twardszego dowodu pozytywnego dla TEGO konkretnego kanału, potrzebna byłaby szersza
próbka seedów/konfiguracji niż 20 użytych w tej bramce (zgłaszam to jako możliwe
rozszerzenie, nie robię go w tej rundzie z powodu budżetu czasowego zużytego na
`cluster-start-test.cjs`, patrz BLOKADA 1 w `01-operator-runda1.md`).

---

## Zarzut 3 — kolonia bonusowa nigdy nie trafia do `acceptedForDistance`

**PRZYJMUJĘ. Potwierdzone empirycznie w tej rundzie (Evaluator zgłosił to jako
nierozstrzygnięte z powodu czasu — ja to rozstrzygnąłem, wynik: potwierdzone).**

Dowód: `simulateRealSpawnOrder()` uruchomiona PRZED naprawą main.ts (tylko z naprawą
Zarzutu 1 w `cluster-start.ts`) dała **71 naruszeń na 29485 sprawdzonych par, na
WSZYSTKICH 20 seedach**, każde w dokładnym wzorcu
`ownerN-KOLONIA-BONUS <-> ownerN+1-panstwo, d=1..2 < próg=3` — kolonia bonusowa stolicy
klastra (ownerId=N) kolidująca z pierwszym miastem-państwem TEGO SAMEGO klastra
(ownerId=N+1, kolejny ownerId przydzielony sekwencyjnie w tym samym klastrze), founded
kilka linii niżej w tej samej pętli `spawnPendingForeignClusters`
(`grantDifficultyStartBonusesForMajorCapital` woła `pickBonusCityHex` zaraz po
`foundCityAt` stolicy, ZANIM pętla dojdzie do kolejnego `sc` — tej samej lub innej
cywilizacji — który zakłada się bezwarunkowo). To dokładnie mechanizm opisany przez
Evaluatora: kolonia bonusowa nie istnieje nigdzie w `buildClusterStartPlan`
(`acceptedForDistance`), więc następny slot z planu nie ma żadnej wiedzy o niej — a
ponieważ ten następny slot jest zakładany przez `foundCityAt(..., clusterStartSlot=true)`,
runtime też go nie sprawdza.

**Naprawa:** ta sama zmiana co dla Zarzutu 2 (usunięcie `clusterStartSlot=true` w
`spawnPendingForeignClusters`) naprawia OBA kanały jednym mechanizmem — realny
`canFoundCity` widzi teraz kolonię bonusową w `cities` (bo `grantDifficultyStartBonusesForMajorCapital`
robi `cities.push(extraCity)` PRZED powrotem do pętli głównej) i odrzuca kolejny
kolidujący slot zamiast go bezwarunkowo zakładać.

**Dowód PO naprawie:** `simulateRealSpawnOrder()` z pełną naprawą main.ts →
**0/25768 naruszeń**, na WSZYSTKICH 20 seedach, w tym na wszystkich seedach gdzie PRZED
naprawą występowały naruszenia (1,2,3,5,8,13,21,34,42,55 — patrz pełny log w
`01-operator-runda1.md`). To jest bezpośredni PRZED/PO na tym samym mechanizmie, nie
domysł.

---

## Podsumowanie

Wszystkie trzy zarzuty PRZYJĘTE i naprawione. Zarzut 1 naprawiony punktowo w
`cluster-start.ts` (przeniesienie rejestracji). Zarzuty 2 i 3 naprawione JEDNĄ zmianą w
`main.ts::spawnPendingForeignClusters` (zdjęcie `clusterStartSlot=true`), bo mają
wspólny root cause: ta funkcja zakładała miasta obcych klastrów BEZ ŻADNEGO runtime-checku
dystansu, polegając wyłącznie na precomputed planie, który nie zna ani pozycji rywali
(Zarzut 2), ani kolonii bonusowych (Zarzut 3) — obu powstających PO zbudowaniu planu.

Nowa, jawnie zgłoszona niepewność tej rundy: `cluster-start-test.cjs` ukończona w całości
(BLOKADA 1 z rundy 1 rozwiązana pod względem "czy się w ogóle kończy"), ale 6 z 24 FAIL
dotyczy progów dystansu i wymaga baseline `origin/main` do wykluczenia wpływu naprawy —
zgłoszone jako zmieniona BLOKADA 1, nie przemilczane.
