# R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1 — obrona (Operator/Obrona, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1
GOAL: w scenie bitwy (ręczna, oblężenie, bitwa taktyczna, podsumowanie) każda ścieżka zapisu jest zablokowana z komunikatem „Zapis niedostępny w trakcie bitwy”; poza bitwą zapis bez zmian; po bitwie zapis działa. Dowód: test Chromium na buildzie produkcyjnym + mutant czerwieniący.

BAZA: cb7287e98 (kandydat Operatora). Obrona nie zmienia założeń kandydata poza zarzutami.

## Odpowiedzi na zarzuty Evaluatora (ff0920ee3)

**Zarzut 1 — brak testu Chromium i evidence/. PRZYJMUJĘ.**
Poprawka: nowy `gra/tools/battle-save-disabled-live-test.cjs` (Vite build poza repo do katalogu tymczasowego, Chromium `/usr/bin/chromium`, serwer HTTP na 127.0.0.1, wzorzec z `battle-manual-melee-live-test.cjs`). Test wchodzi w bitwę dużą (preset 28v28) przez UI (`#deploy-toolbar-start`), wykonuje zapis trzema ścieżkami i przechodzi przez zakończenie bitwy. Dowody: `dyspozycje/autobot/runs/R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1/evidence/` (`live-result.json`, `mutant-live-result.json`, zrzuty PNG, `raw-gates.txt`). Commit: `81fbab179`.

**Zarzut 2 — mutacja tylko tekstowa. PRZYJMUJĘ.**
Poprawka: tryb `--mutant` w żywym teście wyłącza bramkę `isSaveBlockedByBattle()` (zwraca `false`) w kopii bundla, czyli zmienia zachowanie, nie tekst. Wynik: `5 PASS / 3 FAIL`, exit 1. Failujące asercje: 3a (`doQuickSave` zwraca `true`, `writes=3`, zapisy `idb.put:kv:thegame.save.autosave`, `idb.put:kv:thegame.savemeta.autosave`, `ls.setItem:thegame.save._lastPlayed`), 3c (klawisz Ctrl+S: `writes=3`), 3b (brak komunikatu). Mutacja tekstowa z testu strukturalnego została zachowana.
Zakres mutacji: bramka wspólna dla `persistSaveToSlot`/`doQuickSave`/`openSaveGameDialog`/autozapisu. Nie mutowałem osobno każdej ścieżki; ścieżka autozapisu rotacyjnego nie jest wykonywana w teście na żywo (patrz BLOKADY).

**Zarzut 3a — panel przed bitwą (preBattle „Zapisz”) nadal zapisuje. ODRZUCAM (z dowodem zakresu; do potwierdzenia FC/właściciela).**
Dowód: `gra/src/battle/battleScene.ts:3558` — `markBattleSceneOpen(this)` jest wywoływane na końcu konstruktora `BattleScene` (po `this._startLoop()`), a `isBattleSceneOpen()` czyta ten zbiór. Plik `ui/preBattle.ts` nie konstruuje `BattleScene` (brak `new BattleScene` w pliku); scena powstaje dopiero przy starcie bitwy w `main.ts` (wywołania `new BattleScene` w pobliżu linii 33883, 34614, 37313, 37473). Do tej chwili `isBattleSceneOpen()` jest `false` i panel zapisuje. Dokładnie to wymaga potwierdzenia przez FC. Zgodnie z dispatchem („w scenie bitwy”) to zachowanie celowe. Gdyby właściciel chciał blokady również na panelu przed bitwą, to osobna decyzja (ABC), nie poprawka. Oznaczone jako DECYZJA do potwierdzenia.

**Zarzut 3b — dialog zapisu pokazuje „Zapis nieudany (brak localStorage?)” w bitwie. PRZYJMUJĘ.**
Poprawka w `gra/src/main.ts` (w `onSave` dialogu zapisu, gałąź `else`): nowa gałąź `else if (isSaveBlockedByBattle()) { notifySaveBlockedByBattle(); }` przed generycznym komunikatem. Diff: 5 linii dodanych, bez zmian formatu zapisu. Ta gałąź NIE jest pokryta testem na żywo (dialog nie da się otworzyć w bitwie, a otwarcie przed bitwą i kliknięcie w trakcie wymaga dłuższego scenariusza) — patrz BLOKADY.

**Zarzut 3c — rozszerzenie blokady na `isPostBattleSummaryOpen`. Bez zmiany.**
Zgodne z dispatchem (ekran podsumowania bitwy to bitwa), sprawdzone w teście: po `skip()` i do zamknięcia podsumowania zapis jest blokowany, a po powrocie na mapę działa (PASS 5b, PASS 6).

