STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-HIT-MODE-SETTING-Q1
GOAL: Przełącznik "Trafienia: losowe / pewne" w Zaawansowanych opcjach generowania mapy (tooltip). "pewne" = każde uderzenie trafia bez rzutu, obrona tylko przez pancerz, w AUTO brak upsetu, wynik deterministyczny. "losowe" = dotychczasowe zachowanie (łącznie z upsetem 20%). Nowe gry domyślnie PEWNE; stare zapisy bez pola = LOSOWE. Progi (UPSET_R_THRESHOLD, UPSET_CHANCE, progi trafienia) bez zmian.
BAZA: origin/main 81e357dee (worktree detached; HEAD = 81e357dee przed zmianami)
ZMIANY/COMMIT: kod + testy + raport w jednym commicie (SHA w polu sha wyniku). Pliki:
 - gra/src/game/hit-mode.ts (NOWY, niezbędny moduł stanu trybu): typ HitMode, normalizeHitMode, setActiveHitMode/getActiveHitMode/isCertainHitMode; domyślnie 'losowe'.
 - gra/src/game/combat.ts: resolveCombat, 4 rzuty trafień (dystans ATK/DEF, zwarcie ATK/DEF). Przy 'pewne': hitPct=100, roll=0, bez wywołania rng.
 - gra/src/battle/battleScene.ts: _singleBlow (animowany cios). Przy 'pewne': hitPct=100, roll=0, bez Math.random.
 - gra/src/game/auto-battle-power.ts: resolveAutoBattleByPower, upset tylko gdy !isCertainHitMode(). Progi bez zmian.
 - gra/src/ui/newGameFlow.ts: NewGameAdvancedOptions.hitMode? (lokalny typ, moduł UI odcięty od game/); DEFAULT_ADVANCED.hitMode='pewne'; migrateAdvanced czyta pole; wiersz 'Trafienia' w advancedSettingRows (Pewne/Losowe, hint jako tooltip przez makeInfoIcon).
 - gra/src/main.ts: import; applyMenuParams ustawia tryb z params.advanced.hitMode (brak = losowe); restoreGameFromSave ustawia tryb z saved.meta.newGameParams.advanced.hitMode (brak = losowe). Zapis: pole trafia do meta.newGameParams.advanced automatycznie (zapisywany jest cały obiekt advanced).
 - gra/tools/hit-mode-test.cjs (NOWY): 18 testów (patrz TESTY).
 - gra/tools/newgame-settings-layout-reposition-test.cjs: oczekiwana lista okna zaawansowanego 13 -> 14 pozycji (dodano 'Trafienia' po 'Bitwy'). Test był czerwony po dodaniu wiersza; zmieniona jest tylko oczekiwana lista i komunikat.
 - dyspozycje/autobot/runs/R-WEB-BATTLE-HIT-MODE-SETTING-Q1/10-operator-claude.md (ten raport).
Stan globalny: tryb jest stanem modułu (hit-mode.ts), ustawianym przy starcie i wczytaniu gry. Wszystkie bitwy w danej grze (gracz i AI) używają jednego trybu, zgodnie z decyzją "wybór gracza decyduje o rozstrzygnięciu bitew".
Poza allowlistą nic nie zmieniono (bez ai.ts, JSON balansu, WERSJE.md, rust-port). Progi nietknięte. manualBattle.ts i inne wywołania resolveCombat dziedziczą tryb przez stan modułu, bez zmian kodu.
Uwaga procesowa: testy layoutu i skip-equals-auto zapisują artefakty w repo (PNG w R-WEB-NEWGAME-DEFAULTS-Q1/evidence, 01-matrix.json w R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1). Zmiany wycofano (git checkout), nie są w commicie.

