STATUS: PASS
DOMAIN: GAME
TEMAT: t_8c9c7f4f (AI-ZAKLADANIE-MIAST-TELEPORTACJA-Q1)
GOAL: Ustalić skąd pochodzą miasta AI zakładane poza własnym terytorium
("teleportacja") i naprawić źródło, bez osłabiania istniejących strażników
regresji.

## Skąd faktycznie pochodzą odległe miasta

NIE ze startu klastra (`buildClusterStartPlan`) i NIE z kolonizacji w trakcie
gry (`planCityFounding`/`findCityFoundingHex`) — obie te ścieżki mają już
poprawnie egzekwowany twardy wymóg `withinTerritory` względem własnych miast
(potwierdzone żywą symulacją wielu tur, zero naruszeń — patrz
`tools/diag-teleport-live-sim.cjs`).

Realne źródło: `gra/src/game/ai-difficulty-bonus.ts::pickBonusCityHex()` —
funkcja przydzielająca DODATKOWE miasto startowe stolicy major AI na
poziomie trudności "Trudny" (`trudnosc_poziom3_startowe_miasta`, wywoływana
z `main.ts::grantDifficultyStartBonusesForMajorCapital`, TUŻ PO founding
stolicy klastra, `spawnPendingForeignClusters`). Ta funkcja miała WŁASNY,
niezależny promień poszukiwania (`MIN_CITY_DISTANCE * 3` = 12 heksów) —
NIE respektujący faktycznego zasięgu terytorium stolicy
(`cityTerritoryRadius`, dla świeżo założonej stolicy pop=1 → promień 5).
W gęstym klastrze startowym (dużo rywali tego samego typu + obce
cywilizacje spawnowane tuż obok) bliższe heksy są zablokowane przez inne
miasta/minimalny dystans, więc algorytm — sortując kandydatów rosnąco po
dystansie i biorąc pierwszy wolny — potrafił znaleźć legalny (wolny,
niemorski) heks 6-9 pól od stolicy: WEWNĄTRZ dozwolonego promienia 12,
ale POZA faktycznym promieniem terytorium tej stolicy (5). Stąd
"teleportacja" zgłoszona przez właściciela — miasto państwowo należące do
danej cywilizacji, wyraźnie poza jej granicami.

Dowód żywy (bez mocków, prawdziwy `buildClusterStartPlan` + `foundCityAt` +
`pickBonusCityHex` + `planMajorAiDifficultyStartBonuses` z realnymi danymi
gry, mapa 'Maly', 4 rywali/klaster, 10 aktywnych typów, poziom trudności 3):
`tools/diag-bonus-city-territory.cjs`, 8 różnych seedów — PRZED naprawą 3/8
seedów miały naruszenie (dist do 9 przy promieniu terytorium 5), PO
naprawie 0/8.

## Naprawa

`gra/src/game/ai-difficulty-bonus.ts::pickBonusCityHex()`: promień
poszukiwania ograniczony też do `cityTerritoryRadius(capitalNode)` (ten sam
mechanizm co `isHexWithinAnyCityReach`/`findCityFoundingHex` w ai.ts dla
zwykłej kolonizacji) — `maxRadius = min(MIN_CITY_DISTANCE * 3,
cityTerritoryRadius(capitalNode))`. Gdy w tym mniejszym promieniu brak
legalnego heksu, istniejąca ścieżka `extraCitiesBlocked` (bonus zamieniany
na jednostkę) działa bez zmian — brak nowej regresji, tylko węższe
poszukiwanie.

Naprawa jest wąska: 1 zmieniona linia logiki (`maxRadius`) + 1 nowy import
(`cityTerritoryRadius` z `../map/territory`, moduł już bezkolizyjny — `ai.ts`
importuje z niego identycznie). Zero zmian w main.ts, zero zmian w
`planCityFounding`/`findCityFoundingHex`/`buildClusterStartPlan`.

## Punkt 3 dyspozycji: `isMe(ownerId)` vs `ownerId === 0`

Zweryfikowane: `main.ts` definiuje `function isMe(ownerId) { return ownerId
=== ME(); }`, a `ME()` zwraca `humanSeats.activeHumanOwnerId`, dziś zawsze
`HUMAN_OWNER_PRIMARY === 0` (jeden fotel człowieka). Więc
`isMe(ownerId) ⟺ ownerId === 0` jest DOKŁADNIE równoważne w obecnym trybie
gry (nie-hotseat i hotseat fotel 1) — zmiana w `foundingTerritoryOpts`
(R-HOTSEAT-DRUGI-FOTEL-NIE-DOSTAJE-TURY-Q1) to legalne uogólnienie na drugi
fotel hotseat, NIE ciche zwolnienie AI z wymogu terytorium. Test
`ai-founding-territory-test.cjs` był przestarzały (regex łapał tylko
literalne `ownerId === 0`) — zaktualizowany, żeby akceptować OBA
równoważne zapisy, plus DODATKOWA asercja `B1e-isMe`, która wymusza, że
`isMe` jest zdefiniowane dosłownie jako `ownerId === ME()` (gdyby
kiedykolwiek przestało być tym prostym aliasem, test to złapie). Asercja
`B1e-c` (blokada cichego dodatkowego `return` między pierwszą instrukcją a
`cityNodesForOwner`) pozostaje BEZ ZMIAN.

