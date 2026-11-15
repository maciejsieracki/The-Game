# R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1
GOAL: usunąć martwe pole `p6.kryzysTurDoWojny=5` z `gra/data/diplomacy-tick-params.json` (wraz z `_uwagaKryzysTurDoWojny`), tak aby N hamulca wojny pochodziło wyłącznie z profilu wojny pary; opisać w Civpedii zaufanie 0 w wojnie i licznik kryzysu bez stałego N = 6; zachować zachowanie gry bez zmian.
BAZA: 03f39f0ad3ba3fc71837344c5402f80bded46c47 (origin/main), worktree `wf_6a655b4a-db4-1`, detached.

## ZMIANY (allowlista)

| Plik | Zmiana |
|---|---|
| `gra/data/diplomacy-tick-params.json` | usunięte 2 linie: `p6.kryzysTurDoWojny` i `p6._uwagaKryzysTurDoWojny` (wyjątek allowlisty) |
| `gra/src/game/diplomacy-tick-war-brake.ts` | tylko komentarz przy `WarBrakeP6Params.kryzysTurDoWojny`: N podawane jawnie z profilu wojny, nie z JSON. Typ i logika bez zmian |
| `gra/tools/diplo-tick-war-brake-unit-test.cjs` | `p6 = { ...PARAMS.p6, kryzysTurDoWojny: 5 }` (jawne N=5, asercje bez zmian) |
| `gra/tools/diplo-tick-war-brake-mutation-test.cjs` | `P6 = { ...PARAMS.p6, kryzysTurDoWojny: 5 }` (j.w.) |
| `gra/tools/diplo-trust-war-drift-test.cjs` | tylko komentarz nagłówka |
| `gra/tools/json-descriptions-sync-test.cjs` | c9: sprawdza brak `kryzysTurDoWojny` i `_uwaga` w p6. c10: zakres N czytany z Civpedii (`od 3 do 7 tur`) zamiast z usuniętego `_uwagi`. a1: jedyny dozwolony ubytek względem bazy f196422ef to `p6.kryzysTurDoWojny` (usunięty celowo) |
| `gra/tools/diplo-trust-war-n6-cleanup-test.cjs` | NOWY test (13 asercji), patrz niżej |
| `docs/encyklopedia/pojecia/wypowiedzenie-wojny.md` | źródło Civpedii: dopisane „W wojnie Zaufanie pary tkwi na zerze, licznik kryzysu nie liczy”; usunięte stałe „N = 6 turach” i „6 dla bazowego”; zaktualizowana uwaga o usuniętym polu i rozbieżność oznaczona jako usunięta |
| `gra/src/data/wikiBundle.json` | wygenerowany ISTNIEJĄCYM narzędziem `node gra/tools/bundle-wiki-for-game.cjs` (nie ręcznie). Zmiana 1 linii (plik jednolinijkowy), `generated` bez zmian |

Uwaga do premisy: źródłem Civpedii nie są `Dyplomacja/*.md` (to dokumentacja projektowa), tylko `docs/encyklopedia/` (czyta je `bundle-wiki-for-game.cjs`, ENCY_DIR). Edytowano więc `docs/encyklopedia/pojecia/wypowiedzenie-wojny.md`. Hasło to wcześniej już opisywało N jako zależne od profilu; poprawiono tylko przykład i historię.

Zachowanie gry: `main.ts` (l. 12183, `{ ...diploTickP6, kryzysTurDoWojny: w.n }`) NIE zmieniony. Przed zmianą pole z JSON było i tak nadpisywane przez `w.n`, więc wartość efektywna N nie zmienia się (N z profilu: 4–7; bez wiersza macierzy 6). `main.ts` nie został zmieniony wcale; allowlista dopuszczała tylko miejsce wywołania, a ono już było poprawne.

Korekta premisy z dispatchu (potwierdzona): N nie jest stałe 6. Zależy od profilu wojny pary (`clamp(round(8 − 0,5·dip_prog_wojny), 3, 7)`, bez wiersza macierzy = 6). Civpedia podaje zakres „od 3 do 7 tur”, a nie stałą.

## TESTY

Bramki referencyjne (uruchomione na zmienionym drzewie, `gra/`):

