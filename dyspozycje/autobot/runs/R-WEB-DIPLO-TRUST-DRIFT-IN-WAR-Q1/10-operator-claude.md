# R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1
GOAL: ustalić, gdzie w tiku tury zaufanie rośnie o 1 w wojnie i przy neutralności; czy zgodne z krokami 1–3 (w wojnie zaufanie 0); druga część: N=5 vs 6 (pomiar, bez zmiany wartości).
BAZA: fbafec4b3 (origin/main), worktree wf_d3497379-580-1 (detach).

## Uwagi dotyczące wejścia

- Dispatch `00-dispatch.md` istnieje tylko na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie na `origin/main`).
- Plik `00-dispatch-DODATEK-claude.md` NIE istnieje ani na `origin/claude/...`, ani na `origin/main`. Operator pracował wyłącznie wg `00-dispatch.md` (GOAL, kryteria a–d, allowlista, zakazy). Luka: brak instrukcji „zadanie tej rundy” z DODATKU — NIE_ZMIERZONO, orkiestrator powinien potwierdzić zakres.
- Brak `gra/node_modules` w worktree: wykonano `npm ci --ignore-scripts` w `gra/` (tylko zależności testowe, bez `build`/`dev`).

## Kryterium (a) — realny tik tury (`tickDiplomacy`), zaufanie startowe 0

Test: `gra/tools/diplo-trust-war-drift-test.cjs` (nowy, w allowliście). Uruchomienie: `node gra/tools/diplo-trust-war-drift-test.cjs` → PASS=3 FAIL=0.

| scenariusz | po t1 | po t3 | po t6 |
|---|---|---|---|
| wojna (status `wojna`, W=undefined) | 0 | 0 | 0 |
| neutralna (status `neutralni`, W=20) | 0.66 | 1.98 | 3.96 |
| pokój (status `pokoj`, W=20) | 0.66 | 1.98 | 3.96 |

Uwaga: to pomiar pojedynczej pary przy W=20 (wartość startowa Normalny) i bez umów/granicy; dryf jest liniowy (W×0,03).

## Kryterium (b) — przyczyna wzrostu 0→1

- Pasywny dryf Wiarygodności: `gra/src/game/diplomacy.ts:1809-1810` — `if (!atWar && ctx.wiarygodnoscSelf !== undefined) dZ += zaufanieDryfOdWiarygodnosci(...)`; wzór w `gra/src/game/diplomacy-credibility.ts:635-642` (clamp(W)×0,03). Dla W=20 daje +0,6/turę → w neutralności zaufanie rośnie (zgodnie z REL-WIARYG-DRIFT-Q1; to założona funkcja, nie błąd).
- W wojnie dryf jest pominięty: `diplomacy.ts:1809` (warunek `!atWar`) oraz `diplomacy.ts:1828` (`applyWiarygodnoscTempoDoDelty` przy `wiarygodnoscSelf` undefined). Ostatecznie `diplomacy.ts:1830-1831` — `if (atWar && dZ > 0) dZ = 0`, a `clampRelationForWar` (`diplomacy.ts` ~1140) ściąga zaufanie wojny do 0. Pomiar: wojna 0/0/0 po 1/3/6 turach.
- Wiring w main: `gra/src/main.ts:42327` ustawia `wiarygodnoscSelf: relStatus === 'wojna' ? undefined : ...`, więc główny tik gracz↔AI nie daje dryfu w wojnie.
- Wniosek: sam tik tury NIE zwiększa zaufania w wojnie. Obserwacja „0→1 w wojnie na żywo” NIE została odtworzona w kodzie tiku — NIE_ZMIERZONO na żywej grze (brak uruchomienia W60 r3).

### Kandydat na źródło obserwacji na żywo (nie potwierdzony, poza allowlistą)

- `gra/src/main.ts:12091` (`applyDiploP7Bonuses` → `setDiploRelation(... { ...rel, zaufanie: Math.min(100, zaufanie + bonus) })`) zapisuje zaufanie BEZ bramki wojny i BEZ `clampRelationForWar`. Bonus P7 (`tradeTrustBonusPerTura`, `diplomacy-tick-war-brake.ts:81-90`) jest dodatni przy nadwyżce ≥1 kroku PN i serii ≥2 tur dostaw. Jeśli dostawy cykliczne trwają w wojnie (`tickCyclicResourceTradeDeals`, `main.ts` ~24570-24667, brak filtra wojny w tej pętli), para w wojnie mogłaby dostać +1 zaufania na turę. NIE_ZMIERZONO: czy umowy cykliczne żyją w wojnie (zależy od anulowania umów przy wypowiedzeniu). Plik jest POZA allowlistą (ZAKAZ: `main.ts`), więc nie zmieniałem go.

