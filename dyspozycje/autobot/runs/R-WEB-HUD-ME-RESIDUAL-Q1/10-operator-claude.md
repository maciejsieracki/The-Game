STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-RESIDUAL-Q1
GOAL: ostatnie literały właściciela 0 w roli gracza aktywnego (hotseat) podstawione ME(); w grze jednoosobowej zachowanie bit-w-bit (ME() = 0).
ZMIANY-COMMIT: baza 94d71743820f4fdd24d65ad1cb5374098c796704 (origin/main, FALA 901). Allowlista: gra/src/main.ts (tylko wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, gra/tools/hud-owner-hotseat-source-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-RESIDUAL-Q1/**. SHA: patrz commit na gałęzi roboczej (czubek = SHA w polu sha raportu operatora).

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

## BLOKADY
- Brak. Hotseat runtime (dwie ludzkie strony) NIE ZMIERZONO — tylko test źródłowy i testy jednoosobowe.

## RUNDY
1/5

## NASTĘPNY KROK
Orkiestrator: Evaluator (Sonnet) weryfikuje tabelę decyzji i mutacje; następnie Final Control.

## UWAGI-DLA-ORKIESTRATORA
- buildHudState(0) w linii 33061 (poza zakresem) — kandydat do osobnego tematu.
- victory.ts i singleton `player` nie były przedmiotem tego tematu.

DEPLOY/PUSH: NIE WYKONANO
