# Camera-controller reference data (RR-T2a, R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1)

Reference vectors for `tests/camera_web_parity.rs`. Every expected value was
produced by **running the web `CameraController`**:

- `three@0.169.0` from npm (integrity `sha512-Ed906MA3…qUv0w==`, identical to
  `gra/package-lock.json` at `edb8fb56`);
- `render/camera.ts` (`CameraController`, `DRAG_THRESHOLD_PX`) and
  `render/hexutil.ts` (`HEX_R`, `mapCenter`) from
  `git archive edb8fb56 gra/src`, **imported unchanged**;
- two copied fragments, marked `// LITERAL <file>:<lines>` in `gen.ts`
  (same logic and arithmetic, TS types removed): `main.ts:1903-1909`
  (`cameraControllerOpts`: `minDist = 8/3`, `maxDist`, `keyPanSpeed = 0.3`)
  and `scene.ts:3078-3085` (camera position before the controller).

The DOM is replaced by stubs that only **register** the listeners that
`camera.ts:225-234` (`_bind`) adds; the script then calls exactly those
listeners (`mousedown`/`wheel` on the canvas, `mousemove`/`mouseup`/
`keydown`/`keyup`/`blur` on `window`, `mouseleave` on `document`) and
`update()` / `focusAt()`. The real handlers run.

## Adaptations (what differs from the game)

| Item | Adaptation | Why it is neutral |
|---|---|---|
| `blockPointerAt`, `blockWheelAt`, `edgePanActive` | scripted predicates (rectangles / flag) instead of the UI state of `main.ts:1911-1929` | the controller only sees the boolean result; Rust gets the same booleans through `InputGate` |
| `PerspectiveCamera` (`scene.ts:3078-3083`) | `far = 5000`, `aspect = rect.width / rect.height` instead of `farClip` / `camAspect` | the controller reads only `camera.position` and writes `position` + `lookAt`; `matrixWorld` does not depend on the projection |
| canvas rect | stub `getBoundingClientRect()` returning the scripted rect | the controller reads only `left/top/width/height` |
| frames | `update()` called once per `frame` step | Rust calls `update(1/60)`, whose factor is exactly `1.0` (Q2) |
| `matrixWorld` | recorded for hand-written scenarios only (fuzz: target, dist, position) | matrices are a pure function of target/dist; bit-exact in P4-10 |

## Regeneration (outside the repository only)

```bash
S=<scratch dir>
mkdir -p $S/ref $S/websrc $S/refscript $S/out
(cd $S/ref && npm init -y && npm install --ignore-scripts three@0.169.0 esbuild@0.24.0)
git archive --format=tar -o $S/websrc.tar edb8fb56 gra/src gra/data && tar -xf $S/websrc.tar -C $S/websrc
cp rust-port/renderer/tests/fixtures/camera/gen.ts $S/refscript/camera_gen.ts
cd $S/refscript
NODE_PATH=$S/ref/node_modules $S/ref/node_modules/.bin/esbuild camera_gen.ts --bundle --platform=node --format=esm --outfile=camera_gen.mjs --log-level=warning
node camera_gen.mjs $S/out/camera   # node v22.22.0; prints: camera scenarios=33 steps=6504
```

## Files

| File | Content |
|---|---|
| `camera.json` | 33 scenarios (9 hand-written edge cases + 24 LCG fuzz streams of 250 events on 9×7, 40×30, 128×80, 240×168 maps and 3 viewports): options, limits, initial state, and after **every** event the web `target.x/z`, `dist`, `camera.position` (and `matrixWorld` for the hand-written ones) |
| `gen.ts` | the generator above |

SHA-256 at creation: see `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md`.
