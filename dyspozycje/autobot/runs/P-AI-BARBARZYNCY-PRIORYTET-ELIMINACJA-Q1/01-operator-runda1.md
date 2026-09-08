STATUS: PASS
DOMAIN: GAME
TEMAT: P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1
GOAL: AI likwiduje barbarzyńców na własnym terytorium zamiast ich ignorować, priorytet nad inną wojną (P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI).

WERDYKT PRZYCZYNY (a, z dowodem — nie domysł): `isHomeDefenseThreatForCity` (formuła
terytorium+4) jest matematycznie poprawna, ALE `homeThreats` liczono z
`engageableEnemyUnits`, który jest WCZEŚNIEJ przefiltrowany przez `opts.visibleHexes`
(realna mgła wojny AI, P-AI-BRAK-POJECIA-MGLY-Q1). `citySightRadius` = terytorium +
pierścień kultury (max +3) — ZAWSZE mniejszy niż zasięg obrony domu (terytorium + 2×
AI_HOME_DEFENSE_VICINITY_HEX = +4). Skutek: barbarzyniec spełniający formułę nigdy nie
trafiał do zbioru, na którym formuła jest wołana — martwy kod dla każdego zagrożenia poza
faktycznym zasięgiem wzroku (typowo: obóz w lesie/górach, garnizon skoncentrowany na
odległej wojnie — dokładnie zrzut właściciela). Ordering (przyczyna b) sprawdzony i
wykluczony: 4b2 (home defense) jest PRZED 4c (marsz na wroga) w pętli jednostek, a
`concentration`/`frontMerge` wykluczają `homeDefenderAssignments.keys()` (linie 3108,
3147 ai.ts) — przydział przeżywa nienaruszony. Dowód pomiarowy PRZED naprawą:
`diag-run.cjs` (scratchpad), miasto pop=8 (terytorium=8, sight=8, zasięg obrony=12),
barb 10 hex — `isHomeDefenseThreatForCity=true`, `aiVisibleHexes.has(barb)=false`,
`decideAITurn` → army1 maszeruje na odległe miasto (rememberedTarget), barb ignorowany.

NAPRAWA: `homeThreats` liczone teraz z nowej migawki `enemyAllUnitsRegardlessOfVisibility`
(wszyscy wrodzy, BEZ filtra `visibleHexes`, z `aiCanEngageOwner`) zamiast z
`engageableEnemyUnits`. Żaden inny mechanizm (cele ofensywne, marsz, dyplomacja) nie
zmienia źródła — nadal pełny filtr mgły. Dowód PO (ten sam scenariusz): army1 →
`{type:'move', toQ:40, toR:41}` — ruch W STRONĘ barbarzyńcy, nie odległego miasta.

ZMIANY/COMMIT: `gra/src/game/ai.ts` (linie ~2952-2963, ~3083-3106: nowa zmienna
`enemyAllUnitsRegardlessOfVisibility`, `homeThreats` z niej); `gra/tools/ai-home-defense-vs-barbarians-test.cjs`
(nowa T7 — regresja odtwarzająca lukę z żywą `computePlayerVisibility`, 42/42);
`dyspozycje/autobot/runs/P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1/*`. Commit: patrz git log
gałęzi.

TESTY: `tsc --noEmit` 0 błędów. `ai-home-defense-vs-barbarians-test.cjs` 42/42 (było 38/38,
+T7). 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6 — wszystkie zielone.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
