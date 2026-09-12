STATUS: (Evaluator nie wydaje PASS/FAIL — patrz OCENA OGÓLNA)
DOMAIN: GAME
TEMAT: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1

## Uwaga metodologiczna wstępna

Ocena od zera na HEAD=241f56ee, worktree `/home/user/wt-miasta-panstwa-wojsko-odnowa`.
Plik `02-evaluator.md` (stary FAIL) potwierdzony jako nieaktualny — opisywał stan
SPRZED d32d39c7; zarzut 1 tamtego pliku jest dokładnie tym, co d32d39c7 naprawia.
Nie liczony jako bieżący werdykt, zgodnie z zadaniem.

**Ważne odkrycie proceduralne:** `origin/main` przesunął się od dispatchu tego tematu
(baza 46bfc81e) o ~30 commitów (aktualnie 676d2d97) — inne, równolegle zintegrowane
tematy (per-fotel cache Pracy/Kultury, eliminacja-podbój z `cause`, CivPedia
pokaż-wszystkie-jednostki, kontekst EOT, filtr Uwag budynków, naprawy 3 bramek).
Naiwny `git diff origin/main..HEAD` (dokładnie to, o co poprosił dispatch tej rundy)
pokazuje w efekcie ~50 plików i cofnięcie tych wszystkich tematów — co jest DOKŁADNIE
ostrzeżonym scenariuszem z `R-PROC-AUTOBOT.md` §9 pkt 9 ("Nigdy nie ufaj naiwnemu
`git diff origin/main..<branch>` przy integracji... ustal `git merge-base`, scalaj
`git merge --no-ff`"). Policzyłem właściwy diff tematu: `git merge-base origin/main HEAD`
= 46bfc81e, `git diff 46bfc81e..HEAD` = **11 plików, +520/−82**, wyłącznie
`gra/src/main.ts`, `gra/src/game/ai-difficulty-bonus.ts`, `gra/tools/*-test.cjs`
i katalog `dyspozycje/autobot/runs/H-MIASTA-.../` — dokładnie allowlista tematu.
Poniższa ocena K1-K9 opiera się na tym właściwym diffie (merge-base..HEAD), bo to
jedyny diff, który faktycznie opisuje pracę Operatora tego tematu; naiwny diff
oceniam osobno niżej jako blokadę integracji, nie jako zarzut wobec Operatora.

## GOAL

Zgodny z 00-dispatch.md i z GOAL w 01-operator.md/01-operator-defense-r2.md —
bez rozbieżności (checklista Evaluatora pkt 9, R-PROC-AUTOBOT.md §16a).

## ZMIANY-DOWODY (własna weryfikacja kodu, nie z raportów)

- `ai-difficulty-bonus.ts`: dodano `playerStartUnitCount` (easy1/normal2/hard3) i
  `foreignCityStateStartUnitCount` (easy2/normal1/hard0) — czyste funkcje.
- `main.ts` linia ~8931: pętla rywali tego samego typu (miasta-państwa CYWILIZACJI
  gracza) woła `grantCityStateStartUnits(..., cityStateStartUnitCount(_menuCityStateDifficulty))`
  — niezależnie od `_menuDifficulty` (K3 spełnione).
- `main.ts` linia ~9066: `spawnPendingForeignClusters` (obce klastry AI) woła
  `grantCityStateStartUnits(..., foreignCityStateStartUnitCount(_menuDifficulty))`
  (K1/K2 spełnione, K4: oba jedyne miejsca `c.startCityState = true` w pliku —
  potwierdzone `grep -n "startCityState = true"` → dokładnie 2 wystąpienia).
- `main.ts` linia ~13042/13058: `isFirstCityForOwner = isAwaitingFirstPlayerCity(c.ownerId)`
  odczytane PRZED `cities.push(c)` i przed `playerEverOwnedCityByOwner.add(ME())`
  (linia 13067); `grantPlayerStartUnits` wykonuje się WYŁĄCZNIE pod tym guardem.
  `c.ownerId === ME()` w tej funkcji (nadany kilka linii wyżej przez `foundCityAt(...,
  ME(), ...)`), więc guard i zapis operują na tym samym ownerId — per fotel, nie
  globalnie. `playerEverOwnedCityByOwner` to preegzystujący zbiór (niezmieniony
  przez ten temat, ma już logikę reset/rebuild przy switchActiveHuman/save-load,
  main.ts:36072-37311) — K7 potwierdzone samodzielnie czytaniem kodu, nie
  słowem obrony Operatora.
- `manpower.ts`/`turn-economy.ts`: zero zmian w diffie (potwierdzone `git diff
  --stat`) — zgodne z raportem "audyt bez defektu".

## TESTY (uruchomione samodzielnie, od zera, w tym worktree)

Środowisko: `npm ci` w `gra/` (node_modules brakowały), `PLAYWRIGHT_BROWSERS_PATH=
/opt/pw-browsers`, Chromium z `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
(env-var per bramka: `STARTING_ARMY_CHROME_PATH`/`CS_CHROME_PATH`).

- `node ./node_modules/typescript/bin/tsc --noEmit`: PASS (0 błędów).
- `ai-difficulty-bonus-test.cjs`: 79 passed, 0 failed.
- `city-state-start-units-test.cjs`: 16 PASS, 0 FAIL (asercja obu call-site'ów +
  izolacja od `grantDifficultyStartBonusesForMajorCapital`).
- `city-state-start-units-live-test.cjs`: **22 pass, 0 fail** — 3 pełne generacje
  świata w Chromium (hard/normal/easy), stolica gracza dokładnie 3/2/1 jednostek,
  miasta-państwa z obu punktów foundowania z poprawną, rozłączną liczbą (rywale tego
  samego typu zawsze wg `_menuCityStateDifficulty`=normal→1 niezależnie od trudności
  głównej; obce klastry 0/1/2 wg `_menuDifficulty`), zero błędów JS/konsoli.
- `manpower-test.cjs`: 63 OK, 0 FAIL.
- `r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs`: 12 OK, 0 FAIL (real resolver
  z `src/game/manpower.ts` przez esbuild bundle, nie mock — K5 potwierdzone).
- `starting-army-first-city-live-test.cjs`: 13 pass, 0 fail — dwa fotele hot-seat,
  fotel 1 zakłada 2 miasta (2 jednostki raz, nie 4), fotel 2 dostaje własną,
  jednorazową armię.
- `first-player-city-test.cjs`: 16 pass, 0 fail.
- `hotseat-human-owners-test.cjs`: 29 PASS, 0 FAIL.
- `hotseat-etap7-saveload-test.cjs`: 59 passed, 0 failed.
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19,
  `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.

## MUTACJA (własna, nietautologiczna)

Zmieniłem `if (isFirstCityForOwner) grantPlayerStartUnits(...)` → `if (true)
grantPlayerStartUnits(...)` w `main.ts` (osłabienie guardu), uruchomiłem
`starting-army-first-city-live-test.cjs` od zera: **12 pass, 1 fail** — czerwone
dokładnie na asercji "drugie miasto fotela 1 nie przyznaje ponownie armii
startowej" (fotel 1 miał 4 jednostki zamiast 2). Przywróciłem oryginalny guard,
ponownie uruchomiłem: 13 pass, 0 fail; `git diff` na `main.ts` czysty (0 linii) —
mutacja w pełni cofnięta.

## BLOKADY

Brak blokad środowiskowych — wszystkie bramki uruchomione do końca.

## ZARZUTY

1. **[BLOKUJĄCE INTEGRACJĘ, nie defekt Operatora] Gałąź jest ~30 commitów za
   `origin/main`; naiwny diff `origin/main..HEAD` (dokładnie ten, o który poprosił
   dispatch tej rundy) obejmuje 51 plików i wygląda jak cofnięcie kilku innych,
   już zintegrowanych tematów** — m.in.:
   - `gra/src/ui/entityCards/technologyAdapter.ts`: przywraca `previewLimit=3`
     ("Pokaż pozostałe N") w sekcji Jednostki karty technologii — to jest
     dokładne cofnięcie `P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1`
     (już na `main`, commit `e5ecf4b6`/deploy FALA 381).
   - `gra/src/ui/civElimNotice.ts` + `recordCivElimEvent` w `main.ts`: usuwa
     parametr `cause` ('dyplomacja'/'podboj') — cofnięcie
     `P-WYDARZENIA-ELIMINACJA-PODBOJ-KARTA-Q1` (main `075737dc`/`c38a09bd`).
   - Cały blok `makeOwnerCacheSlot`/`ownerLastPraca*`/`setOwnerLastPraca*` w
     `main.ts` (~110 linii) usunięty, powrót do globalnych `_lastPraca`/
     `_lastKultura` itd. — cofnięcie `P-HOTSEAT-ETAP6C-CHROMIUM-LASTPRACA-IMPL-Q1`
     (main `b6fee601`, FALA 379).
   - `gra/src/ui/cityPanel.ts` (−49 linii), `gra/src/ui/sidePanelHud.ts` (−7),
     `gra/src/game/eot-event-defer.ts` (−24) — cofnięcia
     `P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1`, `P-WYDARZENIA-PORZADKI-DROBNE-Q1`,
     `P-WYDARZENIA-EOT-KONTEKST-DLUG-Q1`.
   - 5 plików testowych **całkowicie usuniętych** względem `origin/main`:
     `hotseat-etap6c-lastpraca-per-fotel-test.cjs` (579 linii),
     `wydarzenia-eliminacja-podboj-karta-test.cjs` (352), `citypanel-uwagi-abc-
     filter-test.cjs` (67), `eot-event-defer-test.cjs` (51), `side-panel-event-
     link-test.cjs` (27) — utrata pokrycia testowego dla tematów już na `main`.
   - `gra-robocza/Gra-ROBOCZA.html`/`ROBOCZA-MANIFEST.json`: gałąź jest na
     "FALA 378", `origin/main` na "FALA 384" — 6 deployów różnicy.

   **Weryfikacja przyczyny:** `git merge-base origin/main HEAD` = `46bfc81e`;
   diff od tego punktu (`git diff 46bfc81e..HEAD`) obejmuje WYŁĄCZNIE pliki
   allowlisty tego tematu (11 plików, main.ts/ai-difficulty-bonus.ts/gra/tools//
   runs-dir) — więc żadna z powyższych zmian nie pochodzi z pracy Operatora tego
   tematu. Przyczyną jest wyłącznie to, że gałąź nigdy nie była rebase'owana/
   zmergowana z `origin/main` od dispatchu. To jest dokładnie ostrzeżony scenariusz
   `R-PROC-AUTOBOT.md` §9 pkt 9. **Wymagane przed integracją:** rebase albo
   `git merge --no-ff origin/main` do gałęzi tematu (rozwiązanie ewentualnych
   konfliktów w `main.ts` przy okazji), NIGDY integracja przez proste zastąpienie
   plików z tego worktree ani `git diff origin/main..HEAD | git apply` na aktualnym
   `main`. Bez tego kroku scalenie w obecnej postaci cofnęłoby ~6 innych tematów.
   Parent checkout `/home/user/The-Game` jest czysty i na `main`=676d2d97 — to nie
   jest naruszenie K9 przez ten worktree, ale integracja musi to naprawić przed
   `READY_FOR_DEPLOY`.

Poza powyższym — **brak** zarzutów wobec K1-K8 (wszystkie zweryfikowane samodzielnie,
testy + czytanie kodu + mutacja własna, wynik zielony na każdym punkcie).

## OCENA OGÓLNA

Sama logika tematu (K1-K8) jest poprawna i solidnie pokryta: guard pierwszego
miasta per owner/fotel działa (własna mutacja to potwierdza), oba strukturalne
punkty spawnu państw-miast są rozróżnione i przetestowane żywo w Chromium na
3 poziomach trudności, Manpower/HP nietknięte i zweryfikowane na realnym
resolverze, parytet gracz/AI jest jawny i pokryty testem mutacyjnym, TS i 5 bramek
referencyjnych zielone. Jedyny, ale poważny problem to stan gałęzi względem
`origin/main` (zarzut 1) — blokujący bezpieczną integrację, niezależnie od jakości
samej pracy Operatora. Rekomendacja: przed Final Control/integracją wykonać
rebase/merge `origin/main` do tej gałęzi i ponownie potwierdzić zielone bramki na
wyniku scalenia (szczególnie `city-state-start-units-live-test.cjs` i
`starting-army-first-city-live-test.cjs`, bo dotykają tego samego pliku co
zmiany na `main`).

## NASTĘPNY KROK

Final Control — z jawnym wskazaniem zarzutu 1 (staleness gałęzi) jako warunku
przed integracją; K1-K8 nie wymagają dalszej obrony Operatora.

DEPLOY/PUSH: NIE WYKONANO
