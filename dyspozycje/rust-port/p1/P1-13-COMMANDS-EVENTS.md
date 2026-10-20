# P1.13 — Katalog komend, eventów i przejść stanu (web, referencja read-only)

**Temat:** R-RUSTPORT-P1-13-COMMANDS-EVENTS-Q1 · **Runda:** 2/5 · **Rola:** Operator, obrona (Haiku 5.5 medium)
**Pin webowy:** `main` = `edb8fb56` (wszystkie ścieżki i linie odnoszą się do tego commita)
**Metoda:** `git archive edb8fb56 gra/src` do katalogu roboczego poza repo (scratchpad); worktree repo (inna gałąź, bez `edb8fb56` jako HEAD) NIE był używany jako źródło odczytu. Zapis katalogu następuje w allowliście w worktree (patrz sekcja „Izolacja” w odpowiedzi rundy 2). Zero zapisu w `gra/**`.
**Zakres:** `gra/src/main.ts` (39 350 linii w pinie) oraz `gra/src/game/*.ts` (183 pliki), plus typy `ui/*` i `map/*`/`battle/*` tam, gdzie są typami komend/akcji/eventów gracza.
**Konwencja:** `ścieżka:linia` — cytat z kodu w backtickach. Wpisy bez cytatu nie wchodzą do katalogu.

> Uwaga architektoniczna dla portu: web NIE ma busa zdarzeń (`emit`/`CustomEvent` = 0 trafień w `gra/src`, `dispatchEvent` tylko na `Event('input')`/`Event('resize')`). Komendy są typami unii + bezpośrednimi wywołaniami funkcji, a przejścia stanu są zaszyte w sekwencji `triggerPlayerEndTurn → endActiveHumanTurn → runWorldEndTurn` w jednej domknięciowej funkcji `boot()`.

---

## A. Komendy / akcje

### A1. Komendy AI (jednostki i miasta) — `AICommand`

Deklaracja: `gra/src/game/ai.ts:156` — `export type AICommand =`

| Typ | Ścieżka:linia (deklaracja) | Cytat | Egzekucja w main.ts |
|---|---|---|---|
| `move` | `game/ai.ts:85` | `export interface AICmdMove { type: 'move';` | `main.ts:34836` `if (cmd.type === 'move') {` |
| `foundCityAt` | `game/ai.ts:95` | `export interface AICmdFoundCityAt { type: 'foundCityAt';` | `main.ts:34928` `if (cmd.type === 'foundCityAt') {` |
| `attack` | `game/ai.ts:102` | `export interface AICmdAttack { type: 'attack';` | `main.ts:34977` `if (cmd.type === 'attack') {` |
| `build` | `game/ai.ts:109` | `export interface AICmdBuild { type: 'build';` | `main.ts:35038` `if (cmd.type === 'build') {` |
| `buildImprovement` | `game/ai.ts:142` | `export interface AICmdBuildImprovement { type: 'buildImprovement';` | `main.ts:35227` `if (cmd.type === 'buildImprovement') {` |
| `endTurn` | `game/ai.ts:151` | `export interface AICmdEndTurn { type: 'endTurn';` | `main.ts:34831` `if (cmd.type === 'endTurn') {` (no-op) |

Pętla wykonująca: `main.ts:34831`–`35227`, wewnątrz `runWorldEndTurn` (`main.ts:31169`). Liczba członków: **6**.

### A2. Komendy dyplomatyczne AI — `AIDiplomacyCommand`

Deklaracja: `gra/src/game/ai.ts:5039` — `export type AIDiplomacyCommand =`

| Typ | Linia (deklaracja) | Cytat | Obsługa |
|---|---|---|---|
| `wypowiedz_wojne` | `game/ai.ts:5040` | `{ type: 'wypowiedz_wojne'; targetId: string; powod: string }` | `main.ts:34392` `if (cmd.type === 'wypowiedz_wojne') {` |
| `zaproponuj_pokoj` | `game/ai.ts:5041` | `{ type: 'zaproponuj_pokoj'; ... }` | `main.ts:34512` → `enqueueDiplomacyPendingFromCmd` (`main.ts:16806`) → `enqueueNegotiationFromAiCmd` (`main.ts:16840`) |
| `zadaj_trybut` | `game/ai.ts:5042` | `{ type: 'zadaj_trybut'; ... }` | `main.ts:34514` → `enqueueDiplomacyPendingFromCmd` |
| `oferuj_trybut_za_pokoj` | `game/ai.ts:5043` | `{ type: 'oferuj_trybut_za_pokoj'; ...; goldOnce?: number }` | `main.ts:34516` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_sojusz` | `game/ai.ts:5044` | `{ type: 'zaproponuj_sojusz'; ...; allianceKind?: 'defensywny' \| 'pelny' }` | `main.ts:34518` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_handel` | `game/ai.ts:5045` | `{ type: 'zaproponuj_handel'; ...; goldOnce?: number }` | `main.ts:34520` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_umowe_handlowa` | `game/ai.ts:5046` | `{ type: 'zaproponuj_umowe_handlowa'; ...; sweetenerGold?: number }` | `main.ts:34522` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_handel_surowiec` | `game/ai.ts:5047`–`5053` | `type: 'zaproponuj_handel_surowiec'; ... surowiecKey; ... zaplataTyp: 'zloto' \| 'praca'` | gracz: `main.ts:34524`; AI→AI: `main.ts:34529` → `applyAiAiHandelSurowiecCmd` (`main.ts:19623`) |
| `zaproponuj_pakt` | `game/ai.ts:5054` | `{ type: 'zaproponuj_pakt'; ...; turns?: number }` | `main.ts:34526` → `enqueueDiplomacyPendingFromCmd` |
| `zaproponuj_audiencje` | `game/ai.ts:5055`–`5059` | `type: 'zaproponuj_audiencje'; ...; motive?: string` | `main.ts:34380`–`34381` `applyAiAudienceRequest(ownerId, cmd)` (`main.ts:19680`); odfiltrowany z `dipCmds` w `main.ts:34385` |

Powiązane przełączniki (etykiety i routing): `main.ts:16793` `diploPendingTitle` (7 `case`), `game/diplomacy-proposals.ts:1769`, `:1788`, `:1841` (`switch (cmd.type)`), `game/diplomacy-proposals.ts:1826` `aiCommandToPendingProposal`. Liczba członków: **10**.

### A3. Komendy barbarzyńców — `BarbCommand`

