TEMAT: R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME (UI)
ŚCIEŻKA: gra/src/battle/battleScene.ts (GOAL 1), gra/src/game/battle-summary.ts +
gra/src/ui/postBattleSummary.ts (GOAL 2, ikony), gra/src/main.ts (GOAL 3, opcjonalnie)
MODEL+EFFORT: claude-sonnet-5, effort high

WYZWALACZ (zgłoszenie właściciela, 2026-09-03, ze zrzutem ekranu)
"w wyniku bitwy jest informacja 'wojownik wygrywa', a powinno być 'gracz wygrywa'. Po lewej
stronie powinna być informacja 'Grecy' zamiast 'wojownik', a po drugiej stronie powinna być
'Korynt, Grecy, państwo-miasto' zamiast 'wojownik'. Ikona państwa-miasta powinna znajdować się
po prawej stronie, a po lewej stronie ikona cywilizacji, która atakuje."

RECON (wykonane przez orkiestratora — nie powtarzaj, zweryfikuj i buduj na tym)
Pasek nagłówka bitwy (górne rogi: medalion+bold nazwa+podtytuł) i popup "Wynik bitwy" (werdykt
na środku) to JEDEN i TEN SAM widok — `gra/src/ui/postBattleSummary.ts`, wołany zarówno live
podczas bitwy jak i na jej końcu.

- `buildCommanderCorner()` (`postBattleSummary.ts:94-154`): bold nazwa = `side.label`
  (linia 138, ŹRÓDŁO BŁĘDU). Podtytuł (linie 149-150,
  `civ + ' · ' + (isAtk?'Atakujący':'Obrońca')`) JUŻ POPRAWNY — czyta `side.civLabel`.
- `side.label`/`side.civLabel` (typ `BattleSummarySide`, `battle-summary.ts:29-36`) pochodzą z
  `atkLabel`/`defLabel` (→ `label`) i osobnych pól civ, ustawianych w
  `_buildBattleSummaryData()` (`battleScene.ts:8875-8890`) jako `atkLabel: this._sideDisplayLabel
  ('atk')` / `defLabel: this._sideDisplayLabel('def')`.
- `_sideDisplayLabel(side)` (`battleScene.ts:8841-8851`): custom label (`_attackerSideLabel`/
  `_defenderSideLabel`, dziś puste w tym scenariuszu) → gdy 1 jednostka w rosterze, zwraca
  `snaps[0].typeId`/`u.bu.nazwa` — NAZWĘ TYPU JEDNOSTKI. To JEDYNE źródło błędu — werdykt "X
  wygrywa" (`battle-summary.ts:132-133`) używa tego samego `label`.
- Poprawne dane tożsamości JUŻ ISTNIEJĄ na klasie: `this._attackerCivLabel`/
  `this._defenderCivLabel` (pola `battleScene.ts:2457-2458`, przypisywane z
  `opts.attackerCivLabel`/`opts.defenderCivLabel`, `battleScene.ts:2550-2551`), zasilane przez
  wołających z `ownerDiploLabel(ownerId)` (`main.ts:7854-7887`) — format trzyczłonowy dla miast-
  państw ("Sparta · Grecja · miasto-państwo") JUŻ DZIAŁA przez `resolveOwnerBaseName`/
  `formatEntityDisplayName` (`display-names.ts:225-266,17-24`). Analogiczna, już istniejąca
  funkcja `_civLabelForSide()` (`battleScene.ts:~10928`) robi dokładnie to mapowanie side→civLabel
  — wzorzec do skopiowania.
- **Zmiana `_sideDisplayLabel()` żeby zwracał civLabel (analogicznie do `_civLabelForSide()`)
  zamiast nazwy jednostki naprawia OBA miejsca (bold nazwa + werdykt) JEDNYM fixem w JEDNYM
  pliku (`battleScene.ts`)** — bez dotykania `postBattleSummary.ts`/`battle-summary.ts`.
