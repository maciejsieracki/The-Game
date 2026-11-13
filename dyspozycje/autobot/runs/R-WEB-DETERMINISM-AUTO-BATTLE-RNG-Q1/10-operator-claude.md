# R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — Operator (runda 1/5, HAIKU)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1
GOAL: walki automatyczne (resolveAutoBattleByPower) losują z ziarna gry zamiast Math.random; ten sam przebieg dla tego samego ziarna także przy bitwach; pomiar: wszystkie przebiegi jednej konfiguracji mają ten sam skrót stanu.
BAZA/KANDYDAT: ff25b42ad (origin/main), worktree detached (`git checkout --detach ff25b42ad`). Model: Operator HAIKU.
SHA: patrz pole sha w odpowiedzi (commit z kodem i raportem).

## 1. Wywołania (stan przed zmianą, ff25b42ad)

| Miejsce | Wpływ na stan gry | Źródło losowania przed | Po tym temacie |
|---|---|---|---|
| main.ts:34209 doMapAutoResolve (atak na miasto, mapa) | TAK (rozstrzyga walkę) | Math.random (brak rng) | `autoBattleRng(defQ, defR, atkLead.id)` |
| main.ts:34688 funkcja auto-walki (barbarzyńcy/AI, `battleQ/battleR`) | TAK | Math.random | `autoBattleRng(battleQ, battleR, atkRoster[0].id)` |
| main.ts:34959 doMapAutoResolveIncoming | TAK | Math.random | `autoBattleRng(battleQ, battleR, atkLead.id)` |
| main.ts:37483 auto-szturm miasta (bez wyłomu) | TAK | Math.random | `autoBattleRng(city.q, city.r, atkRoster[0].id)` |
| main.ts:37670 doSiegeAutoResolve (szturm po potwierdzeniu) | TAK | Math.random | `autoBattleRng(city.q, city.r, atkLead.id)` |
| battle/mapFieldBattle.ts:476 (atak z mapy, C1) | TAK | Math.random (brak rng) | `deps.autoBattleRng?.(city.q, city.r, anchor.id)`; main podaje dep `autoBattleRng` |

Uwaga do dispatchu: w gra/src/main.ts jest 5 wywołań `resolveAutoBattleByPower` (nie 6); łącznie z mapFieldBattle.ts są 6 wywołań.

combat.ts:890 (`resolveCombat`): wołający w gra/src bez rng to
- battle/battleScene.ts:20795 (ścieżka "Pomiń" — wynik bitwy zmienia stan) — battleScene.ts poza zakresem tematu (ZAKAZ: tylko wylistować Math.random), NIE naprawione;
- battle/manualBattle.ts:1062 (bitwa ręczna) — poza allowlistą, NIE naprawione.
Wpływ na stan: TAK. Kandydat do osobnego tematu (wymaga zgody na battleScene.ts / manualBattle.ts).

