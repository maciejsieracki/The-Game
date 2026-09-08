# R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1 — Operator runda 1 — inwentaryzacja kategorii „ekonomia"

**Metoda:** świeży `Read`/`grep -nE "ownerId\s*(===|!==)\s*0"` na `game/turn-economy.ts`,
`game/empire-food.ts`, `game/society-inputs.ts`, `game/cities.ts`, `game/difficulty-cost.ts`
(dla każdego z 5 plików osobno, per punkt 1 dispatchu) oraz na `main.ts` (36 530 linii dziś),
worktree `/home/user/wt-hotseat-etap6c-recon`, gałąź `autobot/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1`,
baza `9c7580f1`. 276 trafień `ownerId===0`/`!==0` w `main.ts` (identyczne z liczbą 6b — baza
niemal nie ruszyła się między recon 6b i 6c). Każde trafienie main.ts zmapowane skryptem
(bisect po `function`/`async function`) na najbliższą poprzedzającą deklarację, dodatkowo
`grep -n ".get(0)"/".set(0,"/"(cities, 0"` w blokach bankowania ekonomii, bo literał właściciela
nie zawsze ma postać `ownerId===0` (patrz §2.A). Zero zmian w `gra/src`/`gra/tools`.

## 0. Stan bazowy — korekta przesłanek dispatchu (świeżo zweryfikowane)

- **Etap 4 (rozcięcie `triggerPlayerEndTurn`) JEST zintegrowany** — `runWorldEndTurn()`
  (`main.ts:28957`), `endActiveHumanTurn()` (`main.ts:33313`), `advanceSeat()` (`main.ts:33488`)
  istnieją jako osobne funkcje. Dispatch ostrzegał trafnie: „economy tick jest fizycznie WEWNĄTRZ
  `runWorldEndTurn()`" — potwierdzone, 31 z 276 trafień `main.ts` leży w tej jednej funkcji
  (28957-33313, ~4356 linii — wciąż monolit, tylko już nie pod starą nazwą).
- **Etap 3 (`302ea837`) zmigrował DOKŁADNIE 10 funkcji-akcesorów** (nie 8 jak liczy commit
  message w skrócie — policzone `git show 302ea837 -- main.ts` linia po linii): `empireEpochForOwner`,
  `initOwnerEra`, `ownerTreasury`, `setOwnerTreasury`, `ownerPracaPool`, `setOwnerPracaPool`,
  `ownerNaukaPool`, `setOwnerNaukaPool`, `ownerResearchedTechs`, `addOwnerResearchedTechs` — wszystkie
  jawnie WYKLUCZONE z inwentaryzacji niżej. `isPlayerOwner` (`difficulty-cost.ts:45`) świadomie
  NIETKNIĘTY przez Etap 3 (decyzja produktowa, potwierdzona przez ówczesny Final Control) —
  też wykluczony, nie zgłaszam go jako nowe odkrycie.
- Etap 6a (input, zintegrowany dokument, implementacja w równoległym worktree) i Etap 6b (UI,
  78 miejsc, zintegrowany dokument) NIE dotykają kodu — `grep -c "function isMe" main.ts` = 0.
  **KOREKTA PO OBRONIE (Evaluator zarzut 1): `grep -c "isHuman(" main.ts` = 13, NIE 10** —
  pierwotna liczba pomijała trzeci, osobny zintegrowany temat `R-HOTSEAT-ETAP4PREP-DEFERRED-
  OWNER-GUARDS-Q1` (commit `e2c765ac`, `ZINTEGROWANE`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
  linia ok. 95/4820), który zmigrował DWA guardy `ownerId===0→isHuman(ownerId)`:
  `promptMergeIfCoLocated` (`main.ts:11141`) i `pendingAutoRationForNextTurn` (**dziś
  `main.ts:29237`**, przesunięte od `28907` w commicie — baza ruszyła się mimo identycznej
  liczby `276` trafień `ownerId===0`, bo ten konkretny literał już nie istnieje w tej formie,
  zastąpiony przez `isHuman`). 10 = akcesory Etapu 3, +1 definicja funkcji (`main.ts:10382`,
  policzona omyłkowo w pierwotnym grepie jako "akcesor"), +2 call-site'y Etapu 4prep = 13.
  Trzecie odroczone miejsce Etapu 4prep (`deferredPlayerUnitRevealIds`, `main.ts:30095`)
  świadomie NIE zmigrowane (Final Control 4prep: inny wzorzec naprawy) — nadal literał `0`,
  nie liczę go jako nowe odkrycie tej rundy (poza zakresem kategorii ekonomia zresztą — to
  input/reveal, nie skarbiec/Praca/Nauka). **Traktuję 6a/6b jako nienaruszone kodowo, ale
  Etap 4prep JEST osobnym, integrowanym tematem dotykającym literalnie Klastra D niżej —
  patrz §4 dla pełnego rozliczenia.**

