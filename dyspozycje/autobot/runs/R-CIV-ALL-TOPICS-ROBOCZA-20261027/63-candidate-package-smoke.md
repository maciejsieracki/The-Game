# AutoBot Operator — exact Robocza candidate package smoke

**Result: PASS.** This is local package validation before publication; it does not claim remote deployment.

## Artifact

- Bundle: `gra-robocza/Gra-ROBOCZA.html`
- MD5: `b897f519a377631081bd29b49c76fef2`
- SHA-256: `accb2ee99c74ba7bbc70da060ed62fabf905cf2f021d6e37bacad4a9398ed798`
- Size: `70,011,909` bytes
- Built from the current candidate source with Vite 5.4.21, 914 modules; TypeScript and JS DOM smoke passed.

## Checks

- `node gra/tools/verify-robocza-bundle.cjs` — **VERIFY OK**; manifest and both `bundles[]` entries match the exact bundle hash/size. The embedded stamp self-MD5 reports a known non-blocking warning because the digest is embedded in the file; the manifest digest is authoritative.
- Local HTTP readback of bundle, manifest and `START.html`: **200/200/200**. Fetched bundle MD5/SHA-256/size match the manifest; START links display the current MD5 prefix.
- Chromium loaded this exact bundle over HTTP: **200**, title `The Game — 4X`, two canvases, menu/HUD shell and visible build stamp; **0 page errors and 0 console errors**. The local-only smoke route returned 204 for the absent favicon.

## Scope limit

The large-empire performance gate remains explicitly open at the user's request; the previous full stress run stopped at turn 47 when Chromium closed. No push or remote readback was performed by this operator.