siege.ts:659 (`resolveSiegeAttack`): brak wołających w gra/src (tylko tools/*.cjs i testy). Wpływ na stan w grze: brak. Domyślny rng zostaje jako zabezpieczenie API.

ai.ts:3215 (`aiFoundingRand`): NIE jest Math.random — to deterministyczny LCG (`playerId*10007 + turn*7919`). Nie zależy od ziarna gry, ale jest powtarzalny; nie zmieniano.

## 2. Naprawa (zakres: auto-walka)

- gra/src/main.ts: nowy helper `autoBattleRng(defQ, defR, atkId)` = `gameStreamRng(_gameSeed, turn, 'auto-battle:<defQ>:<defR>:<atkId>')` (obok `detIdSuffix`); 5 wywołań `resolveAutoBattleByPower({ mAtk, mDef, rng: ... })`; dep `autoBattleRng` w `mapFieldBattleDeps`.
- gra/src/battle/mapFieldBattle.ts: opcjonalny dep `autoBattleRng` w `MapFieldBattleLaunchDeps`; wywołanie z `rng: deps.autoBattleRng?.(...)`.
- Rozkład losowości gracza bez zmian (ten sam mulberry32 i ten sam próg upsetu); zasada „Trafienia: losowe / pewne” bez zmian (tryb pewny nadal wyłącza rzut).
- `resolveAutoBattleByPower` nadal ma domyślne `Math.random` dla wołających bez rng (testy); wszystkie wołania w grze podają rng (test D1).

Luka do decyzji (ZAŁOŻENIE): w tym samym turze dwie auto-walki przeciwko temu samemu hexowi i z tym samym liderem dostają ten sam strumień (salt bez licznika). Nie wystąpiło w pomiarze; nie naprawiano (poza allowlistą licznika, a licznik po wczytaniu zapisu byłby niedeterministyczny w inny sposób).

## 3. Test źródłowy: gra/tools/determinism-same-seed-test.cjs

- Dodano D1: każde wołanie `resolveAutoBattleByPower({...})` w gra/src podaje klucz `rng` i nie zawiera `Math.random` (wołań: 6).
- Dodano D2: main.ts wiąże `autoBattleRng` z `gameStreamRng(_gameSeed, turn, 'auto-battle:'...)` i przekazuje go do `mapFieldBattleDeps`.
- Wyjątki zaktualizowane (uzasadnienia): combat.ts (wołający battleScene/manualBattle — wpływ TAK, poza zakresem), siege.ts (brak wołających w grze), auto-battle-power.ts (domyślny rng tylko dla wołających bez rng). Klucze wyjątków nie zostały usunięte, bo linie nadal istnieją w kodzie.

Wynik: `node tools/determinism-same-seed-test.cjs` → 12/12 PASS, exit 0 (A1–A7, B1–B2, C1, D1–D2). Liczba trafień Math.random w gra/src/game/** = 10 (bez zmian, 8 wyjątków).

Mutacje pojedyncze (per miejsce; sed zastępuje `rng: ...` przez `rng: Math.random`, plik przywrócony, cmp OK):

| Mutacja | Wynik testu |
|---|---|
| main.ts:34212 (doMapAutoResolve) | FAIL C1 + FAIL D1 |
| main.ts:34691 | FAIL C1 + FAIL D1 |
| main.ts:34962 | FAIL C1 + FAIL D1 |
| main.ts:37487 | FAIL C1 + FAIL D1 |
| main.ts:37674 | FAIL C1 + FAIL D1 |
| battle/mapFieldBattle.ts:481 | FAIL D1 |

Każda z 6 mutacji czerwieni test źródłowy.

## 4. Pomiar: gra/tools/measure-ai-trade-offer-frequency.cjs (rozszerzony skrót)

Rozszerzenia:
- hook `__aiTradeWiringTestDebug.state()` (main.ts): pole `digest` = liczba jednostek, skarbiec i zasoby magazynów miast, per właściciel (gracz 0 + właściciele startowi AI). Tylko odczyt.
- runner: `perTurn[i].digest`, `trajectorySha256_12` (sha256 z całego perTurn), `digestFirst/digestLast`.

Przebiegi (ustawienia: MEAS_ARM=prepared, MEAS_REL=20, MEAS_TURNS=40, bundle vite zbudowany poza repo do scratchpad; dowody: `dyspozycje/autobot/runs/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1/evidence/`):

| Przebieg | Ziarno | Tryb | turnsRun | trajectorySha256_12 | oferty | Uwagi |
|---|---|---|---|---|---|---|
| f2222-1 | 2222 | przyspieszony | 40 | 843e6c40f1bd | 1 | |
| f2222-2 | 2222 | przyspieszony | 40 | 4917febd9c04 | 1 | |
| f2222-3 | 2222 | przyspieszony | 40 | e4f668f2cf6b | 1 | |
| f2222-4 | 2222 | przyspieszony | 40 | 0503664d4a20 | 1 | |
| f2222-5 | 2222 | przyspieszony | 40 | b5dbd8d9c170 | 1 | |
| f2222-6 | 2222 | przyspieszony | 40 | 9a893279de75 | 1 | |
| n2222-1 | 2222 | normalny | 13 | b734addefb2f | 0 | limit czasu 200 s (przebieg niepełny) |
| n2222-2 | 2222 | normalny | 18 | 7c87972c7ea8 | 0 | limit czasu 200 s (przebieg niepełny) |
| n2222-3 | 2222 | normalny | 15 | 2246beda7a19 | 0 | limit czasu 200 s (przebieg niepełny) |

Wynik:
- Przebiegi przyspieszone 2222: 6 różnych skrótów → KRYTERIUM NIE SPEŁNIONE.
- Pierwsza tura rozbieżności (porównanie perTurn, pierwsze pole): tura 22 w przebiegach f2222-3, -5, -6 względem f2222-1 (pole `digest.treasury.1`, skarbiec AI właściciela 1: 581 vs 584 / 581 vs 584 / 581 vs 584); tura 23 w f2222-2 (`digest.treasury.1`: 583 vs 581); tura 25 w f2222-4 (583 vs 585).
- Pola jednostek (`digest.units`), relacji (`relTotalAi`) i ofert zgadzają się do tej tury; pierwsza różnica jest w skarbcu AI.
- Normalny tryb: 40 tur nie zostało zrealizowane w limicie 200 s (~10 s/tura w trybie normalnym). Przebiegi niekompletne, nieporównywalne; NIE_ZMIERZONO dla 3 pełnych przebiegów normalnych i drugiego ziarna.
- Drugie ziarno (1717): NIE_ZMIERZONO (budżet).
- Mutacja w pomiarze (przywrócenie Math.random w auto-walce i powtórka pomiaru): NIE_ZMIERZONO. W 40 turach `autoBattles` = 0 w tym scenariuszu, więc mutacja auto-walki prawdopodobnie nie zmieni skrótu; do sprawdzenia w scenariuszu z bitwami.

Korekta do poprzedniego tematu (R-WEB-DETERMINISM-GAME-RNG-Q1, ff25b42ad): raport tamtego tematu podawał 6/6 identycznych przebiegów przyspieszonych (30 tur). Skrót tamtego runnera nie obejmował skarbca ani jednostek. Rozszerzony skrót pokazuje rozbieżność skarbca AI od tury 22. Tamten wniosek o pełnym determinizmie był więc niepełny.

## 5. Testy regresji (liczby z surowego wyjścia)

- `npx tsc --noEmit` (gra/): exit 0 (po zmianie hooka i runnera także).
- logic-test: `LOGIC OK (213/213)`, exit 0.
- tech-tree-test: `20 pass, 0 fail`, exit 0.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- combat-test: `COMBAT TEST: 6/6 pass`, exit 0.
- determinism-same-seed-test: `WYNIK: PASS`, exit 0.
- Asercje losowe NIE były osłabiane.

## 6. Pytanie 5 z dispatchu: kolizja _detIdSeq po wczytaniu zapisu

ANALIZA (nie zreprodukowano, NIE naprawiono — poza allowlistą): `_detIdSeq` (main.ts ~2008) jest licznikiem w domknięciu i NIE jest zapisywany w zapisie. Po wczytaniu zapisu w tej samej turze (lub po przeładowaniu strony) licznik startuje od 0 albo od bieżącej wartości, a `gameIdSuffix(seed, turn, salt, seq)` daje te same sufiksy co w zapisie dla tych samych (salt, seq). Ryzyko: duplikaty ID nowych jednostek/obozów z ID istniejącymi w zapisie. Naprawa wymagałaby zapisu licznika w zapisie (save.ts/main.ts load — poza allowlistą) albo salta z licznikiem sesji.

## 7. UWAGI-DLA-ORKIESTRATORA

1. KRYTYCZNE dla celu „pełny determinizm”: skarbiec AI rozjeżdża się od tury 22 przy tym samym ziarnie (6/6 przebiegów przyspieszonych). Źródło NIE ZIDENTYFIKOWANE. Podejrzenia do sprawdzenia w osobnym temacie (poza allowlistą tego tematu):
   - gra/src/game/armyMerge.ts:75 — identyfikatory grup stosów `'sg' + ownerId + '_' + Date.now().toString(36) + ...` (zegar ściennny w ID; jeśli ID wpływają na sortowanie/kolejność, zmienia wynik);
   - gra/src/game/cities.ts:89 — `budowa-lista-${Date.now()}-...` (ten sam problem, mniej prawdopodobny);
   - Math.random poza gra/src/game w src/audio/** i src/battle/battleScene.ts — tylko dźwięk/animacja (nie powinny wpływać na stan, nie sprawdzono).
   Propozycja: osobny temat „R-WEB-DETERMINISM-AI-TREASURY-DRIFT-Q1” z pomiarem na skrócie (ten runner już to wykrywa, pole digest.treasury.1).
2. combat.ts:890 — `resolveCombat` bez rng w battleScene.ts:20795 (Pomiń) i manualBattle.ts:1062: wpływ na stan TAK. Wymaga zgody na battleScene.ts/manualBattle.ts.
3. Dispatch mówi „6× w main.ts”; faktycznie 5× w main.ts + 1× w mapFieldBattle.ts.
4. Runner w trybie normalnym: ~10 s/tura; do 40 tur potrzeba MEAS_MAX_SEC ≥ 450 albo wznowienia przez MEAS_PROFILE. Orkiestrator powinien ustawić to w dispatchu kolejnej rundy.
5. Mutacja pomiarowa i drugie ziarno nie zostały wykonane (budżet rundy).

## RUNDY
1/5 (brak FAIL/BLOCK z kodu; FAIL wynika z kryterium pomiaru — do decyzji Evaluatora/orkiestratora).

## NASTĘPNY KROK
Evaluator (SONNET): zweryfikować diff (main.ts 5 wywołań + helper + dep, mapFieldBattle.ts, test D1/D2, mutacje), wynik pomiaru (6 różnych skrótów, rozjazd skarbca AI od t22) i decyzję o temacie skarbca AI (UWAGA 1).

DEPLOY/PUSH: NIE WYKONANO


---

# RUNDA 2 (2026-11-13) — R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — Operator (Haiku), baza 3f6fb4879

STATUS: BLOCK (bez zmian kodu gry; źródło dryfu NIE zidentyfikowane)
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1
GOAL: ten sam skrót stanu dla tego samego ziarna we wszystkich przebiegach (z bitwami automatycznymi i oblężeniami), bez zmiany reguł gry.
ZMIANY-COMMIT: brak zmian w gra/src ani w gra/tools. Commit tylko tego raportu i dowodów (patrz sekcja DOWODY). Czubek pracy: commit tego raportu (SHA w polu sha wyniku Operatora).

## Co zrobiono w rundzie 2

1. Odczytano dispatch rundy 2 (DODATEK w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0; oryginalny 00-dispatch.md jest w tej samej gałęzi, nie w origin/main) i stan kandydata 3f6fb4879 (zawiera commit r1 38752ec01 i obronę r2).
2. Uruchomiono pomiar przyspieszony (MEAS_FAST=1), ziarno 2222, 40 tur, natural, na zbudowanym bundlu (vite build poza repo, 27 s). Jeden przebieg trwa ok. 1 min 46 s, więc mieści się w jednym wywołaniu Bash.
3. Porównano trzy przebiegi tego samego ziarna i tej samej konfiguracji (skrót z perTurn, pola digest per tura).
4. Przeszukano kod pod kątem źródeł niedeterminizmu (lista poniżej).

## Wyniki pomiaru (surowe liczby z plików JSON)

| przebieg | trajectorySha256_12 | pierwsza rozbieżność digest |
|---|---|---|
| A (f2222-a.json) | bc1e99ec053f | — |
| B (f2222-b.json) | 3034535b8eff | tura 28, treasury[1]: 469 vs 467 |
| C (f2222-c.json, z MEAS_LOGRE) | beb31cc01c39 | tura 27, treasury[1]: 360 vs 359 (vs A) |

- Wszystkie trzy przebiegi: turnsRun = 40, stoppedBy = koniec przebiegu.
- Różnice są w skarbcu AI właściciela 1 (kilka sztuk), a w przebiegu C także w stock[1] (drewno 27 vs 42, ceramika 489 vs 491) i w units[1] (12 vs 11) od tury 29. Właściciel 0 (gracz) jest identyczny.
- Skrót nie jest powtarzalny nawet dla tego samego ziarna w tej samej konfiguracji (A, B, C różne). Pierwsza rozbieżność przesuwa się między przebiegami (t27 / t28), co wskazuje na zależność od czasu rzeczywistego, a nie na stały błąd w logice.
- Logi konsoli z przebiegu C (MEAS_LOGRE): nie widać „Force-clearing stuck transition” ani „orphan”. Uwaga: runner trzyma tylko ostatnie 60 dopasowań (`shift`), więc wcześniejsze wpisy mogły zostać odrzucone; to NIE_ZMIERZONO w całości.

Hipoteza z dispatchu o `Date.now()` w ID (armyMerge.ts:75, cities.ts:89) jest OSŁABIONA: stackGroupId jest używany wyłącznie do porównań równościowych (`stackGroupIdOf(a) === stackGroupIdOf(b)`), a `budowa-lista-*` nie jest sortowany. Nie znaleziono sortowania po tych ID wpływającego na skarbiec. Nie jest to jednak wykluczone w 100 % (nie prześledzono każdej ścieżki tych ID).

## Przegląd źródeł niedeterminizmu (grep, bez zmian)

- Math.random w gra/src/game/**: wszystkie wołania w ścieżce tury podają rng (zgodnie z WYJATKAMI testu); pozostałe domyślne są martwe w grze. Test determinism-same-seed-test.cjs: PASS (wszystkie checki A1–D2).
- Math.random poza gra/src/game: battleScene.ts:11308/11345/11379/11397/11499/11503 (dźwięk i efekty, zakaz edycji); map/gen-helpers i generator.ts (Date.now jako fallback ziarna mapy, tylko gdy seed=0); main.ts:2005 i 45764 (ziarno nowej gry, poza turą).
- Czas rzeczywisty w logice tury (kandydaci):
  - main.ts:38695 i 44426: `endTurnStartedAt`/`Date.now()`; wymuszone wyczyszczenie „stuck transition” po 8 s (`stuckMs > 8000`) zmienia stan (`endTurnInProgress`, `aiTurnAwaitingBattle`, `aiCmdResume`). To jedyna ścieżka czasowa, która mutuje stan tury.
  - ui/preBattle.ts:251/362: `enqueuedAt: Date.now()` i `oldestPendingAutoPreBattleAgeMs()` używane przez healStaleEndTurnBlockers (próg 8 s) — zależne od czasu.
  - main.ts:44866–44895: pętla renderu liczy `dt` z performance.now() (cap 100 ms) i napędza `anim.t`; jeśli postęp animacji bramkuje kroki AI, interleaving zależy od zegara.
  - main.ts:44547 i 45686/45698: `setTimeout` (100 ms wait na bitwę gracza; yieldMainThread 0 ms) w sekwencji runWorldEndTurn — punkty oddania wątku, w których inne callbacki (render, runner) mogą wejść między krokami AI.
- Wniosek roboczy: najbardziej prawdopodobne źródło to przeplot kroków AI z callbackami czasowymi (yield/timery/animacja), a nie generator RNG. Nie udowodniono tego: NIE_ZMIERZONO.

## Dlaczego BLOCK, a nie naprawa

- Bisekcja dryfu wymaga instrumentacji wewnątrz runWorldEndTurn (zapis skarbca per krok AI) i kilku przebiegów na krok. Jeden przebieg kosztuje ok. 2 min, więc ukończenie bisekcji i pomiaru po naprawie (≥6 przebiegów przyspieszonych ×40 tur na dwóch ziarnach + ≥3 normalne) wymaga wielu wywołań, na które ta runda nie miała budżetu.
- Nie wprowadzono zmiany źródła, bo żadne z podejrzanych miejsc nie zostało wskazane dowodem (zgodnie z zasadą „hipotezy do SPRAWDZENIA, nie do zgadywania”).
- Mutacja i kryteria końca (tsc, logic 213/213, tech-tree, research, unit-replace, combat, determinism-same-seed-test z mniejszą listą wyjątków): NIE_ZMIERZONO w tej rundzie (brak zmian kodu). Determinism-same-seed-test.cjs uruchomiony na bazie: PASS, WYNIK PASS (lista wyjątków bez zmian).

## Proponowany kolejny krok (runda 3, do decyzji orkiestratora)

1. Bisekcja po stronie instrumentacji: w runWorldEndTurn (main.ts ok. 38915) zapisać treasury[owner 1] po każdym kroku AI (zamiast tylko per tura) i porównać dwa przebiegi A/B aż do pierwszego kroku rozbieżnego.
2. Równolegle sprawdzić, czy dryf znika, gdy wyłączyć wall-clock w ścieżce tury (np. stuck-force-clear przy `stuckMs > 8000` i healStaleEndTurnBlockers w trybie civTest), jako mutację diagnostyczną (bez commitu do main). Jeśli dryf znika, źródło to ścieżka czasowa, a nie RNG.
3. Po zidentyfikowaniu: naprawa minimalna (np. zastąpienie zegara licznikiem kroków w trybie testowym albo deterministyczne kolejkowanie), potem pomiar zgodnie z dispatchem.
4. Rozważyć osobny temat na R-WEB-DETERMINISM-AI-TURN-TIMING-Q1, jeśli okaże się, że bramkowanie kroków AI animacją/zegarem jest zamierzone (wtedy to kwestia projektowa, nie błąd RNG).

## Uwagi dla orkiestratora (poza zakresem; bez tworzenia sesji)

- Dispatch rundy 2 nie jest w origin/main; istnieje tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (oryginał 00-dispatch.md). Warto to odnotować w procesie.
- Runner tools/measure-ai-trade-offer-frequency.cjs trzyma w `consoleMatches` tylko 60 ostatnich dopasowań; przy diagnostyce zdarzeń czasowych warto podnieść limit lub zapisywać wszystkie.
- Runner dla ?civTest=1 zakłada skrót stanu z digest per tura — to wystarcza do wykrycia dryfu, ale nie do lokalizacji (potrzebny zapis per krok AI).

## DOWODY

- Pliki surowe: dyspozycje/autobot/runs/R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1/evidence/r2-f2222-a.json, r2-f2222-b.json, r2-f2222-c.json (trajectorySha256_12 bc1e99ec053f, 3034535b8eff, beb31cc01c39).
- Skrypt porównania: nie commitowany (scratchpad).

TESTY: determinism-same-seed-test.cjs — PASS (wszystkie checki). Pozostałe bramki: NIE_ZMIERZONO (brak zmian kodu).
BLOKADY: (1) źródło dryfu nieznane — wymaga instrumentacji per krok AI; (2) czas jednego przebiegu ~2 min, więc pełny pomiar po naprawie nie zmieścił się w rundzie; (3) brak dostępu do przeglądarki poza runnerem (bez ręcznej weryfikacji).
RUNDY: 2/5 (ten przebieg). Ostatni werdykt FC r1: FAIL (pomiar). Decyzja wymagana: czy kontynuować bisekcję w rundzie 3 i na jakim modelu. Operator Haiku ma w tym temacie już FAIL r1 i BLOCK r2 (bez kodu); zgodnie z zasadą modeli Sonnet na Operatorze wymaga pisemnego uzasadnienia w dispatchu.
NASTĘPNY KROK: runda 3 — bisekcja per krok AI (sekcja „Proponowany kolejny krok”).
DEPLOY/PUSH: NIE WYKONANO