Deklaracja: `gra/src/game/barbarians.ts:243` — `export type BarbCommand = BarbCmdMove | BarbCmdAttack | BarbCmdRaid;`

| Typ | Deklaracja | Egzekucja w main.ts |
|---|---|---|
| `move` | `game/barbarians.ts:217` (`BarbCmdMove`) | `main.ts:35604` `if (bcmd.type === 'move') {` |
| `attack` | `game/barbarians.ts:225` (`BarbCmdAttack`) | `main.ts:35652` `} else if (bcmd.type === 'attack') {` |
| `raid` | `game/barbarians.ts:235` (`BarbCmdRaid`) — „rajd Ludów Morza” | `main.ts:35634` `} else if (bcmd.type === 'raid') {` |

Pętla: `main.ts:35604`+ (`for (const bcmd of barbCmds)`), wewnątrz `runWorldEndTurn`. Liczba członków: **3**.

### A4. Propozycje dyplomatyczne (UI → silnik) — `ProposalActionId`

Deklaracja: `gra/src/game/diplomacy-proposals.ts:68` — `export type ProposalActionId =`

Członkowie (linia = `diplomacy-proposals.ts:<n>`): `'nap'`:69, `'sojusz_defensywny'`:70, `'sojusz_pelny'`:71, `'handel'`:72, `'umowa_handlowa'`:77 (alias AI), `'umowa_szlakow'`:79, `'trybut_zadanie'`:80, `'trybut_oferta'`:81, `'granice'`:82, `'tech'`:83, `'namow_wojne'`:84, `'ultimatum'`:85, `'wasal'`:86, `'wchloniecie'`:88, `'pokoj'`:90. Liczba członków: **15**.

Konsumenci i pokrycie (zweryfikowane w rundzie 2 na `edb8fb56`):

| Konsument | Ścieżka:linia | Pokrycie członków |
|---|---|---|
| `evaluateProposal` — `switch (actionId)` | `game/diplomacy-proposals.ts:1038` (`case 'nap'`:1039, `case 'sojusz_defensywny'`:1087, `case 'trybut_zadanie'`:1144, `case 'pokoj'`:1189, `case 'trybut_oferta'`:1348, `case 'handel'`:1380, `case 'umowa_handlowa'`:1472, `case 'umowa_szlakow'`:1473, `case 'namow_wojne'`:1563, `case 'tech'`:1579, `case 'granice'`:1622, `case 'ultimatum'`:1673, `case 'wasal'`:1684, `case 'wchloniecie'`:1707, `default`:1746) | **15/15** — pełne pokrycie |
| `resolvePlayerAcceptsAiPending` — `switch (actionId)` | `game/diplomacy-proposals.ts:1994` (`case 'nap'`:1995, `case 'sojusz_defensywny'`:2020, `case 'pokoj'`:2032, `case 'granice'`:2034, `case 'tech'`:2063, `case 'namow_wojne'`:2078, `case 'ultimatum'`:2081, `case 'wasal'`:2084, `case 'handel'`:2101, `case 'umowa_handlowa'`:2138, `case 'umowa_szlakow'`:2139, `case 'trybut_zadanie'`:2159, `case 'trybut_oferta'`:2175, `default`:2194 → `'Nieznana akcja dyplomatyczna'`) | **14/15 — BRAK `'wchloniecie'`** (patrz niżej) |
| etykiety stołu — `switch (entry.actionId)` | `main.ts:17507` (`case 'nap'`:17508 … `default`:17538) | etykiety z `default` (nie wymaga pełnego pokrycia) |

**Luka `wchloniecie` w `resolvePlayerAcceptsAiPending` (statycznie ustalona, NIE uruchomiona):** wywołania `main.ts:17267` (gracz akceptuje wpis przychodzący z `isMe(awaitingOwnerId)`), `main.ts:17837` i `main.ts:17957` przekazują wpis do tego switcha. Wpis `'wchloniecie'` powstaje z UI (`ui/diplomacyTradeBasket.ts:1411` `if (actionId === '15') return 'wchloniecie'`, przycisk `'15'`). `NEGOTIATION_NO_ENGINE_COUNTER` jest pusty (`game/diplomacy-proposals.ts:2239`–`2241`), a `canCounterNegotiation` (`:2365`) nie wyklucza `'wchloniecie'`, więc auto-kontroferta zachowuje `actionId` (`generateCounterOffer`, `:2536`–`2537`). Ścieżka „kontroferta na wchłonięcie → akceptacja gracza” daje `accepted:false` przez `default` (`:2194`). Ścieżka nie została wykonana w runtime — P2.5 musi ją uwzględnić.

### A5. Akcje na mapie: kliknięcie wrogiego miasta — `MapEnemyCityClickAction`

Deklaracja: `gra/src/map/map-attack-city.ts:18`. Członkowie: `not_enemy`:19, `siege_panel`:20, `attack_choice`:21, `field_battle`:22, `capture_empty`:23, `hint_city_not_visible`:24, `hint_no_adjacent`:25, `hint_civilian`:26, `hint_pick_attacker`:27.
Dispatcher: `main.ts:26513` `switch (action.kind)` — **pokrywa wszystkie 9** (`case` w `main.ts:26514`, `26522`, `26530`, `26533`, `26540`, `26543`, `26551`, `26557`, `26565`). Liczba członków: **9**.

### A6. Akcje jednostki z HUD — `handleSelectedUnitHudAction`

Funkcja: `main.ts:21857` `function handleSelectedUnitHudAction(actionId: string): void {`. Łańcuch `if/else if` po `actionId` (nie typowany, id to literały):
`'rally-set'`:21862, `'rally-launch'`:21871, `'rally-clear'`:21873, `'march-continue'`:21878, `'march-stop'`:21880, `'skip'`:21882, `'unfortify-all'`:21893, `'fortify'`:21910, `'disband'`:21977, `'split'`:21979, `'merge'`:21981, `'replace'`:21983, `'sentry'`:21985, `'scout-explore'`:22002. Liczba: **14**.
Typ `UnitPanelAction` (`ui/unitPanelHud.ts:21`, `id: string`): ids są literałami w `main.ts` (miejsca `actions.push`/`id:` w `main.ts:21708`–`21840`, zestawienie w A11). Id `'split'`/`'merge'` pochodzą z typowanego `game/armyMerge.ts:687`. Id `'march-continue'` ma tylko gałąź w handlerze (`main.ts:21878`); literalnego miejsca dodania nie znaleziono (grep `'march-continue'` = 1 trafienie w `main.ts`).

