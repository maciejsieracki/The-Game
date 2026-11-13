# R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED (część naprawy wykonana; pozostałe ścieżki wymagają decyzji właściciela, bo zamiana miary zmienia balans)
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1
GOAL: (1) audyt ścieżek pokoju/rozejmu wg miary siły; (2) naprawa tam, gdzie miara jest sprzeczna z decyzją właściciela (siła militarna, nie Power/respekt), progi bez zmian; (3) test regresyjny z mutacją.
BAZA: a99445016 (origin/main), wykonane detached w worktree.
ZMIANY/COMMIT: patrz sekcja „Zmiany w kodzie" (commit: SHA w polu sha odpowiedzi Operatora).

## 1. Tabela ścieżek (audyt)

Decyzja właściciela (krok 4a): rozejm i pokój wg SIŁY MILITARNEJ (`diplomacy-military-strength.ts`: `computeMilitaryStrength` / `compareMilitaryStrength` / `peaceStanceOf`); słabszy szuka rozejmu/pokoju, silniejszy odrzuca; jedyny słodzik to miasto.

| # | Plik:linia | Ścieżka | Miara użyta w decyzji | Zgodność z decyzją | Akcja |
|---|---|---|---|---|---|
| 1 | `gra/src/game/ai.ts:7011` | pozycja AI wobec partnera (`peacePosMil`) | siła militarna (`peaceStanceOf`) | zgodna | brak |
| 2 | `gra/src/game/ai.ts:7126` | sygnały `aiPeaceSignals` (a) `rw <= progPokojSlabosc`, (b) utrata miasta `rw <= 0.5` | `rw` (respekt względny = Power) | NIEZGODNA | DECISION_REQUIRED (patrz §3, pkt A) |
| 3 | `gra/src/game/ai.ts:7161` | główna bramka „AI proponuje pokój/rozejm”: `rw <= progPokojSlabosc \|\| peaceSignals.wantsPeace` | `rw` (Power) + sygnały; blokady `aiFeelsStronger` (siła) i `peaceWeakerNoCityVsPlayer` (siła) są zgodne | NIEZGODNA w części `rw` | DECISION_REQUIRED (patrz §3, pkt A) |
| 4 | `gra/src/game/ai.ts:7167` | `weakerByPower = rw <= progPokojSlabosc` → wybór rodzaju (`aiTruceOrPeaceMode`) | `rw` (Power) | NIEZGODNA | DECISION_REQUIRED (patrz §3, pkt A) |
| 5 | `gra/src/game/ai.ts:7357` | `compareMilitaryStrength` (dyplomacja AI, przewaga) | siła militarna | zgodna | brak |
| 6 | `gra/src/game/ai.ts` (wearyShare / loserDespair) | udział desperacji | siła militarna (`wearyMilitaryShare`, R-WEB-DIPLO-WEARINESS-CITY-ONLY-Q1) | zgodna | brak |
| 7 | `gra/src/game/ai.ts:1890` | `rw < progUltimatumMilitaryRatio` (ultimatum) | `rw` (Power) | poza zakresem pokoju; NIE_ZMIERZONO co do pełnej semantyki | zgłoszone w UWAGACH |
| 8 | `gra/src/main.ts:24885–24914` (`buildProposalEvalContext`) | `proposerRespekt`, `responderRespekt`, `respektWzgledny` = `potProposer / potSum` (Power) przekazywane do oceny ofert | Power / respekt | NIEZGODNA (wejście do oceny pokoju w ofertach) | DECISION_REQUIRED (§3, pkt B) |
| 9 | `gra/src/main.ts:42197–42395` (ścieżka AI→gracz, `respektWzgledny: respektWzglednyPlr`, `respektWzgAi`) | wejście `decideAIDiplomacy` | Power (`objectivePowerByOwner`) | NIEZGODNA (zasila pkt 2–4) | DECISION_REQUIRED (§3, pkt A) |
| 10 | `gra/src/main.ts:36618–36627` `registerAiAiPeaceRequest` | „wyraźnie przegrywa” (`isClearlyLosing(share)`) | BYŁO: udział Power; JEST: udział siły militarnej | BYŁO NIEZGODNE | NAPRAWIONE (§2) |
| 11 | `gra/src/main.ts:36664` `runAiAiPeaceTick.requesterShareOf` | ponowna weryfikacja „nadal przegrywa” (`isStillLosing`) | BYŁO: Power; JEST: siła militarna | BYŁO NIEZGODNE | NAPRAWIONE (§2) |
| 12 | `gra/src/main.ts:36680–36684` `gateVerdict` (AI↔AI) | `peaceStanceOf` (pozycja zwycięzcy) + `winnerRw` przekazane do `evaluatePeaceAiGate` jako `rw` | pozycja: siła; `rw`: Power | częściowo NIEZGODNE (pole `rw` w bramce) | DECISION_REQUIRED (§3, pkt A) |
| 13 | `gra/src/main.ts:11804` (odpowiedź gracza) | `peaceStanceOf` | siła militarna | zgodna | brak |
| 14 | `gra/src/game/diplomacy-ai-forced-peace.ts:226,301–344` | `requesterShare` / `isStillLosing` — wejście od wywołującego (main.ts) | zależy od wywołującego | zgodna po naprawie §2 | brak w module |
| 15 | `gra/src/game/war-weariness.ts:201–362` (`runWarWearinessTick`, `wearinessUnconditionalEndDue`, `weakerOf`, `shareOf`) | słabsza strona i udział | siła militarna (`peaceStanceOf`, `sideOf`) | zgodna | brak |

