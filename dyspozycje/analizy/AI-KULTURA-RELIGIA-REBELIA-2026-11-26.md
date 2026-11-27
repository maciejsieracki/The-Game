# AI „Kultura i religia: trudny” — dlaczego bunt skrajny nie daje rebelii (R-WEB-AI-CULT-REL-REBEL-Q1, runda 1)

Data: 2026-11-26. Baza: origin/main `0e4790cd1` (AICULTDIAG). Tylko diagnoza i pomiar. Zero zmian reguł, parametrów i balansu.
Zmiana w kodzie: wyłącznie rozszerzenie haka odczytu `__aiEconomyMeasure.cityStateTurn` w `gra/src/main.ts` (za `?civTest=1`, bez zapisu do stanu gry).

## Pytanie

Przy „Kultura i religia: trudny” (poziom maksymalny) ok. 40–50 % miast AI ma Porządek poniżej progu buntu skrajnego (14 %). Rebelii jest 0. Czy to ZAMIERZONE (okres łaski, ochrona garnizonem, brak buntów dla AI), czy BŁĄD (licznik łaski nie rośnie lub nie zeruje, AI pomijane w pętli buntów)?

## Rozstrzygnięcie

**ZAMIERZONE w kodzie, z jednym zastrzeżeniem: decyzja właściciela wymagana (DECISION_REQUIRED), patrz niżej.**

