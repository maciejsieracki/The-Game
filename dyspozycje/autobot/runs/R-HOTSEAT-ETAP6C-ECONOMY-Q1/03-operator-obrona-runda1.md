STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6C-ECONOMY-Q1
GOAL: migracja 32 miejsc kategorii "ekonomia" na `isHuman(ownerId)`, blok bankowania
`runWorldEndTurn()`, decyzje `isPlayerOwner`/rebelia.

OBRONA:

1 -> PRZYJMUJĘ, NAPRAWIONE. Dowód: `main.ts:30699-30836` (Klaster F) miał filtr wstępny
`isHuman(c.ownerId)`, ale ~15 wywołań wewnątrz nadal na zaszytym `0`
(`civTypeForOwner(0)`, `unlockedTechSetForOwner(0)`, `resourceDeficitKeysForOwner(0)`,
`isTerritoryHexOwnedBy(...,0,...)`, singularny `playerPracaPool`, `freshClearingState(...,0)`,
`registerFortNodeIfNeeded(...,0)`) — mieszało miasta drugiego fotela do puli/archetypu/
technologii fotela 0, gorzej niż przed migracją. Naprawa: pętla `for (const hOid of
humanSeats.humanOwnerIds)` (ten sam wzorzec co blok bankowania pkt 3, `ownerPracaPool`/
`setOwnerPracaPool`, `main.ts:26508-26516`), każdy fotel dostaje własną pulę/archetyp/
tech/deficyt/terytorium; cache `_last*` i toast HUD zawężone do `hOid===humanOwnerId`
(singularne, wzorem 6b). Zweryfikowane: dla `HUMAN_OWNER_PRIMARY=0` `ownerPracaPool`/
`setOwnerPracaPool` czytają/piszą TĘ SAMĄ zmienną modułu przez `playerPracaCell`
getter/setter (`main.ts:10419-10432`) — behawioralny no-op przy jednym fotelu potwierdzony
grepem `, 0)\|(0)\|=== 0` w zakresie klastra: zero trafień poza niezwiązanym
`toastLines.length === 0`. `tsc --noEmit` czysty, gate 70/70 PASS.

2 -> PRZYJMUJĘ, NIE ZAADRESOWANE w tej rundzie. Recon §5/§6 i dispatch pkt 7 wprost
wymagały komponentu Chromium dla Klastra F (DOM-bound, panel ulepszeń) i G (HUD-bound,
write-site cache), wzorem `hotseat-etap6b-ui-noop-test.cjs` (450 linii: vite build,
Playwright PRZED/PO/ZEPSUTY, checkout worktree). Dostarczona bramka jest w 100%
headless Node — zarzut trafny, nie mam kontrargumentu. Świadomie NIE próbuję w tej
rundzie sklecić uproszczonej wersji pod presją czasu — ryzyko fałszywie zielonej bramki
większe niż jawne przyznanie braku (reguła przeciw samooszukiwaniu z dispatchu).
NASTĘPNY KROK proponowany: dedykowana runda 2 na budowę harnessu Chromium wg wzorca 6b,
scoped do Klastra F+G.

3 -> PRZYJMUJĘ, NAPRAWIONE. A6 sprawdzała wyłącznie `typeof fn==='function'`. Naprawa:
realny test behawioralny (wzorem C3 `auto-wyzywienie-flow-balance-test.cjs`) — dla
TEGO SAMEGO miasta (ownerId=1, poziomRacji=2, zapasyPrzed=5) `maxSafePoziomRacjiForCity`
BEZ `humanOwnerIds` daje stock-based maxSafe=3 (rezerwa pokrywa deficyt -4 na poziomie
3), a Z `humanOwnerIds=[0,1]` daje flow-based maxSafe=2 — dowód zweryfikowany osobnym
uruchomieniem (esbuild+node) przed wpisaniem asercji, nie zgadywany. Gate 70/70 PASS.

ZMIANY/COMMIT: `gra/src/main.ts` (Klaster F, zarzut 1), `gra/tools/hotseat-etap6c-economy-noop-test.cjs`
(A6, zarzut 3). Brak zmian poza allowlistą, brak `git add -A`.
TESTY: `tsc --noEmit` czysty. Nowa bramka 70/70 PASS. Referencje zielone: difficulty-cost
22/22, wealth 36/36, ai-major-economy 33/33, ai-praca-podzial 9/9, hotseat-etap3-akcesory
64/64, auto-wyzywienie-flow-balance 17/17.
BLOKADY: (1) zarzut 2 Evaluatora — Chromium dla Klastra F/G nie dostarczony, patrz OBRONA
pkt 2. (2) `isPlayerOwner` w production.ts/cityPanel.ts świadomie nieprzełączone (z rundy 1,
uzasadnione). (3) auto-research/toasty epoki nadal jednoosobowe (z rundy 1, jawne).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator runda 2 — ocena naprawy zarzutów 1/3 i decyzja co do zarzutu 2
(dedykowana runda Chromium albo akceptacja z notatką).
DEPLOY/PUSH: NIE WYKONANO
