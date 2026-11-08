import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

/**
 * fixScriptTag — runs after vite-plugin-singlefile inlines the bundle.
 *
 * vite-plugin-singlefile preserves the original <script type="module" crossorigin>
 * attributes from Vite's HTML template. When the file is opened from file://, the
 * `crossorigin` attribute causes the browser to perform a CORS preflight that fails
 * silently, resulting in the script never executing (black screen, no errors).
 *
 * Since our output is an IIFE (not an ES module), we:
 *   1. Remove `crossorigin` — no external fetch, so it's pointless.
 *   2. Change `type="module"` → `type="text/javascript"` — matches the IIFE format.
 *
 * This must run AFTER viteSingleFile (enforce: 'post', order matters).
 */
function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string): string {
      // Remove crossorigin attribute (with or without quotes, with or without value)
      let result = html.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g, '');
      // Change type="module" to type="text/javascript" for IIFE compatibility
      result = result.replace(/<script\s+type="module"/g, '<script type="text/javascript"');
      return result;
    },
  };
}

/**
 * escapeNonAsciiForJs — R-WEB-MEMORY-STATIC-FOOTPRINT-Q1.
 *
 * Zamienia każdy znak spoza ASCII w gotowym kodzie JS na ucieczkę `\uXXXX` (znaki spoza BMP jako para
 * surogatów). Powód: Chromium trzyma źródło skryptu jako string; jeśli zawiera choć jeden znak spoza
 * Latin-1 (polskie litery), cały ~70-milionowy bundle zajmuje 2 B/znak (UTF-16) zamiast 1 B — ok. 70 MB
 * stale przez całą grę. Ucieczka `\uXXXX` znaczy to samo w literale tekstowym, w szablonie (wartość
 * „cooked”), w literale regex (z flagą `u` i bez — para surogatów w trybie `u` łączy się w jeden znak),
 * w identyfikatorze i w komentarzu. esbuild `charset: 'ascii'` nie zmienia literałów regex, dlatego
 * zamiana działa na tekście wyniku, po minifikacji. Znak poprzedzony nieparzystą liczbą `\` (ucieczka
 * tożsamościowa `\ł`, znaczy po prostu `ł`) traci ten `\`, żeby nie powstało `\\u0142`.
 * Jedyny kontekst o innej semantyce to `String.raw`/surowe tagowane szablony — test
 * `memory-static-ascii-bundle-test.cjs` sprawdza, że bundle nie ma ich ze znakami spoza ASCII.
 */
export function escapeNonAsciiForJs(code: string): string {
  let out = '';
  let last = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    if (c < 0x80) continue;
    let chunk = code.slice(last, i);
    let bs = 0;
    for (let k = chunk.length - 1; k >= 0 && chunk.charCodeAt(k) === 0x5c; k--) bs++;
    if (bs % 2 === 1) chunk = chunk.slice(0, -1);
    out += chunk + '\\u' + c.toString(16).padStart(4, '0');
    last = i + 1;
  }
  return last === 0 ? code : out + code.slice(last);
}

function asciiOnlyJs(): Plugin {
  return {
    name: 'ascii-only-js',
    apply: 'build',
    // generateBundle: po minifikacji (renderChunk), przed viteSingleFile (enforce: 'post'), który wkleja JS do HTML.
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') file.code = escapeNonAsciiForJs(file.code);
      }
    },
  };
}

/**
 * binaryAssetsOutOfJs — R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1.
 *
 * PROBLEM: przy `assetsInlineLimit` „zawsze inline” każdy mp3/png/jpg trafiał do bundla JS jako literał
 * `data:…;base64,…` (≈ 62 MB tekstu). Chromium trzymał go DWA razy przez całą grę: w źródle skryptu
 * (ExternalStringData — V8 nie zwalnia źródła, bo leniwie kompiluje funkcje) i jako zinternalizowany
 * literał na stercie (stała w bytecode modułu), plus trzecia kopia przy przypisaniu `audio.src = data:…`.
 *
 * ROZWIĄZANIE (tylko build; dev bez zmian): bajty zasobu NIE wchodzą do JS. Moduł zasobu eksportuje
 * `civEmbeddedAssetUrl(klucz, mime)`, a base64 ląduje w HTML jako nieuruchamiany
 * `<script type="application/octet-stream" id="civ-asset-<klucz>">` PRZED bundlem. Przy ewaluacji modułu
 * pomocnik czyta tekst elementu, USUWA element z DOM (tekst do zebrania przez GC), dekoduje base64 raz do
 * bajtów i oddaje `URL.createObjectURL(new Blob([bajty], { type }))`. Na stercie JS nie zostaje żaden
 * literał base64; bajty żyją raz, jako Blob (magazyn blobów przeglądarki), współdzielony przez wszystkie
 * odtworzenia/obrazy (ten sam URL). Plik nadal jeden, offline (`blob:` działa z `file://`).
 * Bajty są te same co w pliku źródłowym (bez przekodowania) — test `memory-datauri-duplicates-test.cjs`.
 * Klucz = skrót SHA-256 treści, więc identyczne pliki dzielą jeden element/Blob.
 */
