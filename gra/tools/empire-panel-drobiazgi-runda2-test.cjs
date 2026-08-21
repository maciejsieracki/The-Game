'use strict';
/**
 * empire-panel-drobiazgi-runda2-test.cjs
 * P-DESIGN-11-ZAKLADEK-DROBIAZGI-RUNDA-2-BEZ-AKCJI — ECHO właściciela 2026-08-21: naprawa 4
 * z 5 zarejestrowanych drobnych uwag Evaluatora w panelu imperium (empireDetailPanel.ts). N1 NIE
 * jest w zakresie (korekta historii commita).
 *
 * Sprawdzone przed napisaniem tego pliku: żaden istniejący `empire-panel-*`/`empire-*` test w
 * tools/ nie pokrywał treści zakładek Handel/Armia/Kultura (grep na "DOCHÓD SZLAKÓW"/"HANDEL —
 * SZLAKI"/">ARMIA<"/"KULTURA IMPERIUM"/"civ-emp-eyebrow" trafiał wyłącznie w
 * empire-{nauka,praca,religia,skarbiec}-panel-coverage-test.cjs — inne zakładki).
 *
 * Metoda: sekcje renderujące te trzy zakładki (renderHandelSection + fragment inline "ARMIA"/
 * "KULTURA" w prywatnej funkcji render() main.ts-closure) NIE są eksportowane z
 * empireDetailPanel.ts (w przeciwieństwie do renderMiastoSection/renderObywateleSection) — REALNE
 * wykonanie esbuild+jsdom wymagałoby dodania `export`, poza allowlistą/zakresem tej naprawy.
 * Test więc weryfikuje źródło-tekst na WYCINKACH ograniczonych granicami funkcji (nie gołym
 * `includes()` gdziekolwiek w pliku), tym samym wzorcem co empire-{nauka,praca,religia,
 * skarbiec}-panel-coverage-test.cjs w tym repo. Formuła odwrócenia bonusu cudów (N5) jest
 * dodatkowo zweryfikowana NIEZALEŻNIE, czystą arytmetyką odtwarzającą dokładnie ten sam wzór co
 * main.ts (`income = Math.floor(base * (1 + bonus))`) i kod naprawy (odwrotność), żeby złapać
 * pomyłkę w samej formule, nie tylko jej obecność w tekście.
 *
 * Run from gra/: node tools/empire-panel-drobiazgi-runda2-test.cjs
 */

const fs = require('fs');
const path = require('path');

const PANEL_TS = path.resolve(__dirname, '..', 'src/ui/empireDetailPanel.ts');
const src = fs.readFileSync(PANEL_TS, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

function sliceFn(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) return null;
  // Przeskocz listę parametrów licząc nawiasy okrągłe (mogą zawierać typy z `{ skipHero?: bool }`,
  // które inaczej myliłyby naiwne "pierwszy `{`" jako początek CIAŁA funkcji).
  let i = src.indexOf('(', start);
  let parenDepth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '(') parenDepth++;
    else if (src[i] === ')') { parenDepth--; if (parenDepth === 0) { i++; break; } }
  }
  const braceStart = src.indexOf('{', i);
  let depth = 0;
  for (let j = braceStart; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, j + 1);
    }
  }
  return null;
}