### A7. Akcje na przycisku dyplomacji (siatka akcji) — id akcji `data/diplomacy.json`

Mapowanie przycisków: `ui/diplomacyAudience.ts:1651`–`1659` (`ACTION_BAR_SPECS`): `'11'`:1651 (Wypowiedz wojnę), `'10'`:1652 (Zaproponuj pokój), `'3'`:1653 (Sojusz), `'2'`:1654 (Pakt o nieagresji), `'5'`:1655 (traktat handlowy), `'14'`:1656 (Umowa wymiany), `'13'`:1657 (Przekaż dar), `'12'`:1658 (Wasalizacja), `'15'`:1659 (Wchłonięcie). Liczba: **9**.
Obsługa: `main.ts:21260` `function applyAudienceAction(ownerId, actionId, payload?)`; jawnie: `main.ts:21278` `if (actionId === '11')`, `main.ts:21289` `case '10':`, `main.ts:21293` `case '5':`, `main.ts:21297` `case '14':` (wszystkie cztery to komunikaty „użyj koszyka/przycisku na stole”).

**Ścieżka przycisków `'3'`, `'2'`, `'13'`, `'12'`, `'15'` (prześledzona w rundzie 2; NIE mają gałęzi `case` w `applyAudienceAction`, obsługują je inne ścieżki):**
1. Klik: listener `ui/diplomacyAudience.ts:2265`–`2315` (`button[data-aid]`). Dla `aid` z `getNegotiationContext` i `actionUsesTradeBasket(aid)` otwiera koszyk: `showTradeBasketModal` (`:2280`–`2285`, `onAction(ownerId, aid, payload)`). Zbiór `TRADE_BASKET_ACTION_IDS` = `'2','3','4','6','7','8','9','10','12','13','14','15'` (`ui/diplomacyTradeBasket.ts:2818`–`2820`) zawiera wszystkie pięć id.
2. Payload → `applyAudienceAction` gałąź `if (payload)` (`main.ts:21269`–`21275`) → `handleNegotiatedProposal` (`main.ts:21108`) → `buildProposalFromPayload` (`main.ts:21010`) → `proposalActionIdFromPayload` (`ui/diplomacyNegotiationModal.ts:549`–`562`): `'13'`→`'handel'`, `'3'`→`'sojusz_defensywny'`/`'sojusz_pelny'`, `'2'`→`'nap'`, `'12'`→`'wasal'`, `'15'`→`'wchloniecie'`.
3. Fallback bez kontekstu negocjacji (`getNegotiationContext` zwraca `null` lub akcja nieaktywna): `cfg.onAction(ownerId, aid)` bez payloadu (`ui/diplomacyAudience.ts:2315`) → `applyAudienceAction` → `default` (`main.ts:21301`–`21302`): `showHintMessage('Akcja dyplomatyczna (wkrótce): ' + civName, 3000)` — **atrapa**, nie wykonuje akcji.
4. `actionNeedsNegotiation` (`ui/diplomacyNegotiationModal.ts:148`–`150`, zbiór `'6','7','9','10'` z `:146`) dla tych pięciu id zwraca `false`, więc modal stołu negocjacyjnego nie jest używany.

Pozostałe id emitowane przez builder audiencji, których **nie ma** na pasku (`'4'`, `'6'`, `'7'`, `'8'`, `'9'`), są dostępne z kafelka „Możliwe umowy” (`ui/diplomacyAudience.ts:1824`, `data-aid`); ich downstream **nie został prześledzony** w rundzie 2 (sekcja D).

### A8. Komendy stołu negocjacyjnego (gracz)

| Funkcja | Ścieżka:linia | Rola |
|---|---|---|
| `resolveNegotiationEntryAt` | `main.ts:17113` | rozstrzyga wpis |
| `resolvePendingNegotiationsForOwner` | `main.ts:17191` | rozstrzyga kolejkę właściciela |
| `handleNegotiationAccept` | `main.ts:17230` | akceptacja |
| `handleNegotiationReject` | `main.ts:17280` | odrzucenie |
| `handleNegotiationRemove` | `main.ts:17314` | usunięcie wpisu |
| `handleNegotiationAcceptPackage` | `main.ts:17377` | akceptacja koszyka |
| `handleNegotiationRejectPackage` | `main.ts:17397` | odrzucenie koszyka |
| `handleNegotiationCounter` | `main.ts:17411` | kontrpropozycja |
| `handleNegotiationEditOwn` | `main.ts:17442` | edycja własnej oferty |
| `handleRequestAiNegotiationResponse` | `main.ts:17467` | żądanie odpowiedzi AI |
| `resolvePendingDiplomacy(id, accept)` | `main.ts:17807` | rozstrzygnięcie propozycji |
| `handleNegotiatedProposal` | `main.ts:21108` | wykonanie zaakceptowanej oferty |
| `applyProposalOutcome` | `main.ts:20605` | skutek propozycji |

### A9. Komendy ruchu, miast i wojny (gracz)

| Komenda | Ścieżka:linia | Cytat / uwaga |
|---|---|---|
| ruch wybranej jednostki | `main.ts:26036` `function beginMoveSelectedUnitTo(destQ, destR): boolean` | wykonanie: `main.ts:25457` `startAnimatedMove` |
| wycofanie/zakończenie planowanego marszu | `main.ts:25701` `runPlannedMarchesAtPlayerEndTurn` | wołane w `main.ts:35983` |
| założenie miasta (klik) | `main.ts:13504` `handleFoundCityMapClick` | |
| budowa z panelu | `main.ts:13691` `applyBuildRequest(req: ImprovementBuildRequest)` → `main.ts:13787` `commitBuildRequest` | |
| podział pracy miasta | `main.ts:5611` `applyCityPodzialPracyChange` | |
| okolica (worked tile) | `main.ts:5784` `applyOkolicaTileAdjust` | |
| wypowiedzenie wojny przez gracza | `main.ts:10603` `playerDeclareWarOnOwner` → `main.ts:10646` `ownerDeclareWarOn` | |
| oblężenie miasta | `main.ts:14920` `startMapSiege`, `main.ts:14851` `commitBesiege`, `main.ts:14831` `endMapSiege`, `main.ts:14637` `resolveSiegeSurrender` | |
| tajne oblężenie | `main.ts:30029` `executeSilentSiegeStorm` | |
| fokus stolicy dyplomacji | `main.ts:28716` `handleDiploFocusCapital` | |
| zamknięcie wpisu panelu zdarzeń | `main.ts:22293` `handleSidePanelEventDismiss` | |