Uwaga do pkt 3/4: `rw` w `ai.ts` NIE jest „siłą” w sensie decyzji — to `respektWzgledny` z Power (pkt 8–9). Dlatego bramka „słabszy szuka” może odpalić się dla AI w paśmie `pasmo` (równa siła), a nie tylko dla `slabsza`. To jest właśnie różnica, którą trzeba rozstrzygnąć liczbą (§3).

## 2. Naprawa wykonana (zgodna z decyzją, progi bez zmian)

- `gra/src/main.ts`: nowy helper `aiAiMilitaryRequesterShare(requesterId, otherId)` = `requesterShare(diploMilitarySideOf(requesterId, otherId, true).sila, diploMilitarySideOf(otherId, requesterId, true).sila)` (readOnly = bez zapisu domyślnego wpisu do `diplomacyPairMeta`).
- `registerAiAiPeaceRequest`: `share` liczony przez helper zamiast `requesterShare(objectivePowerForOwner(...))`. Próg `isClearlyLosing` (`LOSER_MAX_SHARE_AT_REQUEST`) bez zmian.
- `runAiAiPeaceTick.requesterShareOf`: ten sam helper. Próg `isStillLosing` bez zmian.
- Log `R-AI-PEACE-2T` nadal pokazuje udział (teraz siły militarnej).

Efekt: decyzja „czy AI↔AI prośba o pokój jest zasadna” jest oparta o siłę militarną we wszystkich trzech miejscach (rejestracja, podtrzymanie, bramka zwycięzcy `peaceStanceOf`). Nie zmieniono żadnej liczby progowej.

## 3. Pozostawione do decyzji właściciela (DECISION_REQUIRED)

**Pkt A — bramka pokoju AI wobec gracza/AI (`ai.ts:7126–7167`, `main.ts:42197–42395`, `main.ts:36680` pole `rw`).** Obecnie `rw` (Power) jest częścią warunku „AI proponuje pokój”. Zamiana `rw` na pozycję militarną zmienia, KTO składa propozycję w paśmie `pasmo` (równa siła, gdzie dziś `rw <= progPokojSlabosc` odpala propozycję). Progi liczbowe można zachować tylko przez przeliczenie udziału militarnego na skalę `rw`, co jest decyzją balansową.
- Opcja A1 (rekomendacja Operatora): warunek `rw <= progPokojSlabosc` zastąpić `peacePosMil === 'slabsza'` (czyste „słabszy szuka”), progi bez zmian. Skutek: AI przestaje proponować pokój w paśmie `pasmo` wyłącznie z powodu niskiego Power.
- Opcja A2: udział militarny `wojskowyUdzial = sila_AI / (sila_AI + sila_partnera)` zastąpić `rw` we wszystkich bramkach (progi bez zmian). Skutek: zmiana skali porównania, wymaga sprawdzenia, czy `progPokojSlabosc` ma sens na tej skali.
- Opcja A3: zostawić jak jest (Power jako dodatkowy sygnał obok siły) — wymaga jawnej decyzji, że to odstępstwo jest zamierzone.
Dane do decyzji: nie zmierzono liczbowo, ile propozycji wypada w paśmie `pasmo` (NIE_ZMIERZONO w tym temacie). Zalecany pomiar przed wyborem.

