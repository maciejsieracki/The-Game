# 01 — Operator

Status: implementacja gotowa do niezależnej ewaluacji.

- UI cyklicznej wymiany ma zakres 1–30, presety do 30, przyciski `+1`/`+10` i przycisk `Bezterminowo` zamiast `+100`.
- UI przekazuje `exchangeDurationTurns` tylko dla cyklicznej wymiany surowca. Wybór `Bezterminowo` daje `null`; wybór liczby daje liczbę.
- Negocjacje własne, odpowiedzi AI oraz kontroferty przenoszą jawny termin.
- Resolver zachowuje zgodność: `null` → `wygasaTura:null`; liczba → `turn+clamp(1..30)`; `undefined` → historyczny `turn+turns`.
- Traktaty NAP/szlaków i inne wartości czasu nie korzystają z nowego pola.
- Testy logiczne i renderowane są przygotowane; wyniki zostaną dopisane po uruchomieniu.

## Weryfikacja operatora

- `npm run typecheck` — PASS.
- `node tools/diplomacy-resource-cyclic-trade-test.cjs` — 53/53 PASS: jawne 30 tur, `null`, historyczny fallback, JSON roundtrip oraz zachowany limit 20 tur dla traktatów.
- `node tools/diplomacy-cyclic-trade-duration-ui-test.cjs` — 12/12 PASS: rendered max 30 dla wymiany cyklicznej, zachowany max 20 bez opcji bezterminowej dla ścieżki dostępu do zasobów, payload null/liczbowy i prefill kontroferty.
- `node tools/diplomacy-proposal-test.cjs` — 186/188; dwa niepowiązane asercje rundy 4 dotyczące akceptacji pokoju w wojnie zawodzą w bazowym obszarze logiki pokoju. Zakres tej zmiany nie dotyka tych ścieżek.
- `git diff --check` — PASS.
- Zależności zainstalowano z istniejącego lockfile (`npm ci --ignore-scripts --no-audit --no-fund`); brak zmian lockfile.

## Korekta po niezależnym review

- Evaluator zgłosił, że wspólny komponent czasu umowy nadawał max 30 i `Bezterminowo` także ścieżce `hasResourceAccess`.
- Korekta: wspólny renderer dostał jawne parametry cap/bezterminowo; wybór nowego zestawu 30+permanent wynika teraz z `!hasResourceAccess && per_turn && (hasQtyRes || showResModeSelector)`. Ścieżka dostępu do zasobu zachowuje cap 20 i dawny stepper bez opcji permanentnej.
- Walidacja ręczna ma odrębny cap 20 dla access i 30 dla cyklicznej ilości.
- Regresja renderowana sprawdza oba zestawy; 12/12 PASS, TypeScript PASS.
- Ponownie przekazać do Evaluatora; do czasu jego werdyktu Final Control pozostaje pending.