### A10. Wejścia klawiaturowe i myszy (gracz)

Listenery: `main.ts:26121` (`window keydown`, F9/F10/Ctrl+Shift+D), `main.ts:36106` (`window keydown`, gra), `main.ts:26204` `mousedown`, `:26209` `contextmenu`, `:26230` `mousemove`, `:26337` `mouseup`, `:26714` `dblclick` (canvas).

| Klawisz | Ścieżka:linia | Akcja |
|---|---|---|
| F9 | `main.ts:26122` `if (e.key === 'F9') {` | przełącz overlay wydajności `togglePerfDebugOverlay` (dev) |
| F10 | `main.ts:26127` | przełącz panel diagnostyczny `toggleDiagPanel` |
| Ctrl+Shift+D | `main.ts:26132` | kopia raportu diagnostycznego `copyDiagReport` |
| Escape | `main.ts:36108` | zamknij panel miasta / tryb budowy / dialog zapisu |
| Space | `main.ts:36131` | `cycleToAdjacentPlayerUnit(selectedId, 1)` (tylko w trybie jednostek) |
| F | `main.ts:36157` | dev-only (`FOG_DEV_SHORTCUTS`) |
| M | `main.ts:36167` | dev-only `toggleDevRevealAllLand` |
| G | `main.ts:36141` | dev-only (`GALLERY_DEV_SHORTCUT`) |
| N | `main.ts:36223` `if (e.code === 'KeyN' \|\| ...)` → `advanceSeat()` (`main.ts:36230`) | **zakończ turę** (skrót) |

---

### A11. Literały i callbacki UI (rozstrzygnięcie luk rundy 1, runda 2)

- **`EntityCardAction`** (`ui/entityCards/types.ts:117`, `id: string`, `onClick`): jedyne literały producenta to `ui/techDiscoveryNotice.ts:599` `id: 'research'` (Rozpocznij badanie) i `:605` `id: 'tree'` (Otwórz drzewo). Adaptery `ui/entityCards/*Adapter.ts` nie budują elementów tego typu. Renderer: `ui/entityCards/renderer.ts:538`. Nowe: **2**.
- **`UnitPanelAction`** (`ui/unitPanelHud.ts:21`): ids z `main.ts` są już w A6, poza jednym: `main.ts:21725` `actions.push({ id: 'siege-hold', label: 'Oblega', disabled: true })` — brak gałęzi w `handleSelectedUnitHudAction`, przycisk `disabled` (`ui/unitPanelHud.ts:167`), więc kliknięcie nie wywołuje `onAction`. Nowe: **1** (`siege-hold`, martwy).
- **`SiegeMapPanelActions`** (`ui/siegeMapPanel.ts:13`) — wpięte w `main.ts:14893` (`const siegePanelActions = {`):
  - `onBesiege` `main.ts:14894` → `commitBesiege(cityId)` (`main.ts:14851`);
  - `onStorm` `main.ts:14896` → `launchSiegeStormFromMap(ctx)` (`main.ts:30086`);
  - `onRetreat` `main.ts:14897`–`14907` → `endMapSiege(cityId)` (`main.ts:14831`) + przywrócenie podświetlenia zasięgu i hint „Odwrót — oblężenie zakończone.”;
  - `onQueueMachine` `main.ts:14908` → `queueSiegeMachine(city, kind)` (taran/wieża, limit 4);
  - `isMe` `main.ts:14895` — hook odczytu, nie komenda.
- **`CityAttackChoiceActions`** (`ui/cityAttackChoice.ts:21`) — wpięte w `main.ts:15035`–`15039` (`showCityAttackChoice(ctx, {`): `onSiege` `main.ts:15036` → `startMapSiege(ctx)` (`main.ts:14920`); `onStorm` `main.ts:15037` → `launchSiegeStormFromMap(ctx)`; `onCancel` `main.ts:15038` → `() => {}` (bez efektu). Drugi punkt wpięcia: `main.ts:26525`–`26526` (dispatcher A5).
- **`AudienceAction`** (`ui/diplomacyAudience.ts:60`, `id: string`): ids nie są unią literałów. Źródło: `data/diplomacy.json` → `akcje_dyplomatyczne` (`gra/data/diplomacy.json:220`), id = cyfry z prefiksu etykiety (`game/diplomacy-audience-actions.ts:22`–`25`, `diplomacyActionIdFromLabel`). Builder pomija `'1'` (`game/diplomacy-audience-actions.ts:58`, „kontakt osobno”) i emituje **14** id: `2,3,4,5,6,7,8,9,10,11,12,13,14,15`. Z tego 9 jest na pasku (A7), a `4`, `6`, `7`, `8`, `9` tylko z kafelka „Możliwe umowy” (`ui/diplomacyAudience.ts:1824`); ich downstream nie był śledzony w rundzie 2 (sekcja D).

---

## B. Eventy i przejścia stanu

### B1. Zdarzenia dyplomatyczne — `DiplomaticEvent`

Deklaracja: `gra/src/game/diplomacy.ts:810`. Konsument: `game/diplomacy.ts:863` `export function applyDiplomaticEvent(`, `switch (event)` w `game/diplomacy.ts:875`. **Każdy z 23 członków ma `case`** (`diplomacy.ts:879`–`1025`).

| # | Członek | Deklaracja | `case` |
|---|---|---|---|
| 1 | `wojna_wypowiedziana` | 812 | 879 |
| 2 | `pokoj` | 813 | 886 |
| 3 | `handel` | 815 | 894 |
| 4 | `wspolny_wrog` | 816 | 899 |
| 5 | `zlamana_obietnica` | 818 | 907 |
| 6 | `zlamana_obietnica_ai` | 819 | 912 |
| 7 | `zdrada` | 820 | 917 |
| 8 | `tarcia_graniczne` | 821 | 923 |
| 9 | `dar` | 823 | 945 |
| 10 | `wspolna_religia` | 824 | 950 |
| 11 | `pomoc_sojusznikowi` | 825 | 955 |
| 12 | `wygrana_bitwa` | 827 | 962 |
| 13 | `przewaga_militarna` | 828 | 967 |
| 14 | `slabszy_militarnie` | 829 | 972 |
| 15 | `trybut_zaakceptowany` | 830 | 977 |
| 16 | `wojna_casus_belli` | 835 | 984 |
| 17 | `ultimatum_spelnione` | 836 | 991 |
| 18 | `ultimatum_bezpodstawne` | 837 | 996 |
| 19 | `trybut_odmowa` | 838 | 1003 |
| 20 | `trybut_oferta_przyjeta` | 839 | 1008 |
| 21 | `wymiana_tech_gratis` | 840 | 1013 |
| 22 | `zerwanie_handlu` | 841 | 1018 |
| 23 | `zerwanie_traktatu` | 843 | 1025 |

