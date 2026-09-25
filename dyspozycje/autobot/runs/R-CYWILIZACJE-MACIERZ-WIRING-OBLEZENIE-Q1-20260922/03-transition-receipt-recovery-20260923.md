STATUS: FAIL
FROM: Final Control bounded recovery round2/provider-fallback
TO: Existing Operator topic for narrow correction
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
WORKSPACE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922

READ-ONLY RESULT:
- Nie zmieniono produktu, danych, testów, poprzednich raportów, commitów,
  Kanbana, WERSJE.md, KANAL-PRACA.md ani artefaktów integracji.
- Zapisano tylko:
  - 03-final-control-recovery-20260923.md
  - 03-evidence-recovery-20260923.json
  - 03-transition-receipt-recovery-20260923.md

WERYFIKACJA:
- 75/75 nowego testu wiring PASS.
- City-defense focused tests PASS: 34/0, 44/0, 41/0, 29/0.
- Project-local `./node_modules/.bin/tsc --noEmit` PASS, exit 0.
- `git diff --check` PASS, exit 0.
- 45/45 civ-matrix cells match INPUT; no other Oblężenie fields changed.
- Two declared unrelated failures preserved: empire 115/1 and koszty 126/3; current run matches upstream clean-baseline evidence.
- Manpower/Oblężenie JSON changes are structurally mergeable: changed-path intersection 0.

BLOCKING OBJECTION:
Production AI siege decisions are a live third path:
`main.ts:14929-14962,14966-14987` calls `decideAISiegeStance`, which uses
`siegeAi.ts:103-124,209-218` → `siege.ts:399-439::cityDefenseBonus`.
That path has no civKey/civ-matrix inputs and does not consume
`obl_mur_proc` or `obl_obrona_miasta_proc`, while actual battle paths do.
Therefore AI defenderStrength/tier/assault decisions can ignore the new
civ-specific city-defense parameters. This is a blocking omitted production
consumer under the Final Control dispatch.

SIDE AUDIT:
Wall/general city defense uses defender civKey. Siege-machine wall/gate damage
uses attacker civKey. No defensive sortie/counterattack path exists: the
battleScene defender-hold branch at 5938-5952 never calls _attackGate or
_attackWallTile.

NEXT LEGAL STEP:
Operator must make one narrow correction for the live siegeAi/siege.ts
AI-strength path, then route through the existing topic graph. Per the bounded
recovery contract, do not create another Final Control after this failure.

PUSH/MERGE/DEPLOY: NIE WYKONANO
