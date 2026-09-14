# R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Final Control, runda 2/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
RUN: attempt-20260913
ROLE: Final Control
ROUND: 2/5
ATTEMPT: 1
MODEL+EFFORT: gpt-5.6-luna, max
PROVIDER: openai-codex
PROFILE: the-game-bugs
BASE HEAD: 2b94ca8242b614b599bf3bf6624bafedca6190a2
HEAD: b6971e1a3de1980ce92d7477962dd1e9be278c75
BRANCH: hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs

GOAL: niezależnie sprawdzić gotowość wsadu nazw, rzeczywisty diff, allowlistę, raporty Operatora i Evaluatora, hashe, liczniki, testy i granice procesu; nie integrować i nie publikować.

## WERDYKT

PASS. Kontrola końcowa potwierdziła kompletność i spójność materiału. Wsad może przejść do Orkiestratora jako INTEGRATION_REQUIRED. Nie jest to zgoda na merge, push ani deploy.

## ŁAŃCUCH ETAPÓW

- Operator `t_ba1a3b03`: task record ma status `done` i terminalny event `completed`; receipt/operator report mają `PASS`, run `attempt-20260913`, source HEAD `0b95694b73c429d01d8b65942235f2863947f986`.
- Evaluator `t_5934752f`: task record ma status `done` i terminalny event `completed`; receipt/evaluator report mają `PASS`, objections `[]`, source HEAD `2b94ca8242b614b599bf3bf6624bafedca6190a2`.
- Oba etapy wskazują ten sam temat, próbę, worktree i właściwy następny etap. Hashe ich report/evidence/progress/journal są zgodne z receiptami; szczegóły są w `03-final-control-evidence.md`.

## ZAKRES I PROVENANCE

- Roboczy diff produktu zawiera wyłącznie `gra/data/civs.json`, `gra/src/game/civ-names.ts` i `gra/tools/civ-names-test.cjs` — wszystkie trzy są w allowliście.
- Delta zatwierdzona między HEAD Evaluatora `2b94ca82` a bieżącym HEAD to wyłącznie oczekiwany `03-dispatch.md`. Zmiany produktu pozostają niezatwierdzone w worktree, zgodnie z zakazem integracji.
- Istniejące artefakty Operatora i Evaluatora oraz pięć artefaktów Final Control leżą wyłącznie pod `attempt-20260913/`, czyli w allowliście bieżącej próby.
- Nie ma usuniętych ścieżek, nieuzasadnionych usunięć ani trafień wzorców poświadczeń w trzech zmienionych plikach. `git diff --check` przechodzi.

## AUDYT PUL

Dla wszystkich 15 cywilizacji bezpośrednio przeliczono dane z `city-names-pools.json` i `civs.json`:

ID           | MC n/e/d | MP n/e/d | MC∩MP | lustro nazwyMiast=MC | MC[0]           | MP[0]
-------------|----------|----------|-------|----------------------|-----------------|-------------
grecy        | 100/0/0  | 10/0/0   | 0     | TAK                  | Ateny           | Sykion
rzymianie    | 100/0/0  | 10/0/0   | 0     | TAK                  | Rzym            | Nola
chinczycy    | 100/0/0  | 10/0/0   | 0     | TAK                  | Xi'an           | Qin
inkowie      | 100/0/0  | 10/0/0   | 0     | TAK                  | Cusco           | Maras
zulusi       | 100/0/0  | 10/0/0   | 0     | TAK                  | uMgungundlovu   | esiPhezi
egipt        | 100/0/0  | 10/0/0   | 0     | TAK                  | Memfis          | Tinis
sumer        | 100/0/0  | 10/0/0   | 0     | TAK                  | Uruk            | Hamazi
celtowie     | 100/0/0  | 10/0/0   | 0     | TAK                  | Bibracte        | Titelberg
germanie     | 100/0/0  | 10/0/0   | 0     | TAK                  | Mattium         | Eketorp
harappa      | 100/0/0  | 10/0/0   | 0     | TAK                  | Harappa         | Shortugai
hetyci       | 100/0/0  | 10/0/0   | 0     | TAK                  | Hattusa         | Kussara
slowianie    | 100/0/0  | 10/0/0   | 0     | TAK                  | Kijów           | Radogoszcz
babilonia    | 100/0/0  | 10/0/0   | 0     | TAK                  | Babilon         | Bit-Jakin
asyria       | 100/0/0  | 10/0/0   | 0     | TAK                  | Aszur           | Ekallatum
fenicjanie   | 100/0/0  | 10/0/0   | 0     | TAK                  | Byblos          | Iol

