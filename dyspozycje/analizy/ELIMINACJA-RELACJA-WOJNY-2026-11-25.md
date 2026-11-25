# Eliminacja właściciela a relacja „wojna” — wpływ na liczniki i limity (R-WEB-ELIMINATED-RELATION-CLOSE-Q1)

DATA: 2026-11-25 | BAZA: origin/main 76c0fbc6b55816399ccbe8d6ac5c3240b99e70ee | ŹRÓDŁO ZGŁOSZENIA: L5 w `dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md`

## Werdykt

**Luka L5 w brzmieniu z WARENDP nie występuje w kodzie.** `eliminateOwner` NIE zostawia relacji `wojna` dla pary z martwym właścicielem: sam czyści wpisy `diplomacyRelations` zawierające `ownerId`. Po usunięciu klucza każdy odczyt `getDiploRelation` tworzy neutralną relację domyślną, więc para z martwym właścicielem nie jest wojną w żadnym liczniku ani limicie.

Klasyfikacja: **bez wpływu na liczniki i limity wojen (porządkowe)**. Kod gry nie zmieniony.

## Dowody (plik:linia w `gra/src/main.ts`)

| Miejsce | Co robi | Wynik dla pary (A, martwy B) |
|---|---|---|
| `eliminateOwner` 40109–40111 | `eliminatedOwners.add(ownerId)` | — |
| `eliminateOwner` 40221–40223 | `diplomacyRelations.delete(key)` dla każdego klucza z `ownerId` (`diploPairKeyHasOwner`, 39999) | Wpis pary usunięty |
| `eliminateOwner` 40224–40230 | to samo dla `diplomacyPairMeta` i `diplomacyFactorLog` | Meta pary usunięta |
| `getDiploRelation` 11181–11183 | brak klucza → `defaultNeutralRelation()` | Odczyt = **pokój/neutralny, NIE wojna** |
| `countActiveWarsForOwner` 26032–26039 | liczy `getDiploRelation(...).status === 'wojna'` po `allPowerOwnerIds()` | Para z martwym nie wchodzi do licznika |
| `countActiveWarsForOwnerExcludingBarbarians` 26048–26059 | j.w. (`countActiveWarsExcluding`) | j.w. |
| `warTypesForOwner` 26061–26085 | `atWar = getDiploRelation(...).status === 'wojna'` | `atWar = false`, para nie tworzy typu wojny |
| `pendingPrincipalCounts` (`diplomacy-war-limit.ts:141–150`) | `statusOf(owner, partner) !== 'wojna'` | Nie wpływa (statusOf = getDiploRelation) |
| `buildAllianceWarObligationCtx` 26137+ | `countActiveWarsForOwner(allyId)` i relacje sojuszu przez `getDiploRelation` | Nie wpływa |
| `tickAiAiWarWeariness` 40745–40752 | pary budowane z `aiOwnerCivMap.keys()` (wpis martwego usuwa `aiOwnerCivMap.delete` w 40147) + `getDiploRelation` | Martwy nie wchodzi do par |
| UI listy wojen: `collectWarsWithPlayer` 24320–24330, `collectKnownWarsBetweenOthers`, bloku powiadomień ~11621 | iterują `diplomacyRelations.entries()` | Wpisy pary usunięte → nie pojawiają się |
| Wymuszenie wojny epoki (Brąz/Kamień/Żelazo) | `bronzeForceWarActiveByPairKey` / `stoneForce…` / `ironForce…` czyszczone dla `attackerId`/`targetId` = ownerId (40154–40196); `regularWarCapturedByPairKey` (40200–40205) | Nie wpływa |

Uwaga do dowodu: `allPowerOwnerIds()` (20457–20462) NIE filtruje `eliminatedOwners`, bo zawiera właścicieli z `aiStartHexes`, a `eliminateOwner` nie usuwa wpisów z `aiStartHexes`. Martwy właściciel zostaje więc na liście iteracji, ale każdy odczyt jego pary daje neutral, więc nie zmienia wyniku liczników.