## Kryterium (c) — naprawa

Brak zmiany w kodzie allowlisty: nie znaleziono błędu w `tickDiplomacy`. Kandydat z `main.ts:12091` wymaga zgody na zmianę `main.ts` (poza allowlistą) i potwierdzenia na żywo. Mutacja/tsc/bramki: NIE_WYKONANO (brak naprawy). Test probe przechodzi (3/3).

## Kryterium (d) — N=5 vs 6 (pomiar, bez zmiany wartości)

- Pole czytane na żywej ścieżce: `gra/src/main.ts:11876` (`diploBrakeCrisisStep`) podaje `kryzysTurDoWojny: w.n`, gdzie `w.n` = `diploBrakeWarParams(a,b).n` = `hamulecN` z profilu (`gra/src/game/diplomacy-war-peace-profile.ts:143`: `round(bazaN − wagaProgWojny×5)` ograniczone do min/max). Wartość 5 z `gra/data/diplomacy-tick-params.json:6` (`p6.kryzysTurDoWojny`) jest używana tylko jako domyślna w `diploTickP6` i nie jest nadpisywana w ścieżce gry — jest martwa dla gry, żywa tylko dla testów/fallbacku.
- Obowiązująca wartość w grze: `hamulecN` profilu (wg dispatchu 6; NIE_ZMIERZONO liczbowo w tym przebiegu — brak uruchomienia profilu z danymi pary).
- Off-by-one: licznik `advanceCrisisCounter` (`diplomacy-tick-war-brake.ts:106-117`) zwiększa się o 1 każdą turę z zaufaniem ≤ progu i wojnę wyzwala przy `counter >= N`, czyli po N kolejnych turach zerowego zaufania (nie N+1). Nie stwierdzam błędu liczenia.
- Rekomendacja: zostawić N zgodnie z profilem (6) lub uporządkować martwe pole `p6.kryzysTurDoWojny=5` w JSON — ZMIANA N = decyzja właściciela (DECISION_REQUIRED). Uwaga: pliki `gra/data/*.json` są zakazane dla tego tematu (W75 edytuje opisy równolegle), więc nie zmieniałem.

## Bramki

- `tsc`, 5 bramek, ai-test, diplomacy-test, diplo-weariness-*, diplo-war-peace-*: NIE_WYKONANO (brak zmiany kodu produkcyjnego; brak regresji do zmierzenia).

## ZMIANY/COMMIT

- Dodany: `gra/tools/diplo-trust-war-drift-test.cjs` (test pomiarowy, PASS 3/0).
- Dodany: `dyspozycje/autobot/runs/R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1/10-operator-claude.md` (ten raport).
- Lokalnie (nie w commicie): `gra/node_modules` (npm ci --ignore-scripts).

## TESTY

- `node gra/tools/diplo-trust-war-drift-test.cjs` → PASS=3 FAIL=0 (tabela powyżej).

## BLOKADY

1. Brak DODATKU (zadanie tej rundy) w repo — potwierdzenie zakresu od orkiestratora.
2. Źródło „0→1 w wojnie na żywo” nie jest potwierdzone w tiku; kandydat `main.ts:12091` poza allowlistą.
3. N (5 vs 6): wartość żywa = profil (6), decyzja właściciela o ujednoliceniu.

## RUNDY

1/5 — ostatni werdykt: brak (Operator). Decyzja wymagana: patrz NASTĘPNY KROK.

## NASTĘPNY KROK

DECISION_REQUIRED dla orkiestratora:
(1) zgoda na zmianę `gra/src/main.ts:12091` (bramka wojny dla bonusu P7 lub `clampRelationForWar`) + test z mutacją — jeśli cykliczne dostawy działają w wojnie (do potwierdzenia na żywej ścieżce);
(2) decyzja właściciela: N=6 (profil, żywe) vs 5 (martwe pole JSON) — rekomendacja: zostawić 6 jako obowiązujące, usunąć/oznaczyć martwe pole w osobnym temacie.

DEPLOY/PUSH: NIE WYKONANO
