# R-WEB-TEST-DEBT-WARS-PINS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dług testowy wojen; tylko pliki testów w gra/tools; bez zmian w gra/src)
TEMAT: R-WEB-TEST-DEBT-WARS-PINS-Q1
GOAL: przepiąć trzy czerwone testy wojen/pokoju na AKTUALNĄ regułę (decyzja właściciela 2026-11-22) bez osłabiania asercji; każdy test z mutacją czerwoną.
BAZA: origin/main 8c8e98dd4bfdadf9a77dcea24fa1c7ca312b15a1 (checkout --detach w worktree wf_22a6346c-9d1-1).

## ZMIANY/COMMIT
Commit: patrz pole sha w odpowiedzi (commit tylko 3 plików testów + ten raport; bez gra/src, gra/data, WERSJE.md, manifestu).

Wszystkie trzy przypadki są PINAMI PRZESTARZAŁYMI, nie błędami gry. Źródło reguły: commit 69c7a0a25 (R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1, decyzja 2026-11-22): usunięto guard `hasAllianceTreaty` z wczesnych returnów Brązu/Kamienia/Żelaza w `gra/src/game/ai.ts` i ustawiono `isWarTreatyBlocked(eraWar=true) = false` w `gra/src/game/war-rules-multiwar.ts`. Testy nie zostały wtedy przepięte.

1. `gra/tools/forced-war-iron-test.cjs`
   - przed: l.264 `!ironCommand({hasAllianceTreaty:true}).some(wypowiedz_wojne)` „sojusz z celem nadal blokuje wojnę Żelaza”; l.265 identyczna asercja „blokuje DOW” (duplikat).
   - po: jedna asercja l.264–269: dokładnie jedno DOW na cel 7 z powodem `ZELAZO-WYMUSZONA-WOJNA` mimo sojuszu.
   - mutacja: przywrócenie `&& !forcedRel.hasAllianceTreaty` w `ai.ts` (blok Żelaza) → „FAIL: sojusz z celem NIE blokuje wojny Żelaza…”, 53/1 z 54. Kopia przywrócona (git checkout).

2. `gra/tools/era-war-bronze-player-target-test.cjs` (S5)
   - przed: l.303 `r.toPlayer.length === 0` „sojusz formalny blokuje wojnę epoki z graczem”.
   - po: l.304–305: `r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1` (AI1 -> gracz) oraz bramka `gateVerdicts` = ok mimo sojuszu.
   - mutacja: `isWarTreatyBlocked` z `if (input.eraWar) return input.hasAlliance;` → S5 FAIL (oba nowe asercje), kopia przywrócona.

3. `gra/tools/diplo-forced-peace-pending-test.cjs` (r2-3)
   - przyczyna: NIE błąd gry. Okno 200 znaków po `turn++;` odcinało się przed wywołaniem `showNextPendingForcedPeace()` w `gra/src/main.ts` (l.43437–43441), bo między nimi stoi blok `aiUpkeepTickTurnOverride` z komentarzami (~330 znaków). Zachowanie gry poprawne.
   - przed: `/turn\+\+;[\s\S]{0,200}if \(...\) showNextPendingForcedPeace\(\)/`
   - po: `/turn\+\+;[\s\S]{0,600}?PENDING-FORCED-PEACE-Q1[^\n]*\n\s*if \(pendingForcedPeaceTreaties\.length > 0\) showNextPendingForcedPeace\(\);/` — kotwica to komentarz PENDING-FORCED-PEACE-Q1 tuż przed wywołaniem (węższa niż poprzednio, nie szersza „na ślepo”).
   - mutacja: usunięcie linii wywołania w `main.ts` (l.43441) → „FAIL r2-3”, PASS=39 FAIL=1, kopia przywrócona.

## TESTY
- `npx tsc --noEmit` (gra/): exit 0.
- Trzy testy po zmianach: forced-war-iron-test 54/0 (przed 53/2); era-war-bronze-player-target-test 45 passed 0 failed (przed 43/1); diplo-forced-peace-pending-test PASS=40 FAIL=0 (przed 39/1).
- Mutacje (3 z 3) czerwone, kopie src przywrócone (`git checkout --`); `git status` po mutacjach: tylko 3 pliki testów.
- Bramki: war-rules-multiwar-main-guard 21 PASS / 0 FAIL; forced-war bronze main-guard 22 PASS / 0 FAIL; stone main-guard 15 PASS / 0 FAIL; iron main-guard 36 PASS / 0 FAIL; era-war-end-like-classic 17 PASS / 0 FAIL; era-war-start-at-entry 32 OK / 0 FAIL.
- Rodzina bez live (uruchomiona, wszystkie exit 0, zero FAIL): forced-war-bronze-new-game-reset, forced-war-bronze, forced-war-iron-era-enter-turn-save-load, forced-war-player-pre-contact-gate, forced-war-reguly-multi-turn-simulation (48/0), forced-war-relation-gate, forced-war-stone, forced-war-trojstronna-main-guard, forced-war-trojstronna, forced-war-waves; era-war-all-eras, era-war-defer-not-cancel, era-war-delays, era-war-engine-scenario, era-war-ignore-treaties, era-war-march-before-40, era-war-pairing-alliance, era-war-player-included; diplo-forced-peace-d2-guard, diplo-forced-peace-window-declutter (16/0).
- Pominięte jako live (wymagają przeglądarki, nie uruchamiane): forced-war-iron-player-target-live, forced-war-player-no-contact-live, forced-war-player-target-live, forced-war-r9-no-auto-end-live, forced-war-trojstronna-domino-live, diplo-forced-peace-d2-live, diplo-forced-peace-pending-live-paths. Nie zmieniano ich, więc ich stan nie zależy od tego tematu.
- `git diff --check`: czysto.

## BLOKADY
Brak. Wszystkie trzy testy zielone na asercjach pinujących nową regułę.

## BŁĘDY GRY (kandydaci)
Brak nowych. Trzy przypadki były pinami (dwa stare asercje, jeden zbyt wąski regex).

## RUNDY
1/5, ostatni werdykt: brak (pierwsza runda Operatora).

## UWAGI-DLA-ORKIESTRATORA
- Dwie asercje w `forced-war-iron-test.cjs` były duplikatem (l.264–265); zastąpiono jedną precyzyjną asercją, bez utraty pokrycia.
- Test `gra/tools/diplo-forced-peace-pending-test.cjs` nie kontroluje `gra/src/main.ts` w sposób odporny na formatowanie (regex na liniach). To ryzyko przy przyszłych edycjach `main.ts`, nie blokada.
- W worktree zainstalowano `gra/node_modules` (`npm ci`, bez `build`/`dev`). Po zapisie raportu usunięto go zgodnie z dispatchem.

NASTĘPNY KROK: integracja orkiestratora po Evaluatorze i Final Control (bez deployu).
DEPLOY/PUSH: NIE WYKONANO