## Kluczowe fakty dla FC (z dowodów)

- Ctrl+S w bitwie trafia do globalnego handlera `window.keydown` (capture i bubble widzą `Control`/`s`, `defaultPrevented=0`), potem `doQuickSave` zwraca `false`, zapis nie następuje, komunikat jest pokazywany (`notifyAfterDirect=1`, `blockedDisplay` = `display:block`, `z-index:10030`, rect 223×35, `position:fixed`).
- Komunikat jest w DOM i pokazany, ale w tym środowisku headless nie udało się potwierdzić go na zrzucie ekranu (patrz BLOKADY).

## TESTY (surowe wyniki w `evidence/raw-gates.txt`)

- `npx tsc --noEmit` (w gra/): EXIT 0.
- `node tools/logic-test.cjs`: 213/213 (EXIT 0).
- `node tools/tech-tree-test.cjs`: 20 pass, 0 fail (EXIT 0).
- `node tools/research-test.cjs`: 33/33 (PASSED 33 / FAILED 0, EXIT 0).
- `node tools/unit-replace-test.cjs`: 21/21 (EXIT 0).
- `node tools/combat-test.cjs`: 6/6 (EXIT 0).
- `node tools/battle-save-disabled-test.cjs` (strukturalny): 8 PASS / 0 FAIL (EXIT 0).
- `node tools/battle-save-disabled-live-test.cjs` (real, produkcyjny build): 8 PASS / 0 FAIL, EXIT 0 (czas 237 s).
- `node tools/battle-save-disabled-live-test.cjs --mutant`: 5 PASS / 3 FAIL, EXIT 1 (czerwień potwierdzona).
- `git diff --check`: bez błędów.

Uwaga o liczbie bramek: dispatch mówi o „5 bramkach referencyjnych”; wykonałem pięć z `R-PROC-AUTOBOT.md` §Bramki (logic, tech-tree, research, unit-replace, combat) oraz tsc. Bramki „mapa/AI/kontrakt karty” nie były związane z tym tematem i nie uruchamiałem ich.

## BLOKADY / NIE_ZMIERZONO

- **Widoczność komunikatu na pikselach: NIE_ZMIERZONO.** W headless Chromium pętla renderowania bitwy stoi (zegar bitwy „00:03” na każdym zrzucie, także przed naciśnięciem klawisza), więc zrzuty pokazują stare klatki. Dowód komunikatu to pomiar DOM (display, rect, visibility, opacity, z-index, MutationObserver), nie zrzut. Wymaga kontroli wizualnej przez FC lub właściciela w normalnej przeglądarce.
- **Menu pauzy „Zapisz” w bitwie: NIE_ZMIERZONO na żywo.** Esc nie pokazał przycisku zapisu w DOM (`saveBtnCount=0`). Bramka działa w kodzie (`openSaveGameDialog`), ale ścieżki nie wykonałem.
- **Dialog zapisu w bitwie (nowa gałąź z zarzutu 3b): NIE_ZMIERZONO na żywo.** Pokryte tylko przez kod.
- **Autozapis rotacyjny (`doRotatingAutosave`) na żywo: NIE_ZMIERZONO.** Wymaga zakończenia tury; w teście nie uruchamiałem końca tury. Bramka w kodzie jest przed `saveToLocal`; pokryte strukturalnie.
- **Toast „Szybki zapis” po zapisie poza bitwą i po bitwie: NIE_ZMIERZONO.** Zapis IDB jest potwierdzony liczbą wywołań (`writes>0`), ale tekst „Szybki zapis” nie zawsze pojawiał się w obserwatorze; asercja tekstu nie jest częścią werdyktu.
- **Czas wykonania testu:** około 4 min na build i grę; test nie jest odporny na bardzo wolne maszyny (timeouty 120–300 s).

## RUNDY

Obrona po zarzutach Evaluatora z `cb7287e98` (`ff0920ee3`): runda 1 obrony tego tematu.

## NASTĘPNY KROK

Ponowna ocena Evaluatora na `81fbab179` (kod) + ten raport. Dla FC: (a) decyzja o zakresie panelu przed bitwą (zarzut 3a), (b) kontrola wizualna komunikatu w normalnej przeglądarce, (c) zweryfikować, czy potrzebny jest osobny test dialogu zapisu w bitwie.

## DEPLOY/PUSH

NIE WYKONANO. Brak integracji, brak pushu na main, brak deployu. Gałąź/commit lokalny w worktree.

## SHA

- Kod obrony: `81fbab179` (na bazie `cb7287e98`).
- Raport i dowody: commit po tym pliku (patrz komunikat końcowy Operatora).
