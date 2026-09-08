# R-HOTSEAT-ETAP6C-ECONOMY-Q1 — Evaluator runda 1

**Metoda:** świeży `Read`/`git show 54ecf725` na całym diffie `main.ts`+`game/*.ts`,
niezależny `grep` wszystkich 32 pozycji z recon (`01-operator-runda1-analiza.md`),
niezależne uruchomienie `tsc --noEmit` i wszystkich 6 bramek (`hotseat-etap6c-economy-
noop-test.cjs` + 5 referencyjnych) w worktree `/home/user/wt-hotseat-etap6c-economy`,
niezależna weryfikacja pre-istniejącego FAIL `ai-praca-split-parity` przez chwilowy
`git checkout 302b6a96 -- gra/src gra/tools` → uruchomienie → `git checkout HEAD --
gra/src gra/tools` (przywrócone, `git status` czysty po). Sprawdzenie nakładania z
`autobot/R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1` (`7dcb3c21`) i `autobot/R-HOTSEAT-ETAP6F-
START-MIGRACJA-Q1` (`0a1b6b7e`) przez `git show --stat`+`grep "^@@"` na obu.

## Potwierdzone bez zarzutu

- Wszystkie 32 pozycje z recon zlokalizowane i zmigrowane na `isHuman`/`humanOwnerIds`
  (Klastry A-G main.ts + 5 `game/*.ts`), nie `isMe`. Klaster B (5/5 duplikatów technologii,
  w tym `unlockedTechSetForOwner:3466` na krytycznej ścieżce `advanceCityEconomy`) —
  zweryfikowane osobno, poprawne.
- Blok bankowania `runWorldEndTurn()` (Klaster A): świeży `Read` potwierdza pętlę
  `for (const hOid of humanSeats.humanOwnerIds)` zapisującą wprost do
  `playerStateByHuman.get(hOid)` (skarbiec/nauka/utrzymanie/surowce), symetrycznie z
  gałęzią AI, bez floor — logicznie poprawne dla N foteli, nie tylko kompiluje się.
  `researchGateForOwner(humanOwnerId)` jawnie i zasadnie odłożone (auto-research nadal
  jednoosobowy przez singularny `player`) — ujawnione, nie przemilczane.
- Decyzja `isPlayerOwner` (sygnatura zmigrowana, call-site'y `production.ts`/`cityPanel.ts`
  świadomie NIE przełączone) — uzasadniona (promień rażenia balansu), zgodna z opcją
  dopuszczoną przez dispatch, jawnie zgłoszona jako blokada.
- Decyzja rebelia `main.ts:30252` → `isHuman(city.ownerId)`: niezależny `grep
  markCityRebellionStarted` potwierdza JEDYNE wystąpienie, wyłącznie dla frakcji
  gracza — migracja zachowuje granicę „tylko człowiek", uzasadnienie trafne.
- `tsc --noEmit`: 0 błędów (niezależne uruchomienie).
- 5 bramek referencyjnych: `difficulty-cost` 22/22, `wealth` 36/36, `ai-major-economy`
  33/33, `ai-praca-podzial-tura1-seed` 9/9, `hotseat-etap3-akcesory` 64/64 — wszystkie
  zielone (niezależne uruchomienie). `ai-praca-split-parity`: 1 FAIL potwierdzony
  niezależnie jako identyczny na bazie `302b6a96` — pre-istniejący, nie regres.
- Brak nakładania linii z `R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1` (2435-2506, 10384-10400)
  ani `R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1` (7554) — żaden z 32 punktów tej rundy nie
  leży w tych zakresach.

## ZARZUTY

**1. [WYSOKA WAGA] Klaster F (auto-ulepszenia terenu, `main.ts:~30699`) — zmigrowany
tylko filtr, reszta bloku pozostaje twardo `ownerId 0`; drugi fotel człowieka zostaje
wciągnięty do puli/budżetu/pickera pierwszego, zamiast być (jak dziś) czysto wykluczony.**

Miejsce: `main.ts:30699-30836`. Zmigrowano wyłącznie `if (c.ownerId !== 0) return false`
→ `if (!isHuman(c.ownerId)) return false` (filtr `autoImpCities`). Ale ~15 dalszych
odwołań w TYM SAMYM bloku pozostały zaszyte na `0`: `ownerId: 0` przekazywane do
`pickAutoImprovements`, `civTypeForOwner(0)`, `unlockedTechSetForOwner(0)`,
`resourceDeficitKeysForOwner(0)`, `isTerritoryHexOwnedBy(pick.q, pick.r, 0, …)`,
`freshClearingState(pick.key, 0)`, `registerFortNodeIfNeeded(pick.key, …, 0)`, oraz
budżet/pula `playerPracaPool` (zmienna singularna, nie per-owner). Przy dwóch fotelach
człowieka (`humanOwnerIds=[0,1]`) miasta fotela 1 z `tryb==='auto'` PRZEJDĄ nowy filtr
i trafią do `cities: autoImpCities` przekazanego do `pickAutoImprovements` RAZEM z
miastami fotela 0 — pod archetypem cywilizacji, technologiami, deficytem surowców i
budżetem Pracy fotela 0. Efekt: zafałszowany input pickera (worked-hex/resource
aggregation miesza dwóch różnych właścicieli) i zużycie `playerPracaPool` fotela 0 na
podstawie danych cudzych miast; sam zapis ulepszenia zostanie później odrzucony przez
`isTerritoryHexOwnedBy(...,0,...)` (terytorium fotela 1 ≠ terytorium 0) — więc miasta
fotela 1 nigdy nie dostaną realnego auto-ulepszenia, ale ich obecność w zbiorze wejściowym
zniekształca wynik dla fotela 0. Przed tą rundą taki literał `ownerId !== 0` czysto
wykluczał cudze miasta z całego bloku — to był stan BEZPIECZNIEJSZY niż powstały tu stan
pośredni. Dziś (`humanOwnerIds=[0]` zawsze) efekt jest no-op, ale to dokładnie ten sam
rodzaj błędu, przed którym dispatch ostrzegał explicite dla Klastra A („REGUŁA PRZECIW
SAMOOSZUKIWANIU" — mechaniczna podmiana literału bez zrozumienia całego bloku jako
spójnej jednostki zapisu/odczytu) — tu ostrzeżenie nie zostało zastosowane do Klastra F.
Nowa bramka tego nie łapie: `B3` testuje WYŁĄCZNIE izolowany boolean `!isHuman(id)` vs
`id!==0`, nie cały blok.