- **Ikona (GOAL 2) to OSOBNY fix.** Poprawny wzorzec ISTNIEJE w `mkCommanderCard`
  (`battleScene.ts:2880-2970`): portret władcy dla pełnej cywilizacji (`leaderPortraitUrl`,
  linia 2917), `civIconSvg(civIconId,22)` dla miasta-państwa (linie 2932-2935, komentarz
  R-MP-PORTRET: "miasto-państwo NIGDY nie dostaje portretu władcy głównej cywilizacji"),
  `brandIconSvg('chip-death',22)` dla barbarzyńców (linie 2928-2931). Dane wejściowe
  (`_attackerCivIconId`/`_defenderCivIconId`, `_attackerIsCityState`/`_defenderIsCityState`,
  `_attackerIsBarbarian`/`_defenderIsBarbarian`, `_attackerEra`/`_defenderEra`) JUŻ ISTNIEJĄ jako
  pola klasy (`battleScene.ts:2461-2462, 2573-2583`), poprawnie ustawione z opts.
  `postBattleSummary.ts` po prostu ich dziś nie dostaje — `BattleSummarySide` nie ma pól na
  icon/isCityState/isBarbarian/era. Layout (lewo=atakujący, prawo=obrońca, niezależnie kto gra
  kim) JEST JUŻ POPRAWNY strukturalnie (`postBattleSummary.ts:111, 480-481`) — żądanie
  "ikona miasta-państwa po prawej, ikona atakującego po lewej" dotyczy WYŁĄCZNIE TREŚCI ikony,
  nie jej pozycji.
- **Drugorzędne, powiązane znalezisko (GOAL 3, opcjonalne, niska waga):** w
  `openPlayerMapUnitAttackCore` (`main.ts:23553-23564`) civLabel ATAKUJĄCEGO gracza jest
  zahardkodowany jako literał `'Gracz'` (linia 23559), zamiast `ownerDiploLabel(atkUnit.ownerId)`
  — tak jak poprawnie robi to dla obrońcy (`main.ts:23553`). W scenariuszu ze zrzutu (gdzie lewy
  podtytuł poprawnie pokazał "GRECY") ta konkretna ścieżka NIE była użyta — ale to potencjalne
  DRUGIE źródło niespójności "Gracz" vs "Grecy" w innych scenariuszach ataku.

GOAL
1. **Fix główny.** Zmień `_sideDisplayLabel(side)` (`battleScene.ts:8841-8851`) żeby — gdy brak
   custom `_attackerSideLabel`/`_defenderSideLabel` — zwracał `_attackerCivLabel`/
   `_defenderCivLabel` (analogicznie do istniejącego wzorca `_civLabelForSide()`) zamiast nazwy
   typu jednostki (`snaps[0].typeId`/`u.bu.nazwa`). Fallback na nazwę jednostki zostaje WYŁĄCZNIE
   gdy civLabel jest pusty/niedostępny (nie powinno się zdarzać w praktyce, ale zachowaj jako
   ostatnią linię obrony zamiast pustego stringa). Sprawdź czy `custom` (linia 8842) nadal ma
   pierwszeństwo — jeśli `_attackerSideLabel`/`_defenderSideLabel` są jawnie ustawione przez
   jakiegoś wołającego celowo (np. specjalny scenariusz), zachowaj to pierwszeństwo.
2. **Ikony.** Rozszerz `BattleSummarySide`/`BuildBattleSummaryInput` (`battle-summary.ts:29-36`
   i pokrewne) o pola potrzebne do doboru ikony: civIconId, isCityState, isBarbarian, era (nazwij
   wg istniejącej konwencji pliku). Przekaż je z `_buildBattleSummaryData()`
   (`battleScene.ts:8875-8890`) z już istniejących pól klasy (`_attackerCivIconId` itd. — ZERO
   nowego liczenia, tylko przekazanie). W `buildCommanderCorner()` (`postBattleSummary.ts:94-154`,
   linia ~128 `medal.innerHTML = PB_SVG.commander`) zastąp stałą ikonę logiką analogiczną do
   `mkCommanderCard` (portret dla pełnej cywilizacji / `civIconSvg` dla miasta-państwa /
   `brandIconSvg('chip-death')` dla barbarzyńcy / `PB_SVG.commander` jako ostateczny fallback).
