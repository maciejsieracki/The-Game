#!/usr/bin/env node
/**
 * repin-ui2-overlay.mjs — buduje katalog odniesienia „pin `edb8fb56` + nakładka REPIN UI-2" dla starszych harnessów
 * (`run.mjs`, `run-level1a.mjs`, `run-cycles.mjs`, `run-hud-empire.mjs`, …), które porównują frontend-v2 z pinem.
 *
 * Po repinie (R-RUSTPORT-REPIN-UI-2-A-Q1) pliki z `tools/repin-ui2-manifest.json` są kopiami z `origin/main`, więc
 * w odniesieniu pinu zastępujemy WYŁĄCZNIE te pliki ich wersją z weba (sha256 sprawdzane z manifestem). Reszta drzewa
 * pinu bez zmian — każda inna różnica harnessu nadal jest regresją.
 * R-RUSTPORT-REPIN-UI-2-B-Q1: także `portDomRefs` manifestu (wersje weba plików portu DOM `unitReplacePicker.ts`,
 * `siegeMapPanel.ts`); `run-level1a.mjs` podpina wtedy estymator Milicji webu tym samym wzorem, co DTO „Rust”.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/repin-ui2-overlay.mjs --pin-dir <PIN_DIR> --web-dir <WEB_DIR> --out <NOWY_KATALOG>
 *        --web3-dir <WEB3_DIR>   (R-RUSTPORT-REPIN-WEB-UI-3-Q1: `git archive 9b019a7d8 gra/src gra/data`; wymagany, gdy
 *                                 istnieje `tools/repin-ui3-manifest.json`)
 * EXIT 0 <=> nakładka zbudowana i każdy plik zgodny z manifestem.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const [pinDir, webDir, out] = [argOf('--pin-dir'), argOf('--web-dir'), argOf('--out')];
if (!pinDir || !webDir || !out) {
  console.error('Użycie: node tools/repin-ui2-overlay.mjs --pin-dir <PIN_DIR> --web-dir <WEB_DIR> --out <NOWY_KATALOG>');
  process.exit(2);
}
if (existsSync(out)) {
  console.error(`--out ${out} już istnieje (wymagany nowy katalog)`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(new URL('./repin-ui2-manifest.json', import.meta.url), 'utf8'));
cpSync(resolve(pinDir), resolve(out), { recursive: true });
let bad = 0;
// R-RUSTPORT-REPIN-UI-2-B-Q1: oprócz kopii bajtowych (`files`) nakładka wstawia wersje weba plików portu DOM
// (`portDomRefs`: `unitReplacePicker.ts`, `siegeMapPanel.ts`) — starsze harnessy porównują port z TĄ wersją weba.
const entries = [...manifest.files, ...(manifest.portDomRefs ?? [])];
for (const f of entries) {
  const srcPath = f.pin.slice(f.pin.indexOf(':') + 1);
  const buf = readFileSync(join(resolve(webDir), srcPath));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== f.sha256) {
    bad++;
    console.error(`SHA ${srcPath} web=${sha} manifest=${f.sha256}`);
    continue;
  }
  const dst = join(resolve(out), srcPath);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, buf);
  console.log(`nakładka ${srcPath} (${buf.length} B)`);
}
// R-RUSTPORT-REPIN-UI-2-C-Q1 (addytywnie): pliki webu przepięte PORTEM DOM (nie kopią bajtową — nie ma ich w manifeście
// kopii) wchodzą do odniesienia z `tools/repin-ui2-overlay-ports/*.json` (jeden plik na partię; wpis = ścieżka `gra/…` +
// sha256 z `origin/main`). Dzięki temu starsze harnessy porównują port z wersją webu, którą ten port odwzorowuje.
const portsDir = new URL('./repin-ui2-overlay-ports/', import.meta.url);
let portFiles = 0;
if (existsSync(portsDir)) {
  for (const name of readdirSync(portsDir).filter((n) => n.endsWith('.json')).sort()) {
    const part = JSON.parse(readFileSync(new URL(name, portsDir), 'utf8'));
    for (const f of part.files) {
      const buf = readFileSync(join(resolve(webDir), f.src));
      const sha = createHash('sha256').update(buf).digest('hex');
      if (sha !== f.sha256) {
        bad++;
        console.error(`SHA ${f.src} web=${sha} ${name}=${f.sha256}`);
        continue;
      }
      const dst = join(resolve(out), f.src);
      mkdirSync(dirname(dst), { recursive: true });
      writeFileSync(dst, buf);
      portFiles++;
      console.log(`nakładka-port ${f.src} (${buf.length} B, ${name})`);
    }
  }
}
// R-RUSTPORT-REPIN-UI-2-D-Q1 (addytywnie): sekcje `overlayPorts*` manifestu — porty DOM repinowane do main; w odniesieniu
// podmieniamy plik webu z main (sha256 sprawdzane), bo port nie jest już równoważny pinowi.
let portFilesD = 0;
for (const [key, sec] of Object.entries(manifest)) {
  if (!key.startsWith('overlayPorts') || !sec || !Array.isArray(sec.files)) continue;
  for (const f of sec.files) {
    portFilesD++;
    const srcPath = f.pin.slice(f.pin.indexOf(':') + 1);
    const buf = readFileSync(join(resolve(webDir), srcPath));
    const sha = createHash('sha256').update(buf).digest('hex');
    if (sha !== f.sha256 || buf.length !== f.bytes) {
      bad++;
      console.error(`SHA ${key} ${srcPath} web=${sha}/${buf.length} manifest=${f.sha256}/${f.bytes}`);
      continue;
    }
    const dst = join(resolve(out), srcPath);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, buf);
    console.log(`nakładka ${key} ${srcPath} (${buf.length} B)`);
  }
}
console.log(`repin-ui2-overlay: portów overlayPorts*=${portFilesD}`);
// R-RUSTPORT-REPIN-UI-2-F-Q1 (addytywnie): porty DOM przepięte na web (`tools/repin-ui2*-ported.json`, jeden plik na
// partię) — w odniesieniu pinu podmieniany plik WEBA (sha256 weba z listy), port zostaje portem.
let ported = 0;
const toolsDir = new URL('./', import.meta.url);
for (const name of readdirSync(toolsDir).filter((n) => /^repin-ui2.*-ported\.json$/.test(n)).sort()) {
  const list = JSON.parse(readFileSync(new URL(name, toolsDir), 'utf8'));
  for (const f of list.files) {
    const buf = readFileSync(join(resolve(webDir), f.web));
    const sha = createHash('sha256').update(buf).digest('hex');
    if (sha !== f.sha256 || buf.length !== f.bytes) {
      bad++;
      console.error(`SHA ${f.web} web=${sha}/${buf.length} ${name}=${f.sha256}/${f.bytes}`);
      continue;
    }
    const dst = join(resolve(out), f.web);
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, buf);
    ported++;
    console.log(`nakładka (port DOM, ${name}) ${f.web} (${buf.length} B)`);
  }
}
// R-RUSTPORT-REPIN-UI-2-E-Q1: pliki portu DOM (PD) zrepinowane na web — w odniesieniu wersja webu (sha256 z manifestu).
for (const f of manifest.overlayPd ?? []) {
  const srcPath = f.pin.slice(f.pin.indexOf(':') + 1);
  const buf = readFileSync(join(resolve(webDir), srcPath));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== f.sha256) {
    bad++;
    console.error(`SHA ${srcPath} web=${sha} manifest(overlayPd)=${f.sha256}`);
    continue;
  }
  const dst = join(resolve(out), srcPath);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, buf);
  console.log(`nakładka PD ${srcPath} (${buf.length} B)`);
}
console.log(`repin-ui2-overlay: PD (R-RUSTPORT-REPIN-UI-2-E-Q1) plików=${(manifest.overlayPd ?? []).length}`);
// R-RUSTPORT-REPIN-WEB-UI-3-Q1 (addytywnie): kopie i adaptery przepięte na web `9b019a7d8` (`tools/repin-ui3-manifest.json`)
// — w odniesieniu wersja weba z TEJ rewizji (`--web3-dir` = `git archive <pin UI-3> gra/src gra/data`). Bez `--web3-dir`
// przy istniejącym manifeście UI-3 = błąd (odniesienie byłoby nieaktualne dla tych plików, różnice byłyby fałszywe).
const ui3Url = new URL('./repin-ui3-manifest.json', import.meta.url);
if (existsSync(ui3Url)) {
  const ui3 = JSON.parse(readFileSync(ui3Url, 'utf8'));
  const web3 = argOf('--web3-dir');
  if (!web3) {
    bad++;
    console.error(`repin-ui2-overlay: brak --web3-dir (wymagany: tools/repin-ui3-manifest.json, pin ${ui3.pin.slice(0, 9)})`);
  } else {
    for (const f of [...ui3.files, ...ui3.adapters.map((a) => ({ src: a.src, sha256: a.webSha256, bytes: a.webBytes })), ...(ui3.overlayDeps ?? [])]) {
      const buf = readFileSync(join(resolve(web3), f.src));
      const sha = createHash('sha256').update(buf).digest('hex');
      if (sha !== f.sha256 || buf.length !== f.bytes) {
        bad++;
        console.error(`SHA UI-3 ${f.src} web=${sha}/${buf.length} manifest=${f.sha256}/${f.bytes}`);
        continue;
      }
      const dst = join(resolve(out), f.src);
      mkdirSync(dirname(dst), { recursive: true });
      writeFileSync(dst, buf);
      console.log(`nakładka UI-3 ${f.src} (${buf.length} B)`);
    }
    console.log(`repin-ui2-overlay: UI-3 (R-RUSTPORT-REPIN-WEB-UI-3-Q1) plików=${ui3.files.length + ui3.adapters.length}`);
    // R-RUSTPORT-REPIN-WEB-UI-3-B-Q1 (addytywnie): porty DOM partii UI-3-B (`portDomUI3B`) — w odniesieniu wersja weba
    // `9b019a7d8` (sha256 `webSha256`), port zostaje portem.
    for (const f of ui3.portDomUI3B ?? []) {
      const buf = readFileSync(join(resolve(web3), f.src));
      const sha = createHash('sha256').update(buf).digest('hex');
      if (sha !== f.webSha256 || buf.length !== f.webBytes) {
        bad++;
        console.error(`SHA UI-3-B ${f.src} web=${sha}/${buf.length} manifest=${f.webSha256}/${f.webBytes}`);
        continue;
      }
      const dst = join(resolve(out), f.src);
      mkdirSync(dirname(dst), { recursive: true });
      writeFileSync(dst, buf);
      console.log(`nakładka UI-3-B (port DOM) ${f.src} (${buf.length} B)`);
    }
    console.log(`repin-ui2-overlay: UI-3-B (R-RUSTPORT-REPIN-WEB-UI-3-B-Q1) plików=${(ui3.portDomUI3B ?? []).length}`);
  }
}
console.log(`repin-ui2-overlay: plików=${entries.length} portów=${portFiles} niezgodnych=${bad} out=${out}`);
process.exitCode = bad === 0 ? 0 : 1;
