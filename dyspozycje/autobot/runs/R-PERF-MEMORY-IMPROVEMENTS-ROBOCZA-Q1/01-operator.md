# AutoBot release operator report

STATUS: candidate bundle built and locally verified; remote publication pending Final Control.

## Product checks

- Capture-event detail retention: focused test 20 assertions PASS; existing capture report 117/117 PASS. Independent Evaluator reran related capture, elimination and side-panel checks (117/117, 56/56, 19/19) and Final Control passed the narrow lifecycle scope.
- Unit overlay churn: focused test 17/17 PASS; memory lifecycle suite 55/55 PASS. Independent Evaluator and Final Control returned PASS WITH NOTES; unchanged sprites are retained, but this is not evidence of a 2 GB root cause or long-session improvement.
- Integrated source: typecheck PASS; Vite build PASS (916 modules); bundle verifier PASS. Verifier warns that the embedded self-MD5 stamp differs from the final file hash; manifest and bundle hashes agree, matching the existing stamp behavior.
- A separate legacy elimination-card browser test did not complete: its configured Chromium path was absent, and a temporary `/usr/bin/chromium` fallback then hit `ERR_BLOCKED_BY_ADMINISTRATOR` on `file://`. The operator/evaluator results above remain the validated checks for the narrow change.

## Candidate bundle

- Bundle: `gra-robocza/Gra-ROBOCZA.html`
- MD5: `e4c3643d35ba88f9823373ac9419477c`
- SHA-256: `d918fb1c5dfd221106c41aa6ec0c74450fbd5ddff1cdcad22c06ba8cf595fc9b`
- Bytes: `70013155`
- Build: Vite 5.4.21, 916 modules, single-file stamped ROBOCZA.

## Open performance diagnosis

The baseline run on the deployed source completed 38/100 turns, then stopped when one end-of-turn took 70,205 ms (60,000 ms guard). At the turn-39 idle sample, Chromium process-tree RSS was about 1,990 MiB and frames averaged 1,196.6 ms; the CDP JS heap sample fluctuated around 236–247 MB rather than rising monotonically. Headless SwiftShader and CPU contention limit comparison with the user's machine. The corrected map-pan probe has no valid result. A 20-cycle city-panel test found post-GC DOM/listener counts plateauing; heap delta was only +1.70 MB and non-monotonic.

These fixes are ready for test Robocza, but the full 100-turn and reliable camera-pan diagnosis remain outstanding.
