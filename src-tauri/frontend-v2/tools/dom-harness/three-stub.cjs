/**
 * three-stub.cjs — ATRAPA pakietu `three` WYŁĄCZNIE dla harnessu P5.2 (strona pin web).
 *
 * Moduły pinu `map/improvement-build.ts` (→ `render/improvements.ts`) i inne ładują `three` przy
 * ewaluacji (tworzą materiały/geometrie na poziomie modułu). Harness nie renderuje 3D — potrzebuje
 * tylko danych/tekstów tych modułów. Każda właściwość/wywołanie/konstrukcja zwraca tolerancyjny obiekt.
 * frontend-v2 (`src/**`) NIE używa `three` (brama `npm run check`).
 */
'use strict';
function makeAny() {
  const f = function () {};
  return new Proxy(f, {
    get(_t, p) {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === Symbol.iterator) return function* () {};
      if (p === 'then') return undefined;
      if (p === 'prototype') return {};
      return makeAny();
    },
    set() { return true; },
    construct() { return makeAny(); },
    apply() { return makeAny(); },
  });
}
const proto = new Proxy({}, { get: (_t, p) => (p === 'then' ? undefined : makeAny()) });
module.exports = Object.create(proto);