Konsumenci zdarzeń: `main.ts:9890` `applyDiploEventTracked`, `main.ts:9916` `applyPnTrustForPair`. Przejścia statusu wojny w tym samym switchu: `diplomacy.ts:1417`–`1419` (`StanWojny.Wojna` / `CasusBelli`).

### B2. Zdarzenia wiarygodności (kary/nagrody) — `CredibilityEvent`

Deklaracja: `gra/src/game/diplomacy-credibility.ts:92`. Członkowie (15): kary N1–N7 `:94`–`:102` (`wypowiedzenie_wojny_bez_ostrzezenia`, `zlamanie_paktu_nap`, `zlamanie_paktu_sojusz`, `atak_w_oknie_karencji`, `odmowa_obowiazku_sojuszu`, `zerwanie_dobrowolne_traktat`, `zerwanie_dobrowolne_handel`, `niedotrzymanie_handlu_cyklicznego`, `nieautoryzowany_przemarsz`); nagrody FINISZ `:104`–`:107` (`dotrwanie_sojuszu`, `dotrwanie_nap`, `dotrwanie_handlu`, `splata_handlu_cyklicznego`); nagrody CZYNY `:109`–`:110` (`wieloletni_pokoj`, `pomoc_sojusznikowi_realna`).

Duplikat literałów: `game/wiarygodnosc-types.ts:27` `export type WiarygodnoscEventTyp` — te same 15 id (linie `:29`–`:45`). Dwa niezależne typy o identycznym zbiorze — kandydat do jednego źródła w P2.

### B3. Strumień wiarygodności — `CredibilityStreamEvent`

`gra/src/game/diplomacy-credibility.ts:259`: `strumien_sojusz`:260, `strumien_nap`:261, `strumien_handel`:262, `strumien_przemarsz`:263. Liczba: **4**. Model: licznik `sumaAktywna` (`diplomacy-credibility.ts:280`+), usuwany po końcu zobowiązania.

### B4. Zdarzenia sojuszu — `AllianceEvent`

`gra/src/game/diplomacy-treaties.ts:164`: `{ type: 'attacked'; victimOwnerId; aggressorOwnerId }` (`:165`), `{ type: 'declared_war'; declarerOwnerId; targetOwnerId }` (`:166`). Liczba: **2**. Konsument w `main.ts:20035` `applyAllianceObligationsOnWar(attackerId, victimId)`.

### B5. Rodzaje wpisów panelu zdarzeń i ich linki

- `SidePanelEventKind` — `ui/sidePanelHud.ts:29`: `science`, `culture`, `city`, `unit`, `enemy`, `info`, `diplo` (**7**).
- `SidePanelEventLinkKind` — `game/side-panel-event-link.ts:28`: `diplo-wars`:30, `civ-elim`:32, `map-focus`:34, `city-panel`:36, `empire-spichlerz`:38, `tech-tree`:40 (**6**). Routing: `main.ts:15712` `sidePanelEventLinkFor`, `main.ts:15715` `switch (kind)`, aktywacja `main.ts:15751`–`15753` `switch (link.kind)`.
- `collectTurnEvents` (źródło listy): `main.ts:15615`.
- `executeFirstBlockingEvent` — `main.ts:14271`: routing po prefiksie `id`: `diplo-pend-` → `openDiplomacyPendingById` (`main.ts:17867`); `negot-` → `openDiplomacyAudienceForNegotiation`; `cityIdFromRevoltEventId` / `cityIdFromProdEmptyEventId` → `openCityPanelForPlayer`.
- `EotEventDraft.kind` — `game/eot-event-defer.ts:101`–`112`: `'info' | 'diplo'` (**2**), odłożone hinty końca tury.
- `InterHumanProposalKind` — `ui/interHumanDiplomacyHud.ts:25`: `zaproponuj_pokoj`:26, `zaproponuj_sojusz`:27, `zaproponuj_pakt`:28, `zaproponuj_audiencje`:29 (**4**).
- `DiploPlayerAction` — `ui/diplomacyPanel.ts:28`: `'pokoj' | 'wojna' | 'handel'` (**3**).

### B6. Zdarzenia AI / miast / bitew / zapisu (małe unie)

| Typ | Ścieżka:linia | Członkowie |
|---|---|---|
| `AiCsClusterAction` | `game/ai-cs-absorption.ts:8` | `trybut`:9, `wasal`:10, `war`:11, `annex`:12, `instant_annex`:13 (**5**) |
| `AiMajorAbsorbAction` | `game/ai-major-absorb.ts:15` | `instant_annex` (**1**) |
| `CapitalCaptureEventKind` | `game/capital-capture.ts:147` | `przejecie_stolicy`, `eliminacja` (**2**) |
| `VillageRewardKind` | `game/villageRewards.ts:26` | `zloto`, `tech`, `jednostka` (**3**) |
| `AutoBatchIntentKind` | `battle/autoBatchPhase.ts:10` | `hold`, `move`, `attack` (**3**) |
| `ProductionKind` | `game/production.ts:95` | `budynek`, `jednostka` (**2**) |
| `SaveLabelKind` | `game/save-label.ts:8` | `manual`, `quick`, `autosave` (**3**) |
| `ReligionSpreadEvent` | `game/culture-religion.ts:979` | interfejs zdarzenia szerzenia religii |
| `FortTakeoverEvent` | `game/fort-territory.ts:106` | interfejs przejęcia fortu |
| `MapFieldBattleAction` | `battle/mapFieldBattle.ts:35` | interfejs akcji bitwy polowej (`attacker: RuntimeUnit`, …) |

Routing przeglądarka→autozapis: `game/fsa-autosave.ts:94` `switch (reason)` — mapowanie przyczyn na komunikaty (`no-window`, `file-protocol`, `insecure-context`, `no-api`, default); typ `FsaUnavailableReason` od `game/fsa-autosave.ts:46`.

### B7. Przejścia stanu gry: tura, epoka, wygrana, zapis

Łańcuch zakończenia tury gracza (kolejność wywołań):