const EMBED_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};
const EMBED_VIRTUAL = '\0civ-embedded-assets';

export const CIV_EMBEDDED_ASSETS_RUNTIME = `
const urls = new Map();
function decodeB64(b64) {
  if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(b64);
  const bin = atob(b64);
  const n = bin.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function civEmbeddedAssetUrl(key, mime) {
  const hit = urls.get(key);
  if (hit !== undefined) return hit;
  let b64 = null;
  let el = null;
  if (mime.indexOf('audio/') === 0) {
    // AUDIO: pliki-sasiedzi audio-pack-N.js (<script src>) wpisuja base64 do rejestru window.__CIV_AUDIO__
    // PRZED bundlem. Brak pliku-sasiada / brak klucza = cichy fallback: pusty URL (gra bez tej muzyki).
    const reg = typeof window !== 'undefined' ? window.__CIV_AUDIO__ : undefined;
    const v = reg ? reg[key] : undefined;
    if (typeof v !== 'string') { urls.set(key, ''); return ''; }
    b64 = v;
    delete reg[key]; // base64 nie zostaje na stercie po zdekodowaniu
  } else {
    el = document.getElementById('civ-asset-' + key);
    if (!el) throw new Error('civEmbeddedAssetUrl: brak zasobu ' + key);
    b64 = el.textContent || '';
  }
  const bytes = decodeB64(b64);
  if (el) el.remove();
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  urls.set(key, url);
  return url;
}
`;

/**
 * R-WEB-BUILD-SPLIT-AUDIO-SIDECAR-Q1 — pakowanie audio do plikow-sasiadow.
 * Cale audio (mp3) idzie do `audio-pack-N.js` obok HTML (stale nazwy), kazdy < AUDIO_PACK_MAX_BYTES; HTML
 * niesie tylko kod + dane nie-audio. Pakiety ladowane klasycznym <script src> (wzgledna sciezka, dziala z
 * file:// bez serwera i bez fetch) PRZED bundlem. Straznik: build konczy sie bledem, gdy jakikolwiek plik
 * wyjsciowy > OUTPUT_FILE_FAIL_BYTES (limit GitHub 100 MB).
 */
export const AUDIO_PACK_REGISTRY = '__CIV_AUDIO__';
export const AUDIO_PACK_TARGET_CHARS = 40_000_000; // cel pojedynczego pakietu (znaki base64)
export const AUDIO_PACK_MAX_BYTES = 90_000_000; // twardy limit pakietu
export const OUTPUT_FILE_FAIL_BYTES = 95_000_000; // build FAIL, gdy jakikolwiek plik wyjsciowy wiekszy
export const audioPackName = (n: number): string => `audio-pack-${n}.js`;

/** Deterministyczny podzial kluczy (posortowane) na pakiety, first-fit do celu; zasob wiekszy niz cel = wlasny pakiet. */
export function planAudioPacks(sizes: ReadonlyMap<string, number>, target = AUDIO_PACK_TARGET_CHARS): string[][] {
  const packs: { keys: string[]; size: number }[] = [];
  for (const key of [...sizes.keys()].sort()) {
    const sz = sizes.get(key) as number;
    const slot = packs.find((p) => p.size + sz <= target);
    if (slot) { slot.keys.push(key); slot.size += sz; } else packs.push({ keys: [key], size: sz });
  }
  return packs.map((p) => p.keys);
}


