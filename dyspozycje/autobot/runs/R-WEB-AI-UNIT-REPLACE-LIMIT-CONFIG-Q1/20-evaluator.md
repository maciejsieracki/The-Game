# Evaluator — R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1

STATUS: PASS
SCOPE: `gra/data/ai-params.json`, `gra/src/game/ai-unit-replace-plan.ts`, the scoped cap wiring in `gra/src/main.ts`, and `gra/tools/ai-unit-replace-same-rules-test.cjs`.

WYNIK: Nie znaleziono zastrzeżeń w zakresie oceny. Wartość JSON `0.1` zachowuje dotychczasowy próg 10%; loader przyjmuje skończoną, nieujemną wartość liczbową i wraca do `AI_UNIT_REPLACE_MAX_FRACTION` dla braku lub niepoprawnej wartości. `main.ts` przekazuje załadowany udział do istniejącego capu. Zmiana nie wpływa na regułę `max(1, floor(10% armii))` dla niepustej armii przy domyślnej konfiguracji.

WERYFIKACJA:
- `cd gra && node tools/ai-unit-replace-same-rules-test.cjs` — PASS, 44 passed / 0 failed.
- `cd gra && npm run typecheck` — PASS, `tsc --noEmit`.
- Odczyt konfiguracji i diffu zakresu: wpis ma typ liczbowy `0.1`, a asercje obejmują zachowanie dotychczasowego capu, inną wartość konfiguracyjną, fallback oraz wiring w `main.ts`.

OBRONA POMINIĘTA — brak uwag do obrony lub poprawek w ocenianym zakresie.

Uwaga zakresowa: `gra/src/main.ts` zawiera też niezależny, równoległy hunk dotyczący research; nie był przedmiotem tej oceny.
