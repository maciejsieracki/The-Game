/**
 * k01a-select-lib.mjs — deterministyczny wybór jednostek K01A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1, r3).
 *
 * Wejścia (wszystkie z repo lub z pinu, nic z katalogu roboczego agenta):
 *   - pin: `<PIN_DIR>/gra/src/ui/cityPanel.ts` (`git archive edb8fb56 gra/src gra/data`),
 *   - pomiar: `pomiar-r2.json` z R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1/r2-logi (kopia w
 *     `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/pomiar-r2.json`, sha256 w `PomiarSha`),
 *   - pinowe pliki modułów importowanych (`<PIN_DIR>/gra/src/...`), żeby ustalić, czy importowana nazwa jest
 *     typem (`interface`/`type`, erasowana przy kompilacji) czy wartością.
 *
 * Krok 1  Podział pinu na jednostki najwyższego poziomu (ta sama reguła co r1 `extract.py`:
 *         deklaracja `(export)? (async)? function|const|let|class|interface|type NAME` w kolumnie 0).
 * Krok 2  Jednostki bloku K01 = `pomiar.unit_block[NAME] === 1` (139 jednostek).
 * Krok 3  Odrzut DOM: ciało zawiera `document`, `el(`, `innerHTML`, `createElement`, `appendChild` (dispatch r1).
 * Krok 4  Klasyfikacja identyfikatorów ciała (bez komentarzy `//`, `/* *\/`, bez literałów tekstowych, bez
 *         właściwości `obj.prop`):
 *           - nazwa importowana z nagłówka pinu z modułu logiki (game|data|map|render|units|battle|types|…)
 *               typ (interface/type w źródle) -> blokada T (typ-only, erasowany; wymaga lokalnej kopii typu),
 *               wartość                       -> blokada R (import logiki gry),
 *           - nazwa importowana z modułu ui/ (formatPl, icons/*, uiParams, …)  -> dozwolona,
 *           - nazwa deklarowana na najwyższym poziomie pinu w jednostce K01 -> zależność wewnętrzna,
 *           - nazwa deklarowana na najwyższym poziomie pinu w innym bloku  -> blokada P (poza zakresem K01A),
 *           - pozostałe (zmienne lokalne, globalne przeglądarki/JS) -> dozwolone.
 * Krok 5  Punkt stały: jednostka wchodzi do zbioru, gdy nie ma blokady R/T/P i wszystkie jej zależności
 *         wewnętrzne weszły do zbioru. Iteracja do zbieżności. Wynik: `selected` i `deferred` z pierwszą blokadą.
 *
 * Uwaga metodologiczna: klasyfikacja jest regexowa (nie AST), więc jest konserwatywna: nazwa lokalna
 * zacieniająca top-level deklarację innego bloku daje fałszywą blokadę P (odroczenie, nie błędny port).
 * Każde odroczenie ma w wyniku `firstBlocker`, który recenzent może sprawdzić ręcznie.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';

export const PIN_ID = 'edb8fb56';
export const K01_BLOCK = '1';
export const POMIAR_SHA256 = '54e80319bc48a5af920ad196c61bf92ea5293a82f48df654c64b16d04878e4ef';
const DECL_START = /^(?:export\s+)?(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_$][\w$]*)/;
const DECL_KIND = /(function|const|let|class|interface|type)\s+[A-Za-z_$]/;
// Ten sam zbiór co gate C w run-k01a.mjs (różnica = błąd): tokeny DOM liczone po liniach niebędących komentarzem.
export const DOM_TOKENS = [/\bdocument\b/, /\bel\(/, /innerHTML/, /createElement/, /appendChild/, /\bHTML\w*Element\b/, /classList/, /\.style\./, /querySelector/, /addEventListener/, /\bwindow\./, /localStorage/];
const LOGIC_DIR = /(^|\/)(game|data|map|render|units|battle|types|audio|perf|input|oblezenie|wonderpreview|util)(\/|$)|(^|\/)game$/;
const GLOBALS = new Set(
  (
    'Math JSON Number String Object Array Boolean Date Promise Set Map Error RegExp parseInt parseFloat isFinite isNaN ' +
    'undefined null true false console document window HTMLElement Element Node Event KeyboardEvent MouseEvent setTimeout ' +
    'clearTimeout requestAnimationFrame Intl encodeURIComponent decodeURIComponent Infinity NaN globalThis Symbol Reflect ' +
    'structuredClone Record Partial Readonly Pick Omit ReturnType Array this new return if else for while of in let const var ' +
    'function class typeof instanceof switch case break continue default throw try catch finally void delete async await ' +
    'yield export import from as type interface extends implements static get set constructor super'
  ).split(/\s+/)
);

/**
 * Lokalne kopie typów z pinu (ZAŁOŻENIE K01A-Z5): wyłącznie aliasy unii literałów tekstowych, bez logiki.
 * `pin` = plik i zakres linii w pinie; gate T w run-k01a.mjs porównuje tekst kopii z tym zakresem.
 * Typy obiektowe (BuildingDef, GameData, CityView…) NIE są kopiowane: pozostają blokadą T (odroczenie → DTO).
 */
