# R-WEB-ARMY-CONSOLIDATION-Q1 — runda 2, raport Operatora (odpowiedź na zarzuty Evaluatora)

STATUS: BLOCK (częściowa implementacja: pokój za flagą + pomiar krótki; wojna i pomiar pełny NIE zrobione w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-CONSOLIDATION-Q1
GOAL: Scalać wojska AI w jedne duże armie: w pokoju w stolicy; w wojnie tyle armii, ile wojen. Rozproszone grupki mają zniknąć.

Baza: `eeb60f0a` (runda 1 Operatora) = `origin/main d49c21c6` + `ed76682d`, `4a6b0791` (hak `?testhook=1`, commity lokalne `6711dae9`, `0f7b4fbc`). Pełne SHA: `ed76682dd072e8045c7cca87f8837c864004a6409`, `4a6b07916273fc66191b64da785925a81896f859`, `6711dae9fd581bb2c231ba5a27d811681df44af7`, `0f7b4fbca78fb8c4f26bb0b449398c77e69cbab6`, `6c14961cd5f1d82e092aba50330e9d2ca02fae29`, `eeb60f0ae31f041c61d57b15ff76b6fb32c22744`. Hak i harness są na gałęzi lokalnej `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na `main`.

## ZMIANY-COMMIT

Commit tej rundy: SHA w sekcji „Commit” na końcu (wypełniane po `git commit`).

Allowlista (zmienione pliki):
- `gra/data/army-consolidation-params.json` (nowy): `enabled: false`, `minArmyUnits: 2`, `fallbackToLargestCity: true`.
- `gra/src/game/army-consolidation.ts` (nowy, czysty moduł): `isArmyConsolidationEnabled` (+ `setArmyConsolidationOverride` tylko do testów), `pickConsolidationHub`, `planCapitalConsolidation`, `partitionArmiesForWars`.
- `gra/src/game/ai.ts`: pola `AITurnOpts.capitalCityId`, `AITurnOpts.warOpponentCount`; w `decideAITurn` blok `consolidationPlan` (tylko flaga ON, pokój). Przy `consolidationPlan !== null` lokalne skupianie (`planArmyConcentration`) i front-merge są pominięte, jednostki kwalifikujące się dostają krok w stronę stolicy, a jednostki w stolicy zostają (`concentrationDeferred`). Flaga OFF lub wojna: `consolidationPlan === null` i warunki wracają do bazowych.
- `gra/src/main.ts`: w `opts` AI dodane `capitalCityId: capitalCityIdForOwner(ownerId)` i `warOpponentCount` (liczba cywilizacji w wojnie, bez barbarzyńców). Nic więcej.
- `gra/src/game/test-hook.ts`: wpis `armyConsolidation: setArmyConsolidationOverride` w `FLAG_SETTERS` (tylko przez `?testhook=1`).
- `gra/tools/army-consolidation-test.cjs` (nowy): 31 asercji (czyste funkcje + wiring).
- `gra/tools/army-consolidation-measure.cjs` (nowy): pomiar w prawdziwej grze (Chromium, hak), jeden przebieg = jeden seed i jedna flaga, JSON-lines.
- `dyspozycje/autobot/runs/R-WEB-ARMY-CONSOLIDATION-Q1/02-operator-runda2.md` (ten raport).

Nie zmieniono: `gra/` poza wymienionymi, `WERSJE.md`, `rust-port/**`, brak `git add -A`, brak `npm run build|dev` w repo, brak push.

## TESTY

- `npx tsc --noEmit -p tsconfig.json` (w `gra/`): exit 0, bez błędów.
- `node tools/army-consolidation-test.cjs`: 31 passed, 0 failed.
- Mutacje (każda na kopii, przywrócona i sprawdzona `cmp`):
  - ignorowanie stolicy w `pickConsolidationHub` -> 1 czerwona asercja („capital preferred ... red”).
  - `k = 1` zamiast `min(warCount, units)` -> 3 czerwone („more wars than units ...”, i pokrewne).
  - usunięcie filtra `excludedUnitIds` -> 2 czerwone („excluded unit never appears”, „drop exclusion”).
  - po przywróceniu: 31/31, `cmp` identyczny z kopią.
- `node tools/army-concentration-test.cjs` (regresja bazowego skupiania): 55 passed, 0 failed.
- NIE_ZMIERZONO w tej rundzie (obciążenie maszyny, load ~50 na 4 vCPU; patrz BLOKADY): `ai-test` 276/18, `war-allin-capital` 95/0, `war-rules-multiwar` 55/0 + main-guard 21/0, `ai-move-range` 46/0, `barbarzyncy-krazenie` 249/0, `barb-city-behavior` 178/0, `endturn` 38/0 + exec 46/0, `load-game` 34/0, `diplomacy` 148/0, `logic` 213/213, `forced-war-*`, Vite build do scratch.

### Pomiar w prawdziwej grze (Chromium, hak `?testhook=1`, seed 101, 5 AI, 2 miasta-państwa, normal, kamień, gracz pasywny)

Pomiar wykonany dla flagi OFF (12 tur) i ON (patrz niżej). Metryki: grupy polowe per cywilizacja (łańcuchy odległości <= 4 między jednostkami poza miastem właściciela), największa grupa, jednostki w mieście-proxy (ZAŁOŻENIE: najludniejsze miasto, bo `rawPositions` nie zwraca stolicy), czas tury, pageerror.

OFF, tury 2–13 (surowe: `scratchpad/off-101.jsonl`): pageerror 0 we wszystkich turach; czas tury 11,7–33,9 s (przy obciążeniu maszyny). Każda cywilizacja (owner 1–4, 7, 8, 10, 13) ma w tym przedziale 1–4 jednostki; największa grupa polowa 1–2 jednostki; jednostek poza miastami łącznie 0–5 na turę. Dziesiątki jednostek, które opisuje właściciel, NIE wystąpiły w tym seedzie w tym przedziale.

ON (seed 101, 12 tur): NIE_ZMIERZONO. Przebieg `--flag on` zakończył się w `startSimGame` błędem `Target page, context or browser has been closed` (przeglądarka zamknięta, prawdopodobnie przez obciążenie maszyny współdzielonej; log: `scratchpad/on-101.log`). Zero linii danych ON, więc nie ma porównania ON vs OFF. Kod ON przechodzi tsc i testy jednostkowe, ale nie został zmierzony w grze.

## Odpowiedzi na zarzuty Evaluatora (1–12)

1. **Brak implementacji — PRZYJMUJĘ, częściowo.** Zrobione: flaga `ARMY_CONSOLIDATION_ENABLED` (JSON `enabled`, override testowy), parametry w `gra/data/army-consolidation-params.json`, moduł `army-consolidation.ts`, wiring w `decideAITurn` dla POKOJU (R-A pokój, R-B stolica, R-D formowanie przed wojną), doczepianie nowych jednostek w pokoju (nowe jednostki kwalifikują się i idą do stolicy w kolejnej turze). NIE zrobione: wiring wojenny (R-C: liczba armii = liczba wojen w `warAllInCapital.ts`) — w wojnie `consolidationPlan === null` i zachowanie jest bazowe; funkcja `partitionArmiesForWars` jest gotowa i przetestowana, ale nie podłączona. Zmiana obrony domu 1a (`assignHomeDefenders`) NIE zrobiona w tej rundzie (obrońcy domu nadal wykluczeni z konsolidacji, zgodnie z bazą).

2. **Brak pomiaru ON vs OFF, tury 40/60, seedy 102/103 — PRZYJMUJĘ.** Wykonano tylko seed 101, 12 tur, OFF i ON, pojedynczo. Przebiegi 20+ tur na maszynie z load ~50 (sesje równoległe) nie zmieściły się w rundzie. Seedy 102, 103, tury 40 i 60: NIE_ZMIERZONO.

3. **Brak pomiaru wojny — PRZYJMUJĘ.** NIE_ZMIERZONO: wiring wojenny nie istnieje (patrz pkt 1), więc nie ma czego mierzyć dla R-C.

4. **Pomiar bazowy nie odtwarza problemu — PRZYJMUJĘ jako fakt.** Seed 101 w turach 2–13 ma 1–4 jednostki na cywilizację. Dziesiątki jednostek w tym przedziale nie występują. Zakres do odtworzenia: tury 40–60 albo inny seed z większą armią. NIE_ZMIERZONO.

5. **Brak testów mutacyjnych, wiringu i determinizmu — PRZYJMUJĘ, częściowo (dowód: sekcja TESTY).** Zrobione: 31 asercji, w tym determinizm (ta sama kolejność po odwróceniu wejścia = ten sam plan) i wiring regexem w `ai.ts`/`main.ts`/`test-hook.ts`, 3 mutacje sprawdzone i czerwone. NIE zrobione: osobny plik `*-main-guard-test.cjs` w stylu istniejących oraz test na poziomie `decideAITurn` (wymaga pełnej gry lub rozbudowanego stubu).

6. **Flaga OFF = hash jak baza — NIE_ZMIERZONO (argument z kodu, bez pomiaru).** Dowód z kodu: `consolidationPlan` jest `null` gdy `isArmyConsolidationEnabled()` = false, więc `standardConcentration` = bazowy wzór (`consolidationPlan === null` jest prawdziwe), warunek front-merge jest bazowy, pętla `concentrationDeferred` dostaje wartości bazowe, a `opts.capitalCityId`/`warOpponentCount` nie wpływają na żadną decyzję poza blokiem flagi. Brak porównania hashy z bazą `d49c21c6` (nie odtworzono przebiegu bazy z tym samym hakiem na tej samej maszynie).

7. **Czas tury (×1,10), pageerror dla ON, zawieszenia końca tury — CZĘŚCIOWO.** OFF: 0 pageerror, czas tury 11,7–33,9 s, bez zawieszeń w 12 turach. ON: NIE_ZMIERZONO (przebieg nie wystartował grę). Limit ×1,10 NIE sprawdzony. Pełne 60 tur: NIE_ZMIERZONO.

8. **Zrzut porównawczy OFF vs ON w `evidence/` — NIE_ZMIERZONO.** Nie wykonano zrzutu ekranu; pomiar liczbowy jest w `scratchpad`, nie w repo.

9. **Bramki regresji nie uruchomione — CZĘŚCIOWO.** Wykonane: tsc (PASS), army-concentration-test 55/0 (PASS), army-consolidation-test 31/0 (PASS). NIE_ZMIERZONO: pozostałe bramki z dispatchu (lista w sekcji TESTY). Argument o braku regresji przy OFF jest w pkt 6.

10. **Załącznik 3 (przekreślone kółko) bez analizy — NIE_ZMIERZONO.** Trzeci zrzut nie został zapisany w repo (dispatch: „plik obrazu NIE został zapisany w repo — opis ze zrzutu”), więc nie da się go zweryfikować. Znaczenie ikony w UI nie zostało sprawdzone. Decyzja, czy jednostki z tym stanem podlegają scaleniu, wymaga zrzutu UI. Tymczasowo: scalanie obejmuje jednostki spełniające `isEligibleForArmyConcentration` (ruch > 0, nie garnizon, nie oblężenie, nie na statku); stan „przekreślone kółko” nie jest wykluczony osobno.

11. **Stolica = najwyższa populacja (założenie niezweryfikowane) — PRZYJMUJĘ i NAPRAWIONO.** Dane gry mają stolicę: `capitalCityIdByOwner` w `main.ts`, odczyt przez `capitalCityIdForOwner(ownerId)` (po utracie stolicy wskazuje nową, a przy braku wpisu najstarsze miasto). Ta wartość jest przekazywana do `opts.capitalCityId` w `main.ts` i używana przez `pickConsolidationHub`. Fallback na najludniejsze miasto jest tylko wtedy, gdy stolicy nie ma wśród miast właściciela. Dowód: asercje „capital preferred over larger city” i „capital owned by another owner is ignored” w `army-consolidation-test.cjs`, wiring `capitalCityId: capitalCityIdForOwner(ownerId)` w `main.ts`. Pomiar w grze używa miasta-proxy (`rawPositions` nie zawiera stolicy) — zaznaczone jako ZAŁOŻENIE.

12. **Raport bez pełnych SHA i bez powodu cherry-picków — PRZYJMUJĘ.** Pełne SHA podane w nagłówku. Powód: hak diagnostyczny (`?testhook=1`) jest potrzebny do pomiaru i nie może trafić na `main` (zakaz poza tematem), więc `ed76682d`/`4a6b0791` są cherry-pickami na bazie roboczej, a `6711dae9`/`0f7b4fbc` pozostają lokalne.

Uwaga proceduralna Evaluatora (lista kontrolna dotyczy innego tematu dyplomacji) — ODRZUCAM jako nieistotną dla tego dispatchu: ocena dotyczy wyłącznie dispatchu ARMY-CONSOLIDATION, zgodnie z tym, co Evaluator sam napisał.

## BLOKADY

- Wojna (R-C) nie zaimplementowana w tej rundzie: `partitionArmiesForWars` gotowa, brak wiringu w `warAllInCapital.ts`.
- Zmiana obrony domu (1a) nie zrobiona.
- Pomiar pełny (3 seedy × 60 tur × ON/OFF) nie wykonany: maszyna współdzielona (load ~50 na 4 vCPU, równoległe Chromium/vite z innych sesji); pojedynczy przebieg 12 tur trwał kilkadziesiąt minut. Przebieg ON nie dał danych (błąd przeglądarki na starcie gry, patrz TESTY).
- Brak zrzutu porównawczego i analizy załącznika 3.
- Brak testu na poziomie `decideAITurn`.

## ZAŁOŻENIA

- Garnizony miast (`inGarnizon`) nie są ruszane (wykluczone w `isEligibleForArmyConcentration`).
- Stolica = `capitalCityIdForOwner` z main.ts; fallback = najludniejsze własne miasto (`fallbackToLargestCity`).
- Limit wielkości armii = istniejący limit stosu (nie zmieniany). Ryzyko: przy dużej liczbie jednostek w stolicy hex może się zapełnić; nie zmierzono (NIE_ZMIERZONO).
- Pokój = `warOpponentCount === 0`. Cywilizacje w wojnie korzystają z bazowej logiki.
- Miasto-proxy stolicy w pomiarze = najludniejsze miasto właściciela.

## NASTĘPNY KROK

Runda 3 Operatora, ten sam temat: (a) wiring wojenny R-C (`partitionArmiesForWars` w `warAllInCapital.ts` za flagą), (b) zmiana obrony domu 1a za flagą, (c) pomiar ON vs OFF: seedy 101/102/103 × 60 tur, po jednym przebiegu, plus tury 40–60 dla seeda z większą armią, (d) zrzut porównawczy do `evidence/`, (e) bramki regresji z dispatchu, (f) baseline hash z bazy `d49c21c6` na tej samej maszynie. Dopiero potem Evaluator.

RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO
