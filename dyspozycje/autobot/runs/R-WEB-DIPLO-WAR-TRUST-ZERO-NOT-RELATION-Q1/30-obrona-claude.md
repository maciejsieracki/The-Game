# R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 — OBRONA (runda 1, Operator Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1
GOAL: w wojnie obniżane jest tylko Zaufanie (do 0), Respekt bez zmian, ocena pokoju bez limitu 29.
BAZA: kandydat 331c1a0bfe8b6984eb754b87f616899172c3f42f (baza 5d0c5f8d1; kandydat jest potomkiem bazy).
ZMIANY-COMMIT: patrz SHA końcowy w polu sha odpowiedzi (commit obrony na detached HEAD worktree).
  - gra/tools/diplomacy-respect-true-value-real-render-test.cjs: usunięta tautologia `typeof capPoints === 'number'`
    (zarzut 1); zastąpiona asercją nietautologiczną `warRelationCapApplies(0, 80, true) === false`; nazwa asercji
    „suma 128 > limit” zmieniona na „Zaufanie 74 > 0” (zarzut 4, część nazwy); nagłówek testu zaktualizowany.
  - gra/src/game/diplomacy-proposals.ts: komentarze o limicie 29 (ok. 1415-1417, 1441-1442, 1477-1479) oznaczone
    jako sprzed R-WEB-DIPLO-WAR-TRUST-ZERO lub przepisane na „Zaufanie=0” (zarzut 2). Bez zmian logiki.
  - Odrzucone bez zmiany kodu: patrz niżej (zarzut 2 w diplomacy-ai-offer-balance.ts:539 i main.ts:12480, zarzut 3).
  - Screenshoty PNG regenerowane przez test render zostały przywrócone (git checkout), nie są w commicie.

## Odpowiedź na zarzuty Evaluatora

1. PRZYJĘTY. Test `diplomacy-respect-true-value-real-render-test.cjs` miał tautologię `typeof capPoints === 'number'`.
   Usunięta, zastąpiona asercją `warRelationCapApplies(0, 80, true) === false` (respekt 80 nie uruchamia dopisku,
   gdy Zaufanie = 0). Dowód: render test po zmianie → `18 OK, 0 FAIL` (surowe wyjście: `[diplomacy-respect-true-value-real-render-test]: 18 OK, 0 FAIL`).

2. CZĘŚCIOWO PRZYJĘTY, CZĘŚCIOWO ODRZUCONY.
   - `diplomacy-proposals.ts` 1415-1417, 1441-1442, 1477-1479: PRZYJĘTY. Komentarze mówiły o „relTotal<=29” jako
     aktualnym zachowaniu. Dopisano adnotację „[AKTUALIZACJA R-WEB-DIPLO-WAR-TRUST-ZERO …]” i przepisano klauzule
     o limicie; liczby historyczne (29/145/69/101) oznaczono jako sprzed zmiany.
   - `diplomacy-ai-offer-balance.ts:539`: ODRZUCONY. Cytat: „liczba wychodzi NIEKORZYSTNA … przy WYSOKIEJ (surowej,
     bez `clampRelationForWar` …) Relacji”. Komentarz nie wspomina limitu 29 ani wartości obcinanej. Sformułowanie
     „surowej, bez clampRelationForWar” nadal jest prawdziwe: gałąź AI-proponenta w `diplomacy-proposals.ts` używa
     `relationTotal(relation)` (surowa), co potwierdza kod po zmianie.
   - `main.ts:12480`: ODRZUCONY. Cytat: „Clamp wojenny (clampRelationForWar) działa jak zawsze.” Zdanie jest nadal
     prawdziwe (funkcja istnieje, zeruje Zaufanie). Dodatkowo `main.ts` jest na liście ZAKAZ w dispatchu, a allowlista
     komentarzy dotyczy tylko `diplomacy-ai-offer-balance.ts`.

3. ODRZUCONY jako brak luki w raporcie. `10-operator-claude.md` linia 19 opisuje dokładnie zmiany literałów testu
   runda3: „(2-PRZED-neutralna) -55 → 50; (4a) -355 → -250; (4b) -655 → -550 względem rundy 2 = 50”.
   Stan testu po zmianie (surowe wyjście, ten sam plik, bez zmian w tej rundzie):
   `=== PODSUMOWANIE: 22 PASS / 5 FAIL ===`, rc=1. Pięć FAIL to (3b) ×4 i (3c), zgodnie z raportem Operatora
   i Evaluatora. Stanu bazy 5d0c5f8d1 nie powtórzono w tej rundzie (NIE_ZMIERZONO w tej obronie); opieram się na
   zapisie `10-operator-claude.md` (baza 22 PASS / 5 FAIL) i na zarzucie Evaluatora.

4. CZĘŚCIOWO PRZYJĘTY. Nazwa asercji „suma 128 > limit” w tescie render została zmieniona (przyjęte).
   Etykieta „Wrogi” w wojnie NIE jest zmieniana: ODRZUCONY jako zmiana kodu. Dispatch wprost mówi:
   „Nie zmieniaj etykiet nastawienia ani ich progów — to następny krok” oraz „opisz, nie naprawiaj”.
   Opis jest w `10-operator-claude.md` (punkt o etykiecie w wojnie). Zachowanie (Zaufanie 0 + Respekt 80 → etykieta
   „Wrogi”) jest zgodne z tym opisem.

## Wyniki bramek po poprawkach (surowe wyjście, worktree na 331c1a0 + zmiany obrony)

- `npx tsc --noEmit` → exit 0 (TSC_EXIT=0)
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)` rc=0
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail` rc=0
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33` rc=0
- `node tools/unit-replace-test.cjs` → 21 linii `[OK]`, 0 `[FAIL]` rc=0
- `node tools/combat-test.cjs` → `All sanity checks passed.` rc=0
- `node tools/diplo-war-trust-only-test.cjs` → `diplo-war-trust-only-test: 11 OK, 0 FAIL` rc=0
- `node tools/diplomacy-test.cjs` → `[diplomacy-test] 148 passed, 0 failed (total 148).` rc=0
- `node tools/diplo-respect-military-events-test.cjs` → `Wynik: 24 OK, 0 FAIL` rc=0
- `node tools/diplomacy-respect-true-value-real-render-test.cjs` (Chromium) → `18 OK, 0 FAIL` rc=0
- `node tools/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs` → `22 PASS / 5 FAIL` rc=1 (dług znany, jak w raporcie Operatora)

Mutacja (przywrócenie starego obcinania do 29) była wykonana przez Evaluatora (5 FAIL w nowym teście); nie powtarzana.

## Pozostałe uwagi
- Nie zmierzono zachowania w żywej grze ani wpływu na decyzje AI (zgodnie z dispatchem).
- Clamp `clampRelationForWar` w `diplomacy.ts` ma doc-komentarz przypięty nad `militaryWinRespectPair` (kosmetyka, nie ruszana w tej rundzie).

BLOKADY: brak (poza odrzuconymi zarzutami 2b/3/4-etykieta, opisanymi wyżej).
RUNDY: 1/5 (obrona).
NASTĘPNY KROK: Evaluator r2 na commicie obrony (SHA w odpowiedzi).
DEPLOY/PUSH: NIE WYKONANO
