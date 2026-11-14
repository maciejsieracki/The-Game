'use strict';
/**
 * admin-dismiss-confirm-test.cjs
 *
 * TEMAT: R-WEB-UI-ADMIN-DISMISS-CONFIRM-Q1 (Operator, runda 1).
 * Statyczny test źródła src/ui/administratorPanel.ts (bez przeglądarki):
 *  (A) pierwszy klik „Zwolnij” (data-adm-panel-dismiss) TYLKO otwiera krok potwierdzenia — NIE wywołuje hooks.onDismiss();
 *  (B) potwierdzenie „Zwolnij” (data-adm-dismiss-yes) wywołuje hooks.onDismiss() — zwolnienie dopiero po potwierdzeniu;
 *  (C) „Anuluj” (data-adm-dismiss-no) wraca do zwykłej stopki i NIE wywołuje hooks.onDismiss();
 *  (D) krok potwierdzenia nie używa window.confirm/alert/prompt (zasada R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1);
 *  (E) tekst pytania zawiera nazwę miasta i „Koszt zatrudnienia nie podlega zwrotowi.” (dla miasta i ulepszeń);
 *  (F) MUTACJE w pamięci: zwolnienie od razu przy pierwszym kliku, brak kroku potwierdzenia, Anuluj zwalnia,
 *      window.confirm w kroku — każda MUSI być wykryta (inaczej test sam jest czerwony).
 *
 * Argument (opcjonalny): ścieżka do innego pliku administratorPanel.ts (np. wersja bazowa) — do dowodu „czerwony na bazie”.
 * Uruchomienie (z gra/): node tools/admin-dismiss-confirm-test.cjs [ścieżka-do-administratorPanel.ts]
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const DEFAULT_SRC = path.join(GRA, 'src', 'ui', 'administratorPanel.ts');
const SRC = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;

/** Treść bloku listenera dla danego selektora (od addEventListener do pierwszego `});` na tym samym poziomie). */
function handlerBody(src, selector) {
  const esc = selector.replace(/[[\]().*+?^$|\\{}]/g, '\\$&');
  const re = new RegExp("querySelector\\('" + esc + "'\\)\\?\\.addEventListener\\('click', \\(\\) => \\{([\\s\\S]*?)\\n    \\}\\);");
  const m = src.match(re);
  return m ? m[1] : null;
}