// ===========================================================================
// N5 — box "DOCHÓD SZLAKÓW" w Handlu nie może dublować hero (musi pokazać BAZĘ, nie sumę)
// ===========================================================================
console.log('-- N5: box DOCHÓD SZLAKÓW pokazuje bazę (bez bonusu cudów), różną od hero --');
{
  const fn = sliceFn('renderHandelSection');
  ok(fn !== null, 'renderHandelSection() znaleziona');
  ok(fn.includes('DOCHÓD SZLAKÓW (BAZA)'), 'etykieta boxa zmieniona na "(BAZA)" — sygnalizuje inną liczbę niż hero');
  ok(!/<div class="k">DOCHÓD SZLAKÓW<\/div>\s*<div class="v">\$\{signedPl\(t\.totalIncome\)\}/.test(fn),
    'box NIE drukuje już wprost t.totalIncome (regres N5 — dokładnie ten sam błąd co zgłoszony)');
  ok(fn.includes('const tradeBase = t.routes.reduce'), 'box liczy osobną wartość tradeBase (nie totalIncome)');
  ok(/<div class="v">\$\{signedPl\(tradeBase\)\}/.test(fn), 'box drukuje signedPl(tradeBase), nie signedPl(t.totalIncome)');
  ok(fn.includes("bonusPct = r.medium === 'morze' ? t.wonderBonusMorzePct : t.wonderBonusLadPct"),
    'baza odwraca bonus WŁAŚCIWY dla medium trasy (ląd vs morze mają różny % bonusu cudów)');

  // Arytmetyka niezależnie od źródła-tekstu: odtwarza main.ts (`income = floor(base*(1+bonus))`)
  // i sprawdza, że odwrotność w naprawie N5 daje z powrotem `base` (a suma tradeBase != totalIncome
  // gdy bonus > 0, i tradeBase === totalIncome gdy bonus === 0).
  function mainTsIncome(base, bonusPct) {
    const bonus = bonusPct / 100;
    return bonus === 0 ? base : Math.floor(base * (1 + bonus));
  }
  function fixTradeBase(routes, wonderBonusLadPct, wonderBonusMorzePct) {
    return routes.reduce((sum, r) => {
      const bonusPct = r.medium === 'morze' ? wonderBonusMorzePct : wonderBonusLadPct;
      return sum + (bonusPct > 0 ? Math.round(r.income / (1 + bonusPct / 100)) : r.income);
    }, 0);
  }
  {
    // Bez bonusu: baza === suma === income (żadnej różnicy do pokazania, ale też brak regresji).
    const base = 40;
    const income = mainTsIncome(base, 0);
    const routes = [{ medium: 'lad', income }];
    const tradeBase = fixTradeBase(routes, 0, 0);
    ok(tradeBase === income, `N5-arytmetyka: bez bonusu tradeBase(${tradeBase}) === totalIncome(${income})`);
  }
  {
    // Z bonusem 15% na lądzie: main.ts daje income=floor(40*1.15)=46; naprawa musi odtworzyć base=40.
    const base = 40;
    const bonusPct = 15;
    const income = mainTsIncome(base, bonusPct);
    ok(income === 46, `N5-arytmetyka: main.ts income z bonusu 15% na bazie 40 = 46 (got ${income})`);
    const routes = [{ medium: 'lad', income }];
    const tradeBase = fixTradeBase(routes, bonusPct, 0);
    ok(tradeBase === base, `N5-arytmetyka: naprawa odwraca bonus i odtwarza bazę 40 (got ${tradeBase})`);
    const totalIncome = routes.reduce((s, r) => s + r.income, 0);
    ok(tradeBase !== totalIncome, `N5-sedno: przy bonusie > 0 box(${tradeBase}) != hero(${totalIncome}) — dwie RÓŻNE liczby`);
  }
  {
    // Ląd i morze z różnym % bonusu w tej samej sumie — baza musi odwrócić KAŻDĄ trasę jej WŁASNYM %.
    const ladIncome = mainTsIncome(100, 10);   // 110
    const morzeIncome = mainTsIncome(100, 20); // 120
    const routes = [{ medium: 'lad', income: ladIncome }, { medium: 'morze', income: morzeIncome }];
    const tradeBase = fixTradeBase(routes, 10, 20);
    ok(tradeBase === 200, `N5-arytmetyka: mieszane medium — baza sumuje się do 200 (got ${tradeBase})`);
  }
}

