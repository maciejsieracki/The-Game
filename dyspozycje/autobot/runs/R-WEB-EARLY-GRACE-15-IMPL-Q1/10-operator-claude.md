STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-GRACE-15-IMPL-Q1
GOAL: Okno łaski 15 tur (decyzja Q41-A): Trudny gracz ma 1 Wojownika na starcie; barbarzyńcy nie wykonują tury w turach 1..15 na każdym poziomie; utrzymanie jednostek gracza-człowieka = 0 w turach 1..15 na każdym poziomie. Zakup jednostek i okno AI (1..40) bez zmian.
ZMIANY/COMMIT: commit w worktree (SHA w polu sha odpowiedzi orkiestratora). Allowlista: gra/src/game/ai-difficulty-bonus.ts, gra/src/game/barbarians.ts, gra/src/game/ai-free-unit-upkeep.ts, gra/src/main.ts (import, kontekst utrzymania, bramka tury barbarzyńców), gra/data/ai-params.json (2 klucze), gra/tools/ai-difficulty-bonus-test.cjs (pin hard 0->1), gra/tools/early-grace-15-test.cjs (nowy), dyspozycje/analizy/OKNO-LASKI-15-TUR-2026-11-27.md, ten raport.
TESTY:
- node tools/early-grace-15-test.cjs: 24 passed, 0 failed
- mutacje: M1 start Trudny=0 -> 2 FAIL; M2 barbariansGraceActive=false -> 1 FAIL; M3 bez gałęzi zera gracza -> 6 FAIL (źródła przywrócone, cmp OK)
- ai-difficulty-bonus-test 97/0; research-test 33/0; logic-test, tech-tree-test, unit-replace-test, save-load-sort-test: exit 0; combat-test: sanity passed; society-breakdown-test 56/0; ai-city-order-need-wiring-test 267/0; endturn-aria-sync-test 5/0; ai-test 297/0
- barbarian*/barbarzyncy*/sea-peoples*/diplomacy-barbarian*: wszystkie zielone (np. barbarians 213/0, barbarzyncy-krazenie 249/0)
- utrzymanie: ai-free-unit-upkeep 34/0, upkeep-test 91/0, upkeep-difficulty-per-owner 19/0, unit-resource-upkeep 7/0, unit-upkeep-era-scale 24/0, ai-upkeep-runway 17/0, ai-upkeep-wiring 4/0, ai-recruit-upkeep-gate 23/0, recruitment-no-upkeep-gate 37/0
- start: city-state-start-units-test 16/0
- FAIL (nie związany z tematem, pin tekstowy): unit-upkeep-cost-pace-test 80 ok / 1 FAIL — "wszystkie wywołania silnika utrzymania niosą tempo" wskazuje main.ts ok. 34592/34595/34884 (podgląd UI, wywołania z paceUtrzymaniaWlasciciela(ownerId, pace)); linii tych ten temat nie zmienia.
- tsc --noEmit (sandboxowy typescript, --ignoreDeprecations 6.0): 177 błędów, wszystkie w plikach nietkniętych tematem (typy three, implicit any); bazy na czystym main nie zmierzono.
- NIE ZMIERZONO: pomiar na żywo (Chromium, ziarna 4242 i 778899, maksimum: Trudny, Wysoki x4, kultura/dyplomacja trudne, barbarzyńcy Trudny). Pasywny gracz przeżywa t20, „Zakończ turę” w t1–15, log zero ataków barbarzyńców, ruch od t16 — NIE potwierdzone na żywo.
- NIE ZMIERZONO: prognoza t1 w bramce „Zakończ turę”, wpływ na AI (AIEMPTY, miasta AI t30), tekst wiki/tooltip „Barbarzyńcy” (nie sprawdzono sprzeczności).
BLOKADY: brak blokad po stronie kodu. Uwaga środowiskowa: w sandboxie brakowało node_modules (three, esbuild, jsdom); zainstalowano poza repo (scratchpad) i podlinkowano do worktree; symlinki do usunięcia przed sprzątaniem.
RUNDY: 1/5
NASTĘPNY KROK: (1) orkiestrator: Evaluator i Final Control; (2) przed integracją: pomiar live na maksimum wg dokumentu (Chromium, 4242 i 778899, t20 i log barbarzyńców t1–15) — osobny temat pomiarowy albo w FC; (3) decyzja o pinie unit-upkeep-cost-pace-test (pre-existing, poza tym tematem).
DEPLOY/PUSH: NIE WYKONANO
