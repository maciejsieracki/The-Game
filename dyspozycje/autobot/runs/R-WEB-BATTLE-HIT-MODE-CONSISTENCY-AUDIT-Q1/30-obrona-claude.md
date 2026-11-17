# 30-obrona-claude — R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1 (obrona r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar i narzędzia, bez zmian reguł i bez zmian w `gra/src`)
TEMAT: R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1
GOAL: dowód liczbowy i kodowy, że (1) szanse trafienia nie zostały usunięte, tylko działają w trybie „losowe”, (2) wszystkie ścieżki walki czytają ten sam tryb, (3) siła łuczników vs Wojowników w obu trybach (20 vs 20).
BAZA: 3d4044c04bb514f844a588342217525309304340 (kandydat Evaluatora = raport BLOCK Operatora; dispatch wzięty z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`).

## Odpowiedzi na zarzuty Evaluatora (69c6abfb)

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Brak `gra/tools/hit-mode-archers-vs-warrior-sim.cjs` | PRZYJMUJĘ | Plik dodany (commit obrony). Uruchomienie: `node tools/hit-mode-archers-vs-warrior-sim.cjs --seeds 30` (z `gra/`). Wynik w sekcji TESTY. |
| 2 | Brak tabeli audytu ścieżek i listy miejsc bez `isCertainHitMode()` | PRZYJMUJĘ | Tabela poniżej. Jedna rozbieżność (`siege.ts`) wypisana jawnie. |
| 3 | Brak testu strażnika i dowodu mutacyjnego | PRZYJMUJĘ | `gra/tools/hit-mode-consistency-test.cjs`: 8 PASS / 0 FAIL na czystym kodzie; mutacja `certain-off` daje 7 PASS / 1 FAIL, exit 1 (RED). Źródło nie zmienione (mutacja w bundlu esbuild). |
| 4 | Brak odpowiedzi liczbowej (straty, % wygranych, rundy, „24 obrażeń/salwę”) | PRZYJMUJĘ (liczby) / ODRZUCAM (liczba „24”) | Liczby w sekcji „Odpowiedź liczbowa”. Liczba „24 obrażeń na salwę” nie występuje w pomiarze: zmierzone 4 obrażenia na jeden strzał łucznika. Wartość „24” nie ma źródła w kodzie ani w logu silnika, więc nie została potwierdzona. |
| 5 | BLOCK Operatora oparty na błędnej diagnozie: 00-dispatch.md rzekomo nie istnieje | PRZYJMUJĘ dla dispatchu / ODRZUCAM dla DODATKU | `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1/00-dispatch.md` zwraca pełny dispatch (przeczytany, to on jest podstawą tego raportu). Plik `00-dispatch-DODATEK-claude.md` NIE istnieje w żadnym z pobranych refów: `git log --all -- <ścieżka DODATEK>` zwraca pusto. Zadanie tej rundy wzięto z dispatchu i z listy zarzutów. |

## Audyt ścieżek trafienia (src, tylko odczyt)

Legenda: pewne = `isCertainHitMode() === true`, losowe = rzut `rng()*100` względem `hitChanceTw`.

| Plik:linia | Co robi w „pewne” | Co robi w „losowe” | Status |
|---|---|---|---|
| `src/game/hit-mode.ts:18` | — | `let activeHitMode: HitMode = 'losowe'` (stan domyślny) | OK |
| `src/game/hit-mode.ts:16-17` | `normalizeHitMode`: `'pewne'` → `'pewne'`, reszta → `'losowe'` | j.w. | OK |
| `src/game/hit-mode.ts:33` | `isCertainHitMode()` = `activeHitMode === 'pewne'` (jedyne źródło prawdy) | false | OK |
| `src/game/combat.ts:6` | import `isCertainHitMode` | — | OK |
| `src/game/combat.ts:892` | `certainHits = isCertainHitMode()` raz na walkę | j.w. | OK |
| `src/game/combat.ts:1038-1042` | strzał dystansowy atakującego: `hitPct=100`, `roll=0` | `hitChanceTw(rangedShotAccuracy(...)*terrRiverMult, ...)` + `rng()*100` | OK |
| `src/game/combat.ts:1059-1060` | strzał dystansowy obrońcy: `hitPct=100`, `roll=0` | `hitChanceTw(rangedShotAccuracy(defMelee0,defMissile0), atkObrona0)` + `rng()` | OK |
| `src/game/combat.ts:1152-1153` | cios wręcz atakującego (szarża/runda): `100`, `0` | `hitChanceTw(roundAtkMelee, defFinalObrona, chargeHitBonus)` + `rng()` | OK |
| `src/game/combat.ts:1174-1175` | cios wręcz obrońcy: `100`, `0` | `hitChanceTw(roundDefMelee, roundAtkObrona)` + `rng()` | OK |
| `src/game/combat.ts:441-447` | — (funkcja czysta, bez trybu) | `clamp(tw_v3.hit_base + atk − def + bonus, hit_min, hit_max)` | OK (wywoływana tylko w gałęzi losowej) |
| `src/game/combat.ts:500` | alias `hitChance` → `hitChanceTw` | — | OK (brak wywołań z trybem) |
| `src/battle/battleScene.ts:9535-9537` | `certainHit = isCertainHitMode()`; `hitPct=100`; `roll=0` | `hitChanceTw(ranged ? atkShootAcc : atkMelee, defFinalObrona, chargeHitBonus)` + `_combatRng()*100` | OK (jedyny rzut sceny; obejmuje dystans i wręcz) |
| `src/battle/battleScene.ts:70` | import `isCertainHitMode` | — | OK |
| `src/game/auto-battle-power.ts:184-185` | brak upsetu (`ratio < UPSET_R_THRESHOLD && !isCertainHitMode()` = false) | upset przy `rng() < UPSET_CHANCE` | OK |
| `src/game/auto-battle-power.ts:6` | import `isCertainHitMode` | — | OK |
| `src/game/siege.ts:729-730` | **BRAK sprawdzenia trybu**: `atkHit = hitChanceTw(...)`, `atkRoll = rng()*100` | j.w. | **ROZBIEŻNOŚĆ** (patrz niżej) |
| `src/game/siege.ts:749-750` | **BRAK sprawdzenia trybu**: `defHit = hitChanceTw(...)`, `defRoll = rng()*100` | j.w. | **ROZBIEŻNOŚĆ** (patrz niżej) |
| `src/render/scene.ts` | brak odniesień do trybu, brak rzutu trafień (grep `hitChance`, `isCertainHitMode`, `hit-mode`: 0 trafień) | — | OK (nie liczy trafień). Trafienia w `scene.ts:370` to raycast na instancji, bez związku z walką |
| `src/main.ts:448` | import `normalizeHitMode, setActiveHitMode` | — | OK |
| `src/main.ts:28716` | hak testowy `__civSetHitMode = setActiveHitMode` tylko w trybie testowym | — | OK |
| `src/main.ts:47690` | nowa gra: `setActiveHitMode(normalizeHitMode(params.advanced?.hitMode))` | — | OK |
| `src/main.ts:49583-49584` | wczytanie zapisu: `normalizeHitMode(saved.meta?.newGameParams…advanced?.hitMode)`; brak pola = `losowe` (migracja starych zapisów) | — | OK |
| `src/ui/newGameFlow.ts:272` | `DEFAULT_ADVANCED.hitMode = 'pewne'` (nowe gry) | — | OK (decyzja ABC A) |
| `src/ui/newGameFlow.ts:369` | normalizacja pola z kreatora (`'pewne'`/`'losowe'`, reszta pomijana) | — | OK |
| `src/ui/newGameFlow.ts:1843-1848` | przełącznik UI: indeks 0 = `pewne`, indeks 1 = `losowe` | — | OK |

### Rozbieżność (do osobnego tematu, NIE naprawiana w tej rundzie)

`src/game/siege.ts:729-750` (`resolveSiegeAttack`) liczy trafienia rzutem także w trybie `pewne`. Zakres wpływu zmierzony:
- `grep -rln resolveSiegeAttack src` → tylko `src/game/siege.ts` (definicja i komentarze). Brak wywołań w produkcyjnym `src/` poza modułem.
- Wywołania tylko z narzędzi testowych: `tools/city-militia-no-defenders-test.cjs`, `tools/militia-garrison-router-siege-test.cjs`, `tools/logic-test.cjs`, `tools/determinism-same-seed-test.cjs`.
- Wniosek: w grze z tego kodu nie wynika błąd, bo funkcja nie jest wywoływana w ścieżce produkcyjnej. Jeśli oblężenie ma respektować „pewne”, trzeba to zrobić osobnym tematem (sprawdzenie, jak oblężenie w grze rozwiązuje walkę).
- `src/game/siege.ts:350` eksportuje osobny `hitChance(atk, def)`. Wywołania NIE_ZBADANO w tej rundzie.

## Symulacja 20 Łuczników vs 20 Wojowników

Narzędzie: `gra/tools/hit-mode-archers-vs-warrior-sim.cjs`, silnik `resolveCombat` z `src/game/combat.ts`, tryb przez `setActiveHitMode` z `src/game/hit-mode.ts`. Dane z `data/units.json` (pola lowercase, których czyta silnik):
- Łucznik: `health` 20, `missileAttack` 4, zasięg 3, pociski 12, `armor` 1 w danych (pole lowercase), `meleeAttack` 2.
- Wojownik: `health` 22, `meleeAttack` 4, `meleeDefence` 4, `armor` 2.

Założenia (pełne w nagłówku narzędzia): kolejka czołowa 1 vs 1, zwycięzca zostaje z zachowanym HP, amunicja 12 na każdy pojedynek (zawyża ostrzał), teren płaski, bez flank, generała, weteranów i mnożników cywilizacji. 20 vs 20 nie jest jednym wywołaniem silnika.

Wynik (30 ziaren; `--seeds 30`):

| Tryb | Łucznicy wygrywają | Wojownicy wygrywają | Remis | Straty łuczników (śr.) | Straty Wojowników (śr.) | Rund (śr.) | Pojedynków (śr.) | Różnych wyników |
|---|---|---|---|---|---|---|---|---|
| pewne | 100% | 0% | 0% | 0,00 | 20,00 | 80,0 | 20,0 | 1 |
| losowe | 100% | 0% | 0% | 2,83 | 20,00 | 219,9 | 22,6 | 28 |

Pierwszy pojedynek (ziarno 1), tryb pewne, z silnika: 4 kolejne trafienia po 4 obrażenia (HP obrońcy 22→18→14→10→6), obrońca ucieka przy HP 6 < próg 8,8. Tryb losowe, to samo ziarno: 5 chybień z rzędu na początku, potem trafienia 4 obrażeń i chybienia zależne od rzutu.

Uwaga do liczb: pojedyncze trafienie łucznika = 4 obrażenia, czyli `(missileAttack 4 − armor 2) × 2` przy mnożniku łucznika ×2 z decyzji RANGED-DAMAGE-MULT. Zgodne z logiem.

## Odpowiedź liczbowa na pytanie właściciela

- Czy w „pewne” siła łuczników vs Wojownik jest skrajna? TAK. W „pewne” każdy strzał trafia, więc 20 łuczników wygrywa z 20 wojownikami w każdym z 30 ziaren bez ani jednej straty łuczników (1 różny wynik na 30 ziaren, bo tryb jest deterministyczny). Cała armia wojowników ginie w 80 rundach.
- Jak to się ma do „losowe”: zwycięzca ten sam (100% łuczników), ale w „losowe” łucznicy tracą średnio 2,83 z 20 jednostek, a bitwa trwa 220 rund zamiast 80. Liczba różnych wyników to 28 na 30 ziaren, czyli rzut realnie działa.
- Liczba „24 obrażeń na salwę” NIE została potwierdzona. Zmierzone: 4 obrażenia na jeden strzał, maksymalnie 12 strzałów na pojedynek (amunicja), czyli 48 na pełnym magazynku. Liczba 24 wymagałaby 6 trafień, których nie widać w logu pierwszego pojedynku.
- Ocena właściciela (decyzja ABC A, domyślnie „pewne”) pozostaje w gestii właściciela. Ten pomiar nie zmienia reguł ani liczb walki.

## Test strażnik: hit-mode-consistency-test.cjs

Sprawdza: A. `pewne` zero chybień przy obronach 0..200 (200 walk); B. `losowe` `hitChanceTw` = clamp(40 + atk − def + bonus, 15, 75) na siatce; C. proba statystyczna rzutu N=20000, tolerancja 1,5 pp; D. w `losowe` są chybienia w logu; E. stan domyślny = `losowe`.

Mutacja: `HITMODE_MUTATE=certain-off` podmienia w bundlu `isCertainHitMode` na `return false` (źródło nietknięte). Wynik: FAIL na A (2007 chybień w `pewne`), exit 1.

## Test istniejący (referencyjny)

`gra/tools/hit-mode-test.cjs`: 18 PASS / 0 FAIL na kodzie bazowym 3d4044c04 (w tym 100 000 starć 1 vs 1 w `pewne`, AUTO upset przy rng=0 w `losowe`, brak upsetu w `pewne`).

## TESTY

- `node tools/hit-mode-archers-vs-warrior-sim.cjs --seeds 30`: pewne i losowe jak w tabeli powyżej.
- `node tools/hit-mode-consistency-test.cjs`: 8 PASS / 0 FAIL, exit 0.
- `HITMODE_MUTATE=certain-off node tools/hit-mode-consistency-test.cjs`: 7 PASS / 1 FAIL (A), exit 1 (RED potwierdzony).
- `node tools/hit-mode-test.cjs`: 18 PASS / 0 FAIL, exit 0.
- `tsc --noEmit`: NIE_ZMIERZONO. W worktree nie było `gra/node_modules`; użyto symlinka do pakietu esbuild z katalogu sesji (plik `gra/node_modules`, ignorowany przez `gra/.gitignore`). Nie uruchamiano pełnego typecheck.
- 5 bramek referencyjnych z dispatchu: zmierzona jedna (`hit-mode-test.cjs`). Pozostałe 4 NIE_ZMIERZONO (dispatch nie wymienia ich nazw w dostępnym tekście).
- Gra w przeglądarce: NIE_ZMIERZONO (tryb tylko odczyt kodu i pomiar silnika).

## ZMIANY/COMMIT

Nowe pliki (bez zmian w `gra/src`, `gra/data`, `WERSJE.md`, `gra-robocza`):
- `gra/tools/hit-mode-archers-vs-warrior-sim.cjs`
- `gra/tools/hit-mode-consistency-test.cjs`
- `dyspozycje/autobot/runs/R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1/30-obrona-claude.md` (ten plik)

Commit dodaje te trzy pliki przez jawne ścieżki (bez `git add -A`). `gra/node_modules` to symlink ignorowany przez git, nie jest dodawany.

## BLOKADY

- Rozbieżność `siege.ts:729-750` (brak sprawdzenia trybu w `resolveSiegeAttack`). Nie naprawiana w tej rundzie: zakres to osobny temat, a w produkcji funkcja nie jest wywoływana.
- `tsc` i 4 z 5 bramek referencyjnych: NIE_ZMIERZONO (patrz TESTY).
- Liczba „24 obrażeń/salwę” z dispatchu nie została potwierdzona.

## RUNDY

obrona r1/5 (odpowiedź na zarzuty Evaluatora 69c6abfb; poprzednia runda: BLOCK Operatora 10-operator-claude.md).

## NASTĘPNY KROK

Evaluator r2: sprawdzić tabelę audytu (zwłaszcza wiersz `siege.ts`), uruchomić `hit-mode-consistency-test.cjs` i tryb mutacji, potwierdzić liczby z tabeli symulacji. Decyzja właściciela: czy oblężenie ma respektować „pewne” (nowy temat), czy zostaje jak jest.

## DEPLOY/PUSH

NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

- Dane jednostek: `data/units.json` ma dwie kolumny o różnych wartościach dla tej samej jednostki: kolumny z wielkiej litery (`Atak`, `Obrona`, `Health`) i pola lowercase (`meleeAttack`, `meleeDefence`, `health`). Przykład: Łucznik `Atak` 4 vs `meleeAttack` 2; Wojownik `Health` 60 vs `health` 22. Silnik czyta lowercase. Dispatch podaje `health` zgodnie z lowercase. Warto zgłosić osobnym tematem (dług UNITSHP).
- Wiersz `siege.ts` do osobnego tematu (opis w audycie).
- Brak `00-dispatch-DODATEK-claude.md` w jakimkolwiek refie: zadanie tej rundy wzięto z dispatchu i z zarzutów.
- Na czas pracy dodano w worktree symlink `gra/node_modules` do pakietu esbuild z katalogu sesji (ignorowany przez git). Do usunięcia przy sprzątaniu.
