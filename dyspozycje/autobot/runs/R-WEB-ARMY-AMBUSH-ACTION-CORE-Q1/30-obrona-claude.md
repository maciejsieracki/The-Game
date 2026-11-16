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