// ===========================================================================
// N9 — plakietka kosztu żywności armii NIE jest czerwonym ostrzeżeniem przy koszcie = 0
// ===========================================================================
console.log('-- N9: "Koszt żywności armii" — koszt 0 NIE renderuje czerwonej plakietki "-0/turę" --');
{
  // Wycinek "ARMIA" nie jest osobną funkcją (buduje się inline w domknięciu render()) — szukamy
  // po kotwicy data-section="armia" do kolejnej sekcji data-section="kultura".
  const armiaStart = src.indexOf('data-section="armia"');
  const kulturaStart = src.indexOf('data-section="kultura"');
  ok(armiaStart > -1 && kulturaStart > armiaStart, 'sekcja Armia (data-section="armia") znaleziona przed Kulturą');
  const armiaBody = armiaStart > -1 && kulturaStart > armiaStart ? src.slice(armiaStart, kulturaStart) : '';

  ok(armiaBody.includes("const zywTxt = kosztWojska > 0 ? `−${kosztWojska}` : '0';"),
    'zywTxt (już liczone dla boxa ZAOPATRZENIE) — reużyte, nie liczone osobno drugi raz');
  ok(!/<span class="d neg">−\$\{kosztWojska\} \/ turę<\/span>/.test(armiaBody),
    'regres N9: plakietka NIE drukuje już bezwarunkowo `d neg` + dosłowny minus niezależnie od wartości');
  ok(/<span class="d \$\{kosztWojska > 0 \? 'neg' : 'z'\}">\$\{zywTxt\} \/ turę<\/span>/.test(armiaBody),
    'plakietka koloruje się `neg` TYLKO gdy koszt > 0, inaczej neutralne `d z` (konwencja `deltaHtml`/`treasuryDeltaHtml`)');

  // Kontrola przytomności konwencji: `.d.z` jest już w arkuszu stylów jako neutralny szary,
  // różny od `.d.neg` (czerwony) — potwierdza, że "z" to realna, zdefiniowana klasa, nie literówka.
  ok(src.includes('.civ-emp-zrow .val .d.z{color:#6f7889;}'), 'klasa `.d.z` zdefiniowana w CSS jako neutralny szary (konwencja zer)');
  ok(src.includes('.civ-emp-zrow .val .d.neg{color:#e07a7a;}'), 'klasa `.d.neg` zdefiniowana w CSS jako czerwony (konwencja kosztu > 0)');
}

// ===========================================================================
// N11 — komentarz przy cityPoborMiniRekruci() musi opisywać RZECZYWISTĄ zmianę (tabela, nie tylko nagłówek)
// ===========================================================================
console.log('-- N11: komentarz cityPoborMiniRekruci() opisuje faktyczną zmianę (tabela + RAZEM), nie tylko nagłówek --');
{
  const fn = sliceFn('cityPoborMiniRekruci');
  ok(fn !== null, 'cityPoborMiniRekruci() znaleziona');
  ok(!fn.includes('Domyślne wywołanie (blok ZASOBY IMPERIUM) bez zmian'),
    'regres N11: stary, nieścisły komentarz ("default call unchanged") usunięty');
  ok(fn.includes('civ-emp-armia-rekr-tbl') , 'komentarz/kod wzmiankuje klasę civ-emp-armia-rekr-tbl (wyrównanie liczb)');
  ok(/JEDYNA różnica między dwoma wywołaniami/.test(fn) || /ONLY difference between the two call sites/.test(fn),
    'nowy komentarz jasno nazywa JEDYNĄ różnicę między wywołaniami (nagłówek+pasek), nie całą tabelę');
  ok(/wspólna dla obu wywołań i zmienia się identycznie w\s*\/\/ OBU/.test(fn) || /shared by, and changes identically in, BOTH calls/.test(fn),
    'nowy komentarz mówi wprost, że TABELA (wyrównanie + RAZEM) zmienia się w OBU wywołaniach, nie tylko w Armii');

  // Grounding: sama klasa civ-emp-armia-rekr-tbl jest nadawana w bloku WSPÓLNYM dla obu ścieżek
  // wywołania (poza `if (!opts?.skipHero)`), więc twierdzenie komentarza jest zgodne z kodem.
  const skipHeroIdx = fn.indexOf('if (!opts?.skipHero)');
  // Szukamy MIEJSCA UŻYCIA klasy w markupie (nie samej wzmianki w komentarzu, która stoi wcześniej
  // w docstringu funkcji) — stąd kotwica z pełnym atrybutem class, nie goły string klasy.
  const tblClassIdx = fn.indexOf('class="civ-emp-mini civ-emp-armia-rekr-tbl"');
  const ifBlockEnd = fn.indexOf('\n  }', skipHeroIdx);
  ok(skipHeroIdx > -1 && tblClassIdx > -1 && tblClassIdx > ifBlockEnd,
    'grounding: użycie klasy `civ-emp-armia-rekr-tbl` w markupie faktycznie stoi POZA blokiem `if (!opts?.skipHero)` — wspólne dla obu wywołań');
}