1. `main.ts:36102` `function triggerPlayerEndTurn(): void {` → `advanceSeat();` (`main.ts:36103`)
2. `main.ts:36047` `function advanceSeat(): void {` → `endActiveHumanTurn(activeId);` (`main.ts:36096`)
3. `main.ts:35855` `function endActiveHumanTurn(humanOwnerId)` → `runPlannedMarchesAtPlayerEndTurn(humanOwnerId);` (`main.ts:35983`) → `await runWorldEndTurn(humanOwnerId);` (`main.ts:35987`)
4. `main.ts:31169` `async function runWorldEndTurn(humanOwnerId)`:
   - czyszczenie buntów, `evictForeignUnitsFromCityHexes()`, reset `ruchLeft` / `replaceUsedThisTurn` / `retreatedThisTurn` (`main.ts:31170`–`31188`);
   - **`turn++;` — `main.ts:31189`** (jedyne przejście licznika tury w grze, poza resetami w startach);
   - pętla AI — właściciele: `ownerLoop: for (let oi = startOi; …)` w `main.ts:33469` (start pętli); w jej ciele blok dyplomacji AI: `const dipCmds: AIDiplomacyCommand[] = filterDiplomacyCommandsForEstablishedContact(…)` (`main.ts:34384`) i pętla komend `for (const cmd of dipCmds) {` (`main.ts:34388`) zamknięta na `main.ts:34535` (`main.ts:34364` to wcześniejszy fragment filtra `isForcedEpochWarDeclareCmd`, nie początek pętli); jednostki/miasta `main.ts:34831`–`35227`, barbarzyńcy `35604`–`35652`;
   - `checkVictory(vInput)` — `main.ts:35756`.
5. `game/victory.ts:204` `export function checkVictory(input: VictoryInput): VictoryResult | null`. Tryby: `game/victory.ts:52` `VictoryMode` = `'moc' | 'dominacja' | 'moc_i_dominacja'` (**3**); wynik `game/victory.ts:95` `VictoryResult.rodzaj` = `'dominacja' | 'nauka' | 'przegrana'` (**3**). Duplikat typu trybu: `ui/newGameFlow.ts:194` `export type VictoryMode`.

Reset tury przy starcie gry (`turn = 1`): `main.ts:37223` (`doStartGame`, `:37067`), `:37547` (playtest odskok), `:37801` (`doStartPlaytestMiastoEkonomia`, `:37669`), `:38035` (`doStartPlaytestMapaSwiata`, `:37893`).

Epoka: `main.ts:14354` `notifyPlayerEraChangeIfAdvanced(prevEra)`, `main.ts:14404` `flushPendingEraChangeToast` (wołane w `finally` `triggerPlayerEndTurn`), `main.ts:2160` `refreshCityRenderIfEraChanged`.

Zapis / odczyt:
- `main.ts:38140` `async function loadGameFromSlot(slotId, fromInGamePause)`;
- `main.ts:38334` `function restoreGameFromSave(saved: SaveGame)` z `turn = saved.tura;` (`main.ts:38339`);
- `main.ts:36872` `newGameParamsForLoad(saved)`;
- `game/save.ts:520` `serializeGame`, `game/save.ts:666` `deserializeGame(json)`, `game/save.ts:250` `buildSaveSlotMeta`, `game/save.ts:562` `migrateLegacyFarmsOnForestInSave`.

Start nowej gry: `main.ts:36538` `applyMenuParams(params: NewGameParams)`, `main.ts:36925` `runBuildSceneWithOverlay`, `main.ts:36952` `applySceneResult`.

Wiele fotelów (hot-seat): przejście fotela = `advanceSeat()` (`main.ts:36047`); architektura komentowana w `main.ts:35851` i `main.ts:36032`–`36038` (realne przejście świata tylko przez `endActiveHumanTurn`).

---

## C. Podsumowanie liczbowe

| Kategoria | Liczba typów / pozycji | Źródło |
|---|---:|---|
| Komendy AI jednostek/miast (`AICommand`) | 6 | A1 |
| Komendy dyplomacji AI (`AIDiplomacyCommand`) | 10 | A2 |
| Komendy barbarzyńców (`BarbCommand`) | 3 | A3 |
| Propozycje dyplomatyczne (`ProposalActionId`) | 15 | A4 |
| Akcje kliknięcia wrogiego miasta (`MapEnemyCityClickAction`) | 9 | A5 |
| Akcje HUD jednostki (`handleSelectedUnitHudAction`) | 14 | A6 |
| Id akcji audiencji dyplomacji (builder: 14; w tym 9 na pasku `ACTION_BAR_SPECS`) | 14 | A7 |
| Literały i callbacki UI bez wcześniejszego wpisu (`EntityCardAction` 2, `siege-hold` 1, callbacki `SiegeMapPanelActions`/`CityAttackChoiceActions`: `onBesiege`, `onStorm`, `onRetreat`, `onQueueMachine`, `onSiege`, `onCancel` = 6) | 9 | A11 |
| Skróty klawiaturowe gry | 9 (w tym 3 dev-only: F, M, G — bramki `FOG_DEV_SHORTCUTS` / `GALLERY_DEV_SHORTCUT`) | A10 |
| Zdarzenia dyplomatyczne (`DiplomaticEvent`) | 23 | B1 |
| Zdarzenia wiarygodności (`CredibilityEvent`) | 15 | B2 |
| Strumienie wiarygodności (`CredibilityStreamEvent`) | 4 | B3 |
| Zdarzenia sojuszu (`AllianceEvent`) | 2 | B4 |
| Rodzaje wpisów panelu/linków (`SidePanelEventKind` 7 + `SidePanelEventLinkKind` 6 + `InterHumanProposalKind` 4 + `DiploPlayerAction` 3 + `EotEventDraft.kind` 2) | 22 | B5 |
| Małe unie zdarzeń (`AiCsClusterAction` 5, `AiMajorAbsorbAction` 1, `CapitalCaptureEventKind` 2, `VillageRewardKind` 3, `AutoBatchIntentKind` 3, `ProductionKind` 2, `SaveLabelKind` 3, `VictoryMode` 3, `VictoryResult.rodzaj` 3) | 25 | B6, B7 |
| **Razem — typy komend/akcji** (A1–A7: 6+10+3+15+9+14+14 = 71; plus A11: 9; bez skrótów klawiszowych i bez duplikatów) | **80** | |
| **Razem — typy zdarzeń/przejść stanu** (B1–B6 + tryby/wyniki wygranej z B7: 23+15+4+2+22+25; bez duplikatu `WiarygodnoscEventTyp`, bez interfejsów) | **91** | |

