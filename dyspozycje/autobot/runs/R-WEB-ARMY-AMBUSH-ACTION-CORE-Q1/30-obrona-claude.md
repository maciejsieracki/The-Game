# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — obrona Operatora, RUNDA 2/5 (odpowiedź na zarzuty Evaluatora r2)

STATUS: FAIL (runda 2 NIE domknięta: wyzwalacz w ruchu wroga, filtr AI/pathfindingu i pełny cykl życia NIE zrobione; obrona przyjmuje zarzuty 1–3 i 6–9 jako OTWARTE z dowodem; zrobione: zarzut 4 (test przez prawdziwy zapis) oraz część pomiarów z zarzutu 8)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: w tej obronie domknąć to, co da się zrobić uczciwie bez ryzyka błędnej bitwy w grze: test na realnym zapisie (zarzut 4), pomiary bramek referencyjnych (zarzut 8). Wyzwalacz i filtr zostają otwarte, bo wpięte osobno tworzą błąd: heks z ukrytą jednostką wroga bez bitwy = dwie jednostki na jednym heksie.
BAZA: `c62651a5756fef7b3fd07993e1ca29b2d4b1e11b` (kandydat r2, gałąź lokalna `ambush-r2-obrona`). `origin/main` = `fadf21af9` NIE jest przodkiem bazy — integrowanie z mainem należy do orkiestratora.
ZMIANY-COMMIT: patrz sekcja SHA niżej. Allowlista tej obrony: `gra/tools/ambush-save-roundtrip-test.cjs` (NOWY) + ten raport. Kod gry NIE zmieniony w tej obronie.

## Odpowiedzi na zarzuty Evaluatora (nr jak w zarzutach)

1. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Potwierdzam dowód: `resolveAmbushTrigger` nie ma wywołania poza `game/ambush.ts` i testem. Brak przerwania ruchu, bitwy i komunikatów „Wpadłeś w zasadzkę!” / „Zasadzka się powiodła”. Powód: ruch AI jest natychmiastowy (`main.ts` ~45553 `executeAiCityMove` → `truncatePath` → `onMoved`/`onCapture`, bez animacji), a otwarcie bitwy w turze AI wymaga wznowienia fazy AI (`aiTurnAwaitingBattle`, `aiCmdResume`, wzór gałęzi `attack` ~45736). Ruch gracza ma osobną ścieżkę (`startAnimatedMove` ~33931 → animacja ~46739–46772; `openPlayerMapUnitAttackCore` ~35986 wymaga sąsiedztwa i rosterów). Nie wpinam „na pół”: bez tego powstaje błędna bitwa. Punkt wpięcia dla następnej rundy: przycięcie ścieżki na pierwszym heksie zasadzki wroga (w `executeAiCityMove` przed `path` i w `startAnimatedMove` przed `anim`), potem `resolveAmbushTrigger` i otwarcie bitwy przez istniejącą ścieżkę ataku. DECYZJA DO ORKIESTRATORA: czy zasadzka przeciw AI ma otwierać bitwę w turze AI (wymaga `aiTurnAwaitingBattle`), czy kończyć ruch AI na heksie z bitwą po zakończeniu tury.

2. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Potwierdzam: `isHexOccupiedForViewer` ma 0 wywołań poza `ambush.ts` i testem. ŚWIADOMIE nie dodaję filtra do `buildMoveOccupancy` (`units/setup.ts:774`) ani `occupiedExcluding` (`ai.ts:947`) bez wyzwalacza: wtedy AI wchodzi na heks z ukrytą jednostką gracza i powstaje nakładanie się jednostek. Filtr i wyzwalacz wchodzą w jednym temacie. Propozycja implementacji: opcjonalny parametr `isAtWar?: (a,b)=>boolean` w `buildMoveOccupancy` (domyślnie stare zachowanie); ukryta zasadzka wroga w stanie wojny nie jest blokadą ani `passThrough`. Ponadto DECYZJA: zasadzka wobec pokoju/rozejmu — obecny tekst `ambush.ts` mówi „nie blokuje”, co przy filtrze bez wojny daje nakładanie się; proponuję: wobec nie-wrogów heks pozostaje zablokowany (jak zwykła jednostka), a „nie odpala” zostaje.

3. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Potwierdzam stan: `cancelAmbush` jest w `startAnimatedMove` (ruch), `fortify` i `sentry` (main.ts ~27408, ~27443). NIE ma w: odwrocie po bitwie, relokacji, scaleniu/podziale (`armyMerge.ts` ani handlerach panelu podziału/scalania), wejściu do miasta, zmianie właściciela. Decyzja r2 (scalenie/split zdejmuje zasadzkę tylko z części, która się rusza) — nie wdrożona. Brak testu tej polityki.

4. PRZYJMUJĘ — ZROBIONE (częściowo). Nowy `gra/tools/ambush-save-roundtrip-test.cjs` używa PRAWDZIWYCH `serializeGame`/`deserializeGame` z `src/game/save.ts` (bundle esbuild, jak `alliance-war-call-saveload-test.cjs`). Pokrywa: `ambush:true` przetrwa zapis i wczytanie; jednostka bez zasadzki nie dostaje pola; stary zapis bez pola wczytuje się; śmieci (`null`, `1`, `'yes'`, `false`) normalizowane do braku zasadzki; zasadzka dwóch jednostek przetrwa razem. Wynik surowy: `Wynik: 5 OK, 0 FAIL`, exit 0. NIE pokryte: test scalenia częściowej zasadzki (zarzut 3) i wyzwalacz w realnym kroku ruchu (zarzut 1).

5. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. `ambush-ui-reason-test.cjs` importuje tylko `buildUnitActionBarHtml` i `canSetAmbush`. Zmiana `title` w `armyStackHud.ts` (`a.disabled && a.disabledReason`) i znacznik `ash-ambush-mark` NIE mają testu ani mutacji. Do zrobienia: test `buildArmyStackHud`-owego HTML lub test DOM (zależy od środowiska; decyzja narzędzia w następnej rundzie).

6. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Znacznik „w zasadzce” jest tekstem w nagłówku panelu armii (`armyStackHud.ts`, `span.ash-ambush-mark`). Brak ikony/obrysu na stosie na mapie (widocznego tylko dla właściciela). Wygląd NIE ZMIERZONO (brak Chromium w tej obronie).

7. PRZYJMUJĘ — OTWARTE, NIE ZROBIONE. Brak hasła wiki/Civpedia „Zasadzka” i regeneracji `wikiBundle`. Pełna lista długu Rust (REPIN) i lista do deployu nie zostały napisane w tej rundzie — zostają na następną rundę razem z wyzwalaczem.

