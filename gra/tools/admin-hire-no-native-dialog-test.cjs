'use strict';
/**
 * admin-hire-no-native-dialog-test.cjs
 *
 * TEMAT: R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1 (Operator, runda 1).
 * Statyczny test źródła src/ui/administratorPanel.ts (bez przeglądarki):
 *  (A) zatrudnienie i zwolnienie administratora NIE wywołują window.confirm/alert/prompt;
 *  (B) tekst administratora ULEPSZEŃ nie wspomina budynku, bonusów miasta, produkcji, podatków ani korupcji;
 *  (C) tekst administratora MIASTA nie opisuje ulepszeń terenu i mówi, że wymaga budynku administracyjnego;
 *  (D) wspólny ogólny tekst „Administrator to osoba przypisana…” został usunięty.
 *  (E) MUTACJE: w pamięci wstrzyknięte natywne okno / przywrócony wspólny tekst / tekst ulepszeń z bonusami
 *      MUSZĄ być wykryte przez te same reguły (inaczej test sam jest czerwony).
 *
 * Chromium-owa weryfikacja „brak natywnego okna po kliknięciu” jest w tools/administrator-panel-real-render-test.cjs
 * (asercja A11d: nasłuch `dialog` = 0).
 *
 * Uruchomienie (z gra/): node tools/admin-hire-no-native-dialog-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src', 'ui', 'administratorPanel.ts');

/** Zwraca listę naruszeń reguł dla treści pliku administratorPanel.ts. Pusta lista = OK. */
function violations(src) {
  const out = [];
  if (/window\.(confirm|alert|prompt)\s*\(/.test(src)) out.push('A: natywne okno (window.confirm/alert/prompt) w administratorPanel.ts');
  if (!/hooks\.onHire\(\);/.test(src)) out.push('A: brak bezpośredniego wywołania hooks.onHire() (zatrudnienie)');
  if (!/hooks\.onDismiss\(\);/.test(src)) out.push('A: brak bezpośredniego wywołania hooks.onDismiss() (zwolnienie)');

  // (B) bonusy/tekst ulepszeń: linie bonusRows dla kind === 'improvements'
  const impBlock = (src.match(/if \(m\.kind === 'improvements'\) \{\s*return ([\s\S]*?);\s*\}/) || [])[1] || '';
  if (!impBlock) out.push('B: nie znaleziono gałęzi bonusRows dla ulepszeń');
  const impText = impBlock.replace(/<[^>]+>/g, ' '); // tylko treść widoczna (bez atrybutów data-*)
  if (/produkcj|podatk|korupcj|budynk|bonus[^']*miast/i.test(impText)) out.push('B: tekst bonusów ulepszeń wspomina bonusy miasta/budynki');
  const impLead = (src.match(/Administrator państwa to jedna osoba[^']*'/) || [''])[0];
  if (/budynk|bonus|produkcj|podatk|korupcj/i.test(impLead)) out.push('B: lead administratora państwa wspomina budynki/bonusy miasta');

  // (C) lead administratora miasta: wymaga budynku, bez ulepszeń terenu
  const cityLead = ((src.match(/function lead\(m[\s\S]*?if \(m\.kind === 'city'\) \{([\s\S]*?)\n  \}/) || [])[1] || '').replace(/\/\/.*$/gm, '');
  if (!/budynku administracyjnego/.test(cityLead)) out.push('C: lead administratora miasta nie mówi o wymogu budynku administracyjnego');
  if (/ulepszani[ea] terenu|auto ulepszeń|wycink|farm/i.test(cityLead)) out.push('C: lead administratora miasta wspomina ulepszenia terenu');

  // (D) wspólny ogólny tekst usunięty
  if (/osoba przypisana do jednego miasta/.test(src)) out.push('D: wspólny ogólny tekst „Administrator to osoba przypisana…” nadal istnieje');
  return out;
}

const realSrc = fs.readFileSync(SRC, 'utf8');
let fail = 0;
const ok = (name, cond, detail) => {
  if (cond) console.log('PASS: ' + name);
  else { fail++; console.log('FAIL: ' + name + (detail ? ' — ' + JSON.stringify(detail) : '')); }
};

const realV = violations(realSrc);
ok('realny kod administratorPanel.ts: zero naruszeń reguł A–D', realV.length === 0, realV);

// (E) mutacje w pamięci: każda musi dać co najmniej jedno naruszenie
const mutations = [
  { name: 'przywrócenie window.confirm przy zatrudnieniu', from: 'hooks.onHire();', to: "window.confirm('Zatrudnić?'); hooks.onHire();" },
  { name: 'przywrócenie window.confirm przy zwolnieniu', from: 'hooks.onDismiss();', to: "window.confirm('Zwolnić?'); hooks.onDismiss();" },
  { name: 'przywrócenie wspólnego tekstu „osoba przypisana”', from: "return 'Administrator miasta działa tylko", to: "return 'Administrator to osoba przypisana do jednego miasta. ' + 'Administrator miasta działa tylko" },
  { name: 'bonusy ulepszeń z produkcją/podatkami', from: 'Nie daje żadnych dodatkowych bonusów.', to: 'Bez dodatkowych bonusów do produkcji, podatków ani korupcji.' },
  { name: 'usunięcie wymogu budynku z leadu miasta', from: 'wymaga budynku administracyjnego w tym mieście (bez niego go nie zatrudnisz)', to: 'działa w tym mieście' },
];
for (const m of mutations) {
  if (!realSrc.includes(m.from)) { fail++; console.log('FAIL: mutacja nie trafia w źródło: ' + m.name); continue; }
  const mutSrc = realSrc.replace(m.from, m.to);
  const v = violations(mutSrc);
  ok('mutacja wykryta: ' + m.name, v.length > 0, v);
}

console.log(fail === 0 ? '== WSZYSTKO ZIELONE ==' : '== FAIL: ' + fail + ' ==');
process.exit(fail === 0 ? 0 : 1);