Zero zmian w main.ts z tego powodu — tylko aktualizacja testu, zgodnie z
kontraktem zadania.

## Testy

Uruchomiony cały pakiet wskazany w dyspozycji + wszystko znalezione przez
grep referencji do `planCityFounding`/`findCityFoundingHex`/
`foundingTerritoryOpts`/`buildClusterStartPlan`/`withinTerritory`/
`pickBonusCityHex` w `tools/`:

- ai-founding-territory-test.cjs: 29/29 PASS (było 25/25 PASS + 1 FAIL
  przestarzały — teraz naprawione, zero regresji semantycznej)
- ai-colonization-pop-test.cjs: 13/13 PASS
- ai-early-city-founding-pace-test.cjs: 2/2 PASS
- ai-difficulty-bonus-test.cjs: 97/97 PASS (bezpośrednio pokrywa
  pickBonusCityHex)
- fort-strazniaca-zasieg-zakladania-test.cjs: 85/85 PASS
- cluster-start-recovery2-test.cjs: 29/29 PASS
- cluster-plan-name-test.cjs: 6/6 PASS
- logic-test.cjs: 213/213 PASS
- ai-city-recovery-test.cjs: 7/7 PASS
- miasta-zbyt-blisko-test.cjs: PASS (23281/23281 par planu w normie,
  25463/25463 par w realnej kolejności spawnu — TA ŚCIEŻKA ćwiczy
  bezpośrednio grantDifficultyStartBonusesForMajorCapital/pickBonusCityHex)
- found-from-village-test.cjs: 24/24 PASS
- hotseat-etap6f-part2-data-test.cjs: 24/24 PASS
- ai-war-gate-test.cjs: 24/24 PASS
- civ-configurator-opponent-test.cjs: 41/41 PASS
- cluster-spread-test.cjs: PASS
- civ-roster-test.cjs: 115/115 PASS
- capital-sep-pangea-test.cjs: 3/3 PASS
- cluster-start-q2-smoke.cjs: 16/16 PASS
- miasta-panstwa-wylaczone-test.cjs: BLOK infrastrukturalny (wymaga
  `git archive` PRE-tree do scratchpada — nie uruchamiane wcześniej w tej
  sesji, brak w allowliście przygotowania środowiska; NIE dotyczy zmiany,
  test porównuje pre/post main branch przez osobny mechanizm)
- cluster-start-test.cjs: 448/448 PASS + 8 FAIL — **identyczne 8 FAIL na
  czystym origin/main (zweryfikowane `git stash` + ponowny run)**, zero
  związku z tą zmianą (dotyczą hub-chain BFS i sea-distance dla obcych
  cywilizacji w cluster-start.ts, plik nietknięty w tym temacie)
- ai-test.cjs: 290/290 PASS + 5 FAIL — **identyczne 5 FAIL na czystym
  origin/main** (dotyczą dyplomacji `zaproponuj_handel`, niezwiązane)

`tsc --noEmit`: czyste (exit 0).
`git diff --check`: czyste (exit 0).

## Zmiany (allowlista)

- `gra/src/game/ai-difficulty-bonus.ts` — fix `pickBonusCityHex` (promień
  ograniczony do cityTerritoryRadius stolicy).
- `gra/tools/ai-founding-territory-test.cjs` — aktualizacja asercji B1e-a
  do akceptacji `isMe(ownerId)` jako równoważnika `ownerId===0`, plus nowa
  asercja B1e-isMe pilnująca definicji `isMe`.
- `gra/tools/diag-bonus-city-territory.cjs` (NOWY, diagnostyka trwała) —
  żywa symulacja wielosiewowa reprodukująca bug i dowodząca naprawy.
- `gra/tools/diag-teleport-live-sim.cjs` (NOWY, diagnostyka trwała) —
  żywa symulacja tura-po-turze realnego decideAITurn/planCityFounding,
  dowód że TA ścieżka nigdy nie miała naruszeń.

## Naruszone bariery

Brak. Bez zmian w `gra/`-niezależnych plikach dokumentacyjnych poza
raportem. Bez `npm run build`/`dev`. Bez `git add -A`. Bez aktualizacji
WERSJE.md. Commit lokalny wykonany, BEZ push/deploy.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja żywym dowodem (uruchom
diag-bonus-city-territory.cjs i ai-founding-territory-test.cjs), przegląd
diffa, potwierdzenie że B1e-c nie zostało osłabione.
DEPLOY/PUSH: NIE WYKONANO
