STATUS: PASS-WITH-NOTES (obrona r1: zarzut 1 PRZYJĘTY i naprawiony, zarzut 2 ZREALIZOWANY, zarzut 3 częściowo PRZYJĘTY, zarzut 4 częściowo PRZYJĘTY / częściowo ODRZUCONY)
DOMAIN: GAME (UI/render bitwy, ścieżka pola bitwy z mapy)
TEMAT: R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1
GOAL: w widoku 3D bitwy gracz = niebieski (#3a6ad0), przeciwnik = czerwony (#c84040), w obu rolach (atakujący i obrońca) i w ścieżce pola bitwy z mapy; złoto 0xffd54a nie tintuje 3D.
ZMIANY-COMMIT: 9c5f83440 (kod poprawki zarzutu 1 + test + narzędzia na żywo + zrzuty; baza = cfa7447d6, ancestry potwierdzone `git merge-base --is-ancestor`). Pliki: gra/src/battle/mapFieldBattle.ts (+4), gra/tools/battle-side-colors-3d-test.cjs (sekcja D), gra/tools/battle-side-colors-3d-entry.ts + .html (nowe), gra/tools/battle-side-colors-3d-live-test.cjs (nowy), dyspozycje/.../evidence/*.png (7 zrzutów). Poprzedni kandydat cfa7447d6 nieruszony w swoim zakresie (battleScene.ts bez zmian w tej rundzie).

## Odpowiedzi na zarzuty Evaluatora (ce52e881d)

**Zarzut 1 — PRZYJMUJĘ (poprawka + dowód + commit 9c5f83440).**
Cytat przed poprawką: mapFieldBattle.ts:542 `deps.createBattleScene({ ... deploy: true, ... })` bez `deployPlayerSide`; battleScene.ts:3566 `this._deployPlayerSideOpt = opts.deployPlayerSide ?? 'atk'`. Warunek roli gracza z l.537 (`atkLead.ownerId === 0 ? 'atk' : defLead.ownerId === 0 ? 'def' : null`) pokazuje, że gracz może być obrońcą. Poprawka (mapFieldBattle.ts:548): `deployPlayerSide: defLead.ownerId === 0 && atkLead.ownerId !== 0 ? 'def' : 'atk'` — ten sam wzorzec co main.ts:37097 (`deployPlayerSide: 'def'` w ścieżce obrony miasta). Dowód na żywo: patrz zarzut 2 (kontrola legacy).

**Zarzut 2 — PRZYJMUJĘ, ZREALIZOWANE (dowód na żywo).** Chromium 141 + xvfb-run, Playwright, prawdziwa BattleScene (preset bitwa_duza_pole) przez vite. Wynik surowy (live-test, `SUMMARY cases=5 fails=0`):
- atk, 1024x640: 118 niebieskich / 118 czerwonych / 0 złotych materiałów THREE, pageerror brak
- atk, 1280x720: 118 / 118 / 0, pageerror brak
- def, 1024x640: 118 / 118 / 0, pageerror brak
- def, 1280x720: 118 / 118 / 0, pageerror brak
- kontrola def legacy=1 (stare wywołanie bez deployPlayerSide), 1280x720: 118 / 118 / 0 — liczby identyczne, bo drużyny są symetryczne i liczniki NIE rozróżniają stron; rozstrzyga dopiero obraz.
Obejrzane zrzuty (Read): atk — gracz (niebieski, z jasnym polem rozstawienia) po lewej, przeciwnik (czerwony) po prawej; def — gracz (niebieski, jasne pole rozstawienia) po PRAWEJ, atakujący (czerwony) po lewej, zgodnie z HUD („Grecja — obrońca” po prawej). Kontrola legacy (def bez deployPlayerSide) daje obraz identyczny jak atk: jasne pole rozstawienia i niebieski po LEWEJ, a prawdziwa armia obrońcy (gracza w danych produkcyjnych) po prawej jest CZERWONA. To potwierdza zarzut 1 wizualnie. Zrzuty: dyspozycje/autobot/runs/R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1/evidence/ (side3d-*.png, side3d-def-LEGACY-kontrola-1280x720-zoom.png).
Zastrzeżenie uczciwości: zrzuty są małe (zoom DPR 3 wycinka 220x180); kolory niebieski/czerwony są rozpoznawalne, ale nie robiono pomiaru pikseli.

**Zarzut 3 — PRZYJMUJĘ CZĘŚCIOWO.** Dodana sekcja (D) w battle-side-colors-3d-test.cjs: asercja regex na `deployPlayerSide: defLead.ownerId === 0 && atkLead.ownerId !== 0 ? 'def' : 'atk'` oraz na to, że wywołanie createBattleScene w mapFieldBattle.ts zawiera tę opcję. Mutacja (tymczasowe usunięcie linii poprawki): `AssertionError [ERR_ASSERTION]: mapFieldBattle.ts musi przekazać deployPlayerSide ...`, exit 1; plik przywrócony z kopii i test ponownie OK. Sekcja A–C nadal opiera się na tekście źródła (regex) — to przyznaję. Zachowanie sceny sprawdza nowy test na żywo (zarzut 2), ale mutacji samego testu na żywo NIE wykonano.

**Zarzut 4 — PRZYJMUJĘ FAKT, CZĘŚCIOWO ODRZUCAM jako blokadę.**
- Potwierdzam: `git ls-tree -r --name-only origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 -- dyspozycje/.../R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1` zwraca TYLKO 00-dispatch.md; 00-dispatch-DODATEK-claude.md NIE istnieje na żadnej gałęzi (sprawdzone). Na origin/main katalogu runu brak. Rozstrzygnięcie ZAŁOŻENIEM (jak Operator): zakres = 00-dispatch.md.
- Dług Rust (e) REPIN palety stron 3D: NIE zrobiony w tej rundzie; zostaje do orkiestratora (patrz UWAGI).
- Pliki poza repo: moje — log `npm ci` zapisany do /tmp/x (naruszenie zasady scratchpad; nie usunięte, bo dispatch zakazuje rm); katalog gra/node_modules zainstalowany w worktree (gitignored). Operatorskie /tmp i wyjścia testów w ...wf_4e93638e-287-1 — nieruszane.

## Bramki (liczby z surowego wyjścia, uruchomione w worktree na 9c5f83440)
- `npx tsc --noEmit`: exit 0, bez komunikatów (także po edycji wejścia na żywo).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `All sanity checks passed.`, exit 0 (liczby 6/6 w tym komunikacie nie ma — NIE POTWIERDZONO liczby, komunikat sukcesu tak).
- `node tools/map-field-battle-test.cjs`: `--- 24 ok, 0 fail`, exit 0 (tabela w R-PROC-AUTOBOT podaje 22/22 — stara wartość; wynik bieżący 24/0).
- `node tools/battle-side-colors-3d-test.cjs`: `OK (A ... D: mapFieldBattle przekazuje rolę gracza)`, exit 0; mutacja: exit 1 (opisana wyżej).
- `node tools/battle-tempo-minimap-brand-test.cjs`: `OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)`, exit 0.
- `node tools/battle-hp-display-test.cjs`: `PASS — 7 / 7`, exit 0.
- `node tools/battle-damage-colors-test.cjs`: `WYNIK: 28 PASS / 0 FAIL`, exit 0.
- `xvfb-run -a node tools/battle-side-colors-3d-live-test.cjs`: `SUMMARY cases=5 fails=0`, exit 0.
- `git diff --check`: czysto. Allowlista: wyłącznie gra/src/battle/**, gra/tools/**, raport i evidence.
- NIE URUCHOMIONO: `tools/mgla-sciezka-inwariant-test.cjs` (nie dotykam zapisów pozycji jednostek; poza zakresem tej poprawki).

## Zakres sprawdzony poza mapFieldBattle
Wszystkie wywołania `new BattleScene` / `createBattleScene` w gra/src: main.ts:36308 (deployPlayerSide 'atk'), main.ts:37089 (def), main.ts:39521 (przekazanie opcji), main.ts:39952 (atk), main.ts:40114 (playtest, gracz atakujący, bez roli — domyślne 'atk' poprawne), oblezenie/main.ts:46 (piaskownica dev, bez gracza). Poza mapFieldBattle nie ma brakującej roli.

## BLOKADY
- Brak blokad dla poprawki.
- Zgodnie z dispatchem nie wykonano push ani integracji. Worktree zawiera gra/node_modules (gitignored) — do usunięcia przy sprzątaniu worktree.

## RUNDY
1/5 obrony (po werdykcie Evaluatora ce52e881d). Wiadomość do Evaluatora: zarzut 1 naprawiony w 9c5f83440.

## NASTĘPNY KROK
Evaluator (SONNET) ponownie na 9c5f83440: weryfikacja zarzutów 1 i 3 (mutacja sekcji D, diff mapFieldBattle.ts, zrzuty w evidence/). Potem Final Control.

## UWAGI-DLA-ORKIESTRATORA
1. ZMIANA ZACHOWANIA PONAD KOLOR (wymaga decyzji ABC dla właściciela, nie rozstrzygam sam): w bitwie polowej z mapy, gdy gracz broni, `deployPlayerSide='def'` włącza po stronie gracza fazę rozstawienia i bramkę dowódcy (battleScene.ts: 3579, 3663, 10620, 13131, 18263 używają `_deployPlayerSideOpt`). Przed poprawką gracz-obrońca nie mógł rozstawiać swojej armii — to jest błąd większy niż kolor. Ścieżka zgodna z main.ts:37097 (obrona miasta). Pytanie ABC: A) zostawić poprawkę (rekomendowane, spójne z obroną miasta); B) cofnąć i zostawić tylko kolor (nie rekomendowane). Zadać właścicielowi w głównym czacie.
2. Pierścienie grupy 0xffd700 (pytanie ABC B z Operatora) — nadal otwarte, nie zmieniano.
3. Dług Rust (criterion e): REPIN palety stron 3D — niezrobiony, do zapisania w rejestrze REPIN.
4. Dispatch 00-dispatch.md istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0; DODATEK nie istnieje — orkiestrator proszony o potwierdzenie zakresu.
5. Tabela bramek w docs/decyzje/R-PROC-AUTOBOT.md ma nieaktualną wartość dla map-field-battle (22/22 vs bieżące 24/0) — do odświeżenia przy okazji, poza tym tematem.
6. Plik /tmp/x (log npm ci) jest moim śmieciem poza repo — do usunięcia przy sprzątaniu.

DEPLOY/PUSH: NIE WYKONANO
