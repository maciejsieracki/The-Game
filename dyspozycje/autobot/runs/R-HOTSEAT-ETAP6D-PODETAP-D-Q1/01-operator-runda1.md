STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-D-Q1
GOAL: Migracja duplikatu tick dyplomacji wewnątrz `runWorldEndTurn` (Blok A + Blok B) na
isMe()/ME(), ostatni podetap Etapu 6d (dyplomacja, hot-seat).

GRANICE (świeży Read/grep, nie z recon): Blok A = main.ts:31238-31293 (klaster PM→gracz,
`if (startOi===0 && _menuCityStateDifficultyVsPlayer==='hard')` — `startOi===0` to indeks
resume, NIE dotknięty, nie reprezentuje gracza). Blok B = main.ts:31850-31948
(`if (diplomaticallyDiscoveredOwners.has(ownerId))`, per-AI-owner tick). Zmigrowano
WSZYSTKIE literały `0` reprezentujące gracza w obu zakresach (13 w Bloku A, 20 w Bloku B —
więcej niż orientacyjne "ok. 12" z dispatchu, bo migrowałem KAŻDy literał w dokładnych
granicach, nie tylko wzorce wymienione przykładowo w dispatchu) na `ME()`. Zweryfikowano
grepem: zero pozostałych `,0)`/`(0,`/`===0`/`'0'` reprezentujących gracza w obu blokach
(pozostałe trafienia to `startOi===0`, `?1:0`, `>0` — niezwiązane).

STYK Z P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1: kod `isForcedEpochWarDeclareCmd`/
`dipLayerIgnoringPlayerFog` żyje na main.ts:32270-32440, POZA obiema granicami (~350 linii
dalej niż Blok B). Zero styku edycji. Żywa bramka `forced-war-player-no-contact-live-test`
(dokładnie ten mechanizm) — 14/14 pass, identyczne z referencją, potwierdza brak regresji.

ZMIANY/COMMIT: `gra/src/main.ts` (wyłącznie Blok A+B), nowa bramka
`gra/tools/hotseat-etap6d-podetap-d-worldendturn-live-test.cjs`. Commit `8051be5a` na gałęzi
`autobot/R-HOTSEAT-ETAP6D-PODETAP-D-Q1` (worktree `/home/user/wt-6d-PODETAP-D`).

TESTY:
- `tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: 213/213, 19/19, 33/33, 13/13, 6/6.
- 18 bramek forced-war/dyplomacji (bronze/stone/iron/trojstronna + main-guard×4 +
  multi-turn-sim + trzy-naprawy + diplomacy-layers + ai-war-gate + diplomacy-war-gates +
  pre-contact-gate + no-contact-live + target-live + trojstronna-domino-live + bronze-new-
  game-reset + iron-era-save-load): wszystkie zielone, identyczne z referencją, zero regresji.
- NOWA żywa bramka Chromium (realny `doStartGame` hard-mode, realny `endTurn()`, ZERO
  reimplementacji): bootstrap → miasta-państwa "kopia typu" gracza (odkryte: 15,16,17;
  nieodkryte: 18,19,20) → fast-forward do tury 20 (Block B tickuje co turę, zero
  console.error) → REALNY rzut klastra 60% (Math.random NIEpodmieniany — próba podmiany
  globalnej psuła inne systemy losowe, patrz komentarz w pliku) → odkryci wypowiadają wojnę
  graczowi, nieodkryci NIE. 12/12 pass, reprodukowalne (2 niezależne przebiegi, identyczny
  wynik na turze 20-21).
- MUTACJA: `setDiploRelation(csOwnerId, ME(), newRel)`→`(csOwnerId, 99, newRel)` w Bloku A
  czerwieni WYŁĄCZNIE krok D nowej bramki (10 pass/2 fail), bez naruszenia kroku C (Block B).
  Zrewertowane, potwierdzone czyste. Analogiczna mutacja w Bloku B
  (`setDiploRelation(ME(), ownerId,...)`→`(99, ownerId,...)`) NIE została złapana przez
  istniejące bramki (`forced-war-player-no-contact-live-test` 14/14 — testuje OSOBNY
  mechanizm erowej wojny wymuszonej, nie rutynowy tick Bloku B) — dedykowana asercja
  mutacyjna dla Bloku B nie została domknięta w tej rundzie (patrz BLOKADY).

BLOKADY: Kryterium "mutacja niezależnie czerwieni Blok B" potwierdzone WYŁĄCZNIE
inspekcją kodu (grep — zero literałów) i brakiem regresji w 18+5 istniejących bramkach
(wszystkie ćwiczą Blok B co turę AI), NIE dedykowaną żywą asercją mutacyjną — zbudowanie
takiej w budżecie tej rundy (asercja na respekt/wiarygodność pary gracz-AI, nie tylko
status relacji) nie zostało domknięte. Rekomendacja: Evaluator ocenia czy powyższe wystarcza,
czy wymaga rundy 2 z dedykowaną asercją.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator ocenia dowody (w tym lukę mutacyjną Bloku B); przy PASS →
Final Control → integracja orkiestratora (ostatni podetap Etapu 6d).
DEPLOY/PUSH: NIE WYKONANO
