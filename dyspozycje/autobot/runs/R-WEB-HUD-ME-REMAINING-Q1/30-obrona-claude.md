# R-WEB-HUD-ME-REMAINING-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-REMAINING-Q1
GOAL: brak literału 0 w roli gracza aktywnego w HUD i podglądach; test hotseat HUD; single-player bit-w-bit; bramki zielone.
BAZA: kandydat 72a0832235856154492620f0d29117f6b48647e2 (origin/main b610e71a62f68c5c3052d456facc0deebd86af72).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (bfb8313cf)

1. Test hotseat tylko źródłowy, brak runtime dla ownerId≠0. ODRZUCAM z dowodem: dispatch pkt 3 dopuszcza
   „test źródłowy lub behawioralny”. Runtime hotseat NIE ZMIERZONO w tej rundzie (zadeklarowane w nagłówku testu).
2. Test hotseat nie wykrywał 8 z 14 cofnięć. PRZYJMUJĘ. Dodano kontrole per nazwa w buildHudStateRaw
   (bez `name(0`, z `name(ownerId`): ownerReligionForOwnerId, buildEmpireResourceRows, wonderTradeRouteBonusForOwner,
   civManpowerMultsForOwner, civKolorHexFn, leaderNameForOwnerId, civDisplayNameForOwner; plus empirePoborTotals,
   cityManpowerSnapshot(c, ps.era), ps.civType, r.toOwnerId === ownerId; plus buildEmpireFoodSnap (ME(), bez projectPlayerFoodMaxCap()).
   Mutacje in-place (reverse) każdej z tych linii: CZERWONE (patrz TESTY).
3. player.era / player.zbadane w podglądzie. PRZYJMUJĘ. Miejsce to NIE buildEmpireDetailSnap, tylko producersForecastArgs
   (main.ts:21088-21093). Zmieniono na psMe = playerStateByHuman.get(me) ?? player (psMe.era, psMe.zbadane, psMe.civType).
   Single-player: psMe === player (ten sam obiekt), więc bit-w-bit.
4. Pozostałe *ForOwner(0) w podglądach. PRZYJMUJĘ i zamieniam na ME() (fotel aktywny):
   - buildEmpireTradeSnap (main.ts:21244, 21302-21303, 21308, 21311-21312): wonderTradeRouteBonusForOwner, capitalCityIdForOwner,
     unlockedTechsForOwner, ownerZlotoAccessForMennicaEffective (panel Imperium/Handel = widok gracza aktywnego).
   - buildEmpireTradeSnap (main.ts:21336-21337): deal.strony.includes(ME()) i deal.strony[0] === ME() (umowy Szlaków gracza).
   - buildReligionOverlayData (main.ts:21398): ownerReligionForOwnerId(ME()) (obok filtra isMe).
   - buildPowerOverlayData (main.ts:20707 — ta sama linia `buildObjectivePowerForOwnerEffective(...)` występuje także w innej
     funkcji na 20575, dlatego w mutacji użyto kontekstu z linią `const power = obj.power;`): panel Mocy = ME().
   NIE ZMIENIONO (z uzasadnieniem, poza tą rundą):
   - main.ts:20518, 20607 (`oid === 0 ? civKeyForOwner(0)`), main.ts:20574/20435-20436 (inne miejsca): 0 jest tu
     indeksem właściciela w liście WSZYSTKICH właścicieli (ranking/diagnostyka AI), a nie fotelem aktywnym.
     Uwaga: `isPlayer: oid === 0` (ranking, ~20522) również pozostaje; w hotseat z ME()≠0 zaznaczałoby zły wiersz —
     do rozstrzygnięcia osobnym tematem (poza zakresem dispatchu).
   - main.ts:24077 `ownerId === 0 ? storedResourceRows : …` — równoważne (Evaluator pkt 5), zostawione.

## ZMIANY-COMMIT
Pliki: gra/src/main.ts (+ zamiany ME()/psMe opisane wyżej, 12 miejsc w podglądach + 1 w buildHudStateRaw/food już w 72a0832),
gra/tools/hud-me-literal-zero-test.cjs (+ kontrole buildEmpireTradeSnap, producersForecastArgs, buildReligionOverlayData,
buildPowerOverlayData), gra/tools/hud-owner-hotseat-source-test.cjs (+ kontrole pokrycia 8 linii; env HUD_OWNER_GUARD_MAIN
do trybu mutacji, analogicznie do HUD_ME_GUARD_MAIN). Tylko dodania w testach, brak osłabień asercji.

## TESTY (surowe wyniki z tej rundy)
- tsc --noEmit: rc=0, 0 linii wyjścia.
- hud-me-literal-zero-test: 65 PASS / 0 FAIL.
- hud-owner-hotseat-source-test: 48 PASS / 0 FAIL.
- hud-moc-warstwa-test: WYNIK 28 PASS, 0 FAIL.
- moc-ranking-rozjazd-test: WYNIK 19 PASS, 0 FAIL.
- hotseat-etap6d-podetap-e-source-test: 77 PASS, 0 FAIL.
- logic-test: rc=0 (ostatnia linia [213]); research-test: PASSED 33 / FAILED 0 / TOTAL 33; tech-tree-test: 20 pass, 0 fail.
- MUTACJE (odwrotne podstawienie po jednej zmienionej linii, każda z osobnym plikiem main w scratchpad):
  guard hud-me-literal-zero: CZERWONE dla każdej z 12 linii podglądów (1–2 FAIL) i dla 14 linii buildHudStateRaw/food (1–3 FAIL);
  hotseat-source: CZERWONE dla 8 wcześniej niepokrytych linii (1–3 FAIL: ownerReligion, buildEmpireResourceRows, wonderTradeRouteBonusForOwner,
  civManpowerMultsForOwner (mpMults), civKolorHexFn, leaderNameForOwnerId, civDisplayNameForOwner, empirePoborTotals, r.toOwnerId,
  cityManpowerSnapshot ps.era, getLastEmpireFoodTick, getEmpireFoodReserve, getEmpireFoodMaxCap/projectPlayerFoodMaxCap).
  Uwaga: mutacja ps.civType w civIconId (buildHudStateRaw) nie była osobno przeprowadzona; pokrycie: kontrola `!player.civType` w raw.
- NIE URUCHOMIONO w tej rundzie: unit-replace, combat, ai-test, war-rules-multiwar-main-guard, hud-me-literal-zero poza
  mutacjami, hotseat-B/D/E (wykonawcze), granice-relacja, bramki-tmpdir. Powód: czas i zakres obrony; do uruchomienia przez FC.
- npm ci w gra/ tylko dla tsc/esbuild; gra/node_modules usunięte po bramkach.

## BLOKADY
Brak twardych. Runtime hotseat dla ownerId≠0: NIE ZMIERZONO (test źródłowy zgodnie z dispatchem).

## RUNDY
2/5 (obrona Operatora po werdykcie FAIL Evaluatora z rundy 1).

## NASTĘPNY KROK
Evaluator (Sonnet) rundy 2: sprawdzić mutacje i zakres zamian ME(); FC po werdykcie Evaluatora.
UWAGI-DLA-ORKIESTRATORA: `isPlayer: oid === 0` w rankingu Mocy (~main.ts:20522) — kandydat na osobny temat.

DEPLOY/PUSH: NIE WYKONANO