- Licznik łaski działa poprawnie dla miast AI: liczba miast w strefie łaski (`revoltWarning`) równa się liczbie miast krytycznych z pominięciem miast immunitetu osiedla, licznik spada do 0 i zostaje na 0. Nie znaleziono błędu w liczeniu.
- Rebelia jest zablokowana wyraźną bramką właściciela: warunek wejścia w rebelię wymaga `isHuman(city.ownerId)` (patrz „Ścieżka kodu"). Komentarz w kodzie opisuje to jako świadomą decyzję (R-HOTSEAT-ETAP6C-ECONOMY-Q1): „AI nie ma odpowiednika”.
- Większość miast AI w buncie skrajnym jest w ogóle poza łaską: immunitet osiedla (populacja 1–4) zeruje łaskę, więc miasta te nie dostają ostrzeżenia ani nie trafiają do rebelii. Ta immunitet jest też zamierzona (komentarz D-START-OSIEDLE: „brak migracji/rebelii”).

## Ścieżka kodu (numery linii w tym commicie)

| Krok | Miejsce | Co robi |
|---|---|---|
| Próg i łaska (parametry) | `gra/data/society-params.json` (`porzadek_prog_bunt_skrajny_pct`, `porzadek_grace_tur_bunt`) | hard: próg **14 %**, łaska **2 tury** (normal: 12 % i 3 tury; wartości 12 i 3 w `society-breakdown.ts:208-209` to tylko zapasowe) |
| Aktualizacja łaski | `gra/src/game/society-breakdown.ts:1203-1245` (`updateRevoltGrace`) | < próg: 2→1→0, potem `shouldTriggerRebellion = true`; ≥ próg: reset do null |
| Immunitet osiedla | `gra/src/game/society-breakdown.ts:481-489` (`isOsiedleRevoltImmune`, próg `prawo_bonus_osada_prog` = 4) | pop ≤ 4 → immunitet |
| Pętla tury, gałąź immunitetu | `gra/src/main.ts:45113-45123` | `osiedleImmune \|\| postCaptureLawActive` → `revoltGraceRemaining = null`, `revoltWarning = false`, bez aktualizacji łaski |
| Aktualizacja łaski (miasta bez immunitetu) | `gra/src/main.ts:45127` | `updateRevoltGrace` dla KAŻDEGO właściciela (AI też) |
| Bramka rebelii | `gra/src/main.ts:45137` | `if (graceUpd.shouldTriggerRebellion && isHuman(city.ownerId) && !city.rebelState)` — tylko człowiek |
| Migracja zamiast buntu | `gra/src/main.ts:~45170-45180` | warunek `!graceUpd.revoltWarning` — w strefie krytycznej migracja też jest zablokowana, dla każdego właściciela |
| Garnizon | `gra/src/main.ts:45047` (`garnizonCount: gCountLaw`), `brakGarnizonuKara` (pop ≥ 6 i 0 garnizonu) | garnizon wchodzi do Porządku jako kara/premia, NIE jest bramką rebelii |

## Pomiar (poziom maksymalny: „Trudny”, Kultura i religia „Trudny”, Koszty jednostek „Wysoki”, Porządek „hard”, 60 tur)

Komendy: `gra/tools/ai-cult-rel-measure-run.cjs --seed {4242|7} --kr trudny --difficulty trudny --pace wysoki --unit-flow 1 --city-state 1 --turns 60` (bundle vite zbudowany poza repo). Hak odczytu: `cityStateTurn(14)` oraz nowe pola w wierszu właściciela (`krytyczne`, `seria3`, `lacznaZero`, `poCapture`, `osiedle`, `rebeliaDozwolona`, `czlowiek`).

Dane surowe (JSONL, poza repo; SHA-256): `scratchpad/aicultrebel/trudny-4242/seed4242.jsonl` (fbaf1fda…) i `scratchpad/aicultrebel/trudny-7/seed7.jsonl` (31b595dc…). Wyprowadzenie per tura (tury 2–60, sumy po właścicielach AI i po graczu) jest w repo: `dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-REBEL-Q1/pomiar-t2-60-wyprowadzony.csv` (średniki; kolumny `ai_*` = miasta właścicieli AI, `gracz_*` = gracz). Tabele poniżej są odtworzone z tego CSV (sprawdzone ponownie w rundzie obrony: wartości t60 zgodne).

Uwaga o biegu s4242: jego podsumowanie (`seed4242.summary.json`) ma `startTurn: 20` i `resumed: true`, czyli tury 20–60 powstały z wznowienia ze slotu zapisanego w turze 20. Bieg s7 jest jednolity (`startTurn: 1`, `resumed: false`).

### Tura 60, miasta AI (właściciel > 0)

| Wielkość | s4242 | s7 |
|---|---|---|
| Miasta AI | 149 | 149 |
| Miasta AI poniżej 14 % (bunt skrajny) | 57 | 75 |
| z tego ≥ 3 tury z rzędu | 51 | 70 |
| z tego łaska wyczerpana (0) | 7 | 18 |
| z tego w immunitecie osiedla (pop ≤ 4) — bez łaski | 49 | 55 |
| z tego z ostrzeżeniem (`revoltWarning`) | 8 | 20 |
| z tego w okresie po przejęciu miasta (`postCaptureLawTurnsRemaining` > 0) | 0 | 0 |
| Miasta AI w rebelii (`rebelState`) | 0 | 0 |

Wiersz „Rebelie AI dozwolone warunkiem” został usunięty z tabeli: pole `rebeliaDozwolona` w haku jest liczone tylko dla `isHuman(właściciel)`, więc dla AI wynosi 0 z konstrukcji i nie jest pomiarem. Wstrzymanie migracji (osobny warunek w `main.ts` ok. 45170) NIE ZMIERZONO w tym haku.

Liczby krytyczne i ostrzeżenia: s7 w t60 daje 149 miast i 75 krytycznych dokładnie jak AICULTDIAG. Dla s4242 AICULTDIAG podał 153 miasta AI i 60 krytycznych, a ten bieg daje 149 i 57. Rozbieżność pojawia się od tury 50 (t30 i t40 zgadzają się co do miasta: 68 i 116). Najbardziej prawdopodobny kandydat to wznowienie biegu s4242 ze slotu w turze 20 (patrz wyżej); nie jest to potwierdzone, bo nie wykonano czystego biegu bez wznowienia. Status: NIE ROZSTRZYGNIĘTE. Tabela opiera się na tym biegu i wnioski jakościowe (bramka `isHuman`, immunitet osiedla) nie zależą od tej rozbieżności, bo są strukturalne.

### Oś czasu (miasta AI krytyczne / z łaską 0 / w immunitecie)

| Tura | s4242 krytyczne / łaska 0 / osiedle | s7 krytyczne / łaska 0 / osiedle |
|---|---|---|
| 10 | 14 / 0 / 14 | 15 / 0 / 15 |
| 20 | 4 / 0 / 4 | 7 / 0 / 7 |
| 30 | 6 / 0 / 5 | 9 / 0 / 8 |
| 40 | 22 / 1 / 20 | 32 / 0 / 26 |
| 50 | 42 / 8 / 33 | 53 / 11 / 39 |
| 60 | 57 / 7 / 49 | 75 / 18 / 55 |

Wniosek z osi: pierwsze miasta z łaską 0 pojawiają się w turze ok. 40–50, i dopiero wtedy licznik „zero” staje się widoczny. Nie ma ani jednego miasta AI, które przeszło przez łaskę i zostało zresetowane.

### Garnizon (wszystkie miasta AI w t60)

| Jednostek wojskowych w mieście | s4242 (149 miast) | s7 (149 miast) |
|---|---|---|
| 0 | 65 | 59 |
| 1 | 78 | 87 |
| 2 | 3 | 0 |
| 3 | 1 | 0 |
| 4+ | 2 | 3 |

Porównanie z potrzebnym garnizonem (`aiCityGarrisonNeedByCityId`) NIE ZMIERZONO: wartość potrzeby nie jest zapisywana w rekordzie tury, a hak nie łączy miast z rekordami garnizonu po id. Wymaga osobnego rozszerzenia haka i ponownego biegu; w tej rundzie nie wykonano. Z kodu wynika, że garnizon nie jest bramką rebelii (patrz tabela ścieżki), więc luka nie zmienia rozstrzygnięcia, ale zostaje otwarta jako punkt 3 dispatchu.

### Gracz (odniesienie)

Gracz ma w obu biegach jedno miasto. W s4242 nie jest krytyczne; w s7 jest krytyczne, ale w immunitecie osiedla (pop ≤ 4), więc łaska nie działa i rebelia nie może wystąpić. Porównanie „bunt skrajny → rebelia dla gracza” NIE ROZSTRZYGNIĘTE: w tych biegach nie wystąpiło niezwolnione miasto gracza w buncie skrajnym. Kod dla gracza jest ten sam, z `isHuman` = prawda, więc bramka w `main.ts:45137` przepuściłaby rebelię po wyczerpaniu łaski.

## Odpowiedzi na pytania z dispatchu

- **Ile miast AI w buncie skrajnym ≥ 3 tury z rzędu:** s4242 51, s7 70 (t60).
- **Ile ma garnizon ≥ potrzebny:** NIE ROZSTRZYGNIĘTE (potrzeba nie jest w rekordzie; patrz wyżej).
- **Co blokuje rebelię:** dla miast AI bez immunitetu bramka `isHuman(city.ownerId)` w `main.ts:45137`; dla większości miast AI wcześniej immunitet osiedla (`main.ts:45118`), który zeruje łaskę.
- **Czy to samo działa dla gracza:** ten sam kod, ale bez pomiaru w tym scenariuszu (NIE ROZSTRZYGNIĘTE).

## Zastrzeżenia do dispatchu

- Dispatch mówi o łasce „po 3 turach”. Dla poziomu `hard` obowiązuje **2 tury** (`porzadek_grace_tur_bunt.hard = 2`); 3 tury to poziom `normal`.
- Próg w dispatchu i w opisie UI to 14 % dla `hard`; wartości 12 i 3 z kodu to tylko zapasowe z `society-breakdown.ts:208-209`.
- Etykieta „Bunt skrajny” w pasmach Porządku (`cityOrderState`, `bandLabel`) pozostaje także dla miast w immunitecie osiedla, które nie mają łaski ani ostrzeżenia. To rozjazd prezentacji, nie mechaniki; nie zmieniano.

## DECISION_REQUIRED (bez rozwiązania; jedno zdanie skutku na wariant)

Pytanie do właściciela dotyczy tego, czy miasta AI mają się buntować przy wyczerpanej łasce, a nie tego, czy kod działa.

- **A: zostawić bez zmian.** Miasta AI w buncie skrajnym bez immunitetu osiągają łaskę 0 (7 miast w t60 w s4242, 18 w s7) i zostają w tym stanie, bez rebelii i bez utraty miasta.
- **B: zezwolić na rebelię także dla AI.** Miasta AI z wyczerpaną łaską (7–18 w t60) przechodziłyby do rebeliantów; zmienia to balans kontroli nad miastami AI i wymaga nowego pomiaru na poziomie maksymalnym przed decyzją.

## NIE ZMIERZONO (z powodami)

- Garnizon względem potrzeby (`aiCityGarrisonNeedByCityId`): potrzeba nie jest w rekordzie tury i nie ma haka łączącego miasto z garnizonem; wymaga osobnego haka.
- Rebelia gracza w buncie skrajnym: w obu biegach brak niezwolnionego miasta gracza w strefie krytycznej; wymaga scenariusza z takim miastem.
- Przyczyna rozjazdu s4242 po turze 50 względem AICULTDIAG (149 vs 153 miast AI w t60): nie zbadano.
- Inne ziarna i inne poziomy „Kultura i religia”: poza zakresem.

## Bramki (surowe wyjścia)

- `tsc --noEmit`: exit 0.
- `logic-test`: `LOGIC OK (213/213)`.
- `tech-tree-test`: `tech-tree-test: 20 pass, 0 fail`.
- `research-test`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `combat-test`: `COMBAT TEST: 6/6 pass`.
- `ai-test`: `ai-test: 297 passed, 0 failed`.
- `society-breakdown-test`: `56 OK, 0 FAIL`.
- `ai-city-order-need-wiring-test`: `231 passed, 0 failed (of 231)`.
- `ai-unit-replace-same-rules`: `45 passed, 0 failed`.
