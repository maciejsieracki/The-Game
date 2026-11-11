/**
 * polish-language-audit-q1-guard-test.cjs — strażnik poprawek R-WEB-POLISH-LANGUAGE-AUDIT-Q1.
 * Pilnuje, by naprawione frazy (zła -> dobra) nie wróciły w źródłach i w wikiBundle.json.
 * Uruchom: node gra/tools/polish-language-audit-q1-guard-test.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

const BAD = [
  [/\+1 kamien\/t/, 'kamien/t -> kamienia/t'],
  [/odblokowuje \*\*kamien\*\*/, 'kamien -> kamień'],
  [/Swiatynia/, 'Swiatynia -> Świątynia'],
  [/Wielki dzwón/, 'dzwón -> dzwon'],
  [/\+3 Zaufanie — wyrocznia/, 'Zaufanie -> Zaufania'],
  [/\+3 Pieniądz\/turę \(cywilizacja\)/, 'Pieniądz -> Pieniądza'],
  [/\+15% wzrost populacji/, 'wzrost -> wzrostu'],
  [/\+2 bazowe Zaufanie/, 'bazowe Zaufanie -> bazowego Zaufania'],
  [/Brama narodów/, 'Brama narodów -> Brama wszystkich narodów'],
];
const files = [
  ...walk('docs/encyklopedia').filter((f) => f.endsWith('.md')),
  'docs/PORADNIK-GRACZA/45-katalog-budynkow.md',
  'docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md',
  'gra/data/buildings.json', 'gra/data/wonders.json', 'gra/data/tech-cards-top5.json',
  'gra/tools/gen-tech-cards-top5.zdania.json', 'gra/src/data/wikiBundle.json',
  'dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv',
  'dyspozycje/analizy/karty-odkryc/narzedzia/techdata.py',
];
let pass = 0, fail = 0;
for (const f of files) {
  const t = rd(f);
  for (const [re, why] of BAD) {
    if (re.test(t)) { fail++; console.log('FAIL', f, why); } else pass++;
  }
}