| Bramka | Wynik |
|---|---|
| `node ./node_modules/typescript/bin/tsc --noEmit` | exit 0 (przed zmianą także exit 0) |
| `node tools/logic-test.cjs` | LOGIC OK (213/213) |
| `node tools/tech-tree-test.cjs` | tech-tree-test: 20 pass, 0 fail |
| `node tools/research-test.cjs` | ALL GREEN |
| `node tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `node tools/combat-test.cjs` | All sanity checks passed. |
| `node tools/unit-power-test.cjs` | 6 pass, 0 fail |

Testy dotknięte zmianą:

| Test | Baza (przed) | Po zmianie |
|---|---|---|
| diplo-tick-war-brake-unit-test | 69/0 | 69/0 |
| diplo-tick-war-brake-mutation-test | 17/0 (baza + 16 mutantów) | 17/0 |
| diplo-tick-war-brake-test | 51/0 | 51/0 |
| diplo-trust-war-drift-test | PASS=14 FAIL=0 | PASS=14 FAIL=0 |
| diplo-war-declare-zero-trust-test | 43 OK / 0 FAIL | 43 OK / 0 FAIL |
| diplo-war-peace-main-guard-test | 35/0 | 35/0 |
| json-descriptions-sync-test | 19/0 | 19/0 (po poprawce a1, patrz niżej) |
| diplo-civpedia-values-test | — | PASS: 129 sprawdzeń |
| polish-language-audit-q1-guard-test | — | 7285 ok, 0 fail |
| diplomacy-locks-test | — | 88 passed, 0 failed |
| diplo-trust-war-n6-cleanup-test (NOWY) | — | 13/0 |

Dowód mutacyjny / czerwony na bazie (NOWY test uruchomiony na kopii `git archive 03f39f0ad` z tym samym `node_modules`):
`diplo-trust-war-n6-cleanup-test: 6 pass / 7 fail` — FAIL 1a, 1b (pole w JSON), 3a, 3b, 3d, 3e (Civpedia: brak „tkwi na zerze”, obecne „N = 6”/„6 tur”), 4a (bundle). Asercje zachowania (2a, 2b: wojna w 4. i 7. turze dla N z profilu) przechodzą na obu wersjach — to celowe, bo potwierdzają, że zachowanie się nie zmieniło.

Pierwsza próba `json-descriptions-sync-test` dała 18/1: a1 porównuje z bazą f196422ef, która zawiera usunięte pole. Poprawka: wyjątek tylko dla `p6.kryzysTurDoWojny`, reszta wartości nadal musi być identyczna. Po poprawce 19/0.

NIE_ZMIERZONO: pełna regresja `gra/tools/*` (poza wymienionymi) i testy wizualne (zmiana nie dotyka UI; tekst Civpedii czytany przez bundle został sprawdzony testami 4a/4b i polish-language-audit, nie w przeglądarce).

## BLOKADY

Brak.

## RUNDY

1/5 (ostatni werdykt: brak — pierwsza runda Operatora).

## NASTĘPNY KROK

Evaluator (Sonnet) i Final Control (Sonnet) — weryfikacja diffu względem allowlisty, dowodu czerwieni na bazie (mirror: `scratchpad/base`) i zachowania N.

## UWAGI-DLA-ORKIESTRATORA

- Rust: `rust-port` nie odwołuje się do `kryzysTurDoWojny` (grep: 0 trafień), więc nie ma długu REPIN dla tego pola.
- `gra/node_modules` zainstalowane przez `npm ci` w worktree (gitignored, do sprzątania po FC, jak zwykle). Nie uruchamiano `npm run build/dev`.
- Lokalny mirror bazy do dowodu czerwieni: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/base` (poza repo, do usunięcia po FC).
- W repozytorium widoczny jest `stash@{0}: civ-r3-tmp` z innej sesji. Nie dotykano go (zgodnie z zasadą współdzielonego stosu).
- Pliki dispatchu (`00-dispatch.md`, `00-dispatch-DODATEK-claude.md`) są w tym worktree (commit 03f39f0), natomiast `origin/main` nie ma pliku `00-dispatch.md` w tej ścieżce (`git show origin/main:...` → brak). Treść DODATKU zgodna z dispatchem.

DEPLOY/PUSH: NIE WYKONANO

## SHA

Commit z kodem i raportem: patrz pole `sha` w StructuredOutput (commit po `git commit` tego pliku).
