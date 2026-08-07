#!/usr/bin/env node
/**
 * playbook-md-to-json.cjs — generator playbook.json z playbook.md (KANON).
 *
 * Decyzja Macieja (2026-08-07): playbook.md w korzeniu repo jest KANONEM pamięci
 * AutoBota. dyspozycje/autobot/playbook.json ma być z niego GENEROWANY, nigdy
 * edytowany ręcznie.
 *
 * Źródło: sekcja "## 2. Zasady" w playbook.md — tabela markdown z kolumnami
 * ID | Zasada | Kiedy ma zastosowanie | Sprawdziła się | Zawiodła | Status.
 *
 * Mapowanie wiersz→reguła:
 *   - Każdy wiersz ma ID w konwencji C-0NN. Istniejące reguły w JSON, które
 *     powstały z takiego wiersza, mają na końcu rule_text zapisany tag "[C-0NN]"
 *     — to jest "zapisane mapowanie" (przetrwa load/save aplikacji, bo rule_text
 *     jest polem znanym schematowi; pola spoza schematu playbook-manager.ts
 *     kasuje przy każdym save, więc mapowania NIE wolno trzymać w osobnym polu).
 *   - Dopasowanie po tagu → ZACHOWAJ istniejące id, win_count, fail_count,
 *     actionId i inne pola; zaktualizuj tylko rule_text/status wg markdownu.
 *     KRYTYCZNE: generator nigdy nie zeruje liczników reguły, która już ma dane
 *     zebrane przez aplikację (np. rule_101–109) — nawet jeśli markdown oznacza
 *     ją jako CHRONIONA.
 *   - Brak dopasowania → NOWA reguła: id = kolejny wolny "rule_1NN", liczniki
 *     zawsze 0/0 (protokół AUTOBOT.md sekcja 3 krok 5: nowa zasada = 0/0).
 *   - Reguły w JSON bez tagu "[C-0NN]" (np. rule_101, rule_102, rule_104..109)
 *     nie pochodzą z tabeli markdown (istniały przed generatorem) — generator
 *     ich NIE dotyka.
 *   - Reguła z tagiem w JSON, dla którego nie ma już wiersza w markdownie →
 *     zgłoszona jako ORPHANED, ale NIE usuwana (generator nigdy nie kasuje danych).
 *
 * Tryby:
 *   --dry-run   (domyślny, gdy nie podano --write) — pokazuje raport, nic nie zapisuje.
 *   --write     — jedyny tryb, który nadpisuje playbook.json. Wymaga jawnego podania.
 *   --dry-run MA MOC WETA: jeśli podano OBIE flagi naraz (--write --dry-run),
 *     zapis jest zablokowany niezależnie od --write — wypisywane jest jawne
 *     ostrzeżenie o zablokowanym zapisie. Żeby faktycznie zapisać, --dry-run
 *     musi być NIEobecna.
 *
 * Użycie:
 *   node dyspozycje/autobot/tools/playbook-md-to-json.cjs --dry-run
 *   node dyspozycje/autobot/tools/playbook-md-to-json.cjs --write
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const MD_PATH = path.join(REPO_ROOT, 'playbook.md');
const JSON_PATH = path.resolve(__dirname, '..', 'playbook.json');

const TAG_RE = /\[(C-\d{3})\]\s*$/;
const RULE_ID_RE = /^rule_(\d+)$/;

function stripMarkdownNoise(text) {
  return text
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitTableRow(line) {
  // "| a | b | c |" -> ["a","b","c"] — trim, drop empty leading/trailing cells
  const cells = line.split('|').map(c => c.trim());
  if (cells.length && cells[0] === '') cells.shift();
  if (cells.length && cells[cells.length - 1] === '') cells.pop();
  return cells;
}

/** Parsuje sekcję "## 2. Zasady" z playbook.md → wiersze {id, zasada, kiedy, sprawdzilaSie, zawiodla, statusRaw} */
function parseRulesSection(mdText) {
  const lines = mdText.split(/\r?\n/);
  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+2\.\s+Zasady/.test(lines[i])) {
      sectionStart = i;
      break;
    }
  }
  if (sectionStart === -1) {
    throw new Error('Nie znaleziono sekcji "## 2. Zasady" w playbook.md');
  }
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (/^##\s+\d+\./.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }
  const sectionLines = lines.slice(sectionStart, sectionEnd);

  const tableLines = sectionLines.filter(l => l.trim().startsWith('|'));
  if (tableLines.length < 2) {
    throw new Error('Nie znaleziono tabeli reguł w sekcji "## 2. Zasady"');
  }
  // tableLines[0] = header, tableLines[1] = separator (---), reszta = dane
  const dataLines = tableLines.slice(2).filter(l => /\|\s*C-\d{3}\s*\|/.test(l));

  return dataLines.map(line => {
    const cells = splitTableRow(line);
    const [id, zasada, kiedy, sprawdzilaSie, zawiodla, statusRaw] = cells;
    return {
      id: (id || '').trim(),
      zasada: stripMarkdownNoise(zasada || ''),
      kiedy: (kiedy || '').trim(),
      sprawdzilaSie: (sprawdzilaSie || '').trim(),
      zawiodla: (zawiodla || '').trim(),
      statusRaw: (statusRaw || '').trim(),
    };
  });
}

