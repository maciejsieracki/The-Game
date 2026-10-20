#!/bin/bash
# read-only check on pin edb8fb56
P=edb8fb56; L=/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1/.tmp-files.txt
chk(){ b=$1; spec=$2; f=$(grep -E "/$b\$" $L | head -1); echo "[$b:$spec] ($f)"; git show $P:"$f" | sed -n "${spec}p" | cut -c1-140 | head -3; }
chk main.ts 30068,30068; chk main.ts 30229,30229; chk main.ts 28343,28343
chk main.ts 36047,36047; chk main.ts 21672,21672; chk main.ts 20515,20515; chk main.ts 26310,26310
chk turn-economy.ts 2918,2918; chk main.ts 22154,22154; chk main.ts 10150,10150
chk post-battle-map.ts 554,554; chk playerState.ts 72,72; chk gamePauseMenu.ts 268,268
chk startScoring.ts 80,80; chk filePlayer.ts 310,310; chk filePlayer.ts 285,285
chk muzyka-antyczna.ts 1678,1678; chk production.ts 950,950; chk production.ts 921,921
chk empire-food.ts 118,118; chk braz-access.ts 25,25; chk economy.ts 1189,1189
chk generator.ts 335,335; chk generator.ts 369,369; chk wonder-placement.ts 34,34
chk cityPanel.ts 1196,1196; chk diplomacy-value-catalog.ts 301,301; chk economy.ts 664,664
chk mapFieldBattle.ts 1,1; chk ai.ts 4061,4061; chk ai.ts 3602,3602; chk ai.ts 4129,4129
chk production.ts 244,244; chk economy.ts 21,21; chk converters.ts 61,61; chk buildings.json 1537,1537
chk main.ts 8098,8098; chk main.ts 11178,11178; chk main.ts 14863,14863; chk main.ts 4007,4007; chk main.ts 3972,3972
