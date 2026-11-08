# R-PR141-CODEX-SEMANTICS-DECISIONS-20261018 — literalne decyzje kontraktu

**Data:** 2026-10-18  
**Źródło:** literalne pytania i odpowiedzi właściciela z głównego czatu, przekazane Operatorowi przez root/orkiestratora. To zapis źródła w tej sesji, bez dopowiadania poza literalnym zakresem.  
**Zakres:** kontrakt precedencji sześciu pól G1 oraz hookup dwóch pól dyplomacji.  
**Granica:** decyzje semantyczne upoważniają do przygotowania osobnych dispatchów kodowych, nie stanowią acceptance produktu, READY_FOR_DEPLOY ani zgody na runtime/publikację.

## R-PR141-CODEX-SEMANTICS-DECISIONS-20261018-Q1 — G1: precedencja sześciu pól walki

**Pytanie właścicielskie — literalnie:**

> G1 — sześć pól walki: który kontrakt pierwszeństwa wybierasz? Pełne warianty i skutki są w 04-activation-contract-proposal.md w runie UNBLOCK-SEMANTICS. Aktywacja wymaga wyboru, bo macierz i stare bonusy pokrywają te same efekty.

**Literalna odpowiedź właściciela, 2026-10-18:**

> A — macierz zastępuje wyłącznie pokrywający efekt starego bonusu, także gdy komórka ma zero; pozostałe efekty zachowujemy.

**Skutek:** dla sześciu holdowanych pól G1 obowiązuje precedencja matrix-over-legacy wyłącznie dla tego samego efektu/statystyki i kategorii jednostki; wartość zero również wyłącza pokrywający efekt legacy. Pozostałe efekty/klauzule starego bonusu pozostają. W implementacji zachować tylko warunki, które faktycznie egzekwuje stary kod; sam opis nie tworzy nowego warunku frontalnego ani zasięgu. `walka_dystans_lukownicy` pozostaje mnożnikiem ataku pociskowego; nie staje się zasięgiem. HP oznacza zaakceptowany efekt maxHP, zastosowany jednokrotnie także w ścieżce kanonicznego maxHP. Tylko G1, bez akceptacji reszty macierzy.

## R-PR141-CODEX-SEMANTICS-DECISIONS-20261018-Q2 — `dip_nastawienie_bazowe`

**Pytanie właścicielskie — literalnie:**

> Dyplomacja — dip_nastawienie_bazowe: czy zatwierdzasz proponowany hookup dla wszystkich par głównych cywilizacji, symetrycznie: startZaufanie + (wartośćA−50)/2 + (wartośćB−50)/2, potem obecne modyfikatory i clamp 0–100, difficulty=normal; city-state pozostają poza zmianą? Szczegóły i alternatywy: pakiet aktywacji UNBLOCK-SEMANTICS.

**Literalna odpowiedź właściciela, 2026-10-18:**

> Tak — zatwierdzam ten konkretny kontrakt.

**Skutek:** zatwierdzony dokładny hookup dla wszystkich par głównych cywilizacji, symetrycznie: `startZaufanie + (wartośćA−50)/2 + (wartośćB−50)/2`; następnie obecne modyfikatory i clamp `[0,100]`, difficulty `normal`; city-state nie są objęte zmianą. Nie rozszerzać kontraktu na inne populacje ani relacje.

## R-PR141-CODEX-SEMANTICS-DECISIONS-20261018-Q3 — `dip_agresja_archetyp`

**Pytanie właścicielskie — literalnie:**

> Dyplomacja — dip_agresja_archetyp: czy zatwierdzasz zastąpienie źródła ai_agresywnosc/10 wartością tego pola 0–1 w istniejącym resolverze agresji głównych AI, bez sumowania; obecne downstream użycia, difficulty/clamp i fallback dla pozostałych przypadków zachowujemy? To zmieni bazową agresję tam, gdzie źródła się różnią.

**Literalna odpowiedź właściciela, 2026-10-18:**

> Tak — zatwierdzam zastąpienie źródła w tym zakresie.

**Skutek:** dla głównych AI istniejący resolver używa `dip_agresja_archetyp` (`0–1`) zamiast `ai_agresywnosc/10`, bez sumowania. Zachowuje dotychczasowe downstream użycia, efektywny operator difficulty, clamp i fallback dla pozostałych przypadków. Źródłowa `ai_agresywnosc` skala przesuwała normalizowaną wartość o `−1/10` na Easy, `0` na Normal i `+1/10` na Hard; dla nowej bazy `0–1` jest to równoważny offset `−0.1 / 0 / +0.1`, po czym dotychczasowy clamp `[0,1]`. To zachowuje istniejący efekt difficulty, nie dodaje źródłowej agresji ani sumowania `ai_agresywnosc`. Zatwierdzono zmianę bazowych wartości tam, gdzie źródła się różnią. Nie obejmuje innych consumerów/parametrów AI.

## Odczyt źródeł dla zakresu implementacji (2026-10-18)

- `civ-bonuses.ts` scala legacy z `civs.json` i matrix per owner. Sześć ID G1 jest w `excludedG1`; parser legacy rozkłada jeden wpis na staty, więc precedencja musi być per efekt, nie przez usunięcie całego wpisu. Faktyczne warunki starego kodu w `bonusApplies` obejmują owner-side, kategorię jednostki oraz rozpoznawane własne warunki lasu/szarży/terytorium/muru/płytkiego morza. Opis greckiej Falangi o froncie nie jest obecnie warunkiem runtime; opis zasięgu Chin również nie podłącza `walka_dystans_lukownicy` do `civAttackRangeMultiplier`.
- `combat.ts` ma już wspólny tor statystyk i osobne gałęzie canonical/fallback HP. Zaakceptowany efekt maxHP wymaga dodania `civHealth` do obu limitów kanonicznych i fallbackowych dokładnie raz; nie zmienia to bieżącego HP ani nie dodaje drugiego mnożenia.
- `cluster-start.ts` jest jedynym obecnym callerem `startRelationForPair`; `startRelations` przechowuje relację per AI owner wobec `HUMAN_OWNER_PRIMARY`. `main.ts` ma istniejący ogólny magazyn par `diplomacyRelations` i symetryczne `setDiploRelation(a,b,rel)`, używane także dla par bez gracza. Żeby spełnić literalne „wszystkie pary głównych cywilizacji”, dispatcher musi obejmować każdą aktywną parę major-ownerów w tym istniejącym magazynie, także AI↔AI i aktywnych human-seat owners; wykluczyć city-state. Nie tworzyć alternatywnego systemu relacji.
- `resolveArchetypeAggression` jest wołany w pełnej ścieżce AI major, z difficulty; minor ma wcześniejszą odrębną ścieżkę. `ai_agresywnosc` to skala, a `dip_agresja_archetyp` jest `mul_abs`, więc zwykłe `civMatrixParamAtDifficulty` dla nowego ID jest płaskie. Literalny wybór zachowania difficulty oznacza przeniesienie istniejącego znormalizowanego offsetu ±0.1 na zatwierdzone nowe źródło i dotychczasowego clampu; testy muszą sprawdzić easy/normal/hard dla baz 0, wartości wewnętrznej i 1.

## Stan wykonania

Decyzje zapisano w `dyspozycje/PYTANIA-OTWARTE.md` pod tymi samymi pełnymi ID Q1–Q3. Przygotowanie proposed dispatchów G1 i DIP jest osobnym artefaktem w runie `R-PR141-CODEX-SEMANTICS-DECISIONS-20261018`; nie rozpoczyna implementacji. Nie zmieniono danych, classifiera, kodu ani statusu acceptance produktu.