8. PRZYJMUJĘ — CZĘŚCIOWO ZMIERZONE. Surowe wyniki (worktree `c62651a`, `npm ci --ignore-scripts` wykonany, exit 0):
   - `npx tsc --noEmit` → exit 0 (bez wyjścia).
   - `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`, exit 0.
   - `node tools/ambush-ui-reason-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0.
   - `node tools/ambush-save-roundtrip-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0 (NOWY).
   - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
   - `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0.
   - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
   - `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
   - `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0.
   - `node tools/load-game-regression-test.cjs` → `load-game-regression: 34 PASS / 0 FAIL`, exit 0.
   - `army-merge-colocated-test` → `4 pass, 0 fail`; `army-merge-besieger-only-move-test` → `WYNIK: 8 OK / 0 FAIL`; `army-merge-dismiss-bounce-test` → `16 pass, 0 fail`; `army-merge-bounce-test` → `4 pass, 0 fail` (wszystkie exit 0).
   - NIE ZMIERZONO w tej rundzie: determinizm (hash), `siege-*`, `ai-*`, pełne `battle-*-test.cjs`, Chromium (przycisk, znacznik, tooltip, przerwanie ruchu, okno bitwy, zrzuty 1280×720). Powód: zakres r2 nie został wykonany, a te pomiary dotyczą kodu, którego jeszcze nie ma (wyzwalacz, filtr).

9. PRZYJMUJĘ. Runda 2 została zamknięta jako częściowa i nie jest kandydatem do deployu. Liczenie rund: RUNDY: 2/5 zużyte (r1 FC FAIL, r2 ten kandydat). Ta obrona jest poprawką w obrębie rundy 2 i nie zużywa rundy 3. Zalecenie: NIE wdrażać kandydata; kolejna runda musi zamknąć pkt 1, 2, 4 razem (zależne od siebie), a decyzje z pkt 1 i 2 należą do właściciela/orkiestratora.

## DECYZJE DO ORKIESTRATORA (zebrane)
- A: zasadzka przeciw AI — bitwa w turze AI (aiTurnAwaitingBattle) czy po turze?
- B: zasadzka wobec pokoju/rozejmu — heks blokowany jak zwykła jednostka (rekomendacja) czy „nie blokuje” jak dziś w `ambush.ts`?
- C: scalenie/podział — czy zasadzka zostaje w części nieruchomej (rekomendacja, zgodnie z decyzją r2) i czy odwrót po bitwie zdejmuje ją ze wszystkich (rekomendacja: tak).

## SHA
Commit obrony r2 — patrz wynik `git log -1` w sekcji ZMIANY-COMMIT orkiestratora (SHA końcowy w polu `sha` raportu zwrotnego).

## Uwagi dla orkiestratora (poza zakresem)
- `origin/main` (`fadf21af9`) NIE jest przodkiem bazy `c62651a`; przed integracją orkiestrator musi scalić `main` i sprawdzić `git merge-base --is-ancestor c62651a <SHA integracji>`.
- `tools/.ambush-save-roundtrip-bundle.cjs` (plik tymczasowy testu) NIE jest commitowany.

---

# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — obrona Operatora, runda 1/5 (odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (obrona częściowa: 3 zarzuty PRZYJĘTE i zrobione w kodzie, 5 PRZYJĘTE jako otwarte, 2 ODRZUCONE z dowodem, 1 PRZYJĘTY jako fakt do decyzji FC; KRYTERIA RUNDY 1 NIE SĄ SPEŁNIONE — wyzwalacz w ruchu i AI nie podpięte, zob. BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: domknąć w rundzie 1 to, co dispatch przypisuje do rundy 1 (stan, akcja, widoczność, wyzwalacz, testy). W tej obronie domknięto widoczność w renderze i test własnego właściciela; wyzwalacz w ruchu wroga, filtr AI i oznaczenie dla właściciela zostają otwarte.
ZMIANY-COMMIT: baza kandydata `a55c98695` (1 commit ponad `fadf21af9`). Commit obrony: patrz sekcja SHA niżej. Allowlista tej obrony (tylko 3 pliki, wszystkie w allowliście dispatchu lub wskazane przez zarzut 4):
- `gra/src/main.ts` — import `isUnitVisibleToViewer`; w `unitRenderer.sync` źródło `src = rawSrc.filter(u => isUnitVisibleToViewer(u, ME()))` (zarzut 1).
- `gra/src/game/save.ts` — import `normalizeAmbushField` z `./ambush`; w `deserializeGame` przed `const save` pętla normalizacji pola `ambush` po `obj.units` (zarzut 4).
- `gra/tools/ambush-core-test.cjs` — dodany przypadek: własny ruch z `isAtWar = () => true` nie uruchamia zasadzki (zarzut 11).
- `dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1/30-obrona-claude.md` — ten raport.

## Odpowiedzi na zarzuty (nr jak w zarzutach Evaluatora)

1. PRZYJMUJĘ — zrobione. `gra/src/main.ts`, `unitRenderer.sync(src, ...)`: `src` filtrowane przez `isUnitVisibleToViewer(u, ME())`, więc zasadzka cudza nie trafia do renderu. Mgła: `rawSrc` jest już ograniczone do `visibleUnitsList(sharedVis)` przy włączonej mgle, więc filtr dotyczy też tej ścieżki. Dowód: `tsc --noEmit` exit 0. NIE ZMIERZONO w Chromium (brak zrzutu, zob. zarzut 9).
2. PRZYJMUJĘ jako OTWARTE — NIE ZROBIONE w tej obronie. `ai.ts` i pathfinding nadal nie używają `isHexOccupiedForViewer`. Dispatch (b)/(d) wymaga tego w rundzie 1; to jest realny brak.
3. PRZYJMUJĘ jako OTWARTE — NIE ZROBIONE. `resolveAmbushTrigger` nie jest wołane w kroku ruchu wroga; brak przerwania ruchu, brak bitwy, brak komunikatów. Dispatch (c)/(e)/(f) wymaga tego w rundzie 1. Najbliższy punkt wpięcia do sprawdzenia: ścieżka `startAnimatedMove` i kolejka marszu w `main.ts` (NIE PRZEGLĄDANE w tej obronie w zakresie szczegółów).
4. PRZYJMUJĘ — zrobione częściowo. `save.ts` `deserializeGame`: normalizacja `normalizeAmbushField` na każdym obiekcie `obj.units` (jedyne wejście wczytania, patrz komentarz przy `migrateLegacyFarmsOnForestInSave`). Dowód: `load-game-regression-test.cjs` → `34 PASS / 0 FAIL`, exit 0. NIE ZROBIONE: test w `ambush-core-test.cjs` nadal używa `JSON.parse(JSON.stringify())`, a nie `serializeGame`/`deserializeGame`; tej luki nie zamykam w tej obronie. Dodatkowo `save.ts` przy zapisie nie był zmieniany — pole jest serializowane jako część obiektu jednostki (zgodnie z raportem operatora).
5. PRZYJMUJĘ jako OTWARTE — NIE ZROBIONE. Brak oznaczenia „w zasadzce” dla właściciela (ikona/obrys w renderze). Zmiany tylko w `armyStackHud.ts`/`unitActionBarHtml.ts` (ikona akcji) — zgodnie z zarzutem.
6. PRZYJMUJĘ jako OTWARTE — NIE ZBADANE. Nie sprawdzono w tej obronie interakcji `sentry` z zasadzką ani cyklu tury (zarzut opiera się na wniosku z kodu, nie na teście). Nie zmieniano.
7. PRZYJMUJĘ jako OTWARTE — NIE ZROBIONE. `cancelAmbush` jest wołane tylko w `startAnimatedMove` (plus akcja gracza). Odwrót po bitwie, relokacja, scalanie i split nie zdejmują pola. Polityka split/merge z dispatchu (`armyMerge.ts` punktowo) nie została zrobiona.
8. ODRZUCAM — dispatch ustala podział: „PODZIAŁ PRACY W RUNDACH … runda 1 = stan + akcja + widoczność + wyzwalacz + testy; runda 2 = rozstawienie w bitwie + AUTO + Chromium” (`00-dispatch.md`, gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Rozstawienie w `gra/src/battle/*` jest więc poza rundą 1 zgodnie z dispatchem. Stała `AMBUSH_FORMATION_MAX_WIDTH` (nieużywana) ma komentarz „runda 2”. Uwaga dla FC: kryterium (b) dispatchu jest binarne, a jego realizacja przypisana do rundy 2 — to rozjazd w samym dispatchu, do rozstrzygnięcia przez orkiestratora.
9. ODRZUCAM jako defekt kodu — dispatch kryterium (c) dopuszcza „NIE ZMIERZONO z uzasadnieniem” w tej rundzie. Chromium nie uruchomiono w tej obronie (build vite poza repo nie był wykonany). Zrzut panelu i widoczność dla drugiego gracza zostają NIE ZMIERZONO.
10. PRZYJMUJĘ jako fakt, decyzja dla FC — `gra/src/ui/unitActionBarHtml.ts` nie jest na allowliście dispatchu. Zmiana jest addytywna (ikona w `ACTION_ICONS` + wpis w `COMPACT_ACTION_ORDER`). Ten plik renderuje pasek akcji pojedynczej jednostki, więc bez niego przycisk nie pojawia się dla pojedynczej jednostki. Nie zmieniano w tej obronie. Wniosek: FC musi zdecydować, czy rozszerzyć allowlistę o ten plik.
11. PRZYJMUJĘ — zrobione. Dodany przypadek: `resolveAmbushTrigger(…, moverOwnerId = 0, () => true)` przy zasadzce właściciela 0 → `triggered === false` i brak mutacji. Dowód mutacji: po usunięciu warunku `u.ownerId !== moverOwnerId` z `ambush.ts` (w pliku roboczym, potem przywrócony) `ambush-core-test.cjs` daje `Wynik: 38 OK, 2 FAIL`, exit 1 (poprzednio mutant przeżywał). Po przywróceniu: `40 OK, 0 FAIL`, exit 0. Nie domknięto luki „stos częściowo w zasadzce przy scalaniu” (zależy od zarzutu 7).
12. PRZYJMUJĘ częściowo. Nazwa nowego testu do listy deployu: `gra/tools/ambush-core-test.cjs` (podana w tym raporcie; wpis w liście deployu NIE dodany). Hasło wiki „Zasadzka”: NIE dodane; NIE ZBADANE, czy test wiki je wymusza (dispatch h: tylko jeśli wymusza). Dług Rust: pełna lista poniżej.
13. PRZYJMUJĘ jako OTWARTE — NIE ZROBIONE. Przycisk „Zasadzka” jest `disabled` bez powodu: `UnitPanelAction` nie ma pola z powodem, a `unitActionBarHtml.ts` ustawia `title` tylko na `a.label`. Komunikat `AMBUSH_BLOCK_MESSAGES` jest dziś pokazywany tylko w handlerze kliknięcia, którego disabled nie wywoła. Poprawka wymaga pola w `UnitPanelAction` i renderu tytułu — poza tą obroną.

## Dług Rust (lista do REPIN w `rust-port`, NIE zmieniano rust-port)
- `gra/src/game/ambush.ts`: cały moduł (stan, `canSetAmbush`, `setAmbush`, `cancelAmbush`, widoczność, `resolveAmbushTrigger`, `normalizeAmbushField`) — do przeniesienia.
- `gra/src/units/setup.ts`: pole `RuntimeUnit.ambush?: boolean`.
- `gra/src/main.ts`: akcja `ambush` w liście akcji stosu i handler; `cancelAmbush` w `startAnimatedMove`; filtr renderu `isUnitVisibleToViewer`.
- `gra/src/game/save.ts`: normalizacja pola `ambush` w `deserializeGame`.

## TESTY (surowe wyniki, po zmianach obrony)
- `npx tsc --noEmit` → exit 0 (bez błędów).
- `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`, exit 0 (poprzednio 38 OK).
- Mutant M7 (bez `ownerId !== moverOwnerId`) → `Wynik: 38 OK, 2 FAIL`, exit 1; plik przywrócony.
- `node tools/load-game-regression-test.cjs` → `load-game-regression: 34 PASS / 0 FAIL`, exit 0.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- NIE ZMIERZONO: Chromium, zrzuty, `siege-*`, `ai-*`, `battle-*`, `army-merge-*` (nie uruchamiano w tej obronie), determinizm, `tech-tree-test`, `research-test`, `combat-test` (nie uruchamiano ponownie w tej obronie — wynik z raportu operatora nie był weryfikowany).

## BLOKADY (jawnie)
1. Wyzwalacz w ruchu wroga NIE podłączony (zarzut 3) — kryterium (c) rundy 1 niespełnione.
2. Filtr AI/pathfinding NIE podłączony (zarzut 2) — kryterium (a)/(d) w części „AI” niespełnione.
3. Oznaczenie „w zasadzce” dla właściciela NIE zrobione (zarzut 5).
4. `cancelAmbush` poza `startAnimatedMove` NIE zrobione (zarzut 7).
5. Interakcja z `sentry`/cykl tury NIE zbadana (zarzut 6).
6. Tooltip z powodem blokady NIE zrobiony (zarzut 13).
7. Test normalizacji nie przechodzi przez realne `serializeGame`/`deserializeGame` (zarzut 4).
8. Allowlista `unitActionBarHtml.ts` — decyzja FC (zarzut 10).
9. Chromium NIE zmierzono (zarzut 9).

## RUNDY
2/5 (runda 1 obrony). Ten sam ID, bez zmiany kryteriów.

## NASTĘPNY KROK
Evaluator ponownie: sprawdzić commit obrony. Operator, jeśli runda wróci: domknąć BLOKADY 1, 2, 3, 6, 7 i 13 w tej kolejności (wyzwalacz i AI są kryteriami rundy 1). FC decyduje o allowliście `unitActionBarHtml.ts` (zarzut 10) i o podziale rund (zarzut 8).

## DEPLOY/PUSH: NIE WYKONANO