> Liczby „Razem” są sumą pozycji z tabel tego pliku, nie wynikiem pełnego grepu każdego pliku `game/*.ts` — patrz sekcja D. Łączna liczba typów komend i eventów w katalogu: **80 + 91 = 171** (plus 9 skrótów klawiszowych). Liczba 171 dotyczy pozycji wyliczonych z tabel; nie jest wynikiem pełnego grepu wszystkich `game/*.ts` (sekcja D).

---

## D. Luki zakresu (stan po rundzie 2)

1. **Literały `ui/*`:** zamknięte w rundzie 2 w sekcji A11 dla `EntityCardAction`, `UnitPanelAction`, `SiegeMapPanelActions`, `CityAttackChoiceActions`, `AudienceAction`. **Otwarte:** obsługa `DiploPlayerAction` (typ w `ui/diplomacyPanel.ts:28`, wyliczony w B5; handler nie prześledzony).
2. **Ścieżka `'3'`, `'2'`, `'13'`, `'12'`, `'15'`:** zamknięta w rundzie 2 (sekcja A7: koszyk → `handleNegotiatedProposal`). Fallback bez kontekstu negocjacji to atrapa „wkrótce” (`main.ts:21301`–`21302`). **Otwarte:** downstream id `'4'`, `'6'`, `'7'`, `'8'`, `'9'` z kafelka „Możliwe umowy”.
3. **Konsumenci `ProposalActionId`:** zamknięte w rundzie 2 (sekcja A4). `evaluateProposal` (`game/diplomacy-proposals.ts:1038`) pokrywa 15/15. `resolvePlayerAcceptsAiPending` (`:1994`) pokrywa 14/15, brakuje `'wchloniecie'` (ścieżka statycznie ustalona, nie uruchomiona — do uwzględnienia w P2.5).
4. **`game/*.ts` poza wymienionymi** (np. `diplomacy-ai-balance.ts`, `diplomacy-audience-actions.ts`, `ai-*.ts` poza `ai.ts`, `forced-war-*.ts`, `alliance-war-obligation.ts`) — zawierają logikę decyzji AI i bloki `switch` na `item.typ`; nie zostały skatalogowane jako osobne typy zdarzeń.
5. **Komunikaty wewnętrzne `console.log`/`showHintMessage`** nie są katalogiem zdarzeń i nie zostały wyliczone.
6. **Typ `FsaUnavailableReason`** (`game/fsa-autosave.ts:46`) — członkowie nie zostali policzeni w sumie.
7. **Pozostałe `switch` w `gra/src`:** `git grep -nE '\bswitch\s*\(' edb8fb56 -- gra/src | wc -l` = **115** trafień; z tego 111 to `switch` na początku linii (`git grep -nE '^\s*switch\s*\(' …`). Katalog wymienia tylko switche dotyczące komend/akcji/zdarzeń. Pozostałe (np. `render/*.ts`, `battle/battleScene.ts`) nie zostały zaklasyfikowane.

Stan po rundzie 2: pozycje 1, 2, 3 i 7 mają rozstrzygnięcie opisane powyżej. Pozycje 4, 5, 6 oraz „Otwarte” z pozycji 1 i 2 pozostają **DO DOPISANIA** i wymagają decyzji Evaluatora, które są krytyczne dla P2.5/P2.6.

---

## E. Pokrycie `ProposalActionId` we wszystkich konsumentach (R-RUSTPORT-P1-13B-PROPOSAL-COVERAGE-Q1, runda 1/5)

**Pin:** `edb8fb56` (wszystkie cytaty z `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56`, wykonane w tej rundzie). Stare numery `main.ts:1038` i `main.ts:1994` z sekcji A4 **nie są** switchami na `ProposalActionId`: na pinie są to linie importu i komentarza w `gra/src/main.ts`. Właściwe switche to `gra/src/game/diplomacy-proposals.ts:1038` (`evaluateProposal`) i `:1994` (`resolvePlayerAcceptsAiPending`).

**Definicja:** `gra/src/game/diplomacy-proposals.ts:68` — 15 członków: `nap`:69, `sojusz_defensywny`:70, `sojusz_pelny`:71, `handel`:72, `umowa_handlowa`:77 (alias AI), `umowa_szlakow`:79, `trybut_zadanie`:80, `trybut_oferta`:81, `granice`:82, `tech`:83, `namow_wojne`:84, `ultimatum`:85, `wasal`:86, `wchloniecie`:88, `pokoj`:90.

### E1. Konsumenci typowani przez `ProposalActionId` (pełna lista na pinie)

| # | Konsument | Ścieżka:linia | Rodzaj | Wynik dla 15 wariantów |
|---|---|---|---|---|
| K1 | `evaluateProposal` | `game/diplomacy-proposals.ts:1038` | `switch` (+ `default` :1746 → `accepted:false`) | **15/15 jawnie** (`case` :1039–:1707; `umowa_handlowa` :1472 wpada w `umowa_szlakow` :1473) |
| K2 | `resolvePlayerAcceptsAiPending` | `game/diplomacy-proposals.ts:1994` | `switch` (+ `default` :2194 → `accepted:false`, „Nieznana akcja dyplomatyczna”) | **14/15** — **BRAK `wchloniecie`** (case-y :1995–:2175; brak w liście) |
| K3 | etykiety stołu `entry.actionId` | `gra/src/main.ts:17507` (`default` :17538) | `switch` na etykiety UI | **15/15 jawnie** (`nap`:17508 … `wchloniecie`:17537) |
| K4 | `applyProposalOutcome` | `gra/src/main.ts:20605` (parametr `cywAction: string`) | warunki na wybrane id, nie `switch` | nie jest konsumentem pełnym: jawne gałęzie tylko dla `trybut_*` :20614, `wchloniecie` :20620, `handel` :20701, `umowa_handlowa`/`umowa_szlakow` :20719; reszta obsługiwana ogólnie |
| K5 | zbiory-filtry (`Set`) | `diplomacy-proposals.ts:1956` (`NEGOTIATION_PEACE_REQUIRED`: nap, sojusz×2, handel, umowa_handlowa, umowa_szlakow, granice, tech, wasal, wchloniecie, trybut_zadanie), `:1973` (`PEACE_ACTIONS_DURING_WAR`: pokoj, trybut_oferta, ultimatum), `:2239` (`NEGOTIATION_NO_ENGINE_COUNTER`: pusty), `:2417` (`TRIBUTE_PROPOSAL_ACTIONS`: 2 trybuty), `:2477` (`SWEETENER_COUNTER_ELIGIBLE`: nap, sojusz×2, granice, wasal, pokoj); `game/diplomacy-acceptance-points.ts:623` (`INCOMING_NET_PW_ACTIONS`: handel, umowa_handlowa, umowa_szlakow) | filtry członkostwa — brak wpisu nie jest błędem sam w sobie; `wchloniecie` nie występuje w `SWEETENER_COUNTER_ELIGIBLE` ani w `INCOMING_NET_PW_ACTIONS` (decyzja projektowa do P2.5, nie dowód luki) |
| K6 | mapowanie UI → id | `ui/diplomacyNegotiationModal.ts:549`–`562` (`proposalActionIdFromPayload`); `ui/diplomacyTradeBasket.ts:1395`–`1413` | producent id, nie konsument | 14 z 15 (wszystko poza `umowa_handlowa`, który powstaje tylko jako alias AI w `diplomacy-proposals.ts:77`) |