3. **Opcjonalne, jeśli czas pozwoli w tej rundzie:** napraw hardkodowany literał `'Gracz'` w
   `openPlayerMapUnitAttackCore` (`main.ts:23553-23559` — sprawdź dokładne linie) na
   `ownerDiploLabel(atkUnit.ownerId)`, analogicznie do już poprawnego `defCivLabel`. Jeśli
   zabraknie czasu/rundy, pomiń i jawnie odnotuj jako pominięte (nie jest to część GOAL 1/2,
   nie blokuje KRYTERIÓW KOŃCA).

KRYTERIA KOŃCA (binarne)
1. Żywy test Chromium: bitwa 1 jednostka vs 1 jednostka, gracz (Grecy) atakuje miasto-państwo
   Korynt — pasek nagłówka pokazuje bold "Grecy" po lewej (nie nazwę jednostki), bold "Korynt ·
   Grecy · miasto-państwo" (lub równoważny format `ownerDiploLabel`) po prawej.
2. Ten sam scenariusz: werdykt w popupie "Wynik bitwy" to "Grecy wygrywa" (lub "Korynt · Grecy ·
   miasto-państwo wygrywa" gdy obrońca wygrywa) — NIE "Wojownik wygrywa".
3. Ikona po lewej (atakujący, gracz/pełna cywilizacja) to portret władcy lub odpowiedni civIcon —
   NIE generyczny `PB_SVG.commander` gdy dane civIconId są dostępne. Ikona po prawej (obrońca,
   miasto-państwo) to `civIconSvg` (symbol kultury), NIE portret władcy głównej cywilizacji ani
   generyczna ikona.
4. Scenariusz z wieloma jednostkami w rosterze (`snaps.length>1`) — zero regresji, civLabel
   nadal poprawny (dziś ta gałąź już nie pokazuje nazwy jednostki, tylko "Skład (N)" — po fixie
   ma pokazywać civLabel zamiast "Skład (N)", chyba że GOAL 1 explicite zachowuje "Skład (N)"
   jako info o liczności — Operator decyduje i uzasadnia w raporcie którą informację priorytetyzować,
   civLabel powinien być widoczny w OBU przypadkach, gdzieś w komponencie).
5. Scenariusz barbarzyńcy jako jedna ze stron — ikona `brandIconSvg('chip-death')`, civLabel
   sensowny (nie "undefined"/puste).
6. `tsc --noEmit` czysty, istniejące testy bitwy (grep `gra/tools/*battle*-test.cjs`,
   `gra/tools/*wojna*-test.cjs` w zakresie post-battle summary) nadal zielone lub świadomie
   zaktualizowane, 5 bramek referencyjnych zielone.

ALLOWLISTA (nic poza tym)
- gra/src/battle/battleScene.ts (GOAL 1, GOAL 2 — przekazanie nowych pól do
  `_buildBattleSummaryData`).
- gra/src/game/battle-summary.ts (GOAL 2 — rozszerzenie typu `BattleSummarySide`/wejścia).
- gra/src/ui/postBattleSummary.ts (GOAL 2 — `buildCommanderCorner`, dobór ikony).
- gra/src/main.ts — WYŁĄCZNIE jeśli GOAL 3 podjęty, WYŁĄCZNIE linie
  `openPlayerMapUnitAttackCore` (~23553-23564), zero innych zmian.
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: gra/src/game/display-names.ts (`ownerDiploLabel`/`resolveOwnerBaseName`
już działają poprawnie, zero zmian), `mkCommanderCard` (`battleScene.ts:2880-2970` — wzorzec do
SKOPIOWANIA/reużycia, nie do edycji), dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json,
playbook.json.

IZOLACJA
worktree /home/user/wt-bitwa-etykieta-tozsamosc-strony, gałąź
autobot/R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona kompilacja to
node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Poprzedni recon (jak i ten dispatch) opiera się na analizie kodu — Operator MUSI zweryfikować
żywo w Chromium (kryteria 1-3, 5) że tekst/ikony faktycznie renderują się jak opisano, nie tylko
że kod "powinien" to robić. Zakaz uznania GOAL 2 (ikony) za spełniony bez faktycznego zrzutu z
żywej gry pokazującego różne ikony dla różnych typów stron (pełna cywilizacja/miasto-państwo/
barbarzyńca) — trzy różne, wizualnie odróżnialne ikony, nie tylko trzy różne nazwy zmiennych
w kodzie.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora.