/** Zwraca listę naruszeń reguł A–E dla treści pliku administratorPanel.ts. Pusta lista = OK. */
function violations(src) {
  const out = [];
  const dismissBody = handlerBody(src, '[data-adm-panel-dismiss]');
  const yesBody = handlerBody(src, '[data-adm-dismiss-yes]');
  const noBody = handlerBody(src, '[data-adm-dismiss-no]');

  // (A) pierwszy klik nie zwalnia i otwiera krok potwierdzenia
  if (dismissBody === null) out.push('A: brak listenera pierwszego kliku „Zwolnij” ([data-adm-panel-dismiss])');
  else {
    if (/hooks\.onDismiss\(/.test(dismissBody)) out.push('A: pierwszy klik „Zwolnij” wywołuje hooks.onDismiss() bez potwierdzenia');
    if (!/dismissAsk\s*=\s*true/.test(dismissBody)) out.push('A: pierwszy klik „Zwolnij” nie otwiera kroku potwierdzenia (dismissAsk = true)');
  }

  // (B) zwolnienie tylko po potwierdzeniu
  if (yesBody === null) out.push('B: brak listenera potwierdzenia „Zwolnij” ([data-adm-dismiss-yes])');
  else if (!/hooks\.onDismiss\(\)/.test(yesBody)) out.push('B: potwierdzenie „Zwolnij” nie wywołuje hooks.onDismiss()');

  // (C) Anuluj nie zwalnia i wraca do stopki
  if (noBody === null) out.push('C: brak listenera „Anuluj” ([data-adm-dismiss-no])');
  else {
    if (/hooks\.onDismiss\(/.test(noBody)) out.push('C: „Anuluj” wywołuje hooks.onDismiss() (zwalnia mimo anulowania)');
    if (!/dismissAsk\s*=\s*false/.test(noBody)) out.push('C: „Anuluj” nie wraca do stopki (dismissAsk = false)');
  }

  // (D) brak natywnych okien w całym pliku
  if (/window\.(confirm|alert|prompt)\s*\(/.test(src)) out.push('D: natywne okno (window.confirm/alert/prompt) w administratorPanel.ts');

  // (E) tekst pytania
  const txtFn = (src.match(/export function administratorDismissConfirmText[\s\S]*?\n\}/) || [''])[0];
  if (!txtFn) out.push('E: brak funkcji administratorDismissConfirmText');
  else {
    if (!/Zwolnić administratora/.test(txtFn)) out.push('E: tekst pytania nie zaczyna się od „Zwolnić administratora”');
    if (!/m\.cityName/.test(txtFn)) out.push('E: tekst pytania nie zawiera nazwy miasta');
    if (!/Koszt zatrudnienia nie podlega zwrotowi\./.test(txtFn)) out.push('E: tekst pytania nie mówi „Koszt zatrudnienia nie podlega zwrotowi.”');
    if (!/m\.kind === 'city'/.test(txtFn)) out.push('E: tekst pytania nie rozróżnia administratora miasta i ulepszeń');
  }
  return out;
}

const realSrc = fs.readFileSync(SRC, 'utf8');
let fail = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log('PASS: ' + name);
  else { fail++; console.log('FAIL: ' + name + (detail ? ' — ' + JSON.stringify(detail) : '')); }
};

const realV = violations(realSrc);
ok('realny kod administratorPanel.ts: zero naruszeń reguł A–E', realV.length === 0, realV);

// (F) mutacje w pamięci: każda musi dać co najmniej jedno naruszenie
const mutations = [
  {
    name: 'zwolnienie od razu przy pierwszym kliku',
    from: "      dismissAsk = true;\n      render('[data-adm-dismiss-yes]');",
    to: "      dismissAsk = true; hooks.onDismiss();\n      render('[data-adm-dismiss-yes]');",
  },
  {
    name: 'brak kroku potwierdzenia (pierwszy klik nie otwiera okna)',
    from: "      dismissAsk = true;\n      render('[data-adm-dismiss-yes]');",
    to: "      dismissAsk = false;\n      render('[data-adm-dismiss-yes]');",
  },
  {
    name: 'Anuluj zwalnia administratora',
    from: "    dlg.querySelector('[data-adm-dismiss-no]')?.addEventListener('click', () => {\n      dismissAsk = false;",
    to: "    dlg.querySelector('[data-adm-dismiss-no]')?.addEventListener('click', () => {\n      hooks.onDismiss(); dismissAsk = false;",
  },
  {
    name: 'przywrócenie window.confirm w kroku potwierdzenia',
    from: "      dismissAsk = false;\n      hooks.onDismiss();",
    to: "      if (!window.confirm('Zwolnić?')) return;\n      dismissAsk = false;\n      hooks.onDismiss();",
  },
  {
    name: 'usunięcie koszt-zdania z tekstu pytania',
    from: " Koszt zatrudnienia nie podlega zwrotowi.'",
    to: "'",
  },
];
for (const m of mutations) {
  if (!realSrc.includes(m.from)) { fail++; console.log('FAIL: mutacja nie trafia w źródło: ' + m.name); continue; }
  const v = violations(realSrc.replace(m.from, m.to));
  ok('mutacja wykryta: ' + m.name, v.length > 0, v);
}

console.log(fail === 0 ? '== WSZYSTKO ZIELONE ==' : '== FAIL: ' + fail + ' ==');
process.exit(fail === 0 ? 0 : 1);
