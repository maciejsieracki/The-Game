STATUS: PASS-WITH-NOTES (Operator r2; bieg dymny 120 tur NIE WYKONANO, patrz TESTY)
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-DEFER-NOT-CANCEL-WHEN-PREVIOUS-WAR-ACTIVE-Q1
GOAL: wojna epoki Brązu odroczona przez trwającą wojnę (Kamień / inna blokada) ma wybuchnąć po zniknięciu blokady, a nie wisieć bez celu.

DIAGNOZA (plik:linia, zmierzone w teście):
- Pending Brązu (`bronzeForceWarPendingOwners`) trwa poprawnie (nie jest kasowany przy odroczeniu; B4).
- Przyczyna braku wybuchu: parowanie `assignForcedWarPairings` (forced-war-common.ts, krok 1–4) bierze cele WYŁĄCZNIE spośród podmiotów „triggered" tej tury. Lone pending bez partnera w puli trafiał do `unresolvedOwnerIds` (dowód: probe A, `unresolved [2]`).
- Gdy trwa wojna Kamienia, pending Brązu dołączał jako „trzeci" do pary Kamienia (probe B). Cel jest wtedy stroną `stanWojny` i ai.ts (decideAIDiplomacy, ~l.7242–7255) odrzuca komendę. Pending zostaje, ale nic nie wybucha.
- Natural war (`alreadyAtWarAnyRole`, main.ts ~l.45400/45414) wyłącza podmiot z puli na tę turę: odroczenie, nie anulowanie.

POPRAWKA (commit poniżej):
- forced-war-common.ts ~l.515: podmiot Brązu/Żelaza bez partnera dostaje NAJBLIŻSZY WOLNY cel spoza puli (bez wojny wymuszonej, bez NAP/sojuszu, z wolnym licznikiem, bez duplikatu w tej turze). Dopiero potem dołączenie do pary. Kamień nie korzysta (twardy limit R2 celu).
- main.ts ~l.45594 / ~l.45657: wspólna lista `forcedWarMajorAiSubjects` (major AI bez gracza) przekazana jako `freeTargetCandidates`; gracz nadal NIE jest celem tego fallbacku (zachowana reguła ui-params „wojny epoki tylko między AI").
- Progi, koszty, JSON bez zmian. Stare zapisy bez zmian (brak nowego pola stanu).

ZMIANY/COMMIT: gra/src/game/forced-war-common.ts, gra/src/main.ts, gra/tools/era-war-defer-not-cancel-test.cjs (+T7, +T8). Zacommitowano tylko te ścieżki.
TESTY:
- era-war-defer-not-cancel-test.cjs: 24/0 (T1–T6 bez zmian 16/0; T7 fallback 6 asercji; T8 wiring main.ts 2 asercje).
- tsc --noEmit: 177 błędów środowiskowych (brak zależności `three` w tym worktree); 0 błędów w zmienionych liniach forced-war-common.ts i main.ts ~45590–45660. NIE ZMIERZONO na czystym środowisku.
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; era-war-delays 55/0; era-war-ignore-treaties 22/0.
- forced-war-bronze 45/3, forced-war-iron 54/1, forced-war multi-turn 43/5: wszystkie porażki to asercje progu 20/25 tur, a JSON ma 40 (eraForcedWarStartTurnsFromEra, nietknięty). Iron na bazie 4643c43ce daje ten sam wynik 54/1. Bronze na bazie NIE ZMIERZONO (brak bundla `three` w wyciągu bazy).
- BIEG DYMNY 120 tur (seed 4242) NIE WYKONANO w tej rundzie: brak zmierzonej tabeli tur wejścia/pending/prób/wypowiedzeń. Zmierzono wyłącznie logikę czystą (probe + testy).

BLOKADY: (1) brak biegu silnika z logami; (2) wojna naturalna nadal odracza (nie kasuje) próbę Brązu — zgodne z R1, bez zmiany; (3) Kamień nadal bez fallbacku (ten sam problem; wymaga osobnej decyzji o limicie celu R2).
RUNDY: 2/5. Poprzednio FAIL bez kodu (r1).
NASTĘPNY KROK: FC: sprawdzić diff fallbacku i wybrać bieg dymny 120 tur (seed 4242) z logami [war-limit] / pending Brązu.
UWAGI-DLA-ORKIESTRATORA: `gra/node_modules` w tym worktree to symlink do node_modules innego worktree (wf_3c110118-422-1), nieśledzony, ignorowany przez gitignore; nie usuwałem (zakaz rm).
DEPLOY/PUSH: NIE WYKONANO
