# 01 — Operator

Status: implementacja gotowa do niezależnej ewaluacji.

- UI ma zakres 1–30, presety do 30, przyciski `+1`/`+10` i przycisk `Bezterminowo` zamiast `+100`.
- UI przekazuje `exchangeDurationTurns` tylko dla cyklicznej wymiany surowca. Wybór `Bezterminowo` daje `null`; wybór liczby daje liczbę.
- Negocjacje własne, odpowiedzi AI oraz kontroferty przenoszą jawny termin.
- Resolver zachowuje zgodność: `null` → `wygasaTura:null`; liczba → `turn+clamp(1..30)`; `undefined` → historyczny `turn+turns`.
- Traktaty NAP/szlaków i inne wartości czasu nie korzystają z nowego pola.
- Testy logiczne i renderowane są przygotowane; wyniki zostaną dopisane po uruchomieniu.

## Weryfikacja operatora

- `npm run typecheck` — PASS.
- `node tools/diplomacy-resource-cyclic-trade-test.cjs` — 53/53 PASS: jawne 30 tur, `null`, historyczny fallback, JSON roundtrip oraz zachowany limit 20 tur dla traktatów.
- `node tools/diplomacy-cyclic-trade-duration-ui-test.cjs` — 9/9 PASS: rendered max 30, `+1`/`+10`, brak `+100`, przycisk bezterminowy, payload null/liczbowy i prefill kontroferty.
- `node tools/diplomacy-proposal-test.cjs` — 186/188; dwa niepowiązane asercje rundy 4 dotyczące akceptacji pokoju w wojnie zawodzą w bazowym obszarze logiki pokoju. Zakres tej zmiany nie dotyka tych ścieżek.
- `git diff --check` — PASS.
- Zależności zainstalowano z istniejącego lockfile (`npm ci --ignore-scripts --no-audit --no-fund`); brak zmian lockfile.