### E2. Status per wariant (K1 / K2 / K3)

| Wariant | K1 evaluateProposal | K2 resolvePlayerAcceptsAiPending | K3 etykieta | Status |
|---|---|---|---|---|
| `nap` | OBSŁUŻONY (:1039) | OBSŁUŻONY (:1995) | OBSŁUŻONY (17508) | OBSŁUŻONY WSZĘDZIE |
| `sojusz_defensywny` | OBSŁUŻONY (:1087) | OBSŁUŻONY (:2020) | OBSŁUŻONY (17512) | OBSŁUŻONY WSZĘDZIE |
| `sojusz_pelny` | OBSŁUŻONY (:1088) | OBSŁUŻONY (:2021) | OBSŁUŻONY (17513) | OBSŁUŻONY WSZĘDZIE |
| `handel` | OBSŁUŻONY (:1380) | OBSŁUŻONY (:2101) | OBSŁUŻONY (17517) | OBSŁUŻONY WSZĘDZIE |
| `umowa_handlowa` | OBSŁUŻONY (:1472) | OBSŁUŻONY (:2138) | OBSŁUŻONY (17519) | OBSŁUŻONY WSZĘDZIE |
| `umowa_szlakow` | OBSŁUŻONY (:1473) | OBSŁUŻONY (:2139) | OBSŁUŻONY (17520) | OBSŁUŻONY WSZĘDZIE |
| `trybut_zadanie` | OBSŁUŻONY (:1144) | OBSŁUŻONY (:2159) | OBSŁUŻONY (17532) | OBSŁUŻONY WSZĘDZIE |
| `trybut_oferta` | OBSŁUŻONY (:1348) | OBSŁUŻONY (:2175) | OBSŁUŻONY (17533) | OBSŁUŻONY WSZĘDZIE |
| `granice` | OBSŁUŻONY (:1622) | OBSŁUŻONY (:2034) | OBSŁUŻONY (17514) | OBSŁUŻONY WSZĘDZIE |
| `tech` | OBSŁUŻONY (:1579) | OBSŁUŻONY (:2063) | OBSŁUŻONY (17522) | OBSŁUŻONY WSZĘDZIE |
| `namow_wojne` | OBSŁUŻONY (:1563) | OBSŁUŻONY (:2078) | OBSŁUŻONY (17531) | OBSŁUŻONY WSZĘDZIE |
| `ultimatum` | OBSŁUŻONY (:1673) | OBSŁUŻONY (:2081) | OBSŁUŻONY (17535) | OBSŁUŻONY WSZĘDZIE |
| `wasal` | OBSŁUŻONY (:1684) | OBSŁUŻONY (:2084) | OBSŁUŻONY (17536) | OBSŁUŻONY WSZĘDZIE |
| `wchloniecie` | OBSŁUŻONY (:1707) | **LUKA w `resolvePlayerAcceptsAiPending` (:1994)** — trafia do `default` :2194 → `accepted:false` | OBSŁUŻONY (17537) | **LUKA W K2** |
| `pokoj` | OBSŁUŻONY (:1189) | OBSŁUŻONY (:2032) | OBSŁUŻONY (17534) | OBSŁUŻONY WSZĘDZIE |

### E3. Ustalenia i korekty

1. **Luka K2 potwierdzona statycznie:** brak `case 'wchloniecie'` w `diplomacy-proposals.ts:1994`–`2197` (grep `case 'wchloniecie'` na pinie = tylko :1707, czyli K1). Wywołania K2 w `main.ts`: :17267, :17837, :17957, :19631 (AI↔AI). Ścieżka runtime nie była uruchamiana. Zgodne z sekcją A4 P1.13.
2. **Korekta A4 / sekcja D:** K3 (`main.ts:17507`) ma jawne `case` dla **wszystkich 15** wariantów, nie „etykiety z default” — stara formuła w A4 jest zawężona.
3. **Korekta numeracji:** `main.ts:1038` / `main.ts:1994` to nie switche na `ProposalActionId` (patrz wyżej). Właściwe: `game/diplomacy-proposals.ts:1038` / `:1994`.
4. **Switche na `actionId` typu string (poza `ProposalActionId`):** `game/diplomacy-locks.ts:195`, `ui/diplomacyNegotiationModal.ts:368`, `ui/diplomacyTradeBasket.ts:618/:952/:1144`, `main.ts:21288` — switchują na **id przycisków audiencji `'2'`–`'15'`**, nie na `ProposalActionId`; nie są częścią pokrycia 15 wariantów (ich pokrycie id `'2'`–`'15'` zostało opisane w sekcji A7).
5. **Zakres nieobjęty tą rundą:** nie zweryfikowano bramek `previewNegotiationEntry` przed :17267 ani pełnego downstreamu K5 dla `wchloniecie`; `game/diplomacy-rejection-cooldown.ts` i `diplomacy-acceptance-points.ts` (funkcje z parametrem `actionId`, :357, :678, :696) tylko wymienione, bez przejścia wariantów.

### E4. Wniosek dla P2.5

Kontrakt komend frontend→Rust musi obejmować `wchloniecie` w ścieżce `resolvePlayerAcceptsAiPending` (K2), a nie tylko w `evaluateProposal` (K1). Jedyna twarda luka istniejąca statycznie to **K2 × `wchloniecie`**. Pozostałe 14 wariantów × K1/K2/K3 = OBSŁUŻONE WSZĘDZIE (dowód: cytaty w E2).