function mdStatusToCanonical(statusRaw) {
  if (/WYCOFANA/i.test(statusRaw)) return 'RETIRED';
  // AKTYWNA, CHRONIONA, W OBSERWACJI — wszystkie widoczne dla Operatora (spec v1: ACTIVE)
  return 'ACTIVE';
}

function isChroniona(statusRaw) {
  return /CHRONIONA/i.test(statusRaw);
}

/** Zbuduj mapę C-0NN -> reguła JSON, na podstawie tagu na końcu rule_text */
function buildTagMap(rules) {
  const map = new Map();
  for (const rule of rules) {
    const m = TAG_RE.exec(rule.rule_text || '');
    if (m) {
      const tag = m[1];
      if (map.has(tag)) {
        throw new Error(`Duplikat tagu ${tag} w playbook.json: ${map.get(tag).id} oraz ${rule.id}`);
      }
      map.set(tag, rule);
    }
  }
  return map;
}

function nextFreeRuleId(allRules) {
  let max = 100;
  for (const r of allRules) {
    const m = RULE_ID_RE.exec(r.id || '');
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `rule_${max + 1}`;
}

function computeWinRate(wins, losses) {
  const n = wins + losses;
  return n === 0 ? 0 : wins / n;
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const explicitDryRun = args.includes('--dry-run');
  // --dry-run ma MOC WETA: jeśli podano obie flagi naraz, zapis jest zablokowany
  // niezależnie od --write. Zapis następuje wyłącznie gdy --write podano BEZ --dry-run.
  const effectiveWrite = write && !explicitDryRun;
  const dryRun = !effectiveWrite;

  const mdText = fs.readFileSync(MD_PATH, 'utf8');
  const pb = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

  const mdRows = parseRulesSection(mdText);
  const tagMap = buildTagMap(pb.rules);
  const seenTags = new Set();

  const report = [];
  const allIdsSoFar = new Set(pb.rules.map(r => r.id));

  const updatedRules = pb.rules.map(r => ({ ...r })); // kopia robocza
  const additions = [];

  for (const row of mdRows) {
    seenTags.add(row.id);
    const targetText = `${row.zasada} [${row.id}]`;
    const targetStatus = mdStatusToCanonical(row.statusRaw);
    const existing = tagMap.get(row.id);

    const targetProtected = isChroniona(row.statusRaw);

    if (existing) {
      const target = updatedRules.find(r => r.id === existing.id);
      const textChanged = target.rule_text !== targetText;
      const statusChanged = target.status !== targetStatus;
      const protectedChanged = Boolean(target.protected) !== targetProtected;
      if (textChanged) target.rule_text = targetText;
      if (statusChanged) target.status = targetStatus;
      if (protectedChanged) target.protected = targetProtected;
      report.push({
        mdId: row.id,
        jsonId: existing.id,
        action: textChanged || statusChanged || protectedChanged ? 'UPDATE' : 'OK',
        detail: [
          textChanged ? 'rule_text zmieniony' : null,
          statusChanged ? `status ${existing.status} -> ${targetStatus}` : null,
          protectedChanged ? `protected ${Boolean(existing.protected)} -> ${targetProtected}` : null,
          `liczniki zachowane: ${existing.win_count}/${existing.fail_count}`,
        ].filter(Boolean).join('; '),
      });
    } else {
      const newId = nextFreeRuleId([...allIdsSoFar].map(id => ({ id })).concat(additions));
      allIdsSoFar.add(newId);
      const newRule = {
        id: newId,
        rule_text: targetText,
        status: targetStatus,
        protected: targetProtected,
        win_count: 0,
        fail_count: 0,
        win_rate: 0,
        lastUpdatedIso: new Date().toISOString(),
      };
      additions.push(newRule);
      report.push({
        mdId: row.id,
        jsonId: newId,
        action: 'ADD',
        detail: `nowa reguła, liczniki 0/0${isChroniona(row.statusRaw) ? ' (CHRONIONA — bariera, protected=true)' : ''}`,
      });
    }
  }

  // Tagi obecne w JSON, ale bez odpowiadającego wiersza w markdownie -> orphaned (nie kasujemy)
  for (const [tag, rule] of tagMap.entries()) {
    if (!seenTags.has(tag)) {
      report.push({
        mdId: tag,
        jsonId: rule.id,
        action: 'ORPHANED',
        detail: 'tag jest w playbook.json, ale wiersz zniknął z playbook.md — reguła NIE jest kasowana, wymaga decyzji człowieka',
      });
    }
  }

  const untaggedCount = pb.rules.filter(r => !TAG_RE.test(r.rule_text || '')).length;

  const finalRules = [...updatedRules, ...additions].map(r => ({
    ...r,
    win_rate: computeWinRate(r.win_count, r.fail_count),
  }));

  // --- Raport ---
  console.log('playbook-md-to-json — raport (' + (dryRun ? 'DRY-RUN, bez zapisu' : 'WRITE') + ')');
  console.log('='.repeat(78));
  for (const row of report) {
    console.log(`${row.action.padEnd(9)} ${row.mdId.padEnd(7)} -> ${row.jsonId.padEnd(11)} ${row.detail}`);
  }
  console.log('-'.repeat(78));
  const counts = report.reduce((acc, r) => { acc[r.action] = (acc[r.action] || 0) + 1; return acc; }, {});
  console.log(
    `Wiersze md: ${mdRows.length} · OK: ${counts.OK || 0} · UPDATE: ${counts.UPDATE || 0} ` +
    `· ADD: ${counts.ADD || 0} · ORPHANED: ${counts.ORPHANED || 0} · poza zakresem generatora (bez tagu): ${untaggedCount}`,
  );

  const hasChanges = (counts.UPDATE || 0) > 0 || (counts.ADD || 0) > 0;
  console.log(hasChanges ? 'WYNIK: playbook.json WYMAGA aktualizacji względem playbook.md.' : 'WYNIK: brak różnic — playbook.json jest zgodny z playbook.md.');

  if (write && explicitDryRun) {
    console.log('\n⚠️  OSTRZEŻENIE: podano jednocześnie --write i --dry-run — --dry-run ma moc weta, zapis ZABLOKOWANY.');
  }

  if (!effectiveWrite) {
    console.log('\n(tryb dry-run — aby zapisać, uruchom jawnie z flagą --write, BEZ --dry-run)');
    process.exit(hasChanges ? 1 : 0);
  }

  const outPb = {
    ...pb,
    version: (pb.version || 0) + 1,
    updatedAtIso: new Date().toISOString(),
    rules: finalRules,
    // thresholds / operatorContextAttributes / quarantine_rules / min_confidence_threshold
    // przepisywane bez zmian (spread powyżej) — generator ich nie rusza.
    // version / updatedAtIso bumpowane przy KAŻDYM realnym zapisie — ślad regeneracji.
  };
  fs.writeFileSync(JSON_PATH, JSON.stringify(outPb, null, 2) + '\n', 'utf8');
  console.log(`\nZAPISANO: ${JSON_PATH} (version -> ${outPb.version})`);
  process.exit(0);
}

main();
