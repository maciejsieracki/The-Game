# STAN SANDBOXA — INTEGRATOR (odtwarzanie /tmp/build po resecie)

Zaktualizowano: 2026-07-06 13:47 PL.
Sandbox jest ULOTNY (reset = czysty /tmp). Środowisko builda NIE jest zapisywane
(node_modules + bundle = odtwarzalne z dysku). Poniżej JEDNA komenda odtworzenia.

## Zawartość /tmp (do odtworzenia)
- /tmp/build = drzewo builda: config (z konfigiKopiaMaster) + src (= srcKopiaMaster) + data (= data — kopia) + node_modules.
- Nic unikatowego (skrypty/harnessy) — wszystko lustrem dysku. genhub odtwarzany z tools/generate-start-hub.cjs.

## KOMENDA ODTWORZENIA (bash, mount /sessions/.../mnt/Civ)
```
CIV=/sessions/epic-dreamy-allen/mnt/Civ; SK=$CIV/gra-robocza/srcKopiaMaster; K=$CIV/gra-robocza/konfigiKopiaMaster
mkdir -p /tmp/build && cp "$K"/package.json "$K"/package-lock.json "$K"/tsconfig.json "$K"/vite.config.ts "$K"/index.html /tmp/build/
cp -r "$SK" /tmp/build/src && mkdir -p /tmp/build/data && cp "$CIV/gra-robocza/data — kopia/"*.json /tmp/build/data/
cd /tmp/build && npm install --no-save --no-audit --no-fund --ignore-scripts esbuild@0.21 vite@5.4 vite-plugin-singlefile@2.3 three@0.169 typescript@5.6
```
Potem: `npx --no-install tsc --noEmit` (bramka) → `npx --no-install vite build` → stempel → deploy cp na 9 plików → hub.
UWAGA: dane JSON w `data — kopia` (26 plików) bywają zdehydrowane po resecie — jak `units.json` < 100KB, poczekaj i skopiuj ponownie.