Dodatkowe ustalenia (odpowiedź na zarzut 3 Evaluatora):
- `eliminateOwner` ma early return `if (ownerId === 0 || eliminatedOwners.has(ownerId)) return;` (`main.ts:40110`). Gracz (ownerId 0) nie przechodzi tą ścieżką, więc jego relacje nie są czyszczone tym mechanizmem. Wniosek L5 dotyczy wyłącznie AI, a gracz nie jest martwy w tej ścieżce.
- Pętle po `allPowerOwnerIds()` (28 wystąpień, m.in. 3115, 13166, 20488–20612, 24735, 25728, 25879, 25929, 26034, 26051, 26063, 29964, 30277–30594, 31593, 32095, 37880): **zapisy relacji w tych pętlach są chronione albo odczytem statusu, albo filtrem**:
  - 13166–13172 (`applyMilitaryRespektEdgeTick`): filtr `eliminatedOwners.has(o)` przed zapisem `setDiploRelation(gracz, o, next)` (13205).
  - 30277, 30323, 30382, 30467, 30589, 30594 (wymuszenia wojny epoki) oraz 30009, 30722, 32308, 32733: zapis `setDiploRelation(..., { ...rel, status: 'neutralni'|'pokoj' })` tylko `if (rel.status === 'wojna')`. Martwa para czyta neutral, więc nie zapisuje.
  - 26686–26700 (dobra wola): iteruje `getDiplomaticContacts()`; `diplomacyPairMeta` martwej pary jest usuwana (`main.ts:40224–40226`), więc `meta.dobraWolaRemainingTur` = 0 i `setDiploRelation` nie jest wywołane.
  - 12580–12585 i 12712: odczyt/filtr jak wyżej.
- Zastrzeżenie: nie otwarto każdego z 28 wystąpień osobno. Część (3115, 20545, 24735, 37880, 25728/25879/25929, 29964, 31593, 32095) to odczyty lub filtry, ale ich linii nie czytano w całości. Ten wniosek opiera się na przeglądzie zapisów relacji (lista `setDiploRelation(`/`diplomacyRelations.set(`), nie na pełnym przejściu każdego wystąpienia pętli.

## Zastrzeżenia (porządkowe, nie wpływają na wojny)

1. **Odtwarzanie neutralnych wpisów martwych par — ZBADANE: nie występuje.** `tickDiploAiAiPairsWithBrake` (`main.ts:12711–12712`) iteruje `allPowerOwnerIds().filter(o => !isMe(o) && diploOwnerEligibleForBrake(o))`. `diploOwnerEligibleForBrake` (`main.ts:12564–12570`) przekazuje `eliminated: eliminatedOwners.has(o)`, a `isAiAiEligibleOwner` (`gra/src/game/diplomacy-tick-war-brake.ts:239–241`) zwraca `!o.eliminated && ...`. Martwy właściciel jest więc odfiltrowany przed `aiAiPairs`; ta pętla nie odtwarza wpisów neutralnych martwych par ani ich nie zapisuje (`diplomacyRelations.set` w 12718 dotyczy tylko par z przeliczonych właścicieli). Dodatkowo `diploAiOwnersEligible` (12575) i `diploSharedEnemyOrBarbarianCoop` (12580–12585, odczyt + `eliminatedOwners.has(c)`) stosują ten sam filtr. Wniosek: osobny temat porządkowy 2 jest zbędny; nie wymaga zmian.
2. **Stan zmęczenia wojną dla martwych par.** `warWearinessByPairKey` nie jest czyszczony w `eliminateOwner`. `runWarWearinessTick` (`src/game/war-weariness.ts`, ~363) przelicza tylko pary przekazane w `pairs`, więc wpis martwej pary zostaje nieruszony i jest zapisywany (42397). Nie jest czytany jako wojna (tickAiAiWarWeariness buduje pary tylko z `wojna`). Skutek: martwy wpis w zapisie.
3. **Weryfikacja behawioralna NIE ZMIERZONO.** Wniosek opiera się na analizie statycznej ścieżek odczytu. Nie uruchomiono testu na żywo ani scenariusza eliminacji w silniku (vm); bramki gry nie były potrzebne, bo `gra/src` się nie zmienia.
4. **Dowód statyczny jako bramka tekstowa.** Dodano `gra/tools/eliminated-relation-source-test.cjs` (6 PASS / 0 FAIL, exit 0), który sprawdza cytowane fragmenty: kasowanie `diplomacyRelations`/`diplomacyPairMeta` z `ownerId` w `eliminateOwner`, early return dla `ownerId === 0`, `!o.eliminated` w `isAiAiEligibleOwner`, `eliminated: eliminatedOwners.has(o)` w `diploOwnerEligibleForBrake` i filtr `diploOwnerEligibleForBrake` w `tickDiploAiAiPairsWithBrake`. Test nie wykonuje mutanta (NIE ZMIERZONO); jest to strażnik zapisu, nie dowód zachowania w grze.

## Decyzja i następny krok

- Brak zmiany zachowania gry (`gra/src` nietknięte). Klasyfikacja: bez wpływu na liczniki i limity wojen.
- Zostaje jedno zadanie porządkowe: zastrzeżenie 2 (czyszczenie `warWearinessByPairKey` przy eliminacji — martwy wpis w zapisie). Zastrzeżenie 1 jest zamknięte (nie występuje).
