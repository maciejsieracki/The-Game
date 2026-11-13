# Release validation note — 3 ready items at `79a6c778e`

SCOPE: AI replacement limit (`40db31f20`), unit-card ranged multiplier (`39f8e2ce0`), and technology-cost encyclopedia sync (`79a6c778e`). This note supplies only the audio-sidecar release check; it does not replace the separate focused gates for those three items.

## Result

STATUS: **PASS-WITH-NOTES for these three release items** on the audio checks that could be exercised. The original sidecar `file://` runtime gate remains **INFRA-BLOCKED / UNVERIFIED** and is not marked as passed. This HTTP evidence must not be read as closing or changing the original sidecar acceptance criteria.

## Evidence

- Clean release source: `79a6c778e93b304f5701d1e0c6c8fbf3f025da45`.
- Direct Vite production build from that source: `/tmp/codex-release-ready-build.log`; 1011 modules, exit 0, 12.19 seconds. Output: `/tmp/codex-release-ready-out` (`index.html` 14,397,272 B; packs 39,803,262 / 39,999,512 / 11,556,324 B).
- Sidecar packs in the exact ready build are byte-identical to current production `gra-robocza/` files. MD5 by pack: `5b990bc33b4513f343ccc4bc7f12f26f`, `0a9a10473f9d29bbe01fd9a4f592f89d`, `9e88be9fa542eaf2f2a2ecb5c2424fa2`; SHA-256 and byte sizes also match (full command output can be reproduced with `md5sum`, `sha256sum`, and `stat` on both directories).
- HTTP runtime fallback, one Chromium process launched with installed `/usr/bin/chromium`, both-present and HTML-only cases: `audio-sidecar-http-smoke-ready.log` — **PASS**. With packs, gameplay music and Greek diplomacy greeting decoded and advanced `currentTime`, the audio registry emptied, three pack responses were HTTP 200, and there were no page or console errors. Without packs, the game/HUD and diplomacy still worked silently, there were zero page errors, and the only missing resources were the three expected HTTP 404 pack requests.
- The same smoke was run against the earlier `40db31f20` output; its separate record is `audio-sidecar-http-smoke.log`. The ready-output run above is the release evidence.
- Original audio-sidecar test on the 40db31f20 output passed static S1-S3 (HTML free of embedded audio, correct contiguous sidecar tags/sizes, and 91/91 source MP3s represented once with matching hashes). Its W/N browser scenarios stopped at `page.goto(file://...)` with Chromium `net::ERR_BLOCKED_BY_ADMINISTRATOR`; see `/tmp/codex-release-40db31f20-audio-test.log`. Playwright browser CDN download was unavailable (HTTP 403).

## Boundary

HTTP confirms the shipped page and adjacent packs work when served, including the quiet fallback when packs are absent. It does not establish the dispatch's specific requirement that relative scripts and fallback work under `file://` without a server or fetch. That criterion remains unverified due to the browser policy error. No policy was bypassed, no product code was changed for this smoke, and no deployment is authorized or claimed by this receipt.