Agregaty: regularne MC = 1500 slotów / 1381 unikalnych / 94 powtarzające się różne nazwy / 119 powtórzeń; MP = 150 / 150 / 0 / 0. Globalne przecięcie rodzin wynosi 3 (`Bit-Jakin`, `Bit-Dakkuri`, `Bit-Amukani`) i występuje między `asyria:miasta_cywilizacji` a `babilonia:miasta_panstwa`; kontrakt wymaga rozłączności w obrębie każdej cywilizacji, która wynosi 0.

Etykiety skalarne: 15 wierszy, 15 unikalnych nazw cywilizacji, 0 pustych, 0 duplikatów. Jedynym równym słowem w puli miast jest eponim `Harappa` dla `harappa`; nie jest to kolizja lokalna MC×MP.

## ŚCIEŻKA GRECJI I NAPRAWA

- `loader.ts:19,421` ładuje i wystawia `cityNamesPools`.
- `cluster-spawn.ts:227,410` przekazuje pule do stolicy gracza; `:354` przekazuje je do stolicy obcego klastra; `:357-358` przekazuje je do rywali.
- `city-names-pool.ts:94-97` i `:159-162` czytają `miasta_cywilizacji[0]` dla stolicy gracza/AI; `:105-142` czyta `miasta_panstwa[1..]` dla rywali.
- `civ-names.ts:67-73` i `:106-113` na ścieżce bez puli preferują `civs.json:nazwyMiast[0]`, a przy braku tego eksportu zachowują fallback do `nazwyKlastra[0]`. `clusterRivalCityName` nadal korzysta z MP/nazwyKlastra.
- Bez puli stary blob `ff9ce26` zwrócił dla Greków `Sykion/Sykion` (gracz/obca stolica); bieżący kod zwraca `Ateny/Ateny`. Przy pulach bieżący kod zwraca `Ateny` dla stolic i `Fliunt` dla pierwszego rywala. Izolowany eksport legacy bez `nazwyMiast` nadal zwraca `Sykion`.
- `civs.json` synchronizuje dwa lustra regularne: Asyria zaczyna się od `Aszur` przy zachowanym `Ninive`, Fenicjanie od `Byblos` przy zachowanym `Tyr`. Nie zmieniono puli źródłowej, generatora ani ścieżki display.

## TESTY I GRANICE

- `nazwy-miast-rozlaczne-pule-test.cjs`: 9 passed, 0 failed.
- `city-names-pool-test.cjs`: 12 passed, 0 failed.
- `city-names-pools-test.cjs`: 6 passed, 0 failed.
- `civ-names-test.cjs`: 66 passed, 0 failed.
- `display-names-test.cjs`: 27 passed, 0 failed.
- `mapa-etykieta-stolicy-test.cjs`: 47 passed, 0 failed.
- TypeScript `5.9.3`, `tsc --noEmit`: exit 0 po użyciu tymczasowego symlinku do istniejących zależności; symlink usunięto i nie pozostał w worktree. Próba samego `NODE_PATH` nie jest liczona jako typecheck projektu, ponieważ resolver TypeScriptu nie używał tego mechanizmu.
- `git diff --check`: PASS. Skan zmienionych plików pod kątem kluczy/poświadczeń: 0 trafień. Brak usuniętych ścieżek.
- `npm run build`/`npm run dev` nie uruchamiano: procedura repozytorium zakazuje tych komend w `gra/`. Browser/desktop runtime nie był wymagany dla tego audytu danych i czystych funkcji; test etykiet mapy jest statyczną bramką bez zmiany renderera.

## GRANICA INTEGRACJI

`product_approval: false`. `integration_status: INTEGRATION_REQUIRED`. `push_merge_deploy: NOT_PERFORMED`. Final Control nie wykonał naprawy, `git add`, cherry-pick, reset, clean, stash, rebase, force-push, push, PR, merge ani deployu. Następny krok: Orkiestrator integruje wsad po własnej bramce; dopiero osobna autoryzacja może dopuścić publikację.

BLOKADY: brak.
NASTĘPNY KROK: INTEGRATION_REQUIRED → Orkiestrator; bez samodzielnej integracji/publikacji.
DEPLOY/PUSH/PR/MERGE: NIE WYKONANO

REPORT SHA256: bcd63edd6d8844b7342258a1ad0ccbda4a3c72ffd3e8b4d7bff6f718b52789cf
REPORT HASH CONVENTION: SHA-256 tego pliku z literalnym `<REPORT_SHA256>` przed podstawieniem wartości.