// ===========================================================================
// N12 — ikona eyebrow (wzorem Surowców) dodana do Handel/Armia/Kultura
// ===========================================================================
console.log('-- N12: ikona eyebrow (chip-crate / odpowiednik) obecna w Handel/Armia/Kultura, wzorem Surowców --');
{
  // Surowce (wzorzec źródłowy) — kontrola przytomności, że pattern rzeczywiście istnieje i test
  // sprawdza właściwą rzecz.
  const surowceFn = sliceFn('renderSurowceSection');
  ok(surowceFn !== null && surowceFn.includes("brandIconSvg('chip-crate', 14)") && surowceFn.includes('civ-emp-res-hdr-row'),
    'Surowce: wzorzec ikony eyebrow (civ-emp-res-hdr-row + chip-crate) potwierdzony jako punkt odniesienia');

  const handelFn = sliceFn('renderHandelSection');
  ok(handelFn !== null && handelFn.includes('civ-emp-res-hdr-row') && handelFn.includes("brandIconSvg('cp-trade', 14)"),
    'Handel: eyebrow HANDEL — SZLAKI HANDLOWE opakowany w civ-emp-res-hdr-row z ikoną cp-trade');
  ok(/civ-emp-res-hdr-row[\s\S]{0,120}civ-emp-eyebrow">HANDEL — SZLAKI HANDLOWE/.test(handelFn || ''),
    'Handel: ikona i tekst eyebrow w tym samym wierszu civ-emp-res-hdr-row');

  const armiaStart = src.indexOf('data-section="armia"');
  const kulturaStart = src.indexOf('data-section="kultura"');
  const armiaBody = armiaStart > -1 && kulturaStart > armiaStart ? src.slice(armiaStart, kulturaStart) : '';
  ok(armiaBody.includes('civ-emp-res-hdr-row') && armiaBody.includes("brandIconSvg('tb-army', 14)"),
    'Armia: eyebrow ARMIA opakowany w civ-emp-res-hdr-row z ikoną tb-army');
  ok(/civ-emp-res-hdr-row[\s\S]{0,120}civ-emp-eyebrow">ARMIA/.test(armiaBody),
    'Armia: ikona i tekst eyebrow w tym samym wierszu civ-emp-res-hdr-row');

  const kulturaBody = kulturaStart > -1 ? src.slice(kulturaStart, kulturaStart + 2000) : '';
  ok(kulturaBody.includes('civ-emp-res-hdr-row') && kulturaBody.includes("brandIconSvg('cp-culture', 14)"),
    'Kultura: eyebrow KULTURA IMPERIUM opakowany w civ-emp-res-hdr-row z ikoną cp-culture');
  ok(/civ-emp-res-hdr-row[\s\S]{0,120}civ-emp-eyebrow">KULTURA IMPERIUM/.test(kulturaBody),
    'Kultura: ikona i tekst eyebrow w tym samym wierszu civ-emp-res-hdr-row');

  // Ikony muszą być RÓŻNE per zakładka (nie ślepe kopiowanie chip-crate wszędzie) — dopuszczalne
  // wg zgłoszenia ("ten sam chip-crate LUB odpowiadający typ"), tu wybrano typ odpowiadający.
  ok(handelFn.includes("'cp-trade'") && !handelFn.includes("'chip-crate'"),
    'Handel używa ikony odpowiadającej typowi (cp-trade), nie generycznego chip-crate Surowców');
  ok(armiaBody.includes("'tb-army'") && !armiaBody.includes("brandIconSvg('chip-crate'"),
    'Armia używa ikony odpowiadającej typowi (tb-army)');
  ok(kulturaBody.includes("'cp-culture'") && !kulturaBody.includes("brandIconSvg('chip-crate'"),
    'Kultura używa ikony odpowiadającej typowi (cp-culture)');
}

console.log(`\nempire-panel-drobiazgi-runda2-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
