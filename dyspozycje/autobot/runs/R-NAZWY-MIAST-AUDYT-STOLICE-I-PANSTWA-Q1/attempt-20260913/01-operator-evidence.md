# Evidence — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1

Run: `attempt-20260913`
Base HEAD: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
Audited HEAD: `0b95694b73c429d01d8b65942235f2863947f986` plus the uncommitted allowlisted changes listed in the operator report.
Branch: `hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1`
Worktree: `/home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs`

## 1. Reproducible data audit

Metric command (run from `gra/`):

```text
node -e 'const p=require("./data/city-names-pools.json"),c=require("./data/civs.json"); const ids=Object.keys(p); const metrics=x=>({n:x.length,e:x.filter(v=>typeof v!=="string"||!v.trim()).length,d:x.length-new Set(x).size}); console.log("id|civ_name|MC n/e/d|MP n/e/d|MC∩MP|nazwyMiast n/e/d|nazwyMiast=MC"); for(const civ of c.cywilizacje){const id=civ.ikonaId,a=p[id]?.miasta_cywilizacji||[],b=p[id]?.miasta_panstwa||[],m=civ.nazwyMiast||[],i=b.filter(v=>new Set(a).has(v)); const A=metrics(a),B=metrics(b),M=metrics(m); console.log([id,civ.Cywilizacja,`${A.n}/${A.e}/${A.d}`,`${B.n}/${B.e}/${B.d}`,`${i.length}${i.length?" ["+i.join(",")+"]":""}`,`${M.n}/${M.e}/${M.d}`,JSON.stringify(m)===JSON.stringify(a)].join("|"));} const all=field=>{const seen=new Map();for(const id of ids)for(const n of p[id][field]||[]){if(!seen.has(n))seen.set(n,[]);seen.get(n).push(id)}return [...seen].filter(([,v])=>v.length>1).length}; console.log("poolIds="+ids.length+" civRows="+c.cywilizacje.length+" globalMCduplicateNames="+all("miasta_cywilizacji")+" globalMPduplicateNames="+all("miasta_panstwa")); console.log("first|MC[0]|MP[0]|legacyFallback"); for(const civ of c.cywilizacje){const id=civ.ikonaId;console.log([id,p[id].miasta_cywilizacji[0],p[id].miasta_panstwa[0],civ.nazwyMiast[0]].join("|"));}'
```

Definitions: `n/e/d` = number of elements / empty entries / duplicate entries within that list. `MC∩MP` = number of names shared by the regular and city-state lists for the same civilization. The command was executed without the shell expanding its template literals; the resulting table was:

```text
id|civ_name|MC n/e/d|MP n/e/d|MC∩MP|nazwyMiast n/e/d|nazwyMiast=MC
grecy|Grecy|100/0/0|10/0/0|0|100/0/0|true
rzymianie|Rzymianie|100/0/0|10/0/0|0|100/0/0|true
chinczycy|Chińczycy|100/0/0|10/0/0|0|100/0/0|true
inkowie|Inkowie|100/0/0|10/0/0|0|100/0/0|true
zulusi|Zulusi|100/0/0|10/0/0|0|100/0/0|true
egipt|Egipt|100/0/0|10/0/0|0|100/0/0|true
sumer|Sumerowie|100/0/0|10/0/0|0|100/0/0|true
celtowie|Celtowie|100/0/0|10/0/0|0|100/0/0|true
germanie|Germanie|100/0/0|10/0/0|0|100/0/0|true
harappa|Harappa|100/0/0|10/0/0|0|100/0/0|true
hetyci|Hetyci|100/0/0|10/0/0|0|100/0/0|true
slowianie|Słowianie|100/0/0|10/0/0|0|100/0/0|true
babilonia|Babilonia|100/0/0|10/0/0|0|100/0/0|true
asyria|Asyria|100/0/0|10/0/0|0|100/0/0|true
fenicjanie|Fenicjanie|100/0/0|10/0/0|0|100/0/0|true
poolIds=15 civRows=15 globalMCduplicateNames=94 globalMPduplicateNames=0
```

A second cross-family calculation returned:

```text
{
  "globalRegular": { "unique": 1381, "slots": 1500, "repeatedDistinct": 94, "repeatedOccurrences": 119 },
  "globalState": { "unique": 150, "slots": 150, "repeatedDistinct": 0, "repeatedOccurrences": 0 },
  "globalCrossFamily": {
    "count": 3,
    "names": ["Bit-Jakin", "Bit-Dakkuri", "Bit-Amukani"]
  }
}
```

The three global cross-family collisions are `asyria:MC` versus `babilonia:MP`. They are not same-civilization collisions; the existing contract checks disjointness per civilization, so no names were removed speculatively.

Civilization-label audit command returned 15 rows, 0 empty IDs, 0 duplicate IDs, 0 empty `Cywilizacja` labels, and 0 duplicate labels (`uniqueIdCount=15`, `uniqueCivilizationNameCount=15`). For Greece the data identity is `ikonaId=grecy`, `Cywilizacja=Grecy`, regular first name `Ateny`, city-state first name `Sykion`.

First-name readback after the fix:

```text
first|MC[0]|MP[0]|legacyFallback
grecy|Ateny|Sykion|Ateny
rzymianie|Rzym|Nola|Rzym
chinczycy|Xi'an|Qin|Xi'an
inkowie|Cusco|Maras|Cusco
zulusi|uMgungundlovu|esiPhezi|uMgungundlovu
egipt|Memfis|Tinis|Memfis
sumer|Uruk|Hamazi|Uruk
celtowie|Bibracte|Titelberg|Bibracte
germanie|Mattium|Eketorp|Mattium
harappa|Harappa|Shortugai|Harappa
hetyci|Hattusa|Kussara|Hattusa
slowianie|Kijów|Radogoszcz|Kijów
babilonia|Babilon|Bit-Jakin|Babilon
asyria|Aszur|Ekallatum|Aszur
fenicjanie|Byblos|Iol|Byblos
```

## 2. Full Greece flow

- `gra/src/data/loader.ts:19` imports `city-names-pools.json`; `loadGameData()` returns it as `data.cityNamesPools` at line 421.
- `gra/src/map/cluster-spawn.ts:227,410` calls `playerStartCityName(civs, playerTyp, cityNamesPools)`. For a foreign cluster, line 354 calls `foreignCapitalCityName`; lines 357–358 call `clusterRivalCityName` for the city-state slots.
- With pools, `gra/src/game/city-names-pool.ts:94–97` reads `miasta_cywilizacji[0]` for the player capital and `:159–162` does the same for the foreign capital. `clusterRivalFromPool` reads `miasta_panstwa[1..]` at `:105–142`. For Grecy this is `Ateny`, `Fliunt`, `Trojzena`, and `Maroneja` for the tested slots.
- Without a pools argument, `gra/src/game/civ-names.ts:62–74` and `:101–113` now read `civs.json:nazwyMiast[0]` for both capital paths and only then fall back to `nazwyKlastra[0]`. `clusterRivalCityName` remains on `nazwyKlastra` for the legacy state-city path.
- Founding generators use the regular pool: `pickNextRegularCityName` (`city-names-pool.ts:213–226`) skips used names and suffixes after exhaustion; `suggestPlayerFoundCityName` (`:233–245`) returns `Sparta` after the Greek capital; `pickAiFoundCityName` (`:249–258`) uses the same regular source. The compatibility `pickAiFoundedCityName` wrapper in `civ-names.ts:165–172` also delegates to that regular generator.
- `civDisplayName` (`civ-names.ts:126–130`) reads the scalar `Cywilizacja`, so the civilization name `Grecy` is not taken from either city pool. `display-names.ts` formats labels separately and was not changed.

## 3. Confirmed defect and minimal correction

Before editing production code, the focused `civ-names-test.cjs` was changed to require regular capitals on the no-pool path. Running the old implementation returned exit 1: the no-pool branch read `nazwyKlastra[0]` (the state-city list), so Greece would resolve to `Sykion`, and the same class of error was visible for China (`Qin`).

The minimal allowlisted change was:

- `gra/src/game/civ-names.ts`: add a private `getNazwyMiast()` lookup; make `playerStartCityName()` and `foreignCapitalCityName()` prefer `nazwyMiast[0]` when no pools object is supplied; retain the old `nazwyKlastra` fallback for incomplete legacy exports.
- `gra/data/civs.json`: synchronize the duplicated regular-name export for Asyria (`Aszur`, then `Ninive`) and Fenicjanie (`Byblos`, then `Sydon`, `Tyr`) with `city-names-pools.json`.
- `gra/tools/civ-names-test.cjs`: one focused regression test now checks the complete regular mirror and both no-pool capital functions for all 15 civilizations, plus the legacy state fallback and rival indices.

## 4. Gates and real results

All commands below were run from `gra/` with an existing local dependency tree exposed through `NODE_PATH`; no package was installed:

```text
NODE_PATH=/home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node tools/nazwy-miast-rozlaczne-pule-test.cjs  -> 9 passed, 0 failed
NODE_PATH=/home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node tools/city-names-pool-test.cjs              -> 12 passed, 0 failed
NODE_PATH=/home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node tools/city-names-pools-test.cjs             -> 6 passed, 0 failed
NODE_PATH=/home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node tools/civ-names-test.cjs                   -> 66 passed, 0 failed
NODE_PATH=/home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node tools/display-names-test.cjs                -> 27 passed, 0 failed
NODE_PATH=/home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node tools/mapa-etykieta-stolicy-test.cjs       -> 47 passed, 0 failed
```

Typecheck used a temporary symlink to the existing local dependencies, then removed it:

```text
ln -s /home/ubuntu/projects/The-Game-worktrees/H-ARMIA-ROZDZIEL-RUCH-IKONY-Q1/gra/node_modules node_modules
node ./node_modules/typescript/bin/tsc --noEmit
rm node_modules
-> typecheck_exit=0
```

Repository gate:

```text
git diff --check -> PASS
gra/node_modules -> absent after the temporary typecheck link was removed
```

`gra` build/dev was not run because the repository procedure explicitly prohibits `npm run build`/`npm run dev` in `gra/`; the available typecheck gate passed. No push, PR, merge, or deploy was performed.