export const LOCAL_TYPE_COPIES = [
  { name: 'OkolicaFocus', pin: 'gra/src/game/cities.ts', a: 45, b: 45 },
  { name: 'BudowaFocus', pin: 'gra/src/game/cities.ts', a: 60, b: 66 },
];

export const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

/** Usuwa komentarze i literały tekstowe (zastępuje spacjami, zachowuje długość linii). */
export function stripCommentsAndStrings(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && text[i] !== '\n') { out += ' '; i++; }
      continue;
    }
    if (c === '/' && d === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) { out += text[i] === '\n' ? '\n' : ' '; i++; }
      out += '  ';
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      out += c;
      i++;
      while (i < n && text[i] !== c) {
        if (text[i] === '\\') { out += '  '; i += 2; continue; }
        out += text[i] === '\n' ? '\n' : ' ';
        i++;
      }
      out += c;
      i++;
      continue;
    }
    // Szablony (`…`) zostawiamy w całości: wyrażenia `${…}` są kodem. Tekst stały może dać
    // fałszywy identyfikator (konserwatywnie: więcej blokad, nigdy mniej).
    if (c === '`') {
      out += c;
      i++;
      while (i < n && text[i] !== '`') {
        if (text[i] === '\\') { out += text[i] + (text[i + 1] ?? ''); i += 2; continue; }
        out += text[i];
        i++;
      }
      out += '`';
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Podział pinu na jednostki najwyższego poziomu. Zwraca { header:{a,b}, units:[{name,a,b,kind}] }. */
export function splitUnits(lines) {
  const starts = [];
  lines.forEach((l, idx) => {
    if (l && !/^\s/.test(l) && !'})];/*'.includes(l[0]) && !l.startsWith('//')) {
      const m = DECL_START.exec(l);
      if (m) starts.push({ line: idx + 1, name: m[1], kind: DECL_KIND.exec(l)[1] });
    }
  });
  const N = lines.length;
  const units = starts.map((s, k) => ({
    name: s.name,
    a: s.line,
    b: k + 1 < starts.length ? starts[k + 1].line - 1 : N,
    kind: s.kind,
  }));
  return { header: { a: 1, b: starts.length ? starts[0].line - 1 : N }, units };
}

/** Nagłówek pinu: importy (nazwa -> specyfikator względny od katalogu ui/). */
export function parseImports(headerText) {
  const imp = new Map();
  for (const m of headerText.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const part of m[2].split(',')) {
      const p = part.trim().replace(/^type\s+/, '');
      if (!p) continue;
      imp.set(p.split(/\s+as\s+/).pop().trim(), { spec: m[3], typeOnlyStmt: !!m[1] });
    }
  }
  for (const m of headerText.matchAll(/import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s*'([^']+)'/g)) {
    imp.set(m[1], { spec: m[2], typeOnlyStmt: false });
  }
  return imp;
}

