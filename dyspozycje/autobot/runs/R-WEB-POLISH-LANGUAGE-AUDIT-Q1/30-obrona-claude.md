# Obrona (runda 3) — odpowiedzi na zarzuty Evaluatora

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (TEKSTY / PROCES JAKOŚCI)
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
GOAL: Domknąć zarzuty `20-evaluator` z 2026-11-12 (kandydat 8e790adae) i wykonać decyzję właściciela „popraw wszystkie pozycje audytu językowego, bez pytania o każdą”, bez zmiany znaczenia, kluczy, ID i wartości liczbowych.
BAZA: 8e790adaed109e8c071011dd3a0e0a3a8f594a7b (kandydat rundy 3, detached w worktree).
ZMIANY/COMMIT: patrz commit na gałęzi detached (`git rev-parse HEAD` po commicie); commit obejmuje tylko poniższą allowlistę. Bez push.

## Odpowiedzi na zarzuty

### Zarzut 1 — rozmiary mapy „Malenki” / „Super Huge” — PRZYJMUJĘ
- Problem: klucze („Malenki”, „Super Huge”) są jednocześnie etykietami w `gra/data/ui-params.json` i kluczami w `e-start-params`, `generator.ts`, `normMenuLabel`, zapisach i testach (`live-verify-*`, `map-capacity-matrix`). Zmiana etykiety w JSON złamałaby wyszukiwania i zapisy.
- Rozwiązanie: rozdzielenie klucza od etykiety wyświetlanej. Klucze bez zmian; nowy moduł `gra/src/util/map-size-display.ts` (`mapSizeDisplayLabel`) mapuje tylko tekst dla gracza.
  - `Malenki` → `Maleńki`
  - `Super Huge` → `Bardzo ogromny`
  - ZAŁOŻENIE (luka w decyzji właściciela, której nazwy docelowe nie podano): powyższe polskie nazwy. Do potwierdzenia przez ABC.
- Zastosowane w: `ui/mainMenu.ts` (wartość ustawienia), `ui/newGameFlow.ts` (dwa miejsca `sv.textContent`), `ui/mapLoadingOverlay.ts` (`sizePart`), `ui/perfTestPanel.ts` (teksty podpowiedzi, dodatkowo „do Ogromny” → „Ogromny”, „wątki/wątków CPU” → `pluralPl`).
- Docs: `docs/PORADNIK-GRACZA/01-pierwsze-kroki.md:92` (`Maleńki`), `docs/PORADNIK-GRACZA/13-cywilizacje.md:49` (`Ogromny / Bardzo ogromny`), regeneracja `gra/src/data/wikiBundle.json` przez `gra/tools/bundle-wiki-for-game.cjs` (diff: 1 linia, 1 plik; powtórne uruchomienie daje ten sam wynik).
- Nie zmieniono: `ui-params.json`, `e-start-params.json`, `generator.ts`, `normMenuLabel`, zapisy, `live-verify-*` (klucze).

### Zarzut 2 — „szt./turę”, zapis „zuzycie/ponizej”, odmiana „przez N tur” — PRZYJMUJĘ
- `szt./turę` → `sztuk na turę` w `game/ai.ts` (2 miejsca), `game/diplomacy-proposals.ts` (2 miejsca), `game/diplomacy-sensible-deals.ts` (1 miejsce, + „zapas N szt.” → „zapas N sztuk”). Zgodne z `main.ts` („sztuk na turę”).
- Diakrytyki: `zuzycie` → `zużycie`, `ponizej` → `poniżej` (`diplomacy-sensible-deals.ts:167`).
- Odmiana: `przez ${n} tur` → `przez ${formatTurCountAcc(n)}` (3 miejsca: `diplomacy-proposals.ts:1977,1980`, `ai.ts:7226`); `na ${n} tur` → `formatTurCountAcc` (`diplomacy-proposals.ts:505,1600,1957,2348`). `formatTurCountAcc` z `gra/src/ui/formatPl.ts` (już testowany w strażniku: 1 turę / 3 tury / 15 tur). Dodany import w `ai.ts` i `diplomacy-proposals.ts`.
- Nie zmieniono (ODRZUCAM jako poprawkę pewną, do ABC): `diplomacy-sensible-deals.ts:167` „(poniżej N tur)” — dla N=1 odmiana wymagałaby „tury/turę”, a `deficitTurns` nie jest tu sprawdzane pod kątem wartości 1; `diplomacy-proposals.ts:1873` „≥ N tur” (dopełniacz) i „Umowa handlowa … co turę”. Tekst dla gracza, ale zmiana wymaga decyzji o zakresie wartości.

