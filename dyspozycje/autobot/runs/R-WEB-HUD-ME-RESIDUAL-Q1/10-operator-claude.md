STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-RESIDUAL-Q1
GOAL: ostatnie literały właściciela 0 w roli gracza aktywnego (hotseat) podstawione ME(); w grze jednoosobowej zachowanie bit-w-bit (ME() = 0).
ZMIANY-COMMIT: baza rundy 1 94d71743820f4fdd24d65ad1cb5374098c796704 (origin/main, FALA 901); runda 2 (obecna) startuje z 68069c1784636926f663fb64e59afdcca3e620a0 i dokłada stuby ME() w 3 testach vm (sekcja RUNDA 2/5). Allowlista: gra/src/main.ts (tylko wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, gra/tools/hud-owner-hotseat-source-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-RESIDUAL-Q1/**. SHA: patrz commit na gałęzi roboczej (czubek = SHA w polu sha raportu operatora).

## Tabela decyzji (zakres 4504–20463 + wskazane kotwice)

### Zmienione (0 -> ME(), rola: gracz aktywny), 52 linie + 1 w 13587/13588
- getNaukaRate (~35187): `(_ownerId) => buildHudState().naukaRate` -> `(ownerId) => buildHudState(ownerId).naukaRate`. Dowód: techTreeView.ts:255 przekazuje ownerId; ignorowanie argumentu = błąd.
- replaceUnitMoneyCost (8551): `civBonusyForOwnerId(0)` -> `civBonusyForOwnerId(ME())`. Koszt "Zastąp" dla gracza.
- buildAudienceOtherRelations (9157, 9163): `isPlayer: id === 0` -> `id === ME()`; `w.ownerId === 0` -> `ME()`.
- onBudowaListaLoadAllCities (10050): `cities.filter(c => c.ownerId === 0)` -> `ME()` (wgraj do "wszystkich twoich miast").
- Predykaty właściciela w zakresie (4504–17870, 19293, 19323, 19341, 20029–20053, 20465): `ownerId/c.ownerId/city.ownerId/u.ownerId/site.ownerId/t.ownerId/su.ownerId/route.ownerId/r.toOwnerId/oblegajacyOwnerId === 0` -> `=== ME()` (rola aktywny; dowód: w grze jednoosobowej ME() = 0).
- ownerHasSeafaring (15756): `ownerId === 0` -> `ME()`.
- grantTechToOwnerWithSideEffects (13587, 13588): `toOwnerId === 0` / `researchedByOwner.get(0)` -> `ME()` (gałąź gracza).
- sc.ownerId (12212): fresh default podziału handlu dla właściciela ME().
- AI-owner predicates (14502 sc.ownerId, 14685 `if (u.ownerId === ME()) continue`) — zmienione jako predykat gracza.

### Zostawione (decyzja z dowodem)
- buildHudState() bez argumentu (20698 buildEmpireDetailSnap, 29246 createScienceHubHud): ZOSTAW. Sygnatura `buildHudState(ownerId: number = ME())` (24012) — wywołanie bez argumentu już daje ME(); nie ma literału 0.
- civBonusyForOwnerId(0) w battle preset (42050, attackerCivBonusy): ZOSTAW. Preset playtest z etykietami stałymi 'Rzym'/'Grecja', obrońca to stały fotel 1 (defenderCivBonusy: civBonusyForOwnerId(1)); nie zależy od gracza aktywnego.
- buildHudState(0) (33061, poza zakresem 4504–20463 i poza listą kandydatów): ZOSTAW — nie wymieniony w dispatchu; do rozstrzygnięcia w kolejnym temacie (UWAGA-DLA-ORKIESTRATORA).
- ai.ownerId === 0 (6559, 6608): ZOSTAW. Obiekt AI, 0 jako wartość domyślnej inicjalizacji polityki podziału; nie predykat gracza.
- Komentarze (11200, 13013, 14890): ZOSTAW (nie kod).
- player.zbadane / player.* (singleton PlayerState, 15756 po stronie treści): ZOSTAW — singleton gracza poza zakresem podstawienia owner (osobny temat stanu).
- victory.ts: NIE DOTYKANO (logika zwycięstwa scoped na fotel 0 — zostaje wg dispatchu).

## Testy
- gra/tools/hud-me-literal-zero-test.cjs: dodany blok RESIDUAL_ROWS — 39 unikalnych zmienionych linii, każda z liczbą wystąpień w main.ts (oczekiwana = po zmianie). Wynik: 118 PASS / 0 FAIL.
  Mutacja (sed na kopii main.ts): `isPlayer: id === ME()` -> `id === 0` => FAIL "wystąpień 0, oczekiwano 1".
- gra/tools/hud-owner-hotseat-source-test.cjs: 8 nowych kontroli hotseat (buildHudState domyślny ME(), getNaukaRate, replaceUnitMoneyCost, onBudowaListaLoadAllCities, isPlayer, wojna ME(), preset zostawiony). Wynik: 58 PASS / 0 FAIL.
  Mutacja: `getNaukaRate: (ownerId...) => buildHudState(ownerId)` -> `(_ownerId) => buildHudState()` => FAIL.
- Uwaga: mutacja dla każdej z 39 linii jest pokryta przez licznik wystąpień (przywrócenie `=== 0` zmienia licznik nowego tekstu); zweryfikowana na dwóch reprezentantach (powyżej).

## Bramki (liczby z surowego wyjścia)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- ai-test: 297 passed, 0 failed
- hud-moc-warstwa-test: WYNIK 28 PASS, 0 FAIL
- hud-me-literal-zero-test: 118 PASS / 0 FAIL
- hud-owner-hotseat-source-test: 58 PASS / 0 FAIL
- moc-ranking-rozjazd-test: WYNIK 19 PASS, 0 FAIL
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- hotseat-etap6d e-source: 77 PASS / 0 FAIL; B: 48 PASS / 0 FAIL; D: 46 PASS / 0 FAIL; E: 24 PASS / 0 FAIL
- bramki-tmpdir-unikalnosc-test: PASS=18 FAIL=0
- git diff --check: czysto

## RUNDA 2/5 — naprawa FC FAIL r1 (ME() w testach vm)
BAZA rundy 2: kandydat 68069c1784636926f663fb64e59afdcca3e620a0 (runda 1 + obrona). Zmiany tylko w testach (stub ME(), bez zmian logiki gry w main.ts):
- gra/tools/unit-replace-multitype-walk-test.cjs: w ctx vm `ME: () => 0` (fotel jednoosobowy). Wynik: 25 OK / 0 FAIL (zgodnie z dispatchem).
- gra/tools/recruitment-batch-contract-test.cjs: `'ME'` w ENV_NAMES i `() => 0` w argumentach makeFunctions (purchaseRecruitmentUnit czyta ME()). Wynik: 17 passed / 0 failed.
- gra/tools/pr141-hotseat-production-owner-routing-test.cjs: `ME: () => 0` w obiekcie context vm. Wynik: PASS (exit 0).
Skan: wszystkie gra/tools/*.cjs używające main.ts + vm/new Function i nie definiujące ME (94 pliki, uruchomione pojedynczo z timeoutem 60 s): trzy z ReferenceError "ME is not defined" = pozycje powyżej, uzupełnione; reszta bez błędu ME. Pozostałe nieprzechodzące (exit 1/2) NIE są z tego tematu: sprawdzone na bazie sprzed rundy 1 (94d717438, git archive) — padają tam identycznie: spichlerz-deficyt-scalenie, improvement-growth-toggle, load-game-blockers-exec (resetNeighborTenureSession), memory-static-geometry-pool, city-state-offensive-normal-easy, general-quick-follow-action. Nie naprawiane (poza allowlistą, brak związku z ME()).
UWAGA-DLA-ORKIESTRATORA: spichlerz-deficyt-scalenie-test.cjs asertuje literał `getLastEmpireFoodTick(0)` w buildHudState — na bazie 94d717438 też pada (3 FAIL), więc to dług sprzed tematu; ta sama asercja w bieżącym kodzie widzi `ME()`.

## Bramki rundy 2 (liczby z surowego wyjścia)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- combat-test: All sanity checks passed (exit 0)
- unit-replace-test: exit 0 (wszystkie [OK])
- unit-replace-army-multi-select-test: exit 0
- unit-replace-full-cost-test: 40 passed, 0 failed
- unit-replace-multitype-walk-test: 25 OK, 0 FAIL
- unit-replace-promotion-table-test: PASS 32 wpisów źródłowych, 63 krawędzi, brak cykli
- unit-replace-archer-slinger-test: 51 OK, 0 FAIL
- ai-test: 297 passed, 0 failed
- hud-moc-warstwa-test: 28 PASS, 0 FAIL
- hud-me-literal-zero-test: 138 PASS / 0 FAIL
- hud-owner-hotseat-source-test: 58 PASS / 0 FAIL
- moc-ranking-rozjazd-test: 19 PASS, 0 FAIL
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- hotseat-etap6d e-source 77/0, B-exec 48/0, D-exec 46/0, E-exec 24/0
- bramki-tmpdir-unikalnosc-test: PASS=18 FAIL=0
- recruitment-batch-contract-test: 17/0; pr141-hotseat-production-owner-routing-test: PASS

## BLOKADY
- Brak. Hotseat runtime (dwie ludzkie strony) NIE ZMIERZONO — tylko test źródłowy i testy jednoosobowe.

## RUNDY
2/5 (runda 1: FC FAIL — ReferenceError ME w unit-replace-multitype-walk; runda 2: stuby ME() w 3 testach vm, kod gry bez zmian)

## NASTĘPNY KROK
Orkiestrator: Evaluator (Sonnet) weryfikuje tabelę decyzji, stuby ME() i mutacje; następnie Final Control.

## UWAGI-DLA-ORKIESTRATORA
- buildHudState(0) w linii 33061 (poza zakresem) — kandydat do osobnego tematu.
- victory.ts i singleton `player` nie były przedmiotem tego tematu.

DEPLOY/PUSH: NIE WYKONANO
