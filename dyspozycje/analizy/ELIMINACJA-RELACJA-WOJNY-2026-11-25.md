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

## Zastrzeżenia (porządkowe, nie wpływają na wojny)

1. **Odtwarzanie neutralnych wpisów martwych par.** `tickDiploAiAiPairsWithBrake` (12708–12718) iteruje `allPowerOwnerIds()` przefiltrowane tylko przez `diploOwnerEligibleForBrake`; jeśli ten filtr przepuszcza martwego, `getDiploRelation` odtworzy wpis neutralny, a `diplomacyRelations.set` go zapisze. Skutek: pusty wpis w mapie i w zapisie (`diploSave`, 42131). Nie zmienia statusu wojny. NIE ZBADANO, czy `diploOwnerEligibleForBrake` (12563) odfiltrowuje eliminowanych — do potwierdzenia w osobnym temacie porządkowym.
2. **Stan zmęczenia wojną dla martwych par.** `warWearinessByPairKey` nie jest czyszczony w `eliminateOwner`. `runWarWearinessTick` (`src/game/war-weariness.ts`, ~363) przelicza tylko pary przekazane w `pairs`, więc wpis martwej pary zostaje nieruszony i jest zapisywany (42397). Nie jest czytany jako wojna (tickAiAiWarWeariness buduje pary tylko z `wojna`). Skutek: martwy wpis w zapisie.
3. **Weryfikacja behawioralna NIE ZMIERZONO.** Wniosek opiera się na analizie statycznej ścieżek odczytu. Nie uruchomiono testu na żywo ani testu źródłowego eliminacji; bramki gry nie były potrzebne, bo kod się nie zmienia.

## Decyzja i następny krok

- Brak zmiany kodu (zgodnie z pkt 3 dispatchu). Test strażnik nie wymagany.
- Zastrzeżenia 1–2 zapisać jako zadanie porządkowe (czyszczenie wpisów martwych par w `eliminateOwner` i w `warWearinessByPairKey`), bez wpływu na grę.