**Pkt B — `buildProposalEvalContext` (`main.ts:24885–24914`).** `proposerRespekt`/`responderRespekt`/`respektWzgledny` z Power trafiają do oceny ofert gracz↔AI. Decyzja właściciela wyklucza „respekt” jako miarę pokoju; wymaga ustalenia, czy `respektWzgledny` w `diplomacy-proposals.ts` wpływa na akceptację pokoju (NIE_ZMIERZONO — nie prześledzono każdego odczytu pola w 3040 liniach pliku).

## 4. Test regresyjny

- Nowy plik: `gra/tools/peace-gate-military-strength-test.cjs` (strukturalny, bo `main.ts` nie jest importowalny w harnessie cjs). Sprawdza: helper `aiAiMilitaryRequesterShare` liczy `requesterShare` na `.sila` obu stron z `diploMilitarySideOf`; `registerAiAiPeaceRequest` i `requesterShareOf` używają helpera; brak `requesterShare(objectivePowerForOwner(` w całym `main.ts`.
- Wynik zielony: `node tools/peace-gate-military-strength-test.cjs` → `Wynik: 7 PASS / 0 FAIL`.
- Mutacja (wykonana): cofnięcie `requesterShareOf` do `requesterShare(objectivePowerForOwner(rq), objectivePowerForOwner(ot))` → test czerwony: `5 PASS / 2 FAIL` (p1 `runAiAiPeaceTick` i p3). Po przywróceniu: `7 PASS / 0 FAIL`.
- Test nie obejmuje behawioralnie zachowania „słabszy szuka, silniejszy odrzuca” w pełnej grze — to jest pokryte istniejącymi testami (§5), które są zielone.

## 5. Bramki i testy (liczby z surowego wyjścia)

- `node_modules/.bin/tsc --noEmit` → exit 0 (bez błędów). `npm ci --ignore-scripts` (71 pakietów); `npm run build/dev` NIE uruchamiane.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `ALL GREEN`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `All sanity checks passed.`
- `node tools/unit-power-test.cjs` → `=== unit-power-test: 6 pass, 0 fail ===`
- `node tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`
- `node tools/diplomacy-test.cjs` → `[diplomacy-test] 149 passed, 0 failed (total 149).`
- `node tools/ai-war-weariness-peace-test.cjs` → `PASS=99 FAIL=0`
- `node tools/peace-balance-accept-test.cjs`: nazwa pliku to `diplo-peace-balance-accept-test.cjs` → `32 pass / 0 fail`
- `node tools/diplo-peace-stance-wiring-test.cjs` → `10 pass / 0 fail`
- `node tools/diplo-peace-weaker-seeks-city-only-test.cjs` → `29 pass / 3 fail`. Poza ścieżką zmiany: 3 FAIL (h2, h4, h5) dotyczą gałęzi „koniec zmęczenia wojną” w `ai.ts` (`pokoj bezwarunkowy`, `zmeczenie 1.00`), a zmiana nie dotyka ani `ai.ts`, ani tego testu (test nie czyta `main.ts`). Wniosek: NIE wynika z tej zmiany. Nie uruchomiono go na bazie a99445016 — to wnioskowanie z diffu, nie pomiar. Wymaga potwierdzenia przez Evaluatora na bazie.

## 6. Blokady

- Pkt A i B z §3 — wymagają decyzji właściciela (zamiana miary zmienia balans bramki pokoju AI).
- 3 FAIL w `diplo-peace-weaker-seeks-city-only-test.cjs` — do potwierdzenia na bazie (§5).

## 7. UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez działania Operatora)

- `ai.ts:1890` (`progUltimatumMilitaryRatio`) używa `rw` (Power) w ultimatum — nie przeanalizowano semantyki; kandydat do osobnego audytu.
- Test `diplo-peace-weaker-seeks-city-only-test.cjs` ma 3 FAIL dotyczące zmęczenia wojną (zmiana #359/#363 po stronie kodu, test nieprzepisany) — dług testowy do osobnego tematu.
- Wiersz tabeli `#372` (ten temat) w rejestrze: rekomendowany status po decyzji A1/A2/A3.

## NASTĘPNY KROK

Final Control/Evaluator: potwierdzić §5 (zwłaszcza 3 FAIL na bazie) i zmutować pkt 10–11 wg §4. Właściciel: wybrać opcję A1/A2/A3 dla pkt A oraz ustalić pkt B.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
