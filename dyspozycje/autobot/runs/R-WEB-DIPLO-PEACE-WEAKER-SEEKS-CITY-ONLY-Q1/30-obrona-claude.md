# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora rundy 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1
GOAL: rozejm i pokój wg siły militarnej: słabsza strona szuka rozejmu/pokoju, silniejsza go odrzuca, opór silniejszej przełamuje wyłącznie miasto (cena PN jak dotąd); złoto i surowce NIE są słodzikiem (D2). Dotyczy gracza i AI.
BAZA: e26d99f8140d0857a5e7fe1909b0d52952e7d41c (kandydat startowy r3). Kod src/ NIEZMIENIONY w tej rundzie; zmiany tylko w narzędziach testowych.
RUNDY: 3/5 (obrona r3; ostatni werdykt Evaluatora: PASS-WITH-NOTES, zarzut 1 NAPRAW; raport 20-evaluator-claude.md, commit a9837108e na gałęzi eval-r3-claude)
ZMIANY-COMMIT: SHA podany w polu `sha` odpowiedzi (commit obrony r3 na gałęzi roboczej worktree-wf_07956a4e-69a-3).

## Odpowiedzi na zarzuty

| nr | zarzut | werdykt | dowód / co zrobiono |
|---|---|---|---|
| 1 | brak dowodu behawioralnego okablowania sila/armiaPkt w main.ts (regexy sprawdzały tylko `id:`; ręczna zamiana `sila`↔`armiaPkt` / stron nie czerwieniła testu) | PRZYJMUJĘ (poprawka + dowód + commit) | `tools/diplo-peace-stance-wiring-test.cjs` przepisany: (s2a–s2d) źródła danych stron (`resp`/`prop`, `wSide`/`lSide`) z dokładną kolejnością argumentów `diploMilitarySideOf`; (s3a–s3c) DOSŁOWNE wywołania `peaceStanceOf` po normalizacji białych znaków i usunięciu komentarzy `//` — każde pole `sila`/`armiaPkt` musi pochodzić z właściwego obiektu (ta sama strona, to samo pole), kolejność (self, partner) jak w (s2). Test porównuje całą treść wywołania, nie sam `id:`. Dodane mutacje M14 (zamiana sila↔armiaPkt strony zwycięzcy w gateVerdict, main.ts), M15 (zamiana sila↔armiaPkt respondenta w diploProposalWarState, main.ts), M16 (zamiana sila↔armiaPkt partnera w decideAIDiplomacy, ai.ts) w `tools/diplo-peace-gate-mutation-run.cjs`. **Surowe wyniki** (wynik runnera, każda mutacja osobno): M13 `ZABITY ... diplo-peace-stance-wiring-test.cjs exit=1 FAIL=1` / `MUTACJE BRAMEK: 1/1 zabite`; M14 `MUTACJE BRAMEK: 1/1 zabite`; M15 `MUTACJE BRAMEK: 1/1 zabite`; M16 `MUTACJE BRAMEK: 1/1 zabite`. Wynik zdrowego testu (bez mutacji): `diplo-peace-stance-wiring-test: 10 pass / 0 fail`, exit 0. Pliki src po mutacjach przywrócone (`git status`: tylko dwa pliki narzędzi zmienione). |
| 2 | UWAGA: punkt 3 dispatchu (usunięcie martwego mapowania `oferuj_trybut_za_pokoj`) niewykonany | ODRZUCAM (dowód: punkt 3 dispatchu wykonuje się tylko, gdy żaden test na nim nie polega; polegają) | Odwołania w testach i w kodzie wykonywanym przez testy: `tools/ai-war-nearest-city-peace-2t-test.cjs:381` (`wired('main.ts: rejestracja prosby AI->AI o pokoj', "cmd.type === 'zaproponuj_pokoj' \|\| cmd.type === 'oferuj_trybut_za_pokoj'")`); `tools/city-state-cluster-diff-test.cjs:231` i `:249` (asercje o typie `oferuj_trybut_za_pokoj`); `src/game/diplomacy-layers.ts:19` i `:360` (lista komend); typ `AIDiplomacyCommand` w `src/game/ai.ts:6602`. Zgodnie z dispatchem („jeśli test polega — zostaw i opisz") mapowanie zostaje. Rekomendacja orkiestratora: osobny temat sprzątający (poza tą rundą), który przepisze te asercje i usunie martwe wpisy. |
| 3 | UWAGA: test zgodności tie-breaku (a9–a11) sprawdza funkcję `peaceStanceOf`, nie realne wywołania w ai.ts i main.ts | ODRZUCAM w części dotyczącej „realnych wywołań”; wzmocnienie wywołań PRZYJĘTE w ramach zarzutu 1 | Tie-break jest w jednym miejscu (`peaceMilitaryPosition` → `compareMilitaryStrength`, `diplomacy-military-strength.ts`); oba miejsca wywołań (main.ts ×2, ai.ts ×1) nie zawierają żadnej logiki remisu, tylko przekazują id i siłę, co teraz sprawdza test dosłowny (s3a–s3c). Dowód: zmutowane wywołania M13–M16 zabijają test wiringu; mutacja samego tie-breaku (M12, odwrócenie stron w `peaceStanceOf`) zabija `diplo-peace-weaker-seeks-city-only-test.cjs` — wynik M12 z zarzutu Evaluatora (13/13), NIE_PONOWIONO w tej rundzie. Test zgodności id (a9–a11) pozostaje na poziomie funkcji — realnego wywołania w ai.ts/main.ts nie da się wykonać w harnessie cjs (main.ts to aplikacja DOM), więc pokrycie wywołań jest strukturalne, nie behawioralne. |

## Dowody bramek (wykonane w tej rundzie)

- `node tools/diplo-peace-stance-wiring-test.cjs` → `10 pass / 0 fail`, exit 0.
- `node tools/diplo-peace-weaker-seeks-city-only-test.cjs` → `32 pass / 0 fail`, exit 0 (po `npm ci --ignore-scripts` w `gra/`; bez `npm run build`/`dev`).
- Mutacje M13, M14, M15, M16 — każda `1/1 zabite` (surowe wyniki wyżej).
- Pozostałe bramki z dispatchu (tsc, pięć bramek referencyjnych, testy tematu, sim 19/3) NIE były ponownie uruchamiane w tej rundzie: kod `src/` nie zmienił się względem e26d99f81, który Evaluator zweryfikował (tsc 0; 213/213, 20/0, 33/0, 21/21, 6/6; M1–M13 13/13). NIE_ZMIERZONO w tej rundzie: pełny przebieg M1–M12 po zmianie w narzędziach (zmiana dotyczy tylko runnera przez dopisanie M14–M16 i przepisanie wiringu).

## Zmiany w tej rundzie (pliki)

- `gra/tools/diplo-peace-stance-wiring-test.cjs` — przepisany: źródła danych stron (s2a–s2d), dosłowne wywołania `peaceStanceOf` (s3a–s3c), s1/s4 bez zmian.
- `gra/tools/diplo-peace-gate-mutation-run.cjs` — dopisane M14, M15, M16 (test: wiring).
- `dyspozycje/autobot/runs/R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1/30-obrona-claude.md` — ten raport (runda 3).
- Nie zmieniono: `gra/src/**` (w tym `main.ts`, `ai.ts`, `diplomacy-military-strength.ts`), `diplomacy.json`, pozostałe testy. Punkt 3 dispatchu: ODRZUCONY (patrz tabela, zarzut 2).

## Założenia

- Mutacje M14–M16 zmieniają sila↔armiaPkt (typy liczbowe, kompilują się); runner nie uruchamia tsc, więc mutanty są semantyczne, nie składniowe.
- Test wiringu jest strukturalny (czyta źródło). Zgodnie z lekcją W45/W47 mutacje (nie regex) są dowodem, że test czerwieni się przy realnej zmianie kodu.

## Stan repo

- `git status` po pracy: tylko dwa pliki `gra/tools/*.cjs` oraz raport. `git diff --check`: czysto.
- `gra/node_modules` zainstalowane (npm ci --ignore-scripts) do uruchomienia testów; orkiestrator może je usunąć w sprzątaniu.
- Nie pushowano na `main`, nie integrowano, nie deployowano.

## BLOKADY

- Brak blokad technicznych w zakresie tej rundy.
- Dług (poza zakresem r3, do decyzji orkiestratora): martwe mapowanie `oferuj_trybut_za_pokoj` (patrz tabela, zarzut 2); `diplo-peace-stance-wiring-test` nie wykonuje realnego wywołania main.ts (DOM).
- NIE_ZMIERZONO: allowlista oryginalnego dispatchu (00-dispatch.md nie istnieje na origin/main — zgodnie z Evaluatorem); zachowanie na żywo w przeglądarce.

## Uwagi dla orkiestratora

- Dispatch zakazuje `git add -A`; commit obejmuje tylko trzy wymienione ścieżki (dwa pliki tools + raport). Nie są to „tylko ten plik”, bo poprawka zarzutu 1 wymaga zmian w narzędziach — stąd commit trzech ścieżek.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator (runda 4) — weryfikacja M13–M16 i wiringu na tym SHA; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
