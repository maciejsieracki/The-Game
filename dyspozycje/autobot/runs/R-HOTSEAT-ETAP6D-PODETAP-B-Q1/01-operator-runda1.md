STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-B-Q1
GOAL: Migracja klastra "HUD/panel dyplomacji" (15 funkcji z recon) na isMe()/ME(), Etap 6d.

ZMIANY/COMMIT: worktree `/home/user/wt-6d-PODETAP-B`, gałąź
`autobot/R-HOTSEAT-ETAP6D-PODETAP-B-Q1`, commit `5ba21cfa`. `gra/src/main.ts`:
43 podmian w ciałach 13 funkcji (44 literały `0`→`ME()`/`isMe()`, jedna zamiana
obsłużyła 2 hardkody w jednej linii): `playerFormalRelationLabel`,
`buildPlayerDiploRelations`, `buildDiploPairSummaryData`, `buildAudienceActions`,
`buildPendingNegotiationRows`, `foreignCivsMissingTradeTreatyForCity`,
`collectDiploChipCounts`, `enqueueNegotiationFromAiCmd` (12 miejsc),
`buildEmpireDetailSnap` (8 miejsc), `applyBorderMarchPenaltiesEndTurn`,
`currentVisibleForOwner`, `peacefulArchetypeForOwner`. Nowe pliki:
`gra/tools/hotseat-etap6d-podetap-b-live-test.cjs`,
`gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs`.

Dwa ODSTĘPSTWA od listy 15, oba udokumentowane w kodzie i uzasadnione:
- `relationColorFn`, `unitRingStanceForPlayer` — ZERO zmian: już zmigrowane
  wcześniej przez R-HOTSEAT-ETAP6E-RENDER-Q1 (`git log -S`, commit `b51d6c50`,
  zintegrowany do main przed tym recon). Recon (main.ts przesunięty od czasu
  inwentaryzacji) tego nie złapał.
- `cityMapOutlineKindForOwner` — ZERO zmian: dziś ma zero literałów `0` (używa
  `isMeSafe(ownerId)`/`meNow()` zamiast `isMe()`/`ME()`), z komentarzem inline
  main.ts:~17932 wyjaśniającym TDZ przy boot (R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1)
  — funkcja jest wołana WEWNĄTRZ pierwszego, bezwarunkowego `cityRenderer.sync()`
  przed inicjalizacją realnego `ME()`. Podmiana na `isMe()`/`ME()` groziłaby
  regresją bootu udokumentowaną przez wcześniejszego inżyniera; kryterium
  binarne dispatchu ("zero literałów `0`") jest już spełnione innym, bezpiecznym
  mechanizmem — NIE wymuszałem literalnej podmiany kosztem ryzyka regresji.
`handleNegotiationReject` potwierdzona NIETKNIĘTA (już zmigrowana w Podetapie E,
`4e07a9aa`) — zero wzmianek w `git diff`.

TESTY:
1. `tsc --noEmit` (gra/) — czysty, zero błędów, przed i po.
2. `hotseat-etap6d-podetap-b-live-test.cjs` — headless Chromium, `?playtest=mapa`,
   REALNE kliki DOM (nie haki testowe do efektu): przycisk toolbara "diplo" →
   lista dyplomacji (`.dl-item`, `buildPlayerDiploRelations`/
   `buildPlayerDiploListEntries`) → klik wiersza → pop-up pary
   (`buildDiploPairSummaryData`) → przycisk "Zaproponuj spotkanie" → audiencja
   realna (`buildAudienceActions`/`buildPendingNegotiationRows`) → chip HUD
   "miasta" → panel imperium/Miasta (`buildEmpireDetailSnap`). Dowód
   nietautologiczności: druga budowa z `ME()` na sztywno `99` (silniejsze niż
   `isMe()=>false`, bo `isMe` jest zdefiniowane jako `ownerId===ME()`) —
   panel Miasta poprawnie pokazuje "Brak miast" mimo realnych miast gracza,
   linia zaufania w liście dyplomacji poprawnie się zmienia (klucz relacji
   `"99_X"` zamiast `"0_X"` trafia na `defaultNeutralRelation()`). WYNIK:
   12/12 PASS.
3. `hotseat-etap6d-podetap-b-exec-test.cjs` — realne wykonanie (esbuild
   `transformSync`+`new Function`, NIE regex na tekście — błąd Podetapu E
   runda 1 nie powtórzony) 7 funkcji bez bezpośredniej, pojedynczo-klikalnej
   ścieżki UI: `playerFormalRelationLabel`,
   `foreignCivsMissingTradeTreatyForCity`, `collectDiploChipCounts`,
   `enqueueNegotiationFromAiCmd`, `applyBorderMarchPenaltiesEndTurn`,
   `currentVisibleForOwner`, `peacefulArchetypeForOwner`. `PLAYER=7`
   (celowo nie `0`) w każdym teście, mutacja `ME()=>99`/`isMe()=>false`
   czerwieni się poprawnie w każdym bloku. WYNIK: 23/23 PASS.
Uwaga metodologiczna: podczas budowy bramki Chromium odkryłem, że
`buildPlayerDiploRelations` nie jest wołana bezpośrednio przez martwy
`diplomacyPanel.ts`/`showDiplomacyPanel` (komentarz w kodzie: "martwy panel
dokowany"), lecz przez żywy `buildPlayerDiploListEntries` →
`diploListHud.ts` — poprawiłem selektor bramki na realną ścieżkę UI zamiast
zakładać z nazwy pliku.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
