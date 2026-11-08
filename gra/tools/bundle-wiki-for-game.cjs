/**
 * bundle-wiki-for-game.cjs — pakuje poradnik + encyklopedię do JSON dla Gra-podglad.html (file://).
 * Uruchom: node gra/tools/bundle-wiki-for-game.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORADNIK_DIR = path.join(ROOT, 'docs', 'PORADNIK-GRACZA');
const ENCY_DIR = path.join(ROOT, 'docs', 'encyklopedia');
const OUT = path.join(__dirname, '..', 'src', 'data', 'wikiBundle.json');

const PORADNIK_FILES = [
  '00-jak-czytac.md', '01-pierwsze-kroki.md', '02-mapa-swiata.md', '03-pasek-zasobow.md',
  '04-jednostki-mapa.md', '05-budowa-mapa.md', '06-miasto-spoleczenstwo.md',
  '07-miasto-budowa-rekrutacja.md', '08-ekonomia-imperium.md', '09-nauka-epoki.md',
  '10-walka.md', '11-oblezanie.md', '12-dyplomacja.md', '13-cywilizacje.md',
  '14-ai-zagrozenia.md', '15-kultura-religia-cuda.md', '16-zwyciestwo.md', '17-zaawansowane.md',
  '28-katalog-ulepszen.md', '45-katalog-budynkow.md', '57-katalog-jednostek.md',
  '91-katalog-cudow-antyk.md',
];

const CAT_LABELS = {
  budynki: 'Budynki',
  jednostki: 'Jednostki',
  ulepszenia: 'Ulepszenia terenu',
  cuda: 'Cuda świata',
  cywilizacje: 'Cywilizacje',
  pojecia: 'Pojęcia',
  technologie: 'Technologie',
};

function readUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function titleFromMd(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Bez tytułu';
}

function extractSection(md, names) {
  for (const name of names) {
    const re = new RegExp(
      `##\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n##\\s|$)`,
      'i',
    );
    const m = md.match(re);
    if (m) {
      return m[0].replace(/^##[^\n]*\n/, '').trim();
    }
  }
  return '';
}

function metaField(md, key) {
  const re = new RegExp(`\\|\\s*${key}\\s*\\|\\s*([^|\\n]+)`, 'i');
  const m = md.match(re);
  return m ? m[1].trim().replace(/^`|`$/g, '') : '';
}

function stripFrontMatter(md) {
  const idx = md.indexOf('---');
  if (idx === -1) return md;
  const after = md.indexOf('---', idx + 3);
  if (after === -1) return md;
  return md.slice(after + 3).trim();
}

function bundlePoradnik() {
  return PORADNIK_FILES.map((file) => {
    const full = path.join(PORADNIK_DIR, file);
    if (!fs.existsSync(full)) {
      console.warn('Brak poradnika:', file);
      return null;
    }
    const md = readUtf8(full);
    const id = file.replace(/\.md$/, '');
    return {
      id,
      file,
      title: titleFromMd(md),
      content: md,
    };
  }).filter(Boolean);
}

function walkMd(dir, rel = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('_')) continue; // np. _archiwum/ — hasła wycofane, NIE bundlować do gry
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...walkMd(full, path.join(rel, name)));
    } else if (name.endsWith('.md') && name !== 'indeks.md') {
      out.push({ full, rel: path.join(rel, name).replace(/\\/g, '/') });
    }
  }
  return out;
}

function bundleEncyklopedia(dir = ENCY_DIR) {
  const files = walkMd(dir);
  return files.map(({ full, rel }) => {
    const md = readUtf8(full);
    const parts = rel.split('/');
    const folder = parts[0] ?? 'pojecia';
    const slug = path.basename(rel, '.md');
    const title = metaField(md, 'tytuł') || titleFromMd(md);
    const category = metaField(md, 'kategoria') || CAT_LABELS[folder] || folder;
    // T9 (R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1): mostek gra-id — opcjonalne pole
    // frontmatter dla haseł, gdzie prosty derywowany slug NIE wystarcza (np. warianty
    // kopalni: kopalnia_miedzi/zelaza/cyny/zlota → jeden wspólny plik kopalnia.md).
    // Format: "| gra-id | id1, id2, id3 |". Puste/brak pola → [] (fallback na e.slug===id).
    const gameIdsRaw = metaField(md, 'gra-id');
    const gameIds = gameIdsRaw
      ? gameIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const wikiS = extractSection(md, ['Wiki‑S', 'Wiki-S']);
    const wikiM = extractSection(md, ['Wiki‑M', 'Wiki-M']);
    const historia = extractSection(md, ['Rys historyczny']);
    const body = stripFrontMatter(md);
    return {
      id: `${folder}/${slug}`,
      slug,
      folder,
      category,
      title,
      gameIds,
      wikiS: wikiS || title,
      wikiM: wikiM || body.slice(0, 1200),
      full: body,
      historia: historia || '',
    };
  }).sort((a, b) => a.title.localeCompare(b.title, 'pl'));
}

function outputPathFromArgs(argv) {
  if (argv.length === 0) return OUT;
  if (argv.length !== 2 || argv[0] !== '--output' || !argv[1]) {
    throw new Error('Usage: node bundle-wiki-for-game.cjs [--output <path>]');
  }
  return path.resolve(process.cwd(), argv[1]);
}

function main(argv = process.argv.slice(2)) {
  const outputPath = outputPathFromArgs(argv);
  const bundle = {
    version: 'rev-civpedia-2026-08-05',
    // Stabilna metadana rewizji; build nie może zależeć od zegara środowiska.
    generated: '2026-09-05',
    poradnik: bundlePoradnik(),
    encyklopedia: bundleEncyklopedia(),
  };

  const json = JSON.stringify(bundle);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, json, 'utf8');
  const kb = (Buffer.byteLength(json) / 1024).toFixed(0);
  console.log(`${path.basename(outputPath)}: ${bundle.poradnik.length} rozdz. + ${bundle.encyklopedia.length} haseł (~${kb} KB)`);
}

// R-CIVPEDIA-HISTORIA-INFRA-Q1: uruchomienie skryptu (i realny zapis do
// wikiBundle.json) TYLKO gdy wywołany bezpośrednio (`node bundle-wiki-for-game.cjs`).
// `require()` (np. z testu) NIE regeneruje pliku ani nie ma efektów ubocznych —
// pozwala testom wywoływać extractSection()/bundleEncyklopedia() na fixture'ach
// bez dotykania prawdziwego gra/src/data/wikiBundle.json.
if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

module.exports = { extractSection, bundleEncyklopedia, bundlePoradnik, metaField, titleFromMd, stripFrontMatter };
