# Evidence — retained JS state audit

Inspected source at `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`.

| State | Write | Eviction / cleanup | Expected bound |
|---|---|---|---|
| `warEventLog` | multiple event writers; `recordCityCaptureEvent` 9190+, `recordCivElimEvent` 9136+ | ordinary writers trim to 8; reset clears | <= 8 entries |
| `cityCaptureEventDetails` | `recordCityCaptureEvent` 9232; called from capture funnels at 15476, 30762, 30830, 31330 | only matching dismiss 23261–23268; reset clears 9478/39395; **not trimmed with war log** | session total player capture transitions; grows with turns/events |
| `civElimEventDetails` | `recordCivElimEvent` 9143; elimination callsites 30448, 30873 | matching dismiss 23256; reset clears 9477/39394; **not trimmed with war log** | at most eliminated civ events under normal rules |
| `wiarygodnoscZdarzeniaByOwner` | append via 10325–10326; helper returns a new array | owner elimination 30586; reset 9491/41381; save/load preserved; no age pruning | O(lifetime diplomacy event count) |
| `diplomacyFactorLog` | append helper, per key | 40-entry cap per key; owner cleanup/reset | bounded by owner-pair count × 40 |
| per-turn side-panel structures | EOT producers | cleared around 32996–33008; deferred queue drained at 37948–37954 | bounded by one turn / local caps |

Capture identity includes turn, city, old owner, new owner. This prevents duplicate emission from the three funnels in one capture but permits the same city transition in later turns to retain another details record. Full capture details clone `rows` (`rows: [...viewRows]`), so the retained payload is not just an ID.

The code exposes structural sizes in `window.__turnSlowdownTestDebug.collections()` (main.ts:25963+, fields at 26167–26236). No runtime sampling was performed in this operator pass. The audit confirms reachability paths only; retained heap bytes, browser process RSS and attribution of the reported ~2 GB remain unknown.

No source files modified. No build/test/runtime benchmark run.
