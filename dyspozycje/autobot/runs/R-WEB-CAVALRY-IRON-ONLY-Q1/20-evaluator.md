# Independent evaluator — R-WEB-CAVALRY-IRON-ONLY-Q1

Baseline: `4919be9dc`; evaluated implementation: `cdaac71277` (including its parent implementation commit `38d6ba0ec`).

## Result: PASS

I independently inspected the data, live gate implementations, and changed tests. The implementation matches the dispatch: Konnica and Jeździec chiński move to Żelazo/Sztuka wojenna, all 27 Iron-era definitions require Sztuka wojenna, and Katapulta's paid active-siege gate follows its new Tech. The 13 `Typ: Mount` rows resolve to five horseback cavalry and eight chariots: horseback cavalry now require Iron/Sztuka, while each chariot retains its prior era and research gate (including Rydwan (woły)/Koło and Rydwan Shang/Jeździectwo). The three requested unit rows change only eligibility fields; their costs and stats remain intact.

The live production functions enforce era and Tech for ordinary recruitment and replacement, and both reject `Typ: Siege`. `main.ts` builds the siege option from the besieger owner's current researched-tech set; human option display, human purchase validation, and the AI build call all route through that option. The siege helper checks the unit card's Tech before charging treasury or stock. The updated test exercises the real production/replacement functions and siege helper, including blocking Katapulta for an Oblężnictwo-only save and allowing it with Sztuka wojenna. The paid old Konnica queue test confirms already-paid work still completes.

## Independent validation

- `node tools/iron-gating-impl-test.cjs`: **153 passed, 0 failed**.
- `node tools/siege-engines-built-during-siege-test.cjs`: **28 passed, 0 failed**.
- `node tools/gen-tech-cards-top5.cjs --check` and `node tools/gen-building-cards-top5.cjs --check`: pass against canonical CSV sources.
- `npm run typecheck -- --pretty false`: pass.

No concrete implementation or current card/wiki unlock mismatch found. Historical dated audit documents still describe the former gates; they are archived context, not current player guidance. No product changes were made during this evaluation.
