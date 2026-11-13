# Evidence

Focused regression output: `capture-event-retention-test: PASS (20 assertions)`.

Related existing gates: city-capture report 56/56; city-state elimination notice 56/56; side-panel toolbar 19/19. TypeScript and Vite production build passed. Vite output: 916 modules, single-file `dist/index.html` about 69,917.91 kB.

`warEventLog` had seven direct `length > 8` truncation sites before this change; each now routes through `trimWarEventLog()`. Manual capture/elimination dismissal and session resets still clear the corresponding maps. The helper test checks exact rows removed and that retained visible ids still have usable modal payloads.

The existing measured 100-turn run did not record map sizes or browser process-tree RSS. This evidence only proves the collection's bounded lifecycle, not its share of the reported memory growth.