## 1. Weryfikacja twierdzenia planu §A5 („rdzeń już per-owner") — per plik

**WERDYKT: PLAN CZĘŚCIOWO OBALONY.** Twierdzenie prawdziwe dla `cities.ts` i w większości
dla `turn-economy.ts` (wzorzec callback/resolver), ale **fałszywe dla `empire-food.ts` i
`society-inputs.ts`** — obie mają realne literały `0` wewnątrz logiki, nie tylko fallbacki.
Najważniejsze: **rdzeń bankowania Skarbca/Nauki/utrzymania w `main.ts` (poza plikami `game/`
wymienionymi w planie) wcale nie jest generyczną pętlą po ownerach — jest DUPLIKATEM dwóch
odrębnych ścieżek kodu, jednej zahardkodowanej na gracza, drugiej generycznej dla AI** (§2.A).

| Plik | Werdykt | Dowód |
|---|---|---|
| `game/cities.ts` | **CZYSTY** — plan trafny | `grep` daje 0 realnych trafień, tylko komentarz `:427`. Funkcja `isPlayerCapitalCity` cytowana w planie jako `cities.ts` faktycznie leży w `society-inputs.ts` (patrz niżej) — plan mylił lokalizację pliku. |
| `game/turn-economy.ts` | **W WIĘKSZOŚCI generyczny, 1 realny wyjątek** | 7 z 8 trafień (`1441,1975,2246,2356,2420,2544,2868`) to wzorzec `resolveOwnerEra ? resolveOwnerEra(id) : (id===0 ? playerEra : 1)` — **fallback wywoływany TYLKO gdy main.ts nie przekaże resolvera**; main.ts realnie zawsze go przekazuje (patrz wywołania `advanceCityEconomy`), więc to martwy kod w praktyce, ale literał fizycznie istnieje — niska priorytet, można zostawić lub zamienić kosmetycznie. **Wyjątek prawdziwy: `sumEconomyForPlayerCities()` (`:1219`)** — `cities.filter(c => c.ownerId === 0)`, ZAWSZE, bez resolvera, komentarz funkcji wprost: „HUD gracza — suma tylko z miast obecnych w `cities` (ownerId 0)". Wołana z `main.ts:29403` **wewnątrz bloku bankowania**, nie tylko HUD (§2.A). |
| `game/empire-food.ts` | **REALNE literały, plan MYLI SIĘ** | `:379` `isCityAutoWyzywienieEnabled()`: `if (city.ownerId !== 0) return true;` — AI zawsze auto-wyżywienie WŁ, gracz zależny od flagi; brak jakiegokolwiek callbacku. `:984` `maxSafePoziomRacjiForCity()`: `const requireFlowBalance = ownerId === 0;` — WŁASNY literał wewnątrz funkcji przyjmującej `ownerId` jako parametr generyczny; drugi human (ownerId=1) dostałby domyślnie stare stock-based zachowanie zamiast flow-based (regres funkcjonalny cichy, nie crash). |
| `game/society-inputs.ts` | **REALNE literały, plan trafny co do linii** | `:88`, `:93` — `isPlayerCapitalCity()`: `if (city.ownerId !== 0) return false;` (×2, w tym w pętli szukania najstarszego miasta). Funkcja generyczna WYŁĄCZNIE dla właściciela `0` — drugi człowiek nigdy nie miałby wyznaczonej stolicy przez ten helper. |
| `game/difficulty-cost.ts` | **Znany, świadomie wyłączony** | `:45` `isPlayerOwner()`: `return ownerId === 0;` — dokładnie ten literał, który Etap 3 świadomie zostawił (uzasadnienie w commit message `302ea837`). Nie zgłaszam jako nowe odkrycie, tylko potwierdzam że nadal tam jest i nadal czeka na osobną decyzję produktową. |

**Konkluzja:** plan §A5 trafnie identyfikuje pliki `game/*.ts`, ale błędnie generalizuje
„już per-owner" na wszystkie — 2 z 5 plików (`empire-food.ts`, `society-inputs.ts`) mają
realne literały. Ważniejsze: **plan całkowicie pomija, że w `main.ts` istnieje RÓWNOLEGŁA,
w pełni zahardkodowana ścieżka bankowania gracza** (nie tylko odczyt HUD) — to jest
największe pojedyncze odkrycie tej rundy, patrz §2.A.

