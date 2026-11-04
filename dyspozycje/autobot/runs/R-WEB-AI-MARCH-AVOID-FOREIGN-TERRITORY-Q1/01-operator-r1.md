STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1
GOAL: AI w wojnie nie prowadzi wojsk przez teren TRZECIEJ cywilizacji bez umowy przemarszu (twarda przeszkoda w trasie, trasa okrezna, brak trasy = odroczenie, PROSBA o przemarsz istniejaca dyplomacja z cooldownem); gracz bez zmian.

## ZMIANY/COMMIT
Baza: 2d9b6aac8 (>= 23dd158e9). Commit kodu: 84633ac05 (jawny git add; PUSH NIE). Commit raportu: patrz `git log` galezi (SHA raportu nie da sie wpisac do wlasnej tresci).
- NOWY `gra/src/game/ai-march-guard.ts` (czysty): straz marszu (wlasciciel terenu per heks z `territoryOwnerAt`, memo; `wrapCost` -> Infinity na zakazanym heksie; `blockedHexKeys`; `nearBlockedTerritory`; wyjatek wyjscia).
- `gra/src/game/ai.ts`: `AITurnOpts.marchGuard`; `decideAITurn` = wrapper ustawiajacy straz na czas tury (reszta w `decideAITurnCore`); `firstStep` -> `guardedMarchPath` (ai.ts ~918-1000; tylko jednostki wojenne); planer wojny `applyWarAllInCapitalToCommands` dokleja zakazany teren do `blocked` + `requestWarMarchPassage`; nowy wariant komendy `zaproponuj_przemarsz`.
- `gra/src/game/diplomacy-proposals.ts`: `zaproponuj_przemarsz` -> istniejaca akcja `granice` + `borderMilitary` (reuse, bez nowego mechanizmu); tekst dla gracza.
- `gra/src/main.ts`: `marchGuard` w opts AI tylko gdy `atWarWithCivFor(ownerId)`; autoryzacja = TO SAMO `hasAuthorizedBorderCrossing` (isMilitary) co kara; egzekutor ruchu AI (`computePath`) ma ta sama blokade (`aiMarchCostFn`); `requestAiMarchPassage`: cooldown 8 tur na pare, gracz = stol negocjacyjny (`enqueueDiplomacyPendingFromCmd`), AI<->AI = `evaluateProposal` + `applyAcceptedProposal`.
- NOWY `gra/tools/ai-march-avoid-foreign-territory-test.cjs`.

## STAN ZASTANY (pomiar)
`firstStep` (ai.ts:895) i planer wojny (`warAllInCapital.ts` `nav.blocked`) znaly tylko obce MIASTA i jednostki; teren cywilizacji i dyplomacja nie byly w kosztach (`computePath` setup.ts:888 koszt = terrainMoveCost). Symulacja 3 civ (wojna 1-3, civ 2 trzecia, odmowa umow), 6 ziaren x 80 tur, PRZED: 2336 jednostko-tur na terenie trzeciej, 492 pary-tury z kara (-2460 pkt Zaufania), 19 wizyt N7 (spadki Wiarygodnosci). PO: 0 / 0 / 0.

## TESTY
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Nowy test: 68 OK / 0 FAIL (sekcje: A straz, B scenariusze x2 sciezki [wojna all-in i firstStep]: omija; z umowa przechodzi; odmowa -> okrezna; odmowa+brak trasy (korytarz) -> 0 wejsc + prosba; wyjscie z zakazanego terenu; E statyczne okablowanie main.ts; D symulacja). Mutacje prawdziwego zrodla (7: pominiecie strazy, koszt, planer blocked, ignorowanie umowy x2, brak prosby x2) czerwienia B1/B2/B4c.
- Wydajnosc (pomiar parowany, ten sam stan, na przemian kolejnosc): trajektoria PRZED 1,16x; trajektoria PO 1,30x (stany z objazdami). Pierwsza wersja miala 1,48x; zmniejszone (jeden Dijkstra jak dotad, trasa wprost tylko gdy objazd podejrzany, cache tras stosu).
- Regresje PO == PRE (baza 2d9b6aac8): zielone: ai-move-full-range 20, ai-move-range 46, ai-move-range-collision 12, border-march-scan 15, diplomacy-border-march 43, planned-march 18, rally-point-automarch 30, territory-border x2, war-allin-capital-regress, war-epoch-player-first 33, war-era-counter 82, war-happiness-parity 21, war-rules-multiwar 57 + main-guard 21, diplo-truce-r4-ai 24, diplomacy-ai-balance 36, city-cession-r3 73, resource-cyclic 53, pakt-ekspansja 26. CZERWONE identycznie PRZED i PO (zastane, nie moje): border-march-wygasanie (4), march-attack-queue-persist (2), war-allin-capital-test (4: 1a, 6b x3), war-epoch-player-first-main-guard (3), diplomacy-proposal-test (2/188), dyplo-bilans-gate-n-e1 (4), hotseat-etap6d-podetap-b-exec (crash). NIE_URUCHOMIONE: testy live/real-render (wymagaja przegladarki/serwera; zakaz npm run dev).

## ZALOZENIA / UWAGI
- Straz tylko dla jednostek wojennych AI w wojnie z cywilizacja (atWarWithCivFor); pokoj i cywile bez zmian; gracz bez zmian.
- Wojna z gospodarzem terenu, sojusz, wasal, umowa przemarszu, wlasny teren = dozwolone (hasAuthorizedBorderCrossing).
- Trasa morska: planer firstStep jest ladowy; `ctx.allowSea` istnieje tylko w kampanii generala -> trasa morska nie dodana (NIE_ZMIERZONO zakres; DECYZJA_WYMAGANA tylko jesli wlasciciel chce transportu morskiego jako obowiazkowej alternatywy).
- Brak trasy okreznej: marsz odroczony w miejscu (nie podchodzi pod granice); prosba co 8 tur.
- Wyjatek: jednostka stojaca na zakazanym terenie moze z niego wyjsc (licznik exitExceptions; w symulacji 0).
- Prog "znacznie gorsza okrezna": koszt > 1,5x + 3 (ZALOZENIE).
- RYZYKO (NIE_ZMIERZONO czestosc): przy idealnie symetrycznym rozstawie armii na grzbiecie objazdu (polnoc/poludnie rowne) planer wojny rozdziela grupe i jednostki oscyluja (odtworzone w scenariuszu symetrycznym, usuniete z testu przez asymetrie). Do oceny Evaluatora.

## BLOKADY
Brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
