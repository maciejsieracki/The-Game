# Publication and remote artifact readback receipt

RUN: `R-PR141-CODEX-FULL-RELEASE-20261020`, round 1/5.

- Published commit: `b4d37d9f81686b5b21bb256087a55e3a592721f0`; `origin/main` read back at this SHA on 2026-10-21. The commit tree is `bad1ab8c9778ab9b102009231817bcf4890ee179` and parent is `c799325c77bc11c24684c1b35077ae80913d6f8d`.
- Pinned raw GitHub URLs for all three release artifacts returned HTTP 200 and matched the pinned content. Bundle: SHA-256 `234dff75036b22e423b33f9d6134428c559b612922b866399346f0e94ebfca4a`, MD5 `3b6610b74fd6586c5507908fe7665369`, 69,943,587 bytes. Manifest SHA-256 `d3bd4d70d179bd8885e7b673281810f695d956439057fad61e00c4fa17ef62b9`. START hub SHA-256 `5c12b26e98a2af96fe8cf1706a489d188e4b718e4251f0cb0b0da31ecf0625a6`.
- Bounded browser menu/canvas check on the fetched bundle: PASS; title `The Game — 4X`, start control visible, two visible canvases, zero console/page errors. It does not test a complete game flow.
- Both predeploy full-flow browser attempts remain FAIL: first-city founding passed, audience dismissal did not complete. No full gameplay/runtime, save/load parity, F-05 battle, or 93×15 acceptance is claimed.
- This readback verifies immutable GitHub artifact bytes served locally. No external production hosting route was identified or verified.
- Raw readback receipt: `evidence/remote-readback-b4d37d9f-20261020-02/readback-receipt.md` (SHA-256 `09add91a2c7aa0e90a51a1570336c9ebbd5ea0bdf4acc6ab1c8d96f0fddf66b3`). Evidence report SHA-256 `3a54cb84c44dffc94e73cf7a26572801917fdb187bf895f340a0333fe74af8c8`; retained screenshot SHA-256 `3f6622e386545efabcb6f9573486e745dbe8547458fa029e44a2856092de9653`.