// ── Runda 2: teksty w gra/src/ui i main.ts (literały napisów) ─────────────────────────────
// [regex błędnej frazy, opis, próbka błędnego tekstu = dowód mutacyjny, że regex NAPRAWDĘ łapie błąd]
const UI_BAD = [
  [/Za malo zlota/, 'Za malo zlota -> Za mało złota', "buyTitle = `Za malo zlota (1/2)`"],
  [/Zaplac zlotem i ukoncz/, 'Zaplac zlotem -> Zapłać złotem', "'Zaplac zlotem i ukoncz natychmiast'"],
  [/Nie udalo sie odswiezyc/, 'udalo sie odswiezyc -> udało się odświeżyć', 'Nie udalo sie odswiezyc drzewka.'],
  [/najedz na pole i nacisnij B/, 'najedz/nacisnij -> najedź/naciśnij', "'Nie wybrano heksu — najedz na pole i nacisnij B'"],
  [/Autozapis nieudany \(blad zapisu\)/, 'blad -> błąd', "notifyAutosaveFailureOnce('Autozapis nieudany (blad zapisu)')"],
  [/sprobuj inny seed/, 'sprobuj inny seed -> spróbuj innego seeda', "brak miejsca — sprobuj inny seed"],
  [/Masz juz <strong>/, 'juz -> już', "'Masz juz <strong>wszystkie technologie'"],
  [/Epoke Braz(?:u)? badasz|Epokę Braz badasz/, 'Epoke Braz -> Epokę Brązu', 'Epoke Braz badasz od zera'],
  [/name: 'Epoka (?:Brazu|Zelaza)'/, 'Epoka Brazu/Zelaza -> Brązu/Żelaza', "name: 'Epoka Zelaza'"],
  [/badge: 'Dostepna'/, 'Dostepna -> Dostępna', "badge: 'Dostepna'"],
  [/\['(?:Trudnosc|Typ swiata|Miasta-panstwa|Predkosc|Jakosc grafiki|Barbarzyncy|Zwyciestwo|Koszty budynkow|Wzrost ludnosci|Zasieg ruchu|Trudnosc miast-panstw)'/, 'ASCII-fikacja etykiet podsumowania nowej gry', "['Trudnosc', p.difficulty]"],
  [/\(jak glowna\)/, 'glowna -> główna', "p.difficulty + ' (jak glowna)'"],
  [/tur\(y\) na reakcję/, 'tur(y) -> odmiana liczebnika', '`${n} tur(y) na reakcję`'],
  [/\$\{p\.unitsOnMap\} jednostek na mapie/, 'N jednostek na mapie -> formatJednostkiCount', '`${p.unitsOnMap} jednostek na mapie`'],
  [/\$\{hiddenCount\} jednostki — zostają/, 'wszystkie N jednostki -> formatJednostkiCount', '`Odfortyfikuj wszystkie ${hiddenCount} jednostki — zostają`'],
  [/\$\{n\} jednostek odfortyfikowano/, 'N jednostek odfortyfikowano -> formatJednostkiCount', '`${n} jednostek odfortyfikowano`'],
  [/\$\{(?:lowHappy|affected|affectedImp\.length)[^}]*\} miast /, 'N miast -> formatMiastaCount', '`${lowHappy} miast z obcą kulturą`'],
  [/\$\{s\.osiedla\} miast/, 'N miast -> formatMiastaCount', '`${s.osiedla} miast`'],
  [/\$\{s\.turnsLeft\} tur do końca/, 'N tur -> formatTurCount', '`${s.turnsLeft} tur do końca`'],
  [/\$\{state\.revoltGraceRemaining\} tur`/, 'N tur -> formatTurCount', '`${state.revoltGraceRemaining} tur`'],
  [/\$\{city\.population\} obywateli/, 'N obywateli -> formatObywateleLabel', '`${city.population} obywateli`'],
  [/\$\{actionable\.length\} umów/, 'N umów -> formatUmowyCount', '`(${actionable.length} umów)`'],
  [/utracono \$\{\w+\} jednostek/, 'utracono N jednostek -> pluralPl (biernik)', '`Głód: utracono ${n} jednostek`'],
  [/(?:nieagresji|[Rr]ozejm) na \$\{[^}]+\} tur[`'" .,]/, 'na N tur -> formatTurCountAcc (biernik)', '`Pakt nieagresji na ${p.turns ?? 15} tur`'],
  [/przez \$\{[^}]+\} tur[`'" .,]/, 'przez N tur -> formatTurCountAcc (biernik)', '` za 5 zlota/turę przez ${AI_RESOURCE_TRADE_DEFAULT_TURNS} tur`'],
  [/za \$\{[^}]+\} tur[<`'" .,]/, 'za N tur -> formatTurCountAcc (biernik)', '`<b>Głód wojska za ${e.zywnoscKarencjaZaTur} tur</b>`'],
  [/max HP u \$\{[^}]+\} jednostek/, 'u N jednostek -> pluralPl (dopełniacz)', '`max HP u ${playerDamagedCount} jednostek`'],
  [/\$\{totalBuildings\} budynków/, 'N budynków -> formatBudynkiCount', '`<span class="val">${totalBuildings} budynków</span>`'],
];
const UI_FILES = walk('gra/src/ui').filter((f) => f.endsWith('.ts') && !/entityCards|resourceAmountChip|administratorIcon|buildModeHud/.test(f))
  .concat(['gra/src/main.ts']);
// linie niebędące komentarzem (komentarze deweloperskie poza zakresem rundy)
const codeLines = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '$1')).filter((l) => l.trim() !== '');
let uiPass = 0, uiFail = 0;
for (const [re, why, sample] of UI_BAD) {
  if (!re.test(sample)) { uiFail++; console.log('FAIL mutacja: regex nie łapie próbki błędu:', why); } else uiPass++;
}
// 1) żadna błędna fraza nie wraca w literałach UI
for (const f of UI_FILES) {
  const lines = codeLines(rd(f));
  const t = lines.join('\n');
  for (const [re, why] of UI_BAD) {
    if (re.test(t)) { uiFail++; console.log('FAIL', f, why); } else uiPass++;
  }
  // 2) cudzysłów polski: otwarcie „ musi kończyć się ” (nie ASCII ")
  const badQuote = lines.filter((l) => /„[^”"<>\n]{1,70}"/.test(l));
  if (badQuote.length) { uiFail++; console.log('FAIL', f, 'cudzysłów „…" zamiast „…” :', badQuote[0].trim().slice(0, 100)); } else uiPass++;
}
// dowód mutacyjny reguły cudzysłowu
if (!/„[^”"<>\n]{1,70}"/.test('x = „Dalej" y')) { uiFail++; console.log('FAIL mutacja cudzysłowu'); } else uiPass++;
// 3) odmiana: helpery faktycznie działają (transpilacja formatPl.ts i manpower.ts)
try {
  const esbuild = require('esbuild');
  const load = (p) => { const m = { exports: {} }; new Function('module', 'exports', 'require', esbuild.transformSync(rd(p), { loader: 'ts', format: 'cjs' }).code)(m, m.exports, require); return m.exports; };
  const F = load('gra/src/ui/formatPl.ts');
  const eq = (a, b, n) => { if (a !== b) { uiFail++; console.log('FAIL', n, JSON.stringify(a), '!=', JSON.stringify(b)); } else uiPass++; };
  eq(F.formatTurCount(1), '1 tura', 'tura1'); eq(F.formatTurCount(3), '3 tury', 'tury3'); eq(F.formatTurCount(5), '5 tur', 'tur5');
  eq(F.formatTurCount(12), '12 tur', 'tur12'); eq(F.formatTurCount(22), '22 tury', 'tury22');
  eq(F.formatTurCountAcc(1), '1 turę', 'ture1'); eq(F.formatTurCountAcc(15), '15 tur', 'tur15');
  eq(F.formatBudynkiCount(2), '2 budynki', 'budynki2'); eq(F.formatBudynkiCount(7), '7 budynków', 'budynkow7');
  eq(F.formatUmowyCount(1), '1 umowa', 'umowa1'); eq(F.formatUmowyCount(3), '3 umowy', 'umowy3'); eq(F.formatUmowyCount(6), '6 umów', 'umow6');
  eq(F.pluralPl(1, 'jednostkę', 'jednostki', 'jednostek'), 'jednostkę', 'pl1'); eq(F.pluralPl(4, 'jednostkę', 'jednostki', 'jednostek'), 'jednostki', 'pl4');
  const src = rd('gra/src/game/manpower.ts');
  const m = /export function formatObywateleLabel\(count: number\): string \{[\s\S]*?\n\}/.exec(src);
  const G = (() => { const mm = { exports: {} }; new Function('module', 'exports', esbuild.transformSync(m[0].replace('export function', 'function') + '\nmodule.exports = { formatObywateleLabel };', { loader: 'ts', format: 'cjs' }).code)(mm, mm.exports); return mm.exports; })();
  eq(F.formatMiastaCount(22), '22 miasta', 'miasta22'); eq(F.formatMiastaCount(12), '12 miast', 'miast12'); eq(F.formatMiastaCount(3), '3 miasta', 'miasta3'); eq(F.formatMiastaCount(1), '1 miasto', 'miasto1'); eq(F.formatMiastaCount(25), '25 miast', 'miast25');
  eq(F.formatKolejkiCount(23), '23 kolejki', 'kolejki23'); eq(F.formatKolejkiCount(11), '11 kolejek', 'kolejek11');
  eq(G.formatObywateleLabel(1), '1 obywatel', 'ob1'); eq(G.formatObywateleLabel(3), '3 obywatele', 'ob3'); eq(G.formatObywateleLabel(5), '5 obywateli', 'ob5'); eq(G.formatObywateleLabel(13), '13 obywateli', 'ob13'); eq(G.formatObywateleLabel(23), '23 obywatele', 'ob23');
} catch (e) { uiFail++; console.log('FAIL odmiana (esbuild):', e && e.message); }
pass += uiPass; fail += uiFail;
console.log(`polish-language-audit-q1-guard (runda 2, UI): ${uiPass} ok, ${uiFail} fail`);

console.log(`polish-language-audit-q1-guard: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