function binaryAssetsOutOfJs(): Plugin {
  const assets = new Map<string, { mime: string; b64: string }>();
  let outDirCfg = 'dist';
  const audioPacks = (): string[][] => planAudioPacks(new Map(
    [...assets].filter(([, a]) => a.mime.startsWith('audio/')).map(([k, a]) => [k, a.b64.length] as [string, number]),
  ));
  return {
    name: 'civ-binary-assets-out-of-js',
    apply: 'build',
    enforce: 'pre',
    configResolved(cfg) { outDirCfg = path.resolve(cfg.root, cfg.build.outDir); },
    buildStart() { assets.clear(); },
    resolveId(id) { return id === EMBED_VIRTUAL ? EMBED_VIRTUAL : null; },
    async load(id) {
      if (id === EMBED_VIRTUAL) return CIV_EMBEDDED_ASSETS_RUNTIME;
      const q = id.indexOf('?');
      const file = q >= 0 ? id.slice(0, q) : id;
      const query = q >= 0 ? id.slice(q + 1) : '';
      if (query !== '' && query !== 'url') return null; // ?raw / ?inline / inne — bez zmian
      const ext = path.extname(file).toLowerCase();
      const mime = EMBED_MIME[ext];
      if (!mime) return null;
      const bytes = await fs.readFile(file);
      const key = createHash('sha256').update(bytes).digest('hex').slice(0, 20);
      if (!assets.has(key)) assets.set(key, { mime, b64: bytes.toString('base64') });
      return `import { civEmbeddedAssetUrl } from ${JSON.stringify(EMBED_VIRTUAL)};\n`
        + `export default civEmbeddedAssetUrl(${JSON.stringify(key)}, ${JSON.stringify(mime)});\n`;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html: string): string {
        if (assets.size === 0) return html;
        let tags = '';
        // Audio: znaczniki <script src> do plikow-sasiadow (rejestr wypelniany przed bundlem, kolejnosc = numeracja).
        audioPacks().forEach((_keys, i) => { tags += `<script src="${audioPackName(i + 1)}"></script>\n`; });
        for (const [key, a] of assets) {
          if (a.mime.startsWith('audio/')) continue;
          tags += `<script type="application/octet-stream" id="civ-asset-${key}" data-mime="${a.mime}">${a.b64}</script>\n`;
        }
        // Dane muszą być w DOM, zanim wykona się bundel (klasyczny skrypt w <head>, uruchamiany od razu):
        // wstawiamy je zaraz po otwarciu <head>.
        const m = /<head[^>]*>/i.exec(html);
        if (!m) throw new Error('civ-binary-assets-out-of-js: brak <head> w index.html');
        const at = m.index + m[0].length;
        return html.slice(0, at) + '\n' + tags + html.slice(at);
      },
    },
    async writeBundle(options) {
      const dir = options.dir ? path.resolve(options.dir) : outDirCfg;
      const packs = audioPacks();
      for (let i = 0; i < packs.length; i++) {
        let body = `(function(r){\n`;
        for (const key of packs[i] as string[]) body += `r[${JSON.stringify(key)}]=${JSON.stringify((assets.get(key) as { b64: string }).b64)};\n`;
        body += `})(window.${AUDIO_PACK_REGISTRY}=window.${AUDIO_PACK_REGISTRY}||{});\n`
          + `(function(s){if(s&&s.parentNode)s.parentNode.removeChild(s)})(document.currentScript);\n`;
        const size = Buffer.byteLength(body);
        if (size > AUDIO_PACK_MAX_BYTES) throw new Error(`civ-binary-assets-out-of-js: ${audioPackName(i + 1)} ma ${size} B > ${AUDIO_PACK_MAX_BYTES} B`);
        await fs.writeFile(path.join(dir, audioPackName(i + 1)), body);
      }
      // Straznik rozmiaru: zaden plik wyjsciowy (rekurencyjnie) nie moze przekroczyc OUTPUT_FILE_FAIL_BYTES.
      const walk = async (d: string): Promise<string[]> => {
        const out: string[] = [];
        for (const e of await fs.readdir(d, { withFileTypes: true })) {
          const p = path.join(d, e.name);
          if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
        }
        return out;
      };
      // CIV_OUTPUT_FAIL_BYTES: wylacznie do testu straznika (audio-sidecar-test.cjs); domyslnie OUTPUT_FILE_FAIL_BYTES.
      const failBytes = Number(process.env.CIV_OUTPUT_FAIL_BYTES) || OUTPUT_FILE_FAIL_BYTES;
      let total = 0;
      const lines: string[] = [];
      for (const f of await walk(dir)) {
        const sz = (await fs.stat(f)).size;
        total += sz;
        lines.push(`  ${path.relative(dir, f)}: ${sz} B`);
        if (sz > failBytes) {
          throw new Error(`civ-binary-assets-out-of-js: plik wyjsciowy ${path.relative(dir, f)} ma ${sz} B > ${failBytes} B (limit GitHub 100 MB)`);
        }
      }
      console.log(`\n[civ-audio-sidecar] pliki wyjsciowe (${lines.length}), razem ${total} B:\n${lines.join('\n')}`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    binaryAssetsOutOfJs(),
    asciiOnlyJs(),
    viteSingleFile(),
    fixScriptTag(),
  ],
  build: {
    outDir: 'dist',
    // Disable source maps — not needed in the self-contained file build
    sourcemap: false,
    // Inline all assets (images, fonts, etc.)
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: {
        // IIFE format: single classic script, runs from file:// without CORS issues
        format: 'iife',
        inlineDynamicImports: true,
        // No code-splitting
        manualChunks: undefined,
      },
    },
  },
});