## 2. Inwentaryzacja `main.ts` (poza 10 akcesorami Etapu 3, poza 42 input Etapu 6a, poza 78 UI Etapu 6b)

### Klaster A — Blok bankowania Skarbiec/Nauka/utrzymanie wewnątrz `runWorldEndTurn()` (NAJWAŻNIEJSZE ODKRYCIE)

`main.ts:29570-29625` (wewnątrz `runWorldEndTurn`, komentarz w kodzie: „Bank treasury +
science, then auto-research"). **To NIE jest odczyt HUD — to jest FAKTYCZNY zapis przyrostu
Skarbca/Nauki tej tury.** Struktura: JEDNA gałąź zahardkodowana na gracza (poniżej), OSOBNA,
generyczna pętla `for (const oid of aiOwnerIds)` dla AI (`main.ts:29625-29639`) — **dwie
niezależne implementacje tej samej logiki, nie jedna generyczna z filtrem**.

| Linia | Kod dziś | Podmiana |
|---|---|---|
| 29574-29575 | `player.skarbiec += pieniadzGracza; player.nauka += naukaGracza;` | pętla po `humanOwnerIds`, zapis przez `setOwnerTreasury`/`ownerNaukaPool`+delta (akcesory Etapu 3 już istnieją) |
| 29578 | `econ.upkeepByOwner.get(0)` | `.get(ownerId)` w pętli |
| 29580 | `player.skarbiec -= playerBalance.utrzymanieRazem;` | jw. |
| 29590 | `econ.resourceUpkeepByOwner.get(0)` | `.get(ownerId)` |
| 29592 | `ownerResourceStockAll(cities, 0)` | `(cities, ownerId)` |
| 29594 | `deductBuildingStockCostAcrossCities(cities, 0, playerResUpkeep)` | `(cities, ownerId, …)` |
| 29611 | `econ.resourceUpkeepByOwner.get(0)` (zasila `_lastBogactwoUtrzymanieSurowcow`) | `.get(ownerId)` — **UWAGA: to zapis do `_last*` cache, patrz nakładanie z 6b §4 w §4 niżej** |
| 29616-29617 | `buildingResourceUpkeepByOwner.set(0, …)`, `unitResourceUpkeepByOwner.set(0, …)` | `.set(ownerId, …)` |
| ~29666 | `researchGateForOwner(0)` (auto-research, `player.era`/`player.zbadane` wprost) | pętla po `humanOwnerIds`, jak `runAiResearchForOwner(oid)` obok |

**Uzasadnienie kategorii:** to jest dosłownie rdzeń mechaniki „skarbiec/Nauka/utrzymanie" z
GOAL tego tematu — nie panel, nie input. **To pojedynczy klaster o WYSOKIM ryzyku
implementacyjnym** (nie mechaniczna podmiana `ownerId===0→isHuman(id)`, tylko przepisanie
gałęzi na pętlę identyczną do istniejącej pętli AI obok) — plan §C ocenia całą kategorię (c)
jako „mechaniczny" po jednym względzie (do dyskusji z Evaluatorem, patrz §5).

**9 literałów `0`** w tym jednym klastrze (linie: 29578, 29580, 29590, 29592, 29594, 29611,
29616, 29617 + 29574/29575 traktowane jako 1 koncepcyjna zmiana + `researchGateForOwner(0)`).

### Klaster B — Duplikat akcesora technologii/ery (rozszerzony po Obronie — Evaluator zarzut 2)

Etap 3 zmigrował `ownerResearchedTechs(ownerId)` (zwraca `ReadonlySet<string>`), ale w kodzie
istnieją **PIĘĆ (nie dwie) NIEZALEŻNYCH kopii tej samej lub pokrewnej logiki**, wszystkie
wciąż z literałem `ownerId === 0`:

| Linia | Funkcja | Kod | Uwaga |
|---|---|---|---|
| 7717-7719 | `unlockedTechsForOwner(ownerId)` (zwraca `string[]`) | `ownerId === 0 ? Array.from(player.zbadane) : Array.from(aiResearchDone.get(ownerId) ?? new Set())` | pierwotnie znalezione |
| 30259-30261 | inline w pętli auto-manage (`runWorldEndTurn`) | identyczny ternary | pierwotnie znalezione |
| **3466** | **`unlockedTechSetForOwner(ownerId)` (zwraca `Set<string>`)** | `if (ownerId === 0) return player.zbadane; return aiResearchDone.get(ownerId) ?? new Set();` | **POMINIĘTE w rundzie 1 — świeży `Read` potwierdza TRZECIĄ kopię. WYSOKIE znaczenie: ta funkcja jest przekazywana WPROST jako parametr `resolveOwnerTech` do `advanceCityEconomy` (`main.ts:29135-29159`, świeżo zweryfikowane pozycyjnie względem sygnatury `game/turn-economy.ts:2278`) — jest AKTYWNIE wołana w głównym ticku ekonomii co turę, nie martwy call-site jak sugerowałaby analogia do 7717/30259.** |
| **1988** | **`syncOwnerEraFromResearch(ownerId)`** | `if (ownerId === 0) return false;` (funkcja pisze `ownerEraByOwner`, ale dla gracza wychodzi wcześnie — era gracza liczona gdzie indziej) | **POMINIĘTE w rundzie 1** |
| **2170** | **`countTechForOwner(ownerId)`** | `if (ownerId === 0) return player.zbadane.size; return aiResearchDone.get(ownerId)?.size ?? 0;` | **POMINIĘTE w rundzie 1** |

**Podmiana:** 7717/30259/3466 → `Array.from(ownerResearchedTechs(ownerId))` /
`new Set(ownerResearchedTechs(ownerId))` odpowiednio (akcesor już istnieje, Etap 3) —
usunięcie duplikacji. `1988`/`2170` → `isHuman(ownerId)` (call-site float, generyczna
gałąź już istnieje obok — `aiResearchDone.get`/`ownerEraByOwner` już per-owner). Ryzyko
niskie dla wszystkich pięciu (mechaniczna podmiana lub call-site float), ALE `3466` wymaga
dodatkowej ostrożności przy przepisaniu, bo jest na ścieżce krytycznej co-turowego ticku
(`advanceCityEconomy`), nie peryferyjnym call-site jak pierwotnie sugerowano.

### Klaster C — Praca pool: bezpośredni zapis z pominięciem akcesora Etapu 3

`main.ts:30345-30366`, wewnątrz pętli produkcji miast (`runWorldEndTurn`): kod NIE woła
`setOwnerPracaPool()` (akcesor Etapu 3), tylko pisze bezpośrednio do zmiennej:

```
if (city.ownerId === 0) {
  playerPracaPool += poolGain;           // :30345
  _lastPraca = playerPracaPool;
  _lastPracaRate += poolGain;
} else {
  aiPracaPoolByOwner.set(city.ownerId, (aiPracaPoolByOwner.get(city.ownerId) ?? 0) + poolGain);
}
```
Identyczny wzorzec powtórzony na `:30365` dla `overflowToPool`. **To jest luka pozostawiona
przez Etap 3** — akcesor `setOwnerPracaPool` istnieje i jest poprawny (`isHuman`-aware), ale
ten call-site go nie używa, tylko duplikuje starą logikę wprost. Podmiana: `isHuman(city.ownerId)
? setOwnerPracaPool(city.ownerId, ownerPracaPool(city.ownerId) + poolGain) : aiPracaPoolByOwner.set(…)`
(2 miejsca × 3 linie = 6 linii kodu, 2 literały `0`).

### Klaster D — Auto-racje/auto-podnoszenie Wyżywienia (gate do funkcji `game/empire-food.ts`)

`main.ts:29226-29251`, wewnątrz pętli `for (const ownerId of ownerIdsForAutoRation)` (pętla
JUŻ generyczna po wszystkich ownerach) — mimo to **4 literały `0` przekazywane jako parametry
opcji** do funkcji generycznych:

| Linia | Kod |
|---|---|
| 29226 | `onlyAutoManaged: ownerId === 0,` |
| 29232 | `requireFlowBalance: ownerId === 0,` (odpowiada realnemu literałowi w `empire-food.ts:984`, §1) |
| 29250 | `requireProductionSurplus: ownerId === 0,` |
| 29251 | `onlyAutoManaged: ownerId === 0,` |

Podmiana: `isHuman(ownerId)` we wszystkich 4. Ryzyko niskie — pętla jest już per-owner,
zmienia się tylko WARTOŚĆ przekazywanego booleana.

**KOREKTA PO OBRONIE (Evaluator zarzut 1):** w tej samej pętli (`29219-29240`), DOKŁADNIE
w tym Klastrze, istnieje piąty literał — `if (ownerId === 0) { pendingAutoRationForNextTurn
= autoRationResult; }` — **już zmigrowany** przez Etap 4prep (`e2c765ac`, zintegrowany) na
`if (isHuman(ownerId)) { … }` (`main.ts:29237-29239`, świeżo zweryfikowane `Read`). Nie
liczę go do 4 literałów niżej (już zrobiony, nie wymaga podmiany), ale zgłaszam go jawnie
jako DOWÓD, że kategoria (c) fizycznie nakłada się z osobnym, już zintegrowanym tematem —
patrz §4.

### Klaster E — Wyrąb lasu / pula Drewna per-owner (pominięty w pętli)

`main.ts:29416` — `for (const [hexKey, st] of hexClearingStates) { if (st.ownerId !== 0)
continue; …}` — pętla wyrębu lasu (Praca→Drewno, `main.ts:29416-29450`) przetwarza WYŁĄCZNIE
wpisy właściciela 0; drugi człowiek nie dostałby przyrostu Drewna z wyrębu w ogóle (cichy
regres funkcjonalny, nie crash). Podmiana: `!isHuman(st.ownerId)`.

### Klaster F — Auto-ulepszenia terenu gracza

`main.ts:30609` — `const autoImpCities = cities.filter(c => { if (c.ownerId !== 0) return
false; … })` — auto-ulepszenia (przydział Pracy do ulepszeń terenu) liczone wyłącznie dla
`ownerId 0`, sąsiaduje z generyczną pętlą AI (`:30596-30604`, `id > 0`, już poprawna).
Podmiana: `!isHuman(c.ownerId)`.

### Klaster G — Cache `_last*` write-site'y zasilane z bloku ekonomii (NAKŁADANIE z Etapem 6b)

Poza Klastrem A (§2.A), dodatkowe zapisy do zmiennych `_last*` wewnątrz `runWorldEndTurn`
używające literału `0` bezpośrednio przy liczeniu (nie tylko odczycie funkcji akcesorowej):
`29062` (`popBeforeTick`), `29404` (`playerCityCount`), `29464` (`_lastLudnoscRate` —
**dokładnie ten sam write-site, który Evaluator 6b znalazł jako „trzeci write-site cache"**),
`29466-29477` (`_lastWealthLevel`/`_lastWealthMnoznik`), `30766` (`_lastKultura`). **Nowe,
nieznalezione przez 6b:** `main.ts:6717-6731 refreshPlayerCityEcon()` — CZWARTY, niezależny
write-site cache `_lastPlayerCityEcon`, wołany z `runWorldEndTurn` (linia wywołania ~29459),
z własnym literałem `tk.ownerId === 0` (`:6731`) — nieobecny w liście 6b §4 (`main.ts:29464,
29578,29590`). Patrz §4 dla decyzji o przydziale między (b)/(c).

### Klaster H — Pozycje graniczne, świadomie NIE liczone do sumy (c)

- **Rebelia** (`main.ts:30169`, `graceUpd.shouldTriggerRebellion && city.ownerId === 0 &&
  !city.rebelState`) — przejście miasta do frakcji rebeliantów gated wyłącznie na gracza.
  Nie znalazłem odpowiednika dla AI w promieniu funkcji (`updateRevoltGrace` jest wołane
  generycznie wcześniej, ale SAMO wywołanie `markCityRebellionStarted`/zmiana `ownerId`
  wygląda na warunkowane tylko dla `0`) — **flaguję jako NIEJEDNOZNACZNE**: może to być
  świadome uproszczenie (bunt AI obsłużony gdzie indziej) albo realna luka; wymaga
  odrębnego `grep` po `markCityRebellionStarted` poza zakresem tej rundy (czasowo pominięte,
  jawnie zgłaszam zamiast milczeć).
- 11 akcesorów nazw/kolorów cywilizacji (`civTypeForOwner`, `relationColorFn`,
  `civKeyForOwnerId`, `civBonusyForOwnerId`, `unitRingStanceForPlayer`, `civDisplayNameForOwner`,
  `civKeyForOwner`, `civLabelForOwner`, `cityMapOutlineKindForOwner`, `computePotegaComponents`)
  — 6b już je flagował jako granicę (b)/(c)/(e) i świadomie wykluczył. **Decyzja tej rundy:
  klasyfikuję je jako (e) render/identyfikacja, NIE (c) ekonomia** — nie liczą stanu
  ekonomicznego, tylko zwracają nazwę/kolor/typ cywilizacji. Wykluczone z sumy (c).
- `extraCityPanelConfig()` (6b: 6 wystąpień) — 6b już flagował granicę (b)/(c) (m.in.
  `onCityRationChange` zmienia `poziomRacji`, czyli PISZE stan ekonomiczny). **Zgadzam się
  z 6b: to (c) tak samo jak (b)** — ale ŻEBY NIE DUBLOWAĆ SUMY, zostawiam po stronie (b)
  (6b już go świadomie wykluczył ze swojej sumy 78, ja też wykluczam z (c) — do jednorazowej
  decyzji w rundzie implementacji, nie do podwójnego liczenia w dwóch dokumentach).
- Klastry `showHintMessage` gated `tick.ownerId===0` w tickach głodu/deficytu (`main.ts:29333,
  29379-29382, 29787, 29833` — dokładnie te same linie, które 6b już policzył i jawnie wykluczył
  jako pozycję graniczną (b)/(c), 5 linii). **Nie liczę ich powtórnie tutaj** — 6b już je ma
  w swojej tabeli granicznej, podwójne liczenie zafałszowałoby rozliczenie z „~50".

## 3. Rozliczenie z liczbą „~50"

**Suma rdzeniowa main.ts (klastry A-F, jednoznacznie (c), z wyłączeniem H):**

| Klaster | Liczba linii/literałów |
|---|---|
| A — bank Skarbiec/Nauka/utrzymanie | 9 |
| B — duplikaty technologii/ery (**5, po Obronie — było 2**) | **5** |
| C — Praca pool bezpośredni zapis | 2 |
| D — auto-racje/auto-raise gate (1 już zmigrowany Etapem 4prep, nie liczony tu) | 4 |
| E — wyrąb lasu | 1 |
| F — auto-ulepszenia gracza | 1 |
| **SUMA main.ts (jednoznaczne)** | **22 (było 19)** |

**+ Klaster G (write-site cache, dzielony z 6b, 5 nowych/potwierdzonych linii: 29062, 29404,
29464(już w 6b), 29466, 30766 + refreshPlayerCityEcon `:6731` jako NOWY 6-ty) = 6 dodatkowych,
ale 1 z nich (`29464`) już policzony przez 6b jako TWARDA ZALEŻNOŚĆ poza ich sumą 78 — nie
duplikuję, liczę tu 5 pozostałych jako (c).**

**+ 5 realnych literałów w `game/*.ts`** (`turn-economy.ts:1219`, `empire-food.ts:379,984`,
`society-inputs.ts:88,93`) — **poza main.ts, ale w zakresie kategorii (c)**.

**Suma całkowita jednoznaczna: 22 (main.ts core, PO Obronie) + 5 (write-site, klaster G) + 5
(game/*.ts) = 32 (było 29 w rundzie 1).** Znacząco PONIŻEJ „~50" z planu (-36%, w drugą
stronę niż 6a które było +68% POWYŻEJ). Korekta w Obronie (+3, Klaster B) NIE zmienia
kierunku wniosku — nadal wyraźnie poniżej planu, tylko mniej gwałtownie.

**Przyczyny rozjazdu w dół:**
1. Plan liczył prawdopodobnie orientacyjnie „10 fn + ~40 call sites" (§B2/tabela pod „A5" w
   podsumowaniu planu, wiersz „Ekonomia (akcesory)") — ale **Etap 3 już zrealizował dokładnie
   tę część** (10 akcesorów), więc ta pula jest już wyczerpana i nie powinna liczyć się do
   pozostałych ~50 dla (c). Jeśli odjąć 10 już zrobionych od `~50`, zostaje `~40` — nadal
   powyżej naszych 32 (po Obronie), ale bliżej.
2. **7 fallbacków w `turn-economy.ts` (linie 1441 i in.) świadomie NIE liczone** — martwy kod
   w praktyce (main.ts zawsze przekazuje resolver), niski priorytet, nie realna migracja.
3. Część pozycji granicznych (rebelia, akcesory nazw/kolorów, `extraCityPanelConfig`, klastry
   `showHintMessage`) należy do (b)/(e)/nieprzypisane — plan prawdopodobnie wliczał je do
   „~50" bez rozróżnienia, jak przy UI.
4. Klaster A (bank Skarbiec/Nauka) jest MAŁY liczbowo (9 literałów) ale **wysokiego ryzyka
   strukturalnego** — plan mógł szacować „~50" po objętości linii zmienianego kodu (blok
   liczy ~55 linii), nie po liczbie literałów `0`. Warto to jawnie zgłosić Evaluatorowi: liczba
   miejsc (32 po Obronie) nie oddaje realnego nakładu pracy (klaster A wymaga przepisania
   logiki na pętlę, nie mechanicznej podmiany).

## 4. Nakładanie z Etapami 3/4/4prep/6a/6b — jawnie sprawdzone

- **Etap 4prep (`R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1`, `e2c765ac`, ZINTEGROWANE,
  DODANE PO OBRONIE — Evaluator zarzut 1):** osobny, już zintegrowany temat, nie sam
  wcześniejszy „Etap 4" (rozcięcie `runWorldEndTurn`). Zmigrował DWA guardy `ownerId===0`:
  `promptMergeIfCoLocated` (`:11141`) i `pendingAutoRationForNextTurn` (**`:29237`, dziś —
  DOKŁADNIE wewnątrz Klastra D**, pętli auto-racji `29219-29257` tej rundy) na
  `isHuman(ownerId)`. Nie stanowi to duplikacji pracy tej rundy (literał już nie istnieje,
  nic do migracji), ale POTWIERDZA że kategoria (c) fizycznie sąsiaduje/nakłada się z innymi,
  drobnymi zintegrowanymi tematami poza główną osią Etap 3/4/6a/6b — ryzyko przeoczenia
  kolejnych takich „cichych" integracji przy dispatchu rundy implementacji (c) jest realne,
  rekomendacja: świeży `grep -c "isHuman(" main.ts` bezpośrednio przed dispatchem
  implementacji, nie poleganie na liczbie z tego dokumentu.
- **Etap 3**: 10 akcesorów wykluczone (§0). Klastry B i C tej rundy to bezpośrednie
  KONSEKWENCJE niepełnej migracji Etapu 3 (akcesor istnieje, ale nie wszystkie call-site'y
  go używają) — nie duplikacja, tylko dokończenie tej samej pracy.
- **Etap 4**: rdzeń klastrów A/B/C/D/E/F leży wewnątrz `runWorldEndTurn()`, POST-migracji Etapu 4
  (funkcja już wydzielona) — żadnej kolizji z samym rozcięciem, ale POTWIERDZA ostrzeżenie
  dispatchu: ekonomia jest fizycznie w tej samej funkcji co dyplomacja/AI/oblężenia z klastra H
  (Etap 6d/e), więc call-site'y sąsiadują linia w linię — ryzyko pomyłki przy edycji WYSOKIE
  (Klaster A sąsiaduje bezpośrednio z blokiem `gdOwnerIds`/deficytu Złota z linii 29763, który
  jest częściowo (c) [głód/deficyt liczenie] a częściowo (b) [komunikaty, już wykluczone 6b]).
- **Etap 6a (input)**: zero nakładania — żaden z klastrów A-H nie dotyczy ruchu/zaznaczenia/inputu.
- **Etap 6b (UI)**: **jawne nakładanie w Klastrze G** — `main.ts:29464` (`_lastLudnoscRate`)
  to DOKŁADNIE ta sama linia, którą Evaluator 6b znalazł jako „trzeci write-site cache"
  (`03-obrona-runda1.md` 6b). Nie liczę jej powtórnie w sumie §3. **Nowe, nieznalezione przez
  6b:** `refreshPlayerCityEcon()` (`main.ts:6717-6731`) jest CZWARTYM niezależnym write-site'em
  tego samego cache (`_lastPlayerCityEcon`), z własnym literałem `:6731` — **6b nie miał tego
  w swojej liście `_last*` write-site'ów** (ich §4 cytuje tylko `29464/29403/29578/29590`).
  Zalecenie: **poinformować temat 6b (lub rundę implementacji UI) o tym dodatkowym write-site
  PRZED integracją migracji U1/U2** — inaczej powtórzy się dokładnie ten sam błąd, który 6b
  już raz naprawiał (Obrona runda 1), tym razem z czwartym, nieuwzględnionym miejscem.
  11 akcesorów nazw/kolorów i `extraCityPanelConfig`/`showHintMessage` — patrz Klaster H,
  świadomie NIE dublowane w (c), zostają przypisane tak jak zdecydował 6b (lub jawnie
  przesunięte do (e), patrz H).

## 5. Plan dowodu no-op

**Rozstrzygnięcie: MIESZANY — headless Node dla większości, Chromium tylko dla Klastra F i
fragmentu Klastra G.**

- **Klastry A, B, C, D, E** (bank Skarbiec/Nauka/utrzymanie, duplikat technologii, Praca pool,
  auto-racje, wyrąb lasu) — CZYSTA logika, żadnego DOM/renderu bezpośrednio w call-sicie
  (funkcje wołane: `sumEconomyForPlayerCities`, `advanceCityEconomy`, `autoBalanceRationsToSolvency`,
  `ownerResearchedTechs` — wszystkie eksportowane z `game/*.ts`, testowalne w Node, wzorem
  `hotseat-etap3-akcesory-test.cjs`). **Metoda:** rozszerzyć istniejący skrypt testowy Etapu 3
  (lub nowy `hotseat-etap6c-economy-test.cjs`) — uruchomić `runWorldEndTurn`-equivalent logikę
  izolowanie per funkcję (nie cały `boot()`), z `ownerId` 0/1/2, porównać wynik przed/po
  podmianie na `isHuman(ownerId)` przy `humanOwnerIds=[0]` (musi być bit-w-bit identyczny —
  `isHuman(0)===true` zawsze w single-human, więc każda gałąź `ownerId===0` i `isHuman(ownerId)`
  dają ten sam wynik dla `ownerId=0`, i ten sam wynik `false` dla `ownerId>0` dziś, bo
  `humanOwnerIds=[0]` domyślnie).
- **Klaster F** (auto-ulepszenia terenu gracza) — DOM-bound pośrednio (`effectiveUlepszeniaForCity`,
  panel ulepszeń) — wymaga Chromium/Playwright, wzorem 6b, otwarcie panelu ulepszeń + 20 tur.
- **Klaster G** (write-site cache) — dziedziczy metodę po 6b: **Chromium**, bo cache zasila HUD
  bezpośrednio (nie da się ocenić poprawności bez wyrenderowanego ekranu) — identyczna sekwencja
  co 6b §6 (porównanie wyrenderowanego HUD przed/po, 20 tur).
- **Wspólna bramka referencyjna dla obu:** `tsc --noEmit` (0 błędów, dziś niepotrzebne — zero
  zmian kodu tej rundy) + istniejące bramki ekonomii (`difficulty-cost`/`wealth`/`ai-major-economy`/
  `ai-praca-*`, te same 5 co Etap 3) — muszą zostać zielone identycznie przed/po.

## Podsumowanie dla Evaluatora (PO OBRONIE RUNDY 1 — zgodne z poprawionymi §0/§2.B/§3/§4)

- **Plan §A5 obalony częściowo**: `empire-food.ts` i `society-inputs.ts` mają realne literały
  `0` (nie tylko main.ts), wbrew twierdzeniu „rdzeń już per-owner". `cities.ts` faktycznie
  czysty. `turn-economy.ts` w większości generyczny (wzorzec resolver/callback), 1 prawdziwy
  wyjątek (`sumEconomyForPlayerCities`).
- **Największe odkrycie**: blok bankowania Skarbiec/Nauka/utrzymanie w `main.ts:29570-29625`
  (Klaster A) to NIE odczyt HUD, tylko realny zapis ekonomii gracza — zahardkodowana,
  równoległa (nie generyczna) ścieżka obok analogicznej pętli AI. 9 literałów, wysokie ryzyko
  implementacyjne (przepisanie logiki, nie mechaniczna podmiana).
- **22 jednoznaczne miejsca main.ts (Klastry A-F, PO Obronie — było 19, Klaster B rozszerzony
  z 2 do 5: `main.ts:3466` `unlockedTechSetForOwner` — aktywnie przekazywana jako
  `resolveOwnerTech` do `advanceCityEconomy`, `:1988` `syncOwnerEraFromResearch`, `:2170`
  `countTechForOwner`) + 5 write-site (Klaster G, 1 dzielony z 6b) + 5 w `game/*.ts` = 32
  świeżo zweryfikowanych miejsc (było 29)**, wciąż znacząco poniżej planowanych „~50" (-36%,
  było -42%), rozliczone jawnie w §3.
- **Nakładanie z osobnym zintegrowanym tematem `R-HOTSEAT-ETAP4PREP-DEFERRED-OWNER-GUARDS-Q1`
  (`e2c765ac`, dodane po Obronie — Evaluator zarzut 1)**: guard `pendingAutoRationForNextTurn`
  (`main.ts:29237`, wewnątrz Klastra D) już zmigrowany na `isHuman(ownerId)` — świeży
  `grep -c "isHuman(" main.ts` = 13 (nie 10 jak w rundzie 1); nic do migracji w tym punkcie,
  ale potwierdza ryzyko „cichych" integracji obok głównej osi Etap 3/4/6a/6b — patrz §4.
- **Nowe odkrycie nakładające się z 6b**: `refreshPlayerCityEcon()` (`main.ts:6717-6731`) to
  CZWARTY, nieznaleziony przez 6b write-site cache `_lastPlayerCityEcon` — wymaga zgłoszenia
  do tematu 6b/implementacji UI przed integracją, żeby nie powtórzyć błędu „trzeciego
  write-site'u" po raz kolejny.
- **1 pozycja jawnie niejednoznaczna** (rebelia, `main.ts:30169`) — brak czasu na pełne
  rozstrzygnięcie w tej rundzie, zgłoszona zamiast przemilczana.
- Plan dowodu no-op: MIESZANY — headless Node dla Klastrów A-E (czysta logika, testowalne jak
  Etap 3, obejmuje rozszerzony Klaster B), Chromium dla Klastra F i G (DOM-bound/HUD-bound).