**2. [ŚREDNIA WAGA] Dispatch (pkt 7) wymagał bramki Chromium dla Klastra F (DOM-bound)
i Klastra G (HUD-bound), zgodnie z planem recon §5/§6 — dostarczona bramka jest w 100%
headless Node, żadnego komponentu Chromium/Playwright dla tej rundy.**

`hotseat-etap6c-economy-noop-test.cjs` składa się wyłącznie z Części A (import realny
przez esbuild) i Części B (PRZED/PO w Node, reimplementacja logiki, nie realny main.ts).
Wzmianka w raporcie Operatora o testach Chromium („hotseat-etap4/6a/6b-noop-test... nie
zakończyły się w oknie tej rundy") dotyczy PRE-ISTNIEJĄCYCH bramek regresyjnych innych
etapów, nie nowego testu Klastra F/G tej rundy — to nie jest substytut wymaganej przez
dispatch weryfikacji w przeglądarce dla auto-ulepszeń/write-site'ów cache tej rundy.
Konsekwencja praktyczna: błąd z zarzutu 1 (DOM-bound, wymagałby realnego drugiego fotela
i przeglądarki, by ujawnić się w renderowanym HUD/panelu ulepszeń) nie mógł zostać
wykryty żadną z dostarczonych bramek.

**3. [NISKA WAGA] Asercja `A6` bramki (pokrywająca `game/empire-food.ts:984`,
`requireFlowBalance`) jest tautologiczna — nie wywołuje faktycznie zmigrowanej funkcji.**

`hotseat-etap6c-economy-noop-test.cjs:155-161`: jedyna asercja to
`assertTrue(typeof maxSafePoziomRacjiForCity === 'function', …)` — sama funkcja nigdy nie
jest wywołana z różnymi `humanOwnerIds`, więc zmiana `ownerId === 0` →
`humanOwnerIds.includes(ownerId)` (jedna z 32 pozycji tej rundy) nie ma w bramce żadnego
realnego pokrycia behawioralnego, mimo że wlicza się do zbiorczego wyniku „68 PASS".
Sam kod zmiany (świeży `Read`, `empire-food.ts:958-165`) wygląda poprawnie — to zarzut do
bramki dowodu, nie do samej migracji.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6C-ECONOMY-Q1
GOAL: migracja 32 miejsc kategorii „ekonomia" na `isHuman(ownerId)`, blok bankowania
`runWorldEndTurn()`, decyzje `isPlayerOwner`/rebelia.
TESTY: `tsc --noEmit` czysty (niezależnie). Nowa bramka 68/68 PASS (niezależnie), ale
zarzut 3 (A6 tautologiczna) i zarzut 2 (brak komponentu Chromium wymaganego dispatchem).
5 referencyjnych zielone niezależnie (difficulty-cost 22/22, wealth 36/36,
ai-major-economy 33/33, ai-praca-podzial 9/9, etap3-akcesory 64/64).
`ai-praca-split-parity` 1 FAIL potwierdzony niezależnie jako pre-istniejący (302b6a96),
nie regres. Chromium-owe bramki referencyjne (etap4/6a/6b) nieuruchomione w tej rundzie
Evaluatora — poza budżetem czasu, nie krytyczne dla tego zarzutu.
BLOKADY: (1) `isPlayerOwner` call-site'y odłożone (uzasadnione, jawne). (2) auto-research/
toasty epoki jednoosobowe (jawne). (3) Zarzut 1 niżej (Klaster F, wysoka waga).
RUNDY: 1/5
ZARZUTY:
1. [WYSOKA WAGA] Klaster F zmigrowany tylko we wstępnym filtrze — reszta bloku auto-
   ulepszeń nadal zaszyta na ownerId 0, co przy realnym drugim fotelu miesza dane obu
   właścicieli w jednym wywołaniu `pickAutoImprovements` (main.ts:30699-30836).
2. [ŚREDNIA WAGA] Brak wymaganego dispatchem komponentu Chromium w nowej bramce dla
   Klastra F (DOM-bound) i Klastra G (HUD-bound) — dostarczono wyłącznie headless Node.
3. [NISKA WAGA] Asercja A6 nowej bramki (`maxSafePoziomRacjiForCity`,
   `empire-food.ts:984`) jest tautologiczna — nie wywołuje funkcji, brak realnego
   pokrycia tej pozycji z 32.
NASTĘPNY KROK: Obrona (runda 2, ten sam ID/gałąź) — adresuj zarzut 1 (dokończ Klaster F
pętlą po `humanOwnerIds` albo jawnie udokumentuj i zawężenie ryzyka), zarzut 2 (dopisz
komponent Chromium dla Klastra F/G albo jawnie uzasadnij dlaczego nie jest konieczny w
tej rundzie) i zarzut 3 (realna asercja A6 albo usunięcie fałszywego wrażenia pokrycia).
DEPLOY/PUSH: NIE WYKONANO
