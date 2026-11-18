STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL/GAME (treść Civpedii + wikiBundle)
TEMAT: R-WEB-DOC-CIVPEDIA-MELEE-ZERO-DAMAGE-AND-ARCHER-FLEE-NOTES-Q1
GOAL: dopisać do Civpedii zgodne z kodem notki o ciosach wręcz przy pancerzu i o ucieczce jednostek dystansowych; regeneracja wikiBundle generatorem.
BAZA: e42aac930801ad21dd558f00575fd196c30df5d3 (origin/main, FALA 816). Dispatch 00-dispatch.md istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie w origin/main).

ZMIANY/COMMIT: docs/encyklopedia/pojecia/ruch-i-cios-w-bitwie.md (+14 linii, dwa nowe podrozdziały); gra/src/data/wikiBundle.json (regeneracja: node gra/tools/bundle-wiki-for-game.cjs, diff 2 linie). Zero zmian w src i w regułach gry.

Zapisane zdania i źródła w kodzie:
- Obrażenia wręcz: max(0, obrażenia broni − pancerz) + przebicie (+ bonus szarży) — gra/src/game/combat.ts:452-461 (damageTw). Auto-walka: finalDmg = round(raw × mnożnik), bez minimum — combat.ts:1186, 1208, więc cios może dać 0.
- Bitwa ręczna: dmg = max(1, round(raw × mnożnik)) — gra/src/battle/battleScene.ts:9576, czyli minimum 1. Hasło opisuje obie ścieżki.
- Próg ucieczki: morale ≤ „Morale ucieczki” (domyślnie 25) — battleScene.ts:1661-1666; _checkRout 10370-10384; _startRout 10386-10390 (odwrót do własnej krawędzi).
- Teren obronny: próg −5 — battleScene.ts:1177, 10376-10381.
- Straty morale: 10% HP = −10 (battleScene.ts:1144); śmierć sojusznika w promieniu 3 pól −12 (1147, 1163); flanka −8 (1171); tył −15 (1172); szarża −15 (1173); otoczenie ≥3 wrogów −10 raz (1176).
- Walczące do śmierci: isNeverRout battleScene.ts:1626; _checkRout je pomija (10371).
- Łucznicy: _checkRout nie ma wyjątku dla primaryRanged (battleScene.ts:10370-10384); odsuw przy wrogu w odległości <2: RANGED_MIN_GAP (battleScene.ts:979, planowanie ~6974-7004).

BLOKADY:
1. SPRZECZNOŚĆ Z DECYZJĄ WŁAŚCICIELA: decyzja zakładała „cios bez przebicia zadaje 0” wszędzie, a kod w bitwie ręcznej (battleScene.ts:9576) daje minimum 1. Hasło opisuje oba stany. Wymaga decyzji właściciela: ujednolicić kod albo zmienić opis.
2. NIE ZMIERZONO: odsuw łuczników w bitwie ręcznej osobno (zapisano wg planowania sceny); brak testu na żywo.

TESTY:
- npx tsc --noEmit (w gra/, po npm ci --ignore-scripts): exit 0
- node gra/tools/civpedia-historia-infra-test.cjs: 18 pass, 0 fail
- node gra/tools/civpedia-oslabienie-docs-guard-test.cjs: 7 PASS, 0 FAIL
- node gra/tools/polish-language-audit-q1-guard-test.cjs: 7497 ok, 0 fail
- node gra/tools/civpedia-cuda-historia-test.cjs: 126 pass, 0 fail

RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje cytowania linii i rozstrzyga kwestię minimum 1 (bitwa ręczna) wobec 0 (auto) z decyzją właściciela.
UWAGI-DLA-ORKIESTRATORA: gra/node_modules utworzone przez npm ci w worktree (do sprzątania przez orkiestratora; nie usuwano, bo zakaz rm).
DEPLOY/PUSH: NIE WYKONANO
