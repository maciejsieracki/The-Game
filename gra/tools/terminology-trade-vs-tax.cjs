'use strict';
/**
 * terminology-trade-vs-tax.cjs — R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1.
 *
 * Wspólne reguły terminologii „podatek vs handel” dla tekstów widocznych dla gracza.
 *
 * Zasada właściciela (2026-11-09): na polach / HEX-ach NIE produkuje się handlu. Produkcja pola
 * to Praca, Żywność i PODATEK (w danych/silniku pole `handel` w TileYield = Podatek — patrz
 * gra/src/game/danina-nazwa.ts). HANDEL występuje tylko w wymianie (trasy handlowe, umowy,
 * kosze, cła, bonusy portów/szlaków). Nazwy pól/kluczy/identyfikatorów NIE są zmieniane.
 *
 * Moduł jest używany przez:
 *   - gra/tools/gen-tech-cards-top5.cjs  (normalizacja tekstów pochodzących z CSV: tytuły + CMZ),
 *   - gra/tools/terminology-trade-vs-tax-test.cjs (test strażnik: wzorce A nie wracają).
 */

/**
 * Reguły klasy A dla tekstów pochodzących z CSV kart odkryć (tytuły i „Co możesz teraz zrobić”).
 * Każda reguła ma powód. Kolejność ma znaczenie.
 */
const CSV_RULES = [
  {
    nazwa: 'plus-N-handlu',
    re: /(\+\d+) handlu/g,
    na: '$1 podatku',
    powod: 'A: „+N handlu” na polu/z pola = produkcja pola = podatek (TileYield.handel to Podatek).',
  },
  {
    nazwa: 'warunek-wymiany-mianownik',
    re: /(Warunek Wymiany — )klucza( do tras handlowych)/g,
    na: '$1klucz$2',
    powod: 'Błąd językowy: po myślniku wyjaśnienie tytułu w mianowniku („Warunek Wymiany — klucz do tras handlowych”).',
  },
];

/**
 * Zakazane wzorce klasy A (nie mogą wracać w tekstach kart/opisów). Test strażnik stosuje je do
 * pól tekstowych danych kart i opisów. Każdy wzorzec = produkcja pola/budynku opisana jako „handel”.
 */
const FORBIDDEN_A = [
  { nazwa: '+N handlu (produkcja)', re: /[+−-]\d+\s+handlu(?!\s+(morskiego|z tras))/i },
  { nazwa: 'handlu na polu', re: /handlu\s+na\s+polu/i },
  { nazwa: 'handlu z pola', re: /handlu\s+z\s+pola/i },
  { nazwa: 'handel z pól (produkcja)', re: /(Pracę|Praca|Pracy)\s+i\s+handel/i },
  { nazwa: 'żywność/Praca/handel', re: /żywność,\s+(Pracę|Praca),?\s+(pieniądz\s+)?i\s+handel/i },
  { nazwa: 'dodatkowy handel (Droga)', re: /dodatkowy\s+handel/i },
  { nazwa: 'więcej handlu niż', re: /więcej\s+handlu\s+niż/i },
  { nazwa: 'mnoży handel', re: /mnoży\s+handel/i },
  { nazwa: 'podatku (handlu)', re: /podatku\s+\(handlu\)/i },
  { nazwa: 'daje handel i', re: /daje\s+handel\s+i/i },
  { nazwa: 'podatek z handlu', re: /podatek\s+z\s+handlu/i },
  { nazwa: 'Handel (plon heksa)', re: /Handel\s+\(plon\s+heksa\)/i },
  { nazwa: '+N Handel/turę', re: /\+\d+\s+Handel\/tur/i },
  { nazwa: 'jedyny yield +10 handlu', re: /(\+10\s+do\s+handlu|\+10\s+handlu|\+10\s+handel)/i },
  { nazwa: 'bonus do pracy i handlu', re: /pracy\s+i\s+handlu/i },
];

/** Zakazane błędy językowe (Dodatek 1 / 3): zły przypadek i liczba. */
const FORBIDDEN_LANG = [
  { nazwa: 'Warunek Wymiany — klucza', re: /Warunek Wymiany — klucza/ },
  { nazwa: 'warunków Wymiany, bez której', re: /warunków Wymiany, bez której/ },
];

function applyRules(text, rules) {
  let out = String(text);
  for (const r of rules) out = out.replace(r.re, r.na);
  return out;
}

/** Normalizacja tekstu pochodzącego z CSV kart odkryć. */
function normalizeCsvText(text) {
  return applyRules(text, CSV_RULES);
}

module.exports = { CSV_RULES, FORBIDDEN_A, FORBIDDEN_LANG, normalizeCsvText };
