# R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1
GOAL: AI nigdy nie kończy tury z ujemnym skarbcem/spichlerzem od tury 1 (decyzja ABC 2026-11-14 „AI od tury 1: tak”); gracz bez zmian (bramka i wyjątek tur 1–10).
BAZA: 38d145144 (origin/main, detached). Worktree: `.claude/worktrees/wf_bbb28313-691-1`.
ZMIANY-COMMIT: patrz sekcja „Zmiany” (commit z tym raportem; SHA w polu sha wyniku).

## Zmiany (allowlista)

1. `gra/src/game/no-negative-stocks.ts` — `NNS_AI_BALANCE_TURN_MIN = NNS_WOLNE_TURY + 1` (=11) → `= 1`. `NNS_WOLNE_TURY = 10` bez zmian (używany przez bramkę gracza).
2. `gra/src/main.ts` (tylko ścieżka AI):
   - nowy zbiór `aiNnsUncoveredOwners` (obok `aiNnsHoldOwners`), czyszczony na starcie `nnsAiPreTickBalance`;
   - w pętli równoważenia, po `pokryte = ...`: `if (cur.skPo < 0) aiNnsUncoveredOwners.add(oid);` — owner, dla którego dźwignie nie domykają skarbca (flaga wyłączona nie wpisuje owner, żeby mutacja pomiarowa dalej pokazywała minusy);
   - w bankowaniu AI, po `nnsRecordPostBank(oid, aiSkarb)` (pomiar przed klamrą): `if (aiNnsUncoveredOwners.has(oid) && aiSkarb < 0) aiSkarb = 0;`.
3. `gra/tools/no-negative-stocks-c2-test.cjs` — asercje progu tury 11 → 1 (tura 10 „brak równoważenia” → tura 1 „równoważenie aktywne”).
4. Nowy `gra/tools/no-negative-stocks-ai-t2-test.cjs` (11 asercji).

## Diagnoza (plik:linia, dowód)

- Baza (próg 11): równoważenie AI wyłączone w T1–10 (`main.ts` ~7522 `if (turn < NNS_AI_BALANCE_TURN_MIN) return;`), a bankowanie AI (`main.ts` ~40572–40592, `aiSkarb = skarbiec + pieniadz − utrzymanieRazem`) nie podłogowuje do 0 (celowo, parytet z R-DEFICYT-ZLOTA-KARA-Q1). Efekt: seed 11, T1–10: **243 wierszy** z ujemnym skarbcem AI (np. `rzymianie` oid 40 sk −3 w T2; `fenicjanie` oid 13 −3 w T4/T10).
- Próg 1 (samo `NNS_AI_BALANCE_TURN_MIN = 1`): seed 11 — 0 wierszy; seed 22 — 5 wierszy; seed 33 — 12 wierszy + 2 wyjątki w T11. Przyczyna (wyjątki „brak dostępnych dźwigni”): owner z 1 miastem i 1–2 jednostkami (państwa-miasta `asyria` oid 12, `fenicjanie` oid 34) — podatek 100% i racje 0 już użyte, jedyny obrońca chroniony (`nnsProtectedDefenderIds`), więc `planAiBalance` nie ma dźwigni; utrzymanie budynków > dochód, dług narasta −1 → −9 (oid 12, T2→T10). Dług z tury na turę nie jest czymś, co dźwignie mogą zamknąć.
- Dodatkowo rozjazd projekcja↔bank: część wierszy ma `skBank < 0` mimo że projekcja pre-tick jest dodatnia lub dźwignie zadziałały (np. seed 22 oid 13 T4) — NIE_ZMIERZONO co dokładnie w `previewCityEconomy`/`projectTreasuryAfterTick` różni się od realnego ticku (wymaga sondy per krok; poza tym tematem).

## Naprawa

- Próg tury 1 (AI równoważy od T1), jedna stała.
- Domknięcie wyjątku: owner bez pokrycia po wyczerpaniu dźwigni ma skarbiec zamknięty w 0 przy bankowaniu (nie narasta). Pomiar `nnsRecordPostBank` nadal widzi wartość surową. Zakres: TYLKO AI bez pokrycia; reszta bankowania AI bez zmian; gracz bez zmian.
- **DECYZJA DO ORKIESTRATORA (nie rozstrzygałem sam):** zamknięcie w 0 wyłącza kary deficytu Złota (`advanceGoldDeficit`) dla AI, którego dług nie da się pokryć. Alternatywa (brak klamry, dług narasta) łamie cel właściciela „nigdy poniżej zera”. Proponuję zatwierdzić; jeśli właściciel woli inaczej — trzeba nowej dźwigni (np. wyłom w zasadzie chronionego obrońcy przy długu), co zmienia balans wojskowy AI.

