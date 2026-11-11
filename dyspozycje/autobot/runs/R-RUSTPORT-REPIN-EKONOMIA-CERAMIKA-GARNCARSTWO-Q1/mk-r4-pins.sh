#!/bin/bash
# R4: przygotowanie plikow pinowanych poza zakresem tematu (ZALOZENIE Z-R4-1, patrz 01-operator-r1.md).
# Uzycie: SCRATCH=<katalog poza repo> ./mk-r4-pins.sh   (wymaga: git, python3; repo = ten worktree)
set -e
R=${R_WT:-$(git rev-parse --show-toplevel)}
S=${SCRATCH:?ustaw SCRATCH}
mkdir -p "$S/web638"
git -C "$R" archive 638e90bea gra/src gra/data | tar -x -C "$S/web638"
# economy-hybrid2.ts: economy.ts z pinu hybrid2 (f873221ee) = BEZ R-WEB-CORRUPTION-REDUCTION-PALACE-TIERS-TRIBUNAL-Q1
# (osobny temat Rust: domain/economy_city_fns.rs jest poza allowlista tego tematu)
git -C "$R" show f873221ee:gra/src/game/economy.ts > "$S/economy-hybrid2.ts"
# converters-pin-foundry-old.ts: converters.ts z 638e90bea z PRZYWROCONYM modelem odlewni brazu (m(e) epoki; bez wierszy
# explicit R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1, ktorych Rust nie ma) - zachowuje eksport converterThroughputEraParamKey
python3 - "$S" <<'PY'
import re, sys
S = sys.argv[1]
s = open(S + '/web638/gra/src/game/converters.ts').read()
rows = r", throughputEraParamKeys: \{ 2: 'budynek_huta_braz_epoka2_przepustowosc', 3: 'budynek_huta_braz_epoka3_przepustowosc' \}"
assert len(re.findall(rows, s)) == 3
s = re.sub(rows, "", s)
old = "export const CONVERTER_FOUNDRY_ERA_RECIPE_IDS: ReadonlySet<string> = new Set([\n"
assert old in s
s = s.replace(old, old + "  'odlewnia_brazu',\n  'odlewnia_zelaza__braz',\n  'wielka_odlewnia__braz',\n", 1)
open(S + '/converters-pin-foundry-old.ts', 'w').write(s)
PY
echo "gotowe: $S/{web638,economy-hybrid2.ts,converters-pin-foundry-old.ts}"