function resolveModuleFile(uiDir, spec) {
  const base = resolve(uiDir, spec);
  for (const p of [base + '.ts', join(base, 'index.ts'), base]) {
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

/** Czy nazwa w pliku źródłowym jest tylko typem (interface/type) i nie ma jej jako wartości. */
function isTypeOnlyInSource(file, name) {
  if (!file) return null;
  const text = readFileSync(file, 'utf8');
  const typeDecl = new RegExp(`^(?:export\\s+)?(?:interface|type)\\s+${name}\\b`, 'm');
  const valueDecl = new RegExp(`^(?:export\\s+)?(?:async\\s+)?(?:const|let|var|function|class|enum)\\s+${name}\\b`, 'm');
  if (valueDecl.test(text)) return false;
  if (typeDecl.test(text)) return true;
  return null; // re-eksport lub nieznane: traktowane jak wartość (konserwatywnie)
}

/**
 * Główna funkcja. `pinDir` = katalog zawierający gra/src i gra/data; `pomiar` = sparsowany pomiar-r2.json.
 */
export function selectK01a({ pinDir, pomiar, localTypes = LOCAL_TYPE_COPIES }) {
  const localSet = new Set(localTypes.map((t) => t.name));
  const pinCp = join(pinDir, 'gra/src/ui/cityPanel.ts');
  const uiDir = join(pinDir, 'gra/src/ui');
  const lines = readFileSync(pinCp, 'utf8').split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  const { header, units } = splitUnits(lines);
  const headerText = lines.slice(header.a - 1, header.b).join('\n');
  const imports = parseImports(headerText);

  const unitBlock = pomiar.unit_block;
  const byName = new Map(units.map((u) => [u.name, u]));
  const k01 = units.filter((u) => unitBlock[u.name] === Number(K01_BLOCK));
  const k01Names = new Set(k01.map((u) => u.name));
  const missingInPin = Object.keys(unitBlock).filter((n) => !byName.has(n));

  const importInfo = new Map();
  for (const [name, { spec }] of imports) {
    const file = resolveModuleFile(uiDir, spec);
    const rel = file ? file.slice(join(pinDir, 'gra/src').length + 1) : spec;
    const isLogic = LOGIC_DIR.test(spec.replace(/^(\.\.\/)+/, '')) || /(^|\/)(game|data|map|render|units|battle|types)\b/.test(spec);
    const typeOnly = isLogic ? isTypeOnlyInSource(file, name) : false;
    importInfo.set(name, { spec, rel, logic: isLogic, typeOnly });
  }

  const info = new Map();
  for (const u of k01) {
    const body = stripCommentsAndStrings(lines.slice(u.a - 1, u.b).join('\n'));
    const domText = lines.slice(u.a - 1, u.b).filter((l) => !/^\s*\/\//.test(l)).join("\n");
    const dom = DOM_TOKENS.some((rx) => rx.test(domText));
    const ids = new Set();
    for (const m of body.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)/g)) {
      // pomiń klucze literałów obiektu: `{ name: …` lub `, name: …` (nie dotyczy `a ? b : c`)
      const after = body.slice(m.index + m[1].length).match(/^\s*:/);
      const before = body.slice(0, m.index).match(/([{,])\s*$/);
      if (after && before) continue;
      ids.add(m[1]);
    }
    const blockers = [];
    const internal = new Set();
    for (const id of ids) {
      if (id === u.name || GLOBALS.has(id)) continue;
      if (importInfo.has(id)) {
        const ii = importInfo.get(id);
        // Typ-only z logiki: dozwolony tylko jako LOKALNA KOPIA zweryfikowana bajtowo z pinem (LOCAL_TYPE_COPIES).
        if (ii.logic && ii.typeOnly && localSet.has(id)) continue;
        if (ii.logic) blockers.push({ kind: ii.typeOnly ? 'T' : 'R', id, from: ii.rel });
        continue;
      }
      if (byName.has(id)) {
        if (k01Names.has(id)) internal.add(id);
        else blockers.push({ kind: 'P', id, block: unitBlock[id] ?? 'brak-w-pomiarze' });
      }
    }
    info.set(u.name, { ...u, loc: u.b - u.a + 1, dom, blockers, internal });
  }

  const selected = new Set();
  for (const [name, x] of info) if (!x.dom && x.blockers.length === 0) selected.add(name);
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...selected]) {
      const x = info.get(name);
      if ([...x.internal].some((d) => !selected.has(d))) {
        selected.delete(name);
        changed = true;
      }
    }
  }

  const sel = k01.filter((u) => selected.has(u.name));
  const def = k01.filter((u) => !selected.has(u.name));
  const reason = (x) => {
    if (x.dom) return 'DOM';
    if (x.blockers.length) {
      const b = x.blockers[0];
      if (b.kind === 'T') return `T: typ ${b.id} z ${b.from} (wymaga lokalnej kopii typu)`;
      if (b.kind === 'R') return `R: import logiki ${b.id} z ${b.from}`;
      return `P: zależność ${b.id} (blok ${b.block}, poza K01)`;
    }
    const d = [...x.internal].find((n) => !selected.has(n));
    return `F: zależność wewnętrzna ${d} (odroczona)`;
  };
  const sum = (arr) => arr.reduce((s, u) => s + (u.b - u.a + 1), 0);
  return {
    pin: PIN_ID,
    pinUnits: units.length,
    headerLines: header.b,
    k01Units: k01.length,
    k01Loc: sum(k01),
    domUnits: [...info.values()].filter((x) => x.dom).length,
    domLoc: sum(k01.filter((u) => info.get(u.name).dom)),
    nonDomUnits: k01.filter((u) => !info.get(u.name).dom).length,
    selected: sel.map((u) => ({ name: u.name, a: u.a, b: u.b, loc: u.b - u.a + 1, kind: u.kind })),
    selectedLoc: sum(sel),
    deferred: def.map((u) => ({ name: u.name, a: u.a, b: u.b, loc: u.b - u.a + 1, reason: reason(info.get(u.name)), firstBlocker: info.get(u.name).blockers[0] ?? null })),
    deferredLoc: sum(def),
    missingInPin,
    importClasses: Object.fromEntries([...importInfo].map(([k, v]) => [k, { spec: v.spec, logic: v.logic, typeOnly: v.typeOnly }])),
  };
}

export function loadPomiar(path) {
  if (!existsSync(path)) throw new Error(`brak pomiaru: ${path}`);
  const h = sha256(path);
  if (h !== POMIAR_SHA256) throw new Error(`sha256 pomiaru ${h} != ${POMIAR_SHA256}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export { dirname };