### Zarzut 3 — strażnik nie chroni `saveLoadDialog` (`j. /`) — PRZYJMUJĘ
- Przyczyna: wpis trafiał do listy `BAD` (pliki danych/docs), a nie do `UI_BAD` skanowanej po `gra/src/ui`.
- Naprawa w `gra/tools/polish-language-audit-q1-guard-test.cjs`: wpis przeniesiony do `UI_BAD` z próbką mutacyjną; dodano zakres `GAME_TEXT_FILES` (`ai.ts`, `diplomacy-proposals.ts`, `diplomacy-sensible-deals.ts`) do skanu literałów; dodano wpisy `zuzycie netto`, `(ponizej `, `Super Huge`, `Malenki` (z próbkami).
- Dowód mutacyjny (wykonany na działającym drzewie, po każdej mutacji przywrócono plik):
  - `saveLoadDialog.ts`: `formatJednostkiCount(f.unitsCount)` → `${f.unitsCount} j.` → `FAIL gra/src/ui/saveLoadDialog.ts j. -> formatJednostkiCount (zapis/wczytaj)` (wynik: `6751 ok, 1 fail`).
  - `diplomacy-proposals.ts`: `sztuk na turę` → `szt./turę` (replace_all) → `FAIL gra/src/game/diplomacy-proposals.ts szt./turę -> sztuk na turę`.
  - `perfTestPanel.ts`: `Mapa „Bardzo ogromny”` → `Mapa Super Huge` → `FAIL gra/src/ui/perfTestPanel.ts Super Huge -> etykieta „Bardzo ogromny”`.
  - Wszystkie mutacje przywrócone; po przywróceniu wynik bazowy: `6752 ok, 0 fail`.

## Zakres zmian (allowlista rozszerzona względem kandydata — uzasadnienie: decyzja właściciela wymaga zmiany etykiet w UI i dokumentacji)

Zmienione pliki (15 + 1 nowy):
- `gra/src/game/ai.ts`, `gra/src/game/diplomacy-proposals.ts`, `gra/src/game/diplomacy-sensible-deals.ts`
- `gra/src/ui/mainMenu.ts`, `gra/src/ui/newGameFlow.ts`, `gra/src/ui/mapLoadingOverlay.ts`, `gra/src/ui/perfTestPanel.ts`, `gra/src/ui/saveLoadDialog.ts`
- `gra/src/util/map-size-display.ts` (nowy)
- `gra/tools/polish-language-audit-q1-guard-test.cjs`
- `docs/PORADNIK-GRACZA/01-pierwsze-kroki.md`, `docs/PORADNIK-GRACZA/13-cywilizacje.md`
- `gra/src/data/wikiBundle.json` (regeneracja generatorem)

Nie zmieniono: wartości liczbowe, klucze, ID, nazwy funkcji, `ui-params.json`, `e-start-params.json`, `generator.ts`, `entityCards/**`, `resourceAmountChip.ts`, `administratorIcon.ts`, `buildModeHud.ts`, `gra/data/**`, `dyspozycje/analizy/**`.

## TESTY (surowe wyniki)

- `cd gra && npx tsc --noEmit -p .` → exit 0, bez komunikatów.
- `node gra/tools/polish-language-audit-q1-guard-test.cjs` → `polish-language-audit-q1-guard (runda 2, UI): 4706 ok, 0 fail` / `polish-language-audit-q1-guard: 6752 ok, 0 fail`.
- `node gra/tools/ids-leak-audit-test.cjs` → `WYNIK: 1648 ok, 0 FAIL`.
- `node gra/tools/wonder-text-no-raw-ids-test.cjs` → `WYNIK: 132 ok, 0 FAIL`.
- `node gra/tools/terminology-trade-vs-tax-test.cjs` → `798 pass, 1 fail` (`FAIL: [P] Mennica (karta odkrycia)`) — identyczne z bazą (dług bazowy, nie regresja).
- `node gra/tools/city-administrator-test.cjs` → `119 passed, 0 failed`.
- `node gra/tools/hud-gross-net-rest-test.cjs` → `OK: hud-gross-net-rest-test (808 ok, 0 fail)`.
- `git diff --check` → exit 0.
- Mutacje strażnika: patrz zarzut 3.
- NIE_ZMIERZONO: 5 bramek referencyjnych (uruchamiane przez Final Control wg dispatchu) — nie uruchamiałem w tej rundzie; `npm run build`/`dev` zakazane, nie wykonano.
- NIE_ZMIERZONO: weryfikacja w przeglądarce (zmiana etykiety menu i podpowiedzi perf) — tekst zmieniony w kodzie, bez zrzutu ekranu.

## BLOKADY
- Brak blokad technicznych.
- Do ABC właściciela: (a) potwierdzenie nazw „Maleńki” / „Bardzo ogromny” (ZAŁOŻENIE); (b) „(poniżej N tur)” w `diplomacy-sensible-deals.ts:167` i „≥ N tur” w `diplomacy-proposals.ts:1873` — odmiana dla N=1 i dopełniacz.
- Zapisy z zapisanym starym napisem rozmiaru mapy: klucz zapisu nie zmienia się, więc wczytywanie nie jest zagrożone.

## RUNDY
1/5 (runda obrony 3 tematu R-WEB-POLISH-LANGUAGE-AUDIT-Q1; Operator/Obrona Haiku).

## NASTĘPNY KROK
Evaluator (Sonnet) — weryfikacja zarzutów 1–3 w tym commicie; następnie Final Control (Sonnet) z 5 bramkami referencyjnymi.

## DEPLOY/PUSH: NIE WYKONANO