## Testy i bramki (liczby z surowego wyjścia)

- Nowy test `node tools/no-negative-stocks-ai-t2-test.cjs`: **11 passed, 0 failed** (fix). Mutacja: z progiem 11 (baza) → **6 passed, 5 failed** (czerwony na bazie).
- `no-negative-stocks-c2-test.cjs`: 43 passed, 0 failed (po zmianie asercji progu).
- `no-negative-stocks-ai-test.cjs`: 8 passed, 0 failed.
- `diplo-peace-ai-ai-nonnegative-test.cjs`: 21 PASS, 0 FAIL.
- `no-negative-stocks-c3-turn-test.cjs --dist <bundle fix>` (realny Chromium, realne Zakończ turę): **16 passed, 0 failed** (ON: skarbiec po turze 24.2; OFF: −165 — mutacja pomiarowa działa).
- Bramki referencyjne: `tsc --noEmit` exit 0; `logic-test` 213/213; `tech-tree-test` 20/20; `research-test` ALL GREEN; `unit-replace-test` 21/21; `combat-test` all sanity passed; `unit-power-test` 6 pass / 0 fail.
- `git diff --check`: czysto. Build tylko `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>` (poza repo), `npm ci` w `gra/` (node_modules ignorowany przez git).

## Pomiar headless (realny bundle, Chromium, `no-negative-stocks-headless-measure.cjs`, mode `on`, T1–10)

Kryterium końca tury (`skEnd` = skarbiec po całej turze AI):

| seed | baza (próg 11): wiersze skEnd<0 T1–10 | fix: wiersze skEnd<0 T1–10 | fix: skBank<0 (surowy, przed klamrą) | fix: wyjątki T1–10 |
|---|---|---|---|---|
| 11 | 243 (wszystkie wiersze sk<0) | **0** | 0 | 0 |
| 22 | (nie mierzono w bazie) | **0** | 3 | 0 |
| 33 | (nie mierzono w bazie) | **0** | 12 | 0 |

- Spichlerz: `spichRaw<0` w fix: seed 22 — 3 wiersze, to `harappa` oid 7 w T6–8 z `glod=true` (stan głodu garnizonu, istniejący mechanizm, nie dług w zapasach; zapasy klamrowane do 0 po ticku). Seed 11/33: 0.
- Wyjątki T11 (seed 33, 2 owner): pre-tick projekcja < 0 po wyczerpaniu dźwigni; bank zamyka w 0 → koniec T11 na 0. Nie jest to już narastający dług.
- Pozostałe wiersze `skBank<0` (surowy, przed klamrą) to wartości pomiarowe runnera, który w C3 liczy `min(bank, koniec)` — według kryterium „po zakończeniu tury” są zerowe. **Zmiany definicji runnera nie wprowadzałem** (decyzja orkiestratora, czy pomiar ma liczyć bank-time).

## NIE_ZMIERZONO

- Pomiar T1–30 na 3 ziarnach (miasta AI i jednostki AI w T30, mediana, próg 5% → DECISION_REQUIRED): **NIE_ZMIERZONO** (czas; zmierzono tylko T1–10 na seedach 11/22/33; bazy T1–10 dla seedów 22/33 nie zmierzono).
- Weryfikacja live (inna niż headless runner) i konieczność REPIN Rust (zmiana progu AI): **NIE_ZMIERZONO**, nie sprawdzano `rust-port/`.
- Dokładna przyczyna rozjazdu projekcja↔bank (skBank<0 przy dodatniej projekcji) — **NIE_ZMIERZONO** w tej rundzie.

## Uwagi dla orkiestratora

- `00-dispatch.md` nie istnieje w `origin/main`; odczytano dodatek z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md`), który zawiera treść dispatchu.
- W bazie 38d145144 próg jest już 11 (wcześniejsza zmiana „od tury 1” została cofnięta przed tą bazą); ten temat ją przywraca razem z domknięciem długu.
- Nie tworzono żadnych sesji/zadań/triggerów. Nie pushowano na main.

NASTĘPNY KROK: Evaluator (Sonnet) — ocena decyzji write-off AI (pkt „DECYZJA DO ORKIESTRATORA”), pomiar T1–30 ×3 ziarna (NIE_ZMIERZONO), ewentualnie REPIN progu AI w Rust.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
BLOKADY: brak twardych; decyzja write-off AI do zatwierdzenia przez właściciela/orkiestratora.