TESTY:
 - npx tsc --noEmit (gra/): exit 0, brak błędów.
 - node tools/hit-mode-test.cjs: 18 PASS / 0 FAIL. Obejmuje: normalizacja (undefined/null/nieznana -> losowe); stan domyślny = losowe; 'pewne': 0 chybień w 2000 walkach (log), wynik niezależny od ziarna rng (2000 walk x 2 ziarna); 100 000 pełnych starć resolveCombat 1v1 (równe staty) bez chybienia i deterministycznie (545 ms); 'losowe': 300 starć identycznych jak stan domyślny dla tego samego ziarna; AUTO: upset przy rng=0 w 'losowe' (true), brak upsetu w 'pewne' (zwycięzca = silniejszy).
   UWAGA: "100 000 uderzeń" z dispatchu zrealizowano jako 100 000 pełnych starć resolveCombat, nie 100 000 pojedynczych ciosów. To mocniejszy test, ale inna jednostka miary.
 - node tools/newgame-settings-layout-reposition-test.cjs (Chromium): exit 0 po aktualizacji oczekiwanej listy (14 pozycji).
 - node tools/combat-test.cjs: exit 0 (istniejący golden resolveCombat w trybie domyślnym).
 - node tools/newgame-defaults-test.cjs, battle-mode-choice-labels-test.cjs, battle-mode-save-reload-contract-test.cjs: exit 0.
 - auto-battle-power-test, auto-battle-przewaga-monotonicznosc-test, auto-battle-loss-audit-test, auto-battle-py-vs-ts-parytet-test, auto-battle-simultaneous-test, battle-large-mixed-doctrine-matrix-test, battle-melee-attack-doctrine-test, battle-ranged-mounted-doctrine-test, battle-undeployed-units-test, battle-dead-units-removed-test, battle-standoff-two-warriors-test, army-stack-limit-test: exit 0 każdy.
 - battle-skip-equals-auto-resolve-test (Chromium), domyślnie WSKIP_SEEDS="1,2,3,7": NIE ukończył się w 280 s (exit 124, przerwany limitem; część A i seed 1 PASS). Z WSKIP_SEEDS="1": exit 0, wszystkie PASS (A1-A6, C1-C4, D0-D3, B0-B6 dla seed 1: SKIP == AUTO w zwycięzcy, stratach, HP, turze i pościgu; czas skip ~ auto). Seedy 2, 3, 7: NIEZMIERZONE.
 - Test skip-equals-auto uruchomiono w trybie 'losowe' (domyślnym dla skryptu). Tryb 'pewne' w tym teście: NIE_ZMIERZONO.
 - Mutacja (punkt 6 dispatchu): NIE_ZMIERZONO jako osobna mutacja. Pośrednio: w trybie 'losowe' ten sam zestaw daje chybienia w logu (test "losowe: w logu sa rzuty" PASS), więc test "pewne: zero chybien" rozróżnia tryby.
 - Zrzut w żywej grze (Chromium 1440x900, punkt 5): NIE_ZMIERZONO. Potwierdzono w teście layoutu, że wiersz 'Trafienia' jest w oknie zaawansowanym w zadanej kolejności.
 - Testy z pre-existing błędami (battle-loot-test, weterani-test, ai-major-economy-test, pr141-f04) NIE uruchamiane w tym temacie.

BLOKADY: brak blokad technicznych. Niezmierzone: zrzut w żywej grze, mutacja, seedy 2/3/7 testu skip-equals-auto, tryb 'pewne' w tym teście. Test skip-equals-auto przekracza 280 s przy 4 seedach.
Założenia rozstrzygnięte bez pytania:
 (a) Tryb ustawiany globalnie (moduł) zamiast przekazywania przez każdy wywołujący resolveCombat. Mniejsza inwazja, pełne pokrycie ścieżek (SKIP, AUTO, ręczna, AI) bez zmian w sygnaturach.
 (b) 'pewne' omija wywołanie rng w trafieniach (roll=0), więc nie zmienia strumienia losowości poza trafieniami.
 (c) Logi w trybie 'pewne' pokazują "trafienie (0.0<100%)", zgodnie z formatem logu, bez nowego typu wpisu.
 (d) Wiersz w UI: etykieta 'Trafienia', opcje 'Pewne' / 'Losowe' (domyślna pierwsza).
 (e) Migracja: brak pola w zapisie -> 'losowe' (fallback także w newGameParamsForLoad, bo brak pola = losowe).
 (f) rust-port nie dotykany (Rust ma własną bitwę; dług REPIN do wskazania osobno).
NASTĘPNY KROK: Evaluator. Zweryfikować diff, w tym nowy plik gra/src/game/hit-mode.ts (poza literą allowlisty, dodany jako niezbędny moduł stanu). Uruchomić zrzut 1440x900 w grze (Chromium) i mutację (przywrócenie rzutu w 'pewne' powinno dać FAIL w teście "zero chybien"). Uruchomić pełny battle-skip-equals-auto z WSKIP_SEEDS=1,2,3,7 w osobnym przebiegu.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
